import React from 'react';
import * as Haptics from 'expo-haptics';
import {
  ActivityIndicator,
  Clipboard,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard } from '@/src/components/common/display/GlassCard';
import { StatusPill } from '@/src/components/common/display/StatusPill';
import { EmptyState } from '@/src/components/common/display/EmptyState';
import { JoinCodeResponse, RoleResponse } from '@/src/features/properties/api/rolePermission.api';

type ActiveTab = 'roles' | 'invites' | 'preferences';
type ThemeLike = any;
type StylesLike = Record<string, any>;

type SettingsHeroProps = {
  activeTab: ActiveTab;
  isOwner: boolean;
  onCreateRolePress: () => void;
  onGenerateInvitePress: () => void;
  styles: StylesLike;
  theme: ThemeLike;
};

export function SettingsHero({
  activeTab,
  isOwner,
  onCreateRolePress,
  onGenerateInvitePress,
  styles,
  theme,
}: SettingsHeroProps) {
  return (
    <View style={styles.heroSection}>
      <View>
        <Text style={styles.heroTitle}>System & Team Hub</Text>
        <Text style={styles.heroSubtitle}>
          Configure property role matrices, staff onboarding keys, automated invoices & subscriptions
        </Text>
      </View>

      {isOwner && (
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.actionPillBtn}
            onPress={activeTab === 'invites' ? onGenerateInvitePress : onCreateRolePress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#00d4ff', '#0072ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionPillGradient}
            >
              <MaterialIcons
                name={activeTab === 'invites' ? 'vpn-key' : 'add'}
                size={18}
                color={theme.Colors.surfaceContainerLowest}
              />
              <Text style={styles.actionPillText}>
                {activeTab === 'invites' ? 'GENERATE INVITE' : 'CREATE ROLE'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

type SettingsHubGridProps = {
  activeTab: ActiveTab;
  rolesCount: number;
  invitesCount: number;
  onTabChange: (tab: ActiveTab) => void;
  onBillingPress: () => void;
  styles: StylesLike;
  theme: ThemeLike;
};

export function SettingsHubGrid({
  activeTab,
  rolesCount,
  invitesCount,
  onTabChange,
  onBillingPress,
  styles,
  theme,
}: SettingsHubGridProps) {
  return (
    <View style={styles.hubGrid}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => onTabChange('roles')} style={styles.hubCardTouch}>
        <GlassCard style={[styles.hubCard, activeTab === 'roles' && styles.hubCardActive]}>
          <View style={styles.hubCardHeader}>
            <View style={[styles.hubIconHalo, { backgroundColor: 'rgba(0, 104, 117, 0.12)' }]}>
              <MaterialIcons name="admin-panel-settings" size={24} color={theme.Colors.primary} />
            </View>
            <View style={styles.hubBadge}>
              <Text style={[styles.hubBadgeText, { color: theme.Colors.primary }]}>{rolesCount} Roles</Text>
            </View>
          </View>
          <Text style={styles.hubCardTitle}>Roles & Permissions</Text>
          <Text style={styles.hubCardDesc}>Custom staff roles & fine-grained permission matrix.</Text>
        </GlassCard>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.85} onPress={() => onTabChange('invites')} style={styles.hubCardTouch}>
        <GlassCard style={[styles.hubCard, activeTab === 'invites' && styles.hubCardActive]}>
          <View style={styles.hubCardHeader}>
            <View style={[styles.hubIconHalo, { backgroundColor: 'rgba(0, 104, 117, 0.12)' }]}>
              <MaterialIcons name="vpn-key" size={24} color={theme.Colors.primary} />
            </View>
            <View style={styles.hubBadge}>
              <Text style={[styles.hubBadgeText, { color: theme.Colors.primary }]}>{invitesCount} Codes</Text>
            </View>
          </View>
          <Text style={styles.hubCardTitle}>Staff Join Keys</Text>
          <Text style={styles.hubCardDesc}>Single-use onboarding keys for managers & caretakers.</Text>
        </GlassCard>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.85} onPress={() => onTabChange('preferences')} style={styles.hubCardTouch}>
        <GlassCard style={[styles.hubCard, activeTab === 'preferences' && styles.hubCardActive]}>
          <View style={styles.hubCardHeader}>
            <View style={[styles.hubIconHalo, { backgroundColor: 'rgba(91, 94, 207, 0.12)' }]}>
              <MaterialIcons name="tune" size={24} color={theme.Colors.secondary} />
            </View>
            <View style={styles.hubBadge}>
              <Text style={[styles.hubBadgeText, { color: theme.Colors.secondary }]}>Automations</Text>
            </View>
          </View>
          <Text style={styles.hubCardTitle}>System Preferences</Text>
          <Text style={styles.hubCardDesc}>Auto-invoicing cycles, WhatsApp notifications & late fees.</Text>
        </GlassCard>
      </TouchableOpacity>
    </View>
  );
}

type SettingsTabContentProps = {
  activeTab: ActiveTab;
  autoInvoiceDay: string;
  enableEmailAlerts: boolean;
  enableLateFee: boolean;
  enableWhatsappAlerts: boolean;
  invites: JoinCodeResponse[];
  loading: boolean;
  mode: 'system' | 'light' | 'dark';
  roles: RoleResponse[];
  canModifyRole: (role: RoleResponse) => boolean;
  handleOpenEditPermissions: (role: RoleResponse) => void;
  handleToggleRoleActive: (role: RoleResponse, value: boolean) => void;
  setEnableEmailAlerts: (value: boolean) => void;
  setEnableLateFee: (value: boolean) => void;
  setEnableWhatsappAlerts: (value: boolean) => void;
  setMode: (mode: 'system' | 'light' | 'dark') => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onLogout?: () => void;
  styles: StylesLike;
  theme: ThemeLike;
};

export function SettingsTabContent({
  activeTab,
  autoInvoiceDay,
  enableEmailAlerts,
  enableLateFee,
  enableWhatsappAlerts,
  invites,
  loading,
  mode,
  roles,
  canModifyRole,
  handleOpenEditPermissions,
  handleToggleRoleActive,
  setEnableEmailAlerts,
  setEnableLateFee,
  setEnableWhatsappAlerts,
  setMode,
  showToast,
  onLogout,
  styles,
  theme,
}: SettingsTabContentProps) {
  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
        <Text style={styles.loadingSub}>Loading system preferences...</Text>
      </View>
    );
  }

  if (activeTab === 'roles') {
    return (
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
                      onValueChange={(val) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleToggleRoleActive(item, val);
                      }}
                      disabled={!canEdit}
                      trackColor={{ false: 'rgba(0, 104, 117, 0.15)', true: '#006875' }}
                      thumbColor={item.isActive ? '#00d4ff' : '#9ca3af'}
                    />
                  )}
                </View>

                <Text style={styles.roleDesc}>{item.description || 'No description provided.'}</Text>

                <View style={styles.roleCardBottom}>
                  <View style={styles.permCountTag}>
                    <MaterialIcons name="shield" size={14} color={theme.Colors.primary} />
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
    );
  }

  if (activeTab === 'invites') {
    return (
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
                      <MaterialIcons name="key" size={16} color={theme.Colors.primary} />
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
                      <MaterialIcons name="content-copy" size={16} color={theme.Colors.primary} />
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
    );
  }

  return (
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
            <MaterialIcons name="palette" size={22} color={theme.Colors.primary} />
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
                      fontSize: theme.Typography.bodySmall.fontSize,
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
            <MaterialIcons name="receipt-long" size={22} color={theme.Colors.primary} />
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
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEnableLateFee(val);
              }}
              trackColor={{ false: 'rgba(0, 104, 117, 0.15)', true: '#006875' }}
              thumbColor={enableLateFee ? '#00d4ff' : '#9ca3af'}
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.prefCard}>
          <View style={styles.prefCardHeader}>
            <MaterialIcons name="notifications-active" size={22} color={theme.Colors.primary} />
            <Text style={styles.prefCardTitle}>Communication Channels</Text>
          </View>
          <View style={styles.prefItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefItemName}>WhatsApp Payment Reminders</Text>
              <Text style={styles.prefItemDesc}>Send WhatsApp invoice summaries to tenants</Text>
            </View>
            <Switch
              value={enableWhatsappAlerts}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEnableWhatsappAlerts(val);
              }}
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
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEnableEmailAlerts(val);
              }}
              trackColor={{ false: 'rgba(0, 104, 117, 0.15)', true: '#006875' }}
              thumbColor={enableEmailAlerts ? '#00d4ff' : '#9ca3af'}
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.prefCard}>
          <View style={styles.prefCardHeader}>
            <MaterialIcons name="security" size={22} color={theme.Colors.error} />
            <Text style={[styles.prefCardTitle, { color: theme.Colors.error }]}>Account & Session</Text>
          </View>
          <View style={styles.prefItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefItemName}>Sign Out</Text>
              <Text style={styles.prefItemDesc}>Log out securely from your current session on this device</Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: theme.Colors.error + '1F',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: theme.Colors.error + '40',
              }}
              onPress={() => onLogout?.()}
              activeOpacity={0.75}
            >
              <MaterialIcons name="logout" size={18} color={theme.Colors.error} />
              <Text style={{ color: theme.Colors.error, fontWeight: '800', fontSize: theme.Typography.bodyMedium.fontSize }}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </View>
  );
}
