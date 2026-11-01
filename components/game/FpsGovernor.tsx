import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/** Watches the frame rate in one-second windows: two slow windows in a row call onDecline, four fast ones call onIncline.
 *  (Replaces drei's PerformanceMonitor.) */
export default function FpsGovernor({ onDecline, onIncline }: { onDecline: () => void; onIncline: () => void }) {
  const win = useRef({ t: 0, frames: 0, slow: 0, fast: 0, warm: 0 });
  useFrame((_, dt) => {
    const w = win.current;
    w.t += dt;
    w.frames++;
    if (w.t < 1) return;
    const fps = w.frames / w.t;
    w.t = 0;
    w.frames = 0;
    if (++w.warm <= 2) return; // ignore the first seconds while shaders compile
    if (fps < 48) { w.slow++; w.fast = 0; } else if (fps > 57) { w.fast++; w.slow = 0; } else { w.slow = 0; w.fast = 0; }
    if (w.slow >= 2) { w.slow = 0; onDecline(); }
    if (w.fast >= 4) { w.fast = 0; onIncline(); }
  });
  return null;
}
