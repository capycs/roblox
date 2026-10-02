// Trees, bushes, grass and small plants for every biome. Low-poly cartoon shapes with
// chunky canopies so maps can use lots of them. Units: studs, base at y = 0.
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, leaflet, crystal, cyl, surfaceQuat, flame, into } from '../lib.js';
import { canopy as leafy, conifer } from '../foliage.js';

const P = {
  trunk: '#7a5132', trunkDark: '#553620', bark: '#9a6a42', leaf: '#4f9a3d', leafDark: '#357a2f', leafLight: '#7cc44c',
  blossom: '#ff9ec7', blossomDeep: '#e46aa0', pine: '#2f6b45', pineDark: '#1f4f34', snow: '#eef5fb', snowShade: '#c5d6e6',
  leafDeep: '#28552b', leafTip: '#98cf58', blossomDark: '#c24f86', blossomPale: '#ffd1e4', blossomTip: '#fff0f6',
  pineDeep: '#173b2a', pineMid: '#2b6343', pineLight: '#3f8455', pineTip: '#5ea56b',
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
// arched rib with paired leaflets (ferns, palm fronds)
function frond(B, base, a, len, { lift = 0.9, droop = 0.6, pairs = 9, leaf = 0.5, wid = 0.14, rib = 0.05, colors, ribColor }) {
  const dir = V([Math.cos(a), 0, Math.sin(a)]), side = V([-Math.sin(a), 0, Math.cos(a)]);
  const pts = [0, 0.33, 0.66, 1].map((t) => V(base).addScaledVector(dir, len * t).add(V([0, len * (lift * (1 - (1 - t) ** 2) - droop * t * t), 0])));
  const c = new THREE.CatmullRomCurve3(pts);
  B.add(loft({ points: pts.map((p) => p.toArray()), rx: (t) => rib * (1 - 0.7 * t), ry: (t) => rib * (1 - 0.7 * t), rings: 6, seg: 4 }), { color: ribColor || colors[0] });
  for (let i = 1; i <= pairs; i++) {
    const t = i / (pairs + 1), p = c.getPoint(t), tan = c.getTangent(t), n = new THREE.Vector3().crossVectors(side, tan).normalize();
    const l = leaf * (1 - 0.55 * t) * (0.7 + 0.3 * Math.sin(Math.PI * Math.min(1, t * 1.6)));
    for (const sd of [-1, 1]) {
      const d = side.clone().multiplyScalar(sd).addScaledVector(tan, 0.55).addScaledVector(n, -0.08).normalize();
      B.add(leaflet(l, wid * (1 - 0.4 * t), 0.03), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), d.toArray()), color: colors[(i + (sd > 0 ? 1 : 0)) % colors.length] });
    }
  }
  B.add(blade(leaf * 0.5, wid * 0.7, 0.03, 5), { pos: c.getPoint(0.97).toArray(), quat: surfaceQuat([0, 1, 0], c.getTangent(1).toArray()), color: colors[0] });
}
const OAK = [[0, 1.6, 0, 3.2], [2.3, 0.6, 0.6, 2.3], [-2.2, 0.8, -0.4, 2.4], [0.4, 0.4, 2.3, 2.2], [-0.5, 0.7, -2.3, 2.1], [0.6, 3.6, 0.2, 2.2], [-1.4, 2.9, 1.1, 1.6]];

const nature = [];
const add = (spec) => nature.push({ category: 'Nature', heroSize: [640, 640], ...spec });

// Zelda-style broadleaf: chunky curved trunk, branches reaching into 4-5 puffy clumps, each
// clump covered in leaf cards with spherized normals (see foliage.js).
function branchyTrunk(B, h, r, bend, clumps, color, rootColor) {
  const top = trunk(B, h, r, color, bend, 5, rootColor);
  for (const [x, y, z] of clumps.slice(1)) {
    const s = [top[0] * 0.7, h * 0.72, top[2] * 0.7];
    B.add(loft({ points: [s, [s[0] + (x - s[0]) * 0.45, s[1] + (y - s[1]) * 0.3, s[2] + (z - s[2]) * 0.45], [x * 0.8, y - 0.6, z * 0.8]], rx: (t) => r * 0.42 * (1 - 0.55 * t), ry: (t) => r * 0.42 * (1 - 0.55 * t), rings: 8, seg: 7 }), { color });
  }
  return top;
}
const OAK_CLUMPS = [[0.3, 10.2, 0.2, 3.0], [3.5, 8.3, 0.8, 2.3], [-3.3, 8.6, -0.5, 2.4], [0.3, 8.1, 3.4, 2.1], [-0.4, 8.4, -3.3, 2.1], [-1.2, 12.3, 1.0, 1.7], [1.6, 11.9, -1.2, 1.5]];
add({
  name: 'TreeOak', palette: pal(P, ['trunk', 'trunkDark', 'leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip']),
  parts: { Canopy: { pivot: [0.4, 6.5, 0.2] } },
  build(B) {
    branchyTrunk(B, 7, 0.8, 0.5, OAK_CLUMPS, 'trunk', 'trunkDark');
    leafy(into(B, 'Canopy'), { blobs: OAK_CLUMPS, shades: ['leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip'], count: 680, size: [1.15, 0.6], seed: 11 });
  },
});
const BLOSSOM_CLUMPS = OAK_CLUMPS.map(([x, y, z, r]) => [-x * 0.9, y - 0.4, z * 0.9, r * 0.92]);
add({
  name: 'TreeBlossom', palette: pal(P, ['trunk', 'trunkDark', 'blossomDark', 'blossomDeep', 'blossom', 'blossomPale', 'blossomTip']), parts: { Canopy: { pivot: [-0.48, 6, -0.24] } },
  build(B) {
    branchyTrunk(B, 6.6, 0.7, -0.6, BLOSSOM_CLUMPS, 'trunk', 'trunkDark');
    leafy(into(B, 'Canopy'), { blobs: BLOSSOM_CLUMPS, shades: ['blossomDark', 'blossomDeep', 'blossom', 'blossomPale', 'blossomTip'], count: 620, size: [0.85, 0.55], seed: 21, droop: 0.4 });
    // fallen petals around the roots
    const r = seeded(9);
    for (let k = 0; k < 18; k++) { const a = r() * 6.28, d = 1.4 + r() * 3.2; B.add(ell(0.16, 0.02, 0.11, 6, 3), { pos: [Math.cos(a) * d, 0.03, Math.sin(a) * d], rot: [0, a, 0], color: k % 3 ? 'blossom' : 'blossomPale' }); }
  },
});
add({ name: 'TreePine', palette: pal(P, ['trunkDark', 'pineDeep', 'pineDark', 'pine', 'pineMid', 'pineLight', 'pineTip']), parts: { Sway: { pivot: [0, 0, 0] } },
  build(B) { conifer(into(B, 'Sway'), { height: 13, tiers: 5, radius: 3.6, shades: ['pineDeep', 'pineDark', 'pine', 'pineMid', 'pineLight', 'pineTip'], trunkColor: 'trunkDark', seed: 5 }); } });
add({ name: 'TreePineSnow', palette: pal(P, ['trunkDark', 'pineDeep', 'pineDark', 'pine', 'pineMid', 'pineLight', 'snow', 'snowShade']), parts: { Sway: { pivot: [0, 0, 0] } },
  build(B) { conifer(into(B, 'Sway'), { height: 13, tiers: 5, radius: 3.6, shades: ['pineDeep', 'pineDark', 'pine', 'pineMid', 'pineLight'], snow: ['snow', 'snowShade'], trunkColor: 'trunkDark', seed: 7 }); } });
add({
  name: 'TreePalm', palette: pal(P, ['palmTrunk', 'trunk', 'palmLeaf', 'leafDark', 'coconut']), parts: { Fronds: { pivot: [3.2, 8.5, 0.4] } },
  build(B) {
    const F = into(B, 'Fronds');
    const pts = [[0, 0, 0], [0.6, 3, 0], [1.8, 6, 0.2], [3.2, 8.5, 0.4]];
    const curve = new THREE.CatmullRomCurve3(pts.map(V));
    for (let i = 0; i < 9; i++) { const t = i / 9; B.add(cyl(0.48 - t * 0.15, 0.56 - t * 0.15, 1.05, 9), { pos: curve.getPoint(t + 0.05).toArray(), quat: quatTo(curve.getTangent(t + 0.05).toArray()), color: i % 2 ? 'palmTrunk' : 'trunk' }); }
    const top = V(pts[3]);
    F.add(ell(0.62, 0.5, 0.62, 10, 7), { pos: top.toArray(), color: 'trunk' });
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2 + 0.2, inner = k % 3 === 0;
      frond(F, top.clone().add(V([0, 0.25, 0])).toArray(), a, inner ? 3.8 : 5.2, { lift: inner ? 0.45 : 0.28, droop: inner ? 0.3 : 0.42, pairs: 12, leaf: 2.1, wid: 0.45, rib: 0.09, colors: k % 2 ? ['palmLeaf', 'leafDark'] : ['leafDark', 'palmLeaf'], ribColor: 'palmTrunk' });
    }
    for (let k = 0; k < 4; k++) { const a = k * 1.6 + 0.4; F.add(ell(0.38, 0.42, 0.38, 9, 7), { pos: [top.x + Math.cos(a) * 0.5, top.y - 0.42 - (k % 2) * 0.15, top.z + Math.sin(a) * 0.5], color: 'coconut' }); }
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
// Bushes use the same leafy clumps as the trees, low and wide.
const BUSH = [[0, 1.05, 0, 1.25], [1.15, 0.85, 0.35, 0.95], [-1.05, 0.9, -0.25, 1.0], [0.25, 0.8, 1.05, 0.85], [-0.2, 0.85, -1.05, 0.85], [0.1, 1.75, 0.1, 0.8]];
const BUSH_SHADES = ['leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip'];
function bush(B, seed, extra) {
  leafy(B, { blobs: BUSH, shades: BUSH_SHADES, count: 260, size: [0.62, 0.36], seed, centre: [0, 0.4, 0], extra });
}
const SWAY = { Sway: { pivot: [0, 0, 0] } };
const BUSH_PAL = ['leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip'];
add({ name: 'Bush', palette: pal(P, BUSH_PAL), parts: SWAY, build(B) { bush(into(B, 'Sway'), 31); } });
add({
  name: 'BushBerry', palette: pal(P, [...BUSH_PAL, 'berry', 'snow']), parts: SWAY,
  build(B) {
    B = into(B, 'Sway');
    bush(B, 37, ({ surface }) => { for (let i = 0; i < 22; i++) { const { p } = surface(); B.add(ell(0.17, 0.17, 0.17, 7, 5), { pos: p.toArray(), color: 'berry' }); B.add(ell(0.04, 0.04, 0.04, 4, 3), { pos: p.clone().add(V([-0.05, 0.08, -0.08])).toArray(), color: 'snow' }); } });
  },
});
add({
  name: 'BushFlower', palette: pal({ ...P, ...P2 }, [...BUSH_PAL, 'blossom', 'petalY', 'petalW']), parts: SWAY,
  build(B) {
    B = into(B, 'Sway');
    bush(B, 41, ({ surface }) => {
      for (let i = 0; i < 16; i++) {
        const { p, n } = surface(), col = ['blossom', 'petalW', 'blossom'][i % 3];
        const side = V([0, 1, 0]).cross(n).normalize(), fwd = n.clone().cross(side).normalize();
        for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2, d = side.clone().multiplyScalar(Math.cos(a)).addScaledVector(fwd, Math.sin(a)); B.add(ell(0.2, 0.04, 0.13, 6, 3), { pos: p.clone().addScaledVector(d, 0.18).toArray(), quat: surfaceQuat(n.toArray(), d.toArray()), color: col }); }
        B.add(ell(0.09, 0.06, 0.09, 6, 4), { pos: p.clone().addScaledVector(n, 0.04).toArray(), color: 'petalY' });
      }
    });
  },
});
add({
  name: 'GrassTuft', palette: pal(P, ['leaf', 'leafDark', 'leafLight']), heroSize: [480, 480], parts: SWAY,
  build(B) { B = into(B, 'Sway'); const r = seeded(11); for (let i = 0; i < 11; i++) { const a = r() * 6.28, d = r() * 0.45; B.add(cone(0.13, 0.9 + r() * 0.8, 4), { pos: [Math.cos(a) * d, 0.5, Math.sin(a) * d], quat: quatTo([Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4]), color: ['leaf', 'leafDark', 'leafLight'][i % 3] }); } },
});
add({
  name: 'GrassTuftSnow', palette: pal(P, ['pine', 'snow', 'snowShade']), heroSize: [480, 480], parts: SWAY,
  build(B) { const r = seeded(13); for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = r() * 0.45; into(B, 'Sway').add(cone(0.12, 0.8 + r() * 0.6, 4), { pos: [Math.cos(a) * d, 0.45, Math.sin(a) * d], quat: quatTo([Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4]), color: i % 3 ? 'pine' : 'snowShade' }); } for (const [x, z, rr, c] of [[0, 0, 0.75, 'snow'], [0.45, 0.25, 0.45, 'snowShade'], [-0.4, 0.3, 0.42, 'snow'], [0.1, -0.45, 0.4, 'snow'], [-0.3, -0.25, 0.35, 'snowShade']]) B.add(ell(rr, rr * 0.38, rr, 10, 6), { pos: [x, 0.04, z], color: c }); },
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
  build(B) {
    B = into(B, 'Sway');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.28 + (i % 2) * 0.25, tall = i % 2 === 0;
      frond(B, [0, 0.05, 0], a, tall ? 1.9 : 1.5, { lift: tall ? 0.7 : 0.5, droop: tall ? 0.28 : 0.3, pairs: 10, leaf: 0.6, wid: 0.15, rib: 0.035, colors: [['leaf', 'leafLight'], ['leafDark', 'leaf'], ['leafLight', 'leaf']][i % 3], ribColor: 'leafDark' });
    }
    for (let k = 0; k < 3; k++) { const a = k * 2.1; B.add(loft({ points: [[0, 0, 0], [Math.cos(a) * 0.08, 0.35, Math.sin(a) * 0.08], [Math.cos(a) * 0.2, 0.55, Math.sin(a) * 0.2], [Math.cos(a) * 0.12, 0.5, Math.sin(a) * 0.12]], rx: () => 0.04, ry: () => 0.04, rings: 8, seg: 5 }), { color: 'leafLight' }); }
  },
});
function shroom(B, x, z, h, r, cap, spot, glowMesh, lean = 0) {
  const top = [x + lean * h * 0.35, h, z + lean * h * 0.15];
  B.add(loft({ points: [[x, 0, z], [x + lean * h * 0.08, h * 0.45, z], [top[0], h - 0.05, top[2]]], rx: (t) => r * (0.36 - 0.1 * t) * (1 + 0.5 * (1 - t) ** 4), ry: (t) => r * (0.36 - 0.1 * t) * (1 + 0.5 * (1 - t) ** 4), rings: 8, seg: 9 }), { color: 'stem' });
  const g = new THREE.SphereGeometry(r, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 0.7, 1);
  const P = g.attributes.position; for (let k = 0; k < P.count; k++) { const yy = P.getY(k); if (yy < r * 0.12) { const f = 1.06; P.setX(k, P.getX(k) * f); P.setZ(k, P.getZ(k) * f); P.setY(k, yy - r * 0.08); } } g.computeVertexNormals();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(lean * 0.15, 0, -lean * 0.35));
  B.add(g, { pos: [top[0], h - 0.05, top[2]], quat: q, color: cap });
  const gill = new THREE.CylinderGeometry(r * 0.98, r * 0.3, r * 0.14, 14, 1, true);
  B.add(gill, { pos: [top[0], h - 0.12, top[2]], quat: q, ...(glowMesh ? { mesh: glowMesh } : { color: 'stem' }) });
  if (spot) for (let k = 0; k < 6; k++) {
    const a = k * 1.15 + x, e = 0.45 + (k % 3) * 0.3, n = V([Math.cos(a) * Math.cos(e), Math.sin(e) * 0.7, Math.sin(a) * Math.cos(e)]).applyQuaternion(q);
    B.add(ell(r * 0.15, r * 0.06, r * 0.15, 6, 4), { pos: V(top).add(V([0, -0.05, 0])).addScaledVector(n, r * 1.0).toArray(), quat: quatTo(n.toArray()), ...(glowMesh ? { mesh: 'GlowCore' } : { color: spot }) });
  }
}
add({ name: 'MushroomCluster', palette: pal({ ...P, ...P2 }, ['stem', 'capRed', 'capSpot', 'leaf']), heroSize: [480, 480], build(B) { shroom(B, 0, 0, 1.3, 0.8, 'capRed', 'capSpot', null, -0.15); shroom(B, 0.95, 0.4, 0.8, 0.5, 'capRed', 'capSpot', null, 0.5); shroom(B, -0.65, 0.7, 0.55, 0.36, 'capRed', 'capSpot', null, -0.5); shroom(B, 0.35, -0.75, 0.35, 0.22, 'capRed', 'capSpot', null, 0.3); B.add(ell(1.2, 0.12, 1.0, 10, 4), { pos: [0.1, 0.03, 0.1], color: 'leaf' }); } });
add({ name: 'GlowShroom', palette: pal(P2, ['stem', 'capBlue']), glow: { Glow: '#6fd8ff', GlowCore: '#c9f6ff' }, bg: '#141a24', heroSize: [480, 480], build(B) { shroom(B, 0, 0, 1.6, 0.85, 'capBlue', true, 'Glow', -0.1); shroom(B, 1.0, 0.3, 1.0, 0.5, 'capBlue', true, 'Glow', 0.5); shroom(B, -0.7, 0.8, 0.7, 0.4, 'capBlue', true, 'Glow', -0.45); } });
add({
  name: 'Reeds', palette: pal(P2, ['reed', 'reedTop']), heroSize: [480, 480], parts: SWAY,
  build(B) { B = into(B, 'Sway'); const r = seeded(17); for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = 0.1 + r() * 0.6, h = 1.6 + r() * 1.6, x = Math.cos(a) * d, z = Math.sin(a) * d; B.add(cyl(0.04, 0.06, h, 5), { pos: [x, h / 2, z], color: 'reed' }); if (i % 2 === 0) B.add(cyl(0.12, 0.12, 0.6, 7), { pos: [x, h - 0.2, z], color: 'reedTop' }); else B.add(blade(1.4, 0.1, 0.03), { pos: [x, 0.3, z], quat: surfaceQuat([1, 0, 0], [Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3]), color: 'reed' }); } },
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
  build(B) {
    B.add(cyl(0.95, 1.15, 1.3, 14), { pos: [0, 0.65, 0], color: 'trunk' });
    for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28 + 0.2; B.add(cyl(0.07, 0.11, 1.25, 5), { pos: [Math.cos(a) * 1.03, 0.62, Math.sin(a) * 1.03], quat: quatTo([-Math.cos(a) * 0.15, 1, -Math.sin(a) * 0.15]), color: 'trunkDark' }); }
    for (const [rr, c, y] of [[0.9, 'bark', 1.3], [0.66, 'trunk', 1.315], [0.44, 'bark', 1.33], [0.2, 'trunk', 1.345]]) B.add(cyl(rr, rr, 0.03, 14), { pos: [0, y, 0], color: c });
    for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28 + 0.5, hh = 0.25 + ((i * 37) % 5) * 0.06; B.add(cone(0.16, hh, 4), { pos: [Math.cos(a) * 0.86, 1.3 + hh / 2 - 0.02, Math.sin(a) * 0.86], color: 'trunk' }); }
    for (let i = 0; i < 5; i++) { const a = i * 1.26 + 0.3; B.add(loft({ points: [[Math.cos(a) * 0.8, 0.55, Math.sin(a) * 0.8], [Math.cos(a) * 1.3, 0.2, Math.sin(a) * 1.3], [Math.cos(a) * 1.8, -0.05, Math.sin(a) * 1.8]], rx: (t) => 0.3 * (1 - 0.75 * t), ry: (t) => 0.24 * (1 - 0.75 * t), rings: 8, seg: 7 }), { color: 'trunkDark' }); }
    B.add(ell(0.5, 0.13, 0.4, 8, 5), { pos: [0.45, 1.35, 0.25], color: 'leaf' });
    B.add(ell(0.32, 0.4, 0.28, 8, 5), { pos: [-1.0, 0.75, 0.35], rot: [0, 0.3, 0], color: 'leaf' });
  },
});
add({
  name: 'Log', palette: pal(P, ['trunk', 'trunkDark', 'bark', 'leaf']), heroSize: [480, 480],
  build(B) {
    const X = (g) => { g.rotateZ(Math.PI / 2); return g; };
    B.add(X(cyl(0.7, 0.76, 5, 14)), { pos: [0, 0.72, 0], color: 'trunk' });
    for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.28 + 0.3, l = 3.6 + ((i * 53) % 7) * 0.2; B.add(X(cyl(0.08, 0.08, l, 5)), { pos: [((i * 31) % 5 - 2) * 0.15, 0.72 + Math.sin(a) * 0.72, Math.cos(a) * 0.72], color: 'trunkDark' }); }
    for (const [x, sgn] of [[-2.52, -1], [2.52, 1]]) {
      for (const [rr, c, dx] of [[0.66, 'bark', 0], [0.46, 'trunk', 0.01], [0.26, 'bark', 0.02]]) B.add(X(cyl(rr, rr, 0.04, 14)), { pos: [x + sgn * dx, 0.72, 0], color: c });
    }
    B.add(X(cyl(0.12, 0.12, 0.04, 8)), { pos: [2.55, 0.72, 0], color: 'trunkDark' });
    for (const [x, z, rr] of [[-0.6, 0.15, 1.1], [0.6, -0.1, 0.7]]) B.add(ell(rr, 0.22, 0.62, 10, 5), { pos: [x, 1.36, z], color: 'leaf' });
    for (const [x, y] of [[0.9, 0.95], [1.3, 0.7], [1.05, 0.45]]) { const sg = new THREE.CylinderGeometry(0.3, 0.32, 0.08, 10, 1, false, Math.PI, Math.PI); B.add(sg, { pos: [x, y, -0.7], color: 'bark' }); }
    B.add(loft({ points: [[1.2, 1.2, 0.2], [1.45, 1.75, 0.35], [1.4, 2.1, 0.5]], rx: (t) => 0.13 * (1 - 0.6 * t), ry: (t) => 0.13 * (1 - 0.6 * t), rings: 6, seg: 6 }), { color: 'trunkDark' });
    B.add(blade(0.45, 0.22, 0.04, 5), { pos: [1.4, 2.05, 0.5], quat: surfaceQuat([0, 0.3, 1], [0.6, 1, 0]), color: 'leaf' });
  },
});

export default nature;
