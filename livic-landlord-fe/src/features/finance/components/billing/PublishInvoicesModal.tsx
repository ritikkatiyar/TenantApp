import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface PublishInvoicesModalProps {
  visible: boolean;
  count: number;
  totalAmount?: number;
  billingMonth?: string;
  isPublishing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PublishInvoicesModal({
  visible,
  count,
  totalAmount,
  billingMonth,
  isPublishing,
  onCancel,
  onConfirm,
}: PublishInvoicesModalProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const formattedAmount = totalAmount != null
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalAmount)
    : null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={40} style={StyleSheet.absoluteFillObject} />
        <View style={styles.modalPopup}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="notifications-outline" size={24} color={theme.Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Publish Invoices</Text>
              <Text style={styles.subtitle}>
                {billingMonth ? `Billing cycle: ${billingMonth}` : 'Confirm invoice publication'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Invoices</Text>
              <Text style={styles.summaryValue}>{count}</Text>
            </View>
            {formattedAmount && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Due</Text>
                <Text style={[styles.summaryValue, { color: theme.Colors.primary }]}>{formattedAmount}</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionHeader}>Notification Channels Dispatched</Text>
          <View style={styles.channelsList}>
            <View style={styles.channelRow}>
              <Ionicons name="phone-portrait-outline" size={18} color="#00897B" />
              <View style={styles.channelContent}>
                <Text style={styles.channelTitle}>Mobile Push</Text>
                <Text style={styles.channelDesc}>Instant push notification to all tenant devices</Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color="#00897B" />
            </View>

            <View style={styles.channelRow}>
              <Ionicons name="mail-outline" size={18} color="#1E88E5" />
              <View style={styles.channelContent}>
                <Text style={styles.channelTitle}>Email Statement</Text>
                <Text style={styles.channelDesc}>Itemized rent statement sent to registered email</Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color="#1E88E5" />
            </View>

            <View style={styles.channelRow}>
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <View style={styles.channelContent}>
                <Text style={styles.channelTitle}>WhatsApp & SMS</Text>
                <Text style={styles.channelDesc}>Rent due alert sent to primary contact number</Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color="#25D366" />
            </View>
          </View>

          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={16} color={theme.Colors.onSurfaceVariant} />
            <Text style={styles.infoBannerText}>
              Invoices will become live immediately in the resident app for payment.
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isPublishing}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtnWrapper}
              onPress={onConfirm}
              disabled={isPublishing}
            >
              <LinearGradient
                colors={['#006875', '#004d57']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmBtn}
              >
                {isPublishing ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Publish & Notify</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalPopup: {
    width: 440,
    maxWidth: '92%',
    padding: theme.Spacing.xl,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: theme.Colors.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: theme.Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 104, 117, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.Typography.bodyLg.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
  },
  subtitle: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 2,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: theme.Spacing.md,
    marginBottom: theme.Spacing.md,
    gap: theme.Spacing.md,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.Colors.onSurface,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  channelsList: {
    gap: 8,
    marginBottom: theme.Spacing.md,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderRadius: 12,
  },
  channelContent: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  channelDesc: {
    fontSize: 11,
    color: theme.Colors.onSurfaceVariant,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 10,
    marginBottom: theme.Spacing.lg,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: theme.Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: theme.Spacing.md,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
  },
  confirmBtnWrapper: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 150,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '800',
  },
});
