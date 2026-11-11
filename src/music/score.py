"""The Man the Glacier Kept — original score (miyako-bushi scale on D: D Eb G A Bb)
shamisen (physical model, sawari buzz) + shakuhachi (recorder/flute samples: vibrato removed, slides, meri/kari)
+ taiko (synthesised head + gran_cassa/toms/frame_drum layers) + hyoshigi (clappers) + koto glissando (glacier)
Sections follow films/otzi/story.js: printing 0-2.9 / jo 2.9-9.5 / gear 9.5-16.2 / meal 16.2-23.2 /
climb 23.2-30.3 (accelerating heartbeat) / ma 30.3-32.0 (hard silence) / turn 32.0-36.8 /
snow 36.8-44.0 (near-silence) / ice 44.8-50.6 (koto) / discovery 51.4-63.8 / coda 63.8-66.0.
Run: .venv/bin/python films/otzi/music/score.py  → films/otzi/music/score.wav (+ stems/, score.json)
"""
import sys, os, json
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
sys.path.insert(0, ROOT)
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 66.0
N = int(DUR * SR)
rng = np.random.default_rng(1991)
S.seed(17)
def bpf(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def lpf(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hpf(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def st(): return np.zeros((N, 2), np.float32)
stems = {k: st() for k in ['shamisen', 'shakuhachi', 'taiko', 'hyoshigi', 'koto', 'other']}
EVENTS = []
def mark(t, k, d): EVENTS.append((round(t, 3), k, d))

# ————— hyoshigi (two hardwood sticks struck together) —————
def hyoshigi(v=1.0):
    L = int(.5 * SR); t = np.arange(L) / SR
    y = np.zeros(L)
    for f, a, tau in [(1180, 1., .05), (2460, .7, .035), (3870, .45, .022), (5300, .25, .012), (760, .35, .07)]:
        y += a * np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t / tau)
    cl = rng.standard_normal(L) * np.exp(-t / .0018); y += 1.6 * bpf(cl, 1500, 9000)
    y /= np.abs(y).max()
    s1 = S.hit('world_perc', 'claves', .9); s2 = S.hit('woodblock', 'a', .9)
    out = np.zeros(L); out[:min(L, len(s1))] += s1[:L] / (np.abs(s1).max() + 1e-9) * .8; out[:min(L, len(s2))] += s2[:L] / (np.abs(s2).max() + 1e-9) * .45
    out += y * .9
    d = int(.003 * SR); out[d:] += .35 * out[:-d]
    return (out / np.abs(out).max() * .85 * v).astype(np.float32)

# ————— taiko —————
def odaiko(v=1.0, big=False):
    L = int(2.4 * SR); t = np.arange(L) / SR
    f = 58 + 62 * np.exp(-t / .045)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / (.55 if big else .42)) + .35 * np.sin(1.59 * ph + 1) * np.exp(-t / .22) + .18 * np.sin(2.14 * ph) * np.exp(-t / .12)
    don = bpf(rng.standard_normal(L), 90, 900) * np.exp(-t / .02) * .8
    stick = bpf(rng.standard_normal(L), 1200, 5000) * np.exp(-t / .004) * .25
    syn = body + don + stick
    syn /= np.abs(syn).max()
    out = syn * .85
    for inst, var, g in [('gran_cassa', 'hit', .55), ('toms', 'low_mallet', .35), ('frame_drum', 'large', .3)]:
        s = S.hit(inst, var, min(1, .55 + .45 * v)); s = s[:L] / (np.abs(s).max() + 1e-9)
        out[:len(s)] += s * g
    out = lpf(out, 3500)
    return (out / np.abs(out).max() * v).astype(np.float32)
def cut(x, d):
    n = int(d * SR)
    if n >= len(x): return x
    x = x[:n].copy(); k = min(n, int(.08 * SR)); x[-k:] *= np.linspace(1, 0, k); return x
def shime(v=.6):
    L = int(.6 * SR); t = np.arange(L) / SR
    f = 390 + 140 * np.exp(-t / .01); ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / .07) + .5 * bpf(rng.standard_normal(L), 800, 4000) * np.exp(-t / .006)
    s = S.hit('frame_drum', 'small_muted', .7); s = s[:L] / (np.abs(s).max() + 1e-9)
    y = y / np.abs(y).max() * .7; y[:len(s)] += s * .5
    return (y / np.abs(y).max() * v).astype(np.float32)

# ————— shamisen —————
def sam(p, v=.7, dur=None, **kw):
    kw.setdefault('buzz', .7)
    return P.pluck('shamisen', p, dur, v, **kw)

# ————— shakuhachi —————
def _f0track(y, f):
    hop, Nw = 480, 2048; out = []
    for s in range(0, max(1, len(y) - Nw), hop):
        fr = y[s:s + Nw] * np.hanning(Nw); sp = np.abs(np.fft.rfft(fr, 8 * Nw)); fq = np.fft.rfftfreq(8 * Nw, 1 / SR)
        m = (fq > f * .85) & (fq < f * 1.18); out.append(fq[m][np.argmax(sp[m])] if sp[m].max() > 1e-6 else f)
    return np.array(out), hop
def shaku(p, dur, v=.7, slide=-1.5, fall=0.0, kari=0.0, swell=.5, breath=1.0, rel=.35):
    m = S.midi(p); f = 440 * 2 ** ((m - 69) / 12)
    ext = dur + rel + .8
    a = S.note('recorder', max(m, S.midi('F4') - 3), ext, .7, release=.2)
    b = S.note('flute', max(m, S.midi('C4')), ext, .6, release=.2)
    n = min(len(a), len(b)); y = .62 * a[:n] / (np.abs(a).max() + 1e-9) + .38 * b[:n] / (np.abs(b).max() + 1e-9)
    y = y.astype(np.float64)
    w = int(.06 * SR); e = np.sqrt(np.convolve(y ** 2, np.ones(w) / w, 'same')) + 1e-4
    e = np.convolve(e, np.ones(w) / w, 'same'); y = y / e
    y[:int(.03 * SR)] *= np.linspace(0, 1, int(.03 * SR))
    tr, hop = _f0track(y, f); dev = 12 * np.log2(tr / np.median(tr[3:]))
    dev = np.clip(dev, -.6, .6)
    tt = np.arange(n) / SR; devs = np.interp(tt, np.arange(len(dev)) * hop / SR + 1024 / SR, dev)
    L = int((dur + rel) * SR); to = np.arange(L) / SR
    bend = np.zeros(L)
    if slide: sl = .16; bend += np.where(to < sl, slide * (1 - np.sin(np.clip(to / sl, 0, 1) * np.pi / 2)), 0)
    if fall: k = np.clip((to - (dur - .45)) / .5, 0, 1); bend += fall * k * k
    if kari: k = np.clip((to - (dur - .3)) / .3, 0, 1); bend += kari * np.sin(k * np.pi / 2)
    dv = np.interp(to + .05, tt, devs)
    phase = .05 * SR + np.concatenate([[0], np.cumsum(2 ** ((bend[:-1] - dv[:-1]) / 12))])
    phase = np.minimum(phase, n - 2)
    z = np.interp(phase, np.arange(n), y)
    at = .12; envl = np.clip(to / at, 0, 1) ** 1.6
    mid = 1 + swell * np.sin(np.clip(to / max(dur, .1), 0, 1) * np.pi) ** 1.5 * .8
    relk = np.clip((to - dur) / rel, 0, 1); envl = envl * mid * (1 - relk) ** 2
    z = z * envl
    z = lpf(z, 3200) * .8 + bpf(z, 900, 1600) * .5
    nz = bpf(rng.standard_normal(L), 1000, 4000, 3)
    be = .22 * envl + .9 * np.exp(-np.clip(to, 0, None) / .07) * np.clip(to / .012, 0, 1)
    z = z / (np.abs(z).max() + 1e-9) + breath * .5 * nz / (np.abs(nz).max() + 1e-9) * be
    z[-min(len(z), 480):] *= np.linspace(1, 0, min(len(z), 480))
    return (z / (np.abs(z).max() + 1e-9) * v).astype(np.float32)

def put(k, x, t, g=1.0, pan=0.0, note=None):
    add(stems[k], x, t, g, pan)
    if note: mark(t, k, note)

# ================= C1 printing 0-2.9: hyoshigi on each block =================
for i, t in enumerate([.35, 1.05, 1.70, 2.30]):
    put('hyoshigi', hyoshigi(.7 + .08 * i), t, 1.0, (-.25, .2, -.1, .15)[i], f'hyoshigi (block {i+1})' if i == 0 else None)

# ================= C2 jo 2.9-9.5: title + opening motif under L1 =================
put('shamisen', P.strum('shamisen', ['D3', 'A3', 'D4'], None, .8, spread=.018, buzz=.8, t60=2.2), 2.9, 1.05, -.15, 'title: shamisen chord')
put('shakuhachi', shaku('A4', 1.55, .72, slide=-2, swell=.6), 3.05, 1, .1, 'motif: A4 slid in')
put('shakuhachi', shaku('Bb4', .42, .58, slide=0, swell=.1, breath=.7), 4.72, 1, .1)
put('shakuhachi', shaku('A4', .95, .64, slide=0, fall=-1.2, swell=.3), 5.12, 1, .1)
put('shamisen', sam('D5', .7, t60=.8, buzz=.5), 3.4, .85, .15, 'title seal: shamisen chin')
put('shakuhachi', shaku('D4', 2.9, .4, slide=-1, swell=.8, breath=.8, rel=.6), 6.35, 1, .1, 'low ro under L1')
put('shamisen', sam('D3', .38), 7.7, .6, -.2)

# ================= C3 gear 9.5-16.2: 72 BPM pulse, quiet under the setdowns =================
bt = 60 / 72
for i in range(14):
    b = 10.0 + i * bt
    if b > 16.0: break
    quiet = 10.0 < b < 14.0
    put('shamisen', sam('D3' if i % 2 == 0 else 'A2', .42 if quiet else .6), b, .75, -.15, 'shamisen pulse 72 BPM' if i == 0 else None)
    if i % 4 == 2: put('taiko', shime(.3 if quiet else .42), b, .8, .3, 'kotsuzumi-soft shime' if i == 2 else None)
put('shakuhachi', shaku('G4', .7, .5, slide=-1.5, swell=.3), 14.5, 1, .05, 'shakuhachi answer')
put('shakuhachi', shaku('A4', .9, .52, slide=0, kari=.8, swell=.4), 15.2, 1, .05)
put('shamisen', sam('D5', .65, t60=.8, buzz=.5), 15.2, .8, .15, 'cartouche seal: chin')

# ================= C4 meal 16.2-23.2: softer, ends rising into the climb =================
for i in range(15):
    b = 16.4 + i * bt
    if b > 22.6: break
    quiet = 17.4 < b < 23.2
    put('shamisen', sam('A2' if i % 2 == 0 else 'D3', .34 if quiet else .5, buzz=.5), b, .7, .1 * (i % 2))
    if i % 4 == 0: put('taiko', shime(.26), b, .7, .3)
for k, p in enumerate(['D3', 'G3', 'A3', 'Bb3', 'D4', 'G4']):
    put('shamisen', sam(p, .42 + k * .03, buzz=.6), 22.45 + k * .07, .7, -.2 + k * .08, 'rising figure into the climb' if k == 0 else None)

# ================= C5 climb 23.2-30.3: accelerating taiko heartbeat, cut at the ma =================
ts = []; t = 24.6; gap = .95
while t < 30.15:
    ts.append(t); gap = max(.32, gap * .87); t += gap
for j, t in enumerate(ts):
    prog = (t - 24.6) / 5.5
    v = .5 + .3 * prog
    put('taiko', cut(odaiko(min(1, v)), max(.45, 3 * (ts[j + 1] - t)) if j + 1 < len(ts) else .45), t, .8, (rng.random() - .5) * .3, 'heartbeat starts, accelerating' if j == 0 else None)
def swell(d, f0, f1, g0=.05, g1=1.0):
    n = int(d * SR); tt = np.arange(n) / SR
    br = lpf(np.cumsum(rng.standard_normal(n)), 120, 3); br = hpf(br, 28, 2); br /= np.abs(br).max()
    f = f0 + (f1 - f0) * tt / d; sn = np.sin(2 * np.pi * np.cumsum(f) / SR)
    env = (g0 + (g1 - g0) * (tt / d) ** 1.8); y = (.7 * br + .45 * sn) * env
    y[:int(.2 * SR)] *= np.linspace(0, 1, int(.2 * SR))
    return (y / np.abs(y).max()).astype(np.float32)
put('other', swell(2.9, 40, 52), 27.4, .5, 0, 'low swell into the pass')
put('shamisen', sam('Bb4', .5, t60=1.2, buzz=.6), 26.5, .6, .2, 'wind gust: high Bb')

# ================= C7 turn 32.0-36.8: arrow, fall, meri drop to the tonic =================
put('taiko', odaiko(.9, big=True), 32.0, .9, 0, 'arrow: single deep hit')
put('taiko', odaiko(1.0, big=True), 32.9, 1.1, 0, 'fall: heavy hit')
put('shamisen', P.strum('shamisen', ['D3', 'A3', 'D4', 'A4'], .3, .85, spread=.008, buzz=1.0), 32.9, .7, 0)
put('hyoshigi', hyoshigi(.8), 32.9, .6, .2)
put('shakuhachi', shaku('A4', 1.6, .55, slide=-2, fall=-1.5, swell=.5, breath=1.2), 33.4, .8, .1, 'meri drop: the turn')
put('other', swell(2.6, 46, 37, .3, .8), 33.2, .5, 0, 'cold settles: falling drone')
put('shakuhachi', shaku('D4', 1.6, .5, slide=-1, swell=.6, rel=.5), 35.2, 1, .1, 'lands on the tonic D')
put('shamisen', sam('A4', .34, harmonic=True), 35.05, .6, .3, 'cartouche: shamisen harmonic')
put('shamisen', P.strum('shamisen', ['D3', 'A3', 'D4'], None, .55, spread=.1, buzz=.6, t60=1.6), 36.2, .7, -.2, 'soft chord into the snow')

# ================= C8 snow 36.8-44.0: near-silence, one harmonic, the erase =================
put('shamisen', sam('D4', .3, t60=2.6, buzz=.3, harmonic=True), 37.2, .6, .1, 'snow begins: faint harmonic')
put('shamisen', sam('A3', .32, t60=2.2, buzz=.3, harmonic=True), 40.2, .55, -.1, 'the erase starts')
put('shakuhachi', shaku('G4', 2.2, .3, slide=-1, swell=.4, breath=1.3, rel=.8), 41.6, .8, .05, 'breath-only phrase under the last snow')

# ================= C9 ice 44.8-50.6: koto glissando + low taiko pulse =================
for k, p in enumerate(['D3', 'G3', 'A3', 'Bb3', 'D4', 'G4', 'A4', 'D5']):
    put('koto', P.pluck('koto', p, None, .4 + k * .02, buzz=.2), 45.0 + k * .62, .8, -.35 + k * .1, 'glacier: koto slow ascent' if k == 0 else None)
for t in [45.0, 47.0, 49.0]:
    put('taiko', odaiko(.42, big=True), t, .55, 0, 'low taiko pulse')
put('shamisen', sam('D5', .6, t60=.9, buzz=.5), 49.6, .75, .15, 'cartouche seal: chin')

# ================= C10 discovery 51.4-63.8: the motif restated, warm =================
put('shamisen', P.strum('shamisen', ['D3', 'A3', 'D4'], None, .6, spread=.018, buzz=.7, t60=2.0), 51.6, .9, -.15, 'discovery: restatement')
put('shakuhachi', shaku('A4', 1.4, .6, slide=-2, swell=.6), 52.0, 1, .1, 'motif returns: A4')
put('shakuhachi', shaku('Bb4', .4, .5, slide=0, swell=.1, breath=.8), 53.5, 1, .1)
put('shakuhachi', shaku('A4', .9, .55, slide=0, fall=-1.0, swell=.3), 53.9, 1, .1)
put('shamisen', sam('D5', .65, t60=.8, buzz=.5), 55.0, .8, .15, 'cartouche seal: chin')
bt2 = 60 / 60
for i in range(8):
    b = 56.0 + i * bt2
    if b > 63.0: break
    put('shamisen', sam('D3' if i % 2 == 0 else 'A2', .4), b, .7, -.15, 'slow pulse 60 BPM' if i == 0 else None)
put('shakuhachi', shaku('G4', 1.2, .5, slide=-1.5, swell=.5), 58.0, .9, .05, 'under L9: G4')
put('shamisen', P.strum('shamisen', ['D3', 'A3', 'D4', 'A4'], None, .7, spread=.02, buzz=.8, t60=2.4), 60.0, .95, 0, 'L9: wide chord')

# ================= C11 coda 63.8-66.0: seal alone =================
put('shakuhachi', shaku('D5', 1.9, .55, slide=-2, fall=-1.2, swell=.7, breath=1.1, rel=.9), 63.9, 1, .1, 'final long note')
put('shamisen', sam('D3', .75, t60=4.2, buzz=.9), 64.0, 1.0, -.1, 'last note, long sawari ring')
put('hyoshigi', hyoshigi(.75), 64.2, .8, .2, 'closing clappers with the seal')

# ================= reverb, ma silence, sum =================
wet = {'shamisen': (.45, .2), 'shakuhachi': (.6, .3), 'taiko': (.65, .22), 'hyoshigi': (.35, .12), 'koto': (.6, .28), 'other': (.5, .2)}
for k, (sz, mx) in wet.items():
    if np.abs(stems[k]).max() > 0: stems[k] = S.room(stems[k], size=sz, mix=mx).astype(np.float32)
GAIN = {'shamisen': 1.0, 'shakuhachi': .8, 'taiko': .95, 'hyoshigi': .85, 'koto': .9, 'other': 1.0}
MA0, MA1 = 30.3, 32.0
fade = int(.06 * SR); a0 = int(MA0 * SR); a1 = int(MA1 * SR)
tail = N - int(.3 * SR)
for k in stems:
    x = stems[k] * GAIN[k]
    x[a0:a0 + fade] *= np.linspace(1, 0, fade)[:, None]
    x[a0 + fade:a1] = 0
    x[a1 - 1] = 0
    x[tail:] *= np.linspace(1, 0, N - tail)[:, None]
    stems[k] = x.astype(np.float32)
mix = sum(stems.values())
pk = np.abs(mix).max(); sc = .89 / pk
mix *= sc
for k in stems: stems[k] *= sc
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
for k, x in stems.items(): sf.write(os.path.join(HERE, 'stems', k + '.wav'), x, SR, subtype='FLOAT')

# ================= self-check =================
mono = mix.mean(1)
def rms_db(a, b):
    s = mono[int(a * SR):int(b * SR)]; r = np.sqrt(np.mean(s ** 2)) + 1e-12; return round(20 * np.log10(r), 1)
CUES = [('C1 printing', 0, 2.9), ('C2 jo', 2.9, 9.5), ('C3 gear', 9.5, 16.2), ('C4 meal', 16.2, 23.2),
        ('C5 climb', 23.2, 30.3), ('C6 ma', 30.3, 32.0), ('C7 turn', 32.0, 36.8), ('C8 snow', 36.8, 44.0),
        ('C9 ice', 44.8, 50.6), ('C10 discovery', 51.4, 63.8), ('C11 coda', 63.8, 66.0)]
table = [dict(cue=n, t0=a, t1=b, rms_db=rms_db(a, b), peak=round(float(np.abs(mix[int(a * SR):int(b * SR)]).max()), 3)) for n, a, b in CUES]
VO = [('L1', 3.4, 9.7), ('L2', 10.0, 15.8), ('L3', 17.4, 24.0), ('L4', 24.6, 28.4), ('L5', 32.6, 35.8), ('L6', 36.2, 38.4), ('L7', 38.6, 46.3), ('L8', 51.8, 59.4), ('L9', 59.9, 65.1)]
vo = [dict(line=n, rms_db=rms_db(a, b)) for n, a, b in VO]
silent = bool(np.all(mix[int((MA0 + .061) * SR):int(MA1 * SR)] == 0))
report = dict(dur=len(mix) / SR, sr=SR, peak=round(float(np.abs(mix).max()), 3), ma_silent_30_36_to_32_0=silent,
              cues=table, voice_windows=vo, events=EVENTS,
              notes='miyako-bushi scale D Eb G A Bb; motif A4-Bb4-A4 (meri) stated at the title, restated at the discovery; ma 30.3-32.0 hard silence; koto glissando under the glacier; coda ends on D with hyoshigi at the seal.')
json.dump(report, open(os.path.join(HERE, 'score.json'), 'w'), ensure_ascii=False, indent=1, default=float)
print(json.dumps({k: report[k] for k in ['dur', 'peak', 'ma_silent_30_36_to_32_0']}, ensure_ascii=False))
for r in table: print(r)
