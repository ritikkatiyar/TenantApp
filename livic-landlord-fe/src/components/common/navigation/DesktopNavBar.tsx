import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/features/auth/context/AuthProvider';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useIssues } from '@/src/features/issues/hooks/useIssues';

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
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showPopoverList?: boolean;
}

export default function DesktopNavBar({ 
  onBack, 
  backText = 'Back to Portfolio',
  rightContent,
  properties = [],
  selectedPropertyId,
  onPropertyChange,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search property or portfolio...',
  showSearch = true,
  showPopoverList = true,
}: DesktopNavBarProps) {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const initial = user?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || 'A';

  const { metrics } = useIssues(accessToken);
  const unreadCount = metrics?.escalated || 0;

  const [localSearch, setLocalSearch] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const query = searchQuery !== undefined ? searchQuery : localSearch;
  const selectedProp = properties.find(p => p.id === selectedPropertyId);
  const displayValue = showPopoverList ? (query || (isPopoverOpen ? '' : (selectedProp?.name || ''))) : query;

  const matchingProperties = (properties || []).filter(p => 
    p.name.toLowerCase().includes((query || '').toLowerCase())
  );

  const handleTextChange = (text: string) => {
    if (onSearchChange) {
      onSearchChange(text);
    } else {
      setLocalSearch(text);
    }
    if (showPopoverList) {
      setIsPopoverOpen(true);
    }
  };

  const handleSelectProperty = (propId: string, propName: string) => {
    if (onPropertyChange) {
      onPropertyChange(propId);
    }
    if (onSearchChange) {
      onSearchChange(propName);
    } else {
      setLocalSearch(propName);
    }
    setIsPopoverOpen(false);
  };

  return (
    <BlurView intensity={75} tint={isDark ? "dark" : "light"} style={styles.topbar}>
      {/* Left Area */}
      <View style={styles.topbarLeft}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButtonDesktop} activeOpacity={0.75}>
            <MaterialIcons name="arrow-back" size={18} color={theme.Colors.onBackground} />
            <Text style={styles.backButtonTextDesktop}>{backText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Right Area: Search with Autocomplete Suggestions Popover */}
      <View style={styles.topbarRight}>
        {(showSearch || onSearchChange || onPropertyChange || properties.length > 0) && (
          <View style={{ position: 'relative', zIndex: 1000 }}>
            <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={styles.searchBox}>
              <MaterialIcons name="search" size={18} color={theme.Colors.onSurfaceVariant} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.Colors.onSurfaceVariant}
                value={displayValue}
                onChangeText={handleTextChange}
                onFocus={() => showPopoverList && setIsPopoverOpen(true)}
              />
              {displayValue ? (
                <TouchableOpacity 
                  onPress={() => {
                    setLocalSearch('');
                    if (onSearchChange) onSearchChange('');
                    if (onPropertyChange) onPropertyChange(null as any);
                    setIsPopoverOpen(false);
                  }} 
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="close" size={16} color={theme.Colors.onSurfaceVariant} />
                </TouchableOpacity>
              ) : null}
            </BlurView>

            {/* Property Autocomplete Suggestions Popover */}
            {showPopoverList && isPopoverOpen && (
              <BlurView intensity={90} tint={isDark ? "dark" : "light"} style={styles.suggestionsPopover}>
                <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
                  <TouchableOpacity
                    style={[
                      styles.suggestionItem,
                      !selectedPropertyId && styles.suggestionItemActive
                    ]}
                    onPress={() => {
                      if (onPropertyChange) onPropertyChange(null as any);
                      if (onSearchChange) onSearchChange('');
                      setLocalSearch('');
                      setIsPopoverOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons 
                      name="storefront" 
                      size={16} 
                      color={!selectedPropertyId ? theme.Colors.primary : theme.Colors.onSurfaceVariant} 
                    />
                    <Text style={[
                      styles.suggestionText,
                      !selectedPropertyId && styles.suggestionTextActive
                    ]}>
                      All Properties
                    </Text>
                  </TouchableOpacity>

                  {matchingProperties.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.suggestionItem,
                        p.id === selectedPropertyId && styles.suggestionItemActive
                      ]}
                      onPress={() => handleSelectProperty(p.id, p.name)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons 
                        name="business" 
                        size={16} 
                        color={p.id === selectedPropertyId ? theme.Colors.primary : theme.Colors.onSurfaceVariant} 
                      />
                      <Text style={[
                        styles.suggestionText,
                        p.id === selectedPropertyId && styles.suggestionTextActive
                      ]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </BlurView>
            )}
          </View>
        )}

        {rightContent}

        <TouchableOpacity 
          style={styles.notificationButton} 
          onPress={() => router.push('/escalations')}
          activeOpacity={0.75}
        >
          <Ionicons name="notifications-outline" size={23} color={theme.Colors.onSurface} />
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
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
    paddingHorizontal: theme.Spacing.xl,
    borderBottomWidth: 1,
    borderColor: theme.Surface.border,
    backgroundColor: theme.Colors.glassFill,
    zIndex: 999,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 260,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    gap: theme.Spacing.xs,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  suggestionsPopover: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    backgroundColor: isDark ? 'rgba(15, 23, 32, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.Surface.border,
  },
  suggestionItemActive: {
    backgroundColor: isDark ? 'rgba(0, 229, 255, 0.15)' : 'rgba(0, 104, 117, 0.08)',
  },
  suggestionText: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    color: theme.Colors.onSurface,
    fontWeight: '600',
  },
  suggestionTextActive: {
    color: theme.Colors.primary,
    fontWeight: '800',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: theme.Colors.error || '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  backButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.sm,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.Surface.card,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonTextDesktop: {
    fontSize: theme.Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: theme.Colors.onBackground,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    color: theme.Colors.surfaceContainerLowest,
    fontWeight: '800',
    fontSize: theme.Typography.bodyLarge.fontSize,
  },
});
