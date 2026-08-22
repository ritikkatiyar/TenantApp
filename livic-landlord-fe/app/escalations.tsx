import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useIssues } from '@/src/features/issues/hooks/useIssues';
import { useProperties } from '@/src/hooks/useProperties';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import IssueDetailModal from '@/src/features/issues/components/IssueDetailModal';
import { Theme } from '@/src/theme/Theme';

export default function EscalationsScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { accessToken } = useAuth();
  const { properties } = useProperties();
  const { handleScroll } = useScrollNav();
  const scrollY = useRef(new Animated.Value(0)).current;

  const {
    issues,
    isLoading,
    error,
    page,
    setPage,
    totalPages,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
    propertyFilter,
    setPropertyFilter,
    metrics,
    refresh
  } = useIssues(accessToken);

  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Set default property selection if none active
  useEffect(() => {
    if (!propertyFilter && properties && properties.length > 0) {
      setPropertyFilter(properties[0].id);
    }
  }, [properties, propertyFilter, setPropertyFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { bg: '#fee2e2', text: '#ef4444' };
      case 'HIGH':
        return { bg: '#fef3c7', text: '#d97706' };
      case 'STANDARD':
        return { bg: '#e0f2fe', text: '#0284c7' };
      default:
        return { bg: '#f3f4f6', text: '#4b5563' };
    }
  };

  const getStatusColor = (status: string, escStatus?: string) => {
    if (escStatus === 'ESCALATED') {
      return { bg: '#fee2e2', text: '#ef4444', label: 'ESCALATED' };
    }
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return { bg: '#d1fae5', text: theme.Colors.primary, label: status };
      case 'IN_PROGRESS':
        return { bg: '#fef3c7', text: '#d97706', label: 'IN PROGRESS' };
      default:
        return { bg: '#e0f2fe', text: '#0284c7', label: 'OPEN' };
    }
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ');
  };

  const renderGlassyHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: insets.top, height: 56 + insets.top }]}>
      <BlurView intensity={45} tint="light" style={StyleSheet.absoluteFillObject} />
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color={theme.Colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.titleWrapper}>
          <Text style={styles.compactTitleText}>Escalations</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {isDesktop ? (
          <DesktopNavBar
            properties={properties || []}
            selectedPropertyId={propertyFilter}
            onPropertyChange={setPropertyFilter}
          />
        ) : (
          renderGlassyHeader()
        )}

        <Animated.ScrollView
          contentContainerStyle={[
            isDesktop ? styles.desktopScroll : styles.mobileScroll,
            !isDesktop && { paddingTop: 68 + insets.top }
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false, listener: handleScroll }
          )}
          scrollEventThrottle={16}
        >
          <View style={isDesktop ? styles.desktopInner : null}>
            
            {/* Header Titles */}
            {isDesktop && (
              <View style={styles.titleContainer}>
                <Text style={styles.titleLineDesktop}>Escalations & Issues</Text>
                <Text style={styles.subtitle}>Track resident maintenance reports, safety alerts, and SLA violations.</Text>
              </View>
            )}

            {/* Metrics Dashboard Row */}
            <View style={styles.metricsRow}>
              <BlurView intensity={60} tint="light" style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Tickets</Text>
                <Text style={[styles.metricValue, { color: theme.Colors.primary }]}>{metrics.total}</Text>
              </BlurView>
              <BlurView intensity={60} tint="light" style={styles.metricCard}>
                <Text style={styles.metricLabel}>Open Issues</Text>
                <Text style={[styles.metricValue, { color: '#0284c7' }]}>{metrics.open}</Text>
              </BlurView>
              <BlurView intensity={60} tint="light" style={styles.metricCard}>
                <Text style={styles.metricLabel}>In Progress</Text>
                <Text style={[styles.metricValue, { color: '#d97706' }]}>{metrics.inProgress}</Text>
              </BlurView>
              <BlurView intensity={60} tint="light" style={styles.metricCard}>
                <Text style={styles.metricLabel}>Escalated</Text>
                <Text style={[styles.metricValue, { color: theme.Colors.error }]}>{metrics.escalated}</Text>
              </BlurView>
            </View>

            {/* Search Box */}
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color={theme.Colors.onSurfaceVariant} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by ticket #, title, or description..."
                placeholderTextColor={theme.Colors.onSurfaceVariant}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Badges Row: Status */}
            <View style={styles.filtersContainer}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabelText}>Status:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  {['ALL', 'OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED'].map(st => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.filterPill, statusFilter === st && styles.filterPillActive]}
                      onPress={() => setStatusFilter(st)}
                    >
                      <Text style={[styles.filterText, statusFilter === st && styles.filterTextActive]}>
                        {st.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Filter Badges Row: Priority */}
            <View style={styles.filtersContainer}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabelText}>Priority:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  {['ALL', 'LOW', 'STANDARD', 'HIGH', 'URGENT'].map(pr => (
                    <TouchableOpacity
                      key={pr}
                      style={[styles.filterPill, priorityFilter === pr && styles.filterPillActive]}
                      onPress={() => setPriorityFilter(pr)}
                    >
                      <Text style={[styles.filterText, priorityFilter === pr && styles.filterTextActive]}>
                        {pr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Content List */}
            {isLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.Colors.primary} />
              </View>
            ) : error ? (
              <BlurView intensity={60} tint="light" style={styles.emptyCard}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.filterButton} onPress={refresh}>
                  <Text style={styles.filterButtonText}>Retry</Text>
                </TouchableOpacity>
              </BlurView>
            ) : issues.length === 0 ? (
              <BlurView intensity={60} tint="light" style={styles.emptyCard}>
                <MaterialIcons name="report-off" size={48} color={theme.Colors.onSurfaceVariant} />
                <Text style={styles.emptyTitle}>No issues logged</Text>
                <Text style={styles.emptySubtitle}>No matching reported issues or maintenance requests found for this property.</Text>
              </BlurView>
            ) : (
              <View style={styles.listContainer}>
                {issues.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setSelectedIssueId(item.id)}
                    activeOpacity={0.8}
                  >
                    <BlurView intensity={40} tint="light" style={styles.mobileCard}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardUnitText}>{item.ticketNumber}</Text>
                        <View
                          style={[
                            styles.pill,
                            { backgroundColor: getStatusColor(item.status, item.escalationStatus).bg }
                          ]}
                        >
                          <Text
                            style={[
                              styles.pillText,
                              { color: getStatusColor(item.status, item.escalationStatus).text }
                            ]}
                          >
                            {getStatusColor(item.status, item.escalationStatus).label}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.cardTitleText}>{item.title}</Text>
                      <Text style={styles.cardDescText} numberOfLines={2}>
                        {item.description}
                      </Text>

                      <View style={styles.cardFooterRow}>
                        <View
                          style={[
                            styles.pill,
                            { backgroundColor: getPriorityColor(item.priority).bg }
                          ]}
                        >
                          <Text
                            style={[
                              styles.pillText,
                              { color: getPriorityColor(item.priority).text }
                            ]}
                          >
                            {item.priority}
                          </Text>
                        </View>
                        <Text style={styles.cardDateText}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  onPress={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={[styles.pageButton, page === 0 && styles.pageButtonDisabled]}
                >
                  <MaterialIcons name="chevron-left" size={24} color={page === 0 ? '#b0bec5' : '#006875'} />
                </TouchableOpacity>
                <Text style={styles.pageText}>
                  Page {page + 1} of {totalPages}
                </Text>
                <TouchableOpacity
                  onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={[styles.pageButton, page >= totalPages - 1 && styles.pageButtonDisabled]}
                >
                  <MaterialIcons name="chevron-right" size={24} color={page >= totalPages - 1 ? '#b0bec5' : '#006875'} />
                </TouchableOpacity>
              </View>
            )}

          </View>
          <View style={{ height: 120 }} />
        </Animated.ScrollView>
      </SafeAreaView>

      <IssueDetailModal
        visible={!!selectedIssueId}
        issueId={selectedIssueId}
        token={accessToken}
        onClose={() => setSelectedIssueId(null)}
        onUpdate={refresh}
      />
    </LinearGradient>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    zIndex: 999,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden'
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center'
  },
  compactTitleText: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.BodyLarge.fontSize,
    fontWeight: '800',
    letterSpacing: 1
  },
  mobileScroll: {
    paddingHorizontal: 24,
    paddingTop: 76,
    paddingBottom: 60
  },
  desktopScroll: {
    paddingVertical: 24,
    paddingHorizontal: 40,
    alignItems: 'center'
  },
  desktopInner: {
    width: '100%',
    maxWidth: 1080
  },
  titleContainer: {
    marginTop: 16,
    marginBottom: 24
  },
  titleLineDesktop: {
    fontSize: theme.Typography.headlineLg.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
    lineHeight: 38,
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 20
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  metricCard: {
    flex: 1,
    minWidth: 120,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  metricLabel: {
    fontSize: theme.Typography.BodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: 4
  },
  metricValue: {
    fontSize: theme.Typography.HeadlineSmall.fontSize,
    fontWeight: '800'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginBottom: 16
  },
  searchInput: {
    flex: 1,
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.BodyMedium.fontSize,
    outlineWidth: 0,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap'
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  filterLabelText: {
    fontSize: theme.Typography.BodySmall.fontSize,
    fontWeight: '700',
    color: theme.Colors.primary,
    width: 60
  },
  filterScroll: {
    gap: 8
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)'
  },
  filterPillActive: {
    backgroundColor: theme.Colors.primary
  },
  filterText: {
    fontSize: theme.Typography.BodySmall.fontSize,
    color: '#2e3a3c',
    fontWeight: '600'
  },
  filterTextActive: {
    color: theme.Colors.surfaceContainerLowest
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.error,
    textAlign: 'center',
    marginBottom: 16
  },
  emptyCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    marginTop: 20
  },
  emptyTitle: {
    fontSize: theme.Typography.bodyLg.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
    marginTop: 12,
    marginBottom: 6
  },
  emptySubtitle: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320
  },
  listContainer: {
    gap: 16
  },
  mobileCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  cardUnitText: {
    fontSize: theme.Typography.BodyLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface
  },
  cardTitleText: {
    fontSize: theme.Typography.BodyLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
    marginBottom: 6
  },
  cardDescText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 10
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  cardDateText: {
    fontSize: theme.Typography.BodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  pillText: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '800'
  },
  filterButton: {
    backgroundColor: theme.Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterButtonText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700'
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 24,
    marginBottom: 20
  },
  pageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  pageButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)'
  },
  pageText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface
  }
});
