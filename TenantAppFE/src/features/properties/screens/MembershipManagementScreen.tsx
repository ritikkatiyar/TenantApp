import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { getMemberships, assignRole, removeRole, transferOwnership, MembershipResponse } from '@/src/features/properties/api/membership.api';
import { searchUserByPhone } from '@/src/features/auth/api/user.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { Theme } from '@/src/theme/Theme';
import { formatErrorMessage } from '@/src/utils/errors';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { ResponsiveHeader } from '@/src/components/common/layout/ResponsiveHeader';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { ActionButton } from '@/src/components/common/inputs/ActionButton';
import { ConfirmDialog } from '@/src/components/common/feedback/ConfirmDialog';

interface UserSearchResponse {
  id: string;
  fullName: string;
  phoneNumber: string;
  authUid: string;
}

interface Props {
  propertyId: string;
}

export default function MembershipManagementScreen({ propertyId }: Props) {
  const router = useRouter();
  const { accessToken } = useAuth();
  
  const [memberships, setMemberships] = useState<MembershipResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResponse[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<UserSearchResponse | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('PROPERTY_MANAGER');

  // ConfirmDialog states
  const [removeDialogVisible, setRemoveDialogVisible] = useState(false);
  const [membershipToRemove, setMembershipToRemove] = useState<MembershipResponse | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const [transferDialogVisible, setTransferDialogVisible] = useState(false);
  const [membershipToTransfer, setMembershipToTransfer] = useState<MembershipResponse | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    loadMemberships();
  }, [propertyId]);

  const loadMemberships = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await getMemberships(accessToken, propertyId);
      setMemberships(data);
    } catch (err: any) {
      Alert.alert('Error', formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!accessToken || !searchPhone.trim()) return;
    try {
      setSearching(true);
      const data = await searchUserByPhone(searchPhone, accessToken);
      const mappedData: UserSearchResponse[] = (data || []).map(item => ({
        id: item.id,
        fullName: item.fullName,
        phoneNumber: item.phoneNumber || '',
        authUid: ''
      }));
      setSearchResults(mappedData);
    } catch (err: any) {
      Alert.alert('Error', formatErrorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const handleAssignRole = async () => {
    if (!accessToken || !selectedUser) return;
    try {
      await assignRole(accessToken, propertyId, {
        userId: selectedUser.id,
        roleCode: selectedRole
      });
      setSearchModalVisible(false);
      setSelectedUser(null);
      setSearchPhone('');
      setSearchResults([]);
      loadMemberships();
      Alert.alert('Success', 'Role assigned successfully');
    } catch (err: any) {
      Alert.alert('Error', formatErrorMessage(err));
    }
  };

  const triggerRemoveRole = (membership: MembershipResponse) => {
    setMembershipToRemove(membership);
    setRemoveDialogVisible(true);
  };

  const executeRemoveRole = async () => {
    if (!accessToken || !membershipToRemove) return;
    try {
      setIsRemoving(true);
      await removeRole(accessToken, propertyId, membershipToRemove.id);
      setRemoveDialogVisible(false);
      setMembershipToRemove(null);
      loadMemberships();
    } catch (err: any) {
      Alert.alert('Error', formatErrorMessage(err));
    } finally {
      setIsRemoving(false);
    }
  };

  const triggerTransferOwnership = (membership: MembershipResponse) => {
    setMembershipToTransfer(membership);
    setTransferDialogVisible(true);
  };

  const executeTransferOwnership = async () => {
    if (!accessToken || !membershipToTransfer) return;
    try {
      setIsTransferring(true);
      await transferOwnership(accessToken, propertyId, { toUserId: membershipToTransfer.userId });
      setTransferDialogVisible(false);
      setMembershipToTransfer(null);
      loadMemberships();
      Alert.alert('Success', 'Ownership transferred successfully');
    } catch (err: any) {
      Alert.alert('Error', formatErrorMessage(err));
    } finally {
      setIsTransferring(false);
    }
  };

  const renderItem = ({ item }: { item: MembershipResponse }) => (
    <GlassCard style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <StatusPill status={item.roleName || item.roleCode} style={styles.pillOverride} />
      </View>
      <View style={styles.cardActions}>
        {item.roleCode !== 'PROPERTY_OWNER' && (
          <TouchableOpacity onPress={() => triggerTransferOwnership(item)} style={styles.actionBtn}>
            <MaterialIcons name="swap-horiz" size={20} color={Theme.Colors.primary} />
          </TouchableOpacity>
        )}
        {item.roleCode !== 'PROPERTY_OWNER' && (
          <TouchableOpacity onPress={() => triggerRemoveRole(item)} style={styles.actionBtn}>
            <MaterialIcons name="delete-outline" size={20} color={Theme.Colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );

  const renderHeaderRight = () => (
    <TouchableOpacity onPress={() => setSearchModalVisible(true)} style={styles.addBtn}>
      <MaterialIcons name="person-add" size={24} color={Theme.Colors.primary} />
    </TouchableOpacity>
  );

  return (
    <PageShell contentContainerStyle={styles.container}>
      <ResponsiveHeader 
        title="Manage Staff" 
        onBack={() => router.back()} 
        rightAction={renderHeaderRight()}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={memberships.filter(m => m.roleCode !== 'PROPERTY_TENANT')}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No staff members found.</Text>
          }
        />
      )}

      {/* Remove Role confirmation */}
      <ConfirmDialog
        visible={removeDialogVisible}
        title="Remove Staff"
        message={`Are you sure you want to remove ${membershipToRemove?.fullName || ''} from this property?`}
        onConfirm={executeRemoveRole}
        onCancel={() => {
          setRemoveDialogVisible(false);
          setMembershipToRemove(null);
        }}
        confirmText="Remove"
        isDestructive
        loading={isRemoving}
      />

      {/* Transfer Ownership confirmation */}
      <ConfirmDialog
        visible={transferDialogVisible}
        title="Transfer Ownership"
        message={`Transfer ownership to ${membershipToTransfer?.fullName || ''}? You will be demoted to Manager.`}
        onConfirm={executeTransferOwnership}
        onCancel={() => {
          setTransferDialogVisible(false);
          setMembershipToTransfer(null);
        }}
        confirmText="Transfer"
        loading={isTransferring}
      />

      {/* Add Staff Modal */}
      <Modal visible={searchModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Staff Member</Text>
              <TouchableOpacity onPress={() => {
                setSearchModalVisible(false);
                setSelectedUser(null);
              }}>
                <MaterialIcons name="close" size={24} color={Theme.Colors.onSurface} />
              </TouchableOpacity>
            </View>

            {!selectedUser ? (
              <>
                <Text style={styles.label}>Search User by Phone</Text>
                <View style={styles.searchRow}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Enter phone number"
                    value={searchPhone}
                    onChangeText={setSearchPhone}
                    keyboardType="phone-pad"
                  />
                  <ActionButton 
                    title="Search" 
                    onPress={handleSearch} 
                    loading={searching}
                    style={styles.searchBtn} 
                  />
                </View>

                <FlatList
                  data={searchResults}
                  keyExtractor={item => item.id}
                  style={{ maxHeight: 200, marginTop: 10 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.userResult} onPress={() => setSelectedUser(item)}>
                      <Text style={styles.userName}>{item.fullName}</Text>
                      <Text style={styles.userPhone}>{item.phoneNumber}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Selected User</Text>
                <View style={styles.userResult}>
                  <Text style={styles.userName}>{selectedUser.fullName}</Text>
                  <Text style={styles.userPhone}>{selectedUser.phoneNumber}</Text>
                </View>

                <Text style={[styles.label, { marginTop: 16 }]}>Select Role</Text>
                <View style={styles.roleOptions}>
                  <TouchableOpacity 
                    style={[styles.roleOption, selectedRole === 'PROPERTY_MANAGER' && styles.roleOptionActive]}
                    onPress={() => setSelectedRole('PROPERTY_MANAGER')}
                  >
                    <Text style={[styles.roleOptionText, selectedRole === 'PROPERTY_MANAGER' && styles.roleOptionTextActive]}>Manager</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleOption, selectedRole === 'PROPERTY_CARETAKER' && styles.roleOptionActive]}
                    onPress={() => setSelectedRole('PROPERTY_CARETAKER')}
                  >
                    <Text style={[styles.roleOptionText, selectedRole === 'PROPERTY_CARETAKER' && styles.roleOptionTextActive]}>Caretaker</Text>
                  </TouchableOpacity>
                </View>

                <ActionButton 
                  title="Assign Role" 
                  onPress={handleAssignRole}
                  style={styles.assignBtn}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  addBtn: { padding: 4 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: Theme.Spacing.containerPadding,
  },
  card: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: Theme.Colors.onSurface },
  email: { fontSize: 13, color: Theme.Colors.onSurfaceVariant, marginTop: 2 },
  pillOverride: {
    marginTop: 8,
  },
  cardActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 8 },
  emptyText: { textAlign: 'center', color: Theme.Colors.onSurfaceVariant, marginTop: 40 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: Theme.Colors.onSurfaceVariant },
  searchRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 48,
  },
  searchBtn: {
    justifyContent: 'center',
    height: 48,
  },
  userResult: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  userName: { fontSize: 16, fontWeight: '600' },
  userPhone: { fontSize: 14, color: Theme.Colors.onSurfaceVariant, marginTop: 4 },
  roleOptions: { flexDirection: 'row', gap: 12 },
  roleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  roleOptionActive: {
    borderColor: Theme.Colors.primary,
    backgroundColor: '#e6f7ff',
  },
  roleOptionText: { fontWeight: '600', color: Theme.Colors.onSurfaceVariant },
  roleOptionTextActive: { color: Theme.Colors.primary },
  assignBtn: {
    marginTop: 24,
  },
});

