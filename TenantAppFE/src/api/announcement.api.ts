import { apiRequest } from './client';

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
  return apiRequest<Announcement[]>(`/api/v1/announcements${query}`, {
    method: 'GET',
    token,
  });
}

export function markAnnouncementRead(token: string, id: string): Promise<void> {
  return apiRequest<void>(`/api/v1/announcements/${id}/read`, {
    method: 'POST',
    token,
  });
}

export function createAnnouncement(\n  token: string,\n  body: {\n    propertyId: string;\n    title: string;\n    content: string;\n    category: string;\n    severity: string;\n    targetType: string;\n    targetValue?: string;\n    metadata?: string;\n  }\n): Promise<Announcement> {\n  console.log('[Announcement API] createAnnouncement called with:', body);\n  return apiRequest<Announcement>('/api/v1/announcements', {\n    method: 'POST',\n    token,\n    body: JSON.stringify(body),\n  })\n    .then((result) => {\n      console.log('[Announcement API] Success:', result);\n      return result;\n    })\n    .catch((error) => {\n      console.error('[Announcement API] Error:', error);\n      throw error;\n    });\n}
