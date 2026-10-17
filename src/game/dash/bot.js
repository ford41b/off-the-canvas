import { stepRacer, cloneRacer, orbAt, SKILLS } from './racer';

// Bots search the real physics a second ahead: they hold off jumping until not jumping would doom them,
// so they jump at the last safe frame. Difficulty is how often they hesitate on that frame.
const DIFF = {
  easy: { miss: 0.2, save: 0.3, go: 0.01 },
  normal: { miss: 0.07, save: 0.7, go: 0.03 },
  hard: { miss: 0.015, save: 1, go: 0.08 },
};
const H = 54;
const NO = { jump: false, skill: false }, JUMP = { jump: true, skill: false };

export const createBot = (diff, seed = 1234567) => ({ diff, r: seed, budget: 0, dead: null });
function rnd(b) { b.r = (b.r * 1103515245 + 12345) & 0x7fffffff; return b.r / 0x7fffffff; }

// Pressing matters on the ground, inside an orb, or just before landing (a held jump fires on touchdown).
const canAct = (c, r) => r.grounded || r.vy > 0 || !!orbAt(c, r);

// True if some jump schedule keeps `r` alive for the rest of the horizon. Mutates `r`.
// Runs at constant speed reach identical states by different routes, so dead ends are remembered.
function survives(c, r, f, b) {
  for (; f < H; f++) {
    if (r.done) return true;
    if (--b.budget <= 0) return true;
    if (f % 2 === 0 && canAct(c, r)) {
      const key = `${f}|${r.x}|${r.y}|${r.vy}|${r.orbs.size}|${r.cd}`;
      if (b.dead.has(key)) return false;
      const a = cloneRacer(r);
      stepRacer(c, a, NO);
      if (!a.dead && survives(c, a, f + 1, b)) return true;
      stepRacer(c, r, JUMP);
      if (r.dead) { b.dead.add(key); return false; }
      if (!survives(c, r, f + 1, b)) { b.dead.add(key); return false; }
      return true;
    }
    stepRacer(c, r, NO);
    if (r.dead) return false;
  }
  return true;
}

function safe(c, me, inp, b, budget = 1600) {
  const a = cloneRacer(me);
  stepRacer(c, a, inp);
  b.budget = budget; b.dead = new Set();
  return !a.dead && survives(c, a, 1, b);
}

export function think(c, me, b, opts = {}) {
  const out = { jump: false, skill: false };
  if (me.dead || me.done) return out;
  const D = DIFF[b.diff], sk = SKILLS[me.id], ready = me.cd === 0 && !opts.noSkills;
  if (ready && sk.bot === 'go' && rnd(b) < D.go && safe(c, me, { jump: false, skill: true }, b)) return { jump: false, skill: true };
  if (safe(c, me, NO, b)) return out;
  if (canAct(c, me)) {
    if (safe(c, me, JUMP, b)) {
      if (opts.perfect || rnd(b) >= D.miss) out.jump = true;
      return out;
    }
  }
  if (ready && sk.bot === 'save' && rnd(b) < D.save) {
    for (const inp of [{ jump: false, skill: true }, { jump: true, skill: true }]) if (safe(c, me, inp, b)) return inp;
  }
  return out;
}
