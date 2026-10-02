// Voltgriff (Storm): griffin. Eagle head and talons, lion haunches, feathered wings,
// a lightning-bolt tail tip and crackling electric markings.
import * as THREE from 'three';
import { V, SIDES, env, ell, cone, taperFront, surfaceQuat, quatTo, loft, blend, quadBones, addLimb, addEye, blade, featherWing, bolt } from '../lib.js';

const palette = [
  ['navy', '#2b3a66'], ['navyDeep', '#1b2445'], ['plume', '#eef1f8'], ['plumeShade', '#b8c3dc'],
  ['gold', '#f4b52c'], ['goldDeep', '#c27d14'], ['indigo', '#3b3f8e'], ['feather', '#4d5bb5'],
  ['mouth', '#7a2235'], ['pupil', '#14121c'], ['white', '#ffffff'], ['claw', '#22202b'],
];
const glow = { Eyes: '#86f7ff', Glow: '#3fdcff', GlowCore: '#fbff9e' };

const bones = quadBones({
  hips: [2.4, 1.05], spine: [2.5, 0.2], chest: [2.7, -0.65], neck: [3.3, -1.1], head: [4.0, -1.5], jaw: [3.62, -2.05],
  ear: [0.42, 4.5, -1.2],
  tail: [[2.5, 1.75], [2.38, 2.55], [2.5, 3.3], [2.92, 3.95], [3.42, 4.4]],
  front: { x: 0.58, upper: [2.25, -0.7], lower: [1.2, -0.8], paw: [0.34, -0.86] },
  back: { x: 0.62, upper: [2.15, 1.1], lower: [1.15, 1.35], paw: [0.34, 1.15] },
  wing: { upper: [0.5, 3.1, -0.45], lower: [1.55, 3.95, -0.15], tip: [2.45, 4.85, 0.15] },
});

function build(B, W) {
  // --- torso ---
  const torsoPts = [[0, 2.45, 1.95], [0, 2.45, 1.15], [0, 2.55, 0.2], [0, 2.7, -0.6], [0, 2.85, -1.2]];
  const tRx = (t) => (0.62 + 0.16 * t) * env(t), tRy = (t) => (0.62 + 0.2 * t) * env(t);
  const torsoW = (p) => blend([[-0.65, 'Chest'], [0.2, 'Spine'], [1.05, 'Hips']], p.z);
  B.add(loft({ points: torsoPts, rx: tRx, ry: tRy, rings: 24, seg: 18 }), { color: 'navy', weights: torsoW });
  B.add(ell(0.5, 0.36, 0.95), { pos: [0, 2.12, 0.35], color: 'plumeShade', weights: torsoW });
  // feathered eagle front: chest mass + overlapping breast feathers
  const chestW = (p) => blend([[2.6, 'Chest'], [3.3, 'Neck']], p.y);
  B.add(ell(0.8, 0.82, 0.72), { pos: [0, 2.78, -0.95], color: 'plume', weights: chestW });
  for (let row = 0; row < 3; row++) for (let i = 0; i < 5; i++) {
    const a = (i - 2) * 0.38, y = 3.15 - row * 0.32, r = 0.78 - row * 0.02;
    const p = [Math.sin(a) * r * 0.95, y, -0.95 - Math.cos(a) * r * 0.9];
    const n = [Math.sin(a), 0.1, -Math.cos(a)];
    B.add(blade(0.55, 0.2, 0.05), { pos: p, quat: surfaceQuat(n, [Math.sin(a) * 0.2, -1, -0.25]), color: row % 2 ? 'plumeShade' : 'plume', weights: chestW });
  }

  // --- neck + feather ruff ---
  const neckW = (p) => blend([[2.95, 'Chest'], [3.35, 'Neck'], [3.85, 'Head']], p.y);
  B.add(loft({ points: [[0, 2.85, -0.8], [0, 3.4, -1.15], [0, 4.05, -1.42]], rx: (t) => 0.55 * env(0.15 + 0.7 * t) + 0.03, ry: (t) => 0.53 * env(0.15 + 0.7 * t) + 0.03, rings: 12, seg: 16 }), { color: 'plume', weights: neckW });
  for (let i = 0; i < 9; i++) {
    const a = -2.2 + (i / 8) * 4.4;
    const n = [Math.sin(a), Math.cos(a) * 0.8, 0.35];
    const p = [Math.sin(a) * 0.55, 3.45 + Math.cos(a) * 0.45, -1.05];
    B.add(blade(0.75, 0.22, 0.05), { pos: p, quat: surfaceQuat(n, [Math.sin(a) * 0.5, -0.4 + Math.cos(a) * 0.2, 1]), color: i % 2 ? 'plumeShade' : 'plume', weights: neckW });
  }

  // --- head: white eagle head with a storm-blue cap ---
  B.add(ell(0.86, 0.8, 0.86, 20, 14), { pos: [0, 4.0, -1.5], color: 'plume', bone: 'Head' });
  B.add(ell(0.8, 0.42, 0.82, 20, 12), { pos: [0, 4.42, -1.42], rot: [0.2, 0, 0], color: 'navy', bone: 'Head' });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.38 * x, 4.04, -2.2], { r: [0.25, 0.28, 0.14], pupil: [0.09, 0.12], lid: 'navy', lidAngle: 0.85, brow: { color: 'navyDeep', len: 0.32, tilt: 0.45 } });
    // cheek feathers
    B.add(blade(0.6, 0.2, 0.05), { pos: [0.72 * x, 3.75, -1.6], quat: surfaceQuat([x, 0, 0.2], [x * 0.4, -0.5, 1]), color: 'plumeShade', bone: 'Head' });
    // ear tufts with sparking tips
    const base = V(W[`Ear${s}`]), d = V([0.45 * x, 0.75, 0.6]).normalize();
    B.add(blade(0.95, 0.24, 0.06), { pos: base.toArray(), quat: surfaceQuat([x, 0.2, -0.3], d.toArray()), color: 'navy', bone: `Ear${s}` });
    B.add(blade(0.7, 0.18, 0.06), { pos: base.clone().add(V([0.05 * x, -0.12, 0.05])).toArray(), quat: surfaceQuat([x, 0.2, -0.3], V([0.6 * x, 0.45, 0.8]).normalize().toArray()), color: 'feather', bone: `Ear${s}` });
    B.add(blade(0.2, 0.075, 0.065), { pos: base.clone().addScaledVector(d, 0.82).toArray(), quat: surfaceQuat([x, 0.2, -0.3], d.toArray()), mesh: 'Glow', bone: `Ear${s}` });
  }
  // crest feathers
  [[0, 0.75, 1.25], [-0.22, 0.55, 0.95], [0.22, 0.55, 0.95]].forEach(([x, up, len]) => {
    const p = [x, 4.82, -1.45], d = V([x * 0.8, up, 1]).normalize();
    B.add(blade(len, 0.2, 0.06), { pos: p, quat: surfaceQuat([0, 1, -0.3], d.toArray()), color: 'navyDeep', bone: 'Head' });
    B.add(blade(len * 0.22, 0.075, 0.065), { pos: V(p).addScaledVector(d, len * 0.76).toArray(), quat: surfaceQuat([0, 1, -0.3], d.toArray()), mesh: 'Glow', bone: 'Head' });
  });
  // hooked beak
  B.add(ell(0.4, 0.15, 0.24), { pos: [0, 3.98, -2.14], color: 'goldDeep', bone: 'Head' });
  B.add(taperFront(ell(0.36, 0.3, 0.64, 18, 12), 0.6), { pos: [0, 3.8, -2.45], color: 'gold', bone: 'Head' });
  B.add(cone(0.13, 0.42, 10), { pos: [0, 3.6, -2.98], quat: quatTo([0, -1, 0.45]), color: 'gold', bone: 'Head' });
  B.add(taperFront(ell(0.28, 0.13, 0.5), 0.5), { pos: [0, 3.5, -2.4], color: 'goldDeep', bone: 'Jaw' });
  B.add(taperFront(ell(0.22, 0.05, 0.4, 12, 8), 0.5), { pos: [0, 3.6, -2.38], color: 'mouth', bone: 'Jaw' });

  // --- legs ---
  for (const [s, x] of SIDES) {
    // eagle front leg: feathered thigh, golden scaled shin, talons
    addLimb(B, 'Front', s, [[0.55 * x, 2.7, -0.62], [0.58 * x, 2.0, -0.72], [0.58 * x, 1.35, -0.8], [0.58 * x, 1.0, -0.82]], 0.46, 0.3, 'plume', [0.3, 0.6, 1.1, 1.5]);
    for (const [y, rr, n, len, col, bone] of [[1.85, 0.38, 5, 0.6, 'plume', 'Upper'], [1.3, 0.3, 4, 0.5, 'plumeShade', 'Lower']]) {
      for (let i = 0; i < n; i++) {
        const a = (i - (n - 1) / 2) * 0.5 + (y > 1.5 ? 0.25 : 0);
        B.add(blade(len, 0.17, 0.05), { pos: [0.58 * x + Math.sin(a) * rr, y, -0.78 - Math.cos(a) * rr], quat: surfaceQuat([Math.sin(a), 0, -Math.cos(a)], [Math.sin(a) * 0.15, -1, -0.12]), color: (i % 2 && col === 'plume') ? 'plumeShade' : col, bone: `Front${s}${bone}` });
      }
    }
    addLimb(B, 'Front', s, [[0.58 * x, 1.3, -0.82], [0.58 * x, 0.8, -0.85], [0.58 * x, 0.25, -0.87]], 0.17, 0.13, 'gold', [0.3, 0.5, 1.0, 1.5], 1);
    for (const a of [-0.45, 0, 0.45, Math.PI]) {
      const d = V([Math.sin(a), -0.15, -Math.cos(a)]).normalize(), len = a === Math.PI ? 0.3 : 0.5;
      const base = V([0.58 * x, 0.14, -0.88]), tip = base.clone().addScaledVector(d, len);
      B.add(loft({ points: [base.toArray(), base.clone().lerp(tip, 0.5).add(V([0, 0.04, 0])).toArray(), tip.toArray()], rx: () => 0.085, ry: () => 0.08, rings: 5, seg: 7 }), { color: 'gold', bone: `Front${s}Paw` });
      B.add(cone(0.06, 0.26, 7), { pos: tip.clone().addScaledVector(d, 0.08).add(V([0, -0.05, 0])).toArray(), quat: quatTo([d.x, -0.7, d.z]), color: 'claw', bone: `Front${s}Paw` });
    }
    // lion hind leg
    B.add(ell(0.48, 0.66, 0.6), { pos: [0.58 * x, 1.95, 1.18], color: 'navy', bone: `Back${s}Upper` });
    addLimb(B, 'Back', s, [[0.62 * x, 2.25, 1.0], [0.62 * x, 1.65, 1.25], [0.62 * x, 1.15, 1.36], [0.62 * x, 0.6, 1.24], [0.62 * x, 0.16, 1.12]], 0.44, 0.25, 'navy', [0.34, 0.55, 1.0, 1.35]);
    B.add(ell(0.34, 0.21, 0.45), { pos: [0.63 * x, 0.2, 1.0], color: 'navyDeep', bone: `Back${s}Paw` });
    for (const dx of [-0.15, 0, 0.15]) B.add(ell(0.12, 0.11, 0.12, 10, 8), { pos: [0.63 * x + dx, 0.14, 0.66], color: 'navyDeep', bone: `Back${s}Paw` });
  }

  // --- tail: lion tail ending in a feather tuft and a lightning bolt ---
  const tailPts = [[0, 2.5, 1.8], [0, 2.36, 2.55], [0, 2.5, 3.3], [0, 2.92, 3.95], [0, 3.42, 4.4]];
  const tailStops = [[0, 'Tail1'], [0.33, 'Tail2'], [0.66, 'Tail3'], [0.95, 'Tail4']];
  const tg = loft({ points: tailPts, rx: (t) => 0.17 - 0.06 * t, ry: (t) => 0.17 - 0.06 * t, rings: 22, seg: 10 });
  const tT = tg.userData.t;
  B.add(tg, { color: 'navy', weights: (p, i) => tT[i] < 0.06 ? blend([[0, 'Hips'], [0.06, 'Tail1']], tT[i]) : blend(tailStops, tT[i]) });
  const tip = V(W.TailTip), tc = tg.userData.curve, tan = tc.getTangent(1);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2, d = tan.clone().add(V([Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0])).normalize();
    B.add(blade(0.7, 0.2, 0.05), { pos: tc.getPoint(0.94).toArray(), quat: surfaceQuat([Math.cos(a), Math.sin(a), 0.1], d.toArray()), color: i % 2 ? 'indigo' : 'navyDeep', bone: 'Tail4' });
  }
  B.add(bolt(1.7, 0.62, 0.12), { pos: [tip.x, tip.y + 0.05, tip.z + 0.1], quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.35, Math.PI / 2, 0)), mesh: 'Glow', bone: 'TailTip' });
  B.add(bolt(1.3, 0.36, 0.2), { pos: [tip.x, tip.y + 0.22, tip.z + 0.14], quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.35, Math.PI / 2, 0)), mesh: 'GlowCore', bone: 'TailTip' });

  // --- crackling markings on haunches and shoulders ---
  const tCurve = new THREE.CatmullRomCurve3(torsoPts.map(V));
  const mark = (t, th, x, len, rotZ) => {
    const c = tCurve.getPoint(t), n = [Math.cos(th) * x, Math.sin(th), 0];
    const p = [Math.cos(th) * tRx(t) * 0.99 * x, c.y + Math.sin(th) * tRy(t) * 0.99, c.z];
    B.add(bolt(len, len * 0.35, 0.05), { pos: p, quat: surfaceQuat(n, [0, Math.cos(rotZ), Math.sin(rotZ)]), mesh: 'Glow', weights: torsoW });
  };
  for (const [, x] of SIDES) { mark(0.16, 0.65, x, 0.75, 0.6); mark(0.3, 0.8, x, 0.55, 0.9); mark(0.5, 0.95, x, 0.45, 1.2); }

  // --- feathered wings ---
  for (const [, x] of SIDES) featherWing(B, W, x, { arm: 'navy', covert: 'plume', primary: 'feather', primary2: 'indigo', tipMesh: 'Glow', count: 10 });
}

export default {
  name: 'Voltgriff', element: 'Storm', palette, glow, bones, build,
  style: { tip: 'TailTip', wings: true, tail: 1.2 },
  bg: '#161c2c', light: { bone: 'TailTip', color: '#5fd8ff' }, outline: '#0c1020',
  views: { hero: [-9.6, 3.2, -6.8], roar: [-9, 1.2, -5.5], sprite: [-10.5, 2.2, -6.5] },
};
