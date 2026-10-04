// Premium icons for the shop, offers and game passes. Each is a small glossy 3D model with gold
// trim, gem accents and sparkle glints, rendered as a transparent still (assets/v2/icons/<Name>.png)
// and a transparent 4x4 spin sheet (assets/v2/icons/<Name>_spin.png) that Premium.spriteIcon plays
// in the UI. Designed to read at 64px: one bold silhouette, two or three colours, one glint.
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, crystal, flame, bolt, torus, surfaceQuat, rock } from '../lib.js';
import { coin, gem, slab, starPts, tilt, lathe, GOLD, GEM } from './icons3d.js';
import { eggGeo } from './eggs.js';

const list = [];
const add = (spec) => list.push({ category: 'Premium', v2: true, icon: true, iconSprite: true, whole: 'spinbob', heroSize: [512, 512], view: [-0.32, 0.22, -1], margin: 0.8, bg: '#1d1630', bloom: 0.5, ...spec });
const SPARK = { Glow: '#fff6c8' };
// four-point sparkle glint
function glint(B, p, s = 1) { B.add(new THREE.OctahedronGeometry(0.11 * s, 0), { pos: p, scale: [0.5, 2.2, 0.5], mesh: 'Glow' }); B.add(new THREE.OctahedronGeometry(0.11 * s, 0), { pos: p, scale: [2.2, 0.5, 0.5], mesh: 'Glow' }); }
function egg(B, p, s, color, extra = {}) { B.add(eggGeo(20, 14), { pos: p, scale: [s, s, s], color, ...extra }); }
// small faceted gem in any palette trio
const gemCols = (k) => [k, k + 'Deep', k + 'Light'];
const PAL = {
  ruby: [['ruby', '#ff3b55'], ['rubyDeep', '#b0182e'], ['rubyLight', '#ff9aaa']],
  sapph: [['sapph', '#3d8bff'], ['sapphDeep', '#1f4fb0'], ['sapphLight', '#9cc8ff']],
  emer: [['emer', '#2fd07a'], ['emerDeep', '#178a4a'], ['emerLight', '#9af0c0']],
  amber: [['amber', '#ff9a2a'], ['amberDeep', '#c25a10'], ['amberLight', '#ffd08a']],
  aqua: [['aqua', '#2fe0ff'], ['aquaDeep', '#1a8ab8'], ['aquaLight', '#b0f6ff']],
};

add({
  name: 'PassVIP', palette: [...GOLD, ...PAL.ruby, ['velvet', '#6a2aa8'], ['velvetDeep', '#40186e'], ['tassel', '#ffd84a']], glow: SPARK,
  build(B) {
    // velvet cushion with gold tassels, a big crown on top, ruby in front
    B.add(ell(1.15, 0.38, 1.15, 20, 10), { pos: [0, 0.4, 0], color: 'velvet' });
    B.add(torus(1.0, 0.09, 6, 28), { pos: [0, 0.42, 0], rot: [Math.PI / 2, 0, 0], color: 'goldDeep' });
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { B.add(ell(0.1, 0.1, 0.1, 6, 4), { pos: [x * 0.8, 0.42, z * 0.8], color: 'tassel' }); B.add(cone(0.08, 0.3, 6), { pos: [x * 0.85, 0.25, z * 0.85], rot: [Math.PI, 0, 0], color: 'tassel' }); }
    B.add(new THREE.CylinderGeometry(0.72, 0.66, 0.5, 24, 1, true), { pos: [0, 1.0, 0], color: 'gold' });
    B.add(new THREE.CylinderGeometry(0.64, 0.64, 0.3, 20), { pos: [0, 0.95, 0], color: 'velvetDeep' });
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + Math.PI / 2; B.add(cone(0.2, 0.7, 4), { pos: [Math.cos(a) * 0.68, 1.58, Math.sin(a) * 0.68], color: 'gold' }); B.add(ell(0.1, 0.1, 0.1, 8, 6), { pos: [Math.cos(a) * 0.68, 1.95, Math.sin(a) * 0.68], color: 'goldLight' }); }
    for (const y of [0.78, 1.22]) B.add(torus(0.71, 0.05, 6, 28), { pos: [0, y, 0], rot: [Math.PI / 2, 0, 0], color: 'goldDeep' });
    gem(B, [0, 0.92, -0.72], 0.32, gemCols('ruby'));
    glint(B, [0.75, 2.1, -0.4], 1.3); glint(B, [-0.9, 1.3, -0.5], 0.8);
  },
});
add({
  name: 'PassDoubleCoins', palette: [...GOLD, ['arrow', '#5fe05a'], ['arrowDeep', '#2f9a35']], glow: SPARK,
  build(B) {
    coin(B, [-0.35, 0.95, 0.2], 0.85, 'gold', 'goldDeep', 'goldLight', tilt(0.15, 0.5));
    coin(B, [0.4, 1.25, -0.25], 0.85, 'gold', 'goldDeep', 'goldLight', tilt(0.1, 0.25));
    // double up-chevron
    for (const y of [0.0, 0.5]) B.add(slab([[-0.5, 0], [0, 0.45], [0.5, 0], [0.5, -0.22], [0, 0.22], [-0.5, -0.22]], 0.22, 0.05), { pos: [1.05, 0.55 + y, -0.55], quat: tilt(0.1, 0.3), color: y ? 'arrow' : 'arrowDeep' });
    glint(B, [-0.9, 1.9, -0.4], 1.2);
  },
});
add({
  name: 'PassLucky', palette: [...GOLD, ['clover', '#4fd44a'], ['cloverDeep', '#2f8a35'], ['cloverLight', '#a8f08a']], glow: SPARK, glass: { Glass: '#e8fff0' },
  build(B) {
    // gold stand, glass orb, a four-leaf clover floating inside
    B.add(lathe([[0.75, 0], [0.7, 0.2], [0.35, 0.35], [0.4, 0.5], [0.0, 0.5]], 24), { color: 'goldDeep' });
    B.add(torus(0.42, 0.07, 6, 24), { pos: [0, 0.52, 0], rot: [Math.PI / 2, 0, 0], color: 'gold' });
    B.add(new THREE.SphereGeometry(0.85, 24, 16), { pos: [0, 1.35, 0], mesh: 'Glass' });
    const q = tilt(0.3, 0.4);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; for (const s of [-1, 1]) B.add(ell(0.22, 0.2, 0.07, 12, 6), { pos: V([Math.cos(a) * 0.3 + Math.cos(a + s * 0.8) * 0.08, Math.sin(a) * 0.3 + Math.sin(a + s * 0.8) * 0.08, 0]).applyQuaternion(q).add(V([0, 1.35, 0])).toArray(), quat: q, color: k % 2 ? 'clover' : 'cloverLight' }); }
    B.add(ell(0.08, 0.08, 0.08, 8, 6), { pos: [0, 1.35, 0], color: 'cloverDeep' });
    B.add(ell(0.16, 0.3, 0.05, 8, 5), { pos: [-0.42, 1.65, -0.62], rot: [0, 0.6, 0.4], mesh: 'Glow' });
    glint(B, [0.8, 2.2, -0.3], 1.2);
  },
});
add({
  name: 'PassFastHatch', palette: [['shell', '#fff2d8'], ['shellDeep', '#e8cfa0'], ['bolt', '#ffd84a'], ['boltDeep', '#e0a82a'], ['wing', '#ffffff'], ['wingDeep', '#cfe8ff']], glow: SPARK,
  build(B) {
    egg(B, [0, 0.15, 0], 0.68, 'shell');
    B.add(slab([[0.2, 1.1], [-0.55, -0.05], [-0.05, -0.05], [-0.3, -1.1], [0.55, 0.2], [0.05, 0.2], [0.35, 1.1]], 0.2, 0.06, 2), { pos: [0, 1.05, -0.62], scale: [0.7, 0.7, 1], quat: tilt(0.05, 0.1), color: 'bolt' });
    // speed wings
    for (const x of [-1, 1]) for (let k = 0; k < 3; k++) { const d = V([x, 0.4 - k * 0.25, 0.15]).normalize(); B.add(blade(0.75 - k * 0.12, 0.2, 0.04, 8), { pos: [0.62 * x, 1.05, 0.05], quat: surfaceQuat([0, 0.2, 1], d.toArray()), color: k % 2 ? 'wingDeep' : 'wing' }); }
    glint(B, [-0.7, 1.95, -0.5], 1.1);
  },
});
add({
  name: 'PassBossKey', palette: [...GOLD, ...PAL.amber, ...PAL.aqua, ['iron', '#4a4458']], glow: { Glow: '#fff6c8', Fire: '#ff8a2a', Tide: '#5fe8ff' },
  view: [-0.32, 0.5, -1],
  build(B) {
    const q = tilt(0, 0.25);
    // ornate bow: two rings holding a fire gem and a water gem
    for (const [x, c] of [[-0.95, 'amber'], [-0.45, 'aqua']]) {
      B.add(new THREE.TorusGeometry(0.33, 0.09, 8, 22), { pos: V([x, 1.25 + (x < -0.7 ? 0.0 : 0.0), 0]).applyQuaternion(q).toArray(), quat: q, color: 'gold' });
      B.add(new THREE.OctahedronGeometry(0.2, 0), { pos: V([x, 1.25, -0.02]).applyQuaternion(q).toArray(), quat: q, color: c });
      B.add(new THREE.OctahedronGeometry(0.1, 0), { pos: V([x, 1.25, -0.12]).applyQuaternion(q).toArray(), quat: q, mesh: c === 'amber' ? 'Fire' : 'Tide' });
    }
    B.add(new THREE.BoxGeometry(1.45, 0.18, 0.18), { pos: V([0.4, 1.25, 0]).applyQuaternion(q).toArray(), quat: q, color: 'goldDeep' });
    for (const [x, h] of [[1.0, 0.45], [0.72, 0.32], [0.48, 0.22]]) B.add(new THREE.BoxGeometry(0.15, h, 0.18), { pos: V([x, 1.25 - h / 2, 0]).applyQuaternion(q).toArray(), quat: q, color: 'gold' });
    B.add(flame(0.14, 0.5, { rings: 6, seg: 6 }), { pos: V([-0.95, 1.6, 0]).applyQuaternion(q).toArray(), mesh: 'Fire' });
    B.add(flame(0.12, 0.45, { rings: 6, seg: 6, twist: 0.5 }), { pos: V([-0.45, 1.6, 0]).applyQuaternion(q).toArray(), mesh: 'Tide' });
    glint(B, [0.9, 1.75, -0.3], 1.2);
  },
});
add({
  name: 'PassExtraCarry', palette: [['basket', '#c98a4a'], ['basketDeep', '#8a5a2a'], ['pyro', '#3a2a2a'], ['tide', '#1f6070'], ...GOLD, ['plus', '#5fe05a'], ['plusDeep', '#2f9a35']], glow: { Glow: '#fff6c8', Lava: '#ff6a1a', Tide: '#3fe6ff' },
  build(B) {
    // woven basket with three eggs (fire, water, gold) and a big +1
    B.add(lathe([[0.95, 0.0], [1.1, 0.55], [1.15, 0.7], [1.05, 0.72], [0.0, 0.72]], 20), { color: 'basket' });
    for (let k = 0; k < 3; k++) B.add(torus(0.98 + k * 0.06, 0.05, 4, 24), { pos: [0, 0.15 + k * 0.22, 0], rot: [Math.PI / 2, 0, 0], color: 'basketDeep' });
    egg(B, [-0.45, 0.5, 0.1], 0.38, 'pyro'); egg(B, [0.42, 0.5, 0.05], 0.38, 'tide'); egg(B, [0, 0.6, -0.35], 0.42, 'gold');
    B.add(loft({ points: [[-0.12, 0.85, -0.68], [-0.05, 1.05, -0.72], [0.05, 0.95, -0.7]], rx: () => 0.03, ry: () => 0.03, rings: 4, seg: 4 }), { mesh: 'Lava' });
    B.add(slab([[-0.1, -0.35], [0.1, -0.35], [0.1, -0.1], [0.35, -0.1], [0.35, 0.1], [0.1, 0.1], [0.1, 0.35], [-0.1, 0.35], [-0.1, 0.1], [-0.35, 0.1], [-0.35, -0.1], [-0.1, -0.1]], 0.16, 0.05), { pos: [0.9, 1.65, -0.5], quat: tilt(0.1, 0.3), color: 'plus' });
    glint(B, [-0.9, 1.7, -0.4], 1.0);
  },
});
add({
  name: 'PassMutation', palette: [['r1', '#ff5e5e'], ['r2', '#ffa64a'], ['r3', '#ffe14a'], ['r4', '#6fdc5a'], ['r5', '#4ab8ff'], ['r6', '#9a6aff'], ['base', '#2a2440'], ['baseLight', '#4a4070']], glow: { Glow: '#ffffff' },
  build(B) {
    // rainbow crystal cluster on a dark rock
    B.add(new THREE.CylinderGeometry(0.8, 0.95, 0.35, 8), { pos: [0, 0.18, 0], color: 'base' });
    B.add(new THREE.CylinderGeometry(0.7, 0.8, 0.06, 8), { pos: [0, 0.38, 0], color: 'baseLight' });
    const cols = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];
    B.add(crystal(0.32, 1.9), { pos: [0, 0.35, 0], color: 'r5' });
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.3; B.add(crystal(0.2, 1.0 + (k % 3) * 0.25), { pos: [Math.cos(a) * 0.45, 0.35, Math.sin(a) * 0.45], quat: quatTo([Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5]), color: cols[k] }); }
    glint(B, [0.15, 2.45, -0.2], 1.4); glint(B, [-0.75, 1.5, -0.4], 0.8); glint(B, [0.8, 1.2, -0.3], 0.7);
  },
});
add({
  name: 'PassTripleHatch', palette: [['shellA', '#ff9ec7'], ['shellB', '#7fd8ff'], ['shellC', '#ffe07a'], ...GOLD, ['nest', '#c98a4a'], ['nestDeep', '#8a5a2a']], glow: SPARK,
  build(B) {
    B.add(ell(1.35, 0.35, 0.95, 20, 8), { pos: [0, 0.3, 0], color: 'nest' });
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; B.add(loft({ points: [[Math.cos(a) * 1.2, 0.45, Math.sin(a) * 0.85], [Math.cos(a + 0.3) * 1.35, 0.55, Math.sin(a + 0.3) * 0.95], [Math.cos(a + 0.6) * 1.2, 0.5, Math.sin(a + 0.6) * 0.85]], rx: () => 0.05, ry: () => 0.05, rings: 4, seg: 4 }), { color: 'nestDeep' }); }
    egg(B, [-0.65, 0.4, 0.05], 0.42, 'shellA'); egg(B, [0.65, 0.4, 0.05], 0.42, 'shellB'); egg(B, [0, 0.45, -0.25], 0.5, 'shellC');
    B.add(torus(0.35, 0.05, 6, 20), { pos: [0, 1.95, -0.25], rot: [Math.PI / 2 - 0.4, 0, 0], color: 'gold' });
    glint(B, [0.9, 1.6, -0.4], 1.1);
  },
});
// gem tiers: pouch < pile < chest < vault (each clearly bigger and shinier than the last)
add({
  name: 'GemsPouch', palette: [...GEM, ['pouch', '#6a3ab8'], ['pouchDeep', '#40207a'], ...GOLD], glow: SPARK,
  build(B) {
    B.add(lathe([[0.0, 0.0], [0.7, 0.1], [0.85, 0.55], [0.6, 1.0], [0.3, 1.15], [0.4, 1.35], [0.0, 1.3]], 20), { color: 'pouch' });
    B.add(torus(0.3, 0.07, 6, 16), { pos: [0, 1.15, 0], rot: [Math.PI / 2, 0, 0], color: 'gold' });
    gem(B, [0.1, 1.4, -0.05], 0.35); gem(B, [0.75, 0.25, -0.5], 0.3);
    glint(B, [-0.6, 1.6, -0.4], 1.0);
  },
});
add({
  name: 'GemsPile', palette: [...GEM, ...PAL.sapph, ...PAL.ruby], glow: SPARK,
  build(B) {
    gem(B, [0, 1.0, 0], 0.9); gem(B, [0.85, 0.55, 0.15], 0.6, gemCols('sapph')); gem(B, [-0.85, 0.5, 0.1], 0.6, gemCols('ruby'));
    gem(B, [0.35, 0.35, -0.75], 0.45); gem(B, [-0.4, 0.35, -0.7], 0.4, gemCols('sapph'));
    glint(B, [0.6, 2.0, -0.4], 1.2); glint(B, [-1.0, 1.3, -0.3], 0.7);
  },
});
add({
  name: 'GemsChest', palette: [...GEM, ...PAL.ruby, ...PAL.emer, ['wood', '#7a4fd8'], ['woodDeep', '#4a2a90'], ...GOLD], glow: { Glow: '#fff1c8', Shine: '#e0c8ff' },
  build(B) {
    B.add(new THREE.BoxGeometry(1.7, 0.9, 1.1), { pos: [0, 0.45, 0], color: 'wood' });
    for (const x of [-0.75, 0.75]) B.add(new THREE.BoxGeometry(0.14, 0.95, 1.14), { pos: [x, 0.47, 0], color: 'gold' });
    // lid swung open behind
    const lid = new THREE.CylinderGeometry(0.55, 0.55, 1.7, 16, 1, false, 0, Math.PI); lid.rotateZ(Math.PI / 2);
    B.add(lid, { pos: [0, 1.25, 0.75], rot: [-1.1, 0, 0], color: 'woodDeep' });
    B.add(ell(0.75, 0.25, 0.48, 12, 6), { pos: [0, 0.92, 0], mesh: 'Shine' });
    for (const [x, y, z, s, c] of [[0, 1.15, 0, 0.45, 'gem'], [0.5, 1.05, -0.15, 0.35, 'ruby'], [-0.5, 1.05, -0.1, 0.35, 'emer'], [0.25, 1.0, -0.45, 0.28, 'gem'], [-0.3, 1.0, 0.3, 0.3, 'ruby']]) gem(B, [x, y, z], s, gemCols(c));
    B.add(new THREE.BoxGeometry(0.35, 0.4, 0.08), { pos: [0, 0.72, -0.58], color: 'goldDeep' });
    glint(B, [0.95, 1.9, -0.4], 1.3); glint(B, [-0.9, 1.6, -0.3], 0.9);
  },
});
add({
  name: 'GemsVault', palette: [...GEM, ...PAL.ruby, ...PAL.sapph, ...PAL.emer, ...GOLD, ['velvet', '#7a2a6a']], glow: { Glow: '#fff1c8', Shine: '#ffe8a0' },
  build(B) {
    // a gem mountain with a crown on top and coins around it
    B.add(new THREE.ConeGeometry(1.25, 1.1, 10), { pos: [0, 0.55, 0], color: 'gemDeep' });
    const cols = ['gem', 'ruby', 'sapph', 'emer'];
    for (let k = 0; k < 14; k++) { const a = k * 2.4, r = 0.25 + (k % 5) * 0.2, y = 1.0 - r * 0.75; gem(B, [Math.cos(a) * r, y, Math.sin(a) * r], 0.28 + (k % 3) * 0.06, gemCols(cols[k % 4])); }
    B.add(new THREE.CylinderGeometry(0.42, 0.38, 0.3, 20, 1, true), { pos: [0, 1.35, 0], color: 'gold' });
    B.add(new THREE.CylinderGeometry(0.38, 0.38, 0.2, 16), { pos: [0, 1.32, 0], color: 'velvet' });
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; B.add(cone(0.11, 0.38, 4), { pos: [Math.cos(a) * 0.4, 1.66, Math.sin(a) * 0.4], color: 'gold' }); B.add(ell(0.06, 0.06, 0.06, 6, 4), { pos: [Math.cos(a) * 0.4, 1.86, Math.sin(a) * 0.4], color: 'goldLight' }); }
    for (const [x, z, a] of [[1.1, -0.4, 0.4], [-1.15, -0.2, -0.3], [0.6, -1.0, 0.8]]) coin(B, [x, 0.25, z], 0.38, 'gold', 'goldDeep', 'goldLight', tilt(1.2, a));
    B.add(ell(1.3, 0.12, 1.3, 16, 3), { pos: [0, 0.03, 0], mesh: 'Shine' });
    glint(B, [0.8, 2.2, -0.4], 1.5); glint(B, [-1.0, 1.4, -0.3], 1.0); glint(B, [0.2, 0.9, -1.1], 0.8);
  },
});
add({
  name: 'OfferStarter', palette: [['box', '#ff5e8a'], ['boxDeep', '#c83a62'], ['ribbon', '#ffd84a'], ['ribbonDeep', '#e0a82a'], ['shell', '#9fe8ff'], ['spot', '#3fa8e8'], ...GOLD], glow: SPARK,
  build(B) {
    // open gift box with an egg peeking out and a gold star
    B.add(new THREE.BoxGeometry(1.4, 0.95, 1.4), { pos: [0, 0.48, 0], color: 'box' });
    for (const r of [0, Math.PI / 2]) B.add(new THREE.BoxGeometry(0.28, 0.97, 1.44), { pos: [0, 0.48, 0], rot: [0, r, 0], color: 'ribbon' });
    B.add(new THREE.BoxGeometry(1.55, 0.25, 1.55), { pos: [0.45, 1.2, 0.5], rot: [0.5, 0.3, -0.6], color: 'boxDeep' });
    egg(B, [0, 0.55, 0], 0.48, 'shell');
    for (let k = 0; k < 5; k++) { const a = k * 1.3; B.add(ell(0.08, 0.1, 0.03, 6, 4), { pos: [Math.cos(a) * 0.42, 1.0 + (k % 3) * 0.18, Math.sin(a) * 0.42 - 0.05], color: 'spot' }); }
    for (const x of [-1, 1]) B.add(new THREE.TorusGeometry(0.26, 0.09, 6, 14), { pos: [-0.5 + 0.22 * x, 1.05, -0.65], rot: [0, 0.3, x * 0.5], scale: [1, 1, 0.6], color: 'ribbonDeep' });
    B.add(slab(starPts(5, 0.42, 0.19), 0.12, 0.05), { pos: [0.85, 1.75, -0.4], quat: tilt(0.1, 0.3), color: 'gold' });
    glint(B, [-0.9, 1.8, -0.4], 1.1);
  },
});
add({
  name: 'OfferBoss', palette: [['pyro', '#2c2328'], ['pyroDeep', '#17121a'], ['tide', '#1f6070'], ['tideDeep', '#123e4c'], ...GOLD, ...PAL.ruby], glow: { Glow: '#fff1c8', Lava: '#ff6a1a', Tide: '#3fe6ff' },
  build(B) {
    // the two boss eggs leaning together under a crown
    egg(B, [-0.5, 0.0, 0.05], 0.55, 'pyro', { rot: [0, 0, 0.18] });
    egg(B, [0.5, 0.0, 0.05], 0.55, 'tide', { rot: [0, 0, -0.18] });
    for (let c = 0; c < 3; c++) B.add(loft({ points: [[-0.85 + c * 0.2, 0.35 + c * 0.2, -0.45], [-0.7 + c * 0.15, 0.6 + c * 0.2, -0.5], [-0.8 + c * 0.2, 0.85 + c * 0.2, -0.47]], rx: () => 0.035, ry: () => 0.035, rings: 5, seg: 4 }), { mesh: 'Lava' });
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; B.add(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 6), { pos: [0.5 + Math.cos(a) * 0.22, 0.75 + Math.sin(a) * 0.22, -0.52], rot: [Math.PI / 2, 0, 0], mesh: 'Tide' }); }
    B.add(new THREE.CylinderGeometry(0.5, 0.46, 0.32, 20, 1, true), { pos: [0, 1.75, 0], color: 'gold' });
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + Math.PI / 2; B.add(cone(0.13, 0.42, 4), { pos: [Math.cos(a) * 0.48, 2.1, Math.sin(a) * 0.48], color: 'gold' }); }
    gem(B, [0, 1.7, -0.5], 0.2, gemCols('ruby'));
    glint(B, [0.95, 2.1, -0.3], 1.3); glint(B, [-1.0, 1.5, -0.4], 0.9);
  },
});

export default list;
