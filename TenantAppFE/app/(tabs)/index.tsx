import { View, StyleSheet } from 'react-native';
import { useState } from 'react';
import SuperAdminLoginScreen from '../../src/screens/SuperAdminLoginScreen';
import SuperAdminSignupScreen from '../../src/screens/SuperAdminSignupScreen';
import CommandCenterScreen from '../../src/screens/CommandCenterScreen';
import CreatePropertyScreen from '../../src/screens/CreatePropertyScreen';

export default function HomeScreen() {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login' | 'signup' | 'commandCenter' | 'createProperty'
  const [authData, setAuthData] = useState<any>(null);

  const navigateToCommandCenter = (data?: any) => {
    if (data) setAuthData(data);
    setCurrentScreen('commandCenter');
  };

  return (
    <View style={styles.container}>
      {currentScreen === 'commandCenter' && (
        <CommandCenterScreen 
          onNavigateToCreateProperty={() => setCurrentScreen('createProperty')}
        />
      )}

      {currentScreen === 'createProperty' && (
        <CreatePropertyScreen
          userToken={authData?.accessToken || ''}
          ownerId={authData?.user?.id || '3fa85f64-5717-4562-b3fc-2c963f66afa6'}
          onBack={() => setCurrentScreen('commandCenter')}
          onSaveAndConfigure={(propertyId, totalFloors) => {
            // Navigates back for now, can be updated when FloorEditor is wired up
            setCurrentScreen('commandCenter');
          }}
        />
      )}
      
      {currentScreen === 'login' && (
        <SuperAdminLoginScreen 
          onLogin={navigateToCommandCenter} 
          onNavigateToSignup={() => setCurrentScreen('signup')} 
        />
      )}

      {currentScreen === 'signup' && (
        <SuperAdminSignupScreen 
          onSignup={navigateToCommandCenter} 
          onNavigateToLogin={() => setCurrentScreen('login')} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});