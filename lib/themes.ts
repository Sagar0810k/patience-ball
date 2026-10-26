export interface Theme {
  /** Top tray colour; deeper trays blend toward `deep`. */
  top: string;
  deep: string;
  bgTop: string;
  bgBottom: string;
}

// Cyan-to-navy trays over violet skies; one per level theme index.
export const THEMES: Theme[] = [
  { top: '#2bd0ff', deep: '#16307a', bgTop: '#241552', bgBottom: '#7a5cc4' },
  { top: '#2fe3c8', deep: '#12476b', bgTop: '#1d1a5e', bgBottom: '#6d6ad0' },
  { top: '#5aa8ff', deep: '#1c2a7a', bgTop: '#2a1450', bgBottom: '#9a5cc0' },
  { top: '#3df0e0', deep: '#173b8a', bgTop: '#1b1448', bgBottom: '#5b4bb5' },
  { top: '#7ab8ff', deep: '#2a2a86', bgTop: '#341a5c', bgBottom: '#a96fd0' },
  { top: '#27e1d2', deep: '#1a3a70', bgTop: '#1c1b55', bgBottom: '#8068d6' },
];

/** Palette slot for a ball size. On boss levels the giant last size is always gold. */
export const colorSlot = (level: { tier: string; classRadii: number[] }, cls: number) => (level.tier === 'boss' && cls === level.classRadii.length - 1 ? 3 : cls);

/** Ball body colours per size class: black, midnight blue, deep purple. */
export const BALL_COLORS = ['#2b2f45', '#2f7bff', '#ff4fb8', '#ffc83d'];
/** Brighter versions for rings and HUD chips, so a size is easy to match to its hole. */
export const CLASS_ACCENT = ['#aeb6e8', '#4d93ff', '#ff6fc6', '#ffd75e'];
