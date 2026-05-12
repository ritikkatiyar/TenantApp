import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../theme/Theme';
import { createProperty } from '../api/property.api';

export default function CreatePropertyScreen({ onBack, onSaveAndConfigure, userToken, ownerId }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [landmark, setLandmark] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!name || !address || !city || !totalFloors) {
      setErrorMsg('Please fill in all required fields (Name, Address, City, Floors).');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const property = await createProperty({
        ownerId,
        token: userToken,
        property: {
          name,
          address,
          city,
          landmark
        },
      });

      if (onSaveAndConfigure) {
        onSaveAndConfigure(property.id, parseInt(totalFloors, 10));
      }
    } catch (error) {
      console.error('Create Property Error:', error);
      setErrorMsg(error.message || 'Cannot connect to server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#f9ede0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Pinned header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#151d1e" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.titleLine}>Create</Text>
          <Text style={styles.titleLine}>Property</Text>
        </View>
      </View>

      {/* KAV wraps only the scrollable form — header stays above it */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Content Area — same glass style as Login */}
          <BlurView intensity={60} tint="light" style={styles.cardContainer}>
            <Text style={styles.description}>
              Enter the foundational details to begin configuring the spatial grid and floors for this property.
            </Text>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color={Theme.Colors.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Property Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Property Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Apex Tower"
                    placeholderTextColor="#bac9cc"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Address Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 100 Horizon Boulevard"
                    placeholderTextColor="#bac9cc"
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
              </View>

              {/* City Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>City</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Bengaluru"
                    placeholderTextColor="#bac9cc"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
              </View>

              {/* Landmark Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Landmark (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Metro Station"
                    placeholderTextColor="#bac9cc"
                    value={landmark}
                    onChangeText={setLandmark}
                  />
                </View>
              </View>

              {/* Total Floors Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Total Floors</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.inputWithIconRight}
                    placeholder="0"
                    placeholderTextColor="#bac9cc"
                    value={totalFloors}
                    onChangeText={setTotalFloors}
                    keyboardType="numeric"
                  />
                  <MaterialIcons name="layers" size={20} color="#bac9cc" style={styles.inputIconRight} />
                </View>
              </View>

              {/* Action Button - same gradient pill as dashboard CREATE PROPERTY */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSave}
                disabled={loading}
                style={styles.submitButtonWrapper}
              >
                <LinearGradient
                  colors={['#00d4ff', '#0072ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>SAVE & CONFIGURE FLOORS</Text>
                      <MaterialIcons name="check" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 100,
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
  titleContainer: {
    // tight line height wrap
  },
  titleLine: {
    fontSize: 48,
    fontWeight: '800',
    color: '#151d1e',
    lineHeight: 52,
    letterSpacing: -1,
  },
  cardContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: Theme.Rounded.lg,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: Theme.Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    overflow: 'hidden',
    marginBottom: 40,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3b494c',
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
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
  inputWithIconRight: {
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
  inputIconRight: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  actionContainer: {
    marginTop: 16,
  },
  submitButtonWrapper: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffdad6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: '#ba1a1a',
    marginLeft: 8,
  },
});
