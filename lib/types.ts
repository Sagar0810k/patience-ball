// Core shared types for Patience Balls.

export type HoleKind = 'trap' | 'goal';

/** A round hole cut through a tray, in assembly coordinates. Balls smaller than `r` fall through. */
export interface Hole {
  id: number;
  kind: HoleKind;
  x: number;
  z: number;
  r: number;
  /** Goal holes are sized for one ball class; it only labels and colours the hole. */
  cls?: number;
}

/** Things on a tray that get in the way (or help). Coordinates are in assembly space, like holes. */
export type Obstacle =
  | { id: number; kind: 'peg'; x: number; z: number; r: number }
  | { id: number; kind: 'bar'; x: number; z: number; hx: number; hz: number }
  /** A bar that slides back and forth along `axis` by +-`amp`. */
  | { id: number; kind: 'sweeper'; x: number; z: number; hx: number; hz: number; axis: 'x' | 'z'; amp: number; speed: number; phase: number }
  /** A pad that pushes balls in direction (dx, dz). */
  | { id: number; kind: 'boost'; x: number; z: number; hx: number; hz: number; dx: number; dz: number }
  /** A round post that kicks balls away on contact. */
  | { id: number; kind: 'bumper'; x: number; z: number; r: number }
  /** A patch of mud that slows balls down. */
  | { id: number; kind: 'mud'; x: number; z: number; hx: number; hz: number }
  /** Two arms turning around (x, z). `speed` is rad/s, negative turns the other way. */
  | { id: number; kind: 'spinner'; x: number; z: number; len: number; speed: number; phase: number }
  /** A bar that sinks into the floor and rises again, blocking and opening the way in turns. */
  | { id: number; kind: 'gate'; x: number; z: number; hx: number; hz: number; speed: number; phase: number }
  /** Balls rolling into a portal come out of its twin at (tx, tz) on the same tray. */
  /** A solid corner block that turns a rectangular tray into an L-shape or a stepped room. */
  | { id: number; kind: 'block'; x: number; z: number; hx: number; hz: number }
  /** A patch of floor with its own feel: ice is slippery, rough grips and slows, bouncy hops balls. Round patches use hx as the radius. */
  | { id: number; kind: 'patch'; shape: 'round' | 'rect'; mat: 'ice' | 'rough' | 'bouncy'; x: number; z: number; hx: number; hz: number }
  /** A glass wall that only some ball sizes can pass: 'small' lets sizes below `cut` through, 'big' lets sizes from `cut` up through. */
  | { id: number; kind: 'filter'; x: number; z: number; hx: number; hz: number; pass: 'small' | 'big'; cut: number }
  /** A full-width door that is open for `open` seconds, then shut for `closed`: the way through only opens for a fixed time. */
  | { id: number; kind: 'door'; x: number; z: number; hx: number; hz: number; open: number; closed: number; offset: number }
  /** A magnetic disc: pulls balls in (push = 1) or throws them away (push = -1) within radius r. */
  | { id: number; kind: 'magnet'; x: number; z: number; r: number; push: 1 | -1 }
  | { id: number; kind: 'portal'; x: number; z: number; r: number; tx: number; tz: number; tone: 0 | 1 };

/** Floor material: ice is slippery, sticky grips, bouncy rebounds. */
export type Surface = 'normal' | 'ice' | 'sticky' | 'bouncy' | 'conveyor';

export type Tier = 'normal' | 'hard' | 'boss';

export type Side = '+x' | '-x' | '+z' | '-z';

/** The one open stretch of wall where balls spill onto the next tray. `from`/`to` run along the wall (assembly coords). */
export interface Exit {
  side: Side;
  from: number;
  to: number;
}

export interface Tray {
  index: number;
  cx: number;
  cy: number;
  cz: number;
  /** Size along x and z. */
  w: number;
  d: number;
  holes: Hole[];
  obstacles: Obstacle[];
  surface: Surface;
  /** Direction a conveyor floor carries balls (unit vector). */
  flow?: { dx: number; dz: number };
  /** Sides with no wall at all: a ball can roll off them (onto a lower tray, or into the void). */
  open: Side[];
  exit: Exit | null;
}

export interface BallSpec {
  radius: number;
  /** Index into Level.classRadii (0 = smallest). */
  cls: number;
}

export interface Level {
  levelNumber: number;
  seed: number;
  theme: number;
  tier: Tier;
  classRadii: number[];
  balls: BallSpec[];
  trays: Tray[];
  wallHeight: number;
  /** Balls that must reach a goal hole to win, and how many may be lost to traps. */
  required: number;
  allowedLoss: number;
  /** Per ball size: how many must reach a goal, and how many may be lost. Every size must be satisfied to win. */
  classNeed: number[];
  classAllowed: number[];
  maxTilt: number;
  /** Where the starting pile is dropped on the top tray. */
  spawn: { x0: number; x1: number; z0: number; z1: number };
  bounds: { min: [number, number, number]; max: [number, number, number] };
  abyssY: number;
  fallback: boolean;
}

export type LevelStatus = 'playing' | 'won' | 'failed';

export interface GameSettings {
  sound: boolean;
  haptics: boolean;
  reducedMotion: boolean;
  /** Tilt the board by tilting the phone (gyroscope). */
  gyro: boolean;
  /** Quiet background music while playing. */
  music: boolean;
  /** Ball finish, unlocked with stars (see lib/skins.ts). */
  skin: string;
  /** How far a drag tilts the board: 0.6 gentle, 1 normal, 1.5 quick, 2 very quick. */
  sensitivity: number;
}

export interface GameStats {
  levelsCompleted: number;
  ballsPlayed: number;
  ballsCollected: number;
  attempts: number;
  playSeconds: number;
}

export interface Checkpoint {
  levelNumber: number;
  seed: number;
  random: boolean;
}

export interface SaveData {
  version: number;
  settings: GameSettings;
  stats: GameStats;
  highestUnlocked: number;
  currentLevel: number;
  completedLevels: number[];
  unlockedCosmetics: string[];
  /** Fastest win in seconds, keyed by level number. */
  bestTimes: Record<string, number>;
  /** Best star rating (1-3) per level number. */
  stars: Record<string, number>;
  checkpoint: Checkpoint | null;
}

export const SAVE_VERSION = 1;

export const defaultSettings = (): GameSettings => ({ sound: true, haptics: true, reducedMotion: false, gyro: false, music: false, skin: 'classic', sensitivity: 1 });

export const defaultStats = (): GameStats => ({
  levelsCompleted: 0,
  ballsPlayed: 0,
  ballsCollected: 0,
  attempts: 0,
  playSeconds: 0,
});

export const defaultSave = (): SaveData => ({
  version: SAVE_VERSION,
  settings: defaultSettings(),
  stats: defaultStats(),
  highestUnlocked: 1,
  currentLevel: 1,
  completedLevels: [],
  unlockedCosmetics: [],
  bestTimes: {},
  stars: {},
  checkpoint: null,
});

/** Snapshot the UI reads; the simulation pushes one whenever something meaningful changes. */
export interface GameSnapshot {
  status: LevelStatus;
  total: number;
  collected: number;
  lost: number;
  required: number;
  allowedLoss: number;
  /** Balls still rolling around on the trays. */
  onBoard: number;
  /** Losses by cause: swallowed by a red hole, or fell off an open edge. */
  lostTrap: number;
  lostVoid: number;
  elapsed: number;
  /** Per ball size progress. */
  classes: Array<{ collected: number; lost: number; need: number; allowed: number }>;
}
