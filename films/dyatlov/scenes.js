// Scene painters (pure functions of (g, t)); scene entry slides are handled in main.js
import { PAL, canvas, piece, fill, cut, cutLine, cutTaper, trace, fillPaper, P, Pl, curve, inset, paperShadow, noShadow, rnd, ellipsePoly } from './paper.js';
import { put, mul, T as Tm, S as Sc, R as Rt, ap } from './rig.js';
import { taper } from './motifs.js';
import { drawHiker, silhouettePiece, chainPiece, POSE, darken } from './hikers.js';
import { DPAL, ridge, slope, tent, cedar, mapSheet, mapLabel, mapRouteDrawn, MAP_STOPS, drawStamp, fileSheet, theoryPiece, plaque, goldSun, scissorsPiece } from './world.js';
import { beginLight, pool, applyLight, bloom, addMasked, E, L } from './light.js';
import { textPiece } from './hud.js';
import { T } from './story.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash, vnoise } from '/core/lib.js';

const W = 1920, H = 1080;
const E_ = (t, a, b) => ss(seg(t, a, b));
const st = t => Math.floor(t * 12) / 12;
const cam = (x, y, z) => [z, 0, 0, z, 960 - x * z, 540 - y * z];
const K = {};   // scene piece cache
const pk = (key, make) => K[key] || (K[key] = make());

// falling paper scraps (deterministic, on ones)
function scraps(g, t, n, seed, col, spd = 70, size = 1) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  for (let k = 0; k < n; k++) {
    const ph = rnd(k, seed) * 6.28;
    const x = ((rnd(k, seed + 1) * 2400 + t * spd * (.5 + rnd(k, seed + 2))) % 2400) - 240 + Math.sin(t * .9 + ph) * 46;
    const y = ((rnd(k, seed + 3) * 1500 + t * spd * (.65 + rnd(k, seed + 4) * .7)) % 1500) - 150;
    const r = (2.5 + rnd(k, seed + 5) * 4.5) * size;
    g.save(); g.translate(x, y); g.rotate(Math.sin(t * 1.7 + ph) * .8);
    g.fillStyle = col; g.globalAlpha = .85;
    g.beginPath(); g.moveTo(-r, -r * .5); g.lineTo(r, -r); g.lineTo(r * .35, r); g.closePath(); g.fill();
    g.restore();
  }
  g.restore();
}
// wind streaks flowing down-slope (on ones)
function windStreaks(g, C, t, n, y0, y1, col, spd = 950) {
  g.save(); g.setTransform(...C); g.fillStyle = col;
  for (let k = 0; k < n; k++) {
    const y = y0 + rnd(k, 41) * (y1 - y0);
    const x = ((rnd(k, 42) * 3200 + t * spd * (.6 + rnd(k, 43) * .9)) % 3200) - 600;
    const L2 = 130 + rnd(k, 44) * 280;
    g.globalAlpha = .28 + rnd(k, 45) * .3;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + L2, y - L2 * .07); g.lineTo(x + L2 * .78, y + 4); g.closePath(); g.fill();
  }
  g.restore();
}
// backlit tent: warm transmission + nine sleepers + emission
function tentGlow(g, C, x, y, sc, I) {
  if (I <= .01) return;
  g.save(); g.setTransform(...C);
  g.beginPath(); g.moveTo(x - 300 * sc, y); g.lineTo(x - 150 * sc, y - 252 * sc); g.lineTo(x + 130 * sc, y - 258 * sc); g.lineTo(x + 300 * sc, y); g.closePath(); g.clip();
  const gr = g.createRadialGradient(x - 40 * sc, y - 120 * sc, 0, x - 40 * sc, y - 120 * sc, 330 * sc);
  gr.addColorStop(0, `rgba(255,216,146,${I})`); gr.addColorStop(1, `rgba(196,92,32,${.55 * I})`);
  g.fillStyle = gr; g.fillRect(x - 340 * sc, y - 310 * sc, 690 * sc, 330 * sc);
  g.fillStyle = `rgba(255,242,196,${I})`;
  for (let k = 0; k < 9; k++) { const px = x + (-226 + k * 53) * sc, py = y - (34 + (k % 3) * 30) * sc; g.beginPath(); g.ellipse(px, py, 21 * sc, 9 * sc, 0, 0, 7); g.fill(); }
  g.restore();
  E.save(); E.setTransform(...C); E.globalAlpha = I;
  const gr2 = E.createRadialGradient(x - 40 * sc, y - 120 * sc, 0, x - 40 * sc, y - 120 * sc, 300 * sc);
  gr2.addColorStop(0, 'rgba(255,198,116,.85)'); gr2.addColorStop(1, 'rgba(255,120,40,0)');
  E.fillStyle = gr2; E.fillRect(x - 340 * sc, y - 310 * sc, 690 * sc, 330 * sc); E.restore();
}
// campfire: warm pool + paper flames (12 fps flicker) + emission
function fireAt(g, C, x, y, sc, I, t) {
  const [fx, fy] = ap(C, [x, y - 40 * sc]);
  pool(fx, fy, 300 * sc, `rgba(255,170,80,${.85 * I})`, I);
  E.save(); E.setTransform(...C); E.globalAlpha = I;
  const gr = E.createRadialGradient(x, y - 50 * sc, 0, x, y - 50 * sc, 240 * sc);
  gr.addColorStop(0, 'rgba(255,190,90,.9)'); gr.addColorStop(1, 'rgba(255,110,30,0)');
  E.fillStyle = gr; E.fillRect(x - 260 * sc, y - 300 * sc, 520 * sc, 340 * sc); E.restore();
  g.save(); g.setTransform(...C);
  const ph = Math.floor(t * 12);
  for (const [dx, s2, c2] of [[-14, .8, '#e06820'], [10, 1, '#f09a30'], [0, 1.25, '#f8c860']]) {
    const wob = Math.sin(ph * 2.1 + dx) * 6 * sc;
    g.fillStyle = c2;
    g.beginPath();
    g.moveTo(x + dx * sc - 16 * sc * s2, y);
    g.quadraticCurveTo(x + dx * sc - 20 * sc * s2 + wob, y - 46 * sc * s2, x + dx * sc + wob, y - 78 * sc * s2);
    g.quadraticCurveTo(x + dx * sc + 20 * sc * s2 + wob, y - 46 * sc * s2, x + dx * sc + 16 * sc * s2, y);
    g.closePath(); g.fill();
  }
  g.fillStyle = '#4a3020';
  g.save(); g.translate(x, y + 4 * sc); g.rotate(.16); g.fillRect(-52 * sc, -7 * sc, 104 * sc, 14 * sc); g.restore();
  g.save(); g.translate(x, y + 2 * sc); g.rotate(-.14); g.fillRect(-48 * sc, -7 * sc, 96 * sc, 14 * sc); g.restore();
  g.restore();
}

// ===================== S1 macro: fold, one cut, unfold into nine =====================
function shotMacro(g, t) {
  const z = lerp(1.5, .92, E_(t, 8.6, 10.6));
  const C = cam(960, 560, z);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'rice', 0, 0, W, H, [z * 1.4, 0, 0, z * 1.4, C[4], C[5]]); g.restore();
  const un = E_(t, T.unfold, T.unfold + .9);
  const ch = chainPiece({ col: DPAL.hike, seed: 9 });
  const cw = ch.w * .52;
  if (un <= 0) {
    // folded strip: nine layers, creases visible
    const M = mul(C, mul(Tm(960, 560), Sc(.52, .52)));
    g.save(); g.setTransform(...M);
    const strip = pk('strip', () => piece([-40, -260, 1560, 40], q => {
      fill(q, qq => trace(qq, Pl([[0, -220], [1520, -220], [1520, 20], [0, 20]], true, .5, 31)), DPAL.hike);
      for (let k = 1; k < 9; k++) cutLine(q, 3, qq => { qq.moveTo(k * 1520 / 9 - 40, -214); qq.lineTo(k * 1520 / 9 - 40, 14); });
      fill(q, qq => trace(qq, Pl([[0, -220], [26, -226], [26, 26], [0, 20]], true, .3, 32)), PAL.back);
    }, { seed: 31, col: DPAL.hike }));
    put(g, strip, [1, 0, 0, 1, 0, 0], { shadow: 1.2 });
    g.restore();
  } else {
    // unfolds sideways into the chain of nine
    const sx = lerp(.13, 1, un), settle = (1 - un) * 0;
    put(g, ch, mul(C, mul(Tm(960 - cw * sx / 2, 620 - (1 - un) * 30), mul(Rt((1 - un) * -.02), Sc(sx * .52, .52)))), { shadow: 1.3 });
  }
  // the cut: one slit across the strip, advancing in three snips
  if (t < T.unfold) {
    let u = .04; for (const s of T.snips) u += .32 * eo(seg(t, s - .12, s + .02));
    const cx = lerp(520, 1400, u), cy = 470;
    g.save(); g.setTransform(...C);
    g.strokeStyle = '#f4e9cf'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy - 130); g.lineTo(cx, cy + 130); g.stroke();
    g.strokeStyle = 'rgba(90,10,14,.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx + 2, cy - 130); g.lineTo(cx + 2, cy + 130); g.stroke();
    g.restore();
    // scraps fall from the cut
    T.snips.forEach((s, k2) => {
      if (t < s) return; const v = t - s, x0 = lerp(520, 1400, .04 + .32 * (k2 + 1));
      g.save(); g.setTransform(...mul(C, Tm(x0 + 40 * v, cy + 160 + 420 * v * v))); g.rotate(v * 3 + k2);
      g.fillStyle = DPAL.hike; g.beginPath(); g.moveTo(-24, -7); g.lineTo(20, -16); g.lineTo(9, 18); g.closePath(); g.fill(); g.restore();
    });
    // scissors
    const SC = scissorsPiece();
    let open = .5; for (const s of T.snips) { if (t > s - .12 && t < s) open = lerp(.5, .04, (t - s + .12) / .12); else if (t >= s && t < s + .3) open = lerp(.04, .5, (t - s) / .3); }
    const away = E_(t, T.unfold - .25, T.unfold + .25);
    put(g, SC, mul(C, mul(Tm(cx - 90 - 700 * away, cy - 260 - 500 * away), mul(Rt(.5), Sc(1.05, 1.05)))), { shadow: 2 });
  }
  if (t < .3) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(0,0,0,${1 - t / .3})`; g.fillRect(0, 0, W, H); g.restore(); }
}

// ===================== S2 title =====================
function buildTitle() {
  if (K.t1) return;
  K.t1 = 'DYATLOV'.split('').map((c, i) => textPiece(c, 210, 800, DPAL.hike, 'Fraunces', 40 + i));
  K.t2 = 'PASS'.split('').map((c, i) => textPiece(c, 150, 800, DPAL.hike, 'Fraunces', 60 + i));
  K.strip = pk('tstrip', () => piece([0, 0, 1300, 40], q => {
    const pts = []; for (let x = 0; x <= 1300; x += 14) pts.push([x, 6 + (x / 14 % 2) * 9]);
    pts.push([1300, 34]); for (let x = 1300; x >= 0; x -= 14) pts.push([x, 34]);
    fill(q, qq => trace(qq, Pl(pts, true, .3, 21)), DPAL.hike);
  }, { ss: 1.5, seed: 21 }));
  K.seal = pk('seal', () => piece([0, 0, 150, 150], q => {
    fill(q, qq => trace(qq, Pl([[0, 0], [150, 0], [150, 150], [0, 150]], true, .6, 4)), DPAL.hike);
    q.save(); q.globalCompositeOperation = 'destination-out'; q.font = '800 58px "Fraunces"'; q.textAlign = 'center'; q.fillText('1959', 75, 98); q.restore();
  }, { ss: 2, seed: 23 }));
  K.w1 = K.t1.reduce((s, p) => s + p.w - 20 + 8, 0); K.w2 = K.t2.reduce((s, p) => s + p.w - 20 + 4, 0);
}
function shotTitle(g, t) {
  buildTitle();
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'rice', 0, 0, W, H); g.restore();
  const t0 = T.title, pop = (i, d = .07) => { const u = st(t - t0 - i * d); return u < 0 ? 0 : u < .09 ? 1.16 : 1; };
  const sl = E_(t, t0, t0 + .35);
  put(g, K.strip, [1, 0, 0, 1, 330 - (1 - sl) * 1600, 168], { shadow: 1 });
  put(g, K.strip, [1, 0, 0, -1, 330 + (1 - sl) * 1600, 912], { shadow: 1 });
  let x = 960 - K.w1 / 2;
  K.t1.forEach((p, i) => { const s = pop(i); if (s) put(g, p, [s, 0, 0, s, x + (1 - s) * p.w / 2, 268 + (1 - s) * p.h / 2], { shadow: 1.4 }); x += p.w - 20 + 8; });
  x = 960 - K.w2 / 2 + 60;
  K.t2.forEach((p, i) => { const s = pop(i + 7, .05); if (s) put(g, p, [s, 0, 0, s, x, 520], { shadow: 1.1 }); x += p.w - 20 + 4; });
  if (t > t0 + 1.05) { const u = st(t - t0 - 1.05), s = u < .09 ? 1.4 : 1; put(g, K.seal, [s, 0, 0, s, 1408 - 75 * (s - 1), 620 - 75 * (s - 1)], { shadow: 1.2 }); }
  if (t > t0 + 1.4) { g.save(); g.globalAlpha = E_(t, t0 + 1.4, t0 + 1.8); g.font = 'italic 500 40px "Fraunces"'; g.fillStyle = '#5a1a12'; g.textAlign = 'center'; g.fillText('nine hikers  \u00b7  one night  \u00b7  the northern Urals', 960, 782); g.restore(); }
  scraps(g, t, 14, 51, DPAL.hike, 55, .9);
}

// ===================== S3 the nine, day; Yudin leaves =====================
const LINE9 = [-1, 0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ x: 620 + i * 190, hat: ['cap', 'hood', 'beanie', 'cap', 'bare', 'hood', 'cap', 'beanie', 'cap'][i], pack: i !== 3, seed: 100 + i }));
function dayWorld(g, C, t, opt = {}) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'rice', 0, 0, W, H, [C[0] * .8, 0, 0, C[0] * .8, C[4], C[5]]); g.restore();
  g.save(); g.setTransform(...C);
  put(g, ridge(2600, 300, DPAL.hillFar, 61, 12), mul(C, Tm(-200, 560)), { shadow: .5 });
  put(g, ridge(2600, 210, DPAL.hillMid, 63, 10), mul(C, Tm(-300, 660)), { shadow: .5 });
  put(g, slope(3200, 260, '#f6efdc', 65), mul(C, Tm(-500, 1160)), { shadow: .6 });
  g.restore();
}
function shotNine(g, t) {
  const pan = lerp(760, 2050, eio(seg(t, 26, 43.5)));
  const z = .62;
  const C = cam(t < 26 ? 760 : pan, 700, z);
  dayWorld(g, C, t);
  // the nine: lying (cut) -> stand up in a line
  LINE9.forEach((h, i) => {
    const u = eo(seg(t, T.standUp + i * .09, T.standUp + .8 + i * .09));
    const rot = (1 - u) * -Math.PI / 2;
    const y = 900 - u * 80;
    const walking = i === 8 && t > T.yudin;
    const wx = walking ? h.x - (t - T.yudin) * 150 : h.x;
    drawHiker(g, C, {
      x: wx, y, scale: z, rot: walking ? 0 : rot, flip: walking, pose: walking ? POSE.walk(t * 5.2) : POSE.stand,
      col: DPAL.hike, seed: h.seed, hat: h.hat, pack: h.pack, pole: i % 3 === 0 && !walking, shadow: 1,
    });
  });
  // route arrows on the snow (cut marks)
  if (t > 30) { g.save(); g.setTransform(...C); g.globalAlpha = E_(t, 30, 31) * .8; g.fillStyle = DPAL.hikeF;
    for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(1000 + k * 240, 960); g.lineTo(1080 + k * 240, 930); g.lineTo(1060 + k * 240, 960); g.lineTo(1080 + k * 240, 990); g.closePath(); g.fill(); }
    g.restore(); }
}

// ===================== S4 map -> peel -> last photo =====================
function shotMap(g, t) {
  const peel = E_(t, T.peel, T.peel + 1.1);
  // underneath: the last-photo slope (dusk)
  if (peel > 0) shotLastPhoto(g, Math.max(t, T.lastPhoto));
  if (peel < 1) {
    const rot = -.03, M0 = [1, 0, 0, 1, 210, 60];
    const M = mul([Math.cos(rot), Math.sin(rot), -Math.sin(rot), Math.cos(rot), 0, 0], M0);
    const off = peel * 1900, dr = peel * .5;
    const Ms = mul([Math.cos(dr), Math.sin(dr), -Math.sin(dr), Math.cos(dr), -off, peel * 200], M);
    const mp = mapSheet();
    g.save(); g.setTransform(...Ms);
    paperShadow(g, 1, 1.4);
    put(g, mp.sheet, [1, 0, 0, 1, 0, 0], { shadow: 0 });
    noShadow(g);
    mapRouteDrawn(g, seg(t, 54, 74), null);
    // labels pop as the route passes them
    const u = seg(t, 54, 74);
    MAP_STOPS.forEach(([idx, s], k) => {
      const need = idx / 8, lab = mapLabel(s, s.length > 10 ? 34 : 42);
      if (u < need - .02) return;
      const pp = st(t - (54 + need * 20)), s2 = pp < .09 ? 1.2 : 1;
      const [lx, ly] = mp.route[idx];
      put(g, lab, [s2, 0, 0, s2, lx + 26, ly - 66 - (s2 - 1) * lab.h / 2], { shadow: .4 });
    });
    g.restore();
    if (t > 60) drawStamp(g, mul(Ms, Tm(980, 720)), '28 JAN \u00b7 VIZHAY', 71, E_(t, 60, 60.3));
    if (t > 70) drawStamp(g, mul(Ms, Tm(1180, 330)), '1 FEB', 73, E_(t, 70, 70.3));
  }
}
function shotLastPhoto(g, t) {
  const z = lerp(.8, .88, seg(t, T.lastPhoto, T.shutter));
  const C = cam(1100, 640, z);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'indigo', 0, 0, W, H, [C[0] * .8, 0, 0, C[0] * .8, C[4], C[5]]); g.restore();
  g.save(); g.setTransform(...C);
  put(g, ridge(2800, 260, '#2a3560', 67, 12), mul(C, Tm(-300, 480)), { shadow: .5 });
  put(g, slope(3200, 420, '#3a4a80', 69), mul(C, Tm(-400, 1120)), { shadow: .6 });
  g.restore();
  // nine figures dig a step into the slope
  for (let i = 0; i < 9; i++) {
    const x = 620 + i * 120, y = 905 - i * 9;
    drawHiker(g, C, { x, y, scale: z * .9, pose: POSE.dig, col: DPAL.hike, seed: 120 + i, hat: 'hood', pack: false, shadow: .9 });
  }
  // the tent rises on the cut step
  const up = back(seg(t, 82, 83));
  if (up > 0) put(g, tent('up'), mul(C, mul(Tm(1330, 810), Sc(up, up))), { shadow: 1.2 });
  if (t > T.shutter && t < T.shutter + .18) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(255,250,235,${1 - (t - T.shutter) / .18})`; g.fillRect(0, 0, W, H); g.restore(); }
}

// ===================== S5/S6 night camp + slab =====================
function nightWorld(g, C, t, opt = {}) {
  beginLight(opt.amb || 'rgb(66,72,118)');
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'ink', 0, 0, W, H, [C[0] * .8, 0, 0, C[0] * .8, C[4], C[5]]); g.restore();
  g.save(); g.setTransform(...C);
  put(g, ridge(3000, 340, DPAL.far, 81, 14), mul(C, Tm(-400, 500)), { shadow: .4 });
  put(g, ridge(3000, 240, DPAL.trees, 83, 12), mul(C, Tm(-500, 620)), { shadow: .4 });
  put(g, slope(3400, 520, DPAL.near, 85), mul(C, Tm(-600, 1180)), { shadow: .6 });
  put(g, slope(3400, 300, DPAL.snowA, 87), mul(C, Tm(-700, 1300)), { shadow: .6 });
  g.restore();
}
function slabPiece() {
  return pk('slab', () => piece([-80, -260, 900, 60], q => {
    const out = P([[-40, 20], [40, -180], [220, -236], [460, -242], [660, -196], [820, -90], [860, 20]], true, .5, 91);
    fill(q, qq => trace(qq, out), DPAL.snowB);
    inset(q, out, 4, 2, DPAL.snowB);
    for (let k = 0; k < 4; k++) taper(q, [[60 + k * 180, -60 - k * 20], [200 + k * 180, -90 - k * 24]], 3.4);
  }, { seed: 91, col: DPAL.snowB }));
}
function shotCamp(g, t, opt = {}) {
  const push = lerp(.86, 1.02, seg(t, T.camp, 132));
  const C = cam(1150, 620, push);
  nightWorld(g, C, t);
  const tentX = 1150, tentY = 880, sc = .95;
  const snuffed = t > T.slide + .4;
  const I = snuffed ? 0 : (t > T.slide ? Math.max(0, 1 - (t - T.slide) / .4) : 1) * E_(t, T.camp + .5, T.camp + 1.5);
  // slab thickens above the shoulder
  const th = .25 + .75 * seg(t, T.camp, T.crack);
  put(g, slabPiece(), mul(C, mul(Tm(1250, 560), mul(Sc(1, th), Rt(.06)))), { shadow: .8 });
  // tent + glow
  const tk = t > T.slide + .45 ? 'dead' : 'up';
  if (I > .01 || tk === 'dead') {
    put(g, tent(tk), mul(C, Tm(tentX, tentY + (tk === 'dead' ? 0 : 0))), { shadow: 1.2 });
    tentGlow(g, C, tentX, tentY, sc, I);
  }
  { const [px, py] = ap(C, [tentX - 40, tentY - 120]); pool(px, py, 420, 'rgba(255,180,100,.5)', I * .8); }
  applyLight(g);
  bloom(g, .5 + .3 * seg(t, 120, 132));
  windStreaks(g, C, t, 14 + Math.floor(18 * seg(t, T.windUp, 134)), 240, 950, '#aebadd', 800 + 900 * seg(t, T.windUp, 134));
  scraps(g, t, 10, 55, '#aebadd', 130, .7);
}

// ===================== S6 slab slide =====================
function shotSlab(g, t) {
  const z = lerp(1.18, 1.1, seg(t, 134, 150));
  let sx = 0, sy = 0;
  if (t > T.shake) { const v = t - T.shake; sx = Math.sin(v * 46) * 26 * Math.exp(-v * 4.5); sy = Math.cos(v * 39) * 18 * Math.exp(-v * 4.5); }
  const C = cam(1180 + sx, 600 + sy, z);
  nightWorld(g, C, t);
  const slid = ei(seg(t, T.slide, T.slide + .75));
  const th = 1;
  put(g, slabPiece(), mul(C, mul(Tm(1250 + slid * 470, 560 + slid * 300), mul(Sc(1, th), Rt(.06 + slid * .1)))), { shadow: 1 });
  // crack zips across the slab just before it lets go
  if (t > T.crack && t < T.slide + .3) {
    const u = eo(seg(t, T.crack, T.crack + .5));
    g.save(); g.setTransform(...C); g.strokeStyle = '#12172e'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(1330, 500);
    const pts = [[1420, 470], [1500, 505], [1590, 460], [1680, 500], [1760, 470]];
    for (let k = 0; k < pts.length; k++) { if (k / pts.length > u) break; g.lineTo(...pts[k]); }
    g.stroke(); g.restore();
  }
  const I = t > T.slide ? Math.max(0, 1 - (t - T.slide) / .4) : 1;
  const tk = t > T.slide + .45 ? 'dead' : 'up';
  const ty = 880 + slid * 300 * .55;
  put(g, tent(tk), mul(C, Tm(1250 + slid * 470, ty)), { shadow: 1.2 });
  tentGlow(g, C, 1250 + slid * 470, ty, .95, I * E_(t, 120, 121));
  { const [px, py] = ap(C, [1210, ty - 120]); pool(px, py, 420, 'rgba(255,180,100,.5)', I * .7); }
  applyLight(g);
  bloom(g, .6);
  windStreaks(g, C, t, 30, 200, 900, '#aebadd', 1500 + 800 * seg(t, 120, 134));
  if (t > T.still) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(15,20,42,.25)'; g.fillRect(0, 0, W, H); g.restore(); }
}

// ===================== S7 the cut from inside =====================
function shotCut(g, t) {
  const z = lerp(.9, 1.14, eio(seg(t, T.cutStart, T.cutOpen + 4)));
  const C = cam(960, 540, z);
  // cold light outside
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const gr = g.createRadialGradient(960, 520, 0, 960, 520, 1200);
  gr.addColorStop(0, '#dfe7ff'); gr.addColorStop(.6, '#9fb0e2'); gr.addColorStop(1, '#4a5890');
  g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  // tent cloth from inside: dark red paper with a growing jagged tear
  const u = eo(seg(t, T.cutStart + .4, T.cutOpen + 1.2));
  const tearC = [960, 540], tear = P([[-560, -210], [-380, -150], [-300, -230], [-120, -140], [40, -220], [220, -130], [400, -210], [560, -140], [620, 190], [430, 120], [260, 220], [60, 130], [-140, 230], [-340, 130], [-560, 200]], true, .5, 95)
    .map(([x, y]) => [tearC[0] + x * (0.12 + .88 * u), tearC[1] + y * (0.12 + .88 * u)]);
  const cloth = Pl([[-1400, -1100], [3300, -1100], [3300, 2200], [-1400, 2200]], true, 1, 96);
  g.save(); g.setTransform(...C);
  g.beginPath(); trace(g, cloth); trace(g, tear); g.fillStyle = '#7e1424'; g.fill('evenodd');
  g.clip('evenodd');
  fillPaper(g, 'indigo', -2000, -1500, 6000, 4500, [C[0], 0, 0, C[0], C[4], C[5]], 'rgba(126,20,36,.82)');
  // canvas folds
  g.strokeStyle = 'rgba(30,4,8,.5)'; g.lineWidth = 6;
  for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(-1400 + k * 620, -1100); g.quadraticCurveTo(-1200 + k * 620, 500, -1400 + k * 620, 2200); g.stroke(); }
  g.restore();
  // torn flaps bend into the tear
  g.save(); g.setTransform(...C); g.fillStyle = '#8f1830';
  const bend = (1 - u) * .2 + u * .12;
  g.beginPath(); g.moveTo(tear[0][0], tear[0][1]); g.quadraticCurveTo(tearC[0] - 300, tearC[1] - 260 * bend, tear[6][0], tear[6][1]); g.closePath(); g.fill();
  g.restore();
  // silhouettes spill out through the tear
  if (t > T.spill) {
    for (let k = 0; k < 3; k++) {
      const v = seg(t, T.spill + k * 1.1, T.spill + 3.4 + k * 1.1);
      if (v <= 0 || v >= 1) continue;
      const x = lerp(700 + k * 160, 1500 + k * 120, v), y = 560 + Math.sin(v * 3.1) * 60;
      put(g, silhouettePiece('#141b38', 130 + k), mul(C, mul(Tm(x, y + 430), mul(Rt((v - .5) * .3), Sc(.62, .62)))), { shadow: .8 });
    }
  }
  if (t < T.cutStart + .35) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(0,0,0,${1 - (t - T.cutStart) / .35})`; g.fillRect(0, 0, W, H); g.restore(); }
}

// ===================== S8 descent =====================
function shotDescent(g, t) {
  const pan = lerp(500, 1250, seg(t, T.descent, 196));
  const C = cam(pan, 760, .8);
  nightWorld(g, C, t);
  put(g, slope(3400, 700, DPAL.snowB, 89), mul(C, Tm(-800, 1500)), { shadow: .6 });
  // treeline at the bottom
  g.save(); g.setTransform(...C);
  for (let k = 0; k < 12; k++) {
    const x = -600 + k * 300 + rnd(k, 95) * 120;
    put(g, pk('tr' + (k % 3), () => piece([-120, -420, 120, 40], q => {
      const tr = P([[-26, 20], [-16, -180], [-26, -320], [0, -400], [24, -300], [16, -170], [26, 20]], true, .5, 97);
      fill(q, qq => trace(qq, tr), DPAL.trees);
      for (const [y, w2] of [[-300, 130], [-220, 160], [-140, 180]]) fill(q, qq => trace(qq, P([[0, y - 90], [w2, y + 20], [-w2, y + 20]], true, .5, 99)), DPAL.trees);
    }, { seed: 97, col: DPAL.trees })), mul(C, Tm(x, 1330 + rnd(k, 96) * 60)), { shadow: .7 });
  }
  g.restore();
  // nine small figures descend in a loose line
  for (let i = 0; i < 9; i++) {
    const v = seg(t, T.descent + i * .8, T.descent + 24 + i * .8);
    const x = 900 + i * 90 + v * 500, y = 620 + v * 620;
    if (v >= 1) continue;
    put(g, silhouettePiece(DPAL.hikeF, 140 + i), mul(C, mul(Tm(x, y), mul(Rt(.12), Sc(.4, .4)))), { shadow: .7 });
  }
  windStreaks(g, C, t, 16, 200, 1000, '#aebadd', 1100);
  scraps(g, t, 12, 57, '#aebadd', 150, .8);
}

// ===================== S9 cedar =====================
function shotCedar(g, t) {
  const push = lerp(.8, .95, seg(t, T.cedar, 232));
  const C = cam(960, 640, push);
  nightWorld(g, C, t);
  put(g, slope(3400, 380, DPAL.snowA, 101), mul(C, Tm(-700, 1330)), { shadow: .6 });
  const stubs = Math.floor(7 * seg(t, 202, 216));
  put(g, cedar(stubs, '#33427e'), mul(C, mul(Tm(820, 1250), Sc(1.05, 1.05))), { shadow: 1.2 });
  // fire
  const fireI = E_(t, T.cedar + 1.5, T.cedar + 3);
  fireAt(g, C, 1130, 1210, .9, fireI, t);
  applyLight(g);
  bloom(g, .55);
  // two climbers on the trunk
  for (const [k, hy] of [[0, 700], [1, 520]]) {
    const appear = seg(t, 204 + k * 4, 206 + k * 4);
    if (appear <= 0) continue;
    drawHiker(g, C, { x: 790 + k * 60, y: hy + 150, scale: .8, pose: POSE.climb(t * 4 + k * 2), col: DPAL.hike, seed: 150 + k, hat: 'hood', pack: false, shadow: .9 });
  }
  // two by the fire; at T.still they lie down
  const lying = t > T.still;
  for (const k of [0, 1]) {
    drawHiker(g, C, {
      x: 1240 + k * 150, y: lying ? 1244 : 1235, scale: .8, rot: lying ? 1.42 : 0,
      pose: lying ? POSE.lie : POSE.sit, col: DPAL.hike, seed: 160 + k, hat: 'beanie', pack: false, shadow: .9,
    });
  }
  // three turn back up the slope and shrink
  for (const k of [0, 1, 2]) {
    const v = seg(t, T.backUp + k * 1.4, T.backUp + 12 + k * 1.4);
    if (v <= 0) continue;
    const x = 1500 + k * 90 + v * 680, y = 1180 - v * 560;
    put(g, silhouettePiece(DPAL.hikeF, 170 + k), mul(C, mul(Tm(x, y), Sc(.5 - v * .18, .5 - v * .18))), { shadow: .7 });
  }
  scraps(g, t, 8, 59, '#aebadd', 90, .7);
}

// ===================== S10 ravine =====================
function shotRavine(g, t) {
  const z = lerp(.9, 1.05, seg(t, T.ravine, 258));
  const C = cam(960, 620, z);
  beginLight('rgb(72,78,122)');
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'ink', 0, 0, W, H, [C[0] * .8, 0, 0, C[0] * .8, C[4], C[5]]); g.restore();
  g.save(); g.setTransform(...C);
  put(g, slope(3400, 300, DPAL.near, 105), mul(C, Tm(-600, 900)), { shadow: .5 });
  // the stream: pale winding band
  put(g, pk('stream', () => piece([-100, -140, 2100, 140], q => {
    const out = curve([[0, 0], [400, -60], [900, 40], [1400, -40], [2000, 20]], false, 6);
    const up = out.map(([x, y]) => [x, y - 46]), dn = out.map(([x, y]) => [x, y + 46]).reverse();
    fill(q, qq => trace(qq, up.concat(dn)), DPAL.snowB);
    for (let k = 0; k < 8; k++) taper(q, [[200 + k * 220, -10 + (k % 2) * 26], [380 + k * 220, 8 - (k % 2) * 20]], 3);
  }, { seed: 107, col: DPAL.snowB })), mul(C, Tm(-100, 1010)), { shadow: .6 });
  // the dug hollow (dark ellipse joined to the bank)
  fill(g, q => trace(q, ellipsePoly(1000, 980, 480, 130, -.06, 40)), '#1a2244');
  g.restore();
  // four figures in the hollow (three lying, one sitting up)
  const poses = [POSE.lie, POSE.lie, POSE.sit, POSE.lie];
  for (let k = 0; k < 4; k++) {
    const lying = poses[k] === POSE.lie;
    drawHiker(g, C, { x: 780 + k * 150, y: lying ? 1012 + (k % 2) * 14 : 990, scale: .72, rot: lying ? 1.42 : 0, pose: poses[k], col: DPAL.hike, seed: 180 + k, hat: 'hood', pack: false, shadow: .8 });
  }
  // snow slowly covers them
  const cov = seg(t, 240, 260);
  if (cov > 0) put(g, pk('cover', () => piece([-100, -160, 1300, 60], q => {
    const out = P([[-60, 30], [140, -110], [420, -140], [760, -120], [1040, -130], [1240, 30]], true, .5, 109);
    fill(q, qq => trace(qq, out), DPAL.snowB);
    inset(q, out, 4, 2, DPAL.snowB);
  }, { seed: 109, col: DPAL.snowB })), mul(C, mul(Tm(420, 1000), mul(Sc(.4 + .75 * cov, .5 + .6 * cov), Rt(-.04)))), { shadow: .7, alpha: Math.min(1, .35 + cov) });
  { const [px, py] = ap(C, [1000, 940]); pool(px, py, 520, 'rgba(170,190,240,.4)', .7); }
  applyLight(g);
  scraps(g, t, 8, 61, '#aebadd', 60, .6);
}

// ===================== S11 search =====================
function shotSearch(g, t) {
  const pan = lerp(700, 1500, eio(seg(t, 263, 292)));
  const C = cam(pan, 680, .82);
  nightWorld(g, C, t);
  // the tent found: sagging, cut, snowed
  put(g, tent('snowed'), mul(C, Tm(760, 800)), { shadow: 1.2 });
  if (t > 268) drawStamp(g, mul(C, Tm(560, 380)), 'FEB 26 \u00b7 THE TENT', 111, E_(t, 268, 268.4));
  // searchers with lanterns strung across the slope
  for (let k = 0; k < 7; k++) {
    const x = 300 + k * 260 + rnd(k, 113) * 80, y = 900 + rnd(k, 114) * 260;
    const ph = Math.sin(t * .7 + k * 1.7) * 30;
    put(g, silhouettePiece('#101630', 190 + k), mul(C, mul(Tm(x + ph, y), Sc(.42, .42))), { shadow: .6 });
    { const [px, py] = ap(C, [x + ph, y - 160]); pool(px, py, 150, 'rgba(255,200,120,.8)', .8); }
    E.save(); E.setTransform(...C); E.globalAlpha = .9;
    const gr = E.createRadialGradient(x + ph, y - 160, 0, x + ph, y - 160, 90);
    gr.addColorStop(0, 'rgba(255,214,140,.9)'); gr.addColorStop(1, 'rgba(255,140,50,0)');
    E.fillStyle = gr; E.fillRect(x + ph - 100, y - 260, 200, 200); E.restore();
  }
  // the ravine hollow, found in May
  if (t > 282) {
    g.save(); g.setTransform(...C); g.globalAlpha = E_(t, 282, 283);
    fill(g, q => trace(q, ellipsePoly(2050, 1080, 420, 110, -.05, 40)), '#1a2244');
    g.restore();
    if (t > 284) drawStamp(g, mul(C, Tm(1230, 690)), 'MAY \u00b7 THE RAVINE', 113, E_(t, 284, 284.4));
  }
  applyLight(g);
  bloom(g, .5);
  scraps(g, t, 10, 63, '#aebadd', 100, .7);
}

// ===================== S12 case file =====================
const THEORY_POS = [[430, 430], [960, 340], [1480, 430], [700, 780]];
const THEORY_KIND = ['rocket', 'ball', 'hunter', 'ring'];
const STAMPS12 = [['RADIATION', 1180, 560], ['NO EXTERNAL WOUNDS', 1010, 660], ['CUT FROM INSIDE', 1060, 760]];
function shotFile(g, t) {
  const rot = .025, Mr = [Math.cos(rot), Math.sin(rot), -Math.sin(rot), Math.cos(rot), 0, 0];
  const M = mul(Mr, [1, 0, 0, 1, 150, 90]);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'ink', 0, 0, W, H); g.restore();
  g.save(); g.setTransform(...M);
  paperShadow(g, 1, 1.4); put(g, fileSheet(), [1, 0, 0, 1, 0, 0], { shadow: 0 }); noShadow(g);
  g.restore();
  // stamps thump in
  STAMPS12.forEach(([s, x, y], k) => {
    if (t < T.stamps[k]) return;
    const u = st(t - T.stamps[k]), s2 = u < .09 ? 1.25 : 1;
    drawStamp(g, mul(M, mul(Tm(x, y), mul(Rt(-.06 + k * .05), Sc(s2, s2)))), s, 121 + k, 1);
  });
  // theories pop up, then the scissors snip each away
  THEORY_POS.forEach(([x, y], k) => {
    const t0 = T.theories[k], snip = T.snips2[k];
    if (t < t0) return;
    const gone = t > snip;
    const u = st(t - t0), s2 = u < .09 ? .6 : u < .18 ? 1.08 : 1;
    const th = theoryPiece(THEORY_KIND[k], 131 + k);
    const fall = gone ? seg(t, snip, snip + .9) : 0;
    const base = mul(M, mul(Tm(x, y), mul(Rt(Math.sin(t * .8 + k) * .04 - fall * .5), Sc(s2, s2))));
    if (!gone) {
      put(g, th, base, { shadow: 1.2 });
    } else {
      // snipped: two halves fall apart
      for (const side of [-1, 1]) {
        g.save(); g.setTransform(...mul(base, mul(Tm(side * 90 * fall, 260 * fall * fall), mul(Rt(side * fall * 1.1), Sc(1, 1)))));
        g.beginPath(); g.rect(side < 0 ? th.x0 - 10 : th.x0 + th.w / 2, th.y0 - 10, th.w / 2 + 12, th.h + 20); g.clip();
        g.drawImage(th.c, th.x0, th.y0, th.w, th.h);
        g.restore();
      }
    }
    // scissors dart in for the snip
    if (t > snip - .5 && t < snip + .45) {
      const inu = E_(t, snip - .5, snip - .35), outu = E_(t, snip + .3, snip + .45);
      const sc = scissorsPiece();
      put(g, sc, mul(M, mul(Tm(x + 240 - 500 * inu + 500 * outu, y - 200 + 120 * inu - 120 * outu), mul(Rt(.7), Sc(.8, .8)))), { shadow: 1.5 });
    }
  });
}

// ===================== S13 the answer: diagram =====================
function shotAnswer(g, t) {
  const z = lerp(.88, 1.02, seg(t, T.answer, 356));
  const C = cam(960, 560, z);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'rice', 0, 0, W, H, [C[0] * .8, 0, 0, C[0] * .8, C[4], C[5]]); g.restore();
  g.save(); g.setTransform(...C);
  // the slope as a cut diagram
  put(g, slope(2600, 700, DPAL.snowA, 115), mul(C, Tm(-300, 1420)), { shadow: .7 });
  // the cut step (notch) + tent below the shoulder
  put(g, pk('step', () => piece([-60, -140, 380, 40], q => {
    const out = Pl([[-40, 30], [-10, -90], [60, -96], [110, -20], [340, 30]], true, .4, 117);
    fill(q, qq => trace(qq, out), '#5f6ea6');
    inset(q, out, 3.4, 1.8, '#5f6ea6');
  }, { seed: 117, col: '#5f6ea6' })), mul(C, Tm(1050, 700)), { shadow: .8 });
  put(g, tent('up', '#c4162c'), mul(C, mul(Tm(1180, 900), Sc(.62, .62))), { shadow: 1 });
  // wind arrows loading the shoulder
  const wa = .55 + .45 * Math.sin(t * 2.2);
  for (let k = 0; k < 3; k++) {
    const y = 380 + k * 90;
    g.save(); g.setTransform(...mul(C, Tm(260 - k * 60 + (1 - wa) * 40, y)));
    g.fillStyle = DPAL.hikeF; g.globalAlpha = .5 + .4 * wa;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(190, -26); g.lineTo(190, 26); g.closePath(); g.fill();
    g.restore();
  }
  g.restore();
  // the slab releases in slow motion
  const sl = ei(seg(t, T.slowmo, T.slowmo + 6));
  if (sl > 0) put(g, slabPiece(), mul(C, mul(Tm(760, 480 + sl * 330), mul(Sc(1.05, 1.05), Rt(sl * .12)))), { shadow: 1 });
  else put(g, slabPiece(), mul(C, mul(Tm(760, 480), mul(Sc(1.05, .9), Rt(.06)))), { shadow: 1 });
  if (t > T.stamp2020) drawStamp(g, mul(C, Tm(300, 830)), '2020 \u2014 AN AVALANCHE', 141, E_(t, T.stamp2020, T.stamp2020 + .35));
  if (t > T.stamp2021) drawStamp(g, mul(C, Tm(300, 950)), '2021 \u2014 A DELAYED SLAB, MODELED', 143, E_(t, T.stamp2021, T.stamp2021 + .35));
}

// ===================== S14 coda =====================
function shotCoda(g, t) {
  const z = lerp(.92, .68, eio(seg(t, T.coda, 388)));
  const C = cam(960, 660, z);
  dayWorld(g, C, t);
  // gold-foil low sun (the one gold use)
  if (t > T.sun) { const u = E_(t, T.sun, T.sun + 1.2); put(g, goldSun(130), mul(C, mul(Tm(1560, 300), Sc(u, u))), { shadow: 1 }); }
  // the ridge with the chain of nine — and a gap where the tenth stood... no: where one of the nine is missing
  put(g, ridge(3200, 240, '#d8ccb2', 121, 14), mul(C, Tm(-400, 900)), { shadow: .7 });
  const ch = chainPiece({ col: DPAL.hike, seed: 9, gap: 6, arms: 'up' });
  put(g, ch, mul(C, mul(Tm(560, 830), Sc(.5, .5))), { shadow: 1.2 });
  // the old man walks to the plaque and lays down a photograph
  const wx = lerp(1700, 1310, eio(seg(t, 364, 377)));
  const atPlaque = t > T.plaque;
  drawHiker(g, C, {
    x: wx, y: 838, scale: .62, pose: atPlaque ? { ...POSE.stand, torso: .38, head: -.3, aUf: 1.1, aLf: .35, aUb: 1.0, aLb: .4 } : POSE.walk(t * 4.4),
    col: '#8a6a52', seed: 201, hat: 'beanie', pack: false, shadow: 1,
  });
  put(g, plaque(), mul(C, Tm(1240, 872)), { shadow: 1 });
  if (t > T.plaque + .5) { g.save(); g.setTransform(...mul(C, Tm(1218, 830 - 26 * (1 - E_(t, T.plaque + .5, T.plaque + 1))))); g.fillStyle = '#f8f2e2'; g.rotate(-.06); g.fillRect(-26, -18, 52, 36); g.strokeStyle = '#8a7650'; g.lineWidth = 2; g.strokeRect(-26, -18, 52, 36); g.restore(); }
  scraps(g, t, 10, 65, '#c9bda0', 40, .8);
}

// ===================== S15 end card =====================
function shotEnd(g, t) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'rice', 0, 0, W, H); g.restore();
  const t0 = T.end;
  if (!K.et) { K.et = 'DYATLOV PASS'.split('').map((c, i) => textPiece(c === ' ' ? '\u00b7' : c, 96, 800, DPAL.hike, 'Fraunces', 160 + i)); }
  const pop = i => { const u = st(t - t0 - i * .045); return u < 0 ? 0 : u < .09 ? 1.14 : 1; };
  let widths = K.et.map(p => p.w - 20 + 4), tot = widths.reduce((a, b) => a + b, 0);
  let x = 960 - tot / 2;
  K.et.forEach((p, i) => { const s = pop(i); if (s) put(g, p, [s, 0, 0, s, x + (1 - s) * p.w / 2, 420 + (1 - s) * p.h / 2], { shadow: 1.2 }); x += widths[i]; });
  if (t > t0 + .9) { g.save(); g.globalAlpha = E_(t, t0 + .9, t0 + 1.3); g.font = 'italic 500 38px "Fraunces"'; g.fillStyle = '#5a1a12'; g.textAlign = 'center';
    g.fillText('a red paper-cut documentary  \u00b7  February 1959', 960, 620); g.restore(); }
  if (t > t0 + 1.2) { const u = st(t - t0 - 1.2), s = u < .09 ? 1.35 : 1; buildTitle(); put(g, K.seal, [s, 0, 0, s, 1395 - 75 * (s - 1), 560 - 75 * (s - 1)], { shadow: 1.1 }); }
  // two ticks (the woodblocks)
  T.ticks.forEach((tk, k) => {
    if (t < tk) return;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = DPAL.ink;
    g.fillRect(880 + k * 160, 700, 60, 8); g.restore();
  });
}

// ===================== dispatch =====================
export const SHOT = {
  macro: shotMacro, title: shotTitle, nine: shotNine, map: shotMap, camp: shotCamp,
  slab: shotSlab, cut: shotCut, descent: shotDescent, cedar: shotCedar, ravine: shotRavine,
  search: shotSearch, file: shotFile, answer: shotAnswer, coda: shotCoda, endcard: shotEnd,
};
