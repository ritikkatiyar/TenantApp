import { Redirect, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import TenantMaintenanceScreen from '@/src/features/tenant/screens/TenantMaintenanceScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function TenantMaintenanceRoute() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isReady, signOut } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <TenantMaintenanceScreen
      token={accessToken}
      onLogout={() => {
        Alert.alert(
          'Confirm Logout',
          'Are you sure you want to log out from Livic?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Log Out', 
              style: 'destructive', 
              onPress: async () => {
                await signOut();
                router.replace('/login');
              } 
            }
          ]
        );
      }}
    />
  );
}
