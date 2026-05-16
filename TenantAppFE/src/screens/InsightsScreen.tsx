import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function InsightsScreen() {
  // Mock data for the insights
  const stats = {
    expected: '₹12,45,000',
    collected: '₹8,30,000',
    remaining: '₹4,15,000',
    occupancy: '94%',
    collectionRate: '67%',
    activeUnits: 142,
    totalProperties: 12
  };

  const renderMetricCard = (title: string, value: string, icon: any, color: string, subtitle?: string) => (
    <BlurView intensity={60} tint="light" style={styles.metricCard}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.metricInfo}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={[styles.metricValue, { color: color }]}>{value}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </View>
    </BlurView>
  );

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#f9ede0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Insights</Text>
              <Text style={styles.headerSubtitle}>Portfolio Financial Overview</Text>
            </View>
            <TouchableOpacity style={styles.periodSelector}>
              <Text style={styles.periodText}>THIS MONTH</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#006875" />
            </TouchableOpacity>
          </View>

          {/* Revenue Overview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>REVENUE BREAKDOWN</Text>
            <View style={styles.revenueRow}>
              {renderMetricCard('Expected', stats.expected, 'payments', '#006875', 'Total Billing')}
              {renderMetricCard('Collected', stats.collected, 'check-circle', '#2e7d32', `${stats.collectionRate} Progress`)}
            </View>
            <View style={styles.revenueRow}>
              {renderMetricCard('Remaining', stats.remaining, 'pending-actions', '#c62828', 'Outstanding')}
              <BlurView intensity={60} tint="light" style={styles.metricCard}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 229, 255, 0.15)' }]}>
                  <Ionicons name="pie-chart" size={24} color="#006875" />
                </View>
                <View style={styles.metricInfo}>
                  <Text style={styles.metricTitle}>Occupancy</Text>
                  <Text style={styles.metricValue}>{stats.occupancy}</Text>
                  <Text style={styles.metricSubtitle}>{stats.activeUnits} Units Leased</Text>
                </View>
              </BlurView>
            </View>
          </View>

          {/* Performance Chart Placeholder */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>COLLECTION PROGRESS</Text>
            <BlurView intensity={80} tint="light" style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View>
                  <Text style={styles.chartMainValue}>{stats.collectionRate}</Text>
                  <Text style={styles.chartSubtitle}>Overall Collection Efficiency</Text>
                </View>
                <View style={styles.trendBadge}>
                  <MaterialIcons name="trending-up" size={16} color="#2e7d32" />
                  <Text style={styles.trendText}>+4.2%</Text>
                </View>
              </View>
              
              {/* Simplified Progress Visualization */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={['#00d4ff', '#0072ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: stats.collectionRate as `${number}%` }]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>₹0</Text>
                  <Text style={styles.progressLabel}>₹6L</Text>
                  <Text style={styles.progressLabel}>₹12.4L</Text>
                </View>
              </View>
            </BlurView>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PORTFOLIO SUMMARY</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Properties</Text>
                <Text style={styles.summaryValue}>{stats.totalProperties}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Active Leases</Text>
                <Text style={styles.summaryValue}>142</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Maintenance</Text>
                <Text style={styles.summaryValue}>08</Text>
              </View>
            </View>
          </View>

          {/* Spacer for Bottom Navigation */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#151d1e',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7a7d',
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#fff',
  },
  periodText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006875',
    marginRight: 4,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7a7d',
    letterSpacing: 1.5,
    marginBottom: 15,
    paddingLeft: 4,
  },
  revenueRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    overflow: 'hidden',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricInfo: {
    gap: 2,
  },
  metricTitle: {
    fontSize: 13,
    color: '#6b7a7d',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#151d1e',
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#9ba9ab',
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  chartMainValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#151d1e',
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#6b7a7d',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e7d32',
  },
  progressContainer: {
    gap: 10,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    color: '#6b7a7d',
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7a7d',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#151d1e',
  },
});
