// The Copper Age man: side-view flat figure rig (bearsin cap, fur tunic, grass cape, gaiters, staff, copper axe)
// Poses: walk / stand / kneel / fall(u) / lie / back. Feet at (0,0), height = s. All strokes are the key-block ink.
import { clamp, lerp, seg, mulberry, vnoise, TAU } from '/core/lib.js';
import { PAL, smooth, poly, carve, wob, line, fillPath, rgba } from './print.js';

const S = PAL.sumi;
const FUR = '#6b4f33', FURD = '#4a3520', FURL = '#8f6f49', CAP = '#3f2e1c', CAPL = '#5c4630';
const GRASS = '#c9a45c', GRASSD = '#9a7a3e', SKIN = '#d9b48a', GAIT = '#7a6a50', LEATH = '#5e4631';

function cap(x, hx, hy, r, tilt = 0) {
  x.save(); x.translate(hx, hy); x.rotate(tilt);
  x.fillStyle = CAP; x.beginPath(); x.arc(0, 0, r, Math.PI, 0); x.quadraticCurveTo(r * 1.06, r * .28, r * .55, r * .3);
  x.lineTo(-r * .62, r * .3); x.quadraticCurveTo(-r * 1.05, r * .26, -r, 0); x.fill();
  x.strokeStyle = S; x.lineWidth = r * .1; x.beginPath(); x.arc(0, 0, r, Math.PI, 0); x.stroke();
  x.beginPath(); x.moveTo(-r * 1.02, r * .3); x.lineTo(r * 1.04, r * .3); x.stroke();
  x.lineWidth = r * .06;
  for (let i = -2; i <= 2; i++) { const a = -Math.PI / 2 + i * .5; x.beginPath(); x.moveTo(Math.cos(a) * r * .55, Math.sin(a) * r * .55 - r * .05); x.lineTo(Math.cos(a) * r * .92, Math.sin(a) * r * .92 - r * .05); x.stroke(); }
  x.restore();
}

function leg(x, hx, ky, fx, fy, lw, back = false) {
  x.strokeStyle = back ? '#6a5c44' : GAIT; x.lineWidth = lw; x.lineCap = 'round';
  x.beginPath(); x.moveTo(hx, ky); x.lineTo(lerp(hx, fx, .45), lerp(ky, fy, .45)); x.stroke();
  x.strokeStyle = back ? '#5c4f3a' : '#6e5f46'; x.lineWidth = lw * .95;
  x.beginPath(); x.moveTo(hx, ky); x.lineTo(fx, fy); x.stroke();
  x.strokeStyle = S; x.lineWidth = lw * .3;
  x.beginPath(); x.moveTo(fx - lw * .5, fy); x.lineTo(fx + lw * .7, fy); x.stroke();
}

export function figure(x, px, py, s, o = {}) {
  const R = mulberry(o.seed || 5);
  const mode = o.mode || 'stand', ph = o.ph || 0, t = o.t || 0;
  x.save(); x.translate(px, py);
  if (o.flip) x.scale(-1, 1);
  const h = s, lw = h * .085;
  let bob = 0, lean = 0;

  if (mode === 'lie') {
    // face down in the snow: body horizontal, cape and limbs still
    const L = h * .95;
    x.fillStyle = FURD; x.beginPath();
    poly(x, wob([[-L * .5, -h * .1], [-L * .2, -h * .22], [L * .1, -h * .24], [L * .38, -h * .16], [L * .46, -h * .04], [L * .2, 0], [-L * .3, 0]], h * .015, 7));
    x.fill(); x.strokeStyle = S; x.lineWidth = h * .02; x.stroke();
    cap(x, L * .30, -h * .17, h * .13, .1);
    // one arm out
    x.strokeStyle = FUR; x.lineWidth = h * .07; x.beginPath(); x.moveTo(L * .05, -h * .2); x.lineTo(L * .3, -h * .26); x.stroke();
    x.strokeStyle = SKIN; x.lineWidth = h * .05; x.beginPath(); x.moveTo(L * .3, -h * .26); x.lineTo(L * .42, -h * .28); x.stroke();
    // grass cape trailing
    x.strokeStyle = GRASS; x.lineWidth = h * .028;
    for (let i = 0; i < 7; i++) { const gx = -L * .5 + i * h * .04; x.beginPath(); x.moveTo(gx, -h * .12); x.quadraticCurveTo(gx - h * .05, -h * .06, gx - h * .09, -h * .015 + (R() - .5) * h * .01); x.stroke(); }
    x.restore(); return;
  }
  if (mode === 'fall') {
    const u = clamp(o.u || 0);
    x.rotate(-u * 1.35); x.translate(u * h * .18, 0);
  }
  if (mode === 'kneel') bob = h * .1;

  const hipY = -h * .46 + bob, shY = -h * .74 + bob, headY = -h * .84 + bob;
  if (mode === 'walk') { bob += Math.abs(Math.sin(ph * Math.PI * 2)) * h * .022; lean = .06 + Math.sin(ph * Math.PI * 2) * .015; }
  x.rotate(lean);

  // legs
  if (mode === 'walk') {
    const sw = Math.sin(ph * Math.PI * 2), c = Math.cos(ph * Math.PI * 2);
    x.save(); x.translate(0, hipY);
    x.strokeStyle = '#6a5c44'; x.lineWidth = lw; x.beginPath(); x.moveTo(0, 0); x.lineTo(-sw * h * .13, hipY * .45 + Math.abs(c) * h * .02); x.lineTo(-sw * h * .16, 0); x.stroke(); x.restore();
    x.save(); x.translate(0, hipY);
    x.strokeStyle = '#6e5f46'; x.lineWidth = lw; x.beginPath(); x.moveTo(0, 0); x.lineTo(sw * h * .13, hipY * .45); x.lineTo(sw * h * .16, 0); x.stroke(); x.restore();
  } else if (mode === 'kneel') {
    x.strokeStyle = '#6a5c44'; x.lineWidth = lw; x.beginPath(); x.moveTo(0, hipY); x.lineTo(-h * .1, -h * .04); x.lineTo(h * .06, 0); x.stroke();
    x.strokeStyle = '#6e5f46'; x.lineWidth = lw; x.beginPath(); x.moveTo(0, hipY); x.lineTo(h * .1, 0); x.stroke();
  } else {
    leg(x, -h * .03, hipY, -h * .045, 0, lw, true);
    leg(x, h * .03, hipY, h * .045, 0, lw, false);
  }

  // grass cape (behind torso)
  x.strokeStyle = GRASS; x.lineCap = 'round';
  const capeSway = mode === 'walk' ? Math.sin(ph * Math.PI * 2 + 1) * h * .02 : Math.sin(t * 1.1) * h * .012;
  for (let i = 0; i < 9; i++) {
    const u = i / 8, gx = lerp(-h * .055, -h * .16, u), gy = lerp(shY + h * .02, hipY + h * .06, u);
    x.lineWidth = h * .022;
    x.beginPath(); x.moveTo(gx, shY + h * .03);
    x.quadraticCurveTo(gx - h * .05, (shY + hipY) / 2, gx + capeSway - h * (.04 + u * .05), hipY + h * .1);
    x.stroke();
  }
  x.strokeStyle = GRASSD; x.lineWidth = h * .012;
  for (let i = 0; i < 5; i++) { const u = i / 4, gx = lerp(-h * .07, -h * .14, u); x.beginPath(); x.moveTo(gx, shY + h * .05); x.lineTo(gx - h * .05 + capeSway, hipY + h * .08); x.stroke(); }

  // torso: fur tunic
  x.fillStyle = FUR; x.beginPath();
  poly(x, wob([[-h * .085, shY], [h * .085, shY], [h * .1, hipY + h * .02], [h * .055, hipY + h * .05], [-h * .06, hipY + h * .05], [-h * .1, hipY + h * .02]], h * .012, 3));
  x.fill(); x.strokeStyle = S; x.lineWidth = h * .016; x.stroke();
  // fur ticks
  x.strokeStyle = FURL; x.lineWidth = h * .012;
  for (let i = 0; i < 6; i++) { const yy = shY + h * .05 + i * h * .05, d = (R() - .5) * h * .02; x.beginPath(); x.moveTo(-h * .06 + d, yy); x.lineTo(h * .05 + d, yy); x.stroke(); }

  // arms + staff / axe
  const swing = mode === 'walk' ? Math.sin(ph * Math.PI * 2) * h * .05 : 0;
  x.strokeStyle = FUR; x.lineWidth = h * .055;
  x.beginPath(); x.moveTo(0, shY + h * .02); x.quadraticCurveTo(h * .1, shY + h * .1, h * .08 + swing, hipY + h * .02); x.stroke();
  x.strokeStyle = SKIN; x.lineWidth = h * .04;
  x.beginPath(); x.moveTo(h * .08 + swing, hipY + h * .02); x.lineTo(h * .1 + swing, hipY + h * .08); x.stroke();

  if (o.axe && mode !== 'lie') {
    // copper axe carried over the shoulder
    const axX = h * .02, axY = shY - h * .04;
    x.strokeStyle = '#4a3520'; x.lineWidth = h * .035;
    x.beginPath(); x.moveTo(h * .02, hipY + h * .04); x.lineTo(axX + h * .04, axY - h * .12); x.stroke();
    x.fillStyle = '#9a6a3c'; x.strokeStyle = S; x.lineWidth = h * .012;
    x.beginPath(); poly(x, [[axX + h * .02, axY - h * .13], [axX + h * .12, axY - h * .17], [axX + h * .14, axY - h * .09], [axX + h * .045, axY - h * .07]]); x.fill(); x.stroke();
  } else if (mode !== 'lie') {
    // staff
    x.strokeStyle = '#4a3520'; x.lineWidth = h * .028;
    x.beginPath(); x.moveTo(h * .12, -h * .62); x.lineTo(h * .16, 0); x.stroke();
  }

  // head + bearskin cap
  const hx = h * .015, hy = headY;
  x.fillStyle = SKIN; x.beginPath(); x.arc(hx, hy, h * .085, 0, TAU); x.fill();
  x.strokeStyle = S; x.lineWidth = h * .014; x.stroke();
  // beard + eye
  x.strokeStyle = S; x.lineWidth = h * .014;
  x.beginPath(); x.arc(hx, hy, h * .085, Math.PI * .75, Math.PI * 1.05); x.stroke();
  x.fillStyle = S; x.beginPath(); x.arc(hx - h * .045, hy - h * .005, h * .011, 0, TAU); x.fill();
  cap(x, hx, hy - h * .028, h * .095, -.06);

  // bundle on the back
  if (o.bundle && mode !== 'lie') {
    x.fillStyle = LEATH; x.strokeStyle = S; x.lineWidth = h * .012;
    x.beginPath(); poly(x, wob([[-h * .1, shY + h * .01], [-h * .19, shY - h * .02], [-h * .2, shY + h * .08], [-h * .11, shY + h * .09]], h * .01, 9)); x.fill(); x.stroke();
    x.strokeStyle = GRASSD; x.lineWidth = h * .012; x.beginPath(); x.moveTo(-h * .1, shY + h * .01); x.lineTo(-h * .19, shY + h * .02); x.stroke();
  }
  x.restore();
}

// Small distant figure (no detail, clear silhouette)
export function tinyFigure(x, px, py, s, o = {}) {
  x.save(); x.translate(px, py);
  x.strokeStyle = o.col || S; x.lineCap = 'round';
  x.lineWidth = s * .16; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -s * .45); x.stroke();
  x.lineWidth = s * .12;
  x.beginPath(); x.moveTo(0, -s * .45); x.lineTo(-s * .1, -s * .75); x.stroke();
  x.beginPath(); x.moveTo(0, -s * .3); x.lineTo(-s * .16, -s * .42); x.stroke();
  x.beginPath(); x.moveTo(0, -s * .3); x.lineTo(s * .16, -s * .42 + (o.step ? s * .1 : 0)); x.stroke();
  x.beginPath(); x.moveTo(0, 0); x.lineTo(-s * .12, 0); x.stroke();
  x.beginPath(); x.moveTo(0, 0); x.lineTo(s * .12, 0); x.stroke();
  x.fillStyle = o.col || S; x.beginPath(); x.arc(0, -s * .85, s * .13, 0, TAU); x.fill();
  if (o.cap !== false) { x.fillStyle = o.capCol || '#3f2e1c'; x.beginPath(); x.arc(0, -s * .88, s * .14, Math.PI, 0); x.fill(); }
  x.restore();
}
