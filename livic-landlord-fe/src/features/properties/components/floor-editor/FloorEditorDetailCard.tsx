import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TenantDetailsCard } from './TenantDetailsCard';

interface UnitBlock {
  id: string; 
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  unitNumber: string;
  rent?: string;
  tenants?: string[];
  activeLeaseId?: string;
  tenantUserId?: string;
  tenantPhone?: string | null;
  status?: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
  capacity?: number;
  activeLeases?: any[];
  type?: string;
}

interface FloorEditorDetailCardProps {
  selectedBlock: UnitBlock;
  floorNumber: number;
  parentScrollEnabled: boolean;
  setParentScrollEnabled: (enabled: boolean) => void;
  updateUnitDetails: (id: string, updates: Partial<UnitBlock>) => void;
  onRemoveTenant: (leaseId: string, tenantName?: string | null) => void;
  onClose: () => void;
  tenantAssignProps: any;
}

export function FloorEditorDetailCard({
  selectedBlock,
  floorNumber,
  parentScrollEnabled,
  setParentScrollEnabled,
  updateUnitDetails,
  onRemoveTenant,
  onClose,
  tenantAssignProps
}: FloorEditorDetailCardProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.sheetHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetUnitTitle}>Unit {selectedBlock.unitNumber}</Text>
          <Text style={styles.sheetSubtitle}>Floor {floorNumber}</Text>
        </View>
        <TouchableOpacity 
          onPress={onClose}
          style={styles.closeButton}
        >
          <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <TenantDetailsCard
        selectedBlock={selectedBlock}
        updateUnitDetails={updateUnitDetails}
        onRemoveTenant={onRemoveTenant}
        parentScrollEnabled={parentScrollEnabled}
        setParentScrollEnabled={setParentScrollEnabled}
        {...tenantAssignProps}
      />

      {!tenantAssignProps.isCreatingNewTenant && (
        <>
          <View style={styles.statusContainer}>
            <TouchableOpacity 
              style={[
                styles.statusToggle, 
                selectedBlock.status === 'VACANT' && styles.statusActiveVacant,
                Boolean(selectedBlock.activeLeaseId) && styles.statusDisabled,
              ]}
              onPress={() => updateUnitDetails(selectedBlock.id, { status: 'VACANT' })}
              disabled={Boolean(selectedBlock.activeLeaseId)}
            >
              {selectedBlock.status === 'VACANT' && <View style={styles.statusDotVacant} />}
              <Text style={[styles.statusToggleText, selectedBlock.status === 'VACANT' && styles.statusTextVacant]}>VACANT</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.statusToggle, 
                selectedBlock.status === 'OCCUPIED' && styles.statusActiveOccupied,
                Boolean(selectedBlock.activeLeaseId) && styles.statusDisabled,
              ]}
              onPress={() => updateUnitDetails(selectedBlock.id, { status: 'OCCUPIED' })}
              disabled={Boolean(selectedBlock.activeLeaseId)}
            >
              {selectedBlock.status === 'OCCUPIED' && <View style={styles.statusDotOccupied} />}
              <Text style={[styles.statusToggleText, selectedBlock.status === 'OCCUPIED' && styles.statusTextOccupied]}>OCCUPIED</Text>
            </TouchableOpacity>
          </View>
          {Boolean(selectedBlock.activeLeaseId) && (
            <View style={styles.statusLockedHint}>
              <MaterialIcons name="lock-outline" size={12} color={theme.Colors.onSurfaceVariant} />
              <Text style={styles.statusLockedText}>Status synced with active lease</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetUnitTitle: {
    fontSize: theme.Typography.headlineSmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
    fontFamily: 'Inter',
  },
  sheetSubtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: theme.Colors.glassStroke,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    borderRadius: 14,
    padding: 4,
    gap: 6,
    marginTop: theme.Spacing.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.Colors.outlineVariant,
  },
  statusToggle: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.Colors.onSurfaceVariant,
    fontFamily: 'Inter',
  },
  statusActiveVacant: {
    backgroundColor: isDark ? 'rgba(0, 229, 255, 0.14)' : 'rgba(0, 104, 117, 0.10)',
    borderColor: isDark ? 'rgba(0, 229, 255, 0.35)' : 'rgba(0, 104, 117, 0.25)',
  },
  statusTextVacant: {
    color: isDark ? '#00E5FF' : '#006875',
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  statusDotVacant: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: isDark ? '#00E5FF' : '#006875',
  },
  statusActiveOccupied: {
    backgroundColor: isDark ? 'rgba(255, 107, 107, 0.14)' : 'rgba(186, 26, 26, 0.10)',
    borderColor: isDark ? 'rgba(255, 107, 107, 0.35)' : 'rgba(186, 26, 26, 0.25)',
  },
  statusTextOccupied: {
    color: isDark ? '#FF6B6B' : '#ba1a1a',
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  statusDotOccupied: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: isDark ? '#FF6B6B' : '#ba1a1a',
  },
  statusDisabled: {
    opacity: 0.5,
  },
  statusLockedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  statusLockedText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.Colors.onSurfaceVariant,
    fontFamily: 'Inter',
  },
  statusTextActive: {
    color: theme.Colors.primary,
    fontFamily: 'Inter',
  },
});
