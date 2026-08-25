import React from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useResponsive } from '@/src/hooks/useResponsive';

interface PageShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardAvoiding?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  onScroll?: (event: any) => void;
  onEndReached?: () => void;
}

export function PageShell({
  children,
  header,
  scrollable = false,
  style,
  contentContainerStyle,
  keyboardAvoiding = false,
  edges = ['left', 'right'],
  onScroll,
  onEndReached,
}: PageShellProps) {
  const { theme, isDark } = useAppTheme();
  const { isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();

  const mobileHeaderOffset = isDesktop ? 0 : (56 + (insets.top > 0 ? insets.top : 12));
  const mobileBottomOffset = isDesktop ? 0 : (68 + (insets.bottom > 0 ? insets.bottom : 12));

  const styles = React.useMemo(
    () => createStyles(theme, isDark, isDesktop, mobileHeaderOffset, mobileBottomOffset),
    [theme, isDark, isDesktop, mobileHeaderOffset, mobileBottomOffset]
  );

  const { handleScroll } = useScrollNav();

  const handleCombinedScroll = (event: any) => {
    handleScroll(event);
    if (onScroll) onScroll(event);

    if (onEndReached) {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      if (layoutMeasurement && contentOffset && contentSize) {
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 300;
        if (isCloseToBottom) {
          onEndReached();
        }
      }
    }
  };

  const container = (
    <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
      {header}
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          onScroll={handleCombinedScroll}
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flatContainer, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          {container}
        </KeyboardAvoidingView>
      ) : (
        container
      )}
    </View>
  );
}

const createStyles = (
  theme: any,
  isDark: boolean,
  isDesktop: boolean,
  mobileHeaderOffset: number,
  mobileBottomOffset: number
) =>
  StyleSheet.create({
    keyboardAvoid: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      width: '100%',
      paddingHorizontal: isDesktop ? 32 : theme.Spacing.containerPadding,
      paddingTop: isDesktop ? 24 : (mobileHeaderOffset + 12),
      paddingBottom: isDesktop ? 40 : (mobileBottomOffset + 24),
    },
    flatContainer: {
      flex: 1,
      width: '100%',
      paddingHorizontal: isDesktop ? 32 : theme.Spacing.containerPadding,
      paddingTop: isDesktop ? 24 : (mobileHeaderOffset + 12),
      paddingBottom: isDesktop ? 40 : (mobileBottomOffset + 24),
    },
  });
