// World builders: slopes/ridges, tent (4 states), cedar, map of the northern Urals, case file, stamps, theory pieces, plaque, scissors
import { PAL, piece, P, trace, fill, cut, cutLine, cutTaper, inset, within, curve, ellipsePoly, Pl, rnd } from './paper.js';
import { sawRow, sawEdge, crescent, crescentPts, swirl, taper, strands, dots, along } from './motifs.js';
import { textPiece } from './hud.js';

// ---------- palette (Dyatlov, ground family = indigo night / rice day; heroes = red) ----------
export const DPAL = {
  sky: '#0f142a', far: '#1f2a55', near: '#29356e', snowA: '#7a88ba', snowB: '#8fa0cc', trees: '#28346c',
  hike: '#b8191b', hikeN: '#c4162c', hikeF: '#8a0c20', tent: '#d2201f',
  rice: '#f2e8d0', hillFar: '#e0877f', hillMid: '#cf4f4a', ink: '#3a2a1c', gold: '#d9a93f',
  cold: '#cdd7ff', stamp: '#b3271e',
};

// ---------- slopes ----------
// ridge silhouette with sawtooth top edge; box [0,-h,w,40], pivot at top-left of the baseline
export function ridge(w, h, col, seed = 3, teeth = 16) {
  const key = 'r' + w + h + col + seed; if (world.K[key]) return world.K[key];
  return world.K[key] = piece([-30, -h - 40, w + 30, 60], g => {
    const top = []; const n = teeth * 2;
    for (let i = 0; i <= n; i++) top.push([i / n * w, -h * (i % 2 ? .82 + .3 * rnd(i, seed) : 1)]);
    const out = sawEdge(curve(top, false, 6), 16, 26, -1, .5, seed).concat([[w + 24, 40], [-24, 40]]);
    fill(g, q => trace(q, Pl(out, true, .5, seed + 1)), col);
    inset(g, Pl(out, true, .5, seed + 1), 4, 2, col);
    // sparse carved wind-lines on the face
    for (let k = 0; k < 6; k++) taper(g, [[w * .1 + rnd(k, seed + 2) * w * .7, -h * .3 - rnd(k, seed + 3) * h * .5], [w * .2 + rnd(k, seed + 4) * w * .7, -h * .32 - rnd(k, seed + 5) * h * .5]], 3);
  }, { seed, col });
}
// smooth snow slope (pale), pivot baseline top-left
export function slope(w, h, col, seed = 7) {
  const key = 's' + w + h + col + seed; if (world.K[key]) return world.K[key];
  return world.K[key] = piece([-30, -h - 40, w + 30, 60], g => {
    const out = curve([[0, -h], [w * .3, -h * .86], [w * .62, -h * .6], [w, -h * .18], [w, 40], [0, 40]], true, 6);
    fill(g, q => trace(q, P(out, true, .5, seed)), col);
    inset(g, P(out, true, .5, seed), 4, 2, col);
    for (let k = 0; k < 5; k++) taper(g, curve([[w * .15, -h * (.25 + .12 * k)], [w * .55, -h * (.2 + .12 * k)], [w * .9, -h * (.1 + .1 * k)]], false, 3), 3);
  }, { seed, col });
}

// ---------- tent ----------
// kind: 'up' intact | 'cut' jagged tear | 'snowed' sagging under snow | 'dead' squashed flat
// pivot = centre of the base; A-frame seen from the side, facing right. w ~ 560, h ~ 330
export function tent(kind, col = DPAL.tent, seed = 11) {
  const key = 'T' + kind + col + seed; if (world.K[key]) return world.K[key];
  return world.K[key] = piece([-330, -400, 330, 40], g => {
    if (kind === 'dead') {   // pressed flat by the slab
      const out = Pl([[-300, 10], [-260, -70], [-140, -110], [60, -112], [240, -80], [300, 10]], true, .5, seed);
      fill(g, q => trace(q, out), col);
      inset(g, out, 4, 2, col);
      cutLine(g, 5, q => { q.moveTo(-200, -60); q.lineTo(180, -66); });
      return;
    }
    const sag = kind === 'snowed' ? 26 : 0;
    const A = [[-290, 8], [-150, -250 + sag], [130, -256 + sag], [290, 8]];
    const out = Pl(A, true, .5, seed);
    fill(g, q => trace(q, out), col);
    inset(g, out, 4, 2, col);
    // ridge pole line + canvas folds
    cutLine(g, 3.4, q => { q.moveTo(-150, -250 + sag); q.lineTo(130, -256 + sag); });
    taper(g, [[-190, -180], [-150, -60], [-170, 0]], 3);
    taper(g, [[120, -190], [90, -70], [110, 0]], 3);
    // guy lines (cut thin slits + tiny pegs left as paper)
    for (const [x0, y0, x1] of [[-150, -240, -360], [130, -246, 350]]) cutLine(g, 2.6, q => { q.moveTo(x0, y0); q.lineTo(x1, 6); });
    // door seam
    cutLine(g, 3, q => { q.moveTo(-40, -250 + sag); q.lineTo(-20, 6); });
    if (kind === 'cut') {   // the jagged tear, cut from inside: big irregular opening on the right slope
      const tear = P([[-10, -180], [30, -150], [10, -120], [60, -90], [26, -58], [70, -30], [30, 6], [-30, 6], [-20, -60], [-40, -110], [-24, -150]], true, .4, seed + 1);
      cut(g, q => trace(q, tear));
      // torn flaps still attached at the edges
      fill(g, q => trace(q, P([[-10, -180], [-2, -140], [-24, -150]], true, .3, seed + 2)), col);
      fill(g, q => trace(q, P([[70, -30], [52, -8], [30, 6]], true, .3, seed + 3)), col);
    }
    if (kind === 'snowed') {   // pale slab layer sagging over the ridge
      const sn = P([[-250, -30], [-180, -210], [-60, -262], [90, -258], [210, -170], [262, -30], [180, -70], [60, -92], [-80, -88], [-190, -66]], true, .5, seed + 4);
      fill(g, q => trace(q, sn), DPAL.snowA);
      inset(g, sn, 3.4, 1.8, DPAL.snowA);
    }
  }, { seed, col });
}

// ---------- cedar ----------
// stubs: number of broken branch stubs visible (they appear over time in S9)
export function cedar(stubs = 0, col = DPAL.trees, seed = 17) {
  const key = 'C' + stubs + col + seed; if (world.K[key]) return world.K[key];
  return world.K[key] = piece([-420, -1050, 420, 40], g => {
    const trunk = P([[-46, 20], [-30, -300], [-40, -620], [-22, -880], [0, -980], [26, -860], [36, -560], [28, -280], [44, 20]], true, .5, seed);
    fill(g, q => trace(q, trunk), col);
    // canopy: jagged tiers connected to the trunk
    for (const [y, w2] of [[-880, 200], [-740, 280], [-590, 350], [-430, 400], [-280, 340]]) {
      const tier = P([[0, y - 130], [w2 * .5, y - 40], [w2, y + 40], [w2 * .4, y + 26], [-w2 * .4, y + 30], [-w2, y + 44], [-w2 * .5, y - 36]], true, .5, seed + y);
      fill(g, q => trace(q, tier), col);
    }
    inset(g, trunk, 4, 2, col);
    // snow loads on the canopy tiers (keep the tree readable against the night sky)
    for (const [y, w2] of [[-880, 200], [-740, 280], [-590, 350], [-430, 400], [-280, 340]])
      for (const k of [-1, 0, 1])
        fill(g, q => trace(q, P([[k * w2 * .34 - 44, y - 44], [k * w2 * .34, y - 62], [k * w2 * .34 + 48, y - 46], [k * w2 * .34 + 20, y - 30], [k * w2 * .34 - 24, y - 30]], true, .4, seed + k + y)), DPAL.snowA);
    // roots flare (join the figure to the ground: no floating islands)
    fill(g, q => trace(q, P([[-46, 20], [-120, 26], [-150, 34], [-46, 34]], true, .4, seed + 1)), col);
    fill(g, q => trace(q, P([[44, 20], [130, 24], [150, 34], [44, 34]], true, .4, seed + 2)), col);
    // broken branch stubs (the climbers snapped them up to ~5 m)
    for (let i = 0; i < stubs; i++) {
      const y = -380 - i * 105, d = i % 2 ? 1 : -1;
      fill(g, q => trace(q, P([[d * 30, y], [d * (95 + rnd(i, seed + 3) * 40), y - 14], [d * (92 + rnd(i, seed + 4) * 40), y + 6], [d * 32, y + 14]], true, .4, seed + 5 + i)), col);
      crescent(g, d * 34, y + 2, 8, d > 0 ? -.6 : Math.PI - .6, d > 0 ? .6 : Math.PI + .6, 3);
    }
  }, { seed, col });
}

// ---------- map of the northern Urals ----------
// route: Sverdlovsk -> Ivdel -> Vizhay -> Auspiya valley -> pass; u = draw progress 0..1
export function mapSheet(seed = 23) {
  const key = 'M' + seed; if (world.K[key]) return world.K[key];
  const ROUTE = [[120, 950], [300, 800], [430, 660], [560, 560], [700, 470], [860, 380], [1010, 300], [1180, 240], [1330, 190]];
  return world.K[key] = {
    route: ROUTE,
    sheet: piece([-40, -40, 1540, 1120], g => {
      const out = Pl([[0, 0], [1500, 0], [1500, 1080], [0, 1080]], true, .8, seed);
      fill(g, q => trace(q, out), DPAL.rice);
      // far hills as pale paper shapes
      fill(g, q => trace(q, P([[80, 420], [260, 300], [420, 380], [560, 260], [760, 330], [920, 220], [1120, 290], [1300, 200], [1440, 260], [1440, 140], [80, 140]], true, .6, seed + 1)), DPAL.hillFar);
      fill(g, q => trace(q, P([[200, 560], [400, 470], [620, 540], [840, 430], [1060, 500], [1280, 400], [1440, 460], [1440, 340], [200, 340]], true, .6, seed + 2)), DPAL.hillMid);
      // the pass marker (peak sign, cut)
      const px = ROUTE[8][0], py = ROUTE[8][1] - 60;
      fill(g, q => trace(q, Pl([[px - 34, py + 30], [px, py - 40], [px + 34, py + 30]], true, .4, seed + 3)), DPAL.ink);
      cutLine(g, 3, q => { q.moveTo(px - 18, py + 8); q.lineTo(px + 18, py + 8); });
    }, { seed, col: DPAL.rice }),
  };
}
export function mapLabel(s, size = 40) { return textPiece(s, size, 700, DPAL.ink, 'Fraunces', 5, 2); }
export function mapRouteDrawn(g, u, C) {   // draw the route line up to progress u (call inside map transform)
  const R = mapSheet().route, L = [0];
  for (let i = 1; i < R.length; i++) L.push(L[i - 1] + Math.hypot(R[i][0] - R[i - 1][0], R[i][1] - R[i - 1][1]));
  const tot = L[L.length - 1] * Math.min(1, Math.max(0, u));
  g.save(); g.strokeStyle = DPAL.ink; g.lineWidth = 7; g.lineCap = 'round'; g.setLineDash([26, 18]);
  g.beginPath(); g.moveTo(R[0][0], R[0][1]);
  for (let i = 1; i < R.length; i++) { if (L[i] <= tot) g.lineTo(R[i][0], R[i][1]); else { const f = (tot - L[i - 1]) / (L[i] - L[i - 1] || 1); g.lineTo(R[i - 1][0] + (R[i][0] - R[i - 1][0]) * f, R[i - 1][1] + (R[i][1] - R[i - 1][1]) * f); break; } }
  g.stroke(); g.restore();
}
export const MAP_STOPS = [[0, 'SVERDLOVSK'], [2, 'IVDEL'], [3, 'VIZHAY'], [6, 'AUSPIYA'], [8, 'KHOLAT SYAKHL']];

// ---------- date stamps (red ink, slightly rotated) ----------
export function stampPiece(s, seed = 3) {
  const key = 'ST' + s + seed; if (world.K[key]) return world.K[key];
  const tp = textPiece(s, 44, 800, DPAL.stamp, 'Fraunces', seed, 3);
  return world.K[key] = { tp, w: tp.w + 56, h: tp.h + 26 };
}
export function drawStamp(g, M, s, seed = 3, alpha = 1) {
  const st = stampPiece(s, seed);
  g.save(); g.setTransform(...M); g.globalAlpha = alpha;
  g.strokeStyle = DPAL.stamp; g.lineWidth = 5; g.strokeRect(0, 0, st.w, st.h);
  g.globalAlpha = alpha * .16; g.fillStyle = DPAL.stamp; g.fillRect(0, 0, st.w, st.h); g.globalAlpha = alpha;
  g.drawImage(st.tp.c, 28, 10, st.tp.w, st.tp.h);
  g.restore();
}

// ---------- case file ----------
export function fileSheet(seed = 29) {
  const key = 'F' + seed; if (world.K[key]) return world.K[key];
  return world.K[key] = piece([-40, -40, 1640, 940], g => {
    const out = Pl([[0, 0], [1600, 0], [1600, 900], [0, 900]], true, .8, seed);
    fill(g, q => trace(q, out), DPAL.rice);
    inset(g, out, 5, 2.4, DPAL.rice);
    // typed lines (ink) + a small photo of the tent (paper sketch)
    for (let k = 0; k < 7; k++) cutLine(g, 4, q => { q.moveTo(90, 130 + k * 44); q.lineTo(90 + (300 + rnd(k, seed) * 380), 130 + k * 44); });
    fill(g, q => trace(q, Pl([[1150, 110], [1500, 110], [1500, 340], [1150, 340]], true, .5, seed + 1)), DPAL.snowB);
    fill(g, q => trace(q, Pl([[1230, 250], [1300, 170], [1380, 168], [1440, 250]], true, .4, seed + 2)), DPAL.tent);
    cutLine(g, 3, q => { q.moveTo(1150, 340); q.lineTo(1500, 340); });
    // nine small figure marks (the group photo row)
    for (let k = 0; k < 9; k++) { const x = 180 + k * 60; fill(g, q => { q.arc(x, 560, 16, 0, 7); q.moveTo(x - 12, 640); q.lineTo(x - 14, 580); q.lineTo(x + 14, 580); q.lineTo(x + 12, 640); q.closePath(); }, DPAL.hike); }
  }, { seed, col: DPAL.rice });
}

// ---------- theory pieces (pop up, then snipped away) ----------
export function theoryPiece(kind, seed = 31) {
  const key = 'TH' + kind + seed; if (world.K[key]) return world.K[key];
  const col = DPAL.hikeF;
  return world.K[key] = piece([-260, -260, 260, 260], g => {
    if (kind === 'rocket') {
      fill(g, q => trace(q, P([[-60, 200], [-60, -80], [0, -200], [60, -80], [60, 200]], true, .4, seed)), col);
      fill(g, q => trace(q, P([[-60, 60], [-160, 200], [-60, 200]], true, .4, seed + 1)), col);
      fill(g, q => trace(q, P([[60, 60], [160, 200], [60, 200]], true, .4, seed + 2)), col);
      cut(g, q => q.arc(0, -60, 26, 0, 7));
      inset(g, P([[-60, 200], [-60, -80], [0, -200], [60, -80], [60, 200]], true, .4, seed), 4, 2, col);
    } else if (kind === 'ball') {
      fill(g, q => q.arc(0, 0, 170, 0, 7), col);
      for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 + .3; cutTaper(g, [[Math.cos(a) * 170, Math.sin(a) * 170], [Math.cos(a) * 230, Math.sin(a) * 230]], 8); }
      cut(g, q => q.arc(0, 0, 60, 0, 7));
    } else if (kind === 'hunter') {
      fill(g, q => trace(q, P([[-70, 220], [-70, 60], [-40, -20], [-40, -120], [0, -190], [46, -120], [46, -16], [76, 40], [76, 220]], true, .5, seed)), col);
      cut(g, q => q.arc(-6, -150, 16, 0, 7));
      fill(g, q => trace(q, P([[40, -100], [180, -190], [184, -180], [46, -86]], true, .3, seed + 1)), col);
    } else {   // 'ring' infrasound
      const n = 60, o = [], inn = [];
      for (let i = 0; i <= n; i++) { const a = i / n * 6.283, r = 190 + Math.sin(a * 3 + seed) * 16; o.push([Math.cos(a) * r, Math.sin(a) * r]); inn.push([Math.cos(a) * (r - 46), Math.sin(a) * (r - 46)]); }
      fill(g, q => { trace(q, o); trace(q, inn.reverse()); }, col, 'evenodd');
      cut(g, q => { for (let k = 0; k < 3; k++) { const a = -1.2 + k * .8; q.moveTo(Math.cos(a) * 144, Math.sin(a) * 144); q.arc(Math.cos(a) * 144, Math.sin(a) * 144, 12, 0, 7); } });
    }
  }, { seed, col });
}

// ---------- memorial plaque + gold sun ----------
export function plaque(seed = 37) {
  const key = 'PL' + seed; if (world.K[key]) return world.K[key];
  return world.K[key] = piece([-110, -150, 110, 30], g => {
    const out = Pl([[-90, 20], [-90, -120], [90, -120], [90, 20]], true, .4, seed);
    fill(g, q => trace(q, out), '#6b5a3e');
    inset(g, out, 3.4, 1.8, '#6b5a3e');
    cutLine(g, 3, q => { q.moveTo(-60, -90); q.lineTo(60, -90); });
    cutLine(g, 2.6, q => { q.moveTo(-60, -60); q.lineTo(44, -60); });
    cutLine(g, 2.6, q => { q.moveTo(-60, -34); q.lineTo(52, -34); });
  }, { seed, col: '#6b5a3e' });
}
export function goldSun(r = 120, seed = 41) {
  const key = 'GS' + r + seed; if (world.K[key]) return world.K[key];
  return world.K[key] = piece([-r - 40, -r - 40, r + 40, r + 40], g => {
    fill(g, q => q.arc(0, 0, r, 0, 7), PAL.gold);
    for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; cutTaper(g, [[Math.cos(a) * (r + 6), Math.sin(a) * (r + 6)], [Math.cos(a) * (r + 30), Math.sin(a) * (r + 30)]], 7); }
    swirl(g, 0, 0, r * .55, 1.6, 4, .5, 1);
  }, { seed, col: PAL.gold });
}

// ---------- scissors (paper-cut style, two blades + bows) ----------
export function scissorsPiece(seed = 43) {
  const key = 'SC' + seed; if (world.K[key]) return world.K[key];
  return world.K[key] = piece([-30, -60, 330, 90], g => {
    for (const k of [-1, 1]) {
      const blade = Pl([[0, k * 4], [240, k * 1], [244, 0], [0, k * 9]], true, .3, seed + k);
      fill(g, q => trace(q, blade), '#7e8894');
      fill(g, q => { q.ellipse(-52, k * 26, 34, 20, .3 * k, 0, 7); q.ellipse(-52, k * 26, 22, 11, .3 * k, 0, 7, true); }, '#3c424c', 'evenodd');
      fill(g, q => { q.rect(-46, k * 8 - 3, 44, 6); }, '#3c424c');
    }
    fill(g, q => q.arc(0, 0, 6, 0, 7), '#c9ccd0');
  }, { seed, col: '#7e8894' });
}

const world = { K: {} };
export function clearWorld() { for (const k of Object.keys(world.K)) delete world.K[k]; }
