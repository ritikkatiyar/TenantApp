import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export function RoleToggle() {
  const { context } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!context || !context.isLandlord || !context.isTenant) {
    return null; // Only show if user has both roles
  }

  const isOwnerView = pathname.includes('command-center');

  const handleToggle = () => {
    if (isOwnerView) {
      router.replace('/tenant-home');
    } else {
      router.replace('/command-center');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, isOwnerView ? styles.ownerContainer : styles.tenantContainer]}
      onPress={handleToggle}
    >
      <Text style={[styles.text, isOwnerView ? styles.ownerText : styles.tenantText]}>
        {isOwnerView ? 'Owner View' : 'Tenant View'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginLeft: 10,
  },
  ownerContainer: {
    backgroundColor: '#008080', // Teal
    borderColor: '#008080',
  },
  tenantContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CCCCCC',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  ownerText: {
    color: '#FFFFFF',
  },
  tenantText: {
    color: '#333333',
  },
});
