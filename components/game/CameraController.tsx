'use client';
import { useEffect, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Level } from '@/lib/types';

export interface View { az: number; el: number; zoom: number }
/** `target` is where the player wants the camera; `cur` is where it is right now (eased). */
export interface ViewState { target: View; cur: View }

export const DEFAULT_EL = (58 * Math.PI) / 180;
export const TOP_EL = (84 * Math.PI) / 180;
export const MIN_EL = (22 * Math.PI) / 180;
export const defaultView = (): View => ({ az: 0, el: DEFAULT_EL, zoom: 1 });

function resetView(v: ViewState, zoom: number) {
  v.target = defaultView();
  v.cur = { ...v.cur, zoom };
}
function easeView(v: ViewState, k: number) {
  v.cur.az += (v.target.az - v.cur.az) * k;
  v.cur.el += (v.target.el - v.cur.el) * k;
  v.cur.zoom += (v.target.zoom - v.cur.zoom) * k;
}

/** Orbits the whole board. Distance is refitted for every angle so the board always stays in frame. */
export default function CameraController({ level, reducedMotion, view }: { level: Level; reducedMotion: boolean; view: MutableRefObject<ViewState> }) {
  useEffect(() => {
    // Each level starts from the default view, pulled back a little, and eases in.
    resetView(view.current, reducedMotion ? 1 : 1.3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  useFrame(({ camera, size }, dt) => {
    const v = view.current;
    const k = reducedMotion ? 1 : 1 - Math.exp(-7 * Math.min(dt, 0.05));
    easeView(v, k);
    const { az, el, zoom } = v.cur;

    const cam = camera as THREE.PerspectiveCamera;
    const { min, max } = level.bounds;
    const W = max[0] - min[0];
    const D = max[2] - min[2];
    const Hh = max[1] - min[1];
    const ca = Math.abs(Math.cos(az));
    const sa = Math.abs(Math.sin(az));
    const aspect = size.width / Math.max(1, size.height);
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    // Footprint as seen from this azimuth, plus room for the tilt swing and the HUD.
    const halfW = ((ca * W + sa * D) / 2) * 1.28;
    const halfH = (((sa * W + ca * D) * Math.sin(el) + Hh * Math.cos(el)) / 2) * 1.45;
    const dist = (Math.max(halfH / tanHalf, halfW / (tanHalf * aspect)) + 1.8) * zoom * (aspect > 1.2 ? 0.88 : 1);
    const cx = (min[0] + max[0]) / 2, cy = (min[1] + max[1]) / 2, cz = (min[2] + max[2]) / 2;
    camera.position.set(cx + dist * Math.cos(el) * Math.sin(az), cy + dist * Math.sin(el), cz + dist * Math.cos(el) * Math.cos(az));
    camera.lookAt(cx, cy, cz);
  });
  return null;
}
