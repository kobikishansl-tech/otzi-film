# The Man the Glacier Kept

An original 66-second ukiyo-e woodblock-print animated short about **Ötzi the Iceman** — eight views of one alpine pass, printed block by block on a mounting scroll.

- **Film:** [film/otzi.mp4](film/otzi.mp4) — 1920×1080, 24 fps, 66 s, −14 LUFS
- **Poster:** [film/poster.jpg](film/poster.jpg)
- **Subtitles:** [film/otzi.srt](film/otzi.srt)

## The story

Five thousand three hundred years ago, a man climbed an alpine pass and never came down. Told in eight prints (峠八景, *Eight Views of the Pass*): the autumn walk, his gear, his last meal (ibex, red deer, einkorn), the climb, the arrow in the dusk, the snowfall that unprints the scene to bare paper, the glacier, and the 1991 discovery. Historical facts follow the South Tyrol Museum of Archaeology and Maixner et al., *Current Biology* 28 (2018).

## How it was made

Built with the [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) toolkit (MIT): every frame is drawn deterministically on canvas in the ukiyo-e style — flat colour blocks printed from separate woodblocks with misregistration, 8 fps figure stepping, paper as the white. Narration is Kokoro TTS; the score (shamisen, shakuhachi, taiko, koto, hyōshigi) is synthesised offline; foley and ambience are procedural.

## Rebuild

Inside a Lemo-Opuscar checkout, copy `src/` to `films/otzi/` and run:

```sh
sh films/otzi/build.sh
```

That regenerates narration, score, mix, subtitles, the frame-by-frame render, and the final mux. Details in [src/TREATMENT.md](src/TREATMENT.md) and [src/CREDITS](src/CREDITS).
