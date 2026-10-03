// Lumenjaw (Water, Legendary): a deep-sea angler-dragon. Massive head with an underbite
// full of needle fangs, a glowing lure dangling from a stalk over its face, fan-fin frills,
// a spined dorsal fin with glowing tips, rows of photophores down its flanks, dark
// shell-plate armour, webbed paws and a long finned tail. Three little jellyfish orbit it.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, quadBones, addEye, blade } from '../lib.js';
import { torso, neck, legs, tail, armor } from '../kit.js';

const palette = [
  ['hide', '#1f4a6e'], ['hideDeep', '#132f4c'], ['hideLight', '#2f6d94'], ['belly', '#bfe6e0'], ['bellyDeep', '#86c4c0'],
  ['plate', '#0e2236'], ['plateTrim', '#4fb8c8'], ['fin', '#2a8aa6'], ['finDeep', '#1a5e7a'], ['fang', '#f4fbff'],
  ['jelly', '#c8f4ff'], ['stalk', '#16344f'], ['nose', '#08121e'], ['mouth', '#3a0e2a'], ['pupil', '#04101a'], ['white', '#ffffff'],
];
const glow = { Eyes: '#9ffcff', Glow: '#38f0ff', GlowCore: '#e6ffff' };

const bones = quadBones({
  hips: [2.3, 1.4], spine: [2.5, 0.2], chest: [2.65, -1.0], neck: [3.0, -1.6], head: [3.35, -2.1], jaw: [2.7, -2.6],
  ear: [1.05, 3.55, -2.0],
  tail: [[2.35, 2.4], [2.1, 3.5], [2.0, 4.6], [2.3, 5.6], [2.85, 6.3]],
  front: { x: 0.9, upper: [2.3, -1.05], lower: [1.2, -1.2], paw: [0.4, -1.25] },
  back: { x: 0.95, upper: [2.3, 1.4], lower: [1.2, 1.6], paw: [0.4, 1.45] },
});
// spinners: the lure bulb turns and bobs, three jellyfish orbit the body
bones.push(['Lure', 'Head', [0, 4.4, -4.35]], ['AbyssOrbit', 'Spine', [0, 3.0, 0.2]]);

function build(B, W) {
  const T = torso(B, { pts: [[0, 2.3, 2.3], [0, 2.35, 1.3], [0, 2.5, 0.2], [0, 2.7, -0.9], [0, 2.85, -1.6]], rx: (t) => 0.95 + 0.2 * t, ry: (t) => 0.95 + 0.25 * t, color: 'hide', zHips: 1.4, zSpine: 0.2, zChest: -1.0, rings: 24, seg: 18 });
  B.add(ell(0.75, 0.5, 1.6, 16, 10), { pos: [0, 1.85, -0.1], color: 'belly', weights: T.torsoW });
  // belly bands
  for (let k = 0; k < 6; k++) B.add(ell(0.62, 0.06, 0.08, 12, 4), { pos: [0, 1.5, -1.1 + k * 0.42], color: 'bellyDeep', weights: T.torsoW });
  // shoulders + haunches
  for (const [, x] of SIDES) {
    B.add(ell(0.65, 0.85, 0.85, 12, 8), { pos: [0.75 * x, 2.65, -1.0], color: 'hide', weights: T.torsoW });
    B.add(ell(0.62, 0.8, 0.9, 12, 8), { pos: [0.75 * x, 2.4, 1.45], color: 'hide', weights: T.torsoW });
    // photophores: two rows of glowing dots down each flank
    for (let k = 0; k < 7; k++) for (const [th, sz] of [[0.05, 0.09], [-0.35, 0.07]]) { const s = T.surf(0.12 + k * 0.12, th, x, 1.01); B.add(ell(sz, sz, 0.04, 8, 5), { pos: s.p.toArray(), quat: surfaceQuat(s.n.toArray(), [0, 0, 1]), mesh: 'Glow', weights: T.torsoW }); }
  }
  // shell-plate armour down the spine with glowing seams, spined dorsal fin between
  for (const [t, w, l] of [[0.22, 0.75, 0.42], [0.38, 0.85, 0.46], [0.54, 0.88, 0.46], [0.7, 0.8, 0.42]]) {
    const { p, n } = T.surf(t, Math.PI / 2, 1, 1.0);
    armor(B, { p, n, dir: [0, 0, 1], w, l, t: 0.1, color: 'plate', trim: 'plateTrim', opts: { weights: T.torsoW } });
  }
  for (let k = 0; k < 7; k++) {
    const t = 0.15 + k * 0.1, { p } = T.surf(t, Math.PI / 2, 1, 1.05), h = 0.7 + 0.5 * Math.sin(Math.PI * (k / 6));
    const d = V([0, 1, 0.45]).normalize();
    B.add(cone(0.07, h, 6), { pos: p.clone().addScaledVector(d, h * 0.5).toArray(), quat: quatTo(d.toArray()), color: 'finDeep', weights: T.torsoW });
    B.add(ell(0.07, 0.07, 0.07, 6, 4), { pos: p.clone().addScaledVector(d, h).toArray(), mesh: 'GlowCore', weights: T.torsoW });
    B.add(blade(h * 0.95, 0.22, 0.03), { pos: p.toArray(), quat: surfaceQuat([1, 0, 0], d.toArray()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.35))), color: 'fin', weights: T.torsoW });
  }
  for (const [, x] of SIDES) {
    const { p, n } = T.surf(0.8, 0.7, x, 1.04);
    armor(B, { p: p.clone().add(V([0.15 * x, 0.1, 0])), n: n.clone().add(V([0.2 * x, 0.2, 0])), dir: [0, 0.4, 1], w: 0.7, l: 0.8, t: 0.12, color: 'plate', trim: 'plateTrim', opts: { weights: T.torsoW } });
  }

  neck(B, { pts: [[0, 2.8, -1.3], [0, 3.05, -1.65], [0, 3.35, -2.1]], r: 0.85, color: 'hide', yChest: 2.85, yNeck: 3.05, yHead: 3.3 });

  // --- head: huge rounded skull, underbite, needle fangs ---
  B.add(ell(1.15, 0.95, 1.2, 24, 18), { pos: [0, 3.5, -2.35], color: 'hide', bone: 'Head' });
  B.add(taperFront(ell(1.0, 0.55, 0.85, 22, 14), 0.2), { pos: [0, 3.3, -3.05], color: 'hideLight', bone: 'Head' });
  B.add(ell(0.95, 0.3, 0.7), { pos: [0, 3.95, -2.75], rot: [0.25, 0, 0], color: 'hideDeep', bone: 'Head' }); // heavy brow ridge
  for (const [, x] of SIDES) B.add(ell(0.07, 0.05, 0.05, 6, 4), { pos: [0.2 * x, 3.45, -3.85], color: 'nose', bone: 'Head' });
  // upper fangs hanging down
  for (let k = 0; k < 9; k++) { const a = (k / 8 - 0.5) * 2.3, x = Math.sin(a) * 0.85, z = -3.0 - Math.cos(a) * 0.72; B.add(cone(0.06, k % 2 ? 0.35 : 0.5, 6), { pos: [x, 2.92, z], rot: [Math.PI, 0, 0], color: 'fang', bone: 'Head' }); }
  // big lower jaw (underbite) with upward fangs and a dark mouth
  B.add(taperFront(ell(1.05, 0.42, 1.0, 22, 12), 0.15), { pos: [0, 2.6, -2.95], color: 'belly', bone: 'Jaw' });
  B.add(taperFront(ell(0.95, 0.12, 0.9, 20, 8), 0.15), { pos: [0, 2.88, -2.98], color: 'mouth', bone: 'Jaw' });
  for (let k = 0; k < 10; k++) { const a = (k / 9 - 0.5) * 2.4, x = Math.sin(a) * 0.95, z = -3.0 - Math.cos(a) * 0.85; B.add(cone(0.065, k % 3 === 0 ? 0.55 : 0.35, 6), { pos: [x, 3.0, z], color: 'fang', bone: 'Jaw' }); }
  // chin barbels with glowing tips
  for (const [, x] of SIDES) { const pts = [[0.35 * x, 2.35, -3.4], [0.45 * x, 2.0, -3.5], [0.6 * x, 1.75, -3.35]]; B.add(loft({ points: pts, rx: (t) => 0.05 * (1 - 0.6 * t), ry: (t) => 0.05 * (1 - 0.6 * t), rings: 8, seg: 6 }), { color: 'stalk', bone: 'Jaw' }); B.add(ell(0.07, 0.07, 0.07, 6, 4), { pos: pts[2], mesh: 'Glow', bone: 'Jaw' }); }
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.62 * x, 3.75, -3.15], { r: [0.17, 0.15, 0.1], pupil: [0.05, 0.12], th: -0.55 * x, lid: 'hideDeep', lidAngle: 1.15, lidTilt: 0.55, brow: { color: 'plate', len: 0.3, tilt: 0.7 } });
    // fan-fin frills on the ear bones: spines + membrane
    const e = V(W[`Ear${s}`]);
    for (let k = 0; k < 5; k++) {
      const a = -0.6 + k * 0.32, d = V([x * Math.cos(a), Math.sin(a) + 0.35, 0.55]).normalize(), len = 1.1 - Math.abs(k - 2) * 0.12;
      B.add(cone(0.05, len, 5), { pos: e.clone().addScaledVector(d, len * 0.5).toArray(), quat: quatTo(d.toArray()), color: 'finDeep', bone: `Ear${s}` });
      B.add(blade(len, 0.2, 0.03), { pos: e.toArray(), quat: surfaceQuat([0, 0.2, -1], d.toArray()), color: k % 2 ? 'fin' : 'finDeep', bone: `Ear${s}` });
      B.add(ell(0.05, 0.05, 0.05, 6, 4), { pos: e.clone().addScaledVector(d, len).toArray(), mesh: 'Glow', bone: `Ear${s}` });
    }
    // head spikes along the skull
    for (let k = 0; k < 3; k++) B.add(cone(0.1, 0.45 - k * 0.08, 6), { pos: [0.45 * x, 4.2 - k * 0.12, -2.4 + k * 0.4], quat: quatTo([0.3 * x, 1, 0.6]), color: 'plate', bone: 'Head' });
  }
  // --- the lure: stalk arching from the brow over the face, glowing bulb with fins ---
  const L = V(W.Lure);
  const lpts = [[0, 4.25, -2.45], [0, 5.05, -2.8], [0, 5.4, -3.5], [0, 5.05, -4.2], L.clone().add(V([0, 0.22, 0])).toArray()];
  B.add(loft({ points: lpts, rx: (t) => 0.09 * (1 - 0.5 * t), ry: (t) => 0.09 * (1 - 0.5 * t), rings: 18, seg: 8 }), { color: 'stalk', bone: 'Head' });
  B.add(ell(0.26, 0.3, 0.26, 16, 12), { pos: L.toArray(), mesh: 'Glow', bone: 'Lure' });
  B.add(ell(0.15, 0.17, 0.15, 10, 8), { pos: L.toArray(), mesh: 'GlowCore', bone: 'Lure' });
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; B.add(blade(0.3, 0.12, 0.02), { pos: L.clone().add(V([Math.cos(a) * 0.2, -0.05, Math.sin(a) * 0.2])).toArray(), quat: surfaceQuat([-Math.sin(a), 0, Math.cos(a)], [Math.cos(a), -0.6, Math.sin(a)]), color: 'fin', bone: 'Lure' }); }

  // --- three jellyfish orbiting the body ---
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2, c = V([Math.cos(a) * 2.6, 3.0 + Math.sin(a * 2) * 0.35, 0.2 + Math.sin(a) * 2.6]);
    const dome = new THREE.SphereGeometry(0.32, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); dome.scale(1, 0.85, 1);
    B.add(dome, { pos: c.toArray(), mesh: 'Glow', bone: 'AbyssOrbit' });
    B.add(ell(0.12, 0.1, 0.12, 8, 6), { pos: c.clone().add(V([0, 0.08, 0])).toArray(), mesh: 'GlowCore', bone: 'AbyssOrbit' });
    for (let j = 0; j < 5; j++) { const b = (j / 5) * Math.PI * 2; const p0 = c.clone().add(V([Math.cos(b) * 0.2, -0.02, Math.sin(b) * 0.2])); B.add(loft({ points: [p0.toArray(), p0.clone().add(V([Math.cos(b) * 0.06, -0.3, Math.sin(b) * 0.06])).toArray(), p0.clone().add(V([-Math.cos(b) * 0.04, -0.6, -Math.sin(b) * 0.04])).toArray()], rx: (t) => 0.03 * (1 - 0.6 * t), ry: (t) => 0.03 * (1 - 0.6 * t), rings: 6, seg: 4 }), { color: 'jelly', bone: 'AbyssOrbit' }); }
  }

  // --- thick legs, forearm fins, webbed paws ---
  legs(B, W, { front: { r: [0.55, 0.32] }, back: { r: [0.58, 0.33] }, color: 'hide', footColor: 'hideDeep', clawColor: 'fang', foot: 'paw' });
  for (const [s, x] of SIDES) for (const k of ['Front', 'Back']) {
    const U = V(W[`${k}${s}Upper`]), Lw = V(W[`${k}${s}Lower`]), P = V(W[`${k}${s}Paw`]);
    const mid = U.clone().lerp(Lw, 0.6);
    B.add(blade(0.85, 0.3, 0.03), { pos: mid.clone().add(V([0.38 * x, 0, 0.1])).toArray(), quat: surfaceQuat([x, 0, 0], [0, -0.4, 1]), color: 'fin', bone: `${k}${s}Upper` });
    B.add(blade(0.5, 0.06, 0.04), { pos: mid.clone().add(V([0.4 * x, 0, 0.1])).toArray(), quat: surfaceQuat([x, 0, 0], [0, -0.4, 1]), mesh: 'Glow', bone: `${k}${s}Upper` });
    // webbing between the toes
    B.add(ell(0.42, 0.04, 0.3, 12, 4), { pos: [P.x, 0.2, P.z - 0.42], color: 'finDeep', bone: `${k}${s}Paw` });
    // glowing armband
    B.add(new THREE.TorusGeometry(0.36, 0.05, 5, 14), { pos: Lw.clone().lerp(P, 0.35).toArray(), rot: [Math.PI / 2, 0, 0], mesh: 'Glow', bone: `${k}${s}Lower` });
  }

  // --- long tail with top and bottom fins and a glowing fluke ---
  const tl = tail(B, { pts: [[0, 2.3, 2.3], [0, 2.1, 3.5], [0, 2.0, 4.6], [0, 2.3, 5.6], [0, 2.85, 6.3]], r: (t) => 0.55 * (1 - 0.8 * t) + 0.08, color: 'hide', rings: 30, seg: 12 });
  for (let k = 0; k < 6; k++) {
    const t = 0.2 + k * 0.12, c = tl.curve.getPoint(t), tg = tl.curve.getTangent(t), r = 0.55 * (1 - 0.8 * t) + 0.08;
    const up = V([0, 1, 0]).addScaledVector(tg, 0.5).normalize();
    B.add(blade(0.5 + r * 0.6, 0.18, 0.03), { pos: c.clone().add(V([0, r * 0.85, 0])).toArray(), quat: surfaceQuat([1, 0, 0], up.toArray()), color: 'fin', weights: () => tl.w(t) });
    for (const [, x] of SIDES) B.add(ell(0.06, 0.06, 0.04, 6, 4), { pos: c.clone().add(V([x * r * 0.9, 0, 0])).toArray(), mesh: 'Glow', weights: () => tl.w(t) });
  }
  const tip = V(W.TailTip), tdir = tl.curve.getTangent(1);
  for (const [s2, col] of [[1, 'fin'], [-1, 'finDeep']]) B.add(blade(1.3, 0.45, 0.04), { pos: tip.toArray(), quat: surfaceQuat([1, 0, 0], V([0, s2 * 0.9, 0]).addScaledVector(tdir, 1).toArray()), color: col, bone: 'TailTip' });
  B.add(blade(0.9, 0.12, 0.05), { pos: tip.toArray(), quat: surfaceQuat([1, 0, 0], V([0, 0.9, 0]).addScaledVector(tdir, 1).toArray()), mesh: 'Glow', bone: 'TailTip' });
  B.add(blade(0.9, 0.12, 0.05), { pos: tip.toArray(), quat: surfaceQuat([1, 0, 0], V([0, -0.9, 0]).addScaledVector(tdir, 1).toArray()), mesh: 'Glow', bone: 'TailTip' });
}

export default {
  name: 'Lumenjaw', element: 'Water', palette, glow, bones, build,
  style: { tip: 'TailTip', dur: { Idle: 3.0, Walk: 1.2, Run: 0.7, Attack: 1.2, Roar: 2.6 }, walk: [0.42, 0.6, 0.4, 0.5], bob: 1.0, roll: 0.04, sway: 1.2, tail: 1.4, headLow: -0.05 },
  spinners: [{ bone: 'Lure', axis: [0, 1, 0], speed: 2.1, bob: 0.08, bobFreq: 0.66 }, { bone: 'AbyssOrbit', axis: [0, 1, 0], speed: 1.05, bob: 0.2, bobFreq: 0.33 }],
  bg: '#0a1622', light: { bone: 'Head', color: '#38f0ff' }, outline: '#040a12', fit: { hero: 0.72, sprite: 0.72 },
  views: { hero: [-8.5, 2.6, -9.5], roar: [-8.5, 1.2, -7.5], sprite: [-10.5, 2.4, -9] },
};
