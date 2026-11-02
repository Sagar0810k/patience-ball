import { describe, expect, it } from 'vitest';
import { generateLevel } from '@/lib/levels/levelGenerator';
import { loadRapier } from '@/lib/physics/physicsWorld';
import { Simulation } from '@/lib/physics/simulation';

describe('abilities', async () => {
  const R = await loadRapier();
  const make = (reserve = 0) => {
    const l = generateLevel(1, 3);
    const extra = Array.from({ length: reserve }, () => ({ radius: l.classRadii[0], cls: 0 }));
    return new Simulation(R, reserve ? { ...l, balls: [...l.balls, ...extra], reserve } : l);
  };
  it('extra balls start switched off and come in one at a time', () => {
    const sim = make(3);
    const total = sim.snapshot().total;
    expect(sim.addReserve()).toBe(true);
    expect(sim.snapshot().total).toBe(total + 1);
    expect(sim.isHidden(sim.level.balls.length - 3)).toBe(false);
    sim.addReserve(); sim.addReserve();
    expect(sim.addReserve()).toBe(false);
  });
  it('home run collects exactly one needed ball', () => {
    const sim = make();
    const before = sim.collected;
    expect(sim.sendHome()).toBe(true);
    expect(sim.collected).toBe(before + 1);
  });
  it('freeze stops the obstacle clock for its duration', () => {
    const sim = make();
    sim.freeze = 1;
    const c = sim.moverClock;
    for (let i = 0; i < 30; i++) sim.step();
    expect(sim.moverClock).toBe(c);
    for (let i = 0; i < 60; i++) sim.step();
    expect(sim.moverClock).toBeGreaterThan(c);
  });
});
