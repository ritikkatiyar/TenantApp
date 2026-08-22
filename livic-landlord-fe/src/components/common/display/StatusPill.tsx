import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface StatusPillProps {
  status: string;
  style?: StyleProp<ViewStyle>;
}

export function StatusPill({ status, style }: StatusPillProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const normalized = status.trim().toUpperCase();

  const getStatusStyles = () => {
    switch (normalized) {
      case 'ACTIVE':
      case 'PAID':
      case 'OCCUPIED':
      case 'SUCCESS':
        return {
          bg: 'rgba(0, 135, 90, 0.1)',
          text: '#00875a',
          border: 'rgba(0, 135, 90, 0.2)',
        };
      case 'INACTIVE':
      case 'UNPAID':
      case 'VACANT':
      case 'CANCELLED':
      case 'FAILED':
        return {
          bg: 'rgba(186, 26, 26, 0.1)',
          text: theme.Colors.error,
          border: 'rgba(186, 26, 26, 0.2)',
        };
      case 'PENDING':
      case 'PARTIALLY_OCCUPIED':
      case 'WARNING':
        return {
          bg: 'rgba(243, 191, 38, 0.15)',
          text: '#765a00',
          border: 'rgba(243, 191, 38, 0.3)',
        };
      case 'OVERDUE':
        return {
          bg: 'rgba(235, 95, 0, 0.1)',
          text: '#eb5f00',
          border: 'rgba(235, 95, 0, 0.2)',
        };
      default:
        return {
          bg: 'rgba(107, 122, 125, 0.1)',
          text: theme.Colors.outline,
          border: 'rgba(107, 122, 125, 0.2)',
        };
    }
  };

  const { bg, text, border } = getStatusStyles();

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }, style]}>
      <Text style={[styles.text, { color: text }]}>
        {normalized.replace('_', ' ')}
      </Text>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.Rounded.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '700',
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
});
