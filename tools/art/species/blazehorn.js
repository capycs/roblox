// Blazehorn (Fire): stocky lava ram. Charcoal fleece made of fluffy wool clumps, magma
// cracks glowing through, huge curled horns with molten tips, hooves that smoulder.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, quadBones, addEye, flame, shortenLegs } from '../lib.js';
import { torso, neck, legs, tail } from '../kit.js';
import { canopy } from '../foliage.js';

const palette = [
  ['wool', '#56444a'], ['woolDeep', '#3a2c2e'], ['woolMid', '#6c5658'], ['woolLight', '#836a68'], ['woolTip', '#9c7f78'],
  ['face', '#3a2a2e'], ['muzzle', '#6e5254'], ['horn', '#e8d2a8'], ['hornDeep', '#b8946a'], ['hoof', '#1e1618'],
  ['nose', '#120c0e'], ['mouth', '#7a2228'], ['pupil', '#1b0e12'], ['white', '#ffffff'],
];
const glow = { Eyes: '#ffd23f', Glow: '#ff6a1a', GlowCore: '#ffd36b' };

const bones = quadBones({
  hips: [2.2, 1.1], spine: [2.35, 0.15], chest: [2.45, -0.75], neck: [2.75, -1.25], head: [3.0, -1.65], jaw: [2.55, -2.05],
  ear: [0.75, 3.2, -1.5],
  tail: [[2.5, 1.75], [2.55, 2.0], [2.5, 2.2], [2.42, 2.35], [2.35, 2.45]],
  front: { x: 0.62, upper: [1.85, -0.8], lower: [1.0, -0.85], paw: [0.32, -0.88] },
  back: { x: 0.64, upper: [1.85, 1.1], lower: [1.0, 1.25], paw: [0.32, 1.1] },
});

function build(B, W) {
  const T = torso(B, { pts: [[0, 2.25, 1.8], [0, 2.3, 1.05], [0, 2.4, 0.15], [0, 2.5, -0.7], [0, 2.55, -1.3]], rx: (t) => 0.85 + 0.1 * t, ry: (t) => 0.82 + 0.1 * t, color: 'woolDeep', zHips: 1.1, zSpine: 0.15, zChest: -0.75 });
  // fleece: wool clumps over the torso (leaf-card trick with short round "curls")
  const fleece = [[0, 2.85, 1.2, 0.85], [0.55, 2.55, 1.15, 0.7], [-0.55, 2.55, 1.15, 0.7], [0, 3.0, 0.35, 0.9], [0.65, 2.6, 0.3, 0.75], [-0.65, 2.6, 0.3, 0.75], [0, 2.95, -0.5, 0.9], [0.7, 2.55, -0.55, 0.75], [-0.7, 2.55, -0.55, 0.75], [0, 2.6, -1.15, 0.85]];
  canopy(B, { blobs: fleece, shades: ['woolDeep', 'wool', 'woolMid', 'woolLight', 'woolTip'], count: 420, size: [0.48, 0.38], seed: 201, droop: 0.2, flare: 0.25, centre: [0, 2.2, 0], add: { weights: T.torsoW } });
  // magma cracks peeking through the fleece
  for (const [, x] of SIDES) for (const [t, th, len, a] of [[0.25, 0.35, 0.5, 0.4], [0.45, 0.1, 0.45, -0.3], [0.7, 0.3, 0.42, 0.6]]) {
    const { p, n } = T.surf(t, th, x, 1.32);
    B.add(ell(len * 1.2, 0.09, 0.07, 10, 5), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, Math.cos(a), Math.sin(a)]), mesh: 'Glow', weights: T.torsoW });
  }
  neck(B, { pts: [[0, 2.55, -0.9], [0, 2.8, -1.25], [0, 3.05, -1.6]], r: 0.62, color: 'woolDeep', yChest: 2.6, yNeck: 2.8, yHead: 3.0 });
  canopy(B, { blobs: [[0, 3.0, -1.2, 0.75], [0.45, 2.75, -1.25, 0.55], [-0.45, 2.75, -1.25, 0.55]], shades: ['woolDeep', 'wool', 'woolMid', 'woolLight', 'woolTip'], count: 130, size: [0.42, 0.34], seed: 203, droop: 0.2, flare: 0.25, add: { bone: 'Neck' } });

  // --- head: long ram face ---
  B.add(ell(0.62, 0.62, 0.72, 20, 16), { pos: [0, 3.05, -1.75], color: 'face', bone: 'Head' });
  B.add(taperFront(ell(0.42, 0.42, 0.7, 18, 12), 0.5), { pos: [0, 2.8, -2.3], color: 'muzzle', bone: 'Head' });
  for (const [, x] of SIDES) B.add(ell(0.08, 0.05, 0.05, 8, 5), { pos: [0.13 * x, 2.82, -2.92], color: 'nose', bone: 'Head' });
  B.add(taperFront(ell(0.3, 0.14, 0.5), 0.5), { pos: [0, 2.48, -2.25], color: 'muzzle', bone: 'Jaw' });
  B.add(taperFront(ell(0.22, 0.05, 0.42, 12, 6), 0.5), { pos: [0, 2.58, -2.28], color: 'mouth', bone: 'Jaw' });
  // goat beard
  for (let k = 0; k < 3; k++) B.add(cone(0.08, 0.45, 6), { pos: [(k - 1) * 0.08, 2.32, -2.35], quat: quatTo([(k - 1) * 0.2, -1, -0.2]), color: 'woolLight', bone: 'Jaw' });
  // wool fringe on the brow
  canopy(B, { blobs: [[0, 3.55, -1.75, 0.42]], shades: ['woolDeep', 'wool', 'woolMid', 'woolLight', 'woolTip'], count: 60, size: [0.36, 0.3], seed: 205, droop: 0.4, flare: 0.25, add: { bone: 'Head' } });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.38 * x, 3.12, -2.2], { r: [0.17, 0.17, 0.1], pupil: [0.12, 0.05], th: -0.55 * x, lid: 'face', lidAngle: 0.9, brow: { color: 'woolDeep', len: 0.26, tilt: 0.6 } });
    // floppy ears
    const e = V(W[`Ear${s}`]);
    B.add(ell(0.38, 0.12, 0.2, 10, 6), { pos: e.clone().add(V([0.25 * x, -0.15, 0])).toArray(), rot: [0, 0, -0.5 * x], color: 'face', bone: `Ear${s}` });
    // curled horn: spiral loft out, back, down and forward
    const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10, a = u * Math.PI * 1.65; pts.push([x * (0.4 + 0.45 * u + 0.35 * Math.sin(a) * u), 3.45 + 0.55 * Math.cos(a) * (0.4 + 0.6 * u) - 0.25 * u, -1.6 + 0.65 * Math.sin(a) * (0.5 + 0.5 * u) - 0.4 * u * u]); }
    const g = loft({ points: pts, rx: (t) => 0.3 * (1 - 0.75 * t) + 0.03, ry: (t) => 0.27 * (1 - 0.75 * t) + 0.03, rings: 30, seg: 10 });
    B.add(g, { color: 'horn', bone: 'Head' });
    const hc = g.userData.curve;
    for (let k = 1; k < 7; k++) { const t = k / 8, c = hc.getPoint(t), tan = hc.getTangent(t); const ring = new THREE.TorusGeometry(0.3 * (1 - 0.75 * t) + 0.035, 0.035, 4, 12); ring.lookAt(tan); B.add(ring, { pos: c.toArray(), color: 'hornDeep', bone: 'Head' }); }
    const tip = hc.getPoint(1), tt = hc.getTangent(1);
    B.add(flame(0.11, 0.42, { rings: 8, seg: 8 }), { pos: tip.toArray(), quat: quatTo([tt.x, Math.abs(tt.y) + 0.6, tt.z]), mesh: 'Glow', bone: 'Head' });
  }
  // glowing brow mark
  B.add(ell(0.16, 0.06, 0.05, 8, 5), { pos: [0, 3.35, -2.35], rot: [-0.4, 0, 0], mesh: 'GlowCore', bone: 'Head' });

  legs(B, W, { front: { r: [0.36, 0.2], cuff: 'wool' }, back: { r: [0.38, 0.21], cuff: 'wool' }, color: 'woolDeep', footColor: 'hoof', foot: 'hoof' });
  // smouldering hooves
  for (const [s, x] of SIDES) for (const k of ['Front', 'Back']) { const P = V(W[`${k}${s}Paw`]); B.add(ell(0.2, 0.05, 0.2, 10, 4), { pos: [P.x, 0.02, P.z], mesh: 'Glow', bone: `${k}${s}Paw` }); }

  const tl = tail(B, { pts: [[0, 2.45, 1.7], [0, 2.55, 2.0], [0, 2.5, 2.2], [0, 2.42, 2.35], [0, 2.35, 2.45]], r: (t) => 0.2 * (1 - 0.3 * t), color: 'woolDeep', rings: 10, seg: 10 });
  canopy(B, { blobs: [[0, 2.5, 2.25, 0.32]], shades: ['woolDeep', 'wool', 'woolMid', 'woolLight', 'woolTip'], count: 30, size: [0.3, 0.26], seed: 207, add: { bone: 'Tail3' } });
  void tl;
}

export default {
  name: 'Blazehorn', element: 'Fire', palette, glow, bones, build, warp: shortenLegs(0.35, 0.4, 1.9),
  style: { tip: 'TailTip', attack: 'charge', dur: { Idle: 2.6, Walk: 1.0, Run: 0.6, Attack: 1.1, Roar: 2.2 }, bob: 1.1, roll: 0.03, tail: 0.6, headLow: -0.1 },
  bg: '#241a1c', light: { bone: 'Head', color: '#ff7a2a' }, outline: '#140b10',
};
