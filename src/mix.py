"""Mix: material foley (paper / wood / snow / ice / metal, all synthesised) + narration
+ original score (ducked under dialogue) + per-view ambience + hard silence for the ma (driven by events.json)
→ mix.wav
Usage: .venv/bin/python films/otzi/mix.py   (run core/render/events.mjs, tts and music/score.py first)
"""
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, norm, compress, limit, add
from scipy.signal import resample_poly
from scipy.ndimage import uniform_filter1d

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR)
rng = np.random.default_rng(17)
def nz(d): return rng.standard_normal(int(round(d * SR)))
def brown(d):
    w = np.cumsum(nz(d)); w -= np.linspace(w[0], w[-1], len(w)); return norm(hp(w, 20))
def fade(x, a=.005, r=.02):
    n = len(x); x = x.copy(); A, R = min(n, int(a * SR)), min(n, int(r * SR))
    if A: x[:A] *= np.linspace(0, 1, A)
    if R: x[n - R:] *= np.linspace(1, 0, R)
    return x
def sines(fs, d, taus, amps):
    tt = t_(d); return sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau) for f, tau, a in zip(fs, taus, amps))
def slow(d, rate, depth, seed=0):
    k = max(2, int(d * rate) + 3); r = np.random.default_rng(seed).random(k)
    return 1 - depth + depth * np.interp(np.linspace(0, k - 1, int(round(d * SR))), np.arange(k), r)

# —— Paper ——
def baren(d=.36, v=1):
    tt = t_(d); m = .55 + .45 * np.abs(np.sin(2 * np.pi * 4.6 * tt)); e = np.sin(np.pi * tt / d) ** .7
    return norm(bp(nz(d), 700, 5200) * m * e + lp(nz(d), 500) * e * .3) * v
def slip(v=1):
    d = .28; tt = t_(d); return norm(hp(nz(d), 1800) * np.sin(np.pi * tt / d) ** 2 * (1 - tt / d * .5)) * v
def seal(v=1):
    d = .35; x = sines([88, 180], d, [.07, .03], [1, .4]); x[:int(.012 * SR)] += bp(nz(.012), 200, 1500) * .9
    y = np.zeros(int(.45 * SR)); y[:len(x)] += x; k = int(.22 * SR); c = hp(nz(.08), 3000) * env_exp(.08, .02) * .15; y[k:k + len(c)] += c
    return norm(lp(y, 2500)) * v
def scroll(d, v=1):
    tt = t_(d); e = np.sin(np.pi * np.minimum(tt / d, 1)) ** 1.2
    f = np.interp(tt, [0, d], [1200, 3200]); x = np.zeros_like(tt); blk = 2400
    src = nz(d)
    for i in range(0, len(tt), blk): x[i:i + blk] = bp(src[max(0, i - 4800):i + blk], f[i] * .6, f[i] * 1.6)[-len(x[i:i + blk]):]
    cr = hp(nz(d), 4000) * (rng.random(len(tt)) > .9985) * 3
    return norm(x * e + lp(cr, 9000) * e * .4) * v
# —— Wood / stone ——
def block(v=1):
    d = .2; x = sines([180, 410, 960], d, [.05, .03, .015], [1, .6, .3]); x[:int(.004 * SR)] += nz(.004) * .5; return norm(lp(x, 3000)) * v
def setdown(m='wood', v=1):
    if m == 'wood':
        d = .22; x = sines([170, 390, 720], d, [.06, .03, .012], [1, .5, .25]); x[:int(.01 * SR)] += bp(nz(.01), 300, 2500) * .6; return norm(lp(x, 2200)) * v
    if m == 'fur':
        d = .3; tt = t_(d); return norm(bp(nz(d), 400, 2200) * np.sin(np.pi * tt / d) ** 2 * (rng.random(len(tt)) > .4)) * v * .8
    if m == 'grass':
        d = .32; tt = t_(d); return norm(bp(nz(d), 1500, 6500) * np.sin(np.pi * tt / d) ** 1.5 * (rng.random(len(tt)) > .35)) * v * .75
    d = .25; tt = t_(d)
    x = sines([120, 260], d, [.05, .025], [.8, .4]) + bp(nz(d), 900, 3500) * np.sin(np.pi * tt / d) ** 2 * .5
    return norm(lp(x, 3000)) * v
def step(m='dirt', v=1):
    if m == 'snow':
        d = .16; tt = t_(d); return norm(bp(nz(d), 500, 3500) * np.exp(-tt / .045) * (1 + .4 * np.sin(2 * np.pi * 45 * tt))) * v * .8
    d = .11; tt = t_(d); return norm(bp(nz(d), 300, 2600) * np.exp(-tt / .03) * (1 + .5 * np.sin(2 * np.pi * 60 * tt))) * v * .7
def knife(v=1):
    d = .22; tt = t_(d); f = np.interp(tt, [0, d], [2600, 5200]); x = np.zeros_like(tt); blk = 1200
    src = nz(d)
    for i in range(0, len(tt), blk): x[i:i + blk] = bp(src[max(0, i - 960):i + blk], f[i] * .8, f[i] * 1.5)[-len(x[i:i + blk]):]
    return norm(x * np.sin(np.pi * tt / d) ** .8) * v
def board(v=1):
    d = .3; x = sines([210, 480, 900], d, [.05, .028, .014], [1, .55, .3]); x[:int(.005 * SR)] += nz(.005) * .5
    y = np.zeros(int(.4 * SR)); y[:len(x)] += x; k = int(.13 * SR); y[k:k + len(x) // 2] += x[:len(x) // 2] * .55
    return norm(lp(y, 3000)) * v
def point(v=1):
    d = .18; tt = t_(d); return norm(bp(nz(d), 900, 4200) * np.sin(np.pi * tt / d) ** 2 * (rng.random(len(tt)) > .55)) * v * .8
# —— Metal / body / bell ——
def whoosh(v=1):
    d = .45; tt = t_(d); f = np.interp(tt, [0, d], [3600, 700]); x = np.zeros_like(tt); blk = 1800
    src = nz(d)
    for i in range(0, len(tt), blk): x[i:i + blk] = bp(src[max(0, i - 1440):i + blk], f[i] * .7, f[i] * 1.6)[-len(x[i:i + blk]):]
    return norm(x * (tt / d) ** .6) * v
def thump(v=1):
    d = .5; x = sines([72, 130, 210], d, [.16, .09, .05], [1, .6, .3])
    x[:int(.09 * SR)] += bp(nz(.09), 400, 2400) * env_exp(.09, .03) * .7
    return norm(lp(x, 2200)) * v
def bell(v=1):
    d = 3.2; x = sines([520, 1042, 1567, 2350, 3120], d, [1.6, 1.1, .7, .45, .3], [1, .5, .35, .2, .12])
    x[:int(.003 * SR)] += nz(.003) * .4
    return norm(lp(x, 6000)) * v * .8
def icecreak(v=1):
    d = 1.6; tt = t_(d); f = 90 + 40 * np.sin(2 * np.pi * .8 * tt) - 30 * tt / d
    ph = 2 * np.pi * np.cumsum(np.abs(f)) / SR
    y = np.sin(ph) * np.sin(np.pi * tt / d) ** 1.5
    y += bp(nz(d), 200, 1200) * (uniform_filter1d(np.abs(nz(d)), 2400) > .75) * .8
    return norm(lp(y, 1800)) * v
# —— Wind and cold ——
def wind(d, v=1, lo=150, hi=900, seed=1):
    return norm(bp(brown(d) + nz(d) * .02, lo, hi) * slow(d, .6, .6, seed)) * v
def gust(v=1):
    d = 2.2; tt = t_(d); return norm(bp(nz(d), 300, 1800) * np.sin(np.pi * tt / d) ** 2) * v
def amb(w, d):
    tt = t_(d)
    if w == 'wind':
        return norm(wind(d, .5, 120, 700, 3) + lp(brown(d), 260) * .35)
    if w == 'room':
        return norm(lp(brown(d), 180) * .5 + bp(nz(d), 300, 900) * slow(d, .35, .5, 5) * .18) * .5
    if w == 'highwind':
        return norm(wind(d, .45, 400, 1600, 9) + wind(d, .3, 90, 300, 10))
    if w == 'snow':
        sw = .6 + .4 * (np.sin(2 * np.pi * tt / 5.1 - 1) * .5 + .5) ** 2
        return norm(lp(brown(d), 420) * sw + bp(nz(d), 900, 3800) * sw ** 2 * .16) * .5
    if w == 'deepcold':
        return norm(lp(brown(d), 130) * .7 + wind(d, .25, 200, 800, 11) * .4) * .6
    return np.zeros_like(tt)

fx, ab, vo = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
VOICE = {}
SILENCES = []
for e in E['ev']:
    t, ty, v = e['t'], e['type'], e.get('v', 1)
    if ty == 'vo':
        y, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
        if y.ndim > 1: y = y.mean(1)
        y = resample_poly(y, SR, sr); VOICE[e['id']] = (t, len(y) / SR); add(vo, y, t, 1.0, 0)
    elif ty == 'baren': add(fx, baren(e['d'], v), t, .32, .1)
    elif ty == 'block': add(fx, block(v), t, .3, -.1)
    elif ty == 'slip': add(fx, slip(v), t, .18, .2)
    elif ty == 'seal': add(fx, seal(v), t, .5, 0)
    elif ty == 'scroll': add(fx, scroll(e['d'], v), t, .22, 0)
    elif ty == 'step': add(fx, step(e['m'], v), t, .12 if e['m'] == 'dirt' else .15, .15)
    elif ty == 'setdown': add(fx, setdown(e['m'], v), t, .2, .1)
    elif ty == 'knife': add(fx, knife(v), t, .12, .25)
    elif ty == 'board': add(fx, board(v), t, .25, -.1)
    elif ty == 'point': add(fx, point(v), t, .1, .3)
    elif ty == 'whoosh': add(fx, whoosh(v), t, .3, -.2)
    elif ty == 'thump': add(fx, thump(v), t, .55, 0)
    elif ty == 'bell': add(ab, bell(v), t, .16, 0)
    elif ty == 'icecreak': add(fx, icecreak(v), t, .3, 0)
    elif ty == 'gust': add(ab, gust(v), t, .18, -.2)
    elif ty == 'amb':
        a = amb(e['w'], e['d']); a = fade(a, .4, .4); add(ab, a, t, .22 if e['w'] != 'deepcold' else .26, 0)
    elif ty == 'silence': SILENCES.append((t, t + e['d']))

# Narration: light compression + a very faint room sound
vm = compress(vo[:, 0] * 1.414, .2, 3, .004, .1); vo = np.stack([vm, vm], 1) / 1.414
room = np.zeros_like(vo); dl = int(.023 * SR); room[dl:] = vo[:-dl] * .12; vo = vo + lp(room, 3000)
# Score: ducked under dialogue
mu, msr = sf.read(os.path.join(HERE, 'music/score.wav'))
if mu.ndim == 1: mu = np.stack([mu, mu], 1)
mu = mu[:N]; mu = np.pad(mu, ((0, max(0, N - len(mu))), (0, 0)))
duck = np.ones(N)
for id_, (t0, d) in VOICE.items():
    a, b = int((t0 - .25) * SR), int((t0 + d + .3) * SR); duck[a:b] = np.minimum(duck[a:b], .25 if id_ == 'L5' else .42)
duck = uniform_filter1d(duck, int(.25 * SR))
mu *= duck[:, None]; ab *= np.sqrt(duck)[:, None]
MIX = mu * 1.0 + vo * 1.25 + fx * 1.0 + ab * 1.0
# the ma (間, pause): hard silence, driven by the timeline's silence events
for a, b in SILENCES:
    i0, i1 = int(a * SR), int(b * SR); f = int(.06 * SR)
    MIX[i0:i0 + f] *= np.linspace(1, 0, f)[:, None]; MIX[i0 + f:i1] = 0; MIX[i1 - 1] = 0
# fade out at the very end
k = N - int(1.2 * SR); MIX[k:] *= np.linspace(1, 0, N - k)[:, None]
MIX = limit(MIX, .92)
sf.write(os.path.join(HERE, 'mix.wav'), MIX.astype(np.float32), SR)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
for name, (a, b) in {'printing': (0, 2.9), 'jo': (2.9, 9.5), 'gear': (9.5, 16.2), 'meal': (16.2, 23.2), 'climb': (23.2, 30.3), 'ma': (30.3, 32.0), 'turn': (32.0, 36.8), 'snow': (36.8, 44.0), 'ice': (44.8, 50.6), 'discovery': (51.4, 63.8), 'coda': (63.8, 66)}.items():
    s = slice(int(a * SR), int(b * SR)); print(f'{name:9s} mix {db(MIX[s]):6.1f}  vo {db(vo[s] * 1.25):6.1f}  mu {db(mu[s]):6.1f}  fx {db(fx[s]):6.1f}  amb {db(ab[s]):6.1f}')
print('peak', np.abs(MIX).max())
for id_, (t0, d) in VOICE.items():
    s = slice(int(t0 * SR), int((t0 + d) * SR)); print(id_, f'vo {db(vo[s] * 1.25):6.1f}  bed {db((mu + fx + ab)[s]):6.1f}')
