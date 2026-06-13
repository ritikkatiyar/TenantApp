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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/hooks/useResponsive';

import { getBillingStatus, subscribeToPlan, topUpWallet, BillingStatusResponse } from '@/src/features/finance/api/billing.api';
import { Theme } from '@/src/theme/Theme';

const { width } = Dimensions.get('window');
const LUMINOUS_BACKGROUND = ['#f4faff', '#ecf5fb', '#d8e2ff'] as const;

type BillingScreenProps = {
  token: string;
};

export default function BillingScreen({ token }: BillingScreenProps) {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const [isLoading, setIsLoading] = useState(true);
  const [billingData, setBillingData] = useState<BillingStatusResponse | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [expectedAITasks, setExpectedAITasks] = useState(1000);
  const [additionalUnits, setAdditionalUnits] = useState(5);
  const [topUpAmount, setTopUpAmount] = useState('10');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchBillingStatus();
  }, [token]);

  const fetchBillingStatus = async () => {
    try {
      setIsLoading(true);
      const data = await getBillingStatus(token);
      setBillingData(data);
    } catch (error: any) {
      console.error('[BILLING] Failed to load billing status:', error);
      Alert.alert('Error', 'Failed to load billing context.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planName: string, amount: number) => {
    try {
      setIsProcessing(true);
      const finalAmount = isAnnual ? amount * 12 * 0.8 : amount; // 20% yearly discount
      const cycle = isAnnual ? 'YEARLY' : 'MONTHLY';
      
      const res = await subscribeToPlan({
        planName,
        amount: finalAmount,
        billingCycle: cycle,
        gateway: 'STRIPE',
      }, token);

      Alert.alert(
        'Subscription Activated!',
        `Successfully subscribed to ${planName} (${cycle})! Checkout mock URL was generated.`,
        [{ text: 'Great!', onPress: fetchBillingStatus }]
      );
    } catch (error: any) {
      Alert.alert('Subscription Failed', error.message || 'Check your payment connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTopUp = async () => {
    const amt = parseFloat(topUpAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a positive top-up amount.');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await topUpWallet({
        amount: amt,
        gateway: 'STRIPE',
      }, token);

      const creditsAdded = amt * 50;
      Alert.alert(
        'Top-Up Successful!',
        `Purchased $${amt.toFixed(2)} converting to +${creditsAdded} AI credits instantly.`,
        [{ text: 'Done', onPress: fetchBillingStatus }]
      );
    } catch (error: any) {
      Alert.alert('Top-Up Failed', error.message || 'Payment processing error.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Custom Interactive Slider Calculation
  // Landlord Pro is $19.99/mo (includes 1,000 AI credits)
  // Additional tasks are $0.02 per credit
  // Additional units are $1.50 per unit
  const calculateEstimatedTotal = () => {
    const basePrice = 19.99;
    const additionalCreditsCost = Math.max(0, expectedAITasks - 1000) * 0.02;
    const unitsCost = additionalUnits * 1.50;
    let total = basePrice + additionalCreditsCost + unitsCost;
    if (isAnnual) {
      total = total * 0.8; // 20% discount
    }
    return total.toFixed(2);
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
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          {isDesktop ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.desktopBackButton}>
              <MaterialIcons name="arrow-back-ios" size={20} color={Theme.Colors.onSurface} />
              <Text style={styles.desktopBackButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back-ios" size={20} color={Theme.Colors.onSurface} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>CHOOSE YOUR POWER</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Quick Wallet Summary Card */}
          <BlurView intensity={60} tint="light" style={styles.walletStatusCard}>
            <LinearGradient
              colors={['rgba(0, 224, 255, 0.12)', 'rgba(0, 112, 234, 0.06)']}
              style={styles.walletStatusGradient}
            >
              <View style={styles.walletHeader}>
                <View>
                  <Text style={styles.walletLabel}>ACTIVE SUBSCRIPTION</Text>
                  <Text style={styles.walletValue}>{currentPlan}</Text>
                </View>
                <View style={styles.badgeContainer}>
                  <Text style={styles.activeBadge}>ACTIVE</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.walletFooter}>
                <View>
                  <Text style={styles.walletLabel}>PREPAID WALLET CREDIT</Text>
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
              <Text style={[styles.toggleText, !isAnnual && styles.toggleTextActive]}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, isAnnual && styles.toggleBtnActive]}
              onPress={() => setIsAnnual(true)}
            >
              <Text style={[styles.toggleText, isAnnual && styles.toggleTextActive]}>Yearly (Save 20%)</Text>
            </TouchableOpacity>
          </View>

          {/* Plan Cards */}
          <View style={styles.cardsWrapper}>
            
            {/* Starter Plan */}
            <BlurView intensity={60} tint="light" style={[styles.planCard, currentPlan === 'STARTER' && styles.planCardActive]}>
              {currentPlan === 'STARTER' && <View style={styles.currentPlanRibbon}><Text style={styles.ribbonText}>CURRENT</Text></View>}
              <Text style={styles.planTitle}>STARTER</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceDollar}>$0</Text>
                <Text style={styles.priceMonth}>/mo</Text>
              </View>
              
              <View style={styles.bulletList}>
                <View style={styles.bulletRow}>
                  <MaterialIcons name="check" size={16} color={Theme.Colors.primaryContainer} />
                  <Text style={styles.bulletText}>1 Property Limit</Text>
                </View>
                <View style={styles.bulletRow}>
                  <MaterialIcons name="check" size={16} color={Theme.Colors.primaryContainer} />
                  <Text style={styles.bulletText}>Roommate Split (Basic)</Text>
                </View>
                <View style={styles.bulletRow}>
                  <MaterialIcons name="check" size={16} color={Theme.Colors.primaryContainer} />
                  <Text style={styles.bulletText}>50 Free AI Credits / Month</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.cardButton, currentPlan === 'STARTER' && styles.cardButtonDisabled]}
                disabled={currentPlan === 'STARTER'}
                onPress={() => handleSubscribe('STARTER', 0.00)}
              >
                <Text style={styles.cardButtonText}>
                  {currentPlan === 'STARTER' ? 'Active Plan' : 'Get Started'}
                </Text>
              </TouchableOpacity>
            </BlurView>

            {/* Landlord Pro Plan */}
            <BlurView intensity={60} tint="light" style={[styles.planCard, styles.planCardPro, currentPlan === 'LANDLORD_PRO' && styles.planCardActive]}>
              {currentPlan === 'LANDLORD_PRO' && <View style={styles.currentPlanRibbon}><Text style={styles.ribbonText}>CURRENT</Text></View>}
              <View style={styles.proHeaderRow}>
                <Text style={[styles.planTitle, { color: Theme.Colors.primary }]}>LANDLORD PRO</Text>
                <View style={styles.popularBadge}><Text style={styles.popularText}>POPULAR</Text></View>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.priceDollar}>${isAnnual ? '15.99' : '19.99'}</Text>
                <Text style={styles.priceMonth}>/mo</Text>
              </View>
              
              <View style={styles.bulletList}>
                <View style={styles.bulletRow}>
                  <MaterialIcons name="check" size={16} color={Theme.Colors.primaryContainer} />
                  <Text style={styles.bulletText}>Unlimited Properties & Units</Text>
                </View>
                <View style={styles.bulletRow}>
                  <MaterialIcons name="check" size={16} color={Theme.Colors.primaryContainer} />
                  <Text style={styles.bulletText}>Roommate Split (Premium)</Text>
                </View>
                <View style={styles.bulletRow}>
                  <MaterialIcons name="check" size={16} color={Theme.Colors.primaryContainer} />
                  <Text style={styles.bulletText}>1,000 AI Credits / Month</Text>
                </View>
                <View style={styles.bulletRow}>
                  <MaterialIcons name="check" size={16} color={Theme.Colors.primaryContainer} />
                  <Text style={styles.bulletText}>Landlord Operation Dashboard</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.cardButton, styles.cardButtonPro]}
                onPress={() => handleSubscribe('LANDLORD_PRO', 19.99)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.cardButtonTextPro}>
                    {currentPlan === 'LANDLORD_PRO' ? 'Renew / Extend Pro' : 'Upgrade to Pro'}
                  </Text>
                )}
              </TouchableOpacity>
            </BlurView>

          </View>

          {/* Interactive Calculator Slider Card */}
          <BlurView intensity={60} tint="light" style={styles.calculatorCard}>
            <Text style={styles.calculatorTitle}>INTERACTIVE PAY-AS-YOU-GO CALCULATOR</Text>
            <Text style={styles.calculatorSub}>Estimate custom SaaS billing limits tailored to your scale:</Text>

            <View style={styles.sliderSection}>
              <View style={styles.sliderLabelRow}>
                <Text style={styles.sliderLabel}>Expected Monthly AI Tasks</Text>
                <Text style={styles.sliderValue}>{expectedAITasks.toLocaleString()}</Text>
              </View>
              
              {/* Custom touch slider track */}
              <View style={styles.trackContainer}>
                <TouchableOpacity
                  style={styles.trackPressable}
                  activeOpacity={1}
                  onPress={(e) => {
                    const relativeX = e.nativeEvent.locationX;
                    const pct = Math.min(Math.max(0, relativeX / (width - 80)), 1);
                    setExpectedAITasks(Math.round(pct * 5000));
                  }}
                >
                  <View style={styles.trackBase} />
                  <View style={[styles.trackFill, { width: `${(expectedAITasks / 5000) * 100}%` }]} />
                  <View style={[styles.trackThumb, { left: `${(expectedAITasks / 5000) * 92}%` }]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sliderSection}>
              <View style={styles.sliderLabelRow}>
                <Text style={styles.sliderLabel}>Additional Portfolio Units</Text>
                <Text style={styles.sliderValue}>{additionalUnits} Units</Text>
              </View>

              {/* Custom touch slider track */}
              <View style={styles.trackContainer}>
                <TouchableOpacity
                  style={styles.trackPressable}
                  activeOpacity={1}
                  onPress={(e) => {
                    const relativeX = e.nativeEvent.locationX;
                    const pct = Math.min(Math.max(0, relativeX / (width - 80)), 1);
                    setAdditionalUnits(Math.round(pct * 50));
                  }}
                >
                  <View style={styles.trackBase} />
                  <View style={[styles.trackFill, { width: `${(additionalUnits / 50) * 100}%` }]} />
                  <View style={[styles.trackThumb, { left: `${(additionalUnits / 50) * 92}%` }]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.estimateBox}>
              <Text style={styles.estimateLabel}>ESTIMATED TOTAL COST</Text>
              <Text style={styles.estimateTotal}>
                ${calculateEstimatedTotal()}
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
              <Text style={styles.dollarPrefix}>$</Text>
              <TextInput
                style={styles.topUpInput}
                keyboardType="numeric"
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                placeholder="10"
                placeholderTextColor="#64748B"
              />
              <Text style={styles.creditsConversion}>
                = +{(parseFloat(topUpAmount || '0') * 50).toLocaleString()} Credits
              </Text>
            </View>

            <View style={styles.topUpPresets}>
              {['10', '25', '50', '100'].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.presetBtn, topUpAmount === val && styles.presetBtnActive]}
                  onPress={() => setTopUpAmount(val)}
                >
                  <Text style={[styles.presetText, topUpAmount === val && styles.presetTextActive]}>${val}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.topUpSubmit} onPress={handleTopUp} disabled={isProcessing}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <LinearGradient
                  colors={[Theme.Colors.primaryContainer, Theme.Colors.secondaryContainer]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.topUpSubmitGradient}
                >
                  <Ionicons name="shield-checkmark" size={18} color="#fff" />
                  <Text style={styles.topUpSubmitText}>SECURE CHECKOUT</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </BlurView>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
    backgroundColor: Theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
  },
  desktopBackButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.Colors.onSurface,
  },
  headerTitle: {
    color: Theme.Colors.onSurface,
    fontSize: 18,
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
  cardsWrapper: {
    gap: 20,
    marginVertical: 15,
  },
  planCard: {
    borderRadius: 24,
    padding: 25,
    borderWidth: 1,
    borderColor: Theme.Colors.glassStroke,
    overflow: 'hidden',
    backgroundColor: Theme.Colors.glassFill,
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
    marginBottom: 25,
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
  cardButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: Theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Theme.Colors.outlineVariant,
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
    fontSize: 14,
    fontWeight: '800',
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
    borderWidth: 1,
    borderColor: Theme.Colors.outlineVariant,
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
    borderColor: Theme.Colors.primaryContainer,
    backgroundColor: 'rgba(0, 224, 255, 0.18)',
  },
  presetText: {
    color: Theme.Colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
  },
  presetTextActive: {
    color: Theme.Colors.primary,
  },
  topUpSubmit: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  topUpSubmitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  topUpSubmitText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
