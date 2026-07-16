import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname, Href } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { RoleToggle } from '@/src/components/RoleToggle';
import { Theme } from '@/src/theme/Theme';

interface MobileDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;
const MAX_DRAWER_WIDTH = 300;
const actualWidth = Math.min(DRAWER_WIDTH, MAX_DRAWER_WIDTH);

export default function MobileDrawer({ visible, onClose }: MobileDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut, context, user } = useAuth();
  const isTenantView = context?.isTenant && (!context?.isLandlord || pathname.startsWith('/tenant-'));

  const slideAnim = useRef(new Animated.Value(-actualWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showModal, setShowModal] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -actualWidth,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowModal(false);
      });
    }
  }, [visible]);

  const handleLinkPress = (route: Href) => {
    onClose();
    // Delay routing slightly to let the drawer slide closed cleanly
    setTimeout(() => {
      router.push(route);
    }, 150);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => {
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to log out from Livic?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: async () => {
              await signOut();
              router.replace('/login');
            },
          },
        ]
      );
    }, 150);
  };

  const renderDrawerLink = (icon: keyof typeof MaterialIcons.glyphMap, label: string, route: Href) => {
    const isActive = pathname === route || pathname.startsWith(route + '/');

    return (
      <TouchableOpacity
        style={[styles.linkItem, isActive && styles.linkItemActive]}
        onPress={() => handleLinkPress(route)}
        activeOpacity={0.7}
      >
        <MaterialIcons 
          name={icon} 
          size={22} 
          color={isActive ? '#006677' : '#4f6073'} 
        />
        <Text style={[styles.linkText, isActive && styles.linkTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!showModal) return null;

  return (
    <Modal
      transparent={true}
      visible={showModal}
      onRequestClose={onClose}
      animationType="none"
    >
      <View style={styles.overlay}>
        {/* Backdrop overlay */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          </Pressable>
        </Animated.View>

        {/* Slide-in Drawer Container */}
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              width: actualWidth,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFillObject} />
          {/* Header Profile Section */}
          <View style={styles.drawerHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{user?.fullName?.[0] || 'A'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.fullName || 'User'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || 'user@tenantliving.com'}
              </Text>
            </View>
          </View>

          {/* Quick Settings / Role Switcher */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Role Settings</Text>
            <View style={styles.roleToggleRow}>
              <Text style={styles.roleToggleLabel}>Active Role</Text>
              <RoleToggle />
            </View>
          </View>

          {/* Navigation Links list */}
          <ScrollView 
            style={styles.linksScroll}
            contentContainerStyle={styles.linksContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Menu</Text>
            {!isTenantView ? (
              <>
                {renderDrawerLink('dashboard', 'Overview', '/analytics')}
                {renderDrawerLink('business', 'Portfolio', '/command-center')}
                {renderDrawerLink('assessment', 'Reports', '/reports')}
                {renderDrawerLink('description', 'Leases', '/leases' as Href)}
                {renderDrawerLink('inventory', 'Inventory', '/inventory' as Href)}
                {renderDrawerLink('build', 'Escalations', '/escalations')}
                {renderDrawerLink('campaign', 'Announcements', '/announcements')}
                {renderDrawerLink('account-balance', 'Finance & Billing', '/expenses')}
                {renderDrawerLink('settings', 'Settings', '/settings')}
              </>
            ) : (
              <>
                {renderDrawerLink('home', 'Home', '/tenant-home')}
                {renderDrawerLink('domain', 'Property', '/tenant-property')}
                {renderDrawerLink('inventory', 'Inventory', '/tenant-inventory' as Href)}
                {renderDrawerLink('payments', 'Payments', '/tenant-payments')}
                {renderDrawerLink('support-agent', 'Support & Tickets', '/tenant-maintenance')}
              </>
            )}
          </ScrollView>

          {/* Bottom Footer Section */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <MaterialIcons name="logout" size={20} color="#ff3b30" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 1,
  },
  drawerContainer: {
    height: '100%',
    backgroundColor: 'rgba(239, 244, 255, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderRightWidth: 1.5,
    borderRightColor: 'rgba(255, 255, 255, 0.65)',
    overflow: 'hidden',
    zIndex: 2,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 102, 119, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 119, 0.25)',
  },
  avatarText: {
    color: '#006677',
    fontSize: 18,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#0b1c30',
    fontSize: 16,
    fontWeight: '800',
  },
  userEmail: {
    color: '#4f6073',
    fontSize: 12,
    marginTop: 2,
  },
  settingsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006677',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  roleToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2f3b3e',
  },
  linksScroll: {
    flex: 1,
  },
  linksContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  linkItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#006677',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f6073',
    marginLeft: 12,
  },
  linkTextActive: {
    color: '#006677',
    fontWeight: '800',
  },
  drawerFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff3b30',
    marginLeft: 12,
  },
});
