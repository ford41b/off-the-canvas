import { C, W, H } from './palette';
import { drawBody, poseOf, idlePose } from './bodies';
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
  if (f.hold > 0) { ctx.fillStyle = C.cyan; ctx.fillRect(f.x - 30, f.y + 2, 60, 5); }
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(f.x + (p.shake || 0), f.y - p.bob);
  ctx.scale(f.facing, 1); ctx.rotate(p.lean * 0.35); ctx.scale(p.sx, p.sy);
  drawBody(ctx, f.def.id, p); ctx.restore();
  const a = f.act, cy = f.y - f.def.h / 2;
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
  else if (e.type === 'ghost') { ctx.globalAlpha = 0.4 * k; ctx.translate(e.x, e.y); ctx.scale(e.facing, 1); drawBody(ctx, e.id, idlePose(0)); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = e.color; ctx.globalAlpha = 0.5 * k; ctx.fillRect(-40, -70, 80, 75); }
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
  for (const p of g.projectiles) {
    ctx.save(); ctx.translate(p.x, p.y);
    if (p.type === 'marker') { ctx.rotate(g.frame * 0.2); ctx.fillStyle = C.teal; ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(9, 0); ctx.lineTo(0, 9); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle = 'rgba(63,208,224,0.25)'; ctx.beginPath(); ctx.arc(-p.vx * 1.5, -p.vy * 1.5, p.r, 0, 7); ctx.fill(); ctx.fillStyle = p.homing ? C.teal : C.cyan; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(-3, -3, 3, 0, 7); ctx.fill(); }
    ctx.restore();
  }
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