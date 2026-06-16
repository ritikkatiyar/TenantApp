import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { RoleToggle } from '@/src/components/RoleToggle';

interface TenantMaintenanceScreenProps {
  token: string;
  onLogout: () => void;
}

const colors = {
  primary: '#004c5a',
  primaryContainer: '#006677',
  onPrimaryContainer: '#96e1f5',
  secondaryContainer: '#d2e4fb',
  secondaryFixed: '#d2e4fb',
  onSecondaryFixedVariant: '#38485a',
  background: '#f8f9ff',
  surfaceLowest: '#ffffff',
  surfaceLow: '#eff4ff',
  surfaceBright: '#f8f9ff',
  surfaceContainerHighest: '#d3e4fe',
  surfaceContainerHigh: '#dce9ff',
  tertiary: '#3e4648',
  tertiaryContainer: '#555e5f',
  onBackground: '#0b1c30',
  onSurfaceVariant: '#3f484b',
  outlineVariant: '#bec8cb',
  outline: '#6f797c',
  primaryFixed: '#aaedff',
  onPrimaryFixedVariant: '#004e5c',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  onPrimary: '#ffffff'
};

export default function TenantMaintenanceScreen({ token, onLogout }: TenantMaintenanceScreenProps) {
  const [description, setDescription] = useState('');

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Support Hub</Text>
            <Text style={styles.title}>Service Center</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <RoleToggle />
            <TouchableOpacity style={styles.createBtn}>
              <MaterialIcons name="add-circle" size={20} color="#fff" />
              <Text style={styles.createBtnText}>Create Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.formCard}>
            <View style={styles.formHeaderRow}>
              <View style={styles.iconBox}>
                <MaterialIcons name="build" size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.cardTitle}>New Request</Text>
                <Text style={styles.cardSubtitle}>Detail your issue for quick resolution</Text>
              </View>
            </View>

            <Text style={styles.label}>Short Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Leaking kitchen tap"
              placeholderTextColor={colors.outline}
            />

            <Text style={styles.label}>Elaborate details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the problem, when it started..."
              placeholderTextColor={colors.outline}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity style={styles.uploadBox}>
              <MaterialIcons name="upload-file" size={32} color={colors.onSurfaceVariant} />
              <Text style={styles.uploadText}>Upload photos or video</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>Submit Request</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.promoCard}>
            <View style={styles.promoBadge}><Text style={styles.promoBadgeText}>AI POWERED</Text></View>
            <Text style={styles.promoTitle}>Need instant troubleshooting?</Text>
            <Text style={styles.promoDesc}>Ask our AI Desk for immediate DIY fixes and appliance manual access before filing a ticket.</Text>
            <TouchableOpacity style={styles.promoBtn}>
              <MaterialIcons name="smart-toy" size={20} color={colors.primary} />
              <Text style={styles.promoBtnText}>Open AI Desk</Text>
            </TouchableOpacity>
            <MaterialIcons name="psychology" size={120} color="rgba(255,255,255,0.1)" style={styles.promoBgIcon} />
          </View>

          <View style={styles.healthCard}>
            <Text style={styles.healthTitle}>Service Health</Text>
            
            <View style={styles.healthRow}>
              <View style={styles.healthRowLeft}>
                <View style={[styles.healthPill, { backgroundColor: colors.primaryContainer }]} />
                <View>
                  <Text style={styles.healthLabel}>Active Tickets</Text>
                  <Text style={[styles.healthValue, { color: colors.primary }]}>02</Text>
                </View>
              </View>
              <MaterialIcons name="trending-up" size={24} color={colors.outline} />
            </View>

            <View style={styles.healthRow}>
              <View style={styles.healthRowLeft}>
                <View style={[styles.healthPill, { backgroundColor: colors.tertiaryContainer }]} />
                <View>
                  <Text style={styles.healthLabel}>Resolved (MTD)</Text>
                  <Text style={[styles.healthValue, { color: colors.tertiary }]}>14</Text>
                </View>
              </View>
              <MaterialIcons name="check-circle" size={24} color={colors.outline} />
            </View>
          </View>

          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>History & Status</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.historyLinkText}>View detailed log</Text>
                <MaterialIcons name="arrow-forward" size={16} color={colors.onSurfaceVariant} />
              </View>
            </View>
            
            <View style={styles.historyList}>
              {/* Item 1 */}
              <View style={styles.historyItem}>
                <View style={styles.historyItemMain}>
                  <Text style={styles.historyItemId}>#SR-9901</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.historyItemTitle}>Water seepage in bathroom</Text>
                    <Text style={styles.historyItemSub}>Plumbing • High</Text>
                  </View>
                </View>
                <View style={styles.historyItemRight}>
                  <View style={[styles.statusBadge, { backgroundColor: colors.secondaryFixed }]}>
                    <Text style={[styles.statusBadgeText, { color: colors.onSecondaryFixedVariant }]}>Technician Assigned</Text>
                  </View>
                  <Text style={styles.historyActionText}>Track</Text>
                </View>
              </View>

              {/* Item 2 */}
              <View style={styles.historyItem}>
                <View style={styles.historyItemMain}>
                  <Text style={styles.historyItemId}>#SR-9844</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.historyItemTitle}>AC Filter Replacement</Text>
                    <Text style={styles.historyItemSub}>HVAC • Standard</Text>
                  </View>
                </View>
                <View style={styles.historyItemRight}>
                  <View style={[styles.statusBadge, { backgroundColor: colors.primaryFixed }]}>
                    <Text style={[styles.statusBadgeText, { color: colors.onPrimaryFixedVariant }]}>Completed</Text>
                  </View>
                  <Text style={styles.historyActionText}>Receipt</Text>
                </View>
              </View>

              {/* Item 3 */}
              <View style={[styles.historyItem, { borderBottomWidth: 0 }]}>
                <View style={styles.historyItemMain}>
                  <Text style={styles.historyItemId}>#SR-9712</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.historyItemTitle}>Faulty living room switch</Text>
                    <Text style={styles.historyItemSub}>Electrical • Standard</Text>
                  </View>
                </View>
                <View style={styles.historyItemRight}>
                  <View style={[styles.statusBadge, { backgroundColor: colors.errorContainer }]}>
                    <Text style={[styles.statusBadgeText, { color: colors.onErrorContainer }]}>Awaiting Parts</Text>
                  </View>
                  <Text style={styles.historyActionText}>Remind</Text>
                </View>
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  kicker: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  title: { color: colors.onBackground, fontSize: 32, fontWeight: '800' },
  createBtn: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginLeft: 16 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  
  scrollContent: { paddingBottom: 40, gap: 24 },
  
  formCard: { backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 24, shadowColor: colors.primaryContainer, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3, borderWidth: 1, borderColor: 'rgba(190,200,203,0.3)' },
  formHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.secondaryFixed, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.onBackground },
  cardSubtitle: { fontSize: 14, color: colors.onSurfaceVariant, marginTop: 2 },
  
  label: { fontSize: 14, fontWeight: '600', color: colors.onSurfaceVariant, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#e5eeff', borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: 12, padding: 16, fontSize: 16, color: colors.onBackground },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  
  uploadBox: { borderWidth: 2, borderColor: colors.outlineVariant, borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceLow, marginTop: 24, marginBottom: 24 },
  uploadText: { fontSize: 14, fontWeight: '600', color: colors.onSurfaceVariant, marginTop: 8 },
  
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', alignSelf: 'flex-end', paddingHorizontal: 32 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  promoCard: { backgroundColor: colors.primaryContainer, borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' },
  promoBadge: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, marginBottom: 16 },
  promoBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  promoTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8, zIndex: 1 },
  promoDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 22, marginBottom: 16, width: '80%', zIndex: 1 },
  promoBtn: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, zIndex: 1 },
  promoBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  promoBgIcon: { position: 'absolute', right: -20, bottom: -20, transform: [{ rotate: '12deg' }] },

  healthCard: { backgroundColor: colors.surfaceContainerHighest, borderRadius: 16, padding: 24 },
  healthTitle: { fontSize: 20, fontWeight: '700', color: colors.onBackground, marginBottom: 20 },
  healthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  healthRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  healthPill: { width: 8, height: 40, borderRadius: 4 },
  healthLabel: { fontSize: 14, fontWeight: '600', color: colors.onBackground },
  healthValue: { fontSize: 24, fontWeight: '700', marginTop: 2 },

  historyCard: { backgroundColor: colors.background, borderRadius: 16, borderWidth: 1, borderColor: colors.outlineVariant, overflow: 'hidden' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: colors.surfaceLow, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  historyTitle: { fontSize: 20, fontWeight: '700', color: colors.onBackground },
  historyLinkText: { fontSize: 14, fontWeight: '600', color: colors.onSurfaceVariant, marginRight: 4 },
  historyList: { backgroundColor: '#fff' },
  historyItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(190,200,203,0.3)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  historyItemMain: { flexDirection: 'row', alignItems: 'center', flex: 2, minWidth: 200 },
  historyItemId: { fontSize: 16, fontWeight: '700', color: colors.primary },
  historyItemTitle: { fontSize: 16, fontWeight: '600', color: colors.onBackground },
  historyItemSub: { fontSize: 14, color: colors.onSurfaceVariant, marginTop: 4 },
  historyItemRight: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minWidth: 150 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  historyActionText: { color: colors.primary, fontSize: 14, fontWeight: '600' }
});
