import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { GlassCard } from './GlassCard';
import { SkeletonRow } from '../feedback/Skeleton';

export interface StatCardProps {
  label: string;
  value: string | number;
  loading?: boolean;
  valueColor?: string;
  helperText?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  iconName?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  style?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
}

export function StatCard({
  label,
  value,
  loading = false,
  valueColor,
  helperText,
  trend,
  trendType = 'neutral',
  iconName,
  iconColor,
  iconBg,
  style,
  valueStyle,
}: StatCardProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const activeIconColor = iconColor || theme.Colors.primary;
  const activeIconBg = iconBg || (isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 104, 117, 0.08)');
  const activeValueColor = valueColor || theme.Colors.onSurface;

  const getTrendColor = () => {
    switch (trendType) {
      case 'positive':
        return theme.Colors.primary;
      case 'negative':
        return theme.Colors.error;
      case 'neutral':
      default:
        return theme.Colors.onSurfaceVariant;
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
          <View style={[styles.iconContainer, { backgroundColor: activeIconBg }]}>
            <MaterialIcons name={iconName} size={18} color={activeIconColor} />
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.skeletonContainer}>
          <SkeletonRow style={{ width: 70, height: 24 }} />
        </View>
      ) : (
        <Text style={[styles.value, { color: activeValueColor }, valueStyle]} numberOfLines={1}>
          {value}
        </Text>
      )}

      {trend && !loading && (
        <View style={styles.trendRow}>
          <MaterialIcons name={getTrendIcon()} size={15} color={getTrendColor()} style={styles.trendIcon} />
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {trend}
          </Text>
        </View>
      )}
      {helperText && !trend && !loading && (
        <Text style={styles.helperText} numberOfLines={1}>
          {helperText}
        </Text>
      )}
    </GlassCard>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    borderRadius: 20,
    padding: theme.Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.Spacing.xs,
  },
  label: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
    marginRight: theme.Spacing.xs,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: theme.Typography.headlineMedium.fontSize,
    fontWeight: '900',
    color: theme.Colors.onSurface,
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  skeletonContainer: {
    marginVertical: 4,
    height: 32,
    justifyContent: 'center',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.Spacing.xs,
  },
  trendIcon: {
    marginRight: 4,
  },
  trendText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '700',
  },
  helperText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: theme.Spacing.xs,
    fontWeight: '600',
  },
});
