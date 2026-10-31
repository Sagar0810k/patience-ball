// Synthesized Web Audio sounds; no asset files.
let ctx: AudioContext | null = null;
let enabled = true;

export const setSoundEnabled = (on: boolean) => { enabled = on; };

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, delay = 0, slideTo?: number) {
  const c = ac();
  if (!c || !enabled) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sound = {
  click: () => tone(520, 0.06, 'triangle', 0.08),
  release: () => tone(300, 0.12, 'sine', 0.1, 0, 520),
  land: () => tone(180 + Math.random() * 60, 0.05, 'triangle', 0.05),
  /** Each ball in a quick streak rings a note higher (a pentatonic climb), so streaks sound musical. */
  cup: (streak = 1) => { const f = 660 * 2 ** (([0, 2, 4, 7, 9, 12, 14, 16][Math.min(streak, 8) - 1] ?? 16) / 12); tone(f, 0.25, 'sine', 0.12); tone(f * 1.5, 0.3, 'sine', 0.07, 0.05); },
  bump: () => tone(240 + Math.random() * 80, 0.07, 'square', 0.04, 0, 520),
  portal: () => tone(300, 0.25, 'sine', 0.07, 0, 900),
  door: (open: boolean) => tone(open ? 220 : 140, 0.18, 'triangle', 0.08, 0, open ? 330 : 90),
  tier: () => [660, 880, 1100].forEach((f, i) => tone(f, 0.2, 'sine', 0.1, i * 0.07)),
  lose: () => tone(300, 0.4, 'sine', 0.1, 0, 90),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'sine', 0.11, i * 0.11)),
  fail: () => tone(320, 0.6, 'sawtooth', 0.07, 0, 80),
};

export function haptic(ms: number | number[], on: boolean) {
  if (on && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
}

// Background music: a soft pentatonic arpeggio over a slow pad, generated live (no asset files).
let musicTimer: ReturnType<typeof setInterval> | null = null;
const SCALE = [0, 2, 4, 7, 9, 12, 14];
const CHORDS = [[0, 4, 7], [-3, 0, 4], [-5, -1, 2], [-7, -3, 0]];
export function startMusic() {
  if (musicTimer || !enabled || !ac()) return;
  let step = 0;
  musicTimer = setInterval(() => {
    if (!enabled) return;
    const chord = CHORDS[Math.floor(step / 16) % CHORDS.length];
    if (step % 16 === 0) chord.forEach((n) => tone(220 * 2 ** (n / 12), 2.4, 'sine', 0.022));
    if (step % 2 === 0) tone(440 * 2 ** ((chord[0] + SCALE[(step * 3 + (step >> 2)) % SCALE.length]) / 12), 0.5, 'triangle', 0.028);
    step++;
  }, 300);
}
export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}
