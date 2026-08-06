import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
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

import {
  listActiveLeasesByProperty,
  createLease,
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

// ─── Status config for local UI fallback ───────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string;
  bg: string;
  fg: string;
  dotColor: string;
  icon: string;
}> = {
  ACTIVE:      { label: 'Active',          bg: 'rgba(5,150,105,0.12)',   fg: '#059669', dotColor: '#10b981', icon: 'check-circle'      },
  UPCOMING:    { label: 'Upcoming',         bg: 'rgba(99,102,241,0.12)', fg: '#4f46e5', dotColor: '#6366f1', icon: 'schedule'          },
  ENDING_SOON: { label: 'Notice Served',   bg: 'rgba(220,38,38,0.1)',   fg: '#dc2626', dotColor: '#ef4444', icon: 'warning-amber'     },
  ENDED:       { label: 'Ended',            bg: 'rgba(107,114,128,0.12)',fg: '#6b7280', dotColor: '#9ca3af', icon: 'check-circle-outline'},
  BOOKED:      { label: 'Booked',           bg: 'rgba(245,158,11,0.12)', fg: '#d97706', dotColor: '#f59e0b', icon: 'bookmark-border'      },
  CONVERTED:   { label: 'Converted',        bg: 'rgba(16,185,129,0.12)', fg: '#059669', dotColor: '#10b981', icon: 'check-circle'         },
  FORFEITED:   { label: 'Forfeited',        bg: 'rgba(239,68,68,0.12)',  fg: '#dc2626', dotColor: '#ef4444', icon: 'block'                 },
  REFUNDED:    { label: 'Refunded',         bg: 'rgba(107,114,128,0.12)',fg: '#6b7280', dotColor: '#9ca3af', icon: 'undo'                  },
};

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

  // Modal Visibility States
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isNoticeModalVisible, setIsNoticeModalVisible] = useState(false);
  const [isCashModalVisible, setIsCashModalVisible] = useState(false);
  const [isConversionModalVisible, setIsConversionModalVisible] = useState(false);

  // Selected Item States for Actions
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Form Field States
  // 1. Notice form
  const [noticeMoveOutDate, setNoticeMoveOutDate] = useState('');
  // 2. Cash payment form
  const [cashAmount, setCashAmount] = useState('');
  const [cashNote, setCashNote] = useState('');
  // 3. New booking form
  const [bookingUnitId, setBookingUnitId] = useState('');
  const [bookingTenantName, setBookingTenantName] = useState('');
  const [bookingTenantPhone, setBookingTenantPhone] = useState('');
  const [bookingTenantEmail, setBookingTenantEmail] = useState('');
  const [bookingTokenAmount, setBookingTokenAmount] = useState('');
  const [bookingExpectedMoveIn, setBookingExpectedMoveIn] = useState('');
  // 4. Lease conversion form
  const [convSecurityDeposit, setConvSecurityDeposit] = useState('');
  const [convSplitStrategy, setConvSplitStrategy] = useState<'FULL_UNIT' | 'PER_OCCUPANT' | 'CUSTOM'>('FULL_UNIT');

  // Initialize selected property
  useEffect(() => {
    if (properties && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  // Load screen data from backend APIs
  const loadScreenData = useCallback(async () => {
    if (!accessToken || !selectedPropertyId) return;

    try {
      setIsLoadingData(true);
      const [leasesData, bookingsData, vacatingData, allUnits] = await Promise.all([
        listActiveLeasesByProperty(selectedPropertyId, accessToken),
        listUnitBookings(accessToken),
        getVacatingUnits(selectedPropertyId, accessToken),
        getAllFloorsLayout(selectedPropertyId, accessToken).catch(() => []),
      ]);

      setLeases(leasesData || []);
      setBookings(bookingsData || []);
      setVacatingUnits(vacatingData || []);
      setAvailableUnits(allUnits || []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to sync data with the server', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [accessToken, selectedPropertyId, showToast]);

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

      showToast('Bed/Room booked successfully.', 'success');
      setIsBookingModalVisible(false);
      // Reset form
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
      showToast('Online token payment transaction initiated.', 'success');
      loadScreenData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to initiate online payment.', 'error');
    }
  };

  const handleForfeitBooking = async (bookingId: string) => {
    if (!accessToken) return;
    try {
      await forfeitUnitBooking(bookingId, accessToken);
      showToast('Booking token forfeited successfully.', 'success');
      loadScreenData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to forfeit token.', 'error');
    }
  };

  const handleRefundBooking = async (bookingId: string) => {
    if (!accessToken) return;
    try {
      await refundUnitBooking(bookingId, accessToken);
      showToast('Booking token refunded successfully.', 'success');
      loadScreenData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to refund token.', 'error');
    }
  };

  const handleConvertBookingToLease = async () => {
    if (!selectedBookingId || !convSecurityDeposit || !accessToken) {
      showToast('Please specify the security deposit amount.', 'error');
      return;
    }
    const booking = bookings.find((b) => b.id === selectedBookingId);
    if (!booking) return;

    try {
      await createLease({
        unitId: booking.unitId,
        securityDeposit: parseFloat(convSecurityDeposit),
        splitStrategy: convSplitStrategy,
        moveInDate: booking.expectedMoveInDate,
        bookingId: booking.id,
      }, accessToken);

      showToast('Converted prospective tenant to active lease!', 'success');
      setIsConversionModalVisible(false);
      setSelectedBookingId(null);
      setConvSecurityDeposit('');
      loadScreenData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to convert to active lease.', 'error');
    }
  };

  // ─── Rendering Helpers ───────────────────────────────────────────────────────
  const filteredLeases = useMemo(() => {
    if (!Array.isArray(leases)) return [];
    return leases.filter((lease) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = `${lease.unitNumber || ''} ${lease.tenantName || ''} ${lease.tenantPhone || ''}`
        .toLowerCase()
        .includes(q);
      return matchesSearch;
    });
  }, [leases, searchQuery]);

  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    return bookings.filter((b) => {
      const q = searchQuery.toLowerCase();
      return `${b.unitNumber || ''} ${b.prospectiveTenantName || ''} ${b.prospectiveTenantPhone || ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [bookings, searchQuery]);

  const openInventory = (lease: LeaseResponse) => {
    const tab = lease.moveOutDate ? 'moveOut' : 'moveIn';
    router.push(`/inventory?tab=${tab}&leaseId=${lease.id}`);
  };

  if (isPropsLoading || isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.Colors.primary} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={Theme.Colors.backgroundGradient as [string, string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {isDesktop && <DesktopNavBar title="Lease Operations" />}

        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop ? styles.scrollContentDesktop : { paddingTop: 88 },
          ]}
        >
          {/* Header Section */}
          <View style={styles.desktopHeader}>
            <View>
              <Text style={styles.kicker}>TENANCY MANAGEMENT</Text>
              <Text style={styles.title}>Lease & Bookings Registry</Text>
              <Text style={styles.subtitle}>
                Manage active leases, serve move-out notice, book rooms, and convert prospective clients to tenants.
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

          {/* Property Selector */}
          <View style={styles.propertySelector}>
            <Text style={styles.propertyLabel}>Active Property:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {properties.map((p) => {
                const active = p.id === selectedPropertyId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setSelectedPropertyId(p.id)}
                    style={[styles.propPill, active && styles.propPillActive]}
                  >
                    <Text style={[styles.propPillText, active && styles.propPillTextActive]}>{p.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Tabs Segmented Control */}
          <View style={styles.tabContainer}>
            {(['leases', 'bookings', 'vacancies'] as const).map((tab) => {
              const active = activeTab === tab;
              const label = tab === 'leases' ? 'Lease Registry' : tab === 'bookings' ? 'Pending Bookings' : 'Notice Periods & Vacancies';
              const icon = tab === 'leases' ? 'vpn-key' : tab === 'bookings' ? 'bookmark' : 'door-sliding';
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                >
                  <MaterialIcons name={icon} size={18} color={active ? Theme.Colors.primary : '#5b6b6d'} />
                  <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={18} color="#849495" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search by unit number, name, phone..."
              placeholderTextColor="#a0aab2"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, ...Theme.Typography.bodyMd, color: Theme.Colors.onBackground }}
            />
          </View>

          {/* Tab content area */}
          <BlurView intensity={65} tint="light" style={styles.panel}>
            {activeTab === 'leases' && (
              <View style={styles.listSection}>
                {filteredLeases.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="vpn-key" size={48} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No active leases</Text>
                  </View>
                ) : (
                  filteredLeases.map((l) => (
                    <View key={l.id} style={styles.listItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>Unit {l.unitNumber} · {l.tenantName || 'Potential Tenant'}</Text>
                        <Text style={styles.itemSub}>{l.tenantPhone || 'No Phone'} · Rent: ₹{l.rentAmount?.toLocaleString()}</Text>
                        <Text style={styles.itemMeta}>Move-in: {l.moveInDate} {l.moveOutDate ? `· Expected Vacate: ${l.moveOutDate}` : ''}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <TouchableOpacity
                          style={styles.outlineActionBtn}
                          onPress={() => openInventory(l)}
                        >
                          <MaterialIcons name="assignment" size={16} color={Theme.Colors.primary} />
                          <Text style={styles.outlineActionText}>Inventory</Text>
                        </TouchableOpacity>

                        {!l.moveOutDate && (
                          <TouchableOpacity
                            style={[styles.outlineActionBtn, { borderColor: '#ef4444' }]}
                            onPress={() => {
                              setSelectedLeaseId(l.id);
                              setIsNoticeModalVisible(true);
                            }}
                          >
                            <MaterialIcons name="warning" size={16} color="#ef4444" />
                            <Text style={[styles.outlineActionText, { color: '#ef4444' }]}>Serve Notice</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === 'bookings' && (
              <View style={styles.listSection}>
                {filteredBookings.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="bookmark-border" size={48} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No pending bookings</Text>
                  </View>
                ) : (
                  filteredBookings.map((b) => (
                    <View key={b.id} style={styles.listItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>Unit {b.unitNumber} · {b.prospectiveTenantName}</Text>
                        <Text style={styles.itemSub}>{b.prospectiveTenantPhone} · Token: ₹{b.tokenAmount?.toLocaleString()}</Text>
                        <Text style={styles.itemMeta}>Expected Move-in: {b.expectedMoveInDate} · Status: <StatusPill status={b.status} /></Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {b.status === 'BOOKED' && !b.paymentTransactionId && (
                          <>
                            <TouchableOpacity
                              style={styles.outlineActionBtn}
                              onPress={() => {
                                setSelectedBookingId(b.id);
                                setIsCashModalVisible(true);
                              }}
                            >
                              <MaterialIcons name="payments" size={16} color={Theme.Colors.primary} />
                              <Text style={styles.outlineActionText}>Cash Token</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.outlineActionBtn}
                              onPress={() => handleOnlineTokenPayment(b.id)}
                            >
                              <MaterialIcons name="link" size={16} color={Theme.Colors.primary} />
                              <Text style={styles.outlineActionText}>Online Pay</Text>
                            </TouchableOpacity>
                          </>
                        )}

                        {b.status === 'BOOKED' && b.paymentTransactionId && (
                          <TouchableOpacity
                            style={[styles.outlineActionBtn, { borderColor: '#10b981' }]}
                            onPress={() => {
                              setSelectedBookingId(b.id);
                              setIsConversionModalVisible(true);
                            }}
                          >
                            <MaterialIcons name="check" size={16} color="#10b981" />
                            <Text style={[styles.outlineActionText, { color: '#10b981' }]}>Convert to Lease</Text>
                          </TouchableOpacity>
                        )}

                        {b.status === 'BOOKED' && (
                          <>
                            <TouchableOpacity
                              style={[styles.outlineActionBtn, { borderColor: '#ef4444' }]}
                              onPress={() => handleForfeitBooking(b.id)}
                            >
                              <Text style={[styles.outlineActionText, { color: '#ef4444' }]}>Forfeit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.outlineActionBtn, { borderColor: '#6b7280' }]}
                              onPress={() => handleRefundBooking(b.id)}
                            >
                              <Text style={[styles.outlineActionText, { color: '#6b7280' }]}>Refund</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === 'vacancies' && (
              <View style={styles.listSection}>
                {vacatingUnits.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="door-sliding" size={48} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No vacating units or notices reported</Text>
                  </View>
                ) : (
                  vacatingUnits.map((v) => (
                    <View key={v.id} style={styles.listItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>Unit {v.unitNumber}</Text>
                        <Text style={styles.itemSub}>Capacity: {v.capacity} beds</Text>
                        {v.activeLeases && v.activeLeases.length > 0 ? (
                          v.activeLeases.map((lease: any, idx: number) => (
                            <Text key={idx} style={styles.itemMeta}>
                              Occupant: {lease.tenantName} · Move-out Date: {lease.moveOutDate || 'No notice served'}
                            </Text>
                          ))
                        ) : (
                          <Text style={styles.itemMeta}>Status: Available immediately</Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </BlurView>
        </ScrollView>
      </SafeAreaView>

      {/* ─── MODAL 1: Book Room (New Booking) ─── */}
      <Modal visible={isBookingModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={70} tint="light" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book Unit/Bed</Text>
            <ScrollView style={{ maxHeight: 400, width: '100%' }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalInputLabel}>Select Unit Number *</Text>
              <View style={styles.pickerContainer}>
                {availableUnits.map((u) => {
                  const active = u.id === bookingUnitId;
                  return (
                    <TouchableOpacity
                      key={u.id}
                      onPress={() => setBookingUnitId(u.id)}
                      style={[styles.modalUnitPill, active && styles.modalUnitPillActive]}
                    >
                      <Text style={[styles.modalUnitPillText, active && styles.modalUnitPillTextActive]}>
                        Unit {u.unitNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.modalInputLabel}>Prospective Tenant Name *</Text>
              <TextInput
                value={bookingTenantName}
                onChangeText={setBookingTenantName}
                placeholder="e.g. Ritik Katiyar"
                placeholderTextColor="#9ca3af"
                style={styles.modalInput}
              />

              <Text style={styles.modalInputLabel}>Tenant Phone (10 digits) *</Text>
              <TextInput
                value={bookingTenantPhone}
                onChangeText={setBookingTenantPhone}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
                placeholderTextColor="#9ca3af"
                style={styles.modalInput}
              />

              <Text style={styles.modalInputLabel}>Tenant Email Address (Optional)</Text>
              <TextInput
                value={bookingTenantEmail}
                onChangeText={setBookingTenantEmail}
                placeholder="e.g. ritik@gmail.com"
                keyboardType="email-address"
                placeholderTextColor="#9ca3af"
                style={styles.modalInput}
              />

              <Text style={styles.modalInputLabel}>Token Amount *</Text>
              <TextInput
                value={bookingTokenAmount}
                onChangeText={setBookingTokenAmount}
                placeholder="e.g. 5000"
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
                style={styles.modalInput}
              />

              <Text style={styles.modalInputLabel}>Expected Move-in Date *</Text>
              <TextInput
                value={bookingExpectedMoveIn}
                onChangeText={setBookingExpectedMoveIn}
                style={styles.modalInput}
                {...({ type: 'date' } as any)}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsBookingModalVisible(false)}
                style={[styles.modalBtn, styles.modalBtnCancel]}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateBooking}
                style={[styles.modalBtn, styles.modalBtnConfirm]}
              >
                <Text style={styles.modalBtnConfirmText}>Book Room</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* ─── MODAL 2: Serve Move-Out Notice ─── */}
      <Modal visible={isNoticeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={70} tint="light" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Serve Move-Out Notice</Text>
            <Text style={styles.modalInputLabel}>Specify Move-Out Date *</Text>
            <TextInput
              value={noticeMoveOutDate}
              onChangeText={setNoticeMoveOutDate}
              style={styles.modalInput}
              {...({ type: 'date' } as any)}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setIsNoticeModalVisible(false);
                  setSelectedLeaseId(null);
                }}
                style={[styles.modalBtn, styles.modalBtnCancel]}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleServeNotice}
                style={[styles.modalBtn, styles.modalBtnConfirm, { backgroundColor: '#ef4444' }]}
              >
                <Text style={styles.modalBtnConfirmText}>Serve Notice</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* ─── MODAL 3: Record Cash Token ─── */}
      <Modal visible={isCashModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={70} tint="light" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Cash Token</Text>
            <Text style={styles.modalInputLabel}>Amount Paid *</Text>
            <TextInput
              value={cashAmount}
              onChangeText={setCashAmount}
              placeholder="e.g. 5000"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
            />

            <Text style={styles.modalInputLabel}>Note/Description</Text>
            <TextInput
              value={cashNote}
              onChangeText={setCashNote}
              placeholder="e.g. Token paid in cash"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setIsCashModalVisible(false);
                  setSelectedBookingId(null);
                }}
                style={[styles.modalBtn, styles.modalBtnCancel]}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRecordCashToken}
                style={[styles.modalBtn, styles.modalBtnConfirm]}
              >
                <Text style={styles.modalBtnConfirmText}>Record Payment</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* ─── MODAL 4: Convert to Active Lease ─── */}
      <Modal visible={isConversionModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={70} tint="light" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Convert Booking to Active Lease</Text>

            <Text style={styles.modalInputLabel}>Security Deposit Amount *</Text>
            <TextInput
              value={convSecurityDeposit}
              onChangeText={setConvSecurityDeposit}
              placeholder="e.g. 10000"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
            />

            <Text style={styles.modalInputLabel}>Rent Split Strategy *</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
              {(['FULL_UNIT', 'PER_OCCUPANT', 'CUSTOM'] as const).map((strategy) => {
                const active = convSplitStrategy === strategy;
                return (
                  <TouchableOpacity
                    key={strategy}
                    onPress={() => setConvSplitStrategy(strategy)}
                    style={[styles.modalUnitPill, active && styles.modalUnitPillActive]}
                  >
                    <Text style={[styles.modalUnitPillText, active && styles.modalUnitPillTextActive]}>
                      {strategy.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setIsConversionModalVisible(false);
                  setSelectedBookingId(null);
                }}
                style={[styles.modalBtn, styles.modalBtnCancel]}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConvertBookingToLease}
                style={[styles.modalBtn, styles.modalBtnConfirm]}
              >
                <Text style={styles.modalBtnConfirmText}>Convert Now</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120, gap: 18 },
  scrollContentDesktop: { padding: 32, maxWidth: 1280, width: '100%', alignSelf: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  desktopHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, marginBottom: 4 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: '#0891b2', marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '800', color: '#0b1c30', lineHeight: 36 },
  subtitle: { fontSize: 14, color: '#5b6b6d', marginTop: 8, lineHeight: 22, maxWidth: 650 },

  headerActions: { flexDirection: 'row', gap: 10 },
  createBtnWrapper: { borderRadius: 14, overflow: 'hidden' },
  createBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  propertySelector: { marginVertical: 8 },
  propertyLabel: { ...Theme.Typography.labelCaps, color: Theme.Colors.outline, marginBottom: 8 },
  propPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.6)', borderWidth: 1, borderColor: '#e2e8f0' },
  propPillActive: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },
  propPillText: { ...Theme.Typography.bodyMd, color: Theme.Colors.onSurfaceVariant },
  propPillTextActive: { color: '#fff', fontWeight: 'bold' },

  tabContainer: { flexDirection: 'row', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.5)', padding: 4, gap: 4 },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6, borderRadius: 10 },
  tabButtonActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 1 },
  tabButtonText: { ...Theme.Typography.bodyMd, color: '#5b6b6d', fontWeight: '500' },
  tabButtonTextActive: { color: Theme.Colors.primary, fontWeight: '700' },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e2e8f0' },

  panel: { borderRadius: 20, overflow: 'hidden', padding: 16, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)' },
  listSection: { gap: 12 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  itemTitle: { ...Theme.Typography.bodyLg, fontWeight: '700', color: Theme.Colors.onBackground },
  itemSub: { ...Theme.Typography.bodyMd, color: Theme.Colors.onSurfaceVariant, marginTop: 2 },
  itemMeta: { ...Theme.Typography.labelMuted, color: Theme.Colors.outline, marginTop: 4 },

  outlineActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Theme.Colors.primary },
  outlineActionText: { ...Theme.Typography.labelCaps, color: Theme.Colors.primary, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { ...Theme.Typography.bodyLg, color: Theme.Colors.outline, fontWeight: '600' },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.3)', padding: 20 },
  modalContent: { width: '100%', maxWidth: 500, borderRadius: 24, overflow: 'hidden', padding: 24, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.8)' },
  modalTitle: { ...Theme.Typography.headlineMd, fontWeight: '800', color: '#0b1c30', marginBottom: 16 },
  modalInputLabel: { ...Theme.Typography.labelCaps, color: '#5b6b6d', marginTop: 12, marginBottom: 6 },
  modalInput: { width: '100%', padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', ...Theme.Typography.bodyMd, color: '#0f172a' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#f1f5f9' },
  modalBtnCancelText: { ...Theme.Typography.bodyMd, color: '#475569', fontWeight: '700' },
  modalBtnConfirm: { backgroundColor: Theme.Colors.primary },
  modalBtnConfirmText: { ...Theme.Typography.bodyMd, color: '#fff', fontWeight: '700' },

  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  modalUnitPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  modalUnitPillActive: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },
  modalUnitPillText: { ...Theme.Typography.bodyMd, color: '#475569' },
  modalUnitPillTextActive: { color: '#fff', fontWeight: 'bold' },
});
