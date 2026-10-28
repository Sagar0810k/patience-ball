'use client';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Level, Tray } from '@/lib/types';
import { CLASS_ACCENT, colorSlot, type Theme } from '@/lib/themes';
import { PLATE_T, buildPlateGeometry, trayWalls } from '@/lib/levels/geometry';
import { hatchTexture, hazardTexture, ringTexture, gridTexture } from './materials';

interface Props {
  tray: Tray;
  level: Level;
  theme: Theme;
}

const PORTAL_TONES = ['#35e6ff', '#ff9a3d'];

/** A portal: glowing disc, a fixed outer ring and an inner ring that keeps turning. */
function Portal({ r, tone, position }: { r: number; tone: 0 | 1; position: [number, number, number] }) {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (spin.current) spin.current.rotation.y += dt * 2.5; });
  const c = PORTAL_TONES[tone];
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <circleGeometry args={[r, 40]} />
        <meshBasicMaterial color={c} transparent opacity={0.4} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <torusGeometry args={[r, 0.07, 10, 40]} />
        <meshBasicMaterial color={c} toneMapped={false} />
      </mesh>
      <group ref={spin} position={[0, 0.03, 0]}>
        {[0, 1, 2].map((k) => (
          <mesh key={k} rotation={[-Math.PI / 2, 0, (k * Math.PI * 2) / 3]} position={[Math.cos((k * Math.PI * 2) / 3) * r * 0.55, 0, -Math.sin((k * Math.PI * 2) / 3) * r * 0.55]}>
            <circleGeometry args={[r * 0.16, 12]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function TrayMesh({ tray, level, theme }: Props) {
  const geo = useMemo(() => buildPlateGeometry(tray), [tray]);
  useEffect(() => () => geo.dispose(), [geo]);
  const walls = useMemo(() => trayWalls(level, tray), [level, tray]);
  const mats = useMemo(() => {
    const t = level.trays.length > 1 ? tray.index / (level.trays.length - 1) : 0;
    const top = new THREE.Color(theme.top).lerp(new THREE.Color(theme.deep), t * 0.85);
    // The floor material shows in the colour and shine of the tray.
    if (tray.surface === 'ice') top.lerp(new THREE.Color('#e6f8ff'), 0.7);
    else if (tray.surface === 'sticky') top.lerp(new THREE.Color('#a9794a'), 0.7);
    else if (tray.surface === 'conveyor') top.lerp(new THREE.Color('#3fd6c0'), 0.55);
    else if (tray.surface === 'bouncy') top.lerp(new THREE.Color('#ff6fd0'), 0.6);
    const rough = tray.surface === 'ice' ? 0.04 : tray.surface === 'sticky' ? 0.95 : 0.4;
    return {
      plate: [
        new THREE.MeshStandardMaterial({ color: top, map: gridTexture(), roughness: rough, metalness: tray.surface === 'ice' ? 0.35 : 0.15, emissive: tray.surface === 'bouncy' ? '#ff2fb8' : '#000000', emissiveIntensity: 0.18 }),
        new THREE.MeshStandardMaterial({ color: '#0a0d24', roughness: 0.6, metalness: 0.3 }),
      ] as THREE.Material[],
      wall: new THREE.MeshStandardMaterial({ color: new THREE.Color(theme.deep).lerp(new THREE.Color('#3b3f86'), 0.55), emissive: theme.deep, emissiveIntensity: 0.15, roughness: 0.35, metalness: 0.45 }),
      goal: new THREE.MeshStandardMaterial({ color: '#00d96b', emissive: '#00ff7b', emissiveIntensity: 1, toneMapped: false }),
      trap: new THREE.MeshStandardMaterial({ color: '#b3173f', emissive: '#ff2a5c', emissiveIntensity: 0.9 }),
      beam: new THREE.MeshBasicMaterial({ color: '#16ff86', transparent: true, opacity: 0.22, toneMapped: false, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
      peg: new THREE.MeshStandardMaterial({ color: '#ffb02e', emissive: '#ff8a00', emissiveIntensity: 0.35, roughness: 0.35, metalness: 0.3 }),
      bar: new THREE.MeshStandardMaterial({ map: hazardTexture(), roughness: 0.5, metalness: 0.2 }),
      bumper: new THREE.MeshStandardMaterial({ color: '#ff4fa3', emissive: '#ff1f86', emissiveIntensity: 0.6, roughness: 0.25, metalness: 0.3 }),
      cap: new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffd36b', emissiveIntensity: 0.5, roughness: 0.3 }),
      ice: new THREE.MeshStandardMaterial({ color: '#c4efff', roughness: 0.02, metalness: 0.5, emissive: '#7fd6ff', emissiveIntensity: 0.25 }),
      rough: new THREE.MeshStandardMaterial({ map: hatchTexture(), roughness: 1, metalness: 0 }),
      bouncy: new THREE.MeshStandardMaterial({ map: ringTexture(), emissive: '#ff2fb8', emissiveIntensity: 0.25, roughness: 0.4 }),
      edge: new THREE.MeshBasicMaterial({ color: '#ff5d3a', toneMapped: false }),
      glassSmall: new THREE.MeshStandardMaterial({ color: '#35e6e9', emissive: '#35e6e9', emissiveIntensity: 0.6, transparent: true, opacity: 0.5, roughness: 0.1 }),
      glassBig: new THREE.MeshStandardMaterial({ color: '#ffb02e', emissive: '#ffb02e', emissiveIntensity: 0.6, transparent: true, opacity: 0.5, roughness: 0.1 }),
      mud: new THREE.MeshStandardMaterial({ color: '#6b4a2b', roughness: 1, transparent: true, opacity: 0.92 }),
      mudDark: new THREE.MeshStandardMaterial({ color: '#4a3119', roughness: 1 }),
      pad: new THREE.MeshStandardMaterial({ color: '#ffe14d', emissive: '#ffc400', emissiveIntensity: 0.9, toneMapped: false }),
      accent: CLASS_ACCENT.map((c) => new THREE.MeshBasicMaterial({ color: c })),
      glass: CLASS_ACCENT.map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.3, depthWrite: false })),
      marker: new THREE.MeshBasicMaterial({ color: '#16ff86', toneMapped: false, depthTest: false }),
    };
  }, [level.trays.length, tray.index, theme, tray.surface]);
  useEffect(() => () => { mats.plate.forEach((m) => m.dispose()); mats.wall.dispose(); mats.goal.dispose(); mats.trap.dispose(); mats.beam.dispose(); mats.peg.dispose(); mats.bar.dispose(); mats.bumper.dispose(); mats.cap.dispose(); mats.mud.dispose(); mats.edge.dispose(); mats.glassSmall.dispose(); mats.glassBig.dispose(); mats.ice.dispose(); mats.rough.dispose(); mats.bouncy.dispose(); mats.mudDark.dispose(); mats.pad.dispose(); mats.accent.forEach((m) => m.dispose()); mats.glass.forEach((m) => m.dispose()); mats.marker.dispose(); }, [mats]);

  const matsRef = useRef(mats);
  useEffect(() => { matsRef.current = mats; }, [mats]);
  const hasGoal = tray.holes.some((h) => h.kind === 'goal');
  const hasBumper = tray.obstacles.some((o) => o.kind === 'bumper');
  // Goal holes and bumpers pulse so they stand out.
  useFrame(({ clock }) => {
    const s = Math.sin(clock.elapsedTime * 3);
    if (hasGoal) {
      matsRef.current.goal.emissiveIntensity = 0.9 + 0.4 * s;
      matsRef.current.beam.opacity = 0.3 + 0.1 * s;
    }
    if (hasBumper) matsRef.current.bumper.emissiveIntensity = 0.7 + 0.45 * Math.sin(clock.elapsedTime * 5);
  });
  const beamH = Math.max(3, level.bounds.max[1] - tray.cy + 3);

  return (
    <group position={[tray.cx, tray.cy, tray.cz]}>
      <mesh geometry={geo} material={mats.plate} castShadow receiveShadow />
      {walls.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]} material={mats.wall} castShadow receiveShadow>
          <boxGeometry args={[b.hx * 2, b.hy * 2, b.hz * 2]} />
        </mesh>
      ))}
      {/* A glowing strip marks every edge that has no wall. */}
      {tray.open.map((s) => {
        const sg = s[0] === '+' ? 1 : -1;
        const alongX = s[1] === 'x';
        return (
          <mesh key={s} position={[alongX ? sg * (tray.w / 2 - 0.06) : 0, PLATE_T / 2 + 0.012, alongX ? 0 : sg * (tray.d / 2 - 0.06)]} material={mats.edge} raycast={() => null}>
            <boxGeometry args={[alongX ? 0.12 : tray.w, 0.02, alongX ? tray.d : 0.12]} />
          </mesh>
        );
      })}
      {tray.obstacles.map((o) => {
        const hh = level.wallHeight / 2;
        const y = PLATE_T / 2 + hh;
        const at: [number, number, number] = [o.x - tray.cx, y, o.z - tray.cz];
        if (o.kind === 'peg') {
          return (
            <group key={o.id} position={at}>
              <mesh material={mats.peg} castShadow receiveShadow>
                <cylinderGeometry args={[o.r, o.r * 1.12, level.wallHeight, 28]} />
              </mesh>
              <mesh position={[0, hh + 0.03, 0]} material={mats.cap}>
                <cylinderGeometry args={[o.r * 0.78, o.r * 0.78, 0.07, 28]} />
              </mesh>
            </group>
          );
        }
        if (o.kind === 'bumper') {
          return (
            <group key={o.id} position={at}>
              <mesh material={mats.bumper} castShadow receiveShadow>
                <cylinderGeometry args={[o.r, o.r * 1.1, level.wallHeight, 32]} />
              </mesh>
              <mesh position={[0, hh * 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.cap}>
                <torusGeometry args={[o.r * 1.05, 0.05, 8, 32]} />
              </mesh>
              <mesh position={[0, hh + 0.04, 0]} material={mats.cap}>
                <sphereGeometry args={[o.r * 0.55, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              </mesh>
            </group>
          );
        }
        if (o.kind === 'patch') {
          return (
            <mesh key={o.id} position={[o.x - tray.cx, PLATE_T / 2 + 0.02, o.z - tray.cz]} material={mats[o.mat]} receiveShadow>
              {o.shape === 'round' ? <cylinderGeometry args={[o.hx, o.hx, 0.04, 40]} /> : <boxGeometry args={[o.hx * 2, 0.04, o.hz * 2]} />}
            </mesh>
          );
        }
        if (o.kind === 'filter') {
          // Glass wall: cyan lets the small sizes through, amber lets the big ones through.
          return (
            <mesh key={o.id} position={at} material={o.pass === 'small' ? mats.glassSmall : mats.glassBig} receiveShadow>
              <boxGeometry args={[o.hx * 2, level.wallHeight, o.hz * 2]} />
            </mesh>
          );
        }
        if (o.kind === 'block') {
          return (
            <mesh key={o.id} position={at} material={mats.wall} castShadow receiveShadow>
              <boxGeometry args={[o.hx * 2, level.wallHeight, o.hz * 2]} />
            </mesh>
          );
        }
        if (o.kind === 'bar') {
          return (
            <mesh key={o.id} position={at} material={mats.bar} castShadow receiveShadow>
              <boxGeometry args={[o.hx * 2, level.wallHeight, o.hz * 2]} />
            </mesh>
          );
        }
        if (o.kind === 'mud') {
          return (
            <group key={o.id} position={[o.x - tray.cx, PLATE_T / 2 + 0.025, o.z - tray.cz]}>
              <mesh material={mats.mud} receiveShadow>
                <boxGeometry args={[o.hx * 2, 0.05, o.hz * 2]} />
              </mesh>
              {[[-0.45, -0.3, 0.22], [0.2, 0.35, 0.3], [0.55, -0.25, 0.16]].map(([fx, fz, rr], k) => (
                <mesh key={k} position={[fx * o.hx, 0.03, fz * o.hz]} material={mats.mudDark}>
                  <cylinderGeometry args={[rr, rr, 0.03, 14]} />
                </mesh>
              ))}
            </group>
          );
        }
        if (o.kind === 'magnet') {
          const c = o.push > 0 ? '#9b5cff' : '#ff8a3d';
          return (
            <group key={o.id} position={[o.x - tray.cx, PLATE_T / 2 + 0.03, o.z - tray.cz]}>
              {[1, 0.6, 0.25].map((f) => (
                <mesh key={f} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[o.r * f - 0.07, o.r * f, 40]} />
                  <meshBasicMaterial color={c} transparent opacity={0.8} toneMapped={false} />
                </mesh>
              ))}
              <mesh>
                <cylinderGeometry args={[0.28, 0.28, 0.14, 20]} />
                <meshBasicMaterial color={c} toneMapped={false} />
              </mesh>
            </group>
          );
        }
        if (o.kind === 'portal') return <Portal key={o.id} r={o.r} tone={o.tone} position={[o.x - tray.cx, PLATE_T / 2 + 0.03, o.z - tray.cz]} />;
        if (o.kind === 'boost') {
          // Flat glowing pad with arrow heads pointing the way it pushes.
          return (
            <group key={o.id} position={[o.x - tray.cx, PLATE_T / 2 + 0.02, o.z - tray.cz]} rotation={[0, Math.atan2(-o.dz, o.dx), 0]}>
              <mesh material={mats.pad}>
                <boxGeometry args={[(o.dx ? o.hx : o.hz) * 2, 0.04, (o.dx ? o.hz : o.hx) * 2]} />
              </mesh>
              {[-0.35, 0.25].map((a) => (
                <mesh key={a} position={[a, 0.09, 0]} rotation={[0, 0, -Math.PI / 2]}>
                  <coneGeometry args={[0.28, 0.4, 3]} />
                  <meshBasicMaterial color="#6a4b00" toneMapped={false} />
                </mesh>
              ))}
            </group>
          );
        }
        return null; // sweepers, spinners and gates move, so GameScene draws them
      })}
      {tray.flow && [-1, 0, 1].flatMap((a) => [-1, 0, 1].map((b) => (
        <mesh key={`${a},${b}`} position={[a * tray.w * 0.3, PLATE_T / 2 + 0.02, b * tray.d * 0.3]} rotation={[0, Math.atan2(-tray.flow!.dz, tray.flow!.dx), -Math.PI / 2]}>
          <coneGeometry args={[0.45, 0.8, 3]} />
          <meshBasicMaterial color="#0b6b5e" transparent opacity={0.55} toneMapped={false} />
        </mesh>
      )))}
      {tray.holes.map((h) => {
        const pos: [number, number, number] = [h.x - tray.cx, PLATE_T / 2 + 0.008, h.z - tray.cz];
        const goal = h.kind === 'goal';
        return (
          <group key={h.id}>
            <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]} material={goal ? mats.goal : mats.trap}>
              <ringGeometry args={[h.r, h.r + (goal ? 0.16 : 0.09), 48]} />
            </mesh>
            {goal && (
              <>
                {/* Ring in the colour of the ball size this hole is made for. */}
                <mesh position={[pos[0], pos[1] + 0.004, pos[2]]} rotation={[-Math.PI / 2, 0, 0]} material={mats.accent[colorSlot(level, h.cls ?? 0)]}>
                  <ringGeometry args={[h.r + 0.16, h.r + 0.3, 48]} />
                </mesh>
                {/* Light beam: visible above the upper trays, and from any angle. */}
                <mesh position={[pos[0], PLATE_T / 2 + beamH / 2, pos[2]]} material={mats.beam} renderOrder={5} raycast={() => null}>
                  <cylinderGeometry args={[h.r * 0.95, h.r * 0.95, beamH, 32, 1, true]} />
                </mesh>
                {/* Arrow above the beam, drawn through everything, so a goal can never hide behind a tray. */}
                <mesh position={[pos[0], PLATE_T / 2 + beamH + 0.5, pos[2]]} rotation={[Math.PI, 0, 0]} material={mats.marker} renderOrder={6} raycast={() => null}>
                  <coneGeometry args={[0.45, 0.9, 4]} />
                </mesh>
                {/* Glass lid: smaller balls roll over this hole instead of falling in. */}
                {(h.cls ?? 0) > 0 && (
                  <mesh position={[pos[0], pos[1] + 0.01, pos[2]]} rotation={[-Math.PI / 2, 0, 0]} material={mats.glass[colorSlot(level, h.cls ?? 0)]} raycast={() => null}>
                    <circleGeometry args={[h.r, 40]} />
                  </mesh>
                )}
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

export default memo(TrayMesh);
