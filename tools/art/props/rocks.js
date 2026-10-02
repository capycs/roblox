// Rocks, cliffs and crystals for every biome. Faceted low-poly shapes; base at y = 0.
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, crystal, cyl, box, rock, surfaceQuat } from '../lib.js';

const C = {
  stone: '#8b8e8c', stoneDark: '#5f6466', stoneLight: '#a9aca8', moss: '#5f9a3c', mossDark: '#3b6a2a', snow: '#eef5fb',
  basalt: '#2c2a30', basaltLight: '#4a4650', ice: '#cfeefb', iceDeep: '#8cc4e6', coral: '#ff7a6b', coralDeep: '#e0503f',
  shell: '#f6e6d6', redrock: '#b5603f', redrockDark: '#8a4530', sand: '#e6d3a1',
};
const pal = (keys) => keys.map((k) => [k, C[k]]);
const rocks = [];
const add = (spec) => rocks.push({ category: 'Rocks', heroSize: [560, 560], ...spec });
const R = (B, r, pos, seed, sy, color, detail = 1, rotY = 0) => B.add(rock(r, seed, sy, detail), { pos, rot: [0, rotY, 0], color });

add({ name: 'RockSmall', palette: pal(['stone', 'stoneDark', 'stoneLight']), build(B) { R(B, 0.8, [0, 0.3, 0], 1, 0.7, 'stone', 0); R(B, 0.5, [0.9, 0.2, 0.3], 2, 0.7, 'stoneLight', 0); R(B, 0.4, [-0.6, 0.15, 0.6], 3, 0.7, 'stoneDark', 0); } });
add({ name: 'RockMedium', palette: pal(['stone', 'stoneDark', 'stoneLight']), build(B) { R(B, 1.7, [0, 0.8, 0], 4, 0.75, 'stone'); R(B, 0.8, [1.6, 0.35, 0.6], 5, 0.7, 'stoneDark', 0); } });
add({ name: 'RockLarge', palette: pal(['stone', 'stoneDark', 'stoneLight']), build(B) { R(B, 3.2, [0, 1.6, 0], 6, 0.8, 'stone'); R(B, 1.8, [2.8, 0.8, 1.2], 7, 0.75, 'stoneLight'); R(B, 1.3, [-2.6, 0.6, 0.8], 8, 0.7, 'stoneDark'); } });
add({
  name: 'BoulderMossy', palette: pal(['stone', 'stoneDark', 'moss', 'mossDark']),
  build(B) { R(B, 2.2, [0, 1.2, 0], 9, 0.8, 'stone'); B.add(ell(1.9, 0.5, 1.7, 12, 7), { pos: [0.1, 2.35, 0], color: 'moss' }); B.add(ell(1.0, 0.35, 0.8, 10, 6), { pos: [-0.9, 1.9, 0.9], color: 'mossDark' }); for (let i = 0; i < 6; i++) { const a = i * 1.05; B.add(cone(0.1, 0.7, 4), { pos: [Math.cos(a) * 1.2, 2.6, Math.sin(a) * 1.0], quat: quatTo([Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3]), color: 'mossDark' }); } },
});
add({ name: 'RockSnowy', palette: pal(['stone', 'stoneDark', 'snow']), bg: '#141d27', build(B) { R(B, 2.0, [0, 1.1, 0], 10, 0.85, 'stoneDark'); B.add(ell(1.8, 0.55, 1.6, 12, 7), { pos: [0, 2.3, 0], color: 'snow' }); R(B, 0.9, [1.7, 0.4, 0.5], 11, 0.7, 'stone', 0); B.add(ell(0.75, 0.25, 0.7, 9, 5), { pos: [1.7, 0.92, 0.5], color: 'snow' }); } });
add({
  name: 'RockMesa', palette: pal(['redrock', 'redrockDark', 'sand']), bg: '#241a1c',
  build(B) { [[0, 0.7, 0, 2.6, 'redrockDark'], [0.2, 2.0, 0.1, 2.2, 'redrock'], [-0.1, 3.1, 0, 1.7, 'redrockDark'], [0.1, 4.0, 0.1, 1.2, 'redrock']].forEach(([x, y, z, r, c], i) => R(B, r, [x, y, z], 12 + i, 0.32, c, 1, i)); B.add(ell(2.8, 0.2, 2.6, 12, 5), { pos: [0, 0.05, 0], color: 'sand' }); },
});
add({
  name: 'CliffChunk', palette: pal(['stone', 'stoneDark', 'stoneLight', 'moss']), heroSize: [560, 700],
  build(B) { [[0, 1.6, 0, 3.0], [0.4, 4.6, 0.2, 2.6], [-0.3, 7.2, -0.1, 2.2], [0.2, 9.4, 0.1, 1.6], [2.2, 1.2, 1.0, 1.8], [-2.0, 1.4, -0.8, 2.0]].forEach(([x, y, z, r], i) => R(B, r, [x, y, z], 20 + i, 0.75, ['stone', 'stoneDark', 'stoneLight'][i % 3], 1, i)); B.add(ell(1.4, 0.35, 1.2, 10, 6), { pos: [0.2, 10.5, 0.1], color: 'moss' }); },
});
add({
  name: 'RockSpire', palette: pal(['stone', 'stoneDark', 'stoneLight']), heroSize: [560, 700],
  build(B) { const g = new THREE.ConeGeometry(1.8, 9, 7, 4); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const k = 1 + 0.12 * Math.sin(i * 12.9898); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); } g.computeVertexNormals(); B.add(g.toNonIndexed(), { pos: [0, 4.5, 0], color: 'stone' }); R(B, 1.3, [1.4, 0.6, 0.4], 30, 0.7, 'stoneDark'); R(B, 0.9, [-1.2, 0.4, 0.8], 31, 0.7, 'stoneLight', 0); },
});
add({
  name: 'RockArch', palette: pal(['stone', 'stoneDark', 'stoneLight', 'moss']), heroSize: [700, 560],
  build(B) { for (const x of [-3.2, 3.2]) [[0, 1.4, 1.8], [0.1, 3.8, 1.5], [-0.1, 5.8, 1.3]].forEach(([dx, y, r], i) => R(B, r, [x + dx * Math.sign(x), y, 0], 40 + i + (x > 0 ? 5 : 0), 0.8, ['stone', 'stoneDark', 'stoneLight'][i % 3])); R(B, 2.2, [0, 7.4, 0], 50, 0.45, 'stoneLight'); R(B, 1.8, [-2.2, 7.0, 0.2], 51, 0.5, 'stone'); R(B, 1.8, [2.2, 7.0, -0.2], 52, 0.5, 'stoneDark'); B.add(ell(2.0, 0.3, 1.2, 10, 6), { pos: [0, 8.3, 0], color: 'moss' }); },
});
add({
  name: 'BasaltColumns', palette: pal(['basalt', 'basaltLight']), glow: { Glow: '#ff6a1a', GlowCore: '#ffc94a' }, bg: '#241a1c',
  build(B) {
    const cols = [[0, 0, 4.2], [1.15, 0.3, 3.2], [-1.1, 0.4, 3.6], [0.4, 1.2, 2.4], [-0.6, -1.1, 2.8], [0.8, -1.0, 2.0], [-1.6, -0.5, 1.6], [1.8, 1.2, 1.4]];
    cols.forEach(([x, z, h], i) => { B.add(cyl(0.62, 0.66, h, 6), { pos: [x, h / 2, z], rot: [0, 0.3 * i, 0], color: i % 2 ? 'basalt' : 'basaltLight' }); B.add(cyl(0.5, 0.5, 0.06, 6), { pos: [x, h + 0.02, z], rot: [0, 0.3 * i, 0], color: 'basaltLight' }); });
    for (const [x, z, a] of [[0.55, 0.15, 0.2], [-0.5, 0.2, -0.3], [0.1, -0.55, 1.4], [0.9, 0.7, 0.9]]) B.add(box(0.08, 0.5, 1.1), { pos: [x, 0.25, z], rot: [0, a, 0], mesh: 'Glow' });
    B.add(ell(2.6, 0.08, 2.4, 14, 4), { pos: [0, 0.03, 0], mesh: 'Glow' });
    B.add(ell(1.6, 0.1, 1.5, 12, 4), { pos: [0, 0.06, 0], mesh: 'GlowCore' });
  },
});
add({
  name: 'IceChunk', palette: pal(['ice', 'iceDeep', 'snow']), bg: '#141d27',
  build(B) { [[0, 0, 0.9, 3.2, [0, 1, 0.1]], [1.0, 0.3, 0.6, 2.2, [0.5, 1, 0.1]], [-0.9, 0.2, 0.65, 2.4, [-0.5, 1, 0]], [0.2, -0.9, 0.5, 1.6, [0.1, 1, -0.6]], [-0.3, 0.9, 0.45, 1.4, [-0.2, 1, 0.6]]].forEach(([x, z, r, h, d], i) => B.add(crystal(r, h), { pos: [x, -0.1, z], quat: quatTo(d), color: i % 2 ? 'iceDeep' : 'ice' })); B.add(ell(1.8, 0.2, 1.7, 12, 5), { pos: [0, 0.05, 0], color: 'snow' }); },
});
add({
  name: 'Coral', palette: pal(['coral', 'coralDeep', 'shell', 'sand']), bg: '#0e1c25',
  build(B) {
    const br = (x, z, h, a, c) => B.add(loft({ points: [[x, 0, z], [x + Math.cos(a) * 0.3, h * 0.5, z + Math.sin(a) * 0.3], [x + Math.cos(a) * 0.7, h, z + Math.sin(a) * 0.7]], rx: (t) => 0.22 * (1 - 0.4 * t), ry: (t) => 0.22 * (1 - 0.4 * t), rings: 8, seg: 7 }), { color: c });
    [[0, 0, 2.4, 0], [0.5, 0.2, 1.8, 1.2], [-0.5, 0.1, 2.0, 2.5], [0.1, -0.5, 1.6, 4.0], [-0.2, 0.5, 1.4, 5.2]].forEach(([x, z, h, a], i) => br(x, z, h, a, i % 2 ? 'coralDeep' : 'coral'));
    for (const [x, z, a] of [[1.2, 0.6, 0.3], [-1.1, -0.6, 2.0]]) { const g = new THREE.ConeGeometry(0.35, 0.5, 8, 1); g.rotateZ(Math.PI / 2); B.add(g, { pos: [x, 0.2, z], rot: [0, a, 0], color: 'shell' }); }
    B.add(ell(1.8, 0.15, 1.6, 12, 5), { pos: [0, 0.03, 0], color: 'sand' });
  },
});
const ELEMENT_CRYSTALS = [['Fire', '#e8501a', '#ff9a4a', '#241a1c'], ['Storm', '#2fc4f0', '#8af0ff', '#161c2c'], ['Ice', '#7fd2f0', '#c4f2ff', '#141d27'], ['Shadow', '#8a3df0', '#c88aff', '#17121f'], ['Water', '#2a9fe0', '#6fdcff', '#0e1c25'], ['Nature', '#6ad13a', '#c4ff7a', '#141b12']];
for (const [el, c1, c2, bg] of ELEMENT_CRYSTALS) {
  add({
    name: `Crystal${el}`, palette: pal(['stone', 'stoneDark']), glow: { Glow: c1, GlowCore: c2 }, bg,
    build(B) {
      R(B, 1.6, [0, 0.4, 0], 60, 0.45, 'stoneDark'); R(B, 0.8, [1.3, 0.25, 0.6], 61, 0.6, 'stone', 0);
      [[0, 0, 0.62, 3.6, [0, 1, 0], 'GlowCore'], [0.8, 0.3, 0.42, 2.4, [0.6, 1, 0.2], 'Glow'], [-0.8, 0.1, 0.45, 2.6, [-0.6, 1, 0], 'Glow'], [0.1, -0.8, 0.35, 1.8, [0.1, 1, -0.7], 'Glow'], [-0.3, 0.8, 0.32, 1.6, [-0.3, 1, 0.7], 'Glow']]
        .forEach(([x, z, r, h, d, m]) => B.add(crystal(r, h), { pos: [x, 0.5, z], quat: quatTo(d), mesh: m }));
    },
  });
}

export default rocks;
