/** Ball finishes. The colour still tells the size, so skins only change the material. */
export interface Skin { id: string; name: string; stars: number; metalness: number; roughness: number; clearcoat: number }

export const SKINS: Skin[] = [
  { id: 'classic', name: 'Classic', stars: 0, metalness: 0.55, roughness: 0.18, clearcoat: 1 },
  { id: 'candy', name: 'Candy', stars: 6, metalness: 0, roughness: 0.25, clearcoat: 1 },
  { id: 'chrome', name: 'Chrome', stars: 15, metalness: 1, roughness: 0.08, clearcoat: 0 },
  { id: 'pearl', name: 'Pearl', stars: 30, metalness: 0.2, roughness: 0.4, clearcoat: 1 },
];
export const skinOf = (id: string) => SKINS.find((s) => s.id === id) ?? SKINS[0];
