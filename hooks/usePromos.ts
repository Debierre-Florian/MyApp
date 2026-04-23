import { useState, useEffect } from 'react';
import { getPromos, type Promo } from '../services/promos';
import { useProfils } from './useProfils';
import { useFrigo } from './useFrigo';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PromosState {
  pertinentes: Promo[];
  autres: Promo[];
  loading: boolean;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePromos(): PromosState {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  const { activeProfil } = useProfils();
  const { ingredients } = useFrigo();

  useEffect(() => {
    getPromos()
      .then(setPromos)
      .finally(() => setLoading(false));
  }, []);

  const frigoNames = new Set(
    ingredients.map((i) => i.name.toLowerCase().trim())
  );
  const favoriteNames = new Set(
    (activeProfil.favoriteIngredients ?? []).map((f) => f.toLowerCase().trim())
  );

  const isPertinente = (promo: Promo): boolean => {
    const product = promo.productName.toLowerCase();
    // Pertinente si le produit est un favori du profil actif
    for (const fav of favoriteNames) {
      if (product.includes(fav) || fav.includes(product)) return true;
    }
    // Pertinente si le produit est déjà dans le frigo (pratique de faire le plein en promo)
    for (const ing of frigoNames) {
      if (product.includes(ing) || ing.includes(product)) return true;
    }
    return false;
  };

  const pertinentes = promos.filter(isPertinente);
  const pertinentesIds = new Set(pertinentes.map((p) => p.id));
  const autres = promos.filter((p) => !pertinentesIds.has(p.id));

  return { pertinentes, autres, loading };
}
