import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { INTRO_URL } from '@/game/palette';
import { initAudio } from '@/game/audio';

export default function Intro({ onDone }) {
  const vRef = useRef(null), doneRef = useRef(false);
  const [muted, setMuted] = useState(true);
  const [wipe, setWipe] = useState(false);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true; setWipe(true);
    setTimeout(onDone, 950);
  };
  useEffect(() => {
    vRef.current.play().catch(() => {});
    const k = (e) => { if (e.code === 'Escape' || e.code === 'Enter') finish(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  const unmute = () => { vRef.current.muted = false; setMuted(false); initAudio(); };
  return (
    <div className="fixed inset-0 bg-[#F4F1EA] flex items-center justify-center">
      <video ref={vRef} src={INTRO_URL} className="w-full h-full object-contain" playsInline muted autoPlay onEnded={finish} onError={finish} />
      <button onClick={() => { initAudio(); finish(); }} className="absolute top-5 right-5 px-4 py-2 rounded-full bg-white/80 backdrop-blur border-2 border-[#14213D] text-[#14213D] font-mono text-xs tracking-widest hover:bg-[#14213D] hover:text-white transition">
        SKIP INTRO →
      </button>
      {muted && (
        <button onClick={unmute} className="absolute bottom-5 left-5 px-4 py-2 rounded-full bg-white/80 border-2 border-[#14213D] text-[#14213D] font-mono text-xs tracking-widest">
          ♪ SOUND ON
        </button>
      )}
      {wipe && (
        <>
          <motion.div className="absolute inset-y-0 left-0 w-[60%] bg-[#E8684A]" style={{ clipPath: 'polygon(0 0,100% 0,80% 100%,0 100%)' }} initial={{ x: '-100%' }} animate={{ x: 0 }} transition={{ duration: 0.45, ease: 'easeIn' }} />
          <motion.div className="absolute inset-y-0 right-0 w-[60%] bg-[#2F5BEA]" style={{ clipPath: 'polygon(20% 0,100% 0,100% 100%,0 100%)' }} initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ duration: 0.45, ease: 'easeIn', delay: 0.12 }} />
        </>
      )}
    </div>
  );
}