#!/bin/sh
# Rebuild the finished film from scratch: sh films/dyatlov/build.sh   (runs from any directory)
set -e
cd "$(dirname "$0")/../.."
PY=.venv/bin/python; D=films/dyatlov
$PY core/tts/tts.py $D/lines.json $D/voices                                   # 1. Kokoro narration (am_michael)
$PY core/tts/asr_check.py $D/lines.json $D/voices --lang en                    # 2. whisper line-by-line check
node core/render/events.mjs $D                                                # 3. timeline → events.json (narration / foley / ambience)
$PY $D/music/score.py                                                         # 4. original score (pipa / zheng / erhu / dizi / woodblock / gong) → music/score.wav
$PY $D/mix.py                                                                 # 5. foley + narration + score ducking + wind beds → mix.wav
$PY $D/subs.py && $PY core/render/srt.py $D/out/subs.json films/dyatlov.srt    # 6. subtitles
node core/render/video.mjs $D --fps 24 --workers 3 --out $D/out/video24.mp4    # 7. frame-by-frame render (~9696 frames)
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav films/dyatlov/dyatlov.mp4 24 0  # 8. mux at −14 LUFS, grain 0 (the paper texture is already in the picture)
