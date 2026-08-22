import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/src/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatCard } from '@/src/components/common/display/StatCard';
import { SectionHeader } from '@/src/components/common/display/SectionHeader';
import { ActionButton } from '@/src/components/common/inputs/ActionButton';
import { useRentRoll } from '@/src/features/finance/hooks/useRentRoll';
import type { RentCycleResponse } from '@/src/features/finance/api/rentCycle.api';
import { createStyles } from './RentRollScreen.styles';

// Sub-components
import { PreFlightChecklistCard } from '../components/billing/PreFlightChecklistCard';
import { RecordCashModal } from '../components/billing/RecordCashModal';
import { RentRollInvoiceList } from '../components/billing/RentRollInvoiceList';
import { RentRollHeader } from '../components/billing/RentRollHeader';

export default function RentRollScreen({ token }: { token: string | null }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

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
  
  const [dueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });

  const [page, setPage] = useState<number>(0);
  const pageSize = 20;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [billingMonth, propertyId, debouncedSearchQuery]);

  // Custom hook wrapping react-query queries and mutations
  const {
    rentCyclesData,
    checklist,
    isLoading,
    generateRentCycle,
    isGenerating,
    publishRentCycles,
    isPublishing,
    publishSingleInvoice,
    unpublishRentCycles,
    isUnpublishing,
    recordCashPayment,
    isRecordingCash,
  } = useRentRoll(propertyId, billingMonth, debouncedSearchQuery, page, pageSize, token);

  const [selectedInvoice, setSelectedInvoice] = useState<RentCycleResponse | null>(null);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [cashNote, setCashNote] = useState<string>('');
  const [showCashModal, setShowCashModal] = useState(false);
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
      await recordCashPayment({ id: selectedInvoice.id, amount: amountNum, note: cashNote });
      setReceiptSuccess(true);
      showToast("Cash payment recorded successfully!", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to record cash payment.", "error");
    }
  };

  const handleGenerate = async () => {
    if (!token || !propertyId) return;
    try {
      const res = await generateRentCycle(dueDate);
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
    } catch (e: any) {
      showToast(e.message || "Failed to generate rent cycle.", "error");
    }
  };

  const handlePublish = async () => {
    if (!token || !propertyId) return;
    try {
      const res = await publishRentCycles();
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
    } catch (e: any) {
      showToast(e.message || "Failed to publish invoices.", "error");
    }
  };

  const handlePublishSingle = async (invoice: RentCycleResponse) => {
    if (!token) return;
    try {
      showToast("Publishing invoice...", "info");
      await publishSingleInvoice(invoice.id);
      showToast("Invoice published successfully!", "success");
    } catch (e: any) {
      showToast(e.message || "Failed to publish invoice.", "error");
    }
  };

  const handleUnpublish = async () => {
    if (!token || !propertyId) return;
    try {
      const res = await unpublishRentCycles();
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
    } catch (e: any) {
      showToast(e.message || "Failed to unpublish invoices.", "error");
    }
  };

  const invoices = rentCyclesData?.content || [];
  const totalRevenue = rentCyclesData?.totalExpectedRevenue || 0;
  const publishedCount = rentCyclesData?.publishedCount || 0;
  const pendingCount = rentCyclesData?.pendingDraftsCount || 0;
  const totalPages = rentCyclesData?.totalPages || 0;
  const totalElements = rentCyclesData?.totalElements || 0;
  const hasGenerated = invoices.length > 0 || publishedCount > 0 || pendingCount > 0;

  const renderContent = () => {
    if (!properties || properties.length === 0) {
      return (
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={{ padding: 32, borderRadius: 24, alignItems: 'center', maxWidth: 500, width: '100%', backgroundColor: theme.Colors.glassFill, borderWidth: 1.5, borderColor: theme.Colors.glassStroke }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0, 104, 117, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <MaterialIcons name="business" size={32} color={theme.Colors.primary} />
            </View>
            <Text style={{ fontSize: theme.Typography.TitleLarge.fontSize, fontWeight: '800', color: theme.Colors.onSurface, marginBottom: 8, textAlign: 'center' }}>No Property Created Yet</Text>
            <Text style={{ fontSize: theme.Typography.BodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              Generating rent rolls and invoices requires an active property. Create your first property to start running rent cycles.
            </Text>
            <TouchableOpacity 
              style={{ borderRadius: 100, overflow: 'hidden' }}
              onPress={() => router.push('/properties/create')}
            >
              <LinearGradient colors={['#00d4ff', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 8 }}>
                <MaterialIcons name="add" size={20} color={theme.Colors.surfaceContainerLowest} />
                <Text style={{ color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.BodyMedium.fontSize, fontWeight: '800', letterSpacing: 1 }}>CREATE FIRST PROPERTY</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>
      );
    }

    if (isLoading && invoices.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
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
                <MaterialIcons name="chevron-left" size={20} color={theme.Colors.primary} />
              </TouchableOpacity>
              <View style={styles.monthBadge}>
                <MaterialIcons name="calendar-today" size={16} color={theme.Colors.primary} />
                <Text style={styles.monthBadgeText}>
                  {new Date(billingMonth + "-02").toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </Text>
              </View>
              <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBadge}>
                <MaterialIcons name="chevron-right" size={20} color={theme.Colors.primary} />
              </TouchableOpacity>
            </View>
          }
        />

        {!hasGenerated ? (
          <PreFlightChecklistCard
            checklist={checklist}
            billingMonth={billingMonth}
            isGenerating={isGenerating}
            isDesktop={isDesktop}
            onGenerate={handleGenerate}
          />
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
              <MaterialIcons name="search" size={20} color={theme.Colors.onSurfaceVariant} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by Unit, Tenant name, or Phone..."
                placeholderTextColor={theme.Colors.onSurfaceVariant}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.Colors.primary} />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
                </TouchableOpacity>
              ) : null}
            </View>

            <RentRollInvoiceList
              invoices={invoices}
              debouncedSearchQuery={debouncedSearchQuery}
              onClearSearch={() => setSearchQuery('')}
              onPublishSingle={handlePublishSingle}
              onOpenCashModal={handleOpenCashModal}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View style={styles.paginationBar}>
                <Text style={styles.paginationInfo}>
                  Showing <Text style={{ fontWeight: '700' }}>{page * pageSize + 1}</Text> -{' '}
                  <Text style={{ fontWeight: '700' }}>{Math.min((page + 1) * pageSize, totalElements)}</Text> of{' '}
                  <Text style={{ fontWeight: '700' }}>{totalElements}</Text> invoices
                </Text>

                <View style={styles.paginationActions}>
                  <TouchableOpacity
                    onPress={() => page > 0 && setPage(page - 1)}
                    disabled={page === 0}
                    style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                  >
                    <MaterialIcons
                      name="chevron-left"
                      size={20}
                      color={page === 0 ? '#9ca3af' : theme.Colors.primary}
                    />
                    <Text style={[styles.pageBtnText, page === 0 && styles.pageBtnTextDisabled]}>Prev</Text>
                  </TouchableOpacity>

                  <View style={styles.pageIndicator}>
                    <Text style={styles.pageIndicatorText}>
                      Page {page + 1} of {totalPages}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => page < totalPages - 1 && setPage(page + 1)}
                    disabled={page >= totalPages - 1}
                    style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
                  >
                    <Text style={[styles.pageBtnText, page >= totalPages - 1 && styles.pageBtnTextDisabled]}>Next</Text>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={page >= totalPages - 1 ? '#9ca3af' : theme.Colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        <RecordCashModal
          visible={showCashModal}
          selectedInvoice={selectedInvoice}
          cashAmount={cashAmount}
          cashNote={cashNote}
          isRecording={isRecordingCash}
          receiptSuccess={receiptSuccess}
          setCashAmount={setCashAmount}
          setCashNote={setCashNote}
          onClose={() => setShowCashModal(false)}
          onConfirm={handleConfirmCashPayment}
        />
      </View>
    );
  };

  const renderDesktopShell = () => (
    <LinearGradient
      colors={theme.Colors.backgroundGradient as [string, string, string]}
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
      <RentRollHeader
        hasGenerated={hasGenerated}
        isGenerating={isGenerating}
        checklist={checklist}
        handleGenerate={handleGenerate}
        pendingCount={pendingCount}
        isPublishing={isPublishing}
        handlePublish={handlePublish}
        isUnpublishing={isUnpublishing}
        handleUnpublish={handleUnpublish}
        router={router}
        insets={insets}
        isDark={isDark}
        theme={theme}
        styles={styles}
      />
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


