'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import type { GameSettings, GameSnapshot, Level } from '@/lib/types';
import { BALL_COLORS, THEMES, colorSlot } from '@/lib/themes';
import { FIXED_DT, loadRapier } from '@/lib/physics/physicsWorld';
import { Simulation, type SimEvent } from '@/lib/physics/simulation';
import { haptic, sound } from '@/lib/audio/audioManager';
import TrayMesh from './Tray';
import { isMover } from '@/lib/physics/physicsWorld';
import { hazardTexture } from './materials';
import CameraController, { DEFAULT_EL, MIN_EL, TOP_EL, defaultView, type ViewState } from './CameraController';

/** Input sources are summed, so keys, a drag and phone tilt can all steer the board. */
export interface GameController {
  setPointer(x: number, z: number): void;
  /** Current drag tilt, which the board keeps after you let go. */
  getPointer(): [number, number];
  setKeys(x: number, z: number): void;
  setDevice(x: number, z: number): void;
  resetCamera(): void;
  /** Turn the view by quarter-steps (-1 left, +1 right). */
  rotate(dir: -1 | 1): void;
  /** Free orbit by radians. */
  orbit(dAz: number, dEl: number): void;
  zoomBy(factor: number): void;
  toggleTop(): void;
  /** True when a screen point is over the board (drag tilts), false over empty background (drag turns the view). */
  hitsBoard(clientX: number, clientY: number): boolean;
}

interface Props {
  level: Level;
  /** Bump to restart the same level. */
  attempt: number;
  paused: boolean;
  settings: GameSettings;
  controllerRef: MutableRefObject<GameController | null>;
  onSnapshot: (s: GameSnapshot) => void;
}

export default function GameScene({ level, attempt, paused, settings, controllerRef, onSnapshot }: Props) {
  const theme = THEMES[level.theme % THEMES.length];
  const simRef = useRef<Simulation | null>(null);
  const acc = useRef(0);
  const marbles = useRef<THREE.InstancedMesh>(null);
  const board = useRef<THREE.Group>(null);
  const input = useRef({ ptr: [0, 0], key: [0, 0], dev: [0, 0] });
  const { camera, gl } = useThree();
  const view = useRef<ViewState>({ target: defaultView(), cur: { ...defaultView(), zoom: 1.3 } });
  const runId = `${level.seed}-${level.levelNumber}-${attempt}`;
  const settingsRef = useRef(settings);
  const snapCb = useRef(onSnapshot);
  useEffect(() => { settingsRef.current = settings; snapCb.current = onSnapshot; }, [settings, onSnapshot]);

  const center = useMemo(() => {
    const { min, max } = level.bounds;
    return new THREE.Vector3((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
  }, [level]);

  useEffect(() => {
    let cancelled = false;
    let sim: Simulation | null = null;
    acc.current = 0;
    input.current.ptr = [0, 0]; // every run starts with a flat board
    loadRapier().then((R) => {
      if (cancelled) return;
      sim = new Simulation(R, level);
      simRef.current = sim;
      const push = () => snapCb.current(sim!.snapshot());
      sim.onEvent = (e: SimEvent) => {
        const st = settingsRef.current;
        if (e === 'collected') { sound.cup(); haptic(15, st.haptics); }
        else if (e === 'lost') { sound.lose(); haptic(30, st.haptics); }
        else if (e === 'won') { sound.win(); haptic([30, 40, 60], st.haptics); }
        else if (e === 'failed') sound.fail();
        push();
      };
      push();
    });
    return () => {
      cancelled = true;
      simRef.current = null;
      sim?.dispose();
    };
    // The level + attempt define a run; callbacks are read through refs so they never restart it.
  }, [level, attempt]);

  useEffect(() => {
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const QUARTER = Math.PI / 4;
    controllerRef.current = {
      setPointer: (x, z) => { input.current.ptr = [x, z]; },
      getPointer: () => [input.current.ptr[0], input.current.ptr[1]],
      setKeys: (x, z) => { input.current.key = [x, z]; },
      setDevice: (x, z) => { input.current.dev = [x, z]; },
      resetCamera: () => { view.current.target = defaultView(); },
      rotate: (dir) => { const t = view.current.target; t.az = Math.round(t.az / QUARTER + dir) * QUARTER; },
      orbit: (dAz, dEl) => { const t = view.current.target; t.az += dAz; t.el = clamp(t.el + dEl, MIN_EL, TOP_EL); },
      zoomBy: (f) => { const t = view.current.target; t.zoom = clamp(t.zoom * f, 0.5, 1.5); },
      hitsBoard: (cx, cy) => {
        if (!board.current) return true;
        const r = gl.domElement.getBoundingClientRect();
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
        return ray.intersectObject(board.current, true).length > 0;
      },
      toggleTop: () => { const t = view.current.target; t.el = t.el > (DEFAULT_EL + TOP_EL) / 2 ? DEFAULT_EL : TOP_EL; },
    };
    return () => { controllerRef.current = null; };
  }, [controllerRef, camera, gl]);

  // Per-ball colour by size class.
  useLayoutEffect(() => {
    const mesh = marbles.current;
    if (!mesh) return;
    const c = new THREE.Color();
    level.balls.forEach((b, i) => mesh.setColorAt(i, c.set(BALL_COLORS[colorSlot(level, b.cls)])));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [level, runId]);

  const movers = useMemo(() => level.trays.flatMap((t) => t.obstacles.filter(isMover)), [level]);
  const moverRefs = useRef<Array<THREE.Object3D | null>>([]);
  const hazard = useMemo(() => hazardTexture(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const stars = useMemo(() => {
    const n = 160;
    const a = new Float32Array(n * 3);
    let s = level.seed | 1;
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) | 0) >>> 0) / 4294967296;
    for (let i = 0; i < n; i++) {
      a[i * 3] = center.x + (rnd() - 0.5) * 140;
      a[i * 3 + 1] = center.y - 30 + rnd() * 70;
      a[i * 3 + 2] = center.z - 40 - rnd() * 40;
    }
    return a;
  }, [level, center]);

  useFrame((_, dt) => {
    const sim = simRef.current;
    if (sim) {
      // Tilt input is relative to the screen, so turn it by however far the camera has orbited.
      const i = input.current;
      const x = i.ptr[0] + i.key[0] + i.dev[0];
      const z = i.ptr[1] + i.key[1] + i.dev[1];
      const a = view.current.cur.az;
      sim.setInput(x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a));
    }
    if (sim && !paused) {
      acc.current += Math.min(dt, 1 / 30); // below 30 fps the game slows down instead of piling up physics work
      while (acc.current >= FIXED_DT) {
        sim.step();
        acc.current -= FIXED_DT;
      }
    }
    if (board.current && sim) board.current.quaternion.copy(sim.quat);
    if (sim) {
      sim.phys.movers.forEach((s, i) => {
        const m = moverRefs.current[i];
        if (!m) return;
        const p = s.body.translation();
        const q = s.body.rotation();
        m.position.set(p.x, p.y, p.z);
        m.quaternion.set(q.x, q.y, q.z, q.w);
      });
    }
    const mesh = marbles.current;
    if (mesh) {
      for (let i = 0; i < level.balls.length; i++) {
        if (sim && !sim.isHidden(i)) {
          const b = sim.phys.balls[i];
          const p = b.translation();
          const q = b.rotation();
          dummy.position.set(p.x, p.y, p.z);
          dummy.quaternion.set(q.x, q.y, q.z, q.w);
          dummy.scale.setScalar(level.balls[i].radius);
        } else dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  const { min, max } = level.bounds;
  const span = Math.max(max[0] - min[0], max[2] - min[2], max[1] - min[1]);
  return (
    <>
      <CameraController level={level} reducedMotion={settings.reducedMotion} view={view} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[center.x + 8, center.y + 30, center.z + 16]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-span * 0.75}
        shadow-camera-right={span * 0.75}
        shadow-camera-top={span * 0.75}
        shadow-camera-bottom={-span * 0.75}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-bias={-0.0006}
        target-position={[center.x, center.y, center.z]}
      />
      {/* Procedural reflections: no downloaded HDRI, so it works offline. */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} color="#bfa8ff" position={[0, 8, 6]} scale={[16, 5, 1]} />
        <Lightformer form="rect" intensity={2} color="#6ff5ee" position={[-8, 3, 4]} scale={[4, 8, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#ffffff" position={[8, 4, 3]} scale={[3, 6, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ff9ad5" position={[0, -5, 4]} scale={[14, 2, 1]} />
      </Environment>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.25} sizeAttenuation transparent opacity={0.7} depthWrite={false} />
      </points>

      {/* The whole board tips as one piece, about its centre. */}
      <group ref={board} position={center}>
        <group position={[-center.x, -center.y, -center.z]}>
          {level.trays.map((t) => (
            <TrayMesh key={t.index} tray={t} level={level} theme={theme} />
          ))}
          {movers.map((o, i) => (
            <group key={`${runId}-${o.id}`} ref={(m) => { moverRefs.current[i] = m; }} position={[o.x, 0, o.z]}>
              {o.kind === 'sweeper' && (
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[o.hx * 2, level.wallHeight, o.hz * 2]} />
                  <meshStandardMaterial color="#c86bff" emissive="#8a1fe0" emissiveIntensity={0.55} roughness={0.35} metalness={0.3} />
                </mesh>
              )}
              {o.kind === 'gate' && (
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[o.hx * 2, level.wallHeight, o.hz * 2]} />
                  <meshStandardMaterial map={hazard} roughness={0.5} metalness={0.2} />
                </mesh>
              )}
              {o.kind === 'door' && (
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[o.hx * 2, level.wallHeight, o.hz * 2]} />
                  <meshStandardMaterial color="#ffb020" emissive="#ff7a00" emissiveIntensity={0.7} roughness={0.3} metalness={0.3} transparent opacity={0.88} />
                </mesh>
              )}
              {o.kind === 'spinner' && (
                <>
                  <mesh castShadow receiveShadow>
                    <boxGeometry args={[o.len * 2, level.wallHeight, 0.28]} />
                    <meshStandardMaterial color="#31e0ff" emissive="#0aa4c8" emissiveIntensity={0.6} roughness={0.3} metalness={0.4} />
                  </mesh>
                  <mesh castShadow receiveShadow>
                    <boxGeometry args={[0.28, level.wallHeight, o.len * 2]} />
                    <meshStandardMaterial color="#31e0ff" emissive="#0aa4c8" emissiveIntensity={0.6} roughness={0.3} metalness={0.4} />
                  </mesh>
                  <mesh position={[0, level.wallHeight / 2 + 0.05, 0]}>
                    <cylinderGeometry args={[0.32, 0.32, 0.12, 24]} />
                    <meshStandardMaterial color="#ffffff" emissive="#9ff3ff" emissiveIntensity={0.8} />
                  </mesh>
                </>
              )}
            </group>
          ))}
          <instancedMesh key={runId} ref={marbles} args={[undefined, undefined, level.balls.length]} frustumCulled={false} castShadow>
            <sphereGeometry args={[1, 28, 20]} />
            <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.2} envMapIntensity={1.6} />
          </instancedMesh>
        </group>
      </group>
    </>
  );
}
