import React, { useState } from 'react';
import Portrait from './Portrait';
import SpecialPreview from './SpecialPreview';

function Bar({ label, v, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 font-mono text-[10px] tracking-wider opacity-60">{label}</span>
      <div className="flex gap-1">{[1, 2, 3, 4, 5].map((i) => <span key={i} className="w-5 h-2 rounded-sm" style={{ background: i <= v ? color : 'rgba(20,33,61,0.12)' }} />)}</div>
    </div>
  );
}

export default function FighterPanel({ f, label, color, facing = 1, active, onActivate }) {
  const [preview, setPreview] = useState(false);
  return (
    <div onClick={onActivate} className={`flex-1 min-w-0 rounded-2xl bg-white border-2 p-4 transition cursor-pointer ${active ? 'border-[#14213D] shadow-[6px_6px_0_rgba(20,33,61,0.15)]' : 'border-[#14213D]/20'}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded text-white" style={{ background: color }}>{label}</span>
        <button onClick={(e) => { e.stopPropagation(); setPreview((p) => !p); }} className="font-mono text-[10px] tracking-wider underline opacity-70 hover:opacity-100">
          {preview ? 'HIDE PREVIEW' : '▶ PREVIEW SPECIAL'}
        </button>
      </div>
      <div className="flex gap-4 items-center mt-2">
        <div className="shrink-0 rounded-xl" style={{ background: f.color + '1A' }}><Portrait key={f.id} id={f.id} size={110} facing={facing} /></div>
        <div className="min-w-0">
          <h2 className="font-display font-bold text-2xl leading-none">{f.name}</h2>
          <p className="font-mono text-[11px] mt-1" style={{ color: f.color === '#26282F' ? '#E23D3D' : f.color }}>{f.title.toUpperCase()}</p>
          <p className="text-xs mt-2 opacity-75 leading-snug">{f.blurb}</p>
        </div>
      </div>
      {preview ? <div className="mt-3"><SpecialPreview id={f.id} /></div> : (
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Bar label="POWER" v={f.stats.power} color={f.color} /><Bar label="SPEED" v={f.stats.speed} color={f.color} />
            <Bar label="RECOVERY" v={f.stats.recovery} color={f.color} /><Bar label="DIFFICULTY" v={f.stats.difficulty} color="#14213D" />
          </div>
          <div className="rounded-lg bg-[#14213D] text-white p-2.5">
            <p className="font-mono text-[10px] text-[#3FD0E0]">&gt; SPECIAL: {f.special.name.toUpperCase()}</p>
            <p className="text-[11px] mt-1 opacity-85 leading-snug">{f.special.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
}