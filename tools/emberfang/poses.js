// Emberfang animation poses. Mirrored 1:1 by src/shared/Creatures/Poses/Emberfang.lua
// pose(name, t) -> { rot: { Bone: [rx, ry, rz] }, hips: [x, y, z] }
// Rotations are XYZ euler radians in each bone's rest frame (rest frames are
// axis-aligned with the model, so +rx on a leg swings the paw forward, and +rx
// on an ear or the tail tips it backward).
import * as THREE from 'three';

const TAU = Math.PI * 2;
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const pos = (x) => Math.max(0, x);
const sin = Math.sin, cos = Math.cos;

export const CLIPS = {
  Idle: { duration: 2.4, loop: true },
  Walk: { duration: 1.0, loop: true },
  Run: { duration: 0.6, loop: true },
  Attack: { duration: 1.1, loop: false },
  Roar: { duration: 2.2, loop: false },
};

function legs(add, p, off, fu, fl, bu, bl) {
  for (const [leg, o, up, lo] of [['FrontL', off[0], fu, fl], ['FrontR', off[1], fu, fl], ['BackL', off[2], bu, bl], ['BackR', off[3], bu, bl]]) {
    const ph = p + TAU * o;
    const u = up * sin(ph), l = -lo * pos(cos(ph));
    add(leg + 'Upper', u); add(leg + 'Lower', l); add(leg + 'Paw', -(u + l) * 0.8);
  }
}

function flicker(add, p, k) {
  add('TailFlame', k * (0.07 * sin(5 * p) + 0.04 * sin(9 * p + 1)), 0, k * 0.07 * sin(7 * p + 2));
}

export function pose(name, t) {
  const rot = {}; const hips = [0, 0, 0];
  const add = (b, x = 0, y = 0, z = 0) => { const r = rot[b] || (rot[b] = [0, 0, 0]); r[0] += x; r[1] += y; r[2] += z; };
  const T = CLIPS[name].duration, p = TAU * t / T;

  if (name === 'Idle') {
    hips[1] = 0.025 * sin(p);
    add('Spine', 0.02 * sin(p)); add('Chest', 0.035 * sin(p));
    add('Neck', -0.03 * sin(p));
    add('Head', 0.04 * sin(p + 1), 0.1 * sin(p), 0.05 * sin(p + 0.5));
    add('EarL', 0, 0, -0.06 * sin(2 * p));
    add('EarR', 0.25 * ss(1.4, 1.5, t) * (1 - ss(1.6, 1.75, t)), 0, 0.06 * sin(2 * p + 1));
    for (let i = 1; i <= 4; i++) add('Tail' + i, 0.05 * sin(2 * p - i * 0.5), 0.18 * sin(p - i * 0.7) * (0.6 + 0.25 * i));
    flicker(add, p, 1);
  } else if (name === 'Walk') {
    legs(add, p, [0, 0.5, 0.5, 0], 0.45, 0.7, 0.4, 0.5);
    hips[1] = 0.035 * cos(2 * p);
    add('Spine', 0, 0.05 * sin(p)); add('Chest', 0, -0.05 * sin(p), 0.03 * sin(p));
    add('Head', 0.04 * sin(2 * p), -0.04 * sin(p));
    add('EarL', 0.05 * sin(2 * p + 1)); add('EarR', 0.05 * sin(2 * p + 2));
    for (let i = 1; i <= 4; i++) add('Tail' + i, -0.06, 0.22 * sin(p - i * 0.6));
    flicker(add, p, 1);
  } else if (name === 'Run') {
    legs(add, p, [0, 0.08, 0.5, 0.58], 0.85, 1.0, 0.8, 0.8);
    hips[1] = 0.12 * sin(p - 0.8) + 0.05;
    add('Hips', 0.08 * sin(p));
    add('Spine', 0.12 * sin(p)); add('Chest', -0.1 * sin(p));
    add('Neck', -0.15); add('Head', -0.12 + 0.08 * sin(p + 1));
    add('EarL', 0.55 + 0.05 * sin(2 * p)); add('EarR', 0.55 + 0.05 * sin(2 * p + 1));
    add('Jaw', -0.12);
    for (let i = 1; i <= 4; i++) add('Tail' + i, 0.14 + 0.12 * sin(p - i * 0.8), 0.05 * sin(p - i));
    flicker(add, p, 0.6);
  } else if (name === 'Attack') {
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
    add('Neck', -0.25 * w + 0.2 * l); add('Head', -0.2 * w + 0.15 * l);
    add('Jaw', -0.65 * open);
    add('EarL', 0.5 * (w + l)); add('EarR', 0.5 * (w + l));
    for (let i = 1; i <= 4; i++) add('Tail' + i, -0.25 * w + 0.3 * l, 0.06 * w * sin(TAU * t * 8 - i));
    flicker(add, p, 1 + 1.5 * (w + l));
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
    for (let i = 1; i <= 4; i++) add('Tail' + i, -0.35 * roar / 2, 0.15 * roar * sin(TAU * t * 3 - i));
    flicker(add, p, 1 + 2.5 * roar);
  }
  return { rot, hips };
}

// Apply a pose to three.js bones (rest positions captured once).
export function applyPose(boneMap, rest, name, t) {
  const { rot, hips } = pose(name, t);
  for (const [n, b] of Object.entries(boneMap)) {
    const r = rot[n] || [0, 0, 0];
    b.rotation.set(r[0], r[1], r[2], 'XYZ');
    b.position.copy(rest[n]);
  }
  boneMap.Hips.position.add(new THREE.Vector3(...hips));
}

export function bakeClips(boneMap, fps = 30) {
  const names = Object.keys(boneMap);
  return Object.entries(CLIPS).map(([clip, c]) => {
    const n = Math.round(c.duration * fps), times = [];
    const q = Object.fromEntries(names.map((b) => [b, []])), hp = [];
    const hipsRest = boneMap.Hips.position.clone();
    const e = new THREE.Euler(), quat = new THREE.Quaternion();
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * c.duration; times.push(t);
      const { rot, hips } = pose(clip, Math.min(t, c.duration - 1e-6));
      for (const b of names) { const r = rot[b] || [0, 0, 0]; e.set(r[0], r[1], r[2], 'XYZ'); quat.setFromEuler(e); q[b].push(quat.x, quat.y, quat.z, quat.w); }
      hp.push(hipsRest.x + hips[0], hipsRest.y + hips[1], hipsRest.z + hips[2]);
    }
    const tracks = names.map((b) => new THREE.QuaternionKeyframeTrack(`${b}.quaternion`, times, q[b]));
    tracks.push(new THREE.VectorKeyframeTrack('Hips.position', times, hp));
    return new THREE.AnimationClip(clip, c.duration, tracks);
  });
}
