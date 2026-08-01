import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useResponsive } from '@/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { listRentCycles } from '@/src/features/finance/api/rentCycle.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useToast } from '@/src/components/common/feedback/ToastContext';

export default function SettingsMenuScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();
  const { properties, isLoading } = useProperties();
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const propertyId = paramPropertyId || (properties && properties.length > 0 ? properties[0].id : null);

  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [publishedCount, setPublishedCount] = useState<number | null>(null);

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();

    // Try to fetch quick stats
    const fetchStats = async () => {
      try {
        if (!accessToken) return;
        const today = new Date();
        const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const data = await listRentCycles(month, accessToken);
        if (data) {
          setPendingCount(data.filter((i: any) => i.status === 'PENDING').length);
          setPublishedCount(data.filter((i: any) => i.status === 'PUBLISHED').length);
        }
      } catch {
        // silent — stats are optional
      }
    };
    fetchStats();
  }, [accessToken]);

  const menuItems = [
    {
      step: 1,
      id: 'charge-config',
      title: 'Charge Configuration',
      description: 'Set up rents, utilities & billing logic',
      icon: 'receipt-long',
      route: `/expenses/charge-config?propertyId=${propertyId}`,
      gradientColors: ['#0891b2', '#06b6d4'] as const,
      accentColor: '#0891b2',
      bg: 'rgba(8, 145, 178, 0.1)',
    },
    {
      step: 2,
      id: 'worksheets',
      title: 'Billing Worksheets',
      description: 'Input meter readings & variable charges',
      icon: 'edit-document',
      route: `/expenses/billing-worksheet?propertyId=${propertyId}`,
      gradientColors: ['#4f46e5', '#7c3aed'] as const,
      accentColor: '#4f46e5',
      bg: 'rgba(79, 70, 229, 0.1)',
    },
    {
      step: 3,
      id: 'rent-roll',
      title: 'Generate Rent Roll',
      description: 'Publish monthly invoices to tenants',
      icon: 'point-of-sale',
      route: `/expenses/rent-roll?propertyId=${propertyId}`,
      gradientColors: ['#059669', '#10b981'] as const,
      accentColor: '#059669',
      bg: 'rgba(5, 150, 105, 0.1)',
    },
    {
      step: 4,
      id: 'ledger',
      title: 'Finance Ledger',
      description: 'Audit trail of all transactions',
      icon: 'account-balance',
      route: `/expenses/ledger?propertyId=${propertyId}`,
      gradientColors: ['#0d9488', '#14b8a6'] as const,
      accentColor: '#0d9488',
      bg: 'rgba(13, 148, 136, 0.1)',
    },
  ];

  const renderMobileContent = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Quick Stats Hero */}
      <BlurView intensity={55} tint="light" style={styles.statsHero}>
        <LinearGradient
          colors={['rgba(0, 168, 204, 0.12)', 'rgba(99, 102, 241, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsGradient}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {publishedCount !== null ? publishedCount : '—'}
              </Text>
              <Text style={styles.statLabel}>Published</Text>
              <View style={[styles.statDot, { backgroundColor: '#10b981' }]} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, pendingCount && pendingCount > 0 ? styles.statWarning : null]}>
                {pendingCount !== null ? pendingCount : '—'}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
              <View style={[styles.statDot, { backgroundColor: '#f59e0b' }]} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {publishedCount !== null && pendingCount !== null
                  ? publishedCount + pendingCount
                  : '—'}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
              <View style={[styles.statDot, { backgroundColor: '#6366f1' }]} />
            </View>
          </View>
          <Text style={styles.statsSubtitle}>This billing cycle</Text>
        </LinearGradient>
      </BlurView>

      {/* Workflow Label */}
      <View style={styles.workflowLabelRow}>
        <View style={styles.workflowLine} />
        <Text style={styles.workflowLabel}>BILLING PIPELINE</Text>
        <View style={styles.workflowLine} />
      </View>

      {/* Menu Items */}
      <View style={styles.listContainer}>
        {menuItems.map((item, index) => (
          <Animated.View
            key={item.id}
            style={{
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24 + index * 8, 0],
                }),
              }],
            }}
          >
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                if (properties.length === 0) {
                  showToast('Please create a property first to access finance features.', 'error');
                  router.push('/properties/create');
                  return;
                }
                router.push(item.route as any);
              }}
              style={[styles.listItem, properties.length === 0 && { opacity: 0.6 }]}
            >
              <BlurView intensity={55} tint="light" style={styles.menuCard}>
                {/* Left accent stripe */}
                <LinearGradient
                  colors={item.gradientColors}
                  style={styles.cardStripe}
                />
                <View style={styles.cardContent}>
                  {/* Step badge */}
                  <View style={styles.stepBadgeWrapper}>
                    <LinearGradient
                      colors={item.gradientColors}
                      style={styles.stepBadge}
                    >
                      <Text style={styles.stepNumber}>{item.step}</Text>
                    </LinearGradient>
                    {/* Icon below badge */}
                    <View style={[styles.iconWrapper, { backgroundColor: item.bg }]}>
                      <MaterialIcons name={item.icon as any} size={22} color={item.accentColor} />
                    </View>
                  </View>

                  {/* Text */}
                  <View style={styles.textContainer}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuDesc}>{item.description}</Text>
                  </View>

                  {/* Chevron */}
                  <View style={[styles.chevronWrapper, { backgroundColor: item.bg }]}>
                    <MaterialIcons name="chevron-right" size={20} color={item.accentColor} />
                  </View>
                </View>

                {/* Connector dot to next step */}
                {index < menuItems.length - 1 && (
                  <View style={styles.connectorDot}>
                    <MaterialIcons name="arrow-downward" size={12} color="rgba(0,104,117,0.35)" />
                  </View>
                )}
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Bottom note */}
      <BlurView intensity={30} tint="light" style={styles.tipCard}>
        <MaterialIcons name="lightbulb-outline" size={16} color="#0891b2" />
        <Text style={styles.tipText}>
          Follow steps 1 → 4 for a complete billing cycle each month.
        </Text>
      </BlurView>
    </Animated.View>
  );

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {isDesktop && (
          <DesktopNavBar 
            properties={properties || []}
            selectedPropertyId={propertyId}
            onPropertyChange={(id) => router.replace(`/expenses?propertyId=${id}`)}
          />
        )}

        <Animated.ScrollView
          contentContainerStyle={[styles.scrollContent, !isDesktop && { paddingTop: 88 }]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          <View style={isDesktop ? styles.desktopInner : null}>
            {isDesktop && (
              <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
                <Text style={styles.titleLineDesktop}>Finance & Billing</Text>
                <Text style={{ fontSize: 14, color: '#6b7a7d', marginTop: 4, fontWeight: '500', lineHeight: 20 }}>
                  Configure rents, utilities, billing worksheets, monthly rent rolls & financial ledgers
                </Text>
              </Animated.View>
            )}

            {!isLoading && properties.length === 0 && (
              <BlurView intensity={60} tint="light" style={{ padding: 24, borderRadius: 20, marginBottom: 24, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.7)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0, 104, 117, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="business" size={26} color="#006875" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#163235', marginBottom: 2 }}>No Property Created Yet</Text>
                    <Text style={{ fontSize: 13, color: '#6b7a7d', lineHeight: 18 }}>Finance & billing setup requires an active property. Create your first property to start configuring charges and rent cycles.</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={{ borderRadius: 100, overflow: 'hidden' }}
                  onPress={() => router.push('/properties/create')}
                >
                  <LinearGradient colors={['#00d4ff', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>CREATE PROPERTY</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>
            )}

            {isDesktop ? (
              <View style={styles.gridContainer}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.75}
                    onPress={() => {
                      if (properties.length === 0) {
                        showToast('Please create a property first to access finance features.', 'error');
                        router.push('/properties/create');
                        return;
                      }
                      router.push(item.route as any);
                    }}
                    style={[styles.gridItem, properties.length === 0 && { opacity: 0.6 }]}
                  >
                    <BlurView intensity={60} tint="light" style={styles.menuCard}>
                      <View style={styles.cardContent}>
                        <View style={[styles.iconWrapper, { backgroundColor: item.bg }]}>
                          <MaterialIcons name={item.icon as any} size={28} color={item.accentColor} />
                        </View>
                        <View style={styles.textContainer}>
                          <Text style={styles.menuTitle}>{item.title}</Text>
                          <Text style={styles.menuDesc}>{item.description}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#849495" />
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              renderMobileContent()
            )}
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },
  desktopInner: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
  },
  titleContainer: { marginBottom: 32 },
  titleLineDesktop: {
    fontSize: 32,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 38,
    letterSpacing: -0.5,
  },

  // — Quick Stats Hero —
  statsHero: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    marginBottom: 24,
    shadowColor: '#006875',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  statsGradient: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0b1c30',
    fontFamily: 'Inter',
  },
  statWarning: {
    color: '#d97706',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5b6b6d',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 104, 117, 0.12)',
  },
  statsSubtitle: {
    textAlign: 'center',
    fontSize: 11,
    color: '#849495',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // — Workflow Label —
  workflowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  workflowLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 104, 117, 0.15)',
  },
  workflowLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#849495',
    letterSpacing: 1.2,
  },

  // — Menu Items —
  listContainer: {
    gap: 0,
  },
  listItem: {
    width: '100%',
    marginBottom: 2,
  },
  menuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    overflow: 'hidden',
    shadowColor: '#006875',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 12,
  },
  cardStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingLeft: 20,
    paddingRight: 16,
    gap: 14,
  },
  stepBadgeWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b1c30',
    marginBottom: 3,
    fontFamily: 'Inter',
  },
  menuDesc: {
    fontSize: 13,
    color: '#6b7a7d',
    lineHeight: 18,
  },
  chevronWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectorDot: {
    alignSelf: 'center',
    marginBottom: -6,
    marginTop: -4,
    zIndex: 10,
    opacity: 0.6,
  },

  // — Tip Card —
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#5b6b6d',
    lineHeight: 18,
    fontWeight: '500',
  },

  // Desktop
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  gridItem: {
    width: '48%',
    minWidth: 300,
  },
});
