import React, { useEffect, useRef, useState } from 'react';
import { createRace, stepRace, raceResult } from '@/game/dash/race';
import { renderDash } from '@/game/dash/render';
import { SKILLS } from '@/game/dash/racer';
import { playEvents, initAudio } from '@/game/audio';
import { DashControls } from './DashSelect';

const JUMP = new Set(['Space', 'KeyW', 'ArrowUp']);
const SKILL = new Set(['KeyH', 'KeyJ', 'ShiftLeft', 'ShiftRight']);
// Space would otherwise also click whichever button kept focus (the menu's RACE button, or PAUSE).
const dropFocus = () => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); };

export default function DashRace({ setup, settings, onEnd, onQuit }) {
  const canvasRef = useRef(null), raceRef = useRef(null), pausedRef = useRef(false);
  const held = useRef({ keys: new Set(), pointer: false, skill: false });
  const [paused, setPaused] = useState(false);

  const newRace = () => {
    raceRef.current = createRace({ course: setup.course, p1: setup.p1, bots: setup.mode === 'bots' ? setup.botIds : [], difficulty: setup.difficulty, checkpoints: setup.checkpoints, reduced: settings.reduced });
  };
  const togglePause = (v) => { pausedRef.current = v; setPaused(v); if (!v) dropFocus(); };

  useEffect(() => {
    initAudio(); newRace(); dropFocus();
    const ctx = canvasRef.current.getContext('2d'), h = held.current;
    let raf, last = performance.now(), acc = 0, ended = false;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const g = raceRef.current;
      acc += Math.min(100, now - last); last = now;
      while (acc >= 1000 / 60) {
        acc -= 1000 / 60;
        if (pausedRef.current) continue;
        const keys = [...h.keys];
        stepRace(g, { jump: h.pointer || keys.some((k) => JUMP.has(k)), skill: h.skill || keys.some((k) => SKILL.has(k)) });
      }
      playEvents(g.events);
      const c = canvasRef.current, dpr = window.devicePixelRatio || 1;
      if (!c) return; // unmounting: the ref is gone before the effect cleanup cancels this loop
      if (c.width !== Math.round(c.clientWidth * dpr)) { c.width = Math.round(c.clientWidth * dpr); c.height = Math.round(c.clientHeight * dpr); }
      renderDash(ctx, g, { scale: c.width / 1280, shakeOn: settings.shake });
      if (g.over && g.overT > 20 && !ended) { ended = true; onEnd(raceResult(g, setup)); }
    };
    raf = requestAnimationFrame(loop);
    const down = (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') { togglePause(!pausedRef.current); return; }
      if (e.code === 'KeyR' && !pausedRef.current) { newRace(); return; }
      if (JUMP.has(e.code) || SKILL.has(e.code)) { e.preventDefault(); h.keys.add(e.code); }
    };
    const up = (e) => h.keys.delete(e.code);
    const blur = () => { h.keys.clear(); h.pointer = false; h.skill = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);

  const press = (k, v) => (e) => { e.preventDefault(); held.current[k] = v; };
  const btn = 'w-full px-4 py-2.5 rounded-lg border-2 border-[#14213D] font-display font-bold tracking-wider transition';
  return (
    <div className="fixed inset-0 bg-[#F4F1EA] flex items-center justify-center">
      <div className="relative w-full max-h-full aspect-video" style={{ maxWidth: 'calc(100vh * 16 / 9)' }}>
        <canvas ref={canvasRef} className="w-full h-full block touch-none" aria-label="Dash race. Press space or tap to jump."
          onPointerDown={press('pointer', true)} onPointerUp={press('pointer', false)} onPointerCancel={press('pointer', false)} onPointerLeave={press('pointer', false)} />
        <button onClick={() => togglePause(true)} className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white border-2 border-[#14213D] font-mono text-xs text-[#14213D]">II PAUSE</button>
        <button onPointerDown={press('skill', true)} onPointerUp={press('skill', false)} onPointerCancel={press('skill', false)} onPointerLeave={press('skill', false)}
          className="absolute bottom-4 right-4 px-5 py-4 rounded-2xl bg-white/90 border-2 border-[#14213D] font-display font-bold text-sm text-[#14213D] touch-none [@media(hover:hover)]:hidden">
          {SKILLS[setup.p1].name.toUpperCase()}
        </button>
        {paused && (
          <div className="absolute inset-0 z-20 bg-[#F4F1EA]/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border-2 border-[#14213D] shadow-[8px_8px_0_rgba(20,33,61,0.15)] p-6 w-full max-w-lg text-[#14213D]">
              <p className="font-mono text-xs text-[#E8684A]">&gt; process suspended</p>
              <h2 className="font-display font-bold text-4xl mb-4">PAUSED</h2>
              <div className="grid grid-cols-3 gap-2 mb-5">
                <button onClick={() => togglePause(false)} className={`${btn} bg-[#14213D] text-white hover:bg-[#2F5BEA]`}>RESUME</button>
                <button onClick={() => { newRace(); togglePause(false); }} className={`${btn} bg-white hover:bg-[#F4F1EA]`}>RESTART</button>
                <button onClick={onQuit} className={`${btn} bg-white hover:bg-[#E8684A] hover:text-white`}>MENU</button>
              </div>
              <DashControls />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
