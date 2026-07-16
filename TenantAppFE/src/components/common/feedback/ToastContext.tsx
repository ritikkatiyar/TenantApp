import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Alert, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const TOAST_CONFIG: Record<ToastType, {
  icon: string;
  gradientColors: readonly [string, string];
  accentColor: string;
  glowColor: string;
}> = {
  success: {
    icon: 'check-circle',
    gradientColors: ['#059669', '#10b981'],
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
  error: {
    icon: 'cancel',
    gradientColors: ['#dc2626', '#ef4444'],
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.3)',
  },
  warning: {
    icon: 'warning-amber',
    gradientColors: ['#d97706', '#f59e0b'],
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.3)',
  },
  info: {
    icon: 'info',
    gradientColors: ['#0891b2', '#06b6d4'],
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.3)',
  },
};

function ToastItem({
  toast,
  fadeAnim,
  slideAnim,
  onDismiss,
}: {
  toast: ToastMessage;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const config = TOAST_CONFIG[toast.type];

  const isWeb = Platform.OS === 'web';

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          bottom: Math.max(insets.bottom + 16, 32),
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Glow shadow effect */}
      <View style={[styles.glowLayer, { backgroundColor: config.glowColor }]} />

      {isWeb ? (
        // Web fallback: plain frosted View (BlurView can crash on mobile browsers)
        <View style={[styles.toastBlur, styles.toastBlurWeb]}>
          <LinearGradient colors={config.gradientColors} style={styles.accentStripe} />
          <View style={[styles.iconCircle, { backgroundColor: `${config.accentColor}18` }]}>
            <MaterialIcons name={config.icon as any} size={22} color={config.accentColor} />
          </View>
          <View style={styles.textBlock}>
            {toast.title && (
              <Text style={[styles.toastTitle, { color: config.accentColor }]} numberOfLines={1}>
                {toast.title}
              </Text>
            )}
            <Text style={styles.toastMessage} numberOfLines={3}>{toast.message}</Text>
          </View>
          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={16} color="#849495" />
          </TouchableOpacity>
        </View>
      ) : (
        <BlurView intensity={70} tint="light" style={styles.toastBlur}>
          <LinearGradient colors={config.gradientColors} style={styles.accentStripe} />
          <View style={[styles.iconCircle, { backgroundColor: `${config.accentColor}18` }]}>
            <MaterialIcons name={config.icon as any} size={22} color={config.accentColor} />
          </View>
          <View style={styles.textBlock}>
            {toast.title && (
              <Text style={[styles.toastTitle, { color: config.accentColor }]} numberOfLines={1}>
                {toast.title}
              </Text>
            )}
            <Text style={styles.toastMessage} numberOfLines={3}>{toast.message}</Text>
          </View>
          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={16} color="#849495" />
          </TouchableOpacity>
        </BlurView>
      )}
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const timerRef = useRef<any>(null);
  const originalAlertRef = useRef(Alert.alert);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 60, useNativeDriver: true, tension: 80, friction: 10 }),
    ]).start(() => setToast(null));
  }, [fadeAnim, slideAnim]);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // Auto-derive title if not provided
    const autoTitle = title ?? (
      type === 'success' ? 'Success' :
      type === 'error' ? 'Something went wrong' :
      type === 'warning' ? 'Heads up' :
      'Notice'
    );

    setToast({ id: Math.random().toString(), message, type, title: autoTitle });

    fadeAnim.setValue(0);
    slideAnim.setValue(60);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 90, friction: 11 }),
    ]).start();

    const duration = type === 'error' ? 5000 : 3500;
    timerRef.current = setTimeout(hideToast, duration);
  }, [fadeAnim, slideAnim, hideToast]);

  // Intercept Alert.alert globally so every screen benefits
  useEffect(() => {
    Alert.alert = (title: any, message?: any, buttons?: any, options?: any) => {
      const msg = message || (typeof title === 'string' ? title : '');
      const titleStr = typeof title === 'string' ? title : '';
      const isConfirmation = buttons && buttons.length > 1;

      if (isConfirmation) {
        if (Platform.OS === 'web') {
          const cancelButton = buttons.find((b: any) => b.style === 'cancel');
          const primaryButton = buttons.find((b: any) => b.style !== 'cancel');
          const confirmed = window.confirm(`${titleStr ? titleStr + '\n\n' : ''}${msg}`);
          if (confirmed) primaryButton?.onPress?.();
          else cancelButton?.onPress?.();
        } else {
          originalAlertRef.current(title, message, buttons, options);
        }
      } else {
        const lc = (titleStr + msg).toLowerCase();
        const type: ToastType =
          lc.includes('error') || lc.includes('fail') || lc.includes('wrong') ? 'error' :
          lc.includes('warn') ? 'warning' :
          'success';
        showToast(msg, type, titleStr || undefined);

        const okButton = buttons?.[0];
        if (okButton?.onPress) {
          const fn = okButton.onPress;
          setTimeout(() => fn(), 1400);
        }
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert = (message: string) => {
        const lc = message?.toLowerCase() || '';
        const type: ToastType =
          lc.includes('error') || lc.includes('fail') ? 'error' :
          lc.includes('warn') ? 'warning' :
          'success';
        showToast(message, type);
      };
    }

    return () => { Alert.alert = originalAlertRef.current; };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <ToastItem
          toast={toast}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
          onDismiss={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    alignSelf: 'center',
    maxWidth: 560,
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    // blur-like shadow on native
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: { elevation: 10 },
    }),
  },
  toastBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 0,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  accentStripe: {
    width: 5,
    alignSelf: 'stretch',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    marginRight: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Inter',
    letterSpacing: 0.2,
  },
  toastMessage: {
    color: '#2c3e50',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  toastBlurWeb: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
  },
  dismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
