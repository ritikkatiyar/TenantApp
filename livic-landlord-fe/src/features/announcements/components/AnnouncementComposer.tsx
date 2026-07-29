import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import GlassDropdown from '@/src/components/common/inputs/GlassDropdown';
import type { PropertyResponse } from '@/src/types/property';

interface AnnouncementComposerProps {
  properties: PropertyResponse[];
  selectedPropertyId: string | null;
  setSelectedPropertyId: (val: string | null) => void;
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
}

export function AnnouncementComposer({
  properties,
  selectedPropertyId,
  setSelectedPropertyId,
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
}: AnnouncementComposerProps) {
  return (
    <BlurView intensity={60} tint="light" style={styles.card}>
      <Text style={styles.sectionHeader}>NEW BROADCAST NOTICE</Text>

      {/* Property Select Dropdown */}
      <Text style={styles.composerLabel}>TARGET PROPERTY</Text>
      <GlassDropdown
        options={properties.map((p) => ({ label: p.name, value: p.id }))}
        value={selectedPropertyId}
        onChange={setSelectedPropertyId}
        placeholder="Select Target Property"
        icon="domain"
      />

      {/* Title */}
      <Text style={styles.composerLabel}>TITLE</Text>
      <TextInput
        style={styles.composerInput}
        placeholder="e.g. Water supply maintenance shutdown"
        placeholderTextColor="#a0aab2"
        value={broadcastTitle}
        onChangeText={setBroadcastTitle}
        maxLength={255}
      />

      {/* Content */}
      <Text style={styles.composerLabel}>CONTENT MESSAGE</Text>
      <TextInput
        style={[styles.composerInput, styles.composerTextarea]}
        placeholder="Write detail notice instructions..."
        placeholderTextColor="#a0aab2"
        value={broadcastContent}
        onChangeText={setBroadcastContent}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      {/* Category Row */}
      <Text style={styles.composerLabel}>CATEGORY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {(['GENERAL', 'MAINTENANCE', 'EMERGENCY', 'BILLING', 'EVENT'] as const).map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, broadcastCategory === cat && styles.chipActive]}
            onPress={() => setBroadcastCategory(cat)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, broadcastCategory === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Severity Row */}
      <Text style={styles.composerLabel}>SEVERITY LEVEL</Text>
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
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, broadcastSeverity === val && styles.chipTextActive]}>{val}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Target Scope Row */}
      <Text style={styles.composerLabel}>TARGET SCOPE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {(['PROPERTY', 'FLOOR', 'UNIT'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, broadcastTargetType === t && styles.chipActive]}
            onPress={() => setBroadcastTargetType(t)}
            activeOpacity={0.8}
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
            placeholderTextColor="#a0aab2"
            value={broadcastTargetValue}
            onChangeText={setBroadcastTargetValue}
            keyboardType={broadcastTargetType === 'FLOOR' ? 'numeric' : 'default'}
          />
        </>
      )}

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
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#006875',
    letterSpacing: 1.5,
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  composerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b7a7d',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 18,
    fontFamily: 'Inter',
  },
  composerInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 104, 117, 0.08)',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#151d1e',
    fontFamily: 'Inter',
  },
  composerTextarea: {
    height: 120,
    paddingVertical: 14,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 117, 0.15)',
    marginRight: 8,
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
    marginTop: 28,
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
