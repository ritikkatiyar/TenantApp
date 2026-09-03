import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/src/theme/Theme';

interface ModeSelectionScreenProps {
  onSelectMode: (mode: string) => Promise<void>;
  isLoading: boolean;
}

const MODES = [
  {
    id: 'RENTAL',
    label: 'Rental Block',
    icon: 'domain',
    badge: null,
    disabled: false,
  },
  {
    id: 'RESIDENTIAL',
    label: 'Residential Block',
    icon: 'house',
    badge: null,
    disabled: false,
  },
] as const;

export default function ModeSelectionScreen({ onSelectMode, isLoading }: ModeSelectionScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handlePress = async (id: string) => {
    setSelectedId(id);
    try {
      await onSelectMode(id);
    } catch (error) {
      setSelectedId(null);
      Alert.alert('Error', 'Failed to save preference. Please try again.');
    }
  };

  const renderCard = (mode: typeof MODES[number]) => {
    const isSelected = selectedId === mode.id;

    return (
      <TouchableOpacity
        key={mode.id}
        style={[
          styles.cardContainer,
          mode.disabled && styles.cardDisabled,
          isSelected && styles.cardSelected,
        ]}
        onPress={() => !mode.disabled && handlePress(mode.id)}
        activeOpacity={mode.disabled ? 1 : 0.7}
        disabled={mode.disabled || isLoading}
      >
        <BlurView intensity={isSelected ? 80 : 50} tint={isDark ? 'dark' : 'light'} style={styles.cardInner}>
          <View style={styles.iconWrapper}>
            <MaterialIcons 
              name={mode.icon as any} 
              size={36} 
              color={mode.disabled ? '#a0aab2' : isSelected ? theme.Colors.primary : theme.Colors.primary} 
            />
          </View>
          <Text style={[styles.cardLabel, mode.disabled && styles.labelDisabled]}>
            {mode.label}
          </Text>
          
          {mode.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{mode.badge}</Text>
            </View>
          )}

          {isSelected && isLoading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator color={theme.Colors.primary} />
            </View>
          )}
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={theme.Colors.backgroundGradient as [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>What do you want to manage?</Text>
          <Text style={styles.subtitle}>Select a property type to get started</Text>
          
          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            {MODES.map(renderCard)}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.Spacing.containerPadding,
  },
  title: {
    fontSize: theme.Typography.headlineMd.fontSize,
    fontWeight: theme.Typography.headlineMd.fontWeight as any,
    color: theme.Colors.onSurface,
    textAlign: 'center',
    marginBottom: Theme.Spacing.stackSm,
  },
  subtitle: {
    fontSize: theme.Typography.bodyMd.fontSize,
    color: theme.Colors.outline,
    textAlign: 'center',
    marginBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Theme.Spacing.gutter,
    maxWidth: 400,
  },
  gridDesktop: {
    maxWidth: 600,
    gap: theme.Spacing.lg,
  },
  cardContainer: {
    width: '45%',
    aspectRatio: 1,
    borderRadius: Theme.Rounded.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardSelected: {
    borderColor: theme.Colors.primaryContainer,
    shadowColor: theme.Colors.primaryContainer,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.Spacing.gutter,
    backgroundColor: theme.Colors.glassFill,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: Theme.Rounded.xl,
    backgroundColor: theme.Colors.glassFill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: theme.Typography.bodyMd.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    textAlign: 'center',
  },
  labelDisabled: {
    color: theme.Colors.outlineVariant,
  },
  badge: {
    position: 'absolute',
    top: Theme.Spacing.stackSm,
    right: Theme.Spacing.stackSm,
    backgroundColor: theme.Colors.surfaceContainer,
    paddingHorizontal: Theme.Spacing.stackSm,
    paddingVertical: theme.Spacing.xs,
    borderRadius: Theme.Rounded.md,
  },
  badgeText: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: 'bold',
    color: theme.Colors.outline,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.Colors.glassFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
