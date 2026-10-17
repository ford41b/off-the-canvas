import React, { useEffect, useRef } from 'react';
import { STAGES, STAGE_IDS } from '@/game/stages';
import { drawStage } from '@/game/render';
import { sfx } from '@/game/audio';

function Thumb({ id, w = 168, h = 84 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, dpr = window.devicePixelRatio || 1, ctx = c.getContext('2d');
    c.width = w * dpr; c.height = h * dpr;
    const stage = structuredClone(STAGES[id]);
    stage.plats.forEach((p) => { p.x0 = p.x; p.y0 = p.y; });
    const k = w / 960;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = stage.theme.bg; ctx.fillRect(0, 0, w, h);
    ctx.setTransform(dpr * k, 0, 0, dpr * k, -160 * k * dpr, -150 * k * dpr);
    drawStage(ctx, { stage, platforms: [], frame: 0, reduced: true });
  }, [id, w, h]);
  return <canvas ref={ref} style={{ aspectRatio: '2 / 1' }} className="w-full rounded-lg block" aria-hidden="true" />;
}

export default function StagePicker({ value, onChange }) {
  const opts = [...STAGE_IDS, 'random'];
  return (
    <div role="radiogroup" aria-label="Stage" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {opts.map((id) => {
        const on = value === id, s = STAGES[id];
        return (
          <button key={id} type="button" role="radio" aria-checked={on} onClick={() => { sfx('menu'); onChange(id); }}
            className={`rounded-xl bg-white border-2 p-1.5 text-left transition hover:-translate-y-0.5 ${on ? 'border-[#14213D] shadow-[3px_3px_0_#14213D]' : 'border-[#14213D]/15'}`}>
            {s ? <Thumb id={id} /> : (
              <div className="rounded-lg aspect-[2/1] bg-[#14213D] text-white flex items-center justify-center font-display font-bold text-3xl" aria-hidden="true">?</div>
            )}
            <p className="font-display font-bold text-xs mt-1 truncate">{s ? s.name : 'Random'}</p>
            <p className="font-mono text-[9px] opacity-70 leading-tight line-clamp-2 min-h-[22px]">{s ? s.blurb : 'Any stage. Rolled fresh every match.'}</p>
          </button>
        );
      })}
    </div>
  );
}
