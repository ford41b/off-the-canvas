import React from 'react';
import { motion } from 'framer-motion';
import Portrait from './Portrait';
import { fighterDef } from '@/game/engine';

function Stats({ r, label }) {
  const f = fighterDef(r.id);
  return (
    <div className="rounded-xl bg-white border-2 border-[#14213D]/15 p-3 font-mono text-xs">
      <p className="font-bold mb-1" style={{ color: f.color === '#26282F' ? '#E23D3D' : f.color }}>{label} · {f.name}</p>
      {[['Damage dealt', Math.round(r.dealt) + '%'], ['KOs', r.kos], ['Falls', r.falls], ['Best combo', r.maxCombo + ' hits']].map(([a, b]) => (
        <div key={a} className="flex justify-between gap-6"><span className="opacity-60">{a}</span><span>{b}</span></div>
      ))}
    </div>
  );
}

export default function Results({ result, labels, onRematch, onSelect, onMenu }) {
  const w = result.tie ? null : result.fighters[result.winner];
  const btn = 'px-6 py-3 rounded-xl border-2 border-[#14213D] font-display font-bold tracking-wider transition hover:-translate-y-0.5';
  return (
    <motion.div className="fixed inset-0 bg-[#F4F1EA] overflow-y-auto text-[#14213D]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="min-h-full flex flex-col items-center justify-center gap-6 p-6">
        {result.tie ? (
          <div className="relative w-full max-w-3xl h-56 flex items-center justify-center overflow-hidden">
            <motion.div className="absolute left-0 inset-y-8 w-1/2 bg-[#E8684A]" style={{ clipPath: 'polygon(0 0,100% 20%,85% 100%,0 100%)' }} initial={{ x: '-100%' }} animate={{ x: '6%' }} transition={{ type: 'spring', stiffness: 120 }} />
            <motion.div className="absolute right-0 inset-y-8 w-1/2 bg-[#2F5BEA]" style={{ clipPath: 'polygon(15% 0,100% 0,100% 100%,0 80%)' }} initial={{ x: '100%' }} animate={{ x: '-6%' }} transition={{ type: 'spring', stiffness: 120 }} />
            <div className="absolute left-[12%] z-10"><Portrait id={result.fighters[0].id} size={130} /></div>
            <div className="absolute right-[12%] z-10"><Portrait id={result.fighters[1].id} size={130} facing={-1} /></div>
            <motion.div className="relative z-10 bg-[#14213D] text-white px-5 py-3 rounded-lg font-mono font-bold tracking-widest" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}>RESULT INCONCLUSIVE</motion.div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="font-mono text-xs tracking-[0.3em] opacity-60">{labels[result.winner]} WINS</p>
            <motion.div initial={{ scale: 0.6, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} className="rounded-3xl my-2" style={{ background: fighterDef(w.id).color + '22' }}>
              <Portrait id={w.id} size={200} />
            </motion.div>
            <h1 className="font-display font-bold text-5xl md:text-6xl">{fighterDef(w.id).name.toUpperCase()}</h1>
            <p className="font-mono text-sm mt-1 text-[#E8684A]">&gt; {fighterDef(w.id).lines.ko[0]}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          <Stats r={result.fighters[0]} label={labels[0]} /><Stats r={result.fighters[1]} label={labels[1]} />
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={onRematch} className={`${btn} bg-[#E8684A] text-white`}>REMATCH</button>
          <button onClick={onSelect} className={`${btn} bg-white`}>CHANGE FIGHTERS</button>
          <button onClick={onMenu} className={`${btn} bg-white`}>MAIN MENU</button>
        </div>
      </div>
    </motion.div>
  );
}