import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { useResponsive } from '@/hooks/useResponsive';
import { getActiveLease, LeaseResponse } from '@/src/features/tenant/api/lease.api';
import { Theme } from '@/src/theme/Theme';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';

interface TenantPropertyScreenProps {
  token: string;
  onLogout: () => void;
}

export default function TenantPropertyScreen({ token, onLogout }: TenantPropertyScreenProps) {
  const { isDesktop } = useResponsive();
  const { handleScroll } = useScrollNav();
  const [lease, setLease] = useState<LeaseResponse | null>(null);
  const [showLeaseModal, setShowLeaseModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getActiveLease(token)
      .then((data) => {
        if (isMounted && data) setLease(data);
      })
      .catch((err) => console.error('[TenantProperty]', err));
    return () => { isMounted = false; };
  }, [token]);

  return (
    <LinearGradient
      colors={Theme.Colors.backgroundGradient as [string, string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea} edges={isDesktop ? ['top'] : []}>
        {isDesktop && <DesktopNavBar title="My Unit & Property Lease" />}

        <ScrollView 
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.scrollContent, isDesktop ? styles.scrollContentDesktop : { paddingTop: 88 }]}
        >
          {/* Main Unit Card */}
          <BlurView intensity={70} tint="light" style={styles.glassCard}>
            <View style={styles.mainCardHeaderRow}>
              <View style={styles.iconBox}>
                <MaterialIcons name="apartment" size={30} color={Theme.Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.propertyName}>{lease?.propertyName || 'Assigned Residence'}</Text>
                <Text style={styles.unitInfo}>{lease?.unitId ? `Unit ID: ${lease.unitId.substring(0, 8)}` : 'Unit Lease Linked'} • Active</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{lease?.status || 'ACTIVE'}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Monthly Rent</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={styles.statValue}>{lease?.monthlyRentAmount ? `₹${lease.monthlyRentAmount.toLocaleString()}` : 'N/A'}</Text>
                  <Text style={styles.statSubLabel}> / month</Text>
                </View>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Security Deposit</Text>
                <Text style={[styles.statValue, { color: Theme.Colors.primary }]}>{lease?.securityDeposit ? `₹${lease.securityDeposit.toLocaleString()}` : 'N/A'}</Text>
              </View>
            </View>
          </BlurView>

          {/* Lease Contract Card */}
          <BlurView intensity={70} tint="light" style={styles.darkLeaseCard}>
            <View style={styles.leaseHeaderRow}>
              <Text style={styles.leaseTitle}>Lease Agreement Details</Text>
              <MaterialIcons name="gavel" size={24} color={Theme.Colors.primaryContainer} />
            </View>
            
            <View style={styles.leaseGrid}>
              <View style={styles.leaseRow}>
                <MaterialIcons name="calendar-today" size={22} color={Theme.Colors.primaryFixed} />
                <View style={{ marginLeft: 14 }}>
                  <Text style={styles.leaseLabel}>Move-In Date</Text>
                  <Text style={styles.leaseValue}>{lease?.moveInDate || 'On File'}</Text>
                </View>
              </View>
              
              <View style={styles.leaseRow}>
                <MaterialIcons name="event-busy" size={22} color={Theme.Colors.primaryFixed} />
                <View style={{ marginLeft: 14 }}>
                  <Text style={styles.leaseLabel}>Move-Out Date</Text>
                  <Text style={styles.leaseValue}>{lease?.moveOutDate || 'On File'}</Text>
                </View>
              </View>

              <View style={styles.leaseRow}>
                <MaterialIcons name="verified-user" size={22} color={Theme.Colors.primaryFixed} />
                <View style={{ marginLeft: 14 }}>
                  <Text style={styles.leaseLabel}>Escrow Protection</Text>
                  <Text style={styles.leaseValue}>Verified & Locked</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => setShowLeaseModal(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#00e0ff', '#0070ea']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.leaseBtn}
              >
                <MaterialIcons name="description" size={20} color="#fff" />
                <Text style={styles.leaseBtnText}>View Digital Lease Contract</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.leaseSignedText}>Digitally Signed & Timestamped on Record</Text>
          </BlurView>

          {/* Property Amenities Grid */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Included Property Amenities</Text>
            <Text style={styles.sectionSub}>Available 24/7 for all building occupants</Text>
          </View>
          
          <View style={styles.amenitiesGrid}>
            <BlurView intensity={60} tint="light" style={styles.amenityCard}>
              <View style={styles.amenityIconBox}>
                <MaterialIcons name="wifi" size={24} color={Theme.Colors.primary} />
              </View>
              <Text style={styles.amenityTitle}>High-speed Fiber Wi-Fi</Text>
              <Text style={styles.amenitySub}>1 Gbps Unlimited</Text>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.amenityCard}>
              <View style={styles.amenityIconBox}>
                <MaterialIcons name="pool" size={24} color={Theme.Colors.primary} />
              </View>
              <Text style={styles.amenityTitle}>Rooftop Pool</Text>
              <Text style={styles.amenitySub}>Temperature Controlled</Text>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.amenityCard}>
              <View style={styles.amenityIconBox}>
                <MaterialIcons name="local-parking" size={24} color={Theme.Colors.primary} />
              </View>
              <Text style={styles.amenityTitle}>Covered Parking</Text>
              <Text style={styles.amenitySub}>Assigned Slot #B2</Text>
            </BlurView>

            <BlurView intensity={60} tint="light" style={styles.amenityCard}>
              <View style={styles.amenityIconBox}>
                <MaterialIcons name="fitness-center" size={24} color={Theme.Colors.primary} />
              </View>
              <Text style={styles.amenityTitle}>24/7 Fitness Center</Text>
              <Text style={styles.amenitySub}>Cardio & Free Weights</Text>
            </BlurView>
          </View>
        </ScrollView>

        {/* Digital Lease Contract Modal */}
        {showLeaseModal && (
          <Modal transparent visible={true} animationType="slide" onRequestClose={() => setShowLeaseModal(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Digital Lease Contract</Text>
                  <TouchableOpacity onPress={() => setShowLeaseModal(false)}>
                    <MaterialIcons name="close" size={24} color={Theme.Colors.onBackground} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 320 }}>
                  <Text style={styles.modalContractTitle}>RESIDENTIAL TENANCY LEASE AGREEMENT</Text>
                  <Text style={styles.modalContractText}>
                    This Residential Lease Agreement (&quot;Agreement&quot;) is executed between Property Owner and Tenant for Unit {lease?.unitId?.substring(0, 8) || '101'}.
                    {"\n\n"}
                    1. RENT & FEES: The monthly rent of ₹{lease?.monthlyRentAmount?.toLocaleString() || '10,000'} is due on or before the 5th of each calendar month.
                    {"\n\n"}
                    2. SECURITY DEPOSIT: The security deposit of ₹{lease?.securityDeposit?.toLocaleString() || '30,000'} is held securely and refundable upon lease expiration subject to unit inspection.
                    {"\n\n"}
                    3. MAINTENANCE: Tenant agrees to report all maintenance or structural defects promptly via the Tenant Portal.
                  </Text>
                </ScrollView>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowLeaseModal(false)}>
                  <Text style={styles.modalCloseBtnText}>Close Agreement Viewer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },
  scrollContentDesktop: { paddingTop: 20 },
  
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: Theme.Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    overflow: 'hidden'
  },
  mainCardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  iconBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(0, 104, 117, 0.1)', alignItems: 'center', justifyContent: 'center' },
  propertyName: { fontSize: 22, fontWeight: '800', color: Theme.Colors.onBackground },
  unitInfo: { fontSize: 14, color: Theme.Colors.onSurfaceVariant, marginTop: 2 },
  statusBadge: { backgroundColor: 'rgba(0, 104, 117, 0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusBadgeText: { color: Theme.Colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  
  statsGrid: { flexDirection: 'row', gap: 14 },
  statBox: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.9)' },
  statLabel: { fontSize: 12, fontWeight: '700', color: Theme.Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  statSubLabel: { fontSize: 12, color: Theme.Colors.onSurfaceVariant },
  statValue: { fontSize: 22, fontWeight: '800', color: Theme.Colors.onBackground },

  darkLeaseCard: {
    backgroundColor: Theme.Colors.inverseSurface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 6,
    overflow: 'hidden'
  },
  leaseHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  leaseTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  leaseGrid: { gap: 16, marginBottom: 20 },
  leaseRow: { flexDirection: 'row', alignItems: 'center' },
  leaseLabel: { color: Theme.Colors.outlineVariant, fontSize: 12, fontWeight: '600', marginBottom: 2 },
  leaseValue: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  leaseBtn: { paddingVertical: 14, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  leaseBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  leaseSignedText: { color: Theme.Colors.outlineVariant, fontSize: 12, textAlign: 'center', marginTop: 12 },

  sectionHeader: { marginTop: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Theme.Colors.onBackground },
  sectionSub: { fontSize: 13, color: Theme.Colors.onSurfaceVariant, marginTop: 2 },
  
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  amenityCard: { width: '47.8%', backgroundColor: 'rgba(255, 255, 255, 0.65)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.8)', overflow: 'hidden' },
  amenityIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0, 104, 117, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  amenityTitle: { fontSize: 14, fontWeight: '800', color: Theme.Colors.onBackground },
  amenitySub: { fontSize: 12, color: Theme.Colors.onSurfaceVariant, marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 28, 48, 0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Theme.Colors.onBackground },
  modalContractTitle: { fontSize: 15, fontWeight: '800', color: Theme.Colors.primary, marginBottom: 12 },
  modalContractText: { fontSize: 14, color: Theme.Colors.onSurfaceVariant, lineHeight: 22 },
  modalCloseBtn: { backgroundColor: Theme.Colors.primary, marginTop: 20, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalCloseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' }
});


