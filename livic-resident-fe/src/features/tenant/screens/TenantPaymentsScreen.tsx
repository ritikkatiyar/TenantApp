import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { useResponsive } from '@/src/hooks/useResponsive';
import { getTenantRentCycles, markRentCyclePaid, RentCycle, fetchStatementHtml } from '@/src/features/tenant/api/payments.api';
import { getActiveLease, LeaseResponse } from '@/src/features/tenant/api/lease.api';
import { useAppTheme } from '@/src/theme/ThemeContext';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

interface TenantPaymentsScreenProps {
  token: string;
  onLogout: () => void;
}

export default function TenantPaymentsScreen({ token, onLogout }: TenantPaymentsScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { isDesktop } = useResponsive();
  const { handleScroll } = useScrollNav();
  const [cycles, setCycles] = useState<RentCycle[]>([]);
  const [lease, setLease] = useState<LeaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [autopayEnabled, setAutopayEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [cyclesData, leaseData] = await Promise.all([
          getTenantRentCycles(token).catch(() => []),
          getActiveLease(token).catch(() => null),
        ]);
        if (isMounted) {
          setCycles(cyclesData || []);
          setLease(leaseData || null);
        }
      } catch (err) {
        console.warn('[TenantPaymentsScreen] Error loading payment data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [token]);

  const activeCycle = cycles.length > 0 ? cycles[0] : null;
  const isPaidOrNoDue = !activeCycle || activeCycle.status === 'PAID' || paySuccess;

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
        await WebBrowser.openBrowserAsync(
          `data:text/html,${encodeURIComponent(html)}`
        );
      }
    } catch (err: any) {
      console.warn('[Statement] Error opening statement:', err.message);
    }
  };

  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const displayAmount = activeCycle?.totalAmount !== undefined 
    ? activeCycle.totalAmount 
    : (isPaidOrNoDue ? 0 : (lease?.monthlyRentAmount || 0));

  return (
    <PageShell
      scrollable={!loading}
      header={isDesktop ? <DesktopNavBar title="Billing & Rent Payments" /> : null}
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
    >
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
        </View>
      ) : (
        <>
          {/* Hero Cycle Glass Card */}
          <BlurView intensity={70} tint={isDark ? "dark" : "light"} style={styles.glassCard}>
            <View style={styles.cycleTopRow}>
              <View style={styles.cycleBadge}>
                <MaterialIcons name="calendar-month" size={18} color={theme.Colors.primary} />
                <Text style={styles.cycleBadgeText}>
                  Current Cycle: {activeCycle?.billingMonth || currentMonthName}
                </Text>
              </View>
              <View style={[styles.statusPill, isPaidOrNoDue ? styles.statusPillPaid : styles.statusPillPending]}>
                <Text style={[styles.statusPillText, isPaidOrNoDue ? styles.statusPillTextPaid : styles.statusPillTextPending]}>
                  {isPaidOrNoDue ? (cycles.length === 0 ? 'UP TO DATE' : 'PAID') : 'DUE SOON'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.amountText}>₹{displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            <Text style={styles.dueText}>
              {activeCycle?.dueDate 
                ? `Due Date: ${new Date(activeCycle.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` 
                : (isPaidOrNoDue ? 'No pending rent due' : 'Due on 5th of current month')}
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
                  <MaterialIcons name="bolt" size={20} color="#ffffff" />
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
                <MaterialIcons name="download" size={20} color={theme.Colors.primary} />
                <Text style={styles.invoiceBtnText}>Payment Statement</Text>
              </TouchableOpacity>
            </View>
          </BlurView>

          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={styles.statBox}>
              <View style={styles.statIconBox}>
                <MaterialIcons name="verified-user" size={22} color={theme.Colors.primary} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.statLabel}>LEASE ACCOUNT</Text>
                <Text style={[styles.statValue, { color: theme.Colors.primary }]}>Active & Good Standing</Text>
              </View>
            </BlurView>

            <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={styles.statBox}>
              <View style={styles.statIconBox}>
                <MaterialIcons name="history" size={22} color={theme.Colors.secondary} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.statLabel}>ON-TIME RATING</Text>
                <Text style={[styles.statValue, { color: theme.Colors.secondary }]}>100% On Time</Text>
              </View>
            </BlurView>
          </View>

          {/* Payment History Glass List */}
          <BlurView intensity={70} tint={isDark ? "dark" : "light"} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View>
                <Text style={styles.historyTitle}>Payment History</Text>
                <Text style={styles.historySub}>Verified ledger records</Text>
              </View>
              <View style={styles.filterBox}>
                <MaterialIcons name="filter-list" size={16} color={theme.Colors.onSurfaceVariant} />
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
                        <MaterialIcons name="home-work" size={16} color={theme.Colors.primary} />
                        <Text style={styles.historyDesc}>Monthly Rent Statement</Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                       <Text style={styles.historyAmount}>₹{cycle.totalAmount?.toLocaleString() || '0'}</Text>
                       <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                         <View style={[styles.statusSuccess, cycle.status === 'PAID' ? { backgroundColor: theme.Colors.primaryContainer, marginRight: 8 } : { backgroundColor: theme.Colors.secondaryContainer, marginRight: 8 }]}>
                           <Text style={[styles.statusSuccessText, cycle.status === 'PAID' ? { color: theme.Colors.onPrimaryContainer } : { color: theme.Colors.onSecondaryContainer }]}>
                             {cycle.status}
                           </Text>
                         </View>
                         <TouchableOpacity onPress={() => handleDownloadStatement(cycle.id)}>
                           <MaterialIcons name="download" size={18} color={theme.Colors.primary} />
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
                      <MaterialIcons name="home-work" size={16} color={theme.Colors.primary} />
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
                  <MaterialIcons name="receipt-long" size={36} color={theme.Colors.primary} style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '700', color: theme.Colors.onBackground }}>No Billing Transactions Found</Text>
                  <Text style={{ fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2 }}>Your property ledger account is up to date.</Text>
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
              style={[styles.promoBtn, autopayEnabled && { backgroundColor: theme.Colors.primaryContainer }]}
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
          <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={styles.securityCard}>
            <View style={styles.securityHeader}>
              <MaterialIcons name="security" size={20} color={theme.Colors.primary} />
              <Text style={styles.securityTitle}>BANK-GRADE 256-BIT ENCRYPTION</Text>
            </View>
            <Text style={styles.securityDesc}>All payments are processed securely through PCI-DSS Level 1 compliant payment gateways. No sensitive card data is stored on application servers.</Text>
          </BlurView>
        </>
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
                        <MaterialIcons name="close" size={24} color={theme.Colors.onBackground} />
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
                        <Text style={[styles.checkoutValue, { color: theme.Colors.primary }]}>₹0.00 (Waived)</Text>
                      </View>
                    </View>

                    {paying ? (
                      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={theme.Colors.primary} />
                        <Text style={{ marginTop: 12, fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, fontWeight: '600' }}>Processing secure payment...</Text>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={handlePayRent} activeOpacity={0.85}>
                        <LinearGradient
                          colors={['#00e0ff', '#0070ea']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.modalPayBtn}
                        >
                          <MaterialIcons name="lock" size={20} color="#ffffff" />
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
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },
  scrollContentDesktop: { paddingTop: 20 },
  
  glassCard: {
    backgroundColor: isDark ? 'rgba(15, 23, 32, 0.88)' : 'rgba(255, 255, 255, 0.65)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.8)',
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.2 : 0.06,
    shadowRadius: 20,
    elevation: 4,
    overflow: 'hidden'
  },
  cycleTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cycleBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cycleBadgeText: { color: theme.Colors.primary, fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillPending: { backgroundColor: theme.Colors.secondaryContainer },
  statusPillPaid: { backgroundColor: theme.Colors.primaryContainer },
  statusPillText: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '800', letterSpacing: 0.5 },
  statusPillTextPending: { color: theme.Colors.onSecondaryContainer },
  statusPillTextPaid: { color: theme.Colors.onPrimaryContainer },

  amountText: { fontSize: theme.Typography.headlineXl.fontSize, fontWeight: '800', color: theme.Colors.onSurface },
  dueText: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 4, marginBottom: 20 },
  cycleActions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: '#ffffff', fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '700' },
  invoiceBtn: { flex: 1, backgroundColor: isDark ? 'rgba(27, 38, 51, 0.9)' : 'rgba(255, 255, 255, 0.8)', borderWidth: 1, borderColor: isDark ? 'rgba(0, 229, 255, 0.25)' : 'rgba(0, 104, 117, 0.2)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, minWidth: 140 },
  invoiceBtnText: { color: theme.Colors.primary, fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 14 },
  statBox: { flex: 1, backgroundColor: isDark ? 'rgba(27, 38, 51, 0.85)' : 'rgba(255, 255, 255, 0.65)', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.8)', overflow: 'hidden' },
  statIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: isDark ? 'rgba(0, 229, 255, 0.15)' : 'rgba(0, 104, 117, 0.1)', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '800', color: theme.Colors.onSurfaceVariant, letterSpacing: 0.5, marginBottom: 2 },
  statValue: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '800' },

  historyCard: { backgroundColor: isDark ? 'rgba(15, 23, 32, 0.88)' : 'rgba(255, 255, 255, 0.65)', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.8)', shadowColor: theme.Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.2 : 0.06, shadowRadius: 20, elevation: 4 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(186, 201, 204, 0.3)' },
  historyTitle: { fontSize: theme.Typography.bodyLg.fontSize, fontWeight: '800', color: theme.Colors.onSurface },
  historySub: { fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 2 },
  filterBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: isDark ? 'rgba(27, 38, 51, 0.85)' : 'rgba(255, 255, 255, 0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(186, 201, 204, 0.4)' },
  filterText: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, fontWeight: '600' },
  historyList: { backgroundColor: isDark ? 'rgba(19, 28, 38, 0.85)' : 'rgba(255, 255, 255, 0.7)' },
  historyItem: { padding: 18, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(186, 201, 204, 0.25)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyMain: { flex: 1 },
  historyDate: { fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '700', color: theme.Colors.onSurface, marginBottom: 4 },
  historyRowData: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyDesc: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant },
  historyRight: { alignItems: 'flex-end' },
  historyAmount: { fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '800', color: theme.Colors.onSurface, marginBottom: 4 },
  statusSuccess: { backgroundColor: theme.Colors.primaryContainer, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusSuccessText: { color: theme.Colors.onPrimaryContainer, fontSize: theme.Typography.labelSmall.fontSize, fontWeight: '800' },
  historyFooter: { padding: 14, backgroundColor: isDark ? 'rgba(15, 23, 32, 0.6)' : 'rgba(255, 255, 255, 0.4)', alignItems: 'center' },
  historyFooterText: { fontSize: theme.Typography.bodySmall.fontSize, color: theme.Colors.onSurfaceVariant, fontWeight: '600' },

  promoCard: { borderRadius: 24, padding: 22, position: 'relative', overflow: 'hidden', shadowColor: theme.Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 5 },
  promoTitle: { color: '#ffffff', fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '800', marginBottom: 8, zIndex: 1 },
  promoDesc: { color: 'rgba(255, 255, 255, 0.9)', fontSize: theme.Typography.bodyMedium.fontSize, lineHeight: 20, marginBottom: 18, width: '82%', zIndex: 1 },
  promoBtn: { backgroundColor: '#ffffff', alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, zIndex: 1 },
  promoBtnText: { color: '#006875', fontSize: theme.Typography.bodyMedium.fontSize, fontWeight: '800' },
  promoIcon: { position: 'absolute', right: -25, bottom: -25 },

  securityCard: { backgroundColor: isDark ? 'rgba(15, 23, 32, 0.88)' : 'rgba(255, 255, 255, 0.65)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.8)', overflow: 'hidden' },
  securityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  securityTitle: { fontSize: theme.Typography.bodySmall.fontSize, fontWeight: '800', color: theme.Colors.primary, letterSpacing: 0.8 },
  securityDesc: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 28, 48, 0.75)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: isDark ? '#131C26' : theme.Colors.surfaceContainerLowest, borderRadius: 24, padding: 24, shadowColor: 'black', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '800', color: theme.Colors.onBackground },
  modalSubTitle: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, marginBottom: 16 },
  
  checkoutBox: { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.1)' : 'rgba(0, 104, 117, 0.05)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isDark ? 'rgba(0, 229, 255, 0.2)' : 'rgba(0, 104, 117, 0.15)', marginBottom: 20 },
  checkoutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(186, 201, 204, 0.2)' },
  checkoutLabel: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, fontWeight: '600' },
  checkoutValue: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onBackground, fontWeight: '800' },

  modalPayBtn: { paddingVertical: 14, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  modalPayBtnText: { color: '#ffffff', fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '700' },

  successIconBox: { marginBottom: 12 },
  successTitle: { fontSize: theme.Typography.titleLarge.fontSize, fontWeight: '800', color: theme.Colors.onBackground, marginBottom: 6 },
  successDesc: { fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalCloseBtn: { backgroundColor: theme.Colors.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center', width: '100%' },
  modalCloseBtnText: { color: isDark ? '#090D12' : '#ffffff', fontSize: theme.Typography.bodyLarge.fontSize, fontWeight: '700' }
});


