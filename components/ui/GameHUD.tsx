'use client';
import { useEffect, useRef, useState } from 'react';
import type { GameSnapshot } from '@/lib/types';
import { CLASS_ACCENT } from '@/lib/themes';
import { colorSlot } from '@/lib/themes';
import Icon from './Icons';

interface Props {
  label: string;
  tier: 'normal' | 'hard' | 'boss';
  classCount: number;
  snap: GameSnapshot | null;
  attempt: number;
  firstLevel: boolean;
  sound: boolean;
  sensitivity?: number;
  onSensitivity?: () => void;
  canTiltPhone: boolean;
  phoneTilt: boolean;
  onPause: () => void;
  onRestart: () => void;
  onCamera: () => void;
  onOrbit: (dAz: number, dEl: number) => void;
  onFlat: () => void;
  onSound: () => void;
  onPhoneTilt: () => void;
  onHelp: () => void;
  readTilt: () => [number, number];
}

/** A strip you drag sideways to turn the view (and up or down to change the height of the camera). */
function RotatePad({ onOrbit }: { onOrbit: (dAz: number, dEl: number) => void }) {
  const last = useRef<{ x: number; y: number } | null>(null);
  return (
    <div
      className="rotate-pad"
      role="slider"
      aria-label="Rotate view. Drag sideways."
      aria-valuenow={0}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); last.current = { x: e.clientX, y: e.clientY }; }}
      onPointerMove={(e) => {
        const l = last.current;
        if (!l) return;
        onOrbit(-(e.clientX - l.x) * 0.014, (e.clientY - l.y) * 0.008);
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={() => { last.current = null; }}
      onPointerCancel={() => { last.current = null; }}
    >
      <span aria-hidden>◀</span> turn view <span aria-hidden>▶</span>
    </div>
  );
}

/** A small dial showing which way (and how far) the board is tipped. Updates itself every frame without re-rendering. */
function TiltDial({ readTilt }: { readTilt: () => [number, number] }) {
  const dot = useRef<HTMLElement>(null);
  const read = useRef(readTilt);
  useEffect(() => { read.current = readTilt; }, [readTilt]);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const [x, z] = read.current();
      if (dot.current) dot.current.style.transform = `translate(${x * 15}px, ${z * 15}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div className="dial" aria-hidden title="Board tilt"><i ref={dot} /></div>;
}

const COMBO = ['', '', 'Double!', 'Triple!', 'Quad!', 'Awesome!', 'Amazing!', 'Unstoppable!'];

/** Floating combo text when balls drop in quick succession (fired by the scene as a window event). */
function ComboPop() {
  const [c, setC] = useState<{ n: number; id: number } | null>(null);
  useEffect(() => {
    const on = (e: Event) => setC({ n: (e as CustomEvent<number>).detail, id: performance.now() });
    window.addEventListener('pb-combo', on);
    return () => window.removeEventListener('pb-combo', on);
  }, []);
  useEffect(() => {
    if (!c) return;
    const t = setTimeout(() => setC(null), 1100);
    return () => clearTimeout(t);
  }, [c]);
  if (!c) return null;
  return <div key={c.id} className="combo" aria-hidden>{COMBO[Math.min(c.n, COMBO.length - 1)]} <small>×{c.n}</small></div>;
}

export default function GameHUD({ label, tier, classCount, snap, attempt, firstLevel, sound, canTiltPhone, phoneTilt, onPause, onRestart, onCamera, onOrbit, onFlat, onSound, onPhoneTilt, onHelp, readTilt }: Props) {
  const [touched, setTouched] = useState(false);
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let t = setTimeout(() => setIdle(true), 5000);
    const wake = () => { setIdle(false); clearTimeout(t); t = setTimeout(() => setIdle(true), 5000); };
    window.addEventListener('pointerdown', wake); window.addEventListener('pointermove', wake); window.addEventListener('keydown', wake);
    return () => { clearTimeout(t); window.removeEventListener('pointerdown', wake); window.removeEventListener('pointermove', wake); window.removeEventListener('keydown', wake); };
  }, []);
  useEffect(() => { const f = () => setTouched(true); window.addEventListener('pointerdown', f, { once: true }); return () => window.removeEventListener('pointerdown', f); }, []);
  const pct = snap ? Math.min(100, (snap.collected / snap.required) * 100) : 0;
  return (
    <>
      <header className={`hud-top${idle ? ' quiet' : ''}`}>
        <button className="btn icon" onClick={onPause} aria-label="Pause"><Icon name="pause" /></button>
        <div className="hud-mid">
          <div className="hud-title">
            <strong>{label}</strong>
            {snap && <span><b>{snap.collected}</b> / {snap.required} home<em> · {snap.onBoard} on board</em></span>}
          </div>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={snap?.required ?? 0} aria-valuenow={snap?.collected ?? 0} aria-label="Balls brought home">
            <i style={{ width: `${pct}%` }} />
          </div>
          {snap && (
            <div className="classes" aria-label="Progress for each ball size">
              <em title="Balls you can still lose">spare</em>
              {snap.classes.map((c, j) => {
                const spare = Math.max(0, c.allowed - c.lost);
                return (
                  <span key={`${j}-${c.lost}`} className={`cls${c.collected >= c.need ? ' done' : ''}${c.lost > 0 ? ' hit' : ''}`} style={{ ['--c' as string]: CLASS_ACCENT[colorSlot({ tier, classRadii: new Array(classCount) }, j)] }}>
                    <i className="dot" style={{ width: 10 + j * 4, height: 10 + j * 4 }} aria-hidden />
                    {classCount > 1 && <b>{c.collected}/{c.need}</b>}
                    {Array.from({ length: Math.min(c.allowed, 8) }, (_, p) => <u key={p} className={p < spare ? '' : 'gone'} aria-hidden />)}{c.allowed > 8 && <small className="more">+{c.allowed - 8}</small>}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </header>
      {tier !== 'normal' && (
        <div className={`banner ${tier}`} key={attempt} role="status">
          {tier === 'boss' ? 'BOSS LEVEL · a giant gold ball must reach the biggest hole' : 'HARD LEVEL · fewer spare balls, more obstacles'}
        </div>
      )}
      <footer className={`hud-bottom${idle ? ' quiet' : ''}`}>
        {!touched && <p className="hint" key={attempt}>
          <span className="hand" aria-hidden><Icon name="tilt" size={16} /></span> {firstLevel ? 'Drag the board to tilt it (it stays tilted) · double-tap to level it' : 'Drag board: tilt · strip below: rotate view · double-tap: level'}
        </p>}
        <div className="tools">
          <button className="btn icon" onClick={onCamera} aria-label="Reset view"><Icon name="view" /></button>
          <button className="btn icon" onClick={onFlat} aria-label="Level the board"><Icon name="level" /></button>
          <RotatePad onOrbit={onOrbit} />
          <button className="btn icon" onClick={onRestart} aria-label="Restart level"><Icon name="restart" /></button>
          <button className="btn icon" onClick={onSound} aria-pressed={sound} aria-label={sound ? 'Mute sound' : 'Turn sound on'}><Icon name={sound ? 'on' : 'off'} /></button>
          {canTiltPhone && <button className="btn icon" aria-pressed={phoneTilt} onClick={onPhoneTilt} aria-label={phoneTilt ? 'Turn gyro tilt off' : 'Turn gyro tilt on'}><Icon name="phone" /></button>}
          <button className="btn icon" onClick={onHelp} aria-label="What are the obstacles on this level?"><Icon name="help" /></button>
        </div>
      </footer>
      <ComboPop />
      {phoneTilt && <TiltDial readTilt={readTilt} />}
      <div className="sr-only" aria-live="polite">
        {snap ? `${snap.collected} of ${snap.required} balls home, ${snap.lost} lost` : ''}
      </div>
    </>
  );
}
