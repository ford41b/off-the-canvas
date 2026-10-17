import { C } from '../palette';

// Dash courses are written with a tiny tile builder: a cursor walks right laying floor, and obstacles are dropped
// relative to it. One tile is 40px; levels count tiles above the base floor (y = 0, up is negative).
const T = 40;
const CELL = 160;
const top = (l) => -l * T;

function buildCourse(meta, script) {
  const c = { ...meta, solids: [], spikes: [], saws: [], pads: [], orbs: [], cps: [] };
  let x = 0, lv = 0;
  const b = {
    floor(n) { c.solids.push({ x: x * T, y: top(lv), w: n * T, h: 1200, ground: true }); x += n; return b; },
    gap(n) { x += n; return b; },
    up(n = 1) { lv += n; return b; },
    down(n = 1) { lv -= n; return b; },
    spikes(n, small) { for (let i = 0; i < n; i++) c.spikes.push({ x: (x + i) * T, y: top(lv), dir: 1, h: small ? 20 : 40 }); return b.floor(n); },
    pad() { c.pads.push({ x: x * T, y: top(lv) }); return b.floor(1); },
    // Non-advancing pieces, placed `dx` tiles from the cursor.
    block(dx, w, h, spiky) {
      c.solids.push({ x: (x + dx) * T, y: top(lv + h), w: w * T, h: h * T });
      if (spiky) for (let i = 0; i < w; i++) c.spikes.push({ x: (x + dx + i) * T, y: top(lv + h), dir: 1, h: 40 });
      return b;
    },
    plat(dx, w, l, spiky) {
      c.solids.push({ x: (x + dx) * T, y: top(lv + l), w: w * T, h: T / 2 });
      if (spiky) for (let i = 0; i < w; i++) c.spikes.push({ x: (x + dx + i) * T, y: top(lv + l), dir: 1, h: 20 });
      return b;
    },
    ceil(dx, w, l) {
      c.solids.push({ x: (x + dx) * T, y: top(lv + l + 1), w: w * T, h: T });
      for (let i = 0; i < w; i++) c.spikes.push({ x: (x + dx + i) * T, y: top(lv + l), dir: -1, h: 40 });
      return b;
    },
    orb(dx, h) { c.orbs.push({ i: c.orbs.length, x: (x + dx) * T + T / 2, y: top(lv + h) - T / 2 }); return b; },
    saw(dx, h, r = 30) { c.saws.push({ x: (x + dx) * T + T / 2, y: top(lv + h), r }); return b; },
    cp() { c.cps.push({ x: x * T + T / 2, y: top(lv) }); return b; },
  };
  x = -20;
  b.floor(32);
  script(b);
  c.finish = (x + 2) * T;
  c.finishY = top(lv);
  b.floor(30);
  c.start = { x: 3 * T, y: 0 };
  c.length = c.finish - c.start.x;
  c.floor = Math.max(...c.solids.filter((s) => s.ground).map((s) => s.y)) + 320;
  c.solids = merge(c.solids);
  index(c);
  return c;
}

// Joins touching ground runs at the same height so collisions and drawing see one surface.
function merge(solids) {
  const ground = [];
  for (const s of solids.filter((q) => q.ground)) {
    const p = ground[ground.length - 1];
    if (p && p.y === s.y && p.x + p.w === s.x) p.w += s.w;
    else ground.push({ ...s });
  }
  return [...ground, ...solids.filter((q) => !q.ground)];
}

const EMPTY = { solids: [], spikes: [], saws: [], pads: [], orbs: [] };
function index(c) {
  c.grid = new Map();
  const add = (kind, o, x0, x1) => {
    for (let k = Math.floor((x0 - T) / CELL); k <= Math.floor((x1 + T) / CELL); k++) {
      if (!c.grid.has(k)) c.grid.set(k, { solids: [], spikes: [], saws: [], pads: [], orbs: [] });
      c.grid.get(k)[kind].push(o);
    }
  };
  c.solids.forEach((s) => add('solids', s, s.x, s.x + s.w));
  c.spikes.forEach((s) => add('spikes', s, s.x, s.x + T));
  c.saws.forEach((s) => add('saws', s, s.x - s.r, s.x + s.r));
  c.pads.forEach((s) => add('pads', s, s.x, s.x + T));
  c.orbs.forEach((s) => add('orbs', s, s.x - 30, s.x + 30));
}
export const near = (c, x) => c.grid.get(Math.floor(x / CELL)) || EMPTY;

const DEFS = {
  hello: {
    meta: { name: 'Hello, World', diff: 1, blurb: 'Single spikes, small hops, one pad. Learn the rhythm.', theme: { bg: C.paper, a: C.coral, b: C.cobalt, deco: 'dots' } },
    script: (b) => {
      b.spikes(1).floor(9).spikes(1).floor(9).block(0, 2, 1).floor(10).spikes(2).floor(10);
      b.gap(2).floor(9).block(0, 3, 1).floor(10).spikes(1).floor(8);
      b.cp().floor(4).up().floor(7).up().floor(9).down(2).floor(10).gap(3).floor(10);
      b.pad().spikes(3).floor(12).spikes(1).floor(7).spikes(1).floor(7).spikes(2).floor(10);
      b.cp().floor(4).block(0, 2, 1).floor(10).block(0, 2, 2).floor(10).gap(2).floor(6).gap(3).floor(10);
      b.orb(2, 1).gap(5).floor(10).spikes(2).floor(8).up().floor(8).spikes(1).floor(6).down().floor(8);
    },
  },
  stack: {
    meta: { name: 'Stack Overflow', diff: 2, blurb: 'Climb the call stack, then fall all the way back down.', theme: { bg: '#EEF2FB', a: C.cobalt, b: C.cyan, deco: 'brackets' } },
    script: (b) => {
      b.floor(4).up().floor(6).up().floor(6).up().floor(7).spikes(1).floor(7).down(3).floor(9);
      b.spikes(2).floor(8).block(0, 1, 1).floor(7).block(0, 2, 2).floor(12).pad().spikes(4).floor(10);
      b.cp().floor(6).spikes(2).floor(8).block(0, 4, 1).block(4, 3, 2).floor(14);
      b.spikes(1).floor(6).spikes(2).floor(7).spikes(1).floor(10).gap(3).floor(7).gap(3).floor(10);
      b.cp().floor(4).pad().floor(3).up(3).floor(7).spikes(1).floor(7).spikes(2).floor(8).down(3).floor(10);
      b.orb(2, 1).gap(6).floor(8).orb(2, 1).gap(6).floor(10).block(0, 4, 1).block(4, 4, 2).floor(16).spikes(3).floor(12);
      b.cp().floor(4).ceil(4, 5, 2).floor(12).spikes(1).floor(7).up().floor(6).up().floor(6).spikes(1).floor(6).down(2).floor(10);
    },
  },
  descent: {
    meta: { name: 'Gradient Descent', diff: 3, blurb: 'Step down the loss curve. An orb over every pit, if you can find the minimum.', theme: { bg: '#EAF6F1', a: C.green, b: C.teal, deco: 'curve' } },
    script: (b) => {
      b.pad().floor(3).up(3).floor(8).down().floor(6).spikes(1).floor(6).down().floor(6).down().floor(9);
      b.gap(3).floor(6).spikes(2, true).floor(7).orb(3, 1).gap(7).floor(8).spikes(1).floor(5).spikes(1).floor(8);
      b.cp().floor(4).pad().floor(3).up(3).floor(5).spikes(2).floor(5).down().floor(6).down().floor(6).down().floor(10);
      b.orb(2, 1).orb(6, 1).gap(9).floor(8).block(0, 2, 1).floor(8).spikes(2).floor(6).gap(4).floor(10);
      b.cp().floor(4).saw(6, 0, 28).floor(12).spikes(1, true).floor(5).spikes(1).floor(5).spikes(2).floor(10);
      b.plat(3, 3, 1).plat(9, 3, 1).gap(15).floor(7).up().floor(5).up().floor(5).down(2).floor(7).spikes(1).floor(10);
      b.cp().floor(4).orb(2, 1).orb(6, 1).orb(10, 1).gap(13).floor(10).spikes(3).floor(12);
    },
  },
  ratelimit: {
    meta: { name: 'Rate Limit', diff: 4, blurb: 'Saws, ceilings and triple spikes. Too many requests. Slow down. Or don\u2019t.', theme: { bg: '#FBEFEA', a: C.red, b: C.coral, deco: 'warning' } },
    script: (b) => {
      b.spikes(3).floor(8).saw(4, 2, 30).floor(10).ceil(3, 6, 2).floor(15).spikes(3).floor(8);
      b.block(0, 3, 1).block(4, 2, 2).floor(12).saw(4, 0, 34).floor(10).gap(4).floor(6).gap(4).floor(10);
      b.cp().floor(4).pad().spikes(4).floor(6).saw(3, 0, 26).floor(8).orb(2, 1).orb(6, 1).gap(9).floor(8);
      b.ceil(2, 5, 2).floor(10).spikes(2).floor(4).spikes(2).floor(8).up().floor(5).spikes(2).floor(5).down().floor(8);
      b.cp().floor(4).spikes(3).floor(6).spikes(3).floor(8).plat(3, 2, 1).plat(8, 2, 1).gap(13).floor(8);
      b.saw(5, 0, 30).saw(11, 0, 30).floor(20).block(0, 2, 1).block(5, 2, 2).floor(12).gap(4).floor(2).spikes(1, true).floor(10);
      b.cp().floor(4).pad().floor(4).up(2).floor(5).spikes(1).floor(5).down(2).floor(2).orb(2, 1).gap(6).floor(5).spikes(3).floor(12);
    },
  },
  prod: {
    meta: { name: 'Friday Deploy', diff: 5, blurb: 'Everything at once, at 4:59pm. No rollbacks.', theme: { bg: '#262B55', a: C.violet, b: C.cyan, deco: 'stars', dark: true } },
    script: (b) => {
      b.spikes(3).floor(6).spikes(3).floor(7).ceil(2, 6, 2).floor(10).saw(3, 0, 26).floor(8).gap(4).floor(5).gap(4).floor(8);
      b.pad().spikes(4).floor(4).orb(3, 1).gap(7).floor(5).spikes(2).floor(5).spikes(3).floor(8);
      b.cp().floor(4).plat(3, 2, 1).plat(8, 2, 1).plat(13, 2, 1).gap(18).floor(6).saw(3, 2, 28).floor(8).block(0, 2, 1).block(4, 3, 2).floor(10);
      b.orb(2, 1).orb(6, 1).orb(10, 1).gap(13).floor(6).spikes(3).floor(5).ceil(1, 6, 2).floor(8).spikes(2).floor(4).spikes(1).floor(6);
      b.cp().floor(9).up().floor(4).up().floor(4).up().floor(4).spikes(1).floor(4).down(3).saw(3, 0, 26).floor(8).gap(4).floor(8);
      b.pad().spikes(4).floor(7).orb(2, 1).gap(6).floor(5).spikes(3).floor(8);
      b.cp().floor(4).saw(4, 2, 30).saw(10, 2, 30).floor(14).spikes(3).floor(6).ceil(2, 5, 2).floor(9).spikes(1).floor(10);
    },
  },
};

export const COURSE_IDS = Object.keys(DEFS);
export const COURSE_META = Object.fromEntries(COURSE_IDS.map((id) => [id, DEFS[id].meta]));
const cache = {};
export function getCourse(id) {
  if (!cache[id]) cache[id] = { id, ...buildCourse(DEFS[id].meta, DEFS[id].script) };
  return cache[id];
}
