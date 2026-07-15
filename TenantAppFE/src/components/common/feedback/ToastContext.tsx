import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const timerRef = useRef<any>(null);
  const originalAlertRef = useRef(Alert.alert);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [fadeAnim, slideAnim]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({ id: Math.random().toString(), message, type });
    
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(50);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => {
      hideToast();
    }, 3000);
  }, [fadeAnim, slideAnim, hideToast]);

  useEffect(() => {
    // Intercept React Native Alert calls
    Alert.alert = (title, message, buttons, options) => {
      const msg = message || (typeof title === 'string' ? title : '');
      const isConfirmation = buttons && buttons.length > 1;

      if (isConfirmation) {
        if (Platform.OS === 'web') {
          const cancelButton = buttons.find(b => b.style === 'cancel');
          const primaryButton = buttons.find(b => b.style !== 'cancel');
          const confirmResult = window.confirm(`${title ? title + ': ' : ''}${msg}`);
          if (confirmResult) {
            if (primaryButton?.onPress) primaryButton.onPress();
          } else {
            if (cancelButton?.onPress) cancelButton.onPress();
          }
        } else {
          originalAlertRef.current(title, message, buttons, options);
        }
      } else {
        const isError = title?.toLowerCase().includes('error') || title?.toLowerCase().includes('fail') || msg?.toLowerCase().includes('failed');
        showToast(msg, isError ? 'error' : 'success');

        const okButton = buttons?.[0];
        if (okButton?.onPress) {
          const onPress = okButton.onPress;
          setTimeout(() => onPress(), 1200);
        }
      }
    };

    // Intercept native browser alert calls on web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert = (message: string) => {
        const isError = message?.toLowerCase().includes('error') || message?.toLowerCase().includes('fail') || message?.toLowerCase().includes('failed');
        showToast(message, isError ? 'error' : 'success');
      };
    }

    return () => {
      Alert.alert = originalAlertRef.current;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View 
          style={[
            styles.toastContainer, 
            styles[toast.type],
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <MaterialIcons 
            name={
              toast.type === 'success' ? 'check-circle' :
              toast.type === 'error' ? 'error' : 'info'
            } 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignSelf: 'center',
    maxWidth: 600,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 10000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
        left: '50%',
        right: 'auto',
        transform: [{ translateX: -300 }],
        width: 600,
      }
    })
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  success: {
    backgroundColor: '#006875', // Match theme primary
  },
  error: {
    backgroundColor: '#ba1a1a', // Match theme error red
  },
  info: {
    backgroundColor: '#5b6b6d', // Match theme secondary gray
  },
});
