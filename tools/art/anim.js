// Prop animation rules, keyed by mesh/bone name. Used for the preview renders here and
// written out to src/shared/Props/PropAnimData.luau so Roblox animates the same way.
export const WIND = { dir: [1, 0, 0.35], strength: 1 };

export const RULES = {
  spin: {
    PropL: { axis: [0, 0, 1], speed: 14 }, PropR: { axis: [0, 0, 1], speed: -14 }, PropBack: { axis: [0, 0, 1], speed: 9 },
    Blades: { axis: [0, 0, 1], speed: 0.8 }, Ring: { axis: [0, 1, 0], speed: 1.2 }, Pinwheel: { axis: [0, 0, 1], speed: 5 },
  },
  // lean with the wind plus gusts; amp in radians, freq in Hz
  sway: { Canopy: { amp: 0.035, freq: 0.5 }, Sway: { amp: 0.07, freq: 1.0 }, Fronds: { amp: 0.07, freq: 0.5 } },
  swing: { Lantern: { amp: 0.14, freq: 0.5 }, LanternLamp: { amp: 0.14, freq: 0.5 }, Bucket: { amp: 0.08, freq: 0.5 } },
  float: { Float: { height: 0.06, freq: 0.5, tilt: 0.05 } },
  // wings flap around their pivot (+ for the left wing, - for the right)
  flap: { WingL: { amp: 0.9, freq: 3, side: 1 }, WingR: { amp: 0.9, freq: 3, side: -1 } },
  hover: { height: 0.3, freq: 0.5, spin: 0.5 }, // any mesh named Hover*
  flag: { amp: 0.32, freq: 1.0, lag: 1.0, droop: 0.05 }, // bones named Flag1..FlagN
  flicker: { names: ['Flame', 'FlameCore'], amount: 0.09, freq: 6 },
  pulse: { names: ['Glow', 'GlowCore', 'Rune', 'Potion', 'Lamp', 'HoverCore', 'HoverGem', 'HoverSignGlow'], amount: 0.25, freq: 0.6 },
};

export function kindOf(name) {
  if (RULES.spin[name]) return 'spin';
  if (RULES.sway[name]) return 'sway';
  if (RULES.swing[name]) return 'swing';
  if (RULES.float[name]) return 'float';
  if (RULES.flap[name]) return 'flap';
  if (/^Hover/.test(name)) return 'hover';
  return null;
}

const TAU = Math.PI * 2;
// three.js preview: obj.userData.base = { pos, rot } captured before the first frame.
export function animate3(obj, name, t, phase = 0) {
  const k = kindOf(name); if (!k) return;
  const b = obj.userData.base || (obj.userData.base = { pos: obj.position.clone(), rot: obj.rotation.clone() });
  obj.position.copy(b.pos); obj.rotation.copy(b.rot);
  const wx = WIND.dir[0], wz = WIND.dir[2], wl = Math.hypot(wx, wz);
  if (k === 'spin') { const r = RULES.spin[name]; obj.rotation.x += r.axis[0] * r.speed * t; obj.rotation.y += r.axis[1] * r.speed * t; obj.rotation.z += r.axis[2] * r.speed * t; }
  if (k === 'sway') {
    const r = RULES.sway[name], w = TAU * r.freq;
    const a = r.amp * WIND.strength * (0.55 + 0.45 * Math.sin(w * t + phase) + 0.25 * Math.sin(2 * w * t + phase * 1.7));
    // lean away from the wind: rotate about (up x wind)
    obj.rotation.z += -a * (wx / wl); obj.rotation.x += a * (wz / wl) + r.amp * 0.25 * Math.sin(w * 1.5 * t + phase);
  }
  if (k === 'swing') { const r = RULES.swing[name], w = TAU * r.freq; obj.rotation.x += r.amp * Math.sin(w * t + phase); obj.rotation.z += r.amp * 0.4 * Math.sin(w * t * 2 + phase); }
  if (k === 'float') { const r = RULES.float[name], w = TAU * r.freq; obj.position.y += r.height * Math.sin(w * t + phase); obj.rotation.x += r.tilt * Math.sin(w * t + phase + 1); obj.rotation.z += r.tilt * Math.sin(w * t * 2 + phase); }
  if (k === 'flap') { const r = RULES.flap[name]; obj.rotation.z += r.side * r.amp * (0.35 + 0.65 * Math.sin(TAU * r.freq * t + phase)); }
  if (k === 'hover') { const r = RULES.hover, w = TAU * r.freq; obj.position.y += r.height * Math.sin(w * t + phase); obj.rotation.y += r.spin * t; }
}
export function animateFlag3(boneMap, t, phase = 0) {
  const r = RULES.flag, w = TAU * r.freq;
  for (let i = 1; boneMap['Flag' + i]; i++) {
    const b = boneMap['Flag' + i];
    if (!b.userData.base) b.userData.base = b.rotation.clone();
    b.rotation.copy(b.userData.base);
    b.rotation.y += r.amp * (i === 1 ? 0.4 : 1) * Math.sin(w * t - i * r.lag + phase);
    b.rotation.z += -r.droop * i * 0.3 + 0.04 * Math.sin(w * 2 * t - i + phase);
  }
}
