import { useRouter } from 'expo-router';

import SuperAdminLoginScreen from '@/src/screens/SuperAdminLoginScreen';
import { useAuth } from '@/src/auth/AuthProvider';
import { getMyContext } from '@/src/api/me.api';
import type { TokenBundle } from '@/src/types/auth';

export default function LoginRoute() {
  const router = useRouter();
  const { signIn } = useAuth();

  return (
    <SuperAdminLoginScreen
      onLogin={async (authData: TokenBundle) => {
        await signIn(authData);
        const context = await getMyContext(authData.accessToken);
        router.replace(context.activeLeases.length > 0 ? '/tenant-home' : '/command-center');
      }}
      onNavigateToSignup={() => router.push('/signup')}
    />
  );
}
