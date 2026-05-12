import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Theme } from '../theme/Theme';
import { useProperties } from '../hooks/useProperties';
import type { PropertyResponse } from '../types/property';

interface CommandCenterScreenProps {
  onNavigateToCreateProperty: () => void;
  onLogout: () => void;
}

export default function CommandCenterScreen({ onNavigateToCreateProperty, onLogout }: CommandCenterScreenProps) {
  const router = useRouter();
  const { properties, isLoading, error, refreshProperties } = useProperties();

  const renderPropertyItem = ({ item }: { item: PropertyResponse }) => (
    <BlurView intensity={60} tint="light" style={styles.propertyCard}>
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyName}>{item.name}</Text>
        <View style={styles.addressContainer}>
          <MaterialIcons name="location-on" size={14} color="#6b7a7d" />
          <Text style={styles.propertyAddress}>{item.address}, {item.city}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        activeOpacity={0.8} 
        style={styles.manageButtonWrapper}
        onPress={() => router.push(`/properties/${item.id}`)}
      >
        <LinearGradient
          colors={['#00d4ff', '#0072ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.manageButton}
        >
          <Text style={styles.manageButtonText}>MANAGE</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </BlurView>
  );

  const ListHeader = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.mainTitle}>My Properties</Text>
      <Text style={styles.subtitle}>Overview of your real estate portfolio</Text>
    </View>
  );

  const ListEmptyComponent = () => (
    <BlurView intensity={40} tint="light" style={styles.emptyCard}>
      <View style={styles.emptyIconCircle}>
        <MaterialIcons name="domain-disabled" size={36} color="#6b7a7d" />
      </View>
      <Text style={styles.emptyTitle}>No properties found.</Text>
      <Text style={styles.emptySubtitle}>
        Start building your portfolio by adding your first property to the command center.
      </Text>
      
      <TouchableOpacity 
        style={styles.createPropertyButton} 
        onPress={onNavigateToCreateProperty}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#00d4ff', '#0072ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.createPropertyGradient}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.createPropertyText}>CREATE PROPERTY</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.learnMoreContainer}>
        <MaterialIcons name="help-outline" size={16} color="#006875" />
        <Text style={styles.learnMoreText}>LEARN ABOUT PROPERTY MANAGEMENT</Text>
      </TouchableOpacity>
    </BlurView>
  );

  const ListFooter = () => (
    properties.length > 0 ? (
      <TouchableOpacity 
        style={styles.addNewCard} 
        onPress={onNavigateToCreateProperty}
        activeOpacity={0.7}
      >
        <View style={styles.plusIconWrapper}>
          <MaterialIcons name="add" size={40} color="#6b7a7d" />
        </View>
        <Text style={styles.addNewTitle}>Add New Property</Text>
        <Text style={styles.addNewSubtitle}>Expand your portfolio</Text>
      </TouchableOpacity>
    ) : null
  );

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#f9ede0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }} />
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <MaterialIcons name="logout" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#00e5ff" />
          </View>
        ) : (
          <FlatList
            data={properties}
            renderItem={renderPropertyItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmptyComponent}
            ListFooterComponent={ListFooter}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={refreshProperties}
          />
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00e5ff',
    letterSpacing: 1,
  },
  menuButton: {
    padding: 5,
  },
  notificationButton: {
    padding: 5,
    position: 'relative',
  },
  logoutButton: {
    padding: 5,
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  titleContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#151d1e',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7a7d',
    marginTop: 5,
  },
  propertyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    padding: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#006875',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    overflow: 'hidden',
  },
  propertyInfo: {
    marginBottom: 20,
  },
  propertyName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#151d1e',
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#6b7a7d',
  },
  manageButtonWrapper: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  addNewCard: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#bac9cc',
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  plusIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#edf5f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  addNewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#151d1e',
    marginBottom: 5,
  },
  addNewSubtitle: {
    fontSize: 14,
    color: '#6b7a7d',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#006875',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    overflow: 'hidden',
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#151d1e',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6b7a7d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  createPropertyButton: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 25,
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  createPropertyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  createPropertyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  learnMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  learnMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006875',
    letterSpacing: 0.5,
  },
});
