import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useResponsive } from '@/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

export default function AnalyticsDashboardScreen() {
  const { accessToken } = useAuth();
  const { isDesktop } = useResponsive();
  const { handleScroll } = useScrollNav();

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [occupancy, setOccupancy] = useState<PortfolioOccupancyResponse[]>([]);
  const [defaulters, setDefaulters] = useState<DefaulterResponse[]>([]);
  const [expenses, setExpenses] = useState<ExpensesBreakdownResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
          setSummary(sumRes);
          setOccupancy(occRes);
          setDefaulters(defRes);
          setExpenses(expRes);
        } else {
          setErrorMsg('No access token available');
        }
      } catch (e: any) {
        console.error('Failed to load analytics', e);
        setErrorMsg(e.toString());
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [accessToken]);

  if (loading) {
    return (
      <LinearGradient colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#006875" />
      </LinearGradient>
    );
  }

  if (errorMsg) {
    return (
      <LinearGradient colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontFamily: 'Inter', fontSize: 16, color: '#ba1a1a', textAlign: 'center' }}>Failed to load analytics: {errorMsg}</Text>
        <TouchableOpacity style={{ marginTop: 16, backgroundColor: '#006875', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }} onPress={() => setLoading(true)}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (!summary) {
    return (
      <LinearGradient colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Inter', fontSize: 16, color: '#151d1e' }}>No data available</Text>
      </LinearGradient>
    );
  }

  const expectedRev = summary.expectedRevenue || 0;
  const collectedRev = summary.collectedRevenue || 0;
  const totalExp = summary.totalExpenses || 0;
  const maxVal = Math.max(expectedRev, collectedRev, totalExp, 1);

  return (
    <LinearGradient colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={isDesktop ? ['top'] : []}>
        {isDesktop && <DesktopNavBar title="Overview" />}

        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: isDesktop ? 24 : 88, paddingBottom: 100, gap: 32 }}
        >
          {/* Header & Date Picker */}
          <View style={{ flexDirection: 'row', justifyContent: isDesktop ? 'space-between' : 'flex-end', alignItems: 'flex-end' }}>
            {isDesktop && (
              <View>
                <Text style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: '#6f797c', textTransform: 'uppercase' }}>Financial Overview</Text>
                <Text style={{ fontFamily: 'Inter', fontSize: 24, fontWeight: '600', color: '#111c2c', marginTop: 4 }}>Portfolio Analytics</Text>
              </View>
            )}
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dee8ff', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 4 }}>
              <Text style={{ fontFamily: 'Inter', fontSize: 14, color: '#004c5a' }}>Monthly</Text>
              <MaterialIcons name="expand-more" size={18} color="#004c5a" />
            </TouchableOpacity>
          </View>

          {/* 1. Financial KPIs & Visual Comparison Chart */}
          <View style={{ gap: 20 }}>
            <View style={{ borderLeftWidth: 4, borderLeftColor: '#004c5a', paddingLeft: 8 }}>
              <Text style={{ fontFamily: 'Inter', fontSize: 20, fontWeight: '600', color: '#111c2c' }}>Financial Performance</Text>
            </View>

            {/* Graphical Comparison Bar Chart */}
            <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bec8cb', padding: 20, borderRadius: 12 }}>
              <Text style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: '700', color: '#6f797c', marginBottom: 16 }}>PORTFOLIO CASH FLOW COMPARISON</Text>

              <View style={{ height: 160, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#bec8cb', paddingBottom: 8, gap: 16 }}>
                {/* Expected Column */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{
                    height: `${Math.max(5, (expectedRev / maxVal) * 100)}%`,
                    width: 24,
                    backgroundColor: '#4f46e5',
                    borderRadius: 6,
                  }} />
                  <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '700', color: '#4f46e5', marginTop: 8 }}>₹{expectedRev.toFixed(0)}</Text>
                  <Text style={{ fontFamily: 'Inter', fontSize: 10, color: '#6f797c', marginTop: 2 }}>Expected</Text>
                </View>

                {/* Collected Column */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{
                    height: `${Math.max(5, (collectedRev / maxVal) * 100)}%`,
                    width: 24,
                    backgroundColor: '#059669',
                    borderRadius: 6,
                  }} />
                  <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '700', color: '#059669', marginTop: 8 }}>₹{collectedRev.toFixed(0)}</Text>
                  <Text style={{ fontFamily: 'Inter', fontSize: 10, color: '#6f797c', marginTop: 2 }}>Collected</Text>
                </View>

                {/* Expenses Column */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{
                    height: `${Math.max(5, (totalExp / maxVal) * 100)}%`,
                    width: 24,
                    backgroundColor: '#dc2626',
                    borderRadius: 6,
                  }} />
                  <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '700', color: '#dc2626', marginTop: 8 }}>₹{totalExp.toFixed(0)}</Text>
                  <Text style={{ fontFamily: 'Inter', fontSize: 10, color: '#6f797c', marginTop: 2 }}>Expenses</Text>
                </View>
              </View>
            </View>

            {/* KPI Cards Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {/* Expected Revenue */}
              <View style={{ flex: 1, minWidth: 150, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bec8cb', padding: 16, borderRadius: 12 }}>
                <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6f797c' }}>Expected Revenue</Text>
                <Text style={{ fontFamily: 'Inter', fontSize: 20, fontWeight: '700', color: '#111c2c', marginTop: 4 }}>₹{expectedRev.toFixed(2)}</Text>
              </View>

              {/* Collected Revenue */}
              <View style={{ flex: 1, minWidth: 150, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bec8cb', padding: 16, borderRadius: 12 }}>
                <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6f797c' }}>Collected Revenue</Text>
                <Text style={{ fontFamily: 'Inter', fontSize: 20, fontWeight: '700', color: '#059669', marginTop: 4 }}>₹{collectedRev.toFixed(2)}</Text>
                <Text style={{ fontFamily: 'Inter', fontSize: 11, color: '#6f797c', marginTop: 4 }}>
                  Collection Rate: {summary.collectionRate?.toFixed(1)}%
                </Text>
              </View>

              {/* Net Profit */}
              <View style={{ flex: 1, minWidth: 150, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bec8cb', padding: 16, borderRadius: 12 }}>
                <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6f797c' }}>Net Profit</Text>
                <Text style={{ fontFamily: 'Inter', fontSize: 20, fontWeight: '700', color: summary.netProfit >= 0 ? '#111c2c' : '#dc2626', marginTop: 4 }}>
                  ₹{summary.netProfit?.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* 2. Portfolio Occupancy & Yield */}
          <View style={{ gap: 16 }}>
            <View style={{ borderLeftWidth: 4, borderLeftColor: '#004c5a', paddingLeft: 8 }}>
              <Text style={{ fontFamily: 'Inter', fontSize: 20, fontWeight: '600', color: '#111c2c' }}>Portfolio Occupancy & Yield</Text>
            </View>

            {occupancy.length === 0 ? (
              <Text style={{ fontFamily: 'Inter', fontSize: 14, color: '#6f797c' }}>No properties registered yet.</Text>
            ) : (
              occupancy.map((prop) => (
                <View key={prop.propertyId} style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bec8cb', padding: 16, borderRadius: 12, gap: 8 }}>
                  <Text style={{ fontFamily: 'Inter', fontSize: 16, fontWeight: '600', color: '#111c2c' }}>{prop.propertyName}</Text>
                  <Text style={{ fontFamily: 'Inter', fontSize: 13, color: '#6f797c' }}>
                    Occupied: {prop.occupiedUnits} / {prop.totalUnits} units ({prop.occupancyRate?.toFixed(1)}%)
                  </Text>
                  <Text style={{ fontFamily: 'Inter', fontSize: 13, color: '#006875', fontWeight: '600' }}>
                    Yield Est: {prop.netYield?.toFixed(1)}%
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* 3. Defaulter List */}
          <View style={{ gap: 16 }}>
            <View style={{ borderLeftWidth: 4, borderLeftColor: '#ba1a1a', paddingLeft: 8 }}>
              <Text style={{ fontFamily: 'Inter', fontSize: 20, fontWeight: '600', color: '#111c2c' }}>Overdue Rent Payments</Text>
            </View>

            {defaulters.length === 0 ? (
              <Text style={{ fontFamily: 'Inter', fontSize: 14, color: '#059669', fontWeight: '500' }}>Great news! No overdue rent payments.</Text>
            ) : (
              defaulters.map((def, idx) => (
                <View key={def.rentCycleId || idx} style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#fca5a5', padding: 16, borderRadius: 12, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: '#111c2c' }}>{def.tenantName} (Unit {def.unitNumber})</Text>
                    <Text style={{ fontFamily: 'Inter', fontSize: 15, fontWeight: '700', color: '#dc2626' }}>₹{def.amountDue?.toFixed(2)}</Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6f797c' }}>Property: {def.propertyName}</Text>
                  <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#dc2626', fontWeight: '600' }}>{def.daysOverdue} days overdue</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
