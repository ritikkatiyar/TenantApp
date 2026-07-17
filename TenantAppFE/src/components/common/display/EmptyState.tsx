import React from 'react';
import { StyleSheet, View, Text, ViewStyle, StyleProp } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/src/theme/Theme';
import { GlassCard } from './GlassCard';
import { ActionButton } from '../inputs/ActionButton';

interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  actionText?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  title,
  description,
  iconName = 'info-outline',
  actionText,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <GlassCard style={[styles.container, style]}>
      <View style={styles.iconWrapper}>
        <MaterialIcons name={iconName} size={48} color={Theme.Colors.outline} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionText && onAction && (
        <ActionButton
          title={actionText}
          onPress={onAction}
          variant="outline"
          style={styles.actionButton}
        />
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Theme.Spacing.containerPadding * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Theme.Spacing.stackMd,
    textAlign: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: Theme.Rounded.full,
    backgroundColor: 'rgba(0, 104, 117, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.Spacing.stackMd,
  },
  title: {
    ...Theme.Typography.headlineLg,
    color: Theme.Colors.onBackground,
    textAlign: 'center',
    marginBottom: Theme.Spacing.stackSm,
  },
  description: {
    ...Theme.Typography.labelMuted,
    color: Theme.Colors.outline,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: Theme.Spacing.stackMd,
  },
  actionButton: {
    minWidth: 150,
  },
});
