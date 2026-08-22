import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface ChargeIdentityCardProps {
  expenseName: string;
  setExpenseName: (val: string) => void;
  chargeCategory: string;
  setChargeCategory: (val: string) => void;
  billingFrequency: string;
  setBillingFrequency: (val: string) => void;
  nameError: string;
  setNameError: (val: string) => void;
  isDark: boolean;
}

export function ChargeIdentityCard({
  expenseName,
  setExpenseName,
  chargeCategory,
  setChargeCategory,
  billingFrequency,
  setBillingFrequency,
  nameError,
  setNameError,
  isDark,
}: ChargeIdentityCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="file-document-outline" size={20} color={theme.Colors.primary} />
        <Text style={styles.cardTitle}>Charge Identity</Text>
      </View>

      <Text style={styles.label}>CHARGE NAME</Text>
      <View style={[styles.inputContainer, nameError ? { borderColor: theme.Colors.error, marginBottom: 8 } : null]}>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Electricity, Sanitation Service" 
          placeholderTextColor="#849495"
          value={expenseName}
          onChangeText={(val) => {
            setExpenseName(val);
            if (val.trim()) setNameError('');
          }}
        />
      </View>
      {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

      <Text style={styles.label}>CATEGORY</Text>
      <View style={styles.categoryRow}>
        {['RENT', 'ELECTRICITY', 'SERVICE', 'PENALTY', 'DISCOUNT', 'CUSTOM'].map((cat) => {
          const isActive = chargeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                isActive && { backgroundColor: theme.Colors.primary, borderColor: theme.Colors.primary },
              ]}
              onPress={() => setChargeCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.categoryText,
                isActive && { color: theme.Surface.card, fontWeight: '800' },
              ]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>BILLING FREQUENCY</Text>
      <View style={styles.segmentContainer}>
        {['Monthly', 'Annual', 'Weekly'].map((freq) => {
          const isActive = billingFrequency === freq;
          return (
            <TouchableOpacity 
              key={freq}
              style={styles.segmentButtonWrapper}
              onPress={() => setBillingFrequency(freq)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <LinearGradient
                  colors={['#00d4ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.segmentButtonGradient}
                >
                  <Text style={styles.segmentTextActive}>{freq}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.segmentButtonInactive}>
                  <Text style={styles.segmentText}>{freq}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '600',
  },
  errorText: {
    color: theme.Colors.error,
    fontSize: theme.Typography.BodySmall.fontSize,
    marginTop: -12,
    marginBottom: 18,
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 24,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  categoryText: {
    fontSize: theme.Typography.BodySmall.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
  },
  segmentContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    padding: 4,
  },
  segmentButtonWrapper: {
    flex: 1,
    height: '100%',
  },
  segmentButtonGradient: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentButtonInactive: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentTextActive: {
    color: theme.Colors.onPrimary,
    fontSize: theme.Typography.BodySmall.fontSize,
    fontWeight: '800',
  },
  segmentText: {
    color: theme.Colors.onSurfaceVariant,
    fontSize: theme.Typography.BodySmall.fontSize,
    fontWeight: '700',
  },
});
