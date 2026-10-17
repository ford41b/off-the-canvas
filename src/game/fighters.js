import { C } from './palette';

// startup, active, recovery (frames), damage, base knockback, growth, angle (deg, 0 = forward, 90 = up), box [dx, dy, w, h]
export const A = (startup, active, recovery, dmg, base, growth, angle, box, extra = {}) =>
  ({ startup, active, recovery, dmg, base, growth, angle, box, ...extra });

function kit({ r = 1, p = 1, s = 1 } = {}, o = {}) {
  const S = (n) => Math.max(2, Math.round(n / s));
  return {
    jab: A(S(4), 3, S(10), 4 * p, 4.5, 0.8 * p, 35, [32 * r, -30, 40 * r, 28]),
    utilt: A(S(6), 4, S(12), 6 * p, 5, 1.1 * p, 88, [6, -70, 56 * r, 34]),
    heavy: A(S(15), 5, S(24), 13 * p, 7.5, 1.85 * p, 38, [42 * r, -32, 60 * r, 42]),
    fair: A(S(6), 5, S(13), 8 * p, 5, 1.35 * p, 42, [34 * r, -32, 48 * r, 38]),
    uair: A(S(5), 5, S(12), 7 * p, 5, 1.25 * p, 85, [4, -76, 58 * r, 32]),
    dair: A(S(9), 4, S(17), 10 * p, 4, 1.3 * p, -75, [4, 8, 42 * r, 30]),
    rec: A(1, 10, 0, 5, 5, 0.7, 75, [8, -34, 54, 62]),
    ...o,
  };
}

export const FIGHTERS = [
  {
    id: 'claude', name: 'Claude', title: 'The Counterfighter', color: C.coral, accent: '#FFD2C4', flagship: true,
    blurb: 'Patient, polite, and quietly devastating. Reads you, waits, then answers.',
    special: { name: 'Clarification', desc: 'Brief counter stance. Get hit during it and Claude negates the blow and retaliates hard. Whiff it and you are open.' },
    ranged: { name: 'Measured Response', desc: 'A slow, heavy reply that drifts to a stop and hangs in the air. Place it, then let them walk into it.' },
    stats: { power: 4, speed: 2, recovery: 3, range: 3, difficulty: 3 },
    walk: 4.4, air: 3.6, accel: 0.22, airAccel: 0.35, jump: 12.6, dbl: 11, jumps: 1, fall: 11.5, weight: 108, w: 56, h: 54,
    rec: { vx: 4, vy: -13.5 },
    moves: kit({ r: 1, p: 1.1, s: 0.95 }, { heavy: A(15, 6, 24, 14, 8, 1.9, 40, [30, -28, 64, 52]) }),
    lines: { start: ["Let's keep this civil.", "I'd prefer not to. But okay."], ko: ['Sorry about that.', 'I hope that was helpful.'], special: ['Request denied.', 'Please clarify your last attack.'], fall: ['I may have overstepped.'] },
  },
  {
    id: 'codex', name: 'Codex', title: 'The Technician', color: C.cobalt, accent: C.cyan, flagship: true,
    blurb: 'Fast, inventive, slightly overconfident. Builds its own route through the fight.',
    special: { name: 'Quick Patch', desc: 'Spawns a glowing platform beneath you (or ahead on the ground). Lasts a few seconds, long cooldown.' },
    ranged: { name: 'Autocomplete', desc: 'Two fast bolts in quick succession. Light damage, short cooldown.' },
    stats: { power: 2, speed: 5, recovery: 5, range: 4, difficulty: 4 },
    walk: 5.6, air: 4.4, accel: 0.3, airAccel: 0.5, jump: 13, dbl: 12, jumps: 1, fall: 11, weight: 88, w: 50, h: 58,
    rec: { vx: 7, vy: -11 },
    moves: kit({ r: 0.9, p: 0.85, s: 1.25 }, { heavy: A(12, 5, 20, 11, 7, 1.7, 35, [40, -32, 58, 40]) }),
    lines: { start: ['Compiling victory…', 'Running tests: 0 passed.'], ko: ['Patched.', 'Deprecated.'], special: ['patch --force', '// TODO: land'], fall: ['Unexpected EOF.'] },
  },
  {
    id: 'chatgpt', name: 'ChatGPT', title: 'The All-Rounder', color: C.green, accent: C.teal,
    blurb: 'Adaptable and eager. Has an answer for most things, and a follow-up for everything.',
    special: { name: 'Iterate', desc: 'Follow up your last landed hit: Quick → Lift launcher, Heavy or Follow-Up → Pivot dash, Aerial → Rewrite spike. Otherwise a Draft spin.' },
    ranged: { name: 'Follow-Up', desc: 'A bobbing chat bubble at mid range. Land it and your next Iterate becomes a Pivot dash.' },
    stats: { power: 3, speed: 3, recovery: 4, range: 3, difficulty: 1 },
    walk: 5, air: 4, accel: 0.25, airAccel: 0.42, jump: 12.8, dbl: 11.5, jumps: 1, fall: 11, weight: 100, w: 52, h: 58,
    rec: { vx: 3, vy: -14 },
    moves: kit({ r: 1.05, p: 1, s: 1.05 }),
    lines: { start: ["Great question! Let's fight.", 'Here are 3 ways to win:'], ko: ['Hope this helps!', 'Anything else?'], special: ['Let me try another approach.', 'Regenerating…'], fall: ["You're absolutely right."] },
  },
  {
    id: 'gemini', name: 'Gemini', title: 'The Dualist', color: C.violet, accent: C.cyan,
    blurb: 'Two perspectives, one fighter. Trades speed for weight at will.',
    special: { name: 'Dual Perspective', desc: 'Switch stance. Focus: slower, heavier hits. Flash: faster, lighter, combo-friendly.' },
    ranged: { name: 'Twin Stars', desc: 'Flash: two light stars that weave in a helix. Focus: one big, slow, heavy star.' },
    stats: { power: 3, speed: 4, recovery: 3, range: 3, difficulty: 4 },
    walk: 4.9, air: 4, accel: 0.25, airAccel: 0.42, jump: 12.8, dbl: 11.2, jumps: 1, fall: 11, weight: 98, w: 54, h: 60,
    rec: { vx: 4, vy: -13 },
    moves: kit({ r: 1, p: 1, s: 1 }),
    lines: { start: ['On one hand… on the other hand.'], ko: ['Both perspectives agree.'], special: ['Switching perspective.', 'Then again…'], fall: ['Further research needed.'] },
  },
  {
    id: 'grok', name: 'Grok', title: 'The Wildcard', color: C.charcoal, accent: C.red,
    blurb: 'Loud, reckless, and terrifying at close range. Pays for every miss.',
    special: { name: 'Unfiltered', desc: 'Hold to charge a huge forward strike, release to unleash. Interruptible, long recovery on whiff.' },
    ranged: { name: 'Hot Take', desc: 'A lobbed bomb that explodes where it lands. Huge blast, long wind-up and recovery.' },
    stats: { power: 5, speed: 3, recovery: 1, range: 2, difficulty: 3 },
    walk: 5.2, air: 3.8, accel: 0.26, airAccel: 0.34, jump: 12, dbl: 10, jumps: 1, fall: 12.5, weight: 112, w: 56, h: 60,
    rec: { vx: 9, vy: -9 },
    moves: kit({ r: 1.05, p: 1.25, s: 0.85 }, { jab: A(5, 3, 11, 5.5, 5, 1, 35, [36, -30, 46, 30], { lunge: 8 }) }),
    lines: { start: ['No filter. No mercy.'], ko: ['Ratio.', 'Based.'], special: ['Hold my tokens.'], fall: ['Worth it.'] },
  },
  {
    id: 'perplexity', name: 'Perplexity', title: 'The Investigator', color: C.teal, accent: C.cyan,
    blurb: 'Methodical zoner. Marks you, then cites you into the blast zone.',
    special: { name: 'Follow the Sources', desc: 'Fires a tracking marker. A marked foe makes your next Lens shot (heavy) gently home in.' },
    ranged: { name: 'Citation Volley', desc: 'A fan of three quick citations. Against a marked foe, they home in.' },
    stats: { power: 2, speed: 3, recovery: 4, range: 5, difficulty: 3 },
    walk: 4.6, air: 4.2, accel: 0.23, airAccel: 0.45, jump: 12.8, dbl: 12, jumps: 1, fall: 10.5, weight: 92, w: 52, h: 60,
    rec: { vx: 8, vy: -10.5 },
    moves: kit({ r: 1.25, p: 0.85, s: 1 }, { heavy: A(10, 1, 22, 9, 6, 1.3, 30, null, { projectile: 'lens' }) }),
    lines: { start: ['Sources indicate you lose.'], ko: ['Cited.', '[1] Confirmed.'], special: ['Investigating…', 'Finding sources…'], fall: ['Evidence inconclusive.'] },
  },
  {
    id: 'hallucination', name: 'The Hallucination', title: 'The Trickster', color: C.violet, accent: C.coral,
    blurb: 'Absolutely certain about things that are not true. Baits, feints, misleads.',
    special: { name: 'Confidently Incorrect', desc: 'Sends a dashed decoy rushing forward. Hold down to leave it behind and hop back instead. Decoys deal no damage.' },
    ranged: { name: 'Made-Up Source', desc: 'A flickering fake that flies out and curves back. Catch it on the return to halve the cooldown.' },
    stats: { power: 2, speed: 4, recovery: 4, range: 2, difficulty: 5 },
    walk: 5, air: 4.4, accel: 0.26, airAccel: 0.48, jump: 13.5, dbl: 12, jumps: 1, fall: 9.5, weight: 90, w: 52, h: 58,
    rec: { vx: 5, vy: -12.5 },
    moves: kit({ r: 1, p: 0.9, s: 0.95 }, { jab: A(7, 3, 10, 5, 4.5, 0.85, 35, [32, -30, 42, 28]) }),
    lines: { start: ['Confidence: 100%. Accuracy: pending.'], ko: ['Exactly as I predicted.', 'Working as intended.'], special: ['Trust me.', "That's definitely real."], fall: ['That was intentional.'] },
  },
  {
    id: 'bug', name: 'The Bug', title: 'The Glitch', color: C.navy2, accent: C.cyan,
    blurb: 'Tiny, slippery, and fragile. Reality briefly stops following the rules.',
    special: { name: 'Glitch Step', desc: 'A short directional displacement with a brief invulnerable flicker. Vulnerable afterward.' },
    ranged: { name: 'Packet Loss', desc: 'A packet that blinks forward in jumps. Short range, pops foes upward.' },
    stats: { power: 2, speed: 5, recovery: 3, range: 1, difficulty: 4 },
    walk: 6, air: 5, accel: 0.32, airAccel: 0.55, jump: 13, dbl: 11.5, jumps: 1, fall: 11.5, weight: 78, w: 44, h: 46,
    rec: { vx: 5, vy: -11.5 },
    moves: kit({ r: 0.8, p: 0.85, s: 1.3 }, { heavy: A(22, 5, 14, 12, 7, 1.8, 40, [34, -26, 52, 38]) }),
    lines: { start: ['Segfault incoming.'], ko: ['Known issue.', "Can't reproduce."], special: ['Unexpected behavior detected.'], fall: ['Works on my machine.'] },
  },
];