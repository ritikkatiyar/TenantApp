import { useQuery } from '@tanstack/react-query';
import { getMyContext } from '@/src/features/auth/api/me.api';
import { getAnnouncements, Announcement } from '@/src/features/announcements/api/announcement.api';

export function useResidentContext(token: string) {
  return useQuery({
    queryKey: ['residentContext', token],
    queryFn: async () => {
      if (!token) return { activeLeases: [] };
      return getMyContext(token);
    },
    enabled: !!token,
  });
}

export function useAnnouncements(token: string) {
  return useQuery<Announcement[], Error>({
    queryKey: ['announcements', token],
    queryFn: async () => {
      if (!token) return [];
      return getAnnouncements(token);
    },
    enabled: !!token,
  });
}
