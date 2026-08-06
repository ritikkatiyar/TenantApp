import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function QRScannerModal({ visible, onClose }: QRScannerModalProps) {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaStreamRef = useRef<any>(null);

  const laserAnim = useRef(new Animated.Value(0)).current;

  const startCamera = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        mediaStreamRef.current = stream;
        setHasPermission(true);
      } catch (err) {
        console.warn('Camera permission denied or camera unavailable:', err);
        setHasPermission(false);
      }
    } else {
      setHasPermission(true);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track: any) => track.stop());
      } catch (_e) {}
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setScannedData(null);
      startCamera();

      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 200,
            duration: 1800,
            useNativeDriver: false,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [visible]);

  const handleSimulateScan = (code: string) => {
    setScanned(true);
    setScannedData(code);

    setTimeout(() => {
      onClose();
      if (code.startsWith('/')) {
        router.push(code as any);
      } else {
        router.push('/tenant-home' as any);
      }
    }, 1200);
  };

  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.container}>
        <BlurView intensity={Platform.OS === 'ios' ? 80 : 95} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <MaterialIcons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            {Platform.OS === 'web' && (
              <video
                ref={(node) => {
                  if (node && mediaStreamRef.current) {
                    node.srcObject = mediaStreamRef.current;
                    node.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 24,
                }}
              />
            )}

            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {!scanned && (
              <Animated.View
                style={[
                  styles.laserLine,
                  {
                    transform: [{ translateY: laserAnim }],
                  },
                ]}
              />
            )}

            {scanned && (
              <View style={styles.scannedOverlay}>
                <MaterialIcons name="check-circle" size={48} color="#00E676" />
                <Text style={styles.scannedText}>Code Verified!</Text>
                <Text style={styles.scannedSubtext}>{scannedData}</Text>
              </View>
            )}
          </View>

          <Text style={styles.instructionText}>
            Align the QR code within the frame to automatically scan unit or payment details
          </Text>

          {hasPermission === false && (
            <TouchableOpacity style={styles.retryCameraBtn} onPress={startCamera} activeOpacity={0.8}>
              <MaterialIcons name="videocam" size={20} color="#ffffff" />
              <Text style={styles.retryCameraText}>Enable Camera Access</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.shortcutSection}>
          <Text style={styles.shortcutTitle}>Test Quick Scans:</Text>
          <View style={styles.shortcutRow}>
            <TouchableOpacity
              style={styles.shortcutChip}
              onPress={() => handleSimulateScan('/tenant-home')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="home" size={16} color="#00D8F6" />
              <Text style={styles.shortcutText}>My Unit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutChip}
              onPress={() => handleSimulateScan('/tenant-payments')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="payments" size={16} color="#00D8F6" />
              <Text style={styles.shortcutText}>Rent Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(5, 12, 18, 0.92)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderContainer: {
    alignItems: 'center',
    width: '100%',
  },
  viewfinder: {
    width: 250,
    height: 250,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#00D8F6',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  laserLine: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: '#00D8F6',
    borderRadius: 2,
    shadowColor: '#00D8F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  scannedOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(10, 25, 35, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scannedText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  scannedSubtext: {
    color: '#00D8F6',
    fontSize: 13,
    fontWeight: '600',
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
    maxWidth: 280,
    lineHeight: 18,
  },
  retryCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: 'rgba(0, 216, 246, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 246, 0.4)',
  },
  retryCameraText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  shortcutSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  shortcutTitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  shortcutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  shortcutText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
