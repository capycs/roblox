// Thalassor, the Tidal Colossus (Water, BOSS). A kaiju sea turtle about 16 studs long.
// Deep-teal hex scutes with bioluminescent seams, a living coral reef growing on its shell
// with a water spout erupting from a reef spire and water orbs orbiting it, kelp hanging off
// the shell rim, a hooked snapping beak with a coral crown and glowing barbels, broad flipper
// claws and a fan fluke on its armoured tail. Uses the quadruped rig plus the boss attack clips
// (style.body = 'boss'; no wings, so the wing parts of the poses do nothing).
import * as THREE from 'three';
import { V, SIDES, ell, cone, taperFront, surfaceQuat, quatTo, loft, quadBones, addEye, rock, flame } from '../lib.js';
import { torso, neck, legs, tail, armor } from '../kit.js';

const palette = [
  ['shell', '#1f6070'], ['shellDeep', '#123e4c'], ['shellLight', '#2f8a9c'], ['skin', '#3f8590'], ['skinDeep', '#275a64'],
  ['belly', '#ead9ae'], ['bellyDeep', '#bda877'], ['coral', '#ff7d6b'], ['coralDeep', '#d4504a'], ['coralY', '#ffc65a'],
  ['kelp', '#3d8f4c'], ['beak', '#efe5cc'], ['beakDeep', '#b5a682'], ['barnacle', '#cfd8d4'], ['pupil', '#04202a'], ['white', '#ffffff'],
];
const glow = { Eyes: '#aef8ff', Tide: '#3fe6ff', GlowCore: '#eafeff', Water: '#5fd0ff' };

const bones = quadBones({
  hips: [3.6, 2.4], spine: [4.0, 0.3], chest: [4.1, -2.0], neck: [4.4, -3.6], head: [5.05, -5.2], jaw: [4.4, -5.915],
  ear: [1.17, 4.4, -5.98],
  tail: [[3.4, 4.2], [3.0, 5.9], [2.6, 7.4], [2.35, 8.8], [2.3, 10.1]],
  front: { x: 2.75, upper: [3.6, -2.2], lower: [2.0, -2.7], paw: [0.7, -3.0] },
  back: { x: 2.6, upper: [3.2, 2.5], lower: [1.8, 2.9], paw: [0.7, 3.0] },
});
bones.push(['TideOrbit', 'Spine', [0, 9.4, 0.4]]);

// glowing seam line between points
function seam(B, pts, opts, r = 0.05) { B.add(loft({ points: pts.map((p) => (p.toArray ? p.toArray() : p)), rx: () => r, ry: () => r, rings: pts.length * 3, seg: 4 }), { mesh: 'Tide', ...opts }); }
// branching coral: a trunk with a few forked arms
function coral(B, base, dir, s, color, opts, seed = 1) {
  const D = V(dir).normalize(), P = V(base);
  const tip = P.clone().addScaledVector(D, 1.1 * s);
  B.add(loft({ points: [P.toArray(), P.clone().addScaledVector(D, 0.55 * s).toArray(), tip.toArray()], rx: (t) => 0.16 * s * (1 - 0.5 * t), ry: (t) => 0.16 * s * (1 - 0.5 * t), rings: 6, seg: 6 }), { color, ...opts });
  for (let k = 0; k < 3; k++) {
    const a = seed * 2.1 + k * 2.09, side = V([Math.cos(a), 0.6, Math.sin(a)]).normalize();
    const from = P.clone().addScaledVector(D, (0.45 + k * 0.2) * s), to = from.clone().addScaledVector(side.add(D).normalize(), 0.65 * s);
    B.add(loft({ points: [from.toArray(), from.clone().lerp(to, 0.5).add(V([0, 0.12 * s, 0])).toArray(), to.toArray()], rx: (t) => 0.1 * s * (1 - 0.5 * t), ry: (t) => 0.1 * s * (1 - 0.5 * t), rings: 5, seg: 5 }), { color, ...opts });
    B.add(ell(0.11 * s, 0.11 * s, 0.11 * s, 6, 4), { pos: to.toArray(), color: 'coralY', ...opts });
  }
  B.add(ell(0.13 * s, 0.13 * s, 0.13 * s, 6, 4), { pos: tip.toArray(), color: 'coralY', ...opts });
}

// scale a group of parts by k around c, then shift by lift (geometry with pos, or absolute lofts)
function bigHead(B, c, k, lift) {
  return {
    add(g, o = {}) {
      const geo = g.clone();
      if (o.pos) {
        geo.scale(k, k, k);
        const p = V(o.pos).sub(c).multiplyScalar(k).add(c).add(lift);
        return B.add(geo, { ...o, pos: p.toArray() });
      }
      geo.translate(-c.x, -c.y, -c.z); geo.scale(k, k, k); geo.translate(c.x + lift.x, c.y + lift.y, c.z + lift.z);
      return B.add(geo, o);
    },
  };
}

function build(B, W) {
  const T = torso(B, { pts: [[0, 3.5, 3.7], [0, 3.85, 2.0], [0, 4.05, 0.3], [0, 4.15, -1.6], [0, 4.25, -2.9]], rx: (t) => 2.2 + 0.25 * t, ry: (t) => 1.6 + 0.2 * t, color: 'skin', zHips: 2.4, zSpine: 0.3, zChest: -2.0, rings: 22, seg: 16 });
  const tw = T.torsoW;
  // plastron: cream belly plates in rows
  B.add(ell(2.3, 0.45, 3.5, 16, 6), { pos: [0, 2.75, 0.2], color: 'belly', weights: tw });
  for (let k = 0; k < 5; k++) B.add(ell(2.0 - Math.abs(k - 2) * 0.25, 0.08, 0.06, 12, 3), { pos: [0, 2.43, -2.2 + k * 1.15], color: 'bellyDeep', weights: tw });

  // ---- carapace: domed shell of hex scutes with glowing seams, a rim skirt and rim spikes
  const SC = V([0, 4.5, 0.3]), SR = [4.15, 2.55, 4.85];
  const dome = new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.scale(SR[0], SR[1], SR[2]);
  B.add(dome, { pos: SC.toArray(), color: 'shellDeep', bone: 'Spine' });
  B.add(ell(SR[0] + 0.35, 0.42, SR[2] + 0.35, 28, 6), { pos: SC.clone().add(V([0, 0.05, 0])).toArray(), color: 'shell', bone: 'Spine' });
  const onDome = (th, ph, lift = 0) => {
    // th = 0 top .. PI/2 rim, ph around
    const n = V([Math.sin(th) * Math.cos(ph) / SR[0], Math.cos(th) / SR[1], Math.sin(th) * Math.sin(ph) / SR[2]]).normalize();
    const p = V([Math.sin(th) * Math.cos(ph) * SR[0], Math.cos(th) * SR[1], Math.sin(th) * Math.sin(ph) * SR[2]]).add(SC).addScaledVector(n, lift);
    return { p, n };
  };
  for (const [th, n, w] of [[0.0, 1, 1.1], [0.55, 6, 1.05], [1.0, 10, 0.95], [1.32, 14, 0.75]]) {
    for (let k = 0; k < n; k++) {
      const ph = (k / n) * Math.PI * 2 + (n === 10 ? 0.31 : 0);
      const { p, n: N } = onDome(th, ph, 0.02);
      const dir = th === 0 ? [0, 0, 1] : [-Math.sin(ph), 0, Math.cos(ph)];
      B.add(new THREE.CylinderGeometry(w * 1.12, w * 1.12, 0.1, 6), { pos: p.clone().addScaledVector(N, -0.02).toArray(), quat: surfaceQuat(N.toArray(), dir), mesh: 'Tide', bone: 'Spine' });
      B.add(new THREE.CylinderGeometry(w * 0.98, w, 0.22, 6), { pos: p.clone().addScaledVector(N, 0.06).toArray(), quat: surfaceQuat(N.toArray(), dir), color: (k + n) % 3 ? 'shell' : 'shellLight', bone: 'Spine' });
    }
  }
  for (let k = 0; k < 18; k++) {
    const ph = (k / 18) * Math.PI * 2; if (Math.abs(Math.sin(ph)) > 0.93 && Math.sin(ph) < 0) continue; // keep the neck opening clear
    const { p } = onDome(Math.PI / 2, ph, 0.25);
    B.add(cone(0.22, 0.75, 5), { pos: p.toArray(), quat: quatTo([Math.cos(ph), -0.25, Math.sin(ph)]), color: 'shellDeep', bone: 'Spine' });
    if (k % 2 === 0) B.add(ell(0.13, 0.13, 0.13, 6, 4), { pos: onDome(1.45, ph + 0.17, 0.08).p.toArray(), mesh: 'Tide', bone: 'Spine' });
  }
  // the reef: coral clusters, anemones and barnacles growing over the shell
  for (const [th, ph, s, c] of [[0.75, 0.4, 1.3, 'coral'], [0.8, 2.3, 1.1, 'coralDeep'], [0.9, 3.6, 1.2, 'coral'], [0.7, 5.0, 1.0, 'coralDeep'], [1.1, 1.3, 0.9, 'coral'], [1.15, 4.3, 0.8, 'coralDeep'], [0.95, 5.9, 0.9, 'coral']]) {
    const { p, n } = onDome(th, ph, 0.1); coral(B, p.toArray(), n.clone().add(V([0, 0.6, 0])).toArray(), s, c, { bone: 'Spine' }, th * 10 + ph);
  }
  for (const [th, ph] of [[0.6, 1.4], [1.05, 2.9], [0.65, 4.4], [1.2, 0.2]]) {
    const { p, n } = onDome(th, ph, 0.05);
    B.add(new THREE.CylinderGeometry(0.22, 0.28, 0.35, 8), { pos: p.toArray(), quat: quatTo(n.toArray()), color: 'coralY', bone: 'Spine' });
    for (let j = 0; j < 7; j++) { const a = (j / 7) * Math.PI * 2; B.add(cone(0.05, 0.45, 4), { pos: p.clone().addScaledVector(n, 0.25).add(V([Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15])).toArray(), quat: quatTo(n.clone().add(V([Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6])).toArray()), mesh: j % 2 ? 'Tide' : undefined, color: j % 2 ? undefined : 'coral', bone: 'Spine' }); }
  }
  for (let k = 0; k < 9; k++) { const { p, n } = onDome(0.5 + (k % 5) * 0.2, k * 1.7, 0.02); B.add(new THREE.CylinderGeometry(0.06, 0.14, 0.18, 6), { pos: p.toArray(), quat: quatTo(n.toArray()), color: 'barnacle', bone: 'Spine' }); }
  // reef spire on top with the water spout erupting out of it
  const top = SC.clone().add(V([0, SR[1] - 0.1, 0]));
  B.add(new THREE.LatheGeometry([[1.7, 0], [1.4, 0.5], [1.0, 1.2], [0.85, 1.7], [1.02, 1.9], [0.78, 1.85]].map(([r, y]) => new THREE.Vector2(r, y)), 12), { pos: top.toArray(), color: 'shellDeep', bone: 'Spine' });
  for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; B.add(rock(0.28 + (k % 3) * 0.06, 21 + k, 0.8), { pos: top.clone().add(V([Math.cos(a) * 0.95, 1.8 + (k % 2) * 0.06, Math.sin(a) * 0.95])).toArray(), color: k % 2 ? 'coralDeep' : 'shell', bone: 'Spine' }); }
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.4; seam(B, [top.clone().add(V([Math.cos(a) * 1.0, 1.8, Math.sin(a) * 1.0])), top.clone().add(V([Math.cos(a) * 1.25, 0.9, Math.sin(a) * 1.25])), top.clone().add(V([Math.cos(a) * 1.6, 0.15, Math.sin(a) * 1.6]))], { bone: 'Spine' }, 0.07); }
  B.add(new THREE.CylinderGeometry(0.8, 0.8, 0.1, 14), { pos: top.clone().add(V([0, 1.78, 0])).toArray(), mesh: 'GlowCore', bone: 'Spine' });
  B.add(flame(0.7, 3.0, { rings: 12, seg: 10, twist: 2.6, lean: 0.08 }), { pos: top.clone().add(V([0, 1.75, 0])).toArray(), mesh: 'Water', bone: 'Spine' });
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.6; B.add(flame(0.28, 1.3, { rings: 8, seg: 8 }), { pos: top.clone().add(V([Math.cos(a) * 0.55, 1.8, Math.sin(a) * 0.55])).toArray(), quat: quatTo([Math.cos(a) * 0.7, 1, Math.sin(a) * 0.7]), mesh: 'Water', bone: 'Spine' }); }
  B.add(new THREE.TorusGeometry(0.95, 0.13, 6, 20), { pos: top.clone().add(V([0, 1.85, 0])).toArray(), rot: [Math.PI / 2, 0, 0], mesh: 'GlowCore', bone: 'Spine' });
  // water orbs orbiting the spout (TideOrbit bone)
  const O = V(W.TideOrbit);
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2, c = O.clone().add(V([Math.cos(a) * 2.1, Math.sin(a * 2) * 0.25, Math.sin(a) * 2.1])); B.add(ell(0.42, 0.42, 0.42, 12, 8), { pos: c.toArray(), mesh: 'Water', bone: 'TideOrbit' }); B.add(ell(0.2, 0.2, 0.2, 8, 6), { pos: c.clone().add(V([-0.12, 0.12, -0.12])).toArray(), mesh: 'GlowCore', bone: 'TideOrbit' }); }

  // ---- neck: thick and wrinkled with small plates
  const nw = neck(B, { pts: [[0, 4.15, -2.6], [0, 4.55, -3.9], [0, 5.0, -5.0]], r: 1.3, color: 'skin', yChest: 4.2, yNeck: 4.55, yHead: 5.0 });
  for (let k = 0; k < 3; k++) B.add(new THREE.TorusGeometry(1.1 - k * 0.05, 0.07, 5, 18), { pos: [0, 4.25 + k * 0.17, -3.0 - k * 0.55], rot: [0.3, 0, 0], color: 'skinDeep', weights: nw });
  for (let k = 0; k < 3; k++) armor(B, { p: [0, 5.3 + k * 0.12, -3.0 - k * 0.6], n: [0, 1, -0.15], dir: [0, 0, -1], w: 0.5, l: 0.35, t: 0.1, color: 'shell', trim: 'shellDeep', opts: { weights: nw } });

  // ---- head: snapping-turtle skull with a hooked beak, coral crown, glowing eyes and barbels
  // (modelled at the old size, then scaled 1.3x around the head and lifted to boss size)
  const B0 = B;
  { const B = bigHead(B0, V([0, 4.75, -5.0]), 1.3, V([0, 0.3, -0.2]));
  B.add(ell(1.3, 1.05, 1.45, 18, 12), { pos: [0, 5.0, -5.15], color: 'skin', bone: 'Head' });
  B.add(taperFront(ell(1.05, 0.75, 1.1, 16, 10), 0.35), { pos: [0, 4.85, -6.0], color: 'skin', bone: 'Head' });
  armor(B, { p: [0, 5.92, -5.3], n: [0, 1, -0.2], dir: [0, 0, -1], w: 0.9, l: 1.2, t: 0.16, color: 'shell', trim: 'shellDeep', opts: { bone: 'Head' } });
  for (const [x0, z0] of [[0, -4.65], [-0.55, -5.0], [0.55, -5.0]]) armor(B, { p: [x0, 5.86, z0], n: [x0 * 0.4, 1, 0], dir: [0, 0, -1], w: 0.35, l: 0.35, t: 0.1, color: 'shellLight', opts: { bone: 'Head' } });
  // upper beak: hooked tip and serrated edge
  B.add(taperFront(ell(0.95, 0.45, 0.95, 14, 8), 0.45), { pos: [0, 4.62, -6.45], color: 'beakDeep', bone: 'Head' });
  B.add(cone(0.28, 0.8, 8), { pos: [0, 4.25, -7.25], rot: [Math.PI * 0.82, 0, 0], color: 'beakDeep', bone: 'Head' });
  for (let k = 0; k < 8; k++) { const a = (k / 7 - 0.5) * 2.0; B.add(cone(0.07, 0.25, 4), { pos: [Math.sin(a) * 0.82, 4.22, -6.3 - Math.cos(a) * 0.75], rot: [Math.PI, 0, 0], color: 'white', bone: 'Head' }); }
  B.add(ell(0.6, 0.18, 0.7, 12, 6), { pos: [0, 4.3, -5.95], mesh: 'Tide', bone: 'Head' });
  for (const [, x] of SIDES) {
    B.add(ell(0.55, 0.26, 0.75), { pos: [0.65 * x, 5.5, -5.75], rot: [0.2, 0.25 * x, 0.4 * x], color: 'skinDeep', bone: 'Head' });
    addEye(B, x, [0.84 * x, 5.28, -5.88], { r: [0.34, 0.28, 0.17], pupil: [0.06, 0.21], th: -0.55 * x, lid: 'skinDeep', lidAngle: 0.7, lidTilt: 0.45, brow: { color: 'shellDeep', len: 0.42, tilt: 0.7 } });
    B.add(ell(0.08, 0.06, 0.06, 6, 4), { pos: [0.25 * x, 4.95, -7.0], color: 'pupil', bone: 'Head' }); // nostril
    // coral crown sweeping back off the skull
    coral(B, [0.55 * x, 5.85, -4.7], [0.6 * x, 1, 0.7], 1.25, x < 0 ? 'coral' : 'coralDeep', { bone: 'Head' }, x + 3);
    // barbels hanging from the jaw corners (Ear bones), glowing tips
    const e = V([0.9 * x, 4.25, -5.6]), eb = `Ear${x < 0 ? 'L' : 'R'}`;
    B.add(loft({ points: [e.toArray(), e.clone().add(V([0.25 * x, -0.6, 0.1])).toArray(), e.clone().add(V([0.15 * x, -1.3, -0.15])).toArray()], rx: (t) => 0.1 * (1 - 0.6 * t), ry: (t) => 0.1 * (1 - 0.6 * t), rings: 8, seg: 6 }), { color: 'skinDeep', bone: eb });
    B.add(ell(0.13, 0.13, 0.13, 8, 6), { pos: e.clone().add(V([0.15 * x, -1.32, -0.15])).toArray(), mesh: 'Tide', bone: eb });
  }
  // lower beak with teeth and tusks
  B.add(taperFront(ell(0.85, 0.35, 1.05, 14, 8), 0.4), { pos: [0, 4.0, -6.15], color: 'skinDeep', bone: 'Jaw' });
  B.add(taperFront(ell(0.72, 0.1, 0.9, 14, 5), 0.4), { pos: [0, 4.28, -6.15], color: 'skinDeep', bone: 'Jaw' });
  for (let k = 0; k < 7; k++) { const a = (k / 6 - 0.5) * 1.9; B.add(cone(0.06, 0.22, 4), { pos: [Math.sin(a) * 0.72, 4.3, -6.15 - Math.cos(a) * 0.82], color: 'white', bone: 'Jaw' }); }
  for (const [, x] of SIDES) B.add(loft({ points: [[0.6 * x, 4.05, -6.3], [0.95 * x, 4.35, -6.8], [0.9 * x, 4.85, -7.0]], rx: (t) => 0.13 * (1 - 0.8 * t) + 0.02, ry: (t) => 0.13 * (1 - 0.8 * t) + 0.02, rings: 8, seg: 6 }), { color: 'beak', bone: 'Jaw' });

  }

  // ---- legs: thick pillars with scale plates and broad flipper paddles ending in claws
  legs(B, W, { front: { r: [1.0, 0.7] }, back: { r: [1.0, 0.66] }, color: 'skin', footColor: 'skinDeep', clawColor: 'beak', foot: 'stub' });
  for (const [s, x] of SIDES) for (const k of ['Front', 'Back']) {
    const U = V(W[`${k}${s}Upper`]), L = V(W[`${k}${s}Lower`]), P = V(W[`${k}${s}Paw`]);
    const big = k === 'Front' ? 1 : 0.8;
    B.add(ell(1.5 * big, 0.17, 0.85 * big, 14, 6), { pos: [P.x + 0.75 * x * big, 0.42, P.z + (k === 'Front' ? -0.5 : 0.4)], rot: [0, (k === 'Front' ? 0.45 : -0.35) * x, -0.12 * x], color: 'skinDeep', bone: `${k}${s}Paw` });
    seam(B, [[P.x + 0.2 * x, 0.55, P.z - 0.3], [P.x + 1.2 * x * big, 0.55, P.z + (k === 'Front' ? -0.8 : 0.6)], [P.x + 2.0 * x * big, 0.5, P.z + (k === 'Front' ? -1.1 : 0.85)]], { bone: `${k}${s}Paw` }, 0.05);
    for (let j = 0; j < 3; j++) B.add(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 6), { pos: U.clone().lerp(L, 0.35 + j * 0.22).add(V([0.98 * x, 0, (j - 1) * 0.25])).toArray(), quat: quatTo([x, 0, 0]), color: j % 2 ? 'shellLight' : 'shell', bone: `${k}${s}Upper` });
    for (const dx of [-0.4, 0, 0.4]) B.add(cone(0.13, 0.65, 6), { pos: [P.x + dx, 0.3, P.z - 1.15], quat: quatTo([0, -0.4, -1]), color: 'beak', bone: `${k}${s}Paw` });
  }

  // ---- tail: armoured, a ridge of scute spikes, fan fluke with glowing edges
  const tl = tail(B, { pts: [[0, 3.4, 4.0], [0, 3.0, 5.9], [0, 2.6, 7.4], [0, 2.35, 8.8], [0, 2.3, 10.1]], r: (t) => 1.0 * (1 - 0.8 * t) + 0.16, color: 'skin', rings: 20, seg: 12 });
  for (let k = 0; k < 8; k++) { const t = 0.1 + k * 0.11, c = tl.curve.getPoint(t), r = 1.0 * (1 - 0.8 * t) + 0.16; B.add(new THREE.CylinderGeometry(r * 0.55, r * 0.6, 0.18, 6), { pos: c.clone().add(V([0, r * 0.9, 0])).toArray(), color: k % 2 ? 'shell' : 'shellLight', weights: () => tl.w(t) }); B.add(cone(0.12, 0.45 * (1 - 0.4 * t), 5), { pos: c.clone().add(V([0, r * 1.05, 0])).toArray(), quat: quatTo([0, 1, 0.5]), color: 'shellDeep', weights: () => tl.w(t) }); }
  const tip = V(W.TailTip);
  for (const [, x] of SIDES) {
    B.add(ell(2.2, 0.16, 1.15, 14, 6), { pos: tip.clone().add(V([1.35 * x, -0.05, 0.95])).toArray(), rot: [0, -0.55 * x, 0], color: 'shell', bone: 'TailTip' });
    seam(B, [tip.clone().add(V([0.2 * x, 0, 0.3])), tip.clone().add(V([1.8 * x, 0, 1.8])), tip.clone().add(V([3.2 * x, 0, 1.6]))], { bone: 'TailTip' }, 0.07);
  }
  B.add(ell(0.5, 0.4, 0.6, 10, 8), { pos: tip.toArray(), color: 'shellDeep', bone: 'TailTip' });
}

export default {
  name: 'Thalassor', element: 'Water', palette, glow, bones, build, glowBoost: { Eyes: 0.7, Tide: 0.8, GlowCore: 0.9, Water: 0.7 }, bloom: 0.4,
  style: {
    body: 'boss', tip: 'TailTip', attack: 'bite',
    dur: { Idle: 3.2, Walk: 1.6, Run: 1.0, Attack: 1.3, Roar: 2.8, FireBreath: 3.0, TailSwipe: 1.8, Stomp: 2.2, Eruption: 3.2, Enrage: 3.0, Hurt: 0.6, Death: 3.0 },
    walk: [0.32, 0.45, 0.3, 0.38], run: [0.5, 0.6, 0.5, 0.55], bob: 0.8, roll: 0.06, sway: 0.7, tail: 0.9, neck: 0.45, headLow: -0.05,
  },
  spinners: [{ bone: 'TideOrbit', axis: [0, 1, 0], speed: 0.7, bob: 0.3, bobFreq: 0.35 }],
  bg: '#0c1a22', light: { bone: 'Spine', color: '#5fe6ff' }, outline: '#03101a', fit: { hero: 0.62, roar: 0.74, sprite: 0.72 },
  views: { hero: [-9, 2.6, -9.5], roar: [-9, 1.2, -8], sprite: [-10.5, 2.2, -9] },
};
