import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Theme } from '@/src/theme/Theme';
import { ownerLeases, ownerLeaseStats, type OwnerLeaseStatus, type OwnerLeaseSummary } from '@/src/features/leases/mockLeaseData';
import { BlurView } from 'expo-blur';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';

const statusStyles: Record<OwnerLeaseStatus, { label: string; bg: string; fg: string }> = {
  ACTIVE: { label: 'Active', bg: Theme.Colors.primaryFixed, fg: Theme.Colors.primary },
  UPCOMING: { label: 'Upcoming', bg: Theme.Colors.secondaryFixed, fg: Theme.Colors.secondary },
  ENDING_SOON: { label: 'Move-out Pending', bg: Theme.Colors.errorContainer, fg: Theme.Colors.onErrorContainer },
  ENDED: { label: 'Ended', bg: Theme.Colors.surfaceContainerHighest, fg: Theme.Colors.onSurfaceVariant },
};

export default function OwnerLeasesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OwnerLeaseStatus | 'ALL'>('ALL');

  const filteredLeases = useMemo(() => {
    return ownerLeases.filter((lease) => {
      const matchesQuery = `${lease.id} ${lease.tenantName} ${lease.propertyName} ${lease.unitNumber}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || lease.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  const openInventoryAssignment = (lease: OwnerLeaseSummary) => {
    const tab = lease.status === 'ENDING_SOON' || lease.status === 'ENDED' ? 'moveOut' : 'moveIn';
    router.push(`/inventory?tab=${tab}&leaseId=${lease.id}`);
  };

  return (
    <LinearGradient
      colors={Theme.Colors.backgroundGradient as [string, string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {isDesktop && <DesktopNavBar title="Lease Operations" />}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        >
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={styles.kicker}>LEASE OPERATIONS</Text>
              <Text style={[styles.title, !isDesktop && styles.titleMobile]}>Owner Leases</Text>
              <Text style={styles.subtitle}>
                View every tenancy, track move-in inventory assignment, and start move-out verification from one place.
              </Text>
            </View>
            <TouchableOpacity style={styles.primaryButtonWrapper} activeOpacity={0.82}>
              <LinearGradient
                colors={['#00e0ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <MaterialIcons name="add" size={18} color={Theme.Colors.onPrimary} />
                <Text style={styles.primaryButtonText}>Create Lease</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
            {ownerLeaseStats.map((stat) => (
              <BlurView key={stat.label} intensity={60} tint="light" style={styles.statCard}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statHelper}>{stat.helper}</Text>
              </BlurView>
            ))}
          </View>

          <BlurView intensity={65} tint="light" style={styles.panel}>
            <View style={[styles.panelHeader, !isDesktop && styles.panelHeaderMobile]}>
              <View>
                <Text style={styles.panelTitle}>Lease Registry</Text>
                <Text style={styles.panelSubtitle}>Showing {filteredLeases.length} of {ownerLeases.length} leases</Text>
              </View>
              <View style={styles.searchBox}>
                <MaterialIcons name="search" size={20} color={Theme.Colors.outline} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search tenant, unit, lease..."
                  placeholderTextColor={Theme.Colors.outline}
                  style={styles.searchInput}
                />
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {renderFilter('ALL', 'All', statusFilter, setStatusFilter)}
              {renderFilter('UPCOMING', 'Move-ins', statusFilter, setStatusFilter)}
              {renderFilter('ENDING_SOON', 'Move-outs', statusFilter, setStatusFilter)}
              {renderFilter('ACTIVE', 'Active', statusFilter, setStatusFilter)}
              {renderFilter('ENDED', 'Ended', statusFilter, setStatusFilter)}
            </ScrollView>

            <View style={styles.leaseList}>
              {filteredLeases.map((lease) => (
                <LeaseCard key={lease.id} lease={lease} isDesktop={isDesktop} onOpenInventory={() => openInventoryAssignment(lease)} />
              ))}
            </View>
          </BlurView>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function renderFilter(
  id: OwnerLeaseStatus | 'ALL',
  label: string,
  activeFilter: OwnerLeaseStatus | 'ALL',
  setFilter: (filter: OwnerLeaseStatus | 'ALL') => void,
) {
  const active = activeFilter === id;
  return (
    <TouchableOpacity key={id} style={[styles.filterPill, active && styles.filterPillActive]} onPress={() => setFilter(id)}>
      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function LeaseCard({
  lease,
  isDesktop,
  onOpenInventory,
}: {
  lease: OwnerLeaseSummary;
  isDesktop: boolean;
  onOpenInventory: () => void;
}) {
  const status = statusStyles[lease.status];
  const inventoryAction = lease.status === 'ENDING_SOON' || lease.status === 'ENDED' ? 'Verify Move-Out' : 'Assign Inventory';

  return (
    <BlurView intensity={45} tint="light" style={[styles.leaseCard, isDesktop && styles.leaseCardDesktop]}>
      <View style={styles.leaseIdentity}>
        <View style={styles.leaseIcon}>
          <MaterialIcons name="description" size={22} color={Theme.Colors.primary} />
        </View>
        <View style={styles.leaseText}>
          <Text style={styles.leaseId}>{lease.id}</Text>
          <Text style={styles.tenantName}>{lease.tenantName}</Text>
          <Text style={styles.tenantMeta}>{lease.tenantPhone}</Text>
        </View>
      </View>

      <View style={styles.leaseLocation}>
        <Text style={styles.infoLabel}>PROPERTY / UNIT</Text>
        <Text style={styles.infoValue}>{lease.propertyName}</Text>
        <Text style={styles.infoMuted}>Unit {lease.unitNumber} - {lease.floorLabel}</Text>
      </View>

      <View style={styles.leaseDates}>
        <Text style={styles.infoLabel}>TENURE</Text>
        <Text style={styles.infoValue}>Move-in {lease.moveInDate}</Text>
        <Text style={styles.infoMuted}>{lease.moveOutDate ? `Move-out ${lease.moveOutDate}` : 'No move-out date'}</Text>
      </View>

      <View style={styles.leaseMoney}>
        <Text style={styles.infoLabel}>FINANCIALS</Text>
        <Text style={styles.infoValue}>{lease.rentAmount} / month</Text>
        <Text style={styles.infoMuted}>Deposit {lease.securityDeposit}</Text>
      </View>

      <View style={styles.leaseActions}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.fg }]}>{status.label}</Text>
        </View>
        <Text style={styles.inventoryMeta}>
          {lease.assignedInventoryCount} assigned - {lease.pendingChecklistCount} pending
        </Text>
        <TouchableOpacity style={styles.inventoryButtonWrapper} onPress={onOpenInventory} activeOpacity={0.82}>
          <LinearGradient
            colors={['#00e0ff', '#0072ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.inventoryButton}
          >
            <MaterialIcons name="inventory" size={17} color={Theme.Colors.onPrimary} />
            <Text style={styles.inventoryButtonText}>{inventoryAction}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120, gap: 20 },
  scrollContentDesktop: { padding: 32, maxWidth: 1240, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18 },
  titleBlock: { maxWidth: 720 },
  kicker: { fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: '700', lineHeight: 14, letterSpacing: 1.2, color: Theme.Colors.primary },
  title: { fontFamily: 'Manrope', fontSize: 32, fontWeight: '800', lineHeight: 38, color: Theme.Colors.onSurface, marginTop: 6 },
  titleMobile: { fontSize: 30, lineHeight: 36 },
  subtitle: { fontFamily: 'Inter', fontSize: 16, lineHeight: 24, color: Theme.Colors.onSurfaceVariant, marginTop: 8 },
  primaryButtonWrapper: {
    height: 48,
    borderRadius: Theme.Rounded.lg,
    overflow: 'hidden',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  primaryButtonText: { color: Theme.Colors.onPrimary, fontSize: 13, fontWeight: '800' },
  statsGrid: { gap: 12 },
  statsGridDesktop: { flexDirection: 'row' },
  statCard: {
    flex: 1,
    minHeight: 112,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
    borderRadius: Theme.Rounded.lg,
    padding: 16,
    overflow: 'hidden',
  },
  statLabel: { fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: '700', letterSpacing: 1, color: Theme.Colors.onSurfaceVariant },
  statValue: { color: Theme.Colors.primary, fontSize: 30, fontWeight: '800', marginTop: 8 },
  statHelper: { color: Theme.Colors.onSurfaceVariant, fontSize: 13, marginTop: 4 },
  panel: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
    borderRadius: Theme.Rounded.lg,
    overflow: 'hidden',
  },
  panelHeader: { padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderBottomWidth: 1, borderBottomColor: Theme.Colors.outlineVariant },
  panelHeaderMobile: { flexDirection: 'column', alignItems: 'stretch' },
  panelTitle: { color: Theme.Colors.onSurface, fontSize: 20, fontWeight: '800' },
  panelSubtitle: { color: Theme.Colors.onSurfaceVariant, fontSize: 13, marginTop: 3 },
  searchBox: {
    minWidth: 260,
    maxWidth: 420,
    flex: 1,
    height: 46,
    borderRadius: Theme.Rounded.lg,
    backgroundColor: Theme.Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Theme.Colors.outlineVariant,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  searchInput: { flex: 1, color: Theme.Colors.onSurface, fontSize: 14 },
  filterRow: { gap: 10, paddingHorizontal: 18, paddingVertical: 14 },
  filterPill: { height: 38, borderRadius: Theme.Rounded.full, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.Colors.surfaceContainerHigh },
  filterPillActive: { backgroundColor: Theme.Colors.primary },
  filterPillText: { color: Theme.Colors.primary, fontWeight: '800', fontSize: 12 },
  filterPillTextActive: { color: Theme.Colors.onPrimary },
  leaseList: { padding: 14, gap: 12 },
  leaseCard: { backgroundColor: Theme.Colors.glassFill, borderWidth: 1, borderColor: Theme.Colors.glassStroke, borderRadius: Theme.Rounded.lg, padding: 14, gap: 16, overflow: 'hidden' },
  leaseCardDesktop: { flexDirection: 'row', alignItems: 'center' },
  leaseIdentity: { flex: 1.35, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 210 },
  leaseIcon: { width: 44, height: 44, borderRadius: Theme.Rounded.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.Colors.primaryFixed },
  leaseText: { flex: 1, minWidth: 0 },
  leaseId: { fontFamily: 'JetBrains Mono', color: Theme.Colors.primary, fontSize: 12, fontWeight: '800' },
  tenantName: { color: Theme.Colors.onSurface, fontSize: 16, fontWeight: '800', marginTop: 3 },
  tenantMeta: { color: Theme.Colors.outline, fontSize: 12, marginTop: 2 },
  leaseLocation: { flex: 1.1, minWidth: 170 },
  leaseDates: { flex: 1.15, minWidth: 180 },
  leaseMoney: { flex: 1, minWidth: 170 },
  infoLabel: { fontFamily: 'JetBrains Mono', color: Theme.Colors.outline, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  infoValue: { color: Theme.Colors.onSurface, fontSize: 14, fontWeight: '800', marginTop: 5 },
  infoMuted: { color: Theme.Colors.onSurfaceVariant, fontSize: 12, marginTop: 3 },
  leaseActions: { flex: 1.15, minWidth: 190, gap: 8, alignItems: 'flex-start' },
  statusBadge: { borderRadius: Theme.Rounded.full, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: '800' },
  inventoryMeta: { color: Theme.Colors.onSurfaceVariant, fontSize: 12, fontWeight: '700' },
  inventoryButtonWrapper: { minHeight: 40, borderRadius: Theme.Rounded.lg, overflow: 'hidden' },
  inventoryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13, gap: 7 },
  inventoryButtonText: { color: Theme.Colors.onPrimary, fontSize: 12, fontWeight: '800' },
});
