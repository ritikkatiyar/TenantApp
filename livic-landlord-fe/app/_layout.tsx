import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname } from 'expo-router';
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
import { ScrollProvider } from '@/src/components/common/navigation/ScrollContext';
import { ScreenWrapper } from '@/src/components/common/layout/ScreenWrapper';
import { OnboardingGate } from '@/src/components/common/layout/OnboardingGate';
import { useResponsive } from '@/src/hooks/useResponsive';
import { ToastProvider } from '@/src/components/common/feedback/ToastContext';
import ErrorBoundary from '@/src/components/common/feedback/ErrorBoundary';
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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isDesktop } = useResponsive();
  const pathname = usePathname();

  const [moreSheetVisible, setMoreSheetVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

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
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <ToastProvider>
                <AuthProvider>
                  <ScrollProvider>
                <View style={{ flex: 1, flexDirection: showDesktop && !hideNavigation ? 'row' : 'column', backgroundColor: LightColors.background }}>
                  {showDesktop && !hideNavigation && <SidebarNavigation />}
                  <View style={{ flex: 1 }}>
                    {!showDesktop && !hideHeader && (
                      <MobileHeader 
                        title={getHeaderTitle(pathname)} 
                        onMenuPress={() => setMoreSheetVisible(true)} 
                      />
                    )}
                    <ScreenWrapper isAuth={hideNavigation}>
                      <OnboardingGate>
                        <Stack screenOptions={{ headerShown: false }}>
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
                    
                    {!showDesktop && !hideNavigation && !(pathname === '/ai' || pathname.startsWith('/ai') || pathname === '/ai-assistant') && (
                      <>
                        <BottomNavigation 
                          onMorePress={() => setMoreSheetVisible(true)} 
                          onQRPress={() => setQrModalVisible(true)} 
                        />
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
                  </View>
                </View>
              </ScrollProvider>
            </AuthProvider>
          </ToastProvider>
          <StatusBar style="dark" translucent backgroundColor="transparent" />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </ThemeContextProvider>
</SafeAreaProvider>
  );
}
