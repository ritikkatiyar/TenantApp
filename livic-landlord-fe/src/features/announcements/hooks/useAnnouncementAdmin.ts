import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { createAnnouncement, getAnnouncements, Announcement } from '@/src/features/announcements/api/announcement.api';
import type { PropertyResponse } from '@/src/types/property';

interface UseAnnouncementAdminProps {
  accessToken: string | null;
  properties: PropertyResponse[];
  propertiesLoading: boolean;
}

export function useAnnouncementAdmin({
  accessToken,
  properties,
  propertiesLoading,
}: UseAnnouncementAdminProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [historyPropertyId, setHistoryPropertyId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState<'GENERAL' | 'MAINTENANCE' | 'EMERGENCY' | 'BILLING' | 'EVENT'>('GENERAL');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('INFO');
  const [broadcastTargetType, setBroadcastTargetType] = useState<'PROPERTY' | 'FLOOR' | 'UNIT'>('PROPERTY');
  const [broadcastTargetValue, setBroadcastTargetValue] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  useEffect(() => {
    if (properties.length && !properties.some((property) => property.id === selectedPropertyId)) {
      setSelectedPropertyId(properties[0].id);
    }
    if (properties.length && !properties.some((property) => property.id === historyPropertyId)) {
      setHistoryPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId, historyPropertyId]);

  const propertyMap = useMemo(
    () => new Map(properties.map((property) => [property.id, property.name])),
    [properties]
  );

  const activeHistoryPropertyName = useMemo(() => {
    if (!historyPropertyId) return 'No Property Selected';
    return propertyMap.get(historyPropertyId) || 'Unknown Property';
  }, [historyPropertyId, propertyMap]);

  const activeBroadcastPropertyName = useMemo(() => {
    if (!selectedPropertyId) return 'No Property Selected';
    return propertyMap.get(selectedPropertyId) || 'Selected Property';
  }, [selectedPropertyId, propertyMap]);

  const loadAnnouncements = useCallback(async () => {
    if (!accessToken || !historyPropertyId) {
      if (!propertiesLoading && properties.length === 0) {
        setLoadingAnnouncements(false);
      }
      return;
    }

    setLoadingAnnouncements(true);
    try {
      const data = await getAnnouncements(accessToken, historyPropertyId);
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[Announcements] Failed to load history:', error);
      Alert.alert('Error', 'Unable to load announcement history.');
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [accessToken, historyPropertyId, properties.length, propertiesLoading]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const resetComposer = () => {
    setBroadcastTitle('');
    setBroadcastContent('');
    setBroadcastCategory('GENERAL');
    setBroadcastSeverity('INFO');
    setBroadcastTargetType('PROPERTY');
    setBroadcastTargetValue('');
  };

  const handleSendBroadcast = async () => {
    if (!accessToken) {
      Alert.alert('Authentication', 'You must be signed in to send announcements.');
      return;
    }

    if (!selectedPropertyId) {
      Alert.alert('Property', 'Select a property before sending an announcement.');
      return;
    }

    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      Alert.alert('Validation', 'Title and content are required.');
      return;
    }

    if (broadcastTargetType !== 'PROPERTY' && !broadcastTargetValue.trim()) {
      Alert.alert('Validation', 'Please enter a target floor or unit value.');
      return;
    }

    setSendingBroadcast(true);
    try {
      await createAnnouncement(accessToken, {
        propertyId: selectedPropertyId,
        title: broadcastTitle.trim(),
        content: broadcastContent.trim(),
        category: broadcastCategory,
        severity: broadcastSeverity,
        targetType: broadcastTargetType,
        targetValue: broadcastTargetType !== 'PROPERTY' ? broadcastTargetValue.trim() : undefined,
      });

      Alert.alert('Success', 'Announcement broadcasted successfully.');
      resetComposer();
      await loadAnnouncements();
    } catch (error: any) {
      console.error('[Broadcast] Error sending announcement:', error);
      Alert.alert('Error', error?.message || 'Failed to send announcement.');
    } finally {
      setSendingBroadcast(false);
    }
  };

  return {
    selectedPropertyId,
    setSelectedPropertyId,
    historyPropertyId,
    setHistoryPropertyId,
    showHistory,
    setShowHistory,
    announcements,
    loadingAnnouncements,
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
    propertyMap,
    activeHistoryPropertyName,
    activeBroadcastPropertyName,
    loadAnnouncements
  };
}
