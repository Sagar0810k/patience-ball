import { INTRO } from './intro';
import type { Level } from './types';

export interface Tip { key: string; icon: string; title: string; body: string }

const TIPS: Record<string, Omit<Tip, 'key'>> = {
  peg: { icon: '🟠', title: 'Pegs', body: 'Round posts. Balls bounce off them, so steer around or use them to nudge a ball.' },
  bar: { icon: '🚧', title: 'Walls', body: 'Striped walls block the way. Look for the gap, and note that only small balls fit narrow ones.' },
  bumper: { icon: '🌸', title: 'Bumpers', body: 'Pink bumpers kick balls away on contact. They can push a ball toward a red hole, so keep your distance.' },
  boost: { icon: '⚡', title: 'Boost pads', body: 'Yellow pads shove balls in the direction of their arrows. Ride them to cross a floor fast.' },
  mud: { icon: '🟤', title: 'Mud', body: 'Balls slow down in mud. Tilt harder to get through it.' },
  spinner: { icon: '🌀', title: 'Spinners', body: 'Cyan blades turn around a centre post. Time your roll between the arms.' },
  sweeper: { icon: '↔️', title: 'Sweepers', body: 'A purple bar slides back and forth across the floor. Wait for it to pass.' },
  gate: { icon: '⛔', title: 'Gates', body: 'Striped gates sink into the floor and rise again. Roll through while one is down.' },
  door: { icon: '🚪', title: 'Timed doors', body: 'Orange doors are only open for a few seconds each cycle. Wait for the opening, then roll through.' },
  magnet: { icon: '🧲', title: 'Magnet discs', body: 'Purple discs pull balls in; orange discs push them away. A hard tilt breaks free.' },
  portal: { icon: '🔮', title: 'Portals', body: 'Balls entering one portal come out of its twin on the same floor.' },
  block: { icon: '⬛', title: 'Corner blocks', body: 'Solid blocks reshape the floor. Balls can pile up in the corners beside them.' },
  filter: { icon: '🔷', title: 'Glass filters', body: 'Cyan glass lets only small balls through; amber glass lets only big balls through.' },
  'patch-ice': { icon: '🧊', title: 'Icy patches', body: 'Balls slide fast and far on ice. Level the board early to stop them.' },
  'patch-rough': { icon: '🟫', title: 'Rough patches', body: 'Ridged patches grip and slow balls down.' },
  'patch-bouncy': { icon: '🎈', title: 'Bouncy patches', body: 'Pink rings make balls hop. They are hard to aim, so cross them gently.' },
  ice: { icon: '❄️', title: 'Icy floor', body: 'The whole floor is slippery. Small tilts go a long way.' },
  sticky: { icon: '🍯', title: 'Sticky floor', body: 'The brown floor drags on balls. You need a bigger tilt to keep them moving.' },
  bouncy: { icon: '🪀', title: 'Bouncy floor', body: 'The pink floor rebounds balls. Expect them to hop around.' },
  conveyor: { icon: '➡️', title: 'Conveyor floor', body: 'Teal arrows show the way the floor carries balls. Use it, or fight it.' },
  open: { icon: '🔥', title: 'Open edges', body: 'Sides with a red glow have no wall. Balls roll off them, either down to the next floor or out of the game.' },
};

const STORE = 'pb_seen_tips';
const read = (): string[] => { try { return JSON.parse(localStorage.getItem(STORE) ?? '[]'); } catch { return []; } };
export const markTipsSeen = (keys: string[]) => { try { localStorage.setItem(STORE, JSON.stringify([...new Set([...read(), ...keys])])); } catch { /* storage unavailable */ } };

/** Element types in this level that the player has not met yet (empty on the very first run, where the tutorial covers the basics). */
export function newTips(level: Level): Tip[] {
  const seen = new Set(read());
  const keys = new Set<string>();
  for (const t of level.trays) {
    if (t.surface !== 'normal') keys.add(t.surface);
    if (t.open.length) keys.add('open');
    for (const o of t.obstacles) keys.add(o.kind === 'patch' ? `patch-${o.mat}` : o.kind);
  }
  return [...keys].filter((k) => TIPS[k] && !seen.has(k)).slice(0, 3).map((key) => ({ key, ...TIPS[key] })); // at most 3 per level; the rest wait for the next one
}

const ALIAS: Record<string, string> = { barrier: 'bar', doorwall: 'door' };
export const tipFor = (key: string) => TIPS[ALIAS[key] ?? key];

/** The next element that first appears after `level`, for the "coming up" teaser. */
export function nextUnlock(level: number): { level: number; title: string; icon: string } | null {
  const next = Object.entries(INTRO).filter(([, l]) => l > level).sort((a, b) => a[1] - b[1])[0];
  const t = next && tipFor(next[0]);
  return next && t ? { level: next[1], title: t.title, icon: t.icon } : null;
}

/** Every element the player has met so far, for the collection page. */
export const seenTips = (): Tip[] => read().flatMap((k) => (TIPS[k] ? [{ key: k, ...TIPS[k] }] : []));
export const allTips = (): Tip[] => Object.entries(TIPS).map(([key, t]) => ({ key, ...t }));
