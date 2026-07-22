import { apiRequest } from '@/src/api/client';
import { logger } from '@/src/utils/logger';

export interface Announcement {
  id: string;
  propertyId: string;
  creatorId: string;
  creatorName: string;
  title: string;
  content: string;
  category: 'GENERAL' | 'MAINTENANCE' | 'EMERGENCY' | 'BILLING' | 'EVENT';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  targetType: 'PROPERTY' | 'FLOOR' | 'UNIT';
  targetValue?: string;
  metadata?: string;
  createdAt: string;
  read: boolean;
  readCount?: number;
  totalRecipientsCount?: number;
}

export function getAnnouncements(token: string, propertyId?: string): Promise<Announcement[]> {
  const query = propertyId ? `?propertyId=${propertyId}` : '';
  return apiRequest<any>(`/api/v1/announcements${query}`, {
    method: 'GET',
    token,
  }).then((res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.content)) return res.content;
    return [];
  });
}

export function markAnnouncementRead(token: string, id: string): Promise<void> {
  return apiRequest<void>(`/api/v1/announcements/${id}/read`, {
    method: 'POST',
    token,
  });
}

export function createAnnouncement(
  token: string,
  body: {
    propertyId: string;
    title: string;
    content: string;
    category: string;
    severity: string;
    targetType: string;
    targetValue?: string;
    metadata?: string;
  }
): Promise<Announcement> {
  logger.debug('[Announcement API] createAnnouncement called with:', body);
  return apiRequest<Announcement>('/api/v1/announcements', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  })
    .then((result) => {
      logger.info('[Announcement API] Success:', result);
      return result;
    })
    .catch((error) => {
      logger.error('[Announcement API] Error:', error);
      throw error;
    });
}
