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

import { Theme } from '@/src/theme/Theme';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { createAnnouncement, getAnnouncements, Announcement } from '@/src/features/announcements/api/announcement.api';

const LUMINOUS_BACKGROUND = ['#d4f5f9', '#e8f8fb', '#e2e0fb'] as const;
const CATEGORY_OPTIONS = ['GENERAL', 'MAINTENANCE', 'EMERGENCY', 'BILLING', 'EVENT'] as const;
const SEVERITY_OPTIONS = [
  { val: 'INFO' as const, color: '#0072ff' },
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
  const [showHistory, setShowHistory] = useState(false);
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
    <BlurView intensity={40} tint="light" style={[styles.sectionCard, isDesktop && { flex: 1 }]}>
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
        {properties.length === 0 ? (
          <Text style={styles.emptyStateText}>No properties available yet.</Text>
        ) : (
          <View style={styles.segmentContainer}>
            {properties.map((property) => {
              const isActive = selectedPropertyId === property.id;
              return (
                <TouchableOpacity
                  key={property.id}
                  style={styles.segmentButtonWrapper}
                  onPress={() => setSelectedPropertyId(property.id)}
                  activeOpacity={0.8}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={['#00d4ff', '#0072ff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.segmentButtonGradient}
                    >
                      <Text style={styles.segmentTextActive} numberOfLines={1}>{property.name}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.segmentButtonInactive}>
                      <Text style={styles.segmentText} numberOfLines={1}>{property.name}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
    </BlurView>
  );

  const renderOptions = () => (
    <BlurView intensity={40} tint="light" style={[styles.sectionCard, isDesktop && { flex: 1 }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderCopy}>
          <Text style={styles.eyebrow}>BROADCAST SETTINGS</Text>
          <Text style={styles.sectionTitle}>Target & Category</Text>
          <Text style={styles.sectionSubtitle}>Define who sees this notice and how it is flagged.</Text>
        </View>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => setShowHistory(true)}
          activeOpacity={0.7}
        >
          <MaterialIcons name="history" size={22} color="#0072ff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.inputLabel}>CATEGORY</Text>
      <View style={styles.segmentContainer}>
        {CATEGORY_OPTIONS.map((category) => {
          const isActive = broadcastCategory === category;
          return (
            <TouchableOpacity
              key={category}
              style={styles.segmentButtonWrapper}
              onPress={() => setBroadcastCategory(category)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <LinearGradient
                  colors={['#00d4ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.segmentButtonGradient}
                >
                  <Text style={styles.segmentTextActive}>{category}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.segmentButtonInactive}>
                  <Text style={styles.segmentText}>{category}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.inputLabel, { marginTop: 18 }]}>SEVERITY LEVEL</Text>
      <View style={styles.segmentContainer}>
        {SEVERITY_OPTIONS.map(({ val, color }) => {
          const isActive = broadcastSeverity === val;
          return (
            <TouchableOpacity
              key={val}
              style={styles.segmentButtonWrapper}
              onPress={() => setBroadcastSeverity(val)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <LinearGradient
                  colors={val === 'CRITICAL' ? ['#ba1a1a', '#7d0e0e'] : ['#00d4ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.segmentButtonGradient}
                >
                  <View style={styles.segmentRow}>
                    <MaterialIcons
                      name={val === 'INFO' ? 'info-outline' : val === 'WARNING' ? 'warning-amber' : 'priority-high'}
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.segmentTextActive}>{val}</Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.segmentButtonInactive}>
                  <View style={styles.segmentRow}>
                    <MaterialIcons
                      name={val === 'INFO' ? 'info-outline' : val === 'WARNING' ? 'warning-amber' : 'priority-high'}
                      size={16}
                      color={color}
                    />
                    <Text style={[styles.segmentText, { color }]}>{val}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.inputLabel, { marginTop: 18 }]}>RECIPIENT SCOPE</Text>
      <View style={styles.segmentContainer}>
        {(['PROPERTY', 'FLOOR', 'UNIT'] as const).map((scope) => {
          const isActive = broadcastTargetType === scope;
          return (
            <TouchableOpacity
              key={scope}
              style={styles.segmentButtonWrapper}
              onPress={() => setBroadcastTargetType(scope)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <LinearGradient
                  colors={['#00d4ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.segmentButtonGradient}
                >
                  <Text style={styles.segmentTextActive}>{scope}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.segmentButtonInactive}>
                  <Text style={styles.segmentText}>{scope}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {broadcastTargetType !== 'PROPERTY' && (
        <View style={[styles.formGroup, { marginTop: 18 }]}>
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

      {!isDesktop && (
        <TouchableOpacity
          style={[styles.sendButton, sendingBroadcast && styles.sendButtonDisabled, { marginTop: 20 }]}
          onPress={handleSendBroadcast}
          disabled={sendingBroadcast || !selectedPropertyId || propertiesLoading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={broadcastSeverity === 'CRITICAL' ? ['#ba1a1a', '#7d0e0e'] : ['#00d4ff', '#0072ff']}
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
      )}
    </BlurView>
  );

  const renderHistory = () => (
    <BlurView intensity={40} tint="light" style={[styles.sectionCard, isDesktop && { flex: 1 }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderCopy}>
          <Text style={styles.eyebrow}>ARCHIVE</Text>
          <Text style={styles.sectionTitle}>Past Announcements</Text>
          <Text style={styles.sectionSubtitle}>Review notices previously shared with residents.</Text>
        </View>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setShowHistory(false)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="tune" size={22} color="#0072ff" />
          </TouchableOpacity>
          <View style={styles.statsBadge}>
            <Text style={styles.statsBadgeText}>{activeHistoryPropertyName}</Text>
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        {properties.length === 0 ? (
          <Text style={styles.emptyStateText}>No properties available yet.</Text>
        ) : (
          <View style={styles.segmentContainer}>
            {properties.map((property) => {
              const isActive = historyPropertyId === property.id;
              return (
                <TouchableOpacity
                  key={property.id}
                  style={styles.segmentButtonWrapper}
                  onPress={() => setHistoryPropertyId(property.id)}
                  activeOpacity={0.8}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={['#00d4ff', '#0072ff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.segmentButtonGradient}
                    >
                      <Text style={styles.segmentTextActive} numberOfLines={1}>{property.name}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.segmentButtonInactive}>
                      <Text style={styles.segmentText} numberOfLines={1}>{property.name}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
      ) : isDesktop ? (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginTop: 12 }}>
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
        </ScrollView>
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
    </BlurView>
  );

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
                <TouchableOpacity style={styles.topIcon} onPress={() => router.push('/escalations')}><Ionicons name="notifications-outline" size={23} color={Theme.Colors.onSurface} /></TouchableOpacity>
              </>
            }
          />

            <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
              <View style={styles.desktopInner}>
                <View style={styles.pageHeaderRow}>
                  <View>
                    <Text style={styles.pageTitle}>Announcement Management</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.desktopSaveButtonWrapper}
                    onPress={handleSendBroadcast}
                    disabled={sendingBroadcast || !selectedPropertyId || propertiesLoading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={broadcastSeverity === 'CRITICAL' ? ['#ba1a1a', '#7d0e0e'] : ['#00d4ff', '#0072ff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.desktopSaveButton}
                    >
                      {sendingBroadcast ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.desktopSaveButtonText}>Broadcast Now</Text>
                          <MaterialIcons name="campaign" size={18} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <View style={[styles.desktopGrid, !useTwoColumnLayout && styles.desktopGridStacked]}>
                  <View style={styles.composerColumn}>{renderComposer()}</View>
                  <View style={styles.historyColumn}>
                    {showHistory ? renderHistory() : renderOptions()}
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.mobileHeader}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.mobileTitle}>Announcements</Text>
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
          {showHistory ? (
            renderHistory()
          ) : (
            <>
              {renderComposer()}
              {renderOptions()}
            </>
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
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
    marginTop: 4,
  },
  segmentButtonWrapper: {
    flex: 1,
    minWidth: 0,
  },
  segmentButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonInactive: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
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
