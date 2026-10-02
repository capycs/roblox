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
// Rocks are planted: anything below the ground is flattened onto it so nothing floats.
const R = (B, r, pos, seed, sy, color, detail = 1, rotY = 0, scale = [1, 1, 1]) => {
  const g = rock(r, seed, sy, detail), P = g.attributes.position, floor = (0.02 - pos[1]) / scale[1];
  for (let i = 0; i < P.count; i++) if (P.getY(i) < floor) P.setY(i, floor);
  g.computeVertexNormals();
  return B.add(g, { pos, rot: [0, rotY, 0], scale, color });
};
const seeded = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
// loose pebbles + grass tufts around a base of radius rad
function scatter(B, rad, n, seed, colors, grass) {
  const q = seeded(seed);
  for (let i = 0; i < n; i++) { const a = q() * 6.28, d = rad * (1 + q() * 0.35), rr = 0.12 + q() * 0.2; R(B, rr, [Math.cos(a) * d, rr * 0.3, Math.sin(a) * d], seed * 7 + i, 0.6, colors[i % colors.length], 0, q() * 6); }
  if (grass) for (let i = 0; i < 4; i++) { const a = q() * 6.28 + i * 1.6, d = rad * 0.95; for (let k = 0; k < 4; k++) { const b = q() * 6.28; B.add(cone(0.07, 0.45 + q() * 0.3, 4), { pos: [Math.cos(a) * d + Math.cos(b) * 0.12, 0.2, Math.sin(a) * d + Math.sin(b) * 0.12], quat: quatTo([Math.cos(b) * 0.4, 1, Math.sin(b) * 0.4]), color: grass[k % grass.length] }); } }
}
// Cap that hugs the top of the matching R() rock (same args): its own surface, slightly inflated,
// with everything below `frac` of its height squashed flat inside the rock. Used for moss + snow.
const capR = (B, r, pos, seed, sy, color, detail = 1, rotY = 0, scale = [1, 1, 1], frac = 0.35) => {
  const g = rock(r, seed, sy, detail), P = g.attributes.position, cut = r * sy * frac;
  for (let i = 0; i < P.count; i++) { const y = P.getY(i), k = y < cut ? 0.8 : 1.03; P.setXYZ(i, P.getX(i) * k, (y < cut ? cut - r * sy * 0.15 : y * 1.03) + r * sy * 0.02, P.getZ(i) * k); }
  g.computeVertexNormals();
  return B.add(g, { pos, rot: [0, rotY, 0], scale, color });
};
// moss blanket that drapes over the top of a rock at height y
const mossCap = (B, x, y, z, rx, rz, c) => B.add(ell(rx, 0.28, rz, 12, 6), { pos: [x, y, z], color: c });

add({ name: 'RockSmall', palette: pal(['stone', 'stoneDark', 'stoneLight', 'moss']), build(B) { R(B, 0.85, [0, 0.35, 0], 1, 0.75, 'stone', 1); R(B, 0.5, [0.95, 0.2, 0.35], 2, 0.7, 'stoneLight', 0, 1); R(B, 0.38, [-0.7, 0.15, 0.55], 3, 0.7, 'stoneDark', 0, 2); scatter(B, 1.1, 4, 4, ['stoneDark', 'stoneLight'], ['moss']); } });
add({ name: 'RockMedium', palette: pal(['stone', 'stoneDark', 'stoneLight', 'moss', 'mossDark']), build(B) { R(B, 1.7, [0, 0.75, 0], 4, 0.8, 'stone', 1, 0, [1.15, 1, 0.9]); capR(B, 1.7, [0, 0.75, 0], 4, 0.8, 'moss', 1, 0, [1.15, 1, 0.9], 0.45); R(B, 0.9, [1.75, 0.35, 0.6], 5, 0.75, 'stoneDark', 1); R(B, 0.6, [-1.6, 0.25, -0.5], 6, 0.7, 'stoneLight', 0); scatter(B, 1.9, 6, 5, ['stoneDark', 'stone'], ['moss', 'mossDark']); } });
add({ name: 'RockLarge', palette: pal(['stone', 'stoneDark', 'stoneLight', 'moss', 'mossDark']), build(B) { R(B, 3.2, [0, 1.5, 0], 6, 0.85, 'stone', 1, 0, [1, 1.1, 0.9]); R(B, 2.0, [2.9, 0.8, 1.2], 7, 0.8, 'stoneLight', 1, 1); R(B, 1.4, [-2.7, 0.6, 0.8], 8, 0.75, 'stoneDark', 1, 2); R(B, 1.0, [1.2, 0.4, -2.4], 9, 0.7, 'stoneDark', 0); capR(B, 3.2, [0, 1.5, 0], 6, 0.85, 'moss', 1, 0, [1, 1.1, 0.9], 0.4); capR(B, 2.0, [2.9, 0.8, 1.2], 7, 0.8, 'mossDark', 1, 1, [1, 1, 1], 0.5); scatter(B, 3.4, 8, 6, ['stoneDark', 'stoneLight'], ['moss', 'mossDark']); } });
add({
  name: 'BoulderMossy', palette: pal(['stone', 'stoneDark', 'moss', 'mossDark']),
  build(B) { R(B, 2.2, [0, 1.2, 0], 9, 0.8, 'stone'); capR(B, 2.2, [0, 1.2, 0], 9, 0.8, 'moss', 1, 0, [1, 1, 1], 0.15); R(B, 0.9, [1.9, 0.4, 0.8], 19, 0.7, 'stoneDark', 0); capR(B, 0.9, [1.9, 0.4, 0.8], 19, 0.7, 'mossDark', 0, 0, [1, 1, 1], 0.3); scatter(B, 2.4, 6, 9, ['stoneDark', 'stone'], ['moss', 'mossDark']); for (let i = 0; i < 6; i++) { const a = i * 1.05; B.add(cone(0.1, 0.7, 4), { pos: [Math.cos(a) * 1.2, 2.6, Math.sin(a) * 1.0], quat: quatTo([Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3]), color: 'mossDark' }); } },
});
add({ name: 'RockSnowy', palette: pal(['stone', 'stoneDark', 'snow']), bg: '#141d27', build(B) { R(B, 2.0, [0, 1.1, 0], 10, 0.85, 'stoneDark'); capR(B, 2.0, [0, 1.1, 0], 10, 0.85, 'snow', 1, 0, [1, 1, 1], 0.2); R(B, 0.9, [1.7, 0.4, 0.5], 11, 0.7, 'stone', 0); capR(B, 0.9, [1.7, 0.4, 0.5], 11, 0.7, 'snow', 0, 0, [1, 1, 1], 0.25); for (const [x, z, rr] of [[0, 0, 2.4], [1.9, 0.6, 1.1], [-1.4, 1.2, 0.9]]) B.add(ell(rr, 0.16, rr * 0.9, 12, 4), { pos: [x, 0.02, z], color: 'snow' }); } });
add({
  name: 'RockMesa', palette: pal(['redrock', 'redrockDark', 'sand']), bg: '#241a1c',
  build(B) { [[0, 0.7, 0, 2.6, 'redrockDark'], [0.2, 2.0, 0.1, 2.2, 'redrock'], [-0.1, 3.1, 0, 1.7, 'redrockDark'], [0.1, 4.0, 0.1, 1.2, 'redrock']].forEach(([x, y, z, r, c], i) => R(B, r, [x, y, z], 12 + i, 0.32, c, 1, i)); B.add(ell(2.8, 0.2, 2.6, 12, 5), { pos: [0, 0.05, 0], color: 'sand' }); },
});
add({
  name: 'CliffChunk', heroSize: [560, 700],
  palette: pal(['stone', 'stoneDark', 'stoneLight', 'moss', 'mossDark']),
  build(B) {
    // three leaning slabs fused into one cliff face, mossy ledges on top
    [[0, 4.6, 0, 2.4, 2.0, 'stone', 0], [1.9, 3.2, 0.6, 1.9, 1.75, 'stoneLight', 0.4], [-1.8, 3.6, -0.4, 2.0, 1.85, 'stoneDark', -0.3], [0.6, 8.6, 0.1, 1.6, 1.3, 'stoneLight', 0.2]]
      .forEach(([x, y, z, r, sy, c, ry], i) => R(B, r, [x, y, z], 20 + i, sy, c, 1, ry, [1, 1, 0.8]));
    R(B, 1.5, [2.7, 0.6, 1.6], 26, 0.7, 'stoneDark'); R(B, 1.1, [-2.6, 0.45, 1.2], 27, 0.7, 'stone', 0);
    capR(B, 1.6, [0.6, 8.6, 0.1], 23, 1.3, 'moss', 1, 0.2, [1, 1, 0.8], 0.55); capR(B, 1.9, [1.9, 3.2, 0.6], 21, 1.75, 'mossDark', 1, 0.4, [1, 1, 0.8], 0.7); capR(B, 2.0, [-1.8, 3.6, -0.4], 22, 1.85, 'moss', 1, -0.3, [1, 1, 0.8], 0.7);
    for (const [x, y, z] of [[1.0, 10.6, 0.5], [-1.4, 7.4, 0.2], [2.4, 6.8, 0.9]]) for (let k = 0; k < 4; k++) B.add(cone(0.08, 0.6, 4), { pos: [x + (k - 1.5) * 0.18, y + 0.15, z], quat: quatTo([(k - 1.5) * 0.3, 1, 0.2]), color: 'mossDark' });
    scatter(B, 2.6, 7, 28, ['stoneDark', 'stone'], ['moss', 'mossDark']);
  },
});
add({
  name: 'RockSpire', palette: pal(['stone', 'stoneDark', 'stoneLight']), heroSize: [560, 700],
  build(B) {
    const g = new THREE.ConeGeometry(2.0, 9, 7, 5); const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const y = P.getY(i), u = (y + 4.5) / 9, k = 1 + 0.16 * Math.sin(i * 12.9898) + 0.12 * Math.sin(u * 9); P.setX(i, P.getX(i) * k + 0.6 * u * u); P.setZ(i, P.getZ(i) * k); }
    g.computeVertexNormals(); B.add(g.toNonIndexed(), { pos: [0, 4.4, 0], color: 'stone' });
    for (const [x, z, a, h, c] of [[1.3, 0.5, 0.5, 4.2, 'stoneDark'], [-1.2, -0.4, 2.6, 3.4, 'stoneLight'], [0.2, -1.3, 4.3, 2.6, 'stoneDark']]) { const sg = new THREE.ConeGeometry(0.75, h, 5, 1); sg.translate(0, h / 2, 0); B.add(sg.toNonIndexed(), { pos: [x, -0.1, z], quat: quatTo([Math.cos(a) * 0.35, 1, Math.sin(a) * 0.35]), color: c }); }
    R(B, 1.4, [1.6, 0.6, 0.6], 30, 0.7, 'stoneDark'); R(B, 1.0, [-1.4, 0.45, 0.9], 31, 0.7, 'stoneLight', 0); R(B, 0.8, [0.4, 0.35, -1.7], 35, 0.7, 'stone', 0);
    scatter(B, 2.2, 6, 36, ['stoneDark', 'stoneLight']);
  },
});
add({
  name: 'RockArch', heroSize: [700, 560],
  palette: pal(['stone', 'stoneDark', 'stoneLight', 'moss', 'mossDark']),
  build(B) {
    for (const x of [-3.2, 3.2]) { R(B, 1.9, [x, 2.6, 0], x > 0 ? 41 : 42, 1.5, x > 0 ? 'stone' : 'stoneDark', 1, x, [1, 1, 0.75]); R(B, 1.5, [x * 1.08, 5.4, 0.1], x > 0 ? 43 : 44, 1.1, 'stoneLight', 1, x, [1, 1, 0.75]); }
    R(B, 2.4, [0, 7.4, 0], 50, 0.42, 'stone', 1, 0.2, [1.9, 1, 0.7]);
    R(B, 1.2, [-1.5, 6.6, 0.1], 51, 0.55, 'stoneDark', 1, 1, [1.2, 1, 0.8]); R(B, 1.2, [1.6, 6.6, -0.1], 52, 0.55, 'stoneDark', 1, 2, [1.2, 1, 0.8]);
    mossCap(B, 0.3, 8.25, 0, 3.0, 1.1, 'moss'); mossCap(B, -3.2, 6.6, 0.1, 1.0, 0.8, 'mossDark');
    for (let i = 0; i < 6; i++) { const x = -2.2 + i * 0.85, l = 0.8 + ((i * 37) % 5) * 0.25; B.add(loft({ points: [[x, 7.2, 0.95], [x + 0.05, 7.2 - l * 0.5, 1.0], [x, 7.2 - l, 0.98]], rx: () => 0.06, ry: () => 0.06, rings: 5, seg: 4 }), { color: 'mossDark' }); B.add(blade(0.3, 0.14, 0.03, 5), { pos: [x, 7.2 - l, 0.98], quat: surfaceQuat([0, 0, 1], [0.2, -1, 0]), color: 'moss' }); }
    scatter(B, 4.4, 8, 46, ['stoneDark', 'stone'], ['moss', 'mossDark']);
  },
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
      for (const [x, z, a] of [[1.7, -0.5, 0.4], [-1.5, 0.9, 2.2], [-0.6, -1.6, 4.1]]) B.add(crystal(0.16, 0.6), { pos: [x, 0, z], quat: quatTo([Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5]), mesh: 'Glow' });
      scatter(B, 1.9, 4, 62, ['stoneDark', 'stone']);
    },
  });
}

export default rocks;
