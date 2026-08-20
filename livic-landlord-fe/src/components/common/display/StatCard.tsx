import React from 'react';
import { StyleSheet, View, Text, ViewStyle, StyleProp } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
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
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const getTrendColor = () => {
    switch (trendType) {
      case 'positive':
        return '#00875a'; // Safe positive green
      case 'negative':
        return theme.Colors.error;
      case 'neutral':
      default:
        return theme.Colors.outline;
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
            <MaterialIcons name={iconName} size={20} color={theme.Colors.primary} />
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

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.Spacing.stackSm,
  },
  label: {
    ...theme.Typography.labelMuted,
    color: theme.Colors.outline,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.Rounded.md,
    backgroundColor: theme.Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    ...theme.Typography.headlineMd,
    color: theme.Colors.onBackground,
    marginBottom: theme.Spacing.unit / 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.Spacing.unit / 2,
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
