import { useRouter } from 'expo-router';

import SuperAdminLoginScreen from '@/src/features/auth/screens/SuperAdminLoginScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getMyContext } from '@/src/features/auth/api/me.api';
import { getPreference } from '@/src/features/auth/api/onboarding.api';
import type { TokenBundle } from '@/src/types/auth';

export default function LoginRoute() {
  const router = useRouter();
  const { signIn, setContext } = useAuth();

  return (
    <SuperAdminLoginScreen
      onLogin={async (authData: TokenBundle) => {
        await signIn(authData);
        
        const [preference, context] = await Promise.all([
          getPreference(authData.accessToken),
          getMyContext(authData.accessToken),
        ]);
        
        setContext(context);
        
        if (!preference.onboardingDone) {
          router.replace('/mode-selection');
        } else if (context.isLandlord && context.isTenant) {
          router.replace('/tenant-home');
        } else if (context.isLandlord && !context.isTenant) {
          router.replace('/command-center');
        } else if (!context.isLandlord && context.isTenant) {
          router.replace('/tenant-home');
        } else {
          // both false, but onboardingDone=true
          router.replace('/command-center');
        }
      }}
      onNavigateToSignup={() => router.push('/signup')}
    />
  );
}
