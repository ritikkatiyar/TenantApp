import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { type AssignmentItem, type InventoryItem } from '@/src/features/inventory/mockInventoryData';
import { AssignmentCard, SummaryLine } from './InventoryCardComponents';
import { createLeaseAssignments } from '../api/inventory.api';
import { StatCard } from '@/src/components/common/display/StatCard';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { formatCurrency } from '@/src/utils/formatters';

interface InventoryMoveInViewProps {
  assignedItems?: AssignmentItem[];
  availableItems?: InventoryItem[];
  leaseId?: string;
  token?: string;
  isDesktop: boolean;
  onRefresh?: () => void;
  onAddItem?: () => void;
}

export function InventoryMoveInView({
  assignedItems = [],
  availableItems = [],
  leaseId,
  token,
  isDesktop,
  onRefresh,
  onAddItem,
}: InventoryMoveInViewProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const hasAssigned = assignedItems.length > 0;
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedItemIds.size === availableItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(availableItems.map((i) => i.id)));
    }
  };

  const handleConfirmAssignment = async () => {
    if (!leaseId || !token) {
      Alert.alert('Error', 'Missing active lease context');
      return;
    }
    if (selectedItemIds.size === 0) {
      Alert.alert('Required', 'Please select at least one item to assign');
      return;
    }

    setIsSubmitting(true);
    try {
      const payloads = Array.from(selectedItemIds).map((id) => {
        const item = availableItems.find((i) => i.id === id);
        return {
          itemId: id,
          conditionAtAssignment: item?.condition?.toUpperCase() || 'EXCELLENT',
          assignmentNotes: item?.notes || undefined,
        };
      });

      await createLeaseAssignments(leaseId, { items: payloads }, token);
      Alert.alert('Success', `Assigned ${payloads.length} items to lease #${leaseId.substring(0, 8)}`);
      setSelectedItemIds(new Set());
      if (onRefresh) onRefresh();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to assign inventory items');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = hasAssigned ? assignedItems.length : selectedItemIds.size;
  const totalCount = hasAssigned ? assignedItems.length : availableItems.length;
  const progress = totalCount > 0 ? selectedCount / totalCount : 0;

  return (
    <View style={styles.sectionStack}>
      <BlurView intensity={35} tint={isDark ? 'dark' : 'light'} style={styles.moveBanner}>
        <LinearGradient
          colors={['rgba(0,104,117,0.85)', 'rgba(79,70,229,0.85)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.moveBannerContent}>
          <Text style={styles.moveBannerKicker}>MOVE-IN ASSIGNMENT</Text>
          <Text style={styles.moveBannerTitle}>Lease Inventory Assignment</Text>
          <Text style={styles.moveBannerMeta}>{leaseId ? `Lease #${leaseId}` : 'Document items on move-in'}</Text>
        </View>
        <View style={styles.progressBox}>
          <Text style={styles.progressFraction}>{selectedCount}/{totalCount}</Text>
          <Text style={styles.progressSublabel}>{hasAssigned ? 'assigned' : 'selected'}</Text>
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
            <Text style={styles.panelTitle}>
              {hasAssigned ? 'Assigned Items Checklist' : 'Select Items to Assign'}
            </Text>
            {!hasAssigned && availableItems.length > 0 && (
              <View style={styles.panelActions}>
                <TouchableOpacity style={styles.ghostBtn} onPress={selectAll}>
                  <Text style={styles.ghostBtnText}>
                    {selectedItemIds.size === availableItems.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {hasAssigned ? (
            assignedItems.map((item) => <AssignmentCard key={item.id} item={item} />)
          ) : availableItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <LinearGradient colors={['rgba(0,104,117,0.1)', 'rgba(0,114,255,0.1)']} style={styles.emptyIconCircle}>
                <MaterialIcons name="inventory-2" size={32} color={theme.Colors.primary} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No Property Inventory Available</Text>
              <Text style={styles.emptySubtitle}>
                Add appliances, furniture, or fixtures in the Registry tab before assigning them to leases.
              </Text>
              {onAddItem && (
                <ActionButton
                  label="Add Item to Registry"
                  icon="add"
                  variant="primary"
                  size="md"
                  onPress={onAddItem}
                  style={{ marginTop: 12 }}
                />
              )}
            </View>
          ) : (
            availableItems.map((item) => {
              const isSelected = selectedItemIds.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => toggleSelect(item.id)}
                >
                  <BlurView
                    intensity={45}
                    tint={isDark ? 'dark' : 'light'}
                    style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                  >
                    <View style={styles.itemCardContent}>
                      <View style={styles.itemCardLeft}>
                        <TouchableOpacity
                          style={[styles.checkbox, isSelected && styles.checkboxActive]}
                          onPress={() => toggleSelect(item.id)}
                        >
                          {isSelected && <MaterialIcons name="check" size={14} color={theme.Colors.surfaceContainerLowest} />}
                        </TouchableOpacity>
                        <View>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemMeta}>
                            {item.location || 'Shared'} · {item.category} {item.serial ? `· SN: ${item.serial}` : ''}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.itemCardRight}>
                        <View style={styles.conditionChip}>
                          <Text style={styles.conditionText}>{item.condition || 'Excellent'}</Text>
                        </View>
                        <Text style={styles.itemValue}>{item.value}</Text>
                      </View>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <BlurView intensity={65} tint={isDark ? 'dark' : 'light'} style={styles.rail}>
          <View style={styles.railHeader}>
            <LinearGradient colors={[theme.Colors.primary, '#0072ff']} style={styles.railIconCircle}>
              <MaterialIcons name="fact-check" size={18} color={theme.Colors.surfaceContainerLowest} />
            </LinearGradient>
            <Text style={styles.panelTitle}>Summary</Text>
          </View>
          <View style={styles.railBody}>
            <SummaryLine label="Status" value={hasAssigned ? 'Active Lease Handover' : 'Move-In Setup'} />
            <SummaryLine label="Selected Items" value={String(selectedCount)} />
            <SummaryLine label="Available Assets" value={String(availableItems.length)} />
            <SummaryLine label="Assignment Mode" value={hasAssigned ? 'Locked' : 'Configuring'} bold />
          </View>

          {!hasAssigned && availableItems.length > 0 && (
            <View style={styles.railFooter}>
              <TouchableOpacity
                style={styles.confirmBtn}
                activeOpacity={0.82}
                disabled={isSubmitting || selectedItemIds.size === 0}
                onPress={handleConfirmAssignment}
              >
                <LinearGradient
                  colors={selectedItemIds.size > 0 ? [theme.Colors.primary, '#0072ff'] : ['#9ca3af', '#6b7280']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.confirmBtnInner}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
                  ) : (
                    <>
                      <MaterialIcons name="how-to-reg" size={18} color={theme.Colors.surfaceContainerLowest} />
                      <Text style={styles.confirmBtnText}>Confirm Assignment ({selectedItemIds.size})</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </BlurView>
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  sectionStack: { gap: theme.Spacing.md },
  moveBanner: {
    borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', overflow: 'hidden', minHeight: 90, gap: theme.Spacing.md,
  },
  moveBannerContent: { flex: 1, gap: 2 },
  moveBannerKicker: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '800', letterSpacing: 1.2, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', fontFamily: 'Inter' },
  moveBannerTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '900', color: theme.Colors.surfaceContainerLowest, fontFamily: 'Inter' },
  moveBannerMeta: { fontSize: theme.Typography.bodySmall.fontSize, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontFamily: 'Inter' },
  progressBox: { alignItems: 'flex-end', gap: theme.Spacing.xs, minWidth: 100 },
  progressFraction: { fontSize: theme.Typography.headlineSmall.fontSize, fontWeight: '900', color: theme.Colors.surfaceContainerLowest, fontFamily: 'Inter' },
  progressSublabel: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '700', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Inter' },
  progressTrack: { width: 100, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  workflowGrid: { flexDirection: 'column', gap: theme.Spacing.md },
  workflowGridDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  workflowMain: { flex: 1, gap: 12 },
  workflowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.Spacing.xs },
  panelTitle: { fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '800', color: theme.Colors.onSurface, fontFamily: 'Inter' },
  panelActions: { flexDirection: 'row', gap: theme.Spacing.sm },
  ghostBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' },
  ghostBtnText: { fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '700', color: theme.Colors.primary, fontFamily: 'Inter' },

  itemCard: {
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.4)', padding: 14, overflow: 'hidden',
  },
  itemCardSelected: {
    borderColor: theme.Colors.primary,
    backgroundColor: 'rgba(0,104,117,0.08)',
  },
  itemCardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  itemCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  checkbox: {
    width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: theme.Colors.onSurfaceVariant,
    justifyContent: 'center', alignItems: 'center', backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  checkboxActive: { borderColor: theme.Colors.primary, backgroundColor: theme.Colors.primary },
  itemName: { fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '800', color: theme.Colors.onSurface, fontFamily: 'Inter' },
  itemMeta: { fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2, fontFamily: 'Inter' },
  itemCardRight: { alignItems: 'flex-end', gap: theme.Spacing.xs },
  conditionChip: { backgroundColor: 'rgba(5,150,105,0.1)', paddingHorizontal: theme.Spacing.sm, paddingVertical: 3, borderRadius: 6 },
  conditionText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '800', color: theme.Colors.primary, fontFamily: 'Inter' },
  itemValue: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '800', color: theme.Colors.onSurface, fontFamily: 'Inter' },

  emptyCard: {
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.35)', padding: 40, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  emptyIconCircle: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: theme.Spacing.xs },
  emptyTitle: { fontSize: theme.Typography.titleMedium.fontSize, fontWeight: '800', color: theme.Colors.onSurface, fontFamily: 'Inter' },
  emptySubtitle: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 360, lineHeight: 18, fontFamily: 'Inter' },
  emptyAddBtn: { marginTop: theme.Spacing.sm, borderRadius: 12, overflow: 'hidden' },
  emptyAddBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: theme.Spacing.md, paddingVertical: 10 },
  emptyAddBtnText: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '800', fontFamily: 'Inter' },

  rail: {
    width: '100%', maxWidth: 320, borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.35)',
    padding: 18, gap: 14, overflow: 'hidden',
  },
  railHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  railIconCircle: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  railBody: { gap: 10 },
  railFooter: { marginTop: 6 },
  confirmBtn: { borderRadius: 14, overflow: 'hidden' },
  confirmBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.Spacing.sm, paddingVertical: 14, paddingHorizontal: theme.Spacing.md },
  confirmBtnText: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '800', fontFamily: 'Inter' },
});
