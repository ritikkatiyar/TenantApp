import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLandlordDashboard, LandlordAnalyticsDTO } from '../api/analytics.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function AnalyticsDashboardScreen() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<LandlordAnalyticsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMsg(null);
        if (accessToken) {
          const response = await getLandlordDashboard(accessToken);
          setData(response);
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
      <View style={{ flex: 1, backgroundColor: '#f9f9ff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#004c5a" />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f9f9ff', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 16, color: '#ba1a1a', textAlign: 'center' }}>Failed to load analytics: {errorMsg}</Text>
        <TouchableOpacity style={{ marginTop: 16, backgroundColor: '#004c5a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 }} onPress={() => setLoading(true)}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f9f9ff', justifyContent: 'center', alignItems: 'center' }}>
        <Text>No data available</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9ff' }} edges={['top']}>
      {/* TopAppBar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#bec8cb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity>
            <MaterialIcons name="menu" size={24} color="#004c5a" />
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 32, fontWeight: '700', color: '#004c5a' }}>PropMetric</Text>
        </View>
        <TouchableOpacity>
          <MaterialIcons name="notifications" size={24} color="#004c5a" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 100, gap: 32 }}>
        {/* Header & Date Picker */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: '#6f797c', textTransform: 'uppercase' }}>Financial Overview</Text>
            <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 24, fontWeight: '600', color: '#111c2c', marginTop: 4 }}>Portfolio Analytics</Text>
          </View>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dee8ff', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 4 }}>
            <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 14, color: '#004c5a' }}>Monthly</Text>
            <MaterialIcons name="expand-more" size={18} color="#004c5a" />
          </TouchableOpacity>
        </View>

        {/* 1. Financial KPIs */}
        <View style={{ gap: 16 }}>
          {/* Revenue Card */}
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bec8cb', padding: 16, borderRadius: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: '#6f797c' }}>TOTAL REVENUE</Text>
              <MaterialIcons name="payments" size={24} color="rgba(0, 76, 90, 0.6)" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontFamily: 'JetBrains Mono', fontSize: 24, fontWeight: '600', color: '#004c5a' }}>${data.revenue.collected.toLocaleString()}</Text>
              <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 14, color: '#6f797c' }}>/ ${data.revenue.expected.toLocaleString()}</Text>
            </View>
            {/* Collection Rate Progress */}
            <View style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 14, color: '#111c2c' }}>Collection Rate</Text>
                <Text style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 'bold', color: '#004c5a' }}>{data.revenue.collectionRate}%</Text>
              </View>
              <View style={{ width: '100%', height: 6, backgroundColor: 'rgba(190, 200, 203, 0.3)', borderRadius: 4 }}>
                <View style={{ width: `${Math.min(data.revenue.collectionRate, 100)}%`, height: '100%', backgroundColor: '#004c5a', borderRadius: 4 }} />
              </View>
            </View>
          </View>

          {/* Expenses Card */}
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bec8cb', padding: 16, borderRadius: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: '#6f797c' }}>TOTAL EXPENSES</Text>
              <MaterialIcons name="receipt-long" size={24} color="rgba(186, 26, 26, 0.6)" />
            </View>
            <Text style={{ fontFamily: 'JetBrains Mono', fontSize: 24, fontWeight: '600', color: '#111c2c' }}>${data.expenses.totalExpenses.toLocaleString()}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <MaterialIcons name="trending-up" size={18} color="#ba1a1a" />
              <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 14, color: '#ba1a1a' }}>{data.expenses.growthFromLastMonth}% from last month</Text>
            </View>
          </View>

          {/* Net Profit Card */}
          <View style={{ backgroundColor: '#004c5a', padding: 16, borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: 'rgba(255, 255, 255, 0.8)' }}>NET PROFIT</Text>
              <MaterialIcons name="trending-up" size={24} color="rgba(255, 255, 255, 0.8)" />
            </View>
            <Text style={{ fontFamily: 'JetBrains Mono', fontSize: 24, fontWeight: 'bold', color: '#ffffff' }}>${data.profit.netProfit.toLocaleString()}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <MaterialIcons name="arrow-upward" size={18} color="#aaedff" />
              <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 14, color: '#aaedff' }}>{data.profit.growth}% growth</Text>
            </View>
          </View>
        </View>

        {/* 2. Portfolio Occupancy */}
        <View style={{ gap: 16 }}>
          <View style={{ borderLeftWidth: 4, borderLeftColor: '#004c5a', paddingLeft: 8 }}>
            <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 20, fontWeight: '600', color: '#111c2c' }}>Portfolio Occupancy</Text>
          </View>
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bec8cb', borderRadius: 4 }}>
            {data.occupancy.map((occ, idx) => (
              <View key={occ.propertyId} style={{ padding: 16, borderBottomWidth: idx < data.occupancy.length - 1 ? 1 : 0, borderBottomColor: 'rgba(190, 200, 203, 0.3)' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 16, fontWeight: '600', color: '#111c2c' }}>{occ.propertyName}</Text>
                  <Text style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: '#004c5a' }}>{occ.occupancyRate}%</Text>
                </View>
                <View style={{ width: '100%', height: 8, backgroundColor: 'rgba(190, 200, 203, 0.2)', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.min(occ.occupancyRate, 100)}%`, height: '100%', backgroundColor: '#004c5a', borderRadius: 4 }} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 3. Operational Overhead */}
        <View style={{ gap: 16 }}>
          <View style={{ borderLeftWidth: 4, borderLeftColor: '#004c5a', paddingLeft: 8 }}>
            <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 20, fontWeight: '600', color: '#111c2c' }}>Operational Overhead</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
            {Object.entries(data.operationalOverhead).map(([type, amount]) => (
              <View key={type} style={{ width: '48%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bec8cb', borderRadius: 4, padding: 16, alignItems: 'center' }}>
                <MaterialIcons name={getIconForOverhead(type)} size={24} color="#476083" style={{ marginBottom: 4 }} />
                <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 12, fontWeight: '700', color: '#6f797c', textTransform: 'uppercase' }}>{type}</Text>
                <Text style={{ fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 'bold', color: '#004c5a' }}>${amount.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4. Payment Defaulters */}
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ borderLeftWidth: 4, borderLeftColor: '#ba1a1a', paddingLeft: 8 }}>
              <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 20, fontWeight: '600', color: '#111c2c' }}>Payment Defaulters</Text>
            </View>
            <View style={{ backgroundColor: '#ffdad6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 }}>
              <Text style={{ color: '#93000a', fontSize: 10, fontWeight: 'bold' }}>{data.defaulters.length} CRITICAL</Text>
            </View>
          </View>
          <View style={{ gap: 8 }}>
            {data.defaulters.map((defaulter, idx) => (
              <View key={idx} style={{ backgroundColor: '#ffffff', borderLeftWidth: 4, borderLeftColor: '#ba1a1a', borderTopWidth: 1, borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#bec8cb', padding: 16, borderTopRightRadius: 8, borderBottomRightRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
                <View>
                  <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 16, fontWeight: 'bold', color: '#111c2c' }}>{defaulter.tenantName}</Text>
                  <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 14, color: '#6f797c' }}>Due {defaulter.daysOverdue} days ago</Text>
                  <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 12, color: '#6f797c' }}>{defaulter.propertyName} - {defaulter.unitNumber}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <Text style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: '600', color: '#ba1a1a' }}>-${defaulter.amountDue.toLocaleString()}</Text>
                  <TouchableOpacity style={{ backgroundColor: '#476083', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 100, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialIcons name="mail" size={14} color="#ffffff" />
                    <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 12, fontWeight: '700', color: '#ffffff' }}>Remind</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 5. Yield Analysis */}
        <View style={{ gap: 16 }}>
          <View style={{ borderLeftWidth: 4, borderLeftColor: '#004c5a', paddingLeft: 8 }}>
            <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 20, fontWeight: '600', color: '#111c2c' }}>Yield Analysis</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {data.yieldAnalysis.map((yieldItem, idx) => (
              <View key={idx} style={{ minWidth: 240, backgroundColor: '#e7eeff', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#bec8cb' }}>
                <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 12, fontWeight: '700', color: '#6f797c', textTransform: 'uppercase', marginBottom: 4 }}>{yieldItem.propertyName}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <View>
                    <Text style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 'bold', color: '#004c5a' }}>{yieldItem.netYield}%</Text>
                    <Text style={{ fontFamily: 'Hanken Grotesk', fontSize: 14, color: '#6f797c' }}>Net Yield</Text>
                  </View>
                  <Text style={{ fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: '600', color: '#004c5a' }}>(Mock Data)</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getIconForOverhead(type: string): keyof typeof MaterialIcons.glyphMap {
  const l = type.toLowerCase();
  if (l.includes('maintenance')) return 'build';
  if (l.includes('electricity')) return 'bolt';
  if (l.includes('water')) return 'water-drop';
  if (l.includes('admin')) return 'admin-panel-settings';
  return 'attach-money';
}
