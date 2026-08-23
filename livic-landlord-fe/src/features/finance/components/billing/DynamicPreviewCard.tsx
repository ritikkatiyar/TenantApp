import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface DynamicPreviewCardProps {
  chargeCategory: string;
  expenseName: string;
  billingFrequency: string;
  calcMethod: string;
  baseRate: string;
  unitType: string;
  applySalesTax: boolean;
  isDesktop: boolean;
  isDark: boolean;
}

export function DynamicPreviewCard({
  chargeCategory,
  expenseName,
  billingFrequency,
  calcMethod,
  baseRate,
  unitType,
  applySalesTax,
  isDesktop,
  isDark,
}: DynamicPreviewCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={[styles.card, isDesktop && { flex: 1 }]}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="card-bulleted-settings-outline" size={20} color={theme.Colors.primary} />
        <Text style={styles.cardTitle}>Dynamic Preview</Text>
      </View>
      <LinearGradient
        colors={[theme.Colors.primary, theme.Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.previewCardGradient, isDesktop && { flex: 1 }]}
      >
        <View style={styles.previewHeaderRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.previewCategory}>{chargeCategory} CHARGE</Text>
            <Text style={styles.previewName} numberOfLines={1}>{expenseName || 'Unnamed Charge'}</Text>
          </View>
          <MaterialIcons name="receipt-long" size={28} color={theme.Colors.onPrimary} />
        </View>
        
        <View style={styles.previewDivider} />
        
        <View style={[styles.previewBody, isDesktop && { flex: 1, justifyContent: 'space-evenly', marginTop: theme.Spacing.sm }]}>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Billing Cycle</Text>
            <Text style={styles.previewValue}>{billingFrequency}</Text>
          </View>
          
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Calculation</Text>
            <Text style={styles.previewValue}>{calcMethod}</Text>
          </View>
          
          {baseRate ? (
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Rate</Text>
              <Text style={styles.previewValue}>
                ₹{baseRate}{calcMethod === 'Fixed Rate' ? '' : ` / ${unitType}`}
              </Text>
            </View>
          ) : null}
          
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Sales Tax</Text>
            <Text style={styles.previewValue}>{applySalesTax ? 'Apply (18% GST)' : 'Exempt'}</Text>
          </View>
        </View>
      </LinearGradient>
    </BlurView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: theme.Spacing.lg,
    borderWidth: 1.5,
    borderColor: theme.Colors.glassStroke,
    backgroundColor: theme.Colors.glassFill,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
  },
  previewCardGradient: {
    borderRadius: 20,
    padding: 20,
    minHeight: 220,
    justifyContent: 'center',
    shadowColor: theme.Colors.onSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewCategory: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '900',
    color: theme.Colors.onPrimary,
    letterSpacing: 1.5,
  },
  previewName: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '900',
    color: theme.Colors.onPrimary,
    marginTop: theme.Spacing.xs,
  },
  previewDivider: {
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 15,
  },
  previewBody: {
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  previewValue: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onPrimary,
    fontWeight: '800',
  },
});
