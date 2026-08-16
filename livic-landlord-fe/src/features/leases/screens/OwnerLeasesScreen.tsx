import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Theme } from '@/src/theme/Theme';
import { BlurView } from 'expo-blur';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useProperties } from '@/src/hooks/useProperties';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { formatCurrency, formatCompactCurrency } from '@/src/utils/formatters';

import {
  listActiveLeasesByProperty,
  createLease,
  updateLeaseTerms,
  LeaseResponse,
} from '@/src/features/tenant/api/lease.api';

import {
  createUnitBooking,
  listUnitBookings,
  forfeitUnitBooking,
  refundUnitBooking,
  initiateTokenOnlinePayment,
  recordTokenCashPayment,
  getVacatingUnits,
  serveLeaseNotice,
  UnitBookingResponse,
} from '@/src/features/leases/api/unitBooking.api';

import { getAllFloorsLayout, UnitResponse } from '@/src/features/properties/api/unit.api';

const STAT_GRAD: [string, string][] = [
  ['#0891b2', '#06b6d4'],
  ['#dc2626', '#ef4444'],
  ['#4f46e5', '#7c3aed'],
  ['#059669', '#10b981'],
];
const STAT_COLORS = ['#0891b2', '#dc2626', '#4f46e5', '#059669'];

import { PropertySelector } from '@/src/components/common/display/PropertySelector';

export default function OwnerLeasesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { accessToken } = useAuth();
  const { properties, isLoading: isPropsLoading } = useProperties();
  const { showToast } = useToast();
  const { handleScroll } = useScrollNav();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'leases' | 'bookings' | 'vacancies'>('leases');
  const [searchQuery, setSearchQuery] = useState('');

  // API Data States
  const [leases, setLeases] = useState<LeaseResponse[]>([]);
  const [bookings, setBookings] = useState<UnitBookingResponse[]>([]);
  const [vacatingUnits, setVacatingUnits] = useState<any[]>([]);
  const [availableUnits, setAvailableUnits] = useState<UnitResponse[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Modal States
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isNoticeModalVisible, setIsNoticeModalVisible] = useState(false);
  const [isCashModalVisible, setIsCashModalVisible] = useState(false);
  const [isConversionModalVisible, setIsConversionModalVisible] = useState(false);
  const [isEditTermsModalVisible, setIsEditTermsModalVisible] = useState(false);
  const [editingLease, setEditingLease] = useState<LeaseResponse | null>(null);
  const [editRentAmount, setEditRentAmount] = useState('');
  const [editSecurityDeposit, setEditSecurityDeposit] = useState('');
  const [isSavingTerms, setIsSavingTerms] = useState(false);

  // Selected Action Targets
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Forms
  const [noticeMoveOutDate, setNoticeMoveOutDate] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashNote, setCashNote] = useState('');
  const [bookingUnitId, setBookingUnitId] = useState('');
  const [bookingTenantName, setBookingTenantName] = useState('');
  const [bookingTenantPhone, setBookingTenantPhone] = useState('');
  const [bookingTenantEmail, setBookingTenantEmail] = useState('');
  const [bookingTokenAmount, setBookingTokenAmount] = useState('');
  const [bookingExpectedMoveIn, setBookingExpectedMoveIn] = useState('');
  const [convMonthlyRentAmount, setConvMonthlyRentAmount] = useState('');
  const [convSecurityDeposit, setConvSecurityDeposit] = useState('');
  const [convSplitStrategy, setConvSplitStrategy] = useState<'FULL_UNIT' | 'PER_OCCUPANT' | 'CUSTOM'>('FULL_UNIT');

  const [currentLeasesPage, setCurrentLeasesPage] = useState(0);
  const [totalLeasesElements, setTotalLeasesElements] = useState(0);
  const [totalLeasesPages, setTotalLeasesPages] = useState(0);

  // Initialize selected property
  useEffect(() => {
    if (properties && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const loadScreenData = useCallback(async () => {
    if (!accessToken || !selectedPropertyId) return;

    try {
      setIsLoadingData(true);
      const [leasesRes, bookingsData, vacatingData, allUnits] = await Promise.all([
        listActiveLeasesByProperty(selectedPropertyId, accessToken, currentLeasesPage, 20),
        listUnitBookings(accessToken),
        getVacatingUnits(selectedPropertyId, accessToken),
        getAllFloorsLayout(selectedPropertyId, accessToken).catch(() => []),
      ]);

      setLeases(leasesRes.content || []);
      setTotalLeasesElements(leasesRes.totalElements || 0);
      setTotalLeasesPages(leasesRes.totalPages || 0);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setVacatingUnits(Array.isArray(vacatingData) ? vacatingData : []);
      setAvailableUnits(Array.isArray(allUnits) ? allUnits : []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to sync data with the server', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [accessToken, selectedPropertyId, currentLeasesPage, showToast]);

  useEffect(() => {
    loadScreenData();
  }, [loadScreenData]);

  // ─── Actions ────────────────────────────────────────────────────────────────
  const handleServeNotice = async () => {
    if (!selectedLeaseId || !noticeMoveOutDate.trim() || !accessToken) {
      showToast('Please specify a valid move-out date.', 'error');
      return;
    }
    try {
      await serveLeaseNotice(selectedLeaseId, noticeMoveOutDate, accessToken);
      showToast('Notice served successfully.', 'success');
      setIsNoticeModalVisible(false);
      setSelectedLeaseId(null);
      setNoticeMoveOutDate('');
      loadScreenData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to serve notice.', 'error');
    }
  };

  const handleCreateBooking = async () => {
    if (!bookingUnitId || !bookingTenantName.trim() || !bookingTenantPhone.trim() || !bookingTokenAmount || !bookingExpectedMoveIn || !selectedPropertyId || !accessToken) {
      showToast('Please fill out all mandatory fields.', 'error');
      return;
    }
    try {
      await createUnitBooking({
        unitId: bookingUnitId,
        propertyId: selectedPropertyId,
        prospectiveTenantName: bookingTenantName,
        prospectiveTenantPhone: bookingTenantPhone,
        prospectiveTenantEmail: bookingTenantEmail.trim() || null,
        tokenAmount: parseFloat(bookingTokenAmount),
        expectedMoveInDate: bookingExpectedMoveIn,
      }, accessToken);

      showToast('Room/Bed booked successfully.', 'success');
      setIsBookingModalVisible(false);
      setBookingUnitId('');
      setBookingTenantName('');
      setBookingTenantPhone('');
      setBookingTenantEmail('');
      setBookingTokenAmount('');
      setBookingExpectedMoveIn('');
      loadScreenData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create booking.', 'error');
    }
  };

  const handleRecordCashToken = async () => {
    if (!selectedBookingId || !cashAmount || !accessToken) {
      showToast('Please enter the token cash amount.', 'error');
      return;
    }
    try {
      await recordTokenCashPayment(selectedBookingId, parseFloat(cashAmount), cashNote, accessToken);
      showToast('Token cash payment recorded successfully.', 'success');
      setIsCashModalVisible(false);
      setSelectedBookingId(null);
      setCashAmount('');
      setCashNote('');
      loadScreenData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to record payment.', 'error');
    }
  };

  const handleOnlineTokenPayment = async (bookingId: string) => {
    if (!accessToken) return;
    try {
      await initiateTokenOnlinePayment(bookingId, accessToken);
      showToast('Online token payment link initiated.', 'success');
      loadScreenData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to initiate online payment.', 'error');
    }
  };

  const handleForfeitBooking = async (bookingId: string) => {
    if (!accessToken) return;
    try {
      await forfeitUnitBooking(bookingId, accessToken);
      showToast('Booking token forfeited.', 'success');
      loadScreenData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to forfeit token.', 'error');
    }
  };

  const handleRefundBooking = async (bookingId: string) => {
    if (!accessToken) return;
    try {
      await refundUnitBooking(bookingId, accessToken);
      showToast('Booking token refunded.', 'success');
      loadScreenData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to refund token.', 'error');
    }
  };

  const handleConvertBookingToLease = async () => {
    if (!selectedBookingId || !convSecurityDeposit || !convMonthlyRentAmount || !accessToken) {
      showToast('Please specify the monthly rent and security deposit amounts.', 'error');
      return;
    }
    const booking = bookings.find((b) => b.id === selectedBookingId);
    if (!booking) return;

    try {
      await createLease({
        unitId: booking.unitId,
        monthlyRentAmount: parseFloat(convMonthlyRentAmount),
        securityDeposit: parseFloat(convSecurityDeposit),
        splitStrategy: convSplitStrategy,
        moveInDate: booking.expectedMoveInDate,
        bookingId: booking.id,
      }, accessToken);

      showToast('Converted prospective tenant to active lease!', 'success');
      setIsConversionModalVisible(false);
      setSelectedBookingId(null);
      setConvSecurityDeposit('');
      setConvMonthlyRentAmount('');
      loadScreenData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to convert to active lease.', 'error');
    }
  };

  const openInventory = (lease: LeaseResponse) => {
    const tab = lease.moveOutDate ? 'moveOut' : 'moveIn';
    router.push(`/inventory?tab=${tab}&leaseId=${lease.id}`);
  };

  const handleOpenEditTerms = (lease: LeaseResponse) => {
    setEditingLease(lease);
    setEditRentAmount(lease.monthlyRentAmount != null ? lease.monthlyRentAmount.toString() : '');
    setEditSecurityDeposit(lease.securityDeposit != null ? lease.securityDeposit.toString() : '0');
    setIsEditTermsModalVisible(true);
  };

  const handleSaveTerms = async () => {
    if (!editingLease || !accessToken) return;
    const rentNum = parseFloat(editRentAmount);
    const depNum = parseFloat(editSecurityDeposit);
    if (isNaN(rentNum) || rentNum < 0) {
      showToast('Please enter a valid monthly rent amount', 'error');
      return;
    }
    if (isNaN(depNum) || depNum < 0) {
      showToast('Please enter a valid security deposit', 'error');
      return;
    }

    try {
      setIsSavingTerms(true);
      const updated = await updateLeaseTerms(editingLease.id, { monthlyRentAmount: rentNum, securityDeposit: depNum }, accessToken);
      setLeases(prev => prev.map(l => l.id === updated.id ? { ...l, monthlyRentAmount: updated.monthlyRentAmount, securityDeposit: updated.securityDeposit } : l));
      showToast('Lease terms updated successfully', 'success');
      setIsEditTermsModalVisible(false);
      setEditingLease(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update lease terms', 'error');
    } finally {
      setIsSavingTerms(false);
    }
  };

  // ─── Filtered Data ──────────────────────────────────────────────────────────
  const filteredLeases = useMemo(() => {
    if (!Array.isArray(leases)) return [];
    return leases
      .filter((l) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          (l.unitNumber && l.unitNumber.toLowerCase().includes(q)) ||
          (l.tenantName && l.tenantName.toLowerCase().includes(q)) ||
          (l.tenantPhone && l.tenantPhone.toLowerCase().includes(q)) ||
          (l.status && l.status.toLowerCase().includes(q))
        );
      })
      .sort((a, b) =>
        (a.unitNumber || '').localeCompare(b.unitNumber || '', undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      );
  }, [leases, searchQuery]);

  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    return bookings
      .filter((b) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          (b.unitNumber && b.unitNumber.toLowerCase().includes(q)) ||
          (b.prospectiveTenantName && b.prospectiveTenantName.toLowerCase().includes(q)) ||
          (b.prospectiveTenantPhone && b.prospectiveTenantPhone.toLowerCase().includes(q)) ||
          (b.status && b.status.toLowerCase().includes(q))
        );
      })
      .sort((a, b) =>
        (a.unitNumber || '').localeCompare(b.unitNumber || '', undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      );
  }, [bookings, searchQuery]);

  // Compute live stats
  const totalRentRoll = filteredLeases.reduce((sum, l) => sum + (Number(l.monthlyRentAmount) || 0), 0);
  const noticeCount = filteredLeases.filter((l) => Boolean(l.moveOutDate)).length;
  const pendingBookingsCount = bookings.filter((b) => b.status === 'BOOKED').length;
  const activeLeasesDisplayCount = totalLeasesElements > 0 ? totalLeasesElements : filteredLeases.length;

  const stats = [
    { label: 'Active Leases', value: String(activeLeasesDisplayCount), helper: `${properties.find(p => p.id === selectedPropertyId)?.name || 'Property'} units`, icon: 'vpn-key' as const },
    { label: 'Notices Served', value: String(noticeCount).padStart(2, '0'), helper: 'Vacating soon', icon: 'warning-amber' as const },
    { label: 'Pending Bookings', value: String(pendingBookingsCount).padStart(2, '0'), helper: 'Tokens received', icon: 'bookmark' as const },
    { label: 'Monthly Rent Roll', value: formatCompactCurrency(totalRentRoll), helper: 'Contracted revenue', icon: 'calculate' as const },
  ];

  const currentPropertyName = properties.find(p => p.id === selectedPropertyId)?.name || 'All Properties';

  const TABS = [
    { id: 'leases' as const, label: 'Lease Registry', icon: 'vpn-key' as const, count: activeLeasesDisplayCount },
    { id: 'bookings' as const, label: 'Pending Bookings', icon: 'bookmark' as const, count: filteredBookings.length },
    { id: 'vacancies' as const, label: 'Vacating & Notices', icon: 'door-sliding' as const, count: vacatingUnits.length },
  ];

  return (
    <LinearGradient
      colors={Theme.Colors.backgroundGradient as [string, string, string]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {isDesktop && (
          <DesktopNavBar
            title="Lease Operations"
            properties={properties || []}
            selectedPropertyId={selectedPropertyId}
            onPropertyChange={setSelectedPropertyId}
          />
        )}

        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isDesktop ? styles.scrollContentDesktop : { paddingTop: 88 }]}
        >
          {/* Header Section */}
          <View style={styles.desktopHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>TENANCY MANAGEMENT</Text>
              <Text style={styles.title}>Leases & Bookings</Text>
              <Text style={styles.subtitle}>
                Manage active tenancies, notice periods, unit bookings, and move-in/out inventory.
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.createBtnWrapper}
                onPress={() => setIsBookingModalVisible(true)}
                activeOpacity={0.82}
              >
                <LinearGradient colors={['#0891b2', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtn}>
                  <MaterialIcons name="bookmark-add" size={18} color="#fff" />
                  <Text style={styles.createBtnText}>Book Room</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mobile Property Selector */}
          {!isDesktop && properties.length > 0 && (
            <PropertySelector
              properties={properties}
              selectedPropertyId={selectedPropertyId}
              onSelectProperty={setSelectedPropertyId}
            />
          )}

          {/* 4 Glassmorphic Stat Cards */}
          <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
            {stats.map((stat, i) => (
              <BlurView key={stat.label} intensity={55} tint="light" style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
                <LinearGradient colors={STAT_GRAD[i]} style={styles.statIconCircle}>
                  <MaterialIcons name={stat.icon as any} size={18} color="#fff" />
                </LinearGradient>
                <Text style={[styles.statValue, { color: STAT_COLORS[i] }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statHelper}>{stat.helper}</Text>
              </BlurView>
            ))}
          </View>

          {/* Tab Selector */}
          <View style={styles.tabBar}>
            {TABS.map((t) => {
              const active = activeTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setActiveTab(t.id)}
                  activeOpacity={0.8}
                >
                  {active && (
                    <LinearGradient
                      colors={t.id === 'vacancies' ? ['#dc2626', '#ef4444'] : ['#0891b2', '#0072ff']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  )}
                  <MaterialIcons name={t.icon} size={16} color={active ? '#fff' : '#6b7280'} />
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                  <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{t.count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={18} color="#9ca3af" />
            <TextInput
              placeholder="Search by tenant name, unit number, phone, status..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Main List Panel */}
          <BlurView intensity={65} tint="light" style={styles.panel}>
            {isLoadingData ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#0891b2" />
                <Text style={styles.loadingText}>Syncing lease records...</Text>
              </View>
            ) : activeTab === 'leases' ? (
              filteredLeases.length === 0 ? (
                <View style={styles.emptyState}>
                  <LinearGradient colors={['rgba(8,145,178,0.1)', 'rgba(0,114,255,0.1)']} style={styles.emptyIconCircle}>
                    <MaterialIcons name="vpn-key" size={32} color="#0891b2" />
                  </LinearGradient>
                  <Text style={styles.emptyTitle}>No Active Leases</Text>
                  <Text style={styles.emptySubtitle}>Book rooms or convert bookings to generate tenancy contracts for this property.</Text>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {filteredLeases.map((l) => {
                    const hasNotice = Boolean(l.moveOutDate);
                    return (
                      <BlurView key={l.id} intensity={45} tint="light" style={[styles.leaseCard, hasNotice && styles.leaseCardAlert]}>
                        {hasNotice && <LinearGradient colors={['#dc2626', '#ef4444']} style={styles.alertStripe} />}
                        <View style={styles.leaseCardInner}>
                          <View style={styles.tenantAvatarCircle}>
                            <Text style={styles.tenantAvatarText}>
                              {(l.tenantName || 'T').substring(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.leaseMainInfo}>
                            <View style={styles.leaseTopRow}>
                              <View style={styles.unitBadge}>
                                <MaterialIcons name="meeting-room" size={12} color="#0891b2" />
                                <Text style={styles.unitBadgeText}>Unit {l.unitNumber}</Text>
                              </View>
                              <StatusPill status={hasNotice ? 'ENDING_SOON' : l.status || 'ACTIVE'} />
                            </View>
                            <Text style={styles.tenantName}>{l.tenantName || 'Active Tenant'}</Text>
                            <Text style={styles.tenantContact}>{l.tenantPhone || 'No contact specified'}</Text>
                            
                            <View style={styles.leaseDetailsRow}>
                              <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>MONTHLY RENT</Text>
                                <Text style={styles.detailValue}>{formatCurrency(l.monthlyRentAmount)}</Text>
                              </View>
                              <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>SECURITY DEPOSIT</Text>
                                <Text style={styles.detailValue}>{formatCurrency(l.securityDeposit ?? 0)}</Text>
                              </View>
                              <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>MOVE-IN</Text>
                                <Text style={styles.detailValueSecondary}>{l.moveInDate}</Text>
                              </View>
                              {l.moveOutDate && (
                                <View style={styles.detailItem}>
                                  <Text style={[styles.detailLabel, { color: '#dc2626' }]}>EXPECTED VACATE</Text>
                                  <Text style={[styles.detailValueSecondary, { color: '#dc2626', fontWeight: '800' }]}>{l.moveOutDate}</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          <View style={styles.leaseActionsCol}>
                            <TouchableOpacity
                              style={styles.actionBtnOutline}
                              onPress={() => handleOpenEditTerms(l)}
                            >
                              <MaterialIcons name="edit" size={14} color="#0891b2" />
                              <Text style={styles.actionBtnText}>Edit Terms</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.actionBtnPrimary}
                              onPress={() => openInventory(l)}
                            >
                              <LinearGradient colors={['#0891b2', '#0072ff']} style={styles.actionBtnInner}>
                                <MaterialIcons name="inventory-2" size={14} color="#fff" />
                                <Text style={styles.actionBtnTextPrimary}>Inventory</Text>
                              </LinearGradient>
                            </TouchableOpacity>

                            {!l.moveOutDate && (
                              <TouchableOpacity
                                style={styles.actionBtnOutlineDanger}
                                onPress={() => {
                                  setSelectedLeaseId(l.id);
                                  setIsNoticeModalVisible(true);
                                }}
                              >
                                <MaterialIcons name="warning" size={14} color="#ef4444" />
                                <Text style={styles.actionBtnTextDanger}>Serve Notice</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </BlurView>
                    );
                  })}

                  {totalLeasesPages > 1 && (
                    <View style={styles.paginationBar}>
                      <Text style={styles.paginationInfo}>
                        Showing {currentLeasesPage * 20 + 1}–{Math.min((currentLeasesPage + 1) * 20, totalLeasesElements)} of {totalLeasesElements} leases
                      </Text>
                      <View style={styles.paginationControls}>
                        <TouchableOpacity
                          disabled={currentLeasesPage === 0}
                          onPress={() => setCurrentLeasesPage(p => Math.max(0, p - 1))}
                          style={[styles.pageBtn, currentLeasesPage === 0 && styles.pageBtnDisabled]}
                        >
                          <MaterialIcons name="chevron-left" size={18} color={currentLeasesPage === 0 ? '#9ca3af' : '#0891b2'} />
                          <Text style={[styles.pageBtnText, currentLeasesPage === 0 && styles.pageBtnTextDisabled]}>Previous</Text>
                        </TouchableOpacity>

                        <View style={styles.pageNumberPill}>
                          <Text style={styles.pageNumberText}>
                            Page {currentLeasesPage + 1} of {totalLeasesPages}
                          </Text>
                        </View>

                        <TouchableOpacity
                          disabled={currentLeasesPage >= totalLeasesPages - 1}
                          onPress={() => setCurrentLeasesPage(p => Math.min(totalLeasesPages - 1, p + 1))}
                          style={[styles.pageBtn, currentLeasesPage >= totalLeasesPages - 1 && styles.pageBtnDisabled]}
                        >
                          <Text style={[styles.pageBtnText, currentLeasesPage >= totalLeasesPages - 1 && styles.pageBtnTextDisabled]}>Next</Text>
                          <MaterialIcons name="chevron-right" size={18} color={currentLeasesPage >= totalLeasesPages - 1 ? '#9ca3af' : '#0891b2'} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )
            ) : activeTab === 'bookings' ? (
              filteredBookings.length === 0 ? (
                <View style={styles.emptyState}>
                  <LinearGradient colors={['rgba(79,70,229,0.1)', 'rgba(124,58,237,0.1)']} style={styles.emptyIconCircle}>
                    <MaterialIcons name="bookmark-border" size={32} color="#4f46e5" />
                  </LinearGradient>
                  <Text style={styles.emptyTitle}>No Pending Bookings</Text>
                  <Text style={styles.emptySubtitle}>Click "Book Room" above to reserve rooms for prospective tenants.</Text>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {filteredBookings.map((b) => (
                    <BlurView key={b.id} intensity={45} tint="light" style={styles.leaseCard}>
                      <View style={styles.leaseCardInner}>
                        <View style={[styles.tenantAvatarCircle, { backgroundColor: 'rgba(79,70,229,0.1)' }]}>
                          <Text style={[styles.tenantAvatarText, { color: '#4f46e5' }]}>
                            {(b.prospectiveTenantName || 'P').substring(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.leaseMainInfo}>
                          <View style={styles.leaseTopRow}>
                            <View style={styles.unitBadge}>
                              <MaterialIcons name="meeting-room" size={12} color="#0891b2" />
                              <Text style={styles.unitBadgeText}>Unit {b.unitNumber}</Text>
                            </View>
                            <StatusPill status={b.status} />
                          </View>
                          <Text style={styles.tenantName}>{b.prospectiveTenantName}</Text>
                          <Text style={styles.tenantContact}>{b.prospectiveTenantPhone} {b.prospectiveTenantEmail ? `· ${b.prospectiveTenantEmail}` : ''}</Text>

                          <View style={styles.leaseDetailsRow}>
                            <View style={styles.detailItem}>
                              <Text style={styles.detailLabel}>TOKEN AMOUNT</Text>
                              <Text style={styles.detailValue}>{formatCurrency(b.tokenAmount)}</Text>
                            </View>
                            <View style={styles.detailItem}>
                              <Text style={styles.detailLabel}>EXPECTED MOVE-IN</Text>
                              <Text style={styles.detailValueSecondary}>{b.expectedMoveInDate}</Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.leaseActionsCol}>
                          {b.status === 'BOOKED' && !b.paymentTransactionId && (
                            <>
                              <TouchableOpacity
                                style={styles.actionBtnOutline}
                                onPress={() => {
                                  setSelectedBookingId(b.id);
                                  setIsCashModalVisible(true);
                                }}
                              >
                                <MaterialIcons name="payments" size={14} color="#0891b2" />
                                <Text style={styles.actionBtnText}>Cash Token</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.actionBtnOutline}
                                onPress={() => handleOnlineTokenPayment(b.id)}
                              >
                                <MaterialIcons name="link" size={14} color="#0891b2" />
                                <Text style={styles.actionBtnText}>Online Pay</Text>
                              </TouchableOpacity>
                            </>
                          )}

                          {b.status === 'BOOKED' && (
                            <TouchableOpacity
                              style={styles.actionBtnPrimary}
                              onPress={() => {
                                setSelectedBookingId(b.id);
                                setIsConversionModalVisible(true);
                              }}
                            >
                              <LinearGradient colors={['#059669', '#10b981']} style={styles.actionBtnInner}>
                                <MaterialIcons name="check-circle" size={14} color="#fff" />
                                <Text style={styles.actionBtnTextPrimary}>Convert to Lease</Text>
                              </LinearGradient>
                            </TouchableOpacity>
                          )}

                          {b.status === 'BOOKED' && (
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                              <TouchableOpacity
                                style={styles.actionBtnTextBtn}
                                onPress={() => handleForfeitBooking(b.id)}
                              >
                                <Text style={styles.forfeitText}>Forfeit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.actionBtnTextBtn}
                                onPress={() => handleRefundBooking(b.id)}
                              >
                                <Text style={styles.refundText}>Refund</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </BlurView>
                  ))}
                </View>
              )
            ) : (
              vacatingUnits.length === 0 ? (
                <View style={styles.emptyState}>
                  <LinearGradient colors={['rgba(220,38,38,0.1)', 'rgba(239,68,68,0.1)']} style={styles.emptyIconCircle}>
                    <MaterialIcons name="door-sliding" size={32} color="#dc2626" />
                  </LinearGradient>
                  <Text style={styles.emptyTitle}>No Vacancies or Notices</Text>
                  <Text style={styles.emptySubtitle}>No tenants have served move-out notice for this property.</Text>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {vacatingUnits.map((v, i) => (
                    <BlurView key={v.id || i} intensity={45} tint="light" style={styles.leaseCard}>
                      <View style={styles.leaseCardInner}>
                        <View style={[styles.tenantAvatarCircle, { backgroundColor: 'rgba(220,38,38,0.1)' }]}>
                          <MaterialIcons name="door-sliding" size={22} color="#dc2626" />
                        </View>
                        <View style={styles.leaseMainInfo}>
                          <Text style={styles.tenantName}>Unit {v.unitNumber || v.name}</Text>
                          <Text style={styles.tenantContact}>{v.propertyName || currentPropertyName}</Text>
                          <Text style={[styles.detailValueSecondary, { color: '#dc2626', marginTop: 4 }]}>
                            Move-Out Scheduled: {v.expectedVacateDate || 'Notice Active'}
                          </Text>
                        </View>
                      </View>
                    </BlurView>
                  ))}
                </View>
              )
            )}
          </BlurView>
        </ScrollView>
      </SafeAreaView>

      {/* ─── MODAL 1: Book Room ────────────────────────────────────────────────── */}
      <Modal visible={isBookingModalVisible} transparent animationType="fade" onRequestClose={() => setIsBookingModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>NEW RESERVATION</Text>
                <Text style={styles.modalTitle}>Book Room / Bed</Text>
              </View>
              <TouchableOpacity onPress={() => setIsBookingModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Select Available Unit *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {availableUnits.map((u) => {
                    const sel = bookingUnitId === u.id;
                    return (
                      <TouchableOpacity
                        key={u.id}
                        onPress={() => setBookingUnitId(u.id)}
                        style={[styles.unitChip, sel && styles.unitChipSelected]}
                      >
                        <MaterialIcons name="meeting-room" size={14} color={sel ? '#0891b2' : '#6b7280'} />
                        <Text style={[styles.unitChipText, sel && styles.unitChipTextSelected]}>Unit {u.unitNumber}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <Text style={styles.label}>Prospective Tenant Name *</Text>
              <TextInput
                value={bookingTenantName}
                onChangeText={setBookingTenantName}
                placeholder="e.g. Jordan Mitchell"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Phone Number *</Text>
                  <TextInput
                    value={bookingTenantPhone}
                    onChangeText={setBookingTenantPhone}
                    placeholder="9876543210"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Token Amount (₹) *</Text>
                  <TextInput
                    value={bookingTokenAmount}
                    onChangeText={setBookingTokenAmount}
                    placeholder="5000"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>

              <Text style={styles.label}>Expected Move-In Date (YYYY-MM-DD) *</Text>
              <TextInput
                value={bookingExpectedMoveIn}
                onChangeText={setBookingExpectedMoveIn}
                placeholder="2026-09-01"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />

              <Text style={styles.label}>Email Address (Optional)</Text>
              <TextInput
                value={bookingTenantEmail}
                onChangeText={setBookingTenantEmail}
                placeholder="tenant@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                style={styles.input}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsBookingModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateBooking} style={styles.submitBtn}>
                <LinearGradient colors={['#0891b2', '#0072ff']} style={styles.submitBtnInner}>
                  <MaterialIcons name="check" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Confirm Booking</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: Serve Notice ────────────────────────────────────────────── */}
      <Modal visible={isNoticeModalVisible} transparent animationType="fade" onRequestClose={() => setIsNoticeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[styles.modalCard, { maxWidth: 440 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalKicker, { color: '#dc2626' }]}>MOVE-OUT NOTICE</Text>
                <Text style={styles.modalTitle}>Serve Move-Out Notice</Text>
              </View>
              <TouchableOpacity onPress={() => setIsNoticeModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Expected Vacate Date (YYYY-MM-DD) *</Text>
              <TextInput
                value={noticeMoveOutDate}
                onChangeText={setNoticeMoveOutDate}
                placeholder="2026-09-30"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsNoticeModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleServeNotice} style={styles.submitBtn}>
                <LinearGradient colors={['#dc2626', '#ef4444']} style={styles.submitBtnInner}>
                  <MaterialIcons name="warning" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Serve Notice</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 3: Cash Token Payment ──────────────────────────────────────── */}
      <Modal visible={isCashModalVisible} transparent animationType="fade" onRequestClose={() => setIsCashModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[styles.modalCard, { maxWidth: 440 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>TOKEN COLLECTION</Text>
                <Text style={styles.modalTitle}>Record Cash Payment</Text>
              </View>
              <TouchableOpacity onPress={() => setIsCashModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Amount Collected (₹) *</Text>
              <TextInput
                value={cashAmount}
                onChangeText={setCashAmount}
                placeholder="5000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                style={styles.input}
              />
              <Text style={styles.label}>Receipt / Payment Notes</Text>
              <TextInput
                value={cashNote}
                onChangeText={setCashNote}
                placeholder="Handed in person / receipt #123"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsCashModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRecordCashToken} style={styles.submitBtn}>
                <LinearGradient colors={['#0891b2', '#0072ff']} style={styles.submitBtnInner}>
                  <MaterialIcons name="payments" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Record Payment</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 4: Convert to Lease ────────────────────────────────────────── */}
      <Modal visible={isConversionModalVisible} transparent animationType="fade" onRequestClose={() => setIsConversionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[styles.modalCard, { maxWidth: 480 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalKicker, { color: '#059669' }]}>LEASE ACTIVATION</Text>
                <Text style={styles.modalTitle}>Convert Booking to Active Lease</Text>
              </View>
              <TouchableOpacity onPress={() => setIsConversionModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Monthly Rent Amount (₹) *</Text>
              <TextInput
                value={convMonthlyRentAmount}
                onChangeText={setConvMonthlyRentAmount}
                placeholder="25000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                style={styles.input}
              />
              <Text style={styles.label}>Security Deposit (₹) *</Text>
              <TextInput
                value={convSecurityDeposit}
                onChangeText={setConvSecurityDeposit}
                placeholder="50000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsConversionModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConvertBookingToLease} style={styles.submitBtn}>
                <LinearGradient colors={['#059669', '#10b981']} style={styles.submitBtnInner}>
                  <MaterialIcons name="how-to-reg" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Activate Lease</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Lease Terms Modal */}
      <Modal visible={isEditTermsModalVisible} transparent animationType="fade" onRequestClose={() => setIsEditTermsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[styles.modalCard, { maxWidth: 440 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>LEASE TERMS</Text>
                <Text style={styles.modalTitle}>Edit Rent & Deposit</Text>
              </View>
              <TouchableOpacity onPress={() => setIsEditTermsModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {editingLease && (
                <View style={{ marginBottom: 14, padding: 12, backgroundColor: 'rgba(8,145,178,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(8,145,178,0.2)' }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0891b2' }}>
                    Unit {editingLease.unitNumber} • {editingLease.tenantName || 'Tenant'}
                  </Text>
                  {editingLease.tenantPhone ? (
                    <Text style={{ fontSize: 12, color: '#5b6b6d', marginTop: 2 }}>{editingLease.tenantPhone}</Text>
                  ) : null}
                </View>
              )}
              <Text style={styles.label}>Monthly Rent Amount (₹) *</Text>
              <TextInput
                value={editRentAmount}
                onChangeText={setEditRentAmount}
                placeholder="e.g. 15000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                style={styles.input}
              />
              <Text style={styles.label}>Security Deposit (₹) *</Text>
              <TextInput
                value={editSecurityDeposit}
                onChangeText={setEditSecurityDeposit}
                placeholder="e.g. 30000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setIsEditTermsModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveTerms} disabled={isSavingTerms} style={styles.submitBtn}>
                <LinearGradient colors={['#0891b2', '#0072ff']} style={styles.submitBtnInner}>
                  {isSavingTerms ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={18} color="#fff" />
                      <Text style={styles.submitBtnText}>Save Terms</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120, gap: 16 },
  scrollContentDesktop: { padding: 32, maxWidth: 1280, width: '100%', alignSelf: 'center' },

  desktopHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 4 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: '#0891b2', textTransform: 'uppercase' },
  propertyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(8,145,178,0.1)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  propertyBadgeText: { fontSize: 11, fontWeight: '800', color: '#0891b2' },
  title: { fontSize: 32, fontWeight: '800', color: '#0b1c30', lineHeight: 38, marginTop: 4 },
  subtitle: { fontSize: 15, color: '#5b6b6d', marginTop: 8, lineHeight: 22, maxWidth: 600 },
  headerActions: { flexDirection: 'row', gap: 10 },
  createBtnWrapper: { borderRadius: 14, overflow: 'hidden' },
  createBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: 8 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  propertySelectorBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  propertySelectorLabel: { fontSize: 12, fontWeight: '800', color: '#5b6b6d', textTransform: 'uppercase' },
  propPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
  },
  propPillActive: { borderColor: 'transparent' },
  propPillText: { fontSize: 12, fontWeight: '700', color: '#5b6b6d' },
  propPillTextActive: { color: '#fff', fontWeight: '800' },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statsRowDesktop: { flexWrap: 'nowrap' },
  statCard: {
    flex: 1, flexBasis: '46%', minHeight: 110, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.3)', padding: 16, overflow: 'hidden', gap: 3,
  },
  statCardDesktop: { flexBasis: 0 },
  statIconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: '900', fontFamily: 'Inter' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'Inter' },
  statHelper: { fontSize: 11, color: '#9ca3af', marginTop: 1, fontFamily: 'Inter' },

  tabBar: { flexDirection: 'row', gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    height: 40, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', overflow: 'hidden',
  },
  tabActive: { borderWidth: 0 },
  tabText: { fontSize: 13, fontWeight: '700', color: '#5b6b6d' },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  tabBadge: { backgroundColor: 'rgba(0,0,0,0.06)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText: { fontSize: 11, fontWeight: '800', color: '#5b6b6d' },
  tabBadgeTextActive: { color: '#fff' },

  searchBar: {
    height: 46, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', paddingHorizontal: 14, gap: 10,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#0b1c30',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },

  panel: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden', padding: 16 },
  listContainer: { gap: 12 },

  leaseCard: {
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.4)', overflow: 'hidden',
  },
  leaseCardAlert: { borderColor: 'rgba(220,38,38,0.25)' },
  alertStripe: { height: 3 },
  leaseCardInner: { flexDirection: 'row', padding: 16, gap: 14, alignItems: 'flex-start' },
  tenantAvatarCircle: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(8,145,178,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  tenantAvatarText: { fontSize: 14, fontWeight: '800', color: '#0891b2' },
  leaseMainInfo: { flex: 1, gap: 4 },
  leaseTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  unitBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(8,145,178,0.08)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  unitBadgeText: { fontSize: 11, fontWeight: '800', color: '#0891b2' },
  tenantName: { fontSize: 16, fontWeight: '800', color: '#0b1c30' },
  tenantContact: { fontSize: 12, color: '#6b7280' },

  leaseDetailsRow: { flexDirection: 'row', gap: 18, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
  detailItem: { gap: 2 },
  detailLabel: { fontSize: 9, fontWeight: '800', color: '#9ca3af', letterSpacing: 0.8 },
  detailValue: { fontSize: 14, fontWeight: '800', color: '#0b1c30' },
  detailValueSecondary: { fontSize: 13, fontWeight: '600', color: '#374151' },

  leaseActionsCol: { gap: 8, alignItems: 'flex-end', justifyContent: 'center' },
  actionBtnPrimary: { borderRadius: 10, overflow: 'hidden' },
  actionBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  actionBtnTextPrimary: { color: '#fff', fontSize: 12, fontWeight: '800' },
  actionBtnOutline: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: '#0891b2', backgroundColor: 'rgba(8,145,178,0.05)',
  },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: '#0891b2' },
  actionBtnOutlineDanger: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)',
  },
  actionBtnTextDanger: { fontSize: 11, fontWeight: '700', color: '#ef4444' },
  actionBtnTextBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  forfeitText: { fontSize: 11, fontWeight: '700', color: '#dc2626' },
  refundText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },

  emptyState: { padding: 48, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0b1c30' },
  emptySubtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', maxWidth: 400, lineHeight: 19 },
  loadingBox: { padding: 48, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: {
    width: '100%', maxWidth: 540, maxHeight: '90%',
    backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 10,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalKicker: { fontSize: 10, fontWeight: '800', color: '#0891b2', letterSpacing: 1 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0b1c30', marginTop: 2 },
  closeBtn: { padding: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  modalBody: { paddingHorizontal: 24, paddingVertical: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#0b1c30' },
  twoCol: { flexDirection: 'row', gap: 12 },
  unitChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  unitChipSelected: { borderColor: '#0891b2', backgroundColor: 'rgba(8,145,178,0.08)' },
  unitChipText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  unitChipTextSelected: { color: '#0891b2', fontWeight: '800' },
  modalFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#fafafa' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  submitBtn: { borderRadius: 12, overflow: 'hidden' },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12 },
  submitBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Pagination Controls
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    flexWrap: 'wrap',
    gap: 12,
  },
  paginationInfo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    fontFamily: 'Inter',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(8,145,178,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(8,145,178,0.2)',
  },
  pageBtnDisabled: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderColor: 'rgba(0,0,0,0.06)',
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0891b2',
    fontFamily: 'Inter',
  },
  pageBtnTextDisabled: {
    color: '#9ca3af',
  },
  pageNumberPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  pageNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0b1c30',
    fontFamily: 'Inter',
  },
});
