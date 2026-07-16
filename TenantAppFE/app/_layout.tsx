import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/src/features/auth/context/AuthProvider';
import BottomNavigation from '@/src/components/common/navigation/BottomNavigation';
import SidebarNavigation from '@/src/components/common/navigation/SidebarNavigation';
import MobileHeader from '@/src/components/common/navigation/MobileHeader';
import MobileDrawer from '@/src/components/common/navigation/MobileDrawer';
import FloatingAIAssistant from '@/src/components/common/navigation/FloatingAIAssistant';
import { ScreenWrapper } from '@/src/components/common/layout/ScreenWrapper';
import { OnboardingGate } from '@/src/components/common/layout/OnboardingGate';
import { useResponsive } from '@/hooks/useResponsive';
import { ToastProvider } from '@/src/components/common/feedback/ToastContext';

const ROUTE_TITLES: Record<string, string> = {
  '/command-center': 'Portfolio',
  '/tenant-home': 'My Home',
  '/leases': 'Leases',
  '/inventory': 'Items',
  '/expenses': 'Finance',
  '/reports': 'Reports',
  '/ai': 'AI Desk',
  '/escalations': 'Escalations',
  '/announcements': 'Announcements',
  '/tenant-property': 'Property',
  '/tenant-inventory': 'Items',
  '/tenant-payments': 'Payments',
  '/tenant-maintenance': 'Support',
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
  '/tenant-home',
  '/tenant-property',
  '/tenant-inventory',
  '/tenant-payments',
  '/tenant-maintenance',
  '/analytics',
  '/reports',
  '/ai',
  '/announcements',
  '/escalations',
  '/settings'
];

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isDesktop } = useResponsive();
  const pathname = usePathname();
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Manrope:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&family=Hanken+Grotesk:wght@400;600;700;800&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const hideNavigation = pathname === '/login' || pathname === '/signup';
  const isPrimaryRoute = PRIMARY_ROUTES.some(route => pathname === route || pathname.startsWith(route + '?'));
  const hideHeader = hideNavigation || pathname === '/' || pathname === '/onboarding' || !isPrimaryRoute;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ToastProvider>
        <AuthProvider>
          <View style={{ flex: 1, flexDirection: isDesktop && !hideNavigation ? 'row' : 'column', backgroundColor: '#f9fafa' }}>
            {isDesktop && !hideNavigation && <SidebarNavigation />}
            <View style={{ flex: 1 }}>
              {!isDesktop && !hideHeader && (
                <MobileHeader 
                  title={getHeaderTitle(pathname)} 
                  onMenuPress={() => setDrawerVisible(true)} 
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
                    <Stack.Screen name="tenant-home" />
                    <Stack.Screen name="admin" />
                    <Stack.Screen name="analytics" />
                    <Stack.Screen name="reports" />
                    <Stack.Screen name="billing" />
                    <Stack.Screen name="expenses" />
                    <Stack.Screen name="leases" />
                    <Stack.Screen name="inventory" />
                    <Stack.Screen name="create-expense" />
                    <Stack.Screen name="properties/create" />
                    <Stack.Screen name="properties/[id]" />
                    <Stack.Screen name="properties/[id]/meter-readings" />
                    <Stack.Screen name="escalations" />
                    <Stack.Screen name="announcements" />
                    <Stack.Screen name="tenant-property" />
                    <Stack.Screen name="tenant-inventory" />
                    <Stack.Screen name="tenant-maintenance" />
                    <Stack.Screen name="tenant-payments" />
                    <Stack.Screen name="settings" />
                  </Stack>
                </OnboardingGate>
              </ScreenWrapper>
              {!isDesktop && !hideNavigation && <BottomNavigation />}
              {!isDesktop && !hideHeader && (
                <>
                  <MobileDrawer 
                    visible={drawerVisible} 
                    onClose={() => setDrawerVisible(false)} 
                  />
                  <FloatingAIAssistant />
                </>
              )}
            </View>
          </View>
        </AuthProvider>
      </ToastProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
