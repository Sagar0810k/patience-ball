'use client';
import type { ReactNode } from 'react';

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="card">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function PauseOverlay({ onResume, onRestart, onMenu }: { onResume: () => void; onRestart: () => void; onMenu: () => void }) {
  return (
    <Card title="Paused">
      <button className="btn primary big" autoFocus onClick={onResume}>Resume</button>
      <button className="btn big" onClick={onRestart}>Restart level</button>
      <button className="btn" onClick={onMenu}>Main menu</button>
    </Card>
  );
}

export function FailedOverlay({ collected, required, lost, onRetry, onMenu }: { collected: number; required: number; lost: number; onRetry: () => void; onMenu: () => void }) {
  return (
    <Card title="Too many balls lost">
      <div className="facts">
        <div><b>{collected}/{required}</b><small>home</small></div>
        <div><b>{lost}</b><small>lost</small></div>
      </div>
      <p>Each ball size has its own spare balls. Red holes swallow any ball small enough to fit, so steer the pile around them.</p>
      <button className="btn primary big" autoFocus onClick={onRetry}>Try again</button>
      <button className="btn" onClick={onMenu}>Main menu</button>
    </Card>
  );
}

/** 3 stars for no losses, 2 for losing no more than half the spare balls, otherwise 1. */
export const starsFor = (lost: number, allowedLoss: number) => (lost === 0 ? 3 : lost <= allowedLoss / 2 ? 2 : 1);

export function CompletedOverlay({ seconds, lost, allowedLoss, total, random, onNext, onRetry, onMenu }: { seconds: number; lost: number; allowedLoss: number; total: number; random: boolean; onNext: () => void; onRetry: () => void; onMenu: () => void }) {
  const stars = starsFor(lost, allowedLoss);
  return (
    <Card title="Level complete">
      <div className="stars" aria-label={`${stars} of 3 stars`}>
        {[1, 2, 3].map((n) => <span key={n} className={n <= stars ? 'on' : ''} aria-hidden>★</span>)}
      </div>
      <div className="facts">
        <div><b>{total - lost}/{total}</b><small>balls home</small></div>
        <div><b>{Math.round(seconds)}s</b><small>time</small></div>
        <div><b>{lost}</b><small>lost</small></div>
      </div>
      <button className="btn primary big" autoFocus onClick={onNext}>{random ? 'Another random level' : 'Next level'}</button>
      <button className="btn big" onClick={onRetry}>Replay</button>
      <button className="btn" onClick={onMenu}>Main menu</button>
    </Card>
  );
}
