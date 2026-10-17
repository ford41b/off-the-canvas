import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FIGHTERS } from '@/game/fighters';
import { sfx } from '@/game/audio';
import { labelColor } from '@/game/palette';
import { COURSE_IDS, COURSE_META, getCourse } from '@/game/dash/courses';
import { SKILLS, runSpeed } from '@/game/dash/racer';
import { loadBest, fmtTime } from '@/game/dash/race';
import Portrait from './Portrait';
import RosterGrid from './RosterGrid';

const ids = FIGHTERS.map((f) => f.id);
const cycle = (list, v, d) => list[(list.indexOf(v) + d + list.length) % list.length];
const Seg = ({ value, options, onChange, label }) => (
  <div className="inline-flex rounded-lg border-2 border-[#14213D] overflow-hidden" role="group" aria-label={label}>
    {options.map(([v, l]) => <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => { sfx('menu'); onChange(v); }} className={`px-3 py-1 font-mono text-xs ${value === v ? 'bg-[#14213D] text-white' : 'bg-white'}`}>{l}</button>)}
  </div>
);
const speeds = FIGHTERS.map(runSpeed), sMin = Math.min(...speeds), sMax = Math.max(...speeds);

export const DASH_KEYS = [['Jump (hold to repeat)', 'Space / W / ↑ / click'], ['Skill', 'H / Shift / J'], ['Restart', 'R'], ['Pause', 'Esc / P']];
export function DashControls() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
      {DASH_KEYS.map(([a, b]) => <div key={a} className="contents"><span className="opacity-75">{a}</span><span>{b}</span></div>)}
    </div>
  );
}

export default function DashSelect({ setup, setSetup, onStart, onBack }) {
  const set = (k, v) => setSetup((s) => ({ ...s, [k]: v }));
  const f = FIGHTERS.find((x) => x.id === setup.p1), sk = SKILLS[f.id];
  const bots = setup.mode === 'bots';

  useEffect(() => {
    const k = (e) => {
      const m = { KeyA: ['p1', -1], KeyD: ['p1', 1], ArrowLeft: ['p1', -1], ArrowRight: ['p1', 1], KeyW: ['course', -1], KeyS: ['course', 1], ArrowUp: ['course', -1], ArrowDown: ['course', 1] }[e.code];
      if (m) { e.preventDefault(); sfx('menu'); setSetup((s) => ({ ...s, [m[0]]: cycle(m[0] === 'p1' ? ids : COURSE_IDS, s[m[0]], m[1]) })); }
      if (e.code === 'Enter') { sfx('select'); onStart(); }
      if (e.code === 'Escape') onBack();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onStart, onBack, setSetup]);

  const spd = Math.round(((runSpeed(f) - sMin) / (sMax - sMin)) * 4) + 1;
  return (
    <motion.div className="fixed inset-0 bg-[#F4F1EA] overflow-y-auto text-[#14213D]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 flex flex-col gap-4">
        <header className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="font-mono text-xs px-3 py-1.5 rounded-lg border-2 border-[#14213D] bg-white hover:bg-[#14213D] hover:text-white">← BACK</button>
            <div>
              <h1 className="font-display font-bold text-2xl md:text-3xl leading-none">DASH</h1>
              <p className="font-mono text-[11px] opacity-75">Auto-run. Jump on the beat. Don&apos;t touch the spikes.</p>
            </div>
          </div>
          <Seg label="Race mode" value={setup.mode} onChange={(v) => set('mode', v)} options={[['solo', 'SOLO TIME TRIAL'], ['bots', 'VS BOTS']]} />
        </header>

        <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-3">
          <section aria-label="Your racer" className="rounded-2xl bg-white border-2 border-[#14213D] p-4 flex gap-4 items-center">
            <div className="rounded-xl shrink-0" style={{ background: f.color + '1f' }}><Portrait id={f.id} size={120} /></div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-widest opacity-75">P1 · RACER</p>
              <h2 className="font-display font-bold text-2xl leading-tight">{f.name}</h2>
              <div className="flex items-center gap-2 mt-1" role="img" aria-label={`run speed ${spd} of 5`}>
                <span className="font-mono text-[10px] opacity-75 w-16">RUN SPEED</span>
                <div className="flex gap-1">{[1, 2, 3, 4, 5].map((i) => <span key={i} className="w-5 h-2 rounded-sm" style={{ background: i <= spd ? f.color : 'rgba(20,33,61,0.12)' }} />)}</div>
              </div>
              <p className="font-mono text-[11px] mt-2 font-bold" style={{ color: labelColor(f) }}>&gt; SKILL: {sk.name.toUpperCase()}</p>
              <p className="text-xs opacity-85 leading-snug">{sk.desc}</p>
            </div>
          </section>

          <section aria-label="Course" className="flex flex-col gap-2">
            {COURSE_IDS.map((id, i) => {
              const m = COURSE_META[id], on = setup.course === id, best = loadBest(id, f.id);
              const secs = Math.round(getCourse(id).length / (runSpeed(f) * 60));
              return (
                <button key={id} type="button" aria-pressed={on} onClick={() => { sfx('menu'); set('course', id); }}
                  className={`text-left rounded-xl border-2 px-3 py-2 flex items-center gap-3 transition hover:translate-x-0.5 ${on ? 'bg-[#14213D] text-white border-[#14213D]' : 'bg-white border-[#14213D]/15'}`}>
                  <span className="font-mono text-xs opacity-60 w-5" aria-hidden="true">0{i + 1}</span>
                  <span className="w-3 h-8 rounded-sm shrink-0" style={{ background: m.theme.a }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-display font-bold">{m.name}</span>
                      <span className="font-mono text-[11px]" aria-label={`difficulty ${m.diff} of 5`}>{'★'.repeat(m.diff)}<span className="opacity-30">{'★'.repeat(5 - m.diff)}</span></span>
                    </span>
                    <span className="block font-mono text-[10px] opacity-75 truncate">{m.blurb}</span>
                  </span>
                  <span className="font-mono text-[10px] text-right shrink-0 opacity-90">~{secs}s<br />{best ? `BEST ${fmtTime(best)}` : 'NO TIME'}</span>
                </button>
              );
            })}
          </section>
        </div>

        <RosterGrid p1={setup.p1} p2={null} onPick={(id) => { sfx('select'); set('p1', id); }} />

        <div className="flex flex-wrap items-center gap-4 justify-between rounded-2xl bg-white border-2 border-[#14213D]/15 p-3">
          <div className="flex flex-wrap items-center gap-4">
            {bots && <div className="flex items-center gap-2"><span className="font-mono text-xs opacity-75">BOTS</span><Seg label="Number of bots" value={setup.bots} onChange={(v) => set('bots', v)} options={[[1, '1'], [2, '2'], [3, '3'], [5, '5'], [7, '7']]} /></div>}
            {bots && <div className="flex items-center gap-2"><span className="font-mono text-xs opacity-75">BOT LEVEL</span><Seg label="Bot difficulty" value={setup.difficulty} onChange={(v) => set('difficulty', v)} options={[['easy', 'EASY'], ['normal', 'NORMAL'], ['hard', 'HARD']]} /></div>}
            <div className="flex items-center gap-2"><span className="font-mono text-xs opacity-75">CHECKPOINTS</span><Seg label="Checkpoints" value={setup.checkpoints} onChange={(v) => set('checkpoints', v)} options={[[true, 'ON'], [false, 'OFF']]} /></div>
          </div>
          <button onClick={() => { sfx('select'); onStart(); }} className="px-8 py-3 rounded-xl bg-[#E8684A] text-white font-display font-bold tracking-wider border-2 border-[#14213D] shadow-[4px_4px_0_#14213D] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#14213D] transition">
            {bots ? 'RACE →' : 'START RUN →'}
          </button>
        </div>
        <div className="rounded-2xl bg-white border-2 border-[#14213D]/15 p-4 grid md:grid-cols-2 gap-4">
          <DashControls />
          <p className="font-mono text-[11px] opacity-75 leading-relaxed">
            Everyone runs the same course; bots are ghosts, so nobody can block you. Yellow pads launch you, yellow orbs give a mid-air jump while you hold jump inside them.
            {' '}Checkpoints off means every fall sends you back to the start. ←/→ change racer, ↑/↓ change course, Enter to start.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
