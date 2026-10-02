// v2 icon models: chunky 3D versions of currencies, boosts and rewards. Use them as world
// pickups / shop displays, and their transparent renders (assets/v2/icons/<Name>.png) as
// UI icons. All face -Z with a slight tilt so they read well as icons.
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, crystal, flame, bolt, torus, surfaceQuat } from '../lib.js';

const list = [];
const add = (spec) => list.push({ category: 'Icons', v2: true, icon: true, heroSize: [512, 512], view: [-0.32, 0.22, -1], margin: 0.8, bg: '#2a2236', ...spec });
const lathe = (pts, seg = 24) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)), seg);
// extruded 2D shape (in XY), centred, depth along Z
function slab(pts, depth, bevel = 0.06, curve = 6) {
  const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: curve });
  g.translate(0, 0, -depth / 2); g.deleteAttribute('uv'); g.computeVertexNormals(); return g;
}
const starPts = (n, R, r, rot = Math.PI / 2) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = rot + (i * Math.PI) / n, rr = i % 2 ? r : R; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return p; };
const heartPts = () => { const p = []; for (let i = 0; i < 48; i++) { const t = (i / 48) * Math.PI * 2; p.push([16 * Math.sin(t) ** 3 / 16, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16]); } return p; };
const tilt = (x, y = 0) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, 0));

function coin(B, pos, r = 0.9, face = 'gold', rim = 'goldDeep', mark = 'goldLight', q = tilt(0.15, 0.35)) {
  const g = new THREE.CylinderGeometry(r, r, r * 0.22, 32); g.rotateX(Math.PI / 2);
  B.add(g, { pos, quat: q, color: rim });
  for (const z of [-1, 1]) {
    const f = new THREE.CylinderGeometry(r * 0.86, r * 0.86, r * 0.05, 32); f.rotateX(Math.PI / 2); f.translate(0, 0, z * r * 0.11);
    B.add(f, { pos, quat: q, color: face });
    const st = slab(starPts(5, r * 0.45, r * 0.2), r * 0.04, 0.02); st.translate(0, 0, z * r * 0.14);
    B.add(st, { pos, quat: q, color: mark });
  }
}
const GOLD = [['gold', '#f6c445'], ['goldDeep', '#c27e1c'], ['goldLight', '#ffe9a0']];

add({ name: 'Coin3D', palette: GOLD, glow: { Glow: '#fff1a0' }, build(B) { coin(B, [0, 1, 0]); B.add(new THREE.OctahedronGeometry(0.12, 0), { pos: [-0.55, 1.6, -0.3], scale: [1, 2, 1], mesh: 'Glow' }); } });
add({ name: 'CoinStack', palette: GOLD, build(B) { for (let k = 0; k < 5; k++) coin(B, [0.05 * Math.sin(k * 2), 0.2 + k * 0.22, 0], 0.75, 'gold', 'goldDeep', 'goldLight', tilt(Math.PI / 2, k * 0.4)); coin(B, [0.9, 0.6, -0.2], 0.6); coin(B, [-0.8, 0.45, -0.3], 0.55, 'gold', 'goldDeep', 'goldLight', tilt(1.2, -0.4)); } });
const GEM = [['gem', '#8a5ae6'], ['gemDeep', '#5a32b0'], ['gemLight', '#c8a8ff']];
function gem(B, pos, s = 1, cols = ['gem', 'gemDeep', 'gemLight']) {
  B.add(new THREE.CylinderGeometry(0.75 * s, 0.0, 1.0 * s, 8, 1), { pos: [pos[0], pos[1] - 0.15 * s, pos[2]], color: cols[1] });
  B.add(new THREE.CylinderGeometry(0.45 * s, 0.75 * s, 0.4 * s, 8, 1), { pos: [pos[0], pos[1] + 0.55 * s, pos[2]], color: cols[0] });
  B.add(new THREE.CylinderGeometry(0.45 * s, 0.45 * s, 0.02 * s, 8, 1), { pos: [pos[0], pos[1] + 0.76 * s, pos[2]], color: cols[2] });
}
add({ name: 'Gem3D', palette: GEM, glow: { Glow: '#f0e0ff' }, build(B) { gem(B, [0, 1, 0]); B.add(new THREE.OctahedronGeometry(0.12, 0), { pos: [0.55, 1.75, -0.3], scale: [1, 2, 1], mesh: 'Glow' }); } });
add({ name: 'GemPile', palette: [...GEM, ['ruby', '#e8283a'], ['rubyDeep', '#a01a2a'], ['rubyLight', '#ff8a96'], ['emerald', '#2fae5a'], ['emeraldDeep', '#1a7a3a'], ['emeraldLight', '#8ae8a8']], build(B) { gem(B, [0, 0.9, 0]); gem(B, [0.85, 0.55, 0.2], 0.65, ['ruby', 'rubyDeep', 'rubyLight']); gem(B, [-0.8, 0.5, 0.1], 0.6, ['emerald', 'emeraldDeep', 'emeraldLight']); gem(B, [0.3, 0.35, -0.7], 0.45, ['gemLight', 'gem', 'gemLight']); } });
add({ name: 'Star3D', palette: GOLD, glow: { Glow: '#fff1a0' }, build(B) { B.add(slab(starPts(5, 1.0, 0.45), 0.35, 0.12), { pos: [0, 1, 0], quat: tilt(0.1, 0.3), color: 'gold' }); B.add(slab(starPts(5, 0.55, 0.25), 0.1, 0.05), { pos: [0, 1.02, -0.2], quat: tilt(0.1, 0.3), color: 'goldLight' }); } });
add({ name: 'Heart3D', palette: [['heart', '#ff4f7a'], ['heartDeep', '#c8284e'], ['heartLight', '#ffa8c0']], build(B) { B.add(slab(heartPts(), 0.4, 0.15, 12), { pos: [0, 1, 0], quat: tilt(0.1, 0.3), color: 'heart' }); B.add(ell(0.18, 0.1, 0.05, 8, 4), { pos: [-0.38, 1.28, -0.38], rot: [0, 0.3, 0.6], color: 'heartLight' }); } });
add({
  name: 'Trophy3D', palette: [...GOLD, ['base', '#5a3a2a'], ['plate', '#e8eef6']],
  build(B) { B.add(lathe([[0.0, 1.0], [0.7, 1.0], [0.75, 1.4], [0.7, 1.9], [0.55, 2.0], [0.0, 2.0]], 24), { color: 'gold' }); B.add(lathe([[0.55, 0.0], [0.6, 0.35], [0.12, 0.45], [0.12, 0.85], [0.3, 1.0]], 20), { color: 'goldDeep' }); for (const x of [-1, 1]) B.add(new THREE.TorusGeometry(0.3, 0.07, 6, 16, Math.PI), { pos: [0.72 * x, 1.55, 0], rot: [0, 0, -x * Math.PI / 2], color: 'gold' }); B.add(new THREE.BoxGeometry(1.2, 0.3, 1.0), { pos: [0, 0.15, 0], color: 'base' }); B.add(new THREE.BoxGeometry(0.6, 0.15, 0.02), { pos: [0, 0.15, -0.51], color: 'plate' }); B.add(slab(starPts(5, 0.25, 0.11), 0.06, 0.02), { pos: [0, 1.5, -0.74], color: 'goldLight' }); },
});
add({
  name: 'Key3D', palette: GOLD, view: [-0.32, 0.6, -1],
  build(B) { const q = tilt(0, 0.2); B.add(new THREE.TorusGeometry(0.42, 0.13, 8, 24), { pos: [-0.75, 1, 0], quat: q, color: 'gold' }); B.add(new THREE.BoxGeometry(1.5, 0.2, 0.18), { pos: [0.25, 1, 0], quat: q, color: 'goldDeep' }); for (const [x, h] of [[0.75, 0.42], [0.45, 0.3]]) B.add(new THREE.BoxGeometry(0.16, h, 0.18), { pos: [x, 1 - h / 2, 0], quat: q, color: 'gold' }); B.add(ell(0.18, 0.18, 0.08, 10, 6), { pos: [-0.75, 1, -0.06], quat: q, color: 'goldLight' }); },
});
add({ name: 'Crown3D', palette: [...GOLD, ['ruby', '#e8283a'], ['velvet', '#7a2a6a']], build(B) { B.add(new THREE.CylinderGeometry(0.75, 0.7, 0.45, 24, 1, true), { pos: [0, 0.45, 0], color: 'gold' }); B.add(new THREE.CylinderGeometry(0.68, 0.68, 0.3, 20), { pos: [0, 0.4, 0], color: 'velvet' }); for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; B.add(cone(0.18, 0.6, 4), { pos: [Math.cos(a) * 0.7, 0.95, Math.sin(a) * 0.7], color: 'gold' }); B.add(ell(0.08, 0.08, 0.08, 8, 6), { pos: [Math.cos(a) * 0.7, 1.28, Math.sin(a) * 0.7], color: 'goldLight' }); B.add(new THREE.OctahedronGeometry(0.09, 0), { pos: [Math.cos(a + 0.6) * 0.76, 0.45, Math.sin(a + 0.6) * 0.76], color: 'ruby' }); } for (const y of [0.24, 0.66]) B.add(new THREE.TorusGeometry(0.74, 0.05, 6, 28), { pos: [0, y, 0], rot: [Math.PI / 2, 0, 0], color: 'goldDeep' }); } });
add({ name: 'GiftBox3D', palette: [['box', '#3d9fe8'], ['boxDeep', '#2a78c0'], ['ribbon', '#ffd84a'], ['ribbonDeep', '#e0a82a']], build(B) { B.add(new THREE.BoxGeometry(1.4, 1.1, 1.4), { pos: [0, 0.55, 0], color: 'box' }); B.add(new THREE.BoxGeometry(1.55, 0.3, 1.55), { pos: [0, 1.2, 0], color: 'boxDeep' }); for (const r of [0, Math.PI / 2]) B.add(new THREE.BoxGeometry(0.3, 1.42, 1.58), { pos: [0, 0.71, 0], rot: [0, r, 0], color: 'ribbon' }); for (const x of [-1, 1]) B.add(new THREE.TorusGeometry(0.28, 0.1, 6, 14), { pos: [0.25 * x, 1.55, 0], rot: [0, Math.PI / 2, x * 0.5], scale: [1, 1, 0.6], color: 'ribbonDeep' }); B.add(ell(0.15, 0.13, 0.15, 8, 6), { pos: [0, 1.42, 0], color: 'ribbon' }); } });
function potion(B, liquid, liquidLight, cork = 'cork') {
  B.add(lathe([[0.0, 0.0], [0.55, 0.05], [0.75, 0.45], [0.7, 0.9], [0.32, 1.25], [0.25, 1.5], [0.3, 1.55], [0.0, 1.55]], 24), { mesh: 'Glass' });
  B.add(lathe([[0.0, 0.08], [0.52, 0.12], [0.69, 0.45], [0.64, 0.85], [0.0, 0.85]], 24), { mesh: 'Glow' });
  B.add(new THREE.CylinderGeometry(0.22, 0.2, 0.3, 12), { pos: [0, 1.65, 0], color: cork });
  B.add(ell(0.15, 0.25, 0.06, 8, 5), { pos: [-0.38, 0.75, -0.55], rot: [0, 0.6, 0.2], color: 'shine' });
}
for (const [n, c, l] of [['PotionLuck', '#5fdc5a', '#c8ff9a'], ['PotionSpeed', '#3fb8ff', '#b8ecff'], ['PotionCoins', '#ffc83a', '#fff0a0'], ['PotionPower', '#ff4f5a', '#ffb0b6']]) {
  add({ name: n, palette: [['cork', '#a8703f'], ['shine', '#ffffff']], glow: { Glow: c }, glass: { Glass: '#dff4ff' }, build(B) { potion(B); } });
}
add({ name: 'Ticket3D', palette: [['ticket', '#ff7a6a'], ['ticketDeep', '#d84a3a'], ['ink', '#fff2d6']], build(B) { const pts = []; const w = 1.1, h = 0.6; for (const [x, y] of [[-w, -h], [w, -h], [w, -0.15], [w - 0.15, 0], [w, 0.15], [w, h], [-w, h], [-w, 0.15], [-w + 0.15, 0], [-w, -0.15]]) pts.push([x, y]); B.add(slab(pts, 0.12, 0.04), { pos: [0, 1, 0], quat: tilt(0.2, 0.35), color: 'ticket' }); B.add(slab(starPts(5, 0.28, 0.12), 0.05, 0.02), { pos: [0, 1.02, -0.12], quat: tilt(0.2, 0.35), color: 'ink' }); for (const x of [-0.75, 0.75]) B.add(new THREE.BoxGeometry(0.03, 0.9, 0.02), { pos: [x, 1, -0.1], quat: tilt(0.2, 0.35), color: 'ticketDeep' }); } });
add({ name: 'Scroll3D', palette: [['paper', '#f6e6c0'], ['paperDeep', '#d8c090'], ['wood', '#8a5a34'], ['seal', '#e8283a']], build(B) { const p = new THREE.CylinderGeometry(0.45, 0.45, 1.8, 20, 1, true); p.rotateZ(Math.PI / 2); B.add(p, { pos: [0, 1, 0], color: 'paper' }); for (const x of [-1, 1]) { const r = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 10); r.rotateZ(Math.PI / 2); B.add(r, { pos: [x * 1.05, 1, 0], color: 'wood' }); B.add(ell(0.15, 0.15, 0.15, 8, 6), { pos: [x * 1.25, 1, 0], color: 'wood' }); } B.add(new THREE.BoxGeometry(1.2, 0.04, 0.9), { pos: [0, 0.6, -0.45], rot: [0.4, 0, 0], color: 'paperDeep' }); B.add(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12), { pos: [0, 0.95, -0.47], rot: [Math.PI / 2, 0, 0], color: 'seal' }); } });
add({ name: 'Lock3D', palette: [['metal', '#9aa8bc'], ['metalDeep', '#5b6470'], ['gold', '#f6c445']], build(B) { B.add(new THREE.TorusGeometry(0.45, 0.13, 8, 20, Math.PI), { pos: [0, 1.35, 0], color: 'metal' }); for (const x of [-1, 1]) B.add(new THREE.CylinderGeometry(0.13, 0.13, 0.35, 10), { pos: [0.45 * x, 1.2, 0], color: 'metal' }); B.add(new THREE.BoxGeometry(1.3, 1.0, 0.5), { pos: [0, 0.6, 0], color: 'gold' }); B.add(ell(0.13, 0.13, 0.05, 8, 5), { pos: [0, 0.72, -0.26], color: 'metalDeep' }); B.add(new THREE.BoxGeometry(0.1, 0.3, 0.05), { pos: [0, 0.5, -0.26], color: 'metalDeep' }); } });
add({ name: 'Shield3D', palette: [['shield', '#3d6fc4'], ['shieldDeep', '#2a4f91'], ['rim', '#e8eef6'], ['gold', '#f6c445']], build(B) { const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([-0.9 + 1.8 * t, 0.9 - 0.08 * Math.sin(Math.PI * t)]); } for (let i = 1; i < 20; i++) { const t = i / 20, a = Math.PI * t; pts.push([0.9 * Math.cos(a) * (1 - 0.1 * t), -0.1 - 1.0 * Math.sin(a) * (0.6 + 0.4 * t)]); } B.add(slab(pts.reverse(), 0.2, 0.08, 4), { pos: [0, 1.1, 0], quat: tilt(0.1, 0.3), color: 'shield' }); B.add(slab(starPts(5, 0.4, 0.18), 0.06, 0.03), { pos: [0, 1.15, -0.18], quat: tilt(0.1, 0.3), color: 'gold' }); } });
add({ name: 'Bolt3D', palette: [['bolt', '#ffd84a'], ['boltDeep', '#e0a82a']], glow: { Glow: '#fff6a0' }, build(B) { B.add(slab([[0.2, 1.1], [-0.55, -0.05], [-0.05, -0.05], [-0.3, -1.1], [0.55, 0.2], [0.05, 0.2], [0.35, 1.1]], 0.3, 0.1, 2), { pos: [0, 1.1, 0], quat: tilt(0.1, 0.3), color: 'bolt' }); } });
add({ name: 'Paw3D', palette: [['paw', '#ff9ec7'], ['pawDeep', '#e46aa0']], build(B) { const q = tilt(0.25, 0.3); B.add(ell(0.55, 0.45, 0.2, 18, 10), { pos: [0, 0.85, 0], quat: q, color: 'paw' }); for (const [x, y, r] of [[-0.55, 1.35, 0.2], [-0.2, 1.6, 0.22], [0.2, 1.6, 0.22], [0.55, 1.35, 0.2]]) B.add(ell(r, r * 1.2, 0.17, 14, 8), { pos: V([x, y, 0]).applyQuaternion(q).add(V([0, 0, 0])).toArray(), quat: q, color: 'pawDeep' }); } });
add({ name: 'Hourglass3D', palette: [['wood', '#8a5a34'], ['sand', '#f2c86a']], glass: { Glass: '#dff4ff' }, build(B) { for (const y of [0.05, 1.95]) B.add(new THREE.CylinderGeometry(0.75, 0.75, 0.15, 6), { pos: [0, y, 0], color: 'wood' }); for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.5; B.add(new THREE.CylinderGeometry(0.06, 0.06, 1.9, 6), { pos: [Math.cos(a) * 0.62, 1, Math.sin(a) * 0.62], color: 'wood' }); } B.add(lathe([[0.0, 0.12], [0.5, 0.15], [0.48, 0.6], [0.08, 1.0], [0.48, 1.4], [0.5, 1.85], [0.0, 1.88]], 20), { mesh: 'Glass' }); B.add(lathe([[0.0, 0.14], [0.45, 0.16], [0.38, 0.45], [0.0, 0.55]], 16), { color: 'sand' }); B.add(lathe([[0.0, 1.05], [0.3, 1.3], [0.0, 1.3]], 16), { color: 'sand' }); } });
add({ name: 'Magnet3D', palette: [['red', '#e8473a'], ['redDeep', '#a8302a'], ['metal', '#e8eef6']], build(B) { const q = tilt(0, 0.3); B.add(new THREE.TorusGeometry(0.6, 0.28, 10, 24, Math.PI), { pos: [0, 1.3, 0], quat: q, color: 'red' }); for (const x of [-1, 1]) { B.add(new THREE.BoxGeometry(0.56, 0.5, 0.56), { pos: V([0.6 * x, 1.05, 0]).applyQuaternion(q).toArray(), quat: q, color: 'redDeep' }); B.add(new THREE.BoxGeometry(0.56, 0.35, 0.56), { pos: V([0.6 * x, 0.65, 0]).applyQuaternion(q).toArray(), quat: q, color: 'metal' }); } } });
add({ name: 'Clover3D', palette: [['clover', '#4fc44a'], ['cloverDeep', '#2f8a35'], ['cloverLight', '#9fe08a']], build(B) { const q = tilt(0.35, 0.3); for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; for (const s of [-1, 1]) B.add(ell(0.32, 0.3, 0.1, 14, 8), { pos: V([Math.cos(a) * 0.45 + Math.cos(a + s * 0.8) * 0.12, Math.sin(a) * 0.45 + Math.sin(a + s * 0.8) * 0.12, 0]).applyQuaternion(q).add(V([0, 1.1, 0])).toArray(), quat: q, color: k % 2 ? 'clover' : 'cloverLight' }); } B.add(ell(0.12, 0.12, 0.12, 8, 6), { pos: [0, 1.1, 0], color: 'cloverDeep' }); B.add(loft({ points: [[0, 1.0, 0.05], [0.1, 0.6, 0.2], [0.3, 0.2, 0.3]], rx: () => 0.06, ry: () => 0.06, rings: 6, seg: 5 }), { color: 'cloverDeep' }); } });
add({
  name: 'ChestRarity', palette: [['wood', '#7a4fd8'], ['woodDeep', '#4a2a90'], ['gold', '#f6c445'], ['goldDeep', '#c27e1c']], glow: { Glow: '#ffe07a' },
  build(B) { B.add(new THREE.BoxGeometry(1.6, 0.9, 1.0), { pos: [0, 0.45, 0], color: 'wood' }); const lid = new THREE.CylinderGeometry(0.5, 0.5, 1.6, 16, 1, false, 0, Math.PI); lid.rotateZ(Math.PI / 2); B.add(lid, { pos: [0, 0.9, 0], color: 'woodDeep' }); for (const x of [-0.7, 0.7]) B.add(new THREE.BoxGeometry(0.14, 0.95, 1.04), { pos: [x, 0.47, 0], color: 'gold' }); for (const x of [-0.7, 0.7]) { const b = new THREE.CylinderGeometry(0.53, 0.53, 0.14, 16, 1, false, 0, Math.PI); b.rotateZ(Math.PI / 2); B.add(b, { pos: [x, 0.9, 0], color: 'gold' }); } B.add(new THREE.BoxGeometry(0.35, 0.4, 0.08), { pos: [0, 0.82, -0.53], color: 'goldDeep' }); B.add(ell(0.6, 0.1, 0.35, 10, 4), { pos: [0, 0.92, -0.4], mesh: 'Glow' }); },
});

export default list;
