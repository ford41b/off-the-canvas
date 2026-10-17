import { C } from './palette';
const O = C.ink;

function st(ctx, w = 4) { ctx.lineWidth = w; ctx.strokeStyle = O; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fs(ctx, fill, w = 4) { ctx.fillStyle = fill; ctx.fill(); st(ctx, w); ctx.stroke(); }
function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
function feet(ctx, p, color, spread = 11, w = 14) {
  const s = Math.sin(p.leg) * 6;
  [[-spread, s], [spread, -s]].forEach(([x, o]) => { rr(ctx, x - w / 2 + o, -9 - Math.max(0, o) * 0.5, w, 9, 4); fs(ctx, color, 3); });
}
function eyes(ctx, p, x1, x2, y, col = O, size = 4) {
  ctx.fillStyle = col; ctx.strokeStyle = col;
  for (const x of [x1, x2]) {
    if (p.eye === 'hurt') { ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3); ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3); ctx.stroke(); }
    else if (p.blink) ctx.fillRect(x - size * 0.8, y - 1, size * 1.6, 2.4);
    else if (p.eye === 'fierce') { ctx.beginPath(); ctx.moveTo(x - size, y - size * 0.3); ctx.lineTo(x + size, y - size * 1.1); ctx.lineTo(x + size, y + size); ctx.lineTo(x - size, y + size); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.ellipse(x, y, size * 0.8, size * 1.2, 0, 0, Math.PI * 2); ctx.fill(); }
  }
}
function fist(ctx, p, x, y, len, r, color) {
  if (Math.abs(p.arm) < 0.05) return;
  const ax = p.arm > 0 ? Math.cos(p.armA) * len * p.arm : 10 * p.arm;
  const ay = p.arm > 0 ? -Math.sin(p.armA) * len * p.arm : 0;
  circ(ctx, x + ax, y + ay, r); fs(ctx, color, 3);
}

const BODIES = {
  claude(ctx, p) {
    const c = C.coral, s = Math.sin(p.leg) * 3;
    [-19, -7, 7, 19].forEach((x, i) => { rr(ctx, x - 4, -12 + (i % 2 ? s : -s), 8, 12, 2); fs(ctx, c, 3); });
    rr(ctx, -36, -38, 11, 12, 2); fs(ctx, c, 3);
    rr(ctx, -27, -52, 54, 42, 4); fs(ctx, c);
    const ex = p.arm > 0 ? p.arm * 20 : p.arm * 8, ey = p.arm > 0 ? -Math.sin(p.armA) * p.arm * 16 : 0;
    rr(ctx, 25 + ex, -38 + ey, 12, 12, 2); fs(ctx, c, 3);
    eyes(ctx, p, 4, 15, -36, O, 3.5);
  },
  codex(ctx, p) {
    feet(ctx, p, C.cobalt, 9, 13);
    rr(ctx, -15, -26, 30, 20, 8); fs(ctx, C.cobalt);
    fist(ctx, p, 10, -18, 28, 7, C.cobalt);
    const puffs = [[-15, -40, 13], [-3, -52, 15], [13, -46, 14], [18, -34, 11], [-8, -30, 12], [6, -30, 12]];
    st(ctx, 8); puffs.forEach(([x, y, r]) => { circ(ctx, x, y, r); ctx.stroke(); });
    ctx.fillStyle = C.cobalt; puffs.forEach(([x, y, r]) => { circ(ctx, x, y, r); ctx.fill(); });
    rr(ctx, -9, -50, 30, 20, 7); ctx.fillStyle = '#0E1A33'; ctx.fill();
    eyes(ctx, p, 0, 12, -40, C.cyan, 3);
  },
  chatgpt(ctx, p) {
    feet(ctx, p, C.teal, 10, 13);
    fist(ctx, p, 12, -26, 30, 7, C.green);
    circ(ctx, 0, -32, 25); fs(ctx, C.green);
    ctx.save(); circ(ctx, 0, -32, 23); ctx.clip();
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.translate(0, -32); ctx.rotate(i * 2.094 + p.t * 0.02);
      ctx.beginPath(); ctx.ellipse(9, 0, 16, 8, 0, 0, Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = i % 2 ? C.teal : '#E9FFF4'; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    circ(ctx, 8, -34, 11); fs(ctx, '#FFFFFF', 3);
    eyes(ctx, p, 4, 12, -35, O, 2.8);
  },
  gemini(ctx, p) {
    feet(ctx, p, C.violet, 9, 12);
    const fo = p.stance === 'focus', r = fo ? 32 : 29, k = r * 0.24;
    fist(ctx, p, 14, -30, 30, fo ? 9 : 6, fo ? C.violet : C.cyan);
    const star = () => {
      ctx.beginPath(); ctx.moveTo(0, -34 - r);
      ctx.quadraticCurveTo(k, -34 - k, r, -34); ctx.quadraticCurveTo(k, -34 + k, 0, -34 + r);
      ctx.quadraticCurveTo(-k, -34 + k, -r, -34); ctx.quadraticCurveTo(-k, -34 - k, 0, -34 - r); ctx.closePath();
    };
    star(); ctx.save(); ctx.clip();
    ctx.fillStyle = C.cobalt; ctx.fillRect(-40, -80, 40, 90);
    ctx.fillStyle = fo ? C.violet : C.cyan; ctx.fillRect(0, -80, 40, 90);
    ctx.restore(); star(); st(ctx); ctx.stroke();
    circ(ctx, -1, -36, 4.5); fs(ctx, '#FFFFFF', 2); circ(ctx, 9, -36, 4.5); fs(ctx, '#FFFFFF', 2);
    eyes(ctx, p, 0, 10, -36, O, 2);
  },
  grok(ctx, p) {
    feet(ctx, p, C.charcoal, 10, 14);
    fist(ctx, p, 12, -26, 32, 8, C.charcoal);
    const pts = [[-24, -6], [-28, -36], [-14, -58], [2, -48], [22, -60], [20, -34], [27, -10], [2, -14]];
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); fs(ctx, C.charcoal);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12, -54); ctx.lineTo(2, -45); ctx.lineTo(19, -55); ctx.stroke();
    ctx.strokeStyle = C.red; ctx.lineWidth = p.blink ? 2 : 5; ctx.beginPath();
    ctx.moveTo(2, p.eye === 'fierce' ? -44 : -40); ctx.lineTo(19, -36); ctx.stroke();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(6, -23); ctx.lineTo(17, -27); ctx.stroke();
    if (p.charge > 0) { ctx.strokeStyle = C.red; ctx.globalAlpha *= 0.3 + p.charge * 0.7; ctx.lineWidth = 3; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * 1.15, y * 1.1) : ctx.moveTo(x * 1.15, y * 1.1))); ctx.closePath(); ctx.stroke(); }
  },
  perplexity(ctx, p) {
    feet(ctx, p, C.teal, 9, 13);
    ctx.lineCap = 'round'; ctx.strokeStyle = O; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(-10, -22); ctx.lineTo(-25, -6); ctx.stroke();
    ctx.strokeStyle = C.teal; ctx.lineWidth = 7; ctx.stroke();
    fist(ctx, p, 14, -30, 34, 6, C.teal);
    circ(ctx, 4, -38, 22); ctx.fillStyle = C.navy2; ctx.fill();
    ctx.lineWidth = 13; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = C.teal; ctx.stroke();
    ctx.strokeStyle = C.cyan; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(4, -38, 14, 3.6, 4.6); ctx.stroke();
    if (p.eye === 'hurt' || p.blink) eyes(ctx, p, 8, 8, -38, '#FFFFFF', 4);
    else { circ(ctx, 8, -38, 7); ctx.fillStyle = '#FFFFFF'; ctx.fill(); circ(ctx, 10.5, -38, 3.5); ctx.fillStyle = C.cyan; ctx.fill(); }
  },
  hallucination(ctx, p) {
    const j = Math.sin(p.t * 0.21) * 2.5, k = Math.cos(p.t * 0.17) * 2.5;
    ctx.save(); ctx.globalAlpha *= 0.7;
    circ(ctx, -7 + j, -30, 22); ctx.fillStyle = C.cyan; ctx.fill();
    circ(ctx, 6 + k, -34, 21); ctx.fillStyle = C.coral; ctx.fill();
    ctx.restore();
    feet(ctx, p, C.violet, 10, 13);
    fist(ctx, p, 12, -28, 30, 7, C.violet);
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) { const a = (i / 18) * Math.PI * 2, r = 23 + Math.sin(i * 3 + p.t * 0.15) * 1.6; const x = Math.cos(a) * r, y = -31 + Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); fs(ctx, C.violet);
    [3, 14].forEach((x) => { ctx.beginPath(); ctx.ellipse(x, -34, 5, 6.5, 0, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill(); });
    eyes(ctx, p, 4.5, 15.5, -33, O, 2.6);
    st(ctx, 2.5); ctx.beginPath(); ctx.moveTo(10, -45); ctx.quadraticCurveTo(15, -50, 20, -45); ctx.stroke();
  },
  bug(ctx, p) {
    st(ctx, 2.5);
    for (let i = 0; i < 3; i++) { const lx = -12 + i * 12, s = Math.sin(p.leg + i) * 3; ctx.beginPath(); ctx.moveTo(lx, -8); ctx.lineTo(lx - 4 + s, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(4, -38); ctx.lineTo(9, -50); ctx.moveTo(12, -38); ctx.lineTo(19, -47); ctx.stroke();
    circ(ctx, 9, -50, 3); fs(ctx, C.coral, 2); circ(ctx, 19, -47, 3); fs(ctx, C.coral, 2);
    fist(ctx, p, 12, -22, 24, 6, C.violet);
    rr(ctx, -22, -40, 44, 33, 6); fs(ctx, C.navy2);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) if ((r + c * 2) % 5 === 0) { ctx.fillStyle = C.violet; ctx.fillRect(-19 + c * 8, -37 + r * 7.5, 7, 6); }
    ctx.fillStyle = C.cyan;
    if (p.eye === 'hurt' || p.blink) eyes(ctx, p, 6, 15, -27, C.cyan, 3);
    else { ctx.fillRect(3, -31, 6, 7); ctx.fillRect(12, -31, 6, 7); }
    if (p.t % 50 < 4) { ctx.fillStyle = 'rgba(63,208,224,0.75)'; ctx.fillRect(-28, -30, 12, 5); ctx.fillStyle = 'rgba(232,104,74,0.75)'; ctx.fillRect(16, -20, 13, 4); }
  },
};

export function drawBody(ctx, id, p) { BODIES[id](ctx, p); }

export const idlePose = (t, extra = {}) => ({
  sx: 1, sy: 1 + Math.sin(t * 0.08) * 0.02, lean: 0, arm: 0, armA: 0, leg: 0, eye: 'idle', blink: t % 170 < 6, bob: Math.sin(t * 0.08) * 1.5, t, stance: 'flash', charge: 0, ...extra,
});

export function poseOf(f, t) {
  const p = idlePose(t + f.idx * 37, { stance: f.stance });
  if (f.hitstun > 0) return { ...p, eye: 'hurt', lean: -0.4, sx: 0.9, sy: 1.1, bob: 0 };
  const a = f.act;
  if (a) {
    const m = a.move;
    p.bob = 0;
    if (m) {
      const s = m.startup, ac = m.active;
      p.armA = (m.angle * Math.PI) / 180;
      if (a.t < s) { p.arm = -0.5 * (a.t / s); p.lean = -0.18; p.sx = 1.06; p.sy = 0.94; }
      else if (a.t < s + ac) { p.arm = 1; p.lean = 0.28; p.sx = 1.12; p.sy = 0.9; p.eye = 'fierce'; }
      else { p.arm = Math.max(0, 1 - (a.t - s - ac) / Math.max(1, m.recovery)); p.lean = 0.1 * p.arm; }
    } else if (a.name === 'counter') { p.sy = 0.9; p.sx = 1.08; p.arm = -0.4; p.eye = 'fierce'; }
    else if (a.name === 'charge') { p.charge = Math.min(1, a.data.c / 90); p.arm = -0.8; p.lean = -0.25; p.eye = 'fierce'; p.shake = Math.sin(t * 2) * p.charge * 2.5; }
    else if (a.name === 'counterhit') { p.arm = 1; p.armA = 0.6; p.lean = 0.3; p.eye = 'fierce'; }
    else p.eye = a.name === 'dodge' ? 'idle' : 'fierce';
  } else if (!f.grounded) {
    p.sy = f.vy < 0 ? 1.1 : 0.96; p.sx = f.vy < 0 ? 0.92 : 1.03; p.leg = 0.8; p.bob = 0;
  } else if (Math.abs(f.vx) > 0.6) {
    p.leg = t * 0.4; p.bob = Math.abs(Math.sin(t * 0.4)) * 3; p.lean = Math.min(0.2, Math.abs(f.vx) * 0.03);
  }
  if (f.landT > 0) { p.sy = 0.84; p.sx = 1.14; }
  return p;
}