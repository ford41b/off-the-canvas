import { C, W, H } from './palette';
import { drawBody, idlePose } from './bodies';
import { iterVariant, ITER_LABEL } from './specials';

const CD_MAX = { claude: 50, codex: 360, chatgpt: 40, gemini: 45, grok: 70, perplexity: 110, hallucination: 130, bug: 90 };
const dmgColor = (d) => (d < 50 ? C.ink : d < 100 ? C.coral : C.red);

function status(g, f) {
  const id = f.def.id, opp = g.fighters[1 - f.idx];
  if (id === 'gemini') return f.stance === 'focus' ? 'FOCUS MODE' : 'FLASH MODE';
  if (id === 'chatgpt') return 'NEXT: ' + ITER_LABEL[iterVariant(f)];
  if (id === 'perplexity') return opp.mark > 0 ? 'TARGET MARKED' : '';
  if (id === 'codex') { const p = g.platforms.find((q) => q.owner === f.idx); return p ? 'PATCH LIVE ' + Math.ceil(p.life / 60) + 's' : ''; }
  return '';
}

function card(ctx, g, f, x, y, label) {
  const w = 270, h = 82;
  ctx.save();
  ctx.fillStyle = 'rgba(20,33,61,0.08)'; ctx.beginPath(); ctx.roundRect(x + 5, y + 6, w, h, 16); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = f.def.color; ctx.beginPath(); ctx.roundRect(x + 8, y + 8, 64, 66, 10); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x + 8, y + 8, 64, 66, 10); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(x + 8, y + 8, 64, 66);
  ctx.translate(x + 40, y + 70); ctx.scale(0.85, 0.85); drawBody(ctx, f.def.id, idlePose(g.frame, { stance: f.stance, eye: f.hitstun > 0 ? 'hurt' : 'idle' })); ctx.restore();
  ctx.fillStyle = f.def.color; ctx.font = '700 11px "JetBrains Mono", monospace'; ctx.fillText(label, x + 84, y + 22);
  ctx.fillStyle = C.ink; ctx.font = '700 14px "Space Grotesk", sans-serif'; ctx.fillText(f.def.name.toUpperCase(), x + 84 + ctx.measureText(label).width * 0 + 30, y + 22);
  ctx.fillStyle = dmgColor(f.damage); ctx.font = '700 34px "Space Grotesk", sans-serif';
  ctx.fillText(f.dead ? '—' : Math.floor(f.damage) + '%', x + 84, y + 58);
  if (!g.training) for (let i = 0; i < f.stocks; i++) { ctx.fillStyle = f.def.color; ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + w - 20 - i * 16, y + 46, 6, 0, 7); ctx.fill(); ctx.stroke(); }
  const ready = f.cd === 0 && f.act?.name !== 'charge';
  const frac = ready ? 1 : 1 - f.cd / CD_MAX[f.def.id];
  ctx.fillStyle = 'rgba(20,33,61,0.12)'; ctx.fillRect(x + 84, y + 67, w - 100, 4);
  ctx.fillStyle = ready ? f.def.color : C.ink; ctx.fillRect(x + 84, y + 67, (w - 100) * frac, 4);
  ctx.font = '600 9px "JetBrains Mono", monospace'; ctx.fillStyle = C.ink; ctx.textAlign = 'right';
  ctx.fillText(status(g, f) || (ready ? f.def.special.name.toUpperCase() : ''), x + w - 16, y + 63);
  ctx.restore();
}

export function drawHUD(ctx, g, opt) {
  const [a, b] = g.fighters;
  card(ctx, g, a, W / 2 - 300, H - 98, 'P1');
  card(ctx, g, b, W / 2 + 30, H - 98, opt.p2Label || 'P2');
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