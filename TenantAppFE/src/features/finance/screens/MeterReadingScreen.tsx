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
import { getActiveChargesForProperty, ChargeConfigResponse } from '@/src/features/finance/api/charge.api';
import { getWorksheet, batchSaveReadings, MeterReadingResponse } from '@/src/features/finance/api/meterReading.api';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import { useResponsive } from '@/hooks/useResponsive';

export default function MeterReadingScreen({ token }: { token: string | null }) {
  const router = useRouter();
  const { id: propertyId } = useLocalSearchParams<{ id: string }>();
  const { isDesktop } = useResponsive();
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
  const [prevInputs, setPrevInputs] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const [expandedFloors, setExpandedFloors] = useState<Record<number, boolean>>({});
  const [floorPages, setFloorPages] = useState<Record<number, number>>({});
  const [floorPage, setFloorPage] = useState(1);

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
      setFloorPages({});
      setFloorPage(1);
    }
  }, [selectedConfigId, month, year, token, propertyId]);

  useEffect(() => {
    if (worksheet.length > 0) {
      // Keep all closed by default!
      setExpandedFloors({});
      setFloorPages({});
      setFloorPage(1);
    }
  }, [worksheet]);

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
      const newPrevInputs: Record<string, string> = {};
      data.forEach(item => {
        newInputs[item.unitId] = item.currentReading ? item.currentReading.toString() : '';
        newPrevInputs[item.unitId] = item.previousReading != null ? item.previousReading.toString() : '0';
      });
      setInputs(newInputs);
      setPrevInputs(newPrevInputs);
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
      const prevValStr = prevInputs[row.unitId];
      const prevVal = prevValStr ? parseFloat(prevValStr) : 0;
      if (valStr) {
        const val = parseFloat(valStr);
        if (val < prevVal) {
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
        previousReading: prevInputs[row.unitId] ? parseFloat(prevInputs[row.unitId]) : row.previousReading,
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
  const floorsPerPage = 4;
  const totalFloorPages = Math.ceil(sortedFloors.length / floorsPerPage);
  const startFloorIndex = (floorPage - 1) * floorsPerPage;
  const paginatedFloors = sortedFloors.slice(startFloorIndex, startFloorIndex + floorsPerPage);

  const totalUnits = worksheet.length;
  const readingsEntered = worksheet.filter(row => inputs[row.unitId] && inputs[row.unitId].trim() !== '').length;

  let totalConsumption = 0;
  let totalEstimatedCost = 0;

  worksheet.forEach(row => {
    const valStr = inputs[row.unitId];
    if (valStr && valStr.trim() !== '') {
      const val = parseFloat(valStr);
      if (!isNaN(val) && val >= row.previousReading) {
        const consumed = val - row.previousReading;
        totalConsumption += consumed;
        totalEstimatedCost += consumed * baseRate;
      }
    }
  });

  const renderDesktopShell = () => (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.desktopShell}
    >
      <View style={styles.desktopMain}>
        <DesktopNavBar 
          activeTab="Properties" 
          onBack={() => router.back()} 
          backText="Back to Property" 
        />

        <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
          <View style={styles.desktopInner}>
            {/* Header Row */}
            <View style={styles.desktopHeaderRow}>
              <View style={styles.largeTitleContainer}>
                <Text style={styles.titleLineDesktop}>Meter Readings</Text>
              </View>

              {/* Action Save Button */}
              <TouchableOpacity 
                style={[styles.desktopSaveButtonWrapper, (isSaving || worksheet.length === 0) && { opacity: 0.5 }]} 
                onPress={handleSave}
                disabled={isSaving || worksheet.length === 0}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#00d4ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.desktopSaveButton}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.desktopSaveButtonText}>SAVE READINGS</Text>
                      <MaterialIcons name="check" size={18} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Filter Section Row */}
            <View style={styles.desktopFilterRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterLabelCaps}>UTILITY CONFIGURATION</Text>
                <GlassDropdown 
                  options={configs.map(c => ({ label: c.chargeName, value: c.id }))}
                  value={selectedConfigId}
                  onChange={setSelectedConfigId}
                  placeholder="Select Utility"
                  icon="receipt-long"
                />
              </View>
              
              <View style={{ width: 300 }}>
                <Text style={styles.filterLabelCaps}>BILLING PERIOD</Text>
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
            </View>

            {/* Main Content Grid */}
            {isLoading ? (
              <ActivityIndicator size="large" color="#006875" style={{ marginTop: 80 }} />
            ) : worksheet.length === 0 ? (
              <BlurView intensity={60} tint="light" style={styles.emptyStateCard}>
                <MaterialIcons name="receipt-long" size={48} color="#6b7a7d" style={{ marginBottom: 16 }} />
                <Text style={styles.emptyText}>No metered units found for this configuration.</Text>
              </BlurView>
            ) : (
              <View style={styles.desktopGrid}>
                {/* Left Column: Floor Cards */}
                <View style={styles.desktopLeftColumn}>
                  {worksheet.length > 0 && (
                    <View style={styles.listControlsRow}>
                      <TouchableOpacity 
                        style={styles.controlLink}
                        onPress={() => {
                          const allExpanded: Record<number, boolean> = {};
                          sortedFloors.forEach(f => allExpanded[f] = true);
                          setExpandedFloors(allExpanded);
                        }}
                      >
                        <MaterialIcons name="unfold-more" size={16} color="#006875" />
                        <Text style={styles.controlLinkText}>EXPAND ALL</Text>
                      </TouchableOpacity>
                      <View style={styles.controlSeparator} />
                      <TouchableOpacity 
                        style={styles.controlLink}
                        onPress={() => {
                          setExpandedFloors({});
                        }}
                      >
                        <MaterialIcons name="unfold-less" size={16} color="#006875" />
                        <Text style={styles.controlLinkText}>COLLAPSE ALL</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {paginatedFloors.map(floor => {
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
                        
                        {(() => {
                          if (!isExpanded) return null;
                          const unitsPerFloorPage = 4;
                          const floorUnits = groupedWorksheet[floor] || [];
                          const totalFloorPagesUnits = Math.ceil(floorUnits.length / unitsPerFloorPage);
                          const currentPage = floorPages[floor] || 1;
                          const startIndex = (currentPage - 1) * unitsPerFloorPage;
                          const paginatedUnits = floorUnits.slice(startIndex, startIndex + unitsPerFloorPage);

                          return (
                            <>
                              {paginatedUnits.map((row, index) => {
                                const currentVal = inputs[row.unitId] ? parseFloat(inputs[row.unitId]) : null;
                                const consumed = currentVal !== null ? currentVal - row.previousReading : 0;
                                const isError = currentVal !== null && currentVal < row.previousReading;
                                const estCost = consumed > 0 ? consumed * baseRate : 0;
                                const isLast = index === paginatedUnits.length - 1;
                                
                                return (
                                  <View key={row.id} style={[styles.rowCard, isError && styles.rowError, isLast && { borderBottomWidth: 0 }]}>
                                    <View style={styles.rowLeft}>
                                      <Text style={styles.unitName}>{row.unitName}</Text>
                                      <Text style={styles.tenantName}>{row.tenantName}</Text>
                                      {!row.isBilled ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                          <Text style={[styles.prevReading, { marginRight: 4 }]}>Prev:</Text>
                                          <TextInput
                                            style={{
                                              borderWidth: 1,
                                              borderColor: 'rgba(0, 104, 117, 0.2)',
                                              backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                              borderRadius: 6,
                                              paddingHorizontal: 6,
                                              paddingVertical: 2,
                                              fontSize: 12,
                                              width: 70,
                                              color: '#163235',
                                              fontWeight: '600',
                                            }}
                                            keyboardType="decimal-pad"
                                            value={prevInputs[row.unitId]}
                                            onChangeText={(val) => setPrevInputs(prev => ({ ...prev, [row.unitId]: val }))}
                                          />
                                        </View>
                                      ) : (
                                        <Text style={styles.prevReading}>Prev: {row.previousReading}</Text>
                                      )}
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

                              {totalFloorPagesUnits > 1 && (
                                <View style={styles.paginationRow}>
                                  <TouchableOpacity 
                                    style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                                    disabled={currentPage === 1}
                                    onPress={() => setFloorPages(prev => ({ ...prev, [floor]: currentPage - 1 }))}
                                  >
                                    <MaterialIcons name="chevron-left" size={20} color={currentPage === 1 ? '#a0aab2' : '#006875'} />
                                    <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>Prev</Text>
                                  </TouchableOpacity>
                                  
                                  <Text style={styles.pageInfoText}>
                                    Page {currentPage} of {totalFloorPagesUnits}
                                  </Text>
                                  
                                  <TouchableOpacity 
                                    style={[styles.pageButton, currentPage === totalFloorPagesUnits && styles.pageButtonDisabled]}
                                    disabled={currentPage === totalFloorPagesUnits}
                                    onPress={() => setFloorPages(prev => ({ ...prev, [floor]: currentPage + 1 }))}
                                  >
                                    <Text style={[styles.pageButtonText, currentPage === totalFloorPagesUnits && styles.pageButtonTextDisabled]}>Next</Text>
                                    <MaterialIcons name="chevron-right" size={20} color={currentPage === totalFloorPagesUnits ? '#a0aab2' : '#006875'} />
                                  </TouchableOpacity>
                                </View>
                              )}
                            </>
                          );
                        })()}
                      </BlurView>
                    );
                  })}

                  {totalFloorPages > 1 && (
                    <View style={styles.paginationRow}>
                      <TouchableOpacity 
                        style={[styles.pageButton, floorPage === 1 && styles.pageButtonDisabled]}
                        disabled={floorPage === 1}
                        onPress={() => setFloorPage(prev => Math.max(1, prev - 1))}
                      >
                        <MaterialIcons name="chevron-left" size={20} color={floorPage === 1 ? '#a0aab2' : '#006875'} />
                        <Text style={[styles.pageButtonText, floorPage === 1 && styles.pageButtonTextDisabled]}>Prev Floors</Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.pageInfoText}>
                        Page {floorPage} of {totalFloorPages}
                      </Text>
                      
                      <TouchableOpacity 
                        style={[styles.pageButton, floorPage === totalFloorPages && styles.pageButtonDisabled]}
                        disabled={floorPage === totalFloorPages}
                        onPress={() => setFloorPage(prev => Math.min(totalFloorPages, prev + 1))}
                      >
                        <Text style={[styles.pageButtonText, floorPage === totalFloorPages && styles.pageButtonTextDisabled]}>Next Floors</Text>
                        <MaterialIcons name="chevron-right" size={20} color={floorPage === totalFloorPages ? '#a0aab2' : '#006875'} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Right Column: Dashboard Summary Panel */}
                <View style={styles.desktopRightColumn}>
                  <BlurView intensity={80} tint="light" style={styles.summaryCard}>
                    <Text style={styles.summaryCardTitle}>WORKSHEET SUMMARY</Text>
                    
                    <View style={styles.summaryMetricsGrid}>
                      <View style={styles.summaryMetricItem}>
                        <Text style={styles.summaryMetricLabel}>TOTAL UNITS</Text>
                        <Text style={styles.summaryMetricValue}>{totalUnits}</Text>
                      </View>
                      <View style={styles.summaryMetricItem}>
                        <Text style={styles.summaryMetricLabel}>READINGS ENTERED</Text>
                        <Text style={styles.summaryMetricValue}>{readingsEntered} / {totalUnits}</Text>
                      </View>
                    </View>

                    <View style={styles.previewDivider} />

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Utility Charge</Text>
                      <Text style={styles.summaryValue}>{selectedConfig?.chargeName || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Rate</Text>
                      <Text style={styles.summaryValue}>₹{baseRate} / {selectedConfig?.unitType || 'unit'}</Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Billing Period</Text>
                      <Text style={styles.summaryValue}>{getMonthName(month)} {year}</Text>
                    </View>

                    <View style={styles.previewDivider} />

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Consumption</Text>
                      <Text style={[styles.summaryValue, { color: '#006875', fontSize: 16 }]}>
                        {totalConsumption.toFixed(2)} {selectedConfig?.unitType || 'Units'}
                      </Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Estimated Billing</Text>
                      <Text style={[styles.summaryValue, { color: '#2e7d32', fontSize: 20, fontWeight: '800' }]}>
                        ₹{totalEstimatedCost.toFixed(2)}
                      </Text>
                    </View>

                    {readingsEntered < totalUnits && (
                      <View style={styles.warningAlertBox}>
                        <MaterialIcons name="info-outline" size={18} color="#765a00" />
                        <Text style={styles.warningAlertText}>
                          {totalUnits - readingsEntered} unit(s) are missing current month readings.
                        </Text>
                      </View>
                    )}
                  </BlurView>
                </View>
              </View>
            )}
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
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Meter Readings</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.headerSaveBtnWrapper, (isSaving || worksheet.length === 0) && { opacity: 0.5 }]} 
            onPress={handleSave}
            disabled={isSaving || worksheet.length === 0}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#00d4ff', '#0072ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerSaveBtn}
            >
              {isSaving ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Text style={styles.headerSaveText}>SAVE</Text>
                  <MaterialIcons name="check" size={14} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <GlassDropdown 
            options={configs.map(c => ({ label: c.chargeName, value: c.id }))}
            value={selectedConfigId}
            onChange={setSelectedConfigId}
            placeholder="Select Utility"
            icon="receipt-long"
          />
          
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
            <>
              <View style={styles.listControlsRowMobile}>
                <TouchableOpacity 
                  style={styles.controlLink}
                  onPress={() => {
                    const allExpanded: Record<number, boolean> = {};
                    sortedFloors.forEach(f => allExpanded[f] = true);
                    setExpandedFloors(allExpanded);
                  }}
                >
                  <MaterialIcons name="unfold-more" size={16} color="#006875" />
                  <Text style={styles.controlLinkText}>EXPAND ALL</Text>
                </TouchableOpacity>
                <View style={styles.controlSeparator} />
                <TouchableOpacity 
                  style={styles.controlLink}
                  onPress={() => {
                    setExpandedFloors({});
                  }}
                >
                  <MaterialIcons name="unfold-less" size={16} color="#006875" />
                  <Text style={styles.controlLinkText}>COLLAPSE ALL</Text>
                </TouchableOpacity>
              </View>

              {paginatedFloors.map(floor => {
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
                    
                    {(() => {
                      if (!isExpanded) return null;
                      const unitsPerFloorPage = 4;
                      const floorUnits = groupedWorksheet[floor] || [];
                      const totalFloorPagesUnits = Math.ceil(floorUnits.length / unitsPerFloorPage);
                      const currentPage = floorPages[floor] || 1;
                      const startIndex = (currentPage - 1) * unitsPerFloorPage;
                      const paginatedUnits = floorUnits.slice(startIndex, startIndex + unitsPerFloorPage);

                      return (
                        <>
                          {paginatedUnits.map((row, index) => {
                            const currentVal = inputs[row.unitId] ? parseFloat(inputs[row.unitId]) : null;
                            const consumed = currentVal !== null ? currentVal - row.previousReading : 0;
                            const isError = currentVal !== null && currentVal < row.previousReading;
                            const estCost = consumed > 0 ? consumed * baseRate : 0;
                            const isLast = index === paginatedUnits.length - 1;
                            
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

                          {totalFloorPagesUnits > 1 && (
                            <View style={styles.paginationRow}>
                              <TouchableOpacity 
                                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                                disabled={currentPage === 1}
                                onPress={() => setFloorPages(prev => ({ ...prev, [floor]: currentPage - 1 }))}
                              >
                                <MaterialIcons name="chevron-left" size={20} color={currentPage === 1 ? '#a0aab2' : '#006875'} />
                                <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>Prev</Text>
                              </TouchableOpacity>
                              
                              <Text style={styles.pageInfoText}>
                                Page {currentPage} of {totalFloorPagesUnits}
                              </Text>
                              
                              <TouchableOpacity 
                                style={[styles.pageButton, currentPage === totalFloorPagesUnits && styles.pageButtonDisabled]}
                                disabled={currentPage === totalFloorPagesUnits}
                                onPress={() => setFloorPages(prev => ({ ...prev, [floor]: currentPage + 1 }))}
                              >
                                <Text style={[styles.pageButtonText, currentPage === totalFloorPagesUnits && styles.pageButtonTextDisabled]}>Next</Text>
                                <MaterialIcons name="chevron-right" size={20} color={currentPage === totalFloorPagesUnits ? '#a0aab2' : '#006875'} />
                              </TouchableOpacity>
                            </View>
                          )}
                        </>
                      );
                    })()}
                  </BlurView>
                );
              })}

              {totalFloorPages > 1 && (
                <View style={styles.paginationRow}>
                  <TouchableOpacity 
                    style={[styles.pageButton, floorPage === 1 && styles.pageButtonDisabled]}
                    disabled={floorPage === 1}
                    onPress={() => setFloorPage(prev => Math.max(1, prev - 1))}
                  >
                    <MaterialIcons name="chevron-left" size={20} color={floorPage === 1 ? '#a0aab2' : '#006875'} />
                    <Text style={[styles.pageButtonText, floorPage === 1 && styles.pageButtonTextDisabled]}>Prev Floors</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.pageInfoText}>
                    Page {floorPage} of {totalFloorPages}
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.pageButton, floorPage === totalFloorPages && styles.pageButtonDisabled]}
                    disabled={floorPage === totalFloorPages}
                    onPress={() => setFloorPage(prev => Math.min(totalFloorPages, prev + 1))}
                  >
                    <Text style={[styles.pageButtonText, floorPage === totalFloorPages && styles.pageButtonTextDisabled]}>Next Floors</Text>
                    <MaterialIcons name="chevron-right" size={20} color={floorPage === totalFloorPages ? '#a0aab2' : '#006875'} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      {isDesktop ? renderDesktopShell() : renderMobileShell()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40, 
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  headerTitleContainer: { 
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#151d1e' },
  headerSubtitle: { fontSize: 12, color: '#6b7a7d', fontWeight: '500', marginTop: 2 },
  
  headerSaveBtnWrapper: {
    borderRadius: 19,
    overflow: 'hidden',
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
    marginLeft: 12,
  },
  headerSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    paddingHorizontal: 16,
  },
  headerSaveText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  filterSection: { paddingHorizontal: 24, marginBottom: 20 },
  
  monthSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 12, 
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
  },
  monthBtn: { padding: 8 },
  monthText: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#006875' },
  
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#6b7a7d', fontSize: 16 },
  
  floorCard: {
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 24,
    overflow: 'hidden',
    shadowColor: '#006875',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 3,
  },
  floorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  floorHeaderText: { fontSize: 18, fontWeight: '800', color: '#006875' },
  
  rowCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 20,
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
  
  rowRight: { flex: 2, alignItems: 'flex-end' },
  input: {
    backgroundColor: '#fff', 
    borderRadius: 10,
    borderWidth: 1, 
    borderColor: 'rgba(0, 104, 117, 0.15)',
    width: '100%', 
    paddingVertical: 10, 
    paddingHorizontal: 12,
    fontSize: 16, 
    fontWeight: '600', 
    color: '#151d1e', 
    textAlign: 'right',
  },
  inputError: { borderColor: '#ef4444', color: '#ef4444' },
  errorText: { fontSize: 10, color: '#ef4444', fontWeight: '600', marginTop: 4 },

  // Desktop specific styles
  desktopShell: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopMain: {
    flex: 1,
    height: '100%',
  },
  topbar: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  topbarTabs: {
    flexDirection: 'row',
    gap: 32,
  },
  topbarTab: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7a7d',
  },
  topbarTabActive: {
    color: '#006875',
    fontWeight: '800',
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
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  backButtonTextDesktop: {
    fontSize: 13,
    fontWeight: '700',
    color: '#151d1e',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#006875',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  desktopContent: {
    paddingBottom: 80,
  },
  desktopInner: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  desktopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  largeTitleContainer: {
    flex: 1,
  },
  titleLineDesktop: {
    fontSize: 32,
    fontWeight: '800',
    color: '#151d1e',
  },
  desktopSubtitle: {
    fontSize: 14,
    color: '#6b7a7d',
    fontWeight: '500',
    marginTop: 4,
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
    height: 46,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  desktopSaveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  desktopFilterRow: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  filterLabelCaps: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5b6b6d',
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptyStateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  desktopLeftColumn: {
    flex: 1.6,
    gap: 24,
  },
  desktopRightColumn: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#006875',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 3,
    position: 'sticky',
    top: 24,
  },
  summaryCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#006875',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  summaryMetricsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  summaryMetricItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  summaryMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5b6b6d',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryMetricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#151d1e',
  },
  previewDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 104, 117, 0.1)',
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#5b6b6d',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#151d1e',
    fontWeight: '700',
  },
  warningAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginTop: 20,
  },
  warningAlertText: {
    fontSize: 12,
    color: '#765a00',
    fontWeight: '600',
    flex: 1,
  },
  // Pagination & List Controls styles
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#006875',
  },
  pageButtonTextDisabled: {
    color: '#a0aab2',
  },
  pageInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#151d1e',
  },
  listControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  listControlsRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  controlLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 104, 117, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.1)',
  },
  controlLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006875',
    letterSpacing: 0.5,
  },
  controlSeparator: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(0, 104, 117, 0.15)',
  },
});
