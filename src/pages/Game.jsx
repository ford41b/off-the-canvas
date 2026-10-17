import React, { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { loadSettings, saveSettings } from '@/game/settings';
import { setVolumes } from '@/game/audio';
import Intro from '@/components/game/Intro';
import Title from '@/components/game/Title';
import Select from '@/components/game/Select';
import Match from '@/components/game/Match';
import Results from '@/components/game/Results';
import SettingsScreen from '@/components/game/SettingsScreen';
import DashSelect from '@/components/game/DashSelect';
import DashRace from '@/components/game/DashRace';
import DashResults from '@/components/game/DashResults';
import { FIGHTERS } from '@/game/fighters';

export default function Game() {
  const [settings, setSettings] = useState(loadSettings);
  const [screen, setScreen] = useState(() => (localStorage.getItem('otc_intro_seen') ? 'title' : 'intro'));
  const [reveal, setReveal] = useState(false);
  const [setup, setSetup] = useState({ mode: 'cpu', p1: 'claude', p2: 'codex', stocks: 3, stage: 'canvas', difficulty: settings.difficulty });
  const [result, setResult] = useState(null);
  const [matchKey, setMatchKey] = useState(0);
  const [dash, setDash] = useState({ p1: 'claude', course: 'hello', mode: 'bots', bots: 3, difficulty: settings.difficulty, checkpoints: true, botIds: [] });
  const [dashResult, setDashResult] = useState(null);

  useEffect(() => { saveSettings(settings); setVolumes(settings); }, [settings]);

  const fromTitle = (v) => {
    setReveal(false);
    if (v === 'fight') { setSetup((s) => ({ ...s, mode: s.mode === 'training' ? 'cpu' : s.mode, difficulty: settings.difficulty })); setScreen('select'); }
    if (v === 'dash') setScreen('dashSelect');
    if (v === 'training') { setSetup((s) => ({ ...s, mode: 'training' })); setScreen('select'); }
    if (v === 'intro') setScreen('intro');
    if (v === 'settings') setScreen('settings');
  };
  const startMatch = () => { setMatchKey((k) => k + 1); setScreen('match'); };
  // Bots are drawn fresh for every race from the characters the player didn't pick.
  const startDash = () => {
    const pool = FIGHTERS.map((f) => f.id).filter((id) => id !== dash.p1).sort(() => Math.random() - 0.5);
    setDash((d) => ({ ...d, botIds: pool.slice(0, d.bots) }));
    setMatchKey((k) => k + 1); setScreen('dash');
  };
  const labels = ['P1', setup.mode === 'versus' ? 'P2' : 'CPU'];

  return (
    <MotionConfig reducedMotion={settings.reduced ? 'always' : 'user'}>
    <div className="fixed inset-0 bg-[#F4F1EA] text-[#14213D] font-body select-none">
      <AnimatePresence mode="wait">
        {screen === 'intro' && <Intro key="intro" onDone={() => { localStorage.setItem('otc_intro_seen', '1'); setReveal(true); setScreen('title'); }} />}
        {screen === 'title' && <Title key="title" reveal={reveal} onPick={fromTitle} />}
        {screen === 'settings' && <SettingsScreen key="settings" settings={settings} setSettings={setSettings} onBack={() => setScreen('title')} />}
        {screen === 'select' && <Select key="select" setup={setup} setSetup={setSetup} onStart={startMatch} onBack={() => setScreen('title')} />}
        {screen === 'match' && <Match key={'m' + matchKey} setup={setup} settings={settings} onEnd={(r) => { setResult(r); setScreen('results'); }} onQuit={() => setScreen('title')} />}
        {screen === 'dashSelect' && <DashSelect key="dashSelect" setup={dash} setSetup={setDash} onStart={startDash} onBack={() => setScreen('title')} />}
        {screen === 'dash' && <DashRace key={'d' + matchKey} setup={dash} settings={settings} onEnd={(r) => { setDashResult(r); setScreen('dashResults'); }} onQuit={() => setScreen('title')} />}
        {screen === 'dashResults' && <DashResults key="dashResults" result={dashResult} onAgain={startDash} onSetup={() => setScreen('dashSelect')} onMenu={() => setScreen('title')} />}
        {screen === 'results' && <Results key="results" result={result} labels={labels} onRematch={startMatch} onSelect={() => setScreen('select')} onMenu={() => setScreen('title')} />}
      </AnimatePresence>
    </div>
    </MotionConfig>
  );
}