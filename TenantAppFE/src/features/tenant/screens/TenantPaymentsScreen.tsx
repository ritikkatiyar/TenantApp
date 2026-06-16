import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { RoleToggle } from '@/src/components/RoleToggle';

interface TenantPaymentsScreenProps {
  token: string;
  onLogout: () => void;
}

const colors = {
  primary: '#004c5a',
  primaryContainer: '#006677',
  onPrimaryContainer: '#96e1f5',
  secondary: '#4f6073',
  secondaryContainer: '#d2e4fb',
  tertiary: '#3e4648',
  background: '#f8f9ff',
  surfaceLowest: '#ffffff',
  surfaceLow: '#eff4ff',
  surfaceContainer: '#e5eeff',
  surfaceContainerHigh: '#dce9ff',
  onBackground: '#0b1c30',
  onSurface: '#0b1c30',
  onSurfaceVariant: '#3f484b',
  outlineVariant: '#bec8cb',
  outline: '#6f797c',
  onPrimary: '#ffffff'
};

export default function TenantPaymentsScreen({ token, onLogout }: TenantPaymentsScreenProps) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Billing & Rent</Text>
            <Text style={styles.title}>Payments & History</Text>
          </View>
          <RoleToggle />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.cycleCard}>
            <View style={styles.cycleTopRow}>
              <View style={styles.cycleBadge}>
                <MaterialIcons name="calendar-month" size={16} color={colors.primary} />
                <Text style={styles.cycleBadgeText}>Current Cycle: October 2023</Text>
              </View>
            </View>
            
            <Text style={styles.amountText}>₹10,000.00</Text>
            <Text style={styles.dueText}>Due date: Oct 5, 2023 (In 3 days)</Text>
            
            <View style={styles.cycleActions}>
              <TouchableOpacity style={styles.payBtn}>
                <MaterialIcons name="bolt" size={20} color="#fff" />
                <Text style={styles.payBtnText}>Pay Rent Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.invoiceBtn}>
                <MaterialIcons name="download" size={20} color={colors.secondary} />
                <Text style={styles.invoiceBtnText}>Invoice</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statIconBox}>
                <MaterialIcons name="verified-user" size={24} color={colors.onPrimaryContainer} />
              </View>
              <View>
                <Text style={styles.statLabel}>STATUS</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>Active</Text>
              </View>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.secondaryContainer, borderLeftWidth: 0 }]}>
              <View style={[styles.statIconBox, { backgroundColor: colors.surfaceLowest }]}>
                <MaterialIcons name="history" size={24} color={colors.secondary} />
              </View>
              <View>
                <Text style={styles.statLabel}>ON TIME</Text>
                <Text style={[styles.statValue, { color: colors.secondary }]}>100%</Text>
              </View>
            </View>
          </View>

          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Payment History</Text>
              <View style={styles.filterBox}>
                <MaterialIcons name="filter-list" size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.filterText}>All Payments</Text>
              </View>
            </View>
            
            <View style={styles.historyList}>
              <View style={styles.historyItem}>
                <View style={styles.historyMain}>
                  <Text style={styles.historyDate}>Sep 01, 2023</Text>
                  <View style={styles.historyRowData}>
                    <MaterialIcons name="home-work" size={16} color={colors.primary} />
                    <Text style={styles.historyDesc}>Monthly Rent</Text>
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>₹10,000.00</Text>
                  <View style={styles.statusSuccess}>
                    <Text style={styles.statusSuccessText}>SUCCESS</Text>
                  </View>
                </View>
              </View>

              <View style={styles.historyItem}>
                <View style={styles.historyMain}>
                  <Text style={styles.historyDate}>Aug 02, 2023</Text>
                  <View style={styles.historyRowData}>
                    <MaterialIcons name="home-work" size={16} color={colors.primary} />
                    <Text style={styles.historyDesc}>Monthly Rent</Text>
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>₹10,000.00</Text>
                  <View style={styles.statusSuccess}>
                    <Text style={styles.statusSuccessText}>SUCCESS</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.historyItem, { borderBottomWidth: 0 }]}>
                <View style={styles.historyMain}>
                  <Text style={styles.historyDate}>Jul 05, 2023</Text>
                  <View style={styles.historyRowData}>
                    <MaterialIcons name="build" size={16} color={colors.tertiary} />
                    <Text style={styles.historyDesc}>Maintenance Fee</Text>
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>₹1,500.00</Text>
                  <View style={styles.statusSuccess}>
                    <Text style={styles.statusSuccessText}>SUCCESS</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.historyFooter}>
              <Text style={styles.historyFooterText}>Showing 3 of 24 transactions</Text>
            </View>
          </View>

          <View style={styles.promoCard}>
            <Text style={styles.promoTitle}>Autopay is available</Text>
            <Text style={styles.promoDesc}>Never miss a payment again. Enable autopay and get a 2% rebate on your next cycle.</Text>
            <TouchableOpacity style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>Set Up Now</Text>
            </TouchableOpacity>
            <MaterialIcons name="payments" size={120} color="rgba(255,255,255,0.2)" style={styles.promoIcon} />
          </View>

          <View style={styles.securityCard}>
            <View style={styles.securityHeader}>
              <MaterialIcons name="security" size={20} color={colors.primary} />
              <Text style={styles.securityTitle}>ENCRYPTED PAYMENTS</Text>
            </View>
            <Text style={styles.securityDesc}>Your transactions are secured with 256-bit bank-level encryption. We do not store your full card details.</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  kicker: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  title: { color: colors.onBackground, fontSize: 32, fontWeight: '800' },
  scrollContent: { paddingBottom: 40, gap: 24 },
  
  cycleCard: { backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 24, shadowColor: colors.primaryContainer, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
  cycleTopRow: { flexDirection: 'row', marginBottom: 16 },
  cycleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cycleBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  amountText: { fontSize: 40, fontWeight: '800', color: colors.onSurface },
  dueText: { fontSize: 16, color: colors.onSurfaceVariant, marginTop: 4, marginBottom: 24 },
  cycleActions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  payBtn: { flex: 1, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, minWidth: 150 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  invoiceBtn: { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.outline, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, minWidth: 150 },
  invoiceBtnText: { color: colors.secondary, fontSize: 16, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 16 },
  statBox: { flex: 1, backgroundColor: colors.surfaceContainerHigh, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 4, borderLeftColor: colors.primary },
  statIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12, fontWeight: '700', color: colors.secondary, marginBottom: 2 },
  statValue: { fontSize: 24, fontWeight: '800' },

  historyCard: { backgroundColor: colors.surfaceLowest, borderRadius: 16, overflow: 'hidden', shadowColor: colors.primaryContainer, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  historyTitle: { fontSize: 20, fontWeight: '700', color: colors.onSurface },
  filterBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceLow, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.outlineVariant },
  filterText: { fontSize: 14, color: colors.onSurfaceVariant },
  historyList: { backgroundColor: '#fff' },
  historyItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  historyMain: { flex: 1, minWidth: 120 },
  historyDate: { fontSize: 14, fontWeight: '600', color: colors.onSurface, marginBottom: 6 },
  historyRowData: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyDesc: { fontSize: 14, color: colors.onSurfaceVariant },
  historyRight: { alignItems: 'flex-end', minWidth: 100 },
  historyAmount: { fontSize: 16, fontWeight: '700', color: colors.onSurface, marginBottom: 6 },
  statusSuccess: { backgroundColor: 'rgba(0,102,119,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,102,119,0.2)' },
  statusSuccessText: { color: colors.primaryContainer, fontSize: 10, fontWeight: '800' },
  historyFooter: { padding: 16, backgroundColor: 'rgba(229,238,255,0.3)', borderTopWidth: 1, borderTopColor: colors.outlineVariant, alignItems: 'center' },
  historyFooterText: { fontSize: 12, color: colors.onSurfaceVariant },

  promoCard: { backgroundColor: colors.primary, borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' },
  promoTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12, zIndex: 1 },
  promoDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 22, marginBottom: 20, width: '80%', zIndex: 1 },
  promoBtn: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, zIndex: 1 },
  promoBtnText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  promoIcon: { position: 'absolute', right: -30, bottom: -30, transform: [{ rotate: '-10deg' }] },

  securityCard: { backgroundColor: colors.surfaceContainer, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.outlineVariant },
  securityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  securityTitle: { fontSize: 12, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  securityDesc: { fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 22 }
});
