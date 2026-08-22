import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import FloatingBackButton from '@/src/components/common/navigation/FloatingBackButton';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useResponsive } from '@/src/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useProperties } from '@/src/hooks/useProperties';
import { useChargeConfig } from '@/src/features/finance/hooks/useChargeConfig';

// Sub-components
import { ChargeIdentityCard } from '../components/billing/ChargeIdentityCard';
import { RateCalculationCard } from '../components/billing/RateCalculationCard';
import { AdvancedLogicCard } from '../components/billing/AdvancedLogicCard';
import { DynamicPreviewCard } from '../components/billing/DynamicPreviewCard';

export default function CreateExpenseScreen({ token }: { token: string | null }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { handleScroll } = useScrollNav();
  const { propertyId: paramPropertyId, chargeId } = useLocalSearchParams<{ propertyId?: string, chargeId?: string }>();
  const { isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();
  const { properties } = useProperties();
  const propertyId = paramPropertyId && paramPropertyId !== 'null' ? paramPropertyId : (properties && properties.length > 0 ? properties[0].id : null);
  const { showToast } = useToast();
  const isEditMode = !!chargeId;

  const [expenseName, setExpenseName] = useState('');
  const [chargeCategory, setChargeCategory] = useState('CUSTOM');
  const [billingFrequency, setBillingFrequency] = useState('Monthly');
  const [calcMethod, setCalcMethod] = useState('Fixed Rate');
  const [baseRate, setBaseRate] = useState('');
  const [unitType, setUnitType] = useState('kWh');
  const [applySalesTax, setApplySalesTax] = useState(true);
  const [lateFee, setLateFee] = useState('5');
  const [autoCarryForward, setAutoCarryForward] = useState(false);
  const [nameError, setNameError] = useState('');

  // React-Query custom hook
  const {
    chargeConfig,
    isLoading: isQueryLoading,
    createConfig,
    isCreating,
    updateConfig,
    isUpdating,
  } = useChargeConfig(chargeId, token);

  useEffect(() => {
    if (isEditMode && chargeConfig) {
      setExpenseName(chargeConfig.chargeName);
      setChargeCategory(chargeConfig.chargeCategory || 'CUSTOM');
      
      let uiFreq = 'Monthly';
      if (chargeConfig.billingFrequency === 'ANNUAL') uiFreq = 'Annual';
      if (chargeConfig.billingFrequency === 'WEEKLY') uiFreq = 'Weekly';
      setBillingFrequency(uiFreq);

      let uiCalc = 'Fixed Rate';
      if (chargeConfig.calculationStrategy === 'METERED') uiCalc = 'Metered/Consumption';
      setCalcMethod(uiCalc);

      setBaseRate(chargeConfig.baseRate != null ? chargeConfig.baseRate.toString() : '');
      setApplySalesTax(chargeConfig.applySalesTax);
      setLateFee(chargeConfig.lateFeePercentage ? chargeConfig.lateFeePercentage.toString() : '');
      setAutoCarryForward(chargeConfig.autoCarryForward || false);
      if (chargeConfig.unitType) setUnitType(chargeConfig.unitType);
    }
  }, [isEditMode, chargeConfig]);

  const handleSubmit = async () => {
    if (!token) {
        showToast("Authentication required", "error");
        return;
    }
    if (!propertyId) {
        showToast("Missing property ID context.", "error");
        return;
    }

    if (!expenseName.trim()) {
        setNameError("Charge name is required");
        showToast("Please fix the validation errors first", "error");
        return;
    }
    setNameError('');

    try {
        let calcStrategyEnum = 'FIXED_RATE';
        if (calcMethod === 'Metered/Consumption') calcStrategyEnum = 'METERED';
        
        let freqEnum = 'MONTHLY';
        if (billingFrequency === 'Annual') freqEnum = 'ANNUAL';
        if (billingFrequency === 'Weekly') freqEnum = 'WEEKLY';

        const payload = {
            propertyId: propertyId as string,
            chargeName: expenseName,
            chargeCategory: chargeCategory, 
            billingFrequency: freqEnum,
            calculationStrategy: calcStrategyEnum,
            unitType: unitType,
            baseRate: baseRate ? parseFloat(baseRate) : null,
            applySalesTax: applySalesTax,
            lateFeePercentage: lateFee ? parseFloat(lateFee) : null,
            autoCarryForward: autoCarryForward,
        };

        if (isEditMode && chargeId) {
            await updateConfig(payload);
            showToast("Charge updated successfully!", "success");
            setTimeout(() => router.back(), 1200);
        } else {
            await createConfig(payload);
            showToast("Charge configured successfully!", "success");
            setTimeout(() => router.back(), 1200);
        }
    } catch (e: any) {
        const errorMsg = e.response?.data?.message || e.message || "Failed to save charge.";
        showToast(errorMsg, "error");
    }
  };

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

  const isSaving = isCreating || isUpdating;

  if (isQueryLoading) {
    return (
      <LinearGradient colors={theme.Colors.backgroundGradient as [string, string, string]} style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
      </LinearGradient>
    );
  }

  const renderContent = () => (
    <View style={styles.contentContainer}>
      <View style={isDesktop ? styles.desktopMainRow : null}>
        <View style={isDesktop ? styles.desktopFormCol : null}>
          {/* Card 1: Charge Identity */}
          <ChargeIdentityCard
            expenseName={expenseName}
            setExpenseName={setExpenseName}
            chargeCategory={chargeCategory}
            setChargeCategory={setChargeCategory}
            billingFrequency={billingFrequency}
            setBillingFrequency={setBillingFrequency}
            nameError={nameError}
            setNameError={setNameError}
            isDark={isDark}
          />

          {/* Card 2: Rate & Calculation */}
          <RateCalculationCard
            calcMethod={calcMethod}
            setCalcMethod={setCalcMethod}
            baseRate={baseRate}
            setBaseRate={setBaseRate}
            unitType={unitType}
            setUnitType={setUnitType}
            isDesktop={isDesktop}
            isDark={isDark}
          />

          {/* Card 3: Advanced Logic */}
          <AdvancedLogicCard
            applySalesTax={applySalesTax}
            setApplySalesTax={setApplySalesTax}
            autoCarryForward={autoCarryForward}
            setAutoCarryForward={setAutoCarryForward}
            lateFee={lateFee}
            setLateFee={setLateFee}
            isDark={isDark}
          />
        </View>

        {isDesktop && (
          <View style={styles.desktopPreviewCol}>
            <DynamicPreviewCard
              chargeCategory={chargeCategory}
              expenseName={expenseName}
              billingFrequency={billingFrequency}
              calcMethod={calcMethod}
              baseRate={baseRate}
              unitType={unitType}
              applySalesTax={applySalesTax}
              isDesktop={isDesktop}
              isDark={isDark}
            />
          </View>
        )}
      </View>

      {!isDesktop && (
        <DynamicPreviewCard
          chargeCategory={chargeCategory}
          expenseName={expenseName}
          billingFrequency={billingFrequency}
          calcMethod={calcMethod}
          baseRate={baseRate}
          unitType={unitType}
          applySalesTax={applySalesTax}
          isDesktop={isDesktop}
          isDark={isDark}
        />
      )}

      {/* Action Submit Button */}
      <TouchableOpacity 
        style={[styles.submitButtonWrapper, isSaving && { opacity: 0.6 }]} 
        onPress={handleSubmit}
        disabled={isSaving}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#00d4ff', '#0072ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitButton}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>{isEditMode ? 'UPDATE CONFIGURATION' : 'ACTIVATE CHARGE CONFIG'}</Text>
              <MaterialIcons name="bolt" size={20} color="#fff" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={theme.Colors.backgroundGradient as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
          {isDesktop ? (
            <DesktopNavBar 
              onBack={() => router.replace(`/expenses?propertyId=${propertyId}`)} 
              backText="Back to Billing Controls" 
            />
          ) : (
            <>
              <Animated.View style={[styles.headerContainer, { opacity: headerOpacity, paddingTop: insets.top, height: 56 + insets.top }]}>
                <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>{isEditMode ? 'EDIT EXPENSE' : 'NEW EXPENSE'}</Text>
                </View>
              </Animated.View>
              <FloatingBackButton 
                onPress={() => router.back()}
              />
            </>
          )}

          <Animated.ScrollView
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true, listener: handleScroll }
            )}
            scrollEventThrottle={16}
            contentContainerStyle={[
              styles.scrollContent,
              !isDesktop && { paddingTop: 60 + insets.top }
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={isDesktop ? styles.desktopInner : null}>
              {!isDesktop && (
                <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
                  <Text style={styles.screenTitle}>{isEditMode ? 'Modify Expense' : 'Configure Expense'}</Text>
                  <Text style={styles.screenSubtitle}>Define standard charge codes, automation triggers and taxes</Text>
                </Animated.View>
              )}

              {isDesktop && (
                <View style={[styles.titleContainer, { marginBottom: 24 }]}>
                  <Text style={styles.screenTitleDesktop}>{isEditMode ? 'Modify Expense Configuration' : 'Configure New Property Charge'}</Text>
                  <Text style={styles.screenSubtitleDesktop}>Setup standard ledger components, metered utility factors and penalty strategies</Text>
                </View>
              )}

              {renderContent()}
            </View>
          </Animated.ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 998,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.Colors.glassFill,
  },
  headerContent: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.BodyLarge.fontSize,
    fontFamily: 'Inter',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  titleContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: theme.Typography.headlineLg.fontSize,
    fontFamily: 'Outfit',
    fontWeight: '900',
    color: theme.Colors.onSurface,
  },
  screenSubtitle: {
    fontSize: theme.Typography.BodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 4,
    fontWeight: '600',
    lineHeight: 18,
  },
  screenTitleDesktop: {
    fontSize: theme.Typography.headlineLg.fontSize,
    fontFamily: 'Outfit',
    fontWeight: '900',
    color: theme.Colors.onSurface,
  },
  screenSubtitleDesktop: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 4,
    fontWeight: '600',
  },
  contentContainer: {
    width: '100%',
  },
  submitButtonWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  submitButtonText: {
    color: theme.Colors.onPrimary,
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '900',
    letterSpacing: 1,
  },
  desktopInner: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    paddingTop: 24,
  },
  desktopMainRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
  },
  desktopFormCol: {
    flex: 1.6,
  },
  desktopPreviewCol: {
    flex: 1,
    height: 380,
    position: 'sticky',
    top: 24,
  },
});
