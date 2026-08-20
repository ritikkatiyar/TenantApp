import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/theme/ThemeContext';

export default function FloatingBackButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={[styles.container, { top: Math.max(insets.top + 8, 16) }]}>
      <TouchableOpacity 
        onPress={onPress || (() => router.back())} 
        style={styles.touchable}
        activeOpacity={0.7}
      >
        {Platform.OS === 'web' ? (
          <View style={[styles.blurBase, { backgroundColor: theme.Colors.surfaceContainerHigh }]} />
        ) : (
          <BlurView intensity={45} tint={isDark ? 'dark' : 'light'} style={styles.blurBase} />
        )}
        <MaterialIcons name="arrow-back" size={24} color={theme.Colors.onSurface} style={styles.icon} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    zIndex: 999,
  },
  touchable: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  blurBase: {
    ...StyleSheet.absoluteFillObject,
  },
  icon: {
    zIndex: 2,
  }
});
