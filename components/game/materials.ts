import * as THREE from 'three';

let hazard: THREE.CanvasTexture | null = null;
/** Yellow/black warning stripes, shared by every wall bar and gate. */
export function hazardTexture() {
  if (hazard) return hazard;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffcf2e';
  g.fillRect(0, 0, 64, 64);
  g.strokeStyle = '#2a1b00';
  g.lineWidth = 16;
  for (let k = -64; k <= 128; k += 32) {
    g.beginPath();
    g.moveTo(k, 64);
    g.lineTo(k + 64, 0);
    g.stroke();
  }
  hazard = new THREE.CanvasTexture(c);
  hazard.wrapS = hazard.wrapT = THREE.RepeatWrapping;
  hazard.repeat.set(3, 1);
  hazard.colorSpace = THREE.SRGBColorSpace;
  return hazard;
}

let hatch: THREE.CanvasTexture | null = null;
/** Dark floor with raised ridges: the rough, gripping patch. */
export function hatchTexture() {
  if (hatch) return hatch;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#3a3f4f';
  g.fillRect(0, 0, 64, 64);
  g.strokeStyle = '#8b93ab';
  g.lineWidth = 5;
  for (let k = -64; k <= 128; k += 16) { g.beginPath(); g.moveTo(k, 64); g.lineTo(k + 64, 0); g.stroke(); }
  hatch = new THREE.CanvasTexture(c);
  hatch.wrapS = hatch.wrapT = THREE.RepeatWrapping;
  hatch.repeat.set(2, 2);
  hatch.colorSpace = THREE.SRGBColorSpace;
  return hatch;
}

let rings: THREE.CanvasTexture | null = null;
/** Pink and white rings like a trampoline. */
export function ringTexture() {
  if (rings) return rings;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ff5fc8';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#ffe3f6';
  g.lineWidth = 8;
  for (const r of [14, 34, 54]) { g.beginPath(); g.arc(64, 64, r, 0, Math.PI * 2); g.stroke(); }
  rings = new THREE.CanvasTexture(c);
  rings.colorSpace = THREE.SRGBColorSpace;
  return rings;
}
