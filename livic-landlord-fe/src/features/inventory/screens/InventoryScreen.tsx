import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/src/theme/Theme';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

import { useInventory, type InventoryTab } from '@/src/features/inventory/hooks/useInventory';
import { InventoryRegistryView } from '@/src/features/inventory/components/InventoryRegistryView';
import { InventoryMoveInView } from '@/src/features/inventory/components/InventoryMoveInView';
import { InventoryMoveOutView } from '@/src/features/inventory/components/InventoryMoveOutView';
import { AddItemModal } from '@/src/features/inventory/components/AddItemModal';

import { GlassCard } from '@/src/components/common/display/GlassCard';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { PropertySelector } from '@/src/components/common/display/PropertySelector';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import FilterPill from '@/src/components/common/inputs/FilterPill';
import { useRouter } from 'expo-router';

export default function InventoryScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { handleScroll } = useScrollNav();
  const { showToast } = useToast();

  const {
    activeTab,
    setActiveTab,
    query,
    setQuery,
    serviceOnly,
    setServiceOnly,
    filteredItems,
    rawItems,
    assignmentItems,
    verificationItems,
    stats,
    totalDeductions,
    securityDeposit,
    netRefund,
    leaseId,
    propertyId,
    properties,
    setSelectedPropertyId,
    refresh,
    isAddModalOpen,
    setIsAddModalOpen,
    accessToken,
  } = useInventory();

  const handleOpenAddModal = () => {
    if (!propertyId) {
      showToast("Please select a property from the top navbar selector first.", "info");
      return;
    }
    setIsAddModalOpen(true);
  };

  const TABS: { id: InventoryTab; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
    { id: 'registry', label: 'Registry',   icon: 'inventory-2'  },
    { id: 'moveIn',   label: 'Move-In',    icon: 'how-to-reg'   },
    { id: 'moveOut',  label: 'Settlement', icon: 'receipt-long' },
  ];

  return (
    <PageShell
      scrollable={true}
      onEndReached={refresh}
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.scroll, isDesktop ? styles.scrollDesktop : { paddingTop: 88 }]}
    >

          {/* Desktop page header */}
          {isDesktop && (
            <View style={styles.pageHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>INVENTORY LIFECYCLE</Text>
                <Text style={styles.title}>Property Inventory</Text>
                <Text style={styles.subtitle}>
                  Track move-in assignment, condition evidence, verification and deposit settlement.
                </Text>
                {leaseId && <Text style={styles.contextLine}>Lease: {leaseId}</Text>}
              </View>
              <ActionButton
                label="Add Item"
                icon="add"
                variant="primary"
                size="md"
                onPress={handleOpenAddModal}
              />
            </View>
          )}

          {/* Mobile property selector + search + add row */}
          {!isDesktop && (
            <View style={{ gap: 10 }}>
              {properties.length > 0 && (
                <PropertySelector
                  properties={properties}
                  selectedPropertyId={propertyId}
                  onSelectProperty={setSelectedPropertyId}
                />
              )}
              <View style={styles.mobileTopBar}>
                {leaseId && (
                  <TouchableOpacity
                    style={styles.mobileBackBtn}
                    onPress={() => router.push('/leases')}
                  >
                    <MaterialIcons name="arrow-back" size={20} color={theme.Colors.primary} />
                  </TouchableOpacity>
                )}
                <View style={styles.searchBox}>
                  <MaterialIcons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
                  <TextInput
                    value={query} onChangeText={setQuery}
                    placeholder="Search inventory..."
                    placeholderTextColor={theme.Colors.onSurfaceVariant}
                    style={styles.searchInput}
                  />
                  {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                      <MaterialIcons name="close" size={16} color={theme.Colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.addIconBtn}
                  activeOpacity={0.82}
                  onPress={handleOpenAddModal}
                >
                  <LinearGradient colors={[theme.Colors.primary, '#0072ff']} style={styles.addIconBtnInner}>
                    <MaterialIcons name="add" size={20} color={theme.Colors.surfaceContainerLowest} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Tab selector */}
          <View style={{ flexDirection: 'row', gap: 10, marginVertical: 12 }}>
            {TABS.map((t) => (
              <FilterPill
                key={t.id}
                label={t.label}
                icon={t.icon}
                active={activeTab === t.id}
                onPress={() => setActiveTab(t.id)}
              />
            ))}
          </View>

          {!propertyId ? (
            <GlassCard style={{ padding: 40, alignItems: 'center', justifyContent: 'center', marginVertical: 20 }}>
              <MaterialIcons name="domain" size={48} color={theme.Colors.primary} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.Colors.onSurface, marginBottom: 6 }}>Select Property to View & Add Inventory</Text>
              <Text style={{ fontSize: 14, color: theme.Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 420 }}>
                Please select a property from the top navbar selector to view assets, assign items, or add new inventory.
              </Text>
            </GlassCard>
          ) : (
            <>
              {/* Desktop search for registry */}
              {isDesktop && activeTab === 'registry' && (
                <View style={styles.desktopSearchRow}>
                  <View style={[styles.searchBox, { maxWidth: 420 }]}>
                    <MaterialIcons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
                    <TextInput
                      value={query} onChangeText={setQuery}
                      placeholder="Search inventory..."
                      placeholderTextColor={theme.Colors.onSurfaceVariant}
                      style={styles.searchInput}
                    />
                  </View>
                </View>
              )}

              {activeTab === 'registry' && (
                <InventoryRegistryView
                  items={filteredItems}
                  totalCount={rawItems.length}
                  stats={stats}
                  isDesktop={isDesktop}
                  serviceOnly={serviceOnly}
                  onToggleService={() => setServiceOnly(v => !v)}
                  onAddItem={handleOpenAddModal}
                />
              )}
              {activeTab === 'moveIn' && (
                <InventoryMoveInView
                  assignedItems={assignmentItems}
                  availableItems={rawItems}
                  leaseId={leaseId}
                  token={accessToken}
                  isDesktop={isDesktop}
                  onRefresh={refresh}
                  onAddItem={handleOpenAddModal}
                />
              )}
              {activeTab === 'moveOut' && (
                <InventoryMoveOutView
                  items={verificationItems}
                  leaseId={leaseId}
                  isDesktop={isDesktop}
                  securityDeposit={securityDeposit}
                  totalDeductions={totalDeductions}
                  netRefund={netRefund}
                  onRefresh={refresh}
                />
              )}
            </>
          )}
      {propertyId && accessToken && (
        <AddItemModal
          visible={isAddModalOpen}
          propertyId={propertyId}
          token={accessToken}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={refresh}
        />
      )}
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: theme.Spacing.md, paddingBottom: 120, gap: theme.Spacing.md },
  scrollDesktop: { paddingTop: 24, paddingHorizontal: 32, paddingBottom: 40, width: '100%' },

  pageHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: theme.Spacing.md, marginBottom: theme.Spacing.sm },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kicker: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '800', letterSpacing: 1.2, color: theme.Colors.primary, textTransform: 'uppercase' },
  propertyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,104,117,0.1)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  propertyBadgeText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '800', color: theme.Colors.primary },
  title: { fontSize: theme.Typography.headlineLg.fontSize, fontWeight: '800', color: theme.Colors.onSurface, lineHeight: 38, marginTop: theme.Spacing.xs },
  subtitle: { fontSize: theme.Typography.bodyLarge.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: theme.Spacing.sm, lineHeight: 22, maxWidth: 600 },
  contextLine: { color: theme.Colors.primary, fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '800', marginTop: 6 },
  addBtnWrapper: { borderRadius: 14, overflow: 'hidden' },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: theme.Spacing.sm },
  addBtnText: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '800' },

  mobileTopBar: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  mobileBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconBtn: { width: 46, height: 46, borderRadius: 14, overflow: 'hidden' },
  addIconBtnInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  searchBox: {
    flex: 1, height: 46, flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.Colors.glassFill, borderRadius: 100,
    borderWidth: 1.5, borderColor: theme.Colors.glassStroke, paddingHorizontal: 14, gap: theme.Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  desktopSearchRow: { marginBottom: theme.Spacing.xs },

  tabBar: { flexDirection: 'row', gap: theme.Spacing.sm },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    height: 40, paddingHorizontal: theme.Spacing.md, borderRadius: 100,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1.5, borderColor: theme.Colors.glassStroke, overflow: 'hidden',
  },
  tabActive: { borderWidth: 0 },
  tabText: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '700', color: theme.Colors.onSurfaceVariant },
  tabTextActive: { color: theme.Colors.surfaceContainerLowest, fontWeight: '800' },
});
