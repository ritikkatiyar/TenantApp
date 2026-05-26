import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { getActiveChargesForProperty, deactivateChargeConfig, ChargeConfigResponse } from '../api/charge.api';

export default function ExpenseConfigurationScreen({ token }: { token: string | null }) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  
  const [charges, setCharges] = useState<ChargeConfigResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCharges = React.useCallback(async () => {
    if (!token || !propertyId) return;
    try {
      setIsLoading(true);
      const data = await getActiveChargesForProperty(propertyId as string, token);
      setCharges(data);
    } catch (e: any) {
      Alert.alert("Error", "Failed to load charges");
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, token]);

  useFocusEffect(
    React.useCallback(() => {
      loadCharges();
    }, [loadCharges])
  );

  const getIconData = (name: string, category: string) => {
    const n = name.toLowerCase();
    const c = category.toLowerCase();
    if (n.includes('elect') || n.includes('power')) return { name: 'bolt', bg: '#cffafe', color: '#0891b2' }; 
    if (n.includes('water')) return { name: 'water-drop', bg: '#e0e7ff', color: '#4f46e5' }; 
    if (n.includes('maintain') || n.includes('facility') || c.includes('service')) return { name: 'build', bg: '#fee2e2', color: '#dc2626' }; 
    if (n.includes('security') || c.includes('operation')) return { name: 'security', bg: '#ccfbf1', color: '#0d9488' }; 
    return { name: 'receipt-long', bg: '#f3f4f6', color: '#4b5563' }; 
  };

  const formatEnum = (val: string) => {
    if (!val) return '';
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase().replace('_', ' ');
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete Charge", "Are you sure you want to delete this charge configuration? It will not affect past billing cycles, but will no longer be applied to future cycles.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive",
        onPress: async () => {
          if (!token) return;
          try {
            await deactivateChargeConfig(id, token);
            loadCharges();
          } catch (e: any) {
             Alert.alert("Error", e.message || "Failed to delete");
          }
        }
      }
    ]);
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
            <Text style={styles.compactTitleText}>Charge Configuration</Text>
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
            <Text style={styles.mainTitle}>Charge{'\n'}Configuration</Text>
            <Text style={styles.subTitle}>Manage global property overheads and billing logic.</Text>
          </Animated.View>

          <Text style={styles.sectionHeader}>Active Definitions ({(charges || []).length})</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="#006875" style={{ marginTop: 40 }} />
          ) : (charges || []).length === 0 ? (
            <BlurView intensity={60} tint="light" style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="receipt-long" size={36} color="#6b7a7d" />
              </View>
              <Text style={styles.emptyTitle}>No charges found.</Text>
              <Text style={styles.emptySubtitle}>
                Start tracking your overheads by adding your first charge category.
              </Text>
              
              <TouchableOpacity 
                style={styles.createPropertyButton} 
                activeOpacity={0.8}
                onPress={() => router.push(`/create-expense?propertyId=${propertyId}`)}
              >
                <LinearGradient
                  colors={['#00d4ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createPropertyGradient}
                >
                  <MaterialIcons name="add" size={24} color="#fff" />
                  <Text style={styles.createPropertyText}>CREATE CHARGE</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.learnMoreContainer}>
                <MaterialIcons name="help-outline" size={16} color="#006875" />
                <Text style={styles.learnMoreText}>LEARN ABOUT CHARGE TRACKING</Text>
              </TouchableOpacity>
            </BlurView>
          ) : (
            (charges || []).map(charge => {
              const iconObj = getIconData(charge.chargeName, charge.chargeCategory);
              return (
                <TouchableOpacity 
                  key={charge.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    router.push(`/create-expense?propertyId=${propertyId}&chargeId=${charge.id}`);
                  }}
                >
                  <BlurView intensity={60} tint="light" style={styles.expenseCard}>
                    <View style={styles.cardHeader}>
                    <View style={[styles.iconWrapper, { backgroundColor: iconObj.bg }]}>
                      <MaterialIcons name={iconObj.name as any} size={24} color={iconObj.color} />
                    </View>
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>{charge.chargeName}</Text>
                      <Text style={styles.cardSub}>
                        {formatEnum(charge.chargeCategory)} • {formatEnum(charge.billingFrequency)}
                      </Text>
                    </View>
                    <View style={styles.cardRight}>
                      <View style={[styles.badge, { backgroundColor: charge.isActive ? '#ccfbf1' : '#fef3c7' }]}>
                         <Text style={[styles.badgeText, { color: charge.isActive ? '#0d9488' : '#d97706' }]}>
                           {charge.isActive ? 'ACTIVE' : 'PENDING'}
                         </Text>
                      </View>
                      <View style={styles.amountContainer}>
                        <Text style={styles.amountBold}>₹{charge.baseRate}</Text>
                        {charge.calculationStrategy === 'METERED' ? <Text style={styles.amountSuffix}>/ {charge.unitType || 'unit'}</Text> : <Text style={styles.amountSuffix}>/ mo</Text>}
                      </View>
                    </View>
                  </View>
                  
                  {/* Subtle Glass Actions Row */}
                  <View style={{ flexDirection: 'row', justifyContent: charge.calculationStrategy === 'METERED' ? 'space-between' : 'flex-end', marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 16 }}>
                    
                    {charge.calculationStrategy === 'METERED' && (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation(); // Prevent opening the edit screen
                          router.push(`/properties/${propertyId}/meter-readings`);
                        }} 
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                      >
                        <MaterialCommunityIcons name="speedometer" size={16} color="#00bcd4" />
                        <Text style={{ color: '#00bcd4', fontSize: 13, fontWeight: '700' }}>Record Readings</Text>
                      </TouchableOpacity>
                    )}

                    {!charge.isSystemRequired ? (
                      <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDelete(charge.id); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="trash-2" size={14} color="#ef4444" />
                        <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>Delete</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={{ color: '#849495', fontSize: 11, fontStyle: 'italic' }}>System Required</Text>
                    )}
                  </View>
                  </BlurView>
                </TouchableOpacity>
              );
            })
          )}

          {/* Dashed Create Button */}
          {(charges || []).length > 0 && !isLoading && (
            <TouchableOpacity 
              style={styles.dashedButton} 
              activeOpacity={0.7}
              onPress={() => router.push(`/create-expense?propertyId=${propertyId}`)}
            >
              <View style={styles.dashedIconCircle}>
                 <MaterialIcons name="add" size={24} color="#00bcd4" />
              </View>
              <Text style={styles.dashedButtonText}>Create New Expense</Text>
            </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom: 120,
  },
  titleContainer: {
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 46,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 15,
    color: '#5b6b6d',
    fontWeight: '400',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '400',
    color: '#849495',
    marginBottom: 20,
  },
  expenseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#cffafe',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#151d1e',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#5b6b6d',
    fontWeight: '500',
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountBold: {
    fontSize: 18,
    fontWeight: '800',
    color: '#151d1e',
  },
  amountSuffix: {
    fontSize: 12,
    color: '#849495',
    fontWeight: '500',
    marginLeft: 4,
  },
  dashedButton: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#67e8f9',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(236, 254, 255, 0.5)',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  dashedIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#67e8f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedButtonText: {
    color: '#0891b2',
    fontSize: 15,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    overflow: 'hidden',
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#151d1e',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6b7a7d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  createPropertyButton: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 25,
    boxShadow: '0px 8px 15px rgba(0, 114, 255, 0.2)',
    elevation: 5,
  },
  createPropertyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  createPropertyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  learnMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  learnMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006875',
    letterSpacing: 0.5,
  }
});
