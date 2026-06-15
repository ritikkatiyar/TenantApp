import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useState, useRef } from 'react';
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
  Animated,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Theme } from '@/src/theme/Theme';
import { createProperty } from '@/src/features/properties/api/property.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function CreatePropertyScreen({ onBack, onSaveAndConfigure, userToken, ownerId }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const router = useRouter();
  const { user, signOut } = useAuth();

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

  const renderSidebarLink = (icon, label, active = false, route) => (
    <TouchableOpacity
      style={[styles.sidebarLink, active && styles.sidebarLinkActive]}
      onPress={route ? () => (route === '/command-center' ? onBack() : router.push(route)) : undefined}
      activeOpacity={route ? 0.75 : 1}
    >
      <MaterialIcons name={icon} size={22} color={active ? Theme.Colors.primary : Theme.Colors.onSurfaceVariant} />
      <Text style={[styles.sidebarLinkText, active && styles.sidebarLinkTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderFormFieldsContent = (showSubmit = true) => (
    <>
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

        {/* Action Button - mobile only */}
        {showSubmit && (
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
        )}
      </View>
    </>
  );

  const DesktopShell = () => (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.desktopShell}>
        <View style={styles.desktopMain}>
          <BlurView intensity={70} tint="light" style={styles.topbar}>
            <View style={styles.topbarTabs}>
              <TouchableOpacity onPress={() => router.push('/analytics')}><Text style={styles.topbarTab}>Dashboard</Text></TouchableOpacity>
              <TouchableOpacity onPress={onBack}><Text style={[styles.topbarTab, styles.topbarTabActive]}>Properties</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/analytics')}><Text style={styles.topbarTab}>Reports</Text></TouchableOpacity>
            </View>
            <View style={styles.topbarRight}>
              <TouchableOpacity onPress={onBack} style={styles.backButtonDesktop}>
                <MaterialIcons name="arrow-back" size={20} color="#151d1e" />
                <Text style={styles.backButtonTextDesktop}>Back to Properties</Text>
              </TouchableOpacity>
              <View style={styles.avatar}><Text style={styles.avatarText}>{user?.fullName?.[0] || 'A'}</Text></View>
            </View>
          </BlurView>

          <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
            <View style={styles.desktopInner}>
              {/* Full Width Header Row */}
              <View style={styles.desktopHeaderRow}>
                <View style={styles.largeTitleContainer}>
                  <Text style={styles.titleLineDesktop}>Create Property</Text>
                </View>

                {/* Save Changes top-right action button */}
                <TouchableOpacity 
                  style={styles.desktopSaveButtonWrapper} 
                  onPress={handleSave}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#00d4ff', '#0072ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.desktopSaveButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.desktopSaveButtonText}>Save & Configure Floors</Text>
                        <MaterialIcons name="check" size={18} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Two Column Grid */}
              <View style={styles.desktopGrid}>
                {/* Left Column: Basic Information Form */}
                <View style={styles.desktopLeftColumn}>
                  <BlurView intensity={60} tint="light" style={[styles.cardContainer, { flex: 1 }]}>
                    {renderFormFieldsContent(false)}
                  </BlurView>
                </View>

                {/* Right Column: Dynamic Building Stack Preview */}
                <View style={styles.desktopRightColumn}>
                  <BlurView intensity={60} tint="light" style={styles.cardContainer}>
                    <Text style={styles.sectionTitle}>SPATIAL GRID PREVIEW</Text>
                    <View style={styles.desktopBuildingContainer}>
                      {totalFloors && parseInt(totalFloors, 10) > 0 ? (
                        <View style={styles.buildingPreviewWrapper}>
                          <View style={styles.buildingRoof} />
                          <View style={{ maxHeight: 180, width: '100%' }}>
                            <ScrollView 
                              contentContainerStyle={styles.buildingFloorsScroll}
                              showsVerticalScrollIndicator={true}
                              nestedScrollEnabled={true}
                            >
                              {Array.from({ length: Math.min(parseInt(totalFloors, 10), 10) }).map((_, idx, arr) => {
                                const floorNum = arr.length - idx;
                                return (
                                  <View key={floorNum} style={styles.buildingFloorPlate}>
                                    <Text style={styles.buildingFloorText}>Floor {floorNum}</Text>
                                    <View style={styles.buildingFloorWindows}>
                                      <View style={styles.windowSquare} />
                                      <View style={styles.windowSquare} />
                                      <View style={styles.windowSquare} />
                                    </View>
                                  </View>
                                );
                              })}
                              {parseInt(totalFloors, 10) > 10 && (
                                <View style={styles.buildingFloorPlateMore}>
                                  <Text style={styles.buildingFloorTextMore}>+ {parseInt(totalFloors, 10) - 10} more floors</Text>
                                </View>
                              )}
                            </ScrollView>
                          </View>
                          <View style={styles.buildingFoundation} />
                        </View>
                      ) : (
                        <View style={styles.emptyPreviewContainer}>
                          <MaterialIcons name="business" size={48} color="#bac9cc" />
                          <Text style={styles.emptyPreviewText}>Enter details and total floors to visualize property structure</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.previewInfoRow}>
                      <Text style={styles.previewName}>{name || 'New Property'}</Text>
                      <Text style={styles.previewAddress}>
                        {address ? `${address}${city ? `, ${city}` : ''}` : (city ? city : 'No address specified')}
                      </Text>
                      {landmark ? <Text style={styles.previewLandmark}>Landmark: {landmark}</Text> : null}
                    </View>
                  </BlurView>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </LinearGradient>
  );

  if (isDesktop) {
    return <DesktopShell />;
  }

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
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
              {renderFormFieldsContent(true)}
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

  // Desktop layout styles
  desktopShell: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    height: '100%',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    overflow: 'hidden',
  },
  sidebarBrand: {
    marginBottom: 54,
  },
  sidebarBrandTitle: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    color: Theme.Colors.primary,
  },
  sidebarBrandSub: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: Theme.Colors.onSurfaceVariant,
    marginTop: 4,
  },
  sidebarNav: {
    gap: 14,
  },
  sidebarLink: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 18,
    borderRadius: Theme.Rounded.lg,
  },
  sidebarLinkActive: {
    backgroundColor: 'rgba(0, 224, 255, 0.10)',
    borderRightWidth: 4,
    borderRightColor: Theme.Colors.primaryContainer,
  },
  sidebarLinkText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: Theme.Colors.onSurface,
  },
  sidebarLinkTextActive: {
    color: Theme.Colors.primary,
  },
  sidebarFooter: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: Theme.Colors.outlineVariant,
    paddingTop: 28,
    gap: 10,
  },
  upgradeButton: {
    borderRadius: Theme.Rounded.lg,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: Theme.Colors.secondary,
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  upgradeGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  upgradeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  desktopMain: {
    flex: 1,
  },
  topbar: {
    minHeight: 82,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.75)',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    overflow: 'hidden',
  },
  topbarTabs: {
    flexDirection: 'row',
    gap: 34,
    alignItems: 'center',
  },
  topbarTab: {
    fontSize: 18,
    color: Theme.Colors.onSurface,
  },
  topbarTabActive: {
    color: Theme.Colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: Theme.Colors.primaryContainer,
    paddingBottom: 8,
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
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 10,
  },
  backButtonTextDesktop: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151d1e',
  },
  desktopContent: {
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 24,
  },
  desktopInner: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    gap: 24,
  },
  desktopHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  desktopSaveButtonWrapper: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  desktopSaveButton: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  desktopSaveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: 30,
    alignItems: 'stretch',
    width: '100%',
  },
  desktopLeftColumn: {
    flex: 1.2,
    maxWidth: 580,
  },
  desktopRightColumn: {
    flex: 1,
    maxWidth: 480,
    gap: 24,
    marginTop: 0,
  },
  desktopBuildingContainer: {
    height: 260,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewInfoRow: {
    marginTop: 8,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#151d1e',
    marginBottom: 4,
  },
  previewAddress: {
    fontSize: 14,
    color: '#6b7a7d',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    borderColor: Theme.Colors.primaryContainer,
    backgroundColor: Theme.Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },

  // Building Preview Visualizer Styles
  buildingPreviewWrapper: {
    width: '100%',
    maxHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  buildingRoof: {
    width: 120,
    height: 10,
    backgroundColor: '#006875',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginBottom: 2,
  },
  buildingFloorsScroll: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  buildingFloorPlate: {
    width: 140,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#bac9cc',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buildingFloorPlateMore: {
    width: 140,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#bac9cc',
  },
  buildingFloorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#006875',
  },
  buildingFloorTextMore: {
    fontSize: 9,
    color: '#6b7a7d',
    fontWeight: '600',
  },
  buildingFloorWindows: {
    flexDirection: 'row',
    gap: 4,
  },
  windowSquare: {
    width: 8,
    height: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.3)',
    borderRadius: 1,
  },
  buildingFoundation: {
    width: 160,
    height: 8,
    backgroundColor: '#3b494c',
    borderRadius: 2,
    marginTop: 2,
  },
  emptyPreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyPreviewText: {
    fontSize: 12,
    color: '#8e9da0',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
    maxWidth: 220,
  },
  previewLandmark: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#8e9da0',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006875',
    letterSpacing: 1,
    marginBottom: 24,
  },
});
