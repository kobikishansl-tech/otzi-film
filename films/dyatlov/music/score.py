"""DYATLOV PASS — original score (D minor pentatonic: D F G A C)
pipa (physical model) + zheng (dan_tranh samples) + erhu + dizi (flute samples) + woodblock + gong2 + frame drum.
84 BPM for the march sections (beat = 0.714 s), 60 BPM for the night (beat = 1 s).
Cues follow films/dyatlov/story.js: C0 cut 0-13 / C1 title 13-22 / C2 the nine 22-52 / C3 map 52-88 /
C4 camp 88-120 / C5 slab 120-150 (big gong 134, the only one) / C6 the cut 150-172 (near silence) /
C7 descent 172-198 / C8 cedar 198-236 / C9 ravine 236-262 / C10 search 262-294 / C11 questions 294-326 /
C12 answer 326-362 / C13 coda 362-392 / C14 end 392-404.
Run: .venv/bin/python films/dyatlov/music/score.py  →  films/dyatlov/music/score.wav (+ stems/, score.json)
"""
import sys, os, json
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
sys.path.insert(0, ROOT)
import numpy as np, soundfile as sf
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add

HERE = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
DUR = 404.0
N = int(DUR * SR)
S.seed(11)
rng = np.random.default_rng(1959)
B = 60 / 84          # march beat
BN = 1.0             # night beat

def hum(t, amt=.008):
    return t + float(rng.uniform(-amt, amt))

def vv(v, amt=.06):
    return float(np.clip(v + rng.uniform(-amt, amt), .05, 1))

STEMS = {k: np.zeros((N, 2), np.float32) for k in ['pipa', 'zheng', 'winds', 'perc']}
KEY = {}

# ---------- glide (erhu) ----------
def glide(x, curve, dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    ks, vs = zip(*curve)
    semi = np.interp(tt, ks, vs)
    ratio = 2 ** (semi / 12)
    pos = np.cumsum(ratio)
    pos = pos[pos < len(x) - 2]
    i = pos.astype(int); f = pos - i
    y = x[i] * (1 - f) + x[i + 1] * f
    fade = min(len(y), int(.08 * SR))
    y[-fade:] *= np.linspace(1, 0, fade)
    return y.astype(np.float32)

def erhu_glide(t, pitch, curve, dur, vel=.55, gain=1.0, pan=.15):
    x = S.note('erhu', pitch, dur * 1.8 + .5, vel=vel, attack=.08)
    add(STEMS['winds'], glide(x, curve, dur), t, gain, pan)

# ---------- instruments ----------
def pipa(t, p, d, v=.7, g=1.0, pan=-.15, trem=None, **kw):
    if trem: kw['trem'] = trem
    add(STEMS['pipa'], P.pluck('pipa', p, d, vel=vv(v), **kw), hum(t), g, pan)

def zheng(t, p, d=1.2, v=.55, g=1.0, pan=.25):
    add(STEMS['zheng'], S.note('dan_tranh', p, d, vel=vv(v)), hum(t), g, pan)

def zheng_trem(t, p, d, v=.35, g=1.0, pan=.2):
    add(STEMS['zheng'], S.note('dan_tranh_trem', p, d, vel=v, attack=.25), t, g, pan)

def flute(t, p, d, v=.55, g=1.0, pan=-.3, grace=None):
    if grace:
        add(STEMS['winds'], S.note('flute', grace, .07, vel=vv(v * .8)), hum(t) - .06, g * .7, pan)
    add(STEMS['winds'], S.note('flute', p, d, vel=vv(v), attack=.02), hum(t), g, pan)

def erhu(t, p, d, v=.5, g=1.0, pan=.15):
    add(STEMS['winds'], S.note('erhu', p, d, vel=vv(v), attack=.06), hum(t), g, pan)

def wb(t, v=.6, var='a', g=1.0, pan=.35):
    add(STEMS['perc'], S.hit('woodblock', var, vel=vv(v, .04)), hum(t, .004), g, pan)

def gong(t, kind='small', v=.6, g=1.0, pan=0):
    add(STEMS['perc'], S.hit('gong2', kind, vel=v), t, g, pan)

def drum(t, kind='large', v=.7, g=1.0, pan=0):
    add(STEMS['perc'], S.hit('frame_drum', kind, vel=vv(v, .04)), hum(t, .005), g, pan)

def gliss(t, notes, step=.028, v=.5, g=.8, pan=.25):
    for i, p in enumerate(notes):
        zheng(t + i * step, p, .9, v * (.8 + .4 * i / max(1, len(notes) - 1)), g, pan)

# ---------- theme A (D minor pentatonic, 12 march beats = 8.57 s) ----------
P1 = [('D4', 1), ('F4', 1), ('G4', 1), ('A4', 2), ('C5', 1), ('A4', 1), ('G4', 1), ('F4', 1), ('G4', 1), ('D4', 2)]
P2 = [('A4', 1), ('G4', 1), ('F4', 1), ('G4', 1), ('D5', 2), ('C5', 1), ('A4', 1), ('G4', 1), ('F4', 1), ('D4', 2)]
HARM1 = ['Dm', 'Dm', 'Gm', 'Am']
HARM2 = ['Dm', 'C', 'Gm', 'Dm']
CH = {'Dm': ['D3', 'A3', 'D4', 'F4'], 'C': ['C3', 'G3', 'C4', 'G4'], 'Gm': ['G3', 'D4', 'G4', 'Bb4'], 'Am': ['A2', 'E3', 'A3', 'E4'], 'Bb': ['Bb2', 'F3', 'Bb3', 'D4'], 'F': ['F3', 'C4', 'F4', 'A4']}

def melody(t0, phrase, inst='pipa', unit=B, v=.7, octave=0, g=1.0, trem_min=2, pan=None):
    t = t0
    for p, n in phrase:
        d = n * unit
        pp = S.midi(p) + 12 * octave
        if inst == 'pipa':
            pipa(t, pp, d + .15, v, g, pan if pan is not None else -.15, trem=14 if n >= trem_min else None)
        elif inst == 'flute':
            flute(t, pp, d * .95, v, g, pan if pan is not None else -.3, grace=(pp + 2 if n >= 2 else None))
        elif inst == 'erhu':
            erhu(t, pp, d * .98, v, g, pan if pan is not None else .15)
        t += d

def zheng_bars(t0, harm, beat=B, v=.45, g=1.0, dens=4):
    for b, h in enumerate(harm):
        notes = CH[h]
        for k in range(dens):
            zheng(t0 + b * beat + k * (beat / dens), notes[k % len(notes)], .8, v * (1.1 if k == 0 else .9), g)

def heartbeat(t0, n, beat=BN, v=.5, g=.9):
    for k in range(n):
        drum(t0 + k * beat, 'large', v, g * .8)
        drum(t0 + k * beat + .22, 'large_muted', v * .6, g * .7)

# ================= C0 cut 0–13 =================
erhu(8.0, 'D3', 4.5, .4, .8, 0)
erhu(8.0, 'D4', 4.5, .25, .5, .2)
gliss(9.5, ['D3', 'G3', 'C4', 'F4', 'A4', 'C5', 'D5', 'F5', 'A5', 'D6'], .04, .55, .9)
KEY['unfold'] = 9.5

# ================= C1 title 13–22 =================
gong(13.0, 'small', .55, .8)
melody(13.2, P1, 'pipa', v=.7)
melody(13.2, P1, 'flute', v=.42, octave=1, g=.5)
zheng_bars(13.2, HARM1, v=.4)
for k in range(12): wb(13.2 + k * B, .5 if k % 2 == 0 else .35)
drum(13.2, 'large', .5, .7)

# ================= C2 the nine 22–52 =================
melody(22.3, P2, 'pipa', v=.6, g=.9)
zheng_bars(22.3, HARM2, v=.32, g=.85, dens=2)
erhu(26.0, 'D5', 2.2, .38, .6)
erhu(29.0, 'C5', 2.2, .35, .6)
for k in range(10): wb(22.3 + k * B * 2, .3, 'b', .7)
melody(31.0, P1, 'flute', v=.36, g=.7)
zheng_bars(31.0, HARM1, v=.28, g=.7, dens=2)
# Yudin leaves: descending glide
erhu_glide(44.0, 'A4', [(0, 0), (2.0, -2), (4.5, -5), (7.0, -12)], 7.5, .5, .9)
zheng(44.0, 'D3', 2.5, .4, .8, 0)
zheng(47.0, 'Bb2', 2.5, .38, .8, -.1)
KEY['yudin'] = 44.0

# ================= C3 map 52–88 (light march) =================
for k in range(40):
    t = 52.5 + k * B
    if t > 74: break
    wb(t, .42 if k % 2 == 0 else .3, 'a' if k % 2 == 0 else 'b', .8)
    if k % 4 == 0: pipa(t, S.midi(['D3', 'D4', 'F4', 'G4', 'A4'][ (k // 2) % 5 ]), .5, .5, .8)
zheng_bars(52.5, ['Dm', 'F', 'C', 'Dm'] * 3, v=.3, g=.75, dens=2)
wb(60.0, .7, 'a', 1.1, 0)    # stamp tick
wb(70.0, .7, 'a', 1.1, 0)
# thin out for the peel; last photo dusk
erhu(76.0, 'D4', 3.5, .4, .7)
zheng(76.0, 'D3', 2.0, .35, .7)
erhu(82.0, 'F4', 2.0, .38, .6)

# ================= C4 camp 88–120 (60 BPM night) =================
heartbeat(88.5, 31, BN, .42, .8)
erhu(90.0, 'D4', 5.5, .42, .7)
erhu(96.0, 'F4', 5.5, .4, .7)
erhu(102.0, 'G4', 5.0, .42, .72)
erhu(108.0, 'A4', 5.5, .45, .75)
zheng(93.0, 'D3', 2.5, .3, .6, 0)
zheng(105.0, 'G2', 2.5, .3, .6, 0)
KEY['camp'] = 88.0

# ================= C5 slab 120–150 =================
for k in range(24):   # zheng tremolo crescendo 120→132
    t = 120.0 + k * .5
    v = .18 + .3 * (k / 23)
    zheng_trem(t, 'D4' if k % 2 == 0 else 'A4', .55, v, .8 + .5 * (k / 23), -.15 if k % 2 else .2)
drum(126.0, 'large', .5, .9); drum(129.0, 'large', .6, 1.0)
# 132 crack is foley; 134 the big gong — the only one in the film
gong(134.0, 'big', .95, 1.25)
drum(134.0, 'large', 1.0, 1.3)
erhu(136.0, 'D3', 6.0, .45, .7, 0)   # low aftermath drone
KEY['slide'] = 134.0

# ================= C6 the cut 150–172 (near silence) =================
heartbeat(150.5, 21, 1.0, .34, .7)
erhu(158.5, 'D6', 3.0, .3, .55, .1)   # one high note as the tear opens
KEY['cutOpen'] = 158.5

# ================= C7 descent 172–198 (funeral pulse) =================
for k in range(13):
    drum(172.5 + k * 2.0, 'large', .55, .9)
    wb(173.5 + k * 2.0, .3, 'b', .6)
pipa(172.5, 'D3', 3.5, .55, .9, 0, trem=11)
pipa(186.5, 'D3', 3.5, .55, .9, 0, trem=11)
erhu(178.0, 'F4', 4.0, .35, .6)
erhu(190.0, 'E4', 4.0, .32, .55)   # E leaning out of the pentatonic: grief

# ================= C8 cedar 198–236 (erhu lament D–C–D) =================
erhu(199.0, 'D4', 4.5, .45, .75)
erhu(204.0, 'C4', 4.5, .45, .75)
erhu(209.0, 'D4', 5.0, .48, .8)
heartbeat(199.0, 18, 2.0, .3, .6)
flute(214.0, 'A4', 2.5, .35, .55)
erhu_glide(218.0, 'D5', [(0, 0), (1.5, 3), (3.0, 1), (5.0, -7)], 5.5, .42, .8)   # rises, then fades
zheng(220.5, 'D3', 2.5, .32, .6, 0)
zheng(226.0, 'A2', 2.5, .3, .6, -.1)

# ================= C9 ravine 236–262 (near silence) =================
erhu(236.5, 'D2', 12.0, .4, .8, 0)
erhu(238.0, 'D3', 10.0, .25, .5, .1)
gong(248.0, 'small', .35, .7)

# ================= C10 search 262–294 (muted march) =================
for k in range(22):
    t = 262.5 + k * B
    if t > 292: break
    wb(t, .32 if k % 2 else .42, 'b', .75)
zheng_bars(262.5, ['Dm', 'Am', 'F', 'Dm'] * 2, v=.26, g=.7, dens=2)
pipa(270.0, 'D4', .8, .5, .7); pipa(272.4, 'F4', .8, .5, .7)
erhu(284.0, 'A4', 3.0, .4, .65)
wb(284.0, .6, 'a', 1.0, 0)

# ================= C11 questions 294–326 =================
for i, t in enumerate([304.5, 308.5, 312.5, 316.5]):
    pipa(t, S.midi(['D4', 'F4', 'G4', 'A4'][i]), 1.1, .6, .85, -.1 * (i % 2))
    wb(t, .5, 'a', .9, 0)
zheng_trem(320.0, 'D4', 4.5, .3, .9, -.15)   # tension build to 324
zheng_trem(320.5, 'A4', 4.0, .26, .8, .2)
drum(322.0, 'large', .5, .8); drum(323.0, 'large', .6, .9); drum(324.0, 'large', .7, 1.0)

# ================= C12 answer 326–362 =================
gong(326.0, 'small', .5, .8)
melody(326.2, P1, 'pipa', v=.68)
melody(326.2, P1, 'flute', v=.4, octave=1, g=.5)
zheng_bars(326.2, HARM1, v=.38)
for k in range(12): wb(326.2 + k * B, .45 if k % 2 == 0 else .3)
wb(328.0, .7, 'a', 1.1, 0)   # stamps
wb(334.0, .7, 'a', 1.1, 0)
# slow-mo slab: soft low gong + long erhu
gong(340.0, 'small', .45, .7)
erhu(339.0, 'D4', 6.0, .42, .7)
zheng(346.0, 'D3', 3.0, .35, .7)
melody(350.0, P2[:6], 'pipa', v=.55, g=.85)
KEY['slowmo'] = 339.0

# ================= C13 coda 362–392 (dizi solo, warm) =================
melody(363.0, P1, 'flute', unit=BN * 1.2, v=.45, g=.85)
erhu(363.0, 'D4', 5.0, .32, .55)
erhu(369.0, 'A4', 5.0, .35, .6)   # under the gold sun
zheng_bars(363.0, ['Dm', 'Bb', 'F', 'Dm'], beat=BN * 1.2, v=.3, g=.7, dens=2)
melody(377.5, P2, 'flute', unit=BN * 1.2, v=.42, g=.8)
erhu(377.5, 'F4', 6.0, .32, .55)
gong(388.0, 'small', .5, .75)

# ================= C14 end 392–404 =================
pipa(392.2, 'D4', 2.5, .68, .95, trem=12)
for i, p in enumerate(['D3', 'A3', 'D4', 'F4', 'A4', 'D5']): zheng(392.2 + i * .035, p, 3.5, .55, .85)
flute(392.2, 'D5', 2.5, .42, .55)
erhu(392.2, 'A4', 2.2, .36, .5)
gong(394.0, 'small', .5, .8)
for t in [396.5, 397.0]: wb(t, .6, 'a', 1.0, 0)
KEY['end'] = 392.0; KEY['endTicks'] = [396.5, 397.0]

# ================= reverb, silence shaping, export =================
REV = {'pipa': (.42, .16), 'zheng': (.5, .2), 'winds': (.5, .2), 'perc': (.38, .12)}
GAIN = {'pipa': 1.0, 'zheng': .8, 'winds': .75, 'perc': .9}
tt = np.arange(N) / SR
def fade(a, b, target=0.0):
    m = (tt >= a) & (tt < b)
    if not m.any(): return
    if target <= 0: env = np.linspace(1, 0, m.sum())
    else: env = np.linspace(1, target, m.sum())
    for k in STEMS: STEMS[k][m] *= env[:, None]
fade(74.0, 76.0, .4)          # march thins before the peel
fade(118.0, 120.0, .5)
fade(148.0, 150.5, 0.0)       # into the cut: near silence
fade(150.5, 172.0, 1.0)       # (heartbeat/erhu continue at set gains)
fade(233.0, 236.5, 0.0)
fade(291.0, 294.5, .3)
fade(399.0, 403.5, 0.0)       # final fade

out = {}
for k, x in STEMS.items():
    from scipy.signal import butter, sosfilt
    def room(x, wet, delay):
        d = int(delay * SR)
        y = x.copy(); y[d:] += wet * x[:-d]
        return y
    y = room(x, *REV[k]) * GAIN[k]
    out[k] = y.astype(np.float32)

mix = sum(out.values())
peak = np.abs(mix).max()
if peak > .98: mix *= .98 / peak
sf.write(os.path.join(HERE, 'score.wav'), mix, SR)
for k, y in out.items(): sf.write(os.path.join(HERE, 'stems', k + '.wav'), y, SR)
json.dump(KEY, open(os.path.join(HERE, 'score.json'), 'w'), indent=1)
print('score.wav written,', DUR, 's, peak', round(float(np.abs(mix).max()), 3))
