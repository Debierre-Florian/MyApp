import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PlanId = 'gratuit' | 'essentiel' | 'premium';

const KEY = '@abonnement_plan';

export function useAbonnement() {
  const [plan, setPlan] = useState<PlanId>('gratuit');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'essentiel' || v === 'premium') setPlan(v);
    });
  }, []);

  const savePlan = useCallback(async (newPlan: PlanId) => {
    await AsyncStorage.setItem(KEY, newPlan);
    setPlan(newPlan);
  }, []);

  return { plan, savePlan };
}
