import { FIGHTERS } from '../fighters';
import { near } from './courses';

// Auto-runner physics. Pure and deterministic so bots can simulate it ahead of time.
export const T = 40;
export const PHYS = { G: 0.95, JUMP: 13.2, PAD: 18.5, ORB: 12.6, FALL: 17, SPEED: 6.4 };
const HW = 15, RH = 30, INSET = 3, ORB_R = 32;
const FX = ['shield', 'phase', 'boost', 'dash', 'glide'];

// One skill per character, on the special key. 'go' skills are used by bots to gain ground, 'save' ones to dodge a death.
export const SKILLS = {
  claude: { name: 'Clarification', desc: 'A brief shield. Touch a spike or saw while it is up and you bounce off it instead.', cd: 360, bot: 'save' },
  codex: { name: 'Quick Patch', desc: 'Spawns a platform under your feet for two seconds. Rescues a mistimed jump.', cd: 300, bot: 'save' },
  chatgpt: { name: 'Iterate', desc: 'A second jump in mid-air.', cd: 240, bot: 'save' },
  gemini: { name: 'Flash Mode', desc: 'A one-second burst of speed. Your jumps get longer while it lasts.', cd: 360, bot: 'go' },
  grok: { name: 'Unfiltered', desc: 'A flat, gravity-free dash forward. Clears pits, not walls.', cd: 330, bot: 'go' },
  perplexity: { name: 'Follow the Sources', desc: 'Glide: fall slowly for over a second.', cd: 300, bot: 'save' },
  hallucination: { name: 'Confidently Incorrect', desc: 'Phase through spikes and saws for a moment. Walls still count.', cd: 360, bot: 'save' },
  bug: { name: 'Glitch Step', desc: 'Teleport three tiles forward. Fizzles if you would land inside a wall.', cd: 300, bot: 'go' },
};

export const runSpeed = (def) => PHYS.SPEED * (1 + (def.stats.speed - 3) * 0.03);

export function makeRacer(c, id, idx, bot, cps = true) {
  const def = FIGHTERS.find((f) => f.id === id);
  return {
    id, idx, def, bot, cps, speed: runSpeed(def), x: c.start.x, y: c.start.y, vy: 0, grounded: true, flip: false,
    dead: 0, done: false, finishT: 0, t: 0, deaths: 0, cp: c.start, cpI: -1, orbs: new Set(), patch: null,
    cd: 0, shield: 0, phase: 0, boost: 0, dash: 0, glide: 0, skillHeld: false,
  };
}
export const cloneRacer = (r) => ({ ...r, orbs: new Set(r.orbs), patch: r.patch && { ...r.patch } });

const box = (r, i = 0) => ({ x: r.x - HW + i, y: r.y - RH + i, w: HW * 2 - i * 2, h: RH - i * 2 });
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const circleHit = (b, cx, cy, rad) => {
  const nx = Math.max(b.x, Math.min(cx, b.x + b.w)), ny = Math.max(b.y, Math.min(cy, b.y + b.h));
  return (nx - cx) ** 2 + (ny - cy) ** 2 < rad * rad;
};
export const spikeBox = (s) => (s.dir > 0
  ? { x: s.x + 12, y: s.y - s.h * 0.6, w: 16, h: s.h * 0.55 }
  : { x: s.x + 12, y: s.y + s.h * 0.05, w: 16, h: s.h * 0.55 });

export function orbAt(c, r) {
  const b = box(r);
  for (const o of near(c, r.x).orbs) if (!r.orbs.has(o.i) && circleHit(b, o.x, o.y, ORB_R)) return o;
  return null;
}
const inWall = (c, r) => near(c, r.x).solids.some((s) => hit(box(r), s));

function hazard(c, r) {
  if (r.phase > 0) return false;
  const b = box(r, INSET), cell = near(c, r.x);
  return cell.spikes.some((s) => hit(b, spikeBox(s))) || cell.saws.some((s) => circleHit(b, s.x, s.y, s.r * 0.82));
}

function die(r, ev) {
  r.dead = 40; r.deaths++;
  ev?.push({ type: 'die', x: r.x, y: r.y - RH / 2 });
}

function respawn(r) {
  Object.assign(r, { x: r.cp.x, y: r.cp.y, vy: 0, grounded: true, flip: false, patch: null, shield: 0, phase: 0, boost: 0, dash: 0, glide: 0 });
  r.orbs.clear();
}

function useSkill(c, r, ev) {
  const id = r.id;
  if (id === 'chatgpt' && r.grounded) return;
  if (id === 'claude') r.shield = 45;
  else if (id === 'codex') r.patch = { x: r.x - 70, y: r.y + (r.grounded ? 0 : 2), w: 150, life: 120 };
  else if (id === 'chatgpt') { r.vy = -PHYS.JUMP; r.flip = true; }
  else if (id === 'gemini') r.boost = 60;
  else if (id === 'grok') { r.dash = 18; r.vy = 0; }
  else if (id === 'perplexity') r.glide = 75;
  else if (id === 'hallucination') r.phase = 40;
  else if (id === 'bug') {
    const ox = r.x; r.x += 120;
    if (inWall(c, r)) { r.x = ox; ev?.push({ type: 'denied' }); return; }
    ev?.push({ type: 'blink', from: ox });
  }
  r.cd = SKILLS[id].cd;
  ev?.push({ type: 'skill', id });
}

// Advances one racer by one frame. `inp` is { jump, skill } (held state); `ev` collects events, or is omitted in simulations.
export function stepRacer(c, r, inp, ev) {
  if (r.done) { r.x += r.speed; return; }
  if (r.dead > 0) { if (--r.dead === 0) respawn(r); return; }
  r.t++;
  for (const k of FX) if (r[k] > 0) r[k]--;
  if (r.cd > 0) r.cd--;
  if (r.patch && --r.patch.life <= 0) r.patch = null;
  if (inp.skill && !r.skillHeld && r.cd === 0) useSkill(c, r, ev);
  r.skillHeld = inp.skill;

  // Horizontal: run into a wall and you're done, unless it's a lip you can step onto.
  r.x += r.speed * (r.dash > 0 ? 2.2 : r.boost > 0 ? 1.45 : 1);
  let cell = near(c, r.x);
  for (const s of cell.solids) {
    if (!hit(box(r), s)) continue;
    if (r.y - s.y <= 12 && r.vy >= 0) { r.y = s.y; r.vy = 0; r.grounded = true; }
    else return die(r, ev);
  }

  // Vertical.
  const py = r.y;
  if (r.dash > 0) r.vy = 0;
  else {
    r.vy = Math.min(r.vy + PHYS.G, r.glide > 0 ? 2.2 : PHYS.FALL);
    r.y += r.vy;
  }
  const was = r.grounded;
  r.grounded = false;
  for (const s of cell.solids) {
    if (!hit(box(r), s)) continue;
    if (r.vy >= 0) { r.y = s.y; r.vy = 0; r.grounded = true; }
    else { r.y = s.y + s.h + RH; r.vy = 0; }
  }
  const p = r.patch;
  if (p && r.vy >= 0 && py <= p.y + 0.5 && r.y >= p.y && r.x + HW > p.x && r.x - HW < p.x + p.w) { r.y = p.y; r.vy = 0; r.grounded = true; }
  if (r.grounded) { if (!was) ev?.push({ type: 'land' }); r.flip = false; r.glide = 0; }

  // Pads fire before jumps, so holding jump onto a pad still launches you.
  for (const pd of cell.pads) {
    if (r.vy >= -2 && hit(box(r), { x: pd.x + 4, y: pd.y - 10, w: T - 8, h: 10 })) { r.vy = -PHYS.PAD; r.grounded = false; r.flip = true; ev?.push({ type: 'pad', x: pd.x + T / 2, y: pd.y }); }
  }
  if (r.grounded && inp.jump) { r.vy = -PHYS.JUMP; r.grounded = false; r.flip = true; ev?.push({ type: 'jump' }); }
  else if (!r.grounded && inp.jump) {
    const o = orbAt(c, r);
    if (o) { r.orbs.add(o.i); r.vy = -PHYS.ORB; r.flip = true; r.dash = 0; ev?.push({ type: 'orb', x: o.x, y: o.y }); }
  }

  if (hazard(c, r)) {
    if (r.shield > 0) { r.shield = 0; r.vy = -PHYS.JUMP * 0.85; r.grounded = false; r.phase = 10; ev?.push({ type: 'deflect', x: r.x, y: r.y - RH / 2 }); }
    else return die(r, ev);
  }
  if (r.y > c.floor) return die(r, ev);

  if (r.cps) {
    const next = c.cps[r.cpI + 1];
    if (next && r.x >= next.x && r.grounded) { r.cpI++; r.cp = next; ev?.push({ type: 'checkpoint', x: next.x, y: next.y }); }
  }
  if (r.x >= c.finish) { r.done = true; r.finishT = r.t; ev?.push({ type: 'finish' }); }
}
