import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { getTenantVisibleInventory, BackendInventoryItem } from '@/src/features/inventory/api/inventory.api';
import { getActiveLease, LeaseResponse } from '@/src/features/tenant/api/lease.api';
import { getPropertyDetails } from '@/src/features/property/api/property.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { BlurView } from 'expo-blur';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useRouter } from 'expo-router';

function getAmenityMeta(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('wifi') || lower.includes('internet')) {
    return {
      icon: 'wifi' as const,
      meta: 'High-speed mesh network',
      image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80',
    };
  }
  if (lower.includes('pool') || lower.includes('swim')) {
    return {
      icon: 'pool' as const,
      meta: 'Open 6:00 AM - 10:00 PM',
      image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&auto=format&fit=crop&q=80',
    };
  }
  if (lower.includes('gym') || lower.includes('fitness')) {
    return {
      icon: 'fitness-center' as const,
      meta: 'Level 2 • 24/7 Access',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    };
  }
  if (lower.includes('park') || lower.includes('car')) {
    return {
      icon: 'local-parking' as const,
      meta: 'Covered & Reserved Bay',
      image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
    };
  }
  if (lower.includes('security') || lower.includes('cctv') || lower.includes('guard')) {
    return {
      icon: 'security' as const,
      meta: 'CCTV & Keycard Entry',
      image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80',
    };
  }
  if (lower.includes('backup') || lower.includes('power') || lower.includes('generator')) {
    return {
      icon: 'power' as const,
      meta: '24/7 Power Backup',
      image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80',
    };
  }
  if (lower.includes('laundry') || lower.includes('wash')) {
    return {
      icon: 'local-laundry-service' as const,
      meta: 'In-building Laundromat',
      image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&auto=format&fit=crop&q=80',
    };
  }
  if (lower.includes('lift') || lower.includes('elevator')) {
    return {
      icon: 'elevator' as const,
      meta: 'High-speed Elevators',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop&q=80',
    };
  }
  if (lower.includes('ev') || lower.includes('charge')) {
    return {
      icon: 'ev-station' as const,
      meta: 'Fast EV Charging Stations',
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
    };
  }
  return {
    icon: 'star' as const,
    meta: 'Property Common Facility',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
  };
}

export default function TenantInventoryScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { handleScroll } = useScrollNav();
  const { accessToken } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [lease, setLease] = useState<LeaseResponse | null>(null);
  const [unitItems, setUnitItems] = useState<BackendInventoryItem[]>([]);
  const [sharedItems, setSharedItems] = useState<BackendInventoryItem[]>([]);
  const [propertyAmenities, setPropertyAmenities] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const leaseData = await getActiveLease(accessToken);
        if (mounted && leaseData) {
          setLease(leaseData);
          if (leaseData.propertyId) {
            const propDetails = await getPropertyDetails(accessToken, leaseData.propertyId);
            if (mounted && propDetails && propDetails.amenities) {
              setPropertyAmenities(propDetails.amenities);
            }
          }
        }
        const invData = await getTenantVisibleInventory(accessToken);
        if (mounted) {
          setUnitItems(invData.unitItems || []);
          setSharedItems(invData.sharedItems || []);
        }
      } catch (err) {
        console.warn('[TenantInventoryScreen] Error loading inventory:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [accessToken]);

  const allItems = [...unitItems, ...sharedItems];
  const totalCount = allItems.length;
  const excellentCount = allItems.filter(i => (i.condition || '').toUpperCase() === 'EXCELLENT').length;
  const goodOrMinorCount = allItems.filter(i => (i.condition || '').toUpperCase() === 'GOOD' || (i.condition || '').toUpperCase() === 'FAIR').length;

  const amenitiesToRender = propertyAmenities.map((name, idx) => ({
    id: `amenity-${idx}`,
    name,
    ...getAmenityMeta(name),
  }));

  return (
    <LinearGradient
      colors={theme.Colors.backgroundGradient as [string, string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {isDesktop && <DesktopNavBar title="My Unit Inventory" />}
        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isDesktop ? styles.scrollContentDesktop : { paddingTop: 88 }]}
        >
          <View style={styles.header}>
            {isDesktop && (
              <View style={styles.titleBlock}>
                <Text style={styles.kicker}>VERIFIED ASSET REGISTER</Text>
                <Text style={[styles.title, !isDesktop && styles.titleMobile]}>My Unit Inventory</Text>
                <Text style={styles.subtitle}>
                  Review move-in condition records for {lease?.unitNumber ? `Unit ${lease.unitNumber}` : 'your assigned residence'} and shared building amenities.
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={[styles.reportButtonWrapper, !isDesktop && { flex: 1, width: '100%' }]} 
              activeOpacity={0.78}
              onPress={() => router.push('/tenant-maintenance')}
            >
              <LinearGradient
                colors={['#00e0ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.reportButton}
              >
                <MaterialIcons name="report-problem" size={20} color={theme.Colors.surfaceContainerLowest} />
                <Text style={styles.reportButtonText}>Report Item Issue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={[styles.bentoGrid, isDesktop && styles.bentoGridDesktop]}>
            <View style={styles.snapshotCard}>
              <Text style={styles.cardTitle}>Inventory Summary</Text>
              
              <MetricRow label="Total Registered Items" value={totalCount.toString()} styles={styles} />
              <MetricRow label="Excellent Condition" value={excellentCount.toString()} styles={styles} />
              <MetricRow label="Good / Minor Wear" value={goodOrMinorCount.toString()} styles={styles} />

              <View style={styles.dashedDivider} />

              <View style={styles.verifiedRow}>
                <MaterialIcons name="verified" size={18} color={theme.Colors.primary} />
                <Text style={styles.verifiedText}>Verified on digital record for your property.</Text>
              </View>
            </View>

            <View style={styles.inventoryColumn}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Assigned Unit Items</Text>
                <View style={styles.readOnlyPill}>
                  <Text style={styles.readOnlyText}>VERIFIED RECORD</Text>
                </View>
              </View>

              {loading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={theme.Colors.primary} />
                </View>
              ) : unitItems.length > 0 ? (
                unitItems.map(item => (
                  <TenantItemCard key={item.id} item={item} theme={theme} styles={styles} isDark={isDark} />
                ))
              ) : (
                <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={{ padding: 32, borderRadius: theme.Rounded.lg, alignItems: 'center', borderWidth: 1, borderColor: theme.Colors.glassStroke }}>
                  <MaterialIcons name="inventory" size={40} color={theme.Colors.primary} style={{ marginBottom: 12 }} />
                  <Text style={{ fontSize: theme.Typography.titleMedium.fontSize, fontWeight: '800', color: theme.Colors.onSurface }}>No Inventory Items On File</Text>
                  <Text style={{ color: theme.Colors.onSurfaceVariant, fontSize: theme.Typography.bodyMedium.fontSize, marginTop: 4, textAlign: 'center' }}>
                    Your property manager has not logged specific appliance or furniture assets for this unit yet.
                  </Text>
                </BlurView>
              )}

              {sharedItems.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, { marginTop: theme.Spacing.md }]}>
                    <Text style={styles.sectionTitle}>Shared Building Facilities</Text>
                  </View>

                  {sharedItems.map(item => (
                    <TenantItemCard key={item.id} item={item} theme={theme} styles={styles} isDark={isDark} />
                  ))}
                </>
              )}
            </View>
          </View>

          <View style={{ marginTop: theme.Spacing.md }}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Property-wide Amenities</Text>
                <Text style={styles.sectionSubtitle}>Common facilities visible to all active tenants in this property.</Text>
              </View>
              <TouchableOpacity style={styles.bookButtonWrapper} activeOpacity={0.78} onPress={() => router.push('/tenant-maintenance')}>
                <LinearGradient
                  colors={['#00e0ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.bookButton}
                >
                  <Text style={styles.bookButtonText}>Book Amenity</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {amenitiesToRender.length > 0 ? (
              <View style={[styles.amenityGrid, isDesktop && styles.amenityGridDesktop]}>
                {amenitiesToRender.map((amenity) => (
                  <View key={amenity.id} style={styles.amenityCard}>
                    <Image source={{ uri: amenity.image }} style={styles.amenityImage} />
                    <View style={styles.amenityOverlay} />
                    <View style={styles.amenityContent}>
                      <View style={styles.amenityTitleRow}>
                        <MaterialIcons name={amenity.icon} size={22} color={theme.Colors.surfaceContainerLowest} />
                        <Text style={styles.amenityTitle}>{amenity.name}</Text>
                      </View>
                      <Text style={styles.amenityMeta}>{amenity.meta}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <BlurView intensity={45} tint={isDark ? "dark" : "light"} style={styles.emptyBox}>
                <MaterialIcons name="pool" size={44} color={theme.Colors.primary} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No Property Amenities Logged</Text>
                <Text style={styles.emptySub}>
                  Your landlord has not registered property-wide amenities for this property yet.
                </Text>
              </BlurView>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function TenantItemCard({ item, theme, styles, isDark }: { item: BackendInventoryItem; theme: any; styles: any; isDark: boolean }) {
  const isFairOrPoor = item.condition === 'Fair' || item.condition === 'DAMAGED' || item.condition === 'POOR';
  const defaultImage = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80';

  return (
    <BlurView intensity={45} tint={isDark ? "dark" : "light"} style={styles.itemCard}>
      <Image source={{ uri: item.image || defaultImage }} style={styles.itemImage} />
      <View style={styles.itemBody}>
        <View style={styles.itemTopRow}>
          <Text style={styles.itemTitle}>{item.name}</Text>
          <View style={[styles.conditionPill, isFairOrPoor && styles.conditionPillWarn]}>
            <MaterialIcons name={isFairOrPoor ? 'info' : 'check-circle'} size={14} color={isFairOrPoor ? theme.Colors.tertiary : theme.Colors.primary} />
            <Text style={[styles.conditionPillText, isFairOrPoor && styles.conditionPillTextWarn]}>{item.condition || 'GOOD'}</Text>
          </View>
        </View>
        <Text style={styles.itemDescription}>{item.notes || `Model: ${item.modelNumber || 'N/A'} • Serial: ${item.serialNumber || 'N/A'}`}</Text>
        <View style={styles.itemFooter}>
          <View style={styles.photoLink}>
            <MaterialIcons name="inventory-2" size={18} color={theme.Colors.primary} />
            <Text style={styles.photoLinkText}>{item.category || 'Asset Item'}</Text>
          </View>
          <Text style={styles.itemId}>ID: {item.id ? item.id.substring(0, 8) : 'N/A'}</Text>
        </View>
      </View>
    </BlurView>
  );
}

function MetricRow({ label, value, styles }: { label: string; value: string; styles: any }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120, gap: theme.Spacing.lg },
  scrollContentDesktop: { padding: theme.Spacing.xl, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18 },
  kicker: { fontFamily: 'Inter', fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '700', lineHeight: 14, letterSpacing: 1.2, color: theme.Colors.primary, textTransform: 'uppercase' },
  title: { fontFamily: 'Inter', fontSize: theme.Typography.headlineLg.fontSize, fontWeight: '800', lineHeight: 38, color: theme.Colors.onSurface, marginTop: 6 },
  titleMobile: { fontSize: theme.Typography.headlineMedium.fontSize, lineHeight: 36 },
  subtitle: { fontFamily: 'Inter', fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '400', lineHeight: 24, color: theme.Colors.onSurfaceVariant, marginTop: theme.Spacing.sm, maxWidth: 700 },
  titleBlock: { maxWidth: 720 },
  reportButtonWrapper: {
    height: 46,
    borderRadius: theme.Rounded.lg,
    overflow: 'hidden',
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.md,
    gap: theme.Spacing.sm,
  },
  reportButtonText: { color: theme.Colors.onPrimary, fontWeight: '800', fontSize: theme.Typography.bodyMedium.fontSize },
  bentoGrid: { gap: 18 },
  bentoGridDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  snapshotCard: {
    flex: 0.85,
    minWidth: 280,
    backgroundColor: isDark ? 'rgba(15, 23, 32, 0.85)' : 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: theme.Colors.glassStroke,
    borderRadius: theme.Rounded.lg,
    padding: 18,
    gap: 12,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '800', color: theme.Colors.primary, marginBottom: theme.Spacing.xs },
  metricRow: {
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    borderRadius: theme.Rounded.lg,
    padding: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: { color: theme.Colors.onSurfaceVariant, fontWeight: '600', fontSize: theme.Typography.bodyMedium.fontSize },
  metricValue: { color: theme.Colors.primary, fontFamily: 'Inter', fontWeight: '800' },
  dashedDivider: { borderTopWidth: 1, borderTopColor: theme.Colors.outlineVariant, borderStyle: 'dashed', marginVertical: 2 },
  verifiedRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  verifiedText: { flex: 1, color: theme.Colors.onSurfaceVariant, fontSize: theme.Typography.bodyMedium.fontSize, lineHeight: 19, fontStyle: 'italic' },
  inventoryColumn: { flex: 1.7, gap: 12 },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sectionTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '800', color: theme.Colors.onSurface },
  sectionSubtitle: { color: theme.Colors.onSurfaceVariant, marginTop: theme.Spacing.xs, maxWidth: 620 },
  readOnlyPill: { backgroundColor: theme.Colors.secondaryFixed, paddingHorizontal: 11, paddingVertical: 5, borderRadius: theme.Rounded.full },
  readOnlyText: { fontFamily: 'Inter', fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '700', lineHeight: 14, letterSpacing: 1.2, color: theme.Colors.secondary },
  itemCard: {
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: theme.Colors.glassStroke,
    borderRadius: theme.Rounded.lg,
    overflow: 'hidden',
  },
  itemImage: { width: '100%', height: 180, backgroundColor: theme.Colors.surfaceVariant },
  itemBody: { padding: theme.Spacing.md, gap: 12 },
  itemTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  itemTitle: { flex: 1, fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '800', color: theme.Colors.onSurface },
  conditionPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,104,117,0.1)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: theme.Rounded.lg },
  conditionPillWarn: { backgroundColor: theme.Colors.tertiaryFixed },
  conditionPillText: { color: theme.Colors.primary, fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '800' },
  conditionPillTextWarn: { color: theme.Colors.tertiary },
  itemDescription: { color: theme.Colors.onSurfaceVariant, fontSize: theme.Typography.bodyMedium.fontSize, lineHeight: 20 },
  itemFooter: { borderTopWidth: 1, borderTopColor: theme.Colors.surfaceVariant, paddingTop: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  photoLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  photoLinkText: { color: theme.Colors.primary, fontWeight: '800', fontSize: theme.Typography.bodyMedium.fontSize },
  itemId: { color: theme.Colors.outline, fontFamily: 'Inter', fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '700' },
  amenitySection: { gap: theme.Spacing.md },
  bookButtonWrapper: { borderRadius: theme.Rounded.lg, overflow: 'hidden' },
  bookButton: { paddingHorizontal: theme.Spacing.md, paddingVertical: 12 },
  bookButtonText: { color: theme.Colors.onPrimary, fontWeight: '800', fontSize: theme.Typography.bodyMedium.fontSize },
  amenityGrid: { gap: 14 },
  amenityGridDesktop: { flexDirection: 'row' },
  amenityCard: { flex: 1, minHeight: 230, borderRadius: theme.Rounded.lg, overflow: 'hidden', backgroundColor: theme.Colors.surfaceVariant },
  amenityImage: { position: 'absolute', width: '100%', height: '100%' },
  amenityOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.34)' },
  amenityContent: { flex: 1, justifyContent: 'flex-end', padding: 18, gap: 5 },
  amenityTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amenityTitle: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '800', flex: 1 },
  amenityMeta: { color: 'rgba(255,255,255,0.84)', fontWeight: '600', fontSize: theme.Typography.bodyMedium.fontSize },
  emptyBox: { padding: 32, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(186, 201, 204, 0.4)' },
  emptyTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '800', color: theme.Colors.onSurface, marginBottom: 6 },
  emptySub: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22, maxWidth: 420 },
});
