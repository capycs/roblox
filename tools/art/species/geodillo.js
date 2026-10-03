// Geodillo (Shadow): a stocky armadillo whose banded shell has cracked open into amethyst
// geodes. Shoulder and hip shields, ridged bands, a long snout with a nose plate, big oval
// ears, heavy digging claws and a ringed tail ending in a crystal club.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, quadBones, addEye, rock, crystal } from '../lib.js';
import { legs, tail } from '../kit.js';

const palette = [
  ['skin', '#c9a68e'], ['skinDeep', '#9a7562'], ['belly', '#ecd6c2'], ['plate', '#6b5a7e'], ['plateDeep', '#4a3d5c'], ['plateLight', '#8f7ba6'],
  ['geode', '#3a2c40'], ['geodeRim', '#d9cfe0'], ['amethyst', '#a46ae0'], ['amethystLight', '#d6b4ff'], ['amethystDeep', '#6c3aa8'],
  ['claw', '#f3ead8'], ['nose', '#2a1e2a'], ['mouth', '#7a3346'], ['pupil', '#1a1020'], ['white', '#ffffff'],
];
const glow = { Eyes: '#e2b8ff', Glow: '#b56bff', GlowCore: '#f0dcff' };

const bones = quadBones({
  hips: [1.25, 0.75], spine: [1.42, 0.0], chest: [1.3, -0.72], neck: [1.3, -1.35], head: [1.45, -1.8], jaw: [1.12, -2.13],
  ear: [0.38, 2.05, -1.65],
  tail: [[1.1, 1.45], [0.95, 1.95], [0.82, 2.4], [0.72, 2.8], [0.66, 3.1]],
  front: { x: 0.62, upper: [1.0, -0.78], lower: [0.55, -0.88], paw: [0.18, -0.95] },
  back: { x: 0.66, upper: [1.0, 0.78], lower: [0.55, 0.92], paw: [0.18, 0.82] },
});

const RX = 1.05, RY = 0.95, RZ = 1.6, CY = 1.2; // shell ellipsoid
const shellPt = (a, z, k = 1) => { const f = Math.sqrt(Math.max(0, 1 - (z / RZ) ** 2)); return V([Math.cos(a) * RX * f * k, CY + Math.sin(a) * RY * f * k, z]); };

function build(B, W) {
  const bodyW = (p) => (p.z < -0.45 ? [['Chest', 0.8], ['Spine', 0.2]] : p.z > 0.45 ? [['Hips', 0.8], ['Spine', 0.2]] : [['Spine', 1]]);
  // soft body underneath and pale belly
  B.add(ell(0.92, 0.72, 1.45, 22, 14), { pos: [0, 1.05, 0], color: 'skin', weights: bodyW });
  B.add(ell(0.75, 0.4, 1.25, 18, 8), { pos: [0, 0.78, -0.05], color: 'belly', weights: bodyW });
  // shell: upper part of an ellipsoid
  const dome = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6); dome.rotateX(0); dome.scale(RX, RY, RZ);
  B.add(dome, { pos: [0, CY - 0.05, 0], color: 'plate', weights: bodyW });
  // shoulder and hip shields (lighter, with scale bumps), ridged bands in between
  for (const [z0, z1, col] of [[-1.6, -0.75, 'plateLight'], [0.8, 1.6, 'plateLight']]) {
    const sh = new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.6); sh.scale(RX * 1.02, RY * 1.02, RZ * 1.02);
    const P = sh.attributes.position; for (let i = 0; i < P.count; i++) { const z = P.getZ(i); if (z < Math.min(z0, z1) || z > Math.max(z0, z1)) P.setXYZ(i, P.getX(i) * 0.97, P.getY(i) * 0.97, z); }
    sh.computeVertexNormals();
    B.add(sh, { pos: [0, CY - 0.05, 0], color: col, weights: bodyW });
    for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) {
      const a = 0.35 + (k / 8) * (Math.PI - 0.7), z = z0 + (z1 - z0) * (0.2 + r * 0.3), p = shellPt(a, z, 1.04);
      B.add(new THREE.CylinderGeometry(0.1, 0.11, 0.05, 6), { pos: p.toArray(), quat: quatTo([Math.cos(a), Math.sin(a), z / RZ * 0.5]), color: 'plate', weights: bodyW });
    }
  }
  for (let i = 0; i < 6; i++) {
    const z = -0.62 + i * 0.25, f = Math.sqrt(1 - (z / RZ) ** 2);
    B.add(new THREE.TorusGeometry(1, 0.07, 6, 28, Math.PI * 1.2), { pos: [0, CY - 0.05, z], rot: [0, 0, -Math.PI * 0.1], scale: [RX * f * 1.03, RY * f * 1.03, 1], color: 'plateDeep', weights: bodyW });
  }
  // shell skirt edge
  B.add(new THREE.TorusGeometry(1, 0.08, 6, 36), { pos: [0, CY - 0.36, 0], rot: [Math.PI / 2, 0, 0], scale: [RX * 0.95, RZ * 0.95, 1], color: 'plateDeep', weights: bodyW });

  // --- amethyst geodes bursting through the shell ---
  const geode = (a, z, s, seed) => {
    const p = shellPt(a, z, 0.98), n = V([Math.cos(a), Math.sin(a) * 1.2, z / RZ * 0.6]).normalize();
    const q = quatTo(n.toArray());
    const cup = rock(0.42 * s, seed, 0.55, 1);
    B.add(cup, { pos: p.toArray(), quat: q, color: 'geode', weights: bodyW });
    B.add(new THREE.TorusGeometry(0.36 * s, 0.07 * s, 5, 12), { pos: p.clone().addScaledVector(n, 0.16 * s).toArray(), quat: q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))), color: 'geodeRim', weights: bodyW });
    const n0 = 7;
    for (let k = 0; k < n0; k++) {
      const ang = (k / n0) * Math.PI * 2 + seed, rr = k === 0 ? 0 : 0.18 * s, tilt = k === 0 ? 0 : 0.45;
      const local = new THREE.Vector3(Math.cos(ang) * rr, 0.05, Math.sin(ang) * rr).applyQuaternion(q);
      const d = new THREE.Vector3(Math.cos(ang) * tilt, 1, Math.sin(ang) * tilt).applyQuaternion(q);
      const h = (k === 0 ? 0.85 : 0.45 + 0.15 * ((k * 7) % 3)) * s;
      B.add(crystal(k === 0 ? 0.13 * s : 0.08 * s, h), { pos: p.clone().add(local).toArray(), quat: quatTo(d.toArray()), color: k === 0 ? 'amethystLight' : k % 2 ? 'amethyst' : 'amethystDeep', weights: bodyW });
    }
    for (let k = 0; k < 3; k++) { const ang = (k / 3) * Math.PI * 2 + seed + 0.5; const local = new THREE.Vector3(Math.cos(ang) * 0.24 * s, 0.05, Math.sin(ang) * 0.24 * s).applyQuaternion(q); B.add(crystal(0.05 * s, 0.3 * s), { pos: p.clone().add(local).toArray(), quat: quatTo(new THREE.Vector3(Math.cos(ang) * 0.6, 1, Math.sin(ang) * 0.6).applyQuaternion(q).toArray()), mesh: 'Glow', weights: bodyW }); }
    B.add(ell(0.12 * s, 0.06 * s, 0.12 * s, 8, 5), { pos: p.clone().addScaledVector(n, 0.12 * s).toArray(), quat: q, mesh: 'GlowCore', weights: bodyW });
  };
  geode(Math.PI / 2, -0.1, 1.15, 1);
  geode(Math.PI / 2 + 0.75, 0.55, 0.8, 2);
  geode(Math.PI / 2 - 0.8, -0.55, 0.75, 3);
  geode(Math.PI / 2 - 0.5, 1.05, 0.6, 4);

  // head sits forward of the shoulder shield (everything below shifted -Z)
  const H = { add: (g, o) => B.add(g, { ...o, pos: [o.pos[0], o.pos[1], o.pos[2] - 0.35] }) };
  B.add(ell(0.5, 0.48, 0.55, 16, 12), { pos: [0, 1.32, -1.4], color: 'skin', weights: (p) => [['Neck', 0.6], ['Chest', 0.4]] });
  // --- head: long tapered snout, helmet plate, big oval ears ---
  H.add(ell(0.55, 0.5, 0.6, 20, 14), { pos: [0, 1.45, -1.45], color: 'skin', bone: 'Head' });
  H.add(taperFront(ell(0.36, 0.3, 0.75, 18, 12), 0.55), { pos: [0, 1.3, -2.0], color: 'skin', bone: 'Head' });
  H.add(ell(0.13, 0.11, 0.08, 10, 6), { pos: [0, 1.28, -2.72], color: 'nose', bone: 'Head' });
  // helmet: armoured cap over the forehead and down the snout
  const helm = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.45); helm.scale(0.5, 0.45, 0.62);
  H.add(helm, { pos: [0, 1.62, -1.52], rot: [-0.25, 0, 0], color: 'plateLight', bone: 'Head' });
  for (let k = 0; k < 3; k++) H.add(taperFront(ell(0.24 - k * 0.04, 0.08, 0.2, 10, 6), 0.3), { pos: [0, 1.56 - k * 0.07, -2.0 - k * 0.22], rot: [-0.25, 0, 0], color: k % 2 ? 'plate' : 'plateLight', bone: 'Head' });
  H.add(taperFront(ell(0.22, 0.08, 0.55), 0.5), { pos: [0, 1.08, -1.95], color: 'belly', bone: 'Jaw' });
  H.add(taperFront(ell(0.17, 0.03, 0.45, 12, 6), 0.5), { pos: [0, 1.15, -1.98], color: 'mouth', bone: 'Jaw' });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.3 * x, 1.6, -2.25], { r: [0.13, 0.15, 0.08], pupil: [0.06, 0.08], th: -0.6 * x, lid: 'skinDeep', lidAngle: 0.6, brow: { color: 'plateDeep', len: 0.16, tilt: 0.3 } });
    const e = V(W[`Ear${s}`]), d = V([0.5 * x, 1, 0.25]).normalize();
    B.add(cone(0.26, 0.85, 12, 0.35), { pos: e.clone().addScaledVector(d, 0.35).toArray(), quat: quatTo(d.toArray()), color: 'skin', bone: `Ear${s}` });
    B.add(cone(0.17, 0.6, 10, 0.2), { pos: e.clone().addScaledVector(d, 0.3).add(V([0, 0, -0.05])).toArray(), quat: quatTo(d.toArray()), color: 'skinDeep', bone: `Ear${s}` });
  }

  // --- short heavy legs with big digging claws ---
  legs(B, W, { front: { r: [0.3, 0.2], top: 0.15 }, back: { r: [0.34, 0.21], top: 0.15 }, color: 'skin', footColor: 'skinDeep', clawColor: 'claw', foot: 'paw' });
  for (const [s, x] of SIDES) {
    const P = V(W[`Front${s}Paw`]);
    for (const dx of [-0.13, 0, 0.13]) B.add(cone(0.06, 0.38, 6), { pos: [P.x + dx, 0.14, P.z - 0.45], quat: quatTo([0, -0.35, -1]), color: 'claw', bone: `Front${s}Paw` });
    for (const k of ['Front', 'Back']) { const L = V(W[`${k}${s}Upper`]); B.add(new THREE.SphereGeometry(0.38, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), { pos: [L.x * 1.02, L.y - 0.05, L.z], rot: [0, 0, -0.5 * x], scale: [1, 0.6, 1.1], color: 'plate', bone: `${k}${s}Upper` }); }
  }

  // --- ringed armoured tail with a crystal club ---
  const tl = tail(B, { pts: [[0, 1.05, 1.4], [0, 0.95, 1.95], [0, 0.82, 2.4], [0, 0.72, 2.8], [0, 0.66, 3.1]], r: (t) => 0.3 * (1 - 0.6 * t) + 0.04, color: 'plate', rings: 22, seg: 10 });
  for (let k = 0; k < 6; k++) { const t = 0.1 + k * 0.14, c = tl.curve.getPoint(t); B.add(new THREE.TorusGeometry(0.3 * (1 - 0.6 * t) + 0.05, 0.05, 5, 12), { pos: c.toArray(), quat: quatTo(tl.curve.getTangent(t).toArray()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))), color: 'plateDeep', weights: () => tl.w(t) }); }
  const tip = V(W.TailTip);
  B.add(rock(0.28, 7, 0.9, 1), { pos: tip.toArray(), color: 'geode', bone: 'TailTip' });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, d = V([Math.cos(a), Math.sin(a), 0.6]).normalize(); B.add(crystal(0.07, 0.42), { pos: tip.clone().addScaledVector(d, 0.15).toArray(), quat: quatTo(d.toArray()), color: k % 2 ? 'amethystLight' : 'amethyst', bone: 'TailTip' }); }
  B.add(crystal(0.06, 0.35), { pos: tip.clone().add(V([0, 0, 0.18])).toArray(), quat: quatTo([0, 0.2, 1]), mesh: 'Glow', bone: 'TailTip' });
}

export default {
  name: 'Geodillo', element: 'Shadow', palette, glow, bones, build,
  style: { tip: 'TailTip', attack: 'charge', dur: { Idle: 2.8, Walk: 1.0, Run: 0.55, Attack: 1.1, Roar: 2.4 }, walk: [0.4, 0.55, 0.38, 0.45], bob: 0.8, roll: 0.04, sway: 0.7, tail: 0.7, headLow: -0.08 },
  bg: '#17121f', light: { bone: 'Spine', color: '#b56bff' }, outline: '#0c0812', fit: { hero: 0.8, sprite: 0.8 },
};
