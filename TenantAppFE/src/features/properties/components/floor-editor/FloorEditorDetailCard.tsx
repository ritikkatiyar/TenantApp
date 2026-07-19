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
          <MaterialIcons name="close" size={20} color="#6b7a7d" />
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

const styles = StyleSheet.create({
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetUnitTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#151d1e',
    fontFamily: 'Inter',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#6b7a7d',
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
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7a7d',
    fontFamily: 'Inter',
  },
  statusTextActive: {
    color: '#006875',
    fontFamily: 'Inter',
  },
});
