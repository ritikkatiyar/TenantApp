import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView as RNScrollView,
  useWindowDimensions,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; // Ensure BlurView is available for web and mobile
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { Gesture, GestureDetector, GestureHandlerRootView, ScrollView, TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  runOnJS, 
  withTiming, 
  FadeInUp, 
  FadeOutDown,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';
import { apiRequest } from '@/src/api/client';
import { getFloorLayout, ActiveLeaseSummary, UnitResponse } from '@/src/features/properties/api/unit.api';
import { createLease } from '@/src/features/tenant/api/lease.api';
import { searchUserByPhone, quickCreateTenant, UserSearchResponse } from '@/src/features/auth/api/user.api';
import { useRouter, Href } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { Theme } from '@/src/theme/Theme';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';

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

interface FloorEditorScreenProps {
  propertyId: string;
  floorNumber: number;
  userToken: string;
  onBack: () => void;
  onSave: () => void;
}

type ToolType = 'PAN' | 'ADD' | 'ERASE';

interface UnitBlock {
  id: string; 
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  unitNumber: string;
  rent?: string;
  tenants?: string[];
  activeLeaseId?: string;
  tenantUserId?: string;
  tenantPhone?: string | null;
  status?: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
  capacity?: number;
  activeLeases?: ActiveLeaseSummary[];
  type?: string;
}

export default function FloorEditorScreen({
  propertyId,
  floorNumber,
  userToken,
  onBack,
  onSave
}: FloorEditorScreenProps) {
  const [typeSelectionModalVisible, setTypeSelectionModalVisible] = useState(false);
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);
  const [pendingBlockNum, setPendingBlockNum] = useState<string>('');
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = windowWidth >= 900;
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [activeTool, setActiveTool] = useState<ToolType>('PAN');
  const [blocks, setBlocks] = useState<UnitBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nextUnitIndex, setNextUnitIndex] = useState(1);
  const [tenantPhoneSearch, setTenantPhoneSearch] = useState('');
  const [tenantSearchResult, setTenantSearchResult] = useState<UserSearchResponse | null>(null);
  const [tenantSearchLoading, setTenantSearchLoading] = useState(false);
  const [tenantAssigning, setTenantAssigning] = useState(false);
  const [rentAmount, setRentAmount] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [currentDrawBlock, setCurrentDrawBlock] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const drawBlockRef = useRef<{ startX: number, startY: number, endX: number, endY: number } | null>(null);

  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);
  const sheetScrollRef = useRef<RNScrollView | null>(null);
  const desktopGridWrapperRef = useRef<any>(null);
  const mobileGridWrapperRef = useRef<any>(null);

  // Scroll Indicator Dynamic Visibility Refs & State
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollContentWidth = useRef(0);
  const scrollLayoutWidth = useRef(0);

  const updateArrowVisibility = (scrollX: number) => {
    const canScroll = scrollContentWidth.current > scrollLayoutWidth.current;
    const isAtEnd = scrollX + scrollLayoutWidth.current >= scrollContentWidth.current - 15;
    setShowRightArrow(canScroll && !isAtEnd);
  };

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    scrollLayoutWidth.current = event.nativeEvent.layoutMeasurement.width;
    scrollContentWidth.current = event.nativeEvent.contentSize.width;
    updateArrowVisibility(scrollX);
  };

  const handleScrollLayout = (event: any) => {
    scrollLayoutWidth.current = event.nativeEvent.layout.width;
    updateArrowVisibility(0);
  };

  const handleScrollContentSizeChange = (w: number) => {
    scrollContentWidth.current = w;
    updateArrowVisibility(0);
  };

  // Zoom Animation Values
  const scale = useSharedValue(0.6);
  const savedScale = useSharedValue(0.6);

  // Pan Animation Values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const gridWidth = GRID_SIZE_X * CELL_SIZE;
  const gridHeight = GRID_SIZE_Y * CELL_SIZE;

  const { width, height } = Dimensions.get('window');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
    fetchLayout();
  }, []);

  const fetchLayout = async () => {
    setLoading(true);
    try {
      const units = await getFloorLayout(propertyId, floorNumber, userToken);
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
          activeLeaseId: primaryLease ? primaryLease.leaseId : undefined,
          tenantUserId: primaryLease ? primaryLease.tenantUserId : undefined,
          tenantPhone: primaryLease ? primaryLease.tenantPhone : undefined,
          status: leases.length > 0 ? 'OCCUPIED' : 'VACANT',
          capacity: u.capacity,
          activeLeases: leases,
          type: normalizeUnitType(u.type),
        };
      });
      setBlocks(mappedBlocks);
      
      let maxIndex = 0;
      const prefix = floorNumber.toString();
      units.forEach(u => {
        if (u.unitNumber.startsWith(prefix)) {
          const suffix = u.unitNumber.substring(prefix.length);
          const num = parseInt(suffix, 10);
          if (!isNaN(num) && num > maxIndex) {
            maxIndex = num;
          }
        }
      });
      setNextUnitIndex(maxIndex + 1);
    } catch (error: any) {
      console.log('No existing layout or error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Drag to Draw Helpers
  const handleDrawStart = (x: number, y: number) => {
    const b = { startX: x, startY: y, endX: x, endY: y };
    drawBlockRef.current = b;
    setCurrentDrawBlock(b);
  };

  const handleDrawUpdate = (x: number, y: number) => {
    if (drawBlockRef.current) {
      const b = { ...drawBlockRef.current, endX: x, endY: y };
      drawBlockRef.current = b;
      setCurrentDrawBlock(b);
    }
  };

  const handleDrawEnd = () => {
    const b = drawBlockRef.current;
    if (b) {
      const minX = Math.min(b.startX, b.endX);
      const minY = Math.min(b.startY, b.endY);
      const w = Math.abs(b.startX - b.endX) + 1;
      const h = Math.abs(b.startY - b.endY) + 1;

      setBlocks(prevBlocks => {
        const overlap = prevBlocks.some(block => 
          minX < block.gridX + block.gridWidth &&
          minX + w > block.gridX &&
          minY < block.gridY + block.gridHeight &&
          minY + h > block.gridY
        );

        if (overlap) {
          Alert.alert('Overlap', 'Units cannot overlap. Please draw in an empty space.');
          return prevBlocks;
        }

        const currentNextIndex = nextUnitIndex; 
        const newUnitNum = `${floorNumber}${(currentNextIndex).toString().padStart(2, '0')}`;
        const newBlockId = `${minX}-${minY}-${Date.now()}`;
        const newBlock: UnitBlock = {
          id: newBlockId,
          gridX: minX,
          gridY: minY,
          gridWidth: w,
          gridHeight: h,
          unitNumber: newUnitNum,
          capacity: 2,
          type: 'ONE_BHK'
        };

        setPendingBlockId(newBlockId);
        setPendingBlockNum(newUnitNum);
        setTypeSelectionModalVisible(true);

        setNextUnitIndex(prev => prev + 1);
        return [...prevBlocks, newBlock];
      });

      drawBlockRef.current = null;
      setCurrentDrawBlock(null);
    }
  };

  const pinchGesture = Gesture.Pinch()
    .enabled(activeTool === 'PAN')
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(newScale, 0.2), 3.0);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .enabled(activeTool === 'PAN')
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const isWeb = Platform.OS === 'web';

  const tapGesture = Gesture.Tap()
    .enabled(activeTool === 'ADD')
    .onEnd((e) => {
      const realX = isWeb ? e.x / scale.value : e.x;
      const realY = isWeb ? e.y / scale.value : e.y;
      const x = Math.floor(realX / CELL_SIZE);
      const y = Math.floor(realY / CELL_SIZE);
      if (x >= 0 && x < GRID_SIZE_X && y >= 0 && y < GRID_SIZE_Y) {
        runOnJS(handleDrawStart)(x, y);
        runOnJS(handleDrawEnd)();
      }
    });

  const drawPanGesture = Gesture.Pan()
    .enabled(activeTool === 'ADD')
    .minDistance(5)
    .onBegin((e) => {
      const realX = isWeb ? e.x / scale.value : e.x;
      const realY = isWeb ? e.y / scale.value : e.y;
      const x = Math.floor(realX / CELL_SIZE);
      const y = Math.floor(realY / CELL_SIZE);
      if (x >= 0 && x < GRID_SIZE_X && y >= 0 && y < GRID_SIZE_Y) {
        runOnJS(handleDrawStart)(x, y);
      }
    })
    .onUpdate((e) => {
      const realX = isWeb ? e.x / scale.value : e.x;
      const realY = isWeb ? e.y / scale.value : e.y;
      const x = Math.floor(realX / CELL_SIZE);
      const y = Math.floor(realY / CELL_SIZE);
      if (x >= 0 && x < GRID_SIZE_X && y >= 0 && y < GRID_SIZE_Y) {
        runOnJS(handleDrawUpdate)(x, y);
      }
    })
    .onEnd(() => {
      runOnJS(handleDrawEnd)();
    })
    .onFinalize(() => {
      runOnJS(handleDrawEnd)();
    });

  const drawGesture = Gesture.Race(drawPanGesture, tapGesture);

  const activeGesture = activeTool === 'PAN' ? composedGesture : drawGesture;

  const animatedGridStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateX: withTiming(activeTool === 'PAN' ? '60deg' : '0deg', { duration: 400 }) },
      { rotateZ: withTiming(activeTool === 'PAN' ? '-45deg' : '0deg', { duration: 400 }) },
      { scale: scale.value }
    ],
  }));

  // Zoom & Pan Wheel handler for Desktop Web browsers
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomIntensity = 0.05;
      const delta = -e.deltaY;
      const factor = delta > 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);
      
      const newScale = scale.value * factor;
      scale.value = Math.min(Math.max(newScale, 0.2), 3.0);
      savedScale.value = scale.value;
    };

    const desktopElement = desktopGridWrapperRef.current;
    const mobileElement = mobileGridWrapperRef.current;

    if (desktopElement) {
      desktopElement.addEventListener('wheel', handleWheelEvent, { passive: false });
    }
    if (mobileElement) {
      mobileElement.addEventListener('wheel', handleWheelEvent, { passive: false });
    }

    return () => {
      if (desktopElement) {
        desktopElement.removeEventListener('wheel', handleWheelEvent);
      }
      if (mobileElement) {
        mobileElement.removeEventListener('wheel', handleWheelEvent);
      }
    };
  }, [isDesktop, loading, saving]);

  // Fetch existing layout if any (mocked for now, or you can implement actual fetch)
  useEffect(() => {
    // In a full implementation, we'd fetch the existing units for this floor here.
    // For now, we start with an empty canvas or mock data.
    setLoading(false);
  }, [propertyId, floorNumber]);

  const handleClearAll = () => {
    Alert.alert('Clear All', 'Are you sure you want to remove all units? This cannot be undone until saved.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => { setBlocks([]); setNextUnitIndex(1); } }
    ]);
  };

  const handleBlockPress = (blockIndex: number) => {
    const block = blocks[blockIndex];
    if (activeTool === 'ERASE') {
      const newBlocks = [...blocks];
      newBlocks.splice(blockIndex, 1);
      setBlocks(newBlocks);
    } else if (activeTool === 'PAN') {
      setSelectedUnitId(block.id);
      setRentAmount('');
      setSecurityDeposit('');
      setTenantPhoneSearch('');
      setTenantSearchResult(null);
    }
  };

  const updateUnitDetails = (id: string, updates: Partial<UnitBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const [tenantSearchError, setTenantSearchError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<UserSearchResponse[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [isCreatingNewTenant, setIsCreatingNewTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [tenantCreating, setTenantCreating] = useState(false);

  useEffect(() => {
    const query = tenantPhoneSearch.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const results = await searchUserByPhone(query, userToken);
        setSuggestions(results || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [tenantPhoneSearch, userToken]);

  useEffect(() => {
    if (suggestions.length > 0 && sheetScrollRef.current) {
      setTimeout(() => {
        sheetScrollRef.current?.scrollTo({ y: 155, animated: true });
      }, 50);
    }
  }, [suggestions]);

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

  const handleSearchTenant = async () => {
    const phone = tenantPhoneSearch.trim();
    if (!phone) {
      setTenantSearchError('Enter a phone number to search.');
      return;
    }

    if (!selectedBlock) return;

    if (!selectedBlock.capacity || selectedBlock.capacity <= 0) {
      setTenantSearchError('Please define unit capacity first.');
      return;
    }
    if (!UUID_PATTERN.test(selectedBlock.id)) {
      setTenantSearchError('Save the floor layout before assigning tenants.');
      return;
    }

    setTenantSearchLoading(true);
    setTenantSearchError(null);
    setTenantSearchResult(null);
    try {
      const users = await searchUserByPhone(phone, userToken);
      if (!users || users.length === 0) {
        setTenantSearchError('Tenant not found with this number.');
        return;
      }
      const exactMatch = users.find(u => u.phoneNumber === phone) || users[0];
      setTenantSearchResult(exactMatch);
      setTenantPhoneSearch(exactMatch.phoneNumber || '');
      setSuggestions([]);
    } catch (error: any) {
      console.error('[Search Tenant Error]', error);
      setTenantSearchError(error.message || 'Search failed.');
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
      const createdUser = await quickCreateTenant({ email, fullName: name, phoneNumber: phone }, userToken);
      setTenantSearchResult(createdUser);
      setTenantPhoneSearch(createdUser.phoneNumber || '');
      setIsCreatingNewTenant(false);
      setNewTenantName('');
      setNewTenantEmail('');
      setSuggestions([]);
      
      // Auto assign after creation
      await handleAssignTenant(createdUser);
    } catch (error: any) {
      console.error('[Create Tenant Error]', error);
      setTenantSearchError(error.message || 'Failed to create tenant.');
    } finally {
      setTenantCreating(false);
    }
  };

  const handleAssignTenant = async (userToAssign?: UserSearchResponse | any) => {
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

      // 1) Auto-save the floor layout first!
      // This guarantees the modified unit capacity is permanently saved to the database unit table
      // before creating the lease, preventing rent calculation/mismatch issues on reload.
      const savePayload = blocks.map(b => ({
        unitNumber: b.unitNumber,
        gridX: b.gridX,
        gridY: b.gridY,
        gridWidth: b.gridWidth,
        gridHeight: b.gridHeight,
        type: b.type || 'ONE_BHK',
        capacity: b.id === selectedBlock.id ? capacity : (b.capacity || 2),
        facing: 'NORTH'
      }));

      const savedUnits = await apiRequest<UnitResponse[]>(`/api/v1/property/properties/${propertyId}/floors/${floorNumber}/layout`, {
        method: 'PUT',
        token: userToken,
        body: JSON.stringify(savePayload)
      });

      const savedUnit = savedUnits.find(u => 
        (u.gridX === selectedBlock.gridX && u.gridY === selectedBlock.gridY) ||
        u.unitNumber === selectedBlock.unitNumber
      );
      if (!savedUnit) {
        console.error('[Assign Tenant] Could not find saved unit in response!', {
          selectedUnitNumber: selectedBlock.unitNumber,
          selectedCoords: { x: selectedBlock.gridX, y: selectedBlock.gridY },
          savedUnits: savedUnits.map(u => ({ number: u.unitNumber, x: u.gridX, y: u.gridY }))
        });
      }
      const realUnitId = savedUnit ? savedUnit.id : selectedBlock.id;

      // Update blocks state to update the id to realUnitId and select it
      setBlocks(prev => prev.map(b => b.id === selectedBlock.id ? { ...b, id: realUnitId } : b));
      setSelectedUnitId(realUnitId);

      // 2) Now create the lease, which will read the correct, updated unit capacity from the database.
      const today = new Date().toISOString().slice(0, 10);
      const payload = {
        userId: targetUser.id,
        unitId: realUnitId,
        rentAmount: leaseRentAmount,
        securityDeposit: depositAmount,
        splitStrategy: 'FULL_UNIT' as const,
        moveInDate: today,
        status: 'ACTIVE' as const,
      };

      const lease = await createLease(payload, userToken);

      updateUnitDetails(realUnitId, {
        tenants: [...(selectedBlock.tenants || []), targetUser.fullName],
        tenantUserId: targetUser.id,
        tenantPhone: targetUser.phoneNumber,
        activeLeaseId: lease.id,
        status: 'OCCUPIED',
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
      console.error('[Assign Tenant Error]', error);
      setTenantSearchError(error.message || 'Assignment failed.');
    } finally {
      setTenantAssigning(false);
    }
  };

  const handleRemoveTenant = async (leaseId: string, tenantName?: string | null) => {
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
              // Call delete lease API on backend
              await apiRequest(`/api/v1/finance/leases/${leaseId}`, {
                method: 'DELETE',
                token: userToken,
              });

              // Update state locally
              const remainingLeases = (selectedBlock.activeLeases || []).filter(l => l.leaseId !== leaseId);
              const remainingTenants = (selectedBlock.tenants || []).filter(name => name !== tenantName);
              
              updateUnitDetails(selectedBlock.id, {
                tenants: remainingTenants,
                activeLeases: remainingLeases,
                activeLeaseId: remainingLeases[0]?.leaseId || undefined,
                tenantUserId: remainingLeases[0]?.tenantUserId || undefined,
                tenantPhone: remainingLeases[0]?.tenantPhone || undefined,
                rent: remainingLeases[0]?.rentAmount?.toString() || undefined,
                status: remainingLeases.length > 0 ? 'OCCUPIED' : 'VACANT',
              });

              Alert.alert('Removed', `${displayName} has been removed from Unit ${selectedBlock.unitNumber}.`);
            } catch (error: any) {
              console.error('[Remove Tenant Error]', error);
              Alert.alert('Error', error.message || 'Failed to remove tenant.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const selectedBlock = blocks.find(b => b.id === selectedUnitId);

  const handleSave = async () => {
    if (blocks.length === 0) {
      Alert.alert('Save Layout', 'Please draw at least one unit before saving.');
      return;
    }

    setSaving(true);
    try {
      // Map local blocks to backend payload
      const payload = blocks.map(b => ({
        unitNumber: b.unitNumber,
        gridX: b.gridX,
        gridY: b.gridY,
        gridWidth: b.gridWidth,
        gridHeight: b.gridHeight,
        type: b.type || 'ONE_BHK',
        capacity: b.capacity || 2,
        facing: 'NORTH'  // Defaulting
      }));

      await apiRequest(`/api/v1/property/properties/${propertyId}/floors/${floorNumber}/layout`, {
        method: 'PUT',
        token: userToken,
        body: JSON.stringify(payload)
      });

      onSave();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save layout.');
    } finally {
      setSaving(false);
    }
  };

  const getBlockColorStyles = (b: UnitBlock) => {
    const activeCount = b.activeLeases ? b.activeLeases.length : 0;
    const capacity = b.capacity || 1;

    if (activeCount === 0) {
      // Fully Vacant: Muted Emerald Green
      return {
        backgroundColor: '#43a047',
        borderColor: '#2e7d32',
        textColor: '#ffffff',
        accentColor: '#c8e6c9'
      };
    } else if (activeCount < capacity) {
      // Partially Occupied: Warm Amber Orange
      return {
        backgroundColor: '#fb8c00',
        borderColor: '#e65100',
        textColor: '#ffffff',
        accentColor: '#fff3e0'
      };
    } else {
      // Fully Occupied: Muted Crimson Red
      return {
        backgroundColor: '#e53935',
        borderColor: '#b71c1c',
        textColor: '#ffffff',
        accentColor: '#ffcdd2'
      };
    }
  };

  const renderGrid = () => {
    const rows = [];
    let previewBlockState = null;
    if (currentDrawBlock) {
      const minX = Math.min(currentDrawBlock.startX, currentDrawBlock.endX);
      const minY = Math.min(currentDrawBlock.startY, currentDrawBlock.endY);
      const w = Math.abs(currentDrawBlock.startX - currentDrawBlock.endX) + 1;
      const h = Math.abs(currentDrawBlock.startY - currentDrawBlock.endY) + 1;
      previewBlockState = { gridX: minX, gridY: minY, w, h };
    }

    for (let y = 0; y < GRID_SIZE_Y; y++) {
      const cols = [];
      for (let x = 0; x < GRID_SIZE_X; x++) {
        const block = blocks.find(b => b.gridX === x && b.gridY === y);
        const isPreviewStart = previewBlockState && previewBlockState.gridX === x && previewBlockState.gridY === y;

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
                pointerEvents={activeTool === 'ADD' ? 'none' : 'auto'}
                style={{
                  position: 'absolute',
                  top: -1, 
                  left: -1, 
                  width: block.gridWidth * CELL_SIZE,
                  height: block.gridHeight * CELL_SIZE,
                  zIndex: isSelected ? 50 : 10,
                }}
              >
                {/* ── Colored Block with Embedded Info Badge ── */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleBlockPress(blocks.indexOf(block))}
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
            {isPreviewStart && previewBlockState && (
              <View
                pointerEvents="none"
                style={[
                  styles.cellDrawingStart,
                  {
                    position: 'absolute',
                    top: -1,
                    left: -1,
                    width: previewBlockState.w * CELL_SIZE,
                    height: previewBlockState.h * CELL_SIZE,
                    zIndex: 20,
                  }
                ]}
              />
            )}
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
        width: gridWidth, 
        height: gridHeight, 
        backgroundColor: 'rgba(255,255,255,0.01)',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start'
      }}>
        {rows}
      </View>
    );
  };

  const renderTypeSelectionModal = () => {
    return (
      <Modal
        visible={typeSelectionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setTypeSelectionModalVisible(false);
          setPendingBlockId(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
          <LinearGradient
            colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.typeModalContent}
          >
            <Text style={styles.typeModalTitle}>Configure New Unit</Text>
            <Text style={styles.typeModalSubtitle}>Select type for Unit {pendingBlockNum}</Text>
            
            <View style={styles.typeGrid}>
              {UNIT_TYPE_OPTIONS.map((option) => {
                let iconName: keyof typeof MaterialIcons.glyphMap = 'home';
                let desc = '';
                if (option.value === 'ONE_BHK') { iconName = 'looks-one'; desc = '1 Bedroom'; }
                else if (option.value === 'TWO_BHK') { iconName = 'looks-two'; desc = '2 Bedrooms'; }
                else if (option.value === 'STUDIO') { iconName = 'room-service'; desc = 'Single Studio'; }
                else if (option.value === 'SINGLE_UNIT') { iconName = 'person'; desc = 'Single Co-living'; }
                else if (option.value === 'SHARED_UNIT') { iconName = 'people'; desc = 'Shared Co-living'; }

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.typeCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (pendingBlockId) {
                        let cap = 2;
                        if (option.value === 'ONE_BHK') cap = 2;
                        else if (option.value === 'TWO_BHK') cap = 4;
                        else if (option.value === 'STUDIO') cap = 1;
                        else if (option.value === 'SINGLE_UNIT') cap = 1;
                        else if (option.value === 'SHARED_UNIT') cap = 2;

                        updateUnitDetails(pendingBlockId, { type: option.value, capacity: cap });
                      }
                      setTypeSelectionModalVisible(false);
                      setPendingBlockId(null);
                    }}
                  >
                    <View style={styles.typeCardIconWrapper}>
                      <MaterialIcons name={iconName} size={28} color="#006875" />
                    </View>
                    <Text style={styles.typeCardLabel}>{option.label}</Text>
                    <Text style={styles.typeCardDesc}>{desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <TouchableOpacity
              style={[styles.typeCancelButton, { backgroundColor: 'rgba(229, 57, 53, 0.08)' }]}
              onPress={() => {
                if (pendingBlockId) {
                  setBlocks(prev => prev.filter(b => b.id !== pendingBlockId));
                }
                setTypeSelectionModalVisible(false);
                setPendingBlockId(null);
              }}
            >
              <Text style={[styles.typeCancelText, { color: '#e53935' }]}>Discard Unit</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    );
  };

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

  if (isDesktop) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LinearGradient
          colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.desktopShell}
        >
          {/* Main Workspace */}
          <View style={styles.desktopMain}>
            {/* Topbar Row */}
            <DesktopNavBar 
              activeTab="Properties" 
              onBack={onBack} 
              backText="Back to Floor Overview" 
            />

            {/* Content Container */}
            <View style={[styles.flex, styles.desktopContent]}>
              <View style={[styles.flex, styles.desktopInner]}>
                
                {/* Desktop Header Row */}
                <View style={styles.desktopHeaderRow}>
                  <View style={styles.largeTitleContainer}>
                    <Text style={styles.titleLineDesktop}>Edit Floor {floorNumber} Layout</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.desktopSaveButtonWrapper} 
                    onPress={handleSave}
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
                          <Text style={styles.desktopSaveButtonText}>Save Layout</Text>
                          <MaterialIcons name="check" size={18} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Main Split Layout */}
                <View style={styles.desktopMainContent}>
                  
                  {/* Left Column: Drawing/Grid Canvas */}
                  <View style={styles.desktopCanvasColumn}>
                    <GestureDetector gesture={composedGesture}>
                      <View ref={desktopGridWrapperRef} style={styles.desktopGridWrapper}>
                        {saving ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#006875" />
                            <Text style={styles.loadingText}>Saving Layout...</Text>
                          </View>
                        ) : loading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#006875" />
                            <Text style={styles.loadingText}>Loading Layout...</Text>
                          </View>
                        ) : (
                          <>
                            <View style={styles.canvasContainer}>
                              <Animated.View style={[styles.isometricContainer, animatedGridStyle]}>
                                <GestureDetector gesture={drawGesture}>
                                  <View 
                                    style={[styles.gridContainer, { width: gridWidth, height: gridHeight }]}
                                    pointerEvents={activeTool === 'PAN' ? 'box-none' : 'auto'}
                                  >
                                    {renderGrid()}
                                  </View>
                                </GestureDetector>
                              </Animated.View>
                            </View>

                            {/* Floating Editor Tools Bar */}
                            <BlurView intensity={80} tint="light" style={styles.floatingToolbar}>
                              <TouchableOpacity 
                                style={[styles.floatingToolButton, activeTool === 'PAN' && styles.floatingToolButtonActive]}
                                onPress={() => setActiveTool('PAN')}
                              >
                                <MaterialIcons name="pan-tool" size={18} color={activeTool === 'PAN' ? '#fff' : '#006875'} />
                                <Text style={[styles.floatingToolText, activeTool === 'PAN' && styles.floatingToolTextActive]}>Move</Text>
                              </TouchableOpacity>

                              <TouchableOpacity 
                                style={[styles.floatingToolButton, activeTool === 'ADD' && styles.floatingToolButtonActive]}
                                onPress={() => setActiveTool('ADD')}
                              >
                                <MaterialIcons name="edit" size={18} color={activeTool === 'ADD' ? '#fff' : '#006875'} />
                                <Text style={[styles.floatingToolText, activeTool === 'ADD' && styles.floatingToolTextActive]}>Draw</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity 
                                style={[styles.floatingToolButton, activeTool === 'ERASE' && styles.floatingToolButtonActive]}
                                onPress={() => setActiveTool('ERASE')}
                              >
                                <MaterialIcons name="layers-clear" size={18} color={activeTool === 'ERASE' ? '#fff' : '#006875'} />
                                <Text style={[styles.floatingToolText, activeTool === 'ERASE' && styles.floatingToolTextActive]}>Erase</Text>
                              </TouchableOpacity>

                              <View style={styles.floatingDivider} />

                              <TouchableOpacity 
                                style={styles.floatingToolButton}
                                onPress={handleClearAll}
                              >
                                <MaterialIcons name="delete-sweep" size={18} color="#e53935" />
                                <Text style={[styles.floatingToolText, { color: '#e53935' }]}>Clear</Text>
                              </TouchableOpacity>
                            </BlurView>
                          </>
                        )}
                      </View>
                    </GestureDetector>
                  </View>

                  {/* Right Column: Selection Details (Takes entire panel height) */}
                  <View style={styles.desktopSidebarColumn}>
                    <View style={{ flex: 1 }}>
                      {selectedBlock ? (
                        <BlurView intensity={70} tint="light" style={[styles.desktopCard, { flex: 1 }]}>
                          <View style={styles.sheetHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.sheetUnitTitle}>Unit {selectedBlock.unitNumber}</Text>
                              <Text style={styles.sheetSubtitle}>Floor {floorNumber}</Text>
                            </View>
                            <TouchableOpacity 
                              onPress={() => {
                                setSelectedUnitId(null);
                                setSecurityDeposit('');
                                resetTenantAssignmentForm();
                              }}
                              style={styles.closeButton}
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
                              /* ── Full-panel Create New Tenant (replaces all content) ── */
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
                              /* ── Normal unit fields ── */
                              <>
                            {/* Form Input Fields */}
                            <View style={{ gap: 12, marginBottom: 12 }}>
                              <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>UNIT TYPE</Text>
                                <GlassDropdown
                                  options={UNIT_TYPE_OPTIONS}
                                  value={selectedBlock.type || 'ONE_BHK'}
                                  onChange={(val) => updateUnitDetails(selectedBlock.id, { type: val })}
                                  placeholder="Select Unit Type"
                                  icon="home"
                                />
                              </View>

                              <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
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
                                <Text style={styles.inputLabel}>SECURITY DEPOSIT</Text>
                                <View style={styles.inputWrapper}>
                                  <MaterialIcons name="account-balance-wallet" size={18} color="#006875" />
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

                            {/* Assigned Tenants */}
                            <View style={styles.inputGroup}>
                              <Text style={styles.inputLabel}>ASSIGNED TENANTS</Text>
                              {selectedBlock.activeLeases && selectedBlock.activeLeases.length > 0 ? (
                                <View style={{ gap: 10, marginBottom: 12 }}>
                                  {selectedBlock.activeLeases.map((l, index) => (
                                    <View key={l.leaseId || index} style={[styles.tenantList, { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: 'rgba(255, 255, 255, 0.45)', borderRadius: 16, borderColor: 'rgba(255, 255, 255, 0.55)', borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
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
                                        style={{ padding: 6, borderRadius: 10, backgroundColor: 'rgba(229, 57, 53, 0.1)' }}
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
                                  {!isCreatingNewTenant && (
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
                                          {suggestions.map((userItem) => (
                                            <TouchableOpacity
                                              key={userItem.id}
                                              style={styles.suggestionItem}
                                              onPress={() => {
                                                setTenantSearchResult(userItem);
                                                setTenantPhoneSearch(userItem.phoneNumber || '');
                                                setSuggestions([]);
                                              }}
                                            >
                                              <MaterialIcons name="phone" size={16} color="#006875" />
                                              <View style={styles.suggestionTextContainer}>
                                                <Text style={styles.suggestionName}>{userItem.fullName}</Text>
                                                <Text style={styles.suggestionPhone}>{userItem.phoneNumber || 'No phone'}</Text>
                                              </View>
                                            </TouchableOpacity>
                                          ))}
                                        </RNScrollView>
                                      )}
                                    </View>
                                  )}

                                  {tenantSearchError && (
                                    <Text style={{ color: '#e53935', fontSize: 13, marginTop: -8, marginBottom: 12, paddingLeft: 4 }}>
                                      {tenantSearchError}
                                    </Text>
                                  )}

                                  {/* Quick Create Prompt */}
                                  {(!tenantSearchResult && !isCreatingNewTenant && tenantPhoneSearch.trim().length >= 10 && !tenantSearchLoading && suggestions.length === 0) && (
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
                                          No tenant found. Create new tenant for &quot;{tenantPhoneSearch}&quot;?
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                  )}

                                  {/* Quick Create Form */}
                                  {isCreatingNewTenant && (
                                    <View style={styles.quickCreateForm}>
                                      <Text style={styles.quickCreateTitle}>NEW TENANT DETAILS</Text>
                                      
                                      <View style={styles.quickCreateField}>
                                        <Text style={styles.quickCreateLabel}>PHONE NUMBER</Text>
                                        <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                          <MaterialIcons name="phone" size={18} color="#7b8a8d" />
                                          <TextInput
                                            style={[styles.textInput, { color: '#7b8a8d' }]}
                                            value={tenantPhoneSearch}
                                            editable={false}
                                          />
                                        </View>
                                      </View>

                                      <View style={styles.quickCreateField}>
                                        <Text style={styles.quickCreateLabel}>FULL NAME</Text>
                                        <View style={styles.inputWrapper}>
                                          <MaterialIcons name="person" size={18} color="#006875" />
                                          <TextInput
                                            style={styles.textInput}
                                            placeholder="e.g. John Doe"
                                            placeholderTextColor="#9ba9ab"
                                            value={newTenantName}
                                            onChangeText={setNewTenantName}
                                          />
                                        </View>
                                      </View>

                                      <View style={styles.quickCreateField}>
                                        <Text style={styles.quickCreateLabel}>EMAIL ADDRESS</Text>
                                        <View style={styles.inputWrapper}>
                                          <MaterialIcons name="email" size={18} color="#006875" />
                                          <TextInput
                                            style={styles.textInput}
                                            placeholder="e.g. john@example.com"
                                            placeholderTextColor="#9ba9ab"
                                            value={newTenantEmail}
                                            onChangeText={setNewTenantEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                          />
                                        </View>
                                      </View>

                                      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                                        <TouchableOpacity
                                          style={[styles.statusToggle, { flex: 1 }]}
                                          onPress={() => setIsCreatingNewTenant(false)}
                                        >
                                          <Text style={styles.statusToggleText}>CANCEL</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={[styles.statusToggle, styles.statusActiveOccupied, { flex: 1 }]}
                                          onPress={handleCreateAndSelectTenant}
                                          disabled={tenantCreating}
                                        >
                                          {tenantCreating ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                          ) : (
                                            <Text style={[styles.statusToggleText, styles.statusTextActive]}>CREATE & ASSIGN</Text>
                                          )}
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  )}

                                  {tenantSearchResult && (
                                    <View style={{ gap: 10, marginTop: 4, marginBottom: 12 }}>
                                      <View style={{ paddingVertical: 10, paddingHorizontal: 14, backgroundColor: 'rgba(46, 125, 50, 0.05)', borderRadius: 16, borderColor: 'rgba(46, 125, 50, 0.15)', borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <View>
                                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#1b5e20' }}>{tenantSearchResult.fullName}</Text>
                                          <Text style={{ fontSize: 11, color: '#4e7051' }}>{tenantSearchResult.email}</Text>
                                        </View>
                                        <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
                                      </View>

                                      <TouchableOpacity
                                        style={[styles.statusToggle, styles.statusActiveOccupied, { marginHorizontal: 0, paddingVertical: 14, borderRadius: 16 }]}
                                        onPress={() => handleAssignTenant()}
                                        disabled={tenantAssigning}
                                      >
                                        {tenantAssigning ? (
                                          <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                          <Text style={[styles.statusToggleText, styles.statusTextActive]}>
                                            ASSIGN {tenantSearchResult.fullName.toUpperCase()}
                                          </Text>
                                        )}
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </>
                              )}
                            </View>
                              </>
                            )}

                            {!isCreatingNewTenant && (
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
                            )}
                          </RNScrollView>
                        </BlurView>
                      ) : (
                        <BlurView intensity={60} tint="light" style={[styles.desktopCard, { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                          <MaterialIcons name="info-outline" size={48} color="#6b7a7d" style={{ marginBottom: 16 }} />
                          <Text style={{ fontSize: 18, fontWeight: '700', color: '#151d1e', textAlign: 'center', marginBottom: 8 }}>No Unit Selected</Text>
                          <Text style={{ fontSize: 14, color: '#6b7a7d', textAlign: 'center', lineHeight: 20 }}>
                            Select any unit block in the grid layout to manage rent configurations and assign tenants.
                          </Text>
                        </BlurView>
                      )}
                    </View>
                  </View>
                </View>

              </View>
            </View>
          </View>
        </LinearGradient>
        {renderTypeSelectionModal()}
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.titleLine}>Edit Floor {floorNumber}</Text>
            <Text style={styles.titleLine}>Layout</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Tools Panel */}
          <View style={styles.toolsPanel}>
            <Text style={styles.toolsTitle}>EDITOR TOOLS</Text>
            <View style={styles.toolsWrapper}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.toolsRow}
                style={styles.toolsScrollView}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onLayout={handleScrollLayout}
                onContentSizeChange={handleScrollContentSizeChange}
              >
                <TouchableOpacity 
                  style={[styles.toolButton, activeTool === 'PAN' && styles.toolButtonActive]}
                  onPress={() => setActiveTool('PAN')}
                >
                  <MaterialIcons name="pan-tool" size={20} color={activeTool === 'PAN' ? '#fff' : '#006875'} />
                  <Text style={[styles.toolText, activeTool === 'PAN' && styles.toolTextActive]}>Move</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.toolButton, activeTool === 'ADD' && styles.toolButtonActive]}
                  onPress={() => setActiveTool('ADD')}
                >
                  <MaterialIcons name="edit" size={20} color={activeTool === 'ADD' ? '#fff' : '#006875'} />
                  <Text style={[styles.toolText, activeTool === 'ADD' && styles.toolTextActive]}>Draw</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.toolButton, activeTool === 'ERASE' && styles.toolButtonActive]}
                  onPress={() => setActiveTool('ERASE')}
                >
                  <MaterialIcons name="layers-clear" size={20} color={activeTool === 'ERASE' ? '#fff' : '#006875'} />
                  <Text style={[styles.toolText, activeTool === 'ERASE' && styles.toolTextActive]}>Erase</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.toolButton}
                  onPress={handleClearAll}
                >
                  <MaterialIcons name="delete-sweep" size={20} color="#e53935" />
                  <Text style={[styles.toolText, { color: '#e53935' }]}>Clear</Text>
                </TouchableOpacity>
              </ScrollView>
              {showRightArrow && (
                <Animated.View 
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  style={styles.scrollIndicator}
                  pointerEvents="none"
                >
                  <MaterialIcons name="chevron-right" size={18} color="#ffffff" />
                </Animated.View>
              )}
            </View>
          </View>

          {/* Grid Area */}
          <GestureDetector gesture={composedGesture}>
            <View ref={mobileGridWrapperRef} style={styles.gridWrapper}>
              {saving ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#006875" />
                  <Text style={styles.loadingText}>Saving Layout...</Text>
                </View>
              ) : loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#006875" />
                  <Text style={styles.loadingText}>Loading Layout...</Text>
                </View>
              ) : (
                <View style={styles.canvasContainer}>
                  <Animated.View style={[styles.isometricContainer, animatedGridStyle]}>
                    <GestureDetector gesture={drawGesture}>
                      <View 
                        style={[styles.gridContainer, { width: gridWidth, height: gridHeight }]}
                        pointerEvents={activeTool === 'PAN' ? 'box-none' : 'auto'}
                      >
                        {renderGrid()}
                      </View>
                    </GestureDetector>
                  </Animated.View>
                </View>
              )}
            </View>
          </GestureDetector>

          {/* Save Button */}
          {!selectedBlock && (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={saving}
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
                  <Text style={styles.saveButtonText}>SAVE LAYOUT</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Backdrop Blur Overlay when tenant assignment is active */}
        {selectedBlock && (
          <View style={[StyleSheet.absoluteFillObject, { zIndex: 999 }]}>
            {/* Blur backdrop */}
            <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFillObject} />

            {/* Tap to close sheet */}
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFillObject}
              onPress={() => {
                setSelectedUnitId(null);
                setRentAmount('');
                setSecurityDeposit('');
                resetTenantAssignmentForm();
              }}
            />

            {/* Sharp Back Button on top of the blur */}
            <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
              <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                  <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        )}

        {/* Unit Management Sheet */}
        {selectedBlock && (() => {
          const bottomPosition = keyboardHeight > 0 ? keyboardHeight + 16 : 80;
          const maxContentHeight = height - bottomPosition - (keyboardHeight > 0 ? 160 : 220);
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
                      setRentAmount('');
                      setSecurityDeposit('');
                      resetTenantAssignmentForm();
                    }}
                    style={styles.closeButton}
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
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>UNIT TYPE</Text>
                    <GlassDropdown
                      options={UNIT_TYPE_OPTIONS}
                      value={selectedBlock.type || 'ONE_BHK'}
                      onChange={(val) => updateUnitDetails(selectedBlock.id, { type: val })}
                      placeholder="Select Unit Type"
                      icon="home"
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
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
                    <Text style={styles.inputLabel}>MONTHLY RENT</Text>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="payments" size={18} color="#006875" />
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

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>SECURITY DEPOSIT</Text>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="account-balance-wallet" size={18} color="#006875" />
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

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ASSIGNED TENANTS</Text>
                  {selectedBlock.activeLeases && selectedBlock.activeLeases.length > 0 ? (
                    <View style={{ gap: 10, marginBottom: 12 }}>
                      {selectedBlock.activeLeases.map((l, index) => (
                        <View key={l.leaseId || index} style={[styles.tenantList, { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: 'rgba(255, 255, 255, 0.45)', borderRadius: 16, borderColor: 'rgba(255, 255, 255, 0.55)', borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
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
                            style={{ padding: 6, borderRadius: 10, backgroundColor: 'rgba(229, 57, 53, 0.1)' }}
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
                      {!isCreatingNewTenant && (
                        <View style={{ marginBottom: 12 }}>
                          {/* Search & Add Tenant Field */}
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
                      )}

                      {tenantSearchError && (
                        <Text style={{ color: '#e53935', fontSize: 13, marginTop: -8, marginBottom: 12, paddingLeft: 4 }}>
                          {tenantSearchError}
                        </Text>
                      )}

                      {/* Quick Create Prompt */}
                      {(!tenantSearchResult && !isCreatingNewTenant && tenantPhoneSearch.trim().length >= 10 && !tenantSearchLoading && suggestions.length === 0) && (
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
                              No tenant found. Create new tenant for &quot;{tenantPhoneSearch}&quot;?
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      {/* Quick Create Form */}
                      {isCreatingNewTenant && (
                        <View style={styles.quickCreateForm}>
                          <Text style={styles.quickCreateTitle}>NEW TENANT DETAILS</Text>
                          
                          <View style={styles.quickCreateField}>
                            <Text style={styles.quickCreateLabel}>PHONE NUMBER</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                              <MaterialIcons name="phone" size={18} color="#7b8a8d" />
                              <TextInput
                                style={[styles.textInput, { color: '#7b8a8d' }]}
                                value={tenantPhoneSearch}
                                editable={false}
                              />
                            </View>
                          </View>

                          <View style={styles.quickCreateField}>
                            <Text style={styles.quickCreateLabel}>FULL NAME</Text>
                            <View style={styles.inputWrapper}>
                              <MaterialIcons name="person" size={18} color="#006875" />
                              <TextInput
                                style={styles.textInput}
                                placeholder="e.g. John Doe"
                                placeholderTextColor="#9ba9ab"
                                value={newTenantName}
                                onChangeText={setNewTenantName}
                              />
                            </View>
                          </View>

                          <View style={styles.quickCreateField}>
                            <Text style={styles.quickCreateLabel}>EMAIL ADDRESS</Text>
                            <View style={styles.inputWrapper}>
                              <MaterialIcons name="email" size={18} color="#006875" />
                              <TextInput
                                style={styles.textInput}
                                placeholder="e.g. john@example.com"
                                placeholderTextColor="#9ba9ab"
                                value={newTenantEmail}
                                onChangeText={setNewTenantEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                              />
                            </View>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                            <TouchableOpacity
                              style={[styles.statusToggle, { flex: 1 }]}
                              onPress={() => setIsCreatingNewTenant(false)}
                            >
                              <Text style={styles.statusToggleText}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.statusToggle, styles.statusActiveOccupied, { flex: 1 }]}
                              onPress={handleCreateAndSelectTenant}
                              disabled={tenantCreating}
                            >
                              {tenantCreating ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Text style={[styles.statusToggleText, styles.statusTextActive]}>CREATE & ASSIGN</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {tenantSearchResult && (
                        <View style={{ gap: 10, marginTop: 4, marginBottom: 12 }}>
                          <View style={{ paddingVertical: 10, paddingHorizontal: 14, backgroundColor: 'rgba(46, 125, 50, 0.05)', borderRadius: 16, borderColor: 'rgba(46, 125, 50, 0.15)', borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1b5e20' }}>{tenantSearchResult.fullName}</Text>
                              <Text style={{ fontSize: 11, color: '#4e7051' }}>{tenantSearchResult.email}</Text>
                            </View>
                            <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
                          </View>

                          <TouchableOpacity
                            style={[styles.statusToggle, styles.statusActiveOccupied, { marginHorizontal: 0, paddingVertical: 14, borderRadius: 16 }]}
                            onPress={() => handleAssignTenant()}
                            disabled={tenantAssigning}
                          >
                            {tenantAssigning ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={[styles.statusToggleText, styles.statusTextActive]}>
                                ASSIGN {tenantSearchResult.fullName.toUpperCase()}
                              </Text>
                            )}
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
      </LinearGradient>
      {renderTypeSelectionModal()}
    </GestureHandlerRootView>
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  toolsPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  toolsWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolsScrollView: {
    flex: 1,
  },
  scrollIndicator: {
    position: 'absolute',
    right: 4,
    top: '50%',
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#006875',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  toolsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7a7d',
    letterSpacing: 1,
    marginBottom: 12,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toolButtonActive: {
    backgroundColor: '#006875',
    borderColor: '#006875',
    shadowOpacity: 0.2,
  },
  toolText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006875',
  },
  toolTextActive: {
    color: '#fff',
  },
  gridWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    marginBottom: 20,
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
  cellDrawingStart: {
    backgroundColor: 'rgba(0, 104, 117, 0.2)',
    borderColor: '#006875',
    borderWidth: 2,
    borderStyle: 'dashed',
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
  cellRentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00e5ff',
    marginTop: 2,
  },
  cellSubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: '#aee4eb',
    letterSpacing: 1,
    marginTop: 2,
  },
  cellSelected: {
    borderColor: '#00e5ff',
    borderWidth: 3,
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
  closeButton: {
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
  placeholderText: {
    fontSize: 14,
    color: '#151d1e',
    fontWeight: '600',
    flex: 1,
  },
  editSmallButton: {
    backgroundColor: 'rgba(0, 104, 117, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  editSmallText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#006875',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#151d1e',
    fontWeight: '600',
    paddingVertical: 4,
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
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
  quickCreateForm: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  quickCreateTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006875',
    letterSpacing: 1,
    marginBottom: 4,
  },
  quickCreateField: {
    gap: 6,
  },
  quickCreateLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6b7a7d',
    letterSpacing: 1,
    paddingLeft: 4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  flex: {
    flex: 1,
  },
  desktopContent: {
    padding: 40,
    flex: 1,
  },
  desktopInner: {
    gap: 32,
    flex: 1,
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
    fontSize: 36,
    fontWeight: '900',
    color: '#151d1e',
    letterSpacing: -0.5,
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
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 24,
  },
  desktopSaveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  desktopMainContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 32,
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
    gap: 24,
  },
  desktopCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  floatingToolbar: {
    position: 'absolute',
    top: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 100,
  },
  floatingToolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  floatingToolButtonActive: {
    backgroundColor: '#006875',
  },
  floatingToolText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006875',
  },
  floatingToolTextActive: {
    color: '#fff',
  },
  floatingDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0, 104, 117, 0.15)',
    marginHorizontal: 8,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  typeModalContent: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    alignItems: 'center',
    overflow: 'hidden',
  },
  typeModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#151d1e',
    marginBottom: 4,
  },
  typeModalSubtitle: {
    fontSize: 14,
    color: '#6b7a7d',
    marginBottom: 20,
    fontWeight: '600',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  typeCard: {
    width: '47%',
    backgroundColor: 'rgba(0, 104, 117, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  typeCardIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeCardLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#151d1e',
    textAlign: 'center',
  },
  typeCardDesc: {
    fontSize: 11,
    color: '#6b7a7d',
    fontWeight: '600',
    textAlign: 'center',
  },
  typeCancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    width: '100%',
    alignItems: 'center',
  },
  typeCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7a7d',
  },
});
