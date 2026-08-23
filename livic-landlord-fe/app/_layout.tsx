import React, { useEffect, useState, useMemo } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from 'react-native';
import { AuthProvider } from '@/src/features/auth/context/AuthProvider';
import { ThemeContextProvider } from '@/src/theme/ThemeContext';
import BottomNavigation from '@/src/components/common/navigation/BottomNavigation';
import SidebarNavigation from '@/src/components/common/navigation/SidebarNavigation';
import MobileHeader from '@/src/components/common/navigation/MobileHeader';
import MobileMoreSheet from '@/src/components/common/navigation/MobileMoreSheet';
import QRScannerModal from '@/src/components/common/navigation/QRScannerModal';
import FloatingAIAssistant from '@/src/components/common/navigation/FloatingAIAssistant';
import { ScrollProvider } from '@/src/components/common/navigation/ScrollContext';
import { ScreenWrapper } from '@/src/components/common/layout/ScreenWrapper';
import { OnboardingGate } from '@/src/components/common/layout/OnboardingGate';
import { useResponsive } from '@/src/hooks/useResponsive';
import { ToastProvider } from '@/src/components/common/feedback/ToastContext';
import ErrorBoundary from '@/src/components/common/feedback/ErrorBoundary';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useProperties } from '@/src/hooks/useProperties';
import { LinearGradient } from 'expo-linear-gradient';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { LightColors } from '@/src/theme/Theme';

const ROUTE_TITLES: Record<string, string> = {
  '/command-center': 'Portfolio',
  '/leases': 'Leases',
  '/inventory': 'Items',
  '/expenses': 'Finance',
  '/reports': 'Reports',
  '/ai': 'AI Desk',
  '/escalations': 'Escalations',
  '/announcements': 'Announcements',
  '/analytics': 'Overview',
  '/settings': 'Settings',
};

function getHeaderTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname];
  }
  if (pathname.startsWith('/properties/')) {
    if (pathname.includes('/floors/')) {
      return 'Floor View';
    }
    return 'Property Details';
  }
  if (pathname.startsWith('/expenses')) {
    return 'Finance';
  }
  return 'Livic';
}

const PRIMARY_ROUTES = [
  '/command-center',
  '/leases',
  '/inventory',
  '/expenses',
  '/analytics',
  '/reports',
  '/ai',
  '/announcements',
  '/escalations',
  '/settings'
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

import { PropertySelectionProvider, useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';

function DesktopLayoutShell({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  const pathname = usePathname();
  const { properties } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, searchQuery, setSearchQuery } = useGlobalPropertySelection();

  return (
    <LinearGradient
      colors={(theme.Colors.backgroundGradient || ['#d4f5f9', '#e8f8fb', '#e2e0fb']) as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, flexDirection: 'row' }}
    >
      {/* 1. Persistent Pinned Left Sidebar */}
      <SidebarNavigation />

      {/* 2. Main Desktop Column with Persistent Pinned Topbar */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <DesktopNavBar 
          properties={(properties || []).map((p: any) => ({ id: p.id, name: p.name }))}
          selectedPropertyId={selectedPropertyId}
          onPropertyChange={setSelectedPropertyId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search property or portfolio..."
        />

        {/* 3. Dynamic Inner Screen View */}
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </View>
    </LinearGradient>
  );
}

function MobileLayoutShell({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  return (
    <LinearGradient
      colors={(theme.Colors.backgroundGradient || ['#d4f5f9', '#e8f8fb', '#e2e0fb']) as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, flexDirection: 'column' }}
    >
      {children}
    </LinearGradient>
  );
}

function NavigationThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useAppTheme();
  const navTheme = React.useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: 'transparent',
      },
    };
  }, [isDark]);

  return (
    <ThemeProvider value={navTheme}>
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const { isDesktop } = useResponsive();
  const pathname = usePathname();

  const [moreSheetVisible, setMoreSheetVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (Platform.OS === 'web') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Manrope:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&family=Hanken+Grotesk:wght@400;600;700;800&display=swap';
      document.head.appendChild(link);

      const style = document.createElement('style');
      style.textContent = `
        input, textarea, select {
          outline: none !important;
          box-shadow: none !important;
        }
        input:focus, textarea:focus, select:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        *:focus {
          outline: none !important;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 104, 117, 0.15);
          border-radius: 999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 104, 117, 0.35);
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const hideNavigation = pathname === '/login' || pathname === '/signup';
  const cleanPathname = pathname.split('?')[0];
  const isPrimaryRoute = PRIMARY_ROUTES.includes(cleanPathname);
  const showDesktop = mounted && isDesktop;
  const hideHeader = hideNavigation || pathname === '/' || pathname === '/onboarding' || !isPrimaryRoute;

  if (!mounted && Platform.OS === 'web') {
    return <View style={{ flex: 1, backgroundColor: LightColors.background }} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeContextProvider>
        <NavigationThemeWrapper>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <ToastProvider>
                <AuthProvider>
                  <PropertySelectionProvider>
                    <ScrollProvider>
                    {showDesktop && !hideNavigation ? (
                      <DesktopLayoutShell>
                        <ScreenWrapper isAuth={hideNavigation}>
                          <OnboardingGate>
                            <Stack screenOptions={{ 
                              headerShown: false, 
                              contentStyle: { backgroundColor: 'transparent' },
                              animation: 'fade',
                              animationDuration: 220,
                            }}>
                              <Stack.Screen name="index" />
                              <Stack.Screen name="login" />
                              <Stack.Screen name="signup" />
                              <Stack.Screen name="onboarding" />
                              <Stack.Screen name="command-center" />
                              <Stack.Screen name="ai" />
                              <Stack.Screen name="admin" />
                              <Stack.Screen name="analytics" />
                              <Stack.Screen name="reports" />
                              <Stack.Screen name="billing" />
                              <Stack.Screen name="expenses/index" />
                              <Stack.Screen name="leases" />
                              <Stack.Screen name="inventory" />
                              <Stack.Screen name="create-expense" />
                              <Stack.Screen name="properties/create" />
                              <Stack.Screen name="properties/[id]/index" />
                              <Stack.Screen name="properties/[id]/meter-readings" />
                              <Stack.Screen name="escalations" />
                              <Stack.Screen name="announcements" />
                              <Stack.Screen name="settings" />
                            </Stack>
                          </OnboardingGate>
                        </ScreenWrapper>
                      </DesktopLayoutShell>
                    ) : (
                      <MobileLayoutShell>
                        {!hideHeader && (
                          <MobileHeader 
                            title={getHeaderTitle(pathname)} 
                            onNotificationPress={() => router.push('/escalations')}
                          />
                        )}
                        <ScreenWrapper isAuth={hideNavigation}>
                          <OnboardingGate>
                            <Stack screenOptions={{ 
                              headerShown: false, 
                              contentStyle: { backgroundColor: 'transparent' },
                              animation: 'fade',
                              animationDuration: 220,
                            }}>
                              <Stack.Screen name="index" />
                              <Stack.Screen name="login" />
                              <Stack.Screen name="signup" />
                              <Stack.Screen name="onboarding" />
                              <Stack.Screen name="command-center" />
                              <Stack.Screen name="ai" />
                              <Stack.Screen name="admin" />
                              <Stack.Screen name="analytics" />
                              <Stack.Screen name="reports" />
                              <Stack.Screen name="billing" />
                              <Stack.Screen name="expenses/index" />
                              <Stack.Screen name="leases" />
                              <Stack.Screen name="inventory" />
                              <Stack.Screen name="create-expense" />
                              <Stack.Screen name="properties/create" />
                              <Stack.Screen name="properties/[id]/index" />
                              <Stack.Screen name="properties/[id]/meter-readings" />
                              <Stack.Screen name="escalations" />
                              <Stack.Screen name="announcements" />
                              <Stack.Screen name="settings" />
                            </Stack>
                          </OnboardingGate>
                        </ScreenWrapper>
                      </MobileLayoutShell>
                    )}
                    
                    {!showDesktop && !hideNavigation && !(pathname === '/ai' || pathname.startsWith('/ai') || pathname === '/ai-assistant') && (
                      <>
                        <BottomNavigation 
                          onMorePress={() => setMoreSheetVisible(true)} 
                          onQRPress={() => setQrModalVisible(true)} 
                        />
                        <FloatingAIAssistant />
                        <MobileMoreSheet 
                          visible={moreSheetVisible} 
                          onClose={() => setMoreSheetVisible(false)} 
                        />
                        <QRScannerModal 
                          visible={qrModalVisible} 
                          onClose={() => setQrModalVisible(false)} 
                        />
                      </>
                    )}
                    </ScrollProvider>
                  </PropertySelectionProvider>
                </AuthProvider>
          </ToastProvider>
          <StatusBar style="auto" translucent backgroundColor="transparent" />
        </QueryClientProvider>
      </ErrorBoundary>
    </NavigationThemeWrapper>
  </ThemeContextProvider>
</SafeAreaProvider>
  );
}
