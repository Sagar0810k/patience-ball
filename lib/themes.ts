export interface Theme {
  /** Top tray colour; deeper trays blend toward `deep`. */
  top: string;
  deep: string;
  bgTop: string;
  bgBottom: string;
}

// Cyan-to-navy trays over violet skies; one per level theme index.
export const THEMES: Theme[] = [
  { top: '#d4a368', deep: '#a8703c', bgTop: '#12251e', bgBottom: '#2f5a48' }, // beech on green felt
  { top: '#86aabf', deep: '#3f6580', bgTop: '#101b25', bgBottom: '#34546c' }, // blue felt
  { top: '#cc9078', deep: '#9a5c48', bgTop: '#26171a', bgBottom: '#6a4540' }, // clay
  { top: '#9bb97f', deep: '#5f8250', bgTop: '#131f17', bgBottom: '#40654a' }, // sage
  { top: '#ab97c8', deep: '#6d5c98', bgTop: '#1b1730', bgBottom: '#4c4272' }, // lilac
  { top: '#d9b95a', deep: '#a77f2c', bgTop: '#221b0e', bgBottom: '#665022' }, // mustard
];

/** Palette slot for a ball size. On boss levels the giant last size is always gold. */
export const colorSlot = (level: { tier: string; classRadii: number[] }, cls: number) => (level.tier === 'boss' && cls === level.classRadii.length - 1 ? 3 : cls);

/** Ball body colours per size class: black, midnight blue, deep purple. */
export const BALL_COLORS = ['#eceff3', '#2f6bff', '#e8429a', '#ffc83d'];
/** Brighter versions for rings and HUD chips, so a size is easy to match to its hole. */
export const CLASS_ACCENT = ['#dfe4ea', '#5b8bff', '#f26cb0', '#ffd75e'];
