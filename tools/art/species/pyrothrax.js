// Pyrothrax, the Volcano Tyrant (Fire, BOSS). A hulking kaiju dragon about 16 studs long.
// Crimson scales under obsidian armour plates with magma glowing through every seam, an active
// volcano on its back with molten rocks orbiting the crater, a horned skull with a glowing
// throat and fangs, tattered wings with burning edges, a spiked tail ending in a molten mace.
// Uses the quadruped rig plus the boss attack clips (style.body = 'boss').
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, quadBones, addEye, membraneWing, rock, flame } from '../lib.js';
import { torso, neck, legs, tail, armor } from '../kit.js';

const palette = [
  ['scale', '#7a2a1e'], ['scaleDeep', '#4e1812'], ['scaleLight', '#a8402a'], ['obsidian', '#2c2328'], ['obsidianLight', '#4a3a40'], ['obsidianDeep', '#17121a'],
  ['belly', '#c8642c'], ['bellyDeep', '#8a3a1a'], ['membrane', '#5e1a18'], ['membraneLight', '#8e2a1e'], ['horn', '#ead8b2'], ['hornDeep', '#a8946a'],
  ['rock', '#3e3434'], ['claw', '#1c161a'], ['pupil', '#1a0a04'], ['white', '#ffffff'],
];
const glow = { Eyes: '#ffd34a', Magma: '#ff6a1a', GlowCore: '#ffe08a', Flame: '#ff8a2a' };

const bones = quadBones({
  hips: [4.2, 2.6], spine: [4.7, 0.4], chest: [5.1, -1.8], neck: [6.1, -3.1], head: [6.9, -4.0], jaw: [6.15, -4.85],
  ear: [1.05, 7.7, -3.7],
  tail: [[4.2, 4.4], [3.6, 6.2], [3.1, 7.9], [2.9, 9.4], [3.1, 10.8]],
  front: { x: 1.75, upper: [4.6, -1.95], lower: [2.4, -2.3], paw: [0.85, -2.5] },
  back: { x: 1.85, upper: [4.2, 2.6], lower: [2.3, 3.15], paw: [0.85, 2.85] },
  wing: { upper: [1.35, 6.2, -1.0], lower: [4.5, 7.3, 0.6], tip: [7.3, 7.4, 2.2] },
});
bones.push(['MagmaOrbit', 'Spine', [0, 9.1, 0.6]]);

// glowing crack: a jagged thin glow line between points
function crack(B, pts, opts, r = 0.05) { B.add(loft({ points: pts.map((p) => (p.toArray ? p.toArray() : p)), rx: () => r, ry: () => r, rings: pts.length * 3, seg: 4 }), { mesh: 'Magma', ...opts }); }
// armour plate with a glowing magma seam peeking out underneath
function plate(B, p, n, dir, w, l, t, opts, trim = 'obsidianLight') {
  const N = V(n).normalize();
  armor(B, { p: V(p).addScaledVector(N, -0.03), n, dir, w: w * 1.12, l: l * 1.1, t: t * 0.6, color: 'obsidianDeep', opts: { ...opts, mesh: 'Magma', color: undefined } });
  armor(B, { p, n, dir, w, l, t, color: 'obsidian', trim, opts });
}

function build(B, W) {
  const T = torso(B, { pts: [[0, 4.1, 4.2], [0, 4.25, 2.4], [0, 4.6, 0.4], [0, 5.0, -1.5], [0, 5.3, -2.8]], rx: (t) => 1.95 + 0.45 * t, ry: (t) => 1.85 + 0.5 * t, color: 'scale', zHips: 2.6, zSpine: 0.4, zChest: -1.8, rings: 22, seg: 16 });
  const tw = T.torsoW;
  // belly plates (horizontal bands)
  for (let k = 0; k < 8; k++) { const z = -2.4 + k * 0.72; B.add(ell(1.35 - Math.abs(k - 3) * 0.06, 0.38, 0.42, 10, 6), { pos: [0, 3.0 - Math.abs(k - 2) * 0.03, z], color: k % 2 ? 'belly' : 'bellyDeep', weights: tw }); }
  // heavy shoulder and haunch masses
  for (const [, x] of SIDES) {
    B.add(ell(1.35, 1.7, 1.6, 12, 8), { pos: [1.4 * x, 4.9, -1.8], color: 'scale', weights: tw });
    B.add(ell(1.3, 1.6, 1.7, 12, 8), { pos: [1.45 * x, 4.3, 2.6], color: 'scale', weights: tw });
  }
  // obsidian armour: back plates, shoulder pauldrons, flank plates; magma seams + cracks
  for (const [t, w, l] of [[0.12, 1.2, 0.6], [0.26, 1.35, 0.65], [0.6, 1.4, 0.65], [0.75, 1.35, 0.6], [0.88, 1.2, 0.55]]) { const { p, n } = T.surf(t, Math.PI / 2, 1, 1.0); plate(B, p, n, [0, 0, 1], w, l, 0.16, { weights: tw }); }
  for (const [, x] of SIDES) {
    for (const [t, th, w, l] of [[0.82, 0.75, 1.0, 1.1], [0.2, 0.7, 0.95, 1.0], [0.5, 0.35, 0.8, 0.9], [0.66, 0.2, 0.7, 0.75], [0.34, 0.25, 0.7, 0.8]]) {
      const { p, n } = T.surf(t, th, x, 1.02); plate(B, p, n.clone().add(V([0, 0.2, 0])), [0, 0.3, 1], w * 1.15, l * 1.15, 0.16, { weights: tw }, null);
    }
    // magma cracks running down the flanks
    for (const [t0, th0] of [[0.42, 0.05], [0.58, -0.2], [0.28, -0.1]]) {
      const pts = []; for (let k = 0; k < 5; k++) { const s = T.surf(t0 + (k % 2 ? 0.025 : -0.02) + k * 0.01, th0 - k * 0.14, x, 1.005); pts.push(s.p); }
      crack(B, pts, { weights: tw }, 0.06);
    }
  }

  // --- the volcano on its back: rock cone, crater rim, lava pool, lava drips ---
  const VC = V([0, 6.3, 0.55]); const VH = 0.9; // lift of the crater relative to the old cone
  const cone_ = new THREE.LatheGeometry([[2.5, 0], [2.15, 0.5], [1.55, 1.7], [1.15, 2.75], [1.28, 2.95], [1.05, 2.9], [0.75, 2.6]].map(([r, y]) => new THREE.Vector2(r, y)), 16);
  B.add(cone_, { pos: VC.clone().add(V([0, -0.6, 0])).toArray(), color: 'rock', bone: 'Spine' });
  for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; B.add(rock(0.35 + (k % 3) * 0.08, 11 + k, 0.8), { pos: VC.clone().add(V([Math.cos(a) * 1.18, 1.35 + VH + (k % 2) * 0.08, Math.sin(a) * 1.18])).toArray(), color: k % 2 ? 'obsidian' : 'rock', bone: 'Spine' }); }
  B.add(new THREE.CylinderGeometry(0.95, 0.95, 0.1, 18), { pos: VC.clone().add(V([0, 1.25 + VH, 0])).toArray(), mesh: 'GlowCore', bone: 'Spine' });
  B.add(new THREE.TorusGeometry(1.0, 0.1, 6, 20), { pos: VC.clone().add(V([0, 1.3 + VH, 0])).toArray(), rot: [Math.PI / 2, 0, 0], mesh: 'Magma', bone: 'Spine' });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3, pts = [];
    for (let j = 0; j <= 4; j++) { const f = j / 4, r = 1.15 + f * 1.2, y = 1.4 + VH - f * 2.75; pts.push(VC.clone().add(V([Math.cos(a + Math.sin(j * 1.7) * 0.08) * r, y, Math.sin(a + Math.sin(j * 1.7) * 0.08) * r]))); }
    crack(B, pts, { bone: 'Spine' }, 0.09 - (k % 2) * 0.02);
  }
  for (let k = 0; k < 3; k++) B.add(flame(0.3 - k * 0.06, 1.1 - k * 0.2, { rings: 10, seg: 10, twist: 2 }), { pos: VC.clone().add(V([(k - 1) * 0.35, 1.35 + VH, (k % 2) * 0.2])).toArray(), quat: quatTo([(k - 1) * 0.2, 1, 0]), mesh: 'Flame', bone: 'Spine' });
  // molten rocks orbiting the crater (MagmaOrbit bone)
  const O = V(W.MagmaOrbit);
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2, c = O.clone().add(V([Math.cos(a) * 1.9, Math.sin(a * 2) * 0.25, Math.sin(a) * 1.9])); B.add(rock(0.32, 30 + k, 0.9, 1), { pos: c.toArray(), color: 'obsidian', bone: 'MagmaOrbit' }); B.add(ell(0.22, 0.22, 0.22, 8, 6), { pos: c.toArray(), mesh: 'Magma', bone: 'MagmaOrbit' }); B.add(flame(0.15, 0.55, { rings: 8, seg: 8 }), { pos: c.clone().add(V([0, 0.15, 0])).toArray(), mesh: 'Flame', bone: 'MagmaOrbit' }); }

  // --- neck with a ridge of spikes ---
  const nw = neck(B, { pts: [[0, 5.1, -2.4], [0, 6.1, -3.1], [0, 6.85, -3.9]], r: 1.25, color: 'scale', yChest: 5.2, yNeck: 6.1, yHead: 6.8 });
  for (let k = 0; k < 4; k++) { const y = 5.7 + k * 0.38, z = -2.4 - k * 0.45; B.add(cone(0.22, 0.9 - k * 0.1, 6), { pos: [0, y + 1.05, z + 0.25], quat: quatTo([0, 1, 0.7]), color: 'obsidian', weights: nw }); }
  for (let k = 0; k < 3; k++) B.add(ell(0.85, 0.3, 0.32, 12, 6), { pos: [0, 5.35 + k * 0.35, -3.0 - k * 0.32], color: 'belly', weights: nw });

  // --- head: massive horned skull, glowing throat, fangs ---
  B.add(ell(1.35, 1.15, 1.35, 18, 12), { pos: [0, 7.05, -4.15], color: 'scale', bone: 'Head' });
  B.add(taperFront(ell(1.05, 0.8, 1.35, 16, 12), 0.3), { pos: [0, 6.8, -5.15], color: 'scale', bone: 'Head' });
  armor(B, { p: [0, 7.75, -4.7], n: [0, 1, -0.35], dir: [0, 0.2, -1], w: 0.75, l: 1.2, t: 0.18, color: 'obsidian', trim: 'obsidianLight', opts: { bone: 'Head' } });
  for (const [, x] of SIDES) {
    B.add(ell(0.6, 0.28, 0.85), { pos: [0.6 * x, 7.55, -4.85], rot: [0.25, 0.25 * x, 0.35 * x], color: 'obsidian', bone: 'Head' }); // brow ridge
    addEye(B, x, [0.78 * x, 7.33, -5.0], { r: [0.32, 0.25, 0.15], pupil: [0.06, 0.2], th: -0.5 * x, lid: 'obsidian', lidAngle: 0.95, lidTilt: 0.85, brow: { color: 'obsidianDeep', len: 0.42, tilt: 0.85 } });
    // great swept horns + smaller ones
    const hp = [[0.8 * x, 7.9, -4.0], [1.35 * x, 8.6, -3.5], [1.7 * x, 9.0, -2.6], [1.65 * x, 8.8, -1.6]];
    B.add(loft({ points: hp, rx: (t) => 0.38 * (1 - 0.85 * t) + 0.03, ry: (t) => 0.38 * (1 - 0.85 * t) + 0.03, rings: 16, seg: 10 }), { color: 'horn', bone: 'Head' });
    for (const t of [0.25, 0.5]) { const c = new THREE.CatmullRomCurve3(hp.map(V)).getPoint(t); B.add(new THREE.TorusGeometry(0.3 * (1 - 0.7 * t), 0.05, 4, 12), { pos: c.toArray(), quat: quatTo(new THREE.CatmullRomCurve3(hp.map(V)).getTangent(t).toArray()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))), color: 'hornDeep', bone: 'Head' }); }
    B.add(loft({ points: [[1.0 * x, 7.1, -3.7], [1.55 * x, 7.0, -3.2], [1.85 * x, 7.2, -2.6]], rx: (t) => 0.2 * (1 - 0.85 * t) + 0.02, ry: (t) => 0.2 * (1 - 0.85 * t) + 0.02, rings: 10, seg: 8 }), { color: 'hornDeep', bone: 'Head' });
    // cheek spikes and glowing nostrils
    for (let k = 0; k < 3; k++) B.add(cone(0.12, 0.5 - k * 0.1, 5), { pos: [1.2 * x, 6.6 - k * 0.2, -4.2 + k * 0.25], quat: quatTo([x, -0.2, 0.5]), color: 'obsidian', bone: 'Head' });
    B.add(ell(0.1, 0.07, 0.08, 8, 5), { pos: [0.32 * x, 7.0, -6.42], mesh: 'Magma', bone: 'Head' });
    // frill fins on the Ear bones
    const e = V(W[`Ear${x < 0 ? 'L' : 'R'}`]);
    for (let k = 0; k < 3; k++) B.add(cone(0.08, 0.7 - k * 0.12, 4), { pos: e.clone().add(V([0.25 * x, -0.2 - k * 0.3, 0.2])).toArray(), quat: quatTo([x, 0.3 - k * 0.2, 0.6]), color: 'membraneLight', bone: `Ear${x < 0 ? 'L' : 'R'}` });
  }
  // upper fangs, glowing throat, lower jaw with fangs and chin spikes
  for (let k = 0; k < 8; k++) { const a = (k / 7 - 0.5) * 2.2; B.add(cone(0.09, k === 1 || k === 6 ? 0.6 : 0.35, 5), { pos: [Math.sin(a) * 0.85, 6.18, -5.1 - Math.cos(a) * 1.05], rot: [Math.PI, 0, 0], color: 'horn', bone: 'Head' }); }
  B.add(ell(0.55, 0.22, 0.8, 12, 6), { pos: [0, 6.3, -4.85], mesh: 'Magma', bone: 'Head' });
  B.add(taperFront(ell(0.95, 0.42, 1.25, 16, 8), 0.3), { pos: [0, 5.85, -5.1], color: 'scaleDeep', bone: 'Jaw' });
  B.add(taperFront(ell(0.82, 0.12, 1.1, 16, 6), 0.3), { pos: [0, 6.18, -5.12], color: 'obsidianDeep', bone: 'Jaw' });
  for (let k = 0; k < 7; k++) { const a = (k / 6 - 0.5) * 2.1; B.add(cone(0.08, k === 1 || k === 5 ? 0.5 : 0.3, 5), { pos: [Math.sin(a) * 0.78, 6.2, -5.15 - Math.cos(a) * 0.95], color: 'horn', bone: 'Jaw' }); }
  for (let k = 0; k < 3; k++) B.add(cone(0.14, 0.55, 5), { pos: [(k - 1) * 0.4, 5.45, -5.3 + Math.abs(k - 1) * 0.2], quat: quatTo([(k - 1) * 0.3, -1, -0.4]), color: 'obsidian', bone: 'Jaw' });
  crack(B, [[-0.3, 5.75, -5.9], [0, 5.7, -6.1], [0.3, 5.75, -5.9]], { bone: 'Jaw' }, 0.05); // molten drool line

  // --- wings: tattered membrane with burning trailing edges ---
  for (const [s, x] of SIDES) {
    const w = membraneWing(B, W, x, { arm: 'obsidian', membrane: 'membrane', claw: 'horn' });
    const ww = (p) => { const a = Math.abs(p.x); return a < Math.abs(w.E.x) ? [[`Wing${s}Upper`, 1]] : a < Math.abs(w.Wr.x) ? [[`Wing${s}Lower`, 1]] : [[`Wing${s}Tip`, 1]]; };
    const edge = [w.tips[0], w.tips[1], w.tips[2]];
    for (let k = 0; k < 2; k++) { const a = edge[k], b = edge[k + 1], m = a.clone().lerp(b, 0.5).add(V([0, -0.35, 0.25])); crack(B, [a, a.clone().lerp(m, 0.5), m, m.clone().lerp(b, 0.5), b], { weights: ww }, 0.07); }
    for (const tp of edge) B.add(flame(0.14, 0.6, { rings: 8, seg: 8 }), { pos: tp.toArray(), quat: quatTo([0, 1, 0.3]), mesh: 'Flame', weights: ww });
    // spikes along the wing arm
    for (const t of [0.3, 0.6]) { const p = w.S.clone().lerp(w.E, t); B.add(cone(0.12, 0.5, 5), { pos: p.toArray(), quat: quatTo([0.2 * x, 1, -0.3]), color: 'horn', weights: ww }); }
  }

  // --- legs: thick pillars, obsidian greaves, magma cracks, big claws ---
  legs(B, W, { front: { r: [0.95, 0.6] }, back: { r: [1.0, 0.62] }, color: 'scale', footColor: 'scaleDeep', clawColor: 'claw', foot: 'paw' });
  for (const [s, x] of SIDES) for (const k of ['Front', 'Back']) {
    const U = V(W[`${k}${s}Upper`]), L = V(W[`${k}${s}Lower`]), P = V(W[`${k}${s}Paw`]);
    plate(B, L.clone().lerp(P, 0.4).add(V([0.1 * x, 0, k === 'Front' ? -0.55 : 0.55])), [0.25 * x, 0, k === 'Front' ? -1 : 1], [0, 1, 0], 0.5, 0.65, 0.14, { bone: `${k}${s}Lower` }, null);
    crack(B, [U.clone().lerp(L, 0.3).add(V([0.85 * x, 0, 0])), U.clone().lerp(L, 0.55).add(V([0.92 * x, 0, -0.1])), U.clone().lerp(L, 0.8).add(V([0.8 * x, 0, 0.05]))], { bone: `${k}${s}Upper` }, 0.06);
    for (const dx of [-0.45, 0, 0.45]) B.add(cone(0.14, 0.75, 6), { pos: [P.x + dx, 0.25, P.z - 1.3], quat: quatTo([0, -0.4, -1]), color: 'claw', bone: `${k}${s}Paw` });
  }

  // --- tail: spiked ridge, magma underside, molten mace ---
  const tl = tail(B, { pts: [[0, 4.1, 4.2], [0, 3.6, 6.2], [0, 3.1, 7.9], [0, 2.9, 9.4], [0, 3.1, 10.8]], r: (t) => 1.1 * (1 - 0.8 * t) + 0.18, color: 'scale', rings: 22, seg: 12 });
  for (let k = 0; k < 9; k++) { const t = 0.08 + k * 0.1, c = tl.curve.getPoint(t), r = 1.1 * (1 - 0.8 * t) + 0.18; B.add(cone(0.18 * (1 - 0.5 * t) + 0.06, 0.8 * (1 - 0.5 * t) + 0.2, 5), { pos: c.clone().add(V([0, r * 0.95, 0])).toArray(), quat: quatTo(V([0, 1, 0.6]).toArray()), color: k % 2 ? 'obsidianLight' : 'obsidian', weights: () => tl.w(t) }); }
  crack(B, Array.from({ length: 8 }, (_, k) => { const t = 0.1 + k * 0.11, c = tl.curve.getPoint(t), r = 1.1 * (1 - 0.8 * t) + 0.18; return c.clone().add(V([(k % 2 ? 0.12 : -0.12), -r * 0.92, 0])); }), { weights: (p) => tl.w(Math.min(0.95, Math.max(0, (p.z - 4.2) / 6.6))) }, 0.07);
  const tip = V(W.TailTip);
  B.add(rock(0.95, 77, 0.95, 1), { pos: tip.toArray(), color: 'obsidian', bone: 'TailTip' });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, d = V([Math.cos(a), Math.sin(a), 0.35]).normalize(); B.add(cone(0.18, 0.75, 5), { pos: tip.clone().addScaledVector(d, 0.8).toArray(), quat: quatTo(d.toArray()), color: 'horn', bone: 'TailTip' }); }
  for (const k of [0, 1, 2]) { const a = k * 2.1; crack(B, [tip.clone().add(V([Math.cos(a) * 0.3, Math.sin(a) * 0.3, -0.5])), tip.clone().add(V([Math.cos(a + 0.4) * 0.85, Math.sin(a + 0.4) * 0.85, 0])), tip.clone().add(V([Math.cos(a + 0.8) * 0.3, Math.sin(a + 0.8) * 0.3, 0.6]))], { bone: 'TailTip' }, 0.08); }
  B.add(ell(0.45, 0.45, 0.45, 12, 8), { pos: tip.clone().add(V([0, 0, 0.95])).toArray(), mesh: 'GlowCore', bone: 'TailTip' });
}

export default {
  name: 'Pyrothrax', element: 'Fire', palette, glow, bones, build, glowBoost: { Magma: 0.8, GlowCore: 0.9, Flame: 0.9 }, bloom: 0.42,
  style: {
    body: 'boss', wings: true, wingRest: 0.12, tip: 'TailTip', attack: 'bite',
    dur: { Idle: 3.2, Walk: 1.5, Run: 0.9, Attack: 1.3, Roar: 2.8, FireBreath: 3.0, TailSwipe: 1.8, Stomp: 2.2, Eruption: 3.2, Enrage: 3.0, Hurt: 0.6, Death: 3.0 },
    walk: [0.38, 0.55, 0.36, 0.45], run: [0.6, 0.75, 0.6, 0.65], bob: 1.0, roll: 0.05, sway: 0.8, tail: 1.1, neck: 0.5, headLow: -0.05,
  },
  spinners: [{ bone: 'MagmaOrbit', axis: [0, 1, 0], speed: 0.9, bob: 0.25, bobFreq: 0.4 }],
  bg: '#1c1012', light: { bone: 'Spine', color: '#ff7a2a' }, outline: '#0c0406', fit: { hero: 0.62, roar: 0.74, sprite: 0.72 },
  views: { hero: [-9, 2.6, -9.5], roar: [-9, 1.2, -8], sprite: [-10.5, 2.2, -9] },
};
