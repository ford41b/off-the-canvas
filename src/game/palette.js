export const C = {
  paper: '#F4F1EA', ink: '#14213D', coral: '#E8684A', cobalt: '#2F5BEA', cyan: '#3FD0E0',
  teal: '#12A39A', green: '#3BB273', violet: '#7B5CE0', charcoal: '#26282F', red: '#E23D3D',
  white: '#FFFFFF', navy2: '#1B2E52',
};
export const W = 1280;
export const H = 720;
export const INTRO_URL = 'https://media.base44.com/videos/public/user_6a9380e665308987a4a3c3ec/ce85f1254_claude-vs-codex.mp4';
// Fighter colors are tuned for fills; mixed toward ink they pass AA contrast as small text on white.
const mix = (a, b, k) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - k) + parseInt(b.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
export const labelColor = (f) => mix(f.color === C.charcoal ? C.red : f.color, C.ink, 0.35);
