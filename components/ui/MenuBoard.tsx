'use client';
import { useEffect, useRef } from 'react';

/** A tiny playable board: drag to tilt it, roll the ball into the green hole to start the game. */
const GOAL = { x: 0.82, y: 0.78, r: 0.085 };
const PIT = { x: 0.5, y: 0.52, r: 0.065 };
const PEG = { x: 0.3, y: 0.42, r: 0.055 };
const BALL_R = 0.045;
const START = { x: 0.16, y: 0.2 };

export default function MenuBoard({ onWin, ready }: { onWin: () => void; ready: boolean }) {
  const board = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLElement>(null);
  const shadow = useRef<HTMLElement>(null);
  const win = useRef(onWin);
  const go = useRef(ready);
  useEffect(() => { win.current = onWin; go.current = ready; }, [onWin, ready]);

  useEffect(() => {
    const el = board.current;
    if (!el) return;
    const s = { x: START.x, y: START.y, vx: 0, vy: 0, tx: 0, ty: 0, cx: 0, cy: 0, drop: 0, fall: '' as '' | 'goal' | 'pit', drag: false };
    const tiltTo = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      s.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2.4));
      s.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2.4));
    };
    const down = (e: PointerEvent) => { s.drag = true; el.setPointerCapture(e.pointerId); tiltTo(e); };
    const move = (e: PointerEvent) => { if (s.drag) tiltTo(e); };
    const up = () => { s.drag = false; s.tx = 0; s.ty = 0; };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      s.cx += (s.tx - s.cx) * Math.min(1, dt * 6);
      s.cy += (s.ty - s.cy) * Math.min(1, dt * 6);
      el.style.transform = `perspective(900px) rotateX(${32 - s.cy * 8}deg) rotateY(${s.cx * 8}deg)`;
      if (s.fall) {
        s.drop += dt * 3;
        if (s.drop >= 1) {
          if (s.fall === 'goal' && go.current) win.current();
          s.x = START.x; s.y = START.y; s.vx = s.vy = 0; s.drop = 0; s.fall = '';
        }
      } else {
        s.vx += s.cx * 1.6 * dt; s.vy += s.cy * 1.6 * dt;
        s.vx *= 0.992; s.vy *= 0.992;
        s.x += s.vx * dt * 1.0; s.y += s.vy * dt * 1.0;
        if (s.x < BALL_R) { s.x = BALL_R; s.vx = Math.abs(s.vx) * 0.45; }
        if (s.x > 1 - BALL_R) { s.x = 1 - BALL_R; s.vx = -Math.abs(s.vx) * 0.45; }
        if (s.y < BALL_R * 1.3) { s.y = BALL_R * 1.3; s.vy = Math.abs(s.vy) * 0.45; }
        if (s.y > 1 - BALL_R * 1.3) { s.y = 1 - BALL_R * 1.3; s.vy = -Math.abs(s.vy) * 0.45; }
        const dx = s.x - PEG.x, dy = (s.y - PEG.y) * 0.75, d = Math.hypot(dx, dy), min = PEG.r + BALL_R;
        if (d < min && d > 0) { const nx = dx / d, ny = dy / d, vn = s.vx * nx + s.vy * ny; if (vn < 0) { s.vx -= 1.6 * vn * nx; s.vy -= 1.6 * vn * ny; } s.x = PEG.x + nx * min; }
        const sp = Math.hypot(s.vx, s.vy);
        if (Math.hypot(s.x - GOAL.x, (s.y - GOAL.y) * 0.75) < GOAL.r - 0.01 && sp < 1.1) s.fall = 'goal';
        else if (Math.hypot(s.x - PIT.x, (s.y - PIT.y) * 0.75) < PIT.r - 0.01 && sp < 1.1) s.fall = 'pit';
        if (s.fall) { s.drop = 0; s.vx = s.vy = 0; s.x = s.fall === 'goal' ? GOAL.x : PIT.x; s.y = s.fall === 'goal' ? GOAL.y : PIT.y; }
      }
      const b = ball.current, sh = shadow.current;
      if (b) { b.style.left = `${s.x * 100}%`; b.style.top = `${s.y * 100}%`; b.style.transform = `translate(-50%, -50%) scale(${1 - s.drop * 0.9})`; b.style.opacity = String(1 - s.drop * 0.6); }
      if (sh) { sh.style.left = `${s.x * 100 + s.cx * 1.2}%`; sh.style.top = `${s.y * 100 + 3}%`; sh.style.opacity = String(0.5 * (1 - s.drop)); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
  }, []);

  const pct = (v: number) => `${v * 100}%`;
  return (
    <div className="mb-wrap" aria-hidden>
      <div className="mb-board" ref={board}>
        <i className="mb-pit" style={{ left: pct(PIT.x), top: pct(PIT.y), width: pct(PIT.r * 2), }} />
        <i className="mb-goal" style={{ left: pct(GOAL.x), top: pct(GOAL.y), width: pct(GOAL.r * 2) }} />
        <span className="mb-label" style={{ left: pct(GOAL.x), top: pct(GOAL.y + 0.17) }}>play</span>
        <i className="mb-peg" style={{ left: pct(PEG.x), top: pct(PEG.y), width: pct(PEG.r * 2) }} />
        <i className="mb-shadow" ref={shadow} />
        <i className="mb-ball" ref={ball} />
      </div>
    </div>
  );
}
