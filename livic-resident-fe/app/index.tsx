import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import React from 'react';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { useAppTheme } from '@/src/theme/ThemeContext';

export default function IndexScreen() {
  const { isAuthenticated, isReady } = useAuth();
  const { theme } = useAppTheme();

  if (!isReady) {
    return (
      <PageShell contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
      </PageShell>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/tenant-home" />;
  }

  return <Redirect href="/login" />;
}
