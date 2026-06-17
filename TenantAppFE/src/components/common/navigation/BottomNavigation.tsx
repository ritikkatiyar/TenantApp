import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  Text,
  useWindowDimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname, Href } from 'expo-router';
import { useProperties } from '@/src/hooks/useProperties';

interface NavItem {
  id: string;
  icon: string;
  label: string;
  route: Href;
}

import { useAuth } from '@/src/features/auth/context/AuthProvider';

const LANDLORD_NAV_ITEMS: NavItem[] = [
  { id: 'portfolio', icon: 'domain', label: 'Portfolio', route: '/command-center' },
  { id: 'finance', icon: 'account-balance', label: 'Finance', route: '/expenses' },
  { id: 'announcements', icon: 'campaign', label: 'Notices', route: '/announcements' },
  { id: 'analytics', icon: 'analytics', label: 'Analytics', route: '/analytics' },
];

const TENANT_NAV_ITEMS: NavItem[] = [
  { id: 'home', icon: 'home', label: 'Home', route: '/tenant-home' },
  { id: 'property', icon: 'domain', label: 'Property', route: '/tenant-property' },
  { id: 'payments', icon: 'payments', label: 'Payments', route: '/tenant-payments' },
  { id: 'maintenance', icon: 'support-agent', label: 'Support', route: '/tenant-maintenance' },
];

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { properties } = useProperties();
  const activePropertyId = properties && properties.length > 0 ? properties[0].id : null;

  if (
    width >= 900 ||
    pathname === '/' || 
    pathname === '/login' || 
    pathname === '/signup' || 
    /^\/properties\/[^\/]+\/floors\/[^\/]+$/.test(pathname)
  ) {
    return null;
  }

  const { context } = useAuth();
  
  const isTenantView = context?.isTenant && (!context?.isLandlord || pathname.startsWith('/tenant-'));
  const NAV_ITEMS = isTenantView ? TENANT_NAV_ITEMS : LANDLORD_NAV_ITEMS;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.route || pathname.startsWith(item.route + '?');
          
          let targetRoute = item.route;
          if (item.id === 'expenses' && activePropertyId) {
              targetRoute = `${item.route}?propertyId=${activePropertyId}` as Href;
          }

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => router.push(targetRoute)}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name={item.icon as any} 
                size={24} 
                color={isActive ? "#96e1f5" : "#4f6073"} 
              />
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  container: {
    backgroundColor: '#e5eeff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#006677',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12, // Extra padding for iPhone home indicator
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 24,
  },
  navItemActive: {
    backgroundColor: '#006677',
  },
  navText: {
    fontSize: 12,
    color: '#4f6073',
    fontWeight: '500',
    marginTop: 2,
  },
  navTextActive: {
    color: '#96e1f5',
    fontWeight: '600',
  },
});
