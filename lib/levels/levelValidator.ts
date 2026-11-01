import type { Level } from '../types';
import { PLATE_T, WALL_T, footprint, obstacleExtent } from './geometry';

/** Sanity checks on a generated layout. Returns a list of problems (empty = fine).
 *  This proves basic structure and reachability only, not that every play-through is winnable. */
export function validateLevel(level: Level): string[] {
  const errs: string[] = [];
  const { trays, balls, classRadii } = level;
  const maxR = Math.max(...classRadii);
  const nums = [level.required, level.allowedLoss, level.abyssY, level.wallHeight, ...level.bounds.min, ...level.bounds.max];
  if (nums.some((n) => !Number.isFinite(n))) errs.push('non-finite value');
  if (trays.length < 2) errs.push('needs at least two trays');
  if (balls.length < 4 || balls.length > 60) errs.push('ball count out of range');
  if (level.classNeed.length !== classRadii.length || level.classNeed.some((n, j) => n < 1 || n + level.classAllowed[j] !== balls.filter((b) => b.cls === j).length)) errs.push('class quotas do not add up');
  if (level.required + level.allowedLoss !== balls.length) errs.push('required/loss do not add up');
  if (classRadii.some((r, j) => j > 0 && r < classRadii[j - 1] * 1.4)) errs.push('ball size classes too close together');
  if (balls.some((b) => Math.abs(b.radius - classRadii[b.cls]) > 1e-9)) errs.push('ball radius mismatch');
  if (level.spawn.x1 <= level.spawn.x0 || level.spawn.z1 <= level.spawn.z0) errs.push('empty spawn area');

  trays.forEach((t, i) => {
    const last = i === trays.length - 1;
    if (i > 0 && t.cy >= trays[i - 1].cy - PLATE_T - level.wallHeight) errs.push(`tray ${i} too close to tray ${i - 1}`);
    if (last && t.exit) errs.push('last tray has an exit');
    if (!last && !t.exit) errs.push(`tray ${i} has no exit`);
    if (t.exit && t.exit.to - t.exit.from < 2 * maxR * 2) errs.push(`tray ${i} exit too narrow`);

    if (t.exit && !last) {
      // The exit must open over the next tray, along its whole length.
      const lower = footprint(trays[i + 1]);
      const alongX = t.exit.side[0] !== undefined && t.exit.side[1] === 'x';
      const lo = alongX ? lower.z0 : lower.x0;
      const hi = alongX ? lower.z1 : lower.x1;
      if (t.exit.from < lo || t.exit.to > hi) errs.push(`tray ${i} exit not over tray ${i + 1}`);
      const sgn = t.exit.side[0] === '+' ? 1 : -1;
      const edge = alongX ? t.cx + (sgn * t.w) / 2 : t.cz + (sgn * t.d) / 2;
      const nlo = alongX ? lower.x0 : lower.z0;
      const nhi = alongX ? lower.x1 : lower.z1;
      if (edge < nlo + 1 || edge > nhi - 1) errs.push(`tray ${i} exit edge not over tray ${i + 1}`);
    }

    for (const o of t.obstacles) {
      const [hx, hz] = obstacleExtent(o);
      if (o.x - hx < t.cx - t.w / 2 + WALL_T - 0.02 || o.x + hx > t.cx + t.w / 2 - WALL_T + 0.02 || o.z - hz < t.cz - t.d / 2 + WALL_T - 0.02 || o.z + hz > t.cz + t.d / 2 - WALL_T + 0.02) errs.push(`tray ${i} obstacle outside`);
      if (t.holes.some((h) => Math.abs(h.x - o.x) < h.r + hx && Math.abs(h.z - o.z) < h.r + hz)) errs.push(`tray ${i} obstacle on a hole`);
    }
    t.holes.forEach((h, a) => {
      const edge = WALL_T + h.r + 0.2;
      if (h.x - h.r < t.cx - t.w / 2 + edge - h.r || h.x + h.r > t.cx + t.w / 2 - edge + h.r) errs.push(`tray ${i} hole outside`);
      if (h.z - h.r < t.cz - t.d / 2 + edge - h.r || h.z + h.r > t.cz + t.d / 2 - edge + h.r) errs.push(`tray ${i} hole outside`);
      if (h.r < classRadii[0] * 1.1) errs.push(`tray ${i} hole smaller than the smallest ball`);
      for (let b = a + 1; b < t.holes.length; b++) {
        if (Math.hypot(h.x - t.holes[b].x, h.z - t.holes[b].z) < h.r + t.holes[b].r + 0.3) errs.push(`tray ${i} holes overlap`);
      }
      // A trap must drop into nothing, otherwise it is not a trap.
      if (h.kind === 'trap') {
        for (const lower of trays.slice(i + 1)) {
          const f = footprint(lower, h.r);
          if (h.x > f.x0 && h.x < f.x1 && h.z > f.z0 && h.z < f.z1) errs.push(`tray ${i} trap sits above tray ${lower.index}`);
        }
      }
    });
  });

  const lastHoles = trays[trays.length - 1].holes;
  const goalOf = (j: number) => trays.flatMap((t) => t.holes).find((h) => h.kind === 'goal' && h.cls === j);
  if (!classRadii.every((r, j) => { const h = goalOf(j); return h && h.r >= 1.2 * r && h.r < 1.5 * r; })) errs.push('every ball size needs its own goal hole');
  if (!lastHoles.some((h) => h.kind === 'goal' && h.cls === classRadii.length - 1)) errs.push('the biggest size must have its goal on the last tray');
  if (trays[0].holes.some((h) => h.x > level.spawn.x0 - h.r && h.x < level.spawn.x1 + h.r && h.z > level.spawn.z0 - h.r && h.z < level.spawn.z1 + h.r)) {
    errs.push('hole under the starting pile');
  }
  return errs;
}
