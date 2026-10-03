// Koiren (Water): a koi that swims through the air. Pearl-white body with orange-red and black
// patches and a scatter of gold scales, long flowing ribbon fins edged with glowing water,
// a big forked tail, drifting whiskers and a glowing pearl held under its chin.
// Fish rig: the body undulates head to tail; Front* = pectoral fins, Back* = pelvic fins,
// Ear* = whiskers. It hovers about 1.8 studs up.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, blend, quadBones, addEye, blade } from '../lib.js';

const palette = [
  ['white', '#f3e9da'], ['whiteShade', '#dccbb2'], ['red', '#f0552e'], ['redDeep', '#c23a1e'], ['orange', '#ff8a3a'], ['black', '#2a2a36'],
  ['fin', '#ffe2d2'], ['finDeep', '#ffb08a'], ['finRed', '#ff7a52'], ['gold', '#f6c445'], ['lip', '#ffb7a0'], ['belly', '#fffaf2'],
  ['pupil', '#0e1420'], ['mouth', '#8a2a3a'], ['nose', '#2a1a1a'], ['whisker', '#f2c8a8'],
];
const glow = { Eyes: '#bff8ff', Glow: '#6ff4ff', GlowCore: '#e6ffff' };

const Y = 1.85;
const bones = quadBones({
  hips: [Y, 0.6], spine: [Y, 0.0], chest: [Y, -0.6], neck: [Y, -1.0], head: [Y, -1.35], jaw: [Y - 0.2, -1.95],
  ear: [0.3, Y - 0.15, -1.95],
  tail: [[Y, 1.2], [Y, 1.7], [Y, 2.15], [Y, 2.55], [Y, 2.9]],
  front: { x: 0.58, upper: [Y - 0.18, -0.65], lower: [Y - 0.3, -0.45], paw: [Y - 0.42, -0.25] },
  back: { x: 0.3, upper: [Y - 0.45, 0.5], lower: [Y - 0.6, 0.65], paw: [Y - 0.72, 0.8] },
});

const STOPS = [[-1.35, 'Head'], [-1.0, 'Neck'], [-0.6, 'Chest'], [0.0, 'Spine'], [0.6, 'Hips'], [1.2, 'Tail1'], [1.7, 'Tail2'], [2.15, 'Tail3'], [2.55, 'Tail4'], [2.9, 'TailTip']];
const bodyW = (p) => blend(STOPS, p.z);
// body profile along z (head -2.0 .. tail 2.75)
const Z0 = -2.05, Z1 = 2.75;
const prof = (z) => { const t = (z - Z0) / (Z1 - Z0); return { rx: 0.62 * Math.pow(Math.sin(Math.PI * Math.min(0.999, Math.max(0.001, t * 0.92 + 0.03))), 0.75) * (1 - 0.55 * t) + 0.06, ry: 0.72 * Math.pow(Math.sin(Math.PI * Math.min(0.999, Math.max(0.001, t * 0.92 + 0.03))), 0.7) * (1 - 0.6 * t) + 0.07 }; };
const surf = (z, th, k = 1) => { const { rx, ry } = prof(z); return { p: V([Math.cos(th) * rx * k, Y + Math.sin(th) * ry * k, z]), n: V([Math.cos(th) / rx, Math.sin(th) / ry, 0]).normalize() }; };

function build(B) {
  // --- body: lofted along z, a little arched ---
  const pts = []; for (let i = 0; i <= 8; i++) { const z = Z0 + (i / 8) * (Z1 - Z0); pts.push([0, Y + 0.05 * Math.sin(Math.PI * i / 8), z]); }
  B.add(loft({ points: pts, rx: (t) => prof(Z0 + t * (Z1 - Z0)).rx, ry: (t) => prof(Z0 + t * (Z1 - Z0)).ry, rings: 40, seg: 22 }), { color: 'white', weights: bodyW });
  B.add(ell(0.5, 0.35, 1.5, 18, 10), { pos: [0, Y - 0.38, -0.3], color: 'belly', weights: bodyW });
  // koi patches: red-orange blotches on the back and a few black (sumi) spots
  const patch = (z, th, sx, sz, col, lift = 1.0) => { const s = surf(z, th, lift); B.add(ell(sx, sz, 0.05, 14, 6), { pos: s.p.toArray(), quat: surfaceQuat(s.n.toArray(), [0, 0, 1]), color: col, weights: bodyW }); };
  patch(-1.6, Math.PI / 2, 0.42, 0.36, 'red', 1.0); // the tancho crown on the head
  for (const [z, th, sx, sz, c] of [[-0.75, Math.PI / 2 + 0.35, 0.55, 0.62, 'red'], [-0.5, Math.PI / 2 - 0.5, 0.48, 0.55, 'red'], [-0.6, Math.PI / 2 - 1.15, 0.35, 0.45, 'orange'], [0.45, Math.PI / 2 - 0.15, 0.5, 0.7, 'red'], [0.4, Math.PI / 2 + 0.85, 0.4, 0.5, 'orange'], [1.35, Math.PI / 2, 0.3, 0.45, 'red'], [-0.4, Math.PI / 2 + 1.2, 0.3, 0.38, 'redDeep']]) patch(z, th, sx, sz, c);
  for (const [z, th, r] of [[-1.05, Math.PI / 2 - 0.25, 0.1], [0.05, Math.PI / 2 + 0.25, 0.11], [0.95, Math.PI / 2 - 0.45, 0.09], [1.6, Math.PI / 2 + 0.2, 0.07]]) patch(z, th, r, r * 1.2, 'black', 1.01);
  // gold scale glints in rows
  for (let row = 0; row < 3; row++) for (let k = 0; k < 7; k++) { const z = -0.9 + k * 0.32 + (row % 2) * 0.16, th = Math.PI / 2 - 0.35 - row * 0.35; for (const sx of [1, -1]) { const s = surf(z, sx > 0 ? th : Math.PI - th, 1.005); B.add(ell(0.07, 0.07, 0.02, 6, 3), { pos: s.p.toArray(), quat: surfaceQuat(s.n.toArray(), [0, 0, 1]), color: (row + k) % 3 ? 'whiteShade' : 'gold', weights: bodyW }); } }

  // --- head: blunt nose, round lips, eyes on the sides ---
  B.add(ell(0.5, 0.52, 0.55, 20, 14), { pos: [0, Y + 0.02, -1.6], color: 'white', bone: 'Head' });
  B.add(taperFront(ell(0.38, 0.36, 0.35, 16, 12), 0.25), { pos: [0, Y - 0.06, -1.98], color: 'white', bone: 'Head' });
  B.add(new THREE.TorusGeometry(0.15, 0.07, 8, 16), { pos: [0, Y - 0.12, -2.28], color: 'lip', bone: 'Head' });
  B.add(ell(0.12, 0.08, 0.05, 10, 6), { pos: [0, Y - 0.12, -2.31], color: 'mouth', bone: 'Jaw' });
  B.add(ell(0.2, 0.08, 0.18, 10, 6), { pos: [0, Y - 0.25, -2.15], color: 'lip', bone: 'Jaw' });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.37 * x, Y + 0.1, -1.82], { r: [0.17, 0.18, 0.09], pupil: [0.09, 0.1], th: -1.05 * x, lid: 'white', lidAngle: 0.5, lidTilt: 0.2 });
    // gill line
    B.add(new THREE.TorusGeometry(0.42, 0.025, 4, 16, Math.PI * 0.6), { pos: [0.08 * x, Y - 0.02, -1.25], rot: [0, x * Math.PI / 2, -Math.PI * 0.3], color: 'whiteShade', bone: 'Head' });
    // whiskers (barbels) on the Ear bones, with glowing tips
    const e = V([0.24 * x, Y - 0.18, -2.18]);
    const wp = [e, e.clone().add(V([0.25 * x, -0.15, -0.15])), e.clone().add(V([0.55 * x, -0.25, 0.05])), e.clone().add(V([0.8 * x, -0.35, 0.35]))];
    B.add(loft({ points: wp.map((v) => v.toArray()), rx: (t) => 0.035 * (1 - 0.6 * t), ry: (t) => 0.035 * (1 - 0.6 * t), rings: 10, seg: 5 }), { color: 'whisker', bone: `Ear${s}` });
    B.add(ell(0.04, 0.04, 0.04, 5, 4), { pos: wp[3].toArray(), mesh: 'Glow', bone: `Ear${s}` });
  }
  // the pearl, held under the chin in a little cradle of whisker
  B.add(ell(0.17, 0.17, 0.17, 14, 10), { pos: [0, Y - 0.5, -2.05], mesh: 'GlowCore', bone: 'Jaw' });
  B.add(new THREE.TorusGeometry(0.19, 0.025, 4, 14, Math.PI), { pos: [0, Y - 0.5, -2.05], rot: [Math.PI / 2, 0, Math.PI], color: 'gold', bone: 'Jaw' });

  // --- dorsal fin: a long ribbon of soft rays along the back with glowing edge ---
  for (let k = 0; k < 12; k++) {
    const z = -0.95 + k * 0.2, s = surf(z, Math.PI / 2, 0.97), h = 0.85 * Math.sin(Math.PI * (k + 1) / 13) + 0.25;
    const d = V([0, 1, 1.1]).normalize();
    B.add(blade(h, 0.32, 0.03), { pos: s.p.toArray(), quat: surfaceQuat([1, 0, 0], d.toArray()), color: k % 2 ? 'fin' : 'finDeep', weights: bodyW });
    B.add(ell(0.04, 0.04, 0.04, 4, 3), { pos: s.p.clone().addScaledVector(d, h * 0.95).toArray(), mesh: 'Glow', weights: bodyW });
  }

  // --- pectoral fins (Front*): long flowing fans that trail back, glowing edges ---
  for (const [s, x] of SIDES) {
    const U = V(W_[`Front${s}Upper`]);
    const fan = [['Upper', 0.0, 1.2], ['Lower', 0.35, 1.5], ['Paw', 0.7, 1.7]];
    for (const [b, a, len] of fan) {
      const dir = V([1.0 * x, -0.12 - a * 0.3, 0.35 + a * 0.8]).normalize();
      B.add(blade(len, 0.42, 0.03), { pos: U.toArray(), quat: surfaceQuat([0, 1, 0.3], dir.toArray()), color: b === 'Lower' ? 'finDeep' : 'fin', bone: `Front${s}${b}` });
      B.add(blade(len * 0.9, 0.05, 0.035), { pos: U.clone().add(V([0, -0.01, 0])).toArray(), quat: surfaceQuat([0, 1, 0.3], dir.toArray()), mesh: 'Glow', bone: `Front${s}${b}` });
    }
    // pelvic fins (Back*)
    const P = V(W_[`Back${s}Upper`]);
    B.add(blade(0.7, 0.24, 0.03), { pos: P.toArray(), quat: surfaceQuat([0, 1, 0], V([0.55 * x, -0.7, 0.6]).normalize().toArray()), color: 'finRed', bone: `Back${s}Upper` });
    // anal fin ribbons
    B.add(blade(0.55, 0.16, 0.03), { pos: [0.08 * x, Y - 0.45, 1.3], quat: surfaceQuat([1, 0, 0], [0.15 * x, -0.8, 0.7]), color: 'fin', bone: 'Tail1' });
  }

  // --- big forked tail fin: two long flowing lobes of rays with glowing edges ---
  const tip = V(W_.TailTip);
  for (const [up, col] of [[1, 'fin'], [-1, 'finDeep']]) for (let k = 0; k < 7; k++) {
    const a = (k / 6) * 0.8, dir = V([0, up * (0.2 + a), 1]).normalize(), len = 2.1 - Math.abs(k - 3) * 0.15;
    const bone = k < 2 ? 'Tail4' : 'TailTip';
    B.add(blade(len, 0.38, 0.03), { pos: tip.clone().add(V([0, 0, -0.15])).toArray(), quat: surfaceQuat([1, 0, 0], dir.toArray()), color: k % 2 ? col : 'finRed', bone });
    if (k % 2 === 0) B.add(blade(len * 0.95, 0.05, 0.04), { pos: tip.clone().add(V([0.01, 0, -0.15])).toArray(), quat: surfaceQuat([1, 0, 0], dir.toArray()), mesh: 'Glow', bone });
  }
  // little water ring trailing the tail
  B.add(new THREE.TorusGeometry(0.32, 0.03, 4, 18), { pos: tip.clone().add(V([0, 0, 0.9])).toArray(), mesh: 'Glow', bone: 'TailTip' });
  // bubbles
  for (const [x, y, z, r] of [[0.15, 0.35, -2.55, 0.08], [-0.1, 0.6, -2.7, 0.06], [0.05, 0.85, -2.6, 0.045]]) B.add(ell(r, r, r, 8, 6), { pos: [x, Y + y, z], mesh: 'Glow', bone: 'Head' });
}
let W_ = null;

export default {
  name: 'Koiren', element: 'Water', palette, glow, bones, build: (B, W) => { W_ = W; build(B); },
  style: { body: 'fish', tip: 'TailTip', dur: { Idle: 2.4, Walk: 1.2, Run: 0.7, Attack: 1.0, Roar: 2.4 }, tail: 1.0 },
  bg: '#0e1c25', light: { bone: 'Jaw', color: '#6ff4ff' }, outline: '#06121a', bloom: 0.35, fit: { hero: 0.85, roar: 0.95, sprite: 0.85 },
  views: { hero: [-8, 3.2, -7], roar: [-8, 1.5, -5], sprite: [-9, 3.0, -6] },
};
