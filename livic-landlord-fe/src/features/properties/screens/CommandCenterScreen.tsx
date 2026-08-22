import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
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
import { useRouter } from 'expo-router';

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
import { createStyles } from './CommandCenterScreen.styles';



interface CommandCenterScreenProps {
  onNavigateToCreateProperty: () => void;
  onLogout: () => void;
}

export default function CommandCenterScreen({ onNavigateToCreateProperty, onLogout }: CommandCenterScreenProps) {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { accessToken } = useAuth();
  
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

  const { properties, isLoading, refreshProperties, deleteProperty, togglePropertyActive } = useProperties(debouncedSearchQuery);
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
                <MaterialIcons name="add" size={16} color={theme.Colors.surfaceContainerLowest} />
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
            <MaterialIcons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search portfolio..."
              placeholderTextColor={theme.Colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </BlurView>
          <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={styles.mobileFilterButtonWrapper}>
            <TouchableOpacity style={styles.mobileFilterButton}>
              <MaterialIcons name="filter-list" size={22} color={theme.Colors.primary} />
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
          <MaterialIcons name="add" size={40} color={theme.Colors.onSurfaceVariant} />
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
                  <MaterialIcons name="search" size={22} color={theme.Colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search portfolio..."
                    placeholderTextColor={theme.Colors.onSurfaceVariant}
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

