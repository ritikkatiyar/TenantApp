import React from 'react';
import { View, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';

interface ScreenWrapperProps {
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
  isAuth?: boolean;
}

export function ScreenWrapper({ children, contentContainerStyle, isAuth = false }: ScreenWrapperProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  return (
    <View style={[styles.container, isDesktop && !isAuth && styles.desktopContainer, contentContainerStyle]}>
      {children}
    </View>
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
