import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { ChargeConfigResponse } from '@/src/features/finance/api/charge.api';

interface ExpenseConfigCardProps {
  charge: ChargeConfigResponse;
  propertyId: string | null;
  onDeactivate: (id: string) => void;
  onReactivate: (id: string) => void;
  onDelete: (id: string) => void;
  isDesktop: boolean;
  isDark: boolean;
}

export function ExpenseConfigCard({
  charge,
  propertyId,
  onDeactivate,
  onReactivate,
  onDelete,
  isDesktop,
  isDark,
}: ExpenseConfigCardProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDesktop), [theme, isDesktop]);
  const router = useRouter();

  const getIconData = (name: string, category: string) => {
    const n = name.toLowerCase();
    const c = category.toLowerCase();
    
    if (n.includes('rent') || c.includes('rent')) {
      return { name: 'vpn-key', bg: 'rgba(74, 222, 128, 0.12)', color: theme.Colors.tertiary };
    }
    if (n.includes('electricity') || c.includes('electricity') || n.includes('power')) {
      return { name: 'flash-on', bg: 'rgba(250, 204, 21, 0.12)', color: theme.Colors.tertiary };
    }
    if (n.includes('water') || n.includes('sewage') || n.includes('utility')) {
      return { name: 'opacity', bg: 'rgba(96, 165, 250, 0.12)', color: theme.Colors.secondary };
    }
    if (n.includes('internet') || n.includes('wifi') || n.includes('network')) {
      return { name: 'router', bg: 'rgba(167, 139, 250, 0.12)', color: theme.Colors.secondary };
    }
    if (n.includes('maintenance') || n.includes('cleaning') || c.includes('service')) {
      return { name: 'build', bg: 'rgba(244, 63, 94, 0.12)', color: theme.Colors.error };
    }
    return { name: 'receipt', bg: 'rgba(148, 163, 184, 0.12)', color: theme.Colors.onSurfaceVariant };
  };

  const formatEnum = (str: string) => {
    if (!str) return '';
    return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const iconObj = getIconData(charge.chargeName, charge.chargeCategory);

  return (
    <View 
      style={[
        isDesktop ? styles.gridCardWrapper : styles.listCardWrapper,
        !charge.isActive && { opacity: 0.7 }
      ]}
    >
      <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.expenseCard}>
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => {
            router.push(`/create-expense?propertyId=${propertyId}&chargeId=${charge.id}`);
          }}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: iconObj.bg }]}>
              <MaterialIcons name={iconObj.name as any} size={24} color={iconObj.color} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{charge.chargeName}</Text>
              <Text style={styles.cardSub}>
                {formatEnum(charge.chargeCategory)} • {formatEnum(charge.billingFrequency)}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <View style={[styles.badge, { backgroundColor: charge.isActive ? '#ccfbf1' : '#fee2e2' }]}>
                 <Text style={[styles.badgeText, { color: charge.isActive ? '#0d9488' : '#ef4444' }]}>
                   {charge.isActive ? 'ACTIVE' : 'INACTIVE'}
                 </Text>
              </View>
              {charge.baseRate != null ? (
                <View style={styles.amountContainer}>
                  <Text style={styles.amountBold}>₹{charge.baseRate}</Text>
                  {charge.calculationStrategy === 'METERED' ? (
                    <Text style={styles.amountSuffix}>/ {charge.unitType || 'unit'}</Text>
                  ) : (
                    <Text style={styles.amountSuffix}>/ mo</Text>
                  )}
                </View>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.actionsRow}>
          {charge.calculationStrategy === 'METERED' ? (
            <TouchableOpacity 
              onPress={() => {
                router.push(`/properties/${propertyId}/meter-readings`);
              }} 
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <MaterialCommunityIcons name="speedometer" size={16} color="#00bcd4" />
              <Text style={{ color: '#00bcd4', fontSize: theme.Typography.BodyMedium.fontSize, fontWeight: '700' }}>Record Readings</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          {!charge.isSystemRequired ? (
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
              {charge.isActive ? (
                <TouchableOpacity 
                  onPress={() => onDeactivate(charge.id)} 
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Feather name="minus-circle" size={14} color={theme.Colors.error} />
                  <Text style={{ color: theme.Colors.error, fontSize: theme.Typography.BodySmall.fontSize, fontWeight: '600' }}>Deactivate</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity 
                    onPress={() => onReactivate(charge.id)} 
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <MaterialIcons name="restore" size={14} color={theme.Colors.primary} />
                    <Text style={{ color: theme.Colors.primary, fontSize: theme.Typography.BodySmall.fontSize, fontWeight: '600' }}>Reactivate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => onDelete(charge.id)} 
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Feather name="trash-2" size={14} color={theme.Colors.error} />
                    <Text style={{ color: theme.Colors.error, fontSize: theme.Typography.BodySmall.fontSize, fontWeight: '600' }}>Delete Permanently</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <Text style={{ color: '#849495', fontSize: theme.Typography.LabelSmall.fontSize, fontStyle: 'italic' }}>System Required</Text>
          )}
        </View>
      </BlurView>
    </View>
  );
}

const createStyles = (theme: any, isDesktop: boolean) => StyleSheet.create({
  gridCardWrapper: {
    width: '48%',
    marginBottom: 20,
  },
  listCardWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  expenseCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1.5,
    borderColor: theme.Colors.glassStroke,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.Typography.BodyLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
  },
  cardSub: {
    fontSize: theme.Typography.BodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 4,
    fontWeight: '600',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '800',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountBold: {
    fontSize: theme.Typography.BodyLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
  },
  amountSuffix: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginLeft: 2,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 16,
  },
});
