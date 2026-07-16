import React, { useState, useEffect, useCallback , useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  useWindowDimensions
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/src/theme/Theme';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { getProperty } from '@/src/features/properties/api/property.api';
import { getFloorSummaries, FloorSummaryResponse } from '@/src/features/properties/api/unit.api';
import { useFocusEffect, useRouter, Href } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

interface FloorListOverviewScreenProps {
  propertyId: string;
  userToken: string;
  onBack: () => void;
  onEditFloor: (floorNumber: number) => void;
}

export default function FloorListOverviewScreen({ 
  propertyId, 
  userToken, 
  onBack,
  onEditFloor
}: FloorListOverviewScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [propertyName, setPropertyName] = useState('Loading...');
  const [floors, setFloors] = useState<FloorSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalFloorsFromProperty, setTotalFloorsFromProperty] = useState<number | undefined>(undefined);
  const scrollY = useRef(new Animated.Value(0)).current;

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

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [propertyId])
  );

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const property = await getProperty(propertyId, userToken);
      setPropertyName(property.name);
      setTotalFloorsFromProperty(property.totalFloors);

      const floorData = await getFloorSummaries(propertyId, userToken, property.totalFloors);
      setFloors([...floorData].sort((a, b) => b.floorNumber - a.floorNumber));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const floorData = await getFloorSummaries(propertyId, userToken, totalFloorsFromProperty);
      setFloors([...floorData].sort((a, b) => b.floorNumber - a.floorNumber));
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderSidebarLink = (icon: keyof typeof MaterialIcons.glyphMap, label: string, active = false, route?: Href) => (
    <TouchableOpacity
      style={[styles.sidebarLink, active && styles.sidebarLinkActive]}
      onPress={route ? () => (route === '/command-center' ? onBack() : router.push(route)) : undefined}
      activeOpacity={route ? 0.75 : 1}
    >
      <MaterialIcons name={icon} size={22} color={active ? Theme.Colors.primary : Theme.Colors.onSurfaceVariant} />
      <Text style={[styles.sidebarLinkText, active && styles.sidebarLinkTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderFloorCard = (floor: FloorSummaryResponse) => (
    <BlurView 
      key={floor.floorNumber} 
      intensity={60} 
      tint="light" 
      style={[
        styles.floorCard, 
        isDesktop && styles.floorCardDesktop
      ]}
    >
      <View style={styles.floorCardHeader}>
        <View style={styles.floorNumberBox}>
          <Text style={styles.floorNumberText}>{floor.floorNumber}</Text>
        </View>
        <View style={styles.floorInfo}>
          <Text style={styles.floorTitle}>
            Floor {floor.floorNumber} {floor.floorNumber === 1 ? '(Ground)' : ''}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, floor.configured ? styles.statusConfigured : styles.statusNotConfigured]}>
              <MaterialIcons 
                name={floor.configured ? "check-circle" : "warning"} 
                size={12} 
                color={floor.configured ? "#00c853" : "#ff3d00"} 
              />
              <Text style={[styles.statusText, floor.configured ? styles.textConfigured : styles.textNotConfigured]}>
                {floor.configured ? 'Configured' : 'Not Configured'}
              </Text>
            </View>
            <Text style={styles.unitCountText}>{floor.unitCount} Units</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        activeOpacity={0.8}
        style={styles.actionButtonWrapper}
        onPress={() => onEditFloor(floor.floorNumber)}
      >
        {floor.configured ? (
          <View style={styles.editButton}>
            <MaterialIcons name="edit" size={18} color="#006875" />
            <Text style={styles.editButtonText}>Edit Layout</Text>
          </View>
        ) : (
          <LinearGradient
            colors={['#00d4ff', '#0072ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.configureButton}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.configureButtonText}>Configure</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    </BlurView>
  );

  const DesktopShell = () => (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
        {/* Main Workspace */}
        <View style={styles.desktopMain}>
          <DesktopNavBar 
            activeTab="Properties" 
            onBack={onBack} 
            backText="Back to Portfolio" 
          />

          <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
            <View style={styles.desktopInner}>
              {/* Full Width Header Row */}
              <View style={styles.desktopHeaderRow}>
                <View style={styles.largeTitleContainer}>
                  <Text style={styles.titleLineDesktop}>Floor Overview</Text>
                  <View style={styles.propertyBadge}>
                    <View style={styles.propertyIconWrapper}>
                      <MaterialIcons name="business" size={14} color="#fff" />
                    </View>
                    <Text style={styles.propertyNameLabel}>{propertyName}</Text>
                  </View>
                </View>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color="#006875" style={{ marginTop: 40 }} />
              ) : (
                <View style={styles.floorsGridDesktop}>
                  {floors.map(renderFloorCard)}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
    </LinearGradient>
  );

  if (isDesktop) {
    return DesktopShell();
  }

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={[]}>
        {/* Glassy Overlay Header */}
        <View style={styles.headerContainer}>
          <BlurView intensity={45} tint="light" style={StyleSheet.absoluteFillObject} />
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={22} color="#0b1c30" />
            </TouchableOpacity>
            <View style={styles.titleWrapper}>
              <Text style={styles.compactTitleText}>Floor Overview</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <Animated.ScrollView 
          style={styles.container}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 76 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#006875" />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          <Animated.View style={[styles.largeTitleContainer, { opacity: largeTitleOpacity }]}>
            <Text style={styles.titleLine}>Floor</Text>
            <Text style={styles.titleLine}>Overview</Text>
            <View style={styles.propertyBadge}>
              <View style={styles.propertyIconWrapper}>
                <MaterialIcons name="business" size={14} color="#fff" />
              </View>
              <Text style={styles.propertyNameLabel}>{propertyName}</Text>
            </View>
          </Animated.View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#006875" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.floorsList}>
              {floors.map(renderFloorCard)}
            </View>
          )}
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    zIndex: 999,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  compactTitleText: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#0b1c30',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#006677',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  largeTitleContainer: {
    marginBottom: 20,
  },
  titleContainer: {},
  titleLine: {
    fontSize: 48,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 52,
    letterSpacing: -1,
  },
  propertyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    paddingRight: 16,
    paddingLeft: 6,
    paddingVertical: 6,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.1)',
  },
  propertyIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#006875',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  propertyNameLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006875',
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 100,
  },
  floorsList: {
    gap: 16,
  },
  floorCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  floorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  floorNumberBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 104, 117, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.1)',
  },
  floorNumberText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#151d1e',
  },
  floorInfo: {
    flex: 1,
  },
  floorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#151d1e',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusConfigured: {
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
  },
  statusNotConfigured: {
    backgroundColor: 'rgba(255, 61, 0, 0.1)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textConfigured: {
    color: '#00c853',
  },
  textNotConfigured: {
    color: '#ff3d00',
  },
  unitCountText: {
    fontSize: 14,
    color: '#6b7a7d',
  },
  actionButtonWrapper: {
    width: '100%',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 104, 117, 0.05)',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.1)',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006875',
  },
  configureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  configureButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  
  // Desktop Shell & Responsiveness Styles
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
  backButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 10,
  },
  backButtonTextDesktop: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151d1e',
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
    paddingBottom: 24,
  },
  desktopInner: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    gap: 24,
  },
  desktopHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleLineDesktop: {
    fontSize: 32,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 38,
  },
  floorsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    width: '100%',
  },
  floorCardDesktop: {
    flexBasis: '30%',
    flexGrow: 1,
    maxWidth: '48%',
    minWidth: 320,
  },
});
