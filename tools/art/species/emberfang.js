// Emberfang (Fire): young fire wolf. Dark ember-flecked fur, glowing eyes, flaming tail.
import * as THREE from 'three';
import { V, env, limbR, ss, ell, cone, taperFront, surfaceQuat, quatTo, loft, flame, blend, addEye, shortenLegs } from '../lib.js';

const palette = [
  ['fur', '#3d2f42'],
  ['furDeep', '#271d2c'],
  ['furLight', '#6d5a72'],
  ['ember', '#ff7426'],
  ['belly', '#f2a066'],
  ['nose', '#160f19'],
  ['mouth', '#8a2030'],
  ['bone', '#e6d6bf'],
  ['innerEar', '#ff5a2c'],
  ['pupil', '#1b0e12'],
  ['white', '#ffffff'],
];
const glow = { Eyes: '#ffd23f', Flame: '#ff5e14', FlameCore: '#ffe07a' };

const bones = [
  ['Root', null, [0, 0, 0]],
  ['Hips', 'Root', [0, 2.3, 1.0]],
  ['Spine', 'Hips', [0, 2.38, 0.15]],
  ['Chest', 'Spine', [0, 2.5, -0.7]],
  ['Neck', 'Chest', [0, 3.0, -1.15]],
  ['Head', 'Neck', [0, 3.6, -1.5]],
  ['Jaw', 'Head', [0, 3.22, -1.95]],
  ['EarL', 'Head', [-0.5, 4.2, -1.35]],
  ['EarR', 'Head', [0.5, 4.2, -1.35]],
  ['Tail1', 'Hips', [0, 2.5, 1.65]],
  ['Tail2', 'Tail1', [0, 2.75, 2.3]],
  ['Tail3', 'Tail2', [0, 3.35, 2.78]],
  ['Tail4', 'Tail3', [0, 4.02, 2.82]],
  ['TailFlame', 'Tail4', [0, 4.5, 2.62]],
];
for (const s of ['L', 'R']) {
  const x = s === 'L' ? -1 : 1;
  bones.push([`Front${s}Upper`, 'Chest', [0.6 * x, 2.1, -0.75]]);
  bones.push([`Front${s}Lower`, `Front${s}Upper`, [0.62 * x, 1.2, -0.8]]);
  bones.push([`Front${s}Paw`, `Front${s}Lower`, [0.62 * x, 0.36, -0.82]]);
  bones.push([`Back${s}Upper`, 'Hips', [0.62 * x, 2.05, 1.05]]);
  bones.push([`Back${s}Lower`, `Back${s}Upper`, [0.66 * x, 1.15, 1.3]]);
  bones.push([`Back${s}Paw`, `Back${s}Lower`, [0.66 * x, 0.36, 1.12]]);
}

function build(B, W) {
  // --- torso ---
  const torsoPts = [[0, 2.36, 1.9], [0, 2.34, 1.1], [0, 2.38, 0.2], [0, 2.44, -0.6], [0, 2.5, -1.25]];
  const torsoRx = (t) => (0.66 + 0.16 * t) * env(t);
  const torsoRy = (t) => (0.64 + 0.14 * t) * env(t);
  const torsoW = (p) => blend([[-0.7, 'Chest'], [0.15, 'Spine'], [1.0, 'Hips']], p.z);
  B.add(loft({ points: torsoPts, rx: torsoRx, ry: torsoRy, rings: 34, seg: 22 }), { color: 'fur', weights: torsoW });
  // belly + chest fluff
  B.add(ell(0.52, 0.42, 1.0), { pos: [0, 2.06, -0.3], color: 'belly', weights: torsoW });
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) * 0.32;
    B.add(cone(0.22, 0.72, 8), {
      pos: [Math.sin(a) * 0.42, 2.32 - Math.abs(i - 2) * 0.07, -1.34 + Math.abs(i - 2) * 0.08],
      quat: quatTo([Math.sin(a) * 0.3, -1, -0.45]), color: 'ember',
      weights: (p) => blend([[2.3, 'Chest'], [2.9, 'Neck']], p.y),
    });
  }
  B.add(ell(0.46, 0.5, 0.38), { pos: [0, 2.72, -1.32], color: 'ember', weights: (p) => blend([[2.5, 'Chest'], [3.0, 'Neck']], p.y) });

  // --- neck + ruff ---
  const neckW = (p) => blend([[2.75, 'Chest'], [3.1, 'Neck'], [3.55, 'Head']], p.y);
  B.add(loft({ points: [[0, 2.55, -0.75], [0, 3.05, -1.15], [0, 3.7, -1.45]], rx: (t) => 0.56 * env(0.15 + 0.7 * t) + 0.02, ry: (t) => 0.54 * env(0.15 + 0.7 * t) + 0.02, rings: 16, seg: 18 }), { color: 'fur', weights: neckW });
  for (let i = 0; i < 9; i++) {
    const a = -1.95 + (i / 8) * 3.9;
    const d = [Math.sin(a) * 0.95, Math.cos(a) * 0.75 + 0.1, 0.55];
    const len = 0.7 + 0.15 * Math.cos(a);
    const dn = V(d).normalize();
    const p = [dn.x * 0.48, 3.15 + dn.y * 0.42, -1.12 + dn.z * 0.35];
    B.add(cone(0.27, len, 8), { pos: p, quat: quatTo(d), color: i % 2 ? 'furLight' : 'fur', weights: neckW });
  }

  // --- head ---
  B.add(ell(0.98, 0.88, 0.92, 24, 18), { pos: [0, 3.62, -1.55], color: 'fur', bone: 'Head' });
  for (const x of [-1, 1]) {
    // cheek tufts
    B.add(cone(0.26, 0.75, 8), { pos: [0.96 * x, 3.35, -1.45], quat: quatTo([x, -0.3, 0.55]), color: 'fur', bone: 'Head' });
    B.add(cone(0.2, 0.55, 8), { pos: [0.85 * x, 3.08, -1.38], quat: quatTo([x * 0.8, -0.8, 0.45]), color: 'furLight', bone: 'Head' });
    addEye(B, x, [0.4 * x, 3.74, -2.33], { pupil: [0.075, 0.19], lid: 'fur', brow: { color: 'furDeep', len: 0.34, tilt: 0.38 } });
    // ears
    const ed = [0.38 * x, 1, 0.14], en = V(ed).normalize(), base = V(W[x < 0 ? 'EarL' : 'EarR']);
    const ear = x < 0 ? 'EarL' : 'EarR';
    B.add(cone(0.4, 1.12, 12, 0.5), { pos: base.clone().addScaledVector(en, 0.45).toArray(), quat: quatTo(ed), color: 'fur', bone: ear });
    B.add(cone(0.25, 0.72, 10, 0.25), { pos: base.clone().addScaledVector(en, 0.36).add(V([0, 0, -0.075])).toArray(), quat: quatTo(ed), color: 'innerEar', bone: ear });
    B.add(cone(0.1, 0.26, 8, 0.55), { pos: base.clone().addScaledVector(en, 0.9).toArray(), quat: quatTo(ed), mesh: 'Flame', bone: ear });
    // fangs
    B.add(cone(0.07, 0.28, 8), { pos: [0.17 * x, 2.88, -2.74], rot: [Math.PI, 0, 0], color: 'bone', bone: 'Head' });
  }
  // flame mane spikes
  [[0, 4.38, -1.3, 0.28, 0.9], [-0.32, 4.25, -1.18, 0.22, 0.7], [0.32, 4.25, -1.18, 0.22, 0.7]].forEach(([x, y, z, r, h]) => {
    const d = [x * 0.6, 0.85, 0.6], dn = V(d).normalize();
    B.add(cone(r, h, 10), { pos: [x, y, z], quat: quatTo(d), color: 'furDeep', bone: 'Head' });
    B.add(cone(r * 0.48, h * 0.42, 8), { pos: V([x, y, z]).addScaledVector(dn, h * 0.3).toArray(), quat: quatTo(d), mesh: 'Flame', bone: 'Head' });
  });
  // muzzle, nose, jaw, mouth
  B.add(taperFront(ell(0.5, 0.4, 0.8, 20, 14), 0.35), { pos: [0, 3.32, -2.3], color: 'belly', bone: 'Head' });
  B.add(ell(0.6, 0.22, 0.5), { pos: [0, 3.58, -2.05], rot: [0.25, 0, 0], color: 'fur', bone: 'Head' });
  B.add(ell(0.2, 0.15, 0.15, 12, 8), { pos: [0, 3.5, -3.07], color: 'nose', bone: 'Head' });
  B.add(taperFront(ell(0.36, 0.16, 0.66), 0.35), { pos: [0, 2.98, -2.3], color: 'belly', bone: 'Jaw' });
  B.add(taperFront(ell(0.28, 0.07, 0.58, 14, 8), 0.35), { pos: [0, 3.1, -2.3], color: 'mouth', bone: 'Jaw' });

  // --- legs ---
  for (const s of ['L', 'R']) {
    const x = s === 'L' ? -1 : 1;
    // front: one smooth tapered limb blended across Upper/Lower/Paw
    const fx = 0.63 * x;
    const frontW = (p) => blend([[0.36, `Front${s}Paw`], [0.55, `Front${s}Lower`], [1.05, `Front${s}Lower`], [1.4, `Front${s}Upper`]], p.y);
    B.add(loft({ points: [[0.58 * x, 2.5, -0.66], [0.61 * x, 1.75, -0.78], [fx, 1.15, -0.84], [fx, 0.6, -0.87], [fx, 0.16, -0.9]],
      rx: limbR(0.48, 0.27), ry: limbR(0.52, 0.28), rings: 22, seg: 14 }), { color: 'fur', weights: frontW });
    B.add(ell(0.36, 0.22, 0.48), { pos: [0.63 * x, 0.21, -0.96], color: 'furDeep', bone: `Front${s}Paw` });
    for (const dx of [-0.16, 0, 0.16]) {
      B.add(ell(0.13, 0.12, 0.13, 10, 8), { pos: [0.63 * x + dx, 0.15, -1.27], color: 'furDeep', bone: `Front${s}Paw` });
      B.add(cone(0.045, 0.17, 6), { pos: [0.63 * x + dx, 0.11, -1.42], quat: quatTo([0, -0.5, -1]), color: 'bone', bone: `Front${s}Paw` });
    }
    B.add(flame(0.13, 0.5, { rings: 8, seg: 9 }), { pos: [0.64 * x, 1.05, -0.62], quat: quatTo([x * 0.15, 0.35, 1]), mesh: 'Flame', bone: `Front${s}Lower` });
    B.add(flame(0.14, 0.55, { rings: 8, seg: 9 }), { pos: [0.68 * x, 0.95, 1.4], quat: quatTo([x * 0.15, 0.3, 1]), mesh: 'Flame', bone: `Back${s}Lower` });
    // back: big haunch + tapered limb with a hock
    const bx = 0.66 * x;
    const backW = (p) => blend([[0.36, `Back${s}Paw`], [0.55, `Back${s}Lower`], [1.0, `Back${s}Lower`], [1.35, `Back${s}Upper`]], p.y);
    B.add(ell(0.48, 0.66, 0.62), { pos: [0.62 * x, 1.85, 1.12], color: 'fur', bone: `Back${s}Upper` });
    B.add(loft({ points: [[bx, 2.1, 1.05], [bx, 1.55, 1.25], [bx, 1.1, 1.32], [bx, 0.6, 1.2], [bx, 0.16, 1.1]],
      rx: limbR(0.44, 0.26), ry: limbR(0.48, 0.27), rings: 22, seg: 14 }), { color: 'fur', weights: backW });
    B.add(ell(0.35, 0.22, 0.46), { pos: [0.67 * x, 0.21, 0.98], color: 'furDeep', bone: `Back${s}Paw` });
    for (const dx of [-0.15, 0, 0.15]) {
      B.add(ell(0.125, 0.12, 0.125, 10, 8), { pos: [0.67 * x + dx, 0.15, 0.64], color: 'furDeep', bone: `Back${s}Paw` });
      B.add(cone(0.045, 0.16, 6), { pos: [0.67 * x + dx, 0.11, 0.5], quat: quatTo([0, -0.5, -1]), color: 'bone', bone: `Back${s}Paw` });
    }
  }

  // --- fur tufts: elbows, haunches, chest sides ---
  for (const [s2, x] of [['L', -1], ['R', 1]]) {
    for (const [dy, len] of [[0, 0.5], [-0.18, 0.4]]) B.add(cone(0.16, len, 7), { pos: [0.64 * x, 1.42 + dy, -0.55], quat: quatTo([x * 0.25, -0.5, 1]), color: 'fur', bone: `Front${s2}Lower` });
    for (const [dy, dz, len] of [[0.1, 0, 0.6], [-0.15, 0.1, 0.5], [0.35, -0.1, 0.45]]) B.add(cone(0.2, len, 7), { pos: [0.95 * x, 1.85 + dy, 1.45 + dz], quat: quatTo([x * 0.6, -0.3, 1]), color: dy > 0.2 ? 'furLight' : 'fur', bone: `Back${s2}Upper` });
    for (const dz of [-0.9, -0.5]) B.add(cone(0.18, 0.45, 7), { pos: [0.74 * x, 2.2, dz], quat: quatTo([x, -0.4, 0.4]), color: 'fur', weights: (p) => blend([[-0.7, 'Chest'], [0.15, 'Spine']], p.z) });
  }

  // --- tail ---
  const tailPts = [[0, 2.42, 1.55], [0, 2.72, 2.28], [0, 3.32, 2.8], [0, 4.02, 2.85], [0, 4.5, 2.62]];
  const tailR = (t) => {
    let r = 0.17 + 0.42 * Math.sin(Math.PI * t * 0.85);
    if (t > 0.9) r *= Math.sqrt(Math.max(0, 1 - ((t - 0.9) / 0.1) ** 2));
    if (t < 0.04) r *= 0.6 + 0.4 * (t / 0.04);
    return r;
  };
  const tailStops = [[0, 'Tail1'], [0.36, 'Tail2'], [0.68, 'Tail3'], [0.95, 'Tail4']];
  const tailGeo = loft({ points: tailPts, rx: tailR, ry: tailR, rings: 30, seg: 16 });
  const tailT = tailGeo.userData.t;
  B.add(tailGeo, { color: 'fur', weights: (p, i) => tailT[i] < 0.06 ? blend([[0, 'Hips'], [0.06, 'Tail1']], tailT[i]) : blend(tailStops, tailT[i]) });
  const tc = tailGeo.userData.curve;
  // fluffy side tufts along the tail
  [[0.3, 0.32], [0.45, 0.4], [0.6, 0.44], [0.74, 0.4]].forEach(([t, len], k) => {
    const c = tc.getPoint(t), tan = tc.getTangent(t);
    for (const x of [-1, 1]) {
      const d = [x * 1.1, 0, 0]; const dv = V(d).addScaledVector(tan, 0.75);
      B.add(cone(0.22, len + 0.45, 8), { pos: c.clone().add(V([x * tailR(t) * 0.95, 0, 0])).addScaledVector(tan, 0.15).toArray(), quat: quatTo(dv.toArray()), color: k % 2 ? 'furLight' : 'fur', weights: () => blend(tailStops, t) });
    }
  });
  // ring of flame tongues wrapping the tip
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const c = tc.getPoint(0.88), d = [Math.cos(a) * 0.8, 1, Math.sin(a) * 0.8 - 0.3];
    B.add(flame(0.2, 0.7, { rings: 8, seg: 9, twist: 1.5 }), { pos: c.clone().add(V([Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22])).toArray(), quat: quatTo(d), mesh: 'Flame', bone: 'Tail4' });
  }
  // the big tail flame
  const fb = W.TailFlame;
  B.add(flame(0.62, 2.0), { pos: [fb[0], fb[1] - 0.2, fb[2]], quat: quatTo([0, 1, -0.1]), mesh: 'Flame', bone: 'TailFlame' });
  B.add(flame(0.32, 1.1, { twist: -2, lean: 0.25 }), { pos: [fb[0] + 0.32, fb[1] - 0.15, fb[2] + 0.05], quat: quatTo([0.5, 1, 0.1]), mesh: 'Flame', bone: 'TailFlame' });
  B.add(flame(0.32, 1.1, { twist: 2, lean: -0.25 }), { pos: [fb[0] - 0.32, fb[1] - 0.15, fb[2] + 0.05], quat: quatTo([-0.5, 1, 0.1]), mesh: 'Flame', bone: 'TailFlame' });
  B.add(flame(0.38, 1.3, { twist: 3, lean: 0.1 }), { pos: [fb[0], fb[1] - 0.1, fb[2] - 0.12], quat: quatTo([0, 1, -0.1]), mesh: 'FlameCore', bone: 'TailFlame' });

  // --- glowing ember markings (streaks on haunches, shoulders, brow) ---
  const tCurve = new THREE.CatmullRomCurve3(torsoPts.map(V));
  const streak = (t, th, x, dir, len) => {
    const c = tCurve.getPoint(t);
    const n = [Math.cos(th) * x, Math.sin(th), 0];
    const p = [Math.cos(th) * torsoRx(t) * 0.985 * x, c.y + Math.sin(th) * torsoRy(t) * 0.985, c.z];
    B.add(ell(len, 0.075, 0.05, 10, 6), { pos: p, quat: surfaceQuat(n, dir), mesh: 'Flame', weights: torsoW });
  };
  for (const x of [-1, 1]) {
    streak(0.13, 0.75, x, [0, 1, 0.75], 0.3);
    streak(0.21, 0.85, x, [0, 1, 0.75], 0.34);
    streak(0.29, 0.95, x, [0, 1, 0.75], 0.28);
    streak(0.66, 0.8, x, [0, 1, -0.6], 0.26);
    streak(0.73, 0.9, x, [0, 1, -0.6], 0.22);
  }
  // dorsal fur spikes with glowing tips
  [[0.62, 0.42, 0.95], [0.5, 0.36, 0.8], [0.4, 0.3, 0.62]].forEach(([t, r, h]) => {
    const c = tCurve.getPoint(t), base = [0, c.y + torsoRy(t) * 0.85, c.z], d = [0, 1, 0.75];
    const dn = V(d).normalize();
    B.add(cone(r, h, 10, 0.5), { pos: V(base).addScaledVector(dn, h * 0.3).toArray(), quat: quatTo(d), color: 'furDeep', weights: torsoW });
    B.add(cone(r * 0.4, h * 0.38, 8, 0.6), { pos: V(base).addScaledVector(dn, h * 0.62).toArray(), quat: quatTo(d), mesh: 'Flame', weights: torsoW });
  });
  // forehead diamond
  B.add(ell(0.09, 0.2, 0.05, 8, 6), { pos: [0, 4.12, -2.27], rot: [-0.55, 0, 0], mesh: 'Flame', bone: 'Head' });
}

export default {
  name: 'Emberfang', element: 'Fire', palette, glow, bones, build, warp: shortenLegs(0.28, 0.45, 2.1),
  bg: '#241a22', light: { bone: 'TailFlame', color: '#ff7a2a' }, outline: '#140b10',
};
