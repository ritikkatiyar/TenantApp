import { useAppTheme } from '@/src/theme/ThemeContext';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

type ToolType = 'PAN' | 'ADD' | 'ERASE';

interface EditorToolbarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  handleClearAll: () => void;
  isDesktop: boolean;
  // Mobile Scroll logic props
  showRightArrow?: boolean;
  handleScroll?: (event: any) => void;
  handleScrollLayout?: (event: any) => void;
  handleScrollContentSizeChange?: (w: number, h: number) => void;
}

export function EditorToolbar({
  activeTool,
  setActiveTool,
  handleClearAll,
  isDesktop,
  showRightArrow,
  handleScroll,
  handleScrollLayout,
  handleScrollContentSizeChange,
}: EditorToolbarProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  if (isDesktop) {
    return (
      <BlurView intensity={80} tint="light" style={styles.floatingToolbar}>
        <TouchableOpacity 
          style={[styles.floatingToolButton, activeTool === 'PAN' && styles.floatingToolButtonActive]}
          onPress={() => setActiveTool('PAN')}
        >
          <MaterialIcons name="pan-tool" size={18} color={activeTool === 'PAN' ? '#fff' : '#006875'} />
          <Text style={[styles.floatingToolText, activeTool === 'PAN' && styles.floatingToolTextActive]}>Move</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.floatingToolButton, activeTool === 'ADD' && styles.floatingToolButtonActive]}
          onPress={() => setActiveTool('ADD')}
        >
          <MaterialIcons name="edit" size={18} color={activeTool === 'ADD' ? '#fff' : '#006875'} />
          <Text style={[styles.floatingToolText, activeTool === 'ADD' && styles.floatingToolTextActive]}>Draw</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.floatingToolButton, activeTool === 'ERASE' && styles.floatingToolButtonActive]}
          onPress={() => setActiveTool('ERASE')}
        >
          <MaterialIcons name="layers-clear" size={18} color={activeTool === 'ERASE' ? '#fff' : '#006875'} />
          <Text style={[styles.floatingToolText, activeTool === 'ERASE' && styles.floatingToolTextActive]}>Erase</Text>
        </TouchableOpacity>

        <View style={styles.floatingDivider} />

        <TouchableOpacity 
          style={styles.floatingToolButton}
          onPress={handleClearAll}
        >
          <MaterialIcons name="delete-sweep" size={18} color={theme.Colors.error} />
          <Text style={[styles.floatingToolText, { color: theme.Colors.error }]}>Clear</Text>
        </TouchableOpacity>
      </BlurView>
    );
  }

  return (
    <View style={styles.toolsPanel}>
      <Text style={styles.toolsTitle}>EDITOR TOOLS</Text>
      <View style={styles.toolsWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolsRow}
          style={styles.toolsScrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onLayout={handleScrollLayout}
          onContentSizeChange={handleScrollContentSizeChange}
        >
          <TouchableOpacity 
            style={[styles.toolButton, activeTool === 'PAN' && styles.toolButtonActive]}
            onPress={() => setActiveTool('PAN')}
          >
            <MaterialIcons name="pan-tool" size={20} color={activeTool === 'PAN' ? '#fff' : '#006875'} />
            <Text style={[styles.toolText, activeTool === 'PAN' && styles.toolTextActive]}>Move</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toolButton, activeTool === 'ADD' && styles.toolButtonActive]}
            onPress={() => setActiveTool('ADD')}
          >
            <MaterialIcons name="edit" size={20} color={activeTool === 'ADD' ? '#fff' : '#006875'} />
            <Text style={[styles.toolText, activeTool === 'ADD' && styles.toolTextActive]}>Draw</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolButton, activeTool === 'ERASE' && styles.toolButtonActive]}
            onPress={() => setActiveTool('ERASE')}
          >
            <MaterialIcons name="layers-clear" size={20} color={activeTool === 'ERASE' ? '#fff' : '#006875'} />
            <Text style={[styles.toolText, activeTool === 'ERASE' && styles.toolTextActive]}>Erase</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolButton}
            onPress={handleClearAll}
          >
            <MaterialIcons name="delete-sweep" size={20} color={theme.Colors.error} />
            <Text style={[styles.toolText, { color: theme.Colors.error }]}>Clear</Text>
          </TouchableOpacity>
        </ScrollView>
        {showRightArrow && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.scrollIndicator}
            pointerEvents="none"
          >
            <MaterialIcons name="chevron-right" size={18} color={theme.Colors.surfaceContainerLowest} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  // Desktop specific floating toolbar styles
  floatingToolbar: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: [{ translateX: -150 }],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    gap: 8,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
    width: 300,
    justifyContent: 'center',
  },
  floatingToolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  floatingToolButtonActive: {
    backgroundColor: theme.Colors.primary,
  },
  floatingToolText: {
    fontSize: theme.Typography.BodySmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.primary,
    fontFamily: 'Inter',
  },
  floatingToolTextActive: {
    color: theme.Colors.surfaceContainerLowest,
  },
  floatingDivider: {
    width: 1.5,
    height: 20,
    backgroundColor: 'rgba(0, 104, 117, 0.15)',
    marginHorizontal: 4,
  },
  // Mobile specific tools panel styles
  toolsPanel: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  toolsTitle: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '900',
    color: theme.Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  toolsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolsScrollView: {
    flexGrow: 0,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.12)',
    gap: 8,
    minWidth: 90,
    justifyContent: 'center',
  },
  toolButtonActive: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
  toolText: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '800',
    color: theme.Colors.primary,
    fontFamily: 'Inter',
  },
  toolTextActive: {
    color: theme.Colors.surfaceContainerLowest,
  },
  scrollIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 24,
    backgroundColor: theme.Colors.primary,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: 'black',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});
