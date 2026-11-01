'use client';
import Icon from './Icons';
import type { SaveData } from '@/lib/types';
import { WORLD_SIZE, worldName, worldOf } from '@/lib/worlds';

interface Props {
  save: SaveData;
  onPick: (level: number) => void;
  onBack: () => void;
}

export default function LevelSelect({ save, onPick, onBack }: Props) {
  const unlocked = Math.max(1, save.highestUnlocked);
  const lastWorld = worldOf(unlocked);
  const total = Object.values(save.stars).reduce((a, b) => a + b, 0);
  return (
    <main className="panel">
      <div className="panel-head">
        <button className="btn icon" onClick={onBack} aria-label="Back">←</button>
        <h2>Levels</h2>
        <span className="total-stars" aria-label={`${total} stars collected`}>★ {total}</span>
      </div>
      {Array.from({ length: lastWorld }, (_, w) => w + 1).map((w) => {
        const first = (w - 1) * WORLD_SIZE + 1;
        const levels = Array.from({ length: WORLD_SIZE }, (_, i) => first + i);
        const got = levels.reduce((a, n) => a + (save.stars[n] ?? 0), 0);
        return (
          <section key={w} className="world">
            <h3>World {w} · {worldName(w)} <small>★ {got}/{WORLD_SIZE * 3}</small></h3>
            <div className="level-grid">
              {levels.map((n) => {
                const done = save.completedLevels.includes(n);
                const locked = n > unlocked;
                const st = save.stars[n] ?? 0;
                return (
                  <button key={n} className={`level-cell${done ? ' done' : n === unlocked ? ' next' : ''}${n % 10 === 0 ? ' boss' : n % 5 === 0 ? ' hard' : ''}`} disabled={locked} onClick={() => onPick(n)} aria-label={`Level ${n}${done ? `, completed, ${st} stars` : locked ? ', locked' : ''}`}>
                    {locked ? <Icon name="lock" size={18} /> : n}
                    {done ? <small className="stars-row">{'★'.repeat(st)}{'☆'.repeat(3 - st)}</small> : !locked && n % 5 === 0 ? <small>{n % 10 === 0 ? 'BOSS' : 'HARD'}</small> : null}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
