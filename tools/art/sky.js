// Runs in headless Chromium (see build-sky.mjs). Cartoon skyboxes, six faces each,
// computed per pixel from the 3D view direction so faces meet without seams.
const N = 768;
function makeNoise3(seed) {
  let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const P = new Uint8Array(512), p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  const fade = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
  const h = (x, y, z) => P[P[P[x & 255] + (y & 255)] + (z & 255)] / 255;
  return (x, y, z) => {
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), u = fade(x - X), v = fade(y - Y), w = fade(z - Z);
    return lerp(lerp(lerp(h(X, Y, Z), h(X + 1, Y, Z), u), lerp(h(X, Y + 1, Z), h(X + 1, Y + 1, Z), u), v), lerp(lerp(h(X, Y, Z + 1), h(X + 1, Y, Z + 1), u), lerp(h(X, Y + 1, Z + 1), h(X + 1, Y + 1, Z + 1), u), v), w);
  };
}
const fbm = (n, x, y, z, o = 5) => { let a = 0, amp = 0.5, f = 1, t = 0; for (let i = 0; i < o; i++) { a += amp * n(x * f, y * f, z * f); t += amp; amp *= 0.5; f *= 2; } return a / t; };
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * Math.min(1, Math.max(0, t)));
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Roblox face -> direction for pixel (u, v in -1..1, v down).
const FACES = {
  Ft: (u, v) => [u, -v, -1], Bk: (u, v) => [-u, -v, 1], Lf: (u, v) => [-1, -v, -u], Rt: (u, v) => [1, -v, u],
  Up: (u, v) => [u, 1, v], Dn: (u, v) => [u, -1, -v],
};

const SKIES = {
  Day: {
    zenith: '#3d86e0', horizon: '#bfe7ff', below: '#e8f4ff', sea: '#ffffff', seaShade: '#b9d4ee', cloud: '#ffffff', cloudShade: '#c7dcf2', sun: [0.4, 0.55, -0.73], sunColor: '#fff6d8', stars: 0,
  },
  Dusk: {
    zenith: '#2a1f4e', horizon: '#ff9a6a', below: '#5a3a6a', sea: '#e9b6c8', seaShade: '#7a4f86', cloud: '#ffc2a8', cloudShade: '#8a5a9a', sun: [-0.6, 0.08, -0.8], sunColor: '#ffd08a', stars: 1,
  },
};

export function renderSky(name) {
  const K = SKIES[name], n = makeNoise3(name.length * 131 + 7);
  const out = {};
  const sun = (() => { const l = Math.hypot(...K.sun); return K.sun.map((x) => x / l); })();
  for (const [face, dirOf] of Object.entries(FACES)) {
    const c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d'), img = g.createImageData(N, N), d = img.data;
    for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
      const u = (px + 0.5) / N * 2 - 1, v = (py + 0.5) / N * 2 - 1;
      let [x, y, z] = dirOf(u, v); const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l;
      // sky gradient
      let col = y >= 0 ? mix(hex(K.horizon), hex(K.zenith), Math.pow(y, 0.6)) : mix(hex(K.horizon), hex(K.below), ss(0, 0.25, -y));
      // stars (dusk)
      if (K.stars && y > 0.15) { const s = n(x * 160, y * 160, z * 160); if (s > 0.93) col = mix(col, [255, 255, 255], (s - 0.93) * 14 * ss(0.15, 0.5, y)); }
      // sun glow + disc
      const sd = x * sun[0] + y * sun[1] + z * sun[2];
      col = mix(col, hex(K.sunColor), Math.pow(Math.max(0, sd), 24) * 0.8);
      if (sd > 0.9975) col = hex(K.sunColor);
      // puffy cartoon clouds in a band above the horizon
      if (y > -0.05) {
        const el = y, band = ss(-0.02, 0.06, el) * (1 - ss(0.28, 0.5, el));
        const q = fbm(n, x * 2.2, y * 4.5, z * 2.2, 4);
        const k = ss(0.52, 0.58, q * (0.75 + band * 0.5)) * band;
        if (k > 0) { const top = fbm(n, x * 2.2, y * 4.5 + 0.06, z * 2.2, 4); const shade = ss(0.45, 0.6, top); col = mix(col, mix(hex(K.cloudShade), hex(K.cloud), shade), k); }
      }
      // cloud sea below the horizon (Haven floats above it)
      if (y < 0.02) {
        const q = fbm(n, x / Math.max(0.05, -y + 0.05) * 0.8, 0.3, z / Math.max(0.05, -y + 0.05) * 0.8, 4);
        const k = ss(-0.02, -0.1, y);
        const puff = mix(hex(K.seaShade), hex(K.sea), ss(0.4, 0.65, q));
        col = mix(col, puff, k * 0.95);
      }
      const i = (py * N + px) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    out[face] = c.toDataURL('image/png');
  }
  return out;
}
export const SKY_NAMES = Object.keys(SKIES);
