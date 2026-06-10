import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Href, useRouter } from 'expo-router';

import { Theme } from '../theme/Theme';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../auth/AuthProvider';
import { createAnnouncement, getAnnouncements, Announcement } from '../api/announcement.api';

const LUMINOUS_BACKGROUND = ['#f4f8f8', '#eef5f5', '#f8faf9'] as const;
const CATEGORY_OPTIONS = ['GENERAL', 'MAINTENANCE', 'EMERGENCY', 'BILLING', 'EVENT'] as const;
const SEVERITY_OPTIONS = [
  { val: 'INFO' as const, color: '#006875' },
  { val: 'WARNING' as const, color: '#e28743' },
  { val: 'CRITICAL' as const, color: '#ba1a1a' },
];

interface AnnouncementAdminScreenProps {
  onLogout: () => void;
}

export default function AnnouncementAdminScreen({ onLogout }: AnnouncementAdminScreenProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isWideDesktop = width >= 1200;
  const useTwoColumnLayout = width >= 1500;
  const { user, accessToken } = useAuth();
  const { properties, isLoading: propertiesLoading } = useProperties();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [historyPropertyId, setHistoryPropertyId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState<typeof CATEGORY_OPTIONS[number]>('GENERAL');
  const [broadcastSeverity, setBroadcastSeverity] = useState<typeof SEVERITY_OPTIONS[number]['val']>('INFO');
  const [broadcastTargetType, setBroadcastTargetType] = useState<'PROPERTY' | 'FLOOR' | 'UNIT'>('PROPERTY');
  const [broadcastTargetValue, setBroadcastTargetValue] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  useEffect(() => {
    if (properties.length && !properties.some((property) => property.id === selectedPropertyId)) {
      setSelectedPropertyId(properties[0].id);
    }
    if (properties.length && !properties.some((property) => property.id === historyPropertyId)) {
      setHistoryPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId, historyPropertyId]);

  const propertyMap = useMemo(
    () => new Map(properties.map((property) => [property.id, property.name])),
    [properties]
  );

  const activeHistoryPropertyName = useMemo(() => {
    if (!historyPropertyId) return 'No Property Selected';
    return propertyMap.get(historyPropertyId) || 'Unknown Property';
  }, [historyPropertyId, propertyMap]);

  const activeBroadcastPropertyName = useMemo(() => {
    if (!selectedPropertyId) return 'No Property Selected';
    return propertyMap.get(selectedPropertyId) || 'Selected Property';
  }, [selectedPropertyId, propertyMap]);

  const loadAnnouncements = useCallback(async () => {
    if (!accessToken || !historyPropertyId) {
      if (!propertiesLoading && properties.length === 0) {
        setLoadingAnnouncements(false);
      }
      return;
    }

    setLoadingAnnouncements(true);
    try {
      const data = await getAnnouncements(accessToken, historyPropertyId);
      setAnnouncements(data);
    } catch (error) {
      console.error('[Announcements] Failed to load history:', error);
      Alert.alert('Error', 'Unable to load announcement history.');
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [accessToken, historyPropertyId, properties.length, propertiesLoading]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const resetComposer = () => {
    setBroadcastTitle('');
    setBroadcastContent('');
    setBroadcastCategory('GENERAL');
    setBroadcastSeverity('INFO');
    setBroadcastTargetType('PROPERTY');
    setBroadcastTargetValue('');
  };

  const handleSendBroadcast = async () => {
    if (!accessToken) {
      Alert.alert('Authentication', 'You must be signed in to send announcements.');
      return;
    }

    if (!selectedPropertyId) {
      Alert.alert('Property', 'Select a property before sending an announcement.');
      return;
    }

    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      Alert.alert('Validation', 'Title and content are required.');
      return;
    }

    if (broadcastTargetType !== 'PROPERTY' && !broadcastTargetValue.trim()) {
      Alert.alert('Validation', 'Please enter a target floor or unit value.');
      return;
    }

    setSendingBroadcast(true);
    try {
      await createAnnouncement(accessToken, {
        propertyId: selectedPropertyId,
        title: broadcastTitle.trim(),
        content: broadcastContent.trim(),
        category: broadcastCategory,
        severity: broadcastSeverity,
        targetType: broadcastTargetType,
        targetValue: broadcastTargetType !== 'PROPERTY' ? broadcastTargetValue.trim() : undefined,
      });

      Alert.alert('Success', 'Announcement broadcasted successfully.');
      resetComposer();
      await loadAnnouncements();
    } catch (error: any) {
      console.error('[Broadcast] Error sending announcement:', error);
      Alert.alert('Error', error?.message || 'Failed to send announcement.');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const renderSidebarLink = (icon: keyof typeof MaterialIcons.glyphMap, label: string, active = false, route?: Href) => (
    <TouchableOpacity
      style={[styles.sidebarLink, active && styles.sidebarLinkActive]}
      onPress={route ? () => router.push(route) : undefined}
      activeOpacity={route ? 0.75 : 1}
    >
      <MaterialIcons name={icon} size={22} color={active ? Theme.Colors.primary : Theme.Colors.onSurfaceVariant} />
      <Text style={[styles.sidebarLinkText, active && styles.sidebarLinkTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderComposer = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderCopy}>
          <Text style={styles.eyebrow}>NEW ANNOUNCEMENT</Text>
          <Text style={styles.sectionTitle}>Compose Broadcast</Text>
          <Text style={styles.sectionSubtitle}>Reach your tenants instantly with a clear, transparent update.</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.statsBadge}>
            <Text style={styles.statsBadgeText}>{activeBroadcastPropertyName}</Text>
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>RECIPIENT PROPERTY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {properties.map((property) => (
            <TouchableOpacity
              key={property.id}
              style={[styles.chip, selectedPropertyId === property.id && styles.chipActive]}
              onPress={() => setSelectedPropertyId(property.id)}
            >
              <Text style={[styles.chipText, selectedPropertyId === property.id && styles.chipTextActive]} numberOfLines={1}>
                {property.name}
              </Text>
            </TouchableOpacity>
          ))}
          {properties.length === 0 && (
            <Text style={styles.emptyStateText}>No properties available yet.</Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>ANNOUNCEMENT TITLE</Text>
        <TextInput
          style={styles.textInput}
          value={broadcastTitle}
          onChangeText={setBroadcastTitle}
          placeholder="e.g. Scheduled Water Maintenance"
          placeholderTextColor="#8c9a9f"
          maxLength={255}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>MESSAGE CONTENT</Text>
        <TextInput
          style={[styles.textInput, styles.textarea]}
          value={broadcastContent}
          onChangeText={setBroadcastContent}
          placeholder="Provide detailed information for the tenants here..."
          placeholderTextColor="#8c9a7a"
          multiline
          textAlignVertical="top"
          numberOfLines={5}
        />
      </View>

      <Text style={styles.inputLabel}>CATEGORY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {CATEGORY_OPTIONS.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.chip, broadcastCategory === category && styles.chipActive]}
            onPress={() => setBroadcastCategory(category)}
          >
            <Text style={[styles.chipText, broadcastCategory === category && styles.chipTextActive]}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[styles.inputLabel, { marginTop: 18 }]}>SEVERITY LEVEL</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {SEVERITY_OPTIONS.map(({ val, color }) => (
          <TouchableOpacity
            key={val}
            style={[
              styles.chip,
              broadcastSeverity === val && { ...styles.chipActive, backgroundColor: color, borderColor: color },
            ]}
            onPress={() => setBroadcastSeverity(val)}
          >
            <MaterialIcons
              name={val === 'INFO' ? 'info-outline' : val === 'WARNING' ? 'warning-amber' : 'priority-high'}
              size={17}
              color={broadcastSeverity === val ? '#fff' : color}
            />
            <Text style={[styles.chipText, broadcastSeverity === val && styles.chipTextActive]}>{val}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[styles.inputLabel, { marginTop: 18 }]}>RECIPIENT SCOPE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {(['PROPERTY', 'FLOOR', 'UNIT'] as const).map((scope) => (
          <TouchableOpacity
            key={scope}
            style={[styles.chip, broadcastTargetType === scope && styles.chipActive]}
            onPress={() => setBroadcastTargetType(scope)}
          >
            <Text style={[styles.chipText, broadcastTargetType === scope && styles.chipTextActive]}>{scope}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {broadcastTargetType !== 'PROPERTY' && (
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>{broadcastTargetType === 'FLOOR' ? 'Floor number' : 'Unit ID'}</Text>
          <TextInput
            style={styles.textInput}
            value={broadcastTargetValue}
            onChangeText={setBroadcastTargetValue}
            placeholder={broadcastTargetType === 'FLOOR' ? 'e.g. 3' : 'e.g. H-101'}
            placeholderTextColor="#8c9a9f"
            keyboardType={broadcastTargetType === 'FLOOR' ? 'numeric' : 'default'}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.sendButton, sendingBroadcast && styles.sendButtonDisabled]}
        onPress={handleSendBroadcast}
        disabled={sendingBroadcast || !selectedPropertyId || propertiesLoading}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={broadcastSeverity === 'CRITICAL' ? ['#ba1a1a', '#7d0e0e'] : ['#006875', '#00bcd4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.sendButtonGradient}
        >
          {sendingBroadcast ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="campaign" size={21} color="#fff" />
              <Text style={styles.sendButtonText}>Broadcast Now</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderCopy}>
          <Text style={styles.eyebrow}>ARCHIVE</Text>
          <Text style={styles.sectionTitle}>Past Announcements</Text>
          <Text style={styles.sectionSubtitle}>Review notices previously shared with residents.</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.statsBadge}>
            <Text style={styles.statsBadgeText}>{activeHistoryPropertyName}</Text>
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {properties.map((property) => (
            <TouchableOpacity
              key={property.id}
              style={[styles.chip, historyPropertyId === property.id && styles.chipActive]}
              onPress={() => setHistoryPropertyId(property.id)}
            >
              <Text style={[styles.chipText, historyPropertyId === property.id && styles.chipTextActive]} numberOfLines={1}>
                {property.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loadingAnnouncements ? (
        <View style={styles.centerRow}>
          <ActivityIndicator color={Theme.Colors.primary} />
        </View>
      ) : announcements.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <MaterialIcons name="notifications-none" size={28} color="#6b7a7d" />
          <Text style={styles.emptyStateText}>No announcements have been published yet.</Text>
        </View>
      ) : (
        <View style={styles.historyList}>
          {announcements.map((announcement) => (
            <View key={announcement.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(announcement.category) }]}>
                  <Text style={styles.categoryText}>{announcement.category}</Text>
                </View>
                <Text style={styles.historyMeta}>{propertyMap.get(announcement.propertyId) || announcement.propertyId}</Text>
              </View>
              <Text style={styles.historyTitle}>{announcement.title}</Text>
              <Text style={styles.historyContent} numberOfLines={2}>{announcement.content}</Text>
              <View style={styles.historyFooter}>
                <Text style={styles.historyTimestamp}>{formatTimestamp(announcement.createdAt)}</Text>
                <Text style={styles.historyBadge}>{announcement.severity}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const DesktopShell = () => (
    <LinearGradient colors={LUMINOUS_BACKGROUND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <View style={styles.desktopShell}>
        <BlurView intensity={90} tint="light" style={styles.sidebar}>
          <View style={styles.sidebarBrand}>
            <Text style={styles.sidebarBrandTitle}>TenantPortal</Text>
            <Text style={styles.sidebarBrandSub}>PROPERTY MANAGEMENT</Text>
          </View>

          <View style={styles.sidebarNav}>
            {renderSidebarLink('dashboard', 'Dashboard', false, '/analytics')}
            {renderSidebarLink('business', 'Properties', false, '/command-center')}
            {renderSidebarLink('build', 'Maintenance', false, '/command-center')}
            {renderSidebarLink('build', 'Escalations', false, '/escalations')}
            {renderSidebarLink('campaign', 'Announcements', true, '/announcements')}
            {renderSidebarLink('payments', 'Payments', false, '/expenses')}
          </View>

          <View style={styles.sidebarFooter}>
            <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/billing')} activeOpacity={0.85}>
              <LinearGradient colors={[Theme.Colors.primary, Theme.Colors.secondaryContainer]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upgradeGradient}>
              <Text style={styles.upgradeText}>MANAGE BILLING</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarLink} onPress={onLogout}>
              <MaterialIcons name="logout" size={22} color={Theme.Colors.onSurfaceVariant} />
              <Text style={styles.sidebarLinkText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </BlurView>

        <View style={styles.desktopMain}>
          <BlurView intensity={70} tint="light" style={styles.topbar}>
            {isWideDesktop ? (
              <View style={styles.topbarTabs}>
                <TouchableOpacity onPress={() => router.push('/analytics')}><Text style={styles.topbarTab}>Dashboard</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/command-center')}><Text style={styles.topbarTab}>Properties</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/analytics')}><Text style={styles.topbarTab}>Reports</Text></TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.compactTopbarTitle}>Announcements</Text>
            )}
            <View style={styles.topbarRight}>
              {isWideDesktop && (
                <BlurView intensity={50} tint="light" style={styles.searchBox}>
                  <MaterialIcons name="search" size={22} color="#6b7a7d" />
                  <Text style={styles.searchPlaceholder}>Search announcements...</Text>
                </BlurView>
              )}
              <TouchableOpacity style={styles.topIcon} onPress={() => router.push('/escalations')}><Ionicons name="notifications-outline" size={23} color={Theme.Colors.onSurface} /></TouchableOpacity>
              <TouchableOpacity style={styles.topIcon} onPress={onLogout}><MaterialIcons name="settings" size={24} color={Theme.Colors.onSurface} /></TouchableOpacity>
              <View style={styles.avatar}><Text style={styles.avatarText}>{user?.fullName?.[0] || 'A'}</Text></View>
            </View>
          </BlurView>

          <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
            <View style={styles.desktopInner}>
              <View style={styles.pageHeader}>
                <View>
                  <Text style={styles.pageTitle}>Announcement Management</Text>
                  <Text style={styles.pageSubtitle}>Broadcast updates and maintain resident transparency.</Text>
                </View>
              </View>
              <View style={[styles.desktopGrid, !useTwoColumnLayout && styles.desktopGridStacked]}>
                <View style={styles.composerColumn}>{renderComposer()}</View>
                <View style={styles.historyColumn}>{renderHistory()}</View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </LinearGradient>
  );

  if (isDesktop) {
    return <DesktopShell />;
  }

  return (
    <LinearGradient colors={LUMINOUS_BACKGROUND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.mobileHeader}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.mobileTitle}>Announcements</Text>
            <Text style={styles.mobileSubtitle}>Create and review resident notices</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/escalations')}>
              <Ionicons name="notifications-outline" size={23} color={Theme.Colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
              <View style={styles.mobileAvatar}><Text style={styles.mobileAvatarText}>{user?.fullName?.[0] || 'A'}</Text></View>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mobileContent}>
          {renderComposer()}
          {renderHistory()}
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
      return '#006875';
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
    width: 280,
    height: '100%',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    overflow: 'hidden',
  },
  sidebarBrand: {
    marginBottom: 54,
  },
  sidebarBrandTitle: {
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 34,
    color: '#004b57',
  },
  sidebarBrandSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: Theme.Colors.onSurfaceVariant,
    marginTop: 4,
  },
  sidebarNav: {
    gap: 8,
  },
  sidebarLink: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 18,
    borderRadius: 4,
  },
  sidebarLinkActive: {
    backgroundColor: '#edf2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#00606b',
  },
  sidebarLinkText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: Theme.Colors.onSurface,
  },
  sidebarLinkTextActive: {
    color: '#004b57',
    fontWeight: '700',
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
    minHeight: 74,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.75)',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  topbarTabs: {
    flexDirection: 'row',
    gap: 20,
  },
  topbarTab: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Theme.Colors.onSurfaceVariant,
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
  pageTitle: {
    fontSize: 38,
    fontWeight: '700',
    color: '#004b57',
  },
  pageSubtitle: {
    marginTop: 4,
    fontSize: 16,
    color: Theme.Colors.onSurfaceVariant,
    maxWidth: 620,
  },
  sectionCard: {
    padding: 26,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  desktopGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    alignItems: 'stretch',
    marginBottom: 18,
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
    backgroundColor: '#e6f0f1',
    maxWidth: '100%',
  },
  statsBadgeText: {
    color: Theme.Colors.primary,
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
    borderColor: '#b9c8cb',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fbfdfd',
    color: Theme.Colors.onSurface,
    fontSize: 15,
  },
  textarea: {
    minHeight: 154,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    minHeight: 46,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#f7faf9',
    borderWidth: 1,
    borderColor: '#b8d3d7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  chipActive: {
    backgroundColor: '#006875',
    borderColor: '#006875',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#075664',
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
});
