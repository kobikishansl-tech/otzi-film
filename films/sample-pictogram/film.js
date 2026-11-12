// FALLING INTO A BLACK HOLE — Pictogram Motion, 30 s sample. Six shots, col-wipe cuts, one yellow accent.
// render(t) draws film second t; ?a=&b= renders a span of it, ?nocap=1 hides the subtitles.
(function () {
  const { W, H, E, PAL, clamp, lerp, inv, rgba, mix } = G;
  const F = G.F;
  const FULL = 30;

  // ─── shot list (film seconds) ───
  const SHOTS = [
    { id: 'S1', t0: 0.0, kind: 'earth' },
    { id: 'S2', t0: 6.0, kind: 'title' },
    { id: 'S3', t0: 10.0, kind: 'hole' },
    { id: 'S4', t0: 16.0, kind: 'spag' },
    { id: 'S5', t0: 22.0, kind: 'frozen' },
    { id: 'S6', t0: 26.5, kind: 'end' },
  ];
  SHOTS.forEach((s, i) => (s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : FULL));
  const CUTS = SHOTS.slice(1).map((s) => s.t0);

  // ─── sound / cue events (film seconds) ───
  const EV = [
    { t: 0.0, type: 'cut' }, { t: 0.5, type: 'pop' },
    { t: 2.0, type: 'chip' },
    { t: 3.7, type: 'arrow' },
    { t: 6.0, type: 'cut' }, { t: 6.4, type: 'slam' },
    { t: 10.0, type: 'cut' }, { t: 10.6, type: 'ring' },
    { t: 11.4, type: 'arrow' }, { t: 12.2, type: 'arrow' }, { t: 13.0, type: 'arrow' },
    { t: 11.0, type: 'chip' },
    { t: 16.0, type: 'cut' }, { t: 16.6, type: 'rise' }, { t: 17.0, type: 'chip' },
    { t: 22.0, type: 'cut' }, { t: 22.4, type: 'chip' },
    ...[23.0, 23.5, 24.0, 24.5, 25.0, 25.5].map((t) => ({ t, type: 'tick' })),
    { t: 26.5, type: 'cut' }, { t: 27.0, type: 'slam' },
    ...Object.entries({ v01: 0.9, v02: 6.3, v03: 10.7, v04: 16.4, v05: 22.8 }).map(([id, t]) => ({ t, type: 'vo', id })),
  ];

  // ─── helpers ───
  function stageDisc(ctx, x, y, r, col) {
    G.disc(ctx, x, y, r, col);
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    const g = ctx.createLinearGradient(x - r, y - r, x + r * 0.2, y + r);
    g.addColorStop(0, 'rgba(255,255,255,0.07)'); g.addColorStop(0.6, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.10)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }
  function person(ctx, x, y, s, col, o = {}) {          // y = feet; sx/sy squash & stretch
    const sx = o.sx ?? 1, sy = o.sy ?? 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.globalAlpha *= (o.a ?? 1);
    const w = o.w ?? 11 * s;
    G.disc(ctx, 0, -262 * s, 48 * s, col);
    G.seg(ctx, [0, -210 * s], [0, -96 * s], w, col);
    G.seg(ctx, [-62 * s, -170 * s], [0, -164 * s], w * .8, col);
    G.seg(ctx, [0, -164 * s], [62 * s, -174 * s], w * .8, col);
    G.seg(ctx, [0, -96 * s], [-48 * s, 0], w * .8, col);
    G.seg(ctx, [0, -96 * s], [48 * s, 0], w * .8, col);
    ctx.restore();
  }
  function arrow(ctx, a, b, w, col, bend) {
    const mx = (a[0] + b[0]) / 2 + (bend ? bend[0] : 0), my = (a[1] + b[1]) / 2 + (bend ? bend[1] : 0);
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx, my, b[0], b[1]); ctx.stroke();
    const ang = Math.atan2(b[1] - my, b[0] - mx), hl = w * 3.2;
    G.poly(ctx, [[b[0] + Math.cos(ang) * hl * .4, b[1] + Math.sin(ang) * hl * .4],
      [b[0] - hl * Math.cos(ang - .5), b[1] - hl * Math.sin(ang - .5)],
      [b[0] - hl * Math.cos(ang + .5), b[1] - hl * Math.sin(ang + .5)]], col);
  }
  function chip(ctx, x, y, en, mono, col, lt) {
    G.maskText(ctx, en, x, y, F.en(900, 84), col, E.oExp(inv(0, .35, lt)), { ls: '-2px' });
    G.hair(ctx, x + 2, y + 26, 320, G.UMB, E.oExp(inv(.1, .5, lt)), 5);
    G.maskText(ctx, mono, x + 2, y + 78, F.mono(26), rgba(col, .8), inv(.2, .6, lt), { ls: '3px' });
  }
  function chipBox(en, x, y) {
    cme.font = F.en(900, 84);
    const w = cme.measureText(en).width + 30;
    return [x - 10, y - 84, x + w, y + 92];
  }
  const cme = G.canvas(400, 80).getContext('2d');

  // ─── shots ───
  function sEarth(ctx, t) {
    const P = PAL.navy, lt = t, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('navy', 21, { spread: .8, density: .42, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 14 * Math.min(lt, 2) + Math.sin(j * 1.7) * 18);
    stageDisc(ctx, 960, 560, 430, P.t[0]);
    const pop = E.oBack(inv(.2, .9, lt));
    G.disc(ctx, 960, 800, 170 * pop, PAL.teal.t[2]);
    G.ring(ctx, 960, 800, 170 * pop + 16, 5, rgba(PAL.teal.t[4], .5));
    if (pop > .95) person(ctx, 960, 632, .62, fg, { a: E.oExp(inv(1.0, 1.5, lt)) });
    const ap = E.io(inv(3.6, 4.15, lt));
    if (ap > 0) arrow(ctx, [1210, 430 + 40 * (1 - ap)], [1042, 560 + 40 * (1 - ap)], 8, G.UMB, [30 * ap, -10]);
    chip(ctx, 124, 250, 'EARTH', 'HOME, FOR NOW', fg, inv(1.9, 2.4, lt));
  }
  function sTitle(ctx, t) {
    const P = PAL.ink, lt = t - 6.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('ink', 33, { spread: .55, density: .38, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 10 * Math.min(lt, 1.5));
    const x = 124;
    G.maskText(ctx, 'FALLING INTO', x, 430, F.en(900, 150), fg, inv(.4, .95, lt), { ls: '-4px' });
    G.maskText(ctx, 'A BLACK HOLE', x, 620, F.en(900, 150), G.UMB, inv(.7, 1.25, lt), { ls: '-4px' });
    G.hair(ctx, x, 680, 900, rgba(fg, .55), E.oExp(inv(1.1, 1.7, lt)), 3);
    G.maskText(ctx, 'A 30 SECOND PHYSICS FILM', x, 760, F.mono(28), rgba(fg, .8), inv(1.3, 1.8, lt), { ls: '3px' });
    const p = E.io(inv(2.2, 3.6, lt));
    if (p > 0) {                                        // a tiny figure drifts toward a small dark disc
      const fx = lerp(1450, 1660, p), fy = 300 + 60 * p;
      G.disc(ctx, 1720, 420, 60, '#05070c'); G.ring(ctx, 1720, 420, 78, 4, rgba(G.UMB, .8));
      person(ctx, fx, fy + 90, .4, rgba(fg, .9), { a: .95 });
    }
  }
  function sHole(ctx, t) {
    const P = PAL.ink, lt = t - 10.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('ink', 47, { spread: .5, density: .32, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 8 * Math.min(lt, 1.5));
    stageDisc(ctx, 960, 560, 430, PAL.navy.t[0]);
    const grow = E.oBack(inv(.2, .8, lt));
    G.disc(ctx, 960, 560, 180 * grow, '#05070c');
    G.ring(ctx, 960, 560, 236 * grow, 9, rgba(G.UMB, .95));
    G.ring(ctx, 960, 560, 268 * grow, 3, rgba(G.UMB, .35));
    const sw = [[1180, 330, 1050, 470, 60], [700, 760, 850, 620, -60], [1230, 740, 1080, 610, -50]];
    sw.forEach(([ax, ay, bx, by, bd], k) => {
      const p = E.io(inv(.8 + k * .8, 1.35 + k * .8, lt));
      if (p <= 0) return;
      const ex = lerp(ax, bx, p), ey = lerp(ay, by, p);
      arrow(ctx, [ax, ay], [ex, ey], 7, k % 2 ? rgba(fg, .9) : G.UMB, [0, bd * .3]);
    });
    chip(ctx, 124, 250, 'NOTHING ESCAPES', 'NOT EVEN LIGHT', fg, inv(1.0, 1.5, lt));
  }
  function sSpag(ctx, t) {
    const P = PAL.coral, lt = t - 16.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('coral', 55, { spread: .7, density: .4, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 10 * Math.min(lt, 1.5));
    stageDisc(ctx, 960, 560, 430, P.t[0]);
    const st = E.io3(inv(.6, 4.4, lt));
    const sy = lerp(1, 3.4, st), sx = lerp(1, .42, st);
    person(ctx, 930, 730, .55, fg, { sx, sy, w: 11 * .55 / Math.sqrt(sx) });
    const a1 = E.io(inv(1.1, 1.7, lt)), a2 = E.io(inv(1.9, 2.5, lt));
    if (a1 > 0) arrow(ctx, [660, 380], [660, 380 + 260 * a1], 8, rgba(fg, .9));
    if (a2 > 0) arrow(ctx, [1240, 740], [1240, 740 - 260 * a2], 8, G.UMB);
    chip(ctx, 124, 250, 'SPAGHETTIFICATION', 'STRETCHED, NOT COOKED', fg, inv(1.0, 1.5, lt));
  }
  function sFrozen(ctx, t) {
    const P = PAL.navy, lt = t - 22.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('navy', 69, { spread: .6, density: .34, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 6 * Math.min(lt, 1.5));
    stageDisc(ctx, 960, 560, 430, P.t[0]);
    const grow = E.oBack(inv(.2, .8, lt));
    G.ring(ctx, 1180, 540, 130 * grow, 9, fg);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      G.seg(ctx, [1180 + Math.cos(a) * 130 * grow, 540 + Math.sin(a) * 130 * grow], [1180 + Math.cos(a) * (130 * grow - 14), 540 + Math.sin(a) * (130 * grow - 14)], 5, rgba(fg, .8));
    }
    const ha = -Math.PI / 2 + 1.1 * (1 - E.oExp(inv(.8, 4.2, lt)));      // slows as it approaches 12
    G.seg(ctx, [1180, 540], [1180 + Math.cos(ha) * 86 * grow, 540 + Math.sin(ha) * 86 * grow], 8, G.UMB);
    const hb = -Math.PI / 2 + 2.4 * (1 - E.oExp(inv(.5, 4.4, lt)));
    G.seg(ctx, [1180, 540], [1180 + Math.cos(hb) * 56 * grow, 540 + Math.sin(hb) * 56 * grow], 6, rgba(fg, .9));
    const fade = 1 - .8 * E.io(inv(.5, 3.8, lt));
    person(ctx, 700, 700, .62, fg, { a: fade });
    if (lt > 2.2) G.maskText(ctx, 'fading...', 648, 560, F.mono(26), rgba(G.UMB, fade), inv(2.3, 2.7, lt), { ls: '2px' });
    chip(ctx, 124, 250, 'FOREVER', 'FROM THE OUTSIDE', fg, inv(.4, .9, lt));
  }
  function sEnd(ctx, t) {
    const P = PAL.ink, lt = t - 26.5, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('ink', 81, { spread: .45, density: .3, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 8 * Math.min(lt, 1));
    const x = 124;
    G.maskText(ctx, 'you never get there', x, 520, F.en(900, 116), fg, inv(.5, 1.1, lt), { ls: '-3px' });
    G.hair(ctx, x, 575, 760, G.UMB, E.oExp(inv(.9, 1.4, lt)), 5);
    G.maskText(ctx, 'PICTOGRAM MOTION — A 30 SECOND SAMPLE', x, 645, F.mono(26), rgba(fg, .8), inv(1.1, 1.6, lt), { ls: '3px' });
    G.disc(ctx, 1640, 380, 90, '#05070c'); G.ring(ctx, 1640, 380, 116, 5, rgba(G.UMB, .9));
    person(ctx, 1450, 470, .42, rgba(fg, .85), { a: .95 });
  }

  const DRAW = { earth: sEarth, title: sTitle, hole: sHole, spag: sSpag, frozen: sFrozen, end: sEnd };

  // ─── hud + subtitles ───
  function hud(ctx, t, P) {
    if (t >= 26.5) return;
    const fg = P.fg;
    ctx.save();
    ctx.font = F.mono(17); ctx.letterSpacing = '3px'; ctx.fillStyle = rgba(fg, .75);
    ctx.textAlign = 'left'; ctx.fillText('BLACK HOLE', 64, 70);
    const mm = String(Math.floor(t / 60)).padStart(2, '0'), ss = String(Math.floor(t % 60)).padStart(2, '0');
    ctx.textAlign = 'right'; ctx.fillText(mm + ':' + ss, W - 64, 70);
    ctx.restore();
    G.hair(ctx, 64, H - 46, W - 128, rgba(fg, .3), 1, 2);
    G.hair(ctx, 64, H - 46, (W - 128) * (t / FULL), G.UMB, 1, 2);
  }
  function subtitles(ctx, t, P) {
    const c = (window.CUES || []).find((q) => t >= q.t0 - .01 && t < q.t1);
    if (!c) return;
    const lt = t - c.t0, out = c.t1 - t;
    const band = P.fg === G.CREAM ? rgba(PAL.ink.t[0], .78) : rgba(P.t[0], .82);
    ctx.save();
    ctx.font = F.en(700, 40); ctx.letterSpacing = '0px';
    const words = c.text.split(' '); const rows = [];
    let row = '';
    for (const wd of words) { const r2 = row ? row + ' ' + wd : wd; if (ctx.measureText(r2).width > 1380 && row) { rows.push(row); row = wd; } else row = r2; }
    rows.push(row);
    const bw = Math.min(Math.max(...rows.map((r) => ctx.measureText(r).width)) + 64, 1500), bh = rows.length > 1 ? 128 : 84;
    const x = 960 - bw / 2, y = 1002 - bh;
    const p = E.oExp(inv(0, .2, lt)) * E.oExp(inv(0, .18, out));
    ctx.fillStyle = band;
    ctx.beginPath(); ctx.roundRect(x, y, bw * p, bh, 12); ctx.fill();
    ctx.beginPath(); ctx.rect(x, y, bw * p, bh); ctx.clip();
    G.hair(ctx, x + 24, y + bh - 22, 40, G.UMB, 1, 4);
    rows.forEach((r, i) => G.maskText(ctx, r, 960, y + 56 + i * 46, F.en(700, 40), G.CREAM, inv(.05 + i * .04, .28 + i * .04, lt), { align: 'center' }));
    ctx.restore();
  }

  // ─── transitions + frame ───
  const TA = .0, TB = .45;
  const bufA = G.canvas(), bufB = G.canvas(), bufSub = G.canvas();
  function shotIdx(t) { for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].t0) return i; return 0; }
  function palAt(t) {
    if (t < 6) return PAL.navy;
    if (t < 16) return PAL.ink;
    if (t < 22) return PAL.coral;
    if (t < 26.5) return PAL.navy;
    return PAL.ink;
  }
  function frame(ctx, t) {
    const i = shotIdx(t), s = SHOTS[i], P = palAt(t);
    const cut = CUTS.find((c) => t >= c && t < c + TB);
    if (!cut) { DRAW[s.kind](ctx, t); }
    else if (t >= cut + TA) {
      const p = E.io3(inv(cut + TA, cut + TB, t));
      const prev = SHOTS[i - 1];
      DRAW[prev.kind](bufA.getContext('2d'), cut - .01);
      DRAW[s.kind](bufB.getContext('2d'), t);
      ctx.drawImage(bufA, 0, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, p * W, H); ctx.clip();
      ctx.drawImage(bufB, 0, 0); ctx.restore();
      if (p > 0 && p < 1) {
        ctx.fillStyle = G.UMB; ctx.fillRect(p * W - 4, 0, 8, H);
        for (let k = 0; k < 3; k++) { const yy = (G.hash(k + Math.floor(t * 30)) * H) | 0; ctx.fillRect(p * W - 26 - G.hash(k * 7 + Math.floor(t * 30)) * 60, yy, 18, 5); }
      }
    }
    hud(ctx, t, P);
    if (!NOCAP) subtitles(ctx, t, P);
  }
  const FAST = [];
  for (const c of CUTS) FAST.push([c - .05, c + TB + .05]);
  FAST.push([16.5, 20.6]);
  const isFast = (t) => FAST.some(([a, b]) => t >= a && t < b);

  // ─── page contract ───
  const Q = new URLSearchParams(location.search);
  const A = +(Q.get('a') ?? 0), B = +(Q.get('b') ?? FULL), NOCAP = Q.get('nocap') === '1';
  const ctxMain = document.getElementById('c').getContext('2d');
  window.DUR = B - A;
  window.EV = EV.filter((e) => e.t >= A && e.t < B).map((e) => ({ ...e, t: +(e.t - A).toFixed(4) }));
  window.SHOTS = SHOTS;
  window.render = (lt) => {
    const t = A + lt, ctx = ctxMain;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!isFast(t)) { frame(ctx, t); return; }
    const N = 5, shutter = .45 / 24, sc = bufSub.getContext('2d'), i0 = shotIdx(t);
    for (let k = 0; k < N; k++) {
      sc.setTransform(1, 0, 0, 1, 0, 0);
      let ts = t - shutter / 2 + (shutter * k) / (N - 1);
      if (shotIdx(ts) !== i0) ts = t;
      frame(sc, ts);
      ctx.globalAlpha = 1 / (k + 1); ctx.drawImage(bufSub, 0, 0);
    }
    ctx.globalAlpha = 1;
  };
  // every text the viewer must read, with its screen box
  window.TEXTS = (lt) => {
    const t = A + lt, out = [];
    const add = (id, text, box, pass) => out.push({ id, text, x0: box[0], y0: box[1], x1: box[2], y1: box[3], pass });
    const chipB = (en, x, y) => chipBox(en, x, y);
    if (t >= 2.0 && t < 5.9) add('c1', 'EARTH', chipB('EARTH', 124, 250));
    if (t >= 6.6 && t < 9.9) { add('t1', 'FALLING INTO', [114, 280, 114 + 830, 450]); add('t2', 'A BLACK HOLE', [114, 470, 114 + 860, 640]); }
    if (t >= 11.0 && t < 15.9) add('c2', 'NOTHING ESCAPES', chipB('NOTHING ESCAPES', 124, 250));
    if (t >= 17.0 && t < 21.9) add('c3', 'SPAGHETTIFICATION', chipB('SPAGHETTIFICATION', 124, 250));
    if (t >= 23.0 && t < 26.4) add('c4', 'FOREVER', chipB('FOREVER', 124, 250));
    if (t >= 27.2 && t < FULL) add('e1', 'you never get there', [114, 400, 114 + 900, 545]);
    return out;
  };
})();
