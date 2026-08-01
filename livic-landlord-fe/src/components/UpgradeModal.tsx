import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type UpgradeModalProps = {
  visible: boolean;
  featureName?: string;
  currentPlan?: string;
  message?: string;
  onClose: () => void;
};

export default function UpgradeModal({
  visible,
  featureName = 'this feature',
  currentPlan = 'STARTER',
  message,
  onClose,
}: UpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/billing');
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        <View style={styles.modalCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles" size={32} color="#00e0ff" />
          </View>

          <Text style={styles.title}>UPGRADE REQUIRED</Text>
          <Text style={styles.subtitle}>
            {message || `Your current ${currentPlan} plan does not include ${featureName}. Upgrade your subscription to unlock unlimited access!`}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>Active: {currentPlan}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
            <MaterialIcons name="arrow-upward" size={18} color="#001e2b" />
            <Text style={styles.upgradeBtnText}>VIEW SUBSCRIPTION PLANS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 28,
    backgroundColor: '#0b1c30',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 224, 255, 0.4)',
    alignItems: 'center',
    shadowColor: '#00e0ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 224, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  badgeRow: {
    marginBottom: 20,
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  planBadgeText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  upgradeBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#00e0ff',
    marginBottom: 10,
  },
  upgradeBtnText: {
    color: '#001e2b',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeBtn: {
    paddingVertical: 10,
  },
  closeBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
});
