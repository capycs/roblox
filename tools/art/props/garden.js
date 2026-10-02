// More clutter for Haven and the islands, in the same leafy Zelda-like style as the trees:
// hedges, topiary, pots, farm bits, camp bits, garden decorations. Category Clutter.
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, cyl, box, torus, rock, surfaceQuat, into } from '../lib.js';
import { canopy as leafy, seeded } from '../foliage.js';

const C = {
  leafDeep: '#28552b', leafDark: '#357a2f', leaf: '#4f9a3d', leafLight: '#74b84a', leafTip: '#98cf58',
  autumnDeep: '#9c3b1f', autumnDark: '#c95a24', autumn: '#e98a2e', autumnLight: '#f4b544', autumnTip: '#ffd56a',
  hayDeep: '#a9772e', hayDark: '#c99a3e', hay: '#e2b856', hayLight: '#f1d27a', hayTip: '#fbe7a6',
  wood: '#a8703f', woodDark: '#744828', woodLight: '#c99258', bark: '#8a5a34', rope: '#b89466',
  clay: '#c8693f', clayDark: '#9a4a2c', clayLight: '#e08c5c', clayPaint: '#f2d7a2',
  stone: '#9b9a94', stoneDark: '#6d6c68', stoneLight: '#bdbbb3', moss: '#5f9a3c',
  soil: '#5a3b26', canvas: '#f4e8cf', canvasDark: '#d8c49e', canvasRed: '#d9483b', canvasBlue: '#3d6fc4',
  blanketA: '#e8473a', blanketB: '#fff3dc', wicker: '#c99a5a', wickerDark: '#946a34',
  pumpkin: '#f08a24', pumpkinDark: '#c9661a', stem: '#5e7a2c', apple: '#d9354a', appleGreen: '#9fd34a', carrot: '#f08a24',
  petalPink: '#ff9ec7', petalWhite: '#fff6e8', petalYellow: '#ffd84a', petalBlue: '#7fb2ff', petalRed: '#e8473a',
  metal: '#5b6470', metalDark: '#353b44', gold: '#f2b33d', straw: '#e2b856', sackcloth: '#d2ad74', shirt: '#6e8fd6', hat: '#8a5a34',
  pin1: '#e8473a', pin2: '#f2b33d', pin3: '#3d6fc4', pin4: '#5fae45', white: '#ffffff', ink: '#2a1a12',
};
const pal = (keys) => keys.map((k) => [k, C[k]]);
const LEAF = ['leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip'];
const AUTUMN = ['autumnDeep', 'autumnDark', 'autumn', 'autumnLight', 'autumnTip'];
const HAY = ['hayDeep', 'hayDark', 'hay', 'hayLight', 'hayTip'];
const list = [];
const add = (spec) => list.push({ category: 'Clutter', heroSize: [520, 520], ...spec });
const lathe = (pts, seg = 16) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)), seg);

// tiny 5-petal flower facing n at p
function flower(B, p, n, col, size = 0.12) {
  const nn = V(n).normalize(), side = Math.abs(nn.y) > 0.9 ? V([1, 0, 0]) : V([0, 1, 0]).cross(nn).normalize(), fwd = nn.clone().cross(side).normalize();
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2, d = side.clone().multiplyScalar(Math.cos(a)).addScaledVector(fwd, Math.sin(a)); B.add(ell(size, size * 0.25, size * 0.65, 6, 3), { pos: V(p).addScaledVector(d, size * 0.9).toArray(), quat: surfaceQuat(nn.toArray(), d.toArray()), color: col }); }
  B.add(ell(size * 0.45, size * 0.35, size * 0.45, 6, 4), { pos: V(p).addScaledVector(nn, size * 0.15).toArray(), color: 'petalYellow' });
}
function stemFlower(B, x, z, h, col, lean = 0.1, seed = 1) {
  const r = seeded(seed), top = [x + (r() - 0.5) * lean, h, z + (r() - 0.5) * lean];
  B.add(loft({ points: [[x, 0, z], [(x + top[0]) / 2, h * 0.5, (z + top[2]) / 2], top], rx: () => 0.03, ry: () => 0.03, rings: 4, seg: 4 }), { color: 'leafDark' });
  B.add(blade(0.3, 0.1, 0.03, 5), { pos: [x, h * 0.3, z], quat: surfaceQuat([0, 1, 0.2], [r() - 0.5, 0.6, r() - 0.5]), color: 'leaf' });
  flower(B, top, [0, 1, 0.25], col);
}
const grassTufts = (B, pts, seed) => { const r = seeded(seed); for (const [x, z] of pts) for (let k = 0; k < 4; k++) { const a = r() * 6.28; B.add(cone(0.07, 0.4 + r() * 0.3, 4), { pos: [x + Math.cos(a) * 0.1, 0.15, z + Math.sin(a) * 0.1], quat: quatTo([Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4]), color: ['leaf', 'leafLight', 'leafDark'][k % 3] }); } };

// ---------- hedges + topiary ----------
add({
  name: 'HedgeStraight', palette: pal(LEAF), heroSize: [640, 420],
  build(B) { const blobs = []; for (let i = 0; i < 6; i++) blobs.push([-3 + i * 1.2, 1.05, (i % 2) * 0.12, 1.05]); for (let i = 0; i < 5; i++) blobs.push([-2.4 + i * 1.2, 2.0, 0, 0.8]); leafy(B, { blobs, shades: LEAF, count: 520, size: [0.6, 0.34], seed: 101, centre: [0, 0.6, 0] }); },
});
add({
  name: 'HedgeCorner', palette: pal(LEAF),
  build(B) { const blobs = []; for (let i = 0; i < 4; i++) { blobs.push([-i * 1.15, 1.05, 0, 1.05]); if (i) blobs.push([0, 1.05, -i * 1.15, 1.05]); } blobs.push([-0.6, 1.95, -0.6, 0.85], [-2.2, 1.9, 0, 0.75], [0, 1.9, -2.2, 0.75]); leafy(B, { blobs, shades: LEAF, count: 520, size: [0.6, 0.34], seed: 103, centre: [-1, 0.6, -1] }); },
});
function pot(B, h, r, col = 'clay', rim = 'clayDark', band) {
  B.add(lathe([[r * 0.62, 0], [r * 0.7, 0.05], [r * 0.95, h * 0.55], [r, h * 0.88], [r * 1.1, h * 0.9], [r * 1.12, h], [r * 0.95, h], [r * 0.9, h * 0.97]], 16), { color: col });
  B.add(torus(r * 1.08, h * 0.06, 5, 16), { pos: [0, h * 0.95, 0], rot: [Math.PI / 2, 0, 0], color: rim });
  if (band) B.add(torus(r * 0.97, h * 0.035, 4, 16), { pos: [0, h * 0.55, 0], rot: [Math.PI / 2, 0, 0], color: band });
  B.add(cyl(r * 0.92, r * 0.92, 0.04, 14), { pos: [0, h * 0.9, 0], color: 'soil' });
}
add({
  name: 'Topiary', palette: pal([...LEAF, 'clay', 'clayDark', 'clayPaint', 'soil', 'bark']), heroSize: [440, 600],
  build(B) { pot(B, 1.0, 0.75, 'clay', 'clayDark', 'clayPaint'); B.add(cyl(0.08, 0.1, 2.6, 6), { pos: [0, 1.9, 0], color: 'bark' }); leafy(B, { blobs: [[0, 2.35, 0, 0.75]], shades: LEAF, count: 150, size: [0.42, 0.26], seed: 105 }); leafy(B, { blobs: [[0, 3.75, 0, 0.6]], shades: LEAF, count: 110, size: [0.38, 0.24], seed: 106 }); },
});
add({
  name: 'FlowerPot', palette: pal([...LEAF, 'clay', 'clayDark', 'clayPaint', 'soil', 'petalPink', 'petalWhite', 'petalYellow']), heroSize: [440, 480],
  build(B) { pot(B, 0.8, 0.55, 'clayLight' in C ? 'clay' : 'clay', 'clayDark', 'clayPaint'); leafy(B, { blobs: [[0, 1.05, 0, 0.5], [0.3, 0.95, 0.15, 0.36], [-0.28, 0.98, -0.1, 0.36]], shades: LEAF, count: 120, size: [0.36, 0.22], seed: 107, centre: [0, 0.7, 0], extra: ({ surface }) => { for (let i = 0; i < 6; i++) { const { p, n } = surface(); flower(B, p, n, i % 2 ? 'petalPink' : 'petalWhite', 0.11); } } }); },
});
add({
  name: 'PlanterBox', palette: pal([...LEAF, 'wood', 'woodDark', 'woodLight', 'soil', 'petalPink', 'petalWhite', 'petalYellow', 'petalBlue', 'petalRed']), heroSize: [600, 440],
  build(B) {
    for (const z of [-0.55, 0.55]) for (const y of [0.18, 0.5]) B.add(box(3.0, 0.3, 0.12), { pos: [0, y, z], color: y > 0.3 ? 'wood' : 'woodDark' });
    for (const x of [-1.45, 1.45]) for (const y of [0.18, 0.5]) B.add(box(0.12, 0.3, 1.2), { pos: [x, y, 0], color: 'wood' });
    for (const [x, z] of [[-1.48, -0.58], [1.48, -0.58], [-1.48, 0.58], [1.48, 0.58]]) B.add(box(0.18, 0.75, 0.18), { pos: [x, 0.37, z], color: 'woodDark' });
    B.add(box(2.8, 0.05, 1.0), { pos: [0, 0.6, 0], color: 'soil' });
    leafy(B, { blobs: [[-1, 0.75, 0, 0.42], [0, 0.75, 0, 0.44], [1, 0.75, 0, 0.42]], shades: LEAF, count: 120, size: [0.32, 0.2], seed: 109, centre: [0, 0.4, 0] });
    const cols = ['petalPink', 'petalWhite', 'petalBlue', 'petalRed', 'petalPink', 'petalWhite', 'petalYellow'];
    cols.forEach((c, i) => B.add(loft({ points: [[-1.2 + i * 0.4, 0.6, (i % 2 - 0.5) * 0.4], [-1.2 + i * 0.4, 1.0, (i % 2 - 0.5) * 0.4], [-1.18 + i * 0.4, 1.3 + (i % 3) * 0.1, (i % 2 - 0.5) * 0.45]], rx: () => 0.025, ry: () => 0.025, rings: 3, seg: 4 }), { color: 'leafDark' }));
    cols.forEach((c, i) => flower(B, [-1.18 + i * 0.4, 1.3 + (i % 3) * 0.1, (i % 2 - 0.5) * 0.45], [0, 1, -0.2], c, 0.13));
  },
});

// ---------- farm ----------
add({
  name: 'HayBale', palette: pal([...HAY, 'rope']), heroSize: [520, 420],
  build(B) {
    const g = cyl(0.85, 0.85, 1.7, 16); g.rotateZ(Math.PI / 2); B.add(g, { pos: [0, 0.85, 0], color: 'hay' });
    for (const x of [-0.86, 0.86]) { for (const [rr, c] of [[0.82, 'hayDark'], [0.55, 'hay'], [0.28, 'hayDark']]) { const d = cyl(rr, rr, 0.03, 16); d.rotateZ(Math.PI / 2); B.add(d, { pos: [x + Math.sign(x) * 0.005 * (1 - rr), 0.85, 0], color: c }); } }
    for (const x of [-0.45, 0.45]) B.add(torus(0.87, 0.04, 4, 20), { pos: [x, 0.85, 0], rot: [0, Math.PI / 2, 0], color: 'rope' });
    leafy(B, { blobs: [[0, 0.85, 0, 0.86]], shades: HAY, count: 90, size: [0.6, 0.06], seed: 111, core: false, droop: 0.2, flare: 0.25 });
  },
});
add({
  name: 'Haystack', palette: pal([...HAY, 'wood']), heroSize: [520, 520],
  build(B) { B.add(cyl(0.08, 0.1, 4.2, 6), { pos: [0, 2.1, 0], color: 'wood' }); leafy(B, { blobs: [[0, 1.0, 0, 1.55], [0.2, 2.0, 0.1, 1.15], [0, 2.85, 0, 0.7]], shades: HAY, count: 560, size: [1.0, 0.1], seed: 113, droop: 0.85, flare: 0.2, centre: [0, 0.8, 0] }); },
});
add({
  name: 'Beehive', palette: pal([...HAY, 'bark', 'woodLight', 'ink', 'gold']), heroSize: [440, 520],
  build(B) {
    B.add(cyl(0.6, 0.7, 0.9, 10), { pos: [0, 0.45, 0], color: 'bark' }); B.add(cyl(0.58, 0.58, 0.04, 10), { pos: [0, 0.91, 0], color: 'woodLight' });
    for (let i = 0; i < 6; i++) { const t = i / 6, r = 0.85 * Math.cos(t * 1.35) + 0.05, y = 1.05 + Math.sin(t * 1.35) * 1.15; B.add(torus(r, 0.13, 6, 18), { pos: [0, y, 0], rot: [Math.PI / 2, 0, 0], color: i % 2 ? 'hay' : 'hayDark' }); }
    B.add(lathe([[0.85, 0.95], [0.8, 1.6], [0.5, 2.05], [0.05, 2.3]], 14), { color: 'hayDark' });
    B.add(ell(0.2, 0.14, 0.08, 8, 5), { pos: [0, 1.15, -0.86], color: 'ink' });
    for (const [x, y, z] of [[0.5, 1.6, -0.9], [-0.6, 1.9, -0.6], [0.2, 2.4, -0.5]]) { B.add(ell(0.08, 0.06, 0.1, 6, 4), { pos: [x, y, z], color: 'gold' }); B.add(ell(0.07, 0.015, 0.05, 5, 3), { pos: [x, y + 0.06, z], rot: [0, 0, 0.5], color: 'white' in C ? 'woodLight' : 'woodLight' }); }
  },
});
add({
  name: 'Scarecrow', palette: pal(['bark', 'wood', 'straw', 'hayDark', 'sackcloth', 'shirt', 'hat', 'ink', 'canvasRed']), heroSize: [480, 640],
  build(B) {
    B.add(cyl(0.12, 0.14, 4.6, 6), { pos: [0, 2.3, 0], color: 'bark' });
    const arm = cyl(0.09, 0.09, 3.2, 6); arm.rotateZ(Math.PI / 2); B.add(arm, { pos: [0, 3.2, 0], color: 'bark' });
    B.add(cyl(0.55, 0.42, 1.4, 8), { pos: [0, 2.85, 0], color: 'shirt' });
    for (const x of [-1, 1]) { const sl = cyl(0.22, 0.26, 0.9, 7); sl.rotateZ(Math.PI / 2); B.add(sl, { pos: [x * 0.85, 3.2, 0], color: 'shirt' }); for (let k = 0; k < 4; k++) B.add(cone(0.06, 0.45, 4), { pos: [x * 1.38, 3.2, (k - 1.5) * 0.08], quat: quatTo([x, -0.3 + k * 0.15, (k - 1.5) * 0.3]), color: 'straw' }); }
    B.add(box(0.5, 0.36, 0.06), { pos: [0.18, 2.6, -0.47], rot: [0, 0, 0.15], color: 'canvasRed' });
    B.add(ell(0.5, 0.55, 0.5, 12, 9), { pos: [0, 4.05, 0], color: 'sackcloth' });
    for (const x of [-0.18, 0.18]) B.add(ell(0.08, 0.08, 0.03, 6, 4), { pos: [x, 4.15, -0.48], color: 'ink' });
    for (let k = 0; k < 5; k++) B.add(box(0.06, 0.04, 0.02), { pos: [-0.2 + k * 0.1, 3.88 + Math.abs(k - 2) * 0.02, -0.49], color: 'ink' });
    B.add(cyl(0.95, 0.95, 0.06, 14), { pos: [0, 4.45, 0], rot: [0.08, 0, 0.05], color: 'hat' });
    B.add(cyl(0.35, 0.5, 0.75, 10), { pos: [0, 4.82, 0], rot: [0.12, 0, 0.1], color: 'hat' });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; B.add(cone(0.05, 0.35, 4), { pos: [Math.cos(a) * 0.45, 3.6, Math.sin(a) * 0.45], quat: quatTo([Math.cos(a), -1, Math.sin(a)]), color: 'straw' }); }
  },
});
add({
  name: 'Wheelbarrow', palette: pal(['wood', 'woodDark', 'woodLight', 'metalDark', 'soil', 'apple', 'appleGreen']), heroSize: [600, 440],
  build(B) {
    const tray = new THREE.CylinderGeometry(1.0, 0.65, 0.7, 4, 1, true); tray.rotateY(Math.PI / 4); tray.scale(1.4, 1, 1);
    B.add(tray, { pos: [0, 1.05, 0], color: 'wood' }); B.add(box(1.25, 0.06, 0.88), { pos: [0, 0.72, 0], color: 'woodDark' });
    B.add(box(1.85, 0.06, 1.3), { pos: [0, 1.25, 0], color: 'soil' });
    for (let k = 0; k < 7; k++) B.add(ell(0.2, 0.19, 0.2, 8, 6), { pos: [-0.6 + (k % 4) * 0.4, 1.38 + Math.floor(k / 4) * 0.12, -0.2 + Math.floor(k / 4) * 0.35], color: k % 3 ? 'apple' : 'appleGreen' });
    B.add(torus(0.45, 0.1, 6, 16), { pos: [1.55, 0.45, 0], color: 'metalDark' }); const ax = cyl(0.05, 0.05, 0.4, 5); ax.rotateX(Math.PI / 2); B.add(ax, { pos: [1.55, 0.45, 0], color: 'woodDark' });
    for (const z of [-0.5, 0.5]) { B.add(loft({ points: [[1.55, 0.5, z * 0.3], [0, 0.9, z], [-1.9, 1.05, z]], rx: () => 0.07, ry: () => 0.07, rings: 6, seg: 5 }), { color: 'woodDark' }); B.add(box(0.1, 0.65, 0.1), { pos: [-0.8, 0.35, z * 0.9], color: 'woodDark' }); }
  },
});
add({
  name: 'Woodpile', palette: pal(['bark', 'wood', 'woodLight', 'woodDark', 'metal', 'metalDark']), heroSize: [600, 480],
  build(B) {
    const log = (x, y, z, r = 0.32, len = 2.4) => { const g = cyl(r, r, len, 9); g.rotateX(Math.PI / 2); B.add(g, { pos: [x, y, z], color: 'bark' }); for (const s of [-1, 1]) { for (const [rr, c] of [[r * 0.92, 'woodLight'], [r * 0.45, 'wood']]) { const d = cyl(rr, rr, 0.02, 9); d.rotateX(Math.PI / 2); B.add(d, { pos: [x, y, z + s * (len / 2 + 0.01)], color: c }); } } };
    for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++) log(-1.0 + i * 0.66 + row * 0.33, 0.32 + row * 0.56, 0);
    B.add(cyl(0.55, 0.62, 0.8, 10), { pos: [2.0, 0.4, 0.4], color: 'bark' }); B.add(cyl(0.52, 0.52, 0.03, 10), { pos: [2.0, 0.81, 0.4], color: 'woodLight' });
    B.add(box(0.08, 1.4, 0.08), { pos: [2.0, 1.3, 0.4], rot: [0, 0, -0.35], color: 'woodDark' }); B.add(box(0.45, 0.32, 0.06), { pos: [1.95, 0.95, 0.4], rot: [0, 0, -0.35], color: 'metal' });
    for (const [x, z, a] of [[1.6, -0.6, 0.4], [2.5, -0.3, 1.2]]) { const g = new THREE.CylinderGeometry(0.28, 0.28, 0.8, 9, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2); B.add(g, { pos: [x, 0.02, z], rot: [0, a, 0], color: 'woodLight' }); }
  },
});
add({
  name: 'Pumpkins', palette: pal(['pumpkin', 'pumpkinDark', 'stem', ...LEAF]), heroSize: [560, 440],
  build(B) {
    const pumpkin = (x, z, r, seed) => {
      const g = new THREE.SphereGeometry(r, 20, 12), P = g.attributes.position;
      for (let i = 0; i < P.count; i++) { const a = Math.atan2(P.getZ(i), P.getX(i)), k = 1 - 0.08 * Math.pow(Math.abs(Math.cos(a * 4)), 0.5); P.setXYZ(i, P.getX(i) * k, P.getY(i) * 0.72, P.getZ(i) * k); }
      g.computeVertexNormals(); B.add(g, { pos: [x, r * 0.68, z], color: seed % 2 ? 'pumpkin' : 'pumpkinDark' });
      B.add(loft({ points: [[x, r * 1.3, z], [x + 0.05, r * 1.55, z], [x + 0.15, r * 1.65, z + 0.05]], rx: (t) => 0.08 - 0.03 * t, ry: (t) => 0.08 - 0.03 * t, rings: 4, seg: 5 }), { color: 'stem' });
    };
    pumpkin(0, 0, 0.8, 1); pumpkin(1.2, 0.5, 0.55, 2); pumpkin(-1.0, 0.7, 0.45, 3);
    B.add(loft({ points: [[0, 0.1, 0], [0.7, 0.08, -0.7], [1.6, 0.1, -0.4], [2.2, 0.12, 0.3]], rx: () => 0.05, ry: () => 0.05, rings: 10, seg: 4 }), { color: 'stem' });
    for (const [x, z, a] of [[0.8, -0.8, 0.4], [1.7, -0.3, 1.6], [-0.6, -0.5, 2.8], [-1.5, 0.2, 3.6], [0.3, 1.1, 5]]) B.add(blade(0.9, 0.45, 0.04, 7), { pos: [x, 0.08, z], quat: surfaceQuat([0, 1, 0], [Math.cos(a), 0.15, Math.sin(a)]), color: ['leafDark', 'leaf', 'leafLight'][Math.floor(a) % 3] });
  },
});
add({
  name: 'ProduceCrate', palette: pal(['wood', 'woodDark', 'woodLight', 'apple', 'appleGreen', 'carrot', 'leaf', 'leafLight']), heroSize: [520, 440],
  build(B) {
    for (const z of [-0.6, 0.6]) for (const y of [0.15, 0.45, 0.75]) B.add(box(1.8, 0.22, 0.08), { pos: [0, y, z], color: y > 0.5 ? 'woodLight' : 'wood' });
    for (const x of [-0.9, 0.9]) for (const y of [0.15, 0.45, 0.75]) B.add(box(0.08, 0.22, 1.2), { pos: [x, y, 0], color: 'wood' });
    for (const [x, z] of [[-0.9, -0.6], [0.9, -0.6], [-0.9, 0.6], [0.9, 0.6]]) B.add(box(0.12, 0.95, 0.12), { pos: [x, 0.47, z], color: 'woodDark' });
    const r = seeded(31);
    for (let i = 0; i < 14; i++) { const x = -0.6 + (i % 5) * 0.3, z = -0.35 + Math.floor(i / 5) * 0.35, c = i % 4 === 0 ? 'appleGreen' : 'apple'; B.add(ell(0.17, 0.16, 0.17, 8, 6), { pos: [x + (r() - 0.5) * 0.08, 0.92 + r() * 0.06, z], color: c }); B.add(cyl(0.015, 0.015, 0.08, 3), { pos: [x, 1.1, z], color: 'woodDark' }); }
    for (let i = 0; i < 3; i++) { const z = -0.3 + i * 0.3; B.add(cone(0.08, 0.6, 7), { pos: [1.0, 0.98, z], quat: quatTo([1, -0.2, 0]), color: 'carrot' }); B.add(blade(0.3, 0.08, 0.02, 5), { pos: [0.7, 1.0, z], quat: surfaceQuat([0, 0, 1], [-1, 0.6, 0]), color: 'leafLight' }); }
  },
});

// ---------- garden + paths ----------
add({
  name: 'SteppingStones', palette: pal(['stone', 'stoneDark', 'stoneLight', 'moss', ...LEAF]), heroSize: [600, 420],
  build(B) {
    [[-2.4, 0.3, 0.55], [-1.1, -0.2, 0.62], [0.2, 0.25, 0.5], [1.4, -0.15, 0.6], [2.6, 0.2, 0.48]].forEach(([x, z, r], i) => { const g = rock(r, 70 + i, 0.25, 1); B.add(g, { pos: [x, 0.05, z], rot: [0, i, 0], scale: [1.2, 1, 1], color: i % 2 ? 'stone' : 'stoneLight' }); if (i % 2 === 0) B.add(ell(r * 0.4, 0.05, r * 0.3, 8, 3), { pos: [x + r * 0.3, 0.14, z - r * 0.2], color: 'moss' }); });
    grassTufts(B, [[-1.8, 0.7], [-0.4, -0.7], [0.9, 0.7], [2.0, -0.6]], 33);
  },
});
add({
  name: 'StoneLantern', palette: pal(['stone', 'stoneDark', 'stoneLight', 'moss', ...LEAF]), glow: { Lamp: '#ffd36b' }, heroSize: [440, 600],
  build(B) {
    B.add(cyl(0.9, 1.0, 0.35, 6), { pos: [0, 0.17, 0], color: 'stoneDark' });
    B.add(cyl(0.3, 0.38, 1.6, 8), { pos: [0, 1.15, 0], color: 'stone' });
    B.add(cyl(0.75, 0.6, 0.3, 6), { pos: [0, 2.05, 0], color: 'stoneDark' });
    B.add(box(0.95, 0.85, 0.95), { pos: [0, 2.6, 0], color: 'stoneLight' });
    for (const [x, z] of [[0, -0.48], [0, 0.48], [-0.48, 0], [0.48, 0]]) B.add(box(x ? 0.04 : 0.5, 0.5, z ? 0.04 : 0.5), { pos: [x * 1.01, 2.62, z * 1.01], mesh: 'Lamp' });
    const roof = new THREE.ConeGeometry(1.15, 0.75, 6, 1); B.add(roof, { pos: [0, 3.4, 0], color: 'stone' });
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; B.add(cone(0.12, 0.3, 4), { pos: [Math.cos(a) * 1.08, 3.1, Math.sin(a) * 1.08], quat: quatTo([Math.cos(a), 0.6, Math.sin(a)]), color: 'stone' }); }
    B.add(ell(0.18, 0.22, 0.18, 8, 6), { pos: [0, 3.95, 0], color: 'stoneLight' });
    leafy(B, { blobs: [[0.3, 3.45, 0.2, 0.45], [-0.6, 0.45, 0.5, 0.4]], shades: LEAF, count: 60, size: [0.3, 0.18], seed: 115 });
  },
});
add({
  name: 'GardenArch', palette: pal(['wood', 'woodDark', 'bark', ...LEAF, 'petalPink', 'petalWhite', 'petalYellow']), heroSize: [520, 600],
  build(B) {
    for (const x of [-1.6, 1.6]) for (const z of [-0.35, 0.35]) B.add(box(0.16, 3.6, 0.16), { pos: [x, 1.8, z], color: 'woodDark' });
    for (const z of [-0.35, 0.35]) B.add(torus(1.6, 0.08, 5, 16, Math.PI), { pos: [0, 3.6, z], color: 'woodDark' });
    for (let k = 0; k < 7; k++) { const a = (k / 6) * Math.PI, g = box(0.08, 0.06, 0.9); B.add(g, { pos: [Math.cos(a) * 1.6, 3.6 + Math.sin(a) * 1.6, 0], color: 'wood' }); }
    for (let y = 0.6; y < 3.4; y += 0.6) for (const x of [-1.6, 1.6]) B.add(box(0.06, 0.06, 0.8), { pos: [x, y, 0], color: 'wood' });
    const blobs = [];
    for (let k = 0; k < 7; k++) { const a = (k / 6) * Math.PI; blobs.push([Math.cos(a) * 1.6, 3.6 + Math.sin(a) * 1.6, 0, 0.55]); }
    for (const x of [-1.6, 1.6]) for (const y of [0.6, 1.5, 2.5]) blobs.push([x, y, 0.05, 0.42 - y * 0.02]);
    leafy(B, { blobs, shades: LEAF, count: 420, size: [0.38, 0.22], seed: 117, centre: [0, 3, 0], extra: ({ surface }) => { for (let i = 0; i < 16; i++) { const { p, n } = surface(); flower(B, p, n, i % 3 ? 'petalPink' : 'petalWhite', 0.13); } } });
  },
});
add({
  name: 'FlowerBed', palette: pal(['stone', 'stoneDark', 'soil', ...LEAF, 'petalPink', 'petalWhite', 'petalYellow', 'petalBlue', 'petalRed']), heroSize: [560, 440],
  build(B) {
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; B.add(rock(0.32, 80 + k, 0.6, 0), { pos: [Math.cos(a) * 1.7, 0.15, Math.sin(a) * 1.3], color: k % 3 ? 'stone' : 'stoneDark' }); }
    B.add(ell(1.6, 0.12, 1.2, 14, 4), { pos: [0, 0.05, 0], color: 'soil' });
    leafy(B, { blobs: [[-0.7, 0.25, -0.2, 0.5], [0.5, 0.25, 0.3, 0.55], [0.2, 0.25, -0.5, 0.45], [-0.4, 0.25, 0.5, 0.45]], shades: LEAF, count: 140, size: [0.3, 0.18], seed: 119, centre: [0, -0.2, 0] });
    const cols = ['petalPink', 'petalWhite', 'petalBlue', 'petalRed', 'petalYellow'], r = seeded(35);
    for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = r() * 1.0; stemFlower(B, Math.cos(a) * d * 1.2, Math.sin(a) * d * 0.85, 0.55 + r() * 0.5, cols[i % 5], 0.2, i + 3); }
  },
});
add({
  name: 'Pinwheel', palette: pal(['wood', 'woodDark', 'pin1', 'pin2', 'pin3', 'pin4', 'gold']), heroSize: [420, 560],
  parts: { Pinwheel: { pivot: [0, 3.0, -0.12] } },
  build(B) {
    B.add(cyl(0.05, 0.06, 3.0, 6), { pos: [0, 1.5, 0], color: 'woodDark' });
    const P = into(B, 'Pinwheel');
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; const g = new THREE.BufferGeometry(); const pts = [[0, 0, 0], [Math.cos(a) * 0.75, Math.sin(a) * 0.75, 0], [Math.cos(a + 0.9) * 0.55, Math.sin(a + 0.9) * 0.55, 0.12]].map((p) => [p[0], p[1] + 3.0, p[2] - 0.12]); g.setAttribute('position', new THREE.Float32BufferAttribute([...pts[0], ...pts[1], ...pts[2], ...pts[0], ...pts[2], ...pts[1]], 3)); g.computeVertexNormals(); P.add(g, { color: ['pin1', 'pin2', 'pin3', 'pin4'][k] }); }
    P.add(ell(0.08, 0.08, 0.06, 6, 4), { pos: [0, 3.0, -0.15], color: 'gold' });
  },
  loopSeconds: 2,
});

// ---------- camp + decor ----------
add({
  name: 'ClayPot', palette: pal(['clay', 'clayDark', 'clayLight', 'clayPaint']), heroSize: [420, 480],
  build(B) {
    B.add(lathe([[0.35, 0], [0.55, 0.15], [0.72, 0.55], [0.7, 0.9], [0.45, 1.15], [0.32, 1.25], [0.38, 1.38], [0.3, 1.4], [0.27, 1.3]], 16), { color: 'clay' });
    for (const [y, r, c] of [[0.55, 0.735, 'clayPaint'], [0.75, 0.73, 'clayDark']]) B.add(torus(r, 0.04, 4, 18), { pos: [0, y, 0], rot: [Math.PI / 2, 0, 0], color: c });
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; B.add(ell(0.07, 0.07, 0.02, 6, 3), { pos: [Math.cos(a) * 0.72, 0.65, Math.sin(a) * 0.72], quat: surfaceQuat([Math.cos(a), 0, Math.sin(a)], [0, 1, 0]), color: 'clayPaint' }); }
  },
});
add({
  name: 'ClayPotGroup', palette: pal(['clay', 'clayDark', 'clayLight', 'clayPaint']), heroSize: [560, 440],
  build(B) {
    const one = (x, z, s, c) => { B.add(lathe([[0.35, 0], [0.55, 0.15], [0.72, 0.55], [0.7, 0.9], [0.45, 1.15], [0.32, 1.25], [0.38, 1.38], [0.3, 1.4], [0.27, 1.3]].map(([r, y]) => [r * s, y * s]), 14), { pos: [x, 0, z], color: c }); B.add(torus(0.735 * s, 0.04 * s, 4, 16), { pos: [x, 0.55 * s, z], rot: [Math.PI / 2, 0, 0], color: 'clayPaint' }); };
    one(0, 0, 1, 'clay'); one(1.2, 0.4, 0.75, 'clayLight'); one(-1.0, 0.5, 0.85, 'clayDark');
    for (const [x, z, sz, c] of [[0.9, -0.7, 0.2, 'clayDark'], [0.3, -1.2, 0.26, 'clay'], [-0.3, -0.9, 0.16, 'clayPaint'], [0.75, -1.3, 0.14, 'clay']]) B.add(new THREE.TetrahedronGeometry(sz), { pos: [x, sz * 0.4, z], rot: [x, z, 0], scale: [1.4, 0.5, 1], color: c });
  },
});
add({
  name: 'PicnicSet', palette: pal(['blanketA', 'blanketB', 'wicker', 'wickerDark', 'apple', 'appleGreen', 'canvasRed', 'woodLight']), heroSize: [600, 440],
  build(B) {
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) B.add(box(0.5, 0.03, 0.5), { pos: [-1.25 + i * 0.5, 0.02 + ((i + j) % 2) * 0.002, -1.25 + j * 0.5], color: (i + j) % 2 ? 'blanketA' : 'blanketB' });
    B.add(cyl(0.55, 0.45, 0.5, 12), { pos: [0.6, 0.27, 0.4], color: 'wicker' }); for (const y of [0.15, 0.32, 0.48]) B.add(torus(0.5 + (y - 0.3) * 0.15, 0.03, 4, 14), { pos: [0.6, y, 0.4], rot: [Math.PI / 2, 0, 0], color: 'wickerDark' });
    B.add(torus(0.42, 0.04, 4, 14, Math.PI), { pos: [0.6, 0.52, 0.4], color: 'wickerDark' });
    B.add(box(0.85, 0.06, 0.6), { pos: [0.55, 0.55, 0.4], rot: [0, 0, -0.5], color: 'canvasRed' });
    for (const [x, z, c] of [[-0.5, -0.4, 'apple'], [-0.2, -0.6, 'appleGreen'], [-0.7, 0.1, 'apple']]) B.add(ell(0.15, 0.14, 0.15, 8, 6), { pos: [x, 0.17, z], color: c });
    B.add(cyl(0.3, 0.3, 0.04, 12), { pos: [-0.6, 0.06, 0.7], color: 'woodLight' });
  },
});
add({
  name: 'CampTent', palette: pal(['canvas', 'canvasDark', 'canvasBlue', 'woodDark', 'rope', 'ink']), heroSize: [600, 480],
  build(B) {
    const L = 3.2, W = 1.6, H = 2.2;
    for (const s of [-1, 1]) { const g = new THREE.BufferGeometry(); const p = [[-L / 2, 0, s * W], [L / 2, 0, s * W], [L / 2, H, 0], [-L / 2, H, 0]]; g.setAttribute('position', new THREE.Float32BufferAttribute([...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[3], ...p[0], ...p[2], ...p[1], ...p[0], ...p[3], ...p[2]], 3)); g.computeVertexNormals(); B.add(g, { color: s > 0 ? 'canvas' : 'canvasDark' }); }
    { const g = new THREE.BufferGeometry(); const p = [[L / 2, 0, -W], [L / 2, 0, W], [L / 2, H, 0]]; g.setAttribute('position', new THREE.Float32BufferAttribute([...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[1]], 3)); g.computeVertexNormals(); B.add(g, { color: 'canvasDark' }); }
    { const g = new THREE.BufferGeometry(); const p = [[-L / 2, 0, -W * 0.15], [-L / 2 - 0.9, 0, -W * 0.9], [-L / 2, H * 0.95, 0]]; g.setAttribute('position', new THREE.Float32BufferAttribute([...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[1]], 3)); g.computeVertexNormals(); B.add(g, { color: 'canvasBlue' }); }
    { const g = new THREE.BufferGeometry(); const p = [[-L / 2, 0, -W], [-L / 2, 0, -W * 0.15], [-L / 2, H, 0]]; g.setAttribute('position', new THREE.Float32BufferAttribute([...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[1]], 3)); g.computeVertexNormals(); B.add(g, { color: 'canvasDark' }); }
    B.add(box(L + 0.3, 0.08, 0.08), { pos: [0, H + 0.02, 0], color: 'woodDark' });
    for (const x of [-L / 2 - 0.1, L / 2 + 0.1]) { B.add(box(0.08, H + 0.3, 0.08), { pos: [x, (H + 0.3) / 2, 0], color: 'woodDark' }); B.add(loft({ points: [[x, H + 0.2, 0], [x + Math.sign(x) * 0.8, H * 0.5, 0], [x + Math.sign(x) * 1.4, 0.05, 0]], rx: () => 0.02, ry: () => 0.02, rings: 4, seg: 3 }), { color: 'rope' }); B.add(cone(0.05, 0.3, 4), { pos: [x + Math.sign(x) * 1.4, 0.1, 0], rot: [Math.PI, 0, 0], color: 'woodDark' }); }
    B.add(box(0.03, 0.9, 0.03), { pos: [-L / 2 - 0.01, 0.6, -W * 0.15], color: 'ink' });
  },
});
add({
  name: 'VineCurtain', palette: pal(['bark', ...LEAF, 'petalWhite', 'petalYellow']), heroSize: [520, 600], parts: { Sway: { pivot: [0, 4, 0] } },
  build(B) {
    const S = into(B, 'Sway'), r = seeded(41);
    const bar = cyl(0.18, 0.18, 4.2, 8); bar.rotateZ(Math.PI / 2); B.add(bar, { pos: [0, 4.1, 0], color: 'bark' });
    const blobs = [];
    for (let i = 0; i < 9; i++) { const x = -1.8 + i * 0.45, len = 1.8 + r() * 2.0; S.add(loft({ points: [[x, 4.0, 0], [x + (r() - 0.5) * 0.2, 4 - len * 0.5, 0.05], [x + (r() - 0.5) * 0.3, 4 - len, 0]], rx: () => 0.03, ry: () => 0.03, rings: 6, seg: 3 }), { color: 'leafDeep' }); for (let k = 0; k < 4; k++) blobs.push([x, 3.8 - (k / 3) * len * 0.9, 0, 0.26 - k * 0.03]); }
    leafy(S, { blobs, shades: LEAF, count: 300, size: [0.3, 0.18], seed: 121, droop: 0.85, centre: [0, 3, -1], extra: ({ surface }) => { for (let i = 0; i < 8; i++) { const { p, n } = surface(); flower(B, p, n, 'petalWhite', 0.09); } } });
    leafy(B, { blobs: [[-1.9, 4.2, 0, 0.45], [0, 4.25, 0, 0.5], [1.9, 4.2, 0, 0.45]], shades: LEAF, count: 120, size: [0.36, 0.22], seed: 123 });
  },
  loopSeconds: 2,
});
add({
  name: 'LeafPile', palette: pal([...AUTUMN, 'woodDark', 'metal']), heroSize: [560, 420],
  build(B) {
    leafy(B, { blobs: [[0, 0.1, 0, 1.2], [0.9, 0.0, 0.4, 0.8], [-0.8, 0.0, -0.3, 0.85]], shades: AUTUMN, count: 320, size: [0.45, 0.3], seed: 125, droop: 0.3, centre: [0, -1, 0] });
    B.add(cyl(0.04, 0.04, 3.0, 5), { pos: [1.4, 0.35, -0.8], rot: [0, 0.5, 1.35], color: 'woodDark' });
    for (let k = 0; k < 6; k++) B.add(box(0.03, 0.03, 0.18), { pos: [2.7 + 0, 0.06, -0.85 + k * 0.08 - 0.2], rot: [0, 0.5, 0], color: 'metal' });
  },
});

export default list;
