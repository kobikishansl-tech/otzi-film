// Hikers: jointed red-paper cut-out figures (adult ski hikers, profile facing right).
// Units: 1 = 1/424 of figure height; origin = pelvis; y points down; figure stands on y = +150.
// pieces: head (4 hat variants), torso, upper+fore arm x2, thigh+shin x2 (boot/sock variants), pack, pole, ski
import { piece, P, trace, fill, cut, cutLine, cutTaper, inset, within, ellipsePoly, curve, Pl } from './paper.js';
import { sawRow, sawEdge, crescent, crescentPts, swirl, taper, strands, dots } from './motifs.js';
import { mul, T, R, S, put, solveRig, ap } from './rig.js';

const G = {};   // piece cache
const darken = (col, k = .78) => {
  const n = parseInt(col.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return '#' + [r * k | 0, g * k | 0, b * k | 0].map(v => v.toString(16).padStart(2, '0')).join('');
};

// ---------- head (pivot = neck at 0,0; head above) ----------
function headPiece(hat, col, seed) {
  const key = 'h' + hat + col + seed; if (G[key]) return G[key];
  const far = darken(col);
  return G[key] = piece([-70, -130, 70, 18], g => {
    const out = P([[-8, 14], [-26, 8], [-38, -6], [-44, -26], [-42, -50], [-30, -70], [-8, -80], [16, -78], [34, -64], [42, -44], [40, -22], [30, -4], [12, 12]], true, .3, seed);
    fill(g, q => trace(q, out), col);
    inset(g, out, 3.2, 1.5, col);
    // eye + nose (carved)
    crescent(g, 22, -44, 7, Math.PI * 1.05, Math.PI * 1.95, 3.4);
    taper(g, [[40, -34], [47, -30], [42, -24]], 2.6);
    taper(g, [[34, -18], [30, -12], [33, -6]], 2.4);
    // hats
    if (hat === 'hood') {
      const h = P([[-46, -40], [-52, -66], [-40, -92], [-12, -104], [20, -100], [40, -80], [44, -56], [30, -70], [4, -78], [-20, -72], [-34, -56]], true, .3, seed + 1);
      fill(g, q => trace(q, h), far);
      taper(g, [[-40, -60], [-24, -70], [-2, -74]], 2.6);
    } else if (hat === 'cap') {
      fill(g, q => trace(q, P([[-40, -58], [-20, -76], [8, -82], [34, -72], [42, -56], [10, -62]], true, .3, seed + 1)), far);
      fill(g, q => trace(q, Pl([[36, -58], [66, -50], [64, -42], [34, -48]], true, .25, seed + 2)), far);
      dots(g, [[0, -68]], 2.4);
    } else if (hat === 'beanie') {
      fill(g, q => trace(q, P([[-40, -56], [-30, -80], [-4, -92], [24, -86], [40, -62], [12, -68]], true, .3, seed + 1)), far);
      cutLine(g, 2.6, q => { q.moveTo(-32, -64); q.lineTo(36, -60); });
      fill(g, q => q.arc(2, -94, 7, 0, 7), far);
    } else {   // bare
      strands(g, curve([[-30, -66], [-14, -76], [6, -78]], false, 2), 3, 4.5, 2.4, .1, .9);
    }
  }, { seed, col });
}

// ---------- torso (pivot = pelvis at 0,0; shoulders at -150) ----------
function torsoPiece(col, seed, pack) {
  const key = 't' + col + seed + (pack ? 1 : 0); if (G[key]) return G[key];
  return G[key] = piece([-95, -165, 70, 16], g => {
    const out = P([[-30, 12], [-40, -30], [-38, -80], [-28, -128], [-6, -150], [22, -144], [38, -118], [42, -70], [34, -24], [24, 12]], true, .3, seed);
    fill(g, q => trace(q, out), col);
    inset(g, out, 3.4, 1.5, col);
    // anorak folds + belt
    taper(g, [[-18, -120], [-8, -80], [-14, -40]], 2.8);
    taper(g, [[24, -110], [16, -70], [22, -34]], 2.8);
    cutLine(g, 3.4, q => { q.moveTo(-36, -18); q.lineTo(32, -18); });
    if (pack) {   // rucksack on the back (left = behind when facing right)
      const pk = Pl([[-92, -128], [-64, -140], [-52, -70], [-62, -22], [-88, -30]], true, .4, seed + 3);
      fill(g, q => trace(q, pk), darken(col, .62));
      cutLine(g, 2.6, q => { q.moveTo(-78, -128); q.lineTo(-70, -30); });
      sawRow(g, curve([[-90, -120], [-70, -124], [-56, -118]], false, 2), 7, 6, -1, .72);
    }
  }, { seed, col });
}

// ---------- limbs ----------
function limbPiece(w, len, col, seed, end) {   // pivot at top joint; extends down to len
  const key = 'l' + w + len + col + seed + (end || ''); if (G[key]) return G[key];
  return G[key] = piece([-w - 14, -14, w + 14, len + 30], g => {
    const out = P([[-w, 0], [-w + 2, len * .5], [-w + 4, len], [w - 4, len], [w - 2, len * .5], [w, 0]], true, .3, seed);
    fill(g, q => trace(q, out), col);
    inset(g, out, 2.8, 1.4, col);
    if (end === 'boot') {   // ski boot: blocky, lighter sole
      fill(g, q => trace(q, Pl([[-w - 6, len - 22], [w + 8, len - 24], [w + 10, len + 8], [-w - 8, len + 8]], true, .3, seed + 1)), darken(col, .6));
      cutLine(g, 2.6, q => { q.moveTo(-w - 2, len - 8); q.lineTo(w + 4, len - 8); });
    } else if (end === 'sock') {   // wool sock foot
      fill(g, q => trace(q, P([[-w + 1, len - 14], [-w + 3, len + 2], [16, len + 2], [14, len - 16]], true, .3, seed + 1)), darken(col, .85));
    } else if (end === 'mitten') {
      fill(g, q => q.arc(0, len - 8, w + 3, 0, 7), darken(col, .85));
    }
  }, { seed, col });
}

// ---------- props ----------
function polePiece(col, seed) {
  const key = 'p' + col + seed; if (G[key]) return G[key];
  return G[key] = piece([-6, -10, 6, 200], g => {
    fill(g, q => { q.moveTo(-2.6, 0); q.lineTo(2.6, 0); q.lineTo(2, 190); q.lineTo(-2, 190); q.closePath(); }, darken(col, .5));
    fill(g, q => { q.moveTo(-8, 190); q.lineTo(8, 190); q.lineTo(0, 202); q.closePath(); }, darken(col, .5));
  }, { seed, col });
}
function skiPiece(col, seed) {
  const key = 's' + col + seed; if (G[key]) return G[key];
  return G[key] = piece([-14, -8, 226, 14], g => {
    fill(g, q => trace(q, P([[-10, -4], [200, -6], [222, 2], [200, 6], [-10, 4]], true, .3, seed)), darken(col, .45));
  }, { seed, col });
}

// ---------- rig ----------
// parts (name, parent, joint in parent coords, piece factory args, z drawn externally)
const LIMB = 84, SHIN = 88, UPPER = 78, FORE = 66;
export function hikerParts() {
  return [
    { name: 'torso', parent: null, at: [0, 0], ang: 'torso', a0: 0 },
    { name: 'head', parent: 'torso', at: [4, -148], ang: 'head' },
    { name: 'aUf', parent: 'torso', at: [30, -134], ang: 'aUf' },
    { name: 'aLf', parent: 'aUf', at: [0, UPPER], ang: 'aLf' },
    { name: 'aUb', parent: 'torso', at: [-26, -134], ang: 'aUb' },
    { name: 'aLb', parent: 'aUb', at: [0, UPPER], ang: 'aLb' },
    { name: 'tN', parent: null, at: [14, 4], ang: 'tN' },
    { name: 'sN', parent: 'tN', at: [0, LIMB], ang: 'sN' },
    { name: 'tF', parent: null, at: [-12, 4], ang: 'tF' },
    { name: 'sF', parent: 'tF', at: [0, LIMB], ang: 'sF' },
  ];
}

// poses (radians; 0 = limb pointing straight down)
export const POSE = {
  stand: { torso: .04, head: -.04, aUf: .18, aLf: .12, aUb: -.14, aLb: .1, tN: .03, sN: -.02, tF: -.05, sF: .04 },
  walk: ph => ({
    torso: .1, head: -.1,
    aUf: -.55 * Math.sin(ph) + .1, aLf: .5 + .35 * Math.max(0, Math.sin(ph)),
    aUb: .55 * Math.sin(ph) - .1, aLb: .5 + .35 * Math.max(0, -Math.sin(ph)),
    tN: .5 * Math.sin(ph), sN: -.35 - .45 * Math.max(0, -Math.sin(ph)),
    tF: -.5 * Math.sin(ph), sF: -.35 - .45 * Math.max(0, Math.sin(ph)),
  }),
  dig: { torso: .55, head: -.35, aUf: 1.15, aLf: .35, aUb: 1.05, aLb: .4, tN: .3, sN: -.5, tF: -.25, sF: .3 },
  climb: ph => ({
    torso: -.12, head: .1,
    aUf: -2.4 + .5 * Math.sin(ph), aLf: -.5, aUb: -2.4 - .5 * Math.sin(ph), aLb: -.5,
    tN: .45 * Math.sin(ph), sN: -.6 - .3 * Math.max(0, -Math.sin(ph)), tF: -.45 * Math.sin(ph), sF: -.6 - .3 * Math.max(0, Math.sin(ph)),
  }),
  lie: { torso: 0, head: .12, aUf: .35, aLf: .2, aUb: -.3, aLb: .25, tN: .12, sN: .06, tF: -.08, sF: .1 },
  sit: { torso: .3, head: -.2, aUf: .5, aLf: .8, aUb: -.4, aLb: .9, tN: 1.45, sN: -1.35, tF: 1.3, sF: -1.25 },
};

// draw one hiker. o = {x, y, scale, pose, phase, col, seed, hat, pack, pole, ski, boot, endN/endF, flip, alpha, shadow}
export function drawHiker(g, root, o) {
  const col = o.col || '#b8191b', far = o.farCol || darken(col), seed = o.seed || 1;
  const pose = typeof o.pose === 'function' ? o.pose(o.phase || 0) : { ...POSE.stand, ...(o.pose || {}) };
  const parts = hikerParts();
  const pc = {
    torso: torsoPiece(col, seed, o.pack), head: headPiece(o.hat || 'cap', col, seed),
    aUf: limbPiece(13, UPPER, col, seed + 1, 'mitten'), aLf: limbPiece(11, FORE, col, seed + 2, 'mitten'),
    aUb: limbPiece(13, UPPER, far, seed + 3, 'mitten'), aLb: limbPiece(11, FORE, far, seed + 4, 'mitten'),
    tN: limbPiece(17, LIMB, col, seed + 5), sN: limbPiece(14, SHIN, col, seed + 6, o.endN || 'boot'),
    tF: limbPiece(17, LIMB, far, seed + 7), sF: limbPiece(14, SHIN, far, seed + 8, o.endF || 'boot'),
  };
  const k = o.scale || 1;
  let base = mul(root, mul(T(o.x, o.y), mul(R(o.rot || 0), S(o.flip ? -k : k, k))));
  const Ms = solveRig(parts, base, pose);
  const sh = o.shadow ?? 1, al = o.alpha ?? 1;
  const P0 = { shadow: sh, alpha: al, shadowScale: .55 };
  put(g, pc.aUb, Ms.aUb, P0); put(g, pc.aLb, Ms.aLb, P0);
  put(g, pc.tF, Ms.tF, P0); put(g, pc.sF, Ms.sF, P0);
  if (o.ski) put(g, skiPiece(col, seed), mul(Ms.sF, T(-6, SHIN + 4)), P0);
  put(g, pc.tN, Ms.tN, P0); put(g, pc.sN, Ms.sN, P0);
  put(g, pc.torso, Ms.torso, P0);
  put(g, pc.head, Ms.head, P0);
  put(g, pc.aUf, Ms.aUf, P0); put(g, pc.aLf, Ms.aLf, P0);
  if (o.pole) put(g, polePiece(col, seed), mul(Ms.aLf, T(0, FORE - 6)), { ...P0, shadow: sh * .8 });
  return Ms;
}

// ---------- far silhouette (one-piece walker for wide shots) ----------
export function silhouettePiece(col, seed = 5) {
  const key = 'sil' + col + seed; if (G[key]) return G[key];
  return G[key] = piece([-60, -440, 80, 20], g => {
    const out = P([[-16, 10], [-24, -60], [-30, -140], [-22, -230], [-26, -300], [-10, -352], [14, -358], [30, -310], [26, -240], [32, -160], [24, -70], [18, 10]], true, .4, seed);
    fill(g, q => trace(q, out), col);
    // head + legs + pack as one connected silhouette (no floating islands)
    fill(g, q => q.arc(2, -382, 30, 0, 7), col);
    fill(g, q => trace(q, P([[-16, 6], [-8, -66], [10, -70], [16, 6]], true, .4, seed + 1)), col);
    fill(g, q => trace(q, P([[-42, -300], [-58, -240], [-48, -180], [-30, -220], [-34, -290]], true, .4, seed + 2)), col);
    cutLine(g, 5, q => { q.moveTo(-30, -340); q.lineTo(28, -346); });
  }, { seed, col });
}

// ---------- chain of nine (one folded strip, one cut -> nine joined figures) ----------
// opt: {col, seed, gap: index of a missing figure (0..8) or -1, arms: 'down'|'up'}
export function chainPiece(opt = {}) {
  const col = opt.col || '#b8191b', seed = opt.seed || 9, gap = opt.gap ?? -1;
  const key = 'ch' + col + seed + gap + (opt.arms || ''); if (G[key]) return G[key];
  const W = 9 * 150, H = 420;
  return G[key] = piece([-20, -H - 20, W + 20, 20], g => {
    for (let i = 0; i < 9; i++) {
      if (i === gap) continue;
      const x = i * 150 + 75, up = opt.arms === 'up';
      // body: skirt-like trapezoid joined to neighbours at the arms
      const body = P([[x - 34, -6], [x - 40, -120], [x - 22, -250], [x, -290], [x + 22, -250], [x + 40, -120], [x + 34, -6]], true, .4, seed + i);
      fill(g, q => trace(q, body), col);
      fill(g, q => q.arc(x, -318, 30, 0, 7), col);   // head, joined to body
      // arms: joined to the next figure's arm (skip at gaps)
      for (const d of [-1, 1]) {
        const ni = i + d; if (ni < 0 || ni > 8 || ni === gap) continue;
        const ax = x + d * 44, ax2 = ni * 150 + 75 - d * 44;
        const yy = up ? -270 : -180;
        fill(g, q => trace(q, P([[ax, yy], [(ax + ax2) / 2, yy + (up ? -26 : 22)], [ax2, yy]], false, .3, seed + 10 + i)), col);
      }
      inset(g, body, 3.4, 1.6, col);
      crescent(g, x + 10, -320, 6, Math.PI * 1.05, Math.PI * 1.95, 3);
      taper(g, [[x - 16, -210], [x, -170], [x + 14, -212]], 3);
    }
  }, { seed, col });
}
export { darken };
