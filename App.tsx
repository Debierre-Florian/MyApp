import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navigator from './app/navigator';
import { ProfilsProvider } from './hooks/useProfils';

const ONBOARDING_KEY = 'hasSeenOnboarding';

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Main' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setInitialRoute(value === 'true' ? 'Main' : 'Onboarding');
    });
  }, []);

  if (!initialRoute) return null;

  return (
    <ProfilsProvider>
      <Navigator initialRoute={initialRoute} />
    </ProfilsProvider>
  );
}
