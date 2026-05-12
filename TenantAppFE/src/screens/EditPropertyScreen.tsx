import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '../theme/Theme';
import { getProperty, updateProperty } from '../api/property.api';

interface EditPropertyScreenProps {
  propertyId: string;
  userToken: string;
  onBack: () => void;
  onSave: () => void;
  onConfigureFloors: () => void;
}

export default function EditPropertyScreen({ 
  propertyId, 
  userToken, 
  onBack, 
  onSave,
  onConfigureFloors
}: EditPropertyScreenProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [landmark, setLandmark] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      const data = await getProperty(propertyId, userToken);
      setName(data.name);
      setAddress(data.address);
      setCity(data.city);
      setLandmark(data.landmark || '');
      setTotalFloors(data.totalFloors?.toString() || '');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch property details');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name || !address || !city || !totalFloors) {
      Alert.alert('Validation', 'Please fill in all required fields (Name, Address, City, Floors).');
      return;
    }

    setSaving(true);
    try {
      await updateProperty({
        propertyId,
        token: userToken,
        property: { 
          name, 
          address, 
          city, 
          landmark, 
          totalFloors: parseInt(totalFloors, 10) 
        }
      });
      Alert.alert('Success', 'Property updated successfully');
      onSave();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update property');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#d4f5f9', '#e8f8fb', '#f9ede0']} style={styles.container}>
        <ActivityIndicator size="large" color={Theme.Colors.primary} style={styles.loader} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient 
      colors={['#d4f5f9', '#e8f8fb', '#f9ede0']} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Pinned Header with Back Button and Massive Title */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.titleLine}>Edit</Text>
            <Text style={styles.titleLine}>Property</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <BlurView intensity={60} tint="light" style={styles.card}>
              <Text style={styles.sectionTitle}>BASIC INFORMATION</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PROPERTY NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Lumina Heights"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Street address"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CITY</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. New York"
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>LANDMARK (OPTIONAL)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Near Central Park"
                  value={landmark}
                  onChangeText={setLandmark}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>TOTAL FLOORS</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="0"
                    value={totalFloors}
                    onChangeText={setTotalFloors}
                    keyboardType="numeric"
                  />
                  <MaterialIcons name="layers" size={20} color="#bac9cc" style={styles.inputIcon} />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.saveButtonWrapper} 
                onPress={handleUpdate}
                disabled={saving}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#00d4ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButton}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                      <MaterialIcons name="check" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>STRUCTURE & UNITS</Text>
              <TouchableOpacity 
                style={styles.configButton}
                activeOpacity={0.7}
                onPress={onConfigureFloors}
              >
                <View style={styles.configIconWrapper}>
                  <MaterialIcons name="layers" size={24} color="#006875" />
                </View>
                <View style={styles.configTextWrapper}>
                  <Text style={styles.configTitle}>CONFIGURE FLOORS</Text>
                  <Text style={styles.configSubtitle}>Manage floors, units, and layout</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#6b7a7d" />
              </TouchableOpacity>
            </BlurView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {},
  titleLine: {
    fontSize: 48,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 52,
    letterSpacing: -1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006875',
    letterSpacing: 1,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#151d1e',
    marginBottom: 10,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#151d1e',
  },
  inputWithIcon: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 8,
    paddingLeft: 16,
    paddingRight: 48,
    paddingVertical: 14,
    fontSize: 16,
    color: '#151d1e',
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
  },
  saveButtonWrapper: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#0072ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  saveButton: {
    flexDirection: 'row',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginVertical: 32,
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  configIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  configTextWrapper: {
    flex: 1,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151d1e',
  },
  configSubtitle: {
    fontSize: 12,
    color: '#6b7a7d',
    marginTop: 2,
  }
});
