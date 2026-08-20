import React from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

interface PageShellProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardAvoiding?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}

export function PageShell({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  keyboardAvoiding = false,
  edges = ['top', 'left', 'right'],
}: PageShellProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { handleScroll } = useScrollNav();

  const container = (
    <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flatContainer, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );

  return (
    <LinearGradient
      colors={(theme.Colors.backgroundGradient || ['#d4f5f9', '#e8f8fb', '#e2e0fb']) as [string, string, ...string[]]}
      style={styles.gradient}
    >
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          {container}
        </KeyboardAvoidingView>
      ) : (
        container
      )}
    </LinearGradient>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.Spacing.containerPadding,
    paddingBottom: theme.Spacing.stackLg + 100, // Extra padding for bottom pill navigation
  },
  flatContainer: {
    flex: 1,
    paddingHorizontal: theme.Spacing.containerPadding,
  },
});
