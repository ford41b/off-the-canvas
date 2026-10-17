import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FIGHTERS } from '@/game/fighters';
import { sfx } from '@/game/audio';
import FighterPanel from './FighterPanel';
import RosterGrid from './RosterGrid';
import Controls from './Controls';

const ids = FIGHTERS.map((f) => f.id);
const shift = (id, d) => ids[(ids.indexOf(id) + d + ids.length) % ids.length];
const Seg = ({ value, options, onChange }) => (
  <div className="inline-flex rounded-lg border-2 border-[#14213D] overflow-hidden">
    {options.map(([v, l]) => <button key={v} type="button" aria-pressed={value === v} onClick={() => { sfx('menu'); onChange(v); }} className={`px-3 py-1 font-mono text-xs ${value === v ? 'bg-[#14213D] text-white' : 'bg-white'}`}>{l}</button>)}
  </div>
);

export default function Select({ setup, setSetup, onStart, onBack }) {
  const [slot, setSlot] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const training = setup.mode === 'training';
  const set = (k, v) => setSetup((s) => ({ ...s, [k]: v }));
  const pick = (id) => { sfx('select'); set(slot === 0 ? 'p1' : 'p2', id); if (slot === 0) setSlot(1); };

  useEffect(() => {
    const k = (e) => {
      const m = { KeyA: ['p1', -1], KeyD: ['p1', 1], KeyW: ['p1', -4], KeyS: ['p1', 4], ArrowLeft: ['p2', -1], ArrowRight: ['p2', 1], ArrowUp: ['p2', -4], ArrowDown: ['p2', 4] }[e.code];
      if (m) { e.preventDefault(); sfx('menu'); setSetup((s) => ({ ...s, [m[0]]: shift(s[m[0]], m[1]) })); setSlot(m[0] === 'p1' ? 0 : 1); }
      if (e.code === 'Enter') { sfx('select'); onStart(); }
      if (e.code === 'Escape') onBack();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onStart, onBack, setSetup]);

  const p1 = FIGHTERS.find((f) => f.id === setup.p1), p2 = FIGHTERS.find((f) => f.id === setup.p2);
  const p2Label = setup.mode === 'versus' ? 'P2' : training ? 'DUMMY' : 'CPU';
  return (
    <motion.div className="fixed inset-0 bg-[#F4F1EA] overflow-y-auto text-[#14213D]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 flex flex-col gap-4">
        <header className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="font-mono text-xs px-3 py-1.5 rounded-lg border-2 border-[#14213D] bg-white hover:bg-[#14213D] hover:text-white">← BACK</button>
            <h1 className="font-display font-bold text-2xl md:text-3xl">{training ? 'TRAINING' : 'CHOOSE YOUR FIGHTER'}</h1>
          </div>
          {!training && <Seg value={setup.mode} onChange={(v) => set('mode', v)} options={[['cpu', 'VS CPU'], ['versus', '2 PLAYERS']]} />}
        </header>
        <div className="flex flex-col md:flex-row gap-3">
          <FighterPanel f={p1} label="P1" color="#E8684A" active={slot === 0} onActivate={() => setSlot(0)} />
          <div className="hidden md:flex items-center font-display font-bold text-3xl text-[#14213D]/30">VS</div>
          <FighterPanel f={p2} label={p2Label} color="#2F5BEA" facing={-1} active={slot === 1} onActivate={() => setSlot(1)} />
        </div>
        <p className="font-mono text-[11px] opacity-75">Picking for: <b>{slot === 0 ? 'P1' : p2Label}</b> · click a panel to switch · keyboard: P1 WASD, P2 arrows, Enter to start</p>
        <RosterGrid p1={setup.p1} p2={setup.p2} onPick={pick} />
        <div className="flex flex-wrap items-center gap-4 justify-between rounded-2xl bg-white border-2 border-[#14213D]/15 p-3">
          <div className="flex flex-wrap items-center gap-4">
            {!training && <div className="flex items-center gap-2"><span className="font-mono text-xs opacity-75">STOCKS</span><Seg value={setup.stocks} onChange={(v) => set('stocks', v)} options={[[1, '1'], [2, '2'], [3, '3'], [5, '5']]} /></div>}
            {setup.mode !== 'versus' && <div className="flex items-center gap-2"><span className="font-mono text-xs opacity-75">CPU</span><Seg value={setup.difficulty} onChange={(v) => set('difficulty', v)} options={[['easy', 'EASY'], ['normal', 'NORMAL'], ['hard', 'HARD']]} /></div>}
            <button onClick={() => setShowControls((s) => !s)} className="font-mono text-xs underline">{showControls ? 'hide controls' : 'controls'}</button>
          </div>
          <button onClick={() => { sfx('select'); onStart(); }} className="px-8 py-3 rounded-xl bg-[#E8684A] text-white font-display font-bold tracking-wider border-2 border-[#14213D] shadow-[4px_4px_0_#14213D] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#14213D] transition">
            {training ? 'ENTER TRAINING' : 'FIGHT →'}
          </button>
        </div>
        {showControls && <div className="rounded-2xl bg-white border-2 border-[#14213D]/15 p-4"><Controls single={setup.mode !== 'versus'} /></div>}
      </div>
    </motion.div>
  );
}