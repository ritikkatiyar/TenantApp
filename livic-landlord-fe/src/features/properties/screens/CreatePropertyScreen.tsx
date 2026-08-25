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
import ActionButton from '@/src/components/common/inputs/ActionButton';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useResponsive } from '@/src/hooks/useResponsive';
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

  const { isDesktop } = useResponsive();
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
    selectedAmenities,
    toggleAmenity,
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

        {showSubmit ? (
          <ActionButton
            label="BUILD PROPERTY"
            icon="arrow-forward"
            iconPosition="right"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
            onPress={() => handleSave(scrollViewRef)}
          />
        ) : null}
      </View>
    </>
  );

  const renderDesktopContent = () => (
    <View style={styles.desktopInner}>
      {/* Header row */}
      <View style={styles.desktopHeaderRow}>
        <View style={styles.largeTitleContainerDesktop}>
          <Text style={styles.titleLineDesktop}>Construct Property Profile</Text>
          <Text style={styles.subtitleDesktop}>Setup your location profiles and pre-allocate floor layout grids</Text>
        </View>

        <ActionButton
          label="BUILD PROPERTY"
          icon="check"
          iconPosition="right"
          variant="primary"
          size="md"
          loading={loading}
          disabled={loading}
          onPress={() => handleSave(scrollViewRef)}
        />
      </View>

      {/* Split panels layout */}
      <View style={styles.desktopFormContainer}>
        <View style={styles.desktopFormLeft}>
          <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={styles.cardContainer}>
            {renderFormFieldsContent(false)}
          </BlurView>
        </View>

        <View style={styles.desktopFormRight}>
          <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={[styles.cardContainer, { padding: 30, gap: theme.Spacing.md }]}>
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0, 104, 117, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
              <MaterialIcons name="layers" size={24} color={theme.Colors.primary} />
            </View>
            <Text style={{ fontSize: theme.Typography.bodyLg?.fontSize || 18, fontWeight: '800', color: theme.Colors.onSurface }}>Floor & Units Auto-Allocation</Text>
            <Text style={{ fontSize: theme.Typography.bodyMedium.fontSize, color: theme.Colors.onSurfaceVariant, lineHeight: 20, fontWeight: '500' }}>
              By providing global units per floor, the builder automatically generates vacant unit blocks for each floor grid. You can manually customize or draw floor maps later in the floor editor.
            </Text>
          </BlurView>
        </View>
      </View>
    </View>
  );

  const renderMobileContent = () => (
    <View style={styles.container}>
      <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.cardContainer}>
        {renderFormFieldsContent(false)}
      </BlurView>
    </View>
  );

  return (
    <PageShell scrollable keyboardAvoiding edges={isDesktop ? ['top'] : []}>
      {isDesktop ? renderDesktopContent() : renderMobileContent()}
    </PageShell>
  );
}
