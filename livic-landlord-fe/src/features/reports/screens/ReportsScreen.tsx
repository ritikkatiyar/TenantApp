import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { useResponsive } from '@/src/hooks/useResponsive';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import FilterPill from '@/src/components/common/inputs/FilterPill';
import { listRentCycles, RentCycleResponse } from '@/src/features/finance/api/rentCycle.api';
import { fetchStatementHtml } from '@/src/features/tenant/api/payments.api';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { createStyles } from './ReportsScreen.styles';

import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatCard } from '@/src/components/common/display/StatCard';
import { SkeletonRow } from '@/src/components/common/feedback/Skeleton';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { EmptyState } from '@/src/components/common/display/EmptyState';

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Overdue', value: 'OVERDUE' },
];

export default function ReportsScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { accessToken } = useAuth();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();
  const { selectedPropertyId } = useGlobalPropertySelection();

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
  const [accumulatedStatements, setAccumulatedStatements] = useState<RentCycleResponse[]>([]);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const loadStatements = useCallback(
    async (targetPage: number = 0) => {
      if (!accessToken) return;
      try {
        if (targetPage === 0) {
          setIsLoading(true);
        } else {
          setIsFetchingMore(true);
        }
        const data = await listRentCycles(
          billingMonth,
          accessToken,
          selectedPropertyId || undefined,
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

        setAccumulatedStatements((prev) => {
          if (targetPage === 0) return sortedContent;
          const existingIds = new Set(prev.map((i) => i.id));
          const newItems = sortedContent.filter((i) => !existingIds.has(i.id));
          return [...prev, ...newItems];
        });

        setStatements(sortedContent);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 0);
        setPage(targetPage);
        setTotalRevenue(data.totalExpectedRevenue || 0);
        setPublishedCount(data.publishedCount || 0);
        setPendingDraftsCount(data.pendingDraftsCount || 0);
      } catch (err: any) {
        console.warn('[Reports] Error loading statements:', err.message);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [accessToken, billingMonth, selectedPropertyId, pageSize, statusFilter, searchQuery]
  );

  const handleLoadMore = useCallback(() => {
    if (!isLoading && !isFetchingMore && page + 1 < totalPages) {
      loadStatements(page + 1);
    }
  }, [isLoading, isFetchingMore, page, totalPages, loadStatements]);

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

  return (
    <PageShell
      scrollable
      onEndReached={handleLoadMore}
      contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
    >
      {/* KPI Stats Overview */}
      <View style={styles.kpiRow}>
        <StatCard
          label="TOTAL STATEMENTS"
          value={totalElements}
          loading={isLoading}
          helperText={`Records for ${billingMonth}`}
          iconName="receipt-long"
          iconColor={theme.Colors.primary}
          valueColor={theme.Colors.primary}
        />
        <StatCard
          label="TOTAL BILLED"
          value={`₹${totalRevenue.toLocaleString()}`}
          loading={isLoading}
          helperText={`${publishedCount} published invoices`}
          iconName="payments"
          iconColor={theme.Colors.secondary}
          valueColor={isDark ? '#A78BFA' : theme.Colors.secondary}
        />
        <StatCard
          label="PAGE COLLECTED"
          value={`₹${totalCollected.toLocaleString()}`}
          loading={isLoading}
          helperText={`${statements.filter((s) => s.status === 'PAID').length} paid on this page`}
          iconName="check-circle"
          iconColor={theme.Colors.tertiary}
          valueColor={theme.Colors.tertiary}
        />
        <StatCard
          label="PENDING DRAFTS"
          value={pendingDraftsCount}
          loading={isLoading}
          helperText="Drafts awaiting publishing"
          iconName="pending"
          iconColor={theme.Colors.tertiary}
          valueColor={theme.Colors.tertiary}
        />
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
          <View style={styles.statusChipsWrap}>
            {STATUS_OPTIONS.map((opt) => (
              <FilterPill
                key={opt.value}
                label={opt.label}
                active={statusFilter === opt.value}
                onPress={() => setStatusFilter(opt.value)}
              />
            ))}
          </View>
        </View>
      </GlassCard>

      {/* Statements List Table / Cards */}
      <GlassCard style={[styles.listCard, isDesktop && styles.listCardDesktop]}>
        {isLoading ? (
          <View style={{ gap: 12, paddingVertical: 12 }}>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </View>
        ) : accumulatedStatements.length > 0 ? (
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

            {accumulatedStatements.map((stmt) => (
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

            {isFetchingMore && <ActivityIndicator color={theme.Colors.primary} style={{ marginVertical: 14 }} />}
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
