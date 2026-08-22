import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useResponsive } from '@/src/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { listRentCycles } from '@/src/features/finance/api/rentCycle.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { createStyles } from './SettingsMenuScreen.styles';

export default function SettingsMenuScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { handleScroll } = useScrollNav();
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

  const headerOpacity = scrollY.interpolate({
    inputRange: [40, 90],
    outputRange: [0, 1],
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
        if (data && data.content) {
          setPendingCount(data.content.filter((i: any) => i.status === 'PENDING').length);
          setPublishedCount(data.content.filter((i: any) => i.status === 'PUBLISHED').length);
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
      gradientColors: [theme.Colors.primary, '#06b6d4'] as const,
      accentColor: theme.Colors.primary,
      bg: 'rgba(0, 104, 117, 0.1)',
    },
    {
      step: 2,
      id: 'worksheets',
      title: 'Billing Worksheets',
      description: 'Input meter readings & variable charges',
      icon: 'edit-document',
      route: `/expenses/billing-worksheet?propertyId=${propertyId}`,
      gradientColors: [theme.Colors.secondary, '#7c3aed'] as const,
      accentColor: theme.Colors.secondary,
      bg: 'rgba(79, 70, 229, 0.1)',
    },
    {
      step: 3,
      id: 'rent-roll',
      title: 'Generate Rent Roll',
      description: 'Publish monthly invoices to tenants',
      icon: 'point-of-sale',
      route: `/expenses/rent-roll?propertyId=${propertyId}`,
      gradientColors: [theme.Colors.primary, '#10b981'] as const,
      accentColor: theme.Colors.primary,
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
      <BlurView intensity={55} tint={isDark ? 'dark' : 'light'} style={styles.statsHero}>
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
              <View style={[styles.statDot, { backgroundColor: theme.Colors.primary }]} />
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
              <BlurView intensity={55} tint={isDark ? 'dark' : 'light'} style={styles.menuCard}>
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
      <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.tipCard}>
        <MaterialIcons name="lightbulb-outline" size={16} color={theme.Colors.primary} />
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

        {/* Mobile Compact Header */}
        {!isDesktop && (
          <View style={styles.headerContainer}>
            <BlurView intensity={45} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
            <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
              <View style={styles.titleWrapper}>
                <Text style={styles.compactTitleText}>Finance & Billing</Text>
              </View>
            </Animated.View>
          </View>
        )}

        <Animated.ScrollView
          contentContainerStyle={[styles.scrollContent, !isDesktop && { paddingTop: 68 + insets.top }]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false, listener: handleScroll }
          )}
          scrollEventThrottle={16}
        >
          <View style={isDesktop ? styles.desktopInner : null}>
            {isDesktop ? (
              <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
                <Text style={styles.titleLineDesktop}>Finance & Billing</Text>
                <Text style={{ fontSize: theme.Typography.BodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, marginTop: 4, fontWeight: '500', lineHeight: 20 }}>
                  Configure rents, utilities, billing worksheets, monthly rent rolls & financial ledgers
                </Text>
              </Animated.View>
            ) : (
              <Animated.View style={[styles.mobileLargeTitle, { opacity: largeTitleOpacity }]}>
                <Text style={styles.titleLine}>Finance &</Text>
                <Text style={styles.titleLine}>Billing</Text>
                <Text style={styles.mobileSubtitle}>
                  Configure rents, utilities & billing pipelines
                </Text>
              </Animated.View>
            )}

            {!isLoading && properties.length === 0 && (
              <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={{ padding: 24, borderRadius: 20, marginBottom: 24, borderWidth: 1.5, borderColor: theme.Colors.glassStroke, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0, 104, 117, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="business" size={26} color={theme.Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: theme.Typography.BodyLarge.fontSize, fontWeight: '800', color: theme.Colors.onSurface, marginBottom: 2 }}>No Property Created Yet</Text>
                    <Text style={{ fontSize: theme.Typography.BodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, lineHeight: 18 }}>Finance & billing setup requires an active property. Create your first property to start configuring charges and rent cycles.</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={{ borderRadius: 100, overflow: 'hidden' }}
                  onPress={() => router.push('/properties/create')}
                >
                  <LinearGradient colors={['#00d4ff', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="add" size={18} color={theme.Colors.surfaceContainerLowest} />
                    <Text style={{ color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.BodySmall.fontSize, fontWeight: '800', letterSpacing: 0.5 }}>CREATE PROPERTY</Text>
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
                    <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.menuCard}>
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

