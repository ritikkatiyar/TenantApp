import React, { useEffect, useState } from 'react';
import { Alert, Clipboard } from 'react-native';
import {
  getPropertyRoles,
  toggleRoleActive,
  updateRolePermissions,
  createCustomRole,
  generateJoinCode,
  getPropertyJoinCodes,
  RoleResponse,
  JoinCodeResponse,
} from '@/src/features/properties/api/rolePermission.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useProperties } from '@/src/hooks/useProperties';
import { useToast } from '@/src/components/common/feedback/ToastContext';

type ActiveTab = 'roles' | 'invites' | 'preferences';

export function useSettings(paramPropertyId: string | null) {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const propertyId = paramPropertyId || (properties && properties.length > 0 ? properties[0].id : null);
  const { accessToken, context } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('roles');
  const [loading, setLoading] = useState(true);

  // Core Data
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [invites, setInvites] = useState<JoinCodeResponse[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<RoleResponse | null>(null);

  // System Preferences State
  const [autoInvoiceDay, setAutoInvoiceDay] = useState('1st of Month');
  const [enableWhatsappAlerts, setEnableWhatsappAlerts] = useState(true);
  const [enableEmailAlerts, setEnableEmailAlerts] = useState(true);
  const [enableLateFee, setEnableLateFee] = useState(true);
  const [lateFeeGraceDays, setLateFeeGraceDays] = useState('5');
  const [lateFeeAmount, setLateFeeAmount] = useState('500');

  // Edit Role Modal State
  const [selectedRole, setSelectedRole] = useState<RoleResponse | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Custom Role Modal State
  const [customRoleModalVisible, setCustomRoleModalVisible] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);
  const [creatingRole, setCreatingRole] = useState(false);

  // Generate Invite Modal State
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [selectedInviteRole, setSelectedInviteRole] = useState('');
  const [inviteMaxUses, setInviteMaxUses] = useState('1');
  const [generatingInvite, setGeneratingInvite] = useState(false);

  useEffect(() => {
    if (propertiesLoading) return;
    if (!properties || properties.length === 0) {
      setLoading(false);
      return;
    }
    if (propertyId && accessToken) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [propertyId, accessToken, properties, propertiesLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedRoles, fetchedInvites] = await Promise.all([
        getPropertyRoles(accessToken!, propertyId as string),
        getPropertyJoinCodes(accessToken!, propertyId as string),
      ]);

      setRoles(fetchedRoles || []);
      setInvites(fetchedInvites || []);

      const myMembership = context?.managedProperties.find((m) => m.propertyId === propertyId);
      if (myMembership) {
        const found = (fetchedRoles || []).find((r) => r.code === myMembership.membershipRoleCode);
        if (found) {
          setCurrentUserRole(found);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const getRoleRank = (code: string, currentRank: number) => {
    if (code === 'PROPERTY_OWNER') return 100;
    if (code === 'PROPERTY_MANAGER') return 50;
    if (code === 'PROPERTY_CARETAKER') return 20;
    if (code === 'PROPERTY_TENANT') return 10;
    return currentRank;
  };

  const canModifyRole = (targetRole: RoleResponse) => {
    if (!currentUserRole) return false;
    const myRank = getRoleRank(currentUserRole.code, currentUserRole.roleRank);
    const targetRank = getRoleRank(targetRole.code, targetRole.roleRank);
    return myRank > targetRank;
  };

  const canDelegatePermission = (permissionCode: string) => {
    if (!currentUserRole) return false;
    if (currentUserRole.code === 'PROPERTY_OWNER') return true;
    return currentUserRole.permissionCodes.includes(permissionCode);
  };

  const handleToggleRoleActive = async (role: RoleResponse, value: boolean) => {
    try {
      await toggleRoleActive(accessToken!, propertyId as string, role.code, value);
      showToast(`Role ${role.name} ${value ? 'enabled' : 'disabled'}`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update role status', 'error');
    }
  };

  const handleOpenEditPermissions = (role: RoleResponse) => {
    setSelectedRole(role);
    setEditingPermissions([...role.permissionCodes]);
  };

  const handleTogglePermission = (code: string) => {
    if (!canDelegatePermission(code)) return;
    if (editingPermissions.includes(code)) {
      setEditingPermissions(editingPermissions.filter((p) => p !== code));
    } else {
      setEditingPermissions([...editingPermissions, code]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      setSavingPermissions(true);
      await updateRolePermissions(accessToken!, propertyId as string, selectedRole.code, editingPermissions);
      setSelectedRole(null);
      loadData();
      showToast('Permissions matrix updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update permissions', 'error');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleCreateCustomRole = async () => {
    if (!newRoleName.trim()) {
      showToast('Please enter a role name', 'error');
      return;
    }

    try {
      setCreatingRole(true);
      await createCustomRole(accessToken!, propertyId as string, {
        name: newRoleName,
        description: newRoleDesc,
        permissionCodes: newRolePerms,
      });

      setCustomRoleModalVisible(false);
      setNewRoleName('');
      setNewRoleDesc('');
      setNewRolePerms([]);
      loadData();
      showToast('Custom role created successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create role', 'error');
    } finally {
      setCreatingRole(false);
    }
  };

  const handleGenerateInvite = async () => {
    if (!selectedInviteRole) {
      showToast('Please select a target role', 'error');
      return;
    }
    const maxUses = parseInt(inviteMaxUses, 10);
    if (isNaN(maxUses) || maxUses <= 0) {
      showToast('Max uses must be at least 1', 'error');
      return;
    }

    try {
      setGeneratingInvite(true);
      const codeRes = await generateJoinCode(accessToken!, propertyId as string, selectedInviteRole, maxUses);
      setInviteModalVisible(false);
      setSelectedInviteRole('');
      setInviteMaxUses('1');
      loadData();
      showToast(`Invite code generated: ${codeRes.code}`, 'success');
      Clipboard.setString(codeRes.code);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate code', 'error');
    } finally {
      setGeneratingInvite(false);
    }
  };

  return {
    properties,
    propertiesLoading,
    propertyId,
    activeTab,
    setActiveTab,
    loading,
    roles,
    invites,
    currentUserRole,
    autoInvoiceDay,
    setAutoInvoiceDay,
    enableWhatsappAlerts,
    setEnableWhatsappAlerts,
    enableEmailAlerts,
    setEnableEmailAlerts,
    enableLateFee,
    setEnableLateFee,
    lateFeeGraceDays,
    setLateFeeGraceDays,
    lateFeeAmount,
    setLateFeeAmount,
    selectedRole,
    setSelectedRole,
    editingPermissions,
    savingPermissions,
    customRoleModalVisible,
    setCustomRoleModalVisible,
    newRoleName,
    setNewRoleName,
    newRoleDesc,
    setNewRoleDesc,
    newRolePerms,
    setNewRolePerms,
    creatingRole,
    inviteModalVisible,
    setInviteModalVisible,
    selectedInviteRole,
    setSelectedInviteRole,
    inviteMaxUses,
    setInviteMaxUses,
    generatingInvite,
    canModifyRole,
    canDelegatePermission,
    handleToggleRoleActive,
    handleOpenEditPermissions,
    handleTogglePermission,
    handleSavePermissions,
    handleCreateCustomRole,
    handleGenerateInvite,
    refresh: loadData,
  };
}
