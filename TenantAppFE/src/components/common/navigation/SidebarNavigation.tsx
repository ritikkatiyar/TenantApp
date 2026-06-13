import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname, Href } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { Theme } from '@/src/theme/Theme';

export default function SidebarNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();

  const renderSidebarLink = (icon: keyof typeof MaterialIcons.glyphMap, label: string, route: Href) => {
    // Basic prefix matching for active states
    const isActive = typeof route === 'string' && (pathname === route || pathname.startsWith(route + '/'));
    return (
      <TouchableOpacity
        style={[styles.sidebarLink, isActive && styles.sidebarLinkActive]}
        onPress={() => router.push(route)}
        activeOpacity={0.75}
      >
        <MaterialIcons name={icon} size={22} color={isActive ? Theme.Colors.primary : Theme.Colors.onSurfaceVariant} />
        <Text style={[styles.sidebarLinkText, isActive && styles.sidebarLinkTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <BlurView intensity={70} tint="light" style={styles.sidebar}>
      <View style={styles.sidebarBrand}>
        <Text style={styles.sidebarBrandTitle}>TenantApp</Text>
        <Text style={styles.sidebarBrandSub}>Management Suite</Text>
      </View>

      <View style={styles.sidebarNav}>
        {renderSidebarLink('dashboard', 'Overview', '/analytics')}
        {renderSidebarLink('business', 'Portfolio', '/command-center')}
        {renderSidebarLink('groups', 'AI Desk', '/ai')}
        {renderSidebarLink('build', 'Escalations', '/escalations')}
        {renderSidebarLink('campaign', 'Announcements', '/announcements')}
        {renderSidebarLink('settings', 'Settings', '/expenses')}
      </View>

      <View style={styles.sidebarFooter}>
        <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/billing')} activeOpacity={0.85}>
          <LinearGradient colors={[Theme.Colors.primary, Theme.Colors.secondaryContainer]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upgradeGradient}>
            <Text style={styles.upgradeText}>UPGRADE PLAN</Text>
          </LinearGradient>
        </TouchableOpacity>
        {renderSidebarLink('help-outline', 'Billing Help', false, '/billing')}
        <TouchableOpacity style={styles.sidebarLink} onPress={async () => {
          await signOut();
          router.replace('/login');
        }}>
          <MaterialIcons name="logout" size={22} color={Theme.Colors.onSurfaceVariant} />
          <Text style={styles.sidebarLinkText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    height: '100%',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  sidebarBrand: { marginBottom: 54 },
  sidebarBrandTitle: { fontSize: 34, fontWeight: '800', lineHeight: 40, color: Theme.Colors.primary },
  sidebarBrandSub: { fontSize: 12, fontWeight: '700', letterSpacing: 2, color: Theme.Colors.onSurfaceVariant, marginTop: 4 },
  sidebarNav: { gap: 14 },
  sidebarLink: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 18, borderRadius: Theme.Rounded.lg },
  sidebarLinkActive: { backgroundColor: 'rgba(0, 224, 255, 0.10)', borderRightWidth: 4, borderRightColor: Theme.Colors.primaryContainer },
  sidebarLinkText: { fontSize: 13, fontWeight: '700', letterSpacing: 1.6, color: Theme.Colors.onSurface },
  sidebarLinkTextActive: { color: Theme.Colors.primary },
  sidebarFooter: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: Theme.Colors.outlineVariant, paddingTop: 28, gap: 10 },
  upgradeButton: { borderRadius: Theme.Rounded.lg, overflow: 'hidden', marginBottom: 14, shadowColor: Theme.Colors.secondary, shadowOpacity: 0.24, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  upgradeGradient: { paddingVertical: 16, alignItems: 'center' },
  upgradeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
