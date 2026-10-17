// Stages are pure data: physics and combat read from this shape.
export const STAGES = {
  canvas: {
    name: 'Infinite Canvas',
    main: { x: 300, y: 520, w: 680, h: 56 },
    plats: [{ x: 390, y: 392, w: 170 }, { x: 720, y: 392, w: 170 }],
    spawns: [[470, 520], [810, 520]],
    respawn: [[560, 300], [720, 300]],
    blast: { l: -280, r: 1560, t: -360, b: 1040 },
  },
};