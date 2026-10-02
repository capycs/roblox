// Bramblepup (Nature): round leafy puppy. Moss-green and cream fur, a big flower on its
// head, leaf ears, a fluffy leaf collar, vine anklets and a sprouting leaf-tuft tail.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, quadBones, addEye, blade } from '../lib.js';
import { torso, neck, legs, tail } from '../kit.js';
import { canopy } from '../foliage.js';

const palette = [
  ['fur', '#8cc45a'], ['furDeep', '#5e9a3a'], ['cream', '#fbf0d0'], ['leafDeep', '#28552b'], ['leafDark', '#357a2f'], ['leaf', '#4f9a3d'], ['leafLight', '#74b84a'], ['leafTip', '#98cf58'],
  ['petal', '#ff8fbf'], ['petalDeep', '#e05f98'], ['bark', '#7a5132'], ['nose', '#2a1a18'], ['mouth', '#8a2a3a'], ['pupil', '#14100c'], ['white', '#ffffff'], ['tongue', '#ff8a9a'],
];
const glow = { Eyes: '#c8ff6a', Glow: '#a8ff4f', GlowCore: '#fff7a0' };
const LEAF = ['leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip'];

const bones = quadBones({
  hips: [1.35, 0.6], spine: [1.42, 0.05], chest: [1.5, -0.45], neck: [1.85, -0.75], head: [2.3, -0.95], jaw: [1.95, -1.3],
  ear: [0.55, 2.75, -0.85],
  tail: [[1.5, 0.95], [1.75, 1.15], [1.95, 1.25], [2.1, 1.3], [2.2, 1.3]],
  front: { x: 0.42, upper: [1.2, -0.45], lower: [0.7, -0.5], paw: [0.22, -0.52] },
  back: { x: 0.45, upper: [1.2, 0.6], lower: [0.7, 0.72], paw: [0.22, 0.6] },
});

function build(B, W) {
  const T = torso(B, { pts: [[0, 1.4, 1.0], [0, 1.38, 0.55], [0, 1.42, 0.0], [0, 1.5, -0.45], [0, 1.58, -0.8]], rx: (t) => 0.58 + 0.06 * t, ry: (t) => 0.55 + 0.08 * t, color: 'fur', zHips: 0.6, zSpine: 0.05, zChest: -0.45 });
  B.add(ell(0.45, 0.32, 0.7), { pos: [0, 1.12, -0.1], color: 'cream', weights: T.torsoW });
  // leaf patches on the back
  for (const [t, th, x, a] of [[0.3, 1.3, 1, 0.3], [0.5, 1.2, -1, -0.4], [0.7, 1.35, 1, 0.8]]) { const { p, n } = T.surf(t, th, x, 1.0); B.add(blade(0.45, 0.2, 0.04), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [Math.sin(a), 0, Math.cos(a)]), color: 'leafLight', weights: T.torsoW }); }
  neck(B, { pts: [[0, 1.55, -0.6], [0, 1.85, -0.78], [0, 2.25, -0.95]], r: 0.4, color: 'fur', yChest: 1.6, yNeck: 1.85, yHead: 2.2 });
  // fluffy leaf collar
  const collar = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; collar.push([Math.cos(a) * 0.45, 1.8 + Math.sin(a) * 0.15, -0.75 + Math.sin(a) * 0.4, 0.3]); }
  canopy(B, { blobs: collar, shades: LEAF, count: 170, size: [0.36, 0.22], seed: 401, droop: 0.65, centre: [0, 1.8, -0.75], add: { bone: 'Neck' } });

  // --- head: round puppy head ---
  B.add(ell(0.72, 0.64, 0.66, 22, 16), { pos: [0, 2.32, -1.02], color: 'fur', bone: 'Head' });
  B.add(taperFront(ell(0.4, 0.3, 0.45, 16, 12), 0.2), { pos: [0, 2.08, -1.55], color: 'cream', bone: 'Head' });
  B.add(ell(0.15, 0.11, 0.1, 10, 8), { pos: [0, 2.2, -1.98], color: 'nose', bone: 'Head' });
  B.add(taperFront(ell(0.28, 0.12, 0.34), 0.2), { pos: [0, 1.88, -1.5], color: 'cream', bone: 'Jaw' });
  B.add(taperFront(ell(0.2, 0.05, 0.28, 10, 6), 0.2), { pos: [0, 1.96, -1.52], color: 'mouth', bone: 'Jaw' });
  B.add(ell(0.1, 0.03, 0.14, 8, 4), { pos: [0.06, 1.95, -1.72], rot: [0.3, 0, 0], color: 'tongue', bone: 'Jaw' });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.3 * x, 2.45, -1.58], { r: [0.2, 0.23, 0.11], pupil: [0.1, 0.13], th: -0.38 * x, brow: { color: 'furDeep', len: 0.2, tilt: 0.2 } });
    B.add(ell(0.1, 0.06, 0.03, 8, 4), { pos: [0.5 * x, 2.18, -1.42], quat: surfaceQuat([x, 0, -0.6], [0, 1, 0]), color: 'petal', bone: 'Head' }); // blush
    // floppy leaf ears
    const e = V(W[`Ear${s}`]);
    B.add(blade(0.85, 0.36, 0.06), { pos: e.toArray(), quat: surfaceQuat([0.4 * x, 0.6, -0.6], [x * 0.75, -0.65, 0.1]), color: 'leaf', bone: `Ear${s}` });
    B.add(blade(0.7, 0.04, 0.075), { pos: e.toArray(), quat: surfaceQuat([0.4 * x, 0.6, -0.6], [x * 0.75, -0.65, 0.1]), color: 'leafDeep', bone: `Ear${s}` });
  }
  // flower on the head
  const fc = V([0.15, 2.98, -1.05]);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, d = V([Math.cos(a), 0.25, Math.sin(a)]).normalize(); B.add(ell(0.22, 0.05, 0.13, 8, 4), { pos: fc.clone().addScaledVector(d, 0.2).toArray(), quat: surfaceQuat([0, 1, 0], d.toArray()), color: k % 2 ? 'petal' : 'petalDeep', bone: 'Head' }); }
  B.add(ell(0.11, 0.08, 0.11, 8, 6), { pos: fc.clone().add(V([0, 0.04, 0])).toArray(), mesh: 'GlowCore', bone: 'Head' });
  for (const a of [0.8, 3.6]) B.add(blade(0.35, 0.15, 0.04), { pos: fc.toArray(), quat: surfaceQuat([0, 1, 0], [Math.cos(a), 0.1, Math.sin(a)]), color: 'leafLight', bone: 'Head' });

  legs(B, W, { front: { r: [0.28, 0.17] }, back: { r: [0.3, 0.18] }, color: 'fur', footColor: 'cream', foot: 'paw' });
  // vine anklets with a glowing bud
  for (const [s, x] of SIDES) for (const k of ['Front', 'Back']) { const P = V(W[`${k}${s}Paw`]); B.add(new THREE.TorusGeometry(0.19, 0.035, 4, 12), { pos: [P.x, 0.5, P.z], rot: [Math.PI / 2, 0, 0], color: 'leafDark', bone: `${k}${s}Paw` }); B.add(ell(0.06, 0.06, 0.06, 6, 4), { pos: [P.x + 0.18 * x, 0.52, P.z], mesh: 'Glow', bone: `${k}${s}Paw` }); }
  // sprout tail: short stem + leafy tuft
  tail(B, { pts: [[0, 1.45, 0.9], [0, 1.75, 1.15], [0, 1.95, 1.25], [0, 2.1, 1.3], [0, 2.2, 1.3]], r: (t) => 0.12 - 0.04 * t, color: 'furDeep', rings: 10, seg: 8 });
  canopy(B, { blobs: [[0, 2.2, 1.3, 0.34], [0, 2.45, 1.2, 0.24]], shades: LEAF, count: 60, size: [0.34, 0.2], seed: 403, add: { bone: 'TailTip' } });
}

export default {
  name: 'Bramblepup', element: 'Nature', palette, glow, bones, build,
  style: { tip: 'TailTip', dur: { Idle: 2.0, Walk: 0.7, Run: 0.45, Attack: 0.9, Roar: 2.0 }, bob: 1.4, tail: 1.6, sway: 1.1 },
  bg: '#141b12', light: { bone: 'Head', color: '#b2ff63' }, outline: '#0a1006',
};
