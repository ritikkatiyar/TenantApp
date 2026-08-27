import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import React from 'react';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function IndexScreen() {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/command-center" />;
  }

  return <Redirect href="/login" />;
}
