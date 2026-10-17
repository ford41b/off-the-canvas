import { getCourse } from './courses';
import { makeRacer, stepRacer } from './racer';
import { createBot, think } from './bot';
import { updateEffects, sparks, ring, text } from '../fx';

const COUNT = 180;
const BEST_KEY = 'otc_dash_best';

export function createRace({ course, p1, bots = [], difficulty = 'normal', checkpoints = true, reduced = false }) {
  const c = getCourse(course);
  const g = {
    course: c, frame: 0, count: COUNT, events: [], effects: [], bubbles: [], reduced, checkpoints,
    over: null, overT: 0, endAt: 0, order: [], cam: { x: c.start.x - 340, y: -160 },
  };
  g.racers = [p1, ...bots].map((id, i) => Object.assign(makeRacer(c, id, i, i > 0, checkpoints), { rot: 0, trail: [] }));
  g.brains = bots.map((_, i) => createBot(difficulty, 9301 + i * 4219));
  return g;
}

// Positions by finish time, then by distance covered.
export function standings(g) {
  return [...g.racers].sort((a, b) => (a.done !== b.done ? (a.done ? -1 : 1) : a.done ? a.finishT - b.finishT : b.x - a.x));
}

function onEvents(g, r, ev) {
  const me = !r.bot;
  for (const e of ev) {
    if (e.type === 'die') {
      sparks(g, e.x, e.y, r.def.color, me ? 16 : 8, 8); ring(g, e.x, e.y, r.def.color, 26);
      if (me) { g.shake = 10; g.events.push({ type: 'ko' }); }
    } else if (e.type === 'checkpoint' && me) { ring(g, e.x, e.y - 40, '#3BB273', 30); text(g, e.x, e.y - 90, 'checkpoint saved', '#3BB273'); g.events.push({ type: 'catch' }); }
    else if (e.type === 'pad' || e.type === 'orb') { ring(g, e.x, e.y, e.type === 'pad' ? '#FFC24A' : '#3FD0E0', 20); if (me) g.events.push({ type: 'pop' }); }
    else if (e.type === 'deflect') { ring(g, e.x, e.y, r.def.color, 30); if (me) g.events.push({ type: 'counter' }); }
    else if (e.type === 'blink') { ring(g, e.from, r.y - 15, r.def.accent, 18); if (me) g.events.push({ type: 'special', id: r.id }); }
    else if (e.type === 'skill' && me) g.events.push({ type: 'special', id: e.id });
    else if (e.type === 'finish') { sparks(g, r.x, r.y - 20, r.def.color, 14, 7); if (me) g.events.push({ type: 'boom' }); }
    else if (me && (e.type === 'jump' || e.type === 'land' || e.type === 'denied')) g.events.push({ type: e.type });
  }
}

// Visual-only state: a front flip per jump, and a short motion trail.
function animate(g, r) {
  if (r.dead || g.reduced) { r.rot = 0; r.trail.length = 0; return; }
  if (r.flip && !r.grounded) r.rot = Math.min(Math.PI * 2, r.rot + 0.24);
  else if (r.rot > 0) r.rot = r.rot > Math.PI ? Math.min(Math.PI * 2, r.rot + 0.5) : Math.max(0, r.rot - 0.5);
  if (r.rot >= Math.PI * 2 && r.grounded) r.rot = 0;
  if (g.frame % 2 === 0) { r.trail.push({ x: r.x, y: r.y }); if (r.trail.length > 6) r.trail.shift(); }
}

export function stepRace(g, input) {
  g.frame++;
  g.shake = (g.shake || 0) * 0.85;
  if (g.count > 0) {
    if (g.count % 60 === 0) g.events.push({ type: 'menu' });
    if (--g.count === 0) g.events.push({ type: 'select' });
    updateEffects(g);
    return;
  }
  const c = g.course;
  g.racers.forEach((r, i) => {
    const ev = [];
    const inp = r.bot ? think(c, r, g.brains[i - 1]) : g.over ? { jump: false, skill: false } : input;
    const was = r.done;
    stepRacer(c, r, inp, ev);
    onEvents(g, r, ev);
    if (r.done && !was) g.order.push(r.idx);
    animate(g, r);
  });
  const me = g.racers[0];
  if (me.done && !g.endAt) g.endAt = g.frame;
  if (g.endAt && !g.over) {
    const allDone = g.racers.every((r) => r.done);
    if (g.frame - g.endAt > (allDone ? 60 : 300)) g.over = { place: standings(g).indexOf(me) + 1 };
  }
  if (g.over) g.overT++;
  updateEffects(g);
}

export function raceResult(g, setup) {
  const list = standings(g).map((r) => ({ id: r.id, bot: r.bot, done: r.done, time: r.finishT, deaths: r.deaths, progress: Math.min(1, (r.x - g.course.start.x) / g.course.length) }));
  const me = g.racers[0];
  const prev = loadBest(setup.course, me.id);
  const record = me.done && (!prev || me.finishT < prev);
  if (record) saveBest(setup.course, me.id, me.finishT);
  return { course: setup.course, list, place: list.findIndex((r) => !r.bot) + 1, time: me.finishT, deaths: me.deaths, best: record ? me.finishT : prev, record, solo: g.racers.length === 1 };
}

function readBest() { try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}'); } catch { return {}; } }
export const loadBest = (course, id) => readBest()[course]?.[id] || 0;
function saveBest(course, id, t) {
  const all = readBest();
  all[course] = { ...all[course], [id]: t };
  try { localStorage.setItem(BEST_KEY, JSON.stringify(all)); } catch { /* storage unavailable */ }
}

export const fmtTime = (f) => {
  const s = f / 60, m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(2).padStart(5, '0')}`;
};
