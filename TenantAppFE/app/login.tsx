import { useRouter } from 'expo-router';

import SuperAdminLoginScreen from '@/src/screens/SuperAdminLoginScreen';
import { useAuth } from '@/src/auth/AuthProvider';
import type { TokenBundle } from '@/src/types/auth';

export default function LoginRoute() {
  const router = useRouter();
  const { signIn } = useAuth();

  return (
    <SuperAdminLoginScreen
      onLogin={async (authData: TokenBundle) => {
        await signIn(authData);
        router.replace('/command-center');
      }}
      onNavigateToSignup={() => router.push('/signup')}
    />
  );
}
