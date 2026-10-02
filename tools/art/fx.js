// Runs in headless Chromium (see build-fx.mjs). Draws custom particle textures (no stock
// Roblox textures anywhere) and renders looping previews of the effect presets.
const S = 256;
function canvas(w = S, h = S) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function radial(g, x, y, r, stops) { const gr = g.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function star(g, cx, cy, points, outer, inner, rot = -Math.PI / 2) { g.beginPath(); for (let i = 0; i < points * 2; i++) { const r = i % 2 ? inner : outer, a = rot + (i * Math.PI) / points; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); }
const W = 'rgba(255,255,255,';

// Mostly white/greyscale so Roblox can tint with ParticleEmitter.Color. A few are coloured.
const TEX = {
  SoftGlow(g) { g.fillStyle = radial(g, 128, 128, 128, [[0, W + '1)'], [0.25, W + '0.7)'], [0.6, W + '0.18)'], [1, W + '0)']]); g.fillRect(0, 0, S, S); },
  Sparkle4(g) { g.fillStyle = radial(g, 128, 128, 90, [[0, W + '0.85)'], [0.35, W + '0.25)'], [1, W + '0)']]); g.fillRect(0, 0, S, S); g.fillStyle = '#fff'; g.beginPath(); for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2 - Math.PI / 2, b = a + Math.PI / 2; g.lineTo(128 + Math.cos(a) * 122, 128 + Math.sin(a) * 122); g.quadraticCurveTo(128 + Math.cos(a + Math.PI / 4) * 14, 128 + Math.sin(a + Math.PI / 4) * 14, 128 + Math.cos(b) * 122, 128 + Math.sin(b) * 122); } g.fill(); },
  Sparkle8(g) { g.fillStyle = radial(g, 128, 128, 60, [[0, W + '0.9)'], [1, W + '0)']]); g.fillRect(0, 0, S, S); g.fillStyle = '#fff'; star(g, 128, 128, 4, 120, 14); g.fill(); star(g, 128, 128, 4, 70, 12, -Math.PI / 4); g.fill(); },
  Star(g) { g.fillStyle = '#fff'; g.strokeStyle = W + '0.6)'; g.lineWidth = 10; g.lineJoin = 'round'; star(g, 128, 136, 5, 110, 50); g.fill(); g.stroke(); },
  Ring(g) { g.strokeStyle = '#fff'; g.lineWidth = 14; g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.stroke(); g.strokeStyle = W + '0.35)'; g.lineWidth = 34; g.stroke(); },
  Shockwave(g) { g.fillStyle = radial(g, 128, 128, 128, [[0, W + '0)'], [0.55, W + '0)'], [0.72, W + '0.25)'], [0.84, W + '1)'], [0.9, W + '1)'], [0.93, W + '0.3)'], [1, W + '0)']]); g.fillRect(0, 0, S, S); },
  Puff(g) { const blobs = [[128, 150, 74], [74, 156, 50], [182, 154, 52], [104, 104, 54], [160, 100, 48], [130, 188, 46]]; for (const [x, y, r] of blobs) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } g.globalCompositeOperation = 'source-atop'; for (const [x, y, r] of blobs) { g.fillStyle = 'rgba(190,196,214,0.9)'; g.beginPath(); g.arc(x + r * 0.3, y + r * 0.38, r * 0.82, 0, Math.PI * 2); g.fill(); } for (const [x, y, r] of blobs) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x - r * 0.12, y - r * 0.16, r * 0.8, 0, Math.PI * 2); g.fill(); } g.globalCompositeOperation = 'source-over'; },
  Dust(g) { for (const [x, y, r] of [[128, 128, 80], [92, 140, 44], [168, 120, 46]]) { g.fillStyle = radial(g, x, y, r, [[0, W + '0.8)'], [1, W + '0)']]); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } },
  Flame(g) { const gr = g.createLinearGradient(0, 240, 0, 10); gr.addColorStop(0, W + '1)'); gr.addColorStop(0.6, W + '0.85)'); gr.addColorStop(1, W + '0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(128, 8); g.bezierCurveTo(170, 70, 220, 120, 200, 180); g.bezierCurveTo(190, 228, 150, 248, 128, 248); g.bezierCurveTo(106, 248, 66, 228, 56, 180); g.bezierCurveTo(40, 120, 100, 100, 110, 60); g.bezierCurveTo(118, 90, 140, 70, 128, 8); g.fill(); },
  Ember(g) { g.fillStyle = radial(g, 128, 128, 128, [[0, W + '1)'], [0.12, W + '1)'], [0.35, W + '0.4)'], [1, W + '0)']]); g.fillRect(0, 0, S, S); },
  Spark(g) { g.fillStyle = W + '0.35)'; g.beginPath(); g.moveTo(4, 128); g.quadraticCurveTo(170, 104, 252, 128); g.quadraticCurveTo(170, 152, 4, 128); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(40, 128); g.quadraticCurveTo(190, 116, 250, 128); g.quadraticCurveTo(190, 140, 40, 128); g.fill(); },
  Leaf(g) { g.fillStyle = '#7cc44c'; g.strokeStyle = '#3f7a2f'; g.lineWidth = 8; g.beginPath(); g.moveTo(40, 216); g.bezierCurveTo(40, 100, 140, 30, 220, 36); g.bezierCurveTo(224, 120, 150, 214, 40, 216); g.fill(); g.stroke(); g.beginPath(); g.moveTo(44, 212); g.quadraticCurveTo(120, 140, 210, 46); g.stroke(); },
  Petal(g) { g.fillStyle = '#ffb3d1'; g.strokeStyle = '#e46aa0'; g.lineWidth = 6; g.beginPath(); g.ellipse(128, 128, 60, 108, 0.5, 0, Math.PI * 2); g.fill(); g.stroke(); },
  Snowflake(g) { g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineWidth = 14; g.translate(128, 128); for (let k = 0; k < 6; k++) { g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -108); g.moveTo(0, -60); g.lineTo(-28, -84); g.moveTo(0, -60); g.lineTo(28, -84); g.stroke(); } g.setTransform(1, 0, 0, 1, 0, 0); },
  Bubble(g) { g.fillStyle = radial(g, 128, 128, 112, [[0, W + '0.05)'], [0.8, W + '0.2)'], [1, W + '0.9)']]); g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.fill(); g.strokeStyle = W + '0.95)'; g.lineWidth = 8; g.stroke(); g.fillStyle = W + '0.95)'; g.beginPath(); g.ellipse(88, 80, 26, 14, -0.7, 0, Math.PI * 2); g.fill(); },
  Droplet(g) { g.fillStyle = W + '0.9)'; g.beginPath(); g.moveTo(128, 20); g.bezierCurveTo(170, 100, 200, 140, 200, 170); g.arc(128, 170, 72, 0, Math.PI); g.bezierCurveTo(56, 140, 86, 100, 128, 20); g.fill(); g.fillStyle = W + '1)'; g.beginPath(); g.ellipse(104, 160, 12, 22, 0.3, 0, Math.PI * 2); g.fill(); },
  Bolt(g) { g.fillStyle = '#fff'; g.strokeStyle = W + '0.5)'; g.lineWidth = 12; g.lineJoin = 'round'; g.beginPath(); [[150, 8], [70, 130], [124, 130], [92, 248], [190, 104], [134, 104], [176, 8]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke(); g.fill(); },
  Wisp(g) { g.strokeStyle = W + '0.9)'; g.lineCap = 'round'; for (const [w, a] of [[34, 0.35], [18, 0.9]]) { g.lineWidth = w; g.strokeStyle = W + a + ')'; g.beginPath(); g.moveTo(60, 220); g.bezierCurveTo(20, 140, 200, 150, 150, 80); g.bezierCurveTo(120, 40, 70, 60, 96, 30); g.stroke(); } },
  CrackBurst(g) { g.strokeStyle = '#fff'; g.lineCap = 'round'; g.translate(128, 128); for (let k = 0; k < 9; k++) { g.rotate((Math.PI * 2) / 9 + 0.15); g.lineWidth = 10; g.beginPath(); g.moveTo(0, 0); g.lineTo(10, -40); g.lineTo(-6, -70); g.lineTo(8, -115); g.stroke(); } g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = radial(g, 128, 128, 50, [[0, W + '1)'], [1, W + '0)']]); g.fillRect(0, 0, S, S); },
  Rays(g) { g.translate(128, 128); for (let k = 0; k < 16; k++) { g.rotate((Math.PI * 2) / 16); const gr = g.createLinearGradient(0, 0, 0, -128); gr.addColorStop(0, W + '0.9)'); gr.addColorStop(1, W + '0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-6, 0); g.lineTo(0, -128); g.lineTo(6, 0); g.fill(); } g.setTransform(1, 0, 0, 1, 0, 0); },
  Swirl(g) { g.translate(128, 128); g.lineCap = 'round'; for (let arm = 0; arm < 3; arm++) { g.rotate((Math.PI * 2) / 3); g.beginPath(); for (let t = 0; t < 1; t += 0.02) { const a = t * Math.PI * 2.2, r = 10 + t * 110; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.lineWidth = 14; g.strokeStyle = W + '0.9)'; g.stroke(); } g.setTransform(1, 0, 0, 1, 0, 0); },
  RuneCircle(g) { g.strokeStyle = '#fff'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 116, 0, Math.PI * 2); g.stroke(); g.lineWidth = 5; g.beginPath(); g.arc(128, 128, 92, 0, Math.PI * 2); g.stroke(); g.translate(128, 128); for (let k = 0; k < 12; k++) { g.rotate(Math.PI / 6); g.beginPath(); const y = -104; if (k % 3 === 0) { g.moveTo(-7, y - 7); g.lineTo(7, y + 7); g.moveTo(7, y - 7); g.lineTo(-7, y + 7); } else if (k % 3 === 1) { g.moveTo(0, y - 8); g.lineTo(0, y + 8); g.moveTo(-6, y - 2); g.lineTo(6, y - 2); } else { g.arc(0, y, 6, 0, Math.PI * 2); } g.stroke(); } g.setTransform(1, 0, 0, 1, 0, 0); g.lineWidth = 6; star(g, 128, 128, 6, 70, 70 * 0.58); g.stroke(); },
  Coin(g) { g.fillStyle = '#c27e1c'; g.beginPath(); g.arc(128, 132, 108, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f2b33d'; g.beginPath(); g.arc(128, 124, 104, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#ffd774'; g.lineWidth = 10; g.beginPath(); g.arc(128, 124, 78, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#ffe9a8'; star(g, 128, 126, 5, 46, 20); g.fill(); g.fillStyle = W + '0.7)'; g.beginPath(); g.ellipse(84, 78, 22, 12, -0.7, 0, Math.PI * 2); g.fill(); },
  Gem(g) { const pts = [[128, 20], [220, 96], [128, 236], [36, 96]]; g.fillStyle = '#7a4fd8'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.fill(); g.fillStyle = '#b58cff'; g.beginPath(); g.moveTo(128, 20); g.lineTo(220, 96); g.lineTo(128, 112); g.lineTo(36, 96); g.fill(); g.fillStyle = '#e0ccff'; g.beginPath(); g.moveTo(128, 20); g.lineTo(170, 96); g.lineTo(128, 112); g.lineTo(86, 96); g.fill(); g.strokeStyle = '#3a2470'; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke(); },
  BeamGradient(g, c) { c.width = 64; c.height = 256; const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, W + '0)'); gr.addColorStop(0.5, W + '1)'); gr.addColorStop(1, W + '0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); },
  TrailGradient(g, c) { c.width = 256; c.height = 64; const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, W + '1)'); gr.addColorStop(1, W + '0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 64); const v = g.createLinearGradient(0, 0, 0, 64); v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.5, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = v; g.fillRect(0, 0, 256, 64); },
  WindStreak(g, c) { c.width = 512; c.height = 64; for (const [w, al] of [[9, 0.28], [3.5, 1]]) { g.fillStyle = W + al + ')'; g.beginPath(); const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60, x = 16 + t * 480, y = 34 - Math.sin(t * Math.PI * 1.2) * 10, hw = w * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.8); pts.push([x, y, hw]); } pts.forEach(([x, y, h], i) => (i ? g.lineTo(x, y - h) : g.moveTo(x, y - h))); for (let i = pts.length - 1; i >= 0; i--) g.lineTo(pts[i][0], pts[i][1] + pts[i][2]); g.fill(); } },
  CloudSoft(g) { for (const [x, y, r] of [[128, 150, 90], [70, 150, 60], [186, 146, 64], [104, 110, 62], [158, 108, 56]]) { g.fillStyle = radial(g, x, y - r * 0.2, r, [[0, W + '0.95)'], [0.6, W + '0.6)'], [1, W + '0)']]); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } },
  Fog(g) { g.fillStyle = radial(g, 128, 128, 128, [[0, W + '0.5)'], [0.5, W + '0.25)'], [1, W + '0)']]); g.fillRect(0, 0, S, S); },
  Mote(g) { g.fillStyle = radial(g, 128, 128, 128, [[0, W + '1)'], [0.2, W + '0.9)'], [0.45, W + '0.2)'], [1, W + '0)']]); g.fillRect(0, 0, S, S); },
  Rain(g, c) { c.width = 64; c.height = 256; const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, W + '0)'); gr.addColorStop(1, W + '0.9)'); g.fillStyle = gr; g.fillRect(28, 0, 8, 256); },
  LightShaft(g, c) { c.width = 128; c.height = 512; for (let x = 0; x < 128; x++) { const k = Math.sin((x / 128) * Math.PI); const n = 0.7 + 0.3 * Math.sin(x * 0.37) * Math.sin(x * 0.11); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, W + (0.75 * k * n) + ')'); gr.addColorStop(1, W + '0)'); g.fillStyle = gr; g.fillRect(x, 0, 1, 512); } },
  WaterfallStrip(g, c) { c.width = 128; c.height = 256; g.fillStyle = 'rgba(160,230,255,0.55)'; g.fillRect(0, 0, 128, 256); for (let k = 0; k < 26; k++) { const x = (k * 37) % 128, y = (k * 71) % 256, h = 40 + (k * 13) % 80; const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, W + '0)'); gr.addColorStop(0.5, W + '0.95)'); gr.addColorStop(1, W + '0)'); g.fillStyle = gr; g.fillRect(x, y, 6 + (k % 3) * 3, h); g.fillRect(x, y - 256, 6 + (k % 3) * 3, h); } },
  Splash(g) { g.strokeStyle = W + '0.9)'; g.lineWidth = 10; g.beginPath(); g.ellipse(128, 170, 100, 40, 0, 0, Math.PI * 2); g.stroke(); for (let k = 0; k < 9; k++) { const a = Math.PI + (k / 8) * Math.PI; g.fillStyle = W + '0.95)'; g.beginPath(); g.ellipse(128 + Math.cos(a) * 80, 150 + Math.sin(a) * 90, 9, 16, a + Math.PI / 2, 0, Math.PI * 2); g.fill(); } },
  // 4x4 flipbook of a toon flame: outer tongue (soft) + hot inner tongue (solid), flickering
  FlameFlipbook(g, c) {
    c.width = c.height = 512;
    const tongue = (ox, oy, w, h, sway, al) => { g.fillStyle = W + al + ')'; g.beginPath(); g.moveTo(ox + sway, oy - h); g.bezierCurveTo(ox + w * 0.55 + sway * 0.4, oy - h * 0.55, ox + w * 0.62, oy - h * 0.2, ox + w * 0.5, oy - h * 0.05); g.bezierCurveTo(ox + w * 0.3, oy + h * 0.12, ox - w * 0.3, oy + h * 0.12, ox - w * 0.5, oy - h * 0.05); g.bezierCurveTo(ox - w * 0.62, oy - h * 0.2, ox - w * 0.45 + sway * 0.4, oy - h * 0.5, ox + sway, oy - h); g.fill(); };
    for (let f = 0; f < 16; f++) {
      const ox = (f % 4) * 128 + 64, oy = Math.floor(f / 4) * 128 + 112, t = f / 16, sway = Math.sin(t * Math.PI * 2) * 12, h = 92 - Math.abs(Math.sin(t * Math.PI * 3)) * 16;
      tongue(ox, oy, 84, h, sway, 0.55); tongue(ox, oy, 52, h * 0.66, sway * 0.6, 1);
      g.fillStyle = W + '0.9)'; g.beginPath(); g.arc(ox + 18 + sway, oy - h * 0.95 - (t * 30) % 20, 5, 0, Math.PI * 2); g.fill();
    }
  },
  // Anime wind curl: a tapered stroke that runs straight then loops once (for ParticleEmitters).
  WindCurl(g, c) { c.width = 512; c.height = 256; const pts = []; for (let i = 0; i <= 140; i++) { const t = i / 140, s = t * 1.0; let x = 20 + s * 470, y = 170; const L0 = 0.42, L1 = 0.72; if (t > L0 && t < L1) { const u = (t - L0) / (L1 - L0), ph = u * Math.PI * 2; x = 20 + (L0 + u * (L1 - L0)) * 470 - Math.sin(ph) * 70; y = 170 - (1 - Math.cos(ph)) * 70; } else if (t >= L1) { x -= 0; } y += Math.sin(t * Math.PI * 2) * 6; const hw = 7 * Math.pow(Math.sin(Math.PI * t), 0.7); pts.push([x, y, hw]); } for (const [k, al] of [[2.4, 0.25], [1, 1]]) { g.fillStyle = W + al + ')'; for (let i = 1; i < pts.length; i++) { const [x0, y0, h0] = pts[i - 1], [x1, y1, h1] = pts[i]; g.lineWidth = (h0 + h1) * k; g.strokeStyle = W + al + ')'; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); } } },
  // Cross-section for the 3D wind swirl Trails: bright thin core, soft falloff. Taper comes from Trail.WidthScale.
  WindTrail(g, c) { c.width = 256; c.height = 64; const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, W + '0)'); gr.addColorStop(0.3, W + '0.22)'); gr.addColorStop(0.44, W + '1)'); gr.addColorStop(0.56, W + '1)'); gr.addColorStop(0.7, W + '0.22)'); gr.addColorStop(1, W + '0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 64); const h = g.createLinearGradient(0, 0, 256, 0); h.addColorStop(0, 'rgba(0,0,0,0.85)'); h.addColorStop(0.25, 'rgba(0,0,0,0)'); h.addColorStop(0.8, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,0.9)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = h; g.fillRect(0, 0, 256, 64); },
  // Comic impact burst: spiky star with a hollow centre ring.
  ImpactStar(g) { const pts = 12; g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < pts * 2; i++) { const r = i % 2 ? 58 + ((i * 37) % 3) * 6 : 112 + ((i * 53) % 4) * 4, a = (i * Math.PI) / pts - Math.PI / 2; g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } g.closePath(); g.fill(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = radial(g, 128, 128, 60, [[0, 'rgba(0,0,0,0.75)'], [0.7, 'rgba(0,0,0,0.4)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, S, S); g.globalCompositeOperation = 'source-over'; },
  // 4x4 toon smoke puff that swells then breaks apart (FlipbookLayout Grid4x4, play once over Lifetime).
  SmokeFlipbook(g, c) {
    c.width = c.height = 512;
    const blobs = [[0, 6, 30], [-22, 10, 22], [22, 10, 22], [-10, -14, 22], [14, -12, 20], [0, 24, 18]];
    for (let f = 0; f < 16; f++) {
      const ox = (f % 4) * 128 + 64, oy = Math.floor(f / 4) * 128 + 64, t = f / 15, grow = 0.55 + 0.6 * Math.sqrt(t), spread = 1 + t * 0.7;
      const cv = canvas(128, 128), q = cv.getContext('2d');
      for (const [x, y, r] of blobs) { q.fillStyle = '#fff'; q.beginPath(); q.arc(64 + x * spread, 64 + y * spread, r * grow, 0, Math.PI * 2); q.fill(); }
      q.globalCompositeOperation = 'source-atop';
      for (const [x, y, r] of blobs) { q.fillStyle = 'rgba(190,196,214,0.9)'; q.beginPath(); q.arc(64 + x * spread + r * grow * 0.3, 64 + y * spread + r * grow * 0.4, r * grow * 0.8, 0, Math.PI * 2); q.fill(); }
      for (const [x, y, r] of blobs) { q.fillStyle = '#fff'; q.beginPath(); q.arc(64 + x * spread - r * grow * 0.12, 64 + y * spread - r * grow * 0.15, r * grow * 0.78, 0, Math.PI * 2); q.fill(); }
      // dissolve: bites eaten out of the puff in the second half
      q.globalCompositeOperation = 'destination-out';
      const bite = Math.max(0, (t - 0.4) / 0.6);
      for (let k = 0; k < 9; k++) { const a = k * 2.4, d = 10 + (k % 3) * 12; q.fillStyle = '#000'; q.beginPath(); q.arc(64 + Math.cos(a) * d * spread, 64 + Math.sin(a) * d * spread, bite * (14 + (k % 4) * 5), 0, Math.PI * 2); q.fill(); }
      g.globalAlpha = 1 - Math.max(0, t - 0.7) * 2; g.drawImage(cv, ox - 64, oy - 64); g.globalAlpha = 1;
    }
  },
  // 4x4 sparkle twinkle: grows, spins a little, shrinks.
  SparkleFlipbook(g, c) {
    c.width = c.height = 512;
    for (let f = 0; f < 16; f++) {
      const ox = (f % 4) * 128 + 64, oy = Math.floor(f / 4) * 128 + 64, t = f / 15, s = Math.sin(Math.PI * t), rot = t * 0.8;
      g.fillStyle = radial(g, ox, oy, 50 * s + 1, [[0, W + (0.8 * s) + ')'], [1, W + '0)']]); g.fillRect(ox - 64, oy - 64, 128, 128);
      g.fillStyle = '#fff'; g.beginPath();
      for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2 + rot, b = a + Math.PI / 2, R = 60 * s; g.lineTo(ox + Math.cos(a) * R, oy + Math.sin(a) * R); g.quadraticCurveTo(ox + Math.cos(a + Math.PI / 4) * 6 * s, oy + Math.sin(a + Math.PI / 4) * 6 * s, ox + Math.cos(b) * R, oy + Math.sin(b) * R); }
      g.fill();
    }
  },
  // Soft-edged speed line for dashes and the skyship (VelocityParallel).
  SpeedLine(g, c) { c.width = 512; c.height = 32; const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, W + '0)'); gr.addColorStop(0.6, W + '0.9)'); gr.addColorStop(1, W + '0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(256, 16, 250, 5, 0, 0, Math.PI * 2); g.fill(); },
};

export function drawTextures() {
  const out = {};
  for (const [name, fn] of Object.entries(TEX)) { const c = canvas(); const g = c.getContext('2d'); fn(g, c); out[name] = c.toDataURL('image/png'); }
  return out;
}

// ---- preview simulation of the effect presets (2D, for the design canvas) ----
// Mirrors src/shared/Fx/Effects.luau (sizes in px, speeds in px/s). flip = 4x4 flipbook played over life.
const POPK = (peak) => [[0, peak * 0.3], [0.18, peak * 1.15], [0.35, peak], [1, 0]];
const FLASH = (s) => ({ tex: 'SoftGlow', n: 1, life: 0.18, size: [s * 0.6, s], alpha: [1, 0] });
const IMPACT = (s) => ({ tex: 'ImpactStar', n: 1, life: 0.22, size: [s * 0.4, s], alpha: [1, 0], k: 0 });
const RING = (s, life = 0.4) => ({ tex: 'Shockwave', n: 1, life, size: [s * 0.1, s], alpha: [1, 0], k: 1 });
const SMOKE = (n, s) => ({ tex: 'SmokeFlipbook', n, life: 0.75, size: [s * 0.7, s * 1.3], speed: [40, 90], drag: 4, alpha: [1, 0.7], spread: 1, flip: true, k: 0, normal: true });
const TWINKLE = (n, sp, s) => ({ tex: 'SparkleFlipbook', n, life: 0.7, size: [s, s * 0.6], speed: [sp * 0.5, sp], drag: 3, alpha: [1, 0.9], spread: 1, flip: true, k: 1 });
const HIT = (bg, tint, shapes) => ({ bg, tint, emit: [FLASH(170), IMPACT(150), RING(270), { ...SMOKE(3, 40), alpha: [0.6, 0.2], at: 0.06 }, ...shapes] });
const FLOOR = (tex, s, life = 0.5, spin = 0, k = 1) => ({ tex, n: 1, life, size: [s * 0.15, s], alpha: [0.9, 0], k, flat: true, spin, y: 230 });
const OUT = (o) => ({ ...o, ring: true, y: 230 });
const RISE = (tex, n, s, life, k = 0) => ({ tex, n, life, sizeK: [[0, 0], [0.2, s], [1, 0]], speed: [30, 80], spread: 0.5, up: true, gravity: -20, drag: 1, jitter: 110, jy: 25, alpha: [1, 0], k, y: 235, fadeIn: true });
function ABILITY_PREVIEWS() {
  const NAT = ['#c4ff7a', '#5fae45'], WAT = ['#dcffff', '#38e2ff'], STO = ['#ffffff', '#3fdcff'], FIR = ['#ffd36b', '#ff5e14'], ICE = ['#ffffff', '#8fe8ff'], SHA = ['#f3cdff', '#a54dff'];
  return {
    ThornBurst: { bg: '#141b12', tint: NAT, dur: 1.4, emit: [FLASH(110), FLOOR('Shockwave', 300, 0.45),
      OUT({ tex: 'Spark', n: 18, life: 0.45, size: [70, 20], speed: [330, 440], drag: 3, alpha: [1, 0], align: true, k: 1 }),
      OUT({ tex: 'Leaf', n: 10, life: 1.0, sizeK: POPK(34), speed: [160, 240], drag: 3, gravity: 120, alpha: [1, 0.2], spin: 4, raw: true, flutter: true }),
      { tex: 'Petal', n: 12, life: 1.2, sizeK: POPK(22), speed: [90, 180], drag: 3, gravity: 90, alpha: [1, 0.2], spin: 4, raw: true, flutter: true, at: 0.1, y: 220 }, TWINKLE(8, 140, 26)] },
    TidalShell: { bg: '#0e1c25', tint: WAT, emit: [FLASH(110), FLOOR('Splash', 300, 0.6), FLOOR('Shockwave', 320, 0.5),
      OUT({ tex: 'Droplet', n: 26, life: 0.8, size: [30, 14], speed: [260, 380], gravity: 500, alpha: [1, 0.2], align: true }),
      { tex: 'Bubble', n: 12, life: 1.1, sizeK: POPK(26), speed: [50, 120], drag: 2, gravity: -90, alpha: [1, 0.2], k: 1, y: 210 },
      { tex: 'Swirl', n: 1, life: 0.5, size: [50, 150], spin: 12, alpha: [1, 0], k: 1, flat: true, y: 230 }] },
    StaticDash: { bg: '#161c2c', tint: STO, dur: 0.8, frames: 16, emit: [FLASH(100), IMPACT(100),
      { tex: 'SpeedLine', n: 12, life: 0.35, size: [130, 50], speed: [500, 760], alpha: [1, 0], spread: 0.2, dir: Math.PI, align: true },
      { tex: 'Bolt', n: 6, life: 0.22, sizeK: POPK(70), speed: [40, 80], alpha: [1, 0], spread: 1, flicker: true },
      { tex: 'Spark', n: 24, life: 0.3, size: [44, 6], speed: [260, 440], drag: 5, alpha: [1, 0], spread: 1, align: true, k: 1 }] },
    SporeBloom: { bg: '#1a1420', tint: ['#ffbef0', '#aaff8c'], dur: 2.4, frames: 30, emit: [FLOOR('RuneCircle', 300, 1.6, 0.7), FLOOR('Ring', 320, 0.8),
      RISE('SoftGlow', 26, 34, 2.2, 0), RISE('Mote', 30, 14, 2, 1),
      { tex: 'Petal', n: 14, life: 1.3, sizeK: POPK(24), speed: [120, 200], drag: 2, gravity: 100, alpha: [1, 0.2], spread: 0.6, up: true, spin: 4, raw: true, flutter: true, y: 220 }, TWINKLE(14, 110, 28)] },
    RiptideSpiral: { bg: '#0e1c25', tint: WAT, dur: 1.8, emit: [
      { tex: 'Swirl', n: 1, life: 1.2, size: [300, 60], spin: 9, alpha: [0.95, 0.4], k: 1, flat: true, y: 220 },
      { tex: 'Swirl', n: 1, life: 1.2, size: [200, 30], spin: -12, alpha: [0.95, 0.4], k: 0, flat: true, y: 220, at: 0.1 },
      { tex: 'Bubble', n: 20, life: 1.2, sizeK: POPK(22), vel: [0, -90], jitter: 120, jy: 30, alpha: [1, 0.2], spawnY: 230 },
      { tex: 'Splash', n: 1, life: 0.5, size: [90, 260], alpha: [1, 0], at: 1.1, y: 200 },
      { tex: 'Droplet', n: 24, life: 0.8, size: [30, 14], speed: [240, 360], gravity: 700, alpha: [1, 0.2], spread: 0.7, up: true, align: true, at: 1.1, y: 220 }] },
    MagmaCharge: { bg: '#241a1c', tint: ['#ffbe50', '#ff4614'], dur: 1.6, emit: [FLASH(160), IMPACT(140), FLOOR('CrackBurst', 200, 0.8),
      { tex: 'FlameFlipbook', n: 16, life: 0.7, sizeK: POPK(80), speed: [240, 380], gravity: 300, drag: 1, alpha: [1, 0.3], spread: 0.4, up: true, flip: true, y: 240 },
      { tex: 'Ember', n: 30, life: 1.1, size: [16, 4], speed: [280, 440], gravity: 500, alpha: [1, 0], spread: 0.5, up: true, k: 1, y: 240 },
      { tex: 'Dust', n: 10, life: 0.9, size: [26, 18], speed: [240, 340], gravity: 700, alpha: [1, 0.5], spread: 0.45, up: true, spin: 3, col: '#462823', y: 240 }, SMOKE(7, 90)] },
    AuroraVeil: { bg: '#121a2a', tint: ['#aaffe6', '#9678ff'], dur: 1.8, emit: [
      { tex: 'SoftGlow', n: 1, life: 1.4, size: [240, 300], alpha: [0.5, 0], k: 0 }, FLOOR('Ring', 300, 1.2, 0, 1),
      { tex: 'LightShaft', n: 10, life: 1.4, size: [50, 70], vel: [0, -40], jitter: 110, jy: 30, upright: true, alpha: [0.8, 0], spawnY: 160, fadeIn: true },
      { tex: 'Snowflake', n: 14, life: 1.6, sizeK: POPK(26), speed: [30, 70], drag: 1, alpha: [1, 0.2], spread: 1, spin: 2, col: '#ffffff' }, TWINKLE(18, 90, 30)] },
    FlamePounce: { bg: '#241a1c', tint: FIR, emit: [FLASH(140), IMPACT(130), FLOOR('Shockwave', 290, 0.45),
      OUT({ tex: 'FlameFlipbook', n: 20, life: 0.8, sizeK: POPK(64), speed: [180, 260], drag: 3, gravity: -120, alpha: [1, 0.3], flip: true }),
      { tex: 'Ember', n: 24, life: 0.9, size: [16, 4], speed: [160, 320], drag: 2.5, gravity: -90, alpha: [1, 0], spread: 1, k: 1 }, SMOKE(5, 70)] },
    GlacierStomp: { bg: '#141d27', tint: ICE, emit: [FLASH(140), IMPACT(140), FLOOR('CrackBurst', 300, 0.9), FLOOR('Shockwave', 330, 0.5),
      OUT({ tex: 'Spark', n: 22, life: 0.5, size: [80, 16], speed: [330, 480], drag: 4, alpha: [1, 0], align: true, k: 1 }),
      { tex: 'Snowflake', n: 14, life: 0.9, sizeK: POPK(40), speed: [120, 200], drag: 3, alpha: [1, 0.2], spread: 1, spin: 3 }, SMOKE(6, 80)] },
    ShadeStep: { bg: '#17121f', tint: SHA, emit: [
      { tex: 'Swirl', n: 1, life: 0.45, size: [260, 30], spin: -10, alpha: [1, 0], k: 1, flat: true, y: 220 },
      { tex: 'Wisp', n: 16, life: 0.9, size: [50, 110], speed: [60, 140], drag: 3, alpha: [0.9, 0], spread: 1, spin: 2 },
      { tex: 'SmokeFlipbook', n: 6, life: 0.7, size: [80, 120], speed: [30, 70], drag: 3, alpha: [1, 0.5], spread: 1, flip: true, normal: true, col: '#28143c' },
      { tex: 'Ember', n: 12, life: 0.8, size: [14, 4], speed: [100, 220], drag: 2, alpha: [1, 0], spread: 1, k: 1 }] },
    ThunderDive: { bg: '#161c2c', tint: STO, emit: [
      { tex: 'Bolt', n: 3, life: 0.32, sizeK: POPK(320), speed: [0, 0], alpha: [1, 0], spread: 0.1, flicker: true, y: 120 },
      FLASH(260), IMPACT(220), FLOOR('Shockwave', 330, 0.6), FLOOR('CrackBurst', 220, 0.8, 0, 0),
      { tex: 'Spark', n: 36, life: 0.45, size: [60, 8], speed: [320, 560], drag: 5, alpha: [1, 0], spread: 1, align: true, k: 1, y: 230 }, SMOKE(8, 100)] },
    UmbralVeil: { bg: '#17121f', tint: SHA, dur: 1.8, emit: [
      { tex: 'Wisp', n: 24, life: 1.4, size: [60, 150], speed: [40, 110], drag: 2, alpha: [0.9, 0], spread: 1, spin: 2, col: '#6e3cb4', fadeIn: true },
      { tex: 'Swirl', n: 1, life: 1, size: [80, 240], spin: -5, alpha: [1, 0], k: 1, fadeIn: true },
      { tex: 'SmokeFlipbook', n: 10, life: 1.1, size: [100, 160], speed: [30, 70], drag: 2, alpha: [0.9, 0.4], spread: 1, flip: true, normal: true, col: '#1e0f2d' }, TWINKLE(16, 130, 28)] },
    SolarFlare: { bg: '#241e14', tint: ['#fffad2', '#ffa028'], dur: 1.6, emit: [FLASH(300),
      { tex: 'Rays', n: 1, life: 1.2, sizeK: [[0, 50], [0.25, 290], [1, 320]], spin: 0.7, alpha: [0.95, 0] }, IMPACT(220), FLOOR('Shockwave', 340, 0.7), FLOOR('RuneCircle', 260, 1, 1.5, 1),
      { tex: 'FlameFlipbook', n: 22, life: 0.8, sizeK: POPK(90), speed: [160, 300], drag: 2.5, gravity: -140, alpha: [1, 0.3], spread: 1, flip: true, k: 1 },
      { tex: 'Ember', n: 40, life: 1.1, size: [18, 4], speed: [220, 400], drag: 2, gravity: -60, alpha: [1, 0], spread: 1 }, TWINKLE(20, 240, 36)] },
    AbsoluteZero: { bg: '#101a26', tint: ['#ffffff', '#78d2ff'], dur: 1.8, emit: [FLASH(260), FLOOR('CrackBurst', 330, 1.2), FLOOR('RuneCircle', 340, 1.4, -0.7), FLOOR('Shockwave', 350, 0.8),
      { tex: 'Snowflake', n: 40, life: 1.5, sizeK: POPK(46), speed: [160, 340], drag: 2, alpha: [1, 0.2], spread: 1, spin: 3 },
      OUT({ tex: 'Spark', n: 30, life: 0.55, size: [90, 16], speed: [330, 500], drag: 4, alpha: [1, 0], align: true, k: 1 }),
      { tex: 'SmokeFlipbook', n: 14, life: 1.2, size: [90, 180], speed: [100, 180], drag: 2, alpha: [0.8, 0.3], spread: 1, flip: true, normal: true }, TWINKLE(30, 200, 36)] },
    AncientGrove: { bg: '#141b12', tint: ['#dcff96', '#50c85a'], dur: 2.2, frames: 28, emit: [FLASH(180), FLOOR('RuneCircle', 330, 1.6, 0.5, 0), FLOOR('Ring', 340, 1),
      { tex: 'LightShaft', n: 12, life: 1.6, size: [44, 70], vel: [0, -30], jitter: 140, jy: 30, upright: true, alpha: [0.8, 0], spawnY: 150, fadeIn: true },
      { tex: 'Leaf', n: 30, life: 1.6, sizeK: POPK(36), speed: [200, 340], drag: 1.5, gravity: 200, alpha: [1, 0.2], spread: 0.45, up: true, spin: 4, raw: true, flutter: true, y: 240 },
      { tex: 'Petal', n: 20, life: 1.6, size: [22, 22], speed: [140, 240], drag: 2, gravity: 120, alpha: [1, 0.2], spread: 0.6, up: true, spin: 4, raw: true, flutter: true, y: 240 },
      RISE('SoftGlow', 20, 30, 2, 0), TWINKLE(20, 160, 30)] },
    PrismJudgement: { bg: '#1a1426', tint: ['#ffffff', '#ff8ce6'], dur: 2, frames: 30, emit: [FLASH(340),
      { tex: 'Rays', n: 1, life: 1.6, sizeK: [[0, 60], [0.25, 300], [1, 320]], spin: 0.9, alpha: [0.95, 0], rainbow: true }, IMPACT(260),
      { tex: 'RuneCircle', n: 1, life: 1.8, size: [100, 330], spin: 1, alpha: [1, 0], rainbow: true, flat: true, y: 230 },
      { tex: 'Shockwave', n: 1, life: 0.8, size: [40, 340], alpha: [1, 0], rainbow: true, at: 0.15 },
      { tex: 'FlameFlipbook', n: 10, life: 0.8, sizeK: POPK(80), speed: [220, 360], drag: 2.5, alpha: [1, 0.3], spread: 1, flip: true, col: '#ff7828' },
      { tex: 'Snowflake', n: 10, life: 1, sizeK: POPK(44), speed: [220, 360], drag: 2.5, alpha: [1, 0.2], spread: 1, spin: 3, col: '#96e6ff' },
      { tex: 'Bolt', n: 6, life: 0.28, sizeK: POPK(90), speed: [100, 200], alpha: [1, 0], spread: 1, flicker: true, col: '#5adcff' },
      { tex: 'Wisp', n: 10, life: 1, size: [50, 110], speed: [100, 200], drag: 3, alpha: [0.9, 0], spread: 1, spin: 2, col: '#b04dff' },
      { tex: 'Droplet', n: 14, life: 0.9, size: [30, 14], speed: [260, 380], gravity: 500, alpha: [1, 0.2], spread: 0.7, up: true, align: true, col: '#38e2ff' },
      { tex: 'Leaf', n: 12, life: 1.1, sizeK: POPK(36), speed: [200, 320], drag: 3, alpha: [1, 0.2], spread: 1, spin: 4, raw: true, flutter: true },
      { tex: 'Star', n: 30, life: 1.5, sizeK: POPK(40), speed: [220, 420], drag: 1, gravity: 120, alpha: [1, 0.2], spread: 1, spin: 3, rainbow: true, at: 0.25 },
      { tex: 'SparkleFlipbook', n: 50, life: 1.1, size: [50, 26], speed: [220, 460], drag: 3, alpha: [1, 0.9], spread: 1, flip: true, rainbow: true, at: 0.25 }] },
  };
}
function AURA_PREVIEWS() {
  const box = { jitter: 90, jy: 55, spawnY: 170, vel: [0, 0] };
  const aura = (bg, tint, emit) => ({ bg, tint, loop: true, dur: 2, frames: 24, emit: [{ tex: 'Body', body: true }, ...emit] });
  return {
    MutShiny: aura('#1d2230', ['#c8faff', '#ffffff'], [{ tex: 'SparkleFlipbook', rate: 5, life: 0.8, size: [34, 24], ...box, alpha: [1, 1], flip: true }, { tex: 'Sparkle4', rate: 2, life: 0.5, sizeK: POPK(40), ...box, alpha: [1, 0.5], spin: 1.5, k: 1 }]),
    MutGolden: aura('#2a2214', ['#ffe68c', '#ffbe28'], [{ tex: 'SparkleFlipbook', rate: 8, life: 0.8, size: [32, 24], ...box, alpha: [1, 1], flip: true }, { tex: 'Mote', rate: 6, life: 2, sizeK: [[0, 0], [0.2, 12], [1, 0]], ...box, vel: [0, -40], alpha: [1, 0.3], k: 1 }]),
    MutCrystal: aura('#16202c', ['#bff4ff', '#ffffff'], [{ tex: 'SparkleFlipbook', rate: 5, life: 0.9, size: [38, 28], ...box, alpha: [1, 1], flip: true }, { tex: 'Sparkle8', rate: 2, life: 0.6, sizeK: POPK(46), ...box, alpha: [1, 0.5], spin: 1, k: 1 }]),
    MutVoid: aura('#1a1622', ['#320f50', '#b04dff'], [{ tex: 'Wisp', rate: 6, life: 2, size: [50, 100], ...box, vel: [0, -40], alpha: [0.9, 0], spin: 1, normal: true, fadeIn: true }, { tex: 'Ember', rate: 8, life: 1.3, size: [12, 2], ...box, vel: [0, -60], alpha: [1, 0], k: 1 }]),
    MutRainbow: aura('#1d1a26', ['#ffffff', '#ffffff'], [{ tex: 'SparkleFlipbook', rate: 8, life: 0.9, size: [34, 24], ...box, alpha: [1, 1], flip: true, rainbow: true }, { tex: 'Star', rate: 1.5, life: 1.2, sizeK: POPK(26), ...box, vel: [0, -50], alpha: [1, 0.3], spin: 2, rainbow: true }, { tex: 'Mote', rate: 5, life: 2, sizeK: [[0, 0], [0.2, 12], [1, 0]], ...box, vel: [0, -40], alpha: [1, 0.3], rainbow: true }]),
    MutGiant: aura('#2a2018', ['#ffc878', '#ff9646'], [{ tex: 'Mote', rate: 3, life: 1.8, sizeK: [[0, 0], [0.2, 14], [1, 0]], ...box, vel: [0, -30], alpha: [1, 0.3] }, { tex: 'Ring', rate: 0.6, life: 1.6, size: [60, 330], alpha: [0.5, 0], k: 1, flat: true, spawnY: 250, vel: [0, 0] }]),
    MutCharged: aura('#1d1d24', ['#fffac8', '#ffe650'], [{ tex: 'Spark', rate: 18, life: 0.25, size: [50, 10], ...box, vel: undefined, speed: [100, 160], spread: 1, drag: 4, alpha: [1, 0], align: true }, { tex: 'Bolt', rate: 1.5, life: 0.18, sizeK: POPK(60), ...box, alpha: [1, 0], flicker: true, k: 1 }]),
  };
}
const PRESETS = {
  HatchBurst: { bg: '#1d1a22', tint: ['#fff3b0', '#ffd23f'], emit: [
    FLASH(300), { tex: 'Rays', n: 1, life: 1.3, sizeK: [[0, 50], [0.25, 280], [1, 320]], spin: 0.6, alpha: [0.95, 0] }, RING(330, 0.6), IMPACT(200),
    TWINKLE(26, 320, 34), { tex: 'Star', n: 14, life: 1.3, sizeK: POPK(30), speed: [150, 260], gravity: 360, alpha: [1, 0.2], spread: 0.7, up: true, spin: 3, at: 0.05 }, SMOKE(6, 70)] },
  RarityBeam: { bg: '#141a22', tint: ['#b46bff', '#ff7ad9'], loop: true, emit: [
    { tex: 'BeamGradient', beam: true, size: [70, 320], alpha: [0.8, 0.8] },
    { tex: 'SparkleFlipbook', rate: 14, life: 1.4, size: [28, 16], vel: [0, -110], jitter: 40, alpha: [1, 0.6], flip: true, spawnY: 300 },
    { tex: 'RuneCircle', n: 1, life: 99, size: [150, 150], spin: 0.5, alpha: [0.8, 0.8], y: 250 } ] },
  Pickup: { bg: '#1d1a22', tint: ['#ffe07a', '#ffffff'], emit: [
    FLASH(120), { tex: 'Coin', n: 7, life: 0.9, sizeK: POPK(42), speed: [140, 240], gravity: 520, alpha: [1, 0.2], spread: 0.55, up: true, raw: true, spin: 4 },
    TWINKLE(10, 200, 26), { tex: 'Ring', n: 1, life: 0.35, size: [20, 190], alpha: [1, 0], k: 1 } ] },
  FireHit: HIT('#241a1c', ['#ffd36b', '#ff5e14'], [
    { tex: 'FlameFlipbook', n: 10, life: 0.6, sizeK: POPK(70), speed: [90, 190], drag: 3, gravity: -260, alpha: [1, 0.3], spread: 1, flip: true },
    { tex: 'Ember', n: 22, life: 0.9, size: [16, 4], speed: [160, 340], drag: 2.5, alpha: [1, 0], spread: 1, gravity: -90, k: 1 } ]),
  StormHit: HIT('#161c2c', ['#ffffff', '#3fdcff'], [
    { tex: 'Bolt', n: 5, life: 0.3, sizeK: POPK(100), speed: [40, 90], alpha: [1, 0], spread: 1, flicker: true },
    { tex: 'Spark', n: 18, life: 0.35, size: [60, 10], speed: [300, 480], drag: 5, alpha: [1, 0], spread: 1, align: true, k: 1 } ]),
  IceHit: HIT('#141d27', ['#ffffff', '#8fe8ff'], [
    { tex: 'Snowflake', n: 10, life: 0.8, sizeK: POPK(44), speed: [120, 220], drag: 3, alpha: [1, 0.2], spread: 1, spin: 3 },
    { tex: 'CrackBurst', n: 1, life: 0.5, size: [150, 230], alpha: [1, 0], k: 1 }, TWINKLE(12, 180, 30) ]),
  ShadowHit: HIT('#17121f', ['#f3cdff', '#a54dff'], [
    { tex: 'Wisp', n: 10, life: 0.8, size: [50, 100], speed: [70, 170], drag: 3, alpha: [0.9, 0], spread: 1, spin: 2 },
    { tex: 'Swirl', n: 1, life: 0.6, size: [60, 250], spin: -7, alpha: [1, 0], k: 1 },
    { tex: 'Ember', n: 14, life: 0.8, size: [14, 4], speed: [100, 240], drag: 2, alpha: [1, 0], spread: 1, k: 1 } ]),
  WaterHit: HIT('#0e1c25', ['#dcffff', '#38e2ff'], [
    { tex: 'Droplet', n: 16, life: 0.8, size: [30, 16], speed: [190, 320], gravity: 700, alpha: [1, 0.2], spread: 0.7, up: true, align: true },
    { tex: 'Bubble', n: 10, life: 1.0, sizeK: POPK(32), speed: [50, 120], drag: 2, gravity: -90, alpha: [1, 0.2], spread: 1, k: 1 },
    { tex: 'Splash', n: 1, life: 0.45, size: [90, 210], alpha: [1, 0] } ]),
  NatureHit: HIT('#141b12', ['#c4ff7a', '#5fae45'], [
    { tex: 'Leaf', n: 14, life: 1.1, sizeK: POPK(36), speed: [140, 260], drag: 3, gravity: 140, alpha: [1, 0.2], spread: 1, spin: 4, raw: true, flutter: true },
    { tex: 'Petal', n: 8, life: 1.1, size: [22, 22], speed: [120, 220], drag: 3, gravity: 100, alpha: [1, 0.2], spread: 1, spin: 4, raw: true, flutter: true }, TWINKLE(8, 160, 26) ]),
  ExtractPortal: { bg: '#14202a', tint: ['#e6ffff', '#5ff0ff'], loop: true, emit: [
    { tex: 'Swirl', n: 1, life: 99, size: [230, 230], spin: 2.4, alpha: [0.95, 0.95] },
    { tex: 'RuneCircle', n: 1, life: 99, size: [290, 290], spin: -0.6, alpha: [0.7, 0.7] },
    { tex: 'SparkleFlipbook', rate: 18, life: 1.0, size: [28, 16], vel: [0, -150], jitter: 120, alpha: [1, 0.6], flip: true, spawnY: 260 } ] },
  KnockedDown: { bg: '#1d1a22', tint: ['#ffe07a', '#ffd23f'], loop: true, emit: [
    { tex: 'Star', orbit: 3, size: [40, 40], radius: 70, speed: 3, alpha: [1, 1] } ] },
  Dust: { bg: '#2a2420', tint: ['#e2d2b8', '#beaa8c'], emit: [SMOKE(7, 80), { tex: 'Dust', n: 6, life: 0.5, size: [24, 8], speed: [120, 220], gravity: 300, alpha: [1, 0], spread: 0.5, up: true, k: 1 }] },
  Dash: { bg: '#24303e', tint: ['#ffffff', '#dcefff'], emit: [
    { tex: 'SpeedLine', n: 10, life: 0.35, size: [120, 60], speed: [500, 800], alpha: [1, 0], spread: 0.25, dir: 0, align: true },
    SMOKE(4, 60) ] },
  BiomeEmbers: { bg: '#241a1c', tint: ['#ffd36b', '#ff5e14'], loop: true, emit: [
    { tex: 'Ember', rate: 24, life: 2.2, size: [14, 4], vel: [40, -90], jitter: 160, wave: 30, alpha: [1, 0], spawnY: 300 } ] },
  BiomeSnow: { bg: '#141d27', tint: ['#ffffff', '#cfe8ff'], loop: true, dur: 3, emit: [
    { tex: 'Snowflake', rate: 14, life: 3.2, size: [18, 18], vel: [40, 110], jitter: 200, wave: 20, alpha: [1, 1], spawnY: -20, spin: 1, fadeIn: true },
    { tex: 'Mote', rate: 14, life: 3.2, size: [8, 8], vel: [50, 120], jitter: 200, wave: 14, alpha: [0.8, 0.8], spawnY: -20, fadeIn: true } ] },
  Wind: { bg: '#2a3a52', tint: ['#ffffff', '#dff4ff'], loop: true, emit: [
    { tex: 'WindStreak', rate: 4, life: 1.3, size: [180, 220], vel: [260, -10], jitter: 130, alpha: [0.8, 0], spawnY: 160, xstart: -120, align: true, fadeIn: true },
    { tex: 'WindCurl', rate: 1.2, life: 1.3, size: [200, 220], vel: [260, -10], jitter: 110, alpha: [0.9, 0], spawnY: 150, xstart: -140, align: true, fadeIn: true } ] },
  WindLeaves: { bg: '#2c4630', tint: ['#ffffff', '#ffffff'], loop: true, emit: [
    { tex: 'Leaf', rate: 7, life: 1.6, size: [22, 22], vel: [200, 20], jitter: 130, wave: 25, alpha: [1, 0.2], spawnY: 160, spin: 4, raw: true, xstart: -40, flutter: true },
    { tex: 'Petal', rate: 5, life: 1.6, size: [16, 16], vel: [210, 10], jitter: 130, wave: 30, alpha: [1, 0.2], spawnY: 160, spin: 5, raw: true, xstart: -40, flutter: true } ] },
  Motes: { bg: '#3a3024', tint: ['#fff6d8', '#ffe7a0'], loop: true, emit: [
    { tex: 'Mote', rate: 14, life: 2.6, size: [10, 10], vel: [12, -18], jitter: 160, wave: 18, alpha: [0.9, 0], spawnY: 220, pulse: true } ] },
  Rain: { bg: '#24303e', tint: ['#cfe6ff', '#9fc8f0'], loop: true, emit: [
    { tex: 'Rain', rate: 70, life: 0.5, size: [30, 30], vel: [-40, 760], jitter: 220, alpha: [0.7, 0.7], spawnY: -30, align: true, alignOff: -Math.PI / 2 } ] },
  BiomeFireflies: { bg: '#141b12', tint: ['#fff7a0', '#a8ff4f'], loop: true, emit: [
    { tex: 'SoftGlow', rate: 6, life: 3.2, size: [26, 26], vel: [0, -15], jitter: 160, wave: 40, alpha: [1, 0], pulse: true } ] },
  CrystalGlint: { bg: '#161c2c', tint: ['#bff4ff', '#ffffff'], loop: true, emit: [
    { tex: 'SparkleFlipbook', rate: 5, life: 0.9, size: [40, 30], vel: [0, 0], jitter: 110, alpha: [1, 1], flip: true } ] },
  // 3D anime wind swirls (WindSwirls.luau): trail paths drawn side-on over a sky island.
  WindSwirl: { bg: '#5b9be6', tint: ['#ffffff', '#ffffff'], loop: true, dur: 3, frames: 36, swirl: true, emit: [] },
  // ---- creature abilities (CreatureInfo) — flat: lies on the ground (drawn squashed), ring: outward fan on the ground ----
  ...ABILITY_PREVIEWS(),
  // ---- mutation auras (looping on the Body) ----
  ...AURA_PREVIEWS(),
};

// Same maths as WindSwirls.offset in src/shared/Fx/WindSwirls.luau.
export function windSwirlOffset(p, t) {
  const d = p.speed * t, length = p.speed * p.duration;
  let fwd = d, up = p.rise * Math.sin(d * 0.05 + p.phase * 2), side = p.wobbleAmp * Math.sin(d * p.wobbleFreq * Math.PI * 2 + p.phase);
  for (const L of p.loops) {
    const d0 = L.at * length, span = 2 * Math.PI * L.radius;
    if (d > d0) { const phi = Math.min((d - d0) / span, 1) * 2 * Math.PI, lift = L.radius * (1 - Math.cos(phi)); fwd -= 1.8 * L.radius * Math.sin(phi); up += lift * Math.cos(L.tilt); side += lift * Math.sin(L.tilt); }
  }
  return [fwd, up, side];
}
function drawSwirlFrame(g, ox, T, DUR, FW, FH, gusts) {
  // island silhouette
  g.fillStyle = '#6fbf4a'; g.beginPath(); g.ellipse(ox + FW / 2, FH - 70, 130, 16, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#8b8e8c'; g.beginPath(); g.moveTo(ox + FW / 2 - 128, FH - 68); g.quadraticCurveTo(ox + FW / 2 - 60, FH + 10, ox + FW / 2, FH + 30); g.quadraticCurveTo(ox + FW / 2 + 60, FH + 10, ox + FW / 2 + 128, FH - 68); g.fill();
  for (const t of [[-80, 0.9], [60, 1.2], [-10, 1]]) { g.fillStyle = '#3f8a35'; g.beginPath(); g.arc(ox + FW / 2 + t[0], FH - 96 - 20 * t[1], 22 * t[1], 0, Math.PI * 2); g.fill(); g.fillStyle = '#7a5132'; g.fillRect(ox + FW / 2 + t[0] - 3, FH - 92, 6, 20); }
  const S = 5.5, life = 0.6;
  for (const G of gusts) {
    for (const st of G.strands) {
      const age = ((T - G.t0 - st.delay) % DUR + DUR) % DUR;
      const head = Math.min(age, G.p.duration), tail = Math.max(0, age - life);
      if (tail >= head) continue;
      const n = 28, pts = [];
      for (let i = 0; i <= n; i++) { const tt = tail + (head - tail) * (i / n); const [f, u, sd] = windSwirlOffset(G.p, tt); pts.push([ox + G.x + (f + sd * 0.3) * S, G.y - (u + st.dy) * S - sd * 0.5, i / n]); }
      for (let i = 1; i < pts.length; i++) {
        const w = st.w * S * Math.sin(Math.PI * Math.pow(pts[i][2], 0.7)) * (age > G.p.duration ? Math.max(0, 1 - (age - G.p.duration) / life) : 1);
        g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = Math.max(0.5, w); g.lineCap = 'round';
        g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1]); g.lineTo(pts[i][0], pts[i][1]); g.stroke();
      }
    }
  }
}

function rngf(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
export async function previewEffects(textures) {
  const imgs = {};
  for (const [k, url] of Object.entries(textures)) { const im = new Image(); im.src = url; await im.decode(); imgs[k] = im; }
  const tintCache = {};
  const tinted = (tex, color) => {
    const key = tex + color; if (tintCache[key]) return tintCache[key];
    const im = imgs[tex], c = canvas(im.width, im.height), g = c.getContext('2d');
    g.drawImage(im, 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(im, 0, 0);
    return (tintCache[key] = c);
  };
  const out = {};
  const FW = 320, FH = 320;
  for (const [name, P] of Object.entries(PRESETS)) {
    const FR = P.frames || 24, DUR = P.dur || 1.4;
    const sheet = canvas(FW * FR, FH), sg = sheet.getContext('2d');
    const r = rngf(name.length * 977 + 7);
    // pre-generate particles over one loop
    const parts = [];
    for (const e of P.emit) {
      const spawn = (t0, k) => {
        const a = e.up ? -Math.PI / 2 + (r() - 0.5) * Math.PI * (e.spread ?? 1) : r() * Math.PI * 2;
        const sp = e.speed ? e.speed[0] + r() * (e.speed[1] - e.speed[0]) : 0;
        const dir = e.dir !== undefined ? e.dir + (r() - 0.5) * Math.PI * (e.spread ?? 1) : a;
        const P0 = parts.length; parts.push({ e, t0, vxd: Math.cos(dir) * sp, vyd: Math.sin(dir) * sp, x: e.xstart !== undefined ? e.xstart + r() * 40 : FW / 2 + (e.jitter ? (r() - 0.5) * e.jitter * 2 : 0), y: e.xstart !== undefined ? (e.spawnY ?? FH / 2) + (r() - 0.5) * (e.jitter || 0) * 2 : e.spawnY ?? e.y ?? FH / 2, vx: e.vel ? e.vel[0] : (e.dir !== undefined ? Math.cos(dir) * sp : Math.cos(a) * sp), vy: (e.vel ? e.vel[1] : (e.dir !== undefined ? Math.sin(dir) * sp : Math.sin(a) * sp)) * (e.ring ? 0.35 : 1), rot: r() * 6.28, k, ph: r() * 6.28, col: P.tint[k % 2] });
        if (e.jy) parts[P0].y += (r() - 0.5) * e.jy * 2;
      };
      if (e.rate) { for (let t = -e.life; t < DUR; t += 1 / e.rate) spawn(t, Math.floor(r() * 2)); }
      else if (e.orbit || e.beam || e.body) { spawn(0, 0); }
      else for (let k = 0; k < e.n; k++) spawn(e.at || 0, k);
    }
    const gusts = [];
    if (P.swirl) {
      for (let k = 0; k < 6; k++) {
        const nl = k % 3 === 0 ? 2 : 1, loops = [];
        for (let i = 0; i < nl; i++) loops.push({ at: 0.25 + i * 0.3 + r() * 0.1, radius: 2.2 + r() * 1.8, tilt: (r() - 0.5) * 0.8 });
        const p = { speed: 26 + r() * 10, duration: 1.4 + r() * 0.6, wobbleAmp: 0.6 + r() * 1.2, wobbleFreq: 0.02 + r() * 0.03, rise: 0.5 + r() * 1.5, loops, phase: r() * 6.28 };
        const strands = []; const ns = 1 + Math.floor(r() * 3);
        for (let i = 0; i < ns; i++) strands.push({ delay: i * (0.04 + r() * 0.08), dy: (i ? (i % 2 ? 1 : -1) * (0.8 + r() * 0.6) : 0), w: 0.75 * (1 - i * 0.25) });
        gusts.push({ p, strands, t0: k * (DUR / 6) + r() * 0.2, x: -140 + r() * 80, y: 60 + r() * 120 });
      }
    }
    for (let f = 0; f < FR; f++) {
      const T = (f / FR) * DUR, ox = f * FW;
      sg.save(); sg.beginPath(); sg.rect(ox, 0, FW, FH); sg.clip();
      sg.fillStyle = P.bg; sg.fillRect(ox, 0, FW, FH);
      if (P.swirl) { drawSwirlFrame(sg, ox, T, DUR, FW, FH, gusts); sg.restore(); continue; }
      sg.globalCompositeOperation = 'lighter';
      for (const p of parts) {
        const e = p.e;
        if (e.beam) { const im = tinted(e.tex, P.tint[0]); sg.globalAlpha = e.alpha[0]; sg.drawImage(im, ox + FW / 2 - e.size[0] / 2, 0, e.size[0], FH); continue; }
        if (e.body) { sg.globalCompositeOperation = 'source-over'; sg.globalAlpha = 1; sg.fillStyle = 'rgba(255,255,255,0.10)'; sg.beginPath(); sg.ellipse(ox + FW / 2, 180, 95, 62, 0, 0, Math.PI * 2); sg.fill(); sg.beginPath(); sg.ellipse(ox + FW / 2 - 70, 140, 42, 38, 0, 0, Math.PI * 2); sg.fill(); sg.globalCompositeOperation = 'lighter'; continue; }
        if (e.orbit) { for (let k = 0; k < e.orbit; k++) { const a = T * e.speed * 2 + (k / e.orbit) * Math.PI * 2; const im = tinted(e.tex, P.tint[k % 2]); sg.globalAlpha = 1; sg.drawImage(im, ox + FW / 2 + Math.cos(a) * e.radius - 20, FH / 2 + Math.sin(a) * e.radius * 0.35 - 20, 40, 40); } continue; }
        let age = T - p.t0; if (P.loop && !e.rate) age = T; if (e.rate) { age = ((T - p.t0) % DUR + DUR) % DUR; }
        if (age < 0 || age > e.life) continue;
        const u = age / e.life;
        let size = e.size ? e.size[0] + (e.size[1] - e.size[0]) * u : 0;
        if (e.sizeK) { const K = e.sizeK; for (let q = 1; q < K.length; q++) if (u <= K[q][0]) { const w = (u - K[q - 1][0]) / (K[q][0] - K[q - 1][0]); size = K[q - 1][1] + (K[q][1] - K[q - 1][1]) * w; break; } }
        let alpha = (e.alpha[0] + (e.alpha[1] - e.alpha[0]) * u) * (e.pulse ? 0.5 + 0.5 * Math.sin(age * 6 + p.ph) : 1);
        if (e.fadeIn) alpha *= Math.min(1, u / 0.15);
        if (e.flicker) alpha *= (Math.floor(age * 30) % 3) ? 1 : 0.15;
        if (size <= 0) continue;
        // drag: v(t) = v0 * exp(-k t)  ->  x = v0 (1 - e^-kt) / k
        const dk = e.drag || 0, dist = dk ? (1 - Math.exp(-dk * age)) / dk : age;
        const x = p.x + p.vx * dist + (e.wave ? Math.sin(age * 2 + p.ph) * e.wave : 0), y = p.y + p.vy * dist + 0.5 * (e.gravity || 0) * age * age;
        const col = e.rainbow ? `hsl(${Math.round(((u * 0.8 + p.ph / 6.28) % 1) * 12) * 30},100%,65%)` : e.col || (e.k !== undefined ? P.tint[e.k] : p.col);
        let im = e.raw ? imgs[e.tex] : tinted(e.tex, col);
        let sx = 0, sy = 0, sw = im.width, sh = im.height;
        if (e.flip) { const fr = e.rate ? Math.floor((age * 18 + p.ph * 3) % 16) : Math.min(15, Math.floor(u * 16)); sw = im.width / 4; sh = im.height / 4; sx = (fr % 4) * sw; sy = Math.floor(fr / 4) * sh; }
        sg.globalAlpha = Math.max(0, alpha);
        sg.globalCompositeOperation = e.raw || e.normal ? 'source-over' : 'lighter';
        sg.save(); sg.translate(ox + x, y);
        const dv = dk ? Math.exp(-dk * age) : 1;
        const ang = e.align ? Math.atan2(p.vy * dv + (e.gravity || 0) * age, p.vx * dv) + (e.tex === 'Droplet' ? Math.PI / 2 : 0) + (e.alignOff || 0) : e.upright ? 0 : p.rot + (e.spin || 0) * age;
        if (e.flat) sg.scale(1, 0.35);
        sg.rotate(ang);
        const fl = e.flutter ? Math.abs(Math.cos(age * 7 + p.ph)) * 0.8 + 0.2 : 1;
        sg.scale(1, fl);
        sg.drawImage(im, sx, sy, sw, sh, -size / 2, -size / 2 * (sh / sw), size, size * (sh / sw)); sg.restore();
      }
      sg.restore();
    }
    out[name] = { sheet: sheet.toDataURL('image/png'), frames: FR, duration: DUR, frameW: FW };
  }
  return out;
}
