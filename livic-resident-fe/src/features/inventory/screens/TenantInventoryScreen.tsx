import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/src/theme/Theme';
import { inventoryItems, tenantAmenities, type InventoryItem } from '@/src/features/inventory/mockInventoryData';
import { BlurView } from 'expo-blur';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';

const tenantVisibleItems = inventoryItems.filter((item) => item.location === 'Unit 402' || item.shared);

export default function TenantInventoryScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  return (
    <LinearGradient
      colors={Theme.Colors.backgroundGradient as [string, string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {isDesktop && <DesktopNavBar title="My Unit Inventory" />}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isDesktop ? styles.scrollContentDesktop : { paddingTop: 88 }]}
        >
          <View style={styles.header}>
            {isDesktop && (
              <View style={styles.titleBlock}>
                <Text style={styles.kicker}>READ ONLY</Text>
                <Text style={[styles.title, !isDesktop && styles.titleMobile]}>My Unit Inventory</Text>
                <Text style={styles.subtitle}>
                  Review move-in condition records for Unit 402 and the shared amenities included with your lease.
                </Text>
              </View>
            )}
            <TouchableOpacity style={[styles.reportButtonWrapper, !isDesktop && { flex: 1, width: '100%' }]} activeOpacity={0.78}>
              <LinearGradient
                colors={['#00e0ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.reportButton}
              >
                <MaterialIcons name="support-agent" size={18} color={Theme.Colors.onPrimary} />
                <Text style={styles.reportButtonText}>Raise Issue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={[styles.bentoGrid, isDesktop && styles.bentoGridDesktop]}>
            <BlurView intensity={60} tint="light" style={styles.snapshotCard}>
              <Text style={styles.cardTitle}>Unit Condition Snapshot</Text>
              <MetricRow label="Total Visible Items" value={String(tenantVisibleItems.length)} />
              <MetricRow label="Excellent Condition" value="2" />
              <MetricRow label="Minor Wear" value="1" />
              <View style={styles.dashedDivider} />
              <View style={styles.verifiedRow}>
                <MaterialIcons name="verified" size={22} color={Theme.Colors.primary} />
                <Text style={styles.verifiedText}>
                  Last verified by management on Jul 20, 2026 during move-in walkthrough.
                </Text>
              </View>
            </BlurView>

            <View style={styles.inventoryColumn}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Assigned & Shared Items</Text>
                <View style={styles.readOnlyPill}>
                  <Text style={styles.readOnlyText}>READ ONLY</Text>
                </View>
              </View>
              {tenantVisibleItems.map((item) => (
                <TenantItemCard key={item.id} item={item} />
              ))}
            </View>
          </View>

          <View style={styles.amenitySection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Property-wide Amenities</Text>
                <Text style={styles.sectionSubtitle}>Common facilities visible to all active tenants in this property.</Text>
              </View>
              <TouchableOpacity style={styles.bookButtonWrapper} activeOpacity={0.78}>
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

            <View style={[styles.amenityGrid, isDesktop && styles.amenityGridDesktop]}>
              {tenantAmenities.map((amenity) => (
                <View key={amenity.id} style={styles.amenityCard}>
                  <Image source={{ uri: amenity.image }} style={styles.amenityImage} />
                  <View style={styles.amenityOverlay} />
                  <View style={styles.amenityContent}>
                    <View style={styles.amenityTitleRow}>
                      <MaterialIcons name={amenity.icon} size={22} color="#fff" />
                      <Text style={styles.amenityTitle}>{amenity.name}</Text>
                    </View>
                    <Text style={styles.amenityMeta}>{amenity.meta}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function TenantItemCard({ item }: { item: InventoryItem }) {
  return (
    <BlurView intensity={45} tint="light" style={styles.itemCard}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemBody}>
        <View style={styles.itemTopRow}>
          <Text style={styles.itemTitle}>{item.name}</Text>
          <View style={[styles.conditionPill, item.condition === 'Fair' && styles.conditionPillWarn]}>
            <MaterialIcons name={item.condition === 'Fair' ? 'info' : 'check-circle'} size={14} color={item.condition === 'Fair' ? Theme.Colors.tertiary : Theme.Colors.primary} />
            <Text style={[styles.conditionPillText, item.condition === 'Fair' && styles.conditionPillTextWarn]}>{item.condition}</Text>
          </View>
        </View>
        <Text style={styles.itemDescription}>{item.notes}</Text>
        <View style={styles.itemFooter}>
          <TouchableOpacity style={styles.photoLink} activeOpacity={0.75}>
            <MaterialIcons name="image" size={18} color={Theme.Colors.primary} />
            <Text style={styles.photoLinkText}>View Move-in Photos</Text>
          </TouchableOpacity>
          <Text style={styles.itemId}>{item.id}</Text>
        </View>
      </View>
    </BlurView>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120, gap: 24 },
  scrollContentDesktop: { padding: 32, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18 },
  kicker: { fontFamily: 'Inter', fontSize: 12, fontWeight: '700', lineHeight: 14, letterSpacing: 1.2, color: Theme.Colors.primary, textTransform: 'uppercase' },
  title: { fontFamily: 'Inter', fontSize: 32, fontWeight: '800', lineHeight: 38, color: Theme.Colors.onSurface, marginTop: 6 },
  titleMobile: { fontSize: 30, lineHeight: 36 },
  subtitle: { fontFamily: 'Inter', fontSize: 16, fontWeight: '400', lineHeight: 24, color: Theme.Colors.onSurfaceVariant, marginTop: 8, maxWidth: 700 },
  titleBlock: { maxWidth: 720 },
  reportButtonWrapper: {
    height: 46,
    borderRadius: Theme.Rounded.lg,
    overflow: 'hidden',
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  reportButtonText: { color: Theme.Colors.onPrimary, fontWeight: '800', fontSize: 13 },
  bentoGrid: { gap: 18 },
  bentoGridDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  snapshotCard: {
    flex: 0.85,
    minWidth: 280,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
    borderRadius: Theme.Rounded.lg,
    padding: 18,
    gap: 12,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: Theme.Colors.primary, marginBottom: 4 },
  metricRow: {
    backgroundColor: Theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Theme.Colors.outlineVariant,
    borderRadius: Theme.Rounded.lg,
    padding: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: { color: Theme.Colors.onSurfaceVariant, fontWeight: '600', fontSize: 13 },
  metricValue: { color: Theme.Colors.primary, fontFamily: 'Inter', fontWeight: '800' },
  dashedDivider: { borderTopWidth: 1, borderTopColor: Theme.Colors.outlineVariant, borderStyle: 'dashed', marginVertical: 2 },
  verifiedRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  verifiedText: { flex: 1, color: Theme.Colors.onSurfaceVariant, fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
  inventoryColumn: { flex: 1.7, gap: 12 },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sectionTitle: { fontSize: 21, fontWeight: '800', color: Theme.Colors.onSurface },
  sectionSubtitle: { color: Theme.Colors.onSurfaceVariant, marginTop: 4, maxWidth: 620 },
  readOnlyPill: { backgroundColor: Theme.Colors.secondaryFixed, paddingHorizontal: 11, paddingVertical: 5, borderRadius: Theme.Rounded.full },
  readOnlyText: { fontFamily: 'Inter', fontSize: 10, fontWeight: '700', lineHeight: 14, letterSpacing: 1.2, color: Theme.Colors.secondary },
  itemCard: {
    backgroundColor: Theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
    borderRadius: Theme.Rounded.lg,
    overflow: 'hidden',
  },
  itemImage: { width: '100%', height: 180, backgroundColor: Theme.Colors.surfaceVariant },
  itemBody: { padding: 16, gap: 12 },
  itemTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  itemTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: Theme.Colors.onSurface },
  conditionPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,104,117,0.1)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: Theme.Rounded.lg },
  conditionPillWarn: { backgroundColor: Theme.Colors.tertiaryFixed },
  conditionPillText: { color: Theme.Colors.primary, fontSize: 12, fontWeight: '800' },
  conditionPillTextWarn: { color: Theme.Colors.tertiary },
  itemDescription: { color: Theme.Colors.onSurfaceVariant, fontSize: 14, lineHeight: 20 },
  itemFooter: { borderTopWidth: 1, borderTopColor: Theme.Colors.surfaceVariant, paddingTop: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  photoLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  photoLinkText: { color: Theme.Colors.primary, fontWeight: '800', fontSize: 13 },
  itemId: { color: Theme.Colors.outline, fontFamily: 'Inter', fontSize: 11, fontWeight: '700' },
  amenitySection: { gap: 16 },
  bookButtonWrapper: { borderRadius: Theme.Rounded.lg, overflow: 'hidden' },
  bookButton: { paddingHorizontal: 16, paddingVertical: 12 },
  bookButtonText: { color: Theme.Colors.onPrimary, fontWeight: '800', fontSize: 13 },
  amenityGrid: { gap: 14 },
  amenityGridDesktop: { flexDirection: 'row' },
  amenityCard: { flex: 1, minHeight: 230, borderRadius: Theme.Rounded.lg, overflow: 'hidden', backgroundColor: Theme.Colors.surfaceVariant },
  amenityImage: { position: 'absolute', width: '100%', height: '100%' },
  amenityOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.34)' },
  amenityContent: { flex: 1, justifyContent: 'flex-end', padding: 18, gap: 5 },
  amenityTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amenityTitle: { color: '#fff', fontSize: 18, fontWeight: '800', flex: 1 },
  amenityMeta: { color: 'rgba(255,255,255,0.84)', fontWeight: '600', fontSize: 13 },
});
