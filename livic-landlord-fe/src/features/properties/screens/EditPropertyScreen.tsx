import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  useWindowDimensions
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import ActionButton from '@/src/components/common/inputs/ActionButton';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import FloatingBackButton from '@/src/components/common/navigation/FloatingBackButton';
import { useRouter } from 'expo-router';
import Building3DView from '@/src/features/properties/components/Building3DView';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useEditProperty } from '@/src/features/properties/hooks/useEditProperty';
import { createStyles } from './EditPropertyScreen.styles';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

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
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const router = useRouter();
  const { handleScroll } = useScrollNav();
  const insets = useSafeAreaInsets();

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
    selectedAmenities,
    toggleAmenity,
    loading,
    saving,
    hasConfiguredFloor,
    handleUpdate,
  } = useEditProperty({ propertyId, userToken, onBack, onSave });

  const [resetRotationTrigger, setResetRotationTrigger] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const unitTypeDropdownRefDesktop = useRef<any>(null);
  const unitTypeDropdownRefMobile = useRef<any>(null);

  React.useEffect(() => {
    if (globalUnitsPerFloor && parseInt(globalUnitsPerFloor, 10) > 0) {
      const timer = setTimeout(() => {
        if (width >= 900) {
          unitTypeDropdownRefDesktop.current?.open();
        } else {
          unitTypeDropdownRefMobile.current?.open();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [globalUnitsPerFloor, width]);

  const renderSidebarLink = (icon: any, label: string, active: boolean = false, route?: string) => (
    <TouchableOpacity
      style={[styles.sidebarLink, active && styles.sidebarLinkActive]}
      onPress={route ? () => (route === '/command-center' ? onBack() : router.push(route as any)) : undefined}
      activeOpacity={route ? 0.75 : 1}
    >
      <MaterialIcons name={icon} size={22} color={active ? theme.Colors.primary : theme.Colors.onSurfaceVariant} />
      <Text style={[styles.sidebarLinkText, active && styles.sidebarLinkTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

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

      <View style={[styles.row, !isDesktop && { flexDirection: 'column', gap: 0 }]}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>TOTAL FLOORS</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.inputWithIcon}
              placeholder="0"
              value={totalFloors}
              onChangeText={(val) => setTotalFloors(val.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
            <MaterialIcons name="layers" size={20} color="#bac9cc" style={styles.inputIcon} />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>GLOBAL UNITS/FLOOR</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.inputWithIcon, hasConfiguredFloor && { opacity: 0.5, backgroundColor: 'rgba(230, 230, 230, 0.3)' }]}
              placeholder={hasConfiguredFloor ? "Disabled (Units exist)" : "Optional"}
              value={globalUnitsPerFloor}
              onChangeText={(val) => setGlobalUnitsPerFloor(val.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              editable={!hasConfiguredFloor}
            />
            <MaterialIcons name="grid-on" size={20} color="#bac9cc" style={styles.inputIcon} />
          </View>
        </View>

        {globalUnitsPerFloor && parseInt(globalUnitsPerFloor, 10) > 0 && (
          <View style={[styles.inputGroup, { flex: 1.2 }]}>
            <Text style={styles.label}>GLOBAL UNIT TYPE</Text>
            <GlassDropdown
              ref={isDesktop ? unitTypeDropdownRefDesktop : unitTypeDropdownRefMobile}
              options={UNIT_TYPE_OPTIONS}
              value={globalUnitType}
              onChange={setGlobalUnitType}
              placeholder="Select Unit Type"
              icon="home"
            />
          </View>
        )}
      </View>

      {/* Property Amenities Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>PROPERTY AMENITIES</Text>
        <View style={styles.amenitiesContainer}>
          {[
            'High-speed Fiber Wi-Fi',
            'Covered Parking',
            '24/7 Security',
            'Power Backup',
            'Rooftop Pool',
            '24/7 Fitness Center',
            'In-Building Laundry',
            'EV Charger',
            'Elevator',
            'Clubhouse & Lounge'
          ].map((amenity) => {
            const isSelected = selectedAmenities.includes(amenity);
            return (
              <TouchableOpacity
                key={amenity}
                onPress={() => toggleAmenity(amenity)}
                activeOpacity={0.75}
                style={[styles.amenityChip, isSelected && styles.amenityChipSelected]}
              >
                <MaterialIcons
                  name={isSelected ? 'check-circle' : 'add-circle-outline'}
                  size={20}
                  color={isSelected ? theme.Colors.onPrimaryContainer : theme.Colors.onSurfaceVariant}
                />
                <Text style={[styles.amenityChipText, isSelected && styles.amenityChipTextSelected]}>
                  {amenity}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {showSave && (
        <ActionButton
          label="SAVE CHANGES"
          icon="check"
          iconPosition="right"
          variant="primary"
          size="lg"
          fullWidth
          loading={saving}
          disabled={saving}
          onPress={handleUpdate}
          style={{ marginTop: 16 }}
        />
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
          <MaterialIcons name="layers" size={24} color={theme.Colors.primary} />
        </View>
        <View style={styles.configTextWrapper}>
          <Text style={styles.configTitle}>Floor Layout Grid</Text>
          <Text style={styles.configSubtitle}>Assign tenants, draw units, and map layout bounds</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={theme.Colors.onSurfaceVariant} />
      </TouchableOpacity>
    </>
  );

  const DesktopShell = () => (
    <LinearGradient 
      colors={(theme.Colors.backgroundGradient || ['#d4f5f9', '#e8f8fb', '#e2e0fb']) as [string, string, ...string[]]} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.desktopShell}>
        <View style={styles.desktopMain}>


          <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
            <View style={styles.desktopInner}>
              <View style={styles.desktopHeaderRow}>
                <TouchableOpacity
                  onPress={onBack}
                  style={{ marginRight: 14, padding: 8, borderRadius: 12, backgroundColor: theme.Colors.glassFill, borderWidth: 1, borderColor: theme.Colors.glassStroke }}
                  activeOpacity={0.75}
                >
                  <MaterialIcons name="arrow-back" size={20} color={theme.Colors.primary} />
                </TouchableOpacity>
                <View style={styles.largeTitleContainerDesktop}>
                  <Text style={styles.titleLineDesktop}>Modify Property Profile</Text>
                  <Text style={styles.subtitleDesktop}>Configure location profiles and structural maps</Text>
                </View>

                <TouchableOpacity 
                  style={[styles.desktopSaveButtonWrapper, saving && { opacity: 0.8 }]} 
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
                      <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
                    ) : (
                      <>
                        <Text style={styles.desktopSaveButtonText}>SAVE CHANGES</Text>
                        <MaterialIcons name="check" size={20} color={theme.Colors.surfaceContainerLowest} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.desktopFormContainer}>
                <View style={styles.desktopFormLeft}>
                  <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                    {renderFormFieldsContent(false)}
                    <View style={styles.divider} />
                    {renderConfigCardContent()}
                  </BlurView>
                </View>

                <View style={styles.desktopFormRight}>
                  <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.desktop3DPreviewCard}>
                    <Text style={styles.desktopPreviewLabel}>3D ISOMETRIC PREVIEW</Text>
                    
                    <View style={styles.desktop3DContainer}>
                      <Building3DView 
                        propertyId={propertyId}
                        token={userToken}
                        resetRotationTrigger={resetRotationTrigger}
                      />
                      
                      <TouchableOpacity 
                        style={styles.resetButtonOverlay}
                        activeOpacity={0.7}
                        onPress={() => setResetRotationTrigger(prev => prev + 1)}
                      >
                        <MaterialIcons name="refresh" size={18} color={theme.Colors.primary} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.previewInfoRow}>
                      <Text style={styles.previewName}>{name || 'Property Name'}</Text>
                      <Text style={styles.previewAddress}>{address ? `${address}, ${city}` : 'No Address Specified'}</Text>
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

  if (loading) {
    return (
      <LinearGradient 
        colors={(theme.Colors.backgroundGradient || ['#d4f5f9', '#e8f8fb', '#e2e0fb']) as [string, string, ...string[]]} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <ActivityIndicator size="large" color={theme.Colors.primary} style={styles.loader} />
      </LinearGradient>
    );
  }

  if (isDesktop) {
    return DesktopShell();
  }

  return (
    <LinearGradient 
      colors={(theme.Colors.backgroundGradient || ['#d4f5f9', '#e8f8fb', '#e2e0fb']) as [string, string, ...string[]]} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <FloatingBackButton onPress={onBack} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <Animated.ScrollView 
            contentContainerStyle={[styles.scrollContent, { paddingTop: 68 + insets.top }]}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false, listener: handleScroll }
            )}
            scrollEventThrottle={16}
          >
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.card}>
              {renderFormFieldsContent(true)}
              <View style={styles.divider} />
              {renderConfigCardContent()}
            </BlurView>
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
