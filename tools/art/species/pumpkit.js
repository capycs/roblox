// Pumpkit (Fire): a cat-shaped jack-o'-lantern. Ribbed pumpkin body with glowing carved
// windows, a pumpkin head with a curly stem, carved triangle eyes and a toothy grin, leaf
// ears, dark vine legs ending in little pumpkin paws and a curling vine tail with a flame.
import * as THREE from 'three';
import { V, SIDES, ell, cone, surfaceQuat, quatTo, loft, quadBones, blade, flame, shortenLegs } from '../lib.js';
import { legs, tail } from '../kit.js';

const palette = [
  ['rind', '#f08a24'], ['rindDeep', '#c4601a'], ['rindLight', '#ffb453'], ['carve', '#3a1408'], ['vine', '#3f7a2e'], ['vineDeep', '#2a5420'],
  ['leaf', '#5fae3a'], ['leafLight', '#8fd45a'], ['stem', '#7a5a2a'], ['stemDeep', '#4e3818'],
  ['nose', '#2a1206'], ['mouth', '#3a1408'], ['pupil', '#2a1206'], ['white', '#ffffff'],
];
const glow = { Eyes: '#ffe066', Glow: '#ff9a1f', GlowCore: '#fff2a8' };

const bones = quadBones({
  hips: [1.35, 0.65], spine: [1.5, 0.0], chest: [1.48, -0.6], neck: [1.85, -0.92], head: [2.25, -1.15], jaw: [1.9, -1.45],
  ear: [0.42, 2.95, -1.05],
  tail: [[1.45, 1.05], [2.0, 1.45], [2.6, 1.35], [2.95, 0.95], [3.05, 0.5]],
  front: { x: 0.48, upper: [1.2, -0.65], lower: [0.7, -0.72], paw: [0.2, -0.78] },
  back: { x: 0.52, upper: [1.2, 0.65], lower: [0.7, 0.8], paw: [0.2, 0.7] },
});

// Sphere with vertical ribs and dimpled poles.
function pumpkin(rx, ry, rz, ribs = 10, depth = 0.1, w = 32, h = 18) {
  const g = new THREE.SphereGeometry(1, w, h), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    const a = Math.atan2(z, x), k = 1 - depth * Math.pow(0.5 - 0.5 * Math.cos(ribs * a), 0.6);
    const dim = 1 - 0.18 * Math.pow(Math.abs(y), 6);
    P.setXYZ(i, x * k * rx, y * ry * dim, z * k * rz);
  }
  g.computeVertexNormals();
  return g;
}
// carved shape: dark rim + glowing inside, flat on the surface (n = outward normal)
function carve(B, p, n, up, shape, size, opts) {
  const seg = shape === 'tri' ? 3 : shape === 'dia' ? 4 : 16;
  const q = surfaceQuat(n, up).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, shape === 'tri' ? Math.PI / 2 : shape === 'dia' ? 0 : 0, 0)));
  const P = V(p), N = V(n).normalize();
  B.add(new THREE.CylinderGeometry(size * 1.25, size * 1.25, 0.05, seg), { pos: P.toArray(), quat: q, color: 'carve', ...opts });
  B.add(new THREE.CylinderGeometry(size, size, 0.06, seg), { pos: P.clone().addScaledVector(N, 0.02).toArray(), quat: q, mesh: opts.mesh || 'Glow', ...opts, color: undefined });
}

function build(B, W) {
  const bodyW = (p) => (p.z < -0.35 ? [['Chest', 0.75], ['Spine', 0.25]] : p.z > 0.35 ? [['Hips', 0.75], ['Spine', 0.25]] : [['Spine', 1]]);
  const C = V([0, 1.5, 0]), R = [0.95, 0.82, 1.12];
  B.add(pumpkin(...R, 10, 0.1), { pos: C.toArray(), color: 'rind', weights: bodyW });
  // rib grooves in a deeper orange
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + Math.PI / 10;
    const pts = []; for (let j = 0; j <= 8; j++) { const el = -1.2 + (j / 8) * 2.4; pts.push([Math.cos(a) * Math.cos(el) * R[0] * 0.905, Math.sin(el) * R[1] * 0.985 + C.y, Math.sin(a) * Math.cos(el) * R[2] * 0.905]); }
    B.add(loft({ points: pts, rx: () => 0.035, ry: () => 0.035, rings: 12, seg: 5 }), { color: 'rindDeep', weights: bodyW });
  }
  // carved windows down each flank, glowing from inside
  const surf = (a, el, k = 1.0) => { const n = V([Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)]); return { p: V([n.x * R[0] * k, n.y * R[1] * k + C.y, n.z * R[2] * k]), n: V([n.x / R[0], n.y / R[1], n.z / R[2]]).normalize() }; };
  for (const [, x] of SIDES) {
    const side = x > 0 ? 0 : Math.PI;
    for (const [da, el, shape, sz] of [[0.45, 0.15, 'tri', 0.2], [-0.05, 0.25, 'dia', 0.17], [-0.5, 0.1, 'tri', 0.18], [0.05, -0.2, 'circ', 0.09], [0.4, -0.25, 'circ', 0.07]]) {
      const a = side + da * (x > 0 ? 1 : -1), s = surf(a, el, 1.0);
      carve(B, s.p.toArray(), s.n.toArray(), [0, 1, 0], shape, sz, { weights: bodyW });
    }
  }
  // vine wrapping the back with a leaf and a curl
  const vpts = [[0.3, 2.25, 0.7], [0, 2.38, 0.2], [-0.25, 2.35, -0.3], [-0.05, 2.3, -0.65]];
  B.add(loft({ points: vpts, rx: () => 0.05, ry: () => 0.05, rings: 14, seg: 6 }), { color: 'vine', weights: bodyW });
  B.add(blade(0.6, 0.3, 0.03), { pos: [0, 2.38, 0.2], quat: surfaceQuat([0.2, 1, 0.1], [1, 0.1, 0.4]), color: 'leaf', weights: bodyW });
  B.add(blade(0.45, 0.24, 0.03), { pos: [-0.25, 2.35, -0.3], quat: surfaceQuat([-0.3, 1, 0], [-1, 0.2, -0.3]), color: 'leafLight', weights: bodyW });

  // neck: short orange collar of leaves
  const neckW = (p) => (p.y > 2.0 ? [['Neck', 0.6], ['Head', 0.4]] : [['Chest', 0.6], ['Neck', 0.4]]);
  B.add(ell(0.5, 0.45, 0.5, 14, 10), { pos: [0, 1.9, -0.92], color: 'rindDeep', weights: neckW });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; B.add(blade(0.42, 0.18, 0.03), { pos: [Math.cos(a) * 0.4, 1.78, -0.92 + Math.sin(a) * 0.4], quat: surfaceQuat([Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4], [Math.cos(a), -0.6, Math.sin(a)]), color: k % 2 ? 'leaf' : 'vine', weights: neckW }); }

  // --- head: a smaller pumpkin with a carved face ---
  const H = V([0, 2.3, -1.2]);
  B.add(pumpkin(0.78, 0.62, 0.68, 8, 0.09, 28, 16), { pos: H.toArray(), color: 'rind', bone: 'Head' });
  B.add(ell(0.36, 0.26, 0.24, 14, 10), { pos: [0, 2.1, -1.75], color: 'rindLight', bone: 'Head' }); // muzzle
  for (const [, x] of SIDES) {
    // carved triangle eyes (glowing) with a dark rim, tilted for a cheeky look
    const ep = [0.3 * x, 2.43, -1.78];
    const q = surfaceQuat([0.25 * x, 0.1, -1], [0, 1, 0]).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, Math.PI / 2 + 0.25 * x, 0)));
    B.add(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 3), { pos: ep, quat: q, color: 'carve', bone: 'Head' });
    B.add(new THREE.CylinderGeometry(0.17, 0.17, 0.07, 3), { pos: [ep[0] + 0.005 * x, ep[1], ep[2] - 0.02], quat: q, mesh: 'Eyes', bone: 'Head' });
    B.add(ell(0.05, 0.05, 0.03, 8, 6), { pos: [ep[0] - 0.02 * x, ep[1] - 0.03, ep[2] - 0.06], color: 'pupil', bone: 'Head' });
    B.add(ell(0.025, 0.025, 0.02, 6, 4), { pos: [ep[0] + 0.04 * x, ep[1] + 0.04, ep[2] - 0.07], color: 'white', bone: 'Head' });
    // leaf ears
    const e = V(W[`Ear${x < 0 ? 'L' : 'R'}`]), d = V([0.45 * x, 1, 0.15]).normalize();
    B.add(blade(0.75, 0.3, 0.05), { pos: e.clone().addScaledVector(d, -0.25).toArray(), quat: surfaceQuat([0, 0.1, -1], d.toArray()), color: 'leaf', bone: `Ear${x < 0 ? 'L' : 'R'}` });
    B.add(blade(0.6, 0.06, 0.06), { pos: e.clone().addScaledVector(d, -0.22).add(V([0, 0, -0.03])).toArray(), quat: surfaceQuat([0, 0.1, -1], d.toArray()), color: 'vineDeep', bone: `Ear${x < 0 ? 'L' : 'R'}` });
    // whiskers: thin tendrils
    for (const dy of [0.04, -0.06]) B.add(loft({ points: [[0.28 * x, 2.1 + dy, -1.85], [0.55 * x, 2.12 + dy, -1.85], [0.75 * x, 2.18 + dy * 2, -1.75]], rx: () => 0.015, ry: () => 0.015, rings: 6, seg: 4 }), { color: 'vineDeep', bone: 'Head' });
  }
  // little carved nose
  B.add(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 3), { pos: [0, 2.22, -1.97], quat: surfaceQuat([0, 0.1, -1], [0, -1, 0]).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, Math.PI / 2, 0))), mesh: 'GlowCore', bone: 'Head' });
  // grin on the jaw: glowing slit with two square teeth
  B.add(new THREE.TorusGeometry(0.3, 0.06, 5, 16, Math.PI), { pos: [0, 2.08, -1.86], rot: [0.2, 0, Math.PI], scale: [1, 0.55, 1], color: 'carve', bone: 'Jaw' });
  B.add(new THREE.TorusGeometry(0.3, 0.04, 5, 16, Math.PI), { pos: [0, 2.08, -1.89], rot: [0.2, 0, Math.PI], scale: [1, 0.55, 1], mesh: 'Glow', bone: 'Jaw' });
  for (const [, x] of SIDES) B.add(new THREE.BoxGeometry(0.08, 0.07, 0.04), { pos: [0.12 * x, 1.97, -1.92], color: 'rindLight', bone: 'Jaw' });
  // curly stem on the head + leaf
  B.add(loft({ points: [[0, 2.85, -1.2], [0.05, 3.15, -1.15], [0.25, 3.3, -1.0], [0.38, 3.18, -0.88]], rx: (t) => 0.11 * (1 - 0.6 * t), ry: (t) => 0.11 * (1 - 0.6 * t), rings: 12, seg: 8 }), { color: 'stem', bone: 'Head' });
  B.add(new THREE.CylinderGeometry(0.16, 0.13, 0.08, 8), { pos: [0, 2.88, -1.2], color: 'stemDeep', bone: 'Head' });
  B.add(blade(0.55, 0.28, 0.03), { pos: [0.02, 3.05, -1.18], quat: surfaceQuat([-0.3, 1, 0], [-1, 0.3, -0.4]), color: 'leafLight', bone: 'Head' });
  B.add(loft({ points: [[0, 3.0, -1.2], [-0.25, 3.05, -1.35], [-0.35, 3.18, -1.2], [-0.22, 3.25, -1.12]], rx: () => 0.025, ry: () => 0.025, rings: 10, seg: 4 }), { color: 'vine', bone: 'Head' });

  // --- vine legs with leaf cuffs and little pumpkin paws ---
  legs(B, W, { front: { r: [0.27, 0.17] }, back: { r: [0.3, 0.18] }, color: 'vine', footColor: 'rind', clawColor: null, foot: 'stub', thighs: false });
  for (const [s, x] of SIDES) for (const k of ['Front', 'Back']) {
    const U = V(W[`${k}${s}Upper`]), P = V(W[`${k}${s}Paw`]);
    B.add(pumpkin(0.24, 0.17, 0.26, 6, 0.12, 14, 8), { pos: [P.x, 0.17, P.z - 0.04], color: 'rind', bone: `${k}${s}Paw` });
    for (let j = 0; j < 4; j++) { const a = (j / 4) * Math.PI * 2 + 0.4; B.add(blade(0.26, 0.1, 0.03), { pos: [P.x + Math.cos(a) * 0.12, 0.38, P.z + Math.sin(a) * 0.12], quat: surfaceQuat([Math.cos(a), 0.4, Math.sin(a)], [Math.cos(a) * 0.4, -1, Math.sin(a) * 0.4]), color: j % 2 ? 'leaf' : 'leafLight', bone: `${k}${s}Paw` }); }
    if (k === 'Back') B.add(ell(0.32, 0.38, 0.38, 10, 8), { pos: [U.x * 0.9, U.y - 0.05, U.z + 0.05], color: 'rindDeep', bone: `Back${s}Upper` });
  }
  // --- curling vine tail with tendrils, a leaf and a flame at the tip ---
  const tl = tail(B, { pts: [[0, 1.4, 1.05], [0, 2.0, 1.45], [0, 2.6, 1.35], [0, 2.95, 0.95], [0, 3.05, 0.5]], r: (t) => 0.1 * (1 - 0.5 * t) + 0.02, color: 'vine', rings: 24, seg: 8 });
  for (const t of [0.3, 0.6]) { const c = tl.curve.getPoint(t); B.add(blade(0.45, 0.2, 0.03), { pos: c.toArray(), quat: surfaceQuat([1, 0.2, 0], tl.curve.getTangent(t).add(V([0, 0.6, 0])).toArray()), color: 'leaf', weights: () => tl.w(t) }); }
  const tip = V(W.TailTip);
  B.add(flame(0.28, 0.85, { twist: 2.2 }), { pos: tip.clone().add(V([0, -0.05, 0])).toArray(), quat: quatTo([0, 1, -0.2]), mesh: 'Glow', bone: 'TailTip' });
  B.add(flame(0.14, 0.5, { twist: -2 }), { pos: tip.toArray(), quat: quatTo([0, 1, -0.2]), mesh: 'GlowCore', bone: 'TailTip' });
}

export default {
  name: 'Pumpkit', element: 'Fire', palette, glow, bones, build, warp: shortenLegs(0.38, 0.3, 1.1),
  style: { tip: 'TailTip', dur: { Idle: 2.2, Walk: 0.8, Run: 0.48, Attack: 0.9, Roar: 2.0 }, bob: 1.2, sway: 1.1, tail: 1.2 },
  bg: '#221a24', light: { bone: 'Spine', color: '#ff9a3a' }, outline: '#140a06', fit: { hero: 0.8, sprite: 0.8 },
};
