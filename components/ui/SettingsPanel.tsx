'use client';
import { useRef, useState } from 'react';
import type { GameSettings, SaveData } from '@/lib/types';
import { allTips, seenTips } from '@/lib/tips';
import { SKINS } from '@/lib/skins';
import { exportSave, parseImport } from '@/lib/storage/saveManager';

interface Props {
  save: SaveData;
  onSettings: (s: GameSettings) => void;
  canGyro: boolean;
  onGyro: (on: boolean) => void;
  onReplace: (d: SaveData) => void;
  onReset: () => void;
  onBack: () => void;
}

export default function SettingsPanel({ save, onSettings, canGyro, onGyro, onReplace, onReset, onBack }: Props) {
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const s = save.settings;
  const st = save.stats;
  const [seen] = useState(() => (typeof window === 'undefined' ? [] : seenTips()));
  const totalStars = Object.values(save.stars).reduce((a, b) => a + b, 0);
  const toggle = (k: keyof GameSettings) => onSettings({ ...s, [k]: !s[k] });

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportSave(save)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patience-balls-save.json';
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Save exported.');
  };
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const data = parseImport(await f.text());
    if (!data) return setMsg('That file is not a valid Patience Balls save. Nothing changed.');
    if (window.confirm(`Replace your current progress with this save (highest level ${data.highestUnlocked})?`)) {
      onReplace(data);
      setMsg('Save imported.');
    }
    if (file.current) file.current.value = '';
  };

  return (
    <main className="panel">
      <div className="panel-head">
        <button className="btn icon" onClick={onBack} aria-label="Back">←</button>
        <h2>Settings</h2>
      </div>
      {(
        [['sound', 'Sound'], ['music', 'Music'], ['haptics', 'Vibration'], ['reducedMotion', 'Reduce motion']] as const
      ).map(([k, label]) => (
        <label key={k} className="row">
          <span>{label}</span>
          <input type="checkbox" checked={s[k]} onChange={() => toggle(k)} />
        </label>
      ))}
      {canGyro && (
        <label className="row">
          <span>Gyroscope tilt<small className="sub">Tilt your phone to tilt the board</small></span>
          <input type="checkbox" checked={s.gyro} onChange={(e) => onGyro(e.target.checked)} aria-label="Gyroscope tilt" />
        </label>
      )}
      <label className="row">
        <span>Tilt sensitivity</span>
        <select value={s.sensitivity} onChange={(e) => onSettings({ ...s, sensitivity: Number(e.target.value) })} aria-label="Tilt sensitivity">
          <option value={0.6}>Gentle</option>
          <option value={1}>Normal</option>
          <option value={1.5}>Quick</option>
          <option value={2}>Very quick</option>
        </select>
      </label>
      <h3>Ball style</h3>
      <div className="skins" role="radiogroup" aria-label="Ball style">
        {SKINS.map((k) => {
          const locked = totalStars < k.stars;
          return (
            <button key={k.id} role="radio" aria-checked={s.skin === k.id} disabled={locked} className={`skin${s.skin === k.id ? ' on' : ''}`} onClick={() => onSettings({ ...s, skin: k.id })}>
              <i style={{ filter: `saturate(${0.6 + k.metalness * 0.8}) brightness(${1 + k.clearcoat * 0.1})`, opacity: locked ? 0.4 : 1 }} />
              <b>{k.name}</b>
              <small>{locked ? `🔒 ${k.stars}★` : 'Unlocked'}</small>
            </button>
          );
        })}
      </div>
      <h3>Discovered</h3>
      <div className="badges" aria-label="Elements you have discovered">
        {allTips().map((t) => {
          const got = seen.some((x) => x.key === t.key);
          return <span key={t.key} className={`badge${got ? ' got' : ''}`} title={got ? t.title : 'Not discovered yet'}>{got ? t.icon : '?'}<small>{got ? t.title : '???'}</small></span>;
        })}
      </div>
      <h3>Progress</h3>
      <dl className="stats">
        <dt>Highest level</dt><dd>{save.highestUnlocked}</dd>
        <dt>Levels completed</dt><dd>{st.levelsCompleted}</dd>
        <dt>Attempts</dt><dd>{st.attempts}</dd>
        <dt>Balls played</dt><dd>{st.ballsPlayed}</dd>
        <dt>Balls brought home</dt><dd>{st.ballsCollected}</dd>
        <dt>Time played</dt><dd>{Math.floor(st.playSeconds / 60)} min</dd>
      </dl>
      <h3>Save data</h3>
      <p className="note">Saved in this browser only. Export to move progress to another device.</p>
      <div className="row-buttons">
        <button className="btn" onClick={download}>Export</button>
        <button className="btn" onClick={() => file.current?.click()}>Import</button>
        <button className="btn danger" onClick={() => window.confirm('Erase all progress on this device?') && onReset()}>Reset</button>
      </div>
      <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <p role="status" className="note">{msg}</p>
    </main>
  );
}
