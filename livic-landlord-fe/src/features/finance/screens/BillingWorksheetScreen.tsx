import { useAppTheme } from '@/src/theme/ThemeContext';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useResponsive } from '@/src/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useProperties } from '@/src/hooks/useProperties';
import { useBillingWorksheet } from '@/src/features/finance/hooks/useBillingWorksheet';
import { formatErrorMessage } from '@/src/utils/errors';
import { SkeletonRow } from '@/src/components/common/feedback/Skeleton';

// Sub-components
import { WorksheetFloorList } from '../components/billing/WorksheetFloorList';

export default function BillingWorksheetScreen({ token }: { token: string | null }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const router = useRouter();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();
  const { handleScroll } = useScrollNav();
  const insets = useSafeAreaInsets();
  const { properties } = useProperties();
  const propertyId = paramPropertyId || (properties && properties.length > 0 ? properties[0].id : null);
  
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
  const [billingMonth, setBillingMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const handlePrevMonth = () => {
    const [yearStr, monthStr] = billingMonth.split('-');
    let year = parseInt(yearStr);
    let month = parseInt(monthStr);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    setBillingMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [yearStr, monthStr] = billingMonth.split('-');
    let year = parseInt(yearStr);
    let month = parseInt(monthStr);
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
    setBillingMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // React-Query Custom Hook
  const {
    charges,
    entries,
    isLoading,
    isSaving,
    saveWorksheet,
  } = useBillingWorksheet(propertyId, selectedChargeId, billingMonth, token);

  useEffect(() => {
    if (charges.length > 0 && !selectedChargeId) {
      const rentCharge = charges.find(c => c.chargeCategory === 'RENT');
      setSelectedChargeId(rentCharge ? rentCharge.id : charges[0].id);
    }
  }, [charges]);

  useEffect(() => {
    if (entries.length > 0) {
      const initialValues: Record<string, string> = {};
      entries.forEach(entry => {
        initialValues[entry.unitId] = entry.enteredValue !== null && entry.enteredValue !== undefined 
          ? entry.enteredValue.toString() 
          : '';
      });
      setEditValues(initialValues);
    }
  }, [entries]);

  const handleSave = async () => {
    if (!token || !propertyId || !selectedChargeId) return;
    try {
      const payloadEntries = Object.entries(editValues).map(([unitId, val]) => ({
        unitId,
        enteredValue: val ? parseFloat(val) : 0
      }));
      
      await saveWorksheet(payloadEntries);
      Alert.alert("Success", "Worksheet saved successfully!");
    } catch (error: any) {
      Alert.alert("Error", formatErrorMessage(error));
    }
  };

  const selectedCharge = charges.find(c => c.id === selectedChargeId);

  const renderContent = () => {
    if (!properties || properties.length === 0) {
      return (
        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.emptyStateCard}>
          <MaterialIcons name="business" size={48} color={theme.Colors.primary} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyText, { fontWeight: '800', color: theme.Colors.onSurface, fontSize: theme.Typography.bodyLg.fontSize, marginBottom: 8 }]}>No Property Created Yet</Text>
          <Text style={[styles.emptyText, { textAlign: 'center', paddingHorizontal: 40, marginBottom: 20 }]}>
            Billing worksheets require an active property. Create your first property to start managing worksheets.
          </Text>
          <TouchableOpacity 
            style={{ borderRadius: 100, overflow: 'hidden' }}
            onPress={() => router.push('/properties/create')}
          >
            <LinearGradient colors={['#00d4ff', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingHorizontal: 24, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="add" size={20} color={theme.Colors.surfaceContainerLowest} />
              <Text style={{ color: theme.Colors.surfaceContainerLowest, fontSize: theme.Typography.BodyMedium.fontSize, fontWeight: '800', letterSpacing: 1 }}>CREATE FIRST PROPERTY</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      );
    }

    if (isLoading && charges.length === 0) {
      return (
        <View style={{ padding: 40, gap: 16 }}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      );
    }

    if (charges.length === 0) {
      return (
        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.emptyStateCard}>
          <MaterialIcons name="receipt-long" size={48} color={theme.Colors.onSurfaceVariant} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>No active charges configured for this property.</Text>
        </BlurView>
      );
    }

    if (entries.length === 0) {
      return (
        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.emptyStateCard}>
          <MaterialIcons name="domain-disabled" size={48} color={theme.Colors.onSurfaceVariant} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyText, { textAlign: 'center', paddingHorizontal: 40 }]}>
            No occupied units with active leases found for this property. Assign a tenant first to view billing worksheets.
          </Text>
        </BlurView>
      );
    }

    return (
      <WorksheetFloorList
        entries={entries}
        editValues={editValues}
        setEditValues={setEditValues}
        selectedCharge={selectedCharge}
        propertyId={propertyId}
      />
    );
  };

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
          onPropertyChange={(id) => router.replace(`/expenses/billing-worksheet?propertyId=${id}`)}
        />

        <ScrollView contentContainerStyle={styles.desktopContent} showsVerticalScrollIndicator={false}>
          <View style={styles.desktopInner}>
            <View style={styles.desktopHeaderRow}>
              <View style={styles.largeTitleContainer}>
                <Text style={styles.titleLineDesktop}>Billing Worksheets</Text>
              </View>

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
                    <ActivityIndicator color={theme.Colors.surfaceContainerLowest} size="small" />
                  ) : (
                    <>
                      <Text style={styles.desktopSaveButtonText}>SAVE MAPPINGS</Text>
                      <MaterialIcons name="check" size={18} color={theme.Colors.surfaceContainerLowest} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 6, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 8 }}>
                    <MaterialIcons name="chevron-left" size={20} color={theme.Colors.primary} />
                  </TouchableOpacity>
                  
                  <View style={[styles.monthBadge, { flex: 1, marginTop: 0 }]}>
                    <MaterialIcons name="calendar-today" size={16} color={theme.Colors.primary} />
                    <Text style={styles.monthBadgeText}>{billingMonth}</Text>
                  </View>
                  
                  <TouchableOpacity onPress={handleNextMonth} style={{ padding: 6, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 8 }}>
                    <MaterialIcons name="chevron-right" size={20} color={theme.Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {renderContent()}
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
        <View style={[styles.headerContainer, { paddingTop: insets.top, height: 56 + insets.top }]}>
          <BlurView intensity={45} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={22} color={theme.Colors.onSurface} />
            </TouchableOpacity>
            <View style={styles.titleWrapper}>
              <Text style={styles.compactTitleText}>Worksheets</Text>
            </View>
            <TouchableOpacity 
              style={[styles.headerGradientTouch, (isSaving || entries.length === 0) && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={isSaving || entries.length === 0}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00d4ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradientInner}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
                ) : (
                  <>
                    <MaterialIcons name="check" size={15} color={theme.Colors.surfaceContainerLowest} />
                    <Text style={styles.headerGradientText}>SAVE</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.filterSection, { paddingTop: 68 + insets.top }]}>
          <View style={styles.mobileDropdownWrapper}>
            <GlassDropdown 
              options={charges.map(c => ({ label: c.chargeName, value: c.id }))}
              value={selectedChargeId}
              onChange={setSelectedChargeId}
              placeholder="Select Charge"
              icon="receipt-long"
            />
          </View>
          
          <View style={styles.monthSelectorRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthAdjustButton}>
              <MaterialIcons name="chevron-left" size={24} color={theme.Colors.primary} />
            </TouchableOpacity>
            
            <View style={styles.monthBadge}>
              <MaterialIcons name="calendar-today" size={16} color={theme.Colors.primary} />
              <Text style={styles.monthBadgeText}>{billingMonth}</Text>
            </View>
            
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthAdjustButton}>
              <MaterialIcons name="chevron-right" size={24} color={theme.Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
    zIndex: 999,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.Colors.glassFill,
    overflow: 'hidden',
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  },
  titleWrapper: { flex: 1, alignItems: 'center' },
  compactTitleText: {
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.BodyLarge.fontSize,
    fontFamily: 'Inter',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerGradientTouch: { borderRadius: 12, overflow: 'hidden' },
  headerGradientInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  headerGradientText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  mobileDropdownWrapper: {
    zIndex: 1000,
    marginBottom: 8,
  },
  monthSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  monthAdjustButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  monthBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.Colors.glassStroke,
    paddingVertical: 8,
    marginTop: 0,
  },
  monthBadgeText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  desktopShell: { flex: 1 },
  desktopMain: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  desktopContent: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  desktopInner: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    paddingTop: 24,
  },
  desktopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  largeTitleContainer: { flex: 1 },
  titleLineDesktop: {
    fontSize: theme.Typography.headlineLg.fontSize,
    fontWeight: '900',
    color: theme.Colors.onSurface,
  },
  desktopSaveButtonWrapper: { borderRadius: 16, overflow: 'hidden' },
  desktopSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  desktopSaveButtonText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '800',
    letterSpacing: 1,
  },
  desktopFilterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
    marginBottom: 24,
    zIndex: 1000,
  },
  filterLabelCaps: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  emptyStateCard: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1.5,
    borderColor: theme.Colors.glassStroke,
    marginTop: 20,
  },
  emptyText: {
    fontSize: theme.Typography.BodyLarge.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '500',
  },
});
