import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface CommandCenterEmptyStateProps {
  onNavigateToCreateProperty: () => void;
}

export function CommandCenterEmptyState({ onNavigateToCreateProperty }: CommandCenterEmptyStateProps) {
  return (
    <BlurView intensity={40} tint="light" style={styles.emptyCard}>
      <View style={styles.emptyIconCircle}>
        <MaterialIcons name="domain-disabled" size={36} color="#6b7a7d" />
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
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.createPropertyText}>CREATE PROPERTY</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.learnMoreContainer}>
        <MaterialIcons name="help-outline" size={16} color="#006875" />
        <Text style={styles.learnMoreText}>LEARN ABOUT PROPERTY MANAGEMENT</Text>
      </TouchableOpacity>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    padding: 40,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 104, 117, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.08)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#151d1e',
    marginBottom: 10,
    fontFamily: 'Inter',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7a7d',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 380,
    marginBottom: 32,
    fontFamily: 'Inter',
  },
  createPropertyButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  createPropertyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  createPropertyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'Inter',
  },
  learnMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  learnMoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#006875',
    letterSpacing: 1,
    fontFamily: 'Inter',
  },
});
