'use client';
import { readMissions } from '@/lib/missions';
import Icon from './Icons';
import MenuBoard from './MenuBoard';

interface Props {
  level: number;
  completed: number;
  onPlay: () => void;
  onRandom: () => void;
  onLevels: () => void;
  onSettings: () => void;
  onTutorial: () => void;
  onDaily: () => void;
  daily: { done: boolean; streak: number; weeklyDone: boolean };
  onWeekly: () => void;
  onInstall?: () => void;
  ready: boolean;
}

export default function MainMenu({ level, completed, onPlay, onRandom, onLevels, onSettings, onTutorial, onDaily, daily, onWeekly, onInstall, ready }: Props) {
  return (
    <main className="menu">
      <h1 aria-label="Control Your Balls"><span>Control</span><em>Your</em><span>Balls</span></h1>
      <MenuBoard onWin={onPlay} ready={ready} />
      <p className="tagline">Drag the board to tilt it. Roll the ball into the green hole.</p>
      <div className="menu-actions">
        <button className="btn primary big" onClick={onPlay} disabled={!ready}>
          {completed > 0 ? `▶  Continue · Level ${level}` : '▶  Play'}
        </button>
        <div className="row2">
          <button className={`btn daily${daily.done ? ' done' : ''}`} onClick={onDaily} disabled={!ready}>
            {daily.done ? '✓ Daily' : <><Icon name="flame" size={18} /> Daily</>}{daily.streak > 0 && <small> {daily.streak}d</small>}
          </button>
          <button className="btn" onClick={onLevels} disabled={!ready}>Levels</button>
        </div>
        {onInstall && <button className="btn ghost" onClick={onInstall}><Icon name="install" size={18} /> Install app</button>}
      </div>
      <p className="where">World {Math.ceil(level / 10)} · level {((level - 1) % 10) + 1} of 10</p>
      <details className="more">
        <summary>More</summary>
        <nav className="tabs" aria-label="More modes">
          <button onClick={onWeekly} disabled={!ready}>{daily.weeklyDone ? '✓ Weekly' : 'Weekly'}</button>
          <button onClick={onRandom} disabled={!ready}>Random</button>
          <button onClick={onTutorial} disabled={!ready}>Tutorial</button>
        </nav>
        <section className="missions" aria-label="Daily missions" suppressHydrationWarning>
          <h2>Today&apos;s missions</h2>
          <ul>
            {readMissions().map((m) => (
              <li key={m.kind} className={m.have >= m.goal ? 'done' : ''}>
                <i style={{ width: `${(m.have / m.goal) * 100}%` }} />
                <span>{m.have >= m.goal ? '✓ ' : ''}{m.label}</span><b>{m.have}/{m.goal}</b>
              </li>
            ))}
          </ul>
        </section>
      <details className="guide">
        <summary>How to play &amp; obstacle guide</summary>
        <ol>
          <li><b>1</b>Drag the board to tilt it; it stays tilted. Drag the strip at the bottom to turn the view</li>
          <li><b>2</b>Roll balls out the open edge, tray by tray</li>
          <li><b>3</b>Each ball size fits only its own green hole. Red holes swallow balls</li>
        </ol>
        <ul className="legend">
          <li><i style={{ background: '#ff6fd0' }} />Bumpers kick</li>
          <li><i style={{ background: '#ffd23f' }} />Pads boost</li>
          <li><i style={{ background: '#7a5230' }} />Mud slows</li>
          <li><i style={{ background: '#31e0ff' }} />Blades spin</li>
          <li><i style={{ background: '#e0b020' }} />Gates rise and sink</li>
          <li><i style={{ background: '#ff9a1f' }} />Doors open for a few seconds</li>
          <li><i style={{ background: '#9b5cff' }} />Purple discs pull, orange push</li>
          <li><i style={{ background: '#3fd6c0' }} />Teal arrows: conveyor floor</li>
          <li><i style={{ background: '#9fe8ff' }} />Glass walls pass small or big balls</li>
          <li><i style={{ background: '#ff4d5e' }} />Red-edged sides have no wall</li>
          <li><i style={{ background: '#e6f8ff' }} />Ice slides, ridges grip, pink bounces</li>
          <li><i style={{ background: '#c86bff' }} />Portals teleport</li>
        </ul>
      </details>
      </details>
      <button className="gear" onClick={onSettings} aria-label="Settings"><Icon name="gear" size={22} /></button>
    </main>
  );
}
