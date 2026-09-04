import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useIssues } from '@/src/features/issues/hooks/useIssues';
import { useProperties } from '@/src/hooks/useProperties';
import { StatCard } from '@/src/components/common/display/StatCard';
import FilterPill from '@/src/components/common/inputs/FilterPill';
import IssueDetailModal from '@/src/features/issues/components/IssueDetailModal';
import Pagination from '@/src/components/common/navigation/Pagination';
import { createStyles } from './EscalationsScreen.styles';

export default function EscalationsScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { accessToken } = useAuth();
  const { properties } = useProperties();
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
    refresh,
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

  return (
    <PageShell scrollable={false} edges={isDesktop ? ['top'] : []}>

      <Animated.ScrollView
        contentContainerStyle={[
          isDesktop ? styles.desktopScroll : styles.mobileScroll,
          !isDesktop && { paddingTop: 68 + insets.top },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={isDesktop ? styles.desktopInner : null}>
          {/* Header Titles */}
          {isDesktop && (
            <View style={styles.titleContainer}>
              <Text style={styles.titleLineDesktop}>Escalations & Issues</Text>
              <Text style={styles.subtitle}>
                Track resident maintenance reports, safety alerts, and SLA violations.
              </Text>
            </View>
          )}

          {/* Metrics Dashboard Row */}
          <View style={styles.metricsRow}>
            <StatCard
              label="Total Tickets"
              value={metrics.total}
              loading={isLoading}
              iconName="confirmation-number"
              iconColor={theme.Colors.primary}
              valueColor={theme.Colors.primary}
              style={isDesktop ? { flex: 1 } : { flexBasis: '46%' }}
            />
            <StatCard
              label="Open Issues"
              value={metrics.open}
              loading={isLoading}
              iconName="error-outline"
              iconColor={theme.Colors.secondary}
              valueColor={isDark ? '#A78BFA' : theme.Colors.secondary}
              style={isDesktop ? { flex: 1 } : { flexBasis: '46%' }}
            />
            <StatCard
              label="In Progress"
              value={metrics.inProgress}
              loading={isLoading}
              iconName="pending-actions"
              iconColor={theme.Colors.tertiary}
              valueColor={theme.Colors.tertiary}
              style={isDesktop ? { flex: 1 } : { flexBasis: '46%' }}
            />
            <StatCard
              label="Escalated"
              value={metrics.escalated}
              loading={isLoading}
              iconName="warning"
              iconColor={theme.Colors.error}
              valueColor={theme.Colors.error}
              style={isDesktop ? { flex: 1 } : { flexBasis: '46%' }}
            />
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {['ALL', 'OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED'].map((st) => (
                  <FilterPill
                    key={st}
                    label={st.replace('_', ' ')}
                    active={statusFilter === st}
                    onPress={() => setStatusFilter(st)}
                    size="sm"
                  />
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Filter Badges Row: Priority */}
          <View style={styles.filtersContainer}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabelText}>Priority:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {['ALL', 'LOW', 'STANDARD', 'HIGH', 'URGENT'].map((pr) => (
                  <FilterPill
                    key={pr}
                    label={pr}
                    active={priorityFilter === pr}
                    onPress={() => setPriorityFilter(pr)}
                    size="sm"
                  />
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
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.emptyCard}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.filterButton} onPress={refresh}>
                <Text style={styles.filterButtonText}>Retry</Text>
              </TouchableOpacity>
            </BlurView>
          ) : issues.length === 0 ? (
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.emptyCard}>
              <MaterialIcons name="report-off" size={48} color={theme.Colors.onSurfaceVariant} />
              <Text style={styles.emptyTitle}>No issues logged</Text>
              <Text style={styles.emptySubtitle}>
                No matching reported issues or maintenance requests found for this property.
              </Text>
            </BlurView>
          ) : (
            <View style={styles.listContainer}>
              {issues.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedIssueId(item.id)}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.mobileCard}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardUnitText}>{item.ticketNumber}</Text>
                      <View
                        style={[
                          styles.pill,
                          { backgroundColor: getStatusColor(item.status, item.escalationStatus).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            { color: getStatusColor(item.status, item.escalationStatus).text },
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
                          { backgroundColor: getPriorityColor(item.priority).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            { color: getPriorityColor(item.priority).text },
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
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </View>
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
      <IssueDetailModal
        visible={!!selectedIssueId}
        issueId={selectedIssueId}
        token={accessToken}
        onClose={() => setSelectedIssueId(null)}
        onUpdate={refresh}
      />
    </PageShell>
  );
}
