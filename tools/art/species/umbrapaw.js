// Umbrapaw (Shadow): sleek shadow panther. Ink-violet coat with glowing rosettes, a
// crescent moon on the brow, a dark mask, tufted ears and a long tail ending in a
// curl of living shadow-flame.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, quadBones, addEye, flame } from '../lib.js';
import { torso, neck, legs, tail } from '../kit.js';

const palette = [
  ['coat', '#3a2d55'], ['coatDeep', '#221a33'], ['coatLight', '#5a4880'], ['mask', '#15101f'], ['belly', '#8a76b8'],
  ['claw', '#e8dcff'], ['nose', '#0f0a16'], ['mouth', '#6a2050'], ['pupil', '#0b0612'], ['white', '#ffffff'], ['innerEar', '#a06ad8'],
];
const glow = { Eyes: '#d98bff', Glow: '#a54dff', GlowCore: '#f3cdff' };

const bones = quadBones({
  hips: [2.0, 1.15], spine: [2.0, 0.15], chest: [2.1, -0.85], neck: [2.45, -1.35], head: [2.8, -1.75], jaw: [2.45, -2.15],
  ear: [0.48, 3.4, -1.6],
  tail: [[2.05, 1.85], [1.9, 2.65], [2.1, 3.4], [2.7, 3.85], [3.3, 3.75]],
  front: { x: 0.52, upper: [1.75, -0.85], lower: [0.95, -0.9], paw: [0.3, -0.92] },
  back: { x: 0.55, upper: [1.75, 1.15], lower: [0.95, 1.35], paw: [0.3, 1.15] },
});

function build(B, W) {
  const T = torso(B, { pts: [[0, 2.0, 1.9], [0, 1.98, 1.1], [0, 2.0, 0.15], [0, 2.1, -0.8], [0, 2.2, -1.4]], rx: (t) => 0.58 + 0.12 * t, ry: (t) => 0.55 + 0.15 * t, color: 'coat', zHips: 1.15, zSpine: 0.15, zChest: -0.85 });
  B.add(ell(0.42, 0.3, 1.05), { pos: [0, 1.62, -0.2], color: 'belly', weights: T.torsoW });
  // glowing rosettes (ring + dot) down the flanks
  for (const [, x] of SIDES) for (const [t, th] of [[0.18, 0.55], [0.3, 0.2], [0.42, 0.6], [0.55, 0.25], [0.68, 0.55], [0.36, 0.95], [0.6, 0.95]]) {
    const { p, n } = T.surf(t, th, x, 1.0);
    B.add(new THREE.TorusGeometry(0.11, 0.025, 4, 10), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, 1, 0]), mesh: 'Glow', weights: T.torsoW });
    B.add(ell(0.035, 0.035, 0.02, 6, 4), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, 1, 0]), mesh: 'GlowCore', weights: T.torsoW });
  }
  // shoulder blades ridge
  for (const [, x] of SIDES) { const { p } = T.surf(0.78, 1.25, x, 0.95); B.add(ell(0.28, 0.22, 0.4), { pos: p.toArray(), color: 'coatLight', weights: T.torsoW }); }
  neck(B, { pts: [[0, 2.15, -1.0], [0, 2.45, -1.35], [0, 2.85, -1.7]], r: 0.46, color: 'coat', yChest: 2.2, yNeck: 2.45, yHead: 2.75 });

  // --- head: broad cat head, dark mask, crescent moon ---
  B.add(ell(0.66, 0.56, 0.62, 22, 16), { pos: [0, 2.82, -1.85], color: 'coat', bone: 'Head' });
  B.add(ell(0.5, 0.26, 0.2, 16, 8), { pos: [0, 2.92, -2.35], color: 'mask', bone: 'Head' });
  B.add(taperFront(ell(0.32, 0.25, 0.42, 16, 12), 0.25), { pos: [0, 2.62, -2.3], color: 'belly', bone: 'Head' });
  B.add(ell(0.1, 0.07, 0.07, 8, 6), { pos: [0, 2.72, -2.72], color: 'nose', bone: 'Head' });
  B.add(taperFront(ell(0.22, 0.09, 0.32), 0.25), { pos: [0, 2.4, -2.25], color: 'belly', bone: 'Jaw' });
  B.add(taperFront(ell(0.16, 0.04, 0.26, 10, 6), 0.25), { pos: [0, 2.48, -2.27], color: 'mouth', bone: 'Jaw' });
  for (const [, x] of SIDES) B.add(cone(0.04, 0.16, 6), { pos: [0.11 * x, 2.36, -2.52], rot: [Math.PI, 0, 0], color: 'claw', bone: 'Head' });
  // crescent moon: torus arc on the brow
  B.add(new THREE.TorusGeometry(0.16, 0.035, 5, 12, Math.PI * 1.25), { pos: [0, 3.22, -2.36], rot: [-0.5, 0, Math.PI * 0.62], mesh: 'GlowCore', bone: 'Head' });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.27 * x, 2.95, -2.38], { r: [0.17, 0.15, 0.09], pupil: [0.035, 0.12], th: -0.4 * x, lid: 'mask', lidAngle: 1.0, lidTilt: 0.45, brow: { color: 'mask', len: 0.22, tilt: 0.55 } });
    // whiskers
    for (let k = 0; k < 2; k++) B.add(cone(0.012, 0.55, 3), { pos: [0.3 * x, 2.62 - k * 0.07, -2.45], quat: quatTo([x, 0.05 - k * 0.12, 0.25]), color: 'claw', bone: 'Head' });
    // tufted ears
    const e = V(W[`Ear${s}`]), d = V([0.35 * x, 1, 0.05]).normalize();
    B.add(cone(0.26, 0.62, 10, 0.5), { pos: e.clone().addScaledVector(d, 0.25).toArray(), quat: quatTo(d.toArray()), color: 'coat', bone: `Ear${s}` });
    B.add(cone(0.16, 0.42, 8, 0.3), { pos: e.clone().addScaledVector(d, 0.22).add(V([0, 0, -0.06])).toArray(), quat: quatTo(d.toArray()), color: 'innerEar', bone: `Ear${s}` });
    B.add(cone(0.06, 0.32, 5), { pos: e.clone().addScaledVector(d, 0.6).toArray(), quat: quatTo(d.toArray()), mesh: 'Glow', bone: `Ear${s}` });
    // cheek ruff
    for (const dy of [0, -0.16]) B.add(cone(0.14, 0.42, 7), { pos: [0.58 * x, 2.72 + dy, -1.85], quat: quatTo([x, -0.3, 0.3]), color: 'coatLight', bone: 'Head' });
  }
  legs(B, W, { front: { r: [0.34, 0.18] }, back: { r: [0.36, 0.19] }, color: 'coat', footColor: 'coatDeep', clawColor: 'claw', foot: 'paw' });
  // smoky wisps at the ankles
  for (const [s, x] of SIDES) for (const k of ['Front', 'Back']) { const L = V(W[`${k}${s}Lower`]); B.add(flame(0.1, 0.45, { rings: 8, seg: 8 }), { pos: [L.x + 0.15 * x, 0.55, L.z + 0.1], quat: quatTo([x * 0.4, 0.4, 1]), mesh: 'Glow', bone: `${k}${s}Lower` }); }
  // long tail ending in shadow-flame
  const tl = tail(B, { pts: [[0, 2.05, 1.8], [0, 1.9, 2.65], [0, 2.1, 3.4], [0, 2.7, 3.85], [0, 3.3, 3.75]], r: (t) => 0.17 - 0.08 * t, color: 'coat', rings: 30, seg: 10 });
  for (let k = 0; k < 3; k++) { const t = 0.4 + k * 0.17, c = tl.curve.getPoint(t); B.add(new THREE.TorusGeometry(0.14 - k * 0.015, 0.03, 4, 10), { pos: c.toArray(), quat: quatTo(tl.curve.getTangent(t).toArray()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))), mesh: 'Glow', weights: () => tl.w(t) }); }
  const tip = V(W.TailTip);
  B.add(flame(0.32, 1.1, { twist: 2.6, lean: 0.3 }), { pos: tip.clone().add(V([0, -0.1, 0])).toArray(), quat: quatTo([0.5, 1, -0.2]), mesh: 'Glow', bone: 'TailTip' });
  B.add(flame(0.17, 0.65, { twist: -2.4, lean: 0.2 }), { pos: tip.toArray(), quat: quatTo([0.4, 1, -0.2]), mesh: 'GlowCore', bone: 'TailTip' });
}

export default {
  name: 'Umbrapaw', element: 'Shadow', palette, glow, bones, build,
  style: { tip: 'TailTip', dur: { Idle: 2.6, Walk: 0.95, Run: 0.55, Attack: 0.95, Roar: 2.2 }, walk: [0.5, 0.75, 0.45, 0.55], bob: 0.8, sway: 1.3, tail: 1.4, headLow: -0.06 },
  bg: '#17121f', light: { bone: 'TailTip', color: '#b06bff' }, outline: '#0a0612',
};
