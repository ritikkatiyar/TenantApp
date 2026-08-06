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
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';

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

const MENU_ITEMS: MenuItem[] = [
  { title: 'My Home', subtitle: 'Dashboard & Feed', route: '/tenant-home', icon: 'home', color: '#00D8F6' },
  { title: 'My Property', subtitle: 'Lease & Building', route: '/tenant-property', icon: 'apartment', color: '#38EF7D' },
  { title: 'Items & Assets', subtitle: 'Furnishings & Inventory', route: '/tenant-inventory', icon: 'inventory', color: '#FF7043' },
  { title: 'Payments', subtitle: 'Invoices & Receipts', route: '/tenant-payments', icon: 'payments', color: '#FFB74D' },
  { title: 'Support & Repair', subtitle: 'Maintenance Requests', route: '/tenant-maintenance', icon: 'build', color: '#EF5350' },
  { title: 'Settings', subtitle: 'Profile & App Config', route: '/settings', icon: 'settings', color: '#78909C' },
];

export default function MobileMoreSheet({ visible, onClose }: MobileMoreSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
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
      toValue: 350,
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

  if (!visible) return null;

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={closeSheet}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeSheet}>
          <BlurView intensity={Platform.OS === 'ios' ? 40 : 60} tint="dark" style={StyleSheet.absoluteFill} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.dragHandleArea} {...panResponder.panHandlers}>
            <TouchableOpacity activeOpacity={0.7} onPress={closeSheet} style={styles.dragTouchZone}>
              <View style={styles.dragHandle} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Resident Menu</Text>
            <Text style={styles.sheetSubtitle}>Quick access to your home portal</Text>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
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
    cursor: 'pointer',
  } as any,
  dragTouchZone: {
    paddingVertical: 4,
    paddingHorizontal: 24,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  sheetHeader: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  gridContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  gridCardActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#00D8F6',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  cardTitleActive: {
    color: '#00A8C6',
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
});
