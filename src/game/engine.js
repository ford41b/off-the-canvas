import { FIGHTERS } from './fighters';
import { STAGES } from './stages';
import { startAct, hitboxOf, hurtbox, overlap, applyHit, updateProjectiles, popDecoy } from './combat';
import { startSpecial, runSpecial } from './specials';
import { startRanged } from './ranged';
import { updateEffects, talk, pick, sparks, ring } from './fx';

const G = 0.58;
const KEYS = ['attack', 'heavy', 'special', 'shoot', 'dodge', 'jump'];
export const blankInput = () => ({ left: false, right: false, up: false, down: false, jump: false, attack: false, heavy: false, special: false, shoot: false, dodge: false });
export const fighterDef = (id) => FIGHTERS.find((f) => f.id === id);
const dirX = (i) => (i.right ? 1 : 0) - (i.left ? 1 : 0);

function makeFighter(def, idx, spawn, stocks) {
  return {
    def, idx, x: spawn[0], y: spawn[1], vx: 0, vy: 0, facing: idx === 0 ? 1 : -1, grounded: true, jumps: def.jumps,
    damage: 0, stocks, act: null, hitstun: 0, invuln: 0, cd: 0, cdMax: 1, rcd: 0, rcdMax: 1, hitFlash: 0, recUsed: false, freefall: false, airDodge: false,
    dropT: 0, landT: 0, hold: 0, stance: 'flash', mark: 0, lastMove: null, lastMoveT: 999, lastAttacker: -1, lastAttackerT: 999,
    combo: 0, comboT: 0, dead: 0, prev: blankInput(), buf: null, talkCd: 0, stale: [],
    stats: { dealt: 0, kos: 0, falls: 0, maxCombo: 0 },
  };
}

export function createGame({ p1, p2, stocks = 3, mode = 'cpu', stage = 'canvas', banter = true, reduced = false }) {
  const st = STAGES[stage];
  const g = {
    stage: st, mode, training: mode === 'training', frame: 0, hitstop: 0, shake: 0, projectiles: [], platforms: [],
    decoys: [], effects: [], bubbles: [], events: [], over: null, overT: 0, banter, reduced, cam: { x: 640, y: 400, z: 1 },
  };
  g.fighters = [p1, p2].map((id, i) => makeFighter(fighterDef(id), i, st.spawns[i], stocks));
  if (!g.training) talk(g, g.fighters[0], pick(g.fighters[0].def.lines.start, 0), true);
  return g;
}

export function getMove(f, name) {
  const m = f.def.moves[name];
  if (f.def.id !== 'gemini') return m;
  const fo = f.stance === 'focus';
  return { ...m, dmg: m.dmg * (fo ? 1.25 : 0.8), growth: m.growth * (fo ? 1.2 : 0.85), startup: Math.max(2, m.startup + (fo ? 2 : -1)), recovery: Math.round(m.recovery * (fo ? 1.1 : 0.7)) };
}
const speedMul = (f) => (f.def.id === 'gemini' ? (f.stance === 'focus' ? 0.85 : 1.15) : 1);

export function step(g, inputs) {
  if (g.over) { g.overT++; updateEffects(g); return; }
  g.frame++;
  if (g.frame === 70 && !g.training) talk(g, g.fighters[1], pick(g.fighters[1].def.lines.start, 1), true);
  if (g.hitstop > 0) { g.hitstop--; updateEffects(g); return; }
  g.shake *= 0.85;
  g.fighters.forEach((f, i) => updateFighter(g, f, inputs[i] || blankInput()));
  resolveHits(g);
  updateProjectiles(g);
  g.platforms.forEach((p) => p.life--); g.platforms = g.platforms.filter((p) => p.life > 0);
  g.decoys.forEach((d) => { d.x += d.vx; d.life--; }); g.decoys = g.decoys.filter((d) => d.life > 0);
  checkKOs(g);
  updateEffects(g);
}

function updateFighter(g, f, inp) {
  if (f.dead > 0) { f.dead--; if (f.dead === 0) respawn(g, f); f.prev = { ...inp }; return; }
  for (const k of ['invuln', 'cd', 'rcd', 'hitFlash', 'dropT', 'landT', 'talkCd', 'mark']) if (f[k] > 0) f[k]--;
  if (f.cd > f.cdMax) f.cdMax = f.cd;
  if (f.rcd > f.rcdMax) f.rcdMax = f.rcd;
  f.lastMoveT++; f.lastAttackerT++;
  const P = {}; for (const k of [...KEYS, 'down']) P[k] = inp[k] && !f.prev[k];
  f.prev = { ...inp };
  let key = KEYS.find((k) => P[k]);
  if (f.hitstun > 0) { if (--f.hitstun === 0) f.comboT = 30; physics(g, f, inp, 'stun'); return; }
  if (f.comboT > 0 && --f.comboT === 0) f.combo = 0;
  if (f.act) {
    if (key) f.buf = { k: key, t: 0 };
    else if (f.buf && ++f.buf.t > 7) f.buf = null;
    runAct(g, f, inp);
    physics(g, f, inp, f.act ? 'act' : 'free');
    return;
  }
  if (!key && f.buf) key = f.buf.k;
  f.buf = null;
  free(g, f, inp, key, P.down);
  physics(g, f, inp, f.act ? 'act' : 'free');
}

function free(g, f, inp, k, downPressed) {
  const d = f.def, dx = dirX(inp);
  if (f.freefall) return;
  if (k === 'dodge') {
    if (f.grounded) startAct(f, 'dodge', null, { total: 24, dir: dx });
    else if (!f.airDodge) { f.airDodge = true; startAct(f, 'dodge', null, { total: 26, air: true }); }
    g.events.push({ type: 'dodge' });
    return;
  }
  if (k === 'special') {
    if (inp.up && !f.recUsed) return doRecovery(g, f, dx);
    if (f.cd === 0) return startSpecial(g, f, inp, dx);
    g.events.push({ type: 'denied' });
    return;
  }
  if (k === 'shoot') {
    if (f.rcd === 0) { startRanged(g, f, dx); return; }
    g.events.push({ type: 'denied' });
    return;
  }
  if (k === 'attack' || k === 'heavy') {
    let name;
    if (f.grounded) name = k === 'heavy' ? 'heavy' : inp.up ? 'utilt' : 'jab';
    else name = inp.up ? 'uair' : inp.down ? 'dair' : 'fair';
    if (f.grounded && dx) f.facing = dx;
    const m = getMove(f, name);
    startAct(f, name, m);
    if (m.lunge) f.vx = f.facing * m.lunge;
    g.events.push({ type: 'swing', heavy: k === 'heavy' });
    return;
  }
  if (k === 'jump') {
    if (f.grounded) { f.vy = -d.jump; f.grounded = false; g.events.push({ type: 'jump' }); }
    else if (f.jumps > 0) {
      f.jumps--; f.vy = -d.dbl; if (dx) f.vx = dx * d.air;
      ring(g, f.x, f.y, '#14213D22', 14); g.events.push({ type: 'jump' });
    }
    return;
  }
  if (f.grounded && downPressed && Math.abs(f.y - g.stage.main.y) > 1) { f.dropT = 14; f.grounded = false; f.y += 1; }
}

function doRecovery(g, f, dx) {
  f.recUsed = true; f.grounded = false;
  if (dx) f.facing = dx;
  f.vx = dx * f.def.rec.vx; f.vy = f.def.rec.vy;
  startAct(f, 'rec', f.def.moves.rec, {});
  g.events.push({ type: 'special', id: 'rec' });
}

function runAct(g, f, inp) {
  const a = f.act;
  if (runSpecial(g, f, inp, g.fighters[1 - f.idx])) return;
  a.t++;
  const total = a.move ? a.move.startup + a.move.active + a.move.recovery : a.data.total;
  if (a.t >= total) {
    f.act = null;
    if (a.name === 'rec' && !f.grounded) f.freefall = true;
  }
}

function physics(g, f, inp, mode) {
  const d = f.def, dx = dirX(inp), a = f.act;
  if (f.hold > 0) {
    f.hold--;
    if (dx || inp.jump || inp.down || inp.attack || inp.heavy || inp.special) f.hold = 0;
    else { f.vx = 0; f.vy = 0; return; }
  }
  const sp = speedMul(f);
  const airSteer = (ac) => { if (dx) f.vx += Math.max(-ac, Math.min(ac, dx * d.air * sp - f.vx)); else f.vx *= 0.985; };
  if (mode === 'stun') f.vx *= f.grounded ? 0.86 : 0.975;
  else if (mode === 'free') {
    if (f.grounded) { f.vx += (dx * d.walk * sp - f.vx) * d.accel; if (dx) f.facing = dx; }
    else airSteer(d.airAccel * (f.freefall ? 0.5 : 1));
  } else if (!(a.data.noGrav || (a.name === 'dodge' && !a.data.air))) {
    if (f.grounded) f.vx *= 0.8; else airSteer(d.airAccel);
  }
  if (!f.grounded && !(a && a.data.noGrav)) {
    const fast = mode !== 'stun' && inp.down && f.vy > 0;
    f.vy += G * (fast ? 1.5 : 1);
    let cap = mode === 'stun' ? 22 : fast ? d.fall * 1.5 : d.fall;
    if (a && a.data.slow) cap = 2.5;
    if (f.vy > cap) f.vy = cap;
  }
  const py = f.y;
  f.x += f.vx; f.y += f.vy;
  collide(g, f, py);
}

function supportY(g, f) {
  const m = g.stage.main;
  if (Math.abs(f.y - m.y) < 1 && f.x > m.x - 6 && f.x < m.x + m.w + 6) return m.y;
  if (f.dropT > 0) return null;
  for (const p of g.stage.plats.concat(g.platforms)) if (Math.abs(f.y - p.y) < 1 && f.x > p.x - 4 && f.x < p.x + p.w + 4) return p.y;
  return null;
}

function collide(g, f, py) {
  const m = g.stage.main, hw = f.def.w / 2, h = f.def.h;
  if (f.grounded) {
    const top = supportY(g, f);
    if (top === null) f.grounded = false; else { f.y = top; f.vy = 0; }
    return;
  }
  if (f.vy >= 0) {
    if (f.x > m.x - 6 && f.x < m.x + m.w + 6 && py <= m.y + 0.5 && f.y >= m.y) return land(g, f, m.y);
    if (f.dropT === 0) for (const p of g.stage.plats.concat(g.platforms)) {
      if (f.x > p.x - 4 && f.x < p.x + p.w + 4 && py <= p.y + 0.5 && f.y >= p.y) return land(g, f, p.y);
    }
  }
  if (f.x + hw > m.x && f.x - hw < m.x + m.w && f.y > m.y + 1 && f.y - h < m.y + m.h) {
    if (py - h >= m.y + m.h - 2) { f.y = m.y + m.h + h; if (f.vy < 0) f.vy = f.hitstun > 0 ? -f.vy * 0.3 : 0; }
    else {
      const L = f.x - (m.x - hw), R = m.x + m.w + hw - f.x;
      f.x = L < R ? m.x - hw : m.x + m.w + hw;
      f.vx = f.hitstun > 0 ? -f.vx * 0.4 : 0;
    }
  }
}

function land(g, f, y) {
  f.y = y; f.vy = 0; f.grounded = true; f.jumps = f.def.jumps; f.recUsed = false; f.freefall = false; f.airDodge = false; f.landT = 6;
  if (f.act && ['fair', 'uair', 'dair', 'rec', 'dodge'].includes(f.act.name)) { f.act = null; f.landT = 8; }
  if (f.hitstun > 0) f.hitstun = Math.min(f.hitstun, 12);
  g.events.push({ type: 'land' });
}

function resolveHits(g) {
  const hits = [];
  for (const att of g.fighters) {
    const tgt = g.fighters[1 - att.idx];
    const hb = hitboxOf(att);
    if (!hb) continue;
    for (const dc of g.decoys) if (dc.owner !== att.idx && !dc.popped && overlap(hb, { x: dc.x - 24, y: dc.y - 56, w: 48, h: 56 })) popDecoy(g, dc);
    if (att.act.hit.has(tgt.idx) || tgt.dead || tgt.invuln > 0) continue;
    if (overlap(hb, hurtbox(tgt))) hits.push([att, tgt, att.act, hb]);
  }
  for (const [att, tgt, act, hb] of hits) {
    act.hit.add(tgt.idx);
    applyHit(g, att, tgt, act.move, act.name, att.facing, { x: hb.x + hb.w / 2, y: hb.y + hb.h / 2 });
  }
}

function checkKOs(g) {
  const b = g.stage.blast;
  const kod = g.fighters.filter((f) => !f.dead && (f.x < b.l || f.x > b.r || f.y > b.b || f.y < b.t));
  for (const f of kod) ko(g, f);
  if (!g.training && kod.length) {
    const alive = g.fighters.filter((f) => f.stocks > 0);
    if (alive.length === 0) g.over = { tie: true };
    else if (alive.length === 1) g.over = { winner: alive[0].idx };
  }
}

function ko(g, f) {
  if (!g.training) f.stocks--;
  f.stats.falls++;
  const k = f.lastAttackerT < 360 ? g.fighters[f.lastAttacker] : null;
  if (k && k !== f) { k.stats.kos++; talk(g, k, pick(k.def.lines.ko, g.frame), true); }
  else talk(g, f, pick(f.def.lines.fall, g.frame), true);
  const x = Math.max(30, Math.min(1250, f.x)), y = Math.max(-120, Math.min(800, f.y - 30));
  g.effects.push({ type: 'ko', x, y, ang: Math.atan2(400 - y, 640 - x), color: f.def.color, life: 40, max: 40 });
  sparks(g, x, y, f.def.color, 16, 9);
  g.shake = 20; g.hitstop = 8;
  f.dead = f.stocks > 0 || g.training ? 70 : 99999;
  f.act = null; f.hitstun = 0; f.vx = 0; f.vy = 0; f.mark = 0; f.combo = 0;
  g.events.push({ type: 'ko' });
}

function respawn(g, f) {
  const [x, y] = g.stage.respawn[f.idx];
  Object.assign(f, { x, y, vx: 0, vy: 0, damage: 0, grounded: false, invuln: 120, hold: 90, jumps: f.def.jumps, recUsed: false, freefall: false, act: null, stance: f.stance });
  ring(g, x, y - 30, f.def.color, 40);
}

export function resetFighters(g) {
  g.fighters.forEach((f, i) => {
    const [x, y] = g.stage.spawns[i];
    Object.assign(f, { x, y, vx: 0, vy: 0, damage: 0, grounded: true, act: null, hitstun: 0, dead: 0, hold: 0, invuln: 0, cd: 0, rcd: 0, mark: 0, facing: i === 0 ? 1 : -1 });
  });
  g.projectiles = []; g.platforms = []; g.decoys = [];
}