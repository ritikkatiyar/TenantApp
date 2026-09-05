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
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={[styles.card, isDesktop && { flex: 1 }]}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="card-bulleted-settings-outline" size={20} color={theme.Colors.primary} />
        <Text style={styles.cardTitle}>Dynamic Preview</Text>
      </View>

      <View style={[styles.previewCard, isDesktop && { flex: 1 }]}>
        {/* Top subtle accent gradient bar */}
        <LinearGradient
          colors={[theme.Colors.primary, theme.Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentBar}
        />

        <View style={styles.previewHeaderRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={styles.categoryBadge}>
              <Text style={styles.previewCategory}>{chargeCategory} CHARGE</Text>
            </View>
            <Text style={styles.previewName} numberOfLines={1}>
              {expenseName || 'Unnamed Charge'}
            </Text>
          </View>
          <View style={styles.iconCircle}>
            <MaterialIcons name="receipt-long" size={22} color={theme.Colors.primary} />
          </View>
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
              <Text style={[styles.previewValue, { color: theme.Colors.primary }]}>
                ₹{baseRate}{calcMethod === 'Fixed Rate' ? '' : ` / ${unitType}`}
              </Text>
            </View>
          ) : null}

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Sales Tax</Text>
            <Text style={styles.previewValue}>{applySalesTax ? 'Apply (18% GST)' : 'Exempt'}</Text>
          </View>
        </View>
      </View>
    </BlurView>
  );
}

const createStyles = (theme: any, isDark: boolean = false) => StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: theme.Spacing.lg,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : theme.Colors.glassStroke,
    backgroundColor: isDark ? 'rgba(15, 23, 32, 0.65)' : theme.Colors.glassFill,
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
    fontSize: theme.Typography.titleMedium.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
  },
  previewCard: {
    borderRadius: 20,
    padding: 20,
    minHeight: 220,
    backgroundColor: isDark ? 'rgba(9, 13, 18, 0.90)' : theme.Colors.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : theme.Colors.outlineVariant,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.35 : 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 104, 117, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  previewCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.Colors.primary,
    letterSpacing: 1.2,
  },
  previewName: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '900',
    color: theme.Colors.onSurface,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 104, 117, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewDivider: {
    height: 1,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.Colors.outlineVariant,
    marginVertical: 16,
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
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  previewValue: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '700',
  },
});
