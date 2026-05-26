import React, { useRef, useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Animated, TouchableOpacity,
  ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { getActiveChargesForProperty, ChargeConfigResponse } from '../api/charge.api';
import { getWorksheet, batchSaveReadings, MeterReadingResponse } from '../api/meterReading.api';

export default function MeterReadingScreen({ token }: { token: string | null }) {
  const router = useRouter();
  const { id: propertyId } = useLocalSearchParams<{ id: string }>();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [configs, setConfigs] = useState<ChargeConfigResponse[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  
  // Date context
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [worksheet, setWorksheet] = useState<MeterReadingResponse[]>([]);
  
  // Local inputs state: unitId -> string value
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const [expandedFloors, setExpandedFloors] = useState<Record<number, boolean>>({});

  const toggleFloor = (floor: number) => {
    setExpandedFloors(prev => ({ ...prev, [floor]: !prev[floor] }));
  };

  useEffect(() => {
    if (token && propertyId) {
      loadConfigs();
    }
  }, [token, propertyId]);

  useEffect(() => {
    if (selectedConfigId && token && propertyId) {
      loadWorksheet();
    }
  }, [selectedConfigId, month, year, token, propertyId]);

  const loadConfigs = async () => {
    try {
      setIsLoading(true);
      const allCharges = await getActiveChargesForProperty(propertyId as string, token as string);
      const meteredCharges = allCharges.filter(c => c.calculationStrategy === 'METERED');
      setConfigs(meteredCharges);
      if (meteredCharges.length > 0) {
        setSelectedConfigId(meteredCharges[0].id);
      }
    } catch (e: any) {
      Alert.alert("Error", "Failed to load utility configurations.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorksheet = async () => {
    if (!selectedConfigId || !token || !propertyId) return;
    try {
      setIsLoading(true);
      const data = await getWorksheet(propertyId as string, selectedConfigId, month, year, token);
      setWorksheet(data);
      
      const newInputs: Record<string, string> = {};
      data.forEach(item => {
        newInputs[item.unitId] = item.currentReading ? item.currentReading.toString() : '';
      });
      setInputs(newInputs);
    } catch (e: any) {
      Alert.alert("Error", "Failed to load worksheet.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedConfigId || !token || !propertyId) return;
    
    let hasErrors = false;
    
    worksheet.forEach(row => {
      const valStr = inputs[row.unitId];
      if (valStr) {
        const val = parseFloat(valStr);
        if (val < row.previousReading) {
          hasErrors = true;
        }
      }
    });

    if (hasErrors) {
      Alert.alert("Validation Error", "One or more entries are less than the previous reading. Please correct them before saving.");
      return;
    }

    try {
      setIsSaving(true);
      const readingsToSave = worksheet.map(row => ({
        unitId: row.unitId,
        currentReading: inputs[row.unitId] ? parseFloat(inputs[row.unitId]) : null
      }));

      await batchSaveReadings({
        propertyId: propertyId as string,
        chargeConfigId: selectedConfigId,
        billingMonth: month,
        billingYear: year,
        readings: readingsToSave
      }, token);

      Alert.alert("Success", "Readings saved successfully!");
    } catch (e: any) {
      Alert.alert("Error", "Failed to save readings.");
    } finally {
      setIsSaving(false);
    }
  };

  const getMonthName = (m: number) => {
    const date = new Date();
    date.setMonth(m - 1);
    return date.toLocaleString('default', { month: 'long' });
  };
  
  const changeMonth = (delta: number) => {
    let newM = month + delta;
    let newY = year;
    if (newM > 12) { newM = 1; newY++; }
    if (newM < 1) { newM = 12; newY--; }
    setMonth(newM);
    setYear(newY);
  };

  const selectedConfig = configs.find(c => c.id === selectedConfigId);
  const baseRate = selectedConfig?.baseRate || 0;

  const groupedWorksheet = worksheet.reduce((acc, row) => {
    const floor = row.floor ?? 0;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(row);
    return acc;
  }, {} as Record<number, typeof worksheet>);

  const sortedFloors = Object.keys(groupedWorksheet).map(Number).sort((a, b) => a - b);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
    <LinearGradient colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Meter Readings</Text>
            <Text style={styles.headerSubtitle}>Batch Worksheet Data Entry</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.headerSaveBtn, (isSaving || worksheet.length === 0) && { opacity: 0.5 }]} 
            onPress={handleSave}
            disabled={isSaving || worksheet.length === 0}
          >
            {isSaving ? <ActivityIndicator color="#006875" size="small" /> : (
              <Text style={styles.headerSaveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer}>
            {configs.map(config => (
              <TouchableOpacity 
                key={config.id}
                style={[styles.pill, selectedConfigId === config.id && styles.pillActive]}
                onPress={() => setSelectedConfigId(config.id)}
              >
                <Text style={[styles.pillText, selectedConfigId === config.id && styles.pillTextActive]}>
                  {config.chargeName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
              <MaterialIcons name="chevron-left" size={24} color="#006875" />
            </TouchableOpacity>
            <Text style={styles.monthText}>{getMonthName(month)} {year}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
              <MaterialIcons name="chevron-right" size={24} color="#006875" />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
          {isLoading ? (
            <ActivityIndicator size="large" color="#006875" style={{ marginTop: 50 }} />
          ) : worksheet.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No metered units found for this configuration.</Text>
            </View>
          ) : (
            sortedFloors.map(floor => {
              const isExpanded = expandedFloors[floor];
              return (
                <BlurView intensity={60} tint="light" key={`floor-${floor}`} style={styles.floorCard}>
                  <TouchableOpacity 
                    style={styles.floorHeader}
                    onPress={() => toggleFloor(floor)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.floorHeaderText}>
                      {floor === 0 ? 'Ground Floor' : `Floor ${floor}`}
                    </Text>
                    <MaterialIcons 
                      name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                      size={24} 
                      color="#006875" 
                    />
                  </TouchableOpacity>
                  
                  {isExpanded && groupedWorksheet[floor].map((row, index) => {
                    const currentVal = inputs[row.unitId] ? parseFloat(inputs[row.unitId]) : null;
                    const consumed = currentVal !== null ? currentVal - row.previousReading : 0;
                    const isError = currentVal !== null && currentVal < row.previousReading;
                    const estCost = consumed > 0 ? consumed * baseRate : 0;
                    
                    // We don't want a bottom border on the very last item in the card
                    const isLast = index === groupedWorksheet[floor].length - 1;
                    
                    return (
                      <View key={row.id} style={[styles.rowCard, isError && styles.rowError, isLast && { borderBottomWidth: 0 }]}>
                        <View style={styles.rowLeft}>
                          <Text style={styles.unitName}>{row.unitName}</Text>
                          <Text style={styles.tenantName}>{row.tenantName}</Text>
                          <Text style={styles.prevReading}>Prev: {row.previousReading}</Text>
                        </View>
                        
                        <View style={styles.rowMiddle}>
                          {currentVal !== null && (
                            <>
                              <Text style={[styles.consumedText, isError && { color: '#ef4444' }]}>
                                {consumed > 0 ? '+' : ''}{consumed} {selectedConfig?.unitType || 'Units'}
                              </Text>
                              {!isError && <Text style={styles.costText}>Est: ₹{estCost.toFixed(2)}</Text>}
                            </>
                          )}
                        </View>
                        
                        <View style={styles.rowRight}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                            <TextInput
                              ref={(ref) => { inputRefs.current[row.unitId] = ref; }}
                              style={[styles.input, isError && styles.inputError, { flex: 1 }]}
                              keyboardType="decimal-pad"
                              placeholder="0.00"
                              placeholderTextColor="#a0aab2"
                              value={inputs[row.unitId]}
                              onChangeText={(val) => setInputs(prev => ({ ...prev, [row.unitId]: val }))}
                              returnKeyType="next"
                              editable={!row.isBilled}
                            />
                            <Text style={{ marginLeft: 6, fontSize: 13, color: '#5b6b6d', fontWeight: '600' }}>
                              {selectedConfig?.unitType || 'Units'}
                            </Text>
                          </View>
                          {isError && <Text style={styles.errorText}>Invalid</Text>}
                        </View>
                      </View>
                    );
                  })}
                </BlurView>
            );
          })
        )}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>

      </SafeAreaView>
    </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 16,
  },
  backButton: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#151d1e' },
  headerSubtitle: { fontSize: 14, color: '#6b7a7d', fontWeight: '500' },
  
  filterSection: { paddingHorizontal: 20, marginBottom: 20 },
  pillsContainer: { paddingBottom: 16, gap: 10 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.8)',
    marginRight: 10,
  },
  pillActive: { backgroundColor: '#00bcd4', borderColor: '#00bcd4' },
  pillText: { color: '#5b6b6d', fontWeight: '600', fontSize: 14 },
  pillTextActive: { color: '#fff' },
  
  monthSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16, paddingVertical: 8,
  },
  monthBtn: { padding: 8 },
  monthText: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#006875' },
  
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#6b7a7d', fontSize: 16 },
  
  floorCard: {
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  floorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  floorHeaderText: { fontSize: 16, fontWeight: '800', color: '#006875' },
  
  rowCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0, 104, 117, 0.1)',
  },
  rowError: { backgroundColor: 'rgba(254, 226, 226, 0.4)', borderRadius: 12, paddingHorizontal: 8 },
  
  rowLeft: { flex: 2 },
  unitName: { fontSize: 16, fontWeight: '700', color: '#151d1e' },
  tenantName: { fontSize: 13, color: '#5b6b6d', marginVertical: 2 },
  prevReading: { fontSize: 11, color: '#849495', fontWeight: '600' },
  
  rowMiddle: { flex: 1.5, alignItems: 'flex-end', paddingRight: 12 },
  consumedText: { fontSize: 14, fontWeight: '700', color: '#006875' },
  costText: { fontSize: 11, color: '#2e7d32', fontWeight: '600', marginTop: 2 },
  
  rowRight: { flex: 1.5, alignItems: 'flex-end' },
  input: {
    backgroundColor: '#fff', borderRadius: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
    width: '100%', paddingVertical: 10, paddingHorizontal: 12,
    fontSize: 16, fontWeight: '600', color: '#151d1e', textAlign: 'right',
  },
  inputError: { borderColor: '#ef4444', color: '#ef4444' },
  errorText: { fontSize: 10, color: '#ef4444', fontWeight: '600', marginTop: 4 },
  
  headerSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 12,
  },
  headerSaveText: {
    color: '#006875',
    fontWeight: '700',
    fontSize: 14,
  },
});
