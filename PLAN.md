# Patience Balls — Project Plan

## Overview
A premium casual 3D physics-puzzle browser game. Marbles roll down staggered platforms, fall through real holes, and get captured in target cups. The player drags a release cursor on the top platform to aim and release marbles, filling all target holes to win. Infinite deterministic seeded levels, tier securing, local persistence, PWA support.

## Tech Stack
- Next.js 16.4.2 (App Router, TypeScript, React 19.3.0)
- Three.js 0.173.0 via @react-three/fiber 9.0.3 and @react-three/drei 10.0.0
- Rapier WASM physics via @dimforge/rapier3d-compat 0.13.1
- CSS Modules / global CSS (no UI frameworks)
- IndexedDB for persistence
- No backend required
- PWA installable (manifest + service worker)

## Project Structure
app/
  layout.tsx, page.tsx, globals.css
components/
  game/  GameCanvas, GameScene, Platform, Marble, CameraController
  ui/    MainMenu, GameHUD, PauseOverlay, FailedOverlay, CompletedOverlay, SettingsPanel, ProgressStats, SavePanel
lib/
  types.ts
  physics/  physicsWorld.ts
  audio/    audioManager.ts
  levels/   seededRandom.ts, difficultyManager.ts, levelGenerator.ts, levelValidator.ts
  progression/  tierManager.ts
  storage/  db.ts, migrations.ts, saveManager.ts
public/
  icons/, sounds/, manifest.json, sw.js
tests/
PLAN.md

## Completed
- [x] Scaffold Next.js 16 + React 19 + TypeScript
- [x] Install three, r3f 9, drei 10, rapier 0.13.1 (React 19 compatible)
- [x] Clean build, lint, typecheck pass
- [x] Rapier API verified
- [x] PLAN.md

## Phase 1 — Foundation (lib core)
- [ ] lib/types.ts — Hole, Platform, Level, LevelStatus, GameSettings, GameStats, SaveData, MarbleState, defaults
- [ ] lib/physics/physicsWorld.ts — initPhysics, stepPhysics, drainCollisionEvents, createMarble, createStaticBody, addBoxCollider, addBallCollider, addCylinderCollider, buildPlatform, removeBody, getters/setters, dispose
- [ ] lib/audio/audioManager.ts — Web Audio synthesized sounds + toggle
- [ ] lib/levels/seededRandom.ts — mulberry32 + helpers
- [ ] lib/levels/difficultyManager.ts — getDifficulty(level)
- [ ] lib/levels/levelValidator.ts — bounds, overlap, descending, pass-hole alignment, target<=marbleCount
- [ ] lib/levels/levelGenerator.ts — generateLevel(levelNumber, seed), fallback layout
- [ ] lib/progression/tierManager.ts — securedTiers, allSecured, allTargetFilled
- [ ] lib/storage/db.ts — IndexedDB adapter
- [ ] lib/storage/migrations.ts — schema migrations
- [ ] lib/storage/saveManager.ts — load/save/export/import/reset with validation

## Phase 2 — Rendering & Gameplay (components)
- [ ] components/game/GameCanvas.tsx — R3F Canvas, perf scaling
- [ ] components/game/GameScene.tsx — body build, step+sync, game state machine, banking, loss detection, tier securing, sounds
- [ ] components/game/Platform.tsx — slab mesh, hole visuals, cup meshes, collider build
- [ ] components/game/Marble.tsx — mesh synced to body
- [ ] components/game/CameraController.tsx — adaptive framing, smooth transitions, reset, ortho/perspective, reduced-motion
- [ ] components/ui/MainMenu.tsx
- [ ] components/ui/GameHUD.tsx
- [ ] components/ui/PauseOverlay.tsx
- [ ] components/ui/FailedOverlay.tsx
- [ ] components/ui/CompletedOverlay.tsx
- [ ] components/ui/SettingsPanel.tsx
- [ ] components/ui/ProgressStats.tsx
- [ ] components/ui/SavePanel.tsx
- [ ] app/page.tsx — screen router + HUD wiring
- [ ] app/globals.css — violet/lavender theme, responsive, safe areas, touch targets, reduced-motion

## Phase 3 — PWA
- [ ] public/manifest.json
- [ ] public/sw.js (app shell caching)
- [ ] Icons (procedural/simple SVG/PNG)

## Phase 4 — Testing & Verification
- [ ] tests/levelGen.test.ts — hundreds of seeds, validation, fallback
- [ ] tests/save.test.ts — round-trip, corruption recovery, reset, export/import
- [ ] Manual: phone/tablet/laptop/desktop viewports, portrait/landscape, touch, refresh, restart
- [ ] npm run typecheck, lint, build green

## Game Design Details

### Level model
- Platforms (slabs) stacked top->bottom, staggered (zigzag) in X.
- Each slab has holes: 'target' (cup below) or 'pass' (open gap to slab below).
- Bottom tier: all target cups (no pass holes) -> no forced losses.
- Edges walled -> marbles only exit via holes -> controlled flow.

### Win / Fail
- Win: all target holes filled.
- Fail: marbles exhausted (releasedCount >= marbleCount) before all filled.
- (Losses only possible if a pass hole has no slab below; validator prevents this.)

### Player control
- Drag release cursor along top platform X; release a marble.
- "Release all" spreads remaining marbles across positions.

### Tier securing
- A tier secures when all its target holes are filled.
- Win triggers when all tiers secured.

### Difficulty scaling (by level number)
- tiers: 2 + floor(level/4), capped 2..9
- holes per tier: 1 + floor(level/6), capped 1..3
- total targets: tiers + floor(level/5), capped tiers..tiers*3
- marble slack: 2 + floor(level/8), capped 1..6
- marbleCount = totalTargets + slack
- Platform width/depth shrink slightly; holes get smaller at higher levels.

### Physics
- Gravity -9.81 Y, fixed timestep 1/60.
- Marbles: dynamic rigid bodies with ball colliders, restitution ~0.45, friction ~0.35, CCD enabled.
- Platforms: static bodies with compound colliders (surface strips around holes + perimeter walls + cups for targets).
- Cups: floor (thin cylinder) + ring of small boxes (open top).
- Banking detection: poll marble speed + position; when inside a target cup and speed < threshold for N frames -> banked (lockTranslations + lockRotations + sleep), increment hole.filled, cap hole if filled.
- Abyss: marble y < abyssY -> lost (should not happen in valid levels).

### Persistence (IndexedDB)
- Store: 'state' object store, key 'save_v1'.
- SaveData: version, settings, stats, highestUnlocked, currentLevel, completedLevels, unlockedCosmetics, bestAttempts, checkpoint (resumable level snapshot).
- Save on meaningful events (level complete, settings change, level start), not every frame.
- Validate imported JSON; never silently overwrite (confirm before destructive import/reset).
- Migrations by version number; recover from corruption (fall back to defaults) and quota errors (warn, keep in-memory).

### PWA
- manifest.json with name, short_name, icons, start_url, display standalone, theme_color.
- sw.js caches app shell + essential assets; offline playable after first load.
- Do not claim offline support until tested.

### Audio (Web Audio API, synthesized)
- release, land, cup (chime), lose (descend), win (ascending arpeggio), fail (descend sawtooth), click.
- Sound toggle persists in settings.

### Visual Direction
- Soft violet/lavender background with subtle stars + depth.
- Floating staggered platforms: bright cyan/turquoise top, dark navy/black thick sides.
- Dark shiny metallic marbles with reflections, shadows, smooth movement.
- Realistic perspective camera (auto-framed), soft lighting, AO-like shading, restrained glow.
- Procedural geometry/materials only (no external assets).
- Smooth camera transitions, subtle particles, restrained completion effects.

### Accessibility & Responsive
- Mobile-first; portrait + landscape; no horizontal scroll.
- Touch targets >= 44px; tap/touch/mouse/keyboard.
- Safe areas, viewport resize, orientation change, high-DPI.
- No hover-only controls.
- Reduced-motion respect; tab background pause/resume.
- Haptics when supported.

### Keyboard shortcuts (desktop)
- Space: release marble
- R: restart level
- P: pause
- C: camera reset
- N: next level (when completed)
- M: mute toggle
- Esc: pause/back

## Acceptance Criteria
1. Marbles visibly move under gravity and collide correctly.
2. Holes are real openings (marbles fall through).
3. Tier locking works; failure and retry work; completion works.
4. Hundreds of deterministic layouts generated and validated; fallback on invalid.
5. Save restoration, corrupted saves, reset, export, import all work.
6. Phone, tablet, laptop, desktop viewports; portrait/landscape; touch; refresh.
7. lint + typecheck + build all pass.
8. No critical bugs.

## Notes
- Do not claim mathematical solvability; validation only proves basic reachability/sanity.
- Different devices have separate browser saves (IndexedDB is per-origin).
- Prefer stable compatible versions; React 19 requires r3f 9.x + drei 10.x.
- Keep simulation state outside high-frequency React state updates; clean up physics bodies/listeners/timers/GPU resources.

## Added in implementation
- Every level rolls its own marble radius (0.2-0.4), floor count (2-9, grows with level), marble count, hole count/capacity and tilt.
- Hole width scales with marble radius (1.6x-1.8x), so bigger marbles get bigger holes and cups.
- "Random level" mode: random level number + random seed, does not affect progression.
- Game rules live in lib/physics/simulation.ts (headless), so tests run real Rapier physics with a bot player.
- tierManager folded into simulation; UI overlays and settings/save panels consolidated into fewer files.
