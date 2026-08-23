import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface CommandCenterEmptyStateProps {
  onNavigateToCreateProperty: () => void;
}

export function CommandCenterEmptyState({ onNavigateToCreateProperty }: CommandCenterEmptyStateProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  return (
    <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={styles.emptyCard}>
      <View style={styles.emptyIconCircle}>
        <MaterialIcons name="domain-disabled" size={36} color={theme.Colors.onSurfaceVariant} />
      </View>
      <Text style={styles.emptyTitle}>No properties found.</Text>
      <Text style={styles.emptySubtitle}>
        Start building your portfolio by adding your first property to the command center.
      </Text>
      
      <TouchableOpacity 
        style={styles.createPropertyButton} 
        onPress={onNavigateToCreateProperty}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#00d4ff', '#0072ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.createPropertyGradient}
        >
          <MaterialIcons name="add" size={24} color={theme.Colors.surfaceContainerLowest} />
          <Text style={styles.createPropertyText}>CREATE PROPERTY</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.learnMoreContainer}>
        <MaterialIcons name="help-outline" size={16} color={theme.Colors.primary} />
        <Text style={styles.learnMoreText}>LEARN ABOUT PROPERTY MANAGEMENT</Text>
      </TouchableOpacity>
    </BlurView>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  emptyCard: {
    borderRadius: 24,
    backgroundColor: theme.Colors.glassFill,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.Surface.border,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: theme.Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.Colors.primaryContainer,
  },
  emptyTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onBackground,
    marginBottom: 10,
    fontFamily: 'Inter',
  },
  emptySubtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 380,
    marginBottom: theme.Spacing.xl,
    fontFamily: 'Inter',
  },
  createPropertyButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: theme.Spacing.lg,
  },
  createPropertyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  createPropertyText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'Inter',
  },
  learnMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
  },
  learnMoreText: {
    fontSize: theme.Typography.bodySmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.primary,
    letterSpacing: 1,
    fontFamily: 'Inter',
  },
});
