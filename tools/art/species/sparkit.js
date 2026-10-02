// Sparkit (Storm): small, twitchy fox-squirrel. Butter-yellow fur, navy socks, huge
// tufted ears with crackling tips and a giant fluffy lightning-bolt tail.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, quadBones, addEye, blade, bolt } from '../lib.js';
import { torso, neck, legs, tail } from '../kit.js';

const palette = [
  ['fur', '#f6c94c'], ['furDeep', '#dc9a2c'], ['furLight', '#ffe59a'], ['belly', '#fff4d8'], ['navy', '#2b3a66'], ['navyDeep', '#1b2445'],
  ['nose', '#1b1420'], ['mouth', '#8a2a3a'], ['pupil', '#14121c'], ['white', '#ffffff'], ['innerEar', '#ffb070'],
];
const glow = { Eyes: '#8ff6ff', Glow: '#3fdcff', GlowCore: '#fbff9e' };

const bones = quadBones({
  hips: [1.45, 0.65], spine: [1.5, 0.05], chest: [1.58, -0.5], neck: [1.95, -0.78], head: [2.35, -0.98], jaw: [2.05, -1.32],
  ear: [0.42, 3.1, -0.85],
  tail: [[1.55, 1.05], [2.1, 1.5], [2.75, 1.2], [3.4, 1.75], [4.05, 1.4]],
  front: { x: 0.38, upper: [1.3, -0.5], lower: [0.74, -0.55], paw: [0.24, -0.58] },
  back: { x: 0.42, upper: [1.3, 0.65], lower: [0.74, 0.82], paw: [0.24, 0.68] },
});

function build(B, W) {
  const T = torso(B, { pts: [[0, 1.5, 1.15], [0, 1.45, 0.6], [0, 1.5, 0.0], [0, 1.6, -0.5], [0, 1.68, -0.9]], rx: (t) => 0.5 + 0.08 * t, ry: (t) => 0.5 + 0.1 * t, color: 'fur', zHips: 0.65, zSpine: 0.05, zChest: -0.5 });
  B.add(ell(0.38, 0.3, 0.75), { pos: [0, 1.25, -0.15], color: 'belly', weights: T.torsoW });
  // chest fluff
  for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.35; B.add(cone(0.16, 0.45, 7), { pos: [Math.sin(a) * 0.3, 1.5 - Math.abs(i - 2) * 0.05, -0.95], quat: quatTo([Math.sin(a) * 0.3, -1, -0.5]), color: i % 2 ? 'belly' : 'furLight', weights: T.torsoW }); }
  // navy back stripe zig
  for (const [t, len] of [[0.25, 0.32], [0.45, 0.36], [0.65, 0.3]]) { const { p, n } = T.surf(t, Math.PI / 2, 1, 0.99); B.add(bolt(len, len * 0.5, 0.04), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, 0, 1]), color: 'navy', weights: T.torsoW }); }

  neck(B, { pts: [[0, 1.65, -0.6], [0, 1.95, -0.8], [0, 2.35, -0.98]], r: 0.38, color: 'fur', yChest: 1.75, yNeck: 1.95, yHead: 2.25 });

  // --- head: round, big eyes, pointed muzzle ---
  B.add(ell(0.68, 0.6, 0.64, 22, 16), { pos: [0, 2.38, -1.05], color: 'fur', bone: 'Head' });
  B.add(taperFront(ell(0.34, 0.27, 0.5, 16, 12), 0.35), { pos: [0, 2.15, -1.55], color: 'belly', bone: 'Head' });
  B.add(ell(0.11, 0.08, 0.08, 10, 6), { pos: [0, 2.24, -2.02], color: 'nose', bone: 'Head' });
  B.add(taperFront(ell(0.24, 0.1, 0.38), 0.35), { pos: [0, 1.95, -1.5], color: 'belly', bone: 'Jaw' });
  B.add(taperFront(ell(0.18, 0.05, 0.32, 12, 6), 0.35), { pos: [0, 2.03, -1.52], color: 'mouth', bone: 'Jaw' });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.3 * x, 2.5, -1.58], { r: [0.2, 0.24, 0.11], pupil: [0.08, 0.13], lid: 'fur', lidAngle: 0.7, brow: { color: 'furDeep', len: 0.22, tilt: 0.5 } });
    // electric cheek marks (glow chevrons)
    B.add(bolt(0.3, 0.14, 0.04), { pos: [0.55 * x, 2.18, -1.25], quat: surfaceQuat([x, -0.1, -0.6], [0, 1, 0.2]), mesh: 'Glow', bone: 'Head' });
    // cheek fluff
    B.add(cone(0.16, 0.45, 7), { pos: [0.6 * x, 2.15, -1.0], quat: quatTo([x, -0.4, 0.4]), color: 'furLight', bone: 'Head' });
    // giant tufted ears with spark tips
    const e = V(W[`Ear${s}`]), d = V([0.35 * x, 1, 0.1]).normalize();
    B.add(cone(0.3, 1.05, 12, 0.45), { pos: e.clone().addScaledVector(d, 0.42).toArray(), quat: quatTo(d.toArray()), color: 'fur', bone: `Ear${s}` });
    B.add(cone(0.19, 0.7, 10, 0.25), { pos: e.clone().addScaledVector(d, 0.34).add(V([0, 0, -0.07])).toArray(), quat: quatTo(d.toArray()), color: 'innerEar', bone: `Ear${s}` });
    B.add(cone(0.14, 0.35, 8, 0.5), { pos: e.clone().addScaledVector(d, 0.86).toArray(), quat: quatTo(d.toArray()), color: 'navy', bone: `Ear${s}` });
    for (let k = 0; k < 3; k++) B.add(cone(0.05, 0.3, 5), { pos: e.clone().addScaledVector(d, 1.0).toArray(), quat: quatTo([d.x + (k - 1) * 0.35, d.y, d.z + 0.1]), mesh: 'Glow', bone: `Ear${s}` });
  }
  // head tuft
  for (let k = 0; k < 3; k++) B.add(cone(0.12, 0.42, 7), { pos: [(k - 1) * 0.12, 2.92, -1.05], quat: quatTo([(k - 1) * 0.5, 1, 0.5]), color: 'furDeep', bone: 'Head' });

  legs(B, W, { front: { r: [0.26, 0.15] }, back: { r: [0.28, 0.16] }, color: 'fur', footColor: 'navy', clawColor: 'white', foot: 'paw' });
  // navy socks
  for (const [s, x] of SIDES) for (const k of ['Front', 'Back']) { const P = V(W[`${k}${s}Paw`]); B.add(ell(0.2, 0.2, 0.2, 10, 8), { pos: [P.x, 0.42, P.z], color: 'navyDeep', bone: `${k}${s}Paw` }); }

  // --- the bolt tail: thick fluffy zigzag with a glowing spine ---
  const tl = tail(B, { pts: [[0, 1.5, 0.95], [0, 2.1, 1.5], [0, 2.75, 1.15], [0, 3.4, 1.75], [0, 4.05, 1.4]], r: (t) => (0.16 + 0.42 * Math.sin(Math.PI * Math.min(1, t * 1.1))) * (t > 0.92 ? Math.sqrt(Math.max(0, 1 - ((t - 0.92) / 0.08) ** 2)) : 1), color: 'fur', rings: 36, seg: 14 });
  for (let k = 0; k < 8; k++) {
    const t = 0.2 + k * 0.09, c = tl.curve.getPoint(t), tan = tl.curve.getTangent(t);
    for (const [, x] of SIDES) B.add(cone(0.17, 0.55, 7), { pos: c.clone().add(V([x * 0.25, 0, 0])).toArray(), quat: quatTo(V([x, 0.2, 0]).addScaledVector(tan, 0.8).toArray()), color: k % 2 ? 'furLight' : 'furDeep', weights: () => tl.w(t) });
  }
  for (let k = 0; k < 4; k++) { const t = 0.3 + k * 0.17, c = tl.curve.getPoint(t), tan = tl.curve.getTangent(t); B.add(bolt(0.55, 0.22, 0.06), { pos: c.clone().add(V([0, 0.05, 0])).toArray(), quat: surfaceQuat([1, 0, 0], tan.toArray()), mesh: 'Glow', weights: () => tl.w(t) }); }
  const tip = V(W.TailTip);
  B.add(bolt(0.55, 0.26, 0.08), { pos: tip.clone().add(V([0, 0.05, 0.05])).toArray(), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.4, Math.PI / 2, 0)), mesh: 'GlowCore', bone: 'TailTip' });
}

export default {
  name: 'Sparkit', element: 'Storm', palette, glow, bones, build,
  style: { tip: 'TailTip', dur: { Idle: 1.8, Walk: 0.6, Run: 0.38, Attack: 0.8, Roar: 1.8 }, bob: 1.3, tail: 1.5, sway: 1.2 },
  bg: '#161c2c', light: { bone: 'TailTip', color: '#5fd8ff' }, outline: '#0c1020',
  views: { hero: [-8, 2.6, -7.2], roar: [-7.5, 1.0, -5], sprite: [-9, 2.0, -7.5] },
};
