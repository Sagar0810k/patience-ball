import { describe, expect, it } from 'vitest';
import { generateLevel } from '@/lib/levels/levelGenerator';
import { validateLevel } from '@/lib/levels/levelValidator';

describe('level generation', () => {
  it('is deterministic', () => {
    expect(generateLevel(7)).toEqual(generateLevel(7));
    expect(generateLevel(7, 123)).not.toEqual(generateLevel(7, 124));
  });

  it('produces valid, varied levels across many seeds', () => {
    const radii = new Set<number>();
    const trays = new Set<number>();
    const counts = new Set<number>();
    const holeSizes = new Set<number>();
    let fallbacks = 0;
    for (let n = 1; n <= 60; n++) {
      for (let s = 0; s < 8; s++) {
        const lv = generateLevel(n, s * 7919 + n);
        expect(validateLevel(lv)).toEqual([]);
        if (lv.fallback) fallbacks++;
        lv.classRadii.forEach((r) => radii.add(r));
        trays.add(lv.trays.length);
        counts.add(lv.balls.length);
        lv.trays.forEach((t) => t.holes.forEach((h) => holeSizes.add(h.r)));
      }
    }
    expect(fallbacks).toBe(0);
    expect(radii.size).toBeGreaterThan(30);
    expect(trays.size).toBeGreaterThanOrEqual(4);
    expect(counts.size).toBeGreaterThan(15);
    expect(holeSizes.size).toBeGreaterThan(100);
  });

  it('mixes ball sizes on later levels', () => {
    const lv = generateLevel(20, 99);
    expect(new Set(lv.balls.map((b) => b.radius)).size).toBeGreaterThanOrEqual(2);
  });
});
