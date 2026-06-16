import { useRouter } from 'expo-router';

import SuperAdminLoginScreen from '@/src/features/auth/screens/SuperAdminLoginScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getMyContext } from '@/src/features/auth/api/me.api';
import type { TokenBundle } from '@/src/types/auth';

export default function LoginRoute() {
  const router = useRouter();
  const { signIn, setContext } = useAuth();

  return (
    <SuperAdminLoginScreen
      onLogin={async (authData: TokenBundle) => {
        await signIn(authData);
        const context = await getMyContext(authData.accessToken);
        setContext(context);
        router.replace(context.activeLeases.length > 0 ? '/tenant-home' : '/command-center');
      }}
      onNavigateToSignup={() => router.push('/signup')}
    />
  );
}
