export interface Difficulty {
  tier: 'normal' | 'hard' | 'boss';
  /** Most obstacles one tray may get. */
  obstacles: number;
  /** 0 (easy) .. 1 (hard), saturates around level 40. */
  d: number;
  traysMin: number;
  traysMax: number;
  /** How many distinct ball sizes a level may use. */
  classesMax: number;
  balls: number;
  /** Every 7th normal level has no red holes at all: a palate cleanser. */
  relaxed: boolean;
  trapsMin: number;
  trapsMax: number;
  /** Fraction of balls the player may lose to traps. */
  lossFrac: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function getDifficulty(level: number): Difficulty {
  const L = Math.max(1, Math.floor(level));
  const d = clamp((L - 1) / 60, 0, 1);
  // Every 5th level is a hard level, every 10th a boss level.
  const tier = L % 10 === 0 ? 'boss' : L % 5 === 0 ? 'hard' : 'normal';
  const bump = tier === 'boss' ? 2 : tier === 'hard' ? 1 : 0;
  return {
    d,
    tier,
    // The level after a boss is a breather: half the obstacles and a single red hole.
    obstacles: L > 1 && L % 10 === 1 ? Math.floor(clamp(Math.floor((L + 1) / 4) + bump, 0, 6) / 2) : clamp(Math.floor((L + 1) / 4) + bump, 0, 6),
    traysMin: clamp(2 + Math.floor((L - 1) / 8) + (tier === 'boss' ? 1 : 0), 2, 5),
    traysMax: clamp(3 + Math.floor((L - 1) / 4) + (tier === 'boss' ? 1 : 0), 3, 6),
    classesMax: L < 4 ? 1 : L < 8 ? 2 : 3, // gentle opening: one ball size for levels 1-3
    balls: L <= 3 ? 9 + L : clamp(Math.round(12 + L * 0.8) + bump * 3, 12, 46),
    relaxed: L >= 7 && L % 7 === 0 && tier === 'normal',
    trapsMin: L >= 7 && L % 7 === 0 && tier === 'normal' ? 0 : 1 + Math.floor((L - 1) / 15),
    trapsMax: L >= 7 && L % 7 === 0 && tier === 'normal' ? 0 : L > 1 && L % 10 === 1 ? 1 : clamp(1 + Math.floor((L - 1) / 5) + (tier === 'normal' ? 0 : 1), 1, 6),
    lossFrac: L <= 3 ? 0.5 : lerp(0.38, 0.2, Math.min(1, d * 2)) * (tier === 'boss' ? 0.6 : tier === 'hard' ? 0.8 : 1),
  };
}
