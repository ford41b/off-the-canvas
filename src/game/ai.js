import { blankInput } from './engine';
import { RANGED } from './ranged';

const DIFF = {
  easy: { react: 22, aggr: 0.35, def: 0.08, rec: 0.55, fool: 0.6 },
  normal: { react: 12, aggr: 0.6, def: 0.25, rec: 0.85, fool: 0.35 },
  hard: { react: 5, aggr: 0.85, def: 0.5, rec: 1, fool: 0.12 },
};

export const createBrain = (diff) => ({ diff, timer: 0, hold: blankInput(), charge: 0, r: 1234567, tick: 0 });
function rnd(b) { b.r = (b.r * 1103515245 + 12345) & 0x7fffffff; return b.r / 0x7fffffff; }

export function think(g, me, b, idle) {
  const out = blankInput();
  if (idle || me.dead || g.over) return out;
  const D = DIFF[b.diff], st = g.stage.main;
  if (b.charge > 0) { b.charge--; out.special = true; return out; }
  if (me.hitstun > 0) return out;
  const off = me.x < st.x - 4 || me.x > st.x + st.w + 4 || me.y > st.y + 4;
  if (off && !me.grounded) return recover(me, b, D, out, st);
  if (b.timer > 0) { b.timer--; return { ...out, ...b.hold }; }
  b.timer = D.react + Math.floor(rnd(b) * 4);
  b.hold = blankInput();
  decide(g, me, b, D, out, st);
  return { ...b.hold, ...out };
}

function recover(me, b, D, out, st) {
  const cx = st.x + st.w / 2;
  out[me.x < cx ? 'right' : 'left'] = true;
  b.tick++;
  if (me.freefall || (rnd(b) > D.rec && b.tick % 3)) return out;
  const below = me.y > st.y - 10;
  if (me.jumps > 0 && me.vy > -1 && below) { if (!me.prev.jump) out.jump = true; return out; }
  if (me.def.id === 'codex' && me.cd === 0 && me.vy > 0 && below) { if (!me.prev.special) out.special = true; return out; }
  if (!me.recUsed && me.vy > 0 && (below || Math.abs(me.x - cx) > st.w / 2 + 120)) { out.up = true; if (!me.prev.special) out.special = true; }
  return out;
}

function decide(g, me, b, D, out, st) {
  const h = b.hold, opp = g.fighters[1 - me.idx];
  let tx = opp.x, ty = opp.y;
  const dec = g.decoys.find((d) => d.owner !== me.idx && !d.popped);
  if (dec) { if (b.seen !== dec) { b.seen = dec; b.fooled = rnd(b) < D.fool; } if (b.fooled) { tx = dec.x; ty = dec.y; } }
  const dx = tx - me.x, adx = Math.abs(dx), dy = ty - me.y, dirT = Math.sign(dx) || me.facing;
  const id = me.def.id, R = rnd(b);
  const oppOff = opp.dead || opp.x < st.x || opp.x > st.x + st.w;
  const move = (d) => {
    if (oppOff && ((d < 0 && me.x < st.x + 50) || (d > 0 && me.x > st.x + st.w - 50))) return;
    h[d < 0 ? 'left' : 'right'] = true;
  };
  const face = () => { if (me.facing !== dirT) { move(dirT); return false; } return true; };

  const threat = opp.act && opp.act.move && opp.act.t <= opp.act.move.startup && Math.abs(opp.x - me.x) < 130 && Math.abs(opp.y - me.y) < 90;
  const proj = g.projectiles.find((p) => p.owner !== me.idx && Math.abs(p.x - me.x) < 150 && Math.sign(me.x - p.x) === (Math.sign(p.vx) || p.dir));
  if ((threat || proj) && rnd(b) < D.def) {
    if (id === 'claude' && me.cd === 0) { out.special = true; return; }
    if (id === 'bug' && me.cd === 0 && R < 0.5) { h[dirT > 0 ? 'left' : 'right'] = true; out.special = true; return; }
    if (proj && R < 0.5) { out.jump = true; return; }
    out.dodge = true; if (me.grounded) h[dirT > 0 ? 'left' : 'right'] = true; return;
  }
  if (opp.dead) { move(Math.sign(640 - me.x)); return; }
  if (me.cd === 0) {
    if (id === 'chatgpt' && me.lastMoveT < 35) { out.special = true; return; }
    if (id === 'gemini' && ((opp.damage > 75 && me.stance === 'flash') || (opp.damage < 35 && me.stance === 'focus' && R < 0.4))) { out.special = true; return; }
    if (id === 'perplexity' && opp.mark === 0 && adx > 140 && adx < 560 && Math.abs(dy) < 70 && R < 0.5) { if (face()) out.special = true; return; }
    if (id === 'hallucination' && adx > 120 && adx < 380 && R < 0.35) { if (face()) { if (R < 0.15) h.down = true; out.special = true; } return; }
    if (id === 'bug' && adx > 220 && R < 0.25) { h[dirT > 0 ? 'right' : 'left'] = true; out.special = true; return; }
    if (id === 'grok' && adx < 230 && adx > 60 && me.grounded && R < D.aggr * 0.35) {
      if (face()) { out.special = true; b.charge = Math.round(b.diff === 'hard' ? 15 + Math.min(55, opp.damage * 0.6) : 15 + rnd(b) * 50); }
      return;
    }
  }
  const rg = RANGED[id].ai;
  if (me.rcd === 0 && adx > rg[0] && adx < rg[1] && Math.abs(dy) < 90 && R < 0.3 + D.aggr * 0.25) { if (face()) out.shoot = true; return; }
  if (id === 'perplexity' && adx > 150 && adx < 600 && Math.abs(dy) < 60 && me.grounded && R < 0.55) { if (face()) out.heavy = true; return; }
  if (id === 'perplexity' && adx < 130 && R < 0.5) { move(-dirT); if (R < 0.25) out.jump = true; return; }
  if (dy < -70 && adx < 140) {
    if (me.grounded) { out.jump = true; move(dirT); return; }
    if (me.jumps > 0 && me.vy > 0 && R < 0.5) { out.jump = true; return; }
  }
  if (!me.grounded && adx < 80 && Math.abs(dy) < 90 && R < D.aggr) {
    if (dy < -30) h.up = true; else if (dy > 30) h.down = true;
    out.attack = true; move(dirT); return;
  }
  const jab = me.def.moves.jab.box;
  const reach = jab[0] + jab[2] / 2 + opp.def.w / 2 - 4;
  if (adx > reach) { move(dirT); if (me.grounded && R < 0.04) out.jump = true; return; }
  if (Math.abs(dy) > 50) { move(dirT); return; }
  if (R < D.aggr) {
    h[dirT > 0 ? 'right' : 'left'] = true;
    if ((opp.damage > 85 && R < 0.5) || R < D.aggr * 0.25) out.heavy = true; else out.attack = true;
    return;
  }
  if (R < 0.85) { out.dodge = true; h[dirT > 0 ? 'left' : 'right'] = true; } else move(-dirT);
}