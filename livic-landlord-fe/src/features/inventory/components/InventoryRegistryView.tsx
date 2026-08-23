import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { inventoryStats, inventoryItems, type InventoryItem } from '@/src/features/inventory/mockInventoryData';
import { StatCard } from '@/src/components/common/display/StatCard';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import FilterPill from '@/src/components/common/inputs/FilterPill';
import { DesktopRegistryRow, MobileInventoryCard } from './InventoryCardComponents';

interface InventoryRegistryViewProps {
  items: InventoryItem[];
  totalCount?: number;
  stats?: Array<{ label: string; value: string; helper: string; icon: string }>;
  isDesktop: boolean;
  serviceOnly: boolean;
  onToggleService: () => void;
  onAddItem?: () => void;
}

export function InventoryRegistryView({
  items,
  totalCount,
  stats,
  isDesktop,
  serviceOnly,
  onToggleService,
  onAddItem,
}: InventoryRegistryViewProps) {
  const { theme, isDark } = useAppTheme();

  const STAT_GRAD: [string, string][] = React.useMemo(() => [
    [theme.Colors.primary, '#06b6d4'],
    [theme.Colors.error, '#ef4444'],
    [theme.Colors.secondary, '#7c3aed'],
    [theme.Colors.primary, '#10b981'],
  ], [theme]);

  const STAT_COLORS = React.useMemo(() => [
    theme.Colors.primary,
    theme.Colors.error,
    theme.Colors.secondary,
    theme.Colors.primary
  ], [theme]);
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const realStats = React.useMemo(() => {
    if (stats && stats.length > 0) return stats;
    const totalAssets = items.length;
    const serviceRequired = items.filter(i => (i as any).status === 'SERVICE_REQUIRED' || (i as any).condition === 'DAMAGED' || (i as any).needsService).length;
    const assignedCount = items.filter(i => (i as any).unitNumber != null || (i as any).assignedUnitNumber != null).length;
    const totalVal = items.reduce((acc, i) => acc + ((i as any).assetValue || (i as any).value || 0), 0);

    return [
      { label: 'Total Assets', value: String(totalAssets), helper: `${totalAssets} items in inventory`, icon: 'inventory-2' },
      { label: 'Service Due', value: String(serviceRequired), helper: `${serviceRequired} items need maintenance`, icon: 'handyman' },
      { label: 'Assigned Items', value: String(assignedCount), helper: `${assignedCount} items bound to units`, icon: 'assignment-turned-in' },
      { label: 'Total Value', value: `₹${totalVal.toLocaleString()}`, helper: 'Cumulative asset valuation', icon: 'account-balance-wallet' },
    ];
  }, [stats, items]);

  const displayStats = realStats;
  const count = totalCount !== undefined ? totalCount : items.length;

  return (
    <View style={styles.sectionStack}>
      <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
        {displayStats.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            helperText={stat.helper}
            iconName={stat.icon as any}
            iconColor={STAT_COLORS[i % STAT_COLORS.length]}
            style={isDesktop ? { flex: 1 } : { flexBasis: '46%' }}
            valueStyle={{ color: STAT_COLORS[i % STAT_COLORS.length] }}
          />
        ))}
      </View>

      <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.panel}>
        <View style={[styles.panelHeader, !isDesktop && styles.panelHeaderMobile]}>
          <View>
            <Text style={styles.panelTitle}>Itemized Registry</Text>
            <Text style={styles.panelSub}>{items.length} of {count} assets</Text>
          </View>
          <View style={styles.panelActions}>
            <FilterPill
              label="Service Due"
              icon="handyman"
              active={serviceOnly}
              onPress={onToggleService}
              size="sm"
            />
            {onAddItem && (
              <ActionButton
                label="Add Item"
                icon="add"
                variant="primary"
                size="sm"
                onPress={onAddItem}
              />
            )}
          </View>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient colors={['rgba(0,104,117,0.1)', 'rgba(0,114,255,0.1)']} style={styles.emptyIconCircle}>
              <MaterialIcons name="inventory-2" size={32} color={theme.Colors.primary} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No Inventory Items Tracked</Text>
            <Text style={styles.emptySubtitle}>Add furniture, appliances, HVAC or fixtures to track asset value and condition evidence.</Text>
            {onAddItem && (
              <ActionButton
                label="Add First Item"
                icon="add"
                variant="primary"
                size="md"
                onPress={onAddItem}
                style={{ marginTop: 12 }}
              />
            )}
          </View>
        ) : isDesktop ? (
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

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  sectionStack: { gap: theme.Spacing.md },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statsRowDesktop: { flexWrap: 'nowrap' },
  statCard: {
    flex: 1, flexBasis: '46%', minHeight: 110, borderRadius: 20,
    borderWidth: 1.5, borderColor: theme.Colors.glassStroke,
    backgroundColor: theme.Colors.glassFill, padding: theme.Spacing.md, overflow: 'hidden', gap: 3,
  },
  statCardDesktop: { flexBasis: 0 },
  statIconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: theme.Spacing.sm },
  statValue: { fontSize: theme.Typography.headlineMd.fontSize, fontWeight: '900', fontFamily: 'Inter' },
  statLabel: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '700', color: theme.Colors.onSurfaceVariant, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'Inter' },
  statHelper: { fontSize: theme.Typography.labelSmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 1, fontFamily: 'Inter' },
  panel: { borderRadius: 24, borderWidth: 1.5, borderColor: theme.Colors.glassStroke, backgroundColor: theme.Colors.glassFill, overflow: 'hidden' },
  panelHeader: { padding: theme.Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.055)', gap: 12 },
  panelHeaderMobile: { flexDirection: 'column', alignItems: 'stretch' },
  panelTitle: { fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '800', color: theme.Colors.onSurface, fontFamily: 'Inter' },
  panelSub: { fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2, fontFamily: 'Inter' },
  panelActions: { flexDirection: 'row', gap: theme.Spacing.sm, alignItems: 'center' },
  filterPill: { flexDirection: 'row', alignItems: 'center', height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', gap: 6, overflow: 'hidden' },
  filterPillActive: { borderColor: 'transparent' },
  filterPillText: { fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '700', color: theme.Colors.onSurfaceVariant, fontFamily: 'Inter' },
  filterPillTextActive: { color: theme.Colors.surfaceContainerLowest, fontFamily: 'Inter' },
  iconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' },
  tableContainer: { paddingBottom: theme.Spacing.xs },
  tableHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.02)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.055)' },
  tableHeaderText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '800', color: theme.Colors.onSurfaceVariant, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'Inter' },
  tableCell: { flex: 1, justifyContent: 'center' },
  itemCell: { flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardList: { padding: 14, gap: 12 },
  addSmallBtn: { borderRadius: 12, overflow: 'hidden' },
  addSmallBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: theme.Spacing.sm },
  addSmallBtnText: { color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '800', fontFamily: 'Inter' },
  emptyState: { padding: theme.Spacing.xxl, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '800', color: theme.Colors.onSurface, fontFamily: 'Inter' },
  emptySubtitle: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 400, lineHeight: 19, fontFamily: 'Inter' },
  emptyAddBtn: { marginTop: theme.Spacing.sm, borderRadius: 12, overflow: 'hidden' },
});
