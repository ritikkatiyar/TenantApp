import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';

const GRID_SIZE_X = 10;
const GRID_SIZE_Y = 15;
const CELL_SIZE = 60;

interface UseFloorEditorGesturesProps {
  activeTool: 'PAN' | 'ADD' | 'ERASE';
  handleDrawStart: (x: number, y: number) => void;
  handleDrawUpdate: (x: number, y: number) => void;
  handleDrawEnd: () => void;
  desktopGridWrapperRef: React.RefObject<any>;
  mobileGridWrapperRef: React.RefObject<any>;
  loading: boolean;
  saving: boolean;
  isDesktop: boolean;
}

export function useFloorEditorGestures({
  activeTool,
  handleDrawStart,
  handleDrawUpdate,
  handleDrawEnd,
  desktopGridWrapperRef,
  mobileGridWrapperRef,
  loading,
  saving,
  isDesktop,
}: UseFloorEditorGesturesProps) {
  // Zoom Animation Values
  const scale = useSharedValue(0.6);
  const savedScale = useSharedValue(0.6);

  // Pan Animation Values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .enabled(activeTool === 'PAN')
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(newScale, 0.2), 3.0);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .enabled(activeTool === 'PAN')
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const isWeb = Platform.OS === 'web';

  const tapGesture = Gesture.Tap()
    .enabled(activeTool === 'ADD')
    .onEnd((e) => {
      const realX = isWeb ? e.x / scale.value : e.x;
      const realY = isWeb ? e.y / scale.value : e.y;
      const x = Math.floor(realX / CELL_SIZE);
      const y = Math.floor(realY / CELL_SIZE);
      if (x >= 0 && x < GRID_SIZE_X && y >= 0 && y < GRID_SIZE_Y) {
        runOnJS(handleDrawStart)(x, y);
        runOnJS(handleDrawEnd)();
      }
    });

  const drawPanGesture = Gesture.Pan()
    .enabled(activeTool === 'ADD')
    .minDistance(5)
    .onBegin((e) => {
      const realX = isWeb ? e.x / scale.value : e.x;
      const realY = isWeb ? e.y / scale.value : e.y;
      const x = Math.floor(realX / CELL_SIZE);
      const y = Math.floor(realY / CELL_SIZE);
      if (x >= 0 && x < GRID_SIZE_X && y >= 0 && y < GRID_SIZE_Y) {
        runOnJS(handleDrawStart)(x, y);
      }
    })
    .onUpdate((e) => {
      const realX = isWeb ? e.x / scale.value : e.x;
      const realY = isWeb ? e.y / scale.value : e.y;
      const x = Math.floor(realX / CELL_SIZE);
      const y = Math.floor(realY / CELL_SIZE);
      if (x >= 0 && x < GRID_SIZE_X && y >= 0 && y < GRID_SIZE_Y) {
        runOnJS(handleDrawUpdate)(x, y);
      }
    })
    .onEnd(() => {
      runOnJS(handleDrawEnd)();
    })
    .onFinalize(() => {
      runOnJS(handleDrawEnd)();
    });

  const drawGesture = Gesture.Race(drawPanGesture, tapGesture);

  const activeGesture = activeTool === 'PAN' ? composedGesture : drawGesture;

  const animatedGridStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateX: withTiming(activeTool === 'PAN' ? '60deg' : '0deg', { duration: 400 }) },
      { rotateZ: withTiming(activeTool === 'PAN' ? '-45deg' : '0deg', { duration: 400 }) },
      { scale: scale.value }
    ],
  }));

  // Zoom & Pan Wheel handler for Desktop Web browsers
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomIntensity = 0.05;
      const delta = -e.deltaY;
      const factor = delta > 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);
      
      const newScale = scale.value * factor;
      scale.value = Math.min(Math.max(newScale, 0.2), 3.0);
      savedScale.value = scale.value;
    };

    const desktopElement = desktopGridWrapperRef.current;
    const mobileElement = mobileGridWrapperRef.current;

    if (desktopElement) {
      desktopElement.addEventListener('wheel', handleWheelEvent, { passive: false });
    }
    if (mobileElement) {
      mobileElement.addEventListener('wheel', handleWheelEvent, { passive: false });
    }

    return () => {
      if (desktopElement) {
        desktopElement.removeEventListener('wheel', handleWheelEvent);
      }
      if (mobileElement) {
        mobileElement.removeEventListener('wheel', handleWheelEvent);
      }
    };
  }, [isDesktop, loading, saving, scale, savedScale, desktopGridWrapperRef, mobileGridWrapperRef]);

  return {
    activeGesture,
    animatedGridStyle,
    scale,
    translateX,
    translateY,
  };
}
