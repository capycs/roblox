// v2 eggs: themed and event eggs for later zones, a huge golden egg and a celestial
// mythic egg. Anything named Hover* bobs and spins in game (PropAnimation), glow meshes
// become Neon.
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, crystal, flame, bolt, torus, surfaceQuat, rock } from '../lib.js';
import { eggGeo, EGG_H as H, onShell, band, spots } from './eggs.js';
import { canopy } from '../foliage.js';

const list = [];
const add = (spec) => list.push({ category: 'Eggs', v2: true, whole: 'wobble', loopSeconds: 2.857, heroSize: [440, 520], view: [-1, 0.35, -1.2], ...spec });
const shell = (B, color, s = 1) => B.add(eggGeo(26, 20), { color, scale: [s, s, s] });
const ring = (B, th, mesh, color, tube = 0.06) => band(B, th, color, mesh, tube);
const around = (n, f) => { for (let k = 0; k < n; k++) f((k / n) * Math.PI * 2, k); };
// a slice of the egg shell between two profile angles (0 = bottom, PI = top)
function shellSlice(th0, th1, seg = 26) {
  const pts = []; for (let i = 0; i <= 6; i++) { const th = th0 + (th1 - th0) * (i / 6), o = onShell(th, 0, 0).p; pts.push(new THREE.Vector2(Math.max(0.0001, o.x), o.y)); }
  return new THREE.LatheGeometry(pts, seg);
}

add({
  name: 'EggCosmic', palette: [['shell', '#1d1840'], ['deep', '#120e2a'], ['planet', '#e8735a'], ['planet2', '#5fb4e8'], ['rim', '#f2d27a']], glow: { Glow: '#b9a6ff', GlowCore: '#ffffff', HoverGlow: '#f2d27a' }, bg: '#0e0c1e',
  build(B) {
    shell(B, 'shell'); band(B, 0.6, 'deep', null, 0.07);
    spots(B, 22, null, 'GlowCore', 0.035, 41); spots(B, 9, null, 'Glow', 0.07, 43);
    // nebula swirl
    const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push(onShell(0.6 + u * 2.0, u * Math.PI * 2.4, 0).p.toArray()); }
    B.add(loft({ points: pts, rx: () => 0.045, ry: () => 0.045, rings: 50, seg: 5 }), { mesh: 'Glow' });
    // tilted planetary ring that spins around the egg
    B.add(new THREE.TorusGeometry(1.35, 0.07, 6, 40), { pos: [0, 1.2, 0], rot: [Math.PI / 2 - 0.35, 0, 0.2], mesh: 'HoverGlow' });
    B.add(ell(0.2, 0.2, 0.2, 12, 8), { pos: [1.3, 1.55, 0.3], color: 'planet' });
    B.add(ell(0.13, 0.13, 0.13, 10, 6), { pos: [-1.1, 0.75, -0.6], color: 'planet2' });
  },
});
add({
  name: 'EggCandy', palette: [['shell', '#ffd1e6'], ['stripe', '#ff5e9a'], ['mint', '#7fe0c4'], ['cream', '#fff6ea'], ['cherry', '#e8283a'], ['spr1', '#ffd84a'], ['spr2', '#5fb4ff'], ['spr3', '#9fe05a']], bg: '#2a1a26',
  build(B) {
    shell(B, 'shell');
    const pts = (off) => { const a = []; for (let i = 0; i <= 48; i++) { const u = i / 48; a.push(onShell(0.35 + u * 2.4, off + u * Math.PI * 3.2, 0.01).p.toArray()); } return a; };
    B.add(loft({ points: pts(0), rx: () => 0.12, ry: () => 0.12, rings: 60, seg: 6 }), { color: 'stripe' });
    B.add(loft({ points: pts(Math.PI), rx: () => 0.1, ry: () => 0.1, rings: 60, seg: 6 }), { color: 'mint' });
    // frosting cap with drips + sprinkles + a cherry
    for (let k = 0; k < 10; k++) { const ph = (k / 10) * Math.PI * 2, { p, n } = onShell(2.35, ph, 0.01); B.add(ell(0.16, 0.25 + (k % 3) * 0.08, 0.08, 8, 6), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, 1, 0]), color: 'cream' }); }
    B.add(ell(0.8, 0.3, 0.8, 16, 8), { pos: [0, 2.22, 0], color: 'cream' });
    for (let k = 0; k < 18; k++) { const ph = k * 2.4, th = 2.5 + (k % 4) * 0.12, { p, n } = onShell(th, ph, 0.05); B.add(cyl(0.025, 0.12), { pos: p.toArray(), quat: quatTo([n.x + Math.cos(k), n.y, n.z + Math.sin(k)]), color: ['spr1', 'spr2', 'spr3'][k % 3] }); }
    B.add(ell(0.2, 0.2, 0.2, 12, 8), { pos: [0.05, 2.62, 0], color: 'cherry' });
    B.add(loft({ points: [[0.05, 2.78, 0], [0.12, 3.0, 0.05], [0.25, 3.12, 0.1]], rx: () => 0.02, ry: () => 0.02, rings: 4, seg: 4 }), { color: 'mint' });
  },
});
add({
  name: 'EggVolcano', palette: [['shell', '#3a2a2a'], ['deep', '#221616'], ['rock', '#5a4646']], glow: { Glow: '#ff6a1a', GlowCore: '#ffd36b' }, bg: '#241a1c',
  build(B) {
    shell(B, 'shell');
    // jagged lava cracks running up the shell
    for (let c = 0; c < 4; c++) { const pts = []; let ph = c * 1.6; for (let i = 0; i <= 10; i++) { ph += (i % 2 ? 0.25 : -0.22); pts.push(onShell(0.4 + i * 0.22, ph, 0.005).p.toArray()); } B.add(loft({ points: pts, rx: () => 0.05, ry: () => 0.05, rings: 20, seg: 5 }), { mesh: 'Glow' }); }
    around(7, (a, k) => { const { p, n } = onShell(0.5 + (k % 3) * 0.6, a, -0.03); B.add(rock(0.22, 90 + k, 0.6, 0), { pos: p.toArray(), quat: quatTo(n.toArray()), color: k % 2 ? 'rock' : 'deep' }); });
    // erupting crown
    B.add(ell(0.42, 0.12, 0.42, 12, 5), { pos: [0, 2.36, 0], mesh: 'GlowCore' });
    around(5, (a) => B.add(flame(0.16, 0.65, { rings: 8, seg: 8 }), { pos: [Math.cos(a) * 0.18, 2.35, Math.sin(a) * 0.18], quat: quatTo([Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4]), mesh: 'Glow' }));
  },
});
add({
  name: 'EggOcean', palette: [['shell', '#2fa4cf'], ['deep', '#1d6f93'], ['foam', '#eafcff'], ['shellPink', '#ffc0b0'], ['sand', '#f2dca0']], glow: { Glow: '#6ff4ff' }, bg: '#0e1c25',
  build(B) {
    shell(B, 'shell');
    for (const [th, c] of [[0.8, 'deep'], [1.35, 'foam'], [1.9, 'deep']]) band(B, th, c, null, 0.07, 0.14, 6);
    band(B, 1.62, null, 'Glow', 0.04, 0.14, 6);
    // seashell + starfish stuck on the side
    const s1 = onShell(1.1, -1.2, 0.02); B.add(new THREE.ConeGeometry(0.2, 0.35, 10), { pos: s1.p.toArray(), quat: quatTo(s1.n.toArray()), color: 'shellPink' });
    const s2 = onShell(2.0, 0.6, 0.02); around(5, (a) => B.add(ell(0.17, 0.05, 0.06, 6, 3), { pos: s2.p.clone().add(V([Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0]).applyQuaternion(quatTo(s2.n.toArray()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))))).toArray(), quat: surfaceQuat(s2.n.toArray(), [Math.cos(a), Math.sin(a), 0]), color: 'sand' }));
    spots(B, 10, 'foam', null, 0.06, 47);
  },
});
add({
  name: 'EggForest', palette: [['shell', '#a8d870'], ['deep', '#6fae45'], ['leafDeep', '#28552b'], ['leafDark', '#357a2f'], ['leaf', '#4f9a3d'], ['leafLight', '#74b84a'], ['leafTip', '#98cf58'], ['petal', '#ff9ec7'], ['petalY', '#ffd84a'], ['vine', '#3f7a2f']], bg: '#141b12',
  build(B) {
    shell(B, 'shell'); spots(B, 8, 'deep', null, 0.12, 51);
    const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push(onShell(0.4 + u * 2.2, u * Math.PI * 2.6, 0.02).p.toArray()); }
    B.add(loft({ points: pts, rx: () => 0.05, ry: () => 0.05, rings: 50, seg: 5 }), { color: 'vine' });
    canopy(B, { blobs: [[0, 2.35, 0, 0.45], [0.35, 2.1, 0.1, 0.3], [-0.3, 2.15, -0.1, 0.3]], shades: ['leafDeep', 'leafDark', 'leaf', 'leafLight', 'leafTip'], count: 110, size: [0.34, 0.2], seed: 601, centre: [0, 1.9, 0] });
    for (const [th, ph, c] of [[1.2, 0.5, 'petal'], [0.9, 2.6, 'petalY'], [1.7, 4.2, 'petal']]) { const { p, n } = onShell(th, ph, 0.03); around(5, (a) => { const side = V([0, 1, 0]).cross(n).normalize(), fw = n.clone().cross(side), d = side.clone().multiplyScalar(Math.cos(a)).addScaledVector(fw, Math.sin(a)); B.add(ell(0.13, 0.03, 0.08, 6, 3), { pos: p.clone().addScaledVector(d, 0.12).toArray(), quat: surfaceQuat(n.toArray(), d.toArray()), color: c }); }); }
  },
});
add({
  name: 'EggCrystal', palette: [['shell', '#cfe8f7'], ['deep', '#8cb6d6']], glow: { Glow: '#c49aff', GlowCore: '#f0e0ff' }, bg: '#17121f',
  build(B) {
    shell(B, 'shell'); band(B, 0.55, 'deep', null, 0.07);
    [[1.0, 0.3, 0.2, 0.9], [1.4, 2.0, 0.16, 0.7], [0.8, 3.6, 0.14, 0.6], [1.8, 5.0, 0.13, 0.55], [2.4, 1.2, 0.18, 0.75]].forEach(([th, ph, r, h], k) => { const { p, n } = onShell(th, ph, -0.05); B.add(crystal(r, h), { pos: p.toArray(), quat: quatTo(n.clone().add(V([0, 0.4, 0])).toArray()), mesh: k % 2 ? 'GlowCore' : 'Glow' }); B.add(crystal(r * 0.55, h * 0.6), { pos: p.toArray(), quat: quatTo(n.clone().add(V([0.5, 0.2, 0.3])).toArray()), mesh: 'Glow' }); });
    B.add(crystal(0.22, 0.9), { pos: [0, 2.25, 0], mesh: 'GlowCore' });
  },
});
add({
  name: 'EggGoldenHuge', palette: [['shell', '#f2b33d'], ['deep', '#c27e1c'], ['light', '#ffe9a8'], ['ruby', '#e8283a'], ['sapphire', '#3d6fc4'], ['emerald', '#2fae5a']], glow: { Glow: '#fff1a0' }, bg: '#241c10', heroSize: [520, 600],
  build(B) {
    shell(B, 'shell', 1.6);
    const S = (th, ph, lift = 0) => { const o = onShell(th, ph, lift); return { p: o.p.multiplyScalar(1.6), n: o.n }; };
    for (const th of [0.75, 1.55, 2.35]) { const pts = []; for (let i = 0; i <= 48; i++) pts.push(S(th, (i / 48) * Math.PI * 2).p.toArray()); B.add(loft({ points: pts, rx: () => 0.1, ry: () => 0.1, rings: 56, seg: 6 }), { color: th === 1.55 ? 'light' : 'deep' }); }
    around(8, (a, k) => { const { p, n } = S(1.55, a, 0.04); B.add(new THREE.OctahedronGeometry(0.16, 0), { pos: p.toArray(), quat: quatTo(n.toArray()), scale: [1, 1.3, 0.6], color: ['ruby', 'sapphire', 'emerald'][k % 3] }); });
    around(6, (a) => { const { p, n } = S(2.75, a, 0); B.add(cone(0.12, 0.45, 6), { pos: p.toArray(), quat: quatTo(n.clone().add(V([0, 1, 0])).toArray()), color: 'light' }); });
    spots(B, 0, null, 'Glow');
    for (const [th, ph, s] of [[1.1, 0.4, 0.5], [2.0, 2.6, 0.4], [1.3, 4.3, 0.45]]) { const { p, n } = S(th, ph, 0.02); B.add(bolt(0.4 * s * 2, 0.15 * s * 2, 0.05), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, 1, 0]), mesh: 'Glow' }); }
  },
});
add({
  name: 'EggRainbow', palette: [['r1', '#ff5e5e'], ['r2', '#ffa64a'], ['r3', '#ffe14a'], ['r4', '#6fdc5a'], ['r5', '#4ab8ff'], ['r6', '#9a6aff'], ['cloud', '#ffffff'], ['cloudShade', '#e4ecfa']], glow: { Glow: '#ffffff' }, bg: '#2a3a52',
  build(B) {
    const cols = ['r6', 'r5', 'r4', 'r3', 'r2', 'r1'];
    cols.forEach((c, i) => B.add(shellSlice((i / 6) * Math.PI, ((i + 1) / 6) * Math.PI), { color: c }));
    canopy(B, { blobs: [[0, 0.15, 0, 0.6], [0.55, 0.2, 0.2, 0.45], [-0.5, 0.2, -0.2, 0.45], [0.1, 0.2, 0.55, 0.42], [-0.1, 0.2, -0.55, 0.42]], shades: ['cloudShade', 'cloud', 'cloud', 'cloud', 'cloud'], count: 120, size: [0.36, 0.3], seed: 611, droop: 0.2, centre: [0, -0.4, 0] });
    spots(B, 10, null, 'Glow', 0.05, 53);
  },
});
add({
  name: 'EggVoid', palette: [['shell', '#120c1c'], ['deep', '#24183a']], glow: { Glow: '#a54dff', GlowCore: '#f3cdff', HoverGlow: '#c88aff' }, bg: '#0c0812',
  build(B) {
    shell(B, 'shell');
    for (let c = 0; c < 5; c++) { const pts = []; let ph = c * 1.25; for (let i = 0; i <= 9; i++) { ph += (i % 2 ? 0.3 : -0.26); pts.push(onShell(0.5 + i * 0.22, ph, 0.005).p.toArray()); } B.add(loft({ points: pts, rx: () => 0.04, ry: () => 0.04, rings: 18, seg: 5 }), { mesh: c % 2 ? 'Glow' : 'GlowCore' }); }
    // floating shards orbiting the egg
    around(5, (a, k) => B.add(crystal(0.1, 0.4 + (k % 2) * 0.15), { pos: [Math.cos(a) * 1.35, 0.6 + (k % 3) * 0.55, Math.sin(a) * 1.35], quat: quatTo([Math.cos(a), 0.6, Math.sin(a)]), mesh: 'HoverGlow' }));
  },
});
add({
  name: 'EggSpooky', palette: [['shell', '#f08a24'], ['deep', '#b8561a'], ['face', '#2a1414'], ['stem', '#5e7a2c'], ['bat', '#2a1e36'], ['web', '#f4ece0']], glow: { Glow: '#ffd36b' }, bg: '#1a1222',
  build(B) {
    shell(B, 'shell');
    around(8, (a) => { const pts = []; for (let i = 0; i <= 14; i++) pts.push(onShell(0.15 + i * 0.2, a, 0.0).p.toArray()); B.add(loft({ points: pts, rx: () => 0.05, ry: () => 0.05, rings: 16, seg: 4 }), { color: 'deep' }); });
    // carved face that glows from inside
    const f = (th, ph) => onShell(th, ph, 0.01);
    for (const x of [-0.45, 0.45]) { const { p, n } = f(1.7, -Math.PI / 2 + x); B.add(new THREE.ConeGeometry(0.15, 0.22, 3), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, 1, 0]).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))), mesh: 'Glow' }); }
    { const { p, n } = f(1.15, -Math.PI / 2); B.add(ell(0.42, 0.12, 0.05, 12, 4), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, 1, 0]), mesh: 'Glow' }); }
    B.add(loft({ points: [[0, 2.35, 0], [0.05, 2.6, 0], [0.18, 2.72, 0.05]], rx: () => 0.08, ry: () => 0.08, rings: 4, seg: 6 }), { color: 'stem' });
    // a little bat perched on top
    B.add(ell(0.12, 0.13, 0.12, 8, 6), { pos: [-0.3, 2.3, 0.1], color: 'bat' });
    for (const x of [-1, 1]) B.add(blade(0.35, 0.16, 0.03, 6), { pos: [-0.3 + x * 0.08, 2.32, 0.1], quat: surfaceQuat([0, 0.4, -1], [x, 0.4, 0]), color: 'bat' });
  },
});
add({
  name: 'EggFrost', palette: [['shell', '#9fcdee'], ['deep', '#8cb6d6'], ['snow', '#ffffff']], glow: { Glow: '#9fe8ff' }, bg: '#141d27',
  build(B) {
    shell(B, 'shell');
    B.add(new THREE.SphereGeometry(1.0, 20, 8, 0, Math.PI * 2, 0, 0.9), { pos: [0, 1.25, 0], scale: [1, 1.2, 1], color: 'snow' });
    around(10, (a, k) => { const { p } = onShell(1.9, a, 0); B.add(cone(0.07, 0.3 + (k % 3) * 0.12, 6), { pos: p.clone().add(V([0, -0.15, 0])).toArray(), rot: [Math.PI, 0, 0], mesh: 'Glow' }); });
    for (const [th, ph] of [[1.2, -1.4], [1.0, 1.0], [1.5, 2.8]]) { const { p, n } = onShell(th, ph, 0.01); around(3, (a) => B.add(ell(0.22, 0.03, 0.04, 6, 3), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [Math.cos(a), Math.sin(a), 0]), color: 'deep' })); }
  },
});
add({
  name: 'EggStorm', palette: [['shell', '#3f5aa8'], ['deep', '#2a3c78'], ['cloud', '#e6ecf6'], ['cloudShade', '#b8c4dc']], glow: { Glow: '#7ff0ff', GlowCore: '#fbff9e' }, bg: '#161c2c',
  build(B) {
    shell(B, 'shell'); band(B, 2.0, 'deep', null, 0.06, 0.18, 8);
    canopy(B, { blobs: [[0.8, 0.35, 0.2, 0.42], [-0.75, 0.4, -0.2, 0.42], [0.2, 0.35, -0.8, 0.4], [-0.25, 0.3, 0.8, 0.4], [0.6, 0.3, -0.6, 0.35], [-0.6, 0.3, 0.6, 0.35]], shades: ['cloudShade', 'cloudShade', 'cloud', 'cloud', 'cloud'], count: 150, size: [0.36, 0.3], seed: 621, droop: 0.2, core: false, centre: [0, 0.6, 0] });
    for (const [ph, s] of [[-1.6, 1], [0.8, 0.7], [2.6, 0.8]]) { const { p, n } = onShell(1.0, ph, 0.25); B.add(bolt(0.8 * s, 0.32 * s, 0.06), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, 1, 0]), mesh: ph < 0 ? 'GlowCore' : 'Glow' }); }
  },
});
add({
  name: 'EggDragon', palette: [['shell', '#c84a3a'], ['deep', '#8a2a24'], ['scale', '#e8735a'], ['horn', '#f4e2c0'], ['belly', '#ffd0a0']], glow: { Glow: '#ffb45a' }, bg: '#241a1c',
  build(B) {
    shell(B, 'shell');
    for (let row = 0; row < 7; row++) around(12, (a, k) => { const th = 0.55 + row * 0.27, { p, n } = onShell(th, a + (row % 2) * 0.26, 0.0); B.add(ell(0.17, 0.05, 0.14, 6, 3), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, -1, 0]), color: (row + k) % 3 ? 'scale' : 'deep' }); });
    for (const x of [-1, 1]) B.add(loft({ points: [[0.3 * x, 2.2, 0], [0.55 * x, 2.6, 0.1], [0.7 * x, 2.85, 0.35]], rx: (t) => 0.1 * (1 - 0.8 * t) + 0.02, ry: (t) => 0.1 * (1 - 0.8 * t) + 0.02, rings: 8, seg: 6 }), { color: 'horn' });
    { const { p, n } = onShell(1.5, -Math.PI / 2, 0.01); B.add(ell(0.16, 0.24, 0.05, 10, 6), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, 1, 0]), mesh: 'Glow' }); B.add(ell(0.05, 0.2, 0.06, 6, 4), { pos: p.clone().addScaledVector(n, 0.02).toArray(), quat: surfaceQuat(n.toArray(), [0, 1, 0]), color: 'deep' }); }
  },
});
add({
  name: 'EggCelestial', palette: [['shell', '#fbf6ff'], ['gold', '#f6c445'], ['goldDeep', '#b8841c'], ['feather', '#ffffff'], ['featherTip', '#e8dcff']], glow: { Glow: '#ffd36b', GlowCore: '#ffffff', HoverGlow: '#c49aff' }, bg: '#16122a', heroSize: [520, 560],
  build(B) {
    shell(B, 'shell'); band(B, 1.55, 'gold', null, 0.09); band(B, 0.6, 'goldDeep', null, 0.06);
    around(6, (a, k) => { const { p, n } = onShell(1.55, a, 0.06); B.add(new THREE.OctahedronGeometry(0.11, 0), { pos: p.toArray(), quat: quatTo(n.toArray()), scale: [1, 1.3, 0.6], mesh: k % 2 ? 'GlowCore' : 'Glow' }); });
    // feathered wings on both sides
    for (const x of [-1, 1]) for (let k = 0; k < 6; k++) { const d = V([x, 0.55 - k * 0.22, 0.25]).normalize(); B.add(blade(0.9 - k * 0.08, 0.22, 0.04, 8), { pos: [0.85 * x, 1.45, 0.1], quat: surfaceQuat([0, 0.2, 1], d.toArray()), color: k % 2 ? 'featherTip' : 'feather' }); }
    // spinning halo + floating star
    B.add(new THREE.TorusGeometry(0.62, 0.07, 6, 32), { pos: [0, 2.7, 0], rot: [Math.PI / 2 - 0.45, 0, 0.2], mesh: 'HoverGlow' });
    B.add(new THREE.OctahedronGeometry(0.14, 0), { pos: [0, 3.05, 0], scale: [1, 1.5, 1], mesh: 'HoverGlow' });
  },
});
function cyl(r, h) { return new THREE.CylinderGeometry(r, r, h, 5); }

export default list;
