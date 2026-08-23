import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

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
    <View style={[styles.headerWrapper, { paddingTop: insets.top, height: 56 + insets.top }]}>
      <BlurView intensity={70} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFillObject} />
      <View style={styles.headerContainer}>
        <View style={{ width: 40 }} />
        
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
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.4)',
    backgroundColor: isDark ? 'rgba(19, 28, 38, 0.4)' : 'rgba(248, 249, 255, 0.4)',
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
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
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
