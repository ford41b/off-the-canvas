import { C, W, H } from './palette';
import { drawBody, drawTinted, drawShadow, poseOf, idlePose } from './bodies';
import { hitboxOf, hurtbox } from './combat';
import { drawHUD } from './hud';
import { fighterDef } from './engine';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function camera(g, reduced) {
  const alive = g.fighters.filter((f) => !f.dead);
  let tx = 640, ty = 400, tz = 1;
  if (alive.length && !reduced) {
    const xs = alive.map((f) => f.x), ys = alive.map((f) => f.y - 30);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    tx = clamp((minx + maxx) / 2, 500, 780); ty = clamp((miny + maxy) / 2 + 40, 330, 450);
    tz = clamp(Math.min(W / (maxx - minx + 760), H / (maxy - miny + 480)), 0.78, 1.1);
  }
  g.cam.x += (tx - g.cam.x) * 0.08; g.cam.y += (ty - g.cam.y) * 0.08; g.cam.z += (tz - g.cam.z) * 0.05;
  return g.cam;
}

function groundY(g, f) {
  let best = null;
  for (const q of [g.stage.main, ...g.stage.plats, ...g.platforms]) {
    if (f.x > q.x - 4 && f.x < q.x + q.w + 4 && q.y >= f.y - 1 && (best === null || q.y < best)) best = q.y;
  }
  return best;
}

const ink = (ctx, w) => { ctx.strokeStyle = C.ink; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; };
function star4(ctx, r) {
  const k = r * 0.25;
  ctx.beginPath(); ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(k, -k, r, 0); ctx.quadraticCurveTo(k, k, 0, r);
  ctx.quadraticCurveTo(-k, k, -r, 0); ctx.quadraticCurveTo(-k, -k, 0, -r); ctx.closePath();
}
function trail(ctx, p, color) {
  ctx.save(); ctx.globalAlpha *= 0.25; ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(-p.vx * 1.6, -p.vy * 1.6, p.r * 0.9, 0, 7); ctx.fill();
  ctx.globalAlpha *= 0.5; ctx.beginPath(); ctx.arc(-p.vx * 3, -p.vy * 3, p.r * 0.7, 0, 7); ctx.fill(); ctx.restore();
}

// Each fighter's projectile has its own silhouette, readable at gameplay distance.
function drawProjectile(ctx, g, p) {
  const t = g.frame, still = g.reduced;
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.globalAlpha = Math.min(1, p.life / 12);
  switch (p.type) {
    case 'marker':
      ctx.rotate(t * 0.2); ctx.fillStyle = C.teal; ink(ctx, 2); ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(9, 0); ctx.lineTo(0, 9); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    case 'reply': { // Claude: an asterisk that slows to a hover and pulses while it waits
      const hover = p.vx === 0, s = hover && !still ? 1 + Math.sin(t * 0.25) * 0.08 : 1;
      if (hover) { ctx.fillStyle = 'rgba(232,104,74,0.18)'; ctx.beginPath(); ctx.arc(0, 0, p.r + 8, 0, 7); ctx.fill(); }
      ctx.rotate(still ? 0 : t * (hover ? 0.03 : 0.12)); ctx.scale(s, s);
      ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 4; ctx.moveTo(Math.cos(a) * p.r, Math.sin(a) * p.r); ctx.lineTo(-Math.cos(a) * p.r, -Math.sin(a) * p.r); }
      ink(ctx, 10); ctx.stroke(); ctx.strokeStyle = C.coral; ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ctx.fill();
      break;
    }
    case 'autocomplete': // Codex: a pill-shaped bolt with chevrons
      trail(ctx, p, C.cyan); ctx.scale(p.dir, 1);
      ctx.fillStyle = C.cobalt; ink(ctx, 2.5); ctx.beginPath(); ctx.roundRect(-14, -7, 28, 14, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = C.cyan; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-6, -3.5); ctx.lineTo(-2, 0); ctx.lineTo(-6, 3.5); ctx.moveTo(1, -3.5); ctx.lineTo(5, 0); ctx.lineTo(1, 3.5); ctx.stroke();
      break;
    case 'bubble': // ChatGPT: a chat bubble with a typing indicator
      ctx.scale(p.dir, 1);
      ctx.fillStyle = '#FFFFFF'; ink(ctx, 3);
      ctx.beginPath(); ctx.roundRect(-p.r - 3, -p.r + 1, p.r * 2 + 6, p.r * 2 - 2, 9); ctx.moveTo(-8, p.r - 2); ctx.lineTo(-13, p.r + 6); ctx.lineTo(-2, p.r - 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.green; [-7, 0, 7].forEach((x, i) => { ctx.beginPath(); ctx.arc(x, still ? 0 : Math.sin(t * 0.3 - i) * 1.5, 2.6, 0, 7); ctx.fill(); });
      break;
    case 'star': // Gemini Flash: small twin stars
      trail(ctx, p, C.cyan); ctx.rotate(still ? 0 : t * 0.2);
      star4(ctx, p.r + 3); ctx.fillStyle = C.cyan; ink(ctx, 2); ctx.fill(); ctx.stroke();
      break;
    case 'bigstar': // Gemini Focus: one heavy split star
      ctx.rotate(still ? 0 : t * 0.08);
      star4(ctx, p.r + 4); ctx.save(); ctx.clip(); ctx.fillStyle = C.cobalt; ctx.fillRect(-30, -30, 30, 60); ctx.fillStyle = C.violet; ctx.fillRect(0, -30, 30, 60); ctx.restore();
      ink(ctx, 3); ctx.stroke(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 7); ctx.fill();
      break;
    case 'bomb': { // Grok: a lit hot take
      ctx.rotate(still ? 0 : t * 0.15 * p.dir);
      ctx.fillStyle = C.charcoal; ink(ctx, 3); ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(6, 2); ctx.stroke();
      ink(ctx, 2.5); ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.quadraticCurveTo(4, -p.r - 6, 2, -p.r - 9); ctx.stroke();
      if (still || t % 6 < 4) { ctx.fillStyle = t % 4 < 2 ? C.red : '#FFC24A'; ctx.beginPath(); ctx.arc(2, -p.r - 10, 3.5, 0, 7); ctx.fill(); }
      break;
    }
    case 'cite': // Perplexity: numbered citations
      trail(ctx, p, C.teal);
      ctx.fillStyle = p.homing ? C.teal : '#FFFFFF'; ink(ctx, 2); ctx.beginPath(); ctx.roundRect(-9, -8, 18, 16, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = p.homing ? '#FFFFFF' : C.teal; ctx.font = '700 10px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(p.n), 0, 0.5);
      break;
    case 'phantom': { // Hallucination: a flickering, spinning question
      ctx.globalAlpha *= still ? 0.85 : 0.55 + Math.abs(Math.sin(t * 0.35)) * 0.45;
      ctx.rotate(still ? 0 : t * 0.25 * p.dir);
      [[C.cyan, -2], [C.coral, 2]].forEach(([c, o]) => { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(o, 0, p.r, 0, 7); ctx.stroke(); });
      ctx.fillStyle = C.violet; ctx.beginPath(); ctx.arc(0, 0, p.r - 2, 0, 7); ctx.fill();
      ctx.setLineDash([4, 3]); ink(ctx, 2); ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#FFFFFF'; ctx.font = '700 14px "Space Grotesk", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 1);
      break;
    }
    case 'packet': { // Bug: a cluster of pixels that blinks forward
      const j = still ? 0 : ((t * 7) % 5) - 2;
      [[-7, -7, C.cyan], [1, -7, C.violet], [-7, 1, C.violet], [1, 1, C.coral]].forEach(([x, y, c], i) => {
        ctx.fillStyle = c; ctx.fillRect(x + (i % 2 ? j : 0), y, 7, 7); ink(ctx, 1.5); ctx.strokeRect(x + (i % 2 ? j : 0), y, 7, 7);
      });
      break;
    }
    default: // lens
      trail(ctx, p, C.cyan);
      ctx.fillStyle = p.homing ? C.teal : C.cyan; ink(ctx, 3); ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(-3, -3, 3, 0, 7); ctx.fill();
  }
  ctx.restore();
}

function drawStage(ctx, g) {
  const m = g.stage.main;
  ctx.fillStyle = 'rgba(20,33,61,0.07)';
  for (let x = -320; x < 1640; x += 64) for (let y = -320; y < 1100; y += 64) ctx.fillRect(x, y, 2.5, 2.5);
  ctx.fillStyle = 'rgba(20,33,61,0.1)'; ctx.beginPath(); ctx.roundRect(m.x + 10, m.y + 12, m.w, m.h, 12); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(m.x, m.y, m.w, m.h, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.coral; ctx.fillRect(m.x + 24, m.y + m.h - 14, 60, 4); ctx.fillStyle = C.cobalt; ctx.fillRect(m.x + m.w - 84, m.y + m.h - 14, 60, 4);
  for (const p of g.stage.plats) {
    ctx.fillStyle = 'rgba(20,33,61,0.1)'; ctx.fillRect(p.x + 6, p.y + 6, p.w, 10);
    ctx.fillStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, 10, 5); ctx.fill(); ctx.stroke();
  }
  for (const p of g.platforms) {
    if (p.life < 50 && Math.floor(p.life / 5) % 2) continue;
    ctx.save(); ctx.shadowColor = C.cyan; ctx.shadowBlur = 16; ctx.fillStyle = 'rgba(47,91,234,0.85)'; ctx.strokeStyle = C.cyan; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, 12, 3); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = C.cyan; ctx.font = '600 9px "JetBrains Mono", monospace'; ctx.fillText('{ patch }', p.x + 36, p.y + 9);
  }
}

function swoosh(ctx, f) {
  const hb = hitboxOf(f);
  if (!hb) return;
  const m = f.act.move, cx = hb.x + hb.w / 2, cy = hb.y + hb.h / 2;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(f.facing, 1); ctx.rotate((-m.angle * Math.PI) / 180);
  ctx.beginPath(); ctx.ellipse(0, 0, hb.w / 2, hb.h / 2, 0, -1.3, 1.3);
  ctx.lineCap = 'round'; ctx.strokeStyle = f.def.color; ctx.lineWidth = 9; ctx.globalAlpha = 0.85; ctx.stroke();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
}

function drawFighter(ctx, g, f) {
  if (f.dead) return;
  const p = poseOf(f, g.frame);
  let alpha = 1;
  if (f.act?.name === 'dodge' && f.invuln > 0) alpha = 0.4;
  else if (f.invuln > 0 && Math.floor(g.frame / 4) % 2) alpha = 0.55;
  const gy = groundY(g, f);
  if (gy !== null && gy - f.y < 240) drawShadow(ctx, f.x, gy, f.def.w, gy - f.y);
  if (f.hold > 0) { ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.roundRect(f.x - 30, f.y + 3, 60, 5, 2.5); ctx.fill(); }
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(f.x + (p.shake || 0), f.y - p.bob);
  ctx.scale(f.facing, 1); ctx.rotate(p.lean * 0.35); ctx.scale(p.sx, p.sy);
  if (f.hitFlash > 3) drawTinted(ctx, f.def.id, p, '#FFFFFF', 0.85); else drawBody(ctx, f.def.id, p);
  ctx.restore();
  const a = f.act, cy = f.y - f.def.h / 2;
  if (a?.name === 'ranged' && a.t < a.move.startup) {
    const k = a.t / a.move.startup, mx = f.x + f.facing * (f.def.w / 2 + 6), my = f.y - f.def.h * 0.6;
    ctx.save(); ctx.strokeStyle = f.def.accent; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.4 + k * 0.6;
    ctx.beginPath(); ctx.arc(mx, my, 4 + 12 * (1 - k), 0, 7); ctx.stroke(); ctx.restore();
  }
  if (a?.name === 'counter' && a.t >= 3 && a.t <= 20) {
    ctx.save(); ctx.strokeStyle = g.frame % 4 < 2 ? C.coral : '#FFFFFF'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(f.x, cy - 46); ctx.lineTo(f.x + 44, cy); ctx.lineTo(f.x, cy + 46); ctx.lineTo(f.x - 44, cy); ctx.closePath(); ctx.stroke(); ctx.restore();
  }
  if (a?.name === 'charge') {
    const c = Math.min(1, a.data.c / 90);
    ctx.save(); ctx.strokeStyle = C.red; ctx.globalAlpha = 0.25 + c * 0.6; ctx.lineWidth = 2 + c * 4;
    ctx.beginPath(); ctx.arc(f.x, cy, 36 + ((g.frame * 2) % 20) * (1 - c * 0.5), 0, 7); ctx.stroke(); ctx.restore();
  }
  if (f.def.id === 'gemini') {
    const fo = f.stance === 'focus', n = fo ? 1 : 2;
    for (let i = 0; i < n; i++) { const ang = g.frame * (fo ? 0.04 : 0.12) + i * Math.PI; ctx.fillStyle = fo ? C.violet : C.cyan; ctx.beginPath(); ctx.arc(f.x + Math.cos(ang) * 36, cy + Math.sin(ang) * 14, fo ? 6 : 4, 0, 7); ctx.fill(); }
  }
  if (f.mark > 0) {
    ctx.save(); ctx.strokeStyle = C.teal; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.lineDashOffset = -g.frame;
    ctx.beginPath(); ctx.arc(f.x, cy, 40, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(f.x - 50, cy); ctx.lineTo(f.x - 34, cy); ctx.moveTo(f.x + 34, cy); ctx.lineTo(f.x + 50, cy); ctx.stroke(); ctx.restore();
  }
  swoosh(ctx, f);
}

function drawEffect(ctx, e) {
  const k = e.life / e.max;
  ctx.save(); ctx.globalAlpha = Math.min(1, k * 1.5);
  if (e.type === 'spark') { ctx.fillStyle = e.color; ctx.fillRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size); }
  else if (e.type === 'burst') {
    const r = e.size * (1.1 - k * 0.3);
    ctx.translate(e.x, e.y); ctx.rotate(e.rot); ctx.fillStyle = e.color; ctx.beginPath();
    for (let i = 0; i < 16; i++) { const rad = i % 2 ? r * 0.4 : r; const a = (i / 16) * Math.PI * 2; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
    ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, 7); ctx.fill();
  } else if (e.type === 'ring') { ctx.strokeStyle = e.color; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (1 + (1 - k) * 1.5), 0, 7); ctx.stroke(); }
  else if (e.type === 'ghost') { ctx.globalAlpha = 0.45 * k; ctx.translate(e.x, e.y); ctx.scale(e.facing, 1); drawTinted(ctx, e.id, idlePose(0), e.color, 0.55); }
  else if (e.type === 'text') { ctx.fillStyle = e.color; ctx.font = '700 13px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText(e.str, e.x, e.y); }
  else if (e.type === 'ko') {
    ctx.translate(e.x, e.y); ctx.rotate(e.ang);
    for (let i = -3; i <= 3; i++) { ctx.fillStyle = i % 2 ? C.cobalt : e.color; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(500 * (1.2 - k), i * 40 - 6); ctx.lineTo(500 * (1.2 - k), i * 40 + 6); ctx.closePath(); ctx.fill(); }
  }
  ctx.restore();
}

function drawBubbles(ctx, g) {
  for (const b of g.bubbles) {
    const f = g.fighters[b.i];
    if (f.dead) continue;
    ctx.save(); ctx.globalAlpha = Math.min(1, b.life / 15);
    ctx.font = '600 13px "JetBrains Mono", monospace';
    const w = ctx.measureText('> ' + b.text).width + 20, x = clamp(f.x - w / 2, 10, 1270 - w), y = f.y - f.def.h - 52;
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.roundRect(x, y, w, 28, 8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(f.x - 6, y + 28); ctx.lineTo(f.x + 6, y + 28); ctx.lineTo(f.x, y + 36); ctx.fill();
    ctx.fillStyle = C.cyan; ctx.fillText('>', x + 10, y + 18); ctx.fillStyle = '#FFFFFF'; ctx.fillText(b.text, x + 24, y + 18);
    ctx.restore();
  }
}

export function render(ctx, g, opt) {
  ctx.save(); ctx.setTransform(opt.scale, 0, 0, opt.scale, 0, 0);
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  const cam = opt.fixedCam || camera(g, opt.reduced);
  ctx.save();
  let sx = 0, sy = 0;
  if (opt.shakeOn && !opt.reduced && g.shake > 0.5) { sx = Math.sin(g.frame * 1.7) * g.shake; sy = Math.cos(g.frame * 2.3) * g.shake * 0.6; }
  ctx.translate(W / 2 + sx, H / 2 + sy); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  drawStage(ctx, g);
  for (const d of g.decoys) {
    ctx.save(); ctx.globalAlpha = d.popped ? 0.25 : 0.5; ctx.translate(d.x, d.y); ctx.scale(d.facing, 1);
    drawBody(ctx, d.id, idlePose(g.frame, { arm: -0.5, lean: -0.2, eye: 'fierce' })); ctx.restore();
    ctx.save(); ctx.strokeStyle = C.violet; ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(d.x, d.y - 30, 34, 38, 0, 0, 7); ctx.stroke();
    ctx.fillStyle = C.violet; ctx.font = '700 16px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; if (g.frame % 20 < 14) ctx.fillText('?', d.x, d.y - 74); ctx.restore();
  }
  g.fighters.forEach((f) => drawFighter(ctx, g, f));
  for (const p of g.projectiles) drawProjectile(ctx, g, p);
  g.effects.forEach((e) => drawEffect(ctx, e));
  if (opt.showHitboxes) {
    ctx.lineWidth = 2;
    for (const f of g.fighters) {
      if (f.dead) continue;
      const hu = hurtbox(f); ctx.strokeStyle = 'rgba(47,91,234,0.8)'; ctx.strokeRect(hu.x, hu.y, hu.w, hu.h);
      const hb = hitboxOf(f); if (hb) { ctx.fillStyle = 'rgba(226,61,61,0.35)'; ctx.fillRect(hb.x, hb.y, hb.w, hb.h); }
    }
  }
  if (opt.banter !== false) drawBubbles(ctx, g);
  ctx.restore();
  if (opt.hud !== false) drawHUD(ctx, g, opt);
  ctx.restore();
}
export { fighterDef };