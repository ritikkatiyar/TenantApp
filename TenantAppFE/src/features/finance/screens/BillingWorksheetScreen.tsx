import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  TextInput,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useResponsive } from '@/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import GlassDropdown, { DropdownOption } from '@/src/components/common/inputs/GlassDropdown';
import { useProperties } from '@/src/hooks/useProperties';
import { getActiveChargesForProperty, ChargeConfigResponse } from '@/src/features/finance/api/charge.api';
import { getOrCreateWorksheet, batchSaveWorksheet, WorksheetEntryResponse } from '@/src/features/finance/api/worksheet.api';

export default function BillingWorksheetScreen({ token }: { token: string | null }) {
  const router = useRouter();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();
  const propertyId = paramPropertyId || (properties && properties.length > 0 ? properties[0].id : null);
  
  const [charges, setCharges] = useState<ChargeConfigResponse[]>([]);
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
  const [billingMonth, setBillingMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [entries, setEntries] = useState<WorksheetEntryResponse[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  
  const [isLoadingCharges, setIsLoadingCharges] = useState(false);
  const [isLoadingWorksheet, setIsLoadingWorksheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [expandedFloors, setExpandedFloors] = useState<Record<number, boolean>>({});
  const [floorPages, setFloorPages] = useState<Record<number, number>>({});
  const [floorPage, setFloorPage] = useState(1);

  const toggleFloor = (floor: number) => {
    setExpandedFloors(prev => ({ ...prev, [floor]: !prev[floor] }));
  };

  useEffect(() => {
    if (entries.length > 0) {
      setExpandedFloors({});
      setFloorPages({});
      setFloorPage(1);
    }
  }, [entries]);

  useEffect(() => {
    const fetchCharges = async () => {
      if (!token || !propertyId) return;
      try {
        setIsLoadingCharges(true);
        const data = await getActiveChargesForProperty(propertyId, token);
        setCharges(data);
        if (data.length > 0) {
          const rentCharge = data.find(c => c.chargeCategory === 'RENT');
          setSelectedChargeId(rentCharge ? rentCharge.id : data[0].id);
        }
      } catch (error) {
        console.error("Failed to load charges", error);
      } finally {
        setIsLoadingCharges(false);
      }
    };
    fetchCharges();
  }, [propertyId, token]);

  useEffect(() => {
    const fetchWorksheet = async () => {
      if (!token || !propertyId || !selectedChargeId) return;
      try {
        setIsLoadingWorksheet(true);
        const data = await getOrCreateWorksheet(propertyId, selectedChargeId, billingMonth, token);
        setEntries(data);
        
        const initialValues: Record<string, string> = {};
        data.forEach(entry => {
          initialValues[entry.unitId] = entry.enteredValue !== null && entry.enteredValue !== undefined 
            ? entry.enteredValue.toString() 
            : '';
        });
        setEditValues(initialValues);
        
      } catch (error) {
        console.error("Failed to load worksheet", error);
      } finally {
        setIsLoadingWorksheet(false);
      }
    };
    fetchWorksheet();
  }, [propertyId, selectedChargeId, billingMonth, token]);

  const handleSave = async () => {
    if (!token || !propertyId || !selectedChargeId) return;
    try {
      setIsSaving(true);
      const payloadEntries = Object.entries(editValues).map(([unitId, val]) => ({
        unitId,
        enteredValue: val ? parseFloat(val) : 0
      }));
      
      await batchSaveWorksheet({
        propertyId,
        chargeConfigId: selectedChargeId,
        billingMonth,
        entries: payloadEntries
      }, token);
      
      if (Platform.OS === 'web') {
        alert("Worksheet saved successfully!");
      } else {
        Alert.alert("Success", "Worksheet saved successfully!");
      }
    } catch (error: any) {
      if (Platform.OS === 'web') {
        alert(error.message || "Failed to save worksheet");
      } else {
        Alert.alert("Error", error.message || "Failed to save worksheet");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const groupedWorksheet = entries.reduce((acc, row) => {
    const floor = row.floor ?? 0;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(row);
    return acc;
  }, {} as Record<number, typeof entries>);

  const sortedFloors = Object.keys(groupedWorksheet).map(Number).sort((a, b) => a - b);
  const floorsPerPage = 4;
  const totalFloorPages = Math.ceil(sortedFloors.length / floorsPerPage);
  const startFloorIndex = (floorPage - 1) * floorsPerPage;
  const paginatedFloors = sortedFloors.slice(startFloorIndex, startFloorIndex + floorsPerPage);

  const selectedCharge = charges.find(c => c.id === selectedChargeId);

  const renderFloorsList = () => (
    <View style={{ flex: 1 }}>
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
                  {paginatedUnits.map((entry, index) => {
                    const isLast = index === paginatedUnits.length - 1;
                    return (
                      <View key={entry.id} style={[styles.rowCard, isLast && { borderBottomWidth: 0 }]}>
                        <View style={styles.rowLeft}>
                          <Text style={styles.unitName}>{entry.unitName}</Text>
                          <Text style={styles.tenantName} numberOfLines={1}>{entry.tenantName}</Text>
                        </View>
                        
                        <View style={styles.rowRight}>
                          {entry.isBilled ? (
                            <View style={styles.billedBadge}>
                              <Text style={styles.billedBadgeText}>BILLED (₹{entry.enteredValue})</Text>
                            </View>
                          ) : (
                            <View style={styles.inputWrapper}>
                              {selectedCharge?.calculationStrategy !== 'METERED' && (
                                <Text style={styles.currencySymbol}>₹</Text>
                              )}
                              <TextInput
                                style={[styles.input, selectedCharge?.calculationStrategy !== 'METERED' && { paddingLeft: 24 }]}
                                value={editValues[entry.unitId]}
                                onChangeText={(val) => setEditValues(prev => ({ ...prev, [entry.unitId]: val }))}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#9ba9ab"
                              />
                            </View>
                          )}
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
        <View style={styles.mainPaginationRow}>
          <TouchableOpacity 
            style={[styles.pageButton, floorPage === 1 && styles.pageButtonDisabled]}
            disabled={floorPage === 1}
            onPress={() => setFloorPage(prev => Math.max(1, prev - 1))}
          >
            <MaterialIcons name="chevron-left" size={20} color={floorPage === 1 ? '#a0aab2' : '#006875'} />
            <Text style={[styles.pageButtonText, floorPage === 1 && styles.pageButtonTextDisabled]}>Prev Floors</Text>
          </TouchableOpacity>
          
          <Text style={styles.pageInfoText}>
            Floors Page {floorPage} of {totalFloorPages}
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
  );

  const renderDesktopShell = () => (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.desktopShell}
    >
      <View style={styles.desktopMain}>
        <DesktopNavBar 
          activeTab="Finance" 
          onBack={() => router.back()} 
          backText="Back to Settings" 
        />

        <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
          <View style={styles.desktopInner}>
            {/* Header Row */}
            <View style={styles.desktopHeaderRow}>
              <View style={styles.largeTitleContainer}>
                <Text style={styles.titleLineDesktop}>Billing Worksheets</Text>
              </View>

              {/* Action Save Button */}
              <TouchableOpacity 
                style={[styles.desktopSaveButtonWrapper, (isSaving || entries.length === 0) && { opacity: 0.5 }]} 
                onPress={handleSave}
                disabled={isSaving || entries.length === 0}
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
                      <Text style={styles.desktopSaveButtonText}>SAVE MAPPINGS</Text>
                      <MaterialIcons name="check" size={18} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Filter Section Row */}
            <View style={styles.desktopFilterRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterLabelCaps}>CHARGE CONFIGURATION</Text>
                <GlassDropdown 
                  options={charges.map(c => ({ label: c.chargeName, value: c.id }))}
                  value={selectedChargeId}
                  onChange={setSelectedChargeId}
                  placeholder="Select Charge"
                  icon="receipt-long"
                />
              </View>
              
              <View style={{ width: 250 }}>
                <Text style={styles.filterLabelCaps}>BILLING MONTH</Text>
                <View style={styles.monthBadge}>
                  <MaterialIcons name="calendar-today" size={18} color="#006875" />
                  <Text style={styles.monthBadgeText}>{billingMonth}</Text>
                </View>
              </View>
            </View>

            {/* Content */}
            {isLoadingCharges ? (
              <ActivityIndicator size="large" color="#006875" style={{ marginTop: 80 }} />
            ) : charges.length === 0 ? (
              <BlurView intensity={60} tint="light" style={styles.emptyStateCard}>
                <MaterialIcons name="receipt-long" size={48} color="#6b7a7d" style={{ marginBottom: 16 }} />
                <Text style={styles.emptyText}>No active charges configured for this property.</Text>
              </BlurView>
            ) : isLoadingWorksheet ? (
              <ActivityIndicator size="large" color="#006875" style={{ marginTop: 80 }} />
            ) : entries.length === 0 ? (
              <BlurView intensity={60} tint="light" style={styles.emptyStateCard}>
                <MaterialIcons name="domain-disabled" size={48} color="#6b7a7d" style={{ marginBottom: 16 }} />
                <Text style={styles.emptyText}>No units found for mapping.</Text>
              </BlurView>
            ) : (
              renderFloorsList()
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
            <Text style={styles.headerTitle}>Worksheets</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.headerSaveBtnWrapper, (isSaving || entries.length === 0) && { opacity: 0.5 }]} 
            onPress={handleSave}
            disabled={isSaving || entries.length === 0}
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
          <View style={styles.mobileDropdownWrapper}>
            <GlassDropdown 
              options={charges.map(c => ({ label: c.chargeName, value: c.id }))}
              value={selectedChargeId}
              onChange={setSelectedChargeId}
              placeholder="Select Charge"
              icon="receipt-long"
            />
          </View>
          
          <View style={styles.monthSelectorRowMobile}>
            <Text style={styles.filterLabelCaps}>MONTH</Text>
            <Text style={styles.monthBadgeTextMobile}>{billingMonth}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.mobileListContent} keyboardShouldPersistTaps="handled">
          {isLoadingCharges ? (
            <ActivityIndicator size="large" color="#006875" style={{ marginTop: 50 }} />
          ) : charges.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyText}>No active charges configured for this property.</Text>
            </View>
          ) : isLoadingWorksheet ? (
            <ActivityIndicator size="large" color="#006875" style={{ marginTop: 50 }} />
          ) : entries.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyText}>No units found for mapping.</Text>
            </View>
          ) : (
            renderFloorsList()
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
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
  
  // Desktop shell specific
  desktopShell: { flex: 1, flexDirection: 'row' },
  desktopMain: { flex: 1, height: '100%' },
  desktopContent: { paddingBottom: 80 },
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
  largeTitleContainer: { flex: 1 },
  titleLineDesktop: {
    fontSize: 32,
    fontWeight: '800',
    color: '#151d1e',
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
  
  // Mobile shell specific
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
  headerSaveBtnWrapper: {
    borderRadius: 19,
    overflow: 'hidden',
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerSaveBtn: {
    height: 38,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerSaveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  filterSection: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  mobileDropdownWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  monthSelectorRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  monthBadgeTextMobile: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006875',
  },
  mobileListContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Shared Filters
  filterLabelCaps: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5b6b6d',
    letterSpacing: 1,
    marginBottom: 8,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  monthBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006875',
  },

  // Grid & Cards
  emptyStateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7a7d',
  },
  unitName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#151d1e',
    marginBottom: 2,
  },
  tenantName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7a7d',
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  currencySymbol: {
    position: 'absolute',
    left: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#849495',
    zIndex: 1,
  },
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
    textAlign: 'left',
  },
  billedBadge: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  billedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0d9488',
  },
  
  // Floor and Pagination Styles
  floorCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  floorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  floorHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#006875',
    letterSpacing: 0.5,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,104,117,0.1)',
  },
  rowLeft: {
    flex: 1,
  },
  rowRight: {
    width: 140,
    alignItems: 'flex-end',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,104,117,0.1)',
  },
  mainPaginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006875',
  },
  pageButtonTextDisabled: {
    color: '#a0aab2',
  },
  pageInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5b6b6d',
  },
});
