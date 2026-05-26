import { Redirect } from 'expo-router';
import React from 'react';

import BillingScreen from '@/src/screens/BillingScreen';
import { useAuth } from '@/src/auth/AuthProvider';

export default function BillingRoute() {
  const { accessToken, isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <BillingScreen token={accessToken} />;
}
