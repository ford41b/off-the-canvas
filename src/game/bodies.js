import { C } from './palette';
const O = C.ink;
const TAU = Math.PI * 2;
// Shared material: 4px ink outline on silhouettes, 3px on limbs, a bottom-right shade crescent and a top-left glint.
const SHADE = 'rgba(20,33,61,0.17)';
const GLINT = 'rgba(255,255,255,0.6)';

function st(ctx, w = 4) { ctx.lineWidth = w; ctx.strokeStyle = O; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fs(ctx, fill, w = 4) { ctx.fillStyle = fill; ctx.fill(); st(ctx, w); ctx.stroke(); }
function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
const flat = (color) => (ctx) => { ctx.fillStyle = color; ctx.fillRect(-90, -130, 180, 150); };

// Paints `paint` inside `path`, shades the crescent left over when the shape is nudged up-left, then outlines it.
function volume(ctx, path, paint, w = 4, dx = -3, dy = -5) {
  ctx.save();
  path(); ctx.clip(); paint(ctx);
  ctx.fillStyle = SHADE; ctx.fillRect(-90, -130, 180, 150);
  ctx.translate(dx, dy); path(); ctx.translate(-dx, -dy); ctx.clip(); paint(ctx);
  ctx.restore();
  path(); st(ctx, w); ctx.stroke();
}
function glintArc(ctx, x, y, r, a0 = 3.55, a1 = 4.35) {
  ctx.save(); ctx.strokeStyle = GLINT; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke(); ctx.restore();
}
function glintLine(ctx, x, y, len) {
  ctx.save(); ctx.strokeStyle = GLINT; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  ctx.fillStyle = GLINT; circ(ctx, x + len + 5, y, 1.6); ctx.fill(); ctx.restore();
}
function feet(ctx, p, color, spread = 11, w = 14) {
  const s = Math.sin(p.leg) * 6;
  [[-spread, s], [spread, -s]].forEach(([x, o]) => {
    rr(ctx, x - w / 2 + o, -10 - Math.max(0, o) * 0.5, w, 10, 5); fs(ctx, color, 3);
  });
}
// Ink eyes get a catchlight; glowing eyes (any other color) stay flat.
function eyes(ctx, p, x1, x2, y, col = O, size = 4) {
  ctx.fillStyle = col; ctx.strokeStyle = col;
  for (const x of [x1, x2]) {
    if (p.eye === 'hurt') { ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3); ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3); ctx.stroke(); continue; }
    if (p.blink) { ctx.beginPath(); ctx.roundRect(x - size * 0.9, y - 1.2, size * 1.8, 2.4, 1.2); ctx.fill(); continue; }
    if (p.eye === 'fierce') { ctx.beginPath(); ctx.moveTo(x - size, y - size * 0.2); ctx.lineTo(x + size, y - size * 1.1); ctx.lineTo(x + size, y + size); ctx.lineTo(x - size, y + size); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.ellipse(x, y, size * 0.8, size * 1.2, 0, 0, TAU); ctx.fill(); }
    if (col === O) { ctx.fillStyle = '#FFFFFF'; circ(ctx, x + size * 0.25, y - size * 0.45, Math.max(0.9, size * 0.32)); ctx.fill(); ctx.fillStyle = col; }
  }
}
function fist(ctx, p, x, y, len, r, color) {
  if (Math.abs(p.arm) < 0.05) return;
  const ax = p.arm > 0 ? Math.cos(p.armA) * len * p.arm : 10 * p.arm;
  const ay = p.arm > 0 ? -Math.sin(p.armA) * len * p.arm : 0;
  circ(ctx, x + ax, y + ay, r); fs(ctx, color, 3);
}
function glowRect(ctx, x, y, w, h, color) {
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 6; ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 1.5); ctx.fill(); ctx.restore();
}
// Smooth closed blob through points, using midpoints as on-curve anchors.
function blob(ctx, pts) {
  ctx.beginPath();
  const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]); ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
  ctx.closePath();
}

const BODIES = {
  // Patient block: four legs, two nub arms, polite blush.
  claude(ctx, p) {
    const c = C.coral, s = Math.sin(p.leg) * 3;
    [-19, -7, 7, 19].forEach((x, i) => { rr(ctx, x - 4, -13 + (i % 2 ? s : -s), 8, 13, 2.5); fs(ctx, c, 3); });
    rr(ctx, -37, -40, 12, 13, 3); fs(ctx, c, 3);
    volume(ctx, () => rr(ctx, -28, -54, 56, 44, 7), flat(c));
    glintLine(ctx, -20, -47, 10);
    ctx.fillStyle = 'rgba(255,226,214,0.75)';
    [[3, -27], [19, -27]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 4, 2.2, 0, 0, TAU); ctx.fill(); });
    const ex = p.arm > 0 ? p.arm * 20 : p.arm * 8, ey = p.arm > 0 ? -Math.sin(p.armA) * p.arm * 16 : 0;
    rr(ctx, 25 + ex, -40 + ey, 13, 13, 3); fs(ctx, c, 3);
    eyes(ctx, p, 5, 17, -37, O, 3.8);
  },
  // Cloud with a terminal visor and a blinking cursor.
  codex(ctx, p) {
    feet(ctx, p, C.cobalt, 9, 13);
    rr(ctx, -14, -26, 28, 20, 8); fs(ctx, C.cobalt, 3.5);
    fist(ctx, p, 10, -18, 28, 7, C.cobalt);
    const puffs = [[-15, -40, 13], [-3, -52, 15], [13, -46, 14], [18, -34, 11], [-8, -30, 12], [6, -30, 12]];
    const cloud = () => { ctx.beginPath(); puffs.forEach(([x, y, r]) => { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }); };
    st(ctx, 8); cloud(); ctx.stroke();
    ctx.save(); cloud(); ctx.clip(); ctx.fillStyle = C.cobalt; ctx.fillRect(-40, -80, 80, 80);
    ctx.fillStyle = SHADE; ctx.fillRect(-40, -80, 80, 80);
    ctx.translate(-3, -5); cloud(); ctx.fillStyle = C.cobalt; ctx.fill(); ctx.restore();
    glintArc(ctx, -3, -52, 10, 3.5, 4.5); glintArc(ctx, -15, -40, 8, 3.2, 3.9);
    rr(ctx, -9, -50, 31, 21, 8); ctx.fillStyle = '#0E1A33'; ctx.fill();
    ctx.strokeStyle = 'rgba(63,208,224,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (p.eye === 'hurt' || p.blink) eyes(ctx, p, 1, 13, -41, C.cyan, 3);
    else { const f = p.eye === 'fierce' ? 2 : 0; glowRect(ctx, -1.5, -45 + f, 5, 8 - f, C.cyan); glowRect(ctx, 10.5, -45 + f, 5, 8 - f, C.cyan); }
    if (p.t % 50 < 25) { ctx.fillStyle = C.cyan; ctx.fillRect(15, -35, 5, 2); }
  },
  // Friendly sphere with a slow-turning knot and a face plate.
  chatgpt(ctx, p) {
    feet(ctx, p, C.teal, 10, 13);
    fist(ctx, p, 12, -26, 30, 7, C.green);
    const body = () => circ(ctx, 0, -32, 25);
    volume(ctx, body, flat(C.green));
    ctx.save(); body(); ctx.clip(); ctx.translate(-3, -32); ctx.rotate(p.t * 0.012);
    ctx.strokeStyle = 'rgba(233,255,244,0.5)'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.ellipse(0, -8, 7.5, 14, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
    glintArc(ctx, 0, -32, 19);
    circ(ctx, 9, -34, 12); fs(ctx, '#FFFFFF', 3);
    eyes(ctx, p, 5, 13, -36, O, 2.8);
    if (p.eye !== 'hurt') { st(ctx, 2); ctx.beginPath(); ctx.arc(9, -31, 3.5, 0.6, 2.5); ctx.stroke(); }
  },
  // Four-point star split into two perspectives.
  gemini(ctx, p) {
    feet(ctx, p, C.violet, 9, 12);
    const fo = p.stance === 'focus', r = fo ? 32 : 29, k = r * 0.22, cy = -36;
    fist(ctx, p, 14, -30, 30, fo ? 9 : 6, fo ? C.violet : C.cyan);
    const star = () => {
      ctx.beginPath(); ctx.moveTo(0, cy - r);
      ctx.quadraticCurveTo(k, cy - k, r, cy); ctx.quadraticCurveTo(k, cy + k, 0, cy + r);
      ctx.quadraticCurveTo(-k, cy + k, -r, cy); ctx.quadraticCurveTo(-k, cy - k, 0, cy - r); ctx.closePath();
    };
    volume(ctx, star, (c) => { c.fillStyle = C.cobalt; c.fillRect(-45, -90, 45, 100); c.fillStyle = fo ? C.violet : C.cyan; c.fillRect(0, -90, 45, 100); }, 4, -2, -4);
    ctx.save(); ctx.strokeStyle = GLINT; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-2, cy - r + 9); ctx.quadraticCurveTo(-3, cy - 7, -8, cy - 4); ctx.stroke(); ctx.restore();
    [-1, 10].forEach((x) => { ctx.beginPath(); ctx.ellipse(x, -37, 4.6, 5.4, 0, 0, TAU); fs(ctx, '#FFFFFF', 2); });
    eyes(ctx, p, 0, 11, -36.5, O, 2.3);
  },
  // Jagged shard with horns, a hot visor slash and a toothy grin.
  grok(ctx, p) {
    feet(ctx, p, C.charcoal, 10, 14);
    fist(ctx, p, 12, -26, 32, 8, C.charcoal);
    const pts = [[-22, -6], [-28, -30], [-22, -60], [-8, -47], [8, -51], [27, -63], [22, -38], [29, -15], [17, -5]];
    const shape = (s = 1, sy = 1) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * s, y * sy) : ctx.moveTo(x * s, y * sy))); ctx.closePath(); };
    volume(ctx, () => shape(), flat(C.charcoal));
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-23, -34); ctx.lineTo(-19, -52); ctx.moveTo(-8, -43); ctx.lineTo(7, -47); ctx.lineTo(21, -56); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.shadowColor = C.red; ctx.shadowBlur = p.eye === 'fierce' ? 10 : 5;
    ctx.strokeStyle = C.red; ctx.lineCap = 'round'; ctx.lineWidth = p.blink ? 2 : p.eye === 'hurt' ? 3 : 5.5;
    ctx.beginPath(); ctx.moveTo(1, p.eye === 'fierce' ? -45 : -41); ctx.lineTo(21, -36); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(4, -24);
    [[7, -20], [10, -25], [13, -21], [16, -26], [19, -22], [21, -27]].forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(20, -29); ctx.lineTo(4, -26); ctx.closePath(); ctx.fill();
    if (p.charge > 0) { ctx.save(); ctx.strokeStyle = C.red; ctx.globalAlpha *= 0.3 + p.charge * 0.7; ctx.lineWidth = 3; shape(1.15, 1.1); ctx.stroke(); ctx.restore(); }
  },
  // Magnifying glass with an investigating eye.
  perplexity(ctx, p) {
    feet(ctx, p, C.teal, 9, 13);
    ctx.lineCap = 'round'; ctx.strokeStyle = O; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(-10, -22); ctx.lineTo(-25, -6); ctx.stroke();
    ctx.strokeStyle = C.teal; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = 'rgba(20,33,61,0.35)'; ctx.lineWidth = 2; ctx.beginPath();
    [[-16, -15], [-20, -11]].forEach(([x, y]) => { ctx.moveTo(x - 2.5, y - 2.5); ctx.lineTo(x + 2.5, y + 2.5); }); ctx.stroke();
    fist(ctx, p, 14, -30, 34, 6, C.teal);
    circ(ctx, 4, -38, 22); ctx.fillStyle = C.navy2; ctx.fill();
    ctx.lineWidth = 13; ctx.strokeStyle = O; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = C.teal; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(4, -38, 22, 0.1, 1.9); ctx.strokeStyle = SHADE; ctx.lineWidth = 7; ctx.stroke(); ctx.restore();
    ctx.strokeStyle = C.cyan; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(4, -38, 13, 3.5, 4.5); ctx.stroke();
    if (p.eye === 'hurt' || p.blink) eyes(ctx, p, 8, 8, -38, '#FFFFFF', 4);
    else {
      const sq = p.eye === 'fierce' ? 4.5 : 7;
      ctx.beginPath(); ctx.ellipse(8, -38, 7, sq, 0, 0, TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill();
      circ(ctx, 10, -38, 3.8); ctx.fillStyle = C.cyan; ctx.fill();
      circ(ctx, 10.6, -38, 1.8); ctx.fillStyle = O; ctx.fill();
      circ(ctx, 11.6, -39.6, 0.9); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    }
  },
  // Wobbly blob with chromatic ghosts, mismatched eyes and a smug smirk.
  hallucination(ctx, p) {
    const pts = [];
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU, r = 23 + Math.sin(i * 3 + p.t * 0.15) * 1.8; pts.push([Math.cos(a) * r, -31 + Math.sin(a) * r]); }
    const j = Math.sin(p.t * 0.21) * 2.5, k = Math.cos(p.t * 0.17) * 2.5;
    ctx.save(); ctx.globalAlpha *= 0.6;
    ctx.translate(-6 + j, 1); blob(ctx, pts); ctx.fillStyle = C.cyan; ctx.fill();
    ctx.translate(12 + k - j, -4); blob(ctx, pts); ctx.fillStyle = C.coral; ctx.fill();
    ctx.restore();
    feet(ctx, p, C.violet, 10, 13);
    fist(ctx, p, 12, -28, 30, 7, C.violet);
    volume(ctx, () => blob(ctx, pts), flat(C.violet));
    glintArc(ctx, 0, -31, 17);
    [3, 15].forEach((x, i) => { ctx.beginPath(); ctx.ellipse(x, -35, i ? 5.5 : 5, i ? 7 : 6.2, 0, 0, TAU); ctx.fillStyle = '#FFFFFF'; ctx.fill(); });
    if (p.eye === 'hurt' || p.blink) eyes(ctx, p, 3, 15, -34, O, 2.6);
    else {
      ctx.fillStyle = O; circ(ctx, 1.5, -37.5, 2.6); ctx.fill(); circ(ctx, 17, -34, 2.9); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; circ(ctx, 2.4, -38.6, 0.9); ctx.fill(); circ(ctx, 18, -35.2, 1); ctx.fill();
    }
    st(ctx, 2.5); ctx.beginPath(); ctx.moveTo(11, -46); ctx.quadraticCurveTo(16, -51, 21, -46); ctx.stroke();
    if (p.eye !== 'hurt') { ctx.beginPath(); ctx.moveTo(4, -24); ctx.quadraticCurveTo(12, -21, 18, -26); ctx.stroke(); }
  },
  // Pixel-shelled beetle with antennae and glitching segments.
  bug(ctx, p) {
    st(ctx, 2.5);
    for (let i = 0; i < 3; i++) {
      const lx = -13 + i * 11, s = Math.sin(p.leg + i * 1.7) * 3;
      ctx.beginPath(); ctx.moveTo(lx, -12); ctx.lineTo(lx - 5 + s, -6); ctx.lineTo(lx - 3 + s, 0); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(15, -28); ctx.quadraticCurveTo(15, -38, 19, -43); ctx.moveTo(21, -27); ctx.quadraticCurveTo(25, -35, 30, -38); ctx.stroke();
    circ(ctx, 19, -43, 3); fs(ctx, C.coral, 2); circ(ctx, 30, -38, 3); fs(ctx, C.coral, 2);
    fist(ctx, p, 14, -18, 22, 6, C.violet);
    const shell = () => { ctx.beginPath(); ctx.ellipse(-4, -24, 19, 15, 0, 0, TAU); };
    volume(ctx, shell, (c) => {
      c.fillStyle = C.navy2; c.fillRect(-40, -60, 80, 70);
      const off = p.t % 50 < 4 ? 3 : 0;
      for (let r = 0; r < 4; r++) for (let q = 0; q < 6; q++) if ((r * 2 + q * 3) % 5 === 0) { c.fillStyle = (r + q) % 3 ? C.violet : C.cyan; c.fillRect(-21 + q * 6.5 + (r === 1 ? off : 0), -37 + r * 7, 5.5, 5.5); }
    });
    st(ctx, 2); ctx.beginPath(); ctx.moveTo(-4, -39); ctx.quadraticCurveTo(-1, -24, -4, -9); ctx.stroke();
    glintArc(ctx, -4, -24, 13, 3.6, 4.3);
    circ(ctx, 17, -19, 10); fs(ctx, C.navy2, 3);
    if (p.eye === 'hurt' || p.blink) eyes(ctx, p, 15, 22, -21, C.cyan, 2.6);
    else { const f = p.eye === 'fierce' ? 1.5 : 0; glowRect(ctx, 13, -24 + f, 4, 6 - f, C.cyan); glowRect(ctx, 20, -24 + f, 4, 6 - f, C.cyan); }
    if (p.t % 50 < 4) { ctx.fillStyle = 'rgba(63,208,224,0.75)'; ctx.fillRect(-28, -30, 12, 5); ctx.fillStyle = 'rgba(232,104,74,0.75)'; ctx.fillRect(16, -14, 13, 4); }
  },
};

export function drawBody(ctx, id, p) { BODIES[id](ctx, p); }

let tintCv;
// Draws a body flattened toward one color (afterimages, hit flashes) on an offscreen canvas,
// so the tint covers only the silhouette and never what is behind it.
export function drawTinted(ctx, id, p, color, mix = 1) {
  if (!tintCv) tintCv = document.createElement('canvas');
  const m = ctx.getTransform(), k = Math.min(4, Math.max(1, Math.hypot(m.a, m.b)));
  const w = Math.ceil(180 * k), h = Math.ceil(150 * k);
  if (tintCv.width < w || tintCv.height < h) { tintCv.width = w; tintCv.height = h; }
  const t = tintCv.getContext('2d');
  t.setTransform(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, w, h);
  t.setTransform(k, 0, 0, k, 90 * k, 125 * k); drawBody(t, id, p);
  t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-atop'; t.globalAlpha = mix;
  t.fillStyle = color; t.fillRect(0, 0, w, h);
  t.globalCompositeOperation = 'source-over'; t.globalAlpha = 1;
  ctx.drawImage(tintCv, 0, 0, w, h, -90, -125, 180, 150);
}

// Soft contact shadow, shrinking as the fighter rises above the surface.
export function drawShadow(ctx, x, y, w, lift = 0) {
  const k = Math.max(0.25, 1 - lift / 240);
  ctx.save(); ctx.fillStyle = `rgba(20,33,61,${0.16 * k})`;
  ctx.beginPath(); ctx.ellipse(x, y + 1, (w / 2 + 6) * k, 5 * k, 0, 0, TAU); ctx.fill(); ctx.restore();
}

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