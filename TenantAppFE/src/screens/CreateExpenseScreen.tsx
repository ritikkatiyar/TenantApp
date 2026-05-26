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
import { createChargeConfig, updateChargeConfig, getChargeConfigById } from '../api/charge.api';

export default function CreateExpenseScreen({ token }: { token: string | null }) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { propertyId, chargeId } = useLocalSearchParams<{ propertyId: string, chargeId?: string }>();
  const isEditMode = !!chargeId;

  const [expenseName, setExpenseName] = useState('');
  const [billingFrequency, setBillingFrequency] = useState('Monthly');
  const [calcMethod, setCalcMethod] = useState('Fixed Rate');
  const [baseRate, setBaseRate] = useState('');
  const [unitType, setUnitType] = useState('kWh');
  const [applySalesTax, setApplySalesTax] = useState(true);
  const [lateFee, setLateFee] = useState('5');
  const [isLoading, setIsLoading] = useState(false);
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
      
      let uiFreq = 'Monthly';
      if (data.billingFrequency === 'ANNUAL') uiFreq = 'Annual';
      if (data.billingFrequency === 'WEEKLY') uiFreq = 'Weekly';
      setBillingFrequency(uiFreq);

      let uiCalc = 'Fixed Rate';
      if (data.calculationStrategy === 'METERED') uiCalc = 'Metered/Consumption';
      setCalcMethod(uiCalc);

      setBaseRate(data.baseRate.toString());
      setApplySalesTax(data.applySalesTax);
      setLateFee(data.lateFeePercentage ? data.lateFeePercentage.toString() : '');
    } catch(e: any) {
      Alert.alert("Error", "Failed to load charge details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!token) {
        Alert.alert("Error", "Authentication required");
        return;
    }
    if (!propertyId) {
        Alert.alert("Error", "Missing property ID context.");
        return;
    }
    if (!expenseName || !baseRate) {
        Alert.alert("Missing Fields", "Please provide a charge name and base rate.");
        return;
    }

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
            chargeCategory: 'CUSTOM', 
            billingFrequency: freqEnum,
            calculationStrategy: calcStrategyEnum,
            unitType: unitType,
            baseRate: parseFloat(baseRate),
            applySalesTax: applySalesTax,
            lateFeePercentage: lateFee ? parseFloat(lateFee) : null,
        };

        if (isEditMode && chargeId) {
            await updateChargeConfig(chargeId as string, payload, token);
            Alert.alert("Success", "Charge updated successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } else {
            await createChargeConfig(payload, token);
            Alert.alert("Success", "Charge configured successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        }
    } catch (e: any) {
        Alert.alert("Error", e.response?.data?.message || e.message || "Failed to create charge.");
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

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Pinned header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
          </TouchableOpacity>
          <Animated.View style={[styles.compactTitleContainer, { opacity: headerOpacity }]}>
            <Text style={styles.compactTitleText}>{isEditMode ? 'Update Charge' : 'New Charge'}</Text>
          </Animated.View>
        </View>

        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Hero Titles */}
          <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
            <Text style={styles.mainTitle}>{isEditMode ? 'Update' : 'New'}{'\n'}Charge</Text>
          </Animated.View>

          {/* Card 1: Charge Identity */}
          <BlurView intensity={40} tint="light" style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color="#006875" />
              <Text style={styles.cardTitle}>Charge Identity</Text>
            </View>

            <Text style={styles.label}>CHARGE NAME</Text>
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Electricity, Sanitation Servic" 
                placeholderTextColor="#849495"
                value={expenseName}
                onChangeText={setExpenseName}
              />
            </View>

            <Text style={styles.label}>CATEGORY</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputText}>Consumables</Text>
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

          {/* Card 2: Rate & Calculation */}
          <BlurView intensity={40} tint="light" style={styles.card}>
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
                  
                  <View style={{ width: 100, height: 90, position: 'relative' }}>
                    {/* Fading Glass Background */}
                    <LinearGradient 
                      colors={['transparent', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.6)', 'transparent']} 
                      locations={[0, 0.22, 0.78, 1]}
                      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 12 }} 
                    />
                    
                    {/* Left Fading Border Divider */}
                    <LinearGradient 
                      colors={['transparent', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0.9)', 'transparent']} 
                      locations={[0, 0.22, 0.78, 1]}
                      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 1 }} 
                    />

                    {/* Right Fading Border */}
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
                </View>
              </View>
            )}
          </BlurView>

          {/* Card 3: Advanced Logic */}
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

          {/* Action Buttons */}
          <View style={{ marginTop: 8, paddingHorizontal: 16 }}>
            <TouchableOpacity 
              style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                  <ActivityIndicator color="#fff" />
              ) : (
                  <Text style={styles.submitButtonText}>{isEditMode ? 'Update Charge Entity' : 'Create Charge Entity'}</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.draftButton, { alignItems: 'center', marginTop: 8 }]}>
              <Text style={styles.draftButtonText}>Save as Draft</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer to prevent bottom from being cut off */}
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  compactTitleContainer: {
    flex: 1,
    paddingBottom: 16,
  },
  compactTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#151d1e',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 120,
  },
  titleContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#151d1e',
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
  unitText: {
    fontSize: 15,
    color: '#151d1e',
  },
  unitTextBold: {
    fontWeight: '700',
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
  sliderMock: {
    marginTop: 10,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#006875',
    borderRadius: 2,
  },
  sliderThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#006875',
    marginLeft: -8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#151d1e',
  },
  // Removed preview styles
  submitButton: {
    backgroundColor: '#4338ca',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  draftButton: {
    paddingVertical: 8,
  },
  draftButtonText: {
    color: '#151d1e',
    fontSize: 14,
    fontWeight: '600',
  },
  unitPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  unitPillActive: {
    backgroundColor: '#00bcd4',
    borderColor: '#00bcd4',
  },
  unitPillText: {
    fontSize: 12,
    color: '#5b6b6d',
    fontWeight: '600',
  },
  unitPillTextActive: {
    color: '#fff',
  }
});
