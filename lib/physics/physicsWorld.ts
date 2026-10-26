import RAPIER from '@dimforge/rapier3d-compat';
import type { Level, Obstacle, Tray } from '../types';
import { PLATE_T, plateBoxes, trayWalls } from '../levels/geometry';

let ready: Promise<typeof RAPIER> | null = null;
export function loadRapier(): Promise<typeof RAPIER> {
  ready ??= RAPIER.init().then(() => RAPIER);
  return ready;
}

export type Sweeper = Extract<Obstacle, { kind: 'sweeper' }>;
export type Mover = Extract<Obstacle, { kind: 'sweeper' | 'spinner' | 'gate' | 'door' }>;
export const isMover = (o: Obstacle): o is Mover => o.kind === 'sweeper' || o.kind === 'spinner' || o.kind === 'gate' || o.kind === 'door';

/** Where a moving obstacle is at time t: centre (assembly coordinates), height of its centre, and turn about the vertical axis. */
export function moverPose(o: Mover, t: number, baseY: number, wallH: number) {
  if (o.kind === 'sweeper') {
    const s = o.amp * Math.sin(o.speed * t + o.phase);
    return { x: o.x + (o.axis === 'x' ? s : 0), y: baseY, z: o.z + (o.axis === 'z' ? s : 0), ry: 0 };
  }
  if (o.kind === 'spinner') return { x: o.x, y: baseY, z: o.z, ry: o.speed * t + o.phase };
  if (o.kind === 'door') {
    // Open (sunk into the floor) for `open` seconds of every cycle, shut for `closed`; it eases over a second each way.
    const P = o.open + o.closed;
    const ph = (((t + o.offset) % P) + P) % P;
    const lower = ph < o.open ? Math.min(1, Math.min(ph, o.open - ph)) : 0;
    return { x: o.x, y: baseY - lower * (wallH + 0.15), z: o.z, ry: 0 };
  }
  // Gate: down for the negative half of the wave. It moves slowly enough that it can never fling a ball over a wall.
  const lower = Math.max(0, Math.min(1, -Math.sin(o.speed * t + o.phase) * 1.4));
  return { x: o.x, y: baseY - lower * (wallH + 0.15), z: o.z, ry: 0 };
}

/** Floor materials. Ice lets balls glide, sticky slows them, bouncy rebounds them. */
const SURFACE = {
  normal: { friction: 0.45, bounce: 0.2 },
  ice: { friction: 0.02, bounce: 0.15 },
  sticky: { friction: 1.6, bounce: 0.05 },
  bouncy: { friction: 0.45, bounce: 0.9 },
  conveyor: { friction: 0.35, bounce: 0.15 },
} as const;

/** Patch materials: friction and bounce override the ball's own (min/max combine). */
const PATCH = {
  ice: { friction: 0, bounce: 0.1, fr: 'min' },
  rough: { friction: 2.5, bounce: 0.05, fr: 'max' },
  bouncy: { friction: 0.4, bounce: 1.0, fr: 'max' },
} as const;

export const FIXED_DT = 1 / 60;
export const GRAVITY = 21;
const SUBSTEPS = 1;

/** Static trays + dynamic balls. The assembly never moves: tilting is done by rotating gravity. */
export class PhysicsWorld {
  world: RAPIER.World;
  readonly balls: RAPIER.RigidBody[] = [];
  readonly movers: Array<{ body: RAPIER.RigidBody; o: Mover; tray: Tray }> = [];

  private readonly wallH: number;

  constructor(private R: typeof RAPIER, level: Level) {
    this.wallH = level.wallHeight;
    this.world = new R.World({ x: 0, y: -GRAVITY, z: 0 });
    this.world.timestep = FIXED_DT / SUBSTEPS;
    this.world.integrationParameters.numSolverIterations = 4;
    const ground = this.world.createRigidBody(R.RigidBodyDesc.fixed());
    for (const t of level.trays) {
      for (const b of plateBoxes(t)) {
        this.world.createCollider(
          R.ColliderDesc.cuboid(b.hx, b.hy, b.hz).setTranslation(t.cx + b.x, t.cy + b.y, t.cz + b.z).setFriction(SURFACE[t.surface].friction).setRestitution(SURFACE[t.surface].bounce),
          ground,
        );
      }
      for (const b of trayWalls(level, t)) {
        this.world.createCollider(
          R.ColliderDesc.cuboid(b.hx, b.hy, b.hz).setTranslation(t.cx + b.x, t.cy + b.y, t.cz + b.z).setFriction(0.3).setRestitution(0.2),
          ground,
        );
      }
      // A goal hole is only for its own ball size: smaller balls roll over an invisible lid, bigger ones cannot fit.
      for (const h of t.holes) {
        if (h.kind !== 'goal' || !h.cls) continue;
        const mask = (1 << h.cls) - 1; // classes below h.cls
        this.world.createCollider(
          R.ColliderDesc.cylinder(PLATE_T / 2, h.r + 0.01).setTranslation(h.x, t.cy, h.z).setFriction(0.45).setRestitution(0.2).setCollisionGroups(((0x8000 << 16) | mask) >>> 0),
          ground,
        );
      }
      const hh = level.wallHeight / 2;
      const y = t.cy + PLATE_T / 2 + hh;
      for (const o of t.obstacles) {
        if (o.kind === 'peg') {
          this.world.createCollider(R.ColliderDesc.cylinder(hh, o.r).setTranslation(o.x, y, o.z).setFriction(0.2).setRestitution(0.5), ground);
        } else if (o.kind === 'bar' || o.kind === 'block') {
          this.world.createCollider(R.ColliderDesc.cuboid(o.hx, hh, o.hz).setTranslation(o.x, y, o.z).setFriction(0.2).setRestitution(0.35), ground);
        } else if (o.kind === 'filter') {
          // Blocks only the ball sizes it does not let through (collision groups), so the others pass straight through.
          const all = (1 << level.classRadii.length) - 1;
          const low = (1 << o.cut) - 1;
          const blocked = o.pass === 'small' ? all & ~low : low;
          this.world.createCollider(R.ColliderDesc.cuboid(o.hx, hh, o.hz).setTranslation(o.x, y, o.z).setFriction(0.2).setRestitution(0.3).setCollisionGroups(((0x4000 << 16) | blocked) >>> 0), ground);
        } else if (o.kind === 'patch') {
          // A thin raised slab with its own friction and bounce, so the ball really feels a different floor.
          const m = PATCH[o.mat];
          const py = t.cy + PLATE_T / 2 + 0.02;
          const d = o.shape === 'round' ? R.ColliderDesc.cylinder(0.02, o.hx) : R.ColliderDesc.cuboid(o.hx, 0.02, o.hz);
          this.world.createCollider(
            d.setTranslation(o.x, py, o.z).setFriction(m.friction).setRestitution(m.bounce)
              .setFrictionCombineRule(m.fr === 'min' ? R.CoefficientCombineRule.Min : R.CoefficientCombineRule.Max)
              .setRestitutionCombineRule(R.CoefficientCombineRule.Max),
            ground,
          );
        } else if (o.kind === 'bumper') {
          this.world.createCollider(R.ColliderDesc.cylinder(hh, o.r).setTranslation(o.x, y, o.z).setFriction(0.1).setRestitution(0.9), ground);
        } else if (isMover(o)) {
          const p0 = moverPose(o, 0, y, level.wallHeight);
          const body = this.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(p0.x, p0.y, p0.z).setRotation({ x: 0, y: Math.sin(p0.ry / 2), z: 0, w: Math.cos(p0.ry / 2) }));
          if (o.kind === 'spinner') {
            this.world.createCollider(R.ColliderDesc.cuboid(o.len, hh, 0.14).setFriction(0.2).setRestitution(0.35), body);
            this.world.createCollider(R.ColliderDesc.cuboid(0.14, hh, o.len).setFriction(0.2).setRestitution(0.35), body);
          } else {
            this.world.createCollider(R.ColliderDesc.cuboid(o.hx, hh, o.hz).setFriction(0.2).setRestitution(0.3), body);
          }
          this.movers.push({ body, o, tray: t });
        }
      }
    }
  }

  addBall(x: number, y: number, z: number, radius: number, cls = 0): number {
    const { R } = this;
    const body = this.world.createRigidBody(
      R.RigidBodyDesc.dynamic().setTranslation(x, y, z).setCcdEnabled(true).setCanSleep(false).setLinearDamping(0.55).setAngularDamping(0.3),
    );
    this.world.createCollider(R.ColliderDesc.ball(radius).setDensity(1).setFriction(0.4).setRestitution(0.25).setCollisionGroups((((1 << cls) << 16) | 0xffff) >>> 0), body);
    this.balls.push(body);
    return this.balls.length - 1;
  }

  setGravity(x: number, y: number, z: number) {
    this.world.gravity = { x, y, z };
  }

  /** `time` is the game clock, which drives every moving obstacle. */
  step(time = 0) {
    for (const m of this.movers) {
      const q = moverPose(m.o, time + FIXED_DT, m.tray.cy + PLATE_T / 2 + this.wallH / 2, this.wallH);
      m.body.setNextKinematicTranslation({ x: q.x, y: q.y, z: q.z });
      m.body.setNextKinematicRotation({ x: 0, y: Math.sin(q.ry / 2), z: 0, w: Math.cos(q.ry / 2) });
    }
    for (let i = 0; i < SUBSTEPS; i++) this.world.step();
  }

  dispose() {
    this.world.free();
    this.balls.length = 0;
  }
}

export { PLATE_T };
