// Boltaroo (Storm): an upright kangaroo boxer. Tan fur, cream belly with a pouch that holds a
// glowing battery, a red sweatband with a lightning bolt, huge ears, blue boxing gloves
// crackling with yellow bolts, big springy feet and a thick tail with a bolt tip. Hops.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, blend, quadBones, addEye, bolt } from '../lib.js';
import { tail } from '../kit.js';

const palette = [
  ['fur', '#dca560'], ['furDeep', '#a8733a'], ['furLight', '#f2c98a'], ['belly', '#fff0d6'], ['glove', '#3a6fd8'], ['gloveDeep', '#244aa0'],
  ['cuff', '#f4f4ff'], ['band', '#e8473a'], ['bandDeep', '#b02a24'], ['battery', '#3a3f4a'], ['nose', '#2a1a12'], ['mouth', '#8a2a3a'],
  ['pupil', '#14121c'], ['white', '#ffffff'], ['innerEar', '#f5a07a'], ['claw', '#3a2a20'],
];
const glow = { Eyes: '#bff6ff', Glow: '#ffe14a', GlowCore: '#ffffff' };

const bones = quadBones({
  hips: [2.0, 0.3], spine: [2.65, 0.15], chest: [3.3, -0.05], neck: [3.85, -0.2], head: [4.25, -0.35], jaw: [3.95, -0.8],
  ear: [0.32, 4.95, -0.25],
  tail: [[1.75, 0.7], [1.25, 1.25], [0.8, 1.75], [0.45, 2.25], [0.3, 2.75]],
  // arms: shoulder, elbow down and back, glove up in front of the chest (a boxing guard)
  front: { x: 0.62, upper: [3.4, -0.2], lower: [2.75, -0.3], paw: [3.05, -0.95] },
  // legs: big thigh, shin angled back, long feet pointing forward
  back: { x: 0.55, upper: [1.85, 0.3], lower: [1.0, 0.05], paw: [0.3, 0.5] },
});

function build(B, W) {
  // --- upright pear-shaped body ---
  const bodyW = (p) => blend([[1.9, 'Hips'], [2.6, 'Spine'], [3.25, 'Chest']], p.y);
  B.add(loft({ points: [[0, 1.45, 0.38], [0, 2.0, 0.3], [0, 2.65, 0.12], [0, 3.3, -0.05], [0, 3.8, -0.15]], rx: (t) => 0.82 - 0.35 * t, ry: (t) => 0.72 - 0.3 * t, rings: 24, seg: 18 }), { color: 'fur', weights: bodyW });
  B.add(ell(0.6, 0.95, 0.42, 18, 12), { pos: [0, 2.35, -0.25], color: 'belly', weights: bodyW });
  // pouch with a glowing battery peeking out
  const pouch = new THREE.SphereGeometry(0.42, 16, 8, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65); pouch.scale(1.1, 0.85, 0.7);
  B.add(pouch, { pos: [0, 2.05, -0.5], color: 'furLight', weights: bodyW });
  B.add(new THREE.TorusGeometry(0.42, 0.05, 5, 16), { pos: [0, 2.18, -0.52], rot: [Math.PI / 2 + 0.25, 0, 0], scale: [1.1, 0.7, 1], color: 'furDeep', weights: bodyW });
  B.add(new THREE.CylinderGeometry(0.16, 0.16, 0.42, 10), { pos: [0.05, 2.35, -0.52], rot: [0.2, 0, -0.25], color: 'battery', weights: bodyW });
  B.add(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 10), { pos: [0.1, 2.52, -0.56], rot: [0.2, 0, -0.25], mesh: 'Glow', weights: bodyW });
  B.add(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 6), { pos: [0.12, 2.6, -0.58], rot: [0.2, 0, -0.25], color: 'cuff', weights: bodyW });
  // chest tuft
  for (let k = 0; k < 4; k++) B.add(cone(0.12, 0.34, 6), { pos: [(k - 1.5) * 0.14, 3.35, -0.62], quat: quatTo([(k - 1.5) * 0.3, -1, -0.6]), color: 'belly', weights: bodyW });
  // neck
  const neckW = (p) => blend([[3.5, 'Chest'], [3.85, 'Neck'], [4.15, 'Head']], p.y);
  B.add(loft({ points: [[0, 3.55, -0.1], [0, 3.85, -0.2], [0, 4.15, -0.3]], rx: () => 0.36, ry: () => 0.34, rings: 6, seg: 12 }), { color: 'fur', weights: neckW });

  // --- head: long muzzle, big ears, sweatband ---
  B.add(ell(0.5, 0.48, 0.55, 20, 14), { pos: [0, 4.35, -0.4], color: 'fur', bone: 'Head' });
  B.add(taperFront(ell(0.3, 0.26, 0.52, 16, 12), 0.3), { pos: [0, 4.18, -0.9], color: 'furLight', bone: 'Head' });
  B.add(ell(0.12, 0.09, 0.08, 10, 6), { pos: [0, 4.28, -1.4], color: 'nose', bone: 'Head' });
  B.add(taperFront(ell(0.22, 0.09, 0.4), 0.3), { pos: [0, 3.98, -0.9], color: 'belly', bone: 'Jaw' });
  B.add(taperFront(ell(0.17, 0.04, 0.34, 12, 6), 0.3), { pos: [0, 4.05, -0.92], color: 'mouth', bone: 'Jaw' });
  // confident grin: a little tooth
  B.add(new THREE.BoxGeometry(0.08, 0.07, 0.04), { pos: [0.06, 4.06, -1.12], color: 'white', bone: 'Head' });
  // sweatband with a glowing bolt
  B.add(new THREE.TorusGeometry(0.5, 0.09, 6, 24), { pos: [0, 4.62, -0.38], rot: [Math.PI / 2 - 0.25, 0, 0], color: 'band', bone: 'Head' });
  B.add(bolt(0.26, 0.15, 0.05), { pos: [0, 4.6, -0.9], quat: surfaceQuat([0, 0.2, -1], [0, 1, 0]), mesh: 'Glow', bone: 'Head' });
  for (const k of [0, 1]) B.add(loft({ points: [[0.05, 4.62, 0.1], [0.15 + k * 0.1, 4.45, 0.4], [0.25 + k * 0.15, 4.2 - k * 0.1, 0.55]], rx: () => 0.08, ry: () => 0.025, rings: 6, seg: 6 }), { color: k ? 'bandDeep' : 'band', bone: 'Head' });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.24 * x, 4.45, -0.85], { r: [0.14, 0.17, 0.08], pupil: [0.07, 0.11], th: -0.45 * x, lid: 'furDeep', lidAngle: 0.85, lidTilt: 0.45, brow: { color: 'furDeep', len: 0.16, tilt: 0.55 } });
    const e = V(W[`Ear${s}`]), d = V([0.25 * x, 1, 0.25]).normalize();
    B.add(cone(0.24, 1.1, 12, 0.45), { pos: e.clone().addScaledVector(d, 0.5).toArray(), quat: quatTo(d.toArray()), color: 'fur', bone: `Ear${s}` });
    B.add(cone(0.15, 0.8, 10, 0.25), { pos: e.clone().addScaledVector(d, 0.45).add(V([0, 0, -0.07])).toArray(), quat: quatTo(d.toArray()), color: 'innerEar', bone: `Ear${s}` });
    B.add(ell(0.1, 0.06, 0.04, 8, 5), { pos: [0.42 * x, 4.1, -0.75], color: 'innerEar', bone: 'Head' }); // cheek blush
  }

  // --- arms in a boxing guard, huge gloves crackling with bolts ---
  for (const [s, x] of SIDES) {
    const U = V(W[`Front${s}Upper`]), L = V(W[`Front${s}Lower`]), P = V(W[`Front${s}Paw`]);
    B.add(ell(0.28, 0.3, 0.3, 12, 10), { pos: U.toArray(), color: 'fur', bone: `Front${s}Upper` });
    B.add(loft({ points: [U.toArray(), U.clone().lerp(L, 0.5).toArray(), L.toArray()], rx: () => 0.17, ry: () => 0.17, rings: 6, seg: 10 }), { color: 'fur', bone: `Front${s}Upper` });
    B.add(loft({ points: [L.toArray(), L.clone().lerp(P, 0.5).toArray(), P.clone().add(V([0, -0.1, 0.15])).toArray()], rx: () => 0.15, ry: () => 0.15, rings: 6, seg: 10 }), { color: 'fur', bone: `Front${s}Lower` });
    const G = P.clone();
    B.add(new THREE.CylinderGeometry(0.22, 0.24, 0.24, 14), { pos: G.clone().add(V([0, -0.2, 0.25])).toArray(), rot: [-0.6, 0, 0], color: 'cuff', bone: `Front${s}Paw` });
    B.add(ell(0.36, 0.38, 0.42, 18, 14), { pos: G.toArray(), color: 'glove', bone: `Front${s}Paw` });
    B.add(ell(0.16, 0.2, 0.2, 10, 8), { pos: G.clone().add(V([-0.28 * x, 0.08, -0.05])).toArray(), color: 'gloveDeep', bone: `Front${s}Paw` }); // thumb
    B.add(new THREE.TorusGeometry(0.33, 0.035, 4, 18), { pos: G.clone().add(V([0, 0.05, 0])).toArray(), rot: [0, Math.PI / 2, 0], color: 'gloveDeep', bone: `Front${s}Paw` });
    B.add(bolt(0.36, 0.2, 0.05), { pos: G.clone().add(V([0.36 * x, 0, -0.02])).toArray(), quat: surfaceQuat([x, 0, -0.2], [0, 1, 0]), mesh: 'Glow', bone: `Front${s}Paw` });
    for (let k = 0; k < 1; k++) { const a = k * 2.1 + (x > 0 ? 0.5 : 0); B.add(bolt(0.22, 0.1, 0.03), { pos: G.clone().add(V([Math.cos(a) * 0.45, 0.25 + Math.sin(a) * 0.1, Math.sin(a) * 0.3 - 0.1])).toArray(), quat: surfaceQuat([Math.cos(a), 0.3, Math.sin(a)], [0.3, 1, 0]), mesh: 'Glow', bone: `Front${s}Paw` }); }
  }

  // --- legs: muscular thighs, shins angled back, long springy feet ---
  for (const [s, x] of SIDES) {
    const U = V(W[`Back${s}Upper`]), L = V(W[`Back${s}Lower`]), P = V(W[`Back${s}Paw`]);
    B.add(ell(0.5, 0.65, 0.62, 16, 12), { pos: U.clone().add(V([0.05 * x, 0.05, -0.1])).toArray(), color: 'fur', bone: `Back${s}Upper` });
    B.add(loft({ points: [U.clone().add(V([0, -0.2, -0.1])).toArray(), U.clone().lerp(L, 0.55).toArray(), L.toArray()], rx: () => 0.3, ry: () => 0.3, rings: 6, seg: 10 }), { color: 'fur', bone: `Back${s}Upper` });
    B.add(loft({ points: [L.toArray(), L.clone().lerp(P, 0.5).toArray(), P.toArray()], rx: (t) => 0.22 - 0.06 * t, ry: (t) => 0.22 - 0.06 * t, rings: 6, seg: 10 }), { color: 'furDeep', bone: `Back${s}Lower` });
    // long foot reaching forward + toes
    B.add(ell(0.22, 0.15, 0.7, 12, 8), { pos: [P.x, 0.17, P.z - 0.5], color: 'furDeep', bone: `Back${s}Paw` });
    for (const dx of [-0.1, 0.1]) B.add(cone(0.05, 0.18, 5), { pos: [P.x + dx, 0.1, P.z - 1.18], quat: quatTo([0, -0.3, -1]), color: 'claw', bone: `Back${s}Paw` });
    B.add(new THREE.TorusGeometry(0.2, 0.05, 4, 12), { pos: [P.x, 0.4, P.z - 0.05], rot: [Math.PI / 2, 0, 0], color: 'band', bone: `Back${s}Paw` }); // ankle wraps
  }

  // --- thick tail with a bolt tip ---
  const tl = tail(B, { pts: [[0, 1.75, 0.6], [0, 1.25, 1.25], [0, 0.8, 1.75], [0, 0.45, 2.25], [0, 0.3, 2.75]], r: (t) => 0.42 * (1 - 0.75 * t) + 0.06, color: 'fur', rings: 22, seg: 12 });
  for (const t of [0.3, 0.55]) { const c = tl.curve.getPoint(t); B.add(bolt(0.4, 0.18, 0.04), { pos: c.clone().add(V([0, 0.42 * (1 - 0.75 * t) + 0.04, 0])).toArray(), quat: surfaceQuat([0, 1, 0], tl.curve.getTangent(t).toArray()), mesh: 'Glow', weights: () => tl.w(t) }); }
  const tip = V(W.TailTip);
  B.add(bolt(0.55, 0.28, 0.07), { pos: tip.clone().add(V([0, 0.05, 0.1])).toArray(), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.9, Math.PI / 2, 0)), mesh: 'GlowCore', bone: 'TailTip' });
}

export default {
  name: 'Boltaroo', element: 'Storm', palette, glow, bones, build,
  style: { body: 'biped', hop: 0.45, attack: 'punch', guard: true, tip: 'TailTip', dur: { Idle: 2.0, Walk: 0.7, Run: 0.45, Attack: 0.8, Roar: 2.2 }, bob: 1.2, tail: 0.6, armSwing: 0.15, sway: 0.6 },
  bg: '#161c2c', light: { bone: 'Chest', color: '#ffe14a' }, outline: '#0c1020', fit: { hero: 0.92, roar: 0.95, sprite: 0.86 }, bloom: 0.45,
  views: { hero: [-8, 2.0, -8], roar: [-7.5, 0.8, -6.5], sprite: [-9, 1.6, -8] },
};
