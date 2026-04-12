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

  // Load from AsyncStorage on mount
  useEffect(() => {
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setIngredients(JSON.parse(raw) as FrigoIngredient[]);
        }
      } catch {
        // silently ignore storage errors
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  return { ingredients, loading, addIngredient, addIngredients, removeIngredient };
}
