import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/src/theme/Theme';

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
  const isInteractionDisabled = disabled || loading;

  const renderContent = () => {
    return (
      <View style={styles.contentRow}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'secondary' ? Theme.Colors.primary : '#ffffff'}
            style={styles.loader}
          />
        ) : iconName ? (
          <MaterialIcons
            name={iconName}
            size={18}
            color={variant === 'outline' || variant === 'secondary' ? Theme.Colors.primary : '#ffffff'}
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
          colors={[Theme.Colors.accentGradientStart || '#00e0ff', Theme.Colors.accentGradientEnd || '#0070ea']}
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

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: Theme.Rounded.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.Spacing.gutter,
  },
  primaryButtonShadow: {
    boxShadow: '0px 4px 15px rgba(0, 112, 234, 0.25)',
  },
  primaryDisabled: {
    backgroundColor: '#99d9f9',
    paddingHorizontal: Theme.Spacing.gutter,
  },
  secondary: {
    backgroundColor: 'rgba(0, 104, 117, 0.08)',
    paddingHorizontal: Theme.Spacing.gutter,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Theme.Colors.primary,
    paddingHorizontal: Theme.Spacing.gutter,
  },
  danger: {
    backgroundColor: Theme.Colors.error,
    paddingHorizontal: Theme.Spacing.gutter,
  },
  disabled: {
    backgroundColor: 'rgba(107, 122, 125, 0.12)',
    paddingHorizontal: Theme.Spacing.gutter,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Theme.Typography.buttonText,
    color: '#ffffff',
    textAlign: 'center',
  },
  textSecondary: {
    color: Theme.Colors.primary,
  },
  textOutline: {
    color: Theme.Colors.primary,
  },
  loader: {
    marginRight: Theme.Spacing.stackSm,
  },
  icon: {
    marginRight: Theme.Spacing.stackSm,
  },
});
