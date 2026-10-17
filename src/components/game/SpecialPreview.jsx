import React, { useEffect, useRef } from 'react';
import { createGame, step, blankInput } from '@/game/engine';
import { render } from '@/game/render';

// Scripted inputs that showcase each special (or ranged attack) using the real engine.
function rangedScript(id, t) {
  const i = blankInput(), d = blankInput();
  if (id === 'perplexity') { if (t === 10) i.special = true; if (t === 60) i.shoot = true; }
  else if (t === 10) i.shoot = true;
  if (id === 'chatgpt' && t === 40) i.special = true;
  if (id === 'gemini') { if (t === 60) i.special = true; if (t === 92) i.shoot = true; }
  if (id === 'claude' && t > 50 && t < 85) d.left = true;
  return [i, d];
}

function script(id, t) {
  const i = blankInput(), d = blankInput();
  if (id === 'claude') { if (t === 10) i.special = true; if (t === 16) d.attack = true; }
  else if (id === 'codex') { if (t === 10) i.jump = true; if (t === 30) i.special = true; if (t > 40 && t < 70) i.right = true; }
  else if (id === 'chatgpt') { if (t === 10) i.attack = true; if (t === 30) i.special = true; }
  else if (id === 'gemini') { if (t === 10 || t === 70) i.special = true; if (t === 40 || t === 100) i.heavy = true; }
  else if (id === 'grok') { if (t >= 10 && t < 70) i.special = true; }
  else if (id === 'perplexity') { if (t === 10) i.special = true; if (t === 50) i.heavy = true; }
  else if (id === 'hallucination') { if (t === 10) i.special = true; }
  else if (id === 'bug') { if (t === 10) { i.special = true; i.right = true; } }
  return [i, d];
}

export default function SpecialPreview({ id, kind = 'special' }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, ctx = c.getContext('2d');
    const ranged = kind === 'ranged', close = !ranged && (id === 'claude' || id === 'chatgpt' || id === 'grok');
    const play = ranged ? rangedScript : script;
    let g, t = 0, raf;
    const reset = () => {
      g = createGame({ p1: id, p2: id === 'codex' ? 'claude' : 'codex', mode: 'training', banter: false });
      g.fighters[0].x = ranged ? 520 : 560; g.fighters[1].x = ranged ? 820 : close ? 640 : 800;
    };
    reset();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      step(g, play(id, t)); g.events.length = 0;
      if (++t > 160) { reset(); t = 0; }
      const w = c.clientWidth, h = c.clientHeight, dpr = window.devicePixelRatio || 1;
      if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; }
      render(ctx, g, { scale: c.width / 1280, fixedCam: ranged ? { x: 670, y: 440, z: 1.45 } : { x: 660, y: 450, z: 1.7 }, hud: false, banter: false });
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [id, kind]);
  return <canvas ref={ref} role="img" aria-label={`Looping demo of the ${kind} move`} className="w-full aspect-video rounded-xl border-2 border-[#14213D] bg-[#F4F1EA]" />;
}