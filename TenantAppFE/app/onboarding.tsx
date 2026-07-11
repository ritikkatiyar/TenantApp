import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { saveUserPreference, SaveUserPreferenceRequest } from '@/src/features/user/api/userPreference.api';

const MODULES = [
  {
    id: 'RENTAL',
    title: 'Rental Properties',
    description: 'Manage apartments, flats, and rental houses.',
    icon: '🏠'
  },
  {
    id: 'HOSTEL',
    title: 'Hostel & PG',
    description: 'Manage beds, rooms, and students.',
    icon: '🛏️'
  },
  {
    id: 'INDIVIDUAL',
    title: 'Individual / Person',
    description: 'Manage individual tenants or renting agreements.',
    icon: '👤'
  },
  {
    id: 'SOCIETY',
    title: 'Society Management',
    description: 'Manage society members, maintenance, and visitors.',
    icon: '🏢'
  },
  {
    id: 'MESS',
    title: 'Mess & Food',
    description: 'Manage meal plans, subscriptions, and daily food.',
    icon: '🍽️'
  }
] as const;

export default function OnboardingScreen() {
  const [selectedModule, setSelectedModule] = useState<SaveUserPreferenceRequest['activeMode'] | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { accessToken } = useAuth();

  const handleComplete = async () => {
    if (!selectedModule) return;
    setLoading(true);
    try {
      await saveUserPreference({
        activeMode: selectedModule,
        onboardingDone: true,
      }, accessToken);
      // Force reload or redirect to command center / index
      router.replace('/command-center');
    } catch (error) {
      console.error('Failed to save preference', error);
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to TenantLiving</Text>
        <Text style={styles.subtitle}>What kind of properties do you want to manage?</Text>
      </View>

      <View style={styles.grid}>
        {MODULES.map((mod) => {
          const isSelected = selectedModule === mod.id;
          return (
            <TouchableOpacity
              key={mod.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelectedModule(mod.id as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardIcon}>{mod.icon}</Text>
              <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>{mod.title}</Text>
              <Text style={[styles.cardDesc, isSelected && styles.cardDescSelected]}>{mod.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.continueButton, (!selectedModule || loading) && styles.continueButtonDisabled]}
        onPress={handleComplete}
        disabled={!selectedModule || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.continueButtonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f9fafa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1d1e',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6e7781',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    maxWidth: 800,
    marginBottom: 40,
  },
  card: {
    width: 250,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e1e4e8',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardSelected: {
    borderColor: '#0969da',
    backgroundColor: '#f3f8fd',
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#24292f',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardTitleSelected: {
    color: '#0969da',
  },
  cardDesc: {
    fontSize: 14,
    color: '#57606a',
    textAlign: 'center',
    lineHeight: 20,
  },
  cardDescSelected: {
    color: '#0969da',
  },
  continueButton: {
    backgroundColor: '#0969da',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 100,
    minWidth: 200,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#8c959f',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
