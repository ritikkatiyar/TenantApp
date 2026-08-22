import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { Theme } from '@/src/theme/Theme';

interface MobileMoreSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  title: string;
  subtitle: string;
  route: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

export default function MobileMoreSheet({ visible, onClose }: MobileMoreSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { theme, isDark, toggleTheme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const MENU_ITEMS: MenuItem[] = React.useMemo(() => [
    { title: 'Portfolio', subtitle: 'Properties & Units', route: '/command-center', icon: 'apartment', color: theme.Colors.primary },
    { title: 'Leases', subtitle: 'Tenant Contracts', route: '/leases', icon: 'receipt-long', color: theme.Colors.secondary },
    { title: 'Finance', subtitle: 'Expenses & Income', route: '/expenses', icon: 'payments', color: theme.Colors.tertiary },
    { title: 'Analytics', subtitle: 'Revenue & Occupancy', route: '/analytics', icon: 'insights', color: theme.Colors.primary },
    { title: 'Reports', subtitle: 'Statements & Logs', route: '/reports', icon: 'assessment', color: theme.Colors.secondary },
    { title: 'Inventory', subtitle: 'Assets & Stock', route: '/inventory', icon: 'inventory-2', color: theme.Colors.tertiary },
    { title: 'Announcements', subtitle: 'Broadcast Messages', route: '/announcements', icon: 'campaign', color: theme.Colors.primary },
    { title: 'Escalations', subtitle: 'Issues & Repairs', route: '/escalations', icon: 'report-problem', color: theme.Colors.error },
    { title: 'Settings', subtitle: 'Profile & App Config', route: '/settings', icon: 'settings', color: theme.Colors.onSurfaceVariant },
  ], [theme]);
  
  const translateY = useRef(new Animated.Value(300)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 2,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          closeSheet();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  const openSheet = () => {
    translateY.setValue(300);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: false,
      bounciness: 3,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: 500,
      duration: 150,
      useNativeDriver: false,
    }).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      openSheet();
    }
  }, [visible]);

  const handleNavigate = (route: string) => {
    closeSheet();
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  };

  const handleThemeToggle = () => {
    closeSheet();
    setTimeout(() => {
      toggleTheme();
    }, 180);
  };

  const handleLogout = async () => {
    await signOut();
    closeSheet();
    router.replace('/login');
  };

  if (!visible) return null;

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={closeSheet}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeSheet}>
          <BlurView intensity={isDark ? 80 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag Handle Slit */}
          <View style={styles.dragHandleArea} {...panResponder.panHandlers}>
            <TouchableOpacity activeOpacity={0.7} onPress={closeSheet} style={styles.dragTouchZone}>
              <View style={styles.dragHandle} />
            </TouchableOpacity>
          </View>

          {/* User Profile Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'L'}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.fullName || 'Landlord'}</Text>
                <Text style={styles.profileRole}>{user?.email || 'Admin User'}</Text>
              </View>
              <TouchableOpacity style={styles.themeToggle} onPress={handleThemeToggle} activeOpacity={0.7}>
                <MaterialIcons name={isDark ? 'light-mode' : 'dark-mode'} size={24} color={theme.Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.themeToggle, { marginLeft: 8, borderColor: theme.Colors.errorContainer, backgroundColor: theme.Colors.error + '1A' }]} onPress={handleLogout} activeOpacity={0.7}>
                <MaterialIcons name="logout" size={24} color={theme.Colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContainer}>
            {MENU_ITEMS.map((item) => {
              const isActive = pathname === item.route;
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.gridCard, isActive && styles.gridCardActive]}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.color + '1A' }]}>
                    <MaterialIcons name={item.icon} size={24} color={item.color} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, isActive && styles.cardTitleActive]}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetContainer: {
    backgroundColor: theme.Surface.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  dragHandleArea: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragTouchZone: {
    paddingVertical: 4,
    paddingHorizontal: 24,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.Colors.outlineVariant,
  },
  sheetHeader: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.Colors.surfaceVariant,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: theme.Typography.TitleLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.Typography.bodyLg.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
  },
  profileRole: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  themeToggle: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: theme.Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
  },
  gridContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    gap: 10,
  },
  gridCardActive: {
    backgroundColor: theme.Colors.primaryContainer,
    borderColor: theme.Colors.primary,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    gap: 2,
  },
  cardTitle: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '600',
    color: theme.Colors.onSurface,
  },
  cardTitleActive: {
    color: theme.Colors.primary,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
  },
});
