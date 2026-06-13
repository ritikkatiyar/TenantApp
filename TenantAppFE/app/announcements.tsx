import { Redirect, useRouter } from 'expo-router';

import AnnouncementAdminScreen from '@/src/features/announcements/screens/AnnouncementAdminScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function AnnouncementsRoute() {
  const router = useRouter();
  const { isAuthenticated, isReady, signOut } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <AnnouncementAdminScreen
      onLogout={async () => {
        await signOut();
        router.replace('/login');
      }}
    />
  );
}
