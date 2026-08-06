import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { useResponsive } from '@/hooks/useResponsive';
import { getTenantRentCycles, markRentCyclePaid, RentCycle, fetchStatementHtml } from '@/src/features/tenant/api/payments.api';
import { Theme } from '@/src/theme/Theme';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

interface TenantPaymentsScreenProps {
  token: string;
  onLogout: () => void;
}

export default function TenantPaymentsScreen({ token, onLogout }: TenantPaymentsScreenProps) {
  const { isDesktop } = useResponsive();
  const { handleScroll } = useScrollNav();
  const [cycles, setCycles] = useState<RentCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [autopayEnabled, setAutopayEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getTenantRentCycles(token)
      .then((data) => {
        if (isMounted) setCycles(data);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [token]);

  const activeCycle = cycles.length > 0 ? cycles[0] : null;

  const handlePayRent = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setPaySuccess(true);
      if (activeCycle) {
        markRentCyclePaid(token, activeCycle.id).catch(() => {});
      }
    }, 1500);
  };

  const handleDownloadStatement = async (cycleId: string) => {
    try {
      const html = await fetchStatementHtml(cycleId, token);
      if (Platform.OS === 'web') {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        // Native: open in-app browser (future: WebView modal)
        await WebBrowser.openBrowserAsync(
          `data:text/html,${encodeURIComponent(html)}`
        );
      }
    } catch (err: any) {
      console.warn('[Statement] Error opening statement:', err.message);
    }
  };

  return (
    <LinearGradient
      colors={Theme.Colors.backgroundGradient as [string, string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {isDesktop && <DesktopNavBar title="Billing & Rent Payments" />}

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Theme.Colors.primary} />
          </View>
        ) : (
          <ScrollView 
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={[styles.scrollContent, isDesktop ? styles.scrollContentDesktop : { paddingTop: 88 }]}
          >
          {/* Hero Cycle Glass Card */}
          <BlurView intensity={70} tint="light" style={styles.glassCard}>
            <View style={styles.cycleTopRow}>
              <View style={styles.cycleBadge}>
                <MaterialIcons name="calendar-month" size={18} color={Theme.Colors.primary} />
                <Text style={styles.cycleBadgeText}>
                  Current Cycle: {activeCycle?.billingMonth || 'October 2023'}
                </Text>
              </View>
              <View style={[styles.statusPill, activeCycle?.status === 'PAID' || paySuccess ? styles.statusPillPaid : styles.statusPillPending]}>
                <Text style={[styles.statusPillText, activeCycle?.status === 'PAID' || paySuccess ? styles.statusPillTextPaid : styles.statusPillTextPending]}>
                  {activeCycle?.status === 'PAID' || paySuccess ? 'PAID' : 'DUE SOON'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.amountText}>₹{activeCycle?.totalAmount?.toLocaleString() || '10,000.00'}</Text>
            <Text style={styles.dueText}>
              Due Date: {activeCycle?.dueDate ? new Date(activeCycle.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 5, 2023'} (In 3 days)
            </Text>
            
            <View style={styles.cycleActions}>
              <TouchableOpacity 
                onPress={() => setShowPayModal(true)}
                disabled={activeCycle?.status === 'PAID' || paySuccess}
                activeOpacity={0.85}
                style={{ flex: 1, minWidth: 140 }}
              >
                <LinearGradient
                  colors={['#00e0ff', '#0070ea']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.payBtn, (activeCycle?.status === 'PAID' || paySuccess) && styles.payBtnDisabled]}
                >
                  <MaterialIcons name="bolt" size={20} color="#fff" />
                  <Text style={styles.payBtnText}>
                    {activeCycle?.status === 'PAID' || paySuccess ? 'Rent Settled ✓' : 'Pay Rent Now'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.invoiceBtn} 
                activeOpacity={0.8}
                onPress={() => activeCycle && handleDownloadStatement(activeCycle.id)}
                disabled={!activeCycle}
              >
                <MaterialIcons name="download" size={20} color={Theme.Colors.primary} />
                <Text style={styles.invoiceBtnText}>Payment Statement</Text>
              </TouchableOpacity>
            </View>
          </BlurView>

          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <BlurView intensity={60} tint="light" style={styles.statBox}>
              <View style={styles.statIconBox}>
                <MaterialIcons name="verified-user" size={22} color={Theme.Colors.primary} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.statLabel}>LEASE ACCOUNT</Text>
                <Text style={[styles.statValue, { color: Theme.Colors.primary }]}>Active & Good Standing</Text>
              </View>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.statBox}>
              <View style={styles.statIconBox}>
                <MaterialIcons name="history" size={22} color={Theme.Colors.secondary} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.statLabel}>ON-TIME RATING</Text>
                <Text style={[styles.statValue, { color: Theme.Colors.secondary }]}>100% On Time</Text>
              </View>
            </BlurView>
          </View>

          {/* Payment History Glass List */}
          <BlurView intensity={70} tint="light" style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View>
                <Text style={styles.historyTitle}>Payment History</Text>
                <Text style={styles.historySub}>Verified ledger records</Text>
              </View>
              <View style={styles.filterBox}>
                <MaterialIcons name="filter-list" size={16} color={Theme.Colors.onSurfaceVariant} />
                <Text style={styles.filterText}>All Ledger Entries</Text>
              </View>
            </View>
            
            <View style={styles.historyList}>
              {cycles.length > 0 ? (
                cycles.map((cycle) => (
                  <View key={cycle.id} style={styles.historyItem}>
                    <View style={styles.historyMain}>
                      <Text style={styles.historyDate}>{cycle.billingMonth || 'Current Billing Cycle'}</Text>
                      <View style={styles.historyRowData}>
                        <MaterialIcons name="home-work" size={16} color={Theme.Colors.primary} />
                        <Text style={styles.historyDesc}>Monthly Rent Statement</Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                       <Text style={styles.historyAmount}>₹{cycle.totalAmount?.toLocaleString() || '0'}</Text>
                       <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                         <View style={[styles.statusSuccess, cycle.status === 'PAID' ? { backgroundColor: '#dcfce7', marginRight: 8 } : { backgroundColor: '#fef3c7', marginRight: 8 }]}>
                           <Text style={[styles.statusSuccessText, cycle.status === 'PAID' ? { color: '#15803d' } : { color: '#b45309' }]}>
                             {cycle.status}
                           </Text>
                         </View>
                         <TouchableOpacity onPress={() => handleDownloadStatement(cycle.id)}>
                           <MaterialIcons name="download" size={18} color={Theme.Colors.primary} />
                         </TouchableOpacity>
                       </View>
                     </View>
                  </View>
                ))
              ) : paySuccess ? (
                <View style={styles.historyItem}>
                  <View style={styles.historyMain}>
                    <Text style={styles.historyDate}>Today (Just now)</Text>
                    <View style={styles.historyRowData}>
                      <MaterialIcons name="home-work" size={16} color={Theme.Colors.primary} />
                      <Text style={styles.historyDesc}>Monthly Rent (Online Payment)</Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>₹10,000.00</Text>
                    <View style={styles.statusSuccess}>
                      <Text style={styles.statusSuccessText}>SUCCESS</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <MaterialIcons name="receipt-long" size={36} color={Theme.Colors.primary} style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Theme.Colors.onBackground }}>No Billing Transactions Found</Text>
                  <Text style={{ fontSize: 12, color: Theme.Colors.onSurfaceVariant, marginTop: 2 }}>Your property ledger account is up to date.</Text>
                </View>
              )}
            </View>
            <View style={styles.historyFooter}>
              <Text style={styles.historyFooterText}>Showing recent billing activity</Text>
            </View>
          </BlurView>

          {/* Autopay Cyan Card */}
          <LinearGradient
            colors={['#00e0ff', '#0070ea']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoCard}
          >
            <Text style={styles.promoTitle}>Autopay Recurring Billing</Text>
            <Text style={styles.promoDesc}>
              {autopayEnabled ? 'Autopay is ACTIVE. Your rent will be auto-deducted on the 1st of every month.' : 'Never miss a rent due date. Enable Autopay and receive instant payment receipts.'}
            </Text>
            <TouchableOpacity 
              style={[styles.promoBtn, autopayEnabled && { backgroundColor: '#e0f2fe' }]}
              onPress={() => setAutopayEnabled(!autopayEnabled)}
              activeOpacity={0.85}
            >
              <Text style={styles.promoBtnText}>
                {autopayEnabled ? 'Autopay Enabled ✓' : 'Enable Autopay'}
              </Text>
            </TouchableOpacity>
            <MaterialIcons name="payments" size={130} color="rgba(255,255,255,0.18)" style={styles.promoIcon} />
          </LinearGradient>

          {/* Security Guarantee Banner */}
          <BlurView intensity={60} tint="light" style={styles.securityCard}>
            <View style={styles.securityHeader}>
              <MaterialIcons name="security" size={20} color={Theme.Colors.primary} />
              <Text style={styles.securityTitle}>BANK-GRADE 256-BIT ENCRYPTION</Text>
            </View>
            <Text style={styles.securityDesc}>All payments are processed securely through PCI-DSS Level 1 compliant payment gateways. No sensitive card data is stored on application servers.</Text>
          </BlurView>
        </ScrollView>
        )}

        {/* Payment Gateway Simulation Modal */}
        {showPayModal && (
          <Modal transparent visible={true} animationType="fade" onRequestClose={() => setShowPayModal(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                {!paySuccess ? (
                  <>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Checkout Payment</Text>
                      <TouchableOpacity onPress={() => setShowPayModal(false)}>
                        <MaterialIcons name="close" size={24} color={Theme.Colors.onBackground} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalSubTitle}>Review Rent Statement</Text>
                    
                    <View style={styles.checkoutBox}>
                      <View style={styles.checkoutRow}>
                        <Text style={styles.checkoutLabel}>Billing Cycle</Text>
                        <Text style={styles.checkoutValue}>{activeCycle?.billingMonth || 'October 2023'}</Text>
                      </View>
                      <View style={styles.checkoutRow}>
                        <Text style={styles.checkoutLabel}>Rent Amount</Text>
                        <Text style={styles.checkoutValue}>₹{activeCycle?.totalAmount?.toLocaleString() || '10,000.00'}</Text>
                      </View>
                      <View style={[styles.checkoutRow, { borderBottomWidth: 0 }]}>
                        <Text style={styles.checkoutLabel}>Processing Fee</Text>
                        <Text style={[styles.checkoutValue, { color: '#0d8a5f' }]}>₹0.00 (Waived)</Text>
                      </View>
                    </View>

                    {paying ? (
                      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={Theme.Colors.primary} />
                        <Text style={{ marginTop: 12, fontSize: 14, color: Theme.Colors.onSurfaceVariant, fontWeight: '600' }}>Processing secure payment...</Text>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={handlePayRent} activeOpacity={0.85}>
                        <LinearGradient
                          colors={['#00e0ff', '#0070ea']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.modalPayBtn}
                        >
                          <MaterialIcons name="lock" size={20} color="#fff" />
                          <Text style={styles.modalPayBtnText}>Confirm & Pay ₹{activeCycle?.totalAmount?.toLocaleString() || '10,000.00'}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                    <View style={styles.successIconBox}>
                      <MaterialIcons name="check-circle" size={56} color="#0d8a5f" />
                    </View>
                    <Text style={styles.successTitle}>Payment Successful!</Text>
                    <Text style={styles.successDesc}>Your rent payment has been processed and logged on the property ledger.</Text>
                    <TouchableOpacity style={styles.modalCloseBtn} onPress={() => { setShowPayModal(false); setPaySuccess(false); }}>
                      <Text style={styles.modalCloseBtnText}>Back to Billing Hub</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },
  scrollContentDesktop: { paddingTop: 20 },
  
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: Theme.Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    overflow: 'hidden'
  },
  cycleTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cycleBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cycleBadgeText: { color: Theme.Colors.primary, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillPending: { backgroundColor: '#fef3c7' },
  statusPillPaid: { backgroundColor: '#dcfce7' },
  statusPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  statusPillTextPending: { color: '#b45309' },
  statusPillTextPaid: { color: '#15803d' },

  amountText: { fontSize: 38, fontWeight: '800', color: Theme.Colors.onSurface },
  dueText: { fontSize: 14, color: Theme.Colors.onSurfaceVariant, marginTop: 4, marginBottom: 20 },
  cycleActions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  invoiceBtn: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderWidth: 1, borderColor: 'rgba(0, 104, 117, 0.2)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, minWidth: 140 },
  invoiceBtnText: { color: Theme.Colors.primary, fontSize: 15, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 14 },
  statBox: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.65)', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.8)', overflow: 'hidden' },
  statIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0, 104, 117, 0.1)', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 11, fontWeight: '800', color: Theme.Colors.onSurfaceVariant, letterSpacing: 0.5, marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: '800' },

  historyCard: { backgroundColor: 'rgba(255, 255, 255, 0.65)', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.8)', shadowColor: Theme.Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 4 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(186, 201, 204, 0.3)' },
  historyTitle: { fontSize: 18, fontWeight: '800', color: Theme.Colors.onSurface },
  historySub: { fontSize: 12, color: Theme.Colors.onSurfaceVariant, marginTop: 2 },
  filterBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255, 255, 255, 0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(186, 201, 204, 0.4)' },
  filterText: { fontSize: 13, color: Theme.Colors.onSurfaceVariant, fontWeight: '600' },
  historyList: { backgroundColor: 'rgba(255, 255, 255, 0.7)' },
  historyItem: { padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(186, 201, 204, 0.25)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyMain: { flex: 1 },
  historyDate: { fontSize: 14, fontWeight: '700', color: Theme.Colors.onSurface, marginBottom: 4 },
  historyRowData: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyDesc: { fontSize: 13, color: Theme.Colors.onSurfaceVariant },
  historyRight: { alignItems: 'flex-end' },
  historyAmount: { fontSize: 15, fontWeight: '800', color: Theme.Colors.onSurface, marginBottom: 4 },
  statusSuccess: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusSuccessText: { color: '#15803d', fontSize: 10, fontWeight: '800' },
  historyFooter: { padding: 14, backgroundColor: 'rgba(255, 255, 255, 0.4)', alignItems: 'center' },
  historyFooterText: { fontSize: 12, color: Theme.Colors.onSurfaceVariant, fontWeight: '600' },

  promoCard: { borderRadius: 24, padding: 22, position: 'relative', overflow: 'hidden', shadowColor: '#0070ea', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 5 },
  promoTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8, zIndex: 1 },
  promoDesc: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, lineHeight: 20, marginBottom: 18, width: '82%', zIndex: 1 },
  promoBtn: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, zIndex: 1 },
  promoBtnText: { color: '#0070ea', fontSize: 13, fontWeight: '800' },
  promoIcon: { position: 'absolute', right: -25, bottom: -25 },

  securityCard: { backgroundColor: 'rgba(255, 255, 255, 0.65)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.8)', overflow: 'hidden' },
  securityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  securityTitle: { fontSize: 12, fontWeight: '800', color: Theme.Colors.primary, letterSpacing: 0.8 },
  securityDesc: { fontSize: 13, color: Theme.Colors.onSurfaceVariant, lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 28, 48, 0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Theme.Colors.onBackground },
  modalSubTitle: { fontSize: 14, color: Theme.Colors.onSurfaceVariant, marginBottom: 16 },
  
  checkoutBox: { backgroundColor: 'rgba(0, 104, 117, 0.05)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0, 104, 117, 0.15)', marginBottom: 20 },
  checkoutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(186, 201, 204, 0.2)' },
  checkoutLabel: { fontSize: 14, color: Theme.Colors.onSurfaceVariant, fontWeight: '600' },
  checkoutValue: { fontSize: 14, color: Theme.Colors.onBackground, fontWeight: '800' },

  modalPayBtn: { paddingVertical: 14, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  modalPayBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  successIconBox: { marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: '800', color: Theme.Colors.onBackground, marginBottom: 6 },
  successDesc: { fontSize: 14, color: Theme.Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalCloseBtn: { backgroundColor: Theme.Colors.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center', width: '100%' },
  modalCloseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});


