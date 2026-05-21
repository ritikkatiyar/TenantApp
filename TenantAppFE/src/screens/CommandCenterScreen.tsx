import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  ActivityIndicator,
  FlatList,
  Alert,
  Animated
} from 'react-native';
import { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Theme } from '../theme/Theme';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../auth/AuthProvider';
import type { PropertyResponse } from '../types/property';
import Building3DView from '../components/Building3DView';

interface CommandCenterScreenProps {
  onNavigateToCreateProperty: () => void;
  onLogout: () => void;
}

export default function CommandCenterScreen({ onNavigateToCreateProperty, onLogout }: CommandCenterScreenProps) {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const { properties, isLoading, error, refreshProperties, deleteProperty } = useProperties();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [40, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleDeleteProperty = (propertyId: string, propertyName: string) => {
    Alert.alert(
      "Delete Property",
      `Are you sure you want to delete ${propertyName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProperty(propertyId);
            } catch (error) {
              Alert.alert("Delete Failed", (error as Error).message);
            }
          }
        }
      ]
    );
  };

  const renderPropertyItem = ({ item }: { item: PropertyResponse }) => (
    <BlurView intensity={60} tint="light" style={styles.propertyCard}>
      <View style={styles.buildingPreviewContainer}>
        {accessToken && <Building3DView propertyId={item.id} token={accessToken} />}
        
        <TouchableOpacity 
          style={styles.deleteButtonOverlay}
          onPress={() => handleDeleteProperty(item.id, item.name)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="delete-outline" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.propertyHeaderRow}>
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName}>{item.name}</Text>
          <View style={styles.addressContainer}>
            <MaterialIcons name="location-on" size={14} color="#6b7a7d" />
            <Text style={styles.propertyAddress}>{item.address}, {item.city}</Text>
          </View>
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
    <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
      <Text style={styles.mainTitle}>My Properties</Text>
      <Text style={styles.subtitle}>Overview of your real estate portfolio</Text>
    </Animated.View>
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
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={{ flex: 1, opacity: headerOpacity, justifyContent: 'center' }}>
            <Text style={styles.compactHeaderTitle}>My Properties</Text>
          </Animated.View>
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
          <Animated.FlatList
            data={properties}
            renderItem={renderPropertyItem}
            keyExtractor={(item: PropertyResponse) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmptyComponent}
            ListFooterComponent={ListFooter}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={refreshProperties}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
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
  compactHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#151d1e',
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
  propertyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  buildingPreviewContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: -10,
    marginBottom: 5,
    position: 'relative',
  },
  deleteButtonOverlay: {
    position: 'absolute',
    top: -10,
    right: -10,
    padding: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
    zIndex: 10,
  },
  propertyInfo: {
    marginBottom: 15,
    flex: 1,
    paddingRight: 10,
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
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
