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
        <View style={styles.statusContainer}>
          <TouchableOpacity 
            style={[styles.statusToggle, selectedBlock.status === 'VACANT' && styles.statusActiveVacant]}
            onPress={() => updateUnitDetails(selectedBlock.id, { status: 'VACANT' })}
            disabled={Boolean(selectedBlock.activeLeaseId)}
          >
            <Text style={[styles.statusToggleText, selectedBlock.status === 'VACANT' && styles.statusTextActive]}>VACANT</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statusToggle, selectedBlock.status === 'OCCUPIED' && styles.statusActiveOccupied]}
            onPress={() => updateUnitDetails(selectedBlock.id, { status: 'OCCUPIED' })}
            disabled={Boolean(selectedBlock.activeLeaseId)}
          >
            <Text style={[styles.statusToggleText, selectedBlock.status === 'OCCUPIED' && styles.statusTextActive]}>OCCUPIED</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: theme.Typography.HeadlineSmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
    fontFamily: 'Inter',
  },
  sheetSubtitle: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statusToggle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  statusActiveVacant: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  statusActiveOccupied: {
    backgroundColor: 'rgba(0, 104, 117, 0.1)',
    borderColor: 'rgba(0, 104, 117, 0.2)',
  },
  statusToggleText: {
    fontSize: theme.Typography.BodySmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurfaceVariant,
    fontFamily: 'Inter',
  },
  statusTextActive: {
    color: theme.Colors.primary,
    fontFamily: 'Inter',
  },
});
