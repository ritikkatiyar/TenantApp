import React from 'react';
import * as Haptics from 'expo-haptics';
import { View, Text, StyleSheet, Switch, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface AdvancedLogicCardProps {
  applySalesTax: boolean;
  setApplySalesTax: (val: boolean) => void;
  autoCarryForward: boolean;
  setAutoCarryForward: (val: boolean) => void;
  lateFee: string;
  setLateFee: (val: string) => void;
  isDark: boolean;
}

export function AdvancedLogicCard({
  applySalesTax,
  setApplySalesTax,
  autoCarryForward,
  setAutoCarryForward,
  lateFee,
  setLateFee,
  isDark,
}: AdvancedLogicCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="settings-outline" size={20} color={theme.Colors.primary} />
        <Text style={styles.cardTitle}>Advanced Logic</Text>
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.settingText}>Apply Sales Tax</Text>
        <Switch 
          value={applySalesTax} 
          onValueChange={(val) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setApplySalesTax(val);
          }}
          trackColor={{ false: '#d1d5db', true: '#00F0FF' }}
          thumbColor="#ffffff"
        />
      </View>

      <View style={[styles.rowBetween, { marginTop: 20 }]}>
        <Text style={styles.settingText}>Auto-Carry Forward</Text>
        <Switch 
          value={autoCarryForward} 
          onValueChange={(val) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setAutoCarryForward(val);
          }}
          trackColor={{ false: '#d1d5db', true: '#00F0FF' }}
          thumbColor="#ffffff"
        />
      </View>

      <View style={[styles.rowBetween, { marginTop: 24, marginBottom: 24 }]}>
        <Text style={styles.settingText}>Late Fee Rules</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{lateFee || '0'}% / Monthly</Text>
        </View>
      </View>

      <Text style={styles.label}>LATE FEE %</Text>
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.inputWithIcon} 
          placeholder="5" 
          placeholderTextColor="#849495"
          keyboardType="numeric"
          value={lateFee}
          onChangeText={setLateFee}
        />
        <Text style={styles.percentSymbol}>%</Text>
      </View>
    </BlurView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: theme.Colors.glassStroke,
    backgroundColor: theme.Colors.glassFill,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: theme.Typography.BodyLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.24)',
  },
  badgeText: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.primary,
  },
  label: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputContainer: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.Colors.glassStroke,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputWithIcon: {
    flex: 1,
    height: '100%',
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '600',
  },
  percentSymbol: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '700',
    marginLeft: 8,
  },
});
