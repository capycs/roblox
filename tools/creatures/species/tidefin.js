// Tidefin (Water): sleek otter-axolotl. Teal coat with a cream muzzle, glowing gill
// fronds, fin ears, a sail fin down its back and a broad fluke tail.
import * as THREE from 'three';
import { V, SIDES, env, ell, cone, surfaceQuat, quatTo, loft, blend, quadBones, addLimb, addEye, blade } from '../lib.js';

const palette = [
  ['teal', '#2a86b0'], ['tealDeep', '#1a5980'], ['tealLight', '#56b6d8'], ['belly', '#f5e6c6'],
  ['fin', '#7dd6e6'], ['finDeep', '#3aa3c6'], ['nose', '#13223a'], ['mouth', '#7a2a3e'],
  ['pupil', '#0b1626'], ['white', '#ffffff'],
];
const glow = { Eyes: '#5ff4ff', Glow: '#38e2ff', GlowCore: '#dcffff' };

const bones = quadBones({
  hips: [1.8, 1.15], spine: [1.88, 0.2], chest: [1.98, -0.7], neck: [2.35, -1.25], head: [2.85, -1.6], jaw: [2.5, -2.05],
  ear: [0.62, 3.3, -1.45],
  tail: [[1.85, 1.9], [1.78, 2.65], [1.72, 3.35], [1.75, 4.0], [1.85, 4.55]],
  front: { x: 0.6, upper: [1.65, -0.75], lower: [0.95, -0.8], paw: [0.3, -0.85] },
  back: { x: 0.64, upper: [1.6, 1.1], lower: [0.95, 1.25], paw: [0.3, 1.1] },
});

// Thin fin slab from a 2D outline [u, v]: u runs along world Z, v up, thickness along X.
function fin(outline, thick = 0.06) {
  const s = new THREE.Shape();
  outline.forEach(([u, v], i) => (i ? s.lineTo(u, v) : s.moveTo(u, v)));
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -thick / 2); g.deleteAttribute('uv'); g.computeVertexNormals();
  g.rotateY(-Math.PI / 2);
  return g;
}
const wave = (u0, u1, h, n = 14, lobes = 3) => {
  const pts = [[u0, 0]];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([u0 + (u1 - u0) * t, h * Math.sin(Math.PI * t) * (0.75 + 0.25 * Math.cos(t * Math.PI * 2 * lobes))]); }
  pts.push([u1, 0]); return pts;
};

function build(B, W) {
  // --- sleek torso ---
  const torsoPts = [[0, 1.85, 2.0], [0, 1.85, 1.1], [0, 1.9, 0.2], [0, 1.98, -0.6], [0, 2.1, -1.15]];
  const tRx = (t) => (0.6 + 0.1 * t) * env(t), tRy = (t) => (0.58 + 0.1 * t) * env(t);
  const torsoW = (p) => blend([[-0.7, 'Chest'], [0.2, 'Spine'], [1.15, 'Hips']], p.z);
  B.add(loft({ points: torsoPts, rx: tRx, ry: tRy, rings: 34, seg: 22 }), { color: 'teal', weights: torsoW });
  B.add(ell(0.48, 0.4, 1.4), { pos: [0, 1.6, 0.3], color: 'belly', weights: torsoW });
  B.add(ell(0.46, 0.5, 0.4), { pos: [0, 2.0, -1.12], color: 'belly', weights: (p) => blend([[1.8, 'Chest'], [2.4, 'Neck']], p.y) });
  const tCurve = new THREE.CatmullRomCurve3(torsoPts.map(V));
  // glowing wave stripes on the flanks
  for (const [, x] of SIDES) for (const [t, th, len] of [[0.18, 0.5, 0.55], [0.3, 0.35, 0.7], [0.44, 0.5, 0.55], [0.58, 0.35, 0.65], [0.72, 0.5, 0.45]]) {
    const c = tCurve.getPoint(t), n = [Math.cos(th) * x, Math.sin(th), 0];
    B.add(blade(len, 0.09, 0.04), { pos: [Math.cos(th) * tRx(t) * 0.99 * x, c.y + Math.sin(th) * tRy(t) * 0.99, c.z + len * 0.4], quat: surfaceQuat(n, [0, 0.35, -1]), mesh: 'Glow', weights: torsoW });
  }
  // sail fin down the back
  B.add(fin(wave(-0.35, 1.9, 0.75)), { pos: [0, 2.38, 0], color: 'fin', weights: torsoW });
  B.add(fin(wave(-0.25, 1.8, 0.62).map(([u, v]) => [u, v * 0.98]), 0.075), { pos: [0, 2.4, 0], color: 'finDeep', weights: torsoW });
  for (let i = 0; i < 5; i++) B.add(ell(0.035, 0.035, 0.06, 6, 4), { pos: [0, 2.45 + 0.55 * Math.sin(Math.PI * (0.12 + i * 0.19)), -0.35 + (0.12 + i * 0.19) * 2.25], mesh: 'Glow', weights: torsoW });

  // --- neck + head ---
  const neckW = (p) => blend([[2.05, 'Chest'], [2.4, 'Neck'], [2.75, 'Head']], p.y);
  B.add(loft({ points: [[0, 1.98, -0.8], [0, 2.35, -1.2], [0, 2.85, -1.5]], rx: (t) => 0.5 * env(0.15 + 0.7 * t) + 0.04, ry: (t) => 0.48 * env(0.15 + 0.7 * t) + 0.04, rings: 14, seg: 16 }), { color: 'teal', weights: neckW });
  B.add(ell(0.8, 0.72, 0.78, 24, 18), { pos: [0, 2.88, -1.65], color: 'teal', bone: 'Head' });
  B.add(ell(0.52, 0.34, 0.46, 18, 12), { pos: [0, 2.62, -2.2], color: 'belly', bone: 'Head' });
  B.add(ell(0.16, 0.11, 0.1, 10, 8), { pos: [0, 2.8, -2.64], color: 'nose', bone: 'Head' });
  B.add(ell(0.38, 0.13, 0.4), { pos: [0, 2.38, -2.15], color: 'belly', bone: 'Jaw' });
  B.add(ell(0.3, 0.05, 0.32, 12, 6), { pos: [0, 2.48, -2.15], color: 'mouth', bone: 'Jaw' });
  B.add(ell(0.5, 0.18, 0.4), { pos: [0, 3.26, -2.05], rot: [0.3, 0, 0], color: 'tealDeep', bone: 'Head' });
  // forehead water gem
  B.add(ell(0.13, 0.19, 0.08, 12, 10), { pos: [0, 3.36, -2.3], rot: [-0.45, 0, 0], mesh: 'GlowCore', bone: 'Head' });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.34 * x, 2.98, -2.27], { r: [0.24, 0.27, 0.13], pupil: [0.1, 0.13], brow: { color: 'tealDeep', len: 0.3, tilt: 0.32 } });
    // axolotl gill fronds: three per side, each with glowing filaments
    [[0.25, 0.75], [0, 0.85], [-0.25, 0.7]].forEach(([dy, len], k) => {
      const base = V([0.66 * x, 2.95 + dy, -1.35]), d = V([x, 0.45 + dy * 1.4, 0.55]).normalize();
      const n = V([0, 0, 1]).cross(d).normalize();
      B.add(blade(len, 0.12, 0.06), { pos: base.toArray(), quat: surfaceQuat(n.toArray(), d.toArray()), color: 'finDeep', bone: 'Head' });
      for (let f = 0; f < 3; f++) {
        const p = base.clone().addScaledVector(d, len * (0.3 + f * 0.25));
        for (const sgn of [-1, 1]) {
          const fd = d.clone().add(V([0, 0, 0.6 * sgn])).normalize();
          B.add(blade(0.26, 0.06, 0.04), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), fd.toArray()), mesh: 'Glow', bone: 'Head' });
        }
      }
    });
    // fin ears
    const e = V(W[`Ear${s}`]), ed = V([0.5 * x, 0.8, 0.45]).normalize();
    B.add(blade(0.7, 0.3, 0.06), { pos: e.toArray(), quat: surfaceQuat([x, 0, -0.5], ed.toArray()), color: 'fin', bone: `Ear${s}` });
    B.add(blade(0.5, 0.18, 0.07), { pos: e.clone().add(V([0, 0, -0.02])).toArray(), quat: surfaceQuat([x, 0, -0.5], ed.toArray()), color: 'finDeep', bone: `Ear${s}` });
  }

  // --- short legs with webbed paws ---
  for (const [s, x] of SIDES) {
    addLimb(B, 'Front', s, [[0.58 * x, 2.05, -0.68], [0.6 * x, 1.45, -0.77], [0.6 * x, 0.9, -0.81], [0.6 * x, 0.5, -0.84], [0.6 * x, 0.14, -0.86]], 0.46, 0.27, 'teal', [0.3, 0.45, 0.85, 1.2]);
    B.add(ell(0.44, 0.52, 0.55), { pos: [0.56 * x, 1.48, 1.12], color: 'teal', bone: `Back${s}Upper` });
    addLimb(B, 'Back', s, [[0.62 * x, 1.75, 1.05], [0.64 * x, 1.3, 1.2], [0.64 * x, 0.9, 1.27], [0.64 * x, 0.5, 1.18], [0.64 * x, 0.14, 1.1]], 0.44, 0.26, 'teal', [0.3, 0.45, 0.85, 1.2]);
    for (const [k, px, z] of [['Front', 0.6, -0.95], ['Back', 0.64, 0.98]]) {
      B.add(ell(0.32, 0.17, 0.4), { pos: [px * x, 0.16, z], color: 'tealDeep', bone: `${k}${s}Paw` });
      for (const a of [-0.45, 0, 0.45]) {
        B.add(ell(0.08, 0.07, 0.16, 8, 6), { pos: [px * x + Math.sin(a) * 0.3, 0.1, z - Math.cos(a) * 0.36], rot: [0, a, 0], color: 'tealDeep', bone: `${k}${s}Paw` });
      }
      B.add(blade(0.38, 0.32, 0.03), { pos: [px * x, 0.1, z - 0.15], quat: surfaceQuat([0, 1, 0], [0, 0, -1]), color: 'fin', bone: `${k}${s}Paw` });
    }
  }

  // --- flat paddle tail with a fluke ---
  const tailPts = [[0, 1.85, 1.85], [0, 1.78, 2.65], [0, 1.72, 3.35], [0, 1.75, 4.0], [0, 1.85, 4.5]];
  const tailStops = [[0, 'Tail1'], [0.33, 'Tail2'], [0.62, 'Tail3'], [0.86, 'Tail4'], [1, 'TailTip']];
  const tg = loft({ points: tailPts, rx: (t) => 0.42 * Math.sin(Math.PI * (0.2 + 0.7 * t)) + 0.06, ry: (t) => 0.3 * (1 - 0.6 * t) + 0.05, rings: 30, seg: 14 });
  const tT = tg.userData.t, tc = tg.userData.curve;
  B.add(tg, { color: 'teal', weights: (p, i) => tT[i] < 0.06 ? blend([[0, 'Hips'], [0.06, 'Tail1']], tT[i]) : blend(tailStops, tT[i]) });
  B.add(fin(wave(1.9, 4.2, 0.4, 12, 2)), { pos: [0, 1.95, 0], color: 'fin', weights: (p) => blend(tailStops, (p.z - 1.85) / 2.65) });
  const tip = V(W.TailTip);
  for (const [, x] of SIDES) {
    const d = V([0.85 * x, 0, 1]).normalize();
    B.add(blade(1.15, 0.42, 0.06, 10), { pos: tip.clone().add(V([0, -0.05, -0.2])).toArray(), quat: surfaceQuat([0, 1, 0], d.toArray()), color: 'fin', bone: 'TailTip' });
    B.add(blade(0.85, 0.12, 0.07, 10), { pos: tip.clone().add(V([0.15 * x, -0.03, 0.15])).toArray(), quat: surfaceQuat([0, 1, 0], V([0.9 * x, 0, 1]).normalize().toArray()), mesh: 'Glow', bone: 'TailTip' });
  }
  B.add(ell(0.22, 0.22, 0.22, 14, 10), { pos: [tip.x, tip.y + 0.55, tip.z + 0.05], mesh: 'GlowCore', bone: 'TailTip' });
  B.add(ell(0.1, 0.1, 0.1, 10, 8), { pos: [tip.x + 0.25, tip.y + 0.95, tip.z - 0.1], mesh: 'Glow', bone: 'TailTip' });
}

export default {
  name: 'Tidefin', element: 'Water', palette, glow, bones, build,
  style: {
    tip: 'TailTip', dur: { Walk: 0.85, Run: 0.55 },
    walk: [0.5, 0.6, 0.45, 0.5], run: [0.8, 0.8, 0.8, 0.8], gallop: [0, 0.06, 0.5, 0.56],
    sway: 2.2, tail: 1.6, bob: 0.8,
  },
  bg: '#0e1c25', light: { bone: 'TailTip', color: '#46d9ff' }, outline: '#06121c',
};
