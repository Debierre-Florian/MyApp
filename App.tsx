import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigator from './app/navigator';

const ONBOARDING_KEY = 'hasSeenOnboarding';

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'MainTabs' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setInitialRoute(value === 'true' ? 'MainTabs' : 'Onboarding');
    });
  }, []);

  if (!initialRoute) return null;

  return (
    <SafeAreaProvider>
      <Navigator initialRoute={initialRoute as 'Onboarding' | 'MainTabs'} />
    </SafeAreaProvider>
  );
}
