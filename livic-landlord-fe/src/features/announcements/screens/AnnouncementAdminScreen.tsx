import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import {
  ScrollView,
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
import { createStyles } from './AnnouncementAdminScreen.styles';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

// Phase 4 modular hook & component imports
import { useAnnouncementAdmin } from '@/src/features/announcements/hooks/useAnnouncementAdmin';
import { AnnouncementComposer } from '@/src/features/announcements/components/AnnouncementComposer';
import { AnnouncementHistoryList } from '@/src/features/announcements/components/AnnouncementHistoryList';

const LUMINOUS_BACKGROUND = ['#d4f5f9', '#e8f8fb', '#e2e0fb'] as const;

interface AnnouncementAdminScreenProps {
  onLogout: () => void;
}

export default function AnnouncementAdminScreen({ onLogout }: AnnouncementAdminScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isWideDesktop = width >= 1200;
  const useTwoColumnLayout = width >= 1024;
  const { accessToken } = useAuth();
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { handleScroll } = useScrollNav();

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
                    <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.searchBox}>
                      <MaterialIcons name="search" size={22} color={theme.Colors.onSurfaceVariant} />
                      <Text style={styles.searchPlaceholder}>Search announcements...</Text>
                    </BlurView>
                  )}
                  <TouchableOpacity style={styles.topIcon} onPress={() => router.push('/escalations')}>
                    <Ionicons name="notifications-outline" size={23} color={theme.Colors.onSurface} />
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
            <MaterialIcons name={showHistory ? "edit" : "history"} size={22} color={theme.Colors.primary} />
            <Text style={styles.toggleHistoryText}>{showHistory ? "Compose" : "History"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.mobileContent}
        >
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

function getCategoryColor(cat: string, theme: any) {
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
      return theme.Colors.onSurfaceVariant;
  }
}

