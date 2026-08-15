import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
  recordCashPayment,
  publishRentCycle,
  RentCycleResponse, 
  PreFlightChecklistResponse 
} from '@/src/features/finance/api/rentCycle.api';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { ResponsiveHeader } from '@/src/components/common/layout/ResponsiveHeader';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatCard } from '@/src/components/common/display/StatCard';
import { SectionHeader } from '@/src/components/common/display/SectionHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { ActionButton } from '@/src/components/common/inputs/ActionButton';

export default function RentRollScreen({ token }: { token: string | null }) {
  const insets = useSafeAreaInsets();
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
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [checklist, setChecklist] = useState<PreFlightChecklistResponse | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [selectedInvoice, setSelectedInvoice] = useState<RentCycleResponse | null>(null);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [cashNote, setCashNote] = useState<string>('');
  const [showCashModal, setShowCashModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState(false);

  const handleOpenCashModal = (invoice: RentCycleResponse) => {
    setSelectedInvoice(invoice);
    setCashAmount(invoice.totalAmount.toString());
    setCashNote('Cash received by property manager');
    setShowCashModal(true);
    setReceiptSuccess(false);
  };

  const handleConfirmCashPayment = async () => {
    if (!token || !selectedInvoice) return;
    const amountNum = parseFloat(cashAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Please enter a valid cash amount.", "error");
      return;
    }
    try {
      setIsRecording(true);
      await recordCashPayment(selectedInvoice.id, amountNum, cashNote, token);
      setReceiptSuccess(true);
      showToast("Cash payment recorded successfully!", "success");
      checkExistingInvoices();
    } catch (e: any) {
      showToast(e.message || "Failed to record cash payment.", "error");
    } finally {
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (token && propertyId) {
      checkExistingInvoices();
    }
  }, [billingMonth, token, propertyId, debouncedSearchQuery]);

  const checkExistingInvoices = async () => {
    if (!token || !propertyId) return;
    try {
      setIsLoading(true);
      const data = await listRentCycles(billingMonth, token, propertyId as string, 0, 100, undefined, debouncedSearchQuery);
      if (data && data.content && data.content.length > 0) {
        setInvoices(data.content);
        setTotalRevenue(data.totalExpectedRevenue || 0);
        setPublishedCount(data.publishedCount || 0);
        setPendingCount(data.pendingDraftsCount || 0);
        setHasGenerated(true);
      } else {
        setInvoices([]);
        setTotalRevenue(0);
        setPublishedCount(0);
        setPendingCount(0);
        setHasGenerated(false);
        const flightData = await getPreFlightChecklist(propertyId as string, billingMonth, token);
        setChecklist(flightData);
      }
    } catch (e) {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!token || !propertyId) return;
    try {
      setIsGenerating(true);
      const res = await batchGenerateRentCycle(propertyId as string, billingMonth, dueDate, token);
      const total = res.succeeded.length + res.failed.length;
      if (res.failed.length === 0) {
        showToast(`All ${res.succeeded.length} rent cycles generated successfully!`, "success");
      } else {
        const failedDetails = res.failed.map(f => `Unit ${f.unitNumber || 'N/A'}: ${f.reason}`).join('\n');
        Alert.alert(
          'Generation Completed with Failures',
          `${res.succeeded.length} of ${total} rent cycles generated successfully, ${res.failed.length} failed.\n\nFailures:\n${failedDetails}`,
          [{ text: 'OK' }]
        );
      }
      await checkExistingInvoices();
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
      const res = await batchPublishRentCycle(propertyId as string, billingMonth, token);
      const total = res.succeeded.length + res.failed.length;
      if (res.failed.length === 0) {
        showToast("Invoices published to tenants successfully!", "success");
      } else {
        const failedDetails = res.failed.map(f => `Unit ${f.unitNumber || 'N/A'}: ${f.reason}`).join('\n');
        Alert.alert(
          'Publishing Completed with Failures',
          `${res.succeeded.length} of ${total} invoices published successfully, ${res.failed.length} failed.\n\nFailures:\n${failedDetails}`,
          [{ text: 'OK' }]
        );
      }
      await checkExistingInvoices();
    } catch (e: any) {
      showToast(e.message || "Failed to publish invoices.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishSingle = async (invoice: RentCycleResponse) => {
    if (!token) return;
    try {
      showToast("Publishing invoice...", "info");
      await publishRentCycle(invoice.id, token);
      showToast("Invoice published successfully!", "success");
      await checkExistingInvoices();
    } catch (e: any) {
      showToast(e.message || "Failed to publish invoice.", "error");
    }
  };

  const handleUnpublish = async () => {
    if (!token || !propertyId) return;
    try {
      setIsUnpublishing(true);
      const res = await batchUnpublishRentCycle(propertyId as string, billingMonth, token);
      const total = res.succeeded.length + res.failed.length;
      if (res.failed.length === 0) {
        showToast("Invoices reverted to draft successfully!", "success");
      } else {
        const failedDetails = res.failed.map(f => `Unit ${f.unitNumber || 'N/A'}: ${f.reason}`).join('\n');
        Alert.alert(
          'Revert Completed with Failures',
          `${res.succeeded.length} of ${total} invoices reverted successfully, ${res.failed.length} failed.\n\nFailures:\n${failedDetails}`,
          [{ text: 'OK' }]
        );
      }
      await checkExistingInvoices();
    } catch (e: any) {
      showToast(e.message || "Failed to unpublish invoices.", "error");
    } finally {
      setIsUnpublishing(false);
    }
  };

  const renderContent = () => {
    if (!properties || properties.length === 0) {
      return (
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <BlurView intensity={60} tint="light" style={{ padding: 32, borderRadius: 24, alignItems: 'center', maxWidth: 500, width: '100%' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0, 104, 117, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <MaterialIcons name="business" size={32} color="#006875" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#163235', marginBottom: 8, textAlign: 'center' }}>No Property Created Yet</Text>
            <Text style={{ fontSize: 14, color: '#6b7a7d', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              Generating rent rolls and invoices requires an active property. Create your first property to start running rent cycles.
            </Text>
            <TouchableOpacity 
              style={{ borderRadius: 100, overflow: 'hidden' }}
              onPress={() => router.push('/properties/create')}
            >
              <LinearGradient colors={['#00d4ff', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 8 }}>
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1 }}>CREATE FIRST PROPERTY</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={Theme.Colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.inner}>
        <SectionHeader 
          title="Lease & Rent Cycles" 
          subtitle="Generate, publish, and settle rent cycles"
          rightAction={
            <View style={styles.selectorContainer}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBadge}>
                <MaterialIcons name="chevron-left" size={20} color={Theme.Colors.primary} />
              </TouchableOpacity>
              <View style={styles.monthBadge}>
                <MaterialIcons name="calendar-today" size={16} color={Theme.Colors.primary} />
                <Text style={styles.monthBadgeText}>
                  {new Date(billingMonth + "-02").toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </Text>
              </View>
              <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBadge}>
                <MaterialIcons name="chevron-right" size={20} color={Theme.Colors.primary} />
              </TouchableOpacity>
            </View>
          }
        />

        {!hasGenerated ? (
          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Draft Billing Worksheet</Text>
            <Text style={styles.cardText}>
              Rent cycles have not been compiled yet for this billing month. Verify your readings and configuration checklist below.
            </Text>

            {checklist && (
              <View style={styles.checklistGrid}>
                <View style={styles.checklistItem}>
                  <Text style={styles.checklistLabel}>Active Leases</Text>
                  <Text style={styles.checklistValue}>{checklist.activeLeases} / {checklist.totalUnits}</Text>
                </View>
                <View style={styles.checklistItem}>
                  <Text style={styles.checklistLabel}>Utility Readings</Text>
                  <Text style={styles.checklistValue}>
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

            {isDesktop && (
              <ActionButton
                title="GENERATE INVOICES"
                onPress={handleGenerate}
                loading={isGenerating}
                disabled={isGenerating || !!(checklist && !checklist.isReady)}
                style={styles.generateBtn}
              />
            )}
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

              {isDesktop && pendingCount > 0 && (
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

              {isDesktop && publishedCount > 0 && (
                <ActionButton
                  title="REVERT TO DRAFT (UNPUBLISH)"
                  onPress={handleUnpublish}
                  loading={isUnpublishing}
                  variant="danger"
                  style={[styles.publishBtn, { marginTop: pendingCount > 0 ? 12 : 0 }]}
                />
              )}
            </GlassCard>

            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color="#6b7a7d" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by Unit, Tenant name, or Phone..."
                placeholderTextColor="#6b7a7d"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color="#6b7a7d" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.invoiceList}>
              {(() => {
                const sortedInvoices = [...invoices].sort((a, b) => {
                  const numA = parseInt(a.unitNumber?.replace(/\D/g, '')) || 0;
                  const numB = parseInt(b.unitNumber?.replace(/\D/g, '')) || 0;
                  if (numA !== numB) return numA - numB;
                  return (a.tenantName || '').localeCompare(b.tenantName || '');
                });
                return sortedInvoices.map((invoice, idx) => (
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
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <StatusPill status={invoice.status} />
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {invoice.status === 'PENDING' && (
                          <TouchableOpacity 
                            style={[styles.recordCashBtn, { marginRight: 8 }]} 
                            onPress={() => handlePublishSingle(invoice)}
                          >
                            <MaterialIcons name="send" size={16} color={Theme.Colors.primary} />
                            <Text style={styles.recordCashBtnText}>Publish</Text>
                          </TouchableOpacity>
                        )}
                        {invoice.status !== 'PAID' && (
                          <TouchableOpacity 
                            style={styles.recordCashBtn} 
                            onPress={() => handleOpenCashModal(invoice)}
                          >
                            <MaterialIcons name="payments" size={16} color={Theme.Colors.primary} />
                            <Text style={styles.recordCashBtnText}>Record Cash</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </GlassCard>
                ));
              })()}
            </View>
          </View>
        )}

        {/* Record Cash Modal */}
        <Modal
          visible={showCashModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCashModal(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={90} tint="dark" style={styles.modalBlur}>
              <View style={styles.modalContent}>
                {!receiptSuccess ? (
                  <>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Confirm Cash Settlement</Text>
                      <TouchableOpacity onPress={() => setShowCashModal(false)}>
                        <MaterialIcons name="close" size={24} color={Theme.Colors.onBackground} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.modalSubtitle}>
                      Record a direct cash settlement for Apt {selectedInvoice?.unitNumber} ({selectedInvoice?.tenantName})
                    </Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Cash Amount Received (₹)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={cashAmount}
                        onChangeText={setCashAmount}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Settlement Note</Text>
                      <TextInput
                        style={styles.textInput}
                        value={cashNote}
                        onChangeText={setCashNote}
                        placeholder="Add a payment note"
                      />
                    </View>

                    <ActionButton
                      title="CONFIRM CASH COLLECTION"
                      onPress={handleConfirmCashPayment}
                      loading={isRecording}
                      style={{ marginTop: 16 }}
                    />
                  </>
                ) : (
                  <View style={styles.successContainer}>
                    <View style={styles.successIconCircle}>
                      <MaterialIcons name="check-circle" size={48} color="#16a34a" />
                    </View>
                    <Text style={styles.successTitle}>Payment Confirmed!</Text>
                    <Text style={styles.successSubtitle}>
                      Direct cash transaction successfully completed and reconciled.
                    </Text>

                    <View style={styles.checklistReceipt}>
                      <View style={styles.checkItem}>
                        <MaterialIcons name="check" size={16} color="#16a34a" />
                        <Text style={styles.checkText}>Signature transaction generated</Text>
                      </View>
                      <View style={styles.checkItem}>
                        <MaterialIcons name="check" size={16} color="#16a34a" />
                        <Text style={styles.checkText}>Ledger accounts balanced & updated</Text>
                      </View>
                      <View style={styles.checkItem}>
                        <MaterialIcons name="check" size={16} color="#16a34a" />
                        <Text style={styles.checkText}>Receipt notification dispatched</Text>
                      </View>
                    </View>

                    <View style={styles.receiptMeta}>
                      <Text style={styles.metaLabel}>Settled Amount:</Text>
                      <Text style={styles.metaValue}>₹ {parseFloat(cashAmount).toFixed(2)}</Text>
                    </View>

                    <ActionButton
                      title="CLOSE"
                      onPress={() => setShowCashModal(false)}
                      style={{ marginTop: 24, width: '100%' }}
                    />
                  </View>
                )}
              </View>
            </BlurView>
          </View>
        </Modal>
      </View>
    );
  };

  const renderGlassyHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: insets.top, height: 56 + insets.top }]}>
      <BlurView intensity={45} tint="light" style={StyleSheet.absoluteFillObject} />
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color="#0b1c30" />
        </TouchableOpacity>
        <View style={styles.titleWrapper}>
          <Text style={styles.compactTitleText}>Rent Roll</Text>
        </View>
        
        {/* Top Right Blue Gradient Action Button */}
        {!hasGenerated ? (
          <TouchableOpacity 
            style={[styles.headerGradientTouch, (isGenerating || !!(checklist && !checklist.isReady)) && { opacity: 0.5 }]}
            onPress={handleGenerate}
            disabled={isGenerating || !!(checklist && !checklist.isReady)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#00d4ff', '#0072ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerGradientInner}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="flash-on" size={15} color="#fff" />
                  <Text style={styles.headerGradientText}>GENERATE</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : pendingCount > 0 ? (
          <TouchableOpacity 
            style={[styles.headerGradientTouch, isPublishing && { opacity: 0.5 }]}
            onPress={handlePublish}
            disabled={isPublishing}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#00d4ff', '#0072ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerGradientInner}
            >
              {isPublishing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="send" size={14} color="#fff" />
                  <Text style={styles.headerGradientText}>PUBLISH</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.headerGradientTouch, isUnpublishing && { opacity: 0.5 }]}
            onPress={handleUnpublish}
            disabled={isUnpublishing}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff416c', '#ff4b2b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerGradientInner}
            >
              {isUnpublishing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.headerGradientText}>UNPUBLISH</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderDesktopShell = () => (
    <LinearGradient
      colors={Theme.Colors.backgroundGradient as [string, string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, width: '100%' }}>
        <DesktopNavBar 
          onBack={() => router.push('/expenses')} 
          backText="Back to Finance & Billing" 
          properties={properties || []}
          selectedPropertyId={propertyId}
          onPropertyChange={(id) => router.replace(`/expenses/rent-roll?propertyId=${id}`)}
        />
        <ScrollView contentContainerStyle={styles.desktopScroll} showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
      </View>
    </LinearGradient>
  );

  if (isDesktop) {
    return renderDesktopShell();
  }

  return (
    <View style={{ flex: 1 }}>
      {renderGlassyHeader()}
      <PageShell 
        scrollable 
        edges={[]} 
        contentContainerStyle={[styles.mobileScroll, { paddingTop: 68 + insets.top }]}
      >
        {renderContent()}
      </PageShell>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  compactTitleText: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#0b1c30',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#006677',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerGradientTouch: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  headerGradientInner: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 100,
  },
  headerGradientText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  desktopScroll: { paddingVertical: 24, paddingHorizontal: 40, alignItems: 'center' },
  mobileScroll: { paddingVertical: 10, paddingHorizontal: 20 },
  inner: { width: '100%', maxWidth: 1080 },
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
  
  recordCashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Theme.Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  recordCashBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.Colors.primary,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBlur: {
    width: '90%',
    maxWidth: 480,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.Colors.onBackground,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Theme.Colors.outline,
    lineHeight: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.Colors.outline,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Theme.Colors.onBackground,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.Colors.onBackground,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: Theme.Colors.outline,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  checklistReceipt: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.Colors.onSurfaceVariant,
  },
  receiptMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.Colors.outline,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16a34a',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginVertical: 16,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    color: '#151d1e',
    fontSize: 14,
    outlineWidth: 0,
  },
});
