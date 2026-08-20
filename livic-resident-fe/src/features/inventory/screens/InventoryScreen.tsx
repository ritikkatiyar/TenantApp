import React from 'react';
import {
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
import { useAppTheme } from '@/src/theme/ThemeContext';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

// Phase 4 modular hook & component imports
import { useInventory, type InventoryTab } from '@/src/features/inventory/hooks/useInventory';
import { InventoryRegistryView } from '@/src/features/inventory/components/InventoryRegistryView';
import { InventoryMoveInView } from '@/src/features/inventory/components/InventoryMoveInView';
import { InventoryMoveOutView } from '@/src/features/inventory/components/InventoryMoveOutView';

export default function InventoryScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { handleScroll } = useScrollNav();

  const {
    activeTab,
    setActiveTab,
    query,
    setQuery,
    serviceOnly,
    setServiceOnly,
    filteredItems,
    totalDeductions,
    securityDeposit,
    netRefund,
    leaseId
  } = useInventory();

  const TABS: { id: InventoryTab; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
    { id: 'registry', label: 'Registry',   icon: 'inventory-2'  },
    { id: 'moveIn',   label: 'Move-In',    icon: 'how-to-reg'   },
    { id: 'moveOut',  label: 'Settlement', icon: 'receipt-long' },
  ];

  return (
    <LinearGradient
      colors={theme.Colors.backgroundGradient as [string, string, string]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {isDesktop && <DesktopNavBar title="Inventory" />}
        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
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
                {leaseId && <Text style={styles.contextLine}>Lease: {leaseId}</Text>}
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
            <InventoryRegistryView
              items={filteredItems}
              isDesktop={isDesktop}
              serviceOnly={serviceOnly}
              onToggleService={() => setServiceOnly(v => !v)}
            />
          )}
          {activeTab === 'moveIn'  && <InventoryMoveInView  isDesktop={isDesktop} />}
          {activeTab === 'moveOut' && (
            <InventoryMoveOutView
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

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
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
});
