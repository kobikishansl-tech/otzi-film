// Timeline (single source of truth): camera, printing, title slips, narration and music cues derive from here
export const DUR = 66.0;
export const q8 = t => Math.floor(t * 8) / 8;     // figures and nature: 8 fps
export const q12 = t => Math.floor(t * 12) / 12;  // snow, fast water: 12 fps

// Sheets on the mounting scroll (right to left: the first picture is rightmost)
export const GAP = 260, SW = 1920 + GAP;
export const SLOT = i => (7 - i) * SW;

export const T = {
  // Opening print of V1: key line -> blue -> green -> red
  print1: [0.35, 1.05, 1.70, 2.30],
  title: [2.9, 5.4],
  // Views (settled time, slide interval). Slides shorten = urgency
  v1: [0, 8.6], pan12: [8.6, 9.5],
  v2: [9.5, 16.2], pan23: [16.2, 17.0],
  v3: [17.0, 23.2], pan34: [23.2, 24.0],
  v4: [24.0, 29.5], pan45: [29.5, 30.3],
  // V5 dusk: ma (silence) 30.3-32.0, arrow 32.0, fall 32.6
  v5: [30.3, 36.0], ma: [30.3, 32.0], arrow: 32.0, fall: [32.4, 33.2],
  pan56: [36.0, 36.8],
  // V6 snowfall washes the print back to paper; only the seal remains
  v6: [36.8, 44.0], snow: [37.2, 43.0], erase: [40.2, 42.6],
  pan67: [44.0, 44.8],
  // V7 glacier impression (alternate impression, ice blues)
  v7: [44.8, 50.6], pan78: [50.6, 51.4],
  // V8 discovery 1991: printed block by block
  print8: [51.5, 52.4, 53.3, 54.2],
  v8: [51.4, 66.0],
  sealAlone: [63.8, 66.0],
  cart: { v1: [7.4, 7.85], v2: [15.2, 15.65], v3: [22.2, 22.65], v5: [35.0, 35.45], v7: [49.6, 50.05], v8: [55.0, 55.45] },
};
export const REVEAL_DUR = 0.34;

// Narration: line id -> start time (locked after voice durations are known; see build.sh)
export const VO = { L1: 3.4, L2: 10.0, L3: 17.4, L4: 24.6, L5: 32.0, L6: 36.7, L7: 40.0, L8: 51.8, L9: 59.9 };
