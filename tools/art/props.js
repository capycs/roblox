// Runs in headless Chromium (see build-props.mjs). Exports prop GLBs and renders previews.
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { buildProp } from './lib.js';
import { makeRenderer, shoot, fitCam, paletteTexture } from './render.js';

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
  const { group, stats } = buildProp(spec, mat);
  return { glb: glbToBase64(await new GLTFExporter().parseAsync(group, { binary: true })), stats };
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
    if (!m.userData.glow || spec.outlineGlow) m.add(new THREE.Mesh(m.geometry, outline));
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
  return { scene, model, center, radius, size };
}

export async function runProps(file) {
  const mod = await import(`./props/${file}.js`);
  const specs = Array.isArray(mod.default) ? mod.default : [mod.default];
  const results = [];
  for (const spec of specs) {
    const out = { name: spec.name, category: spec.category || file, images: {} };
    const exp = await exportGLB(spec);
    out.glb = exp.glb; out.stats = exp.stats;
    const S = toonScene(spec);
    const [w, h] = spec.heroSize || [900, 720];
    const r = makeRenderer(w, h);
    const cam = fitCam(S, spec.fov || 30, w, h, spec.view || [-1, 0.55, -1.15], spec.fit || 0.78, spec.lift ?? 1);
    if (spec.animate) spec.animate(S.model.meshes, S.model.group, 0.15);
    shoot(r, S.scene, cam);
    out.images.hero = r.domElement.toDataURL('image/png');
    r.dispose(); r.forceContextLoss();
    if (spec.animate) {
      const FW = 400, FH = 320, n = spec.frames || 24;
      const rr = makeRenderer(FW, FH);
      const c2 = fitCam(S, spec.fov || 30, FW, FH, spec.view || [-1, 0.55, -1.15], (spec.fit || 0.78) * 1.08, spec.lift ?? 1);
      const sheet = document.createElement('canvas'); sheet.width = FW * n; sheet.height = FH;
      for (let i = 0; i < n; i++) {
        spec.animate(S.model.meshes, S.model.group, i / n);
        shoot(rr, S.scene, c2);
        sheet.getContext('2d').drawImage(rr.domElement, i * FW, 0);
      }
      out.images.sprite = sheet.toDataURL('image/png');
      out.sprite = { frames: n, duration: spec.loopSeconds || 2 };
      rr.dispose(); rr.forceContextLoss();
    }
    results.push(out);
  }
  return results;
}
