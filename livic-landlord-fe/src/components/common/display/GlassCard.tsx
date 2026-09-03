import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export function GlassCard({
  children,
  style,
  contentStyle,
  intensity = 70,
  tint,
}: GlassCardProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const activeTint = tint ?? (isDark ? 'dark' : 'light');

  const flattened = StyleSheet.flatten(style);
  const inheritedAlignment: ViewStyle = {};
  if (flattened?.alignItems) inheritedAlignment.alignItems = flattened.alignItems;
  if (flattened?.justifyContent) inheritedAlignment.justifyContent = flattened.justifyContent;

  return (
    <View style={[styles.outerContainer, style]}>
      <BlurView intensity={intensity} tint={activeTint} style={[styles.blurView, inheritedAlignment.justifyContent ? { flex: 1 } : null]}>
        <View style={[styles.content, inheritedAlignment, contentStyle]}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  outerContainer: {
    borderRadius: theme.Rounded.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.Colors.glassStroke,
    backgroundColor: theme.Colors.glassFill,
    boxShadow: '0px 10px 30px rgba(0, 104, 117, 0.05)',
  },
  blurView: {
    width: '100%',
  },
  content: {
    padding: theme.Spacing.containerPadding,
  },
});
