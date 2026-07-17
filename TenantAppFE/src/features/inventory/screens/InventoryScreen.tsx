import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
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

const CONDITION_CONFIG: Record<InventoryCondition, { color: string; bg: string }> = {
  Excellent: { color: '#059669', bg: 'rgba(5,150,105,0.1)'  },
  Good:      { color: '#0891b2', bg: 'rgba(8,145,178,0.1)'  },
  Fair:      { color: '#d97706', bg: 'rgba(217,119,6,0.1)'  },
  Damaged:   { color: '#dc2626', bg: 'rgba(220,38,38,0.1)'  },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  Assigned:      { color: '#059669', bg: 'rgba(5,150,105,0.1)',   dot: '#10b981' },
  Available:     { color: '#0891b2', bg: 'rgba(8,145,178,0.1)',   dot: '#06b6d4' },
  Shared:        { color: '#4f46e5', bg: 'rgba(79,70,229,0.1)',   dot: '#6366f1' },
  'Service Due': { color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  dot: '#ef4444' },
};

const STAT_GRAD: [string, string][] = [
  ['#0891b2', '#06b6d4'],
  ['#dc2626', '#ef4444'],
  ['#4f46e5', '#7c3aed'],
  ['#059669', '#10b981'],
];
const STAT_COLORS = ['#0891b2', '#dc2626', '#4f46e5', '#059669'];

const formatCurrency = (amount: number) =>
  `Rs. ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// ─── Condition pill ────────────────────────────────────────────────────────────
function ConditionPill({ condition }: { condition: InventoryCondition }) {
  const cfg = CONDITION_CONFIG[condition];
  return (
    <View style={[styles.conditionPill, { backgroundColor: cfg.bg }]}>
      <View style={[styles.conditionDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.conditionText, { color: cfg.color }]}>{condition}</Text>
    </View>
  );
}

// ─── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', dot: '#9ca3af' };
  return (
    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.statusText, { color: cfg.color }]}>{status}</Text>
    </View>
  );
}

// ─── Summary line ──────────────────────────────────────────────────────────────
function SummaryLine({ label, value, danger = false, bold = false }: {
  label: string; value: string; danger?: boolean; bold?: boolean;
}) {
  return (
    <View style={styles.summaryLine}>
      <Text style={[styles.summaryLabel, bold && { fontWeight: '800', color: '#0b1c30' }]}>{label}</Text>
      <Text style={[styles.summaryValue, danger && { color: '#dc2626' }, bold && { fontSize: 15 }]}>{value}</Text>
    </View>
  );
}

// ─── Mobile inventory card ─────────────────────────────────────────────────────
function MobileInventoryCard({ item }: { item: InventoryItem }) {
  const serviceDue = item.status === 'Service Due';
  return (
    <BlurView intensity={48} tint="light" style={[styles.inventoryCard, serviceDue && styles.inventoryCardAlert]}>
      {serviceDue && (
        <LinearGradient colors={['#dc2626', '#ef4444']} style={styles.alertStripe} />
      )}
      <View style={styles.inventoryCardInner}>
        <Image source={{ uri: item.image }} style={styles.inventoryThumb} />
        <View style={styles.inventoryContent}>
          <View style={styles.inventoryTopRow}>
            <View style={styles.inventoryCategoryPill}>
              <MaterialIcons name={item.icon} size={11} color="#5b6b6d" />
              <Text style={styles.inventoryCategoryText}>{item.category}</Text>
            </View>
            <StatusPill status={item.status} />
          </View>
          <Text style={styles.inventoryName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.inventoryMeta} numberOfLines={1}>{item.location} · {item.serial}</Text>
          <View style={styles.inventoryFooter}>
            <ConditionPill condition={item.condition} />
            <Text style={styles.inventoryValue}>{item.value}</Text>
          </View>
        </View>
      </View>
      {serviceDue && (
        <View style={styles.serviceAlertBar}>
          <MaterialIcons name="warning-amber" size={13} color="#dc2626" />
          <Text style={styles.serviceAlertText}>Service overdue · {item.nextService}</Text>
        </View>
      )}
    </BlurView>
  );
}

// ─── Desktop registry row ──────────────────────────────────────────────────────
function DesktopRegistryRow({ item }: { item: InventoryItem }) {
  return (
    <View style={[styles.tableRow, item.status === 'Service Due' && styles.tableRowAlert]}>
      <View style={[styles.tableCell, styles.itemCell]}>
        <Image source={{ uri: item.image }} style={styles.itemThumb} />
        <View style={styles.itemTextBlock}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemMeta}>SN: {item.serial}</Text>
        </View>
      </View>
      <View style={styles.tableCell}>
        <View style={styles.categoryChip}>
          <MaterialIcons name={item.icon} size={13} color="#5b6b6d" />
          <Text style={styles.categoryChipText}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.tableCell}>
        <Text style={styles.cellText}>{item.location}</Text>
      </View>
      <View style={styles.tableCell}>
        <ConditionPill condition={item.condition} />
      </View>
      <View style={styles.tableCell}>
        <StatusPill status={item.status} />
      </View>
      <View style={[styles.tableCell, { alignItems: 'flex-end' }]}>
        <Text style={styles.valueText}>{item.value}</Text>
      </View>
      <TouchableOpacity style={styles.moreBtn}>
        <MaterialIcons name="more-vert" size={20} color="#9ca3af" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Assignment card ───────────────────────────────────────────────────────────
function AssignmentCard({ item }: { item: AssignmentItem }) {
  const selected = item.assignmentStatus !== 'Unselected';
  const isDraft  = item.assignmentStatus === 'Draft';

  return (
    <BlurView intensity={45} tint="light" style={[styles.assignCard, !selected && styles.assignCardMuted]}>
      <View style={styles.assignHeader}>
        <View style={styles.assignIdentity}>
          <Image source={{ uri: item.image }} style={styles.assignThumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.assignName}>{item.location}: {item.name}</Text>
            <Text style={styles.assignMeta}>SN: {item.serial}</Text>
          </View>
        </View>
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <MaterialIcons name="check" size={14} color="#fff" />}
        </View>
      </View>

      {selected ? (
        <>
          <View style={styles.assignFields}>
            <View style={styles.assignField}>
              <Text style={styles.fieldLabel}>CONDITION</Text>
              <ConditionPill condition={item.assignmentCondition} />
            </View>
            <View style={styles.assignField}>
              <Text style={styles.fieldLabel}>NOTES</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>{item.notes}</Text>
            </View>
          </View>
          <View style={styles.assignFooter}>
            <TouchableOpacity style={styles.photoLink}>
              <MaterialIcons name={item.photoCount > 0 ? 'photo-library' : 'add-a-photo'} size={14} color="#0891b2" />
              <Text style={styles.photoLinkText}>
                {item.photoCount > 0 ? `${item.photoCount} photos` : 'Add photo'}
              </Text>
            </TouchableOpacity>
            {isDraft && (
              <View style={styles.draftBadge}>
                <Text style={styles.draftBadgeText}>Draft</Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <Text style={styles.assignHint}>{"Tap to select and document this item's condition"}</Text>
      )}
    </BlurView>
  );
}

// ─── Verification card ─────────────────────────────────────────────────────────
function VerificationCard({ item }: { item: VerificationItem }) {
  const isDamaged = item.status === 'Damaged';
  const isReview  = item.status === 'Review';
  const statusCfg = isDamaged
    ? { color: '#dc2626', bg: 'rgba(220,38,38,0.1)', label: 'Damaged' }
    : isReview
    ? { color: '#d97706', bg: 'rgba(217,119,6,0.1)',  label: 'Under Review' }
    : { color: '#059669', bg: 'rgba(5,150,105,0.1)',  label: 'Good' };

  return (
    <BlurView intensity={45} tint="light" style={styles.verifyCard}>
      <View style={styles.verifyHeader}>
        <View style={[styles.verifyIconCircle, { backgroundColor: statusCfg.bg }]}>
          <MaterialIcons name={item.icon} size={20} color={statusCfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.verifyName}>{item.name}</Text>
          <Text style={styles.verifyArea}>{item.area}</Text>
        </View>
        <View style={[styles.verifyBadge, { backgroundColor: statusCfg.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
          <Text style={[styles.verifyBadgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      <View style={styles.conditionCompare}>
        <View style={styles.conditionCompareItem}>
          <Text style={styles.compareLabel}>MOVE-IN</Text>
          <ConditionPill condition={item.moveInCondition} />
        </View>
        <MaterialIcons name="arrow-forward" size={18} color="#c4cdd0" />
        <View style={styles.conditionCompareItem}>
          <Text style={styles.compareLabel}>RETURN</Text>
          <ConditionPill condition={item.returnCondition} />
        </View>
      </View>

      <View style={styles.photoGrid}>
        <View style={styles.photoPanel}>
          <Image source={{ uri: item.moveInPhoto }} style={styles.photoImage} />
          <BlurView intensity={60} tint="dark" style={styles.photoTag}>
            <Text style={styles.photoTagText}>MOVE-IN</Text>
          </BlurView>
        </View>
        <View style={styles.photoPanel}>
          <Image source={{ uri: item.returnPhoto }} style={styles.photoImage} />
          <BlurView
            intensity={60}
            tint={isDamaged ? 'extraLight' : 'dark'}
            style={[styles.photoTag, isDamaged && styles.photoTagDanger]}
          >
            <Text style={[styles.photoTagText, isDamaged && { color: '#dc2626' }]}>RETURN</Text>
          </BlurView>
        </View>
      </View>

      {(isDamaged || isReview) && (
        <View style={styles.damageRow}>
          <View style={styles.damageDesc}>
            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <Text style={styles.damageText}>{item.damageDescription}</Text>
          </View>
          {item.deduction > 0 && (
            <View style={styles.deductionBox}>
              <Text style={styles.fieldLabel}>DEDUCTION</Text>
              <Text style={styles.deductionAmount}>{formatCurrency(item.deduction)}</Text>
            </View>
          )}
        </View>
      )}
    </BlurView>
  );
}

// ─── Registry view ─────────────────────────────────────────────────────────────
function RegistryView({ items, isDesktop, serviceOnly, onToggleService }: {
  items: InventoryItem[]; isDesktop: boolean; serviceOnly: boolean; onToggleService: () => void;
}) {
  return (
    <View style={styles.sectionStack}>
      <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
        {inventoryStats.map((stat, i) => (
          <BlurView key={stat.label} intensity={55} tint="light" style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
            <LinearGradient colors={STAT_GRAD[i]} style={styles.statIconCircle}>
              <MaterialIcons name={stat.icon} size={18} color="#fff" />
            </LinearGradient>
            <Text style={[styles.statValue, { color: STAT_COLORS[i] }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statHelper}>{stat.helper}</Text>
          </BlurView>
        ))}
      </View>

      <BlurView intensity={60} tint="light" style={styles.panel}>
        <View style={[styles.panelHeader, !isDesktop && styles.panelHeaderMobile]}>
          <View>
            <Text style={styles.panelTitle}>Itemized Registry</Text>
            <Text style={styles.panelSub}>{items.length} of {inventoryItems.length} assets</Text>
          </View>
          <View style={styles.panelActions}>
            <TouchableOpacity
              style={[styles.filterPill, serviceOnly && styles.filterPillActive]}
              onPress={onToggleService}
            >
              {serviceOnly && (
                <LinearGradient colors={['#dc2626', '#ef4444']} style={StyleSheet.absoluteFillObject} />
              )}
              <MaterialIcons name="handyman" size={14} color={serviceOnly ? '#fff' : '#6b7280'} />
              <Text style={[styles.filterPillText, serviceOnly && styles.filterPillTextActive]}>Service Due</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <MaterialIcons name="download" size={18} color="#849495" />
            </TouchableOpacity>
          </View>
        </View>

        {isDesktop ? (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeaderRow}>
              {['Item', 'Category', 'Location', 'Condition', 'Status', 'Value', ''].map((h, i) => (
                <View key={i} style={[styles.tableCell, i === 0 && styles.itemCell, i === 6 && { flex: 0, width: 36 }]}>
                  <Text style={styles.tableHeaderText}>{h}</Text>
                </View>
              ))}
            </View>
            {items.map(item => <DesktopRegistryRow key={item.id} item={item} />)}
          </View>
        ) : (
          <View style={styles.cardList}>
            {items.map(item => <MobileInventoryCard key={item.id} item={item} />)}
          </View>
        )}
      </BlurView>
    </View>
  );
}

// ─── Move-In view ──────────────────────────────────────────────────────────────
function MoveInView({ isDesktop }: { isDesktop: boolean }) {
  const selectedCount = assignmentItems.filter(i => i.assignmentStatus !== 'Unselected').length;
  const photoCount    = assignmentItems.reduce((s, i) => s + i.photoCount, 0);
  const progress      = selectedCount / assignmentItems.length;

  return (
    <View style={styles.sectionStack}>
      <BlurView intensity={35} tint="light" style={styles.moveBanner}>
        <LinearGradient
          colors={['rgba(8,145,178,0.85)', 'rgba(79,70,229,0.85)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.moveBannerContent}>
          <Text style={styles.moveBannerKicker}>NEW MOVE-IN ASSIGNMENT</Text>
          <Text style={styles.moveBannerTitle}>Jordan Mitchell</Text>
          <Text style={styles.moveBannerMeta}>Lease #L-8824 · Unit 402-B · Move-in Jul 20, 2026</Text>
        </View>
        <View style={styles.progressBox}>
          <Text style={styles.progressFraction}>{selectedCount}/{assignmentItems.length}</Text>
          <Text style={styles.progressSublabel}>items done</Text>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#a5f3fc', '#fff']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress * 100}%` as any }]}
            />
          </View>
        </View>
      </BlurView>

      <View style={[styles.workflowGrid, isDesktop && styles.workflowGridDesktop]}>
        <View style={styles.workflowMain}>
          <View style={styles.workflowHeader}>
            <Text style={styles.panelTitle}>Inventory Checklist</Text>
            <View style={styles.panelActions}>
              <TouchableOpacity style={styles.ghostBtn}><Text style={styles.ghostBtnText}>Select All</Text></TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn}><Text style={styles.ghostBtnText}>Filter</Text></TouchableOpacity>
            </View>
          </View>
          {assignmentItems.map(item => <AssignmentCard key={item.id} item={item} />)}
        </View>

        <BlurView intensity={65} tint="light" style={styles.rail}>
          <View style={styles.railHeader}>
            <LinearGradient colors={['#0891b2', '#0072ff']} style={styles.railIconCircle}>
              <MaterialIcons name="how-to-reg" size={18} color="#fff" />
            </LinearGradient>
            <Text style={styles.panelTitle}>Summary</Text>
          </View>
          <View style={styles.railBody}>
            <SummaryLine label="Selected Items"  value={`${selectedCount} items`} />
            <SummaryLine label="Photos Attached" value={`${photoCount} photos`} />
            <SummaryLine label="Needs Attention" value="1 item" danger />
            <View style={styles.railDivider} />
            <SummaryLine label="Kitchen Appliances" value="98/100" />
            <SummaryLine label="Living Fixtures"    value="Draft" />
          </View>
          <TouchableOpacity style={styles.primaryWideBtn} activeOpacity={0.82}>
            <LinearGradient
              colors={['#0891b2', '#0072ff']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.primaryWideBtnInner}
            >
              <MaterialIcons name="how-to-reg" size={18} color="#fff" />
              <Text style={styles.primaryWideBtnText}>Confirm Assignment</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostWideBtn}>
            <Text style={styles.ghostWideBtnText}>Save as Draft</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

// ─── Move-Out view ─────────────────────────────────────────────────────────────
function MoveOutView({ isDesktop, securityDeposit, totalDeductions, netRefund }: {
  isDesktop: boolean; securityDeposit: number; totalDeductions: number; netRefund: number;
}) {
  return (
    <View style={styles.sectionStack}>
      <BlurView intensity={35} tint="light" style={styles.moveBanner}>
        <LinearGradient
          colors={['rgba(220,38,38,0.8)', 'rgba(217,119,6,0.8)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.moveBannerContent}>
          <Text style={styles.moveBannerKicker}>MOVE-OUT INSPECTION</Text>
          <Text style={styles.moveBannerTitle}>Alex Rivera</Text>
          <Text style={styles.moveBannerMeta}>Lease #L-7142 · Unit 302-A · Move-out Jul 28, 2026</Text>
        </View>
        <View style={styles.moveOutDatePill}>
          <MaterialIcons name="event" size={16} color="#fff" />
          <Text style={styles.moveOutDateText}>Jul 28, 2026</Text>
        </View>
      </BlurView>

      <View style={[styles.workflowGrid, isDesktop && styles.workflowGridDesktop]}>
        <View style={styles.workflowMain}>
          {verificationItems.map(item => <VerificationCard key={item.id} item={item} />)}
        </View>

        <BlurView intensity={65} tint="light" style={styles.rail}>
          <View style={styles.railHeader}>
            <LinearGradient colors={['#dc2626', '#ef4444']} style={styles.railIconCircle}>
              <MaterialIcons name="receipt-long" size={18} color="#fff" />
            </LinearGradient>
            <Text style={styles.panelTitle}>Settlement</Text>
          </View>
          <View style={styles.railBody}>
            <SummaryLine label="Security Deposit"  value={formatCurrency(securityDeposit)} bold />
            <View style={styles.railDivider} />
            {verificationItems.filter(i => i.deduction > 0).map(i => (
              <SummaryLine key={i.id} label={i.name} value={`-${formatCurrency(i.deduction)}`} danger />
            ))}
            <SummaryLine label="Total Deductions" value={`-${formatCurrency(totalDeductions)}`} danger bold />
            <View style={styles.railDivider} />
          </View>
          <View style={styles.refundBlock}>
            <Text style={styles.refundLabel}>NET REFUND</Text>
            <Text style={styles.refundAmount}>{formatCurrency(netRefund)}</Text>
          </View>
          <TouchableOpacity style={styles.primaryWideBtn} activeOpacity={0.82}>
            <LinearGradient
              colors={['#059669', '#10b981']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.primaryWideBtnInner}
            >
              <Text style={styles.primaryWideBtnText}>Confirm & Settle</Text>
              <MaterialIcons name="send" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ghostWideBtn, styles.ghostWideBtnDanger]}>
            <Text style={[styles.ghostWideBtnText, { color: '#dc2626' }]}>Dispute Settlement</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function InventoryScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const params    = useLocalSearchParams<{ tab?: string; leaseId?: string }>();
  const initialTab: InventoryTab =
    params.tab === 'moveIn' || params.tab === 'moveOut' ? params.tab : 'registry';
  const [activeTab, setActiveTab]     = useState<InventoryTab>(initialTab);
  const [query, setQuery]             = useState('');
  const [serviceOnly, setServiceOnly] = useState(false);

  const filteredItems = useMemo(() =>
    inventoryItems.filter(item => {
      const matchQ = `${item.name} ${item.location} ${item.category} ${item.serial}`
        .toLowerCase().includes(query.trim().toLowerCase());
      return matchQ && (!serviceOnly || item.status === 'Service Due');
    }),
  [query, serviceOnly]);

  const totalDeductions = verificationItems.reduce((s, i) => s + i.deduction, 0);
  const securityDeposit = 30000;
  const netRefund       = securityDeposit - totalDeductions;

  const TABS: { id: InventoryTab; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
    { id: 'registry', label: 'Registry',   icon: 'inventory-2'  },
    { id: 'moveIn',   label: 'Move-In',    icon: 'how-to-reg'   },
    { id: 'moveOut',  label: 'Settlement', icon: 'receipt-long' },
  ];

  return (
    <LinearGradient
      colors={Theme.Colors.backgroundGradient as [string, string, string]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {isDesktop && <DesktopNavBar title="Inventory" />}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, isDesktop ? styles.scrollDesktop : { paddingTop: 88 }]}
        >
          {/* Desktop page header */}
          {isDesktop && (
            <View style={styles.pageHeader}>
              <View>
                <Text style={styles.kicker}>INVENTORY LIFECYCLE</Text>
                <Text style={styles.title}>Property Inventory</Text>
                <Text style={styles.subtitle}>
                  Track move-in assignment, condition evidence, verification and deposit settlement.
                </Text>
                {params.leaseId && <Text style={styles.contextLine}>Lease: {params.leaseId}</Text>}
              </View>
              <TouchableOpacity style={styles.addBtnWrapper} activeOpacity={0.82}>
                <LinearGradient colors={['#0891b2', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addBtn}>
                  <MaterialIcons name="add" size={18} color="#fff" />
                  <Text style={styles.addBtnText}>Add Item</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Mobile search + add row */}
          {!isDesktop && (
            <View style={styles.mobileTopBar}>
              <View style={styles.searchBox}>
                <MaterialIcons name="search" size={18} color="#9ca3af" />
                <TextInput
                  value={query} onChangeText={setQuery}
                  placeholder="Search inventory..."
                  placeholderTextColor="#9ca3af"
                  style={styles.searchInput}
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <MaterialIcons name="close" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.addIconBtn} activeOpacity={0.82}>
                <LinearGradient colors={['#0891b2', '#0072ff']} style={styles.addIconBtnInner}>
                  <MaterialIcons name="add" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Tab bar */}
          <View style={styles.tabBar}>
            {TABS.map(t => {
              const active = activeTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setActiveTab(t.id)}
                  activeOpacity={0.75}
                >
                  {active && (
                    <LinearGradient
                      colors={t.id === 'moveOut' ? ['#dc2626', '#ef4444'] : ['#0891b2', '#0072ff']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  )}
                  <MaterialIcons name={t.icon} size={16} color={active ? '#fff' : '#6b7280'} />
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Desktop search for registry */}
          {isDesktop && activeTab === 'registry' && (
            <View style={styles.desktopSearchRow}>
              <View style={[styles.searchBox, { maxWidth: 420 }]}>
                <MaterialIcons name="search" size={18} color="#9ca3af" />
                <TextInput
                  value={query} onChangeText={setQuery}
                  placeholder="Search inventory..."
                  placeholderTextColor="#9ca3af"
                  style={styles.searchInput}
                />
              </View>
            </View>
          )}

          {activeTab === 'registry' && (
            <RegistryView
              items={filteredItems}
              isDesktop={isDesktop}
              serviceOnly={serviceOnly}
              onToggleService={() => setServiceOnly(v => !v)}
            />
          )}
          {activeTab === 'moveIn'  && <MoveInView  isDesktop={isDesktop} />}
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

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 120, gap: 16 },
  scrollDesktop: { padding: 32, maxWidth: 1280, width: '100%', alignSelf: 'center' },

  pageHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 8 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: '#0891b2', textTransform: 'uppercase' },
  title: { fontSize: 32, fontWeight: '800', color: '#0b1c30', lineHeight: 38, marginTop: 4 },
  subtitle: { fontSize: 15, color: '#5b6b6d', marginTop: 8, lineHeight: 22, maxWidth: 600 },
  contextLine: { color: '#0891b2', fontSize: 12, fontWeight: '800', marginTop: 6 },
  addBtnWrapper: { borderRadius: 14, overflow: 'hidden' },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: 8 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  mobileTopBar: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  addIconBtn: { width: 46, height: 46, borderRadius: 14, overflow: 'hidden' },
  addIconBtnInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  searchBox: {
    flex: 1, height: 46, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', paddingHorizontal: 12, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0b1c30' },
  desktopSearchRow: { marginBottom: 4 },

  tabBar: { flexDirection: 'row', gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    height: 40, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', overflow: 'hidden',
  },
  tabActive: { borderColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  tabTextActive: { color: '#fff' },

  sectionStack: { gap: 16 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statsRowDesktop: { flexWrap: 'nowrap' },
  statCard: {
    flex: 1, flexBasis: '46%', minHeight: 110, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.3)', padding: 16, overflow: 'hidden', gap: 3,
  },
  statCardDesktop: { flexBasis: 0 },
  statIconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: '900', fontFamily: 'Inter' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' },
  statHelper: { fontSize: 11, color: '#9ca3af', marginTop: 1 },

  panel: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  panelHeader: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.055)', gap: 12 },
  panelHeaderMobile: { flexDirection: 'column', alignItems: 'stretch' },
  panelTitle: { fontSize: 18, fontWeight: '800', color: '#0b1c30' },
  panelSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  panelActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterPill: { flexDirection: 'row', alignItems: 'center', height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', gap: 6, overflow: 'hidden' },
  filterPillActive: { borderColor: 'transparent' },
  filterPillText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  filterPillTextActive: { color: '#fff' },
  iconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' },

  tableContainer: { paddingBottom: 4 },
  tableHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.02)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.055)' },
  tableHeaderText: { fontSize: 11, fontWeight: '800', color: '#9ca3af', letterSpacing: 0.5, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 72, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  tableRowAlert: { backgroundColor: 'rgba(220,38,38,0.04)' },
  tableCell: { flex: 1, justifyContent: 'center' },
  itemCell: { flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#e5e7eb' },
  itemTextBlock: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '800', color: '#0b1c30' },
  itemMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  categoryChipText: { fontSize: 11, fontWeight: '700', color: '#5b6b6d' },
  cellText: { fontSize: 13, color: '#5b6b6d', fontWeight: '500' },
  valueText: { fontSize: 13, fontWeight: '800', color: '#0b1c30' },
  moreBtn: { padding: 6 },

  cardList: { padding: 14, gap: 12 },
  inventoryCard: { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  inventoryCardAlert: { borderColor: 'rgba(220,38,38,0.25)' },
  alertStripe: { height: 3 },
  inventoryCardInner: { flexDirection: 'row', gap: 12, padding: 14 },
  inventoryThumb: { width: 76, height: 76, borderRadius: 12, backgroundColor: '#e5e7eb' },
  inventoryContent: { flex: 1, gap: 4 },
  inventoryTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inventoryCategoryPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  inventoryCategoryText: { fontSize: 10, fontWeight: '700', color: '#5b6b6d' },
  inventoryName: { fontSize: 14, fontWeight: '800', color: '#0b1c30' },
  inventoryMeta: { fontSize: 11, color: '#9ca3af' },
  inventoryFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  inventoryValue: { fontSize: 13, fontWeight: '800', color: '#0b1c30' },
  serviceAlertBar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(220,38,38,0.07)', paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(220,38,38,0.12)' },
  serviceAlertText: { fontSize: 11, fontWeight: '700', color: '#dc2626' },

  conditionPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  conditionDot: { width: 6, height: 6, borderRadius: 3 },
  conditionText: { fontSize: 11, fontWeight: '800' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },

  moveBanner: { borderRadius: 22, overflow: 'hidden', minHeight: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22, gap: 16 },
  moveBannerContent: { flex: 1 },
  moveBannerKicker: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  moveBannerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 4 },
  moveBannerMeta: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  progressBox: { alignItems: 'flex-end', gap: 4, minWidth: 100 },
  progressFraction: { fontSize: 24, fontWeight: '900', color: '#fff' },
  progressSublabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  progressTrack: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  moveOutDatePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  moveOutDateText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  workflowGrid: { gap: 14 },
  workflowGridDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  workflowMain: { flex: 1.9, gap: 12 },
  workflowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  ghostBtn: { backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  ghostBtnText: { fontSize: 12, fontWeight: '700', color: '#5b6b6d' },

  assignCard: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden', padding: 14, gap: 12 },
  assignCardMuted: { opacity: 0.6 },
  assignHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  assignIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  assignThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#e5e7eb' },
  assignName: { fontSize: 14, fontWeight: '800', color: '#0b1c30' },
  assignMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#0891b2', borderColor: '#0891b2' },
  assignFields: { flexDirection: 'row', gap: 10 },
  assignField: { flex: 1, gap: 5 },
  fieldLabel: { fontSize: 9, fontWeight: '800', color: '#9ca3af', letterSpacing: 0.8, textTransform: 'uppercase' },
  fieldValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
  assignFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  photoLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  photoLinkText: { fontSize: 12, fontWeight: '700', color: '#0891b2' },
  draftBadge: { backgroundColor: 'rgba(217,119,6,0.1)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  draftBadgeText: { fontSize: 11, fontWeight: '800', color: '#d97706' },
  assignHint: { fontSize: 12, color: '#9ca3af', paddingTop: 4 },

  rail: { flex: 1, minWidth: 260, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.35)', padding: 16, gap: 14, overflow: 'hidden' },
  railHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  railIconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  railBody: { gap: 10 },
  railDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginVertical: 2 },
  summaryLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: '#6b7280', flex: 1 },
  summaryValue: { fontSize: 13, fontWeight: '800', color: '#0b1c30' },

  verifyCard: { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden', padding: 16, gap: 14 },
  verifyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verifyIconCircle: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  verifyName: { fontSize: 15, fontWeight: '800', color: '#0b1c30' },
  verifyArea: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  verifyBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  verifyBadgeText: { fontSize: 11, fontWeight: '800' },
  conditionCompare: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  conditionCompareItem: { gap: 4 },
  compareLabel: { fontSize: 9, fontWeight: '800', color: '#9ca3af', letterSpacing: 0.8, textTransform: 'uppercase' },
  photoGrid: { flexDirection: 'row', gap: 10 },
  photoPanel: { flex: 1, height: 160, borderRadius: 14, overflow: 'hidden', backgroundColor: '#e5e7eb' },
  photoImage: { width: '100%', height: '100%' },
  photoTag: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  photoTagDanger: { backgroundColor: 'rgba(220,38,38,0.15)' },
  photoTagText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.8 },
  damageRow: { flexDirection: 'row', gap: 12, backgroundColor: 'rgba(220,38,38,0.04)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(220,38,38,0.1)' },
  damageDesc: { flex: 1, gap: 4 },
  damageText: { fontSize: 13, color: '#374151', lineHeight: 19 },
  deductionBox: { gap: 4, alignItems: 'flex-end' },
  deductionAmount: { fontSize: 18, fontWeight: '900', color: '#dc2626' },

  refundBlock: { backgroundColor: 'rgba(5,150,105,0.08)', borderRadius: 14, padding: 14, gap: 2, borderWidth: 1, borderColor: 'rgba(5,150,105,0.15)' },
  refundLabel: { fontSize: 10, fontWeight: '800', color: '#059669', letterSpacing: 0.8, textTransform: 'uppercase' },
  refundAmount: { fontSize: 30, fontWeight: '900', color: '#059669', fontFamily: 'Inter' },

  primaryWideBtn: { borderRadius: 14, overflow: 'hidden' },
  primaryWideBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  primaryWideBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  ghostWideBtn: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', paddingVertical: 13, alignItems: 'center' },
  ghostWideBtnDanger: { borderColor: 'rgba(220,38,38,0.3)' },
  ghostWideBtnText: { fontSize: 13, fontWeight: '700', color: '#5b6b6d' },
});
