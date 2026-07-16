import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { createChargeConfig, updateChargeConfig, getChargeConfigById } from '@/src/features/finance/api/charge.api';
import { useResponsive } from '@/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useToast } from '@/src/components/common/feedback/ToastContext';

export default function CreateExpenseScreen({ token }: { token: string | null }) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { propertyId, chargeId } = useLocalSearchParams<{ propertyId: string, chargeId?: string }>();
  const { isDesktop } = useResponsive();
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
  const [isLoading, setIsLoading] = useState(false);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [nameError, setNameError] = useState('');
  const unitScrollRef = useRef<ScrollView>(null);
  const scrollTimeout = useRef<any>(null);

  useEffect(() => {
    if (isEditMode && token && chargeId) {
      loadChargeData();
    }
  }, [isEditMode, token, chargeId]);

  const loadChargeData = async () => {
    try {
      setIsLoading(true);
      const data = await getChargeConfigById(chargeId as string, token as string);
      setExpenseName(data.chargeName);
      setChargeCategory(data.chargeCategory || 'CUSTOM');
      
      let uiFreq = 'Monthly';
      if (data.billingFrequency === 'ANNUAL') uiFreq = 'Annual';
      if (data.billingFrequency === 'WEEKLY') uiFreq = 'Weekly';
      setBillingFrequency(uiFreq);

      let uiCalc = 'Fixed Rate';
      if (data.calculationStrategy === 'METERED') uiCalc = 'Metered/Consumption';
      setCalcMethod(uiCalc);

      setBaseRate(data.baseRate != null ? data.baseRate.toString() : '');
      setApplySalesTax(data.applySalesTax);
      setLateFee(data.lateFeePercentage ? data.lateFeePercentage.toString() : '');
      setAutoCarryForward(data.autoCarryForward || false);
    } catch(e: any) {
      showToast("Failed to load charge details", "error");
    } finally {
      setIsLoading(false);
    }
  };

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
        setIsLoading(true);
        // Map UI labels to Backend Enums
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
            await updateChargeConfig(chargeId as string, payload, token);
            showToast("Charge updated successfully!", "success");
            setTimeout(() => router.back(), 1200);
        } else {
            await createChargeConfig(payload, token);
            showToast("Charge configured successfully!", "success");
            setTimeout(() => router.back(), 1200);
        }
    } catch (e: any) {
        const errorMsg = e.response?.data?.message || e.message || "Failed to save charge.";
        showToast(errorMsg, "error");
    } finally {
        setIsLoading(false);
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

  const renderCard1 = () => (
    <BlurView intensity={40} tint="light" style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="file-document-outline" size={20} color="#006875" />
        <Text style={styles.cardTitle}>Charge Identity</Text>
      </View>

      <Text style={styles.label}>CHARGE NAME</Text>
      <View style={[styles.inputContainer, nameError ? { borderColor: '#ba1a1a', marginBottom: 8 } : null]}>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Electricity, Sanitation Service" 
          placeholderTextColor="#849495"
          value={expenseName}
          onChangeText={(val) => {
            setExpenseName(val);
            if (val.trim()) setNameError('');
          }}
        />
      </View>
      {nameError ? <Text style={{ color: '#ba1a1a', fontSize: 12, marginTop: -6, marginBottom: 18, fontWeight: '600' }}>{nameError}</Text> : null}

      <Text style={styles.label}>CATEGORY</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 24 }}>
        {['RENT', 'ELECTRICITY', 'SERVICE', 'PENALTY', 'DISCOUNT', 'CUSTOM'].map((cat) => {
          const isActive = chargeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                backgroundColor: isActive ? '#006875' : 'rgba(255, 255, 255, 0.5)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: isActive ? '#006875' : 'rgba(255, 255, 255, 0.9)',
              }}
              onPress={() => setChargeCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: isActive ? '800' : '600',
                color: isActive ? '#ffffff' : '#5b6b6d',
              }}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>BILLING FREQUENCY</Text>
      <View style={styles.segmentContainer}>
        {['Monthly', 'Annual', 'Weekly'].map((freq) => {
          const isActive = billingFrequency === freq;
          return (
            <TouchableOpacity 
              key={freq}
              style={styles.segmentButtonWrapper}
              onPress={() => setBillingFrequency(freq)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <LinearGradient
                  colors={['#00d4ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.segmentButtonGradient}
                >
                  <Text style={styles.segmentTextActive}>{freq}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.segmentButtonInactive}>
                  <Text style={styles.segmentText}>{freq}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );

  const renderCard2 = () => (
    <BlurView intensity={40} tint="light" style={[styles.card, isDesktop && { flex: 1 }, { overflow: Platform.OS === 'web' ? 'visible' : 'hidden', zIndex: 10 }]}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="calculator-variant-outline" size={20} color="#006875" />
        <Text style={styles.cardTitle}>Rate & Calculation</Text>
      </View>

      <Text style={styles.label}>CALCULATION METHOD</Text>
      
      <View style={styles.radioGroup}>
        {[
          { title: 'Fixed Rate', sub: 'Standard monthly fee' },
          { title: 'Metered/Consumption', sub: 'Based on usage units' }
        ].map((method, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.radioRow}
            onPress={() => setCalcMethod(method.title)}
          >
            <View style={styles.radioCircle}>
              {calcMethod === method.title && <View style={styles.radioDot} />}
            </View>
            <View>
              <Text style={styles.radioTitle}>{method.title}</Text>
              <Text style={styles.radioSub}>{method.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {calcMethod === 'Fixed Rate' ? (
        <>
          <Text style={styles.label}>BASE RATE</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput 
              style={styles.inputWithIcon} 
              placeholder="0.00" 
              placeholderTextColor="#849495"
              keyboardType="numeric"
              value={baseRate}
              onChangeText={setBaseRate}
            />
          </View>
        </>
      ) : (
        <View>
          <Text style={styles.label}>RATE PER UNIT / TYPE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.inputContainer, { flex: 1, marginBottom: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 }]}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput 
                style={styles.inputWithIcon} 
                placeholder="0.00" 
                placeholderTextColor="#849495"
                keyboardType="numeric"
                value={baseRate}
                onChangeText={setBaseRate}
              />
            </View>
            
            {isDesktop ? (
              <View style={{ flex: 1.5, flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginLeft: 16 }}>
                {['kWh', 'Liters', 'kL', 'Units', 'SqFt', 'Gallons'].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      backgroundColor: unitType === unit ? '#006875' : 'rgba(255, 255, 255, 0.5)',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: unitType === unit ? '#006875' : 'rgba(255, 255, 255, 0.9)',
                      shadowColor: unitType === unit ? '#006875' : '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: unitType === unit ? 0.2 : 0.05,
                      shadowRadius: 3,
                      elevation: unitType === unit ? 3 : 1,
                    }}
                    onPress={() => setUnitType(unit)}
                    activeOpacity={0.8}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: unitType === unit ? '800' : '600',
                      color: unitType === unit ? '#ffffff' : '#5b6b6d',
                    }}>{unit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={{ width: 100, height: 90, position: 'relative' }}>
                <LinearGradient 
                  colors={['transparent', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.6)', 'transparent']} 
                  locations={[0, 0.22, 0.78, 1]}
                  style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 12 }} 
                />
                
                <LinearGradient 
                  colors={['transparent', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0.9)', 'transparent']} 
                  locations={[0, 0.22, 0.78, 1]}
                  style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 1 }} 
                />

                <LinearGradient 
                  colors={['transparent', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0.9)', 'transparent']} 
                  locations={[0, 0.22, 0.78, 1]}
                  style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 1 }} 
                />

                <ScrollView 
                  ref={unitScrollRef}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  snapToInterval={40}
                  decelerationRate="fast"
                  contentContainerStyle={{ paddingVertical: 25 }}
                  scrollEventThrottle={16}
                  onScroll={(e) => {
                    if (Platform.OS === 'web') {
                      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
                      const y = e.nativeEvent.contentOffset.y;
                      scrollTimeout.current = setTimeout(() => {
                        const index = Math.max(0, Math.round(y / 40));
                        const units = ['kWh', 'Liters', 'kL', 'Units', 'SqFt', 'Gallons'];
                        if(units[index]) {
                          setUnitType(units[index]);
                          unitScrollRef.current?.scrollTo({ y: index * 40, animated: true });
                        }
                      }, 150);
                    }
                  }}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.y / 40);
                    const units = ['kWh', 'Liters', 'kL', 'Units', 'SqFt', 'Gallons'];
                    if(units[index]) setUnitType(units[index]);
                  }}
                >
                  {['kWh', 'Liters', 'kL', 'Units', 'SqFt', 'Gallons'].map((unit, index) => {
                    const isActive = unitType === unit;
                    return (
                      <TouchableOpacity 
                        key={unit} 
                        style={{ height: 40, justifyContent: 'center', alignItems: 'center', width: '100%' }}
                        onPress={() => {
                          setUnitType(unit);
                          unitScrollRef.current?.scrollTo({ y: index * 40, animated: true });
                        }}
                      >
                        <Text style={{ fontSize: isActive ? 16 : 13, fontWeight: isActive ? '700' : '500', color: isActive ? '#006875' : 'rgba(132, 148, 149, 0.4)' }}>{unit}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      )}
    </BlurView>
  );

  const renderCard3 = () => (
    <BlurView intensity={40} tint="light" style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="settings-outline" size={20} color="#006875" />
        <Text style={[styles.cardTitle, { textTransform: 'uppercase', fontSize: 13 }]}>Advanced Logic</Text>
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.settingText}>Apply Sales Tax</Text>
        <Switch 
          value={applySalesTax} 
          onValueChange={setApplySalesTax}
          trackColor={{ false: '#d1d5db', true: '#00F0FF' }}
          thumbColor="#ffffff"
        />
      </View>

      <View style={[styles.rowBetween, { marginTop: 20 }]}>
        <Text style={styles.settingText}>Auto-Carry Forward</Text>
        <Switch 
          value={autoCarryForward} 
          onValueChange={setAutoCarryForward}
          trackColor={{ false: '#d1d5db', true: '#00F0FF' }}
          thumbColor="#ffffff"
        />
      </View>

      <View style={[styles.rowBetween, { marginTop: 24, marginBottom: 24 }]}>
        <Text style={styles.settingText}>Late Fee Rules</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{lateFee || '0'}% / Monthly</Text>
        </View>
      </View>

      <Text style={styles.label}>LATE FEE %</Text>
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.inputWithIcon} 
          placeholder="5" 
          placeholderTextColor="#849495"
          keyboardType="numeric"
          value={lateFee}
          onChangeText={setLateFee}
        />
        <Text style={[styles.currencySymbol, { marginRight: 0, marginLeft: 8 }]}>%</Text>
      </View>
    </BlurView>
  );

  const renderLivePreview = () => (
    <BlurView intensity={40} tint="light" style={[styles.card, isDesktop && { flex: 1 }]}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="card-bulleted-settings-outline" size={20} color="#006875" />
        <Text style={styles.cardTitle}>Dynamic Preview</Text>
      </View>
      <LinearGradient
        colors={['#006875', '#004d56']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.previewCardGradient, isDesktop && { flex: 1 }]}
      >
        <View style={styles.previewHeaderRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.previewCategory}>{chargeCategory} CHARGE</Text>
            <Text style={styles.previewName} numberOfLines={1}>{expenseName || 'Unnamed Charge'}</Text>
          </View>
          <MaterialIcons name="receipt-long" size={28} color="#00f0ff" />
        </View>
        
        <View style={styles.previewDivider} />
        
        <View style={[styles.previewBody, isDesktop && { flex: 1, justifyContent: 'space-evenly', marginTop: 8 }]}>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Billing Cycle</Text>
            <Text style={styles.previewValue}>{billingFrequency}</Text>
          </View>
          
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Calculation</Text>
            <Text style={styles.previewValue}>{calcMethod}</Text>
          </View>
          
          {baseRate ? (
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Rate</Text>
              <Text style={styles.previewValue}>
                ₹{baseRate}{calcMethod === 'Fixed Rate' ? '' : ` / ${unitType}`}
              </Text>
            </View>
          ) : null}
          
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Sales Tax</Text>
            <Text style={styles.previewValue}>{applySalesTax ? 'Apply (18% GST)' : 'Exempt'}</Text>
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Auto-Carry</Text>
            <Text style={styles.previewValue}>{autoCarryForward ? 'Yes' : 'No'}</Text>
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Late Penalty</Text>
            <Text style={styles.previewValue}>{lateFee || '0'}%</Text>
          </View>
        </View>
      </LinearGradient>
    </BlurView>
  );

  const renderActionButtons = (isDesktopLayout = false) => (
    <View style={isDesktopLayout ? styles.desktopActionsRow : styles.mobileActionsContainer}>
      <TouchableOpacity 
        style={[isDesktopLayout ? styles.desktopSubmitButtonWrapper : styles.submitButtonWrapper, isLoading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={isLoading}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#00d4ff', '#0072ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={isDesktopLayout ? styles.desktopSubmitButton : styles.submitButton}
        >
          {isLoading ? (
              <ActivityIndicator color="#fff" />
          ) : (
              <>
                <Text style={isDesktopLayout ? styles.desktopSubmitButtonText : styles.submitButtonText}>
                  {isEditMode ? 'SAVE CHANGES' : 'CREATE CHARGE'}
                </Text>
                <MaterialIcons name="check" size={20} color="#fff" />
              </>
          )}
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={isDesktopLayout ? styles.desktopDraftButton : styles.draftButton}
        activeOpacity={0.7}
        onPress={() => router.back()}
      >
        <Text style={isDesktopLayout ? styles.desktopDraftButtonText : styles.draftButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDesktopShell = () => (
    <View style={styles.desktopShell}>
      <View style={styles.desktopMain}>
          <DesktopNavBar 
            activeTab="Properties" 
            onBack={() => router.back()} 
            backText="Back to Config" 
          />

        <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
          <View style={styles.desktopInner}>
            <View style={styles.desktopHeaderRow}>
              <View style={styles.titleContainer}>
                <Text style={styles.titleLineDesktop}>{isEditMode ? 'Update Charge' : 'New Charge'}</Text>
              </View>
              {renderActionButtons(true)}
            </View>

            <View style={styles.desktopGrid}>
              <View style={styles.desktopLeftColumn}>
                {renderCard1()}
                {renderCard2()}
              </View>
              <View style={styles.desktopRightColumn}>
                {renderCard3()}
                {renderLivePreview()}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );

  if (isDesktop) {
    return (
      <LinearGradient
        colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {renderDesktopShell()}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={[]}>
        {/* Pinned Glassy Header */}
        <View style={styles.headerContainer}>
          <BlurView intensity={45} tint="light" style={StyleSheet.absoluteFillObject} />
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={22} color="#0b1c30" />
            </TouchableOpacity>
            <View style={styles.titleWrapper}>
              <Text style={styles.compactTitleText}>{isEditMode ? 'Update Charge' : 'New Charge'}</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <Animated.ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: 86 }]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Hero Titles */}
          <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
            <Text style={styles.titleLine}>{isEditMode ? 'Update' : 'New'}</Text>
            <Text style={styles.titleLine}>Charge</Text>
          </Animated.View>

          {renderCard1()}
          {renderCard2()}
          {renderCard3()}
          {renderLivePreview()}
          {renderActionButtons(false)}

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
  compactTitleText: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#0b1c30',
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
    shadowColor: '#006677',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 120,
  },
  titleContainer: {
    marginBottom: 24,
  },
  titleLine: {
    fontSize: 48,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 52,
    letterSpacing: -1,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    boxShadow: '0px 10px 30px rgba(0, 104, 117, 0.05)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#006875',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5b6b6d',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    fontSize: 15,
    color: '#151d1e',
    flex: 1,
  },
  inputText: {
    fontSize: 15,
    color: '#151d1e',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
    marginTop: 4,
  },
  segmentButtonWrapper: {
    flex: 1,
  },
  segmentButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonInactive: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#151d1e',
  },
  segmentTextActive: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  radioGroup: {
    marginBottom: 24,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#006875',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#006875',
  },
  radioTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#151d1e',
  },
  radioSub: {
    fontSize: 13,
    color: '#849495',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6b7a7d',
    marginRight: 8,
  },
  inputWithIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#151d1e',
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#151d1e',
  },
  badge: {
    backgroundColor: '#e6fcfd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006875',
  },
  // Dynamic Preview Styles
  previewCardGradient: {
    borderRadius: 16,
    padding: 24,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  previewCategory: {
    color: '#00f0ff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  previewName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  previewDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 20,
  },
  previewBody: {
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  previewValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  // Mobile actions
  mobileActionsContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  submitButtonWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    width: '100%',
    marginBottom: 16,
  },
  submitButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  draftButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  draftButtonText: {
    color: '#151d1e',
    fontSize: 14,
    fontWeight: '700',
  },
  // Desktop specific shell & grids
  desktopShell: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopMain: {
    flex: 1,
    height: '100%',
  },
  topbar: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  topbarTabs: {
    flexDirection: 'row',
    gap: 32,
  },
  topbarTab: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7a7d',
  },
  topbarTabActive: {
    color: '#006875',
    fontWeight: '800',
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  backButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  backButtonTextDesktop: {
    fontSize: 13,
    fontWeight: '700',
    color: '#151d1e',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#006875',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  desktopContent: {
    paddingBottom: 80,
  },
  desktopInner: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  desktopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  titleLineDesktop: {
    fontSize: 32,
    fontWeight: '800',
    color: '#151d1e',
  },
  desktopActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  desktopSubmitButtonWrapper: {
    borderRadius: 23,
    overflow: 'hidden',
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  desktopSubmitButton: {
    height: 46,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  desktopSubmitButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  desktopDraftButton: {
    height: 46,
    paddingHorizontal: 24,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#006875',
    backgroundColor: 'transparent',
  },
  desktopDraftButtonText: {
    color: '#006875',
    fontSize: 13,
    fontWeight: '800',
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  desktopLeftColumn: {
    flex: 1.2,
    gap: 24,
  },
  desktopRightColumn: {
    flex: 1,
    gap: 24,
  },
});
