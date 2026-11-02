/** New elements arrive slowly, one at a time, a couple per world (10 levels): each key first appears on exactly one level, so every level teaches at most one new idea
 *  (peg is there from the start; lone bars only in boss levels). Boss levels use what has been unlocked so far. */
export const INTRO: Record<string, number> = {
  // World 1 (1-10): only pegs, then a bumper and a helpful boost pad.
  bumper: 4, boost: 7,
  // World 2 (11-20): still easy; slippery and rough patches, mud, and the first open edge.
  'patch-ice': 12, open: 14, mud: 16, 'patch-rough': 18,
  // World 3 (21-30)
  barrier: 21, sticky: 23, magnet: 25, filter: 27, ice: 29,
  // World 4 (31-40)
  doorwall: 31, conveyor: 33, 'patch-bouncy': 35, spinner: 37, block: 39,
  // World 5 (41-50)
  gate: 41, bouncy: 43, sweeper: 45, portal: 47, flap: 49,
  // World 6+
  slotwall: 51, pinball: 56,
};
export const has = (key: string, level: number) => level >= (INTRO[key] ?? Infinity);
