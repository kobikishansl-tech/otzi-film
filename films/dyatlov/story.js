// DYATLOV PASS — single source of truth. 24 fps; characters step at 12 fps (q12).
export const DUR = 404;
export const q12 = t => Math.floor(t * 12) / 12;

export const T = {
  // S1 cold open: folded strip, one cut, unfold into a chain of nine
  snips: [2.5, 5.0, 7.5], unfold: 9.5, chainSettle: 10.6, slideAway: 12.7,
  // S2 title
  title: 13.0, titleOut: 21.7,
  // S3 the nine stand up; Yudin leaves
  s3: 22.0, standUp: 24.5, yudin: 44.0, yudinGone: 51.5,
  // S4 map → night peel → last photo (tent up)
  map: 52.0, peel: 76.0, lastPhoto: 78.5, shutter: 84.5,
  // S5 night camp: tent backlit, wind, slab thickens
  camp: 88.0, windUp: 104.0,
  // S6 the slab
  crack: 132.0, slide: 134.0, shake: 134.15, still: 141.0,
  // S7 the cut from inside
  cutStart: 150.0, cutOpen: 158.5, spill: 160.5,
  // S8 descent
  descent: 172.0,
  // S9 cedar: fire, branches, two still, three turn back
  cedar: 198.0, still: 218.0, backUp: 220.5,
  // S10 ravine
  ravine: 236.0, covered: 249.0,
  // S11 search
  search: 262.0, mayFound: 284.0,
  // S12 case file: stamps + theories snipped away
  file: 294.0, stamps: [295.5, 298.0, 300.5], theories: [304.5, 308.5, 312.5, 316.5], snips2: [307.0, 311.0, 315.0, 319.0],
  // S13 the answer: diagram, slow-mo slab, stamps
  answer: 326.0, stamp2020: 328.0, stamp2021: 334.0, slowmo: 339.0,
  // S14 coda
  coda: 362.0, sun: 371.0, plaque: 377.5,
  // S15 end card
  end: 392.0, ticks: [396.5, 397.0],
};

// narration start times (re-lock from voices/dur.json after TTS)
export const VO = {
  L1: 4.0, L2: 22.8, L3: 33.5, L4: 44.0, L5: 56.5, L6: 68.0, L7: 84.0,
  L8: 112.5, L9: 124.0, L10: 140.5, L11: 152.0, L12: 163.5, L13: 189.0,
  L14: 206.5, L15: 227.5, L16: 255.0, L17: 287.0, L18: 300.0, L19: 316.0,
  L20: 332.0, L21: 343.5, L22: 356.0, L23: 385.0,
};

// scene list [name, start, end] — one sheet per scene, enters by a paper slide
export const SCENES = [
  ['macro', 0, 13], ['title', 13, 22], ['nine', 22, 52], ['map', 52, 88],
  ['camp', 88, 120], ['slab', 120, 150], ['cut', 150, 172], ['descent', 172, 198],
  ['cedar', 198, 236], ['ravine', 236, 262], ['search', 262, 294], ['file', 294, 326],
  ['answer', 326, 362], ['coda', 362, 392], ['endcard', 392, 404],
];
export const sceneAt = t => { for (let i = SCENES.length - 1; i >= 0; i--) if (t >= SCENES[i][1]) return SCENES[i]; return SCENES[0]; };
