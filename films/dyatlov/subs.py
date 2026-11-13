"""Subtitle cues (same rule as SUBS in main.js) → subs.json → core/render/srt.py exports the .srt"""
import json, os, re
H = os.path.dirname(os.path.abspath(__file__))
L = {l['id']: l for l in json.load(open(f'{H}/lines.json'))}; D = json.load(open(f'{H}/voices/dur.json'))
VO = dict(re.findall(r'(L\d+): ([\d.]+)', re.search(r'export const VO = \{([^}]*)\}', open(f'{H}/story.js').read()).group(1)))
DUR = 404.0
cues = [{'t0': float(t) - .05, 't1': float(t) + max(1.8, D[i] + .7, len(L[i].get('sub', L[i]['text'])) / 15 + 1.6), 'text': L[i].get('sub', L[i]['text'])} for i, t in sorted(VO.items(), key=lambda kv: float(kv[1]))]
for a, b in zip(cues, cues[1:]): a['t1'] = min(a['t1'], b['t0'] - .1)
cues[-1]['t1'] = min(cues[-1]['t1'], DUR - .05)
os.makedirs(f'{H}/out', exist_ok=True)
json.dump(cues, open(f'{H}/out/subs.json', 'w'), indent=1, ensure_ascii=False); print(len(cues), 'cues')
