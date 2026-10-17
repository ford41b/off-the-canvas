import React from 'react';

const ROWS = [
  ['Move', 'A / D', '← / →'], ['Jump (2x)', 'W / Space', '↑'], ['Fast fall / drop', 'S', '↓'],
  ['Quick attack', 'F', 'K / Num1'], ['Heavy attack', 'G', 'L / Num2'], ['Signature special', 'H', '; / Num3'],
  ['Recovery', 'W + H', '↑ + ;'], ['Dodge', 'L-Shift', 'R-Shift / Num0'], ['Pause', 'Esc / P', 'Esc / P'],
];

export default function Controls({ single }) {
  return (
    <div className="font-mono text-xs text-[#14213D]">
      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
        <span className="opacity-50">ACTION</span><span className="text-[#E8684A] font-bold">P1</span><span className="text-[#2F5BEA] font-bold">P2</span>
        {ROWS.map(([a, b, c]) => (
          <div key={a} className="contents"><span className="opacity-70">{a}</span><span>{b}</span><span>{c}</span></div>
        ))}
      </div>
      <p className="mt-3 opacity-60">Aerials: attack in the air, hold ↑/↓ for up/down variants. Up + attack on ground = anti-air.{single ? ' Solo modes accept both key sets for P1.' : ''}</p>
    </div>
  );
}