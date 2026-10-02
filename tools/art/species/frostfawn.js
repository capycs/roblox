// Frostfawn (Ice): graceful snow deer. Pale blue coat with snowflake spots, a fluffy
// white chest, slender legs, and branching crystal antlers that glow from inside.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, quadBones, addEye, crystal } from '../lib.js';
import { torso, neck, legs, tail } from '../kit.js';
import { canopy } from '../foliage.js';

const palette = [
  ['coat', '#a9c8e6'], ['coatDeep', '#7ea2c8'], ['coatLight', '#d4e6f6'], ['snow', '#f4f9ff'], ['snowShade', '#d6e4f2'],
  ['hoof', '#3b4a66'], ['nose', '#26324a'], ['mouth', '#7a2a3a'], ['pupil', '#111a2a'], ['white', '#ffffff'], ['innerEar', '#f2c8d8'],
];
const glow = { Eyes: '#9ff0ff', Glow: '#5fd0f4', GlowCore: '#a8ecff' };

const bones = quadBones({
  hips: [2.55, 0.95], spine: [2.65, 0.1], chest: [2.75, -0.7], neck: [3.4, -1.05], head: [4.05, -1.3], jaw: [3.75, -1.75],
  ear: [0.55, 4.35, -1.15],
  tail: [[2.75, 1.5], [2.95, 1.7], [3.05, 1.82], [3.08, 1.9], [3.05, 1.98]],
  front: { x: 0.45, upper: [2.35, -0.72], lower: [1.25, -0.78], paw: [0.35, -0.8] },
  back: { x: 0.48, upper: [2.35, 0.95], lower: [1.25, 1.15], paw: [0.35, 0.98] },
});

function build(B, W) {
  const T = torso(B, { pts: [[0, 2.6, 1.55], [0, 2.6, 0.9], [0, 2.7, 0.1], [0, 2.82, -0.6], [0, 2.95, -1.1]], rx: (t) => 0.55 + 0.08 * t, ry: (t) => 0.62 + 0.08 * t, color: 'coat', zHips: 0.95, zSpine: 0.1, zChest: -0.7 });
  B.add(ell(0.42, 0.34, 0.85), { pos: [0, 2.2, -0.05], color: 'snowShade', weights: T.torsoW });
  // snowflake spots on the back
  for (const [t, th, x] of [[0.2, 1.2, 1], [0.32, 1.0, -1], [0.45, 1.3, 1], [0.58, 1.05, -1], [0.27, 0.7, 1], [0.5, 0.75, -1]]) {
    const { p, n } = T.surf(t, th, x, 1.0);
    for (let k = 0; k < 3; k++) B.add(ell(0.12, 0.025, 0.035, 6, 3), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [Math.cos(k * 1.05), Math.sin(k * 1.05), 0.2]), color: 'snow', weights: T.torsoW });
  }
  // fluffy chest + neck ruff (wool-card trick)
  canopy(B, { blobs: [[0, 2.75, -1.15, 0.55], [0, 3.15, -1.15, 0.45], [0.3, 2.6, -1.0, 0.4], [-0.3, 2.6, -1.0, 0.4]], shades: ['snowShade', 'snowShade', 'snow', 'snow', 'white'], count: 150, size: [0.34, 0.24], seed: 301, droop: 0.6, add: { weights: T.torsoW } });
  neck(B, { pts: [[0, 2.85, -0.8], [0, 3.45, -1.05], [0, 4.1, -1.3]], r: 0.36, color: 'coat', yChest: 3.0, yNeck: 3.4, yHead: 3.95 });

  // --- head ---
  B.add(ell(0.5, 0.48, 0.55, 20, 16), { pos: [0, 4.1, -1.38], color: 'coat', bone: 'Head' });
  B.add(taperFront(ell(0.3, 0.27, 0.55, 16, 12), 0.45), { pos: [0, 3.92, -1.85], color: 'coatLight', bone: 'Head' });
  B.add(ell(0.1, 0.07, 0.07, 8, 6), { pos: [0, 3.98, -2.35], color: 'nose', bone: 'Head' });
  B.add(taperFront(ell(0.2, 0.09, 0.38), 0.45), { pos: [0, 3.7, -1.8], color: 'coatLight', bone: 'Jaw' });
  B.add(taperFront(ell(0.15, 0.04, 0.32, 10, 6), 0.45), { pos: [0, 3.78, -1.82], color: 'mouth', bone: 'Jaw' });
  B.add(ell(0.07, 0.11, 0.04, 8, 6), { pos: [0, 4.38, -1.83], rot: [-0.5, 0, 0], mesh: 'GlowCore', bone: 'Head' });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.3 * x, 4.18, -1.8], { r: [0.17, 0.2, 0.1], pupil: [0.075, 0.12], th: -0.45 * x, lid: 'coat', lidAngle: 0.8, brow: { color: 'coatDeep', len: 0.18, tilt: 0.3 } });
    B.add(cone(0.06, 0.2, 5), { pos: [0.42 * x, 4.24, -1.88], quat: quatTo([x, 0.4, -0.3]), color: 'pupil', bone: 'Head' }); // lashes
    const e = V(W[`Ear${s}`]), d = V([x, 0.45, 0.1]).normalize();
    B.add(ell(0.36, 0.14, 0.17, 12, 8), { pos: e.clone().addScaledVector(d, 0.3).toArray(), quat: quatTo(d.toArray()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2))), color: 'coat', bone: `Ear${s}` });
    B.add(ell(0.25, 0.06, 0.1, 10, 6), { pos: e.clone().addScaledVector(d, 0.32).add(V([0, 0, -0.07])).toArray(), quat: quatTo(d.toArray()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2))), color: 'innerEar', bone: `Ear${s}` });
    // crystal antler: main beam + three tines
    const base = V([0.22 * x, 4.5, -1.35]);
    const beam = [base, base.clone().add(V([0.35 * x, 0.6, 0.15])), base.clone().add(V([0.55 * x, 1.25, 0.05])), base.clone().add(V([0.62 * x, 1.85, -0.15]))];
    beam.slice(0, 3).forEach((p0, i) => { const p1 = beam[i + 1], d2 = p1.clone().sub(p0); B.add(crystal(0.1 - i * 0.02, d2.length() * 1.15), { pos: p0.toArray(), quat: quatTo(d2.toArray()), mesh: i === 2 ? 'GlowCore' : 'Glow', bone: 'Head' }); });
    for (const [i, dir, len] of [[1, [0.1 * x, 0.8, -0.6], 0.55], [2, [0.6 * x, 0.7, -0.2], 0.5], [2, [-0.3 * x, 0.9, -0.3], 0.4]]) B.add(crystal(0.06, len), { pos: beam[i].toArray(), quat: quatTo(dir), mesh: 'GlowCore', bone: 'Head' });
    B.add(ell(0.12, 0.08, 0.12, 8, 5), { pos: base.toArray(), color: 'coatDeep', bone: 'Head' });
  }
  legs(B, W, { front: { r: [0.24, 0.12], cuff: 'snow' }, back: { r: [0.27, 0.13], cuff: 'snow' }, color: 'coat', footColor: 'hoof', foot: 'hoof' });
  // little ice crystals on the shoulders
  for (const [, x] of SIDES) { const { p } = T.surf(0.78, 0.6, x, 1.0); B.add(crystal(0.07, 0.28), { pos: p.toArray(), quat: quatTo([x, 0.6, 0]), mesh: 'Glow', weights: T.torsoW }); }
  // tail: white powder puff
  tail(B, { pts: [[0, 2.75, 1.45], [0, 2.95, 1.7], [0, 3.05, 1.82], [0, 3.08, 1.9], [0, 3.05, 1.98]], r: (t) => 0.14 + 0.08 * t, color: 'coat', rings: 8, seg: 8 });
  canopy(B, { blobs: [[0, 3.0, 1.85, 0.3]], shades: ['snowShade', 'snow', 'snow', 'white'], count: 40, size: [0.26, 0.2], seed: 303, add: { bone: 'Tail3' } });
}

export default {
  name: 'Frostfawn', element: 'Ice', palette, glow, bones, build, glowBoost: { Glow: 0.75, GlowCore: 0.8 },
  style: { tip: 'TailTip', dur: { Idle: 2.8, Walk: 0.9, Run: 0.52, Attack: 1.0, Roar: 2.2 }, walk: [0.5, 0.8, 0.45, 0.6], run: [0.95, 1.1, 0.9, 0.9], bob: 1.1, tail: 0.5, neck: 0.4 },
  bg: '#141d27', light: { bone: 'Head', color: '#8fe8ff' }, outline: '#0a1220',
  views: { hero: [-8.5, 3.2, -7.5], roar: [-8, 1.6, -5.5], sprite: [-9.5, 2.6, -8] },
};
