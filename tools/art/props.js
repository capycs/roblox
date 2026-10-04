// Runs in headless Chromium (see build-props.mjs). Exports prop GLBs and renders previews.
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { buildProp } from './lib.js';
import { makeRenderer, shoot, fitBox, paletteTexture } from './render.js';
import { kindOf, animate3, animateFlag3, animateWhole3, RULES } from './anim.js';

function glbToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function exportGLB(spec) {
  const tex = paletteTexture(spec);
  const mat = (n, textured) => textured
    ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, name: n })
    : spec.glass && spec.glass[n]
      ? new THREE.MeshStandardMaterial({ color: spec.glass[n], transparent: true, opacity: 0.35, roughness: 0.1, name: n })
      : new THREE.MeshStandardMaterial({ color: spec.glow[n], emissive: spec.glow[n], name: n });
  const { group, stats, meshes, boneMap } = buildProp(spec, mat);
  group.updateMatrixWorld(true);
  group.traverse((o) => o.geometry && o.geometry.deleteAttribute('outlineK'));
  const clips = bakePropIdle(spec, group, meshes, boneMap);
  stats.clips = clips.map((c) => ({ name: c.name, duration: c.duration }));
  return { glb: glbToBase64(await new GLTFExporter().parseAsync(group, { binary: true, animations: clips })), stats };
}

// Built-in "Idle" clip: samples the same rules the game uses (sway, spin, swing, hover, flag
// bones, whole-model wobble/spin) over one loop and stores them as glTF animation tracks.
function bakePropIdle(spec, group, meshes, boneMap) {
  const movers = Object.entries(meshes).filter(([n]) => kindOf(n));
  const flags = boneMap ? Object.keys(boneMap).filter((n) => /^Flag\d+$/.test(n)) : [];
  if (!movers.length && !flags.length && !spec.whole) return [];
  const D = spec.loopSeconds || (spec.whole === 'spinbob' ? (Math.PI * 2) / RULES.whole.spinbob.spin : 2.0), fps = 20, n = Math.round(D * fps);
  const times = [], tr = {};
  const track = (obj) => { const k = obj.uuid; return tr[k] || (tr[k] = { obj, q: [], p: [] }); };
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * D; times.push(t);
    for (const [name, m] of movers) animate3(m, name, t);
    if (boneMap) animateFlag3(boneMap, t);
    if (spec.whole) animateWhole3(group, spec.whole, t);
    for (const [, m] of movers) { const e = track(m); e.q.push(...m.quaternion.toArray()); e.p.push(...m.position.toArray()); }
    for (const f of flags) { const e = track(boneMap[f]); e.q.push(...boneMap[f].quaternion.toArray()); e.p.push(...boneMap[f].position.toArray()); }
    if (spec.whole) { const e = track(group); e.q.push(...group.quaternion.toArray()); e.p.push(...group.position.toArray()); }
  }
  const tracks = [];
  for (const { obj, q, p } of Object.values(tr)) {
    tracks.push(new THREE.QuaternionKeyframeTrack(`${obj.name}.quaternion`, times, q));
    tracks.push(new THREE.VectorKeyframeTrack(`${obj.name}.position`, times, p));
  }
  // leave the model in its rest pose for the export
  for (const [name, m] of movers) animate3(m, name, 0);
  if (spec.whole) animateWhole3(group, spec.whole, 0);
  return [new THREE.AnimationClip('Idle', D, tracks)];
}

function toonScene(spec) {
  const tex = paletteTexture(spec);
  const grad = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), 3, 1);
  grad.magFilter = THREE.NearestFilter; grad.minFilter = THREE.NearestFilter; grad.needsUpdate = true;
  const mat = (n, textured) => textured
    ? new THREE.MeshToonMaterial({ map: tex, gradientMap: grad })
    : spec.glass && spec.glass[n]
      ? new THREE.MeshToonMaterial({ color: spec.glass[n], gradientMap: grad, transparent: true, opacity: 0.3, depthWrite: false })
      : new THREE.MeshBasicMaterial({ color: new THREE.Color(spec.glow[n]).multiplyScalar(1.1), toneMapped: false });
  const model = buildProp(spec, mat);
  const box = new THREE.Box3().setFromObject(model.group);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const radius = size.length() / 2;
  const outline = new THREE.MeshBasicMaterial({ color: spec.outline || '#120c10', side: THREE.BackSide });
  const thick = (spec.outlineWidth ?? 0.03 * Math.max(1, radius / 3)).toFixed(4);
  outline.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n transformed += normalize(normal) * ${thick};`);
  };
  for (const [n, m] of Object.entries(model.meshes)) {
    m.userData.glow = !!(spec.glow && spec.glow[n]);
    const isGlass = !!(spec.glass && spec.glass[n]);
    if (isGlass) { m.userData.noBloomOccluder = true; m.renderOrder = 2; continue; }
    if (m.isSkinnedMesh) continue;
    // Outlines are drawn as a silhouette after rendering (like Roblox Highlight), not per mesh.
  }
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(spec.bg || '#1d1a22');
  scene.add(model.group);
  scene.add(new THREE.HemisphereLight('#fff1e2', '#2c2638', 1.7));
  const key = new THREE.DirectionalLight('#fff4e8', 2.5); key.position.set(-5, 9, -7); scene.add(key);
  const rim = new THREE.DirectionalLight(spec.rim || '#ffd2a0', 1.6); rim.position.set(5, 4, 9); scene.add(rim);
  if (!spec.noShadow) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, 'rgba(0,0,0,0.5)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.userData.noBloomOccluder = true;
    shadow.scale.set(size.x * 1.3, size.z * 1.3, 1); shadow.position.set(center.x, box.min.y + 0.01, center.z);
    scene.add(shadow);
  }
  const pts = [];
  model.group.updateMatrixWorld(true);
  model.group.traverse((o) => {
    if (!o.isMesh || !o.geometry.attributes.position || o.parent?.isMesh) return;
    const P = o.geometry.attributes.position, step = Math.max(1, Math.floor(P.count / 1500));
    for (let i = 0; i < P.count; i += step) pts.push(new THREE.Vector3().fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld));
  });
  return { scene, model, center, radius, size, box, pts };
}

// Outline-only silhouette around the whole model, the same thing Roblox's Highlight draws.
const MASK = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
function shootOutlined(r, scene, cam, bloom, color, px, transparent = false) {
  shoot(r, scene, cam, bloom);
  const w = r.domElement.width, h = r.domElement.height;
  const A = document.createElement('canvas'); A.width = w; A.height = h; A.getContext('2d').drawImage(r.domElement, 0, 0);
  const saved = new Map(), hidden = [];
  scene.traverse((o) => {
    if (o.userData.noBloomOccluder && !(o.isMesh && o.material && o.material.transparent && o.renderOrder === 2)) { if (o.visible) { hidden.push(o); o.visible = false; } }
    else if (o.isMesh) { saved.set(o, o.material); o.material = MASK; }
  });
  const bg = scene.background; scene.background = null; r.setClearColor(0x000000, 0); r.clear();
  r.render(scene, cam);
  for (const [o, m] of saved) o.material = m; for (const o of hidden) o.visible = true; scene.background = bg;
  const M = document.createElement('canvas'); M.width = w; M.height = h; M.getContext('2d').drawImage(r.domElement, 0, 0);
  const O = document.createElement('canvas'); O.width = w; O.height = h; const og = O.getContext('2d');
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; og.drawImage(M, Math.cos(a) * px, Math.sin(a) * px); }
  og.drawImage(M, 0, 0);
  og.globalCompositeOperation = 'source-in'; og.fillStyle = color; og.fillRect(0, 0, w, h);
  og.globalCompositeOperation = 'destination-out'; og.drawImage(M, 0, 0);
  A.getContext('2d').drawImage(O, 0, 0);
  if (transparent) {
    // icons: keep only the silhouette + outline, everything else becomes see-through
    const D = document.createElement('canvas'); D.width = w; D.height = h; const dg = D.getContext('2d');
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; dg.drawImage(M, Math.cos(a) * (px + 1), Math.sin(a) * (px + 1)); }
    dg.drawImage(M, 0, 0);
    const ag = A.getContext('2d'); ag.globalCompositeOperation = 'destination-in'; ag.drawImage(D, 0, 0); ag.globalCompositeOperation = 'source-over';
  }
  return A;
}

export async function runProps(file) {
  const mod = await import(`./props/${file}.js`);
  const specs = Array.isArray(mod.default) ? mod.default : [mod.default];
  const results = [];
  for (const spec of specs) {
    const out = { name: spec.name, category: spec.category || file, v2: !!spec.v2, whole: spec.whole || null, images: {} };
    const exp = await exportGLB(spec);
    out.glb = exp.glb; out.stats = exp.stats;
    const S = toonScene(spec);
    const [w, h] = spec.heroSize || [900, 720];
    const r = makeRenderer(w, h);
    const view = spec.view || [-1, 0.55, -1.15], bloom = spec.bloom ?? 0.45;
    const cam = fitBox(S.box, spec.fov || 30, w, h, view, spec.margin || 0.84, S.pts);
    const animated = spec.animate || spec.bones || spec.whole || Object.keys(S.model.meshes).some((n) => kindOf(n));
    const step = (u) => {
      const t = u * (spec.loopSeconds || 2);
      for (const [n, m] of Object.entries(S.model.meshes)) animate3(m, n, t);
      if (S.model.boneMap) animateFlag3(S.model.boneMap, t);
      if (spec.animate) spec.animate(S.model.meshes, S.model.group, u);
      if (spec.whole) animateWhole3(S.model.group, spec.whole, t);
    };
    if (animated) step(0.15);
    const olc = spec.outline || '#120c10';
    out.images.hero = shootOutlined(r, S.scene, cam, bloom, olc, Math.max(2, Math.round(w / 220))).toDataURL('image/png');
    if (spec.icon) out.images.icon = shootOutlined(r, S.scene, cam, bloom * 0.6, olc, Math.max(3, Math.round(w / 140)), true).toDataURL('image/png');
    if (spec.iconSprite) {
      // transparent 4x4 sheet (1024x1024, Roblox's max image size): one full turn with a gentle bob,
      // played in UI with ImageRectOffset (Premium.spriteIcon)
      const FS = 256, rr = makeRenderer(FS, FS);
      const c3 = fitBox(S.box, spec.fov || 30, FS, FS, view, (spec.margin || 0.84) * 0.86, S.pts);
      const sheet = document.createElement('canvas'); sheet.width = FS * 4; sheet.height = FS * 4;
      const g0 = S.model.group, baseRot = g0.rotation.y, baseY = g0.position.y;
      for (let i = 0; i < 16; i++) {
        const u = i / 16;
        g0.rotation.y = baseRot + u * Math.PI * 2; g0.position.y = baseY + Math.sin(u * Math.PI * 2) * (S.size?.y || 2) * 0.03;
        for (const [n, m] of Object.entries(S.model.meshes)) animate3(m, n, u * 2);
        sheet.getContext('2d').drawImage(shootOutlined(rr, S.scene, c3, bloom * 0.6, olc, 3, true), (i % 4) * FS, Math.floor(i / 4) * FS);
      }
      g0.rotation.y = baseRot; g0.position.y = baseY;
      out.images.iconSprite = sheet.toDataURL('image/png');
      rr.dispose(); rr.forceContextLoss();
    }
    r.dispose(); r.forceContextLoss();
    if (animated) {
      const FW = 400, FH = 320, n = spec.frames || 24;
      const rr = makeRenderer(FW, FH);
      const c2 = fitBox(S.box, spec.fov || 30, FW, FH, view, (spec.margin || 0.84) * 0.92, S.pts);
      const sheet = document.createElement('canvas'); sheet.width = FW * n; sheet.height = FH;
      for (let i = 0; i < n; i++) {
        step(i / n);
        sheet.getContext('2d').drawImage(shootOutlined(rr, S.scene, c2, bloom, olc, 2), i * FW, 0);
      }
      out.images.sprite = sheet.toDataURL('image/png');
      out.sprite = { frames: n, duration: spec.loopSeconds || 2 };
      rr.dispose(); rr.forceContextLoss();
    }
    results.push(out);
  }
  return results;
}
