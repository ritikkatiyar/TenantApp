import React, { useState, useEffect , useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  useWindowDimensions
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/src/theme/Theme';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { getProperty, updateProperty } from '@/src/features/properties/api/property.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useRouter, Href } from 'expo-router';
import Building3DView from '@/src/features/properties/components/Building3DView';

interface EditPropertyScreenProps {
  propertyId: string;
  userToken: string;
  onBack: () => void;
  onSave: () => void;
  onConfigureFloors: () => void;
}

export default function EditPropertyScreen({ 
  propertyId, 
  userToken, 
  onBack, 
  onSave,
  onConfigureFloors
}: EditPropertyScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [landmark, setLandmark] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetRotationTrigger, setResetRotationTrigger] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    fetchPropertyDetails();
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      const data = await getProperty(propertyId, userToken);
      setName(data.name);
      setAddress(data.address);
      setCity(data.city);
      setLandmark(data.landmark || '');
      setTotalFloors(data.totalFloors?.toString() || '');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch property details');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name || !address || !city || !totalFloors) {
      Alert.alert('Validation', 'Please fill in all required fields (Name, Address, City, Floors).');
      return;
    }

    if (parseInt(totalFloors, 10) < 1) {
      Alert.alert('Validation', 'Property must have at least 1 floor.');
      return;
    }

    setSaving(true);
    try {
      await updateProperty({
        propertyId,
        token: userToken,
        property: { 
          name, 
          address, 
          city, 
          landmark, 
          totalFloors: parseInt(totalFloors, 10) 
        }
      });
      Alert.alert('Success', 'Property updated successfully');
      onSave();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  const renderFormFieldsContent = (showSave = true) => (
    <>
      <Text style={styles.sectionTitle}>BASIC INFORMATION</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>PROPERTY NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lumina Heights"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>ADDRESS</Text>
        <TextInput
          style={styles.input}
          placeholder="Street address"
          value={address}
          onChangeText={setAddress}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>CITY</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. New York"
          value={city}
          onChangeText={setCity}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>LANDMARK (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Near Central Park"
          value={landmark}
          onChangeText={setLandmark}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>TOTAL FLOORS</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputWithIcon}
            placeholder="0"
            value={totalFloors}
            onChangeText={setTotalFloors}
            keyboardType="numeric"
          />
          <MaterialIcons name="layers" size={20} color="#bac9cc" style={styles.inputIcon} />
        </View>
      </View>

      {showSave && (
        <TouchableOpacity 
          style={styles.saveButtonWrapper} 
          onPress={handleUpdate}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#00d4ff', '#0072ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButton}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                <MaterialIcons name="check" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}
    </>
  );

  const renderConfigCardContent = () => (
    <>
      <Text style={styles.sectionTitle}>STRUCTURE & UNITS</Text>
      <TouchableOpacity 
        style={styles.configButton}
        activeOpacity={0.7}
        onPress={onConfigureFloors}
      >
        <View style={styles.configIconWrapper}>
          <MaterialIcons name="layers" size={24} color="#006875" />
        </View>
        <View style={styles.configTextWrapper}>
          <Text style={styles.configTitle}>CONFIGURE FLOORS</Text>
          <Text style={styles.configSubtitle}>Manage floors, units, and layout</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#6b7a7d" />
      </TouchableOpacity>
    </>
  );

  const renderEditCard = () => (
    <BlurView intensity={60} tint="light" style={styles.card}>
      {renderFormFieldsContent(true)}
      <View style={styles.divider} />
      {renderConfigCardContent()}
    </BlurView>
  );

  const renderSidebarLink = (icon: keyof typeof MaterialIcons.glyphMap, label: string, active = false, route?: Href) => (
    <TouchableOpacity
      style={[styles.sidebarLink, active && styles.sidebarLinkActive]}
      onPress={route ? () => (route === '/command-center' ? onBack() : router.push(route)) : undefined}
      activeOpacity={route ? 0.75 : 1}
    >
      <MaterialIcons name={icon} size={22} color={active ? Theme.Colors.primary : Theme.Colors.onSurfaceVariant} />
      <Text style={[styles.sidebarLinkText, active && styles.sidebarLinkTextActive]}>{label}</Text>
    </TouchableOpacity>
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
          <DesktopNavBar 
            activeTab="Properties" 
            onBack={onBack} 
            backText="Back to Portfolio" 
          />

          <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
            <View style={styles.desktopInner}>
              {/* Full Width Header Row */}
              <View style={styles.desktopHeaderRow}>
                <View style={styles.largeTitleContainer}>
                  <Text style={styles.titleLineDesktop}>Edit Property</Text>
                </View>

                {/* Save Changes top-right action button */}
                <TouchableOpacity 
                  style={styles.desktopSaveButtonWrapper} 
                  onPress={handleUpdate}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#00d4ff', '#0072ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.desktopSaveButton}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.desktopSaveButtonText}>Save Changes</Text>
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
                  <BlurView intensity={60} tint="light" style={[styles.card, { flex: 1 }]}>
                    {renderFormFieldsContent(false)}
                  </BlurView>
                </View>

                {/* Right Column: 3D Model Preview & Structure/Units */}
                <View style={styles.desktopRightColumn}>
                  <BlurView intensity={60} tint="light" style={styles.card}>
                    <Text style={styles.sectionTitle}>3D MODEL PREVIEW</Text>
                    <View style={styles.desktopBuildingContainer}>
                      {userToken && (
                        <Building3DView 
                          propertyId={propertyId} 
                          token={userToken} 
                          resetRotationTrigger={resetRotationTrigger}
                          maxContainerHeight={260}
                        />
                      )}
                      <TouchableOpacity 
                        style={styles.resetButtonOverlay}
                        onPress={() => setResetRotationTrigger(prev => prev + 1)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="3d-rotation" size={18} color="#006875" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.previewInfoRow}>
                      <Text style={styles.previewName}>{name || 'Property Preview'}</Text>
                      <Text style={styles.previewAddress}>{address ? `${address}, ${city}` : 'No address set'}</Text>
                    </View>
                  </BlurView>

                  <BlurView intensity={60} tint="light" style={styles.card}>
                    {renderConfigCardContent()}
                  </BlurView>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </LinearGradient>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <ActivityIndicator size="large" color={Theme.Colors.primary} style={styles.loader} />
      </LinearGradient>
    );
  }

  if (isDesktop) {
    return DesktopShell();
  }

  return (
    <LinearGradient 
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={[]}>
        {/* Pinned Glassy Overlay Back Header */}
        <View style={styles.headerContainer}>
          <BlurView intensity={45} tint="light" style={StyleSheet.absoluteFillObject} />
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={22} color="#0b1c30" />
            </TouchableOpacity>
            <View style={styles.titleWrapper}>
              <Text style={styles.compactTitleText}>Edit Property</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <Animated.ScrollView 
            contentContainerStyle={[styles.scrollContent, { paddingTop: 76 }]}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >

            <BlurView intensity={60} tint="light" style={styles.card}>
              <Text style={styles.sectionTitle}>BASIC INFORMATION</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PROPERTY NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Lumina Heights"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Street address"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CITY</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. New York"
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>LANDMARK (OPTIONAL)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Near Central Park"
                  value={landmark}
                  onChangeText={setLandmark}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>TOTAL FLOORS</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="0"
                    value={totalFloors}
                    onChangeText={setTotalFloors}
                    keyboardType="numeric"
                  />
                  <MaterialIcons name="layers" size={20} color="#bac9cc" style={styles.inputIcon} />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.saveButtonWrapper} 
                onPress={handleUpdate}
                disabled={saving}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#00d4ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButton}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                      <MaterialIcons name="check" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>STRUCTURE & UNITS</Text>
              <TouchableOpacity 
                style={styles.configButton}
                activeOpacity={0.7}
                onPress={onConfigureFloors}
              >
                <View style={styles.configIconWrapper}>
                  <MaterialIcons name="layers" size={24} color="#006875" />
                </View>
                <View style={styles.configTextWrapper}>
                  <Text style={styles.configTitle}>CONFIGURE FLOORS</Text>
                  <Text style={styles.configSubtitle}>Manage floors, units, and layout</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#6b7a7d" />
              </TouchableOpacity>
            </BlurView>
          </Animated.ScrollView>
        </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  largeTitleContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  titleContainer: {},
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006875',
    letterSpacing: 1,
    marginBottom: 24,
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
  inputWithIcon: {
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
  inputIcon: {
    position: 'absolute',
    right: 16,
  },
  saveButtonWrapper: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveButton: {
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginVertical: 32,
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  configIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  configTextWrapper: {
    flex: 1,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151d1e',
  },
  configSubtitle: {
    fontSize: 12,
    color: '#6b7a7d',
    marginTop: 2,
  },
  
  // Desktop Layout Styles
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
    borderRadius: 23,
    overflow: 'hidden',
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
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
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  desktopActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    marginTop: 30,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
  },
  desktopCancelButton: {
    paddingHorizontal: 24,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  desktopCancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7a7d',
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
    position: 'relative',
  },
  resetButtonOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 999,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
});
