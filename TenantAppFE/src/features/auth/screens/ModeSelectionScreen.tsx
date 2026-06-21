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
    label: 'Rental Property',
    icon: 'house',
    badge: null,
    disabled: false,
  },
  {
    id: 'HOSTEL',
    label: 'Hostel / PG',
    icon: 'domain',
    badge: 'Coming Soon',
    disabled: true,
  },
  {
    id: 'MESS',
    label: 'Mess',
    icon: 'restaurant',
    badge: 'Coming Soon',
    disabled: true,
  },
  {
    id: 'SOCIETY',
    label: 'Society',
    icon: 'holiday-village',
    badge: 'Coming Soon',
    disabled: true,
  },
] as const;

export default function ModeSelectionScreen({ onSelectMode, isLoading }: ModeSelectionScreenProps) {
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
        <BlurView intensity={isSelected ? 80 : 50} tint="light" style={styles.cardInner}>
          <View style={styles.iconWrapper}>
            <MaterialIcons 
              name={mode.icon as any} 
              size={36} 
              color={mode.disabled ? '#a0aab2' : isSelected ? Theme.Colors.primary : '#006875'} 
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
              <ActivityIndicator color={Theme.Colors.primary} />
            </View>
          )}
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={Theme.Colors.backgroundGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
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

const styles = StyleSheet.create({
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
    fontSize: Theme.Typography.headlineMd.fontSize,
    fontWeight: Theme.Typography.headlineMd.fontWeight as any,
    color: Theme.Colors.onSurface,
    textAlign: 'center',
    marginBottom: Theme.Spacing.stackSm,
  },
  subtitle: {
    fontSize: Theme.Typography.bodyMd.fontSize,
    color: Theme.Colors.outline,
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
    gap: 24,
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
    borderColor: Theme.Colors.primaryContainer,
    shadowColor: Theme.Colors.primaryContainer,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.Spacing.gutter,
    backgroundColor: Theme.Colors.glassFill,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: Theme.Rounded.xl,
    backgroundColor: Theme.Colors.glassFill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: Theme.Typography.bodyMd.fontSize,
    fontWeight: '600',
    color: Theme.Colors.onSurface,
    textAlign: 'center',
  },
  labelDisabled: {
    color: Theme.Colors.outlineVariant,
  },
  badge: {
    position: 'absolute',
    top: Theme.Spacing.stackSm,
    right: Theme.Spacing.stackSm,
    backgroundColor: Theme.Colors.surfaceContainer,
    paddingHorizontal: Theme.Spacing.stackSm,
    paddingVertical: 4,
    borderRadius: Theme.Rounded.md,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Theme.Colors.outline,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Theme.Colors.glassFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
