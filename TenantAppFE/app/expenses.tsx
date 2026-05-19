import { Redirect } from 'expo-router';

import ExpenseConfigurationScreen from '@/src/screens/ExpenseConfigurationScreen';
import { useAuth } from '@/src/auth/AuthProvider';

export default function ExpensesRoute() {
  const { accessToken, isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <ExpenseConfigurationScreen token={accessToken} />;
}
