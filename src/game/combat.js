import { burst, ring, sparks, text, talk, pick } from './fx';
import { moveProjectile, tryCatch } from './ranged';

export const startAct = (f, name, move, data = {}) => { f.act = { name, t: 0, move, hit: new Set(), data }; };
export const hurtbox = (f) => ({ x: f.x - f.def.w / 2, y: f.y - f.def.h, w: f.def.w, h: f.def.h });
export const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function hitboxOf(f) {
  const a = f.act;
  if (!a || !a.move || !a.move.box) return null;
  const m = a.move;
  if (a.t < m.startup || a.t >= m.startup + m.active) return null;
  const [bx, by, bw, bh] = m.box;
  const cx = f.x + bx * f.facing, cy = f.y + by;
  return { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh };
}

export const isCountering = (f) => f.act && f.act.name === 'counter' && f.act.t >= 3 && f.act.t <= 20;

export function applyHit(g, att, tgt, m, name, dir, pt) {
  if (isCountering(tgt)) { triggerCounter(g, tgt, att, m); return; }
  const staleN = att.stale.filter((s) => s === name).length;
  att.stale.push(name); if (att.stale.length > 5) att.stale.shift();
  const dmg = Math.round(m.dmg * (1 - 0.08 * staleN) * 10) / 10;
  tgt.damage = Math.min(999, tgt.damage + dmg);
  let kb = (m.base + tgt.damage * m.growth * 0.06 + dmg * 0.15) * (100 / tgt.def.weight);
  const ang = (m.angle * Math.PI) / 180;
  let vx = Math.cos(ang) * kb * dir, vy = -Math.sin(ang) * kb;
  if (tgt.grounded && vy > 0) vy = -vy * 0.6;
  tgt.vx = vx; tgt.vy = vy;
  if (vy < 0) tgt.grounded = false;
  tgt.combo++; tgt.hitFlash = 6;
  if (tgt.combo > att.stats.maxCombo) att.stats.maxCombo = tgt.combo;
  let hs = Math.min(55, Math.round(kb * 2.1));
  if (tgt.combo > 3) hs = Math.round(hs * 0.6); // combo decay prevents locks
  tgt.hitstun = Math.max(6, hs);
  tgt.act = null; tgt.freefall = false; tgt.recUsed = false; tgt.buf = null; tgt.hold = 0;
  tgt.lastAttacker = att.idx; tgt.lastAttackerT = 0;
  att.lastMove = name; att.lastMoveT = 0; att.stats.dealt += dmg;
  g.hitstop = Math.min(12, Math.round(3 + dmg * 0.45));
  if (kb > 11) g.shake = Math.min(18, kb * 0.7);
  const px = pt ? pt.x : tgt.x, py = pt ? pt.y : tgt.y - tgt.def.h / 2;
  burst(g, px, py, att.def.color, 18 + kb * 1.4);
  sparks(g, px, py, att.def.accent, kb > 14 ? 12 : 6, 4 + kb * 0.3);
  if (kb > 16) ring(g, px, py, att.def.color, 30);
  g.events.push({ type: 'hit', power: kb });
}

function triggerCounter(g, cl, att, m) {
  const dmg = Math.min(22, m.dmg * 1.3 + 5);
  cl.facing = att.x > cl.x ? 1 : -1;
  startAct(cl, 'counterhit', null, { total: 22 });
  cl.invuln = Math.max(cl.invuln, 10);
  applyHit(g, cl, att, { dmg, base: 8, growth: 1.5, angle: 40 }, 'counter', cl.facing);
  g.hitstop = 14;
  ring(g, cl.x, cl.y - 28, '#FFFFFF', 40);
  ring(g, cl.x, cl.y - 28, cl.def.color, 60);
  g.events.push({ type: 'counter' });
  talk(g, cl, pick(cl.def.lines.special, g.frame), true);
}

export function spawnProjectile(g, f, type, m, opp) {
  const y = f.y - 34;
  const base = { x: f.x + f.facing * 30, y, y0: y, vy: 0, owner: f.idx, dir: f.facing, type, motion: 'straight', angle: 30, ph: 0, tick: 0 };
  if (type === 'marker') g.projectiles.push({ ...base, vx: f.facing * 8, life: 80, max: 80, r: 9, dmg: 2, base: 2, growth: 0.1 });
  else g.projectiles.push({ ...base, vx: f.facing * 11, life: 60, max: 60, r: 13, dmg: m.dmg, base: m.base, growth: m.growth, angle: m.angle, homing: opp.mark > 0 });
}

export function popDecoy(g, dc) {
  dc.popped = true; dc.life = Math.min(dc.life, 10);
  text(g, dc.x, dc.y - 70, pick(['Nope.', 'Not real.', '?'], g.frame), '#7B5CE0');
  sparks(g, dc.x, dc.y - 28, '#7B5CE0', 8, 4);
  g.events.push({ type: 'pop' });
}

const touches = (p, box) => {
  const cx = Math.max(box.x, Math.min(p.x, box.x + box.w)), cy = Math.max(box.y, Math.min(p.y, box.y + box.h));
  return (cx - p.x) ** 2 + (cy - p.y) ** 2 <= p.r * p.r;
};

// Grok's bomb: area hit around the blast point, big feedback.
function explode(g, p) {
  p.life = 0;
  const t = g.fighters[1 - p.owner];
  if (!t.dead && t.invuln <= 0) {
    const hb = hurtbox(t);
    if (touches({ x: p.x, y: p.y, r: p.blast }, hb)) applyHit(g, g.fighters[p.owner], t, p, p.type, Math.sign(t.x - p.x) || p.dir, { x: Math.max(hb.x, Math.min(p.x, hb.x + hb.w)), y: Math.max(hb.y, Math.min(p.y, hb.y + hb.h)) });
  }
  burst(g, p.x, p.y, '#E23D3D', 46);
  burst(g, p.x, p.y, '#26282F', 26);
  ring(g, p.x, p.y, '#E23D3D', p.blast * 0.6);
  sparks(g, p.x, p.y, '#E23D3D', 12, 8);
  if (p.y < 760) g.shake = Math.max(g.shake, 10);
  g.events.push({ type: 'boom' });
}

function groundAt(g, p) {
  const m = g.stage.main;
  if (p.x > m.x && p.x < m.x + m.w && p.y >= m.y && p.y < m.y + m.h) return true;
  return g.stage.plats.concat(g.platforms).some((q) => p.vy > 0 && p.x > q.x && p.x < q.x + q.w && p.y >= q.y && p.y < q.y + 14);
}

function clash(g) {
  const ps = g.projectiles;
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const a = ps[i], b = ps[j];
    if (a.owner === b.owner || a.life <= 0 || b.life <= 0) continue;
    if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 > (a.r + b.r) ** 2) continue;
    for (const p of [a, b]) { if (p.blast) explode(g, p); else p.life = 0; }
    sparks(g, (a.x + b.x) / 2, (a.y + b.y) / 2, '#FFFFFF', 8, 5);
    ring(g, (a.x + b.x) / 2, (a.y + b.y) / 2, '#14213D', 16);
    g.events.push({ type: 'clash' });
  }
}

export function updateProjectiles(g) {
  for (const p of g.projectiles) {
    if (p.life <= 0) continue;
    p.life--;
    const t = g.fighters[1 - p.owner], owner = g.fighters[p.owner];
    if (p.homing && !t.dead) {
      const dy = t.y - t.def.h / 2 - p.y;
      p.vy = Math.max(-3.5, Math.min(3.5, p.vy + Math.sign(dy) * 0.3));
    }
    moveProjectile(g, p);
    if (tryCatch(g, p, owner)) { p.life = 0; continue; }
    if (p.blast && (p.life === 0 || groundAt(g, p))) { explode(g, p); continue; }
    for (const dc of g.decoys) if (dc.owner !== p.owner && !dc.popped && touches(p, { x: dc.x - 24, y: dc.y - 56, w: 48, h: 56 })) popDecoy(g, dc);
    if (t.dead || t.invuln > 0 || !touches(p, hurtbox(t))) continue;
    if (isCountering(t)) { // Claude reflects projectiles
      p.owner = t.idx; p.dir = t.facing; p.vx = t.facing * Math.max(9, Math.abs(p.vx) * 1.3); p.dmg *= 1.3;
      p.homing = false; p.life = 60; p.max = 60; p.motion = p.blast ? 'arc' : 'straight'; if (p.blast) p.vy = -7;
      ring(g, p.x, p.y, t.def.color, 24); g.events.push({ type: 'counter' });
      continue;
    }
    if (p.blast) { explode(g, p); continue; }
    applyHit(g, owner, t, p, p.type, Math.sign(t.x - p.x) || p.dir, { x: p.x, y: p.y });
    if (p.type === 'marker') { t.mark = 300; text(g, t.x, t.y - t.def.h - 20, '[source found]', '#12A39A'); }
    else if (p.type === 'lens' && p.homing) t.mark = 0;
    p.life = 0;
  }
  clash(g);
  g.projectiles = g.projectiles.filter((p) => p.life > 0 && p.x > -300 && p.x < 1600 && p.y < 1100);
}
