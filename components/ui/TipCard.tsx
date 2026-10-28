'use client';
import { useState } from 'react';
import type { Tip } from '@/lib/tips';

export default function TipCard({ tips, onDone }: { tips: Tip[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const t = tips[i];
  const last = i === tips.length - 1;
  return (
    <div className="tut tip" role="dialog" aria-modal="true" aria-label="New element">
      <div className="tut-card">
        <span className="tip-badge">NEW</span>
        <div className="tip-icon" aria-hidden>{t.icon}</div>
        <h2>{t.title}</h2>
        <p>{t.body}</p>
        <div className="tut-actions">
          <button className="btn primary" autoFocus onClick={() => (last ? onDone() : setI(i + 1))}>{last ? 'Got it' : `Next (${i + 1}/${tips.length})`}</button>
        </div>
      </div>
    </div>
  );
}
