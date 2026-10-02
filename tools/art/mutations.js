// Creature mutations that recolour the body: each one maps the species palette to a new
// palette (exported as a 256x16 texture the game swaps onto the Body MeshPart) and the
// glow colours. Mirrors src/shared/Creatures/Mutations.luau (which adds the auras,
// Giant scale and Supercharged, which don't need textures).

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const rgbToHex = (c) => '#' + c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');
function rgbToHsl([r, g, b]) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hslToRgb([h, s, l]) {
  if (!s) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}
const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
// piecewise ramp through 3 colours by luminance
const ramp = (stops) => (c) => {
  const L = Math.min(1, lum(c) * 1.15), S = stops.map(hexToRgb), k = L < 0.5 ? L / 0.5 : (L - 0.5) / 0.5, [a, b] = L < 0.5 ? [S[0], S[1]] : [S[1], S[2]];
  return a.map((v, i) => v + (b[i] - v) * k);
};
const keep = (name) => ['white', 'pupil', 'nose', 'mouth'].includes(name);

export const MUTATIONS = {
  Shiny: { body: (c) => { const [h, s, l] = rgbToHsl(c); return hslToRgb([(h + 0.42) % 1, Math.min(1, s * 1.1), l]); }, glow: (c) => { const [h, s, l] = rgbToHsl(c); return hslToRgb([(h + 0.42) % 1, s, l]); } },
  Golden: { body: (c) => ramp(['#4a2806', '#d38f1c', '#ffe27a'])(c.map((v) => v * 0.82)), glow: () => hexToRgb('#ffd23f') },
  Rainbow: { body: (c, i, n) => { const [, s, l] = rgbToHsl(c); return hslToRgb([i / n, Math.max(0.65, s), Math.min(0.75, Math.max(0.35, l))]); }, glow: (c, i) => hslToRgb([(i * 0.17) % 1, 1, 0.6]) },
  Void: { body: ramp(['#0c0614', '#33244f', '#8a6ccc']), glow: () => hexToRgb('#b04dff') },
  Crystal: { body: ramp(['#3f6c9a', '#a9d6f2', '#ffffff']), glow: () => hexToRgb('#bff4ff') },
};

export function mutatePalette(palette, mut) {
  const m = MUTATIONS[mut];
  return palette.map(([name, hex], i) => [name, keep(name) ? hex : rgbToHex(m.body(hexToRgb(hex), i, palette.length))]);
}
export function mutateGlow(glow, mut) {
  const m = MUTATIONS[mut];
  return Object.fromEntries(Object.entries(glow).map(([k, hex], i) => [k, k === 'Eyes' && mut !== 'Shiny' ? hex : rgbToHex(m.glow(hexToRgb(hex), i))]));
}
