// Shared body parts for quadruped species: torso, legs (paws or hooves) and tail, all
// skinned to the standard quadBones rig. Species files add the heads and the fun bits.
import * as THREE from 'three';
import { V, SIDES, env, ell, cone, loft, blend, limbR, quatTo } from './lib.js';

// Torso along points (tail end first, chest last), weighted Hips -> Spine -> Chest by z.
export function torso(B, { pts, rx, ry, color, zHips, zSpine, zChest, rings = 30, seg = 20 }) {
  const torsoW = (p) => blend([[zChest, 'Chest'], [zSpine, 'Spine'], [zHips, 'Hips']], p.z);
  const tRx = (t) => rx(t) * env(t), tRy = (t) => ry(t) * env(t);
  B.add(loft({ points: pts, rx: tRx, ry: tRy, rings, seg }), { color, weights: torsoW });
  const curve = new THREE.CatmullRomCurve3(pts.map(V));
  // point on the torso surface at curve t, angle th (0 = side, PI/2 = top), side x
  const surf = (t, th, x = 1, k = 1) => { const c = curve.getPoint(t); return { p: V([Math.cos(th) * tRx(t) * k * x, c.y + Math.sin(th) * tRy(t) * k, c.z]), n: V([Math.cos(th) * x, Math.sin(th), 0]) }; };
  return { torsoW, tRx, tRy, curve, surf };
}

export function neck(B, { pts, r, color, yChest, yNeck, yHead }) {
  const w = (p) => blend([[yChest, 'Chest'], [yNeck, 'Neck'], [yHead, 'Head']], p.y);
  B.add(loft({ points: pts, rx: (t) => r * env(0.15 + 0.7 * t) + 0.03, ry: (t) => r * 0.96 * env(0.15 + 0.7 * t) + 0.03, rings: 14, seg: 16 }), { color, weights: w });
  return w;
}

// Four legs from the bone positions. foot: 'paw' | 'hoof' | 'stub'.
export function legs(B, W, { front, back, color, footColor, clawColor, foot = 'paw', thighs = true }) {
  for (const [s, x] of SIDES) {
    for (const [kind, o] of [['Front', front], ['Back', back]]) {
      const U = V(W[`${kind}${s}Upper`]), L = V(W[`${kind}${s}Lower`]), P = V(W[`${kind}${s}Paw`]);
      const mid = (a, b, k = 0.5) => a.clone().lerp(b, k);
      const pts = [U.clone().add(V([0, o.top ?? 0.35, o.topZ ?? 0])), mid(U, L), L, mid(L, P), V([P.x, (o.ground ?? 0.14), P.z])];
      const w = (p) => blend([[P.y, `${kind}${s}Paw`], [P.y + 0.18, `${kind}${s}Lower`], [L.y - 0.12, `${kind}${s}Lower`], [L.y + 0.2, `${kind}${s}Upper`]], p.y);
      B.add(loft({ points: pts.map((v) => v.toArray()), rx: limbR(o.r[0], o.r[1]), ry: limbR(o.r[0] * 1.08, o.r[1] * 1.08), rings: 20, seg: 12 }), { color, weights: w });
      if (kind === 'Back' && thighs) B.add(ell(o.r[0] * 1.05, o.r[0] * 1.4, o.r[0] * 1.3), { pos: [U.x * 0.97, U.y - 0.15, U.z + 0.08], color, bone: `Back${s}Upper` });
      const pb = `${kind}${s}Paw`, fz = P.z, fx = P.x, fr = o.r[1];
      if (foot === 'paw') {
        B.add(ell(fr * 1.3, fr * 0.8, fr * 1.7), { pos: [fx, fr * 0.75, fz - fr * 0.45], color: footColor, bone: pb });
        for (const dx of [-0.55, 0, 0.55]) {
          B.add(ell(fr * 0.48, fr * 0.45, fr * 0.48, 8, 6), { pos: [fx + dx * fr, fr * 0.5, fz - fr * 1.55], color: footColor, bone: pb });
          if (clawColor) B.add(cone(fr * 0.16, fr * 0.6, 6), { pos: [fx + dx * fr, fr * 0.35, fz - fr * 2.05], quat: quatTo([0, -0.5, -1]), color: clawColor, bone: pb });
        }
      } else if (foot === 'hoof') {
        B.add(new THREE.CylinderGeometry(fr * 1.05, fr * 1.25, fr * 1.3, 10), { pos: [fx, fr * 0.6, fz], color: footColor, bone: pb });
        B.add(ell(fr * 1.35, fr * 0.5, fr * 1.35, 10, 6), { pos: [fx, fr * 1.35, fz], color: o.cuff || color, bone: pb });
      } else {
        B.add(ell(fr * 1.35, fr * 0.7, fr * 1.5), { pos: [fx, fr * 0.6, fz - fr * 0.3], color: footColor, bone: pb });
        if (clawColor) for (const dx of [-0.6, 0, 0.6]) B.add(cone(fr * 0.2, fr * 0.5, 6), { pos: [fx + dx * fr, fr * 0.35, fz - fr * 1.6], quat: quatTo([0, -0.4, -1]), color: clawColor, bone: pb });
      }
    }
  }
}

// Tail loft along pts with radius fn r(t); returns { curve, stops }.
export function tail(B, { pts, r, color, rings = 26, seg = 12 }) {
  const stops = [[0, 'Tail1'], [0.33, 'Tail2'], [0.66, 'Tail3'], [0.95, 'Tail4']];
  const g = loft({ points: pts, rx: r, ry: r, rings, seg }), T = g.userData.t;
  B.add(g, { color, weights: (p, i) => (T[i] < 0.06 ? blend([[0, 'Hips'], [0.06, 'Tail1']], T[i]) : blend(stops, T[i])) });
  return { curve: g.userData.curve, stops, w: (t) => blend(stops, t) };
}

export { V, SIDES, env, ell, cone, loft, blend, quatTo };
