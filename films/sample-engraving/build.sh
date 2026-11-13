#!/bin/sh
# Rebuild "The Iceman, Plate I" from scratch: sh films/sample-engraving/build.sh
# (assumes the Lemo-Opuscar library checkout is the repo root: core/, .venv/)
set -e
sh "$(dirname "$0")/tools/fonts.sh"   # fonts: not in git (CREDITS names them) → fonts/
cd "$(dirname "$0")/../.."
PY=.venv/bin/python; D=films/sample-engraving; C=content.json
# 1. voice lines from the content file → Kokoro (bm_fable, en-gb) → whisper check
$PY -c "import json,sys; c=json.load(open('$D/$C')); v=c['voice']; json.dump([dict(id=l['id'],text=l['text'],voice=v['voice'],speed=v.get('speed',.92),lang='en-gb',**({'asr':l['asr']} if 'asr' in l else {})) for l in v['lines']], open('$D/lines.json','w'), indent=1)"
$PY core/tts/tts.py $D/lines.json $D/voices
$PY core/tts/asr_check.py $D/lines.json $D/voices
# 2. original baroque score → music/score.wav + stems
$PY $D/music/score.py
# 3. picture events → events.json; cue check (score accents ↔ picture); sound mix
node $D/tools/events.mjs $D $C
$PY $D/mix.py
$PY $D/tools/cuecheck.py
# 4. subtitles
$PY $D/tools/subs.py $C && $PY core/render/srt.py $D/subs.json $D/sample-engraving.srt
# 5. frames → mux at −14 LUFS with grain 4
node core/render/video.mjs $D --fps 24 --workers 2 --q "content=$C" --out $D/out/video.mp4
sh core/render/mux.sh $D/out/video.mp4 $D/mix.wav $D/sample-engraving.mp4 24 4
