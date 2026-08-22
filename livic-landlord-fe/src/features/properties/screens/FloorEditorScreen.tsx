import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
  Keyboard,
  ScrollView as RNScrollView,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInUp, 
  FadeOutDown,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';
import { Href, useRouter } from 'expo-router';
import { GestureHandlerRootView, GestureDetector } from 'react-native-gesture-handler';

import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { logger } from '@/src/utils/logger';
import { formatErrorMessage } from '@/src/utils/errors';
import { getFloorLayout, UnitResponse } from '@/src/features/properties/api/unit.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useAppTheme } from '@/src/theme/ThemeContext';

// Phase 4 modular hook & component imports
import { useFloorEditorGestures } from '@/src/features/properties/hooks/useFloorEditorGestures';
import { useFloorEditorTenantAssignment } from '@/src/features/properties/hooks/useFloorEditorTenantAssignment';
import { EditorGrid } from '@/src/features/properties/components/floor-editor/EditorGrid';
import { EditorToolbar } from '@/src/features/properties/components/floor-editor/EditorToolbar';
import { TypeSelectionModal } from '@/src/features/properties/components/floor-editor/TypeSelectionModal';
import { useFloorEditorLayoutApi } from '@/src/features/properties/hooks/useFloorEditorLayoutApi';
import { FloorEditorDetailCard } from '@/src/features/properties/components/floor-editor/FloorEditorDetailCard';
import { createStyles } from './FloorEditorScreen.styles';

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
  id: string; 
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  unitNumber: string;
  rent?: string;
  tenants?: string[];
  activeLeaseId?: string;
  tenantUserId?: string;
  tenantPhone?: string | null;
  status?: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
  capacity?: number;
  activeLeases?: any[];
  type?: string;
}

export default function FloorEditorScreen({
  propertyId,
  floorNumber,
  userToken,
  onBack,
  onSave
}: FloorEditorScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [typeSelectionModalVisible, setTypeSelectionModalVisible] = useState(false);
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);
  const [pendingBlockNum, setPendingBlockNum] = useState<string>('');
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = windowWidth >= 900;
  const router = useRouter();

  const [activeTool, setActiveTool] = useState<ToolType>('PAN');
  const [blocks, setBlocks] = useState<UnitBlock[]>([]);
  const [nextUnitIndex, setNextUnitIndex] = useState(1);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [currentDrawBlock, setCurrentDrawBlock] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
  const drawBlockRef = useRef<{ startX: number, startY: number, endX: number, endY: number } | null>(null);

  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);
  const sheetScrollRef = useRef<RNScrollView | null>(null);
  const desktopGridWrapperRef = useRef<any>(null);
  const mobileGridWrapperRef = useRef<any>(null);

  // Scroll Indicator Dynamic Visibility Refs & State
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollContentWidth = useRef(0);
  const scrollLayoutWidth = useRef(0);

  const updateArrowVisibility = (scrollX: number) => {
    const canScroll = scrollContentWidth.current > scrollLayoutWidth.current;
    const isAtEnd = scrollX + scrollLayoutWidth.current >= scrollContentWidth.current - 15;
    setShowRightArrow(canScroll && !isAtEnd);
  };

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    scrollLayoutWidth.current = event.nativeEvent.layoutMeasurement.width;
    scrollContentWidth.current = event.nativeEvent.contentSize.width;
    updateArrowVisibility(scrollX);
  };

  const handleScrollLayout = (event: any) => {
    scrollLayoutWidth.current = event.nativeEvent.layout.width;
    updateArrowVisibility(0);
  };

  const handleScrollContentSizeChange = (w: number) => {
    scrollContentWidth.current = w;
    updateArrowVisibility(0);
  };

  const gridWidth = GRID_SIZE_X * CELL_SIZE;
  const gridHeight = GRID_SIZE_Y * CELL_SIZE;

  const { height } = Dimensions.get('window');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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
        const newBlockId = `${minX}-${minY}-${Date.now()}`;
        const newBlock: UnitBlock = {
          id: newBlockId,
          gridX: minX,
          gridY: minY,
          gridWidth: w,
          gridHeight: h,
          unitNumber: newUnitNum,
          capacity: 2,
          type: 'ONE_BHK'
        };

        setPendingBlockId(newBlockId);
        setPendingBlockNum(newUnitNum);
        setTypeSelectionModalVisible(true);

        setNextUnitIndex(prev => prev + 1);
        return [...prevBlocks, newBlock];
      });

      drawBlockRef.current = null;
      setCurrentDrawBlock(null);
    }
  };

  const selectedBlock = blocks.find(b => b.id === selectedUnitId) || null;

  const updateUnitDetails = (id: string, updates: Partial<UnitBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  // API Layout hook (loading/saving layout)
  const {
    loading,
    saving,
    handleSave,
    handleRemoveTenant
  } = useFloorEditorLayoutApi({
    propertyId,
    floorNumber,
    userToken,
    onSave,
    blocks,
    setBlocks,
    setNextUnitIndex,
    updateUnitDetails,
  });

  // Custom hook: Gestures and animations handling
  const {
    activeGesture,
    animatedGridStyle,
    scale,
  } = useFloorEditorGestures({
    activeTool,
    handleDrawStart,
    handleDrawUpdate,
    handleDrawEnd,
    desktopGridWrapperRef,
    mobileGridWrapperRef,
    loading,
    saving,
    isDesktop,
  });



  const onRemoveTenant = (leaseId: string, tenantName?: string | null) => 
    handleRemoveTenant(selectedBlock, () => setSelectedUnitId(null), leaseId, tenantName);

  // Custom hook: Tenant Assignments handling
  const tenantAssignProps = useFloorEditorTenantAssignment({
    selectedBlock,
    blocks,
    setBlocks,
    setSelectedUnitId,
    updateUnitDetails,
    propertyId,
    floorNumber,
    userToken,
    sheetScrollRef,
    setParentScrollEnabled,
  });

  const handleClearAll = () => {
    Alert.alert('Clear All', 'Are you sure you want to remove all units? This cannot be undone until saved.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => { setBlocks([]); setNextUnitIndex(1); } }
    ]);
  };

  const handleBlockPress = (blockIndex: number) => {
    const block = blocks[blockIndex];
    if (activeTool === 'ERASE') {
      const newBlocks = [...blocks];
      newBlocks.splice(blockIndex, 1);
      setBlocks(newBlocks);
    } else if (activeTool === 'PAN') {
      setSelectedUnitId(block.id);
      tenantAssignProps.resetTenantAssignmentForm();
    }
  };

  const renderSidebarLink = (icon: keyof typeof MaterialIcons.glyphMap, label: string, active = false, route?: Href) => (
    <TouchableOpacity
      key={label}
      style={[styles.sidebarLink, active && styles.sidebarLinkActive]}
      onPress={route ? () => (route === '/command-center' ? onBack() : router.push(route)) : undefined}
      activeOpacity={route ? 0.75 : 1}
    >
      <MaterialIcons name={icon} size={22} color={active ? theme.Colors.primary : theme.Colors.onSurfaceVariant} />
      <Text style={[styles.sidebarLinkText, active && styles.sidebarLinkTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  if (isDesktop) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LinearGradient
          colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.desktopShell}
        >
          {/* Main Workspace */}
          <View style={styles.desktopMain}>
            <DesktopNavBar 
              activeTab="Properties" 
              onBack={onBack} 
              backText="Back to Floor Overview" 
            />

            <View style={[styles.flex, styles.desktopContent]}>
              <View style={[styles.flex, styles.desktopInner]}>
                
                <View style={styles.desktopHeaderRow}>
                  <View style={styles.largeTitleContainer}>
                    <Text style={styles.titleLineDesktop}>Edit Floor {floorNumber} Layout</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.desktopSaveButtonWrapper} 
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#00d4ff', '#0072ff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.desktopSaveButton}
                    >
                      {saving ? (
                        <ActivityIndicator color={theme.Colors.surfaceContainerLowest} />
                      ) : (
                        <>
                          <Text style={styles.desktopSaveButtonText}>Save Layout</Text>
                          <MaterialIcons name="check" size={18} color={theme.Colors.surfaceContainerLowest} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Main Split Layout */}
                <View style={styles.desktopMainContent}>
                  
                  {/* Left Column: Drawing/Grid Canvas */}
                  <View style={styles.desktopCanvasColumn}>
                    <GestureDetector gesture={activeGesture}>
                      <View ref={desktopGridWrapperRef} style={styles.desktopGridWrapper}>
                        {saving ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.Colors.primary} />
                            <Text style={styles.loadingText}>Saving Layout...</Text>
                          </View>
                        ) : loading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.Colors.primary} />
                            <Text style={styles.loadingText}>Loading Layout...</Text>
                          </View>
                        ) : (
                          <>
                            <View style={styles.canvasContainer}>
                              <Animated.View style={[styles.isometricContainer, animatedGridStyle]}>
                                <EditorGrid
                                  blocks={blocks}
                                  selectedUnitId={selectedUnitId}
                                  activeTool={activeTool}
                                  currentDrawBlock={currentDrawBlock}
                                  handleBlockPress={handleBlockPress}
                                />
                              </Animated.View>
                            </View>

                            <EditorToolbar
                              activeTool={activeTool}
                              setActiveTool={setActiveTool}
                              handleClearAll={handleClearAll}
                              isDesktop={true}
                            />
                          </>
                        )}
                      </View>
                    </GestureDetector>
                  </View>

                  {/* Right Column: Selection Details */}
                  <View style={styles.desktopSidebarColumn}>
                    <View style={{ flex: 1 }}>
                      {selectedBlock ? (
                        <BlurView intensity={70} tint="light" style={[styles.desktopCard, { flex: 1 }]}>
                          <RNScrollView 
                            ref={sheetScrollRef}
                            scrollEnabled={parentScrollEnabled}
                            contentContainerStyle={styles.sheetContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                          >
                            <FloorEditorDetailCard
                              selectedBlock={selectedBlock}
                              floorNumber={floorNumber}
                              parentScrollEnabled={parentScrollEnabled}
                              setParentScrollEnabled={setParentScrollEnabled}
                              updateUnitDetails={updateUnitDetails}
                              onRemoveTenant={onRemoveTenant}
                              onClose={() => {
                                setSelectedUnitId(null);
                                tenantAssignProps.resetTenantAssignmentForm();
                              }}
                              tenantAssignProps={tenantAssignProps}
                            />
                          </RNScrollView>
                        </BlurView>
                      ) : (
                        <BlurView intensity={60} tint="light" style={[styles.desktopCard, { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                          <MaterialIcons name="info-outline" size={48} color={theme.Colors.onSurfaceVariant} style={{ marginBottom: 16 }} />
                          <Text style={{ fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '700', color: theme.Colors.onSurface, textAlign: 'center', marginBottom: 8 }}>No Unit Selected</Text>
                          <Text style={{ fontSize: theme.Typography.BodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 }}>
                            Select any unit block in the grid layout to configure unit capacity and assign tenants.
                          </Text>
                        </BlurView>
                      )}
                    </View>
                  </View>
                </View>

              </View>
            </View>
          </View>
        </LinearGradient>

        <TypeSelectionModal
          visible={typeSelectionModalVisible}
          pendingBlockId={pendingBlockId}
          pendingBlockNum={pendingBlockNum}
          onClose={() => {
            setTypeSelectionModalVisible(false);
            setPendingBlockId(null);
          }}
          updateUnitDetails={updateUnitDetails}
          setBlocks={setBlocks}
        />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={theme.Colors.onSurface} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.titleLine}>Edit Floor {floorNumber}</Text>
              <Text style={styles.titleLine}>Layout</Text>
            </View>
          </View>
          
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={saving}
            style={{
              borderRadius: 100,
              overflow: 'hidden',
              shadowColor: theme.Colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <LinearGradient
              colors={['#00d4ff', '#0072ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              {saving ? (
                <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
              ) : (
                <>
                  <Text style={{ color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.BodyMedium.fontSize, fontWeight: '800', letterSpacing: 0.5 }}>Save</Text>
                  <MaterialIcons name="check" size={16} color={theme.Colors.surfaceContainerLowest} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <EditorToolbar
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            handleClearAll={handleClearAll}
            isDesktop={false}
            showRightArrow={showRightArrow}
            handleScroll={handleScroll}
            handleScrollLayout={handleScrollLayout}
            handleScrollContentSizeChange={handleScrollContentSizeChange}
          />

          <GestureDetector gesture={activeGesture}>
            <View ref={mobileGridWrapperRef} style={styles.gridWrapper}>
              {saving ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.Colors.primary} />
                  <Text style={styles.loadingText}>Saving Layout...</Text>
                </View>
              ) : loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.Colors.primary} />
                  <Text style={styles.loadingText}>Loading Layout...</Text>
                </View>
              ) : (
                <View style={styles.canvasContainer}>
                  <Animated.View style={[styles.isometricContainer, animatedGridStyle]}>
                    <EditorGrid
                      blocks={blocks}
                      selectedUnitId={selectedUnitId}
                      activeTool={activeTool}
                      currentDrawBlock={currentDrawBlock}
                      handleBlockPress={handleBlockPress}
                    />
                  </Animated.View>
                </View>
              )}
            </View>
          </GestureDetector>
        </View>

        {selectedBlock && (
          <View style={[StyleSheet.absoluteFillObject, { zIndex: 999, overflow: 'hidden' }]}>
            <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFillObject} />

            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFillObject}
              onPress={() => {
                setSelectedUnitId(null);
                tenantAssignProps.resetTenantAssignmentForm();
              }}
            />

            <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
              <View style={styles.header}>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedUnitId(null);
                    tenantAssignProps.resetTenantAssignmentForm();
                  }}
                  style={styles.backButton}
                >
                  <MaterialIcons name="arrow-back" size={24} color={theme.Colors.onSurface} />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        )}

        {selectedBlock && (() => {
          const bottomPosition = keyboardHeight > 0 ? keyboardHeight + 16 : 80;
          return (
            <Animated.View 
              entering={FadeInUp}
              exiting={FadeOutDown}
              style={[styles.detailSheetWrapper, { bottom: bottomPosition }]}
            >
              <BlurView intensity={95} tint="light" style={styles.detailSheet}>
                <RNScrollView 
                  ref={sheetScrollRef}
                  scrollEnabled={parentScrollEnabled}
                  contentContainerStyle={styles.sheetContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <FloorEditorDetailCard
                    selectedBlock={selectedBlock}
                    floorNumber={floorNumber}
                    parentScrollEnabled={parentScrollEnabled}
                    setParentScrollEnabled={setParentScrollEnabled}
                    updateUnitDetails={updateUnitDetails}
                    onRemoveTenant={onRemoveTenant}
                    onClose={() => {
                      setSelectedUnitId(null);
                      tenantAssignProps.resetTenantAssignmentForm();
                    }}
                    tenantAssignProps={tenantAssignProps}
                  />
                </RNScrollView>
              </BlurView>
            </Animated.View>
          );
        })()}
        </SafeAreaView>
      </LinearGradient>

      <TypeSelectionModal
        visible={typeSelectionModalVisible}
        pendingBlockId={pendingBlockId}
        pendingBlockNum={pendingBlockNum}
        onClose={() => {
          setTypeSelectionModalVisible(false);
          setPendingBlockId(null);
        }}
        updateUnitDetails={updateUnitDetails}
        setBlocks={setBlocks}
      />
    </GestureHandlerRootView>
  );
}

