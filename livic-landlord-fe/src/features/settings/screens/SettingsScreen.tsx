import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { createStyles } from './SettingsScreen.styles';
import { useSettings } from '../hooks/useSettings';
import { SettingsHero, SettingsHubGrid, SettingsTabContent } from '../components/SettingsSections';
import { PermissionsMatrixModal, CreateCustomRoleModal, GenerateInviteCodeModal } from '../components/SettingsModals';

export default function SettingsScreen() {
  const { theme, isDark, mode, setMode } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();
  const { signOut } = useAuth();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();

  const settings = useSettings(paramPropertyId || null);

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleBillingPress = () => {
    router.push('/settings?tab=billing' as any);
  };

  const handleCreateRolePress = () => {
    settings.setNewRolePerms(settings.currentUserRole ? [...settings.currentUserRole.permissionCodes] : []);
    settings.setCustomRoleModalVisible(true);
  };

  const handleGenerateInvitePress = () => {
    settings.setInviteModalVisible(true);
  };

  return (
    <PageShell
      scrollable
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
    >
      {/* Hero Section */}
      <SettingsHero
        activeTab={settings.activeTab}
        isOwner={settings.currentUserRole?.code === 'PROPERTY_OWNER'}
        onCreateRolePress={handleCreateRolePress}
        onGenerateInvitePress={handleGenerateInvitePress}
        styles={styles}
        theme={theme}
      />

      {/* Hub Grid Selector */}
      <SettingsHubGrid
        activeTab={settings.activeTab}
        rolesCount={settings.roles.length}
        invitesCount={settings.invites.length}
        onTabChange={settings.setActiveTab}
        onBillingPress={handleBillingPress}
        styles={styles}
        theme={theme}
      />

      {/* Main Tab Content */}
      <SettingsTabContent
        activeTab={settings.activeTab}
        autoInvoiceDay={settings.autoInvoiceDay}
        enableEmailAlerts={settings.enableEmailAlerts}
        enableLateFee={settings.enableLateFee}
        enableWhatsappAlerts={settings.enableWhatsappAlerts}
        invites={settings.invites}
        loading={settings.loading}
        mode={mode}
        roles={settings.roles}
        canModifyRole={settings.canModifyRole}
        handleOpenEditPermissions={settings.handleOpenEditPermissions}
        handleToggleRoleActive={settings.handleToggleRoleActive}
        setEnableEmailAlerts={settings.setEnableEmailAlerts}
        setEnableLateFee={settings.setEnableLateFee}
        setEnableWhatsappAlerts={settings.setEnableWhatsappAlerts}
        setMode={setMode}
        showToast={() => {}}
        onLogout={handleLogout}
        styles={styles}
        theme={theme}
      />

      {/* Modals */}
      <PermissionsMatrixModal
        editingPermissions={settings.editingPermissions}
        savingPermissions={settings.savingPermissions}
        selectedRole={settings.selectedRole}
        canDelegatePermission={settings.canDelegatePermission}
        handleSavePermissions={settings.handleSavePermissions}
        handleTogglePermission={settings.handleTogglePermission}
        setSelectedRole={settings.setSelectedRole}
        styles={styles}
        theme={theme}
      />

      <CreateCustomRoleModal
        creatingRole={settings.creatingRole}
        customRoleModalVisible={settings.customRoleModalVisible}
        newRoleDesc={settings.newRoleDesc}
        newRoleName={settings.newRoleName}
        newRolePerms={settings.newRolePerms}
        canDelegatePermission={settings.canDelegatePermission}
        handleCreateCustomRole={settings.handleCreateCustomRole}
        setCustomRoleModalVisible={settings.setCustomRoleModalVisible}
        setNewRoleDesc={settings.setNewRoleDesc}
        setNewRoleName={settings.setNewRoleName}
        setNewRolePerms={settings.setNewRolePerms}
        styles={styles}
        theme={theme}
      />

      <GenerateInviteCodeModal
        generatingInvite={settings.generatingInvite}
        inviteMaxUses={settings.inviteMaxUses}
        inviteModalVisible={settings.inviteModalVisible}
        roles={settings.roles}
        selectedInviteRole={settings.selectedInviteRole}
        canModifyRole={settings.canModifyRole}
        handleGenerateInvite={settings.handleGenerateInvite}
        setInviteMaxUses={settings.setInviteMaxUses}
        setInviteModalVisible={settings.setInviteModalVisible}
        setSelectedInviteRole={settings.setSelectedInviteRole}
        styles={styles}
        theme={theme}
      />
    </PageShell>
  );
}
