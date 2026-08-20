import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme/ThemeContext';

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function ActionButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  iconName,
  style,
  textStyle,
}: ActionButtonProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const isInteractionDisabled = disabled || loading;

  const renderContent = () => {
    return (
      <View style={styles.contentRow}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'secondary' ? theme.Colors.primary : '#ffffff'}
            style={styles.loader}
          />
        ) : iconName ? (
          <MaterialIcons
            name={iconName}
            size={18}
            color={variant === 'outline' || variant === 'secondary' ? theme.Colors.primary : '#ffffff'}
            style={styles.icon}
          />
        ) : null}
        <Text
          style={[
            styles.text,
            variant === 'outline' && styles.textOutline,
            variant === 'secondary' && styles.textSecondary,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    );
  };

  if (variant === 'primary' && !isInteractionDisabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.button, styles.primaryButtonShadow, style]}
      >
        <LinearGradient
          colors={[theme.Colors.accentGradientStart || '#00e0ff', theme.Colors.accentGradientEnd || '#0070ea']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const getButtonStyle = () => {
    if (disabled) {
      return styles.disabled;
    }
    switch (variant) {
      case 'danger':
        return styles.danger;
      case 'secondary':
        return styles.secondary;
      case 'outline':
        return styles.outline;
      case 'primary':
      default:
        // Fallback primary when disabled
        return styles.primaryDisabled;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isInteractionDisabled}
      activeOpacity={0.7}
      style={[styles.button, getButtonStyle(), style]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  button: {
    height: 48,
    borderRadius: theme.Rounded.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.gutter,
  },
  primaryButtonShadow: {
    boxShadow: isDark ? '0px 4px 15px rgba(0, 229, 255, 0.25)' : '0px 4px 15px rgba(0, 112, 234, 0.25)',
  },
  primaryDisabled: {
    backgroundColor: '#99d9f9',
    paddingHorizontal: theme.Spacing.gutter,
  },
  secondary: {
    backgroundColor: theme.Colors.primaryContainer,
    paddingHorizontal: theme.Spacing.gutter,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.Colors.primary,
    paddingHorizontal: theme.Spacing.gutter,
  },
  danger: {
    backgroundColor: theme.Colors.error,
    paddingHorizontal: theme.Spacing.gutter,
  },
  disabled: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(107, 122, 125, 0.12)',
    paddingHorizontal: theme.Spacing.gutter,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...theme.Typography.buttonText,
    color: '#ffffff',
    textAlign: 'center',
  },
  textSecondary: {
    color: theme.Colors.primary,
  },
  textOutline: {
    color: theme.Colors.primary,
  },
  loader: {
    marginRight: theme.Spacing.stackSm,
  },
  icon: {
    marginRight: theme.Spacing.stackSm,
  },
});
