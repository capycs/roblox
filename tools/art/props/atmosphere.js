// Atmosphere: puffy clouds for the sky around Haven, floating rocks, and ambient
// critters (butterfly, bird) whose wings flap via the WingL/WingR moving parts.
import * as THREE from 'three';
import { V, ell, cone, rock, crystal, blade, cyl, surfaceQuat, quatTo, into } from '../lib.js';

const list = [];
const add = (spec) => list.push({ category: 'Atmosphere', heroSize: [640, 480], fit: 0.85, ...spec });
const seeded = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };

// flat-bottomed cartoon cloud from overlapping blobs
function cloud(B, w, seed) {
  const r = seeded(seed);
  const n = Math.round(w / 2.2);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1) - 0.5) * w, rr = (w / n) * (1.1 + r() * 0.6) * (1 - Math.abs(i / (n - 1) - 0.5) * 0.6);
    const g = new THREE.SphereGeometry(rr, 12, 9); const P = g.attributes.position;
    for (let k = 0; k < P.count; k++) if (P.getY(k) < -rr * 0.25) P.setY(k, -rr * 0.25 - (P.getY(k) + rr * 0.25) * 0.15);
    g.computeVertexNormals();
    B.add(g, { pos: [x, rr * 0.25, (r() - 0.5) * w * 0.25], color: i % 3 === 1 ? 'cloudShade' : 'cloud' });
    if (r() > 0.4) B.add(ell(rr * 0.7, rr * 0.65, rr * 0.7, 10, 8), { pos: [x + (r() - 0.5) * rr, rr * 0.95, (r() - 0.5) * rr], color: 'cloud' });
  }
}
const CLOUD = [['cloud', '#ffffff'], ['cloudShade', '#dfe9f6']];
add({ name: 'CloudSmall', palette: CLOUD, bg: '#5b9be6', build(B) { cloud(B, 10, 1); } });
add({ name: 'CloudMedium', palette: CLOUD, bg: '#5b9be6', build(B) { cloud(B, 22, 2); } });
add({ name: 'CloudLarge', palette: CLOUD, bg: '#5b9be6', heroSize: [800, 420], build(B) { cloud(B, 40, 3); cloud({ add: (g, o) => B.add(g, { ...o, pos: [o.pos[0] + 6, o.pos[1] + 3, o.pos[2] - 6] }) }, 24, 4); } });
add({
  name: 'FloatingRock', palette: [['stone', '#9b9a94'], ['stoneDark', '#6d6c68'], ['grass', '#5fae45'], ['grassDark', '#3f8a35']], glow: { HoverGlow: '#7ff3ff' }, bg: '#5b9be6',
  parts: { HoverRock: { pivot: [0, 0, 0] }, HoverGlow: { pivot: [0, 0, 0] } },
  build(B) {
    const H = into(B, 'HoverRock');
    H.add(ell(2.6, 0.5, 2.4, 14, 6), { pos: [0, 0.2, 0], color: 'grass' });
    for (let i = 0; i < 5; i++) { const a = i * 1.25; H.add(ell(0.7, 0.3, 0.7, 8, 5), { pos: [Math.cos(a) * 2.2, 0.25, Math.sin(a) * 2.0], color: 'grassDark' }); }
    H.add(rock(2.4, 7, 0.9, 1), { pos: [0, -1.4, 0], color: 'stone' });
    H.add(rock(1.5, 8, 1.0, 1), { pos: [0.3, -3.0, 0.2], color: 'stoneDark' });
    H.add(cone(0.8, 2.6, 6), { pos: [0, -4.6, 0], rot: [Math.PI, 0, 0], color: 'stoneDark' });
    B.add(crystal(0.4, 1.4), { pos: [0, -5.6, 0], rot: [Math.PI, 0, 0], mesh: 'HoverGlow' });
  },
});
add({
  name: 'Butterfly', palette: [['body', '#3a2a3a'], ['wing', '#ff9ec7'], ['wingDeep', '#e46aa0'], ['spot', '#fff4d6']], heroSize: [480, 420], fit: 1.1, outlineWidth: 0.012,
  parts: { WingL: { pivot: [0, 0, 0] }, WingR: { pivot: [0, 0, 0] } },
  build(B) {
    B.add(ell(0.07, 0.07, 0.36, 8, 6), { pos: [0, 0, 0], color: 'body' });
    B.add(ell(0.09, 0.09, 0.09, 8, 6), { pos: [0, 0.02, -0.38], color: 'body' });
    for (const [s, x] of [['L', -1], ['R', 1]]) {
      const W = into(B, `Wing${s}`);
      W.add(blade(0.55, 0.32, 0.015), { pos: [0, 0, -0.05], quat: surfaceQuat([0, 1, 0], [x, 0, -0.55]), color: 'wing' });
      W.add(blade(0.42, 0.24, 0.015), { pos: [0, 0, 0.05], quat: surfaceQuat([0, 1, 0], [x, 0, 0.6]), color: 'wingDeep' });
      W.add(ell(0.07, 0.01, 0.07, 6, 4), { pos: [x * 0.32, 0.012, -0.22], color: 'spot' });
      B.add(cyl(0.008, 0.008, 0.3, 4), { pos: [x * 0.06, 0.13, -0.5], quat: quatTo([x * 0.4, 1, -0.6]), color: 'body' });
    }
  },
  view: [-0.6, 1.2, -0.8],
});
add({
  name: 'Bird', palette: [['body', '#f4f1ea'], ['wing', '#d9d3c6'], ['beak', '#f2b33d'], ['eye', '#1c1424']], heroSize: [520, 420], fit: 1.0, outlineWidth: 0.03,
  parts: { WingL: { pivot: [0, 0.1, 0] }, WingR: { pivot: [0, 0.1, 0] } },
  build(B) {
    B.add(ell(0.32, 0.3, 0.75, 12, 9), { pos: [0, 0, 0], color: 'body' });
    B.add(ell(0.26, 0.26, 0.26, 10, 8), { pos: [0, 0.18, -0.68], color: 'body' });
    B.add(cone(0.08, 0.26, 6), { pos: [0, 0.14, -1.0], rot: [-Math.PI / 2, 0, 0], color: 'beak' });
    for (const x of [-1, 1]) B.add(ell(0.04, 0.05, 0.03, 6, 4), { pos: [x * 0.14, 0.26, -0.86], color: 'eye' });
    B.add(blade(0.6, 0.25, 0.04), { pos: [0, 0.05, 0.6], quat: surfaceQuat([0, 1, 0], [0, 0, 1]), color: 'wing' });
    for (const [s, x] of [['L', -1], ['R', 1]]) {
      const W = into(B, `Wing${s}`);
      W.add(blade(1.3, 0.36, 0.05), { pos: [x * 0.2, 0.1, -0.1], quat: surfaceQuat([0, 1, 0], [x, 0.05, 0.15]), color: 'wing' });
    }
  },
  view: [-0.6, 0.9, -0.9],
});

export default list;
