import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { logout, refresh } from '@/src/features/auth/api/auth.api';
import { setAuthRefreshHandler } from '@/src/api/client';
import type { AuthUserSummary, TokenBundle } from '@/src/types/auth';
import { clearStoredAuth, readStoredAuth, writeStoredAuth } from '@/src/features/auth/utils/tokenStorage';

type AuthContextValue = {
  accessToken: string;
  user: AuthUserSummary | null;
  isAuthenticated: boolean;
  isReady: boolean;
  signIn: (nextAuthData: TokenBundle) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<TokenBundle | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [authData, setAuthData] = useState<TokenBundle | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    readStoredAuth()
      .then((storedAuthData) => {
        if (isMounted) {
          setAuthData(storedAuthData);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = React.useCallback(async (nextAuthData: TokenBundle) => {
    setAuthData(nextAuthData);
    await writeStoredAuth(nextAuthData);
  }, []);

  const signOut = React.useCallback(async () => {
    const refreshToken = authData?.refreshToken;
    setAuthData(null);
    await clearStoredAuth();

    if (refreshToken) {
      try {
        await logout({ refreshToken });
      } catch (error) {
        console.warn('Logout token revoke failed:', error);
      }
    }
  }, [authData?.refreshToken]);

  const refreshSession = React.useCallback(async () => {
    if (!authData?.refreshToken) {
      return null;
    }

    try {
      const nextAuthData = await refresh({ refreshToken: authData.refreshToken });
      setAuthData(nextAuthData);
      await writeStoredAuth(nextAuthData);
      return nextAuthData;
    } catch (error) {
      console.warn('Session refresh failed:', error);
      setAuthData(null);
      await clearStoredAuth();
      return null;
    }
  }, [authData?.refreshToken]);

  // Register the refresh handler with the API client
  useEffect(() => {
    setAuthRefreshHandler(async () => {
      const result = await refreshSession();
      return result?.accessToken || null;
    });
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(() => ({
    accessToken: authData?.accessToken || '',
    user: authData?.user || null,
    isAuthenticated: Boolean(authData?.accessToken),
    isReady,
    signIn,
    signOut,
    refreshSession,
  }), [authData, isReady, signIn, signOut, refreshSession]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
