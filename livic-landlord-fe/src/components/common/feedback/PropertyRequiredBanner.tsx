import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
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
}

export function PropertyRequiredBanner({
  title = 'Select a Property',
  description = 'Please select a property to view and manage its data.',
  icon = 'domain',
  selectedPropertyId: propSelectedId,
  onSelectProperty: propOnSelect,
  properties: propProperties,
  allowAll = false,
  onSelectAll,
  style,
}: PropertyRequiredBannerProps) {
  const { theme, isDark } = useAppTheme();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const globalContext = useGlobalPropertySelection();
  const { properties: fetchedProperties } = useProperties();

  const activePropertyId = propSelectedId !== undefined ? propSelectedId : globalContext.selectedPropertyId;
  const handleSelect = propOnSelect || globalContext.setSelectedPropertyId;
  const propertyList = propProperties || fetchedProperties || [];

  return (
    <View style={[styles.wrapper, style]}>
      <BlurView intensity={isDark ? 50 : 30} tint={isDark ? 'dark' : 'light'} style={styles.card}>
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
                    onPress={() => handleSelect(p.id)}
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
            onPress={() => router.push('/properties/create')}
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
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    wrapper: {
      width: '100%',
      paddingVertical: theme.Spacing.md,
      alignItems: 'center',
    },
    card: {
      width: '100%',
      maxWidth: 580,
      padding: theme.Spacing.xl,
      borderRadius: 24,
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(15, 23, 32, 0.70)' : theme.Colors.glassFill,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : theme.Colors.glassStroke,
      overflow: 'hidden',
      shadowColor: 'black',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 104, 117, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.Spacing.md,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(0, 229, 255, 0.20)' : 'rgba(0, 104, 117, 0.15)',
    },
    title: {
      fontSize: theme.Typography.titleLarge.fontSize,
      fontWeight: '800',
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
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : theme.Colors.glassFill,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : theme.Colors.glassStroke,
      maxWidth: 220,
    },
    pillActive: {
      backgroundColor: isDark ? 'rgba(0, 229, 255, 0.15)' : 'rgba(0, 104, 117, 0.12)',
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
