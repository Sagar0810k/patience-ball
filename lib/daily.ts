/** Daily and weekly challenges: one fixed level per calendar day / week (the same for everyone on that date). Stored per browser. */
const KEY = 'pb_daily';
const WEEKLY = 'pb_weekly';
export interface Daily { last: string; streak: number; freezeUsed?: string }

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayNum = (key: string) => { const [y, m, d] = key.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };

/** Week id: the date of that week's Monday. */
export const weekKey = (d = new Date()) => { const m = new Date(d); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return dayKey(m); };

function hash(key: string) {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

/** Level number and seed for a given day; deterministic from the date alone. */
export function dailyLevel(key = dayKey()) {
  const h = hash(key);
  return { n: 6 + (h % 19), seed: (h ^ 0x9e3779b9) >>> 0 };
}

/** The weekly level is a harder one (20-38). */
export function weeklyLevel(key = weekKey()) {
  const h = hash(`W${key}`);
  return { n: 20 + (h % 19), seed: (h ^ 0x85ebca6b) >>> 0 };
}

export function readDaily(): Daily {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (v && typeof v.last === 'string' && typeof v.streak === 'number') return v;
  } catch { /* storage unavailable */ }
  return { last: '', streak: 0 };
}

/** One missed day is forgiven per week (a free streak freeze). */
const freezeReady = (d: Daily, today: string) => !d.freezeUsed || dayNum(today) - dayNum(d.freezeUsed) >= 7;

/** The streak as it should be shown today: it lapses when more than one day was missed (or a second one in a week). */
export function currentStreak(now = new Date()): number {
  const d = readDaily();
  if (!d.last) return 0;
  const gap = dayNum(dayKey(now)) - dayNum(d.last);
  if (gap <= 1) return d.streak;
  return gap === 2 && freezeReady(d, dayKey(now)) ? d.streak : 0;
}

export const doneToday = () => readDaily().last === dayKey();

/** Record a win on today's challenge (once per day). Returns the new streak. */
export function completeDaily(now = new Date()): number {
  const d = readDaily(), today = dayKey(now);
  if (d.last === today) return d.streak;
  const gap = d.last ? dayNum(today) - dayNum(d.last) : 99;
  const streak = currentStreak(now) + 1;
  const next: Daily = { last: today, streak, freezeUsed: gap === 2 && freezeReady(d, today) ? today : d.freezeUsed };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  return streak;
}

export const weeklyDone = () => { try { return localStorage.getItem(WEEKLY) === weekKey(); } catch { return false; } };
export const completeWeekly = () => { try { localStorage.setItem(WEEKLY, weekKey()); } catch { /* storage unavailable */ } };
