import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  ScrollView,
  TextInput
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useResponsive } from '@/src/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useLedger } from '@/src/features/finance/hooks/useLedger';

// Sub-components
import { LedgerTable } from '../components/billing/LedgerTable';

export default function LedgerScreen({ token }: { token: string | null }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { handleScroll } = useScrollNav();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();
  const propertyId = paramPropertyId || (properties && properties.length > 0 ? properties[0].id : null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Pagination and Date Filter States
  const [page, setPage] = useState(0);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromDateInput, setFromDateInput] = useState('');
  const [toDateInput, setToDateInput] = useState('');

  useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery]);

  // React-Query Custom Hook
  const {
    ledger,
    totalPages,
    isLoading,
  } = useLedger(propertyId, page, fromDate, toDate, debouncedSearchQuery, token);

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
    <View style={[styles.headerContainer, { paddingTop: insets.top, height: 56 + insets.top }]}>
      <BlurView intensity={45} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color={theme.Colors.onSurface} />
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
      <MaterialIcons name="search" size={20} color={theme.Colors.onSurfaceVariant} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search by Apt, Tenant name, or Description..."
        placeholderTextColor={theme.Colors.onSurfaceVariant}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
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
          placeholderTextColor={theme.Colors.onSurfaceVariant}
          value={fromDateInput}
          onChangeText={setFromDateInput}
        />
      </View>
      <View style={styles.dateInputContainer}>
        <Text style={styles.filterLabel}>To:</Text>
        <TextInput
          style={styles.dateInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.Colors.onSurfaceVariant}
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
            <MaterialIcons name="clear" size={16} color={theme.Colors.onSurfaceVariant} />
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
          <MaterialIcons name="chevron-left" size={24} color={page === 0 ? '#b0bec5' : theme.Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.pageText}>
          Page {page + 1} of {totalPages}
        </Text>
        <TouchableOpacity
          onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          style={[styles.pageButton, page >= totalPages - 1 && styles.pageButtonDisabled]}
        >
          <MaterialIcons name="chevron-right" size={24} color={page >= totalPages - 1 ? '#b0bec5' : theme.Colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderDesktopShell = () => (
    <LinearGradient colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']} style={styles.gradient}>
      <View style={{ flex: 1, width: '100%' }}>
        <DesktopNavBar 
          onBack={() => router.push('/expenses')} 
          backText="Back to Finance & Billing" 
          properties={properties || []}
          selectedPropertyId={propertyId}
          onPropertyChange={(id) => router.replace(`/expenses/ledger?propertyId=${id}`)}
        />
        <ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false, listener: handleScroll }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={styles.desktopScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.desktopInner}>
            <View style={styles.desktopHeaderRow}>
              <View style={styles.largeTitleContainer}>
                <Text style={styles.titleLineDesktop}>Property General Ledger</Text>
                <Text style={styles.desktopSubtitle}>Reconcile billing outputs, dynamic interest logs, cash settle records & security collections</Text>
              </View>
            </View>

            <View style={styles.desktopFilterRow}>
              <View style={{ flex: 1.5 }}>
                {renderSearchBox()}
              </View>
              <View style={{ flex: 1 }}>
                {renderDateFilters()}
              </View>
            </View>

            <LedgerTable
              ledger={ledger}
              properties={properties}
              isLoading={isLoading}
              isDesktop={isDesktop}
              isDark={isDark}
            />

            {renderPaginationControls()}
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );

  const renderMobileShell = () => (
    <LinearGradient colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={[]}>
        {renderGlassyHeader()}
        
        <Animated.ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false, listener: handleScroll }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={[styles.mobileScroll, { paddingTop: 68 + insets.top }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
            <Text style={styles.screenTitle}>General Ledger</Text>
            <Text style={styles.screenSubtitle}>View all dynamic billing transactions and record collections</Text>
          </Animated.View>

          {renderSearchBox()}
          {renderDateFilters()}

          <LedgerTable
            ledger={ledger}
            properties={properties}
            isLoading={isLoading}
            isDesktop={isDesktop}
            isDark={isDark}
          />

          {renderPaginationControls()}
          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );

  return (
    <View style={{ flex: 1 }}>
      {isDesktop ? renderDesktopShell() : renderMobileShell()}
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.Colors.glassFill,
    overflow: 'hidden',
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: theme.Colors.glassFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrapper: { flex: 1, alignItems: 'center' },
  compactTitleText: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.BodyLarge.fontSize,
    fontFamily: 'Inter',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  desktopScroll: { paddingVertical: 24, paddingHorizontal: 40, alignItems: 'center' },
  mobileScroll: { paddingVertical: 10, paddingHorizontal: 20 },
  desktopInner: { width: '100%', maxWidth: 1080, paddingTop: 24 },
  titleContainer: { marginTop: 10, marginBottom: 20 },
  screenTitle: {
    fontSize: theme.Typography.headlineLg.fontSize,
    fontFamily: 'Outfit',
    fontWeight: '900',
    color: theme.Colors.onSurface,
  },
  screenSubtitle: {
    fontSize: theme.Typography.BodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 4,
    fontWeight: '600',
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: { flex: 1, color: theme.Colors.onSurface, fontSize: theme.Typography.BodyMedium.fontSize, fontWeight: '600' },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1.5,
    borderColor: theme.Colors.glassStroke,
    borderRadius: 16,
    padding: 10,
    gap: 10,
    marginBottom: 16,
  },
  dateInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterLabel: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  dateInput: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    color: theme.Colors.onSurface,
    paddingHorizontal: 10,
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterButtonsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: theme.Colors.primary,
  },
  filterButtonText: {
    color: theme.Surface.card,
    fontSize: theme.Typography.BodySmall.fontSize,
    fontWeight: '800',
  },
  clearFilterButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: theme.Colors.glassStroke,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonDisabled: { opacity: 0.5 },
  pageText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  desktopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  largeTitleContainer: { flex: 1 },
  titleLineDesktop: {
    fontSize: theme.Typography.headlineLg.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
  },
  desktopSubtitle: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 4,
    fontWeight: '600',
  },
  desktopFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
    zIndex: 10,
  },
});
