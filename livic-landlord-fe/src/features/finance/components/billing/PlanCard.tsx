import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { PlanResponse } from '@/src/features/finance/api/billing.api';

interface PlanCardProps {
  plan: PlanResponse;
  isAnnual: boolean;
  currentPlan: string;
  subscribingPlanKey: string | null;
  isTopUpProcessing: boolean;
  onSubscribe: (planKey: string, price: number) => void;
}

export function PlanCard({
  plan,
  isAnnual,
  currentPlan,
  subscribingPlanKey,
  isTopUpProcessing,
  onSubscribe,
}: PlanCardProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const isCurrent = currentPlan.toUpperCase() === plan.planKey.toUpperCase();
  const price = isAnnual ? (plan.priceYearly ? plan.priceYearly / 12 : plan.priceMonthly * 0.8) : plan.priceMonthly;

  return (
    <BlurView
      intensity={60}
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.planCard,
        plan.planKey === 'PREMIUM' && styles.planCardPro,
        isCurrent && styles.planCardActive,
      ]}
    >
      {isCurrent && (
        <View style={styles.currentPlanRibbon}>
          <Text style={styles.ribbonText}>CURRENT</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <View style={styles.proHeaderRow}>
          <Text style={[styles.planTitle, plan.planKey === 'PREMIUM' && { color: theme.Colors.primary }]}>
            {plan.name || plan.planKey}
          </Text>
          {plan.planKey === 'PREMIUM' && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>POPULAR</Text>
            </View>
          )}
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceDollar}>₹{Math.round(price).toLocaleString('en-IN')}</Text>
          <Text style={styles.priceMonth}>/mo</Text>
        </View>

        <View style={styles.bulletList}>
          {plan.features.slice(0, 6).map((feat, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <MaterialIcons
                name={feat.included ? 'check' : 'close'}
                size={16}
                color={feat.included ? theme.Colors.primaryContainer : '#94a3b8'}
              />
              <Text style={[styles.bulletText, !feat.included && styles.bulletTextDisabled]}>
                {feat.displayLabel}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.cardButton,
          plan.planKey === 'PREMIUM' && styles.cardButtonPro,
          isCurrent && styles.cardButtonDisabled,
        ]}
        disabled={isCurrent || subscribingPlanKey !== null || isTopUpProcessing}
        onPress={() => onSubscribe(plan.planKey, plan.priceMonthly)}
      >
        {subscribingPlanKey === plan.planKey ? (
          <ActivityIndicator size="small" color={plan.planKey === 'PREMIUM' ? '#004f58' : theme.Colors.primary} />
        ) : (
          <Text style={[styles.cardButtonText, plan.planKey === 'PREMIUM' && styles.cardButtonTextPro]} numberOfLines={1}>
            {isCurrent ? 'Active Plan' : `Upgrade to ${plan.name || plan.planKey}`}
          </Text>
        )}
      </TouchableOpacity>
    </BlurView>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  planCard: {
    borderRadius: 24,
    padding: 24,
    marginVertical: 10,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1.5,
    borderColor: theme.Colors.glassStroke,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  planCardPro: {
    borderColor: theme.Colors.primary,
  },
  planCardActive: {
    borderColor: theme.Colors.primaryContainer,
  },
  currentPlanRibbon: {
    position: 'absolute',
    top: 15,
    right: -30,
    backgroundColor: theme.Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 4,
    transform: [{ rotate: '45deg' }],
    zIndex: 10,
  },
  ribbonText: {
    color: '#ffffff',
    fontSize: theme.Typography.LabelSmall.fontSize - 1,
    fontWeight: '900',
    letterSpacing: 1,
  },
  proHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: theme.Typography.TitleLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
  },
  popularBadge: {
    backgroundColor: theme.Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  popularText: {
    color: '#ffffff',
    fontSize: theme.Typography.LabelSmall.fontSize - 2,
    fontWeight: '800',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  priceDollar: {
    fontSize: theme.Typography.headlineMd.fontSize,
    fontWeight: '900',
    color: theme.Colors.onSurface,
  },
  priceMonth: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginLeft: 4,
  },
  bulletList: {
    marginBottom: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  bulletText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurface,
    marginLeft: 10,
  },
  bulletTextDisabled: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  cardButton: {
    backgroundColor: theme.Colors.surfaceContainerHigh,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  cardButtonPro: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
  cardButtonDisabled: {
    backgroundColor: 'transparent',
    borderColor: theme.Colors.outlineVariant,
    opacity: 0.6,
  },
  cardButtonText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  cardButtonTextPro: {
    color: '#ffffff',
  },
});
