# Score for "Black Hole Journey" (pictogram motion, 4:18). 120 BPM, D minor.
# Chapter moods: curious drips → journey pulse → disk heat → the fall → suspended calm →
# the dark inside → slow leak → release into light → end-card resolve.
import sys, os
import numpy as np
import soundfile as sf
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR, limit

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 258.5

notes = []
def n(t, inst, pitch, dur, vel=.6, pan=0., **kw):
    notes.append(dict(t=t, inst=inst, pitch=pitch, dur=dur, vel=vel, pan=pan, **kw))

B = 0.5  # eighth note at 120 BPM
CH = {  # chapter boundaries (film seconds)
    'earth': 0.0, 'title': 12.0, 'launch': 24.0, 'drift': 36.0, 'lens': 48.0, 'disk': 61.0,
    'tide': 75.0, 'spag': 88.0, 'horizon': 102.0, 'noreturn': 115.0, 'frozen': 128.0,
    'gentle': 142.0, 'inside': 155.0, 'sing': 168.0, 'swap': 181.0, 'infinite': 194.0,
    'forever': 208.0, 'hawking': 221.0, 'light': 235.0, 'end': 249.0,
}

# ── earth (0–12): curious, light — bowed vibes pad, marimba drips
n(0.0, 'vibraphone_bowed', 'D4', 5.0, .3, -.2, attack=.6)
n(0.0, 'vibraphone_bowed', 'A4', 5.0, .26, .2, attack=.6)
for i, p in enumerate(['D5', None, 'A5', None, 'F5', None, 'A5', 'G5']):
    if p: n(i * B, 'marimba', p, .5, .4 + .06 * (i % 3) / 2, .3 if i % 2 else -.3)
n(6.0, 'electric_bass', 'D2', 1.8, .55)
n(8.0, 'electric_bass', 'A1', 1.2, .5)

# ── title (12–24): slam + groove
n(12.4, 'crash', None, None, .5, 0, g=.6)
for p in ['D4', 'A4', 'D5']: n(12.4, 'marimba', p, .8, .7, 0)
for k in range(6):
    tb = 13.0 + k * 1.0
    n(tb, 'electric_bass', ['D2', 'D2', 'C2', 'D2', 'F2', 'G1'][k], .9, .6)
    n(tb, 'marimba', ['D4', 'F4', 'E4', 'D4', 'A4', 'C5'][k], .45, .5, -.3 if k % 2 else .3)

# ── launch (24–36): rising pulse, dotted quarter bass
n(24.5, 'vibraphone_bowed', 'F3', 6.0, .28, -.15, attack=.8)
for k in range(8):
    tb = 24.7 + k * 1.25
    n(tb, 'electric_bass', ['D2', 'A1', 'D2', 'C2', 'D2', 'A1', 'Bb1', 'C2'][k], .8, .58 + .04 * (k > 4))
    if k % 2 == 0: n(tb + .25, 'marimba', ['D5', 'F5', 'A5', 'G5'][k // 2], .4, .42, .25)

# ── drift (36–48): sparse, weightless — glass tones, no drums
for k, (t0, p) in enumerate([(36.7, 'A5'), (39.2, 'F5'), (42.0, 'D5'), (44.6, 'E5')]):
    n(t0, 'glass', p, 2.2, .34, -.25 if k % 2 else .25, attack=.4)
n(36.5, 'vibraphone_bowed', 'D3', 8.0, .24, .1, attack=1.2)

# ── lens (48–61): the sky bends — shimmering arps over a low pedal
n(48.5, 'vibraphone_bowed', 'Bb2', 9.0, .3, 0, attack=.8)
for k in range(20):
    tb = 48.7 + k * .62
    p = ['D5', 'F5', 'A5', 'C6', 'A5', 'F5'][k % 6]
    n(tb, 'marimba', p, .38, .3 + .1 * (k % 4 == 0), .3 if k % 2 else -.3)
n(56.0, 'electric_bass', 'Bb1', 2.4, .55)

# ── disk (61–75): heat — driving eighths, tremolo cellos
n(61.4, 'crash', None, None, .45, 0, g=.5)
for k in range(26):
    tb = 61.7 + k * .5
    n(tb, 'marimba', ['D5', 'F5', 'E5', 'C5'][k % 4], .3, .46 + .08 * (k % 8 == 0), .28 if k % 2 else -.28)
    if k % 4 == 0: n(tb, 'electric_bass', ['D2', 'C2', 'Bb1', 'A1'][k // 4 % 4], .48, .6)
for k in range(4): n(62.0 + k * 3.0, 'violins_trem', 'D4', 2.6, .3, .2 - .13 * k)

# ── tide (75–88): the pull — low ostinato, first stretch
n(75.5, 'vibraphone_bowed', 'G2', 8.0, .3, -.1, attack=.8)
for k in range(10):
    tb = 75.7 + k * 1.25
    n(tb, 'electric_bass', ['G1', 'G1', 'F1', 'G1', 'Eb1', 'G1', 'A1', 'F1', 'G1', 'D2'][k], .9, .6)
    n(tb + .5, 'marimba', ['G4', 'Bb4', 'A4', 'G4'][k % 4], .4, .4, .3)

# ── spag (88–102): the fall — rising run, driving bass, rise foley carries the peak
n(88.4, 'crash', None, None, .5, 0, g=.55)
run = ['D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5']
for k, p in enumerate(run): n(88.7 + k * .33, 'marimba', p, .3, .42 + .025 * k, .2 if k % 2 else -.2)
for k in range(10):
    tb = 93.0 + k * .5
    n(tb, 'electric_bass', ['D2', 'D2', 'C2', 'D2'][k % 4], .45, .62)
for k in range(4): n(92.0 + k * 2.5, 'violins_trem', 'A3', 2.2, .3, -.2 + .13 * k)

# ── horizon (102–115): the line — hushed, ticking glass, one deep hit
n(102.4, 'timpani', 'D2', 1.5, .5, 0, g=.7)
n(102.5, 'vibraphone_bowed', 'D3', 9.0, .26, 0, attack=1.0)
for k in range(8):
    n(104.0 + k * 1.2, 'glass', ['A5', 'F5', 'E5', 'D5'][k % 4], 1.0, .22, -.2 if k % 2 else .2, attack=.3)
n(110.0, 'electric_bass', 'D1', 3.0, .5)

# ── noreturn (115–128): trapped — pulsing low cluster, no melody
for k in range(10):
    tb = 115.7 + k * 1.25
    n(tb, 'electric_bass', ['D1', 'D1', 'Eb1', 'D1'][k % 4], 1.0, .55)
    if k % 2: n(tb + .6, 'marimba', 'D4', .3, .3, .25)
n(118.0, 'violins_trem', 'D4', 5.0, .26, -.15)

# ── frozen (128–142): outside view — near-silence, slow ticking, fading pad
n(128.5, 'vibraphone_bowed', 'A3', 11.0, .22, 0, attack=1.6)
for k in range(6): n(130.0 + k * .5, 'glass', 'D6', .4, .14 + .02 * k, .15)
n(136.0, 'glass', 'A5', 2.5, .2, -.2, attack=.5)

# ── gentle (142–155): calm free-fall — warm vibes, slow sway
n(142.5, 'vibraphone_bowed', 'F4', 6.0, .3, -.15, attack=.8)
n(142.5, 'vibraphone_bowed', 'C4', 6.0, .26, .15, attack=.8)
for k, (t0, p) in enumerate([(144.2, 'A4'), (147.0, 'G4'), (149.8, 'F4')]):
    n(t0, 'marimba', p, .8, .38, .2 if k % 2 else -.2)
n(151.5, 'electric_bass', 'F2', 2.0, .45)

# ── inside (155–168): everything falls — descending lines, dark pad
n(155.5, 'vibraphone_bowed', 'D2', 10.0, .3, 0, attack=1.0)
desc = ['D5', 'C5', 'Bb4', 'A4', 'G4', 'F4', 'E4', 'D4']
for k, p in enumerate(desc): n(156.5 + k * .75, 'marimba', p, .55, .4, -.25 if k % 2 else .25)
n(162.0, 'violins_trem', 'D3', 4.0, .3, .15)

# ── sing (168–181): the singularity — a dark hit, then a ringing point
n(168.4, 'timpani', 'D2', 1.5, .6, 0, g=.8)
n(168.5, 'crash', None, None, .4, 0, g=.5)
n(169.0, 'glass', 'D6', 4.0, .3, 0, attack=.05)
n(173.0, 'glass', 'A5', 3.5, .24, -.2, attack=.3)
n(176.5, 'electric_bass', 'D1', 3.5, .5)

# ── swap (181–194): space and time trade places — rotating arps, odd metre feel
n(181.5, 'vibraphone_bowed', 'Bb2', 9.0, .28, 0, attack=.8)
for k in range(18):
    tb = 181.7 + k * .66
    p = ['Bb4', 'D5', 'F5', 'E5', 'C5', 'Bb4'][k % 6]
    n(tb, 'marimba', p, .4, .36, .3 if k % 2 else -.3)
n(187.0, 'electric_bass', 'Bb1', 2.2, .55)
n(190.0, 'electric_bass', 'C2', 2.2, .55)

# ── infinite (194–208): the last fraction of a second — crescendo cluster, then cut
for k in range(24):
    tb = 194.7 + k * .42
    n(tb, 'marimba', ['D5', 'Eb5', 'E5', 'F5'][k % 4], .3, .4 + .02 * k, .25 if k % 2 else -.25)
    if k % 3 == 0: n(tb, 'electric_bass', 'D1', .8, .5 + .02 * k)
for k in range(4): n(199.0 + k * 1.6, 'violins_trem', ['D4', 'Eb4', 'E4', 'F4'][k], 1.5, .3 + .04 * k, -.15 + .1 * k)
n(205.8, 'timpani', 'D2', 1.5, .65, 0, g=.8)

# ── forever (208–221): maybe forever — clock ticks, long empty air
n(208.5, 'vibraphone_bowed', 'D3', 11.0, .24, 0, attack=1.6)
for k in range(5): n(210.0 + k * .5, 'glass', 'A5', .35, .16, .2)
n(214.0, 'glass', 'F5', 2.5, .2, -.2, attack=.5)

# ── hawking (221–235): the slow leak — faint arps over a fading drone, very quiet
n(221.5, 'vibraphone_bowed', 'D2', 12.0, .22, 0, attack=2.0)
for k in range(16):
    tb = 222.0 + k * .78
    n(tb, 'glass', ['D6', 'A5', 'F5', 'D5'][k % 4], .6, .16 + .015 * (k % 3), .25 if k % 2 else -.25, attack=.2)

# ── light (235–249): release — bright D major wash, rays of cream
n(235.4, 'crash', None, None, .55, 0, g=.7)
for p in ['D4', 'A4', 'D5', 'F#5']: n(235.5, 'glass', p, 6.0, .3, .2 * (['D4', 'A4', 'D5', 'F#5'].index(p) % 2 and 1 or -1) * .8, attack=.4)
n(235.5, 'vibraphone_bowed', 'D3', 10.0, .3, 0, attack=.8)
n(235.5, 'electric_bass', 'D2', 4.0, .55)
for k, p in enumerate(['A4', 'B4', 'D5', 'E5', 'F#5', 'A5']):
    n(238.0 + k * .9, 'marimba', p, .7, .4, .25 if k % 2 else -.25)

# ── end (249–258): resolve — the sample's cadence, slower
n(249.4, 'crash', None, None, .5, 0, g=.6)
for p in ['D4', 'A4', 'D5']: n(249.5, 'marimba', p, 1.2, .6, 0)
n(249.5, 'vibraphone_bowed', 'D3', 8.0, .3, -.1, attack=.8)
n(251.5, 'electric_bass', 'D2', 3.0, .55)
n(253.5, 'glass', 'D6', 4.0, .26, .2, attack=.4)
n(255.0, 'electric_bass', 'A1', 2.5, .45)
n(256.0, 'vibraphone_bowed', 'A4', 2.5, .2, .15, attack=.6)

# ── render ──
x = S.render(notes)
N = int(DUR * SR)
if len(x) < N: x = np.pad(x, ((0, N - len(x)), (0, 0)))
else: x = x[:N]

t = np.arange(N) / SR
env = np.minimum(1, t / .4) * np.minimum(1, np.maximum(0, (DUR - .5 - t) / 1.8))
x = x * env[:, None]

peak = float(np.abs(x).max())
if peak > 0: x = x / peak * .875
sf.write(os.path.join(HERE, 'score.wav'), x.astype(np.float32), SR)
print('score: peak', round(peak, 3), 'notes', len(notes))
