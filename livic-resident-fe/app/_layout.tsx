import { useEffect, useState, lazy, Suspense } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/src/features/auth/context/AuthProvider';
import BottomNavigation from '@/src/components/common/navigation/BottomNavigation';
import SidebarNavigation from '@/src/components/common/navigation/SidebarNavigation';
import MobileHeader from '@/src/components/common/navigation/MobileHeader';
import MobileMoreSheet from '@/src/components/common/navigation/MobileMoreSheet';
import { ScrollProvider } from '@/src/components/common/navigation/ScrollContext';
import { ScreenWrapper } from '@/src/components/common/layout/ScreenWrapper';
import { OnboardingGate } from '@/src/components/common/layout/OnboardingGate';
import { useResponsive } from '@/hooks/useResponsive';
import { ToastProvider } from '@/src/components/common/feedback/ToastContext';

// Lazily load QRScannerModal only on native — expo-camera is not SSR/web-export safe
// and will crash Expo's static export (`npx expo export --platform web`) if imported statically.
const QRScannerModal = Platform.OS !== 'web'
  ? lazy(() => import('@/src/components/common/navigation/QRScannerModal'))
  : () => null;

const ROUTE_TITLES: Record<string, string> = {
  '/tenant-home': 'My Home',
  '/tenant-property': 'Property',
  '/tenant-inventory': 'Items',
  '/tenant-payments': 'Payments',
  '/tenant-maintenance': 'Support',
  '/settings': 'Settings',
};

function getHeaderTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname];
  }
  return 'Livic';
}

const PRIMARY_ROUTES = [
  '/tenant-home',
  '/tenant-property',
  '/tenant-inventory',
  '/tenant-payments',
  '/tenant-maintenance',
  '/settings'
];

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
    }
  }, []);

  const hideNavigation = pathname === '/login' || pathname === '/signup';
  const cleanPathname = pathname.split('?')[0];
  const isPrimaryRoute = PRIMARY_ROUTES.includes(cleanPathname);
  const showDesktop = mounted && isDesktop;
  const hideHeader = hideNavigation || pathname === '/' || pathname === '/onboarding' || !isPrimaryRoute;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ToastProvider>
          <AuthProvider>
            <ScrollProvider>
              <View style={{ flex: 1, flexDirection: showDesktop && !hideNavigation ? 'row' : 'column', backgroundColor: '#f9fafa' }}>
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
                        <Stack.Screen name="tenant-home" />
                        <Stack.Screen 
                          name="ai" 
                          options={{ 
                            presentation: 'transparentModal',
                            animation: 'fade',
                            contentStyle: { backgroundColor: 'transparent' }
                          }} 
                        />
                        <Stack.Screen name="tenant-property" />
                        <Stack.Screen name="tenant-inventory" />
                        <Stack.Screen name="tenant-maintenance" />
                        <Stack.Screen name="tenant-payments" />
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
                      <Suspense fallback={null}>
                        <QRScannerModal 
                          visible={qrModalVisible} 
                          onClose={() => setQrModalVisible(false)} 
                        />
                      </Suspense>
                    </>
                  )}
                </View>
              </View>
            </ScrollProvider>
          </AuthProvider>
        </ToastProvider>
        <StatusBar style="dark" translucent backgroundColor="transparent" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
