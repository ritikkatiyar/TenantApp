import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/src/theme/Theme';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

export default function UnitDetailScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { handleScroll } = useScrollNav();
  return (
    <LinearGradient
      colors={(theme.Colors.backgroundGradient || ['#d4f5f9', '#e8f8fb', '#e2e0fb']) as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.container}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Unit Details</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.placeholderText}>Unit Details Content Goes Here</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: theme.Spacing.lg,
  },
  title: {
    fontSize: theme.Typography.headlineLg.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
  },
  content: {
    padding: theme.Spacing.lg,
  },
  placeholderText: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    color: theme.Colors.onSurfaceVariant,
  }
});
