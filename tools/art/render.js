// Runs in headless Chromium (see build.mjs). Exports a species' GLB and renders previews.
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { buildCreature, paletteCanvas } from './lib.js';
import { CLIP_NAMES, makeStyle, applyPose, bakeClips } from './poses.js';

export function paletteTexture(spec) {
  const t = new THREE.CanvasTexture(paletteCanvas(spec.palette));
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return t;
}

async function exportGLB(spec, style) {
  const tex = paletteTexture(spec);
  const mat = (n) => n === 'Body'
    ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, name: 'Body' })
    : new THREE.MeshStandardMaterial({ color: spec.glow[n], emissive: spec.glow[n], name: n });
  const { group, boneMap, stats } = buildCreature(spec, mat);
  const clips = bakeClips(style, boneMap);
  const glb = await new GLTFExporter().parseAsync(group, { binary: true, animations: clips });
  const bytes = new Uint8Array(glb);
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { glb: btoa(s), stats: { ...stats, clips: clips.map((c) => ({ name: c.name, duration: c.duration })) } };
}

function toonScene(spec) {
  const tex = paletteTexture(spec);
  const grad = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), 3, 1);
  grad.magFilter = THREE.NearestFilter; grad.minFilter = THREE.NearestFilter; grad.needsUpdate = true;
  const boost = (n) => (spec.glowBoost && spec.glowBoost[n]) || (n === 'Eyes' ? 1.0 : /Core$/.test(n) ? 1.25 : 1.1);
  const mat = (n) => n === 'Body'
    ? new THREE.MeshToonMaterial({ map: tex, gradientMap: grad })
    : new THREE.MeshBasicMaterial({ color: new THREE.Color(spec.glow[n]).multiplyScalar(boost(n)), toneMapped: false });
  const model = buildCreature(spec, mat);
  for (const [n, m] of Object.entries(model.meshes)) {
    m.userData.glow = n !== 'Body';
    // eyes glow softly so pupils stay readable
    if (n === 'Eyes') m.userData.bloomMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(spec.glow[n]).multiplyScalar(0.3) });
  }

  const box = new THREE.Box3();
  for (const m of Object.values(model.meshes)) box.union(m.geometry.boundingBox);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const radius = size.length() / 2;

  // inverted-hull outline pushed out along skinned normals
  const outline = new THREE.MeshBasicMaterial({ color: spec.outline || '#140b10', side: THREE.BackSide });
  const thick = (0.035 * radius / 4.76).toFixed(4);
  outline.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <skinning_vertex>', `#include <skinning_vertex>\n transformed += normalize(objectNormal) * ${thick};`);
  };
  for (const name of ['Body', 'Eyes']) {
    const src = model.meshes[name]; if (!src) continue;
    const o = new THREE.SkinnedMesh(src.geometry, outline);
    model.group.add(o); o.bind(model.skeleton, src.bindMatrix);
  }
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(spec.bg);
  scene.add(model.group);
  scene.add(new THREE.HemisphereLight('#ffe9d6', '#2c2236', 1.6));
  const key = new THREE.DirectionalLight('#fff3e6', 2.6); key.position.set(-5, 9, -7); scene.add(key);
  const rim = new THREE.DirectionalLight(spec.light.color, 2.4); rim.position.set(5, 4, 9); scene.add(rim);
  const pl = new THREE.PointLight(spec.light.color, 6, 6 * radius / 4.76, 1.5);
  model.boneMap[spec.light.bone].add(pl); pl.position.set(0, 0.4, 0);
  // soft contact shadow
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, 'rgba(0,0,0,0.55)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.userData.noBloomOccluder = true;
  const foot = spec.footprint || [Math.min(size.x, 4.5) * 1.4, Math.min(size.z, 7.5) * 1.0];
  shadow.scale.set(foot[0], foot[1], 1); shadow.position.set(0, 0.01, center.z * 0.5); scene.add(shadow);
  const rest = Object.fromEntries(Object.entries(model.boneMap).map(([n, b]) => [n, b.position.clone()]));
  return { scene, model, rest, center, radius, size };
}

export function makeRenderer(w, h) {
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(w, h);
  r.outputColorSpace = THREE.SRGBColorSpace;
  return r;
}

// Selective bloom: only glow meshes bloom (everything else renders black into the
// bloom pass so it still occludes), then the bloom is added over the normal render.
export const BLACK = new THREE.MeshBasicMaterial({ color: 0x000000 });
const MIX = {
  uniforms: { baseTexture: { value: null }, bloomTexture: { value: null } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D baseTexture; uniform sampler2D bloomTexture; varying vec2 vUv; void main() { gl_FragColor = texture2D(baseTexture, vUv) + texture2D(bloomTexture, vUv); }',
};
export function shoot(renderer, scene, camera, strength = 0.7) {
  const size = renderer.getSize(new THREE.Vector2());
  const bloom = new EffectComposer(renderer);
  bloom.renderToScreen = false;
  bloom.addPass(new RenderPass(scene, camera));
  bloom.addPass(new UnrealBloomPass(size, strength, 0.45, 0.0));
  const final = new EffectComposer(renderer);
  final.addPass(new RenderPass(scene, camera));
  const mix = new ShaderPass(new THREE.ShaderMaterial(MIX), 'baseTexture');
  mix.uniforms.bloomTexture.value = bloom.renderTarget2.texture;
  final.addPass(mix);
  final.addPass(new OutputPass());

  const saved = new Map(), hidden = [];
  scene.traverse((o) => {
    if (o.userData.noBloomOccluder) { if (o.visible) { hidden.push(o); o.visible = false; } }
    else if (o.isMesh && (!o.userData.glow || o.userData.bloomMat)) { saved.set(o, o.material); o.material = o.userData.bloomMat || BLACK; }
  });
  const bg = scene.background; scene.background = new THREE.Color(0x000000);
  bloom.render();
  for (const [o, m] of saved) o.material = m;
  for (const o of hidden) o.visible = true;
  scene.background = bg;
  final.render();
  bloom.dispose(); final.dispose();
}

// Camera along dir, re-centred and pulled back until every corner of box (or every pt) sits inside margin (NDC).
// pts: optional world-space sample of the model's vertices (tighter than the box corners).
export function fitBox(box, fov, w, h, dir, margin = 0.84, pts = null) {
  const c = new THREE.PerspectiveCamera(fov, w / h, 0.1, 800);
  const d = new THREE.Vector3(...dir).normalize(), target = box.getCenter(new THREE.Vector3());
  const corners = pts || [];
  if (!pts) for (let i = 0; i < 8; i++) corners.push(new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z));
  let dist = box.getSize(new THREE.Vector3()).length() * 2;
  const ext = () => {
    c.position.copy(target).addScaledVector(d, dist); c.lookAt(target); c.updateMatrixWorld(); c.updateProjectionMatrix();
    let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    for (const p of corners) { const q = p.clone().project(c); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
    return { x0, x1, y0, y1 };
  };
  for (let it = 0; it < 6; it++) {
    let e = ext();
    const right = new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 1);
    const th = Math.tan(THREE.MathUtils.degToRad(fov) / 2) * dist;
    target.addScaledVector(right, ((e.x0 + e.x1) / 2) * th * (w / h)).addScaledVector(up, ((e.y0 + e.y1) / 2) * th);
    e = ext();
    dist *= Math.max(e.x1 - e.x0, e.y1 - e.y0) / (2 * margin);
  }
  ext(); return c;
}

// Camera looking along dir at the model, distance fitted to its bounding sphere.
export function fitCam(S, fov, w, h, dir, k, lift = 0.8) {
  const c = new THREE.PerspectiveCamera(fov, w / h, 0.1, 400);
  const vf = THREE.MathUtils.degToRad(fov), hf = 2 * Math.atan(Math.tan(vf / 2) * w / h);
  const dist = (S.radius / Math.sin(Math.min(vf, hf) / 2)) * k;
  const target = new THREE.Vector3(S.center.x, S.center.y * lift, S.center.z);
  c.position.copy(target).addScaledVector(new THREE.Vector3(...dir).normalize(), dist);
  c.lookAt(target); return c;
}

export async function runAll(specName) {
  const spec = (await import(`./species/${specName}.js`)).default;
  const style = makeStyle(spec.style);
  const out = { images: {} };
  const exp = await exportGLB(spec, style);
  out.glb = exp.glb; out.stats = exp.stats;

  const S = toonScene(spec);
  const V = spec.views || {};
  const still = (name, w, h, fov, dir, k, clip = 'Idle', t = 0.3) => {
    const r = makeRenderer(w, h);
    applyPose(style, S.model.boneMap, S.rest, clip, t);
    shoot(r, S.scene, fitCam(S, fov, w, h, dir, k));
    out.images[name] = r.domElement.toDataURL('image/png');
    r.dispose(); r.forceContextLoss();
  };
  still('hero', 1200, 1000, 30, V.hero || [-7.2, 2.35, -9.5], 0.66);
  still('roar', 900, 900, 30, V.roar || [-7.8, 0.9, -7.8], 0.82, 'Roar', 1.0);
  still('front', 600, 640, 22, [0, 0.2, -1], 0.74);
  still('side', 600, 640, 22, [-1, 0.03, 0], 0.74);
  still('back', 600, 640, 22, [0, 0.05, 1], 0.74);
  still('threeq', 600, 640, 22, [12, 3, 14], 0.74);

  // sprite strips for each clip
  const FW = 400, FH = 320, FPS = 20;
  const r = makeRenderer(FW, FH);
  const camera = fitCam(S, 28, FW, FH, V.sprite || [-9.5, 2.0, -8.7], 0.66);
  out.sprites = {};
  for (const clip of CLIP_NAMES) {
    const D = style.dur[clip], n = Math.round(D * FPS);
    const sheet = document.createElement('canvas'); sheet.width = FW * n; sheet.height = FH;
    const g = sheet.getContext('2d');
    for (let i = 0; i < n; i++) {
      applyPose(style, S.model.boneMap, S.rest, clip, (i / n) * D);
      shoot(r, S.scene, camera);
      g.drawImage(r.domElement, i * FW, 0);
    }
    out.images['sprite_' + clip] = sheet.toDataURL('image/png');
    out.sprites[clip] = { frames: n, fw: FW, fh: FH, duration: D };
  }
  r.dispose(); r.forceContextLoss();
  out.name = spec.name; out.element = spec.element;
  return out;
}
