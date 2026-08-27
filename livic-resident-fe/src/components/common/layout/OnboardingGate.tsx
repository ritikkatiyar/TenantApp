import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useEffect, useState } from 'react';
import { Redirect, usePathname, useRouter } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getUserPreference } from '@/src/features/user/api/userPreference.api';
import { getMyContext } from '@/src/features/auth/api/me.api';
import { View, ActivityIndicator } from 'react-native';
import { logger } from '@/src/utils/logger';

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  const { isAuthenticated, isReady, accessToken, context, setContext } = useAuth();
  const pathname = usePathname();
  // Default to true when authenticated so F5 refresh loads children instantly without blocking spinner
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(() => (accessToken ? true : null));
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
      return;
    }

    if (isReady && !isAuthRoute && !isOnboardingRoute && accessToken) {
      const runInit = async () => {
        try {
          let currentContext = context;
          if (!currentContext) {
            currentContext = await getMyContext(accessToken);
            if (isMounted) {
              setContext(currentContext);
            }
          }

          const pref = await getUserPreference(accessToken);
          if (isMounted) {
            setIsOnboarded(pref.onboardingDone);
          }
        } catch (error) {
          logger.error('[OnboardingGate] Error during init:', error);
          if (isMounted && isOnboarded === null) {
            setIsOnboarded(true);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      runInit();
    }

    return () => {
      isMounted = false;
    };
  }, [isReady, isAuthenticated, pathname, accessToken]);

  // Programmatic redirection for non-authenticated or un-onboarded users
  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated && !isAuthRoute && pathname !== '/') {
      router.replace('/login');
    } else if (isAuthenticated && !isAuthRoute && !isOnboardingRoute && isOnboarded === false) {
      router.replace('/onboarding');
    }
  }, [isReady, isAuthenticated, isAuthRoute, isOnboardingRoute, isOnboarded, pathname]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.Colors.background }}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
      </View>
    );
  }

  const isPendingRedirect = 
    (!isAuthenticated && !isAuthRoute && pathname !== '/') ||
    (isAuthenticated && !isAuthRoute && !isOnboardingRoute && isOnboarded === false);

  if (isPendingRedirect) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.Colors.background }}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}
