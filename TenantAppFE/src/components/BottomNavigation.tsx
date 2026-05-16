import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  Text
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname, Href } from 'expo-router';

interface NavItem {
  id: string;
  icon: string;
  label: string;
  route: Href;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'insights', icon: 'insights', label: 'INSIGHTS', route: '/analytics' },
  { id: 'properties', icon: 'domain', label: 'PROPERTIES', route: '/command-center' },
  { id: 'escalations', icon: 'error-outline', label: 'ESCALATIONS', route: '/escalations' },
];

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  // Hide nav bar on auth screens and the floor editor canvas
  if (
    pathname === '/' || 
    pathname === '/login' || 
    pathname === '/signup' || 
    pathname === '/tenant-home' ||
    /^\/properties\/[^\/]+\/floors\/[^\/]+$/.test(pathname)
  ) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={90} tint="light" style={styles.container}>
        <View style={styles.navContent}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.route;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.navItem}
                onPress={() => router.push(item.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconPill, isActive && styles.activeIconPill]}>
                  <MaterialIcons 
                    name={item.icon as any} 
                    size={24} 
                    color={isActive ? "#006875" : "#6b7a7d"} 
                  />
                </View>
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 25,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  container: {
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconPill: {
    width: 60,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'rgba(0, 229, 255, 0)', // Start with 0 opacity
  },
  activeIconPill: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderRadius: 16, // Explicitly re-state for Android
  },
  navText: {
    fontSize: 9,
    color: '#6b7a7d',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: '#006875',
  },
});
