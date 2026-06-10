import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  ActivityIndicator,
  FlatList,
  Alert,
  Animated,
  useWindowDimensions,
  Modal,
  TextInput
} from 'react-native';
import { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import { Theme } from '../theme/Theme';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../auth/AuthProvider';
import type { PropertyResponse } from '../types/property';
import Building3DView from '../components/Building3DView';
import { createAnnouncement } from '../api/announcement.api';

const LUMINOUS_BACKGROUND = ['#d4f5f9', '#e8f8fb', '#e2e0fb'] as const;

interface CommandCenterScreenProps {
  onNavigateToCreateProperty: () => void;
  onLogout: () => void;
}

export default function CommandCenterScreen({ onNavigateToCreateProperty, onLogout }: CommandCenterScreenProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { user, accessToken } = useAuth();
  const { properties, isLoading, error, refreshProperties, deleteProperty } = useProperties();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Notice Board Composer State
  const [selectedPropertyForBroadcast, setSelectedPropertyForBroadcast] = useState<PropertyResponse | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState<'GENERAL' | 'MAINTENANCE' | 'EMERGENCY' | 'BILLING' | 'EVENT'>('GENERAL');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('INFO');
  const [broadcastTargetType, setBroadcastTargetType] = useState<'PROPERTY' | 'FLOOR' | 'UNIT'>('PROPERTY');
  const [broadcastTargetValue, setBroadcastTargetValue] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const handleSendBroadcast = async () => {
    console.log('[Broadcast] handleSendBroadcast called');
    console.log('[Broadcast] selectedProperty:', selectedPropertyForBroadcast?.id, 'hasToken:', !!accessToken);
    
    if (!selectedPropertyForBroadcast || !accessToken) {
      console.warn('[Broadcast] Early return: no property or token');
      return;
    }
    
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      console.warn('[Broadcast] Early return: title or content missing');
      Alert.alert('Validation', 'Title and Content are required.');
      return;
    }

    console.log('[Broadcast] Validation passed, starting send...');
    setSendingBroadcast(true);
    try {
      const payload = {
        propertyId: selectedPropertyForBroadcast.id,
        title: broadcastTitle,
        content: broadcastContent,
        category: broadcastCategory,
        severity: broadcastSeverity,
        targetType: broadcastTargetType,
        targetValue: broadcastTargetType !== 'PROPERTY' ? broadcastTargetValue : undefined,
      };
      console.log('[Broadcast] Payload:', payload);
      console.log('[Broadcast] Calling createAnnouncement...');
      
      await createAnnouncement(accessToken, payload);

      console.log('[Broadcast] Success!');
      Alert.alert('Success', 'Announcement broadcasted successfully!');
      
      setBroadcastTitle('');
      setBroadcastContent('');
      setBroadcastCategory('GENERAL');
      setBroadcastSeverity('INFO');
      setBroadcastTargetType('PROPERTY');
      setBroadcastTargetValue('');
      setSelectedPropertyForBroadcast(null);
    } catch (err: any) {
      console.error('[Broadcast] Error:', err);
      Alert.alert('Error', err.message || 'Failed to send broadcast');
    } finally {
      setSendingBroadcast(false);
    }
  };


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

  const renderStatCard = (label: string, value: string, icon: keyof typeof MaterialIcons.glyphMap, color = Theme.Colors.primary) => (
    <BlurView intensity={50} tint="light" style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
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
      <MaterialIcons name={icon} size={22} color={active ? Theme.Colors.primary : Theme.Colors.onSurfaceVariant} />
      <Text style={[styles.sidebarLinkText, active && styles.sidebarLinkTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const handleDeleteProperty = (propertyId: string, propertyName: string) => {
    Alert.alert(
      "Delete Property",
      `Are you sure you want to delete ${propertyName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProperty(propertyId);
            } catch (error) {
              Alert.alert("Delete Failed", (error as Error).message);
            }
          }
        }
      ]
    );
  };

  const renderPropertyCard = (item: PropertyResponse) => {
    if (isDesktop) {
      return (
        <BlurView intensity={60} tint="light" style={[styles.propertyCard, styles.propertyCardDesktop]}>
          <View style={styles.desktopCardRow}>
            {/* Left Side: 3D Building Preview */}
            <View style={styles.desktopCardLeft}>
              <View style={[styles.buildingPreviewContainer, styles.buildingPreviewContainerDesktop]}>
                <View style={{ transform: [{ translateY: -45 }], width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  {accessToken && <Building3DView propertyId={item.id} token={accessToken} />}
                </View>
                
                <View style={styles.statusPillOverlay}>
                  <Text style={styles.statusPillText}>ACTIVE</Text>
                </View>

                <TouchableOpacity 
                  style={styles.deleteButtonOverlay}
                  onPress={() => handleDeleteProperty(item.id, item.name)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="delete-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Side: Info, Metrics, Actions */}
            <View style={styles.desktopCardRight}>
              {/* Header: Name and Address */}
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyName}>{item.name}</Text>
                <View style={styles.addressContainer}>
                  <MaterialIcons name="location-on" size={14} color="#6b7a7d" />
                  <Text style={styles.propertyAddress}>{item.address}, {item.city}</Text>
                </View>
              </View>

              {/* Metrics stacked vertically: Status then Floors */}
              <View style={styles.desktopMetricsContainer}>
                <BlurView intensity={65} tint="light" style={styles.desktopMetricRow}>
                  <Text style={styles.propertyMetricLabel}>STATUS</Text>
                  <Text style={[styles.desktopMetricValue, styles.propertyMetricAccent]}>READY</Text>
                </BlurView>
                <BlurView intensity={65} tint="light" style={styles.desktopMetricRow}>
                  <Text style={styles.propertyMetricLabel}>FLOORS</Text>
                  <Text style={styles.desktopMetricValue}>{item.totalFloors ?? '-'}</Text>
                </BlurView>
              </View>

              {/* Actions: Manage & Broadcast stacked vertically */}
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
                    <MaterialIcons name="arrow-forward" size={16} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.broadcastButtonWrapper, styles.broadcastButtonWrapperDesktop]}
                  onPress={() => {
                    console.log('[Broadcast] Desktop broadcast button pressed for property:', item.id, item.name);
                    setSelectedPropertyForBroadcast(item);
                  }}
                >
                  <View style={styles.broadcastButton}>
                    <MaterialIcons name="campaign" size={16} color="#006875" />
                    <Text style={styles.broadcastButtonText}>Broadcast Notice</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      );
    }

    return (
      <BlurView intensity={60} tint="light" style={styles.propertyCard}>
        <View style={[styles.buildingPreviewContainer, styles.buildingPreviewContainerMobile]}>
          {accessToken && <Building3DView propertyId={item.id} token={accessToken} />}
          
          <View style={styles.statusPillOverlay}>
            <Text style={styles.statusPillText}>ACTIVE</Text>
          </View>

          <TouchableOpacity 
            style={styles.deleteButtonOverlay}
            onPress={() => handleDeleteProperty(item.id, item.name)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="delete-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>

        <View style={[styles.propertyHeaderRow, styles.propertyHeaderRowMobile]}>
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyName}>{item.name}</Text>
            <View style={styles.addressContainer}>
              <MaterialIcons name="location-on" size={14} color="#6b7a7d" />
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
            <MaterialIcons name="arrow-forward" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.broadcastButtonWrapper, styles.broadcastButtonWrapperMobile]}
          onPress={() => {
            console.log('[Broadcast] Mobile broadcast button pressed for property:', item.id, item.name);
            setSelectedPropertyForBroadcast(item);
          }}
        >
          <View style={styles.broadcastButton}>
            <MaterialIcons name="campaign" size={16} color="#006875" />
            <Text style={styles.broadcastButtonText}>Broadcast Notice</Text>
          </View>
        </TouchableOpacity>
      </BlurView>
    );
  };

  const renderPropertyItem = ({ item }: { item: PropertyResponse }) => renderPropertyCard(item);

  const ListHeader = () => (
    <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
      {isDesktop ? (
        <Text style={styles.mainTitle}>My Properties</Text>
      ) : (
        <View style={styles.largeTitleContainer}>
          <Text style={styles.titleLine}>My</Text>
          <Text style={styles.titleLine}>Properties</Text>
        </View>
      )}
      {isDesktop ? (
        <View style={styles.statsGrid}>
          {renderStatCard('TOTAL ASSETS', String(properties.length), 'real-estate-agent')}
          {renderStatCard('OCCUPANCY', properties.length > 0 ? 'LIVE' : 'NONE', 'trending-up', Theme.Colors.primaryContainer)}
          {renderStatCard('REVENUE', 'READY', 'payments', Theme.Colors.secondary)}
          {renderStatCard('ALERTS', '00', 'warning', Theme.Colors.error)}
        </View>
      ) : (
        <View style={styles.mobileSearchRow}>
          <BlurView intensity={50} tint="light" style={styles.mobileSearchBox}>
            <MaterialIcons name="search" size={18} color="#6b7a7d" />
            <Text style={styles.mobileSearchText}>Search portfolio...</Text>
          </BlurView>
          <BlurView intensity={50} tint="light" style={styles.mobileFilterButtonWrapper}>
            <TouchableOpacity style={styles.mobileFilterButton}>
              <MaterialIcons name="filter-list" size={22} color="#006875" />
            </TouchableOpacity>
          </BlurView>
        </View>
      )}
    </Animated.View>
  );

  const ListEmptyComponent = () => (
    <BlurView intensity={40} tint="light" style={styles.emptyCard}>
      <View style={styles.emptyIconCircle}>
        <MaterialIcons name="domain-disabled" size={36} color="#6b7a7d" />
      </View>
      <Text style={styles.emptyTitle}>No properties found.</Text>
      <Text style={styles.emptySubtitle}>
        Start building your portfolio by adding your first property to the command center.
      </Text>
      
      <TouchableOpacity 
        style={styles.createPropertyButton} 
        onPress={onNavigateToCreateProperty}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#00d4ff', '#0072ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.createPropertyGradient}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.createPropertyText}>CREATE PROPERTY</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.learnMoreContainer}>
        <MaterialIcons name="help-outline" size={16} color="#006875" />
        <Text style={styles.learnMoreText}>LEARN ABOUT PROPERTY MANAGEMENT</Text>
      </TouchableOpacity>
    </BlurView>
  );

  const ListFooter = () => (
    properties.length > 0 ? (
      <TouchableOpacity
        style={[styles.addNewCard, isDesktop && styles.addNewCardDesktop]}
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
    <LinearGradient colors={LUMINOUS_BACKGROUND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <View style={styles.desktopShell}>
        <BlurView intensity={70} tint="light" style={styles.sidebar}>
          <View style={styles.sidebarBrand}>
            <Text style={styles.sidebarBrandTitle}>TenantApp</Text>
            <Text style={styles.sidebarBrandSub}>Management Suite</Text>
          </View>
          <View style={styles.sidebarNav}>
            {renderSidebarLink('dashboard', 'Overview', false, '/analytics')}
            {renderSidebarLink('business', 'Portfolio', true, '/command-center')}
            {renderSidebarLink('groups', 'AI Desk', false, '/ai')}
            {renderSidebarLink('build', 'Escalations', false, '/escalations')}
            {renderSidebarLink('campaign', 'Announcements', false, '/announcements')}
            {renderSidebarLink('settings', 'Settings', false, '/expenses')}
          </View>
          <View style={styles.sidebarFooter}>
            <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/billing')} activeOpacity={0.85}>
              <LinearGradient colors={[Theme.Colors.primary, Theme.Colors.secondaryContainer]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upgradeGradient}>
                <Text style={styles.upgradeText}>UPGRADE PLAN</Text>
              </LinearGradient>
            </TouchableOpacity>
            {renderSidebarLink('help-outline', 'Billing Help', false, '/billing')}
            <TouchableOpacity style={styles.sidebarLink} onPress={onLogout}>
              <MaterialIcons name="logout" size={22} color={Theme.Colors.onSurfaceVariant} />
              <Text style={styles.sidebarLinkText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </BlurView>

        <View style={styles.desktopMain}>
          <BlurView intensity={70} tint="light" style={styles.topbar}>
            <View style={styles.topbarTabs}>
              <TouchableOpacity onPress={() => router.push('/analytics')}><Text style={styles.topbarTab}>Dashboard</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/command-center')}><Text style={[styles.topbarTab, styles.topbarTabActive]}>Properties</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/analytics')}><Text style={styles.topbarTab}>Reports</Text></TouchableOpacity>
            </View>
            <View style={styles.topbarRight}>
              <BlurView intensity={50} tint="light" style={styles.searchBox}>
                <MaterialIcons name="search" size={22} color="#6b7a7d" />
                <Text style={styles.searchPlaceholder}>Search portfolio...</Text>
              </BlurView>
              <TouchableOpacity style={styles.topIcon} onPress={() => router.push('/escalations')}><Ionicons name="notifications-outline" size={23} color={Theme.Colors.onSurface} /></TouchableOpacity>
              <TouchableOpacity style={styles.topIcon} onPress={() => router.push('/expenses')}><MaterialIcons name="settings" size={24} color={Theme.Colors.onSurface} /></TouchableOpacity>
              <View style={styles.avatar}><Text style={styles.avatarText}>{user?.fullName?.[0] || 'A'}</Text></View>
            </View>
          </BlurView>

          <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
            <View style={styles.desktopInner}>
              <ListHeader />
              {isLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={Theme.Colors.primaryContainer} />
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
                  <View style={styles.propertyGridItem}>
                    <ListFooter />
                  </View>
                </View>
              )}
              <View style={styles.desktopFooter}>
                <Text style={styles.footerBrand}>TenantApp</Text>
                <TouchableOpacity onPress={() => router.push('/billing')}><Text style={styles.footerLink}>Billing</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/analytics')}><Text style={styles.footerLink}>Reports</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/escalations')}><Text style={styles.footerLink}>Contact Support</Text></TouchableOpacity>
                <Text style={styles.footerCopy}>© 2024 TenantApp Management Suite.</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </LinearGradient>
  );

  if (isDesktop) {
    return <DesktopShell />;
  }

  return (
    <>
      <LinearGradient
        colors={LUMINOUS_BACKGROUND}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.mobileHeader}>
            <Animated.View style={{ opacity: headerOpacity, flex: 1, paddingRight: 10 }}>
              <Text style={styles.compactHeaderTitle} numberOfLines={1}>My Properties</Text>
            </Animated.View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={23} color={Theme.Colors.onSurface} />
                <View style={styles.notificationBadge} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                <View style={styles.mobileAvatar}>
                  <Text style={styles.mobileAvatarText}>{user?.fullName?.[0] || 'A'}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#00e5ff" />
            </View>
          ) : (
            <Animated.FlatList
              data={properties}
              renderItem={renderPropertyItem}
              keyExtractor={(item: PropertyResponse) => item.id}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={ListHeader}
              ListEmptyComponent={ListEmptyComponent}
              ListFooterComponent={ListFooter}
              showsVerticalScrollIndicator={false}
              refreshing={isLoading}
              onRefresh={refreshProperties}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
            />
          )}
        </SafeAreaView>
      </LinearGradient>

      {/* Broadcast Notice Composer Modal */}
      <Modal
        transparent
        visible={!!selectedPropertyForBroadcast}
        animationType="slide"
        onRequestClose={() => {
          console.log('[Broadcast] Modal close requested');
          setSelectedPropertyForBroadcast(null);
        }}
      >
        <View style={styles.composerOverlay}>
          <View style={styles.composerSheet}>
            {/* Header */}
            <View style={styles.composerHeader}>
              <View>
                <Text style={styles.composerTitle}>Broadcast Notice</Text>
                <Text style={styles.composerSubtitle}>{selectedPropertyForBroadcast?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPropertyForBroadcast(null)}>
                <MaterialIcons name="close" size={24} color="#163235" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.composerScroll}>
              {/* Title */}
              <Text style={styles.composerLabel}>TITLE</Text>
              <TextInput
                style={styles.composerInput}
                placeholder="e.g. Water supply shut-off notice"
                value={broadcastTitle}
                onChangeText={setBroadcastTitle}
                maxLength={255}
              />

              {/* Content */}
              <Text style={styles.composerLabel}>CONTENT</Text>
              <TextInput
                style={[styles.composerInput, styles.composerTextarea]}
                placeholder="Describe the notice in detail..."
                value={broadcastContent}
                onChangeText={setBroadcastContent}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              {/* Category row */}
              <Text style={styles.composerLabel}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {(['GENERAL', 'MAINTENANCE', 'EMERGENCY', 'BILLING', 'EVENT'] as const).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, broadcastCategory === cat && styles.chipActive]}
                    onPress={() => setBroadcastCategory(cat)}
                  >
                    <Text style={[styles.chipText, broadcastCategory === cat && styles.chipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Severity row */}
              <Text style={styles.composerLabel}>SEVERITY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {([
                  { val: 'INFO' as const, color: '#006875' },
                  { val: 'WARNING' as const, color: '#e28743' },
                  { val: 'CRITICAL' as const, color: '#ba1a1a' },
                ]).map(({ val, color }) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.chip, broadcastSeverity === val && { ...styles.chipActive, backgroundColor: color, borderColor: color }]}
                    onPress={() => setBroadcastSeverity(val)}
                  >
                    <Text style={[styles.chipText, broadcastSeverity === val && styles.chipTextActive]}>{val}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Target scope row */}
              <Text style={styles.composerLabel}>TARGET SCOPE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {(['PROPERTY', 'FLOOR', 'UNIT'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, broadcastTargetType === t && styles.chipActive]}
                    onPress={() => setBroadcastTargetType(t)}
                  >
                    <Text style={[styles.chipText, broadcastTargetType === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {broadcastTargetType !== 'PROPERTY' && (
                <>
                  <Text style={styles.composerLabel}>
                    {broadcastTargetType === 'FLOOR' ? 'FLOOR NUMBER' : 'UNIT ID'}
                  </Text>
                  <TextInput
                    style={styles.composerInput}
                    placeholder={broadcastTargetType === 'FLOOR' ? 'e.g. 3' : 'e.g. uuid of unit'}
                    value={broadcastTargetValue}
                    onChangeText={setBroadcastTargetValue}
                    keyboardType={broadcastTargetType === 'FLOOR' ? 'numeric' : 'default'}
                  />
                </>
              )}
            </ScrollView>

            {/* Send button */}
            <TouchableOpacity
              style={styles.composerSendBtn}
              onPress={handleSendBroadcast}
              disabled={sendingBroadcast}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={broadcastSeverity === 'CRITICAL' ? ['#ba1a1a', '#7d0e0e'] : ['#006875', '#00bcd4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.composerSendGradient}
              >
                {sendingBroadcast ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="send" size={18} color="#fff" />
                    <Text style={styles.composerSendText}>BROADCAST NOW</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    overflow: 'hidden',
  },
  sidebarBrand: {
    marginBottom: 54,
  },
  sidebarBrandTitle: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    color: Theme.Colors.primary,
  },
  sidebarBrandSub: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: Theme.Colors.onSurfaceVariant,
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
    borderRadius: Theme.Rounded.lg,
  },
  sidebarLinkActive: {
    backgroundColor: 'rgba(0, 224, 255, 0.10)',
    borderRightWidth: 4,
    borderRightColor: Theme.Colors.primaryContainer,
  },
  sidebarLinkText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: Theme.Colors.onSurface,
  },
  sidebarLinkTextActive: {
    color: Theme.Colors.primary,
  },
  sidebarFooter: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: Theme.Colors.outlineVariant,
    paddingTop: 28,
    gap: 10,
  },
  upgradeButton: {
    borderRadius: Theme.Rounded.lg,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: Theme.Colors.secondary,
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
    borderBottomColor: 'rgba(255, 255, 255, 0.75)',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    overflow: 'hidden',
  },
  topbarTabs: {
    flexDirection: 'row',
    gap: 34,
    alignItems: 'center',
  },
  topbarTab: {
    fontSize: 18,
    color: Theme.Colors.onSurface,
  },
  topbarTabActive: {
    color: Theme.Colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: Theme.Colors.primaryContainer,
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
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  searchPlaceholder: {
    fontSize: 15,
    color: '#6b7a7d',
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
    borderColor: Theme.Colors.primaryContainer,
    backgroundColor: Theme.Colors.primary,
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
    borderTopColor: 'rgba(255, 255, 255, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 42,
  },
  footerBrand: {
    fontSize: 26,
    fontWeight: '800',
    color: Theme.Colors.primary,
    marginRight: 22,
  },
  footerLink: {
    fontSize: 12,
    letterSpacing: 1.3,
    color: Theme.Colors.onSurface,
  },
  footerCopy: {
    marginLeft: 'auto',
    color: Theme.Colors.outline,
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
    height: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  mobileBrand: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.Colors.primary,
  },
  mobileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.Colors.inverseSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Theme.Colors.primaryContainer,
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
    color: '#00e5ff',
    letterSpacing: 1,
  },
  compactHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#151d1e',
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
  largeTitleContainer: {
    marginBottom: 20,
  },
  titleLine: {
    fontSize: 48,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 52,
    letterSpacing: -1,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    color: '#151d1e',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#6b7a7d',
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
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  mobileSearchText: {
    fontSize: 15,
    color: '#6b7a7d',
  },
  mobileFilterButtonWrapper: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: Theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
    borderRadius: Theme.Rounded.xl,
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
    color: '#6b7a7d',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 31,
    color: '#151d1e',
    marginTop: 2,
  },
  propertyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: Theme.Rounded.xl,
    padding: 0,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: Theme.Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    overflow: 'hidden',
  },
  propertyCardDesktop: {
    width: '100%',
    minHeight: 440,
    padding: 24,
    borderRadius: Theme.Rounded.xl,
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: Theme.Rounded.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  },
  desktopMetricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.Colors.onSurface,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
  },
  buildingPreviewContainerDesktop: {
    height: 380,
    width: '100%',
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  deleteButtonOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 999,
    zIndex: 10,
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
    borderRadius: Theme.Rounded.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
    letterSpacing: 1,
    color: Theme.Colors.onPrimaryContainer,
  },
  propertyName: {
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 31,
    color: '#151d1e',
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: Theme.Colors.onSurfaceVariant,
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: Theme.Rounded.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  },
  propertyMetricLabel: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
    letterSpacing: 1,
    color: '#6b7a7d',
  },
  propertyMetricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.Colors.onSurface,
    marginTop: 4,
  },
  propertyMetricAccent: {
    color: Theme.Colors.primary,
  },
  manageButtonWrapper: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  manageButtonWrapperMobile: {
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: Theme.Colors.primaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  manageButtonWrapperDesktop: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 100,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
  },
  addNewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderStyle: 'dashed',
    borderRadius: Theme.Rounded.xl,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  addNewCardDesktop: {
    width: '100%',
    minHeight: 180,
    marginTop: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
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
    backgroundColor: '#edf5f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  addNewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#151d1e',
    marginBottom: 5,
  },
  addNewSubtitle: {
    fontSize: 14,
    color: '#6b7a7d',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#006875',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    overflow: 'hidden',
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#151d1e',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6b7a7d',
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
    color: '#006875',
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
    color: '#006875',
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
    color: '#6b7a7d',
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
    color: '#6b7a7d',
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
  },
  chipActive: {
    backgroundColor: '#006875',
    borderColor: '#006875',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#006875',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  composerSendBtn: {
    margin: 20,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#006875',
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

