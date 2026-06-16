import { Redirect, useRouter } from 'expo-router';

import TenantMaintenanceScreen from '@/src/features/tenant/screens/TenantMaintenanceScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function TenantMaintenanceRoute() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isReady, signOut } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <TenantMaintenanceScreen
      token={accessToken}
      onLogout={async () => {
        await signOut();
        router.replace('/login');
      }}
    />
  );
}
