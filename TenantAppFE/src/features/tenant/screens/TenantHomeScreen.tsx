import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ActiveLeaseSummary, getMyContext } from '@/src/features/auth/api/me.api';
import { getAnnouncements, markAnnouncementRead, Announcement } from '@/src/features/announcements/api/announcement.api';
import { RoleToggle } from '@/src/components/RoleToggle';

interface TenantHomeScreenProps {
  token: string;
  onLogout: () => void;
}

// Colors from Stitch Design System
const colors = {
  primary: '#004c5a',
  primaryContainer: '#006677',
  onPrimaryContainer: '#96e1f5',
  secondaryContainer: '#d2e4fb',
  background: '#f8f9ff',
  surfaceLowest: '#ffffff',
  surfaceLow: '#eff4ff',
  surfaceBright: '#f8f9ff',
  onBackground: '#0b1c30',
  onSurfaceVariant: '#3f484b',
  outlineVariant: '#bec8cb',
  outline: '#6f797c',
  error: '#ba1a1a',
  onPrimary: '#ffffff'
};

export default function TenantHomeScreen({ token, onLogout }: TenantHomeScreenProps) {
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
    if (lease) loadAnnouncements();
  }, [lease]);

  const handleMarkAsRead = (id: string) => {
    markAnnouncementRead(token, id).then(() => {
      setAnnouncements(prev => prev.map(ann => ann.id === id ? { ...ann, read: true } : ann));
      if (selectedNotice?.id === id) setSelectedNotice(prev => prev ? { ...prev, read: true } : null);
    });
  };

  const criticalUnread = announcements.filter(a => a.severity === 'CRITICAL' && !a.read);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>MY PROPERTY</Text>
            <Text style={styles.title}>My Home</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <RoleToggle />
            <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
              <MaterialIcons name="logout" size={22} color={colors.onBackground} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : lease ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
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

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconBox}>
                  <MaterialIcons name="apartment" size={32} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.propertyName}>{lease.propertyName}</Text>
                  <Text style={styles.unitInfo}>Unit {lease.unitNumber} • Main Wing</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Monthly Rent</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={styles.statValue}>₹{lease.rentAmount}</Text>
                    <Text style={styles.statLabel}>/mo</Text>
                  </View>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Status</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{lease.status}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.financePreview}>
                <View style={styles.financePreviewHeader}>
                  <Text style={styles.financePreviewTitle}>RENT CYCLES COMING NEXT</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={colors.primary} />
                </View>
                <TouchableOpacity style={styles.financePreviewBox} onPress={() => router.push('/tenant-payments')}>
                  <Text style={styles.financePreviewText}>This screen is ready to host rent, complaints, and payment history.</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.actionStrip} onPress={() => router.push('/tenant-maintenance')}>
              <View style={styles.actionStripLeft}>
                <View style={styles.actionStripIcon}>
                  <MaterialIcons name="electric-bolt" size={24} color="#fff" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.actionStripTitle}>Maintenance Request</Text>
                  <Text style={styles.actionStripSub}>Got an issue? Log it in seconds.</Text>
                </View>
              </View>
              <View style={styles.actionStripBtn}>
                <Text style={styles.actionStripBtnText}>Log Request</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.card}>
              <View style={styles.noticeHeaderRow}>
                <Text style={styles.noticeSectionTitle}>Notice Board</Text>
                <MaterialIcons name="history" size={24} color={colors.onSurfaceVariant} />
              </View>

              {announcements.length === 0 ? (
                <View style={styles.emptyNoticeBox}>
                  <View style={styles.emptyNoticeIconWrapper}>
                    <MaterialIcons name="notifications-none" size={32} color={colors.secondaryContainer} />
                  </View>
                  <Text style={styles.emptyNoticeText}>No recent notices from the landlord.</Text>
                  <Text style={styles.emptyNoticeSub}>Check back later for community updates.</Text>
                </View>
              ) : (
                announcements.map((ann) => (
                  <TouchableOpacity 
                    key={ann.id} 
                    style={[styles.noticeItem, ann.read ? styles.noticeItemRead : styles.noticeItemUnread]}
                    onPress={() => setSelectedNotice(ann)}
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
                      {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

          </ScrollView>
        ) : (
          <View style={styles.card}>
            <Text style={styles.propertyName}>No active home yet</Text>
            <Text style={styles.unitInfo}>Your dashboard will appear here after a landlord assigns you to a unit.</Text>
          </View>
        )}

        {selectedNotice && (
          <Modal transparent visible={true} animationType="fade" onRequestClose={() => setSelectedNotice(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={[styles.noticeBadge, { backgroundColor: getCategoryColor(selectedNotice.category) }]}>
                    <Text style={styles.noticeBadgeText}>{selectedNotice.category}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { handleMarkAsRead(selectedNotice.id); setSelectedNotice(null); }}>
                    <MaterialIcons name="close" size={24} color={colors.onBackground} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalTitle}>{selectedNotice.title}</Text>
                <Text style={styles.modalMeta}>Posted by {selectedNotice.creatorName || 'Landlord'}</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  <Text style={styles.modalBody}>{selectedNotice.content}</Text>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </View>
  );
}

function getCategoryColor(cat: string) {
  switch (cat) {
    case 'EMERGENCY': return colors.error;
    case 'MAINTENANCE': return '#e28743';
    case 'BILLING': return colors.primary;
    case 'EVENT': return '#7b2cbf';
    default: return colors.outline;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  kicker: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  title: { color: colors.onBackground, fontSize: 32, fontWeight: '800' },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceLowest, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.outlineVariant, marginLeft: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 30, gap: 20 },
  
  card: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(190, 200, 203, 0.3)',
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.secondaryContainer, alignItems: 'center', justifyContent: 'center' },
  propertyName: { fontSize: 24, fontWeight: '700', color: colors.onBackground },
  unitInfo: { fontSize: 16, color: colors.onSurfaceVariant, marginTop: 4 },
  
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(190, 200, 203, 0.2)' },
  statLabel: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceVariant, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: '700', color: colors.primary, marginRight: 4 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: colors.primaryContainer, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusBadgeText: { color: colors.onPrimary, fontSize: 12, fontWeight: '600', letterSpacing: 1 },

  financePreview: { paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(190, 200, 203, 0.3)' },
  financePreviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  financePreviewTitle: { fontSize: 12, fontWeight: '700', color: colors.onBackground, letterSpacing: 1 },
  financePreviewBox: { backgroundColor: colors.surfaceBright, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.outline, borderStyle: 'dashed' },
  financePreviewText: { fontSize: 14, color: colors.onSurfaceVariant, fontStyle: 'italic' },

  actionStrip: { backgroundColor: 'rgba(0, 76, 90, 0.05)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(0, 76, 90, 0.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionStripLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  actionStripIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  actionStripTitle: { fontSize: 16, fontWeight: '700', color: colors.onBackground },
  actionStripSub: { fontSize: 14, color: colors.onSurfaceVariant, marginTop: 2 },
  actionStripBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  actionStripBtnText: { color: colors.onPrimary, fontSize: 14, fontWeight: '600' },

  noticeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  noticeSectionTitle: { fontSize: 20, fontWeight: '700', color: colors.onBackground },
  emptyNoticeBox: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(190, 200, 203, 0.4)', borderStyle: 'dashed', backgroundColor: 'rgba(248, 249, 255, 0.5)' },
  emptyNoticeIconWrapper: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyNoticeText: { fontSize: 16, color: colors.onSurfaceVariant, fontWeight: '500' },
  emptyNoticeSub: { fontSize: 12, color: colors.outline, marginTop: 4 },
  
  noticeItem: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  noticeItemRead: { backgroundColor: '#ffffff', borderColor: colors.outlineVariant },
  noticeItemUnread: { backgroundColor: '#ffffff', borderColor: colors.primaryContainer, shadowColor: colors.primaryContainer, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  noticeItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noticeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  noticeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryContainer },
  noticeTitle: { fontSize: 16, fontWeight: '700', color: colors.onBackground, marginBottom: 4 },
  noticeSummary: { fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 20 },
  noticeDate: { fontSize: 12, color: colors.outline, marginTop: 8, textAlign: 'right' },

  criticalBanner: { backgroundColor: colors.error, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  criticalBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  criticalTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  criticalText: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 12, marginTop: 2 },
  criticalDismissBtn: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  criticalDismissText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 28, 48, 0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: colors.onBackground, marginBottom: 8 },
  modalMeta: { fontSize: 14, color: colors.onSurfaceVariant, marginBottom: 20 },
  modalBody: { fontSize: 16, color: colors.onSurfaceVariant, lineHeight: 24 }
});
