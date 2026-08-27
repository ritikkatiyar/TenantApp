import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { saveUserPreference, SaveUserPreferenceRequest } from '@/src/features/user/api/userPreference.api';
import { validateAndApplyJoinCode } from '@/src/features/properties/api/rolePermission.api';
import ActionButton from '@/src/components/common/inputs/ActionButton';

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
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const [selectedModule, setSelectedModule] = useState<SaveUserPreferenceRequest['activeMode'] | null>(null);
  const [loading, setLoading] = useState(false);

  const [isInviteMode, setIsInviteMode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const router = useRouter();
  const { accessToken } = useAuth();

  const handleComplete = async () => {
    if (!selectedModule) return;
    setLoading(true);
    try {
      await saveUserPreference({
        activeMode: selectedModule,
        onboardingDone: true
      }, accessToken!);
      router.replace('/(tabs)' as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save setup preference');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter a valid invite code');
      return;
    }
    setJoining(true);
    try {
      const res = await validateAndApplyJoinCode(inviteCode.trim(), accessToken!);

      Alert.alert(
        'Welcome!',
        `Successfully joined ${res.propertyName || 'the property'} as ${res.roleCode}!`,
        [
          {
            text: 'Continue',
            onPress: () => {
              if (res.roleCode === 'TENANT') {
                router.replace('/tenant-home' as any);
              } else {
                router.replace('/(tabs)' as any);
              }
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert('Join Failed', e.message || 'Invalid or expired invite code.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Livic</Text>
        <Text style={styles.subtitle}>How do you plan to use Livic today?</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, !isInviteMode && styles.activeTab]}
          onPress={() => setIsInviteMode(false)}
        >
          <Text style={[styles.tabText, !isInviteMode && styles.activeTabText]}>Setup Workspace</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, isInviteMode && styles.activeTab]}
          onPress={() => setIsInviteMode(true)}
        >
          <Text style={[styles.tabText, isInviteMode && styles.activeTabText]}>Have an Invite Code?</Text>
        </TouchableOpacity>
      </View>

      {!isInviteMode ? (
        <>
          <View style={styles.grid}>
            {MODULES.map((m) => {
              const isSelected = selectedModule === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.card, isSelected && styles.selectedCard]}
                  onPress={() => setSelectedModule(m.id as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.icon}>{m.icon}</Text>
                  <Text style={[styles.cardTitle, isSelected && styles.selectedText]}>{m.title}</Text>
                  <Text style={styles.cardDesc}>{m.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.footer}>
            <ActionButton
              label="GET STARTED"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={!selectedModule || loading}
              onPress={handleComplete}
            />
          </View>
        </>
      ) : (
        <View style={styles.inviteContainer}>
          <Text style={styles.inviteLabel}>ENTER YOUR 6-DIGIT CODE</Text>
          <TextInput
            style={styles.inviteInput}
            placeholder="e.g. AB12CD"
            placeholderTextColor={theme.Colors.onSurfaceVariant}
            value={inviteCode}
            onChangeText={(t) => setInviteCode(t.toUpperCase())}
            maxLength={10}
            autoCapitalize="characters"
          />
          <Text style={styles.inviteHint}>
            Ask your property owner or landlord for an invitation code to join their workspace directly.
          </Text>

          <View style={{ marginTop: 24 }}>
            <ActionButton
              label="JOIN WORKSPACE"
              variant="primary"
              size="lg"
              fullWidth
              loading={joining}
              disabled={!inviteCode.trim() || joining}
              onPress={handleJoinByCode}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.Colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: theme.Typography.headlineMedium.fontSize,
    fontWeight: '800',
    color: theme.Colors.onBackground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.Colors.surfaceVariant || 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.Colors.surface || '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
  },
  activeTabText: {
    color: theme.Colors.primary,
    fontWeight: '700',
  },
  grid: {
    gap: 16,
    marginBottom: 32,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: theme.Colors.surface,
    borderWidth: 2,
    borderColor: theme.Colors.outlineVariant || 'rgba(0,0,0,0.1)',
  },
  selectedCard: {
    borderColor: theme.Colors.primary,
    backgroundColor: isDark ? 'rgba(0, 229, 255, 0.05)' : 'rgba(0, 104, 117, 0.05)',
  },
  icon: {
    fontSize: 32,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: theme.Typography.titleMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
    marginBottom: 4,
  },
  selectedText: {
    color: theme.Colors.primary,
  },
  cardDesc: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 24,
  },
  inviteContainer: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: theme.Colors.surface,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant || 'rgba(0,0,0,0.1)',
  },
  inviteLabel: {
    fontSize: theme.Typography.labelMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
    marginBottom: 8,
  },
  inviteInput: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    color: theme.Colors.onSurface,
    borderWidth: 1,
    borderColor: theme.Colors.outline || 'rgba(0,0,0,0.1)',
  },
  inviteHint: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
