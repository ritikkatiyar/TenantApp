import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface MeterReadingSummaryProps {
  totalUnits: number;
  readingsEntered: number;
  selectedConfigName: string | undefined;
  unitType: string | undefined;
  baseRate: number;
  billingMonthName: string;
  billingYear: number;
  totalConsumption: number;
  totalEstimatedCost: number;
}

export function MeterReadingSummary({
  totalUnits,
  readingsEntered,
  selectedConfigName,
  unitType,
  baseRate,
  billingMonthName,
  billingYear,
  totalConsumption,
  totalEstimatedCost,
}: MeterReadingSummaryProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.summaryCard}>
      <Text style={styles.summaryCardTitle}>WORKSHEET SUMMARY</Text>
      
      <View style={styles.summaryMetricsGrid}>
        <View style={styles.summaryMetricItem}>
          <Text style={styles.summaryMetricLabel}>TOTAL UNITS</Text>
          <Text style={styles.summaryMetricValue}>{totalUnits}</Text>
        </View>
        <View style={styles.summaryMetricItem}>
          <Text style={styles.summaryMetricLabel}>READINGS ENTERED</Text>
          <Text style={styles.summaryMetricValue}>{readingsEntered} / {totalUnits}</Text>
        </View>
      </View>

      <View style={styles.previewDivider} />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Utility Charge</Text>
        <Text style={styles.summaryValue}>{selectedConfigName || 'N/A'}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Rate</Text>
        <Text style={styles.summaryValue}>₹{baseRate} / {unitType || 'unit'}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Billing Period</Text>
        <Text style={styles.summaryValue}>{billingMonthName} {billingYear}</Text>
      </View>

      <View style={styles.previewDivider} />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Consumption</Text>
        <Text style={[styles.summaryValue, { color: theme.Colors.primary, fontSize: theme.Typography.BodyLarge.fontSize }]}>
          {totalConsumption.toFixed(2)} {unitType || 'Units'}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Estimated Billing</Text>
        <Text style={[styles.summaryValue, { color: theme.Colors.primary, fontSize: theme.Typography.TitleLarge.fontSize, fontWeight: '800' }]}>
          ₹{totalEstimatedCost.toFixed(2)}
        </Text>
      </View>

      {readingsEntered < totalUnits && (
        <View style={styles.warningAlertBox}>
          <MaterialIcons name="info-outline" size={18} color="#765a00" />
          <Text style={styles.warningAlertText}>
            {totalUnits - readingsEntered} unit(s) are missing current month readings.
          </Text>
        </View>
      )}
    </BlurView>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  summaryCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    overflow: 'hidden',
  },
  summaryCardTitle: {
    fontSize: theme.Typography.BodySmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  summaryMetricsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryMetricItem: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  summaryMetricLabel: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    fontFamily: 'Inter',
  },
  summaryMetricValue: {
    fontSize: theme.Typography.TitleLarge.fontSize,
    fontWeight: '900',
    color: theme.Colors.onSurface,
    marginTop: 6,
    fontFamily: 'Inter',
  },
  previewDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    marginVertical: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  summaryValue: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
    fontFamily: 'Inter',
  },
  warningAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 108, 0, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239, 108, 0, 0.15)',
    padding: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  warningAlertText: {
    flex: 1,
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '700',
    color: theme.Colors.tertiary,
    lineHeight: 16,
    fontFamily: 'Inter',
  },
});
