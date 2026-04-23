import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PlanId = 'gratuit' | 'essentiel' | 'premium';

const KEY = '@abonnement_plan';

export const PLAN_RANK: Record<PlanId, number> = {
  gratuit: 0,
  essentiel: 1,
  premium: 2,
};

export const PLAN_MAX_PROFILS: Record<PlanId, number> = {
  gratuit: 1,
  essentiel: 2,
  premium: 5,
};

export function useAbonnement() {
  const [plan, setPlan] = useState<PlanId>('gratuit');

  const reload = useCallback(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'essentiel' || v === 'premium' || v === 'gratuit') {
        setPlan(v as PlanId);
      }
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const savePlan = useCallback(async (newPlan: PlanId) => {
    await AsyncStorage.setItem(KEY, newPlan);
    setPlan(newPlan);
  }, []);

  const maxProfils = PLAN_MAX_PROFILS[plan];

  return { plan, savePlan, reload, maxProfils };
}
