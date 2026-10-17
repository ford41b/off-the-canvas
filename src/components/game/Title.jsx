import React from 'react';
import { motion } from 'framer-motion';
import Portrait from './Portrait';
import { sfx, initAudio } from '@/game/audio';

const ITEMS = [['FIGHT', 'fight'], ['TRAINING', 'training'], ['WATCH INTRO', 'intro'], ['SETTINGS', 'settings']];

export default function Title({ onPick, reveal }) {
  const go = (v) => { initAudio(); sfx('select'); onPick(v); };
  return (
    <motion.div className="fixed inset-0 bg-[#F4F1EA] overflow-hidden" initial={{ opacity: reveal ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {reveal && (
        <>
          <motion.div className="absolute inset-y-0 left-0 w-[60%] bg-[#E8684A] z-20" style={{ clipPath: 'polygon(0 0,100% 0,80% 100%,0 100%)' }} initial={{ x: 0 }} animate={{ x: '-105%' }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }} />
          <motion.div className="absolute inset-y-0 right-0 w-[60%] bg-[#2F5BEA] z-20" style={{ clipPath: 'polygon(20% 0,100% 0,100% 100%,0 100%)' }} initial={{ x: 0 }} animate={{ x: '105%' }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }} />
        </>
      )}
      <div className="absolute left-[4%] bottom-[12%] hidden md:block"><Portrait id="claude" size={260} /></div>
      <div className="absolute right-[4%] bottom-[12%] hidden md:block"><Portrait id="codex" size={260} facing={-1} /></div>
      <div className="absolute left-0 right-0 bottom-[12%] h-1 bg-[#14213D]/80 mx-[3%]" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        <p className="font-mono text-xs tracking-[0.4em] text-[#14213D]/60 mb-4">A PLATFORM FIGHTER</p>
        <h1 className="font-display font-bold text-[#14213D] text-center leading-[0.85] tracking-tight text-6xl md:text-8xl">
          OFF THE<br /><span className="relative">CANVAS<span className="absolute -right-6 top-1 w-4 h-4 bg-[#E8684A]" /><span className="absolute -right-6 top-6 w-4 h-4 bg-[#2F5BEA]" /></span>
        </h1>
        <nav className="mt-12 flex flex-col gap-2 w-64">
          {ITEMS.map(([label, v], i) => (
            <motion.button key={v} onMouseEnter={() => sfx('menu')} onClick={() => go(v)} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.07 }}
              className={`group text-left px-5 py-3 rounded-lg border-2 border-[#14213D] font-display font-bold tracking-wider transition ${i === 0 ? 'bg-[#14213D] text-white hover:bg-[#E8684A] hover:border-[#E8684A]' : 'bg-white text-[#14213D] hover:bg-[#2F5BEA] hover:text-white hover:border-[#2F5BEA]'}`}>
              <span className="font-mono text-xs opacity-50 mr-3">0{i + 1}</span>{label}
            </motion.button>
          ))}
        </nav>
        <p className="mt-10 font-mono text-[11px] text-[#14213D]/50">&gt; claude vs codex: result inconclusive</p>
      </div>
    </motion.div>
  );
}