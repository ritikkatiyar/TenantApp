import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import React from 'react';

import { useAuth } from '@/src/auth/AuthProvider';
import { getMyContext } from '@/src/api/me.api';

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
          setTarget(context.activeLeases.length > 0 ? '/tenant-home' : '/command-center');
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
