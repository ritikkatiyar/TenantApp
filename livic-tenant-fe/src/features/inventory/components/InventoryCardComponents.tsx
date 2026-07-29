import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { InventoryCondition, InventoryItem, AssignmentItem, VerificationItem } from '@/src/features/inventory/mockInventoryData';

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

const formatCurrency = (amount: number) =>
  `Rs. ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export function ConditionPill({ condition }: { condition: InventoryCondition }) {
  const cfg = CONDITION_CONFIG[condition];
  return (
    <View style={[styles.conditionPill, { backgroundColor: cfg.bg }]}>
      <View style={[styles.conditionDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.conditionText, { color: cfg.color }]}>{condition}</Text>
    </View>
  );
}

export function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', dot: '#9ca3af' };
  return (
    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.statusText, { color: cfg.color }]}>{status}</Text>
    </View>
  );
}

export function SummaryLine({ label, value, danger = false, bold = false }: {
  label: string; value: string; danger?: boolean; bold?: boolean;
}) {
  return (
    <View style={styles.summaryLine}>
      <Text style={[styles.summaryLabel, bold && { fontWeight: '800', color: '#0b1c30' }]}>{label}</Text>
      <Text style={[styles.summaryValue, danger && { color: '#dc2626' }, bold && { fontSize: 15 }]}>{value}</Text>
    </View>
  );
}

export function MobileInventoryCard({ item }: { item: InventoryItem }) {
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
              <MaterialIcons name={item.icon as any} size={11} color="#5b6b6d" />
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

export function DesktopRegistryRow({ item }: { item: InventoryItem }) {
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
          <MaterialIcons name={item.icon as any} size={13} color="#5b6b6d" />
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

export function AssignmentCard({ item }: { item: AssignmentItem }) {
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

export function VerificationCard({ item }: { item: VerificationItem }) {
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
          <MaterialIcons name={item.icon as any} size={20} color={statusCfg.color} />
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

const styles = StyleSheet.create({
  conditionPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  conditionDot: { width: 6, height: 6, borderRadius: 3 },
  conditionText: { fontSize: 11, fontWeight: '800', fontFamily: 'Inter' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800', fontFamily: 'Inter' },
  summaryLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 13, color: '#6b7280', flex: 1, fontFamily: 'Inter' },
  summaryValue: { fontSize: 13, fontWeight: '800', color: '#0b1c30', fontFamily: 'Inter' },

  inventoryCard: { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  inventoryCardAlert: { borderColor: 'rgba(220,38,38,0.25)' },
  alertStripe: { height: 3 },
  inventoryCardInner: { flexDirection: 'row', gap: 12, padding: 14 },
  inventoryThumb: { width: 76, height: 76, borderRadius: 12, backgroundColor: '#e5e7eb' },
  inventoryContent: { flex: 1, gap: 4 },
  inventoryTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inventoryCategoryPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  inventoryCategoryText: { fontSize: 10, fontWeight: '700', color: '#5b6b6d', fontFamily: 'Inter' },
  inventoryName: { fontSize: 14, fontWeight: '800', color: '#0b1c30', fontFamily: 'Inter' },
  inventoryMeta: { fontSize: 11, color: '#9ca3af', fontFamily: 'Inter' },
  inventoryFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  inventoryValue: { fontSize: 13, fontWeight: '800', color: '#0b1c30', fontFamily: 'Inter' },
  serviceAlertBar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(220,38,38,0.07)', paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(220,38,38,0.12)' },
  serviceAlertText: { fontSize: 11, fontWeight: '700', color: '#dc2626', fontFamily: 'Inter' },

  tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 72, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  tableRowAlert: { backgroundColor: 'rgba(220,38,38,0.04)' },
  tableCell: { flex: 1, justifyContent: 'center' },
  itemCell: { flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#e5e7eb' },
  itemTextBlock: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '800', color: '#0b1c30', fontFamily: 'Inter' },
  itemMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2, fontFamily: 'Inter' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  categoryChipText: { fontSize: 11, fontWeight: '700', color: '#5b6b6d', fontFamily: 'Inter' },
  cellText: { fontSize: 13, color: '#5b6b6d', fontWeight: '500', fontFamily: 'Inter' },
  valueText: { fontSize: 13, fontWeight: '800', color: '#0b1c30', fontFamily: 'Inter' },
  moreBtn: { padding: 6 },

  assignCard: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden', padding: 14, gap: 12 },
  assignCardMuted: { opacity: 0.6 },
  assignHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  assignIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  assignThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#e5e7eb' },
  assignName: { fontSize: 14, fontWeight: '800', color: '#0b1c30', fontFamily: 'Inter' },
  assignMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2, fontFamily: 'Inter' },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#0891b2', borderColor: '#0891b2' },
  assignFields: { flexDirection: 'row', gap: 10 },
  assignField: { flex: 1, gap: 5 },
  fieldLabel: { fontSize: 9, fontWeight: '800', color: '#9ca3af', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'Inter' },
  fieldValue: { fontSize: 13, fontWeight: '600', color: '#374151', fontFamily: 'Inter' },
  assignFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  photoLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  photoLinkText: { fontSize: 12, fontWeight: '700', color: '#0891b2', fontFamily: 'Inter' },
  draftBadge: { backgroundColor: 'rgba(217,119,6,0.1)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  draftBadgeText: { fontSize: 11, fontWeight: '800', color: '#d97706', fontFamily: 'Inter' },
  assignHint: { fontSize: 12, color: '#9ca3af', paddingTop: 4, fontFamily: 'Inter' },

  verifyCard: { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden', padding: 16, gap: 14 },
  verifyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verifyIconCircle: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  verifyName: { fontSize: 15, fontWeight: '800', color: '#0b1c30', fontFamily: 'Inter' },
  verifyArea: { fontSize: 12, color: '#9ca3af', marginTop: 2, fontFamily: 'Inter' },
  verifyBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  verifyBadgeText: { fontSize: 11, fontWeight: '800', fontFamily: 'Inter' },
  conditionCompare: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  conditionCompareItem: { gap: 4 },
  compareLabel: { fontSize: 9, fontWeight: '800', color: '#9ca3af', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'Inter' },
  photoGrid: { flexDirection: 'row', gap: 10 },
  photoPanel: { flex: 1, height: 160, borderRadius: 14, overflow: 'hidden', backgroundColor: '#e5e7eb' },
  photoImage: { width: '100%', height: '100%' },
  photoTag: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  photoTagDanger: { backgroundColor: 'rgba(220,38,38,0.15)' },
  photoTagText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.8, fontFamily: 'Inter' },
  damageRow: { flexDirection: 'row', gap: 12, backgroundColor: 'rgba(220,38,38,0.04)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(220,38,38,0.1)' },
  damageDesc: { flex: 1, gap: 4 },
  damageText: { fontSize: 13, color: '#374151', lineHeight: 19, fontFamily: 'Inter' },
  deductionBox: { gap: 4, alignItems: 'flex-end' },
  deductionAmount: { fontSize: 18, fontWeight: '900', color: '#dc2626', fontFamily: 'Inter' },
});
