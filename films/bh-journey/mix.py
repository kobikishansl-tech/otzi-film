# Foley + VO + score -> mix.wav for "Black Hole Journey" (pictogram motion).
# UI-style foley (cuts, pops, ticks, arrows) from events.json; the score is ducked under the voice.
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
rng = np.random.default_rng(7)
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

def whoosh(d, v=1., lo=300, hi=2400):
    n = int(d * SR); t = tt(d); sh = np.sin(np.pi * t / d) ** 2
    return bp(rng.standard_normal(n), lo, hi) * sh * .35 * v

def pop():
    n = int(.06 * SR); u = np.linspace(0, 1, n)
    return (bp(rng.standard_normal(n), 1200, 5000) * np.exp(-u * 70) + np.sin(2 * np.pi * 900 * tt(.06)) * np.exp(-u * 50) * .3)

def cut():
    x = whoosh(.4, .9, 200, 3000)
    p = pop()
    x[:len(p)] += p * .5
    return x

def slam():
    n = int(.5 * SR); u = np.linspace(0, 1, n)
    th = np.sin(2 * np.pi * (70 - 30 * u) * tt(.5)) * np.exp(-u * 9)
    return th * .9 + bp(rng.standard_normal(n), 100, 900) * np.exp(-u * 14) * .5

def tick():
    n = int(.05 * SR); u = np.linspace(0, 1, n)
    return (bp(rng.standard_normal(n), 2000, 6000) * np.exp(-u * 90) + np.sin(2 * np.pi * 1400 * tt(.05)) * np.exp(-u * 80) * .4) * .5

def ring():
    n = int(.8 * SR); u = np.linspace(0, 1, n)
    x = (np.sin(2 * np.pi * 1180 * tt(.8)) + .5 * np.sin(2 * np.pi * 1770 * tt(.8))) * np.exp(-u * 5)
    return x * .22 + bp(rng.standard_normal(n), 3000, 7000) * np.exp(-u * 60) * .2

def rise():
    d = 2.2; n = int(d * SR); t = tt(d)
    f = 200 * 2 ** (t / d * 2.2)
    ph = np.cumsum(2 * np.pi * f / SR)
    return (np.sin(ph) * .18 + bp(rng.standard_normal(n), 400, 3000) * .12) * np.minimum(1, t / .4) * np.sin(np.pi * t / d) ** .6

def chip():
    n = int(.12 * SR); u = np.linspace(0, 1, n)
    return (bp(rng.standard_normal(n), 2500, 7000) * np.exp(-u * 45) + np.sin(2 * np.pi * 1050 * tt(.12)) * np.exp(-u * 40) * .3) * .6

def arrow_fx():
    return whoosh(.22, .8, 800, 4500)

# ─── foley from events
for e in E:
    ty, t = e['type'], e['t']; pan = float(e.get('pan', 0) or 0)
    if ty == 'cut': put(fol, cut(), t, 1, 0)
    elif ty == 'pop': put(fol, pop(), t, .8, 0)
    elif ty == 'slam': put(fol, slam(), t, 1, 0)
    elif ty == 'tick': put(fol, tick(), t, .9, .25)
    elif ty == 'ring': put(fol, ring(), t, 1, .1)
    elif ty == 'rise': put(fol, rise(), t, 1, 0)
    elif ty == 'chip': put(fol, chip(), t, .9, -.3)
    elif ty == 'arrow': put(fol, arrow_fx(), t, .9, .2)

# ─── room tone
room_tone = lp(rng.standard_normal(NS), 900) * .010 + lp(rng.standard_normal(NS), 180) * .012
room[:, 0] += room_tone; room[:, 1] += np.roll(room_tone, 311)
room = S.room(room, size=.35, mix=.25)

# ─── VO
vo_lines = json.load(open(os.path.join(HERE, 'voice/lines.json')))
vo_t = {e['id']: e['t'] for e in E if e['type'] == 'vo'}
vo_mono = np.zeros(NS, np.float32)
for L in vo_lines:
    y, sr = sf.read(os.path.join(HERE, 'voice/voices', L['id'] + '.wav'))
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
