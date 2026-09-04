import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsive } from '@/src/hooks/useResponsive';

const UNIT_TYPE_OPTIONS = [
  { label: '1 BHK', value: 'ONE_BHK', icon: 'home', desc: 'Standard single bedroom apartment' },
  { label: '2 BHK', value: 'TWO_BHK', icon: 'domain', desc: 'Spacious two bedroom apartment' },
  { label: 'Studio Apartment', value: 'STUDIO', icon: 'apartment', desc: 'Compact modern open-plan space' },
  { label: 'Single Unit', value: 'SINGLE_UNIT', icon: 'single-bed', desc: 'Traditional single room unit' },
  { label: 'Shared Unit', value: 'SHARED_UNIT', icon: 'people', desc: 'Co-living space with shared amenities' },
];

interface UnitTypeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  selectedValue: string;
}

export default function UnitTypeSelectionModal({
  visible,
  onClose,
  onSelect,
  selectedValue,
}: UnitTypeSelectionModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop, isTablet } = useResponsive();
  const isWide = isDesktop || isTablet;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.modalContainer, isWide ? styles.desktopModal : styles.mobileModal]}>
          <BlurView tint="light" intensity={90} style={styles.blurContainer}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Select Default Unit Type</Text>
                <Text style={styles.subtitle}>Choose the layout style to generate for all floors.</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <MaterialIcons name="close" size={22} color={theme.Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.grid}>
                {UNIT_TYPE_OPTIONS.map((item) => {
                  const isSelected = selectedValue === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      activeOpacity={0.8}
                      style={[
                        styles.card,
                        isSelected && styles.cardSelected,
                      ]}
                      onPress={() => onSelect(item.value)}
                    >
                      <View style={[styles.iconWrapper, isSelected && styles.iconWrapperSelected]}>
                        <MaterialIcons
                          name={item.icon as any}
                          size={24}
                          color={isSelected ? '#0072ff' : '#006875'}
                        />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                          {item.label}
                        </Text>
                        <Text style={styles.cardDesc} numberOfLines={2}>
                          {item.desc}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <MaterialIcons name="check" size={12} color={theme.Colors.surfaceContainerLowest} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtnWrapper} onPress={onClose}>
                <LinearGradient
                  colors={['#00d4ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmBtn}
                >
                  <Text style={styles.confirmBtnText}>Confirm Selection</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  desktopModal: {
    width: '100%',
    maxWidth: 600,
  },
  mobileModal: {
    width: '100%',
  },
  blurContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: theme.Typography.titleLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurface,
  },
  subtitle: {
    fontSize: theme.Typography.bodySmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: theme.Spacing.xs,
    fontWeight: '500',
  },
  closeButton: {
    padding: theme.Spacing.xs,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  scrollContent: {
    padding: theme.Spacing.lg,
  },
  grid: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: theme.Spacing.md,
    position: 'relative',
  },
  cardSelected: {
    borderColor: theme.Colors.secondary,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.Spacing.md,
  },
  iconWrapperSelected: {
    backgroundColor: 'rgba(0, 114, 255, 0.08)',
  },
  cardInfo: {
    flex: 1,
    paddingRight: theme.Spacing.md,
  },
  cardLabel: {
    fontSize: theme.Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurface,
  },
  cardLabelSelected: {
    color: theme.Colors.secondary,
  },
  cardDesc: {
    fontSize: theme.Typography.labelSmall.fontSize,
    color: theme.Colors.onSurfaceVariant,
    marginTop: 3,
    lineHeight: 14,
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: theme.Spacing.lg,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  cancelBtnText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
  },
  confirmBtnWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.surfaceContainerLowest,
  },
});
