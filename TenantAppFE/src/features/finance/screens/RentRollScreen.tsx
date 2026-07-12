import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useResponsive } from '@/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { Colors, Rounded, Spacing } from '@/src/theme/Theme';
import { 
  batchGenerateRentCycle, 
  listRentCycles, 
  getPreFlightChecklist, 
  batchPublishRentCycle,
  batchUnpublishRentCycle,
  RentCycleResponse, 
  PreFlightChecklistResponse 
} from '@/src/features/finance/api/rentCycle.api';
import { useToast } from '@/src/components/common/feedback/ToastContext';

export default function RentRollScreen({ token }: { token: string | null }) {
  const router = useRouter();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();
  const propertyId = paramPropertyId || (properties && properties.length > 0 ? properties[0].id : null);
  const { showToast } = useToast();

  const [billingMonth, setBillingMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const handlePrevMonth = () => {
    const [yearStr, monthStr] = billingMonth.split('-');
    let year = parseInt(yearStr);
    let month = parseInt(monthStr);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    setBillingMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [yearStr, monthStr] = billingMonth.split('-');
    let year = parseInt(yearStr);
    let month = parseInt(monthStr);
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
    setBillingMonth(`${year}-${String(month).padStart(2, '0')}`);
  };
  
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [invoices, setInvoices] = useState<RentCycleResponse[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [checklist, setChecklist] = useState<PreFlightChecklistResponse | null>(null);

  useEffect(() => {
    if (token && propertyId) {
      checkExistingInvoices();
    }
  }, [billingMonth, token, propertyId]);

  const checkExistingInvoices = async () => {
    if (!token || !propertyId) return;
    try {
      setIsLoading(true);
      const data = await listRentCycles(billingMonth, token);
      if (data && data.length > 0) {
        setInvoices(data);
        setHasGenerated(true);
      } else {
        setInvoices([]);
        setHasGenerated(false);
        const flightData = await getPreFlightChecklist(propertyId as string, billingMonth, token);
        setChecklist(flightData);
      }
    } catch (e) {
      console.error("Failed to check invoices", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!token || !propertyId) return;
    try {
      setIsGenerating(true);
      const generated = await batchGenerateRentCycle(propertyId as string, billingMonth, dueDate, token);
      setInvoices(generated);
      setHasGenerated(true);
      showToast("Rent cycle generated successfully!", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to generate rent cycle.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!token || !propertyId) return;
    try {
      setIsPublishing(true);
      const updated = await batchPublishRentCycle(propertyId as string, billingMonth, token);
      setInvoices(updated);
      showToast("Invoices published to tenants successfully!", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to publish invoices.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!token || !propertyId) return;
    try {
      setIsUnpublishing(true);
      const updated = await batchUnpublishRentCycle(propertyId as string, billingMonth, token);
      setInvoices(updated);
      showToast("Invoices reverted to draft successfully!", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to unpublish invoices.", "error");
    } finally {
      setIsUnpublishing(false);
    }
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const publishedCount = invoices.filter(inv => inv.status === 'PUBLISHED').length;
  const pendingCount = invoices.filter(inv => inv.status === 'PENDING').length;

  const renderContent = () => (
    <View style={styles.inner}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Generate Rent Cycle</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 6, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 8 }}>
            <MaterialIcons name="chevron-left" size={20} color="#006875" />
          </TouchableOpacity>
          
          <View style={[styles.monthBadge, { marginTop: 0 }]}>
            <MaterialIcons name="calendar-today" size={16} color="#006875" />
            <Text style={styles.monthBadgeText}>{billingMonth}</Text>
          </View>
          
          <TouchableOpacity onPress={handleNextMonth} style={{ padding: 6, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 8 }}>
            <MaterialIcons name="chevron-right" size={20} color="#006875" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#006875" style={{ marginTop: 50 }} />
      ) : !hasGenerated ? (
        <BlurView intensity={60} tint="light" style={styles.card}>
          <MaterialIcons name="fact-check" size={48} color="#006875" style={{ marginBottom: 16 }} />
          <Text style={styles.cardTitle}>Pre-flight Checklist</Text>
          <Text style={styles.cardText}>Ensure all meter readings and custom billing worksheets for {billingMonth} have been completed before generating.</Text>
          
          {checklist && (
            <View style={styles.checklistGrid}>
              <View style={styles.checklistItem}>
                <Text style={styles.checklistLabel}>Active Leases</Text>
                <Text style={styles.checklistValue}>{checklist.activeLeases} / {checklist.totalUnits}</Text>
              </View>
              <View style={styles.checklistItem}>
                <Text style={styles.checklistLabel}>Meter Readings</Text>
                <Text style={styles.checklistValue}>
                  {checklist.meterReadingsEntered >= checklist.meterReadingsExpected ? '✅ ' : '⚠️ '} 
                  {checklist.meterReadingsEntered} / {checklist.meterReadingsExpected}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.statusBox, checklist && !checklist.isReady && { backgroundColor: '#fee2e2' }]}>
            <MaterialIcons name={checklist && !checklist.isReady ? "warning" : "info-outline"} size={20} color={checklist && !checklist.isReady ? "#b91c1c" : "#006875"} />
            <Text style={[styles.statusText, checklist && !checklist.isReady && { color: '#b91c1c' }]}>
              {checklist && !checklist.isReady ? "Please complete required readings before generating." : `Ready to compile invoices for ${billingMonth}`}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.generateBtn, isGenerating && { opacity: 0.7 }]} 
            onPress={handleGenerate}
            disabled={isGenerating || !!(checklist && !checklist.isReady)}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.generateBtnText}>GENERATE INVOICES</Text>
            )}
          </TouchableOpacity>
        </BlurView>
      ) : (
        <View style={styles.resultsContainer}>
          <BlurView intensity={40} tint="light" style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Expected Revenue</Text>
            <Text style={styles.summaryAmount}>₹ {totalRevenue.toFixed(2)}</Text>
            
            <View style={styles.summaryStatusRow}>
              <View style={[styles.summaryStatusBadge, styles.statusPublished]}>
                <MaterialIcons name="check-circle" size={12} color="#0369a1" style={{ marginRight: 4 }} />
                <Text style={[styles.summaryStatusText, { color: '#0369a1' }]}>{publishedCount} Published</Text>
              </View>
              <View style={[styles.summaryStatusBadge, styles.statusPending]}>
                <MaterialIcons name="hourglass-empty" size={12} color="#d97706" style={{ marginRight: 4 }} />
                <Text style={[styles.summaryStatusText, { color: '#d97706' }]}>{pendingCount} Pending</Text>
              </View>
            </View>

            {pendingCount > 0 && (
              <>
                <TouchableOpacity 
                  style={[styles.publishBtnContainer, isPublishing && { opacity: 0.7 }]} 
                  onPress={handlePublish}
                  disabled={isPublishing}
                >
                  <LinearGradient
                    colors={['#00d4ff', '#0072ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.publishBtn}
                  >
                    {isPublishing ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.publishBtnText}>
                        {publishedCount > 0 ? 'PUBLISH TO REMAINING TENANTS' : 'PUBLISH TO TENANTS'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.unpublishBtnContainer, 
                    isGenerating && { opacity: 0.7 },
                    { marginTop: 12, width: '100%' }
                  ]} 
                  onPress={handleGenerate}
                  disabled={isGenerating}
                  activeOpacity={0.8}
                >
                  <View style={styles.unpublishBtn}>
                    {isGenerating ? (
                      <ActivityIndicator color="#006875" size="small" />
                    ) : (
                      <Text style={styles.unpublishBtnText}>RE-GENERATE DRAFT INVOICES (RE-RUN CALCULATION)</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </>
            )}

            {publishedCount > 0 && (
              <TouchableOpacity 
                style={[
                  styles.unpublishBtnContainer, 
                  isUnpublishing && { opacity: 0.7 },
                  { marginTop: pendingCount > 0 ? 12 : 0, width: '100%' }
                ]} 
                onPress={handleUnpublish}
                disabled={isUnpublishing}
                activeOpacity={0.8}
              >
                <View style={styles.unpublishBtn}>
                  {isUnpublishing ? (
                    <ActivityIndicator color="#006875" size="small" />
                  ) : (
                    <Text style={styles.unpublishBtnText}>REVERT TO DRAFT (UNPUBLISH)</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </BlurView>

          <View style={styles.invoiceList}>
            {invoices.map((invoice, idx) => (
              <BlurView key={invoice.id || idx} intensity={40} tint="light" style={styles.invoiceCard}>
                <View style={styles.invoiceHeader}>
                  <View>
                    <Text style={styles.invoiceUnit}>Apt {invoice.unitNumber} - {invoice.tenantName}</Text>
                    <Text style={{ fontSize: 12, color: '#5b6b6d', marginTop: 2 }}>ID: #{invoice.id?.substring(0, 8)}</Text>
                  </View>
                  <Text style={styles.invoiceTotal}>₹ {invoice.totalAmount?.toFixed(2)}</Text>
                </View>
                
                <View style={styles.chargesList}>
                  {invoice.charges?.map((charge, i) => (
                    <View key={i} style={styles.chargeRow}>
                      <Text style={styles.chargeDesc}>{charge.description || charge.chargeType}</Text>
                      <Text style={styles.chargeAmt}>₹ {charge.amount?.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={[
                  styles.statusBadge, 
                  invoice.status === 'PAID' && { backgroundColor: '#d1fae5' },
                  invoice.status === 'PUBLISHED' && { backgroundColor: '#e0f2fe' },
                  invoice.status === 'OVERDUE' && { backgroundColor: '#fee2e2' }
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    invoice.status === 'PAID' && { color: '#059669' },
                    invoice.status === 'PUBLISHED' && { color: '#0369a1' },
                    invoice.status === 'OVERDUE' && { color: '#b91c1c' }
                  ]}>{invoice.status}</Text>
                </View>
              </BlurView>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <LinearGradient colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {isDesktop ? (
          <>
            <DesktopNavBar activeTab="Finance" onBack={() => router.back()} backText="Back to Settings" />
            <ScrollView contentContainerStyle={styles.desktopScroll}>
              {renderContent()}
            </ScrollView>
          </>
        ) : (
          <>
            <View style={styles.mobileHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
              </TouchableOpacity>
              <Text style={styles.mobileTitle}>Rent Roll</Text>
            </View>
            <ScrollView contentContainerStyle={styles.mobileScroll}>
              {renderContent()}
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  desktopScroll: { padding: 40, alignItems: 'center' },
  mobileScroll: { padding: 20 },
  inner: { width: '100%', maxWidth: 800 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#151d1e' },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  monthBadgeText: { fontSize: 14, fontWeight: '700', color: '#006875' },
  
  card: { padding: 40, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', marginTop: 20 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#151d1e', marginBottom: 12 },
  cardText: { fontSize: 15, color: '#5b6b6d', textAlign: 'center', marginBottom: 32, maxWidth: 500, lineHeight: 22 },
  checklistGrid: { flexDirection: 'row', gap: 24, marginBottom: 24, width: '100%', justifyContent: 'center' },
  checklistItem: { backgroundColor: 'rgba(255,255,255,0.7)', padding: 16, borderRadius: 12, alignItems: 'center', flex: 1, maxWidth: 200 },
  checklistLabel: { fontSize: 12, fontWeight: '700', color: '#5b6b6d', textTransform: 'uppercase', marginBottom: 8 },
  checklistValue: { fontSize: 20, fontWeight: '800', color: '#006875' },
  statusBox: { flexDirection: 'row', backgroundColor: '#e0f2fe', padding: 16, borderRadius: 12, marginBottom: 32, width: '100%', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 14, fontWeight: '700', color: '#0369a1' },
  generateBtn: { backgroundColor: '#0072ff', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12, shadowColor: '#0072ff', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  generateBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  
  resultsContainer: { width: '100%' },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: Rounded.xl,
    padding: Spacing.containerPadding,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 3,
  },
  summaryLabel: { fontSize: 14, fontWeight: '700', color: '#5b6b6d', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  summaryAmount: { fontSize: 36, fontWeight: '800', color: '#059669', marginBottom: 12 },
  summaryStatusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusPublished: {
    backgroundColor: '#e0f2fe',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  summaryStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  publishBtnContainer: {
    shadowColor: '#0072ff',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  publishBtn: {
    height: 38,
    paddingHorizontal: 24,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishBtnText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  
  invoiceList: { gap: 16 },
  invoiceCard: { padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,104,117,0.1)' },
  invoiceUnit: { fontSize: 16, fontWeight: '800', color: '#151d1e' },
  invoiceTotal: { fontSize: 18, fontWeight: '800', color: '#006875' },
  chargesList: { gap: 8, marginBottom: 16 },
  chargeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  chargeDesc: { fontSize: 14, color: '#5b6b6d', fontWeight: '500' },
  chargeAmt: { fontSize: 14, color: '#151d1e', fontWeight: '600' },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '800', color: '#d97706' },
  
  mobileHeader: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  mobileTitle: { fontSize: 22, fontWeight: '800', color: '#151d1e' },
  unpublishBtnContainer: {
    shadowColor: '#006875',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#006875',
    borderRadius: 19,
    overflow: 'hidden',
  },
  unpublishBtn: {
    height: 38,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unpublishBtnText: { color: '#006875', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
});
