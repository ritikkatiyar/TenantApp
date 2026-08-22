import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  useWindowDimensions,
  TextInput
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { formatErrorMessage } from '@/src/utils/errors';
import { getProperty } from '@/src/features/properties/api/property.api';
import { getFloorSummaries, FloorSummaryResponse, generateBatchUnits } from '@/src/features/properties/api/unit.api';
import { useFocusEffect, useRouter } from 'expo-router';

import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { createStyles } from './FloorListOverviewScreen.styles';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

interface FloorListOverviewScreenProps {
  propertyId: string;
  userToken: string;
  onBack: () => void;
  onEditFloor: (floorNumber: number) => void;
}

export default function FloorListOverviewScreen({ 
  propertyId, 
  userToken, 
  onBack,
  onEditFloor
}: FloorListOverviewScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const router = useRouter();
  const { handleScroll } = useScrollNav();

  const [propertyName, setPropertyName] = useState('Loading...');
  const [floors, setFloors] = useState<FloorSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalFloorsFromProperty, setTotalFloorsFromProperty] = useState<number | undefined>(undefined);
  const [quickCounts, setQuickCounts] = useState<Record<number, string>>({});
  const [quickUnitTypes, setQuickUnitTypes] = useState<Record<number, string>>({});
  const [generatingFloor, setGeneratingFloor] = useState<number | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });


  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const property = await getProperty(propertyId, userToken);
      setPropertyName(property.name);
      setTotalFloorsFromProperty(property.totalFloors);

      const floorData = await getFloorSummaries(propertyId, userToken, property.totalFloors);
      setFloors([...floorData].sort((a, b) => b.floorNumber - a.floorNumber));
    } catch (error: any) {
      Alert.alert('Error', formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [propertyId, userToken]);

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [fetchInitialData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const floorData = await getFloorSummaries(propertyId, userToken, totalFloorsFromProperty);
      setFloors([...floorData].sort((a, b) => b.floorNumber - a.floorNumber));
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickCountChange = (floorNum: number, value: string) => {
    setQuickCounts(prev => ({
      ...prev,
      [floorNum]: value
    }));
  };

  const handleQuickUnitTypeChange = (floorNum: number, value: string) => {
    setQuickUnitTypes(prev => ({
      ...prev,
      [floorNum]: value
    }));
  };

  const handleQuickGenerate = async (floorNum: number) => {
    const countStr = quickCounts[floorNum];
    if (!countStr || parseInt(countStr, 10) < 1) {
      Alert.alert('Validation', 'Please enter a valid number of units.');
      return;
    }

    const count = parseInt(countStr, 10);
    const unitType = quickUnitTypes[floorNum] || 'SINGLE_UNIT';
    setGeneratingFloor(floorNum);

    try {
      await generateBatchUnits(propertyId, {
        totalFloors: 1,
        unitsPerFloor: count,
        startingFloorNumber: floorNum,
        prefix: '',
        capacity: 1,
        unitType: unitType
      }, userToken);

      Alert.alert('Success', `Successfully created ${count} units on Floor ${floorNum}`);
      setQuickCounts(prev => ({
        ...prev,
        [floorNum]: ''
      }));
      onRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate units.');
    } finally {
      setGeneratingFloor(null);
    }
  };



  const renderFloorCard = (floor: FloorSummaryResponse) => (
    <BlurView 
      key={floor.floorNumber} 
      intensity={60} 
      tint="light" 
      style={[
        styles.floorCard, 
        isDesktop && styles.floorCardDesktop
      ]}
    >
      <View style={styles.floorCardHeader}>
        <View style={styles.floorNumberBox}>
          <Text style={styles.floorNumberText}>{floor.floorNumber}</Text>
        </View>
        <View style={styles.floorInfo}>
          <Text style={styles.floorTitle}>
            Floor {floor.floorNumber} {floor.floorNumber === 1 ? '(Ground)' : ''}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, floor.configured ? styles.statusConfigured : styles.statusNotConfigured]}>
              <MaterialIcons 
                name={floor.configured ? "check-circle" : "warning"} 
                size={12} 
                color={floor.configured ? "#00c853" : "#ff3d00"} 
              />
              <Text style={[styles.statusText, floor.configured ? styles.textConfigured : styles.textNotConfigured]}>
                {floor.configured ? 'Configured' : 'Not Configured'}
              </Text>
            </View>
            <Text style={styles.unitCountText}>{floor.unitCount} Units</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        activeOpacity={0.8}
        style={styles.actionButtonWrapper}
        onPress={() => onEditFloor(floor.floorNumber)}
      >
        {floor.configured ? (
          <View style={styles.editButton}>
            <MaterialIcons name="edit" size={18} color={theme.Colors.primary} />
            <Text style={styles.editButtonText}>Edit Layout</Text>
          </View>
        ) : (
          <LinearGradient
            colors={['#00d4ff', '#0072ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.configureButton}
          >
            <MaterialIcons name="gesture" size={20} color={theme.Colors.surfaceContainerLowest} />
            <Text style={styles.configureButtonText}>Draw Layout (Visual Editor)</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>

      {!floor.configured && (
        <View style={styles.quickCreateSection}>
          <Text style={styles.quickCreateTitle}>QUICK CREATE UNITS</Text>
          <View style={styles.quickCreateRow}>
            <View style={{ width: '30%' }}>
              <TextInput
                style={[
                  styles.quickCreateInput,
                  {
                    width: '100%',
                    height: 48,
                    flex: 0,
                    textAlign: 'center',
                    borderRadius: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    paddingHorizontal: 0,
                  }
                ]}
                placeholder="#"
                placeholderTextColor="#bac9cc"
                keyboardType="numeric"
                maxLength={2}
                value={quickCounts[floor.floorNumber] || ''}
                onChangeText={(val) => handleQuickCountChange(floor.floorNumber, val.replace(/[^0-9]/g, ''))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <GlassDropdown
                options={UNIT_TYPE_OPTIONS}
                value={quickUnitTypes[floor.floorNumber] || 'SINGLE_UNIT'}
                onChange={(val) => handleQuickUnitTypeChange(floor.floorNumber, val)}
                placeholder="Unit Type"
                icon="home"
              />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.quickGenerateButton, { marginTop: 12 }]}
            onPress={() => handleQuickGenerate(floor.floorNumber)}
            disabled={generatingFloor === floor.floorNumber}
            activeOpacity={0.8}
          >
            {generatingFloor === floor.floorNumber ? (
              <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
            ) : (
              <>
                <Text style={styles.quickGenerateButtonText}>Generate</Text>
                <MaterialIcons name="flash-on" size={16} color={theme.Colors.surfaceContainerLowest} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </BlurView>
  );

  const DesktopShell = () => (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
        {/* Main Workspace */}
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
                  <Text style={styles.titleLineDesktop}>Floor Overview</Text>
                  <View style={styles.propertyBadge}>
                    <View style={styles.propertyIconWrapper}>
                      <MaterialIcons name="business" size={14} color={theme.Colors.surfaceContainerLowest} />
                    </View>
                    <Text style={styles.propertyNameLabel}>{propertyName}</Text>
                  </View>
                </View>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color={theme.Colors.primary} style={{ marginTop: 40 }} />
              ) : (
                <View style={styles.floorsGridDesktop}>
                  {floors.map(renderFloorCard)}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
    </LinearGradient>
  );

  if (isDesktop) {
    return DesktopShell();
  }

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={[]}>
        {/* Glassy Overlay Header */}
        <View style={styles.headerContainer}>
          <BlurView intensity={45} tint="light" style={StyleSheet.absoluteFillObject} />
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={22} color={theme.Colors.onSurface} />
            </TouchableOpacity>
            <View style={styles.titleWrapper}>
              <Text style={styles.compactTitleText}>Floor Overview</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <Animated.ScrollView 
          style={styles.container}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 76 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.Colors.primary} />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false, listener: handleScroll }
          )}
          scrollEventThrottle={16}
        >
          <Animated.View style={[styles.largeTitleContainer, { opacity: largeTitleOpacity }]}>
            <Text style={styles.titleLine}>Floor</Text>
            <Text style={styles.titleLine}>Overview</Text>
            <View style={styles.propertyBadge}>
              <View style={styles.propertyIconWrapper}>
                <MaterialIcons name="business" size={14} color={theme.Colors.surfaceContainerLowest} />
              </View>
              <Text style={styles.propertyNameLabel}>{propertyName}</Text>
            </View>
          </Animated.View>
          
          {loading ? (
            <ActivityIndicator size="large" color={theme.Colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.floorsList}>
              {floors.map(renderFloorCard)}
            </View>
          )}
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

