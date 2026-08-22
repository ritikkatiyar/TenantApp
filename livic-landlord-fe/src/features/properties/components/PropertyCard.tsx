import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Theme } from '@/src/theme/Theme';
import { useAppTheme } from '@/src/theme/ThemeContext';
import Building3DView from '@/src/features/properties/components/Building3DView';
import type { PropertyResponse } from '@/src/types/property';

interface PropertyCardProps {
  item: PropertyResponse;
  isDesktop: boolean;
  accessToken: string | null;
  resetRotationTrigger: number;
  handleFloorClick: (propertyId: string, floorNum: number) => void;
  triggerReset: (propertyId: string) => void;
  handleDeleteProperty: (propertyId: string, propertyName: string) => void;
  togglePropertyActive: (id: string, active: boolean) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  setSelectedPropertyForBroadcast: (property: PropertyResponse) => void;
}

export function PropertyCard({
  item,
  isDesktop,
  accessToken,
  resetRotationTrigger,
  handleFloorClick,
  triggerReset,
  handleDeleteProperty,
  togglePropertyActive,
  showToast,
  setSelectedPropertyForBroadcast
}: PropertyCardProps) {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  if (isDesktop) {
    return (
      <View style={[styles.propertyCard, styles.propertyCardDesktop]}>
        <BlurView intensity={isDark ? 80 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.cardBlurBackground, { backgroundColor: theme.Colors.glassFill }]} />
        <View style={styles.desktopCardRow}>
          {/* Left Side: 3D Building Preview */}
          <View style={styles.desktopCardLeft}>
            <View style={[styles.buildingPreviewContainer, styles.buildingPreviewContainerDesktop, item.isActive === false && { opacity: 0.65 }]}>
              <View style={{ transform: [{ translateY: -30 }], width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
                {accessToken && (
                  <Building3DView 
                    propertyId={item.id} 
                    token={accessToken} 
                    onFloorClick={(floorNum) => handleFloorClick(item.id, floorNum)} 
                    resetRotationTrigger={resetRotationTrigger}
                    maxContainerHeight={380}
                  />
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.resetButtonOverlay}
                onPress={() => triggerReset(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="3d-rotation" size={18} color={theme.Colors.primary} />
              </TouchableOpacity>
              
              <View style={[styles.statusPillOverlay, item.isActive === false && { backgroundColor: theme.Colors.errorContainer }]}>
                <Text style={[styles.statusPillText, item.isActive === false && { color: theme.Colors.error }]}>
                  {item.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.deleteButtonOverlay}
                onPress={() => handleDeleteProperty(item.id, item.name)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="delete-outline" size={20} color={theme.Colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Right Side: Info, Metrics, Actions */}
          <View style={styles.desktopCardRight}>
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyName}>{item.name}</Text>
              <View style={styles.addressContainer}>
                <MaterialIcons name="location-on" size={14} color={theme.Colors.onSurfaceVariant} />
                <Text style={styles.propertyAddress}>{item.address}, {item.city}</Text>
              </View>
            </View>

            <View style={styles.desktopMetricsContainer}>
              <BlurView intensity={isDark ? 70 : 65} tint={isDark ? 'dark' : 'light'} style={[styles.desktopMetricRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'transparent' }]}>
                <Text style={styles.propertyMetricLabel}>STATUS</Text>
                <Text style={[styles.desktopMetricValue, styles.propertyMetricAccent]}>READY</Text>
              </BlurView>
              <BlurView intensity={isDark ? 70 : 65} tint={isDark ? 'dark' : 'light'} style={[styles.desktopMetricRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'transparent' }]}>
                <Text style={styles.propertyMetricLabel}>FLOORS</Text>
                <Text style={styles.desktopMetricValue}>{item.totalFloors ?? '-'}</Text>
              </BlurView>
              <BlurView intensity={isDark ? 70 : 65} tint={isDark ? 'dark' : 'light'} style={[styles.desktopMetricRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'transparent' }]}>
                <Text style={styles.propertyMetricLabel}>PROPERTY LIFE CYCLE</Text>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      const nextState = item.isActive === false;
                      await togglePropertyActive(item.id, nextState);
                      showToast(nextState ? `Property "${item.name}" activated!` : `Property "${item.name}" deactivated!`, 'success');
                    } catch (error: any) {
                      showToast(error.message || 'Failed to toggle status', 'error');
                    }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.desktopMetricValue, { color: item.isActive === false ? theme.Colors.error : theme.Colors.primary, fontWeight: '800' }]}>
                    {item.isActive === false ? 'DEACTIVATED' : 'ACTIVE'}
                  </Text>
                  <MaterialIcons 
                    name={item.isActive === false ? "toggle-off" : "toggle-on"} 
                    size={32} 
                    color={item.isActive === false ? theme.Colors.outlineVariant : theme.Colors.primary} 
                  />
                </TouchableOpacity>
              </BlurView>
            </View>

            <View style={styles.desktopCardActions}>
              <TouchableOpacity 
                activeOpacity={0.8} 
                style={[styles.manageButtonWrapper, styles.manageButtonWrapperDesktop]}
                onPress={() => router.push(`/properties/${item.id}`)}
              >
                <LinearGradient
                  colors={['#00d4ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.manageButton}
                >
                  <Text style={styles.manageButtonText}>MANAGE</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={theme.Colors.surfaceContainerLowest} />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.broadcastButtonWrapper, styles.broadcastButtonWrapperDesktop]}
                onPress={() => {
                  setSelectedPropertyForBroadcast(item);
                }}
              >
                <View style={styles.broadcastButton}>
                  <MaterialIcons name="campaign" size={16} color={theme.Colors.primary} />
                  <Text style={styles.broadcastButtonText}>Broadcast Notice</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.propertyCard, item.isActive === false && { opacity: 0.85 }]}>
      <BlurView intensity={60} tint="light" style={styles.cardBlurBackground} />
      <View style={[styles.buildingPreviewContainer, styles.buildingPreviewContainerMobile, item.isActive === false && { opacity: 0.65 }]}>
        {accessToken && (
          <Building3DView 
            propertyId={item.id} 
            token={accessToken} 
            onFloorClick={(floorNum) => handleFloorClick(item.id, floorNum)} 
            resetRotationTrigger={resetRotationTrigger}
            maxContainerHeight={280}
          />
        )}
        
        <TouchableOpacity 
          style={styles.resetButtonOverlay}
          onPress={() => triggerReset(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="3d-rotation" size={18} color={theme.Colors.primary} />
        </TouchableOpacity>
        
        <View style={[styles.statusPillOverlay, item.isActive === false && { backgroundColor: 'rgba(186, 26, 26, 0.25)' }]}>
          <Text style={[styles.statusPillText, item.isActive === false && { color: theme.Colors.error }]}>
            {item.isActive === false ? 'INACTIVE' : 'ACTIVE'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.deleteButtonOverlay, { right: 60 }]}
          onPress={async () => {
            try {
              const nextState = item.isActive === false;
              await togglePropertyActive(item.id, nextState);
              showToast(nextState ? `Property "${item.name}" activated!` : `Property "${item.name}" deactivated!`, 'success');
            } catch (error: any) {
              showToast(error.message || 'Failed to toggle status', 'error');
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons 
            name={item.isActive === false ? "toggle-off" : "toggle-on"} 
            size={30} 
            color={item.isActive === false ? "#8b9ea1" : "#006875"} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.deleteButtonOverlay}
          onPress={() => handleDeleteProperty(item.id, item.name)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="delete-outline" size={20} color={theme.Colors.error} />
        </TouchableOpacity>
      </View>

      <View style={[styles.propertyHeaderRow, styles.propertyHeaderRowMobile]}>
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName}>{item.name}</Text>
          <View style={styles.addressContainer}>
            <MaterialIcons name="location-on" size={14} color={theme.Colors.onSurfaceVariant} />
            <Text style={styles.propertyAddress}>{item.address}, {item.city}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.propertyMetrics, styles.propertyMetricsMobile]}>
        <BlurView intensity={65} tint="light" style={styles.propertyMetric}>
          <Text style={styles.propertyMetricLabel}>FLOORS</Text>
          <Text style={styles.propertyMetricValue}>{item.totalFloors ?? '-'}</Text>
        </BlurView>
        <BlurView intensity={65} tint="light" style={styles.propertyMetric}>
          <Text style={styles.propertyMetricLabel}>STATUS</Text>
          <Text style={[styles.propertyMetricValue, styles.propertyMetricAccent]}>READY</Text>
        </BlurView>
      </View>
      
      <TouchableOpacity 
        activeOpacity={0.8} 
        style={[styles.manageButtonWrapper, styles.manageButtonWrapperMobile]}
        onPress={() => router.push(`/properties/${item.id}`)}
      >
        <LinearGradient
          colors={['#00d4ff', '#0072ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.manageButton}
        >
          <Text style={styles.manageButtonText}>Manage Property</Text>
          <MaterialIcons name="arrow-forward" size={16} color={theme.Colors.surfaceContainerLowest} />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.broadcastButtonWrapper, styles.broadcastButtonWrapperMobile]}
        onPress={() => {
          setSelectedPropertyForBroadcast(item);
        }}
      >
        <View style={styles.broadcastButton}>
          <MaterialIcons name="campaign" size={16} color={theme.Colors.primary} />
          <Text style={styles.broadcastButtonText}>Broadcast Notice</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  propertyCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'visible',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    position: 'relative',
    zIndex: 1,
  },
  cardBlurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1.5,
    borderColor: theme.Surface.border,
  },
  propertyCardDesktop: {
    minHeight: 280,
  },
  desktopCardRow: {
    flexDirection: 'row',
    gap: 24,
  },
  desktopCardLeft: {
    width: 280,
  },
  desktopCardRight: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 16,
  },
  buildingPreviewContainer: {
    backgroundColor: theme.Colors.primaryContainer,
    borderRadius: 16,
    overflow: 'visible',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  buildingPreviewContainerDesktop: {
    height: 232,
    width: '100%',
    overflow: 'visible',
  },
  buildingPreviewContainerMobile: {
    height: 180,
    width: '100%',
    overflow: 'visible',
  },
  resetButtonOverlay: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: theme.Surface.card,
    padding: 8,
    borderRadius: 10,
    zIndex: 10,
  },
  statusPillOverlay: {
    position: 'absolute',
    left: 12,
    top: 12,
    backgroundColor: theme.Colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    zIndex: 10,
  },
  statusPillText: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.primary,
    fontFamily: 'Inter',
  },
  deleteButtonOverlay: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: theme.Surface.card,
    padding: 8,
    borderRadius: 10,
    zIndex: 10,
  },
  propertyInfo: {
    gap: 4,
  },
  propertyName: {
    fontSize: theme.Typography.TitleLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onBackground,
    fontFamily: 'Inter',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyAddress: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  desktopMetricsContainer: {
    gap: 10,
  },
  desktopMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    overflow: 'hidden',
  },
  propertyMetricLabel: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    fontFamily: 'Inter',
  },
  desktopMetricValue: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onBackground,
    fontFamily: 'Inter',
  },
  propertyMetricAccent: {
    color: theme.Colors.primary,
    fontWeight: '800',
  },
  desktopCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  manageButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  manageButtonWrapperDesktop: {
    flex: 1.2,
  },
  manageButtonWrapperMobile: {
    marginTop: 16,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  manageButtonText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  broadcastButtonWrapper: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.Colors.primaryContainer,
    backgroundColor: theme.Colors.glassFill,
    overflow: 'hidden',
  },
  broadcastButtonWrapperDesktop: {
    flex: 1,
  },
  broadcastButtonWrapperMobile: {
    marginTop: 10,
  },
  broadcastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12.5,
  },
  broadcastButtonText: {
    color: theme.Colors.primary,
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  propertyHeaderRow: {
    marginTop: 16,
  },
  propertyHeaderRowMobile: {},
  propertyMetrics: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  propertyMetricsMobile: {},
  propertyMetric: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    alignItems: 'center',
    overflow: 'hidden',
  },
  propertyMetricValue: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '800',
    color: theme.Colors.onBackground,
    marginTop: 4,
    fontFamily: 'Inter',
  },
});
