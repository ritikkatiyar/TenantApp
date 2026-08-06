import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, Alert, Modal, TextInput, Switch, Clipboard, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { getPropertyRoles, toggleRoleActive, updateRolePermissions, createCustomRole, generateJoinCode, getPropertyJoinCodes, RoleResponse, JoinCodeResponse } from '@/src/features/properties/api/rolePermission.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { Theme } from '@/src/theme/Theme';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';

import { useProperties } from '@/src/hooks/useProperties';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

const LUMINOUS_BACKGROUND = ['#d4f5f9', '#e8f8fb', '#e2e0fb'] as const;

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
  { code: 'MANAGE_STAFF', name: 'Manage Staff', description: 'Can manage other staff roles and invite codes', category: 'Staff' }
];

export default function SystemPreferencesRoute() {
  const router = useRouter();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { properties, isLoading: propertiesLoading } = useProperties();
  const propertyId = paramPropertyId || (properties && properties.length > 0 ? properties[0].id : null);
  const { accessToken, context } = useAuth();
  const { showToast } = useToast();
  const { handleScroll } = useScrollNav();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [activeTab, setActiveTab] = useState<'roles' | 'invites'>('roles');

  const [loading, setLoading] = useState(true);

  // Core Data
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [invites, setInvites] = useState<JoinCodeResponse[]>([]);

  // Current User Context Info
  const [currentUserRole, setCurrentUserRole] = useState<RoleResponse | null>(null);

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
        getPropertyJoinCodes(accessToken!, propertyId as string)
      ]);

      setRoles(fetchedRoles);
      setInvites(fetchedInvites);

      // Determine current user's role on this property
      const myMembership = context?.managedProperties.find(m => m.propertyId === propertyId);
      if (myMembership) {
        const found = fetchedRoles.find(r => r.code === myMembership.membershipRoleCode);
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

  // Checks if current user is allowed to modify the target role
  const canModifyRole = (targetRole: RoleResponse) => {
    if (!currentUserRole) return false;
    const myRank = getRoleRank(currentUserRole.code, currentUserRole.roleRank);
    const targetRank = getRoleRank(targetRole.code, targetRole.roleRank);

    // Only allow editing if actor has strictly higher rank
    return myRank > targetRank;
  };

  // Checks if current user has the permission to delegate it
  const canDelegatePermission = (permissionCode: string) => {
    if (!currentUserRole) return false;
    if (currentUserRole.code === 'PROPERTY_OWNER') return true; // Owner possesses all
    return currentUserRole.permissionCodes.includes(permissionCode);
  };

  const handleToggleRoleActive = async (role: RoleResponse, value: boolean) => {
    try {
      await toggleRoleActive(accessToken!, propertyId as string, role.code, value);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update role status');
    }
  };

  const handleOpenEditPermissions = (role: RoleResponse) => {
    setSelectedRole(role);
    setEditingPermissions([...role.permissionCodes]);
  };

  const handleTogglePermission = (code: string) => {
    if (!canDelegatePermission(code)) return; // Cannot add/remove if user doesn't possess it

    if (editingPermissions.includes(code)) {
      setEditingPermissions(editingPermissions.filter(p => p !== code));
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
      Alert.alert('Success', 'Permissions updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleCreateCustomRole = async () => {
    if (!newRoleName.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }

    try {
      setCreatingRole(true);
      await createCustomRole(accessToken!, propertyId as string, {
        name: newRoleName,
        description: newRoleDesc,
        permissionCodes: newRolePerms
      });

      setCustomRoleModalVisible(false);
      setNewRoleName('');
      setNewRoleDesc('');
      setNewRolePerms([]);
      loadData();
      Alert.alert('Success', 'Custom role created successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create role');
    } finally {
      setCreatingRole(false);
    }
  };

  const handleGenerateInvite = async () => {
    if (!selectedInviteRole) {
      Alert.alert('Validation', 'Please select a role');
      return;
    }
    const maxUses = parseInt(inviteMaxUses);
    if (isNaN(maxUses) || maxUses <= 0) {
      Alert.alert('Validation', 'Max uses must be at least 1');
      return;
    }

    try {
      setGeneratingInvite(true);
      const codeRes = await generateJoinCode(accessToken!, propertyId as string, selectedInviteRole, maxUses);
      setInviteModalVisible(false);
      setSelectedInviteRole('');
      setInviteMaxUses('1');
      loadData();
      Alert.alert('Invite Code Generated', `Share code: ${codeRes.code}`, [
        { text: 'Copy Code', onPress: () => Clipboard.setString(codeRes.code) },
        { text: 'OK' }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate code');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const renderRoleCard = ({ item }: { item: RoleResponse }) => {
    const isOwner = item.code === 'PROPERTY_OWNER';
    const isTenant = item.code === 'PROPERTY_TENANT';
    const canEdit = canModifyRole(item) && !isOwner;

    return (
      <BlurView intensity={65} tint="light" style={styles.glassCard}>
        <View style={styles.roleCardHeader}>
          <View style={styles.roleTitleGroup}>
            <Text style={styles.roleName}>{item.name}</Text>
            {item.propertyId && (
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>Custom</Text>
              </View>
            )}
          </View>
          {!isOwner && !isTenant && (
            <Switch
              value={item.isActive}
              onValueChange={(val) => handleToggleRoleActive(item, val)}
              disabled={!canEdit}
              trackColor={{ false: 'rgba(0, 104, 117, 0.15)', true: '#006875' }}
              thumbColor={item.isActive ? '#00d4ff' : '#6b7a7d'}
            />
          )}
        </View>
        <Text style={styles.roleDesc}>{item.description || 'No description provided.'}</Text>
        
        <View style={styles.roleCardFooter}>
          <View style={styles.permissionBadge}>
            <MaterialIcons name="security" size={14} color="#006875" />
            <Text style={styles.permissionBadgeText}>{item.permissionCodes.length} Permissions</Text>
          </View>
          <TouchableOpacity 
            style={[styles.editPermissionsBtn, !canEdit && styles.editPermissionsBtnDisabled]}
            disabled={!canEdit}
            onPress={() => handleOpenEditPermissions(item)}
          >
            <Text style={styles.editPermissionsBtnText}>
              {canEdit ? 'Configure' : 'View-Only'}
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    );
  };

  const renderInviteCard = ({ item }: { item: JoinCodeResponse }) => {
    const expiresDate = item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Never';
    return (
      <BlurView intensity={65} tint="light" style={styles.glassCard}>
        <View style={styles.inviteCardHeader}>
          <Text style={styles.inviteCode}>{item.code}</Text>
          <View style={[styles.statusTag, item.isActive ? styles.statusTagActive : styles.statusTagInactive]}>
            <Text style={item.isActive ? styles.statusTagTextActive : styles.statusTagTextInactive}>
              {item.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>
        
        <View style={styles.inviteMetaGrid}>
          <View style={styles.inviteMetaItem}>
            <Text style={styles.inviteMetaLabel}>ROLE GRANTED</Text>
            <Text style={styles.inviteMetaValue}>{item.roleName}</Text>
          </View>
          <View style={styles.inviteMetaItem}>
            <Text style={styles.inviteMetaLabel}>USES LIMIT</Text>
            <Text style={styles.inviteMetaValue}>{item.usesCount} / {item.maxUses}</Text>
          </View>
          <View style={styles.inviteMetaItem}>
            <Text style={styles.inviteMetaLabel}>EXPIRY DATE</Text>
            <Text style={styles.inviteMetaValue}>{expiresDate}</Text>
          </View>
        </View>

        {item.isActive && (
          <TouchableOpacity 
            style={styles.copyBtn} 
            onPress={() => {
              Clipboard.setString(item.code);
              Alert.alert('Copied', 'Code copied to clipboard');
            }}
          >
            <MaterialIcons name="content-copy" size={16} color="#006875" />
            <Text style={styles.copyBtnText}>Copy Invitation Code</Text>
          </TouchableOpacity>
        )}
      </BlurView>
    );
  };

  const ModalContainer = ({ children }: { children: React.ReactNode }) => {
    if (isDesktop) {
      return (
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} style={StyleSheet.absoluteFillObject} />
          <View style={[styles.modalPopup, { width: 650, maxHeight: '85%', padding: 0, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.8)' }]}>
            <LinearGradient colors={LUMINOUS_BACKGROUND} style={StyleSheet.absoluteFillObject} />
            {children}
          </View>
        </View>
      );
    } else {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top']}>
          <LinearGradient colors={LUMINOUS_BACKGROUND} style={StyleSheet.absoluteFillObject} />
          {children}
        </SafeAreaView>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={isDesktop ? ['top'] : []}>
      <LinearGradient colors={LUMINOUS_BACKGROUND} style={StyleSheet.absoluteFillObject} />
      
      {/* Header */}
      {isDesktop && (
        <DesktopNavBar 
          properties={properties || []}
          selectedPropertyId={propertyId}
          onPropertyChange={(id) => router.replace(`/settings?propertyId=${id}`)}
        />
      )}

        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: isDesktop ? 40 : 20, paddingTop: isDesktop ? 24 : 12, paddingBottom: 100 }}
        >
          <View style={isDesktop ? { maxWidth: 1080, alignSelf: 'center', width: '100%' } : { width: '100%' }}>
            
            {/* Title Header */}
            {isDesktop && (
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 32, fontWeight: '800', color: '#151d1e', lineHeight: 38, letterSpacing: -0.5 }}>
                  System & Team Settings
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7a7d', marginTop: 4, fontWeight: '500', lineHeight: 20 }}>
                  Manage property roles, staff invite permissions, system parameters & subscription billing
                </Text>
              </View>
            )}

            {/* Zero Property Warning Banner */}
            {!propertiesLoading && properties.length === 0 && (
              <BlurView intensity={60} tint="light" style={{ padding: 24, borderRadius: 20, marginBottom: 24, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.7)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0, 104, 117, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="business" size={26} color="#006875" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#163235', marginBottom: 2 }}>No Property Created Yet</Text>
                    <Text style={{ fontSize: 13, color: '#6b7a7d', lineHeight: 18 }}>Property roles and team permissions require an active property context. Create your first property to start configuring staff roles.</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={{ borderRadius: 100, overflow: 'hidden' }}
                  onPress={() => router.push('/properties/create')}
                >
                  <LinearGradient colors={['#00d4ff', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>CREATE PROPERTY</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>
            )}

            {/* Hub Menu Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (properties.length === 0) {
                    showToast('Please create a property first to configure team roles.', 'error');
                    router.push('/properties/create');
                    return;
                  }
                  setActiveTab('roles');
                }}
                style={{ flex: 1, minWidth: isDesktop ? 220 : '100%', opacity: properties.length === 0 ? 0.6 : 1 }}
              >
                <BlurView intensity={60} tint="light" style={{ padding: 20, borderRadius: 20, borderWidth: 1.5, borderColor: activeTab === 'roles' && properties.length > 0 ? '#006875' : 'rgba(255,255,255,0.7)', backgroundColor: activeTab === 'roles' && properties.length > 0 ? 'rgba(0,104,117,0.06)' : 'rgba(255,255,255,0.5)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(8, 145, 178, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                      <MaterialIcons name="admin-panel-settings" size={24} color="#0891b2" />
                    </View>
                    <View style={{ backgroundColor: 'rgba(8, 145, 178, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#0891b2' }}>{roles.length} Roles</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#163235', marginBottom: 4 }}>Team Roles & Permissions</Text>
                  <Text style={{ fontSize: 12, color: '#6b7a7d', lineHeight: 17 }}>Define custom staff roles & fine-grained permission matrices.</Text>
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (properties.length === 0) {
                    showToast('Please create a property first to generate invite codes.', 'error');
                    router.push('/properties/create');
                    return;
                  }
                  setActiveTab('invites');
                }}
                style={{ flex: 1, minWidth: isDesktop ? 220 : '100%', opacity: properties.length === 0 ? 0.6 : 1 }}
              >
                <BlurView intensity={60} tint="light" style={{ padding: 20, borderRadius: 20, borderWidth: 1.5, borderColor: activeTab === 'invites' && properties.length > 0 ? '#006875' : 'rgba(255,255,255,0.7)', backgroundColor: activeTab === 'invites' && properties.length > 0 ? 'rgba(0,104,117,0.06)' : 'rgba(255,255,255,0.5)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0, 212, 255, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                      <MaterialIcons name="vpn-key" size={24} color="#0072ff" />
                    </View>
                    <View style={{ backgroundColor: 'rgba(0, 212, 255, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#0072ff' }}>{invites.length} Codes</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#163235', marginBottom: 4 }}>Staff Join Codes</Text>
                  <Text style={{ fontSize: 12, color: '#6b7a7d', lineHeight: 17 }}>Generate single-use invite keys to onboard managers & staff.</Text>
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (properties.length === 0) {
                    showToast('Please create a property first to configure system preferences.', 'error');
                    router.push('/properties/create');
                    return;
                  }
                  showToast('System defaults & notification settings configured.', 'info');
                }}
                style={{ flex: 1, minWidth: isDesktop ? 220 : '100%', opacity: properties.length === 0 ? 0.6 : 1 }}
              >
                <BlurView intensity={60} tint="light" style={{ padding: 20, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.5)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(139, 92, 246, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                      <MaterialIcons name="tune" size={24} color="#8b5cf6" />
                    </View>
                    <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#8b5cf6' }}>Active</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#163235', marginBottom: 4 }}>System Preferences</Text>
                  <Text style={{ fontSize: 12, color: '#6b7a7d', lineHeight: 17 }}>Notifications defaults, auto-invoicing rules & localizations.</Text>
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/billing' as any)}
                style={{ flex: 1, minWidth: isDesktop ? 220 : '100%' }}
              >
                <BlurView intensity={60} tint="light" style={{ padding: 20, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.5)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(236, 72, 153, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                      <MaterialIcons name="credit-card" size={24} color="#ec4899" />
                    </View>
                    <View style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#ec4899' }}>SaaS Plan</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#163235', marginBottom: 4 }}>Subscription & Billing</Text>
                  <Text style={{ fontSize: 12, color: '#6b7a7d', lineHeight: 17 }}>Manage plan tier, Razorpay gateway & AI credit wallet.</Text>
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Active Content Section */}
            {propertiesLoading || loading ? (
              <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#006875" />
              </View>
            ) : properties.length > 0 ? (
              <View style={{ flex: 1 }}>
                {activeTab === 'roles' ? (
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#163235' }}>Property Roles & Permission Matrix</Text>
                      {currentUserRole?.code === 'PROPERTY_OWNER' && (
                        <TouchableOpacity style={{ borderRadius: 100, overflow: 'hidden' }} onPress={() => {
                          setNewRolePerms([...currentUserRole.permissionCodes]);
                          setCustomRoleModalVisible(true);
                        }}>
                          <LinearGradient colors={['#00d4ff', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MaterialIcons name="add" size={18} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>CREATE ROLE</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </View>
                    <FlatList
                      data={roles}
                      renderItem={renderRoleCard}
                      keyExtractor={item => item.id}
                      scrollEnabled={false}
                    />
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#163235' }}>Active Staff Invite Codes</Text>
                      <TouchableOpacity style={{ borderRadius: 100, overflow: 'hidden' }} onPress={() => setInviteModalVisible(true)}>
                        <LinearGradient colors={['#00d4ff', '#0072ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialIcons name="vpn-key" size={18} color="#fff" />
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>GENERATE INVITE</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={invites}
                      renderItem={renderInviteCard}
                      keyExtractor={item => item.id}
                      scrollEnabled={false}
                      ListEmptyComponent={
                        <Text style={styles.emptyText}>No invite codes generated yet.</Text>
                      }
                    />
                  </View>
                )}
              </View>
            ) : null}
          </View>
        </ScrollView>

      {/* Permissions Editor Modal */}
      <Modal visible={selectedRole !== null} animationType={isDesktop ? "fade" : "slide"} transparent={isDesktop}>
        <ModalContainer>
          
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selectedRole?.name}</Text>
              <Text style={styles.modalSubtitle}>Configure Assigned System Permissions</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedRole(null)} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color="#163235" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {Object.entries(
              ALL_PERMISSIONS.reduce((acc, curr) => {
                if (!acc[curr.category]) acc[curr.category] = [];
                acc[curr.category].push(curr);
                return acc;
              }, {} as Record<string, typeof ALL_PERMISSIONS>)
            ).map(([category, items]) => (
              <View key={category} style={styles.permissionCategoryGroup}>
                <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
                {items.map(item => {
                  const isChecked = editingPermissions.includes(item.code);
                  const isDelegatable = canDelegatePermission(item.code);
                  
                  return (
                    <TouchableOpacity 
                      key={item.code} 
                      style={[styles.permissionRow, !isDelegatable && styles.permissionRowDisabled]}
                      onPress={() => handleTogglePermission(item.code)}
                      disabled={!isDelegatable}
                    >
                      <View style={styles.permissionInfo}>
                        <Text style={[styles.permissionName, !isDelegatable && styles.permissionTextDisabled]}>{item.name}</Text>
                        <Text style={styles.permissionDesc}>{item.description}</Text>
                      </View>
                      <MaterialIcons 
                        name={isChecked ? "check-box" : "check-box-outline-blank"} 
                        size={24} 
                        color={isChecked ? "#006875" : (isDelegatable ? "rgba(0, 104, 117, 0.3)" : "rgba(107, 122, 125, 0.2)")} 
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSavePermissions} disabled={savingPermissions}>
              <LinearGradient
                colors={['#00d4ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                {savingPermissions ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>SAVE CONFIGURATION</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ModalContainer>
      </Modal>

      {/* Create Custom Role Modal */}
      <Modal visible={customRoleModalVisible} animationType={isDesktop ? "fade" : "slide"} transparent={isDesktop}>
        <ModalContainer>
          
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Create Custom Role</Text>
              <Text style={styles.modalSubtitle}>Define role parameters and delegation subset</Text>
            </View>
            <TouchableOpacity onPress={() => setCustomRoleModalVisible(false)} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color="#163235" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            <Text style={styles.fieldLabel}>ROLE DISPLAY NAME</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Assistant Caretaker"
              placeholderTextColor="#6b7a7d"
              value={newRoleName}
              onChangeText={setNewRoleName}
            />



            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <TextInput
              style={[styles.fieldInput, { height: 80, paddingTop: 12 }]}
              placeholder="Provide a brief description of the role's purpose..."
              placeholderTextColor="#6b7a7d"
              value={newRoleDesc}
              onChangeText={setNewRoleDesc}
              multiline
            />

            <Text style={[styles.categoryTitle, { marginTop: 24, marginBottom: 4 }]}>DELEGATED PERMISSIONS</Text>
            <Text style={{ fontSize: 12, color: '#6b7a7d', marginBottom: 16 }}>
              You can only delegate permissions that your own role currently possesses.
            </Text>

            {ALL_PERMISSIONS.filter(p => canDelegatePermission(p.code)).map(p => {
              const isChecked = newRolePerms.includes(p.code);
              return (
                <TouchableOpacity 
                  key={p.code} 
                  style={styles.permissionRow} 
                  onPress={() => {
                    if (isChecked) {
                      setNewRolePerms(newRolePerms.filter(code => code !== p.code));
                    } else {
                      setNewRolePerms([...newRolePerms, p.code]);
                    }
                  }}
                >
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permissionName}>{p.name}</Text>
                    <Text style={styles.permissionDesc}>{p.description}</Text>
                  </View>
                  <MaterialIcons 
                    name={isChecked ? "check-box" : "check-box-outline-blank"} 
                    size={24} 
                    color={isChecked ? "#006875" : "rgba(0, 104, 117, 0.3)"} 
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateCustomRole} disabled={creatingRole}>
              <LinearGradient
                colors={['#00d4ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                {creatingRole ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>CREATE CUSTOM ROLE</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ModalContainer>
      </Modal>

      {/* Generate Invite Code Modal */}
      <Modal visible={inviteModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} style={StyleSheet.absoluteFillObject} />
          <View style={styles.modalPopup}>
            <View style={styles.modalPopupHeader}>
              <Text style={styles.popupTitle}>Generate Invite Code</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <MaterialIcons name="close" size={22} color="#163235" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>SELECT TARGET ROLE</Text>
            <View style={styles.roleOptionsRow}>
              {roles.filter(r => r.isActive && canModifyRole(r)).map(r => (
                <TouchableOpacity 
                  key={r.code}
                  style={[styles.roleChip, selectedInviteRole === r.code && styles.roleChipActive]}
                  onPress={() => setSelectedInviteRole(r.code)}
                >
                  <Text style={[styles.roleChipText, selectedInviteRole === r.code && styles.roleChipTextActive]}>
                    {r.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>MAX USES</Text>
            <TextInput
              style={styles.fieldInput}
              keyboardType="number-pad"
              value={inviteMaxUses}
              onChangeText={setInviteMaxUses}
              placeholder="e.g. 1"
              placeholderTextColor="#6b7a7d"
            />

            <TouchableOpacity 
              style={[styles.saveBtn, { marginTop: 24 }]} 
              onPress={handleGenerateInvite} 
              disabled={generatingInvite || !selectedInviteRole}
            >
              <LinearGradient
                colors={['#00d4ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                {generatingInvite ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>GENERATE CODE</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { padding: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  title: { fontSize: 20, fontWeight: '800', color: '#163235', letterSpacing: 0.5 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: 'rgba(0, 104, 117, 0.1)' },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#006875' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#6b7a7d', letterSpacing: 0.5 },
  tabTextActive: { color: '#006875' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20 },
  createRoleBtn: { borderRadius: 100, overflow: 'hidden', marginBottom: 20, shadowColor: '#0072ff', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  createRoleBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', overflow: 'hidden' },
  roleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  roleTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleName: { fontSize: 16, fontWeight: '800', color: '#163235' },
  customBadge: { backgroundColor: 'rgba(0, 104, 117, 0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0, 104, 117, 0.15)' },
  customBadgeText: { fontSize: 9, fontWeight: '800', color: '#006875', letterSpacing: 0.5 },
  roleDesc: { fontSize: 13, color: '#6b7a7d', lineHeight: 18, fontWeight: '500' },
  roleCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0, 104, 117, 0.08)' },
  permissionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0, 104, 117, 0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  permissionBadgeText: { fontSize: 11, fontWeight: '700', color: '#006875' },
  editPermissionsBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100, backgroundColor: 'rgba(0, 104, 117, 0.06)', borderWidth: 1, borderColor: 'rgba(0, 104, 117, 0.12)' },
  editPermissionsBtnDisabled: { backgroundColor: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.05)' },
  editPermissionsBtnText: { fontSize: 12, fontWeight: '700', color: '#006875', letterSpacing: 0.5 },
  inviteCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  inviteCode: { fontSize: 16, fontWeight: '800', color: '#163235', letterSpacing: 1 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusTagActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  statusTagInactive: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  statusTagTextActive: { fontSize: 9, fontWeight: '800', color: '#10b981', letterSpacing: 0.5 },
  statusTagTextInactive: { fontSize: 9, fontWeight: '800', color: '#ef4444', letterSpacing: 0.5 },
  inviteMetaGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  inviteMetaItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.4)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  inviteMetaLabel: { fontSize: 9, fontWeight: '700', color: '#6b7a7d', marginBottom: 4, letterSpacing: 0.8 },
  inviteMetaValue: { fontSize: 12, fontWeight: '800', color: '#163235' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#006875', borderRadius: 12, paddingVertical: 12, backgroundColor: 'rgba(0, 104, 117, 0.03)' },
  copyBtnText: { fontSize: 13, fontWeight: '700', color: '#006875' },
  emptyText: { textAlign: 'center', color: '#6b7a7d', marginTop: 40, fontWeight: '600' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1.5, borderBottomColor: 'rgba(0, 104, 117, 0.1)' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#163235' },
  modalSubtitle: { fontSize: 12, color: '#6b7a7d', marginTop: 2, fontWeight: '600' },
  closeBtn: { padding: 4, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.04)' },
  modalScroll: { padding: 20 },
  permissionCategoryGroup: { marginBottom: 24 },
  categoryTitle: { fontSize: 12, fontWeight: '800', color: '#6b7a7d', marginBottom: 12, letterSpacing: 1.2 },
  permissionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0, 104, 117, 0.05)' },
  permissionRowDisabled: { opacity: 0.4 },
  permissionInfo: { flex: 1, paddingRight: 16 },
  permissionName: { fontSize: 14, fontWeight: '700', color: '#163235' },
  permissionTextDisabled: { color: '#6b7a7d' },
  permissionDesc: { fontSize: 12, color: '#6b7a7d', marginTop: 3, lineHeight: 16, fontWeight: '500' },
  modalFooter: { padding: 20, borderTopWidth: 1.5, borderTopColor: 'rgba(0, 104, 117, 0.1)', backgroundColor: 'transparent' },
  saveBtn: { borderRadius: 100, overflow: 'hidden', shadowColor: '#0072ff', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  saveBtnGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  saveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800', letterSpacing: 1.2 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#6b7a7d', marginBottom: 8, letterSpacing: 1.2 },
  fieldInput: { borderWidth: 1, borderColor: 'rgba(0, 104, 117, 0.2)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#163235', backgroundColor: 'rgba(255,255,255,0.5)', marginBottom: 20, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalPopup: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  modalPopupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  popupTitle: { fontSize: 18, fontWeight: '800', color: '#163235' },
  roleOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(0, 104, 117, 0.2)', backgroundColor: 'rgba(0,104,117,0.03)' },
  roleChipActive: { borderColor: '#006875', backgroundColor: 'rgba(0,104,117,0.08)' },
  roleChipText: { fontSize: 12, fontWeight: '700', color: '#6b7a7d' },
  roleChipTextActive: { color: '#006875' }
});
