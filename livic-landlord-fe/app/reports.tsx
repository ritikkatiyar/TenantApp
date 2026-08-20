import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useProperties } from '@/src/hooks/useProperties';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { listRentCycles, RentCycleResponse } from '@/src/features/finance/api/rentCycle.api';
import { fetchStatementHtml } from '@/src/features/tenant/api/payments.api';
import { useAppTheme } from '@/src/theme/ThemeContext';

import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { EmptyState } from '@/src/components/common/display/EmptyState';

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Overdue', value: 'OVERDUE' },
];

export default function ReportsRoute() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { accessToken } = useAuth();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();

  const [selectedProperty, setSelectedProperty] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [billingMonth, setBillingMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [statements, setStatements] = useState<RentCycleResponse[]>([]);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [publishedCount, setPublishedCount] = useState<number>(0);
  const [pendingDraftsCount, setPendingDraftsCount] = useState<number>(0);

  const loadStatements = useCallback(
    async (targetPage: number = 0) => {
      if (!accessToken) return;
      try {
        setIsLoading(true);
        const data = await listRentCycles(
          billingMonth,
          accessToken,
          selectedProperty !== 'ALL' ? selectedProperty : undefined,
          targetPage,
          pageSize,
          statusFilter !== 'ALL' ? statusFilter : undefined,
          searchQuery.trim() || undefined
        );

        // Sort statements floor and room wise
        const sortedContent = [...(data.content || [])].sort((a, b) =>
          (a.unitNumber || '').localeCompare(b.unitNumber || '', undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        );

        setStatements(sortedContent);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 0);
        setPage(data.number || targetPage);
        setTotalRevenue(data.totalExpectedRevenue || 0);
        setPublishedCount(data.publishedCount || 0);
        setPendingDraftsCount(data.pendingDraftsCount || 0);
      } catch (err: any) {
        console.warn('[Reports] Error loading statements:', err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, billingMonth, selectedProperty, statusFilter, pageSize, searchQuery]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      loadStatements(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [loadStatements]);

  const handlePrevMonth = () => {
    const [y, m] = billingMonth.split('-').map(Number);
    let month = m - 1;
    let year = y;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    setBillingMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = billingMonth.split('-').map(Number);
    let month = m + 1;
    let year = y;
    if (month === 13) {
      month = 1;
      year += 1;
    }
    setBillingMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const handleOpenStatement = async (cycleId: string) => {
    try {
      const html = await fetchStatementHtml(cycleId, accessToken || '');
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
      console.warn('[Reports] Error opening statement:', err.message);
    }
  };

  const totalCollected = useMemo(() => {
    return statements
      .filter((s) => s.status === 'PAID')
      .reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  }, [statements]);

  const startIdx = totalElements === 0 ? 0 : page * pageSize + 1;
  const endIdx = Math.min((page + 1) * pageSize, totalElements);

  return (
    <PageShell
      scrollable
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
    >
      {isDesktop && <DesktopNavBar title="Reports & Statements" />}

      {/* KPI Stats Overview */}
      <View style={styles.kpiRow}>
        <GlassCard style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>TOTAL STATEMENTS</Text>
            <MaterialIcons name="receipt-long" size={20} color="#006875" />
          </View>
          <Text style={styles.kpiValue}>{totalElements}</Text>
          <Text style={styles.kpiSub}>Records for {billingMonth}</Text>
        </GlassCard>

        <GlassCard style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>TOTAL BILLED</Text>
            <MaterialIcons name="payments" size={20} color="#0284c7" />
          </View>
          <Text style={[styles.kpiValue, { color: '#0284c7' }]}>
            ₹{totalRevenue.toLocaleString()}
          </Text>
          <Text style={styles.kpiSub}>{publishedCount} published invoices</Text>
        </GlassCard>

        <GlassCard style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>PAGE COLLECTED</Text>
            <MaterialIcons name="check-circle" size={20} color="#16a34a" />
          </View>
          <Text style={[styles.kpiValue, { color: '#16a34a' }]}>
            ₹{totalCollected.toLocaleString()}
          </Text>
          <Text style={styles.kpiSub}>
            {statements.filter((s) => s.status === 'PAID').length} paid on this page
          </Text>
        </GlassCard>

        <GlassCard style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>PENDING DRAFTS</Text>
            <MaterialIcons name="pending" size={20} color="#d97706" />
          </View>
          <Text style={[styles.kpiValue, { color: '#d97706' }]}>
            {pendingDraftsCount}
          </Text>
          <Text style={styles.kpiSub}>Drafts awaiting publishing</Text>
        </GlassCard>
      </View>

      {/* Header & Filter Controls Card */}
      <GlassCard style={styles.glassCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.sectionTitle}>Monthly Statements</Text>
            <Text style={styles.sectionSubtitle}>
              Select property and month to inspect and download tenant invoices
            </Text>
          </View>

          {/* Month Selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrow}>
              <MaterialIcons name="chevron-left" size={24} color={theme.Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {new Date(billingMonth + '-02').toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrow}>
              <MaterialIcons name="chevron-right" size={24} color={theme.Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Property Select Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.propertyTabs}
          contentContainerStyle={styles.propertyTabsContent}
        >
          <TouchableOpacity
            onPress={() => setSelectedProperty('ALL')}
            style={[styles.propTab, selectedProperty === 'ALL' && styles.propTabActive]}
          >
            <Text
              style={[styles.propTabText, selectedProperty === 'ALL' && styles.propTabTextActive]}
            >
              All Properties
            </Text>
          </TouchableOpacity>
          {properties &&
            properties.map((prop) => (
              <TouchableOpacity
                key={prop.id}
                onPress={() => setSelectedProperty(prop.id)}
                style={[styles.propTab, selectedProperty === prop.id && styles.propTabActive]}
              >
                <Text
                  style={[
                    styles.propTabText,
                    selectedProperty === prop.id && styles.propTabTextActive,
                  ]}
                >
                  {prop.name}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>

        {/* Search & Status Filters */}
        <View style={styles.filterControlsRow}>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color="#6b7a7d" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by tenant name or unit..."
              placeholderTextColor="#6b7a7d"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#6b7a7d" />
              </TouchableOpacity>
            )}
          </View>

          {/* Status Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusChipsContainer}
          >
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setStatusFilter(opt.value)}
                style={[
                  styles.statusChip,
                  statusFilter === opt.value && styles.statusChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    statusFilter === opt.value && styles.statusChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </GlassCard>

      {/* Statements List Table / Cards */}
      <GlassCard style={[styles.listCard, isDesktop && styles.listCardDesktop]}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.Colors.primary} />
            <Text style={styles.loadingText}>Fetching statements...</Text>
          </View>
        ) : statements.length > 0 ? (
          <View style={styles.table}>
            {/* Desktop Table Header */}
            {isDesktop && (
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 2.2 }]}>Tenant Name</Text>
                <Text style={[styles.headerCell, { flex: 1.2 }]}>Unit</Text>
                <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'right' }]}>
                  Total Billed
                </Text>
                <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'right' }]}>
                  Amount Paid
                </Text>
                <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'center' }]}>
                  Due Date
                </Text>
                <Text style={[styles.headerCell, { flex: 1.4, textAlign: 'center' }]}>
                  Status
                </Text>
                <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'center' }]}>
                  Statement
                </Text>
              </View>
            )}

            {statements.map((stmt) => (
              <View key={stmt.id} style={[styles.row, !isDesktop && styles.rowMobile]}>
                {isDesktop ? (
                  // Desktop Layout
                  <>
                    <View style={{ flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={styles.tenantAvatar}>
                        <Text style={styles.tenantAvatarText}>
                          {(stmt.tenantName || 'T').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.cell, { fontWeight: '700' }]}>{stmt.tenantName}</Text>
                    </View>
                    <Text style={[styles.cell, { flex: 1.2 }]}>Unit {stmt.unitNumber}</Text>
                    <Text style={[styles.cell, { flex: 1.5, textAlign: 'right', fontWeight: '600' }]}>
                      ₹{stmt.totalAmount?.toLocaleString()}
                    </Text>
                    <Text
                      style={[
                        styles.cell,
                        { flex: 1.5, textAlign: 'right', color: stmt.paidAt ? '#16a34a' : '#6b7a7d' },
                      ]}
                    >
                      ₹{stmt.paidAt ? stmt.totalAmount?.toLocaleString() : '0.00'}
                    </Text>
                    <Text style={[styles.cell, { flex: 1.2, textAlign: 'center', color: '#6b7a7d' }]}>
                      {stmt.dueDate ? new Date(stmt.dueDate).toLocaleDateString() : 'N/A'}
                    </Text>
                    <View style={{ flex: 1.4, alignItems: 'center', justifyContent: 'center' }}>
                      <StatusPill status={stmt.status} />
                    </View>
                    <TouchableOpacity
                      onPress={() => handleOpenStatement(stmt.id)}
                      style={styles.downloadBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="download" size={20} color={theme.Colors.primary} />
                      <Text style={styles.downloadBtnText}>PDF</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // Mobile Layout
                  <View style={styles.mobileCard}>
                    <View style={styles.mobileCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={styles.tenantAvatar}>
                          <Text style={styles.tenantAvatarText}>
                            {(stmt.tenantName || 'T').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.mobileTenantName}>{stmt.tenantName}</Text>
                          <Text style={styles.mobileDetailLabel}>Unit {stmt.unitNumber}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleOpenStatement(stmt.id)}
                        style={styles.downloadBtn}
                      >
                        <MaterialIcons name="download" size={18} color={theme.Colors.primary} />
                        <Text style={styles.downloadBtnText}>View</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.mobileCardDetail}>
                      <StatusPill status={stmt.status} />
                      <Text style={styles.mobileDueDate}>
                        Due: {stmt.dueDate ? new Date(stmt.dueDate).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>

                    <View style={styles.mobileAmountsRow}>
                      <Text style={styles.mobileAmount}>
                        Billed: ₹{stmt.totalAmount?.toLocaleString()}
                      </Text>
                      <Text
                        style={[
                          styles.mobileAmount,
                          { color: stmt.paidAt ? '#16a34a' : '#6b7a7d' },
                        ]}
                      >
                        Paid: ₹{stmt.paidAt ? stmt.totalAmount?.toLocaleString() : '0.00'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {/* Pagination Controls */}
            <View style={styles.paginationBar}>
              <Text style={styles.paginationInfo}>
                Showing <Text style={{ fontWeight: '700' }}>{startIdx}</Text> -{' '}
                <Text style={{ fontWeight: '700' }}>{endIdx}</Text> of{' '}
                <Text style={{ fontWeight: '700' }}>{totalElements}</Text> statements
              </Text>

              <View style={styles.paginationActions}>
                <TouchableOpacity
                  onPress={() => page > 0 && loadStatements(page - 1)}
                  disabled={page === 0}
                  style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                >
                  <MaterialIcons
                    name="chevron-left"
                    size={22}
                    color={page === 0 ? '#9ca3af' : theme.Colors.primary}
                  />
                  <Text style={[styles.pageBtnText, page === 0 && styles.pageBtnTextDisabled]}>
                    Prev
                  </Text>
                </TouchableOpacity>

                <View style={styles.pageNumberBadge}>
                  <Text style={styles.pageNumberText}>
                    Page {page + 1} of {Math.max(totalPages, 1)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => page + 1 < totalPages && loadStatements(page + 1)}
                  disabled={page + 1 >= totalPages}
                  style={[styles.pageBtn, page + 1 >= totalPages && styles.pageBtnDisabled]}
                >
                  <Text
                    style={[styles.pageBtnText, page + 1 >= totalPages && styles.pageBtnTextDisabled]}
                  >
                    Next
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={22}
                    color={page + 1 >= totalPages ? '#9ca3af' : theme.Colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <EmptyState
            title="No Statements Found"
            description={`No billing statements found matching your filter criteria for ${billingMonth}.`}
            iconName="receipt-long"
          />
        )}
      </GlassCard>
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    padding: theme.Spacing.containerPadding,
    paddingTop: Platform.OS === 'web' ? 24 : 88,
  },
  containerDesktop: {
    paddingTop: 24,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: 220,
    padding: 18,
    borderRadius: 16,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#6b7a7d',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#151d1e',
    marginBottom: 4,
  },
  kpiSub: {
    fontSize: 12,
    color: '#6b7a7d',
  },
  glassCard: {
    marginBottom: 20,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  sectionTitle: {
    ...theme.Typography.headlineMd,
    color: theme.Colors.onBackground,
  },
  sectionSubtitle: {
    ...theme.Typography.labelMuted,
    color: theme.Colors.outline,
    marginTop: 4,
    maxWidth: 540,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: theme.Rounded.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  monthArrow: {
    padding: 4,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.Colors.onBackground,
    marginHorizontal: 12,
    minWidth: 130,
    textAlign: 'center',
  },
  propertyTabs: {
    flexDirection: 'row',
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 16,
  },
  propertyTabsContent: {
    gap: 8,
  },
  propTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.Rounded.full,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  propTabActive: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
  propTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
  },
  propTabTextActive: {
    color: '#fff',
  },
  filterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#151d1e',
    outlineWidth: 0,
  },
  statusChipsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusChipActive: {
    backgroundColor: '#006875',
    borderColor: '#006875',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7a7d',
  },
  statusChipTextActive: {
    color: '#ffffff',
  },
  listCard: {
    padding: 20,
  },
  listCardDesktop: {
    padding: 0,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.Colors.outline,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowMobile: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderBottomWidth: 0,
  },
  cell: {
    fontSize: 14,
    color: theme.Colors.onBackground,
  },
  tenantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#006875',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tenantAvatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.2)',
  },
  downloadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.Colors.primary,
  },
  mobileCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  mobileCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileTenantName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.Colors.onBackground,
  },
  mobileCardDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  mobileDetailLabel: {
    fontSize: 13,
    color: theme.Colors.outline,
    fontWeight: '500',
  },
  mobileDueDate: {
    fontSize: 12,
    color: '#6b7a7d',
    fontWeight: '500',
  },
  mobileAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  mobileAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.Colors.onBackground,
  },
  paginationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexWrap: 'wrap',
    gap: 12,
  },
  paginationInfo: {
    fontSize: 13,
    color: '#6b7a7d',
  },
  paginationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 2,
  },
  pageBtnDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#f1f5f9',
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.Colors.primary,
  },
  pageBtnTextDisabled: {
    color: '#9ca3af',
  },
  pageNumberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.Colors.primary,
  },
  center: {
    padding: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7a7d',
  },
});

