import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

interface DesktopNavBarProps {
  onBack?: () => void;
  backText?: string;
  rightContent?: React.ReactNode;
  title?: string;
  activeTab?: string;
  hideTabs?: boolean;
}

export default function DesktopNavBar({ 
  onBack, 
  backText = 'Back',
  rightContent,
  title
}: DesktopNavBarProps) {
  const { user } = useAuth();
  const initial = user?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || 'A';

  return (
    <BlurView intensity={70} tint="light" style={styles.topbar}>
      {/* Left Area: Back Button or Page Title */}
      <View style={styles.topbarLeft}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButtonDesktop} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={20} color="#151d1e" />
            <Text style={styles.backButtonTextDesktop}>{backText}</Text>
          </TouchableOpacity>
        ) : title ? (
          <Text style={styles.pageTitle}>{title}</Text>
        ) : null}
      </View>

      {/* Right Area: Right Content (Search, notifications, etc.) + Avatar */}
      <View style={styles.topbarRight}>
        {rightContent}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  topbar: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#151d1e',
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  backButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  backButtonTextDesktop: {
    fontSize: 13,
    fontWeight: '700',
    color: '#151d1e',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#006875',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
