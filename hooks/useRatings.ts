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
  const [applyRatings, setApplyRatingsState] = useState<boolean>(true);

  useEffect(() => {
    AsyncStorage.getItem(RATINGS_APPLY_KEY).then((raw) => {
      if (raw !== null) setApplyRatingsState(raw === 'true');
    });
  }, []);

  const setApplyRatings = useCallback(async (value: boolean) => {
    setApplyRatingsState(value);
    await AsyncStorage.setItem(RATINGS_APPLY_KEY, String(value));
  }, []);

  return useMemo(() => {
    const liked = historique.filter((e: HistoriqueEntry) => e.rating !== undefined && e.rating >= 4);
    const disliked = historique.filter((e: HistoriqueEntry) => e.rating !== undefined && e.rating <= 2);

    const likedIngredientsRaw = Array.from(new Set(liked.flatMap((e) => e.recipe.ingredients)));
    const dislikedIngredientsRaw = Array.from(new Set(disliked.flatMap((e) => e.recipe.ingredients)));

    return {
      likedRecipes: applyRatings ? liked.map((e) => e.recipe) : [],
      dislikedRecipes: applyRatings ? disliked.map((e) => e.recipe) : [],
      likedIngredients: applyRatings ? likedIngredientsRaw : [],
      dislikedIngredients: applyRatings ? dislikedIngredientsRaw : [],
      likedIngredientsRaw,
      dislikedIngredientsRaw,
      applyRatings,
      setApplyRatings,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historique, applyRatings]);
}
