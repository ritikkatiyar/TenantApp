import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity, 
  Modal, 
  ActivityIndicator, 
  Platform, 
  useWindowDimensions, 
  ScrollView as RNScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  FadeInUp,
  FadeOutDown
} from 'react-native-reanimated';

// Hooks & Components
import { useFloorLayoutViewer, UnitBlock } from '../hooks/useFloorLayoutViewer';
import { TenantDetailsSidebar } from './TenantDetailsSidebar';
import { createStyles } from './FloorLayoutViewerModal.styles';

const GRID_SIZE_X = 10;
const GRID_SIZE_Y = 15;
const CELL_SIZE = 60;

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

interface FloorLayoutViewerModalProps {
  visible: boolean;
  propertyId: string;
  floorNumber: number;
  token: string;
  onClose: () => void;
}

export default function FloorLayoutViewerModal({ visible, propertyId, floorNumber, token, onClose }: FloorLayoutViewerModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = windowWidth >= 900;
  
  const {
    blocks,
    loading,
    selectedUnitId,
    setSelectedUnitId,
    tenantPhoneSearch,
    setTenantPhoneSearch,
    tenantSearchResult,
    setTenantSearchResult,
    tenantSearchLoading,
    rentAmount,
    setRentAmount,
    securityDeposit,
    setSecurityDeposit,
    tenantSearchError,
    setSuggestions,
    suggestions,
    suggestionsLoading,
    isCreatingNewTenant,
    setIsCreatingNewTenant,
    newTenantName,
    setNewTenantName,
    newTenantEmail,
    setNewTenantEmail,
    tenantCreating,
    parentScrollEnabled,
    setParentScrollEnabled,
    resetTenantAssignmentForm,
    updateUnitDetails,
    handleSearchTenant,
    handleCreateAndSelectTenant,
    handleAssignTenant,
    handleRemoveTenant,
  } = useFloorLayoutViewer({ visible, propertyId, floorNumber, token });

  const scale = useSharedValue(0.7);
  const savedScale = useSharedValue(0.7);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const desktopGridWrapperRef = useRef<any>(null);
  const sheetScrollRef = useRef<RNScrollView | null>(null);

  // Pinch / Zoom Gestures
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(newScale, 0.3), 3.0);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedGridStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateX: withTiming('60deg', { duration: 400 }) },
      { rotateZ: withTiming('-45deg', { duration: 400 }) },
      { scale: scale.value }
    ],
  }));

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      const zoomIntensity = 0.05;
      const delta = -e.deltaY;
      const factor = delta > 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);
      const newScale = scale.value * factor;
      scale.value = Math.min(Math.max(newScale, 0.3), 3.0);
      savedScale.value = scale.value;
    };

    const desktopElement = desktopGridWrapperRef.current;
    if (desktopElement) {
      desktopElement.addEventListener('wheel', handleWheelEvent, { passive: false });
    }
    return () => {
      if (desktopElement) {
        desktopElement.removeEventListener('wheel', handleWheelEvent);
      }
    };
  }, [visible, scale, savedScale]);

  const getBlockColorStyles = (b: UnitBlock) => {
    const activeCount = b.activeLeases ? b.activeLeases.length : 0;
    const capacity = b.capacity || 1;

    if (activeCount === 0) {
      return {
        backgroundColor: theme.Colors.primary,
        borderColor: theme.Colors.primary,
        textColor: '#ffffff',
        accentColor: '#c8e6c9'
      };
    } else if (activeCount < capacity) {
      return {
        backgroundColor: theme.Colors.secondary,
        borderColor: theme.Colors.secondary,
        textColor: '#ffffff',
        accentColor: '#fff3e0'
      };
    } else {
      return {
        backgroundColor: theme.Colors.error,
        borderColor: theme.Colors.error,
        textColor: '#ffffff',
        accentColor: '#ffcdd2'
      };
    }
  };

  const selectedBlock = blocks.find(b => b.id === selectedUnitId);

  const renderGrid = () => {
    const rows = [];
    for (let y = 0; y < GRID_SIZE_Y; y++) {
      const cols = [];
      for (let x = 0; x < GRID_SIZE_X; x++) {
        const block = blocks.find(b => b.gridX === x && b.gridY === y);

        cols.push(
          <View
            key={`${x}-${y}`}
            style={[
              styles.cell,
              styles.cellEmpty
            ]}
            pointerEvents="box-none"
          >
            {block && (() => {
              const colorStyles = getBlockColorStyles(block);
              const isSelected = selectedUnitId === block.id;
              const activeCount = block.activeLeases ? block.activeLeases.length : 0;
              const cap = block.capacity || 1;
              const isVacant = activeCount === 0;

              return (
                <View
                  style={{
                    position: 'absolute',
                    top: -1, 
                    left: -1, 
                    width: block.gridWidth * CELL_SIZE,
                    height: block.gridHeight * CELL_SIZE,
                    zIndex: isSelected ? 50 : 10,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedUnitId(block.id);
                      resetTenantAssignmentForm();
                    }}
                    style={[
                      styles.cellActive, 
                      { 
                        width: '100%', 
                        height: '100%',
                        backgroundColor: colorStyles.backgroundColor,
                        borderColor: isSelected ? '#00e5ff' : colorStyles.borderColor,
                        borderWidth: isSelected ? 3 : 2,
                        justifyContent: 'space-between',
                        paddingVertical: block.gridHeight >= 2 ? 6 : 2,
                        paddingHorizontal: block.gridWidth >= 2 ? 6 : 2,
                      }
                    ]}
                  >
                    <View style={{ flexDirection: 'column', gap: 1 }}>
                      <Text style={[styles.cellText, { color: colorStyles.textColor }]}>{block.unitNumber}</Text>
                      <Text style={{ fontSize: theme.Typography.LabelSmall.fontSize, fontWeight: '700', color: colorStyles.textColor + 'cc' }}>
                        {UNIT_TYPE_OPTIONS.find(opt => opt.value === block.type)?.label || '1 BHK'}
                      </Text>
                    </View>

                    {(block.gridWidth >= 2 || block.gridHeight >= 2) ? (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'stretch',
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        borderRadius: 6,
                        paddingHorizontal: 5,
                        paddingVertical: 3,
                        gap: 4,
                      }}>
                        <View style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: colorStyles.backgroundColor,
                          borderWidth: 1,
                          borderColor: colorStyles.borderColor,
                        }} />
                        <Text style={{ fontSize: theme.Typography.LabelSmall.fontSize, fontWeight: '800', color: theme.Colors.onSurface }}>
                          {isVacant ? 'OPEN' : `${activeCount}/${cap}`}
                        </Text>
                      </View>
                    ) : (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'center',
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        borderRadius: 4,
                        paddingHorizontal: 4,
                        paddingVertical: 2,
                        gap: 3,
                      }}>
                        <View style={{
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: colorStyles.backgroundColor,
                          borderWidth: 1,
                          borderColor: colorStyles.borderColor,
                        }} />
                        <Text style={{ fontSize: theme.Typography.LabelSmall.fontSize - 4, fontWeight: '800', color: theme.Colors.onSurface }}>
                          {isVacant ? '—' : `${activeCount}/${cap}`}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })()}
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
        width: GRID_SIZE_X * CELL_SIZE, 
        height: GRID_SIZE_Y * CELL_SIZE, 
        backgroundColor: 'rgba(255,255,255,0.01)',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start'
      }}>
        {rows}
      </View>
    );
  };

  const renderDetailsSidebar = () => {
    if (!selectedBlock) return null;
    return (
      <TenantDetailsSidebar
        selectedBlock={selectedBlock}
        floorNumber={floorNumber}
        onClose={() => {
          setSelectedUnitId(null);
          resetTenantAssignmentForm();
        }}
        sheetScrollRef={sheetScrollRef as any}
        isCreatingNewTenant={isCreatingNewTenant}
        setIsCreatingNewTenant={setIsCreatingNewTenant}
        tenantPhoneSearch={tenantPhoneSearch}
        setTenantPhoneSearch={setTenantPhoneSearch}
        newTenantName={newTenantName}
        setNewTenantName={setNewTenantName}
        newTenantEmail={newTenantEmail}
        setNewTenantEmail={setNewTenantEmail}
        tenantSearchError={tenantSearchError}
        tenantCreating={tenantCreating}
        parentScrollEnabled={parentScrollEnabled}
        setParentScrollEnabled={setParentScrollEnabled}
        handleCreateAndSelectTenant={handleCreateAndSelectTenant}
        handleSearchTenant={handleSearchTenant}
        tenantSearchLoading={tenantSearchLoading}
        suggestions={suggestions}
        setSuggestions={setSuggestions}
        setTenantSearchResult={setTenantSearchResult}
        tenantSearchResult={tenantSearchResult}
        rentAmount={rentAmount}
        setRentAmount={setRentAmount}
        securityDeposit={securityDeposit}
        setSecurityDeposit={setSecurityDeposit}
        handleAssignTenant={handleAssignTenant}
        tenantAssigning={tenantCreating}
        handleRemoveTenant={handleRemoveTenant}
        updateUnitDetails={updateUnitDetails}
        isDesktop={isDesktop}
      />
    );
  };

  if (isDesktop) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <BlurView intensity={35} tint="dark" style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.modalContentDesktop]}>
            <LinearGradient
              colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.desktopShell}
            >
              <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.desktopMain}>
                  <View style={styles.desktopHeaderRow}>
                    <View style={styles.largeTitleContainer}>
                      <Text style={styles.titleLineDesktop}>Floor {floorNumber} Layout & Tenants</Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.backButtonDesktop} 
                      onPress={onClose}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.backButtonTextDesktop}>Close View</Text>
                      <MaterialIcons name="close" size={18} color={theme.Colors.onSurface} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.desktopMainContent}>
                    <View style={styles.desktopCanvasColumn}>
                      <GestureDetector gesture={composedGesture}>
                        <View ref={desktopGridWrapperRef} style={styles.desktopGridWrapper}>
                          {loading ? (
                            <View style={styles.loadingContainer}>
                              <ActivityIndicator size="large" color={theme.Colors.primary} />
                              <Text style={styles.loadingText}>Loading Layout...</Text>
                            </View>
                          ) : (
                            <View style={styles.canvasContainer}>
                              <Animated.View style={[styles.isometricContainer, animatedGridStyle]}>
                                <View style={[styles.gridContainer, { width: GRID_SIZE_X * CELL_SIZE, height: GRID_SIZE_Y * CELL_SIZE }]}>
                                  {renderGrid()}
                                </View>
                              </Animated.View>
                            </View>
                          )}
                        </View>
                      </GestureDetector>
                    </View>

                    <View style={styles.desktopSidebarColumn}>
                      <View style={{ flex: 1 }}>
                        {selectedBlock ? (
                          renderDetailsSidebar()
                        ) : (
                          <BlurView intensity={60} tint="light" style={[styles.desktopCard, { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                            <MaterialIcons name="info-outline" size={48} color={theme.Colors.onSurfaceVariant} style={{ marginBottom: 16 }} />
                            <Text style={{ fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '700', color: theme.Colors.onSurface, textAlign: 'center', marginBottom: 8 }}>No Unit Selected</Text>
                            <Text style={{ fontSize: theme.Typography.BodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 }}>
                              Select any unit block in the grid layout to configure leases and manage tenants.
                            </Text>
                          </BlurView>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              </GestureHandlerRootView>
            </LinearGradient>
          </View>
        </BlurView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <BlurView intensity={35} tint="dark" style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          >
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                  <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.Colors.onSurface} />
                  </TouchableOpacity>
                  <View style={styles.titleContainer}>
                    <Text style={styles.titleLine}>Floor {floorNumber}</Text>
                    <Text style={styles.titleLine}>Layout & Tenants</Text>
                  </View>
                </View>

                <GestureDetector gesture={composedGesture}>
                  <View style={styles.gridWrapper}>
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.Colors.primary} />
                        <Text style={styles.loadingText}>Loading Layout...</Text>
                      </View>
                    ) : (
                      <View style={styles.canvasContainer}>
                        <Animated.View style={[styles.isometricContainer, animatedGridStyle]}>
                          <View style={[styles.gridContainer, { width: GRID_SIZE_X * CELL_SIZE, height: GRID_SIZE_Y * CELL_SIZE }]}>
                            {renderGrid()}
                          </View>
                        </Animated.View>
                      </View>
                    )}
                  </View>
                </GestureDetector>

                {!selectedBlock && (
                  <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
                    <TouchableOpacity 
                      activeOpacity={0.8}
                      onPress={onClose}
                      style={styles.saveButton}
                    >
                      <LinearGradient
                        colors={['#00d4ff', '#0072ff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButtonGradient}
                      >
                        <Text style={styles.saveButtonText}>CLOSE VIEW</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedBlock && (
                  <View style={[StyleSheet.absoluteFillObject, { zIndex: 999 }]}>
                    <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFillObject} />

                    <TouchableOpacity
                      activeOpacity={1}
                      style={StyleSheet.absoluteFillObject}
                      onPress={() => {
                        setSelectedUnitId(null);
                        resetTenantAssignmentForm();
                      }}
                    />

                    <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                      <View style={styles.header}>
                        <TouchableOpacity onPress={() => setSelectedUnitId(null)} style={styles.backButton}>
                          <MaterialIcons name="arrow-back" size={24} color={theme.Colors.onSurface} />
                        </TouchableOpacity>
                      </View>
                    </SafeAreaView>
                  </View>
                )}

                {selectedBlock && (() => {
                  return (
                    <Animated.View 
                      entering={FadeInUp}
                      exiting={FadeOutDown}
                      style={[styles.detailSheetWrapper, { bottom: 80 }]}
                    >
                      {renderDetailsSidebar()}
                    </Animated.View>
                  );
                })()}

              </SafeAreaView>
            </GestureHandlerRootView>
          </LinearGradient>
        </View>
      </BlurView>
    </Modal>
  );
}
