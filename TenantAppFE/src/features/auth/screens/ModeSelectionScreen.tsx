import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/src/theme/Theme';

const LUMINOUS_BACKGROUND = ['#d4f5f9', '#e8f8fb', '#e2e0fb'] as const;

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
    <LinearGradient colors={LUMINOUS_BACKGROUND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
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
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#163235', // Theme.Colors.onSurface roughly
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7a7d',
    textAlign: 'center',
    marginBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 400,
  },
  gridDesktop: {
    maxWidth: 600,
    gap: 24,
  },
  cardContainer: {
    width: '45%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardSelected: {
    borderColor: '#00d4ff', // Theme.Colors.primary
    shadowColor: '#00d4ff',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#163235',
    textAlign: 'center',
  },
  labelDisabled: {
    color: '#a0aab2',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6b7a7d',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
