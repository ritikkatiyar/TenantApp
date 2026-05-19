import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme/Theme';
import { login } from '../api/auth.api';

export default function SuperAdminLoginScreen({ onLogin, onNavigateToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      const data = await login({ email, password });
      
      // Success! Pass token bundle back to index.tsx (or context)
      if (onLogin) {
        onLogin(data);
      }
    } catch (error) {
      console.error('Login Request Error:', error);
      setErrorMsg(error.message || 'Cannot connect to server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#d4f5f9', '#e8f8fb', '#e2e0fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Ambient Background Orbs */}
          <View style={[styles.orb, styles.orb1]} />
          <View style={[styles.orb, styles.orb2]} />

          {/* Main Content Area */}
          <BlurView intensity={60} tint="light" style={styles.cardContainer}>
            {/* Branding */}
            <View style={styles.brandingContainer}>
              <View style={styles.iconWrapper}>
                <MaterialIcons name="shield" size={28} color={Theme.Colors.primary} />
              </View>
              <Text style={styles.brandingText}>COMMAND CENTER</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Welcome Back</Text>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color={Theme.Colors.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Login Form */}
            <View style={styles.formContainer}>
              {/* Admin Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ADMIN EMAIL</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="mail-outline" size={20} color={Theme.Colors.outlineVariant} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="super@admin.system"
                    placeholderTextColor={Theme.Colors.outlineVariant}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock-outline" size={20} color={Theme.Colors.outlineVariant} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={Theme.Colors.outlineVariant}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggleIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialIcons 
                      name={showPassword ? "visibility" : "visibility-off"} 
                      size={20} 
                      color={Theme.Colors.outlineVariant} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
                activeOpacity={0.8} 
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Theme.Colors.onPrimaryContainer} />
                ) : (
                  <Text style={styles.submitButtonText}>SIGN IN</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer Links */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don{"'"}t have an account?</Text>
              <TouchableOpacity onPress={onNavigateToSignup}>
                <Text style={styles.footerLink}>Sign Up</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.Spacing.containerPadding,
    position: 'relative',
  },
  orb: {
    position: 'absolute',
    borderRadius: Theme.Rounded.full,
    opacity: 0.3,
  },
  orb1: {
    top: '10%',
    left: '5%',
    width: 300,
    height: 300,
    backgroundColor: Theme.Colors.primaryFixed,
    filter: 'blur(100px)',
  },
  orb2: {
    bottom: '15%',
    right: '-10%',
    width: 350,
    height: 350,
    backgroundColor: Theme.Colors.secondaryFixed,
    filter: 'blur(120px)',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // lower opacity for better glass effect
    borderRadius: Theme.Rounded.lg, // 16px usually
    paddingHorizontal: Theme.Spacing.stackLg, // 32
    paddingTop: 48,
    paddingBottom: Theme.Spacing.stackLg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: Theme.Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    alignItems: 'center',
    overflow: 'hidden',
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: Theme.Spacing.stackMd,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: Theme.Rounded.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.Spacing.stackSm,
  },
  brandingText: {
    ...Theme.Typography.labelCaps,
    color: Theme.Colors.outline, // #6b7a7d
    marginTop: 8,
  },
  title: {
    ...Theme.Typography.headlineMd, // 24px bold
    color: Theme.Colors.onSurface, // #151d1e
    marginBottom: 40,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    ...Theme.Typography.labelCaps,
    color: Theme.Colors.onSurfaceVariant, // #3b494c
    marginLeft: 4,
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: Theme.Spacing.stackMd,
    zIndex: 1,
  },
  passwordToggleIcon: {
    position: 'absolute',
    right: Theme.Spacing.stackMd,
    zIndex: 1,
    padding: 4, // easier to tap
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    borderRadius: Theme.Rounded.default, // 8px
    paddingLeft: 44,
    paddingRight: Theme.Spacing.stackMd,
    paddingVertical: 14,
    ...Theme.Typography.bodyMd,
    color: Theme.Colors.onSurface,
  },
  submitButton: {
    marginTop: 8,
    width: '100%',
    backgroundColor: Theme.Colors.primaryContainer, // #00e5ff
    paddingVertical: 16,
    paddingHorizontal: Theme.Spacing.stackMd,
    borderRadius: Theme.Rounded.default,
    alignItems: 'center',
    shadowColor: Theme.Colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...Theme.Typography.labelCaps,
    color: Theme.Colors.onPrimaryContainer, // #00626e
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.Colors.errorContainer, // #ffdad6
    padding: 12,
    borderRadius: Theme.Rounded.default,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    ...Theme.Typography.bodyMd,
    color: Theme.Colors.error,
    marginLeft: 8,
    fontSize: 12,
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  footerText: {
    ...Theme.Typography.bodyMd,
    color: Theme.Colors.onSurfaceVariant,
  },
  footerLink: {
    ...Theme.Typography.bodyMd,
    color: Theme.Colors.surfaceTint, // #006875
    fontWeight: 'bold',
  },
});
