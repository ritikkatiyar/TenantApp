import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { inventoryStats, inventoryItems, type InventoryItem } from '@/src/features/inventory/mockInventoryData';
import { DesktopRegistryRow, MobileInventoryCard } from './InventoryCardComponents';

interface InventoryRegistryViewProps {
  items: InventoryItem[];
  isDesktop: boolean;
  serviceOnly: boolean;
  onToggleService: () => void;
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
  isDesktop,
  serviceOnly,
  onToggleService,
}: InventoryRegistryViewProps) {
  return (
    <View style={styles.sectionStack}>
      <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
        {inventoryStats.map((stat, i) => (
          <BlurView key={stat.label} intensity={55} tint="light" style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
            <LinearGradient colors={STAT_GRAD[i]} style={styles.statIconCircle}>
              <MaterialIcons name={stat.icon as any} size={18} color="#fff" />
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
});
