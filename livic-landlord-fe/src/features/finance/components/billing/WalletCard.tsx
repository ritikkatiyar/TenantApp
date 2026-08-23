import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface WalletCardProps {
  currentPlan: string;
  remainingCredits: number;
}

export function WalletCard({ currentPlan, remainingCredits }: WalletCardProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.walletStatusCard}>
      <LinearGradient
        colors={['rgba(0, 224, 255, 0.12)', 'rgba(0, 112, 234, 0.06)']}
        style={styles.walletStatusGradient}
      >
        <View style={styles.walletHeader}>
          <View>
            <Text style={styles.walletLabel}>ACTIVE SUBSCRIPTION TIER</Text>
            <Text style={styles.walletValue}>{currentPlan}</Text>
          </View>
          <View style={styles.badgeContainer}>
            <Text style={styles.activeBadge}>ACTIVE</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.walletFooter}>
          <View>
            <Text style={styles.walletLabel}>PREPAID AI CREDIT BALANCE</Text>
            <Text style={styles.creditValue}>
              {remainingCredits.toLocaleString()} <Text style={styles.creditUnit}>AI Credits</Text>
            </Text>
          </View>
          <Ionicons name="wallet-outline" size={32} color={theme.Colors.primary} />
        </View>
      </LinearGradient>
    </BlurView>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  walletStatusCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.Colors.glassStroke,
    marginVertical: 15,
    backgroundColor: theme.Colors.glassFill,
  },
  walletStatusGradient: {
    padding: 20,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabel: {
    color: theme.Colors.onSurfaceVariant,
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: theme.Spacing.xs,
  },
  walletValue: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '800',
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 104, 119, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 119, 0.24)',
  },
  activeBadge: {
    color: theme.Colors.primary,
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: theme.Colors.outlineVariant,
    marginVertical: 15,
  },
  walletFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creditValue: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '800',
  },
  creditUnit: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.primary,
    fontWeight: '500',
  },
});
