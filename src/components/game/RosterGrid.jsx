import React from 'react';
import Portrait from './Portrait';
import { FIGHTERS } from '@/game/fighters';

export default function RosterGrid({ p1, p2, onPick }) {
  return (
    <div className="grid grid-cols-4 gap-2 md:gap-3">
      {FIGHTERS.map((f, i) => {
        const a = p1 === f.id, b = p2 === f.id;
        return (
          <button key={f.id} type="button" onClick={() => onPick(f.id)} aria-label={`${f.name}, ${f.title}${a ? ', picked by P1' : ''}${b ? ', picked by P2' : ''}`}
            className={`relative rounded-xl bg-white border-2 p-1 md:p-2 flex flex-col items-center transition hover:-translate-y-1 ${a || b ? 'border-[#14213D]' : 'border-[#14213D]/15'}`}>
            {f.flagship && <span className="absolute top-1 left-1 font-mono text-[8px] md:text-[9px] px-1 rounded bg-[#14213D] text-white">RIVAL</span>}
            <div className="absolute top-1 right-1 flex gap-1">
              {a && <span className="font-mono text-[9px] font-bold px-1 rounded bg-[#E8684A] text-white">P1</span>}
              {b && <span className="font-mono text-[9px] font-bold px-1 rounded bg-[#2F5BEA] text-white">P2</span>}
            </div>
            <div className="rounded-lg w-full flex justify-center" style={{ background: f.color + '14' }}><Portrait id={f.id} size={72} /></div>
            <span className="font-display font-bold text-[11px] md:text-sm mt-1 truncate max-w-full">{f.name}</span>
            <span className="hidden md:block font-mono text-[9px] opacity-60" aria-hidden="true">0{i + 1}</span>
          </button>
        );
      })}
    </div>
  );
}