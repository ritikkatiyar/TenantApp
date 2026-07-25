import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname, Href } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { Theme } from '@/src/theme/Theme';

export default function SidebarNavigation() {
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
  const { signOut } = useAuth();

  const renderSidebarLink = (icon: keyof typeof MaterialIcons.glyphMap, label: string, route: Href) => {
    const isActive = typeof route === 'string' ? (pathname === route || pathname.startsWith(route + '/')) : false;

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
        <MaterialIcons name={icon} size={22} color={isActive ? Theme.Colors.primary : Theme.Colors.onSurfaceVariant} />
        {!isCollapsed && <Text style={[styles.sidebarLinkText, isActive && styles.sidebarLinkTextActive]} numberOfLines={1}>{label}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={[styles.sidebar, animatedStyles]}>
      <BlurView intensity={70} tint="light" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.55)' }]} />
      
      <View style={[styles.sidebarHeader, isCollapsed && styles.sidebarHeaderCollapsed]}>
        {!isCollapsed ? (
          <View style={styles.sidebarBrand}>
            <Text style={styles.sidebarBrandTitle} numberOfLines={1}>Livic</Text>
            <Text style={styles.sidebarBrandSub} numberOfLines={1}>Resident Portal</Text>
          </View>
        ) : (
          <View style={styles.sidebarBrandCollapsed}>
            <Text style={styles.sidebarBrandTitleCollapsed} numberOfLines={1}>LV</Text>
          </View>
        )}
        <TouchableOpacity onPress={toggleCollapse} style={styles.collapseButton}>
          <MaterialIcons name={isCollapsed ? "chevron-right" : "chevron-left"} size={24} color={Theme.Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.sidebarNavScroll} contentContainerStyle={styles.sidebarNav} showsVerticalScrollIndicator={false}>
        {renderSidebarLink('home', 'Home', '/tenant-home')}
        {renderSidebarLink('domain', 'Property', '/tenant-property')}
        {renderSidebarLink('inventory', 'Inventory', '/tenant-inventory' as Href)}
        {renderSidebarLink('payments', 'Payments', '/tenant-payments')}
        {renderSidebarLink('support-agent', 'Support', '/tenant-maintenance')}
      </ScrollView>

      <View style={[styles.sidebarFooter, isCollapsed && styles.sidebarFooterCollapsed]}>
        <TouchableOpacity style={[styles.sidebarLink, isCollapsed && styles.sidebarLinkCollapsed]} onPress={async () => {
          await signOut();
          router.replace('/login');
        }}>
          <MaterialIcons name="logout" size={22} color={Theme.Colors.onSurfaceVariant} />
          {!isCollapsed && <Text style={styles.sidebarLinkText}>Logout</Text>}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    height: '100%',
    paddingTop: 32,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
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
  sidebarBrandTitleCollapsed: { fontSize: 24, fontWeight: '800', color: Theme.Colors.primary },
  collapseButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  sidebarBrandTitle: { fontSize: 28, fontWeight: '800', lineHeight: 34, color: Theme.Colors.primary },
  sidebarBrandSub: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: Theme.Colors.onSurfaceVariant, marginTop: 4 },
  sidebarNavScroll: { flex: 1, marginBottom: 16 },
  sidebarNav: { gap: 14, paddingBottom: 16 },
  sidebarLink: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 18, borderRadius: Theme.Rounded.lg },
  sidebarLinkCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  sidebarLinkActive: { backgroundColor: 'rgba(0, 224, 255, 0.10)', borderRightWidth: 4, borderRightColor: Theme.Colors.primaryContainer },
  sidebarLinkText: { fontSize: 13, fontWeight: '700', letterSpacing: 1.6, color: Theme.Colors.onSurface },
  sidebarLinkTextActive: { color: Theme.Colors.primary },
  sidebarFooter: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: Theme.Colors.outlineVariant, paddingTop: 28, gap: 10 },
  sidebarFooterCollapsed: { alignItems: 'center' },
});
