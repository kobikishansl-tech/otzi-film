// BLACK HOLE JOURNEY — Pictogram Motion, long form (4:18). Twenty shots in six chapters,
// col-wipe cuts, one yellow accent. Grown from the 30 s sample (films/sample-pictogram).
// render(t) draws film second t; ?a=&b= renders a span of it, ?nocap=1 hides the subtitles.
(function () {
  const { W, H, E, PAL, clamp, lerp, inv, rgba, mix } = G;
  const F = G.F;
  const FULL = 258;

  // ─── shot list (film seconds) ───
  const SHOTS = [
    { id: 'S01', t0: 0.0,   kind: 'earth',   pal: 'navy' },
    { id: 'S02', t0: 12.0,  kind: 'title',   pal: 'ink' },
    { id: 'S03', t0: 24.0,  kind: 'launch',  pal: 'navy' },
    { id: 'S04', t0: 36.0,  kind: 'drift',   pal: 'ink' },
    { id: 'S05', t0: 48.0,  kind: 'lens',    pal: 'ink' },
    { id: 'S06', t0: 61.0,  kind: 'disk',    pal: 'coral' },
    { id: 'S07', t0: 75.0,  kind: 'tide',    pal: 'navy' },
    { id: 'S08', t0: 88.0,  kind: 'spag',    pal: 'coral' },
    { id: 'S09', t0: 102.0, kind: 'horizon', pal: 'ink' },
    { id: 'S10', t0: 115.0, kind: 'noreturn', pal: 'ink' },
    { id: 'S11', t0: 128.0, kind: 'frozen',  pal: 'navy' },
    { id: 'S12', t0: 142.0, kind: 'gentle',  pal: 'teal' },
    { id: 'S13', t0: 155.0, kind: 'inside',  pal: 'ink' },
    { id: 'S14', t0: 168.0, kind: 'sing',    pal: 'coral' },
    { id: 'S15', t0: 181.0, kind: 'swap',    pal: 'navy' },
    { id: 'S16', t0: 194.0, kind: 'infinite', pal: 'coral' },
    { id: 'S17', t0: 208.0, kind: 'forever', pal: 'navy' },
    { id: 'S18', t0: 221.0, kind: 'hawking', pal: 'ink' },
    { id: 'S19', t0: 235.0, kind: 'light',   pal: 'yellow' },
    { id: 'S20', t0: 249.0, kind: 'end',     pal: 'ink' },
  ];
  SHOTS.forEach((s, i) => (s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : FULL));
  const CUTS = SHOTS.slice(1).map((s) => s.t0);

  // ─── sound / cue events (film seconds) ───
  const VO = { v01: 0.7, v02: 12.7, v03: 24.7, v04: 36.7, v05: 48.7, v06: 61.7, v07: 75.7, v08: 88.7, v09: 102.7, v10: 115.7, v11: 128.7, v12: 142.7, v13: 155.7, v14: 168.7, v15: 181.7, v16: 194.7, v17: 208.7, v18: 221.7, v19: 235.7, v20: 249.7 };
  const CHIP_T = { c1: 2.0, c2: 25.0, c3: 37.0, c4: 49.0, c5: 62.0, c6: 89.0, c7: 103.0, c8: 116.0, c9: 129.0, c10: 169.0, c11: 222.0 };
  const EV = [
    { t: 0.0, type: 'cut' }, { t: 0.5, type: 'pop' }, { t: 2.0, type: 'chip' },
    { t: 3.7, type: 'arrow' },
    { t: 12.0, type: 'cut' }, { t: 12.4, type: 'slam' }, { t: 13.2, type: 'chip' },
    { t: 24.0, type: 'cut' }, { t: 24.5, type: 'rise' }, { t: 25.0, type: 'chip' },
    { t: 36.0, type: 'cut' }, { t: 37.0, type: 'chip' },
    { t: 48.0, type: 'cut' }, { t: 48.4, type: 'ring' }, { t: 49.0, type: 'chip' },
    { t: 50.0, type: 'arrow' }, { t: 52.0, type: 'arrow' },
    { t: 61.0, type: 'cut' }, { t: 61.4, type: 'ring' }, { t: 62.0, type: 'chip' },
    { t: 75.0, type: 'cut' }, { t: 76.0, type: 'arrow' }, { t: 77.5, type: 'arrow' },
    { t: 88.0, type: 'cut' }, { t: 88.4, type: 'rise' }, { t: 89.0, type: 'chip' },
    { t: 102.0, type: 'cut' }, { t: 103.0, type: 'chip' }, { t: 106.5, type: 'rise' },
    { t: 115.0, type: 'cut' }, { t: 116.0, type: 'chip' }, { t: 119.0, type: 'arrow' }, { t: 121.5, type: 'arrow' },
    { t: 128.0, type: 'cut' }, { t: 129.0, type: 'chip' },
    ...[130.0, 130.5, 131.0, 131.5, 132.0, 132.5].map((t) => ({ t, type: 'tick' })),
    { t: 142.0, type: 'cut' }, { t: 142.5, type: 'pop' },
    { t: 155.0, type: 'cut' }, { t: 156.5, type: 'arrow' }, { t: 158.5, type: 'arrow' }, { t: 160.5, type: 'arrow' },
    { t: 168.0, type: 'cut' }, { t: 169.0, type: 'chip' }, { t: 169.4, type: 'slam' },
    { t: 181.0, type: 'cut' }, { t: 183.0, type: 'ring' },
    { t: 194.0, type: 'cut' }, { t: 194.4, type: 'rise' },
    { t: 208.0, type: 'cut' }, { t: 209.0, type: 'chip' },
    ...[210.0, 210.5, 211.0, 211.5, 212.0].map((t) => ({ t, type: 'tick' })),
    { t: 221.0, type: 'cut' }, { t: 222.0, type: 'chip' },
    { t: 235.0, type: 'cut' }, { t: 235.4, type: 'ring' }, { t: 236.5, type: 'rise' },
    { t: 249.0, type: 'cut' }, { t: 249.4, type: 'slam' },
    ...Object.entries(VO).map(([id, t]) => ({ t, type: 'vo', id })),
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
  function person(ctx, x, y, s, col, o = {}) {
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
  function hole(ctx, x, y, r, p, umb) {
    G.disc(ctx, x, y, r * p, '#05070c');
    G.ring(ctx, x, y, r * p + r * .31, 9 * p, rgba(umb, .95 * p));
    G.ring(ctx, x, y, r * p + r * .6, 3, rgba(umb, .35 * p));
  }
  function stars(ctx, n, seed, a = .8) {
    for (let k = 0; k < n; k++) {
      const x = G.hash(seed + k * 3.1) * W, y = G.hash(seed + k * 7.7) * H, r = 1.5 + G.hash(seed + k * 5.3) * 2.5;
      G.disc(ctx, x, y, r, rgba('#fbf6ec', a * (.4 + G.hash(seed + k) * .6)));
    }
  }

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
    const P = PAL.ink, lt = t - 12.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('ink', 33, { spread: .55, density: .38, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 10 * Math.min(lt, 1.5));
    const x = 124;
    G.maskText(ctx, 'FALLING INTO', x, 430, F.en(900, 150), fg, inv(.4, .95, lt), { ls: '-4px' });
    G.maskText(ctx, 'A BLACK HOLE', x, 620, F.en(900, 150), G.UMB, inv(.7, 1.25, lt), { ls: '-4px' });
    G.hair(ctx, x, 680, 900, rgba(fg, .55), E.oExp(inv(1.1, 1.7, lt)), 3);
    G.maskText(ctx, 'THE FULL JOURNEY, IN FOUR MINUTES', x, 760, F.mono(28), rgba(fg, .8), inv(1.3, 1.8, lt), { ls: '3px' });
    const p = E.io(inv(2.2, 3.6, lt));
    if (p > 0) {
      const fx = lerp(1450, 1660, p), fy = 300 + 60 * p;
      G.disc(ctx, 1720, 420, 60, '#05070c'); G.ring(ctx, 1720, 420, 78, 4, rgba(G.UMB, .8));
      person(ctx, fx, fy + 90, .4, rgba(fg, .9), { a: .95 });
    }
  }
  function sLaunch(ctx, t) {
    const P = PAL.navy, lt = t - 24.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('navy', 47, { spread: .7, density: .36, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 9 * Math.min(lt, 1.5));
    G.disc(ctx, 620, 860, 200 * E.oBack(inv(.2, .8, lt)), PAL.teal.t[2]);
    G.ring(ctx, 620, 860, 216 * E.oBack(inv(.2, .8, lt)), 4, rgba(PAL.teal.t[4], .5));
    hole(ctx, 1560, 300, 70, E.oBack(inv(.6, 1.2, lt)), G.UMB);
    const p = E.io3(inv(1.2, 8.2, lt));
    if (p > 0) {
      const sx = lerp(620, 1470, p), sy = lerp(770, 380, p);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(-.55);
      G.disc(ctx, 0, 0, 26, fg);
      G.poly(ctx, [[26, -14], [58, 0], [26, 14]], G.UMB);
      ctx.restore();
      for (let k = 0; k < 5; k++) { const q = clamp(p * 5 - k); if (q > 0 && q < 1) G.disc(ctx, lerp(620, 1470, p - .04 * k * q) - 30, lerp(770, 380, p - .04 * k * q) + 30, 8 * (1 - q), rgba(G.UMB, .5 * (1 - q))); }
    }
    chip(ctx, 124, 250, 'THIRTY SUNS', '30× THE SUN\u2019S MASS', fg, inv(1.0, 1.5, lt));
  }
  function sDrift(ctx, t) {
    const P = PAL.ink, lt = t - 36.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    stars(ctx, 70, 11, .8);
    const cx = 1180, cy = 520;
    ctx.setLineDash([14, 12]); ctx.strokeStyle = rgba(fg, .4); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, 150, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    G.maskText(ctx, 'NOT TO SCALE', cx - 90, cy + 200, F.mono(24), rgba(fg, .7), inv(1.0, 1.5, lt), { ls: '3px' });
    for (let k = 0; k < 4; k++) {
      const a = k * 1.7 + .5, r0 = 210 + k * 26;
      const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0;
      const push = 46 * E.io(inv(1.4 + k * .5, 2.4 + k * .5, lt));
      G.disc(ctx, x0, y0, 5, rgba('#fbf6ec', .9));
      if (push > 2) { G.disc(ctx, x0 + Math.cos(a) * push, y0 + Math.sin(a) * push, 4, rgba(G.UMB, .9)); }
    }
    person(ctx, 300, 950, .5, rgba(fg, .9), { a: E.oExp(inv(.4, 1.0, lt)) });
    chip(ctx, 124, 250, 'NOTHING TO SEE', 'NO SURFACE, NO GLOW', fg, inv(1.0, 1.5, lt));
  }
  function sLens(ctx, t) {
    const P = PAL.ink, lt = t - 48.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    stars(ctx, 60, 23, .7);
    hole(ctx, 960, 540, 150, E.oBack(inv(.2, .8, lt)), G.UMB);
    for (let k = 0; k < 5; k++) {
      const p = E.io(inv(1.0 + k * .55, 1.6 + k * .55, lt));
      if (p <= 0) continue;
      const a = k * 1.26 + .3, r0 = 420;
      const sx = 960 + Math.cos(a) * r0, sy = 540 + Math.sin(a) * r0;
      const ex = 960 - Math.cos(a) * r0, ey = 540 - Math.sin(a) * r0;
      const bx = 960 + Math.cos(a + .9) * 190 * p, by = 540 + Math.sin(a + .9) * 190 * p;
      arrow(ctx, [sx, sy], [lerp(sx, bx, p), lerp(sy, by, p)], 6, rgba(fg, .85), [(bx - sx) * .1, (by - sy) * .1]);
      if (p > .95) arrow(ctx, [bx, by], [ex, ey], 6, rgba(G.UMB, .9), [(ex - bx) * .1, (ey - by) * .1]);
    }
    chip(ctx, 124, 250, 'LIGHT BENDS', 'A RING OF OTHER STARS', fg, inv(1.0, 1.5, lt));
  }
  function sDisk(ctx, t) {
    const P = PAL.coral, lt = t - 61.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('coral', 55, { spread: .7, density: .4, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 8 * Math.min(lt, 1.5));
    stageDisc(ctx, 960, 560, 430, P.t[0]);
    hole(ctx, 960, 560, 130, E.oBack(inv(.2, .8, lt)), '#fbf6ec');
    ctx.save(); ctx.translate(960, 560); ctx.rotate(0);
    for (let k = 0; k < 3; k++) {
      const rr = 200 + k * 42, dash = 60 + k * 30, off = (t * (90 - k * 22)) % (dash * 2);
      ctx.setLineDash([dash, dash]); ctx.lineDashOffset = -off;
      ctx.strokeStyle = k ? rgba(fg, .55 - k * .12) : rgba(G.UMB, .95); ctx.lineWidth = 10 - k * 2;
      ctx.beginPath(); ctx.ellipse(0, 0, rr, rr * .32, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.setLineDash([]);
    for (let k = 0; k < 6; k++) {
      const u = (t * .35 + k / 6) % 1, a = u * Math.PI * 6, r = lerp(360, 160, u);
      G.disc(ctx, Math.cos(a) * r, Math.sin(a) * r * .32, 5 * (1 - u * .5), rgba(G.UMB, .9 * (1 - u * .4)));
    }
    ctx.restore();
    chip(ctx, 124, 250, 'ACCRETION DISK', 'MILLIONS OF DEGREES', fg, inv(1.0, 1.5, lt));
  }
  function sTide(ctx, t) {
    const P = PAL.navy, lt = t - 75.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('navy', 61, { spread: .6, density: .34, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 7 * Math.min(lt, 1.5));
    stageDisc(ctx, 960, 560, 430, P.t[0]);
    person(ctx, 960, 700, .58, fg, { a: E.oExp(inv(.3, .9, lt)) });
    const a1 = E.io(inv(1.2, 1.8, lt)), a2 = E.io(inv(2.2, 2.8, lt));
    if (a1 > 0) arrow(ctx, [1100, 640], [1100, 640 + 200 * a1], 9, G.UMB);
    if (a2 > 0) arrow(ctx, [820, 560], [820, 560 + 110 * a2], 9, rgba(fg, .85));
    G.maskText(ctx, 'FEET', 1070, 890, F.mono(26), rgba(G.UMB, a1), inv(1.9, 2.3, lt), { ls: '3px' });
    G.maskText(ctx, 'HEAD', 790, 500, F.mono(26), rgba(fg, a2), inv(2.9, 3.3, lt), { ls: '3px' });
    chip(ctx, 124, 250, 'THE TIDE', 'GRAVITY, UP CLOSE', fg, inv(1.0, 1.5, lt));
  }
  function sSpag(ctx, t) {
    const P = PAL.coral, lt = t - 88.0, fg = P.fg;
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
  function sHorizon(ctx, t) {
    const P = PAL.ink, lt = t - 102.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('ink', 71, { spread: .5, density: .32, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 6 * Math.min(lt, 1.5));
    hole(ctx, 960, 560, 170, 1, G.UMB);
    const r = 300;
    const crossed = E.io3(inv(4.0, 6.0, lt));
    ctx.setLineDash(crossed > 0 ? [] : [16, 13]);
    ctx.strokeStyle = rgba(G.UMB, .95); ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(960, 560, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(crossed * .5 + .5, 0, 1) * (crossed > 0 ? 1 : 1)); ctx.stroke();
    ctx.setLineDash([]);
    const p = E.io3(inv(2.2, 6.4, lt));
    if (p > 0) {
      const px = lerp(380, 1060, p), py = 560 + Math.sin(p * 3) * 8;
      person(ctx, px, py + 120, .4, rgba(fg, .95), { a: .95 });
    }
    G.maskText(ctx, crossed > 0 ? 'INSIDE' : 'OUTSIDE', 960, 150, F.mono(30), rgba(crossed > 0 ? G.UMB : fg, .95), inv(4.2, 4.7, lt), { align: 'center', ls: '4px' });
    chip(ctx, 124, 250, 'EVENT HORIZON', 'THE POINT OF NO RETURN', fg, inv(1.0, 1.5, lt));
  }
  function sNoreturn(ctx, t) {
    const P = PAL.ink, lt = t - 115.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('ink', 83, { spread: .45, density: .3, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 5 * Math.min(lt, 1.5));
    hole(ctx, 960, 560, 150, 1, G.UMB);
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4 + .39, p = E.io(inv(.5 + k * .22, 1.1 + k * .22, lt));
      if (p <= 0) continue;
      const r0 = 470, r1 = lerp(r0, 330, p);
      arrow(ctx, [960 + Math.cos(a) * r0, 560 + Math.sin(a) * r0], [960 + Math.cos(a) * r1, 560 + Math.sin(a) * r1], 6, rgba(fg, .85));
    }
    const p2 = E.io(inv(3.4, 4.6, lt));
    if (p2 > 0 && p2 < .92) {
      const bx = 1430 - 340 * E.io3(clamp(p2 * 1.6)), by = 300;
      const bend = 120 * Math.sin(p2 * Math.PI);
      arrow(ctx, [1430, 300], [bx, by + bend * .2], 7, rgba(G.UMB, .95), [0, bend]);
    }
    if (lt > 5.0) G.maskText(ctx, 'needs c > c', 1430, 250, F.mono(26), rgba(G.UMB, .9), inv(5.0, 5.4, lt), { align: 'center', ls: '2px' });
    chip(ctx, 124, 250, 'NO WAY BACK', 'ESCAPE NEEDS c > c', fg, inv(1.0, 1.5, lt));
  }
  function sFrozen(ctx, t) {
    const P = PAL.navy, lt = t - 128.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('navy', 69, { spread: .6, density: .34, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 6 * Math.min(lt, 1.5));
    stageDisc(ctx, 960, 560, 430, P.t[0]);
    const grow = E.oBack(inv(.2, .8, lt));
    G.ring(ctx, 1180, 540, 130 * grow, 9, fg);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      G.seg(ctx, [1180 + Math.cos(a) * 130 * grow, 540 + Math.sin(a) * 130 * grow], [1180 + Math.cos(a) * (130 * grow - 14), 540 + Math.sin(a) * (130 * grow - 14)], 5, rgba(fg, .8));
    }
    const ha = -Math.PI / 2 + 1.1 * (1 - E.oExp(inv(.8, 4.2, lt)));
    G.seg(ctx, [1180, 540], [1180 + Math.cos(ha) * 86 * grow, 540 + Math.sin(ha) * 86 * grow], 8, G.UMB);
    const hb = -Math.PI / 2 + 2.4 * (1 - E.oExp(inv(.5, 4.4, lt)));
    G.seg(ctx, [1180, 540], [1180 + Math.cos(hb) * 56 * grow, 540 + Math.sin(hb) * 56 * grow], 6, rgba(fg, .9));
    const fade = 1 - .8 * E.io(inv(.5, 3.8, lt));
    person(ctx, 700, 700, .62, fg, { a: fade });
    if (lt > 2.2) G.maskText(ctx, 'fading...', 648, 560, F.mono(26), rgba(G.UMB, fade), inv(2.3, 2.7, lt), { ls: '2px' });
    chip(ctx, 124, 250, 'FOREVER', 'FROM THE OUTSIDE', fg, inv(.4, .9, lt));
  }
  function sGentle(ctx, t) {
    const P = PAL.teal, lt = t - 142.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('teal', 41, { spread: .65, density: .3, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 6 * Math.min(lt, 1.5));
    stars(ctx, 40, 37, .5);
    const bob = Math.sin(lt * 1.1) * 10, drift = 40 * E.io(inv(.5, 10, lt));
    person(ctx, 960 + drift, 620 + bob, .6, fg, { a: .95, sy: 1 + Math.sin(lt * 1.3) * .02 });
    const grow = E.oBack(inv(.3, .9, lt));
    G.ring(ctx, 1560, 380, 90 * grow, 6, rgba(fg, .8));
    const ha = -Math.PI / 2 + (t % 6) * 1.05;
    G.seg(ctx, [1560, 380], [1560 + Math.cos(ha) * 60 * grow, 380 + Math.sin(ha) * 60 * grow], 5, fg);
    G.maskText(ctx, 'your clock: fine', 1560, 510, F.mono(24), rgba(fg, .85), inv(1.4, 1.9, lt), { align: 'center', ls: '2px' });
    chip(ctx, 124, 250, 'ALMOST GENTLE', 'FREE FALL = NO WEIGHT', fg, inv(1.0, 1.5, lt));
  }
  function sInside(ctx, t) {
    const P = PAL.ink, lt = t - 155.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('ink', 97, { spread: .4, density: .28, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 4 * Math.min(lt, 1.5));
    const collapse = E.io3(inv(.8, 9.5, lt));
    for (let k = 0; k < 4; k++) {
      const r0 = 420 - k * 70, r = lerp(r0, 40 + k * 12, collapse);
      ctx.strokeStyle = rgba(fg, .35 - k * .05); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(960, 560, Math.max(30, r), 0, Math.PI * 2); ctx.stroke();
    }
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4, p = E.io(inv(1.0 + k * .3, 2.0 + k * .3, lt));
      if (p <= 0) continue;
      const r0 = 430, r1 = lerp(r0, 120, p);
      arrow(ctx, [960 + Math.cos(a) * r0, 560 + Math.sin(a) * r0], [960 + Math.cos(a) * r1, 560 + Math.sin(a) * r1], 6, rgba(fg, .8));
    }
    G.disc(ctx, 960, 560, 26, '#05070c'); G.ring(ctx, 960, 560, 40, 4, rgba(G.UMB, .9));
    const fp = E.io3(inv(2.0, 9.0, lt));
    person(ctx, 960, 560 + 260 * (1 - fp) + 60, .5 * (1 - fp * .6), rgba(fg, .9), { a: .9 });
    chip(ctx, 124, 250, 'EVERYTHING FALLS', 'ALL ROADS LEAD DOWN', fg, inv(1.0, 1.5, lt));
  }
  function sSing(ctx, t) {
    const P = PAL.coral, lt = t - 168.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('coral', 89, { spread: .45, density: .3, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 5 * Math.min(lt, 1.5));
    const focus = E.oExp(inv(.4, 1.2, lt));
    for (let k = 0; k < 5; k++) {
      const r = lerp(360 - k * 40, 6, E.io3(inv(.6 + k * .5, 3.4 + k * .5, lt)));
      if (r > 8) { ctx.strokeStyle = rgba(fg, .5 - k * .07); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(960, 560, r, 0, Math.PI * 2); ctx.stroke(); }
    }
    G.disc(ctx, 960, 560, 16 + 6 * Math.sin(lt * 5) * focus, '#05070c');
    G.ring(ctx, 960, 560, 30 + 4 * Math.sin(lt * 5), 4, rgba(G.UMB, focus));
    chip(ctx, 124, 250, 'SINGULARITY', 'WHERE PHYSICS GIVES UP', fg, inv(1.0, 1.5, lt));
  }
  function sSwap(ctx, t) {
    const P = PAL.navy, lt = t - 181.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('navy', 79, { spread: .5, density: .3, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 5 * Math.min(lt, 1.5));
    stageDisc(ctx, 960, 560, 430, P.t[0]);
    const rot = E.io3(inv(2.0, 4.5, lt)) * Math.PI / 2;
    ctx.save(); ctx.translate(960, 560); ctx.rotate(rot);
    ctx.strokeStyle = rgba(fg, .8); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-330, 0); ctx.lineTo(330, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -300); ctx.lineTo(0, 300); ctx.stroke();
    arrow(ctx, [0, -300], [0, -240], 6, rgba(fg, .8));
    ctx.restore();
    G.maskText(ctx, 'TIME', 960 + Math.cos(rot) * 380, 560 + Math.sin(rot) * 380 + 8, F.mono(28), G.UMB, E.oExp(inv(1.0, 1.5, lt)), { align: 'center', ls: '4px' });
    G.maskText(ctx, 'SPACE', 960 + Math.cos(rot + Math.PI / 2) * 340, 560 + Math.sin(rot + Math.PI / 2) * 340 + 8, F.mono(28), fg, E.oExp(inv(1.3, 1.8, lt)), { align: 'center', ls: '4px' });
    const down = E.io(inv(5.0, 6.5, lt));
    if (down > 0) for (let k = -1; k <= 1; k++) arrow(ctx, [960 + k * 120, 350], [960 + k * 120, 350 + 130 * down], 6, rgba(fg, .8 * down));
    chip(ctx, 124, 250, 'THE SWAP', 'SPACE AND TIME TRADE PLACES', fg, inv(1.0, 1.5, lt));
  }
  function sInfinite(ctx, t) {
    const P = PAL.coral, lt = t - 194.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('coral', 101, { spread: .4, density: .26, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 4 * Math.min(lt, 1.5));
    stageDisc(ctx, 960, 560, 430, P.t[0]);
    const st = E.io3(inv(.8, 5.0, lt));
    const sy = lerp(1, 9, st), sx = lerp(1, .06, st);
    person(ctx, 960, 760, .55, fg, { sx, sy, w: 11 * .55 / Math.sqrt(sx), a: 1 - .4 * E.io(inv(4.5, 6.5, lt)) });
    const flash = E.io(inv(5.5, 7.0, lt));
    if (flash > 0) { ctx.strokeStyle = rgba(G.UMB, .9 * (1 - flash * .3)); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(960, 130); ctx.lineTo(960, 990); ctx.stroke(); }
    G.maskText(ctx, 'tides → ∞', 1240, 300, F.mono(30), rgba(G.UMB, flash), inv(5.6, 6.1, lt), { ls: '2px' });
    chip(ctx, 124, 250, 'INFINITE TIDE', 'A FRACTION OF A SECOND', fg, inv(1.0, 1.5, lt));
  }
  function sForever(ctx, t) {
    const P = PAL.navy, lt = t - 208.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('navy', 83, { spread: .5, density: .3, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 5 * Math.min(lt, 1.5));
    stageDisc(ctx, 960, 560, 430, P.t[0]);
    const grow = E.oBack(inv(.2, .8, lt));
    G.ring(ctx, 960, 560, 150 * grow, 9, fg);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      G.seg(ctx, [960 + Math.cos(a) * 150 * grow, 560 + Math.sin(a) * 150 * grow], [960 + Math.cos(a) * (150 * grow - 16), 560 + Math.sin(a) * (150 * grow - 16)], 5, rgba(fg, .8));
    }
    const ha = -Math.PI / 2 + 2.2 * (1 - E.oExp(inv(.6, 2.6, lt)));
    G.seg(ctx, [960, 560], [960 + Math.cos(ha) * 100 * grow, 560 + Math.sin(ha) * 100 * grow], 8, G.UMB);
    G.maskText(ctx, 'maybe forever', 960, 790, F.en(900, 64), rgba(fg, .95), inv(2.8, 3.4, lt), { align: 'center', ls: '-2px' });
    chip(ctx, 124, 250, 'HOW LONG?', 'FROM THE OUTSIDE', fg, inv(1.0, 1.5, lt));
  }
  function sHawking(ctx, t) {
    const P = PAL.ink, lt = t - 221.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('ink', 103, { spread: .4, density: .26, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 4 * Math.min(lt, 1.5));
    const shrink = E.io(inv(1.0, 12.0, lt));
    const r = lerp(240, 120, shrink);
    hole(ctx, 960, 560, r, 1, G.UMB);
    for (let k = 0; k < 4; k++) {
      const u = ((t * .28 + k / 4) % 1);
      const rr = r + 40 + u * 260;
      ctx.strokeStyle = rgba(fg, .5 * (1 - u)); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(960, 560, rr, 0, Math.PI * 2); ctx.stroke();
    }
    for (let k = 0; k < 7; k++) {
      const u = (t * .4 + k / 7) % 1, a = k * 2.4 + t * .1;
      G.disc(ctx, 960 + Math.cos(a) * (r + 30 + u * 200), 560 + Math.sin(a) * (r + 30 + u * 200), 4 * (1 - u), rgba(G.UMB, .9 * (1 - u)));
    }
    chip(ctx, 124, 250, 'HAWKING RADIATION', 'A VERY SLOW LEAK', fg, inv(1.0, 1.5, lt));
  }
  function sLight(ctx, t) {
    const P = PAL.yellow, lt = t - 235.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('yellow', 113, { spread: .35, density: .24, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 4 * Math.min(lt, 1.5));
    const fade = 1 - E.io(inv(1.0, 6.0, lt));
    if (fade > 0) hole(ctx, 960, 560, 170, fade, '#231902');
    for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6 + .26, p = E.oExp(inv(1.2 + k * .12, 3.0 + k * .12, lt));
      if (p <= 0) continue;
      const r0 = 200, r1 = lerp(r0, 560, p);
      ctx.strokeStyle = rgba('#fbf6ec', .85 * p); ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(960 + Math.cos(a) * r0, 560 + Math.sin(a) * r0); ctx.lineTo(960 + Math.cos(a) * r1, 560 + Math.sin(a) * r1); ctx.stroke();
    }
    const ringP = E.io3(inv(2.0, 8.0, lt));
    if (ringP > 0 && ringP < 1) { ctx.strokeStyle = rgba('#fbf6ec', .6 * (1 - ringP)); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(960, 560, 200 + ringP * 620, 0, Math.PI * 2); ctx.stroke(); }
    G.maskText(ctx, 'back to light', 960, 220, F.en(900, 72), '#231902', E.oExp(inv(3.2, 3.8, lt)), { align: 'center', ls: '-2px' });
    chip(ctx, 124, 250, 'THE END OF THE HOLE', 'EVERYTHING LEAKS BACK', fg, inv(1.0, 1.5, lt));
  }
  function sEnd(ctx, t) {
    const P = PAL.ink, lt = t - 249.0, fg = P.fg;
    ctx.fillStyle = P.t[1]; ctx.fillRect(0, 0, W, H);
    G.drawPattern(ctx, G.pattern('ink', 81, { spread: .45, density: .3, set: 'sun' }), (j) => (j % 2 ? 1 : -1) * 8 * Math.min(lt, 1));
    const x = 124;
    G.maskText(ctx, 'you never get there', x, 470, F.en(900, 116), fg, inv(.5, 1.1, lt), { ls: '-3px' });
    G.maskText(ctx, 'and yet, everything does', x, 610, F.en(900, 72), G.UMB, inv(1.2, 1.8, lt), { ls: '-2px' });
    G.hair(ctx, x, 665, 900, rgba(fg, .55), E.oExp(inv(1.6, 2.1, lt)), 5);
    G.maskText(ctx, 'BLACK HOLE JOURNEY — PICTOGRAM MOTION', x, 740, F.mono(26), rgba(fg, .8), inv(1.9, 2.4, lt), { ls: '3px' });
    G.disc(ctx, 1640, 380, 90, '#05070c'); G.ring(ctx, 1640, 380, 116, 5, rgba(G.UMB, .9));
    person(ctx, 1450, 470, .42, rgba(fg, .85), { a: .95 });
  }

  const DRAW = { earth: sEarth, title: sTitle, launch: sLaunch, drift: sDrift, lens: sLens, disk: sDisk, tide: sTide, spag: sSpag, horizon: sHorizon, noreturn: sNoreturn, frozen: sFrozen, gentle: sGentle, inside: sInside, sing: sSing, swap: sSwap, infinite: sInfinite, forever: sForever, hawking: sHawking, light: sLight, end: sEnd };

  // ─── hud + subtitles ───
  function hud(ctx, t, P) {
    if (t >= 249) return;
    const fg = P.fg;
    ctx.save();
    ctx.font = F.mono(17); ctx.letterSpacing = '3px'; ctx.fillStyle = rgba(fg, .75);
    ctx.textAlign = 'left'; ctx.fillText('BLACK HOLE JOURNEY', 64, 70);
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
  function frame(ctx, t) {
    const i = shotIdx(t), s = SHOTS[i], P = PAL[s.pal];
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
  FAST.push([88.5, 92.6], [194.5, 200.6]);
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
    const CHIP_EN = { c1: 'EARTH', c2: 'THIRTY SUNS', c3: 'NOTHING TO SEE', c4: 'LIGHT BENDS', c5: 'ACCRETION DISK', c6: 'SPAGHETTIFICATION', c7: 'EVENT HORIZON', c8: 'NO WAY BACK', c9: 'FOREVER', c10: 'SINGULARITY', c11: 'HAWKING RADIATION' };
    for (const [id, t0] of Object.entries(CHIP_T)) {
      const s = SHOTS.find((q) => q.t0 <= t0 && t0 < q.t1);
      if (t >= t0 && t < s.t1 - .1) add(id, CHIP_EN[id], chipB(CHIP_EN[id], 124, 250));
    }
    if (t >= 12.6 && t < 23.9) { add('t1', 'FALLING INTO', [114, 280, 114 + 830, 450]); add('t2', 'A BLACK HOLE', [114, 470, 114 + 860, 640]); }
    if (t >= 183.6 && t < 193.9) { add('t3', 'TIME', [900, 920, 1020, 956]); add('t4', 'SPACE', [560, 540, 680, 576]); }
    if (t >= 210.8 && t < 220.9) add('m1', 'maybe forever', [560, 730, 1360, 800]);
    if (t >= 238.2 && t < 248.9) add('m2', 'back to light', [660, 150, 1260, 230]);
    if (t >= 250.2 && t < FULL) { add('e1', 'you never get there', [114, 350, 114 + 900, 490]); add('e2', 'and yet, everything does', [114, 520, 114 + 820, 620]); }
    return out;
  };
})();
