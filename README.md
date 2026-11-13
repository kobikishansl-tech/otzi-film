# Paper-Cut History Films

Original history documentary shorts made with the [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) toolkit (MIT) — every frame drawn deterministically on canvas, narration by Kokoro TTS, score and foley synthesised offline.

## Films

### Dyatlov Pass — *a red paper-cut documentary* (6:44)

Nine student hikers died on a mountain pass in the northern Urals in February 1959; the case file was closed with a phrase about "a compelling natural force." Told in 15 scenes of Chinese red paper-cut animation — the chain of nine, the last photograph, the tent cut from inside, the cedar, the ravine, and the 2021 slab-avalanche model that finally explained it.

- **Film:** 138 MB, too large for git as one file — download the parts from [film/dyatlov-mp4-parts/](film/dyatlov-mp4-parts/) and rejoin: `sh join.sh` (1920×1080, 24 fps, −14.4 LUFS)
- **Poster:** [film/dyatlov-poster.jpg](film/dyatlov-poster.jpg)
- **Subtitles:** [film/dyatlov.srt](film/dyatlov.srt)
- **Source:** [films/dyatlov/](films/dyatlov/) — treatment, script, and full rebuild pipeline

### The Man the Glacier Kept — *ukiyo-e short* (1:06)

Eight views of one alpine pass (峠八景): the autumn walk, Ötzi's gear, his last meal, the climb, the arrow in the dusk, the snowfall that unprints the scene, the glacier, and the 1991 discovery. Facts follow the South Tyrol Museum of Archaeology and Maixner et al., *Current Biology* 28 (2018).

- **Film:** [film/otzi.mp4](film/otzi.mp4) — 1920×1080, 24 fps, −14 LUFS
- **Poster:** [film/poster.jpg](film/poster.jpg)
- **Subtitles:** [film/otzi.srt](film/otzi.srt)
- **Source:** [films/otzi/](films/otzi/)

## Style Samples — *one story, three styles* (30 s each)

Three 30-second samples of the same black-hole story ("Falling Into a Black Hole"), one per Lemo-Opuscar style — plus an Ötzi archaeology plate in the engraving style:

- **Whiteboard** — [film](films/sample-whiteboard/sample-whiteboard.mp4) · [subtitles](films/sample-whiteboard/sample-whiteboard.srt) · [source](films/sample-whiteboard/) — stickman drawn line by line on a whiteboard (hand-lettered, foley, score)
- **Pictogram Motion** — [film](films/sample-pictogram/sample-pictogram.mp4) · [subtitles](films/sample-pictogram/sample-pictogram.srt) · [source](films/sample-pictogram/) — flat pictogram shapes on colour discs, shot-based with wipe transitions
- **Copperplate Engraving** — [film](films/sample-engraving/sample-engraving.mp4) · [subtitles](films/sample-engraving/sample-engraving.srt) · [source](films/sample-engraving/) — "The Iceman, Plate I": Ötzi engraved burin-stroke by burin-stroke, with magnified detail roundels and hand-coloured washes (31 s)

All three: 1920×1080, 24 fps, −14 LUFS.

### Black Hole Journey — *pictogram motion explainer* (4:18)

What it would actually be like to fall into a black hole: the bend in the sky, the accretion disk, spaghettification, the event horizon, the frozen outside view, the singularity, and the slow leak of Hawking radiation. Twenty shots in six chapters — the long form of the pictogram style sample above.

- **Film:** [films/bh-journey/bh-journey.mp4](films/bh-journey/bh-journey.mp4) — 1920×1080, 24 fps, −14.2 LUFS
- **Subtitles:** [films/bh-journey/bh-journey.srt](films/bh-journey/bh-journey.srt)
- **Source:** [films/bh-journey/](films/bh-journey/)

## Rebuild

Inside a Lemo-Opuscar checkout, copy a film's folder to `films/<name>/` and run:

```sh
sh films/dyatlov/build.sh   # or: sh films/otzi/build.sh
```

That regenerates narration, score, mix, subtitles, the frame-by-frame render, and the final mux. Details in each film's `TREATMENT.md` and `CREDITS`.
