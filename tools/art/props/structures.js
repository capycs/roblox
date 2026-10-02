// Haven and expedition structures: skyship dock, floating islands, the extraction
// beacon, sky-town houses and a windmill tower. Moving parts are separate meshes.
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, crystal, cyl, box, torus, rock, surfaceQuat } from '../lib.js';

const C = {
  wood: '#a8703f', woodDark: '#744828', woodLight: '#c99258', stone: '#9b9a94', stoneDark: '#6d6c68', stoneLight: '#bdbbb3',
  grass: '#5fae45', grassDark: '#3f8a35', dirt: '#8a5f3f', rope: '#b89466', gold: '#f2b33d', metalDark: '#353b44',
  roofBlue: '#3d6fc4', roofRed: '#d9483b', wallCream: '#e8cfa6', wallShade: '#d9c4a0',
};
const pal = (keys) => keys.map((k) => [k, C[k]]);
const list = [];
const add = (spec) => list.push({ category: 'Structures', heroSize: [760, 620], fit: 0.85, ...spec });

// Floating rock base: inverted cluster of rocks under a flat top.
function islandBase(B, r, depth, seed = 1) {
  B.add(cyl(r * 0.99, r * 0.9, 1.2, 20), { pos: [0, -1.05, 0], color: 'dirt' });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, d = r * (0.45 + 0.25 * ((i * 7) % 3) / 2), rr = r * 0.42;
    B.add(rock(rr, seed + i, 0.8, 1), { pos: [Math.cos(a) * d, -0.8 * rr - 0.5, Math.sin(a) * d], color: i % 2 ? 'stone' : 'stoneDark' });
  }
  for (let i = 0; i < 5; i++) { const f = i / 5; B.add(rock(r * (0.55 - f * 0.1), seed + 20 + i, 1.1, 1), { pos: [Math.sin(i * 2.1) * r * 0.2, -r * 0.62 - 1.2 - f * depth, Math.cos(i * 2.1) * r * 0.2], color: i % 2 ? 'stoneDark' : 'stone' }); }
  B.add(cone(r * 0.35, depth * 0.6, 7), { pos: [0, -depth * 0.85 - 1.5, 0], rot: [Math.PI, 0, 0], color: 'stoneDark' });
}

add({
  name: 'SkyDock', palette: pal(['wood', 'woodDark', 'woodLight', 'stone', 'stoneDark', 'grass', 'dirt', 'rope', 'gold', 'metalDark']), glow: { Glow: '#7ff3ff', Lamp: '#ffd36b' }, heroSize: [900, 700],
  build(B) {
    B.add(cyl(11, 11, 0.8, 24), { pos: [0, -0.4, 0], color: 'grass' });
    islandBase(B, 11, 9, 3);
    // pier sticking out over the edge toward -X, where the ship docks
    for (let i = 0; i < 12; i++) B.add(box(1.0, 0.3, 7), { pos: [-6 - i * 1.05, 0.15, 0], rot: [0, 0, (i % 2 ? 0.01 : -0.01)], color: ['wood', 'woodLight', 'woodDark'][i % 3] });
    for (const z of [-3.6, 3.6]) {
      for (let i = 0; i < 5; i++) { const x = -6 - i * 2.9; B.add(cyl(0.22, 0.28, 2.4, 8), { pos: [x, 1.0, z], color: 'woodDark' }); B.add(ell(0.3, 0.3, 0.3, 8, 6), { pos: [x, 2.3, z], color: 'gold' }); }
      B.add(loft({ points: [[-6, 2.1, z], [-12, 1.6, z], [-17.6, 2.1, z]], rx: () => 0.08, ry: () => 0.08, rings: 14, seg: 5 }), { color: 'rope' });
    }
    for (let i = 0; i < 6; i++) B.add(cyl(0.45, 0.5, 9, 10), { pos: [-7 - i * 2, -4.5, (i % 2 ? 2.6 : -2.6)], rot: [i % 2 ? 0.15 : -0.15, 0, 0], color: 'woodDark' });
    // gateway arch with a banner
    for (const z of [-3.2, 3.2]) B.add(box(0.8, 7, 0.8), { pos: [-5.5, 3.5, z], color: 'woodDark' });
    B.add(box(1.2, 1.0, 8.6), { pos: [-5.5, 7.2, 0], color: 'wood' });
    B.add(box(0.2, 2.2, 5.2), { pos: [-5.5, 5.6, 0], color: 'roofBlue' in C ? 'gold' : 'gold' });
    B.add(crystal(0.5, 1.6), { pos: [-5.5, 7.7, 0], mesh: 'Glow' });
    // lamps, bollards, crates
    for (const [x, z] of [[-17.5, 3.6], [-17.5, -3.6], [-5.5, 4.8], [-5.5, -4.8], [4, 6], [4, -6]]) {
      B.add(cyl(0.12, 0.16, 3.6, 6), { pos: [x, 1.8, z], color: 'metalDark' });
      B.add(ell(0.35, 0.48, 0.35, 10, 8), { pos: [x, 3.85, z], mesh: 'Lamp' });
      B.add(cone(0.48, 0.45, 8), { pos: [x, 4.5, z], color: 'metalDark' });
    }
    for (const [x, z] of [[2, 3], [3.4, 2.4], [2.6, -3.5]]) B.add(box(1.4, 1.4, 1.4), { pos: [x, 0.7, z], rot: [0, x, 0], color: 'woodLight' });
    // departures board
    B.add(box(0.3, 3, 4), { pos: [0, 2.2, -7], rot: [0, 0.6, 0], color: 'woodDark' });
    B.add(box(0.1, 2.2, 3.2), { pos: [-0.18, 2.4, -6.9], rot: [0, 0.6, 0], mesh: 'Glow' });
    B.add(crystal(1.4, 4), { pos: [0, -10.5, 0], rot: [Math.PI, 0, 0], mesh: 'Glow' });
  },
});
add({
  name: 'FloatingIsland', palette: pal(['stone', 'stoneDark', 'grass', 'grassDark', 'dirt', 'wood', 'woodDark']), glow: { Glow: '#7ff3ff' }, heroSize: [900, 760],
  build(B) {
    B.add(cyl(14, 14, 1.0, 28), { pos: [0, -0.5, 0], color: 'grass' });
    for (let i = 0; i < 10; i++) { const a = i * 0.63; B.add(ell(2.2, 0.6, 2.2, 10, 6), { pos: [Math.cos(a) * 11, 0.1, Math.sin(a) * 11], color: i % 2 ? 'grassDark' : 'grass' }); }
    islandBase(B, 14, 13, 11);
    for (const [x, z, s] of [[-6, 4, 1], [5, -6, 1.2], [7, 5, 0.8]]) { B.add(cyl(0.5 * s, 0.7 * s, 4 * s, 8), { pos: [x, 2 * s, z], color: 'woodDark' }); for (const [dx, dy, dz, r] of [[0, 5, 0, 2.2], [1.4, 4.3, 0.4, 1.5], [-1.3, 4.5, -0.3, 1.6]]) B.add(ell(r * s, r * s * 0.85, r * s, 10, 8), { pos: [x + dx * s, dy * s, z + dz * s], color: r > 2 ? 'grass' : 'grassDark' }); }
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.3; B.add(loft({ points: [[Math.cos(a) * 9, -2, Math.sin(a) * 9], [Math.cos(a) * 9.4, -5, Math.sin(a) * 9.4], [Math.cos(a) * 8.8, -8, Math.sin(a) * 8.8]], rx: (t) => 0.3 * (1 - 0.7 * t), ry: (t) => 0.3 * (1 - 0.7 * t), rings: 8, seg: 5 }), { color: 'woodDark' }); }
    for (let k = 0; k < 3; k++) { const a = k * 2.1; B.add(crystal(1.0, 3.0), { pos: [Math.cos(a) * 3, -13, Math.sin(a) * 3], quat: quatTo([Math.cos(a) * 0.5, -1, Math.sin(a) * 0.5]), mesh: 'Glow' }); }
  },
});
add({
  name: 'ExtractionBeacon', palette: pal(['stone', 'stoneDark', 'stoneLight', 'gold', 'metalDark']), glow: { Glow: '#5ff0ff', GlowCore: '#e6ffff' }, heroSize: [760, 760], bg: '#14202a',
  parts: { Ring: { pivot: [0, 6.5, 0] } },
  build(B) {
    B.add(cyl(7, 7.4, 0.8, 32), { pos: [0, 0.4, 0], color: 'stoneDark' });
    B.add(cyl(6, 6, 0.3, 32), { pos: [0, 0.9, 0], color: 'stone' });
    B.add(torus(4.2, 0.14, 4, 48), { pos: [0, 1.06, 0], rot: [Math.PI / 2, 0, 0], mesh: 'Glow' });
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; B.add(box(0.2, 0.05, 0.9), { pos: [Math.cos(a) * 5.2, 1.07, Math.sin(a) * 5.2], rot: [0, -a, 0], mesh: 'Glow' }); }
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4, x = Math.cos(a) * 6.2, z = Math.sin(a) * 6.2;
      B.add(box(1.4, 1, 1.4), { pos: [x, 1.3, z], rot: [0, -a, 0], color: 'stoneLight' });
      B.add(cyl(0.5, 0.65, 6, 6), { pos: [x, 4.8, z], color: 'stone' });
      B.add(cyl(0.8, 0.6, 0.5, 6), { pos: [x, 8.0, z], color: 'gold' });
      B.add(crystal(0.45, 1.6), { pos: [x, 8.2, z], mesh: 'Glow' });
    }
    B.add(crystal(1.0, 3.2), { pos: [0, 5.0, 0], mesh: 'GlowCore' });
    B.add(crystal(1.0, 1.6), { pos: [0, 5.05, 0], rot: [Math.PI, 0, 0], mesh: 'GlowCore' });
    B.add(torus(2.6, 0.2, 6, 40), { pos: [0, 6.5, 0], rot: [Math.PI / 2 - 0.3, 0, 0], color: 'gold', mesh: 'Ring' });
    B.add(torus(2.6, 0.08, 4, 40), { pos: [0, 6.5, 0], rot: [Math.PI / 2 - 0.3, 0, 0], color: 'gold', mesh: 'Ring' });
  },
});
function house(B, roof, w = 6, d = 6, h = 5) {
  B.add(box(w + 1, 0.8, d + 1), { pos: [0, 0.4, 0], color: 'stoneDark' });
  const walls = new THREE.BoxGeometry(w, h, d, 2, 2, 2); B.add(walls, { pos: [0, 0.8 + h / 2, 0], color: 'wallCream' });
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) B.add(box(0.5, h, 0.5), { pos: [x * w / 2, 0.8 + h / 2, z * d / 2], color: 'woodDark' });
  B.add(box(w + 0.3, 0.4, d + 0.3), { pos: [0, 0.8 + h, 0], color: 'woodDark' });
  const r = new THREE.ConeGeometry(Math.max(w, d) * 0.85, h * 1.2, 4, 1); B.add(r, { pos: [0, 0.8 + h + h * 0.6, 0], rot: [0, Math.PI / 4, 0], color: roof });
  B.add(box(1, 2.5, 1), { pos: [w * 0.25, 0.8 + h * 1.9, d * 0.15], color: 'stone' });
  // round door + windows
  const door = new THREE.CylinderGeometry(0.9, 0.9, 0.2, 14, 1, false, 0, Math.PI); door.rotateX(Math.PI / 2); door.rotateZ(Math.PI / 2 * 0);
  B.add(box(1.8, 1.8, 0.2), { pos: [0, 1.7, -d / 2 - 0.05], color: 'wood' });
  B.add(door, { pos: [0, 2.6, -d / 2 - 0.05], rot: [0, 0, Math.PI / 2 * 0], color: 'wood' });
  B.add(ell(0.1, 0.1, 0.1, 6, 4), { pos: [0.55, 1.8, -d / 2 - 0.2], color: 'gold' });
  for (const x of [-w * 0.3, w * 0.3]) { B.add(box(1.2, 1.2, 0.15), { pos: [x, 3.8, -d / 2 - 0.05], mesh: 'Lamp' }); B.add(box(1.5, 0.2, 0.3), { pos: [x, 3.1, -d / 2 - 0.12], color: 'woodDark' }); for (let k = 0; k < 3; k++) B.add(ell(0.2, 0.2, 0.2, 6, 5), { pos: [x - 0.45 + k * 0.45, 3.3, -d / 2 - 0.2], color: k % 2 ? 'roofRed' : 'grass' }); }
  for (const z of [-d * 0.2, d * 0.2]) B.add(box(0.15, 1.2, 1.2), { pos: [w / 2 + 0.05, 3.8, z], mesh: 'Lamp' });
}
add({ name: 'HavenHouseBlue', palette: pal(['wallCream', 'wallShade', 'woodDark', 'wood', 'stone', 'stoneDark', 'roofBlue', 'roofRed', 'grass', 'gold']), glow: { Lamp: '#ffd36b' }, build(B) { house(B, 'roofBlue'); } });
add({ name: 'HavenHouseRed', palette: pal(['wallCream', 'wallShade', 'woodDark', 'wood', 'stone', 'stoneDark', 'roofBlue', 'roofRed', 'grass', 'gold']), glow: { Lamp: '#ffd36b' }, build(B) { house(B, 'roofRed', 7, 5, 6); } });
add({
  name: 'HavenWindmill', palette: pal(['stone', 'stoneDark', 'stoneLight', 'wood', 'woodDark', 'roofRed', 'wallCream', 'gold']), glow: { Lamp: '#ffd36b' }, heroSize: [620, 820],
  parts: { Blades: { pivot: [0, 13, -3.2] } },
  build(B) {
    B.add(cyl(2.6, 3.6, 12, 12), { pos: [0, 6, 0], color: 'stoneLight' });
    for (let i = 0; i < 4; i++) B.add(cyl(3.62 - i * 0.25, 3.62 - i * 0.25, 0.25, 12), { pos: [0, 1 + i * 3, 0], color: 'stoneDark' });
    B.add(cone(3.4, 4, 12), { pos: [0, 14, 0], color: 'roofRed' });
    B.add(box(1.6, 2.6, 0.3), { pos: [0, 1.3, -3.4], color: 'wood' });
    for (const y of [5, 9]) B.add(box(1, 1.3, 0.2), { pos: [0, y, -2.95 + (y - 5) * 0.08], mesh: 'Lamp' });
    const hub = cyl(0.6, 0.6, 1.2, 10); hub.rotateX(Math.PI / 2); B.add(hub, { pos: [0, 13, -3.2], color: 'woodDark', mesh: 'Blades' });
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4, d = V([Math.cos(a), Math.sin(a), 0]);
      B.add(box(0.3, 7, 0.2), { pos: V([0, 13, -3.6]).addScaledVector(d, 3.6).toArray(), rot: [0, 0, a - Math.PI / 2], color: 'woodDark', mesh: 'Blades' });
      B.add(box(1.8, 5.5, 0.1), { pos: V([0, 13, -3.65]).addScaledVector(d, 4.1).add(V([-Math.sin(a) * 1.0, Math.cos(a) * 1.0, 0])).toArray(), rot: [0, 0, a - Math.PI / 2], color: 'wallCream', mesh: 'Blades' });
    }
  },
  animate(meshes, group, u) { meshes.Blades.rotation.z = u * Math.PI / 2; }, frames: 16, loopSeconds: 2,
});

export default list;
