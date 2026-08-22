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

import { useResponsive } from '@/src/hooks/useResponsive';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useProperties } from '@/src/hooks/useProperties';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { listRentCycles, RentCycleResponse } from '@/src/features/finance/api/rentCycle.api';
import { fetchStatementHtml } from '@/src/features/tenant/api/payments.api';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { createStyles } from './reports.styles';

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

  const adjustMonth = (delta: number) => {
    const [y, m] = billingMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + delta, 1);
    setBillingMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
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
            <MaterialIcons name="receipt-long" size={20} color={theme.Colors.primary} />
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
            <TouchableOpacity onPress={() => adjustMonth(-1)} style={styles.monthArrow}>
              <MaterialIcons name="chevron-left" size={24} color={theme.Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {new Date(billingMonth + '-02').toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <TouchableOpacity onPress={() => adjustMonth(1)} style={styles.monthArrow}>
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
            <MaterialIcons name="search" size={20} color={theme.Colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by tenant name or unit..."
              placeholderTextColor={theme.Colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.Colors.onSurfaceVariant} />
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
                    <Text style={[styles.cell, { flex: 1.2, textAlign: 'center', color: theme.Colors.onSurfaceVariant }]}>
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

