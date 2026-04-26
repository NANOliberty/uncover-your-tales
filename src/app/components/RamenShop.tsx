import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase =
  | 'ordering'
  | 'submitted'
  | 'handsOrder'
  | 'waiting'
  | 'bowlWindow'
  | 'bowlDeliver'
  | 'bowlPresent'
  | 'eating'
  | 'allEaten'
  | 'clearWindow'
  | 'clearHands'
  | 'done';

type HandMode = 'order' | 'deliver' | 'clear';

interface Order {
  broth: 'Tonkotsu' | 'Shoyu' | 'Miso';
  richness: 'Light' | 'Medium' | 'Rich';
  noodles: 'Soft' | 'Medium' | 'Firm';
  toppings: Set<string>;
}

const TOPPINGS_LIST = ['Chashu', 'Soft Egg', 'Nori', 'Green Onion', 'Bamboo', 'Extra Noodles'];
const BROTH_COLORS: Record<string, string> = { Tonkotsu: '#d4a96a', Shoyu: '#5a2d0e', Miso: '#c07838' };
const PX = { fontFamily: '"Press Start 2P", monospace' } as const;

// ─── Wood / texture CSS helpers ───────────────────────────────────────────────
const COUNTER_GRAIN = [
  'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 9px)',
  'repeating-linear-gradient(0deg, rgba(255,200,110,0.04) 5px, rgba(255,200,110,0.04) 6px, transparent 6px, transparent 9px)',
  'repeating-linear-gradient(0deg, rgba(255,220,140,0.06) 0px, rgba(255,220,140,0.06) 2px, transparent 2px, transparent 9px)',
  'repeating-linear-gradient(-83deg, transparent 0px, transparent 55px, rgba(0,0,0,0.05) 55px, rgba(0,0,0,0.05) 57px, transparent 57px, transparent 110px)',
  'repeating-linear-gradient(-79deg, transparent 0px, transparent 30px, rgba(255,180,80,0.04) 30px, rgba(255,180,80,0.04) 32px, transparent 32px, transparent 65px)',
].join(', ');
const BACK_WALL_GRAIN = [
  'repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 26px)',
  'repeating-linear-gradient(0deg, rgba(0,0,0,0.09) 0px, rgba(0,0,0,0.09) 1px, transparent 1px, transparent 6px)',
  'repeating-linear-gradient(0deg, rgba(255,200,100,0.045) 2px, rgba(255,200,100,0.045) 4px, transparent 4px, transparent 26px)',
  'repeating-linear-gradient(-87deg, transparent 0px, transparent 90px, rgba(0,0,0,0.04) 90px, rgba(0,0,0,0.04) 92px, transparent 92px, transparent 180px)',
].join(', ');
const BAMBOO_SLAT = [
  'repeating-linear-gradient(0deg, #2e1a08 0px, #3c2210 12px, #2a1606 12px, #2a1606 15px)',
  'repeating-linear-gradient(0deg, rgba(255,200,100,0.09) 13px, rgba(255,200,100,0.09) 15px, transparent 15px, transparent 27px)',
  'repeating-linear-gradient(0deg, rgba(255,180,80,0.025) 5px, rgba(255,180,80,0.025) 6px, transparent 6px, transparent 12px)',
  'repeating-linear-gradient(90deg, transparent 0px, transparent 10px, rgba(0,0,0,0.22) 10px, rgba(0,0,0,0.22) 13px)',
  'repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 2px, transparent 2px, transparent 13px)',
].join(', ');

// ─── Steam particle config ─────────────────────────────────────────────────────
const STEAM_PARTICLES = [
  { ox: -26, dur: 2.3, delay: 0.0,  dx:  9, w: 4, h: 15 },
  { ox: -12, dur: 2.7, delay: 0.6,  dx: -8, w: 3, h: 11 },
  { ox:   0, dur: 2.1, delay: 1.15, dx:  6, w: 5, h: 17 },
  { ox:  14, dur: 2.5, delay: 0.35, dx: -9, w: 3, h: 13 },
  { ox:  28, dur: 2.9, delay: 0.9,  dx:  7, w: 4, h: 12 },
  { ox:  -6, dur: 2.4, delay: 1.7,  dx: -5, w: 3, h: 10 },
];

// ─── SVG Pixel Hand ────────────────────────────────────────────────────────────
// Each hand is 52×80px. mode controls pose, mirror flips horizontally.
function PixelHand({ mode, mirror }: { mode: HandMode; mirror: boolean }) {
  const sk = '#c47434';  // skin base
  const sh = '#8a4820';  // skin shadow
  const hi = '#de9a62';  // skin highlight
  const sl = '#2a1408';  // sleeve dark
  const sc = '#3e1e0c';  // sleeve cuff

  const flip = mirror ? 'scale(-1,1) translate(-52,0)' : undefined;

  if (mode === 'order') {
    // Fingers pointing UP (cook receiving order from bottom of window)
    return (
      <svg width="52" height="80" viewBox="0 0 52 80" style={{ display: 'block', overflow: 'visible' }}>
        <g transform={flip}>
          {/* Sleeve body */}
          <rect x="11" y="54" width="30" height="26" fill={sl} />
          {/* Sleeve fold lines */}
          <rect x="11" y="56" width="30" height="2" fill="rgba(255,180,80,0.06)" />
          <rect x="11" y="62" width="30" height="1" fill="rgba(0,0,0,0.18)" />
          <rect x="11" y="70" width="30" height="1" fill="rgba(0,0,0,0.14)" />
          {/* Cuff band */}
          <rect x="11" y="52" width="30" height="5" rx="1" fill={sc} />
          <rect x="11" y="52" width="30" height="1.5" fill="rgba(255,180,80,0.1)" />

          {/* Palm block */}
          <rect x="9" y="28" width="32" height="28" rx="3" fill={sk} />
          {/* Palm left-shadow shading */}
          <rect x="9" y="28" width="10" height="28" rx="2" fill={sh} opacity="0.28" />
          {/* Palm highlight band (top lit) */}
          <rect x="11" y="28" width="28" height="5" rx="2" fill={hi} opacity="0.22" />
          {/* Knuckle crease row */}
          <rect x="12" y="30" width="6"  height="1.5" rx="0.75" fill={sh} opacity="0.35" />
          <rect x="20" y="29" width="6"  height="1.5" rx="0.75" fill={sh} opacity="0.35" />
          <rect x="28" y="29.5" width="6" height="1.5" rx="0.75" fill={sh} opacity="0.35" />

          {/* Finger 1 — index */}
          <rect x="11" y="6"  width="8" height="26" rx="4" fill={sk} />
          <rect x="11" y="6"  width="3" height="26" rx="3" fill={hi} opacity="0.2" />
          <rect x="11" y="6"  width="8" height="4"  rx="4" fill={sh} opacity="0.18" />
          {/* Finger 2 — middle (tallest) */}
          <rect x="21" y="2"  width="9" height="28" rx="4" fill={sk} />
          <rect x="21" y="2"  width="3" height="28" rx="3" fill={hi} opacity="0.18" />
          <rect x="21" y="2"  width="9" height="4"  rx="4" fill={sh} opacity="0.15" />
          {/* Finger 3 — ring */}
          <rect x="32" y="5"  width="8" height="25" rx="4" fill={sk} />
          <rect x="32" y="5"  width="3" height="25" rx="3" fill={hi} opacity="0.14" />
          {/* Knuckle gap shadows */}
          <rect x="19" y="7"  width="2" height="22" rx="1" fill={sh} opacity="0.32" />
          <rect x="30" y="6"  width="2" height="22" rx="1" fill={sh} opacity="0.28" />
          {/* Thumb — left side */}
          <ellipse cx="5"  cy="35" rx="6" ry="9"  fill={sk} />
          <ellipse cx="4"  cy="33" rx="3" ry="5"  fill={hi} opacity="0.2" />
          <ellipse cx="5"  cy="40" rx="4" ry="5"  fill={sh} opacity="0.25" />
        </g>
      </svg>
    );
  }

  if (mode === 'deliver') {
    // Fingers pointing DOWN, palm facing up — supporting bowl from below
    return (
      <svg width="52" height="80" viewBox="0 0 52 80" style={{ display: 'block', overflow: 'visible' }}>
        <g transform={flip}>
          {/* Sleeve body at top */}
          <rect x="11" y="0"  width="30" height="24" fill={sl} />
          <rect x="11" y="4"  width="30" height="1"  fill="rgba(0,0,0,0.18)" />
          <rect x="11" y="12" width="30" height="1"  fill="rgba(0,0,0,0.14)" />
          {/* Cuff */}
          <rect x="11" y="22" width="30" height="5" rx="1" fill={sc} />
          <rect x="11" y="22" width="30" height="1.5" fill="rgba(255,180,80,0.1)" />

          {/* Palm block */}
          <rect x="9" y="24" width="32" height="26" rx="3" fill={sk} />
          {/* Top highlight (lit) */}
          <rect x="11" y="24" width="28" height="6"  rx="2" fill={hi} opacity="0.28" />
          {/* Bottom shadow (underside of palm) */}
          <rect x="9"  y="42" width="32" height="8"  rx="2" fill={sh} opacity="0.3" />
          {/* Left shadow */}
          <rect x="9"  y="24" width="9"  height="26" rx="2" fill={sh} opacity="0.22" />

          {/* Fingers pointing DOWN, evenly spaced */}
          {/* Index */}
          <rect x="11" y="48" width="8" height="22" rx="4" fill={sk} />
          <rect x="11" y="48" width="3" height="22" rx="3" fill={hi} opacity="0.18" />
          <rect x="11" y="66" width="8" height="4"  rx="4" fill={sh} opacity="0.18" />
          {/* Middle */}
          <rect x="21" y="50" width="9" height="24" rx="4" fill={sk} />
          <rect x="21" y="50" width="3" height="24" rx="3" fill={hi} opacity="0.15" />
          <rect x="21" y="70" width="9" height="4"  rx="4" fill={sh} opacity="0.15" />
          {/* Ring */}
          <rect x="32" y="48" width="8" height="22" rx="4" fill={sk} />
          <rect x="32" y="66" width="8" height="4"  rx="4" fill={sh} opacity="0.18" />
          {/* Finger gap shadows */}
          <rect x="19" y="50" width="2" height="20" rx="1" fill={sh} opacity="0.3" />
          <rect x="30" y="50" width="2" height="20" rx="1" fill={sh} opacity="0.26" />
          {/* Thumb — pointing inward */}
          <ellipse cx="5" cy="36" rx="6" ry="8" fill={sk} />
          <ellipse cx="4" cy="34" rx="3" ry="4" fill={hi} opacity="0.2" />
        </g>
      </svg>
    );
  }

  // Clear mode — fingers gripping downward, more tension
  return (
    <svg width="52" height="80" viewBox="0 0 52 80" style={{ display: 'block', overflow: 'visible' }}>
      <g transform={flip}>
        {/* Sleeve */}
        <rect x="11" y="0"  width="30" height="22" fill={sl} />
        <rect x="11" y="20" width="30" height="5"  rx="1" fill={sc} />
        <rect x="11" y="20" width="30" height="1.5" fill="rgba(255,180,80,0.1)" />
        {/* Palm */}
        <rect x="9" y="22" width="32" height="28" rx="3" fill={sk} />
        {/* Lit top */}
        <rect x="11" y="22" width="28" height="5"  rx="2" fill={hi} opacity="0.25" />
        {/* Shadow bottom (tension) */}
        <rect x="9"  y="40" width="32" height="10" rx="2" fill={sh} opacity="0.38" />
        {/* Left shadow */}
        <rect x="9"  y="22" width="9"  height="28" rx="2" fill={sh} opacity="0.24" />
        {/* Knuckle creases (more prominent — gripping) */}
        <rect x="12" y="43" width="7" height="2" rx="1" fill={sh} opacity="0.5" />
        <rect x="21" y="44" width="7" height="2" rx="1" fill={sh} opacity="0.5" />
        <rect x="30" y="43" width="7" height="2" rx="1" fill={sh} opacity="0.5" />
        {/* Curled fingers pointing down */}
        <rect x="11" y="48" width="8"  height="19" rx="4" fill={sk} />
        <rect x="11" y="63" width="8"  height="4"  rx="4" fill={sh} opacity="0.22" />
        <rect x="21" y="50" width="9"  height="22" rx="4" fill={sk} />
        <rect x="21" y="68" width="9"  height="4"  rx="4" fill={sh} opacity="0.2" />
        <rect x="32" y="49" width="8"  height="20" rx="4" fill={sk} />
        <rect x="32" y="65" width="8"  height="4"  rx="4" fill={sh} opacity="0.22" />
        {/* Gap shadows */}
        <rect x="19" y="50" width="2" height="18" rx="1" fill={sh} opacity="0.35" />
        <rect x="30" y="50" width="2" height="18" rx="1" fill={sh} opacity="0.3" />
        {/* Thumb */}
        <ellipse cx="5" cy="34" rx="6" ry="8" fill={sk} />
        <ellipse cx="4" cy="32" rx="3" ry="4" fill={hi} opacity="0.18" />
        <ellipse cx="5" cy="40" rx="4" ry="4" fill={sh} opacity="0.3" />
      </g>
    </svg>
  );
}

// ─── Cook Hands container ─────────────────────────────────────────────────────
function CookHands({ mode, visible }: { mode: HandMode; visible: boolean }) {
  const fromTop = mode === 'deliver' || mode === 'clear';

  const MiniBowl = () => (
    <svg width="58" height="34" viewBox="0 0 58 34" style={{ display: 'block', marginBottom: 2 }}>
      <path d="M 4 16 Q 2 30 29 31 Q 56 30 54 16 Z" fill="#7a3e1a" />
      <ellipse cx="29" cy="16" rx="27" ry="7" fill="#9a5028" />
      <ellipse cx="29" cy="15" rx="25" ry="6" fill="#b06030" />
      <ellipse cx="29" cy="16" rx="23" ry="5" fill={BROTH_COLORS['Tonkotsu']} opacity="0.9" />
      <ellipse cx="29" cy="16" rx="23" ry="5" fill="rgba(255,255,255,0.15)" />
      {/* Decorative band */}
      <path d="M 5 20 Q 3 26 29 27.5 Q 55 26 53 20 Z" fill="none" stroke="#4a2060" strokeWidth="1.5" opacity="0.55" />
      {/* Mini steam */}
      <motion.line x1="20" y1="10" x2="18" y2="3"
        stroke="rgba(255,220,180,0.55)" strokeWidth="1.5" strokeLinecap="round"
        animate={{ opacity: [0.4, 0.8, 0.4], y: [0, -1, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, delay: 0 }} />
      <motion.line x1="29" y1="9"  x2="30" y2="2"
        stroke="rgba(255,220,180,0.45)" strokeWidth="1.5" strokeLinecap="round"
        animate={{ opacity: [0.3, 0.75, 0.3], y: [0, -1.5, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, delay: 0.3 }} />
      <motion.line x1="38" y1="10" x2="36" y2="3"
        stroke="rgba(255,220,180,0.55)" strokeWidth="1.5" strokeLinecap="round"
        animate={{ opacity: [0.4, 0.8, 0.4], y: [0, -1, 0] }}
        transition={{ duration: 1.3, repeat: Infinity, delay: 0.6 }} />
    </svg>
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={fromTop ? { y: '-115%', opacity: 0 } : { y: '115%', opacity: 0 }}
          animate={fromTop ? { y: '28%', opacity: 1 } : { y: '18%', opacity: 1 }}
          exit={fromTop ? { y: '-115%', opacity: 0 } : { y: '115%', opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            ...(fromTop ? { top: 0 } : { bottom: 0 }),
            left: 0, right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
          }}
        >
          {mode === 'deliver' && <MiniBowl />}
          <div style={{ display: 'flex', gap: mode === 'deliver' ? 12 : 32, alignItems: fromTop ? 'flex-start' : 'flex-end' }}>
            <PixelHand mode={mode} mirror={false} />
            <PixelHand mode={mode} mirror={true} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Steam Particles ───────────────────────────────────────────────────────────
function SteamParticles({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div style={{ position: 'absolute', top: -64, left: '50%', transform: 'translateX(-50%)', width: 90, height: 64, pointerEvents: 'none', zIndex: 5 }}>
      {STEAM_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', bottom: 0, left: '50%', marginLeft: p.ox, width: p.w, height: p.h, background: 'rgba(255,230,200,0.55)', borderRadius: Math.ceil(p.w / 2) }}
          animate={{ y: [0, -56, -56], x: [0, p.dx, p.dx * 0.35], opacity: [0, 0.62, 0], scaleX: [1, 0.55, 0.25] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeOut', times: [0, 0.74, 1] }}
        />
      ))}
    </div>
  );
}

// ─── Pixel Ramen Bowl ──────────────────────────────────────────────────────────
function PixelBowl({
  order, eatCount, onEat, phase, lifting,
}: { order: Order; eatCount: number; onEat: () => void; phase: Phase; lifting: boolean }) {
  const [chopAnim, setChopAnim] = useState(false);
  const [ripple, setRipple]     = useState(false);
  const [bowlPulse, setBowlPulse] = useState(false);
  const bc = BROTH_COLORS[order.broth];

  // Synthesised slurp: three successive noise bursts filtered to a mouth-suction timbre
  const playSlurp = () => {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC() as AudioContext;
      const t0  = ctx.currentTime;
      [0, 0.16, 0.32].forEach((off, i) => {
        const dur = 0.20 + i * 0.06;
        const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
        const ch  = buf.getChannelData(0);
        for (let j = 0; j < ch.length; j++) ch[j] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const bp  = ctx.createBiquadFilter();
        bp.type   = 'bandpass';
        bp.frequency.setValueAtTime(900 - i * 120, t0 + off);
        bp.frequency.linearRampToValueAtTime(220, t0 + off + dur);
        bp.Q.value = 4 + i;
        const lp  = ctx.createBiquadFilter();
        lp.type   = 'lowpass';
        lp.frequency.value = 3200;
        const g   = ctx.createGain();
        g.gain.setValueAtTime(0, t0 + off);
        g.gain.linearRampToValueAtTime(0.38 - i * 0.06, t0 + off + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + off + dur);
        src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(ctx.destination);
        src.start(t0 + off);
        src.stop(t0 + off + dur + 0.02);
      });
      setTimeout(() => ctx.close(), 900);
    } catch (_) { /* silent fail */ }
  };
  const fillFrac = Math.max(0, 1 - eatCount * 0.255);
  const brothRx = 86 - eatCount * 2;
  const brothRy = 18 - eatCount * 0.5;

  const hasChashu    = order.toppings.has('Chashu')       && eatCount < 2;
  const hasEgg       = order.toppings.has('Soft Egg')     && eatCount < 3;
  const hasNori      = order.toppings.has('Nori')         && eatCount < 1;
  const hasOnion     = order.toppings.has('Green Onion')  && eatCount < 4;
  const hasBamboo    = order.toppings.has('Bamboo')       && eatCount < 2;
  const hasExtraNood = order.toppings.has('Extra Noodles');

  const clickable = (phase === 'bowlPresent' || phase === 'eating') && eatCount < 4;

  const handleClick = () => {
    if (!clickable) return;
    setChopAnim(true);
    setRipple(true);
    setBowlPulse(true);
    // Slurp fires when noodles are at peak (≈ t=0.56 × 2.4 s = 1 340 ms)
    setTimeout(() => playSlurp(), 1340);
    setTimeout(() => setChopAnim(false), 2400);
    setTimeout(() => setRipple(false), 500);
    setTimeout(() => setBowlPulse(false), 360);
    onEat();
  };

  // Chopstick resting angles (natural V-grip)
  const chopRestL = -14;
  const chopRestR =  14;

  // Keyframes: spread-open → dip into bowl → grip → LIFT HIGH → hold (slurp) → lower back to broth → return rest
  const chopAnimL = { rotateZ: [chopRestL, -28, -28,  -6,  -3,  -3,  -8, -20, chopRestL], y: [0,  6,  6, 90, 90, -44, -44, 64, 0] };
  const chopAnimR = { rotateZ: [chopRestR,  28,  28,   6,   3,   3,   8,  20, chopRestR], y: [0,  6,  6, 90, 90, -44, -44, 64, 0] };
  const chopTimes  = [0, 0.06, 0.16, 0.32, 0.42, 0.54, 0.75, 0.88, 1.0];

  return (
    <motion.div
      style={{ position: 'relative', width: 260, height: 190, cursor: clickable ? 'pointer' : 'default' }}
      onClick={handleClick}
      animate={bowlPulse ? { scale: [1, 0.975, 1.012, 1] } : { scale: 1 }}
      transition={bowlPulse ? { duration: 0.34, ease: 'easeOut' } : {}}
    >
      {/* Steam */}
      <SteamParticles active={eatCount < 4} />

      {/* ── Left chopstick ── */}
      <motion.div
        style={{ position: 'absolute', top: -58, left: '29%', transformOrigin: 'top center', zIndex: 20, pointerEvents: 'none' }}
        animate={chopAnim ? chopAnimL : { rotateZ: chopRestL, y: 0 }}
        transition={{ duration: 2.4, ease: 'easeInOut', times: chopAnim ? chopTimes : undefined }}
      >
        {/* Lacquered chopstick body */}
        <div style={{ width: 5, height: 82, background: 'linear-gradient(to bottom, #a87840 0%, #8a5c28 40%, #5a3410 100%)', borderRadius: 3, boxShadow: '1px 0 2px rgba(0,0,0,0.35)' }} />
        {/* Grip pattern rings */}
        {[12, 20, 28].map(top => (
          <div key={top} style={{ position: 'absolute', top, left: 0, width: 5, height: 2, background: 'rgba(0,0,0,0.22)', borderRadius: 1 }} />
        ))}
        {/* Tip */}
        <div style={{ width: 3, height: 7, background: '#3a2008', borderRadius: '0 0 2px 2px', marginLeft: 1 }} />
      </motion.div>

      {/* ── Right chopstick ── */}
      <motion.div
        style={{ position: 'absolute', top: -58, left: '35%', transformOrigin: 'top center', zIndex: 20, pointerEvents: 'none' }}
        animate={chopAnim ? chopAnimR : { rotateZ: chopRestR, y: 0 }}
        transition={{ duration: 2.4, ease: 'easeInOut', times: chopAnim ? chopTimes : undefined, delay: 0.03 }}
      >
        <div style={{ width: 5, height: 82, background: 'linear-gradient(to bottom, #8a5c28 0%, #6a4018 45%, #4a2808 100%)', borderRadius: 3, boxShadow: '-1px 0 2px rgba(0,0,0,0.3)' }} />
        {[12, 20, 28].map(top => (
          <div key={top} style={{ position: 'absolute', top, left: 0, width: 5, height: 2, background: 'rgba(0,0,0,0.2)', borderRadius: 1 }} />
        ))}
        <div style={{ width: 3, height: 7, background: '#2a1804', borderRadius: '0 0 2px 2px', marginLeft: 1 }} />
      </motion.div>

      {/* ── Noodle lift ── */}
      <AnimatePresence>
        {chopAnim && (
          <motion.svg
            style={{ position: 'absolute', top: -58, left: '19%', zIndex: 21, pointerEvents: 'none', overflow: 'visible' }}
            width="90" height="70" viewBox="0 0 90 70"
            initial={{ opacity: 0, y: 50 }}
            animate={{
              // Rise with chopsticks, hold at peak during slurp, lower back into bowl
              opacity: [0,  0,   1,   1,   1,   1,  0.5,  0],
              y:       [50, 50,  8,  -8,  -8,   8,  48,  50],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4, times: [0, 0.41, 0.53, 0.58, 0.76, 0.87, 0.94, 1.0], ease: 'easeInOut' }}
          >
            {/* Whole clump sways — pivot at chopstick grip (top-center) */}
            <motion.g
              style={{ transformOrigin: '45px 3px' }}
              animate={{ rotateZ: [0, -3.5, 2.8, -2, 1.2, -0.3, 0] }}
              transition={{ duration: 1.05, ease: 'easeInOut', delay: 0.52 }}
            >
              {/* Wet broth ring at grip */}
              <motion.ellipse cx="45" cy="5" rx="9" ry="3.5" fill={bc} opacity="0.55"
                animate={{ rx: [9, 11, 8, 10, 9] }}
                transition={{ duration: 0.4, repeat: 2, ease: 'easeInOut', delay: 0.54 }} />

              {/* Stacked horizontal noodle strands — widest in the middle,
                  tapering at top (grip) and bottom (drip end). Each strand is
                  two wavy S-curve halves that meet at the center. */}
              {([
                { y: 5,  x0: 33, x1: 57, c: '#f8e880', w: 2.4, d: 0.52 },
                { y: 12, x0: 24, x1: 66, c: '#fce484', w: 2.9, d: 0.55 },
                { y: 19, x0: 17, x1: 73, c: '#f4d870', w: 2.8, d: 0.58 },
                { y: 26, x0: 14, x1: 76, c: '#ecd060', w: 2.6, d: 0.61 },
                { y: 33, x0: 16, x1: 74, c: '#e4c450', w: 2.5, d: 0.64 },
                { y: 40, x0: 20, x1: 70, c: '#dbb840', w: 2.2, d: 0.67 },
                { y: 47, x0: 26, x1: 64, c: '#d0ac34', w: 2.0, d: 0.70 },
                { y: 54, x0: 32, x1: 58, c: '#c4a028', w: 1.8, d: 0.73 },
                { y: 61, x0: 36, x1: 54, c: '#b89020', w: 1.5, d: 0.76 },
              ] as { y:number; x0:number; x1:number; c:string; w:number; d:number }[]).map((s, i) => {
                const mx  = (s.x0 + s.x1) / 2;
                const seg = (s.x1 - s.x0) / 3;
                const pd  = `M ${s.x0} ${s.y} C ${s.x0+seg} ${s.y-3} ${mx-seg/2} ${s.y+3} ${mx} ${s.y} C ${mx+seg/2} ${s.y-3} ${s.x1-seg} ${s.y+3} ${s.x1} ${s.y}`;
                return (
                  <motion.path key={i} d={pd}
                    stroke={s.c} strokeWidth={s.w} fill="none" strokeLinecap="round"
                    animate={{ y: [-1.5, 2.2, -1.2, 0.7, 0] }}
                    transition={{ duration: 0.38 + i * 0.04, repeat: 3, ease: 'easeInOut', delay: s.d }}
                  />
                );
              })}

              {/* Broth drips from the bottom of the clump */}
              <motion.circle cx="45" cy="62" r="4" fill={bc}
                animate={{ cy: [62, 75, 83], r: [4, 2.5, 1], opacity: [0.65, 0.3, 0] }}
                transition={{ duration: 0.52, delay: 0.62, ease: 'easeIn', repeat: 3, repeatDelay: 0.38 }} />
              <motion.circle cx="30" cy="57" r="2.8" fill={bc}
                animate={{ cy: [57, 69, 77], r: [2.8, 1.8, 0.8], opacity: [0.5, 0.25, 0] }}
                transition={{ duration: 0.48, delay: 0.84, ease: 'easeIn', repeat: 2, repeatDelay: 0.46 }} />
              <motion.circle cx="60" cy="59" r="2.8" fill={bc}
                animate={{ cy: [59, 71, 79], r: [2.8, 1.8, 0.8], opacity: [0.45, 0.22, 0] }}
                transition={{ duration: 0.45, delay: 1.02, ease: 'easeIn', repeat: 2, repeatDelay: 0.5 }} />
            </motion.g>
          </motion.svg>
        )}
      </AnimatePresence>

      {/* ── Bowl SVG ── */}
      <svg width="260" height="190" viewBox="0 0 260 190" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id="brothGrad" cx="32%" cy="36%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="bowlBodyGrad" cx="30%" cy="35%">
            <stop offset="0%"   stopColor="#9a5a2e" />
            <stop offset="100%" stopColor="#5a2e0e" />
          </radialGradient>
          <radialGradient id="rippleGrad" cx="50%" cy="50%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <clipPath id="brothClip">
            <ellipse cx="130" cy="90" rx="92" ry="23" />
          </clipPath>
          <clipPath id="bowlBodyClip">
            <path d="M 30 92 Q 22 156 130 170 Q 238 156 230 92 Z" />
          </clipPath>
          <filter id="brothBlur">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
        </defs>

        {/* Drop shadow */}
        <ellipse cx="130" cy="178" rx="104" ry="11" fill="rgba(0,0,0,0.5)" />

        {/* ── Bowl body — layered for depth ── */}
        <path d="M 30 92 Q 22 156 130 170 Q 238 156 230 92 Z" fill="url(#bowlBodyGrad)" />
        {/* Left shadow accent */}
        <path d="M 30 92 Q 26 124 44 148 Q 36 122 34 100 Z" fill="rgba(0,0,0,0.3)" />
        {/* Right highlight accent */}
        <path d="M 230 92 Q 232 120 218 144 Q 226 118 228 104 Z" fill="rgba(255,255,255,0.055)" />

        {/* ── Decorative painted band (sometsuke-style) ── */}
        {/* Band fill — indigo blue */}
        <path d="M 33 108 Q 24 124 130 134 Q 236 124 227 108 Z" fill="#1e3870" opacity="0.55"
          clipPath="url(#bowlBodyClip)" />
        <path d="M 33 108 Q 24 118 130 126 Q 236 118 227 108 Z" fill="none"
          stroke="#2a4aa0" strokeWidth="1.5" opacity="0.45" clipPath="url(#bowlBodyClip)" />
        {/* Wave pattern dots within band */}
        {[46, 60, 74, 92, 110, 130, 150, 168, 182, 196, 210].map((x, i) => (
          <circle key={i} cx={x} cy={117 + Math.sin(i * 0.9) * 3} r="2.5" fill="white" opacity="0.28"
            clipPath="url(#bowlBodyClip)" />
        ))}
        {/* Top edge of band */}
        <path d="M 33 108 Q 24 114 130 120 Q 236 114 227 108" fill="none"
          stroke="rgba(180,200,255,0.25)" strokeWidth="1" clipPath="url(#bowlBodyClip)" />
        {/* Bottom edge of band */}
        <path d="M 30 125 Q 22 134 130 142 Q 238 134 230 125" fill="none"
          stroke="rgba(100,140,220,0.3)" strokeWidth="1" clipPath="url(#bowlBodyClip)" />

        {/* ── Rim layers ── */}
        <ellipse cx="130" cy="92" rx="102" ry="27" fill="#a85830" />
        <ellipse cx="130" cy="90" rx="100" ry="25" fill="#c07038" />
        <ellipse cx="130" cy="92" rx="96"  ry="22" fill="#7a3e1a" />
        {/* Rim top-edge highlight */}
        <path d="M 38 88 Q 68 70 130 68 Q 192 70 222 88"
          stroke="rgba(255,220,140,0.18)" strokeWidth="3" fill="none" />
        {/* Rim outer-edge line */}
        <ellipse cx="130" cy="92" rx="102" ry="27"
          fill="none" stroke="rgba(200,100,30,0.3)" strokeWidth="1" />

        {/* ── Broth surface ── */}
        <ellipse
          cx="130" cy={93 + eatCount * 1.6}
          rx={brothRx} ry={brothRy}
          fill={bc} opacity={fillFrac}
          style={{ transition: 'opacity 0.7s ease-out' }}
        />
        {/* Broth highlight gloss */}
        <ellipse
          cx="130" cy={93 + eatCount * 1.6}
          rx={brothRx} ry={brothRy}
          fill="url(#brothGrad)" opacity={fillFrac * 0.55}
          style={{ transition: 'opacity 0.7s ease-out' }}
        />
        {/* Fat/oil swirl on surface (Tonkotsu-style) */}
        {eatCount < 3 && (
          <g opacity={fillFrac * 0.7} filter="url(#brothBlur)" style={{ transition: 'opacity 0.7s' }}>
            <path d="M 112 92 Q 118 88 126 92 Q 134 96 140 92"
              stroke="rgba(255,240,180,0.45)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 120 96 Q 128 93 136 96"
              stroke="rgba(255,230,160,0.35)" strokeWidth="1" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* Click ripple */}
        {ripple && (
          <motion.ellipse cx="130" cy="93"
            initial={{ rx: 12, ry: 5, opacity: 0.65 }}
            animate={{ rx: 75, ry: 17, opacity: 0 }}
            transition={{ duration: 0.48, ease: 'easeOut' }}
            fill="url(#rippleGrad)"
          />
        )}

        {/* ── Noodles ── */}
        {fillFrac > 0.05 && (
          <g opacity={Math.min(1, fillFrac * 1.5)} clipPath="url(#brothClip)"
            style={{ transition: 'opacity 0.7s ease-out' }}>
            <path d="M 42 93 Q 62 84 80 93 Q 98 102 118 93 Q 138 84 158 93 Q 178 102 198 93 Q 212 85 224 93"
              stroke="#e8d080" strokeWidth="3.8" fill="none" strokeLinecap="round" />
            <path d="M 46 99 Q 66 91 84 99 Q 102 107 122 99 Q 142 91 162 99 Q 182 107 202 99"
              stroke="#d4bc60" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            <path d="M 50 105 Q 70 97 88 105 Q 106 113 126 105 Q 146 97 166 105 Q 186 113 206 105"
              stroke="#e0c870" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            <path d="M 44 88 Q 62 80 80 88 Q 98 96 116 88 Q 134 80 152 88 Q 170 96 188 88"
              stroke="rgba(255,220,100,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
            {hasExtraNood && eatCount < 3 && (
              <path d="M 40 83 Q 58 75 76 83 Q 94 91 112 83 Q 130 75 148 83 Q 166 91 184 83 Q 202 76 218 83"
                stroke="#f0e090" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            )}
          </g>
        )}

        {/* ── Toppings ── */}

        {/* Chashu — rolled pork with fat layers (more detailed) */}
        {hasChashu && (
          <g style={{ transition: 'opacity 0.4s' }}>
            {/* Outer dark ring */}
            <ellipse cx="90" cy="80" rx="20" ry="12" fill="#4a1a06" />
            {/* Outer meat ring */}
            <ellipse cx="90" cy="80" rx="18" ry="10" fill="#6b2808" />
            {/* Fat/white ring */}
            <ellipse cx="90" cy="80" rx="14" ry="7.5" fill="#d4a890" />
            {/* Inner meat */}
            <ellipse cx="90" cy="80" rx="10" ry="5.5" fill="#7a2c08" />
            {/* Center glaze */}
            <ellipse cx="90" cy="79" rx="6"  ry="3.5" fill="#8a3810" />
            {/* Char marks on outer edge */}
            <ellipse cx="90" cy="80" rx="18" ry="10" fill="none"
              stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
            {/* Gloss top */}
            <ellipse cx="87" cy="76" rx="5" ry="3" fill="rgba(255,200,160,0.3)" />
          </g>
        )}

        {/* Soft Egg — halved, jammy yolk (more detailed) */}
        {hasEgg && (
          <g transform="translate(148,66)">
            {/* White */}
            <ellipse cx="18" cy="13" rx="18" ry="13" fill="#f2eed0" />
            {/* Egg white inner shadow */}
            <ellipse cx="18" cy="13" rx="18" ry="13" fill="none"
              stroke="#d8caa0" strokeWidth="1.5" />
            {/* Yolk — jammy gradient */}
            <circle cx="18" cy="13" r="9" fill="#d48a18" />
            <circle cx="18" cy="13" r="7" fill="#e8a020" />
            <circle cx="18" cy="12" r="5" fill="#f0b828" />
            {/* Jammy center (not fully set) */}
            <circle cx="18" cy="12" r="3.5" fill="#f8c83a" opacity="0.9" />
            {/* Gloss on yolk */}
            <ellipse cx="15" cy="10" rx="3" ry="2" fill="rgba(255,255,220,0.5)" />
            {/* Soy marinade tint */}
            <ellipse cx="18" cy="13" rx="18" ry="13" fill="rgba(120,60,0,0.08)" />
          </g>
        )}

        {/* Nori — standing sheet */}
        {hasNori && (
          <g>
            {/* Nori sheet body */}
            <rect x="172" y="62" width="20" height="36" rx="1" fill="#1e3014" />
            {/* Nori texture lines */}
            <rect x="173" y="63" width="2"  height="34" fill="rgba(80,140,55,0.22)" />
            <rect x="177" y="63" width="2"  height="34" fill="rgba(80,140,55,0.16)" />
            <rect x="181" y="63" width="2"  height="34" fill="rgba(80,140,55,0.18)" />
            <rect x="185" y="63" width="2"  height="34" fill="rgba(80,140,55,0.12)" />
            {/* Horizontal grain */}
            <rect x="172" y="72" width="20" height="1" fill="rgba(60,120,40,0.2)" />
            <rect x="172" y="82" width="20" height="1" fill="rgba(60,120,40,0.18)" />
            {/* Wet sheen on bottom half */}
            <rect x="172" y="80" width="20" height="18" rx="1" fill="rgba(0,20,0,0.18)" />
            {/* Top edge highlight */}
            <rect x="172" y="62" width="20" height="2" rx="1" fill="rgba(120,200,80,0.15)" />
          </g>
        )}

        {/* Green Onion — scattered rings */}
        {hasOnion && (
          <g opacity={fillFrac} style={{ transition: 'opacity 0.7s' }}>
            {[56, 72, 90, 112, 132, 158, 176].map((x, i) => (
              <g key={i} transform={`translate(${x}, ${84 + (i % 3) * 5})`}>
                <ellipse cx="4" cy="2" rx="4" ry="2" fill="#5aaa40" opacity="0.85" />
                <ellipse cx="4" cy="2" rx="2" ry="1" fill="rgba(255,255,255,0.2)" />
              </g>
            ))}
            {/* Scattered small bits */}
            {[64, 86, 104, 144, 165].map((x, i) => (
              <rect key={`s${i}`} x={x} y={86 + (i % 2) * 7} width={4} height={3} rx={1.5} fill="#48a030" opacity="0.65" />
            ))}
          </g>
        )}

        {/* Menma bamboo shoot — pale strips */}
        {hasBamboo && (
          <g>
            <rect x="52" y="78" width="20" height="13" rx="2" fill="#d0c476" opacity={0.9} />
            <rect x="53" y="79" width="18" height="2.5" fill="rgba(0,0,0,0.1)" rx="1" />
            <rect x="53" y="83" width="18" height="2"   fill="rgba(0,0,0,0.07)" rx="1" />
            <rect x="53" y="87" width="18" height="2.5" fill="rgba(0,0,0,0.1)" rx="1" />
            {/* Slight sheen */}
            <rect x="52" y="78" width="8" height="13" rx="2" fill="rgba(255,255,200,0.1)" />
          </g>
        )}

        {/* ── Rim sheen / final gloss ── */}
        <path d="M 38 88 Q 68 70 130 68 Q 192 70 222 88"
          stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
        <ellipse cx="130" cy="92" rx="90" ry="20"
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      </svg>

      {/* Click hint */}
      {clickable && (
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ ...PX, fontSize: 7, color: '#ffaa44', position: 'absolute', bottom: -26, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
        >
          [ CLICK TO EAT ]
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Order Sheet ──────────────────────────────────────────────────────────────
function OrderSheet({
  order, setOrder, onSubmit,
}: { order: Order; setOrder: React.Dispatch<React.SetStateAction<Order>>; onSubmit: () => void }) {
  const isMob = typeof window !== 'undefined' && window.innerWidth < 640;
  const toggle = (t: string) =>
    setOrder(prev => {
      const next = new Set(prev.toppings);
      next.has(t) ? next.delete(t) : next.add(t);
      return { ...prev, toppings: next };
    });
  const RadioRow = ({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: any) => void }) => (
    <div style={{ marginBottom: isMob ? 7 : 14 }}>
      <div style={{ ...PX, fontSize: isMob ? 5.5 : 8, color: '#3a1800', marginBottom: isMob ? 5 : 8, paddingBottom: isMob ? 3 : 5, borderBottom: '1.5px solid #c0a060' }}>{label}</div>
      <div style={{ display: 'flex', gap: isMob ? 8 : 16, flexWrap: 'wrap' }}>
        {options.map(opt => (
          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: isMob ? 5 : 7, cursor: 'pointer' }} onClick={() => onChange(opt)}>
            <div style={{ width: isMob ? 11 : 14, height: isMob ? 11 : 14, borderRadius: '50%', border: '2px solid #6b3a18', background: value === opt ? '#6b3a18' : 'rgba(255,255,255,0.5)', flexShrink: 0, transition: 'background 0.15s' }} />
            <span style={{ ...PX, fontSize: isMob ? 5.5 : 8, color: '#2a1000' }}>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ background: 'linear-gradient(160deg, #fdf0d8, #f5e4c0)', border: '2.5px solid #b08840', padding: isMob ? '10px 12px 10px' : '20px 24px 18px', width: 'min(440px, calc(100vw - 24px))', boxShadow: '4px 6px 22px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.35)', position: 'relative', userSelect: 'none' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(0,0,0,0.04)' }} />
      <div style={{ textAlign: 'center', marginBottom: isMob ? 10 : 16, borderBottom: '2px solid #8b5030', paddingBottom: isMob ? 6 : 10 }}>
        <div style={{ ...PX, fontSize: isMob ? 9 : 13, color: '#1a0800', marginBottom: isMob ? 3 : 5, letterSpacing: 1 }}>RAMEN ORDER</div>
        <div style={{ ...PX, fontSize: isMob ? 5.5 : 8, color: '#7b3a18', letterSpacing: 2 }}>ラーメン注文</div>
      </div>
      <RadioRow label="BROTH / スープ"     options={['Tonkotsu','Shoyu','Miso']} value={order.broth}    onChange={v => setOrder(p => ({ ...p, broth: v }))} />
      <RadioRow label="RICHNESS / 濃さ"    options={['Light','Medium','Rich']}   value={order.richness} onChange={v => setOrder(p => ({ ...p, richness: v }))} />
      <RadioRow label="NOODLES / 麺の硬さ" options={['Soft','Medium','Firm']}    value={order.noodles}  onChange={v => setOrder(p => ({ ...p, noodles: v }))} />
      <div style={{ marginBottom: isMob ? 10 : 18 }}>
        <div style={{ ...PX, fontSize: isMob ? 5.5 : 8, color: '#3a1800', marginBottom: isMob ? 5 : 8, paddingBottom: isMob ? 3 : 5, borderBottom: '1.5px solid #c0a060' }}>TOPPINGS / トッピング</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMob ? '5px 10px' : '9px 16px' }}>
          {TOPPINGS_LIST.map(t => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: isMob ? 5 : 7, cursor: 'pointer' }} onClick={() => toggle(t)}>
              <div style={{ width: isMob ? 10 : 13, height: isMob ? 10 : 13, border: '2px solid #6b3a18', background: order.toppings.has(t) ? '#6b3a18' : 'rgba(255,255,255,0.5)', flexShrink: 0, transition: 'background 0.15s' }} />
              <span style={{ ...PX, fontSize: isMob ? 5.5 : 7, color: '#2a1000' }}>{t}</span>
            </label>
          ))}
        </div>
      </div>
      <button
        onClick={onSubmit}
        style={{ display: 'block', width: '100%', padding: isMob ? '9px 0' : '12px 0', background: '#3a1800', color: '#ffcc80', border: '2.5px solid #6b3a18', cursor: 'pointer', ...PX, fontSize: isMob ? 7 : 9, boxShadow: '0 4px 0 #1a0800', transition: 'transform 0.1s, box-shadow 0.1s', letterSpacing: 1 }}
        onMouseDown={e => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = '0 0 0 #1a0800'; }}
        onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 0 #1a0800'; }}
      >[ SUBMIT ORDER ]</button>
      <div style={{ ...PX, fontSize: isMob ? 5 : 6, color: 'rgba(106,60,24,0.5)', textAlign: 'center', marginTop: isMob ? 5 : 7, letterSpacing: '0.08em' }}>
        ENTER — SUBMIT  •  BACKSPACE — EXIT
      </div>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035, backgroundImage: 'repeating-linear-gradient(0deg, #6b3a18 0px, #6b3a18 1px, transparent 1px, transparent 18px)' }} />
    </div>
  );
}

// ─── Bamboo Place Mat ─────────────────────────────────────────────────────────
function BambooMat() {
  const slatColors = ['#8c1414', '#7a1010', '#8c1414', '#7a1010', '#8c1414', '#7a1010'];
  const petalAngles = Array.from({ length: 16 }, (_, i) => (i * 22.5 * Math.PI) / 180);
  return (
    <svg width="310" height="80" viewBox="0 0 310 80" shapeRendering="crispEdges" style={{ display: 'block', filter: 'drop-shadow(0 5px 14px rgba(0,0,0,0.75))' }}>
      {/* Base */}
      <rect x="0" y="0" width="310" height="80" fill="#6b0e0e" />
      {/* Horizontal bamboo slats */}
      {slatColors.map((c, i) => (
        <rect key={i} x="2" y={2 + i * 13} width="306" height="12" fill={c} />
      ))}
      {/* Slat shadow lines */}
      {slatColors.map((_, i) => (
        <rect key={i} x="2" y={13 + i * 13} width="306" height="2" fill="#3d0606" />
      ))}
      {/* Highlight shimmer on each slat top */}
      {slatColors.map((_, i) => (
        <rect key={i} x="2" y={2 + i * 13} width="306" height="1" fill="rgba(255,110,110,0.10)" />
      ))}
      {/* Vertical grain marks */}
      {Array.from({ length: 20 }, (_, i) => i * 16 + 5).map((x, i) => (
        <rect key={i} x={x} y="2" width="1" height="76" fill="rgba(0,0,0,0.14)" />
      ))}

      {/* ── Japanese chrysanthemum mon — centered ── */}
      {/* Outer decorative ring */}
      <circle cx="155" cy="40" r="30" fill="none" stroke="rgba(215,155,40,0.35)" strokeWidth="1.5" />
      <circle cx="155" cy="40" r="26" fill="none" stroke="rgba(215,155,40,0.25)" strokeWidth="1" />
      {/* Petal spokes radiating from inner ring to outer ring */}
      {petalAngles.map((a, i) => (
        <line key={i}
          x1={155 + Math.cos(a) * 14} y1={40 + Math.sin(a) * 14}
          x2={155 + Math.cos(a) * 24} y2={40 + Math.sin(a) * 24}
          stroke="rgba(220,155,40,0.50)" strokeWidth="1.5" />
      ))}
      {/* Inner petal ring */}
      <circle cx="155" cy="40" r="14" fill="rgba(140,70,10,0.25)" stroke="rgba(215,155,40,0.45)" strokeWidth="1.5" />
      {/* Center disc */}
      <circle cx="155" cy="40" r="6" fill="rgba(215,155,40,0.55)" />
      <circle cx="155" cy="40" r="3" fill="rgba(255,200,80,0.75)" />

      {/* ── Horizontal flanking lines ── */}
      <line x1="58" y1="40" x2="118" y2="40" stroke="rgba(200,130,40,0.30)" strokeWidth="1" />
      <line x1="192" y1="40" x2="252" y2="40" stroke="rgba(200,130,40,0.30)" strokeWidth="1" />
      <line x1="58" y1="37" x2="100" y2="37" stroke="rgba(200,130,40,0.15)" strokeWidth="1" />
      <line x1="210" y1="37" x2="252" y2="37" stroke="rgba(200,130,40,0.15)" strokeWidth="1" />

      {/* ── Corner diamond knot decorations ── */}
      {([[22, 18], [288, 18], [22, 62], [288, 62]] as [number, number][]).map(([x, y], i) => (
        <g key={i} transform={`rotate(45, ${x}, ${y})`}>
          <rect x={x - 7} y={y - 7} width="14" height="14" fill="none" stroke="rgba(200,140,40,0.40)" strokeWidth="1" />
          <rect x={x - 4} y={y - 4} width="8"  height="8"  fill="none" stroke="rgba(200,140,40,0.28)" strokeWidth="1" />
          <rect x={x - 1} y={y - 1} width="2"  height="2"  fill="rgba(220,160,40,0.60)" />
        </g>
      ))}

      {/* Outer border */}
      <rect x="0" y="0" width="310" height="80" fill="none" stroke="#2a0505" strokeWidth="3" />
      <rect x="3" y="3" width="304" height="74" fill="none" stroke="rgba(220,140,60,0.18)" strokeWidth="1" />
    </svg>
  );
}

// ─── Menu Card ────────────────────────────────────────────────────────────────
function MenuCard() {
  const items = [
    { jp: 'ラーメン',     price: '¥980'  },
    { jp: 'つけ麺',       price: '¥1050' },
    { jp: '餃子',         price: '¥380'  },
    { jp: 'チャーシュー', price: '¥280'  },
    { jp: '煮玉子',       price: '¥150'  },
    { jp: 'ビール',       price: '¥550'  },
    { jp: 'ライス',       price: '¥180'  },
  ];
  return (
    <div style={{ position: 'relative', width: 100, background: 'linear-gradient(150deg, #fdf0d8, #eee0b8)', border: '1.5px solid #a08038', boxShadow: '2px 5px 14px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.3)', padding: '8px 10px 10px 16px', transform: 'rotate(-2deg)', flexShrink: 0 }}>
      {/* Dog-ear fold */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, background: 'linear-gradient(225deg, #d0b880 50%, transparent 50%)' }} />
      {/* Binding stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 9, bottom: 0, background: 'linear-gradient(to right, #c8a040, #b88830)', opacity: 0.6 }} />
      {/* Binding ring holes */}
      {[20, 50, 80].map(pct => (
        <div key={pct} style={{ position: 'absolute', left: 2.5, top: `${pct}%`, transform: 'translateY(-50%)', width: 4, height: 4, borderRadius: '50%', background: '#7a5010', opacity: 0.7 }} />
      ))}
      {/* Title */}
      <div style={{ ...PX, fontSize: 5.5, color: '#2a1200', borderBottom: '2px solid #9a7828', paddingBottom: 4, marginBottom: 4, letterSpacing: 0.5, textAlign: 'center' }}>MENU</div>
      <div style={{ fontFamily: 'serif', fontSize: 11, color: '#7a4010', textAlign: 'center', marginBottom: 5, lineHeight: 1 }}>一覧</div>
      <div style={{ height: 1, background: 'rgba(160,100,20,0.22)', marginBottom: 6 }} />
      {/* Items */}
      {items.map(({ jp, price }) => (
        <div key={jp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 6 }}>
          <span style={{ fontFamily: 'serif', fontSize: 11, color: '#1e0e00', lineHeight: 1, whiteSpace: 'nowrap' }}>{jp}</span>
          <span style={{ ...PX, fontSize: 3.5, color: '#7a4810', lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 0 }}>{price}</span>
        </div>
      ))}
      <div style={{ height: 1, background: 'rgba(160,100,20,0.18)', marginTop: 1 }} />
      {/* Paper texture */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04, backgroundImage: 'repeating-linear-gradient(0deg, #8b5030 0px, #8b5030 1px, transparent 1px, transparent 12px)' }} />
    </div>
  );
}

// ─── Water Cup ────────────────────────────────────────────────────────────────
function WaterCup() {
  return (
    <svg width="38" height="64" viewBox="0 0 38 64" style={{ display: 'block', overflow: 'visible' }}>
      {/* Shadow */}
      <ellipse cx="19" cy="63" rx="13" ry="4" fill="rgba(0,0,0,0.38)" />
      {/* Cup body — slightly tapered (wider at top) */}
      <path d="M 6 10 L 4 58 Q 4 62 19 62 Q 34 62 34 58 L 32 10 Z"
        fill="rgba(190,225,255,0.10)" stroke="rgba(200,235,255,0.32)" strokeWidth="1.5" />
      {/* Water fill */}
      <path d="M 7 24 L 5.5 58 Q 5.5 61 19 61 Q 32.5 61 32.5 58 L 31 24 Z"
        fill="rgba(140,200,255,0.20)" />
      {/* Water surface line */}
      <path d="M 7 24 Q 13 21 19 23 Q 25 21 31 24"
        fill="none" stroke="rgba(200,240,255,0.45)" strokeWidth="1" />
      {/* Highlight stripe */}
      <path d="M 8 12 L 6.5 54" stroke="rgba(255,255,255,0.32)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Small bubble circles */}
      <circle cx="14" cy="46" r="2.5" fill="none" stroke="rgba(200,240,255,0.4)" strokeWidth="1" />
      <circle cx="22" cy="38" r="1.5" fill="none" stroke="rgba(200,240,255,0.35)" strokeWidth="0.8" />
      <circle cx="18" cy="52" r="1.8" fill="none" stroke="rgba(200,240,255,0.3)" strokeWidth="0.8" />
      {/* Rim top ellipse */}
      <ellipse cx="19" cy="10" rx="13" ry="3.5"
        fill="rgba(210,240,255,0.28)" stroke="rgba(220,245,255,0.4)" strokeWidth="1" />
      {/* Rim highlight */}
      <path d="M 9 10 Q 13 8 19 9" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ─── Soy Sauce Bottle ─────────────────────────────────────────────────────────
function SoySauceBottle() {
  return (
    <svg width="32" height="80" viewBox="0 0 32 80" style={{ display: 'block', overflow: 'visible' }}>
      {/* Shadow */}
      <ellipse cx="16" cy="79" rx="11" ry="4" fill="rgba(0,0,0,0.42)" />
      {/* Bottle body */}
      <path d="M 5 30 L 4 68 Q 4 76 16 76 Q 28 76 28 68 L 27 30 Z" fill="#1c1008" />
      {/* Body side highlight */}
      <path d="M 6 32 L 5.5 66" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Shoulder */}
      <path d="M 5 30 Q 5 20 10 17 L 10 12 L 22 12 L 22 17 Q 27 20 27 30 Z" fill="#1c1008" />
      {/* Neck */}
      <rect x="10" y="7" width="12" height="8" rx="3" fill="#181008" />
      {/* Red cap */}
      <rect x="9" y="3" width="14" height="7" rx="3" fill="#b82010" />
      <rect x="9" y="3" width="14" height="3" rx="2" fill="#d43020" />
      {/* Pouring spout hole */}
      <circle cx="16" cy="4" r="2" fill="#8a1008" />
      {/* Label */}
      <rect x="7" y="35" width="18" height="28" rx="2" fill="rgba(255,255,255,0.88)" />
      {/* Label top red band */}
      <rect x="7" y="35" width="18" height="8" rx="2" fill="#b82010" />
      {/* Label kanji lines */}
      <rect x="9" y="37" width="14" height="2" rx="1" fill="rgba(255,255,255,0.7)" />
      <rect x="9" y="45" width="14" height="1.5" rx="0.75" fill="#1c1008" opacity="0.65" />
      <rect x="9" y="49" width="14" height="1.5" rx="0.75" fill="#1c1008" opacity="0.45" />
      <rect x="9" y="53" width="14" height="1.5" rx="0.75" fill="#1c1008" opacity="0.45" />
      <rect x="9" y="57" width="10" height="1.5" rx="0.75" fill="#1c1008" opacity="0.35" />
    </svg>
  );
}

// ─── Togarashi Spice Shaker ───────────────────────────────────────────────────
function SpiceShaker() {
  return (
    <svg width="26" height="70" viewBox="0 0 26 70" style={{ display: 'block', overflow: 'visible' }}>
      {/* Shadow */}
      <ellipse cx="13" cy="69" rx="9" ry="3.5" fill="rgba(0,0,0,0.38)" />
      {/* Cylinder body */}
      <path d="M 4 20 L 3 62 Q 3 67 13 67 Q 23 67 23 62 L 22 20 Z" fill="#f2f0ec" />
      {/* Body highlight */}
      <path d="M 5 22 L 4.5 60" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Shoulder */}
      <path d="M 4 20 Q 4 14 8 12 L 8 8 L 18 8 L 18 12 Q 22 14 22 20 Z" fill="#e8e6e2" />
      {/* Neck */}
      <rect x="8" y="4" width="10" height="7" rx="2.5" fill="#d8d6d2" />
      {/* Metal shaker cap */}
      <rect x="6" y="1" width="14" height="6" rx="3" fill="#b0b0ac" />
      <rect x="6" y="1" width="14" height="2.5" rx="2" fill="#d0d0cc" />
      {/* Shaker holes in 3×2 grid */}
      {[9, 13, 17].map(x => [2.5, 4.5].map(y => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill="#787874" />
      )))}
      {/* Label — red top band */}
      <rect x="5" y="26" width="16" height="32" rx="2" fill="#de1e0e" opacity="0.92" />
      <rect x="5" y="26" width="16" height="11" rx="2" fill="#be1008" />
      {/* Label white strip */}
      <rect x="5" y="37" width="16" height="14" rx="1" fill="rgba(255,255,255,0.92)" />
      {/* Label text lines */}
      <rect x="7" y="28" width="12" height="2" rx="1" fill="rgba(255,255,255,0.65)" />
      <rect x="7" y="32" width="12" height="1.5" rx="0.75" fill="rgba(255,255,255,0.4)" />
      {/* Kanji placeholder lines */}
      <rect x="7" y="39" width="12" height="2" rx="1" fill="#be1008" />
      <rect x="7" y="43" width="9"  height="1.5" rx="0.75" fill="#be1008" opacity="0.6" />
      {/* Spice pepper dots */}
      {[{x:7,y:53},{x:11,y:56},{x:16,y:53},{x:8,y:57},{x:14,y:57},{x:12,y:51}].map((p,i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.3" fill="#8a0e06" opacity="0.72" />
      ))}
    </svg>
  );
}

// ─── Napkin Holder ────────────────────────────────────────────────────────────
function NapkinHolder() {
  return (
    <svg width="52" height="60" viewBox="0 0 52 60" style={{ display: 'block', overflow: 'visible' }}>
      {/* Shadow */}
      <ellipse cx="26" cy="59" rx="20" ry="4.5" fill="rgba(0,0,0,0.42)" />
      {/* Base slab */}
      <rect x="4" y="48" width="44" height="8" rx="3" fill="#4e2c0e" />
      <rect x="4" y="48" width="44" height="3" rx="2" fill="rgba(255,180,80,0.12)" />
      {/* Left wall */}
      <rect x="4"  y="12" width="8" height="40" rx="2" fill="#623818" />
      <rect x="4"  y="12" width="4" height="40" rx="2" fill="rgba(255,180,80,0.08)" />
      {/* Right wall */}
      <rect x="40" y="12" width="8" height="40" rx="2" fill="#623818" />
      <rect x="40" y="12" width="4" height="40" rx="2" fill="rgba(255,180,80,0.06)" />
      {/* Napkin stack — 6 sheets, each slightly offset */}
      {[0,1,2,3,4,5].map(i => (
        <rect key={i}
          x={13 - i * 0.3} y={14 + i * 2}
          width={26 + i * 0.5} height={34 - i * 2}
          rx="1.5"
          fill={i === 0 ? '#faf6f0' : `rgba(244,238,226,${0.96 - i * 0.05})`}
          stroke="rgba(190,170,130,0.28)" strokeWidth="0.5"
        />
      ))}
      {/* Top napkin — fold triangle at top-right corner */}
      <path d="M 34 16 L 39 16 L 39 21 Z" fill="rgba(200,180,140,0.45)" />
      {/* Horizontal crease lines */}
      <line x1="14" y1="20" x2="38" y2="20" stroke="rgba(170,150,110,0.3)" strokeWidth="0.7" />
      <line x1="14" y1="28" x2="38" y2="28" stroke="rgba(170,150,110,0.22)" strokeWidth="0.5" />
      <line x1="14" y1="36" x2="38" y2="36" stroke="rgba(170,150,110,0.18)" strokeWidth="0.5" />
      {/* Vertical fold line (center) */}
      <line x1="26" y1="15" x2="26" y2="46" stroke="rgba(170,150,110,0.2)" strokeWidth="0.5" />
    </svg>
  );
}

// ─── Chopstick Rest + Spare Chopsticks ───────────────────────────────────────
function ChopstickRest() {
  return (
    <svg width="68" height="44" viewBox="0 0 68 44" style={{ display: 'block', overflow: 'visible' }}>
      {/* Shadow */}
      <ellipse cx="34" cy="43" rx="28" ry="4" fill="rgba(0,0,0,0.38)" />

      {/* Chopstick 1 — upper, lighter lacquer */}
      <rect x="0" y="10" width="62" height="5.5" rx="2.75" fill="#a07840" />
      <rect x="0" y="10" width="10" height="5.5" rx="2.75" fill="#7a5420" />
      <rect x="62" y="11" width="4"  height="3.5" rx="1.75" fill="#5a3810" />
      {/* Grip rings on chopstick 1 */}
      {[8, 13, 18, 23].map(x => (
        <rect key={x} x={x} y={10} width={2} height={5.5} rx={1} fill="rgba(0,0,0,0.22)" />
      ))}
      {/* Highlight on chopstick 1 */}
      <rect x="1" y="11" width="58" height="1.5" rx="0.75" fill="rgba(255,255,255,0.14)" />

      {/* Chopstick 2 — lower, darker lacquer */}
      <rect x="0" y="18" width="62" height="5" rx="2.5" fill="#8a5e28" />
      <rect x="0" y="18" width="10" height="5"  rx="2.5" fill="#6a4018" />
      <rect x="62" y="18.75" width="4" height="3.5" rx="1.75" fill="#4a2c0e" />
      {[8, 13, 18, 23].map(x => (
        <rect key={x} x={x} y={18} width={2} height={5} rx={1} fill="rgba(0,0,0,0.2)" />
      ))}
      <rect x="1" y="19" width="58" height="1.5" rx="0.75" fill="rgba(255,255,255,0.1)" />

      {/* Ceramic hashioki rest — white/cream body */}
      <path d="M 10 28 Q 8 36 18 36 Q 34 38 50 36 Q 60 36 58 28 L 50 26 L 18 26 Z" fill="#e8e2d4" />
      {/* Rest top surface */}
      <path d="M 10 26 Q 34 22 58 26" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
      <rect x="10" y="26" width="48" height="3" rx="1.5" fill="rgba(0,0,0,0.08)" />
      {/* Blue wave decoration on ceramic */}
      <path d="M 17 31 Q 21 28 25 31 Q 29 34 33 31 Q 37 28 41 31 Q 45 34 49 31"
        fill="none" stroke="#2244aa" strokeWidth="1.2" opacity="0.55" strokeLinecap="round" />
      {/* Corner accent dots */}
      <circle cx="15" cy="33" r="2" fill="#2244aa" opacity="0.45" />
      <circle cx="53" cy="33" r="2" fill="#2244aa" opacity="0.45" />
    </svg>
  );
}

// ─── Preparing Sign ───────────────────────────────────────────────────────────
function PreparingSign({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'absolute', left: '2%', top: '24%', zIndex: 14, pointerEvents: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-around', paddingLeft: 12, paddingRight: 12 }}>
            <div style={{ width: 2, height: 16, background: 'linear-gradient(to bottom, #5a3010, #3a1e08)' }} />
            <div style={{ width: 2, height: 16, background: 'linear-gradient(to bottom, #5a3010, #3a1e08)' }} />
          </div>
          <div style={{ background: 'linear-gradient(175deg, #2e1508, #1a0c04)', border: '2px solid #5a3212', boxShadow: '0 6px 20px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,180,80,0.08), inset 0 -1px 0 rgba(0,0,0,0.3)', padding: '10px 10px 12px', width: 62, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,200,80,1) 0px, rgba(255,200,80,1) 1px, transparent 1px, transparent 8px)', pointerEvents: 'none' }} />
            <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(200,120,40,0.5), transparent)', marginBottom: 10 }} />
            {'料理中'.split('').map((ch, i) => (
              <motion.div key={i}
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }}
                style={{ fontFamily: 'serif', fontSize: 15, color: '#e09030', textAlign: 'center', lineHeight: 1, marginBottom: 5, textShadow: '0 0 10px rgba(255,150,30,0.55)' }}
              >{ch}</motion.div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 8 }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i}
                  animate={{ opacity: [0.15, 1, 0.15], y: [0, -4, 0], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                  style={{ width: 5, height: 5, borderRadius: '50%', background: '#c07828', boxShadow: '0 0 4px rgba(200,120,40,0.6)' }}
                />
              ))}
            </div>
            <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(200,120,40,0.5), transparent)', marginTop: 10 }} />
          </div>
          <div style={{ width: 8, height: 8, background: '#3a1a06', borderRadius: '0 0 4px 4px', margin: '0 auto' }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Done Sign ────────────────────────────────────────────────────────────────
function DoneSign({ visible }: { visible: boolean }) {
  const chars = 'また来てね'.split('');
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'absolute', right: '2%', top: '22%', zIndex: 14, pointerEvents: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-around', paddingLeft: 10, paddingRight: 10 }}>
            <div style={{ width: 2, height: 16, background: 'linear-gradient(to bottom, #5a3010, #3a1e08)' }} />
            <div style={{ width: 2, height: 16, background: 'linear-gradient(to bottom, #5a3010, #3a1e08)' }} />
          </div>
          <div style={{ background: 'linear-gradient(175deg, #1c0a02, #120700)', border: '2px solid #7a4818', boxShadow: ['0 6px 24px rgba(0,0,0,0.8)', '0 0 28px rgba(255,160,40,0.18)', 'inset 0 1px 0 rgba(255,200,80,0.14)'].join(', '), padding: '10px 10px 12px', width: 62, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,200,80,1) 0px, rgba(255,200,80,1) 1px, transparent 1px, transparent 8px)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(220,140,40,0.45)' }} />
              <motion.div animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#d08020', boxShadow: '0 0 8px rgba(255,160,40,0.7)' }} />
              <div style={{ flex: 1, height: 1, background: 'rgba(220,140,40,0.45)' }} />
            </div>
            {chars.map((ch, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: i * 0.16 + 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontFamily: 'serif', fontSize: 17, color: '#ffd060', textAlign: 'center', lineHeight: 1, marginBottom: 4, textShadow: '0 0 12px rgba(255,190,50,0.85), 0 0 28px rgba(255,130,20,0.4)' }}
              >{ch}</motion.div>
            ))}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: chars.length * 0.16 + 0.55, duration: 0.6 }}>
              <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(200,130,40,0.4), transparent)', margin: '8px 0 6px' }} />
              <div style={{ ...PX, fontSize: 4, color: '#a07030', textAlign: 'center', lineHeight: 1.7, letterSpacing: 1 }}>come<br />again</div>
            </motion.div>
            <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(200,120,40,0.5), transparent)', marginTop: 8 }} />
          </div>
          <div style={{ width: 8, height: 8, background: '#3a1a06', borderRadius: '0 0 4px 4px', margin: '0 auto' }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface RamenShopProps { onExit: () => void; }

export function RamenShop({ onExit }: RamenShopProps) {
  const [phase, setPhase]           = useState<Phase>('ordering');
  const [order, setOrder]           = useState<Order>({ broth: 'Tonkotsu', richness: 'Medium', noodles: 'Medium', toppings: new Set(['Chashu', 'Soft Egg']) });
  const [eatCount, setEatCount]     = useState(0);
  const [windowOpen, setWindowOpen] = useState(false);
  const [showHands, setShowHands]   = useState(false);
  const [handMode, setHandMode]     = useState<HandMode>('order');
  const [showBowl, setShowBowl]     = useState(false);
  const [bowlLifting, setBowlLifting] = useState(false);
  const timers = useRef<number[]>([]);

  const after = (fn: () => void, ms: number) => { const id = window.setTimeout(fn, ms); timers.current.push(id); };
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  // Stable ref so the keyboard handler always sees the latest phase
  const phaseRef = useRef<Phase>('ordering');
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Enter submits the order; Backspace exits back to the map
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') { e.preventDefault(); onExit(); return; }
      if (e.key === 'Enter' && phaseRef.current === 'ordering') { e.preventDefault(); handleSubmit(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = () => {
    setPhase('submitted');
    after(() => {
      setWindowOpen(true); setPhase('handsOrder');
      after(() => {
        setHandMode('order'); setShowHands(true);
        after(() => {
          setShowHands(false);
          after(() => {
            setWindowOpen(false); setPhase('waiting');
            after(() => {
              setWindowOpen(true); setPhase('bowlWindow');
              after(() => {
                setHandMode('deliver'); setShowHands(true); setPhase('bowlDeliver');
                after(() => {
                  setShowBowl(true);
                  after(() => {
                    setShowHands(false); setPhase('bowlPresent');
                  }, 900);
                }, 750);
              }, 450);
            }, 3200);
          }, 380);
        }, 1500);
      }, 400);
    }, 600);
  };

  const handleEat = () => {
    if (phase === 'bowlPresent') setPhase('eating');
    const next = eatCount + 1;
    setEatCount(next);
    if (next >= 4) {
      setPhase('allEaten');
      after(() => {
        setWindowOpen(true); setPhase('clearWindow');
        after(() => {
          setHandMode('clear'); setShowHands(true); setPhase('clearHands');
          after(() => {
            setBowlLifting(true);
            after(() => {
              setShowHands(false); setShowBowl(false); setBowlLifting(false);
              after(() => {
                setWindowOpen(false);
                after(() => { setPhase('done'); }, 600);
              }, 400);
            }, 780);
          }, 620);
        }, 480);
      }, 550);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden', background: '#1e0d03' }}>

      {/* Warm amber atmosphere */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 90% 80% at 50% 20%, rgba(200,90,10,0.12) 0%, rgba(120,50,0,0.07) 55%, transparent 80%)' }} />

      {/* Ceiling */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '22%', background: 'linear-gradient(to bottom, #0e0500 0%, #1c0b02 60%, #241106 100%)', backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 32px)' }} />

      {/* Lamp cord */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 3, height: '15%', background: 'linear-gradient(to bottom, #3a1e08, #2a1206)', zIndex: 2 }} />
      {/* Lamp shade */}
      <div style={{ position: 'absolute', top: '13%', left: '50%', transform: 'translateX(-50%)', width: 64, height: 34, zIndex: 3, background: 'radial-gradient(ellipse at 38% 30%, #fffae8 0%, #f8d060 40%, #d08018 100%)', borderRadius: '6px 6px 55% 55%', boxShadow: '0 2px 0 #a06010 inset' }}>
        <div style={{ position: 'absolute', bottom: -5, left: -5, right: -5, height: 7, background: '#b87020', borderRadius: '0 0 55% 55%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(255,240,180,0.5) 0%, transparent 70%)', borderRadius: 'inherit' }} />
      </div>
      {/* Lamp glow halo */}
      <motion.div animate={{ opacity: [0.65, 1, 0.65], scale: [0.94, 1.06, 0.94] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%) translateX(-2px)', width: 120, height: 120, zIndex: 1, pointerEvents: 'none', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,200,80,0.38) 0%, rgba(255,150,30,0.18) 40%, transparent 70%)', filter: 'blur(6px)' }} />
      {/* Lamp cone */}
      <motion.div animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '17%', left: '50%', transform: 'translateX(-50%)', width: '64%', height: '68%', pointerEvents: 'none', zIndex: 1, background: 'radial-gradient(ellipse at center top, rgba(255,195,80,0.16) 0%, rgba(255,150,40,0.08) 38%, transparent 65%)' }} />

      {/* Back wall */}
      <div style={{ position: 'absolute', top: '18%', left: '10%', right: '10%', bottom: '34%', background: '#2c1608', backgroundImage: BACK_WALL_GRAIN }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255,160,50,0.09) 0%, transparent 60%)' }} />
      </div>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '10%', bottom: '34%', background: 'linear-gradient(to right, #0e0500 0%, #1c0c04 80%, #241008 100%)' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: '10%', bottom: '34%', background: 'linear-gradient(to left, #0e0500 0%, #1c0c04 80%, #241008 100%)' }} />

      {/* Window partition */}
      <div style={{ position: 'absolute', top: '22%', left: '28%', right: '28%', height: '36%', border: '8px solid #5a3212', background: '#100600', boxShadow: ['0 0 0 2px #2e1204', 'inset 0 0 30px rgba(0,0,0,0.85)', '0 10px 30px rgba(0,0,0,0.7)', '0 -1px 0 rgba(160,90,20,0.3)'].join(', '), overflow: 'hidden', zIndex: 6 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center bottom, #180a02, #060100)' }} />
        <AnimatePresence>
          {windowOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center 80%, rgba(255,140,40,0.22) 0%, rgba(200,80,10,0.08) 55%, transparent 75%)' }} />
          )}
        </AnimatePresence>
        <CookHands mode={handMode} visible={showHands} />
        {/* Sliding panel */}
        <motion.div style={{ position: 'absolute', inset: 0, zIndex: 10 }} animate={{ y: windowOpen ? '-100%' : '0%' }} transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}>
          <div style={{ position: 'absolute', inset: 0, background: '#c09848', backgroundImage: ['repeating-linear-gradient(0deg, rgba(0,0,0,0.09) 0px, rgba(0,0,0,0.09) 1px, transparent 1px, transparent 16px)', 'repeating-linear-gradient(0deg, rgba(255,220,130,0.06) 8px, rgba(255,220,130,0.06) 9px, transparent 9px, transparent 16px)', 'repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 20px)'].join(', ') }}>
            <div style={{ position: 'absolute', top: '31%', left: 0, right: 0, height: 5, background: '#9a7220', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
            <div style={{ position: 'absolute', top: '63%', left: 0, right: 0, height: 5, background: '#9a7220', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 5, transform: 'translateX(-50%)', background: '#9a7220' }} />
            <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', width: 30, height: 10, background: '#6a4010', border: '1px solid #4a2c08', borderRadius: 3 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'rgba(255,200,80,0.15)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(0,0,0,0.18)' }} />
          </div>
        </motion.div>
      </div>

      {/* Light leak under window */}
      <AnimatePresence>
        {!windowOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            style={{ position: 'absolute', top: 'calc(22% + 36% + 12px)', left: '27%', right: '27%', height: 6, zIndex: 7, pointerEvents: 'none' }}>
            <div style={{ width: '100%', height: '100%', background: 'radial-gradient(ellipse at center, rgba(255,200,80,0.55) 0%, rgba(255,160,40,0.25) 45%, transparent 75%)', filter: 'blur(3px)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bamboo screens */}
      <div style={{ position: 'absolute', bottom: '34%', left: 0, width: '27%', height: '44%', backgroundImage: BAMBOO_SLAT, clipPath: 'polygon(0 100%, 100% 100%, 70% 0%, 0% 0%)', zIndex: 8 }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to left, rgba(255,150,40,0.08) 0%, transparent 50%)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: '76%', left: 0, width: '27%', height: 8, background: 'linear-gradient(to bottom, #7a4a20, #5a3212)', clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0% 100%)', zIndex: 9, boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'absolute', bottom: '34%', left: 0, width: '1%', height: '44%', background: 'linear-gradient(to right, rgba(255,160,60,0.06), transparent)', zIndex: 9, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '34%', right: 0, width: '27%', height: '44%', backgroundImage: BAMBOO_SLAT, clipPath: 'polygon(100% 100%, 0% 100%, 30% 0%, 100% 0%)', zIndex: 8 }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to right, rgba(255,150,40,0.08) 0%, transparent 50%)' }} />
      </div>
      <div style={{ position: 'absolute', bottom: '76%', right: 0, width: '27%', height: 8, background: 'linear-gradient(to bottom, #7a4a20, #5a3212)', clipPath: 'polygon(100% 0, 0% 0, 30% 100%, 100% 100%)', zIndex: 9, boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'absolute', bottom: '34%', right: 0, width: '1%', height: '44%', background: 'linear-gradient(to left, rgba(255,160,60,0.06), transparent)', zIndex: 9, pointerEvents: 'none' }} />

      {/* Counter surface */}
      <div style={{ position: 'absolute', bottom: '16%', left: 0, right: 0, height: '20%', background: '#5c3818', backgroundImage: COUNTER_GRAIN, borderTop: '4px solid #8a5a2e', zIndex: 10 }}>
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '100%', background: 'radial-gradient(ellipse at 50% 0%, rgba(255,210,100,0.18) 0%, rgba(255,170,60,0.06) 55%, transparent 80%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(to bottom, rgba(255,220,140,0.28), transparent)' }} />
        <div style={{ position: 'absolute', top: 12, left: 0, right: 0, height: 3, background: '#321808', borderTop: '1px solid rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.25))' }} />
      </div>
      <div style={{ position: 'absolute', bottom: '7%', left: 0, right: 0, height: '10%', background: 'linear-gradient(to bottom, #281408 0%, #0e0602 100%)', zIndex: 10 }} />

      {/* Floor */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8%', background: '#120700', backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,180,60,0.02) 0px, rgba(255,180,60,0.02) 1px, transparent 1px, transparent 52px)', zIndex: 10 }} />

      {/* ── Counter props ─────────────────────────────────────────────────────
           LEFT CLUSTER  (hugging left bamboo screen)
           RIGHT CLUSTER (hugging right bamboo screen)
      ─────────────────────────────────────────────────────────────────────── */}

      {/* LEFT — menu card */}
      <div style={{ position: 'absolute', bottom: '20%', left: '0%', zIndex: 12, transformOrigin: 'bottom left', filter: 'drop-shadow(3px 6px 10px rgba(0,0,0,0.65))' }}>
        <MenuCard />
      </div>
      {/* LEFT — chopstick rest sits just right of menu card */}
      <div style={{ position: 'absolute', bottom: '20%', left: '13%', zIndex: 12, transformOrigin: 'bottom left', filter: 'drop-shadow(2px 5px 9px rgba(0,0,0,0.55))' }}>
        <ChopstickRest />
      </div>

      {/* RIGHT — napkin holder */}
      <div style={{ position: 'absolute', bottom: '19%', right: '15%', zIndex: 12, transformOrigin: 'bottom right', filter: 'drop-shadow(2px 6px 10px rgba(0,0,0,0.55))' }}>
        <NapkinHolder />
      </div>
      {/* RIGHT — soy sauce bottle */}
      <div style={{ position: 'absolute', bottom: '19%', right: '9%', zIndex: 12, transformOrigin: 'bottom center', filter: 'drop-shadow(2px 6px 10px rgba(0,0,0,0.6))' }}>
        <SoySauceBottle />
      </div>
      {/* RIGHT — spice shaker */}
      <div style={{ position: 'absolute', bottom: '19%', right: '4.5%', zIndex: 12, transformOrigin: 'bottom center', filter: 'drop-shadow(2px 6px 10px rgba(0,0,0,0.55))' }}>
        <SpiceShaker />
      </div>
      {/* RIGHT — water cup (far right corner) */}
      <div style={{ position: 'absolute', bottom: '20%', right: '0.5%', zIndex: 12, transformOrigin: 'bottom right', filter: 'drop-shadow(2px 6px 10px rgba(0,0,0,0.55))' }}>
        <WaterCup />
      </div>

      {/* ── Main counter items ─────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: '22%', left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 28 }}>

        {/* Order sheet */}
        <AnimatePresence>
          {phase === 'ordering' && (
            <motion.div key="sheet"
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -100, rotateX: 15, scale: 0.88, transition: { duration: 0.6, ease: [0.4, 0, 0.6, 1] } }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <OrderSheet order={order} setOrder={setOrder} onSubmit={handleSubmit} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bamboo place mat — appears with the bowl */}
        <AnimatePresence>
          {showBowl && (
            <motion.div key="mat"
              style={{ position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)', zIndex: 0, pointerEvents: 'none' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <BambooMat />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bowl */}
        <AnimatePresence>
          {showBowl && (
            <motion.div key="bowl"
              initial={{ opacity: 0, y: -70, scale: 0.84 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={bowlLifting
                ? { opacity: 0, y: -100, scale: 0.78, transition: { duration: 0.72, ease: [0.4, 0, 0.6, 1] } }
                : { opacity: 0, transition: { duration: 0.3 } }
              }
              transition={{ type: 'spring', stiffness: 260, damping: 18, mass: 0.9 }}
            >
              <PixelBowl order={order} eatCount={eatCount} onEat={handleEat} phase={phase} lifting={bowlLifting} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Side status signs */}
      <PreparingSign visible={phase === 'waiting'} />
      <DoneSign visible={phase === 'done'} />

      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 42, background: ['radial-gradient(ellipse 78% 72% at 50% 46%, transparent 28%, rgba(10,4,0,0.78) 100%)', 'linear-gradient(to top, rgba(8,3,0,0.5) 0%, transparent 22%)'].join(', ') }} />

      {/* Back button */}
      <button onClick={onExit}
        style={{ position: 'absolute', top: 22, left: 22, zIndex: 50, ...PX, fontSize: 7, color: '#ffaa44', background: 'rgba(14,6,0,0.8)', border: '2px solid #6a3e12', padding: '9px 14px', cursor: 'pointer', letterSpacing: 1, transition: 'color 0.15s, border-color 0.15s, background 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#ffee99'; e.currentTarget.style.borderColor = '#bb7a28'; e.currentTarget.style.background = 'rgba(30,14,2,0.9)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#ffaa44'; e.currentTarget.style.borderColor = '#6a3e12'; e.currentTarget.style.background = 'rgba(14,6,0,0.8)'; }}
      >[ ← MAP ]</button>
    </div>
  );
}
