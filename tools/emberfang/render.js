// Runs in headless Chromium (see build.mjs). Exports the GLB and renders previews.
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildEmberfang, paletteCanvas, GLOW } from './model.js';
import { CLIPS, applyPose, bakeClips } from './poses.js';

const BG = '#241a22';

function paletteTexture() {
  const t = new THREE.CanvasTexture(paletteCanvas());
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return t;
}

async function exportGLB() {
  const tex = paletteTexture();
  const mats = {
    Body: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, name: 'Body' }),
    Eyes: new THREE.MeshStandardMaterial({ color: GLOW.Eyes, emissive: GLOW.Eyes, name: 'Eyes' }),
    Flame: new THREE.MeshStandardMaterial({ color: GLOW.Flame, emissive: GLOW.Flame, name: 'Flame' }),
    FlameCore: new THREE.MeshStandardMaterial({ color: GLOW.FlameCore, emissive: GLOW.FlameCore, name: 'FlameCore' }),
  };
  const { group, boneMap, stats } = buildEmberfang((n) => mats[n]);
  const clips = bakeClips(boneMap);
  const glb = await new GLTFExporter().parseAsync(group, { binary: true, animations: clips });
  const bytes = new Uint8Array(glb);
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { glb: btoa(s), stats: { ...stats, clips: clips.map((c) => ({ name: c.name, duration: c.duration })) } };
}

function toonScene() {
  const tex = paletteTexture();
  const grad = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), 3, 1);
  grad.magFilter = THREE.NearestFilter; grad.minFilter = THREE.NearestFilter; grad.needsUpdate = true;
  const glow = (hex, k) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });
  const mats = {
    Body: new THREE.MeshToonMaterial({ map: tex, gradientMap: grad }),
    Eyes: glow(GLOW.Eyes, 1.25),
    Flame: glow(GLOW.Flame, 1.6),
    FlameCore: glow(GLOW.FlameCore, 1.8),
  };
  const model = buildEmberfang((n) => mats[n]);
  // inverted-hull outline on the body, pushed out along skinned normals
  const outline = new THREE.MeshBasicMaterial({ color: '#140b10', side: THREE.BackSide });
  outline.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\n transformed += normalize(objectNormal) * 0.035;');
  };
  for (const name of ['Body', 'Eyes']) {
    const src = model.meshes[name];
    const o = new THREE.SkinnedMesh(src.geometry, outline);
    model.group.add(o); o.bind(model.skeleton, src.bindMatrix);
  }
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.add(model.group);
  scene.add(new THREE.HemisphereLight('#ffe2c4', '#3a2232', 1.6));
  const key = new THREE.DirectionalLight('#fff1e0', 2.6); key.position.set(-5, 9, -7); scene.add(key);
  const rim = new THREE.DirectionalLight('#ff8a3d', 2.4); rim.position.set(5, 4, 9); scene.add(rim);
  const flameLight = new THREE.PointLight('#ff7a2a', 6, 6, 1.5); model.boneMap.TailFlame.add(flameLight); flameLight.position.set(0, 0.5, 0);
  // soft contact shadow
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, 'rgba(0,0,0,0.55)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.scale.set(3.6, 6.4, 1); shadow.position.set(0, 0.01, 0.3); scene.add(shadow);
  const rest = Object.fromEntries(Object.entries(model.boneMap).map(([n, b]) => [n, b.position.clone()]));
  return { scene, model, rest, shadow };
}

function makeRenderer(w, h) {
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(w, h);
  r.outputColorSpace = THREE.SRGBColorSpace;
  return r;
}

function shoot(renderer, scene, camera) {
  const size = renderer.getSize(new THREE.Vector2());
  const comp = new EffectComposer(renderer);
  comp.addPass(new RenderPass(scene, camera));
  comp.addPass(new UnrealBloomPass(size, 0.55, 0.45, 0.92));
  comp.addPass(new OutputPass());
  comp.render();
  comp.dispose();
}

function cam(fov, w, h, pos, target) {
  const c = new THREE.PerspectiveCamera(fov, w / h, 0.1, 200);
  c.position.set(...pos); c.lookAt(...target); return c;
}

export async function runAll() {
  const out = { images: {} };
  const exp = await exportGLB();
  out.glb = exp.glb; out.stats = exp.stats;

  const S = toonScene();
  const still = (name, w, h, fov, pos, target, clip = 'Idle', t = 0.3) => {
    const r = makeRenderer(w, h);
    applyPose(S.model.boneMap, S.rest, clip, t);
    shoot(r, S.scene, cam(fov, w, h, pos, target));
    out.images[name] = r.domElement.toDataURL('image/png');
    r.dispose();
  };
  still('hero', 1200, 1000, 30, [-7.2, 4.8, -9.2], [0, 2.45, 0.3]);
  still('roar', 900, 900, 30, [-7.8, 3.6, -7.5], [0, 2.7, 0.3], 'Roar', 1.0);
  const tgt = [0, 2.6, 0.4];
  still('front', 600, 640, 22, [0, 3.0, -19], tgt);
  still('side', 600, 640, 22, [-19, 3.0, 0.4], tgt);
  still('back', 600, 640, 22, [0, 3.4, 19], tgt);
  still('threeq', 600, 640, 22, [12, 5.5, 14], tgt);

  // sprite strips for each clip
  const FW = 400, FH = 320, FPS = 20;
  const r = makeRenderer(FW, FH);
  const camera = cam(28, FW, FH, [-9.5, 4.4, -8.6], [0, 2.4, 0.1]);
  out.sprites = {};
  for (const [clip, c] of Object.entries(CLIPS)) {
    const n = Math.round(c.duration * FPS);
    const sheet = document.createElement('canvas'); sheet.width = FW * n; sheet.height = FH;
    const g = sheet.getContext('2d');
    for (let i = 0; i < n; i++) {
      applyPose(S.model.boneMap, S.rest, clip, (i / n) * c.duration);
      shoot(r, S.scene, camera);
      g.drawImage(r.domElement, i * FW, 0);
    }
    out.images['sprite_' + clip] = sheet.toDataURL('image/png');
    out.sprites[clip] = { frames: n, fw: FW, fh: FH, duration: c.duration };
  }
  r.dispose();
  return out;
}
