import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import React from 'react';

import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getMyContext } from '@/src/features/auth/api/me.api';

export default function IndexScreen() {
  const { accessToken, isAuthenticated, isReady } = useAuth();
  const [target, setTarget] = React.useState<'/command-center' | '/tenant-home' | null>(null);

  React.useEffect(() => {
    if (!isReady || !isAuthenticated || !accessToken) {
      return;
    }

    let isMounted = true;
    getMyContext(accessToken)
      .then((context) => {
        if (isMounted) {
          const isGlobalAdmin = context.globalRole === 'SUPER_ADMIN' || context.globalRole === 'ADMIN';
          const hasOwnerOrManagerMembership = context.memberships?.some(
            m => m.membershipRoleCode === 'PROPERTY_OWNER' || m.membershipRoleCode === 'PROPERTY_MANAGER'
          );
          
          if (isGlobalAdmin || hasOwnerOrManagerMembership) {
            setTarget('/command-center');
          } else if (context.memberships?.some(m => m.membershipRoleCode === 'PROPERTY_TENANT') || context.activeLeases?.length > 0) {
            setTarget('/tenant-home');
          } else {
            setTarget('/command-center');
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setTarget('/command-center');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthenticated, isReady]);

  if (!isReady || (isAuthenticated && !target)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? target! : '/login'} />;
}
