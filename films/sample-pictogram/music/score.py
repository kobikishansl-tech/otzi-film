# Score for "Falling Into a Black Hole" (30 s pictogram sample). 120 BPM, D minor.
# Marimba/vibes pointillism, a slam on the title, a rising run for the fall,
# near-silence for the frozen ending, a small resolve on the end card.
import sys, os
import numpy as np
import soundfile as sf
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR, limit

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 30.5

notes = []
def n(t, inst, pitch, dur, vel=.6, pan=0., **kw):
    notes.append(dict(t=t, inst=inst, pitch=pitch, dur=dur, vel=vel, pan=pan, **kw))

# ── hook (0–6): curious, light — marimba drips over a bowed-vibes pad
n(0.0, 'vibraphone_bowed', 'D4', 4.0, .3, -.2, attack=.6)
n(0.0, 'vibraphone_bowed', 'A4', 4.0, .26, .2, attack=.6)
drip = ['D5', None, 'A5', None, 'F5', None, 'A5', 'G5']
for i, p in enumerate(drip):
    if p: n(i * .5, 'marimba', p, .5, .4 + .06 * (i % 3) / 2, .3 if i % 2 else -.3)
n(4.0, 'electric_bass', 'D2', 1.8, .6)
n(5.0, 'electric_bass', 'A1', 0.9, .55)

# ── title (6–10): slam + groove
n(6.4, 'crash', None, None, .5, 0, g=.6)
for p in ['D4', 'A4', 'D5']: n(6.4, 'marimba', p, .8, .7, 0)
ost = ['D5', 'A5', 'F5', 'A5', 'G5', 'A5', 'F5', 'A5', 'D5', 'A5', 'F5', 'C6']
for i, p in enumerate(ost): n(6.5 + i * .25, 'marimba', p, .4, .38, .25 if i % 2 else -.25, g=.8)
n(6.4, 'electric_bass', 'D2', 3.2, .7)
n(9.0, 'electric_bass', 'C2', .9, .6)

# ── the hole (10–16): darker, sparser
n(10.6, 'vibraphone_bowed', 'D3', 4.5, .42, -.1, attack=.9)
n(10.6, 'vibraphone_bowed', 'A3', 4.5, .34, .1, attack=.9)
n(11.4, 'glass', 'D5', 1.6, .4, .2)
n(13.0, 'glass', 'F5', 1.4, .36, -.2)
n(12.0, 'electric_bass', 'D2', 2.4, .6)
n(14.6, 'electric_bass', 'D2', 1.2, .5)

# ── spaghettification (16–22): rising run, pulse
n(16.0, 'electric_bass', 'D2', .9, .68)
n(17.0, 'electric_bass', 'D2', .9, .62)
n(18.0, 'electric_bass', 'A1', .9, .62)
n(19.0, 'electric_bass', 'D2', .9, .62)
run = ['D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5', 'A5', 'C6', 'D6']
for i, p in enumerate(run): n(16.6 + i * .4, 'marimba', p, .5, .34 + i * .02, .2 if i % 2 else -.2, g=.85)
for i in range(12): n(16.0 + i * .5, 'shaker', 'down' if i % 2 else 'up', None, .2, .3, g=.5)

# ── frozen (22–26.5): near silence, one slow pad
n(22.4, 'vibraphone_bowed', 'D4', 4.0, .34, -.15, attack=1.2)
n(23.4, 'vibraphone_bowed', 'A4', 3.0, .26, .15, attack=1.2)
n(25.4, 'glass', 'F5', 1.6, .22, .1)

# ── end card (26.5–30): resolve
n(27.0, 'glass', 'D5', 2.2, .46, -.1)
n(27.0, 'glass', 'A4', 2.2, .4, .1)
n(27.0, 'cellos', 'D2', 3.0, .4, 0)
n(28.6, 'glockenspiel', 'D6', 1.4, .3, .2)

x = S.render(notes)
N = int(DUR * SR)
if len(x) < N: x = np.pad(x, ((0, N - len(x)), (0, 0)))
else: x = x[:N]

t = np.arange(N) / SR
env = np.minimum(1, t / .4) * np.minimum(1, np.maximum(0, (DUR - .5 - t) / 1.8))
x = x * env[:, None]

peak = float(np.abs(x).max())
if peak > 0: x = x / peak * .74
sf.write(os.path.join(HERE, 'score.wav'), x.astype(np.float32), SR)
print('score: peak', round(peak, 3), 'notes', len(notes))
