import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { ActiveLeaseSummary, getMyContext } from '@/src/features/auth/api/me.api';
import { getAnnouncements, markAnnouncementRead, Announcement } from '@/src/features/announcements/api/announcement.api';

interface TenantHomeScreenProps {
  token: string;
  onLogout: () => void;
}

export default function TenantHomeScreen({ token, onLogout }: TenantHomeScreenProps) {
  const [lease, setLease] = useState<ActiveLeaseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);

  const loadAnnouncements = () => {
    getAnnouncements(token)
      .then((data) => {
        setAnnouncements(data);
      })
      .catch((err) => console.error('[Announcements]', err));
  };

  useEffect(() => {
    let isMounted = true;
    getMyContext(token)
      .then((context) => {
        if (isMounted) {
          setLease(context.activeLeases[0] || null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (lease) {
      loadAnnouncements();
    }
  }, [lease]);

  const handleMarkAsRead = (id: string) => {
    markAnnouncementRead(token, id)
      .then(() => {
        setAnnouncements((prev) =>
          prev.map((ann) => (ann.id === id ? { ...ann, read: true } : ann))
        );
        if (selectedNotice && selectedNotice.id === id) {
          setSelectedNotice((prev) => prev ? { ...prev, read: true } : null);
        }
      })
      .catch((err) => console.error('[Read Receipt]', err));
  };

  const criticalUnread = announcements.filter(a => a.severity === 'CRITICAL' && !a.read);

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>MY PROPERTY</Text>
            <Text style={styles.title}>My Home</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
            <MaterialIcons name="logout" size={22} color="#264346" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#006875" />
          </View>
        ) : lease ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Sticky Critical Alerts */}
            {criticalUnread.map((ann) => (
              <View key={ann.id} style={styles.criticalBanner}>
                <View style={styles.criticalBannerLeft}>
                  <MaterialIcons name="error" size={22} color="#fff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.criticalTitle}>{ann.title}</Text>
                    <Text style={styles.criticalText} numberOfLines={2}>{ann.content}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.criticalDismissBtn} 
                  onPress={() => handleMarkAsRead(ann.id)}
                >
                  <Text style={styles.criticalDismissText}>Acknowledge</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <MaterialIcons name="home-work" size={28} color="#006875" />
                <View>
                  <Text style={styles.propertyName}>{lease.propertyName}</Text>
                  <Text style={styles.muted}>Unit {lease.unitNumber}</Text>
                </View>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Monthly Rent</Text>
                  <Text style={styles.metricValue}>₹{lease.rentAmount}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Status</Text>
                  <Text style={styles.metricValue}>{lease.status}</Text>
                </View>
              </View>

              <View style={styles.placeholder}>
                <Text style={styles.placeholderTitle}>Rent cycles coming next</Text>
                <Text style={styles.placeholderText}>This screen is ready to host rent, complaints, and payment history.</Text>
              </View>

              {/* Notice Board Container */}
              <View style={styles.noticeBoardContainer}>
                <Text style={styles.sectionTitle}>Notice Board</Text>
                {announcements.length === 0 ? (
                  <View style={styles.emptyNotice}>
                    <MaterialIcons name="notifications-none" size={24} color="#6b7a7d" />
                    <Text style={styles.emptyNoticeText}>No recent notices from the landlord.</Text>
                  </View>
                ) : (
                  announcements.map((ann) => (
                    <TouchableOpacity 
                      key={ann.id} 
                      style={[styles.noticeCard, ann.read ? styles.readCard : styles.unreadCard]}
                      onPress={() => setSelectedNotice(ann)}
                    >
                      <View style={styles.noticeHeader}>
                        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(ann.category) }]}>
                          <Text style={styles.categoryText}>{ann.category}</Text>
                        </View>
                        {!ann.read && <View style={styles.unreadIndicator} />}
                      </View>
                      <Text style={styles.noticeTitle}>{ann.title}</Text>
                      <Text style={styles.noticeSummary} numberOfLines={2}>{ann.content}</Text>
                      <Text style={styles.noticeDate}>
                        {new Date(ann.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.propertyName}>No active home yet</Text>
            <Text style={styles.muted}>Your tenant dashboard will appear here after a landlord assigns you to a unit.</Text>
          </View>
        )}

        {/* Notice Details Modal */}
        {selectedNotice && (
          <Modal
            transparent
            visible={!!selectedNotice}
            animationType="fade"
            onRequestClose={() => {
              if (!selectedNotice.read) {
                handleMarkAsRead(selectedNotice.id);
              }
              setSelectedNotice(null);
            }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(selectedNotice.category) }]}>
                    <Text style={styles.categoryText}>{selectedNotice.category}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => {
                      if (!selectedNotice.read) {
                        handleMarkAsRead(selectedNotice.id);
                      }
                      setSelectedNotice(null);
                    }}
                  >
                    <MaterialIcons name="close" size={24} color="#163235" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalTitle}>{selectedNotice.title}</Text>
                <Text style={styles.modalMeta}>Posted by {selectedNotice.creatorName || 'Landlord'}</Text>
                <ScrollView style={styles.modalScroll}>
                  <Text style={styles.modalBody}>{selectedNotice.content}</Text>
                </ScrollView>
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
    case 'EMERGENCY':
      return '#ba1a1a';
    case 'MAINTENANCE':
      return '#e28743';
    case 'BILLING':
      return '#006875';
    case 'EVENT':
      return '#7b2cbf';
    default:
      return '#6b7a7d';
  }
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  kicker: {
    color: '#006875',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: '#163235',
    fontSize: 34,
    fontWeight: '800',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#d9e7e8',
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  panel: {
    backgroundColor: '#fff',
    borderColor: '#dcebed',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  propertyName: {
    color: '#173336',
    fontSize: 20,
    fontWeight: '800',
  },
  muted: {
    color: '#6b7a7d',
    fontSize: 14,
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metric: {
    backgroundColor: '#f3faf9',
    borderRadius: 8,
    flex: 1,
    padding: 14,
  },
  metricLabel: {
    color: '#6b7a7d',
    fontSize: 12,
    fontWeight: '700',
  },
  metricValue: {
    color: '#006875',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  placeholder: {
    borderColor: '#dcebed',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
    padding: 14,
  },
  placeholderTitle: {
    color: '#173336',
    fontSize: 16,
    fontWeight: '800',
  },
  placeholderText: {
    color: '#66787b',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  criticalBanner: {
    backgroundColor: '#ba1a1a',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  criticalBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  criticalTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  criticalText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  criticalDismissBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  criticalDismissText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  noticeBoardContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#eef6ff',
    paddingTop: 20,
  },
  sectionTitle: {
    color: '#163235',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  emptyNotice: {
    alignItems: 'center',
    padding: 24,
  },
  emptyNoticeText: {
    color: '#6b7a7d',
    fontSize: 14,
    marginTop: 8,
  },
  noticeCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  readCard: {
    backgroundColor: '#fafbfc',
    borderColor: '#eef1f2',
  },
  unreadCard: {
    backgroundColor: '#fff',
    borderColor: '#006875',
    shadowColor: '#006875',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#006875',
  },
  noticeTitle: {
    color: '#163235',
    fontSize: 16,
    fontWeight: '800',
  },
  noticeSummary: {
    color: '#55686a',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 18,
  },
  noticeDate: {
    color: '#94a5a7',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#163235',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalMeta: {
    color: '#6b7a7d',
    fontSize: 12,
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalBody: {
    color: '#334446',
    fontSize: 15,
    lineHeight: 22,
  },
});
