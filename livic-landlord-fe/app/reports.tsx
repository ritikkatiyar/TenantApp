import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useProperties } from '@/src/hooks/useProperties';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { listRentCycles, RentCycleResponse } from '@/src/features/finance/api/rentCycle.api';
import { fetchStatementHtml } from '@/src/features/tenant/api/payments.api';
import { Theme } from '@/src/theme/Theme';

import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { EmptyState } from '@/src/components/common/display/EmptyState';

export default function ReportsRoute() {
  const { accessToken } = useAuth();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [billingMonth, setBillingMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [statements, setStatements] = useState<RentCycleResponse[]>([]);

  useEffect(() => {
    if (properties && properties.length > 0 && !selectedProperty) {
      setSelectedProperty(properties[0].id);
    }
  }, [properties]);

  useEffect(() => {
    if (accessToken && selectedProperty) {
      loadStatements();
    }
  }, [selectedProperty, billingMonth, accessToken]);

  const loadStatements = async () => {
    if (!accessToken || !selectedProperty) return;
    try {
      setIsLoading(true);
      const data = await listRentCycles(billingMonth, accessToken, selectedProperty || undefined);
      setStatements(data.content || []);
    } catch (err: any) {
      console.warn('[Reports] Error loading statements:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <PageShell scrollable edges={isDesktop ? ['top'] : []} contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}>
      {isDesktop && <DesktopNavBar title="Reports & Statements" />}

      {/* Header & Filter Controls Card */}
      <GlassCard style={styles.glassCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.sectionTitle}>Monthly Statements</Text>
            <Text style={styles.sectionSubtitle}>Select property and month to view compiled tenant payment statements</Text>
          </View>
          
          {/* Month Selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrow}>
              <MaterialIcons name="chevron-left" size={24} color={Theme.Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {new Date(billingMonth + "-02").toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrow}>
              <MaterialIcons name="chevron-right" size={24} color={Theme.Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Property select dropdown simulation */}
        {properties && properties.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propertyTabs}>
            {properties.map((prop) => (
              <TouchableOpacity
                key={prop.id}
                onPress={() => setSelectedProperty(prop.id)}
                style={[styles.propTab, selectedProperty === prop.id && styles.propTabActive]}
              >
                <Text style={[styles.propTabText, selectedProperty === prop.id && styles.propTabTextActive]}>
                  {prop.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </GlassCard>

      {/* Statements List */}
      <GlassCard style={[styles.listCard, isDesktop && styles.listCardDesktop]}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Theme.Colors.primary} />
          </View>
        ) : statements.length > 0 ? (
          <View style={styles.table}>
            {/* Responsive Header Row */}
            {isDesktop && (
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 2 }]}>Tenant Name</Text>
                <Text style={[styles.headerCell, { flex: 1 }]}>Unit</Text>
                <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'right' }]}>Total Billed</Text>
                <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'right' }]}>Amount Paid</Text>
                <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'center' }]}>Status</Text>
                <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Statement</Text>
              </View>
            )}

            {statements.map((stmt) => (
              <View key={stmt.id} style={[styles.row, !isDesktop && styles.rowMobile]}>
                {isDesktop ? (
                  // Desktop Layout
                  <>
                    <Text style={[styles.cell, { flex: 2, fontWeight: '700' }]}>{stmt.tenantName}</Text>
                    <Text style={[styles.cell, { flex: 1 }]}>{stmt.unitNumber}</Text>
                    <Text style={[styles.cell, { flex: 1.5, textAlign: 'right', fontWeight: '600' }]}>₹{stmt.totalAmount?.toLocaleString()}</Text>
                    <Text style={[styles.cell, { flex: 1.5, textAlign: 'right', color: '#16a34a' }]}>₹{stmt.paidAt ? stmt.totalAmount?.toLocaleString() : '0.00'}</Text>
                    <View style={{ flex: 1.5, alignItems: 'center', justifyContent: 'center' }}>
                      <StatusPill status={stmt.status} />
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleOpenStatement(stmt.id)}
                      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <MaterialIcons name="download" size={22} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                  </>
                ) : (
                  // Mobile Layout
                  <View style={styles.mobileCard}>
                    <View style={styles.mobileCardHeader}>
                      <Text style={styles.mobileTenantName}>{stmt.tenantName}</Text>
                      <TouchableOpacity onPress={() => handleOpenStatement(stmt.id)}>
                        <MaterialIcons name="download" size={24} color={Theme.Colors.primary} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.mobileCardDetail}>
                      <Text style={styles.mobileDetailLabel}>Unit {stmt.unitNumber}</Text>
                      <StatusPill status={stmt.status} />
                    </View>
                    <View style={styles.mobileAmountsRow}>
                      <Text style={styles.mobileAmount}>Billed: ₹{stmt.totalAmount?.toLocaleString()}</Text>
                      <Text style={[styles.mobileAmount, { color: '#16a34a' }]}>
                        Paid: ₹{stmt.paidAt ? stmt.totalAmount?.toLocaleString() : '0.00'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <EmptyState 
            title="No Statements Found" 
            description="No billing records exist for selected month." 
            iconName="receipt-long" 
          />
        )}
      </GlassCard>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Theme.Spacing.containerPadding,
    paddingTop: Platform.OS === 'web' ? 24 : 88,
  },
  containerDesktop: {
    paddingTop: 24,
  },
  glassCard: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  sectionTitle: {
    ...Theme.Typography.headlineMd,
    color: Theme.Colors.onBackground,
  },
  sectionSubtitle: {
    ...Theme.Typography.labelMuted,
    color: Theme.Colors.outline,
    marginTop: 4,
    maxWidth: 500,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Theme.Rounded.full,
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
    color: Theme.Colors.onBackground,
    marginHorizontal: 12,
    minWidth: 120,
    textAlign: 'center',
  },
  propertyTabs: {
    flexDirection: 'row',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 16,
  },
  propTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.Rounded.full,
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  propTabActive: {
    backgroundColor: Theme.Colors.primary,
    borderColor: Theme.Colors.primary,
  },
  propTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.Colors.onSurfaceVariant,
  },
  propTabTextActive: {
    color: '#fff',
  },
  listCard: {
    padding: 24,
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.Colors.outline,
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
    color: Theme.Colors.onBackground,
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
    color: Theme.Colors.onBackground,
  },
  mobileCardDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  mobileDetailLabel: {
    fontSize: 13,
    color: Theme.Colors.outline,
    fontWeight: '500',
  },
  mobileAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  mobileAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.Colors.onBackground,
  },
  center: {
    padding: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
