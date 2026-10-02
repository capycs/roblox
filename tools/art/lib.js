// Shared building blocks for procedural, cartoony creatures.
// Every creature is a set of skinned meshes sharing one skeleton. Body samples a
// one-row palette texture; the other meshes are flat glow colours (Neon in Roblox).
// Units are studs. Models face -Z (Roblox forward); +X is the creature's right.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const V = (a) => new THREE.Vector3(...a);
export const SIDES = [['L', -1], ['R', 1]];
export const env = (t) => Math.pow(Math.sin(Math.PI * Math.min(Math.max(t, 0.001), 0.999)), 0.42);
const bump = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
// Limb radius along its length: full at the shoulder/thigh, a slight knee, a slim ankle.
export const limbR = (top, bot) => (t) => (bot + (top - bot) * (1 - ss(0.0, 0.5, t))) * (1 + 0.07 * bump(t, 0.52, 0.1) - 0.1 * bump(t, 0.82, 0.09)) * Math.sqrt(Math.sin(Math.PI * Math.min(Math.max(t, 0.001), 0.999)));

export function paletteCanvas(palette) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 16;
  const g = c.getContext('2d');
  g.fillStyle = '#ff00ff'; g.fillRect(0, 0, 256, 16);
  palette.forEach(([, hex], i) => { g.fillStyle = hex; g.fillRect(i * 16, 0, 16, 16); });
  return c;
}

export const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function ell(rx, ry, rz, w = 14, h = 10) {
  const g = new THREE.SphereGeometry(1, w, h); g.scale(rx, ry, rz); return g;
}
export function cone(r, h, seg = 10, flatten = 1) {
  const g = new THREE.ConeGeometry(r, h, seg, 3); g.scale(1, 1, flatten); return g;
}
// Narrow an ellipsoid toward -Z (for snouts).
export function taperFront(g, k) {
  g.computeBoundingBox(); const bb = g.boundingBox, P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const f = Math.max(0, -P.getZ(i) / -bb.min.z);
    P.setX(i, P.getX(i) * (1 - k * f)); P.setY(i, P.getY(i) * (1 - k * 0.6 * f));
  }
  g.computeVertexNormals(); return g;
}
// Quaternion whose local Z is the surface normal n and local X runs along dir.
export function surfaceQuat(n, dir) {
  const z = V(n).normalize(), d = V(dir);
  const x = d.sub(z.clone().multiplyScalar(d.dot(z))).normalize();
  const y = new THREE.Vector3().crossVectors(z, x);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}
export const quatTo = (d) => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), V(d).normalize());

// Lofted tube along a curve with elliptical rings. Used for torso, neck and tail.
export function loft({ points, rx, ry, rings = 30, seg = 18 }) {
  const curve = new THREE.CatmullRomCurve3(points.map(V));
  const X = new THREE.Vector3(1, 0, 0);
  const pos = [], ts = [], centers = [], idx = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings, c = curve.getPoint(t), tan = curve.getTangent(t);
    const up = new THREE.Vector3().crossVectors(tan, X).normalize();
    const sd = new THREE.Vector3().crossVectors(up, tan).normalize();
    for (let j = 0; j < seg; j++) {
      const th = (j / seg) * Math.PI * 2;
      const p = c.clone().addScaledVector(sd, Math.cos(th) * rx(t)).addScaledVector(up, Math.sin(th) * ry(t));
      pos.push(p.x, p.y, p.z); ts.push(t); centers.push(c);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + ((j + 1) % seg), c = a + seg, d = b + seg;
    idx.push(a, c, b, b, c, d);
  }
  const s0 = pos.length / 3; const c0 = curve.getPoint(0); pos.push(c0.x, c0.y, c0.z); ts.push(0); centers.push(c0);
  const s1 = s0 + 1; const c1 = curve.getPoint(1); pos.push(c1.x, c1.y, c1.z); ts.push(1); centers.push(c1);
  for (let j = 0; j < seg; j++) {
    idx.push(s0, j, (j + 1) % seg);
    const o = rings * seg; idx.push(s1, o + ((j + 1) % seg), o + j);
  }
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  // make sure normals face outward
  const n = g.attributes.normal, P = g.attributes.position; let dot = 0;
  for (let i = 0; i < s0; i++) dot += n.getX(i) * (P.getX(i) - centers[i].x) + n.getY(i) * (P.getY(i) - centers[i].y) + n.getZ(i) * (P.getZ(i) - centers[i].z);
  if (dot < 0) {
    for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
    g.setIndex(idx); g.computeVertexNormals();
  }
  g.userData.t = ts; g.userData.curve = curve;
  return g;
}

// Three-lobed, twisting flame tongue pointing up +Y from y=0 to y=h.
export function flame(r, h, { rings = 16, seg = 15, twist = 2.2, lean = 0.18 } = {}) {
  const pos = [], idx = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const prof = t < 0.28 ? Math.sin((t / 0.28) * Math.PI / 2) : Math.pow(1 - (t - 0.28) / 0.72, 1.25);
    for (let j = 0; j < seg; j++) {
      const th = (j / seg) * Math.PI * 2;
      const rr = r * Math.max(prof, 0.0001) * (1 + 0.22 * Math.sin(3 * th));
      const a = th + twist * t;
      pos.push(Math.cos(a) * rr + lean * h * t * t, t * h, Math.sin(a) * rr + 0.06 * h * Math.sin(t * 5));
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + ((j + 1) % seg), c = a + seg, d = b + seg;
    idx.push(a, b, c, b, d, c);
  }
  const bot = pos.length / 3; pos.push(0, 0, 0);
  for (let j = 0; j < seg; j++) idx.push(bot, (j + 1) % seg, j);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------- builder ----------
export class Builder {
  constructor(boneIndex, cell, meshNames, textured = ['Body'], warp = null) { this.bi = boneIndex; this.cell = cell; this.textured = new Set(textured); this.warp = warp; this.parts = Object.fromEntries(meshNames.map((n) => [n, []])); }
  add(geo, { pos = [0, 0, 0], rot = [0, 0, 0], quat, scale = [1, 1, 1], color = 'fur', mesh = 'Body', bone = 'Root', weights, noOutline = false }) {
    if (!geo.index) geo.setIndex([...Array(geo.attributes.position.count).keys()]);
    const q = quat || new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot, 'XYZ'));
    geo.applyMatrix4(new THREE.Matrix4().compose(V(pos), q, V(scale)));
    const P = geo.attributes.position, n = P.count;
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', P.clone());
    out.setAttribute('normal', geo.attributes.normal.clone());
    out.setIndex(geo.index.clone());
    const uv = new Float32Array(n * 2), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    const p = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const tex = this.textured.has(mesh);
      if (tex && !(color in this.cell)) throw new Error('unknown color ' + color);
      uv[i * 2] = tex ? this.cell[color] : 0.5; uv[i * 2 + 1] = 0.5;
      p.fromBufferAttribute(P, i);
      let w = weights ? weights(p, i, geo) : [[bone, 1]];
      w = w.filter(([, x]) => x > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const tot = w.reduce((s, [, x]) => s + x, 0);
      w.forEach(([b, x], k) => {
        if (!(b in this.bi)) throw new Error('unknown bone ' + b);
        si[i * 4 + k] = this.bi[b]; sw[i * 4 + k] = x / tot;
      });
    }
    out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    // preview-only: leaf/wool cards opt out of the inverted-hull outline (stripped before export)
    out.setAttribute('outlineK', new THREE.BufferAttribute(new Float32Array(n).fill(noOutline ? 0 : 1), 1));
    if (this.warp) {
      const OP = out.attributes.position, q = new THREE.Vector3();
      for (let i = 0; i < n; i++) { q.fromBufferAttribute(OP, i); this.warp(q); OP.setXYZ(i, q.x, q.y, q.z); }
      out.computeVertexNormals();
    }
    out.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
    out.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    if (!this.parts[mesh]) throw new Error('unknown mesh ' + mesh);
    this.parts[mesh].push(out);
  }
}

// Smooth blend between bones along a scalar (stops sorted ascending).
export function blend(stops, s) {
  if (s <= stops[0][0]) return [[stops[0][1], 1]];
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, A] = stops[i], [b, B] = stops[i + 1];
    if (s <= b) { const t = ss(a, b, s); return [[A, 1 - t], [B, t]]; }
  }
  return [[stops[stops.length - 1][1], 1]];
}

// Builds the skeleton, runs the species' part builder and merges each mesh.
export function buildCreature(spec, materialFor) {
  const world = Object.fromEntries(spec.bones.map(([n, , p]) => [n, p]));
  // Bones follow the same warp as the mesh (e.g. shorter legs).
  const bw = spec.warp ? Object.fromEntries(Object.entries(world).map(([n, p]) => { const v = V(p); spec.warp(v); return [n, v.toArray()]; })) : world;
  const bones = [], boneMap = {}, boneIndex = {};
  for (const [name, parent, p] of spec.bones) {
    const b = new THREE.Bone(); b.name = name;
    const pw = bw[name], pp = parent ? bw[parent] : [0, 0, 0];
    b.position.set(pw[0] - pp[0], pw[1] - pp[1], pw[2] - pp[2]);
    if (parent) boneMap[parent].add(b);
    boneIndex[name] = bones.length; bones.push(b); boneMap[name] = b;
  }
  const cell = Object.fromEntries(spec.palette.map(([k], i) => [k, (i + 0.5) / 16]));
  const meshNames = ['Body', ...Object.keys(spec.glow)];
  const B = new Builder(boneIndex, cell, meshNames, ['Body'], spec.warp || null);
  spec.build(B, world);

  const group = new THREE.Group(); group.name = spec.name;
  group.add(bones[0]);
  group.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  const meshes = {}, stats = { meshes: {}, bones: bones.length };
  for (const [name, list] of Object.entries(B.parts)) {
    if (!list.length) continue;
    const geo = mergeGeometries(list, false);
    geo.computeBoundingSphere(); geo.computeBoundingBox();
    geo.name = name;
    const m = new THREE.SkinnedMesh(geo, materialFor(name));
    m.name = name;
    group.add(m);
    m.bind(skeleton, new THREE.Matrix4());
    meshes[name] = m;
    stats.meshes[name] = { tris: geo.index.count / 3, verts: geo.attributes.position.count };
  }
  return { group, bones, boneMap, skeleton, meshes, stats };
}

// ---------- shared rigs and parts for the creature roster ----------

// Standard quadruped skeleton (same bone names as Emberfang, so one pose set drives all).
// Points are [y, z] on the centre line, or [x, y, z] for paired bones (x = right side).
export function quadBones(P) {
  const b = [
    ['Root', null, [0, 0, 0]],
    ['Hips', 'Root', [0, ...P.hips]], ['Spine', 'Hips', [0, ...P.spine]], ['Chest', 'Spine', [0, ...P.chest]],
    ['Neck', 'Chest', [0, ...P.neck]], ['Head', 'Neck', [0, ...P.head]], ['Jaw', 'Head', [0, ...P.jaw]],
    ['EarL', 'Head', [-P.ear[0], P.ear[1], P.ear[2]]], ['EarR', 'Head', [...P.ear]],
  ];
  const tn = ['Tail1', 'Tail2', 'Tail3', 'Tail4', P.tip || 'TailTip'];
  tn.forEach((n, i) => b.push([n, i ? tn[i - 1] : 'Hips', [0, ...P.tail[i]]]));
  for (const [s, x] of SIDES) {
    for (const [k, par, L] of [['Front', 'Chest', P.front], ['Back', 'Hips', P.back]]) {
      b.push([`${k}${s}Upper`, par, [L.x * x, ...L.upper]]);
      b.push([`${k}${s}Lower`, `${k}${s}Upper`, [L.x * x, ...L.lower]]);
      b.push([`${k}${s}Paw`, `${k}${s}Lower`, [L.x * x, ...L.paw]]);
    }
    if (P.wing) {
      const W = P.wing, m = (p) => [p[0] * x, p[1], p[2]];
      b.push([`Wing${s}Upper`, 'Chest', m(W.upper)], [`Wing${s}Lower`, `Wing${s}Upper`, m(W.lower)], [`Wing${s}Tip`, `Wing${s}Lower`, m(W.tip)]);
    }
  }
  return b;
}

// Tapered limb blended Upper -> Lower -> Paw by height. ys = [paw, lowerBottom, lowerTop, upper].
export function addLimb(B, kind, s, pts, top, bot, color, ys, depth = 1.08) {
  const w = (p) => blend([[ys[0], `${kind}${s}Paw`], [ys[1], `${kind}${s}Lower`], [ys[2], `${kind}${s}Lower`], [ys[3], `${kind}${s}Upper`]], p.y);
  B.add(loft({ points: pts, rx: limbR(top, bot), ry: limbR(top * depth, bot * depth), rings: 18, seg: 12 }), { color, weights: w });
}

// Glowing eye on a head, with pupil (slit or round), highlight and an optional brow.
export function addEye(B, x, e, o = {}) {
  const th = o.th ?? -0.36 * x, f = [-Math.sin(th), 0, -Math.cos(th)];
  const [rx, ry, rz] = o.r || [0.27, 0.31, 0.14];
  const bone = o.bone || 'Head';
  B.add(ell(rx, ry, rz, 16, 12), { pos: e, rot: [0, th, o.tilt ? o.tilt * x : 0], mesh: 'Eyes', bone });
  const pr = o.pupil || [0.075, 0.19];
  B.add(ell(pr[0], pr[1], 0.06, 10, 8), { pos: [e[0] + f[0] * (rz - 0.015) - 0.025 * x, e[1] - 0.01, e[2] + f[2] * (rz - 0.015)], rot: [0, th, 0], color: o.pupilColor || 'pupil', bone });
  B.add(ell(0.055, 0.055, 0.04, 8, 6), { pos: [e[0] + f[0] * rz + (o.lid ? 0.1 : 0.07) * x * rx / 0.27, e[1] + (o.lid ? 0.0 : 0.11) * ry / 0.31, e[2] + f[2] * rz], rot: [0, th, 0], color: o.white || 'white', bone });
  if (o.lid) {
    // upper lid: a cap of the eye shape in the body colour, closing the top of the eye a little
    const lid = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, o.lidAngle ?? 0.95);
    lid.scale(rx * 1.08, ry * 1.06, rz * 1.25);
    B.add(lid, { pos: [e[0], e[1] + 0.005, e[2]], rot: [-(o.lidTilt ?? 0.32), th, (o.lidRoll ?? 0.22) * x], color: o.lid, bone });
  }
  if (o.brow) {
    const br = o.brow;
    B.add(ell(br.len || 0.34, 0.09, 0.16, 12, 8), { pos: [e[0] + 0.02 * x, e[1] + ry + 0.02, e[2] + 0.1], rot: [0, th, (br.tilt ?? 0.38) * x], color: br.color, bone });
  }
}

// A flat leaf / feather blade: long along local X, wide along Y, thin along Z.
export function blade(len, wid, thick = 0.05, seg = 8) {
  const g = new THREE.SphereGeometry(1, seg, 6);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    const u = (x + 1) / 2; // 0 base .. 1 tip
    const w = Math.sin(Math.PI * Math.pow(u, 0.75)) * 0.9 + 0.1;
    P.setXYZ(i, u * len, y * wid * w, z * thick);
  }
  g.computeVertexNormals();
  return g;
}

// Cheap closed leaflet (8 tris): base at origin, tip along +x, flat in XY. Faceted on purpose.
export function leaflet(len, wid, thick = 0.03) {
  const v = [[0, 0, 0], [len, 0, 0], [len * 0.42, wid, 0], [len * 0.42, -wid, 0], [len * 0.42, 0, thick], [len * 0.42, 0, -thick]];
  const f = [[0, 3, 4], [3, 1, 4], [1, 2, 4], [2, 0, 4], [0, 5, 3], [3, 5, 1], [1, 5, 2], [2, 5, 0]];
  const pos = [];
  for (const t of f) for (const i of t) pos.push(...v[i]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals(); return g;
}

// Wing arm points for one side (x sign) from the wing bones.
function wingArm(W, x) {
  const m = (n) => V(W[`Wing${x < 0 ? 'L' : 'R'}${n}`]);
  const S = m('Upper'), E = m('Lower'), Wr = m('Tip');
  const T = Wr.clone().add(Wr.clone().sub(E).multiplyScalar(0.7)).add(V([0, -0.1, 0.5]));
  return { S, E, Wr, T };
}
const wingWeights = (W, x, pad = 0) => {
  const s = x < 0 ? 'L' : 'R', a = wingArm(W, x);
  return (p) => blend([[Math.abs(a.S.x) + 0.15, `Wing${s}Upper`], [Math.abs(a.E.x) - 0.1 + pad, `Wing${s}Upper`], [Math.abs(a.E.x) + 0.2 + pad, `Wing${s}Lower`], [Math.abs(a.Wr.x) - 0.1, `Wing${s}Lower`], [Math.abs(a.Wr.x) + 0.25, `Wing${s}Tip`]], Math.abs(p.x));
};

// Feathered wing (griffin): arm + two layers of feather blades, optional glowing tips.
export function featherWing(B, W, x, o) {
  const { S, E, Wr, T } = wingArm(W, x);
  const ww = wingWeights(W, x);
  const arm = new THREE.CatmullRomCurve3([S, E, Wr, T]);
  B.add(loft({ points: [S, E, Wr, T].map((v) => v.toArray()), rx: (t) => 0.2 * (1 - 0.6 * t) + 0.03, ry: (t) => 0.16 * (1 - 0.6 * t) + 0.03, rings: 24, seg: 10 }), { color: o.arm, weights: ww });
  const n = (o.count || 14);
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i < n; i++) {
      const u = 0.06 + (i / (n - 1)) * 0.92;
      const base = arm.getPoint(u), tan = arm.getTangent(u);
      const back = V([0, -0.05, 1]);
      const dir = back.clone().multiplyScalar(1 - u * 0.75).addScaledVector(tan, u * 0.9).normalize();
      const len = layer ? (0.7 + 0.4 * u) : (1.0 + 1.6 * Math.pow(u, 1.3));
      const wid = layer ? 0.3 : 0.26 + 0.08 * u;
      const nrm = new THREE.Vector3().crossVectors(dir, tan).normalize(); if (nrm.y < 0) nrm.negate();
      const p0 = base.clone().addScaledVector(nrm, layer ? 0.06 : -0.01);
      B.add(blade(len, wid, 0.045), { pos: p0.toArray(), quat: surfaceQuat(nrm.toArray(), dir.toArray()), color: layer ? o.covert : (i % 2 ? o.primary : o.primary2 || o.primary), weights: ww });
      if (!layer && o.tipMesh && i >= n - 6 && i % 2 === 0) {
        const tip = p0.clone().addScaledVector(dir, len * 0.86);
        B.add(blade(len * 0.16, wid * 0.45, 0.05), { pos: tip.toArray(), quat: surfaceQuat(nrm.toArray(), dir.toArray()), mesh: o.tipMesh, weights: ww });
      }
    }
  }
}

// Bat/dragon wing: arm, three finger spars and a thin membrane between them.
export function membraneWing(B, W, x, o) {
  const { S, E, Wr, T } = wingArm(W, x);
  const ww = wingWeights(W, x);
  B.add(loft({ points: [S, E, Wr].map((v) => v.toArray()), rx: (t) => 0.2 * (1 - 0.4 * t) + 0.03, ry: (t) => 0.18 * (1 - 0.4 * t) + 0.03, rings: 18, seg: 10 }), { color: o.arm, weights: ww });
  // finger tips fan back from the wrist
  const tips = [T, Wr.clone().add(V([0.55 * x, -0.45, 1.5])), Wr.clone().add(V([-0.25 * x, -0.65, 1.85]))];
  for (const tp of tips) {
    B.add(loft({ points: [Wr.toArray(), Wr.clone().lerp(tp, 0.5).add(V([0, 0.08, 0])).toArray(), tp.toArray()], rx: (t) => 0.09 * (1 - 0.8 * t) + 0.02, ry: (t) => 0.08 * (1 - 0.8 * t) + 0.02, rings: 10, seg: 8 }), { color: o.arm, weights: ww });
    B.add(cone(0.07, 0.3, 6), { pos: tp.toArray(), quat: quatTo(tp.clone().sub(Wr).toArray()), color: o.claw || o.arm, weights: ww });
  }
  // membrane: outline polygon through shoulder, elbow, wrist, finger tips (scalloped), body side
  const bodyBack = V([S.x * 0.85, S.y - 0.35, S.z + 1.7]);
  const lead = [S, E, Wr, tips[0]];
  const trail = [tips[0], tips[1], tips[2], bodyBack];
  const ring = [];
  const pushLine = (a, b, steps, sag) => { for (let i = 0; i < steps; i++) { const t = i / steps; const p = a.clone().lerp(b, t); p.addScaledVector(V([-x * 0.25, 0.1, -1]).normalize(), -sag * Math.sin(Math.PI * t)); ring.push(p); } };
  pushLine(lead[0], lead[1], 4, 0); pushLine(lead[1], lead[2], 4, 0); pushLine(lead[2], lead[3], 4, 0);
  for (let i = 0; i < 3; i++) pushLine(trail[i], trail[i + 1], 6, 0.35);
  pushLine(bodyBack, S, 4, 0);
  // fan-triangulate from the centroid, two faces offset along the normal
  const c = ring.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / ring.length);
  const nrm = new THREE.Vector3().crossVectors(E.clone().sub(S), bodyBack.clone().sub(S)).normalize(); if (nrm.y < 0) nrm.negate();
  const th = 0.025, pos = [], idx = [];
  for (const side of [1, -1]) {
    const o0 = pos.length / 3;
    const cc = c.clone().addScaledVector(nrm, th * side); pos.push(cc.x, cc.y, cc.z);
    for (const p of ring) { const q = p.clone().addScaledVector(nrm, th * side); pos.push(q.x, q.y, q.z); }
    for (let i = 0; i < ring.length; i++) {
      const a = o0 + 1 + i, b = o0 + 1 + ((i + 1) % ring.length);
      if ((side > 0) === (x > 0)) idx.push(o0, a, b); else idx.push(o0, b, a);
    }
  }
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  // fix winding so the top face normal points along nrm
  const nAttr = g.attributes.normal;
  if (nAttr.getX(0) * nrm.x + nAttr.getY(0) * nrm.y + nAttr.getZ(0) * nrm.z < 0) {
    for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
    g.setIndex(idx); g.computeVertexNormals();
  }
  B.add(g, { color: o.membrane, weights: wingWeights(W, x, 0.2) });
  return { S, E, Wr, tips };
}

// Lightning bolt / zigzag slab (extruded), lying in the XY plane, pointing up +Y.
export function bolt(h, w, depth = 0.12) {
  const s = new THREE.Shape();
  const pts = [[0.1, 1], [-0.45, 0.42], [-0.05, 0.42], [-0.35, -0.12], [0.05, -0.12], [-0.25, -1], [0.55, 0.05], [0.12, 0.05], [0.5, 0.55], [0.05, 0.55], [0.4, 1]];
  pts.forEach(([px, py], i) => (i ? s.lineTo(px * w, (py + 1) / 2 * h) : s.moveTo(px * w, (py + 1) / 2 * h)));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return mergeVertsSafe(g);
}
function mergeVertsSafe(g) { g.deleteAttribute('uv'); g.computeVertexNormals(); return g; }

// Faceted rock: a low-poly icosahedron, jittered deterministically.
export function rock(r, seed = 1, sy = 0.6, detail = 0) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  const P = g.attributes.position;
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const cache = new Map();
  for (let i = 0; i < P.count; i++) {
    const key = `${P.getX(i).toFixed(3)},${P.getY(i).toFixed(3)},${P.getZ(i).toFixed(3)}`;
    if (!cache.has(key)) cache.set(key, 0.82 + rnd() * 0.3);
    const k = cache.get(key);
    P.setXYZ(i, P.getX(i) * k, P.getY(i) * k * sy, P.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}

// Hexagonal crystal: prism with a pointed top, base at y=0.
export function crystal(r, h) {
  const body = new THREE.CylinderGeometry(r, r * 0.85, h * 0.7, 6, 1);
  body.translate(0, h * 0.35, 0);
  const tip = new THREE.ConeGeometry(r, h * 0.3, 6, 1);
  tip.translate(0, h * 0.85, 0);
  const g = mergeGeometries([body.toNonIndexed(), tip.toNonIndexed()]);
  g.deleteAttribute('uv');
  return g;
}

// ---------- static props ----------
// spec: { name, palette, glow: { Mesh: hex }, parts?: { Mesh: { pivot: [x,y,z] } }, build(B) }
// Every non-glow mesh samples the palette texture. Parts listed in `parts` become their
// own meshes with their origin at `pivot`, so Roblox code can spin or sway them.
export function buildProp(spec, materialFor) {
  const parts = spec.parts || {};
  const glowNames = new Set([...Object.keys(spec.glow || {}), ...Object.keys(spec.glass || {})]);
  const textured = ['Body', ...Object.keys(parts).filter((n) => !glowNames.has(n)), ...(spec.skinned || [])];
  const cell = Object.fromEntries(spec.palette.map(([k], i) => [k, (i + 0.5) / 16]));
  // optional bone chain for skinned parts (flags): spec.bones = [[name, parent|null, [x,y,z]], ...]
  const boneDefs = [['Root', null, [0, 0, 0]], ...(spec.bones || [])];
  const boneIndex = Object.fromEntries(boneDefs.map(([n], i) => [n, i]));
  const B = new Builder(boneIndex, cell, [...new Set([...textured, ...glowNames])], textured);
  spec.build(B);
  const group = new THREE.Group(); group.name = spec.name;
  let skeleton = null; const boneMap = {};
  if (spec.bones) {
    const world = Object.fromEntries(boneDefs.map(([n, , p]) => [n, p]));
    const bones = boneDefs.map(([n, parent, p]) => {
      const b = new THREE.Bone(); b.name = n; const pp = parent ? world[parent] : [0, 0, 0];
      b.position.set(p[0] - pp[0], p[1] - pp[1], p[2] - pp[2]); boneMap[n] = b; return b;
    });
    boneDefs.forEach(([n, parent]) => { if (parent) boneMap[parent].add(boneMap[n]); });
    group.add(boneMap.Root); group.updateMatrixWorld(true);
    skeleton = new THREE.Skeleton(bones);
  }
  const skinned = new Set(spec.skinned || []);
  const meshes = {}, stats = { meshes: {}, parts: {} };
  for (const [name, list] of Object.entries(B.parts)) {
    if (!list.length) continue;
    const geo = mergeGeometries(list, false);
    const isSkinned = skinned.has(name) && skeleton;
    if (!isSkinned) { geo.deleteAttribute('skinIndex'); geo.deleteAttribute('skinWeight'); }
    const pivot = parts[name] && parts[name].pivot;
    if (pivot) geo.translate(-pivot[0], -pivot[1], -pivot[2]);
    geo.computeBoundingSphere(); geo.computeBoundingBox();
    geo.name = name;
    const mat = materialFor(name, textured.includes(name) || isSkinned);
    const m = isSkinned ? new THREE.SkinnedMesh(geo, mat) : new THREE.Mesh(geo, mat);
    m.name = name;
    if (pivot) m.position.set(...pivot);
    group.add(m);
    if (isSkinned) m.bind(skeleton, new THREE.Matrix4());
    meshes[name] = m;
    stats.meshes[name] = { tris: geo.index.count / 3, verts: geo.attributes.position.count };
    if (pivot) {
      // Roblox centres a MeshPart on its bounding box; store the pivot relative to that centre.
      const c = geo.boundingBox.getCenter(new THREE.Vector3());
      stats.parts[name] = { pivot, pivotFromCenter: [-c.x, -c.y, -c.z] };
    }
  }
  if (spec.bones) stats.bones = spec.bones.map(([n]) => n);
  return { group, meshes, stats, boneMap };
}

// Simple box with optional bevel-ish rounding via scale (cartoon planks, crates).
export function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
// Cylinder helper (axis Y).
export function cyl(rt, rb, h, seg = 12) { return new THREE.CylinderGeometry(rt, rb, h, seg); }
// Torus helper (in XY plane, rotate as needed).
export function torus(r, t, rs = 8, ts = 24, arc = Math.PI * 2) { return new THREE.TorusGeometry(r, t, rs, ts, arc); }

// Route every add() without an explicit mesh into `mesh` (e.g. a swaying canopy part).
export const into = (B, mesh) => ({ add: (g, o = {}) => B.add(g, { ...o, mesh: o.mesh || mesh }) });

// Two-sided subdivided cloth for flags: hangs from x=0 (pole) to x=w, top at y=0.
// notch > 0 cuts a swallowtail into the free end. Skinned along X to bones `names`.
export function flagCloth(B, w, h, names, origin, { color, mesh = 'Flag', notch = 0, segW = 10, segH = 6 } = {}) {
  const g = new THREE.PlaneGeometry(w, h, segW, segH); g.translate(w / 2, -h / 2, 0);
  const P = g.attributes.position;
  if (notch) { for (let i = 0; i < P.count; i++) { const u = P.getX(i) / w, v = -P.getY(i) / h; if (u > 0.7) P.setX(i, P.getX(i) - notch * w * Math.max(0, 1 - Math.abs(v - 0.5) * 2) * ((u - 0.7) / 0.3)); } g.computeVertexNormals(); }
  const back = g.clone(); back.scale(1, 1, -1); back.translate(0, 0, -0.03);
  const idx = back.index.array; for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  back.computeVertexNormals();
  const n = names.length;
  const weights = (p) => { const u = Math.min(0.9999, Math.max(0, (p.x - origin[0]) / w)) * (n - 1); const k = Math.floor(u), f = u - k; return k + 1 < n ? [[names[k], 1 - f], [names[k + 1], f]] : [[names[n - 1], 1]]; };
  for (const geo of [g, back]) B.add(geo, { pos: origin, color, mesh, weights });
}

// Leg-shortening warp for creatures: y above y1 drops by k; between y0 and y1 it eases.
export const shortenLegs = (k, y0 = 0.45, y1 = 2.0) => (p) => { p.y -= k * ss(y0, y1, p.y); };
