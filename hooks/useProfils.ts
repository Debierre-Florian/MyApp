import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DietType, AllergyType } from './usePreferences';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileColor = 'terracotta' | 'olive' | 'mustard' | 'bleu';

export const PROFILE_COLORS: Record<ProfileColor, string> = {
  terracotta: '#C4622D',
  olive: '#5C6B3A',
  mustard: '#D4A12B',
  bleu: '#3B6BA5',
};

export const PROFILE_COLORS_BG: Record<ProfileColor, string> = {
  terracotta: '#F4E3D6',
  olive: '#E6E9D6',
  mustard: '#F5E7BD',
  bleu: '#D6E4F4',
};

export const COLOR_OPTIONS: ProfileColor[] = ['terracotta', 'olive', 'mustard', 'bleu'];

export interface Profil {
  id: string;
  firstName: string;
  color: ProfileColor;
  diet: DietType;
  allergies: AllergyType[];
  favoriteIngredients: string[];
  dislikedIngredients: string[];
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PROFIL: Omit<Profil, 'id'> = {
  firstName: '',
  color: 'terracotta',
  diet: 'Omnivore',
  allergies: [],
  favoriteIngredients: [],
  dislikedIngredients: [],
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const PROFILS_KEY = '@frigo_profils';
const ACTIF_KEY = '@frigo_profil_actif';
const LEGACY_KEY = '@frigo_preferences';

// ─── Context ──────────────────────────────────────────────────────────────────

interface ProfilsState {
  profils: Profil[];
  activeId: string;
  activeProfil: Profil;
  loading: boolean;
  setActiveId: (id: string) => void;
  addProfil: (firstName: string, color: ProfileColor) => Profil;
  deleteProfil: (id: string) => void;
  updateActiveProfil: (patch: Partial<Omit<Profil, 'id'>>) => void;
  trimProfilsToMax: (max: number) => void;
}

const ProfilsContext = createContext<ProfilsState | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProfilsProvider({ children }: { children: ReactNode }) {
  const [profils, setProfils] = useState<Profil[]>([]);
  const [activeId, setActiveIdState] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const results = await AsyncStorage.multiGet([PROFILS_KEY, ACTIF_KEY, LEGACY_KEY]);
        const profilsStr = results[0][1];
        const activeIdStr = results[1][1];
        const legacyStr = results[2][1];

        let loaded: Profil[] = [];

        if (profilsStr) {
          loaded = JSON.parse(profilsStr) as Profil[];
        } else if (legacyStr) {
          const legacy = JSON.parse(legacyStr) as {
            firstName?: string;
            diet?: DietType;
            allergies?: AllergyType[];
            favoriteIngredients?: string[];
            dislikedIngredients?: string[];
          };
          loaded = [{
            id: `p_${Date.now()}`,
            firstName: legacy.firstName ?? '',
            color: 'terracotta',
            diet: legacy.diet ?? 'Omnivore',
            allergies: legacy.allergies ?? [],
            favoriteIngredients: legacy.favoriteIngredients ?? [],
            dislikedIngredients: legacy.dislikedIngredients ?? [],
          }];
        }

        if (loaded.length === 0) {
          loaded = [{ ...DEFAULT_PROFIL, id: `p_${Date.now()}` }];
        }

        const resolvedActiveId =
          activeIdStr && loaded.find((p) => p.id === activeIdStr)
            ? activeIdStr
            : loaded[0].id;

        setProfils(loaded);
        setActiveIdState(resolvedActiveId);

        await AsyncStorage.multiSet([
          [PROFILS_KEY, JSON.stringify(loaded)],
          [ACTIF_KEY, resolvedActiveId],
        ]);
      } catch {
        const fallback = { ...DEFAULT_PROFIL, id: `p_${Date.now()}` };
        setProfils([fallback]);
        setActiveIdState(fallback.id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback((newProfils: Profil[], newActiveId: string) => {
    AsyncStorage.multiSet([
      [PROFILS_KEY, JSON.stringify(newProfils)],
      [ACTIF_KEY, newActiveId],
    ]).catch(() => {});
  }, []);

  const setActiveId = useCallback(
    (id: string) => {
      setActiveIdState(id);
      AsyncStorage.setItem(ACTIF_KEY, id).catch(() => {});
    },
    []
  );

  const addProfil = useCallback(
    (firstName: string, color: ProfileColor): Profil => {
      const newProfil: Profil = {
        id: `p_${Date.now()}`,
        firstName: firstName.trim(),
        color,
        diet: 'Omnivore',
        allergies: [],
        favoriteIngredients: [],
        dislikedIngredients: [],
      };
      setProfils((prev) => {
        const next = [...prev, newProfil];
        persist(next, newProfil.id);
        return next;
      });
      setActiveIdState(newProfil.id);
      return newProfil;
    },
    [persist]
  );

  const deleteProfil = useCallback(
    (id: string) => {
      setProfils((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((p) => p.id !== id);
        setActiveIdState((prevActive) => {
          const newActive = prevActive === id ? next[0].id : prevActive;
          persist(next, newActive);
          return newActive;
        });
        return next;
      });
    },
    [persist]
  );

  const trimProfilsToMax = useCallback(
    (max: number) => {
      setProfils((prev) => {
        if (prev.length <= max) return prev;
        const next = prev.slice(0, max);
        const newActiveId = next.find((p) => p.id === activeId) ? activeId : next[0].id;
        setActiveIdState(newActiveId);
        persist(next, newActiveId);
        return next;
      });
    },
    [activeId, persist]
  );

  const updateActiveProfil = useCallback(
    (patch: Partial<Omit<Profil, 'id'>>) => {
      setProfils((prev) => {
        const next = prev.map((p) =>
          p.id === activeId ? { ...p, ...patch } : p
        );
        persist(next, activeId);
        return next;
      });
    },
    [activeId, persist]
  );

  const activeProfil: Profil =
    profils.find((p) => p.id === activeId) ??
    profils[0] ?? { ...DEFAULT_PROFIL, id: '' };

  return React.createElement(
    ProfilsContext.Provider,
    {
      value: {
        profils,
        activeId,
        activeProfil,
        loading,
        setActiveId,
        addProfil,
        deleteProfil,
        updateActiveProfil,
        trimProfilsToMax,
      },
    },
    children
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProfils(): ProfilsState {
  const ctx = useContext(ProfilsContext);
  if (!ctx) throw new Error('useProfils must be used inside ProfilsProvider');
  return ctx;
}
