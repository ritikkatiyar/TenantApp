import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useRef } from 'react';
import { 
  View, Text, StyleSheet, Animated, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import FloatingBackButton from '@/src/components/common/navigation/FloatingBackButton';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import { useResponsive } from '@/hooks/useResponsive';
import { useProperties } from '@/src/hooks/useProperties';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

// Phase 4 modular hook & component imports
import { useMeterReading } from '@/src/features/finance/hooks/useMeterReading';
import { MeterReadingSummary } from '@/src/features/finance/components/MeterReadingSummary';
import { MeterReadingFloorCard } from '@/src/features/finance/components/MeterReadingFloorCard';

export default function MeterReadingScreen({ token }: { token: string | null }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const router = useRouter();
  const { id: paramPropertyId, propertyId: paramPropertyIdAlt } = useLocalSearchParams<{ id?: string; propertyId?: string }>();
  const { isDesktop } = useResponsive();
  const { properties } = useProperties();
  const propertyId = paramPropertyId || paramPropertyIdAlt || (properties && properties.length > 0 ? properties[0].id : null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { handleScroll } = useScrollNav();

  const {
    isLoading,
    isSaving,
    configs,
    selectedConfigId,
    setSelectedConfigId,
    month,
    year,
    worksheet,
    inputs,
    setInputs,
    prevInputs,
    setPrevInputs,
    inputRefs,
    expandedFloors,
    setExpandedFloors,
    floorPages,
    setFloorPages,
    floorPage,
    setFloorPage,
    toggleFloor,
    handleSave,
    changeMonth,
  } = useMeterReading({ token, propertyId: propertyId as string });

  const getMonthName = (m: number) => {
    const date = new Date();
    date.setMonth(m - 1);
    return date.toLocaleString('default', { month: 'long' });
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
    const prevStr = prevInputs[row.unitId];
    const prevVal = prevStr !== undefined && prevStr !== '' ? parseFloat(prevStr) : (row.previousReading ?? 0);
    if (valStr && valStr.trim() !== '') {
      const val = parseFloat(valStr);
      if (!isNaN(val) && !isNaN(prevVal) && val >= prevVal) {
        const consumed = val - prevVal;
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
          onBack={() => router.push('/expenses')} 
          backText="Back to Finance & Billing" 
          properties={properties || []}
          selectedPropertyId={propertyId}
          onPropertyChange={(id) => router.replace(`/expenses/meter-readings?propertyId=${id}` as any)}
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
                    <MaterialIcons name="chevron-left" size={24} color={theme.Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.monthText}>{getMonthName(month)} {year}</Text>
                  <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
                    <MaterialIcons name="chevron-right" size={24} color={theme.Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Main Content Grid */}
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.Colors.primary} style={{ marginTop: 80 }} />
            ) : worksheet.length === 0 ? (
              <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.emptyStateCard}>
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
                        <MaterialIcons name="unfold-more" size={16} color={theme.Colors.primary} />
                        <Text style={styles.controlLinkText}>EXPAND ALL</Text>
                      </TouchableOpacity>
                      <View style={styles.controlSeparator} />
                      <TouchableOpacity 
                        style={styles.controlLink}
                        onPress={() => {
                          setExpandedFloors({});
                        }}
                      >
                        <MaterialIcons name="unfold-less" size={16} color={theme.Colors.primary} />
                        <Text style={styles.controlLinkText}>COLLAPSE ALL</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {paginatedFloors.map(floor => {
                    const isExpanded = expandedFloors[floor];
                    return (
                      <MeterReadingFloorCard
                        key={`floor-${floor}`}
                        floor={floor}
                        isExpanded={isExpanded}
                        toggleFloor={() => toggleFloor(floor)}
                        floorUnits={groupedWorksheet[floor] || []}
                        currentPage={floorPages[floor] || 1}
                        setPage={(p) => setFloorPages(prev => ({ ...prev, [floor]: p }))}
                        inputs={inputs}
                        setInputs={setInputs}
                        prevInputs={prevInputs}
                        setPrevInputs={setPrevInputs}
                        inputRefs={inputRefs}
                        baseRate={baseRate}
                        unitType={selectedConfig?.unitType}
                      />
                    );
                  })}

                  {totalFloorPages > 1 && (
                    <View style={styles.paginationRow}>
                      <TouchableOpacity 
                        style={[styles.pageButton, floorPage === 1 && styles.pageButtonDisabled]}
                        disabled={floorPage === 1}
                        onPress={() => setFloorPage(prev => Math.max(1, prev - 1))}
                      >
                        <MaterialIcons name="chevron-left" size={20} color={floorPage === 1 ? '#a0aab2' : theme.Colors.primary} />
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
                        <MaterialIcons name="chevron-right" size={20} color={floorPage === totalFloorPages ? '#a0aab2' : theme.Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Right Column: Dashboard Summary Panel */}
                <View style={styles.desktopRightColumn}>
                  <MeterReadingSummary
                    totalUnits={totalUnits}
                    readingsEntered={readingsEntered}
                    selectedConfigName={selectedConfig?.chargeName}
                    unitType={selectedConfig?.unitType}
                    baseRate={baseRate}
                    billingMonthName={getMonthName(month)}
                    billingYear={year}
                    totalConsumption={totalConsumption}
                    totalEstimatedCost={totalEstimatedCost}
                  />
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
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <FloatingBackButton onPress={() => router.back()} />

        {/* Filters */}
        <View style={[styles.filterSection, { paddingTop: 64 }]}>
          <GlassDropdown 
            options={configs.map(c => ({ label: c.chargeName, value: c.id }))}
            value={selectedConfigId}
            onChange={setSelectedConfigId}
            placeholder="Select Utility"
            icon="receipt-long"
          />
          
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
              <MaterialIcons name="chevron-left" size={24} color={theme.Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthText}>{getMonthName(month)} {year}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
              <MaterialIcons name="chevron-right" size={24} color={theme.Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        >
          {(!properties || properties.length === 0) ? (
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={{ padding: 32, borderRadius: 24, alignItems: 'center', maxWidth: 500, alignSelf: 'center', marginTop: 40, width: '100%' }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0, 104, 117, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <MaterialIcons name="business" size={32} color={theme.Colors.primary} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#163235', marginBottom: 8, textAlign: 'center' }}>No Property Created Yet</Text>
              <Text style={{ fontSize: 14, color: theme.Colors.onSurfaceVariant, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                Logging meter readings requires an active property. Create your first property to start inputting meter logs.
              </Text>
              <TouchableOpacity 
                style={{ borderRadius: 100, overflow: 'hidden' }}
                onPress={() => router.push('/properties/create')}
              >
                <LinearGradient colors={['#00d4ff', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 8 }}>
                  <MaterialIcons name="add" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1 }}>CREATE FIRST PROPERTY</Text>
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          ) : isLoading ? (
            <ActivityIndicator size="large" color={theme.Colors.primary} style={{ marginTop: 50 }} />
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
                  <MaterialIcons name="unfold-more" size={16} color={theme.Colors.primary} />
                  <Text style={styles.controlLinkText}>EXPAND ALL</Text>
                </TouchableOpacity>
                <View style={styles.controlSeparator} />
                <TouchableOpacity 
                  style={styles.controlLink}
                  onPress={() => {
                    setExpandedFloors({});
                  }}
                >
                  <MaterialIcons name="unfold-less" size={16} color={theme.Colors.primary} />
                  <Text style={styles.controlLinkText}>COLLAPSE ALL</Text>
                </TouchableOpacity>
              </View>

              {paginatedFloors.map(floor => {
                const isExpanded = expandedFloors[floor];
                return (
                  <MeterReadingFloorCard
                    key={`floor-${floor}`}
                    floor={floor}
                    isExpanded={isExpanded}
                    toggleFloor={() => toggleFloor(floor)}
                    floorUnits={groupedWorksheet[floor] || []}
                    currentPage={floorPages[floor] || 1}
                    setPage={(p) => setFloorPages(prev => ({ ...prev, [floor]: p }))}
                    inputs={inputs}
                    setInputs={setInputs}
                    prevInputs={prevInputs}
                    setPrevInputs={setPrevInputs}
                    inputRefs={inputRefs}
                    baseRate={baseRate}
                    unitType={selectedConfig?.unitType}
                  />
                );
              })}

              {totalFloorPages > 1 && (
                <View style={styles.paginationRow}>
                  <TouchableOpacity 
                    style={[styles.pageButton, floorPage === 1 && styles.pageButtonDisabled]}
                    disabled={floorPage === 1}
                    onPress={() => setFloorPage(prev => Math.max(1, prev - 1))}
                  >
                    <MaterialIcons name="chevron-left" size={20} color={floorPage === 1 ? '#a0aab2' : theme.Colors.primary} />
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
                    <MaterialIcons name="chevron-right" size={20} color={floorPage === totalFloorPages ? '#a0aab2' : theme.Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
          <View style={{ height: 120 }} />
        </Animated.ScrollView>

        {/* Floating Save Button */}
        <View style={styles.floatingSaveBar}>
          <BlurView intensity={55} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <TouchableOpacity
            style={[styles.floatingSaveBtn, (isSaving || worksheet.length === 0) && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={isSaving || worksheet.length === 0}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#00d4ff', '#0072ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.floatingSaveBtnInner}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color="#fff" />
                  <Text style={styles.floatingSaveText}>SAVE READINGS</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    zIndex: 999,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.Colors.glassFill,
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
  backButton: {
    width: 36, 
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: theme.Colors.glassFill,
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#006677',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter', fontWeight: '800', color: '#0b1c30' },
  headerSubtitle: { fontSize: 12, color: theme.Colors.onSurfaceVariant, fontWeight: '500', marginTop: 2 },
  
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
    color: theme.Surface.card,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  floatingSaveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  floatingSaveBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  floatingSaveBtnInner: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
  },
  floatingSaveText: {
    color: theme.Surface.card,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
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
  monthText: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: theme.Colors.primary },
  
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: theme.Colors.onSurfaceVariant, fontSize: 16 },
  
  floorCard: {
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 24,
    overflow: 'hidden',
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 3,
  },
  floorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  floorHeaderText: { fontSize: 18, fontWeight: '800', color: theme.Colors.primary },
  
  rowCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0, 104, 117, 0.1)',
  },
  rowError: { backgroundColor: 'rgba(254, 226, 226, 0.4)', borderRadius: 12, paddingHorizontal: 8 },
  
  rowLeft: { flex: 2 },
  unitName: { fontSize: 16, fontWeight: '700', color: theme.Colors.onBackground },
  tenantName: { fontSize: 13, color: '#5b6b6d', marginVertical: 2 },
  prevReading: { fontSize: 11, color: '#849495', fontWeight: '600' },
  
  rowMiddle: { flex: 1.5, alignItems: 'flex-end', paddingRight: 12 },
  consumedText: { fontSize: 14, fontWeight: '700', color: theme.Colors.primary },
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
    color: theme.Colors.onBackground, 
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
    color: theme.Colors.onSurfaceVariant,
  },
  topbarTabActive: {
    color: theme.Colors.primary,
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
    color: theme.Colors.onBackground,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.Colors.primary,
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
    color: theme.Colors.onBackground,
  },
  desktopSubtitle: {
    fontSize: 14,
    color: theme.Colors.onSurfaceVariant,
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
    color: theme.Surface.card,
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
    backgroundColor: theme.Colors.glassFill,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: theme.Colors.primary,
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
    color: theme.Colors.primary,
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
    color: theme.Colors.onBackground,
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
    color: theme.Colors.onBackground,
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
    color: theme.Colors.primary,
  },
  pageButtonTextDisabled: {
    color: '#a0aab2',
  },
  pageInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.Colors.onBackground,
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
    color: theme.Colors.primary,
    letterSpacing: 0.5,
  },
  controlSeparator: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(0, 104, 117, 0.15)',
  },
});
