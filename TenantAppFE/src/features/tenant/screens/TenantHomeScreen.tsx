import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { ActiveLeaseSummary, getMyContext } from '@/src/features/auth/api/me.api';
import { getAnnouncements, markAnnouncementRead, Announcement } from '@/src/features/announcements/api/announcement.api';
import { useResponsive } from '@/hooks/useResponsive';
import { Theme } from '@/src/theme/Theme';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';

interface TenantHomeScreenProps {
  token: string;
  onLogout: () => void;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning ☀️';
  if (hour < 18) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
}

export default function TenantHomeScreen({ token, onLogout }: TenantHomeScreenProps) {
  const { isDesktop } = useResponsive();
  const [lease, setLease] = useState<ActiveLeaseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);
  const router = useRouter();

  const loadAnnouncements = () => {
    getAnnouncements(token)
      .then((data) => setAnnouncements(data))
      .catch((err) => console.error('[Announcements]', err));
  };

  useEffect(() => {
    let isMounted = true;
    getMyContext(token)
      .then((context) => {
        if (isMounted) setLease(context.activeLeases[0] || null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [token]);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleMarkAsRead = (id: string) => {
    markAnnouncementRead(token, id).then(() => {
      setAnnouncements(prev => prev.map(ann => ann.id === id ? { ...ann, read: true } : ann));
      if (selectedNotice?.id === id) setSelectedNotice(prev => prev ? { ...prev, read: true } : null);
    });
  };

  const criticalUnread = announcements.filter(a => a.severity === 'CRITICAL' && !a.read);

  const activePropertyName = lease?.propertyName || "Assigned Property";
  const activeUnitNumber = lease?.unitNumber ? `Unit ${lease.unitNumber}` : "Active Lease";
  const activeRent = lease?.rentAmount ? `₹${lease.rentAmount.toLocaleString()}` : "Contact Manager";
  const activeStatus = lease?.status || "ACTIVE";

  return (
    <LinearGradient
      colors={Theme.Colors.backgroundGradient as [string, string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {isDesktop && <DesktopNavBar title="Tenant Hub Overview" />}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Theme.Colors.primary} />
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={[styles.scrollContent, isDesktop ? styles.scrollContentDesktop : { paddingTop: 88 }]}
          >
            {/* Greeting Header */}
            <View style={styles.greetingHeader}>
              <View>
                <Text style={styles.kicker}>TENANT HUB</Text>
                <Text style={styles.greetingText}>{getGreeting()}</Text>
                <Text style={styles.greetingSub}>Welcome back to your resident workspace</Text>
              </View>
            </View>

            {/* Critical Unread Announcement Alerts */}
            {criticalUnread.map((ann) => (
              <View key={ann.id} style={styles.criticalBanner}>
                <View style={styles.criticalBannerLeft}>
                  <MaterialIcons name="error" size={22} color="#fff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.criticalTitle}>{ann.title}</Text>
                    <Text style={styles.criticalText} numberOfLines={2}>{ann.content}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.criticalDismissBtn} onPress={() => handleMarkAsRead(ann.id)}>
                  <Text style={styles.criticalDismissText}>Acknowledge</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Active Property Glass Card */}
            <BlurView intensity={70} tint="light" style={styles.glassCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconBox}>
                  <MaterialIcons name="apartment" size={30} color={Theme.Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.propertyName}>{activePropertyName}</Text>
                  <Text style={styles.unitInfo}>{activeUnitNumber} • Active Lease</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{activeStatus}</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Monthly Rent</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={styles.statValue}>₹{activeRent.toLocaleString()}</Text>
                    <Text style={styles.statSubLabel}>/month</Text>
                  </View>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Payment Status</Text>
                  <Text style={[styles.statValue, { color: '#0d8a5f' }]}>Up to Date</Text>
                </View>
              </View>

              {/* Quick Actions Bar */}
              <View style={styles.quickActionsRow}>
                <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/tenant-payments')} activeOpacity={0.8}>
                  <MaterialIcons name="account-balance-wallet" size={18} color={Theme.Colors.primary} />
                  <Text style={styles.quickActionText}>Payments</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/tenant-property')} activeOpacity={0.8}>
                  <MaterialIcons name="description" size={18} color={Theme.Colors.primary} />
                  <Text style={styles.quickActionText}>My Lease</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/tenant-maintenance')} activeOpacity={0.8}>
                  <MaterialIcons name="build" size={18} color={Theme.Colors.primary} />
                  <Text style={styles.quickActionText}>Maintenance</Text>
                </TouchableOpacity>
              </View>
            </BlurView>

            {/* Maintenance Action Cyan Gradient Strip */}
            <TouchableOpacity onPress={() => router.push('/tenant-maintenance')} activeOpacity={0.88}>
              <LinearGradient
                colors={['#00e0ff', '#0070ea']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionStrip}
              >
                <View style={styles.actionStripLeft}>
                  <View style={styles.actionStripIcon}>
                    <MaterialIcons name="electric-bolt" size={24} color="#fff" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.actionStripTitle}>Log Maintenance Request</Text>
                    <Text style={styles.actionStripSub}>Report plumbing, electrical, or structural issues instantly</Text>
                  </View>
                </View>
                <View style={styles.actionStripBtn}>
                  <Text style={styles.actionStripBtnText}>Log Issue</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Notice Board Glass Section */}
            <BlurView intensity={70} tint="light" style={styles.glassCard}>
              <View style={styles.noticeHeaderRow}>
                <View>
                  <Text style={styles.noticeSectionTitle}>Landlord Notice Board</Text>
                  <Text style={styles.noticeSectionSub}>Official updates and building broadcasts</Text>
                </View>
                <MaterialIcons name="campaign" size={24} color={Theme.Colors.primary} />
              </View>

              {announcements.length === 0 ? (
                <View style={styles.emptyNoticeBox}>
                  <View style={styles.emptyNoticeIconWrapper}>
                    <MaterialIcons name="notifications-none" size={32} color={Theme.Colors.primary} />
                  </View>
                  <Text style={styles.emptyNoticeText}>No recent notices from your landlord</Text>
                  <Text style={styles.emptyNoticeSub}>All community updates will appear here.</Text>
                </View>
              ) : (
                announcements.map((ann) => (
                  <TouchableOpacity 
                    key={ann.id} 
                    style={[styles.noticeItem, ann.read ? styles.noticeItemRead : styles.noticeItemUnread]}
                    onPress={() => setSelectedNotice(ann)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.noticeItemHeader}>
                      <View style={[styles.noticeBadge, { backgroundColor: getCategoryColor(ann.category) }]}>
                        <Text style={styles.noticeBadgeText}>{ann.category}</Text>
                      </View>
                      {!ann.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.noticeTitle}>{ann.title}</Text>
                    <Text style={styles.noticeSummary} numberOfLines={2}>{ann.content}</Text>
                    <Text style={styles.noticeDate}>
                      {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </BlurView>
          </ScrollView>
        )}

        {/* Notice Modal Detail Viewer */}
        {selectedNotice && (
          <Modal transparent visible={true} animationType="fade" onRequestClose={() => setSelectedNotice(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={[styles.noticeBadge, { backgroundColor: getCategoryColor(selectedNotice.category) }]}>
                    <Text style={styles.noticeBadgeText}>{selectedNotice.category}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { handleMarkAsRead(selectedNotice.id); setSelectedNotice(null); }}>
                    <MaterialIcons name="close" size={24} color={Theme.Colors.onBackground} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalTitle}>{selectedNotice.title}</Text>
                <Text style={styles.modalMeta}>Posted by {selectedNotice.creatorName || 'Property Management'} • {new Date(selectedNotice.createdAt).toLocaleDateString()}</Text>
                <ScrollView style={{ maxHeight: 260 }}>
                  <Text style={styles.modalBody}>{selectedNotice.content}</Text>
                </ScrollView>
                <TouchableOpacity 
                  style={styles.modalCloseBtn}
                  onPress={() => { handleMarkAsRead(selectedNotice.id); setSelectedNotice(null); }}
                >
                  <Text style={styles.modalCloseBtnText}>Acknowledge & Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function getCategoryColor(cat: string) {
  switch (cat) {
    case 'EMERGENCY': return '#ba1a1a';
    case 'MAINTENANCE': return '#e28743';
    case 'BILLING': return Theme.Colors.primary;
    case 'EVENT': return '#7b2cbf';
    default: return Theme.Colors.outline;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },
  scrollContentDesktop: { paddingTop: 20 },

  greetingHeader: { marginBottom: 4 },
  kicker: { fontSize: 11, fontWeight: '800', color: Theme.Colors.primary, letterSpacing: 1.2, marginBottom: 4 },
  greetingText: { fontSize: 28, fontWeight: '800', color: Theme.Colors.onBackground },
  greetingSub: { fontSize: 14, color: Theme.Colors.onSurfaceVariant, marginTop: 2 },

  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: Theme.Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    overflow: 'hidden'
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  iconBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(0, 104, 117, 0.1)', alignItems: 'center', justifyContent: 'center' },
  propertyName: { fontSize: 22, fontWeight: '800', color: Theme.Colors.onBackground },
  unitInfo: { fontSize: 14, color: Theme.Colors.onSurfaceVariant, marginTop: 2 },
  statusBadge: { backgroundColor: 'rgba(0, 104, 117, 0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusBadgeText: { color: Theme.Colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },

  statsGrid: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.9)' },
  statLabel: { fontSize: 12, fontWeight: '700', color: Theme.Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  statSubLabel: { fontSize: 12, color: Theme.Colors.onSurfaceVariant, marginLeft: 2 },
  statValue: { fontSize: 24, fontWeight: '800', color: Theme.Colors.primary },

  quickActionsRow: { flexDirection: 'row', gap: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(186, 201, 204, 0.3)' },
  quickActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255, 255, 255, 0.8)', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0, 104, 117, 0.15)' },
  quickActionText: { fontSize: 13, fontWeight: '700', color: Theme.Colors.primary },

  actionStrip: { borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#0070ea', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 5 },
  actionStripLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  actionStripIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.25)', alignItems: 'center', justifyContent: 'center' },
  actionStripTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  actionStripSub: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)', marginTop: 2 },
  actionStripBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  actionStripBtnText: { color: '#0070ea', fontSize: 13, fontWeight: '800' },

  noticeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  noticeSectionTitle: { fontSize: 20, fontWeight: '800', color: Theme.Colors.onBackground },
  noticeSectionSub: { fontSize: 13, color: Theme.Colors.onSurfaceVariant, marginTop: 2 },
  emptyNoticeBox: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(186, 201, 204, 0.4)', borderStyle: 'dashed', backgroundColor: 'rgba(255, 255, 255, 0.4)' },
  emptyNoticeIconWrapper: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0, 104, 117, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyNoticeText: { fontSize: 15, color: Theme.Colors.onBackground, fontWeight: '700' },
  emptyNoticeSub: { fontSize: 13, color: Theme.Colors.onSurfaceVariant, marginTop: 4 },

  noticeItem: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  noticeItemRead: { backgroundColor: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(186, 201, 204, 0.4)' },
  noticeItemUnread: { backgroundColor: '#ffffff', borderColor: Theme.Colors.primaryContainer, shadowColor: Theme.Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  noticeItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noticeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  noticeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.Colors.primary },
  noticeTitle: { fontSize: 16, fontWeight: '700', color: Theme.Colors.onBackground, marginBottom: 4 },
  noticeSummary: { fontSize: 14, color: Theme.Colors.onSurfaceVariant, lineHeight: 20 },
  noticeDate: { fontSize: 12, color: Theme.Colors.outline, marginTop: 8, textAlign: 'right' },

  criticalBanner: { backgroundColor: '#ba1a1a', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  criticalBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  criticalTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  criticalText: { color: 'rgba(255, 255, 255, 0.95)', fontSize: 13, marginTop: 2 },
  criticalDismissBtn: { backgroundColor: 'rgba(255, 255, 255, 0.25)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  criticalDismissText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 28, 48, 0.55)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Theme.Colors.onBackground, marginBottom: 6 },
  modalMeta: { fontSize: 13, color: Theme.Colors.onSurfaceVariant, marginBottom: 16 },
  modalBody: { fontSize: 15, color: Theme.Colors.onSurfaceVariant, lineHeight: 24 },
  modalCloseBtn: { backgroundColor: Theme.Colors.primary, marginTop: 20, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalCloseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});


