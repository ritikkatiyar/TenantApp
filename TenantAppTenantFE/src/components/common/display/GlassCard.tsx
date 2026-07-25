import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '@/src/theme/Theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export function GlassCard({
  children,
  style,
  intensity = 70,
  tint = 'light',
}: GlassCardProps) {
  return (
    <View style={[styles.outerContainer, style]}>
      <BlurView intensity={intensity} tint={tint} style={styles.blurView}>
        <View style={styles.content}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: Theme.Rounded.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    boxShadow: '0px 10px 30px rgba(0, 104, 117, 0.05)',
  },
  blurView: {
    width: '100%',
  },
  content: {
    padding: Theme.Spacing.containerPadding,
  },
});
