// Frostusk (Ice): heavy frost beast. Shaggy pale fur, slate face, curved tusks and
// glowing ice crystals growing out of its humped back.
import * as THREE from 'three';
import { V, SIDES, env, ell, cone, taperFront, surfaceQuat, quatTo, loft, blend, quadBones, addLimb, addEye, blade, crystal } from '../lib.js';

const palette = [
  ['frost', '#e3ecf6'], ['frostShade', '#b4c7dd'], ['slate', '#4f6b90'], ['slateDeep', '#2d4466'],
  ['iceDeep', '#7fa9cf'], ['tusk', '#f4eedf'], ['nose', '#1b2233'], ['mouth', '#7a2a3a'],
  ['pupil', '#0f1724'], ['white', '#ffffff'],
];
const glow = { Eyes: '#7fe6ff', Glow: '#6fdcff', GlowCore: '#dffaff' };

const bones = quadBones({
  hips: [2.35, 1.2], spine: [2.6, 0.15], chest: [2.8, -0.8], neck: [2.95, -1.45], head: [2.95, -1.95], jaw: [2.5, -2.35],
  ear: [0.72, 3.65, -1.7],
  tail: [[2.55, 1.95], [2.42, 2.3], [2.28, 2.55], [2.15, 2.72], [2.05, 2.88]],
  front: { x: 0.85, upper: [2.15, -0.95], lower: [1.05, -1.0], paw: [0.36, -1.05] },
  back: { x: 0.82, upper: [2.05, 1.2], lower: [1.05, 1.3], paw: [0.36, 1.2] },
});

function build(B, W) {
  // --- humped torso ---
  const torsoPts = [[0, 2.4, 2.05], [0, 2.45, 1.2], [0, 2.72, 0.2], [0, 2.95, -0.7], [0, 2.85, -1.55]];
  const tRx = (t) => (0.95 + 0.2 * t) * env(t), tRy = (t) => (0.88 + 0.25 * t) * env(t);
  const torsoW = (p) => blend([[-0.8, 'Chest'], [0.15, 'Spine'], [1.2, 'Hips']], p.z);
  B.add(loft({ points: torsoPts, rx: tRx, ry: tRy, rings: 34, seg: 22 }), { color: 'frost', weights: torsoW });
  const tCurve = new THREE.CatmullRomCurve3(torsoPts.map(V));
  // shaggy skirt along both flanks and the belly
  for (let k = 0; k < 9; k++) {
    const t = 0.1 + k * 0.095, c = tCurve.getPoint(t);
    for (const [, x] of SIDES) {
      for (const th of [-0.35, -0.85]) {
        const p = [Math.cos(th) * tRx(t) * 0.92 * x, c.y + Math.sin(th) * tRy(t) * 0.92, c.z];
        B.add(cone(0.24, 0.78, 7), { pos: p, quat: quatTo([x * 0.35 * Math.cos(th), -1, 0.15]), color: (k + (th < -0.5 ? 1 : 0)) % 2 ? 'frostShade' : 'frost', weights: torsoW });
      }
    }
    B.add(cone(0.26, 0.6, 7), { pos: [0, c.y - tRy(t) * 0.92, c.z], quat: quatTo([0, -1, 0.1]), color: 'frostShade', weights: torsoW });
  }
  // chest mane
  const maneW = (p) => blend([[2.4, 'Chest'], [3.0, 'Neck']], p.y);
  B.add(ell(1.0, 0.95, 0.72), { pos: [0, 2.65, -1.5], color: 'frost', weights: maneW });
  for (let i = 0; i < 7; i++) {
    const a = (i - 3) * 0.3;
    B.add(cone(0.26, 0.9, 7), { pos: [Math.sin(a) * 0.7, 2.0 - Math.abs(i - 3) * 0.05, -1.85 + Math.abs(i - 3) * 0.12], quat: quatTo([Math.sin(a) * 0.3, -1, -0.25]), color: i % 2 ? 'frostShade' : 'frost', weights: maneW });
  }

  // --- ice crystals along the hump ---
  [[0.2, 0.2, 0.8, 0.3], [0.36, 0.26, 1.15, 0.2], [0.52, 0.3, 1.4, 0.05], [0.68, 0.27, 1.2, -0.1], [0.84, 0.2, 0.85, -0.25]].forEach(([t, r, h, lean], k) => {
    const c = tCurve.getPoint(t), base = V([0, c.y + tRy(t) * 0.86, c.z]);
    B.add(ell(r * 1.9, 0.16, r * 1.9, 10, 6), { pos: base.toArray(), color: 'iceDeep', weights: torsoW });
    B.add(crystal(r, h), { pos: base.clone().add(V([0, -0.1, 0])).toArray(), quat: quatTo([0, 1, lean]), mesh: 'Glow', weights: torsoW });
    for (const [, x] of SIDES) {
      if (k % 2) continue;
      B.add(crystal(r * 0.55, h * 0.55), { pos: base.clone().add(V([0.24 * x, -0.12, 0.05])).toArray(), quat: quatTo([0.6 * x, 1, lean]), mesh: 'GlowCore', weights: torsoW });
    }
  });
  // frost runes on the shoulders
  for (const [, x] of SIDES) for (const [t, th] of [[0.72, 0.35], [0.8, 0.2]]) {
    const c = tCurve.getPoint(t), n = [Math.cos(th) * x, Math.sin(th), 0];
    B.add(blade(0.45, 0.14, 0.04), { pos: [Math.cos(th) * tRx(t) * 0.99 * x, c.y + Math.sin(th) * tRy(t) * 0.99, c.z + 0.2], quat: surfaceQuat(n, [0, 1, -0.4]), mesh: 'Glow', weights: torsoW });
  }

  // --- neck + head ---
  const neckW = (p) => blend([[-1.2, 'Chest'], [-1.55, 'Neck'], [-1.85, 'Head']].map(([z, b]) => [-z, b]), -p.z);
  B.add(loft({ points: [[0, 2.75, -1.05], [0, 2.95, -1.5], [0, 3.0, -1.85]], rx: () => 0.78, ry: () => 0.72, rings: 10, seg: 18 }), { color: 'frost', weights: neckW });
  B.add(ell(1.0, 0.85, 0.95, 24, 18), { pos: [0, 3.02, -2.0], color: 'frost', bone: 'Head' });
  B.add(ell(0.82, 0.62, 0.52, 20, 14), { pos: [0, 2.95, -2.52], color: 'slate', bone: 'Head' });
  B.add(taperFront(ell(0.62, 0.42, 0.72, 20, 14), 0.25), { pos: [0, 2.72, -2.78], color: 'slateDeep', bone: 'Head' });
  B.add(ell(0.24, 0.17, 0.15, 12, 8), { pos: [0, 2.88, -3.45], color: 'nose', bone: 'Head' });
  B.add(ell(0.98, 0.2, 0.36, 18, 10), { pos: [0, 3.4, -2.62], rot: [0.25, 0, 0], color: 'frostShade', bone: 'Head' });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.38 * x, 3.17, -2.94], { r: [0.2, 0.17, 0.12], pupil: [0.07, 0.09], th: -0.42 * x, brow: { color: 'slateDeep', len: 0.3, tilt: 0.5 } });
    // cheek fluff
    B.add(cone(0.34, 0.95, 8), { pos: [1.0 * x, 2.75, -1.95], quat: quatTo([x, -0.45, 0.35]), color: 'frost', bone: 'Head' });
    B.add(cone(0.26, 0.7, 8), { pos: [0.92 * x, 2.45, -1.9], quat: quatTo([x * 0.7, -0.8, 0.3]), color: 'frostShade', bone: 'Head' });
    // round ears
    const e = V(W[`Ear${s}`]);
    B.add(ell(0.27, 0.3, 0.14), { pos: e.toArray(), rot: [0, 0, -0.3 * x], color: 'frost', bone: `Ear${s}` });
    B.add(ell(0.17, 0.2, 0.08), { pos: e.clone().add(V([0, -0.02, -0.07])).toArray(), rot: [0, 0, -0.3 * x], color: 'slate', bone: `Ear${s}` });
    // curved tusks
    const tp = [[0.42 * x, 2.58, -3.0], [0.64 * x, 2.36, -3.35], [0.84 * x, 2.55, -3.75], [0.88 * x, 2.98, -3.92]];
    B.add(loft({ points: tp, rx: (t) => 0.14 * (1 - 0.8 * t) + 0.02, ry: (t) => 0.14 * (1 - 0.8 * t) + 0.02, rings: 16, seg: 10 }), { color: 'tusk', bone: 'Head' });
    B.add(ell(0.17, 0.17, 0.17, 10, 8), { pos: tp[0], color: 'frostShade', bone: 'Head' });
    B.add(cone(0.05, 0.14, 6), { pos: [0.22 * x, 2.6, -3.18], color: 'white', bone: 'Jaw' });
  }
  B.add(taperFront(ell(0.52, 0.2, 0.62), 0.3), { pos: [0, 2.42, -2.75], color: 'slate', bone: 'Jaw' });
  B.add(taperFront(ell(0.42, 0.07, 0.52, 14, 8), 0.3), { pos: [0, 2.55, -2.75], color: 'mouth', bone: 'Jaw' });

  // --- legs ---
  for (const [s, x] of SIDES) {
    addLimb(B, 'Front', s, [[0.82 * x, 2.75, -0.85], [0.85 * x, 1.9, -0.95], [0.86 * x, 1.1, -1.0], [0.86 * x, 0.6, -1.03], [0.86 * x, 0.16, -1.06]], 0.64, 0.44, 'frost', [0.36, 0.6, 1.0, 1.5]);
    B.add(ell(0.66, 0.85, 0.75), { pos: [0.74 * x, 1.98, 1.22], color: 'frost', bone: `Back${s}Upper` });
    addLimb(B, 'Back', s, [[0.8 * x, 2.3, 1.1], [0.82 * x, 1.6, 1.25], [0.83 * x, 1.05, 1.32], [0.83 * x, 0.55, 1.25], [0.83 * x, 0.16, 1.2]], 0.58, 0.42, 'frost', [0.36, 0.6, 1.0, 1.4]);
    for (const [k, z] of [['Front', -1.03], ['Back', 1.25]]) {
      const px = (k === 'Front' ? 0.86 : 0.83) * x;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        B.add(cone(0.16, 0.5, 6), { pos: [px + Math.cos(a) * 0.42, 0.62, z + Math.sin(a) * 0.42], quat: quatTo([Math.cos(a) * 0.5, -1, Math.sin(a) * 0.5]), color: i % 2 ? 'frostShade' : 'frost', bone: `${k}${s}Lower` });
      }
      B.add(ell(0.5, 0.24, 0.6), { pos: [px, 0.2, z - 0.12], color: 'slate', bone: `${k}${s}Paw` });
      for (const dx of [-0.24, 0, 0.24]) B.add(cone(0.08, 0.26, 7), { pos: [px + dx, 0.14, z - 0.7], quat: quatTo([0, -0.4, -1]), color: 'tusk', bone: `${k}${s}Paw` });
    }
  }

  // --- stubby tail with an icicle tip ---
  const tailStops = [[0, 'Tail1'], [0.33, 'Tail2'], [0.66, 'Tail3'], [0.95, 'Tail4']];
  const tg = loft({ points: [[0, 2.55, 1.95], [0, 2.42, 2.3], [0, 2.26, 2.58], [0, 2.12, 2.8]], rx: (t) => 0.34 - 0.12 * t, ry: (t) => 0.34 - 0.12 * t, rings: 14, seg: 12 });
  const tT = tg.userData.t;
  B.add(tg, { color: 'frostShade', weights: (p, i) => blend(tailStops, tT[i]) });
  const tip = W.TailTip;
  B.add(crystal(0.15, 0.7), { pos: [tip[0], tip[1], tip[2] - 0.1], quat: quatTo([0, -0.35, 1]), mesh: 'Glow', bone: 'TailTip' });
}

export default {
  name: 'Frostusk', element: 'Ice', palette, glow, bones, build,
  style: {
    tip: 'TailTip', attack: 'charge',
    dur: { Idle: 3.0, Walk: 1.25, Run: 0.75, Attack: 1.25, Roar: 2.4 },
    walk: [0.36, 0.55, 0.34, 0.45], run: [0.7, 0.8, 0.65, 0.7],
    bob: 1.3, roll: 0.05, sway: 1.4, tail: 0.5, headLow: -0.12,
  },
  bg: '#131c27', light: { bone: 'Spine', color: '#8ee6ff' }, outline: '#0a1220',
};
