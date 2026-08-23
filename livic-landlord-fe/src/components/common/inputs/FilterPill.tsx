import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';

export interface FilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  count?: number | string;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function FilterPill({
  label,
  active,
  onPress,
  icon,
  count,
  size = 'md',
  style,
}: FilterPillProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark, size), [theme, isDark, size]);
  const iconSize = size === 'sm' ? 14 : 16;

  const renderContent = () => (
    <View style={styles.contentRow}>
      {icon && (
        <MaterialIcons
          name={icon}
          size={iconSize}
          color={active ? theme.Colors.surfaceContainerLowest : theme.Colors.onSurfaceVariant}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>
        {label}
      </Text>
      {count !== undefined && (
        <View style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, active ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {count}
          </Text>
        </View>
      )}
    </View>
  );

  if (active) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.pill, styles.activeShadow, style]}>
        <LinearGradient
          colors={['#00d4ff', '#0072ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[styles.pill, styles.inactivePill, style]}>
      {renderContent()}
    </TouchableOpacity>
  );
}

const createStyles = (theme: any, isDark: boolean, size: 'sm' | 'md') => {
  const height = size === 'sm' ? 32 : 38;
  const paddingHorizontal = size === 'sm' ? 12 : 16;
  const fontSize = size === 'sm' ? 12 : 13;

  return StyleSheet.create({
    pill: {
      height,
      borderRadius: 100,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    gradient: {
      height: '100%',
      paddingHorizontal,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activeShadow: {
      shadowColor: '#0072ff',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    inactivePill: {
      backgroundColor: theme.Colors.glassFill,
      borderWidth: 1,
      borderColor: theme.Colors.glassStroke,
      paddingHorizontal,
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    textActive: {
      color: theme.Colors.surfaceContainerLowest,
    },
    textInactive: {
      color: theme.Colors.onSurfaceVariant,
    },
    badge: {
      marginLeft: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    badgeInactive: {
      backgroundColor: theme.Colors.surfaceContainerLow,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '800',
    },
    badgeTextActive: {
      color: theme.Colors.surfaceContainerLowest,
    },
    badgeTextInactive: {
      color: theme.Colors.onSurfaceVariant,
    },
  });
};

export default FilterPill;
