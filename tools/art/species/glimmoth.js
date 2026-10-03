// Glimmoth (Storm): a fluffy moth-fox. Lilac fur, a huge cream neck ruff, feathery
// antennae, big glossy eyes and four soft moth wings with glowing electric eye-spots.
// The wings dust out static sparkles when it flaps.
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, blend, quadBones, addEye, blade, shortenLegs } from '../lib.js';
import { torso, neck, legs, tail } from '../kit.js';

const palette = [
  ['fur', '#b9a6e8'], ['furDeep', '#8a74c8'], ['furLight', '#dcd0ff'], ['ruff', '#fff3dc'], ['ruffDeep', '#ead6b4'],
  ['wing', '#a8b8f0'], ['wingDeep', '#5e5aa8'], ['wingEdge', '#3a3576'], ['wingDust', '#e4ecff'], ['sock', '#4a3f86'],
  ['nose', '#2a1f48'], ['mouth', '#7a2a5a'], ['pupil', '#14102a'], ['white', '#ffffff'], ['antenna', '#f2d68a'],
];
const glow = { Eyes: '#b8f4ff', Glow: '#7fe8ff', GlowCore: '#fff7a8' };

const bones = quadBones({
  hips: [1.5, 0.6], spine: [1.62, 0.0], chest: [1.68, -0.55], neck: [2.02, -0.85], head: [2.42, -1.05], jaw: [2.12, -1.38],
  ear: [0.22, 3.02, -1.15],
  tail: [[1.55, 1.0], [1.6, 1.5], [1.85, 1.95], [2.2, 2.25], [2.55, 2.4]],
  front: { x: 0.4, upper: [1.35, -0.55], lower: [0.75, -0.6], paw: [0.22, -0.62] },
  back: { x: 0.42, upper: [1.35, 0.6], lower: [0.75, 0.75], paw: [0.22, 0.65] },
  wing: { upper: [0.42, 2.08, -0.25], lower: [1.25, 2.55, 0.0], tip: [2.05, 2.85, 0.25] },
});

function build(B, W) {
  const T = torso(B, { pts: [[0, 1.55, 1.1], [0, 1.55, 0.55], [0, 1.62, 0.0], [0, 1.72, -0.5], [0, 1.8, -0.9]], rx: (t) => 0.55 + 0.1 * t, ry: (t) => 0.55 + 0.12 * t, color: 'fur', zHips: 0.6, zSpine: 0.0, zChest: -0.55 });
  B.add(ell(0.42, 0.32, 0.8), { pos: [0, 1.3, -0.1], color: 'furLight', weights: T.torsoW });
  // fuzzy back tufts
  for (let i = 0; i < 9; i++) { const t = 0.15 + i * 0.08, { p, n } = T.surf(t, Math.PI / 2 + ((i % 3) - 1) * 0.5, 1, 0.95); B.add(cone(0.14, 0.38, 6), { pos: p.toArray(), quat: quatTo(n.clone().add(V([0, 0, 0.8])).toArray()), color: i % 2 ? 'furLight' : 'fur', weights: T.torsoW }); }

  // --- the big neck ruff: rings of soft cream spikes ---
  const ruffW = (p) => (p.y > 2.1 ? [['Neck', 0.6], ['Head', 0.4]] : [['Chest', 0.6], ['Neck', 0.4]]);
  for (const [ring, R, len, col] of [[0, 0.62, 0.55, 'ruffDeep'], [1, 0.55, 0.48, 'ruff'], [2, 0.45, 0.38, 'ruff']]) {
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.22, d = V([Math.cos(a), Math.sin(a) * 0.85 - 0.15, -0.35 - ring * 0.15]).normalize();
      B.add(cone(0.27, len, 7), { pos: V([0, 1.95, -0.85 - ring * 0.12]).add(V([Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.55, 0])).addScaledVector(d, len * 0.35).toArray(), quat: quatTo(d.toArray()), color: col, weights: ruffW });
    }
  }
  B.add(ell(0.62, 0.6, 0.45, 14, 10), { pos: [0, 1.95, -0.85], color: 'ruff', weights: ruffW });
  neck(B, { pts: [[0, 1.75, -0.6], [0, 2.02, -0.85], [0, 2.42, -1.05]], r: 0.4, color: 'fur', yChest: 1.85, yNeck: 2.02, yHead: 2.35 });

  // --- head: round fox face, big glossy eyes, small muzzle ---
  B.add(ell(0.62, 0.56, 0.58, 22, 16), { pos: [0, 2.45, -1.1], color: 'fur', bone: 'Head' });
  B.add(taperFront(ell(0.3, 0.24, 0.42, 16, 12), 0.35), { pos: [0, 2.24, -1.55], color: 'furLight', bone: 'Head' });
  B.add(ell(0.09, 0.07, 0.07, 10, 6), { pos: [0, 2.32, -1.95], color: 'nose', bone: 'Head' });
  B.add(taperFront(ell(0.22, 0.09, 0.32), 0.35), { pos: [0, 2.05, -1.5], color: 'furLight', bone: 'Jaw' });
  B.add(taperFront(ell(0.16, 0.04, 0.28, 12, 6), 0.35), { pos: [0, 2.12, -1.52], color: 'mouth', bone: 'Jaw' });
  // fluffy forehead tuft and cheek fluff
  for (let k = 0; k < 5; k++) B.add(cone(0.12, 0.4, 6), { pos: [(k - 2) * 0.1, 2.95, -1.12 + Math.abs(k - 2) * 0.04], quat: quatTo([(k - 2) * 0.35, 1, 0.4]), color: k % 2 ? 'ruff' : 'furLight', bone: 'Head' });
  for (const [s, x] of SIDES) {
    addEye(B, x, [0.3 * x, 2.52, -1.55], { r: [0.24, 0.26, 0.13], pupil: [0.13, 0.15], lid: 'furDeep', lidAngle: 0.5, brow: { color: 'furDeep', len: 0.2, tilt: 0.25 } });
    for (const dy of [0, -0.18]) B.add(cone(0.15, 0.45, 6), { pos: [0.55 * x, 2.3 + dy, -1.05], quat: quatTo([x, -0.3, 0.3]), color: 'ruff', bone: 'Head' });
    // feathery antennae: curved golden stalk with little fronds along both sides
    const e = V(W[`Ear${s}`]);
    const pts = [e, e.clone().add(V([0.15 * x, 0.45, -0.1])), e.clone().add(V([0.45 * x, 0.85, 0.05])), e.clone().add(V([0.85 * x, 1.0, 0.3]))];
    const stalk = new THREE.CatmullRomCurve3(pts);
    B.add(loft({ points: pts.map((v) => v.toArray()), rx: (t) => 0.045 * (1 - 0.5 * t), ry: (t) => 0.045 * (1 - 0.5 * t), rings: 12, seg: 6 }), { color: 'antenna', bone: `Ear${s}` });
    for (let k = 0; k < 7; k++) {
      const u = 0.2 + k * 0.11, c = stalk.getPoint(u), tg = stalk.getTangent(u), len = 0.28 * Math.sin(Math.PI * (u * 0.9 + 0.05));
      for (const side of [-1, 1]) {
        const d = V([0, 0, side]).addScaledVector(tg, 0.6).normalize();
        B.add(blade(len, 0.06, 0.02, 4), { pos: c.toArray(), quat: surfaceQuat([0, 1, 0], d.toArray()), color: 'antenna', bone: `Ear${s}` });
      }
    }
    B.add(ell(0.06, 0.06, 0.06, 8, 6), { pos: pts[3].toArray(), mesh: 'GlowCore', bone: `Ear${s}` });
  }

  // --- moth wings: big forewing + smaller hindwing per side, edge band and glowing eye-spots ---
  for (const [s, x] of SIDES) {
    const S = V(W[`Wing${s}Upper`]), E = V(W[`Wing${s}Lower`]), Tp = V(W[`Wing${s}Tip`]);
    const ww = (p) => blend([[Math.abs(S.x) + 0.1, `Wing${s}Upper`], [Math.abs(E.x) - 0.15, `Wing${s}Upper`], [Math.abs(E.x) + 0.25, `Wing${s}Lower`], [Math.abs(Tp.x) - 0.1, `Wing${s}Lower`], [Math.abs(Tp.x) + 0.3, `Wing${s}Tip`]], Math.abs(p.x));
    const out = Tp.clone().sub(S).normalize();
    const n = V([-0.8 * x, 0.5, 0.12]).normalize(); // wings stand up in a V, faces turned outward
    for (const [kind, dir, len, wid, off] of [['fore', out.clone().add(V([0, 0.55, -0.15])).normalize(), 2.6, 1.6, V([0, 0.04, 0])], ['hind', out.clone().add(V([0, -0.35, 1.1])).normalize(), 1.9, 1.3, V([0, -0.06, 0.25])]]) {
      const c = S.clone().add(off).addScaledVector(dir, len * 0.47);
      const q = surfaceQuat(n.toArray(), dir.toArray());
      // layers are centred on the wing plane with increasing thickness, so the pattern shows on both faces
      B.add(ell(len * 0.52, wid * 0.53, 0.025, 22, 6), { pos: c.toArray(), quat: q, color: 'wingEdge', weights: ww });
      B.add(ell(len * 0.48, wid * 0.47, 0.04, 22, 6), { pos: c.toArray(), quat: q, color: kind === 'fore' ? 'wing' : 'wingDeep', weights: ww });
      B.add(ell(len * 0.22, wid * 0.32, 0.05, 14, 6), { pos: c.clone().addScaledVector(dir, -len * 0.2).toArray(), quat: q, color: 'wingDust', weights: ww });
      B.add(ell(len * 0.06, wid * 0.42, 0.05, 10, 6), { pos: c.clone().addScaledVector(dir, len * 0.12).toArray(), quat: q, color: kind === 'fore' ? 'wingDeep' : 'wing', weights: ww });
      // eye-spot: dark ring, glowing ring, bright core (cylinders poke through both faces)
      const es = c.clone().addScaledVector(dir, len * (kind === 'fore' ? 0.24 : 0.1));
      const sr = kind === 'fore' ? 0.32 : 0.25;
      B.add(new THREE.CylinderGeometry(sr, sr, 0.07, 18), { pos: es.toArray(), quat: quatTo(n.toArray()), color: 'wingEdge', weights: ww });
      B.add(new THREE.CylinderGeometry(sr * 0.72, sr * 0.72, 0.08, 18), { pos: es.toArray(), quat: quatTo(n.toArray()), mesh: 'Glow', weights: ww });
      B.add(new THREE.CylinderGeometry(sr * 0.32, sr * 0.32, 0.09, 12), { pos: es.toArray(), quat: quatTo(n.toArray()), mesh: 'GlowCore', weights: ww });
      // glowing static-dust dots along the outer edge
      const across = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
      for (let k = 0; k < 4; k++) { const u = -0.25 + k * 0.2; B.add(ell(0.06, 0.06, 0.05, 6, 4), { pos: c.clone().addScaledVector(dir, len * u).addScaledVector(across, wid * 0.38 * (kind === 'fore' ? -1 : 1)).toArray(), quat: q, mesh: 'Glow', weights: ww }); }
    }
    // furry wing root
    B.add(ell(0.28, 0.24, 0.32, 10, 8), { pos: S.clone().add(V([0.1 * x, 0, 0.05])).toArray(), color: 'fur', weights: ww });
  }

  legs(B, W, { front: { r: [0.28, 0.16] }, back: { r: [0.31, 0.17] }, color: 'fur', footColor: 'sock', clawColor: 'ruff', foot: 'paw' });
  // fuzzy leg cuffs
  for (const [s, x] of SIDES) for (const k of ['Front', 'Back']) { const P = V(W[`${k}${s}Paw`]); for (let j = 0; j < 5; j++) { const a = (j / 5) * Math.PI * 2; B.add(cone(0.08, 0.22, 5), { pos: [P.x + Math.cos(a) * 0.15, 0.48, P.z + Math.sin(a) * 0.15], quat: quatTo([Math.cos(a), -0.6, Math.sin(a)]), color: 'furLight', bone: `${k}${s}Paw` }); } }

  // --- fluffy tail with a glowing tip ---
  const tl = tail(B, { pts: [[0, 1.55, 0.95], [0, 1.6, 1.5], [0, 1.85, 1.95], [0, 2.2, 2.25], [0, 2.55, 2.4]], r: (t) => 0.15 + 0.32 * Math.sin(Math.PI * Math.min(1, t * 1.05)), color: 'fur', rings: 26, seg: 12 });
  for (let k = 0; k < 7; k++) { const t = 0.2 + k * 0.1, c = tl.curve.getPoint(t), tg = tl.curve.getTangent(t); for (const [, x] of SIDES) B.add(cone(0.15, 0.45, 6), { pos: c.clone().add(V([x * 0.22, 0, 0])).toArray(), quat: quatTo(V([x, 0.3, 0]).addScaledVector(tg, 0.8).toArray()), color: k % 2 ? 'furLight' : 'furDeep', weights: () => tl.w(t) }); }
  const tip = V(W.TailTip);
  B.add(ell(0.26, 0.26, 0.26, 12, 8), { pos: tip.toArray(), color: 'ruff', bone: 'TailTip' });
  B.add(ell(0.13, 0.13, 0.13, 8, 6), { pos: tip.clone().add(V([0, 0.12, 0.1])).toArray(), mesh: 'Glow', bone: 'TailTip' });
}

export default {
  name: 'Glimmoth', element: 'Storm', palette, glow, bones, build, warp: shortenLegs(0.3, 0.3, 1.2),
  style: { tip: 'TailTip', wings: true, wingRest: 0.18, dur: { Idle: 2.6, Walk: 0.9, Run: 0.5, Attack: 1.0, Roar: 2.2 }, bob: 1.1, tail: 1.0, sway: 1.0 },
  bg: '#181a2c', light: { bone: 'Chest', color: '#7fe8ff' }, outline: '#0c0c1c', fit: { hero: 0.78, sprite: 0.78 },
};
