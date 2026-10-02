// Shared quadruped animation. Every creature uses the same bone names, so one set of
// pose functions drives all of them; a per-species style table changes the feel.
// Mirrored 1:1 by src/shared/Creatures/Poses/Quadruped.luau. Keep both in sync.
//
// pose(style, clip, t) -> { rot: { Bone: [rx, ry, rz] }, hips: [x, y, z] }
// Rotations are XYZ euler radians in each bone's rest frame (rest frames are
// axis-aligned with the model): +rx on a leg swings the paw forward, +rx on an ear
// or tail segment tips it backward, -rx on Jaw opens the mouth, and +rz raises the
// right wing (-rz raises the left).
import * as THREE from 'three';

const TAU = Math.PI * 2;
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const pos = (x) => Math.max(0, x);
const sin = Math.sin, cos = Math.cos;

export const CLIP_NAMES = ['Idle', 'Walk', 'Run', 'Attack', 'Roar'];
export const LOOPS = { Idle: true, Walk: true, Run: true, Attack: false, Roar: false };

export const DEFAULT_STYLE = {
  tip: 'TailFlame', // bone at the tail tip that flickers
  dur: { Idle: 2.4, Walk: 1.0, Run: 0.6, Attack: 1.1, Roar: 2.2 },
  walk: [0.45, 0.7, 0.4, 0.5], // front upper, front lower, back upper, back lower swing
  run: [0.85, 1.0, 0.8, 0.8],
  gallop: [0, 0.08, 0.5, 0.58], // run phase offsets FL, FR, BL, BR
  bob: 1, // body bob
  sway: 1, // spine side sway while walking
  roll: 0, // chest roll while walking (heavy waddle)
  tail: 1, // tail swing
  neck: 0, // extra neck side sway (long necks)
  headLow: 0, // head pitch offset while moving (negative = lower)
  attack: 'bite', // 'bite' or 'charge' (head-down ram)
  wings: false,
};

export function makeStyle(over = {}) {
  return { ...DEFAULT_STYLE, ...over, dur: { ...DEFAULT_STYLE.dur, ...(over.dur || {}) } };
}

function legs(add, p, off, a) {
  for (const [leg, o, up, lo] of [['FrontL', off[0], a[0], a[1]], ['FrontR', off[1], a[0], a[1]], ['BackL', off[2], a[2], a[3]], ['BackR', off[3], a[2], a[3]]]) {
    const ph = p + TAU * o;
    const u = up * sin(ph), l = -lo * pos(cos(ph));
    add(leg + 'Upper', u); add(leg + 'Lower', l); add(leg + 'Paw', -(u + l) * 0.8);
  }
}

// Wing helper: positive v raises both wings, sweep > 0 swings them back.
function wing(add, part, v, sweep = 0) {
  add(`WingL${part}`, 0, sweep, -v);
  add(`WingR${part}`, 0, -sweep, v);
}

export function pose(style, name, t) {
  const S = style;
  const rot = {}; const hips = [0, 0, 0];
  const add = (b, x = 0, y = 0, z = 0) => { const r = rot[b] || (rot[b] = [0, 0, 0]); r[0] += x; r[1] += y; r[2] += z; };
  const flicker = (k) => add(S.tip, k * (0.07 * sin(5 * p) + 0.04 * sin(9 * p + 1)), 0, k * 0.07 * sin(7 * p + 2));
  const T = S.dur[name], p = TAU * t / T;
  // wings held part-open at all times (hovering mythics)
  if (S.wings && S.wingRest) { wing(add, 'Upper', S.wingRest, -S.wingRest * 0.4); wing(add, 'Lower', S.wingRest * 0.4); }

  if (name === 'Idle') {
    hips[1] = 0.025 * sin(p) * S.bob;
    add('Spine', 0.02 * sin(p)); add('Chest', 0.035 * sin(p));
    add('Neck', -0.03 * sin(p), S.neck * 0.08 * sin(p + 0.6));
    add('Head', 0.04 * sin(p + 1), 0.1 * sin(p), 0.05 * sin(p + 0.5));
    add('EarL', 0, 0, -0.06 * sin(2 * p));
    add('EarR', 0.25 * ss(1.4, 1.5, t) * (1 - ss(1.6, 1.75, t)), 0, 0.06 * sin(2 * p + 1));
    for (let i = 1; i <= 4; i++) add('Tail' + i, 0.05 * sin(2 * p - i * 0.5), 0.18 * sin(p - i * 0.7) * (0.6 + 0.25 * i) * S.tail);
    if (S.wings) { wing(add, 'Upper', 0.06 * sin(p), 0.05); wing(add, 'Lower', 0.05 * sin(p - 0.6)); wing(add, 'Tip', 0.05 * sin(p - 1.2)); }
    flicker(1);
  } else if (name === 'Walk') {
    legs(add, p, [0, 0.5, 0.5, 0], S.walk);
    hips[1] = 0.035 * cos(2 * p) * S.bob;
    add('Spine', 0, 0.05 * sin(p) * S.sway); add('Chest', 0, -0.05 * sin(p) * S.sway, 0.03 * sin(p) + S.roll * sin(p));
    add('Neck', S.headLow * 0.5, S.neck * 0.1 * sin(p + 1));
    add('Head', 0.04 * sin(2 * p) + S.headLow * 0.5, -0.04 * sin(p), -S.roll * 0.7 * sin(p));
    add('EarL', 0.05 * sin(2 * p + 1)); add('EarR', 0.05 * sin(2 * p + 2));
    for (let i = 1; i <= 4; i++) add('Tail' + i, -0.06, 0.22 * sin(p - i * 0.6) * S.tail);
    if (S.wings) { wing(add, 'Upper', -0.15 + 0.06 * sin(2 * p), 0.35); wing(add, 'Lower', 0.08 * sin(2 * p - 0.8), 0.25); wing(add, 'Tip', 0.06 * sin(2 * p - 1.6)); }
    flicker(1);
  } else if (name === 'Run') {
    legs(add, p, S.gallop, S.run);
    hips[1] = (0.12 * sin(p - 0.8) + 0.05) * S.bob;
    add('Hips', 0.08 * sin(p));
    add('Spine', 0.12 * sin(p), 0.04 * sin(p) * (S.sway - 1)); add('Chest', -0.1 * sin(p), 0, S.roll * 0.5 * sin(p));
    add('Neck', -0.15 + S.headLow * 0.5, S.neck * 0.06 * sin(p)); add('Head', -0.12 + 0.08 * sin(p + 1) + S.headLow * 0.5);
    add('EarL', 0.55 + 0.05 * sin(2 * p)); add('EarR', 0.55 + 0.05 * sin(2 * p + 1));
    add('Jaw', -0.12);
    for (let i = 1; i <= 4; i++) add('Tail' + i, 0.14 + 0.12 * sin(p - i * 0.8), 0.05 * sin(p - i) * S.tail);
    if (S.wings) { wing(add, 'Upper', 0.1 + 0.55 * sin(p), 0.1); wing(add, 'Lower', 0.35 * sin(p - 0.8)); wing(add, 'Tip', 0.3 * sin(p - 1.5)); }
    flicker(0.6);
  } else if (name === 'Attack') {
    const charge = S.attack === 'charge';
    const w = ss(0, 0.3, t) * (1 - ss(0.35, 0.45, t));
    const l = ss(0.33, 0.48, t) * (1 - ss(0.6, 1.0, t));
    const open = ss(0.28, 0.42, t) * (1 - ss(0.5, 0.55, t));
    hips[1] = -0.3 * w + 0.15 * l; hips[2] = 0.25 * w - 0.9 * l;
    add('Hips', -0.12 * w + 0.06 * l);
    add('Spine', -0.08 * w + 0.1 * l); add('Chest', -0.05 * w);
    for (const s of ['L', 'R']) {
      add(`Front${s}Upper`, 0.35 * w + 0.9 * l); add(`Front${s}Lower`, -0.7 * w - 0.3 * l); add(`Front${s}Paw`, 0.3 * w - 0.4 * l);
      add(`Back${s}Upper`, 0.5 * w - 0.6 * l); add(`Back${s}Lower`, -0.6 * w + 0.2 * l); add(`Back${s}Paw`, 0.1 * w + 0.3 * l);
    }
    if (charge) { add('Neck', -0.2 * w - 0.35 * l); add('Head', -0.3 * w - 0.45 * l); add('Jaw', -0.2 * open); }
    else { add('Neck', -0.25 * w + 0.2 * l); add('Head', -0.2 * w + 0.15 * l); add('Jaw', -0.65 * open); }
    add('EarL', 0.5 * (w + l)); add('EarR', 0.5 * (w + l));
    for (let i = 1; i <= 4; i++) add('Tail' + i, -0.25 * w + 0.3 * l, 0.06 * w * sin(TAU * t * 8 - i));
    if (S.wings) { wing(add, 'Upper', 0.55 * w - 0.2 * l, -0.2 * w + 0.4 * l); wing(add, 'Lower', 0.3 * w, 0.2 * l); wing(add, 'Tip', 0.25 * w); }
    flicker(1 + 1.5 * (w + l));
  } else if (name === 'Roar') {
    const rise = ss(0, 0.45, t) * (1 - ss(1.7, 2.15, t));
    const roar = ss(0.35, 0.55, t) * (1 - ss(1.55, 1.85, t));
    hips[1] = 0.12 * rise;
    add('Hips', 0.08 * rise);
    add('Spine', 0.08 * rise); add('Chest', 0.12 * rise - 0.05 * roar);
    add('Neck', 0.25 * rise - 0.1 * roar);
    add('Head', 0.45 * rise - 0.25 * roar, 0.12 * roar * sin(TAU * t * 1.5), 0.03 * roar * sin(TAU * t * 12));
    add('Jaw', -0.75 * roar - 0.04 * roar * sin(TAU * t * 18));
    add('EarL', 0.6 * roar); add('EarR', 0.6 * roar);
    for (const s of ['L', 'R']) {
      add(`Front${s}Upper`, -0.15 * rise); add(`Front${s}Lower`, 0.1 * rise); add(`Front${s}Paw`, 0.05 * rise);
      add(`Back${s}Upper`, 0.15 * rise); add(`Back${s}Lower`, -0.25 * rise); add(`Back${s}Paw`, 0.1 * rise);
    }
    for (let i = 1; i <= 4; i++) add('Tail' + i, -0.35 * roar / 2, 0.15 * roar * sin(TAU * t * 3 - i) * S.tail);
    if (S.wings) {
      wing(add, 'Upper', 0.45 * rise + 0.22 * roar * sin(TAU * t * 2.5), -0.15 * rise);
      wing(add, 'Lower', 0.15 * rise + 0.18 * roar * sin(TAU * t * 2.5 - 0.8));
      wing(add, 'Tip', 0.1 * rise + 0.15 * roar * sin(TAU * t * 2.5 - 1.6));
    }
    flicker(1 + 2.5 * roar);
  }
  return { rot, hips };
}

// Apply a pose to three.js bones (rest positions captured once).
export function applyPose(style, boneMap, rest, name, t) {
  const { rot, hips } = pose(style, name, t);
  for (const [n, b] of Object.entries(boneMap)) {
    const r = rot[n] || [0, 0, 0];
    b.rotation.set(r[0], r[1], r[2], 'XYZ');
    b.position.copy(rest[n]);
  }
  boneMap.Hips.position.add(new THREE.Vector3(...hips));
}

// spinners: spec.spinners (halos, orbiting orbs...) baked into every clip; speeds are rounded
// to whole turns per clip so each clip still loops seamlessly.
export function bakeClips(style, boneMap, fps = 30, spinners = []) {
  const names = Object.keys(boneMap);
  return CLIP_NAMES.map((clip) => {
    const D = style.dur[clip];
    const n = Math.round(D * fps), times = [];
    const q = Object.fromEntries(names.map((b) => [b, []])), hp = [];
    const hipsRest = boneMap.Hips.position.clone();
    const e = new THREE.Euler(), quat = new THREE.Quaternion();
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * D; times.push(t);
      const { rot, hips } = pose(style, clip, Math.min(t, D - 1e-6));
      for (const b of names) {
        const r = rot[b] || [0, 0, 0]; e.set(r[0], r[1], r[2], 'XYZ'); quat.setFromEuler(e);
        const sp = spinners.find((s) => s.bone === b);
        if (sp) { const turns = Math.max(1, Math.round(Math.abs(sp.speed || 1) * D / (Math.PI * 2))) * Math.sign(sp.speed || 1); quat.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...sp.axis).normalize(), (turns * Math.PI * 2 * t) / D)); }
        q[b].push(quat.x, quat.y, quat.z, quat.w);
      }
      hp.push(hipsRest.x + hips[0], hipsRest.y + hips[1], hipsRest.z + hips[2]);
    }
    const tracks = names.map((b) => new THREE.QuaternionKeyframeTrack(`${b}.quaternion`, times, q[b]));
    tracks.push(new THREE.VectorKeyframeTrack('Hips.position', times, hp));
    return new THREE.AnimationClip(clip, D, tracks);
  });
}
