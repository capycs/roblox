// Skyship: the flying ship that docks at Haven and carries up to 12 players to the Wilds.
// Wooden hull with a blue-and-gold paint job, striped balloon, side wings with
// propellers, a stern propeller, a cabin and helm, lanterns and a glowing levitation
// crystal under the keel. Propellers are separate meshes so Roblox code can spin them.
// About 58 studs long, 40 tall. Faces -Z.
import * as THREE from 'three';
import { V, ell, cone, quatTo, loft, blade, crystal, box, cyl, torus, surfaceQuat } from '../lib.js';

const palette = [
  ['paint', '#2f4a7a'], ['paintDark', '#1f3358'], ['gold', '#f2b33d'], ['goldDeep', '#c27e1c'],
  ['wood', '#a8703f'], ['woodDark', '#744828'], ['woodLight', '#c99258'], ['canvas', '#f4e8cf'],
  ['canvasRed', '#d9483b'], ['canvasShade', '#d6c5a3'], ['rope', '#b89466'], ['metal', '#5b6470'],
  ['metalDark', '#353b44'], ['window', '#2a3550'],
];
const glow = { Glow: '#7ff3ff', Lamp: '#ffd36b' };

const Z0 = 27, Z1 = -31; // stern, bow
const zAt = (t) => Z0 + (Z1 - Z0) * t;
const halfW = (t) => 8.2 * Math.pow(Math.sin(Math.PI * Math.min(0.999, 0.12 + 0.88 * t)), 0.6) * (t < 0.1 ? 0.75 + 2.5 * t : 1);
const depth = (t) => 7.2 * Math.pow(Math.sin(Math.PI * Math.min(0.999, 0.06 + 0.94 * t)), 0.5);
const deckY = (t) => 9 + 1.6 * Math.pow(Math.abs(t - 0.45) / 0.55, 2.2);

// Closed U-section hull: curved bottom and sides up to the deck line, flat top.
function hull(rings = 44, n = 26, m = 8) {
  const pos = [], idx = [], per = n + m;
  for (let i = 0; i <= rings; i++) {
    const t = i / rings, w = Math.max(0.15, halfW(t)), d = depth(t), g = deckY(t), z = zAt(t);
    for (let j = 0; j < n; j++) { const f = (j / (n - 1)) * Math.PI; pos.push(w * Math.cos(f), g - d * Math.pow(Math.sin(f), 0.8) - 0.3 * (1 - Math.abs(Math.cos(f))), z); }
    for (let j = 1; j <= m; j++) { const f = j / (m + 1); pos.push(-w + 2 * w * f, g, z); }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < per; j++) {
    const a = i * per + j, b = i * per + ((j + 1) % per), c = a + per, e = b + per;
    idx.push(a, b, c, b, e, c);
  }
  const s0 = pos.length / 3; pos.push(0, deckY(0) - depth(0) * 0.5, zAt(0));
  const s1 = s0 + 1; pos.push(0, deckY(1) - 0.5, zAt(1));
  for (let j = 0; j < per; j++) { idx.push(s0, (j + 1) % per, j); const o = rings * per; idx.push(s1, o + j, o + ((j + 1) % per)); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function propeller(B, mesh, center, axis, r, blades = 3) {
  const q = new THREE.Quaternion().setFromUnitVectors(V([0, 0, 1]), V(axis).normalize());
  const hub = cyl(0.45 * r / 2.4, 0.6 * r / 2.4, 0.9, 12); hub.rotateX(Math.PI / 2);
  B.add(hub, { pos: center, quat: q, color: 'gold', mesh });
  B.add(cone(0.4 * r / 2.4, 0.9, 12), { pos: V(center).add(V(axis).normalize().multiplyScalar(-0.8)).toArray(), quat: q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))), color: 'goldDeep', mesh });
  for (let k = 0; k < blades; k++) {
    const a = (k / blades) * Math.PI * 2;
    const dir = V([Math.cos(a), Math.sin(a), 0]).applyQuaternion(q);
    const nrm = V([0, 0, 1]).applyQuaternion(q).applyAxisAngle(dir, 0.45);
    B.add(blade(r, 0.42 * r / 2.4, 0.08), { pos: center, quat: surfaceQuat(nrm.toArray(), dir.toArray()), color: k % 2 ? 'canvasRed' : 'canvas', mesh });
  }
}

function build(B) {
  // --- hull, keel, trim ---
  B.add(hull(), { color: 'paint' });
  const keel = loft({ points: [0.04, 0.2, 0.4, 0.6, 0.8, 0.93, 0.985].map((t) => [0, deckY(t) - depth(t) - 0.15, zAt(t)]), rx: () => 0.6, ry: () => 0.6, rings: 24, seg: 8 });
  B.add(keel, { color: 'woodDark' });
  for (const side of [-1, 1]) {
    const pts = [], pts2 = [];
    for (let i = 0; i <= 12; i++) { const t = 0.02 + i * 0.08; pts.push([side * (halfW(t) + 0.05), deckY(t) - 0.15, zAt(t)]); pts2.push([side * (halfW(t) * 0.97 + 0.08), deckY(t) - 2.6, zAt(t)]); }
    B.add(loft({ points: pts, rx: () => 0.38, ry: () => 0.38, rings: 40, seg: 8 }), { color: 'gold' });
    B.add(loft({ points: pts2, rx: () => 0.22, ry: () => 0.22, rings: 40, seg: 6 }), { color: 'goldDeep' });
    // portholes
    for (const t of [0.25, 0.4, 0.55, 0.7]) {
      const p = [side * (halfW(t) * 0.94), deckY(t) - 1.4, zAt(t)];
      const tor = torus(0.55, 0.14, 6, 14); tor.rotateY(Math.PI / 2);
      B.add(tor, { pos: p, color: 'gold' });
      B.add(ell(0.08, 0.5, 0.5, 8, 10), { pos: p, mesh: 'Lamp' });
    }
  }
  // deck planks
  for (let k = -6; k <= 6; k++) {
    const x = k * 1.08;
    let t0 = 0, t1 = 1;
    while (t0 < 1 && halfW(t0) * 0.93 < Math.abs(x) + 0.55) t0 += 0.005;
    while (t1 > 0 && halfW(t1) * 0.93 < Math.abs(x) + 0.55) t1 -= 0.005;
    if (t1 - t0 < 0.05) continue;
    const pts = [];
    for (let i = 0; i <= 8; i++) { const t = t0 + (t1 - t0) * (i / 8); pts.push([x, deckY(t) + 0.06, zAt(t)]); }
    B.add(loft({ points: pts, rx: () => 0.5, ry: () => 0.09, rings: 20, seg: 4 }), { color: k % 3 === 0 ? 'woodLight' : (k % 2 ? 'wood' : 'woodDark') });
  }
  // railing: posts + top rail following the gunwale
  for (const side of [-1, 1]) {
    const top = [];
    for (let i = 0; i <= 18; i++) {
      const t = 0.03 + i * 0.052, x = side * (halfW(t) - 0.35), y = deckY(t);
      B.add(cyl(0.16, 0.2, 2.2, 8), { pos: [x, y + 1.1, zAt(t)], color: 'woodDark' });
      top.push([x, y + 2.25, zAt(t)]);
    }
    B.add(loft({ points: top, rx: () => 0.26, ry: () => 0.2, rings: 50, seg: 8 }), { color: 'wood' });
  }

  // --- bow: bowsprit, figurehead crystal ---
  B.add(cyl(0.35, 0.6, 9, 10), { pos: [0, 11.8, -33.5], quat: quatTo([0, 0.45, -1]), color: 'woodDark' });
  B.add(cone(0.42, 1.4, 10), { pos: [0, 13.9, -38], quat: quatTo([0, 0.45, -1]), color: 'gold' });
  B.add(crystal(0.9, 3.0), { pos: [0, 9.6, -30.2], quat: quatTo([0, 0.6, -1]), mesh: 'Glow' });

  // --- stern cabin and helm ---
  const cy = deckY(0.12);
  B.add(box(9, 4.6, 6), { pos: [0, cy + 2.3, 19.5], color: 'woodLight' });
  B.add(box(9.6, 0.5, 6.6), { pos: [0, cy + 0.25, 19.5], color: 'woodDark' });
  const roof = new THREE.CylinderGeometry(5.6, 5.6, 7.2, 3, 1); roof.rotateX(Math.PI / 2); roof.rotateZ(Math.PI / 2); roof.scale(0.62, 0.5, 1);
  B.add(roof, { pos: [0, cy + 5.6, 19.5], rot: [0, 0, Math.PI / 2], color: 'canvasRed' });
  for (const x of [-2.6, 0, 2.6]) {
    B.add(box(1.4, 1.6, 0.2), { pos: [x, cy + 2.8, 16.45], color: 'gold' });
    B.add(box(1.1, 1.3, 0.25), { pos: [x, cy + 2.8, 16.4], mesh: 'Lamp' });
  }
  B.add(box(1.8, 3.2, 0.25), { pos: [0, cy + 1.6, 16.4], color: 'woodDark' });
  B.add(cyl(0.3, 0.4, 1.6, 8), { pos: [0, deckY(0.3) + 0.8, 12], color: 'woodDark' });
  const wheel = torus(1.2, 0.16, 6, 18);
  B.add(wheel, { pos: [0, deckY(0.3) + 2.1, 11.7], color: 'wood' });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; B.add(cyl(0.08, 0.08, 3.0, 5), { pos: [0, deckY(0.3) + 2.1, 11.7], rot: [0, 0, a], color: 'woodDark' }); }

  // --- balloon: striped gores, nose cap, tail fins ---
  const BY = 31, BZ = -1, gores = 10;
  for (let k = 0; k < gores; k++) {
    const g = new THREE.SphereGeometry(1, 4, 18, (k / gores) * Math.PI * 2, (1 / gores) * Math.PI * 2);
    g.rotateX(Math.PI / 2); g.scale(10, 8.2, 24);
    B.add(g, { pos: [0, BY, BZ], color: k % 2 ? 'canvasRed' : 'canvas' });
  }
  for (const z of [BZ - 23.6, BZ + 23.6]) B.add(ell(1.4, 1.4, 0.8, 12, 8), { pos: [0, BY, z], color: 'gold' });
  for (const z of [BZ - 12, BZ, BZ + 12]) {
    const ring = torus(1, 0.05, 6, 40); const k = Math.sqrt(1 - (z - BZ) ** 2 / 24 ** 2);
    ring.scale(10.1 * k, 8.3 * k, 1);
    B.add(ring, { pos: [0, BY, z], color: 'goldDeep' });
  }
  for (const [nx, ny] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
    const base = [nx * 4.5, BY + ny * 3.6, BZ + 19];
    const d = V([nx * 0.7, ny * 0.7, 1]).normalize();
    B.add(blade(7.5, 3.0, 0.3), { pos: base, quat: surfaceQuat(nx ? [0, 1, 0] : [1, 0, 0], d.toArray()), color: 'paint' });
    B.add(blade(5.0, 1.3, 0.34), { pos: V(base).addScaledVector(d, 1.5).toArray(), quat: surfaceQuat(nx ? [0, 1, 0] : [1, 0, 0], d.toArray()), color: 'gold' });
  }
  // gondola straps + ropes from balloon to the rails
  for (const side of [-1, 1]) for (const t of [0.18, 0.36, 0.54, 0.72]) {
    const a = [side * (halfW(t) - 0.4), deckY(t) + 2.2, zAt(t)];
    const zb = zAt(t) * 0.8 + BZ * 0.2;
    const b = [side * 6.2, BY - 5.2 * Math.sqrt(Math.max(0.1, 1 - ((zb - BZ) / 24) ** 2)), zb];
    const mid = V(a).lerp(V(b), 0.5), len = V(a).distanceTo(V(b));
    B.add(cyl(0.09, 0.09, len, 5), { pos: mid.toArray(), quat: quatTo(V(b).sub(V(a)).toArray()), color: 'rope' });
  }
  // masts holding the balloon
  for (const z of [-14, 8]) {
    B.add(cyl(0.45, 0.6, BY - 6 - deckY(0.5), 10), { pos: [0, (BY - 6 + deckY(0.5)) / 2, z], color: 'woodDark' });
    B.add(box(10, 0.5, 0.6), { pos: [0, BY - 6.6, z], color: 'woodDark' });
  }

  // --- side wings with propellers ---
  for (const side of [-1, 1]) {
    const root = [side * 7.6, 10.5, 2];
    B.add(blade(9.5, 3.2, 0.35), { pos: root, quat: surfaceQuat([0, 1, 0.05], [side, 0.12, 0.2]), color: 'canvas' });
    B.add(loft({ points: [root, [side * 12, 11.0, 2.8], [side * 16.6, 11.6, 3.4]], rx: () => 0.3, ry: () => 0.3, rings: 12, seg: 8 }), { color: 'woodDark' });
    const nac = [side * 16.8, 11.6, 3.0];
    const n = cyl(0.8, 1.1, 3.4, 12); n.rotateX(Math.PI / 2);
    B.add(n, { pos: nac, color: 'metal' });
    B.add(torus(0.95, 0.15, 6, 16), { pos: [nac[0], nac[1], nac[2] - 1.5], color: 'gold' });
    propeller(B, side < 0 ? 'PropL' : 'PropR', [nac[0], nac[1], nac[2] + 2.0], [0, 0, 1], 2.4);
  }
  // stern engine + big propeller
  const se = [0, 9.2, 28.2];
  const eng = cyl(1.3, 1.7, 3.6, 14); eng.rotateX(Math.PI / 2);
  B.add(eng, { pos: se, color: 'metalDark' });
  B.add(torus(1.45, 0.22, 6, 18), { pos: [0, 9.2, 26.6], color: 'gold' });
  propeller(B, 'PropBack', [0, 9.2, 30.5], [0, 0, 1], 4.0, 4);

  // --- lanterns, flag, levitation crystal ---
  for (const [x, z] of [[-6.6, -16], [6.6, -16], [-7.2, 4], [7.2, 4], [-5.6, 16], [5.6, 16]]) {
    const t = (Z0 - z) / (Z0 - Z1), y = deckY(t) + 2.25;
    B.add(cyl(0.08, 0.08, 1.4, 5), { pos: [x, y + 0.7, z], color: 'metalDark' });
    B.add(cyl(0.45, 0.35, 0.25, 8), { pos: [x, y + 1.45, z], color: 'metalDark' });
    B.add(ell(0.38, 0.5, 0.38, 10, 8), { pos: [x, y + 1.95, z], mesh: 'Lamp' });
    B.add(cone(0.5, 0.45, 8), { pos: [x, y + 2.6, z], color: 'metalDark' });
  }
  B.add(cyl(0.15, 0.15, 6, 6), { pos: [0, cy + 9, 21], color: 'metalDark' });
  B.add(blade(3.6, 1.1, 0.12), { pos: [0, cy + 11.3, 21], quat: surfaceQuat([1, 0, 0], [0, -0.1, 1]), color: 'gold' });
  B.add(crystal(1.6, 4.6), { pos: [0, 2.4, -2], rot: [Math.PI, 0, 0], mesh: 'Glow' });
  B.add(torus(1.9, 0.3, 6, 18), { pos: [0, 1.7, -2], rot: [Math.PI / 2, 0, 0], color: 'gold' });
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4; B.add(crystal(0.5, 1.8), { pos: [Math.cos(a) * 1.9, 1.4, -2 + Math.sin(a) * 1.9], quat: quatTo([Math.cos(a), -1, Math.sin(a)]), mesh: 'Glow' }); }
}

export default {
  name: 'Skyship', category: 'Skyship', palette, glow, build,
  parts: { PropL: { pivot: [-16.8, 11.6, 5.0] }, PropR: { pivot: [16.8, 11.6, 5.0] }, PropBack: { pivot: [0, 9.2, 30.5] } },
  bg: '#1b2433', rim: '#9fd6ff', view: [-1.15, 0.42, -0.95], fit: 0.6, heroSize: [1200, 860], loopSeconds: 1.6, frames: 24, outlineWidth: 0.12,
  animate(meshes, group, u) {
    const a = u * Math.PI * 2;
    meshes.PropL.rotation.z = a * 3; meshes.PropR.rotation.z = -a * 3; meshes.PropBack.rotation.z = a * 2;
    group.position.y = Math.sin(a) * 0.6; group.rotation.z = Math.sin(a) * 0.02; group.rotation.x = Math.cos(a) * 0.012;
  },
};
