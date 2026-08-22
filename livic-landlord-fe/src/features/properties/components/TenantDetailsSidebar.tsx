import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { UnitBlock } from '../hooks/useFloorLayoutViewer';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

interface TenantDetailsSidebarProps {
  selectedBlock: UnitBlock;
  floorNumber: number;
  onClose: () => void;
  sheetScrollRef: React.RefObject<ScrollView>;
  isCreatingNewTenant: boolean;
  setIsCreatingNewTenant: (val: boolean) => void;
  tenantPhoneSearch: string;
  setTenantPhoneSearch: (val: string) => void;
  newTenantName: string;
  setNewTenantName: (val: string) => void;
  newTenantEmail: string;
  setNewTenantEmail: (val: string) => void;
  tenantSearchError: string | null;
  tenantCreating: boolean;
  parentScrollEnabled: boolean;
  setParentScrollEnabled: (val: boolean) => void;
  handleCreateAndSelectTenant: () => void;
  handleSearchTenant: () => void;
  tenantSearchLoading: boolean;
  suggestions: any[];
  setSuggestions: (val: any[]) => void;
  setTenantSearchResult: (val: any) => void;
  tenantSearchResult: any;
  rentAmount: string;
  setRentAmount: (val: string) => void;
  securityDeposit: string;
  setSecurityDeposit: (val: string) => void;
  handleAssignTenant: () => void;
  tenantAssigning: boolean;
  handleRemoveTenant: (leaseId: string, tenantName?: string | null) => void;
  updateUnitDetails: (id: string, updates: Partial<UnitBlock>) => void;
  isDesktop?: boolean;
}

export function TenantDetailsSidebar({
  selectedBlock,
  floorNumber,
  onClose,
  sheetScrollRef,
  isCreatingNewTenant,
  setIsCreatingNewTenant,
  tenantPhoneSearch,
  setTenantPhoneSearch,
  newTenantName,
  setNewTenantName,
  newTenantEmail,
  setNewTenantEmail,
  tenantSearchError,
  tenantCreating,
  parentScrollEnabled,
  setParentScrollEnabled,
  handleCreateAndSelectTenant,
  handleSearchTenant,
  tenantSearchLoading,
  suggestions,
  setSuggestions,
  setTenantSearchResult,
  tenantSearchResult,
  rentAmount,
  setRentAmount,
  securityDeposit,
  setSecurityDeposit,
  handleAssignTenant,
  tenantAssigning,
  handleRemoveTenant,
  updateUnitDetails,
  isDesktop = false,
}: TenantDetailsSidebarProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <BlurView intensity={70} tint="light" style={[styles.desktopCard, { flex: 1 }]}>
      <View style={styles.sheetHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetUnitTitle}>Unit {selectedBlock.unitNumber}</Text>
          <Text style={styles.sheetSubtitle}>Floor {floorNumber}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButtonSmall}>
          <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={sheetScrollRef}
        scrollEnabled={parentScrollEnabled}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isCreatingNewTenant ? (
          <View style={styles.createTenantPanel}>
            <View style={styles.createTenantHeader}>
              <TouchableOpacity onPress={() => setIsCreatingNewTenant(false)} style={styles.createTenantBack}>
                <MaterialIcons name="arrow-back" size={18} color={theme.Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.createTenantTitle}>CREATE NEW TENANT</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <MaterialIcons name="phone" size={18} color={theme.Colors.onSurfaceVariant} />
                <TextInput style={[styles.textInput, { color: theme.Colors.onSurfaceVariant }]} value={tenantPhoneSearch} editable={false} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="person" size={18} color={theme.Colors.primary} />
                <TextInput style={styles.textInput} placeholder="e.g. John Doe" placeholderTextColor={theme.Colors.outlineVariant} value={newTenantName} onChangeText={setNewTenantName} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="email" size={18} color={theme.Colors.primary} />
                <TextInput style={styles.textInput} placeholder="e.g. john@example.com" placeholderTextColor={theme.Colors.outlineVariant} value={newTenantEmail} onChangeText={setNewTenantEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
            </View>

            {tenantSearchError && (
              <Text style={{ color: theme.Colors.error, fontSize: theme.Typography.BodyMedium.fontSize, paddingLeft: 4, marginTop: 4 }}>{tenantSearchError}</Text>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity style={[styles.statusToggle, { flex: 1 }]} onPress={() => setIsCreatingNewTenant(false)}>
                <Text style={styles.statusToggleText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statusToggle, styles.statusActiveOccupied, { flex: 1 }]} onPress={handleCreateAndSelectTenant} disabled={tenantCreating}>
                {tenantCreating ? <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} /> : <Text style={[styles.statusToggleText, styles.statusTextActive]}>CREATE & ASSIGN</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={{ gap: 12, marginBottom: 12 }}>
              <View style={[styles.inputGroup]}>
                <Text style={styles.inputLabel}>UNIT CAPACITY</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="people" size={18} color={theme.Colors.primary} />
                  <TextInput 
                    style={styles.textInput}
                    value={selectedBlock.capacity ? selectedBlock.capacity.toString() : ''}
                    onChangeText={(val) => {
                      const cap = parseInt(val, 10);
                      updateUnitDetails(selectedBlock.id, { capacity: isNaN(cap) ? undefined : cap });
                    }}
                    placeholder="e.g. 2"
                    keyboardType="numeric"
                    placeholderTextColor={theme.Colors.outlineVariant}
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
                        <MaterialIcons name="close" size={16} color={theme.Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.sheetSubtitle, { marginBottom: 8, fontStyle: 'italic' }]}>No tenants assigned yet.</Text>
              )}

              {(!selectedBlock.capacity || selectedBlock.capacity <= 0) ? (
                <View style={styles.warningContainer}>
                  <MaterialIcons name="warning" size={18} color={theme.Colors.error} />
                  <Text style={styles.warningText}>
                    Please define a unit capacity of at least 1 before you can search for and assign tenants.
                  </Text>
                </View>
              ) : selectedBlock.activeLeases && selectedBlock.activeLeases.length >= selectedBlock.capacity ? (
                <View style={[styles.warningContainer, { backgroundColor: 'rgba(46, 125, 50, 0.08)', borderColor: 'rgba(46, 125, 50, 0.15)', marginTop: 8 }]}>
                  <MaterialIcons name="check-circle" size={18} color={theme.Colors.primary} />
                  <Text style={[styles.warningText, { color: theme.Colors.primary }]}>
                    Unit is fully occupied (Capacity: {selectedBlock.capacity}/{selectedBlock.capacity} reached).
                  </Text>
                </View>
              ) : (
                <>
                  <View style={{ marginBottom: 12 }}>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="phone" size={18} color={theme.Colors.primary} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Search by 10-digit phone"
                        placeholderTextColor={theme.Colors.outlineVariant}
                        value={tenantPhoneSearch}
                        onChangeText={(val) => {
                          const cleaned = val.replace(/[^0-9]/g, '').slice(0, 10);
                          setTenantPhoneSearch(cleaned);
                        }}
                        keyboardType="phone-pad"
                        maxLength={10}
                        onSubmitEditing={handleSearchTenant}
                      />
                      <TouchableOpacity onPress={handleSearchTenant} disabled={tenantSearchLoading}>
                        {tenantSearchLoading ? (
                          <ActivityIndicator size="small" color={theme.Colors.primary} />
                        ) : (
                          <MaterialIcons name="person-add" size={20} color={theme.Colors.primary} />
                        )}
                      </TouchableOpacity>
                    </View>

                    {suggestions.length > 0 && (
                      <ScrollView 
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
                            <MaterialIcons name="phone" size={16} color={theme.Colors.primary} />
                            <View style={styles.suggestionTextContainer}>
                              <Text style={styles.suggestionName}>{user.fullName}</Text>
                              <Text style={styles.suggestionPhone}>{user.phoneNumber || 'No phone'}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  {tenantSearchError && (
                    <Text style={{ color: theme.Colors.error, fontSize: theme.Typography.BodyMedium.fontSize, marginTop: -8, marginBottom: 12, paddingLeft: 4 }}>
                      {tenantSearchError}
                    </Text>
                  )}

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
                        <MaterialIcons name="person-add" size={20} color={theme.Colors.primary} />
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
                          <Text style={{ fontSize: theme.Typography.BodyMedium.fontSize, fontWeight: '700', color: theme.Colors.primary }}>{tenantSearchResult.fullName}</Text>
                          <Text style={{ fontSize: theme.Typography.LabelSmall.fontSize, color: theme.Colors.onSurfaceVariant }}>{tenantSearchResult.email}</Text>
                        </View>
                        <MaterialIcons name="check-circle" size={20} color={theme.Colors.primary} />
                      </View>

                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                          <Text style={styles.inputLabel}>LEASE RENT (₹)</Text>
                          <View style={[styles.inputWrapper, { height: 42 }]}>
                            <TextInput 
                              style={styles.textInput}
                              placeholder="e.g. 15000"
                              placeholderTextColor={theme.Colors.outlineVariant}
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
                              placeholderTextColor={theme.Colors.outlineVariant}
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
                            <ActivityIndicator size="small" color={theme.Colors.surfaceContainerLowest} />
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
      </ScrollView>
    </BlurView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  desktopCard: {
    borderRadius: 24,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1.5,
    borderColor: theme.Colors.glassStroke,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sheetUnitTitle: {
    fontSize: theme.Typography.headlineSmall?.fontSize || 24,
    fontWeight: '900',
    color: theme.Colors.onSurface,
  },
  sheetSubtitle: {
    fontSize: theme.Typography.BodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 2,
  },
  closeButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetContent: {
    padding: 20,
  },
  createTenantPanel: {
    gap: 12,
  },
  createTenantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  createTenantBack: {
    padding: 4,
  },
  createTenantTitle: {
    fontSize: theme.Typography.LabelLarge?.fontSize || 14,
    fontWeight: '800',
    color: theme.Colors.primary,
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  textInput: {
    flex: 1,
    color: theme.Colors.onSurface,
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '600',
  },
  statusToggle: {
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusToggleText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
  },
  statusActiveOccupied: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusTextActive: {
    color: theme.Colors.primary,
  },
  tenantListContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 10,
    borderRadius: 12,
  },
  tenantTag: {
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tenantTagText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.primary,
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.12)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: theme.Typography.BodySmall.fontSize,
    color: theme.Colors.error,
    fontWeight: '600',
    lineHeight: 16,
  },
  suggestionsContainer: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: theme.Colors.outlineVariant,
    borderRadius: 12,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    marginTop: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  suggestionPhone: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 2,
  },
  quickCreatePrompt: {
    padding: 12,
    backgroundColor: 'rgba(0, 104, 117, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.1)',
    borderRadius: 12,
    marginTop: 4,
  },
  quickCreatePromptText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.primary,
    flex: 1,
  },
  searchResultContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 104, 117, 0.04)',
    padding: 12,
    borderRadius: 12,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButtonGradient: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statusActiveVacant: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
});
