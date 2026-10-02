// Camp and town clutter: crates, barrels, lanterns, signs, fences, campfire, chest...
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, cyl, box, torus, flame, surfaceQuat, into, flagCloth, rock } from '../lib.js';
import { canopy as leafy } from '../foliage.js';

const C = {
  wood: '#a8703f', woodDark: '#744828', woodLight: '#c99258', metal: '#5b6470', metalDark: '#353b44', rope: '#b89466',
  canvas: '#f4e8cf', canvasRed: '#d9483b', gold: '#f2b33d', goldDeep: '#c27e1c', bone: '#ece2cc', boneShade: '#c9bea6',
  stone: '#8b8e8c', stoneDark: '#5f6466', cloth: '#3d6fc4', clothDark: '#2a4f91',
  leafDeep: '#28552b', leafDark: '#357a2f', leaf: '#4f9a3d', leafLight: '#74b84a', leafTip: '#98cf58', bark: '#8a5a34', shingle: '#c4553f', shingleDark: '#9c3f30', paper: '#fff1c8',
  burlap: '#d2ad74', burlapDark: '#a9844f', grain: '#f2d27a', gem: '#e8473a',
};
const pal = (keys) => keys.map((k) => [k, C[k]]);
const list = [];
const add = (spec) => list.push({ category: 'Clutter', heroSize: [520, 520], fit: 0.95, ...spec });

function crate(B, pos, s = 1, rotY = 0) {
  B.add(box(2 * s, 2 * s, 2 * s), { pos: [pos[0], pos[1] + s, pos[2]], rot: [0, rotY, 0], color: 'wood' });
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0));
  for (const [dx, dz, w, d] of [[0, 1.01, 2.1, 0.12], [0, -1.01, 2.1, 0.12], [1.01, 0, 0.12, 2.1], [-1.01, 0, 0.12, 2.1]]) {
    for (const y of [0.15, 1.85]) B.add(box(w * s, 0.3 * s, d * s), { pos: V([dx * s, (y - 1) * s, dz * s]).applyQuaternion(q).add(V([pos[0], pos[1] + s, pos[2]])).toArray(), quat: q, color: 'woodDark' });
  }
  const at = (x, y, z) => V([x * s, y * s, z * s]).applyQuaternion(q).add(V([pos[0], pos[1] + s, pos[2]])).toArray();
  for (const z of [1.02, -1.02]) B.add(box(0.25 * s, 2.5 * s, 0.14 * s), { pos: at(0, 0, z), quat: q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, z > 0 ? Math.PI / 4 : -Math.PI / 4))), color: 'woodDark' });
  // plank seams on the sides and lid
  for (const y of [-0.3, 0.3]) for (const [x, z, w, d] of [[0, 1.005, 2.0, 0.02], [0, -1.005, 2.0, 0.02], [1.005, 0, 0.02, 2.0], [-1.005, 0, 0.02, 2.0]]) B.add(box(w * s, 0.04 * s, d * s), { pos: at(x, y, z), quat: q, color: 'woodDark' });
  for (const x of [-0.5, 0, 0.5]) B.add(box(0.04 * s, 0.02 * s, 2.0 * s), { pos: at(x, 1.005, 0), quat: q, color: 'woodDark' });
  // iron corner caps
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) for (const y of [1, -1]) B.add(box(0.26 * s, 0.26 * s, 0.26 * s), { pos: at(x * 0.99, y * 0.99, z * 0.99), quat: q, color: 'metalDark' });
}
function barrel(B, pos, s = 1) {
  // 12 bulging staves in two tones, with a hair of gap so they read as planks
  for (let k = 0; k < 12; k++) {
    const g = new THREE.CylinderGeometry(0.85 * s, 0.85 * s, 2.2 * s, 2, 6, false, (k / 12) * Math.PI * 2 + 0.012, Math.PI * 2 / 12 - 0.024); const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const kk = 1 + 0.16 * Math.cos((P.getY(i) / (1.1 * s)) * Math.PI / 2); P.setX(i, P.getX(i) * kk); P.setZ(i, P.getZ(i) * kk); }
    g.computeVertexNormals();
    B.add(g, { pos: [pos[0], pos[1] + 1.1 * s, pos[2]], color: k % 3 === 0 ? 'woodLight' : k % 3 === 1 ? 'wood' : 'woodDark' });
  }
  B.add(cyl(0.9 * s, 0.9 * s, 2.0 * s, 12), { pos: [pos[0], pos[1] + 1.1 * s, pos[2]], color: 'woodDark' });
  for (const y of [0.3, 0.75, 1.45, 1.9]) B.add(torus((y > 0.5 && y < 1.6 ? 0.99 : 0.9) * s, 0.07 * s, 5, 18), { pos: [pos[0], pos[1] + y * s, pos[2]], rot: [Math.PI / 2, 0, 0], color: 'metalDark' });
  B.add(cyl(0.82 * s, 0.82 * s, 0.05, 14), { pos: [pos[0], pos[1] + 2.2 * s, pos[2]], color: 'woodDark' });
}

add({ name: 'Crate', palette: pal(['wood', 'woodDark', 'metalDark']), build(B) { crate(B, [0, 0, 0]); } });
add({ name: 'CrateStack', palette: pal(['wood', 'woodDark', 'metalDark']), build(B) { crate(B, [0, 0, 0]); crate(B, [2.1, 0, 0.2], 1, 0.2); crate(B, [1.0, 2, 0.1], 0.9, -0.3); crate(B, [-0.4, 0, 2.0], 0.7, 0.5); } });
add({ name: 'Barrel', palette: pal(['wood', 'woodDark', 'woodLight', 'metalDark']), build(B) { barrel(B, [0, 0, 0]); } });
add({ name: 'BarrelGroup', palette: pal(['wood', 'woodDark', 'woodLight', 'metalDark']), build(B) { barrel(B, [0, 0, 0]); barrel(B, [1.9, 0, 0.4], 0.9); barrel(B, [0.8, 0, 1.7], 0.85); } });
add({
  name: 'Sack', palette: pal(['burlap', 'burlapDark', 'rope', 'grain', 'canvas']),
  build(B) {
    const sack = (x, z, sc, lean, col) => {
      const g = new THREE.SphereGeometry(0.9, 14, 10), P = g.attributes.position;
      for (let i = 0; i < P.count; i++) { const y = P.getY(i), u = (y + 0.9) / 1.8, k = (1 + 0.22 * Math.sin(u * Math.PI) - 0.35 * u * u) * (1 + 0.05 * Math.sin(Math.atan2(P.getZ(i), P.getX(i)) * 5)); P.setXYZ(i, P.getX(i) * k + lean * u * u * 0.4, Math.max(y, -0.7) * 1.15, P.getZ(i) * k); }
      g.computeVertexNormals();
      B.add(g, { pos: [x, 0.85 * sc, z], scale: [sc, sc, sc], color: col });
      const nx = x + lean * 0.4 * sc, ny = 1.9 * sc;
      B.add(cyl(0.2 * sc, 0.32 * sc, 0.35 * sc, 10), { pos: [nx, ny - 0.1 * sc, z], color: col });
      B.add(torus(0.22 * sc, 0.07 * sc, 5, 12), { pos: [nx, ny, z], rot: [Math.PI / 2, 0, 0], color: 'rope' });
      for (let k = 0; k < 7; k++) { const a = (k / 7) * 6.28; B.add(cone(0.12 * sc, 0.38 * sc, 4), { pos: [nx + Math.cos(a) * 0.14 * sc, ny + 0.2 * sc, z + Math.sin(a) * 0.14 * sc], quat: quatTo([Math.cos(a) * 0.7, 1, Math.sin(a) * 0.7]), color: col }); }
    };
    sack(0, 0, 1, 0.1, 'burlap'); sack(1.2, 0.6, 0.7, -0.6, 'burlapDark');
    B.add(box(0.5, 0.45, 0.05), { pos: [0.25, 1.0, -0.98], rot: [0.12, -0.15, 0.1], color: 'burlapDark' });
    for (let k = 0; k < 9; k++) { const a = k * 0.7 - 1.6; B.add(ell(0.09, 0.06, 0.07, 5, 4), { pos: [Math.cos(a) * (0.95 + (k % 3) * 0.12), 0.05, Math.sin(a) * (0.95 + (k % 3) * 0.12) - 0.25], color: 'grain' }); }
  },
});
add({
  // Wooden hook post with a hanging lantern (Lantern/LanternLamp swing in the wind).
  name: 'LanternPost', v2: true, palette: pal(['wood', 'woodDark', 'bark', 'metalDark', 'gold', 'rope', 'leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip']), glow: { LanternLamp: '#ffd36b' }, heroSize: [440, 640],
  parts: { Lantern: { pivot: [1.2, 6.95, 0] }, LanternLamp: { pivot: [1.2, 6.95, 0] }, Rustle: { pivot: [0, 0, 0] } },
  build(B) {
    const Lt = into(B, 'Lantern');
    B.add(loft({ points: [[0, -0.1, 0], [0.08, 3.5, 0.05], [0, 7.3, 0]], rx: (t) => 0.3 - 0.1 * t, ry: (t) => 0.3 - 0.1 * t, rings: 10, seg: 8 }), { color: 'bark' });
    for (let i = 0; i < 4; i++) { const a = i * 1.6 + 0.3; B.add(cone(0.18, 0.8, 6), { pos: [Math.cos(a) * 0.3, 0.2, Math.sin(a) * 0.3], quat: quatTo([Math.cos(a), -0.6, Math.sin(a)]), color: 'woodDark' }); }
    B.add(box(1.7, 0.22, 0.22), { pos: [0.65, 7.0, 0], color: 'wood' });
    B.add(loft({ points: [[0.05, 6.3, 0], [0.45, 6.75, 0], [0.75, 6.92, 0]], rx: () => 0.06, ry: () => 0.06, rings: 6, seg: 5 }), { color: 'woodDark' });
    Lt.add(cyl(0.025, 0.025, 0.4, 4), { pos: [1.2, 6.78, 0], color: 'rope' });
    Lt.add(cone(0.42, 0.32, 6), { pos: [1.2, 6.45, 0], color: 'metalDark' });
    Lt.add(ell(0.08, 0.08, 0.08, 6, 4), { pos: [1.2, 6.65, 0], color: 'gold' });
    B.add(cyl(0.26, 0.3, 0.62, 6), { pos: [1.2, 5.95, 0], mesh: 'LanternLamp' });
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; Lt.add(cyl(0.03, 0.03, 0.64, 4), { pos: [1.2 + Math.cos(a) * 0.3, 5.95, Math.sin(a) * 0.3], color: 'metalDark' }); }
    Lt.add(cyl(0.34, 0.28, 0.1, 6), { pos: [1.2, 5.6, 0], color: 'metalDark' });
    // ivy climbing the post
    leafy(B, { blobs: [[0.05, 1.0, 0.1, 0.5], [-0.05, 2.0, 0.15, 0.42], [0.1, 3.0, -0.05, 0.34]], shades: ['leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip'], count: 70, size: [0.42, 0.24], seed: 61, cardMesh: 'Rustle' });
  },
});
add({
  name: 'Signpost', palette: pal(['wood', 'woodDark', 'woodLight']), heroSize: [480, 600],
  build(B) { B.add(cyl(0.18, 0.22, 4.6, 8), { pos: [0, 2.3, 0], color: 'woodDark' }); for (const [y, a, w] of [[3.8, 0.3, 2.6], [3.0, -0.5, 2.2], [2.3, 2.6, 2.0]]) { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0)); B.add(box(w, 0.55, 0.14), { pos: V([w / 2 - 0.1, 0, 0.2]).applyQuaternion(q).add(V([0, y, 0])).toArray(), quat: q, color: 'woodLight' }); B.add(cone(0.4, 0.55, 3, 0.25), { pos: V([w - 0.05, 0, 0.2]).applyQuaternion(q).add(V([0, y, 0])).toArray(), quat: q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2))), color: 'woodLight' }); } },
});
add({
  // Rustic split-rail fence: round posts with rope lashing, sagging rails, ivy on one post.
  name: 'FenceSegment', v2: true, parts: { Rustle: { pivot: [0, 0, 0] } }, palette: pal(['wood', 'woodDark', 'bark', 'rope', 'leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip']), heroSize: [640, 420],
  build(B) {
    for (const [x, h, tilt] of [[-3, 2.3, 0.04], [0, 2.5, -0.03], [3, 2.2, 0.05]]) {
      B.add(loft({ points: [[x, -0.1, 0], [x + tilt, h * 0.6, 0], [x + tilt * 1.4, h, 0]], rx: (t) => 0.24 - 0.04 * t, ry: (t) => 0.24 - 0.04 * t, rings: 6, seg: 8 }), { color: 'bark' });
      B.add(cone(0.22, 0.25, 8), { pos: [x + tilt * 1.4, h + 0.1, 0], color: 'woodDark' });
      for (const y of [0.85, 1.75]) B.add(torus(0.27, 0.05, 4, 10), { pos: [x + tilt, y, 0], rot: [Math.PI / 2, 0, 0], color: 'rope' });
    }
    for (const [y, c] of [[0.85, 'wood'], [1.75, 'woodDark']]) for (const [x0, x1] of [[-3, 0], [0, 3]]) {
      B.add(loft({ points: [[x0, y, 0.22], [(x0 + x1) / 2, y - 0.12, 0.24], [x1, y, 0.22]], rx: () => 0.13, ry: () => 0.11, rings: 8, seg: 6 }), { color: c });
    }
    leafy(B, { blobs: [[-3, 0.5, 0.15, 0.45], [-3.05, 1.3, 0.12, 0.36], [-2.5, 1.8, 0.22, 0.28]], shades: ['leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip'], count: 90, size: [0.42, 0.24], seed: 63, cardMesh: 'Rustle' });
    for (let k = 0; k < 7; k++) { const x = -2.6 + k * 0.85; B.add(cone(0.08, 0.45 + (k % 3) * 0.15, 4), { pos: [x, 0.2, 0.05 * (k % 2)], quat: quatTo([(k % 2 ? 0.3 : -0.3), 1, 0.2]), color: k % 2 ? 'leaf' : 'leafLight' }); }
  },
});
add({
  // Half-log bench on two stumps, with a moss patch.
  name: 'Bench', v2: true, parts: { Rustle: { pivot: [0, 0, 0] } }, palette: pal(['wood', 'woodDark', 'woodLight', 'bark', 'leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip']), heroSize: [600, 440],
  build(B) {
    const seat = new THREE.CylinderGeometry(0.55, 0.55, 4.2, 12, 1, false, Math.PI, Math.PI); seat.rotateZ(Math.PI / 2);
    B.add(seat, { pos: [0, 1.05, 0], color: 'bark' });
    B.add(box(4.2, 0.04, 1.08), { pos: [0, 1.06, 0], color: 'woodLight' });
    for (const x of [-2.12, 2.12]) { const c = new THREE.CylinderGeometry(0.55, 0.55, 0.05, 12, 1, false, Math.PI, Math.PI); c.rotateZ(Math.PI / 2); B.add(c, { pos: [x, 1.06, 0], color: 'wood' }); }
    for (const x of [-1.5, 1.5]) {
      B.add(cyl(0.42, 0.5, 0.55, 10), { pos: [x, 0.27, 0], color: 'bark' });
      B.add(cyl(0.4, 0.4, 0.04, 10), { pos: [x, 0.56, 0], color: 'woodLight' });
      for (let i = 0; i < 3; i++) { const a = i * 2.1 + x; B.add(cone(0.16, 0.5, 6), { pos: [x + Math.cos(a) * 0.45, 0.12, Math.sin(a) * 0.45], quat: quatTo([Math.cos(a), -0.5, Math.sin(a)]), color: 'woodDark' }); }
    }
    leafy(B, { blobs: [[-1.6, 0.5, 0.45, 0.32], [1.7, 0.25, -0.45, 0.28]], shades: ['leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip'], count: 40, size: [0.34, 0.2], seed: 65, cardMesh: 'Rustle' });
  },
});
add({
  name: 'Campfire', palette: pal(['woodDark', 'wood', 'stone', 'stoneDark']), glow: { Flame: '#ff6a1a', FlameCore: '#ffd36b' }, bg: '#221a1c',
  build(B) { for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; B.add(ell(0.42, 0.3, 0.36, 7, 5), { pos: [Math.cos(a) * 1.3, 0.2, Math.sin(a) * 1.3], rot: [0, a, 0], color: k % 2 ? 'stone' : 'stoneDark' }); } for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; const g = cyl(0.16, 0.18, 2.0, 7); B.add(g, { pos: [Math.cos(a) * 0.35, 0.45, Math.sin(a) * 0.35], quat: quatTo([-Math.cos(a), 1.2, -Math.sin(a)]), color: k % 2 ? 'wood' : 'woodDark' }); } B.add(flameGeo(0.75, 2.0), { pos: [0, 0.3, 0], mesh: 'Flame' }); B.add(flameGeo(0.42, 1.3), { pos: [0, 0.3, 0], mesh: 'FlameCore' }); },
});
function flameGeo(r, h) { return flame(r, h); }
add({
  name: 'Bones', palette: pal(['bone', 'boneShade']),
  build(B) { B.add(ell(0.75, 0.6, 0.8, 12, 9), { pos: [0, 0.6, 0], color: 'bone' }); B.add(ell(0.45, 0.3, 0.5, 10, 7), { pos: [0, 0.35, -0.65], color: 'bone' }); for (const x of [-0.28, 0.28]) B.add(ell(0.17, 0.15, 0.08, 8, 6), { pos: [x, 0.7, -0.72], color: 'boneShade' }); for (const x of [-0.45, 0.45]) B.add(cone(0.12, 0.6, 6), { pos: [x, 1.2, 0.1], quat: quatTo([x, 1, 0.4]), color: 'boneShade' }); for (let k = 0; k < 4; k++) B.add(torus(0.6, 0.08, 5, 12, Math.PI), { pos: [1.6, 0.05, -0.6 + k * 0.4], rot: [0, Math.PI / 2, 0], color: 'bone' }); B.add(cyl(0.1, 0.1, 2, 6), { pos: [1.6, 0.1, 0], rot: [Math.PI / 2, 0, 0], color: 'boneShade' }); },
});
add({
  name: 'TreasureChest', glow: { Glow: '#ffe07a' },
  palette: pal(['wood', 'woodDark', 'woodLight', 'gold', 'goldDeep', 'metalDark', 'gem']),
  build(B) {
    B.add(box(2.6, 1.4, 1.6), { pos: [0, 0.7, 0], color: 'wood' });
    for (const y of [0.45, 0.95]) for (const z of [-0.805, 0.805]) B.add(box(2.5, 0.04, 0.02), { pos: [0, y, z], color: 'woodDark' });
    // lid open a crack, gold pile peeking out
    const lid = new THREE.CylinderGeometry(0.8, 0.8, 2.6, 12, 1, false, 0, Math.PI); lid.rotateZ(Math.PI / 2); lid.translate(0, 0, 0.8);
    const lq = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.35, 0, 0));
    B.add(lid, { pos: [0, 1.4, -0.8], quat: lq, color: 'woodLight' });
    for (const x of [-1.32, 1.32]) { const band = new THREE.CylinderGeometry(0.84, 0.84, 0.14, 12, 1, false, 0, Math.PI); band.rotateZ(Math.PI / 2); band.translate(0, 0, 0.8); B.add(band, { pos: [x * 0.86, 1.4, -0.8], quat: lq, color: 'goldDeep' }); }
    for (const x of [-1.12, 1.12]) B.add(box(0.2, 1.45, 1.66), { pos: [x, 0.72, 0], color: 'goldDeep' });
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) B.add(box(0.3, 1.46, 0.3), { pos: [x * 1.2, 0.72, z * 0.72], color: 'metalDark' });
    B.add(box(0.6, 0.62, 0.12), { pos: [0, 1.15, -0.84], color: 'gold' });
    B.add(cyl(0.07, 0.07, 0.14, 8), { pos: [0, 1.2, -0.9], rot: [Math.PI / 2, 0, 0], color: 'metalDark' });
    B.add(box(0.05, 0.16, 0.14), { pos: [0, 1.08, -0.9], color: 'metalDark' });
    B.add(ell(1.1, 0.24, 0.6, 10, 5), { pos: [0, 1.42, 0.0], mesh: 'Glow' });
    for (let k = 0; k < 7; k++) B.add(cyl(0.18, 0.18, 0.06, 10), { pos: [-0.85 + k * 0.28, 1.6 + (k % 2) * 0.06, -0.1 + (k % 3) * 0.12], rot: [0.5, 0, 0.25 * k], color: 'gold' });
    B.add(new THREE.OctahedronGeometry(0.2, 0), { pos: [0.3, 1.72, 0.05], scale: [1, 1.3, 1], color: 'gem' });
    for (let k = 0; k < 6; k++) { const a = -1.9 + k * 0.45; B.add(cyl(0.16, 0.16, 0.05, 10), { pos: [Math.cos(a) * 1.7, 0.03 + (k % 2) * 0.05, Math.sin(a) * 1.3 - 0.2], rot: [(k % 2) * 0.3, 0, 0], color: 'gold' }); }
  },
});
add({
  name: 'Torch', palette: pal(['woodDark', 'metalDark', 'rope']), glow: { Flame: '#ff6a1a', FlameCore: '#ffd36b' }, heroSize: [420, 600], bg: '#221a1c',
  build(B) { B.add(cyl(0.12, 0.16, 3.4, 7), { pos: [0, 1.7, 0], color: 'woodDark' }); B.add(cyl(0.3, 0.2, 0.6, 8), { pos: [0, 3.6, 0], color: 'metalDark' }); B.add(torus(0.2, 0.05, 4, 10), { pos: [0, 3.0, 0], rot: [Math.PI / 2, 0, 0], color: 'rope' }); B.add(flame(0.35, 1.2), { pos: [0, 3.8, 0], mesh: 'Flame' }); B.add(flame(0.2, 0.75), { pos: [0, 3.85, 0], mesh: 'FlameCore' }); },
});
add({
  name: 'BannerPole', palette: pal(['woodDark', 'gold', 'cloth', 'clothDark']), heroSize: [420, 640],
  bones: [['Flag1', null, [0, 6.6, 0]], ['Flag2', 'Flag1', [0.66, 6.6, 0]], ['Flag3', 'Flag2', [1.33, 6.6, 0]], ['Flag4', 'Flag3', [2, 6.6, 0]]], skinned: ['Flag'],
  build(B) { B.add(cyl(0.12, 0.15, 7, 8), { pos: [0, 3.5, 0], color: 'woodDark' }); B.add(ell(0.22, 0.22, 0.22, 8, 6), { pos: [0, 7.1, 0], color: 'gold' }); B.add(cyl(0.06, 0.06, 2.2, 5), { pos: [0.95, 6.7, 0], rot: [0, 0, Math.PI / 2], color: 'gold' }); flagCloth(B, 2.0, 3.0, ['Flag1', 'Flag2', 'Flag3', 'Flag4'], [0.05, 6.6, 0], { color: 'cloth', notch: 0.3 }); flagCloth(B, 0.9, 0.9, ['Flag1', 'Flag2', 'Flag3', 'Flag4'], [0.55, 5.85, -0.03], { color: 'gold', segW: 4, segH: 3 }); },
});
add({
  name: 'Cart', palette: pal(['wood', 'woodDark', 'metalDark', 'canvas']), heroSize: [640, 480],
  build(B) { B.add(box(3.2, 0.2, 2.0), { pos: [0, 1.4, 0], color: 'wood' }); for (const z of [-1, 1]) B.add(box(3.2, 0.8, 0.14), { pos: [0, 1.9, z], color: 'woodDark' }); B.add(box(0.14, 0.8, 2), { pos: [1.6, 1.9, 0], color: 'woodDark' }); for (const z of [-1.15, 1.15]) { B.add(torus(0.8, 0.12, 6, 14), { pos: [-0.4, 0.85, z], color: 'woodDark' }); for (let k = 0; k < 4; k++) B.add(cyl(0.05, 0.05, 1.6, 4), { pos: [-0.4, 0.85, z], rot: [0, 0, k * Math.PI / 4], color: 'wood' }); } for (const z of [-0.5, 0.5]) B.add(cyl(0.07, 0.07, 2.6, 5), { pos: [-2.6, 1.2, z], rot: [0, 0, Math.PI / 2 - 0.2], color: 'woodDark' }); const s = new THREE.SphereGeometry(1, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2); s.scale(1.5, 0.8, 0.9); B.add(s, { pos: [0.2, 1.5, 0], color: 'canvas' }); },
});
add({
  // Stone well with a shingled roof, crank, bucket and ivy.
  name: 'Well', v2: true, palette: pal(['stone', 'stoneDark', 'wood', 'woodDark', 'bark', 'shingle', 'shingleDark', 'rope', 'leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip']), heroSize: [520, 600], parts: { Bucket: { pivot: [0, 3.2, 0] }, Rustle: { pivot: [0, 0, 0] } },
  build(B) {
    B.add(new THREE.CylinderGeometry(1.5, 1.6, 1.35, 16, 1, true), { pos: [0, 0.67, 0], color: 'stoneDark' });
    B.add(new THREE.CylinderGeometry(1.25, 1.25, 0.1, 16), { pos: [0, 0.6, 0], color: 'stoneDark' });
    for (let row = 0; row < 3; row++) for (let k = 0; k < 11; k++) { const a = ((k + row * 0.5) / 11) * Math.PI * 2; const g = rock(0.42, 3 + k + row * 11, 0.62, 0); B.add(g, { pos: [Math.cos(a) * 1.55, 0.25 + row * 0.42, Math.sin(a) * 1.55], rot: [0, -a, 0], scale: [1.25, 1, 0.9], color: (k + row) % 3 ? 'stone' : 'stoneDark' }); }
    B.add(torus(1.55, 0.2, 6, 22), { pos: [0, 1.38, 0], rot: [Math.PI / 2, 0, 0], color: 'stoneDark' });
    for (const x of [-1.5, 1.5]) B.add(loft({ points: [[x, 1.2, 0], [x * 1.02, 2.8, 0], [x, 4.15, 0]], rx: () => 0.15, ry: () => 0.15, rings: 6, seg: 6 }), { color: 'bark' });
    const c = cyl(0.17, 0.17, 3.2, 8); c.rotateZ(Math.PI / 2); B.add(c, { pos: [0, 3.2, 0], color: 'wood' });
    B.add(box(0.12, 0.6, 0.12), { pos: [1.75, 2.95, 0], color: 'woodDark' }); B.add(box(0.12, 0.12, 0.5), { pos: [1.75, 2.65, 0.2], color: 'woodDark' });
    // two-pitch roof made of shingle rows
    for (const side of [-1, 1]) for (let r = 0; r < 4; r++) {
      const z = side * (0.35 + r * 0.42), y = 4.85 - r * 0.3;
      B.add(box(4.0, 0.12, 0.55), { pos: [0, y, z], rot: [side * 0.62, 0, 0], color: r % 2 ? 'shingleDark' : 'shingle' });
    }
    B.add(box(4.1, 0.2, 0.3), { pos: [0, 5.02, 0], color: 'woodDark' });
    into(B, 'Bucket').add(cyl(0.03, 0.03, 1.8, 4), { pos: [0, 2.3, 0], color: 'rope' }); into(B, 'Bucket').add(cyl(0.3, 0.25, 0.4, 8), { pos: [0, 1.3, 0], color: 'wood' });
    leafy(B, { blobs: [[-1.55, 2.2, 0.2, 0.42], [-1.4, 3.2, 0.1, 0.36], [-0.9, 4.4, 0.6, 0.38], [1.2, 0.8, 1.2, 0.5]], shades: ['leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip'], count: 120, size: [0.4, 0.24], seed: 67, cardMesh: 'Rustle' });
  },
});
add({
  name: 'BridgeSegment', palette: pal(['wood', 'woodDark', 'woodLight', 'rope']), heroSize: [640, 420],
  build(B) { for (let k = 0; k < 8; k++) B.add(box(0.7, 0.18, 3.0), { pos: [-2.8 + k * 0.8, 0.1 - 0.05 * Math.sin((k / 7) * Math.PI), 0], rot: [0, 0, (k % 2 ? 0.03 : -0.03)], color: ['wood', 'woodLight', 'woodDark'][k % 3] }); for (const z of [-1.5, 1.5]) { for (const x of [-3.2, 3.2]) B.add(cyl(0.12, 0.14, 2.2, 6), { pos: [x, 1.0, z], color: 'woodDark' }); B.add(loft({ points: [[-3.2, 1.9, z], [0, 1.5, z], [3.2, 1.9, z]], rx: () => 0.06, ry: () => 0.06, rings: 10, seg: 5 }), { color: 'rope' }); } },
});

export default list;
