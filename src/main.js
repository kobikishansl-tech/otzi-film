// The Man the Glacier Kept — camera, scroll, printing reveal, snow erase, titles, subtitles, events
import { clamp, lerp, seg, ss, eio, eo, hash, mulberry, TAU } from '/core/lib.js';
import { W, H, FR, PAL, TX, mk, buildTextures, stampLayer, stampFn, drawSeal, cartouche, sealCanvas, rgba, poly, vtext, inkify } from './print.js';
import { VIEWS } from './views.js';
import { figure } from './figure.js';
import { DUR, T, VO, SLOT, SW, GAP, REVEAL_DUR, q8 } from './story.js';

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const QS = new URLSearchParams(location.search);
const NOSUB = QS.has('nosub');
const J = async f => { try { const r = await fetch(f); if (r.ok) return await r.json(); } catch (e) { } return null; };
const LINES = (await J('lines.json')) || [], DURS = (await J('voices/dur.json')) || {};
const LINE = Object.fromEntries(LINES.map(l => [l.id, l]));

await document.fonts.load('400 40px Yuji', '峠八景一二三四五六七八持ち物最後の食登り夕の矢雪氷河一九九一');
await document.fonts.load('600 40px ShipporiK', '峠八景'); await document.fonts.load('500 40px Shippori', 'Aa'); await document.fonts.load('700 40px Shippori', 'Aa');
buildTextures();

// ——— Subtitles ———
export const SUBS = Object.entries(VO).map(([id, t0]) => { const d = DURS[id] ?? (LINE[id]?.text.length || 30) * .065; return { id, t0, t1: Math.min(t0 + Math.max(1.8, d + 1.25), DUR - .05), text: LINE[id]?.text || '' }; });
SUBS.forEach((s, i) => { if (SUBS[i + 1] && s.t1 > SUBS[i + 1].t0 - .1) s.t1 = SUBS[i + 1].t0 - .1; });

// ——— Colour block cache ———
const REG = [[0, 0], [2.2, -1.3], [-1.8, 1.9], [1.5, 2.2]];
const SHIFT = [[4, -5], [-6, 4], [5, 5], [-5, -4]];
const cache = new Map();
function layer(v, name) {
  const k = v.id + ':' + name; if (cache.has(k)) return cache.get(k);
  const d = v.layers[name], c = mk(), x = c.getContext('2d');
  d.draw(x); const hk = hash(k.length * 7.3 + k.charCodeAt(0)); inkify(c, { speck: d.speck ?? .3, grain: (d.grain || 0) * 1.7, gx: hk * 400 - 200, baren: d.baren ?? (d.g ? .38 : .12), bx: (hk - .5) * 300, by: (hash(hk) - .5) * 200 });
  cache.set(k, c); return c;
}
function revFor(i, g, t) {
  const list = i === 0 ? T.print1 : i === 7 ? T.print8 : null;
  if (!list) return 1;
  return clamp((t - list[g]) / REVEAL_DUR);
}

// ——— Title slips (per view) ———
const SERIES = '峠八景';
const CART = [
  { x: 1800, y: 74, title: '一 峠の秋', seal: '旅' },
  { x: 120, y: 74, title: '二 持ち物', seal: '旅' },
  { x: 120, y: 74, title: '三 最後の食', seal: '旅' },
  { x: 1800, y: 74, title: '四 登り', seal: '旅' },
  { x: 120, y: 74, title: '五 夕の矢', seal: '旅' },
  null,
  { x: 1800, y: 74, title: '七 氷河', seal: '氷' },
  { x: 120, y: 74, title: '八 一九九一', seal: '氷' },
];
const CART_T = [T.cart.v1, T.cart.v2, T.cart.v3, null, T.cart.v5, null, T.cart.v7, T.cart.v8];

function drawSheet(i, t, M) {
  const v = VIEWS[i];
  ctx.save(); ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  if (i % 2) { ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); ctx.drawImage(TX.paper, 0, 0); ctx.restore(); } else ctx.drawImage(TX.paper, 0, 0);
  let borderDone = false;
  const border = () => {
    if (borderDone) return; borderDone = true;
    const r = revFor(i, 0, t); if (r <= 0) return;
    stampFn(ctx, x => { x.strokeStyle = PAL.sumi; x.lineWidth = 3.4; x.strokeRect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0); x.lineWidth = 1.3; x.strokeRect(FR.x0 - 9, FR.y0 - 9, FR.x1 - FR.x0 + 18, FR.y1 - FR.y0 + 18); }, r, SHIFT[0]);
  };
  const blank = (i === 7 && t < T.print8[0]);
  if (!blank) {
    ctx.save(); ctx.beginPath(); ctx.rect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0); ctx.clip();
    const R = {
      L: name => { const g = v.layers[name].g; stampLayer(ctx, layer(v, name), revFor(i, g, t), REG[g], SHIFT[g]); },
      D: (g, fn) => { const r = revFor(i, g, t); if (r >= 1) { ctx.save(); ctx.translate(REG[g][0], REG[g][1]); fn(ctx); ctx.restore(); } else stampFn(ctx, fn, r, SHIFT[g]); },
      border: () => { ctx.restore(); border(); ctx.save(); ctx.beginPath(); ctx.rect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0); ctx.clip(); },
    };
    v.paint(ctx, t, R);
    ctx.restore();
    border();
    const ct = CART_T[i], C = CART[i];
    if (C && ((ct && t > ct[0]) || QS.has('cart'))) {
      const p = QS.has('cart') ? 1 : clamp((t - ct[0]) / .35), sp = QS.has('cart') ? 1 : clamp((t - ct[1]) / .3);
      stampFn(ctx, x => { const b = cartouche(x, C.x, C.y, C.title, { series: SERIES }); C._b = b; }, p, [0, -14]);
      if (C._b) drawSeal(ctx, C.seal, C.x, C._b.y0 + C._b.h + 58, 62, sp, { seed: i + 3, rot: (hash(i) - .5) * .06 });
    }
    if (i === 0) titleCard(t);
  }
  ctx.globalAlpha = 1; ctx.drawImage(TX.fiber, 0, 0);
  ctx.restore(); ctx.restore();
}

// ——— Film title (a slip laid on the first print) ———
function titleCard(t) {
  if (!QS.has('title') && (t < T.title[0] || t > T.title[1] + .6)) return;
  const a = QS.has('title') ? 1 : clamp((t - T.title[0]) / .3), out = QS.has('title') ? 0 : ss(seg(t, T.title[1], T.title[1] + .6));
  ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, -out * 30);
  stampFn(ctx, x => {
    const x0 = 560, y0 = 120, w = 800, h = 170;
    x.fillStyle = '#f3e7c6'; x.fillRect(x0, y0, w, h); x.fillStyle = PAL.beniL; x.fillRect(x0, y0 + h - 44, w, 44);
    x.strokeStyle = PAL.sumi; x.lineWidth = 3; x.strokeRect(x0, y0, w, h); x.lineWidth = 1.2; x.strokeRect(x0 + 6, y0 + 6, w - 12, h - 12);
    x.lineWidth = 1.5; x.beginPath(); x.moveTo(x0 + 6, y0 + h - 44); x.lineTo(x0 + w - 6, y0 + h - 44); x.stroke();
    x.fillStyle = PAL.sumi; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '700 58px Shippori'; x.fillText('The Man the Glacier Kept', x0 + w / 2, y0 + 62);
    x.font = '500 22px Shippori'; x.fillText('E I G H T   V I E W S   O F   O N E   P A S S', x0 + w / 2, y0 + h - 22);
  }, a, [0, -12]);
  drawSeal(ctx, '氷旅', 1000, 330, 80, QS.has('title') ? 1 : clamp((t - T.title[0] - .45) / .3), { seed: 9, rot: .03 });
  ctx.restore();
}

// ——— Camera ———
const C = i => [SLOT(i) + 960, 540];
function camera(t) {
  let cx, cy, z = 1, rot = 0;
  const pan = (a, b, t0, t1) => { const u = eio(seg(t, t0, t1)); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; };
  if (t < T.v1[1]) {
    const u = ss(seg(t, .3, 5.6));
    cx = SLOT(0) + lerp(1460, 960, u);
    cy = lerp(742, 540, u); z = lerp(2.7, 1, u);
    z *= 1 + .012 * ss(seg(t, 5.6, T.v1[1]));
    return { cx, cy, z, rot };
  }
  const keys = ['pan12', 'pan23', 'pan34', 'pan45', 'pan56', 'pan67', 'pan78'];
  const starts = [C(0), C(1), C(2), C(3), C(4), C(5), C(6)], ends = [C(1), C(2), C(3), C(4), C(5), C(6), C(7)];
  let placed = false;
  for (let k = 0; k < keys.length && !placed; k++) {
    const iv = T[keys[k]];
    if (t < iv[0]) { [cx, cy] = starts[k]; placed = true; }
    else if (t < iv[1]) { [cx, cy] = pan(starts[k], ends[k], ...iv); placed = true; }
  }
  if (!placed) [cx, cy] = C(7);
  if (t >= T.v2[0] && t < T.pan23[0]) { const u = ss(seg(t, T.v2[0] + 1, T.pan23[0])); z = 1 + .05 * u; cx -= 30 * u; }
  if (t >= T.v7[0] && t < T.pan78[0]) { const u = ss(seg(t, T.v7[0] + 1, T.pan78[0])); z = 1 + .045 * u; }
  if (t >= T.v8[0]) { const u = ss(seg(t, T.print8[3], DUR)); z = 1 + .02 * u; }
  return { cx, cy, z, rot };
}
function camMatrix(cam) {
  const c = Math.cos(cam.rot) * cam.z, s = Math.sin(cam.rot) * cam.z;
  return [c, s, -s, c, W / 2 - (c * cam.cx - s * cam.cy), H / 2 - (s * cam.cx + c * cam.cy)];
}

// ——— Mounting scroll ———
const BAND = [-430, 1510];
function drawScroll(M, t) {
  ctx.save(); ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
  const TOTAL = SLOT(0) + W;
  ctx.fillStyle = PAL.mount; ctx.fillRect(-60, BAND[0], TOTAL + 120, BAND[1] - BAND[0]);
  ctx.globalAlpha = .55; ctx.globalCompositeOperation = 'multiply';
  for (let X = -60; X < TOTAL + 60; X += W) for (let Y = BAND[0]; Y < BAND[1]; Y += H) ctx.drawImage(TX.paper, X, Y);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = PAL.mountD; ctx.fillRect(-60, BAND[0], TOTAL + 120, 34); ctx.fillRect(-60, BAND[1] - 34, TOTAL + 120, 34);
  const rx = -160, rw = 150;
  const g = ctx.createLinearGradient(rx, 0, rx + rw, 0); g.addColorStop(0, '#8f7a55'); g.addColorStop(.35, '#d8c69c'); g.addColorStop(1, '#8a744e');
  ctx.fillStyle = g; ctx.fillRect(rx, BAND[0] - 30, rw, BAND[1] - BAND[0] + 60);
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(rx + 30, BAND[0] - 120, rw - 60, 90); ctx.fillRect(rx + 30, BAND[1] + 30, rw - 60, 90);
  ctx.restore();
}

// ——— Subtitles ———
function subtitle(t) {
  const s = SUBS.find(s => t >= s.t0 - .05 && t < s.t1); if (!s) return;
  const a = clamp((t - s.t0 + .05) / .22), fo = 1 - clamp((t - (s.t1 - .25)) / .25);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = '500 42px Shippori'; const tw = ctx.measureText(s.text).width, w = tw + 150, h = 74, x0 = (W - w) / 2, y0 = H - 72 - h;
  ctx.globalAlpha = fo;
  stampFn(ctx, x => {
    x.fillStyle = 'rgba(243,231,198,.96)'; x.fillRect(x0, y0, w, h);
    x.strokeStyle = PAL.sumi; x.lineWidth = 2.6; x.strokeRect(x0, y0, w, h); x.lineWidth = 1; x.strokeRect(x0 + 5, y0 + 5, w - 10, h - 10);
    x.fillStyle = PAL.sumi; x.textAlign = 'left'; x.textBaseline = 'middle'; x.font = '500 42px Shippori'; x.fillText(s.text, x0 + 96, y0 + h / 2 + 2);
  }, a, [0, 0]);
  const sc = sealCanvas('旅', 40, { seed: 17 }); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = fo * a * .92; ctx.drawImage(sc, x0 + 30, y0 + h / 2 - sc.height / 2);
  ctx.restore();
}

// ——— The snow erases the print; only the seal remains (paper is the white) ———
function eraseToPaper(t) {
  const e = ss(seg(t, T.erase[0], T.erase[1])); if (e <= 0) return;
  if (t >= T.pan67[0]) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = e; ctx.drawImage(TX.paper, 0, 0);
  ctx.globalAlpha = 1; ctx.drawImage(TX.fiber, 0, 0);
  if (e >= 1) drawSeal(ctx, '氷', W / 2, H / 2 - 40, 120, clamp((t - T.erase[1]) / .3), { seed: 23, rot: .02 });
  ctx.restore();
}

// ——— Ending: the print fades back to paper, the seal alone ———
function sealAlone(t) {
  const a = ss(seg(t, T.sealAlone[0], T.sealAlone[0] + .9)); if (a <= 0) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = a; ctx.drawImage(TX.paper, 0, 0); ctx.drawImage(TX.fiber, 0, 0);
  ctx.globalAlpha = 1;
  const sp = clamp((t - T.sealAlone[0] - .5) / .3);
  drawSeal(ctx, '氷旅', W / 2, H / 2 - 40, 130, sp, { seed: 29, rot: .02 });
  ctx.restore();
}

// ——— Events ———
function events() {
  const ev = [], add = (type, t, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  for (const [id, t0] of Object.entries(VO)) add('vo', t0, { id });
  T.print1.forEach((t, i) => { add('block', t - .12, { v: .5 + i * .1 }); add('baren', t, { d: .36, v: .7 }); });
  T.print8.forEach((t) => { add('block', t - .1, { v: .7 }); add('baren', t, { d: .34, v: .85 }); });
  add('slip', T.title[0] - .05, { v: .6 }); add('seal', T.title[0] + .45, { v: .8 }); add('slip', T.title[1], { v: .4 });
  for (const k of ['v1', 'v2', 'v3', 'v5', 'v7', 'v8']) { add('slip', T.cart[k][0], { v: .45 }); add('seal', T.cart[k][1], { v: k === 'v8' ? 1.1 : .85 }); }
  add('seal', T.erase[1] + .1, { v: .9 });
  add('seal', T.sealAlone[0] + .5, { v: 1.0 });
  for (const k of ['pan12', 'pan23', 'pan34', 'pan45', 'pan56', 'pan67', 'pan78']) add('scroll', T[k][0], { d: T[k][1] - T[k][0], v: k === 'pan45' ? .95 : .7 });
  add('amb', 0.25, { w: 'wind', d: T.pan12[0] - .25, v: .5 });
  add('amb', T.v2[0] + .3, { w: 'room', d: T.pan34[0] - T.v2[0] - .3, v: .4 });
  add('amb', T.v3[0] + .3, { w: 'wind', d: T.pan45[0] - T.v3[0] - .3, v: .6 });
  add('amb', T.v4[0] + .2, { w: 'highwind', d: T.ma[0] - T.v4[0] - .2, v: 1 });
  add('amb', T.erase[0], { w: 'snow', d: T.pan67[0] - T.erase[0], v: .8 });
  add('amb', T.v7[0] + .2, { w: 'deepcold', d: T.pan78[0] - T.v7[0] - .2, v: .7 });
  add('amb', T.v8[0] + .2, { w: 'wind', d: DUR - T.v8[0] - .2, v: .5 });
  for (let t = 3.5; t < 8.5; t += .48) add('step', t, { m: 'dirt', v: .5 });
  add('setdown', 10.1, { m: 'wood' }); add('setdown', 11.2, { m: 'fur' }); add('setdown', 12.3, { m: 'grass' }); add('setdown', 13.4, { m: 'leather' });
  add('knife', 19.0); add('board', 20.6);
  add('gust', 26.5, { v: 1.1 }); add('gust', 28.9, { v: 1.2 });
  add('silence', T.ma[0], { d: T.arrow - T.ma[0] });
  add('whoosh', T.arrow, { v: 1 }); add('thump', T.fall[0] + .5, { v: 1 });
  add('bell', 37.0); add('bell', 41.5, { v: .7 });
  add('icecreak', 46.0); add('icecreak', 48.2, { v: .8 });
  add('step', 52.3, { m: 'snow', v: .6 }); add('step', 53.0, { m: 'snow', v: .6 }); add('point', 53.9);
  return ev.sort((a, b) => a.t - b.t);
}

// ——— Main render ———
function render(t) {
  if (QS.has('poster') && !render._inPoster) { render._inPoster = true; try { return poster(); } finally { render._inPoster = false; } }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#161a22'; ctx.fillRect(0, 0, W, H);
  const cam = camera(t), M = camMatrix(cam);
  drawScroll(M, t);
  const half = (W / 2) / cam.z * 1.6;
  for (let i = 0; i < 8; i++) {
    const x0 = SLOT(i); if (x0 + W < cam.cx - half || x0 > cam.cx + half) continue;
    const Mi = [M[0], M[1], M[2], M[3], M[4] + M[0] * x0, M[5] + M[1] * x0];
    drawSheet(i, t, Mi);
  }
  eraseToPaper(t);
  if (!NOSUB) subtitle(t);
  sealAlone(t);
}

function poster() {
  render(7.0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const x0 = 560, y0 = 330, w = 800, h = 170;
  ctx.fillStyle = '#f3e7c6'; ctx.fillRect(x0, y0, w, h); ctx.fillStyle = PAL.beniL; ctx.fillRect(x0, y0 + h - 44, w, 44);
  ctx.strokeStyle = PAL.sumi; x0: ctx.lineWidth = 3; ctx.strokeRect(x0, y0, w, h); ctx.lineWidth = 1.2; ctx.strokeRect(x0 + 6, y0 + 6, w - 12, h - 12);
  ctx.fillStyle = PAL.sumi; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '700 58px Shippori'; ctx.fillText('The Man the Glacier Kept', x0 + w / 2, y0 + 62);
  ctx.font = '500 22px Shippori'; ctx.fillText('E I G H T   V I E W S   O F   O N E   P A S S', x0 + w / 2, y0 + h - 22);
  ctx.restore();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); drawSeal(ctx, '氷旅', 1000, 560, 80, 1, { seed: 9 }); ctx.restore();
}

window.render = render; window.DUR = DUR; window.EV = events(); window.SUBS = SUBS;
window.TEXTS = (t) => {
  const out = [];
  for (const s of SUBS) if (t >= s.t0 - .05 && t < s.t1) out.push({ id: 'sub_' + s.id, text: s.text, x0: 200, y0: H - 220, x1: W - 200, y1: H - 60 });
  return out;
};
render(parseFloat(QS.get('t') ?? '20'));
window.READY = true;
