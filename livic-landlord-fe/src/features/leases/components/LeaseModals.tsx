import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { LeaseResponse } from '@/src/features/tenant/api/lease.api';
import { UnitResponse } from '@/src/features/properties/api/unit.api';
import { useAppTheme } from '@/src/theme/ThemeContext';

// ── Modal shell ──────────────────────────────────────────────────────────────
function ModalShell({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const { theme } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
        {children}
      </View>
    </Modal>
  );
}

// ── Footer row shared by all modals ──────────────────────────────────────────
function ModalFooter({
  onCancel, onSubmit, submitLabel, submitIcon, submitColors, disabled,
}: {
  onCancel: () => void; onSubmit: () => void; submitLabel: string;
  submitIcon: string; submitColors: [string, string]; disabled?: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
        <Text style={[styles.cancelBtnText, { color: theme.Colors.onSurface }]}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSubmit} disabled={disabled} style={styles.submitBtn}>
        <LinearGradient colors={submitColors} style={styles.submitBtnInner}>
          <MaterialIcons name={submitIcon as any} size={18} color="#ffffff" />
          <Text style={styles.submitBtnText}>{submitLabel}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ── 1. Book Room Modal ───────────────────────────────────────────────────────
export function BookRoomModal({
  visible, onClose, availableUnits,
  bookingUnitId, setBookingUnitId,
  bookingTenantName, setBookingTenantName,
  bookingTenantPhone, setBookingTenantPhone,
  bookingTenantEmail, setBookingTenantEmail,
  bookingTokenAmount, setBookingTokenAmount,
  bookingExpectedMoveIn, setBookingExpectedMoveIn,
  onSubmit,
}: {
  visible: boolean; onClose: () => void; availableUnits: UnitResponse[];
  bookingUnitId: string; setBookingUnitId: (v: string) => void;
  bookingTenantName: string; setBookingTenantName: (v: string) => void;
  bookingTenantPhone: string; setBookingTenantPhone: (v: string) => void;
  bookingTenantEmail: string; setBookingTenantEmail: (v: string) => void;
  bookingTokenAmount: string; setBookingTokenAmount: (v: string) => void;
  bookingExpectedMoveIn: string; setBookingExpectedMoveIn: (v: string) => void;
  onSubmit: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <ModalShell visible={visible} onClose={onClose}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: theme.Colors.primary }]}>NEW RESERVATION</Text>
            <Text style={[styles.title, { color: theme.Colors.onSurface }]}>Book Room / Bed</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Select Available Unit *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {availableUnits.map((u) => {
                const sel = bookingUnitId === u.id;
                return (
                  <TouchableOpacity
                    key={u.id} onPress={() => setBookingUnitId(u.id)}
                    style={[styles.chip, sel && { borderColor: theme.Colors.primary, backgroundColor: `${theme.Colors.primary}12` }]}
                  >
                    <MaterialIcons name="meeting-room" size={14} color={sel ? theme.Colors.primary : theme.Colors.onSurfaceVariant} />
                    <Text style={[styles.chipText, { color: sel ? theme.Colors.primary : theme.Colors.onSurfaceVariant }]}>Unit {u.unitNumber}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Prospective Tenant Name *</Text>
          <TextInput value={bookingTenantName} onChangeText={setBookingTenantName} placeholder="e.g. Jordan Mitchell" placeholderTextColor={theme.Colors.onSurfaceVariant} style={[styles.input, { color: theme.Colors.onSurface, borderColor: `${theme.Colors.primary}30` }]} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Phone Number *</Text>
              <TextInput value={bookingTenantPhone} onChangeText={setBookingTenantPhone} placeholder="9876543210" placeholderTextColor={theme.Colors.onSurfaceVariant} keyboardType="phone-pad" style={[styles.input, { color: theme.Colors.onSurface, borderColor: `${theme.Colors.primary}30` }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Token Amount (₹) *</Text>
              <TextInput value={bookingTokenAmount} onChangeText={setBookingTokenAmount} placeholder="5000" placeholderTextColor={theme.Colors.onSurfaceVariant} keyboardType="numeric" style={[styles.input, { color: theme.Colors.onSurface, borderColor: `${theme.Colors.primary}30` }]} />
            </View>
          </View>
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Expected Move-In Date (YYYY-MM-DD) *</Text>
          <TextInput value={bookingExpectedMoveIn} onChangeText={setBookingExpectedMoveIn} placeholder="2026-09-01" placeholderTextColor={theme.Colors.onSurfaceVariant} style={[styles.input, { color: theme.Colors.onSurface, borderColor: `${theme.Colors.primary}30` }]} />
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Email Address (Optional)</Text>
          <TextInput value={bookingTenantEmail} onChangeText={setBookingTenantEmail} placeholder="tenant@example.com" placeholderTextColor={theme.Colors.onSurfaceVariant} keyboardType="email-address" style={[styles.input, { color: theme.Colors.onSurface, borderColor: `${theme.Colors.primary}30` }]} />
        </ScrollView>
        <ModalFooter onCancel={onClose} onSubmit={onSubmit} submitLabel="Confirm Booking" submitIcon="check" submitColors={[theme.Colors.primary, '#0072ff']} />
      </View>
    </ModalShell>
  );
}

// ── 2. Serve Notice Modal ────────────────────────────────────────────────────
export function ServeNoticeModal({ visible, onClose, noticeMoveOutDate, setNoticeMoveOutDate, onSubmit }: {
  visible: boolean; onClose: () => void; noticeMoveOutDate: string; setNoticeMoveOutDate: (v: string) => void; onSubmit: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <ModalShell visible={visible} onClose={onClose}>
      <View style={[styles.card, { maxWidth: 440 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: theme.Colors.error }]}>MOVE-OUT NOTICE</Text>
            <Text style={[styles.title, { color: theme.Colors.onSurface }]}>Serve Move-Out Notice</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} /></TouchableOpacity>
        </View>
        <View style={styles.body}>
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Expected Vacate Date (YYYY-MM-DD) *</Text>
          <TextInput value={noticeMoveOutDate} onChangeText={setNoticeMoveOutDate} placeholder="2026-09-30" placeholderTextColor={theme.Colors.onSurfaceVariant} style={[styles.input, { color: theme.Colors.onSurface, borderColor: `${theme.Colors.error}30` }]} />
        </View>
        <ModalFooter onCancel={onClose} onSubmit={onSubmit} submitLabel="Serve Notice" submitIcon="warning" submitColors={[theme.Colors.error, '#ef4444']} />
      </View>
    </ModalShell>
  );
}

// ── 3. Cash Token Modal ──────────────────────────────────────────────────────
export function CashTokenModal({ visible, onClose, cashAmount, setCashAmount, cashNote, setCashNote, onSubmit }: {
  visible: boolean; onClose: () => void; cashAmount: string; setCashAmount: (v: string) => void; cashNote: string; setCashNote: (v: string) => void; onSubmit: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <ModalShell visible={visible} onClose={onClose}>
      <View style={[styles.card, { maxWidth: 440 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: theme.Colors.primary }]}>TOKEN COLLECTION</Text>
            <Text style={[styles.title, { color: theme.Colors.onSurface }]}>Record Cash Payment</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} /></TouchableOpacity>
        </View>
        <View style={styles.body}>
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Amount Collected (₹) *</Text>
          <TextInput value={cashAmount} onChangeText={setCashAmount} placeholder="5000" placeholderTextColor={theme.Colors.onSurfaceVariant} keyboardType="numeric" style={[styles.input, { color: theme.Colors.onSurface, borderColor: `${theme.Colors.primary}30` }]} />
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Receipt / Payment Notes</Text>
          <TextInput value={cashNote} onChangeText={setCashNote} placeholder="Handed in person / receipt #123" placeholderTextColor={theme.Colors.onSurfaceVariant} style={[styles.input, { color: theme.Colors.onSurface, borderColor: `${theme.Colors.primary}30` }]} />
        </View>
        <ModalFooter onCancel={onClose} onSubmit={onSubmit} submitLabel="Record Payment" submitIcon="payments" submitColors={[theme.Colors.primary, '#0072ff']} />
      </View>
    </ModalShell>
  );
}

// ── 4. Convert Booking to Lease Modal ───────────────────────────────────────
export function ConvertToLeaseModal({ visible, onClose, convMonthlyRentAmount, setConvMonthlyRentAmount, convSecurityDeposit, setConvSecurityDeposit, onSubmit }: {
  visible: boolean; onClose: () => void;
  convMonthlyRentAmount: string; setConvMonthlyRentAmount: (v: string) => void;
  convSecurityDeposit: string; setConvSecurityDeposit: (v: string) => void;
  onSubmit: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <ModalShell visible={visible} onClose={onClose}>
      <View style={[styles.card, { maxWidth: 480 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: theme.Colors.primary }]}>LEASE ACTIVATION</Text>
            <Text style={[styles.title, { color: theme.Colors.onSurface }]}>Convert Booking to Active Lease</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} /></TouchableOpacity>
        </View>
        <View style={styles.body}>
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Monthly Rent Amount (₹) *</Text>
          <TextInput value={convMonthlyRentAmount} onChangeText={setConvMonthlyRentAmount} placeholder="25000" placeholderTextColor={theme.Colors.onSurfaceVariant} keyboardType="numeric" style={[styles.input, { color: theme.Colors.onSurface, borderColor: `${theme.Colors.primary}30` }]} />
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Security Deposit (₹) *</Text>
          <TextInput value={convSecurityDeposit} onChangeText={setConvSecurityDeposit} placeholder="50000" placeholderTextColor={theme.Colors.onSurfaceVariant} keyboardType="numeric" style={[styles.input, { color: theme.Colors.onSurface, borderColor: `${theme.Colors.primary}30` }]} />
        </View>
        <ModalFooter onCancel={onClose} onSubmit={onSubmit} submitLabel="Activate Lease" submitIcon="how-to-reg" submitColors={[theme.Colors.primary, '#10b981']} />
      </View>
    </ModalShell>
  );
}

// ── 5. Edit Lease Terms Modal ────────────────────────────────────────────────
export function EditLeaseTermsModal({ visible, onClose, editingLease, editRentAmount, setEditRentAmount, editSecurityDeposit, setEditSecurityDeposit, onSubmit, isSaving }: {
  visible: boolean; onClose: () => void; editingLease: LeaseResponse | null;
  editRentAmount: string; setEditRentAmount: (v: string) => void;
  editSecurityDeposit: string; setEditSecurityDeposit: (v: string) => void;
  onSubmit: () => void; isSaving: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <ModalShell visible={visible} onClose={onClose}>
      <View style={[styles.card, { maxWidth: 440 }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: theme.Colors.primary }]}>LEASE TERMS</Text>
            <Text style={[styles.title, { color: theme.Colors.onSurface }]}>Edit Rent & Deposit</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><MaterialIcons name="close" size={20} color={theme.Colors.onSurfaceVariant} /></TouchableOpacity>
        </View>
        <View style={styles.body}>
          {editingLease && (
            <View style={{ marginBottom: 14, padding: 12, backgroundColor: `${theme.Colors.primary}12`, borderRadius: 12, borderWidth: 1, borderColor: `${theme.Colors.primary}30` }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: theme.Colors.primary }}>
                Unit {editingLease.unitNumber} • {editingLease.tenantName || 'Tenant'}
              </Text>
              {editingLease.tenantPhone ? <Text style={{ fontSize: 12, color: theme.Colors.onSurfaceVariant, marginTop: 2 }}>{editingLease.tenantPhone}</Text> : null}
            </View>
          )}
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Monthly Rent Amount (₹) *</Text>
          <TextInput value={editRentAmount} onChangeText={setEditRentAmount} placeholder="e.g. 15000" placeholderTextColor={theme.Colors.onSurfaceVariant} keyboardType="numeric" style={[styles.input, { color: theme.Colors.onSurface, borderColor: `${theme.Colors.primary}30` }]} />
          <Text style={[styles.label, { color: theme.Colors.onSurface }]}>Security Deposit (₹) *</Text>
          <TextInput value={editSecurityDeposit} onChangeText={setEditSecurityDeposit} placeholder="e.g. 30000" placeholderTextColor={theme.Colors.onSurfaceVariant} keyboardType="numeric" style={[styles.input, { color: theme.Colors.onSurface, borderColor: `${theme.Colors.primary}30` }]} />
        </View>
        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelBtnText, { color: theme.Colors.onSurface }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSubmit} disabled={isSaving} style={styles.submitBtn}>
            <LinearGradient colors={[theme.Colors.primary, '#0072ff']} style={styles.submitBtnInner}>
              {isSaving ? <ActivityIndicator size="small" color="#ffffff" /> : (
                <>
                  <MaterialIcons name="check" size={18} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Save Terms</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 560, backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 20, paddingBottom: 12 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 },
  title: { fontSize: 20, fontWeight: '900' },
  closeBtn: { padding: 4 },
  body: { paddingHorizontal: 20, paddingBottom: 8, maxHeight: 420 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.8)' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.7)' },
  chipText: { fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row', gap: 12, padding: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },
  cancelBtnText: { fontSize: 14, fontWeight: '700' },
  submitBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  submitBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});
