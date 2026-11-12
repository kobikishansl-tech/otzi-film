# Foley + VO + score -> mix.wav for the 30 s whiteboard sample.
# Marker/eraser foley is shaped by the engine's hand-speed curve and panned by stroke position;
# the score is ducked under the voice; everything balanced by RMS.
import sys, os, json
import numpy as np
import soundfile as sf
import soxr
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import SR, bp, lp, hp, add, compress, limit
from core.audio import sampler as S

HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); E = ev['ev']; DUR = ev['dur']
rng = np.random.default_rng(11)
NS = int((DUR + 1) * SR)
fol, room, vo = np.zeros((NS, 2), np.float32), np.zeros((NS, 2), np.float32), np.zeros((NS, 2), np.float32)
tt = lambda d: np.arange(int(d * SR)) / SR
def db(x): return 10 ** (x / 20)
def put(buf, x, t, g=1., pan=0.):
    if t < 0 or t >= DUR: return
    add(buf, np.asarray(x, np.float32), t, g, pan)

_band = {}
def band(n, lo, hi):
    k = (lo, hi)
    if k not in _band: _band[k] = bp(rng.standard_normal(SR * 8), lo, hi, 2).astype(np.float32)
    b = _band[k]; i = int(rng.integers(0, len(b) - n - 1)); return b[i:i + n]

def marker(dur, length, kind, pen, z=1.):
    d = max(.03, dur or .05); n = int(d * SR); u = np.linspace(0, 1, n)
    v = 1 - .8 * np.cos(2 * np.pi * u)
    if kind == 'dash': v = np.ones(n) * 1.2
    a = (v / 1.8) ** .8 * np.minimum(1, u * d / .006) * np.minimum(1, (1 - u) * d / .012)
    br = {'black': 1.0, 'orange': 1.12, 'blue': .92}.get(pen, 1.)
    hiss = band(n, 2200 * br, 7500 * br) * (.55 + .45 * v / 1.8)
    body = band(n, 500 * br, 1500 * br) * .45
    grain = (rng.random(n) < .004 * (1 + v)) * rng.standard_normal(n) * .8
    return (hiss + body + bp(grain, 1500, 6000)) * a

def tap(z=1.):
    n = int(.045 * SR); u = np.linspace(0, 1, n)
    return bp(rng.standard_normal(n), 1800, 7000) * np.exp(-u * 60) * .5

def eraser(dur):
    d = max(.1, dur); n = int(d * SR); u = np.linspace(0, 1, n)
    v = 1 + .6 * np.sin(2 * np.pi * 3.2 * u)
    return band(n, 300, 1900) * (.4 + .3 * v) * np.minimum(1, u * 30) * np.minimum(1, (1 - u) * 12)

def whoosh(d, v=1.):
    n = int(d * SR); t = tt(d); sh = np.sin(np.pi * t / d) ** 2
    return bp(rng.standard_normal(n), 300, 2400) * sh * .35 * v

def cap_pop():
    n = int(.06 * SR); u = np.linspace(0, 1, n)
    x = bp(rng.standard_normal(n), 1200, 5000) * np.exp(-u * 70)
    return x + np.sin(2 * np.pi * 900 * tt(.06)) * np.exp(-u * 50) * .3

def cap_on():
    n = int(.09 * SR); u = np.linspace(0, 1, n)
    return (bp(rng.standard_normal(n), 500, 3000) * np.exp(-u * 40) + np.sin(2 * np.pi * 420 * tt(.09)) * np.exp(-u * 35) * .4) * .8

# ─── foley from events
for e in E:
    ty, t = e['type'], e['t']; pan = e.get('pan', 0); off = db(-9) if e.get('on', 1) == 0 else 1
    if ty in ('stroke', 'write', 'dash'): put(fol, marker(e['dur'], e['len'], ty, e.get('pen'), e.get('z', 1)), t, off * (.8 if ty == 'write' else 1.), pan)
    elif ty == 'tap': put(fol, tap(e.get('z', 1)), t, off, pan)
    elif ty == 'erase': put(fol, eraser(e['dur']), t, 1.1, .1)
    elif ty == 'cap': put(fol, cap_pop(), t, 1, .35)
    elif ty == 'capOn': put(fol, cap_on(), t, 1, .45)

# pens flying in / out after long gaps
by_pen = {}
for e in E:
    if e['type'] in ('stroke', 'write', 'dash', 'tap'): by_pen.setdefault(e.get('pen', 'black'), []).append(e)
for pen, L in by_pen.items():
    L.sort(key=lambda e: e['t'])
    for a, b in zip(L, L[1:]):
        if b['t'] - (a['t'] + a['dur']) > .75:
            put(fol, whoosh(.38, .35), a['t'] + a['dur'], 1, .5); put(fol, whoosh(.42, .45), b['t'] - .42, 1, .4)
    put(fol, whoosh(.42, .45), L[0]['t'] - .42, 1, .4)

# camera moves (title pull-back, hole pan, spaghetti push, wide pull)
for t0, d, v in [(5.6, .8, .8), (9.5, .9, .9), (16.8, .6, .7), (21.9, .6, .6), (26.8, .9, .9)]:
    put(fol, whoosh(d, v), t0, 1, 0)

# ─── room tone
room_tone = lp(rng.standard_normal(NS), 900) * .010 + lp(rng.standard_normal(NS), 180) * .012
room[:, 0] += room_tone; room[:, 1] += np.roll(room_tone, 311)
room = S.room(room, size=.35, mix=.25)

# ─── VO
vo_lines = json.load(open(os.path.join(HERE, 'lines.json')))
vo_t = {e['id']: e['t'] for e in E if e['type'] == 'vo'}
vo_mono = np.zeros(NS, np.float32)
for L in vo_lines:
    y, sr = sf.read(os.path.join(HERE, 'voices', L['id'] + '.wav'))
    y = soxr.resample(y.astype(np.float32), sr, SR)
    i = int(vo_t[L['id']] * SR); vo_mono[i:i + len(y)] += y[:NS - i]
vo_mono = hp(vo_mono, 70); vo_mono = compress(vo_mono / (np.abs(vo_mono).max() + 1e-9) * .8, thr=.2, ratio=3.0, att=.004, rel=.1)
vo[:, 0] = vo_mono; vo[:, 1] = vo_mono
vo = vo * .85 + S.room(vo, size=.2, mix=.1) * .15

# ─── score, ducked under VO
mus, _ = sf.read(os.path.join(HERE, 'music/score.wav')); mus = mus[:NS]
if len(mus) < NS: mus = np.pad(mus, ((0, NS - len(mus)), (0, 0)))
env = np.abs(vo_mono); win = int(.05 * SR)
env = np.convolve(env, np.ones(win) / win, 'same'); on = (env > .02).astype(np.float32)
att, rel = int(.06 * SR), int(.35 * SR)
dk = np.zeros(NS, np.float32); g = 0.
for j in range(0, NS, 240):
    tgt = on[j]; g += (tgt - g) * (240 / att if tgt > g else 240 / rel); dk[j:j + 240] = g
mus = mus * (1 - (1 - db(-9)) * dk)[:, None]

# ─── balance by RMS
def rms(x): return float(np.sqrt(np.mean(x[np.abs(x).max(1) > 1e-4] ** 2))) if np.any(np.abs(x) > 1e-4) else 1.
vo_r, mu_r, fo_r = rms(vo), rms(mus), rms(fol)
mix = vo + mus * (vo_r / mu_r) * db(-6.5) + fol * (vo_r / fo_r) * db(-11) + room * db(0)
mix = np.stack([limit(mix[:, c], .95) for c in range(2)], 1)
sf.write(os.path.join(HERE, 'mix.wav'), mix[:int(DUR * SR)].astype(np.float32), SR)
print('rms vo/music/foley', round(20 * np.log10(vo_r), 1), round(20 * np.log10(mu_r), 1), round(20 * np.log10(fo_r), 1), 'peak', float(np.abs(mix).max()))
