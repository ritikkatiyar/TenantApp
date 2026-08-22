import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
  Animated,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useScrollNav } from './ScrollContext';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface BottomNavigationProps {
  onMorePress: () => void;
  onQRPress: () => void;
  onAIPress?: () => void;
}

export default function BottomNavigation({ onMorePress, onQRPress, onAIPress }: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { navTranslateY } = useScrollNav();
  const { theme, isDark } = useAppTheme();

  if (pathname === '/ai' || pathname.startsWith('/ai') || pathname === '/ai-assistant') {
    return null;
  }

  const isHomeActive = pathname === '/tenant-home';

  const handleHomePress = () => {
    if (!isHomeActive) {
      router.push('/tenant-home' as any);
    }
  };

  const handleAIPress = () => {
    if (onAIPress) {
      onAIPress();
    } else {
      router.push('/tenant-maintenance' as any);
    }
  };

  // Smooth Interpolations for Pill scroll animation (fade away & slide down)
  const pillTranslateY = navTranslateY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 90],
    extrapolate: 'clamp',
  });

  const pillScale = navTranslateY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const pillOpacity = navTranslateY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Smooth Interpolations for Iridescent AI Icon:
  // When pill fades away on scroll, AI orb stays visible & minimizes to a brief icon docked on the right
  const aiScale = navTranslateY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.92],
    extrapolate: 'clamp',
  });

  const aiTranslateY = navTranslateY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -2],
    extrapolate: 'clamp',
  });

  const aiTranslateX = navTranslateY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 2],
    extrapolate: 'clamp',
  });

  const aiOpacity = navTranslateY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      {/* 1. Perfectly Centered Navigation Pill */}
      <Animated.View
        style={[
          styles.pillWrapper,
          {
            transform: [{ translateY: pillTranslateY }, { scale: pillScale }],
            opacity: pillOpacity,
          },
        ]}
      >
        <View style={styles.pillContainer}>
          <BlurView intensity={Platform.OS === 'ios' ? 85 : 95} tint="light" style={styles.pillBlurBackground} />
          <View style={styles.pillContent}>
            {/* Home Button */}
            <TouchableOpacity style={styles.navItem} onPress={handleHomePress} activeOpacity={0.7}>
              <View style={[styles.iconCircle, isHomeActive && { backgroundColor: `${theme.Colors.primary}18` }]}>
                <MaterialIcons name="home" size={22} color={isHomeActive ? theme.Colors.primary : theme.Colors.onSurfaceVariant} />
              </View>
              <Text style={[styles.navText, { color: isHomeActive ? theme.Colors.primary : theme.Colors.onSurfaceVariant }, isHomeActive && styles.navTextActive]}>Home</Text>
            </TouchableOpacity>

            {/* Protruding Centerpiece Camera Button */}
            <TouchableOpacity style={styles.heroCameraWrapper} onPress={onQRPress} activeOpacity={0.88}>
              <View style={styles.heroCameraGlow} />
              <View style={[styles.heroCameraButton, { backgroundColor: theme.Colors.secondary }]}>
                <MaterialIcons name="center-focus-strong" size={28} color="#ffffff" />
                <View style={[styles.cameraDotBadge, { backgroundColor: theme.Colors.inversePrimary }]} />
              </View>
            </TouchableOpacity>

            {/* More Button */}
            <TouchableOpacity style={styles.navItem} onPress={onMorePress} activeOpacity={0.7}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="widgets" size={22} color={theme.Colors.onSurfaceVariant} />
              </View>
              <Text style={[styles.navText, { color: theme.Colors.onSurfaceVariant }]}>More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* 2. Option B Iridescent AI Orb (Floating Right) */}
      <Animated.View
        style={[
          styles.aiWrapper,
          {
            transform: [
              { translateY: aiTranslateY },
              { translateX: aiTranslateX },
              { scale: aiScale },
            ],
            opacity: aiOpacity,
          },
        ]}
      >
        <TouchableOpacity style={styles.aiButtonTouch} onPress={handleAIPress} activeOpacity={0.78}>
          <LinearGradient
            colors={['#00e0ff', '#0070ea']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiGradientRing}
          >
            <View style={styles.aiMinimalistContainer}>
              <BlurView intensity={Platform.OS === 'ios' ? 85 : 95} tint="light" style={styles.aiBlurBackground} />
              <MaterialIcons name="assistant" size={21} color={theme.Colors.primary} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  pillWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  pillContainer: {
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 20,
    shadowColor: '#003344',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  pillBlurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    fontWeight: '600',
  },
  navTextActive: {
    fontWeight: '700',
  },

  /* Protruding Hero Camera Button */
  heroCameraWrapper: {
    marginTop: -24,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1005,
  },
  heroCameraGlow: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'transparent',
    opacity: 0,
    transform: [{ scale: 1.0 }],
  },
  heroCameraButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  cameraDotBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  /* Option B Iridescent Floating AI Orb */
  aiWrapper: {
    position: 'absolute',
    right: 20,
    bottom: 2,
    zIndex: 1002,
  },
  aiButtonTouch: {
    borderRadius: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  aiGradientRing: {
    padding: 2.5,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiMinimalistContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  aiBlurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
});
