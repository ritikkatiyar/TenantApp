import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { inventoryStats, inventoryItems, type InventoryItem } from '@/src/features/inventory/mockInventoryData';
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

  const displayStats = stats && stats.length > 0 ? stats : inventoryStats;
  const count = totalCount !== undefined ? totalCount : items.length;

  return (
    <View style={styles.sectionStack}>
      <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
        {displayStats.map((stat, i) => (
          <BlurView key={stat.label} intensity={55} tint={isDark ? 'dark' : 'light'} style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
            <LinearGradient colors={STAT_GRAD[i % STAT_GRAD.length]} style={styles.statIconCircle}>
              <MaterialIcons name={stat.icon as any} size={18} color={theme.Colors.surfaceContainerLowest} />
            </LinearGradient>
            <Text style={[styles.statValue, { color: STAT_COLORS[i % STAT_COLORS.length] }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statHelper}>{stat.helper}</Text>
          </BlurView>
        ))}
      </View>

      <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.panel}>
        <View style={[styles.panelHeader, !isDesktop && styles.panelHeaderMobile]}>
          <View>
            <Text style={styles.panelTitle}>Itemized Registry</Text>
            <Text style={styles.panelSub}>{items.length} of {count} assets</Text>
          </View>
          <View style={styles.panelActions}>
            <TouchableOpacity
              style={[styles.filterPill, serviceOnly && styles.filterPillActive]}
              onPress={onToggleService}
            >
              {serviceOnly && (
                <LinearGradient colors={[theme.Colors.error, '#ef4444']} style={StyleSheet.absoluteFillObject} />
              )}
              <MaterialIcons name="handyman" size={14} color={serviceOnly ? '#fff' : '#6b7280'} />
              <Text style={[styles.filterPillText, serviceOnly && styles.filterPillTextActive]}>Service Due</Text>
            </TouchableOpacity>
            {onAddItem && (
              <TouchableOpacity style={styles.addSmallBtn} onPress={onAddItem}>
                <LinearGradient colors={[theme.Colors.primary, '#0072ff']} style={styles.addSmallBtnInner}>
                  <MaterialIcons name="add" size={16} color={theme.Colors.surfaceContainerLowest} />
                  <Text style={styles.addSmallBtnText}>Add Item</Text>
                </LinearGradient>
              </TouchableOpacity>
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
              <TouchableOpacity style={styles.emptyAddBtn} onPress={onAddItem}>
                <LinearGradient colors={[theme.Colors.primary, '#0072ff']} style={styles.addSmallBtnInner}>
                  <MaterialIcons name="add" size={16} color={theme.Colors.surfaceContainerLowest} />
                  <Text style={styles.addSmallBtnText}>Add First Item</Text>
                </LinearGradient>
              </TouchableOpacity>
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
    flex: 1, flexBasis: '46%', minHeight: 110, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.3)', padding: theme.Spacing.md, overflow: 'hidden', gap: 3,
  },
  statCardDesktop: { flexBasis: 0 },
  statIconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: theme.Spacing.sm },
  statValue: { fontSize: theme.Typography.headlineMd.fontSize, fontWeight: '900', fontFamily: 'Inter' },
  statLabel: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '700', color: theme.Colors.onSurfaceVariant, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'Inter' },
  statHelper: { fontSize: theme.Typography.labelSmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 1, fontFamily: 'Inter' },
  panel: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
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
