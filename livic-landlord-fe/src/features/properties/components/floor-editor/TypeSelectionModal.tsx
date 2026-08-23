import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK' },
  { label: '2 BHK', value: 'TWO_BHK' },
  { label: 'Studio Apartment', value: 'STUDIO' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Shared Unit', value: 'SHARED_UNIT' },
];

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

interface TypeSelectionModalProps {
  visible: boolean;
  pendingBlockId: string | null;
  pendingBlockNum: string;
  onClose: () => void;
  updateUnitDetails: (id: string, updates: Partial<UnitBlock>) => void;
  setBlocks: React.Dispatch<React.SetStateAction<UnitBlock[]>>;
}

export function TypeSelectionModal({
  visible,
  pendingBlockId,
  pendingBlockNum,
  onClose,
  updateUnitDetails,
  setBlocks,
}: TypeSelectionModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const handleSelectOption = (value: string) => {
    if (pendingBlockId) {
      let cap = 2;
      if (value === 'ONE_BHK') cap = 2;
      else if (value === 'TWO_BHK') cap = 4;
      else if (value === 'STUDIO') cap = 1;
      else if (value === 'SINGLE_UNIT') cap = 1;
      else if (value === 'SHARED_UNIT') cap = 2;

      updateUnitDetails(pendingBlockId, { type: value, capacity: cap });
    }
    onClose();
  };

  const handleDiscard = () => {
    if (pendingBlockId) {
      setBlocks(prev => prev.filter(b => b.id !== pendingBlockId));
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleDiscard}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
        <LinearGradient
          colors={(theme.Colors.backgroundGradient || ['#d4f5f9', '#e8f8fb', '#e2e0fb']) as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.typeModalContent}
        >
          <Text style={styles.typeModalTitle}>Configure New Unit</Text>
          <Text style={styles.typeModalSubtitle}>Select type for Unit {pendingBlockNum}</Text>
          
          <View style={styles.typeGrid}>
            {UNIT_TYPE_OPTIONS.map((option) => {
              let iconName: keyof typeof MaterialIcons.glyphMap = 'home';
              let desc = '';
              if (option.value === 'ONE_BHK') { iconName = 'looks-one'; desc = '1 Bedroom'; }
              else if (option.value === 'TWO_BHK') { iconName = 'looks-two'; desc = '2 Bedrooms'; }
              else if (option.value === 'STUDIO') { iconName = 'room-service'; desc = 'Single Studio'; }
              else if (option.value === 'SINGLE_UNIT') { iconName = 'person'; desc = 'Single Co-living'; }
              else if (option.value === 'SHARED_UNIT') { iconName = 'people'; desc = 'Shared Co-living'; }

              return (
                <TouchableOpacity
                  key={option.value}
                  style={styles.typeCard}
                  activeOpacity={0.8}
                  onPress={() => handleSelectOption(option.value)}
                >
                  <View style={styles.typeCardIconWrapper}>
                    <MaterialIcons name={iconName} size={28} color={theme.Colors.primary} />
                  </View>
                  <Text style={styles.typeCardLabel}>{option.label}</Text>
                  <Text style={styles.typeCardDesc}>{desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <TouchableOpacity
            style={[styles.typeCancelButton, { backgroundColor: 'rgba(229, 57, 53, 0.08)' }]}
            onPress={handleDiscard}
          >
            <Text style={[styles.typeCancelText, { color: theme.Colors.error }]}>Discard Unit</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.lg,
  },
  typeModalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: theme.Colors.surfaceContainerLowest,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    padding: theme.Spacing.lg,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  typeModalTitle: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '900',
    color: theme.Colors.onSurface,
    marginBottom: theme.Spacing.xs,
    fontFamily: 'Inter',
  },
  typeModalSubtitle: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  typeGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  typeCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.1)',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
  },
  typeCardIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeCardLabel: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '900',
    color: theme.Colors.primary,
    marginBottom: 2,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  typeCardDesc: {
    fontSize: theme.Typography.labelSmall.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  typeCancelButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeCancelText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '900',
    fontFamily: 'Inter',
  },
});
