import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/src/theme/Theme';

export default function FloorEditorScreen() {
  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Floor Editor</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.placeholderText}>Floor Editor Content Goes Here</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#151d1e',
  },
  content: {
    padding: 24,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7a7d',
  }
});
