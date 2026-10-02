// Nyxwing (Shadow): young drake. Violet-black scales, swept horns, membrane wings,
// glowing shadow cracks and a spade tail wrapped in violet flame.
import * as THREE from 'three';
import { V, SIDES, env, ell, cone, taperFront, surfaceQuat, quatTo, loft, flame, blend, quadBones, addLimb, addEye, membraneWing, bolt, shortenLegs } from '../lib.js';

const palette = [
  ['scale', '#2c2342'], ['scaleDeep', '#1b1529'], ['scaleLight', '#4a3d6b'], ['belly', '#8070ad'],
  ['horn', '#d9d0ea'], ['membrane', '#4a3570'], ['mouth', '#7a2040'], ['pupil', '#0e0a14'],
  ['white', '#ffffff'], ['claw', '#cfc4e0'],
];
const glow = { Eyes: '#d18bff', Glow: '#a54dff', GlowCore: '#f3cdff' };

const bones = quadBones({
  hips: [2.35, 1.1], spine: [2.45, 0.2], chest: [2.6, -0.7], neck: [3.35, -1.35], head: [4.15, -1.8], jaw: [3.88, -2.3],
  ear: [0.38, 4.5, -1.55],
  tail: [[2.45, 1.75], [2.2, 2.7], [2.0, 3.6], [1.95, 4.5], [2.1, 5.3]],
  front: { x: 0.6, upper: [2.2, -0.75], lower: [1.2, -0.8], paw: [0.36, -0.86] },
  back: { x: 0.66, upper: [2.1, 1.1], lower: [1.15, 1.38], paw: [0.36, 1.15] },
  wing: { upper: [0.42, 3.05, -0.35], lower: [1.75, 3.9, 0.0], tip: [3.0, 4.5, 0.35] },
});

function build(B, W) {
  // --- torso with belly plates ---
  const torsoPts = [[0, 2.4, 1.95], [0, 2.4, 1.1], [0, 2.45, 0.2], [0, 2.6, -0.6], [0, 2.8, -1.15]];
  const tRx = (t) => (0.6 + 0.12 * t) * env(t), tRy = (t) => (0.6 + 0.16 * t) * env(t);
  const torsoW = (p) => blend([[-0.7, 'Chest'], [0.2, 'Spine'], [1.1, 'Hips']], p.z);
  B.add(loft({ points: torsoPts, rx: tRx, ry: tRy, rings: 34, seg: 22 }), { color: 'scale', weights: torsoW });
  const tCurve = new THREE.CatmullRomCurve3(torsoPts.map(V));
  for (let k = 0; k < 7; k++) {
    const t = 0.14 + k * 0.11, c = tCurve.getPoint(t);
    B.add(ell(tRx(t) * 0.78, 0.13, 0.27, 14, 8), { pos: [0, c.y - tRy(t) * 0.9, c.z], color: 'belly', weights: torsoW });
  }
  // shadow cracks on the flanks
  for (const [, x] of SIDES) for (const [t, th, len, ang] of [[0.2, 0.55, 0.7, 0.4], [0.32, 0.75, 0.5, 0.9], [0.62, 0.6, 0.55, -0.5], [0.72, 0.85, 0.4, -0.9]]) {
    const c = tCurve.getPoint(t), n = [Math.cos(th) * x, Math.sin(th), 0];
    B.add(bolt(len, len * 0.33, 0.05), { pos: [Math.cos(th) * tRx(t) * 0.99 * x, c.y + Math.sin(th) * tRy(t) * 0.99, c.z], quat: surfaceQuat(n, [0, Math.cos(ang), Math.sin(ang)]), mesh: 'Glow', weights: torsoW });
  }
  // dorsal spikes along the back
  [0.86, 0.72, 0.58, 0.44, 0.3, 0.16].forEach((t, k) => {
    const c = tCurve.getPoint(t), base = V([0, c.y + tRy(t) * 0.85, c.z]), d = V([0, 1, 0.7]).normalize(), h = 0.5 - k * 0.03;
    B.add(cone(0.16, h, 8, 0.5), { pos: base.clone().addScaledVector(d, h * 0.35).toArray(), quat: quatTo(d.toArray()), color: 'scaleDeep', weights: torsoW });
    if (k % 2 === 0) B.add(cone(0.07, h * 0.35, 6, 0.6), { pos: base.clone().addScaledVector(d, h * 0.7).toArray(), quat: quatTo(d.toArray()), mesh: 'Glow', weights: torsoW });
  });

  // --- long neck ---
  const neckPts = [[0, 2.75, -0.85], [0, 3.3, -1.3], [0, 3.85, -1.6], [0, 4.15, -1.75]];
  const neckW = (p) => blend([[2.95, 'Chest'], [3.4, 'Neck'], [3.95, 'Head']], p.y);
  const ng = loft({ points: neckPts, rx: (t) => 0.47 - 0.1 * t, ry: (t) => 0.47 - 0.1 * t, rings: 18, seg: 16 });
  B.add(ng, { color: 'scale', weights: neckW });
  const nc = ng.userData.curve;
  for (let k = 0; k < 4; k++) {
    const t = 0.15 + k * 0.22, c = nc.getPoint(t), tan = nc.getTangent(t);
    const fwd = V([0, -tan.z, tan.y]).normalize().negate(); // front of the neck
    B.add(ell(0.3, 0.07, 0.18, 12, 8), { pos: c.clone().addScaledVector(fwd, 0.41 - 0.09 * t).toArray(), quat: surfaceQuat(fwd.toArray(), [1, 0, 0]), color: 'belly', weights: neckW });
    const up = fwd.clone().negate(), d = up.clone().add(V([0, 0.3, 0.5])).normalize();
    B.add(cone(0.12, 0.38, 8, 0.5), { pos: c.clone().addScaledVector(up, 0.38).toArray(), quat: quatTo(d.toArray()), color: 'scaleDeep', weights: neckW });
  }

  // --- head ---
  B.add(ell(0.7, 0.62, 0.8, 22, 16), { pos: [0, 4.15, -1.85], color: 'scale', bone: 'Head' });
  B.add(taperFront(ell(0.48, 0.36, 0.82, 20, 14), 0.4), { pos: [0, 4.0, -2.52], color: 'scale', bone: 'Head' });
  B.add(taperFront(ell(0.35, 0.14, 0.7), 0.4), { pos: [0, 3.75, -2.5], color: 'scaleLight', bone: 'Jaw' });
  B.add(taperFront(ell(0.29, 0.06, 0.62, 14, 8), 0.4), { pos: [0, 3.86, -2.5], color: 'mouth', bone: 'Jaw' });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.38 * x, 4.32, -2.46], { r: [0.21, 0.17, 0.12], pupil: [0.045, 0.15], th: -0.5 * x, lid: 'scale', brow: { color: 'scaleDeep', len: 0.32, tilt: 0.5 } });
    // snout ridge horns + jaw spikes
    B.add(cone(0.06, 0.22, 6), { pos: [0.16 * x, 4.3, -2.85], quat: quatTo([0.2 * x, 1, 0.4]), color: 'horn', bone: 'Head' });
    for (let i = 0; i < 3; i++) B.add(cone(0.07, 0.26, 6), { pos: [0.3 * x, 3.72, -2.0 - i * 0.22], quat: quatTo([x, -0.6, 0.3]), color: 'scaleDeep', bone: 'Jaw' });
    B.add(ell(0.06, 0.05, 0.05, 8, 6), { pos: [0.13 * x, 4.14, -3.1], mesh: 'Glow', bone: 'Head' });
    for (const z of [-2.35, -2.65, -2.92]) B.add(cone(0.05, 0.18, 6), { pos: [0.24 * x * (1 + (z + 2.35) * 0.35), 3.78, z], rot: [Math.PI, 0, 0], color: 'white', bone: 'Head' });
    // swept-back horns
    const h1 = [[0.36 * x, 4.48, -1.62], [0.5 * x, 4.88, -1.32], [0.62 * x, 5.08, -0.86], [0.64 * x, 5.0, -0.38]];
    B.add(loft({ points: h1, rx: (t) => 0.15 * (1 - 0.85 * t) + 0.02, ry: (t) => 0.15 * (1 - 0.85 * t) + 0.02, rings: 16, seg: 10 }), { color: 'horn', bone: `Ear${s}` });
    const h2 = [[0.5 * x, 4.25, -1.45], [0.72 * x, 4.3, -1.0], [0.84 * x, 4.18, -0.62]];
    B.add(loft({ points: h2, rx: (t) => 0.1 * (1 - 0.85 * t) + 0.015, ry: (t) => 0.1 * (1 - 0.85 * t) + 0.015, rings: 12, seg: 8 }), { color: 'horn', bone: `Ear${s}` });
    // cheek frills
    for (let i = 0; i < 3; i++) B.add(cone(0.1, 0.45 - i * 0.08, 6, 0.4), { pos: [0.5 * x, 3.95 - i * 0.15, -1.75 + i * 0.05], quat: quatTo([x, -0.2 - i * 0.3, 0.8]), color: 'scaleDeep', bone: 'Head' });
  }

  // --- legs ---
  for (const [s, x] of SIDES) {
    addLimb(B, 'Front', s, [[0.58 * x, 2.6, -0.65], [0.6 * x, 1.85, -0.75], [0.61 * x, 1.2, -0.8], [0.61 * x, 0.6, -0.85], [0.61 * x, 0.16, -0.88]], 0.42, 0.22, 'scale', [0.36, 0.55, 1.05, 1.4]);
    B.add(ell(0.46, 0.62, 0.58), { pos: [0.6 * x, 1.92, 1.15], color: 'scale', bone: `Back${s}Upper` });
    addLimb(B, 'Back', s, [[0.64 * x, 2.2, 1.0], [0.66 * x, 1.62, 1.26], [0.66 * x, 1.12, 1.4], [0.66 * x, 0.6, 1.24], [0.66 * x, 0.16, 1.12]], 0.4, 0.22, 'scale', [0.36, 0.55, 1.0, 1.35]);
    for (const [k, px, z] of [['Front', 0.61, -0.95], ['Back', 0.66, 1.02]]) {
      B.add(ell(0.3, 0.19, 0.4), { pos: [px * x, 0.18, z], color: 'scaleDeep', bone: `${k}${s}Paw` });
      for (const dx of [-0.15, 0, 0.15]) B.add(cone(0.06, 0.24, 6), { pos: [px * x + dx, 0.12, z - 0.42], quat: quatTo([0, -0.5, -1]), color: 'claw', bone: `${k}${s}Paw` });
    }
    // elbow spurs
    B.add(cone(0.07, 0.3, 6), { pos: [0.62 * x, 1.25, -0.6], quat: quatTo([0, 0.2, 1]), color: 'horn', bone: `Front${s}Lower` });
  }

  // --- long tail: spikes, spade and shadow flame ---
  const tailPts = [[0, 2.45, 1.8], [0, 2.2, 2.7], [0, 2.0, 3.6], [0, 1.95, 4.5], [0, 2.1, 5.3]];
  const tailStops = [[0, 'Tail1'], [0.3, 'Tail2'], [0.55, 'Tail3'], [0.8, 'Tail4'], [1, 'TailTip']];
  const tg = loft({ points: tailPts, rx: (t) => 0.34 * (1 - 0.75 * t) + 0.03, ry: (t) => 0.34 * (1 - 0.75 * t) + 0.03, rings: 34, seg: 14 });
  const tT = tg.userData.t, tc = tg.userData.curve;
  B.add(tg, { color: 'scale', weights: (p, i) => tT[i] < 0.06 ? blend([[0, 'Hips'], [0.06, 'Tail1']], tT[i]) : blend(tailStops, tT[i]) });
  for (let k = 0; k < 6; k++) {
    const t = 0.1 + k * 0.14, c = tc.getPoint(t), r = 0.34 * (1 - 0.75 * t);
    B.add(cone(0.12 - k * 0.012, 0.36 - k * 0.03, 7, 0.5), { pos: [c.x, c.y + r + 0.08, c.z], quat: quatTo([0, 1, 0.6]), color: 'scaleDeep', weights: () => blend(tailStops, t) });
  }
  const tip = V(W.TailTip), tdir = tc.getTangent(1);
  B.add(cone(0.38, 0.75, 4, 0.22), { pos: tip.clone().addScaledVector(tdir, 0.3).toArray(), quat: quatTo(tdir.toArray()), color: 'scaleDeep', bone: 'TailTip' });
  B.add(flame(0.42, 1.25, { twist: 2.6 }), { pos: tip.clone().addScaledVector(tdir, 0.2).toArray(), quat: quatTo([0, 1, 0.35]), mesh: 'Glow', bone: 'TailTip' });
  B.add(flame(0.24, 0.8, { twist: 3.2, lean: 0.05 }), { pos: tip.clone().addScaledVector(tdir, 0.25).toArray(), quat: quatTo([0, 1, 0.3]), mesh: 'GlowCore', bone: 'TailTip' });

  // --- membrane wings ---
  for (const [, x] of SIDES) membraneWing(B, W, x, { arm: 'scaleDeep', membrane: 'membrane', claw: 'horn' });
}

export default {
  name: 'Nyxwing', element: 'Shadow', palette, glow, bones, build, warp: shortenLegs(0.3, 0.45, 2.1),
  style: { tip: 'TailTip', wings: true, neck: 1.0, tail: 1.3, sway: 1.2 },
  bg: '#17121f', light: { bone: 'TailTip', color: '#b06bff' }, outline: '#0a0612',
  views: { hero: [-9.6, 3.0, -6.8], roar: [-9, 1.2, -5.5], sprite: [-10.5, 2.2, -6.5] },
};
