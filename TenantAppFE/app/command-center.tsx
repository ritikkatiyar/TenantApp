import { Redirect, useRouter } from 'expo-router';

import CommandCenterScreen from '@/src/screens/CommandCenterScreen';
import { useAuth } from '@/src/auth/AuthProvider';

export default function CommandCenterRoute() {
  const router = useRouter();
  const { isAuthenticated, isReady, signOut } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <CommandCenterScreen
      onNavigateToCreateProperty={() => router.push('/properties/create')}
      onLogout={async () => {
        await signOut();
        router.replace('/login');
      }}
    />
  );
}
