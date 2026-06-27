import { useRouter } from 'expo-router';
import { useState } from 'react';
import ModeSelectionScreen from '@/src/features/auth/screens/ModeSelectionScreen';
import { savePreference } from '@/src/features/auth/api/user-preference.api';
import { useAuth } from '@/src/features/auth/context/AuthProvider';

export default function ModeSelectionRoute() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectMode = async (mode: string) => {
    if (!accessToken) return;
    
    setIsLoading(true);
    try {
      await savePreference(accessToken, mode);
      // After successfully saving the preference, navigate to the Command Center (Landlord Dashboard)
      router.replace('/command-center');
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  return (
    <ModeSelectionScreen
      onSelectMode={handleSelectMode}
      isLoading={isLoading}
    />
  );
}
