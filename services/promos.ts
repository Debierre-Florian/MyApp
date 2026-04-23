// ─── Types ────────────────────────────────────────────────────────────────────

export interface Promo {
  id: string;
  productName: string;
  enseigne: 'Leclerc' | 'Carrefour' | 'Lidl' | 'Intermarché';
  prixNormal: number;
  prixPromo: number;
  reduction: number; // pourcentage
  validUntil: string; // ISO date string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

export async function getPromos(): Promise<Promo[]> {
  return [
    {
      id: 'promo_1',
      productName: 'Carottes',
      enseigne: 'Lidl',
      prixNormal: 1.49,
      prixPromo: 0.89,
      reduction: 40,
      validUntil: '2026-04-30T00:00:00.000Z',
    },
    {
      id: 'promo_2',
      productName: 'Poulet fermier',
      enseigne: 'Leclerc',
      prixNormal: 8.90,
      prixPromo: 5.99,
      reduction: 33,
      validUntil: '2026-04-27T00:00:00.000Z',
    },
    {
      id: 'promo_3',
      productName: 'Yaourt nature',
      enseigne: 'Carrefour',
      prixNormal: 2.30,
      prixPromo: 1.49,
      reduction: 35,
      validUntil: '2026-05-02T00:00:00.000Z',
    },
    {
      id: 'promo_4',
      productName: 'Tomates cerises',
      enseigne: 'Intermarché',
      prixNormal: 3.20,
      prixPromo: 1.99,
      reduction: 38,
      validUntil: '2026-04-28T00:00:00.000Z',
    },
    {
      id: 'promo_5',
      productName: 'Saumon fumé',
      enseigne: 'Leclerc',
      prixNormal: 6.50,
      prixPromo: 4.29,
      reduction: 34,
      validUntil: '2026-04-26T00:00:00.000Z',
    },
    {
      id: 'promo_6',
      productName: 'Courgettes',
      enseigne: 'Lidl',
      prixNormal: 1.80,
      prixPromo: 0.99,
      reduction: 45,
      validUntil: '2026-05-01T00:00:00.000Z',
    },
    {
      id: 'promo_7',
      productName: 'Fromage râpé',
      enseigne: 'Carrefour',
      prixNormal: 3.10,
      prixPromo: 1.99,
      reduction: 36,
      validUntil: '2026-04-30T00:00:00.000Z',
    },
    {
      id: 'promo_8',
      productName: 'Lait entier bio',
      enseigne: 'Intermarché',
      prixNormal: 1.95,
      prixPromo: 1.29,
      reduction: 34,
      validUntil: '2026-05-03T00:00:00.000Z',
    },
    {
      id: 'promo_9',
      productName: 'Champignons de Paris',
      enseigne: 'Leclerc',
      prixNormal: 2.40,
      prixPromo: 1.49,
      reduction: 38,
      validUntil: '2026-04-29T00:00:00.000Z',
    },
    {
      id: 'promo_10',
      productName: 'Beurre doux',
      enseigne: 'Lidl',
      prixNormal: 2.90,
      prixPromo: 1.79,
      reduction: 38,
      validUntil: '2026-05-04T00:00:00.000Z',
    },
  ];
}
