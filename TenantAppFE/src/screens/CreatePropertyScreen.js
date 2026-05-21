import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated
} from 'react-native';
import { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../theme/Theme';
import { createProperty } from '../api/property.api';

export default function CreatePropertyScreen({ onBack, onSaveAndConfigure, userToken, ownerId }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [landmark, setLandmark] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const [showErrors, setShowErrors] = useState(false);

  const shakeName = useRef(new Animated.Value(0)).current;
  const shakeAddress = useRef(new Animated.Value(0)).current;
  const shakeCity = useRef(new Animated.Value(0)).current;
  const shakeFloors = useRef(new Animated.Value(0)).current;

  const triggerShake = (anim) => {
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, { toValue: 15, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -15, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 15, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -15, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 60, useNativeDriver: true })
    ]).start();
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

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let hasError = false;
    let firstErrorField = null;

    if (!name) { hasError = true; triggerShake(shakeName); if (!firstErrorField) firstErrorField = 'name'; }
    if (!address) { hasError = true; triggerShake(shakeAddress); if (!firstErrorField) firstErrorField = 'address'; }
    if (!city) { hasError = true; triggerShake(shakeCity); if (!firstErrorField) firstErrorField = 'city'; }
    if (!totalFloors || parseInt(totalFloors, 10) < 1) { 
      hasError = true; triggerShake(shakeFloors); if (!firstErrorField) firstErrorField = 'floors'; 
    }

    if (hasError) {
      setShowErrors(true);
      setErrorMsg('Please fill in all required fields properly.');
      
      if (firstErrorField === 'floors') {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      } else {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setShowErrors(false);

    try {
      const property = await createProperty({
        ownerId,
        token: userToken,
        property: {
          name,
          address,
          city,
          landmark
        },
      });

      if (onSaveAndConfigure) {
        onSaveAndConfigure(property.id, parseInt(totalFloors, 10));
      }
    } catch (error) {
      console.error('Create Property Error:', error);
      setErrorMsg(error.message || 'Cannot connect to server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Pinned header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
        </TouchableOpacity>
        <Animated.View style={[styles.compactTitleContainer, { opacity: headerOpacity }]}>
          <Text style={styles.compactTitleText}>Create Property</Text>
        </Animated.View>
      </View>

      {/* KAV wraps only the scrollable form — header stays above it */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <Animated.ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          <Animated.View style={[styles.largeTitleContainer, { opacity: largeTitleOpacity }]}>
            <Text style={styles.titleLine}>Create</Text>
            <Text style={styles.titleLine}>Property</Text>
          </Animated.View>

          {/* Main Content Area — same glass style as Login */}
          <BlurView intensity={60} tint="light" style={styles.cardContainer}>
            <Text style={styles.description}>
              Enter the foundational details to begin configuring the spatial grid and floors for this property.
            </Text>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color={Theme.Colors.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Property Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Property Name</Text>
                <Animated.View style={[
                  styles.inputWrapper,
                  { transform: [{ translateX: shakeName }] }
                ]}>
                  <TextInput
                    style={[
                      styles.input,
                      showErrors && !name ? { borderColor: '#e53935' } : null
                    ]}
                    placeholder="e.g. Apex Tower"
                    placeholderTextColor="#bac9cc"
                    value={name}
                    onChangeText={(val) => { setName(val); setShowErrors(false); setErrorMsg(''); }}
                  />
                </Animated.View>
              </View>

              {/* Address Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <Animated.View style={[
                  styles.inputWrapper,
                  { transform: [{ translateX: shakeAddress }] }
                ]}>
                  <TextInput
                    style={[
                      styles.input,
                      showErrors && !address ? { borderColor: '#e53935' } : null
                    ]}
                    placeholder="e.g. 100 Horizon Boulevard"
                    placeholderTextColor="#bac9cc"
                    value={address}
                    onChangeText={(val) => { setAddress(val); setShowErrors(false); setErrorMsg(''); }}
                  />
                </Animated.View>
              </View>

              {/* City Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>City</Text>
                <Animated.View style={[
                  styles.inputWrapper,
                  { transform: [{ translateX: shakeCity }] }
                ]}>
                  <TextInput
                    style={[
                      styles.input,
                      showErrors && !city ? { borderColor: '#e53935' } : null
                    ]}
                    placeholder="e.g. Bengaluru"
                    placeholderTextColor="#bac9cc"
                    value={city}
                    onChangeText={(val) => { setCity(val); setShowErrors(false); setErrorMsg(''); }}
                  />
                </Animated.View>
              </View>

              {/* Landmark Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Landmark (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Metro Station"
                    placeholderTextColor="#bac9cc"
                    value={landmark}
                    onChangeText={setLandmark}
                  />
                </View>
              </View>

              {/* Total Floors Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Total Floors</Text>
                <Animated.View style={[
                  styles.inputWrapper,
                  { transform: [{ translateX: shakeFloors }] }
                ]}>
                  <TextInput
                    style={[
                      styles.inputWithIconRight,
                      showErrors && (!totalFloors || parseInt(totalFloors, 10) < 1) ? { borderColor: '#e53935' } : null
                    ]}
                    placeholder="0"
                    placeholderTextColor="#bac9cc"
                    value={totalFloors}
                    onChangeText={(val) => { setTotalFloors(val); setShowErrors(false); setErrorMsg(''); }}
                    keyboardType="numeric"
                  />
                  <MaterialIcons name="layers" size={20} color="#bac9cc" style={styles.inputIconRight} />
                </Animated.View>
              </View>

              {/* Action Button - same gradient pill as dashboard CREATE PROPERTY */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSave}
                disabled={loading}
                style={styles.submitButtonWrapper}
              >
                <LinearGradient
                  colors={['#00d4ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>SAVE & CONFIGURE FLOORS</Text>
                      <MaterialIcons name="check" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  largeTitleContainer: {
    marginBottom: 20,
  },
  titleContainer: {
    // tight line height wrap
  },
  titleLine: {
    fontSize: 48,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 52,
    letterSpacing: -1,
  },
  cardContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: Theme.Rounded.lg,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: Theme.Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    overflow: 'hidden',
    marginBottom: 40,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3b494c',
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#151d1e',
    marginBottom: 10,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#151d1e',
  },
  inputWithIconRight: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 48,
    paddingVertical: 14,
    fontSize: 16,
    color: '#151d1e',
  },
  inputIconRight: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  actionContainer: {
    marginTop: 16,
  },
  submitButtonWrapper: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffdad6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: '#ba1a1a',
    marginLeft: 8,
  },
});
