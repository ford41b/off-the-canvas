import { A } from './fighters';
import { startAct, spawnProjectile } from './combat';
import { runRanged } from './ranged';
import { burst, ghost, ring, sparks, talk, text, pick } from './fx';

const ITER = {
  lift: A(4, 5, 14, 6, 6, 1.0, 88, [18, -62, 62, 62]),
  pivot: A(5, 6, 16, 7, 6, 1.2, 25, [30, -30, 58, 42]),
  rewrite: A(6, 4, 16, 8, 3, 1.1, -65, [24, -14, 58, 44]),
  draft: A(6, 8, 16, 7, 5, 1.1, 55, [0, -32, 96, 58]),
};
const ITER_FROM = { jab: 'lift', utilt: 'lift', heavy: 'pivot', bubble: 'pivot', fair: 'rewrite', uair: 'rewrite', dair: 'rewrite' };
export const ITER_LABEL = { lift: '↑ LIFT', pivot: '→ PIVOT', rewrite: '↓ REWRITE', draft: '◎ DRAFT' };
export const iterVariant = (f) => (f.lastMoveT < 50 && ITER_FROM[f.lastMove]) || 'draft';

const rare = (g, f) => (g.frame * 7 + f.idx * 3) % 10 < 3;

export function startSpecial(g, f, inp, dx) {
  const id = f.def.id;
  if (id === 'claude') { startAct(f, 'counter', null, { total: 36 }); f.cd = 50; }
  else if (id === 'codex') { startAct(f, 'patch', null, { total: 14 }); f.cd = 360; }
  else if (id === 'chatgpt') {
    const v = iterVariant(f);
    startAct(f, 'iter', ITER[v], { variant: v });
    if (v === 'pivot') f.vx = f.facing * 11;
    if (v === 'lift' && !f.grounded) f.vy = Math.min(f.vy, -4);
    f.cd = 40; f.lastMoveT = 999;
    text(g, f.x, f.y - f.def.h - 24, ITER_LABEL[v], f.def.accent);
  } else if (id === 'gemini') { startAct(f, 'switch', null, { total: 18 }); f.cd = 45; }
  else if (id === 'grok') { startAct(f, 'charge', null, { total: 9999, c: 0 }); }
  else if (id === 'perplexity') { startAct(f, 'mark', null, { total: 22 }); f.cd = 110; }
  else if (id === 'hallucination') { startAct(f, 'decoy', null, { total: 20, stay: inp.down }); f.cd = 130; }
  else if (id === 'bug') {
    let gx = dx, gy = inp.down ? 1 : 0;
    if (!gx && !gy) gx = f.facing;
    const n = Math.hypot(gx, gy);
    startAct(f, 'glitch', null, { total: 24, gx: gx / n, gy: gy / n });
    f.cd = 90;
  }
  g.events.push({ type: 'special', id });
  if (id !== 'claude' && rare(g, f)) talk(g, f, pick(f.def.lines.special, g.frame));
}

// Runs every frame of a special action. Returns true if it replaced the action.
export function runSpecial(g, f, inp, opp) {
  const a = f.act, d = a.data;
  switch (a.name) {
    case 'dodge':
      if (a.t >= 3 && a.t < 17) f.invuln = Math.max(f.invuln, 1);
      if (!d.air && a.t < 14) f.vx = (d.dir || 0) * 7 * (1 - a.t / 14);
      if (d.air) f.vx *= 0.9;
      break;
    case 'counter':
      if (a.t === 3) ring(g, f.x, f.y - 28, f.def.color, 26);
      break;
    case 'patch':
      if (a.t === 4) {
        const air = !f.grounded;
        const p = { x: (air ? f.x : f.x + f.facing * 80) - 60, y: air ? f.y + 26 : f.y - 95, w: 120, life: 220, max: 220, temp: true, owner: f.idx };
        g.platforms = g.platforms.filter((q) => q.owner !== f.idx);
        g.platforms.push(p);
        if (air) f.vy = Math.min(f.vy, 2);
        sparks(g, p.x + 60, p.y, '#3FD0E0', 10, 5);
        text(g, p.x + 60, p.y - 18, pick(['patch applied ✓', 'hotfix deployed', 'tests: skipped'], g.frame), '#2F5BEA');
      }
      break;
    case 'switch':
      if (a.t === d.total - 1) {
        f.stance = f.stance === 'focus' ? 'flash' : 'focus';
        ring(g, f.x, f.y - 30, f.stance === 'focus' ? '#7B5CE0' : '#3FD0E0', 34);
        text(g, f.x, f.y - f.def.h - 22, f.stance.toUpperCase(), f.stance === 'focus' ? '#7B5CE0' : '#3FD0E0');
      }
      break;
    case 'charge': {
      d.c++; d.total = a.t + 5; d.slow = true;
      if (a.t % 14 === 0) g.events.push({ type: 'charge', level: d.c / 90 });
      if (a.t % 6 === 0) sparks(g, f.x, f.y - 30, '#E23D3D', 2, 2 + d.c / 20);
      if (!inp.special || d.c >= 90) {
        const c = d.c / 90;
        startAct(f, 'unfiltered', A(5, 6, 30, Math.round(9 + c * 12), 7 + c * 3, 1.35 + c, 35, [58, -36, 104, 62]), {});
        f.cd = 70; f.vx = f.facing * (3 + c * 5);
        g.events.push({ type: 'special', id: 'grok2' });
        if (c > 0.9) talk(g, f, pick(f.def.lines.special, g.frame));
        return true;
      }
      break;
    }
    case 'mark':
      if (a.t === 6) spawnProjectile(g, f, 'marker', null, opp);
      break;
    case 'decoy':
      if (a.t === 3) {
        g.decoys = g.decoys.filter((q) => q.owner !== f.idx);
        if (d.stay) {
          g.decoys.push({ x: f.x, y: f.y, facing: f.facing, vx: 0, life: 70, owner: f.idx, id: f.def.id });
          f.vx = -f.facing * 8; f.vy = -7; f.grounded = false; ghost(g, f, '#E8684A');
        } else {
          g.decoys.push({ x: f.x, y: f.y, facing: f.facing, vx: f.facing * 9, life: 45, owner: f.idx, id: f.def.id });
        }
      }
      break;
    case 'glitch':
      d.noGrav = a.t < 12;
      if (a.t >= 3 && a.t <= 6) {
        f.vx = d.gx * 30; f.vy = d.gy * 30; f.invuln = Math.max(f.invuln, 1);
        ghost(g, f, a.t % 2 ? '#3FD0E0' : '#E8684A');
      } else if (a.t < 12) { f.vx = 0; f.vy = 0; }
      if (a.t === 7) burst(g, f.x, f.y - 22, '#3FD0E0', 22);
      break;
    case 'ranged':
      runRanged(g, f, opp);
      break;
    case 'rec':
      if (a.t < 10 && a.t % 3 === 0) ghost(g, f, f.def.accent);
      break;
    default:
  }
  if (a.move && a.move.projectile && a.t === a.move.startup) spawnProjectile(g, f, 'lens', a.move, opp);
  return false;
}