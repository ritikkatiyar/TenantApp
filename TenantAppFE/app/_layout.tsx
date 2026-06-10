import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/src/auth/AuthProvider';
import BottomNavigation from '@/src/components/BottomNavigation';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="command-center" />
            <Stack.Screen name="ai" />
            <Stack.Screen name="tenant-home" />
            <Stack.Screen name="properties/create" />
            <Stack.Screen name="escalations" />
            <Stack.Screen name="announcements" />
          </Stack>
          <BottomNavigation />
        </View>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
