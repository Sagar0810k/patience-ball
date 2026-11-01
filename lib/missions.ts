/** Three small missions per day, stored per browser. Progress is fed by game events. */
import { dayKey } from './daily';
export type MissionKind = 'balls' | 'wins' | 'combo';
export interface Mission { kind: MissionKind; goal: number; label: string; have: number }
const KEY = 'pb_missions';
const DEFS: Omit<Mission, 'have'>[] = [
  { kind: 'balls', goal: 40, label: 'Sink 40 balls' },
  { kind: 'wins', goal: 3, label: 'Win 3 levels' },
  { kind: 'combo', goal: 1, label: 'Land a 3-ball combo' },
];

export function readMissions(): Mission[] {
  const today = dayKey();
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (v?.day === today && Array.isArray(v.have)) return DEFS.map((d, i) => ({ ...d, have: Math.min(d.goal, Number(v.have[i]) || 0) }));
  } catch { /* storage unavailable */ }
  return DEFS.map((d) => ({ ...d, have: 0 }));
}

export function bumpMission(kind: MissionKind, n = 1) {
  const m = readMissions();
  m.forEach((x) => { if (x.kind === kind) x.have = Math.min(x.goal, x.have + n); });
  try { localStorage.setItem(KEY, JSON.stringify({ day: dayKey(), have: m.map((x) => x.have) })); } catch { /* ignore */ }
}
