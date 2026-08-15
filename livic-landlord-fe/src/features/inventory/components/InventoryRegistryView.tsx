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

const STAT_GRAD: [string, string][] = [
  ['#0891b2', '#06b6d4'],
  ['#dc2626', '#ef4444'],
  ['#4f46e5', '#7c3aed'],
  ['#059669', '#10b981'],
];
const STAT_COLORS = ['#0891b2', '#dc2626', '#4f46e5', '#059669'];

export function InventoryRegistryView({
  items,
  totalCount,
  stats,
  isDesktop,
  serviceOnly,
  onToggleService,
  onAddItem,
}: InventoryRegistryViewProps) {
  const displayStats = stats && stats.length > 0 ? stats : inventoryStats;
  const count = totalCount !== undefined ? totalCount : items.length;

  return (
    <View style={styles.sectionStack}>
      <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
        {displayStats.map((stat, i) => (
          <BlurView key={stat.label} intensity={55} tint="light" style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
            <LinearGradient colors={STAT_GRAD[i % STAT_GRAD.length]} style={styles.statIconCircle}>
              <MaterialIcons name={stat.icon as any} size={18} color="#fff" />
            </LinearGradient>
            <Text style={[styles.statValue, { color: STAT_COLORS[i % STAT_COLORS.length] }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statHelper}>{stat.helper}</Text>
          </BlurView>
        ))}
      </View>

      <BlurView intensity={60} tint="light" style={styles.panel}>
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
                <LinearGradient colors={['#dc2626', '#ef4444']} style={StyleSheet.absoluteFillObject} />
              )}
              <MaterialIcons name="handyman" size={14} color={serviceOnly ? '#fff' : '#6b7280'} />
              <Text style={[styles.filterPillText, serviceOnly && styles.filterPillTextActive]}>Service Due</Text>
            </TouchableOpacity>
            {onAddItem && (
              <TouchableOpacity style={styles.addSmallBtn} onPress={onAddItem}>
                <LinearGradient colors={['#0891b2', '#0072ff']} style={styles.addSmallBtnInner}>
                  <MaterialIcons name="add" size={16} color="#fff" />
                  <Text style={styles.addSmallBtnText}>Add Item</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient colors={['rgba(8,145,178,0.1)', 'rgba(0,114,255,0.1)']} style={styles.emptyIconCircle}>
              <MaterialIcons name="inventory-2" size={32} color="#0891b2" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No Inventory Items Tracked</Text>
            <Text style={styles.emptySubtitle}>Add furniture, appliances, HVAC or fixtures to track asset value and condition evidence.</Text>
            {onAddItem && (
              <TouchableOpacity style={styles.emptyAddBtn} onPress={onAddItem}>
                <LinearGradient colors={['#0891b2', '#0072ff']} style={styles.addSmallBtnInner}>
                  <MaterialIcons name="add" size={16} color="#fff" />
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

const styles = StyleSheet.create({
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
  statLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'Inter' },
  statHelper: { fontSize: 11, color: '#9ca3af', marginTop: 1, fontFamily: 'Inter' },
  panel: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  panelHeader: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.055)', gap: 12 },
  panelHeaderMobile: { flexDirection: 'column', alignItems: 'stretch' },
  panelTitle: { fontSize: 18, fontWeight: '800', color: '#0b1c30', fontFamily: 'Inter' },
  panelSub: { fontSize: 12, color: '#9ca3af', marginTop: 2, fontFamily: 'Inter' },
  panelActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterPill: { flexDirection: 'row', alignItems: 'center', height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', gap: 6, overflow: 'hidden' },
  filterPillActive: { borderColor: 'transparent' },
  filterPillText: { fontSize: 12, fontWeight: '700', color: '#6b7280', fontFamily: 'Inter' },
  filterPillTextActive: { color: '#fff', fontFamily: 'Inter' },
  iconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' },
  tableContainer: { paddingBottom: 4 },
  tableHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.02)', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.055)' },
  tableHeaderText: { fontSize: 11, fontWeight: '800', color: '#9ca3af', letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'Inter' },
  tableCell: { flex: 1, justifyContent: 'center' },
  itemCell: { flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardList: { padding: 14, gap: 12 },
  addSmallBtn: { borderRadius: 12, overflow: 'hidden' },
  addSmallBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  addSmallBtnText: { color: '#fff', fontSize: 12, fontWeight: '800', fontFamily: 'Inter' },
  emptyState: { padding: 48, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0b1c30', fontFamily: 'Inter' },
  emptySubtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', maxWidth: 400, lineHeight: 19, fontFamily: 'Inter' },
  emptyAddBtn: { marginTop: 8, borderRadius: 12, overflow: 'hidden' },
});
