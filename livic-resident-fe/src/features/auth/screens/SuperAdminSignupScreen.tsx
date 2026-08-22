import React, { useState, useRef } from 'react';
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
import { Theme } from '@/src/theme/Theme';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { signup } from '@/src/features/auth/api/auth.api';

const ValidationIndicator = ({ label, isValid, theme, styles }: { label: string; isValid: boolean; theme: any; styles: any }) => (
  <View style={styles.requirementRow}>
    <MaterialIcons 
      name={isValid ? "check-circle" : "radio-button-unchecked"} 
      size={14} 
      color={isValid ? theme.Colors.primary : theme.Colors.outlineVariant} 
    />
    <Text style={[styles.requirementText, isValid && styles.requirementTextValid]}>
      {label}
    </Text>
  </View>
);

interface SuperAdminSignupScreenProps {
  onSignup?: (data: any) => void;
  onNavigateToLogin?: () => void;
}

export default function SuperAdminSignupScreen({ onSignup, onNavigateToLogin }: SuperAdminSignupScreenProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      setErrorMsg('Please fill in all required fields (Name, Email, Password).');
      return;
    }

    if (phoneNumber && phoneNumber.trim() !== '') {
      if (phoneNumber.length !== 10) {
        setErrorMsg('Mobile number must be exactly 10 digits.');
        return;
      }
    }
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      const data = await signup({ fullName, email, phoneNumber, password });
      
      // Success! Pass token bundle back to index.tsx (or context)
      if (onSignup) {
        onSignup(data);
      }
    } catch (error: any) {
      console.error('Signup Request Error:', error);
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
                <MaterialIcons name="person-add" size={28} color={theme.Colors.primary} />
              </View>
              <Text style={styles.brandingText}>CREATE ACCOUNT</Text>
            </View>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color={theme.Colors.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Signup Form */}
            <View style={styles.formContainer}>
              
              {/* Full Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="person-outline" size={20} color={theme.Colors.outlineVariant} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingRight: 44 }]}
                    placeholder="Ada Tenant"
                    placeholderTextColor={theme.Colors.outlineVariant}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  {fullName ? (
                    <TouchableOpacity 
                      style={styles.clearIcon}
                      onPress={() => setFullName('')}
                    >
                      <MaterialIcons name="cancel" size={20} color={theme.Colors.outlineVariant} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="mail-outline" size={20} color={theme.Colors.outlineVariant} style={styles.inputIcon} />
                  <TextInput
                    ref={emailInputRef}
                    style={[styles.input, { paddingRight: 44 }]}
                    placeholder="super@admin.system"
                    placeholderTextColor={theme.Colors.outlineVariant}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => phoneInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  {email ? (
                    <TouchableOpacity 
                      style={styles.clearIcon}
                      onPress={() => setEmail('')}
                    >
                      <MaterialIcons name="cancel" size={20} color={theme.Colors.outlineVariant} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Phone Input (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PHONE NUMBER</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="phone" size={20} color={theme.Colors.outlineVariant} style={styles.inputIcon} />
                  <TextInput
                    ref={phoneInputRef}
                    style={[styles.input, { paddingRight: 44 }]}
                    placeholder="1234567890"
                    placeholderTextColor={theme.Colors.outlineVariant}
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    maxLength={10}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  {phoneNumber ? (
                    <TouchableOpacity 
                      style={styles.clearIcon}
                      onPress={() => setPhoneNumber('')}
                    >
                      <MaterialIcons name="cancel" size={20} color={theme.Colors.outlineVariant} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock-outline" size={20} color={theme.Colors.outlineVariant} style={styles.inputIcon} />
                  <TextInput
                    ref={passwordInputRef}
                    style={[styles.input, { paddingRight: 44 }]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.Colors.outlineVariant}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSignup}
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggleIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialIcons 
                      name={showPassword ? "visibility" : "visibility-off"} 
                      size={20} 
                      color={theme.Colors.outlineVariant} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Real-time Password Strength Requirements */}
                {password.length > 0 && (
                  <View style={styles.requirementsContainer}>
                    <ValidationIndicator label="At least 8 characters" isValid={password.length >= 8} theme={theme} styles={styles} />
                    <ValidationIndicator label="Uppercase & Lowercase letters" isValid={/[a-z]/.test(password) && /[A-Z]/.test(password)} theme={theme} styles={styles} />
                    <ValidationIndicator label="At least one number" isValid={/\d/.test(password)} theme={theme} styles={styles} />
                    <ValidationIndicator label="At least one special character" isValid={/[@$!%*?&#.\-_^+=~()[\]{}|\\:;"'<>,/]/.test(password)} theme={theme} styles={styles} />
                  </View>
                )}
              </View>

              {/* Action Button */}
              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
                activeOpacity={0.8} 
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.Colors.onPrimaryContainer} />
                ) : (
                  <Text style={styles.submitButtonText}>SIGN UP</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer Links */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
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
    padding: theme.Spacing.containerPadding,
    position: 'relative',
    paddingVertical: 40,
  },
  orb: {
    position: 'absolute',
    borderRadius: theme.Rounded.full,
    opacity: 0.3,
  },
  orb1: {
    top: '5%',
    left: '0%',
    width: 250,
    height: 250,
    backgroundColor: theme.Colors.primaryFixed,
    filter: 'blur(80px)' as any,
  },
  orb2: {
    bottom: '5%',
    right: '-5%',
    width: 300,
    height: 300,
    backgroundColor: theme.Colors.secondaryFixed,
    filter: 'blur(100px)' as any,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.Rounded.lg,
    paddingHorizontal: theme.Spacing.stackLg,
    paddingTop: 40,
    paddingBottom: theme.Spacing.stackLg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    alignItems: 'center',
    overflow: 'hidden',
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: theme.Spacing.stackLg,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: theme.Rounded.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.stackSm,
  },
  brandingText: {
    ...theme.Typography.headlineMd,
    color: theme.Colors.onSurface,
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...theme.Typography.labelCaps,
    color: theme.Colors.onSurfaceVariant,
    marginLeft: 4,
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: theme.Spacing.stackMd,
    zIndex: 1,
  },
  passwordToggleIcon: {
    position: 'absolute',
    right: theme.Spacing.stackMd,
    zIndex: 1,
    padding: 4,
  },
  clearIcon: {
    position: 'absolute',
    right: theme.Spacing.stackMd,
    zIndex: 1,
    padding: 4,
  },
  requirementsContainer: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: theme.Rounded.default,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    width: '100%',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementText: {
    ...theme.Typography.bodyMd,
    color: theme.Colors.onSurfaceVariant,
    fontSize: theme.Typography.BodySmall.fontSize,
    marginLeft: 8,
  },
  requirementTextValid: {
    color: theme.Colors.primary,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    borderRadius: theme.Rounded.default,
    paddingLeft: 44,
    paddingRight: theme.Spacing.stackMd,
    paddingVertical: 14,
    ...theme.Typography.bodyMd,
    color: theme.Colors.onSurface,
  },
  submitButton: {
    marginTop: 12,
    width: '100%',
    backgroundColor: theme.Colors.primaryContainer,
    paddingVertical: 16,
    paddingHorizontal: theme.Spacing.stackMd,
    borderRadius: theme.Rounded.default,
    alignItems: 'center',
    shadowColor: theme.Colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...theme.Typography.labelCaps,
    color: theme.Colors.onPrimaryContainer,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.Colors.errorContainer,
    padding: 12,
    borderRadius: theme.Rounded.default,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    ...theme.Typography.bodyMd,
    color: theme.Colors.error,
    marginLeft: 8,
    fontSize: theme.Typography.BodySmall.fontSize,
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
    ...theme.Typography.bodyMd,
    color: theme.Colors.onSurfaceVariant,
  },
  footerLink: {
    ...theme.Typography.bodyMd,
    color: theme.Colors.surfaceTint,
    fontWeight: 'bold',
  },
});
