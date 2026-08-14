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

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'CREATION':
        return <MaterialIcons name="add-circle" size={18} color="#006875" />;
      case 'STATUS_CHANGE':
        return <MaterialIcons name="swap-horiz" size={18} color="#D97706" />;
      case 'ESCALATION':
        return <MaterialIcons name="report-problem" size={18} color="#EF4444" />;
      default:
        return <MaterialIcons name="comment" size={18} color="#6B7280" />;
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
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={[styles.modalContent, isDesktop && styles.desktopModal]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.ticketNum}>{issue?.ticketNumber || 'Loading...'}</Text>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {issue?.title || 'Ticket Details'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#6b7a7d" />
            </TouchableOpacity>
          </View>

          {isLoading && !issue ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#006875" />
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
                  <View style={[styles.badge, { backgroundColor: '#F3F4F6' }]}>
                    <Text style={[styles.badgeText, { color: '#4B5563' }]}>{issue.category}</Text>
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
                    <ActivityIndicator size="small" color="#006875" />
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
                        placeholderTextColor="#9ba9ab"
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
                            <ActivityIndicator size="small" color="#fff" />
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
                placeholderTextColor="#9ba9ab"
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
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8
  },
  desktopModal: {
    width: 600
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f5'
  },
  ticketNum: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#006875',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#151d1e',
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
    padding: 24
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  infoCard: {
    backgroundColor: '#f7fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#006875',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  descriptionText: {
    fontSize: 15,
    color: '#2e3a3c',
    lineHeight: 22
  },
  metaGrid: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e8ea',
    gap: 24
  },
  metaItem: {
    flex: 1
  },
  metaLabel: {
    fontSize: 12,
    color: '#6b7a7d',
    marginBottom: 2
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#151d1e'
  },
  actionsContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e8ea',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  btnInProg: {
    backgroundColor: '#006875'
  },
  btnResolve: {
    backgroundColor: '#10B981'
  },
  btnEscalate: {
    backgroundColor: '#EF4444'
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff'
  },
  escalateInputContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e8ea',
    paddingTop: 12
  },
  escalateInput: {
    backgroundColor: '#f7fafb',
    borderWidth: 1,
    borderColor: '#cedadb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#151d1e',
    marginBottom: 10
  },
  escalateActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  cancelBtnText: {
    fontSize: 13,
    color: '#6b7a7d',
    fontWeight: '500'
  },
  confirmEscalateBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10
  },
  confirmEscalateText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff'
  },
  timelineSection: {
    marginTop: 10
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16
  },
  timelineLineWrapper: {
    alignItems: 'center'
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f4f5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#f0f4f5',
    marginTop: 4
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#f7fafb',
    borderRadius: 12,
    padding: 12
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  authorName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#151d1e'
  },
  timelineDate: {
    fontSize: 11,
    color: '#6b7a7d'
  },
  timelineBody: {
    fontSize: 13,
    color: '#2e3a3c',
    lineHeight: 18
  },
  emptyTimelineText: {
    fontSize: 13,
    color: '#6b7a7d',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10
  },
  commentInputWrapper: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f4f5',
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 12
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f7fafb',
    borderWidth: 1,
    borderColor: '#cedadb',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#151d1e',
    maxHeight: 100
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#006875',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#cedadb'
  }
});
