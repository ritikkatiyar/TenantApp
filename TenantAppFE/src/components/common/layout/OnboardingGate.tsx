import React, { useEffect, useState } from 'react';
import { Redirect, usePathname, useRouter } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getUserPreference } from '@/src/features/user/api/userPreference.api';
import { getMyContext } from '@/src/features/auth/api/me.api';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady, accessToken, context, setContext } = useAuth();
  const pathname = usePathname();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isOnboardingRoute = pathname === '/onboarding';

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated) {
      if (isOnboarded !== null) {
        setIsOnboarded(null);
      }
      return;
    }

    if (isOnboardingRoute) {
      if (isOnboarded !== null) {
        setIsOnboarded(null);
      }
      return;
    }

    if (isReady && !isAuthRoute && !isOnboardingRoute && accessToken) {
      // If we already know onboarding state (either true or false), do nothing
      if (isOnboarded !== null) {
        return;
      }

      const runInit = async () => {
        const shouldShowSpinner = isOnboarded === null || !context;
        if (shouldShowSpinner && isMounted) {
          setLoading(true);
        }

        try {
          let currentContext = context;
          if (!currentContext) {
            currentContext = await getMyContext(accessToken);
            if (isMounted) {
              setContext(currentContext);
            }
          }

          if (currentContext.isTenant && !currentContext.isLandlord) {
            // Pure tenants bypass onboarding
            if (isMounted) {
              setIsOnboarded(true);
            }
          } else {
            // Check preference for landlords/others
            const pref = await getUserPreference(accessToken);
            if (isMounted) {
              setIsOnboarded(pref.onboardingDone);
            }
          }
        } catch (error) {
          // If error (e.g. 404 meaning no preference saved yet), we treat as not onboarded
          if (isMounted) {
            setIsOnboarded(false);
          }
        } finally {
          if (shouldShowSpinner && isMounted) {
            setLoading(false);
          }
        }
      };

      runInit();
    }

    return () => {
      isMounted = false;
    };
  }, [isReady, isAuthenticated, pathname, accessToken, isOnboarded, context]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If authenticated, not on auth routes, and not onboarded, redirect to onboarding
  if (isAuthenticated && !isAuthRoute && !isOnboardingRoute && isOnboarded === false) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <>
      {children}
      {isAuthenticated && !isAuthRoute && !isOnboardingRoute && loading && (
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(249, 250, 250, 0.8)', zIndex: 9999 }]}>
          <ActivityIndicator size="large" color="#006875" />
        </View>
      )}
    </>
  );
}

