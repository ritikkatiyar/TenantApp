import { useState } from 'react';
import { Alert } from 'react-native';
import { logger } from '@/src/utils/logger';
import { createAnnouncement } from '@/src/features/announcements/api/announcement.api';
import type { PropertyResponse } from '@/src/types/property';

interface UseCommandCenterProps {
  accessToken: string | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  deleteProperty: (id: string) => Promise<void>;
  togglePropertyActive: (id: string, active: boolean) => Promise<void>;
}

export function useCommandCenter({
  accessToken,
  showToast,
  deleteProperty,
  togglePropertyActive
}: UseCommandCenterProps) {
  const [resetTriggers, setResetTriggers] = useState<Record<string, number>>({});

  const triggerReset = (propertyId: string) => {
    setResetTriggers(prev => ({
      ...prev,
      [propertyId]: (prev[propertyId] || 0) + 1
    }));
  };

  const [layoutViewerPropertyId, setLayoutViewerPropertyId] = useState<string | null>(null);
  const [layoutViewerFloorNumber, setLayoutViewerFloorNumber] = useState<number | null>(null);

  const handleFloorClick = (propertyId: string, floorNum: number) => {
    setLayoutViewerPropertyId(propertyId);
    setLayoutViewerFloorNumber(floorNum);
  };

  const [selectedPropertyForBroadcast, setSelectedPropertyForBroadcast] = useState<PropertyResponse | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState<'GENERAL' | 'MAINTENANCE' | 'EMERGENCY' | 'BILLING' | 'EVENT'>('GENERAL');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('INFO');
  const [broadcastTargetType, setBroadcastTargetType] = useState<'PROPERTY' | 'FLOOR' | 'UNIT'>('PROPERTY');
  const [broadcastTargetValue, setBroadcastTargetValue] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const handleSendBroadcast = async () => {
    logger.debug('[Broadcast] handleSendBroadcast called');
    logger.debug('[Broadcast] selectedProperty:', selectedPropertyForBroadcast?.id, 'hasToken:', !!accessToken);
    
    if (!selectedPropertyForBroadcast || !accessToken) {
      logger.warn('[Broadcast] Early return: no property or token');
      return;
    }
    
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      logger.warn('[Broadcast] Early return: title or content missing');
      Alert.alert('Validation', 'Title and Content are required.');
      return;
    }

    logger.debug('[Broadcast] Validation passed, starting send...');
    setSendingBroadcast(true);
    try {
      let targetFloorNumber: number | null = null;
      let targetUnitId: string | null = null;

      if (broadcastTargetType === 'FLOOR') {
        const parsedFloor = parseInt(broadcastTargetValue.trim(), 10);
        if (isNaN(parsedFloor)) {
          Alert.alert('Validation', 'Please enter a valid floor number.');
          return;
        }
        targetFloorNumber = parsedFloor;
      } else if (broadcastTargetType === 'UNIT') {
        targetUnitId = broadcastTargetValue.trim();
      }

      const payload = {
        propertyId: selectedPropertyForBroadcast.id,
        title: broadcastTitle,
        content: broadcastContent,
        category: broadcastCategory,
        severity: broadcastSeverity,
        targetType: broadcastTargetType,
        targetFloorNumber,
        targetUnitId,
      };
      logger.debug('[Broadcast] Payload:', payload);
      logger.debug('[Broadcast] Calling createAnnouncement...');
      
      await createAnnouncement(accessToken, payload);

      logger.info('[Broadcast] Success!');
      Alert.alert('Success', 'Announcement broadcasted successfully!');
      
      setBroadcastTitle('');
      setBroadcastContent('');
      setBroadcastCategory('GENERAL');
      setBroadcastSeverity('INFO');
      setBroadcastTargetType('PROPERTY');
      setBroadcastTargetValue('');
      setSelectedPropertyForBroadcast(null);
    } catch (err: any) {
      logger.error('[Broadcast] Error:', err);
      Alert.alert('Error', err.message || 'Failed to send broadcast');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleDeleteProperty = (propertyId: string, propertyName: string) => {
    Alert.alert(
      "Delete Property",
      `Are you sure you want to delete ${propertyName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProperty(propertyId);
              showToast(`Property "${propertyName}" deleted successfully.`, "success");
            } catch (error) {
              showToast((error as Error).message, "error");
            }
          }
        }
      ]
    );
  };

  return {
    resetTriggers,
    triggerReset,
    layoutViewerPropertyId,
    layoutViewerFloorNumber,
    setLayoutViewerPropertyId,
    setLayoutViewerFloorNumber,
    handleFloorClick,
    selectedPropertyForBroadcast,
    setSelectedPropertyForBroadcast,
    broadcastTitle,
    setBroadcastTitle,
    broadcastContent,
    setBroadcastContent,
    broadcastCategory,
    setBroadcastCategory,
    broadcastSeverity,
    setBroadcastSeverity,
    broadcastTargetType,
    setBroadcastTargetType,
    broadcastTargetValue,
    setBroadcastTargetValue,
    sendingBroadcast,
    handleSendBroadcast,
    handleDeleteProperty,
  };
}
