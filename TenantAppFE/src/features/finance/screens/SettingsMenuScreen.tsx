import React, { useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useResponsive } from '@/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';

export default function SettingsMenuScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();
  const propertyId = paramPropertyId || (properties && properties.length > 0 ? properties[0].id : null);

  const headerOpacity = scrollY.interpolate({
    inputRange: [40, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const menuItems = [
    {
      id: 'charge-config',
      title: 'Charge Configuration',
      description: 'Manage base rents, utilities, and billing logic.',
      icon: 'receipt-long',
      route: `/expenses/charge-config?propertyId=${propertyId}`,
      color: '#0891b2',
      bg: '#cffafe'
    },
    {
      id: 'worksheets',
      title: 'Billing Worksheets',
      description: 'Input variable readings and one-off charges.',
      icon: 'edit-document',
      route: `/expenses/billing-worksheet?propertyId=${propertyId}`,
      color: '#4f46e5',
      bg: '#e0e7ff'
    },
    {
      id: 'rent-roll',
      title: 'Generate Rent Roll',
      description: 'Finalize drafts and publish monthly invoices to tenants.',
      icon: 'point-of-sale',
      route: `/expenses/rent-roll?propertyId=${propertyId}`,
      color: '#059669',
      bg: '#d1fae5'
    },
    {
      id: 'ledger',
      title: 'Finance Ledger',
      description: 'View immutable audit trail of all transactions.',
      icon: 'account-balance',
      route: `/expenses/ledger?propertyId=${propertyId}`,
      color: '#0d9488',
      bg: '#ccfbf1'
    },
    {
      id: 'preferences',
      title: 'System Preferences',
      description: 'General property-level settings and defaults.',
      icon: 'settings',
      route: `/expenses/preferences?propertyId=${propertyId}`,
      color: '#dc2626',
      bg: '#fee2e2'
    }
  ];

  const renderMenuItem = (item: any) => (
    <TouchableOpacity 
      key={item.id}
      activeOpacity={0.7}
      onPress={() => router.push(item.route)}
      style={isDesktop ? styles.gridItem : styles.listItem}
    >
      <BlurView intensity={60} tint="light" style={styles.menuCard}>
        <View style={styles.cardContent}>
          <View style={[styles.iconWrapper, { backgroundColor: item.bg }]}>
            <MaterialIcons name={item.icon as any} size={28} color={item.color} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuDesc}>{item.description}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#849495" />
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {isDesktop ? (
          <DesktopNavBar 
            title="Finance & Billing" 
          />
        ) : (
          <View style={styles.header}>
            <View style={styles.mobileHeaderInner}>
              <Animated.View style={[styles.compactTitleContainer, { opacity: headerOpacity }]}>
                <Text style={styles.compactTitleText}>Finance & Billing</Text>
              </Animated.View>
            </View>
          </View>
        )}

        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          <View style={isDesktop ? styles.desktopInner : null}>
            <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
              {isDesktop ? (
                <Text style={styles.titleLineDesktop}>Finance & Billing</Text>
              ) : (
                <Text style={styles.titleLine}>Finance & Billing</Text>
              )}
            </Animated.View>

            <View style={isDesktop ? styles.gridContainer : styles.listContainer}>
              {menuItems.map(renderMenuItem)}
            </View>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  mobileHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactTitleContainer: { flex: 1 },
  compactTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#151d1e',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
  desktopInner: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
  },
  titleContainer: {
    marginBottom: 40,
  },
  titleLine: {
    fontSize: 48,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 52,
    letterSpacing: -1,
  },
  titleLineDesktop: {
    fontSize: 32,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 38,
  },
  listContainer: {
    gap: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  listItem: {
    width: '100%',
  },
  gridItem: {
    width: '48%',
    minWidth: 300,
  },
  menuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    boxShadow: '0px 10px 30px rgba(0, 104, 117, 0.05)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#151d1e',
    marginBottom: 6,
  },
  menuDesc: {
    fontSize: 14,
    color: '#5b6b6d',
    lineHeight: 20,
  }
});
