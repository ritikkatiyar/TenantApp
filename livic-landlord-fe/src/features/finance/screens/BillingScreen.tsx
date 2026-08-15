import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

import {
  getBillingStatus,
  getPlans,
  subscribeToPlan,
  topUpWallet,
  verifyPayment,
  BillingStatusResponse,
  PlanResponse,
} from '@/src/features/finance/api/billing.api';
import { Theme } from '@/src/theme/Theme';

const { width } = Dimensions.get('window');
const LUMINOUS_BACKGROUND = ['#f4faff', '#ecf5fb', '#d8e2ff'] as const;

type BillingScreenProps = {
  token: string;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BillingScreen({ token }: BillingScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const { handleScroll } = useScrollNav();
  const [isLoading, setIsLoading] = useState(true);
  const [billingData, setBillingData] = useState<BillingStatusResponse | null>(null);
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [isAnnual, setIsAnnual] = useState(false);
  const [expectedAITasks, setExpectedAITasks] = useState(1000);
  const [additionalUnits, setAdditionalUnits] = useState(5);
  const [topUpAmount, setTopUpAmount] = useState('500');
  const [subscribingPlanKey, setSubscribingPlanKey] = useState<string | null>(null);
  const [isTopUpProcessing, setIsTopUpProcessing] = useState(false);

  useEffect(() => {
    fetchInitialData();
    loadRazorpayScript();
  }, [token]);

  const loadRazorpayScript = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  };

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [statusRes, plansRes] = await Promise.all([
        getBillingStatus(token),
        getPlans(token).catch(() => []),
      ]);
      setBillingData(statusRes);
      if (plansRes && plansRes.length > 0) {
        setPlans(plansRes);
      }
    } catch (error: any) {
      console.error('[BILLING] Failed to load billing context:', error);
      Alert.alert('Error', 'Failed to load billing context.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planKey: string, price: number) => {
    try {
      setSubscribingPlanKey(planKey);
      const cycle = isAnnual ? 'YEARLY' : 'MONTHLY';
      const finalAmount = isAnnual ? price * 12 * 0.8 : price;

      const res = await subscribeToPlan({
        planName: planKey,
        amount: finalAmount,
        billingCycle: cycle,
      }, token);

      const razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_TKP4I9m5sGhRXH';

      if (Platform.OS === 'web' && window.Razorpay) {
        const options: any = {
          key: razorpayKey,
          name: 'Livic TenantApp',
          description: `${planKey} Plan Subscription (${cycle})`,
          upi: {
            flow: 'qr',
          },
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true,
          },
          prefill: {
            method: 'upi',
          },
          handler: async function (response: any) {
            try {
              await verifyPayment({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id || options.order_id || res.gatewayTransactionId,
                razorpaySignature: response.razorpay_signature,
              }, token);
              Alert.alert('Success!', `Subscribed to ${planKey} plan successfully!`, [
                { text: 'Great!', onPress: fetchInitialData },
              ]);
            } catch (err: any) {
              Alert.alert('Verification Error', err.message || 'Could not verify payment. Contact support.');
            } finally {
              setSubscribingPlanKey(null);
            }
          },
          modal: {
            ondismiss: function () {
              setSubscribingPlanKey(null);
            },
          },
        };

        if (res.gatewayTransactionId && !res.gatewayTransactionId.startsWith('order_rzp_test_')) {
          options.order_id = res.gatewayTransactionId;
        } else {
          options.amount = Math.round(finalAmount * 100);
          options.currency = 'INR';
          options.order_id = res.gatewayTransactionId;
        }

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        Alert.alert(
          'Subscription Initiated!',
          `Plan ${planKey} (${cycle}) checkout initiated via Razorpay Test Mode.`,
          [{ text: 'OK', onPress: fetchInitialData }]
        );
        setSubscribingPlanKey(null);
      }
    } catch (error: any) {
      Alert.alert('Subscription Failed', error.message || 'Check your payment connection.');
      setSubscribingPlanKey(null);
    }
  };

  const handleTopUp = async () => {
    const amt = parseFloat(topUpAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a positive top-up amount.');
      return;
    }

    try {
      setIsTopUpProcessing(true);
      const res = await topUpWallet({
        amount: amt,
      }, token);

      const creditsAdded = Math.round(amt);

      const razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_TKP4I9m5sGhRXH';

      if (Platform.OS === 'web' && window.Razorpay) {
        const options: any = {
          key: razorpayKey,
          name: 'Livic TenantApp',
          description: `AI Wallet Top-Up (+${creditsAdded} Credits)`,
          upi: {
            flow: 'qr',
          },
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true,
          },
          prefill: {
            method: 'upi',
          },
          handler: async function (response: any) {
            try {
              await verifyPayment({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id || res.gatewayTransactionId,
                razorpaySignature: response.razorpay_signature,
              }, token);
              Alert.alert('Top-Up Successful!', `+${creditsAdded} AI credits added to your wallet.`, [
                { text: 'Done', onPress: fetchInitialData },
              ]);
            } catch (err: any) {
              Alert.alert('Verification Error', err.message || 'Could not verify payment. Contact support.');
            } finally {
              setIsTopUpProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsTopUpProcessing(false);
            },
          },
        };

        if (res.gatewayTransactionId && !res.gatewayTransactionId.startsWith('order_rzp_test_')) {
          options.order_id = res.gatewayTransactionId;
        } else {
          options.amount = Math.round(amt * 100);
          options.currency = 'INR';
          options.order_id = res.gatewayTransactionId;
        }

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        Alert.alert(
          'Top-Up Successful!',
          `Purchased ₹${amt.toFixed(0)} converting to +${creditsAdded} AI credits instantly.`,
          [{ text: 'Done', onPress: fetchInitialData }]
        );
        setIsTopUpProcessing(false);
      }
    } catch (error: any) {
      Alert.alert('Top-Up Failed', error.message || 'Payment processing error.');
      setIsTopUpProcessing(false);
    }
  };

  const calculateEstimatedTotal = () => {
    const aiTasks = isNaN(expectedAITasks) ? 1000 : expectedAITasks;
    const units = isNaN(additionalUnits) ? 5 : additionalUnits;
    const basePrice = 1599;
    const additionalCreditsCost = Math.max(0, aiTasks - 1000) * 1.50;
    const unitsCost = units * 100;
    let total = basePrice + additionalCreditsCost + unitsCost;
    if (isAnnual) {
      total = total * 0.8;
    }
    return Math.round(total).toLocaleString('en-IN');
  };

  if (isLoading) {
    return (
      <LinearGradient colors={LUMINOUS_BACKGROUND} style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Theme.Colors.primaryContainer} />
        <Text style={styles.loaderText}>Syncing financial wallet...</Text>
      </LinearGradient>
    );
  }

  const currentPlan = billingData?.subscription?.planName || 'STARTER';
  const remainingCredits = billingData?.wallet?.creditBalance || 0;

  return (
    <LinearGradient
      colors={LUMINOUS_BACKGROUND}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {/* Desktop Uniform Navbar */}
        {isDesktop ? (
          <DesktopNavBar 
            onBack={() => router.push('/settings')} 
            backText="Back to Settings" 
          />
        ) : (
          /* Mobile Glassy Header */
          <View style={[styles.headerContainer, !isDesktop && { paddingTop: insets.top, height: 56 + insets.top }]}>
            <BlurView intensity={45} tint="light" style={StyleSheet.absoluteFillObject} />
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={22} color="#0b1c30" />
              </TouchableOpacity>
              <View style={styles.titleWrapper}>
                <Text style={styles.headerTitle}>SUBSCRIPTION & BILLING</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </View>
        )}

        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[styles.scrollContent, !isDesktop && { paddingTop: 68 + insets.top }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={isDesktop ? styles.desktopInner : null}>
            
            {/* Desktop Hero Title */}
            {isDesktop && (
              <View style={styles.titleContainer}>
                <Text style={styles.titleLineDesktop}>SaaS Subscription & Billing</Text>
                <Text style={styles.subtitleDesktop}>Manage subscription plan tier, Razorpay gateway & prepaid AI credit wallet</Text>
              </View>
            )}
          
          {/* Quick Wallet Summary Card */}
          <BlurView intensity={60} tint="light" style={styles.walletStatusCard}>
            <LinearGradient
              colors={['rgba(0, 224, 255, 0.12)', 'rgba(0, 112, 234, 0.06)']}
              style={styles.walletStatusGradient}
            >
              <View style={styles.walletHeader}>
                <View>
                  <Text style={styles.walletLabel}>ACTIVE SUBSCRIPTION TIER</Text>
                  <Text style={styles.walletValue}>{currentPlan}</Text>
                </View>
                <View style={styles.badgeContainer}>
                  <Text style={styles.activeBadge}>ACTIVE</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.walletFooter}>
                <View>
                  <Text style={styles.walletLabel}>PREPAID AI CREDIT BALANCE</Text>
                  <Text style={styles.creditValue}>
                    {remainingCredits.toLocaleString()} <Text style={styles.creditUnit}>AI Credits</Text>
                  </Text>
                </View>
                <Ionicons name="wallet-outline" size={32} color={Theme.Colors.primary} />
              </View>
            </LinearGradient>
          </BlurView>

          {/* Toggle Switcher */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, !isAnnual && styles.toggleBtnActive]}
              onPress={() => setIsAnnual(false)}
            >
              <Text style={[styles.toggleText, !isAnnual && styles.toggleTextActive]}>Monthly Billing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, isAnnual && styles.toggleBtnActive]}
              onPress={() => setIsAnnual(true)}
            >
              <Text style={[styles.toggleText, isAnnual && styles.toggleTextActive]}>Annual Billing (Save 20%)</Text>
            </TouchableOpacity>
          </View>

          {/* Dynamic Plan Cards from Backend */}
          <View style={styles.cardsWrapper}>
            {plans.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center', width: '100%' }}>
                <Text style={{ color: Theme.Colors.onSurfaceVariant, fontSize: 14 }}>No plans available. Please try again later.</Text>
              </View>
            ) : plans.map((plan) => {
              const isCurrent = currentPlan.toUpperCase() === plan.planKey.toUpperCase();
              const price = isAnnual ? (plan.priceYearly ? plan.priceYearly / 12 : plan.priceMonthly * 0.8) : plan.priceMonthly;

              return (
                <BlurView
                  key={plan.id || plan.planKey}
                  intensity={60}
                  tint="light"
                  style={[
                    styles.planCard,
                    plan.planKey === 'PREMIUM' && styles.planCardPro,
                    isCurrent && styles.planCardActive,
                  ]}
                >
                  {isCurrent && (
                    <View style={styles.currentPlanRibbon}>
                      <Text style={styles.ribbonText}>CURRENT</Text>
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <View style={styles.proHeaderRow}>
                      <Text style={[styles.planTitle, plan.planKey === 'PREMIUM' && { color: Theme.Colors.primary }]}>
                        {plan.name || plan.planKey}
                      </Text>
                      {plan.planKey === 'PREMIUM' && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>POPULAR</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.priceContainer}>
                      <Text style={styles.priceDollar}>₹{Math.round(price).toLocaleString('en-IN')}</Text>
                      <Text style={styles.priceMonth}>/mo</Text>
                    </View>

                    <View style={styles.bulletList}>
                      {plan.features.slice(0, 6).map((feat, idx) => (
                        <View key={idx} style={styles.bulletRow}>
                          <MaterialIcons
                            name={feat.included ? 'check' : 'close'}
                            size={16}
                            color={feat.included ? Theme.Colors.primaryContainer : '#94a3b8'}
                          />
                          <Text style={[styles.bulletText, !feat.included && styles.bulletTextDisabled]}>
                            {feat.displayLabel}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.cardButton,
                      plan.planKey === 'PREMIUM' && styles.cardButtonPro,
                      isCurrent && styles.cardButtonDisabled,
                    ]}
                    disabled={isCurrent || subscribingPlanKey !== null || isTopUpProcessing}
                    onPress={() => handleSubscribe(plan.planKey, plan.priceMonthly)}
                  >
                    {subscribingPlanKey === plan.planKey ? (
                      <ActivityIndicator size="small" color={plan.planKey === 'PREMIUM' ? '#004f58' : Theme.Colors.primary} />
                    ) : (
                      <Text style={[styles.cardButtonText, plan.planKey === 'PREMIUM' && styles.cardButtonTextPro]} numberOfLines={1}>
                        {isCurrent ? 'Active Plan' : `Upgrade to ${plan.name || plan.planKey}`}
                      </Text>
                    )}
                  </TouchableOpacity>
                </BlurView>
              );
            })}
          </View>

          {/* Interactive Calculator Slider Card */}
          <BlurView intensity={60} tint="light" style={styles.calculatorCard}>
            <Text style={styles.calculatorTitle}>INTERACTIVE PAY-AS-YOU-GO CALCULATOR</Text>
            <Text style={styles.calculatorSub}>Estimate custom SaaS billing limits tailored to your scale:</Text>

            <View style={styles.sliderSection}>
              <View style={styles.sliderLabelRow}>
                <Text style={styles.sliderLabel}>Expected Monthly AI Tasks</Text>
                <Text style={styles.sliderValue}>{(isNaN(expectedAITasks) ? 1000 : expectedAITasks).toLocaleString()}</Text>
              </View>

              <View style={styles.trackContainer}>
                <TouchableOpacity
                  style={styles.trackPressable}
                  activeOpacity={1}
                  onPress={(e) => {
                    const locationX = e.nativeEvent?.locationX ?? (e.nativeEvent as any)?.offsetX ?? 0;
                    if (typeof locationX === 'number' && !isNaN(locationX) && locationX > 0) {
                      const pct = Math.min(Math.max(0, locationX / Math.max(1, width - 80)), 1);
                      const val = Math.round(pct * 5000);
                      if (!isNaN(val)) setExpectedAITasks(val);
                    }
                  }}
                >
                  <View style={styles.trackBase} />
                  <View style={[styles.trackFill, { width: `${(((isNaN(expectedAITasks) ? 1000 : expectedAITasks) / 5000) * 100)}%` }]} />
                  <View style={[styles.trackThumb, { left: `${(((isNaN(expectedAITasks) ? 1000 : expectedAITasks) / 5000) * 92)}%` }]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sliderSection}>
              <View style={styles.sliderLabelRow}>
                <Text style={styles.sliderLabel}>Additional Portfolio Units</Text>
                <Text style={styles.sliderValue}>{(isNaN(additionalUnits) ? 5 : additionalUnits)} Units</Text>
              </View>

              <View style={styles.trackContainer}>
                <TouchableOpacity
                  style={styles.trackPressable}
                  activeOpacity={1}
                  onPress={(e) => {
                    const locationX = e.nativeEvent?.locationX ?? (e.nativeEvent as any)?.offsetX ?? 0;
                    if (typeof locationX === 'number' && !isNaN(locationX) && locationX > 0) {
                      const pct = Math.min(Math.max(0, locationX / Math.max(1, width - 80)), 1);
                      const val = Math.round(pct * 50);
                      if (!isNaN(val)) setAdditionalUnits(val);
                    }
                  }}
                >
                  <View style={styles.trackBase} />
                  <View style={[styles.trackFill, { width: `${(((isNaN(additionalUnits) ? 5 : additionalUnits) / 50) * 100)}%` }]} />
                  <View style={[styles.trackThumb, { left: `${(((isNaN(additionalUnits) ? 5 : additionalUnits) / 50) * 92)}%` }]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.estimateBox}>
              <Text style={styles.estimateLabel}>ESTIMATED TOTAL COST</Text>
              <Text style={styles.estimateTotal}>
                ₹{calculateEstimatedTotal()}
                <Text style={styles.estimateCycle}>/{isAnnual ? 'yr' : 'mo'}</Text>
              </Text>
              <Text style={styles.estimateDesc}>Pro Plan + Customized Out-of-Bundle AI Credit Pack</Text>
            </View>
          </BlurView>

          {/* Prepaid Top-Up Card */}
          <BlurView intensity={60} tint="light" style={styles.topUpCard}>
            <Text style={styles.calculatorTitle}>METERED CREDIT WALLET TOP-UP</Text>
            <Text style={styles.calculatorSub}>Out-of-bundle credit purchases (never expire):</Text>

            <View style={styles.topUpInputContainer}>
              <Text style={styles.dollarPrefix}>₹</Text>
              <TextInput
                style={styles.topUpInput}
                keyboardType="numeric"
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                placeholder="500"
                placeholderTextColor="#64748B"
              />
              <Text style={styles.creditsConversion}>
                = +{(parseFloat(topUpAmount || '0')).toLocaleString()} Credits
              </Text>
            </View>

            <View style={styles.topUpPresets}>
              {['500', '1000', '2500', '5000'].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.presetBtn, topUpAmount === val && styles.presetBtnActive]}
                  onPress={() => setTopUpAmount(val)}
                >
                  <Text style={[styles.presetText, topUpAmount === val && styles.presetTextActive]}>₹{parseInt(val, 10).toLocaleString('en-IN')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.topUpSubmit} onPress={handleTopUp} disabled={isTopUpProcessing || subscribingPlanKey !== null}>
              {isTopUpProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <LinearGradient
                  colors={[Theme.Colors.primaryContainer, Theme.Colors.secondaryContainer]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.topUpSubmitGradient}
                >
                  <Ionicons name="shield-checkmark" size={18} color="#fff" />
                  <Text style={styles.topUpSubmitText}>RAZORPAY TEST CHECKOUT</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </BlurView>

          </View>
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: Theme.Colors.onSurfaceVariant,
    marginTop: 15,
    fontSize: 16,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    zIndex: 999,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Theme.Colors.onSurface,
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '800',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  walletStatusCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
    marginVertical: 15,
    backgroundColor: Theme.Colors.glassFill,
  },
  walletStatusGradient: {
    padding: 20,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabel: {
    color: Theme.Colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  walletValue: {
    color: Theme.Colors.onSurface,
    fontSize: 22,
    fontWeight: '800',
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 104, 119, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 119, 0.24)',
  },
  activeBadge: {
    color: Theme.Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: Theme.Colors.outlineVariant,
    marginVertical: 15,
  },
  walletFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creditValue: {
    color: Theme.Colors.onSurface,
    fontSize: 26,
    fontWeight: '800',
  },
  creditUnit: {
    fontSize: 14,
    color: Theme.Colors.primary,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 4,
    marginVertical: 15,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(0, 224, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.42)',
  },
  toggleText: {
    color: Theme.Colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: Theme.Colors.onSurface,
  },
  desktopInner: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
  },
  titleContainer: {
    marginBottom: 32,
  },
  titleLineDesktop: {
    fontSize: 32,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitleDesktop: {
    fontSize: 14,
    color: '#6b7a7d',
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 20,
  },
  cardsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginVertical: 15,
  },
  planCard: {
    flex: 1,
    minWidth: 230,
    borderRadius: 24,
    padding: 25,
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
    overflow: 'hidden',
    backgroundColor: Theme.Colors.glassFill,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  planCardPro: {
    borderColor: 'rgba(0, 224, 255, 0.55)',
  },
  planCardActive: {
    borderColor: Theme.Colors.primaryContainer,
    backgroundColor: 'rgba(0, 224, 255, 0.08)',
  },
  currentPlanRibbon: {
    position: 'absolute',
    top: 15,
    right: -25,
    backgroundColor: Theme.Colors.primaryContainer,
    transform: [{ rotate: '45deg' }],
    paddingHorizontal: 25,
    paddingVertical: 5,
  },
  ribbonText: {
    color: Theme.Colors.onPrimaryContainer,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  proHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  popularBadge: {
    backgroundColor: 'rgba(0, 224, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.5)',
  },
  popularText: {
    color: Theme.Colors.primary,
    fontSize: 9,
    fontWeight: '900',
  },
  planTitle: {
    color: Theme.Colors.onSurface,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  priceDollar: {
    color: Theme.Colors.onSurface,
    fontSize: 34,
    fontWeight: '900',
  },
  priceMonth: {
    color: Theme.Colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  bulletList: {
    gap: 12,
    marginBottom: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletText: {
    color: Theme.Colors.onSurface,
    fontSize: 14,
    fontWeight: '500',
  },
  bulletTextDisabled: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  cardButton: {
    width: '100%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: Theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Theme.Colors.outlineVariant,
    marginTop: 16,
  },
  cardButtonPro: {
    backgroundColor: Theme.Colors.primaryContainer,
    borderColor: Theme.Colors.primaryContainer,
  },
  cardButtonDisabled: {
    opacity: 0.5,
  },
  cardButtonText: {
    color: Theme.Colors.onSurface,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardButtonTextPro: {
    color: Theme.Colors.onPrimaryContainer,
    fontSize: 14,
    fontWeight: '800',
  },
  calculatorCard: {
    borderRadius: 24,
    padding: 25,
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
    overflow: 'hidden',
    marginVertical: 15,
    backgroundColor: Theme.Colors.glassFill,
  },
  calculatorTitle: {
    color: Theme.Colors.onSurface,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  calculatorSub: {
    color: Theme.Colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  sliderSection: {
    marginBottom: 20,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderLabel: {
    color: Theme.Colors.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },
  sliderValue: {
    color: Theme.Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  trackContainer: {
    height: 30,
    justifyContent: 'center',
  },
  trackPressable: {
    width: '100%',
    height: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBase: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.Colors.surfaceContainerHigh,
  },
  trackFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.Colors.primaryContainer,
    position: 'absolute',
    left: 0,
  },
  trackThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.Colors.surfaceContainerLowest,
    position: 'absolute',
    shadowColor: Theme.Colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 4,
  },
  estimateBox: {
    backgroundColor: Theme.Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.Colors.outlineVariant,
  },
  estimateLabel: {
    color: Theme.Colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  estimateTotal: {
    color: Theme.Colors.onSurface,
    fontSize: 32,
    fontWeight: '900',
  },
  estimateCycle: {
    fontSize: 16,
    color: Theme.Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  estimateDesc: {
    color: Theme.Colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  topUpCard: {
    borderRadius: 24,
    padding: 25,
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
    overflow: 'hidden',
    marginVertical: 15,
    backgroundColor: Theme.Colors.glassFill,
  },
  topUpInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.Colors.surfaceContainerLowest,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
  },
  dollarPrefix: {
    color: Theme.Colors.onSurface,
    fontSize: 20,
    fontWeight: '800',
    marginRight: 5,
  },
  topUpInput: {
    flex: 1,
    color: Theme.Colors.onSurface,
    fontSize: 20,
    fontWeight: '800',
  },
  creditsConversion: {
    color: Theme.Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  topUpPresets: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Theme.Colors.outlineVariant,
  },
  presetBtnActive: {
    backgroundColor: 'rgba(0, 224, 255, 0.16)',
    borderColor: 'rgba(0, 224, 255, 0.42)',
  },
  presetText: {
    color: Theme.Colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '700',
  },
  presetTextActive: {
    color: Theme.Colors.onSurface,
  },
  topUpSubmit: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  topUpSubmitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  topUpSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
