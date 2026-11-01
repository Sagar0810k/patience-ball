import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/** Soft studio reflections for the glossy balls and walls: a few glowing panels baked once into an environment map.
 *  (A tiny replacement for drei's Environment + Lightformer, which pulled in loaders the game never uses.) */
const PANELS: Array<{ color: string; intensity: number; pos: [number, number, number]; size: [number, number] }> = [
  { color: '#bfa8ff', intensity: 3, pos: [0, 8, 6], size: [16, 5] },
  { color: '#6ff5ee', intensity: 2, pos: [-8, 3, 4], size: [4, 8] },
  { color: '#ffffff', intensity: 1.5, pos: [8, 4, 3], size: [3, 6] },
  { color: '#ff9ad5', intensity: 0.8, pos: [0, -5, 4], size: [14, 2] },
];

const setEnv = (scene: THREE.Scene, tex: THREE.Texture | null) => { scene.environment = tex; };

export default function StudioEnv() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const room = new THREE.Scene();
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    for (const p of PANELS) {
      const geo = new THREE.PlaneGeometry(p.size[0], p.size[1]);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(p.color).multiplyScalar(p.intensity), side: THREE.DoubleSide, toneMapped: false });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(...p.pos);
      m.lookAt(0, 0, 0);
      room.add(m);
      geos.push(geo);
      mats.push(mat);
    }
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromScene(room, 0.04);
    setEnv(scene, rt.texture);
    return () => {
      setEnv(scene, null);
      rt.dispose();
      pmrem.dispose();
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    };
  }, [gl, scene]);
  return null;
}
