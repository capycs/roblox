// Runs in headless Chromium (see build-textures.mjs). Procedural, seamlessly tiling
// cartoon ground textures: colour, normal and roughness maps per terrain material,
// plus a lit preview tile.
import * as THREE from 'three';

const N = 512;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a, b, t) => a + (b - a) * t;
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixc = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
// periodic value noise + fbm (period in cells must divide evenly)
function makeNoise(seed) {
  const r = rng(seed), P = 256, tab = new Float32Array(P * P);
  for (let i = 0; i < tab.length; i++) tab[i] = r();
  return (x, y, period) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const g = (a, b) => tab[((((a % period) + period) % period) * 61 + (((b % period) + period) % period) * 17) % (P * P)];
    return mix(mix(g(xi, yi), g(xi + 1, yi), u), mix(g(xi, yi + 1), g(xi + 1, yi + 1), u), v);
  };
}
function fbm(noise, x, y, base, oct = 4) { let a = 0, amp = 0.5, f = base, t = 0; for (let o = 0; o < oct; o++) { a += amp * noise(x * f, y * f, f); t += amp; amp *= 0.5; f *= 2; } return a / t; }
// periodic voronoi: returns [d1, d2, cellId]
function makeVoronoi(seed, cells, jitter = 0.85) {
  const r = rng(seed), pts = [];
  for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) pts.push([(i + 0.5 + (r() - 0.5) * jitter) / cells, (j + 0.5 + (r() - 0.5) * jitter) / cells, r()]);
  return (x, y) => {
    const ci = Math.floor(x * cells), cj = Math.floor(y * cells); let d1 = 9, d2 = 9, id = 0;
    for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
      const ii = ((ci + di) % cells + cells) % cells, jj = ((cj + dj) % cells + cells) % cells, p = pts[jj * cells + ii];
      const px = p[0] + Math.floor((ci + di) / cells) * 1, py = p[1] + Math.floor((cj + dj) / cells) * 1;
      const d = Math.hypot(x - px, y - py);
      if (d < d1) { d2 = d1; d1 = d; id = p[2]; } else if (d < d2) d2 = d;
    }
    return [d1 * cells, d2 * cells, id];
  };
}
// strokes / speckles stamped with wrap
function stamp(H, C, x0, y0, rad, fn) {
  for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
    const x = ((Math.round(x0) + dx) % N + N) % N, y = ((Math.round(y0) + dy) % N + N) % N;
    fn(y * N + x, dx / rad, dy / rad);
  }
}

// Each material: fills height H (0..1), colour C (rgb arrays) and roughness Rg.
const MATERIALS = {
  Grass: { terrain: 'Grass', tile: 10, gen(H, C, Rg, s) {
    const n = makeNoise(s), a = hex('#5fae45'), b = hex('#3f8a35'), c = hex('#86cf55'), f1 = hex('#fff1a8'), f2 = hex('#ffffff');
    for (let i = 0; i < N * N; i++) { const x = (i % N) / N, y = Math.floor(i / N) / N, v = fbm(n, x, y, 4); H[i] = v * 0.4; C[i] = mixc(b, a, clamp(v * 1.6 - 0.2)); Rg[i] = 0.9; }
    const r = rng(s + 1);
    for (let k = 0; k < 2600; k++) { const x = r() * N, y = r() * N, len = 4 + r() * 6, col = r() < 0.5 ? c : b; for (let t = 0; t < len; t++) stamp(H, C, x + t * 0.35, y - t, 1, (j) => { H[j] = 0.4 + 0.6 * (t / len); C[j] = col; }); }
    for (let k = 0; k < 40; k++) { const x = r() * N, y = r() * N, col = r() < 0.6 ? f1 : f2; stamp(H, C, x, y, 2, (j, u, v) => { if (u * u + v * v <= 1) { C[j] = col; H[j] = 0.9; } }); }
  } },
  GrassLush: { terrain: 'LeafyGrass', tile: 10, gen(H, C, Rg, s) {
    const n = makeNoise(s), a = hex('#3f8f3a'), b = hex('#2c6b2e'), c = hex('#5fae45');
    for (let i = 0; i < N * N; i++) { const x = (i % N) / N, y = Math.floor(i / N) / N, v = fbm(n, x, y, 3); H[i] = v * 0.4; C[i] = mixc(b, a, clamp(v * 1.5 - 0.2)); Rg[i] = 0.92; }
    const r = rng(s + 2);
    for (let k = 0; k < 900; k++) { const x = r() * N, y = r() * N, rr = 4 + r() * 5, col = r() < 0.5 ? c : a; stamp(H, C, x, y, Math.ceil(rr), (j, u, v) => { const d = u * u + v * v * 2.2; if (d < 1) { C[j] = mixc(col, b, d * 0.4); H[j] = Math.max(H[j], 0.5 + (1 - d) * 0.5); } }); }
  } },
  Dirt: { terrain: 'Ground', tile: 10, gen(H, C, Rg, s) {
    const n = makeNoise(s), a = hex('#9a6a44'), b = hex('#74502f'), p1 = hex('#b8a48c'), p2 = hex('#8c7c6a');
    for (let i = 0; i < N * N; i++) { const x = (i % N) / N, y = Math.floor(i / N) / N, v = fbm(n, x, y, 4); H[i] = v * 0.5; C[i] = mixc(b, a, clamp(v * 1.4 - 0.15)); Rg[i] = 0.95; }
    const r = rng(s + 3);
    for (let k = 0; k < 180; k++) { const x = r() * N, y = r() * N, rr = 3 + r() * 7, col = r() < 0.5 ? p1 : p2; stamp(H, C, x, y, Math.ceil(rr), (j, u, v) => { const d = u * u + v * v; if (d < 1) { const sh = 1 - 0.35 * (u + v + 1) / 2; C[j] = col.map((c) => c * sh); H[j] = 0.6 + 0.4 * Math.sqrt(1 - d); Rg[j] = 0.7; } }); }
  } },
  Mud: { terrain: 'Mud', tile: 12, gen(H, C, Rg, s) {
    const n = makeNoise(s), a = hex('#6a4a34'), b = hex('#4a3224'), w = hex('#7a6656');
    for (let i = 0; i < N * N; i++) { const x = (i % N) / N, y = Math.floor(i / N) / N, v = fbm(n, x, y, 3), puddle = clamp((fbm(n, x + 0.37, y + 0.11, 2) - 0.55) * 8); H[i] = v * 0.6 * (1 - puddle); C[i] = mixc(mixc(b, a, v), w, puddle * 0.6); Rg[i] = mix(0.85, 0.25, puddle); }
  } },
  Rock: { terrain: 'Rock', tile: 12, gen(H, C, Rg, s) {
    const n = makeNoise(s), vo = makeVoronoi(s, 7), a = hex('#9a9c98'), b = hex('#6e716f'), c = hex('#b8bab4'), crack = hex('#4c4f50');
    for (let i = 0; i < N * N; i++) { const x = (i % N) / N, y = Math.floor(i / N) / N, [d1, d2, id] = vo(x, y), edge = clamp((d2 - d1) * 4), v = fbm(n, x, y, 6); const face = clamp(0.3 + id * 0.7 + (v - 0.5) * 0.6); H[i] = edge * (0.6 + 0.3 * id) + v * 0.2; C[i] = edge < 0.12 ? crack : mixc(b, c, face * 0.8 + (1 - d1) * 0.2); if (id > 0.85) C[i] = mixc(C[i], a, 0.5); Rg[i] = 0.85; }
  } },
  Cliff: { terrain: 'Slate', tile: 16, gen(H, C, Rg, s) {
    const n = makeNoise(s), cols = ['#8a8c88', '#767976', '#9fa19b', '#6a6d6a', '#adafa8'].map(hex);
    for (let i = 0; i < N * N; i++) { const x = (i % N) / N, y = Math.floor(i / N) / N, w = fbm(n, x, y, 3) * 0.12, band = (y + w) * 9, k = Math.floor(band), f = band - k; H[i] = (f < 0.12 ? f / 0.12 : 1) * (0.7 + 0.3 * fbm(n, x * 3, y, 4)); C[i] = mixc(cols[((k % 5) + 5) % 5], [60, 62, 64], f < 0.1 ? 0.6 : 0); Rg[i] = 0.9; }
  } },
  Sand: { terrain: 'Sand', tile: 10, gen(H, C, Rg, s) {
    const n = makeNoise(s), a = hex('#f0dca8'), b = hex('#dcc08a'), c = hex('#fff2cc');
    for (let i = 0; i < N * N; i++) { const x = (i % N) / N, y = Math.floor(i / N) / N, w = fbm(n, x, y, 2) * 0.6, rip = 0.5 + 0.5 * Math.sin((y * 14 + w * 3) * Math.PI * 2); H[i] = rip * 0.5 + fbm(n, x, y, 8, 2) * 0.2; C[i] = mixc(b, a, rip * 0.7 + 0.15); Rg[i] = 0.95; }
    const r = rng(s + 4); for (let k = 0; k < 900; k++) stamp(H, C, r() * N, r() * N, 0, (j) => { C[j] = c; });
  } },
  Snow: { terrain: 'Snow', tile: 12, gen(H, C, Rg, s) {
    const n = makeNoise(s), a = hex('#f2f7fc'), b = hex('#cfdcea'), sp = hex('#ffffff');
    for (let i = 0; i < N * N; i++) { const x = (i % N) / N, y = Math.floor(i / N) / N, v = fbm(n, x, y, 3); H[i] = v; C[i] = mixc(b, a, clamp(v * 1.8 - 0.3)); Rg[i] = 0.8; }
    const r = rng(s + 5); for (let k = 0; k < 400; k++) stamp(H, C, r() * N, r() * N, 1, (j, u, v) => { if (Math.abs(u) + Math.abs(v) <= 1) { C[j] = sp; Rg[j] = 0.2; } });
  } },
  Ice: { terrain: 'Glacier', tile: 14, gen(H, C, Rg, s) {
    const n = makeNoise(s), vo = makeVoronoi(s, 5, 1), a = hex('#bfe9f8'), b = hex('#8cc8e6'), c = hex('#e8f8ff'), crack = hex('#ffffff');
    for (let i = 0; i < N * N; i++) { const x = (i % N) / N, y = Math.floor(i / N) / N, [d1, d2, id] = vo(x, y), edge = clamp((d2 - d1) * 10), v = fbm(n, x, y, 3); H[i] = 0.5 + v * 0.3 - (edge < 0.15 ? 0.3 : 0); C[i] = edge < 0.08 ? crack : mixc(b, a, clamp(id * 0.6 + v * 0.6)); if (fbm(n, x + 0.5, y, 6) > 0.62) C[i] = c; Rg[i] = 0.15; }
  } },
  Basalt: { terrain: 'Basalt', tile: 12, gen(H, C, Rg, s) {
    const n = makeNoise(s), vo = makeVoronoi(s, 6, 0.6), a = hex('#3a3640'), b = hex('#2a2730'), crack = hex('#1a181e');
    for (let i = 0; i < N * N; i++) { const x = (i % N) / N, y = Math.floor(i / N) / N, [d1, d2, id] = vo(x, y), edge = clamp((d2 - d1) * 6), v = fbm(n, x, y, 5); H[i] = edge * 0.8 + v * 0.2; C[i] = edge < 0.1 ? crack : mixc(b, a, id * 0.7 + v * 0.3); Rg[i] = 0.8; }
  } },
  CrackedLava: { terrain: 'CrackedLava', tile: 12, gen(H, C, Rg, s) {
    const n = makeNoise(s), vo = makeVoronoi(s, 6, 0.9), a = hex('#3a2a2a'), b = hex('#26191a'), l1 = hex('#ff6a1a'), l2 = hex('#ffc94a');
    for (let i = 0; i < N * N; i++) { const x = (i % N) / N, y = Math.floor(i / N) / N, [d1, d2, id] = vo(x, y), edge = clamp((d2 - d1) * 6), v = fbm(n, x, y, 5); H[i] = edge * 0.9 + v * 0.1; C[i] = edge < 0.06 ? l2 : edge < 0.16 ? l1 : mixc(b, a, id * 0.6 + v * 0.4); Rg[i] = edge < 0.16 ? 0.3 : 0.85; }
  } },
  Cobblestone: { terrain: 'Cobblestone', tile: 8, gen(H, C, Rg, s) {
    const n = makeNoise(s), vo = makeVoronoi(s, 8, 0.5), cols = ['#a8a39a', '#968f86', '#b9b3a8', '#8a847c', '#c2bcb0'].map(hex), mortar = hex('#6e6a64'), moss = hex('#6f9a4a');
    for (let i = 0; i < N * N; i++) { const x = (i % N) / N, y = Math.floor(i / N) / N, [d1, d2, id] = vo(x, y), edge = clamp((d2 - d1) * 3.2), v = fbm(n, x, y, 6); const dome = Math.sqrt(clamp(edge * 1.6)); H[i] = edge < 0.12 ? 0.05 : dome * (0.75 + 0.25 * v); C[i] = edge < 0.12 ? (fbm(n, x, y, 3) > 0.6 ? moss : mortar) : cols[Math.floor(id * 5)].map((c) => c * (0.88 + 0.22 * dome)); Rg[i] = edge < 0.12 ? 0.95 : 0.7; }
  } },
  WoodPlanks: { terrain: 'WoodPlanks', tile: 8, gen(H, C, Rg, s) {
    const n = makeNoise(s), cols = ['#b07a46', '#9a6a3c', '#c48c54', '#8c5e34'].map(hex), gap = hex('#4a3020');
    for (let i = 0; i < N * N; i++) { const x = (i % N) / N, y = Math.floor(i / N) / N, row = Math.floor(y * 8), off = (row * 0.37) % 1, px = (x + off) % 1, seg = Math.floor(px * 2), fy = y * 8 - row, fx = px * 2 - seg; const isGap = fy < 0.06 || fx < 0.012; const grain = 0.5 + 0.5 * Math.sin((fy * 6 + fbm(n, x * 2, y * 8, 4) * 3) * Math.PI * 2); const base = cols[(row * 3 + seg) % 4]; H[i] = isGap ? 0 : 0.7 + grain * 0.15; C[i] = isGap ? gap : base.map((c) => c * (0.88 + grain * 0.14)); Rg[i] = 0.8; }
    const r = rng(s + 6); for (let k = 0; k < 40; k++) { const x = r() * N, y = (Math.floor(r() * 8) + 0.5) / 8 * N; stamp(H, C, x, y, 2, (j, u, v) => { if (u * u + v * v <= 1) C[j] = [70, 70, 76]; }); }
  } },
  RuinTiles: { terrain: 'Pavement', tile: 10, gen(H, C, Rg, s) {
    const n = makeNoise(s), cols = ['#c8bea8', '#b4aa94', '#d6ccb6', '#a89e88'].map(hex), gap = hex('#7a7262'), moss = hex('#5f8a42');
    for (let i = 0; i < N * N; i++) { const x = (i % N) / N, y = Math.floor(i / N) / N, tx = Math.floor(x * 4), ty = Math.floor(y * 4), fx = x * 4 - tx, fy = y * 4 - ty, isGap = fx < 0.03 || fy < 0.03; const v = fbm(n, x, y, 6); const crack = Math.abs(fbm(n, x * 1.3, y * 1.3, 3) - 0.5) < 0.004 && fbm(n, x, y, 2) > 0.45; H[i] = isGap || crack ? 0.05 : 0.7 + v * 0.3; C[i] = isGap ? (v > 0.55 ? moss : gap) : crack ? gap : cols[(tx * 7 + ty * 3) % 4].map((c) => c * (0.9 + v * 0.2)); Rg[i] = 0.85; }
  } },
};

function heightToNormal(H, strength) {
  const out = new Uint8ClampedArray(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const h = (xx, yy) => H[((yy + N) % N) * N + ((xx + N) % N)];
    const dx = (h(x + 1, y) - h(x - 1, y)) * strength, dy = (h(x, y + 1) - h(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * N + x) * 4;
    out[i] = (-dx / l * 0.5 + 0.5) * 255; out[i + 1] = (dy / l * 0.5 + 0.5) * 255; out[i + 2] = (1 / l * 0.5 + 0.5) * 255; out[i + 3] = 255;
  }
  return out;
}
function toCanvas(px) { const c = document.createElement('canvas'); c.width = c.height = N; c.getContext('2d').putImageData(new ImageData(px, N, N), 0, 0); return c; }

export function runTexture(name) {
  const M = MATERIALS[name];
  const H = new Float32Array(N * N), C = new Array(N * N), Rg = new Float32Array(N * N);
  M.gen(H, C, Rg, name.length * 7919 + 13);
  const col = new Uint8ClampedArray(N * N * 4), rough = new Uint8ClampedArray(N * N * 4);
  for (let i = 0; i < N * N; i++) { const c = C[i]; col[i * 4] = c[0]; col[i * 4 + 1] = c[1]; col[i * 4 + 2] = c[2]; col[i * 4 + 3] = 255; const r = Rg[i] * 255; rough[i * 4] = rough[i * 4 + 1] = rough[i * 4 + 2] = r; rough[i * 4 + 3] = 255; }
  const cc = toCanvas(col), nc = toCanvas(heightToNormal(H, 6)), rc = toCanvas(rough);
  // lit preview: 2x2 tiles on a tilted plane
  const W = 512, renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(W, W); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const mk = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const mat = new THREE.MeshStandardMaterial({ map: mk(cc, true), normalMap: mk(nc), roughnessMap: mk(rc), normalScale: new THREE.Vector2(1.2, 1.2) });
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#1d1a22');
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), mat); plane.rotation.x = -Math.PI / 2; scene.add(plane);
  scene.add(new THREE.HemisphereLight('#ffffff', '#404050', 1.4));
  const sun = new THREE.DirectionalLight('#fff3e0', 2.6); sun.position.set(-3, 2.2, -1); scene.add(sun);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50); cam.position.set(0, 4.6, 3.4); cam.lookAt(0, 0, 0.1);
  renderer.render(scene, cam);
  const preview = renderer.domElement.toDataURL('image/png');
  renderer.dispose(); renderer.forceContextLoss();
  return { name, terrain: M.terrain, tile: M.tile, color: cc.toDataURL('image/png'), normal: nc.toDataURL('image/png'), roughness: rc.toDataURL('image/png'), preview };
}
export const TEXTURE_NAMES = Object.keys(MATERIALS);
