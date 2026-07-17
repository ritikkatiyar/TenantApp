import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { getMemberships, assignRole, removeRole, transferOwnership, MembershipResponse } from '@/src/features/properties/api/membership.api';
import { apiRequest } from '@/src/api/client';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { Theme } from '@/src/theme/Theme';
import { formatErrorMessage } from '@/src/utils/errors';

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
      const data = await apiRequest<UserSearchResponse[]>(`/api/v1/user/search?phone=${encodeURIComponent(searchPhone)}`, {
        method: 'GET',
        token: accessToken
      });
      setSearchResults(data);
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

  const handleRemoveRole = (membership: MembershipResponse) => {
    Alert.alert('Confirm', `Remove ${membership.fullName} from property?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        if (!accessToken) return;
        try {
          await removeRole(accessToken, propertyId, membership.id);
          loadMemberships();
        } catch (err: any) {
          Alert.alert('Error', formatErrorMessage(err));
        }
      }}
    ]);
  };

  const handleTransferOwnership = (membership: MembershipResponse) => {
    Alert.alert('Confirm Transfer', `Transfer ownership to ${membership.fullName}? You will be demoted to Manager.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Transfer', style: 'destructive', onPress: async () => {
        if (!accessToken) return;
        try {
          await transferOwnership(accessToken, propertyId, { toUserId: membership.userId });
          loadMemberships();
          Alert.alert('Success', 'Ownership transferred successfully');
        } catch (err: any) {
          Alert.alert('Error', formatErrorMessage(err));
        }
      }}
    ]);
  };

  const renderItem = ({ item }: { item: MembershipResponse }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{item.roleName || item.roleCode}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        {item.roleCode !== 'PROPERTY_OWNER' && (
          <TouchableOpacity onPress={() => handleTransferOwnership(item)} style={styles.actionBtn}>
            <MaterialIcons name="swap-horiz" size={20} color={Theme.Colors.primary} />
          </TouchableOpacity>
        )}
        {item.roleCode !== 'PROPERTY_OWNER' && (
          <TouchableOpacity onPress={() => handleRemoveRole(item)} style={styles.actionBtn}>
            <MaterialIcons name="delete-outline" size={20} color={Theme.Colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Theme.Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Staff</Text>
        <TouchableOpacity onPress={() => setSearchModalVisible(true)} style={styles.addBtn}>
          <MaterialIcons name="person-add" size={24} color={Theme.Colors.primary} />
        </TouchableOpacity>
      </View>

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
                  <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
                    {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchBtnText}>Search</Text>}
                  </TouchableOpacity>
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

                <TouchableOpacity style={styles.assignBtn} onPress={handleAssignRole}>
                  <Text style={styles.assignBtnText}>Assign Role</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  addBtn: { padding: 4 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.Colors.onSurface,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: Theme.Colors.onSurface },
  email: { fontSize: 13, color: Theme.Colors.onSurfaceVariant, marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e6f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  roleText: { fontSize: 11, fontWeight: '600', color: '#0050b3' },
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
  searchRow: { flexDirection: 'row', gap: 12 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchBtn: {
    backgroundColor: Theme.Colors.primary,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  searchBtnText: { color: '#fff', fontWeight: '600' },
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
    backgroundColor: Theme.Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  assignBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
