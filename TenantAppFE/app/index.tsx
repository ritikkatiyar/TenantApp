import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import React from 'react';

import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getMyContext } from '@/src/features/auth/api/me.api';

export default function IndexScreen() {
  const { accessToken, isAuthenticated, isReady, setContext } = useAuth();
  const [target, setTarget] = React.useState<'/command-center' | '/tenant-home' | null>(null);

  React.useEffect(() => {
    if (!isReady || !isAuthenticated || !accessToken) {
      return;
    }

    let isMounted = true;
    getMyContext(accessToken)
      .then((context) => {
        if (isMounted) {
          setContext(context);
          if (context.isTenant && !context.isLandlord) {
            setTarget('/tenant-home');
          } else if (!context.isTenant && context.isLandlord) {
            setTarget('/command-center');
          } else if (context.isTenant && context.isLandlord) {
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
