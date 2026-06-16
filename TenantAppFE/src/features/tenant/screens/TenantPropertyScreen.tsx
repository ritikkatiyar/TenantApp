import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { RoleToggle } from '@/src/components/RoleToggle';

interface TenantPropertyScreenProps {
  token: string;
  onLogout: () => void;
}

const colors = {
  primary: '#004c5a',
  primaryContainer: '#006677',
  onPrimaryContainer: '#96e1f5',
  secondaryContainer: '#d2e4fb',
  background: '#f8f9ff',
  surfaceLowest: '#ffffff',
  surfaceLow: '#eff4ff',
  surfaceBright: '#f8f9ff',
  inverseSurface: '#213145',
  inverseOnSurface: '#eaf1ff',
  onBackground: '#0b1c30',
  onSurfaceVariant: '#3f484b',
  outlineVariant: '#bec8cb',
  outline: '#6f797c',
  primaryFixed: '#aaedff',
  onPrimary: '#ffffff'
};

export default function TenantPropertyScreen({ token, onLogout }: TenantPropertyScreenProps) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>MY PROPERTY</Text>
            <Text style={styles.title}>My Home</Text>
          </View>
          <RoleToggle />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.mainCard}>
            <View style={styles.mainCardHeaderRow}>
              <View style={styles.iconBox}>
                <MaterialIcons name="apartment" size={32} color={colors.onPrimaryContainer} />
              </View>
              <View>
                <Text style={styles.propertyName}>Libsys Residential</Text>
                <Text style={styles.unitInfo}>Unit 101, Floor 4 • Premium Garden View</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Monthly Rent</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={styles.statValue}>₹10,000</Text>
                  <Text style={styles.statLabel}> / month</Text>
                </View>
              </View>
              <View style={styles.statusBox}>
                <Text style={styles.statLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>ACTIVE</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.leaseDetailsCard}>
            <Text style={styles.leaseTitle}>Lease Details</Text>
            
            <View style={styles.leaseRow}>
              <MaterialIcons name="calendar-today" size={24} color={colors.primaryFixed} />
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.leaseLabel}>Start Date</Text>
                <Text style={styles.leaseValue}>Jan 01, 2024</Text>
              </View>
            </View>
            
            <View style={styles.leaseRow}>
              <MaterialIcons name="event-busy" size={24} color={colors.primaryFixed} />
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.leaseLabel}>End Date</Text>
                <Text style={styles.leaseValue}>Dec 31, 2024</Text>
              </View>
            </View>

            <View style={styles.leaseRow}>
              <MaterialIcons name="verified-user" size={24} color={colors.primaryFixed} />
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.leaseLabel}>Security Deposit</Text>
                <Text style={styles.leaseValue}>₹30,000 (Locked)</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.leaseBtn}>
              <MaterialIcons name="description" size={20} color="#fff" />
              <Text style={styles.leaseBtnText}>Digital Lease Agreement</Text>
            </TouchableOpacity>
            <Text style={styles.leaseSignedText}>Signed on Dec 15, 2023</Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Property Amenities</Text>
          </View>
          
          <View style={styles.amenitiesGrid}>
            <View style={styles.amenityCard}>
              <View style={styles.amenityIconBox}>
                <MaterialIcons name="wifi" size={24} color={colors.primary} />
              </View>
              <Text style={styles.amenityText}>High-speed Wi-Fi</Text>
            </View>
            <View style={styles.amenityCard}>
              <View style={styles.amenityIconBox}>
                <MaterialIcons name="pool" size={24} color={colors.primary} />
              </View>
              <Text style={styles.amenityText}>Pool Access</Text>
            </View>
            <View style={styles.amenityCard}>
              <View style={styles.amenityIconBox}>
                <MaterialIcons name="local-parking" size={24} color={colors.primary} />
              </View>
              <Text style={styles.amenityText}>Reserved Parking</Text>
            </View>
            <View style={styles.amenityCard}>
              <View style={styles.amenityIconBox}>
                <MaterialIcons name="fitness-center" size={24} color={colors.primary} />
              </View>
              <Text style={styles.amenityText}>24/7 Gym</Text>
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
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  kicker: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  title: { color: colors.onBackground, fontSize: 32, fontWeight: '800' },
  scrollContent: { paddingBottom: 30, gap: 24 },
  
  mainCard: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  mainCardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  iconBox: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  propertyName: { fontSize: 22, fontWeight: '700', color: colors.onBackground },
  unitInfo: { fontSize: 14, color: colors.onSurfaceVariant, marginTop: 4 },
  
  statsGrid: { flexDirection: 'row', gap: 16 },
  statBox: { flex: 1, backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 16 },
  statusBox: { flex: 1, backgroundColor: 'rgba(0,102,119,0.05)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(0,76,90,0.1)' },
  statLabel: { fontSize: 12, fontWeight: '600', color: colors.onSurfaceVariant, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.primary },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusBadgeText: { color: colors.onPrimary, fontSize: 12, fontWeight: '600', letterSpacing: 1 },

  leaseDetailsCard: {
    backgroundColor: colors.inverseSurface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  leaseTitle: { color: colors.inverseOnSurface, fontSize: 22, fontWeight: '700', marginBottom: 20 },
  leaseRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  leaseLabel: { color: colors.outlineVariant, fontSize: 12, fontWeight: '600', marginBottom: 2 },
  leaseValue: { color: '#ffffff', fontSize: 16, fontWeight: '400' },
  leaseBtn: { backgroundColor: colors.primaryContainer, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 8 },
  leaseBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  leaseSignedText: { color: colors.outlineVariant, fontSize: 12, textAlign: 'center', marginTop: 12 },

  sectionHeader: { marginTop: 8 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: colors.onBackground },
  
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  amenityCard: { width: '47%', backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(190, 200, 203, 0.3)' },
  amenityIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.secondaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  amenityText: { fontSize: 14, fontWeight: '600', color: colors.onBackground, textAlign: 'center' }
});
