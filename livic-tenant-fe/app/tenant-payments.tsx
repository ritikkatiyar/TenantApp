import { Redirect, useRouter } from 'expo-router';

import TenantPaymentsScreen from '@/src/features/tenant/screens/TenantPaymentsScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function TenantPaymentsRoute() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isReady, signOut } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <TenantPaymentsScreen
      token={accessToken}
      onLogout={async () => {
        await signOut();
        router.replace('/login');
      }}
    />
  );
}
