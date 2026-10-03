// Lunowl (Shadow): a round midnight owl. Indigo feathers, a pale heart-shaped face disc around
// huge amber eyes, ear tufts, a glowing crescent moon on its forehead, star-speckled wings
// folded at its sides, a chevron-feathered chest, a hooked beak and fluffy legs with talons.
// Biped rig: Back* bones are the legs, the wings use the Wing bones (Front* are unused).
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, blend, quadBones, addEye, blade } from '../lib.js';

const palette = [
  ['feather', '#4a4a8e'], ['featherDeep', '#2f2f66'], ['featherLight', '#7a78c4'], ['face', '#ece4ff'], ['faceRim', '#a8a0dc'],
  ['belly', '#cfc8f2'], ['chevron', '#8a84cc'], ['beak', '#f2c14e'], ['beakDeep', '#b8841c'], ['talon', '#2a2440'], ['leg', '#bdb6ea'],
  ['nose', '#2a2440'], ['mouth', '#7a2a4a'], ['pupil', '#140e22'], ['white', '#ffffff'], ['wingTip', '#25204e'],
];
const glow = { Eyes: '#ffd24a', Glow: '#a8bcff', GlowCore: '#fff6c8' };

const bones = quadBones({
  hips: [1.35, 0.1], spine: [1.75, 0.05], chest: [2.15, 0.0], neck: [2.6, -0.05], head: [2.95, -0.1], jaw: [2.75, -0.8],
  ear: [0.55, 3.75, -0.2],
  tail: [[1.2, 0.75], [1.0, 0.95], [0.85, 1.1], [0.75, 1.2], [0.68, 1.28]],
  front: { x: 0.3, upper: [2.1, 0.1], lower: [1.9, 0.1], paw: [1.7, 0.1] }, // unused (inside the body)
  back: { x: 0.36, upper: [0.95, -0.05], lower: [0.55, -0.12], paw: [0.18, -0.15] },
  wing: { upper: [1.02, 2.45, 0.05], lower: [1.22, 1.9, 0.3], tip: [1.15, 1.3, 0.62] },
});

function build(B, W) {
  // --- round body: one big soft egg shape with a pale belly ---
  const bodyW = (p) => blend([[1.3, 'Hips'], [1.75, 'Spine'], [2.15, 'Chest'], [2.6, 'Neck']], p.y);
  B.add(ell(1.05, 1.15, 1.0, 26, 18), { pos: [0, 1.85, 0.05], color: 'feather', weights: bodyW });
  B.add(ell(0.82, 0.95, 0.5, 20, 14), { pos: [0, 1.7, -0.5], color: 'belly', weights: bodyW });
  // chevron feather marks on the belly
  for (let row = 0; row < 4; row++) for (let k = 0; k < 4 - (row === 3 ? 1 : 0); k++) {
    const x = (k - (row === 3 ? 1 : 1.5)) * 0.3, y = 2.15 - row * 0.3, z = -0.92 + Math.abs(x) * 0.25 + row * 0.02;
    for (const sx of [-1, 1]) B.add(ell(0.1, 0.03, 0.03, 6, 3), { pos: [x + sx * 0.06, y, z], rot: [0, 0, sx * 0.6], color: 'chevron', weights: bodyW });
  }
  // fluffy feather tufts along the sides and back
  for (let k = 0; k < 12; k++) { const a = Math.PI * 0.15 + (k / 11) * Math.PI * 0.7, y = 1.25 + (k % 3) * 0.12; B.add(cone(0.16, 0.38, 5), { pos: [Math.cos(a) * 0.98, y, Math.sin(a) * 0.9 + 0.05], quat: quatTo([Math.cos(a), -0.8, Math.sin(a)]), color: k % 2 ? 'featherLight' : 'feather', weights: bodyW }); }

  // --- head: big round head merged into the body, heart-shaped face disc ---
  B.add(ell(1.0, 0.85, 0.92, 26, 18), { pos: [0, 3.0, -0.1], color: 'feather', bone: 'Head' });
  for (const [, x] of SIDES) {
    // each half of the face disc is a flattened dish around one eye
    B.add(ell(0.5, 0.52, 0.18, 20, 12), { pos: [0.36 * x, 3.0, -0.85], rot: [0, 0.32 * x, 0], color: 'faceRim', bone: 'Head' });
    B.add(ell(0.44, 0.46, 0.17, 20, 12), { pos: [0.36 * x, 3.0, -0.9], rot: [0, 0.32 * x, 0], color: 'face', bone: 'Head' });
    addEye(B, x, [0.36 * x, 3.03, -1.0], { r: [0.3, 0.3, 0.14], pupil: [0.16, 0.16], th: -0.32 * x, lid: 'feather', lidAngle: 0.55, lidTilt: 0.35, lidRoll: 0.3 });
    // ear tufts
    const e = V(W[`Ear${x < 0 ? 'L' : 'R'}`]);
    for (let k = 0; k < 3; k++) B.add(cone(0.12 - k * 0.025, 0.65 - k * 0.12, 6), { pos: e.clone().add(V([k * 0.1 * x, 0.2 - k * 0.05, k * 0.12])).toArray(), quat: quatTo([0.45 * x, 1, 0.25 + k * 0.1]), color: k ? 'featherDeep' : 'feather', bone: `Ear${x < 0 ? 'L' : 'R'}` });
    // fluffy cheeks
    B.add(cone(0.18, 0.45, 6), { pos: [0.86 * x, 2.75, -0.45], quat: quatTo([x, -0.5, -0.1]), color: 'featherLight', bone: 'Head' });
  }
  // V-shaped brow ridge between the eyes
  for (const [, x] of SIDES) B.add(ell(0.32, 0.07, 0.1, 10, 6), { pos: [0.2 * x, 3.38, -1.0], rot: [0, 0.3 * x, -0.45 * x], color: 'featherDeep', bone: 'Head' });
  // hooked beak (upper on Head, lower on Jaw)
  const beak = new THREE.ConeGeometry(0.13, 0.42, 8); beak.rotateX(-Math.PI / 2 - 0.9);
  B.add(beak, { pos: [0, 2.82, -1.12], color: 'beak', bone: 'Head' });
  B.add(ell(0.12, 0.1, 0.12, 10, 8), { pos: [0, 2.92, -1.05], color: 'beak', bone: 'Head' });
  B.add(cone(0.08, 0.15, 6), { pos: [0, 2.7, -1.08], rot: [Math.PI, 0, 0], color: 'beakDeep', bone: 'Jaw' });
  // glowing crescent moon on the forehead
  const cres = new THREE.TorusGeometry(0.18, 0.05, 6, 16, Math.PI * 1.2);
  B.add(cres, { pos: [0, 3.55, -0.88], rot: [-0.35, 0, -0.6 + Math.PI], mesh: 'GlowCore', bone: 'Head' });
  for (const [dx, dy] of [[-0.3, 3.62], [0.32, 3.66], [0.18, 3.78]]) B.add(ell(0.035, 0.035, 0.03, 4, 3), { pos: [dx, dy, -0.8], mesh: 'Glow', bone: 'Head' });

  // --- folded wings: layered feathers hanging along each side, star speckles ---
  for (const [s, x] of SIDES) {
    const S = V(W[`Wing${s}Upper`]), E = V(W[`Wing${s}Lower`]), Tp = V(W[`Wing${s}Tip`]);
    const ww = (p) => blend([[-S.y, `Wing${s}Upper`], [-E.y + 0.15, `Wing${s}Upper`], [-E.y - 0.1, `Wing${s}Lower`], [-Tp.y + 0.2, `Wing${s}Lower`], [-Tp.y, `Wing${s}Tip`]], -p.y);
    const arm = new THREE.CatmullRomCurve3([S, E, Tp, Tp.clone().add(V([-0.05 * x, -0.45, 0.35]))]);
    B.add(loft({ points: [S, E, Tp].map((v) => v.toArray()), rx: () => 0.2, ry: () => 0.16, rings: 10, seg: 8 }), { color: 'feather', weights: ww });
    const out = V([x, 0, 0]);
    for (const [layer, n, len0, len1, col] of [[0, 8, 0.85, 1.4, 'wingTip'], [1, 8, 0.65, 1.0, 'featherDeep'], [2, 7, 0.45, 0.62, 'featherLight']]) {
      for (let i = 0; i < n; i++) {
        const u = 0.08 + (i / (n - 1)) * 0.8, base = arm.getPoint(u);
        const dir = V([0.08 * x, -1, 0.55 + u * 0.6]).normalize();
        const len = len0 + (len1 - len0) * u;
        B.add(blade(len, 0.27 + layer * 0.02, 0.04), { pos: base.clone().addScaledVector(out, 0.04 * layer).toArray(), quat: surfaceQuat(out.toArray(), dir.toArray()), color: i % 2 && layer === 1 ? 'feather' : col, weights: ww });
      }
    }
    for (let k = 0; k < 6; k++) { const u = 0.2 + k * 0.12, p = arm.getPoint(u).add(V([0.14 * x, -0.25 - (k % 2) * 0.25, 0.15 + (k % 3) * 0.12])); B.add(ell(0.045, 0.045, 0.03, 4, 3), { pos: p.toArray(), mesh: k % 3 ? 'Glow' : 'GlowCore', weights: ww }); }
  }

  // --- tail feathers fanning down behind ---
  const tailB = ['Tail1', 'Tail2', 'Tail3', 'Tail4', 'TailTip'];
  for (let k = 0; k < 5; k++) { const a = (k - 2) * 0.22; B.add(blade(0.85, 0.2, 0.04), { pos: [Math.sin(a) * 0.2, 1.15, 0.85], quat: surfaceQuat([0, 0.5, 1], [Math.sin(a) * 0.5, -0.55, 1]), color: k % 2 ? 'featherDeep' : 'wingTip', bone: tailB[Math.min(4, 1 + Math.abs(k - 2))] }); }

  // --- fluffy legs with dark talons ---
  for (const [s, x] of SIDES) {
    const U = V(W[`Back${s}Upper`]), L = V(W[`Back${s}Lower`]), P = V(W[`Back${s}Paw`]);
    B.add(ell(0.3, 0.36, 0.3, 12, 10), { pos: U.toArray(), color: 'leg', bone: `Back${s}Upper` });
    B.add(loft({ points: [U.toArray(), L.toArray(), P.clone().add(V([0, 0.05, 0])).toArray()], rx: () => 0.13, ry: () => 0.13, rings: 6, seg: 8 }), { color: 'leg', bone: `Back${s}Lower` });
    for (let k = 0; k < 4; k++) B.add(cone(0.1, 0.25, 5), { pos: [L.x + Math.cos(k * 1.6) * 0.1, L.y - 0.05, L.z + Math.sin(k * 1.6) * 0.1], quat: quatTo([Math.cos(k * 1.6), -0.6, Math.sin(k * 1.6)]), color: 'belly', bone: `Back${s}Lower` });
    for (const a of [-0.45, 0, 0.45]) { const d = V([Math.sin(a), 0, -Math.cos(a)]); B.add(ell(0.06, 0.06, 0.18, 6, 5), { pos: P.clone().addScaledVector(d, 0.18).setY(0.07).toArray(), rot: [0, Math.atan2(d.x, d.z), 0], color: 'leg', bone: `Back${s}Paw` }); B.add(cone(0.04, 0.16, 5), { pos: P.clone().addScaledVector(d, 0.36).setY(0.05).toArray(), quat: quatTo([d.x, -0.6, d.z]), color: 'talon', bone: `Back${s}Paw` }); }
    B.add(cone(0.04, 0.14, 5), { pos: [P.x, 0.06, P.z + 0.18], quat: quatTo([0, -0.5, 1]), color: 'talon', bone: `Back${s}Paw` });
  }
}

export default {
  name: 'Lunowl', element: 'Shadow', palette, glow, bones, build,
  style: { body: 'biped', wings: true, attack: 'peck', tip: 'TailTip', dur: { Idle: 2.6, Walk: 0.8, Run: 0.5, Attack: 0.9, Roar: 2.4 }, walk: [0.3, 0.4, 0.45, 0.5], run: [0.5, 0.6, 0.7, 0.75], bob: 1.3, sway: 1.4, roll: 0.07, tail: 0.5, armSwing: 0 },
  bg: '#141226', light: { bone: 'Head', color: '#ffd24a' }, outline: '#08061a', bloom: 0.5, fit: { hero: 0.9, roar: 0.95, sprite: 0.9 },
  views: { hero: [-8, 2.2, -9], roar: [-7.5, 1.0, -7], sprite: [-9, 1.8, -9] },
};
