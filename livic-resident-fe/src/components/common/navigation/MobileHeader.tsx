import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { Platform } from 'react-native';

interface MobileHeaderProps {
  title: string;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
}

export default function MobileHeader({ title, onMenuPress, onNotificationPress }: MobileHeaderProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const insets = useSafeAreaInsets();

  return (
    <>
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          .mobile-header-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 9999 !important;
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
          }
          @media (min-width: 900px) {
            .mobile-header-container {
              display: none !important;
            }
          }
        `}} />
      )}
      <View
        // @ts-ignore
        dataSet={{ mobileHeader: 'true', responsiveLayout: 'mobile' }}
        className="mobile-header-container"
        style={[styles.headerWrapper, { paddingTop: insets.top, minHeight: 56 + insets.top }]}
      >
      <BlurView intensity={70} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFillObject} />
      <View style={styles.headerContainer}>
        {onMenuPress ? (
          <TouchableOpacity onPress={onMenuPress} style={styles.menuButton} activeOpacity={0.7}>
            <Ionicons name="menu" size={23} color={theme.Colors.onSurface} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        
        <View style={styles.titleContainer}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.notificationButton} 
          activeOpacity={0.7}
          onPress={onNotificationPress}
          disabled={!onNotificationPress}
        >
          <Ionicons name="notifications-outline" size={23} color={theme.Colors.onSurface} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>
    </View>
    </>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    backgroundColor: isDark ? 'rgba(9, 13, 18, 0.60)' : 'rgba(255, 255, 255, 0.70)',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 999,
  },
  safeArea: {
    // Top padding handled by safe area context
  },
  headerContainer: {
    height: 56,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.Spacing.md,
  },
  menuButton: {
    padding: theme.Spacing.sm,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.65)',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  titleText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: theme.Colors.onSurface,
    letterSpacing: -0.2,
  },
  notificationButton: {
    padding: theme.Spacing.sm,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.65)',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.Colors.error || '#ba1a1a',
  },
});
