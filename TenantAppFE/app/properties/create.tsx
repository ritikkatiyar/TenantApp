import { Redirect, useRouter } from 'expo-router';

import CreatePropertyScreen from '@/src/screens/CreatePropertyScreen';
import { useAuth } from '@/src/auth/AuthProvider';

export default function CreatePropertyRoute() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isReady, user } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <CreatePropertyScreen
      userToken={accessToken}
      ownerId={user?.id || ''}
      onBack={() => router.back()}
      onSaveAndConfigure={() => router.replace('/command-center')}
    />
  );
}
