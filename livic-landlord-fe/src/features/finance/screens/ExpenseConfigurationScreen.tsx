import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { BlurView } from 'expo-blur';
import { 
  getChargesForProperty, 
  deactivateChargeConfig, 
  reactivateChargeConfig, 
  deleteChargeConfigPermanently, 
  ChargeConfigResponse 
} from '@/src/features/finance/api/charge.api';
import { useResponsive } from '@/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useProperties } from '@/src/hooks/useProperties';
import { useToast } from '@/src/components/common/feedback/ToastContext';


export default function ExpenseConfigurationScreen({ token }: { token: string | null }) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();
  const propertyId = paramPropertyId || (properties && properties.length > 0 ? properties[0].id : null);
  const { showToast } = useToast();
  
  const [charges, setCharges] = useState<ChargeConfigResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const requestConfirmation = (title: string, message: string, onConfirm: () => void | Promise<void>) => {
    setConfirmModal({
      visible: true,
      title,
      message,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, visible: false }));
        await onConfirm();
      }
    });
  };

  const loadCharges = React.useCallback(async () => {
    if (!token || !propertyId) return;
    try {
      setIsLoading(true);
      const data = await getChargesForProperty(propertyId, true, token);
      setCharges(data);
    } catch (e: any) {
      console.error(e);
      showToast("Failed to load charges", "error");
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, token]);

  useFocusEffect(
    React.useCallback(() => {
      loadCharges();
    }, [loadCharges])
  );

  useEffect(() => {
    loadCharges();
  }, [loadCharges]);

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

  const handleDeactivate = async (id: string) => {
    const performDeactivate = async () => {
      if (!token) return;
      try {
        await deactivateChargeConfig(id, token);
        showToast("Charge configuration deactivated successfully.", "success");
        loadCharges();
      } catch (e: any) {
        showToast(e.message || "Failed to deactivate", "error");
      }
    };

    if (Platform.OS === 'web') {
      requestConfirmation(
        "Deactivate Charge",
        "Are you sure you want to deactivate this charge configuration? It will not be applied to future billing cycles.",
        performDeactivate
      );
    } else {
      Alert.alert("Deactivate Charge", "Are you sure you want to deactivate this charge configuration? It will not be applied to future billing cycles.", [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Deactivate", 
          style: "destructive",
          onPress: performDeactivate
        }
      ]);
    }
  };

  const handleReactivate = async (id: string) => {
    if (!token) return;
    try {
      await reactivateChargeConfig(id, token);
      showToast("Charge configuration reactivated successfully.", "success");
      loadCharges();
    } catch (e: any) {
      showToast(e.message || "Failed to reactivate", "error");
    }
  };

  const handleDeletePermanently = async (id: string) => {
    const performDelete = async () => {
      if (!token) return;
      try {
        await deleteChargeConfigPermanently(id, token);
        showToast("Charge configuration deleted permanently.", "success");
        loadCharges();
      } catch (e: any) {
        showToast(e.message || "Failed to delete permanently", "error");
      }
    };

    if (Platform.OS === 'web') {
      requestConfirmation(
        "Delete Permanently",
        "Are you sure you want to delete this configuration permanently? This action cannot be undone.",
        performDelete
      );
    } else {
      Alert.alert("Delete Permanently", "Are you sure you want to delete this configuration permanently? This action cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Permanently", 
          style: "destructive",
          onPress: performDelete
        }
      ]);
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
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {/* Pinned header */}
        {isDesktop ? (
          <DesktopNavBar 
            onBack={() => router.push('/expenses')} 
            backText="Back to Finance & Billing" 
            properties={properties || []}
            selectedPropertyId={propertyId}
            onPropertyChange={(id) => router.replace(`/expenses/charge-config?propertyId=${id}`)}
          />
        ) : (
          <View style={styles.headerContainer}>
            <BlurView intensity={45} tint="light" style={StyleSheet.absoluteFillObject} />
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={22} color="#0b1c30" />
              </TouchableOpacity>
              <View style={styles.titleWrapper}>
                <Text style={styles.compactTitleText}>Charge Configuration</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>
          </View>
        )}

        <Animated.ScrollView
          contentContainerStyle={[styles.scrollContent, !isDesktop && { paddingTop: 76 }]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          <View style={isDesktop ? styles.desktopInner : null}>
            {/* Hero Titles - Desktop only; mobile uses glassy header */}
            {isDesktop && (
              <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
                <Text style={styles.titleLineDesktop}>Charge Configuration</Text>
              </Animated.View>
            )}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Active Definitions ({(charges || []).length})</Text>
              {(charges || []).length > 0 && !isLoading && (
                <TouchableOpacity 
                  style={styles.headerAddButtonWrapper}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/create-expense?propertyId=${propertyId}`)}
                >
                  <LinearGradient
                    colors={['#00d4ff', '#0072ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerAddButton}
                  >
                    <Text style={styles.headerAddButtonText}>ADD NEW</Text>
                    <MaterialIcons name="add" size={16} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color="#006875" style={{ marginTop: 40 }} />
            ) : (!properties || properties.length === 0) ? (
              <BlurView intensity={60} tint="light" style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <MaterialIcons name="business" size={36} color="#006875" />
                </View>
                <Text style={styles.emptyTitle}>No Property Created Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Finance & billing setup requires an active property. Create your first property to start configuring charges and rent cycles.
                </Text>
                
                <TouchableOpacity 
                  style={styles.createPropertyButton} 
                  activeOpacity={0.8}
                  onPress={() => router.push('/properties/create')}
                >
                  <LinearGradient
                    colors={['#00d4ff', '#0072ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.createPropertyGradient}
                  >
                    <MaterialIcons name="add" size={24} color="#fff" />
                    <Text style={styles.createPropertyText}>CREATE FIRST PROPERTY</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>
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
              <View style={isDesktop ? styles.gridContainer : styles.listContainer}>
                {(charges || []).map(charge => {
                  const iconObj = getIconData(charge.chargeName, charge.chargeCategory);
                  return (
                    <View 
                      key={charge.id}
                      style={[
                        isDesktop ? styles.gridCardWrapper : styles.listCardWrapper,
                        !charge.isActive && { opacity: 0.7 }
                      ]}
                    >
                      <BlurView intensity={60} tint="light" style={styles.expenseCard}>
                        {/* Upper card area is pressable to edit the config */}
                        <TouchableOpacity 
                          activeOpacity={0.7}
                          onPress={() => {
                            router.push(`/create-expense?propertyId=${propertyId}&chargeId=${charge.id}`);
                          }}
                        >
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
                              <View style={[styles.badge, { backgroundColor: charge.isActive ? '#ccfbf1' : '#fee2e2' }]}>
                                 <Text style={[styles.badgeText, { color: charge.isActive ? '#0d9488' : '#ef4444' }]}>
                                   {charge.isActive ? 'ACTIVE' : 'INACTIVE'}
                                 </Text>
                              </View>
                              {charge.baseRate != null ? (
                                <View style={styles.amountContainer}>
                                  <Text style={styles.amountBold}>₹{charge.baseRate}</Text>
                                  {charge.calculationStrategy === 'METERED' ? (
                                    <Text style={styles.amountSuffix}>/ {charge.unitType || 'unit'}</Text>
                                  ) : (
                                    <Text style={styles.amountSuffix}>/ mo</Text>
                                  )}
                                </View>
                              ) : null}
                            </View>
                          </View>
                        </TouchableOpacity>
                        
                        {/* Actions Row - sibling to the edit pressable (no nesting) */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 16 }}>
                          
                          {charge.calculationStrategy === 'METERED' ? (
                            <TouchableOpacity 
                              onPress={() => {
                                router.push(`/properties/${propertyId}/meter-readings`);
                              }} 
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                            >
                              <MaterialCommunityIcons name="speedometer" size={16} color="#00bcd4" />
                              <Text style={{ color: '#00bcd4', fontSize: 13, fontWeight: '700' }}>Record Readings</Text>
                            </TouchableOpacity>
                          ) : (
                            <View />
                          )}

                          {!charge.isSystemRequired ? (
                            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                              {charge.isActive ? (
                                <TouchableOpacity 
                                  onPress={() => handleDeactivate(charge.id)} 
                                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                >
                                  <Feather name="minus-circle" size={14} color="#ef4444" />
                                  <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>Deactivate</Text>
                                </TouchableOpacity>
                              ) : (
                                <>
                                  <TouchableOpacity 
                                    onPress={() => handleReactivate(charge.id)} 
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                  >
                                    <MaterialIcons name="restore" size={14} color="#006875" />
                                    <Text style={{ color: '#006875', fontSize: 12, fontWeight: '600' }}>Reactivate</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity 
                                    onPress={() => handleDeletePermanently(charge.id)} 
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                  >
                                    <Feather name="trash-2" size={14} color="#ba1a1a" />
                                    <Text style={{ color: '#ba1a1a', fontSize: 12, fontWeight: '600' }}>Delete Permanently</Text>
                                  </TouchableOpacity>
                                </>
                              )}
                            </View>
                          ) : (
                            <Text style={{ color: '#849495', fontSize: 11, fontStyle: 'italic' }}>System Required</Text>
                          )}
                        </View>
                      </BlurView>
                    </View>
                  );
                })}

              </View>
            )}

            {/* Dashed Create Button at Bottom (Mobile) */}
            {!isDesktop && (charges || []).length > 0 && !isLoading && (
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
          </View>
        </Animated.ScrollView>
      </SafeAreaView>

      {/* Custom Confirmation Modal */}
      <Modal visible={confirmModal.visible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} style={StyleSheet.absoluteFillObject} />
          <View style={[styles.modalPopup, { width: 400, padding: 24, borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.8)' }]}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#163235', marginBottom: 12 }}>
              {confirmModal.title}
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7a7d', lineHeight: 20, marginBottom: 24, fontWeight: '500' }}>
              {confirmModal.message}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity 
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 100,
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                }}
                onPress={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#6b7a7d' }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{
                  borderRadius: 100,
                  overflow: 'hidden',
                  shadowColor: '#ef4444',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                onPress={confirmModal.onConfirm}
              >
                <LinearGradient
                  colors={['#ff4b4b', '#dc2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 }}>
                    Confirm
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  desktopBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  desktopBackButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151d1e',
  },
  desktopInner: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
  titleContainer: {
    marginBottom: 32,
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
    letterSpacing: -0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '400',
    color: '#849495',
  },
  headerAddButtonWrapper: {
    borderRadius: 19,
    overflow: 'hidden',
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 18,
  },
  headerAddButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  expenseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
    padding: 20,
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
  },
  desktopHeader: {
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  desktopHeaderInner: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mobileHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  listContainer: {
    flexDirection: 'column',
  },
  gridCardWrapper: {
    width: '48.5%',
    minWidth: 320,
  },
  listCardWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  dashedButtonDesktop: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#67e8f9',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(236, 254, 255, 0.5)',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '48.5%',
    minWidth: 320,
    minHeight: 160,
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  modalPopup: { 
    backgroundColor: '#ffffff', 
    borderRadius: 24, 
    padding: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 20, 
    elevation: 10 
  },
});
