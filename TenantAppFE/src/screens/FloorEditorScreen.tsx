import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView, ScrollView, TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS, withTiming } from 'react-native-reanimated';
import { apiRequest } from '../api/client';
import { getFloorLayout } from '../api/unit.api';

const GRID_SIZE_X = 10;
const GRID_SIZE_Y = 15;
const CELL_SIZE = 60;

interface FloorEditorScreenProps {
  propertyId: string;
  floorNumber: number;
  userToken: string;
  onBack: () => void;
  onSave: () => void;
}

type ToolType = 'PAN' | 'ADD' | 'ERASE';

interface UnitBlock {
  id: string; // unique local ID or unit number
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  unitNumber: string;
}

export default function FloorEditorScreen({
  propertyId,
  floorNumber,
  userToken,
  onBack,
  onSave
}: FloorEditorScreenProps) {
  const [activeTool, setActiveTool] = useState<ToolType>('PAN');
  const [blocks, setBlocks] = useState<UnitBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nextUnitIndex, setNextUnitIndex] = useState(1);
  const [currentDrawBlock, setCurrentDrawBlock] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
  const drawBlockRef = useRef<{ startX: number, startY: number, endX: number, endY: number } | null>(null);

  // Zoom Animation Values
  const scale = useSharedValue(0.6);
  const savedScale = useSharedValue(0.6);

  // Pan Animation Values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const gridWidth = GRID_SIZE_X * CELL_SIZE;
  const gridHeight = GRID_SIZE_Y * CELL_SIZE;

  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    translateX.value = (width - gridWidth) / 2;
    translateY.value = (height - gridHeight) / 2;
    savedTranslateX.value = translateX.value;
    savedTranslateY.value = translateY.value;

    fetchLayout();
  }, []);

  const fetchLayout = async () => {
    setLoading(true);
    try {
      const units = await getFloorLayout(propertyId, floorNumber, userToken);
      const mappedBlocks: UnitBlock[] = units.map(u => ({
        id: u.id,
        gridX: u.gridX,
        gridY: u.gridY,
        gridWidth: u.gridWidth,
        gridHeight: u.gridHeight,
        unitNumber: u.unitNumber,
      }));
      setBlocks(mappedBlocks);
      
      let maxIndex = 0;
      const prefix = floorNumber.toString();
      units.forEach(u => {
        if (u.unitNumber.startsWith(prefix)) {
          const suffix = u.unitNumber.substring(prefix.length);
          const num = parseInt(suffix, 10);
          if (!isNaN(num) && num > maxIndex) {
            maxIndex = num;
          }
        }
      });
      setNextUnitIndex(maxIndex + 1);
    } catch (error: any) {
      console.log('No existing layout or error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Drag to Draw Helpers
  const handleDrawStart = (x: number, y: number) => {
    const b = { startX: x, startY: y, endX: x, endY: y };
    drawBlockRef.current = b;
    setCurrentDrawBlock(b);
  };

  const handleDrawUpdate = (x: number, y: number) => {
    if (drawBlockRef.current) {
      const b = { ...drawBlockRef.current, endX: x, endY: y };
      drawBlockRef.current = b;
      setCurrentDrawBlock(b);
    }
  };

  const handleDrawEnd = () => {
    const b = drawBlockRef.current;
    if (b) {
      const minX = Math.min(b.startX, b.endX);
      const minY = Math.min(b.startY, b.endY);
      const w = Math.abs(b.startX - b.endX) + 1;
      const h = Math.abs(b.startY - b.endY) + 1;

      setBlocks(prevBlocks => {
        const overlap = prevBlocks.some(block => 
          minX < block.gridX + block.gridWidth &&
          minX + w > block.gridX &&
          minY < block.gridY + block.gridHeight &&
          minY + h > block.gridY
        );

        if (overlap) {
          Alert.alert('Overlap', 'Units cannot overlap. Please draw in an empty space.');
          return prevBlocks;
        }

        const currentNextIndex = nextUnitIndex; 
        const newUnitNum = `${floorNumber}${(currentNextIndex).toString().padStart(2, '0')}`;
        const newBlock: UnitBlock = {
          id: `${minX}-${minY}-${Date.now()}`,
          gridX: minX,
          gridY: minY,
          gridWidth: w,
          gridHeight: h,
          unitNumber: newUnitNum
        };

        setNextUnitIndex(prev => prev + 1);
        return [...prevBlocks, newBlock];
      });

      drawBlockRef.current = null;
      setCurrentDrawBlock(null);
    }
  };

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

  const tapGesture = Gesture.Tap()
    .enabled(activeTool === 'ADD')
    .onEnd((e) => {
      const x = Math.floor(e.x / CELL_SIZE);
      const y = Math.floor(e.y / CELL_SIZE);
      if (x >= 0 && x < GRID_SIZE_X && y >= 0 && y < GRID_SIZE_Y) {
        runOnJS(handleDrawStart)(x, y);
        runOnJS(handleDrawEnd)();
      }
    });

  const drawPanGesture = Gesture.Pan()
    .enabled(activeTool === 'ADD')
    .minDistance(5)
    .onBegin((e) => {
      const x = Math.floor(e.x / CELL_SIZE);
      const y = Math.floor(e.y / CELL_SIZE);
      if (x >= 0 && x < GRID_SIZE_X && y >= 0 && y < GRID_SIZE_Y) {
        runOnJS(handleDrawStart)(x, y);
      }
    })
    .onUpdate((e) => {
      const x = Math.floor(e.x / CELL_SIZE);
      const y = Math.floor(e.y / CELL_SIZE);
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

  // Fetch existing layout if any (mocked for now, or you can implement actual fetch)
  useEffect(() => {
    // In a full implementation, we'd fetch the existing units for this floor here.
    // For now, we start with an empty canvas or mock data.
    setLoading(false);
  }, [propertyId, floorNumber]);

  const handleClearAll = () => {
    Alert.alert('Clear All', 'Are you sure you want to remove all units? This cannot be undone until saved.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => { setBlocks([]); setNextUnitIndex(1); } }
    ]);
  };

  const handleBlockPress = (blockIndex: number) => {
    if (activeTool === 'ERASE') {
      const newBlocks = [...blocks];
      newBlocks.splice(blockIndex, 1);
      setBlocks(newBlocks);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Map local blocks to backend payload
      const payload = blocks.map(b => ({
        unitNumber: b.unitNumber,
        gridX: b.gridX,
        gridY: b.gridY,
        gridWidth: b.gridWidth,
        gridHeight: b.gridHeight,
        type: 'ONE_BHK', // Defaulting for now
        capacity: 2,     // Defaulting
        facing: 'NORTH'  // Defaulting
      }));

      await apiRequest(`/api/v1/properties/${propertyId}/floors/${floorNumber}/layout`, {
        method: 'PUT',
        token: userToken,
        body: JSON.stringify(payload)
      });

      Alert.alert('Success', 'Floor layout saved successfully.', [
        { text: 'OK', onPress: onSave }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save layout.');
    } finally {
      setSaving(false);
    }
  };

  const renderGrid = () => {
    const rows = [];
    let previewBlockState = null;
    if (currentDrawBlock) {
      const minX = Math.min(currentDrawBlock.startX, currentDrawBlock.endX);
      const minY = Math.min(currentDrawBlock.startY, currentDrawBlock.endY);
      const w = Math.abs(currentDrawBlock.startX - currentDrawBlock.endX) + 1;
      const h = Math.abs(currentDrawBlock.startY - currentDrawBlock.endY) + 1;
      previewBlockState = { gridX: minX, gridY: minY, w, h };
    }

    for (let y = 0; y < GRID_SIZE_Y; y++) {
      const cols = [];
      for (let x = 0; x < GRID_SIZE_X; x++) {
        const block = blocks.find(b => b.gridX === x && b.gridY === y);
        const isPreviewStart = previewBlockState && previewBlockState.gridX === x && previewBlockState.gridY === y;

        cols.push(
          <View
            key={`${x}-${y}`}
            style={[
              styles.cell,
              styles.cellEmpty
            ]}
            pointerEvents="box-none"
          >
            {block && (
              <View
                pointerEvents={activeTool === 'ERASE' ? 'auto' : 'none'}
                style={{
                  position: 'absolute',
                  top: -1, 
                  left: -1, 
                  width: block.gridWidth * CELL_SIZE,
                  height: block.gridHeight * CELL_SIZE,
                  zIndex: 10,
                }}
              >
                <GHTouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleBlockPress(blocks.indexOf(block))}
                  style={[styles.cellActive, { width: '100%', height: '100%' }]}
                >
                  <Text style={styles.cellText}>{block.unitNumber}</Text>
                  {(block.gridWidth >= 2 && block.gridHeight >= 2) && (
                    <Text style={styles.cellSubtext}>UNIT</Text>
                  )}
                </GHTouchableOpacity>
              </View>
            )}
            {isPreviewStart && previewBlockState && (
              <View
                pointerEvents="none"
                style={[
                  styles.cellDrawingStart,
                  {
                    position: 'absolute',
                    top: -1,
                    left: -1,
                    width: previewBlockState.w * CELL_SIZE,
                    height: previewBlockState.h * CELL_SIZE,
                    zIndex: 20,
                  }
                ]}
              />
            )}
          </View>
        );
      }
      rows.push(
        <View key={`row-${y}`} style={styles.gridRow} pointerEvents="box-none">
          {cols}
        </View>
      );
    }

    return (
      <View style={{ 
        width: gridWidth, 
        height: gridHeight, 
        backgroundColor: 'rgba(255,255,255,0.01)',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start'
      }}>
        {rows}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#d4f5f9', '#e8f8fb', '#f9ede0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.titleLine}>Edit Floor {floorNumber}</Text>
            <Text style={styles.titleLine}>Layout</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Tools Panel */}
          <View style={styles.toolsPanel}>
            <Text style={styles.toolsTitle}>EDITOR TOOLS</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toolsRow}
            >
              <TouchableOpacity 
                style={[styles.toolButton, activeTool === 'PAN' && styles.toolButtonActive]}
                onPress={() => setActiveTool('PAN')}
              >
                <MaterialIcons name="pan-tool" size={20} color={activeTool === 'PAN' ? '#fff' : '#006875'} />
                <Text style={[styles.toolText, activeTool === 'PAN' && styles.toolTextActive]}>Move</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.toolButton, activeTool === 'ADD' && styles.toolButtonActive]}
                onPress={() => setActiveTool('ADD')}
              >
                <MaterialIcons name="edit" size={20} color={activeTool === 'ADD' ? '#fff' : '#006875'} />
                <Text style={[styles.toolText, activeTool === 'ADD' && styles.toolTextActive]}>Draw</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.toolButton, activeTool === 'ERASE' && styles.toolButtonActive]}
                onPress={() => setActiveTool('ERASE')}
              >
                <MaterialIcons name="layers-clear" size={20} color={activeTool === 'ERASE' ? '#fff' : '#006875'} />
                <Text style={[styles.toolText, activeTool === 'ERASE' && styles.toolTextActive]}>Erase</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.toolButton}
                onPress={handleClearAll}
              >
                <MaterialIcons name="delete-sweep" size={20} color="#e53935" />
                <Text style={[styles.toolText, { color: '#e53935' }]}>Clear</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Grid Area */}
          <GestureDetector gesture={composedGesture}>
            <View style={styles.gridWrapper}>
              {saving ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#006875" />
                  <Text style={styles.loadingText}>Saving Layout...</Text>
                </View>
              ) : loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#006875" />
                  <Text style={styles.loadingText}>Loading Layout...</Text>
                </View>
              ) : (
                <View style={styles.canvasContainer}>
                  <Animated.View style={[styles.isometricContainer, animatedGridStyle]}>
                    <GestureDetector gesture={drawGesture}>
                      <View 
                        style={[styles.gridContainer, { width: gridWidth, height: gridHeight }]}
                        pointerEvents={activeTool === 'PAN' ? 'none' : 'auto'}
                      >
                        {renderGrid()}
                      </View>
                    </GestureDetector>
                  </Animated.View>
                </View>
              )}
            </View>
          </GestureDetector>

          {/* Save Button */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient
              colors={['#00d4ff', '#0072ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>SAVE LAYOUT</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </SafeAreaView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {},
  titleLine: {
    fontSize: 42,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 46,
    letterSpacing: -1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  toolsPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  toolsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7a7d',
    letterSpacing: 1,
    marginBottom: 12,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toolButtonActive: {
    backgroundColor: '#006875',
    borderColor: '#006875',
    shadowOpacity: 0.2,
  },
  toolText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006875',
  },
  toolTextActive: {
    color: '#fff',
  },
  gridWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#006875',
    letterSpacing: 0.5,
  },
  isometricContainer: {
    padding: 100,
  },
  gridContainer: {
    backgroundColor: 'rgba(0, 104, 117, 0.02)',
    borderWidth: 2,
    borderColor: 'rgba(0, 104, 117, 0.1)',
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(0, 104, 117, 0.15)',
  },
  cellEmpty: {
    backgroundColor: 'transparent',
  },
  cellDrawingStart: {
    backgroundColor: 'rgba(0, 104, 117, 0.2)',
    borderColor: '#006875',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  cellActive: {
    borderColor: '#004a54',
    backgroundColor: '#006875',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  cellSubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: '#aee4eb',
    letterSpacing: 1,
    marginTop: 2,
  },
  saveButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  }
});
