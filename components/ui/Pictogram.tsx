import type { ReactNode } from 'react';

/* Hand-drawn pictograms for obstacles, tutorial steps and the ball character.
   One palette (walnut, brass, felt green, signal red, steel), one stroke weight, drawn on a 48x48 grid. */
const W = '#4a2f1c', B = '#d9a23a', G = '#3f9a5c', R = '#d9503f', S = '#aeb6bf', L = '#f3ead7';
const sw = { stroke: W, strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
const ball = (x: number, y: number, r = 4.5) => <circle cx={x} cy={y} r={r} fill={S} stroke={W} strokeWidth={1.6} />;

const ART: Record<string, ReactNode> = {
  peg: <><ellipse cx="24" cy="30" rx="11" ry="5" fill={W} opacity=".25" /><rect x="14" y="14" width="20" height="16" rx="3" fill={B} stroke={W} strokeWidth="2.4" /><ellipse cx="24" cy="14" rx="10" ry="4.5" fill="#f1c45e" stroke={W} strokeWidth="2.4" /></>,
  bar: <><rect x="6" y="19" width="36" height="10" rx="2" fill={B} stroke={W} strokeWidth="2.4" /><path d="M12 29l6-10M22 29l6-10M32 29l6-10" {...sw} strokeWidth="2" /></>,
  block: <><rect x="10" y="10" width="28" height="28" rx="4" fill={B} stroke={W} strokeWidth="2.4" /><path d="M10 10l28 28" {...sw} strokeWidth="1.6" opacity=".4" /></>,
  bumper: <><circle cx="24" cy="24" r="12" fill="#e8708f" stroke={W} strokeWidth="2.4" /><circle cx="24" cy="24" r="6" fill="#f7b3c6" stroke={W} strokeWidth="1.8" /><path d="M6 24h5M37 24h5M24 6v5M24 37v5" {...sw} /></>,
  pinball: <>{[[24, 12], [14, 24], [34, 24], [24, 36], [24, 24]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.5" fill="#e8708f" stroke={W} strokeWidth="2" />)}</>,
  boost: <><rect x="5" y="14" width="38" height="20" rx="4" fill="#f1c45e" stroke={W} strokeWidth="2.4" /><path d="M13 18l7 6-7 6M24 18l7 6-7 6" {...sw} /></>,
  mud: <><path d="M7 30c0-8 8-13 17-13s17 5 17 13c0 4-6 6-17 6S7 34 7 30z" fill="#7a5230" stroke={W} strokeWidth="2.4" /><circle cx="18" cy="28" r="2" fill="#a9794a" /><circle cx="28" cy="25" r="2.4" fill="#a9794a" /><circle cx="32" cy="31" r="1.6" fill="#a9794a" /></>,
  spinner: <><path d="M24 8v32M8 24h32" stroke={W} strokeWidth="7" strokeLinecap="round" /><path d="M24 8v32M8 24h32" stroke="#59b8c9" strokeWidth="3.4" strokeLinecap="round" /><circle cx="24" cy="24" r="4.5" fill={L} stroke={W} strokeWidth="2" /></>,
  sweeper: <><rect x="16" y="17" width="16" height="14" rx="3" fill="#a56ad0" stroke={W} strokeWidth="2.4" /><path d="M5 24h8M43 24h-8M9 20l-4 4 4 4M39 20l4 4-4 4" {...sw} /></>,
  gate: <><rect x="8" y="14" width="32" height="20" rx="3" fill={B} stroke={W} strokeWidth="2.4" /><path d="M14 34l8-20M24 34l8-20M34 34l6-14" {...sw} strokeWidth="2.2" /><path d="M24 40v4M20 42l4 4 4-4" {...sw} strokeWidth="1.8" /></>,
  door: <><rect x="12" y="8" width="24" height="32" rx="3" fill="#e08a2c" stroke={W} strokeWidth="2.4" /><circle cx="30" cy="25" r="2" fill={W} /><circle cx="24" cy="24" r="0" /><path d="M17 14h14" {...sw} strokeWidth="1.8" /></>,
  slotwall: <>{[8, 20, 32].map((x, i) => <rect key={x} x={x} y={i === 1 ? 24 : 10} width="9" height={i === 1 ? 14 : 28} rx="2" fill="#e08a2c" stroke={W} strokeWidth="2.2" />)}</>,
  magnet: <><path d="M12 36V22a12 12 0 0 1 24 0v14" stroke={W} strokeWidth="11" strokeLinecap="butt" fill="none" /><path d="M12 36V22a12 12 0 0 1 24 0v14" stroke={R} strokeWidth="6.4" strokeLinecap="butt" fill="none" /><rect x="9" y="32" width="6" height="7" fill={L} stroke={W} strokeWidth="2" /><rect x="33" y="32" width="6" height="7" fill={L} stroke={W} strokeWidth="2" /></>,
  flap: <><path d="M8 34h32" {...sw} /><path d="M14 34l20-14" stroke={W} strokeWidth="8" strokeLinecap="round" /><path d="M14 34l20-14" stroke={B} strokeWidth="4" strokeLinecap="round" /><path d="M30 12l8 2-2 8" {...sw} strokeWidth="2" /></>,
  portal: <><ellipse cx="24" cy="24" rx="16" ry="19" fill="none" stroke="#7a52c4" strokeWidth="5" /><ellipse cx="24" cy="24" rx="9" ry="12" fill="none" stroke="#b79cf0" strokeWidth="3.4" /><ellipse cx="24" cy="24" rx="3" ry="5" fill={W} /></>,
  filter: <><rect x="8" y="10" width="14" height="28" rx="2" fill="#7fd4e6" opacity=".7" stroke={W} strokeWidth="2.2" /><rect x="26" y="10" width="14" height="28" rx="2" fill="#f0b957" opacity=".7" stroke={W} strokeWidth="2.2" />{ball(15, 24, 3.2)}{ball(33, 24, 6)}</>,
  'patch-ice': <><path d="M24 6l16 10v16L24 42 8 32V16z" fill="#d7f0f7" stroke={W} strokeWidth="2.4" /><path d="M24 6v36M8 16l32 16M40 16L8 32" {...sw} strokeWidth="1.4" opacity=".45" /></>,
  ice: <><path d="M24 6l16 10v16L24 42 8 32V16z" fill="#d7f0f7" stroke={W} strokeWidth="2.4" /><path d="M24 6v36M8 16l32 16M40 16L8 32" {...sw} strokeWidth="1.4" opacity=".45" /></>,
  'patch-rough': <><rect x="7" y="12" width="34" height="24" rx="4" fill="#b98c5a" stroke={W} strokeWidth="2.4" /><path d="M13 16v16M19 16v16M25 16v16M31 16v16M37 16v16" {...sw} strokeWidth="1.8" /></>,
  'patch-bouncy': <><path d="M10 38h28" {...sw} /><path d="M14 38c0-6 4-6 4-10s-4-4-4-8 4-4 4-8M26 38c0-6 4-6 4-10" {...sw} opacity="0" /><path d="M16 36l16-3-16-4 16-4-16-4 16-4" {...sw} /></>,
  bouncy: <><path d="M10 38h28" {...sw} /><path d="M16 36l16-3-16-4 16-4-16-4 16-4" {...sw} /></>,
  sticky: <><path d="M8 18h32v8c0 3-3 3-3 6s-3 3-3 6-4 3-4-1v-6c0-3-4-3-4 0v6c0 4-4 4-4 0v-6c0-3-4-3-4 0 0 3-3 3-3 0V26z" fill="#c9852f" stroke={W} strokeWidth="2.2" /></>,
  conveyor: <><rect x="5" y="16" width="38" height="16" rx="8" fill="#3fb7a3" stroke={W} strokeWidth="2.4" /><path d="M13 24h12M21 20l5 4-5 4M29 24h6" {...sw} strokeWidth="2" /></>,
  open: <><path d="M6 20h26l4 4H6z" fill={B} stroke={W} strokeWidth="2.4" /><path d="M6 20v-8M32 20h4" {...sw} opacity="0" /><path d="M34 24c4 0 6 3 6 8v8" {...sw} stroke={R} strokeWidth="3" /><path d="M35 36l5 5 5-5" {...sw} stroke={R} strokeWidth="3" />{ball(24, 14)}</>,
  // tutorial
  t_tilt: <><path d="M6 30l22-14 14 8-22 14z" fill="#e2b777" stroke={W} strokeWidth="2.4" strokeLinejoin="round" />{ball(26, 22)}<path d="M8 12c3-4 8-6 13-5M17 5l5 2-3 4" {...sw} /></>,
  t_view: <><rect x="15" y="17" width="18" height="14" rx="2" fill="#e2b777" stroke={W} strokeWidth="2.2" /><path d="M10 28a15 15 0 0 1 4-14M38 20a15 15 0 0 1-4 14M14 14l-1-5-5 2M34 34l1 5 5-2" {...sw} /></>,
  t_goal: <><circle cx="24" cy="24" r="14" fill={W} stroke={G} strokeWidth="5" />{ball(24, 8, 4)}</>,
  t_trap: <><circle cx="24" cy="24" r="14" fill={W} stroke={R} strokeWidth="5" /></>,
  t_obst: <><rect x="6" y="28" width="22" height="9" rx="2" fill={B} stroke={W} strokeWidth="2.2" /><circle cx="35" cy="22" r="7" fill="#e8708f" stroke={W} strokeWidth="2.2" />{ball(14, 16)}</>,
};

export function Pictogram({ name, size = 64 }: { name: string; size?: number }) {
  return (
    <span className="picto" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 48 48" width={size * 0.72} height={size * 0.72}>{ART[name] ?? ART.peg}</svg>
    </span>
  );
}

export type Mood = 'happy' | 'wow' | 'ok' | 'sad' | 'dizzy';

/** The steel ball as a character: it cheers when you win and goes cross-eyed when you lose. */
export function Mascot({ mood, size = 76 }: { mood: Mood; size?: number }) {
  const eye = (cx: number) => mood === 'dizzy'
    ? <path d={`M${cx - 3} 31l6 6M${cx + 3} 31l-6 6`} stroke={W} strokeWidth="2.4" strokeLinecap="round" />
    : mood === 'happy' || mood === 'wow'
      ? <path d={`M${cx - 3.5} 36q3.5-6 7 0`} fill="none" stroke={W} strokeWidth="2.6" strokeLinecap="round" />
      : <ellipse cx={cx} cy="34" rx="2.3" ry={mood === 'sad' ? 3.2 : 2.7} fill={W} />;
  const mouth = { happy: 'M33 50q9 9 18 0', wow: 'M34 49q8 12 16 0', ok: 'M36 52h12', sad: 'M34 55q8-8 16 0', dizzy: 'M34 53q4-4 8 0t8 0' }[mood];
  return (
    <svg className="mascot" viewBox="0 0 84 84" width={size} height={size} aria-hidden>
      <ellipse cx="42" cy="78" rx="26" ry="4" fill="#000" opacity=".3" />
      <defs><radialGradient id={`mg-${mood}`} cx=".32" cy=".26"><stop offset="0" stopColor="#fff" /><stop offset=".5" stopColor="#c3cad2" /><stop offset="1" stopColor="#6f7882" /></radialGradient></defs>
      <circle cx="42" cy="42" r="34" fill={`url(#mg-${mood})`} stroke={W} strokeWidth="2.6" />
      {eye(32)}{eye(52)}
      {mood === 'wow' && <circle cx="42" cy="55" r="0" />}
      <path d={mouth} fill={mood === 'wow' ? '#7a2e24' : 'none'} stroke={W} strokeWidth="2.6" strokeLinecap="round" />
      {mood === 'sad' && <path d="M58 40q3 5 0 8q-3-3 0-8z" fill="#7fd4e6" />}
    </svg>
  );
}
