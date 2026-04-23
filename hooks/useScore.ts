import { useMemo } from 'react';
import { useFrigo, type FrigoIngredient } from './useFrigo';

// ─── Anti-gaspi score ─────────────────────────────────────────────────────────
// Base: 100 points.
//   -5 per "red"    ingredient (≥ 10 days old)
//   -2 per "orange" ingredient (≥  5 days old)
// Clamped to [0, 100].

export interface ScoreBreakdown {
  score: number;
  red: number;
  orange: number;
  green: number;
  weekNumber: number;
  savedKg: number;
  savedEuros: number;
}

function daysOld(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

// Returns days until expiry (negative = already expired)
function daysUntilExpiry(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function computeScore(ingredients: FrigoIngredient[]): ScoreBreakdown {
  let red = 0;
  let orange = 0;
  let green = 0;

  for (const ing of ingredients) {
    if (ing.expiresAt) {
      const d = daysUntilExpiry(ing.expiresAt);
      if (d <= 0) red += 1;
      else if (d <= 3) orange += 1;
      else green += 1;
    } else {
      const d = daysOld(ing.addedAt);
      if (d >= 10) red += 1;
      else if (d >= 5) orange += 1;
      else green += 1;
    }
  }

  const raw = 100 - red * 5 - orange * 2;
  const score = Math.max(0, Math.min(100, raw));

  return {
    score,
    red,
    orange,
    green,
    weekNumber: isoWeek(new Date()),
    // Rough estimates shown on the home screen as "sauvés / économisés"
    savedKg: green * 0.2,
    savedEuros: green * 1.5,
  };
}

export function useScore(): ScoreBreakdown {
  const { ingredients } = useFrigo();
  return useMemo(() => computeScore(ingredients), [ingredients]);
}
