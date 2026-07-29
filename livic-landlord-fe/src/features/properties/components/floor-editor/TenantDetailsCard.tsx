import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  ScrollView as RNScrollView 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

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
  activeLeases?: any[];
  type?: string;
}

interface TenantDetailsCardProps {
  selectedBlock: UnitBlock;
  updateUnitDetails: (id: string, updates: Partial<UnitBlock>) => void;
  onRemoveTenant: (leaseId: string, tenantName: string) => void;
  // Hook bindings
  tenantPhoneSearch: string;
  setTenantPhoneSearch: (val: string) => void;
  tenantSearchResult: any;
  setTenantSearchResult: (val: any) => void;
  tenantSearchLoading: boolean;
  tenantAssigning: boolean;
  tenantSearchError: string | null;
  setTenantSearchError: (val: string | null) => void;
  suggestions: any[];
  setSuggestions: (val: any[]) => void;
  suggestionsLoading: boolean;
  isCreatingNewTenant: boolean;
  setIsCreatingNewTenant: (val: boolean) => void;
  newTenantName: string;
  setNewTenantName: (val: string) => void;
  newTenantEmail: string;
  setNewTenantEmail: (val: string) => void;
  tenantCreating: boolean;
  rentAmount: string;
  setRentAmount: (val: string) => void;
  securityDeposit: string;
  setSecurityDeposit: (val: string) => void;
  handleSearchTenant: () => void;
  handleCreateAndSelectTenant: () => void;
  handleAssignTenant: () => void;
  resetTenantAssignmentForm: () => void;
  parentScrollEnabled?: boolean;
  setParentScrollEnabled?: (val: boolean) => void;
}

export function TenantDetailsCard({
  selectedBlock,
  updateUnitDetails,
  onRemoveTenant,
  tenantPhoneSearch,
  setTenantPhoneSearch,
  tenantSearchResult,
  setTenantSearchResult,
  tenantSearchLoading,
  tenantAssigning,
  tenantSearchError,
  setTenantSearchError,
  suggestions,
  setSuggestions,
  suggestionsLoading,
  isCreatingNewTenant,
  setIsCreatingNewTenant,
  newTenantName,
  setNewTenantName,
  newTenantEmail,
  setNewTenantEmail,
  tenantCreating,
  rentAmount,
  setRentAmount,
  securityDeposit,
  setSecurityDeposit,
  handleSearchTenant,
  handleCreateAndSelectTenant,
  handleAssignTenant,
  resetTenantAssignmentForm,
  parentScrollEnabled = true,
  setParentScrollEnabled = () => {},
}: TenantDetailsCardProps) {
  return (
    <>
      {isCreatingNewTenant ? (
        /* Full-panel Create New Tenant form */
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
              <TextInput 
                style={styles.textInput} 
                placeholder="e.g. John Doe" 
                placeholderTextColor="#9ba9ab" 
                value={newTenantName} 
                onChangeText={setNewTenantName} 
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
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

          {tenantSearchError && (
            <Text style={styles.errorText}>{tenantSearchError}</Text>
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
        /* Normal unit fields */
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>RENT AMOUNT</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="attach-money" size={18} color="#006875" />
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
          </View>

          {/* Assigned Tenants */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ASSIGNED TENANTS</Text>
            {selectedBlock.activeLeases && selectedBlock.activeLeases.length > 0 ? (
              <View style={{ gap: 10, marginBottom: 12 }}>
                {selectedBlock.activeLeases.map((l, index) => (
                  <View key={l.leaseId || index} style={styles.tenantListContainer}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <View style={styles.tenantTag}>
                          <Text style={styles.tenantTagText}>{l.tenantName || 'Assigned tenant'}</Text>
                        </View>
                        {l.tenantPhone ? (
                          <Text style={styles.sheetSubtitle}>{l.tenantPhone}</Text>
                        ) : null}
                      </View>
                    </View>

                    <TouchableOpacity 
                      onPress={() => onRemoveTenant(l.leaseId, l.tenantName)}
                      style={styles.removeTenantButton}
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
              <View style={styles.successContainer}>
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
                  <Text style={styles.errorTextFlat}>
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
                    <View style={styles.tenantMatchBox}>
                      <View>
                        <Text style={styles.tenantMatchName}>{tenantSearchResult.fullName}</Text>
                        <Text style={styles.tenantMatchEmail}>{tenantSearchResult.email}</Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  createTenantPanel: {
    gap: 12,
    paddingTop: 8,
  },
  createTenantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  createTenantBack: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,104,117,0.1)',
  },
  createTenantTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#006875',
    letterSpacing: 1,
    fontFamily: 'Inter',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#006875',
    letterSpacing: 1.5,
    fontFamily: 'Inter',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#151d1e',
    fontFamily: 'Inter',
    padding: 0,
  },
  statusToggle: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 104, 117, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#006875',
    fontFamily: 'Inter',
  },
  statusActiveOccupied: {
    backgroundColor: '#006875',
    borderColor: '#006875',
  },
  statusTextActive: {
    color: '#fff',
  },
  errorText: {
    color: '#e53935',
    fontSize: 13,
    paddingLeft: 4,
    marginTop: 4,
    fontFamily: 'Inter',
  },
  errorTextFlat: {
    color: '#e53935',
    fontSize: 13,
    marginTop: -8,
    marginBottom: 12,
    paddingLeft: 4,
    fontFamily: 'Inter',
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
  tenantTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
  },
  tenantTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#006875',
    fontFamily: 'Inter',
  },
  sheetSubtitle: {
    fontSize: 11,
    color: '#6b7a7d',
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  removeTenantButton: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
  },
  warningContainer: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(229, 57, 53, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.15)',
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#c62828',
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  successContainer: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.15)',
    marginTop: 8,
    alignItems: 'flex-start',
  },
  suggestionsContainer: {
    maxHeight: 180,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,104,117,0.15)',
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,104,117,0.08)',
    gap: 10,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#151d1e',
    fontFamily: 'Inter',
  },
  suggestionPhone: {
    fontSize: 11,
    color: '#6b7a7d',
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  quickCreatePrompt: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0, 104, 117, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.12)',
    marginBottom: 12,
  },
  quickCreatePromptText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#006875',
    fontFamily: 'Inter',
    flex: 1,
  },
  quickCreateForm: {
    backgroundColor: 'rgba(0, 104, 117, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.08)',
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  quickCreateTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#006875',
    letterSpacing: 1.5,
    fontFamily: 'Inter',
  },
  quickCreateField: {
    gap: 5,
  },
  quickCreateLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#006875',
    letterSpacing: 1,
    fontFamily: 'Inter',
  },
  tenantMatchBox: {
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
  tenantMatchName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1b5e20',
    fontFamily: 'Inter',
  },
  tenantMatchEmail: {
    fontSize: 11,
    color: '#4e7051',
    fontFamily: 'Inter',
  },
});
