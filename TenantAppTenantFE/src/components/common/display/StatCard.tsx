import React from 'react';
import { StyleSheet, View, Text, ViewStyle, StyleProp } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/src/theme/Theme';
import { GlassCard } from './GlassCard';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  iconName?: keyof typeof MaterialIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

export function StatCard({
  label,
  value,
  trend,
  trendType = 'neutral',
  iconName,
  style,
}: StatCardProps) {
  const getTrendColor = () => {
    switch (trendType) {
      case 'positive':
        return '#00875a'; // Safe positive green
      case 'negative':
        return Theme.Colors.error;
      case 'neutral':
      default:
        return Theme.Colors.outline;
    }
  };

  const getTrendIcon = () => {
    switch (trendType) {
      case 'positive':
        return 'trending-up';
      case 'negative':
        return 'trending-down';
      case 'neutral':
      default:
        return 'trending-flat';
    }
  };

  return (
    <GlassCard style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {iconName && (
          <View style={styles.iconContainer}>
            <MaterialIcons name={iconName} size={20} color={Theme.Colors.primary} />
          </View>
        )}
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      {trend && (
        <View style={styles.trendRow}>
          <MaterialIcons name={getTrendIcon()} size={16} color={getTrendColor()} style={styles.trendIcon} />
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {trend}
          </Text>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.Spacing.stackSm,
  },
  label: {
    ...Theme.Typography.labelMuted,
    color: Theme.Colors.outline,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: Theme.Rounded.md,
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    ...Theme.Typography.headlineMd,
    color: Theme.Colors.onBackground,
    marginBottom: Theme.Spacing.unit / 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.Spacing.unit / 2,
  },
  trendIcon: {
    marginRight: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
