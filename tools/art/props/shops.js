// Haven shop stands and machines: egg shop, incubator + station, upgrades booth,
// Index kiosk, gem shop and a quest board. Incubator domes are Glass.
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, crystal, cyl, box, torus, surfaceQuat } from '../lib.js';
import { eggGeo } from './eggs.js';

const C = {
  wood: '#a8703f', woodDark: '#744828', woodLight: '#c99258', canvas: '#f4e8cf', canvasRed: '#d9483b', canvasBlue: '#3d6fc4',
  canvasPurple: '#7a4fc4', gold: '#f2b33d', goldDeep: '#c27e1c', metal: '#6a7380', metalDark: '#353b44', stone: '#9b9a94',
  eggCream: '#f3e6c8', eggBlue: '#4f8fe6', eggPurple: '#9a5ae6', paper: '#f6efd9',
};
const pal = (keys) => keys.map((k) => [k, C[k]]);
const list = [];
const add = (spec) => list.push({ category: 'Shops', heroSize: [760, 680], fit: 0.85, ...spec });

// Striped awning with a scalloped edge, sloping down toward -Z.
function awning(B, w, d, y, colors) {
  const n = Math.round(w / 1.2);
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * (w / n);
    B.add(box(w / n, 0.12, d), { pos: [x, y, 0], rot: [-0.32, 0, 0], color: colors[i % 2] });
    const g = new THREE.CylinderGeometry(w / n / 2, w / n / 2, 0.12, 10, 1, false, 0, Math.PI); g.rotateX(Math.PI / 2); g.rotateZ(Math.PI);
    B.add(g, { pos: [x, y - Math.sin(0.32) * d / 2 - 0.02, -Math.cos(0.32) * d / 2], rot: [0, 0, 0], color: colors[i % 2] });
  }
}
function eggOn(B, pos, color, s = 0.5) { B.add(eggGeo(12, 10), { pos, scale: [s, s, s], color }); }

add({
  name: 'EggShop', palette: pal(['wood', 'woodDark', 'woodLight', 'canvas', 'canvasRed', 'gold', 'goldDeep', 'eggCream', 'eggBlue', 'eggPurple']), glow: { Glow: '#ffe07a', Lamp: '#ffd36b' },
  build(B) {
    B.add(box(10, 0.4, 6), { pos: [0, 0.2, 0], color: 'woodDark' });
    B.add(box(9, 2.4, 1.6), { pos: [0, 1.6, -1.6], color: 'wood' });
    B.add(box(9.4, 0.25, 1.9), { pos: [0, 2.9, -1.6], color: 'woodLight' });
    for (let i = 0; i < 6; i++) B.add(box(0.15, 2.0, 0.12), { pos: [-3.75 + i * 1.5, 1.6, -2.42], color: 'woodDark' });
    for (const x of [-4.6, 4.6]) for (const z of [-2.4, 2.4]) B.add(box(0.4, 5.6, 0.4), { pos: [x, 3, z], color: 'woodDark' });
    awning(B, 10.4, 5.6, 6.0, ['canvasRed', 'canvas']);
    for (let s = 0; s < 2; s++) { B.add(box(8.6, 0.2, 1.0), { pos: [0, 1.4 + s * 1.5, 2.2], color: 'woodLight' }); for (let k = 0; k < 5; k++) eggOn(B, [-3.4 + k * 1.7, 1.5 + s * 1.5, 2.2], ['eggCream', 'eggBlue', 'eggPurple', 'gold', 'eggCream'][(k + s) % 5], 0.45); }
    B.add(box(8.8, 3.4, 0.2), { pos: [0, 2.3, 2.75], color: 'wood' });
    for (let k = 0; k < 3; k++) eggOn(B, [-2 + k * 2, 3.0, -1.6], ['eggBlue', 'gold', 'eggPurple'][k], 0.55);
    // big egg sign
    B.add(box(0.3, 2, 0.3), { pos: [0, 7.4, -0.8], color: 'woodDark' });
    B.add(eggGeo(), { pos: [0, 7.9, -0.8], scale: [1.4, 1.4, 0.45], color: 'gold' });
    B.add(torus(1.0, 0.1, 6, 24), { pos: [0, 9.7, -0.8], scale: [1.3, 1.6, 1], mesh: 'Glow' });
    for (const x of [-4.6, 4.6]) B.add(ell(0.3, 0.42, 0.3, 8, 6), { pos: [x, 5.1, -2.9], mesh: 'Lamp' });
  },
});
function incubator(B, x = 0, z = 0, s = 1) {
  const P = (a, b, c) => [x + a * s, b * s, z + c * s];
  B.add(cyl(1.6 * s, 1.9 * s, 0.8 * s, 16), { pos: P(0, 0.4, 0), color: 'metalDark' });
  B.add(cyl(1.5 * s, 1.6 * s, 0.6 * s, 16), { pos: P(0, 1.1, 0), color: 'gold' });
  B.add(torus(1.55 * s, 0.09 * s, 5, 32), { pos: P(0, 1.42, 0), rot: [Math.PI / 2, 0, 0], mesh: 'Glow' });
  B.add(cyl(1.1 * s, 1.2 * s, 0.25 * s, 16), { pos: P(0, 1.55, 0), color: 'canvasRed' });
  const dome = new THREE.SphereGeometry(1.35 * s, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2); dome.scale(1, 1.55, 1);
  B.add(dome, { pos: P(0, 1.42, 0), mesh: 'Glass' });
  B.add(torus(1.36 * s, 0.1 * s, 5, 32), { pos: P(0, 1.45, 0), rot: [Math.PI / 2, 0, 0], color: 'goldDeep' });
  B.add(cyl(0.25 * s, 0.3 * s, 0.4 * s, 10), { pos: P(0, 3.6, 0), color: 'gold' });
  B.add(ell(0.22 * s, 0.22 * s, 0.22 * s, 8, 6), { pos: P(0, 3.9, 0), mesh: 'Glow' });
  for (const a of [0.6, 2.5, 4.4]) B.add(loft({ points: [P(Math.cos(a) * 1.75, 0.6, Math.sin(a) * 1.75), P(Math.cos(a) * 2.1, 1.2, Math.sin(a) * 2.1), P(Math.cos(a) * 1.6, 1.25, Math.sin(a) * 1.6)], rx: () => 0.1 * s, ry: () => 0.1 * s, rings: 8, seg: 6 }), { color: 'metal' });
}
add({ name: 'Incubator', palette: pal(['metal', 'metalDark', 'gold', 'goldDeep', 'canvasRed']), glow: { Glow: '#7ff3ff' }, glass: { Glass: '#bfefff' }, heroSize: [520, 620], build(B) { incubator(B); } });
add({
  name: 'IncubatorStation', palette: pal(['metal', 'metalDark', 'gold', 'goldDeep', 'canvasRed', 'canvasBlue', 'canvas', 'woodDark', 'stone']), glow: { Glow: '#7ff3ff' }, glass: { Glass: '#bfefff' },
  build(B) {
    B.add(box(13, 0.6, 5.5), { pos: [0, 0.3, 0], color: 'stone' });
    for (const x of [-4.2, 0, 4.2]) incubator(B, x, 0, 1);
    for (const x of [-6.2, 6.2]) B.add(box(0.5, 6.4, 0.5), { pos: [x, 3.2, 1.6], color: 'woodDark' });
    awning(B, 13.4, 4.2, 6.6, ['canvasBlue', 'canvas']);
    B.add(loft({ points: [[-4.2, 0.7, 1.9], [-2, 0.75, 2.3], [2, 0.75, 2.3], [4.2, 0.7, 1.9]], rx: () => 0.14, ry: () => 0.14, rings: 20, seg: 6 }), { color: 'gold' });
  },
});
add({
  name: 'UpgradeBooth', palette: pal(['wood', 'woodDark', 'canvas', 'canvasBlue', 'gold', 'goldDeep', 'metal', 'metalDark']), glow: { Glow: '#7ff3ff', Potion: '#ff7ad9', Lamp: '#ffd36b' },
  build(B) {
    B.add(cyl(4.6, 4.8, 0.4, 20), { pos: [0, 0.2, 0], color: 'woodDark' });
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; B.add(cyl(0.15, 0.18, 4.6, 6), { pos: [Math.cos(a) * 4.2, 2.5, Math.sin(a) * 4.2], color: 'woodDark' }); }
    for (let k = 0; k < 12; k++) { const g = new THREE.ConeGeometry(5.2, 3.6, 12, 1, true, (k / 12) * Math.PI * 2, Math.PI / 6); B.add(g, { pos: [0, 6.6, 0], color: k % 2 ? 'canvasBlue' : 'canvas' }); }
    B.add(cone(0.3, 1, 6), { pos: [0, 8.9, 0], color: 'gold' });
    B.add(box(5, 1.6, 1.6), { pos: [0, 1.2, -2], color: 'wood' });
    for (let k = 0; k < 4; k++) { const x = -1.8 + k * 1.2; B.add(cyl(0.22, 0.28, 0.6, 8), { pos: [x, 2.3, -2], mesh: k % 2 ? 'Potion' : 'Glow' }); B.add(cyl(0.08, 0.1, 0.3, 6), { pos: [x, 2.75, -2], color: 'metalDark' }); }
    // gear sign
    const gear = new THREE.CylinderGeometry(1.0, 1.0, 0.3, 10); gear.rotateX(Math.PI / 2);
    B.add(gear, { pos: [0, 4.6, -4.1], color: 'gold' });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; B.add(box(0.4, 0.4, 0.3), { pos: [Math.cos(a) * 1.15, 4.6 + Math.sin(a) * 1.15, -4.1], rot: [0, 0, a], color: 'gold' }); }
    B.add(cyl(0.4, 0.4, 0.35, 10), { pos: [0, 4.6, -4.12], rot: [Math.PI / 2, 0, 0], color: 'goldDeep' });
    B.add(ell(0.3, 0.42, 0.3, 8, 6), { pos: [3, 4.4, -2.9], mesh: 'Lamp' });
  },
});
add({
  name: 'IndexKiosk', palette: pal(['stone', 'woodDark', 'wood', 'gold', 'goldDeep', 'paper', 'canvasPurple', 'canvasRed']), glow: { Glow: '#9fe0ff', Rune: '#ffd36b' }, heroSize: [620, 680],
  build(B) {
    B.add(cyl(2.4, 2.8, 0.6, 8), { pos: [0, 0.3, 0], color: 'stone' });
    B.add(cyl(1.0, 1.4, 2.8, 8), { pos: [0, 2.0, 0], color: 'canvasPurple' });
    B.add(cyl(1.6, 1.2, 0.4, 8), { pos: [0, 3.6, 0], color: 'gold' });
    for (const side of [-1, 1]) {
      B.add(box(2.0, 0.18, 2.6), { pos: [side * 1.0, 4.1, 0], rot: [0, 0, side * 0.22], color: 'canvasRed' });
      B.add(box(1.85, 0.2, 2.4), { pos: [side * 0.95, 4.25, 0], rot: [0, 0, side * 0.2], color: 'paper' });
      for (let k = 0; k < 3; k++) B.add(box(1.2, 0.04, 0.12), { pos: [side * 0.95, 4.42 + (k === 1 ? 0 : 0), -0.6 + k * 0.6], rot: [0, 0, side * 0.2], mesh: 'Rune' });
    }
    B.add(crystal(0.5, 1.6), { pos: [0, 5.6, 0], mesh: 'Glow' });
    B.add(torus(0.9, 0.06, 4, 24), { pos: [0, 6.2, 0], rot: [Math.PI / 2 - 0.3, 0, 0], color: 'gold' });
  },
});
add({
  name: 'GemShop', palette: pal(['woodDark', 'wood', 'canvas', 'canvasPurple', 'gold', 'goldDeep', 'stone']), glow: { Glow: '#c88aff', GlowCore: '#7ff3ff' },
  build(B) {
    B.add(box(8, 0.4, 5), { pos: [0, 0.2, 0], color: 'stone' });
    B.add(box(7, 2.2, 1.6), { pos: [0, 1.5, -1.3], color: 'canvasPurple' });
    B.add(box(7.3, 0.25, 1.9), { pos: [0, 2.7, -1.3], color: 'gold' });
    for (const x of [-3.6, 3.6]) for (const z of [-2, 2]) B.add(box(0.4, 5.4, 0.4), { pos: [x, 2.9, z], color: 'woodDark' });
    awning(B, 8.4, 4.8, 5.8, ['canvasPurple', 'canvas']);
    for (let k = 0; k < 4; k++) B.add(crystal(0.28, 0.8), { pos: [-2.4 + k * 1.6, 2.85, -1.3], mesh: k % 2 ? 'GlowCore' : 'Glow' });
    B.add(crystal(0.9, 2.6), { pos: [0, 7.0, -0.6], mesh: 'Glow' });
    B.add(crystal(0.9, 1.2), { pos: [0, 7.05, -0.6], rot: [Math.PI, 0, 0], mesh: 'Glow' });
    B.add(torus(1.3, 0.1, 5, 24), { pos: [0, 7.6, -0.6], rot: [Math.PI / 2, 0, 0], color: 'gold' });
  },
});
add({
  name: 'QuestBoard', palette: pal(['wood', 'woodDark', 'woodLight', 'paper', 'canvasRed', 'gold']), heroSize: [620, 620],
  build(B) {
    for (const x of [-2.4, 2.4]) B.add(box(0.4, 5, 0.4), { pos: [x, 2.5, 0], color: 'woodDark' });
    B.add(box(5.2, 3.2, 0.25), { pos: [0, 3.0, 0], color: 'woodLight' });
    B.add(box(5.8, 0.4, 0.6), { pos: [0, 4.8, 0], color: 'wood' });
    const roof = new THREE.CylinderGeometry(0.1, 3.4, 1.2, 4, 1); B.add(roof, { pos: [0, 5.6, 0], rot: [0, Math.PI / 4, 0], scale: [1.2, 1, 0.35], color: 'canvasRed' });
    for (const [x, y, a] of [[-1.5, 3.6, 0.08], [0, 3.4, -0.05], [1.5, 3.7, 0.1], [-0.8, 2.2, -0.08], [1.0, 2.1, 0.06]]) { B.add(box(1.1, 1.3, 0.05), { pos: [x, y, -0.16], rot: [0, 0, a], color: 'paper' }); B.add(ell(0.08, 0.08, 0.05, 6, 4), { pos: [x, y + 0.5, -0.2], color: 'canvasRed' }); for (let k = 0; k < 3; k++) B.add(box(0.7, 0.05, 0.03), { pos: [x, y + 0.15 - k * 0.22, -0.2], rot: [0, 0, a], color: 'woodDark' }); }
  },
});

export default list;
