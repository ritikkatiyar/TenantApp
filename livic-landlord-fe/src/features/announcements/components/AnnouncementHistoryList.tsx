import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import type { Announcement } from '@/src/features/announcements/api/announcement.api';
import type { PropertyResponse } from '@/src/types/property';

interface AnnouncementHistoryListProps {
  properties: PropertyResponse[];
  historyPropertyId: string | null;
  setHistoryPropertyId: (val: string | null) => void;
  announcements: Announcement[];
  loadingAnnouncements: boolean;
}

export function AnnouncementHistoryList({
  properties,
  historyPropertyId,
  setHistoryPropertyId,
  announcements,
  loadingAnnouncements,
}: AnnouncementHistoryListProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#ba1a1a';
      case 'WARNING': return '#e28743';
      default: return theme.Colors.primary;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'MAINTENANCE': return 'build';
      case 'EMERGENCY': return 'error';
      case 'BILLING': return 'payment';
      case 'EVENT': return 'event';
      default: return 'campaign';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.card}>
      <Text style={styles.sectionHeader}>BROADCAST HISTORY</Text>

      {/* History Property Select Dropdown */}
      <Text style={styles.composerLabel}>FILTER BY PROPERTY</Text>
      <GlassDropdown
        options={properties.map((p) => ({ label: p.name, value: p.id }))}
        value={historyPropertyId}
        onChange={setHistoryPropertyId}
        placeholder="Filter Property"
        icon="domain"
      />

      <View style={styles.listContainer}>
        {loadingAnnouncements ? (
          <ActivityIndicator size="small" color={theme.Colors.primary} style={{ marginVertical: 32 }} />
        ) : !Array.isArray(announcements) || announcements.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="notifications-none" size={32} color="#6b7a7d" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>No announcement logs for this property.</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {(announcements || []).map((item) => {
              const sevColor = getSeverityColor(item.severity);
              const catIcon = getCategoryIcon(item.category);
              
              return (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyTitleRow}>
                      <View style={[styles.categoryIconCircle, { backgroundColor: `${sevColor}15` }]}>
                        <MaterialIcons name={catIcon} size={18} color={sevColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyTitle}>{item.title}</Text>
                        <Text style={styles.historyMeta}>
                          {item.category} • {item.targetType} {
                            item.targetType === 'FLOOR' && item.targetFloorNumber != null ? `(Floor ${item.targetFloorNumber})` :
                            item.targetType === 'UNIT' && item.targetUnitId != null ? `(Unit ${item.targetUnitId})` : ''
                          }
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: sevColor }]}>
                      <Text style={styles.severityText}>{item.severity}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.historyContent}>{item.content}</Text>
                  
                  <View style={styles.historyFooter}>
                    <Text style={styles.historySender}>By {item.creatorName || 'Manager'}</Text>
                    <Text style={styles.historyTime}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </BlurView>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  composerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 18,
    fontFamily: 'Inter',
  },
  listContainer: {
    marginTop: 20,
    minHeight: 200,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 13,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  scrollContent: {
    gap: 16,
  },
  historyCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1.5,
    borderColor: theme.Colors.glassStroke,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.Colors.onBackground,
    fontFamily: 'Inter',
  },
  historyMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
    marginTop: 2,
    fontFamily: 'Inter',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#fff',
    fontFamily: 'Inter',
  },
  historyContent: {
    fontSize: 13,
    color: '#394648',
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 104, 117, 0.05)',
    paddingTop: 10,
  },
  historySender: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    fontFamily: 'Inter',
  },
  historyTime: {
    fontSize: 10,
    color: '#8b9ea1',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
