const KEY = 'otc_settings';
const DEFAULTS = { master: 0.8, sfx: 0.8, muted: false, shake: true, reduced: false, banter: true, difficulty: 'normal' };

export function loadSettings() {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  try { return { ...DEFAULTS, reduced, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULTS, reduced }; }
}
export const saveSettings = (s) => localStorage.setItem(KEY, JSON.stringify(s));