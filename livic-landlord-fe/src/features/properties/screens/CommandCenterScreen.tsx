import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
  TextInput
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import { Theme } from '@/src/theme/Theme';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import type { PropertyResponse } from '@/src/types/property';
import FloorLayoutViewerModal from '@/src/features/properties/components/FloorLayoutViewerModal';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useToast } from '@/src/components/common/feedback/ToastContext';

// Phase 4 modular hook & component imports
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useCommandCenter } from '@/src/features/properties/hooks/useCommandCenter';
import { PropertyCard } from '@/src/features/properties/components/PropertyCard';
import { BroadcastComposerModal } from '@/src/features/properties/components/BroadcastComposerModal';
import { CommandCenterEmptyState } from '@/src/features/properties/components/CommandCenterEmptyState';

const LUMINOUS_BACKGROUND = ['#d4f5f9', '#e8f8fb', '#e2e0fb'] as const;

interface CommandCenterScreenProps {
  onNavigateToCreateProperty: () => void;
  onLogout: () => void;
}

export default function CommandCenterScreen({ onNavigateToCreateProperty, onLogout }: CommandCenterScreenProps) {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { user, accessToken } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const { properties, isLoading, error, refreshProperties, deleteProperty, togglePropertyActive } = useProperties(debouncedSearchQuery);
  const { showToast } = useToast();
  const { handleScroll: handleNavScroll } = useScrollNav();
  const scrollY = useRef(new Animated.Value(0)).current;

  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const {
    resetTriggers,
    triggerReset,
    layoutViewerPropertyId,
    layoutViewerFloorNumber,
    setLayoutViewerPropertyId,
    setLayoutViewerFloorNumber,
    handleFloorClick,
    selectedPropertyForBroadcast,
    setSelectedPropertyForBroadcast,
    broadcastTitle,
    setBroadcastTitle,
    broadcastContent,
    setBroadcastContent,
    broadcastCategory,
    setBroadcastCategory,
    broadcastSeverity,
    setBroadcastSeverity,
    broadcastTargetType,
    setBroadcastTargetType,
    broadcastTargetValue,
    setBroadcastTargetValue,
    sendingBroadcast,
    handleSendBroadcast,
    handleDeleteProperty,
  } = useCommandCenter({
    accessToken,
    showToast,
    deleteProperty,
    togglePropertyActive
  });


  const headerOpacity = scrollY.interpolate({
    inputRange: [40, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const renderStatCard = (label: string, value: string, icon: keyof typeof MaterialIcons.glyphMap, color = theme.Colors.primary) => (
    <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </BlurView>
  );

  const renderSidebarLink = (icon: keyof typeof MaterialIcons.glyphMap, label: string, active = false, route?: Href) => (
    <TouchableOpacity
      style={[styles.sidebarLink, active && styles.sidebarLinkActive]}
      onPress={route ? () => router.push(route) : undefined}
      activeOpacity={route ? 0.75 : 1}
    >
      <MaterialIcons name={icon} size={22} color={active ? theme.Colors.primary : theme.Colors.onSurfaceVariant} />
      <Text style={[styles.sidebarLinkText, active && styles.sidebarLinkTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderPropertyCard = (item: PropertyResponse) => (
    <PropertyCard
      item={item}
      isDesktop={isDesktop}
      accessToken={accessToken}
      resetRotationTrigger={resetTriggers[item.id] || 0}
      handleFloorClick={handleFloorClick}
      triggerReset={triggerReset}
      handleDeleteProperty={handleDeleteProperty}
      togglePropertyActive={togglePropertyActive}
      showToast={showToast}
      setSelectedPropertyForBroadcast={setSelectedPropertyForBroadcast}
    />
  );

  const renderPropertyItem = ({ item }: { item: PropertyResponse }) => renderPropertyCard(item);

  const ListHeader = () => (
    <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
      {isDesktop && (
        <View style={styles.desktopTitleRow}>
          <Text style={styles.mainTitle}>My Properties</Text>
          {properties.length > 0 && (
            <TouchableOpacity 
              style={styles.headerAddButtonWrapper}
              activeOpacity={0.85}
              onPress={onNavigateToCreateProperty}
            >
              <LinearGradient
                colors={['#00d4ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerAddButton}
              >
                <Text style={styles.headerAddButtonText}>ADD PROPERTY</Text>
                <MaterialIcons name="add" size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
      {isDesktop ? (
        <View style={styles.statsGrid}>
          {renderStatCard('TOTAL ASSETS', String(properties.length), 'real-estate-agent')}
          {renderStatCard('OCCUPANCY', properties.length > 0 ? 'LIVE' : 'NONE', 'trending-up', theme.Colors.primaryContainer)}
          {renderStatCard('REVENUE', 'READY', 'payments', theme.Colors.secondary)}
          {renderStatCard('ALERTS', '00', 'warning', theme.Colors.error)}
        </View>
      ) : (
        <View style={styles.mobileSearchRow}>
          <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={styles.mobileSearchBox}>
            <MaterialIcons name="search" size={18} color="#6b7a7d" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search portfolio..."
              placeholderTextColor="#6b7a7d"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </BlurView>
          <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={styles.mobileFilterButtonWrapper}>
            <TouchableOpacity style={styles.mobileFilterButton}>
              <MaterialIcons name="filter-list" size={22} color="#006875" />
            </TouchableOpacity>
          </BlurView>
        </View>
      )}
    </Animated.View>
  );

  const ListEmptyComponent = () => {
    // Don't show the empty state while the initial fetch is in progress.
    // Without this guard, `properties` is [] for the brief moment the API call
    // is in flight, causing the "Create Property" banner to flash then disappear.
    if (isLoading) return null;
    return <CommandCenterEmptyState onNavigateToCreateProperty={onNavigateToCreateProperty} />;
  };

  const ListFooter = () => (
    properties.length > 0 && !isDesktop ? (
      <TouchableOpacity
        style={styles.addNewCard}
        onPress={onNavigateToCreateProperty}
        activeOpacity={0.7}
      >
        <View style={styles.plusIconWrapper}>
          <MaterialIcons name="add" size={40} color="#6b7a7d" />
        </View>
        <Text style={styles.addNewTitle}>Add New Property</Text>
        <Text style={styles.addNewSubtitle}>Expand your portfolio</Text>
      </TouchableOpacity>
    ) : null
  );

  const DesktopShell = () => (
    <LinearGradient colors={theme.Colors.backgroundGradient as [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <View style={styles.desktopShell}>
        <View style={styles.desktopMain}>
          <DesktopNavBar 
            activeTab="Properties" 
            rightContent={
              <>
                <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={styles.searchBox}>
                  <MaterialIcons name="search" size={22} color="#6b7a7d" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search portfolio..."
                    placeholderTextColor="#6b7a7d"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </BlurView>
                <TouchableOpacity style={styles.topIcon} onPress={() => router.push('/escalations')}><Ionicons name="notifications-outline" size={23} color={theme.Colors.onSurface} /></TouchableOpacity>
              </>
            }
          />

          <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
            <View style={styles.desktopInner}>
              <ListHeader />
              {isLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={theme.Colors.primaryContainer} />
                </View>
              ) : properties.length === 0 ? (
                <ListEmptyComponent />
              ) : (
                <View style={styles.propertyGrid}>
                  {properties.map((property) => (
                    <View key={property.id} style={styles.propertyGridItem}>
                      {renderPropertyCard(property)}
                    </View>
                  ))}
                </View>
              )}

            </View>
          </ScrollView>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <>
      {isDesktop ? DesktopShell() : (
        <LinearGradient
        colors={theme.Colors.backgroundGradient as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={[]}>

          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#00e5ff" />
            </View>
          ) : (
            <Animated.FlatList
              data={properties}
              renderItem={renderPropertyItem}
              keyExtractor={(item: PropertyResponse) => item.id}
              contentContainerStyle={[styles.listContent, { paddingTop: 88 }]}
              ListHeaderComponent={ListHeader}
              ListEmptyComponent={ListEmptyComponent}
              ListFooterComponent={ListFooter}
              showsVerticalScrollIndicator={false}
              refreshing={isLoading}
              onRefresh={refreshProperties}
              onScroll={(e) => {
                handleNavScroll(e);
                Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  { useNativeDriver: false }
                )(e);
              }}
              scrollEventThrottle={16}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
      )}

      {/* Broadcast Notice Composer Modal */}
      <BroadcastComposerModal
        visible={!!selectedPropertyForBroadcast}
        selectedPropertyForBroadcast={selectedPropertyForBroadcast}
        broadcastTitle={broadcastTitle}
        setBroadcastTitle={setBroadcastTitle}
        broadcastContent={broadcastContent}
        setBroadcastContent={setBroadcastContent}
        broadcastCategory={broadcastCategory}
        setBroadcastCategory={setBroadcastCategory}
        broadcastSeverity={broadcastSeverity}
        setBroadcastSeverity={setBroadcastSeverity}
        broadcastTargetType={broadcastTargetType}
        setBroadcastTargetType={setBroadcastTargetType}
        broadcastTargetValue={broadcastTargetValue}
        setBroadcastTargetValue={setBroadcastTargetValue}
        sendingBroadcast={sendingBroadcast}
        handleSendBroadcast={handleSendBroadcast}
        onClose={() => setSelectedPropertyForBroadcast(null)}
      />

      {/* Floor Layout Viewer Modal */}
      {layoutViewerPropertyId !== null && layoutViewerFloorNumber !== null && (
        <FloorLayoutViewerModal
          visible={true}
          propertyId={layoutViewerPropertyId}
          floorNumber={layoutViewerFloorNumber}
          token={accessToken || ''}
          onClose={() => {
            setLayoutViewerPropertyId(null);
            setLayoutViewerFloorNumber(null);
          }}
        />
      )}
    </>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  desktopShell: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    height: '100%',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: theme.Surface.border,
    backgroundColor: theme.Colors.glassFill,
    overflow: 'hidden',
  },
  sidebarBrand: {
    marginBottom: 54,
  },
  sidebarBrandTitle: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    color: theme.Colors.primary,
  },
  sidebarBrandSub: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 4,
  },
  sidebarNav: {
    gap: 14,
  },
  sidebarLink: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 18,
    borderRadius: theme.Rounded.lg,
  },
  sidebarLinkActive: {
    backgroundColor: 'rgba(0, 224, 255, 0.10)',
    borderRightWidth: 4,
    borderRightColor: theme.Colors.primaryContainer,
  },
  sidebarLinkText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: theme.Colors.onSurface,
  },
  sidebarLinkTextActive: {
    color: theme.Colors.primary,
  },
  sidebarFooter: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: theme.Colors.outlineVariant,
    paddingTop: 28,
    gap: 10,
  },
  upgradeButton: {
    borderRadius: theme.Rounded.lg,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: theme.Colors.secondary,
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  upgradeGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  upgradeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  desktopMain: {
    flex: 1,
  },
  topbar: {
    minHeight: 82,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.Surface.border,
    backgroundColor: theme.Colors.glassFill,
    overflow: 'hidden',
  },
  topbarTabs: {
    flexDirection: 'row',
    gap: 34,
    alignItems: 'center',
  },
  topbarTab: {
    fontSize: 18,
    color: theme.Colors.onSurface,
  },
  topbarTabActive: {
    color: theme.Colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: theme.Colors.primaryContainer,
    paddingBottom: 8,
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  searchBox: {
    width: 320,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    backgroundColor: theme.Colors.glassFill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  searchPlaceholder: {
    fontSize: 15,
    color: theme.Colors.onSurfaceVariant,
  },
  topIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    borderColor: theme.Colors.primaryContainer,
    backgroundColor: theme.Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  desktopContent: {
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 32,
  },
  desktopInner: {
    width: '100%',
    maxWidth: 1220,
    alignSelf: 'center',
  },
  propertyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 34,
    alignItems: 'stretch',
  },
  propertyGridItem: {
    width: '100%',
  },
  desktopFooter: {
    marginTop: 70,
    paddingTop: 26,
    borderTopWidth: 1,
    borderTopColor: theme.Surface.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 42,
  },
  footerBrand: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.Colors.primary,
    marginRight: 22,
  },
  footerLink: {
    fontSize: 12,
    letterSpacing: 1.3,
    color: theme.Colors.onSurface,
  },
  footerCopy: {
    marginLeft: 'auto',
    color: theme.Colors.outline,
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  mobileHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  mobileBrand: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.Colors.primary,
  },
  mobileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.Colors.inverseSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.Colors.primaryContainer,
  },
  mobileAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.Colors.primary,
    letterSpacing: 1,
  },
  compactHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.Colors.onBackground,
  },
  menuButton: {
    padding: 5,
  },
  notificationButton: {
    padding: 5,
    position: 'relative',
  },
  logoutButton: {
    padding: 5,
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 160,
  },
  titleContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  desktopTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  mobileTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerAddButtonWrapper: {
    borderRadius: 19,
    overflow: 'hidden',
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 18,
  },
  headerAddButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  largeTitleContainer: {
    marginBottom: 20,
  },
  titleLine: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.Colors.onBackground,
    lineHeight: 52,
    letterSpacing: -1,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    color: theme.Colors.onBackground,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 6,
    maxWidth: 620,
  },
  mobileSearchRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 30,
  },
  mobileSearchBox: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    backgroundColor: theme.Colors.glassFill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  mobileSearchText: {
    fontSize: 15,
    color: theme.Colors.onSurfaceVariant,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: theme.Colors.onBackground,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    outlineWidth: 0,
  },
  mobileFilterButtonWrapper: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    backgroundColor: theme.Colors.glassFill,
    overflow: 'hidden',
  },
  mobileFilterButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minHeight: 86,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: theme.Colors.glassStroke,
    borderRadius: theme.Rounded.xl,
    padding: 14,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  statCardDesktop: {
    minWidth: 210,
    minHeight: 124,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 22,
    paddingHorizontal: 30,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
    letterSpacing: 1,
    color: theme.Colors.onSurfaceVariant,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 31,
    color: theme.Colors.onBackground,
    marginTop: 2,
  },
  propertyCard: {
    backgroundColor: theme.Colors.glassFill,
    borderRadius: theme.Rounded.xl,
    padding: 0,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    overflow: 'hidden',
  },
  propertyCardDesktop: {
    width: '100%',
    minHeight: 440,
    padding: 24,
    borderRadius: theme.Rounded.xl,
  },
  desktopCardRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 30,
  },
  desktopCardLeft: {
    flex: 1.2,
    maxWidth: 450,
  },
  desktopCardRight: {
    flex: 1,
    justifyContent: 'space-between',
  },
  desktopCardActions: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
  },
  desktopMetricsContainer: {
    gap: 10,
    marginTop: 12,
    width: '100%',
  },
  desktopMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.Colors.glassFill,
    borderRadius: theme.Rounded.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    overflow: 'hidden',
  },
  desktopMetricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.Colors.onSurface,
  },
  propertyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  propertyHeaderRowMobile: {
    paddingHorizontal: 24,
    paddingTop: 26,
  },
  propertyHeaderRowDesktop: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  buildingPreviewContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: -10,
    marginBottom: 5,
    position: 'relative',
  },
  buildingPreviewContainerMobile: {
    height: 280,
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: 0,
    backgroundColor: theme.Colors.glassFill,
    borderBottomWidth: 1,
    borderBottomColor: theme.Surface.border,
  },
  buildingPreviewContainerDesktop: {
    height: 380,
    width: '100%',
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: 0,
    backgroundColor: theme.Colors.glassFill,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  deleteButtonOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: theme.Colors.glassFill,
    borderRadius: 999,
    zIndex: 10,
  },
  resetButtonOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    padding: 8,
    backgroundColor: theme.Colors.glassFill,
    borderRadius: 999,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  propertyInfo: {
    marginBottom: 15,
    flex: 1,
    paddingRight: 10,
  },
  statusPillOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 224, 255, 0.18)',
    borderRadius: theme.Rounded.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
    letterSpacing: 1,
    color: theme.Colors.onPrimaryContainer,
  },
  propertyName: {
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 31,
    color: theme.Colors.onBackground,
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: theme.Colors.onSurfaceVariant,
    flexShrink: 1,
  },
  propertyMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  propertyMetricsMobile: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  propertyMetricsDesktop: {
    marginHorizontal: 0,
    marginBottom: 0,
    marginTop: 12,
  },
  propertyMetric: {
    flex: 1,
    backgroundColor: theme.Colors.glassFill,
    borderRadius: theme.Rounded.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    overflow: 'hidden',
  },
  propertyMetricLabel: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
    letterSpacing: 1,
    color: theme.Colors.onSurfaceVariant,
  },
  propertyMetricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.Colors.onSurface,
    marginTop: 4,
  },
  propertyMetricAccent: {
    color: theme.Colors.primary,
  },
  manageButtonWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  manageButtonWrapperMobile: {
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: theme.Colors.primaryContainer,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  manageButtonWrapperDesktop: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  addNewCard: {
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 2,
    borderColor: theme.Surface.border,
    borderStyle: 'dashed',
    borderRadius: theme.Rounded.xl,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  addNewCardDesktop: {
    width: '100%',
    minHeight: 180,
    marginTop: 0,
    backgroundColor: theme.Colors.glassFill,
    borderColor: theme.Surface.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 24,
  },
  plusIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  addNewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.Colors.onBackground,
    marginBottom: 5,
  },
  addNewSubtitle: {
    fontSize: 14,
    color: theme.Colors.onSurfaceVariant,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: theme.Colors.glassFill,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.Surface.border,
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    overflow: 'hidden',
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.Colors.onBackground,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  createPropertyButton: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 25,
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  createPropertyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  createPropertyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  learnMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  learnMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.Colors.primary,
    letterSpacing: 0.5,
  },

  // ─── Broadcast Notice button on property card ───────────────────────────────
  broadcastButtonWrapper: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  broadcastButtonWrapperMobile: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  broadcastButtonWrapperDesktop: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 100,
  },
  broadcastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#006875',
    borderRadius: 100,
    backgroundColor: 'rgba(0, 104, 117, 0.06)',
  },
  broadcastButtonText: {
    color: theme.Colors.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ─── Broadcast Composer Modal ────────────────────────────────────────────────
  composerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  composerSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  composerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#163235',
  },
  composerSubtitle: {
    fontSize: 13,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 3,
  },
  composerScroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  composerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: theme.Colors.onSurfaceVariant,
    marginBottom: 8,
    marginTop: 16,
  },
  composerInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#163235',
    backgroundColor: 'rgba(0, 104, 117, 0.03)',
  },
  composerTextarea: {
    minHeight: 110,
    paddingTop: 14,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 104, 117, 0.25)',
    backgroundColor: 'rgba(0, 104, 117, 0.04)',
    marginRight: 10,
    flexShrink: 0,
  },
  chipActive: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: theme.Colors.primary,
  },
  chipTextActive: {
    color: theme.Colors.onPrimary,
  },
  composerSendBtn: {
    margin: 20,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  composerSendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  composerSendText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});

