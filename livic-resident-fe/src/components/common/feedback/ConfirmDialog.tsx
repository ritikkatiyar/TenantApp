import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '@/src/theme/Theme';
import { GlassCard } from '../display/GlassCard';
import { ActionButton } from '../inputs/ActionButton';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <BlurView intensity={30} tint="dark" style={styles.blurBackdrop}>
          <Pressable style={styles.dismissPressable} onPress={onCancel} />
        </BlurView>
        <View style={styles.contentContainer}>
          <GlassCard style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.actions}>
              <ActionButton
                title={cancelText}
                onPress={onCancel}
                variant="outline"
                disabled={loading}
                style={styles.button}
              />
              <ActionButton
                title={confirmText}
                onPress={onConfirm}
                variant={isDestructive ? 'danger' : 'primary'}
                loading={loading}
                style={styles.button}
              />
            </View>
          </GlassCard>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.Spacing.containerPadding,
  },
  blurBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dismissPressable: {
    flex: 1,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    zIndex: 1,
  },
  card: {
    padding: Theme.Spacing.containerPadding,
    borderRadius: Theme.Rounded.lg,
  },
  title: {
    ...Theme.Typography.headlineLg,
    color: Theme.Colors.onBackground,
    marginBottom: Theme.Spacing.stackSm,
  },
  message: {
    ...Theme.Typography.bodyMd,
    color: Theme.Colors.outline,
    marginBottom: Theme.Spacing.stackLg,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Theme.Spacing.stackSm,
  },
  button: {
    flex: 1,
    maxWidth: 140,
    height: 40,
  },
});
