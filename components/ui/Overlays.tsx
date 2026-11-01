'use client';
import { nextUnlock } from '@/lib/tips';
import { Mascot } from './Pictogram';
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

export function PauseOverlay({ practice, onPractice, onResume, onRestart, onMenu }: { practice?: boolean; onPractice?: () => void; onResume: () => void; onRestart: () => void; onMenu: () => void }) {
  return (
    <Card title="Paused">
      <button className="btn primary big" autoFocus onClick={onResume}>Resume</button>
      <div className="btn-row">
        <button className="btn" onClick={onRestart}>Restart</button>
        {onPractice && <button className="btn" onClick={onPractice}>{practice ? 'Leave practice' : 'Practice'}</button>}
      </div>
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
      <Mascot mood={required - collected <= 2 ? 'sad' : 'dizzy'} />
      <div className="facts">
        <div><b>{collected}/{required}</b><small>home</small></div>
        <div><b>{lost}</b><small>lost</small></div>
      </div>
      <p>{why}</p>
      <button className="btn primary big" autoFocus onClick={onRetry}>Try again</button>
      <div className="btn-row">
        {onSkip && <button className="btn" onClick={onSkip}>Skip level</button>}
        <button className="btn" onClick={onMenu}>Menu</button>
      </div>
    </Card>
  );
}

/** 3 stars for no losses, 2 for losing no more than half the spare balls, otherwise 1. */
export const starsFor = (lost: number, allowedLoss: number) => (lost === 0 ? 3 : lost <= allowedLoss / 2 ? 2 : 1);

async function shareResult(text: string, url: string) {
  try {
    if (navigator.share) { await navigator.share({ title: 'Control Your Balls', text, url }); return 'Shared!'; }
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
      <div className="confetti" aria-hidden>{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, background: ['#e0a93b', '#ffd75e', '#ff6fc6', '#5dffb0'][i % 4], animationDelay: `${(i % 8) * 0.07}s`, animationDuration: `${1.4 + (i % 5) * 0.2}s` }} />)}</div>
      <Mascot mood={stars === 3 ? 'wow' : stars === 2 ? 'happy' : 'ok'} />
      <div className="stars" aria-label={`${stars} of 3 stars`}>
        {[1, 2, 3].map((n) => <span key={n} className={n <= stars ? 'on' : ''} aria-hidden><svg viewBox="0 0 24 24" width="46" height="46"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="currentColor" stroke="#4a2f1c" strokeWidth="1.6" strokeLinejoin="round" /></svg></span>)}
      </div>
            <p className="streak">
        {best && (best.prev == null ? `First clear in ${best.secs}s` : best.secs < best.prev ? `New best: ${best.secs}s (was ${best.prev}s)` : `Best: ${best.prev}s`)}
        {best && streak ? ' · ' : ''}{streak ? `${streak}-day streak` : ''}
      </p>
      <div className="facts">
        <div><b>{total - lost}/{total}</b><small>balls home</small></div>
        <div><b>{Math.round(seconds)}s</b><small>time</small></div>
        <div><b>{lost}</b><small>lost</small></div>
      </div>
      <button className="btn primary big" autoFocus onClick={onNext}>{nextLabel ?? (random ? 'Another random level' : 'Next level')}</button>
      <div className="btn-row">
        <button className="btn" onClick={onRetry}>{best && best.prev != null && best.secs >= best.prev ? `Beat ${best.prev}s` : 'Replay'}</button>
        <button className="btn" onClick={onMenu}>Menu</button>
      </div>
      {challenge && (
        <button className="link" onClick={async () => {
          const url = `${location.origin}/?c=${challenge.level}.${challenge.seed}`;
          setMsg(await shareResult(`I cleared Control Your Balls level ${challenge.level} in ${Math.round(seconds)}s (${stars} of 3 stars). Beat me!`, url));
        }}>{msg || 'Challenge a friend'}</button>
      )}
      {up && <p className="upnext">Coming up: <b>{up.title}</b> at level {up.level}</p>}
    </Card>
  );
}
