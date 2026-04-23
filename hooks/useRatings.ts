import { useMemo, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHistorique, HistoriqueEntry } from './useHistorique';
import { Recipe } from '../services/api';

const RATINGS_APPLY_KEY = '@ratings_apply_to_suggestions';

export interface RatingsContext {
  likedRecipes: Recipe[];
  dislikedRecipes: Recipe[];
  likedIngredients: string[];
  dislikedIngredients: string[];
  // ingrédients bruts indépendamment du toggle (pour l'affichage)
  likedIngredientsRaw: string[];
  dislikedIngredientsRaw: string[];
  applyRatings: boolean;
  setApplyRatings: (value: boolean) => void;
}

export function useRatings(): RatingsContext {
  const { historique } = useHistorique();
  // null = pas encore lu depuis AsyncStorage
  const [applyRatings, setApplyRatingsState] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(RATINGS_APPLY_KEY).then((raw) => {
      // absence de valeur sauvegardée = activé par défaut
      setApplyRatingsState(raw === null ? true : raw === 'true');
      console.log('[useRatings] toggle lu depuis AsyncStorage :', raw === null ? 'true (défaut)' : raw);
    });
  }, []);

  const setApplyRatings = useCallback(async (value: boolean) => {
    setApplyRatingsState(value);
    await AsyncStorage.setItem(RATINGS_APPLY_KEY, String(value));
    console.log('[useRatings] toggle mis à jour :', value);
  }, []);

  return useMemo(() => {
    const liked = historique.filter((e: HistoriqueEntry) => e.rating !== undefined && e.rating >= 4);
    const disliked = historique.filter((e: HistoriqueEntry) => e.rating !== undefined && e.rating <= 2);

    const likedIngredientsRaw = Array.from(new Set(liked.flatMap((e) => e.recipe.ingredients)));
    const dislikedIngredientsRaw = Array.from(new Set(disliked.flatMap((e) => e.recipe.ingredients)));

    // applyRatings null = AsyncStorage pas encore lu, on bloque en retournant []
    const apply = applyRatings === true;

    console.log('[useRatings] calcul favoris — applyRatings:', applyRatings, '→ apply:', apply,
      '| liked:', apply ? likedIngredientsRaw : [], '| disliked:', apply ? dislikedIngredientsRaw : []);

    return {
      likedRecipes: apply ? liked.map((e) => e.recipe) : [],
      dislikedRecipes: apply ? disliked.map((e) => e.recipe) : [],
      likedIngredients: apply ? likedIngredientsRaw : [],
      dislikedIngredients: apply ? dislikedIngredientsRaw : [],
      likedIngredientsRaw,
      dislikedIngredientsRaw,
      applyRatings: applyRatings ?? true,
      setApplyRatings,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historique, applyRatings]);
}
