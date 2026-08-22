import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface SkeletonProps {
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
}

export function Skeleton({ style, width, height, borderRadius }: SkeletonProps) {
  const { theme } = useAppTheme();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          backgroundColor: theme.Colors.surfaceVariant || '#e2e8e9',
          width: width,
          height: height,
          borderRadius: borderRadius ?? 8,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return <Skeleton width="100%" height={150} borderRadius={16} style={style} />;
}

export function SkeletonRow({ style }: { style?: StyleProp<ViewStyle> }) {
  return <Skeleton width="100%" height={60} borderRadius={12} style={style} />;
}

export function SkeletonText({ style, width = '60%' }: { style?: StyleProp<ViewStyle>; width?: DimensionValue }) {
  return <Skeleton width={width} height={16} borderRadius={4} style={style} />;
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
