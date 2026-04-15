import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FrigoIngredient {
  id: string;
  name: string;
  addedAt: string; // ISO date string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@frigo_ingredients';

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFrigo() {
  const [ingredients, setIngredients] = useState<FrigoIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setIngredients(raw ? (JSON.parse(raw) as FrigoIngredient[]) : []);
    } catch {
      // silently ignore storage errors
    } finally {
      setLoading(false);
    }
  }, []);

  // Load from AsyncStorage on mount
  useEffect(() => {
    reload();
  }, [reload]);

  // Persist to AsyncStorage whenever list changes (skip initial empty load)
  const persist = useCallback(async (list: FrigoIngredient[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // silently ignore storage errors
    }
  }, []);

  /**
   * Add a single ingredient by name. Skips duplicates (case-insensitive).
   */
  const addIngredient = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      setIngredients((prev) => {
        const alreadyExists = prev.some(
          (i) => i.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (alreadyExists) return prev;

        const updated = [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: trimmed,
            addedAt: new Date().toISOString(),
          },
        ];
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  /**
   * Add multiple ingredients at once (e.g. from AI detection).
   */
  const addIngredients = useCallback(
    async (names: string[]) => {
      if (!names.length) return;

      setIngredients((prev) => {
        const existingNames = new Set(prev.map((i) => i.name.toLowerCase()));
        const newEntries: FrigoIngredient[] = names
          .map((n) => n.trim())
          .filter((n) => n && !existingNames.has(n.toLowerCase()))
          .map((name) => ({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name,
            addedAt: new Date().toISOString(),
          }));

        if (!newEntries.length) return prev;

        const updated = [...prev, ...newEntries];
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  /**
   * Remove an ingredient by id.
   */
  const removeIngredient = useCallback(
    async (id: string) => {
      setIngredients((prev) => {
        const updated = prev.filter((i) => i.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  /**
   * Returns ingredients added more than 7 days ago.
   */
  const checkExpiringIngredients = useCallback((): FrigoIngredient[] => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return ingredients.filter((i) => new Date(i.addedAt).getTime() < cutoff);
  }, [ingredients]);

  return { ingredients, loading, reload, addIngredient, addIngredients, removeIngredient, checkExpiringIngredients };
}
