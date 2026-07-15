import { Redirect } from 'expo-router';
import TenantInventoryScreen from '@/src/features/inventory/screens/TenantInventoryScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function TenantInventoryRoute() {
  const { isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <TenantInventoryScreen />;
}
