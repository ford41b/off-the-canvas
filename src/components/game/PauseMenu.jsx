import React from 'react';
import Controls from './Controls';

export default function PauseMenu({ onResume, onRestart, onQuit, single }) {
  const btn = 'w-full px-4 py-2.5 rounded-lg border-2 border-[#14213D] font-display font-bold tracking-wider transition';
  return (
    <div className="absolute inset-0 z-20 bg-[#F4F1EA]/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border-2 border-[#14213D] shadow-[8px_8px_0_rgba(20,33,61,0.15)] p-6 w-full max-w-lg text-[#14213D]">
        <p className="font-mono text-xs text-[#E8684A]">&gt; process suspended</p>
        <h2 className="font-display font-bold text-4xl mb-4">PAUSED</h2>
        <div className="grid grid-cols-3 gap-2 mb-5">
          <button onClick={onResume} className={`${btn} bg-[#14213D] text-white hover:bg-[#2F5BEA]`}>RESUME</button>
          <button onClick={onRestart} className={`${btn} bg-white hover:bg-[#F4F1EA]`}>RESTART</button>
          <button onClick={onQuit} className={`${btn} bg-white hover:bg-[#E8684A] hover:text-white`}>MENU</button>
        </div>
        <Controls single={single} />
      </div>
    </div>
  );
}