import * as THREE from 'three';
import type { Level, Obstacle, Tray } from '../types';

export const PLATE_T = 0.35;
export const WALL_T = 0.2;
const HOLE_SEGMENTS = 24;

/** Wall box relative to the tray centre. */
export interface Box {
  x: number;
  y: number;
  z: number;
  hx: number;
  hy: number;
  hz: number;
}

/** Perimeter walls; the exit side has a gap so balls can spill onto the tray below. */
export function trayWalls(level: Level, t: Tray): Box[] {
  const hy = level.wallHeight / 2;
  const y = PLATE_T / 2 + hy;
  const boxes: Box[] = [];
  const hw = t.w / 2;
  const hd = t.d / 2;
  const ex = t.exit;
  const side = (s: string, centre: number, half: number, fixed: number, axis: 'x' | 'z') => {
    if (half <= 0.01) return;
    boxes.push(axis === 'x'
      ? { x: centre, y, z: fixed, hx: half, hy, hz: WALL_T / 2 }
      : { x: fixed, y, z: centre, hx: WALL_T / 2, hy, hz: half });
    void s;
  };
  for (const s of ['-x', '+x', '-z', '+z'] as const) {
    if (t.open.includes(s)) continue; // no wall on this side
    const alongX = s[1] === 'z'; // a z-wall runs along x
    const half = alongX ? hw : hd;
    const fixed = (s[0] === '+' ? 1 : -1) * ((alongX ? hd : hw) - WALL_T / 2);
    const axis = alongX ? 'x' : 'z';
    if (ex && ex.side === s) {
      const lat0 = (alongX ? t.cx : t.cz);
      const a = ex.from - lat0;
      const b = ex.to - lat0;
      side(s, (-half + a) / 2, (a + half) / 2, fixed, axis);
      side(s, (b + half) / 2, (half - b) / 2, fixed, axis);
    } else side(s, 0, half, fixed, axis);
  }
  return boxes;
}

/** Plate with real round holes. Used for both the physics trimesh and the rendered mesh. */
export function buildPlateGeometry(t: Tray): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = t.w / 2;
  const hd = t.d / 2;
  shape.moveTo(-hw, -hd);
  shape.lineTo(hw, -hd);
  shape.lineTo(hw, hd);
  shape.lineTo(-hw, hd);
  shape.lineTo(-hw, -hd);
  for (const h of t.holes) {
    const p = new THREE.Path();
    p.absarc(h.x - t.cx, -(h.z - t.cz), h.r, 0, Math.PI * 2, true); // shape y becomes -z after the rotation below
    shape.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: PLATE_T, bevelEnabled: false, curveSegments: HOLE_SEGMENTS });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -PLATE_T / 2, 0);
  return g;
}

/** Physics version of the plate: thin rows of solid boxes with the round holes cut out of them.
 *  Boxes (convex solids) collide far more robustly than a triangle mesh around small holes. */
export function plateBoxes(t: Tray, rowH = 0.06): Box[] {
  // Fine rows only where a hole needs them; everywhere else a few big boxes keep the collider count (and physics cost) low.
  const edges = [-t.d / 2, t.d / 2];
  for (const h of t.holes) {
    const a = Math.max(-t.d / 2, h.z - t.cz - h.r);
    const b = Math.min(t.d / 2, h.z - t.cz + h.r);
    const n = Math.max(1, Math.ceil((b - a) / rowH));
    for (let k = 0; k <= n; k++) edges.push(a + ((b - a) * k) / n);
  }
  edges.sort((p, q) => p - q);
  const zs = edges.filter((v, i) => i === 0 || v - edges[i - 1] > 1e-6);
  const out: Box[] = [];
  const open = new Map<string, { a: number; b: number; z0: number; z1: number }>();
  const flush = (keep: Set<string>) => {
    for (const [key, r] of open) {
      if (keep.has(key)) continue;
      out.push({ x: (r.a + r.b) / 2, y: 0, z: (r.z0 + r.z1) / 2, hx: (r.b - r.a) / 2, hy: PLATE_T / 2, hz: (r.z1 - r.z0) / 2 });
      open.delete(key);
    }
  };
  for (let k = 0; k < zs.length - 1; k++) {
    const z0 = zs[k];
    const rh = zs[k + 1] - z0;
    const zc = z0 + rh / 2;
    const blocked: Array<[number, number]> = [];
    for (const h of t.holes) {
      const dz = t.cz + zc - h.z;
      if (Math.abs(dz) < h.r) {
        const c = Math.sqrt(h.r * h.r - dz * dz);
        blocked.push([h.x - t.cx - c, h.x - t.cx + c]);
      }
    }
    blocked.sort((p, q) => p[0] - q[0]);
    const segs: Array<[number, number]> = [];
    let cur = -t.w / 2;
    for (const [a, b] of blocked) {
      if (a > cur) segs.push([cur, a]);
      cur = Math.max(cur, b);
    }
    if (cur < t.w / 2) segs.push([cur, t.w / 2]);
    const keep = new Set<string>();
    for (const [a, b] of segs) {
      const key = `${a.toFixed(4)}|${b.toFixed(4)}`;
      keep.add(key);
      const r = open.get(key);
      if (r) r.z1 = z0 + rh;
      else open.set(key, { a, b, z0, z1: z0 + rh });
    }
    flush(keep);
  }
  flush(new Set());
  return out;
}

/** Tray footprint rectangle, optionally inflated. */
export const footprint = (t: Tray, pad = 0) => ({ x0: t.cx - t.w / 2 - pad, x1: t.cx + t.w / 2 + pad, z0: t.cz - t.d / 2 - pad, z1: t.cz + t.d / 2 + pad });

export function rectsOverlap(a: ReturnType<typeof footprint>, b: ReturnType<typeof footprint>) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
}

/** Deterministic starting pile: every ball dropped into one small, tight block (about as tall as it is wide). */
export function spawnPositions(level: Level): Array<{ x: number; y: number; z: number }> {
  const { spawn, balls } = level;
  const top = level.trays[0].cy + PLATE_T / 2;
  const rMax = Math.max(...balls.map((b) => b.radius));
  const c = rMax * 2.1;
  const side = Math.max(1, Math.ceil(Math.cbrt(balls.length)));
  const cx = (spawn.x0 + spawn.x1) / 2;
  const cz = (spawn.z0 + spawn.z1) / 2;
  const x0 = cx - (side * c) / 2;
  const z0 = cz - (side * c) / 2;
  let s = level.seed | 1;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) | 0) >>> 0) / 4294967296;
  return balls.map((b, i) => {
    const layer = Math.floor(i / (side * side));
    const k = i % (side * side);
    return {
      x: x0 + c / 2 + (k % side) * c + (rnd() - 0.5) * 0.06 * c,
      y: top + b.radius + 0.05 + layer * c * 0.98,
      z: z0 + c / 2 + Math.floor(k / side) * c + (rnd() - 0.5) * 0.06 * c,
    };
  });
}

/** Half-size of the floor area an obstacle can occupy (a sweeper covers its whole travel). */
export function obstacleExtent(o: Obstacle): [number, number] {
  switch (o.kind) {
    case 'magnet': return [o.r * 0.45, o.r * 0.45];
    case 'peg': case 'bumper': case 'portal': return [o.r, o.r];
    case 'spinner': return [o.len, o.len];
    case 'sweeper': return o.axis === 'x' ? [o.hx + o.amp, o.hz] : [o.hx, o.hz + o.amp];
    default: return [o.hx, o.hz];
  }
}
