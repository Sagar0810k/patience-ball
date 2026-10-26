import { SAVE_VERSION, defaultSave, type SaveData } from '../types';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, d: number, min = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.floor(v)) : d);
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);

/** Validate untrusted data (IndexedDB or an imported file) into a SaveData, filling gaps with defaults.
 *  Returns null if it is not a save at all. Add `if (version < n)` steps here when the schema changes. */
export function migrate(raw: unknown): SaveData | null {
  if (!isObj(raw) || typeof raw.version !== 'number' || raw.version > SAVE_VERSION) return null;
  const d = defaultSave();
  const s = isObj(raw.settings) ? raw.settings : {};
  const st = isObj(raw.stats) ? raw.stats : {};
  const best: Record<string, number> = {};
  if (isObj(raw.bestTimes)) for (const [k, v] of Object.entries(raw.bestTimes)) if (/^\d+$/.test(k) && typeof v === 'number' && v > 0) best[k] = Math.floor(v);
  const stars: Record<string, number> = {};
  if (isObj(raw.stars)) for (const [k, v] of Object.entries(raw.stars)) if (/^\d+$/.test(k) && typeof v === 'number' && v >= 1 && v <= 3) stars[k] = Math.floor(v);
  const cp = isObj(raw.checkpoint) ? raw.checkpoint : null;
  const highest = num(raw.highestUnlocked, 1, 1);
  return {
    version: SAVE_VERSION,
    settings: { sound: bool(s.sound, d.settings.sound), haptics: bool(s.haptics, d.settings.haptics), reducedMotion: bool(s.reducedMotion, d.settings.reducedMotion), sensitivity: typeof s.sensitivity === 'number' && s.sensitivity >= 0.5 && s.sensitivity <= 2.5 ? s.sensitivity : 1 },
    stats: {
      levelsCompleted: num(st.levelsCompleted, 0), ballsPlayed: num(st.ballsPlayed, 0), ballsCollected: num(st.ballsCollected, 0),
      attempts: num(st.attempts, 0), playSeconds: num(st.playSeconds, 0),
    },
    highestUnlocked: highest,
    currentLevel: Math.min(num(raw.currentLevel, 1, 1), highest),
    completedLevels: Array.isArray(raw.completedLevels) ? [...new Set(raw.completedLevels.filter((n): n is number => Number.isInteger(n) && n > 0))] : [],
    unlockedCosmetics: Array.isArray(raw.unlockedCosmetics) ? raw.unlockedCosmetics.filter((x): x is string => typeof x === 'string') : [],
    bestTimes: best,
    stars,
    checkpoint: cp && Number.isInteger(cp.levelNumber) && Number.isInteger(cp.seed) ? { levelNumber: cp.levelNumber as number, seed: cp.seed as number, random: bool(cp.random, false) } : null,
  };
}
