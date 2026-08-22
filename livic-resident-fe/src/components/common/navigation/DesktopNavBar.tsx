import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface DesktopNavBarProps {
  onBack?: () => void;
  backText?: string;
  rightContent?: React.ReactNode;
  title?: string;
  activeTab?: string;
  hideTabs?: boolean;
}

export default function DesktopNavBar({ 
  onBack, 
  backText = 'Back',
  rightContent,
  title
}: DesktopNavBarProps) {
  const { user } = useAuth();
  const { theme, isDark, toggleTheme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const initial = user?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || 'A';

  return (
    <BlurView intensity={70} tint={isDark ? "dark" : "light"} style={styles.topbar}>
      {/* Left Area: Back Button or Page Title */}
      <View style={styles.topbarLeft}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButtonDesktop} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={20} color={theme.Colors.onBackground} />
            <Text style={styles.backButtonTextDesktop}>{backText}</Text>
          </TouchableOpacity>
        ) : title ? (
          <Text style={styles.pageTitle}>{title}</Text>
        ) : null}
      </View>

      {/* Right Area: Right Content + Theme Toggle + Avatar */}
      <View style={styles.topbarRight}>
        {rightContent}

        <TouchableOpacity 
          onPress={toggleTheme} 
          style={styles.themeToggleBtn}
          activeOpacity={0.75}
          accessibilityLabel="Toggle Theme Mode"
        >
          <MaterialIcons 
            name={isDark ? "wb-sunny" : "dark-mode"} 
            size={20} 
            color={isDark ? "#f59e0b" : theme.Colors.primary} 
          />
        </TouchableOpacity>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
    </BlurView>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  topbar: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderColor: theme.Surface.border,
    backgroundColor: theme.Colors.glassFill,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: theme.Typography.TitleLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onBackground,
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  themeToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.Surface.card,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  backButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.Surface.card,
    borderWidth: 1,
    borderColor: theme.Surface.border,
  },
  backButtonTextDesktop: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onBackground,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.Colors.surfaceContainerLowest,
    fontWeight: '700',
    fontSize: theme.Typography.BodyMedium.fontSize,
  },
});
