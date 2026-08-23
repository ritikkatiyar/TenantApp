import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Animated, PanResponder, Platform } from 'react-native';
import { getAllFloorsLayout, UnitResponse } from '@/src/features/properties/api/unit.api';
import { logger } from '@/src/utils/logger';

interface Building3DViewProps {
  propertyId: string;
  token: string;
  onFloorClick?: (floorNum: number) => void;
  resetRotationTrigger?: number;
  maxContainerHeight?: number;
}

export default function Building3DView({ propertyId, token, onFloorClick, resetRotationTrigger, maxContainerHeight = 260 }: Building3DViewProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<View>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number } | null>(null);

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      if (!containerDimensions || Math.abs(containerDimensions.width - width) > 2 || Math.abs(containerDimensions.height - height) > 2) {
        setContainerDimensions({ width, height });
      }
    }
  };

  const rotateZ = useRef(new Animated.Value(-45)).current;
  const rotateX = useRef(new Animated.Value(60)).current;
  const lastRotation = useRef(-45);
  const lastRotationX = useRef(60);

  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const floorElevations = useRef<Record<number, Animated.Value>>({}).current;
  const isDragging = useRef(false);

  const handleMouseMove = (e: any) => {
    if (Platform.OS !== 'web' || !onFloorClick) return;
    if (isDragging.current) {
      if (hoveredFloor !== null) setHoveredFloor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const state = stateRef.current;
    if (!state.floorNumbers.length) return;

    const clickY = e.clientY - rect.top;
    const itemHeight = rect.height / state.floorNumbers.length;
    const idx = Math.floor((rect.height - clickY) / itemHeight);
    const targetFloor = state.floorNumbers[Math.max(0, Math.min(idx, state.floorNumbers.length - 1))];
    if (hoveredFloor !== targetFloor) {
      setHoveredFloor(targetFloor);
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web' && hoveredFloor !== null) {
      setHoveredFloor(null);
    }
  };

  // Group units by floor and calculate bounding box
  let minX = 999, maxX = 0, minY = 999, maxY = 0;
  const floors = units.reduce((acc, unit) => {
    if (unit.gridX < minX) minX = unit.gridX;
    if (unit.gridX + unit.gridWidth - 1 > maxX) maxX = unit.gridX + unit.gridWidth - 1;
    if (unit.gridY < minY) minY = unit.gridY;
    if (unit.gridY + unit.gridHeight - 1 > maxY) maxY = unit.gridY + unit.gridHeight - 1;

    if (!acc[unit.floor]) acc[unit.floor] = [];
    acc[unit.floor].push(unit);
    return acc;
  }, {} as Record<number, UnitResponse[]>);

  const gridW = Math.max(maxX - minX + 1, 1);
  const gridH = Math.max(maxY - minY + 1, 1);

  const floorNumbers = Object.keys(floors).map(Number).sort((a, b) => a - b);
  const numFloors = floorNumbers.length > 0 ? floorNumbers.length : 1;

  floorNumbers.forEach(floorNum => {
    if (!floorElevations[floorNum]) {
      floorElevations[floorNum] = new Animated.Value(0);
    }
  });

  const availableWidth = containerDimensions ? containerDimensions.width - 20 : 280;
  const availableHeight = containerDimensions ? containerDimensions.height : maxContainerHeight;

  const rawIsoWidth = (gridW + gridH) * 0.707;
  let dynamicCellSize = Math.floor(availableWidth / (rawIsoWidth || 1));

  const targetH = availableHeight * 0.95;
  const heightDivisor = (gridW + gridH) * 0.5 + (numFloors - 1) * 3.2;
  const maxCellSizeHeight = Math.floor((targetH - 10) / (heightDivisor || 1));

  dynamicCellSize = Math.min(dynamicCellSize, maxCellSizeHeight);

  if (dynamicCellSize > 35) dynamicCellSize = 35;
  if (dynamicCellSize < 12) dynamicCellSize = 12;

  const dynamicFloorHeight = dynamicCellSize * 3.5;
  const buildingWidth = gridW * dynamicCellSize;
  const buildingHeight = gridH * dynamicCellSize;
  const minFloor = floorNumbers.length > 0 ? floorNumbers[0] : 1;
  const stackHeightOffset = (floorNumbers.length > 0 ? floorNumbers.length - 1 : 0) * dynamicFloorHeight;

  const visualIsoHeight = (gridW + gridH) * dynamicCellSize * 0.5;
  const containerHeight = visualIsoHeight + stackHeightOffset;

  const stateRef = useRef({
    floorNumbers,
    minFloor,
    dynamicFloorHeight,
    stackHeightOffset,
    buildingHeight,
    visualIsoHeight,
    containerHeight,
    onFloorClick,
    buildingWidth,
  });

  useEffect(() => {
    stateRef.current = {
      floorNumbers,
      minFloor,
      dynamicFloorHeight,
      stackHeightOffset,
      buildingHeight,
      visualIsoHeight,
      containerHeight,
      onFloorClick,
      buildingWidth,
    };
  });

  useEffect(() => {
    const animations = Object.keys(floorElevations).map((fKey) => {
      const fNum = Number(fKey);
      const toValue = fNum === hoveredFloor ? -14 : 0;
      return Animated.spring(floorElevations[fNum], {
        toValue,
        useNativeDriver: false,
        friction: 6,
        tension: 50,
      });
    });
    Animated.parallel(animations).start();
  }, [hoveredFloor]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,
      onPanResponderGrant: () => {
        isDragging.current = true;
        rotateZ.stopAnimation();
        rotateX.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        const newRotZ = lastRotation.current - gestureState.dx * 0.5;
        let newRotX = lastRotationX.current - gestureState.dy * 0.5;
        if (newRotX < 20) newRotX = 20;
        if (newRotX > 80) newRotX = 80;

        rotateZ.setValue(newRotZ);
        rotateX.setValue(newRotX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        isDragging.current = false;
        setHoveredFloor(null);

        lastRotation.current -= gestureState.dx * 0.5;
        let newRotX = lastRotationX.current - gestureState.dy * 0.5;
        if (newRotX < 20) newRotX = 20;
        if (newRotX > 80) newRotX = 80;
        lastRotationX.current = newRotX;

        // Tap handling for floor click
        if (Math.abs(gestureState.dx) < 6 && Math.abs(gestureState.dy) < 6) {
          const state = stateRef.current;
          if (state.onFloorClick && state.floorNumbers.length > 0) {
            const targetFloor = hoveredFloor ?? state.floorNumbers[0];
            logger.debug('[Building3DView] Tap detected on floor:', targetFloor);
            state.onFloorClick(targetFloor);
          }
        }
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        setHoveredFloor(null);
      },
    })
  ).current;

  const spin = rotateZ.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  const tilt = rotateX.interpolate({
    inputRange: [0, 90],
    outputRange: ['0deg', '90deg'],
  });

  useEffect(() => {
    let isMounted = true;
    const fetchLayouts = async () => {
      try {
        const layout = await getAllFloorsLayout(propertyId, token);
        if (isMounted) {
          setUnits(layout);
        }
      } catch (error) {
        logger.error('Failed to fetch layouts for 3D building:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLayouts();
    return () => {
      isMounted = false;
    };
  }, [propertyId, token]);

  const handleResetRotation = () => {
    lastRotation.current = -45;
    lastRotationX.current = 60;
    Animated.parallel([
      Animated.timing(rotateZ, {
        toValue: -45,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(rotateX, {
        toValue: 60,
        duration: 400,
        useNativeDriver: false,
      })
    ]).start();
  };

  useEffect(() => {
    if (resetRotationTrigger !== undefined && resetRotationTrigger > 0) {
      handleResetRotation();
    }
  }, [resetRotationTrigger]);

  const webMouseProps = Platform.OS === 'web' ? {
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  } : {};

  return (
    <View 
      onLayout={handleLayout}
      style={{ position: 'relative', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', minHeight: maxContainerHeight, overflow: 'visible' }}
      {...(webMouseProps as any)}
    >
      {loading || !containerDimensions ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#00e5ff" />
        </View>
      ) : !units || units.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Layout</Text>
        </View>
      ) : (
        <>
          {/* Glassmorphic Occupancy Status Legend Badge */}
          <View style={styles.legendContainer} pointerEvents="none">
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.Colors.primary }]} />
              <Text style={styles.legendText}>Vacant</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.Colors.tertiary }]} />
              <Text style={styles.legendText}>Partial</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.Colors.error }]} />
              <Text style={styles.legendText}>Occupied</Text>
            </View>
          </View>

          <View 
            ref={containerRef}
            style={[
              styles.container, 
              { 
                width: buildingWidth + 40,
                height: containerHeight
              }
            ]}
            {...panResponder.panHandlers}
          >
            {floorNumbers.map((floorNum) => {
              const elevationAnim = floorElevations[floorNum] || new Animated.Value(0);
              const baseTranslateY = -(floorNum - minFloor) * dynamicFloorHeight + stackHeightOffset / 2 - 10;
              const isHovered = floorNum === hoveredFloor;
              
              return (
                <Animated.View
                  key={`floor-${floorNum}`}
                  style={{
                    position: 'absolute',
                    zIndex: floorNum,
                    transform: [
                      { translateY: Animated.add(baseTranslateY, elevationAnim) },
                    ],
                  }}
                >
                  {/* 3D Slab Thickness Extrusion (layer stacking) */}
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Animated.View
                      key={`floor-slab-extrusion-${floorNum}-${idx}`}
                      style={[
                        styles.isometricWrapper,
                        styles.slabExtrusion,
                        {
                          position: 'absolute',
                          zIndex: -1 - idx,
                          width: buildingWidth,
                          height: buildingHeight,
                          transform: [{ rotateX: tilt }, { rotateZ: spin }],
                          top: (idx + 1) * 1.5,
                          opacity: 0.9 - idx * 0.15,
                          backgroundColor: isHovered ? (isDark ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 104, 117, 0.35)') : (isDark ? 'rgba(0, 229, 255, 0.15)' : 'rgba(0, 104, 117, 0.15)'),
                          borderColor: isHovered ? theme.Colors.primary : theme.Colors.glassStroke,
                        }
                      ]}
                    />
                  ))}

                  {/* Main Floor Plate & Units */}
                  <Animated.View 
                    style={[
                      styles.isometricWrapper, 
                      { 
                        width: buildingWidth,
                        height: buildingHeight,
                        transform: [{ rotateX: tilt }, { rotateZ: spin }] 
                      }
                    ]}
                  >
                    <View style={styles.floorLayer}>
                      {floors[floorNum].map((unit) => {
                        const left = (unit.gridX - minX) * dynamicCellSize;
                        const top = (unit.gridY - minY) * dynamicCellSize;
                        const width = unit.gridWidth * dynamicCellSize;
                        const height = unit.gridHeight * dynamicCellSize;

                        const activeCount = unit.activeLeases ? unit.activeLeases.length : 0;
                        const capacity = unit.capacity || 1;
                        
                        let unitBackgroundColor = '';
                        let unitBorderColor = '';

                        if (activeCount === 0) {
                          // VACANT: Primary Brand Color
                          unitBackgroundColor = isHovered ? theme.Colors.primary : theme.Colors.primaryContainer;
                          unitBorderColor = isHovered ? theme.Colors.surfaceContainerLowest : theme.Colors.primary;
                        } else if (activeCount < capacity) {
                          // PARTIAL: Tertiary Warning Color
                          unitBackgroundColor = isHovered ? theme.Colors.tertiaryFixedDim : theme.Colors.tertiaryContainer;
                          unitBorderColor = isHovered ? theme.Colors.surfaceContainerLowest : theme.Colors.tertiary;
                        } else {
                          // OCCUPIED: Error Color
                          unitBackgroundColor = isHovered ? theme.Colors.error : theme.Colors.errorContainer;
                          unitBorderColor = isHovered ? theme.Colors.surfaceContainerLowest : theme.Colors.error;
                        }

                        return (
                          <View
                            key={unit.id}
                            style={[
                              styles.unitBlock,
                              { left, top, width, height, backgroundColor: unitBackgroundColor, borderColor: unitBorderColor, borderWidth: 1.5 }
                            ]}
                          />
                        );
                      })}
                    </View>
                  </Animated.View>
                </Animated.View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    ...Platform.select({
      web: {
        touchAction: 'none',
        userSelect: 'none',
      }
    }) as any,
  },
  loadingContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: theme.Colors.onSurfaceVariant,
    fontSize: theme.Typography.labelSmall.fontSize,
  },
  isometricWrapper: {
    // Width and height are set dynamically inline
  },
  floorLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 5,
  },
  unitBlock: {
    position: 'absolute',
    borderWidth: 0.5,
    borderRadius: 1,
  },
  slabExtrusion: {
    backgroundColor: 'rgba(0, 60, 70, 0.4)',
    borderColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 2,
  },
  legendContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
    zIndex: 20,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
  },
});
