import { C, W, H } from '../palette';
import { drawBody, idlePose } from '../bodies';
import { drawEffect } from '../render';
import { SKILLS, T } from './racer';
import { fmtTime, standings } from './race';
import { COURSE_META } from './courses';

const TAU = Math.PI * 2;
const PAD = '#FFC24A';
const BODY = 0.62;
const ORD = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH'];
const ink = (ctx, w, col = C.ink) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; };
const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

function camera(g) {
  const me = g.racers[0], cam = g.cam;
  const tx = me.x - 360, ty = Math.min(-180, me.y + 160);
  cam.x = Math.abs(tx - cam.x) < 80 ? tx : cam.x + (tx - cam.x) * 0.22;
  cam.y += (ty - cam.y) * 0.08;
  return cam;
}

// Parallax backdrop drawn in screen space; `ox` scrolls it with the camera.
function backdrop(ctx, g, cam) {
  const th = g.course.theme, t = g.reduced ? 0 : g.frame, ox = cam.x * 0.25;
  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (th.deco === 'stars') {
    for (let i = 0; i < 90; i++) {
      const x = ((hash(i) * 1600 - ox * (0.4 + hash(i + 9) * 0.6)) % 1600 + 1600) % 1600 - 160, y = hash(i + 3) * H;
      ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 0.03 + i)); ctx.fillStyle = i % 7 ? '#FFFFFF' : C.cyan;
      ctx.fillRect(x, y, i % 5 ? 2 : 3, i % 5 ? 2 : 3);
    }
  } else if (th.deco === 'dots') {
    ctx.fillStyle = 'rgba(20,33,61,0.07)';
    for (let x = -(ox % 64); x < W; x += 64) for (let y = 16; y < H; y += 64) ctx.fillRect(x, y, 2.5, 2.5);
  } else if (th.deco === 'brackets') {
    ctx.font = '700 120px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(47,91,234,0.07)';
    ['{', '}', '</>', '[ ]', '( )', ';'].forEach((s, i) => { const x = ((i * 340 - ox) % 2040 + 2040) % 2040 - 200; ctx.fillText(s, x, 160 + (i % 3) * 170); });
  } else if (th.deco === 'curve') {
    ink(ctx, 4, 'rgba(18,163,154,0.12)');
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      for (let x = -40; x <= W + 40; x += 20) { const u = (x + ox * (0.6 + k * 0.4)) / 520; ctx.lineTo(x, 140 + k * 120 + Math.sin(u) * 50 + Math.cos(u * 2.3) * 26); }
      ctx.stroke();
    }
  } else if (th.deco === 'warning') {
    ctx.fillStyle = 'rgba(226,61,61,0.05)';
    for (let x = -(ox % 120) - 120; x < W + 120; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 50, 0); ctx.lineTo(x - 150, H); ctx.lineTo(x - 200, H); ctx.closePath(); ctx.fill(); }
    ctx.font = '700 150px "Space Grotesk", sans-serif'; ctx.fillStyle = 'rgba(226,61,61,0.06)';
    for (let i = 0; i < 3; i++) ctx.fillText('429', ((i * 700 - ox * 0.6) % 2100 + 2100) % 2100 - 400, 260 + i * 60);
  }
  ctx.restore();
}

function inView(cam, x0, x1) { return x1 > cam.x - 80 && x0 < cam.x + W + 80; }

function drawSolids(ctx, g, cam) {
  const th = g.course.theme;
  for (const s of g.course.solids) {
    if (!inView(cam, s.x, s.x + s.w)) continue;
    const h = s.ground ? Math.min(s.h, cam.y + H / 2 - s.y + 40) : s.h;
    ctx.fillStyle = s.ground ? '#FFFFFF' : '#FBFAF6'; ink(ctx, s.ground ? 4 : 3);
    ctx.beginPath(); ctx.roundRect(s.x, s.y, s.w, h, s.ground ? 6 : 5); ctx.fill(); ctx.stroke();
    if (s.ground) {
      ctx.fillStyle = th.a; ctx.fillRect(s.x + 8, s.y + 9, s.w - 16, 4);
      ctx.fillStyle = 'rgba(20,33,61,0.06)';
      for (let x = Math.ceil(s.x / T) * T + 20; x < s.x + s.w - 10; x += T * 2) ctx.fillRect(x, s.y + 28, 3, 3);
    } else {
      ctx.save(); ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip();
      ink(ctx, 1.5, 'rgba(20,33,61,0.12)'); ctx.beginPath();
      for (let x = s.x + T; x < s.x + s.w; x += T) { ctx.moveTo(x, s.y); ctx.lineTo(x, s.y + s.h); }
      for (let y = s.y + T; y < s.y + s.h; y += T) { ctx.moveTo(s.x, y); ctx.lineTo(s.x + s.w, y); }
      ctx.stroke(); ctx.fillStyle = th.b; ctx.fillRect(s.x + 5, s.y + 5, 8, 4); ctx.restore();
    }
  }
}

function drawSpikes(ctx, g, cam) {
  const dark = g.course.theme.dark;
  for (const s of g.course.spikes) {
    if (!inView(cam, s.x, s.x + T)) continue;
    const by = s.y, ty = s.y - s.dir * s.h;
    ctx.beginPath(); ctx.moveTo(s.x + 3, by); ctx.lineTo(s.x + T / 2, ty); ctx.lineTo(s.x + T - 3, by); ctx.closePath();
    ctx.fillStyle = C.ink; ctx.fill(); ink(ctx, 2, dark ? '#F4F1EA' : C.ink); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.x + T / 2 - 2, ty + s.dir * 8); ctx.lineTo(s.x + 11, by - s.dir * 5); ctx.stroke();
  }
}

function drawPieces(ctx, g, cam) {
  const t = g.reduced ? 0 : g.frame, me = g.racers[0], th = g.course.theme;
  for (const p of g.course.pads) {
    if (!inView(cam, p.x, p.x + T)) continue;
    ctx.save(); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 0.2); ctx.fillStyle = PAD;
    ctx.beginPath(); ctx.ellipse(p.x + T / 2, p.y - 4, 22, 14, 0, Math.PI, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = PAD; ink(ctx, 2.5); ctx.beginPath(); ctx.ellipse(p.x + T / 2, p.y, 16, 8, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  for (const o of g.course.orbs) {
    if (!inView(cam, o.x - 30, o.x + 30)) continue;
    const used = me.orbs.has(o.i), k = 1 + Math.sin(t * 0.15) * 0.08;
    ctx.save(); ctx.globalAlpha = used ? 0.35 : 1;
    ctx.strokeStyle = PAD; ctx.lineWidth = 3; ctx.globalAlpha *= 0.5; ctx.beginPath(); ctx.arc(o.x, o.y, 24 * k, 0, TAU); ctx.stroke(); ctx.globalAlpha = used ? 0.35 : 1;
    ctx.fillStyle = PAD; ink(ctx, 3); ctx.beginPath(); ctx.arc(o.x, o.y, 15, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(o.x, o.y, 6, 0, TAU); ctx.fill(); ctx.restore();
  }
  for (const s of g.course.saws) {
    if (!inView(cam, s.x - s.r, s.x + s.r)) continue;
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(t * 0.12);
    ctx.beginPath();
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU, rad = i % 2 ? s.r * 0.8 : s.r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
    ctx.closePath(); ctx.fillStyle = th.dark ? C.red : C.charcoal; ctx.fill(); ink(ctx, 2.5, th.dark ? '#F4F1EA' : C.ink); ctx.stroke();
    ctx.fillStyle = th.dark ? '#F4F1EA' : C.red; ctx.beginPath(); ctx.arc(0, 0, s.r * 0.32, 0, TAU); ctx.fill();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(0, 0, s.r * 0.12, 0, TAU); ctx.fill(); ctx.restore();
  }
  if (g.checkpoints) g.course.cps.forEach((cp, i) => {
    if (!inView(cam, cp.x, cp.x + 40)) return;
    const got = me.cpI >= i;
    ink(ctx, 3, th.dark ? '#F4F1EA' : C.ink); ctx.beginPath(); ctx.moveTo(cp.x, cp.y); ctx.lineTo(cp.x, cp.y - 62); ctx.stroke();
    ctx.fillStyle = got ? C.green : '#FFFFFF'; ink(ctx, 2.5); ctx.beginPath();
    ctx.moveTo(cp.x + 1, cp.y - 62); ctx.lineTo(cp.x + 30, cp.y - 53 + (g.reduced ? 0 : Math.sin(t * 0.2) * 2)); ctx.lineTo(cp.x + 1, cp.y - 44); ctx.closePath(); ctx.fill(); ctx.stroke();
  });
  const fx = g.course.finish;
  if (inView(cam, fx - 40, fx + 40)) {
    const top = cam.y - H / 2 - 20;
    const fy = g.course.finishY, n = Math.ceil((fy - top) / 20);
    for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? C.ink : '#FFFFFF'; ctx.fillRect(fx - 20 + j * 20, fy - (i + 1) * 20, 20, 20); }
    ink(ctx, 3); ctx.strokeRect(fx - 20, fy - n * 20, 40, n * 20);
  }
}

function drawPatch(ctx, p) {
  if (p.life < 40 && Math.floor(p.life / 5) % 2) return;
  ctx.save(); ctx.shadowColor = C.cyan; ctx.shadowBlur = 14; ctx.fillStyle = 'rgba(47,91,234,0.85)'; ctx.strokeStyle = C.cyan; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, 12, 3); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = C.cyan; ctx.font = '600 9px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('{ patch }', p.x + p.w / 2, p.y + 9); ctx.textAlign = 'left';
}

function drawRacer(ctx, g, r) {
  if (r.dead) return;
  const t = g.reduced ? 0 : r.t, me = !r.bot, col = r.def.color;
  if (r.patch) drawPatch(ctx, r.patch);
  ctx.save();
  if (!me) ctx.globalAlpha = 0.5;
  r.trail.forEach((p, i) => { ctx.save(); ctx.globalAlpha *= (i + 1) / 16; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x - 6, p.y - 15, 6 + i, 0, TAU); ctx.fill(); ctx.restore(); });
  if (r.dash > 0 || r.boost > 0) {
    ink(ctx, 3, r.def.accent); ctx.globalAlpha *= 0.7;
    for (let i = 0; i < 3; i++) { const y = r.y - 6 - i * 10; ctx.beginPath(); ctx.moveTo(r.x - 24 - i * 6, y); ctx.lineTo(r.x - 60 - i * 10, y); ctx.stroke(); }
    ctx.globalAlpha = me ? 1 : 0.5;
  }
  if (r.phase > 0 && !g.reduced) ctx.globalAlpha *= 0.45 + Math.abs(Math.sin(g.frame * 0.4)) * 0.4;
  ctx.translate(r.x, r.y - 15); ctx.rotate(r.rot); ctx.translate(0, 15); ctx.scale(BODY, BODY);
  const run = r.grounded && !r.done;
  const pose = idlePose(t + r.idx * 37, { leg: run ? t * 0.5 : 0.8, bob: run ? Math.abs(Math.sin(t * 0.5)) * 2 : 0, eye: r.grounded ? 'idle' : 'fierce', lean: run ? 0.15 : 0, sy: run ? 1 : r.vy < 0 ? 1.08 : 0.96 });
  ctx.translate(0, -pose.bob); ctx.rotate(pose.lean * 0.35);
  if (g.course.theme.dark) { ctx.shadowColor = 'rgba(255,255,255,0.55)'; ctx.shadowBlur = 12; }
  drawBody(ctx, r.id, pose);
  ctx.restore();
  const cy = r.y - 18;
  if (r.shield > 0) {
    ctx.save(); ctx.strokeStyle = g.frame % 4 < 2 ? C.coral : '#FFFFFF'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(r.x, cy - 32); ctx.lineTo(r.x + 30, cy); ctx.lineTo(r.x, cy + 30); ctx.lineTo(r.x - 30, cy); ctx.closePath(); ctx.stroke(); ctx.restore();
  }
  if (r.glide > 0) {
    ctx.save(); ctx.fillStyle = 'rgba(18,163,154,0.35)'; ink(ctx, 2.5, C.teal);
    ctx.beginPath(); ctx.ellipse(r.x, r.y - 58, 30, 12, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r.x - 28, r.y - 58); ctx.lineTo(r.x - 8, r.y - 34); ctx.moveTo(r.x + 28, r.y - 58); ctx.lineTo(r.x + 8, r.y - 34); ctx.stroke(); ctx.restore();
  }
  ctx.save(); ctx.font = '700 10px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
  if (me) {
    ctx.fillStyle = C.coral; ctx.beginPath(); ctx.moveTo(r.x - 6, r.y - 54); ctx.lineTo(r.x + 6, r.y - 54); ctx.lineTo(r.x, r.y - 46); ctx.fill();
    ctx.fillText('P1', r.x, r.y - 59);
  } else if (Math.hypot(r.x - g.racers[0].x, r.y - g.racers[0].y) > 44 || g.racers[0].dead) { ctx.globalAlpha = 0.75; ctx.fillStyle = g.course.theme.dark ? '#FFFFFF' : C.ink; ctx.fillText(r.def.name.toUpperCase(), r.x, r.y - 50 - ((r.idx - 1) % 3) * 12); }
  ctx.restore();
}

function hud(ctx, g) {
  const me = g.racers[0], th = g.course.theme, fg = th.dark ? '#FFFFFF' : C.ink, c = g.course;
  ctx.save();
  // Course progress, with a marker per racer.
  const bx = 360, bw = 560, by = 26, prog = (r) => Math.max(0, Math.min(1, (r.x - c.start.x) / c.length));
  ctx.fillStyle = th.dark ? 'rgba(255,255,255,0.15)' : 'rgba(20,33,61,0.1)'; ctx.beginPath(); ctx.roundRect(bx, by, bw, 10, 5); ctx.fill();
  ctx.fillStyle = me.def.color; ctx.beginPath(); ctx.roundRect(bx, by, Math.max(10, bw * prog(me)), 10, 5); ctx.fill();
  if (g.checkpoints) for (const cp of c.cps) { ctx.fillStyle = fg; ctx.globalAlpha = 0.5; ctx.fillRect(bx + bw * prog(cp) - 1, by - 3, 2, 16); ctx.globalAlpha = 1; }
  for (const r of [...g.racers].reverse()) {
    const x = bx + bw * prog(r), big = !r.bot;
    ctx.fillStyle = r.def.color; ink(ctx, big ? 3 : 2, big ? '#FFFFFF' : C.ink);
    ctx.beginPath(); ctx.arc(x, by + 5, big ? 9 : 6, 0, TAU); ctx.fill(); ctx.stroke();
    if (big) { ink(ctx, 1.5); ctx.beginPath(); ctx.arc(x, by + 5, 10.5, 0, TAU); ctx.stroke(); }
  }
  ctx.font = '700 11px "JetBrains Mono", monospace'; ctx.fillStyle = fg; ctx.textAlign = 'right';
  ctx.fillText(Math.floor(prog(me) * 100) + '%', bx - 10, by + 10);

  ctx.textAlign = 'left'; ctx.fillStyle = fg;
  ctx.font = '700 12px "JetBrains Mono", monospace'; ctx.globalAlpha = 0.7;
  ctx.fillText(COURSE_META[c.id].name.toUpperCase() + '  ' + '★'.repeat(COURSE_META[c.id].diff), 24, 30); ctx.globalAlpha = 1;
  ctx.font = '700 30px "JetBrains Mono", monospace'; ctx.fillText(fmtTime(me.done ? me.finishT : me.t), 24, 64);
  ctx.font = '600 12px "JetBrains Mono", monospace'; ctx.globalAlpha = 0.75;
  ctx.fillText(`ATTEMPT ${me.deaths + 1}${g.checkpoints ? '' : ' · NO CHECKPOINTS'}`, 24, 84); ctx.globalAlpha = 1;
  if (g.racers.length > 1) {
    const place = standings(g).indexOf(me);
    ctx.textAlign = 'right'; ctx.font = '700 40px "Space Grotesk", sans-serif'; ctx.fillStyle = place === 0 ? C.coral : fg;
    ctx.fillText(ORD[place], W - 24, 92); ctx.font = '600 12px "JetBrains Mono", monospace'; ctx.fillStyle = fg; ctx.globalAlpha = 0.7;
    ctx.fillText(`OF ${g.racers.length}`, W - 24, 108); ctx.globalAlpha = 1;
  }

  // Skill card.
  const sk = SKILLS[me.id], ready = me.cd === 0, x = 20, y = H - 74, w = 300;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(20,33,61,0.08)'; ctx.beginPath(); ctx.roundRect(x + 4, y + 5, w, 54, 12); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ink(ctx, 3); ctx.beginPath(); ctx.roundRect(x, y, w, 54, 12); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x + 6, y + 6, 42, 42, 8); ctx.clip(); ctx.fillStyle = me.def.color + '33'; ctx.fillRect(x + 6, y + 6, 42, 42);
  ctx.translate(x + 27, y + 46); ctx.scale(0.55, 0.55); drawBody(ctx, me.id, idlePose(g.frame)); ctx.restore();
  ctx.fillStyle = C.ink; ctx.font = '700 13px "Space Grotesk", sans-serif'; ctx.fillText(sk.name.toUpperCase(), x + 58, y + 21);
  ctx.font = '600 9px "JetBrains Mono", monospace'; ctx.globalAlpha = 0.7; ctx.fillText(ready ? 'READY · H / SHIFT' : 'RECHARGING', x + 58, y + 34); ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(20,33,61,0.12)'; ctx.beginPath(); ctx.roundRect(x + 58, y + 40, w - 72, 6, 3); ctx.fill();
  ctx.fillStyle = ready ? me.def.color : 'rgba(20,33,61,0.55)'; ctx.beginPath(); ctx.roundRect(x + 58, y + 40, Math.max(6, (w - 72) * (1 - me.cd / sk.cd)), 6, 3); ctx.fill();

  // Center callouts.
  ctx.textAlign = 'center'; ctx.fillStyle = fg;
  if (g.count > 0) {
    const n = Math.ceil(g.count / 60), k = (g.count % 60) / 60;
    ctx.globalAlpha = 0.4 + k * 0.6; ctx.font = `700 ${Math.round(90 + (g.reduced ? 0 : (1 - k) * 30))}px "Space Grotesk", sans-serif`;
    ctx.fillText(String(n), W / 2, H / 2 - 20);
    ctx.globalAlpha = 0.8; ctx.font = '600 13px "JetBrains Mono", monospace'; ctx.fillText('SPACE / ↑ / CLICK TO JUMP · HOLD TO KEEP JUMPING', W / 2, H / 2 + 30);
  } else if (me.t < 40) { ctx.globalAlpha = 1 - me.t / 40; ctx.font = '700 96px "Space Grotesk", sans-serif'; ctx.fillText('GO!', W / 2, H / 2 - 20); }
  if (me.dead > 0 && !g.checkpoints) { ctx.globalAlpha = 0.85; ctx.font = '700 44px "Space Grotesk", sans-serif'; ctx.fillText(`ATTEMPT ${me.deaths + 1}`, W / 2, H / 2 - 40); }
  if (me.done) {
    const k = Math.min(1, (g.frame - g.endAt) / 15);
    ctx.globalAlpha = k; ctx.font = '700 88px "Space Grotesk", sans-serif'; ctx.fillStyle = C.coral;
    ctx.fillText(g.racers.length > 1 ? ORD[standings(g).indexOf(me)] + '!' : 'FINISH!', W / 2, H / 2 - 40);
    ctx.font = '700 22px "JetBrains Mono", monospace'; ctx.fillStyle = fg; ctx.fillText(fmtTime(me.finishT), W / 2, H / 2);
  }
  ctx.restore();
}

export function renderDash(ctx, g, opt) {
  ctx.save(); ctx.setTransform(opt.scale, 0, 0, opt.scale, 0, 0);
  const cam = camera(g);
  backdrop(ctx, g, cam);
  ctx.save();
  let sx = 0, sy = 0;
  if (opt.shakeOn && !g.reduced && g.shake > 0.5) { sx = Math.sin(g.frame * 1.7) * g.shake; sy = Math.cos(g.frame * 2.3) * g.shake * 0.6; }
  ctx.translate(-cam.x + sx, H / 2 - cam.y + sy);
  drawSolids(ctx, g, cam);
  drawSpikes(ctx, g, cam);
  drawPieces(ctx, g, cam);
  for (let i = g.racers.length - 1; i >= 0; i--) drawRacer(ctx, g, g.racers[i]);
  g.effects.forEach((e) => drawEffect(ctx, e));
  ctx.restore();
  hud(ctx, g);
  ctx.restore();
}
