import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { RoleResponse } from '@/src/features/properties/api/rolePermission.api';

const ALL_PERMISSIONS = [
  { code: 'PROPERTY_VIEW', name: 'View Property', description: 'Can view property details and announcements', category: 'Property' },
  { code: 'PROPERTY_EDIT', name: 'Edit Property', description: 'Can edit property details, structures, and layouts', category: 'Property' },
  { code: 'PROPERTY_DELETE', name: 'Delete Property', description: 'Can permanently delete the property', category: 'Property' },
  { code: 'LEASE_CREATE', name: 'Create Leases', description: 'Can create and configure leases for units', category: 'Leases' },
  { code: 'LEASE_UPDATE', name: 'Update Leases', description: 'Can update, renew, or terminate active leases', category: 'Leases' },
  { code: 'LEASE_VIEW', name: 'View Leases', description: 'Can view all tenant leases on the property', category: 'Leases' },
  { code: 'EXPENSE_CREATE', name: 'Create Expenses', description: 'Can record property expenses and utility splits', category: 'Expenses' },
  { code: 'EXPENSE_APPROVE', name: 'Approve Expenses', description: 'Can approve and publish expenses to tenants', category: 'Expenses' },
  { code: 'PAYMENT_VIEW', name: 'View Payments', description: 'Can view rent and invoice payment history', category: 'Payments' },
  { code: 'ANNOUNCEMENT_CREATE', name: 'Broadcast Notices', description: 'Can post notice board announcements to tenants', category: 'Announcements' },
  { code: 'MANAGE_STAFF', name: 'Manage Staff', description: 'Can manage other staff roles and invite codes', category: 'Staff' },
];

type ThemeLike = any;
type StylesLike = Record<string, any>;

type PermissionsMatrixModalProps = {
  editingPermissions: string[];
  savingPermissions: boolean;
  selectedRole: RoleResponse | null;
  canDelegatePermission: (permissionCode: string) => boolean;
  handleSavePermissions: () => void;
  handleTogglePermission: (code: string) => void;
  setSelectedRole: (role: RoleResponse | null) => void;
  styles: StylesLike;
  theme: ThemeLike;
};

export function PermissionsMatrixModal({
  editingPermissions,
  savingPermissions,
  selectedRole,
  canDelegatePermission,
  handleSavePermissions,
  handleTogglePermission,
  setSelectedRole,
  styles,
  theme,
}: PermissionsMatrixModalProps) {
  return (
    <Modal visible={selectedRole !== null} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <BlurView intensity={30} style={StyleSheet.absoluteFillObject} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selectedRole?.name}</Text>
              <Text style={styles.modalSub}>Configure assigned permission matrix</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedRole(null)} style={styles.closeIconBtn}>
              <MaterialIcons name="close" size={22} color={theme.Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {Object.entries(
              ALL_PERMISSIONS.reduce((acc, curr) => {
                if (!acc[curr.category]) acc[curr.category] = [];
                acc[curr.category].push(curr);
                return acc;
              }, {} as Record<string, typeof ALL_PERMISSIONS>)
            ).map(([category, items]) => (
              <View key={category} style={styles.categoryBlock}>
                <Text style={styles.categoryHeading}>{category.toUpperCase()}</Text>
                {items.map((item) => {
                  const isChecked = editingPermissions.includes(item.code);
                  const isDelegatable = canDelegatePermission(item.code);

                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={[styles.permCheckRow, !isDelegatable && styles.permCheckRowDisabled]}
                      onPress={() => handleTogglePermission(item.code)}
                      disabled={!isDelegatable}
                      activeOpacity={0.7}
                    >
                      <View style={styles.permCheckInfo}>
                        <Text style={[styles.permCheckName, !isDelegatable && styles.permCheckNameDisabled]}>
                          {item.name}
                        </Text>
                        <Text style={styles.permCheckDesc}>{item.description}</Text>
                      </View>
                      <MaterialIcons
                        name={isChecked ? 'check-box' : 'check-box-outline-blank'}
                        size={24}
                        color={isChecked ? '#006875' : isDelegatable ? 'rgba(0, 104, 117, 0.3)' : 'rgba(107, 122, 125, 0.2)'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleSavePermissions}
              disabled={savingPermissions}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00d4ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtnGradient}
              >
                {savingPermissions ? (
                  <ActivityIndicator color={theme.Colors.surfaceContainerLowest} />
                ) : (
                  <Text style={styles.modalBtnText}>SAVE PERMISSIONS MATRIX</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type CreateCustomRoleModalProps = {
  creatingRole: boolean;
  customRoleModalVisible: boolean;
  newRoleDesc: string;
  newRoleName: string;
  newRolePerms: string[];
  canDelegatePermission: (permissionCode: string) => boolean;
  handleCreateCustomRole: () => void;
  setCustomRoleModalVisible: (visible: boolean) => void;
  setNewRoleDesc: (description: string) => void;
  setNewRoleName: (name: string) => void;
  setNewRolePerms: (permissions: string[]) => void;
  styles: StylesLike;
  theme: ThemeLike;
};

export function CreateCustomRoleModal({
  creatingRole,
  customRoleModalVisible,
  newRoleDesc,
  newRoleName,
  newRolePerms,
  canDelegatePermission,
  handleCreateCustomRole,
  setCustomRoleModalVisible,
  setNewRoleDesc,
  setNewRoleName,
  setNewRolePerms,
  styles,
  theme,
}: CreateCustomRoleModalProps) {
  return (
    <Modal visible={customRoleModalVisible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <BlurView intensity={30} style={StyleSheet.absoluteFillObject} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Create Custom Role</Text>
              <Text style={styles.modalSub}>Define role parameters & permission scope</Text>
            </View>
            <TouchableOpacity onPress={() => setCustomRoleModalVisible(false)} style={styles.closeIconBtn}>
              <MaterialIcons name="close" size={22} color={theme.Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.inputLabel}>ROLE NAME</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="e.g. Senior Floor Manager"
              placeholderTextColor={theme.Colors.onSurfaceVariant}
              value={newRoleName}
              onChangeText={setNewRoleName}
            />

            <Text style={styles.inputLabel}>DESCRIPTION</Text>
            <TextInput
              style={[styles.modalTextInput, { height: 70, paddingTop: 10 }]}
              placeholder="Describe role responsibilities..."
              placeholderTextColor={theme.Colors.onSurfaceVariant}
              value={newRoleDesc}
              onChangeText={setNewRoleDesc}
              multiline
            />

            <Text style={[styles.categoryHeading, { marginTop: 16 }]}>DELEGATED PERMISSIONS</Text>
            {ALL_PERMISSIONS.filter((p) => canDelegatePermission(p.code)).map((p) => {
              const isChecked = newRolePerms.includes(p.code);
              return (
                <TouchableOpacity
                  key={p.code}
                  style={styles.permCheckRow}
                  onPress={() => {
                    if (isChecked) {
                      setNewRolePerms(newRolePerms.filter((code) => code !== p.code));
                    } else {
                      setNewRolePerms([...newRolePerms, p.code]);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.permCheckInfo}>
                    <Text style={styles.permCheckName}>{p.name}</Text>
                    <Text style={styles.permCheckDesc}>{p.description}</Text>
                  </View>
                  <MaterialIcons
                    name={isChecked ? 'check-box' : 'check-box-outline-blank'}
                    size={24}
                    color={isChecked ? '#006875' : 'rgba(0, 104, 117, 0.3)'}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleCreateCustomRole}
              disabled={creatingRole}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00d4ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtnGradient}
              >
                {creatingRole ? <ActivityIndicator color={theme.Colors.surfaceContainerLowest} /> : <Text style={styles.modalBtnText}>CREATE ROLE</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type GenerateInviteCodeModalProps = {
  generatingInvite: boolean;
  inviteMaxUses: string;
  inviteModalVisible: boolean;
  roles: RoleResponse[];
  selectedInviteRole: string;
  canModifyRole: (role: RoleResponse) => boolean;
  handleGenerateInvite: () => void;
  setInviteMaxUses: (maxUses: string) => void;
  setInviteModalVisible: (visible: boolean) => void;
  setSelectedInviteRole: (roleCode: string) => void;
  styles: StylesLike;
  theme: ThemeLike;
};

export function GenerateInviteCodeModal({
  generatingInvite,
  inviteMaxUses,
  inviteModalVisible,
  roles,
  selectedInviteRole,
  canModifyRole,
  handleGenerateInvite,
  setInviteMaxUses,
  setInviteModalVisible,
  setSelectedInviteRole,
  styles,
  theme,
}: GenerateInviteCodeModalProps) {
  return (
    <Modal visible={inviteModalVisible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <BlurView intensity={30} style={StyleSheet.absoluteFillObject} />
        <View style={[styles.modalCard, { maxHeight: 420 }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Generate Staff Join Code</Text>
              <Text style={styles.modalSub}>Create a single-use token for onboarding</Text>
            </View>
            <TouchableOpacity onPress={() => setInviteModalVisible(false)} style={styles.closeIconBtn}>
              <MaterialIcons name="close" size={22} color={theme.Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 24 }}>
            <Text style={styles.inputLabel}>SELECT ROLE TO GRANT</Text>
            <View style={styles.roleChipsRow}>
              {roles
                .filter((r) => r.isActive && canModifyRole(r))
                .map((r) => (
                  <TouchableOpacity
                    key={r.code}
                    style={[styles.roleSelectChip, selectedInviteRole === r.code && styles.roleSelectChipActive]}
                    onPress={() => setSelectedInviteRole(r.code)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.roleSelectChipText,
                        selectedInviteRole === r.code && styles.roleSelectChipTextActive,
                      ]}
                    >
                      {r.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>MAX USES</Text>
            <TextInput
              style={styles.modalTextInput}
              keyboardType="number-pad"
              value={inviteMaxUses}
              onChangeText={setInviteMaxUses}
              placeholder="1"
              placeholderTextColor={theme.Colors.onSurfaceVariant}
            />

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { marginTop: 16 }]}
              onPress={handleGenerateInvite}
              disabled={generatingInvite || !selectedInviteRole}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00d4ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtnGradient}
              >
                {generatingInvite ? (
                  <ActivityIndicator color={theme.Colors.surfaceContainerLowest} />
                ) : (
                  <Text style={styles.modalBtnText}>GENERATE & COPY CODE</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
