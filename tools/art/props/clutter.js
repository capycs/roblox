// Camp and town clutter: crates, barrels, lanterns, signs, fences, campfire, chest...
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, cyl, box, torus, flame, surfaceQuat, into, flagCloth } from '../lib.js';

const C = {
  wood: '#a8703f', woodDark: '#744828', woodLight: '#c99258', metal: '#5b6470', metalDark: '#353b44', rope: '#b89466',
  canvas: '#f4e8cf', canvasRed: '#d9483b', gold: '#f2b33d', goldDeep: '#c27e1c', bone: '#ece2cc', boneShade: '#c9bea6',
  stone: '#8b8e8c', stoneDark: '#5f6466', cloth: '#3d6fc4', clothDark: '#2a4f91',
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
  B.add(box(0.25 * s, 2.6 * s, 0.14 * s), { pos: V([0, 0, 1.02 * s]).applyQuaternion(q).add(V([pos[0], pos[1] + s, pos[2]])).toArray(), quat: q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 4))), color: 'woodDark' });
}
function barrel(B, pos, s = 1) {
  const g = new THREE.CylinderGeometry(0.85 * s, 0.85 * s, 2.2 * s, 14, 6); const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const k = 1 + 0.16 * Math.cos((P.getY(i) / (1.1 * s)) * Math.PI / 2); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); }
  g.computeVertexNormals();
  B.add(g, { pos: [pos[0], pos[1] + 1.1 * s, pos[2]], color: 'wood' });
  for (const y of [0.35, 1.85]) B.add(torus(0.9 * s, 0.07 * s, 5, 18), { pos: [pos[0], pos[1] + y * s, pos[2]], rot: [Math.PI / 2, 0, 0], color: 'metalDark' });
  B.add(cyl(0.82 * s, 0.82 * s, 0.05, 14), { pos: [pos[0], pos[1] + 2.2 * s, pos[2]], color: 'woodDark' });
}

add({ name: 'Crate', palette: pal(['wood', 'woodDark']), build(B) { crate(B, [0, 0, 0]); } });
add({ name: 'CrateStack', palette: pal(['wood', 'woodDark']), build(B) { crate(B, [0, 0, 0]); crate(B, [2.1, 0, 0.2], 1, 0.2); crate(B, [1.0, 2, 0.1], 0.9, -0.3); crate(B, [-0.4, 0, 2.0], 0.7, 0.5); } });
add({ name: 'Barrel', palette: pal(['wood', 'woodDark', 'metalDark']), build(B) { barrel(B, [0, 0, 0]); } });
add({ name: 'BarrelGroup', palette: pal(['wood', 'woodDark', 'metalDark']), build(B) { barrel(B, [0, 0, 0]); barrel(B, [1.9, 0, 0.4], 0.9); barrel(B, [0.8, 0, 1.7], 0.85); } });
add({
  name: 'Sack', palette: pal(['canvas', 'rope']),
  build(B) { const g = new THREE.SphereGeometry(0.9, 12, 10); g.scale(1, 1.15, 1); B.add(g, { pos: [0, 0.95, 0], color: 'canvas' }); B.add(cone(0.42, 0.7, 10), { pos: [0, 2.15, 0], color: 'canvas' }); B.add(torus(0.3, 0.07, 5, 12), { pos: [0, 1.9, 0], rot: [Math.PI / 2, 0, 0], color: 'rope' }); },
});
add({
  name: 'LanternPost', palette: pal(['metal', 'metalDark', 'gold']), glow: { LanternLamp: '#ffd36b' }, heroSize: [440, 640],
  parts: { Lantern: { pivot: [1.2, 6.95, 0] }, LanternLamp: { pivot: [1.2, 6.95, 0] } },
  build(B) { const Lt = into(B, 'Lantern'); B.add(cyl(0.18, 0.28, 7, 8), { pos: [0, 3.5, 0], color: 'metalDark' }); B.add(cyl(0.6, 0.75, 0.4, 8), { pos: [0, 0.2, 0], color: 'metal' }); B.add(loft({ points: [[0, 6.6, 0], [0.6, 7.2, 0], [1.2, 7.0, 0]], rx: () => 0.08, ry: () => 0.08, rings: 8, seg: 6 }), { color: 'metalDark' }); Lt.add(cyl(0.38, 0.3, 0.2, 8), { pos: [1.2, 6.75, 0], color: 'gold' }); B.add(ell(0.34, 0.48, 0.34, 10, 8), { pos: [1.2, 6.2, 0], mesh: 'LanternLamp' }); Lt.add(cone(0.48, 0.45, 8), { pos: [1.2, 5.6, 0], rot: [Math.PI, 0, 0], color: 'gold' }); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; Lt.add(cyl(0.035, 0.035, 0.9, 4), { pos: [1.2 + Math.cos(a) * 0.36, 6.2, Math.sin(a) * 0.36], color: 'metalDark' }); } },
});
add({
  name: 'Signpost', palette: pal(['wood', 'woodDark', 'woodLight']), heroSize: [480, 600],
  build(B) { B.add(cyl(0.18, 0.22, 4.6, 8), { pos: [0, 2.3, 0], color: 'woodDark' }); for (const [y, a, w] of [[3.8, 0.3, 2.6], [3.0, -0.5, 2.2], [2.3, 2.6, 2.0]]) { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0)); B.add(box(w, 0.55, 0.14), { pos: V([w / 2 - 0.1, 0, 0.2]).applyQuaternion(q).add(V([0, y, 0])).toArray(), quat: q, color: 'woodLight' }); B.add(cone(0.4, 0.55, 3, 0.25), { pos: V([w - 0.05, 0, 0.2]).applyQuaternion(q).add(V([0, y, 0])).toArray(), quat: q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2))), color: 'woodLight' }); } },
});
add({
  name: 'FenceSegment', palette: pal(['wood', 'woodDark']), heroSize: [640, 420],
  build(B) { for (const x of [-3, 0, 3]) { B.add(box(0.4, 2.4, 0.4), { pos: [x, 1.2, 0], color: 'woodDark' }); B.add(cone(0.32, 0.4, 4), { pos: [x, 2.6, 0], rot: [0, Math.PI / 4, 0], color: 'woodDark' }); } for (const y of [0.8, 1.7]) B.add(box(6.4, 0.3, 0.16), { pos: [0, y, 0.25], rot: [0, 0, y > 1 ? 0.02 : -0.02], color: 'wood' }); },
});
add({
  name: 'Bench', palette: pal(['wood', 'woodDark', 'metalDark']), heroSize: [600, 440],
  build(B) { for (const z of [-0.3, 0, 0.3]) B.add(box(4, 0.15, 0.26), { pos: [0, 1.0, z], color: 'wood' }); for (const y of [1.45, 1.8]) B.add(box(4, 0.25, 0.12), { pos: [0, y, 0.48], color: 'wood' }); for (const x of [-1.7, 1.7]) { B.add(box(0.16, 1.0, 1.0), { pos: [x, 0.5, 0], color: 'metalDark' }); B.add(box(0.16, 1.1, 0.12), { pos: [x, 1.5, 0.48], color: 'metalDark' }); } },
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
  name: 'TreasureChest', palette: pal(['wood', 'woodDark', 'gold', 'goldDeep']), glow: { Glow: '#ffe07a' },
  build(B) { B.add(box(2.6, 1.4, 1.6), { pos: [0, 0.7, 0], color: 'wood' }); const lid = new THREE.CylinderGeometry(0.8, 0.8, 2.6, 12, 1, false, 0, Math.PI); lid.rotateZ(Math.PI / 2); B.add(lid, { pos: [0, 1.4, 0], rot: [-0.25, 0, 0], color: 'wood' }); for (const x of [-1.0, 0, 1.0]) { B.add(box(0.2, 1.45, 1.65), { pos: [x, 0.72, 0], color: 'gold' }); } B.add(box(0.5, 0.5, 0.12), { pos: [0, 1.2, -0.84], color: 'goldDeep' }); B.add(ell(1.1, 0.2, 0.55, 10, 5), { pos: [0, 1.45, -0.05], mesh: 'Glow' }); for (let k = 0; k < 5; k++) B.add(cyl(0.2, 0.2, 0.06, 10), { pos: [-0.6 + k * 0.3, 1.55 + (k % 2) * 0.05, -0.15], rot: [0.4, 0, 0.2 * k], color: 'gold' }); },
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
  name: 'Well', palette: pal(['stone', 'stoneDark', 'wood', 'woodDark', 'canvasRed', 'rope']), heroSize: [520, 600], parts: { Bucket: { pivot: [0, 3.2, 0] } },
  build(B) { for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; B.add(box(0.9, 1.4, 0.5), { pos: [Math.cos(a) * 1.5, 0.7, Math.sin(a) * 1.5], rot: [0, -a + Math.PI / 2, 0], color: k % 2 ? 'stone' : 'stoneDark' }); } for (const x of [-1.5, 1.5]) B.add(box(0.25, 3.4, 0.25), { pos: [x, 2.3, 0], color: 'woodDark' }); const c = cyl(0.2, 0.2, 3.2, 8); c.rotateZ(Math.PI / 2); B.add(c, { pos: [0, 3.2, 0], color: 'wood' }); const roof = new THREE.ConeGeometry(2.6, 1.5, 4); B.add(roof, { pos: [0, 4.6, 0], rot: [0, Math.PI / 4, 0], color: 'canvasRed' }); into(B, 'Bucket').add(cyl(0.03, 0.03, 1.8, 4), { pos: [0, 2.3, 0], color: 'rope' }); into(B, 'Bucket').add(cyl(0.3, 0.25, 0.4, 8), { pos: [0, 1.3, 0], color: 'wood' }); },
});
add({
  name: 'BridgeSegment', palette: pal(['wood', 'woodDark', 'woodLight', 'rope']), heroSize: [640, 420],
  build(B) { for (let k = 0; k < 8; k++) B.add(box(0.7, 0.18, 3.0), { pos: [-2.8 + k * 0.8, 0.1 - 0.05 * Math.sin((k / 7) * Math.PI), 0], rot: [0, 0, (k % 2 ? 0.03 : -0.03)], color: ['wood', 'woodLight', 'woodDark'][k % 3] }); for (const z of [-1.5, 1.5]) { for (const x of [-3.2, 3.2]) B.add(cyl(0.12, 0.14, 2.2, 6), { pos: [x, 1.0, z], color: 'woodDark' }); B.add(loft({ points: [[-3.2, 1.9, z], [0, 1.5, z], [3.2, 1.9, z]], rx: () => 0.06, ry: () => 0.06, rings: 10, seg: 5 }), { color: 'rope' }); } },
});

export default list;
