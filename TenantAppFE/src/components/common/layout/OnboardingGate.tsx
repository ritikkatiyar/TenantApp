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

  console.log('[OnboardingGate] Render:', {
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
    console.log('[OnboardingGate] Effect triggered');
    let isMounted = true;

    if (!isAuthenticated) {
      if (isOnboarded !== null) {
        console.log('[OnboardingGate] Resetting isOnboarded to null because not authenticated');
        setIsOnboarded(null);
      }
      return;
    }

    if (isOnboardingRoute) {
      if (isOnboarded !== null) {
        console.log('[OnboardingGate] Resetting isOnboarded to null because on onboarding route');
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
          console.log('[OnboardingGate] Setting loading to true');
          setLoading(true);
        }

        try {
          let currentContext = context;
          if (!currentContext) {
            console.log('[OnboardingGate] Fetching user context');
            currentContext = await getMyContext(accessToken);
            if (isMounted) {
              setContext(currentContext);
            }
          }

          if (currentContext.isTenant && !currentContext.isLandlord) {
            // Pure tenants bypass onboarding
            if (isMounted) {
              console.log('[OnboardingGate] Pure tenant, setting isOnboarded to true');
              setIsOnboarded(true);
            }
          } else {
            // Check preference for landlords/others
            console.log('[OnboardingGate] Fetching user preferences');
            const pref = await getUserPreference(accessToken);
            if (isMounted) {
              console.log('[OnboardingGate] Setting isOnboarded to', pref.onboardingDone);
              setIsOnboarded(pref.onboardingDone);
            }
          }
        } catch (error) {
          console.error('[OnboardingGate] Error during init:', error);
          if (isMounted) {
            setIsOnboarded(false);
          }
        } finally {
          if (shouldShowSpinner && isMounted) {
            console.log('[OnboardingGate] Setting loading to false');
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
      console.log('[OnboardingGate] Redirecting to /login programmatically');
      router.replace('/login');
    } else if (isAuthenticated && !isAuthRoute && !isOnboardingRoute && isOnboarded === false) {
      console.log('[OnboardingGate] Redirecting to /onboarding programmatically');
      router.replace('/onboarding');
    }
  }, [isReady, isAuthenticated, isAuthRoute, isOnboardingRoute, isOnboarded, pathname]);

  if (!isReady) {
    console.log('[OnboardingGate] Rendering initial spinner because not ready');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafa' }}>
        <ActivityIndicator size="large" color="#006875" />
      </View>
    );
  }

  // Render a clean loading spinner while transition redirects are in progress
  const isPendingRedirect = 
    (!isAuthenticated && !isAuthRoute && pathname !== '/') ||
    (isAuthenticated && !isAuthRoute && !isOnboardingRoute && isOnboarded === false);

  if (isPendingRedirect) {
    console.log('[OnboardingGate] Rendering redirect pending spinner');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafa' }}>
        <ActivityIndicator size="large" color="#006875" />
      </View>
    );
  }

  const showSpinner = isAuthenticated && !isAuthRoute && !isOnboardingRoute && (loading || isOnboarded === null);

  console.log('[OnboardingGate] Rendering main view. showSpinner:', showSpinner);
  return (
    <>
      {children}
      {showSpinner && (
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafa', zIndex: 9999 }]}>
          <ActivityIndicator size="large" color="#006875" />
        </View>
      )}
    </>
  );
}

