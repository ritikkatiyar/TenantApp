import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, ViewStyle, Animated } from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeContext';

interface ScreenWrapperProps {
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
  isAuth?: boolean;
}

export function ScreenWrapper({ children, contentContainerStyle, isAuth = false }: ScreenWrapperProps) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const fadeAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    fadeAnim.setValue(0.85);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [children]);

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.Colors.background }, isDesktop && !isAuth && styles.desktopContainer, { opacity: fadeAnim }, contentContainerStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  desktopContainer: {
    // Removed maxWidth to allow full width layout
  },
});
