// Sylvanthorn (Nature, Legendary): the ancient forest stag. Bark-and-moss hide, a stone
// mask with a glowing rune, a mossy mane, stone hooves wrapped in vines, and antlers that
// are a living tree: branching boughs carrying leafy canopies, blossoms and spirit lanterns.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, quadBones, addEye, blade } from '../lib.js';
import { torso, neck, legs, tail, armor } from '../kit.js';
import { canopy } from '../foliage.js';

const palette = [
  ['hide', '#7a5636'], ['hideDeep', '#553a24'], ['hideLight', '#9c744a'], ['belly', '#d9c49a'], ['bark', '#6a4a30'], ['barkDeep', '#4a3220'],
  ['stone', '#a8aaa2'], ['stoneDeep', '#74766e'], ['leafDeep', '#28552b'], ['leafDark', '#357a2f'], ['leaf', '#4f9a3d'], ['leafLight', '#74b84a'], ['leafTip', '#98cf58'],
  ['moss', '#5f9a3c'], ['petal', '#ffb3d6'], ['petalW', '#fff3e8'], ['mushroom', '#e85a3c'], ['nose', '#1e1410'], ['mouth', '#6a2a2a'], ['pupil', '#14100c'], ['white', '#ffffff'],
];
const glow = { Eyes: '#d8ff8a', Glow: '#9cff5a', GlowCore: '#fff7b0' };
const LEAF = ['leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip'];

const bones = quadBones({
  hips: [3.05, 1.25], spine: [3.15, 0.15], chest: [3.3, -0.95], neck: [4.1, -1.4], head: [4.9, -1.75], jaw: [4.5, -2.25],
  ear: [0.62, 5.3, -1.6],
  tail: [[3.3, 1.95], [3.45, 2.2], [3.5, 2.35], [3.48, 2.48], [3.42, 2.58]],
  front: { x: 0.65, upper: [2.9, -0.95], lower: [1.5, -1.0], paw: [0.42, -1.05] },
  back: { x: 0.68, upper: [2.9, 1.25], lower: [1.5, 1.45], paw: [0.42, 1.25] },
});
// spinner bones: spirit wisps circle the antler tree, a rune ring floats around the body
bones.push(['WispOrbit', 'Head', [0, 7.1, -1.6]], ['RuneRing', 'Spine', [0, 3.15, 0.2]]);

function build(B, W) {
  const T = torso(B, { pts: [[0, 3.1, 2.05], [0, 3.1, 1.25], [0, 3.2, 0.15], [0, 3.35, -0.85], [0, 3.5, -1.45]], rx: (t) => 0.78 + 0.14 * t, ry: (t) => 0.85 + 0.15 * t, color: 'hide', zHips: 1.25, zSpine: 0.15, zChest: -0.95, rings: 26, seg: 18 });
  B.add(ell(0.55, 0.38, 1.2), { pos: [0, 2.55, -0.1], color: 'belly', weights: T.torsoW });
  // bark ridges along the back with moss, mushrooms and a glowing rune line
  for (let k = 0; k < 6; k++) { const t = 0.15 + k * 0.13, { p, n } = T.surf(t, Math.PI / 2, 1, 1.0); B.add(ell(0.32, 0.12, 0.28, 10, 5), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, 0, 1]), color: k % 2 ? 'bark' : 'barkDeep', weights: T.torsoW }); }
  canopy(B, { blobs: [[0, 4.0, 0.6, 0.45], [0, 4.05, -0.2, 0.5], [0, 4.0, 1.3, 0.38]], shades: LEAF, count: 120, size: [0.34, 0.22], seed: 501, droop: 0.4, add: { weights: T.torsoW } });
  for (const [x, z] of [[0.3, 1.0], [-0.25, 0.2]]) { B.add(cyl(0.05, 0.06, 0.25), { pos: [x, 4.0, z], color: 'belly', weights: T.torsoW }); const cap = new THREE.SphereGeometry(0.15, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2); B.add(cap, { pos: [x, 4.1, z], color: 'mushroom', weights: T.torsoW }); }
  for (const [, x] of SIDES) for (const [t, th, a] of [[0.3, 0.35, 0.2], [0.5, 0.25, -0.3], [0.7, 0.4, 0.4]]) { const s = T.surf(t, th, x, 1.0); B.add(blade(0.45, 0.08, 0.04), { pos: s.p.toArray(), quat: surfaceQuat(s.n.toArray(), [0, Math.cos(a), Math.sin(a)]), mesh: 'Glow', weights: T.torsoW }); }
  neck(B, { pts: [[0, 3.45, -1.15], [0, 4.1, -1.45], [0, 4.85, -1.75]], r: 0.58, color: 'hide', yChest: 3.55, yNeck: 4.1, yHead: 4.75 });
  // mossy mane (leaf cards) down the neck and chest
  const neckW = (p) => (p.y > 4.3 ? [['Neck', 0.7], ['Head', 0.3]] : [['Neck', 0.6], ['Chest', 0.4]]);
  canopy(B, { blobs: [[0, 4.6, -1.35, 0.42], [0, 4.1, -1.25, 0.5], [0, 3.6, -1.55, 0.55], [0, 3.15, -1.75, 0.5]], shades: ['leafDeep', 'leafDark', 'moss', 'leaf', 'leafLight'], count: 160, size: [0.38, 0.25], seed: 503, droop: 0.75, add: { weights: neckW } });

  // --- head: long deer face with a stone mask ---
  B.add(ell(0.55, 0.55, 0.62, 20, 16), { pos: [0, 4.95, -1.85], color: 'hide', bone: 'Head' });
  B.add(taperFront(ell(0.36, 0.32, 0.7, 16, 12), 0.45), { pos: [0, 4.72, -2.45], color: 'hideLight', bone: 'Head' });
  armor(B, { p: [0, 5.15, -2.2], n: [0, 0.75, -0.65], dir: [0, 0.6, 0.8], w: 0.45, l: 0.5, t: 0.12, color: 'stone', trim: 'stoneDeep', opts: { bone: 'Head' } });
  B.add(blade(0.35, 0.1, 0.05), { pos: [0, 5.05, -2.45], quat: surfaceQuat([0, 0.75, -0.65], [0, 0.65, 0.75]), mesh: 'GlowCore', bone: 'Head' });
  for (const x of [-1, 1]) B.add(blade(0.22, 0.06, 0.05), { pos: [0.12 * x, 5.12, -2.35], quat: surfaceQuat([0, 0.75, -0.65], [x * 0.7, 0.4, 0.6]), mesh: 'Glow', bone: 'Head' });
  B.add(ell(0.12, 0.09, 0.08, 10, 6), { pos: [0, 4.8, -3.08], color: 'nose', bone: 'Head' });
  B.add(taperFront(ell(0.25, 0.11, 0.55), 0.45), { pos: [0, 4.45, -2.4], color: 'belly', bone: 'Jaw' });
  B.add(taperFront(ell(0.19, 0.04, 0.48, 10, 6), 0.45), { pos: [0, 4.54, -2.42], color: 'mouth', bone: 'Jaw' });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.33 * x, 5.0, -2.35], { r: [0.16, 0.16, 0.09], pupil: [0.1, 0.06], th: -0.5 * x, lid: 'hideDeep', lidAngle: 1.1, lidTilt: 0.45, brow: { color: 'stoneDeep', len: 0.3, tilt: 0.55 } });
    const e = V(W[`Ear${s}`]), d = V([x, 0.4, 0.15]).normalize();
    B.add(blade(0.7, 0.28, 0.06), { pos: e.toArray(), quat: surfaceQuat([0, 0.4, -1], d.toArray()), color: 'leaf', bone: `Ear${s}` });
    // the antler tree: three boughs per side, each ending in a leafy canopy
    const base = V([0.25 * x, 5.35, -1.75]);
    const boughs = [
      [base, base.clone().add(V([0.55 * x, 0.9, 0.2])), base.clone().add(V([1.0 * x, 1.9, 0.0])), base.clone().add(V([1.15 * x, 2.7, -0.3]))],
      [base.clone().add(V([0.55 * x, 0.9, 0.2])), base.clone().add(V([1.3 * x, 1.2, 0.35])), base.clone().add(V([1.9 * x, 1.7, 0.4]))],
      [base.clone().add(V([1.0 * x, 1.9, 0.0])), base.clone().add(V([0.55 * x, 2.6, 0.3])), base.clone().add(V([0.35 * x, 3.2, 0.2]))],
    ];
    boughs.forEach((pts, i) => B.add(loft({ points: pts.map((v) => v.toArray()), rx: (t) => (i ? 0.1 : 0.15) * (1 - 0.6 * t) + 0.03, ry: (t) => (i ? 0.1 : 0.15) * (1 - 0.6 * t) + 0.03, rings: 10, seg: 7 }), { color: i ? 'bark' : 'barkDeep', bone: 'Head' }));
    const tops = [boughs[0][3], boughs[1][2], boughs[2][2]];
    canopy(B, { blobs: tops.map((p, i) => [p.x, p.y + 0.1, p.z, i === 0 ? 0.62 : 0.5]), shades: LEAF, count: 130, size: [0.46, 0.28], seed: 510 + (x > 0 ? 1 : 0), add: { bone: 'Head' }, extra: ({ surface }) => {
      for (let k = 0; k < 6; k++) { const { p, n } = surface(); for (let j = 0; j < 5; j++) { const a = (j / 5) * Math.PI * 2, side = V([0, 1, 0]).cross(n).normalize(), fw = n.clone().cross(side), dd = side.clone().multiplyScalar(Math.cos(a)).addScaledVector(fw, Math.sin(a)); B.add(ell(0.11, 0.03, 0.07, 5, 3), { pos: p.clone().addScaledVector(dd, 0.1).toArray(), quat: surfaceQuat(n.toArray(), dd.toArray()), color: k % 2 ? 'petal' : 'petalW', bone: 'Head' }); } }
    } });
    // spirit lanterns hanging from the boughs
    for (const i of [1, 2]) { const p = boughs[i][1]; B.add(cyl(0.012, 0.012, 0.5), { pos: [p.x, p.y - 0.25, p.z], color: 'barkDeep', bone: 'Head' }); B.add(ell(0.13, 0.16, 0.13, 10, 8), { pos: [p.x, p.y - 0.55, p.z], mesh: 'GlowCore', bone: 'Head' }); B.add(ell(0.2, 0.22, 0.2, 10, 8), { pos: [p.x, p.y - 0.55, p.z], mesh: 'Glow', bone: 'Head' }); }
  }
  // spirit wisps orbiting the canopy
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2, c = V([Math.cos(a) * 1.9, 7.1 + Math.sin(a * 3) * 0.35, -1.6 + Math.sin(a) * 1.9]); B.add(ell(0.12, 0.12, 0.12, 8, 6), { pos: c.toArray(), mesh: 'GlowCore', bone: 'WispOrbit' }); B.add(ell(0.22, 0.22, 0.22, 8, 6), { pos: c.toArray(), mesh: 'Glow', bone: 'WispOrbit' }); B.add(cone(0.08, 0.45, 6), { pos: c.clone().add(V([Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25])).toArray(), quat: quatTo([Math.sin(a), 0, -Math.cos(a)]), mesh: 'Glow', bone: 'WispOrbit' }); }
  // floating rune ring around the body: glowing band with leaf runes
  B.add(new THREE.TorusGeometry(1.75, 0.035, 4, 36), { pos: [0, 3.15, 0.2], rot: [Math.PI / 2, 0, 0], mesh: 'Glow', bone: 'RuneRing' });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; B.add(blade(0.32, 0.12, 0.04), { pos: [Math.cos(a) * 1.75, 3.15, 0.2 + Math.sin(a) * 1.75], quat: surfaceQuat([Math.cos(a), 0, Math.sin(a)], [0, 1, 0]), mesh: 'GlowCore', bone: 'RuneRing' }); }
  legs(B, W, { front: { r: [0.38, 0.18], cuff: 'moss' }, back: { r: [0.42, 0.19], cuff: 'moss' }, color: 'hide', footColor: 'stone', foot: 'hoof' });
  for (const [s] of SIDES) for (const k of ['Front', 'Back']) { const L = V(W[`${k}${s}Lower`]), P = V(W[`${k}${s}Paw`]); for (let j = 0; j < 3; j++) { const y = P.y + 0.25 + j * 0.3; B.add(new THREE.TorusGeometry(0.2 - j * 0.01, 0.035, 4, 10), { pos: [P.x, y, P.z + (L.z - P.z) * (y - P.y) / (L.y - P.y)], rot: [Math.PI / 2 + 0.25 * (j - 1), 0, 0.3 * (j - 1)], color: 'leafDark', bone: `${k}${s}Lower` }); } B.add(blade(0.25, 0.1, 0.03), { pos: [P.x + 0.2, P.y + 0.55, P.z], quat: surfaceQuat([1, 0.3, 0], [0.4, 1, 0]), color: 'leafLight', bone: `${k}${s}Lower` }); }
  tail(B, { pts: [[0, 3.25, 1.9], [0, 3.45, 2.2], [0, 3.5, 2.35], [0, 3.48, 2.48], [0, 3.42, 2.58]], r: (t) => 0.2 * (1 - 0.4 * t), color: 'hide', rings: 8, seg: 8 });
  canopy(B, { blobs: [[0, 3.45, 2.45, 0.3]], shades: LEAF, count: 40, size: [0.28, 0.18], seed: 520, add: { bone: 'Tail3' } });
}
function cyl(rt, rb, h) { return new THREE.CylinderGeometry(rt, rb, h, 6); }

export default {
  name: 'Sylvanthorn', element: 'Nature', palette, glow, bones, build,
  style: { tip: 'TailTip', attack: 'charge', dur: { Idle: 3.2, Walk: 1.1, Run: 0.65, Attack: 1.25, Roar: 2.6 }, walk: [0.5, 0.75, 0.45, 0.6], run: [0.9, 1.0, 0.85, 0.85], bob: 0.9, tail: 0.6, neck: 0.4, headLow: -0.08 },
  spinners: [{ bone: 'WispOrbit', axis: [0, 1, 0], speed: 0.8, bob: 0.2, bobFreq: 0.35 }, { bone: 'RuneRing', axis: [0, 1, 0], speed: -0.5, bob: 0.1, bobFreq: 0.5 }],
  bg: '#141b12', light: { bone: 'Head', color: '#b2ff63' }, outline: '#0a1006', fit: { hero: 0.92, sprite: 0.9, roar: 0.95 },
  views: { hero: [-9.5, 3.0, -9.5], roar: [-9, 1.4, -7.5], sprite: [-11, 2.6, -9.5] },
};
