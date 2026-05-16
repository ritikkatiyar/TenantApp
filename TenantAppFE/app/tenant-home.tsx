import { Redirect, useRouter } from 'expo-router';

import TenantHomeScreen from '@/src/screens/TenantHomeScreen';
import { useAuth } from '@/src/auth/AuthProvider';

export default function TenantHomeRoute() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isReady, signOut } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <TenantHomeScreen
      token={accessToken}
      onLogout={async () => {
        await signOut();
        router.replace('/login');
      }}
    />
  );
}
