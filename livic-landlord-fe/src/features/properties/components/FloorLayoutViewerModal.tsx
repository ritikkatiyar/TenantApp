import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator, 
  Platform, 
  useWindowDimensions, 
  TextInput, 
  Alert, 
  Keyboard,
  ScrollView as RNScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  FadeInUp,
  FadeOutDown
} from 'react-native-reanimated';
import { getFloorLayout, UnitResponse, ActiveLeaseSummary } from '@/src/features/properties/api/unit.api';
import { createLease, terminateLease } from '@/src/features/tenant/api/lease.api';
import { searchUserByPhone, quickCreateTenant, UserSearchResponse } from '@/src/features/auth/api/user.api';
import { Theme } from '@/src/theme/Theme';
import { logger } from '@/src/utils/logger';
import { formatErrorMessage } from '@/src/utils/errors';

const GRID_SIZE_X = 10;
const GRID_SIZE_Y = 15;
const CELL_SIZE = 60;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

const normalizeUnitType = (typeVal: string | undefined): string => {
  if (!typeVal) return 'ONE_BHK';
  const upperVal = typeVal.toUpperCase();
  if (['ONE_BHK', 'TWO_BHK', 'STUDIO', 'SINGLE_UNIT', 'SHARED_UNIT'].includes(upperVal)) {
    return upperVal;
  }
  if (typeVal === '1 BHK') return 'ONE_BHK';
  if (typeVal === '2 BHK') return 'TWO_BHK';
  if (typeVal === 'Studio Apartment') return 'STUDIO';
  if (typeVal === 'Single Unit') return 'SINGLE_UNIT';
  if (typeVal === 'Shared Unit') return 'SHARED_UNIT';
  return 'ONE_BHK';
};

interface UnitBlock {
  id: string; 
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  unitNumber: string;
  rent?: string;
  tenants?: string[];
  status?: 'VACANT' | 'OCCUPIED';
  capacity?: number;
  activeLeases?: ActiveLeaseSummary[];
  tenantUserId?: string;
  tenantPhone?: string | null;
  activeLeaseId?: string;
  type?: string;
}

interface FloorLayoutViewerModalProps {
  visible: boolean;
  propertyId: string;
  floorNumber: number;
  token: string;
  onClose: () => void;
}

export default function FloorLayoutViewerModal({ visible, propertyId, floorNumber, token, onClose }: FloorLayoutViewerModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = windowWidth >= 900;
  
  const [blocks, setBlocks] = useState<UnitBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  // Tenant configuration & search states
  const [tenantPhoneSearch, setTenantPhoneSearch] = useState('');
  const [tenantSearchResult, setTenantSearchResult] = useState<UserSearchResponse | null>(null);
  const [tenantSearchLoading, setTenantSearchLoading] = useState(false);
  const [tenantAssigning, setTenantAssigning] = useState(false);
  const [rentAmount, setRentAmount] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [tenantSearchError, setTenantSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<UserSearchResponse[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [isCreatingNewTenant, setIsCreatingNewTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [tenantCreating, setTenantCreating] = useState(false);
  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Pan & Zoom values
  const scale = useSharedValue(0.7);
  const savedScale = useSharedValue(0.7);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const desktopGridWrapperRef = useRef<any>(null);
  const sheetScrollRef = useRef<RNScrollView | null>(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (visible && propertyId && token) {
      fetchLayout();
    } else {
      setBlocks([]);
      setSelectedUnitId(null);
      resetTenantAssignmentForm();
    }
  }, [visible, propertyId, floorNumber, token]);

  // Debounce user search suggestions
  useEffect(() => {
    const query = tenantPhoneSearch.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const results = await searchUserByPhone(query, token);
        setSuggestions(results || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [tenantPhoneSearch, token]);

  const fetchLayout = async () => {
    setLoading(true);
    try {
      const units = await getFloorLayout(propertyId, floorNumber, token);
      const mappedBlocks: UnitBlock[] = units.map(u => {
        const leases = u.activeLeases || [];
        const primaryLease = leases[0] || null;
        return {
          id: u.id,
          gridX: u.gridX,
          gridY: u.gridY,
          gridWidth: u.gridWidth,
          gridHeight: u.gridHeight,
          unitNumber: u.unitNumber,
          rent: primaryLease ? Math.round(primaryLease.rentAmount * u.capacity).toString() : undefined,
          tenants: leases.map(l => l.tenantName).filter(Boolean) as string[],
          status: leases.length > 0 ? 'OCCUPIED' : 'VACANT',
          capacity: u.capacity,
          activeLeases: leases,
          tenantUserId: primaryLease ? primaryLease.tenantUserId : undefined,
          tenantPhone: primaryLease ? primaryLease.tenantPhone : undefined,
          activeLeaseId: primaryLease ? primaryLease.leaseId : undefined,
          type: normalizeUnitType(u.type),
        };
      });
      setBlocks(mappedBlocks);
    } catch (error) {
      logger.warn('Error fetching layout:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetTenantAssignmentForm = () => {
    setTenantPhoneSearch('');
    setTenantSearchResult(null);
    setTenantSearchError(null);
    setSuggestions([]);
    setIsCreatingNewTenant(false);
    setNewTenantName('');
    setNewTenantEmail('');
    setRentAmount('');
    setSecurityDeposit('');
    setParentScrollEnabled(true);
  };

  const updateUnitDetails = (id: string, updates: Partial<UnitBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const handleSearchTenant = async () => {
    const phone = tenantPhoneSearch.trim();
    if (!phone) {
      setTenantSearchError('Enter a phone number to search.');
      return;
    }

    const selectedBlock = blocks.find(b => b.id === selectedUnitId);
    if (!selectedBlock) return;

    if (!selectedBlock.capacity || selectedBlock.capacity <= 0) {
      setTenantSearchError('Unit capacity must be at least 1.');
      return;
    }

    setTenantSearchLoading(true);
    setTenantSearchError(null);
    setTenantSearchResult(null);
    try {
      const users = await searchUserByPhone(phone, token);
      if (!users || users.length === 0) {
        setTenantSearchError('Tenant not found with this number.');
        return;
      }
      const exactMatch = users.find(u => u.phoneNumber === phone) || users[0];
      setTenantSearchResult(exactMatch);
      setTenantPhoneSearch(exactMatch.phoneNumber || '');
      setSuggestions([]);
    } catch (error: any) {
      logger.error('[Search Tenant Error]', error);
      setTenantSearchError(formatErrorMessage(error));
    } finally {
      setTenantSearchLoading(false);
    }
  };

  const handleCreateAndSelectTenant = async () => {
    const name = newTenantName.trim();
    const email = newTenantEmail.trim();
    const phone = tenantPhoneSearch.trim();

    if (!name) {
      setTenantSearchError('Enter the tenant\'s full name.');
      return;
    }
    if (!email) {
      setTenantSearchError('Enter the tenant\'s email address.');
      return;
    }
    if (!phone || phone.length < 10) {
      setTenantSearchError('Valid 10-digit phone number is required.');
      return;
    }

    setTenantCreating(true);
    setTenantSearchError(null);
    try {
      const createdUser = await quickCreateTenant({ email, fullName: name, phoneNumber: phone }, token);
      setTenantSearchResult(createdUser);
      setTenantPhoneSearch(createdUser.phoneNumber || '');
      setIsCreatingNewTenant(false);
      setNewTenantName('');
      setNewTenantEmail('');
      setSuggestions([]);
      
      await handleAssignTenant(createdUser);
    } catch (error: any) {
      logger.error('[Create Tenant Error]', error);
      setTenantSearchError(formatErrorMessage(error));
    } finally {
      setTenantCreating(false);
    }
  };

  const handleAssignTenant = async (userToAssign?: UserSearchResponse | any) => {
    const selectedBlock = blocks.find(b => b.id === selectedUnitId);
    const targetUser = (userToAssign && userToAssign.id) ? userToAssign : tenantSearchResult;
    if (!selectedBlock || !targetUser) return;

    const totalDeposit = Number(securityDeposit || '0');
    const totalRent = Number(rentAmount || '0');

    setTenantAssigning(true);
    setTenantSearchError(null);
    try {
      const capacity = selectedBlock.capacity || 1;
      const depositAmount = Math.round(totalDeposit / capacity);
      const leaseRentAmount = Math.round(totalRent / capacity);

      const today = new Date().toISOString().slice(0, 10);
      const payload = {
        userId: targetUser.id,
        unitId: selectedBlock.id,
        monthlyRentAmount: leaseRentAmount,
        securityDeposit: depositAmount,
        splitStrategy: 'FULL_UNIT' as const,
        moveInDate: today,
        status: 'ACTIVE' as const,
      };

      const lease = await createLease(payload, token);

      updateUnitDetails(selectedBlock.id, {
        tenants: [...(selectedBlock.tenants || []), targetUser.fullName],
        tenantUserId: targetUser.id,
        tenantPhone: targetUser.phoneNumber,
        activeLeaseId: lease.id,
        status: 'OCCUPIED',
        rent: totalRent.toString(),
        activeLeases: [
          ...(selectedBlock.activeLeases || []),
          {
            leaseId: lease.id,
            tenantUserId: targetUser.id,
            tenantName: targetUser.fullName,
            tenantPhone: targetUser.phoneNumber,
            rentAmount: lease.rentAmount,
            status: 'ACTIVE',
          }
        ]
      });

      const assignedName = targetUser.fullName;
      resetTenantAssignmentForm();
      Alert.alert('Success', `${assignedName} has been assigned to Unit ${selectedBlock.unitNumber}.`);
    } catch (error: any) {
      logger.error('[Assign Tenant Error]', error);
      setTenantSearchError(formatErrorMessage(error));
    } finally {
      setTenantAssigning(false);
    }
  };

  const handleRemoveTenant = async (leaseId: string, tenantName?: string | null) => {
    const selectedBlock = blocks.find(b => b.id === selectedUnitId);
    if (!selectedBlock) return;
    const displayName = tenantName || 'this tenant';
    
    Alert.alert(
      'Remove Tenant',
      `Are you sure you want to remove ${displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await terminateLease(leaseId, token);

              const remainingLeases = (selectedBlock.activeLeases || []).filter(l => l.leaseId !== leaseId);
              const remainingTenants = (selectedBlock.tenants || []).filter(name => name !== tenantName);
              
              updateUnitDetails(selectedBlock.id, {
                tenants: remainingTenants,
                activeLeases: remainingLeases,
                activeLeaseId: remainingLeases[0]?.leaseId || undefined,
                tenantUserId: remainingLeases[0]?.tenantUserId || undefined,
                tenantPhone: remainingLeases[0]?.tenantPhone || undefined,
                rent: remainingLeases[0] ? Math.round(remainingLeases[0].rentAmount * (selectedBlock.capacity || 1)).toString() : undefined,
                status: remainingLeases.length > 0 ? 'OCCUPIED' : 'VACANT',
              });

              Alert.alert('Removed', `${displayName} has been removed from Unit ${selectedBlock.unitNumber}.`);
            } catch (error: any) {
              logger.error('[Remove Tenant Error]', error);
              Alert.alert('Error', formatErrorMessage(error));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Pinch / Zoom Gestures
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(newScale, 0.3), 3.0);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedGridStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateX: withTiming('60deg', { duration: 400 }) },
      { rotateZ: withTiming('-45deg', { duration: 400 }) },
      { scale: scale.value }
    ],
  }));

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      const zoomIntensity = 0.05;
      const delta = -e.deltaY;
      const factor = delta > 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);
      const newScale = scale.value * factor;
      scale.value = Math.min(Math.max(newScale, 0.3), 3.0);
      savedScale.value = scale.value;
    };

    const desktopElement = desktopGridWrapperRef.current;
    if (desktopElement) {
      desktopElement.addEventListener('wheel', handleWheelEvent, { passive: false });
    }
    return () => {
      if (desktopElement) {
        desktopElement.removeEventListener('wheel', handleWheelEvent);
      }
    };
  }, [visible]);

  const getBlockColorStyles = (b: UnitBlock) => {
    const activeCount = b.activeLeases ? b.activeLeases.length : 0;
    const capacity = b.capacity || 1;

    if (activeCount === 0) {
      return {
        backgroundColor: '#43a047',
        borderColor: '#2e7d32',
        textColor: '#ffffff',
        accentColor: '#c8e6c9'
      };
    } else if (activeCount < capacity) {
      return {
        backgroundColor: '#fb8c00',
        borderColor: '#e65100',
        textColor: '#ffffff',
        accentColor: '#fff3e0'
      };
    } else {
      return {
        backgroundColor: '#e53935',
        borderColor: '#b71c1c',
        textColor: '#ffffff',
        accentColor: '#ffcdd2'
      };
    }
  };

  const selectedBlock = blocks.find(b => b.id === selectedUnitId);

  const renderGrid = () => {
    const rows = [];
    for (let y = 0; y < GRID_SIZE_Y; y++) {
      const cols = [];
      for (let x = 0; x < GRID_SIZE_X; x++) {
        const block = blocks.find(b => b.gridX === x && b.gridY === y);

        cols.push(
          <View
            key={`${x}-${y}`}
            style={[
              styles.cell,
              styles.cellEmpty
            ]}
            pointerEvents="box-none"
          >
            {block && (() => {
              const colorStyles = getBlockColorStyles(block);
              const isSelected = selectedUnitId === block.id;
              const activeCount = block.activeLeases ? block.activeLeases.length : 0;
              const cap = block.capacity || 1;
              const isVacant = activeCount === 0;

              return (
                <View
                  style={{
                    position: 'absolute',
                    top: -1, 
                    left: -1, 
                    width: block.gridWidth * CELL_SIZE,
                    height: block.gridHeight * CELL_SIZE,
                    zIndex: isSelected ? 50 : 10,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedUnitId(block.id);
                      resetTenantAssignmentForm();
                    }}
                    style={[
                      styles.cellActive, 
                      { 
                        width: '100%', 
                        height: '100%',
                        backgroundColor: colorStyles.backgroundColor,
                        borderColor: isSelected ? '#00e5ff' : colorStyles.borderColor,
                        borderWidth: isSelected ? 3 : 2,
                        justifyContent: 'space-between',
                        paddingVertical: block.gridHeight >= 2 ? 6 : 2,
                        paddingHorizontal: block.gridWidth >= 2 ? 6 : 2,
                      }
                    ]}
                  >
                    {/* Unit Number & Type — top area */}
                    <View style={{ flexDirection: 'column', gap: 1 }}>
                      <Text style={[styles.cellText, { color: colorStyles.textColor }]}>{block.unitNumber}</Text>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: colorStyles.textColor + 'cc' }}>
                        {UNIT_TYPE_OPTIONS.find(opt => opt.value === block.type)?.label || '1 BHK'}
                      </Text>
                    </View>

                    {/* ── Frosted Info Badge — bottom of block ── */}
                    {(block.gridWidth >= 2 || block.gridHeight >= 2) ? (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'stretch',
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        borderRadius: 6,
                        paddingHorizontal: 5,
                        paddingVertical: 3,
                        gap: 4,
                      }}>
                        {/* Status Dot */}
                        <View style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: colorStyles.backgroundColor,
                          borderWidth: 1,
                          borderColor: colorStyles.borderColor,
                        }} />
                        {/* Occupancy */}
                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#1a1a1a' }}>
                          {isVacant ? 'OPEN' : `${activeCount}/${cap}`}
                        </Text>
                      </View>
                    ) : (
                      /* Small 1x1 blocks: compact dot indicator at bottom */
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'center',
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        borderRadius: 4,
                        paddingHorizontal: 4,
                        paddingVertical: 2,
                        gap: 3,
                      }}>
                        <View style={{
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: colorStyles.backgroundColor,
                          borderWidth: 1,
                          borderColor: colorStyles.borderColor,
                        }} />
                        <Text style={{ fontSize: 7, fontWeight: '800', color: '#1a1a1a' }}>
                          {isVacant ? '—' : `${activeCount}/${cap}`}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>
        );
      }
      rows.push(
        <View key={`row-${y}`} style={styles.gridRow} pointerEvents="box-none">
          {cols}
        </View>
      );
    }

    return (
      <View style={{ 
        width: GRID_SIZE_X * CELL_SIZE, 
        height: GRID_SIZE_Y * CELL_SIZE, 
        backgroundColor: 'rgba(255,255,255,0.01)',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start'
      }}>
        {rows}
      </View>
    );
  };

  const renderDetailsSidebar = () => {
    if (!selectedBlock) return null;
    return (
      <BlurView intensity={70} tint="light" style={[styles.desktopCard, { flex: 1 }]}>
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetUnitTitle}>Unit {selectedBlock.unitNumber}</Text>
            <Text style={styles.sheetSubtitle}>Floor {floorNumber}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              setSelectedUnitId(null);
              resetTenantAssignmentForm();
            }}
            style={styles.closeButtonSmall}
          >
            <MaterialIcons name="close" size={20} color="#6b7a7d" />
          </TouchableOpacity>
        </View>

        <RNScrollView 
          ref={sheetScrollRef}
          scrollEnabled={parentScrollEnabled}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isCreatingNewTenant ? (
            /* ── Full-panel Create New Tenant ── */
            <View style={styles.createTenantPanel}>
              <View style={styles.createTenantHeader}>
                <TouchableOpacity onPress={() => setIsCreatingNewTenant(false)} style={styles.createTenantBack}>
                  <MaterialIcons name="arrow-back" size={18} color="#006875" />
                </TouchableOpacity>
                <Text style={styles.createTenantTitle}>CREATE NEW TENANT</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <MaterialIcons name="phone" size={18} color="#7b8a8d" />
                  <TextInput style={[styles.textInput, { color: '#7b8a8d' }]} value={tenantPhoneSearch} editable={false} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="person" size={18} color="#006875" />
                  <TextInput style={styles.textInput} placeholder="e.g. John Doe" placeholderTextColor="#9ba9ab" value={newTenantName} onChangeText={setNewTenantName} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="email" size={18} color="#006875" />
                  <TextInput style={styles.textInput} placeholder="e.g. john@example.com" placeholderTextColor="#9ba9ab" value={newTenantEmail} onChangeText={setNewTenantEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>
              </View>

              {tenantSearchError && (
                <Text style={{ color: '#e53935', fontSize: 13, paddingLeft: 4, marginTop: 4 }}>{tenantSearchError}</Text>
              )}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <TouchableOpacity style={[styles.statusToggle, { flex: 1 }]} onPress={() => setIsCreatingNewTenant(false)}>
                  <Text style={styles.statusToggleText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.statusToggle, styles.statusActiveOccupied, { flex: 1 }]} onPress={handleCreateAndSelectTenant} disabled={tenantCreating}>
                  {tenantCreating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.statusToggleText, styles.statusTextActive]}>CREATE & ASSIGN</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ── Normal unit details view ── */
            <>
              <View style={{ gap: 12, marginBottom: 12 }}>
                <View style={[styles.inputGroup]}>
                  <Text style={styles.inputLabel}>UNIT CAPACITY</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="people" size={18} color="#006875" />
                    <TextInput 
                      style={styles.textInput}
                      value={selectedBlock.capacity ? selectedBlock.capacity.toString() : ''}
                      onChangeText={(val) => {
                        const cap = parseInt(val, 10);
                        updateUnitDetails(selectedBlock.id, { capacity: isNaN(cap) ? undefined : cap });
                      }}
                      placeholder="e.g. 2"
                      keyboardType="numeric"
                      placeholderTextColor="#9ba9ab"
                      editable={!selectedBlock.activeLeases || selectedBlock.activeLeases.length === 0}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ASSIGNED TENANTS</Text>
                {selectedBlock.activeLeases && selectedBlock.activeLeases.length > 0 ? (
                  <View style={{ gap: 10, marginBottom: 12 }}>
                    {selectedBlock.activeLeases.map((l, index) => (
                      <View key={l.leaseId || index} style={[styles.tenantListContainer]}>
                        <View style={{ flex: 1, gap: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <View style={styles.tenantTag}>
                              <Text style={styles.tenantTagText}>{l.tenantName || 'Assigned tenant'}</Text>
                            </View>
                            {l.tenantPhone ? (
                              <Text style={[styles.sheetSubtitle, { marginVertical: 0 }]}>{l.tenantPhone}</Text>
                            ) : null}
                          </View>
                        </View>

                        <TouchableOpacity 
                          onPress={() => handleRemoveTenant(l.leaseId, l.tenantName)}
                          style={styles.removeBtn}
                        >
                          <MaterialIcons name="close" size={16} color="#e53935" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.sheetSubtitle, { marginBottom: 8, fontStyle: 'italic' }]}>No tenants assigned yet.</Text>
                )}

                {(!selectedBlock.capacity || selectedBlock.capacity <= 0) ? (
                  <View style={styles.warningContainer}>
                    <MaterialIcons name="warning" size={18} color="#e53935" />
                    <Text style={styles.warningText}>
                      Please define a unit capacity of at least 1 before you can search for and assign tenants.
                    </Text>
                  </View>
                ) : selectedBlock.activeLeases && selectedBlock.activeLeases.length >= selectedBlock.capacity ? (
                  <View style={[styles.warningContainer, { backgroundColor: 'rgba(46, 125, 50, 0.08)', borderColor: 'rgba(46, 125, 50, 0.15)', marginTop: 8 }]}>
                    <MaterialIcons name="check-circle" size={18} color="#2e7d32" />
                    <Text style={[styles.warningText, { color: '#2e7d32' }]}>
                      Unit is fully occupied (Capacity: {selectedBlock.capacity}/{selectedBlock.capacity} reached).
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={{ marginBottom: 12 }}>
                      <View style={styles.inputWrapper}>
                        <MaterialIcons name="phone" size={18} color="#006875" />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Search by 10-digit phone"
                          placeholderTextColor="#9ba9ab"
                          value={tenantPhoneSearch}
                          onChangeText={(val) => {
                            const cleaned = val.replace(/[^0-9]/g, '').slice(0, 10);
                            setTenantPhoneSearch(cleaned);
                            setTenantSearchError(null);
                          }}
                          keyboardType="phone-pad"
                          maxLength={10}
                          onSubmitEditing={handleSearchTenant}
                        />
                        <TouchableOpacity onPress={handleSearchTenant} disabled={tenantSearchLoading}>
                          {tenantSearchLoading ? (
                            <ActivityIndicator size="small" color="#006875" />
                          ) : (
                            <MaterialIcons name="person-add" size={20} color="#006875" />
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Suggestions List */}
                      {suggestions.length > 0 && (
                        <RNScrollView 
                          style={styles.suggestionsContainer} 
                          nestedScrollEnabled={true}
                          keyboardShouldPersistTaps="handled"
                          onTouchStart={() => setParentScrollEnabled(false)}
                          onTouchEnd={() => setParentScrollEnabled(true)}
                          onTouchCancel={() => setParentScrollEnabled(true)}
                        >
                          {suggestions.map((user) => (
                            <TouchableOpacity
                              key={user.id}
                              style={styles.suggestionItem}
                              onPress={() => {
                                setTenantSearchResult(user);
                                setTenantPhoneSearch(user.phoneNumber || '');
                                setSuggestions([]);
                              }}
                            >
                              <MaterialIcons name="phone" size={16} color="#006875" />
                              <View style={styles.suggestionTextContainer}>
                                <Text style={styles.suggestionName}>{user.fullName}</Text>
                                <Text style={styles.suggestionPhone}>{user.phoneNumber || 'No phone'}</Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </RNScrollView>
                      )}
                    </View>

                    {tenantSearchError && (
                      <Text style={{ color: '#e53935', fontSize: 13, marginTop: -8, marginBottom: 12, paddingLeft: 4 }}>
                        {tenantSearchError}
                      </Text>
                    )}

                    {/* Quick Create Prompt */}
                    {(!tenantSearchResult && tenantPhoneSearch.trim().length >= 10 && !tenantSearchLoading && suggestions.length === 0) && (
                      <TouchableOpacity
                        style={styles.quickCreatePrompt}
                        onPress={() => {
                          setIsCreatingNewTenant(true);
                          setNewTenantName('');
                          setNewTenantEmail('');
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <MaterialIcons name="person-add" size={20} color="#006875" />
                          <Text style={styles.quickCreatePromptText}>
                            {'No tenant found. Create new tenant for "'}{tenantPhoneSearch}{'"?'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    {tenantSearchResult && (
                      <View style={{ gap: 10, marginTop: 4, marginBottom: 12 }}>
                        <View style={styles.searchResultContainer}>
                          <View>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1b5e20' }}>{tenantSearchResult.fullName}</Text>
                            <Text style={{ fontSize: 11, color: '#4e7051' }}>{tenantSearchResult.email}</Text>
                          </View>
                          <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>LEASE RENT (₹)</Text>
                            <View style={[styles.inputWrapper, { height: 42 }]}>
                              <TextInput 
                                style={styles.textInput}
                                placeholder="e.g. 15000"
                                placeholderTextColor="#9ba9ab"
                                value={rentAmount}
                                onChangeText={setRentAmount}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>
                          <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>DEPOSIT (₹)</Text>
                            <View style={[styles.inputWrapper, { height: 42 }]}>
                              <TextInput 
                                style={styles.textInput}
                                placeholder="e.g. 30000"
                                placeholderTextColor="#9ba9ab"
                                value={securityDeposit}
                                onChangeText={setSecurityDeposit}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.saveButton}
                          onPress={() => handleAssignTenant()}
                          disabled={tenantAssigning}
                        >
                          <LinearGradient
                            colors={['#00d4ff', '#0072ff']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveButtonGradient}
                          >
                            {tenantAssigning ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.saveButtonText}>
                                ASSIGN {tenantSearchResult.fullName.toUpperCase()}
                              </Text>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>

              <View style={styles.statusContainer}>
                <TouchableOpacity 
                  style={[styles.statusToggle, selectedBlock.status === 'VACANT' && styles.statusActiveVacant]}
                  onPress={() => updateUnitDetails(selectedBlock.id, { status: 'VACANT' })}
                  disabled={Boolean(selectedBlock.activeLeaseId)}
                >
                  <Text style={[styles.statusToggleText, selectedBlock.status === 'VACANT' && styles.statusTextActive]}>VACANT</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.statusToggle, selectedBlock.status === 'OCCUPIED' && styles.statusActiveOccupied]}
                  onPress={() => updateUnitDetails(selectedBlock.id, { status: 'OCCUPIED' })}
                  disabled={Boolean(selectedBlock.activeLeaseId)}
                >
                  <Text style={[styles.statusToggleText, selectedBlock.status === 'OCCUPIED' && styles.statusTextActive]}>OCCUPIED</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </RNScrollView>
      </BlurView>
    );
  };

  if (isDesktop) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <BlurView intensity={35} tint="dark" style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.modalContentDesktop]}>
            <LinearGradient
              colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.desktopShell}
            >
              <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.desktopMain}>
                  {/* Desktop Header Row */}
                  <View style={styles.desktopHeaderRow}>
                    <View style={styles.largeTitleContainer}>
                      <Text style={styles.titleLineDesktop}>Floor {floorNumber} Layout & Tenants</Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.backButtonDesktop} 
                      onPress={onClose}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.backButtonTextDesktop}>Close View</Text>
                      <MaterialIcons name="close" size={18} color="#151d1e" />
                    </TouchableOpacity>
                  </View>

                  {/* Main Split Layout */}
                  <View style={styles.desktopMainContent}>
                    
                    {/* Left Column: Drawing/Grid Canvas */}
                    <View style={styles.desktopCanvasColumn}>
                      <GestureDetector gesture={composedGesture}>
                        <View ref={desktopGridWrapperRef} style={styles.desktopGridWrapper}>
                          {loading ? (
                            <View style={styles.loadingContainer}>
                              <ActivityIndicator size="large" color="#006875" />
                              <Text style={styles.loadingText}>Loading Layout...</Text>
                            </View>
                          ) : (
                            <View style={styles.canvasContainer}>
                              <Animated.View style={[styles.isometricContainer, animatedGridStyle]}>
                                <View style={[styles.gridContainer, { width: GRID_SIZE_X * CELL_SIZE, height: GRID_SIZE_Y * CELL_SIZE }]}>
                                  {renderGrid()}
                                </View>
                              </Animated.View>
                            </View>
                          )}
                        </View>
                      </GestureDetector>
                    </View>

                    {/* Right Column: Selection Details */}
                    <View style={styles.desktopSidebarColumn}>
                      <View style={{ flex: 1 }}>
                        {selectedBlock ? (
                          renderDetailsSidebar()
                        ) : (
                          <BlurView intensity={60} tint="light" style={[styles.desktopCard, { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                            <MaterialIcons name="info-outline" size={48} color="#6b7a7d" style={{ marginBottom: 16 }} />
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#151d1e', textAlign: 'center', marginBottom: 8 }}>No Unit Selected</Text>
                            <Text style={{ fontSize: 14, color: '#6b7a7d', textAlign: 'center', lineHeight: 20 }}>
                              Select any unit block in the grid layout to configure leases and manage tenants.
                            </Text>
                          </BlurView>
                        )}
                      </View>
                    </View>

                  </View>
                </View>
              </GestureHandlerRootView>
            </LinearGradient>
          </View>
        </BlurView>
      </Modal>
    );
  }

  // Mobile Layout view
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <BlurView intensity={35} tint="dark" style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          >
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaView style={styles.safeArea}>
                {/* Header Section */}
                <View style={styles.header}>
                  <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
                  </TouchableOpacity>
                  <View style={styles.titleContainer}>
                    <Text style={styles.titleLine}>Floor {floorNumber}</Text>
                    <Text style={styles.titleLine}>Layout & Tenants</Text>
                  </View>
                </View>

                {/* Grid Area */}
                <GestureDetector gesture={composedGesture}>
                  <View style={styles.gridWrapper}>
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#006875" />
                        <Text style={styles.loadingText}>Loading Layout...</Text>
                      </View>
                    ) : (
                      <View style={styles.canvasContainer}>
                        <Animated.View style={[styles.isometricContainer, animatedGridStyle]}>
                          <View style={[styles.gridContainer, { width: GRID_SIZE_X * CELL_SIZE, height: GRID_SIZE_Y * CELL_SIZE }]}>
                            {renderGrid()}
                          </View>
                        </Animated.View>
                      </View>
                    )}
                  </View>
                </GestureDetector>

                {/* Close Button when no unit is selected */}
                {!selectedBlock && (
                  <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
                    <TouchableOpacity 
                      activeOpacity={0.8}
                      onPress={onClose}
                      style={styles.saveButton}
                    >
                      <LinearGradient
                        colors={['#00d4ff', '#0072ff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButtonGradient}
                      >
                        <Text style={styles.saveButtonText}>CLOSE VIEW</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Backdrop Blur Overlay when tenant assignment is active */}
                {selectedBlock && (
                  <View style={[StyleSheet.absoluteFillObject, { zIndex: 999 }]}>
                    <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFillObject} />

                    <TouchableOpacity
                      activeOpacity={1}
                      style={StyleSheet.absoluteFillObject}
                      onPress={() => {
                        setSelectedUnitId(null);
                        resetTenantAssignmentForm();
                      }}
                    />

                    <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                      <View style={styles.header}>
                        <TouchableOpacity onPress={() => setSelectedUnitId(null)} style={styles.backButton}>
                          <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
                        </TouchableOpacity>
                      </View>
                    </SafeAreaView>
                  </View>
                )}

                {/* Unit Management Sheet */}
                {selectedBlock && (() => {
                  const bottomPosition = keyboardHeight > 0 ? keyboardHeight + 16 : 80;
                  const maxContentHeight = windowHeight - bottomPosition - (keyboardHeight > 0 ? 160 : 220);
                  return (
                    <Animated.View 
                      entering={FadeInUp}
                      exiting={FadeOutDown}
                      style={[styles.detailSheetWrapper, { bottom: bottomPosition }]}
                    >
                      <BlurView intensity={95} tint="light" style={styles.detailSheet}>
                        <View style={styles.sheetHeader}>
                          <View>
                            <Text style={styles.sheetUnitTitle}>Unit {selectedBlock.unitNumber}</Text>
                            <Text style={styles.sheetSubtitle}>Floor {floorNumber}</Text>
                          </View>
                          <TouchableOpacity 
                            onPress={() => {
                              setSelectedUnitId(null);
                              resetTenantAssignmentForm();
                            }}
                            style={styles.closeButtonSmall}
                          >
                            <MaterialIcons name="close" size={20} color="#6b7a7d" />
                          </TouchableOpacity>
                        </View>

                        <RNScrollView 
                          ref={sheetScrollRef}
                          scrollEnabled={parentScrollEnabled}
                          style={{ maxHeight: maxContentHeight }}
                          contentContainerStyle={styles.sheetContent}
                          showsVerticalScrollIndicator={false}
                          keyboardShouldPersistTaps="handled"
                        >
                          {isCreatingNewTenant ? (
                            /* ── Full-panel Create New Tenant (mobile) ── */
                            <View style={styles.createTenantPanel}>
                              <View style={styles.createTenantHeader}>
                                <TouchableOpacity onPress={() => setIsCreatingNewTenant(false)} style={styles.createTenantBack}>
                                  <MaterialIcons name="arrow-back" size={18} color="#006875" />
                                </TouchableOpacity>
                                <Text style={styles.createTenantTitle}>CREATE NEW TENANT</Text>
                              </View>

                              <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                  <MaterialIcons name="phone" size={18} color="#7b8a8d" />
                                  <TextInput style={[styles.textInput, { color: '#7b8a8d' }]} value={tenantPhoneSearch} editable={false} />
                                </View>
                              </View>

                              <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>FULL NAME</Text>
                                <View style={styles.inputWrapper}>
                                  <MaterialIcons name="person" size={18} color="#006875" />
                                  <TextInput style={styles.textInput} placeholder="e.g. John Doe" placeholderTextColor="#9ba9ab" value={newTenantName} onChangeText={setNewTenantName} />
                                </View>
                              </View>

                              <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                                <View style={styles.inputWrapper}>
                                  <MaterialIcons name="email" size={18} color="#006875" />
                                  <TextInput style={styles.textInput} placeholder="e.g. john@example.com" placeholderTextColor="#9ba9ab" value={newTenantEmail} onChangeText={setNewTenantEmail} keyboardType="email-address" autoCapitalize="none" />
                                </View>
                              </View>

                              {tenantSearchError && (
                                <Text style={{ color: '#e53935', fontSize: 13, paddingLeft: 4, marginTop: 4 }}>{tenantSearchError}</Text>
                              )}

                              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                                <TouchableOpacity style={[styles.statusToggle, { flex: 1 }]} onPress={() => setIsCreatingNewTenant(false)}>
                                  <Text style={styles.statusToggleText}>CANCEL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.statusToggle, styles.statusActiveOccupied, { flex: 1 }]} onPress={handleCreateAndSelectTenant} disabled={tenantCreating}>
                                  {tenantCreating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.statusToggleText, styles.statusTextActive]}>CREATE & ASSIGN</Text>}
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            /* ── Normal unit fields (mobile) ── */
                            <>
                              <View style={{ gap: 12, marginBottom: 12 }}>
                                <View style={[styles.inputGroup]}>
                                  <Text style={styles.inputLabel}>UNIT CAPACITY</Text>
                                  <View style={styles.inputWrapper}>
                                    <MaterialIcons name="people" size={18} color="#006875" />
                                    <TextInput 
                                      style={styles.textInput}
                                      value={selectedBlock.capacity ? selectedBlock.capacity.toString() : ''}
                                      onChangeText={(val) => {
                                        const cap = parseInt(val, 10);
                                        updateUnitDetails(selectedBlock.id, { capacity: isNaN(cap) ? undefined : cap });
                                      }}
                                      placeholder="e.g. 2"
                                      keyboardType="numeric"
                                      placeholderTextColor="#9ba9ab"
                                      editable={!selectedBlock.activeLeases || selectedBlock.activeLeases.length === 0}
                                    />
                                  </View>
                                </View>
                              </View>

                              <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>ASSIGNED TENANTS</Text>
                                {selectedBlock.activeLeases && selectedBlock.activeLeases.length > 0 ? (
                                  <View style={{ gap: 10, marginBottom: 12 }}>
                                    {selectedBlock.activeLeases.map((l, index) => (
                                      <View key={l.leaseId || index} style={[styles.tenantListContainer]}>
                                        <View style={{ flex: 1, gap: 4 }}>
                                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <View style={styles.tenantTag}>
                                              <Text style={styles.tenantTagText}>{l.tenantName || 'Assigned tenant'}</Text>
                                            </View>
                                            {l.tenantPhone ? (
                                              <Text style={[styles.sheetSubtitle, { marginVertical: 0 }]}>{l.tenantPhone}</Text>
                                            ) : null}
                                          </View>
                                        </View>

                                        <TouchableOpacity 
                                          onPress={() => handleRemoveTenant(l.leaseId, l.tenantName)}
                                          style={styles.removeBtn}
                                        >
                                          <MaterialIcons name="close" size={16} color="#e53935" />
                                        </TouchableOpacity>
                                      </View>
                                    ))}
                                  </View>
                                ) : (
                                  <Text style={[styles.sheetSubtitle, { marginBottom: 8, fontStyle: 'italic' }]}>No tenants assigned yet.</Text>
                                )}

                                {(!selectedBlock.capacity || selectedBlock.capacity <= 0) ? (
                                  <View style={styles.warningContainer}>
                                    <MaterialIcons name="warning" size={18} color="#e53935" />
                                    <Text style={styles.warningText}>
                                      Please define a unit capacity of at least 1 before you can search for and assign tenants.
                                    </Text>
                                  </View>
                                ) : selectedBlock.activeLeases && selectedBlock.activeLeases.length >= selectedBlock.capacity ? (
                                  <View style={[styles.warningContainer, { backgroundColor: 'rgba(46, 125, 50, 0.08)', borderColor: 'rgba(46, 125, 50, 0.15)', marginTop: 8 }]}>
                                    <MaterialIcons name="check-circle" size={18} color="#2e7d32" />
                                    <Text style={[styles.warningText, { color: '#2e7d32' }]}>
                                      Unit is fully occupied (Capacity: {selectedBlock.capacity}/{selectedBlock.capacity} reached).
                                    </Text>
                                  </View>
                                ) : (
                                  <>
                                    <View style={{ marginBottom: 12 }}>
                                      <View style={styles.inputWrapper}>
                                        <MaterialIcons name="phone" size={18} color="#006875" />
                                        <TextInput
                                          style={styles.textInput}
                                          placeholder="Search by 10-digit phone"
                                          placeholderTextColor="#9ba9ab"
                                          value={tenantPhoneSearch}
                                          onChangeText={(val) => {
                                            const cleaned = val.replace(/[^0-9]/g, '').slice(0, 10);
                                            setTenantPhoneSearch(cleaned);
                                            setTenantSearchError(null);
                                          }}
                                          keyboardType="phone-pad"
                                          maxLength={10}
                                          onSubmitEditing={handleSearchTenant}
                                        />
                                        <TouchableOpacity onPress={handleSearchTenant} disabled={tenantSearchLoading}>
                                          {tenantSearchLoading ? (
                                            <ActivityIndicator size="small" color="#006875" />
                                          ) : (
                                            <MaterialIcons name="person-add" size={20} color="#006875" />
                                          )}
                                        </TouchableOpacity>
                                      </View>

                                      {/* Suggestions List */}
                                      {suggestions.length > 0 && (
                                        <RNScrollView 
                                          style={styles.suggestionsContainer} 
                                          nestedScrollEnabled={true}
                                          keyboardShouldPersistTaps="handled"
                                          onTouchStart={() => setParentScrollEnabled(false)}
                                          onTouchEnd={() => setParentScrollEnabled(true)}
                                          onTouchCancel={() => setParentScrollEnabled(true)}
                                        >
                                          {suggestions.map((user) => (
                                            <TouchableOpacity
                                              key={user.id}
                                              style={styles.suggestionItem}
                                              onPress={() => {
                                                setTenantSearchResult(user);
                                                setTenantPhoneSearch(user.phoneNumber || '');
                                                setSuggestions([]);
                                              }}
                                            >
                                              <MaterialIcons name="phone" size={16} color="#006875" />
                                              <View style={styles.suggestionTextContainer}>
                                                <Text style={styles.suggestionName}>{user.fullName}</Text>
                                                <Text style={styles.suggestionPhone}>{user.phoneNumber || 'No phone'}</Text>
                                              </View>
                                            </TouchableOpacity>
                                          ))}
                                        </RNScrollView>
                                      )}
                                    </View>

                                    {tenantSearchError && (
                                      <Text style={{ color: '#e53935', fontSize: 13, marginTop: -8, marginBottom: 12, paddingLeft: 4 }}>
                                        {tenantSearchError}
                                      </Text>
                                    )}

                                    {/* Quick Create Prompt */}
                                    {(!tenantSearchResult && tenantPhoneSearch.trim().length >= 10 && !tenantSearchLoading && suggestions.length === 0) && (
                                      <TouchableOpacity
                                        style={styles.quickCreatePrompt}
                                        onPress={() => {
                                          setIsCreatingNewTenant(true);
                                          setNewTenantName('');
                                          setNewTenantEmail('');
                                        }}
                                      >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                          <MaterialIcons name="person-add" size={20} color="#006875" />
                                          <Text style={styles.quickCreatePromptText}>
                                            {'No tenant found. Create new tenant for "'}{tenantPhoneSearch}{'"?'}
                                          </Text>
                                        </View>
                                      </TouchableOpacity>
                                    )}

                                    {tenantSearchResult && (
                                      <View style={{ gap: 10, marginTop: 4, marginBottom: 12 }}>
                                        <View style={styles.searchResultContainer}>
                                          <View>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1b5e20' }}>{tenantSearchResult.fullName}</Text>
                                            <Text style={{ fontSize: 11, color: '#4e7051' }}>{tenantSearchResult.email}</Text>
                                          </View>
                                          <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
                                        </View>

                                        <TouchableOpacity
                                          style={styles.saveButton}
                                          onPress={() => handleAssignTenant()}
                                          disabled={tenantAssigning}
                                        >
                                          <LinearGradient
                                            colors={['#00d4ff', '#0072ff']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.saveButtonGradient}
                                          >
                                            {tenantAssigning ? (
                                              <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                              <Text style={styles.saveButtonText}>
                                                ASSIGN {tenantSearchResult.fullName.toUpperCase()}
                                              </Text>
                                            )}
                                          </LinearGradient>
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                  </>
                                )}
                              </View>

                              <View style={styles.statusContainer}>
                                <TouchableOpacity 
                                  style={[styles.statusToggle, selectedBlock.status === 'VACANT' && styles.statusActiveVacant]}
                                  onPress={() => updateUnitDetails(selectedBlock.id, { status: 'VACANT' })}
                                  disabled={Boolean(selectedBlock.activeLeaseId)}
                                >
                                  <Text style={[styles.statusToggleText, selectedBlock.status === 'VACANT' && styles.statusTextActive]}>VACANT</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                  style={[styles.statusToggle, selectedBlock.status === 'OCCUPIED' && styles.statusActiveOccupied]}
                                  onPress={() => updateUnitDetails(selectedBlock.id, { status: 'OCCUPIED' })}
                                  disabled={Boolean(selectedBlock.activeLeaseId)}
                                >
                                  <Text style={[styles.statusToggleText, selectedBlock.status === 'OCCUPIED' && styles.statusTextActive]}>OCCUPIED</Text>
                                </TouchableOpacity>
                              </View>
                            </>
                          )}
                        </RNScrollView>
                      </BlurView>
                    </Animated.View>
                  );
                })()}

              </SafeAreaView>
            </GestureHandlerRootView>
          </LinearGradient>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  modalContentDesktop: {
    width: '85%',
    maxWidth: 1300,
    height: '85%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 10,
  },
  desktopShell: {
    flex: 1,
  },
  desktopMain: {
    flex: 1,
    padding: 32,
    gap: 20,
  },
  desktopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  largeTitleContainer: {
    flex: 1,
  },
  titleLineDesktop: {
    fontSize: 28,
    fontWeight: '900',
    color: '#151d1e',
    letterSpacing: -0.5,
  },
  backButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  backButtonTextDesktop: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151d1e',
  },
  desktopMainContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 24,
  },
  desktopCanvasColumn: {
    flex: 1.5,
    height: '100%',
  },
  desktopGridWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  desktopSidebarColumn: {
    width: 420,
    height: '100%',
  },
  desktopCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    marginTop: 16,
  },
  titleLine: {
    fontSize: 42,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 46,
    letterSpacing: -1,
  },
  gridWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    marginBottom: 20,
    marginHorizontal: 24,
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#006875',
    letterSpacing: 0.5,
  },
  isometricContainer: {
    padding: 100,
  },
  gridContainer: {
    backgroundColor: 'rgba(0, 104, 117, 0.02)',
    borderWidth: 2,
    borderColor: 'rgba(0, 104, 117, 0.1)',
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(0, 104, 117, 0.15)',
  },
  cellEmpty: {
    backgroundColor: 'transparent',
  },
  cellActive: {
    borderColor: '#004a54',
    backgroundColor: '#006875',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  detailSheetWrapper: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  detailSheet: {
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetUnitTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#151d1e',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#6b7a7d',
    fontWeight: '600',
  },
  closeButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetContent: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b7a7d',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#151d1e',
    fontWeight: '600',
    paddingVertical: 4,
  },
  tenantListContainer: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 16,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tenantList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  tenantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 6,
  },
  tenantTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006875',
  },
  removeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statusToggle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  statusActiveVacant: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  statusActiveOccupied: {
    backgroundColor: 'rgba(0, 104, 117, 0.1)',
    borderColor: 'rgba(0, 104, 117, 0.2)',
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7a7d',
  },
  statusTextActive: {
    color: '#006875',
  },
  saveButton: {
    height: 56,
    borderRadius: 28,
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveButtonGradient: {
    flex: 1,
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
    borderColor: 'rgba(229, 57, 53, 0.15)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#c62828',
    fontWeight: '600',
    lineHeight: 16,
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.15)',
    marginTop: 8,
    maxHeight: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 9999,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    gap: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151d1e',
  },
  suggestionPhone: {
    fontSize: 12,
    color: '#6b7a7d',
    marginTop: 2,
  },
  quickCreatePrompt: {
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.15)',
    padding: 14,
    marginBottom: 12,
  },
  quickCreatePromptText: {
    fontSize: 13,
    color: '#006875',
    fontWeight: '700',
    flex: 1,
  },
  searchResultContainer: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
    borderRadius: 16,
    borderColor: 'rgba(46, 125, 50, 0.15)',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createTenantPanel: {
    gap: 16,
  },
  createTenantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 104, 117, 0.1)',
  },
  createTenantBack: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTenantTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#006875',
    letterSpacing: 1,
  },
});
