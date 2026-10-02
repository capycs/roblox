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
  Sparkle4(g) { g.fillStyle = radial(g, 128, 128, 70, [[0, W + '0.9)'], [1, W + '0)']]); g.fillRect(0, 0, S, S); g.fillStyle = '#fff'; star(g, 128, 128, 4, 124, 16); g.fill(); },
  Sparkle8(g) { g.fillStyle = radial(g, 128, 128, 60, [[0, W + '0.9)'], [1, W + '0)']]); g.fillRect(0, 0, S, S); g.fillStyle = '#fff'; star(g, 128, 128, 4, 120, 14); g.fill(); star(g, 128, 128, 4, 70, 12, -Math.PI / 4); g.fill(); },
  Star(g) { g.fillStyle = '#fff'; g.strokeStyle = W + '0.6)'; g.lineWidth = 10; g.lineJoin = 'round'; star(g, 128, 136, 5, 110, 50); g.fill(); g.stroke(); },
  Ring(g) { g.strokeStyle = '#fff'; g.lineWidth = 14; g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.stroke(); g.strokeStyle = W + '0.35)'; g.lineWidth = 34; g.stroke(); },
  Shockwave(g) { g.fillStyle = radial(g, 128, 128, 128, [[0, W + '0)'], [0.62, W + '0)'], [0.82, W + '0.95)'], [0.9, W + '0.6)'], [1, W + '0)']]); g.fillRect(0, 0, S, S); },
  Puff(g) { for (const [x, y, r, a] of [[128, 150, 70, 1], [80, 140, 50, 0.95], [176, 140, 52, 0.95], [110, 100, 52, 1], [160, 104, 46, 0.95], [128, 176, 48, 0.9]]) { g.fillStyle = radial(g, x - r * 0.25, y - r * 0.3, r * 1.1, [[0, W + a + ')'], [0.75, 'rgba(225,225,232,' + a + ')'], [1, 'rgba(200,200,210,0)']]); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } },
  Dust(g) { for (const [x, y, r] of [[128, 128, 80], [92, 140, 44], [168, 120, 46]]) { g.fillStyle = radial(g, x, y, r, [[0, W + '0.8)'], [1, W + '0)']]); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } },
  Flame(g) { const gr = g.createLinearGradient(0, 240, 0, 10); gr.addColorStop(0, W + '1)'); gr.addColorStop(0.6, W + '0.85)'); gr.addColorStop(1, W + '0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(128, 8); g.bezierCurveTo(170, 70, 220, 120, 200, 180); g.bezierCurveTo(190, 228, 150, 248, 128, 248); g.bezierCurveTo(106, 248, 66, 228, 56, 180); g.bezierCurveTo(40, 120, 100, 100, 110, 60); g.bezierCurveTo(118, 90, 140, 70, 128, 8); g.fill(); },
  Ember(g) { g.fillStyle = radial(g, 128, 128, 128, [[0, W + '1)'], [0.12, W + '1)'], [0.35, W + '0.4)'], [1, W + '0)']]); g.fillRect(0, 0, S, S); },
  Spark(g) { const gr = g.createLinearGradient(0, 128, 256, 128); gr.addColorStop(0, W + '0)'); gr.addColorStop(0.7, W + '0.9)'); gr.addColorStop(1, W + '1)'); g.fillStyle = gr; g.beginPath(); g.ellipse(128, 128, 126, 16, 0, 0, Math.PI * 2); g.fill(); },
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
  // 4x4 flipbook of a flame tongue flickering (for ParticleEmitter.FlipbookLayout = Grid4x4)
  FlameFlipbook(g, c) {
    c.width = c.height = 512;
    for (let f = 0; f < 16; f++) {
      const ox = (f % 4) * 128, oy = Math.floor(f / 4) * 128, t = f / 16, sway = Math.sin(t * Math.PI * 2) * 14, h = 100 - Math.abs(Math.sin(t * Math.PI * 3)) * 18;
      const gr = g.createLinearGradient(0, oy + 124, 0, oy + 124 - h); gr.addColorStop(0, W + '1)'); gr.addColorStop(0.65, W + '0.8)'); gr.addColorStop(1, W + '0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(ox + 64 + sway, oy + 124 - h); g.bezierCurveTo(ox + 100 + sway * 0.5, oy + 80, ox + 108, oy + 100, ox + 98, oy + 112); g.bezierCurveTo(ox + 90, oy + 126, ox + 38, oy + 126, ox + 30, oy + 112); g.bezierCurveTo(ox + 20, oy + 96, ox + 40 + sway * 0.5, oy + 70, ox + 64 + sway, oy + 124 - h); g.fill();
    }
  },
};

export function drawTextures() {
  const out = {};
  for (const [name, fn] of Object.entries(TEX)) { const c = canvas(); const g = c.getContext('2d'); fn(g, c); out[name] = c.toDataURL('image/png'); }
  return out;
}

// ---- preview simulation of the effect presets (2D, for the design canvas) ----
const PRESETS = {
  HatchBurst: { bg: '#1d1a22', tint: ['#fff3b0', '#ffd23f'], emit: [
    { tex: 'Rays', n: 1, life: 1.2, size: [60, 300], spin: 0.6, alpha: [0.9, 0], at: 0 },
    { tex: 'Shockwave', n: 1, life: 0.7, size: [20, 320], alpha: [1, 0], at: 0.05 },
    { tex: 'Sparkle4', n: 26, life: 1.0, size: [36, 8], speed: [140, 320], alpha: [1, 0], at: 0.02, spread: 1 },
    { tex: 'SoftGlow', n: 1, life: 0.9, size: [260, 120], alpha: [1, 0], at: 0 } ] },
  RarityBeam: { bg: '#141a22', tint: ['#b46bff', '#ff7ad9'], loop: true, emit: [
    { tex: 'BeamGradient', beam: true, size: [70, 320], alpha: [0.8, 0.8] },
    { tex: 'Sparkle4', rate: 14, life: 1.4, size: [18, 6], vel: [0, -110], jitter: 40, alpha: [1, 0] },
    { tex: 'RuneCircle', n: 1, life: 99, size: [150, 150], spin: 0.5, alpha: [0.8, 0.8], y: 250 } ] },
  Pickup: { bg: '#1d1a22', tint: ['#ffe07a', '#ffffff'], emit: [
    { tex: 'Coin', n: 6, life: 0.9, size: [44, 30], speed: [120, 220], gravity: 420, alpha: [1, 0], spread: 0.55, up: true },
    { tex: 'Sparkle8', n: 10, life: 0.6, size: [28, 4], speed: [80, 200], alpha: [1, 0], spread: 1 },
    { tex: 'Ring', n: 1, life: 0.45, size: [20, 180], alpha: [1, 0] } ] },
  FireHit: { bg: '#241a1c', tint: ['#ffd36b', '#ff5e14'], emit: [
    { tex: 'Flame', n: 14, life: 0.7, size: [70, 20], speed: [80, 200], alpha: [1, 0], spread: 1, gravity: -200 },
    { tex: 'Ember', n: 22, life: 1.0, size: [16, 4], speed: [120, 300], alpha: [1, 0], spread: 1, gravity: -60 },
    { tex: 'Shockwave', n: 1, life: 0.5, size: [20, 260], alpha: [0.9, 0] } ] },
  StormHit: { bg: '#161c2c', tint: ['#ffffff', '#3fdcff'], emit: [
    { tex: 'Bolt', n: 5, life: 0.35, size: [110, 90], speed: [40, 90], alpha: [1, 0], spread: 1 },
    { tex: 'Spark', n: 18, life: 0.45, size: [60, 20], speed: [200, 380], alpha: [1, 0], spread: 1, align: true },
    { tex: 'SoftGlow', n: 1, life: 0.4, size: [200, 260], alpha: [1, 0] } ] },
  IceHit: { bg: '#141d27', tint: ['#ffffff', '#8fe8ff'], emit: [
    { tex: 'Snowflake', n: 12, life: 1.0, size: [40, 14], speed: [100, 240], alpha: [1, 0], spread: 1, spin: 2 },
    { tex: 'Sparkle4', n: 14, life: 0.7, size: [26, 4], speed: [60, 200], alpha: [1, 0], spread: 1 },
    { tex: 'CrackBurst', n: 1, life: 0.6, size: [150, 200], alpha: [1, 0] } ] },
  ShadowHit: { bg: '#17121f', tint: ['#f3cdff', '#a54dff'], emit: [
    { tex: 'Wisp', n: 10, life: 0.9, size: [60, 110], speed: [60, 160], alpha: [0.9, 0], spread: 1, spin: 1.5 },
    { tex: 'Ember', n: 16, life: 0.8, size: [14, 4], speed: [80, 220], alpha: [1, 0], spread: 1 },
    { tex: 'Swirl', n: 1, life: 0.8, size: [60, 240], spin: -4, alpha: [1, 0] } ] },
  WaterHit: { bg: '#0e1c25', tint: ['#dcffff', '#38e2ff'], emit: [
    { tex: 'Droplet', n: 14, life: 0.8, size: [30, 16], speed: [150, 300], gravity: 600, alpha: [1, 0], spread: 0.7, up: true, align: true },
    { tex: 'Bubble', n: 10, life: 1.1, size: [24, 40], speed: [40, 110], gravity: -80, alpha: [1, 0], spread: 1 },
    { tex: 'Ring', n: 1, life: 0.5, size: [20, 220], alpha: [1, 0] } ] },
  NatureHit: { bg: '#141b12', tint: ['#c4ff7a', '#5fae45'], emit: [
    { tex: 'Leaf', n: 14, life: 1.1, size: [36, 24], speed: [100, 240], gravity: 140, alpha: [1, 0], spread: 1, spin: 3, raw: true },
    { tex: 'Petal', n: 8, life: 1.1, size: [24, 16], speed: [80, 200], gravity: 100, alpha: [1, 0], spread: 1, spin: 3, raw: true },
    { tex: 'SoftGlow', n: 1, life: 0.5, size: [120, 220], alpha: [0.9, 0] } ] },
  ExtractPortal: { bg: '#14202a', tint: ['#e6ffff', '#5ff0ff'], loop: true, emit: [
    { tex: 'Swirl', n: 1, life: 99, size: [230, 230], spin: 2.4, alpha: [0.95, 0.95] },
    { tex: 'RuneCircle', n: 1, life: 99, size: [290, 290], spin: -0.6, alpha: [0.7, 0.7] },
    { tex: 'Sparkle4', rate: 18, life: 1.0, size: [20, 4], vel: [0, -140], jitter: 120, alpha: [1, 0] } ] },
  KnockedDown: { bg: '#1d1a22', tint: ['#ffe07a', '#ffd23f'], loop: true, emit: [
    { tex: 'Star', orbit: 3, size: [40, 40], radius: 70, speed: 3, alpha: [1, 1], raw: false } ] },
  BiomeEmbers: { bg: '#241a1c', tint: ['#ffd36b', '#ff5e14'], loop: true, emit: [
    { tex: 'Ember', rate: 24, life: 2.2, size: [14, 4], vel: [10, -90], jitter: 160, wave: 30, alpha: [1, 0], spawnY: 300 } ] },
  BiomeSnow: { bg: '#141d27', tint: ['#ffffff', '#cfe8ff'], loop: true, emit: [
    { tex: 'Snowflake', rate: 16, life: 3.0, size: [20, 20], vel: [20, 100], jitter: 170, wave: 20, alpha: [1, 0.6], spawnY: 0, spin: 1 } ] },
  BiomeFireflies: { bg: '#141b12', tint: ['#fff7a0', '#a8ff4f'], loop: true, emit: [
    { tex: 'SoftGlow', rate: 6, life: 3.2, size: [26, 26], vel: [0, -15], jitter: 160, wave: 40, alpha: [1, 0], pulse: true } ] },
};

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
  const FW = 320, FH = 320, FR = 24, DUR = 1.4;
  for (const [name, P] of Object.entries(PRESETS)) {
    const sheet = canvas(FW * FR, FH), sg = sheet.getContext('2d');
    const r = rngf(name.length * 977 + 7);
    // pre-generate particles over one loop
    const parts = [];
    for (const e of P.emit) {
      const spawn = (t0, k) => {
        const a = e.up ? -Math.PI / 2 + (r() - 0.5) * Math.PI * (e.spread ?? 1) : r() * Math.PI * 2;
        const sp = e.speed ? e.speed[0] + r() * (e.speed[1] - e.speed[0]) : 0;
        parts.push({ e, t0, x: FW / 2 + (e.jitter ? (r() - 0.5) * e.jitter * 2 : 0), y: e.spawnY ?? e.y ?? FH / 2, vx: e.vel ? e.vel[0] : Math.cos(a) * sp, vy: e.vel ? e.vel[1] : Math.sin(a) * sp, rot: r() * 6.28, k, ph: r() * 6.28, col: P.tint[k % 2] });
      };
      if (e.rate) { for (let t = -e.life; t < DUR; t += 1 / e.rate) spawn(t, Math.floor(r() * 2)); }
      else if (e.orbit || e.beam) { spawn(0, 0); }
      else for (let k = 0; k < e.n; k++) spawn(e.at || 0, k);
    }
    for (let f = 0; f < FR; f++) {
      const T = (f / FR) * DUR, ox = f * FW;
      sg.save(); sg.beginPath(); sg.rect(ox, 0, FW, FH); sg.clip();
      sg.fillStyle = P.bg; sg.fillRect(ox, 0, FW, FH);
      sg.globalCompositeOperation = 'lighter';
      for (const p of parts) {
        const e = p.e;
        if (e.beam) { const im = tinted(e.tex, P.tint[0]); sg.globalAlpha = e.alpha[0]; sg.drawImage(im, ox + FW / 2 - e.size[0] / 2, 0, e.size[0], FH); continue; }
        if (e.orbit) { for (let k = 0; k < e.orbit; k++) { const a = T * e.speed * 2 + (k / e.orbit) * Math.PI * 2; const im = tinted(e.tex, P.tint[k % 2]); sg.globalAlpha = 1; sg.drawImage(im, ox + FW / 2 + Math.cos(a) * e.radius - 20, FH / 2 + Math.sin(a) * e.radius * 0.35 - 20, 40, 40); } continue; }
        let age = T - p.t0; if (P.loop && !e.rate) age = T; if (e.rate) { age = ((T - p.t0) % DUR + DUR) % DUR; }
        if (age < 0 || age > e.life) continue;
        const u = age / e.life, size = e.size[0] + (e.size[1] - e.size[0]) * u, alpha = (e.alpha[0] + (e.alpha[1] - e.alpha[0]) * u) * (e.pulse ? 0.5 + 0.5 * Math.sin(age * 6 + p.ph) : 1);
        const x = p.x + p.vx * age + (e.wave ? Math.sin(age * 2 + p.ph) * e.wave : 0), y = p.y + p.vy * age + 0.5 * (e.gravity || 0) * age * age;
        const im = e.raw ? imgs[e.tex] : tinted(e.tex, p.col);
        sg.globalAlpha = Math.max(0, alpha);
        sg.globalCompositeOperation = e.raw ? 'source-over' : 'lighter';
        sg.save(); sg.translate(ox + x, y);
        const ang = e.align ? Math.atan2(p.vy + (e.gravity || 0) * age, p.vx) + (e.tex === 'Droplet' ? Math.PI / 2 : 0) : p.rot + (e.spin || 0) * age;
        sg.rotate(ang); sg.drawImage(im, -size / 2, -size / 2, size, size * (im.height / im.width)); sg.restore();
      }
      sg.restore();
    }
    out[name] = { sheet: sheet.toDataURL('image/png'), frames: FR, duration: DUR };
  }
  return out;
}
