// v2 shops: the Haven stands rebuilt with more craft. Stone-and-plank bases, chamfered posts
// with braces, billowing striped awnings with scalloped valances, hanging signs that swing,
// lanterns, waving bunting, potted plants, and the new v2 egg models on display.
// Same names as the originals (EggShop, GemShop, ...), so v2 replaces them.
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, crystal, cyl, box, torus, rock, surfaceQuat, into } from '../lib.js';
import { eggGeo } from './eggs.js';
import EGGS from './eggs2.js';
import { canopy as leafy, seeded } from '../foliage.js';

const C = {
  wood: '#a8703f', woodDark: '#6e4426', woodLight: '#c99258', stone: '#a3a199', stoneDark: '#6d6c68', stoneLight: '#c4c2ba',
  gold: '#f2b33d', goldDeep: '#c27e1c', canvas: '#f6ecd6', canvasRed: '#d9483b', canvasBlue: '#3d72c9', canvasPurple: '#7a4fc4', canvasTeal: '#2fa59a',
  leafDark: '#357a2f', leaf: '#4f9a3d', leafLight: '#7cbf4c', metal: '#7a8592', metalDark: '#3a414c', straw: '#e2b856', strawDark: '#b8892e',
  paper: '#f6efd9', ink: '#3a2a1e', cork: '#c99a62', pinRed: '#e8473a', pinBlue: '#3d6fc4', clay: '#c8693f',
  eggCream: '#f3e6c8', eggGreen: '#7fcf4a', eggBlue: '#4f8fe6', eggPurple: '#9a5ae6',
  gem: '#a46ae0', gemLight: '#d6b4ff', gemDeep: '#5e34a0', gemBlue: '#5fc8ff', gemRed: '#ff5a7a',
  potionR: '#e8473a', potionG: '#5fcf4a', potionB: '#3fa8ff', potionY: '#ffc23a', velvet: '#8a2a3a', book: '#7a3a2a',
};
const pal = (keys) => keys.map((k) => [k, C[k]]);
const LEAF = ['leafDark', 'leaf', 'leafLight'];
const list = [];
const add = (spec) => list.push({ category: 'Shops', v2: true, heroSize: [760, 680], fit: 0.85, ...spec });
const around = (n, f) => { for (let k = 0; k < n; k++) f((k / n) * Math.PI * 2, k); };
const lathe = (pts, seg = 16) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)), seg);

// ---------- v2 eggs embedded in a shop (their colours are prefixed EggName_colour) ----------
const eggSpec = (name) => EGGS.find((e) => e.name === name);
const eggPal = (...names) => names.flatMap((n) => eggSpec(n).palette.map(([k, h]) => [`${n}_${k}`, h]));
function embedEgg(B, name, { pos, s = 0.45, rotY = 0, body = 'Body', glow = 'Glow', glowMap = {} }) {
  const spec = eggSpec(name), glowNames = new Set(Object.keys(spec.glow || {}));
  const M = new THREE.Matrix4().compose(V(pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0)), V([s, s, s]));
  spec.build({
    add(g, o = {}) {
      const q = o.quat || new THREE.Quaternion().setFromEuler(new THREE.Euler(...(o.rot || [0, 0, 0]), 'XYZ'));
      g.applyMatrix4(new THREE.Matrix4().compose(V(o.pos || [0, 0, 0]), q, V(o.scale || [1, 1, 1])));
      g.applyMatrix4(M);
      const isGlow = o.mesh && glowNames.has(o.mesh);
      B.add(g, { mesh: isGlow ? (glowMap[o.mesh] || glow) : body, color: `${name}_${o.color || 'shell'}`, noOutline: o.noOutline });
    },
  });
}

// ---------- kit ----------
// Plank deck on a stone footing with a rim of rounded cobbles.
function base(B, w, d, { h = 0.45, seed = 1, round = false } = {}) {
  const r = seeded(seed);
  if (round) {
    B.add(cyl(w / 2, w / 2 + 0.15, h, 24), { pos: [0, h / 2, 0], color: 'stoneDark' });
    const n = 10; for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2; const g = new THREE.CylinderGeometry(w / 2 - 0.2, w / 2 - 0.2, 0.12, 6, 1, false, a0, (Math.PI * 2) / n - 0.02); B.add(g, { pos: [0, h + 0.06, 0], color: i % 2 ? 'wood' : 'woodLight' }); }
    around(Math.round(w * 2.6), (a, k) => B.add(rock(0.3 + r() * 0.08, seed * 31 + k, 0.65), { pos: [Math.cos(a) * (w / 2 + 0.05), 0.18, Math.sin(a) * (w / 2 + 0.05)], rot: [0, r() * 6, 0], color: ['stone', 'stoneLight', 'stone'][k % 3] }));
    return h + 0.12;
  }
  B.add(box(w, h, d), { pos: [0, h / 2, 0], color: 'stoneDark' });
  const n = Math.max(4, Math.round(d / 0.55));
  for (let i = 0; i < n; i++) B.add(box(w - 0.3, 0.12, d / n - 0.05), { pos: [(r() - 0.5) * 0.06, h + 0.06, -d / 2 + (i + 0.5) * (d / n)], color: ['wood', 'woodLight', 'wood'][i % 3] });
  const edge = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), m = Math.round(L / 0.7); for (let i = 0; i <= m; i++) { const t = i / m; B.add(rock(0.3 + r() * 0.1, seed * 17 + i + Math.round(x0 * 7 + z0 * 13), 0.65), { pos: [x0 + (x1 - x0) * t, 0.2, z0 + (z1 - z0) * t], rot: [0, r() * 6, 0], color: ['stone', 'stoneLight', 'stone'][i % 3] }); } };
  edge(-w / 2, -d / 2, w / 2, -d / 2); edge(-w / 2, d / 2, w / 2, d / 2); edge(-w / 2, -d / 2, -w / 2, d / 2); edge(w / 2, -d / 2, w / 2, d / 2);
  return h + 0.12;
}
// Chamfered post with a stone footing, a cap and a gold band.
function post(B, x, z, y0, h, { col = 'woodDark', band = 'gold' } = {}) {
  B.add(box(0.62, 0.32, 0.62), { pos: [x, y0 + 0.16, z], color: 'stone' });
  B.add(cyl(0.24, 0.26, h, 8), { pos: [x, y0 + h / 2, z], rot: [0, Math.PI / 8, 0], color: col });
  B.add(cyl(0.3, 0.3, 0.1, 8), { pos: [x, y0 + 0.36, z], color: band });
  B.add(box(0.55, 0.16, 0.55), { pos: [x, y0 + h, z], color: col });
}
// Diagonal brace between a post and a beam.
function brace(B, a, b) { const A = V(a), Bv = V(b), d = Bv.clone().sub(A); B.add(box(0.14, d.length(), 0.14), { pos: A.clone().lerp(Bv, 0.5).toArray(), quat: quatTo(d.toArray()), color: 'woodDark' }); }
// Counter: carcass with a vertical-plank front, overhanging top and a gold trim strip.
function counter(B, w, d, h, z, y0, { front = 'wood', top = 'woodLight', trim = 'gold', panel } = {}) {
  B.add(box(w, h, d), { pos: [0, y0 + h / 2, z], color: 'woodDark' });
  const n = Math.round(w / 0.42);
  for (let i = 0; i < n; i++) B.add(box(w / n - 0.04, h - 0.25, 0.08), { pos: [-w / 2 + (i + 0.5) * (w / n), y0 + h / 2 - 0.02, z - d / 2 - 0.03], color: panel && i % 2 ? panel : i % 3 === 1 ? 'woodLight' : front });
  B.add(box(w + 0.35, 0.18, d + 0.4), { pos: [0, y0 + h + 0.09, z], color: top });
  B.add(box(w + 0.37, 0.07, 0.05), { pos: [0, y0 + h - 0.02, z - d / 2 - 0.2], color: trim });
  B.add(box(w + 0.1, 0.14, d + 0.1), { pos: [0, y0 + 0.07, z], color: 'woodDark' });
}
// Bent slab (bulges down in the middle along its length): awning stripes.
function curvedSlab(w, len, th, sag, seg = 8) {
  const g = new THREE.BoxGeometry(w, th, len, 1, 1, seg), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const u = P.getZ(i) / (len / 2); P.setY(i, P.getY(i) - sag * (1 - u * u)); }
  g.computeVertexNormals(); return g;
}
// Striped awning sloping down toward -Z: billowing stripes, scalloped valance, front rod.
function awning(B, { w, d, yBack, yFront, z = 0, colors, sag = 0.18, rod = 'gold' }) {
  const n = Math.max(4, Math.round(w / 1.05)), sw = w / n;
  const slope = Math.atan2(yBack - yFront, d), L = Math.hypot(d, yBack - yFront), yc = (yBack + yFront) / 2;
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * sw;
    B.add(curvedSlab(sw + 0.02, L, 0.1, sag, 8), { pos: [x, yc, z], rot: [-slope, 0, 0], color: colors[i % 2] });
    // scallop
    const sc = new THREE.CylinderGeometry(sw / 2, sw / 2, 0.1, 12, 1, false, 0, Math.PI); sc.rotateX(Math.PI / 2); sc.rotateZ(Math.PI);
    B.add(sc, { pos: [x, yFront - 0.02, z - d / 2 - 0.02], color: colors[i % 2] });
    B.add(box(sw, 0.42, 0.1), { pos: [x, yFront + 0.17, z - d / 2 - 0.02], color: colors[i % 2] });
  }
  B.add(cyl(0.07, 0.07, w + 0.3, 8), { pos: [0, yFront + 0.38, z - d / 2 - 0.1], rot: [0, 0, Math.PI / 2], color: rod });
  for (const s of [-1, 1]) B.add(ell(0.13, 0.13, 0.13, 8, 6), { pos: [s * (w / 2 + 0.18), yFront + 0.38, z - d / 2 - 0.1], color: rod });
  B.add(box(w + 0.2, 0.2, 0.2), { pos: [0, yBack + 0.05, z + d / 2], color: 'woodDark' });
}
// Hanging sign on two chains from a beam: board + gold frame + an icon (drawn by fn), in the Swing part.
function hangingSign(B, pos, w, h, bg, icon) {
  const S = into(B, 'Swing'), [x, y, z] = pos;
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) S.add(torus(0.06, 0.02, 4, 8), { pos: [x + s * w * 0.35, y - 0.1 - k * 0.11, z], rot: [0, k % 2 ? Math.PI / 2 : 0, 0], color: 'metalDark' });
  S.add(box(w + 0.18, h + 0.18, 0.12), { pos: [x, y - 0.45 - h / 2, z], color: 'gold' });
  S.add(box(w, h, 0.16), { pos: [x, y - 0.45 - h / 2, z], color: bg });
  icon(S, [x, y - 0.45 - h / 2, z - 0.1]);
}
// Wall lantern on a bracket: cage + roof + glowing pane block (Lamp glow).
function lantern(B, pos, dirX = 1, scale = 1) {
  const [x, y, z] = pos, s = scale;
  B.add(box(0.5 * s, 0.07 * s, 0.07 * s), { pos: [x + dirX * 0.25 * s, y + 0.35 * s, z], color: 'metalDark' });
  const lx = x + dirX * 0.5 * s;
  B.add(cyl(0.18 * s, 0.18 * s, 0.4 * s, 6), { pos: [lx, y, z], mesh: 'Lamp' });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; B.add(box(0.03 * s, 0.42 * s, 0.03 * s), { pos: [lx + Math.cos(a) * 0.19 * s, y, z + Math.sin(a) * 0.19 * s], color: 'metalDark' }); }
  B.add(cone(0.27 * s, 0.25 * s, 6), { pos: [lx, y + 0.32 * s, z], color: 'metalDark' });
  B.add(cyl(0.2 * s, 0.22 * s, 0.07 * s, 6), { pos: [lx, y - 0.23 * s, z], color: 'metalDark' });
  B.add(torus(0.06 * s, 0.02 * s, 4, 8), { pos: [lx, y + 0.48 * s, z], color: 'metalDark' });
}
// Bunting: a sagging rope with pennants skinned to bones Flag1..Flag4 between x0 and x1.
const BUNT_BONES = (x0, x1, y, z) => [0, 1, 2, 3].map((i) => [`Flag${i + 1}`, i ? `Flag${i}` : null, [x0 + ((x1 - x0) * i) / 3, y, z]]);
function bunting(B, x0, x1, y, z, colors, n = 12) {
  const sag = (t) => -0.35 * Math.sin(Math.PI * t);
  const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([x0 + (x1 - x0) * t, y + sag(t), z]); }
  const wt = (x) => { const t = Math.min(0.999, Math.max(0, (x - x0) / (x1 - x0))) * 3, i = Math.floor(t), f = t - i; return i >= 3 ? [['Flag4', 1]] : [[`Flag${i + 1}`, 1 - f], [`Flag${i + 2}`, f]]; };
  B.add(loft({ points: pts, rx: () => 0.025, ry: () => 0.025, rings: 16, seg: 4 }), { color: 'ink', mesh: 'Flag', weights: (p) => wt(p.x) });
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t, g = new THREE.ConeGeometry(0.22, 0.5, 3); g.rotateX(Math.PI); g.scale(1, 1, 0.25);
    B.add(g, { pos: [x, y + sag(t) - 0.26, z], color: colors[k % colors.length], mesh: 'Flag', weights: (p) => wt(p.x) });
  }
}
// Clay pot with a leafy bush (Rustle part) and a few flowers.
function plant(B, pos, s = 1, seed = 1, flowers) {
  const [x, y, z] = pos;
  B.add(lathe([[0.3 * s, 0], [0.36 * s, 0.05 * s], [0.46 * s, 0.45 * s], [0.52 * s, 0.55 * s], [0.44 * s, 0.56 * s]], 12), { pos: [x, y, z], color: 'clay' });
  B.add(torus(0.48 * s, 0.05 * s, 4, 12), { pos: [x, y + 0.53 * s, z], rot: [Math.PI / 2, 0, 0], color: 'goldDeep' });
  leafy(B, { blobs: [[x, y + 0.85 * s, z, 0.45 * s], [x + 0.25 * s, y + 0.75 * s, z + 0.1 * s, 0.3 * s], [x - 0.25 * s, y + 0.78 * s, z - 0.08 * s, 0.3 * s]], shades: LEAF, count: Math.round(70 * s), size: [0.32 * s, 0.2 * s], seed, centre: [x, y + 0.5 * s, z], cardMesh: 'Rustle',
    extra: flowers ? ({ surface }) => { for (let i = 0; i < 4; i++) { const { p } = surface(); B.add(ell(0.07 * s, 0.07 * s, 0.07 * s, 6, 4), { pos: p.toArray(), color: flowers[i % flowers.length], mesh: 'Rustle' }); } } : undefined });
}
function crate(B, pos, s = 1, rotY = 0) {
  const [x, y, z] = pos;
  B.add(box(0.9 * s, 0.9 * s, 0.9 * s), { pos: [x, y + 0.45 * s, z], rot: [0, rotY, 0], color: 'wood' });
  for (const dy of [0.08, 0.82]) B.add(box(0.94 * s, 0.1 * s, 0.94 * s), { pos: [x, y + dy * s, z], rot: [0, rotY, 0], color: 'woodDark' });
  B.add(box(0.1 * s, 0.9 * s, 0.94 * s), { pos: [x, y + 0.45 * s, z], rot: [0, rotY + 0, Math.PI / 4.6], color: 'woodDark' });
}
function barrel(B, pos, s = 1) {
  const [x, y, z] = pos;
  B.add(lathe([[0.36 * s, 0], [0.44 * s, 0.45 * s], [0.36 * s, 0.9 * s]], 14), { pos: [x, y, z], color: 'wood' });
  for (const t of [0.12, 0.45, 0.78]) B.add(torus((t === 0.45 ? 0.445 : 0.4) * s, 0.03 * s, 4, 14), { pos: [x, y + t * s, z], rot: [Math.PI / 2, 0, 0], color: 'metalDark' });
  B.add(cyl(0.35 * s, 0.35 * s, 0.03 * s, 14), { pos: [x, y + 0.9 * s, z], color: 'woodLight' });
}
function coinPile(B, pos, n = 10, seed = 1) {
  const r = seeded(seed), [x, y, z] = pos;
  for (let k = 0; k < n; k++) { const a = r() * 6.28, d = r() * 0.35 * (1 - k / n), h = (k / n) * 0.35; B.add(cyl(0.16, 0.16, 0.05, 10), { pos: [x + Math.cos(a) * d, y + 0.03 + h, z + Math.sin(a) * d], rot: [(r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5], color: k % 3 ? 'gold' : 'goldDeep' }); }
}
// Glass display dome on a gold pedestal (the egg goes inside separately).
function displayDome(B, pos, r = 0.65) {
  const [x, y, z] = pos;
  B.add(cyl(r + 0.12, r + 0.2, 0.22, 16), { pos: [x, y + 0.11, z], color: 'goldDeep' });
  B.add(cyl(r + 0.05, r + 0.08, 0.1, 16), { pos: [x, y + 0.27, z], color: 'gold' });
  B.add(torus(r + 0.06, 0.04, 4, 20), { pos: [x, y + 0.34, z], rot: [Math.PI / 2, 0, 0], mesh: 'Glow' });
  const dome = new THREE.SphereGeometry(r, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2); dome.scale(1, 1.6, 1);
  B.add(cyl(r, r, 0.35, 18, 1), { pos: [x, y + 0.5, z], mesh: 'Glass' });
  B.add(dome, { pos: [x, y + 0.67, z], mesh: 'Glass' });
  B.add(cyl(0.08, 0.1, 0.16, 8), { pos: [x, y + 0.67 + r * 1.6 + 0.05, z], color: 'gold' });
}
// Small egg (v1 shape) in a palette colour, for shelves.
function smallEgg(B, pos, color, s = 0.32) { B.add(eggGeo(12, 9), { pos, scale: [s, s, s], color }); }

// ---------- Egg Shop ----------
add({
  name: 'EggShop',
  palette: [...pal(['wood', 'woodDark', 'woodLight', 'stone', 'stoneDark', 'stoneLight', 'gold', 'goldDeep', 'canvas', 'canvasRed', 'leafDark', 'leaf', 'leafLight', 'eggCream', 'eggGreen', 'eggBlue', 'eggPurple', 'ink', 'clay', 'metalDark']), ...eggPal('EggVolcano', 'EggOcean', 'EggCrystal')],
  glow: { Glow: '#ffd88a', GlowCore: '#fff6d8', Lamp: '#ffd36b', HoverGlow: '#fff1a0' }, glass: { Glass: '#dff4ff' },
  parts: { Swing: { pivot: [0, 5.2, -2.95] }, Rustle: { pivot: [0, 0.6, 0] }, HoverEgg: { pivot: [0, 9.3, 0.4] }, HoverGlow: { pivot: [0, 9.3, 0.4] } },
  bones: BUNT_BONES(-5.0, 5.0, 5.75, -3.15), skinned: ['Flag'], heroSize: [820, 760],
  build(B) {
    const y0 = base(B, 11, 7, { seed: 3 });
    for (const x of [-4.8, 4.8]) for (const z of [-2.9, 2.9]) post(B, x, z, y0, 5.0);
    // beams + braces
    B.add(box(10.2, 0.3, 0.3), { pos: [0, y0 + 4.85, -2.9], color: 'woodDark' });
    B.add(box(10.2, 0.3, 0.3), { pos: [0, y0 + 4.85, 2.9], color: 'woodDark' });
    for (const x of [-4.8, 4.8]) { brace(B, [x, y0 + 3.9, -2.9], [x + (x < 0 ? 0.9 : -0.9), y0 + 4.75, -2.9]); B.add(box(0.3, 0.3, 6.1), { pos: [x, y0 + 4.85, 0], color: 'woodDark' }); }
    awning(B, { w: 11.0, d: 6.6, yBack: y0 + 6.3, yFront: y0 + 5.0, z: -0.15, colors: ['canvasRed', 'canvas'] });
    // front counter with three glass domes holding v2 eggs
    counter(B, 8.6, 1.3, 1.6, -2.0, y0, { panel: 'canvasRed' });
    const top = y0 + 1.78;
    [['EggVolcano', -2.8], ['EggOcean', 0], ['EggCrystal', 2.8]].forEach(([egg, x]) => { displayDome(B, [x, top, -2.0], 0.62); embedEgg(B, egg, { pos: [x, top + 0.36, -2.0], s: 0.42, rotY: -0.4 }); });
    for (const x of [-4.0, 4.0]) coinPile(B, [x, top, -1.8], 9, x > 0 ? 2 : 3);
    // back wall shelves stacked with rarity eggs
    B.add(box(9.4, 3.6, 0.3), { pos: [0, y0 + 1.8, 2.6], color: 'wood' });
    for (let i = 0; i < 8; i++) B.add(box(0.06, 3.5, 0.05), { pos: [-4.1 + i * 1.17, y0 + 1.8, 2.43], color: 'woodDark' });
    const cols = ['eggCream', 'eggGreen', 'eggBlue', 'eggPurple', 'gold'];
    for (let s = 0; s < 3; s++) {
      const sy = y0 + 0.75 + s * 1.05;
      B.add(box(9.0, 0.14, 0.9), { pos: [0, sy, 2.1], color: 'woodLight' });
      B.add(box(9.0, 0.08, 0.06), { pos: [0, sy + 0.05, 1.66], color: 'gold' });
      for (let k = 0; k < 9; k++) smallEgg(B, [-3.9 + k * 0.98, sy + 0.07, 2.1 + ((k + s) % 2) * 0.1], cols[(k + s * 2) % 5], 0.3);
    }
    // swinging sign with an egg emblem
    hangingSign(B, [0, y0 + 4.7, -2.95], 2.6, 1.1, 'canvas', (S, c) => {
      S.add(eggGeo(14, 10), { pos: [c[0] - 0.7, c[1] - 0.38, c[2]], scale: [0.32, 0.32, 0.12], color: 'canvasRed' });
      for (let k = 0; k < 3; k++) S.add(box(0.95, 0.09, 0.04), { pos: [c[0] + 0.35, c[1] + 0.22 - k * 0.22, c[2]], color: 'ink' });
    });
    bunting(B, -5.0, 5.0, y0 + 5.15, -3.15, ['canvasRed', 'gold', 'canvas', 'eggBlue']);
    for (const x of [-4.8, 4.8]) lantern(B, [x, y0 + 3.4, -3.2], x < 0 ? -1 : 1);
    plant(B, [-5.0, y0, -3.7], 1.0, 11, ['canvasRed', 'eggCream']);
    plant(B, [5.0, y0, -3.7], 1.0, 12, ['eggBlue', 'eggCream']);
    crate(B, [4.6, y0, 1.2], 0.8, 0.3); crate(B, [4.5, y0 + 0.72, 1.25], 0.6, -0.2); barrel(B, [-4.6, y0, 1.0], 0.9);
    smallEgg(B, [4.5, y0 + 1.2, 1.25], 'eggPurple', 0.26);
    // hovering big egg above the roof
    const H = into(B, 'HoverEgg');
    H.add(eggGeo(24, 18), { pos: [0, y0 + 7.7, 0.4], scale: [0.75, 0.75, 0.75], color: 'gold' });
    for (const t of [0.35, 0.65]) H.add(torus(0.62 * Math.sin(Math.PI * (t * 0.9 + 0.05)) + 0.06, 0.05, 5, 24), { pos: [0, y0 + 7.7 + t * 1.8, 0.4], rot: [Math.PI / 2, 0, 0], color: 'goldDeep' });
    B.add(torus(1.05, 0.07, 6, 32), { pos: [0, y0 + 8.6, 0.4], rot: [Math.PI / 2 - 0.3, 0, 0.15], mesh: 'HoverGlow' });
  },
});

// ---------- Incubator (single, v2) ----------
function incubatorV2(B, x, y0, z, { egg, s = 1, eggMesh = 'Body', plainEgg }) {
  const P = (a, b, c) => [x + a * s, y0 + b * s, z + c * s];
  B.add(cyl(1.55 * s, 1.85 * s, 0.6 * s, 20), { pos: P(0, 0.3, 0), color: 'metalDark' });
  around(10, (a) => B.add(ell(0.07 * s, 0.07 * s, 0.07 * s, 6, 4), { pos: P(Math.cos(a) * 1.72, 0.45, Math.sin(a) * 1.72), color: 'gold' }));
  B.add(cyl(1.45 * s, 1.55 * s, 0.5 * s, 20), { pos: P(0, 0.85, 0), color: 'gold' });
  B.add(torus(1.5 * s, 0.08 * s, 5, 32), { pos: P(0, 1.12, 0), rot: [Math.PI / 2, 0, 0], mesh: 'Glow' });
  B.add(cyl(1.25 * s, 1.3 * s, 0.18 * s, 20), { pos: P(0, 1.2, 0), color: 'metal' });
  // straw nest
  for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2; B.add(box(0.5 * s, 0.06 * s, 0.07 * s), { pos: P(Math.cos(a) * 0.55, 1.36, Math.sin(a) * 0.55), rot: [0.3, -a + 0.6, 0.15], color: k % 2 ? 'straw' : 'strawDark' }); }
  B.add(ell(0.75 * s, 0.14 * s, 0.75 * s, 14, 6), { pos: P(0, 1.32, 0), color: 'strawDark' });
  // dome
  const dome = new THREE.SphereGeometry(1.3 * s, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2); dome.scale(1, 1.45, 1);
  B.add(dome, { pos: P(0, 1.3, 0), mesh: 'Glass' });
  for (const a of [0, Math.PI / 2]) B.add(torus(1.31 * s, 0.045 * s, 4, 24, Math.PI), { pos: P(0, 1.3, 0), rot: [0, a, 0], scale: [1, 1.45, 1], color: 'goldDeep' });
  B.add(torus(1.31 * s, 0.09 * s, 5, 32), { pos: P(0, 1.33, 0), rot: [Math.PI / 2, 0, 0], color: 'goldDeep' });
  B.add(cyl(0.28 * s, 0.34 * s, 0.3 * s, 12), { pos: P(0, 3.2, 0), color: 'gold' });
  B.add(ell(0.2 * s, 0.2 * s, 0.2 * s, 10, 8), { pos: P(0, 3.45, 0), mesh: 'GlowCore' });
  // gauge dial and side pipes
  B.add(cyl(0.3 * s, 0.3 * s, 0.1 * s, 16), { pos: P(0, 0.7, -1.68), rot: [Math.PI / 2, 0, 0], color: 'canvas' });
  B.add(torus(0.3 * s, 0.04 * s, 4, 16), { pos: P(0, 0.7, -1.72), color: 'gold' });
  B.add(box(0.03 * s, 0.22 * s, 0.03 * s), { pos: P(0.05, 0.75, -1.75), rot: [0, 0, -0.6], color: 'canvasRed' });
  for (const a of [0.9, 2.3]) B.add(loft({ points: [P(Math.cos(a) * 1.75, 0.5, Math.sin(a) * 1.75), P(Math.cos(a) * 2.05, 1.0, Math.sin(a) * 2.05), P(Math.cos(a) * 1.5, 1.3, Math.sin(a) * 1.5)], rx: () => 0.09 * s, ry: () => 0.09 * s, rings: 10, seg: 6 }), { color: 'metal' });
  if (egg) embedEgg(B, egg, { pos: P(0, 1.36, 0), s: 0.72 * s, body: eggMesh, glow: eggMesh === 'Body' ? 'Glow' : 'HoverGlow' });
  else if (plainEgg) B.add(eggGeo(20, 14), { pos: P(0, 1.36, 0), scale: [0.72 * s, 0.72 * s, 0.72 * s], color: plainEgg });
}
add({
  name: 'Incubator', palette: [...pal(['metal', 'metalDark', 'gold', 'goldDeep', 'canvas', 'canvasRed', 'straw', 'strawDark']), ...eggPal('EggRainbow')],
  glow: { Glow: '#7ff3ff', GlowCore: '#e6fdff', HoverGlow: '#b9a6ff' }, glass: { Glass: '#cfefff' }, heroSize: [540, 640],
  parts: { HoverEgg: { pivot: [0, 2.2, 0] }, HoverGlow: { pivot: [0, 2.2, 0] } },
  build(B) { incubatorV2(B, 0, 0, 0, { egg: 'EggRainbow', eggMesh: 'HoverEgg' }); },
});

// ---------- Incubator Station ----------
add({
  name: 'IncubatorStation',
  palette: [...pal(['wood', 'woodDark', 'woodLight', 'stone', 'stoneDark', 'stoneLight', 'gold', 'goldDeep', 'canvas', 'canvasBlue', 'metal', 'metalDark', 'straw', 'strawDark', 'canvasRed', 'leafDark', 'leaf', 'leafLight', 'clay', 'ink']), ...eggPal('EggOcean', 'EggStorm')],
  glow: { Glow: '#7ff3ff', GlowCore: '#e6fdff', Lamp: '#ffd36b' }, glass: { Glass: '#cfefff' },
  parts: { Blades: { pivot: [0, 4.3, 2.42] }, Swing: { pivot: [0, 5.0, -2.95] }, Rustle: { pivot: [0, 0.6, 0] } },
  bones: BUNT_BONES(-5.6, 5.6, 5.6, -3.1), skinned: ['Flag'], heroSize: [860, 720],
  build(B) {
    const y0 = base(B, 12, 7, { seed: 5 });
    for (const x of [-5.4, 5.4]) for (const z of [-2.9, 2.9]) post(B, x, z, y0, 4.8);
    B.add(box(11.4, 0.3, 0.3), { pos: [0, y0 + 4.65, -2.9], color: 'woodDark' }); B.add(box(11.4, 0.3, 0.3), { pos: [0, y0 + 4.65, 2.9], color: 'woodDark' });
    for (const x of [-5.4, 5.4]) { B.add(box(0.3, 0.3, 6.1), { pos: [x, y0 + 4.65, 0], color: 'woodDark' }); brace(B, [x, y0 + 3.7, -2.9], [x + (x < 0 ? 0.9 : -0.9), y0 + 4.55, -2.9]); }
    awning(B, { w: 12.2, d: 6.6, yBack: y0 + 6.1, yFront: y0 + 4.8, z: -0.15, colors: ['canvasBlue', 'canvas'] });
    // raised platform with three incubators (eggs inside)
    B.add(box(10.4, 0.5, 3.4), { pos: [0, y0 + 0.25, -0.3], color: 'stone' });
    B.add(box(10.6, 0.1, 3.6), { pos: [0, y0 + 0.52, -0.3], color: 'gold' });
    [['EggOcean', -3.3], [null, 0], ['EggStorm', 3.3]].forEach(([egg, x]) => incubatorV2(B, x, y0 + 0.57, -0.3, { egg, s: 0.78, plainEgg: 'gold' }));
    // back boiler: tank, glowing tubes to each incubator, a spinning fan
    B.add(cyl(1.0, 1.0, 3.2, 16), { pos: [0, y0 + 2.1, 2.3], color: 'metal' });
    for (const y of [0.9, 2.1, 3.3]) B.add(torus(1.02, 0.06, 4, 20), { pos: [0, y0 + y, 2.3], rot: [Math.PI / 2, 0, 0], color: 'goldDeep' });
    B.add(cone(1.05, 0.6, 16), { pos: [0, y0 + 4.0, 2.3], color: 'metalDark' });
    B.add(cyl(0.9, 0.9, 0.1, 20), { pos: [0, y0 + 4.3, 2.42], rot: [Math.PI / 2, 0, 0], color: 'metalDark' });
    into(B, 'Blades').add(cyl(0.16, 0.16, 0.12, 10), { pos: [0, y0 + 4.3, 2.3], rot: [Math.PI / 2, 0, 0], color: 'gold' });
    around(5, (a) => into(B, 'Blades').add(blade(0.75, 0.22, 0.04), { pos: [0, y0 + 4.3, 2.3], quat: surfaceQuat([0, 0, -1], [Math.cos(a), Math.sin(a), 0]), color: 'canvas' }));
    for (const x of [-3.3, 3.3, 0]) B.add(loft({ points: [[x * 0.25, y0 + 2.6, 1.4], [x * 0.7, y0 + 2.8, 0.9], [x, y0 + 2.3, 0.6]], rx: () => 0.09, ry: () => 0.09, rings: 12, seg: 6 }), { mesh: 'Glow' });
    // control panel side table
    B.add(box(1.4, 1.1, 1.0), { pos: [-4.6, y0 + 0.55, 1.6], color: 'metalDark' });
    B.add(box(1.3, 0.1, 0.9), { pos: [-4.6, y0 + 1.15, 1.6], rot: [-0.3, 0, 0], color: 'metal' });
    for (let k = 0; k < 3; k++) B.add(cyl(0.08, 0.08, 0.08, 8), { pos: [-5.0 + k * 0.4, y0 + 1.24, 1.55], color: ['canvasRed', 'gold', 'canvasBlue'][k] });
    hangingSign(B, [0, y0 + 4.5, -2.95], 2.8, 1.0, 'canvas', (S, c) => {
      const d = new THREE.SphereGeometry(0.4, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); S.add(d, { pos: [c[0] - 0.85, c[1] - 0.3, c[2]], scale: [1, 1.2, 0.3], color: 'canvasBlue' });
      S.add(box(0.9, 0.12, 0.05), { pos: [c[0] - 0.85, c[1] - 0.32, c[2]], color: 'gold' });
      for (let k = 0; k < 3; k++) S.add(box(1.0, 0.09, 0.04), { pos: [c[0] + 0.35, c[1] + 0.22 - k * 0.22, c[2]], color: 'ink' });
    });
    bunting(B, -5.6, 5.6, y0 + 4.95, -3.1, ['canvasBlue', 'canvas', 'gold', 'canvasRed']);
    for (const x of [-5.4, 5.4]) lantern(B, [x, y0 + 3.2, -3.2], x < 0 ? -1 : 1);
    plant(B, [5.6, y0, -3.7], 1.0, 21); plant(B, [-5.6, y0, -3.7], 1.0, 22, ['canvasRed', 'canvas']);
    crate(B, [4.8, y0, 1.8], 0.8, 0.4);
  },
});

// ---------- Gem Shop ----------
function gem(B, pos, s, color, mesh) { const g = new THREE.OctahedronGeometry(1, 0); g.scale(s * 0.8, s, s * 0.8); B.add(g, { pos, color, ...(mesh ? { mesh } : {}) }); }
add({
  name: 'GemShop',
  palette: pal(['wood', 'woodDark', 'woodLight', 'stone', 'stoneDark', 'stoneLight', 'gold', 'goldDeep', 'canvas', 'canvasPurple', 'canvasBlue', 'gem', 'gemLight', 'gemDeep', 'gemBlue', 'gemRed', 'leafDark', 'leaf', 'leafLight', 'clay', 'velvet', 'metalDark', 'ink']),
  glow: { Glow: '#c88aff', GlowCore: '#7ff3ff', Lamp: '#ffd36b', HoverGem: '#d6a8ff' }, glass: { Glass: '#e6dcff' },
  parts: { HoverGem: { pivot: [0, 10.2, 0] }, Swing: { pivot: [0, 4.95, -3.05] }, Rustle: { pivot: [0, 0.6, 0] } }, heroSize: [760, 800],
  build(B) {
    const y0 = base(B, 9, 6.6, { seed: 7 });
    for (const x of [-4.1, 4.1]) for (const z of [-2.75, 2.75]) post(B, x, z, y0, 4.8, { col: 'woodDark', band: 'gemLight' });
    B.add(box(8.6, 0.3, 0.3), { pos: [0, y0 + 4.65, -2.75], color: 'woodDark' }); B.add(box(8.6, 0.3, 0.3), { pos: [0, y0 + 4.65, 2.75], color: 'woodDark' });
    for (const x of [-4.1, 4.1]) B.add(box(0.3, 0.3, 5.8), { pos: [x, y0 + 4.65, 0], color: 'woodDark' });
    // pointed pavilion roof: 8 striped panels + scalloped skirt + gold finial
    const ry = y0 + 4.8, R = 5.6, Hr = 3.4;
    for (let k = 0; k < 8; k++) {
      const a0 = (k / 8) * Math.PI * 2 + Math.PI / 8;
      const g = new THREE.ConeGeometry(R, Hr, 8, 6, true, a0, Math.PI / 4); B.add(g, { pos: [0, ry + Hr / 2, 0], scale: [1, 1, 0.78], color: k % 2 ? 'canvas' : 'canvasPurple' });
      const g2 = new THREE.ConeGeometry(R - 0.12, Hr - 0.08, 8, 6, true, a0, Math.PI / 4); g2.scale(-1, 1, 1); B.add(g2, { pos: [0, ry + Hr / 2 - 0.06, 0], scale: [1, 1, 0.78], color: k % 2 ? 'canvas' : 'canvasPurple' });
    }
    around(16, (a, k) => { const sc = new THREE.CylinderGeometry(0.55, 0.55, 0.1, 10, 1, false, 0, Math.PI); sc.rotateX(Math.PI / 2); sc.rotateZ(Math.PI); B.add(sc, { pos: [Math.cos(a) * R * 0.99, ry - 0.02, Math.sin(a) * R * 0.78 * 0.99], quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a - Math.PI / 2, 0)), color: k % 2 ? 'canvasPurple' : 'canvas' }); });
    B.add(torus(1, 0.08, 5, 40), { pos: [0, ry + 0.05, 0], rot: [Math.PI / 2, 0, 0], scale: [R, R * 0.78, 1], color: 'gold' });
    B.add(cyl(0.12, 0.2, 0.9, 8), { pos: [0, ry + Hr + 0.3, 0], color: 'gold' });
    B.add(ell(0.28, 0.28, 0.28, 10, 8), { pos: [0, ry + Hr + 0.85, 0], color: 'gold' });
    // the big floating gem with two orbiting little gems
    const HG = into(B, 'HoverGem');
    gem(HG, [0, y0 + 9.8, 0], 0.9, null, 'HoverGem');
    gem(HG, [1.3, y0 + 9.6, 0], 0.25, null, 'HoverGem'); gem(HG, [-1.3, y0 + 10.0, 0.3], 0.22, null, 'HoverGem');
    // counter: velvet top with gem displays, a balance scale, jars of gems
    counter(B, 7.0, 1.3, 1.5, -1.8, y0, { panel: 'canvasPurple', top: 'velvet' });
    const top = y0 + 1.68;
    [[-2.6, 'Glow'], [-1.3, 'GlowCore'], [2.6, 'Glow']].forEach(([x, mesh], i) => { B.add(cyl(0.38, 0.45, 0.25, 8), { pos: [x, top + 0.12, -1.8], color: 'gold' }); around(4, (a, k) => B.add(crystal(0.1 + (k % 2) * 0.04, 0.45 + (k % 3) * 0.15), { pos: [x + Math.cos(a) * 0.15, top + 0.25, -1.8 + Math.sin(a) * 0.15], quat: quatTo([Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4]), mesh })); B.add(crystal(0.16, 0.85), { pos: [x, top + 0.25, -1.8], mesh: i === 1 ? 'GlowCore' : 'Glow' }); });
    // balance scale
    B.add(cyl(0.25, 0.3, 0.1, 10), { pos: [0.6, top + 0.05, -1.7], color: 'goldDeep' }); B.add(cyl(0.04, 0.04, 1.1, 6), { pos: [0.6, top + 0.6, -1.7], color: 'gold' });
    B.add(box(1.3, 0.05, 0.05), { pos: [0.6, top + 1.12, -1.7], rot: [0, 0, 0.1], color: 'gold' });
    for (const s of [-1, 1]) { B.add(cyl(0.25, 0.18, 0.06, 12), { pos: [0.6 + s * 0.62, top + 0.75 - s * 0.06, -1.7], color: 'gold' }); gem(B, [0.6 + s * 0.62, top + 0.88 - s * 0.06, -1.7], 0.12, s > 0 ? 'gemRed' : 'gemBlue'); }
    for (const [x, c] of [[1.7, 'gem'], [3.6, 'gemBlue']]) { B.add(lathe([[0.25, 0], [0.32, 0.1], [0.32, 0.6], [0.2, 0.7], [0.22, 0.8]], 12), { pos: [x, top, -1.65], mesh: 'Glass' }); for (let k = 0; k < 5; k++) gem(B, [x + (k % 2 - 0.5) * 0.18, top + 0.15 + k * 0.1, -1.65 + ((k * 7) % 3 - 1) * 0.08], 0.09, k % 2 ? c : 'gemLight'); }
    // back: open treasure chest overflowing with gems, crystal cluster rocks
    B.add(box(1.8, 0.9, 1.1), { pos: [-2.2, y0 + 0.45, 1.8], color: 'woodDark' });
    for (const x of [-2.95, -1.45]) B.add(box(0.12, 0.95, 1.15), { pos: [x, y0 + 0.47, 1.8], color: 'gold' });
    const lid = new THREE.CylinderGeometry(0.55, 0.55, 1.8, 12, 1, false, 0, Math.PI); lid.rotateZ(Math.PI / 2); B.add(lid, { pos: [-2.2, y0 + 1.2, 2.45], rot: [-1.1, 0, 0], color: 'woodDark' });
    const r = seeded(9); for (let k = 0; k < 14; k++) gem(B, [-2.2 + (r() - 0.5) * 1.5, y0 + 0.95 + r() * 0.25, 1.8 + (r() - 0.5) * 0.8], 0.12 + r() * 0.06, ['gem', 'gemLight', 'gemBlue', 'gemRed', 'gemDeep'][k % 5]);
    coinPile(B, [-0.9, y0, 1.9], 8, 4);
    B.add(rock(0.8, 61, 0.6, 1), { pos: [2.3, y0 + 0.3, 1.9], color: 'stoneDark' });
    around(6, (a, k) => B.add(crystal(0.18 + (k % 2) * 0.06, 0.8 + (k % 3) * 0.35), { pos: [2.3 + Math.cos(a) * 0.35, y0 + 0.5, 1.9 + Math.sin(a) * 0.35], quat: quatTo([Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5]), color: ['gem', 'gemLight', 'gemDeep'][k % 3] }));
    B.add(crystal(0.25, 1.4), { pos: [2.3, y0 + 0.5, 1.9], mesh: 'Glow' });
    hangingSign(B, [0, y0 + 4.5, -3.05], 2.4, 1.0, 'canvas', (S, c) => { gem(S, [c[0] - 0.7, c[1], c[2]], 0.36, 'gem'); for (let k = 0; k < 3; k++) S.add(box(0.9, 0.09, 0.04), { pos: [c[0] + 0.35, c[1] + 0.22 - k * 0.22, c[2]], color: 'ink' }); });
    for (const x of [-4.1, 4.1]) lantern(B, [x, y0 + 3.2, -3.05], x < 0 ? -1 : 1);
    plant(B, [-4.4, y0, -3.5], 0.95, 31, ['gemLight', 'canvas']); plant(B, [4.4, y0, -3.5], 0.95, 32, ['gemBlue', 'canvas']);
  },
});

// ---------- Upgrade Booth (round potion carousel) ----------
add({
  name: 'UpgradeBooth',
  palette: pal(['wood', 'woodDark', 'woodLight', 'stone', 'stoneDark', 'stoneLight', 'gold', 'goldDeep', 'canvas', 'canvasBlue', 'canvasTeal', 'potionR', 'potionG', 'potionB', 'potionY', 'leafDark', 'leaf', 'leafLight', 'clay', 'ink', 'metalDark']),
  glow: { Glow: '#7ff3ff', Lamp: '#ffd36b', PotionR: '#ff4f5a', PotionG: '#5fdc5a', PotionB: '#3fb8ff', PotionY: '#ffc83a' }, glass: { Glass: '#dff4ff' },
  parts: { Ring: { pivot: [0, 4.1, 0] }, Swing: { pivot: [0, 4.6, -3.2] }, Rustle: { pivot: [0, 0.6, 0] } },
  bones: [['Flag1', null, [0, 9.55, 0]], ['Flag2', 'Flag1', [0.5, 9.55, 0]], ['Flag3', 'Flag2', [1.0, 9.55, 0]], ['Flag4', 'Flag3', [1.5, 9.55, 0]]], skinned: ['Flag'], heroSize: [760, 800],
  build(B) {
    const y0 = base(B, 7.6, 7.6, { seed: 9, round: true });
    // round counter ring with a gap at the back
    const ring = (r0, r1, h, y, col, seg = 32) => { const s = new THREE.Shape(); s.absarc(0, 0, r1, 0.35, Math.PI * 2 - 0.35, false); s.absarc(0, 0, r0, Math.PI * 2 - 0.35, 0.35, true); const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: seg }); g.rotateX(-Math.PI / 2); g.rotateY(Math.PI / 2); B.add(g, { pos: [0, y, 0], color: col }); };
    ring(2.3, 2.85, 1.45, y0, 'canvasBlue'); ring(2.2, 3.1, 0.16, y0 + 1.45, 'woodLight'); ring(2.84, 2.9, 0.08, y0 + 1.35, 'gold');
    around(14, (a, k) => { if (Math.abs(Math.cos(a) - 1) < 0.08) return; B.add(box(0.1, 1.2, 0.1), { pos: [Math.cos(a + Math.PI / 2) * 2.88, y0 + 0.65, Math.sin(a + Math.PI / 2) * 2.88], color: 'gold' }); });
    // potions standing on the counter
    const PS = ['PotionR', 'PotionG', 'PotionB', 'PotionY'];
    around(10, (a, k) => { const aa = a + Math.PI / 2; if (Math.cos(a) > 0.9) return; const x = Math.cos(aa) * 2.65, z = Math.sin(aa) * 2.65; B.add(lathe([[0, 0], [0.2, 0.02], [0.24, 0.22], [0.1, 0.45], [0.09, 0.55], [0, 0.55]], 10), { pos: [x, y0 + 1.61, z], mesh: 'Glass' }); B.add(lathe([[0, 0.03], [0.17, 0.05], [0.21, 0.2], [0, 0.3]], 10), { pos: [x, y0 + 1.61, z], mesh: PS[k % 4] }); B.add(cyl(0.07, 0.07, 0.1, 6), { pos: [x, y0 + 2.2, z], color: 'woodLight' }); });
    // central pole, carousel ring of potions turning under the roof
    B.add(cyl(0.22, 0.28, 7.0, 10), { pos: [0, y0 + 3.5, 0], color: 'gold' });
    for (const y of [1.0, 2.6]) B.add(torus(0.3, 0.06, 4, 12), { pos: [0, y0 + y, 0], rot: [Math.PI / 2, 0, 0], color: 'goldDeep' });
    const RG = into(B, 'Ring');
    RG.add(cyl(1.6, 1.6, 0.12, 24), { pos: [0, y0 + 3.4, 0], color: 'woodLight' }); RG.add(torus(1.6, 0.06, 4, 24), { pos: [0, y0 + 3.46, 0], rot: [Math.PI / 2, 0, 0], color: 'gold' });
    around(6, (a, k) => { const x = Math.cos(a) * 1.25, z = Math.sin(a) * 1.25; RG.add(lathe([[0, 0], [0.26, 0.03], [0.3, 0.3], [0.12, 0.6], [0.11, 0.72], [0, 0.72]], 10), { pos: [x, y0 + 3.46, z], color: ['potionR', 'potionG', 'potionB', 'potionY'][k % 4] }); RG.add(cyl(0.09, 0.09, 0.12, 6), { pos: [x, y0 + 4.24, z], color: 'woodDark' }); RG.add(ell(0.08, 0.08, 0.08, 6, 4), { pos: [x - 0.1, y0 + 3.8, z - 0.15], color: 'canvas' }); });
    // striped cone roof with scallops, gold rim, finial + pennant
    const ry = y0 + 4.9, R = 4.4, Hr = 3.3;
    for (let k = 0; k < 12; k++) {
      const a0 = (k / 12) * Math.PI * 2;
      const g = new THREE.ConeGeometry(R, Hr, 6, 6, true, a0, Math.PI / 6); B.add(g, { pos: [0, ry + Hr / 2, 0], color: k % 2 ? 'canvas' : 'canvasBlue' });
      const g2 = new THREE.ConeGeometry(R - 0.1, Hr - 0.07, 6, 6, true, a0, Math.PI / 6); g2.scale(-1, 1, 1); B.add(g2, { pos: [0, ry + Hr / 2 - 0.05, 0], color: k % 2 ? 'canvas' : 'canvasBlue' });
    }
    around(24, (a, k) => { const sc = new THREE.CylinderGeometry(0.55, 0.55, 0.1, 10, 1, false, 0, Math.PI); sc.rotateX(Math.PI / 2); sc.rotateZ(Math.PI); B.add(sc, { pos: [Math.cos(a) * R * 0.995, ry - 0.02, Math.sin(a) * R * 0.995], quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a - Math.PI / 2, 0)), color: k % 2 ? 'canvasBlue' : 'canvas' }); });
    B.add(torus(R, 0.08, 5, 48), { pos: [0, ry + 0.05, 0], rot: [Math.PI / 2, 0, 0], color: 'gold' });
    B.add(ell(0.3, 0.3, 0.3, 10, 8), { pos: [0, ry + Hr + 0.2, 0], color: 'gold' });
    B.add(cyl(0.05, 0.05, 1.0, 6), { pos: [0, ry + Hr + 0.75, 0], color: 'goldDeep' });
    const flag = new THREE.ConeGeometry(0.4, 1.6, 3); flag.rotateZ(-Math.PI / 2); flag.scale(1, 1, 0.12);
    B.add(flag, { pos: [0.8, y0 + 9.0, 0], color: 'canvasTeal', mesh: 'Flag', weights: (p) => { const t = Math.min(2.999, Math.max(0, p.x / 0.5)), i = Math.floor(t), f = t - i; return [[`Flag${i + 1}`, 1 - f], [`Flag${i + 2}`, f]]; } });
    // up-arrow sign hanging at the front
    hangingSign(B, [0, y0 + 4.1, -3.2], 2.2, 1.0, 'canvas', (S, c) => { S.add(cone(0.32, 0.4, 3), { pos: [c[0] - 0.65, c[1] + 0.12, c[2]], scale: [1, 1, 0.3], color: 'potionG' }); S.add(box(0.2, 0.35, 0.06), { pos: [c[0] - 0.65, c[1] - 0.2, c[2]], color: 'potionG' }); for (let k = 0; k < 3; k++) S.add(box(0.85, 0.09, 0.04), { pos: [c[0] + 0.3, c[1] + 0.22 - k * 0.22, c[2]], color: 'ink' }); });
    B.add(box(0.12, 0.12, 3.2), { pos: [0, y0 + 4.6, -1.6], color: 'woodDark' });
    lantern(B, [-0.15, y0 + 2.8, 0.25], -1, 0.9); lantern(B, [0.15, y0 + 2.8, -0.25], 1, 0.9);
    plant(B, [3.4, y0 - 0.12, -2.6], 0.9, 41, ['potionY', 'canvas']); plant(B, [-3.4, y0 - 0.12, -2.6], 0.9, 42, ['potionR', 'canvas']);
    barrel(B, [2.4, y0, 2.6], 0.85); crate(B, [-2.6, y0, 2.6], 0.8, 0.5);
  },
});

// ---------- Index Kiosk ----------
add({
  name: 'IndexKiosk',
  palette: pal(['wood', 'woodDark', 'woodLight', 'stone', 'stoneDark', 'stoneLight', 'gold', 'goldDeep', 'canvas', 'canvasPurple', 'canvasTeal', 'paper', 'ink', 'book', 'leafDark', 'leaf', 'leafLight', 'clay', 'eggCream', 'eggBlue', 'potionG', 'pinRed', 'metalDark']),
  glow: { HoverGem: '#9fe0ff', Rune: '#ffd36b', Lamp: '#ffd36b' }, heroSize: [700, 760],
  parts: { HoverGem: { pivot: [0, 7.2, -0.2] }, HoverRing: { pivot: [0, 7.2, -0.2] }, Rustle: { pivot: [0, 0.6, 0] } },
  build(B) {
    const y0 = base(B, 6.4, 6.4, { seed: 13, round: true });
    // stepped stone dais
    B.add(cyl(2.2, 2.4, 0.4, 10), { pos: [0, y0 + 0.2, 0], color: 'stone' }); B.add(cyl(1.7, 1.9, 0.35, 10), { pos: [0, y0 + 0.57, 0], color: 'stoneLight' });
    // lectern with a giant open book; runes glow on its pages
    const L = y0 + 0.75;
    B.add(cyl(0.45, 0.65, 2.0, 8), { pos: [0, L + 1.0, 0], color: 'woodDark' });
    for (const y of [0.25, 1.8]) B.add(cyl(0.6, 0.6, 0.12, 8), { pos: [0, L + y, 0], color: 'gold' });
    B.add(box(2.4, 0.2, 1.7), { pos: [0, L + 2.15, -0.05], rot: [-0.35, 0, 0], color: 'woodDark' });
    for (const s of [-1, 1]) {
      B.add(box(1.2, 0.12, 1.55), { pos: [s * 0.6, L + 2.32, -0.05], rot: [-0.35, 0, s * -0.12], color: 'book' });
      B.add(box(1.1, 0.12, 1.45), { pos: [s * 0.58, L + 2.42, -0.07], rot: [-0.35, 0, s * -0.12], color: 'paper' });
      for (let k = 0; k < 4; k++) B.add(box(0.7, 0.03, 0.08), { pos: [s * 0.6, L + 2.5 + k * 0.1, -0.5 + k * 0.28], rot: [-0.35, 0, s * -0.12], mesh: 'Rune' });
      B.add(new THREE.TorusGeometry(0.18, 0.025, 4, 12), { pos: [s * 0.62, L + 2.6, 0.32], rot: [Math.PI / 2 - 0.35, 0, 0], color: 'ink' });
    }
    B.add(box(0.1, 0.02, 1.0), { pos: [0.1, L + 2.48, 0.3], rot: [-0.35, 0, 0], color: 'pinRed' }); // ribbon bookmark
    // back screen: framed portrait panels (paw and egg icons) under a little shingle roof
    B.add(box(5.0, 3.4, 0.25), { pos: [0, y0 + 2.4, 2.0], color: 'canvasPurple' });
    B.add(box(5.3, 0.2, 0.4), { pos: [0, y0 + 0.75, 2.0], color: 'woodDark' });
    for (const x of [-2.6, 2.6]) post(B, x, 2.0, y0, 4.6, { band: 'gold' });
    for (let i = 0; i < 6; i++) {
      const x = -1.6 + (i % 3) * 1.6, y = y0 + 3.3 - Math.floor(i / 3) * 1.45;
      B.add(box(1.25, 1.15, 0.1), { pos: [x, y, 1.84], color: 'gold' }); B.add(box(1.05, 0.95, 0.1), { pos: [x, y, 1.8], color: ['canvasTeal', 'paper', 'eggBlue'][i % 3] });
      if (i % 2) { B.add(ell(0.2, 0.16, 0.05, 10, 6), { pos: [x, y - 0.12, 1.74], color: 'ink' }); for (let k = 0; k < 4; k++) B.add(ell(0.07, 0.08, 0.04, 6, 4), { pos: [x - 0.21 + k * 0.14, y + 0.13 + (k % 3 === 0 ? 0 : 0.06), 1.74], color: 'ink' }); }
      else B.add(eggGeo(10, 8), { pos: [x, y - 0.35, 1.74], scale: [0.28, 0.28, 0.06], color: i % 4 ? 'eggCream' : 'potionG' });
    }
    for (let k = 0; k < 6; k++) { const x = -2.75 + k * 1.1; B.add(box(1.2, 0.12, 1.4), { pos: [x, y0 + 4.85 - 0.0, 1.7], rot: [0.45, 0, 0], color: k % 2 ? 'woodDark' : 'wood' }); }
    B.add(box(5.6, 0.2, 0.25), { pos: [0, y0 + 5.15, 2.25], color: 'woodDark' });
    // hovering gem + tilted ring above the book
    into(B, 'HoverGem').add(crystal(0.42, 1.5), { pos: [0, y0 + 6.0, -0.2] });
    into(B, 'HoverGem').add(crystal(0.42, 0.7), { pos: [0, y0 + 6.05, -0.2], rot: [Math.PI, 0, 0] });
    B.add(torus(0.95, 0.06, 4, 28), { pos: [0, y0 + 6.7, -0.2], rot: [Math.PI / 2 - 0.35, 0, 0.2], color: 'gold', mesh: 'HoverRing' });
    // stacks of books, lanterns, plants
    for (const [x, z, n] of [[-1.7, -0.9, 4], [1.8, -0.7, 3]]) for (let k = 0; k < n; k++) B.add(box(0.8, 0.18, 0.6), { pos: [x, y0 + 0.84 + k * 0.18, z], rot: [0, k * 0.4, 0], color: ['book', 'canvasTeal', 'canvasPurple', 'goldDeep'][k % 4] });
    for (const x of [-2.6, 2.6]) lantern(B, [x, y0 + 3.6, 1.7], x < 0 ? -1 : 1);
    plant(B, [-2.7, y0 - 0.12, -1.9], 0.9, 51, ['eggCream', 'pinRed']); plant(B, [2.7, y0 - 0.12, -1.9], 0.9, 52, ['eggBlue', 'eggCream']);
  },
});

// ---------- Quest Board ----------
add({
  name: 'QuestBoard',
  palette: pal(['wood', 'woodDark', 'woodLight', 'stone', 'stoneDark', 'stoneLight', 'gold', 'goldDeep', 'paper', 'ink', 'cork', 'pinRed', 'pinBlue', 'canvasRed', 'leafDark', 'leaf', 'leafLight', 'clay', 'metalDark', 'straw']),
  glow: { HoverSignGlow: '#ffd36b', Lamp: '#ffd36b' }, heroSize: [700, 720],
  parts: { HoverSignGlow: { pivot: [0, 7.6, 0] }, Swing: { pivot: [1.6, 4.5, -0.32] }, Rustle: { pivot: [0, 0.6, 0] } },
  build(B) {
    const y0 = base(B, 7.2, 3.2, { seed: 15 });
    for (const x of [-2.9, 2.9]) post(B, x, 0, y0, 5.4);
    // framed cork board
    B.add(box(5.6, 3.7, 0.25), { pos: [0, y0 + 3.0, 0], color: 'woodDark' });
    B.add(box(5.2, 3.3, 0.1), { pos: [0, y0 + 3.0, -0.13], color: 'cork' });
    for (const [x, y, w, h] of [[0, 4.85, 5.8, 0.22], [0, 1.15, 5.8, 0.22]]) B.add(box(w, h, 0.32), { pos: [x, y0 + y, 0], color: 'wood' });
    B.add(box(5.7, 0.08, 0.06), { pos: [0, y0 + 1.27, -0.18], color: 'gold' });
    // shingled little roof
    for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) for (const s of [-1, 1]) B.add(box(0.72, 0.08, 0.5), { pos: [-2.9 + k * 0.72 + (r % 2) * 0.36 - 0.18, y0 + 5.15 + r * 0.24, s * (0.75 - r * 0.25)], rot: [s * 0.55, 0, 0], color: (k + r) % 3 ? 'canvasRed' : 'woodDark' });
    B.add(box(6.6, 0.16, 0.16), { pos: [0, y0 + 5.88, 0], color: 'woodDark' });
    // notes with pins and scribbles (one flutters: Swing)
    const notes = [[-1.7, 4.0, 0.08, 1.1, 1.2], [-0.2, 3.85, -0.05, 1.2, 1.0], [-1.9, 2.35, -0.07, 1.0, 1.1], [-0.4, 2.3, 0.06, 0.9, 1.2], [1.0, 2.5, -0.04, 1.0, 0.9]];
    notes.forEach(([x, y, a, w, h], i) => { B.add(box(w, h, 0.04), { pos: [x, y0 + y, -0.2], rot: [0, 0, a], color: 'paper' }); B.add(ell(0.08, 0.08, 0.06, 6, 4), { pos: [x, y0 + y + h / 2 - 0.12, -0.24], color: i % 2 ? 'pinBlue' : 'pinRed' }); for (let k = 0; k < 3; k++) B.add(box(w * 0.62, 0.05, 0.02), { pos: [x, y0 + y + 0.12 - k * 0.2, -0.23], rot: [0, 0, a], color: 'ink' }); });
    const SW = into(B, 'Swing');
    SW.add(box(1.0, 1.2, 0.04), { pos: [1.6, y0 + 3.4, -0.32], rot: [0, 0, -0.06], color: 'paper' });
    SW.add(ell(0.08, 0.08, 0.06, 6, 4), { pos: [1.6, y0 + 3.95, -0.36], color: 'pinRed' });
    SW.add(box(0.5, 0.5, 0.02), { pos: [1.6, y0 + 3.35, -0.35], color: 'goldDeep' }); // reward stamp
    // a red ribbon "featured" banner corner
    B.add(box(1.2, 0.25, 0.04), { pos: [2.3, y0 + 4.5, -0.2], rot: [0, 0, -0.7], color: 'canvasRed' });
    // hovering glowing "!" above the roof
    const HS = into(B, 'HoverSignGlow');
    HS.add(box(0.32, 0.95, 0.24), { pos: [0, y0 + 7.4, 0] }); HS.add(box(0.32, 0.3, 0.24), { pos: [0, y0 + 6.6, 0] });
    // scrolls in a bucket, crates, lanterns, plants
    B.add(lathe([[0.32, 0], [0.4, 0.6], [0.42, 0.62], [0.35, 0.62]], 12), { pos: [-3.3, y0, -1.0], color: 'wood' });
    for (let k = 0; k < 4; k++) { const a = k * 1.7; B.add(cyl(0.08, 0.08, 1.0, 8), { pos: [-3.3 + Math.cos(a) * 0.15, y0 + 0.8, -1.0 + Math.sin(a) * 0.15], rot: [Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25], color: 'paper' }); }
    crate(B, [3.2, y0, -0.9], 0.8, 0.3); crate(B, [3.25, y0 + 0.72, -0.9], 0.55, -0.4);
    for (const x of [-2.9, 2.9]) lantern(B, [x, y0 + 4.2, -0.32], x < 0 ? -1 : 1);
    plant(B, [-3.3, y0, 1.1], 0.85, 61, ['pinRed', 'paper']);
  },
});

export default list;
