import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/src/theme/Theme';
import {
  IssueResponse,
  getIssueDetails,
  addCommentToIssue,
  updateIssueStatus,
  escalateIssue
} from '../api/issues.api';

interface IssueDetailModalProps {
  visible: boolean;
  issueId: string | null;
  token: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function IssueDetailModal({
  visible,
  issueId,
  token,
  onClose,
  onUpdate
}: IssueDetailModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 800;

  const [issue, setIssue] = useState<IssueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // Escalation prompt
  const [showEscalatePrompt, setShowEscalatePrompt] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);

  // Status transition loading
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const fetchIssueDetails = async () => {
    if (!issueId || !token) return;
    try {
      setIsLoading(true);
      const data = await getIssueDetails(issueId, token);
      setIssue(data);
    } catch (err) {
      console.error('Error fetching issue details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible && issueId) {
      fetchIssueDetails();
      // Reset forms
      setCommentText('');
      setEscalateReason('');
      setShowEscalatePrompt(false);
    } else {
      setIssue(null);
    }
  }, [visible, issueId]);

  const handlePostComment = async () => {
    if (!commentText.trim() || !issueId || !token) return;
    try {
      setIsSubmittingComment(true);
      const updated = await addCommentToIssue(issueId, commentText.trim(), token);
      setIssue(updated);
      setCommentText('');
      onUpdate();
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => {
    if (!issueId || !token) return;
    try {
      setIsChangingStatus(true);
      const comment = `Landlord updated status to ${newStatus}`;
      const updated = await updateIssueStatus(issueId, newStatus, token, comment);
      setIssue(updated);
      onUpdate();
    } catch (err) {
      console.error('Error changing status:', err);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleEscalate = async () => {
    if (!escalateReason.trim() || !issueId || !token) return;
    try {
      setIsEscalating(true);
      const updated = await escalateIssue(issueId, escalateReason.trim(), token);
      setIssue(updated);
      setEscalateReason('');
      setShowEscalatePrompt(false);
      onUpdate();
    } catch (err) {
      console.error('Error escalating issue:', err);
    } finally {
      setIsEscalating(false);
    }
  };

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

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'CREATION':
        return <MaterialIcons name="add-circle" size={18} color={theme.Colors.primary} />;
      case 'STATUS_CHANGE':
        return <MaterialIcons name="swap-horiz" size={18} color="#d97706" />;
      case 'ESCALATION':
        return <MaterialIcons name="report-problem" size={18} color={theme.Colors.error} />;
      default:
        return <MaterialIcons name="comment" size={18} color={theme.Colors.onSurfaceVariant} />;
    }
  };

  const formatTimelineDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        <LinearGradient
          colors={(theme.Colors.backgroundGradient || ['#d4f5f9', '#e8f8fb', '#e2e0fb']) as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.modalContent, isDesktop && styles.desktopModal]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.ticketNum}>{issue?.ticketNumber || 'Loading...'}</Text>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {issue?.title || 'Ticket Details'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.Colors.onSurface} />
            </TouchableOpacity>
          </View>

          {isLoading && !issue ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.Colors.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {/* Badges row */}
              {issue && (
                <View style={styles.badgesRow}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: getStatusColor(issue.status, issue.escalationStatus).bg }
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: getStatusColor(issue.status, issue.escalationStatus).text }
                      ]}
                    >
                      {getStatusColor(issue.status, issue.escalationStatus).label}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: getPriorityColor(issue.priority).bg }
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: getPriorityColor(issue.priority).text }]}>
                      {issue.priority}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.55)' }]}>
                    <Text style={[styles.badgeText, { color: theme.Colors.primary }]}>{issue.category}</Text>
                  </View>
                </View>
              )}

              {/* Description card */}
              <View style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{issue?.description}</Text>
                
                <View style={styles.metaGrid}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Assigned Agent</Text>
                    <Text style={styles.metaValue}>{issue?.assignedContactName || 'N/A'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Date Reported</Text>
                    <Text style={styles.metaValue}>
                      {issue?.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Status Actions */}
              {issue && issue.status !== 'CLOSED' && (
                <View style={styles.actionsContainer}>
                  <Text style={styles.sectionTitle}>Manage Ticket</Text>
                  
                  {isChangingStatus ? (
                    <ActivityIndicator size="small" color={theme.Colors.primary} />
                  ) : (
                    <View style={styles.actionButtonsRow}>
                      {issue.status === 'OPEN' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.btnInProg]}
                          onPress={() => handleStatusChange('IN_PROGRESS')}
                        >
                          <Text style={styles.actionBtnText}>Accept Ticket</Text>
                        </TouchableOpacity>
                      )}
                      {issue.status !== 'RESOLVED' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.btnResolve]}
                          onPress={() => handleStatusChange('RESOLVED')}
                        >
                          <Text style={styles.actionBtnText}>Resolve Ticket</Text>
                        </TouchableOpacity>
                      )}
                      {issue.escalationStatus !== 'ESCALATED' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.btnEscalate]}
                          onPress={() => setShowEscalatePrompt(true)}
                        >
                          <Text style={styles.actionBtnText}>Escalate</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Escalate reason entry */}
                  {showEscalatePrompt && (
                    <View style={styles.escalateInputContainer}>
                      <TextInput
                        style={styles.escalateInput}
                        placeholder="Reason for escalation..."
                        placeholderTextColor={theme.Colors.onSurfaceVariant}
                        value={escalateReason}
                        onChangeText={setEscalateReason}
                      />
                      <View style={styles.escalateActionButtons}>
                        <TouchableOpacity
                          onPress={() => setShowEscalatePrompt(false)}
                          style={styles.cancelBtn}
                        >
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleEscalate}
                          disabled={isEscalating}
                          style={styles.confirmEscalateBtn}
                        >
                          {isEscalating ? (
                            <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
                          ) : (
                            <Text style={styles.confirmEscalateText}>Confirm</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Timeline list */}
              <View style={styles.timelineSection}>
                <Text style={styles.sectionTitle}>Activity Log</Text>
                {issue?.timeline && issue.timeline.length > 0 ? (
                  issue.timeline.map((item, idx) => (
                    <View key={item.id || idx} style={styles.timelineItem}>
                      <View style={styles.timelineLineWrapper}>
                        <View style={styles.timelineDot}>{getTimelineIcon(item.entryType)}</View>
                        {idx < issue.timeline.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <Text style={styles.authorName}>{item.authorName || 'System'}</Text>
                          <Text style={styles.timelineDate}>{formatTimelineDate(item.createdAt)}</Text>
                        </View>
                        <Text style={styles.timelineBody}>{item.content}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyTimelineText}>No activities logged yet.</Text>
                )}
              </View>
            </ScrollView>
          )}

          {/* Comment box */}
          {issue && (
            <View style={styles.commentInputWrapper}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a reply..."
                placeholderTextColor={theme.Colors.onSurfaceVariant}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
                onPress={handlePostComment}
                disabled={isSubmittingComment || !commentText.trim()}
              >
                {isSubmittingComment ? (
                  <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
                ) : (
                  <Ionicons name="send" size={18} color={theme.Colors.surfaceContainerLowest} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.lg
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    overflow: 'hidden',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10
  },
  desktopModal: {
    width: 600
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 104, 117, 0.1)'
  },
  ticketNum: {
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  modalTitle: {
    fontSize: theme.Typography.bodyLg.fontSize,
    fontWeight: '900',
    color: theme.Colors.onSurface,
    marginTop: 2
  },
  closeButton: {
    padding: 6
  },
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollBody: {
    padding: theme.Spacing.lg
  },
  badgesRow: {
    flexDirection: 'row',
    gap: theme.Spacing.sm,
    marginBottom: 20
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  badgeText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 20,
    padding: theme.Spacing.md,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '700',
    color: theme.Colors.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  descriptionText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    lineHeight: 20
  },
  metaGrid: {
    flexDirection: 'row',
    marginTop: theme.Spacing.md,
    paddingTop: theme.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 104, 117, 0.1)',
    gap: theme.Spacing.lg
  },
  metaItem: {
    flex: 1
  },
  metaLabel: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginBottom: 2,
    fontWeight: '600'
  },
  metaValue: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface
  },
  actionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 20,
    padding: theme.Spacing.md,
    marginBottom: 20
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  btnInProg: {
    backgroundColor: theme.Colors.primary
  },
  btnResolve: {
    backgroundColor: theme.Colors.primary
  },
  btnEscalate: {
    backgroundColor: theme.Colors.error
  },
  actionBtnText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '800',
    color: theme.Colors.surfaceContainerLowest
  },
  escalateInputContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 104, 117, 0.1)',
    paddingTop: 12
  },
  escalateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    marginBottom: 10
  },
  escalateActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.Spacing.sm
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: theme.Spacing.sm
  },
  cancelBtnText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '700'
  },
  confirmEscalateBtn: {
    backgroundColor: theme.Colors.error,
    paddingHorizontal: 14,
    paddingVertical: theme.Spacing.sm,
    borderRadius: 10
  },
  confirmEscalateText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '800',
    color: theme.Colors.surfaceContainerLowest
  },
  timelineSection: {
    marginTop: 10
  },
  timelineItem: {
    flexDirection: 'row',
    gap: theme.Spacing.md,
    marginBottom: theme.Spacing.md
  },
  timelineLineWrapper: {
    alignItems: 'center'
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(0,104,117,0.1)',
    marginTop: theme.Spacing.xs
  },
  timelineContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 12,
    padding: 12
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.Spacing.xs
  },
  authorName: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface
  },
  timelineDate: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600'
  },
  timelineBody: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    lineHeight: 18
  },
  emptyTimelineText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10
  },
  commentInputWrapper: {
    flexDirection: 'row',
    padding: theme.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 104, 117, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    gap: 12
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.15)',
    borderRadius: 18,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: 10,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    maxHeight: 100
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.Colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(0, 104, 117, 0.15)'
  }
});
