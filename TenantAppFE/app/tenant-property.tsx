import { Redirect, useRouter } from 'expo-router';

import TenantPropertyScreen from '@/src/features/tenant/screens/TenantPropertyScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function TenantPropertyRoute() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isReady, signOut } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <TenantPropertyScreen
      token={accessToken}
      onLogout={async () => {
        await signOut();
        router.replace('/login');
      }}
    />
  );
}
