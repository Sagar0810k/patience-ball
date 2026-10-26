import { describe, expect, it } from 'vitest';
import { migrate } from '@/lib/storage/migrations';
import { exportSave, parseImport } from '@/lib/storage/saveManager';
import { defaultSave } from '@/lib/types';

describe('save data', () => {
  it('round-trips through export/import', () => {
    const s = { ...defaultSave(), highestUnlocked: 9, currentLevel: 4, completedLevels: [1, 2, 3], bestTimes: { '2': 45 } };
    expect(parseImport(exportSave(s))).toEqual(s);
  });
  it('rejects corrupt, foreign and future-version data', () => {
    expect(parseImport('not json')).toBeNull();
    expect(migrate(null)).toBeNull();
    expect(migrate([])).toBeNull();
    expect(migrate({ version: 99 })).toBeNull();
  });
  it('repairs bad fields with defaults and clamps the current level', () => {
    const r = migrate({ version: 1, settings: { sound: 'x' }, highestUnlocked: 3, currentLevel: 50, completedLevels: [1, 'a', -2, 1.5, 2, 2], bestTimes: { a: 1, '3': -1, '4': 6 } })!;
    expect(r.settings.sound).toBe(true);
    expect(r.currentLevel).toBe(3);
    expect(r.completedLevels).toEqual([1, 2]);
    expect(r.bestTimes).toEqual({ '4': 6 });
  });
});
