// Shroomtoad (Nature): squat, wide toad carrying a giant spotted mushroom cap on its back.
// Big bulging eyes on top of a flat head, a wide grin, chunky folded back legs, webbed
// feet, warty skin and glowing spore dots under the cap. Moves with a hopping gait.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, quadBones, addEye } from '../lib.js';
import { legs, tail } from '../kit.js';

const palette = [
  ['skin', '#7fae4a'], ['skinDeep', '#557d2e'], ['skinLight', '#b5d777'], ['belly', '#f2e6b8'], ['wart', '#9cc35e'],
  ['cap', '#d8463a'], ['capDeep', '#a52a28'], ['spot', '#fff4e0'], ['gill', '#f3d9b8'], ['stem', '#efe2c8'],
  ['nose', '#2b2a18'], ['mouth', '#7a2a32'], ['pupil', '#1a1610'], ['white', '#ffffff'], ['iris', '#e8b23a'],
];
const glow = { Eyes: '#ffd56a', Glow: '#b8ff6a', GlowCore: '#f4ffc8' };

const bones = quadBones({
  hips: [1.0, 0.55], spine: [1.12, -0.05], chest: [1.05, -0.6], neck: [1.1, -0.9], head: [1.2, -1.15], jaw: [0.88, -1.25],
  ear: [0.5, 1.75, -1.05],
  tail: [[0.9, 1.15], [0.86, 1.3], [0.82, 1.42], [0.78, 1.5], [0.75, 1.56]],
  front: { x: 0.62, upper: [0.85, -0.7], lower: [0.5, -0.85], paw: [0.15, -0.95] },
  back: { x: 0.85, upper: [0.95, 0.55], lower: [0.55, 0.3], paw: [0.15, 0.8] },
});

function build(B, W) {
  const bodyW = (p) => (p.z < -0.3 ? [['Chest', 0.7], ['Spine', 0.3]] : p.z > 0.3 ? [['Hips', 0.7], ['Spine', 0.3]] : [['Spine', 1]]);
  // squat round body + pale belly
  B.add(ell(1.15, 0.72, 1.25, 26, 16), { pos: [0, 1.05, -0.05], color: 'skin', weights: bodyW });
  B.add(ell(1.0, 0.45, 1.1, 20, 10), { pos: [0, 0.78, -0.15], color: 'belly', weights: bodyW });
  // warts: little bumps over the back and sides
  for (let i = 0; i < 26; i++) {
    const a = i * 2.39996, el = 0.25 + 0.6 * ((i * 0.618) % 1);
    const n = V([Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)]);
    if (Math.abs(n.x) < 0.25 && n.y > 0.7) continue; // keep the cap seat clear
    const p = V([n.x * 1.15, n.y * 0.72 + 1.05, n.z * 1.25 - 0.05]);
    B.add(ell(0.09, 0.06, 0.09, 8, 5), { pos: p.toArray(), quat: quatTo(n.toArray()), color: i % 3 ? 'wart' : 'skinDeep', weights: bodyW });
  }

  // --- the mushroom: short stem growing from the back, wide domed cap with spots + gills ---
  const capW = (p) => [['Spine', 0.75], ['Hips', 0.25]];
  B.add(new THREE.CylinderGeometry(0.42, 0.55, 0.6, 16), { pos: [0, 1.85, 0.15], color: 'stem', weights: capW });
  B.add(new THREE.TorusGeometry(0.46, 0.08, 6, 16), { pos: [0, 1.95, 0.15], rot: [Math.PI / 2, 0, 0], color: 'stem', weights: capW }); // ring (annulus)
  const capC = V([0, 2.15, 0.15]);
  const dome = new THREE.SphereGeometry(1.45, 30, 14, 0, Math.PI * 2, 0, Math.PI * 0.55); dome.scale(1, 0.72, 1);
  B.add(dome, { pos: capC.toArray(), color: 'cap', weights: capW });
  const under = new THREE.CircleGeometry(1.4, 30); under.rotateX(Math.PI / 2);
  B.add(new THREE.CylinderGeometry(1.42, 0.5, 0.18, 30, 1, true), { pos: capC.clone().add(V([0, 0.04, 0])).toArray(), color: 'gill', weights: capW });
  B.add(new THREE.TorusGeometry(1.41, 0.09, 6, 30), { pos: capC.clone().add(V([0, 0.13, 0])).toArray(), rot: [Math.PI / 2, 0, 0], color: 'capDeep', weights: capW });
  // gill lines under the rim
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; B.add(ell(0.42, 0.03, 0.02, 6, 3), { pos: capC.clone().add(V([Math.cos(a) * 0.95, 0.02, Math.sin(a) * 0.95])).toArray(), rot: [0, -a, -0.12], color: 'capDeep', weights: capW }); }
  // white spots on the cap
  const spots = [[0, 1.0, 0.36], [0.6, 0.62, 0.3], [2.1, 0.66, 0.28], [3.3, 0.6, 0.32], [4.4, 0.64, 0.26], [5.4, 0.62, 0.3], [1.2, 0.3, 0.22], [2.7, 0.28, 0.24], [3.9, 0.3, 0.2], [5.0, 0.26, 0.22], [0.2, 0.3, 0.2]];
  for (const [a, el, r] of spots) {
    const n = V([Math.cos(a) * Math.cos(el * Math.PI / 2), Math.sin(el * Math.PI / 2), Math.sin(a) * Math.cos(el * Math.PI / 2)]).normalize();
    const p = V([n.x * 1.45, n.y * 1.045, n.z * 1.45]).add(capC);
    B.add(ell(r, r * 0.9, 0.06, 12, 6), { pos: p.toArray(), quat: surfaceQuat([n.x, n.y * 1.4, n.z], [0, 1, 0]), color: 'spot', weights: capW });
  }
  // glowing spore dots hanging under the cap edge + two baby mushrooms
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + 0.3; B.add(ell(0.06, 0.06, 0.06, 6, 4), { pos: capC.clone().add(V([Math.cos(a) * 1.25, -0.08 - (k % 3) * 0.06, Math.sin(a) * 1.25])).toArray(), mesh: 'Glow', weights: capW }); }
  for (const [x, z, s] of [[0.7, 0.85, 1], [-0.75, 0.7, 0.8]]) {
    const base = V([x, 1.35 + 0.1 * s, z]);
    B.add(new THREE.CylinderGeometry(0.06 * s, 0.08 * s, 0.32 * s, 8), { pos: base.toArray(), color: 'stem', weights: bodyW });
    const d = new THREE.SphereGeometry(0.22 * s, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2); d.scale(1, 0.7, 1);
    B.add(d, { pos: base.clone().add(V([0, 0.15 * s, 0])).toArray(), color: 'cap', weights: bodyW });
    B.add(ell(0.06 * s, 0.03, 0.06 * s, 6, 4), { pos: base.clone().add(V([0.04, 0.3 * s, 0])).toArray(), color: 'spot', weights: bodyW });
  }

  // --- head: wide and flat, huge grin, bulging eyes on top ---
  B.add(ell(0.95, 0.55, 0.78, 24, 14), { pos: [0, 1.2, -1.05], color: 'skin', bone: 'Head' });
  B.add(taperFront(ell(0.82, 0.32, 0.55, 20, 10), 0.2), { pos: [0, 1.05, -1.4], color: 'skinLight', bone: 'Head' });
  // lower jaw (pale) + mouth line
  B.add(taperFront(ell(0.84, 0.24, 0.6, 20, 8), 0.2), { pos: [0, 0.82, -1.35], color: 'belly', bone: 'Jaw' });
  B.add(taperFront(ell(0.78, 0.06, 0.55, 20, 6), 0.2), { pos: [0, 0.95, -1.38], color: 'mouth', bone: 'Jaw' });
  B.add(new THREE.TorusGeometry(0.8, 0.035, 5, 24, Math.PI), { pos: [0, 0.98, -1.3], rot: [Math.PI / 2, 0, Math.PI], scale: [1, 0.72, 1], color: 'skinDeep', bone: 'Head' });
  for (const [, x] of SIDES) B.add(ell(0.05, 0.04, 0.03, 6, 4), { pos: [0.14 * x, 1.22, -1.88], color: 'nose', bone: 'Head' });
  // cheek pouches
  for (const [, x] of SIDES) B.add(ell(0.22, 0.18, 0.2, 10, 8), { pos: [0.82 * x, 0.95, -1.15], color: 'wart', bone: 'Head' });
  for (const [s, x] of SIDES) {
    // eye turret
    B.add(ell(0.34, 0.32, 0.34, 16, 12), { pos: [0.45 * x, 1.6, -1.15], color: 'skin', bone: `Ear${s}` });
    addEye(B, x, [0.45 * x, 1.66, -1.35], { r: [0.26, 0.26, 0.16], pupil: [0.15, 0.08], th: -0.3 * x, lid: 'skinDeep', lidAngle: 0.45, lidTilt: 0.1, bone: `Ear${s}` });
  }

  // --- legs: short front arms, big folded back thighs, webbed feet ---
  legs(B, W, { front: { r: [0.24, 0.16], top: 0.1 }, back: { r: [0.46, 0.2], top: 0.05 }, color: 'skin', footColor: 'skinDeep', clawColor: null, foot: 'stub', thighs: true });
  for (const [s, x] of SIDES) for (const [k, sc] of [['Front', 0.8], ['Back', 1.15]]) {
    const P = V(W[`${k}${s}Paw`]);
    for (const a of [-0.55, 0, 0.55]) {
      const d = V([Math.sin(a) + 0.25 * x, 0, -Math.cos(a)]).normalize();
      B.add(ell(0.08 * sc, 0.04, 0.26 * sc, 8, 5), { pos: P.clone().add(V([0, -0.1, 0])).addScaledVector(d, 0.28 * sc).setY(0.05).toArray(), rot: [0, Math.atan2(d.x, d.z), 0], color: 'skinDeep', bone: `${k}${s}Paw` });
      B.add(ell(0.07 * sc, 0.06 * sc, 0.07 * sc, 6, 5), { pos: P.clone().addScaledVector(d, 0.52 * sc).setY(0.07).toArray(), color: 'skinLight', bone: `${k}${s}Paw` });
    }
  }
  // tiny tail nub
  tail(B, { pts: [[0, 0.95, 1.05], [0, 0.88, 1.3], [0, 0.82, 1.42], [0, 0.78, 1.5], [0, 0.75, 1.56]], r: (t) => 0.12 * (1 - 0.8 * t) + 0.02, color: 'skin', rings: 8, seg: 8 });
}

export default {
  name: 'Shroomtoad', element: 'Nature', palette, glow, bones, build,
  style: { tip: 'TailTip', hop: 0.35, dur: { Idle: 2.8, Walk: 0.9, Run: 0.6, Attack: 1.0, Roar: 2.2 }, walk: [0.35, 0.5, 0.55, 0.6], run: [0.6, 0.7, 0.85, 0.9], gallop: [0, 0, 0.5, 0.5], bob: 0.6, sway: 0.4, tail: 0.3 },
  bg: '#141b12', light: { bone: 'Spine', color: '#b8ff6a' }, outline: '#0a1006', fit: { hero: 0.8, sprite: 0.8 },
};
