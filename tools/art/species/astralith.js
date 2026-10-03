// Astralith (Cosmic, Mythic): the Star Colossus. A floating titan golem of obsidian and gold.
// Constellations glow across its armour, a miniature galaxy spins inside the open ring in its
// chest, crystal horns sweep back from a crowned helm with a burning visor, its huge fists float
// free of the forearms, six rune monoliths turn in a halo behind it, nebula ribbons stream from
// its shoulders, three little planets orbit its waist, and instead of legs it trails a column
// of drifting rock shards. Uses the biped rig (Front* = arms) with hover.
import * as THREE from 'three';
import { V, SIDES, ell, cone, surfaceQuat, quatTo, loft, blend, quadBones, rock, crystal, blade } from '../lib.js';
import { armor } from '../kit.js';

const palette = [
  ['stone', '#3e3670'], ['stoneDeep', '#272150'], ['stoneLight', '#5d54a0'], ['plate', '#4f45a0'], ['plateDeep', '#342c74'],
  ['gold', '#f2c14e'], ['goldDeep', '#b8841c'], ['crystal', '#a8dcff'], ['crystalDeep', '#5a7fd6'], ['rock', '#3a3450'],
  ['planetRed', '#e8735a'], ['planetBlue', '#5fb4e8'], ['planetGreen', '#8fd45a'], ['ring', '#ecdcb0'], ['white', '#ffffff'], ['pupil', '#120c22'],
];
const glow = { Eyes: '#fff0b0', Glow: '#86a4ff', GlowCore: '#ffffff', Nebula: '#ff7ad9', Star: '#ffd36b' };

const bones = quadBones({
  hips: [3.7, 0.1], spine: [4.7, 0.0], chest: [5.7, -0.05], neck: [6.95, -0.35], head: [7.7, -0.6], jaw: [7.25, -1.15],
  ear: [0.82, 8.45, -0.55],
  // the shard column under the waist, dangling like a tail
  tail: [[3.0, 0.2], [2.45, 0.25], [1.95, 0.3], [1.5, 0.3], [1.15, 0.3]],
  front: { x: 2.35, upper: [6.05, 0.0], lower: [4.6, -0.1], paw: [3.25, -0.3] },
  back: { x: 0.95, upper: [3.25, 0.1], lower: [2.35, 0.15], paw: [1.6, 0.15] },
});
bones.push(['Galaxy', 'Chest', [0, 5.75, -1.42]], ['Monoliths', 'Chest', [0, 6.4, 1.55]], ['StarOrbit', 'Spine', [0, 4.2, 0.1]], ['Crown', 'Head', [0, 9.3, -0.6]]);

// point on an ellipsoid surface (centre c, radii r) facing direction d
const onEll = (c, r, d) => { const n = V(d).normalize(); return { p: V([c[0] + n.x * r[0], c[1] + n.y * r[1], c[2] + n.z * r[2]]), n: V([n.x / r[0], n.y / r[1], n.z / r[2]]).normalize() }; };
// constellation: stars at points, thin glowing lines between consecutive ones
function constellation(B, pts, opts, lines = null) {
  pts.forEach((p, i) => B.add(ell(i % 3 === 0 ? 0.085 : 0.06, i % 3 === 0 ? 0.085 : 0.06, 0.05, 8, 5), { pos: p.toArray(), mesh: i % 3 === 0 ? 'Star' : 'GlowCore', ...opts }));
  const L = lines || pts.slice(1).map((_, i) => [i, i + 1]);
  for (const [a, b] of L) B.add(loft({ points: [pts[a].toArray(), pts[a].clone().lerp(pts[b], 0.5).toArray(), pts[b].toArray()], rx: () => 0.022, ry: () => 0.022, rings: 2, seg: 4 }), { mesh: 'Glow', ...opts });
}
const monolith = (h, w) => { const g = new THREE.CylinderGeometry(w * 0.55, w * 0.7, h, 4, 1); g.rotateY(Math.PI / 4); const tip = new THREE.ConeGeometry(w * 0.55 * 1.41 / 1.41, h * 0.25, 4); tip.rotateY(Math.PI / 4); tip.translate(0, h * 0.625, 0); return [g, tip]; };

function build(B, W) {
  const chestC = [0, 5.75, -0.05], chestR = [1.85, 1.35, 1.25];
  const torsoW = (p) => blend([[4.1, 'Hips'], [4.8, 'Spine'], [5.5, 'Chest']], p.y);
  // --- torso: broad V chest, narrow armoured waist ---
  B.add(ell(...chestR, 28, 18), { pos: chestC, color: 'stone', weights: torsoW });
  B.add(ell(1.15, 0.95, 0.95, 22, 14), { pos: [0, 4.45, 0.05], color: 'stoneDeep', weights: torsoW });
  B.add(ell(1.25, 0.55, 1.05, 22, 12), { pos: [0, 3.75, 0.1], color: 'stone', weights: torsoW });
  // abdominal plates
  for (let k = 0; k < 3; k++) armor(B, { p: [0, 4.0 + k * 0.38, -0.9 + k * 0.05], n: [0, 0.1, -1], dir: [1, 0, 0], w: 0.62 - k * 0.04, l: 0.16, t: 0.08, color: 'plate', trim: 'goldDeep', opts: { weights: torsoW } });
  // gold belt with a central star gem
  B.add(new THREE.TorusGeometry(1.0, 0.13, 6, 28), { pos: [0, 3.62, 0.1], rot: [Math.PI / 2, 0, 0], scale: [1.27, 1.06, 1], color: 'gold', weights: torsoW });
  B.add(new THREE.OctahedronGeometry(0.24, 0), { pos: [0, 3.62, -1.08], scale: [1, 1.3, 0.6], mesh: 'Star', weights: torsoW });
  // big chest plates either side of the core
  for (const [, x] of SIDES) {
    const s = onEll(chestC, chestR, [0.62 * x, 0.35, -1]);
    armor(B, { p: s.p.clone().addScaledVector(s.n, 0.02), n: s.n, dir: [0, 1, 0.2], w: 0.75, l: 0.62, t: 0.14, color: 'plate', trim: 'gold', rivets: 'goldDeep', opts: { weights: torsoW } });
    const s2 = onEll(chestC, chestR, [0.95 * x, -0.25, -0.6]);
    armor(B, { p: s2.p, n: s2.n, dir: [0, 1, 0], w: 0.45, l: 0.55, t: 0.1, color: 'plateDeep', trim: 'goldDeep', opts: { weights: torsoW } });
  }
  // back plates + spine ridge
  for (let k = 0; k < 4; k++) { const s = onEll(chestC, chestR, [0, 0.7 - k * 0.35, 1]); armor(B, { p: s.p, n: s.n, dir: [1, 0, 0], w: 0.7 - k * 0.08, l: 0.22, t: 0.1, color: 'plate', trim: 'goldDeep', opts: { weights: torsoW } }); }

  // --- chest core: gold ring, dark void, the spinning galaxy (Galaxy bone) ---
  const coreP = V([0, 5.75, -1.3]);
  B.add(new THREE.TorusGeometry(0.88, 0.16, 8, 36), { pos: coreP.toArray(), color: 'gold', weights: torsoW });
  B.add(new THREE.TorusGeometry(0.98, 0.05, 5, 36), { pos: coreP.clone().add(V([0, 0, -0.06])).toArray(), mesh: 'Star', weights: torsoW });
  B.add(new THREE.CylinderGeometry(0.85, 0.85, 0.25, 32), { pos: coreP.clone().add(V([0, 0, 0.12])).toArray(), rot: [Math.PI / 2, 0, 0], color: 'pupil', weights: torsoW });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; B.add(cone(0.1, 0.32, 4), { pos: coreP.clone().add(V([Math.cos(a) * 1.13, Math.sin(a) * 1.13, -0.02])).toArray(), quat: quatTo([Math.cos(a), Math.sin(a), 0]), color: k % 2 ? 'goldDeep' : 'gold', weights: torsoW }); }
  const G = V(W.Galaxy);
  B.add(ell(0.2, 0.2, 0.14, 14, 10), { pos: G.toArray(), mesh: 'GlowCore', bone: 'Galaxy' });
  B.add(ell(0.34, 0.34, 0.06, 18, 6), { pos: G.toArray(), mesh: 'Star', bone: 'Galaxy' });
  for (let arm = 0; arm < 3; arm++) for (let k = 0; k < 7; k++) {
    const t = k / 6, a = arm * (Math.PI * 2 / 3) + t * 2.6, rr = 0.25 + t * 0.52;
    const p = G.clone().add(V([Math.cos(a) * rr, Math.sin(a) * rr, 0]));
    B.add(ell(0.12 - t * 0.06, 0.05, 0.03, 8, 4), { pos: p.toArray(), quat: surfaceQuat([0, 0, -1], [-Math.sin(a), Math.cos(a), 0]), mesh: k % 2 ? 'Nebula' : 'Glow', bone: 'Galaxy' });
  }
  for (let k = 0; k < 10; k++) { const a = k * 2.4, rr = 0.3 + (k % 4) * 0.13; B.add(ell(0.03, 0.03, 0.03, 4, 3), { pos: G.clone().add(V([Math.cos(a) * rr, Math.sin(a) * rr, -0.02])).toArray(), mesh: 'GlowCore', bone: 'Galaxy' }); }

  // constellations across the chest plates and back
  for (const [, x] of SIDES) {
    const pts = [[0.45, 0.62], [0.72, 0.45], [0.62, 0.15], [0.88, -0.05], [0.95, -0.4]].map(([a, b]) => onEll(chestC, chestR, [a * x, b, -0.8]).p.addScaledVector(V([a * x * 0.1, 0, -1]), 0.16));
    constellation(B, pts, { weights: torsoW });
  }
  constellation(B, [[-0.4, 0.5], [0, 0.65], [0.4, 0.5], [0.25, 0.1], [-0.25, 0.1]].map(([a, b]) => onEll(chestC, chestR, [a, b, 1]).p.addScaledVector(V([0, 0, 1]), 0.12)), { weights: torsoW }, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]);

  // --- nebula ribbons streaming back from the shoulders ---
  for (const [, x] of SIDES) for (let k = 0; k < 2; k++) {
    const pts = [[1.2 * x, 6.6 - k * 0.3, 0.7], [1.5 * x, 6.0 - k * 0.4, 1.6], [1.3 * x, 5.0 - k * 0.5, 2.4], [1.7 * x, 4.0 - k * 0.6, 2.9]];
    B.add(loft({ points: pts, rx: (t) => 0.32 * (1 - 0.7 * t) + 0.04, ry: (t) => 0.035, rings: 14, seg: 6 }), { mesh: k ? 'Glow' : 'Nebula', weights: (p) => [['Chest', 1]] });
  }

  // --- neck + head: crowned helm, burning visor, crystal horns, jaw plate ---
  B.add(new THREE.CylinderGeometry(0.7, 0.9, 1.0, 12), { pos: [0, 6.9, -0.35], color: 'stone', weights: (p) => blend([[6.6, 'Chest'], [7.1, 'Neck']], p.y) });
  B.add(new THREE.TorusGeometry(0.8, 0.1, 6, 20), { pos: [0, 6.6, -0.3], rot: [Math.PI / 2, 0, 0], color: 'gold', bone: 'Neck' });
  // head pieces shifted forward/up so the face clears the chest ring
  const H = { add: (g, o) => B.add(g, { ...o, pos: [o.pos[0], o.pos[1] + 0.15, o.pos[2] - 0.3] }) };
  H.add(ell(0.98, 1.0, 0.98, 24, 18), { pos: [0, 7.65, -0.3], color: 'stone', bone: 'Head' });
  const helm = new THREE.SphereGeometry(1, 22, 10, 0, Math.PI * 2, 0, Math.PI * 0.52); helm.scale(1.06, 0.88, 1.08);
  H.add(helm, { pos: [0, 7.85, -0.28], rot: [-0.1, 0, 0], color: 'plate', bone: 'Head' });
  H.add(new THREE.TorusGeometry(1.06, 0.09, 6, 28), { pos: [0, 7.85, -0.3], rot: [Math.PI / 2 - 0.1, 0, 0], scale: [1, 1.03, 1], color: 'gold', bone: 'Head' });
  // brow crest and cheek guards
  H.add(cone(0.2, 1.1, 4), { pos: [0, 8.55, -0.95], quat: quatTo([0, 1, -0.6]), scale: [1, 1, 0.4], color: 'gold', bone: 'Head' });
  for (const [, x] of SIDES) armor(H, { p: [0.78 * x, 7.35, -0.75], n: [x, 0, -0.6], dir: [0, 1, 0.3], w: 0.32, l: 0.42, t: 0.1, color: 'plate', trim: 'gold', opts: { bone: 'Head' } });
  // visor: a dark band with two angled, burning eye slits (angry V) and a bright core
  H.add(ell(0.8, 0.24, 0.36, 20, 8), { pos: [0, 7.6, -1.02], color: 'pupil', bone: 'Head' });
  for (const [, x] of SIDES) {
    H.add(new THREE.BoxGeometry(0.64, 0.19, 0.16), { pos: [0.33 * x, 7.63, -1.3], rot: [0, 0.32 * x, -0.28 * x], mesh: 'Eyes', bone: 'Head' });
    H.add(new THREE.BoxGeometry(0.28, 0.1, 0.17), { pos: [0.28 * x, 7.65, -1.32], rot: [0, 0.32 * x, -0.28 * x], mesh: 'GlowCore', bone: 'Head' });
  }
  // mask chin (Jaw bone) over a glowing mouth slit
  H.add(ell(0.5, 0.07, 0.3, 14, 6), { pos: [0, 7.22, -1.08], mesh: 'Star', bone: 'Head' });
  armor(H, { p: [0, 7.02, -1.06], n: [0, -0.35, -1], dir: [1, 0, 0], w: 0.6, l: 0.24, t: 0.14, color: 'plate', trim: 'gold', rivets: 'goldDeep', opts: { bone: 'Jaw' } });
  for (const [, x] of SIDES) H.add(cone(0.07, 0.3, 4), { pos: [0.32 * x, 6.86, -1.12], rot: [Math.PI, 0, 0], color: 'gold', bone: 'Jaw' });
  // great crystal horns sweeping up and back (Ear bones)
  for (const [s, x] of SIDES) {
    const e = V(W[`Ear${s}`]);
    const pts = [e.clone().add(V([-0.2 * x, -0.3, -0.1])), e.clone().add(V([0.45 * x, 0.5, 0.0])), e.clone().add(V([0.8 * x, 1.35, 0.4])), e.clone().add(V([0.65 * x, 2.1, 1.1]))];
    B.add(loft({ points: pts.map((v) => v.toArray()), rx: (t) => 0.3 * (1 - 0.85 * t) + 0.02, ry: (t) => 0.3 * (1 - 0.85 * t) + 0.02, rings: 16, seg: 8 }), { color: 'crystal', bone: `Ear${s}` });
    B.add(loft({ points: pts.map((v) => v.clone().add(V([0, 0, 0.04])).toArray()), rx: (t) => 0.1 * (1 - 0.85 * t) + 0.01, ry: (t) => 0.1 * (1 - 0.85 * t) + 0.01, rings: 16, seg: 5 }), { mesh: 'Glow', bone: `Ear${s}` });
    B.add(new THREE.TorusGeometry(0.22, 0.06, 5, 12), { pos: pts[0].clone().add(V([0.05 * x, 0.15, 0])).toArray(), quat: quatTo(pts[1].clone().sub(pts[0]).toArray()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))), color: 'gold', bone: `Ear${s}` });
    B.add(ell(0.08, 0.08, 0.08, 6, 4), { pos: pts[3].toArray(), mesh: 'Star', bone: `Ear${s}` });
  }
  // floating crown of five crystal shards (Crown bone)
  const C = V(W.Crown);
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; B.add(crystal(0.12, k === 0 ? 0.75 : 0.55), { pos: C.clone().add(V([Math.cos(a) * 0.55, -0.2, Math.sin(a) * 0.55])).toArray(), quat: quatTo([Math.cos(a) * 0.25, 1, Math.sin(a) * 0.25]), color: k % 2 ? 'crystalDeep' : 'crystal', bone: 'Crown' }); }
  B.add(new THREE.TorusGeometry(0.58, 0.05, 5, 24), { pos: C.clone().add(V([0, -0.15, 0])).toArray(), rot: [Math.PI / 2, 0, 0], mesh: 'Star', bone: 'Crown' });

  // --- shoulders: huge pauldrons with gold rims and crystal spikes ---
  for (const [s, x] of SIDES) {
    const U = V(W[`Front${s}Upper`]);
    const pd = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.55); pd.scale(1.05, 0.85, 1.0);
    B.add(pd, { pos: U.clone().add(V([0.05 * x, 0.15, 0])).toArray(), rot: [0, 0, -0.35 * x], color: 'plate', bone: `Front${s}Upper` });
    B.add(new THREE.TorusGeometry(1.0, 0.09, 6, 28), { pos: U.clone().add(V([0.05 * x, 0.15, 0])).toArray(), rot: [Math.PI / 2, 0.35 * x, 0], scale: [1.04, 1.0, 1], color: 'gold', bone: `Front${s}Upper` });
    for (let k = 0; k < 3; k++) B.add(crystal(0.13 - k * 0.02, 0.95 - k * 0.2), { pos: U.clone().add(V([(0.45 + k * 0.12) * x, 0.75 - k * 0.12, -0.3 + k * 0.35])).toArray(), quat: quatTo([0.55 * x, 1, 0.1 * k]), color: k % 2 ? 'crystalDeep' : 'crystal', bone: `Front${s}Upper` });
    constellation(B, [[0.2, 0.9, -0.55], [0.6, 0.75, -0.2], [0.75, 0.5, 0.25], [0.5, 0.82, 0.45]].map(([a, b, c]) => U.clone().add(V([a * x, b, c]))), { bone: `Front${s}Upper` });
    // upper arm
    const L = V(W[`Front${s}Lower`]), P = V(W[`Front${s}Paw`]);
    B.add(loft({ points: [U.clone().add(V([0, -0.3, 0])).toArray(), U.clone().lerp(L, 0.55).toArray(), L.clone().add(V([0, 0.25, 0])).toArray()], rx: (t) => 0.55 - 0.1 * t, ry: (t) => 0.55 - 0.1 * t, rings: 8, seg: 12 }), { color: 'stone', bone: `Front${s}Upper` });
    armor(B, { p: U.clone().lerp(L, 0.5).add(V([0.4 * x, 0, 0])), n: [x, 0, 0], dir: [0, 1, 0], w: 0.38, l: 0.45, t: 0.1, color: 'plateDeep', trim: 'goldDeep', opts: { bone: `Front${s}Upper` } });
    // floating elbow orb in the gap
    B.add(ell(0.32, 0.32, 0.32, 14, 10), { pos: L.toArray(), mesh: 'Glow', bone: `Front${s}Lower` });
    B.add(new THREE.TorusGeometry(0.42, 0.06, 5, 18), { pos: L.toArray(), rot: [0, 0, Math.PI / 2], color: 'gold', bone: `Front${s}Lower` });
    // forearm gauntlet (floats free of the elbow)
    B.add(new THREE.CylinderGeometry(0.62, 0.48, 1.0, 10), { pos: L.clone().lerp(P, 0.45).toArray(), color: 'plate', bone: `Front${s}Lower` });
    for (const k of [0.15, 0.75]) B.add(new THREE.TorusGeometry(0.6 - k * 0.12, 0.07, 5, 18), { pos: L.clone().lerp(P, 0.45).add(V([0, 0.5 - k, 0])).toArray(), rot: [Math.PI / 2, 0, 0], color: 'gold', bone: `Front${s}Lower` });
    for (let k = 0; k < 3; k++) B.add(cone(0.1, 0.45, 4), { pos: L.clone().lerp(P, 0.45).add(V([0.55 * x, 0.25 - k * 0.3, 0.1])).toArray(), quat: quatTo([x, 0.4, 0.3]), color: 'crystal', bone: `Front${s}Lower` });
    // the fist: big blocky hand with knuckle plates, thumb and a glowing rune
    const F = P.clone().add(V([0, -0.15, 0]));
    B.add(ell(0.62, 0.58, 0.6, 16, 12), { pos: F.toArray(), color: 'stone', bone: `Front${s}Paw` });
    for (let k = 0; k < 4; k++) B.add(ell(0.16, 0.18, 0.2, 10, 8), { pos: F.clone().add(V([-0.39 + k * 0.26, -0.3, -0.48])).toArray(), color: 'stoneLight', bone: `Front${s}Paw` });
    armor(B, { p: F.clone().add(V([0, 0.25, -0.3])), n: [0, 0.6, -1], dir: [1, 0, 0], w: 0.5, l: 0.28, t: 0.1, color: 'plate', trim: 'gold', opts: { bone: `Front${s}Paw` } });
    B.add(new THREE.BoxGeometry(1.0, 0.1, 0.16), { pos: F.clone().add(V([0, -0.12, -0.55])).toArray(), color: 'gold', bone: `Front${s}Paw` });
    B.add(ell(0.17, 0.26, 0.18, 10, 8), { pos: F.clone().add(V([-0.58 * x, -0.05, -0.28])).toArray(), rot: [0, 0, 0.3 * x], color: 'stoneLight', bone: `Front${s}Paw` });
    B.add(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 6), { pos: F.clone().add(V([0.62 * x, 0.05, 0])).toArray(), rot: [0, 0, Math.PI / 2], mesh: 'Star', bone: `Front${s}Paw` });
    B.add(new THREE.TorusGeometry(0.62, 0.05, 5, 18), { pos: F.clone().add(V([0, 0.52, 0])).toArray(), rot: [Math.PI / 2, 0, 0], mesh: 'Glow', bone: `Front${s}Paw` });
  }

  // --- monolith halo behind the shoulders (Monoliths bone) ---
  const M = V(W.Monoliths);
  B.add(new THREE.TorusGeometry(2.9, 0.08, 6, 48), { pos: M.toArray(), mesh: 'Glow', bone: 'Monoliths' });
  B.add(new THREE.TorusGeometry(2.55, 0.04, 5, 48), { pos: M.toArray(), mesh: 'Star', bone: 'Monoliths' });
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + Math.PI / 2, d = V([Math.cos(a), Math.sin(a), 0]);
    const [g, tip] = monolith(1.2, 0.42);
    const q = quatTo(d.toArray()), p = M.clone().addScaledVector(d, 2.9);
    B.add(g, { pos: p.toArray(), quat: q, color: k % 2 ? 'stoneLight' : 'stone', bone: 'Monoliths' });
    B.add(tip, { pos: p.toArray(), quat: q, color: 'gold', bone: 'Monoliths' });
    for (let j = 0; j < 3; j++) B.add(new THREE.BoxGeometry(0.2, 0.05, 0.05), { pos: p.clone().addScaledVector(d, -0.3 + j * 0.3).add(V([0, 0, -0.22])).toArray(), quat: q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2))), mesh: 'Glow', bone: 'Monoliths' });
  }

  // --- planets orbiting the waist (StarOrbit bone) ---
  const O = V(W.StarOrbit);
  [['planetRed', 0.36, 0, 'Star'], ['planetBlue', 0.3, 2.1, 'ring'], ['planetGreen', 0.25, 4.2, null]].forEach(([col, r, a, extra]) => {
    const c = O.clone().add(V([Math.cos(a) * 3.3, Math.sin(a * 1.7) * 0.4, Math.sin(a) * 3.3]));
    B.add(ell(r, r, r, 14, 10), { pos: c.toArray(), color: col, bone: 'StarOrbit' });
    B.add(ell(r * 0.35, r * 0.2, r * 0.35, 6, 4), { pos: c.clone().add(V([r * 0.4, r * 0.55, -r * 0.3])).toArray(), color: 'white', bone: 'StarOrbit' });
    if (extra === 'ring') B.add(new THREE.TorusGeometry(r * 1.7, r * 0.12, 4, 24), { pos: c.toArray(), rot: [Math.PI / 2 - 0.4, 0, 0.3], color: 'ring', bone: 'StarOrbit' });
    if (extra === 'Star') { B.add(new THREE.TorusGeometry(r * 1.45, r * 0.08, 4, 24), { pos: c.toArray(), rot: [Math.PI / 2 + 0.5, 0, 0], mesh: 'Star', bone: 'StarOrbit' }); for (let j = 0; j < 4; j++) B.add(ell(r * 0.18, r * 0.06, r * 0.18, 6, 3), { pos: c.clone().add(V([Math.cos(j * 1.6) * r * 0.75, Math.sin(j * 2.1) * r * 0.65, -Math.abs(Math.sin(j * 1.6)) * r * 0.7])).toArray(), mesh: 'Star', bone: 'StarOrbit' }); }
  });
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 + 0.3; B.add(ell(0.05, 0.05, 0.05, 4, 3), { pos: O.clone().add(V([Math.cos(a) * 3.3, Math.sin(a * 3) * 0.15, Math.sin(a) * 3.3])).toArray(), mesh: 'GlowCore', bone: 'StarOrbit' }); }

  // --- lower body: a column of drifting rock shards instead of legs ---
  const hipsW = (p) => [['Hips', 1]];
  const cap = rock(1.15, 5, 0.8, 1); cap.scale(1.1, 1, 1);
  B.add(cap, { pos: [0, 3.2, 0.15], color: 'rock', weights: hipsW });
  B.add(new THREE.TorusGeometry(1.15, 0.07, 5, 24), { pos: [0, 3.1, 0.15], rot: [Math.PI / 2, 0, 0], mesh: 'Glow', weights: hipsW });
  const tailBones = ['Tail1', 'Tail2', 'Tail3', 'Tail4', 'TailTip'];
  tailBones.forEach((b, i) => {
    const c = V(W[b]), r = 0.75 - i * 0.12;
    B.add(rock(r, 20 + i, 0.75, 1), { pos: c.toArray(), color: i % 2 ? 'stoneLight' : 'rock', bone: b });
    B.add(ell(r * 0.35, 0.04, r * 0.35, 8, 3), { pos: c.clone().add(V([0, r * 0.45, 0])).toArray(), mesh: 'Glow', bone: b });
    for (let k = 0; k < 2; k++) { const a = i * 1.7 + k * 3.1; B.add(rock(0.18 - i * 0.02, 40 + i * 3 + k, 0.8), { pos: c.clone().add(V([Math.cos(a) * (r + 0.35), 0.1, Math.sin(a) * (r + 0.35)])).toArray(), color: 'stone', bone: b }); }
  });
  // side shard clusters on the leg bones + a few crystal shards
  for (const [s, x] of SIDES) for (const b of ['Upper', 'Lower', 'Paw']) {
    const c = V(W[`Back${s}${b}`]).add(V([0.35 * x, 0, 0])), r = b === 'Upper' ? 0.5 : b === 'Lower' ? 0.38 : 0.28;
    B.add(rock(r, (x > 0 ? 60 : 70) + r * 10, 0.85), { pos: c.toArray(), color: 'rock', bone: `Back${s}${b}` });
    B.add(crystal(r * 0.3, r * 1.4), { pos: c.clone().add(V([0.15 * x, r * 0.3, 0])).toArray(), quat: quatTo([0.5 * x, 1, 0]), color: 'crystal', bone: `Back${s}${b}` });
  }
}

export default {
  name: 'Astralith', element: 'Cosmic', palette, glow, bones, build,
  glowBoost: { Eyes: 1.0, Glow: 0.9, GlowCore: 1.0, Star: 1.0, Nebula: 0.9 }, bloom: 0.42,
  style: { body: 'biped', hover: 0.22, attack: 'slam', tip: 'TailTip', dur: { Idle: 3.4, Walk: 1.6, Run: 1.0, Attack: 1.6, Roar: 3.0 }, bob: 0.5, tail: 0.6, sway: 0.4, armSwing: 0.3 },
  spinners: [
    { bone: 'Galaxy', axis: [0, 0, 1], speed: 1.4 },
    { bone: 'Monoliths', axis: [0, 0, 1], speed: -0.35 },
    { bone: 'StarOrbit', axis: [0, 1, 0], speed: 0.8, bob: 0.2, bobFreq: 0.3 },
    { bone: 'Crown', axis: [0, 1, 0], speed: 1.0, bob: 0.1, bobFreq: 0.5 },
  ],
  bg: '#0d0b1c', light: { bone: 'Chest', color: '#a6b4ff' }, outline: '#06040e', fit: { hero: 0.74, roar: 0.82, sprite: 0.8 },
  views: { hero: [-8.5, 2.4, -10], roar: [-7, 1.0, -8.5], sprite: [-9, 2.0, -10] },
};
