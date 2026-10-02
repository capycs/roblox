// Glaciarch (Ice, Legendary): armoured frost wyvern. Deep-navy scaled body with a pale
// belly, silver-trimmed ice armour, a crown of icicle spires, an icicle beard, crystal-
// tipped membrane wings, a spine of glowing crystals and a long tail ending in an ice blade.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, quadBones, addEye, crystal, membraneWing, blade } from '../lib.js';
import { torso, neck, legs, tail, armor } from '../kit.js';

const palette = [
  ['scale', '#2e4f86'], ['scaleDeep', '#1c3260'], ['scaleLight', '#4f78b8'], ['belly', '#cfe4f6'], ['bellyShade', '#9fbedc'],
  ['ice', '#bfe6fb'], ['iceDeep', '#7fb4dc'], ['silver', '#e8eef6'], ['silverDeep', '#9aa8bc'], ['membrane', '#7fc6ee'],
  ['claw', '#f4fbff'], ['nose', '#0f1a30'], ['mouth', '#5a2240'], ['pupil', '#0a1424'], ['white', '#ffffff'],
];
const glow = { Eyes: '#bff8ff', Glow: '#6fd8ff', GlowCore: '#e8fdff' };

const bones = quadBones({
  hips: [2.7, 1.4], spine: [2.9, 0.2], chest: [3.1, -1.0], neck: [3.8, -1.55], head: [4.55, -2.0], jaw: [4.15, -2.5],
  ear: [0.55, 5.2, -1.85],
  tail: [[2.85, 2.25], [2.6, 3.3], [2.7, 4.35], [3.1, 5.25], [3.55, 5.95]],
  front: { x: 0.9, upper: [2.7, -1.05], lower: [1.4, -1.15], paw: [0.45, -1.2] },
  back: { x: 0.92, upper: [2.65, 1.4], lower: [1.4, 1.6], paw: [0.45, 1.4] },
  wing: { upper: [0.75, 3.75, -0.55], lower: [2.1, 4.85, -0.2], tip: [3.5, 5.7, 0.4] },
});
// spinner bones: ice shards orbit the body, a crown crystal hovers above the head
bones.push(['FrostOrbit', 'Spine', [0, 3.4, 0.2]], ['CrownHover', 'Head', [0, 6.2, -2.25]]);

function build(B, W) {
  const T = torso(B, { pts: [[0, 2.75, 2.3], [0, 2.8, 1.4], [0, 2.95, 0.2], [0, 3.15, -0.95], [0, 3.3, -1.7]], rx: (t) => 0.88 + 0.22 * t, ry: (t) => 0.88 + 0.25 * t, color: 'scale', zHips: 1.4, zSpine: 0.2, zChest: -1.0, rings: 26, seg: 18 });
  // segmented belly plates
  for (let k = 0; k < 6; k++) { const t = 0.15 + k * 0.13, { p } = T.surf(t, -Math.PI / 2, 1, 0.97); B.add(ell(0.62 - Math.abs(k - 3) * 0.03, 0.14, 0.3, 12, 6), { pos: p.toArray(), color: k % 2 ? 'bellyShade' : 'belly', weights: T.torsoW }); }
  // scale rows on the flanks
  for (const [, x] of SIDES) for (let k = 0; k < 7; k++) for (const th of [0.15, 0.55]) { const t = 0.15 + k * 0.11, { p, n } = T.surf(t, th + (k % 2) * 0.12, x, 1.0); B.add(ell(0.2, 0.05, 0.16, 6, 3), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, -0.3, 1]), color: 'scaleLight', weights: T.torsoW }); }
  // ice armour: back plates with silver trim + crystal spine
  for (const [t, w, l] of [[0.2, 0.8, 0.45], [0.36, 0.95, 0.5], [0.52, 1.0, 0.5], [0.68, 0.95, 0.45]]) { const { p, n } = T.surf(t, Math.PI / 2, 1, 1.02); armor(B, { p, n, dir: [0, 0, 1], w, l, t: 0.1, color: 'ice', trim: 'silver', rivets: 'silverDeep', opts: { weights: T.torsoW } }); }
  [[0.14, 0.18, 0.7], [0.28, 0.22, 1.0], [0.44, 0.26, 1.3], [0.6, 0.24, 1.15], [0.76, 0.2, 0.9], [0.88, 0.16, 0.7]].forEach(([t, r, h], k) => { const { p } = T.surf(t, Math.PI / 2, 1, 1.05); B.add(crystal(r, h), { pos: p.clone().add(V([0, 0.05, 0])).toArray(), quat: quatTo([0, 1, -0.25]), mesh: k % 2 ? 'Glow' : 'GlowCore', weights: T.torsoW }); });
  for (const [, x] of SIDES) {
    const { p, n } = T.surf(0.8, 0.8, x, 1.05);
    armor(B, { p: p.clone().add(V([0.2 * x, 0.1, 0])), n: n.clone().add(V([0.3 * x, 0.2, 0])), dir: [0, 0.4, 1], w: 0.75, l: 0.85, t: 0.14, color: 'ice', trim: 'silver', rivets: 'silverDeep', opts: { weights: T.torsoW } });
    for (let k = 0; k < 3; k++) B.add(crystal(0.1, 0.5 - k * 0.1), { pos: p.clone().add(V([0.5 * x, 0.35, -0.2 + k * 0.3])).toArray(), quat: quatTo([x * 0.9, 0.7, 0.1]), mesh: 'Glow', weights: T.torsoW });
    for (const [t, th] of [[0.35, 0.3], [0.55, 0.3]]) { const s = T.surf(t, th, x, 1.01); B.add(ell(0.3, 0.04, 0.04, 8, 4), { pos: s.p.toArray(), quat: surfaceQuat(s.n.toArray(), [0, 0.5, 1]), mesh: 'Glow', weights: T.torsoW }); }
  }
  neck(B, { pts: [[0, 3.2, -1.35], [0, 3.85, -1.6], [0, 4.55, -2.0]], r: 0.66, color: 'scale', yChest: 3.3, yNeck: 3.85, yHead: 4.45 });
  for (let k = 0; k < 4; k++) B.add(crystal(0.12, 0.55), { pos: [0, 3.95 + k * 0.2, -1.35 - k * 0.15], quat: quatTo([0, 1, 0.5]), mesh: 'Glow', bone: k < 2 ? 'Neck' : 'Head' });

  // --- head: long wedge snout, heavy brow, icicle crown + beard ---
  B.add(ell(0.72, 0.65, 0.78, 22, 16), { pos: [0, 4.6, -2.1], color: 'scale', bone: 'Head' });
  B.add(taperFront(ell(0.48, 0.38, 0.85, 18, 12), 0.45), { pos: [0, 4.35, -2.85], color: 'scaleLight', bone: 'Head' });
  B.add(ell(0.62, 0.2, 0.55), { pos: [0, 4.88, -2.45], rot: [0.25, 0, 0], color: 'scaleDeep', bone: 'Head' });
  for (const [, x] of SIDES) B.add(ell(0.07, 0.05, 0.05, 6, 4), { pos: [0.14 * x, 4.48, -3.6], color: 'nose', bone: 'Head' });
  B.add(taperFront(ell(0.38, 0.16, 0.75), 0.45), { pos: [0, 3.98, -2.8], color: 'belly', bone: 'Jaw' });
  B.add(taperFront(ell(0.3, 0.06, 0.66, 12, 6), 0.45), { pos: [0, 4.1, -2.82], color: 'mouth', bone: 'Jaw' });
  for (let k = 0; k < 5; k++) B.add(cone(0.07, 0.6 - Math.abs(k - 2) * 0.1, 6), { pos: [(k - 2) * 0.12, 3.82, -2.6 - Math.abs(k - 2) * 0.05], quat: quatTo([(k - 2) * 0.1, -1, -0.15]), color: 'ice', bone: 'Jaw' });
  for (const [, x] of SIDES) {
    B.add(cone(0.06, 0.3, 6), { pos: [0.22 * x, 4.12, -3.3], rot: [Math.PI, 0, 0], color: 'claw', bone: 'Head' });
    addEye(B, x, [0.36 * x, 4.72, -2.75], { r: [0.17, 0.15, 0.09], pupil: [0.035, 0.12], th: -0.42 * x, lid: 'scaleDeep', lidAngle: 1.2, lidTilt: 0.6, brow: { color: 'silver', len: 0.36, tilt: 0.7 } });
    // swept-back horns + icicle crown
    B.add(loft({ points: [[0.42 * x, 5.0, -2.2], [0.75 * x, 5.35, -1.75], [0.95 * x, 5.55, -1.1], [1.0 * x, 5.5, -0.55]], rx: (t) => 0.17 * (1 - 0.85 * t) + 0.02, ry: (t) => 0.17 * (1 - 0.85 * t) + 0.02, rings: 14, seg: 8 }), { color: 'silver', bone: 'Head' });
    for (const [dx, h, lean] of [[0.2, 0.8, 0.3], [0.38, 0.6, 0.6]]) B.add(crystal(0.09, h), { pos: [dx * x, 5.15, -2.3], quat: quatTo([lean * x, 1, 0.35]), mesh: 'GlowCore', bone: 'Head' });
    // fin frills on the cheeks
    B.add(blade(0.7, 0.28, 0.05), { pos: [0.62 * x, 4.45, -2.0], quat: surfaceQuat([x, 0.2, 0], [0.5 * x, 0.1, 1]), color: 'membrane', bone: 'Head' });
  }
  B.add(crystal(0.11, 1.0), { pos: [0, 5.2, -2.35], quat: quatTo([0, 1, 0.3]), mesh: 'GlowCore', bone: 'Head' });
  // hovering crown: double-pointed crystal inside a silver ring
  const ch = V([0, 6.2, -2.25]);
  B.add(crystal(0.18, 0.55), { pos: ch.toArray(), mesh: 'GlowCore', bone: 'CrownHover' });
  B.add(crystal(0.18, 0.4), { pos: ch.toArray(), quat: quatTo([0, -1, 0]), mesh: 'Glow', bone: 'CrownHover' });
  B.add(new THREE.TorusGeometry(0.42, 0.04, 5, 20), { pos: ch.toArray(), rot: [Math.PI / 2, 0, 0], color: 'silver', bone: 'CrownHover' });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; B.add(crystal(0.04, 0.18), { pos: ch.clone().add(V([Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42])).toArray(), mesh: 'Glow', bone: 'CrownHover' }); }
  // orbiting ice shards
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2, c = V([Math.cos(a) * 2.5, 3.4 + (k % 2) * 0.5, 0.2 + Math.sin(a) * 2.5]); B.add(crystal(0.16, 0.7), { pos: c.toArray(), quat: quatTo([Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3]), mesh: 'GlowCore', bone: 'FrostOrbit' }); B.add(crystal(0.16, 0.5), { pos: c.toArray(), quat: quatTo([Math.cos(a) * 0.3, -1, Math.sin(a) * 0.3]), mesh: 'Glow', bone: 'FrostOrbit' }); }

  // --- wings: membrane with ice-crystal spurs ---
  for (const [, x] of SIDES) {
    const w = membraneWing(B, W, x, { arm: 'scaleDeep', membrane: 'membrane', claw: 'ice' });
    for (const tp of w.tips) B.add(crystal(0.08, 0.6), { pos: tp.toArray(), quat: quatTo(tp.clone().sub(w.Wr).toArray()), mesh: 'Glow', weights: () => [[`Wing${x < 0 ? 'L' : 'R'}Tip`, 1]] });
    B.add(crystal(0.1, 0.55), { pos: w.E.toArray(), quat: quatTo([0.3 * x, 1, -0.3]), mesh: 'Glow', weights: () => [[`Wing${x < 0 ? 'L' : 'R'}Lower`, 1]] });
  }
  // --- legs with ice greaves ---
  legs(B, W, { front: { r: [0.54, 0.3] }, back: { r: [0.56, 0.31] }, color: 'scale', footColor: 'scaleDeep', clawColor: 'claw', foot: 'paw' });
  for (const [s] of SIDES) for (const k of ['Front', 'Back']) { const L = V(W[`${k}${s}Lower`]), P = V(W[`${k}${s}Paw`]); armor(B, { p: L.clone().lerp(P, 0.45).add(V([0, 0, k === 'Front' ? -0.3 : 0.28])), n: [0, 0, k === 'Front' ? -1 : 1], dir: [0, 1, 0], w: 0.28, l: 0.42, t: 0.08, color: 'ice', trim: 'silver', opts: { bone: `${k}${s}Lower` } }); }
  // --- tail with crystal spines and an ice blade ---
  const tl = tail(B, { pts: [[0, 2.8, 2.2], [0, 2.6, 3.3], [0, 2.7, 4.35], [0, 3.1, 5.25], [0, 3.55, 5.95]], r: (t) => 0.38 * (1 - 0.75 * t) + 0.06, color: 'scale', rings: 30, seg: 12 });
  for (let k = 0; k < 5; k++) { const t = 0.15 + k * 0.16, c = tl.curve.getPoint(t); B.add(crystal(0.1 - k * 0.012, 0.55 - k * 0.06), { pos: c.clone().add(V([0, 0.3 * (1 - 0.7 * t), 0])).toArray(), quat: quatTo([0, 1, 0.4]), mesh: 'Glow', weights: () => tl.w(t) }); }
  const tip = V(W.TailTip), tan = tl.curve.getTangent(1);
  B.add(crystal(0.22, 1.5), { pos: tip.toArray(), quat: quatTo(tan.toArray()), mesh: 'GlowCore', bone: 'TailTip' });
  for (const x of [-1, 1]) B.add(crystal(0.12, 0.8), { pos: tip.toArray(), quat: quatTo(tan.clone().add(V([0.7 * x, 0, 0])).toArray()), mesh: 'Glow', bone: 'TailTip' });
}

export default {
  name: 'Glaciarch', element: 'Ice', palette, glow, bones, build, glowBoost: { Glow: 0.75, GlowCore: 0.65 },
  style: { tip: 'TailTip', wings: true, wingRest: 0.25, dur: { Idle: 3.0, Walk: 1.15, Run: 0.7, Attack: 1.2, Roar: 2.6 }, walk: [0.42, 0.6, 0.4, 0.5], bob: 1.0, tail: 1.3, neck: 0.6 },
  spinners: [{ bone: 'FrostOrbit', axis: [0, 1, 0], speed: -0.9, bob: 0.2, bobFreq: 0.4 }, { bone: 'CrownHover', axis: [0, 1, 0], speed: 1.6, bob: 0.12, bobFreq: 0.6 }],
  bg: '#141d27', light: { bone: 'Head', color: '#8fe8ff' }, outline: '#0a1220', fit: { hero: 0.72, sprite: 0.72 },
  views: { hero: [-9.5, 3.4, -9.5], roar: [-9, 1.5, -7.5], sprite: [-11, 2.8, -9.5] },
};
