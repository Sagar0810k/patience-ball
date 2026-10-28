'use client';

interface Props {
  level: number;
  completed: number;
  onPlay: () => void;
  onRandom: () => void;
  onLevels: () => void;
  onSettings: () => void;
  onTutorial: () => void;
  ready: boolean;
}

export default function MainMenu({ level, completed, onPlay, onRandom, onLevels, onSettings, onTutorial, ready }: Props) {
  return (
    <main className="menu">
      <span className="orb a" aria-hidden />
      <span className="orb b" aria-hidden />
      <span className="orb c" aria-hidden />
      <span className="orb d" aria-hidden />
      <div className="hero" aria-hidden>
        <div className="mini-board">
          <i className="mh good" />
          <i className="mh bad" />
          <i className="mb b1" />
          <i className="mb b2" />
          <i className="mb b3" />
        </div>
      </div>
      <h1>Patience<br />Balls</h1>
      <p className="tagline">Tilt the board. Roll every ball home.</p>
      <div className="menu-actions">
        <button className="btn primary big" onClick={onPlay} disabled={!ready}>
          {completed > 0 ? `▶  Continue · Level ${level}` : '▶  Play'}
        </button>
        <div className="row2">
          <button className="btn" onClick={onLevels} disabled={!ready}>Levels</button>
          <button className="btn" onClick={onRandom} disabled={!ready}>Random</button>
        </div>
        <button className="btn ghost" onClick={onTutorial} disabled={!ready}>🎓 Tutorial</button>
        <button className="btn ghost" onClick={onSettings}>⚙ Settings &amp; progress</button>
      </div>
      <div className="chips" aria-label="Progress">
        <span className="chip">★ {completed} level{completed === 1 ? '' : 's'} cleared</span>
        <span className="chip">Next · {level}</span>
      </div>
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
    </main>
  );
}
