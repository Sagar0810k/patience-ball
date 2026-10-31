/** Daily challenge: one fixed level per calendar day (same for everyone on that date), plus a streak. Stored per browser. */
const KEY = 'pb_daily';
export interface Daily { last: string; streak: number }

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Level number and seed for a given day; deterministic from the date alone. */
export function dailyLevel(key = dayKey()) {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return { n: 6 + (h % 19), seed: (h ^ 0x9e3779b9) >>> 0 };
}

export function readDaily(): Daily {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (v && typeof v.last === 'string' && typeof v.streak === 'number') return v;
  } catch { /* storage unavailable */ }
  return { last: '', streak: 0 };
}

/** The streak as it should be shown today: it lapses when yesterday was missed. */
export function currentStreak(now = new Date()): number {
  const d = readDaily();
  if (!d.last) return 0;
  const y = new Date(now); y.setDate(y.getDate() - 1);
  return d.last === dayKey(now) || d.last === dayKey(y) ? d.streak : 0;
}

export const doneToday = () => readDaily().last === dayKey();

/** Record a win on today's challenge (once per day). Returns the new streak. */
export function completeDaily(now = new Date()): number {
  if (doneToday()) return readDaily().streak;
  const streak = currentStreak(now) + 1;
  try { localStorage.setItem(KEY, JSON.stringify({ last: dayKey(now), streak })); } catch { /* storage unavailable */ }
  return streak;
}
