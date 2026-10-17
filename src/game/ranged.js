import { A } from './fighters';
import { sparks, ring, text, pick } from './fx';

// One long-range tool per fighter, tuned to its stats and personality.
// move: startup/recovery frame data (no hitbox: damage comes from the projectiles).
// shots: [frame offset after startup, projectile builder]. cd: cooldown in frames.
// ai: [min, max] horizontal distance at which the CPU likes to fire.
const P = (o) => ({ r: 10, life: 60, angle: 35, vx: 0, vy: 0, motion: 'straight', ...o });

export const RANGED = {
  // Patient: a slow, heavy reply that drifts to a stop and waits in the air.
  claude: {
    move: A(14, 1, 22, 0, 0, 0, 0, null), cd: 80, ai: [180, 420],
    shots: [[0, (d) => P({ type: 'reply', motion: 'decel', vx: d * 9.5, r: 16, life: 120, dmg: 9, base: 6, growth: 1.15, angle: 40 })]],
  },
  // Fast and light: two quick bolts, short cooldown.
  codex: {
    move: A(6, 1, 18, 0, 0, 0, 0, null), cd: 45, ai: [160, 560],
    shots: [
      [0, (d) => P({ type: 'autocomplete', vx: d * 15, r: 8, life: 46, dmg: 3, base: 3, growth: 0.35, angle: 20 })],
      [6, (d) => P({ type: 'autocomplete', vx: d * 15, r: 8, life: 46, dmg: 3, base: 3, growth: 0.35, angle: 20, dy: -10 })],
    ],
  },
  // Balanced: a medium chat bubble. A landed bubble sets up Iterate's Pivot dash.
  chatgpt: {
    move: A(9, 1, 16, 0, 0, 0, 0, null), cd: 60, ai: [170, 520],
    shots: [[0, (d) => P({ type: 'bubble', motion: 'wave', vx: d * 10, amp: 4, life: 70, r: 13, dmg: 6, base: 4.5, growth: 0.9 })]],
  },
  // Stance-dependent: Flash fires twin helix stars, Focus one big slow star.
  gemini: {
    move: A(8, 1, 15, 0, 0, 0, 0, null), focusMove: A(13, 1, 22, 0, 0, 0, 0, null), cd: 70, ai: [180, 540],
    shots: [[0, (d, f) => (f.stance === 'focus'
      ? P({ type: 'bigstar', vx: d * 8, r: 17, life: 90, dmg: 10, base: 6.5, growth: 1.2, angle: 38 })
      : [1, -1].map((s) => P({ type: 'star', motion: 'wave', vx: d * 12, amp: 16 * s, life: 55, r: 8, dmg: 3.5, base: 3.5, growth: 0.5, angle: 30 })))]],
  },
  // Reckless: a lobbed hot take that explodes on landing. Huge, slow, long recovery.
  grok: {
    move: A(16, 1, 26, 0, 0, 0, 0, null), cd: 110, ai: [230, 380],
    shots: [[0, (d) => P({ type: 'bomb', motion: 'arc', vx: d * 7.5, vy: -8, r: 12, life: 110, dmg: 14, base: 8, growth: 1.6, angle: 60, blast: 70 })]],
  },
  // Zoner: a fan of three citations. They home in on a marked foe.
  perplexity: {
    move: A(10, 1, 18, 0, 0, 0, 0, null), cd: 75, ai: [200, 640],
    shots: [[0, (d, f, opp) => [-1.6, 0, 1.6].map((vy, i) => P({ type: 'cite', vx: d * 13, vy, n: i + 1, r: 7, life: 58, dmg: 2.5, base: 3, growth: 0.3, angle: 25, homing: opp.mark > 0 }))]],
  },
  // Trickster: a flickering fake that flies out and curves back. Catch it to refund cooldown.
  hallucination: {
    move: A(8, 1, 14, 0, 0, 0, 0, null), cd: 70, ai: [110, 230],
    shots: [[0, (d) => P({ type: 'phantom', motion: 'boomerang', vx: d * 13, ax: -d * 0.4, r: 12, life: 72, dmg: 5, base: 4, growth: 0.8, angle: 40 })]],
  },
  // Glitch: a packet that blinks forward in jumps. Short range, pops foes upward.
  bug: {
    move: A(5, 1, 12, 0, 0, 0, 0, null), cd: 55, ai: [100, 300],
    shots: [[0, () => P({ type: 'packet', motion: 'blink', step: 42, every: 6, r: 10, life: 48, dmg: 4, base: 5, growth: 0.6, angle: 55 })]],
  },
};

export const rangedMove = (f) => {
  const R = RANGED[f.def.id];
  return f.def.id === 'gemini' && f.stance === 'focus' ? R.focusMove : R.move;
};

export function startRanged(g, f, dx) {
  if (f.grounded && dx) f.facing = dx;
  f.act = { name: 'ranged', t: 0, move: rangedMove(f), hit: new Set(), data: {} };
  f.rcd = RANGED[f.def.id].cd;
  if (f.grounded) f.vx *= 0.4;
}

// Runs every frame of the 'ranged' action.
export function runRanged(g, f, opp) {
  const a = f.act, R = RANGED[f.def.id];
  for (const [off, build] of R.shots) {
    if (a.t !== a.move.startup + off) continue;
    const made = [].concat(build(f.facing, f, opp));
    for (const p of made) {
      const y = f.y - f.def.h * 0.6 + (p.dy || 0);
      g.projectiles.push({ ...p, x: f.x + f.facing * (f.def.w / 2 + 6), y, y0: y, ph: 0, tick: 0, dir: f.facing, owner: f.idx, max: p.life });
    }
    sparks(g, f.x + f.facing * (f.def.w / 2 + 6), f.y - f.def.h * 0.6, f.def.accent, 4, 3);
    g.events.push({ type: 'shoot', id: f.def.id });
  }
}

// Per-type motion. Returns nothing; mutates the projectile.
export function moveProjectile(g, p) {
  switch (p.motion) {
    case 'decel':
      if (Math.abs(p.vx) > 0.35) p.vx *= 0.93; else p.vx = 0;
      break;
    case 'arc':
      p.vy = Math.min(14, p.vy + 0.45);
      break;
    case 'wave':
      p.ph += 0.22; p.y = p.y0 + Math.sin(p.ph) * p.amp; p.vy = 0;
      break;
    case 'boomerang': {
      const was = Math.sign(p.vx);
      p.vx += p.ax;
      if (!p.back && Math.sign(p.vx) !== was) { p.back = true; p.dir = -p.dir; }
      break;
    }
    case 'blink':
      p.vx = 0;
      if (++p.tick % p.every === 0) {
        p.x += p.dir * p.step; p.y += ((g.frame * 13) % 17) - 8;
        g.effects.push({ type: 'spark', x: p.x - p.dir * p.step * 0.5, y: p.y, vx: 0, vy: 0, life: 8, max: 8, color: '#3FD0E0', size: 6 });
      }
      break;
    default:
  }
  p.x += p.vx; p.y += p.vy;
}

// Boomerang returning to its thrower: a catch refunds half the cooldown.
export function tryCatch(g, p, owner) {
  if (p.motion !== 'boomerang' || !p.back || owner.dead) return false;
  if (Math.abs(p.x - owner.x) > 26 || Math.abs(p.y - (owner.y - owner.def.h / 2)) > owner.def.h / 2 + 8) return false;
  owner.rcd = Math.floor(owner.rcd / 2);
  text(g, owner.x, owner.y - owner.def.h - 20, pick(['as I said', 'called it', 'source: me'], g.frame), '#7B5CE0');
  ring(g, p.x, p.y, '#7B5CE0', 18);
  g.events.push({ type: 'catch' });
  return true;
}
