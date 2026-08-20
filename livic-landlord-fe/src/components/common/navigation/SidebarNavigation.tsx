import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname, Href, useLocalSearchParams } from 'expo-router';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useAppTheme } from '@/src/theme/ThemeContext';

export default function SidebarNavigation() {
  const { theme, isDark, toggleTheme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const width = useSharedValue(260);
  const paddingH = useSharedValue(20);

  const toggleCollapse = () => {
    const nextCollapsed = !isCollapsed;
    width.value = withTiming(nextCollapsed ? 80 : 260, { duration: 300, easing: Easing.bezier(0.25, 1, 0.5, 1) });
    paddingH.value = withTiming(nextCollapsed ? 12 : 20, { duration: 300, easing: Easing.bezier(0.25, 1, 0.5, 1) });
    setIsCollapsed(nextCollapsed);
  };

  const animatedStyles = useAnimatedStyle(() => {
    return {
      width: width.value,
      paddingHorizontal: paddingH.value,
    };
  });
  const router = useRouter();
  const pathname = usePathname();
  const { signOut, context } = useAuth();
  const { view } = useLocalSearchParams();

  const renderSidebarLink = (icon: keyof typeof MaterialIcons.glyphMap, label: string, route: Href) => {
    let isActive = false;
    if (typeof route === 'string') {
      if (route.includes('view=reports')) {
        isActive = pathname === '/analytics' && view === 'reports';
      } else if (route === '/analytics') {
        isActive = pathname === '/analytics' && view !== 'reports';
      } else {
        isActive = pathname === route || pathname.startsWith(route + '/');
      }
    }

    return (
      <TouchableOpacity
        style={[
          styles.sidebarLink, 
          isActive && styles.sidebarLinkActive,
          isCollapsed && styles.sidebarLinkCollapsed
        ]}
        onPress={() => router.push(route)}
        activeOpacity={0.75}
      >
        <MaterialIcons name={icon} size={22} color={isActive ? theme.Colors.primary : theme.Colors.onSurfaceVariant} />
        {!isCollapsed && <Text style={[styles.sidebarLinkText, isActive && styles.sidebarLinkTextActive]} numberOfLines={1}>{label}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={[styles.sidebar, animatedStyles]}>
      <BlurView intensity={70} tint={isDark ? "dark" : "light"} style={[StyleSheet.absoluteFill, { backgroundColor: theme.Colors.glassFill }]} />
      <View style={[styles.sidebarHeader, isCollapsed && styles.sidebarHeaderCollapsed]}>
        {!isCollapsed ? (
          <View style={styles.sidebarBrand}>
            <Text style={styles.sidebarBrandTitle} numberOfLines={1}>Livic</Text>
            <Text style={styles.sidebarBrandSub} numberOfLines={1}>Living Ecosystem</Text>
          </View>
        ) : (
          <View style={styles.sidebarBrandCollapsed}>
            <Text style={styles.sidebarBrandTitleCollapsed} numberOfLines={1}>LV</Text>
          </View>

        )}
        <TouchableOpacity onPress={toggleCollapse} style={styles.collapseButton}>
          <MaterialIcons name={isCollapsed ? "chevron-right" : "chevron-left"} size={24} color={theme.Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.sidebarNavScroll} contentContainerStyle={styles.sidebarNav} showsVerticalScrollIndicator={false}>
        {renderSidebarLink('dashboard', 'Overview', '/analytics')}
        {renderSidebarLink('business', 'Portfolio', '/command-center')}
        {renderSidebarLink('assessment', 'Reports', '/reports')}
        {renderSidebarLink('groups', 'AI Desk', '/ai')}
        {renderSidebarLink('description', 'Leases', '/leases' as Href)}
        {renderSidebarLink('inventory', 'Inventory', '/inventory' as Href)}
        {renderSidebarLink('build', 'Escalations', '/escalations')}
        {renderSidebarLink('campaign', 'Announcements', '/announcements')}
        {renderSidebarLink('account-balance', 'Finance & Billing', '/expenses')}
        {renderSidebarLink('settings', 'Settings', '/settings')}
      </ScrollView>

      <View style={[styles.sidebarFooter, isCollapsed && styles.sidebarFooterCollapsed]}>
        {!isCollapsed ? (
          <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/billing')} activeOpacity={0.85}>
            <LinearGradient colors={[theme.Colors.primary, theme.Colors.secondaryContainer]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upgradeGradient}>
              <Text style={styles.upgradeText}>UPGRADE PLAN</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.upgradeButtonCollapsed} onPress={() => router.push('/billing')} activeOpacity={0.85}>
            <LinearGradient colors={[theme.Colors.primary, theme.Colors.secondaryContainer]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upgradeGradientCollapsed}>
              <MaterialIcons name="bolt" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
        {renderSidebarLink('help-outline', 'Billing Help', '/billing')}
        <TouchableOpacity 
          style={[styles.sidebarLink, isCollapsed && styles.sidebarLinkCollapsed]} 
          onPress={toggleTheme}
          activeOpacity={0.75}
        >
          <MaterialIcons 
            name={isDark ? "wb-sunny" : "dark-mode"} 
            size={22} 
            color={isDark ? "#f59e0b" : theme.Colors.onSurfaceVariant} 
          />
          {!isCollapsed && (
            <Text style={styles.sidebarLinkText}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sidebarLink, isCollapsed && styles.sidebarLinkCollapsed]} onPress={async () => {
          await signOut();
          router.replace('/login');
        }}>
          <MaterialIcons name="logout" size={22} color={theme.Colors.onSurfaceVariant} />
          {!isCollapsed && <Text style={styles.sidebarLinkText}>Logout</Text>}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  sidebar: {
    height: '100%',
    paddingTop: 32,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: theme.Surface.border,
    overflow: 'hidden',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 54,
  },
  sidebarHeaderCollapsed: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  sidebarBrand: { flex: 1 },
  sidebarBrandCollapsed: { alignItems: 'center' },
  sidebarBrandTitleCollapsed: { fontSize: 24, fontWeight: '800', color: theme.Colors.primary },
  collapseButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  sidebarBrandTitle: { fontSize: 28, fontWeight: '800', lineHeight: 34, color: theme.Colors.primary },
  sidebarBrandSub: { fontSize: 12, fontWeight: '700', letterSpacing: 2, color: theme.Colors.onSurfaceVariant, marginTop: 4 },
  sidebarNavScroll: { flex: 1, marginBottom: 16 },
  sidebarNav: { gap: 14, paddingBottom: 16 },
  sidebarLink: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 18, borderRadius: theme.Rounded.lg },
  sidebarLinkCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  sidebarLinkActive: { backgroundColor: 'rgba(0, 224, 255, 0.10)', borderRightWidth: 4, borderRightColor: theme.Colors.primaryContainer },
  sidebarLinkText: { fontSize: 13, fontWeight: '700', letterSpacing: 1.6, color: theme.Colors.onSurface },
  sidebarLinkTextActive: { color: theme.Colors.primary },
  sidebarFooter: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: theme.Colors.outlineVariant, paddingTop: 28, gap: 10 },
  sidebarFooterCollapsed: { alignItems: 'center' },
  upgradeButton: { borderRadius: theme.Rounded.lg, overflow: 'hidden', marginBottom: 14, shadowColor: theme.Colors.secondary, shadowOpacity: 0.24, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  upgradeButtonCollapsed: { borderRadius: 24, overflow: 'hidden', marginBottom: 14, shadowColor: theme.Colors.secondary, shadowOpacity: 0.24, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, width: 48, height: 48 },
  upgradeGradient: { paddingVertical: 16, alignItems: 'center' },
  upgradeGradientCollapsed: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  upgradeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
