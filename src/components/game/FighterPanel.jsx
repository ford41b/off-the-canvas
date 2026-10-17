import React, { useState } from 'react';
import Portrait from './Portrait';
import SpecialPreview from './SpecialPreview';
import { labelColor } from '@/game/palette';

function Bar({ label, v, color }) {
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`${label.toLowerCase()} ${v} of 5`}>
      <span className="w-20 font-mono text-[10px] tracking-wider opacity-75">{label}</span>
      <div className="flex gap-1">{[1, 2, 3, 4, 5].map((i) => <span key={i} className="w-5 h-2 rounded-sm" style={{ background: i <= v ? color : 'rgba(20,33,61,0.12)' }} />)}</div>
    </div>
  );
}

function Move({ kind, move }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-[#3FD0E0]">&gt; {kind}: {move.name.toUpperCase()}</p>
      <p className="text-[11px] mt-0.5 opacity-85 leading-snug">{move.desc}</p>
    </div>
  );
}

const TABS = [['special', 'SPECIAL'], ['ranged', 'RANGED']];

export default function FighterPanel({ f, label, color, facing = 1, active, onActivate }) {
  const [preview, setPreview] = useState(null);
  return (
    <div onClick={onActivate} className={`flex-1 min-w-0 rounded-2xl bg-white border-2 p-4 transition cursor-pointer ${active ? 'border-[#14213D] shadow-[6px_6px_0_rgba(20,33,61,0.15)]' : 'border-[#14213D]/20'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded text-white" style={{ background: color }}>{label}</span>
        <div className="flex items-center gap-1 font-mono text-[10px] tracking-wider" role="group" aria-label={`Preview ${f.name}'s moves`}>
          <span className="opacity-75 mr-1 hidden sm:inline">PREVIEW</span>
          {TABS.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={preview === k} onClick={(e) => { e.stopPropagation(); setPreview((p) => (p === k ? null : k)); }}
              className={`px-2 py-1 rounded-md border-2 transition ${preview === k ? 'bg-[#14213D] text-white border-[#14213D]' : 'border-[#14213D]/20 hover:border-[#14213D]'}`}>
              {preview === k ? '■' : '▶'} {l}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-4 items-center mt-2">
        <div className="shrink-0 rounded-xl" style={{ background: f.color + '1A' }}><Portrait key={f.id} id={f.id} size={110} facing={facing} /></div>
        <div className="min-w-0">
          <h2 className="font-display font-bold text-2xl leading-none">{f.name}</h2>
          <p className="font-mono text-[11px] mt-1 font-semibold" style={{ color: labelColor(f) }}>{f.title.toUpperCase()}</p>
          <p className="text-xs mt-2 opacity-80 leading-snug">{f.blurb}</p>
        </div>
      </div>
      {preview ? <div className="mt-3"><SpecialPreview key={f.id + preview} id={f.id} kind={preview} /></div> : (
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Bar label="POWER" v={f.stats.power} color={f.color} /><Bar label="SPEED" v={f.stats.speed} color={f.color} />
            <Bar label="RANGE" v={f.stats.range} color={f.color} /><Bar label="RECOVERY" v={f.stats.recovery} color={f.color} />
            <Bar label="DIFFICULTY" v={f.stats.difficulty} color="#14213D" />
          </div>
          <div className="rounded-lg bg-[#14213D] text-white p-2.5 space-y-2">
            <Move kind="SPECIAL" move={f.special} />
            <Move kind="RANGED" move={f.ranged} />
          </div>
        </div>
      )}
    </div>
  );
}
