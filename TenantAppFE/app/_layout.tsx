import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/src/features/auth/context/AuthProvider';
import BottomNavigation from '@/src/components/common/navigation/BottomNavigation';
import SidebarNavigation from '@/src/components/common/navigation/SidebarNavigation';
import { ScreenWrapper } from '@/src/components/common/layout/ScreenWrapper';
import { OnboardingGate } from '@/src/components/common/layout/OnboardingGate';
import { useResponsive } from '@/hooks/useResponsive';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isDesktop } = useResponsive();
  const pathname = usePathname();

  const hideNavigation = pathname === '/login' || pathname === '/signup';

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <View style={{ flex: 1, flexDirection: isDesktop && !hideNavigation ? 'row' : 'column', backgroundColor: '#f9fafa' }}>
          {isDesktop && !hideNavigation && <SidebarNavigation />}
          <View style={{ flex: 1 }}>
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
                  <Stack.Screen name="create-expense" />
                  <Stack.Screen name="properties/create" />
                  <Stack.Screen name="properties/[id]" />
                  <Stack.Screen name="properties/[id]/meter-readings" />
                  <Stack.Screen name="escalations" />
                  <Stack.Screen name="announcements" />
                  <Stack.Screen name="tenant-property" />
                  <Stack.Screen name="tenant-maintenance" />
                  <Stack.Screen name="tenant-payments" />
                </Stack>
              </OnboardingGate>
            </ScreenWrapper>
            {!isDesktop && !hideNavigation && <BottomNavigation />}
          </View>
        </View>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
