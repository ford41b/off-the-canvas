export function sparks(g, x, y, color, n = 8, sp = 6) {
  if (g.reduced) n = Math.ceil(n / 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + g.frame * 0.37;
    const k = 0.6 + ((i * 37) % 10) / 20;
    g.effects.push({ type: 'spark', x, y, vx: Math.cos(a) * sp * k, vy: Math.sin(a) * sp * k, life: 18, max: 18, color, size: 3 + (i % 3) });
  }
}
export const burst = (g, x, y, color, size) => g.effects.push({ type: 'burst', x, y, color, size, life: 10, max: 10, rot: g.frame * 0.7 });
export const ring = (g, x, y, color, r) => g.effects.push({ type: 'ring', x, y, color, r, life: 16, max: 16 });
export const ghost = (g, f, color) => g.effects.push({ type: 'ghost', x: f.x, y: f.y, facing: f.facing, id: f.def.id, color, life: 14, max: 14 });
export const text = (g, x, y, str, color) => g.effects.push({ type: 'text', x, y, vx: 0, vy: -0.6, str, color, life: 60, max: 60 });

export function updateEffects(g) {
  for (const e of g.effects) {
    e.life--;
    if (e.vx !== undefined) { e.x += e.vx; e.y += e.vy; e.vx *= 0.92; e.vy *= 0.92; }
  }
  g.effects = g.effects.filter((e) => e.life > 0);
  for (const b of g.bubbles) b.life--;
  g.bubbles = g.bubbles.filter((b) => b.life > 0);
}

export function talk(g, f, str, force) {
  if (!g.banter || !str) return;
  if (!force && f.talkCd > 0) return;
  f.talkCd = 420;
  g.bubbles = g.bubbles.filter((b) => b.i !== f.idx);
  g.bubbles.push({ i: f.idx, text: str, life: 120 });
}
export const pick = (arr, n) => arr[Math.abs(n) % arr.length];