import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import FloorListOverviewScreen from '@/src/features/properties/screens/FloorListOverviewScreen';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function FloorListOverviewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, isAuthenticated, isReady } = useAuth();

  if (isReady && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!id) {
    return <Redirect href="/command-center" />;
  }

  return (
    <FloorListOverviewScreen 
      propertyId={id}
      userToken={accessToken || ''}
      onBack={() => router.back()}
      onEditFloor={(floorNumber) => router.push(`/properties/${id}/floors/${floorNumber}`)}
    />
  );

}
