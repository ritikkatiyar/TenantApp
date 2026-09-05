import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from '@/src/hooks/useResponsive';
import { createStyles } from './AnnouncementAdminScreen.styles';
import { useProperties } from '@/src/hooks/useProperties';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useAnnouncementAdmin } from '@/src/features/announcements/hooks/useAnnouncementAdmin';
import { AnnouncementComposer } from '@/src/features/announcements/components/AnnouncementComposer';
import { AnnouncementHistoryList } from '@/src/features/announcements/components/AnnouncementHistoryList';

interface AnnouncementAdminScreenProps {
  onLogout?: () => void;
}

export default function AnnouncementAdminScreen({ onLogout }: AnnouncementAdminScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { isDesktop, isTablet, isMobile } = useResponsive();
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

  const composer = (
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
  );

  const historyList = (
    <AnnouncementHistoryList
      properties={properties}
      historyPropertyId={historyPropertyId}
      setHistoryPropertyId={setHistoryPropertyId}
      announcements={announcements}
      loadingAnnouncements={loadingAnnouncements}
    />
  );

  return (
    <PageShell scrollable edges={isDesktop ? ['top'] : []} onScroll={handleScroll}>
      <View style={styles.inner}>
        {/* Desktop & Tablet Header */}
        {!isMobile && (
          <View style={styles.headerSection}>
            <Text style={styles.kicker}>COMMUNICATION & NOTICES</Text>
            <Text style={styles.pageTitle}>Announcement Management</Text>
            <Text style={styles.pageSubtitle}>
              Broadcast notices, building alerts, and scheduled maintenance bulletins to residents.
            </Text>
          </View>
        )}

        {/* Mobile Header Toggle */}
        {isMobile && (
          <View style={styles.mobileToggleBar}>
            <Text style={styles.mobileSubtitle}>Broadcast notices & alerts</Text>
            <TouchableOpacity
              style={styles.toggleHistoryBtn}
              onPress={() => setShowHistory(!showHistory)}
              activeOpacity={0.75}
            >
              <MaterialIcons name={showHistory ? 'edit' : 'history'} size={18} color={theme.Colors.primary} />
              <Text style={styles.toggleHistoryText}>{showHistory ? 'Compose' : 'History'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Layout according to resolution */}
        {isDesktop ? (
          <View style={styles.grid}>
            <View style={styles.composerColumn}>{composer}</View>
            <View style={styles.historyColumn}>{historyList}</View>
          </View>
        ) : isTablet ? (
          <View style={styles.gridStacked}>
            <View style={styles.composerColumn}>{composer}</View>
            <View style={styles.historyColumn}>{historyList}</View>
          </View>
        ) : (
          <View style={styles.composerColumn}>
            {showHistory ? historyList : composer}
          </View>
        )}
      </View>
    </PageShell>
  );
}
