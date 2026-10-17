export const BINDS = {
  p1: { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'], jump: ['KeyW', 'Space'], attack: ['KeyF'], heavy: ['KeyG'], special: ['KeyH'], shoot: ['KeyJ'], dodge: ['ShiftLeft'] },
  p2: { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'], jump: ['ArrowUp'], attack: ['KeyK', 'Numpad1'], heavy: ['KeyL', 'Numpad2'], special: ['Semicolon', 'Numpad3'], shoot: ['Quote', 'Numpad4'], dodge: ['ShiftRight', 'Numpad0'] },
};
const ALL = new Set(Object.values(BINDS).flatMap((b) => Object.values(b).flat()));

export function createInput() {
  const keys = new Set();
  const down = (e) => { if (ALL.has(e.code)) { e.preventDefault(); keys.add(e.code); } };
  const up = (e) => keys.delete(e.code);
  const blur = () => keys.clear();
  window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
  return {
    read(player, merge) {
      const maps = merge ? [BINDS.p1, BINDS.p2] : [BINDS[player]];
      const out = {};
      for (const k of Object.keys(BINDS.p1)) out[k] = maps.some((m) => m[k].some((c) => keys.has(c)));
      return out;
    },
    dispose() { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); },
  };
}