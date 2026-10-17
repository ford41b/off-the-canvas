import { C } from './palette';

// Stages are pure data: physics and combat read from this shape.
// Every stage is centered on x = 640. A platform with `move` sways around its listed spot:
// ax/ay are the swing in px, sp the speed (radians per frame), ph the phase, and orbit adds a quarter-turn on y.
export const STAGES = {
  canvas: {
    name: 'Infinite Canvas', blurb: 'The original. Two platforms, no surprises.',
    theme: { bg: C.paper, deco: 'dots', a: C.coral, b: C.cobalt },
    main: { x: 300, y: 520, w: 680, h: 56 },
    plats: [{ x: 390, y: 392, w: 170 }, { x: 720, y: 392, w: 170 }],
    spawns: [[470, 520], [810, 520]],
    respawn: [[560, 300], [720, 300]],
    blast: { l: -280, r: 1560, t: -360, b: 1040 },
  },
  context: {
    name: 'Context Window', blurb: 'Wide and tiered: three platforms, room to zone.',
    theme: { bg: '#F1F3F8', deco: 'windows', a: C.cobalt, b: C.cyan },
    main: { x: 240, y: 520, w: 800, h: 56 },
    plats: [{ x: 330, y: 400, w: 160 }, { x: 790, y: 400, w: 160 }, { x: 560, y: 290, w: 160 }],
    spawns: [[440, 520], [840, 520]],
    respawn: [[540, 260], [740, 260]],
    blast: { l: -320, r: 1600, t: -380, b: 1040 },
  },
  serverfarm: {
    name: 'Server Farm', blurb: 'Two platforms shuttle back and forth over a compact rack.',
    theme: { bg: '#EDEFF2', deco: 'racks', a: C.green, b: C.teal },
    main: { x: 340, y: 520, w: 600, h: 56 },
    plats: [
      { x: 370, y: 380, w: 150, move: { ax: 90, sp: 0.012 } },
      { x: 760, y: 380, w: 150, move: { ax: 90, sp: 0.012, ph: Math.PI } },
    ],
    spawns: [[490, 520], [790, 520]],
    respawn: [[560, 300], [720, 300]],
    blast: { l: -260, r: 1540, t: -360, b: 1040 },
  },
  tokenstream: {
    name: 'Token Stream', blurb: 'Elevators rise and fall at the edges. The top perch never moves.',
    theme: { bg: '#F2F6F4', deco: 'glyphs', a: C.teal, b: C.violet },
    main: { x: 300, y: 520, w: 680, h: 56 },
    plats: [
      { x: 330, y: 360, w: 140, move: { ay: 70, sp: 0.016 } },
      { x: 810, y: 360, w: 140, move: { ay: 70, sp: 0.016, ph: Math.PI } },
      { x: 570, y: 250, w: 140 },
    ],
    spawns: [[470, 520], [810, 520]],
    respawn: [[560, 220], [720, 220]],
    blast: { l: -280, r: 1560, t: -380, b: 1040 },
  },
  sandbox: {
    name: 'The Sandbox', blurb: 'One long, flat stage. Nowhere to hide, nothing to stand on.',
    theme: { bg: '#F5EEDC', deco: 'sand', a: '#D99A3D', b: C.coral },
    main: { x: 260, y: 520, w: 760, h: 56 },
    plats: [],
    spawns: [[450, 520], [830, 520]],
    respawn: [[560, 320], [720, 320]],
    blast: { l: -300, r: 1580, t: -360, b: 1040 },
  },
  latent: {
    name: 'Latent Space', blurb: 'A small island in the dark. One platform drifts in a slow orbit.',
    theme: { bg: '#262B55', deco: 'stars', a: C.violet, b: C.cyan, dark: true },
    main: { x: 380, y: 520, w: 520, h: 56 },
    plats: [{ x: 360, y: 410, w: 120 }, { x: 800, y: 410, w: 120 }, { x: 570, y: 300, w: 140, move: { ax: 120, ay: 40, sp: 0.01, orbit: true } }],
    spawns: [[500, 520], [780, 520]],
    respawn: [[560, 280], [720, 280]],
    blast: { l: -240, r: 1520, t: -360, b: 1040 },
  },
};
export const STAGE_IDS = Object.keys(STAGES);
export const randomStage = () => STAGE_IDS[Math.floor(Math.random() * STAGE_IDS.length)];
