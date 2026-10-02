// Eggs: one per rarity (Common -> Mythic) and one per element. About 2.4 studs tall,
// small enough to carry. Patterns sit on the shell; glowing details are Neon.
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, crystal, flame, bolt, torus, surfaceQuat } from '../lib.js';

const H = 2.4, R = 0.95;
// Egg profile: theta 0 = bottom, PI = top. Fuller at the bottom.
const eggR = (th) => R * Math.sin(th) * (1 + 0.13 * Math.cos(th));
const eggY = (th) => (H / 2) * (1 - Math.cos(th));
function eggGeo(seg = 22, rings = 18) {
  const pts = [];
  for (let i = 0; i <= rings; i++) { const th = (i / rings) * Math.PI; pts.push(new THREE.Vector2(Math.max(0.0001, eggR(th)), eggY(th))); }
  return new THREE.LatheGeometry(pts, seg);
}
// point + outward normal on the shell (theta from bottom, phi around)
function onShell(th, ph, lift = 0.01) {
  const r = eggR(th), y = eggY(th);
  const dr = (eggR(th + 0.01) - eggR(th - 0.01)) / 0.02, dy = (eggY(th + 0.01) - eggY(th - 0.01)) / 0.02;
  const n = V([Math.cos(ph) * dy, -dr, Math.sin(ph) * dy]).normalize();
  return { p: V([Math.cos(ph) * r, y, Math.sin(ph) * r]).addScaledVector(n, lift), n };
}
function band(B, th, color, mesh, tube = 0.07, wave = 0, waves = 6) {
  const pts = [];
  for (let i = 0; i <= 48; i++) { const ph = (i / 48) * Math.PI * 2; pts.push(onShell(th + wave * Math.sin(ph * waves), ph, 0.0).p.toArray()); }
  B.add(loft({ points: pts, rx: () => tube, ry: () => tube, rings: 56, seg: 5 }), mesh ? { mesh } : { color });
}
function spots(B, n, color, mesh, size = 0.16, seed = 1) {
  let s = seed * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) {
    const th = 0.5 + rnd() * 2.1, ph = rnd() * Math.PI * 2, { p, n: nn } = onShell(th, ph, 0.0), r = size * (0.6 + rnd() * 0.8);
    B.add(ell(r, r, 0.05, 8, 5), { pos: p.toArray(), quat: surfaceQuat(nn.toArray(), [0, 1, 0]), ...(mesh ? { mesh } : { color }) });
  }
}

const eggs = [];
const add = (spec) => eggs.push({ category: 'Eggs', heroSize: [440, 520], fit: 0.85, view: [-1, 0.35, -1.2], ...spec });
const shell = (B, color) => B.add(eggGeo(), { color });

add({ name: 'EggCommon', palette: [['shell', '#f3e6c8'], ['spot', '#b98a5a']], build(B) { shell(B, 'shell'); spots(B, 10, 'spot', null, 0.17, 2); } });
add({ name: 'EggUncommon', palette: [['shell', '#86d35f'], ['band', '#4f9a3d'], ['dot', '#e8f7c8']], build(B) { shell(B, 'shell'); band(B, 1.2, 'band', null, 0.08, 0.12); band(B, 1.95, 'band', null, 0.08, 0.12); spots(B, 6, 'dot', null, 0.09, 4); } });
add({
  name: 'EggRare', palette: [['shell', '#4f8fe6'], ['zig', '#f4f8ff'], ['dark', '#2f5fae']], glow: { Glow: '#9fe0ff' },
  build(B) { shell(B, 'shell'); band(B, 1.55, 'zig', null, 0.1, 0.22, 7); band(B, 0.75, 'dark', null, 0.06); for (let k = 0; k < 4; k++) { const { p, n } = onShell(2.4, k * 1.57 + 0.4, 0); B.add(blade(0.22, 0.2, 0.04), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [0, 1, 0]), mesh: 'Glow' }); } },
});
add({
  name: 'EggEpic', palette: [['shell', '#9a5ae6'], ['gold', '#f2b33d'], ['dark', '#6a3ab0']], glow: { Glow: '#ff7ad9' },
  build(B) { shell(B, 'shell'); band(B, 1.45, 'gold', null, 0.11); band(B, 1.15, 'dark', null, 0.05); for (let k = 0; k < 5; k++) { const { p, n } = onShell(1.45, k * 1.2566, 0.08); B.add(crystal(0.1, 0.22), { pos: p.toArray(), quat: quatTo(n.toArray()), mesh: 'Glow' }); } spots(B, 5, 'gold', null, 0.08, 9); },
});
add({
  name: 'EggLegendary', palette: [['shell', '#f2b33d'], ['deep', '#c27e1c'], ['white', '#fff6dd']], glow: { Glow: '#fff1a0' },
  build(B) {
    shell(B, 'shell'); band(B, 0.6, 'deep', null, 0.07); band(B, 2.45, 'white', null, 0.05, 0.1, 10);
    for (const [th, ph, s] of [[1.4, 0.2, 0.9], [1.9, 2.3, 0.7], [1.2, 4.1, 0.8], [2.2, 5.3, 0.55]]) { const { p, n } = onShell(th, ph, 0); B.add(bolt(0.6 * s, 0.22 * s, 0.05), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [Math.cos(ph + 1.57), 0.3, Math.sin(ph + 1.57)]), mesh: 'Glow' }); }
    for (let k = 0; k < 6; k++) { const { p, n } = onShell(2.75, k * 1.047, 0); B.add(cone(0.08, 0.3, 6), { pos: p.toArray(), quat: quatTo(n.clone().add(V([0, 1, 0])).toArray()), color: 'white' }); }
  },
});
add({
  name: 'EggMythic', palette: [['shell', '#2a2140'], ['deep', '#1a1429']], glow: { Glow: '#b46bff', GlowCore: '#5ff0ff' },
  build(B) {
    shell(B, 'shell');
    for (const [off, mesh] of [[0, 'Glow'], [Math.PI, 'GlowCore']]) { const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40, th = 0.35 + u * 2.45, ph = off + u * Math.PI * 2.2; pts.push(onShell(th, ph, 0).p.toArray()); } B.add(loft({ points: pts, rx: () => 0.055, ry: () => 0.055, rings: 50, seg: 5 }), { mesh }); }
    spots(B, 7, null, 'GlowCore', 0.05, 13); spots(B, 7, null, 'Glow', 0.05, 17);
    B.add(crystal(0.16, 0.45), { pos: [0, H - 0.05, 0], mesh: 'Glow' });
  },
});
const EL = [
  ['Fire', '#e8603a', '#a8381c', '#ffb45a'], ['Storm', '#3f6ad6', '#2a4596', '#7ff0ff'], ['Ice', '#cfe8f7', '#8cb6d6', '#9fe8ff'],
  ['Shadow', '#3a2d55', '#221a33', '#b46bff'], ['Water', '#2fa4cf', '#1d6f93', '#6ff4ff'], ['Nature', '#6fbf4a', '#3f8a35', '#c8ff6a'],
];
for (const [el, c, d, g] of EL) {
  add({
    name: `Egg${el}`, palette: [['shell', c], ['deep', d]], glow: { Glow: g }, bg: { Fire: '#241a1c', Storm: '#161c2c', Ice: '#141d27', Shadow: '#17121f', Water: '#0e1c25', Nature: '#141b12' }[el],
    build(B) {
      shell(B, 'shell'); band(B, 0.55, 'deep', null, 0.07);
      const front = onShell(1.4, -Math.PI / 2, 0.02), q = surfaceQuat(front.n.toArray(), [0, 1, 0]);
      if (el === 'Fire') { spots(B, 6, 'deep', null, 0.12, 21); B.add(flame(0.32, 0.8, { rings: 10, seg: 10 }), { pos: front.p.clone().add(V([0, -0.35, -0.02])).toArray(), scale: [1, 1, 0.3], mesh: 'Glow' }); }
      if (el === 'Storm') { B.add(bolt(0.9, 0.36, 0.06), { pos: front.p.clone().add(V([0, -0.4, 0])).toArray(), quat: surfaceQuat(front.n.toArray(), [1, 0, 0]), mesh: 'Glow' }); band(B, 2.0, 'deep', null, 0.06, 0.15, 8); }
      if (el === 'Ice') { for (let k = 0; k < 5; k++) { const { p, n } = onShell(2.55, k * 1.2566, -0.02); B.add(crystal(0.12, 0.45), { pos: p.toArray(), quat: quatTo(n.clone().add(V([0, 0.8, 0])).toArray()), mesh: 'Glow' }); } spots(B, 6, 'deep', null, 0.1, 23); }
      if (el === 'Shadow') { for (const [th, ph] of [[1.3, 0.4], [1.9, 2.4], [1.5, 4.4]]) { const { p, n } = onShell(th, ph, 0); B.add(bolt(0.55, 0.2, 0.05), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), [Math.cos(ph + 1.57), 0, Math.sin(ph + 1.57)]), mesh: 'Glow' }); } }
      if (el === 'Water') { band(B, 1.25, null, 'Glow', 0.05, 0.12, 5); band(B, 1.75, 'deep', null, 0.07, 0.12, 5); }
      if (el === 'Nature') { for (let k = 0; k < 5; k++) { const { p, n } = onShell(2.6, k * 1.2566, 0); B.add(blade(0.45, 0.17, 0.04), { pos: p.toArray(), quat: surfaceQuat(n.toArray(), V([Math.cos(k * 1.2566), 1.2, Math.sin(k * 1.2566)]).normalize().toArray()), color: 'deep' }); } spots(B, 5, null, 'Glow', 0.07, 29); }
      void q;
    },
  });
}

export default eggs;
export { eggGeo, H as EGG_H };
