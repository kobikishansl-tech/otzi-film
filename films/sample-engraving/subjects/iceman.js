// The Iceman (Ötzi), front view, standing with his copper axe and yew bow — an archaeology plate.
// Same contract as bee.js / scallop.js: buildIceman({ x, y, s }) → { ink, regions, focus, center, s }.
//   ink groups, in cutting order: 'ol0' (the figure's silhouette — the first line the burin cuts),
//   'ol' (interior lines: limbs, axe, bow, belt, face), 'h1' (first hatch), 'h2' (cross-hatch), 'h3' (fur, beard, deep darks).
//   regions: coat, legs, boots, axe, bow, head.   focus: axe, boots, bow (world points; the roundel magnifies the figure).
import * as B from '../engine/burin.js';
const { shape, ring, xf, clamp, ellipsePts, sphereTone, cylTone, hatch, outline, stroke, stipple, fur, RNG, noise2, addT } = B;
const L = { x: -0.55, y: -0.62, z: 0.56 }, LV = [L.x, L.y];

function capsule(a, b, w0, w1, n = 10, f = null) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, px = -uy, py = ux, pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, w = (w0 + (w1 - w0) * t) / 2, bulge = 1 + 0.10 * Math.sin(Math.PI * t); pts.push([a[0] + dx * t + px * w * bulge, a[1] + dy * t + py * w * bulge]); }
  for (let i = 0; i <= 8; i++) { const th = -Math.PI / 2 + Math.PI * i / 8; pts.push([b[0] + (ux * Math.cos(th) - px * Math.sin(th)) * w1 / 2 * 0.9, b[1] + (uy * Math.cos(th) - py * Math.sin(th)) * w1 / 2 * 0.9]); }
  for (let i = n; i >= 0; i--) { const t = i / n, w = (w0 + (w1 - w0) * t) / 2, bulge = 1 + 0.10 * Math.sin(Math.PI * t); pts.push([a[0] + dx * t - px * w * bulge, a[1] + dy * t - py * w * bulge]); }
  for (let i = 0; i <= 8; i++) { const th = Math.PI / 2 + Math.PI * i / 8; pts.push([a[0] + (ux * Math.cos(th) - px * Math.sin(th)) * w0 / 2 * 0.9, a[1] + (uy * Math.cos(th) - py * Math.sin(th)) * w0 / 2 * 0.9]); }
  const A = f ? f(a) : a, Bw = f ? f(b) : b;
  return { ...(f ? ring(pts.map(f)) : ring(pts)), a: A, b: Bw, ang: Math.atan2(dy, dx), len, w0, w1 };
}

export function buildIceman({ x = 960, y = 606, s = 1, seed = 21 } = {}) {
  const W = xf(x, y, s), P = p => W(p);
  const ink = new B.Ink(), lists = {}, add = (name, sh) => { (lists[name] ||= []).push(sh); };
  const S = v => v * s;

  // ---- shapes (local units; waist at (0,0), head up (−y), feet at +292) ----
  const head = ring(ellipsePts(0, -216, 40, 48, 0, 56).map(W));
  const beard = 'M-26 -196 C-30 -170 -22 -150 0 -144 C22 -150 30 -170 26 -196 C14 -186 -14 -186 -26 -196 Z';
  const coatPts = [];
  const hem = [];                                     // fur hem: zigzag along the bottom
  for (let i = 0; i <= 12; i++) hem.push([-96 + i * 16, 34 + (i % 2 ? -12 : 4)]);
  coatPts.push([-64, -158], [-88, -120], [-95, -20]);
  for (const [hx, hy] of hem) coatPts.push([hx, hy]);
  coatPts.push([95, -20], [88, -120], [64, -158]);
  for (let i = 0; i <= 8; i++) coatPts.push([64 - i * 16, -158 + (i % 2 ? 10 : 0) - 6 * Math.sin(i)]);
  const coat = ring(coatPts.map(W));
  const armR = [capsule([76, -138], [116, -72], 26, 20, 8, W), capsule([116, -72], [142, -12], 20, 16, 8, W)];
  const armL = [capsule([-76, -138], [-112, -78], 26, 20, 8, W), capsule([-112, -78], [-140, -18], 20, 16, 8, W)];
  const legR = [capsule([30, 26], [38, 150], 30, 24, 8, W), capsule([38, 150], [34, 258], 24, 20, 8, W)];
  const legL = [capsule([-30, 26], [-38, 150], 30, 24, 8, W), capsule([-38, 150], [-34, 258], 24, 20, 8, W)];
  const boot = sg => shape(`M${34 * sg} 252 C${52 * sg} 258 ${64 * sg} 272 ${58 * sg} 286 C${50 * sg} 296 ${20 * sg} 298 ${8 * sg} 292 C${-2 * sg} 286 ${-4 * sg} 268 ${2 * sg} 256 C${12 * sg} 248 ${24 * sg} 248 ${34 * sg} 252 Z`, W, 1.3);
  const boots = [boot(1), boot(-1)];
  const axeHandle = capsule([142, -12], [176, -98], 9, 7, 8, W);
  const axeHead = shape('M158 -96 L204 -132 L216 -108 L196 -78 L164 -80 Z', W, 1.3);
  const bowSh = shape('M-168 -112 C-196 -60 -196 10 -166 66 C-160 76 -150 74 -152 62 C-176 12 -176 -56 -152 -102 C-148 -112 -160 -120 -168 -112 Z', W, 1.2);
  const limbs = [...armR, ...armL, ...legR, ...legL];
  const limbPolys = limbs.flatMap(c => c.polys);

  // ---- ink ----
  // ol0: the silhouette the burin cuts first — coat, head, boots, bow
  ink.group('ol0');
  outline(ink, coat.polys[0], { w: 2.4, light: LV, vary: 0.9, seed, run: 170 });
  outline(ink, head.polys[0], { w: 2.2, light: LV, vary: 0.8, seed: seed + 1 });
  for (const b of boots) outline(ink, b.polys[0], { w: 2.0, light: LV, vary: 0.8, seed: seed + 2 });
  outline(ink, bowSh.polys[0], { w: 1.8, light: LV, vary: 0.8, seed: seed + 3 });

  // ol: interior lines — arms, legs (they emerge from the coat), axe, bow string, belt, face
  ink.group('ol');
  for (const c of [...armR, ...armL]) outline(ink, c.polys[0], { w: 1.5, light: LV, vary: 0.8, seed: seed + 4 });
  for (const c of [...legR, ...legL]) outline(ink, c.polys[0], { w: 1.6, light: LV, vary: 0.8, seed: seed + 5, excl: coat.polys });
  outline(ink, axeHandle.polys[0], { w: 1.4, light: LV, seed: seed + 6, excl: [...armR[1].polys] });
  outline(ink, axeHead.polys[0], { w: 1.6, light: LV, seed: seed + 7 });
  stroke(ink, [P([-166, -104]), P([-150, -20]), P([-164, 58])], 0.9, { taper: 8 });          // bow string
  stroke(ink, [P([-64, 2]), P([64, 2])], 2.2, { taper: 6 });                                  // belt
  stroke(ink, [P([-64, 16]), P([64, 16])], 1.2, { taper: 6 });
  stroke(ink, [P([26, 16]), P([22, 52]), P([52, 50]), P([50, 16])], 1.1, { taper: 4 });       // pouch
  stroke(ink, [P([-14, -252]), P([0, -244]), P([14, -252])], 1.0, { taper: 5 });              // hair parting
  stroke(ink, [P([-6, -214]), P([2, -210]), P([8, -216])], 0.8, { taper: 3 });                // nose
  stroke(ink, [P([-20, -196]), P([-24, -188])], 0.7, { taper: 3 }); stroke(ink, [P([20, -196]), P([24, -188])], 0.7, { taper: 3 });  // brows
  for (const sg of [1, -1]) stroke(ink, [P([18 * sg, -222]), P([26 * sg, -220]), P([24 * sg, -212])], 0.8, { taper: 3 });            // eyes

  // h1: first hatch — coat nap, limbs, head
  const coatTone = addT((px, py) => {
    const u = (px - x) / s;
    return clamp(0.42 + 0.30 * (u / 95) + 0.10 * (noise2(px / 34, py / 40, seed) - 0.5));
  }, 0.1, 0.12, (px, py) => 0.5 * Math.exp(-((py - y + 20 * s) ** 2) / (2 * (30 * s) ** 2)));   // darker under the belt line
  ink.group('h1');
  hatch(ink, coat.polys, { angle: 1.35, spacing: 4.6, tone: coatTone, thr: 0.18, wMax: 1.5, wMin: 0.2, seed: seed + 8, wobble: 0.3 });
  for (const [k, c] of limbs.entries()) {
    const r = Math.max(c.w0, c.w1) / 2, cm = [(c.a[0] + c.b[0]) / 2, (c.a[1] + c.b[1]) / 2];
    const tone = addT(cylTone(cm[0], cm[1], r * s * 1.05, c.ang, { L }), 0.05, 0.1);
    hatch(ink, c.polys, { angle: c.ang + Math.PI / 2 + 0.5, spacing: 3.4, tone, thr: 0.2, wMax: 1.2, wMin: 0.2, seed: seed + 10 + k, excl: coat.polys });
  }
  const headT = sphereTone(...P([0, -216]), 40 * s, 48 * s, { L, k: 1.1 });
  hatch(ink, head.polys, { angle: -0.7, spacing: 3.6, tone: headT, thr: 0.3, wMax: 1.1, wMin: 0.2, seed: seed + 20 });

  // h2: cross-hatch — coat shadow side, boots, axe head, bow wood
  ink.group('h2');
  hatch(ink, coat.polys, { angle: -0.35, spacing: 5.2, tone: coatTone, thr: 0.55, wMax: 1.1, wMin: 0.2, seed: seed + 22 });
  const bootT = (px, py) => clamp(0.5 + 0.2 * (noise2(px / 26, py / 26, seed + 30) - 0.5));
  for (const b of boots) hatch(ink, b.polys, { angle: 0.5, spacing: 3.2, tone: bootT, thr: 0.25, wMax: 1.2, wMin: 0.2, seed: seed + 31 });
  hatch(ink, axeHead.polys, { angle: 1.2, spacing: 3.0, tone: (px, py) => clamp(0.55 + 0.2 * (noise2(px / 20, py / 20, seed + 32) - 0.5)), thr: 0.3, wMax: 1.2, seed: seed + 33 });
  hatch(ink, bowSh.polys, { angle: 1.15, spacing: 3.4, tone: () => 0.45, thr: 0.3, wMax: 1.0, seed: seed + 34 });
  for (const c of [...legR, ...legL]) {
    const r = Math.max(c.w0, c.w1) / 2, cm = [(c.a[0] + c.b[0]) / 2, (c.a[1] + c.b[1]) / 2];
    const tone = addT(cylTone(cm[0], cm[1], r * s * 1.05, c.ang, { L }), 0.15, 0.1);
    hatch(ink, c.polys, { angle: c.ang - 0.4, spacing: 3.8, tone, thr: 0.5, wMax: 1.0, wMin: 0.2, seed: seed + 35, excl: coat.polys });
  }

  // h3: fur on the hem and shoulders, the beard, deep darks, stipple
  ink.group('h3');
  fur(ink, coat.polys, { density: 0.02, len: 13, dir: () => [0, 1], w: 0.9, seed: seed + 40, tone: () => 0.75, rimOut: 1 });
  stipple(ink, coat.polys, { density: 0.008, tone: () => 0.7, r: 0.5, seed: seed + 41 });
  const bd = shape(beard, W, 1.2);
  for (let i = 0; i < 40; i++) {                                                   // beard strokes
    const R = RNG(seed + 42), u = R(), px = -22 + 44 * u, py = -192 + (R() * 34);
    stroke(ink, [P([px, py]), P([px + (R() - .5) * 6, py + 16 + R() * 10])], 0.7, { taper: 4 });
  }
  hatch(ink, bd.polys, { angle: 1.45, spacing: 2.6, tone: () => 0.8, thr: 0.4, wMax: 1.0, seed: seed + 43 });
  hatch(ink, axeHead.polys, { angle: -0.8, spacing: 3.6, tone: () => 0.85, thr: 0.6, wMax: 1.0, seed: seed + 44 });

  // ---- regions for the colourist ----
  add('coat', coat); add('head', head); add('beard', bd);
  for (const c of legR) add('legs', c); for (const c of legL) add('legs', c);
  for (const b of boots) add('boots', b);
  add('axe', axeHead); add('axe', axeHandle); add('bow', bowSh);
  const mk = list => { const p = new Path2D(); for (const sh of list) p.addPath(sh.path); return { path: p, polys: list.flatMap(sh => sh.polys), bbox: B.bboxOf(list.flatMap(sh => sh.polys)) }; };
  const regions = Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, mk(v)]));

  // ---- focus points for the magnified details ----
  const focus = {
    axe: { x: P([190, -108])[0], y: P([190, -108])[1], r: 42 * s },
    boots: { x: P([36, 272])[0], y: P([36, 272])[1], r: 40 * s },
    bow: { x: P([-172, -20])[0], y: P([-172, -20])[1], r: 42 * s },
  };
  return { ink, regions, focus, center: [x, y], s };
}
