// Mossback (Nature): stout boar. Bark-brown hide, mossy stone plates down its back,
// leafy ears and mane, upturned tusks and glowing spore flowers.
import * as THREE from 'three';
import { V, SIDES, env, ell, cone, surfaceQuat, quatTo, loft, blend, quadBones, addLimb, addEye, blade, rock, shortenLegs } from '../lib.js';

const palette = [
  ['bark', '#6b4a33'], ['barkDeep', '#45301f'], ['barkLight', '#8c6648'], ['snout', '#5e3f2e'],
  ['moss', '#5f9a3c'], ['mossDeep', '#3b6a2a'], ['leaf', '#7ab83c'], ['stone', '#8b8e8c'],
  ['stoneDeep', '#5f6466'], ['hoof', '#2e231c'], ['tusk', '#efe6cf'], ['nose', '#3a2420'],
  ['pupil', '#14100c'], ['white', '#ffffff'], ['mouth', '#7a2a2a'],
];
const glow = { Eyes: '#c2ff63', Glow: '#a8ff4f', GlowCore: '#fff7a0' };

const bones = quadBones({
  hips: [1.95, 1.1], spine: [2.12, 0.15], chest: [2.2, -0.75], neck: [2.25, -1.3], head: [2.2, -1.75], jaw: [1.82, -2.2],
  ear: [0.62, 2.95, -1.4],
  tail: [[2.15, 1.85], [2.25, 2.08], [2.38, 2.22], [2.5, 2.28], [2.6, 2.3]],
  front: { x: 0.62, upper: [1.75, -0.8], lower: [0.95, -0.85], paw: [0.3, -0.88] },
  back: { x: 0.64, upper: [1.7, 1.1], lower: [0.95, 1.2], paw: [0.3, 1.1] },
});

function flower(B, center, n, weights) {
  const up = V(n).normalize();
  const side = new THREE.Vector3(1, 0, 0).cross(up).normalize();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const d = side.clone().applyAxisAngle(up, a).addScaledVector(up, 0.35).normalize();
    B.add(blade(0.26, 0.13, 0.04), { pos: center.toArray(), quat: surfaceQuat(up.toArray(), d.toArray()), mesh: 'Glow', weights });
  }
  B.add(ell(0.09, 0.07, 0.09, 8, 6), { pos: center.clone().addScaledVector(up, 0.05).toArray(), mesh: 'GlowCore', weights });
}

function build(B, W) {
  // --- barrel torso ---
  const torsoPts = [[0, 2.0, 1.85], [0, 2.05, 1.1], [0, 2.15, 0.2], [0, 2.25, -0.6], [0, 2.2, -1.25]];
  const tRx = (t) => (0.85 + 0.1 * t) * env(t), tRy = (t) => (0.8 + 0.12 * t) * env(t);
  const torsoW = (p) => blend([[-0.75, 'Chest'], [0.15, 'Spine'], [1.1, 'Hips']], p.z);
  B.add(loft({ points: torsoPts, rx: tRx, ry: tRy, rings: 34, seg: 22 }), { color: 'bark', weights: torsoW });
  B.add(ell(0.62, 0.45, 1.1), { pos: [0, 1.58, 0.2], color: 'barkLight', weights: torsoW });
  const tCurve = new THREE.CatmullRomCurve3(torsoPts.map(V));

  // --- mossy stone plates down the back ---
  const plates = [[0.18, 0, 0.48], [0.32, 0.55, 0.42], [0.32, -0.55, 0.42], [0.46, 0, 0.55], [0.6, 0.5, 0.45], [0.6, -0.5, 0.45], [0.74, 0, 0.5], [0.86, 0, 0.38]];
  plates.forEach(([t, dx, r], k) => {
    const c = tCurve.getPoint(t), th = Math.PI / 2 - dx;
    const n = V([Math.cos(th), Math.sin(th), 0]);
    r *= 1.25;
    const base = V([Math.cos(th) * tRx(t) * 0.9, c.y + Math.sin(th) * tRy(t) * 0.9, c.z]);
    B.add(rock(r, k + 3, 0.6), { pos: base.toArray(), quat: surfaceQuat(n.toArray(), [0, 0, 1]).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, k, 0))), color: k % 2 ? 'stoneDeep' : 'stone', weights: torsoW });
    const top = base.clone().addScaledVector(n, r * 0.42);
    B.add(ell(r * 0.85, 0.12, r * 0.8, 12, 6), { pos: top.toArray(), quat: surfaceQuat(n.toArray(), [1, 0, 0]).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))), color: k % 3 ? 'moss' : 'mossDeep', weights: torsoW });
    if (k % 3 === 0) {
      for (const a of [0.4, 2.5]) {
        const d = n.clone().add(V([Math.cos(a + k) * 0.8, 0, Math.sin(a + k) * 0.8])).normalize();
        B.add(blade(0.45, 0.18, 0.04), { pos: top.toArray(), quat: surfaceQuat(V([Math.sin(a + k), 0, -Math.cos(a + k)]).toArray(), d.toArray()), color: 'leaf', weights: torsoW });
      }
    }
    if (k === 1 || k === 4 || k === 6) flower(B, top.clone().addScaledVector(n, 0.08), n.toArray(), torsoW);
  });
  // spore glints on the moss
  [[0.25, 0.3], [0.4, -0.3], [0.55, 0.25], [0.68, -0.2], [0.8, 0.3]].forEach(([t, dx]) => {
    const c = tCurve.getPoint(t), th = Math.PI / 2 - dx;
    B.add(ell(0.05, 0.05, 0.05, 6, 4), { pos: [Math.cos(th) * tRx(t) * 1.02, c.y + Math.sin(th) * tRy(t) * 1.02, c.z], mesh: 'GlowCore', weights: torsoW });
  });

  // --- neck + leafy mane ---
  const neckW = (p) => blend([[0.9, 'Chest'], [1.3, 'Neck'], [1.65, 'Head']], -p.z);
  B.add(loft({ points: [[0, 2.15, -0.9], [0, 2.25, -1.3], [0, 2.25, -1.7]], rx: () => 0.72, ry: () => 0.68, rings: 10, seg: 18 }), { color: 'bark', weights: neckW });
  for (let i = 0; i < 9; i++) {
    const z = -0.75 - i * 0.13;
    for (const dx of [-0.13, 0, 0.13]) {
      const d = V([dx * 2.2, 1, 0.55 + 0.1 * Math.sin(i * 2.3 + dx * 9)]).normalize();
      B.add(cone(0.09, 0.55 - Math.abs(dx) * 1.2 + 0.08 * Math.sin(i * 1.7), 6), { pos: [dx, 2.8 - Math.abs(dx) * 0.4, z], quat: quatTo(d.toArray()), color: (i + (dx > 0 ? 1 : 0)) % 3 ? 'barkDeep' : 'hoof', weights: neckW });
    }
  }
  for (let i = 0; i < 3; i++) {
    const z = -0.95 - i * 0.35, d = V([((i % 2) * 2 - 1) * 0.5, 1, 0.7]).normalize();
    B.add(blade(0.6, 0.2, 0.05), { pos: [0, 2.9, z], quat: surfaceQuat([1, 0, 0], d.toArray()), color: i % 2 ? 'leaf' : 'moss', weights: neckW });
  }

  // --- head ---
  B.add(ell(0.86, 0.75, 0.9, 24, 18), { pos: [0, 2.25, -1.85], color: 'bark', bone: 'Head' });
  B.add(ell(0.42, 0.36, 0.7, 20, 14), { pos: [0, 2.5, -2.2], quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.45, 0, 0)), color: 'bark', bone: 'Head' });
  const snout = new THREE.CylinderGeometry(0.31, 0.42, 0.42, 18, 2); snout.rotateX(Math.PI / 2);
  B.add(snout, { pos: [0, 2.02, -2.62], color: 'barkDeep', bone: 'Head' });
  B.add(ell(0.27, 0.22, 0.06, 18, 8), { pos: [0, 2.02, -2.84], color: 'snout', bone: 'Head' });
  // mossy cap with a sprout
  B.add(ell(0.62, 0.24, 0.62, 16, 10), { pos: [0, 2.9, -1.7], color: 'moss', bone: 'Head' });
  for (const a of [0.6, 2.6]) B.add(blade(0.5, 0.2, 0.04), { pos: [0, 3.05, -1.7], quat: surfaceQuat([Math.sin(a), 0, -Math.cos(a)], [Math.cos(a) * 0.6, 1, Math.sin(a) * 0.6]), color: 'leaf', bone: 'Head' });
  flower(B, V([0.22, 3.1, -1.95]), [0.2, 1, -0.3], () => [['Head', 1]]);
  B.add(ell(0.55, 0.32, 0.4), { pos: [0, 1.75, -2.2], color: 'barkDeep', bone: 'Jaw' });
  B.add(ell(0.5, 0.16, 0.5), { pos: [0, 1.68, -2.35], color: 'barkLight', bone: 'Jaw' });
  B.add(ell(0.4, 0.06, 0.4, 12, 6), { pos: [0, 1.8, -2.35], color: 'mouth', bone: 'Jaw' });
  for (const [s, x] of SIDES) {
    B.add(ell(0.06, 0.09, 0.05, 8, 6), { pos: [0.11 * x, 2.02, -2.89], color: 'nose', bone: 'Head' });
    addEye(B, x, [0.5 * x, 2.62, -2.36], { r: [0.19, 0.2, 0.11], pupil: [0.06, 0.07], th: -0.55 * x, lid: 'barkDeep', lidAngle: 0.85, brow: { color: 'mossDeep', len: 0.26, tilt: 0.5 } });
    // upturned tusks
    const tp = [[0.34 * x, 1.9, -2.5], [0.58 * x, 1.86, -2.8], [0.74 * x, 2.18, -2.98], [0.76 * x, 2.5, -2.96], [0.7 * x, 2.7, -2.88]];
    B.add(loft({ points: tp, rx: (t) => 0.15 * (1 - 0.85 * t) + 0.015, ry: (t) => 0.15 * (1 - 0.85 * t) + 0.015, rings: 16, seg: 10 }), { color: 'tusk', bone: 'Head' });
    // leaf ears
    const e = V(W[`Ear${s}`]), ed = V([0.75 * x, 0.6, 0.35]).normalize();
    B.add(blade(1.1, 0.4, 0.06), { pos: e.toArray(), quat: surfaceQuat([0.3 * x, 0.3, -1], ed.toArray()), color: 'leaf', bone: `Ear${s}` });
    B.add(blade(0.92, 0.04, 0.075), { pos: e.toArray(), quat: surfaceQuat([0.3 * x, 0.3, -1], ed.toArray()), color: 'mossDeep', bone: `Ear${s}` });
    // bristly cheeks and a shaggy shoulder
    for (const z of [-0.55, -0.25, 0.05]) B.add(cone(0.2, 0.55, 7), { pos: [0.82 * x, 2.3 - z * 0.2, z], quat: quatTo([x, -0.5, 0.35]), color: 'barkDeep', weights: torsoW });
    B.add(cone(0.24, 0.6, 7), { pos: [0.78 * x, 2.0, -1.75], quat: quatTo([x, -0.4, 0.5]), color: 'barkDeep', bone: 'Head' });
  }

  // --- stout legs with split hooves ---
  for (const [s, x] of SIDES) {
    addLimb(B, 'Front', s, [[0.6 * x, 2.25, -0.75], [0.62 * x, 1.6, -0.82], [0.62 * x, 1.0, -0.86], [0.62 * x, 0.55, -0.88], [0.62 * x, 0.2, -0.9]], 0.5, 0.3, 'bark', [0.3, 0.5, 0.95, 1.35]);
    B.add(ell(0.55, 0.62, 0.62), { pos: [0.6 * x, 1.72, 1.12], color: 'bark', bone: `Back${s}Upper` });
    addLimb(B, 'Back', s, [[0.62 * x, 2.0, 1.05], [0.64 * x, 1.5, 1.18], [0.64 * x, 1.0, 1.24], [0.64 * x, 0.55, 1.16], [0.64 * x, 0.2, 1.1]], 0.48, 0.3, 'bark', [0.3, 0.5, 0.95, 1.3]);
    for (const [k, px, z] of [['Front', 0.62, -0.92], ['Back', 0.64, 1.08]]) {
      B.add(ell(0.34, 0.12, 0.34, 12, 6), { pos: [px * x, 0.4, z], color: 'barkDeep', bone: `${k}${s}Paw` });
      for (const dx of [-0.12, 0.12]) B.add(ell(0.15, 0.2, 0.22, 10, 8), { pos: [px * x + dx, 0.2, z - 0.06], color: 'hoof', bone: `${k}${s}Paw` });
    }
  }

  // --- curly tail with a leaf ---
  const tailStops = [[0, 'Tail1'], [0.33, 'Tail2'], [0.66, 'Tail3'], [1, 'Tail4']];
  const tg = loft({ points: [[0, 2.1, 1.82], [0, 2.25, 2.08], [0, 2.4, 2.22], [0, 2.52, 2.28], [0, 2.6, 2.22]], rx: () => 0.09, ry: () => 0.09, rings: 14, seg: 8 });
  const tT = tg.userData.t;
  B.add(tg, { color: 'barkDeep', weights: (p, i) => blend(tailStops, tT[i]) });
  const tip = W.TailTip;
  B.add(blade(0.45, 0.2, 0.04), { pos: [tip[0], tip[1], tip[2] - 0.05], quat: surfaceQuat([1, 0, 0], [0, 0.9, 0.5]), color: 'leaf', bone: 'TailTip' });
}

export default {
  name: 'Mossback', element: 'Nature', palette, glow, bones, build,
  style: {
    tip: 'TailTip', attack: 'charge',
    dur: { Idle: 2.6, Walk: 0.8, Run: 0.5, Attack: 1.15 },
    walk: [0.38, 0.5, 0.36, 0.45], run: [0.7, 0.75, 0.7, 0.7],
    bob: 0.9, roll: 0.035, tail: 0.4, headLow: -0.08,
  },
  warp: shortenLegs(0.32, 0.45, 1.8),
  bg: '#141b12', light: { bone: 'Spine', color: '#b2ff63' }, outline: '#0a1006',
};
