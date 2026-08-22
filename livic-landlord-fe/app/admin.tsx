import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Admin Panel</Text>
      <Text style={styles.subtext}>Coming Soon</Text>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.Colors.background,
  },
  text: {
    fontSize: theme.Typography.HeadlineSmall.fontSize,
    fontWeight: 'bold',
    color: theme.Colors.primary,
  },
  subtext: {
    fontSize: theme.Typography.BodyLarge.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 8,
  },
});
