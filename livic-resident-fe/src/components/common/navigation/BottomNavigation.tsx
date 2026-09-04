import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useScrollNav } from './ScrollContext';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface BottomNavigationProps {
  onMorePress: () => void;
  onQRPress: () => void;
}

export default function BottomNavigation({ onMorePress, onQRPress }: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { navTranslateY } = useScrollNav();
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  if (pathname === '/ai' || pathname.startsWith('/ai') || pathname === '/ai-assistant') {
    return null;
  }

  const isHomeActive = pathname === '/tenant-home';

  const handleHomePress = () => {
    if (!isHomeActive) {
      router.push('/tenant-home' as any);
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

  return (
    <>
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          .mobile-bottom-nav-container {
            position: fixed !important;
            bottom: 20px !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 9999 !important;
          }
          @media (min-width: 900px) {
            .mobile-bottom-nav-container {
              display: none !important;
            }
          }
        `}} />
      )}
      <View
        // @ts-ignore
        dataSet={{ bottomNav: 'true', responsiveLayout: 'mobile' }}
        className="mobile-bottom-nav-container"
        style={styles.outerContainer}
        pointerEvents="box-none"
      >
      {/* Centered Navigation Pill */}
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
          <BlurView intensity={Platform.OS === 'ios' ? 85 : 95} tint={isDark ? "dark" : "light"} style={styles.pillBlurBackground} />
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
              <LinearGradient
                colors={['#00d4ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCameraButton}
              >
                <MaterialIcons name="center-focus-strong" size={28} color="#ffffff" />
                <View style={[styles.cameraDotBadge, { backgroundColor: '#00d4ff' }]} />
              </LinearGradient>
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
    </View>
    </>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
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
    shadowColor: theme.Colors.shadowColor || '#000000',
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
    backgroundColor: isDark ? 'rgba(19, 28, 38, 0.85)' : 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.95)',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.lg,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: theme.Spacing.xs,
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
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '600',
  },
  navTextActive: {
    fontWeight: '700',
  },
  heroCameraWrapper: {
    marginTop: -24,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1005,
  },
  heroCameraButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: theme.Colors.surfaceContainerLowest || '#ffffff',
    shadowColor: theme.Colors.shadowColor || '#000000',
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
});
