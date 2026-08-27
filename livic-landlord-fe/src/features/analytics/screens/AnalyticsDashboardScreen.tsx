import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PageShell } from '@/src/components/common/layout/PageShell';
import {
  getAnalyticsSummary,
  getPortfolioOccupancy,
  getDefaultersList,
  getExpensesBreakdown,
  SummaryResponse,
  PortfolioOccupancyResponse,
  DefaulterResponse,
  ExpensesBreakdownResponse,
} from '../api/analytics.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsive } from '@/src/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { BlurView } from 'expo-blur';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import Pagination from '@/src/components/common/navigation/Pagination';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useProperties } from '@/src/hooks/useProperties';
import { createStyles } from './AnalyticsDashboardScreen.styles';

// Hardcoded fallback demo data for when DB stats are completely empty/blank
const DEMO_SUMMARY: SummaryResponse = {
  expectedRevenue: 380000,
  collectedRevenue: 345000,
  collectionRate: 90.7,
  totalExpenses: 45000,
  expenseGrowthRate: -2.4,
  netProfit: 300000,
  profitGrowthRate: 5.8
};

const DEMO_OCCUPANCY: PortfolioOccupancyResponse[] = [
  {
    propertyId: 'demo-1',
    propertyName: 'Grand View Residency',
    totalUnits: 32,
    occupiedUnits: 29,
    occupancyRate: 90.6,
    netYield: 8.4
  },
  {
    propertyId: 'demo-2',
    propertyName: 'Cyber Heights PG',
    totalUnits: 45,
    occupiedUnits: 38,
    occupancyRate: 84.4,
    netYield: 9.1
  }
];

const DEMO_DEFAULTERS: DefaulterResponse[] = [
  {
    tenantName: 'Rahul Sharma',
    unitNumber: 'B-302',
    propertyName: 'Grand View Residency',
    daysOverdue: 8,
    amountDue: 18000,
    rentCycleId: 'demo-rc-1'
  },
  {
    tenantName: 'Priya Patel',
    unitNumber: 'A-108',
    propertyName: 'Cyber Heights PG',
    daysOverdue: 5,
    amountDue: 12500,
    rentCycleId: 'demo-rc-2'
  }
];

const DEMO_EXPENSES: ExpensesBreakdownResponse = {
  totalExpenses: 45000,
  growthFromLastMonth: -2.4,
  operationalOverhead: {
    'Maintenance': 18000,
    'Electricity': 15000,
    'Internet/WiFi': 7000,
    'Water Utility': 5000
  }
};

export default function AnalyticsDashboardScreen() {
  const { theme, isDark } = useAppTheme();
  const { accessToken } = useAuth();
  const { isDesktop } = useResponsive();
  const { handleScroll } = useScrollNav();

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [occupancy, setOccupancy] = useState<PortfolioOccupancyResponse[]>([]);
  const [defaulters, setDefaulters] = useState<DefaulterResponse[]>([]);
  const [expenses, setExpenses] = useState<ExpensesBreakdownResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const { selectedPropertyId } = useGlobalPropertySelection();
  const { properties } = useProperties();
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  const filteredOccupancy = selectedPropertyId
    ? occupancy.filter((o) => o.propertyId === selectedPropertyId || o.propertyName === selectedProperty?.name)
    : occupancy;

  const filteredDefaulters = selectedPropertyId
    ? defaulters.filter((d) => d.propertyName === selectedProperty?.name)
    : defaulters;

  const [occupancyPage, setOccupancyPage] = useState(0);
  const OCCUPANCY_PER_PAGE = 4;
  const totalOccupancyPages = Math.ceil(filteredOccupancy.length / OCCUPANCY_PER_PAGE);
  const paginatedOccupancy = filteredOccupancy.slice(occupancyPage * OCCUPANCY_PER_PAGE, (occupancyPage + 1) * OCCUPANCY_PER_PAGE);

  const [defaultersPage, setDefaultersPage] = useState(0);
  const DEFAULTERS_PER_PAGE = 4;
  const totalDefaultersPages = Math.ceil(filteredDefaulters.length / DEFAULTERS_PER_PAGE);
  const paginatedDefaulters = filteredDefaulters.slice(defaultersPage * DEFAULTERS_PER_PAGE, (defaultersPage + 1) * DEFAULTERS_PER_PAGE);

  const styles = React.useMemo(() => createStyles(theme, isDark, isDesktop), [theme, isDark, isDesktop]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMsg(null);
        if (accessToken) {
          const [sumRes, occRes, defRes, expRes] = await Promise.all([
            getAnalyticsSummary(accessToken),
            getPortfolioOccupancy(accessToken),
            getDefaultersList(accessToken),
            getExpensesBreakdown(accessToken),
          ]);

          setSummary(sumRes || { totalProperties: 0, totalUnits: 0, occupiedUnits: 0, vacantUnits: 0, occupancyRate: 0, expectedRevenue: 0, collectedRevenue: 0, pendingRevenue: 0 });
          setOccupancy(occRes || []);
          setDefaulters(defRes || []);
          setExpenses(expRes || []);
          setIsDemoMode(false);
        } else {
          setErrorMsg('No access token available');
        }
      } catch (e: any) {
        console.error('Failed to load analytics', e);
        setErrorMsg(e.message || 'Failed to load live analytics data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [accessToken]);

  if (loading) {
    return (
      <PageShell scrollable={false} edges={isDesktop ? ['top'] : []}>

        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
        </View>
      </PageShell>
    );
  }

  const expectedRev = summary?.expectedRevenue || 0;
  const collectedRev = summary?.collectedRevenue || 0;
  const totalExp = summary?.totalExpenses || 0;
  const maxVal = Math.max(expectedRev, collectedRev, totalExp, 1);

  const overheadEntries = expenses?.operationalOverhead 
    ? Object.entries(expenses.operationalOverhead) 
    : [];

  const maxExpense = overheadEntries.length > 0 
    ? Math.max(...overheadEntries.map(([_, v]) => v)) 
    : 1;

  return (
    <PageShell
      scrollable={true}
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
    >


      {/* Header and Mode Indicator */}
      {isDemoMode && (
        <View style={styles.headerContainer}>
          <View style={styles.demoBadge}>
            <MaterialIcons name="info-outline" size={14} color={theme.Colors.secondary} />
            <Text style={styles.demoBadgeText}>DEMO DATA PREVIEW</Text>
          </View>
        </View>
      )}

      {/* Financial KPIs Grid */}
      <View style={styles.kpiGrid}>
        <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={styles.kpiCard}>
          <Text style={styles.kpiLabel} numberOfLines={1}>EXPECTED</Text>
          <Text style={styles.kpiValue} numberOfLines={1}>₹{expectedRev.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
          <Text style={styles.kpiSub} numberOfLines={1}>Projected</Text>
        </BlurView>

        <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={styles.kpiCard}>
          <Text style={styles.kpiLabel} numberOfLines={1}>COLLECTED</Text>
          <Text style={[styles.kpiValue, { color: theme.Colors.primary }]} numberOfLines={1}>
            ₹{collectedRev.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.kpiSub} numberOfLines={1}>
            {summary?.collectionRate?.toFixed(1)}% rate
          </Text>
        </BlurView>

        <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={styles.kpiCard}>
          <Text style={styles.kpiLabel} numberOfLines={1}>NET PROFIT</Text>
          <Text style={[styles.kpiValue, { color: (summary?.netProfit || 0) >= 0 ? theme.Colors.onSurface : theme.Colors.error }]} numberOfLines={1}>
            ₹{(summary?.netProfit || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.kpiSub} numberOfLines={1}>Net gain</Text>
        </BlurView>
      </View>

      {/* Responsive Section Grid */}
      <View style={[styles.sectionRow, isDesktop && styles.sectionRowDesktop]}>
        
        {/* Left Column: Charts and Occupancy */}
        <View style={styles.mainColumn}>
          {/* Cash Flow Comparison */}
          <BlurView intensity={65} tint={isDark ? "dark" : "light"} style={styles.glassCard}>
            <Text style={styles.cardHeaderTitle}>Portfolio Cash Flow</Text>
            
            <View style={styles.chartContainer}>
              {/* Expected Column */}
              <View style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <LinearGradient
                    colors={['#00e0ff', '#0070ea']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.barFill, { height: `${Math.max(5, (expectedRev / maxVal) * 100)}%` }]}
                  />
                </View>
                <Text style={styles.barValText}>₹{(expectedRev / 1000).toFixed(0)}k</Text>
                <Text style={styles.barLabel}>Expected</Text>
              </View>

              {/* Collected Column */}
              <View style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.barFill, { height: `${Math.max(5, (collectedRev / maxVal) * 100)}%` }]}
                  />
                </View>
                <Text style={[styles.barValText, { color: '#059669' }]}>₹{(collectedRev / 1000).toFixed(0)}k</Text>
                <Text style={styles.barLabel}>Collected</Text>
              </View>

              {/* Expenses Column */}
              <View style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.barFill, { height: `${Math.max(5, (totalExp / maxVal) * 100)}%` }]}
                  />
                </View>
                <Text style={[styles.barValText, { color: '#dc2626' }]}>₹{(totalExp / 1000).toFixed(0)}k</Text>
                <Text style={styles.barLabel}>Overhead</Text>
              </View>
            </View>
          </BlurView>

          {/* Operational Expenses Breakdown */}
          {overheadEntries.length > 0 && (
            <BlurView intensity={65} tint={isDark ? "dark" : "light"} style={styles.glassCard}>
              <Text style={styles.cardHeaderTitle}>Overhead Breakdown</Text>
              <View style={styles.expenseBreakdownList}>
                {overheadEntries.map(([category, value]) => (
                  <View key={category} style={styles.expenseRow}>
                    <View style={styles.expenseRowHeader}>
                      <Text style={styles.expenseCategory}>{category}</Text>
                      <Text style={styles.expenseValue}>₹{value.toLocaleString()}</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <LinearGradient
                        colors={['#ba1a1a', '#ff8b8b']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${(value / maxExpense) * 100}%` }]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </BlurView>
          )}
        </View>

        {/* Right Column: Occupancy & Defaulters */}
        <View style={styles.sideColumn}>
          {/* Portfolio Occupancy */}
          <BlurView intensity={65} tint={isDark ? "dark" : "light"} style={styles.glassCard}>
            <Text style={styles.cardHeaderTitle}>Occupancy & Yield</Text>
            
            <View style={styles.occupancyList}>
              {paginatedOccupancy.length === 0 ? (
                <Text style={styles.emptyText}>No registered properties.</Text>
              ) : (
                paginatedOccupancy.map((prop) => (
                  <View key={prop.propertyId} style={styles.occupancyItem}>
                    <View style={styles.propHeaderRow}>
                      <Text style={styles.propertyName}>{prop.propertyName}</Text>
                      <Text style={styles.yieldPill}>Yield: {prop.netYield?.toFixed(1)}%</Text>
                    </View>
                    
                    <Text style={styles.occupancyRateText}>
                      {prop.occupiedUnits} of {prop.totalUnits} Units Occupied ({prop.occupancyRate?.toFixed(1)}%)
                    </Text>

                    <View style={styles.progressBarBg}>
                      <LinearGradient
                        colors={['#00d4ff', '#0072ff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${prop.occupancyRate}%` }]}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
            <Pagination page={occupancyPage} totalPages={totalOccupancyPages} onPageChange={setOccupancyPage} />
          </BlurView>

          {/* Overdue Payments */}
          <BlurView intensity={65} tint={isDark ? "dark" : "light"} style={styles.glassCard}>
            <Text style={[styles.cardHeaderTitle, { color: theme.Colors.error }]}>Overdue Rent cycles</Text>
            
            <View style={styles.defaultersList}>
              {paginatedDefaulters.length === 0 ? (
                <View style={styles.allClearContainer}>
                  <MaterialIcons name="check-circle" size={24} color={theme.Colors.primary} />
                  <Text style={styles.allClearText}>All rent accounts up to date</Text>
                </View>
              ) : (
                paginatedDefaulters.map((def, idx) => (
                  <View key={def.rentCycleId || idx} style={styles.defaulterItem}>
                    <View style={styles.defHeaderRow}>
                      <Text style={styles.defName}>{def.tenantName} (Unit {def.unitNumber})</Text>
                      <Text style={styles.defAmount}>₹{def.amountDue?.toLocaleString()}</Text>
                    </View>
                    <View style={styles.defFooterRow}>
                      <Text style={styles.defProperty}>{def.propertyName}</Text>
                      <Text style={styles.defDays}>{def.daysOverdue} days overdue</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
            <Pagination page={defaultersPage} totalPages={totalDefaultersPages} onPageChange={setDefaultersPage} />
          </BlurView>
        </View>

    </View>
    </PageShell>
  );
}
