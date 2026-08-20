import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
  Clipboard,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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
import { Theme } from '@/src/theme/Theme';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { EmptyState } from '@/src/components/common/display/EmptyState';
import { useProperties } from '@/src/hooks/useProperties';
import { useToast } from '@/src/components/common/feedback/ToastContext';
import { useResponsive } from '@/hooks/useResponsive';
import { useAppTheme } from '@/src/theme/ThemeContext';

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

export default function SystemPreferencesRoute() {
  const router = useRouter();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { properties, isLoading: propertiesLoading } = useProperties();
  const propertyId = paramPropertyId || (properties && properties.length > 0 ? properties[0].id : null);
  const { accessToken, context } = useAuth();
  const { showToast } = useToast();
  const { isDesktop } = useResponsive();
  const { mode, setMode } = useAppTheme();

  const [activeTab, setActiveTab] = useState<'roles' | 'invites' | 'preferences'>('roles');
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

  return (
    <PageShell
      scrollable
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
    >
      {/* Top Desktop Navigation */}
      {isDesktop && (
        <DesktopNavBar
          title="Settings & System Hub"
          properties={properties || []}
          selectedPropertyId={propertyId}
          onPropertyChange={(id) => router.replace(`/settings?propertyId=${id}`)}
        />
      )}

      {/* Main Title Section */}
      <View style={styles.heroSection}>
        <View>
          <Text style={styles.heroTitle}>System & Team Hub</Text>
          <Text style={styles.heroSubtitle}>
            Configure property role matrices, staff onboarding keys, automated invoices & subscriptions
          </Text>
        </View>

        {currentUserRole?.code === 'PROPERTY_OWNER' && (
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.actionPillBtn}
              onPress={() => {
                if (activeTab === 'invites') {
                  setInviteModalVisible(true);
                } else {
                  setNewRolePerms(currentUserRole ? [...currentUserRole.permissionCodes] : []);
                  setCustomRoleModalVisible(true);
                }
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00d4ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionPillGradient}
              >
                <MaterialIcons name={activeTab === 'invites' ? 'vpn-key' : 'add'} size={18} color="#fff" />
                <Text style={styles.actionPillText}>
                  {activeTab === 'invites' ? 'GENERATE INVITE' : 'CREATE ROLE'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Hub Menu Cards Grid */}
      <View style={styles.hubGrid}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setActiveTab('roles')}
          style={styles.hubCardTouch}
        >
          <GlassCard style={[styles.hubCard, activeTab === 'roles' && styles.hubCardActive]}>
            <View style={styles.hubCardHeader}>
              <View style={[styles.hubIconHalo, { backgroundColor: 'rgba(8, 145, 178, 0.12)' }]}>
                <MaterialIcons name="admin-panel-settings" size={24} color="#0891b2" />
              </View>
              <View style={styles.hubBadge}>
                <Text style={[styles.hubBadgeText, { color: '#0891b2' }]}>{roles.length} Roles</Text>
              </View>
            </View>
            <Text style={styles.hubCardTitle}>Roles & Permissions</Text>
            <Text style={styles.hubCardDesc}>Custom staff roles & fine-grained permission matrix.</Text>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setActiveTab('invites')}
          style={styles.hubCardTouch}
        >
          <GlassCard style={[styles.hubCard, activeTab === 'invites' && styles.hubCardActive]}>
            <View style={styles.hubCardHeader}>
              <View style={[styles.hubIconHalo, { backgroundColor: 'rgba(0, 104, 117, 0.12)' }]}>
                <MaterialIcons name="vpn-key" size={24} color="#006875" />
              </View>
              <View style={styles.hubBadge}>
                <Text style={[styles.hubBadgeText, { color: '#006875' }]}>{invites.length} Codes</Text>
              </View>
            </View>
            <Text style={styles.hubCardTitle}>Staff Join Keys</Text>
            <Text style={styles.hubCardDesc}>Single-use onboarding keys for managers & caretakers.</Text>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setActiveTab('preferences')}
          style={styles.hubCardTouch}
        >
          <GlassCard style={[styles.hubCard, activeTab === 'preferences' && styles.hubCardActive]}>
            <View style={styles.hubCardHeader}>
              <View style={[styles.hubIconHalo, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                <MaterialIcons name="tune" size={24} color="#8b5cf6" />
              </View>
              <View style={styles.hubBadge}>
                <Text style={[styles.hubBadgeText, { color: '#8b5cf6' }]}>Automations</Text>
              </View>
            </View>
            <Text style={styles.hubCardTitle}>System Preferences</Text>
            <Text style={styles.hubCardDesc}>Auto-invoicing cycles, WhatsApp notifications & late fees.</Text>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/billing' as any)}
          style={styles.hubCardTouch}
        >
          <GlassCard style={styles.hubCard}>
            <View style={styles.hubCardHeader}>
              <View style={[styles.hubIconHalo, { backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
                <MaterialIcons name="credit-card" size={24} color="#ec4899" />
              </View>
              <View style={styles.hubBadge}>
                <Text style={[styles.hubBadgeText, { color: '#ec4899' }]}>SaaS Tier</Text>
              </View>
            </View>
            <Text style={styles.hubCardTitle}>Subscription & Plan</Text>
            <Text style={styles.hubCardDesc}>Active tier, Razorpay gateway status & AI credit wallet.</Text>
          </GlassCard>
        </TouchableOpacity>
      </View>

      {/* Main Tab Content */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#006875" />
          <Text style={styles.loadingSub}>Loading system preferences...</Text>
        </View>
      ) : activeTab === 'roles' ? (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Property Role Hierarchy</Text>
              <Text style={styles.sectionSub}>Staff roles configured for this property context</Text>
            </View>
          </View>

          <View style={styles.rolesGrid}>
            {roles.map((item) => {
              const isOwner = item.code === 'PROPERTY_OWNER';
              const isTenant = item.code === 'PROPERTY_TENANT';
              const canEdit = canModifyRole(item) && !isOwner;

              return (
                <GlassCard key={item.id} style={styles.roleCard}>
                  <View style={styles.roleCardTop}>
                    <View style={styles.roleTitleGroup}>
                      <Text style={styles.roleName}>{item.name}</Text>
                      {item.propertyId ? (
                        <View style={styles.customRolePill}>
                          <Text style={styles.customRolePillText}>Custom</Text>
                        </View>
                      ) : (
                        <View style={styles.systemRolePill}>
                          <Text style={styles.systemRolePillText}>System Default</Text>
                        </View>
                      )}
                    </View>
                    {!isOwner && !isTenant && (
                      <Switch
                        value={item.isActive}
                        onValueChange={(val) => handleToggleRoleActive(item, val)}
                        disabled={!canEdit}
                        trackColor={{ false: 'rgba(0, 104, 117, 0.15)', true: '#006875' }}
                        thumbColor={item.isActive ? '#00d4ff' : '#9ca3af'}
                      />
                    )}
                  </View>

                  <Text style={styles.roleDesc}>{item.description || 'No description provided.'}</Text>

                  <View style={styles.roleCardBottom}>
                    <View style={styles.permCountTag}>
                      <MaterialIcons name="shield" size={14} color="#006875" />
                      <Text style={styles.permCountText}>{item.permissionCodes.length} Permissions</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.configureBtn, !canEdit && styles.configureBtnDisabled]}
                      disabled={!canEdit}
                      onPress={() => handleOpenEditPermissions(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.configureBtnText, !canEdit && styles.configureBtnTextDisabled]}>
                        {canEdit ? 'Configure Matrix' : 'View Only'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              );
            })}
          </View>
        </View>
      ) : activeTab === 'invites' ? (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Active Staff Join Codes</Text>
              <Text style={styles.sectionSub}>Direct onboarding tokens for team members</Text>
            </View>
          </View>

          {invites.length > 0 ? (
            <View style={styles.invitesGrid}>
              {invites.map((item) => {
                const expiresDate = item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Never';
                return (
                  <GlassCard key={item.id} style={styles.inviteCard}>
                    <View style={styles.inviteCardHeader}>
                      <View style={styles.codeCapsule}>
                        <MaterialIcons name="key" size={16} color="#006875" />
                        <Text style={styles.inviteCode}>{item.code}</Text>
                      </View>
                      <StatusPill status={item.isActive ? 'ACTIVE' : 'EXPIRED'} />
                    </View>

                    <View style={styles.inviteMetaRow}>
                      <View style={styles.inviteMetaCol}>
                        <Text style={styles.inviteMetaLabel}>TARGET ROLE</Text>
                        <Text style={styles.inviteMetaVal}>{item.roleName}</Text>
                      </View>
                      <View style={styles.inviteMetaCol}>
                        <Text style={styles.inviteMetaLabel}>USES COUNT</Text>
                        <Text style={styles.inviteMetaVal}>
                          {item.usesCount} / {item.maxUses}
                        </Text>
                      </View>
                      <View style={styles.inviteMetaCol}>
                        <Text style={styles.inviteMetaLabel}>EXPIRES</Text>
                        <Text style={styles.inviteMetaVal}>{expiresDate}</Text>
                      </View>
                    </View>

                    {item.isActive && (
                      <TouchableOpacity
                        style={styles.copyKeyBtn}
                        onPress={() => {
                          Clipboard.setString(item.code);
                          showToast('Invitation code copied to clipboard!', 'success');
                        }}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="content-copy" size={16} color="#006875" />
                        <Text style={styles.copyKeyBtnText}>Copy Invitation Code</Text>
                      </TouchableOpacity>
                    )}
                  </GlassCard>
                );
              })}
            </View>
          ) : (
            <EmptyState
              title="No Invite Codes Active"
              description="Generate a join code to onboard managers or staff to this property."
              iconName="vpn-key"
            />
          )}
        </View>
      ) : (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Automation & Preference Rules</Text>
              <Text style={styles.sectionSub}>Configure invoicing triggers and alert preferences</Text>
            </View>
          </View>

          <View style={styles.prefGrid}>
            <GlassCard style={styles.prefCard}>
              <View style={styles.prefCardHeader}>
                <MaterialIcons name="palette" size={22} color="#006875" />
                <Text style={styles.prefCardTitle}>Appearance & Theme Mode</Text>
              </View>
              <View style={styles.prefItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prefItemName}>App Theme Preference</Text>
                  <Text style={styles.prefItemDesc}>Switch between Light, Dark, or System auto-detect</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {(['system', 'light', 'dark'] as const).map((themeOption) => {
                  const isSelected = mode === themeOption;
                  return (
                    <TouchableOpacity
                      key={themeOption}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderColor: isSelected ? '#006875' : 'rgba(0, 104, 117, 0.2)',
                        backgroundColor: isSelected ? 'rgba(0, 104, 117, 0.12)' : 'transparent',
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                      onPress={() => setMode(themeOption)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons
                        name={
                          themeOption === 'system'
                            ? 'settings-brightness'
                            : themeOption === 'dark'
                            ? 'dark-mode'
                            : 'light-mode'
                        }
                        size={18}
                        color={isSelected ? '#006875' : '#6b7a7d'}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          textTransform: 'capitalize',
                          color: isSelected ? '#006875' : '#6b7a7d',
                        }}
                      >
                        {themeOption}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </GlassCard>

            <GlassCard style={styles.prefCard}>
              <View style={styles.prefCardHeader}>
                <MaterialIcons name="receipt-long" size={22} color="#006875" />
                <Text style={styles.prefCardTitle}>Billing Automation</Text>
              </View>
              <View style={styles.prefItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prefItemName}>Automated Rent Roll Invoicing</Text>
                  <Text style={styles.prefItemDesc}>Automatically compile charges on the 1st of every month</Text>
                </View>
                <View style={styles.prefBadgeActive}>
                  <Text style={styles.prefBadgeText}>{autoInvoiceDay}</Text>
                </View>
              </View>
              <View style={styles.prefItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prefItemName}>Late Payment Penalty</Text>
                  <Text style={styles.prefItemDesc}>Apply flat fine after grace period expires</Text>
                </View>
                <Switch
                  value={enableLateFee}
                  onValueChange={setEnableLateFee}
                  trackColor={{ false: 'rgba(0, 104, 117, 0.15)', true: '#006875' }}
                  thumbColor={enableLateFee ? '#00d4ff' : '#9ca3af'}
                />
              </View>
            </GlassCard>

            <GlassCard style={styles.prefCard}>
              <View style={styles.prefCardHeader}>
                <MaterialIcons name="notifications-active" size={22} color="#0891b2" />
                <Text style={styles.prefCardTitle}>Communication Channels</Text>
              </View>
              <View style={styles.prefItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prefItemName}>WhatsApp Payment Reminders</Text>
                  <Text style={styles.prefItemDesc}>Send WhatsApp invoice summaries to tenants</Text>
                </View>
                <Switch
                  value={enableWhatsappAlerts}
                  onValueChange={setEnableWhatsappAlerts}
                  trackColor={{ false: 'rgba(0, 104, 117, 0.15)', true: '#006875' }}
                  thumbColor={enableWhatsappAlerts ? '#00d4ff' : '#9ca3af'}
                />
              </View>
              <View style={styles.prefItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prefItemName}>Email Notifications</Text>
                  <Text style={styles.prefItemDesc}>Dispatch monthly PDF statement receipts via email</Text>
                </View>
                <Switch
                  value={enableEmailAlerts}
                  onValueChange={setEnableEmailAlerts}
                  trackColor={{ false: 'rgba(0, 104, 117, 0.15)', true: '#006875' }}
                  thumbColor={enableEmailAlerts ? '#00d4ff' : '#9ca3af'}
                />
              </View>
            </GlassCard>
          </View>
        </View>
      )}

      {/* Permissions Matrix Modal */}
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
                <MaterialIcons name="close" size={22} color="#151d1e" />
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
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnText}>SAVE PERMISSIONS MATRIX</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Custom Role Modal */}
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
                <MaterialIcons name="close" size={22} color="#151d1e" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.inputLabel}>ROLE NAME</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. Senior Floor Manager"
                placeholderTextColor="#6b7a7d"
                value={newRoleName}
                onChangeText={setNewRoleName}
              />

              <Text style={styles.inputLabel}>DESCRIPTION</Text>
              <TextInput
                style={[styles.modalTextInput, { height: 70, paddingTop: 10 }]}
                placeholder="Describe role responsibilities..."
                placeholderTextColor="#6b7a7d"
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
                  {creatingRole ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>CREATE ROLE</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generate Invite Code Modal */}
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
                <MaterialIcons name="close" size={22} color="#151d1e" />
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
                placeholderTextColor="#6b7a7d"
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
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnText}>GENERATE & COPY CODE</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Theme.Spacing.containerPadding,
    paddingTop: Platform.OS === 'web' ? 24 : 88,
  },
  containerDesktop: {
    paddingTop: 24,
  },
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#151d1e',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6b7a7d',
    marginTop: 4,
    maxWidth: 600,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionPillBtn: {
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  actionPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  actionPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  hubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  hubCardTouch: {
    flex: 1,
    minWidth: 240,
  },
  hubCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  hubCardActive: {
    borderColor: '#006875',
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
  },
  hubCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  hubIconHalo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hubBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  hubCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#151d1e',
    marginBottom: 4,
  },
  hubCardDesc: {
    fontSize: 12,
    color: '#6b7a7d',
    lineHeight: 17,
  },
  sectionContainer: {
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#151d1e',
  },
  sectionSub: {
    fontSize: 13,
    color: '#6b7a7d',
    marginTop: 2,
  },
  rolesGrid: {
    gap: 14,
  },
  roleCard: {
    padding: 20,
    borderRadius: 18,
  },
  roleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#151d1e',
  },
  customRolePill: {
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.2)',
  },
  customRolePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#006875',
  },
  systemRolePill: {
    backgroundColor: 'rgba(107, 122, 125, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(107, 122, 125, 0.2)',
  },
  systemRolePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7a7d',
  },
  roleDesc: {
    fontSize: 13,
    color: '#6b7a7d',
    lineHeight: 19,
  },
  roleCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  permCountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 104, 117, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  permCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006875',
  },
  configureBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  configureBtnDisabled: {
    backgroundColor: '#f8fafc',
  },
  configureBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006875',
  },
  configureBtnTextDisabled: {
    color: '#9ca3af',
  },
  invitesGrid: {
    gap: 14,
  },
  inviteCard: {
    padding: 20,
    borderRadius: 18,
  },
  inviteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  codeCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.2)',
  },
  inviteCode: {
    fontSize: 15,
    fontWeight: '900',
    color: '#006875',
    letterSpacing: 1.5,
  },
  inviteMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  inviteMetaCol: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inviteMetaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b7a7d',
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  inviteMetaVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#151d1e',
  },
  copyKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.3)',
  },
  copyKeyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006875',
  },
  prefGrid: {
    gap: 16,
  },
  prefCard: {
    padding: 22,
    borderRadius: 20,
  },
  prefCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  prefCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#151d1e',
  },
  prefItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  prefItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151d1e',
  },
  prefItemDesc: {
    fontSize: 12,
    color: '#6b7a7d',
    marginTop: 2,
  },
  prefBadgeActive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.2)',
  },
  prefBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006875',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#151d1e',
  },
  modalSub: {
    fontSize: 12,
    color: '#6b7a7d',
    marginTop: 2,
  },
  closeIconBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  modalBody: {
    padding: 24,
  },
  categoryBlock: {
    marginBottom: 20,
  },
  categoryHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6b7a7d',
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  permCheckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  permCheckRowDisabled: {
    opacity: 0.4,
  },
  permCheckInfo: {
    flex: 1,
    paddingRight: 12,
  },
  permCheckName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151d1e',
  },
  permCheckNameDisabled: {
    color: '#9ca3af',
  },
  permCheckDesc: {
    fontSize: 12,
    color: '#6b7a7d',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#6b7a7d',
    marginBottom: 6,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#151d1e',
    backgroundColor: '#f8fafc',
    marginBottom: 16,
    outlineWidth: 0,
  },
  roleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  roleSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  roleSelectChipActive: {
    borderColor: '#006875',
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
  },
  roleSelectChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7a7d',
  },
  roleSelectChipTextActive: {
    color: '#006875',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalPrimaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalBtnGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  modalBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  centerLoading: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSub: {
    marginTop: 12,
    fontSize: 13,
    color: '#6b7a7d',
  },
});
