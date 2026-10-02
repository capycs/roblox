// Ancient ruins for the riskier parts of the Wilds: pillars, arches, walls, steps,
// a creature statue, rune stones and an obelisk. Rune glows are Neon.
import * as THREE from 'three';
import { V, ell, cone, quatTo, box, cyl, blade, crystal, rock, surfaceQuat, loft } from '../lib.js';

const C = { stone: '#b8ad98', stoneDark: '#8c8270', stoneLight: '#d2c8b2', moss: '#5f9a3c', mossDark: '#3b6a2a', vine: '#4a8a36', gold: '#d9a53a' };
const pal = (keys) => keys.map((k) => [k, C[k]]);
const list = [];
const add = (spec) => list.push({ category: 'Ruins', heroSize: [520, 620], fit: 0.9, glow: { Rune: '#66e8ff' }, ...spec });
const STONE = pal(['stone', 'stoneDark', 'stoneLight', 'moss', 'mossDark', 'vine', 'gold']);

function column(B, h, broken = false, x = 0, z = 0) {
  B.add(box(2.2, 0.6, 2.2), { pos: [x, 0.3, z], color: 'stoneDark' });
  B.add(cyl(0.95, 1.0, 0.4, 14), { pos: [x, 0.8, z], color: 'stoneLight' });
  const segs = Math.round(h / 1.6);
  for (let i = 0; i < segs; i++) {
    if (broken && i === segs - 1) {
      const g = new THREE.CylinderGeometry(0.75, 0.8, 1.6, 12, 2); const P = g.attributes.position;
      for (let k = 0; k < P.count; k++) if (P.getY(k) > 0) P.setY(k, P.getY(k) - 0.7 * (0.5 + 0.5 * Math.sin(Math.atan2(P.getZ(k), P.getX(k)) * 3)));
      g.computeVertexNormals(); B.add(g, { pos: [x, 1.0 + i * 1.6 + 0.8, z], rot: [0, i, 0], color: 'stone' });
    } else {
      B.add(cyl(0.75, 0.8, 1.55, 12), { pos: [x, 1.0 + i * 1.6 + 0.8, z], rot: [0, i * 0.4, 0], color: i % 2 ? 'stone' : 'stoneLight' });
    }
  }
  if (!broken) { B.add(cyl(1.0, 0.85, 0.5, 14), { pos: [x, 1.0 + segs * 1.6 + 0.25, z], color: 'stoneLight' }); B.add(box(2.2, 0.5, 2.2), { pos: [x, 1.0 + segs * 1.6 + 0.75, z], color: 'stoneDark' }); }
  B.add(loft({ points: [[x + 0.8, 0.8, z], [x + 0.2, 2.5, z - 0.75], [x - 0.75, 4.0, z + 0.1], [x - 0.1, 5.2, z + 0.78]], rx: () => 0.1, ry: () => 0.1, rings: 16, seg: 5 }), { color: 'vine' });
  for (const [dy, a] of [[2.0, 0.3], [3.4, 2.4], [4.6, 4.0]]) B.add(blade(0.45, 0.2, 0.04), { pos: [x + Math.cos(a) * 0.8, dy, z + Math.sin(a) * 0.8], quat: surfaceQuat([Math.cos(a), 0, Math.sin(a)], [0, 1, 0.3]), color: 'moss' });
}
add({ name: 'RuinPillar', palette: STONE, build(B) { column(B, 8); } });
add({ name: 'RuinPillarBroken', palette: STONE, build(B) { column(B, 5, true); for (const [x, z, r] of [[1.8, 0.8, 0.6], [-1.6, 1.2, 0.45]]) B.add(rock(r, 3, 0.7), { pos: [x, r * 0.4, z], color: 'stone' }); const g = cyl(0.75, 0.8, 1.55, 12); g.rotateZ(Math.PI / 2); B.add(g, { pos: [2.2, 0.78, -1.4], rot: [0, 0.5, 0], color: 'stoneLight' }); } });
add({
  name: 'RuinArch', palette: STONE, heroSize: [720, 620],
  build(B) {
    for (const x of [-4, 4]) for (let i = 0; i < 4; i++) B.add(box(1.8, 1.4, 1.8), { pos: [x, 0.7 + i * 1.45, 0], rot: [0, i * 0.05, 0], color: i % 2 ? 'stone' : 'stoneLight' });
    const N = 9;
    for (let i = 0; i < N; i++) { const a = Math.PI - (i + 0.5) * (Math.PI / N); B.add(box(1.5, 1.2, 1.8), { pos: [Math.cos(a) * 4.0, 5.8 + Math.sin(a) * 3.2, 0], rot: [0, 0, a - Math.PI / 2], color: i % 2 ? 'stoneDark' : 'stone' }); }
    B.add(box(1.4, 1.5, 0.5), { pos: [0, 9.0, -0.75], color: 'stoneLight' });
    B.add(ell(0.35, 0.5, 0.08, 10, 8), { pos: [0, 9.0, -1.02], mesh: 'Rune' });
    B.add(ell(2.2, 0.3, 1.0, 10, 6), { pos: [2.5, 8.2, 0], rot: [0, 0, -0.5], color: 'moss' });
  },
});
add({
  name: 'RuinWall', palette: STONE, heroSize: [720, 520],
  build(B) {
    for (let row = 0; row < 4; row++) for (let i = 0; i < 5 - (row === 3 ? 2 : 0); i++) {
      const x = -4 + i * 2 + (row % 2) * 1, h = 1.1;
      if (row === 3 && i === 2) continue;
      B.add(box(1.9, h, 1.4), { pos: [x, 0.55 + row * 1.12, 0], rot: [0, (i + row) % 3 === 0 ? 0.04 : -0.03, 0], color: ['stone', 'stoneLight', 'stoneDark'][(i + row) % 3] });
    }
    B.add(box(1.9, 1.1, 0.12), { pos: [0, 1.67, -0.75], color: 'stoneDark' });
    for (const [x, y] of [[-0.4, 1.8], [0.4, 1.5], [0, 1.95]]) B.add(box(0.12, 0.5, 0.06), { pos: [x, y, -0.83], rot: [0, 0, x * 1.2], mesh: 'Rune' });
    for (const [x, z] of [[3.8, 1.2], [-2.4, 1.4]]) B.add(rock(0.6, 9, 0.7), { pos: [x, 0.3, z], color: 'stone' });
    B.add(ell(1.6, 0.25, 0.9, 10, 6), { pos: [-2.5, 4.0, 0], color: 'moss' });
  },
});
add({
  name: 'RuinSteps', palette: STONE, heroSize: [640, 520],
  build(B) { for (let i = 0; i < 4; i++) B.add(box(8 - i * 1.6, 0.6, 8 - i * 1.6), { pos: [0, 0.3 + i * 0.6, 0], rot: [0, i * 0.02, 0], color: i % 2 ? 'stoneLight' : 'stone' }); B.add(cyl(1.6, 1.6, 0.06, 20), { pos: [0, 2.43, 0], color: 'stoneDark' }); for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; B.add(box(0.15, 0.04, 0.7), { pos: [Math.cos(a) * 1.1, 2.47, Math.sin(a) * 1.1], rot: [0, -a, 0], mesh: 'Rune' }); } B.add(ell(1.4, 0.2, 1.0, 10, 5), { pos: [2.8, 0.62, 2.5], color: 'moss' }); },
});
add({
  name: 'CreatureStatue', palette: STONE, heroSize: [560, 700],
  build(B) {
    B.add(box(3, 1.2, 3), { pos: [0, 0.6, 0], color: 'stoneDark' }); B.add(box(2.4, 1.6, 2.4), { pos: [0, 2.0, 0], color: 'stone' }); B.add(box(2.8, 0.4, 2.8), { pos: [0, 3.0, 0], color: 'stoneLight' });
    // seated wolf-like guardian
    B.add(ell(0.9, 1.2, 0.9, 14, 10), { pos: [0, 4.4, 0.2], rot: [-0.25, 0, 0], color: 'stoneLight' });
    B.add(ell(0.75, 0.68, 0.72, 14, 10), { pos: [0, 5.9, -0.3], color: 'stoneLight' });
    B.add(ell(0.36, 0.3, 0.5, 10, 8), { pos: [0, 5.75, -0.95], color: 'stone' });
    for (const x of [-1, 1]) { B.add(cone(0.28, 0.8, 8, 0.5), { pos: [0.4 * x, 6.6, -0.2], quat: quatTo([0.3 * x, 1, 0.1]), color: 'stoneLight' }); B.add(cyl(0.25, 0.3, 1.4, 8), { pos: [0.45 * x, 3.85, -0.6], color: 'stone' }); B.add(ell(0.5, 0.65, 0.7, 10, 8), { pos: [0.65 * x, 3.7, 0.5], color: 'stone' }); B.add(ell(0.11, 0.09, 0.05, 8, 6), { pos: [0.27 * x, 6.0, -0.98], mesh: 'Rune' }); }
    B.add(ell(0.9, 0.3, 0.6, 10, 6), { pos: [0.6, 6.4, 0.1], rot: [0, 0, 0.5], color: 'moss' });
    B.add(crystal(0.18, 0.5), { pos: [0, 6.62, -0.6], quat: quatTo([0, 0.6, -1]), mesh: 'Rune' });
  },
});
add({
  name: 'RuneStone', palette: STONE, heroSize: [480, 620],
  build(B) { const g = new THREE.BoxGeometry(1.8, 4, 0.8, 1, 3, 1); const P = g.attributes.position; for (let k = 0; k < P.count; k++) if (P.getY(k) > 1.9) P.setX(k, P.getX(k) * 0.7); g.computeVertexNormals(); B.add(g, { pos: [0, 2, 0], rot: [0.05, 0.1, 0.04], color: 'stone' }); for (const [x, y, a, l] of [[0, 3.2, 0, 0.7], [-0.3, 2.5, 0.6, 0.5], [0.3, 2.5, -0.6, 0.5], [0, 1.8, 0, 0.6], [0, 1.1, 1.57, 0.6]]) B.add(box(0.12, l, 0.06), { pos: [x, y, -0.43], rot: [0.05, 0.1, a], mesh: 'Rune' }); B.add(ell(1.2, 0.2, 0.8, 9, 5), { pos: [0, 0.05, 0], color: 'moss' }); },
});
add({
  name: 'Obelisk', palette: STONE, heroSize: [480, 720],
  build(B) { B.add(box(2.6, 0.8, 2.6), { pos: [0, 0.4, 0], color: 'stoneDark' }); const g = new THREE.CylinderGeometry(0.6, 1.0, 8, 4, 1); B.add(g, { pos: [0, 4.8, 0], rot: [0, Math.PI / 4, 0], color: 'stone' }); B.add(cone(0.85, 1.4, 4), { pos: [0, 9.5, 0], rot: [0, Math.PI / 4, 0], color: 'gold' }); for (let i = 0; i < 4; i++) B.add(box(0.12, 0.7, 0.05), { pos: [0, 2.2 + i * 1.5, -0.86 + i * 0.05], mesh: 'Rune' }); },
});

export default list;
