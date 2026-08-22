import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { formatCurrency, formatCompactCurrency } from '@/src/utils/formatters';
import { PropertySelector } from '@/src/components/common/display/PropertySelector';
import { createStyles } from './OwnerLeasesScreen.styles';
import { useOwnerLeases } from '../hooks/useOwnerLeases';
import {
  BookRoomModal, ServeNoticeModal, CashTokenModal,
  ConvertToLeaseModal, EditLeaseTermsModal,
} from '../components/LeaseModals';
import { LeaseResponse } from '@/src/features/tenant/api/lease.api';
import { UnitBookingResponse } from '@/src/features/leases/api/unitBooking.api';
import { useRouter } from 'expo-router';

export default function OwnerLeasesScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { handleScroll } = useScrollNav();

  const data = useOwnerLeases();
  const {
    properties, selectedPropertyId, setSelectedPropertyId,
    activeTab, setActiveTab, searchQuery, setSearchQuery,
    filteredLeases, filteredBookings, vacatingUnits, availableUnits,
    isLoadingData, currentLeasesPage, setCurrentLeasesPage,
    totalLeasesElements, totalLeasesPages,
    isBookingModalVisible, setIsBookingModalVisible,
    isNoticeModalVisible, setIsNoticeModalVisible,
    isCashModalVisible, setIsCashModalVisible,
    isConversionModalVisible, setIsConversionModalVisible,
    isEditTermsModalVisible, setIsEditTermsModalVisible,
    selectedBookingId, setSelectedBookingId,
    setSelectedLeaseId,
    editingLease, isSavingTerms,
    noticeMoveOutDate, setNoticeMoveOutDate,
    cashAmount, setCashAmount, cashNote, setCashNote,
    bookingUnitId, setBookingUnitId,
    bookingTenantName, setBookingTenantName,
    bookingTenantPhone, setBookingTenantPhone,
    bookingTenantEmail, setBookingTenantEmail,
    bookingTokenAmount, setBookingTokenAmount,
    bookingExpectedMoveIn, setBookingExpectedMoveIn,
    convMonthlyRentAmount, setConvMonthlyRentAmount,
    convSecurityDeposit, setConvSecurityDeposit,
    editRentAmount, setEditRentAmount,
    editSecurityDeposit, setEditSecurityDeposit,
    handleServeNotice, handleCreateBooking, handleRecordCashToken,
    handleOnlineTokenPayment, handleForfeitBooking, handleRefundBooking,
    handleConvertBookingToLease, handleOpenEditTerms, handleSaveTerms,
  } = data;

  const STAT_GRAD: [string, string][] = React.useMemo(() => [
    [theme.Colors.primary, '#06b6d4'],
    [theme.Colors.error, '#ef4444'],
    [theme.Colors.secondary, '#7c3aed'],
    [theme.Colors.primary, '#10b981'],
  ], [theme]);
  const STAT_COLORS = React.useMemo(() => [
    theme.Colors.primary, theme.Colors.error, theme.Colors.secondary, theme.Colors.primary,
  ], [theme]);

  const totalRentRoll = filteredLeases.reduce((sum, l) => sum + (Number(l.monthlyRentAmount) || 0), 0);
  const noticeCount = filteredLeases.filter((l) => Boolean(l.moveOutDate)).length;
  const pendingBookingsCount = filteredBookings.filter((b) => b.status === 'BOOKED').length;
  const activeLeasesDisplayCount = totalLeasesElements > 0 ? totalLeasesElements : filteredLeases.length;
  const currentPropertyName = properties.find(p => p.id === selectedPropertyId)?.name || 'All Properties';

  const stats = [
    { label: 'Active Leases', value: String(activeLeasesDisplayCount), helper: `${properties.find(p => p.id === selectedPropertyId)?.name || 'Property'} units`, icon: 'vpn-key' as const },
    { label: 'Notices Served', value: String(noticeCount).padStart(2, '0'), helper: 'Vacating soon', icon: 'warning-amber' as const },
    { label: 'Pending Bookings', value: String(pendingBookingsCount).padStart(2, '0'), helper: 'Tokens received', icon: 'bookmark' as const },
    { label: 'Monthly Rent Roll', value: formatCompactCurrency(totalRentRoll), helper: 'Contracted revenue', icon: 'calculate' as const },
  ];
  const TABS = [
    { id: 'leases' as const, label: 'Lease Registry', icon: 'vpn-key' as const, count: activeLeasesDisplayCount },
    { id: 'bookings' as const, label: 'Pending Bookings', icon: 'bookmark' as const, count: filteredBookings.length },
    { id: 'vacancies' as const, label: 'Vacating & Notices', icon: 'door-sliding' as const, count: vacatingUnits.length },
  ];

  const openInventory = (lease: LeaseResponse) => {
    const tab = lease.moveOutDate ? 'moveOut' : 'moveIn';
    router.push(`/inventory?tab=${tab}&leaseId=${lease.id}`);
  };

  return (
    <LinearGradient
      colors={theme.Colors.backgroundGradient as [string, string, string]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {isDesktop && (
          <DesktopNavBar title="Lease Operations" properties={properties || []} selectedPropertyId={selectedPropertyId} onPropertyChange={setSelectedPropertyId} />
        )}
        <ScrollView
          onScroll={handleScroll} scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isDesktop ? styles.scrollContentDesktop : { paddingTop: 88 }]}
        >
          {/* Header */}
          <View style={styles.desktopHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>TENANCY MANAGEMENT</Text>
              <Text style={styles.title}>Leases & Bookings</Text>
              <Text style={styles.subtitle}>Manage active tenancies, notice periods, unit bookings, and move-in/out inventory.</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.createBtnWrapper} onPress={() => setIsBookingModalVisible(true)} activeOpacity={0.82}>
                <LinearGradient colors={[theme.Colors.primary, '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtn}>
                  <MaterialIcons name="bookmark-add" size={18} color={theme.Colors.surfaceContainerLowest} />
                  <Text style={styles.createBtnText}>Book Room</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {!isDesktop && properties.length > 0 && (
            <PropertySelector properties={properties} selectedPropertyId={selectedPropertyId} onSelectProperty={setSelectedPropertyId} />
          )}

          {/* Stats */}
          <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
            {stats.map((stat, i) => (
              <BlurView key={stat.label} intensity={55} tint={isDark ? 'dark' : 'light'} style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
                <LinearGradient colors={STAT_GRAD[i]} style={styles.statIconCircle}>
                  <MaterialIcons name={stat.icon as any} size={18} color={theme.Colors.surfaceContainerLowest} />
                </LinearGradient>
                <Text style={[styles.statValue, { color: STAT_COLORS[i] }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statHelper}>{stat.helper}</Text>
              </BlurView>
            ))}
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            {TABS.map((t) => {
              const active = activeTab === t.id;
              return (
                <TouchableOpacity key={t.id} style={[styles.tab, active && styles.tabActive]} onPress={() => setActiveTab(t.id)} activeOpacity={0.8}>
                  {active && (
                    <LinearGradient
                      colors={t.id === 'vacancies' ? [theme.Colors.error, '#ef4444'] : [theme.Colors.primary, '#0072ff']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  )}
                  <MaterialIcons name={t.icon} size={16} color={active ? '#fff' : theme.Colors.onSurfaceVariant} />
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                  <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{t.count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Search */}
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
            <TextInput
              placeholder="Search by tenant name, unit number, phone, status..."
              placeholderTextColor={theme.Colors.onSurfaceVariant}
              value={searchQuery} onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={16} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>

          {/* Main Panel */}
          <BlurView intensity={65} tint={isDark ? 'dark' : 'light'} style={styles.panel}>
            {isLoadingData ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={theme.Colors.primary} />
                <Text style={styles.loadingText}>Syncing lease records...</Text>
              </View>
            ) : activeTab === 'leases' ? (
              <LeasesTab
                filteredLeases={filteredLeases} isDark={isDark}
                styles={styles} theme={theme}
                currentLeasesPage={currentLeasesPage} setCurrentLeasesPage={setCurrentLeasesPage}
                totalLeasesPages={totalLeasesPages} totalLeasesElements={totalLeasesElements}
                onEditTerms={handleOpenEditTerms}
                onInventory={openInventory}
                onServeNotice={(id: string) => { setSelectedLeaseId(id); setIsNoticeModalVisible(true); }}
              />
            ) : activeTab === 'bookings' ? (
              <BookingsTab
                filteredBookings={filteredBookings} isDark={isDark}
                styles={styles} theme={theme}
                onCashToken={(id: string) => { setSelectedBookingId(id); setIsCashModalVisible(true); }}
                onOnlinePay={handleOnlineTokenPayment}
                onConvert={(id: string) => { setSelectedBookingId(id); setIsConversionModalVisible(true); }}
                onForfeit={handleForfeitBooking}
                onRefund={handleRefundBooking}
              />
            ) : (
              <VacanciesTab
                vacatingUnits={vacatingUnits} isDark={isDark}
                styles={styles} theme={theme} currentPropertyName={currentPropertyName}
              />
            )}
          </BlurView>

          {/* Pagination (leases tab) */}
          {activeTab === 'leases' && totalLeasesPages > 1 && (
            <View style={styles.paginationBar}>
              <Text style={styles.paginationInfo}>Showing {currentLeasesPage * 20 + 1}–{Math.min((currentLeasesPage + 1) * 20, totalLeasesElements)} of {totalLeasesElements} leases</Text>
              <View style={styles.paginationControls}>
                <TouchableOpacity disabled={currentLeasesPage === 0} onPress={() => setCurrentLeasesPage(p => Math.max(0, p - 1))} style={[styles.pageBtn, currentLeasesPage === 0 && styles.pageBtnDisabled]}>
                  <MaterialIcons name="chevron-left" size={18} color={currentLeasesPage === 0 ? '#9ca3af' : theme.Colors.primary} />
                  <Text style={[styles.pageBtnText, currentLeasesPage === 0 && styles.pageBtnTextDisabled]}>Previous</Text>
                </TouchableOpacity>
                <View style={styles.pageNumberPill}><Text style={styles.pageNumberText}>Page {currentLeasesPage + 1} of {totalLeasesPages}</Text></View>
                <TouchableOpacity disabled={currentLeasesPage >= totalLeasesPages - 1} onPress={() => setCurrentLeasesPage(p => Math.min(totalLeasesPages - 1, p + 1))} style={[styles.pageBtn, currentLeasesPage >= totalLeasesPages - 1 && styles.pageBtnDisabled]}>
                  <Text style={[styles.pageBtnText, currentLeasesPage >= totalLeasesPages - 1 && styles.pageBtnTextDisabled]}>Next</Text>
                  <MaterialIcons name="chevron-right" size={18} color={currentLeasesPage >= totalLeasesPages - 1 ? '#9ca3af' : theme.Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      <BookRoomModal
        visible={isBookingModalVisible} onClose={() => setIsBookingModalVisible(false)}
        availableUnits={availableUnits}
        bookingUnitId={bookingUnitId} setBookingUnitId={setBookingUnitId}
        bookingTenantName={bookingTenantName} setBookingTenantName={setBookingTenantName}
        bookingTenantPhone={bookingTenantPhone} setBookingTenantPhone={setBookingTenantPhone}
        bookingTenantEmail={bookingTenantEmail} setBookingTenantEmail={setBookingTenantEmail}
        bookingTokenAmount={bookingTokenAmount} setBookingTokenAmount={setBookingTokenAmount}
        bookingExpectedMoveIn={bookingExpectedMoveIn} setBookingExpectedMoveIn={setBookingExpectedMoveIn}
        onSubmit={handleCreateBooking}
      />
      <ServeNoticeModal
        visible={isNoticeModalVisible} onClose={() => setIsNoticeModalVisible(false)}
        noticeMoveOutDate={noticeMoveOutDate} setNoticeMoveOutDate={setNoticeMoveOutDate}
        onSubmit={handleServeNotice}
      />
      <CashTokenModal
        visible={isCashModalVisible} onClose={() => setIsCashModalVisible(false)}
        cashAmount={cashAmount} setCashAmount={setCashAmount}
        cashNote={cashNote} setCashNote={setCashNote}
        onSubmit={handleRecordCashToken}
      />
      <ConvertToLeaseModal
        visible={isConversionModalVisible} onClose={() => setIsConversionModalVisible(false)}
        convMonthlyRentAmount={convMonthlyRentAmount} setConvMonthlyRentAmount={setConvMonthlyRentAmount}
        convSecurityDeposit={convSecurityDeposit} setConvSecurityDeposit={setConvSecurityDeposit}
        onSubmit={handleConvertBookingToLease}
      />
      <EditLeaseTermsModal
        visible={isEditTermsModalVisible} onClose={() => setIsEditTermsModalVisible(false)}
        editingLease={editingLease}
        editRentAmount={editRentAmount} setEditRentAmount={setEditRentAmount}
        editSecurityDeposit={editSecurityDeposit} setEditSecurityDeposit={setEditSecurityDeposit}
        onSubmit={handleSaveTerms} isSaving={isSavingTerms}
      />
    </LinearGradient>
  );
}

// ── Private sub-components (kept in same file to avoid over-splitting) ────────

function LeasesTab({ filteredLeases, isDark, styles, theme, currentLeasesPage, setCurrentLeasesPage, totalLeasesPages, totalLeasesElements, onEditTerms, onInventory, onServeNotice }: any) {
  if (filteredLeases.length === 0) {
    return (
      <View style={styles.emptyState}>
        <LinearGradient colors={['rgba(0,104,117,0.1)', 'rgba(0,114,255,0.1)']} style={styles.emptyIconCircle}>
          <MaterialIcons name="vpn-key" size={32} color={theme.Colors.primary} />
        </LinearGradient>
        <Text style={styles.emptyTitle}>No Active Leases</Text>
        <Text style={styles.emptySubtitle}>Book rooms or convert bookings to generate tenancy contracts for this property.</Text>
      </View>
    );
  }
  return (
    <View style={styles.listContainer}>
      {filteredLeases.map((l: LeaseResponse) => {
        const hasNotice = Boolean(l.moveOutDate);
        return (
          <BlurView key={l.id} intensity={45} tint={isDark ? 'dark' : 'light'} style={[styles.leaseCard, hasNotice && styles.leaseCardAlert]}>
            {hasNotice && <LinearGradient colors={[theme.Colors.error, '#ef4444']} style={styles.alertStripe} />}
            <View style={styles.leaseCardInner}>
              <View style={styles.tenantAvatarCircle}>
                <Text style={styles.tenantAvatarText}>{(l.tenantName || 'T').substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.leaseMainInfo}>
                <View style={styles.leaseTopRow}>
                  <View style={styles.unitBadge}>
                    <MaterialIcons name="meeting-room" size={12} color={theme.Colors.primary} />
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
                      <Text style={[styles.detailLabel, { color: theme.Colors.error }]}>EXPECTED VACATE</Text>
                      <Text style={[styles.detailValueSecondary, { color: theme.Colors.error, fontWeight: '800' }]}>{l.moveOutDate}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.leaseActionsCol}>
                <TouchableOpacity style={styles.actionBtnOutline} onPress={() => onEditTerms(l)}>
                  <MaterialIcons name="edit" size={14} color={theme.Colors.primary} />
                  <Text style={styles.actionBtnText}>Edit Terms</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => onInventory(l)}>
                  <LinearGradient colors={[theme.Colors.primary, '#0072ff']} style={styles.actionBtnInner}>
                    <MaterialIcons name="inventory-2" size={14} color={theme.Colors.surfaceContainerLowest} />
                    <Text style={styles.actionBtnTextPrimary}>Inventory</Text>
                  </LinearGradient>
                </TouchableOpacity>
                {!l.moveOutDate && (
                  <TouchableOpacity style={styles.actionBtnOutlineDanger} onPress={() => onServeNotice(l.id)}>
                    <MaterialIcons name="warning" size={14} color={theme.Colors.error} />
                    <Text style={styles.actionBtnTextDanger}>Serve Notice</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </BlurView>
        );
      })}
    </View>
  );
}

function BookingsTab({ filteredBookings, isDark, styles, theme, onCashToken, onOnlinePay, onConvert, onForfeit, onRefund }: any) {
  if (filteredBookings.length === 0) {
    return (
      <View style={styles.emptyState}>
        <LinearGradient colors={['rgba(79,70,229,0.1)', 'rgba(124,58,237,0.1)']} style={styles.emptyIconCircle}>
          <MaterialIcons name="bookmark-border" size={32} color={theme.Colors.secondary} />
        </LinearGradient>
        <Text style={styles.emptyTitle}>No Pending Bookings</Text>
        <Text style={styles.emptySubtitle}>Click "Book Room" above to reserve rooms for prospective tenants.</Text>
      </View>
    );
  }
  return (
    <View style={styles.listContainer}>
      {filteredBookings.map((b: UnitBookingResponse) => (
        <BlurView key={b.id} intensity={45} tint={isDark ? 'dark' : 'light'} style={styles.leaseCard}>
          <View style={styles.leaseCardInner}>
            <View style={[styles.tenantAvatarCircle, { backgroundColor: 'rgba(79,70,229,0.1)' }]}>
              <Text style={[styles.tenantAvatarText, { color: theme.Colors.secondary }]}>{(b.prospectiveTenantName || 'P').substring(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.leaseMainInfo}>
              <View style={styles.leaseTopRow}>
                <View style={styles.unitBadge}>
                  <MaterialIcons name="meeting-room" size={12} color={theme.Colors.primary} />
                  <Text style={styles.unitBadgeText}>Unit {b.unitNumber}</Text>
                </View>
                <StatusPill status={b.status} />
              </View>
              <Text style={styles.tenantName}>{b.prospectiveTenantName}</Text>
              <Text style={styles.tenantContact}>{b.prospectiveTenantPhone}{b.prospectiveTenantEmail ? ` · ${b.prospectiveTenantEmail}` : ''}</Text>
              <View style={styles.leaseDetailsRow}>
                <View style={styles.detailItem}><Text style={styles.detailLabel}>TOKEN AMOUNT</Text><Text style={styles.detailValue}>{formatCurrency(b.tokenAmount)}</Text></View>
                <View style={styles.detailItem}><Text style={styles.detailLabel}>EXPECTED MOVE-IN</Text><Text style={styles.detailValueSecondary}>{b.expectedMoveInDate}</Text></View>
              </View>
            </View>
            <View style={styles.leaseActionsCol}>
              {b.status === 'BOOKED' && !b.paymentTransactionId && (
                <>
                  <TouchableOpacity style={styles.actionBtnOutline} onPress={() => onCashToken(b.id)}>
                    <MaterialIcons name="payments" size={14} color={theme.Colors.primary} />
                    <Text style={styles.actionBtnText}>Cash Token</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtnOutline} onPress={() => onOnlinePay(b.id)}>
                    <MaterialIcons name="link" size={14} color={theme.Colors.primary} />
                    <Text style={styles.actionBtnText}>Online Pay</Text>
                  </TouchableOpacity>
                </>
              )}
              {b.status === 'BOOKED' && (
                <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => onConvert(b.id)}>
                  <LinearGradient colors={[theme.Colors.primary, '#10b981']} style={styles.actionBtnInner}>
                    <MaterialIcons name="check-circle" size={14} color={theme.Colors.surfaceContainerLowest} />
                    <Text style={styles.actionBtnTextPrimary}>Convert to Lease</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {b.status === 'BOOKED' && (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity style={styles.actionBtnTextBtn} onPress={() => onForfeit(b.id)}><Text style={styles.forfeitText}>Forfeit</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtnTextBtn} onPress={() => onRefund(b.id)}><Text style={styles.refundText}>Refund</Text></TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </BlurView>
      ))}
    </View>
  );
}

function VacanciesTab({ vacatingUnits, isDark, styles, theme, currentPropertyName }: any) {
  if (vacatingUnits.length === 0) {
    return (
      <View style={styles.emptyState}>
        <LinearGradient colors={['rgba(186,26,26,0.1)', 'rgba(186,26,26,0.1)']} style={styles.emptyIconCircle}>
          <MaterialIcons name="door-sliding" size={32} color={theme.Colors.error} />
        </LinearGradient>
        <Text style={styles.emptyTitle}>No Vacancies or Notices</Text>
        <Text style={styles.emptySubtitle}>No tenants have served move-out notice for this property.</Text>
      </View>
    );
  }
  return (
    <View style={styles.listContainer}>
      {vacatingUnits.map((v: any, i: number) => (
        <BlurView key={v.id || i} intensity={45} tint={isDark ? 'dark' : 'light'} style={styles.leaseCard}>
          <View style={styles.leaseCardInner}>
            <View style={[styles.tenantAvatarCircle, { backgroundColor: 'rgba(186,26,26,0.1)' }]}>
              <MaterialIcons name="door-sliding" size={22} color={theme.Colors.error} />
            </View>
            <View style={styles.leaseMainInfo}>
              <Text style={styles.tenantName}>Unit {v.unitNumber || v.name}</Text>
              <Text style={styles.tenantContact}>{v.propertyName || currentPropertyName}</Text>
              <Text style={[styles.detailValueSecondary, { color: theme.Colors.error, marginTop: 4 }]}>
                Move-Out Scheduled: {v.expectedVacateDate || 'Notice Active'}
              </Text>
            </View>
          </View>
        </BlurView>
      ))}
    </View>
  );
}
