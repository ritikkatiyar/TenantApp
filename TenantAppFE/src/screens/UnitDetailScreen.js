import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Theme } from '../theme/Theme';

export default function UnitDetailScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Unit Detail</Text>
      </View>
      <View style={styles.content}>
        {/* Placeholder for HTML/CSS to be manually pasted and translated */}
        <Text style={styles.placeholderText}>Unit Detail Screen Content Goes Here</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.background,
  },
  header: {
    padding: Theme.Spacing.containerPadding,
    backgroundColor: Theme.Colors.surface,
  },
  title: {
    ...Theme.Typography.headlineLg,
    color: Theme.Colors.onSurface,
  },
  content: {
    padding: Theme.Spacing.containerPadding,
  },
  placeholderText: {
    ...Theme.Typography.bodyMd,
    color: Theme.Colors.onSurfaceVariant,
  }
});
