import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
              <MaterialIcons name="close" size={24} color="#163235" />
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
                { val: 'INFO' as const, color: '#006875' },
                { val: 'WARNING' as const, color: '#e28743' },
                { val: 'CRITICAL' as const, color: '#ba1a1a' },
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
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="send" size={18} color="#fff" />
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

const styles = StyleSheet.create({
  composerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 28, 48, 0.45)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  composerSheet: {
    backgroundColor: '#f3fbfc',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 28,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  composerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#151d1e',
    fontFamily: 'Inter',
  },
  composerSubtitle: {
    fontSize: 13,
    color: '#6b7a7d',
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  composerScroll: {
    marginBottom: 20,
  },
  composerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b7a7d',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
    fontFamily: 'Inter',
  },
  composerInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.15)',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#151d1e',
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.15)',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: '#006875',
    borderColor: '#006875',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7a7d',
    fontFamily: 'Inter',
  },
  chipTextActive: {
    color: '#fff',
  },
  composerSendBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#006875',
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
});
