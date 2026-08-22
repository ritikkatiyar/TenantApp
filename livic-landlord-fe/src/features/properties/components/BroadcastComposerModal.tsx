import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { PropertyResponse } from '@/src/types/property';

interface BroadcastComposerModalProps {
  visible: boolean;
  selectedPropertyForBroadcast: PropertyResponse | null;
  broadcastTitle: string;
  setBroadcastTitle: (val: string) => void;
  broadcastContent: string;
  setBroadcastContent: (val: string) => void;
  broadcastCategory: 'GENERAL' | 'MAINTENANCE' | 'EMERGENCY' | 'BILLING' | 'EVENT';
  setBroadcastCategory: (val: 'GENERAL' | 'MAINTENANCE' | 'EMERGENCY' | 'BILLING' | 'EVENT') => void;
  broadcastSeverity: 'INFO' | 'WARNING' | 'CRITICAL';
  setBroadcastSeverity: (val: 'INFO' | 'WARNING' | 'CRITICAL') => void;
  broadcastTargetType: 'PROPERTY' | 'FLOOR' | 'UNIT';
  setBroadcastTargetType: (val: 'PROPERTY' | 'FLOOR' | 'UNIT') => void;
  broadcastTargetValue: string;
  setBroadcastTargetValue: (val: string) => void;
  sendingBroadcast: boolean;
  handleSendBroadcast: () => void;
  onClose: () => void;
}

export function BroadcastComposerModal({
  visible,
  selectedPropertyForBroadcast,
  broadcastTitle,
  setBroadcastTitle,
  broadcastContent,
  setBroadcastContent,
  broadcastCategory,
  setBroadcastCategory,
  broadcastSeverity,
  setBroadcastSeverity,
  broadcastTargetType,
  setBroadcastTargetType,
  broadcastTargetValue,
  setBroadcastTargetValue,
  sendingBroadcast,
  handleSendBroadcast,
  onClose
}: BroadcastComposerModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.composerOverlay}>
        <View style={styles.composerSheet}>
          {/* Header */}
          <View style={styles.composerHeader}>
            <View>
              <Text style={styles.composerTitle}>Broadcast Notice</Text>
              <Text style={styles.composerSubtitle}>{selectedPropertyForBroadcast?.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={theme.Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.composerScroll}>
            {/* Title */}
            <Text style={styles.composerLabel}>TITLE</Text>
            <TextInput
              style={styles.composerInput}
              placeholder="e.g. Water supply shut-off notice"
              value={broadcastTitle}
              onChangeText={setBroadcastTitle}
              maxLength={255}
            />

            {/* Content */}
            <Text style={styles.composerLabel}>CONTENT</Text>
            <TextInput
              style={[styles.composerInput, styles.composerTextarea]}
              placeholder="Describe the notice in detail..."
              value={broadcastContent}
              onChangeText={setBroadcastContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            {/* Category row */}
            <Text style={styles.composerLabel}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {(['GENERAL', 'MAINTENANCE', 'EMERGENCY', 'BILLING', 'EVENT'] as const).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, broadcastCategory === cat && styles.chipActive]}
                  onPress={() => setBroadcastCategory(cat)}
                >
                  <Text style={[styles.chipText, broadcastCategory === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Severity row */}
            <Text style={styles.composerLabel}>SEVERITY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {[
                { val: 'INFO' as const, color: theme.Colors.primary },
                { val: 'WARNING' as const, color: '#e28743' },
                { val: 'CRITICAL' as const, color: theme.Colors.error },
              ].map(({ val, color }) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.chip, broadcastSeverity === val && { ...styles.chipActive, backgroundColor: color, borderColor: color }]}
                  onPress={() => setBroadcastSeverity(val)}
                >
                  <Text style={[styles.chipText, broadcastSeverity === val && styles.chipTextActive]}>{val}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Target scope row */}
            <Text style={styles.composerLabel}>TARGET SCOPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {(['PROPERTY', 'FLOOR', 'UNIT'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, broadcastTargetType === t && styles.chipActive]}
                  onPress={() => setBroadcastTargetType(t)}
                >
                  <Text style={[styles.chipText, broadcastTargetType === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {broadcastTargetType !== 'PROPERTY' && (
              <>
                <Text style={styles.composerLabel}>
                  {broadcastTargetType === 'FLOOR' ? 'FLOOR NUMBER' : 'UNIT ID'}
                </Text>
                <TextInput
                  style={styles.composerInput}
                  placeholder={broadcastTargetType === 'FLOOR' ? 'e.g. 3' : 'e.g. uuid of unit'}
                  value={broadcastTargetValue}
                  onChangeText={setBroadcastTargetValue}
                  keyboardType={broadcastTargetType === 'FLOOR' ? 'numeric' : 'default'}
                />
              </>
            )}
          </ScrollView>

          {/* Send button */}
          <TouchableOpacity
            style={styles.composerSendBtn}
            onPress={handleSendBroadcast}
            disabled={sendingBroadcast}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={broadcastSeverity === 'CRITICAL' ? ['#ba1a1a', '#7d0e0e'] : ['#006875', '#00bcd4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.composerSendGradient}
            >
              {sendingBroadcast ? (
                <ActivityIndicator color={theme.Colors.surfaceContainerLowest} />
              ) : (
                <>
                  <MaterialIcons name="send" size={18} color={theme.Colors.surfaceContainerLowest} />
                  <Text style={styles.composerSendText}>BROADCAST NOW</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  composerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 28, 48, 0.45)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  composerSheet: {
    backgroundColor: theme.Colors.inverseSurface,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 28,
    maxHeight: '90%',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: theme.Surface.border,
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  composerTitle: {
    fontSize: theme.Typography.TitleLarge.fontSize,
    fontWeight: '800',
    color: theme.Colors.onBackground,
    fontFamily: 'Inter',
  },
  composerSubtitle: {
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  composerScroll: {
    marginBottom: 20,
  },
  composerLabel: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '800',
    color: theme.Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
    fontFamily: 'Inter',
  },
  composerInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    paddingHorizontal: 16,
    fontSize: theme.Typography.BodyMedium.fontSize,
    color: theme.Colors.onBackground,
    fontFamily: 'Inter',
  },
  composerTextarea: {
    height: 110,
    paddingVertical: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.Colors.glassFill,
    borderWidth: 1,
    borderColor: theme.Surface.border,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: theme.Colors.primary,
    borderColor: theme.Colors.primary,
  },
  chipText: {
    fontSize: theme.Typography.LabelSmall.fontSize,
    fontWeight: '700',
    color: theme.Colors.onSurfaceVariant,
    fontFamily: 'Inter',
  },
  chipTextActive: {
    color: theme.Colors.surfaceContainerLowest,
  },
  composerSendBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  composerSendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  composerSendText: {
    color: theme.Colors.surfaceContainerLowest,
    fontSize: theme.Typography.BodyMedium.fontSize,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
});
