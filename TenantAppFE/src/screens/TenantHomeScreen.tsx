import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { ActiveLeaseSummary, getMyContext } from '../api/me.api';

interface TenantHomeScreenProps {
  token: string;
  onLogout: () => void;
}

export default function TenantHomeScreen({ token, onLogout }: TenantHomeScreenProps) {
  const [lease, setLease] = useState<ActiveLeaseSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getMyContext(token)
      .then((context) => {
        if (isMounted) {
          setLease(context.activeLeases[0] || null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <LinearGradient colors={['#f4fbfa', '#eef6ff']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>MY PROPERTY</Text>
            <Text style={styles.title}>My Home</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
            <MaterialIcons name="logout" size={22} color="#264346" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#006875" />
          </View>
        ) : lease ? (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <MaterialIcons name="home-work" size={28} color="#006875" />
              <View>
                <Text style={styles.propertyName}>{lease.propertyName}</Text>
                <Text style={styles.muted}>Unit {lease.unitNumber}</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Monthly Rent</Text>
                <Text style={styles.metricValue}>₹{lease.rentAmount}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Status</Text>
                <Text style={styles.metricValue}>{lease.status}</Text>
              </View>
            </View>

            <View style={styles.placeholder}>
              <Text style={styles.placeholderTitle}>Rent cycles coming next</Text>
              <Text style={styles.placeholderText}>This screen is ready to host rent, notices, complaints, and payment history.</Text>
            </View>
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.propertyName}>No active home yet</Text>
            <Text style={styles.muted}>Your tenant dashboard will appear here after a landlord assigns you to a unit.</Text>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  kicker: {
    color: '#006875',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: '#163235',
    fontSize: 34,
    fontWeight: '800',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#d9e7e8',
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  panel: {
    backgroundColor: '#fff',
    borderColor: '#dcebed',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  propertyName: {
    color: '#173336',
    fontSize: 20,
    fontWeight: '800',
  },
  muted: {
    color: '#6b7a7d',
    fontSize: 14,
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metric: {
    backgroundColor: '#f3faf9',
    borderRadius: 8,
    flex: 1,
    padding: 14,
  },
  metricLabel: {
    color: '#6b7a7d',
    fontSize: 12,
    fontWeight: '700',
  },
  metricValue: {
    color: '#006875',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  placeholder: {
    borderColor: '#dcebed',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
    padding: 14,
  },
  placeholderTitle: {
    color: '#173336',
    fontSize: 16,
    fontWeight: '800',
  },
  placeholderText: {
    color: '#66787b',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
});
