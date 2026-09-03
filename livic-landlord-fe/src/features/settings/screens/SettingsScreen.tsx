import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { createStyles } from './SettingsScreen.styles';
import { useSettings } from '../hooks/useSettings';
import { SettingsHero, SettingsHubGrid, SettingsTabContent } from '../components/SettingsSections';
import {
  PermissionsMatrixModal,
  EditMemberDetailsModal,
  GenerateInviteCodeModal,
} from '../components/SettingsModals';

export default function SettingsScreen() {
  const { theme, isDark, mode, setMode } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();
  const { propertyId: paramPropertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { isDesktop } = useResponsive();

  const settings = useSettings(paramPropertyId || null);

  const handleBillingPress = () => {
    router.push('/settings?tab=billing' as any);
  };

  const handleGenerateInvitePress = () => {
    settings.setInviteModalVisible(true);
  };

  const isOwner = Boolean(settings.propertyId) && settings.currentMember?.accessType === 'FULL_ACCESS';

  return (
    <PageShell
      scrollable
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
    >
      {/* Hero Section */}
      <SettingsHero
        activeTab={settings.activeTab}
        isOwner={isOwner}
        onGenerateInvitePress={handleGenerateInvitePress}
        styles={styles}
        theme={theme}
      />

      {/* Hub Grid Selector */}
      <SettingsHubGrid
        activeTab={settings.activeTab}
        membersCount={settings.members.length}
        invitesCount={settings.invites.length}
        onTabChange={settings.setActiveTab}
        onBillingPress={handleBillingPress}
        styles={styles}
        theme={theme}
      />

      {/* Main Tab Content */}
      {!settings.propertyId && settings.activeTab !== 'preferences' ? (
        <GlassCard
          style={{
            marginVertical: 20,
            minHeight: 280,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          contentStyle={{
            padding: 48,
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <MaterialIcons name="domain" size={48} color={theme.Colors.primary} style={{ marginBottom: 16 }} />
            <Text
              style={{
                fontSize: theme.Typography.titleMedium.fontSize,
                fontWeight: '800',
                color: theme.Colors.onSurface,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Select Property to View Staff & Permissions
            </Text>
            <Text
              style={{
                fontSize: theme.Typography.bodyMedium.fontSize,
                color: theme.Colors.onSurfaceVariant,
                textAlign: 'center',
                maxWidth: 440,
                lineHeight: 22,
              }}
            >
              Please select a property from the top navbar selector to view and manage team members, access roles, and invite keys.
            </Text>
          </View>
        </GlassCard>
      ) : (
        <SettingsTabContent
          activeTab={settings.activeTab}
          invites={settings.invites}
          loading={settings.loading}
          mode={mode}
          members={settings.members}
          canModifyMember={settings.canModifyMember}
          handleOpenEditPermissions={settings.handleOpenEditPermissions}
          handleOpenEditDetails={settings.handleOpenEditDetails}
          handleToggleMemberActive={settings.handleToggleMemberActive}
          handleRemoveMember={settings.handleRemoveMember}
          setMode={setMode}
          showToast={() => {}}
          styles={styles}
          theme={theme}
        />
      )}

      {/* Modals */}
      <PermissionsMatrixModal
        editingPermissions={settings.editingPermissions}
        savingPermissions={settings.savingPermissions}
        selectedMember={settings.selectedMember}
        canDelegatePermission={settings.canDelegatePermission}
        handleSavePermissions={settings.handleSavePermissions}
        handleTogglePermission={settings.handleTogglePermission}
        setSelectedMember={settings.setSelectedMember}
        styles={styles}
        theme={theme}
      />

      <EditMemberDetailsModal
        editDetailsMember={settings.editDetailsMember}
        editMemberTitle={settings.editMemberTitle}
        editMemberAccessType={settings.editMemberAccessType}
        savingMemberDetails={settings.savingMemberDetails}
        handleSaveMemberDetails={settings.handleSaveMemberDetails}
        setEditDetailsMember={settings.setEditDetailsMember}
        setEditMemberTitle={settings.setEditMemberTitle}
        setEditMemberAccessType={settings.setEditMemberAccessType}
        styles={styles}
        theme={theme}
      />

      <GenerateInviteCodeModal
        generatingInvite={settings.generatingInvite}
        inviteTitle={settings.inviteTitle}
        inviteAccessType={settings.inviteAccessType}
        invitePerms={settings.invitePerms}
        inviteMaxUses={settings.inviteMaxUses}
        inviteModalVisible={settings.inviteModalVisible}
        handleGenerateInvite={settings.handleGenerateInvite}
        handleToggleInvitePerm={settings.handleToggleInvitePerm}
        setInviteTitle={settings.setInviteTitle}
        setInviteAccessType={settings.setInviteAccessType}
        setInviteMaxUses={settings.setInviteMaxUses}
        setInviteModalVisible={settings.setInviteModalVisible}
        styles={styles}
        theme={theme}
      />
    </PageShell>
  );
}
