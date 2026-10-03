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
  hop: 0, // hopping gait (toads): front and back pairs move together and the body bounces
  body: 'quad', // 'quad' | 'biped' (Front* bones are arms, Back* bones are legs) | 'fish' (swims in the air)
  hover: 0, // biped: floats instead of stepping (titans); bob height
  armSwing: 0.45, // biped arm swing while walking
  guard: false, // biped rig modelled with fists up (boxers): punches straighten the elbow instead
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
  if (style.body === 'biped') return poseBiped(style, name, t);
  if (style.body === 'fish') return poseFish(style, name, t);
  return poseQuad(style, name, t);
}

function poseQuad(style, name, t) {
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
    legs(add, p, S.hop ? [0, 0, 0.5, 0.5] : [0, 0.5, 0.5, 0], S.walk);
    hips[1] = 0.035 * cos(2 * p) * S.bob + S.hop * pos(sin(p));
    if (S.hop) add('Hips', -0.12 * S.hop * cos(p));
    add('Spine', 0, 0.05 * sin(p) * S.sway); add('Chest', 0, -0.05 * sin(p) * S.sway, 0.03 * sin(p) + S.roll * sin(p));
    add('Neck', S.headLow * 0.5, S.neck * 0.1 * sin(p + 1));
    add('Head', 0.04 * sin(2 * p) + S.headLow * 0.5, -0.04 * sin(p), -S.roll * 0.7 * sin(p));
    add('EarL', 0.05 * sin(2 * p + 1)); add('EarR', 0.05 * sin(2 * p + 2));
    for (let i = 1; i <= 4; i++) add('Tail' + i, -0.06, 0.22 * sin(p - i * 0.6) * S.tail);
    if (S.wings) { wing(add, 'Upper', -0.15 + 0.06 * sin(2 * p), 0.35); wing(add, 'Lower', 0.08 * sin(2 * p - 0.8), 0.25); wing(add, 'Tip', 0.06 * sin(2 * p - 1.6)); }
    flicker(1);
  } else if (name === 'Run') {
    legs(add, p, S.gallop, S.run);
    hips[1] = (0.12 * sin(p - 0.8) + 0.05) * S.bob + S.hop * 1.4 * pos(sin(p));
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

// ---------- bipeds: same bone names, Front* = arms (hang down, +rx swings the hand forward,
// +rx on the forearm bends the elbow), Back* = legs. +rx on Spine/Chest/Head pitches up. ----------
function limbs(add, p, off, a, names) {
  names.forEach((leg, i) => {
    const ph = p + TAU * off[i];
    const u = a[0] * sin(ph), l = -a[1] * pos(cos(ph));
    add(leg + 'Upper', u); add(leg + 'Lower', l); add(leg + 'Paw', -(u + l) * 0.8);
  });
}
function poseBiped(S, name, t) {
  const rot = {}; const hips = [0, 0, 0];
  const add = (b, x = 0, y = 0, z = 0) => { const r = rot[b] || (rot[b] = [0, 0, 0]); r[0] += x; r[1] += y; r[2] += z; };
  const T = S.dur[name], p = TAU * t / T, u = t / T;
  const wing = (part, v, sweep = 0) => { add(`WingL${part}`, 0, sweep, -v); add(`WingR${part}`, 0, -sweep, v); };
  const arms = (rx, rz, lower) => { add('FrontLUpper', rx, 0, -rz); add('FrontRUpper', rx, 0, rz); add('FrontLLower', lower); add('FrontRLower', lower); };
  const tail = (k, sway) => { for (let i = 1; i <= 4; i++) add('Tail' + i, k, sway * sin(p - i * 0.6) * S.tail); };
  const hov = S.hover || 0;
  if (S.wings && S.wingRest) { wing('Upper', S.wingRest, -S.wingRest * 0.4); wing('Lower', S.wingRest * 0.4); }

  if (name === 'Idle') {
    hips[1] = 0.03 * sin(p) * S.bob + hov * sin(p);
    add('Spine', 0.02 * sin(p)); add('Chest', 0.035 * sin(p + 0.4));
    add('Neck', -0.02 * sin(p)); add('Head', 0.05 * sin(p + 1), 0.14 * sin(p * 0.5), 0.04 * sin(p + 0.5));
    arms(0.06 * sin(p + 0.3), 0.1 + 0.03 * sin(p), 0.2 + 0.05 * sin(p + 0.6));
    if (hov) for (const s of ['L', 'R']) { add(`Back${s}Upper`, 0.12 + 0.05 * sin(p + (s === 'L' ? 0 : 1))); add(`Back${s}Lower`, -0.15); }
    add('EarL', 0, 0, -0.06 * sin(2 * p)); add('EarR', 0, 0, 0.06 * sin(2 * p + 1));
    add('Jaw', -0.03 * (0.5 + 0.5 * sin(p)));
    tail(0.03 * sin(2 * p), 0.15);
    if (S.wings) { wing('Upper', 0.05 * sin(p), 0.05); wing('Lower', 0.04 * sin(p - 0.6)); wing('Tip', 0.04 * sin(p - 1.2)); }
  } else if (name === 'Walk' || name === 'Run') {
    const run = name === 'Run', k = run ? 1.6 : 1;
    if (hov) {
      hips[1] = hov * sin(p) * 0.6; hips[2] = 0;
      add('Spine', -0.1 * k); add('Chest', -0.05 * k + 0.03 * sin(p)); add('Head', 0.12 * k);
      for (const s of ['L', 'R']) { add(`Back${s}Upper`, 0.3 * k + 0.08 * sin(p)); add(`Back${s}Lower`, -0.25 * k); }
      arms(-0.25 * k + 0.15 * sin(p), 0.18, 0.35 * k);
      add('FrontLUpper', 0.12 * sin(p)); add('FrontRUpper', -0.12 * sin(p));
    } else if (S.hop) {
      hips[1] = S.hop * k * pos(sin(p)); add('Hips', -0.1 * cos(p)); add('Spine', -0.12 * k);
      for (const s of ['L', 'R']) { add(`Back${s}Upper`, -0.5 * k * cos(p)); add(`Back${s}Lower`, -0.6 * k * pos(-sin(p)) - 0.2); add(`Back${s}Paw`, 0.4 * k * cos(p)); }
      arms(0.7, 0.12, 1.4); add('Head', 0.1 * k + 0.08 * cos(p));
      for (let i = 1; i <= 4; i++) add('Tail' + i, 0.12 * cos(p - i * 0.5));
    } else {
      limbs(add, p, [0, 0.5], run ? S.run.slice(2) : S.walk.slice(2), ['BackL', 'BackR']);
      limbs(add, p, [0.5, 0], [S.armSwing * k, 0], ['FrontL', 'FrontR']);
      add('FrontLLower', run ? 1.2 : 0.25); add('FrontRLower', run ? 1.2 : 0.25);
      add('FrontLUpper', 0, 0, -0.08); add('FrontRUpper', 0, 0, 0.08);
      hips[1] = (run ? 0.09 : 0.04) * cos(2 * p) * S.bob + (run ? 0.06 : 0);
      add('Hips', 0, 0.06 * sin(p) * S.sway); add('Spine', run ? -0.2 : -0.04, -0.05 * sin(p) * S.sway); add('Chest', 0, -0.06 * sin(p) * S.sway, 0.03 * sin(p) + S.roll * sin(p));
      add('Head', (run ? 0.15 : 0.04) + 0.03 * sin(2 * p), 0.05 * sin(p));
      tail(run ? 0.1 : 0, 0.2);
    }
    add('EarL', (run ? 0.4 : 0) + 0.05 * sin(2 * p + 1)); add('EarR', (run ? 0.4 : 0) + 0.05 * sin(2 * p + 2));
    if (S.wings) { const f = run ? 0.5 : 0.08; wing('Upper', (run ? 0.2 : -0.1) + f * sin(2 * p), run ? 0.1 : 0.3); wing('Lower', f * 0.7 * sin(2 * p - 0.8), 0.2); wing('Tip', f * 0.6 * sin(2 * p - 1.6)); }
  } else if (name === 'Attack') {
    const w = ss(0, 0.3, u) * (1 - ss(0.33, 0.42, u)), l = ss(0.32, 0.42, u) * (1 - ss(0.6, 1.0, u));
    if (S.attack === 'slam') {
      const raise = ss(0, 0.35, u) * (1 - ss(0.42, 0.5, u)), slam = ss(0.42, 0.5, u) * (1 - ss(0.7, 1.0, u));
      arms(2.5 * raise + 1.0 * slam, 0.15 + 0.2 * raise, 0.5 * raise + 0.1 * slam);
      add('Spine', 0.15 * raise - 0.4 * slam); add('Chest', 0.1 * raise - 0.15 * slam); add('Head', 0.25 * raise - 0.1 * slam);
      hips[1] = 0.35 * raise - 0.4 * slam;
      for (const s of ['L', 'R']) { add(`Back${s}Upper`, 0.4 * slam); add(`Back${s}Lower`, -0.5 * slam); }
    } else if (S.attack === 'peck') {
      add('Spine', 0.1 * w - 0.35 * l); add('Neck', 0.25 * w - 0.4 * l); add('Head', 0.3 * w - 0.5 * l); add('Jaw', -0.5 * ss(0.25, 0.38, u) * (1 - ss(0.45, 0.55, u)));
      hips[1] = 0.25 * w; hips[2] = 0.2 * w - 0.6 * l;
      for (const s of ['L', 'R']) { add(`Back${s}Upper`, -0.3 * w + 0.4 * l); add(`Back${s}Lower`, -0.5 * w); }
      if (S.wings) { wing('Upper', 0.9 * w + 0.3 * l, -0.3 * w + 0.5 * l); wing('Lower', 0.4 * w); wing('Tip', 0.3 * w + 0.2 * l); }
    } else { // punch (right jab, left guard)
      // guard rigs hold the forearm up already: the jab raises the arm and straightens the elbow
      if (S.guard) { add('FrontRUpper', -0.3 * w + 1.35 * l, 0, 0.1); add('FrontRLower', 0.5 * w - 0.85 * l); }
      else { add('FrontRUpper', -0.4 * w + 1.55 * l, 0, 0.1); add('FrontRLower', 1.7 * w + 0.15 * l); }
      add('FrontLUpper', (S.guard ? 0.25 : 0.9) * (w + l), 0, -0.1); add('FrontLLower', (S.guard ? 0.2 : 1.5) * (w + l));
      add('Chest', 0, 0.45 * w - 0.55 * l); add('Spine', -0.05 * w - 0.15 * l, 0.1 * w - 0.15 * l);
      add('Head', 0.05 * w - 0.05 * l, -0.2 * w + 0.2 * l);
      hips[1] = -0.12 * w; hips[2] = 0.15 * w - 0.5 * l;
      add('BackLUpper', 0.35 * l); add('BackLLower', -0.4 * l); add('BackRUpper', -0.3 * l); add('BackRLower', -0.2 * w);
      if (S.hop) for (let i = 1; i <= 4; i++) add('Tail' + i, -0.15 * l);
    }
    add('EarL', 0.4 * (w + l)); add('EarR', 0.4 * (w + l));
  } else if (name === 'Roar') {
    const rise = ss(0, 0.2, u) * (1 - ss(0.78, 0.98, u)), roar = ss(0.15, 0.25, u) * (1 - ss(0.7, 0.85, u));
    hips[1] = 0.12 * rise + hov * 1.5 * rise;
    add('Spine', 0.1 * rise); add('Chest', 0.15 * rise);
    add('Head', 0.35 * rise - 0.1 * roar, 0.1 * roar * sin(TAU * u * 3), 0.03 * roar * sin(TAU * u * 25));
    add('Jaw', -0.7 * roar - 0.05 * roar * sin(TAU * u * 36));
    arms(0.3 * rise, 1.15 * roar + 0.1, 0.35 * rise);
    add('FrontLUpper', 0, 0.3 * roar); add('FrontRUpper', 0, -0.3 * roar);
    for (const s of ['L', 'R']) { add(`Back${s}Upper`, -0.1 * rise); add(`Back${s}Lower`, 0.15 * rise); }
    add('EarL', 0.6 * roar); add('EarR', 0.6 * roar);
    tail(-0.15 * roar, 0.15 * roar);
    if (S.wings) { wing('Upper', 0.7 * rise + 0.25 * roar * sin(TAU * u * 5), -0.2 * rise); wing('Lower', 0.25 * rise + 0.2 * roar * sin(TAU * u * 5 - 0.8)); wing('Tip', 0.2 * rise + 0.18 * roar * sin(TAU * u * 5 - 1.6)); }
  }
  return { rot, hips };
}

// ---------- fish: swims in the air. Body undulates from head to tail, fins (Front* = pectoral,
// Back* = pelvic) flap, Ear* bones are barbels/whiskers. ----------
function poseFish(S, name, t) {
  const rot = {}; const hips = [0, 0, 0];
  const add = (b, x = 0, y = 0, z = 0) => { const r = rot[b] || (rot[b] = [0, 0, 0]); r[0] += x; r[1] += y; r[2] += z; };
  const T = S.dur[name], p = TAU * t / T, u = t / T;
  const swim = (amp, ph = p) => {
    add('Head', 0, 0.12 * amp * sin(ph + 0.6)); add('Chest', 0, -0.06 * amp * sin(ph + 0.3));
    add('Hips', 0, 0.1 * amp * sin(ph)); add('Spine', 0, -0.15 * amp * sin(ph - 0.3));
    for (let i = 1; i <= 4; i++) add('Tail' + i, 0, (0.22 + 0.1 * i) * amp * sin(ph - 0.8 - i * 0.7) * S.tail);
    add('TailTip', 0, 0.4 * amp * sin(ph - 4.0));
  };
  const fins = (amp, ph, rest = 0) => {
    add('FrontLUpper', 0, -rest * 0.5, -(amp * sin(ph) + rest)); add('FrontRUpper', 0, rest * 0.5, amp * sin(ph) + rest);
    add('FrontLLower', 0, 0, -amp * 0.6 * sin(ph - 0.7)); add('FrontRLower', 0, 0, amp * 0.6 * sin(ph - 0.7));
    add('BackLUpper', 0, 0, -amp * 0.5 * sin(ph + 1)); add('BackRUpper', 0, 0, amp * 0.5 * sin(ph + 1));
  };
  const whiskers = (amp, ph) => { add('EarL', amp * sin(ph), 0.5 * amp * sin(ph * 0.7)); add('EarR', amp * sin(ph + 0.8), -0.5 * amp * sin(ph * 0.7 + 1)); };
  if (name === 'Idle') {
    hips[1] = 0.18 * sin(p); add('Spine', 0.03 * sin(p + 1));
    swim(0.5); fins(0.35, 2 * p); whiskers(0.15, p); add('Jaw', -0.06 * (0.5 + 0.5 * sin(2 * p)));
  } else if (name === 'Walk' || name === 'Run') {
    const run = name === 'Run';
    hips[1] = (run ? 0.1 : 0.14) * sin(2 * p); add('Spine', run ? -0.08 : -0.03);
    swim(run ? 1.0 : 0.75); fins(run ? 0.15 : 0.3, 2 * p, run ? 0.6 : 0.15); whiskers(run ? 0.35 : 0.2, p);
  } else if (name === 'Attack') {
    const w = ss(0, 0.3, u) * (1 - ss(0.33, 0.42, u)), l = ss(0.32, 0.42, u) * (1 - ss(0.6, 1.0, u));
    hips[2] = 0.4 * w - 1.4 * l; hips[1] = 0.1 * w;
    add('Spine', 0.1 * w - 0.08 * l); add('Head', 0.15 * w - 0.1 * l); add('Jaw', -0.7 * ss(0.28, 0.38, u) * (1 - ss(0.48, 0.6, u)));
    for (let i = 1; i <= 4; i++) add('Tail' + i, 0, (0.5 * w - 0.6 * l) * (0.6 + 0.2 * i));
    fins(0.2, TAU * u * 4, 0.8 * l - 0.3 * w); whiskers(0.4 * (w + l), TAU * u * 3);
  } else if (name === 'Roar') {
    // leaps up in an arc, arches, fans everything out, splashes back down
    const rise = ss(0, 0.35, u) * (1 - ss(0.6, 0.95, u)), arch = ss(0.15, 0.4, u) * (1 - ss(0.55, 0.85, u));
    hips[1] = 1.6 * rise; add('Hips', 0.35 * arch - 0.15 * ss(0.55, 0.8, u) * (1 - ss(0.85, 1, u)));
    add('Spine', 0.2 * arch); add('Chest', 0.15 * arch); add('Head', 0.25 * arch);
    for (let i = 1; i <= 4; i++) add('Tail' + i, 0.18 * arch, 0.25 * sin(TAU * u * 4 - i) * arch);
    add('Jaw', -0.6 * arch); fins(0.25, TAU * u * 6, 0.9 * arch); whiskers(0.5 * arch, TAU * u * 4);
    swim(0.4 * (1 - arch));
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
