'use client';
import { Pictogram } from './Pictogram';
import { useState } from 'react';

const STEPS = [
  { icon: 't_tilt', title: 'Tilt the board', body: 'Drag on the board and it tips that way. Balls roll downhill. It stays tilted where you leave it; double-tap to level it again.', demo: 'tilt' },
  { icon: 't_view', title: 'Turn your view', body: 'Drag the empty background, or the strip at the bottom, to look from another side. Pinch or scroll to zoom.', demo: 'orbit' },
  { icon: 't_goal', title: 'Green holes are home', body: 'Each ball size only fits its own green hole, and bigger green holes ignore smaller balls. They can be on any floor, so turn the view and look around to find them.', demo: 'goal' },
  { icon: 't_trap', title: 'Avoid red holes', body: 'Red holes swallow balls, and they hide near the green ones. You can lose a few balls, but not too many.', demo: 'trap' },
  { icon: 't_obst', title: 'Watch the obstacles', body: 'Bumpers, doors, gates, magnets, ice and conveyors will test your patience. Edges with a red glow have no wall: balls can fall off.', demo: 'obst' },
] as const;

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const s = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <div className="tut" role="dialog" aria-modal="true" aria-label="Tutorial">
      <div className="tut-card">
        <div className={`tut-demo d-${s.demo}`} aria-hidden>
          <span className="tut-ico"><Pictogram name={s.icon} size={56} /></span>
          <i className="td-ball" /><i className="td-hole" />
        </div>
        <h2>{s.title}</h2>
        <p>{s.body}</p>
        <div className="tut-dots" aria-hidden>{STEPS.map((_, k) => <b key={k} className={k === i ? 'on' : ''} />)}</div>
        <div className="tut-actions">
          <button className="btn ghost" onClick={onDone}>Skip</button>
          <button className="btn primary" onClick={() => (last ? onDone() : setI(i + 1))}>{last ? "Let's play" : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
