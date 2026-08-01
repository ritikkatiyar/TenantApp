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

  // Pagination and Date Filter States
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromDateInput, setFromDateInput] = useState('');
  const [toDateInput, setToDateInput] = useState('');

  const fetchLedger = useCallback(async () => {
    if (!token || !propertyId) return;
    try {
      setIsLoading(true);
      
      let validatedFrom: string | undefined = undefined;
      if (fromDate.trim()) {
        const d = new Date(fromDate.trim());
        if (!isNaN(d.getTime())) {
          validatedFrom = d.toISOString();
        } else {
          showToast('Invalid From Date format. Use YYYY-MM-DD.', 'error');
          setIsLoading(false);
          return;
        }
      }

      let validatedTo: string | undefined = undefined;
      if (toDate.trim()) {
        const d = new Date(toDate.trim());
        if (!isNaN(d.getTime())) {
          validatedTo = d.toISOString();
        } else {
          showToast('Invalid To Date format. Use YYYY-MM-DD.', 'error');
          setIsLoading(false);
          return;
        }
      }

      const data = await getLedgerForProperty(propertyId, token, page, 20, validatedFrom, validatedTo);
      setLedger(data.content);
      setFilteredLedger(data.content);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      showToast(error.message || 'Failed to load ledger', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, token, page, fromDate, toDate, showToast]);

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

  const handleApplyFilters = () => {
    setPage(0);
    setFromDate(fromDateInput);
    setToDate(toDateInput);
  };

  const handleClearFilters = () => {
    setPage(0);
    setFromDateInput('');
    setToDateInput('');
    setFromDate('');
    setToDate('');
  };

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

  const renderGlassyHeader = () => (
    <View style={styles.headerContainer}>
      <BlurView intensity={45} tint="light" style={StyleSheet.absoluteFillObject} />
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color="#0b1c30" />
        </TouchableOpacity>
        <View style={styles.titleWrapper}>
          <Text style={styles.compactTitleText}>Finance Ledger</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>
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

  const renderDateFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.dateInputContainer}>
        <Text style={styles.filterLabel}>From:</Text>
        <TextInput
          style={styles.dateInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#6b7a7d"
          value={fromDateInput}
          onChangeText={setFromDateInput}
        />
      </View>
      <View style={styles.dateInputContainer}>
        <Text style={styles.filterLabel}>To:</Text>
        <TextInput
          style={styles.dateInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#6b7a7d"
          value={toDateInput}
          onChangeText={setToDateInput}
        />
      </View>
      <View style={styles.filterButtonsRow}>
        <TouchableOpacity onPress={handleApplyFilters} style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Apply</Text>
        </TouchableOpacity>
        {(fromDate || toDate || fromDateInput || toDateInput) ? (
          <TouchableOpacity onPress={handleClearFilters} style={styles.clearFilterButton}>
            <MaterialIcons name="clear" size={16} color="#6b7a7d" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;
    return (
      <View style={styles.paginationRow}>
        <TouchableOpacity
          onPress={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          style={[styles.pageButton, page === 0 && styles.pageButtonDisabled]}
        >
          <MaterialIcons name="chevron-left" size={24} color={page === 0 ? '#b0bec5' : '#006875'} />
        </TouchableOpacity>
        <Text style={styles.pageText}>
          Page {page + 1} of {totalPages}
        </Text>
        <TouchableOpacity
          onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          style={[styles.pageButton, page >= totalPages - 1 && styles.pageButtonDisabled]}
        >
          <MaterialIcons name="chevron-right" size={24} color={page >= totalPages - 1 ? '#b0bec5' : '#006875'} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderLedgerList = () => {
    if (!properties || properties.length === 0) {
      return (
        <BlurView intensity={60} tint="light" style={{ padding: 32, borderRadius: 24, alignItems: 'center', maxWidth: 500, alignSelf: 'center', marginTop: 40, width: '100%' }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0, 104, 117, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <MaterialIcons name="business" size={32} color="#006875" />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#163235', marginBottom: 8, textAlign: 'center' }}>No Property Created Yet</Text>
          <Text style={{ fontSize: 14, color: '#6b7a7d', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
            Viewing financial ledgers requires an active property. Create your first property to start logging transactions.
          </Text>
          <TouchableOpacity 
            style={{ borderRadius: 100, overflow: 'hidden' }}
            onPress={() => router.push('/properties/create')}
          >
            <LinearGradient colors={['#00d4ff', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 8 }}>
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1 }}>CREATE FIRST PROPERTY</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      );
    }

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
            <Text style={[styles.th, { flex: 2.5 }]}>DESCRIPTION</Text>
            <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>AMOUNT</Text>
            <Text style={[styles.th, { flex: 1.3, textAlign: 'right' }]}>BALANCE</Text>
          </View>

          {filteredLedger.map((item) => {
            const colors = getTransactionTypeColor(item.transactionType);
            const isPayment = item.amount < 0;
            return (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1.5, fontSize: 13, color: '#5b6b6d' }]}>{formatDate(item.createdAt)}</Text>
                <Text style={[styles.td, { flex: 1, fontWeight: '700' }]}>{item.unitName}</Text>
                <Text style={[styles.td, { flex: 1.5 }]}>{item.tenantName}</Text>
                <View style={{ flex: 2, flexDirection: 'row' }}>
                  <View style={[styles.pill, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.pillText, { color: colors.text }]}>
                      {formatTransactionType(item.transactionType)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.td, { flex: 2.5, fontSize: 13, color: '#5b6b6d' }]} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={[
                  styles.td, 
                  { 
                    flex: 1.2, 
                    textAlign: 'right', 
                    fontWeight: '800',
                    color: isPayment ? '#059669' : '#dc2626'
                  }
                ]}>
                  {isPayment ? '+' : '-'} ₹{Math.abs(item.amount).toFixed(2)}
                </Text>
                <Text style={[
                  styles.td, 
                  { 
                    flex: 1.3, 
                    textAlign: 'right', 
                    fontWeight: '700',
                    color: '#151d1e'
                  }
                ]}>
                  ₹{(item.balance ?? 0).toFixed(2)}
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
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[
                    styles.cardAmountText, 
                    { color: isPayment ? '#059669' : '#dc2626' }
                  ]}>
                    {isPayment ? '+' : '-'} ₹{Math.abs(item.amount).toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#5b6b6d', marginTop: 2 }}>
                    Bal: ₹{(item.balance ?? 0).toFixed(2)}
                  </Text>
                </View>
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
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {isDesktop ? (
          <>
            <DesktopNavBar 
              onBack={() => router.push('/expenses')} 
              backText="Back to Finance & Billing" 
              properties={properties || []}
              selectedPropertyId={propertyId}
              onPropertyChange={(id) => router.replace(`/expenses/ledger?propertyId=${id}`)}
            />
            <ScrollView contentContainerStyle={styles.desktopScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.desktopInner}>
                <View style={styles.desktopHeaderRow}>
                  <View style={styles.largeTitleContainer}>
                    <Text style={styles.titleLineDesktop}>Finance Ledger</Text>
                    <Text style={styles.subtitle}>View audit trails, invoice generation records, and payments received.</Text>
                  </View>
                  <View style={{ gap: 8, alignItems: 'flex-end' }}>
                    <View style={{ width: 350 }}>
                      {renderSearchBox()}
                    </View>
                    {renderDateFilters()}
                  </View>
                </View>

                {renderLedgerList()}
                {renderPaginationControls()}
              </View>
            </ScrollView>
          </>
        ) : (
          <>
            {renderGlassyHeader()}
            <Animated.ScrollView
              contentContainerStyle={styles.mobileScroll}
              showsVerticalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
            >
              {/* Hero title — desktop only; mobile uses glassy header */}
              {false && (
                <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
                  <Text style={styles.titleLine}>Finance</Text>
                  <Text style={styles.titleLine}>Ledger</Text>
                </Animated.View>
              )}

              {renderSearchBox()}
              {renderDateFilters()}
              {renderLedgerList()}
              {renderPaginationControls()}
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
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    zIndex: 999,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#006677',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compactTitleText: { fontSize: 18, fontFamily: 'Inter', fontWeight: '800', color: '#0b1c30' },
  
  mobileScroll: { paddingHorizontal: 24, paddingTop: 76, paddingBottom: 60 },
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
    marginBottom: 16
  },
  searchInput: { flex: 1, color: '#151d1e', fontSize: 14 },

  // Date filter styles
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap'
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
    gap: 6
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006875'
  },
  dateInput: {
    width: 90,
    color: '#151d1e',
    fontSize: 12,
    padding: 0
  },
  filterButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  filterButton: {
    backgroundColor: '#006875',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  clearFilterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)'
  },

  // Pagination styles
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 24,
    marginBottom: 20
  },
  pageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  pageButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)'
  },
  pageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151d1e'
  },
  
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
  
  desktopScroll: { paddingVertical: 24, paddingHorizontal: 40, alignItems: 'center' },
  desktopInner: { width: '100%', maxWidth: 1080 },
  desktopHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  largeTitleContainer: { flex: 1, marginRight: 24 },
  titleLineDesktop: { fontSize: 32, fontWeight: '800', color: '#151d1e', lineHeight: 38, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#6b7a7d', fontWeight: '500', marginTop: 4, lineHeight: 20 },
  
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
