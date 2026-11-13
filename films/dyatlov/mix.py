"""Mix: material foley (paper / snow / canvas / fire / stream, all synthesised) + narration
+ original score (ducked under dialogue) + wind beds + hard silence where the score says so
→ mix.wav
Usage: .venv/bin/python films/dyatlov/mix.py   (run core/render/events.mjs, tts and music/score.py first)
"""
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '../../core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, norm, compress, limit, add
from scipy.signal import resample_poly
from scipy.ndimage import uniform_filter1d

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR)
rng = np.random.default_rng(59)
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

# ---- paper ----
def snip(v=1):
    d = .09; x = hp(nz(d), 3500) * env_exp(d, .012) * .9
    x += sines([2400, 3700], d, [.02, .012], [.4, .25]) * env_exp(d, .01)
    return norm(x) * v
def unfold(v=1):
    d = .5; tt = t_(d); e = np.sin(np.pi * np.minimum(tt / d, 1)) ** 1.1
    f = np.interp(tt, [0, d], [900, 2800]); x = np.zeros_like(tt); blk = 2048; src = nz(d)
    for i in range(0, len(tt), blk): x[i:i + blk] = bp(src[max(0, i - 4096):i + blk], f[i] * .7, f[i] * 1.7)[-len(x[i:i + blk]):]
    x += hp(nz(d), 4200) * (rng.random(len(tt)) > .997) * 2.4
    return norm(x * e) * v
def place(v=1):
    d = .16; tt = t_(d); x = bp(nz(d), 500, 3400) * np.sin(np.pi * tt / d) ** 2
    x[:int(.008 * SR)] += nz(.008) * .5
    return norm(lp(x, 3200)) * v * .9
def stamp(v=1):
    d = .22; x = sines([150, 320, 700], d, [.06, .03, .014], [1, .55, .28]); x[:int(.008 * SR)] += bp(nz(.008), 400, 2600) * .7
    y = np.zeros(int(.3 * SR)); y[:len(x)] += x
    return norm(lp(y, 2400)) * v
def pageturn(v=1):
    d = .55; tt = t_(d); e = np.sin(np.pi * np.minimum(tt / d, 1)) ** 1.3
    x = bp(nz(d), 800, 5200) * e + hp(nz(d), 4000) * (rng.random(len(tt)) > .996) * 2
    return norm(x) * v
def shutter(v=1):
    d = .1; x = sines([1900, 3100], d, [.012, .008], [1, .7]) * env_exp(d, .006); x[:int(.003 * SR)] += nz(.003)
    y = np.zeros(int(.16 * SR)); y[:len(x)] += x; k = int(.055 * SR); y[k:k + len(x)] += x * .8
    return norm(y) * v
def tear(v=1):
    d = .35; tt = t_(d); x = hp(nz(d), 2600) * (rng.random(len(tt)) > .55) * np.sin(np.pi * tt / d)
    x += bp(nz(d), 1200, 4000) * np.sin(np.pi * tt / d) * .7
    return norm(x) * v
def pop(v=1):
    d = .12; tt = t_(d); f = np.interp(tt, [0, d], [420, 190]); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-tt / .045); x[:int(.004 * SR)] += nz(.004) * .6
    return norm(x) * v
def tick(v=1):
    d = .12; x = sines([1050, 2300], d, [.03, .015], [1, .5]); x[:int(.004 * SR)] += nz(.004) * .5
    return norm(lp(x, 5000)) * v
# ---- snow / cold ----
def step(v=1):
    d = .17; tt = t_(d); return norm(bp(nz(d), 500, 3600) * np.exp(-tt / .05) * (1 + .4 * np.sin(2 * np.pi * 42 * tt))) * v * .85
def dig(v=1):
    y = np.zeros(int(.9 * SR))
    for k in range(4):
        s = step(1.0); i = int(k * .19 * SR); y[i:i + len(s)] += s * (1 - k * .18)
    return norm(y) * v
def crunch(v=1):
    d = .3; tt = t_(d); x = bp(nz(d), 700, 4200) * (rng.random(len(tt)) > .6) * np.sin(np.pi * tt / d)
    return norm(x) * v
def crack(v=1):
    d = .8; tt = t_(d)
    x = hp(nz(.06), 1800) * env_exp(.06, .012) * 1.2
    y = np.zeros(int(d * SR)); y[:len(x)] += x
    f = 70 + 50 * np.exp(-tt / .18); ph = 2 * np.pi * np.cumsum(f) / SR
    y += np.sin(ph) * np.exp(-tt / .3) * .9
    y += lp(brown(d), 300) * np.exp(-tt / .35) * .8
    for k in range(5):
        i = int((.1 + k * .13) * SR); s = hp(nz(.03), 1500) * env_exp(.03, .008) * (0.7 - k * .1)
        y[i:i + len(s)] += s
    return norm(lp(y, 3000)) * v
def rumble(d, v=1):
    tt = t_(d); e = np.sin(np.pi * np.minimum(tt / d, 1)) ** .8
    x = lp(brown(d), 110) * e + lp(brown(d), 260) * e * .4
    x += bp(nz(d), 60, 180) * slow(d, 1.7, .5, 7) * e * .5
    return norm(x) * v
def thud(v=1):
    d = .5; x = sines([64, 120, 200], d, [.18, .1, .05], [1, .6, .3])
    x[:int(.09 * SR)] += bp(nz(.09), 300, 1800) * env_exp(.09, .03) * .7
    return norm(lp(x, 1800)) * v
def branch(v=1):
    d = .28; x = hp(nz(.05), 2200) * env_exp(.05, .01) * 1.1
    y = np.zeros(int(d * SR)); y[:len(x)] += x
    for k in range(3):
        i = int((.06 + k * .05) * SR); s = bp(nz(.04), 900, 3600) * env_exp(.04, .008) * (.8 - k * .2)
        y[i:i + len(s)] += s
    return norm(y) * v
def knife(d, v=1):
    tt = t_(d); x = hp(nz(d), 2400) * (rng.random(len(tt)) > .78)
    x *= (0.4 + .6 * np.abs(np.sin(2 * np.pi * tt / 1.1)))
    x += bp(nz(d), 1000, 3000) * .25
    return norm(x) * v * .8
def fire(d, v=1):
    tt = t_(d); y = lp(brown(d), 900) * .35
    pops = (rng.random(len(tt)) > .9965)
    y += bp(nz(d), 1500, 6500) * uniform_filter1d(pops.astype(float), 90) * 12
    y *= .8 + .2 * np.sin(2 * np.pi * tt / 2.7)
    return norm(y) * v
def stream(d, v=1):
    tt = t_(d); x = bp(nz(d), 900, 4500) * slow(d, 2.4, .4, 13)
    x += bp(nz(d), 300, 1200) * slow(d, .8, .5, 14) * .5
    return norm(x) * v * .75
def whistle(v=1):
    d = .7; tt = t_(d); f = np.interp(tt, [0, d * .4, d], [2100, 2500, 2300]); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.sin(np.pi * np.minimum(tt / d, 1)) ** .8
    x += np.sin(ph * 2.02) * .15
    return norm(x) * v * .5
# ---- wind beds ----
def wind(d, v=1, lo=150, hi=900, seed=1):
    return norm(bp(brown(d) + nz(d) * .02, lo, hi) * slow(d, .6, .6, seed)) * v
def amb(w, d, gain=1):
    if w == 'wind':
        return norm(wind(d, .5, 120, 700, 3) + lp(brown(d), 260) * .35) * gain
    if w == 'katabatic':
        return norm(wind(d, .55, 200, 1100, 8) + wind(d, .35, 80, 300, 9) + lp(brown(d), 200) * .4) * gain
    if w == 'room':
        return norm(lp(brown(d), 180) * .5 + bp(nz(d), 300, 900) * slow(d, .35, .5, 5) * .18) * .5 * gain
    if w == 'coldday':
        return norm(wind(d, .3, 200, 900, 12) + lp(brown(d), 300) * .3) * .6 * gain
    return np.zeros(int(round(d * SR)))

fx, ab, vo = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
VOICE = {}
for e in E['ev']:
    t, ty, v = e['t'], e['type'], e.get('v', e.get('gain', 1))
    if ty == 'vo':
        y, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
        if y.ndim > 1: y = y.mean(1)
        y = resample_poly(y, SR, sr); VOICE[e['id']] = (t, len(y) / SR); add(vo, y, t, 1.0, 0)
    elif ty == 'snip': add(fx, snip(v), t, .34, .1)
    elif ty == 'unfold': add(fx, unfold(v), t, .5, 0)
    elif ty == 'place': add(fx, place(v), t, .3, 0)
    elif ty == 'stamp': add(fx, stamp(v), t, .5, 0)
    elif ty == 'pageturn': add(fx, pageturn(v), t, .35, -.1)
    elif ty == 'peel': add(fx, pageturn(v * 1.2), t, .4, .1)
    elif ty == 'shutter': add(fx, shutter(v), t, .4, 0)
    elif ty == 'tear': add(fx, tear(v), t, .45, 0)
    elif ty == 'pop': add(fx, pop(v), t, .3, 0)
    elif ty == 'tick': add(fx, tick(v), t, .4, 0)
    elif ty == 'step': add(fx, step(v), t, .16, .12)
    elif ty == 'dig': add(fx, dig(v), t, .3, 0)
    elif ty == 'crack': add(fx, crack(v), t, .6, 0)
    elif ty == 'rumble': add(fx, rumble(e.get('dur', 3), v), t, .5, 0)
    elif ty == 'thud': add(fx, thud(v), t, .6, 0)
    elif ty == 'branch': add(fx, branch(v), t, .35, .1)
    elif ty == 'knife': add(fx, knife(e.get('dur', 8), v), t, .3, 0)
    elif ty == 'fire': add(ab, fire(e.get('dur', 30), v), t, .3, -.15)
    elif ty == 'stream': add(ab, stream(e.get('dur', 20), v), t, .26, .1)
    elif ty == 'whistle': add(fx, whistle(v), t, .3, .2)
    elif ty == 'wind': add(ab, amb('katabatic', e.get('dur', 20), v), t, .3, 0)

# scene beds the event list does not carry: case-file room tone, cold day air at the coda/end
add(ab, fade(amb('room', 34)), 293.5, .14, 0)
add(ab, fade(amb('coldday', 43)), 361.5, .16, 0)

# Narration: light compression + a faint room sound
vm = compress(vo[:, 0] * 1.414, .2, 3, .004, .1); vo = np.stack([vm, vm], 1) / 1.414
room = np.zeros_like(vo); dl = int(.023 * SR); room[dl:] = vo[:-dl] * .12; vo = vo + lp(room, 3000)
# Score: ducked under dialogue
mu, msr = sf.read(os.path.join(HERE, 'music/score.wav'))
if mu.ndim == 1: mu = np.stack([mu, mu], 1)
mu = mu[:N]; mu = np.pad(mu, ((0, max(0, N - len(mu))), (0, 0)))
duck = np.ones(N)
for id_, (t0, d) in VOICE.items():
    a, b = int((t0 - .25) * SR), int((t0 + d + .3) * SR); duck[a:b] = .4
duck = uniform_filter1d(duck, int(.25 * SR))
mu *= duck[:, None]; ab *= np.sqrt(duck)[:, None]
MIX = mu * 1.0 + vo * 1.25 + fx * 1.0 + ab * 1.0
# fade out at the very end
k = N - int(1.2 * SR); MIX[k:] *= np.linspace(1, 0, N - k)[:, None]
MIX = limit(MIX, .92)
sf.write(os.path.join(HERE, 'mix.wav'), MIX.astype(np.float32), SR)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
for name, (a, b) in {'cut': (0, 13), 'title': (13, 22), 'nine': (22, 52), 'map': (52, 88), 'camp': (88, 120), 'slab': (120, 150), 'cutin': (150, 172), 'descent': (172, 198), 'cedar': (198, 236), 'ravine': (236, 262), 'search': (262, 294), 'file': (294, 326), 'answer': (326, 362), 'coda': (362, 392), 'end': (392, 404)}.items():
    s = slice(int(a * SR), int(b * SR)); print(f'{name:9s} mix {db(MIX[s]):6.1f}  vo {db(vo[s] * 1.25):6.1f}  mu {db(mu[s]):6.1f}  fx {db(fx[s]):6.1f}  amb {db(ab[s]):6.1f}')
print('peak', np.abs(MIX).max())
