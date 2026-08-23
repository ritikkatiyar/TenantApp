import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={30} style={StyleSheet.absoluteFillObject} />
        <View style={styles.modalPopup}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.confirmBtnWrapper} onPress={onConfirm}>
              <LinearGradient
                colors={['#ff416c', '#ff4b2b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmBtn}
              >
                <Text style={styles.confirmBtnText}>Confirm</Text>
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
  },
  modalPopup: {
    width: 400,
    maxWidth: '90%',
    padding: theme.Spacing.lg,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: theme.Colors.surfaceContainerLowest,
  },
  title: {
    fontSize: theme.Typography.bodyLg.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
    marginBottom: 12,
  },
  message: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: theme.Spacing.lg,
    fontWeight: '500',
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
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  cancelBtnText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
  },
  confirmBtnWrapper: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: theme.Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: theme.Colors.onPrimary,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '800',
  },
});
