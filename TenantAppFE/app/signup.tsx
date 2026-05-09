import { useRouter } from 'expo-router';

import SuperAdminSignupScreen from '@/src/screens/SuperAdminSignupScreen';
import { useAuth } from '@/src/auth/AuthProvider';
import type { TokenBundle } from '@/src/types/auth';

export default function SignupRoute() {
  const router = useRouter();
  const { signIn } = useAuth();

  return (
    <SuperAdminSignupScreen
      onSignup={async (authData: TokenBundle) => {
        await signIn(authData);
        router.replace('/command-center');
      }}
      onNavigateToLogin={() => router.replace('/login')}
    />
  );
}
