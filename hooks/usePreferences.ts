import { useCallback } from 'react';
import { useProfils } from './useProfils';

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

// ─── Defaults & options ───────────────────────────────────────────────────────

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePreferences() {
  const { activeProfil, updateActiveProfil, loading } = useProfils();

  const preferences: UserPreferences = {
    firstName: activeProfil.firstName,
    diet: activeProfil.diet,
    allergies: activeProfil.allergies,
    favoriteIngredients: activeProfil.favoriteIngredients,
    dislikedIngredients: activeProfil.dislikedIngredients,
  };

  // No-op: state is managed by ProfilsContext
  const reload = useCallback(async () => {}, []);

  const updatePreferences = useCallback(
    (patch: Partial<UserPreferences>) => {
      updateActiveProfil(patch);
    },
    [updateActiveProfil]
  );

  const toggleAllergy = useCallback(
    (allergy: AllergyType) => {
      const has = activeProfil.allergies.includes(allergy);
      updateActiveProfil({
        allergies: has
          ? activeProfil.allergies.filter((a) => a !== allergy)
          : [...activeProfil.allergies, allergy],
      });
    },
    [activeProfil.allergies, updateActiveProfil]
  );

  const addFavorite = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (activeProfil.favoriteIngredients.some((i) => i.toLowerCase() === trimmed.toLowerCase()))
        return;
      updateActiveProfil({
        favoriteIngredients: [...activeProfil.favoriteIngredients, trimmed],
      });
    },
    [activeProfil.favoriteIngredients, updateActiveProfil]
  );

  const removeFavorite = useCallback(
    (name: string) => {
      updateActiveProfil({
        favoriteIngredients: activeProfil.favoriteIngredients.filter((i) => i !== name),
      });
    },
    [activeProfil.favoriteIngredients, updateActiveProfil]
  );

  const addDisliked = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (activeProfil.dislikedIngredients.some((i) => i.toLowerCase() === trimmed.toLowerCase()))
        return;
      updateActiveProfil({
        dislikedIngredients: [...activeProfil.dislikedIngredients, trimmed],
      });
    },
    [activeProfil.dislikedIngredients, updateActiveProfil]
  );

  const removeDisliked = useCallback(
    (name: string) => {
      updateActiveProfil({
        dislikedIngredients: activeProfil.dislikedIngredients.filter((i) => i !== name),
      });
    },
    [activeProfil.dislikedIngredients, updateActiveProfil]
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
