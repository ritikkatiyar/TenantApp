import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { LinearGradient } from 'expo-linear-gradient';

export interface PropertyRequiredBannerProps {
  title?: string;
  description?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  selectedPropertyId?: string | null;
  onSelectProperty?: (propertyId: string) => void;
  properties?: Array<{ id: string; name: string }>;
  allowAll?: boolean;
  onSelectAll?: () => void;
  style?: ViewStyle;
  inline?: boolean;
  onClose?: () => void;
}

export function PropertyRequiredBanner({
  title = 'Select Active Property',
  description = 'Choose a property below to scope your worksheets, charges, ledger, and records.',
  icon = 'account-balance',
  selectedPropertyId: propSelectedId,
  onSelectProperty: propOnSelect,
  properties: propProperties,
  allowAll = false,
  onSelectAll,
  style,
  inline = false,
  onClose,
}: PropertyRequiredBannerProps) {
  const { theme, isDark } = useAppTheme();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const globalContext = useGlobalPropertySelection();
  const { properties: fetchedProperties } = useProperties();

  const activePropertyId = propSelectedId !== undefined ? propSelectedId : globalContext.selectedPropertyId;
  const handleSelect = propOnSelect || globalContext.setSelectedPropertyId;
  const propertyList = propProperties || fetchedProperties || [];

  const [dismissed, setDismissed] = useState(false);

  const handlePropertyChosen = (id: string) => {
    handleSelect(id);
    setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onClose) onClose();
  };

  const cardContent = (
    <BlurView intensity={isDark ? 80 : 60} tint={isDark ? 'dark' : 'light'} style={styles.card}>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={handleDismiss}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
      </TouchableOpacity>

      <View style={styles.iconCircle}>
        <MaterialIcons name={icon} size={32} color={theme.Colors.primary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {propertyList.length > 0 ? (
        <View style={styles.propertiesContainer}>
          <Text style={styles.sectionLabel}>CHOOSE A PROPERTY TO CONTINUE</Text>
          <View style={styles.pillsRow}>
            {allowAll && (
              <TouchableOpacity
                style={[styles.pill, !activePropertyId && styles.pillActive]}
                onPress={() => {
                  if (onSelectAll) onSelectAll();
                  else handleSelect(null as any);
                  setDismissed(true);
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="domain"
                  size={16}
                  color={!activePropertyId ? theme.Colors.primary : theme.Colors.onSurfaceVariant}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.pillText, !activePropertyId && styles.pillTextActive]}>
                  All Properties
                </Text>
              </TouchableOpacity>
            )}

            {propertyList.map((p: { id: string; name: string }) => {
              const isSelected = activePropertyId === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.pill, isSelected && styles.pillActive]}
                  onPress={() => handlePropertyChosen(p.id)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name="business"
                    size={16}
                    color={isSelected ? theme.Colors.primary : theme.Colors.onSurfaceVariant}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.pillText, isSelected && styles.pillTextActive]} numberOfLines={1}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            setDismissed(true);
            router.push('/properties/create');
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[theme.Colors.primary, theme.Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createButtonGradient}
          >
            <MaterialIcons name="add" size={20} color={theme.Colors.onPrimary} />
            <Text style={styles.createButtonText}>CREATE FIRST PROPERTY</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </BlurView>
  );

  if (inline) {
    return <View style={[styles.inlineWrapper, style]}>{cardContent}</View>;
  }

  return (
    <Modal
      visible={!activePropertyId && !dismissed}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalOverlay}>
        <BlurView
          intensity={isDark ? 85 : 65}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleDismiss}
        />
        <View style={[styles.modalCardWrapper, style]}>
          {cardContent}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 15, 25, 0.35)',
    },
    modalCardWrapper: {
      width: '100%',
      maxWidth: 560,
      alignItems: 'center',
      zIndex: 10,
    },
    inlineWrapper: {
      width: '100%',
      paddingVertical: theme.Spacing.md,
      alignItems: 'center',
    },
    card: {
      width: '100%',
      padding: theme.Spacing.xl,
      borderRadius: 24,
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(15, 23, 32, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : theme.Colors.glassStroke,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: isDark ? 0.45 : 0.15,
      shadowRadius: 32,
      elevation: 10,
      position: 'relative',
    },
    closeBtn: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 5,
    },
    iconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 104, 117, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.Spacing.md,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(0, 229, 255, 0.25)' : 'rgba(0, 104, 117, 0.18)',
    },
    title: {
      ...theme.Typography.headlineSmall,
      color: theme.Colors.onSurface,
      marginBottom: theme.Spacing.xs,
      textAlign: 'center',
    },
    description: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      color: theme.Colors.onSurfaceVariant,
      textAlign: 'center',
      maxWidth: 440,
      lineHeight: 22,
      marginBottom: theme.Spacing.lg,
    },
    propertiesContainer: {
      width: '100%',
      alignItems: 'center',
      marginTop: theme.Spacing.xs,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.Colors.onSurfaceVariant,
      letterSpacing: 1.2,
      marginBottom: theme.Spacing.md,
      textTransform: 'uppercase',
    },
    pillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: theme.Spacing.sm,
      width: '100%',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 104, 117, 0.05)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : theme.Colors.glassStroke,
      maxWidth: 240,
    },
    pillActive: {
      backgroundColor: isDark ? 'rgba(0, 229, 255, 0.18)' : 'rgba(0, 104, 117, 0.14)',
      borderColor: theme.Colors.primary,
    },
    pillText: {
      fontSize: theme.Typography.bodyMedium.fontSize,
      fontWeight: '600',
      color: theme.Colors.onSurfaceVariant,
    },
    pillTextActive: {
      color: theme.Colors.primary,
      fontWeight: '800',
    },
    createButton: {
      borderRadius: 100,
      overflow: 'hidden',
      marginTop: theme.Spacing.sm,
      shadowColor: theme.Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 3,
    },
    createButtonGradient: {
      paddingHorizontal: 24,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    createButtonText: {
      color: theme.Colors.onPrimary,
      fontSize: theme.Typography.bodyMedium.fontSize,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
  });

