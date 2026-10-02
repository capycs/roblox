// Trees, bushes, grass and small plants for every biome. Low-poly cartoon shapes with
// chunky canopies so maps can use lots of them. Units: studs, base at y = 0.
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, crystal, cyl, surfaceQuat, flame, into } from '../lib.js';

const P = {
  trunk: '#7a5132', trunkDark: '#553620', bark: '#9a6a42', leaf: '#4f9a3d', leafDark: '#357a2f', leafLight: '#7cc44c',
  blossom: '#ff9ec7', blossomDeep: '#e46aa0', pine: '#2f6b45', pineDark: '#1f4f34', snow: '#eef5fb', snowShade: '#c5d6e6',
  palmTrunk: '#b58a57', palmLeaf: '#5aae46', coconut: '#6b4423', berry: '#d9354a',
};
const P2 = {
  charred: '#2b2226', charredLight: '#463a3e', ice: '#bfe6f7', iceDeep: '#7fb6d9', twist: '#3a2d4a', twistLight: '#5a4870',
  stem: '#e9dcc2', capRed: '#e04a3c', capSpot: '#fff4e0', capBlue: '#3e64c8', reed: '#7e9a4a', reedTop: '#6b4423',
  lily: '#4e9a52', lilyDark: '#3a7a40', petalW: '#fff6e8', petalY: '#ffd84a',
};
const pal = (o, keys) => keys.map((k) => [k, o[k]]);
const seeded = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };

// curved tapered trunk with root flares
function trunk(B, h, r, color, bend = 0.6, roots = 4, rootColor) {
  B.add(loft({ points: [[0, -0.2, 0], [bend * 0.3, h * 0.35, 0], [bend, h * 0.7, bend * 0.3], [bend * 0.8, h, bend * 0.4]], rx: (t) => r * (1 - 0.45 * t), ry: (t) => r * (1 - 0.45 * t), rings: 12, seg: 10 }), { color });
  for (let i = 0; i < roots; i++) {
    const a = (i / roots) * Math.PI * 2 + 0.3;
    B.add(cone(r * 0.55, r * 2.2, 7), { pos: [Math.cos(a) * r * 0.9, r * 0.5, Math.sin(a) * r * 0.9], quat: quatTo([Math.cos(a), -0.55, Math.sin(a)]), color: rootColor || color });
  }
  return [bend * 0.8, h, bend * 0.4];
}
function canopy(B, top, blobs, colors, seg = [12, 9]) {
  blobs.forEach(([x, y, z, r], i) => B.add(ell(r, r * 0.86, r, seg[0], seg[1]), { pos: [top[0] + x, top[1] + y, top[2] + z], color: colors[i % colors.length] }));
}
const OAK = [[0, 1.6, 0, 3.2], [2.3, 0.6, 0.6, 2.3], [-2.2, 0.8, -0.4, 2.4], [0.4, 0.4, 2.3, 2.2], [-0.5, 0.7, -2.3, 2.1], [0.6, 3.6, 0.2, 2.2], [-1.4, 2.9, 1.1, 1.6]];

const nature = [];
const add = (spec) => nature.push({ category: 'Nature', heroSize: [640, 640], ...spec });

add({
  name: 'TreeOak', palette: pal(P, ['trunk', 'trunkDark', 'leaf', 'leafDark', 'leafLight']),
  parts: { Canopy: { pivot: [0.4, 6.5, 0.2] } },
  build(B) { const t = trunk(B, 6.5, 0.75, 'trunk', 0.5, 4, 'trunkDark'); canopy(into(B, 'Canopy'), t, OAK, ['leaf', 'leafDark', 'leafLight', 'leaf', 'leafDark', 'leafLight', 'leaf']); },
});
add({
  name: 'TreeBlossom', palette: pal(P, ['trunk', 'trunkDark', 'blossom', 'blossomDeep', 'snow']), parts: { Canopy: { pivot: [-0.48, 6, -0.24] } },
  build(B) {
    const t = trunk(B, 6, 0.65, 'trunk', -0.6, 4, 'trunkDark');
    canopy(into(B, 'Canopy'), t, OAK.map(([x, y, z, r]) => [x * 0.9, y, z * 0.9, r * 0.9]), ['blossom', 'blossomDeep', 'blossom', 'snow', 'blossomDeep', 'blossom', 'blossomDeep']);
  },
});
function pine(B, h, tiers, snowy) {
  B.add(cyl(0.35, 0.6, h * 0.4, 8), { pos: [0, h * 0.2, 0], color: 'trunkDark' });
  for (let i = 0; i < tiers; i++) {
    const f = i / tiers, r = 3.4 * (1 - f * 0.72), y = h * 0.25 + f * h * 0.62, hh = h * 0.36 * (1 - f * 0.3);
    const g = new THREE.ConeGeometry(r, hh, 9, 2); const Pp = g.attributes.position;
    for (let k = 0; k < Pp.count; k++) if (Pp.getY(k) < -hh * 0.45) { const a = Math.atan2(Pp.getZ(k), Pp.getX(k)); Pp.setY(k, Pp.getY(k) - 0.35 * Math.abs(Math.sin(a * 4.5))); }
    g.computeVertexNormals();
    B.add(g, { pos: [0, y + hh / 2, 0], rot: [0, i * 0.5, 0], color: i % 2 ? 'pineDark' : 'pine' });
    if (snowy) B.add(cone(r * 0.78, hh * 0.62, 9), { pos: [0, y + hh * 0.42 + hh * 0.31, 0], rot: [0, i * 0.5 + 0.2, 0], color: i % 2 ? 'snowShade' : 'snow' });
  }
}
add({ name: 'TreePine', palette: pal(P, ['trunkDark', 'pine', 'pineDark']), parts: { Sway: { pivot: [0, 0, 0] } }, build(B) { pine(into(B, 'Sway'), 13, 4, false); } });
add({ name: 'TreePineSnow', palette: pal(P, ['trunkDark', 'pine', 'pineDark', 'snow', 'snowShade']), parts: { Sway: { pivot: [0, 0, 0] } }, build(B) { pine(into(B, 'Sway'), 13, 4, true); } });
add({
  name: 'TreePalm', palette: pal(P, ['palmTrunk', 'trunk', 'palmLeaf', 'leafDark', 'coconut']), parts: { Fronds: { pivot: [3.2, 8.5, 0.4] } },
  build(B) {
    const F = into(B, 'Fronds');
    const pts = [[0, 0, 0], [0.6, 3, 0], [1.8, 6, 0.2], [3.2, 8.5, 0.4]];
    const curve = new THREE.CatmullRomCurve3(pts.map(V));
    for (let i = 0; i < 9; i++) { const t = i / 9; B.add(cyl(0.48 - t * 0.15, 0.56 - t * 0.15, 1.05, 9), { pos: curve.getPoint(t + 0.05).toArray(), quat: quatTo(curve.getTangent(t + 0.05).toArray()), color: i % 2 ? 'palmTrunk' : 'trunk' }); }
    const top = V(pts[3]);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2, d = V([Math.cos(a), 0.25, Math.sin(a)]).normalize();
      F.add(blade(4.6, 0.9, 0.12), { pos: top.toArray(), quat: surfaceQuat([Math.cos(a) * 0.2, 1, Math.sin(a) * 0.2], d.clone().add(V([0, -0.25, 0])).toArray()), color: k % 2 ? 'palmLeaf' : 'leafDark' });
    }
    for (let k = 0; k < 3; k++) { const a = k * 2.1; F.add(ell(0.42, 0.45, 0.42, 9, 7), { pos: [top.x + Math.cos(a) * 0.45, top.y - 0.45, top.z + Math.sin(a) * 0.45], color: 'coconut' }); }
  },
});
add({
  name: 'TreeEmber', palette: pal(P2, ['charred', 'charredLight']), glow: { Glow: '#ff7a2a', GlowCore: '#ffd36b' }, bg: '#241a1c',
  build(B) {
    const t = trunk(B, 6.5, 0.7, 'charred', 0.4, 4, 'charredLight');
    for (const [dx, dy, dz] of [[2.4, 1.6, 0.4], [-2.2, 2.2, -0.5], [0.3, 2.8, 2.0], [-0.4, 3.4, -1.8]]) {
      B.add(loft({ points: [[t[0], t[1] - 1.5, t[2]], [t[0] + dx * 0.5, t[1] + dy * 0.4, t[2] + dz * 0.5], [t[0] + dx, t[1] + dy, t[2] + dz]], rx: (u) => 0.32 * (1 - 0.7 * u), ry: (u) => 0.32 * (1 - 0.7 * u), rings: 8, seg: 7 }), { color: 'charred' });
      B.add(flame(0.55, 1.6, { rings: 10, seg: 10 }), { pos: [t[0] + dx, t[1] + dy - 0.2, t[2] + dz], mesh: 'Glow' });
      B.add(flame(0.28, 0.9, { rings: 8, seg: 9 }), { pos: [t[0] + dx, t[1] + dy - 0.1, t[2] + dz], mesh: 'GlowCore' });
    }
    for (let k = 0; k < 6; k++) { const a = k * 1.1; B.add(ell(0.12, 0.25, 0.04, 6, 5), { pos: [Math.cos(a) * 0.62, 1 + k * 0.8, Math.sin(a) * 0.62], quat: surfaceQuat([Math.cos(a), 0, Math.sin(a)], [0, 1, 0]), mesh: 'Glow' }); }
  },
});
add({
  name: 'TreeCrystal', palette: pal(P2, ['twist', 'twistLight']), glow: { Glow: '#b46bff', GlowCore: '#f0d2ff' }, bg: '#19141f',
  build(B) {
    B.add(loft({ points: [[0, -0.2, 0], [0.8, 2.5, 0.3], [-0.6, 5, -0.2], [0.4, 7.2, 0.3]], rx: (t) => 0.7 * (1 - 0.5 * t), ry: (t) => 0.7 * (1 - 0.5 * t), rings: 16, seg: 9 }), { color: 'twist' });
    for (let i = 0; i < 4; i++) { const a = i * 1.6; B.add(cone(0.4, 1.6, 6), { pos: [Math.cos(a) * 0.6, 0.4, Math.sin(a) * 0.6], quat: quatTo([Math.cos(a), -0.5, Math.sin(a)]), color: 'twistLight' }); }
    [[0.4, 7.4, 0.3, 0.9, 3.2, [0, 1, 0]], [1.6, 6.6, 0.5, 0.6, 2.2, [0.8, 1, 0.2]], [-1.2, 6.8, -0.4, 0.6, 2.4, [-0.8, 1, -0.2]], [0.2, 6.6, 1.4, 0.5, 1.8, [0.1, 1, 0.8]], [0.5, 6.4, -1.3, 0.5, 1.8, [0.1, 1, -0.8]]]
      .forEach(([x, y, z, r, h, d], i) => B.add(crystal(r, h), { pos: [x, y, z], quat: quatTo(d), mesh: i ? 'Glow' : 'GlowCore' }));
  },
});
add({
  name: 'TreeFrost', palette: pal(P2, ['ice', 'iceDeep', 'petalW']), glow: { Glow: '#8fe8ff' }, bg: '#141d27',
  build(B) {
    B.add(loft({ points: [[0, -0.2, 0], [0.3, 3, 0], [0.1, 6, 0.2]], rx: (t) => 0.65 * (1 - 0.5 * t), ry: (t) => 0.65 * (1 - 0.5 * t), rings: 10, seg: 9 }), { color: 'iceDeep' });
    for (let k = 0; k < 7; k++) {
      const a = k * 0.9, y = 3 + k * 0.45, len = 2.6 - k * 0.2, d = [Math.cos(a), 0.8, Math.sin(a)];
      B.add(loft({ points: [[0.2, y, 0.1], [0.2 + Math.cos(a) * len * 0.5, y + len * 0.4, 0.1 + Math.sin(a) * len * 0.5], [0.2 + Math.cos(a) * len, y + len * 0.65, 0.1 + Math.sin(a) * len]], rx: (t) => 0.22 * (1 - 0.7 * t), ry: (t) => 0.22 * (1 - 0.7 * t), rings: 8, seg: 6 }), { color: 'ice' });
      B.add(crystal(0.28, 1.1), { pos: [0.2 + Math.cos(a) * len, y + len * 0.65, 0.1 + Math.sin(a) * len], quat: quatTo(d), mesh: 'Glow' });
    }
    B.add(ell(1.2, 0.35, 1.2, 10, 6), { pos: [0, 0.1, 0], color: 'petalW' });
  },
});
function bush(B, colors, extra) {
  [[0, 1.0, 0, 1.3], [1.1, 0.8, 0.3, 1.0], [-1.0, 0.85, -0.2, 1.05], [0.2, 0.75, 1.0, 0.9], [-0.2, 0.8, -1.0, 0.9], [0.1, 1.7, 0.1, 0.85]]
    .forEach(([x, y, z, r], i) => B.add(ell(r, r * 0.85, r, 11, 8), { pos: [x, y, z], color: colors[i % colors.length] }));
  if (extra) extra();
}
const SWAY = { Sway: { pivot: [0, 0, 0] } };
add({ name: 'Bush', palette: pal(P, ['leaf', 'leafDark', 'leafLight']), parts: SWAY, build(B) { bush(into(B, 'Sway'), ['leaf', 'leafDark', 'leafLight']); } });
add({
  name: 'BushBerry', palette: pal(P, ['leaf', 'leafDark', 'leafLight', 'berry']), parts: SWAY,
  build(B) { B = into(B, 'Sway'); bush(B, ['leafDark', 'leaf'], () => { const r = seeded(3); for (let i = 0; i < 14; i++) { const a = r() * 6.28, e = r() * 1.2; B.add(ell(0.16, 0.16, 0.16, 7, 5), { pos: [Math.cos(a) * 1.35 * Math.cos(e * 0.6), 0.8 + Math.sin(e) * 1.2, Math.sin(a) * 1.35 * Math.cos(e * 0.6)], color: 'berry' }); } }); },
});
add({
  name: 'BushFlower', palette: pal({ ...P, ...P2 }, ['leaf', 'leafDark', 'blossom', 'petalY', 'petalW']), parts: SWAY,
  build(B) { B = into(B, 'Sway'); bush(B, ['leaf', 'leafDark'], () => { const r = seeded(7); for (let i = 0; i < 12; i++) { const a = r() * 6.28, e = 0.3 + r() * 1.0; const p = [Math.cos(a) * 1.3 * Math.cos(e * 0.7), 0.8 + Math.sin(e) * 1.1, Math.sin(a) * 1.3 * Math.cos(e * 0.7)]; B.add(ell(0.22, 0.08, 0.22, 8, 4), { pos: p, quat: quatTo([p[0], p[1] - 0.6, p[2]]), color: ['blossom', 'petalY', 'petalW'][i % 3] }); } }); },
});
add({
  name: 'GrassTuft', palette: pal(P, ['leaf', 'leafDark', 'leafLight']), heroSize: [480, 480], parts: SWAY,
  build(B) { B = into(B, 'Sway'); const r = seeded(11); for (let i = 0; i < 11; i++) { const a = r() * 6.28, d = r() * 0.45; B.add(cone(0.13, 0.9 + r() * 0.8, 4), { pos: [Math.cos(a) * d, 0.5, Math.sin(a) * d], quat: quatTo([Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4]), color: ['leaf', 'leafDark', 'leafLight'][i % 3] }); } },
});
add({
  name: 'GrassTuftSnow', palette: pal(P, ['pine', 'snow', 'snowShade']), heroSize: [480, 480], parts: SWAY,
  build(B) { const r = seeded(13); for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = r() * 0.45; into(B, 'Sway').add(cone(0.12, 0.8 + r() * 0.6, 4), { pos: [Math.cos(a) * d, 0.45, Math.sin(a) * d], quat: quatTo([Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4]), color: i % 3 ? 'pine' : 'snowShade' }); } B.add(ell(0.8, 0.18, 0.8, 9, 5), { pos: [0, 0.05, 0], color: 'snow' }); },
});
add({
  name: 'FlowerPatch', palette: pal({ ...P, ...P2 }, ['leaf', 'leafDark', 'blossom', 'petalY', 'petalW', 'berry']), heroSize: [480, 480], parts: SWAY,
  build(B) { B = into(B, 'Sway');
    const r = seeded(5);
    for (let i = 0; i < 7; i++) {
      const a = r() * 6.28, d = 0.3 + r() * 0.9, h = 0.6 + r() * 0.7, x = Math.cos(a) * d, z = Math.sin(a) * d;
      B.add(cyl(0.04, 0.05, h, 5), { pos: [x, h / 2, z], color: 'leafDark' });
      const col = ['blossom', 'petalY', 'petalW', 'berry'][i % 4];
      for (let k = 0; k < 5; k++) { const b = (k / 5) * 6.28; B.add(ell(0.14, 0.04, 0.09, 7, 4), { pos: [x + Math.cos(b) * 0.13, h, z + Math.sin(b) * 0.13], rot: [0, -b, 0], color: col }); }
      B.add(ell(0.07, 0.06, 0.07, 6, 4), { pos: [x, h + 0.02, z], color: col === 'petalY' ? 'berry' : 'petalY' });
      B.add(blade(0.4, 0.1, 0.03), { pos: [x, h * 0.3, z], quat: surfaceQuat([0, 1, 0], [Math.cos(a + 1), 0.4, Math.sin(a + 1)]), color: 'leaf' });
    }
  },
});
add({
  name: 'Fern', palette: pal(P, ['leaf', 'leafDark', 'leafLight']), heroSize: [480, 480], parts: SWAY,
  build(B) { B = into(B, 'Sway'); for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28; const d = V([Math.cos(a), 0.9, Math.sin(a)]).normalize(); B.add(blade(1.8, 0.35, 0.05), { pos: [0, 0.1, 0], quat: surfaceQuat([Math.cos(a) * -0.5, 1, Math.sin(a) * -0.5], d.toArray()), color: ['leaf', 'leafDark', 'leafLight'][i % 3] }); } },
});
function shroom(B, x, z, h, r, cap, spot, glowMesh) {
  B.add(cyl(r * 0.28, r * 0.38, h, 8), { pos: [x, h / 2, z], color: 'stem' });
  const g = new THREE.SphereGeometry(r, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 0.7, 1);
  if (glowMesh) B.add(g, { pos: [x, h - 0.05, z], mesh: glowMesh }); else B.add(g, { pos: [x, h - 0.05, z], color: cap });
  if (spot) for (let k = 0; k < 5; k++) { const a = k * 1.3, e = 0.5 + (k % 2) * 0.4; B.add(ell(r * 0.16, r * 0.06, r * 0.16, 6, 4), { pos: [x + Math.cos(a) * r * Math.cos(e), h - 0.05 + Math.sin(e) * r * 0.7, z + Math.sin(a) * r * Math.cos(e)], quat: quatTo([Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)]), color: spot }); }
}
add({ name: 'MushroomCluster', palette: pal(P2, ['stem', 'capRed', 'capSpot']), heroSize: [480, 480], build(B) { shroom(B, 0, 0, 1.3, 0.8, 'capRed', 'capSpot'); shroom(B, 0.9, 0.4, 0.8, 0.5, 'capRed', 'capSpot'); shroom(B, -0.6, 0.7, 0.6, 0.38, 'capRed', 'capSpot'); } });
add({ name: 'GlowShroom', palette: pal(P2, ['stem', 'capBlue']), glow: { Glow: '#6fd8ff' }, bg: '#141a24', heroSize: [480, 480], build(B) { shroom(B, 0, 0, 1.6, 0.85, null, null, 'Glow'); shroom(B, 1.0, 0.3, 1.0, 0.5, null, null, 'Glow'); shroom(B, -0.7, 0.8, 0.7, 0.4, null, null, 'Glow'); } });
add({
  name: 'Reeds', palette: pal(P2, ['reed', 'reedTop']), heroSize: [480, 480], parts: SWAY,
  build(B) { B = into(B, 'Sway'); const r = seeded(17); for (let i = 0; i < 8; i++) { const a = r() * 6.28, d = r() * 0.5, h = 2 + r() * 1.2, x = Math.cos(a) * d, z = Math.sin(a) * d; B.add(cyl(0.04, 0.06, h, 5), { pos: [x, h / 2, z], color: 'reed' }); if (i % 2 === 0) B.add(cyl(0.12, 0.12, 0.6, 7), { pos: [x, h - 0.2, z], color: 'reedTop' }); else B.add(blade(1.4, 0.1, 0.03), { pos: [x, 0.3, z], quat: surfaceQuat([1, 0, 0], [Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3]), color: 'reed' }); } },
});
add({
  name: 'Lilypad', palette: pal(P2, ['lily', 'lilyDark', 'petalW', 'petalY']), heroSize: [480, 480], parts: { Float: { pivot: [0, 0, 0] } },
  build(B) { B = into(B, 'Float');
    const g = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 18, 1, false, 0.4, Math.PI * 2 - 0.8); B.add(g, { pos: [0, 0.05, 0], color: 'lily' });
    const g2 = new THREE.CylinderGeometry(0.7, 0.7, 0.1, 14, 1, false, 2.2, Math.PI * 2 - 0.8); B.add(g2, { pos: [1.4, 0.04, 0.9], color: 'lilyDark' });
    for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.28; B.add(ell(0.3, 0.1, 0.14, 7, 5), { pos: [Math.cos(a) * 0.25, 0.28, Math.sin(a) * 0.25], rot: [0, -a, 0.6], color: 'petalW' }); }
    B.add(ell(0.15, 0.12, 0.15, 7, 5), { pos: [0, 0.3, 0], color: 'petalY' });
  },
});
add({
  name: 'Stump', palette: pal(P, ['trunk', 'trunkDark', 'bark', 'leaf']), heroSize: [480, 480],
  build(B) { B.add(cyl(0.95, 1.15, 1.3, 12), { pos: [0, 0.65, 0], color: 'trunk' }); B.add(cyl(0.88, 0.88, 0.05, 12), { pos: [0, 1.31, 0], color: 'bark' }); for (let i = 0; i < 4; i++) { const a = i * 1.6; B.add(cone(0.45, 1.4, 7), { pos: [Math.cos(a) * 1.0, 0.3, Math.sin(a) * 1.0], quat: quatTo([Math.cos(a), -0.5, Math.sin(a)]), color: 'trunkDark' }); } B.add(ell(0.5, 0.15, 0.4, 8, 5), { pos: [0.4, 1.33, 0.2], color: 'leaf' }); },
});
add({
  name: 'Log', palette: pal(P, ['trunk', 'trunkDark', 'bark', 'leaf']), heroSize: [480, 480],
  build(B) { const g = cyl(0.7, 0.75, 5, 12); g.rotateZ(Math.PI / 2); B.add(g, { pos: [0, 0.72, 0], color: 'trunk' }); for (const x of [-2.52, 2.52]) { const c = cyl(0.62, 0.62, 0.06, 12); c.rotateZ(Math.PI / 2); B.add(c, { pos: [x, 0.72, 0], color: 'bark' }); } B.add(ell(1.2, 0.25, 0.6, 9, 5), { pos: [-0.5, 1.38, 0], color: 'leaf' }); B.add(cone(0.2, 1.0, 6), { pos: [1.2, 1.3, 0.2], quat: quatTo([0.3, 1, 0.3]), color: 'trunkDark' }); },
});

export default nature;
