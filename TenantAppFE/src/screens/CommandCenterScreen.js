import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme/Theme';

export default function CommandCenterScreen({ onNavigateToCreateProperty, onLogout }) {
  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#f9ede0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.shieldIconWrapper}>
              <MaterialIcons name="security" size={20} color={Theme.Colors.primary} />
            </View>
            <View>
              <Text style={styles.headerText}>COMMAND</Text>
              <Text style={styles.headerText}>CENTER</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="notifications-none" size={28} color={Theme.Colors.onSurfaceVariant} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
              <MaterialIcons name="logout" size={28} color={Theme.Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Main Card — same glass style as Login screen */}
          <BlurView intensity={60} tint="light" style={styles.mainCard}>
            <View style={styles.buildingIconCircle}>
              <MaterialIcons name="domain-disabled" size={36} color="#546e7a" />
            </View>
            
            <Text style={styles.cardTitle}>No properties found.</Text>
            <Text style={styles.cardSubtitle}>
              Start building your portfolio by adding your first property to the command center.
            </Text>

            {/* Gradient CREATE PROPERTY button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onNavigateToCreateProperty}
              style={styles.createButtonWrapper}
            >
              <LinearGradient
                colors={['#00d4e8', '#00a8d4', '#6366f1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createButton}
              >
                <MaterialIcons name="add" size={22} color="#fff" />
                <Text style={styles.createButtonText}>CREATE{"\n"}PROPERTY</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.learnMoreContainer}>
              <MaterialIcons name="help-outline" size={16} color={Theme.Colors.primary} />
              <Text style={styles.learnMoreText}>LEARN ABOUT PROPERTY MANAGEMENT</Text>
            </TouchableOpacity>
          </BlurView>

          {/* Status Pills */}
          <View style={styles.pillsContainer}>
            <View style={styles.pill}>
              <MaterialIcons name="verified-user" size={16} color={Theme.Colors.primary} />
              <Text style={styles.pillText}>SUPER ADMIN VERIFIED</Text>
            </View>
            <View style={styles.pill}>
              <MaterialIcons name="bar-chart" size={16} color={Theme.Colors.primary} />
              <Text style={styles.pillText}>ANALYTICS READY</Text>
            </View>
          </View>

          {/* Extra space for floating bottom nav */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating Glassmorphic Bottom Navigation */}
        <View style={styles.bottomNavWrapper}>
          <BlurView intensity={100} tint="default" style={[StyleSheet.absoluteFill, { borderRadius: 100, overflow: 'hidden' }]} />
          <BlurView intensity={100} tint="default" style={styles.bottomNav}>
            
            <TouchableOpacity style={styles.navItem}>
              <View style={styles.activeIconPill}>
                <MaterialIcons name="domain" size={24} color={Theme.Colors.primary} />
              </View>
              <Text style={[styles.navText, styles.navTextActive]}>PORTFOLIO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
              <View style={styles.inactiveIconPill}>
                <MaterialIcons name="insights" size={24} color={Theme.Colors.outline} />
              </View>
              <Text style={styles.navText}>INSIGHTS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
              <View style={styles.inactiveIconPill}>
                <MaterialIcons name="error-outline" size={24} color={Theme.Colors.outline} />
              </View>
              <Text style={styles.navText}>ESCALATIONS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
              <View style={styles.inactiveIconPill}>
                <MaterialIcons name="admin-panel-settings" size={24} color={Theme.Colors.outline} />
              </View>
              <Text style={styles.navText}>ADMIN</Text>
            </TouchableOpacity>

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
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.Spacing.containerPadding,
    paddingTop: Theme.Spacing.stackSm,
    paddingBottom: Theme.Spacing.stackMd,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldIconWrapper: {
    marginRight: Theme.Spacing.stackSm,
  },
  headerText: {
    ...Theme.Typography.labelCaps,
    fontSize: 16,
    lineHeight: 18,
    color: Theme.Colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: Theme.Spacing.stackMd,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.Colors.error,
    borderWidth: 1,
    borderColor: '#eaf4f6',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Theme.Spacing.containerPadding,
    paddingTop: Theme.Spacing.stackLg,
    alignItems: 'center',
  },
  mainCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: Theme.Rounded.lg,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: Theme.Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    overflow: 'hidden',
  },
  buildingIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.Spacing.stackLg,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#151d1e',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#546e7a',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  createButtonWrapper: {
    width: '100%',
    marginBottom: 24,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 10,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  learnMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  learnMoreText: {
    ...Theme.Typography.labelCaps,
    color: Theme.Colors.primary,
    marginLeft: 6,
  },
  pillsContainer: {
    marginTop: Theme.Spacing.stackLg,
    alignItems: 'center',
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pillText: {
    ...Theme.Typography.labelCaps,
    color: Theme.Colors.outline,
    marginLeft: 8,
  },
  bottomNavWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 20,
    right: 20,
    shadowColor: '#006875', // deep teal shadow
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    // Note: Android relies on border to look detached since elevation breaks transparency
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Lowered paint to let double-blur shine
    borderRadius: 100, // perfect pill
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 1)',
    borderTopColor: 'rgba(255, 255, 255, 1)', // strong white reflection on top
    borderBottomColor: 'rgba(255, 255, 255, 0.4)', // faded on bottom
    overflow: 'hidden',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
    paddingVertical: 8,
  },
  activeIconPill: {
    width: 64,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.2)', // Soft modern cyan pill
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  inactiveIconPill: {
    width: 64,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navText: {
    ...Theme.Typography.labelCaps,
    fontSize: 10,
    color: Theme.Colors.outline,
  },
  navTextActive: {
    color: Theme.Colors.primary,
    fontWeight: '800',
  },
});
