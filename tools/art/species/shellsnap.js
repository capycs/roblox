// Shellsnap (Water): stout reef turtle. A tall domed shell of hex plates with glowing
// seams and coral growing on top, a beaked face with a head fin, and stubby flipper legs.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, quadBones, addEye, blade } from '../lib.js';
import { neck, legs, tail } from '../kit.js';

const palette = [
  ['skin', '#4fa9a0'], ['skinDeep', '#2f7a74'], ['skinLight', '#8ad6c4'], ['belly', '#f2e2b0'], ['shell', '#2c5f8a'], ['shellDeep', '#1d4266'],
  ['plate', '#3f7fb0'], ['rim', '#e8d29a'], ['coral', '#ff7a6b'], ['coralDeep', '#e0503f'], ['beak', '#e8c27a'],
  ['nose', '#13223a'], ['mouth', '#7a2a3e'], ['pupil', '#0b1626'], ['white', '#ffffff'],
];
const glow = { Eyes: '#6ff4ff', Glow: '#38e2ff', GlowCore: '#bff8ff' };

const bones = quadBones({
  hips: [1.6, 1.0], spine: [1.95, 0.1], chest: [1.7, -0.85], neck: [1.75, -1.45], head: [2.05, -1.95], jaw: [1.75, -2.3],
  ear: [0.5, 2.5, -1.95],
  tail: [[1.35, 1.75], [1.25, 2.05], [1.15, 2.3], [1.05, 2.48], [0.95, 2.6]],
  front: { x: 1.0, upper: [1.2, -0.85], lower: [0.7, -1.05], paw: [0.25, -1.15] },
  back: { x: 1.0, upper: [1.2, 1.0], lower: [0.7, 1.2], paw: [0.25, 1.25] },
});

function build(B, W) {
  const shellW = (p) => [['Spine', 0.6], [p.z < 0 ? 'Chest' : 'Hips', 0.4]];
  // body core + belly plate (plastron)
  B.add(ell(1.15, 0.7, 1.55, 22, 14), { pos: [0, 1.35, 0.05], color: 'skin', weights: shellW });
  B.add(ell(1.2, 0.25, 1.6, 20, 8), { pos: [0, 1.05, 0.05], color: 'belly', weights: shellW });
  // domed shell
  const dome = new THREE.SphereGeometry(1.55, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2); dome.scale(1.0, 0.95, 1.18);
  B.add(dome, { pos: [0, 1.45, 0.05], color: 'shell', weights: shellW });
  B.add(new THREE.TorusGeometry(1.56, 0.13, 6, 28), { pos: [0, 1.45, 0.05], rot: [Math.PI / 2, 0, 0], scale: [1, 1.18, 1], color: 'rim', weights: shellW });
  // hex plates on the dome with glowing seams between
  const plates = [[0, 1.0, 0.0, 0.42]];
  for (let k = 0; k < 6; k++) plates.push([k * Math.PI / 3, 0.62, 0.36, 0.38]);
  for (let k = 0; k < 10; k++) plates.push([k * Math.PI / 5 + 0.3, 0.22, 0.42, 0.3]);
  for (const [a, el] of plates.map(([a, e]) => [a, e])) {
    const n = V([Math.cos(a) * Math.cos(el * Math.PI / 2), Math.sin(el * Math.PI / 2), Math.sin(a) * Math.cos(el * Math.PI / 2)]).normalize();
    const p = V([n.x * 1.55, n.y * 1.47, n.z * 1.83]).add(V([0, 1.45, 0.05]));
    const r = el > 0.9 ? 0.42 : el > 0.5 ? 0.4 : 0.34;
    B.add(new THREE.CylinderGeometry(r * 1.05, r * 1.05, 0.05, 6), { pos: p.clone().addScaledVector(n, -0.005).toArray(), quat: quatTo(n.toArray()), mesh: 'Glow', weights: shellW });
    B.add(new THREE.CylinderGeometry(r * 0.9, r, 0.12, 6), { pos: p.clone().addScaledVector(n, 0.03).toArray(), quat: quatTo(n.toArray()), color: (Math.round(a * 10) % 2) ? 'plate' : 'shellDeep', weights: shellW });
  }
  // coral growing on top
  const br = (x, z, h, a, c) => B.add(loft({ points: [[x, 2.75, z], [x + Math.cos(a) * 0.15, 2.75 + h * 0.5, z + Math.sin(a) * 0.15], [x + Math.cos(a) * 0.35, 2.75 + h, z + Math.sin(a) * 0.35]], rx: (t) => 0.1 * (1 - 0.4 * t), ry: (t) => 0.1 * (1 - 0.4 * t), rings: 6, seg: 6 }), { color: c, bone: 'Spine' });
  [[0.1, 0.2, 0.8, 0.3], [-0.2, 0.1, 0.6, 2.4], [0.25, -0.15, 0.55, 4.5], [-0.1, -0.2, 0.7, 5.5]].forEach(([x, z, h, a], i) => br(x, z, h, a, i % 2 ? 'coralDeep' : 'coral'));
  // neck + head with beak and a little fin
  neck(B, { pts: [[0, 1.45, -1.3], [0, 1.65, -1.6], [0, 2.0, -1.95]], r: 0.42, color: 'skin', yChest: 1.5, yNeck: 1.75, yHead: 2.0 });
  B.add(ell(0.55, 0.5, 0.6, 20, 14), { pos: [0, 2.08, -2.05], color: 'skin', bone: 'Head' });
  B.add(taperFront(ell(0.34, 0.24, 0.35, 14, 10), 0.3), { pos: [0, 1.9, -2.5], color: 'beak', bone: 'Head' });
  B.add(cone(0.08, 0.2, 6), { pos: [0, 1.78, -2.78], quat: quatTo([0, -1, -0.6]), color: 'beak', bone: 'Head' });
  B.add(taperFront(ell(0.26, 0.1, 0.3), 0.3), { pos: [0, 1.7, -2.4], color: 'beak', bone: 'Jaw' });
  B.add(taperFront(ell(0.2, 0.04, 0.26, 10, 6), 0.3), { pos: [0, 1.78, -2.42], color: 'mouth', bone: 'Jaw' });
  B.add(blade(0.7, 0.35, 0.05), { pos: [0, 2.5, -1.9], quat: surfaceQuat([1, 0, 0], [0, 0.6, 0.8]), color: 'skinLight', bone: 'Head' });
  B.add(blade(0.4, 0.12, 0.06), { pos: [0, 2.52, -1.88], quat: surfaceQuat([1, 0, 0], [0, 0.6, 0.8]), mesh: 'Glow', bone: 'Head' });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.3 * x, 2.18, -2.48], { r: [0.17, 0.19, 0.1], pupil: [0.08, 0.1], th: -0.45 * x, lid: 'skinDeep', lidAngle: 0.85, brow: { color: 'skinDeep', len: 0.2, tilt: 0.3 } });
    B.add(ell(0.13, 0.13, 0.03, 8, 5), { pos: [0.47 * x, 1.95, -2.3], quat: surfaceQuat([x, 0, -0.5], [0, 1, 0]), color: 'skinLight', bone: 'Head' });
  }
  // stubby flipper legs
  legs(B, W, { front: { r: [0.36, 0.3], top: 0.15 }, back: { r: [0.34, 0.28], top: 0.15 }, color: 'skin', footColor: 'skinDeep', clawColor: 'belly', foot: 'stub', thighs: false });
  tail(B, { pts: [[0, 1.3, 1.6], [0, 1.25, 2.05], [0, 1.15, 2.3], [0, 1.05, 2.48], [0, 0.95, 2.6]], r: (t) => 0.2 * (1 - 0.85 * t) + 0.02, color: 'skin', rings: 10, seg: 8 });
}

export default {
  name: 'Shellsnap', element: 'Water', palette, glow, bones, build,
  style: { tip: 'TailTip', attack: 'charge', dur: { Idle: 3.0, Walk: 1.2, Run: 0.75, Attack: 1.2, Roar: 2.4 }, walk: [0.4, 0.5, 0.4, 0.45], run: [0.65, 0.7, 0.6, 0.65], bob: 0.7, roll: 0.06, sway: 0.6, tail: 0.6 },
  bg: '#0e1c25', light: { bone: 'Spine', color: '#38e2ff' }, outline: '#06121a',
};
