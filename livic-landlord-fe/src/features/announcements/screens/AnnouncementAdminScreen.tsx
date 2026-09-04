import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/src/hooks/useResponsive';
import { createStyles } from './AnnouncementAdminScreen.styles';
import { useProperties } from '@/src/hooks/useProperties';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

// Phase 4 modular hook & component imports
import { useAnnouncementAdmin } from '@/src/features/announcements/hooks/useAnnouncementAdmin';
import { AnnouncementComposer } from '@/src/features/announcements/components/AnnouncementComposer';
import { AnnouncementHistoryList } from '@/src/features/announcements/components/AnnouncementHistoryList';

interface AnnouncementAdminScreenProps {
  onLogout?: () => void;
}

export default function AnnouncementAdminScreen({ onLogout }: AnnouncementAdminScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { isDesktop } = useResponsive();
  const useTwoColumnLayout = isDesktop;
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
      <PageShell scrollable={false} edges={['top', 'left', 'right']}>
        <View style={styles.desktopShell}>
          <View style={styles.desktopMain}>


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
      </PageShell>
    );
  }

  return (
    <PageShell scrollable={true} edges={[]} contentContainerStyle={styles.mobileContent}>
      {/* Sub-header with toggle for mobile */}
      <View style={styles.mobileHeader}>
        <Text style={styles.mobileSubtitle}>Broadcast notices & alerts</Text>
        <TouchableOpacity
          style={styles.toggleHistoryBtn}
          onPress={() => setShowHistory(!showHistory)}
          activeOpacity={0.75}
        >
          <MaterialIcons name={showHistory ? "edit" : "history"} size={18} color={theme.Colors.primary} />
          <Text style={styles.toggleHistoryText}>{showHistory ? "Compose" : "History"}</Text>
        </TouchableOpacity>
      </View>

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
    </PageShell>
  );
}

