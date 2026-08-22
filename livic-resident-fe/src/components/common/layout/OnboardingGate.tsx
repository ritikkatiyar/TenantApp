import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useEffect, useState } from 'react';
import { Redirect, usePathname, useRouter } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { getUserPreference } from '@/src/features/user/api/userPreference.api';
import { getMyContext } from '@/src/features/auth/api/me.api';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { logger } from '@/src/utils/logger';

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { theme, isDark } = useAppTheme();
  const { isAuthenticated, isReady, accessToken, context, setContext } = useAuth();
  const pathname = usePathname();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isOnboardingRoute = pathname === '/onboarding';

  logger.debug('[OnboardingGate] Render:', {
    isReady,
    isAuthenticated,
    pathname,
    isAuthRoute,
    isOnboardingRoute,
    isOnboarded,
    loading,
    hasAccessToken: !!accessToken,
    hasContext: !!context,
  });

  useEffect(() => {
    logger.debug('[OnboardingGate] Effect triggered');
    let isMounted = true;

    if (!isAuthenticated) {
      if (isOnboarded !== null) {
        logger.debug('[OnboardingGate] Resetting isOnboarded to null because not authenticated');
        setIsOnboarded(null);
      }
      return;
    }

    if (isOnboardingRoute) {
      if (isOnboarded !== null) {
        logger.debug('[OnboardingGate] Resetting isOnboarded to null because on onboarding route');
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
          logger.debug('[OnboardingGate] Setting loading to true');
          setLoading(true);
        }

        try {
          let currentContext = context;
          if (!currentContext) {
            logger.info('[OnboardingGate] Fetching user context');
            currentContext = await getMyContext(accessToken);
            if (isMounted) {
              setContext(currentContext);
            }
          }

          if (currentContext.isTenant || !currentContext.isLandlord) {
            // Pure tenants / residents bypass landlord onboarding in resident app
            if (isMounted) {
              logger.info('[OnboardingGate] Resident user, setting isOnboarded to true');
              setIsOnboarded(true);
            }
          } else {
            // Check preference for landlords/others
            logger.info('[OnboardingGate] Fetching user preferences');
            const pref = await getUserPreference(accessToken);
            if (isMounted) {
              logger.info('[OnboardingGate] Setting isOnboarded to', pref.onboardingDone);
              setIsOnboarded(pref.onboardingDone);
            }
          }
        } catch (error) {
          logger.error('[OnboardingGate] Error during init:', error);
          if (isMounted) {
            setIsOnboarded(false);
          }
        } finally {
          if (shouldShowSpinner && isMounted) {
            logger.debug('[OnboardingGate] Setting loading to false');
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

  // Programmatic redirection to avoid layout engine unmount constraints of Redirect component
  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated && !isAuthRoute && pathname !== '/') {
      logger.debug('[OnboardingGate] Redirecting to /login programmatically');
      router.replace('/login');
    } else if (isAuthenticated && !isAuthRoute && !isOnboardingRoute && isOnboarded === false) {
      logger.debug('[OnboardingGate] Redirecting to /onboarding programmatically');
      router.replace('/onboarding');
    }
  }, [isReady, isAuthenticated, isAuthRoute, isOnboardingRoute, isOnboarded, pathname]);

  if (!isReady) {
    logger.debug('[OnboardingGate] Rendering initial spinner because not ready');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.Colors.background }}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
      </View>
    );
  }

  // Render a clean loading spinner while transition redirects are in progress
  const isPendingRedirect = 
    (!isAuthenticated && !isAuthRoute && pathname !== '/') ||
    (isAuthenticated && !isAuthRoute && !isOnboardingRoute && isOnboarded === false);

  if (isPendingRedirect) {
    logger.debug('[OnboardingGate] Rendering redirect pending spinner');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.Colors.background }}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
      </View>
    );
  }

  const showSpinner = isAuthenticated && !isAuthRoute && !isOnboardingRoute && (loading || isOnboarded === null);

  logger.debug('[OnboardingGate] Rendering main view. showSpinner:', showSpinner);
  return (
    <>
      {children}
      {showSpinner && (
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.Colors.background, zIndex: 9999 }]}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
        </View>
      )}
    </>
  );
}

