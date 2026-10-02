// v2 gameplay-system props, picked from what egg/pet games need as they grow: zone gates,
// teleport portals, rebirth, leaderboards, daily rewards, a spin wheel, pet display
// pedestals, trading, potions, currency breakables, hoverboards, enchanting, egg capsules,
// spawn pads and VIP ropes. Every one has a moving part (Spin/Sway/Swing/Hover*/Float).
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, crystal, cyl, box, torus, flame, surfaceQuat, into, rock } from '../lib.js';
import { eggGeo } from './eggs.js';
import { canopy } from '../foliage.js';

const C = {
  stone: '#a8aaa2', stoneDark: '#74766e', stoneLight: '#c8cac2', wood: '#a8703f', woodDark: '#744828', woodLight: '#c99258',
  gold: '#f6c445', goldDeep: '#c27e1c', goldLight: '#ffe9a0', metal: '#9aa8bc', metalDark: '#5b6470', royal: '#5a3aa8', royalDeep: '#3a2470',
  red: '#e8473a', redDeep: '#a8302a', blue: '#3d6fc4', blueDeep: '#2a4f91', green: '#5fae45', greenDeep: '#3f8a35', white: '#fff6ea', ink: '#2a1a12',
  cloth: '#d9483b', clothDeep: '#a8302a', rope: '#e8c46a', velvet: '#8a2a5a', glassTint: '#dff4ff', leaf: '#4f9a3d', leafDark: '#357a2f', leafLight: '#74b84a', leafDeep: '#28552b', leafTip: '#98cf58',
  coin: '#f6c445', coinDeep: '#c27e1c', gem: '#8a5ae6', gemDeep: '#5a32b0', egg: '#f3e6c8', eggSpot: '#b98a5a', board: '#3a2a4a', boardLight: '#5a4a6a',
};
const pal = (keys) => keys.map((k) => [k, C[k]]);
const list = [];
const add = (spec) => list.push({ category: 'Systems', v2: true, heroSize: [620, 620], ...spec });
const around = (n, f) => { for (let k = 0; k < n; k++) f((k / n) * Math.PI * 2, k); };
const plinth = (B, r = 1.6, h = 0.5, c = 'stone', c2 = 'stoneDark') => { B.add(cyl(r, r * 1.08, h, 8), { pos: [0, h / 2, 0], color: c }); B.add(cyl(r * 0.9, r, 0.12, 8), { pos: [0, h + 0.06, 0], color: c2 }); };

add({
  name: 'ZoneGate', palette: pal(['stone', 'stoneDark', 'stoneLight', 'gold', 'goldDeep', 'ink', 'leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip']), glow: { Glow: '#66e8ff', HoverSignGlow: '#ffe07a' }, heroSize: [700, 640],
  parts: { HoverSignGlow: { pivot: [0, 6.6, -0.6] } },
  build(B) {
    for (const x of [-3, 3]) { B.add(box(1.1, 6, 1.1), { pos: [x, 3, 0], color: 'stone' }); B.add(box(1.4, 0.5, 1.4), { pos: [x, 0.25, 0], color: 'stoneDark' }); B.add(box(1.4, 0.4, 1.4), { pos: [x, 6.1, 0], color: 'stoneDark' }); B.add(crystal(0.25, 0.9), { pos: [x, 6.3, 0], mesh: 'Glow' }); }
    B.add(box(7.4, 0.8, 1.2), { pos: [0, 6.6, 0], color: 'stoneLight' });
    // shimmering barrier with rune bars (Glow pulses in game)
    B.add(box(4.9, 5.6, 0.08), { pos: [0, 3, 0], mesh: 'Glow' });
    around(6, (a, k) => B.add(box(0.06, 5.4, 0.12), { pos: [-2.1 + k * 0.84, 3, -0.05], color: 'gold' }));
    // floating price sign: lock + coin
    B.add(box(1.8, 0.9, 0.12), { pos: [0, 6.6, -0.7], mesh: 'HoverSignGlow' });
    canopy(B, { blobs: [[-3.3, 1.2, -0.5, 0.6], [3.2, 4.5, -0.5, 0.5], [-3.2, 5.6, -0.4, 0.5]], shades: ['leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip'], count: 110, size: [0.4, 0.24], seed: 701 });
  },
});
add({
  name: 'TeleportPortal', palette: pal(['stone', 'stoneDark', 'stoneLight', 'gold', 'goldDeep']), glow: { Glow: '#7fe0ff', GlowCore: '#e6ffff', PortalRing: '#b46bff' }, heroSize: [620, 680],
  parts: { PortalRing: { pivot: [0, 3.2, 0] } },
  build(B) {
    plinth(B, 2.2, 0.4);
    B.add(new THREE.TorusGeometry(2.3, 0.35, 10, 36), { pos: [0, 3.2, 0], color: 'stone' });
    around(12, (a) => B.add(box(0.5, 0.3, 0.8), { pos: [Math.cos(a) * 2.3, 3.2 + Math.sin(a) * 2.3, 0], rot: [0, 0, a], color: 'stoneDark' }));
    B.add(new THREE.CircleGeometry(2.0, 36), { pos: [0, 3.2, -0.02], mesh: 'Glow' });
    B.add(new THREE.CircleGeometry(2.0, 36), { pos: [0, 3.2, 0.02], rot: [0, Math.PI, 0], mesh: 'Glow' });
    B.add(new THREE.CircleGeometry(1.0, 24), { pos: [0, 3.2, -0.04], mesh: 'GlowCore' });
    // spinning outer ring with crystal nodes (spins around the portal axis)
    B.add(new THREE.TorusGeometry(2.85, 0.06, 6, 40), { pos: [0, 3.2, 0], mesh: 'PortalRing' });
    around(6, (a) => B.add(crystal(0.14, 0.55), { pos: [Math.cos(a) * 2.85, 3.2 + Math.sin(a) * 2.85, 0], quat: quatTo([Math.cos(a), Math.sin(a), 0]), mesh: 'PortalRing' }));
  },
});
add({
  name: 'RebirthShrine', palette: pal(['stone', 'stoneDark', 'stoneLight', 'gold', 'goldDeep', 'royal', 'royalDeep']), glow: { Glow: '#ff7ad9', GlowCore: '#ffe0f6', HoverOrb: '#ffb0ec' }, heroSize: [620, 680],
  parts: { HoverOrb: { pivot: [0, 4.2, 0] } },
  build(B) {
    for (let k = 0; k < 3; k++) B.add(cyl(2.4 - k * 0.5, 2.5 - k * 0.5, 0.35, 8), { pos: [0, 0.17 + k * 0.35, 0], color: k % 2 ? 'stoneDark' : 'stone' });
    around(4, (a) => { B.add(box(0.45, 3.0, 0.45), { pos: [Math.cos(a + 0.78) * 1.4, 2.55, Math.sin(a + 0.78) * 1.4], color: 'stoneLight' }); B.add(cone(0.35, 0.6, 4), { pos: [Math.cos(a + 0.78) * 1.4, 4.35, Math.sin(a + 0.78) * 1.4], rot: [0, Math.PI / 4, 0], color: 'gold' }); });
    B.add(new THREE.TorusGeometry(1.0, 0.06, 6, 32), { pos: [0, 1.07, 0], rot: [Math.PI / 2, 0, 0], mesh: 'Glow' });
    B.add(cyl(0.9, 0.9, 0.04, 24), { pos: [0, 1.06, 0], color: 'royal' });
    // floating rebirth orb with two crossed rings
    B.add(ell(0.55, 0.55, 0.55, 18, 12), { pos: [0, 4.2, 0], mesh: 'HoverOrb' });
    for (const r of [0.6, -0.6]) B.add(new THREE.TorusGeometry(0.85, 0.05, 6, 28), { pos: [0, 4.2, 0], rot: [Math.PI / 2 + r, 0, 0], mesh: 'HoverOrb' });
  },
});
add({
  name: 'LeaderboardStand', palette: pal(['wood', 'woodDark', 'woodLight', 'gold', 'goldDeep', 'board', 'boardLight', 'white']), glow: { HoverCrown: '#ffd84a' }, heroSize: [660, 640],
  parts: { HoverCrown: { pivot: [0, 6.6, 0] } },
  build(B) {
    for (const x of [-2.2, 2.2]) B.add(box(0.35, 6, 0.35), { pos: [x, 3, 0], color: 'woodDark' });
    B.add(box(4.6, 4.2, 0.25), { pos: [0, 3.5, 0], color: 'board' });
    B.add(box(4.8, 0.3, 0.4), { pos: [0, 5.7, 0], color: 'gold' }); B.add(box(4.8, 0.3, 0.4), { pos: [0, 1.3, 0], color: 'goldDeep' });
    for (let r = 0; r < 6; r++) { B.add(box(3.9, 0.45, 0.05), { pos: [0, 5.05 - r * 0.62, -0.14], color: r < 3 ? ['gold', 'woodLight', 'goldDeep'][r] : 'boardLight' }); B.add(box(0.4, 0.4, 0.05), { pos: [-1.6, 5.05 - r * 0.62, -0.17], color: 'white' }); }
    // floating crown for #1
    B.add(new THREE.CylinderGeometry(0.45, 0.42, 0.3, 16, 1, true), { pos: [0, 6.6, 0], mesh: 'HoverCrown' });
    around(5, (a) => B.add(cone(0.12, 0.4, 4), { pos: [Math.cos(a) * 0.43, 6.95, Math.sin(a) * 0.43], mesh: 'HoverCrown' }));
  },
});
add({
  name: 'DailyChest', palette: pal(['wood', 'woodDark', 'woodLight', 'gold', 'goldDeep', 'stone', 'stoneDark', 'red']), glow: { Glow: '#ffe07a', HoverGift: '#ff9ec7' }, heroSize: [560, 600],
  parts: { Swing: { pivot: [0, 1.45, 0.75] }, HoverGift: { pivot: [0, 2.8, 0] } },
  build(B) {
    plinth(B, 1.5, 0.35);
    B.add(box(2.4, 1.0, 1.5), { pos: [0, 0.95, 0], color: 'wood' });
    for (const x of [-1.05, 1.05]) B.add(box(0.18, 1.05, 1.55), { pos: [x, 0.97, 0], color: 'gold' });
    const lid = new THREE.CylinderGeometry(0.75, 0.75, 2.4, 16, 1, false, 0, Math.PI); lid.rotateZ(Math.PI / 2);
    into(B, 'Swing').add(lid, { pos: [0, 1.45, 0], color: 'woodLight' });
    B.add(ell(1.0, 0.18, 0.55, 12, 5), { pos: [0, 1.45, 0], mesh: 'Glow' });
    // floating gift + day counter ring
    B.add(box(0.6, 0.55, 0.6), { pos: [0, 2.8, 0], mesh: 'HoverGift' });
    B.add(new THREE.TorusGeometry(0.62, 0.04, 6, 24), { pos: [0, 2.8, 0], rot: [Math.PI / 2, 0, 0], mesh: 'HoverGift' });
  },
});
add({
  name: 'SpinWheel', palette: pal(['wood', 'woodDark', 'gold', 'goldDeep', 'red', 'blue', 'green', 'royal', 'white']), glow: { Glow: '#fff1a0' }, heroSize: [620, 680],
  parts: { Wheel: { pivot: [0, 3.6, -0.3] } },
  build(B) {
    for (const x of [-1, 1]) B.add(box(0.35, 3.8, 0.35), { pos: [x * 1.2, 1.8, 0.1], rot: [0, 0, x * 0.2], color: 'woodDark' });
    B.add(box(3.4, 0.4, 1.4), { pos: [0, 0.2, 0], color: 'wood' });
    const W = into(B, 'Wheel');
    const cols = ['red', 'gold', 'blue', 'green', 'royal', 'white', 'red', 'gold'];
    cols.forEach((c, k) => { const g = new THREE.CylinderGeometry(2.2, 2.2, 0.2, 6, 1, false, (k / 8) * Math.PI * 2, Math.PI * 2 / 8); g.rotateX(Math.PI / 2); W.add(g, { pos: [0, 3.6, -0.3], color: c }); });
    W.add(new THREE.TorusGeometry(2.25, 0.12, 6, 40), { pos: [0, 3.6, -0.3], color: 'goldDeep' });
    around(8, (a) => W.add(ell(0.1, 0.1, 0.1, 6, 4), { pos: [Math.cos(a) * 2.25, 3.6 + Math.sin(a) * 2.25, -0.42], color: 'gold' }));
    W.add(cyl(0.35, 0.35, 0.4), { pos: [0, 3.6, -0.4], rot: [Math.PI / 2, 0, 0], color: 'gold' });
    B.add(cone(0.25, 0.6, 3), { pos: [0, 6.0, -0.45], rot: [Math.PI, 0, 0], mesh: 'Glow' });
  },
});
add({
  name: 'PetPedestal', palette: pal(['stone', 'stoneDark', 'stoneLight', 'gold', 'goldDeep', 'velvet']), glow: { Glow: '#7fe0ff', HoverRing: '#ffd84a' }, heroSize: [560, 560],
  parts: { HoverRing: { pivot: [0, 1.8, 0] } },
  build(B) {
    B.add(cyl(1.3, 1.5, 0.3, 12), { pos: [0, 0.15, 0], color: 'stoneDark' });
    B.add(cyl(0.9, 1.1, 1.0, 12), { pos: [0, 0.8, 0], color: 'stone' });
    B.add(cyl(1.25, 1.1, 0.25, 12), { pos: [0, 1.42, 0], color: 'gold' });
    B.add(cyl(1.15, 1.15, 0.05, 24), { pos: [0, 1.56, 0], color: 'velvet' });
    B.add(new THREE.TorusGeometry(1.0, 0.05, 6, 32), { pos: [0, 1.56, 0], rot: [Math.PI / 2, 0, 0], mesh: 'Glow' });
    B.add(new THREE.TorusGeometry(1.35, 0.05, 6, 36), { pos: [0, 1.8, 0], rot: [Math.PI / 2, 0, 0], mesh: 'HoverRing' });
    around(4, (a) => B.add(new THREE.OctahedronGeometry(0.12, 0), { pos: [Math.cos(a) * 1.35, 1.8, Math.sin(a) * 1.35], scale: [1, 1.6, 1], mesh: 'HoverRing' }));
  },
});
add({
  name: 'TradingBooth', palette: pal(['wood', 'woodDark', 'woodLight', 'cloth', 'clothDeep', 'gold', 'white', 'blue']), heroSize: [700, 620],
  bones: [['Flag1', null, [-2.5, 4.6, 0]], ['Flag2', 'Flag1', [-1.85, 4.6, 0]], ['Flag3', 'Flag2', [-1.2, 4.6, 0]], ['Flag4', 'Flag3', [-0.55, 4.6, 0]]], skinned: ['Flag'],
  build(B) {
    B.add(box(5, 1.1, 1.4), { pos: [0, 0.55, 0], color: 'wood' }); B.add(box(5.2, 0.15, 1.6), { pos: [0, 1.15, 0], color: 'woodLight' });
    B.add(box(0.12, 1.0, 1.3), { pos: [0, 0.55, -0.01], color: 'gold' });
    for (const x of [-2.5, 2.5]) B.add(box(0.2, 3.4, 0.2), { pos: [x, 2.85, 0.6], color: 'woodDark' });
    for (let k = 0; k < 8; k++) B.add(box(5.4 / 8, 0.12, 1.8), { pos: [-2.7 + (k + 0.5) * (5.4 / 8), 4.5, 0], rot: [0.25, 0, 0], color: k % 2 ? 'white' : 'blue' });
    // arrows sign (two-way trade)
    for (const s of [-1, 1]) B.add(cone(0.25, 0.5, 3), { pos: [s * 0.5, 2.2, -0.75], rot: [0, 0, -s * Math.PI / 2], color: 'gold' });
    flagClothSimple(B);
  },
});
function flagClothSimple(B) {
  // bunting flags strung across the top, skinned to the Flag bones so they wave
  const n = 5;
  for (let k = 0; k < n; k++) { const x = -2.4 + k * 0.5, g = new THREE.ConeGeometry(0.2, 0.45, 3); g.rotateX(Math.PI); B.add(g, { pos: [x, 4.3, -0.85], mesh: 'Flag', color: k % 2 ? 'cloth' : 'gold', weights: () => [[`Flag${Math.min(4, 1 + Math.floor(k * 0.8))}`, 1]] }); }
}
add({
  name: 'PotionShelf', palette: pal(['wood', 'woodDark', 'woodLight', 'gold', 'cloth']), glow: { PotionR: '#ff4f5a', PotionG: '#5fdc5a', PotionB: '#3fb8ff', PotionY: '#ffc83a' }, glass: { Glass: '#dff4ff' }, heroSize: [620, 620],
  parts: { Swing: { pivot: [0, 4.5, -0.3] } },
  build(B) {
    for (const x of [-1.8, 1.8]) B.add(box(0.2, 4, 0.9), { pos: [x, 2, 0], color: 'woodDark' });
    for (const y of [0.3, 1.5, 2.7]) B.add(box(3.8, 0.15, 0.9), { pos: [0, y, 0], color: 'wood' });
    const P = ['PotionR', 'PotionG', 'PotionB', 'PotionY'];
    for (const [y, row] of [[0.38, 0], [1.58, 1], [2.78, 2]]) for (let k = 0; k < 4; k++) { const x = -1.3 + k * 0.85; B.add(new THREE.LatheGeometry([[0, 0], [0.22, 0.03], [0.28, 0.25], [0.12, 0.5], [0.1, 0.62], [0, 0.62]].map(([r, h]) => new THREE.Vector2(r, h)), 12), { pos: [x, y, 0], mesh: 'Glass' }); B.add(new THREE.LatheGeometry([[0, 0.04], [0.2, 0.06], [0.24, 0.24], [0, 0.32]].map(([r, h]) => new THREE.Vector2(r, h)), 12), { pos: [x, y, 0], mesh: P[(k + row) % 4] }); B.add(cyl(0.08, 0.08, 0.1), { pos: [x, y + 0.66, 0], color: 'woodLight' }); }
    into(B, 'Swing').add(box(2.2, 0.7, 0.1), { pos: [0, 4.2, -0.3], color: 'cloth' });
    B.add(cyl(0.02, 0.02, 0.5), { pos: [-0.8, 4.4, -0.3], color: 'gold' }); B.add(cyl(0.02, 0.02, 0.5), { pos: [0.8, 4.4, -0.3], color: 'gold' });
  },
});
for (const [name, kind] of [['BreakableCoins', 'coins'], ['BreakableGems', 'gems'], ['BreakableChest', 'chest']]) {
  add({
    name, palette: pal(['coin', 'coinDeep', 'gem', 'gemDeep', 'wood', 'woodDark', 'gold', 'stone', 'stoneDark']), glow: { HoverGlint: '#fff1a0' }, heroSize: [520, 520],
    parts: { HoverGlint: { pivot: [0, 1.6, 0] } },
    build(B) {
      if (kind === 'coins') { for (let k = 0; k < 18; k++) { const a = k * 2.4, d = 0.15 + (k % 6) * 0.15, y = 0.12 + Math.floor(k / 6) * 0.22; const g = cyl(0.32, 0.32, 0.08); B.add(g, { pos: [Math.cos(a) * d, y, Math.sin(a) * d], rot: [0.2 * Math.sin(k), 0, 0.2 * Math.cos(k)], color: k % 3 ? 'coin' : 'coinDeep' }); } }
      if (kind === 'gems') { B.add(rock(0.9, 77, 0.5, 1), { pos: [0, 0.3, 0], color: 'stoneDark' }); around(5, (a, k) => B.add(crystal(0.2 + (k % 2) * 0.08, 0.8 + (k % 3) * 0.25), { pos: [Math.cos(a) * 0.35, 0.4, Math.sin(a) * 0.35], quat: quatTo([Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5]), color: k % 2 ? 'gem' : 'gemDeep' })); }
      if (kind === 'chest') { B.add(box(1.4, 0.8, 0.9), { pos: [0, 0.4, 0], color: 'wood' }); const lid = new THREE.CylinderGeometry(0.45, 0.45, 1.4, 12, 1, false, 0, Math.PI); lid.rotateZ(Math.PI / 2); B.add(lid, { pos: [0, 0.8, 0], color: 'woodDark' }); for (const x of [-0.55, 0.55]) B.add(box(0.12, 0.85, 0.95), { pos: [x, 0.42, 0], color: 'gold' }); }
      around(3, (a) => B.add(new THREE.OctahedronGeometry(0.12, 0), { pos: [Math.cos(a) * 0.8, 1.6, Math.sin(a) * 0.8], scale: [1, 2, 1], mesh: 'HoverGlint' }));
    },
  });
}
add({
  name: 'Hoverboard', palette: pal(['blue', 'blueDeep', 'white', 'gold', 'metalDark']), glow: { Glow: '#7fe0ff' }, heroSize: [620, 460], whole: 'spinbob',
  build(B) {
    const deck = new THREE.CylinderGeometry(1, 1, 0.16, 24); deck.scale(2.0, 1, 0.75); B.add(deck, { pos: [0, 0.8, 0], color: 'blue' });
    const top = new THREE.CylinderGeometry(0.92, 0.92, 0.04, 24); top.scale(2.0, 1, 0.7); B.add(top, { pos: [0, 0.9, 0], color: 'white' });
    B.add(box(2.6, 0.05, 0.12), { pos: [0, 0.93, 0], color: 'gold' });
    for (const x of [-1.2, 1.2]) { B.add(cyl(0.35, 0.28, 0.25, 16), { pos: [x, 0.62, 0], color: 'metalDark' }); B.add(cyl(0.3, 0.3, 0.04, 16), { pos: [x, 0.48, 0], mesh: 'Glow' }); }
  },
});
add({
  name: 'EnchantAltar', palette: pal(['stone', 'stoneDark', 'stoneLight', 'royal', 'royalDeep', 'gold', 'white']), glow: { Glow: '#b46bff', GlowCore: '#f0d2ff', HoverBook: '#c88aff' }, heroSize: [600, 620],
  parts: { HoverBook: { pivot: [0, 2.6, 0] } },
  build(B) {
    B.add(cyl(1.4, 1.6, 0.4, 8), { pos: [0, 0.2, 0], color: 'stoneDark' });
    B.add(cyl(0.6, 0.8, 1.4, 8), { pos: [0, 1.1, 0], color: 'stone' });
    B.add(box(1.6, 0.25, 1.2), { pos: [0, 1.9, 0], color: 'royal' });
    around(8, (a) => B.add(blade(0.35, 0.1, 0.04), { pos: [Math.cos(a) * 1.5, 0.42, Math.sin(a) * 1.5], quat: surfaceQuat([0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]), mesh: 'Glow' }));
    // floating open book with a glowing page and orbiting runes
    for (const s of [-1, 1]) B.add(box(0.7, 0.05, 0.9), { pos: [s * 0.36, 2.6, 0], rot: [0, 0, -s * 0.2], mesh: 'HoverBook' });
    around(4, (a) => B.add(blade(0.25, 0.1, 0.03), { pos: [Math.cos(a) * 0.9, 2.9, Math.sin(a) * 0.9], quat: surfaceQuat([Math.cos(a), 0, Math.sin(a)], [0, 1, 0]), mesh: 'HoverBook' }));
  },
});
add({
  name: 'EggCapsule', palette: pal(['metal', 'metalDark', 'gold', 'goldDeep', 'egg', 'eggSpot']), glow: { Glow: '#7fe0ff' }, glass: { Glass: '#dff4ff' }, heroSize: [520, 640],
  parts: { HoverEgg: { pivot: [0, 1.9, 0] } },
  build(B) {
    B.add(cyl(1.0, 1.2, 0.5, 16), { pos: [0, 0.25, 0], color: 'metalDark' }); B.add(cyl(1.05, 1.05, 0.1, 24), { pos: [0, 0.55, 0], color: 'gold' });
    B.add(new THREE.TorusGeometry(0.95, 0.04, 6, 32), { pos: [0, 0.62, 0], rot: [Math.PI / 2, 0, 0], mesh: 'Glow' });
    B.add(new THREE.SphereGeometry(1.0, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), { pos: [0, 1.6, 0], mesh: 'Glass' });
    B.add(cyl(1.0, 1.0, 1.0, 24, 1), { pos: [0, 1.1, 0], mesh: 'Glass' });
    B.add(cyl(0.2, 0.25, 0.25, 12), { pos: [0, 2.7, 0], color: 'gold' });
    into(B, 'HoverEgg').add(eggGeo(18, 14), { pos: [0, 1.0, 0], scale: [0.4, 0.4, 0.4], color: 'egg' });
  },
});
add({
  name: 'SpawnPad', palette: pal(['stone', 'stoneDark', 'stoneLight', 'gold', 'white']), glow: { Glow: '#66e8ff', HoverRune: '#b9f6ff' }, heroSize: [600, 480],
  parts: { HoverRune: { pivot: [0, 0.6, 0] } },
  build(B) {
    B.add(cyl(3.0, 3.2, 0.4, 8), { pos: [0, 0.2, 0], color: 'stoneDark' }); B.add(cyl(2.6, 2.6, 0.08, 32), { pos: [0, 0.44, 0], color: 'stoneLight' });
    for (const r of [2.3, 1.4]) B.add(new THREE.TorusGeometry(r, 0.05, 6, 40), { pos: [0, 0.47, 0], rot: [Math.PI / 2, 0, 0], mesh: 'Glow' });
    around(8, (a) => B.add(blade(0.45, 0.14, 0.04), { pos: [Math.cos(a) * 1.85, 0.6, Math.sin(a) * 1.85], quat: surfaceQuat([0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]), mesh: 'HoverRune' }));
  },
});
add({
  name: 'VIPRope', palette: pal(['gold', 'goldDeep', 'velvet', 'red', 'redDeep']), heroSize: [660, 440],
  parts: { Swing: { pivot: [0, 1.6, 0] } },
  build(B) {
    for (const x of [-2, 2]) { B.add(cyl(0.45, 0.55, 0.12, 16), { pos: [x, 0.06, 0], color: 'goldDeep' }); B.add(cyl(0.08, 0.1, 1.6, 10), { pos: [x, 0.85, 0], color: 'gold' }); B.add(ell(0.16, 0.16, 0.16, 10, 8), { pos: [x, 1.7, 0], color: 'gold' }); }
    into(B, 'Swing').add(loft({ points: [[-1.9, 1.6, 0], [-1.0, 1.15, 0], [0, 1.0, 0], [1.0, 1.15, 0], [1.9, 1.6, 0]], rx: () => 0.07, ry: () => 0.07, rings: 20, seg: 8 }), { color: 'velvet' });
  },
});

export default list;
