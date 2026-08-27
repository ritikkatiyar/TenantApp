import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle, DimensionValue, View } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { GlassCard } from '../display/GlassCard';

interface SkeletonProps {
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
}

export function Skeleton({ style, width, height, borderRadius }: SkeletonProps) {
  const { theme, isDark } = useAppTheme();
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
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
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 104, 117, 0.08)',
          width: width,
          height: height,
          borderRadius: borderRadius ?? 12,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <GlassCard style={[styles.cardContainer, style]}>
      {/* Property Hero Image Placeholder */}
      <Skeleton width="100%" height={130} borderRadius={14} style={{ marginBottom: 14 }} />
      <View style={styles.cardHeader}>
        <Skeleton width="55%" height={20} borderRadius={6} />
        <Skeleton width={28} height={28} borderRadius={8} />
      </View>
      <Skeleton width="75%" height={14} borderRadius={4} style={{ marginTop: 8, marginBottom: 14 }} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <Skeleton width="30%" height={34} borderRadius={10} />
        <Skeleton width="30%" height={34} borderRadius={10} />
        <Skeleton width="30%" height={34} borderRadius={10} />
      </View>
    </GlassCard>
  );
}

export function SkeletonStatRow({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.statRow}>
      {Array.from({ length: count }).map((_, idx) => (
        <GlassCard key={idx} style={styles.statCardItem}>
          <View style={styles.cardHeader}>
            <Skeleton width="50%" height={14} borderRadius={4} />
            <Skeleton width={24} height={24} borderRadius={8} />
          </View>
          <Skeleton width="65%" height={24} borderRadius={6} style={{ marginTop: 10, marginBottom: 6 }} />
          <Skeleton width="40%" height={12} borderRadius={4} />
        </GlassCard>
      ))}
    </View>
  );
}

export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.cardGrid}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} style={styles.gridItem}>
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}

export function SkeletonRow({ style }: { style?: StyleProp<ViewStyle> }) {
  return <Skeleton width="100%" height={60} borderRadius={16} style={style} />;
}

export function SkeletonText({ style, width = '60%' }: { style?: StyleProp<ViewStyle>; width?: DimensionValue }) {
  return <Skeleton width={width} height={16} borderRadius={4} style={style} />;
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  cardContainer: {
    borderRadius: 20,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  statCardItem: {
    flex: 1,
    minWidth: 150,
    borderRadius: 20,
    padding: 16,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    flex: 1,
    minWidth: 280,
  },
});
