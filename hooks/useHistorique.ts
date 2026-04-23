import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HistoriqueEntry {
  recipe: Recipe;
  viewedAt: string; // ISO date string
  rating?: number;  // 1 à 5 étoiles
  comment?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@historique_consulted';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHistorique() {
  const [historique, setHistorique] = useState<HistoriqueEntry[]>([]);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setHistorique(raw ? (JSON.parse(raw) as HistoriqueEntry[]) : []);
    } catch {
      // silently ignore storage errors
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Ajoute une recette à l'historique (dédupliquée par nom, la plus récente en tête).
   */
  const addToHistorique = useCallback(async (recipe: Recipe) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const existing: HistoriqueEntry[] = raw ? (JSON.parse(raw) as HistoriqueEntry[]) : [];
      const previous = existing.find((e) => e.recipe.name === recipe.name);
      const filtered = existing.filter((e) => e.recipe.name !== recipe.name);
      const newEntry: HistoriqueEntry = {
        recipe,
        viewedAt: new Date().toISOString(),
        ...(previous?.rating !== undefined && { rating: previous.rating }),
        ...(previous?.comment !== undefined && { comment: previous.comment }),
      };
      const updated = [newEntry, ...filtered].slice(0, 50);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setHistorique(updated);
    } catch {
      // silently ignore storage errors
    }
  }, []);

  /**
   * Vide tout l'historique.
   */
  const clearHistorique = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setHistorique([]);
    } catch {
      // silently ignore storage errors
    }
  }, []);

  const rateRecipe = useCallback(async (recipeName: string, rating: number, comment?: string) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const existing: HistoriqueEntry[] = raw ? (JSON.parse(raw) as HistoriqueEntry[]) : [];
      const updated = existing.map((e) =>
        e.recipe.name === recipeName ? { ...e, rating, comment } : e
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setHistorique(updated);
    } catch {
      // silently ignore storage errors
    }
  }, []);

  const clearRatings = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const existing: HistoriqueEntry[] = raw ? (JSON.parse(raw) as HistoriqueEntry[]) : [];
      const updated = existing.map(({ rating: _r, comment: _c, ...rest }) => rest as HistoriqueEntry);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setHistorique(updated);
    } catch {
      // silently ignore storage errors
    }
  }, []);

  return { historique, load, addToHistorique, clearHistorique, rateRecipe, clearRatings };
}
