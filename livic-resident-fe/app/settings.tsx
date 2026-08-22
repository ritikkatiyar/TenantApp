import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { GlassCard } from '@/src/components/common/display/GlassCard';
import FloatingBackButton from '@/src/components/common/navigation/FloatingBackButton';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useResponsive } from '@/src/hooks/useResponsive';

export default function ResidentSettingsScreen() {
  const { theme, isDark, mode, setMode } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { isDesktop } = useResponsive();
  const router = useRouter();

  return (
    <PageShell
      scrollable
      edges={isDesktop ? ['top'] : []}
      contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
    >
      {!isDesktop && <FloatingBackButton onPress={() => router.back()} />}
      <View style={styles.heroSection}>
        <Text style={[styles.heroTitle, { color: theme.Colors.onBackground }]}>Settings & Preferences</Text>
        <Text style={[styles.heroSubtitle, { color: theme.Colors.onSurfaceVariant }]}>
          Manage your account theme, notifications, and app preferences
        </Text>
      </View>

      <View style={styles.grid}>
        {/* Appearance & Theme Card */}
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="palette" size={22} color={theme.Colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.Colors.onBackground }]}>Appearance & Theme</Text>
          </View>
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: theme.Colors.onBackground }]}>App Theme Mode</Text>
              <Text style={[styles.itemDesc, { color: theme.Colors.onSurfaceVariant }]}>
                Choose between Light, Dark, or System preference
              </Text>
            </View>
          </View>
          <View style={styles.themeOptionsRow}>
            {(['system', 'light', 'dark'] as const).map((themeOption) => {
              const isSelected = mode === themeOption;
              return (
                <TouchableOpacity
                  key={themeOption}
                  style={[
                    styles.themeOptionBtn,
                    {
                      borderColor: isSelected ? theme.Colors.primary : theme.Surface.border,
                      backgroundColor: isSelected ? theme.Colors.primaryContainer : theme.Surface.cardMuted,
                    },
                  ]}
                  onPress={() => setMode(themeOption)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={
                      themeOption === 'system'
                        ? 'settings-brightness'
                        : themeOption === 'dark'
                        ? 'dark-mode'
                        : 'light-mode'
                    }
                    size={18}
                    color={isSelected ? theme.Colors.onPrimaryContainer : theme.Colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: isSelected ? theme.Colors.onPrimaryContainer : theme.Colors.onSurfaceVariant },
                    ]}
                  >
                    {themeOption}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Notifications & System */}
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="info" size={22} color={theme.Colors.secondary} />
            <Text style={[styles.cardTitle, { color: theme.Colors.onBackground }]}>About & Support</Text>
          </View>
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: theme.Colors.onBackground }]}>Livic Resident Portal</Text>
              <Text style={[styles.itemDesc, { color: theme.Colors.onSurfaceVariant }]}>
                Version 1.2.0 • Modern Minimal & Glass Edition
              </Text>
            </View>
          </View>
        </GlassCard>
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    padding: 20,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  containerDesktop: {
    paddingTop: 32,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: theme.Typography.headlineMd.fontSize,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: theme.Typography.BodyMedium.fontSize,
  },
  grid: {
    gap: 16,
  },
  card: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: theme.Typography.BodyLarge.fontSize,
    fontWeight: '700',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '600',
  },
  itemDesc: {
    fontSize: theme.Typography.BodySmall.fontSize,
    marginTop: 2,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  themeOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  themeOptionText: {
    fontSize: theme.Typography.BodySmall.fontSize,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
