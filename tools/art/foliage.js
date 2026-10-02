// Stylized (Zelda / Ghibli style) foliage: puffy clumps covered in overlapping leaf cards.
// The trick that sells it: every leaf takes the normal of the clump it sits on, bent out
// from the tree centre ("spherized" normals), so the canopy shades as a few soft volumes
// instead of hundreds of flickering cards. Leaves are solid geometry (no alpha), two-sided,
// 8 tris each, and the custom normals ship in the GLB.
import * as THREE from 'three';

const v3 = (a) => (a.isVector3 ? a.clone() : new THREE.Vector3(...a));
export const seeded = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };

// Collects triangles per colour so a whole canopy is a handful of Builder.add calls.
class Batch {
  constructor() { this.byColor = new Map(); }
  tri(color, a, b, c, na, nb, nc) {
    let e = this.byColor.get(color); if (!e) this.byColor.set(color, (e = { p: [], n: [] }));
    e.p.push(...a.toArray(), ...b.toArray(), ...c.toArray()); e.n.push(...na.toArray(), ...nb.toArray(), ...nc.toArray());
  }
  flush(B, opts = {}) {
    for (const [color, e] of this.byColor) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(e.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(e.n, 3));
      B.add(g, { ...opts, color, noOutline: true });
    }
    this.byColor.clear();
  }
}

// One cupped leaf card: base at o, tip along dir, lying across side, bulging along up.
// Front and back faces both carry `normal` (the clump normal), so neither side goes dark.
function leaf(batch, color, o, dir, side, up, len, wid, normal) {
  const P = (x, y, z) => o.clone().addScaledVector(dir, x).addScaledVector(side, y).addScaledVector(up, z);
  const b = P(0, 0, 0), t = P(len, 0, len * 0.08), m = P(len * 0.45, 0, 0);
  const l1 = P(len * 0.25, wid * 0.85, wid * 0.3), l2 = P(len * 0.68, wid * 0.8, wid * 0.32), r1 = P(len * 0.25, -wid * 0.85, wid * 0.3), r2 = P(len * 0.68, -wid * 0.8, wid * 0.32);
  const back = up.clone().multiplyScalar(-0.012);
  const n = normal;
  for (const [a, c, d] of [[b, r1, m], [r1, r2, m], [r2, t, m], [t, l2, m], [l2, l1, m], [l1, b, m]]) {
    batch.tri(color, a, c, d, n, n, n);
    batch.tri(color, a.clone().add(back), d.clone().add(back), c.clone().add(back), n, n, n);
  }
}

// Spherized normal: mostly away from the clump centre, partly away from the tree centre.
const sphNormal = (p, clumpC, treeC, k = 0.35) => p.clone().sub(clumpC).normalize().multiplyScalar(1 - k).add(p.clone().sub(treeC).normalize().multiplyScalar(k)).normalize();

/**
 * Leafy canopy over a set of clumps.
 * blobs: [[x, y, z, r], ...]   shades: palette keys dark -> light (>= 3)
 * count: leaf cards   size: [len, width] of a card (studs)
 */
// cardMesh: put the leaf cards on their own (moving) part, e.g. 'Rustle', while the core stays solid.
export function canopy(B, { blobs, shades, count = 500, size = [1.1, 0.5], seed = 1, droop = 0.55, flare = 0.45, core = true, centre, add = {}, extra, cardMesh }) {
  const rnd = seeded(seed), batch = new Batch(), cards = cardMesh ? new Batch() : batch;
  const C = blobs.map(([x, y, z, r]) => ({ c: new THREE.Vector3(x, y, z), r }));
  const treeC = centre ? v3(centre) : C.reduce((s, b) => s.add(b.c.clone().multiplyScalar(b.r ** 2)), new THREE.Vector3()).divideScalar(C.reduce((s, b) => s + b.r ** 2, 0));
  let y0 = Infinity, y1 = -Infinity; for (const b of C) { y0 = Math.min(y0, b.c.y - b.r); y1 = Math.max(y1, b.c.y + b.r); }
  // Baked painterly light: each clump is lit like a ball from the upper front-left, plus a
  // little height falloff, plus small jitter. Gives the light-top / dark-underside Zelda look.
  const L = new THREE.Vector3(-0.45, 0.8, -0.4).normalize();
  const shadeAt = (p, n, jitter) => {
    const h = (p.y - y0) / (y1 - y0), lit = n.dot(L) * 0.5 + 0.5;
    const s = Math.min(0.999, Math.max(0, 0.68 * lit + 0.27 * h + (jitter - 0.5) * 0.16 - 0.04));
    return shades[Math.floor(s * shades.length)];
  };
  // dark core so gaps between cards read as depth, never as holes
  if (core) {
    for (const b of C) {
      const g = new THREE.IcosahedronGeometry(b.r * 0.86, b.r < 0.8 ? 1 : 2), P = g.attributes.position;
      for (let i = 0; i < P.count; i += 3) {
        const pts = [0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(P, i + k).add(b.c));
        const ns = pts.map((p) => sphNormal(p, b.c, treeC));
        const mid = pts[0].clone().add(pts[1]).add(pts[2]).divideScalar(3);
        const col = mid.y < b.c.y - b.r * 0.2 ? shades[0] : shades[Math.min(1, shades.length - 1)];
        batch.tri(col, pts[0], pts[1], pts[2], ns[0], ns[1], ns[2]);
      }
    }
  }
  const area = C.map((b) => b.r * b.r), total = area.reduce((a, b) => a + b, 0);
  let made = 0, tries = 0;
  while (made < count && tries++ < count * 20) {
    let k = 0, x = rnd() * total; while (x > area[k]) x -= area[k++];
    const b = C[k];
    const z = rnd() * 2 - 1, a = rnd() * Math.PI * 2, rr = Math.sqrt(1 - z * z);
    const d = new THREE.Vector3(rr * Math.cos(a), z, rr * Math.sin(a));
    if (d.y < -0.55 && rnd() < 0.6) continue; // fewer leaves underneath
    const p = b.c.clone().addScaledVector(d, b.r * (0.94 + rnd() * 0.1));
    if (C.some((o, j) => j !== k && p.distanceTo(o.c) < o.r * 0.86)) continue; // buried in a neighbour
    const n = sphNormal(p, b.c, treeC);
    // leaves hang a little (droop), with a random twist, and lift their tips off the surface (flare)
    const down = new THREE.Vector3(0, -1, 0), t = down.clone().addScaledVector(n, -down.dot(n));
    const rand = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5); rand.addScaledVector(n, -rand.dot(n));
    const dir = (t.lengthSq() > 1e-4 ? t.normalize().multiplyScalar(droop) : new THREE.Vector3()).add(rand.normalize().multiplyScalar(1 - droop)).normalize();
    const up = n.clone().addScaledVector(dir, -flare).normalize();
    const side = new THREE.Vector3().crossVectors(up, dir).normalize();
    dir.crossVectors(side, up).normalize();
    const s = 0.75 + rnd() * 0.5, len = size[0] * s, wid = size[1] * s;
    const o = p.clone().addScaledVector(dir, -len * 0.3);
    leaf(cards, shadeAt(p, n, rnd()), o, dir, side, up, len, wid, n);
    made++;
  }
  if (extra) extra({ blobs: C, treeC, rnd, surface: (k) => {
    const b = C[k ?? Math.floor(rnd() * C.length)], z = rnd() * 1.4 - 0.4, a = rnd() * Math.PI * 2, rr = Math.sqrt(1 - z * z);
    const d = new THREE.Vector3(rr * Math.cos(a), z, rr * Math.sin(a)); return { p: b.c.clone().addScaledVector(d, b.r * 1.13), n: d };
  } });
  batch.flush(B, add);
  if (cardMesh) cards.flush(B, { ...add, mesh: cardMesh });
}

/**
 * Stylized conifer: stacked skirts, each a cone core with drooping needle clumps on the rim
 * and over its surface. Optional snow caps with a scalloped edge.
 */
export function conifer(B, { height = 13, tiers = 5, radius = 3.6, shades, snow, seed = 3, trunkColor }) {
  const rnd = seeded(seed), batch = new Batch();
  const top = height, base = height * 0.18;
  B.add(new THREE.CylinderGeometry(0.32, 0.62, height * 0.45, 9), { pos: [0, height * 0.22, 0], color: trunkColor });
  for (let i = 0; i < tiers; i++) {
    const f = i / tiers, R = radius * (1 - f * 0.78), yb = base + f * (top - base) * 0.86, h = (top - base) * 0.34 * (1 - f * 0.35), apex = new THREE.Vector3(0, yb + h, 0);
    const shift = (i % 2 ? 1 : 0) * 0.5;
    const nrm = (p) => { const rad = new THREE.Vector3(p.x, 0, p.z).normalize(); return rad.multiplyScalar(0.75).add(new THREE.Vector3(0, 0.75, 0)).normalize(); };
    const seg = 14, ring = [];
    for (let k = 0; k < seg; k++) { const a = (k / seg) * Math.PI * 2 + shift; ring.push(new THREE.Vector3(Math.cos(a) * R * 0.9, yb + Math.sin(a * 3 + i) * 0.12, Math.sin(a) * R * 0.9)); }
    for (let k = 0; k < seg; k++) {
      const a = ring[k], b = ring[(k + 1) % seg], cb = new THREE.Vector3(0, yb + h * 0.1, 0);
      batch.tri(shades[0], apex, b, a, nrm(apex.clone().add(a.clone().add(b).multiplyScalar(0.5)).multiplyScalar(0.5)), nrm(b), nrm(a));
      batch.tri(shades[0], cb, a, b, new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0));
    }
    // needle clumps: a drooping fringe on the rim, then shingles up the slope
    const rim = Math.round(16 + R * 7), surf = Math.round(10 + R * 8);
    for (let j = 0; j < rim + surf; j++) {
      const onRim = j < rim, a = onRim ? (j / rim) * Math.PI * 2 + rnd() * 0.2 : rnd() * Math.PI * 2, u = onRim ? 0.02 + rnd() * 0.08 : 0.15 + rnd() * 0.75;
      const rad = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const p = rad.clone().multiplyScalar(R * (1 - u) * 0.95).add(new THREE.Vector3(0, yb + h * u, 0));
      const n = nrm(p);
      const dir = rad.clone().multiplyScalar(onRim ? 0.75 : 0.9).add(new THREE.Vector3(0, onRim ? -0.65 : -(h / R) * 0.9, 0)).normalize();
      const upv = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(-rad.z, 0, rad.x)).normalize().negate();
      const side = new THREE.Vector3().crossVectors(upv, dir).normalize();
      const len = (onRim ? 1.25 : 1.0) * (0.8 + rnd() * 0.4) * Math.max(0.55, R / radius + 0.25), wid = len * 0.36;
      const hgt = (p.y - base) / (top - base), s = Math.min(0.999, Math.max(0, 0.35 + 0.45 * hgt + (onRim ? -0.2 : 0.1) + (rnd() - 0.5) * 0.3));
      leaf(batch, shades[1 + Math.floor(s * (shades.length - 1))] || shades[shades.length - 1], p.clone().addScaledVector(dir, -len * 0.25), dir, side, upv, len, wid, n);
    }
    if (snow) {
      // scalloped snow cap over the top 60% of the skirt
      const sseg = 18, sy = yb + h * 0.38, sR = R * 0.66, cap = [];
      for (let k = 0; k < sseg; k++) { const a = (k / sseg) * Math.PI * 2 + shift, wob = 1 + 0.12 * Math.sin(a * 6 + i); cap.push(new THREE.Vector3(Math.cos(a) * sR * wob, sy - 0.18 * Math.abs(Math.sin(a * 3 + i)) + 0.05, Math.sin(a) * sR * wob)); }
      const sApex = apex.clone().add(new THREE.Vector3(0, 0.12, 0)), up = new THREE.Vector3(0, 1, 0);
      for (let k = 0; k < sseg; k++) {
        const a = cap[k], b = cap[(k + 1) % sseg];
        batch.tri(snow[0], sApex, b, a, up, nrm(b).add(up).normalize(), nrm(a).add(up).normalize());
      }
      for (let j = 0; j < Math.round(R * 5); j++) {
        const a = rnd() * Math.PI * 2, rad = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
        const p = rad.clone().multiplyScalar(R * 0.88).add(new THREE.Vector3(0, yb + 0.18, 0)), dir = rad.clone().add(new THREE.Vector3(0, -0.25, 0)).normalize();
        const side = new THREE.Vector3(-rad.z, 0, rad.x), upv = new THREE.Vector3().crossVectors(dir, side).normalize().negate();
        leaf(batch, snow[j % snow.length], p.clone().addScaledVector(dir, -0.3), dir, side, upv, 0.8, 0.38, new THREE.Vector3(0, 1, 0));
      }
    }
  }
  // top tuft
  const tip = new THREE.Vector3(0, top + 0.2, 0);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2, rad = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), dir = rad.clone().multiplyScalar(0.35).add(new THREE.Vector3(0, 1, 0)).normalize();
    const side = new THREE.Vector3(-rad.z, 0, rad.x), upv = new THREE.Vector3().crossVectors(side, dir).normalize();
    leaf(batch, snow ? snow[0] : shades[shades.length - 1], tip.clone().addScaledVector(dir, -0.7), dir, side, upv, 1.1, 0.3, dir);
  }
  batch.flush(B);
}

export { Batch, leaf, sphNormal };
