/** One new element per level: each key first appears on exactly one level, so every level teaches at most one new idea
 *  (peg is there from the start; lone bars only in boss levels). Boss levels use what has been unlocked so far. */
export const INTRO: Record<string, number> = {
  'patch-ice': 2, bumper: 3, ice: 4, open: 5, 'patch-rough': 6, boost: 7, barrier: 8, magnet: 9, sticky: 11, filter: 12, doorwall: 13,
  conveyor: 14, spinner: 15, 'patch-bouncy': 16, mud: 17, gate: 18, bouncy: 19, block: 21, sweeper: 22, portal: 23,
};
export const has = (key: string, level: number) => level >= (INTRO[key] ?? Infinity);
