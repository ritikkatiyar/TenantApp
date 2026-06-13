import { Redirect } from 'expo-router';

import AIAssistantScreen from '@/src/features/ai/screens/AIAssistantScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function AIRoute() {
  const { accessToken, isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <AIAssistantScreen token={accessToken} />;
}
