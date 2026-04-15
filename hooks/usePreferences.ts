import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DietType = 'Omnivore' | 'Végétarien' | 'Végétalien' | 'Sans gluten' | 'Sans lactose';
export type AllergyType = 'Noix' | 'Fruits de mer' | 'Arachides' | 'Oeufs' | 'Soja';

export interface UserPreferences {
  firstName: string;
  diet: DietType;
  allergies: AllergyType[];
  favoriteIngredients: string[];
  dislikedIngredients: string[];
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_PREFERENCES: UserPreferences = {
  firstName: '',
  diet: 'Omnivore',
  allergies: [],
  favoriteIngredients: [],
  dislikedIngredients: [],
};

export const DIET_OPTIONS: DietType[] = [
  'Omnivore',
  'Végétarien',
  'Végétalien',
  'Sans gluten',
  'Sans lactose',
];

export const ALLERGY_OPTIONS: AllergyType[] = [
  'Noix',
  'Fruits de mer',
  'Arachides',
  'Oeufs',
  'Soja',
];

// ─── Storage key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = '@frigo_preferences';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as UserPreferences) });
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch {
      // silently ignore storage errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(async (prefs: UserPreferences) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // silently ignore storage errors
    }
  }, []);

  const updatePreferences = useCallback(
    (patch: Partial<UserPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const toggleAllergy = useCallback(
    (allergy: AllergyType) => {
      setPreferences((prev) => {
        const has = prev.allergies.includes(allergy);
        const next = {
          ...prev,
          allergies: has
            ? prev.allergies.filter((a) => a !== allergy)
            : [...prev.allergies, allergy],
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const addFavorite = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setPreferences((prev) => {
        if (prev.favoriteIngredients.some((i) => i.toLowerCase() === trimmed.toLowerCase()))
          return prev;
        const next = { ...prev, favoriteIngredients: [...prev.favoriteIngredients, trimmed] };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const removeFavorite = useCallback(
    (name: string) => {
      setPreferences((prev) => {
        const next = {
          ...prev,
          favoriteIngredients: prev.favoriteIngredients.filter((i) => i !== name),
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const addDisliked = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setPreferences((prev) => {
        if (prev.dislikedIngredients.some((i) => i.toLowerCase() === trimmed.toLowerCase()))
          return prev;
        const next = { ...prev, dislikedIngredients: [...prev.dislikedIngredients, trimmed] };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const removeDisliked = useCallback(
    (name: string) => {
      setPreferences((prev) => {
        const next = {
          ...prev,
          dislikedIngredients: prev.dislikedIngredients.filter((i) => i !== name),
        };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return {
    preferences,
    loading,
    reload,
    updatePreferences,
    toggleAllergy,
    addFavorite,
    removeFavorite,
    addDisliked,
    removeDisliked,
  };
}
