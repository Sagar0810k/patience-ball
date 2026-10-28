'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { GameSettings, GameSnapshot, Level, SaveData } from '@/lib/types';
import { defaultSave } from '@/lib/types';
import { generateLevel, randomSeed } from '@/lib/levels/levelGenerator';
import { loadSave, resetSave, writeSave } from '@/lib/storage/saveManager';
import { setSoundEnabled, sound } from '@/lib/audio/audioManager';
import { THEMES } from '@/lib/themes';
import type { GameController } from '@/components/game/GameScene';
import MainMenu from '@/components/ui/MainMenu';
import GameHUD from '@/components/ui/GameHUD';
import LevelSelect from '@/components/ui/LevelSelect';
import TipCard from '@/components/ui/TipCard';
import { markTipsSeen, newTips, type Tip } from '@/lib/tips';
import Tutorial from '@/components/ui/Tutorial';
import GameLoading from '@/components/ui/GameLoading';
import SettingsPanel from '@/components/ui/SettingsPanel';
import { CompletedOverlay, FailedOverlay, PauseOverlay, starsFor } from '@/components/ui/Overlays';

// Three.js + WASM physics only load on the client, after the menu is already showing.
const loadGame = () => import('@/components/game/GameCanvas');
const GameCanvas = dynamic(loadGame, { ssr: false });
const TUT_KEY = 'pb_tutorial_seen';
const tutSeen = () => { try { return localStorage.getItem(TUT_KEY) === '1'; } catch { return true; } };

type Screen = 'menu' | 'game' | 'settings' | 'levels';

export default function Page() {
  const [save, setSave] = useState<SaveData>(defaultSave);
  const saveRef = useRef(save);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState('');
  const [screen, setScreen] = useState<Screen>('menu');
  const [level, setLevel] = useState<Level | null>(null);
  const [random, setRandom] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const [tips, setTips] = useState<Tip[]>([]);
  const [snap, setSnap] = useState<GameSnapshot | null>(null);
  const controller = useRef<GameController | null>(null);
  const finished = useRef(false);
  const ctl = useCallback(() => controller.current, []);

  const commit = useCallback((next: SaveData) => {
    saveRef.current = next;
    setSave(next);
    setSoundEnabled(next.settings.sound);
    void writeSave(next).then((ok) => ok || setNotice('Could not save progress on this device. Your game still works, but progress may be lost on refresh.'));
  }, []);

  useEffect(() => {
    loadSave().then(({ data, recovered }) => {
      saveRef.current = data;
      setSave(data);
      setSoundEnabled(data.settings.sound);
      setLoaded(true);
      if (recovered) setNotice('Saved progress could not be read, so a fresh save was started.');
    });
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // The 3D engine and physics are ~2.6 MB: fetch and compile them in the background while the menu is showing.
  useEffect(() => {
    if (!loaded) return;
    // Skip the background download on data-saver or slow connections; the game then loads when Play is pressed.
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || /^(slow-2g|2g|3g)$/.test(conn?.effectiveType ?? '')) return;
    const warm = () => { void loadGame(); void import('@/lib/physics/physicsWorld').then((m) => m.loadRapier()); };
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(warm); else setTimeout(warm, 1200);
  }, [loaded]);

  const finishTutorial = useCallback(() => { try { localStorage.setItem(TUT_KEY, '1'); } catch {} setTutorial(false); }, []);

  const start = useCallback((n: number, seed?: number, isRandom = false, withTutorial = false) => {
    if (withTutorial || (n === 1 && !isRandom && !tutSeen() && saveRef.current.stats.levelsCompleted === 0)) setTutorial(true);
    const lv = generateLevel(n, seed);
    finished.current = false;
    setLevel(lv);
    setTips(newTips(lv));
    setRandom(isRandom);
    setSnap(null);
    setPaused(false);
    setAttempt((a) => a + 1);
    setScreen('game');
    const s = saveRef.current;
    commit({ ...s, currentLevel: isRandom ? s.currentLevel : n, checkpoint: { levelNumber: n, seed: lv.seed, random: isRandom }, stats: { ...s.stats, attempts: s.stats.attempts + 1 } });
  }, [commit]);

  const playRandom = () => start(1 + Math.floor(Math.random() * Math.max(8, saveRef.current.highestUnlocked + 4)), randomSeed(), true);

  const restart = useCallback(() => {
    if (!level) return;
    finished.current = false;
    setSnap(null);
    setPaused(false);
    setAttempt((a) => a + 1);
    const s = saveRef.current;
    commit({ ...s, stats: { ...s.stats, attempts: s.stats.attempts + 1 } });
  }, [level, commit]);

  const onSnapshot = useCallback((s: GameSnapshot) => {
    setSnap(s);
    if (s.status === 'playing' || finished.current) return;
    finished.current = true;
    const cur = saveRef.current;
    const stats = { ...cur.stats, ballsPlayed: cur.stats.ballsPlayed + s.total, ballsCollected: cur.stats.ballsCollected + s.collected };
    if (s.status === 'won' && level && !random) {
      const n = level.levelNumber;
      const best = cur.bestTimes[n];
      const secs = Math.round(s.elapsed);
      commit({
        ...cur,
        stats: { ...stats, levelsCompleted: cur.stats.levelsCompleted + (cur.completedLevels.includes(n) ? 0 : 1) },
        completedLevels: cur.completedLevels.includes(n) ? cur.completedLevels : [...cur.completedLevels, n],
        highestUnlocked: Math.max(cur.highestUnlocked, n + 1),
        currentLevel: n + 1,
        bestTimes: { ...cur.bestTimes, [n]: best ? Math.min(best, secs) : secs },
        stars: { ...cur.stars, [n]: Math.max(cur.stars[n] ?? 0, starsFor(s.lost, s.allowedLoss)) },
        checkpoint: null,
      });
    } else commit({ ...cur, stats });
  }, [level, random, commit]);

  // Count play time only while actually playing and visible.
  useEffect(() => {
    if (screen !== 'game' || paused || snap?.status !== 'playing') return;
    const id = setInterval(() => {
      if (document.hidden) return;
      const s = saveRef.current;
      saveRef.current = { ...s, stats: { ...s.stats, playSeconds: s.stats.playSeconds + 1 } };
    }, 1000);
    return () => clearInterval(id);
  }, [screen, paused, snap?.status]);

  // Pause when the tab is hidden.
  useEffect(() => {
    const f = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, []);

  const toMenu = useCallback(() => { setPaused(false); setScreen('menu'); }, []);
  const nextLevel = useCallback(() => {
    if (random) playRandom();
    else start((level?.levelNumber ?? 0) + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [random, level, start]);

  // Keyboard: arrows/WASD tip the board while held; shortcuts for the rest.
  useEffect(() => {
    if (screen !== 'game') return;
    const held = new Set<string>();
    const sync = () => {
      const k = (a: string, b: string) => (held.has(a) || held.has(a.toUpperCase()) ? -1 : 0) + (held.has(b) || held.has(b.toUpperCase()) ? 1 : 0);
      const x = (held.has('ArrowLeft') ? -1 : 0) + (held.has('ArrowRight') ? 1 : 0) + k('a', 'd');
      const z = (held.has('ArrowUp') ? -1 : 0) + (held.has('ArrowDown') ? 1 : 0) + k('w', 's');
      controller.current?.setKeys(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, z)));
    };
    const tilt = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's', 'A', 'D', 'W', 'S'];
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (tilt.includes(e.key)) { e.preventDefault(); held.add(e.key); sync(); return; }
      switch (e.key) {
        case 'r': case 'R': restart(); break;
        case 'p': case 'P': case 'Escape': setPaused((v) => !v); break;
        case 'f': case 'F': case ' ': controller.current?.setPointer(0, 0); break;
        case 'c': case 'C': controller.current?.resetCamera(); break;
        case 'q': case 'Q': controller.current?.rotate(-1); break;
        case 'e': case 'E': controller.current?.rotate(1); break;
        case '+': case '=': controller.current?.zoomBy(0.85); break;
        case '-': controller.current?.zoomBy(1.18); break;
        case 't': case 'T': controller.current?.toggleTop(); break;
        case 'n': case 'N': if (snap?.status === 'won') nextLevel(); break;
        case 'm': case 'M': commit({ ...saveRef.current, settings: { ...saveRef.current.settings, sound: !saveRef.current.settings.sound } }); break;
      }
    };
    const up = (e: KeyboardEvent) => { if (held.delete(e.key)) sync(); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      ctl()?.setKeys(0, 0);
    };
  }, [screen, snap?.status, restart, nextLevel, commit, ctl]);

  // Phone tilt: leaning the phone tips the board. Needs a permission tap on iOS.
  const [phoneTilt, setPhoneTilt] = useState(false);
  const canTiltPhone = useSyncExternalStore(
    () => () => {},
    () => 'DeviceOrientationEvent' in window && window.matchMedia('(pointer: coarse)').matches,
    () => false,
  );
  useEffect(() => {
    if (!phoneTilt || screen !== 'game') return;
    let base: { b: number; g: number } | null = null;
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const on = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      base ??= { b: e.beta, g: e.gamma }; // whatever angle you hold the phone at when you turn it on is "flat"
      controller.current?.setDevice(clamp((e.gamma - base.g) / 22), clamp((e.beta - base.b) / 22));
    };
    window.addEventListener('deviceorientation', on);
    return () => {
      window.removeEventListener('deviceorientation', on);
      ctl()?.setDevice(0, 0);
    };
  }, [phoneTilt, screen, ctl]);
  const togglePhoneTilt = async () => {
    if (phoneTilt) return setPhoneTilt(false);
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    try {
      if (DOE.requestPermission && (await DOE.requestPermission()) !== 'granted') return setNotice('Motion access was not allowed, so drag the screen to tilt instead.');
      setPhoneTilt(true);
    } catch {
      setNotice('Phone tilt is not available here, so drag the screen to tilt instead.');
    }
  };

  const theme = THEMES[(level?.theme ?? 0) % THEMES.length];
  const setSettings = (s: GameSettings) => commit({ ...saveRef.current, settings: s });

  if (screen === 'settings') {
    return (
      <SettingsPanel
        save={save}
        onSettings={setSettings}
        onReplace={commit}
        onReset={async () => commit(await resetSave())}
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'levels') {
    return <LevelSelect save={save} onPick={(n) => { sound.click(); start(n); }} onBack={() => setScreen('menu')} />;
  }

  return (
    <>
      {notice && (
        <div className="notice" role="alert">
          {notice} <button className="link" onClick={() => setNotice('')}>Dismiss</button>
        </div>
      )}
      {screen === 'menu' && (
        <MainMenu
          ready={loaded}
          level={Math.min(save.currentLevel, save.highestUnlocked)}
          completed={save.stats.levelsCompleted}
          onTutorial={() => { sound.click(); start(1, undefined, false, true); }}
          onPlay={() => { sound.click(); start(Math.min(save.currentLevel, save.highestUnlocked)); }}
          onRandom={() => { sound.click(); playRandom(); }}
          onLevels={() => setScreen('levels')}
          onSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'game' && level && (
        <div className="game" style={{ background: `linear-gradient(180deg, ${theme.bgTop}, ${theme.bgBottom})` }}>
          <div className="canvas-wrap">
            <GameCanvas
              level={level}
              attempt={attempt}
              paused={paused || tutorial || tips.length > 0}
              settings={save.settings}
              controllerRef={controller}
              onSnapshot={onSnapshot}
            />
          </div>
          {!snap && <GameLoading />}
          {tutorial && snap && <Tutorial onDone={finishTutorial} />}
          {!tutorial && snap && tips.length > 0 && <TipCard tips={tips} onDone={() => { markTipsSeen(tips.map((t) => t.key)); setTips([]); }} />}
          <GameHUD
            label={random ? `Random · ${level.trays.length} trays` : `Level ${level.levelNumber}${level.tier === 'boss' ? ' · BOSS' : level.tier === 'hard' ? ' · HARD' : ''}`}
            tier={level.tier}
            classCount={level.classRadii.length}
            snap={snap}
            attempt={attempt}
            firstLevel={!random && level.levelNumber === 1 && save.stats.levelsCompleted === 0}
            sound={save.settings.sound}
            sensitivity={save.settings.sensitivity}
            onSensitivity={() => { const L = [0.6, 1, 1.5, 2]; const i = L.indexOf(save.settings.sensitivity); setSettings({ ...save.settings, sensitivity: L[(i + 1) % L.length] }); }}
            onSound={() => setSettings({ ...save.settings, sound: !save.settings.sound })}
            canTiltPhone={canTiltPhone}
            phoneTilt={phoneTilt}
            onPause={() => setPaused(true)}
            onRestart={restart}
            onCamera={() => controller.current?.resetCamera()}
            onOrbit={(a, e) => controller.current?.orbit(a, e)}
            onFlat={() => controller.current?.setPointer(0, 0)}
            onPhoneTilt={togglePhoneTilt}
          />
          {paused && snap?.status === 'playing' && <PauseOverlay onResume={() => setPaused(false)} onRestart={restart} onMenu={toMenu} />}
          {snap?.status === 'failed' && <FailedOverlay collected={snap.collected} required={snap.required} lost={snap.lost} onRetry={restart} onMenu={toMenu} />}
          {snap?.status === 'won' && <CompletedOverlay seconds={snap.elapsed} lost={snap.lost} allowedLoss={snap.allowedLoss} total={snap.total} random={random} onNext={nextLevel} onRetry={restart} onMenu={toMenu} />}
        </div>
      )}
    </>
  );
}
