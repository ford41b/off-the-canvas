import { C, W, H } from './palette';
import { drawBody, idlePose } from './bodies';
import { iterVariant, ITER_LABEL } from './specials';

const dmgColor = (d) => (d < 50 ? C.ink : d < 100 ? C.coral : C.red);

function status(g, f) {
  const id = f.def.id, opp = g.fighters[1 - f.idx];
  if (id === 'gemini') return f.stance === 'focus' ? 'FOCUS MODE' : 'FLASH MODE';
  if (id === 'chatgpt') return 'NEXT: ' + ITER_LABEL[iterVariant(f)];
  if (id === 'perplexity') return opp.mark > 0 ? 'TARGET MARKED' : '';
  if (id === 'codex') { const p = g.platforms.find((q) => q.owner === f.idx); return p ? 'PATCH LIVE ' + Math.ceil(p.life / 60) + 's' : ''; }
  return '';
}

// Cooldown meter with its own label; fills in ink while recharging, fighter color when ready.
function meter(ctx, x, y, w, frac, ready, color, label) {
  ctx.font = '600 9px "JetBrains Mono", monospace'; ctx.textAlign = 'left';
  ctx.fillStyle = ready ? C.ink : 'rgba(20,33,61,0.5)'; ctx.fillText(label, x, y - 4);
  ctx.fillStyle = 'rgba(20,33,61,0.12)'; ctx.beginPath(); ctx.roundRect(x, y, w, 5, 2.5); ctx.fill();
  ctx.fillStyle = ready ? color : 'rgba(20,33,61,0.55)'; ctx.beginPath(); ctx.roundRect(x, y, Math.max(5, w * frac), 5, 2.5); ctx.fill();
}

function card(ctx, g, f, x, y, label) {
  const w = 290, h = 88;
  ctx.save();
  ctx.fillStyle = 'rgba(20,33,61,0.08)'; ctx.beginPath(); ctx.roundRect(x + 5, y + 6, w, h, 16); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x + 8, y + 8, 66, h - 16, 10); ctx.clip();
  ctx.fillStyle = f.def.color; ctx.fillRect(x + 8, y + 8, 66, h - 16);
  ctx.fillStyle = 'rgba(255,255,255,0.84)'; ctx.fillRect(x + 8, y + 8, 66, h - 16);
  ctx.translate(x + 41, y + h - 14); ctx.scale(0.86, 0.86);
  drawBody(ctx, f.def.id, idlePose(g.frame, { stance: f.stance, eye: f.hitstun > 0 ? 'hurt' : 'idle' })); ctx.restore();
  const tx = x + 86;
  ctx.font = '700 11px "JetBrains Mono", monospace'; const lw = ctx.measureText(label).width + 10;
  ctx.fillStyle = f.def.color; ctx.beginPath(); ctx.roundRect(tx, y + 10, lw, 16, 4); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'middle'; ctx.fillText(label, tx + 5, y + 18.5);
  const name = f.def.name.toUpperCase(), room = x + w - 14 - (tx + lw + 7);
  let fsz = 14; ctx.font = `700 ${fsz}px "Space Grotesk", sans-serif`;
  while (fsz > 10 && ctx.measureText(name).width > room) { fsz--; ctx.font = `700 ${fsz}px "Space Grotesk", sans-serif`; }
  ctx.fillStyle = C.ink; ctx.fillText(name, tx + lw + 7, y + 18.5);
  ctx.textBaseline = 'alphabetic';
  // Damage readout jolts when hit.
  const j = f.hitFlash > 0 && !g.reduced ? f.hitFlash * 0.8 : 0;
  ctx.save(); ctx.translate(tx + j * (g.frame % 2 ? 1 : -1), y + 56 - j * 0.6); const sc = 1 + j * 0.03; ctx.scale(sc, sc);
  ctx.fillStyle = dmgColor(f.damage); ctx.font = '700 34px "Space Grotesk", sans-serif';
  ctx.fillText(f.dead ? '—' : Math.floor(f.damage) + '%', 0, 0); ctx.restore();
  if (!g.training) for (let i = 0; i < f.stocks; i++) { ctx.fillStyle = f.def.color; ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + w - 20 - i * 16, y + 45, 6, 0, 7); ctx.fill(); ctx.stroke(); }
  const ready = f.cd === 0 && f.act?.name !== 'charge';
  const sp = status(g, f) || f.def.special.name.toUpperCase();
  meter(ctx, tx, y + 74, 112, ready ? 1 : 1 - f.cd / f.cdMax, ready, f.def.color, sp);
  meter(ctx, tx + 124, y + 74, w - 124 - 86 - 12, f.rcd === 0 ? 1 : 1 - f.rcd / f.rcdMax, f.rcd === 0, f.def.color, 'RANGED');
  ctx.restore();
}

export function drawHUD(ctx, g, opt) {
  const [a, b] = g.fighters;
  card(ctx, g, a, W / 2 - 310, H - 102, 'P1');
  card(ctx, g, b, W / 2 + 20, H - 102, opt.p2Label || 'P2');
  ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = C.ink;
  ctx.font = '600 11px "JetBrains Mono", monospace'; ctx.globalAlpha = 0.6;
  ctx.fillText(g.training ? 'TRAINING · R reset · T dummy on/off · Y hitboxes · ESC pause' : 'INFINITE CANVAS · ESC pause', W / 2, 28);
  ctx.globalAlpha = 1;
  if (g.frame < 60 && !g.training) { ctx.font = '700 64px "Space Grotesk", sans-serif'; ctx.globalAlpha = 1 - g.frame / 60; ctx.fillText('FIGHT', W / 2, H / 2 - 40); }
  if (g.over) {
    const k = Math.min(1, g.overT / 15);
    ctx.globalAlpha = k; ctx.font = '700 96px "Space Grotesk", sans-serif';
    ctx.fillStyle = g.over.tie ? C.coral : C.ink; ctx.fillText(g.over.tie ? '…?' : 'GAME!', W / 2, H / 2 - 30);
  }
  ctx.restore();
}