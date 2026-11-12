// "Falling Into a Black Hole" — Whiteboard Explainer, 30 s sample. One board, three pens, no hands.
import * as W from './engine/wb.js';
import { clamp, lerp, TAU, mulberry } from '/core/lib.js';

const { INK } = W;
const q = new URLSearchParams(location.search);
export const BPM = 96, BEAT = 60 / BPM, T0 = 6.0;            // title lands on the bar-1 downbeat
export const VO = { v01: 0.9, v02: 6.3, v03: 10.7, v04: 16.4, v05: 22.8 };
export const END = 30;

export async function build() {
  await W.loadFont('tech', 'fonts/EMSTech.json');
  const lines = await (await fetch('lines.json')).json();
  const durs = await (await fetch('voices/dur.json')).json();

  const tl = new W.Timeline();
  const K = new W.Pen('black', INK.black, { park: [2200, 1320] });
  const O = new W.Pen('orange', INK.orange, { park: [2350, 1150] });
  const B = new W.Pen('blue', INK.blue, { park: [2100, 1420] });
  const PENS = [K, O, B];
  const T = W.text, R = mulberry(4242);

  // ─── layout (world units)
  const EARTH = [1600, 3260];                                  // circle centre; r 360
  const HOLE = [4750, 2350];                                   // event-horizon circle centre; r 470
  const SPAG = [6350, 2450];                                   // spaghetti stickman (feet)
  const CLK = [4750, 3350];                                    // the outside clock

  // ghost marks: faint residue of old lessons
  const ghosts = [];
  const gR = mulberry(99);
  for (let i = 0; i < 40; i++) {
    const x = gR() * 7400 + 200, y = gR() * 4000 + 200, k = gR();
    const o = { w: 12, alpha: .05 + gR() * .05, color: gR() < .2 ? '#8aa0c8' : '#9aa0a8' };
    if (k < .3) ghosts.push(...T(['x = 4', 'lab 3', 'TUE', 'q.2', 'f(x)', 'pH 7', 'due fri', '→ 12', 'ok!'][i % 9], x, y, { h: 50 + gR() * 40, ...o }));
    else if (k < .55) ghosts.push(W.circle(x, y, 40 + gR() * 110, o));
    else if (k < .8) ghosts.push(...W.arrow(x, y, x + (gR() - .5) * 500, y + (gR() - .5) * 300, o));
    else ghosts.push(W.line(x, y, x + 200 + gR() * 500, y + (gR() - .5) * 80, o));
  }

  // ─── stickmen (y = feet)
  function stickman(x, y, s, o = {}) {
    const k = { w: 8 * s, ...o };
    return [
      W.circle(x, y - 262 * s, 50 * s, { ...k, w: 7 * s }),
      W.line(x, y - 212 * s, x, y - 96 * s, k),
      W.line(x - 60 * s, y - 172 * s, x, y - 168 * s, k), W.line(x, y - 168 * s, x + 60 * s, y - 176 * s, k),
      W.line(x, y - 96 * s, x - 46 * s, y, k), W.line(x, y - 96 * s, x + 46 * s, y, k),
    ];
  }
  function stickmanFall(x, y, s, tilt = .45, o = {}) {          // tilted, arms up, legs trailing
    const k = { w: 8 * s, ...o }, c = Math.cos(tilt), si = Math.sin(tilt);
    const pt = (dx, dy) => [x + dx * c - dy * si, y + dx * si + dy * c];
    const L = (a, b) => W.line(...pt(...a), ...pt(...b), k);
    const [hx, hy] = pt(0, -262 * s);
    return [
      W.circle(hx, hy, 50 * s, { ...k, w: 7 * s }),
      L([0, -212 * s], [0, -96 * s]),
      L([0, -190 * s], [-70 * s, -250 * s]), L([0, -186 * s], [66 * s, -252 * s]),
      L([0, -96 * s], [-52 * s, -30 * s]), L([0, -96 * s], [40 * s, -14 * s]),
    ];
  }
  function stickmanSpag(x, y, s, o = {}) {                      // stretched: tiny head, very long body
    const k = { w: 7 * s, ...o };
    return [
      W.circle(x, y - 520 * s, 30 * s, { ...k, w: 6 * s }),
      W.curve([[x, y - 490 * s], [x + 10 * s, y - 300 * s], [x - 10 * s, y - 120 * s], [x, y]], k),
      W.line(x - 34 * s, y - 430 * s, x + 34 * s, y - 436 * s, k),
      W.line(x - 20 * s, y, x + 20 * s, y + 6 * s, k),
    ];
  }

  const D = (pen, shapes, a, b, o = {}) => tl.draw(pen, shapes, a, { by: b, ...o });

  // text registry for readcheck; label schedules its own window
  const texts = [];
  const label = (pen, str, x, y, o, t0, t1, pass = false) => {
    const s = T(str, x, y, o);
    const x0 = s.x0 - 8, x1 = s.x0 + s.width + 8, h = o.h ?? 60;
    texts.push({ t0, t1, text: str, box: [x0, y - h - 12, x1, y + 14], pass });
    D(pen, s, t0, Math.min(t1, t0 + 1.2));
    return s;
  };

  // ═══ A · HOOK — you, on the Earth (0–5.5)
  D(K, W.circle(EARTH[0], EARTH[1], 360, { w: 10, speed: 2800 }), 0.35, 1.6);
  label(K, 'Earth', EARTH[0] - 80, EARTH[1] + 220, { h: 58, w: 8 }, 2.0, 5.0);
  D(K, stickman(EARTH[0], EARTH[1] - 358, 1), 3.3, 4.5);
  D(O, W.arrow(EARTH[0] + 165, EARTH[1] - 560, EARTH[0] + 60, EARTH[1] - 500, { w: 6, head: 20, curve: [EARTH[0] + 95, EARTH[1] - 555] }), 3.7, 4.25);
  label(O, 'you', EARTH[0] + 175, EARTH[1] - 590, { h: 52, w: 7, color: INK.orange }, 4.3, 4.9, true);

  // ═══ TITLE (bar 1 = 6.0)
  D(K, T('FALLING INTO', 950, 760, { h: 150, w: 13 }), 6.0, 7.8, { minGap: .03, maxGap: .08 });
  D(K, T('A BLACK HOLE', 965, 980, { h: 150, w: 13 }), 7.85, 9.3, { minGap: .03, maxGap: .07 });
  D(O, W.curve([[950, 1050], [1500, 1038], [2050, 1052], [2320, 1040]], { w: 14, over: 24 }), 9.35, 9.85);
  texts.push({ t0: 6.0, t1: 9.4, text: 'FALLING INTO A BLACK HOLE', box: [940, 590, 2330, 1000] });

  // ═══ B · THE HOLE (9.9–15.8)
  D(K, W.circle(HOLE[0], HOLE[1], 470, { w: 11 }), 9.9, 11.2);
  const swirl = [];
  for (let k = 0; k < 3; k++) {
    const a = -2.6 + k * 2.1, r0 = 760;
    swirl.push(...W.arrow(HOLE[0] + Math.cos(a) * r0, HOLE[1] + Math.sin(a) * r0 * .72,
      HOLE[0] + Math.cos(a + .9) * 560, HOLE[1] + Math.sin(a + .9) * 560 * .72,
      { w: 7, head: 26, curve: [HOLE[0] + Math.cos(a + .45) * 740, HOLE[1] + Math.sin(a + .45) * 740 * .72] }));
  }
  D(B, swirl, 11.3, 12.6, { minGap: .04, maxGap: .12 });
  label(B, 'nothing escapes', HOLE[0] - 420, HOLE[1] - 480, { h: 46, w: 6, color: INK.blue }, 12.7, 16.15);
  label(K, 'event horizon', HOLE[0] + 490, HOLE[1] + 560, { h: 52, w: 7 }, 13.4, 16.15);
  D(K, W.line(HOLE[0] + 380, HOLE[1] + 330, HOLE[0] + 470, HOLE[1] + 490, { w: 5 }), 14.7, 15.1);

  // ═══ C · SPAGHETTIFICATION (16.2–21.8)
  D(K, stickmanFall(5500, 2100, .8), 16.2, 17.4);
  D(B, W.dashed([[5330, 1860], [5410, 1950], [5460, 2020]], { w: 6, dash: 34, gap: 22 }), 17.0, 17.5);
  D(O, W.arrow(SPAG[0] - 120, SPAG[1] - 560, SPAG[0] - 120, SPAG[1] - 40, { w: 7, head: 26 }), 17.6, 18.4);
  D(O, W.arrow(SPAG[0] + 120, SPAG[1] - 40, SPAG[0] + 120, SPAG[1] - 560, { w: 7, head: 26 }), 18.4, 19.2);
  D(K, stickmanSpag(SPAG[0], SPAG[1], 1), 18.6, 20.0);
  label(O, 'spaghettification', 5450, SPAG[1] + 120, { h: 48, w: 7 }, 19.4, 23.0);

  // ═══ D · FROZEN, FROM OUTSIDE (22.2–26.6)
  D(B, W.circle(CLK[0], CLK[1], 130, { w: 8 }), 23.2, 24.0);
  D(B, W.line(CLK[0], CLK[1], CLK[0], CLK[1] - 88, { w: 6 }), 24.0, 24.35);
  D(B, W.line(CLK[0], CLK[1], CLK[0] + 62, CLK[1] + 24, { w: 6 }), 24.35, 24.7);
  label(K, 'forever', CLK[0] - 110, CLK[1] + 140, { h: 56, w: 8 }, 23.5, 25.9);
  D(B, stickmanFall(3850, 2250, .55, .25, { alpha: .45 }), 25.6, 26.5);
  label(O, 'fading...', 3550, 2050, { h: 44, w: 6, color: INK.orange }, 25.8, 26.6, true);

  // ═══ E · END CARD (27.0–30)
  D(K, T('you never get there', 1750, 1560, { h: 110, w: 10 }), 27.0, 28.6, { minGap: .03, maxGap: .07 });
  D(O, W.curve([[1750, 1620], [2100, 1610], [2450, 1622], [2620, 1612]], { w: 12, over: 20 }), 28.65, 29.1);
  texts.push({ t0: 27.0, t1: END - .05, text: 'you never get there', box: [1740, 1430, 3350, 1590] });

  tl.cue(.3, 'cap'); tl.cue(29.4, 'capOn');
  tl.end();

  // ─── camera (t, x, y, zoom, rot, ease)
  const cam = new W.Camera([
    [0, 1600, 3105, 1.0],
    [4.95, 1600, 3105, 1.0, 0, 'l'],                   // hold on the Earth
    [6.0, 1650, 850, .85, 0, 'io'],                    // tilt up to the title
    [9.5, 1650, 850, .85, 0, 'l'],                     // hold on the title
    [10.6, 4750, 2350, .88, 0, 'io'],                  // pan right to the hole
    [15.85, 4750, 2380, .92, 0, 'l'],                  // slow push-in
    [16.8, 5650, 2400, .98, 0, 'io'],                  // push to the spaghetti
    [21.9, 5650, 2400, .98, 0, 'l'],                   // hold
    [23.0, 4400, 2830, .55, 0, 'io'],                  // pull back: hole + clock
    [26.0, 4400, 2830, .55, 0, 'l'],
    [26.8, 2100, 1350, .5, 0, 'io'],                   // wide: title + end card
    [END, 2110, 1360, .51, 0, 'l'],
  ]);

  const board = new W.Board(tl, { ghosts });
  board.objs.push({ draw: (ctx, t, c) => { for (const e of tl.erasers) W.drawEraser(ctx, e, t, c); } });
  if (!q.has('nopens')) board.objs.push({ draw: (ctx, t, c) => { for (const p of PENS) W.drawMarker(ctx, p, W.penPose(p, t, cam), c, t); } });

  // ─── subtitles (from lines.json + voices/dur.json)
  const subs = lines.map(L => {
    const t0 = VO[L.id] - .08, need = [...L.text].filter(c => !/\s/.test(c)).length / 15 + 1.6;
    return { t0, t1: Math.max(VO[L.id] + (durs[L.id] ?? 4) + .55, t0 + need), text: L.text };
  });
  for (let i = 0; i < subs.length - 1; i++) subs[i].t1 = Math.min(subs[i].t1, subs[i + 1].t0 - .04);
  subs[subs.length - 1].t1 = Math.min(subs[subs.length - 1].t1, END - .1);
  const meas = new OffscreenCanvas(400, 80).getContext('2d');
  meas.font = '44px AD';
  function subRows(s) {
    if (meas.measureText(s.text).width <= 1250) return [s.text];
    const ws = s.text.split(' '); let best = 1, bd = 1e9;
    for (let i = 1; i < ws.length; i++) { const d = Math.abs(meas.measureText(ws.slice(0, i).join(' ')).width - meas.measureText(ws.slice(i).join(' ')).width); if (d < bd) { bd = d; best = i; } }
    return [ws.slice(0, best).join(' '), ws.slice(best).join(' ')];
  }
  function subBox(s) {
    const rows = subRows(s);
    const w = Math.max(...rows.map(r => meas.measureText(r).width)) + 64, h = 70 + (rows.length - 1) * 52;
    return [960 - w / 2, 1038 - h, 960 + w / 2, 1038];
  }
  board.overlays.push({
    draw: (ctx, t) => {
      const s = subs.find(s => t >= s.t0 && t < s.t1); if (!s) return;
      const a = Math.min(1, (t - s.t0) / .12, (s.t1 - t) / .12);
      const [bx0, by0, bx1, by1] = subBox(s), rows = subRows(s);
      ctx.globalAlpha = a * .9; ctx.fillStyle = '#fdfcf8'; ctx.shadowColor = 'rgba(30,30,40,.18)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.roundRect(bx0, by0, bx1 - bx0, by1 - by0, 14); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.globalAlpha = a;
      ctx.fillStyle = INK.orange; ctx.fillRect(bx0 + 22, by1 - 12, 36, 4);
      ctx.fillStyle = '#23262c'; ctx.font = '44px AD'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      rows.forEach((r, i) => ctx.fillText(r, 960, by0 + 37 + i * 52));
    }
  });

  // ─── readcheck: board text + subtitles
  function textsAt(t) {
    const out = [], c = cam.at(t);
    for (const x of texts) if (t >= x.t0 && t < x.t1) {
      const [ax, ay] = W.toScreen(c, x.box[0], x.box[1]);
      const [bx, by] = W.toScreen(c, x.box[2], x.box[3]);
      out.push({ id: 'b' + x.text, text: x.text, x0: Math.min(ax, bx), y0: Math.min(ay, by), x1: Math.max(ax, bx), y1: Math.max(ay, by), pass: x.pass });
    }
    for (const s of subs) if (t >= s.t0 && t < s.t1) { const b = subBox(s); out.push({ id: 'sub', text: s.text, x0: b[0], y0: b[1], x1: b[2], y1: b[3] }); }
    return out;
  }

  // ─── frame render with camera motion blur
  const off = new OffscreenCanvas(1920, 1080), oc = off.getContext('2d');
  const noSubs = q.has('nosubs');
  if (noSubs) board.overlays.length = 0;
  const posterCam = new W.Camera([[0, 2100, 1350, .5]]);
  function render(ctx, t) {
    if (q.has('poster')) { board.render(ctx, t, posterCam); return; }
    const dt = 1 / 24, a = cam.at(t), b = cam.at(Math.max(0, t - dt));
    const sp = Math.hypot((a.x - b.x) * a.z, (a.y - b.y) * a.z) + Math.abs(Math.log(a.z / b.z)) * 900;
    const N = sp > 14 ? Math.min(12, Math.ceil(sp * .5 / 4)) : 1;
    if (N === 1) { board.render(ctx, t, cam); return; }
    const ov = board.overlays; board.overlays = [];
    for (let i = 0; i < N; i++) {
      board.render(oc, t - dt * .5 * i / (N - 1), cam);
      ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(off, 0, 0);
    }
    ctx.globalAlpha = 1; board.overlays = ov;
    for (const o of ov) { ctx.save(); o.draw(ctx, t); ctx.restore(); }
  }

  const ev = [...tl.ev, ...Object.entries(VO).map(([id, t]) => ({ t, type: 'vo', id }))].sort((a, b) => a.t - b.t);
  for (const e of ev) if (e.x != null) { const c = cam.at(e.t), [px, py] = W.toScreen(c, e.x, e.y); e.pan = +clamp((px - 960) / 1400, -.7, .7).toFixed(2); e.z = +c.z.toFixed(2); e.on = px > -100 && px < 2020 && py > -100 && py < 1180 ? 1 : 0; }
  return { dur: END, render, ev, subs, texts: textsAt, cam, tl, VO };
}
