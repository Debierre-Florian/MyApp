import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navigator from './app/navigator';

const ONBOARDING_KEY = 'hasSeenOnboarding';

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Home' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setInitialRoute(value === 'true' ? 'Home' : 'Onboarding');
    });
  }, []);

  if (!initialRoute) return null;

  return <Navigator initialRoute={initialRoute} />;
}
