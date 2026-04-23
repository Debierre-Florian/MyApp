import { useMemo } from 'react';
import { useHistorique, HistoriqueEntry } from './useHistorique';
import { Recipe } from '../services/api';

export interface RatingsContext {
  likedRecipes: Recipe[];   // note >= 4
  dislikedRecipes: Recipe[]; // note <= 2
  likedIngredients: string[];
  dislikedIngredients: string[];
}

export function useRatings(): RatingsContext {
  const { historique } = useHistorique();

  return useMemo(() => {
    const liked = historique.filter((e: HistoriqueEntry) => e.rating !== undefined && e.rating >= 4);
    const disliked = historique.filter((e: HistoriqueEntry) => e.rating !== undefined && e.rating <= 2);

    const likedIngredients = Array.from(
      new Set(liked.flatMap((e) => e.recipe.ingredients))
    );
    const dislikedIngredients = Array.from(
      new Set(disliked.flatMap((e) => e.recipe.ingredients))
    );

    return {
      likedRecipes: liked.map((e) => e.recipe),
      dislikedRecipes: disliked.map((e) => e.recipe),
      likedIngredients,
      dislikedIngredients,
    };
  }, [historique]);
}
