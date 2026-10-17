import React, { useEffect, useRef, useState } from 'react';
import { createGame, step, resetFighters } from '@/game/engine';
import { render } from '@/game/render';
import { createInput } from '@/game/input';
import { createBrain, think } from '@/game/ai';
import { playEvents, initAudio } from '@/game/audio';
import PauseMenu from './PauseMenu';

const buildResult = (g) => ({
  tie: !!g.over.tie, winner: g.over.winner,
  fighters: g.fighters.map((f) => ({ id: f.def.id, stocks: f.stocks, ...f.stats })),
});

export default function Match({ setup, settings, onEnd, onQuit }) {
  const canvasRef = useRef(null), gameRef = useRef(null), brainRef = useRef(null);
  const pausedRef = useRef(false), trainRef = useRef({ dummy: false, hit: false });
  const [paused, setPaused] = useState(false);
  const [train, setTrain] = useState(trainRef.current);
  const single = setup.mode !== 'versus';

  const newGame = () => {
    gameRef.current = createGame({ ...setup, banter: settings.banter, reduced: settings.reduced });
    brainRef.current = createBrain(setup.difficulty);
  };
  const togglePause = (v) => { pausedRef.current = v; setPaused(v); };
  const updTrain = (patch) => { trainRef.current = { ...trainRef.current, ...patch }; setTrain(trainRef.current); };

  useEffect(() => {
    initAudio(); newGame();
    const input = createInput(), ctx = canvasRef.current.getContext('2d');
    let raf, last = performance.now(), acc = 0, ended = false;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const g = gameRef.current;
      acc += Math.min(100, now - last); last = now;
      while (acc >= 1000 / 60) {
        acc -= 1000 / 60;
        if (pausedRef.current) continue;
        const i1 = input.read('p1', single);
        const i2 = single ? think(g, g.fighters[1], brainRef.current, setup.mode === 'training' && !trainRef.current.dummy) : input.read('p2');
        step(g, [i1, i2]);
      }
      playEvents(g.events);
      const c = canvasRef.current, dpr = window.devicePixelRatio || 1;
      if (c.width !== Math.round(c.clientWidth * dpr)) { c.width = Math.round(c.clientWidth * dpr); c.height = Math.round(c.clientHeight * dpr); }
      render(ctx, g, { scale: c.width / 1280, showHitboxes: trainRef.current.hit, reduced: settings.reduced, shakeOn: settings.shake, banter: settings.banter, p2Label: setup.mode === 'cpu' ? 'CPU' : setup.mode === 'training' ? 'DUMMY' : 'P2' });
      if (g.over && g.overT > 110 && !ended) { ended = true; onEnd(buildResult(g)); }
    };
    raf = requestAnimationFrame(loop);
    const key = (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') togglePause(!pausedRef.current);
      if (setup.mode !== 'training' || pausedRef.current) return;
      if (e.code === 'KeyR') resetFighters(gameRef.current);
      if (e.code === 'KeyT') updTrain({ dummy: !trainRef.current.dummy });
      if (e.code === 'KeyY') updTrain({ hit: !trainRef.current.hit });
    };
    window.addEventListener('keydown', key);
    return () => { cancelAnimationFrame(raf); input.dispose(); window.removeEventListener('keydown', key); };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#F4F1EA] flex items-center justify-center">
      <div className="relative w-full max-h-full aspect-video" style={{ maxWidth: 'calc(100vh * 16 / 9)' }}>
        <canvas ref={canvasRef} className="w-full h-full block" />
        {setup.mode === 'training' && (
          <div className="absolute top-10 left-3 flex flex-col gap-1.5 font-mono text-[11px]">
            {[['RESET (R)', () => resetFighters(gameRef.current)], [`DUMMY: ${train.dummy ? 'ACTIVE' : 'IDLE'} (T)`, () => updTrain({ dummy: !train.dummy })], [`HITBOXES: ${train.hit ? 'ON' : 'OFF'} (Y)`, () => updTrain({ hit: !train.hit })]].map(([l, fn]) => (
              <button key={l} onClick={fn} className="px-3 py-1.5 rounded-lg bg-white border-2 border-[#14213D] text-[#14213D] hover:bg-[#14213D] hover:text-white text-left">{l}</button>
            ))}
          </div>
        )}
        <button onClick={() => togglePause(true)} className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white border-2 border-[#14213D] font-mono text-xs text-[#14213D]">II PAUSE</button>
        {paused && <PauseMenu single={single} onResume={() => togglePause(false)} onRestart={() => { newGame(); togglePause(false); }} onQuit={onQuit} />}
      </div>
    </div>
  );
}