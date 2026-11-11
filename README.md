# Paper-Cut History Films

Original history documentary shorts made with the [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) toolkit (MIT) — every frame drawn deterministically on canvas, narration by Kokoro TTS, score and foley synthesised offline.

## Films

### Dyatlov Pass — *a red paper-cut documentary* (6:44)

Nine student hikers died on a mountain pass in the northern Urals in February 1959; the case file was closed with a phrase about "a compelling natural force." Told in 15 scenes of Chinese red paper-cut animation — the chain of nine, the last photograph, the tent cut from inside, the cedar, the ravine, and the 2021 slab-avalanche model that finally explained it.

- **Film:** too large for git (138 MB) — download from the [Releases page](../../releases) (`dyatlov.mp4`, 1920×1080, 24 fps, −14.4 LUFS)
- **Poster:** [film/dyatlov-poster.jpg](film/dyatlov-poster.jpg)
- **Subtitles:** [film/dyatlov.srt](film/dyatlov.srt)
- **Source:** [films/dyatlov/](films/dyatlov/) — treatment, script, and full rebuild pipeline

### The Man the Glacier Kept — *ukiyo-e short* (1:06)

Eight views of one alpine pass (峠八景): the autumn walk, Ötzi's gear, his last meal, the climb, the arrow in the dusk, the snowfall that unprints the scene, the glacier, and the 1991 discovery. Facts follow the South Tyrol Museum of Archaeology and Maixner et al., *Current Biology* 28 (2018).

- **Film:** [film/otzi.mp4](film/otzi.mp4) — 1920×1080, 24 fps, −14 LUFS
- **Poster:** [film/poster.jpg](film/poster.jpg)
- **Subtitles:** [film/otzi.srt](film/otzi.srt)
- **Source:** [films/otzi/](films/otzi/)

## Rebuild

Inside a Lemo-Opuscar checkout, copy a film's folder to `films/<name>/` and run:

```sh
sh films/dyatlov/build.sh   # or: sh films/otzi/build.sh
```

That regenerates narration, score, mix, subtitles, the frame-by-frame render, and the final mux. Details in each film's `TREATMENT.md` and `CREDITS`.
