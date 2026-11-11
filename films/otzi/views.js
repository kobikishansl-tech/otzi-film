// Eight pictures on one scroll: the pass with its gully, reprinted with different colour blocks.
// Layer groups g: 0 key lines, 1 blues, 2 greens/secondary, 3 reds/figures.
import { clamp, lerp, seg, ss, mulberry, hash, vnoise, TAU } from '/core/lib.js';
import { W, H, FR, PAL, smooth, poly, carve, wob, line, fillPath, bokashi, kasumi, rgba, mix } from './print.js';
import { mountain, pine, rock, rain } from './nature.js';
import { figure, tinyFigure } from './figure.js';
import { T, q8, q12 } from './story.js';

const S = PAL.sumi;
const ICE = '#4d6f98', ICED = '#1d3a66', ICEX = '#13284a', PALEB = '#8db0c6', PALEB2 = '#bcd0d6';
const LEATHC = '#5e4631', GRASSC = '#9a7a3e', CAPC = '#3f2e1c';

// ————— I · The pass (autumn day) —————
const HZ1 = 520;
function path1(u) { return [lerp(1560, 700, u), lerp(806, 700, Math.pow(u, 1.2))]; }
export const V1 = {
  id: 'v1',
  layers: {
    skyB: { g: 1, grain: .12, draw(x) {
      bokashi(x, 0, FR.y0, W, 330, PAL.prus, .9, 0, { rough: 26, seed: 2 });
      bokashi(x, 0, 240, W, HZ1, PALEB, 0, .4, { rough: 18, seed: 6 });
      mountain(x, 430, HZ1 - 4, 760, 330, { body: PAL.prus, snow: PAL.white, frac: .34, seed: 4, shade: PAL.prusD });
      mountain(x, 1450, HZ1 - 2, 620, 210, { body: PAL.prusL, snow: PAL.white, frac: .3, seed: 8 });
      x.fillStyle = PALEB2; x.fillRect(0, HZ1 - 4, W, 60);
    } },
    greens: { g: 2, grain: .04, draw(x) {
      x.fillStyle = PAL.greenD; x.beginPath(); x.moveTo(0, HZ1 + 6);
      for (let X = 0; X <= W; X += 16) x.lineTo(X, HZ1 - 2 - Math.abs(Math.sin(X * .004 + 1)) * 26 - vnoise(X * .01) * 10);
      x.lineTo(W, HZ1 + 30); x.lineTo(0, HZ1 + 30); x.fill();
      x.fillStyle = PAL.green; x.beginPath(); x.moveTo(0, 760);
      for (let X = 0; X <= W; X += 16) x.lineTo(X, 750 - vnoise(X * .006 + 4) * 30);
      x.lineTo(W, 820); x.lineTo(0, 830); x.fill();
      pine(x, 260, 842, 2.2, { seed: 3, lean: -.35, lines: false });
      pine(x, 380, 852, 1.7, { seed: 6, lean: .2, lines: false });
      pine(x, 1740, 830, 1.9, { seed: 9, lean: -.15, lines: false });
      x.fillStyle = PAL.ochreL; x.beginPath();
      x.moveTo(1620, 812); x.quadraticCurveTo(1200, 760, 700, 712);
      x.lineTo(720, 738); x.quadraticCurveTo(920, 768, 1180, 788); x.quadraticCurveTo(1420, 812, 1650, 842); x.closePath(); x.fill();
    } },
    reds: { g: 3, draw(x) {
      x.fillStyle = PAL.beni; x.beginPath(); x.arc(1580, 170, 30, 0, TAU); x.fill();
      kasumi(x, 900, 500, 700, 16, PAL.white, .75); kasumi(x, 300, 540, 520, 14, PAL.white, .7); kasumi(x, 1520, 556, 420, 12, PAL.white, .6);
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 430, HZ1 - 4, 760, 330, { lines: true, lw: 2.2, snowLine: S, frac: .34, seed: 4 });
      mountain(x, 1450, HZ1 - 2, 620, 210, { lines: true, lw: 1.8, snowLine: S, frac: .3, seed: 8 });
      pine(x, 260, 842, 2.2, { seed: 3, lean: -.35, fills: false, lw: 2.4 });
      pine(x, 380, 852, 1.7, { seed: 6, lean: .2, fills: false, lw: 2.2 });
      pine(x, 1740, 830, 1.9, { seed: 9, lean: -.15, fills: false, lw: 2.2 });
      x.strokeStyle = S; x.lineWidth = 1.6; x.beginPath(); x.arc(1580, 170, 30, 0, TAU); x.stroke();
      x.lineCap = 'round';
      for (let r = 0; r < 5; r++) { const yy = 850 + r * 42; carve(x, wob([[0, yy], [640, yy - 6], [1300, yy - 3], [W, yy + 2]], 2, r + 2), 1.6 + r * .5, { taper: [0, 0], seed: r + 30, jit: .6, per: 3 }); }
      carve(x, wob([[700, 712], [920, 742], [1200, 762], [1650, 816]], 1.5, 5), 2.2, { taper: [.2, .2], seed: 7 });
    } },
  },
  paint(x, t, R) {
    R.L('skyB'); R.L('reds'); R.L('greens');
    const u = seg(t, 3.4, 8.6), [fx, fy] = path1(clamp(u));
    R.D(3, x => figure(x, fx, fy, 120, { mode: u > 0 && u < 1 ? 'walk' : 'stand', ph: q8(t) * 1.05, t: q8(t), axe: true, bundle: true, flip: true }));
    R.L('key');
  },
};

// ————— II · The gear (a plate of everything he owned) —————
export const V2 = {
  id: 'v2',
  layers: {
    skyB: { g: 1, grain: .06, draw(x) {
      bokashi(x, 0, FR.y0, W, 260, PAL.prus, .35, 0, { rough: 20, seed: 4 });
      kasumi(x, 960, 300, 1500, 20, PAL.white, .6);
    } },
    greens: { g: 2, grain: .05, draw(x) {
      x.fillStyle = PAL.straw; x.fillRect(300, 330, 1320, 560);
      x.strokeStyle = rgba('#9a7a3e', .8); x.lineWidth = 2;
      for (let i = 0; i < 16; i++) { x.beginPath(); x.moveTo(300, 360 + i * 34); x.lineTo(1620, 360 + i * 34); x.stroke(); }
      for (let i = 0; i < 38; i++) { x.beginPath(); x.moveTo(336 + i * 34, 330); x.lineTo(336 + i * 34, 890); x.stroke(); }
      x.fillStyle = rgba('#9a7a3e', .5); x.fillRect(300, 330, 1320, 10); x.fillRect(300, 880, 1320, 10);
    } },
    reds: { g: 3, draw(x) {
      x.save(); x.translate(1330, 470); x.rotate(.5);
      x.fillStyle = '#9a6a3c'; x.strokeStyle = S; x.lineWidth = 3;
      x.beginPath(); poly(x, [[-30, -95], [95, -110], [118, -20], [20, -10]]); x.fill(); x.stroke();
      x.fillStyle = '#4a3520'; x.beginPath(); poly(x, [[-8, -12], [14, -8], [6, 210], [-16, 206]]); x.fill(); x.stroke();
      x.restore();
      x.save(); x.translate(560, 430);
      x.fillStyle = CAPC; x.beginPath(); x.arc(0, 0, 120, Math.PI, 0); x.quadraticCurveTo(128, 34, 68, 38); x.lineTo(-74, 38); x.quadraticCurveTo(-127, 32, -120, 0); x.fill();
      x.restore();
    } },
    key: { g: 0, speck: .12, draw(x) {
      x.strokeStyle = S; x.lineWidth = 3; x.strokeRect(300, 330, 1320, 560); x.lineWidth = 1.2; x.strokeRect(312, 342, 1296, 536);
      x.lineCap = 'round'; x.strokeStyle = S; x.lineWidth = 2.2;
      x.beginPath(); x.moveTo(470, 540); x.quadraticCurveTo(430, 640, 452, 760); x.stroke();
      for (let i = 0; i < 12; i++) { const u = i / 11, gx = 470 + (u - .5) * 150, gy = 560 + u * 30; x.lineWidth = 2; x.beginPath(); x.moveTo(gx * .5 + 235, gy); x.quadraticCurveTo(gx - 20, gy + 90, gx - 34 + (i % 3) * 8, 700 + u * 60); x.stroke(); }
      for (const [sx, flip] of [[880, 1], [1040, -1]]) {
        x.save(); x.translate(sx, 770); x.scale(flip, 1);
        x.fillStyle = LEATHC; x.strokeStyle = S; x.lineWidth = 2.6;
        x.beginPath(); x.moveTo(-70, 0); x.quadraticCurveTo(-78, -46, -20, -52); x.quadraticCurveTo(50, -56, 74, -18); x.quadraticCurveTo(80, 0, 70, 0); x.closePath(); x.fill(); x.stroke();
        x.fillStyle = '#8f6f49'; x.beginPath(); x.moveTo(-74, 0); x.lineTo(76, 0); x.lineTo(72, 12); x.lineTo(-70, 12); x.closePath(); x.fill(); x.stroke();
        x.strokeStyle = GRASSC; x.lineWidth = 1.8;
        for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(-58 + i * 8, -50 + i * 12); x.lineTo(40 - i * 6, -46 + i * 12); x.stroke(); }
        for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(-60 + i * 30, -48); x.lineTo(-64 + i * 30, -6); x.stroke(); }
        x.restore();
      }
      x.save(); x.translate(1330, 470); x.rotate(.5);
      x.strokeStyle = S; x.lineWidth = 3; x.beginPath(); poly(x, [[-30, -95], [95, -110], [118, -20], [20, -10]]); x.stroke();
      x.beginPath(); poly(x, [[-8, -12], [14, -8], [6, 210], [-16, 206]]); x.stroke(); x.restore();
      x.save(); x.translate(560, 430);
      x.strokeStyle = S; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 120, Math.PI, 0); x.stroke();
      x.beginPath(); x.moveTo(-122, 38); x.lineTo(126, 38); x.stroke();
      x.lineWidth = 2.4; for (let i = -2; i <= 2; i++) { const a = -Math.PI / 2 + i * .5; x.beginPath(); x.moveTo(Math.cos(a) * 66, Math.sin(a) * 66 - 6); x.lineTo(Math.cos(a) * 110, Math.sin(a) * 110 - 6); x.stroke(); }
      x.restore();
    } },
  },
  paint(x, t, R) {
    R.L('skyB'); R.L('greens'); R.L('reds'); R.L('key');
  },
};

// ————— III · The last meal (boulder shelter) —————
const BOARD = [[700, 700], [1220, 700], [1260, 790], [660, 790]];
export const V3 = {
  id: 'v3',
  layers: {
    skyB: { g: 1, grain: .08, draw(x) {
      bokashi(x, 0, FR.y0, W, 300, PAL.prus, .5, 0, { rough: 22, seed: 5 });
      bokashi(x, 0, 220, W, 560, PALEB, 0, .5, { rough: 16, seed: 8 });
      mountain(x, 1500, 560, 700, 240, { body: PAL.prusL, snow: PAL.white, frac: .3, seed: 6 });
    } },
    greens: { g: 2, grain: .05, draw(x) {
      x.fillStyle = PAL.white; x.beginPath(); x.moveTo(0, 640);
      for (let X = 0; X <= W; X += 20) x.lineTo(X, 630 + vnoise(X * .008 + 2) * 24);
      x.lineTo(W, H); x.lineTo(0, H); x.fill();
      x.fillStyle = rgba(PALEB, .5); x.beginPath(); x.moveTo(0, 860);
      for (let X = 0; X <= W; X += 20) x.lineTo(X, 850 + vnoise(X * .01 + 7) * 18);
      x.lineTo(W, H); x.lineTo(0, H); x.fill();
      rock(x, [[180, 980], [140, 700], [260, 560], [420, 520], [560, 600], [600, 760], [560, 980]], { body: '#8b8a80', seed: 2 });
      rock(x, [[1360, 980], [1400, 720], [1560, 620], [1740, 660], [1820, 800], [1800, 980]], { body: '#8b8a80', seed: 5 });
    } },
    reds: { g: 3, draw(x) {
      x.fillStyle = '#8a6a48'; x.strokeStyle = S; x.lineWidth = 3;
      x.beginPath(); poly(x, BOARD); x.fill(); x.stroke();
      for (const [mx, my, w, rot] of [[820, 720, 130, -.06], [960, 745, 150, .04]]) {
        x.save(); x.translate(mx, my); x.rotate(rot);
        x.fillStyle = '#7a3b2c'; x.beginPath(); poly(x, [[-w / 2, 0], [w / 2, -8], [w / 2 + 8, 16], [-w / 2 + 6, 24]]); x.fill(); x.stroke();
        x.fillStyle = PAL.white; x.beginPath(); poly(x, [[-w / 2 + 4, 2], [w / 2 - 6, -5], [w / 2 - 2, 4], [-w / 2 + 8, 10]]); x.fill();
        x.restore();
      }
      x.fillStyle = PAL.ochreL; x.strokeStyle = S; x.lineWidth = 2.4;
      x.beginPath(); x.ellipse(1130, 738, 74, 20, -.05, 0, TAU); x.fill(); x.stroke();
      x.strokeStyle = rgba('#9a7a3e', .9); x.lineWidth = 1.6;
      x.beginPath(); x.ellipse(1130, 736, 52, 12, -.05, 0, TAU); x.stroke();
      x.save(); x.translate(740, 770); x.rotate(.35);
      x.fillStyle = '#5f5e58'; x.strokeStyle = S; x.lineWidth = 2;
      x.beginPath(); poly(x, [[0, 0], [64, -14], [70, -2], [6, 10]]); x.fill(); x.stroke();
      x.fillStyle = '#4a3520'; x.beginPath(); poly(x, [[-30, 4], [0, 0], [4, 12], [-26, 16]]); x.fill(); x.stroke();
      x.restore();
    } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 1500, 560, 700, 240, { lines: true, lw: 2, snowLine: S, frac: .3, seed: 6 });
      x.strokeStyle = S; x.lineWidth = 2.6;
      rock(x, [[180, 980], [140, 700], [260, 560], [420, 520], [560, 600], [600, 760], [560, 980]], { lines: true, lw: 2.6, seed: 2 });
      rock(x, [[1360, 980], [1400, 720], [1560, 620], [1740, 660], [1820, 800], [1800, 980]], { lines: true, lw: 2.6, seed: 5 });
      x.beginPath(); poly(x, BOARD); x.stroke();
      x.lineWidth = 1.8;
      for (const [mx, my, w] of [[820, 720, 130], [960, 745, 150]]) { x.beginPath(); x.moveTo(mx - w / 2, my); x.lineTo(mx + w / 2 + 8, my - 8); x.stroke(); }
      x.beginPath(); x.ellipse(1130, 738, 74, 20, -.05, 0, TAU); x.stroke();
    } },
  },
  paint(x, t, R) {
    R.L('skyB'); R.L('greens'); R.L('reds'); R.L('key');
    const tq = q8(t);
    R.D(3, x => {
      x.strokeStyle = rgba(PAL.white, .85); x.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const u = ((tq * .45 + i * .33) % 1), sy = 700 - u * 210, sway = Math.sin(u * 5 + i * 2) * 26 * u;
        x.lineWidth = 5 - u * 3;
        x.beginPath(); x.moveTo(900 + sway * .4, sy); x.quadraticCurveTo(920 + sway, sy - 30, 900 + sway * 1.4, sy - 62); x.stroke();
      }
    });
    R.D(3, x => figure(x, 980, 690, 118, { mode: 'kneel', t: tq, flip: true, seed: 3 }));
  },
};

// ————— IV · The climb (white peak, wind) —————
export const V4 = {
  id: 'v4',
  layers: {
    skyB: { g: 1, grain: .12, draw(x) {
      bokashi(x, 0, FR.y0, W, 400, PAL.prus, .85, 0, { rough: 30, seed: 3 });
      bokashi(x, 0, 300, W, 700, PALEB, 0, .3, { rough: 20, seed: 9 });
      mountain(x, 960, 900, 1250, 620, { body: PAL.prusL, snow: PAL.white, frac: .52, seed: 5, shade: PAL.prus });
    } },
    greens: { g: 2, grain: .05, draw(x) {
      x.fillStyle = PAL.white; x.beginPath(); x.moveTo(0, 880);
      for (let X = 0; X <= W; X += 20) x.lineTo(X, 870 + vnoise(X * .01 + 3) * 16);
      x.lineTo(W, H); x.lineTo(0, H); x.fill();
      x.strokeStyle = rgba(PALEB, .8); x.lineWidth = 3; x.lineCap = 'round';
      for (let i = 0; i < 8; i++) { const yy = 905 + i * 22; x.beginPath(); x.moveTo(120 + i * 180, yy); x.lineTo(420 + i * 180, yy + 6); x.stroke(); }
    } },
    reds: { g: 3, draw(x) { kasumi(x, 700, 470, 900, 18, PAL.white, .8); kasumi(x, 1400, 560, 620, 14, PAL.white, .7); } },
    key: { g: 0, speck: .12, draw(x) {
      mountain(x, 960, 900, 1250, 620, { lines: true, lw: 2.6, snowLine: S, frac: .52, seed: 5 });
      x.strokeStyle = rgba(S, .55); x.lineWidth = 1.4; x.lineCap = 'round';
      const R = mulberry(12);
      for (let i = 0; i < 14; i++) { const X = R() * W, Y = 120 + R() * 500, L = 120 + R() * 220; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + L, Y + L * .1); x.stroke(); }
      for (let i = 0; i < 10; i++) { const X = R() * W, Y = 200 + R() * 560, L = 90 + R() * 160; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + L, Y + L * .16); x.stroke(); }
    } },
  },
  paint(x, t, R) {
    R.L('skyB'); R.L('reds'); R.L('greens');
    const u = seg(t, 24.6, 29.5), px = lerp(700, 1060, u), py = lerp(868, 800, u);
    R.D(3, x => tinyFigure(x, px, py, 64, { step: q8(t) % 2, col: S }));
    R.L('key');
  },
};

// ————— V · Dusk, the arrow —————
function duskPeak(x, o = {}) { mountain(x, 960, 900, 1250, 620, o); }
export const V5 = {
  id: 'v5',
  layers: {
    skyB: { g: 1, grain: .1, draw(x) {
      bokashi(x, 0, FR.y0, W, 430, ICEX, .92, 0, { rough: 30, seed: 4 });
      bokashi(x, 0, 260, W, 620, PAL.beniP, .95, .1, { rough: 26, seed: 7 });
      bokashi(x, 0, 520, W, 900, PALEB, 0, .25, { rough: 18, seed: 11 });
      duskPeak(x, { body: '#2c4a70', snow: PAL.white, frac: .4, seed: 5, shade: ICED, glow: PAL.beniL });
    } },
    greens: { g: 2, grain: .05, draw(x) {
      x.fillStyle = PAL.white; x.beginPath(); x.moveTo(0, 880);
      for (let X = 0; X <= W; X += 20) x.lineTo(X, 870 + vnoise(X * .01 + 3) * 16);
      x.lineTo(W, H); x.lineTo(0, H); x.fill();
      x.fillStyle = rgba('#b3b0a2', .6); x.beginPath(); x.moveTo(0, 950); x.lineTo(W, 950); x.lineTo(W, H); x.lineTo(0, H); x.fill();
    } },
    reds: { g: 3, draw(x) {
      x.fillStyle = PAL.beni; x.beginPath(); x.arc(1420, 300, 42, 0, TAU); x.fill();
    } },
    key: { g: 0, speck: .12, draw(x) {
      duskPeak(x, { lines: true, lw: 2.6, snowLine: S, frac: .4, seed: 5 });
      x.strokeStyle = S; x.lineWidth = 1.6; x.beginPath(); x.arc(1420, 300, 42, 0, TAU); x.stroke();
      x.strokeStyle = rgba(S, .5); x.lineWidth = 1.4;
      for (let i = 0; i < 8; i++) { const X = 100 + i * 230; x.beginPath(); x.moveTo(X, 150 + (i % 3) * 90); x.lineTo(X + 200, 165 + (i % 3) * 90); x.stroke(); }
    } },
  },
  paint(x, t, R) {
    R.L('skyB'); R.L('reds'); R.L('greens');
    const fallU = seg(t, T.fall[0], T.fall[1]);
    const px = 880, py = 872;
    if (fallU <= 0) {
      R.D(3, x => figure(x, px, py, 124, { mode: 'stand', t: q8(t), bundle: true, flip: true, seed: 4 }));
    } else {
      R.D(3, x => figure(x, px + fallU * 30, py, 124, { mode: fallU >= 1 ? 'lie' : 'fall', u: fallU, t: q8(t), flip: true, seed: 4 }));
    }
    R.L('key');
    if (t >= T.arrow) {
      const au = seg(t, T.arrow, T.arrow + .5), ax = lerp(1820, 940, au), ay = lerp(700, 792, au);
      R.D(3, x => {
        x.strokeStyle = PAL.beni; x.lineWidth = 5; x.lineCap = 'round';
        x.beginPath(); x.moveTo(ax, ay); x.lineTo(ax - 150, ay - 17); x.stroke();
        x.lineWidth = 3;
        x.beginPath(); x.moveTo(ax - 150, ay - 17); x.lineTo(ax - 172, ay - 26); x.moveTo(ax - 150, ay - 17); x.lineTo(ax - 168, ay - 4); x.stroke();
      });
    }
  },
};

// ————— VI · The snow (paper is the white) —————
export const V6 = {
  id: 'v6',
  layers: {
    skyB: { g: 1, grain: .1, draw(x) {
      bokashi(x, 0, FR.y0, W, 500, '#8b8a80', .8, 0, { rough: 30, seed: 6 });
      bokashi(x, 0, 340, W, 760, PALEB2, .5, .2, { rough: 22, seed: 9 });
      duskPeak(x, { body: '#5f5e58', snow: PAL.white, frac: .46, seed: 5, shade: '#4a4540' });
    } },
    greens: { g: 2, grain: .04, draw(x) {
      x.fillStyle = PAL.white; x.beginPath(); x.moveTo(0, 860);
      for (let X = 0; X <= W; X += 20) x.lineTo(X, 850 + vnoise(X * .01 + 3) * 16);
      x.lineTo(W, H); x.lineTo(0, H); x.fill();
    } },
    reds: { g: 3, draw(x) { } },
    key: { g: 0, speck: .12, draw(x) {
      duskPeak(x, { lines: true, lw: 2.4, snowLine: S, frac: .46, seed: 5, lineCol: '#4a4540' });
    } },
  },
  paint(x, t, R) {
    R.L('skyB'); R.L('greens');
    const u = seg(t, T.v6[0] + .4, T.erase[0]);
    R.D(3, x => {
      figure(x, 910, 872, 124, { mode: 'lie', t: q8(t), flip: true, seed: 4 });
      if (u > 0) { x.fillStyle = PAL.white; x.beginPath(); x.ellipse(910, 872, 130 + u * 60, 26 + u * 34, 0, Math.PI, 0); x.fill(); x.strokeStyle = '#8b8a80'; x.lineWidth = 2; x.stroke(); }
    });
    R.L('key');
    const tq = q12(t), R2 = mulberry(21);
    R.D(1, x => {
      x.fillStyle = PAL.white;
      for (let i = 0; i < 130; i++) {
        const sx = R2() * W, sp = 60 + R2() * 130, ph = R2();
        const yy = ((tq * sp / 12 + ph * 1400) % 1240) - 80, xx = (sx + Math.sin(tq * 2 + i) * 30 + tq * 14) % W;
        x.beginPath(); x.arc(xx, yy, 2 + R2() * 4, 0, TAU); x.fill();
      }
    });
  },
};

// ————— VII · The glacier (alternate impression: the same view in ice) —————
export const V7 = {
  id: 'v7',
  layers: {
    skyB: { g: 1, grain: .12, draw(x) {
      bokashi(x, 0, FR.y0, W, 420, ICED, .95, 0, { rough: 30, seed: 4 });
      bokashi(x, 0, 280, W, 640, PALEB, 0, .3, { rough: 20, seed: 8 });
      duskPeak(x, { body: ICE, snow: PAL.white, frac: .44, seed: 5, shade: ICED });
    } },
    greens: { g: 2, grain: .06, draw(x) {
      x.fillStyle = PALEB2; x.beginPath(); x.moveTo(0, 860);
      for (let X = 0; X <= W; X += 20) x.lineTo(X, 850 + vnoise(X * .01 + 3) * 16);
      x.lineTo(W, H); x.lineTo(0, H); x.fill();
      for (let b = 0; b < 4; b++) {
        const yy = 880 + b * 46;
        bokashi(x, 0, yy, W, yy + 60, b % 2 ? ICE : PALEB, .85, .15, { rough: 10, seed: 10 + b });
        x.strokeStyle = rgba(ICEX, .7); x.lineWidth = 2.4; x.lineCap = 'round';
        x.beginPath(); x.moveTo(0, yy + 40);
        for (let X = 0; X <= W; X += 40) x.lineTo(X, yy + 40 + Math.sin(X * .01 + b) * 8);
        x.stroke();
      }
      x.strokeStyle = ICEX; x.lineWidth = 3;
      for (let i = 0; i < 5; i++) { const X = 240 + i * 340; x.beginPath(); x.moveTo(X, 900 + (i % 2) * 40); x.lineTo(X + 90, 960 + (i % 2) * 40); x.stroke(); }
    } },
    reds: { g: 3, draw(x) { } },
    key: { g: 0, speck: .12, draw(x) {
      duskPeak(x, { lines: true, lw: 2.6, snowLine: S, frac: .44, seed: 5, lineCol: ICEX });
    } },
  },
  paint(x, t, R) { R.L('skyB'); R.L('greens'); R.L('key'); },
};

// ————— VIII · 1991 (the discovery, printed block by block) —————
export const V8 = {
  id: 'v8',
  layers: {
    skyB: { g: 1, grain: .1, draw(x) {
      bokashi(x, 0, FR.y0, W, 380, PALEB, .8, 0, { rough: 26, seed: 3 });
      bokashi(x, 0, 260, W, 600, PALEB2, 0, .3, { rough: 18, seed: 7 });
      duskPeak(x, { body: PAL.prusL, snow: PAL.white, frac: .5, seed: 5, shade: PAL.prus });
    } },
    greens: { g: 2, grain: .05, draw(x) {
      x.fillStyle = PAL.white; x.beginPath(); x.moveTo(0, 860);
      for (let X = 0; X <= W; X += 20) x.lineTo(X, 850 + vnoise(X * .01 + 3) * 16);
      x.lineTo(W, H); x.lineTo(0, H); x.fill();
      x.strokeStyle = rgba(ICE, .8); x.lineWidth = 5; x.lineCap = 'round';
      x.beginPath(); x.moveTo(300, 1000); x.quadraticCurveTo(500, 940, 700, 930); x.stroke();
      rock(x, [[1240, 960], [1270, 840], [1380, 780], [1500, 820], [1540, 940], [1520, 1040], [1260, 1040]], { body: '#8b8a80', seed: 4 });
    } },
    reds: { g: 3, draw(x) {
      x.fillStyle = '#4a4540'; x.strokeStyle = S; x.lineWidth = 2.6;
      x.beginPath(); poly(x, wob([[820, 872], [880, 848], [960, 844], [1030, 858], [1050, 872]], 3, 8)); x.fill(); x.stroke();
    } },
    key: { g: 0, speck: .12, draw(x) {
      duskPeak(x, { lines: true, lw: 2.4, snowLine: S, frac: .5, seed: 5 });
      rock(x, [[1240, 960], [1270, 840], [1380, 780], [1500, 820], [1540, 940], [1520, 1040], [1260, 1040]], { lines: true, lw: 2.4, seed: 4 });
      x.strokeStyle = S; x.lineWidth = 2.6; x.beginPath(); x.moveTo(820, 872); x.quadraticCurveTo(930, 838, 1050, 872); x.stroke();
    } },
  },
  paint(x, t, R) {
    R.L('skyB'); R.L('greens'); R.L('reds'); R.L('key');
    R.D(3, x => {
      tinyFigure(x, 1240, 890, 88, { col: S, step: q8(t) % 2 });
      tinyFigure(x, 1130, 900, 84, { col: S, capCol: '#5e4631' });
      x.strokeStyle = S; x.lineWidth = 5; x.lineCap = 'round';
      x.beginPath(); x.moveTo(1130, 900 - 62); x.lineTo(1108, 830); x.stroke();
    });
  },
};

export const VIEWS = [V1, V2, V3, V4, V5, V6, V7, V8];
