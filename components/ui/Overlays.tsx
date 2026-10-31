'use client';
import { nextUnlock } from '@/lib/tips';
import { useState, type ReactNode } from 'react';

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

export function FailedOverlay({ onSkip, collected, required, lost, lostTrap, lostVoid, onRetry, onMenu }: { onSkip?: () => void; collected: number; required: number; lost: number; lostTrap: number; lostVoid: number; onRetry: () => void; onMenu: () => void }) {
  const why = lostTrap >= lostVoid
    ? `${lostTrap} ball${lostTrap === 1 ? '' : 's'} fell into red holes. Red holes swallow any ball small enough to fit, so steer the pile around them.`
    : `${lostVoid} ball${lostVoid === 1 ? '' : 's'} rolled off an open edge. Tilt gently near edges with a red glow.`;
  return (
    <Card title={required - collected <= 2 && required > collected ? `So close! ${required - collected} more needed` : 'Too many balls lost'}>
      <div className="facts">
        <div><b>{collected}/{required}</b><small>home</small></div>
        <div><b>{lost}</b><small>lost</small></div>
      </div>
      <p>{why}</p>
      <button className="btn primary big" autoFocus onClick={onRetry}>Try again</button>
      {onSkip && <button className="btn" onClick={onSkip}>Skip this level</button>}
      <button className="btn" onClick={onMenu}>Main menu</button>
    </Card>
  );
}

/** 3 stars for no losses, 2 for losing no more than half the spare balls, otherwise 1. */
export const starsFor = (lost: number, allowedLoss: number) => (lost === 0 ? 3 : lost <= allowedLoss / 2 ? 2 : 1);

async function shareResult(text: string, url: string) {
  try {
    if (navigator.share) { await navigator.share({ title: 'Patience Balls', text, url }); return 'Shared!'; }
    await navigator.clipboard.writeText(`${text} ${url}`);
    return 'Link copied!';
  } catch { return ''; }
}

export function CompletedOverlay({ levelNumber, challenge, best, nextLabel, streak, seconds, lost, allowedLoss, total, random, onNext, onRetry, onMenu }: { levelNumber?: number; challenge?: { level: number; seed: number }; best?: { prev: number | null; secs: number }; nextLabel?: string; streak?: number; seconds: number; lost: number; allowedLoss: number; total: number; random: boolean; onNext: () => void; onRetry: () => void; onMenu: () => void }) {
  const stars = starsFor(lost, allowedLoss);
  const [msg, setMsg] = useState('');
  const up = levelNumber && !random ? nextUnlock(levelNumber) : null;
  return (
    <Card title="Level complete">
      <div className="confetti" aria-hidden>{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, background: ['#6ff5f7', '#ffd75e', '#ff6fc6', '#5dffb0'][i % 4], animationDelay: `${(i % 8) * 0.07}s`, animationDuration: `${1.4 + (i % 5) * 0.2}s` }} />)}</div>
      <div className="stars" aria-label={`${stars} of 3 stars`}>
        {[1, 2, 3].map((n) => <span key={n} className={n <= stars ? 'on' : ''} aria-hidden>★</span>)}
      </div>
      {up && <p className="upnext">{up.icon} Coming up: <b>{up.title}</b> at level {up.level}</p>}
      {best && (best.prev == null ? <p className="streak">First clear: {best.secs}s</p> : best.secs < best.prev ? <p className="streak">⚡ New best! {best.secs}s (was {best.prev}s)</p> : <p>Best: {best.prev}s</p>)}
      {streak ? <p className="streak">🔥 {streak}-day streak</p> : null}
      <div className="facts">
        <div><b>{total - lost}/{total}</b><small>balls home</small></div>
        <div><b>{Math.round(seconds)}s</b><small>time</small></div>
        <div><b>{lost}</b><small>lost</small></div>
      </div>
      <button className="btn primary big" autoFocus onClick={onNext}>{nextLabel ?? (random ? 'Another random level' : 'Next level')}</button>
      {challenge && (
        <button className="btn" onClick={async () => {
          const url = `${location.origin}/?c=${challenge.level}.${challenge.seed}`;
          setMsg(await shareResult(`I cleared Patience Balls level ${challenge.level} in ${Math.round(seconds)}s ${'⭐'.repeat(stars)}. Beat me!`, url));
        }}>{msg || '🔗 Challenge a friend'}</button>
      )}
      <button className="btn big" onClick={onRetry}>{best && best.prev != null && best.secs >= best.prev ? `Beat ${best.prev}s` : 'Replay'}</button>
      <button className="btn" onClick={onMenu}>Main menu</button>
    </Card>
  );
}
