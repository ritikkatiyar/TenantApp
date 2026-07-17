import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/src/theme/Theme';

interface ResponsiveHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ResponsiveHeader({
  title,
  onBack,
  rightAction,
}: ResponsiveHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color={Theme.Colors.primary} />
          </TouchableOpacity>
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {rightAction && <View style={styles.rightSection}>{rightAction}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.Spacing.unit,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 104, 117, 0.08)',
    backgroundColor: 'transparent',
    marginBottom: Theme.Spacing.stackMd,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: Theme.Spacing.stackSm,
    padding: Theme.Spacing.unit,
    borderRadius: Theme.Rounded.full,
    backgroundColor: 'rgba(0, 104, 117, 0.05)',
  },
  title: {
    ...Theme.Typography.headlineMd,
    color: Theme.Colors.onBackground,
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
