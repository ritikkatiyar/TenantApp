import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  FlatList,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useResponsive } from '@/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { getLedgerForProperty, LedgerEntryResponse } from '../api/ledger.api';

export default function LedgerScreen({ token }: { token: string | null }) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();
  const propertyId = paramPropertyId || (properties && properties.length > 0 ? properties[0].id : null);
  const { showToast } = useToast();

  const [ledger, setLedger] = useState<LedgerEntryResponse[]>([]);
  const [filteredLedger, setFilteredLedger] = useState<LedgerEntryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLedger = useCallback(async () => {
    if (!token || !propertyId) return;
    try {
      setIsLoading(true);
      const data = await getLedgerForProperty(propertyId, token);
      setLedger(data);
      setFilteredLedger(data);
    } catch (error: any) {
      showToast(error.message || 'Failed to load ledger', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, token, showToast]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLedger(ledger);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = ledger.filter(item => 
      item.unitName.toLowerCase().includes(q) || 
      item.tenantName.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q) || 
      item.transactionType.toLowerCase().includes(q)
    );
    setFilteredLedger(filtered);
  }, [searchQuery, ledger]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'PAYMENT_RECEIVED':
        return { text: '#059669', bg: '#d1fae5' };
      case 'INVOICE_GENERATED':
        return { text: '#2563eb', bg: '#dbeafe' };
      case 'LATE_FEE_APPLIED':
        return { text: '#dc2626', bg: '#fee2e2' };
      case 'REFUND':
        return { text: '#d97706', bg: '#fef3c7' };
      case 'ADJUSTMENT':
      default:
        return { text: '#4b5563', bg: '#f3f4f6' };
    }
  };

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [40, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
      </TouchableOpacity>
      <Animated.View style={[styles.compactTitleContainer, { opacity: headerOpacity }]}>
        <Text style={styles.compactTitleText}>Finance Ledger</Text>
      </Animated.View>
    </View>
  );

  const renderSearchBox = () => (
    <View style={styles.searchBox}>
      <MaterialIcons name="search" size={20} color="#6b7a7d" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search by Apt, Tenant name, or Description..."
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
  );

  const renderLedgerList = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color="#006875" style={{ marginTop: 80 }} />;
    }

    if (filteredLedger.length === 0) {
      return (
        <BlurView intensity={40} tint="light" style={styles.emptyCard}>
          <MaterialIcons name="account-balance" size={48} color="#6b7a7d" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>No transaction logs found.</Text>
          <Text style={styles.emptySubtitle}>Transactions appear here once rent cycles are generated or payments are made.</Text>
        </BlurView>
      );
    }

    if (isDesktop) {
      return (
        <BlurView intensity={60} tint="light" style={styles.desktopTableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.5 }]}>DATE</Text>
            <Text style={[styles.th, { flex: 1 }]}>UNIT</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>TENANT</Text>
            <Text style={[styles.th, { flex: 2 }]}>TRANSACTION TYPE</Text>
            <Text style={[styles.th, { flex: 3 }]}>DESCRIPTION</Text>
            <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>AMOUNT</Text>
          </View>

          {filteredLedger.map((item) => {
            const colors = getTransactionTypeColor(item.transactionType);
            const isPayment = item.amount < 0;
            return (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1.5, fontSize: 13, color: '#5b6b6d' }]}>{formatDate(item.createdAt)}</Text>
                <Text style={[styles.td, { flex: 1, fontWeight: '700' }]}>{item.unitName}</Text>
                <Text style={[styles.td, { flex: 1.5 }]}>{item.tenantName}</Text>
                <View style={[styles.td, { flex: 2, flexDirection: 'row' }]}>
                  <View style={[styles.pill, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.pillText, { color: colors.text }]}>
                      {formatTransactionType(item.transactionType)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.td, { flex: 3, fontSize: 13, color: '#5b6b6d' }]} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={[
                  styles.td, 
                  { 
                    flex: 1.5, 
                    textAlign: 'right', 
                    fontWeight: '800',
                    color: isPayment ? '#059669' : '#dc2626'
                  }
                ]}>
                  {isPayment ? '+' : '-'} ₹{Math.abs(item.amount).toFixed(2)}
                </Text>
              </View>
            );
          })}
        </BlurView>
      );
    }

    return (
      <View style={styles.listContainer}>
        {filteredLedger.map((item) => {
          const colors = getTransactionTypeColor(item.transactionType);
          const isPayment = item.amount < 0;
          return (
            <BlurView key={item.id} intensity={40} tint="light" style={styles.mobileCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardUnitText}>{item.unitName}</Text>
                <Text style={[
                  styles.cardAmountText, 
                  { color: isPayment ? '#059669' : '#dc2626' }
                ]}>
                  {isPayment ? '+' : '-'} ₹{Math.abs(item.amount).toFixed(2)}
                </Text>
              </View>

              <View style={styles.cardDetailRow}>
                <Text style={styles.cardTenantText}>{item.tenantName}</Text>
                <Text style={styles.cardDateText}>{formatDate(item.createdAt)}</Text>
              </View>

              <View style={[styles.pill, { backgroundColor: colors.bg, alignSelf: 'flex-start', marginTop: 8 }]}>
                <Text style={[styles.pillText, { color: colors.text, fontSize: 10 }]}>
                  {formatTransactionType(item.transactionType)}
                </Text>
              </View>

              <Text style={styles.cardDescText}>{item.description}</Text>
            </BlurView>
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {isDesktop ? (
          <>
            <DesktopNavBar activeTab="Finance" onBack={() => router.back()} backText="Back to Settings" />
            <ScrollView contentContainerStyle={styles.desktopScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.desktopInner}>
                <View style={styles.desktopHeaderRow}>
                  <View style={styles.largeTitleContainer}>
                    <Text style={styles.titleLineDesktop}>Finance Ledger</Text>
                    <Text style={styles.subtitle}>View audit trails, invoice generation records, and payments received.</Text>
                  </View>
                  <View style={{ width: 350 }}>
                    {renderSearchBox()}
                  </View>
                </View>

                {renderLedgerList()}
              </View>
            </ScrollView>
          </>
        ) : (
          <>
            {renderHeader()}
            <Animated.ScrollView
              contentContainerStyle={styles.mobileScroll}
              showsVerticalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
            >
              <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
                <Text style={styles.titleLine}>Finance</Text>
                <Text style={styles.titleLine}>Ledger</Text>
              </Animated.View>

              {renderSearchBox()}
              {renderLedgerList()}
            </Animated.ScrollView>
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  compactTitleContainer: { flex: 1 },
  compactTitleText: { fontSize: 22, fontWeight: '800', color: '#151d1e' },
  
  mobileScroll: { paddingHorizontal: 24, paddingBottom: 60 },
  titleContainer: { marginTop: 16, marginBottom: 24 },
  titleLine: { fontSize: 44, fontWeight: '800', color: '#151d1e', lineHeight: 48 },
  
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
    marginBottom: 20
  },
  searchInput: { flex: 1, color: '#151d1e', fontSize: 14 },
  
  emptyCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    marginTop: 20
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#151d1e', marginTop: 12, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#6b7a7d', textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  
  listContainer: { gap: 16 },
  mobileCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardUnitText: { fontSize: 16, fontWeight: '800', color: '#151d1e' },
  cardAmountText: { fontSize: 16, fontWeight: '800' },
  cardDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cardTenantText: { fontSize: 13, color: '#5b6b6d', fontWeight: '500' },
  cardDateText: { fontSize: 12, color: '#6b7a7d' },
  cardDescText: { fontSize: 13, color: '#6b7a7d', marginTop: 10, lineHeight: 18 },
  
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pillText: { fontSize: 11, fontWeight: '800' },
  
  desktopScroll: { padding: 40, alignItems: 'center' },
  desktopInner: { width: '100%', maxWidth: 1100 },
  desktopHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  largeTitleContainer: { flex: 1, marginRight: 24 },
  titleLineDesktop: { fontSize: 32, fontWeight: '800', color: '#151d1e', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6b7a7d' },
  
  desktopTableCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,104,117,0.1)'
  },
  th: { fontSize: 12, fontWeight: '800', color: '#006875', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  td: { fontSize: 14, color: '#151d1e' }
});
