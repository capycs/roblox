// Runs in headless Chromium (see build-icons.mjs). Premium cartoon UI icons, 256x256:
// gradient fills, inner rim light, soft drop shadow and a deep plum outline. Icons that
// lead to purchases get a restrained aura and a few sparkles.
const S = 256, OL = '#22142e', LW = 12;
function canvas() { const c = document.createElement('canvas'); c.width = c.height = S; return c; }

// ---- colour helpers ----
const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgb = ([r, g, b], a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
const shade = (h, k) => { const c = hx(h); return rgb(k > 0 ? c.map((v) => v + (255 - v) * k) : c.map((v) => v * (1 + k))); };

// ---- shape helpers (trace only; P paints) ----
const poly = (pts) => (g) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
const circ = (x, y, r) => (g) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); };
const ell = (x, y, rx, ry, rot = 0) => (g) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); };
const rrect = (x, y, w, h, r) => (g) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const starP = (cx, cy, n, o, i, rot = -Math.PI / 2) => (g) => { g.beginPath(); for (let k = 0; k < n * 2; k++) { const r = k % 2 ? i : o, a = rot + (k * Math.PI) / n; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); };
const eggP = (cx, cy, s) => (g) => { g.beginPath(); for (let i = 0; i <= 64; i++) { const th = (i / 64) * Math.PI * 2; g.lineTo(cx + Math.sin(th) * 70 * s * (1 - 0.13 * Math.cos(th)), cy - Math.cos(th) * 92 * s); } g.closePath(); };

// Paint a shape: shadow + outline, gradient body, inner highlight and rim light.
function P(g, trace, base, o = {}) {
  const y0 = o.y0 ?? 20, y1 = o.y1 ?? 236, lw = o.lw ?? LW;
  g.save(); trace(g); g.shadowColor = 'rgba(20,8,30,0.45)'; g.shadowOffsetY = o.noShadow ? 0 : 7; g.shadowBlur = o.noShadow ? 0 : 5;
  g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = OL; g.stroke(); g.restore();
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, shade(base, 0.32)); gr.addColorStop(0.5, shade(base, 0)); gr.addColorStop(1, shade(base, -0.28));
  trace(g); g.fillStyle = o.flat ? base : gr; g.fill();
  if (!o.flat) {
    g.save(); trace(g); g.clip();
    g.lineWidth = o.rim ?? 9; g.strokeStyle = 'rgba(255,255,255,0.32)'; g.translate(0, 3); trace(g); g.stroke(); g.translate(0, -3);
    g.lineWidth = 8; g.strokeStyle = 'rgba(20,8,30,0.18)'; g.translate(0, -4); trace(g); g.stroke(); g.translate(0, 4);
    if (o.gloss !== false) { const [gx, gy, grx, gry] = o.gloss || [S * 0.36, y0 + (y1 - y0) * 0.2, (y1 - y0) * 0.24, (y1 - y0) * 0.1]; g.fillStyle = 'rgba(255,255,255,0.38)'; g.beginPath(); g.ellipse(gx, gy, grx, gry, -0.45, 0, Math.PI * 2); g.fill(); }
    g.restore();
  }
  trace(g); g.lineWidth = lw; g.lineJoin = 'round'; g.strokeStyle = OL; g.stroke();
}
// Stroked line with outline (for handles, ropes, lines).
function L(g, draw, color, w) { g.lineCap = 'round'; g.lineJoin = 'round'; draw(g); g.lineWidth = w + LW; g.strokeStyle = OL; g.stroke(); draw(g); g.lineWidth = w; g.strokeStyle = color; g.stroke(); }
// Restrained "premium" treatment: soft coloured aura + a few twinkles.
function aura(g, color, r = 120, a = 0.55) { const gr = g.createRadialGradient(128, 128, 20, 128, 128, r); gr.addColorStop(0, rgb(hx(color), a)); gr.addColorStop(1, rgb(hx(color), 0)); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
function twinkle(g, x, y, r, color = '#ffffff') { starP(x, y, 4, r, r * 0.22)(g); g.fillStyle = color; g.fill(); g.fillStyle = rgb([255, 255, 255], 0.6); g.beginPath(); g.arc(x, y, r * 0.18, 0, Math.PI * 2); g.fill(); }
function rays(g, color, n = 12, a = 0.18) { g.save(); g.translate(128, 128); for (let k = 0; k < n; k++) { g.rotate((Math.PI * 2) / n); const gr = g.createLinearGradient(0, 0, 0, -128); gr.addColorStop(0, rgb(hx(color), a)); gr.addColorStop(1, rgb(hx(color), 0)); g.fillStyle = gr; g.beginPath(); g.moveTo(-10, 0); g.lineTo(0, -128); g.lineTo(10, 0); g.fill(); } g.restore(); }
const premium = (g, color, sparkles = [[206, 52, 16], [52, 196, 11]]) => { aura(g, color); rays(g, color); return () => sparkles.forEach(([x, y, r]) => twinkle(g, x, y, r)); };

const ELEMENT = { Fire: '#ff7a2e', Storm: '#3fb4ff', Ice: '#7fd8f5', Shadow: '#9a5ae6', Water: '#2aa0d8', Nature: '#62c043', Prism: '#ff5aa8' };
const RARITY = { Common: '#c9c0b0', Uncommon: '#6fcf4a', Rare: '#4f8fe6', Epic: '#a65ae6', Legendary: '#f5b52e', Mythic: '#ff4f9a' };

function elementGlyph(g, el) {
  if (el === 'Fire') P(g, poly([[128, 52], [168, 104], [180, 146], [160, 186], [128, 196], [96, 186], [76, 146], [92, 112], [106, 128], [112, 92]]), '#ffd36b', { lw: 10, gloss: false });
  if (el === 'Storm') P(g, poly([[146, 48], [92, 132], [124, 132], [104, 208], [168, 112], [134, 112], [160, 48]]), '#fff3a0', { lw: 10, gloss: false });
  if (el === 'Ice') { for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; L(g, (c) => { c.beginPath(); c.moveTo(128 - Math.cos(a) * 66, 128 - Math.sin(a) * 66); c.lineTo(128 + Math.cos(a) * 66, 128 + Math.sin(a) * 66); }, '#ffffff', 12); } P(g, circ(128, 128, 16), '#ffffff', { lw: 8, gloss: false }); }
  if (el === 'Shadow') P(g, (c) => { c.beginPath(); c.arc(128, 128, 62, 0.6, Math.PI * 2 - 0.6); c.arc(160, 128, 48, Math.PI * 2 - 1.15, 1.15, true); c.closePath(); }, '#eadcff', { lw: 10, gloss: false });
  if (el === 'Water') P(g, (c) => { c.beginPath(); c.moveTo(128, 56); c.bezierCurveTo(160, 100, 182, 126, 182, 146); c.arc(128, 146, 54, 0, Math.PI); c.bezierCurveTo(74, 126, 96, 100, 128, 56); c.closePath(); }, '#dcffff', { lw: 10, gloss: false });
  if (el === 'Prism') { // faceted gem with rainbow facets
    const fac = [['#ff6e6e', [[128, 52], [86, 104], [128, 112]]], ['#ffc85a', [[128, 52], [170, 104], [128, 112]]], ['#8cff78', [[86, 104], [128, 112], [128, 204]]], ['#64dcff', [[170, 104], [128, 112], [128, 204]]]];
    for (const [col, pts] of fac) P(g, poly(pts), col, { lw: 0.01, gloss: false, noShadow: true });
    L(g, (c) => { c.beginPath(); c.moveTo(128, 52); c.lineTo(170, 104); c.lineTo(128, 204); c.lineTo(86, 104); c.closePath(); c.moveTo(86, 104); c.lineTo(128, 112); c.lineTo(170, 104); c.moveTo(128, 112); c.lineTo(128, 204); }, '#ffffff', 3);
  }
  if (el === 'Nature') { P(g, (c) => { c.beginPath(); c.moveTo(74, 184); c.bezierCurveTo(74, 116, 126, 70, 186, 68); c.bezierCurveTo(188, 132, 146, 186, 74, 184); c.closePath(); }, '#c8ff8a', { lw: 10, gloss: false }); L(g, (c) => { c.beginPath(); c.moveTo(80, 178); c.quadraticCurveTo(126, 136, 172, 82); }, '#62c043', 6); }
}

const ICONS = {
  // ---------- currencies ----------
  Coin(g) { P(g, circ(128, 136, 98), '#c27e1c', { gloss: false }); P(g, circ(128, 124, 94), '#f5b52e', { gloss: [96, 84, 34, 16] }); g.lineWidth = 8; g.strokeStyle = 'rgba(255,240,190,0.9)'; circ(128, 124, 66)(g); g.stroke(); P(g, starP(128, 126, 5, 42, 18), '#fff1b8', { lw: 8, gloss: false }); },
  Gem(g) { const done = premium(g, '#b07aff', [[206, 50, 14], [48, 70, 9]]); const out = [[128, 26], [216, 96], [128, 232], [40, 96]]; P(g, poly(out), '#7a4fd8', { gloss: false }); poly([[128, 26], [216, 96], [128, 112], [40, 96]])(g); g.fillStyle = 'rgba(200,170,255,0.9)'; g.fill(); poly([[128, 26], [168, 96], [128, 112], [88, 96]])(g); g.fillStyle = 'rgba(240,230,255,0.95)'; g.fill(); poly([[128, 112], [216, 96], [128, 232]])(g); g.fillStyle = 'rgba(60,30,130,0.35)'; g.fill(); poly(out)(g); g.lineWidth = LW; g.strokeStyle = OL; g.stroke(); done(); },
  GemPile(g) { const done = premium(g, '#b07aff', [[214, 44, 15], [40, 60, 10], [210, 200, 9]]); for (const [x, y, s, c] of [[86, 170, 0.62, '#5f9cf0'], [172, 176, 0.6, '#ff6fb5'], [128, 140, 0.8, '#8a5ae6']]) { const pts = [[0, -100], [84, -30], [0, 96], [-84, -30]].map(([a, b]) => [x + a * s, y + b * s]); P(g, poly(pts), c, { gloss: false, lw: 10 }); poly([[x, y - 100 * s], [x + 40 * s, y - 30 * s], [x, y - 16 * s], [x - 40 * s, y - 30 * s]])(g); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fill(); } done(); },
  CoinPile(g) { for (const [x, y] of [[80, 176], [176, 176], [128, 186], [104, 146], [152, 146], [128, 108]]) { P(g, ell(x, y + 10, 50, 22), '#c27e1c', { gloss: false, lw: 10 }); P(g, ell(x, y, 50, 22), '#f5b52e', { lw: 10, gloss: [x - 14, y - 6, 18, 6] }); } twinkle(g, 196, 70, 14); },
  // ---------- navigation ----------
  Shop(g) { P(g, rrect(40, 108, 176, 120, 16), '#c99258'); P(g, rrect(100, 150, 56, 78, 10), '#744828', { lw: 10, gloss: false }); for (let i = 0; i < 4; i++) P(g, (c) => { c.beginPath(); c.moveTo(28 + i * 50, 70); c.lineTo(78 + i * 50, 70); c.lineTo(78 + i * 50, 108); c.arc(53 + i * 50, 108, 25, 0, Math.PI); c.closePath(); }, i % 2 ? '#f6ebd2' : '#e8473a', { lw: 10, gloss: false }); P(g, rrect(24, 42, 208, 32, 14), '#e8473a', { lw: 10 }); },
  Index(g) { P(g, poly([[128, 62], [128, 222], [28, 204], [28, 44]]), '#f3e8cc', { gloss: false }); P(g, poly([[128, 62], [128, 222], [228, 204], [228, 44]]), '#fff7e4', { gloss: false }); g.lineWidth = 8; g.lineCap = 'round'; g.strokeStyle = '#cdbd96'; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(50, 92 + k * 28); g.lineTo(106, 100 + k * 28); g.stroke(); g.beginPath(); g.moveTo(150, 100 + k * 28); g.lineTo(206, 92 + k * 28); g.stroke(); } P(g, poly([[116, 28], [146, 28], [146, 98], [131, 84], [116, 98]]), '#e8473a', { lw: 10, gloss: false }); },
  Incubator(g) { P(g, rrect(44, 176, 168, 50, 14), '#3c4450'); P(g, rrect(56, 150, 144, 34, 10), '#f5b52e', { lw: 10 }); g.save(); g.beginPath(); g.moveTo(64, 152); g.bezierCurveTo(64, 36, 192, 36, 192, 152); g.closePath(); g.fillStyle = 'rgba(180,235,255,0.5)'; g.fill(); g.clip(); P(g, eggP(128, 112, 0.44), '#f3e6c8', { lw: 10 }); g.restore(); g.beginPath(); g.moveTo(64, 152); g.bezierCurveTo(64, 36, 192, 36, 192, 152); g.lineWidth = LW; g.strokeStyle = OL; g.stroke(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(92, 92, 8, 24, 0.3, 0, Math.PI * 2); g.fill(); P(g, circ(128, 40, 13), '#7ff3ff', { lw: 9, gloss: false }); },
  Creatures(g) { P(g, ell(128, 162, 56, 50), '#ff7a2e'); for (const [x, y] of [[64, 98], [102, 62], [154, 62], [192, 98]]) P(g, ell(x, y, 26, 30), '#ff7a2e', { lw: 10, gloss: [x - 6, y - 10, 9, 5] }); },
  Backpack(g) { L(g, (c) => { c.beginPath(); c.arc(128, 76, 34, Math.PI, 0); }, '#2a4f91', 12); P(g, rrect(50, 70, 156, 160, 42), '#3d6fc4'); P(g, rrect(80, 140, 96, 62, 16), '#2f5aa8', { lw: 10, gloss: false }); P(g, rrect(110, 150, 36, 18, 6), '#f5b52e', { lw: 8, gloss: false }); },
  Settings(g) { P(g, (c) => { c.save(); c.translate(128, 128); c.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.lineTo(Math.cos(a - 0.2) * 102, Math.sin(a - 0.2) * 102); c.lineTo(Math.cos(a + 0.2) * 102, Math.sin(a + 0.2) * 102); c.lineTo(Math.cos(a + 0.4) * 78, Math.sin(a + 0.4) * 78); c.lineTo(Math.cos(a + 0.58) * 78, Math.sin(a + 0.58) * 78); } c.closePath(); c.restore(); }, '#a4adb8'); P(g, circ(128, 128, 34), '#4a525c', { gloss: false }); },
  Close(g) { P(g, circ(128, 128, 98), '#e8473a'); L(g, (c) => { c.beginPath(); c.moveTo(90, 90); c.lineTo(166, 166); c.moveTo(166, 90); c.lineTo(90, 166); }, '#ffffff', 20); },
  Check(g) { P(g, circ(128, 128, 98), '#56c43f'); L(g, (c) => { c.beginPath(); c.moveTo(82, 130); c.lineTo(114, 162); c.lineTo(176, 96); }, '#ffffff', 20); },
  Plus(g) { P(g, circ(128, 128, 98), '#56c43f'); L(g, (c) => { c.beginPath(); c.moveTo(128, 80); c.lineTo(128, 176); c.moveTo(80, 128); c.lineTo(176, 128); }, '#ffffff', 22); },
  Lock(g) { L(g, (c) => { c.beginPath(); c.arc(128, 110, 48, Math.PI, 0); }, '#a4adb8', 22); P(g, rrect(56, 106, 144, 118, 24), '#f5b52e'); P(g, circ(128, 154, 16), '#6a4410', { lw: 8, gloss: false }); g.fillStyle = '#6a4410'; g.fillRect(121, 158, 14, 34); },
  Star(g) { P(g, starP(128, 136, 5, 110, 50), '#ffd23f'); },
  Heart(g) { P(g, (c) => { c.beginPath(); c.moveTo(128, 214); c.bezierCurveTo(30, 150, 20, 60, 84, 52); c.bezierCurveTo(110, 48, 126, 70, 128, 84); c.bezierCurveTo(130, 70, 146, 48, 172, 52); c.bezierCurveTo(236, 60, 226, 150, 128, 214); c.closePath(); }, '#ff4f6a'); },
  Sword(g) { g.save(); g.translate(128, 128); g.rotate(Math.PI / 4); g.translate(-128, -128); P(g, poly([[128, 16], [146, 40], [146, 170], [110, 170], [110, 40]]), '#dfe8f0', { gloss: [120, 80, 6, 50] }); P(g, rrect(80, 168, 96, 22, 10), '#f5b52e', { lw: 10, gloss: false }); P(g, rrect(116, 190, 24, 44, 8), '#744828', { lw: 10, gloss: false }); g.restore(); },
  Shield(g) { P(g, (c) => { c.beginPath(); c.moveTo(128, 26); c.lineTo(214, 58); c.bezierCurveTo(214, 152, 182, 198, 128, 230); c.bezierCurveTo(74, 198, 42, 152, 42, 58); c.closePath(); }, '#3d6fc4'); P(g, starP(128, 124, 5, 40, 17), '#f5b52e', { lw: 9, gloss: false }); },
  Timer(g) { P(g, rrect(106, 20, 44, 28, 8), '#a4adb8', { lw: 10, gloss: false }); P(g, circ(128, 140, 92), '#f4f6f8'); g.beginPath(); g.moveTo(128, 140); g.arc(128, 140, 72, -Math.PI / 2, 0.3); g.closePath(); g.fillStyle = 'rgba(232,71,58,0.85)'; g.fill(); L(g, (c) => { c.beginPath(); c.moveTo(128, 140); c.lineTo(128, 84); c.moveTo(128, 140); c.lineTo(166, 158); }, '#ffffff', 8); },
  Extract(g) { aura(g, '#5ff0ff', 110, 0.35); P(g, ell(128, 198, 98, 34), '#3fd8f0', { gloss: false }); P(g, ell(128, 196, 60, 18), '#c8fbff', { lw: 8, gloss: false }); P(g, poly([[128, 24], [198, 102], [156, 102], [156, 178], [100, 178], [100, 102], [58, 102]]), '#ffffff'); },
  Skyship(g) { P(g, ell(128, 84, 102, 54), '#f6ebd2', { gloss: false }); g.save(); ell(128, 84, 102, 54)(g); g.clip(); g.fillStyle = '#e8473a'; for (let k = -2; k <= 2; k++) g.fillRect(118 + k * 44, 20, 22, 130); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(100, 58, 50, 14, -0.2, 0, Math.PI * 2); g.fill(); g.restore(); ell(128, 84, 102, 54)(g); g.lineWidth = LW; g.strokeStyle = OL; g.stroke(); L(g, (c) => { c.beginPath(); c.moveTo(80, 132); c.lineTo(84, 160); c.moveTo(176, 132); c.lineTo(172, 160); }, '#b89466', 4); P(g, (c) => { c.beginPath(); c.moveTo(38, 160); c.lineTo(218, 160); c.quadraticCurveTo(202, 224, 128, 226); c.quadraticCurveTo(54, 224, 38, 160); c.closePath(); }, '#2f4a7a', { gloss: false }); g.fillStyle = '#f5b52e'; g.fillRect(52, 172, 152, 9); },
  Quests(g) { P(g, rrect(60, 40, 136, 180, 10), '#f6efd9', { gloss: false }); for (const y of [28, 208]) P(g, rrect(40, y, 176, 32, 16), '#c99258', { lw: 10 }); g.lineWidth = 9; g.lineCap = 'round'; g.strokeStyle = '#cdbd96'; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(84, 92 + k * 28); g.lineTo(172, 92 + k * 28); g.stroke(); } P(g, starP(184, 182, 5, 30, 13), '#ffd23f', { lw: 8, gloss: false }); },
  Trade(g) { P(g, poly([[38, 80], [168, 80], [168, 52], [218, 96], [168, 140], [168, 112], [38, 112]]), '#56c43f'); P(g, poly([[218, 150], [88, 150], [88, 122], [38, 166], [88, 210], [88, 182], [218, 182]]), '#3fb4ff'); },
  Map(g) { const out = [[30, 60], [96, 40], [160, 64], [226, 44], [226, 196], [160, 216], [96, 192], [30, 212]]; P(g, poly(out), '#f6efd9', { gloss: false }); poly([[96, 40], [160, 64], [160, 216], [96, 192]])(g); g.fillStyle = 'rgba(150,210,110,0.6)'; g.fill(); poly(out)(g); g.lineWidth = LW; g.strokeStyle = OL; g.stroke(); g.setLineDash([12, 12]); g.lineWidth = 8; g.strokeStyle = '#e8473a'; g.beginPath(); g.moveTo(60, 170); g.quadraticCurveTo(120, 90, 186, 112); g.stroke(); g.setLineDash([]); L(g, (c) => { c.beginPath(); c.moveTo(174, 98); c.lineTo(198, 124); c.moveTo(198, 98); c.lineTo(174, 124); }, '#e8473a', 8); },
  Home(g) { P(g, poly([[60, 116], [196, 116], [196, 222], [60, 222]]), '#f4e3c3', { gloss: false }); P(g, poly([[128, 28], [230, 120], [26, 120]]), '#3d6fc4'); P(g, rrect(104, 152, 48, 70, 10), '#744828', { lw: 10, gloss: false }); },
  Info(g) { P(g, circ(128, 128, 98), '#3fb4ff'); g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 78, 16, 0, Math.PI * 2); g.fill(); g.beginPath(); g.roundRect(113, 106, 30, 88, 10); g.fill(); },
  Warning(g) { P(g, poly([[128, 26], [232, 214], [24, 214]]), '#ffd23f'); g.fillStyle = OL; g.beginPath(); g.roundRect(116, 86, 24, 74, 10); g.fill(); g.beginPath(); g.arc(128, 186, 14, 0, Math.PI * 2); g.fill(); },
  ArrowLeft(g) { P(g, poly([[38, 128], [124, 42], [124, 96], [218, 96], [218, 160], [124, 160], [124, 214]]), '#ffffff'); },
  ArrowRight(g) { P(g, poly([[218, 128], [132, 42], [132, 96], [38, 96], [38, 160], [132, 160], [132, 214]]), '#ffffff'); },
  Knockdown(g) { L(g, (c) => { c.beginPath(); c.ellipse(128, 176, 90, 38, 0, 0, Math.PI * 2); }, '#ffe07a', 6); for (const [x, y, r] of [[70, 92, 34], [128, 60, 30], [186, 92, 34]]) P(g, starP(x, y, 5, r, r * 0.45), '#ffd23f', { lw: 10, gloss: false }); },
  SoundOn(g) { P(g, poly([[40, 100], [84, 100], [134, 52], [134, 204], [84, 156], [40, 156]]), '#f4f6f8'); for (const r of [40, 76]) L(g, (c) => { c.beginPath(); c.arc(134, 128, r, -0.7, 0.7); }, '#ffffff', 8); },
  SoundOff(g) { P(g, poly([[40, 100], [84, 100], [134, 52], [134, 204], [84, 156], [40, 156]]), '#f4f6f8'); L(g, (c) => { c.beginPath(); c.moveTo(160, 96); c.lineTo(220, 160); c.moveTo(220, 96); c.lineTo(160, 160); }, '#e8473a', 12); },
  Paw(g) { ICONS.Creatures(g); },
  // ---------- monetisation (restrained glow + sparkles) ----------
  InstantHatch(g) { const done = premium(g, '#ffd23f', [[214, 40, 14], [44, 70, 10]]); P(g, eggP(116, 142, 0.98), '#f6e8c8'); L(g, (c) => { c.beginPath(); c.moveTo(56, 128); c.lineTo(84, 110); c.lineTo(104, 138); c.lineTo(130, 112); c.lineTo(156, 136); c.lineTo(176, 116); }, '#ffd23f', 6); P(g, poly([[206, 26], [160, 108], [192, 108], [170, 180], [236, 88], [204, 88], [228, 26]]), '#ffd23f', { lw: 10 }); done(); },
  Luck(g) { const done = premium(g, '#7dff6a', [[210, 46, 14], [48, 196, 10]]); L(g, (c) => { c.beginPath(); c.moveTo(128, 126); c.quadraticCurveTo(138, 196, 176, 228); }, '#3f8a35', 12); for (const k of [0, 1, 2, 3]) { const a = k * Math.PI / 2 - Math.PI / 4, x = 128 + Math.cos(a) * 44, y = 116 + Math.sin(a) * 44; P(g, (c) => { c.save(); c.translate(x, y); c.rotate(a + Math.PI / 4); c.beginPath(); c.moveTo(0, 32); c.bezierCurveTo(-62, -10, -32, -62, 0, -26); c.bezierCurveTo(32, -62, 62, -10, 0, 32); c.closePath(); c.restore(); }, '#56c43f', { lw: 10, gloss: false }); } P(g, circ(128, 116, 12), '#3f8a35', { lw: 8, gloss: false }); done(); },
  Boost(g) { const done = premium(g, '#ff7ad9', [[206, 56, 13], [52, 74, 9]]); P(g, rrect(100, 22, 56, 34, 8), '#8a5a34', { lw: 10, gloss: false }); P(g, (c) => { c.beginPath(); c.moveTo(106, 56); c.lineTo(150, 56); c.lineTo(150, 96); c.bezierCurveTo(212, 112, 222, 222, 128, 230); c.bezierCurveTo(34, 222, 44, 112, 106, 96); c.closePath(); }, '#ff6fd0'); P(g, poly([[138, 112], [104, 166], [128, 166], [114, 210], [158, 150], [134, 150], [150, 112]]), '#fff3a0', { lw: 9, gloss: false }); done(); },
  Gift(g) { const done = premium(g, '#ff6a5a', [[214, 46, 13], [42, 98, 9]]); P(g, rrect(46, 114, 164, 112, 14), '#e8473a'); P(g, rrect(36, 84, 184, 40, 12), '#ff6a5a', { lw: 10 }); P(g, rrect(114, 86, 28, 138, 4), '#ffd23f', { lw: 10, gloss: false }); for (const s of [-1, 1]) P(g, ell(128 + s * 36, 66, 36, 20, s * -0.5), '#ffd23f', { lw: 10, gloss: false }); done(); },
  VIP(g) { const done = premium(g, '#ffd23f', [[214, 52, 14], [40, 64, 10]]); P(g, poly([[34, 196], [26, 76], [84, 128], [128, 48], [172, 128], [230, 76], [222, 196]]), '#f5b52e'); P(g, rrect(28, 184, 200, 38, 12), '#c27e1c', { lw: 10 }); for (const [x, c] of [[84, '#ff4f6a'], [128, '#7a4fd8'], [172, '#3fb4ff']]) P(g, circ(x, 203, 11), c, { lw: 7, gloss: false }); done(); },
  Crown(g) { ICONS.VIP(g); },
  DoubleCoins(g) { const done = premium(g, '#ffd23f', [[218, 40, 13]]); P(g, circ(102, 138, 76), '#c27e1c', { gloss: false }); P(g, circ(102, 128, 72), '#f5b52e'); P(g, starP(102, 130, 5, 32, 14), '#fff1b8', { lw: 8, gloss: false }); P(g, rrect(150, 40, 88, 64, 22), '#e8473a', { lw: 10 }); g.fillStyle = '#ffffff'; g.font = '900 52px Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 8; g.strokeStyle = OL; g.strokeText('2x', 194, 74); g.fillText('2x', 194, 74); done(); },
  Pass(g) { const done = premium(g, '#b07aff', [[214, 48, 13], [44, 206, 9]]); P(g, (c) => { c.beginPath(); c.moveTo(30, 70); c.lineTo(226, 70); c.lineTo(226, 110); c.arc(226, 128, 18, -Math.PI / 2, Math.PI / 2, true); c.lineTo(226, 186); c.lineTo(30, 186); c.lineTo(30, 146); c.arc(30, 128, 18, Math.PI / 2, -Math.PI / 2, true); c.closePath(); }, '#8a5ae6'); g.setLineDash([10, 10]); g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(84, 82); g.lineTo(84, 174); g.stroke(); g.setLineDash([]); P(g, starP(156, 128, 5, 38, 16), '#ffd23f', { lw: 9, gloss: false }); done(); },
  StarterPack(g) { const done = premium(g, '#ffd23f', [[216, 40, 14], [40, 80, 10]]); P(g, rrect(40, 122, 176, 104, 14), '#a8703f'); P(g, (c) => { c.beginPath(); c.moveTo(40, 122); c.lineTo(40, 104); c.bezierCurveTo(40, 54, 216, 54, 216, 104); c.lineTo(216, 122); c.closePath(); }, '#c99258', { lw: 10 }); for (const x of [74, 182]) P(g, rrect(x - 10, 70, 20, 156, 4), '#f5b52e', { lw: 9, gloss: false }); P(g, rrect(108, 118, 40, 34, 8), '#f5b52e', { lw: 9, gloss: false }); for (const [x, y, c] of [[96, 70, '#7a4fd8'], [158, 66, '#3fb4ff']]) P(g, poly([[x, y - 26], [x + 22, y], [x, y + 26], [x - 22, y]]), c, { lw: 8, gloss: false }); done(); },
};
for (const [r, c] of Object.entries(RARITY)) {
  ICONS['Egg' + r] = (g) => {
    const top = r === 'Legendary' || r === 'Mythic';
    const done = top ? premium(g, c, [[206, 50, 14], [52, 66, 9]]) : null;
    P(g, eggP(128, 132, 1.08), c, { y0: 30, y1: 232, gloss: [100, 82, 16, 30] });
    g.save(); eggP(128, 132, 1.08)(g); g.clip(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); for (let i = 0; i <= 12; i++) g.lineTo(i * 22, 148 + (i % 2 ? -16 : 16)); g.lineTo(256, 256); g.lineTo(0, 256); g.fill(); g.restore();
    eggP(128, 132, 1.08)(g); g.lineWidth = LW; g.strokeStyle = OL; g.stroke();
    if (done) done();
  };
}
for (const [el, c] of Object.entries(ELEMENT)) {
  ICONS['Element' + el] = (g) => { P(g, circ(128, 128, 104), shade(c, -0.25).startsWith('rgba') ? c : c, { gloss: false }); P(g, circ(128, 124, 92), c, { lw: 8, gloss: [96, 84, 30, 12] }); elementGlyph(g, el); };
}

export function drawIcons() {
  const out = {};
  for (const [name, fn] of Object.entries(ICONS)) { const c = canvas(); fn(c.getContext('2d')); out[name] = c.toDataURL('image/png'); }
  return out;
}
