// Solarion (Fire, Legendary): armoured sun-lion. Heavy golden body with crimson-and-gold
// plate armour, a towering mane of layered flame-fur with a blazing sun halo behind it,
// swept golden horns, burning paws and a comet tail.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, quadBones, addEye, flame } from '../lib.js';
import { torso, neck, legs, tail, armor } from '../kit.js';

const palette = [
  ['fur', '#d8902e'], ['furDeep', '#a65e1a'], ['furLight', '#f4c060'], ['belly', '#ffdca0'],
  ['mane', '#d2481e'], ['maneDeep', '#9a2a14'], ['maneLight', '#f07a2a'],
  ['armor', '#a8242a'], ['armorDeep', '#701820'], ['gold', '#f6c445'], ['goldDeep', '#b8841c'],
  ['claw', '#fff2d6'], ['nose', '#3a1a12'], ['mouth', '#8a2028'], ['pupil', '#2a1206'], ['white', '#ffffff'],
];
const glow = { Eyes: '#fff3a0', Glow: '#ff8a1a', GlowCore: '#fff0b0' };

const bones = quadBones({
  hips: [2.9, 1.45], spine: [3.05, 0.25], chest: [3.25, -1.05], neck: [3.85, -1.65], head: [4.35, -2.15], jaw: [3.85, -2.65],
  ear: [0.7, 5.15, -1.95],
  tail: [[3.05, 2.3], [2.8, 3.2], [3.0, 4.05], [3.6, 4.65], [4.3, 4.85]],
  front: { x: 0.95, upper: [2.85, -1.1], lower: [1.45, -1.2], paw: [0.48, -1.25] },
  back: { x: 0.95, upper: [2.8, 1.45], lower: [1.45, 1.65], paw: [0.48, 1.45] },
});
// spinner bones: the sun halo turns behind the mane, three fire orbs circle the body
bones.push(['Halo', 'Head', [0, 4.6, -0.3]], ['SunOrbit', 'Spine', [0, 3.7, 0.2]]);

function build(B, W) {
  const T = torso(B, { pts: [[0, 2.95, 2.35], [0, 2.95, 1.4], [0, 3.05, 0.25], [0, 3.25, -0.95], [0, 3.35, -1.75]], rx: (t) => 0.95 + 0.25 * t, ry: (t) => 0.92 + 0.28 * t, color: 'fur', zHips: 1.45, zSpine: 0.25, zChest: -1.05, rings: 26, seg: 18 });
  B.add(ell(0.7, 0.45, 1.4), { pos: [0, 2.35, -0.2], color: 'belly', weights: T.torsoW });
  // muscle masses: shoulders and haunches
  for (const [, x] of SIDES) {
    B.add(ell(0.7, 0.95, 0.9, 12, 8), { pos: [0.74 * x, 3.1, -1.05], color: 'fur', weights: T.torsoW });
    B.add(ell(0.66, 0.9, 0.95, 12, 8), { pos: [0.75 * x, 2.85, 1.5], color: 'fur', weights: T.torsoW });
  }
  // --- armour: saddle plates down the spine, pauldrons, chest plate with the sun emblem ---
  for (const [t, w, l] of [[0.2, 0.95, 0.5], [0.36, 1.05, 0.55], [0.52, 1.1, 0.55], [0.68, 1.05, 0.5]]) {
    const { p, n } = T.surf(t, Math.PI / 2, 1, 1.02);
    armor(B, { p, n, dir: [0, 0, 1], w, l, t: 0.1, color: 'armor', trim: 'gold', rivets: 'goldDeep', opts: { weights: T.torsoW } });
  }
  for (const [, x] of SIDES) {
    const { p, n } = T.surf(0.8, 0.75, x, 1.05);
    armor(B, { p: p.clone().add(V([0.22 * x, 0.15, 0])), n: n.clone().add(V([0.3 * x, 0.2, 0])), dir: [0, 0.4, 1], w: 0.8, l: 0.9, t: 0.14, color: 'armor', trim: 'gold', rivets: 'goldDeep', opts: { weights: T.torsoW } });
    for (const k of [0, 1]) B.add(cone(0.12, 0.45, 8), { pos: p.clone().add(V([(0.55 + k * 0.15) * x, 0.4 - k * 0.15, -0.1 + k * 0.3])).toArray(), quat: quatTo([x * 0.8, 0.6, 0.2]), color: 'gold', weights: T.torsoW });
    // gold flank trim lines
    for (const [t, th] of [[0.35, 0.25], [0.5, 0.2], [0.65, 0.25]]) { const s = T.surf(t, th, x, 1.0); B.add(ell(0.35, 0.05, 0.04, 8, 4), { pos: s.p.toArray(), quat: surfaceQuat(s.n.toArray(), [0, 1, -0.6]), mesh: 'Glow', weights: T.torsoW }); }
  }
  const chestW = (p) => [['Chest', 0.7], ['Neck', 0.3]];
  armor(B, { p: [0, 2.95, -2.05], n: [0, -0.2, -1], dir: [0, 1, 0], w: 0.7, l: 0.6, t: 0.12, color: 'armor', trim: 'gold', opts: { weights: chestW } });
  B.add(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 16), { pos: [0, 3.0, -2.2], quat: quatTo([0, -0.2, -1]), mesh: 'GlowCore', weights: chestW });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; B.add(cone(0.06, 0.22, 4), { pos: [Math.cos(a) * 0.38, 3.0 + Math.sin(a) * 0.38, -2.18], quat: quatTo([Math.cos(a), Math.sin(a), -0.2]), mesh: 'Glow', weights: chestW }); }

  neck(B, { pts: [[0, 3.3, -1.35], [0, 3.85, -1.7], [0, 4.4, -2.15]], r: 0.82, color: 'fur', yChest: 3.4, yNeck: 3.85, yHead: 4.3 });

  // --- the mane: three layers of flame-shaped fur spikes radiating around the head ---
  const maneC = V([0, 4.35, -1.55]);
  const maneW = (p) => (p.y > 4.0 ? [['Head', 0.55], ['Neck', 0.45]] : [['Neck', 0.7], ['Chest', 0.3]]);
  // back layer is the longest and darkest, front layer short and bright, all fanning out
  // from just behind the face
  for (const [layer, R, len, rr, col, dz] of [[0, 0.95, 2.1, 0.46, 'maneDeep', 0.35], [1, 0.95, 1.7, 0.4, 'mane', 0.1], [2, 0.9, 1.25, 0.34, 'maneLight', -0.12]]) {
    const n = 13;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + layer * 0.24 + Math.PI / 2, d = V([Math.cos(a), Math.sin(a) * 0.9 + 0.15, 0.35 + layer * 0.1]).normalize();
      const L = len * (0.85 + 0.2 * Math.sin(a * 3 + layer));
      B.add(cone(rr, L, 7), { pos: maneC.clone().add(V([Math.cos(a) * R, Math.sin(a) * R * 0.95, dz])).addScaledVector(d, L * 0.35).toArray(), quat: quatTo(d.toArray()), color: col, weights: maneW });
    }
  }
  B.add(ell(1.15, 1.2, 0.7, 16, 12), { pos: maneC.clone().add(V([0, 0, 0.3])).toArray(), color: 'maneDeep', weights: maneW });
  // chest ruff under the chin
  for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.32; B.add(cone(0.3, 1.0, 6), { pos: [Math.sin(a) * 0.6, 3.6 - Math.abs(i - 3) * 0.06, -2.05], quat: quatTo([Math.sin(a) * 0.3, -1, -0.35]), color: i % 2 ? 'mane' : 'maneLight', weights: maneW }); }
  // sun halo behind the mane: ring + rays + flames on the rays
  const haloC = maneC.clone().add(V([0, 0.25, 1.25]));
  B.add(new THREE.TorusGeometry(2.25, 0.14, 6, 40), { pos: haloC.toArray(), color: 'gold', bone: 'Halo' });
  B.add(new THREE.TorusGeometry(2.25, 0.07, 6, 40), { pos: haloC.clone().add(V([0, 0, -0.1])).toArray(), mesh: 'Glow', bone: 'Halo' });
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2, d = V([Math.cos(a), Math.sin(a), 0]); B.add(cone(0.12, k % 2 ? 0.6 : 0.95, 4), { pos: haloC.clone().addScaledVector(d, 2.3 + (k % 2 ? 0.25 : 0.42)).toArray(), quat: quatTo(d.toArray()), mesh: k % 2 ? 'Glow' : 'GlowCore', bone: 'Halo' }); }
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2, c = V([Math.cos(a) * 2.3, 3.7 + Math.sin(a * 2) * 0.3, 0.2 + Math.sin(a) * 2.3]); B.add(ell(0.3, 0.3, 0.3, 12, 8), { pos: c.toArray(), mesh: 'Glow', bone: 'SunOrbit' }); B.add(ell(0.16, 0.16, 0.16, 8, 6), { pos: c.toArray(), mesh: 'GlowCore', bone: 'SunOrbit' }); B.add(flame(0.22, 0.7, { rings: 8, seg: 8 }), { pos: c.clone().add(V([0, 0.05, 0])).toArray(), quat: quatTo([-Math.sin(a), 0.3, Math.cos(a)]), mesh: 'Glow', bone: 'SunOrbit' }); }

  // --- head: broad lion face, gold horns, sun mark ---
  B.add(ell(0.95, 0.85, 0.9, 24, 18), { pos: [0, 4.4, -2.25], color: 'fur', bone: 'Head' });
  B.add(taperFront(ell(0.6, 0.48, 0.72, 20, 14), 0.25), { pos: [0, 4.05, -2.95], color: 'belly', bone: 'Head' });
  B.add(ell(0.78, 0.26, 0.55), { pos: [0, 4.62, -2.65], rot: [0.3, 0, 0], color: 'furDeep', bone: 'Head' }); // heavy brow
  B.add(ell(0.26, 0.2, 0.2, 12, 8), { pos: [0, 4.22, -3.6], color: 'nose', bone: 'Head' });
  B.add(taperFront(ell(0.45, 0.2, 0.6), 0.3), { pos: [0, 3.6, -2.95], color: 'belly', bone: 'Jaw' });
  B.add(taperFront(ell(0.36, 0.07, 0.52, 14, 8), 0.3), { pos: [0, 3.75, -2.95], color: 'mouth', bone: 'Jaw' });
  for (const [, x] of SIDES) {
    B.add(cone(0.08, 0.36, 8), { pos: [0.24 * x, 3.65, -3.35], rot: [Math.PI, 0, 0], color: 'claw', bone: 'Head' });
    addEye(B, x, [0.42 * x, 4.45, -3.0], { r: [0.2, 0.17, 0.1], pupil: [0.08, 0.13], th: -0.4 * x, lid: 'furDeep', lidAngle: 1.2, lidTilt: 0.6, brow: { color: 'maneDeep', len: 0.42, tilt: 0.75 } });
    // swept golden horns
    const hp = [[0.45 * x, 4.95, -2.35], [0.85 * x, 5.3, -2.0], [1.15 * x, 5.45, -1.4], [1.25 * x, 5.35, -0.8]];
    B.add(loft({ points: hp, rx: (t) => 0.2 * (1 - 0.85 * t) + 0.02, ry: (t) => 0.2 * (1 - 0.85 * t) + 0.02, rings: 16, seg: 10 }), { color: 'gold', bone: 'Head' });
    B.add(loft({ points: hp.map(([a, b, c]) => [a * 1.0, b + 0.05, c + 0.05]), rx: (t) => 0.12 * (1 - 0.9 * t) + 0.01, ry: (t) => 0.05, rings: 16, seg: 6 }), { color: 'goldDeep', bone: 'Head' });
    // cheek fluff
    for (const dy of [0, -0.25]) B.add(cone(0.24, 0.7, 8), { pos: [0.85 * x, 4.15 + dy, -2.3], quat: quatTo([x, -0.3, 0.3]), color: 'furLight', bone: 'Head' });
  }
  B.add(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 12), { pos: [0, 4.82, -2.95], quat: quatTo([0, 0.4, -1]), mesh: 'GlowCore', bone: 'Head' });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; B.add(cone(0.04, 0.14, 4), { pos: [Math.cos(a) * 0.22, 4.82 + Math.sin(a) * 0.22, -2.97], quat: quatTo([Math.cos(a), Math.sin(a), -0.3]), mesh: 'Glow', bone: 'Head' }); }

  // --- legs: massive, gold greaves on the shins, burning paws ---
  legs(B, W, { front: { r: [0.58, 0.32] }, back: { r: [0.6, 0.33] }, color: 'fur', footColor: 'furDeep', clawColor: 'claw', foot: 'paw' });
  for (const [s, x] of SIDES) for (const k of ['Front', 'Back']) {
    const L = V(W[`${k}${s}Lower`]), P = V(W[`${k}${s}Paw`]);
    const mid = L.clone().lerp(P, 0.45);
    armor(B, { p: mid.clone().add(V([0, 0, k === 'Front' ? -0.32 : 0.3])), n: [0, 0, k === 'Front' ? -1 : 1], dir: [0, 1, 0], w: 0.3, l: 0.42, t: 0.08, color: 'gold', trim: 'goldDeep', opts: { bone: `${k}${s}Lower` } });
    for (let j = 0; j < 4; j++) { const a = (j / 4) * Math.PI * 2; B.add(flame(0.13, 0.55, { rings: 8, seg: 8 }), { pos: [P.x + Math.cos(a) * 0.3, 0.35, P.z + Math.sin(a) * 0.3 - 0.2], quat: quatTo([Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5]), mesh: 'Glow', bone: `${k}${s}Paw` }); }
  }
  // --- comet tail ---
  const tl = tail(B, { pts: [[0, 3.0, 2.25], [0, 2.8, 3.2], [0, 3.0, 4.05], [0, 3.6, 4.65], [0, 4.3, 4.85]], r: (t) => 0.26 - 0.12 * t, color: 'fur', rings: 30, seg: 12 });
  for (let k = 0; k < 3; k++) { const t = 0.3 + k * 0.2, c = tl.curve.getPoint(t); B.add(new THREE.TorusGeometry(0.24 - k * 0.03, 0.05, 5, 12), { pos: c.toArray(), quat: quatTo(tl.curve.getTangent(t).toArray()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))), color: 'gold', weights: () => tl.w(t) }); }
  const tip = V(W.TailTip);
  B.add(flame(0.6, 1.9, { twist: 2.5 }), { pos: tip.clone().add(V([0, -0.25, 0])).toArray(), quat: quatTo([0.4, 1, 0.2]), mesh: 'Glow', bone: 'TailTip' });
  B.add(flame(0.32, 1.1, { twist: -2 }), { pos: tip.clone().add(V([0, -0.1, 0])).toArray(), quat: quatTo([0.35, 1, 0.2]), mesh: 'GlowCore', bone: 'TailTip' });
}

export default {
  name: 'Solarion', element: 'Fire', palette, glow, bones, build, glowBoost: { Glow: 1.0, GlowCore: 1.0 },
  style: { tip: 'TailTip', dur: { Idle: 3.0, Walk: 1.15, Run: 0.68, Attack: 1.2, Roar: 2.6 }, walk: [0.42, 0.6, 0.4, 0.5], bob: 1.0, roll: 0.03, tail: 1.1, headLow: -0.05 },
  spinners: [{ bone: 'Halo', axis: [0, 0, 1], speed: 0.7 }, { bone: 'SunOrbit', axis: [0, 1, 0], speed: 1.3, bob: 0.15, bobFreq: 0.5 }],
  bg: '#241a1c', light: { bone: 'Head', color: '#ff9a3a' }, outline: '#160a08', fit: { hero: 0.72, sprite: 0.72 },
  views: { hero: [-8.5, 2.6, -9.5], roar: [-8.5, 1.2, -7.5], sprite: [-10.5, 2.4, -9] },
};
