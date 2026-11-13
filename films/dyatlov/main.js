// DYATLOV PASS — dispatch, subtitles, events, poster
import { DUR, T, VO, SCENES, sceneAt } from './story.js';
import { SHOT } from './scenes.js';
import { drawSubs, textPiece, subLines } from './hud.js';
import { PAL, canvas, fillPaper, Pl, trace, piece } from './paper.js';
import { put, mul, T as Tm } from './rig.js';
import { chainPiece } from './hikers.js';
import { DPAL } from './world.js';
import { clamp, lerp, seg, ss } from '/core/lib.js';

const qs = new URLSearchParams(location.search);
const cv = document.getElementById('cv'), g = cv.getContext('2d');
await document.fonts.load('600 44px "Fraunces"'); await document.fonts.load('800 40px "Fraunces"');
await document.fonts.load('700 40px "Fraunces"'); await document.fonts.load('italic 500 40px "Fraunces"');
const W = 1920, H = 1080;

// narration texts (mirror of lines.json; times live in story.js VO)
const LINES = {
  L1: 'In February 1959, nine experienced ski hikers walked into the northern Urals of the Soviet Union — and never walked out.',
  L2: 'They were students and graduates of the Ural Polytechnic in Sverdlovsk, led by a twenty-three-year-old engineer: Igor Dyatlov.',
  L3: 'The route was demanding — a third-category winter trek. Ten set out. One turned back, sick, at the last inhabited place.',
  L4: 'His name was Yuri Yudin. His goodbye at Vizhay became one of the most famous farewell photographs in the mountains — and the only reason this story is known.',
  L5: 'On the first of February, the nine climbed a saddle below a peak the local Mansi people call Kholat Syakhl — the Mountain of the Dead.',
  L6: 'The last frame of their camera shows the evening camp: a step cut into the slope, and the tent pitched on it.',
  L7: 'That night, the wind did what wind does below a ridge. It poured down the slope, hour after hour, packing snow onto the shoulder above their camp.',
  L8: 'Sometime after half past one, the load let go. A slab of hardened snow slid onto the tent.',
  L9: 'It did not bury them. It pressed them — hard enough to crack ribs and a skull, without leaving a single mark on the skin.',
  L10: 'And in the dark, they did the thing this story is remembered for: they cut their way out of their own tent — from the inside.',
  L11: 'Outside it was minus twenty-five degrees, with wind. Some of them were in socks. Their boots stayed under the snow.',
  L12: 'They went downhill, toward the forest line a mile and a half away. It was the right decision. In that cold, it was also a race they could not all win.',
  L13: 'Under a giant cedar they lit a fire. Two climbed into the tree and broke branches for firewood — some five meters up.',
  L14: 'Two died by the fire. Three turned back up the slope, toward the tent and the clothes that meant survival. None of the three reached it.',
  L15: 'Four went lower, into a ravine by a stream, and dug a den in the snow bank. The stream kept them for three months.',
  L16: 'The tent was found on February twenty-sixth — twenty-six days later, empty, cut open. The search went on until May.',
  L17: 'And the closer people looked, the stranger it seemed. Radiation on some clothing. Fatal injuries with no wounds at all. A tent cut open from the inside.',
  L18: 'So the theories multiplied: a rocket test, ball lightning, a violent quarrel, a creature. The Soviet investigation closed after four months with one phrase: a compelling natural force.',
  L19: 'In 2020, Russia reopened the case and concluded: an avalanche. In 2021, two Swiss engineers put the mountain into a computer — and the mountain agreed.',
  L20: 'A step cut into the slope. Hours of wind-driven snow loading the shoulder above. A slab that waited, and then did not.',
  L21: 'It can explain the delay, the absence of debris, even the strange injuries. It cannot be proven — no one survived to tell the story.',
  L22: 'Today the pass carries Dyatlov\u2019s name. Nine cut, as it were, from one sheet — and the tenth man carried their story for the rest of his life.',
  L23: 'Some mountains keep their dead. This one kept their question.',
};

let DURS = {}; try { const r = await fetch('voices/dur.json'); if (r.ok) DURS = await r.json(); } catch (e) { }
const VO_IDS = Object.keys(VO);
const SUBS = VO_IDS.map((id, i) => {
  const t = VO[id], d = DURS[id] || 3.2, next = i + 1 < VO_IDS.length ? VO[VO_IDS[i + 1]] - .15 : DUR - .05;
  const need = LINES[id].length / 15 + 1.6;   // readable-hold rule (readcheck: 15 latin cps + pad)
  return { t0: t - .05, t1: Math.min(next, t + Math.max(1.8, d + .7, need)), text: LINES[id] };
}).filter(s => s.text);
window.SUBS = SUBS;

// offscreen sheets for slide transitions
const [TCc, TC] = canvas(W, H), [OCc, OC] = canvas(W, H);
const SLIDE = .7;
function paint(ctx, t, name) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  SHOT[name](ctx, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
}
function render(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  const [name, a, b] = sceneAt(t);
  const idx = SCENES.findIndex(s => s[0] === name);
  const inSlide = idx > 0 && t - a < SLIDE;
  if (inSlide) {
    const u = ss(seg(t, a, a + SLIDE));
    const [pname, , pb] = SCENES[idx - 1];
    paint(OC, Math.min(t, pb - .05), pname);
    paint(TC, t, name);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(OCc, -W * .22 * u, 0);
    g.drawImage(TCc, W * (1 - u), 0);
  } else {
    paint(g, t, name);
  }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  if (qs.get('nosub') !== '1') drawSubs(g, t, SUBS);
  if (qs.get('poster') === '1') drawPoster(g);
}

// readable-text registry (readcheck contract)
const meas = canvas(10, 10)[1];
function subBox(s) {
  const { w, h } = subLines(s.text);
  return { id: s.text.slice(0, 24), text: s.text, x0: 960 - w / 2, y0: 1080 - 56 - h, x1: 960 + w / 2, y1: 1080 - 56 };
}
const FIXED_TEXTS = [
  { t0: 14.0, t1: 21.7, text: 'DYATLOV PASS', box: [440, 250, 1480, 740] },
  { t0: 14.4, t1: 21.7, text: 'nine hikers · one night · the northern Urals', box: [560, 740, 1360, 810] },
  { t0: 60.0, t1: 76.0, text: '28 JAN · VIZHAY', box: [1160, 700, 1560, 790] },
  { t0: 70.0, t1: 76.0, text: '1 FEB', box: [1360, 310, 1560, 400] },
  { t0: 268.0, t1: 294.0, text: 'FEB 26 · THE TENT', box: [180, 285, 1300, 380] },
  { t0: 284.0, t1: 294.0, text: 'MAY · THE RAVINE', box: [730, 540, 1290, 630] },
  { t0: 295.5, t1: 326.0, text: 'RADIATION', box: [1330, 540, 1720, 630] },
  { t0: 298.0, t1: 326.0, text: 'NO EXTERNAL WOUNDS', box: [1130, 640, 1720, 730] },
  { t0: 300.5, t1: 326.0, text: 'CUT FROM INSIDE', box: [1180, 740, 1720, 830] },
  { t0: 328.0, t1: 362.0, text: '2020 — AN AVALANCHE', box: [280, 810, 900, 900] },
  { t0: 334.0, t1: 362.0, text: '2021 — A DELAYED SLAB, MODELED', box: [280, 930, 1120, 1020] },
  { t0: 392.9, t1: 404.0, text: 'DYATLOV PASS', box: [520, 400, 1400, 570] },
  { t0: 393.2, t1: 404.0, text: 'a red paper-cut documentary · February 1959', box: [520, 590, 1400, 650] },
];
window.TEXTS = t => {
  const out = [];
  for (const s of SUBS) if (t >= s.t0 && t <= s.t1) { const b = subBox(s); out.push(b); }
  for (const f of FIXED_TEXTS) if (t >= f.t0 && t <= f.t1) out.push({ id: f.text.slice(0, 24), text: f.text, x0: f.box[0], y0: f.box[1], x1: f.box[2], y1: f.box[3] });
  return out;
};

// events (foley / ambience / narration)
const EV = [];
T.snips.forEach(s => EV.push({ t: s, type: 'snip' }));
EV.push({ t: T.unfold, type: 'unfold' });
EV.push({ t: T.title, type: 'place' }); EV.push({ t: T.title + 1.05, type: 'stamp' });
EV.push({ t: T.s3, type: 'pageturn' });
for (let k = 0; k < 9; k++) EV.push({ t: T.standUp + k * .09 + .3, type: 'step' });
for (let s = T.yudin + .4; s < T.yudinGone; s += 1.15) EV.push({ t: s, type: 'step' });
EV.push({ t: T.map, type: 'pageturn' });
EV.push({ t: 60, type: 'stamp' }); EV.push({ t: 70, type: 'stamp' });
EV.push({ t: T.peel, type: 'peel' });
EV.push({ t: T.shutter, type: 'shutter' });
EV.push({ t: T.camp, type: 'wind', dur: 46, gain: .55 });
EV.push({ t: T.windUp, type: 'wind', dur: 28, gain: 1 });
EV.push({ t: T.crack, type: 'crack' });
EV.push({ t: T.slide, type: 'rumble', dur: 3.2 }); EV.push({ t: T.shake, type: 'thud', big: 1 });
EV.push({ t: T.cutStart + .4, type: 'knife', dur: 8 });
EV.push({ t: T.cutOpen, type: 'tear' });
EV.push({ t: T.descent, type: 'wind', dur: 26, gain: .8 });
for (let s = 174; s < 196; s += 1.6) EV.push({ t: s, type: 'step' });
EV.push({ t: T.cedar + 1.5, type: 'fire', dur: 37 });
[204, 208, 212, 215].forEach(s => EV.push({ t: s, type: 'branch' }));
EV.push({ t: T.still, type: 'thud', gain: .4 });
EV.push({ t: T.ravine, type: 'stream', dur: 25 });
EV.push({ t: 240, type: 'dig' });
EV.push({ t: T.search, type: 'wind', dur: 31, gain: .5 });
EV.push({ t: 266, type: 'whistle' });
EV.push({ t: 268, type: 'stamp' }); EV.push({ t: 284, type: 'stamp' });
EV.push({ t: T.file, type: 'pageturn' });
T.stamps.forEach(s => EV.push({ t: s, type: 'stamp' }));
T.theories.forEach(s => EV.push({ t: s, type: 'pop' }));
T.snips2.forEach(s => EV.push({ t: s, type: 'snip' }));
EV.push({ t: T.answer, type: 'pageturn' });
EV.push({ t: T.stamp2020, type: 'stamp' }); EV.push({ t: T.stamp2021, type: 'stamp' });
EV.push({ t: T.slowmo, type: 'rumble', dur: 7, gain: .5 });
EV.push({ t: T.coda, type: 'wind', dur: 29, gain: .3 });
EV.push({ t: T.plaque, type: 'place' });
EV.push({ t: T.end, type: 'place' });
T.ticks.forEach(s => EV.push({ t: s, type: 'tick' }));
VO_IDS.forEach(id => EV.push({ t: VO[id], type: 'vo', id }));

// poster: chain of nine on indigo, title on a red hengpi
function drawPoster(g) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'ink', 0, 0, W, H); g.restore();
  const ch = chainPiece({ col: DPAL.hike, seed: 9 });
  put(g, ch, [1, 0, 0, 1, 960 - ch.w * .42 / 2, 830], { shadow: 1.4 });
  const tp = textPiece('DYATLOV PASS', 104, 800, '#fff1d6', 'Fraunces', 7, 6), w = tp.w + 180, x0 = 960 - w / 2;
  g.save(); g.shadowColor = 'rgba(20,4,8,.5)'; g.shadowBlur = 14; g.shadowOffsetX = 5; g.shadowOffsetY = 8; g.fillStyle = PAL.sub;
  g.beginPath(); trace(g, Pl([[x0, 60], [x0 + w, 60], [x0 + w - 40, 140], [x0 + w, 220], [x0, 220], [x0 + 40, 140]], true, .8, 3)); g.fill(); g.restore();
  put(g, tp, [1, 0, 0, 1, 960 - tp.w / 2, 74], { shadow: .5 });
  g.save(); g.font = 'italic 500 34px "Fraunces"'; g.fillStyle = '#d8ccb2'; g.textAlign = 'center';
  g.fillText('nine hikers · one night · the northern Urals', 960, 300); g.restore();
}

if (!qs.get('test')) { window.EV = EV; window.DUR = DUR; window.render = render; window.READY = true; }
