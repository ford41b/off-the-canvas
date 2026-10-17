import React from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { sfx, initAudio } from '@/game/audio';
import Controls from './Controls';

const Row = ({ label, children }) => (
  <div className="flex items-center justify-between gap-6 py-3 border-b border-[#14213D]/10"><span className="font-display font-bold">{label}</span>{children}</div>
);

export default function SettingsScreen({ settings, setSettings, onBack }) {
  const set = (k, v) => { initAudio(); setSettings((s) => ({ ...s, [k]: v })); setTimeout(() => sfx('menu'), 30); };
  const vol = (k) => <Slider className="w-40" min={0} max={1} step={0.05} value={[settings[k]]} onValueChange={([v]) => set(k, v)} />;
  return (
    <motion.div className="fixed inset-0 bg-[#F4F1EA] overflow-y-auto text-[#14213D]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="max-w-2xl mx-auto p-6">
        <button onClick={onBack} className="font-mono text-xs px-3 py-1.5 rounded-lg border-2 border-[#14213D] bg-white hover:bg-[#14213D] hover:text-white">← BACK</button>
        <h1 className="font-display font-bold text-4xl mt-4 mb-2">SETTINGS</h1>
        <div className="rounded-2xl bg-white border-2 border-[#14213D] p-5">
          <Row label="Mute all"><Switch checked={settings.muted} onCheckedChange={(v) => set('muted', v)} /></Row>
          <Row label="Master volume">{vol('master')}</Row>
          <Row label="Sound effects">{vol('sfx')}</Row>
          <Row label="Screen shake"><Switch checked={settings.shake} onCheckedChange={(v) => set('shake', v)} /></Row>
          <Row label="Reduced motion"><Switch checked={settings.reduced} onCheckedChange={(v) => set('reduced', v)} /></Row>
          <Row label="Character banter"><Switch checked={settings.banter} onCheckedChange={(v) => set('banter', v)} /></Row>
          <Row label="Default CPU difficulty">
            <div className="inline-flex rounded-lg border-2 border-[#14213D] overflow-hidden">
              {['easy', 'normal', 'hard'].map((d) => <button key={d} onClick={() => set('difficulty', d)} className={`px-3 py-1 font-mono text-xs ${settings.difficulty === d ? 'bg-[#14213D] text-white' : ''}`}>{d.toUpperCase()}</button>)}
            </div>
          </Row>
          <p className="font-mono text-[11px] opacity-50 mt-3">No music in this build — just synthesized sound effects. Settings are saved in this browser.</p>
        </div>
        <h2 className="font-display font-bold text-2xl mt-6 mb-2">CONTROLS</h2>
        <div className="rounded-2xl bg-white border-2 border-[#14213D] p-5"><Controls single /></div>
      </div>
    </motion.div>
  );
}