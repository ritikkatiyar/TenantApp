import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { verificationItems } from '@/src/features/inventory/mockInventoryData';
import { VerificationCard, SummaryLine } from './InventoryCardComponents';

interface InventoryMoveOutViewProps {
  isDesktop: boolean;
  securityDeposit: number;
  totalDeductions: number;
  netRefund: number;
}

const formatCurrency = (amount: number) =>
  `Rs. ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export function InventoryMoveOutView({
  isDesktop,
  securityDeposit,
  totalDeductions,
  netRefund,
}: InventoryMoveOutViewProps) {
  return (
    <View style={styles.sectionStack}>
      <BlurView intensity={35} tint="light" style={styles.moveBanner}>
        <LinearGradient
          colors={['rgba(220,38,38,0.8)', 'rgba(217,119,6,0.8)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.moveBannerContent}>
          <Text style={styles.moveBannerKicker}>MOVE-OUT INSPECTION</Text>
          <Text style={styles.moveBannerTitle}>Alex Rivera</Text>
          <Text style={styles.moveBannerMeta}>Lease #L-7142 · Unit 302-A · Move-out Jul 28, 2026</Text>
        </View>
        <View style={styles.moveOutDatePill}>
          <MaterialIcons name="event" size={16} color="#fff" />
          <Text style={styles.moveOutDateText}>Jul 28, 2026</Text>
        </View>
      </BlurView>

      <View style={[styles.workflowGrid, isDesktop && styles.workflowGridDesktop]}>
        <View style={styles.workflowMain}>
          {verificationItems.map(item => <VerificationCard key={item.id} item={item} />)}
        </View>

        <BlurView intensity={65} tint="light" style={styles.rail}>
          <View style={styles.railHeader}>
            <LinearGradient colors={['#dc2626', '#ef4444']} style={styles.railIconCircle}>
              <MaterialIcons name="receipt-long" size={18} color="#fff" />
            </LinearGradient>
            <Text style={styles.panelTitle}>Settlement</Text>
          </View>
          <View style={styles.railBody}>
            <SummaryLine label="Security Deposit"  value={formatCurrency(securityDeposit)} bold />
            <View style={styles.railDivider} />
            {verificationItems.filter(i => i.deduction > 0).map(i => (
              <SummaryLine key={i.id} label={i.name} value={`-${formatCurrency(i.deduction)}`} danger />
            ))}
            <SummaryLine label="Total Deductions" value={`-${formatCurrency(totalDeductions)}`} danger bold />
            <View style={styles.railDivider} />
          </View>
          <View style={styles.refundBlock}>
            <Text style={styles.refundLabel}>NET REFUND</Text>
            <Text style={styles.refundAmount}>{formatCurrency(netRefund)}</Text>
          </View>
          <TouchableOpacity style={styles.primaryWideBtn} activeOpacity={0.82}>
            <LinearGradient
              colors={['#059669', '#10b981']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.primaryWideBtnInner}
            >
              <Text style={styles.primaryWideBtnText}>Confirm & Settle</Text>
              <MaterialIcons name="send" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ghostWideBtn, styles.ghostWideBtnDanger]}>
            <Text style={[styles.ghostWideBtnText, { color: '#dc2626' }]}>Dispute Settlement</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionStack: { gap: 16 },
  moveBanner: { borderRadius: 22, overflow: 'hidden', minHeight: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22, gap: 16 },
  moveBannerContent: { flex: 1 },
  moveBannerKicker: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, fontFamily: 'Inter' },
  moveBannerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 4, fontFamily: 'Inter' },
  moveBannerMeta: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontFamily: 'Inter' },
  moveOutDatePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  moveOutDateText: { color: '#fff', fontWeight: '800', fontSize: 13, fontFamily: 'Inter' },
  workflowGrid: { gap: 14 },
  workflowGridDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  workflowMain: { flex: 1.9, gap: 12 },
  panelTitle: { fontSize: 18, fontWeight: '800', color: '#0b1c30', fontFamily: 'Inter' },
  rail: { flex: 1, minWidth: 260, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.35)', padding: 16, gap: 14, overflow: 'hidden' },
  railHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  railIconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  railBody: { gap: 10 },
  railDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginVertical: 2 },
  refundBlock: { backgroundColor: 'rgba(5,150,105,0.08)', borderRadius: 14, padding: 14, gap: 2, borderWidth: 1, borderColor: 'rgba(5,150,105,0.15)' },
  refundLabel: { fontSize: 10, fontWeight: '800', color: '#059669', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'Inter' },
  refundAmount: { fontSize: 30, fontWeight: '900', color: '#059669', fontFamily: 'Inter' },
  primaryWideBtn: { borderRadius: 14, overflow: 'hidden' },
  primaryWideBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  primaryWideBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', fontFamily: 'Inter' },
  ghostWideBtn: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', paddingVertical: 13, alignItems: 'center' },
  ghostWideBtnDanger: { borderColor: 'rgba(220,38,38,0.3)' },
  ghostWideBtnText: { fontSize: 13, fontWeight: '700', color: '#5b6b6d', fontFamily: 'Inter' },
});
