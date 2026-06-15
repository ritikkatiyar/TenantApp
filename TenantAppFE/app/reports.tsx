import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsive } from '@/hooks/useResponsive';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';

export default function ReportsRoute() {
  const { isDesktop } = useResponsive();

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {isDesktop && (
          <DesktopNavBar 
            title="Reports" 
          />
        )}
        <View style={styles.container}>
          <BlurView intensity={70} tint="light" style={styles.glassCard}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="assessment" size={48} color="#006875" />
            </View>
            <Text style={styles.title}>Reports Coming Soon</Text>
            <Text style={styles.subtitle}>
              We are working hard to bring you comprehensive reporting and deep analytics features. Stay tuned!
            </Text>
          </BlurView>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  glassCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    boxShadow: '0px 10px 30px rgba(0, 104, 117, 0.05)',
    overflow: 'hidden',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 104, 117, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#151d1e',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7a7d',
    lineHeight: 22,
    textAlign: 'center',
  },
});
