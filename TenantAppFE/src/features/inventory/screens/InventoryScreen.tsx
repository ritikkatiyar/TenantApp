import React, { useMemo, useState } from 'react';
import {
  Image,
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
import { useLocalSearchParams } from 'expo-router';
import { Theme } from '@/src/theme/Theme';
import { BlurView } from 'expo-blur';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import {
  assignmentItems,
  inventoryItems,
  inventoryStats,
  verificationItems,
  type AssignmentItem,
  type InventoryCondition,
  type InventoryItem,
  type VerificationItem,
} from '@/src/features/inventory/mockInventoryData';

type InventoryTab = 'registry' | 'moveIn' | 'moveOut';

const conditionColors: Record<InventoryCondition, string> = {
  Excellent: '#16a34a',
  Good: Theme.Colors.primary,
  Fair: '#d97706',
  Damaged: Theme.Colors.error,
};

const formatCurrency = (amount: number) =>
  `Rs. ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function InventoryScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const params = useLocalSearchParams<{ tab?: string; leaseId?: string }>();
  const initialTab: InventoryTab = params.tab === 'moveIn' || params.tab === 'moveOut' ? params.tab : 'registry';
  const [activeTab, setActiveTab] = useState<InventoryTab>(initialTab);
  const [query, setQuery] = useState('');
  const [serviceOnly, setServiceOnly] = useState(false);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesQuery = `${item.name} ${item.location} ${item.category} ${item.serial}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      const matchesService = !serviceOnly || item.status === 'Service Due';
      return matchesQuery && matchesService;
    });
  }, [query, serviceOnly]);

  const totalDeductions = verificationItems.reduce((sum, item) => sum + item.deduction, 0);
  const securityDeposit = 30000;
  const netRefund = securityDeposit - totalDeductions;

  return (
    <LinearGradient
      colors={Theme.Colors.backgroundGradient as [string, string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {isDesktop && <DesktopNavBar title="Inventory" />}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        >
          <View style={styles.pageHeader}>
            <View style={styles.titleBlock}>
              <Text style={styles.kicker}>INVENTORY LIFECYCLE</Text>
              <Text style={[styles.title, !isDesktop && styles.titleMobile]}>Property Inventory</Text>
              <Text style={styles.subtitle}>
                Track move-in assignment, condition evidence, move-out verification, and deposit settlement.
              </Text>
              {params.leaseId ? (
                <Text style={styles.contextLine}>Lease context: {params.leaseId}</Text>
              ) : null}
            </View>

            <View style={styles.headerActions}>
              <BlurView intensity={50} tint="light" style={styles.searchBox}>
                <MaterialIcons name="search" size={20} color={Theme.Colors.outline} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search inventory..."
                  placeholderTextColor={Theme.Colors.outline}
                  style={styles.searchInput}
                />
              </BlurView>
              <TouchableOpacity style={styles.primaryButtonWrapper} activeOpacity={0.82}>
                <LinearGradient
                  colors={['#00e0ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  <MaterialIcons name="add" size={18} color={Theme.Colors.onPrimary} />
                  <Text style={styles.primaryButtonText}>Add Item</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tabs}>
            {renderTab('registry', 'Registry', 'inventory-2', activeTab, setActiveTab)}
            {renderTab('moveIn', 'Move-In', 'how-to-reg', activeTab, setActiveTab)}
            {renderTab('moveOut', 'Settlement', 'receipt-long', activeTab, setActiveTab)}
          </View>

          {activeTab === 'registry' && (
            <RegistryView
              items={filteredItems}
              isDesktop={isDesktop}
              serviceOnly={serviceOnly}
              onToggleService={() => setServiceOnly((value) => !value)}
            />
          )}

          {activeTab === 'moveIn' && <MoveInView isDesktop={isDesktop} />}

          {activeTab === 'moveOut' && (
            <MoveOutView
              isDesktop={isDesktop}
              securityDeposit={securityDeposit}
              totalDeductions={totalDeductions}
              netRefund={netRefund}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function renderTab(
  id: InventoryTab,
  label: string,
  icon: React.ComponentProps<typeof MaterialIcons>['name'],
  activeTab: InventoryTab,
  setActiveTab: (tab: InventoryTab) => void,
) {
  const active = activeTab === id;
  return (
    <TouchableOpacity
      key={id}
      style={[styles.tab, active && styles.tabActive]}
      onPress={() => setActiveTab(id)}
      activeOpacity={0.75}
    >
      <MaterialIcons name={icon} size={18} color={active ? Theme.Colors.onPrimary : Theme.Colors.primary} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function RegistryView({
  items,
  isDesktop,
  onToggleService,
  serviceOnly,
}: {
  items: InventoryItem[];
  isDesktop: boolean;
  onToggleService: () => void;
  serviceOnly: boolean;
}) {
  return (
    <View style={styles.sectionStack}>
      <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
        {inventoryStats.map((stat) => (
          <BlurView key={stat.label} intensity={60} tint="light" style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
            <View style={styles.statIcon}>
              <MaterialIcons name={stat.icon} size={20} color={stat.label === 'Maintenance Due' ? Theme.Colors.error : Theme.Colors.primary} />
            </View>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={[styles.statValue, stat.label === 'Maintenance Due' && styles.statValueError]}>{stat.value}</Text>
            <Text style={styles.statHelper}>{stat.helper}</Text>
          </BlurView>
        ))}
      </View>

      <BlurView intensity={65} tint="light" style={styles.panel}>
        <View style={[styles.panelHeader, !isDesktop && styles.panelHeaderMobile]}>
          <View>
            <Text style={styles.panelTitle}>Itemized Registry</Text>
            <Text style={styles.panelSubtitle}>Showing {items.length} of {inventoryItems.length} assets</Text>
          </View>
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={[styles.filterPill, serviceOnly && styles.filterPillActive]}
              onPress={onToggleService}
              activeOpacity={0.75}
            >
              <MaterialIcons name="handyman" size={17} color={serviceOnly ? Theme.Colors.onPrimary : Theme.Colors.primary} />
              <Text style={[styles.filterPillText, serviceOnly && styles.filterPillTextActive]}>Due for Service</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.75}>
              <MaterialIcons name="download" size={20} color={Theme.Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={isDesktop ? styles.registryTable : styles.registryCards}>
          {items.map((item) =>
            isDesktop ? <DesktopRegistryRow key={item.id} item={item} /> : <MobileInventoryCard key={item.id} item={item} />,
          )}
        </View>
      </BlurView>
    </View>
  );
}

function DesktopRegistryRow({ item }: { item: InventoryItem }) {
  return (
    <View style={[styles.tableRow, item.status === 'Service Due' && styles.serviceRow]}>
      <View style={[styles.tableCell, styles.itemCell]}>
        <Image source={{ uri: item.image }} style={styles.itemThumb} />
        <View style={styles.itemText}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemMeta}>SN: {item.serial}</Text>
        </View>
      </View>
      <View style={styles.tableCell}>
        <Text style={styles.categoryPill}>{item.category}</Text>
      </View>
      <View style={styles.tableCell}>
        <Text style={styles.cellText}>{item.location}</Text>
      </View>
      <View style={styles.tableCell}>
        <ConditionDot condition={item.condition} />
      </View>
      <View style={styles.tableCell}>
        <StatusBadge status={item.status} />
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <MaterialIcons name="more-vert" size={20} color={Theme.Colors.outline} />
      </TouchableOpacity>
    </View>
  );
}

function MobileInventoryCard({ item }: { item: InventoryItem }) {
  return (
    <BlurView intensity={45} tint="light" style={[styles.mobileCard, item.status === 'Service Due' && styles.serviceRow]}>
      <Image source={{ uri: item.image }} style={styles.mobileCardImage} />
      <View style={styles.mobileCardBody}>
        <View style={styles.mobileCardTop}>
          <View style={styles.iconSquare}>
            <MaterialIcons name={item.icon} size={20} color={Theme.Colors.primary} />
          </View>
          <StatusBadge status={item.status} />
        </View>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMeta}>{item.location} - {item.serial}</Text>
        <View style={styles.mobileCardFooter}>
          <ConditionDot condition={item.condition} />
          <Text style={styles.itemValue}>{item.value}</Text>
        </View>
      </View>
    </BlurView>
  );
}

function MoveInView({ isDesktop }: { isDesktop: boolean }) {
  const selectedCount = assignmentItems.filter((item) => item.assignmentStatus !== 'Unselected').length;
  const photoCount = assignmentItems.reduce((sum, item) => sum + item.photoCount, 0);

  return (
    <View style={styles.sectionStack}>
      <View style={styles.leaseBanner}>
        <View>
          <Text style={styles.bannerKicker}>NEW MOVE-IN ASSIGNMENT</Text>
          <Text style={styles.bannerTitle}>Assignment for Lease #L-8824</Text>
          <Text style={styles.bannerMeta}>Tenant: Jordan Mitchell - Unit 402-B - Move-in: Jul 20, 2026</Text>
        </View>
        <View style={styles.progressBox}>
          <Text style={styles.progressText}>{selectedCount}/9 Items</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(selectedCount / 9) * 100}%` }]} />
          </View>
        </View>
      </View>

      <View style={[styles.workflowGrid, isDesktop && styles.workflowGridDesktop]}>
        <View style={styles.workflowMain}>
          <View style={styles.workflowHeader}>
            <Text style={styles.panelTitle}>Inventory Checklist</Text>
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.smallButton}>
                <Text style={styles.smallButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton}>
                <Text style={styles.smallButtonText}>Filter Rooms</Text>
              </TouchableOpacity>
            </View>
          </View>

          {assignmentItems.map((item) => (
            <AssignmentCard key={item.id} item={item} />
          ))}
        </View>

        <BlurView intensity={65} tint="light" style={styles.summaryRail}>
          <Text style={styles.panelTitle}>Assignment Summary</Text>
          <SummaryLine label="Total Selected Items" value={`${selectedCount} Items`} />
          <SummaryLine label="Documented Photos" value={`${photoCount} Photos`} />
          <SummaryLine label="Requires Attention" value="1 Item" danger />
          <View style={styles.dashedDivider} />
          <Text style={styles.railLabel}>CONDITION PROFILE</Text>
          <SummaryLine label="Kitchen Appliances" value="98/100" />
          <SummaryLine label="Living Fixtures" value="Draft" />
          <TouchableOpacity style={styles.primaryWideButtonWrapper} activeOpacity={0.82}>
            <LinearGradient
              colors={['#00e0ff', '#0072ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryWideButton}
            >
              <MaterialIcons name="how-to-reg" size={18} color={Theme.Colors.onPrimary} />
              <Text style={styles.primaryButtonText}>Confirm Assignment</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryWideButton} activeOpacity={0.75}>
            <Text style={styles.secondaryWideButtonText}>Save as Draft</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

function AssignmentCard({ item }: { item: AssignmentItem }) {
  const selected = item.assignmentStatus !== 'Unselected';

  return (
    <BlurView intensity={45} tint="light" style={[styles.assignmentCard, !selected && styles.assignmentCardMuted]}>
      <Image source={{ uri: item.image }} style={styles.assignmentImage} />
      <View style={styles.assignmentContent}>
        <View style={styles.assignmentHeader}>
          <View style={styles.itemText}>
            <Text style={styles.itemName}>{item.location}: {item.name}</Text>
            <Text style={styles.itemMeta}>Serial: {item.serial} - Last inspected: 2 months ago</Text>
          </View>
          <View style={[styles.checkbox, selected && styles.checkboxActive]}>
            {selected && <MaterialIcons name="check" size={16} color={Theme.Colors.onPrimary} />}
          </View>
        </View>

        {selected ? (
          <View style={styles.assignmentFields}>
            <View style={styles.fakeInput}>
              <Text style={styles.inputLabel}>CONDITION AT ASSIGNMENT</Text>
              <Text style={styles.fakeInputText}>{item.assignmentCondition} / Normal Wear</Text>
            </View>
            <View style={styles.fakeInput}>
              <Text style={styles.inputLabel}>ASSIGNMENT NOTES</Text>
              <Text style={styles.fakeInputText} numberOfLines={1}>{item.notes}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.mutedHint}>Select this item to assign condition details.</Text>
        )}

        <View style={styles.cardActionRow}>
          <Text style={styles.linkAction}>{item.photoCount > 0 ? `${item.photoCount} photos attached` : 'Add verification photo'}</Text>
          <Text style={styles.historyText}>Condition History</Text>
        </View>
      </View>
    </BlurView>
  );
}

function MoveOutView({
  isDesktop,
  securityDeposit,
  totalDeductions,
  netRefund,
}: {
  isDesktop: boolean;
  securityDeposit: number;
  totalDeductions: number;
  netRefund: number;
}) {
  return (
    <View style={styles.sectionStack}>
      <View style={styles.settlementHeader}>
        <View>
          <Text style={styles.kicker}>MOVE-OUT INSPECTION</Text>
          <Text style={[styles.title, styles.compactTitle]}>Move-Out Verification</Text>
          <Text style={styles.subtitle}>Review return condition and finalize settlement for Tenant: Alex Rivera.</Text>
        </View>
        <View style={styles.datePill}>
          <MaterialIcons name="calendar-today" size={16} color={Theme.Colors.primary} />
          <Text style={styles.datePillText}>Move-Out: Jul 28, 2026</Text>
        </View>
      </View>

      <View style={[styles.workflowGrid, isDesktop && styles.workflowGridDesktop]}>
        <View style={styles.workflowMain}>
          {verificationItems.map((item) => (
            <VerificationCard key={item.id} item={item} />
          ))}
        </View>

        <BlurView intensity={65} tint="light" style={styles.summaryRail}>
          <View style={styles.railTitleRow}>
            <MaterialIcons name="receipt-long" size={22} color={Theme.Colors.primary} />
            <Text style={styles.panelTitle}>Settlement Preview</Text>
          </View>
          <SummaryLine label="Security Deposit" value={formatCurrency(securityDeposit)} />
          <View style={styles.dashedDivider} />
          {verificationItems
            .filter((item) => item.deduction > 0)
            .map((item) => (
              <SummaryLine key={item.id} label={item.name} value={`-${formatCurrency(item.deduction)}`} danger />
            ))}
          <SummaryLine label="Total Deductions" value={`-${formatCurrency(totalDeductions)}`} danger />
          <View style={styles.dashedDivider} />
          <Text style={styles.railLabel}>NET REFUND</Text>
          <Text style={styles.refundValue}>{formatCurrency(netRefund)}</Text>
          <TouchableOpacity style={styles.primaryWideButtonWrapper} activeOpacity={0.82}>
            <LinearGradient
              colors={['#00e0ff', '#0072ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryWideButton}
            >
              <Text style={styles.primaryButtonText}>Confirm & Settle</Text>
              <MaterialIcons name="send" size={18} color={Theme.Colors.onPrimary} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryWideButton} activeOpacity={0.75}>
            <Text style={styles.secondaryWideButtonText}>Dispute Settlement</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

function VerificationCard({ item }: { item: VerificationItem }) {
  const statusStyle = item.status === 'Damaged' ? styles.statusDanger : item.status === 'Review' ? styles.statusReview : styles.statusGood;

  return (
    <BlurView intensity={45} tint="light" style={styles.verificationCard}>
      <View style={styles.verificationHeader}>
        <View style={styles.verificationTitleRow}>
          <View style={styles.iconSquare}>
            <MaterialIcons name={item.icon} size={20} color={Theme.Colors.primary} />
          </View>
          <View style={styles.itemText}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>{item.area}</Text>
          </View>
        </View>
        <View style={[styles.statusChip, statusStyle]}>
          <Text style={styles.statusChipText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.photoCompareGrid}>
        <PhotoPanel label="Move-In" uri={item.moveInPhoto} dark />
        <PhotoPanel label="Return" uri={item.returnPhoto} />
      </View>

      <View style={styles.damagePanel}>
        <View style={styles.damageDescription}>
          <Text style={styles.inputLabel}>DAMAGE DESCRIPTION</Text>
          <Text style={styles.damageText}>{item.damageDescription}</Text>
        </View>
        <View style={styles.deductionBox}>
          <Text style={styles.inputLabel}>ESTIMATED DEDUCTION</Text>
          <Text style={[styles.deductionValue, item.deduction > 0 && styles.deductionValueDanger]}>
            {formatCurrency(item.deduction)}
          </Text>
        </View>
      </View>
    </BlurView>
  );
}

function PhotoPanel({ label, uri, dark = false }: { label: string; uri: string; dark?: boolean }) {
  return (
    <View style={styles.photoPanel}>
      <Image source={{ uri }} style={styles.photoImage} />
      <View style={[styles.photoLabel, dark ? styles.photoLabelDark : styles.photoLabelPrimary]}>
        <Text style={styles.photoLabelText}>{label}</Text>
      </View>
    </View>
  );
}

function ConditionDot({ condition }: { condition: InventoryCondition }) {
  return (
    <View style={styles.conditionRow}>
      <View style={[styles.conditionDot, { backgroundColor: conditionColors[condition] }]} />
      <Text style={styles.conditionText}>{condition}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: InventoryItem['status'] }) {
  const danger = status === 'Service Due';
  return (
    <View style={[styles.statusBadge, danger && styles.statusBadgeDanger]}>
      <Text style={[styles.statusBadgeText, danger && styles.statusBadgeTextDanger]}>{status}</Text>
    </View>
  );
}

function SummaryLine({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.summaryLine}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, danger && styles.summaryValueDanger]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120, gap: 22 },
  scrollContentDesktop: { padding: 32, maxWidth: 1240, width: '100%', alignSelf: 'center' },
  pageHeader: { gap: 18 },
  titleBlock: { maxWidth: 720 },
  kicker: { fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: '700', lineHeight: 14, letterSpacing: 1.2, color: Theme.Colors.primary, textTransform: 'uppercase' },
  title: { fontFamily: 'Manrope', fontSize: 32, fontWeight: '800', lineHeight: 38, color: Theme.Colors.onSurface, marginTop: 6 },
  compactTitle: { fontSize: 30 },
  titleMobile: { fontSize: 30, lineHeight: 36 },
  subtitle: { fontFamily: 'Inter', fontSize: 16, fontWeight: '400', lineHeight: 24, color: Theme.Colors.onSurfaceVariant, marginTop: 8 },
  contextLine: { color: Theme.Colors.primary, fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: '800', marginTop: 8 },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  searchBox: {
    minWidth: 260,
    flex: 1,
    maxWidth: 420,
    height: 48,
    borderRadius: Theme.Rounded.lg,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  searchInput: { flex: 1, color: Theme.Colors.onSurface, fontSize: 15 },
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
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tab: {
    height: 42,
    borderRadius: Theme.Rounded.full,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
  },
  tabActive: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },
  tabText: { color: Theme.Colors.primary, fontWeight: '800', fontSize: 13 },
  tabTextActive: { color: Theme.Colors.onPrimary },
  sectionStack: { gap: 18 },
  statsGrid: { gap: 12 },
  statsGridDesktop: { flexDirection: 'row' },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
    borderRadius: Theme.Rounded.lg,
    padding: 16,
    minHeight: 118,
    overflow: 'hidden',
  },
  statCardDesktop: { flex: 1 },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,104,117,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: { fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: '700', lineHeight: 14, letterSpacing: 1.2, color: Theme.Colors.onSurfaceVariant, textTransform: 'uppercase' },
  statValue: { fontSize: 34, fontWeight: '800', color: Theme.Colors.primary, marginTop: 5 },
  statValueError: { color: Theme.Colors.error },
  statHelper: { fontSize: 13, color: Theme.Colors.onSurfaceVariant, marginTop: 2 },
  panel: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
    borderRadius: Theme.Rounded.lg,
    overflow: 'hidden',
  },
  panelHeader: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: Theme.Colors.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  panelHeaderMobile: { alignItems: 'flex-start', flexDirection: 'column' },
  panelTitle: { fontSize: 20, fontWeight: '800', color: Theme.Colors.onSurface },
  panelSubtitle: { fontSize: 13, color: Theme.Colors.onSurfaceVariant, marginTop: 3 },
  filterActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  filterPill: {
    height: 38,
    borderRadius: Theme.Rounded.full,
    paddingHorizontal: 13,
    backgroundColor: Theme.Colors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  filterPillActive: { backgroundColor: Theme.Colors.primary },
  filterPillText: { color: Theme.Colors.primary, fontWeight: '700', fontSize: 12 },
  filterPillTextActive: { color: Theme.Colors.onPrimary },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Theme.Rounded.lg,
    backgroundColor: Theme.Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registryTable: { paddingVertical: 4 },
  registryCards: { padding: 14, gap: 12 },
  tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 78, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: Theme.Colors.surfaceVariant },
  serviceRow: { backgroundColor: 'rgba(186,26,26,0.055)' },
  tableCell: { flex: 1, justifyContent: 'center' },
  itemCell: { flex: 2.1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemThumb: { width: 46, height: 46, borderRadius: Theme.Rounded.lg, backgroundColor: Theme.Colors.surfaceVariant },
  itemText: { flex: 1, minWidth: 0 },
  itemName: { color: Theme.Colors.onSurface, fontWeight: '800', fontSize: 15 },
  itemMeta: { color: Theme.Colors.outline, fontSize: 12, marginTop: 3 },
  categoryPill: { alignSelf: 'flex-start', color: Theme.Colors.onSurfaceVariant, backgroundColor: Theme.Colors.surfaceContainerHigh, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Theme.Rounded.full, fontSize: 12, fontWeight: '700' },
  cellText: { color: Theme.Colors.onSurfaceVariant, fontSize: 13, fontWeight: '600' },
  moreButton: { padding: 8 },
  mobileCard: { backgroundColor: Theme.Colors.glassFill, borderRadius: Theme.Rounded.lg, borderWidth: 1, borderColor: Theme.Colors.glassStroke, overflow: 'hidden' },
  mobileCardImage: { width: '100%', height: 150, backgroundColor: Theme.Colors.surfaceVariant },
  mobileCardBody: { padding: 14, gap: 10 },
  mobileCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconSquare: { width: 40, height: 40, borderRadius: Theme.Rounded.lg, backgroundColor: Theme.Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  mobileCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemValue: { fontFamily: 'JetBrains Mono', color: Theme.Colors.onSurface, fontWeight: '800' },
  conditionRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  conditionDot: { width: 8, height: 8, borderRadius: 4 },
  conditionText: { color: Theme.Colors.onSurface, fontWeight: '700', fontSize: 13 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: Theme.Colors.secondaryFixed, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Theme.Rounded.full },
  statusBadgeDanger: { backgroundColor: Theme.Colors.errorContainer },
  statusBadgeText: { color: Theme.Colors.secondary, fontSize: 11, fontWeight: '800' },
  statusBadgeTextDanger: { color: Theme.Colors.onErrorContainer },
  leaseBanner: {
    backgroundColor: Theme.Colors.primary,
    borderRadius: Theme.Rounded.lg,
    padding: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 18,
    overflow: 'hidden',
  },
  bannerKicker: { fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: '700', lineHeight: 14, letterSpacing: 1.2, color: 'rgba(255,255,255,0.75)' },
  bannerTitle: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: Theme.Colors.onPrimary, marginTop: 4 },
  bannerMeta: { color: 'rgba(255,255,255,0.82)', marginTop: 8, fontSize: 14 },
  progressBox: { minWidth: 180, justifyContent: 'flex-end', gap: 9 },
  progressText: { color: Theme.Colors.onPrimary, fontFamily: 'JetBrains Mono', fontWeight: '800', textAlign: 'right' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.24)', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Theme.Colors.inversePrimary },
  workflowGrid: { gap: 18 },
  workflowGridDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  workflowMain: { flex: 1.9, gap: 12 },
  workflowHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  smallButton: { backgroundColor: Theme.Colors.surfaceContainerHigh, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Theme.Rounded.lg },
  smallButtonText: { color: Theme.Colors.onSurfaceVariant, fontWeight: '800', fontSize: 12 },
  assignmentCard: { backgroundColor: Theme.Colors.glassFill, borderWidth: 1, borderColor: Theme.Colors.glassStroke, borderRadius: Theme.Rounded.lg, padding: 12, flexDirection: 'row', gap: 14, overflow: 'hidden' },
  assignmentCardMuted: { opacity: 0.62, borderStyle: 'dashed' },
  assignmentImage: { width: 92, height: 92, borderRadius: Theme.Rounded.lg, backgroundColor: Theme.Colors.surfaceVariant },
  assignmentContent: { flex: 1, gap: 12 },
  assignmentHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: Theme.Colors.outline, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },
  assignmentFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fakeInput: { flex: 1, minWidth: 190, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.outlineVariant, borderRadius: Theme.Rounded.lg, padding: 10 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: Theme.Colors.outline, letterSpacing: 0.7 },
  fakeInputText: { color: Theme.Colors.onSurface, fontWeight: '700', marginTop: 5, fontSize: 13 },
  mutedHint: { color: Theme.Colors.onSurfaceVariant, fontSize: 13 },
  cardActionRow: { borderTopWidth: 1, borderTopColor: Theme.Colors.surfaceVariant, paddingTop: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  linkAction: { color: Theme.Colors.primary, fontWeight: '800', fontSize: 12 },
  historyText: { color: Theme.Colors.onSurfaceVariant, fontSize: 12, fontWeight: '700' },
  summaryRail: { flex: 1, minWidth: 280, backgroundColor: 'rgba(255, 255, 255, 0.45)', borderWidth: 1, borderColor: Theme.Colors.glassStroke, borderRadius: Theme.Rounded.lg, padding: 18, gap: 14, overflow: 'hidden' },
  summaryLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  summaryLabel: { color: Theme.Colors.onSurfaceVariant, fontSize: 13, flex: 1 },
  summaryValue: { color: Theme.Colors.onSurface, fontWeight: '800', fontSize: 13, fontFamily: 'JetBrains Mono' },
  summaryValueDanger: { color: Theme.Colors.error },
  dashedDivider: { height: 1, borderStyle: 'dashed', borderTopWidth: 1, borderTopColor: Theme.Colors.outlineVariant, marginVertical: 3 },
  railLabel: { fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: '700', lineHeight: 14, letterSpacing: 1.2, color: Theme.Colors.primary },
  primaryWideButtonWrapper: { minHeight: 48, borderRadius: Theme.Rounded.lg, overflow: 'hidden', marginTop: 4 },
  primaryWideButton: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  secondaryWideButton: { minHeight: 46, borderRadius: Theme.Rounded.lg, borderWidth: 1, borderColor: Theme.Colors.primary, alignItems: 'center', justifyContent: 'center' },
  secondaryWideButtonText: { color: Theme.Colors.primary, fontWeight: '800', fontSize: 13 },
  settlementHeader: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' },
  datePill: { backgroundColor: 'rgba(255, 255, 255, 0.74)', borderRadius: Theme.Rounded.lg, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  datePillText: { color: Theme.Colors.onSurface, fontWeight: '800', fontSize: 12 },
  verificationCard: { backgroundColor: Theme.Colors.glassFill, borderWidth: 1, borderColor: Theme.Colors.glassStroke, borderRadius: Theme.Rounded.lg, padding: 14, gap: 14, overflow: 'hidden' },
  verificationHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  verificationTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusChip: { borderRadius: Theme.Rounded.full, paddingHorizontal: 10, paddingVertical: 6 },
  statusDanger: { backgroundColor: Theme.Colors.errorContainer },
  statusReview: { backgroundColor: Theme.Colors.tertiaryFixed },
  statusGood: { backgroundColor: Theme.Colors.primaryFixed },
  statusChipText: { color: Theme.Colors.onSurface, fontSize: 11, fontWeight: '800' },
  photoCompareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoPanel: { flex: 1, minWidth: 220, height: 190, borderRadius: Theme.Rounded.lg, overflow: 'hidden', backgroundColor: Theme.Colors.surfaceVariant },
  photoImage: { width: '100%', height: '100%' },
  photoLabel: { position: 'absolute', top: 10, left: 10, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  photoLabelDark: { backgroundColor: 'rgba(0,0,0,0.55)' },
  photoLabelPrimary: { backgroundColor: 'rgba(0,104,117,0.88)' },
  photoLabelText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  damagePanel: { backgroundColor: Theme.Colors.surfaceContainerLow, borderRadius: Theme.Rounded.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: Theme.Colors.outlineVariant, padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  damageDescription: { flex: 1, minWidth: 220 },
  damageText: { color: Theme.Colors.onSurface, lineHeight: 20, marginTop: 5, fontSize: 13 },
  deductionBox: { minWidth: 150 },
  deductionValue: { fontFamily: 'JetBrains Mono', color: Theme.Colors.onSurfaceVariant, fontSize: 18, fontWeight: '800', marginTop: 6 },
  deductionValueDanger: { color: Theme.Colors.error },
  railTitleRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  refundValue: { fontSize: 34, fontWeight: '800', color: Theme.Colors.primary, fontFamily: 'JetBrains Mono' },
});
