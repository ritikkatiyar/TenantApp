import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

import { Theme } from '@/src/theme/Theme';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

// Phase 4 modular hook & component imports
import { useAnnouncementAdmin } from '@/src/features/announcements/hooks/useAnnouncementAdmin';
import { AnnouncementComposer } from '@/src/features/announcements/components/AnnouncementComposer';
import { AnnouncementHistoryList } from '@/src/features/announcements/components/AnnouncementHistoryList';

const LUMINOUS_BACKGROUND = ['#d4f5f9', '#e8f8fb', '#e2e0fb'] as const;

interface AnnouncementAdminScreenProps {
  onLogout: () => void;
}

export default function AnnouncementAdminScreen({ onLogout }: AnnouncementAdminScreenProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isWideDesktop = width >= 1200;
  const useTwoColumnLayout = width >= 1500;
  const { accessToken } = useAuth();
  const { properties, isLoading: propertiesLoading } = useProperties();

  const {
    selectedPropertyId,
    setSelectedPropertyId,
    historyPropertyId,
    setHistoryPropertyId,
    showHistory,
    setShowHistory,
    announcements,
    loadingAnnouncements,
    broadcastTitle,
    setBroadcastTitle,
    broadcastContent,
    setBroadcastContent,
    broadcastCategory,
    setBroadcastCategory,
    broadcastSeverity,
    setBroadcastSeverity,
    broadcastTargetType,
    setBroadcastTargetType,
    broadcastTargetValue,
    setBroadcastTargetValue,
    sendingBroadcast,
    handleSendBroadcast,
  } = useAnnouncementAdmin({
    accessToken,
    properties,
    propertiesLoading,
  });

  if (isDesktop) {
    return (
      <LinearGradient colors={LUMINOUS_BACKGROUND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <View style={styles.desktopShell}>
          <View style={styles.desktopMain}>
            <DesktopNavBar 
              activeTab="Communication"
              hideTabs={!isWideDesktop}
              title="Announcements"
              rightContent={
                <>
                  {isWideDesktop && (
                    <BlurView intensity={50} tint="light" style={styles.searchBox}>
                      <MaterialIcons name="search" size={22} color="#6b7a7d" />
                      <Text style={styles.searchPlaceholder}>Search announcements...</Text>
                    </BlurView>
                  )}
                  <TouchableOpacity style={styles.topIcon} onPress={() => router.push('/escalations')}>
                    <Ionicons name="notifications-outline" size={23} color={Theme.Colors.onSurface} />
                  </TouchableOpacity>
                </>
              }
            />

            <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
              <View style={styles.desktopInner}>
                <View style={styles.pageHeaderRow}>
                  <View>
                    <Text style={styles.pageTitle}>Announcement Management</Text>
                  </View>
                </View>
                <View style={[styles.desktopGrid, !useTwoColumnLayout && styles.desktopGridStacked]}>
                  <View style={styles.composerColumn}>
                    <AnnouncementComposer
                      properties={properties}
                      selectedPropertyId={selectedPropertyId}
                      setSelectedPropertyId={setSelectedPropertyId}
                      broadcastTitle={broadcastTitle}
                      setBroadcastTitle={setBroadcastTitle}
                      broadcastContent={broadcastContent}
                      setBroadcastContent={setBroadcastContent}
                      broadcastCategory={broadcastCategory}
                      setBroadcastCategory={setBroadcastCategory}
                      broadcastSeverity={broadcastSeverity}
                      setBroadcastSeverity={setBroadcastSeverity}
                      broadcastTargetType={broadcastTargetType}
                      setBroadcastTargetType={setBroadcastTargetType}
                      broadcastTargetValue={broadcastTargetValue}
                      setBroadcastTargetValue={setBroadcastTargetValue}
                      sendingBroadcast={sendingBroadcast}
                      handleSendBroadcast={handleSendBroadcast}
                    />
                  </View>
                  <View style={styles.historyColumn}>
                    <AnnouncementHistoryList
                      properties={properties}
                      historyPropertyId={historyPropertyId}
                      setHistoryPropertyId={setHistoryPropertyId}
                      announcements={announcements}
                      loadingAnnouncements={loadingAnnouncements}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={LUMINOUS_BACKGROUND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={[]}>
        {/* Header with toggle for mobile */}
        <View style={styles.mobileHeader}>
          <Text style={styles.mobileHeaderTitle}>Announcements</Text>
          <TouchableOpacity
            style={styles.toggleHistoryBtn}
            onPress={() => setShowHistory(!showHistory)}
          >
            <MaterialIcons name={showHistory ? "edit" : "history"} size={22} color="#006875" />
            <Text style={styles.toggleHistoryText}>{showHistory ? "Compose" : "History"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mobileContent}>
          {showHistory ? (
            <AnnouncementHistoryList
              properties={properties}
              historyPropertyId={historyPropertyId}
              setHistoryPropertyId={setHistoryPropertyId}
              announcements={announcements}
              loadingAnnouncements={loadingAnnouncements}
            />
          ) : (
            <AnnouncementComposer
              properties={properties}
              selectedPropertyId={selectedPropertyId}
              setSelectedPropertyId={setSelectedPropertyId}
              broadcastTitle={broadcastTitle}
              setBroadcastTitle={setBroadcastTitle}
              broadcastContent={broadcastContent}
              setBroadcastContent={setBroadcastContent}
              broadcastCategory={broadcastCategory}
              setBroadcastCategory={setBroadcastCategory}
              broadcastSeverity={broadcastSeverity}
              setBroadcastSeverity={setBroadcastSeverity}
              broadcastTargetType={broadcastTargetType}
              setBroadcastTargetType={setBroadcastTargetType}
              broadcastTargetValue={broadcastTargetValue}
              setBroadcastTargetValue={setBroadcastTargetValue}
              sendingBroadcast={sendingBroadcast}
              handleSendBroadcast={handleSendBroadcast}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCategoryColor(cat: string) {
  switch (cat) {
    case 'EMERGENCY':
      return '#ba1a1a';
    case 'MAINTENANCE':
      return '#e28743';
    case 'BILLING':
      return '#0072ff';
    case 'EVENT':
      return '#7b2cbf';
    default:
      return '#6b7a7d';
  }
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  desktopShell: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    height: '100%',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    overflow: 'hidden',
  },
  sidebarBrand: {
    marginBottom: 54,
  },
  sidebarBrandTitle: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    color: Theme.Colors.primary,
  },
  sidebarBrandSub: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: Theme.Colors.onSurfaceVariant,
    marginTop: 4,
  },
  sidebarNav: {
    gap: 14,
  },
  sidebarLink: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 18,
    borderRadius: Theme.Rounded.lg,
  },
  sidebarLinkActive: {
    backgroundColor: 'rgba(0, 224, 255, 0.10)',
    borderRightWidth: 4,
    borderRightColor: Theme.Colors.primaryContainer,
  },
  sidebarLinkText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: Theme.Colors.onSurface,
  },
  sidebarLinkTextActive: {
    color: Theme.Colors.primary,
  },
  sidebarFooter: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: Theme.Colors.outlineVariant,
    paddingTop: 28,
    gap: 10,
  },
  upgradeButton: {
    borderRadius: Theme.Rounded.lg,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: Theme.Colors.secondary,
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  upgradeGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  upgradeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  desktopMain: {
    flex: 1,
    minWidth: 0,
  },
  topbar: {
    minHeight: 82,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.75)',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    overflow: 'hidden',
  },
  topbarTabs: {
    flexDirection: 'row',
    gap: 34,
    alignItems: 'center',
  },
  topbarTab: {
    fontSize: 18,
    color: Theme.Colors.onSurface,
  },
  compactTopbarTitle: {
    color: '#004b57',
    fontSize: 18,
    fontWeight: '700',
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchBox: {
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Theme.Rounded.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  searchPlaceholder: {
    color: '#6b7a7d',
    fontSize: 13,
  },
  topIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.Colors.primaryContainer,
  },
  avatarText: {
    color: Theme.Colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  desktopContent: {
    padding: 36,
    paddingBottom: 80,
  },
  desktopInner: {
    gap: 24,
    width: '100%',
    maxWidth: 1380,
    alignSelf: 'center',
  },
  pageHeader: {
    marginBottom: 20,
  },
  pageHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  desktopSaveButtonWrapper: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  desktopSaveButton: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  desktopSaveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 38,
  },
  pageSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7a7d',
    maxWidth: 620,
  },
  sectionCard: {
    padding: 32,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    shadowColor: Theme.Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 3,
  },
  desktopGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 24,
  },
  desktopGridStacked: {
    flexDirection: 'column',
  },
  composerColumn: {
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  historyColumn: {
    flex: 1.12,
    minWidth: 0,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 16,
  },
  sectionHeaderCopy: {
    flexShrink: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#101718',
  },
  sectionSubtitle: {
    marginTop: 5,
    fontSize: 14,
    color: Theme.Colors.onSurfaceVariant,
    maxWidth: 520,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  statsBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Theme.Rounded.lg,
    backgroundColor: 'rgba(0, 114, 255, 0.1)',
    maxWidth: '100%',
  },
  statsBadgeText: {
    color: '#0072ff',
    fontWeight: '700',
    fontSize: 12,
    flexShrink: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  eyebrow: {
    color: '#00606b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 7,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.8,
    color: '#005363',
    marginBottom: 10,
  },
  textInput: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    color: Theme.Colors.onSurface,
    fontSize: 15,
  },
  textarea: {
    minHeight: 154,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipActive: {
    backgroundColor: '#0072ff',
    borderColor: '#0072ff',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7a7d',
  },
  chipTextActive: {
    color: '#fff',
  },
  emptyStateText: {
    color: '#6b7a7d',
    fontSize: 14,
    marginTop: 10,
  },
  sendButton: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  historyList: {
    gap: 16,
  },
  historyCard: {
    marginBottom: 0,
    borderRadius: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e7eeee',
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.Colors.onSurfaceVariant,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#004b57',
    marginBottom: 8,
  },
  historyContent: {
    fontSize: 14,
    color: Theme.Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 14,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTimestamp: {
    fontSize: 12,
    color: Theme.Colors.onSurfaceVariant,
  },
  historyBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.Colors.primary,
  },
  categoryBadge: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 14,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  centerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: Theme.Rounded.xl,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  safeArea: {
    flex: 1,
  },
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderBottomWidth: 1,
    borderBottomColor: '#e5eded',
  },
  mobileHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#151d1e',
    fontFamily: 'Inter',
  },
  toggleHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
  },
  toggleHistoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006875',
    fontFamily: 'Inter',
  },
  mobileTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#004b57',
  },
  mobileSubtitle: {
    marginTop: 2,
    color: '#66777a',
    fontSize: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  mobileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.Colors.primaryContainer,
  },
  mobileAvatarText: {
    color: Theme.Colors.primary,
    fontWeight: '800',
  },
  mobileContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 18,
  },
  segmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  segmentButtonWrapper: {
    minWidth: '30%',
    flexGrow: 1,
  },
  segmentButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentButtonInactive: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7a7d',
  },
  segmentTextActive: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
