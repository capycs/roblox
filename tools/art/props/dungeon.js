// Boss-run dungeon props. 1 unit = 1 stud. Every lair shares the same layout (LAIR): the boss
// stands in the middle and never moves, its egg nest sits behind it, the exit portal sits in the
// gate in front of it.
//   Fire:  PyroLair (volcanic arena), EggPyrothrax, PyroGate (lobby entrance)
//   Water: TideLair (sunken temple, giant clam nest), EggThalassor, TideGate (lobby entrance)
// Layout numbers (arena radius, nest, egg spots, exit, spawn) are mirrored in
// src/shared/Dungeon/DungeonConfig.luau; change both together.
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, cyl, box, torus, flame, rock, crystal, surfaceQuat, into } from '../lib.js';
import { eggGeo, onShell, band } from './eggs.js';

export const LAIR = { R: 50, floorR: 58, nest: [0, 0, 30], eggs: [[-3.2, 0.7, 29], [3.2, 0.7, 29.6], [0, 0.7, 33.2]], exit: [0, 0, -46], spawn: [0, 0, -40], gate: 0.2 };

const C = {
  basalt: '#3a3036', basaltDark: '#251e24', basaltLight: '#544650', slab: '#463a42', slabLight: '#5e4e58', obsidian: '#2c2328', obsidianDeep: '#17121a',
  rock: '#4a3a3a', rockDark: '#2e2426', rockLight: '#6a5450', ash: '#7a6a66', bone: '#ead8b2', boneDeep: '#a8946a', iron: '#3a3a44', ironLight: '#5a5a66',
  gold: '#f6c445', goldDeep: '#c27e1c', ember: '#7a2a1e', emberDeep: '#4e1812',
  // water
  sand: '#d9c69a', sandDark: '#b8a274', stoneT: '#7e9a9a', stoneTDark: '#56706f', stoneTLight: '#a3bcb8', moss: '#5f8f5a', pool: '#1d5a6a',
  reef: '#ff7d6b', reefDeep: '#d4504a', reefY: '#ffc65a', kelp: '#3d8f4c', kelpDark: '#2a6a3a', shellPink: '#ffc9b5', shellPinkDeep: '#e89a86',
  pearl: '#f4f0ff', teal: '#1f6070', tealDeep: '#123e4c', tealLight: '#2f8a9c',
};
const pal = (keys) => keys.map((k) => [k, C[k]]);
const around = (n, f) => { for (let k = 0; k < n; k++) f((k / n) * Math.PI * 2, k); };
// polar helper: angle 0 points at -Z (the gate), increasing clockwise seen from above
const at = (a, r, y = 0) => [Math.sin(a) * r, y, -Math.cos(a) * r];
let seed = 1;
const jag = (B, pts, mesh, r = 0.35) => B.add(loft({ points: pts, rx: () => r, ry: () => r * 0.4, rings: pts.length * 2, seg: 4 }), { mesh });

// a curved horn from base to tip (gate arches)
function horn(B, base, mid, tip, r0, color) {
  B.add(loft({ points: [base, mid, tip], rx: (t) => r0 * (1 - 0.85 * t) + 0.08, ry: (t) => r0 * (1 - 0.85 * t) + 0.08, rings: 22, seg: 9 }), { color });
  for (let k = 1; k < 6; k++) { const t = k / 6, p = V(base).lerp(V(mid), t * 2 > 1 ? 1 : t * 2).lerp(V(tip), Math.max(0, t * 2 - 1)); B.add(torus(r0 * (1 - 0.85 * t) + 0.12, 0.1, 4, 14), { pos: p.toArray(), rot: [Math.PI / 2, 0, 0], color: 'boneDeep' }); }
}
function brazier(B, p, s = 1) {
  B.add(cyl(0.5 * s, 0.7 * s, 1.6 * s, 8), { pos: [p[0], p[1] + 0.8 * s, p[2]], color: 'iron' });
  B.add(cyl(1.3 * s, 0.6 * s, 0.9 * s, 10), { pos: [p[0], p[1] + 2.0 * s, p[2]], color: 'ironLight' });
  B.add(torus(1.3 * s, 0.12 * s, 4, 16), { pos: [p[0], p[1] + 2.45 * s, p[2]], rot: [Math.PI / 2, 0, 0], color: 'iron' });
  B.add(ell(1.05 * s, 0.25 * s, 1.05 * s, 10, 4), { pos: [p[0], p[1] + 2.4 * s, p[2]], mesh: 'GlowCore' });
  around(3, (a) => B.add(flame(0.45 * s, 1.9 * s, { rings: 8, seg: 8 }), { pos: [p[0] + Math.cos(a) * 0.35 * s, p[1] + 2.4 * s, p[2] + Math.sin(a) * 0.35 * s], mesh: 'Flame' }));
}

const lair = {
  name: 'PyroLair', category: 'Dungeon', v2: true, heroSize: [1200, 900], view: [0.15, 1.05, -1.0], bg: '#160c0e', margin: 0.9, bloom: 0.55,
  palette: pal(['basalt', 'basaltDark', 'basaltLight', 'slab', 'slabLight', 'obsidian', 'obsidianDeep', 'rock', 'rockDark', 'rockLight', 'ash', 'bone', 'boneDeep', 'iron', 'ironLight', 'gold', 'goldDeep', 'ember', 'emberDeep']),
  glow: { Magma: '#ff6a1a', GlowCore: '#ffd36b', Flame: '#ff8a2a', PortalRing: '#ff9a3a' },
  // Floor is its own mesh (a flat disc) so it can keep collision; DungeonService turns collision
  // off on every other mesh and builds an invisible wall ring instead (mesh hulls would fill
  // the arena).
  parts: { Floor: { pivot: [0, 0, 0] }, PortalRing: { pivot: [LAIR.exit[0], 6.5, -LAIR.R - 1.2] } },
  build(B) {
    const { R, floorR } = LAIR;
    // ---- floor: basalt disc with flagstone bands and magma cracks
    B.add(cyl(floorR, floorR + 1.5, 2.4, 64), { pos: [0, -1.2, 0], color: 'basaltDark', mesh: 'Floor' });
    for (const [r0, r1, n, c] of [[6, 13, 14, 'slab'], [15, 26, 26, 'slabLight'], [28, 39, 36, 'slab'], [41, R - 0.5, 44, 'slabLight']]) {
      around(n, (a, k) => {
        if (r1 > 40 && Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.06) return;
        const mid = (r0 + r1) / 2, len = r1 - r0 - 0.5, wid = (2 * Math.PI * mid) / n - 0.45;
        B.add(box(wid, 0.16 + (k % 3) * 0.03, len), { pos: at(a + (k % 2) * 0.004, mid, 0.05), rot: [0, -a, 0], color: (k * 7) % 5 < 2 ? c : (k % 3 ? 'basalt' : 'basaltLight') });
      });
    }
    B.add(cyl(5.6, 5.8, 0.2, 24), { pos: [0, 0.08, 0], color: 'obsidian' });
    // magma: a broken ring round the boss, eight jagged cracks out to the wall, glowing seams
    for (const [r, w] of [[14, 0.45], [27, 0.3], [40, 0.3]]) for (let s = 0; s < 6; s++) {
      const a0 = s * (Math.PI / 3) + 0.12, pts = []; for (let i = 0; i <= 8; i++) { const a = a0 + (i / 8) * 0.85; pts.push(at(a, r + (i % 2 ? 0.35 : -0.3), 0.12)); }
      jag(B, pts, 'Magma', w);
    }
    for (let c = 0; c < 8; c++) {
      const a0 = (c / 8) * Math.PI * 2 + Math.PI / 8, pts = []; for (let i = 0; i <= 10; i++) { const r = 15 + i * 3.4, a = a0 + Math.sin(i * 1.7 + c) * 0.035; pts.push(at(a, r, 0.12)); }
      jag(B, pts, 'Magma', 0.32);
    }
    // ---- wall: jagged rock cliffs on a ring, open at the gate
    const segs = 48;
    for (let k = 0; k < segs; k++) {
      const a = (k / segs) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < LAIR.gate + 0.06) continue;
      const r = R + 6.5 + (k % 3) * 0.8, s = 1 + ((k * 5) % 7) * 0.06;
      B.add(rock(4.6 * s, 300 + k, 2.4, 1), { pos: at(a, r, 7.5 * s), rot: [0, -a + (k % 2) * 0.4, 0], color: k % 3 ? 'rock' : 'rockDark' });
      B.add(rock(3.4, 360 + k, 1.6, 0), { pos: at(a + 0.04, r + 1.5, 15.5 + (k % 4)), rot: [0, -a, 0.2], color: k % 2 ? 'rockDark' : 'basalt' });
      // overhanging teeth on top pointing into the arena
      if (k % 2 === 0) B.add(cone(1.1, 6 + (k % 3) * 1.5, 5), { pos: at(a, R + 3, 18 + (k % 3)), quat: quatTo([-Math.sin(a) * 0.9, 0.35, Math.cos(a) * 0.9]), color: 'obsidian' });
      // stalagmites along the foot of the wall
      if (k % 3 !== 1) B.add(cone(0.9 + (k % 2) * 0.4, 3 + (k % 4) * 1.1, 6), { pos: at(a + 0.03, R + 2.6, 1.5 + (k % 4) * 0.5), color: 'basalt' });
    }
    // lavafalls pouring down the wall into pools
    for (const a of [Math.PI * 0.5, Math.PI * 0.82, Math.PI * 1.18, Math.PI * 1.5]) {
      B.add(box(3.2, 20, 0.5), { pos: at(a, R + 2.2, 10), rot: [0, -a, 0], mesh: 'Magma' });
      B.add(box(1.4, 20, 0.6), { pos: at(a, R + 2.0, 10), rot: [0, -a, 0], mesh: 'GlowCore' });
      B.add(ell(4.5, 0.2, 2.4, 14, 4), { pos: at(a, R + 0.4, 0.15), rot: [0, -a, 0], mesh: 'Magma' });
      B.add(ell(2.4, 0.22, 1.2, 10, 4), { pos: at(a, R + 0.6, 0.2), rot: [0, -a, 0], mesh: 'GlowCore' });
      for (const d of [-1, 1]) B.add(rock(1.4, 40 + a * 10 + d, 0.7, 0), { pos: at(a + d * 0.07, R - 0.2, 0.5), color: 'rockDark' });
    }
    // obsidian pillars with braziers between the cliffs
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8, p = at(a, R + 1.8);
      B.add(cyl(1.5, 1.9, 11, 6), { pos: [p[0], 5.5, p[2]], rot: [0, a, 0], color: 'obsidian' });
      B.add(cyl(2.2, 2.2, 0.8, 6), { pos: [p[0], 0.4, p[2]], color: 'obsidianDeep' });
      B.add(cyl(2.1, 1.6, 0.8, 6), { pos: [p[0], 11.2, p[2]], color: 'obsidianDeep' });
      for (const y of [3, 6, 9]) B.add(torus(1.75, 0.1, 4, 6), { pos: [p[0], y, p[2]], rot: [Math.PI / 2, 0, 0], mesh: 'Magma' });
      brazier(B, [p[0], 11.6, p[2]], 1.1);
    }
    // ---- gate: two obsidian towers with a dragon-horn arch, exit portal in between
    const gz = -R - 1.2;
    for (const x of [-1, 1]) {
      B.add(box(5, 16, 5), { pos: [x * 9.5, 8, gz - 0.5], color: 'obsidian' });
      B.add(box(6, 1.4, 6), { pos: [x * 9.5, 0.7, gz - 0.5], color: 'obsidianDeep' });
      B.add(box(6, 1.2, 6), { pos: [x * 9.5, 16.4, gz - 0.5], color: 'obsidianDeep' });
      for (const y of [4, 8, 12]) B.add(box(5.2, 0.25, 5.2), { pos: [x * 9.5, y, gz - 0.5], mesh: 'Magma' });
      horn(B, [x * 9.5, 16.8, gz - 0.5], [x * 10.5, 26, gz - 0.6], [x * 2.6, 30.5, gz + 0.6], 2.1, 'bone');
      brazier(B, [x * 13.6, 0, gz + 3.2], 1.2);
      B.add(rock(3, 600 + x, 1.6, 0), { pos: [x * 14, 2.5, gz - 2.5], color: 'rockDark' });
    }
    // dragon skull keystone where the horns meet
    B.add(ell(3.0, 2.3, 2.8, 14, 10), { pos: [0, 30.2, gz + 0.4], color: 'bone' });
    B.add(ell(2.0, 1.1, 2.5, 12, 6), { pos: [0, 28.7, gz + 2.4], color: 'boneDeep' });
    B.add(box(1.2, 13, 1.2), { pos: [0, 21.5, gz - 0.6], color: 'obsidianDeep' });
    for (const x of [-1, 1]) {
      B.add(ell(0.75, 0.55, 0.35, 10, 6), { pos: [x * 1.2, 30.5, gz + 2.95], mesh: 'GlowCore' });
      B.add(cone(0.3, 1.4, 5), { pos: [x * 0.9, 27.7, gz + 3.6], rot: [Math.PI, 0, 0], color: 'bone' });
    }
    // exit portal: spinning ring of fire with a glowing swirl
    B.add(torus(5.6, 0.55, 8, 40), { pos: [0, 6.5, gz], mesh: 'PortalRing' });
    around(10, (a) => B.add(flame(0.4, 1.6, { rings: 6, seg: 6 }), { pos: [Math.cos(a) * 5.6, 6.5 + Math.sin(a) * 5.6, gz], quat: quatTo([Math.cos(a), Math.sin(a), 0]), mesh: 'PortalRing' }));
    B.add(cyl(5.1, 5.1, 0.2, 32), { pos: [0, 6.5, gz - 0.2], rot: [Math.PI / 2, 0, 0], mesh: 'Magma' });
    B.add(cyl(3.0, 3.0, 0.22, 24), { pos: [0, 6.5, gz - 0.05], rot: [Math.PI / 2, 0, 0], mesh: 'GlowCore' });
    B.add(box(14, 0.6, 7), { pos: [0, 0.3, gz - 0.5], color: 'obsidianDeep' });
    B.add(box(8, 0.2, 3.4), { pos: [0, 0.65, gz + 2.2], mesh: 'Magma' });
    // ---- egg nest behind the boss: a ring of obsidian rocks around a bed of embers
    const [nx, , nz] = LAIR.nest;
    B.add(cyl(7.8, 8.6, 0.6, 24), { pos: [nx, 0.3, nz + 1], color: 'ash' });
    B.add(ell(6.3, 0.35, 6.3, 20, 5), { pos: [nx, 0.5, nz + 1], mesh: 'Magma' });
    around(7, (a, k) => B.add(rock(0.9, 760 + k, 0.5, 0), { pos: [nx + Math.cos(a) * 3.6, 0.75, nz + 1 + Math.sin(a) * 3.6], color: 'obsidianDeep' }));
    B.add(ell(2.2, 0.3, 2.2, 14, 4), { pos: [nx, 0.62, nz + 1], mesh: 'GlowCore' });
    around(14, (a, k) => B.add(rock(1.6 + (k % 3) * 0.35, 700 + k, 1.1 + (k % 2) * 0.4, 0), { pos: [nx + Math.cos(a) * 7.4, 1.0, nz + 1 + Math.sin(a) * 7.4], color: k % 2 ? 'obsidian' : 'rockDark' }));
    around(9, (a, k) => B.add(crystal(0.6 + (k % 3) * 0.2, 2.6 + (k % 3) * 1.2), { pos: [nx + Math.cos(a) * 8.4, 0.8, nz + 1 + Math.sin(a) * 8.4], quat: quatTo([Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4]), mesh: 'Magma' }));
    // bones and skulls of the previous challengers
    for (const [x, z, r] of [[-30, 18, 0.4], [33, 12, -0.7], [-22, -28, 1.2], [26, -30, 2.1], [-41, -8, 0.3], [40, 22, -1.1]]) {
      B.add(ell(1.4, 1.15, 1.55, 10, 8), { pos: [x, 1.0, z], rot: [0, r, 0], color: 'bone' });
      for (const d of [-1, 1]) B.add(ell(0.22, 0.2, 0.08, 6, 4), { pos: [x + Math.cos(r) * 0.55 * d - Math.sin(r) * 1.3, 1.2, z - Math.sin(r) * 0.55 * d - Math.cos(r) * 1.3], scale: [1.6, 1.6, 1.6], color: 'obsidianDeep' });
      for (let k = 0; k < 3; k++) B.add(cyl(0.16, 0.16, 2.4, 5), { pos: [x + 1.6 + k * 0.4, 0.3, z + (k - 1) * 0.7], rot: [Math.PI / 2, r + k * 0.8, 0], color: 'boneDeep' });
    }
  },
};

const egg = {
  name: 'EggPyrothrax', category: 'Eggs', v2: true, whole: 'wobble', loopSeconds: 2.857, heroSize: [460, 540], view: [-1, 0.35, -1.2], bg: '#1e1214',
  palette: pal(['obsidian', 'obsidianDeep', 'basaltLight', 'ember', 'emberDeep', 'bone', 'boneDeep', 'gold']),
  glow: { Glow: '#ff6a1a', GlowCore: '#ffe08a', HoverGlow: '#ff8a2a' },
  build(B) {
    B.add(eggGeo(26, 20), { color: 'obsidian' });
    // overlapping dragon scales in rows, molten glow in the seams
    for (let row = 0; row < 6; row++) for (let k = 0; k < 11; k++) {
      const th = 0.6 + row * 0.3, ph = (k / 11) * Math.PI * 2 + (row % 2) * 0.29, { p, n } = onShell(th, ph, 0.01);
      B.add(ell(0.2, 0.06, 0.17, 6, 3), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, -1, 0]), color: (row + k) % 4 ? 'obsidianDeep' : 'ember' });
    }
    for (let c = 0; c < 5; c++) { const pts = []; let ph = c * 1.25; for (let i = 0; i <= 9; i++) { ph += i % 2 ? 0.22 : -0.2; pts.push(onShell(0.35 + i * 0.24, ph, 0.03).p.toArray()); } B.add(loft({ points: pts, rx: () => 0.045, ry: () => 0.045, rings: 18, seg: 4 }), { mesh: 'Glow' }); }
    band(B, 0.5, 'gold', null, 0.07);
    // dragon eye slit glowing through the shell
    { const { p, n } = onShell(1.45, -Math.PI / 2, 0.02); B.add(ell(0.26, 0.36, 0.06, 12, 6), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, 1, 0]), mesh: 'Glow' }); B.add(ell(0.08, 0.32, 0.08, 6, 4), { pos: p.clone().addScaledVector(n, 0.03).toArray(), quat: surfaceQuat(n.toArray(), [0, 1, 0]), color: 'obsidianDeep' }); }
    // swept-back horns and a molten crest
    for (const x of [-1, 1]) B.add(loft({ points: [[0.3 * x, 2.0, 0.05], [0.62 * x, 2.5, 0.15], [0.78 * x, 2.9, 0.45]], rx: (t) => 0.12 * (1 - 0.8 * t) + 0.02, ry: (t) => 0.12 * (1 - 0.8 * t) + 0.02, rings: 10, seg: 6 }), { color: 'bone' });
    for (let k = 0; k < 4; k++) B.add(cone(0.1, 0.35 - k * 0.05, 5), { pos: [0, 2.33 - k * 0.12, 0.25 + k * 0.28], rot: [0.5 + k * 0.25, 0, 0], color: 'boneDeep' });
    B.add(ell(0.3, 0.1, 0.3, 10, 4), { pos: [0, 2.37, -0.05], mesh: 'GlowCore' });
    for (let k = 0; k < 3; k++) B.add(flame(0.11, 0.45, { rings: 6, seg: 6 }), { pos: [Math.cos(k * 2.1) * 0.1, 2.38, -0.05 + Math.sin(k * 2.1) * 0.1], mesh: 'Glow' });
    // three molten rocks orbiting the egg (Hover* spins and bobs in game)
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; B.add(rock(0.17, 30 + k, 0.9, 1), { pos: [Math.cos(a) * 1.45, 1.1 + k * 0.25, Math.sin(a) * 1.45], mesh: 'HoverGlow' }); }
  },
};

const gate = {
  name: 'PyroGate', category: 'Dungeon', v2: true, heroSize: [760, 720], view: [-0.6, 0.35, -1.2], bg: '#160c0e', bloom: 0.55,
  palette: pal(['basalt', 'basaltDark', 'basaltLight', 'obsidian', 'obsidianDeep', 'rock', 'rockDark', 'bone', 'boneDeep', 'iron', 'ironLight', 'gold']),
  glow: { Magma: '#ff6a1a', GlowCore: '#ffd36b', Flame: '#ff8a2a', PortalRing: '#ff9a3a' },
  parts: { PortalRing: { pivot: [0, 6, 1.2] } },
  build(B) {
    // queue pad: players stand on the rune circle to join the run (DungeonService counts them)
    B.add(cyl(8, 8.6, 0.8, 32), { pos: [0, 0.4, -5], color: 'basaltDark' });
    B.add(cyl(7.2, 7.2, 0.2, 32), { pos: [0, 0.85, -5], color: 'basalt' });
    B.add(torus(6.2, 0.18, 4, 48), { pos: [0, 0.97, -5], rot: [Math.PI / 2, 0, 0], mesh: 'Magma' });
    around(8, (a) => B.add(box(0.35, 0.06, 1.6), { pos: [Math.cos(a) * 4.6, 0.97, -5 + Math.sin(a) * 4.6], rot: [0, -a, 0], mesh: 'Magma' }));
    B.add(cyl(1.4, 1.4, 0.08, 16), { pos: [0, 0.98, -5], mesh: 'GlowCore' });
    // rock arch with dragon horns and a skull keystone
    for (const x of [-1, 1]) {
      B.add(rock(2.6, 50 + x, 2.6, 1), { pos: [x * 6.4, 4.5, 1.4], color: 'rock' });
      B.add(rock(2.0, 60 + x, 1.6, 0), { pos: [x * 7.6, 1.2, 0], color: 'rockDark' });
      B.add(box(2.6, 10, 2.6), { pos: [x * 5.4, 5, 1.2], color: 'obsidian' });
      for (const y of [3, 6.5]) B.add(box(2.7, 0.22, 2.7), { pos: [x * 5.4, y, 1.2], mesh: 'Magma' });
      horn(B, [x * 5.4, 10, 1.2], [x * 4.6, 14, 1.0], [x * 0.8, 13.2, 1.2], 1.1, 'bone');
      brazier(B, [x * 9.5, 0, -1.5], 0.9);
    }
    B.add(ell(1.4, 1.1, 1.3, 12, 8), { pos: [0, 12.8, 1.4], color: 'bone' });
    B.add(ell(0.9, 0.55, 1.2, 10, 6), { pos: [0, 12.1, 0.4], color: 'boneDeep' });
    for (const x of [-1, 1]) B.add(ell(0.34, 0.26, 0.2, 8, 6), { pos: [x * 0.55, 12.95, 0.2], mesh: 'GlowCore' });
    B.add(torus(4.1, 0.4, 8, 36), { pos: [0, 6, 1.2], mesh: 'PortalRing' });
    around(8, (a) => B.add(flame(0.3, 1.2, { rings: 6, seg: 6 }), { pos: [Math.cos(a) * 4.1, 6 + Math.sin(a) * 4.1, 1.2], quat: quatTo([Math.cos(a), Math.sin(a), 0]), mesh: 'PortalRing' }));
    B.add(cyl(3.75, 3.75, 0.2, 28), { pos: [0, 6, 1.4], rot: [Math.PI / 2, 0, 0], mesh: 'Magma' });
    B.add(cyl(2.1, 2.1, 0.22, 20), { pos: [0, 6, 1.25], rot: [Math.PI / 2, 0, 0], mesh: 'GlowCore' });
    B.add(box(9, 0.8, 4), { pos: [0, 0.4, 1.2], color: 'obsidianDeep' });
  },
};


// ---------------------------------------------------------------- water: Thalassor's sunken temple

// branching coral on the floor or a ledge
function reefCoral(B, p, s, color, seed = 1) {
  B.add(loft({ points: [p, [p[0], p[1] + 0.9 * s, p[2]], [p[0] + 0.15 * s, p[1] + 1.8 * s, p[2]]], rx: (t) => 0.22 * s * (1 - 0.5 * t), ry: (t) => 0.22 * s * (1 - 0.5 * t), rings: 6, seg: 6 }), { color });
  for (let k = 0; k < 3; k++) {
    const a = seed * 2.3 + k * 2.09, from = [p[0], p[1] + (0.6 + k * 0.35) * s, p[2]], to = [p[0] + Math.cos(a) * 0.9 * s, p[1] + (1.3 + k * 0.35) * s, p[2] + Math.sin(a) * 0.9 * s];
    B.add(loft({ points: [from, [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + 0.2 * s, (from[2] + to[2]) / 2], to], rx: (t) => 0.14 * s * (1 - 0.5 * t), ry: (t) => 0.14 * s * (1 - 0.5 * t), rings: 5, seg: 5 }), { color });
    B.add(ell(0.17 * s, 0.17 * s, 0.17 * s, 6, 4), { pos: to, color: 'reefY' });
  }
}
// a scallop half: shallow ribbed bowl. open = 0 lies flat as a bowl; > 0 hinges it up at its back edge
function scallop(B, c, r, color, rib, open = 0, sy = 0.38, lo = false) {
  const g = new THREE.SphereGeometry(r, lo ? 10 : 22, lo ? 3 : 7, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); g.scale(1, sy, 1);
  if (!open) { B.add(g, { pos: c, color }); }
  else { g.scale(1, -1, 1); g.translate(0, 0, -r); B.add(g, { pos: c, rot: [open, 0, 0], color }); }
  const nr = lo ? 6 : 11, nj = lo ? 2 : 4;
  for (let k = 0; k < nr; k++) {
    const a = (k / nr) * Math.PI * 2, pts = [];
    for (let j = 0; j <= nj; j++) { const f = j / nj, rr = r * (0.15 + 0.87 * f), y = -Math.sqrt(Math.max(0, 1 - (rr / r) ** 2)) * r * sy; pts.push(new THREE.Vector3(Math.cos(a) * rr, open ? -y : y - 0.02, Math.sin(a) * rr - (open ? r : 0))); }
    const geo = loft({ points: pts.map((v) => v.toArray()), rx: () => (lo ? 0.09 : 0.22 * r / 7), ry: () => (lo ? 0.06 : 0.12 * r / 7), rings: lo ? 3 : 6, seg: lo ? 3 : 4 });
    B.add(geo, open ? { pos: c, rot: [open, 0, 0], color: rib } : { pos: c, color: rib });
  }
}
function starfish(B, p, s, color, rot = 0) {
  for (let k = 0; k < 5; k++) { const a = rot + (k / 5) * Math.PI * 2; B.add(cone(0.35 * s, 1.1 * s, 5), { pos: [p[0] + Math.cos(a) * 0.5 * s, p[1] + 0.12, p[2] + Math.sin(a) * 0.5 * s], quat: quatTo([Math.cos(a), 0.08, Math.sin(a)]), scale: [1, 1, 0.45], color }); }
  B.add(ell(0.4 * s, 0.15 * s, 0.4 * s, 8, 4), { pos: [p[0], p[1] + 0.15, p[2]], color });
}
// stone column with fluting, base and capital; broken = shorter with a jagged top
function column(B, p, h, broken = false) {
  B.add(cyl(1.7, 1.9, 0.9, 10), { pos: [p[0], 0.45, p[2]], color: 'stoneTDark' });
  B.add(cyl(1.25, 1.35, h, 10), { pos: [p[0], 0.9 + h / 2, p[2]], color: 'stoneT' });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; B.add(box(0.18, h * 0.92, 0.18), { pos: [p[0] + Math.cos(a) * 1.3, 0.9 + h / 2, p[2] + Math.sin(a) * 1.3], color: 'stoneTDark' }); }
  if (broken) { B.add(rock(1.3, p[0] * 7 + p[2], 0.6, 0), { pos: [p[0], 0.9 + h, p[2]], color: 'stoneT' }); B.add(ell(1.4, 0.25, 1.4, 10, 4), { pos: [p[0], 0.95 + h * 0.4, p[2]], color: 'moss' }); }
  else { B.add(cyl(1.9, 1.4, 0.8, 10), { pos: [p[0], 1.3 + h, p[2]], color: 'stoneTLight' }); B.add(box(4.0, 0.7, 4.0), { pos: [p[0], 2.0 + h, p[2]], color: 'stoneTDark' }); }
}
// clam lamp: a small open scallop holding a glowing pearl
function pearlLamp(B, p, s = 1) {
  B.add(cyl(0.5 * s, 0.7 * s, 1.2 * s, 8), { pos: [p[0], p[1] + 0.6 * s, p[2]], color: 'stoneTDark' });
  scallop(B, [p[0], p[1] + 1.3 * s, p[2]], 1.0 * s, 'shellPink', 'shellPinkDeep', 0, 0.38, true);
  scallop(B, [p[0], p[1] + 1.3 * s, p[2] + 1.0 * s], 1.0 * s, 'shellPink', 'shellPinkDeep', 1.9, 0.38, true);
  B.add(ell(0.55 * s, 0.55 * s, 0.55 * s, 12, 8), { pos: [p[0], p[1] + 1.65 * s, p[2]], mesh: 'GlowCore' });
}

const tideLair = {
  name: 'TideLair', category: 'Dungeon', v2: true, heroSize: [1200, 900], view: [0.15, 1.05, -1.0], bg: '#08161e', margin: 0.9, bloom: 0.5,
  palette: pal(['sand', 'sandDark', 'stoneT', 'stoneTDark', 'stoneTLight', 'moss', 'pool', 'reef', 'reefDeep', 'reefY', 'kelp', 'kelpDark', 'shellPink', 'shellPinkDeep', 'pearl', 'teal', 'tealDeep', 'tealLight', 'gold', 'goldDeep', 'rock', 'rockDark']),
  glow: { Tide: '#3fe6ff', GlowCore: '#eafeff', Water: '#5fd0ff', PortalRing: '#5fe8ff' },
  parts: { Floor: { pivot: [0, 0, 0] }, Walls: { pivot: [0, 0, 0] }, PortalRing: { pivot: [LAIR.exit[0], 6.5, -LAIR.R - 1.2] } },
  build(B) {
    const { R, floorR } = LAIR;
    // ---- floor: sand disc, mossy temple flagstones in rings, glowing tide channels and pools
    B.add(cyl(floorR, floorR + 1.5, 2.4, 64), { pos: [0, -1.2, 0], color: 'sandDark', mesh: 'Floor' });
    for (const [r0, r1, n, c] of [[6, 13, 14, 'stoneT'], [15, 26, 26, 'stoneTLight'], [28, 39, 36, 'stoneT'], [41, R - 0.5, 44, 'stoneTLight']]) {
      around(n, (a, k) => {
        if (r1 > 40 && Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.06) return;
        if ((k * 13) % 9 === 0 && r0 > 10) return; // missing tiles show the sand underneath
        const mid = (r0 + r1) / 2, len = r1 - r0 - 0.5, wid = (2 * Math.PI * mid) / n - 0.45;
        B.add(box(wid, 0.16 + (k % 3) * 0.03, len), { pos: at(a, mid, 0.05), rot: [0, -a, 0], color: (k * 7) % 5 < 2 ? c : (k % 3 ? 'stoneTDark' : 'moss') });
      });
    }
    B.add(cyl(5.6, 5.8, 0.2, 24), { pos: [0, 0.08, 0], color: 'tealDeep' });
    for (const [r, w] of [[14, 0.45], [27, 0.3], [40, 0.3]]) for (let s = 0; s < 6; s++) {
      const a0 = s * (Math.PI / 3) + 0.12, pts = []; for (let i = 0; i <= 8; i++) { const a = a0 + (i / 8) * 0.85; pts.push(at(a, r + Math.sin(i * 1.3) * 0.25, 0.12)); }
      jag(B, pts, 'Tide', w);
    }
    for (let c = 0; c < 8; c++) {
      const a0 = (c / 8) * Math.PI * 2 + Math.PI / 8, pts = []; for (let i = 0; i <= 10; i++) { const r = 15 + i * 3.4, a = a0 + Math.sin(i * 0.9 + c) * 0.03; pts.push(at(a, r, 0.12)); }
      jag(B, pts, 'Tide', 0.32);
    }
    for (const [a, r, sx, sz] of [[0.9, 33, 3.4, 2.2], [2.3, 20, 2.6, 1.8], [3.9, 34, 3.0, 2.0], [5.2, 22, 2.8, 1.7], [1.6, 44, 2.4, 1.6], [4.6, 44, 2.6, 1.7]]) {
      const p = at(a, r, 0.2);
      B.add(ell(sx, 0.12, sz, 16, 3), { pos: p, rot: [0, a, 0], color: 'pool' });
      B.add(torus(1, 0.09, 4, 24), { pos: [p[0], 0.24, p[2]], rot: [Math.PI / 2, 0, a], scale: [sx, sz, 1], mesh: 'Tide' });
      starfish(B, at(a + 0.08, r + sz + 1.2), 0.8, (r | 0) % 2 ? 'reef' : 'reefY', a);
    }
    const WL = into(B, 'Walls'); // cliffs and columns are their own mesh (keeps each under 20k triangles)
    // ---- wall: coral-crusted cliffs behind a ring of temple columns, open at the gate
    const segs = 48;
    for (let k = 0; k < segs; k++) {
      const a = (k / segs) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < LAIR.gate + 0.06) continue;
      const r = R + 7 + (k % 3) * 0.8, s = 1 + ((k * 5) % 7) * 0.06;
      WL.add(rock(4.6 * s, 900 + k, 2.4, 1), { pos: at(a, r, 7.5 * s), rot: [0, -a + (k % 2) * 0.4, 0], color: k % 3 ? 'stoneTDark' : 'rockDark' });
      WL.add(rock(3.4, 960 + k, 1.4, 0), { pos: at(a + 0.04, r + 1.5, 15.5 + (k % 4)), rot: [0, -a, 0.2], color: k % 2 ? 'moss' : 'stoneT' });
      if (k % 3 === 0) reefCoral(WL, at(a + 0.05, R + 2.4, 0), 1.3 + (k % 2) * 0.4, k % 2 ? 'reef' : 'reefDeep', k);
      if (k % 3 === 1) for (let j = 0; j < 3; j++) { const b = at(a + j * 0.012, R + 2.2 + j * 0.3, 0); WL.add(loft({ points: [b, [b[0] + 0.3, 2.5 + j, b[2]], [b[0] - 0.2, 5 + j * 1.2, b[2] + 0.3]], rx: (t) => 0.32 * (1 - 0.6 * t), ry: () => 0.06, rings: 6, seg: 4 }), { color: j % 2 ? 'kelp' : 'kelpDark' }); }
    }
    // waterfalls pouring down the cliffs into foaming pools
    for (const a of [Math.PI * 0.5, Math.PI * 0.82, Math.PI * 1.18, Math.PI * 1.5]) {
      WL.add(box(5, 22, 0.5), { pos: at(a, R + 3.2, 11), rot: [0, -a, 0], mesh: 'Water' });
      WL.add(box(2.2, 22, 0.6), { pos: at(a, R + 3.0, 11), rot: [0, -a, 0], mesh: 'GlowCore' });
      WL.add(ell(5.5, 0.2, 3, 16, 4), { pos: at(a, R + 0.6, 0.18), rot: [0, -a, 0], mesh: 'Water' });
      for (let j = 0; j < 5; j++) WL.add(ell(1.1, 0.5, 1.1, 8, 5), { pos: at(a + (j - 2) * 0.035, R + 1.2, 0.4), mesh: 'GlowCore' });
    }
    // temple columns with pearl lamps, a few broken
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + Math.PI / 12; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < LAIR.gate + 0.15) continue;
      const p = at(a, R + 2.2), broken = k % 4 === 2;
      column(WL, p, broken ? 5 : 10, broken);
      if (!broken) pearlLamp(WL, [p[0], 12.4, p[2]], 1.1);
      WL.add(ell(2.2, 0.3, 2.2, 10, 4), { pos: [p[0], 0.6, p[2]], color: 'moss' });
    }
    // ---- gate: two columns under a stone arch with a trident keystone, water portal between
    const gz = -R - 1.2;
    for (const x of [-1, 1]) {
      column(B, [x * 9.5, 0, gz - 0.5], 15);
      pearlLamp(B, [x * 13.6, 0, gz + 3.2], 1.3);
      reefCoral(B, [x * 12.5, 0, gz + 1.0], 1.8, x < 0 ? 'reef' : 'reefDeep', x + 5);
    }
    B.add(torus(9.5, 1.3, 8, 28, Math.PI), { pos: [0, 17.9, gz - 0.5], color: 'stoneTLight' });
    B.add(torus(9.5, 0.35, 4, 28, Math.PI), { pos: [0, 17.9, gz + 0.85], mesh: 'Tide' });
    // trident keystone
    B.add(box(0.8, 7, 0.8), { pos: [0, 27, gz], color: 'gold' });
    for (const x of [-1, 0, 1]) { B.add(cone(0.6, 2.2, 6), { pos: [x * 1.4, 31.2 - Math.abs(x) * 0.6, gz], color: 'gold' }); if (x) B.add(box(0.5, 2.2, 0.5), { pos: [x * 1.4, 29.6, gz], color: 'goldDeep' }); }
    B.add(box(3.6, 0.6, 0.7), { pos: [0, 29.1, gz], color: 'goldDeep' });
    B.add(ell(0.9, 0.9, 0.9, 12, 8), { pos: [0, 25.2, gz + 0.5], mesh: 'GlowCore' });
    // portal: spinning ring of water with spray, glowing swirl
    B.add(torus(5.6, 0.55, 8, 40), { pos: [0, 6.5, gz], mesh: 'PortalRing' });
    around(12, (a) => B.add(flame(0.35, 1.4, { rings: 6, seg: 6, twist: 0.5 }), { pos: [Math.cos(a) * 5.6, 6.5 + Math.sin(a) * 5.6, gz], quat: quatTo([Math.cos(a), Math.sin(a), 0]), mesh: 'PortalRing' }));
    B.add(cyl(5.1, 5.1, 0.2, 32), { pos: [0, 6.5, gz - 0.2], rot: [Math.PI / 2, 0, 0], mesh: 'Water' });
    B.add(cyl(3.0, 3.0, 0.22, 24), { pos: [0, 6.5, gz - 0.05], rot: [Math.PI / 2, 0, 0], mesh: 'GlowCore' });
    B.add(box(14, 0.6, 7), { pos: [0, 0.3, gz - 0.5], color: 'stoneTDark' });
    B.add(box(8, 0.2, 3.4), { pos: [0, 0.65, gz + 2.2], mesh: 'Tide' });
    // ---- the nest: a giant open clam on a bed of glowing pearls behind the boss
    const [nx, , nz] = LAIR.nest;
    B.add(cyl(8.4, 9.2, 0.5, 24), { pos: [nx, 0.25, nz + 1], color: 'sand' });
    scallop(B, [nx, 1.1, nz + 1], 7.4, 'shellPink', 'shellPinkDeep', 0, 0.3);
    scallop(B, [nx, 1.15, nz + 8.4], 7.4, 'shellPink', 'shellPinkDeep', 1.75, 0.3);
    B.add(ell(6.2, 0.3, 6.2, 20, 4), { pos: [nx, 0.55, nz + 1], color: 'sand' });
    around(14, (a, k) => B.add(ell(0.5, 0.5, 0.5, 8, 6), { pos: [nx + Math.cos(a) * (2.5 + (k % 3) * 1.3), 0.75, nz + 1 + Math.sin(a) * (2.5 + (k % 3) * 1.3)], mesh: k % 3 ? 'GlowCore' : undefined, color: k % 3 ? undefined : 'pearl' }));
    for (const [x, z, s, c] of [[-9, 26, 1.6, 'reef'], [9.5, 27, 1.4, 'reefDeep'], [-7, 36, 1.2, 'reefDeep'], [8, 35, 1.3, 'reef']]) reefCoral(B, [nx + x, 0, z], s, c, x);
    // scattered shells and starfish
    for (const [x, z, r] of [[-30, 18, 0.4], [33, 12, -0.7], [-22, -28, 1.2], [26, -30, 2.1], [-41, -8, 0.3], [40, 22, -1.1]]) {
      scallop(B, [x, 0.5, z], 1.2, 'shellPink', 'shellPinkDeep', 0, 0.38, true);
      starfish(B, [x + 2.2, 0, z + 1.4], 0.7, 'reefY', r);
    }
  },
};

const eggTide = {
  name: 'EggThalassor', category: 'Eggs', v2: true, whole: 'wobble', loopSeconds: 2.857, heroSize: [460, 540], view: [-1, 0.35, -1.2], bg: '#0c1a22',
  palette: pal(['teal', 'tealDeep', 'tealLight', 'reef', 'reefDeep', 'reefY', 'pearl', 'gold']),
  glow: { Glow: '#3fe6ff', GlowCore: '#eafeff', HoverGlow: '#5fd0ff' },
  build(B) {
    B.add(eggGeo(26, 20), { color: 'tealDeep' });
    // hex scutes like the boss's shell, glowing seams between them
    for (const [th, n, w] of [[0.5, 7, 0.17], [0.85, 11, 0.19], [1.2, 13, 0.2], [1.55, 14, 0.2], [1.9, 13, 0.19], [2.25, 11, 0.17], [2.6, 7, 0.14]]) for (let k = 0; k < n; k++) {
      const ph = (k / n) * Math.PI * 2 + th * 1.3, { p, n: N } = onShell(th, ph, -0.01);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), N.clone().normalize());
      B.add(cyl(w * 1.15, w * 1.15, 0.03, 6), { pos: p.toArray(), quat: q, mesh: 'Glow' });
      B.add(cyl(w * 0.98, w, 0.06, 6), { pos: p.clone().addScaledVector(N, 0.02).toArray(), quat: q, color: (k + n) % 3 ? 'teal' : 'tealLight' });
    }
    band(B, 0.5, 'gold', null, 0.07);
    // coral growing out of the shell
    for (const [th, ph, c] of [[1.3, 0.6, 'reef'], [1.8, 2.6, 'reefDeep'], [0.9, 4.4, 'reef']]) {
      const { p, n } = onShell(th, ph, 0.02), d = n.clone().add(V([0, 0.8, 0])).normalize();
      B.add(loft({ points: [p.toArray(), p.clone().addScaledVector(d, 0.25).toArray(), p.clone().addScaledVector(d, 0.45).add(V([0.05, 0.05, 0])).toArray()], rx: (t) => 0.06 * (1 - 0.5 * t), ry: (t) => 0.06 * (1 - 0.5 * t), rings: 5, seg: 5 }), { color: c });
      B.add(ell(0.06, 0.06, 0.06, 6, 4), { pos: p.clone().addScaledVector(d, 0.47).toArray(), color: 'reefY' });
    }
    // pearl crest with a water swirl, three orbiting droplets (Hover* spins and bobs in game)
    B.add(ell(0.32, 0.12, 0.32, 12, 5), { pos: [0, 2.36, 0], color: 'gold' });
    B.add(ell(0.22, 0.22, 0.22, 12, 8), { pos: [0, 2.55, 0], mesh: 'GlowCore' });
    for (let k = 0; k < 3; k++) B.add(flame(0.09, 0.4, { rings: 6, seg: 6, twist: 3 }), { pos: [Math.cos(k * 2.1) * 0.22, 2.4, Math.sin(k * 2.1) * 0.22], quat: quatTo([Math.cos(k * 2.1) * 0.5, 1, Math.sin(k * 2.1) * 0.5]), mesh: 'Glow' });
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; B.add(ell(0.14, 0.17, 0.14, 10, 8), { pos: [Math.cos(a) * 1.45, 1.1 + k * 0.25, Math.sin(a) * 1.45], mesh: 'HoverGlow' }); }
  },
};

const tideGate = {
  name: 'TideGate', category: 'Dungeon', v2: true, heroSize: [760, 720], view: [-0.6, 0.35, -1.2], bg: '#08161e', bloom: 0.5,
  palette: pal(['sand', 'sandDark', 'stoneT', 'stoneTDark', 'stoneTLight', 'moss', 'reef', 'reefDeep', 'reefY', 'kelp', 'kelpDark', 'shellPink', 'shellPinkDeep', 'pearl', 'gold', 'goldDeep']),
  glow: { Tide: '#3fe6ff', GlowCore: '#eafeff', Water: '#5fd0ff', PortalRing: '#5fe8ff' },
  parts: { PortalRing: { pivot: [0, 6, 1.2] } },
  build(B) {
    // queue pad
    B.add(cyl(8, 8.6, 0.8, 32), { pos: [0, 0.4, -5], color: 'stoneTDark' });
    B.add(cyl(7.2, 7.2, 0.2, 32), { pos: [0, 0.85, -5], color: 'sand' });
    B.add(torus(6.2, 0.18, 4, 48), { pos: [0, 0.97, -5], rot: [Math.PI / 2, 0, 0], mesh: 'Tide' });
    around(8, (a) => B.add(box(0.35, 0.06, 1.6), { pos: [Math.cos(a) * 4.6, 0.97, -5 + Math.sin(a) * 4.6], rot: [0, -a, 0], mesh: 'Tide' }));
    B.add(cyl(1.4, 1.4, 0.08, 16), { pos: [0, 0.98, -5], mesh: 'GlowCore' });
    for (const [x, z, r] of [[-5.5, -9, 0.5], [5.8, -8.5, 2]]) starfish(B, [x, 0.8, z], 0.7, x < 0 ? 'reef' : 'reefY', r);
    // columns under a stone arch with a trident keystone
    for (const x of [-1, 1]) {
      B.add(cyl(1.3, 1.45, 0.7, 10), { pos: [x * 5.4, 0.35, 1.2], color: 'stoneTDark' });
      B.add(cyl(0.95, 1.0, 9.4, 10), { pos: [x * 5.4, 5.4, 1.2], color: 'stoneT' });
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; B.add(box(0.14, 8.6, 0.14), { pos: [x * 5.4 + Math.cos(a) * 1.0, 5.4, 1.2 + Math.sin(a) * 1.0], color: 'stoneTDark' }); }
      B.add(ell(1.3, 0.3, 1.3, 10, 4), { pos: [x * 5.4, 2.2, 1.2], color: 'moss' });
      reefCoral(B, [x * 7.4, 0, 0.2], 1.3, x < 0 ? 'reef' : 'reefDeep', x + 2);
      pearlLamp(B, [x * 9.5, 0, -1.5], 0.9);
      for (let j = 0; j < 3; j++) B.add(loft({ points: [[x * (6.6 + j * 0.3), 0, 2.4], [x * (6.9 + j * 0.3), 2 + j, 2.6], [x * (6.5 + j * 0.3), 4 + j, 2.3]], rx: (t) => 0.28 * (1 - 0.6 * t), ry: () => 0.05, rings: 6, seg: 4 }), { color: j % 2 ? 'kelp' : 'kelpDark' });
    }
    B.add(torus(5.4, 0.9, 8, 24, Math.PI), { pos: [0, 10.2, 1.2], color: 'stoneTLight' });
    B.add(box(0.5, 3.6, 0.5), { pos: [0, 16.2, 1.2], color: 'gold' });
    for (const x of [-1, 0, 1]) B.add(cone(0.35, 1.3, 6), { pos: [x * 0.85, 18.6 - Math.abs(x) * 0.35, 1.2], color: 'gold' });
    B.add(box(2.2, 0.4, 0.45), { pos: [0, 17.6, 1.2], color: 'goldDeep' });
    B.add(ell(0.55, 0.55, 0.55, 12, 8), { pos: [0, 15.0, 1.6], mesh: 'GlowCore' });
    // water portal
    B.add(torus(4.1, 0.4, 8, 36), { pos: [0, 6, 1.2], mesh: 'PortalRing' });
    around(10, (a) => B.add(flame(0.26, 1.0, { rings: 6, seg: 6, twist: 0.5 }), { pos: [Math.cos(a) * 4.1, 6 + Math.sin(a) * 4.1, 1.2], quat: quatTo([Math.cos(a), Math.sin(a), 0]), mesh: 'PortalRing' }));
    B.add(cyl(3.75, 3.75, 0.2, 28), { pos: [0, 6, 1.4], rot: [Math.PI / 2, 0, 0], mesh: 'Water' });
    B.add(cyl(2.1, 2.1, 0.22, 20), { pos: [0, 6, 1.25], rot: [Math.PI / 2, 0, 0], mesh: 'GlowCore' });
    B.add(box(9, 0.8, 4), { pos: [0, 0.4, 1.2], color: 'stoneTDark' });
  },
};

export default [lair, egg, gate, tideLair, eggTide, tideGate];
