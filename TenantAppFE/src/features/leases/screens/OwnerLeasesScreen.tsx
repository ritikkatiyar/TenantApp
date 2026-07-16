import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Theme } from '@/src/theme/Theme';
import {
  ownerLeases,
  ownerLeaseStats,
  type OwnerLeaseStatus,
  type OwnerLeaseSummary,
} from '@/src/features/leases/mockLeaseData';
import { BlurView } from 'expo-blur';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<OwnerLeaseStatus, {
  label: string;
  bg: string;
  fg: string;
  dotColor: string;
  icon: string;
}> = {
  ACTIVE:      { label: 'Active',          bg: 'rgba(5,150,105,0.12)',   fg: '#059669', dotColor: '#10b981', icon: 'check-circle'      },
  UPCOMING:    { label: 'Upcoming',         bg: 'rgba(99,102,241,0.12)', fg: '#4f46e5', dotColor: '#6366f1', icon: 'schedule'          },
  ENDING_SOON: { label: 'Move-out Pending', bg: 'rgba(220,38,38,0.1)',   fg: '#dc2626', dotColor: '#ef4444', icon: 'warning-amber'     },
  ENDED:       { label: 'Ended',            bg: 'rgba(107,114,128,0.12)',fg: '#6b7280', dotColor: '#9ca3af', icon: 'check-circle-outline'},
};

// ─── Initials avatar ──────────────────────────────────────────────────────────
function TenantAvatar({ name, status }: { name: string; status: OwnerLeaseStatus }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const cfg = STATUS_CONFIG[status];
  return (
    <LinearGradient
      colors={status === 'ACTIVE' ? ['#059669', '#10b981'] :
              status === 'UPCOMING' ? ['#4f46e5', '#6366f1'] :
              status === 'ENDING_SOON' ? ['#dc2626', '#ef4444'] :
              ['#6b7280', '#9ca3af']}
      style={styles.avatar}
    >
      <Text style={styles.avatarInitials}>{initials}</Text>
    </LinearGradient>
  );
}

// ─── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ stat }: { stat: typeof ownerLeaseStats[0] }) {
  return (
    <BlurView intensity={55} tint="light" style={styles.statCard}>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
      <Text style={styles.statHelper}>{stat.helper}</Text>
    </BlurView>
  );
}

// ─── Filter pill ───────────────────────────────────────────────────────────────
function FilterPill({
  id, label, activeFilter, setFilter,
}: {
  id: OwnerLeaseStatus | 'ALL';
  label: string;
  activeFilter: OwnerLeaseStatus | 'ALL';
  setFilter: (v: OwnerLeaseStatus | 'ALL') => void;
}) {
  const active = activeFilter === id;
  return (
    <TouchableOpacity
      style={[styles.filterPill, active && styles.filterPillActive]}
      onPress={() => setFilter(id)}
      activeOpacity={0.75}
    >
      {active && (
        <LinearGradient colors={['#0891b2', '#0072ff']} style={StyleSheet.absoluteFillObject} />
      )}
      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Lease Card ────────────────────────────────────────────────────────────────
function LeaseCard({
  lease,
  isDesktop,
  onOpenInventory,
  index,
}: {
  lease: OwnerLeaseSummary;
  isDesktop: boolean;
  onOpenInventory: () => void;
  index: number;
}) {
  const cfg = STATUS_CONFIG[lease.status];
  const isMoveOut = lease.status === 'ENDING_SOON' || lease.status === 'ENDED';
  const actionLabel = isMoveOut ? 'Verify Move-Out' : 'Assign Inventory';
  const actionIcon = isMoveOut ? 'exit-to-app' : 'inventory';

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const press = () => Animated.sequence([
    Animated.timing(scaleAnim, { toValue: 0.975, duration: 80, useNativeDriver: true }),
    Animated.timing(scaleAnim, { toValue: 1,     duration: 150, useNativeDriver: true }),
  ]).start();

  if (isDesktop) {
    // Desktop: horizontal row layout
    return (
      <BlurView intensity={45} tint="light" style={styles.cardDesktop}>
        <View style={styles.cardDesktopLeft}>
          <TenantAvatar name={lease.tenantName} status={lease.status} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.leaseId}>{lease.id}</Text>
            <Text style={styles.tenantName}>{lease.tenantName}</Text>
            <Text style={styles.tenantPhone}>{lease.tenantPhone}</Text>
          </View>
        </View>
        <View style={styles.cardDesktopCol}>
          <Text style={styles.colLabel}>PROPERTY / UNIT</Text>
          <Text style={styles.colValue}>{lease.propertyName}</Text>
          <Text style={styles.colMuted}>Unit {lease.unitNumber} · {lease.floorLabel}</Text>
        </View>
        <View style={styles.cardDesktopCol}>
          <Text style={styles.colLabel}>TENURE</Text>
          <Text style={styles.colValue}>Move-in {lease.moveInDate}</Text>
          <Text style={styles.colMuted}>{lease.moveOutDate ? `Out ${lease.moveOutDate}` : 'Open-ended'}</Text>
        </View>
        <View style={styles.cardDesktopCol}>
          <Text style={styles.colLabel}>RENT</Text>
          <Text style={[styles.colValue, { color: '#0891b2' }]}>{lease.rentAmount}<Text style={styles.colMuted}>/mo</Text></Text>
          <Text style={styles.colMuted}>Dep. {lease.securityDeposit}</Text>
        </View>
        <View style={styles.cardDesktopRight}>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: cfg.dotColor }]} />
            <Text style={[styles.statusText, { color: cfg.fg }]}>{cfg.label}</Text>
          </View>
          <TouchableOpacity style={styles.actionBtnWrapper} onPress={onOpenInventory} activeOpacity={0.82}>
            <LinearGradient
              colors={isMoveOut ? ['#dc2626', '#ef4444'] : ['#0891b2', '#0072ff']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.actionBtn}
            >
              <MaterialIcons name={actionIcon as any} size={15} color="#fff" />
              <Text style={styles.actionBtnText}>{actionLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </BlurView>
    );
  }

  // Mobile: premium card
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity activeOpacity={1} onPress={press}>
        <BlurView intensity={50} tint="light" style={styles.cardMobile}>
          {/* Color accent top strip */}
          <LinearGradient
            colors={lease.status === 'ACTIVE' ? ['#059669', '#10b981'] :
                    lease.status === 'UPCOMING' ? ['#4f46e5', '#6366f1'] :
                    lease.status === 'ENDING_SOON' ? ['#dc2626', '#ef4444'] :
                    ['#6b7280', '#9ca3af']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.cardTopStripe}
          />

          {/* Card header: avatar + identity + status */}
          <View style={styles.cardHeader}>
            <TenantAvatar name={lease.tenantName} status={lease.status} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.leaseId}>{lease.id}</Text>
              <Text style={styles.tenantName}>{lease.tenantName}</Text>
              <Text style={styles.tenantPhone}>{lease.tenantPhone}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: cfg.dotColor }]} />
              <Text style={[styles.statusText, { color: cfg.fg }]}>{cfg.label}</Text>
            </View>
          </View>

          {/* Info grid: 2 columns */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCell}>
              <View style={styles.infoCellIcon}>
                <MaterialIcons name="location-city" size={13} color="#0891b2" />
              </View>
              <Text style={styles.infoLabel}>Property</Text>
              <Text style={styles.infoValue}>{lease.propertyName}</Text>
              <Text style={styles.infoMuted}>Unit {lease.unitNumber} · {lease.floorLabel}</Text>
            </View>
            <View style={[styles.infoCell, styles.infoCellRight]}>
              <View style={styles.infoCellIcon}>
                <MaterialIcons name="attach-money" size={13} color="#059669" />
              </View>
              <Text style={styles.infoLabel}>Monthly Rent</Text>
              <Text style={[styles.infoValue, { color: '#0891b2' }]}>{lease.rentAmount}</Text>
              <Text style={styles.infoMuted}>Dep. {lease.securityDeposit}</Text>
            </View>
          </View>

          {/* Tenure row */}
          <View style={styles.tenureRow}>
            <MaterialIcons name="date-range" size={14} color="#849495" />
            <Text style={styles.tenureText}>
              {lease.moveInDate} → {lease.moveOutDate || 'Open-ended'}
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Action row */}
          <View style={styles.cardFooter}>
            <View style={styles.inventoryMeta}>
              <MaterialIcons name="check-box" size={14} color="#6b7280" />
              <Text style={styles.inventoryMetaText}>
                {lease.assignedInventoryCount} assigned · {lease.pendingChecklistCount} pending
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionBtnWrapper}
              onPress={onOpenInventory}
              activeOpacity={0.82}
            >
              <LinearGradient
                colors={isMoveOut ? ['#dc2626', '#ef4444'] : ['#0891b2', '#0072ff']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.actionBtn}
              >
                <MaterialIcons name={actionIcon as any} size={15} color="#fff" />
                <Text style={styles.actionBtnText}>{actionLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
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

  const openInventory = (lease: OwnerLeaseSummary) => {
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
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {isDesktop && <DesktopNavBar title="Lease Operations" />}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop ? styles.scrollContentDesktop : { paddingTop: 88 },
          ]}
        >
          {/* ── Desktop header ── */}
          {isDesktop && (
            <View style={styles.desktopHeader}>
              <View>
                <Text style={styles.kicker}>LEASE OPERATIONS</Text>
                <Text style={styles.title}>Owner Leases</Text>
                <Text style={styles.subtitle}>
                  Track every tenancy, assign move-in inventory, and verify move-outs from one place.
                </Text>
              </View>
              <TouchableOpacity style={styles.createBtnWrapper} activeOpacity={0.82}>
                <LinearGradient colors={['#0891b2', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtn}>
                  <MaterialIcons name="add" size={18} color="#fff" />
                  <Text style={styles.createBtnText}>Create Lease</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Stats row ── */}
          <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
            {ownerLeaseStats.map((s) => <StatPill key={s.label} stat={s} />)}
          </View>

          {/* ── Panel ── */}
          <BlurView intensity={65} tint="light" style={styles.panel}>
            {/* Panel header */}
            <View style={styles.panelTop}>
              <View style={styles.panelTitleRow}>
                <Text style={styles.panelTitle}>Lease Registry</Text>
                <Text style={styles.panelSubtitle}>{filteredLeases.length} of {ownerLeases.length} leases</Text>
              </View>
              {/* Search */}
              <View style={styles.searchBox}>
                <MaterialIcons name="search" size={18} color="#849495" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search tenant, unit, ID..."
                  placeholderTextColor="#a0aab2"
                  style={styles.searchInput}
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <MaterialIcons name="close" size={16} color="#849495" />
                  </TouchableOpacity>
                )}
              </View>
              {/* Filters */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {([
                  { id: 'ALL', label: 'All' },
                  { id: 'ACTIVE', label: 'Active' },
                  { id: 'UPCOMING', label: 'Upcoming' },
                  { id: 'ENDING_SOON', label: 'Move-outs' },
                  { id: 'ENDED', label: 'Ended' },
                ] as const).map(f => (
                  <FilterPill key={f.id} id={f.id as any} label={f.label} activeFilter={statusFilter} setFilter={setStatusFilter} />
                ))}
              </ScrollView>
            </View>

            {/* Lease list */}
            <View style={styles.leaseList}>
              {filteredLeases.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="search-off" size={48} color="#d1d5db" />
                  <Text style={styles.emptyTitle}>No leases found</Text>
                  <Text style={styles.emptySubtitle}>Try adjusting your search or filter</Text>
                </View>
              ) : (
                filteredLeases.map((lease, i) => (
                  <LeaseCard
                    key={lease.id}
                    lease={lease}
                    isDesktop={isDesktop}
                    onOpenInventory={() => openInventory(lease)}
                    index={i}
                  />
                ))
              )}
            </View>
          </BlurView>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120, gap: 18 },
  scrollContentDesktop: { padding: 32, maxWidth: 1280, width: '100%', alignSelf: 'center' },

  // Desktop header
  desktopHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, marginBottom: 4 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: '#0891b2', marginBottom: 6 },
  title: { fontSize: 32, fontWeight: '800', color: '#0b1c30', lineHeight: 38 },
  subtitle: { fontSize: 15, color: '#5b6b6d', marginTop: 8, lineHeight: 22, maxWidth: 600 },
  createBtnWrapper: { borderRadius: 14, overflow: 'hidden' },
  createBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 8 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Stats
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statsRowDesktop: { flexWrap: 'nowrap' },
  statCard: {
    flex: 1,
    flexBasis: '46%',
    minHeight: 100,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.35)',
    padding: 16,
    overflow: 'hidden',
    gap: 2,
  },
  statValue: { fontSize: 28, fontWeight: '900', color: '#0891b2', fontFamily: 'Inter' },
  statLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: '#6b7280', textTransform: 'uppercase' },
  statHelper: { fontSize: 12, color: '#849495', marginTop: 2 },

  // Panel
  panel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  panelTop: { padding: 16, gap: 12 },
  panelTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { fontSize: 18, fontWeight: '800', color: '#0b1c30' },
  panelSubtitle: { fontSize: 12, color: '#849495', fontWeight: '600' },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0b1c30' },

  // Filters
  filterRow: { gap: 8, paddingBottom: 2 },
  filterPill: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
  },
  filterPillActive: { borderColor: 'transparent' },
  filterPillText: { color: '#5b6b6d', fontWeight: '700', fontSize: 12 },
  filterPillTextActive: { color: '#fff' },

  // Lease list
  leaseList: { padding: 12, gap: 12 },
  emptyState: { padding: 48, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6b7280' },
  emptySubtitle: { fontSize: 13, color: '#9ca3af' },

  // Mobile card
  cardMobile: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  cardTopStripe: { height: 4, width: '100%' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  cardHeaderText: { flex: 1 },

  // Avatar
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarInitials: { color: '#fff', fontSize: 17, fontWeight: '900' },

  // Lease identity text
  leaseId: { fontSize: 11, fontWeight: '800', color: '#0891b2', letterSpacing: 0.5 },
  tenantName: { fontSize: 16, fontWeight: '800', color: '#0b1c30', marginTop: 2 },
  tenantPhone: { fontSize: 12, color: '#849495', marginTop: 1 },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },

  // Info grid
  infoGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 0,
    marginBottom: 12,
  },
  infoCell: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 14,
    padding: 12,
    gap: 2,
    marginRight: 6,
  },
  infoCellRight: { marginRight: 0, marginLeft: 6 },
  infoCellIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(8,145,178,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.5, textTransform: 'uppercase' },
  infoValue: { fontSize: 14, fontWeight: '800', color: '#0b1c30', marginTop: 2 },
  infoMuted: { fontSize: 12, color: '#849495', marginTop: 1 },

  // Tenure row
  tenureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tenureText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },

  // Card footer
  cardDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.055)', marginHorizontal: 16 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inventoryMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inventoryMetaText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  actionBtnWrapper: { borderRadius: 12, overflow: 'hidden' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Desktop card
  cardDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
    padding: 18,
    gap: 16,
  },
  cardDesktopLeft: { flex: 1.6, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 220 },
  cardDesktopCol: { flex: 1.1, minWidth: 160 },
  cardDesktopRight: { flex: 1.2, alignItems: 'flex-end', gap: 10, minWidth: 190 },
  colLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  colValue: { fontSize: 14, fontWeight: '800', color: '#0b1c30' },
  colMuted: { fontSize: 12, color: '#849495', marginTop: 2, fontWeight: '500' },
});
