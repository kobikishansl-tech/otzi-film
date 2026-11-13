# Score for "Falling Into a Black Hole" (30 s whiteboard sample).
# Gentle explainer cue: piano + marimba pointillism over a low cello drone,
# a small swell for the fall (16 s), near-silence for the frozen ending (22 s+).
import sys, os
import numpy as np
import soundfile as sf
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR, limit

HERE = os.path.dirname(os.path.abspath(__file__))
DUR = 30.5
BEAT = 60 / 96

notes = []
def n(t, inst, pitch, dur, vel=.6, pan=0.):
    notes.append(dict(t=t, inst=inst, pitch=pitch, dur=dur, vel=vel, pan=pan))

# D minor pentatonic: D F G A C
# ── hook (0–6): sparse, curious — two questioning piano figures over the drone
n(0.0, 'cellos', 'D2', 6.0, .38, .1)
n(0.4, 'glass', 'D4', 1.6, .5, -.15)
n(1.2, 'glass', 'F4', 1.4, .42, .15)
n(2.8, 'glass', 'G4', 1.6, .46, -.1)
n(3.6, 'marimba', 'A4', .9, .4, .2)
n(4.8, 'glass', 'C5', 1.2, .4, .1)

# ── title (6–10): the pulse starts (bar = 4 beats = 2.5 s)
for k, (t, p) in enumerate([(6.0, 'D4'), (6.625, 'A4'), (7.25, 'F4'), (7.875, 'D5'),
                            (8.5, 'C5'), (9.125, 'A4'), (9.75, 'G4')]):
    n(t, 'marimba', p, .8, .5 if k % 2 else .58, -.2 if k % 2 else .2)
n(6.0, 'cellos', 'D2', 4.0, .4, .05)

# ── the hole (10–16): longer, darker lines
n(10.0, 'cellos', 'D2', 3.0, .45, .1)
n(10.0, 'glass', 'D4', 2.0, .5, -.15)
n(11.25, 'glass', 'F4', 1.8, .44, .15)
n(12.5, 'marimba', 'G4', .8, .42, -.2)
n(13.75, 'glass', 'A3', 2.0, .46, .1)
n(15.0, 'marimba', 'C5', .8, .4, .2)

# ── the fall (16–22): rising tension, faster notes
n(16.0, 'cellos', 'A1', 3.0, .5, .05)
for k, t in enumerate(np.arange(16.0, 21.5, .625)):
    p = ['D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5', 'A5', 'G5', 'F5'][k % 10]
    n(float(t), 'marimba', p, .5, .34 + .012 * k, -.25 if k % 2 else .25)
n(19.25, 'glass', 'D5', 1.4, .5, 0)

# ── frozen (22–27): almost nothing — one cold chord, then sparse ticks
n(22.0, 'cellos', 'D2', 4.5, .42, .05)
n(22.0, 'glass', 'A4', 3.5, .4, 0)
n(23.5, 'marimba', 'F5', 1.2, .3, .3)
n(25.5, 'marimba', 'D5', 1.6, .26, -.3)

# ── end card (27–30): resolve and fade
n(27.0, 'glass', 'D4', 2.5, .5, -.1)
n(27.0, 'cellos', 'D2', 3.0, .4, .1)
n(27.625, 'glass', 'A3', 2.0, .4, .1)

x = S.render(notes)
N = int(DUR * SR)
if len(x) < N: x = np.pad(x, ((0, N - len(x)), (0, 0)))
else: x = x[:N]

# global shape: fade-in, gentle fade-out from 28.5
t = np.arange(N) / SR
env = np.minimum(1, t / .4) * np.minimum(1, np.maximum(0, (DUR - .5 - t) / 1.8))
x = x * env[:, None]

peak = float(np.abs(x).max())
if peak > 0: x = x / peak * .74
os.makedirs(HERE, exist_ok=True)
sf.write(os.path.join(HERE, 'score.wav'), x.astype(np.float32), SR)
print('score: peak', round(peak, 3), 'notes', len(notes))
