import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated
} from 'react-native';
import { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '../theme/Theme';
import { getProperty } from '../api/property.api';
import { getFloorSummaries, FloorSummaryResponse } from '../api/unit.api';
import { useFocusEffect } from 'expo-router';

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
  const [propertyName, setPropertyName] = useState('Loading...');
  const [floors, setFloors] = useState<FloorSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalFloorsFromProperty, setTotalFloorsFromProperty] = useState<number | undefined>(undefined);
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

  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [propertyId])
  );

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const property = await getProperty(propertyId, userToken);
      setPropertyName(property.name);
      setTotalFloorsFromProperty(property.totalFloors);

      const floorData = await getFloorSummaries(propertyId, userToken, property.totalFloors);
      setFloors([...floorData].sort((a, b) => b.floorNumber - a.floorNumber));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

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

  const renderFloorCard = (floor: FloorSummaryResponse) => (
    <BlurView key={floor.floorNumber} intensity={60} tint="light" style={styles.floorCard}>
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
            <MaterialIcons name="edit" size={18} color="#006875" />
            <Text style={styles.editButtonText}>Edit Layout</Text>
          </View>
        ) : (
          <LinearGradient
            colors={['#00d4ff', '#0072ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.configureButton}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.configureButtonText}>Configure</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    </BlurView>
  );

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
          </TouchableOpacity>
          <Animated.View style={[styles.compactTitleContainer, { opacity: headerOpacity }]}>
            <Text style={styles.compactTitleText}>Floor Overview</Text>
          </Animated.View>
        </View>

        <Animated.ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#006875" />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          <Animated.View style={[styles.largeTitleContainer, { opacity: largeTitleOpacity }]}>
            <Text style={styles.titleLine}>Floor</Text>
            <Text style={styles.titleLine}>Overview</Text>
            <View style={styles.propertyBadge}>
              <View style={styles.propertyIconWrapper}>
                <MaterialIcons name="business" size={14} color="#fff" />
              </View>
              <Text style={styles.propertyNameLabel}>{propertyName}</Text>
            </View>
          </Animated.View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#006875" style={{ marginTop: 40 }} />
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

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
  titleContainer: {},
  titleLine: {
    fontSize: 48,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 52,
    letterSpacing: -1,
  },
  propertyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    paddingRight: 16,
    paddingLeft: 6,
    paddingVertical: 6,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.1)',
  },
  propertyIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#006875',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  propertyNameLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006875',
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 100,
  },
  floorsList: {
    gap: 16,
  },
  floorCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  floorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  floorNumberBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 104, 117, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.1)',
  },
  floorNumberText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#151d1e',
  },
  floorInfo: {
    flex: 1,
  },
  floorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#151d1e',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusConfigured: {
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
  },
  statusNotConfigured: {
    backgroundColor: 'rgba(255, 61, 0, 0.1)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textConfigured: {
    color: '#00c853',
  },
  textNotConfigured: {
    color: '#ff3d00',
  },
  unitCountText: {
    fontSize: 14,
    color: '#6b7a7d',
  },
  actionButtonWrapper: {
    width: '100%',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 104, 117, 0.05)',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.1)',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006875',
  },
  configureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  configureButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
});
