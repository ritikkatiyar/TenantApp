import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useResponsive } from '@/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { Theme } from '@/src/theme/Theme';
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
import { PageShell } from '@/src/components/common/layout/PageShell';
import { ResponsiveHeader } from '@/src/components/common/layout/ResponsiveHeader';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatCard } from '@/src/components/common/display/StatCard';
import { SectionHeader } from '@/src/components/common/display/SectionHeader';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { ActionButton } from '@/src/components/common/inputs/ActionButton';

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
      // Handled silently since checking can fail initially
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

  const renderMonthSelector = () => (
    <View style={styles.selectorContainer}>
      <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBadge}>
        <MaterialIcons name="chevron-left" size={20} color={Theme.Colors.primary} />
      </TouchableOpacity>
      
      <View style={styles.monthBadge}>
        <MaterialIcons name="calendar-today" size={16} color={Theme.Colors.primary} />
        <Text style={styles.monthBadgeText}>{billingMonth}</Text>
      </View>
      
      <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBadge}>
        <MaterialIcons name="chevron-right" size={20} color={Theme.Colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => (
    <View style={styles.inner}>
      <SectionHeader
        title={isDesktop ? "Generate Rent Cycle" : ""}
        rightAction={renderMonthSelector()}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color={Theme.Colors.primary} style={{ marginTop: 50 }} />
      ) : !hasGenerated ? (
        <GlassCard style={styles.card}>
          <MaterialIcons name="fact-check" size={48} color={Theme.Colors.primary} style={{ marginBottom: 16 }} />
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
            <MaterialIcons 
              name={checklist && !checklist.isReady ? "warning" : "info-outline"} 
              size={20} 
              color={checklist && !checklist.isReady ? "#b91c1c" : Theme.Colors.primary} 
            />
            <Text style={[styles.statusText, checklist && !checklist.isReady && { color: '#b91c1c' }]}>
              {checklist && !checklist.isReady ? "Please complete required readings before generating." : `Ready to compile invoices for ${billingMonth}`}
            </Text>
          </View>

          <ActionButton
            title="GENERATE INVOICES"
            onPress={handleGenerate}
            loading={isGenerating}
            disabled={isGenerating || !!(checklist && !checklist.isReady)}
            style={styles.generateBtn}
          />
        </GlassCard>
      ) : (
        <View style={styles.resultsContainer}>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Expected Revenue</Text>
            <Text style={styles.summaryAmount}>₹ {totalRevenue.toFixed(2)}</Text>
            
            <View style={styles.summaryStatusRow}>
              <StatCard
                label="Published"
                value={publishedCount}
                trend="Tenant App notified"
                trendType="positive"
                iconName="check-circle"
                style={styles.miniStat}
              />
              <StatCard
                label="Pending Drafts"
                value={pendingCount}
                trend="Awaiting publish"
                trendType="neutral"
                iconName="hourglass-empty"
                style={styles.miniStat}
              />
            </View>

            {pendingCount > 0 && (
              <View style={styles.actionGroup}>
                <ActionButton
                  title={publishedCount > 0 ? 'PUBLISH TO REMAINING TENANTS' : 'PUBLISH TO TENANTS'}
                  onPress={handlePublish}
                  loading={isPublishing}
                  style={styles.publishBtn}
                />

                <ActionButton
                  title="RE-GENERATE DRAFT INVOICES"
                  onPress={handleGenerate}
                  loading={isGenerating}
                  variant="outline"
                  style={styles.reGenerateBtn}
                />
              </View>
            )}

            {publishedCount > 0 && (
              <ActionButton
                title="REVERT TO DRAFT (UNPUBLISH)"
                onPress={handleUnpublish}
                loading={isUnpublishing}
                variant="danger"
                style={[styles.publishBtn, { marginTop: pendingCount > 0 ? 12 : 0 }]}
              />
            )}
          </GlassCard>

          <View style={styles.invoiceList}>
            {invoices.map((invoice, idx) => (
              <GlassCard key={invoice.id || idx} style={styles.invoiceCard}>
                <View style={styles.invoiceHeader}>
                  <View>
                    <Text style={styles.invoiceUnit}>Apt {invoice.unitNumber} - {invoice.tenantName}</Text>
                    <Text style={{ fontSize: 12, color: Theme.Colors.outline, marginTop: 2 }}>ID: #{invoice.id?.substring(0, 8)}</Text>
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
                
                <StatusPill status={invoice.status} />
              </GlassCard>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <PageShell scrollable edges={isDesktop ? ['top'] : []} contentContainerStyle={isDesktop ? styles.desktopScroll : styles.mobileScroll}>
      {isDesktop ? (
        <DesktopNavBar activeTab="Finance" onBack={() => router.back()} backText="Back to Settings" />
      ) : (
        <ResponsiveHeader title="Rent Roll" onBack={() => router.back()} />
      )}
      {renderContent()}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  desktopScroll: { paddingVertical: 40, alignItems: 'center' },
  mobileScroll: { paddingVertical: 10 },
  inner: { width: '100%', maxWidth: 800 },
  selectorContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrowBadge: { padding: 6, backgroundColor: 'rgba(255, 255, 255, 0.45)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.7)' },
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
  monthBadgeText: { fontSize: 14, fontWeight: '700', color: Theme.Colors.primary },
  
  card: { padding: Theme.Spacing.containerPadding, alignItems: 'center', marginTop: 10 },
  cardTitle: { ...Theme.Typography.headlineMd, color: Theme.Colors.onBackground, marginBottom: 12 },
  cardText: { ...Theme.Typography.bodyMd, color: Theme.Colors.outline, textAlign: 'center', marginBottom: 32, maxWidth: 500, lineHeight: 22 },
  checklistGrid: { flexDirection: 'row', gap: 24, marginBottom: 24, width: '100%', justifyContent: 'center' },
  checklistItem: { backgroundColor: 'rgba(255,255,255,0.7)', padding: 16, borderRadius: 12, alignItems: 'center', flex: 1, maxWidth: 200 },
  checklistLabel: { fontSize: 12, fontWeight: '700', color: Theme.Colors.outline, textTransform: 'uppercase', marginBottom: 8 },
  checklistValue: { fontSize: 20, fontWeight: '800', color: Theme.Colors.primary },
  statusBox: { flexDirection: 'row', backgroundColor: '#e0f2fe', padding: 16, borderRadius: 12, marginBottom: 32, width: '100%', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 14, fontWeight: '700', color: '#0369a1' },
  generateBtn: { width: '100%', maxWidth: 300 },
  
  resultsContainer: { width: '100%' },
  summaryCard: {
    padding: Theme.Spacing.containerPadding,
    marginBottom: 24,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 14, fontWeight: '700', color: Theme.Colors.outline, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  summaryAmount: { fontSize: 36, fontWeight: '800', color: '#00875a', marginBottom: 24 },
  summaryStatusRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    width: '100%',
  },
  miniStat: {
    flex: 1,
  },
  actionGroup: {
    width: '100%',
    gap: 12,
  },
  publishBtn: {
    width: '100%',
  },
  reGenerateBtn: {
    width: '100%',
  },
  
  invoiceList: { gap: 16 },
  invoiceCard: { padding: 20 },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,104,117,0.1)' },
  invoiceUnit: { fontSize: 16, fontWeight: '800', color: Theme.Colors.onBackground },
  invoiceTotal: { fontSize: 18, fontWeight: '800', color: Theme.Colors.primary },
  chargesList: { gap: 8, marginBottom: 16 },
  chargeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  chargeDesc: { fontSize: 14, color: Theme.Colors.outline, fontWeight: '500' },
  chargeAmt: { fontSize: 14, color: Theme.Colors.onBackground, fontWeight: '600' },
});
