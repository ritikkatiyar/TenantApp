import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useIssues } from '@/src/features/issues/hooks/useIssues';
import IssueDetailModal from '@/src/features/issues/components/IssueDetailModal';
import { Theme } from '@/src/theme/Theme';

export default function EscalationsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { accessToken } = useAuth();

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
    metrics,
    refresh
  } = useIssues(accessToken);

  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { bg: '#FEE2E2', text: '#EF4444' };
      case 'HIGH':
        return { bg: '#FFEDD5', text: '#F97316' };
      case 'STANDARD':
        return { bg: '#E0F2FE', text: '#0284C7' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getStatusColor = (status: string, escStatus?: string) => {
    if (escStatus === 'ESCALATED') {
      return { bg: '#FEE2E2', text: '#EF4444', label: 'ESCALATED' };
    }
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return { bg: '#D1FAE5', text: '#10B981', label: status };
      case 'IN_PROGRESS':
        return { bg: '#FEF3C7', text: '#D97706', label: 'IN PROGRESS' };
      default:
        return { bg: '#E0F2FE', text: '#0284C7', label: 'OPEN' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Metrics Banner */}
      <View style={[styles.metricsRow, isDesktop && styles.desktopMetrics]}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Tickets</Text>
          <Text style={[styles.metricValue, { color: '#006875' }]}>{metrics.total}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Open Issues</Text>
          <Text style={[styles.metricValue, { color: '#0284C7' }]}>{metrics.open}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>In Progress</Text>
          <Text style={[styles.metricValue, { color: '#D97706' }]}>{metrics.inProgress}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Escalated</Text>
          <Text style={[styles.metricValue, { color: '#EF4444' }]}>{metrics.escalated}</Text>
        </View>
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <View style={styles.searchRow}>
          <BlurView intensity={40} tint="light" style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color="#6b7a7d" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ticket #, title, desc..."
              placeholderTextColor="#9ba9ab"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </BlurView>
          <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
            <MaterialIcons name="refresh" size={22} color="#006875" />
          </TouchableOpacity>
        </View>

        {/* Filter Badges Row: Status */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Status:</Text>
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
          </View>
        </ScrollView>

        {/* Filter Badges Row: Priority */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Priority:</Text>
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
          </View>
        </ScrollView>
      </View>

      {/* Main List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#006875" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : issues.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="report-off" size={48} color="#6b7a7d" />
          <Text style={styles.emptyText}>No matching tickets found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listBody} showsVerticalScrollIndicator={false}>
          <View style={[styles.gridContainer, isDesktop && styles.desktopGrid]}>
            {issues.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.ticketCard}
                onPress={() => setSelectedIssueId(item.id)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTicketNum}>{item.ticketNumber}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status, item.escalationStatus).bg }
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(item.status, item.escalationStatus).text }
                      ]}
                    >
                      {getStatusColor(item.status, item.escalationStatus).label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.cardFooter}>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(item.priority).bg }
                    ]}
                  >
                    <Text style={[styles.priorityText, { color: getPriorityColor(item.priority).text }]}>
                      {item.priority}
                    </Text>
                  </View>
                  <Text style={styles.cardDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                onPress={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <MaterialIcons name="chevron-left" size={24} color={page === 0 ? '#cedadb' : '#006875'} />
              </TouchableOpacity>
              <Text style={styles.pageLabel}>
                Page {page + 1} of {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
                onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <MaterialIcons name="chevron-right" size={24} color={page >= totalPages - 1 ? '#cedadb' : '#006875'} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Details Modal */}
      <IssueDetailModal
        visible={!!selectedIssueId}
        issueId={selectedIssueId}
        token={accessToken}
        onClose={() => setSelectedIssueId(null)}
        onUpdate={refresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f5'
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12
  },
  desktopMetrics: {
    flexWrap: 'nowrap'
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7a7d',
    marginBottom: 4
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  controlPanel: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e8ea',
    gap: 10
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(240, 244, 245, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(206, 218, 219, 0.4)'
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 14,
    color: '#151d1e'
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f4f5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterScroll: {
    maxHeight: 36
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7a7d',
    marginRight: 4
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f0f4f5'
  },
  filterPillActive: {
    backgroundColor: '#006875'
  },
  filterText: {
    fontSize: 12,
    color: '#2e3a3c',
    fontWeight: '500'
  },
  filterTextActive: {
    color: '#fff'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16
  },
  retryBtn: {
    backgroundColor: '#006875',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff'
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7a7d',
    marginTop: 12
  },
  listBody: {
    padding: 16
  },
  gridContainer: {
    gap: 12
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
    maxWidth: '100%'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  cardTicketNum: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7a7d',
    textTransform: 'uppercase'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#151d1e',
    marginBottom: 6
  },
  cardDesc: {
    fontSize: 13,
    color: '#6b7a7d',
    lineHeight: 18,
    marginBottom: 14
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  cardDate: {
    fontSize: 12,
    color: '#9ba9ab'
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
    marginBottom: 10
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cedadb'
  },
  pageBtnDisabled: {
    backgroundColor: '#f0f4f5',
    borderColor: '#cedadb'
  },
  pageLabel: {
    fontSize: 14,
    color: '#2e3a3c',
    fontWeight: '500'
  }
});
