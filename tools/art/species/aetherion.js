// Aetherion, the Prism Sovereign (Mythic): celestial lion-dragon of every element.
// Pearl fur and gold armour set with prism gems, a mane of streaming light, four wings
// (feathered + crystal energy wings), three counter-spinning halos and a floating crown,
// six element orbs orbiting its body, spinning rune discs under every paw, and a long tail
// with a feather fan and a prism blade.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, quadBones, addEye, flame, crystal, featherWing, blade } from '../lib.js';
import { torso, neck, legs, tail, armor } from '../kit.js';

const palette = [
  ['pearl', '#f4eefc'], ['pearlShade', '#cfc4e6'], ['pearlDeep', '#a99cc8'], ['belly', '#fffaf0'],
  ['gold', '#f6c445'], ['goldDeep', '#b8841c'], ['goldLight', '#ffe28a'], ['royal', '#5a3aa8'], ['royalDeep', '#3a2470'],
  ['feather', '#ffffff'], ['featherTip', '#e8dcff'], ['claw', '#fff6dc'], ['nose', '#3a2a50'], ['mouth', '#7a2a5a'], ['pupil', '#2a1a40'], ['white', '#ffffff'],
];
const glow = {
  Eyes: '#fffbe0', Glow: '#ffd36b', GlowCore: '#ffffff', Prism: '#c49aff',
  OrbFire: '#ff6a1a', OrbStorm: '#3fdcff', OrbIce: '#bff4ff', OrbShadow: '#a54dff', OrbWater: '#2a8cff', OrbNature: '#a8ff4f',
};

const bones = quadBones({
  hips: [3.3, 1.6], spine: [3.5, 0.3], chest: [3.75, -1.15], neck: [4.45, -1.85], head: [5.1, -2.4], jaw: [4.6, -2.95],
  ear: [0.75, 5.95, -2.2],
  tail: [[3.45, 2.55], [3.2, 3.7], [3.5, 4.8], [4.3, 5.6], [5.3, 5.9]],
  front: { x: 1.05, upper: [3.25, -1.2], lower: [1.65, -1.3], paw: [0.52, -1.35] },
  back: { x: 1.05, upper: [3.2, 1.6], lower: [1.65, 1.8], paw: [0.52, 1.6] },
  wing: { upper: [0.85, 4.35, -0.65], lower: [2.6, 5.75, -0.25], tip: [4.4, 6.9, 0.45] },
});
const HALO_C = [0, 5.5, -1.15];
bones.push(['Halo1', 'Head', HALO_C], ['Halo2', 'Head', HALO_C], ['Halo3', 'Head', HALO_C], ['Crown', 'Head', [0, 7.0, -2.45]], ['ElementOrbit', 'Spine', [0, 3.9, 0.25]]);
// rune discs under each paw (positions filled in from the paw bones)
for (const [s, x] of SIDES) for (const k of ['Front', 'Back']) { const paw = bones.find((b) => b[0] === `${k}${s}Paw`)[2]; bones.push([`Rune${k}${s}`, `${k}${s}Paw`, [paw[0], 0.06, paw[2] - 0.2]]); }

function build(B, W) {
  const T = torso(B, { pts: [[0, 3.35, 2.6], [0, 3.35, 1.55], [0, 3.5, 0.3], [0, 3.75, -1.05], [0, 3.9, -1.95]], rx: (t) => 1.0 + 0.28 * t, ry: (t) => 1.0 + 0.3 * t, color: 'pearl', zHips: 1.6, zSpine: 0.3, zChest: -1.15, rings: 24, seg: 18 });
  B.add(ell(0.75, 0.48, 1.55, 14, 8), { pos: [0, 2.68, -0.2], color: 'belly', weights: T.torsoW });
  for (const [, x] of SIDES) { B.add(ell(0.72, 1.0, 0.95, 10, 7), { pos: [0.8 * x, 3.6, -1.15], color: 'pearl', weights: T.torsoW }); B.add(ell(0.7, 0.95, 1.0, 10, 7), { pos: [0.82 * x, 3.3, 1.65], color: 'pearl', weights: T.torsoW }); }
  // gold barding: spine plates with royal-purple underlay and prism gems
  for (const [t, w, l] of [[0.2, 1.05, 0.55], [0.36, 1.15, 0.6], [0.52, 1.2, 0.6], [0.68, 1.15, 0.55]]) {
    const { p, n } = T.surf(t, Math.PI / 2, 1, 1.02);
    armor(B, { p, n, dir: [0, 0, 1], w, l, t: 0.11, color: 'gold', trim: 'royal', rivets: 'goldDeep', opts: { weights: T.torsoW } });
    B.add(new THREE.OctahedronGeometry(0.16, 0), { pos: p.clone().addScaledVector(n, 0.15).toArray(), scale: [1, 1.4, 1], mesh: 'Prism', weights: T.torsoW });
  }
  for (const [, x] of SIDES) {
    const { p, n } = T.surf(0.8, 0.75, x, 1.05);
    armor(B, { p: p.clone().add(V([0.25 * x, 0.15, 0])), n: n.clone().add(V([0.3 * x, 0.25, 0])), dir: [0, 0.4, 1], w: 0.9, l: 1.0, t: 0.15, color: 'gold', trim: 'royal', rivets: 'goldDeep', opts: { weights: T.torsoW } });
    for (let k = 0; k < 3; k++) B.add(crystal(0.1, 0.6 - k * 0.12), { pos: p.clone().add(V([0.65 * x, 0.45 - k * 0.12, -0.3 + k * 0.32])).toArray(), quat: quatTo([x * 0.9, 0.6, 0.1]), mesh: 'Prism', weights: T.torsoW });
    for (const [t, th] of [[0.3, 0.25], [0.45, 0.2], [0.6, 0.25]]) { const s = T.surf(t, th, x, 1.0); B.add(ell(0.4, 0.05, 0.04, 8, 4), { pos: s.p.toArray(), quat: surfaceQuat(s.n.toArray(), [0, 1, -0.6]), mesh: 'Glow', weights: T.torsoW }); }
  }
  // chest plate with the great prism
  const chestW = () => [['Chest', 0.7], ['Neck', 0.3]];
  armor(B, { p: [0, 3.4, -2.3], n: [0, -0.2, -1], dir: [0, 1, 0], w: 0.8, l: 0.7, t: 0.13, color: 'gold', trim: 'royal', opts: { weights: chestW } });
  B.add(new THREE.OctahedronGeometry(0.42, 0), { pos: [0, 3.45, -2.5], scale: [0.8, 1.25, 0.6], mesh: 'Prism', weights: chestW });
  B.add(new THREE.OctahedronGeometry(0.2, 0), { pos: [0, 3.45, -2.62], scale: [0.8, 1.25, 0.6], mesh: 'GlowCore', weights: chestW });

  neck(B, { pts: [[0, 3.85, -1.5], [0, 4.45, -1.9], [0, 5.1, -2.4]], r: 0.9, color: 'pearl', yChest: 3.95, yNeck: 4.45, yHead: 5.0 });
  // --- mane of streaming light: ribbons of flame shape in white and gold, fanning back ---
  const maneC = V([0, 5.05, -1.8]);
  const maneW = (p) => (p.y > 4.6 ? [['Head', 0.55], ['Neck', 0.45]] : [['Neck', 0.7], ['Chest', 0.3]]);
  B.add(ell(1.2, 1.25, 0.75, 14, 10), { pos: maneC.clone().add(V([0, 0, 0.3])).toArray(), color: 'pearlShade', weights: maneW });
  for (const [layer, R, len, rr, mesh, dz] of [[0, 1.0, 2.4, 0.42, 'Prism', 0.4], [1, 0.95, 1.9, 0.34, 'Glow', 0.15], [2, 0.9, 1.4, 0.3, 'Prism', -0.05]]) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + layer * 0.26 + Math.PI / 2, d = V([Math.cos(a), Math.sin(a) * 0.9 + 0.2, 0.45 + layer * 0.1]).normalize();
      B.add(flame(rr, len * (0.85 + 0.2 * Math.sin(a * 3 + layer)), { rings: 8, seg: 8, twist: 1.6, lean: 0.35 }), { pos: maneC.clone().add(V([Math.cos(a) * R, Math.sin(a) * R * 0.95, dz])).toArray(), quat: quatTo(d.toArray()), mesh, weights: maneW });
    }
  }
  // --- three halos, each on its own spinning bone ---
  const hc = V(HALO_C);
  B.add(new THREE.TorusGeometry(2.6, 0.13, 6, 44), { pos: hc.toArray(), color: 'gold', bone: 'Halo1' });
  B.add(new THREE.TorusGeometry(2.6, 0.06, 6, 44), { pos: hc.clone().add(V([0, 0, -0.1])).toArray(), mesh: 'Glow', bone: 'Halo1' });
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, d = V([Math.cos(a), Math.sin(a), 0]); B.add(cone(0.1, k % 2 ? 0.55 : 0.95, 4), { pos: hc.clone().addScaledVector(d, 2.7 + (k % 2 ? 0.22 : 0.42)).toArray(), quat: quatTo(d.toArray()), mesh: k % 2 ? 'Glow' : 'GlowCore', bone: 'Halo1' }); }
  B.add(new THREE.TorusGeometry(2.05, 0.05, 5, 40), { pos: hc.toArray(), rot: [0.5, 0.3, 0], mesh: 'Prism', bone: 'Halo2' });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; const p = V([Math.cos(a) * 2.05, Math.sin(a) * 2.05, 0]).applyEuler(new THREE.Euler(0.5, 0.3, 0)).add(hc); B.add(new THREE.OctahedronGeometry(0.16, 0), { pos: p.toArray(), mesh: 'Prism', bone: 'Halo2' }); }
  B.add(new THREE.TorusGeometry(1.55, 0.04, 5, 36), { pos: hc.toArray(), rot: [-0.45, -0.4, 0], mesh: 'GlowCore', bone: 'Halo3' });
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; const p = V([Math.cos(a) * 1.55, Math.sin(a) * 1.55, 0]).applyEuler(new THREE.Euler(-0.45, -0.4, 0)).add(hc); B.add(blade(0.22, 0.08, 0.04), { pos: p.toArray(), quat: quatTo([Math.cos(a), Math.sin(a), 0]), mesh: 'Glow', bone: 'Halo3' }); }

  // --- head ---
  B.add(ell(1.0, 0.9, 0.95, 22, 16), { pos: [0, 5.15, -2.5], color: 'pearl', bone: 'Head' });
  B.add(taperFront(ell(0.62, 0.5, 0.78, 18, 12), 0.3), { pos: [0, 4.8, -3.25], color: 'belly', bone: 'Head' });
  B.add(ell(0.85, 0.26, 0.58, 14, 8), { pos: [0, 5.4, -2.9], rot: [0.3, 0, 0], color: 'pearlShade', bone: 'Head' });
  B.add(ell(0.24, 0.18, 0.18, 10, 8), { pos: [0, 4.98, -3.95], color: 'nose', bone: 'Head' });
  B.add(taperFront(ell(0.48, 0.2, 0.62), 0.3), { pos: [0, 4.32, -3.25], color: 'belly', bone: 'Jaw' });
  B.add(taperFront(ell(0.38, 0.07, 0.55, 12, 6), 0.3), { pos: [0, 4.48, -3.25], color: 'mouth', bone: 'Jaw' });
  // gold face mask with a forehead gem
  armor(B, { p: [0, 5.55, -3.0], n: [0, 0.7, -0.7], dir: [0, 0.7, 0.7], w: 0.5, l: 0.55, t: 0.1, color: 'gold', trim: 'royal', opts: { bone: 'Head' } });
  B.add(new THREE.OctahedronGeometry(0.17, 0), { pos: [0, 5.62, -3.25], scale: [0.8, 1.3, 0.6], mesh: 'Prism', bone: 'Head' });
  for (const [s, x] of SIDES) {
    B.add(cone(0.08, 0.38, 8), { pos: [0.25 * x, 4.38, -3.68], rot: [Math.PI, 0, 0], color: 'claw', bone: 'Head' });
    addEye(B, x, [0.44 * x, 5.22, -3.3], { r: [0.2, 0.17, 0.1], pupil: [0.06, 0.13], th: -0.4 * x, lid: 'pearlShade', lidAngle: 1.15, lidTilt: 0.55, brow: { color: 'gold', len: 0.42, tilt: 0.7 } });
    // two pairs of swept horns: gold outer, prism inner
    B.add(loft({ points: [[0.5 * x, 5.75, -2.6], [0.95 * x, 6.15, -2.2], [1.3 * x, 6.35, -1.55], [1.45 * x, 6.25, -0.9]], rx: (t) => 0.22 * (1 - 0.85 * t) + 0.02, ry: (t) => 0.22 * (1 - 0.85 * t) + 0.02, rings: 10, seg: 8 }), { color: 'gold', bone: 'Head' });
    B.add(crystal(0.1, 0.9), { pos: [0.35 * x, 5.85, -2.75], quat: quatTo([0.5 * x, 1, 0.5]), mesh: 'Prism', bone: 'Head' });
    for (const dy of [0, -0.25]) B.add(flame(0.2, 0.75, { rings: 8, seg: 8 }), { pos: [0.9 * x, 4.95 + dy, -2.55], quat: quatTo([x, -0.2, 0.35]), mesh: 'GlowCore', bone: 'Head' });
  }
  // floating crown of crystal spires
  const cc = V([0, 7.0, -2.45]);
  B.add(new THREE.TorusGeometry(0.62, 0.07, 6, 24), { pos: cc.toArray(), rot: [Math.PI / 2, 0, 0], color: 'gold', bone: 'Crown' });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; B.add(crystal(0.08, k % 2 ? 0.45 : 0.75), { pos: cc.clone().add(V([Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62])).toArray(), quat: quatTo([Math.cos(a) * 0.2, 1, Math.sin(a) * 0.2]), mesh: k % 2 ? 'GlowCore' : 'Prism', bone: 'Crown' }); }
  B.add(crystal(0.15, 1.0), { pos: cc.toArray(), mesh: 'GlowCore', bone: 'Crown' });

  // --- four wings: feathered (gold-tipped) + crystal energy wings below them ---
  for (const [s, x] of SIDES) {
    featherWing(B, W, x, { arm: 'gold', covert: 'feather', primary: 'feather', primary2: 'featherTip', tipMesh: 'Glow', count: 9, scale: 1.8 });
    const S = V(W[`Wing${s}Upper`]).add(V([0, -0.5, 0.7])), wl = `Wing${s}Lower`, wu = `Wing${s}Upper`;
    for (let k = 0; k < 7; k++) {
      const u = k / 6, d = V([x * (0.9 - u * 0.35), 0.35 - u * 0.55, 0.25 + u * 1.0]).normalize(), L = 2.6 - Math.abs(u - 0.35) * 1.6;
      B.add(crystal(0.1, L), { pos: S.toArray(), quat: quatTo(d.toArray()), mesh: k % 2 ? 'Prism' : 'GlowCore', weights: () => [[wu, 0.5], [wl, 0.5]] });
    }
  }

  // --- legs: gold gauntlets set with gems, rune discs spinning under the paws ---
  legs(B, W, { front: { r: [0.62, 0.34] }, back: { r: [0.64, 0.35] }, color: 'pearl', footColor: 'pearlShade', clawColor: 'claw', foot: 'paw' });
  for (const [s] of SIDES) for (const k of ['Front', 'Back']) {
    const L = V(W[`${k}${s}Lower`]), P = V(W[`${k}${s}Paw`]), f = k === 'Front' ? -1 : 1;
    armor(B, { p: L.clone().lerp(P, 0.45).add(V([0, 0, 0.34 * f])), n: [0, 0, f], dir: [0, 1, 0], w: 0.34, l: 0.5, t: 0.09, color: 'gold', trim: 'royal', opts: { bone: `${k}${s}Lower` } });
    B.add(new THREE.OctahedronGeometry(0.1, 0), { pos: L.clone().lerp(P, 0.45).add(V([0, 0, 0.45 * f])).toArray(), mesh: 'Prism', bone: `${k}${s}Lower` });
    const rc = V([P.x, 0.06, P.z - 0.2]), rb = `Rune${k}${s}`;
    B.add(new THREE.TorusGeometry(0.75, 0.035, 4, 28), { pos: rc.toArray(), rot: [Math.PI / 2, 0, 0], mesh: 'Glow', bone: rb });
    B.add(new THREE.TorusGeometry(0.5, 0.025, 4, 24), { pos: rc.toArray(), rot: [Math.PI / 2, 0, 0], mesh: 'GlowCore', bone: rb });
    for (let j = 0; j < 6; j++) { const a = (j / 6) * Math.PI * 2; B.add(blade(0.2, 0.07, 0.03), { pos: [rc.x + Math.cos(a) * 0.62, 0.07, rc.z + Math.sin(a) * 0.62], quat: surfaceQuat([0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]), mesh: 'Prism', bone: rb }); }
  }
  // --- six element orbs on their orbit ---
  const ORBS = ['OrbFire', 'OrbStorm', 'OrbIce', 'OrbShadow', 'OrbWater', 'OrbNature'];
  ORBS.forEach((m, k) => {
    const a = (k / 6) * Math.PI * 2, c = V([Math.cos(a) * 2.9, 3.9 + Math.sin(a * 3) * 0.45, 0.25 + Math.sin(a) * 2.9]);
    B.add(ell(0.36, 0.36, 0.36, 12, 8), { pos: c.toArray(), mesh: m, bone: 'ElementOrbit' });
    B.add(ell(0.13, 0.13, 0.13, 8, 6), { pos: c.toArray(), mesh: 'GlowCore', bone: 'ElementOrbit' });
    B.add(new THREE.TorusGeometry(0.46, 0.03, 4, 16), { pos: c.toArray(), rot: [a, k, 0], mesh: 'Glow', bone: 'ElementOrbit' });
  });
  // --- tail: gold rings, feather fan, prism blade ---
  const tl = tail(B, { pts: [[0, 3.4, 2.5], [0, 3.2, 3.7], [0, 3.5, 4.8], [0, 4.3, 5.6], [0, 5.3, 5.9]], r: (t) => 0.32 - 0.16 * t, color: 'pearl', rings: 24, seg: 12 });
  for (let k = 0; k < 4; k++) { const t = 0.25 + k * 0.17, c = tl.curve.getPoint(t); B.add(new THREE.TorusGeometry(0.3 - k * 0.04, 0.05, 5, 12), { pos: c.toArray(), quat: quatTo(tl.curve.getTangent(t).toArray()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))), color: 'gold', weights: () => tl.w(t) }); }
  const tip = V(W.TailTip), tan = tl.curve.getTangent(1);
  for (let k = 0; k < 7; k++) { const a = (k / 6 - 0.5) * 2.2, d = tan.clone().add(V([Math.sin(a) * 0.9, Math.cos(a) * 0.5, 0])).normalize(); B.add(blade(1.2, 0.3, 0.05), { pos: tip.toArray(), quat: surfaceQuat([0, -Math.sin(a), 1], d.toArray()), color: k % 2 ? 'feather' : 'featherTip', bone: 'TailTip' }); }
  B.add(crystal(0.26, 1.8), { pos: tip.toArray(), quat: quatTo(tan.toArray()), mesh: 'Prism', bone: 'TailTip' });
  B.add(crystal(0.13, 1.3), { pos: tip.toArray(), quat: quatTo(tan.toArray()), mesh: 'GlowCore', bone: 'TailTip' });
}

export default {
  name: 'Aetherion', element: 'Prism', palette, glow, bones, build, glowBoost: { Glow: 0.72, GlowCore: 0.62, Prism: 0.8, Eyes: 0.9 }, bloom: 0.38,
  style: { tip: 'TailTip', wings: true, wingRest: 0.45, dur: { Idle: 3.2, Walk: 1.2, Run: 0.72, Attack: 1.3, Roar: 2.8 }, walk: [0.42, 0.6, 0.4, 0.5], bob: 1.0, roll: 0.02, tail: 1.2, neck: 0.4 },
  spinners: [
    { bone: 'Halo1', axis: [0, 0, 1], speed: 0.6 }, { bone: 'Halo2', axis: [0.3, 0.5, 1], speed: -1.1 }, { bone: 'Halo3', axis: [-0.4, 0.3, 1], speed: 1.7 },
    { bone: 'Crown', axis: [0, 1, 0], speed: 1.2, bob: 0.15, bobFreq: 0.5 }, { bone: 'ElementOrbit', axis: [0, 1, 0], speed: 0.9, bob: 0.25, bobFreq: 0.3 },
    ...['FrontL', 'FrontR', 'BackL', 'BackR'].map((n, i) => ({ bone: `Rune${n}`, axis: [0, 1, 0], speed: i % 2 ? -1.5 : 1.5 })),
  ],
  bg: '#16122a', light: { bone: 'Chest', color: '#e0c8ff' }, outline: '#100a1c', fit: { hero: 0.84, sprite: 0.8, roar: 0.9 },
  views: { hero: [-10, 3.2, -10], roar: [-9.5, 1.6, -8], sprite: [-12, 2.8, -10] },
};
