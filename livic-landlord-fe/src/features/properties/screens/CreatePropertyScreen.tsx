import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useCreateProperty } from '@/src/features/properties/hooks/useCreateProperty';
import { createStyles } from './CreatePropertyScreen.styles';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

interface CreatePropertyScreenProps {
  onBack?: () => void;
  onSaveAndConfigure?: (propertyId: string, totalFloors?: number) => void;
  userToken: string;
  ownerId?: string | null;
}

export default function CreatePropertyScreen({ onBack, onSaveAndConfigure, userToken, ownerId }: CreatePropertyScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const router = useRouter();

  const { handleScroll } = useScrollNav();

  const {
    name,
    setName,
    address,
    setAddress,
    city,
    setCity,
    landmark,
    setLandmark,
    totalFloors,
    setTotalFloors,
    globalUnitsPerFloor,
    setGlobalUnitsPerFloor,
    globalUnitType,
    setGlobalUnitType,
    loading,
    errorMsg,
    showErrors,
    setShowErrors,
    setErrorMsg,
    shakeName,
    shakeAddress,
    shakeCity,
    shakeFloors,
    handleSave,
  } = useCreateProperty({ userToken, onSaveAndConfigure });

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

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

  const renderSidebarLink = (icon: any, label: string, active: boolean = false, route?: string) => (
    <TouchableOpacity
      style={[styles.sidebarLink, active && styles.sidebarLinkActive]}
      onPress={route ? () => (route === '/command-center' ? onBack?.() : router.push(route as any)) : undefined}
      activeOpacity={route ? 0.75 : 1}
    >
      <MaterialIcons name={icon} size={22} color={active ? theme.Colors.primary : theme.Colors.onSurfaceVariant} />
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
          <MaterialIcons name="error-outline" size={16} color={theme.Colors.error} />
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
                showErrors && !name ? { borderColor: theme.Colors.error } : null
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
                showErrors && !address ? { borderColor: theme.Colors.error } : null
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
                showErrors && !city ? { borderColor: theme.Colors.error } : null
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

        <View style={[styles.row, !isDesktop && { flexDirection: 'column', gap: 0 }]}>
          {/* Total Floors Input */}
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Total Floors</Text>
            <Animated.View style={[
              styles.inputWrapper,
              { transform: [{ translateX: shakeFloors }] }
            ]}>
              <TextInput
                style={[
                  styles.inputWithIconRight,
                  showErrors && (!totalFloors || parseInt(totalFloors, 10) < 1) ? { borderColor: theme.Colors.error } : null
                ]}
                placeholder="0"
                placeholderTextColor="#bac9cc"
                value={totalFloors}
                onChangeText={(val) => { setTotalFloors(val.replace(/[^0-9]/g, '')); setShowErrors(false); setErrorMsg(''); }}
                keyboardType="numeric"
              />
              <MaterialIcons name="layers" size={20} color="#bac9cc" style={styles.inputIconRight} />
            </Animated.View>
          </View>

          {/* Global Units Per Floor Input */}
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Global Units/Floor</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.inputWithIconRight}
                placeholder="Optional"
                placeholderTextColor="#bac9cc"
                value={globalUnitsPerFloor}
                onChangeText={(val) => setGlobalUnitsPerFloor(val.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
              <MaterialIcons name="business" size={20} color="#bac9cc" style={styles.inputIconRight} />
            </View>
          </View>
        </View>

        {globalUnitsPerFloor && parseInt(globalUnitsPerFloor, 10) > 0 ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Unit Layout Class</Text>
            <GlassDropdown
              options={UNIT_TYPE_OPTIONS}
              value={globalUnitType}
              onChange={setGlobalUnitType}
              placeholder="Select layout class..."
              icon="meeting-room"
            />
          </View>
        ) : null}

        {showSubmit ? (
          <TouchableOpacity
            testID="save-button"
            style={[styles.submitButton, loading && { opacity: 0.8 }]}
            activeOpacity={0.85}
            onPress={() => handleSave(scrollViewRef)}
            disabled={loading}
          >
            <LinearGradient
              colors={['#00d4ff', '#0072ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
              ) : (
                <>
                  <Text style={styles.submitText}>BUILD PROPERTY</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={theme.Colors.surfaceContainerLowest} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
      </View>
    </>
  );

  const renderDesktopShell = () => (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.desktopShell}
    >
      {/* Sidebar Panel */}
      <BlurView intensity={30} tint="light" style={styles.sidebar}>
        <View style={styles.sidebarBrand}>
          <Text style={styles.sidebarBrandTitle}>LIVIC</Text>
          <Text style={styles.sidebarBrandSub}>LANDLORD</Text>
        </View>

        <View style={styles.sidebarNav}>
          {renderSidebarLink('business', 'Command Center', true, '/command-center')}
          {renderSidebarLink('receipt-long', 'Finance & Billing', false, '/expenses')}
          {renderSidebarLink('chat', 'AI Concierge', false, '/ai')}
          {renderSidebarLink('settings', 'System Profiles', false, '/settings')}
        </View>

        <View style={styles.sidebarFooter}>
          <TouchableOpacity style={styles.upgradeButton} activeOpacity={0.85}>
            <LinearGradient
              colors={['#ff416c', '#ff4b2b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeGradient}
            >
              <Text style={styles.upgradeText}>UPGRADE PRO</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </BlurView>

      <View style={styles.desktopMain}>
        {/* Top bar tabs */}
        <DesktopNavBar 
          onBack={onBack} 
          backText="Back to CommandCenter" 
          properties={[]}
        />

        <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
          <View style={styles.desktopInner}>
            {/* Header row */}
            <View style={styles.desktopHeaderRow}>
              <View style={styles.largeTitleContainerDesktop}>
                <Text style={styles.titleLineDesktop}>Construct Property Profile</Text>
                <Text style={styles.subtitleDesktop}>Setup your location profiles and pre-allocate floor layout grids</Text>
              </View>

              <TouchableOpacity 
                testID="save-button"
                style={[styles.desktopSaveButtonWrapper, loading && { opacity: 0.8 }]} 
                onPress={() => handleSave(scrollViewRef)}
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
                    <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
                  ) : (
                    <>
                      <Text style={styles.desktopSaveButtonText}>BUILD PROPERTY</Text>
                      <MaterialIcons name="check" size={20} color={theme.Colors.surfaceContainerLowest} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Split panels layout */}
            <View style={styles.desktopFormContainer}>
              <View style={styles.desktopFormLeft}>
                <BlurView intensity={70} tint="light" style={styles.cardContainer}>
                  {renderFormFieldsContent(false)}
                </BlurView>
              </View>

              <View style={styles.desktopFormRight}>
                <BlurView intensity={50} tint="light" style={[styles.cardContainer, { padding: 30, gap: 16 }]}>
                  <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0, 104, 117, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="layers" size={24} color={theme.Colors.primary} />
                  </View>
                  <Text style={{ fontSize: theme.Typography.bodyLg?.fontSize || 18, fontWeight: '800', color: theme.Colors.onSurface }}>Floor & Units Auto-Allocation</Text>
                  <Text style={{ fontSize: theme.Typography.BodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, lineHeight: 20, fontWeight: '500' }}>
                    By providing global units per floor, the builder automatically generates vacant unit blocks for each floor grid. You can manually customize or draw floor maps later in the floor editor.
                  </Text>
                </BlurView>
              </View>
            </View>

          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );

  const renderMobileShell = () => (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Floating Custom Header Bar */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={22} color={theme.Colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.compactTitleContainer}>
            <Text style={styles.compactTitleText}>New Property</Text>
          </View>
        </Animated.View>

        {/* Back Button */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8 }}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={22} color={theme.Colors.onSurface} />
          </TouchableOpacity>

          <TouchableOpacity
            testID="save-button"
            onPress={() => handleSave(scrollViewRef)}
            disabled={loading}
            style={{
              borderRadius: 100,
              overflow: 'hidden',
              shadowColor: theme.Colors.secondary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <LinearGradient
              colors={['#00d4ff', '#0072ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 8, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
              ) : (
                <Text style={{ color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.BodyMedium.fontSize, fontWeight: '800', letterSpacing: 0.5 }}>Save</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
              { useNativeDriver: false, listener: handleScroll }
            )}
            scrollEventThrottle={16}
          >
            <Animated.View style={[styles.largeTitleContainer, { opacity: largeTitleOpacity }]}>
              <Text style={styles.titleLine}>Create</Text>
              <Text style={styles.titleLine}>Property</Text>
            </Animated.View>

            {/* Main Content Area — same glass style as Login */}
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.cardContainer}>
              {renderFormFieldsContent(false)}
            </BlurView>
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );

  return (
    <View style={{ flex: 1 }}>
      {isDesktop ? renderDesktopShell() : renderMobileShell()}
    </View>
  );
}
