import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Portrait from './Portrait';
import { fighterDef } from '@/game/engine';
import { labelColor } from '@/game/palette';
import { COURSE_META } from '@/game/dash/courses';
import { fmtTime } from '@/game/dash/race';

const ORD = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH'];

export default function DashResults({ result, onAgain, onSetup, onMenu }) {
  const me = result.list.find((r) => !r.bot), f = fighterDef(me.id), m = COURSE_META[result.course];
  const btn = 'px-6 py-3 rounded-xl border-2 border-[#14213D] font-display font-bold tracking-wider transition hover:-translate-y-0.5';
  useEffect(() => {
    const k = (e) => { if (e.code === 'Enter') onAgain(); if (e.code === 'Escape') onSetup(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onAgain, onSetup]);
  const headline = result.solo ? 'COURSE CLEAR' : result.place === 1 ? 'YOU WIN' : `${ORD[result.place - 1]} PLACE`;
  return (
    <motion.div className="fixed inset-0 bg-[#F4F1EA] overflow-y-auto text-[#14213D]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="min-h-full flex flex-col items-center justify-center gap-5 p-6">
        <div className="flex flex-col items-center text-center">
          <p className="font-mono text-xs tracking-[0.3em] opacity-75">{m.name.toUpperCase()} · {'★'.repeat(m.diff)}</p>
          <motion.div initial={{ scale: 0.6, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} className="rounded-3xl my-2" style={{ background: f.color + '22' }}>
            <Portrait id={f.id} size={170} />
          </motion.div>
          <h1 className="font-display font-bold text-5xl md:text-6xl">{headline}</h1>
          <p className="font-mono text-2xl font-bold mt-1">{fmtTime(result.time)}</p>
          <p className="font-mono text-xs mt-1 opacity-80">{result.deaths === 0 ? 'Flawless: no falls.' : `${result.deaths} fall${result.deaths > 1 ? 's' : ''}`}{result.best ? ` · best ${fmtTime(result.best)}` : ''}</p>
          {result.record && <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }} className="mt-2 px-3 py-1 rounded-lg bg-[#E8684A] text-white font-mono text-xs font-bold tracking-widest">NEW PERSONAL BEST</motion.p>}
        </div>
        {!result.solo && (
          <ol className="w-full max-w-md rounded-2xl bg-white border-2 border-[#14213D] divide-y divide-[#14213D]/10" aria-label="Race standings">
            {result.list.map((r, i) => {
              const d = fighterDef(r.id);
              return (
                <li key={r.id + i} className={`flex items-center gap-3 px-3 py-2 ${r.bot ? '' : 'bg-[#E8684A]/10'}`}>
                  <span className="font-display font-bold w-10">{ORD[i]}</span>
                  <Portrait id={r.id} size={36} />
                  <span className="flex-1 min-w-0">
                    <span className="font-display font-bold text-sm" style={{ color: labelColor(d) }}>{d.name}</span>
                    <span className="font-mono text-[10px] opacity-70 ml-2">{r.bot ? 'BOT' : 'P1'}</span>
                  </span>
                  <span className="font-mono text-xs text-right">{r.done ? fmtTime(r.time) : `DNF ${Math.round(r.progress * 100)}%`}<br /><span className="opacity-60">{r.deaths} falls</span></span>
                </li>
              );
            })}
          </ol>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={onAgain} className={`${btn} bg-[#E8684A] text-white`}>RACE AGAIN</button>
          <button onClick={onSetup} className={`${btn} bg-white`}>CHANGE SETUP</button>
          <button onClick={onMenu} className={`${btn} bg-white`}>MAIN MENU</button>
        </div>
      </div>
    </motion.div>
  );
}
