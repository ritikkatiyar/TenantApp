import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';

export interface PropertyOption {
  id: string;
  name: string;
}

interface DesktopNavBarProps {
  onBack?: () => void;
  backText?: string;
  rightContent?: React.ReactNode;
  properties?: PropertyOption[];
  selectedPropertyId?: string | null;
  onPropertyChange?: (propertyId: string) => void;
  title?: string;
  activeTab?: string;
  hideTabs?: boolean;
}

export default function DesktopNavBar({ 
  onBack, 
  backText = 'Back to Portfolio',
  rightContent,
  properties,
  selectedPropertyId,
  onPropertyChange,
}: DesktopNavBarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark, toggleTheme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const initial = user?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || 'A';

  const propertyOptions = (properties || []).map(p => ({
    label: p.name,
    value: p.id,
  }));

  return (
    <BlurView intensity={70} tint={isDark ? "dark" : "light"} style={styles.topbar}>
      {/* Left Area: Back Button */}
      <View style={styles.topbarLeft}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButtonDesktop} activeOpacity={0.75}>
            <MaterialIcons name="arrow-back" size={18} color={theme.Colors.onBackground} />
            <Text style={styles.backButtonTextDesktop}>{backText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Center/Right Area: Property Selector Dropdown + Right Content + Theme Toggle + Avatar */}
      <View style={styles.topbarRight}>
        {onPropertyChange ? (
          <View style={styles.propertySelectorWrapper}>
            <GlassDropdown
              options={
                propertyOptions.length > 0
                  ? propertyOptions
                  : [{ label: '+ Create Property', value: 'create_new_prop' }]
              }
              value={
                propertyOptions.length > 0
                  ? (selectedPropertyId || properties?.[0]?.id || null)
                  : 'create_new_prop'
              }
              onChange={(val) => {
                if (val === 'create_new_prop') {
                  router.push('/properties/create');
                } else if (onPropertyChange) {
                  onPropertyChange(val);
                }
              }}
              placeholder="Select Property"
              icon="business"
            />
          </View>
        ) : null}

        {rightContent}

        <TouchableOpacity 
          onPress={toggleTheme} 
          style={styles.themeToggleBtn}
          activeOpacity={0.75}
          accessibilityLabel="Toggle Theme Mode"
        >
          <MaterialIcons 
            name={isDark ? "wb-sunny" : "dark-mode"} 
            size={20} 
            color={isDark ? "#f59e0b" : theme.Colors.primary} 
          />
        </TouchableOpacity>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
    </BlurView>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  topbar: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderColor: theme.Surface.border,
    backgroundColor: theme.Colors.glassFill,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  propertySelectorWrapper: {
    width: 220,
  },
  themeToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.Surface.card,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.Surface.card,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonTextDesktop: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.Colors.onBackground,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#006875',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006875',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
