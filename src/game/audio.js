let ctx, master, sfxGain;
let vol = { master: 0.8, sfx: 0.8, muted: false };

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); sfxGain = ctx.createGain();
  sfxGain.connect(master); master.connect(ctx.destination); apply();
}
function apply() { if (!ctx) return; master.gain.value = vol.muted ? 0 : vol.master; sfxGain.gain.value = vol.sfx; }
export function setVolumes(s) { vol = { master: s.master, sfx: s.sfx, muted: s.muted }; apply(); }

function tone(freq, dur, type = 'sine', gain = 0.15, slide = 0, delay = 0) {
  const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, gain = 0.2, freq = 1500) {
  const t = ctx.currentTime, len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = gain;
  s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t);
}
const SPECIAL = {
  claude: () => tone(880, 0.12, 'triangle', 0.1), codex: () => { tone(660, 0.06, 'square', 0.06); tone(990, 0.08, 'square', 0.06, 0, 0.06); },
  chatgpt: () => tone(520, 0.15, 'sine', 0.12, 260), gemini: () => { tone(440, 0.1, 'triangle', 0.1); tone(660, 0.1, 'triangle', 0.1, 0, 0.08); },
  grok: () => tone(110, 0.2, 'sawtooth', 0.08), grok2: () => { noise(0.3, 0.3, 900); tone(90, 0.3, 'sawtooth', 0.15, -40); },
  perplexity: () => tone(1200, 0.1, 'sine', 0.08, -400), hallucination: () => tone(700, 0.25, 'sine', 0.08, -350),
  bug: () => { tone(180, 0.04, 'square', 0.08); tone(1400, 0.04, 'square', 0.06, 0, 0.04); }, rec: () => noise(0.15, 0.12, 2500),
};
const SHOOT = {
  claude: () => tone(440, 0.22, 'triangle', 0.1, 220), codex: () => tone(1300, 0.05, 'square', 0.05, -300),
  chatgpt: () => tone(600, 0.12, 'sine', 0.1, 300), gemini: () => { tone(880, 0.08, 'triangle', 0.07, 300); tone(1100, 0.08, 'triangle', 0.06, 300, 0.05); },
  grok: () => { tone(160, 0.18, 'sawtooth', 0.08, 120); noise(0.12, 0.12, 1200); }, perplexity: () => { [0, 0.04, 0.08].forEach((d) => tone(1500, 0.04, 'sine', 0.06, -200, d)); },
  hallucination: () => tone(500, 0.3, 'sine', 0.08, 500), bug: () => { tone(240, 0.03, 'square', 0.06); tone(1800, 0.03, 'square', 0.04, 0, 0.05); },
};

export function sfx(name, p = {}) {
  if (!ctx) return;
  switch (name) {
    case 'menu': tone(660, 0.05, 'triangle', 0.08); break;
    case 'select': tone(520, 0.08, 'square', 0.06); tone(780, 0.12, 'square', 0.06, 0, 0.07); break;
    case 'hit': noise(0.06 + p.power * 0.006, 0.25, 1200 + p.power * 60); tone(220 - p.power * 5, 0.12, 'triangle', 0.15, -80); break;
    case 'ko': noise(0.6, 0.35, 700); tone(160, 0.7, 'sawtooth', 0.15, -120); break;
    case 'jump': tone(320, 0.08, 'sine', 0.06, 200); break;
    case 'land': noise(0.04, 0.06, 400); break;
    case 'swing': noise(0.05, 0.05, p.heavy ? 1500 : 4000); break;
    case 'dodge': tone(900, 0.08, 'sine', 0.05, -500); break;
    case 'counter': tone(1400, 0.2, 'triangle', 0.12, -600); noise(0.15, 0.2, 3000); break;
    case 'charge': tone(200 + p.level * 400, 0.1, 'sawtooth', 0.05); break;
    case 'denied': tone(150, 0.06, 'square', 0.05); break;
    case 'pop': tone(500, 0.15, 'sine', 0.08, -300); break;
    case 'special': SPECIAL[p.id]?.(); break;
    case 'shoot': SHOOT[p.id]?.(); break;
    case 'boom': noise(0.45, 0.4, 600); tone(70, 0.4, 'sawtooth', 0.16, -30); break;
    case 'clash': tone(1700, 0.08, 'triangle', 0.08, -900); noise(0.05, 0.12, 4000); break;
    case 'catch': tone(700, 0.08, 'sine', 0.08, 400); break;
    default:
  }
}

export function playEvents(events) { for (const e of events) sfx(e.type, e); events.length = 0; }