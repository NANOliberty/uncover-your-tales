import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion, useTransform, useMotionValue, MotionValue, AnimatePresence } from 'motion/react';
import { Rain } from "./Rain";
import { PixelCharacter } from './PixelCharacter';
import { PixelCat, CAT_COLORS } from './PixelCat';
import { RamenFacade, RecordFacade, ConvenienceFacade, ArcadeFacade, PhotoBoothFacade } from './PixelStreetFacades';
import { RamenShop } from './RamenShop';
import { RecordStore } from './RecordStore';
import { ArcadePage } from './ArcadePage';
import { ConvenienceStore } from './ConvenienceStore';
import { PhotoBoothPage } from './PhotoBoothPage';
import { useMusic, TRACK_TITLE, TRACK_RAMEN } from './MusicContext';

// ─��─ Ad slide data ────────────────────────────────────────────────────────────
const AD_SLIDES = [
  { bg: '#08000e', border: '#ff0055', accent: '#ff3377', topText: 'スター☆',           mainText: 'STARDUST', subText: 'COLA',     tagline: '清涼感 MAX !!',         icon: '★' },
  { bg: '#050018', border: '#cc44ff', accent: '#ee88ff', topText: 'NEW SINGLE OUT NOW', mainText: 'YUKI★',    subText: 'NOVA',     tagline: 'streaming everywhere ♫', icon: '♪' },
  { bg: '#001010', border: '#00ffcc', accent: '#44ffdd', topText: 'ゼロカロリー',        mainText: 'NEON',     subText: 'FIZZ',     tagline: '新発売！ 全国販売中',    icon: '◆' },
  { bg: '#100010', border: '#ff44aa', accent: '#ffbbdd', topText: 'WORLD TOUR 2086',    mainText: 'SAKURA',   subText: 'PROJECT',  tagline: '6 GIRLS  ×  1 DREAM',   icon: '✿' },
  { bg: '#090900', border: '#ffee00', accent: '#ffe044', topText: 'エナジー最強',         mainText: 'EM-7',     subText: 'ENERGY',   tagline: '新感覚ドリンク！',       icon: '⚡' },
  { bg: '#080018', border: '#4488ff', accent: '#88bbff', topText: 'DEBUT ALBUM',        mainText: 'AKI',      subText: 'NOVALINE', tagline: '予約受付中 → NOW ▶',    icon: '◉' },
];

// ─── Seeded PRNG (LCG) — keeps every useMemo stable across page reloads ───��───
function seededRng(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}

// ─── Canvas star field — replaces ~90 individual Motion twinkling instances ───
type StarDatum = { x:number; y:number; size:number; opacity:number; twinkle:boolean; twinkleMin:number; twinkleDuration:number; twinkleDelay:number; color:string };
function StarField({ stars }: { stars: StarDatum[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let rafId: number;
    const resize = () => { canvas.width = canvas.offsetWidth || window.innerWidth; canvas.height = canvas.offsetHeight || window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const draw = (ts: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width, H = canvas.height;
      stars.forEach(st => {
        let opacity = st.opacity;
        if (st.twinkle) {
          const period = st.twinkleDuration * 1000;
          const t = ((ts + st.twinkleDelay * 1000) % period) / period;
          opacity = st.twinkleMin + ((Math.sin(t * Math.PI * 2) + 1) / 2) * (st.opacity - st.twinkleMin);
        }
        ctx.globalAlpha = opacity;
        ctx.fillStyle = st.color;
        ctx.fillRect((st.x / 100) * W, (st.y / 100) * H, st.size, st.size);
      });
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); };
  }, [stars]);
  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} />;
}

// ─── Physical billboard structure ─────────────────────────────────────────────
function BillboardProp({ x, bottom = 220, adIdx = 0 }: { x: number; bottom?: number; adIdx: number }) {
  const [slideIdx, setSlideIdx] = useState(adIdx % AD_SLIDES.length);
  const [fadeIn, setFadeIn]     = useState(true);
  const innerTimerRef           = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New ad types: 'idol' | 'soda' | 'text' (default)
  // Determine if it's an animated billboard based on adIdx
  const isIdol = adIdx % 5 === 4;
  const isSoda = adIdx % 5 === 2;
  const isText = !isIdol && !isSoda;

  useEffect(() => {
    if (isIdol || isSoda) return; // Animated billboards handle their own cycles
    const id = setInterval(() => {
      setFadeIn(false);
      // Track the inner timeout so it can be cancelled on unmount
      if (innerTimerRef.current) clearTimeout(innerTimerRef.current);
      innerTimerRef.current = setTimeout(() => {
        innerTimerRef.current = null;
        setSlideIdx(s => (s + 1) % AD_SLIDES.length);
        setFadeIn(true);
      }, 350);
    }, 4800 + (adIdx * 730) % 2200);
    return () => {
      clearInterval(id);
      if (innerTimerRef.current) { clearTimeout(innerTimerRef.current); innerTimerRef.current = null; }
    };
  }, [adIdx, isIdol, isSoda]);

  const s = AD_SLIDES[slideIdx];
  const SW = 130, SH = 78;

  // Idol specific state
  const [idolFrame, setIdolFrame] = useState(0);
  useEffect(() => {
    if (!isIdol) return;
    const interval = setInterval(() => setIdolFrame(f => (f + 1) % 4), 250); // 4-frame animation
    return () => clearInterval(interval);
  }, [isIdol]);

  return (
    <div style={{ position: 'absolute', bottom, left: x, zIndex: 5 }}>
      <div style={{ position: 'relative', marginLeft: -(SW / 2 + 8) }}>
        <div style={{ backgroundColor: '#0f0f0f', border: '4px solid #252525', borderBottom: '6px solid #1a1a1a', padding: 4, boxShadow: `0 0 28px ${isIdol ? '#ff66aa' : isSoda ? '#00ffff' : s.border}33, 0 10px 20px rgba(0,0,0,0.95)`, position: 'relative' }}>
          
          {/* ── IDOL AD ── */}
          {isIdol && (
            <div style={{ width: SW, height: SH, overflow: 'hidden', position: 'relative', backgroundColor: '#1a0510', border: '1px solid #330a20' }}>
               {/* Background pattern */}
               <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'repeating-linear-gradient(45deg, #ff0055 0, #ff0055 2px, transparent 2px, transparent 8px)' }} />
               
               {/* Spotlight */}
               <motion.div animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                 style={{ position: 'absolute', top: -20, left: '20%', width: 80, height: 120, background: 'radial-gradient(circle at top, rgba(255,100,200,0.4), transparent 70%)', transform: 'rotate(-15deg)' }} />

               {/* 16-bit Idol Pixel Art (Simple Representation) */}
               <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 48, height: 64 }}>
                 {/* Body/Dress - Frame dependent */}
                 <div style={{ position: 'absolute', bottom: 0, left: 10, right: 10, height: 24, backgroundColor: '#ff3388', borderRadius: '4px 4px 0 0' }}>
                    <div style={{ position: 'absolute', top: 4, left: 4, right: 4, height: 2, backgroundColor: '#ff99cc' }} />
                    <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, height: 4, backgroundColor: '#cc0055' }} />
                 </div>
                 {/* Head */}
                 <div style={{ position: 'absolute', bottom: 24, left: 12, width: 24, height: 20, backgroundColor: '#ffdbac', borderRadius: 4 }}>
                    {/* Hair */}
                    <div style={{ position: 'absolute', top: -4, left: -4, right: -4, height: 12, backgroundColor: '#662244', borderRadius: '8px 8px 0 0' }} />
                    <div style={{ position: 'absolute', top: 4, left: -4, width: 4, height: 16, backgroundColor: '#662244' }} />
                    <div style={{ position: 'absolute', top: 4, right: -4, width: 4, height: 16, backgroundColor: '#662244' }} />
                    {/* Face */}
                    <div style={{ position: 'absolute', top: 8, left: 4, width: 4, height: 4, backgroundColor: '#331122', borderRadius: '50%' }} /> {/* Eye L */}
                    <div style={{ position: 'absolute', top: 8, right: 4, width: 4, height: 4, backgroundColor: '#331122', borderRadius: '50%' }} /> {/* Eye R */}
                    {/* Mouth (Singing) */}
                    <div style={{ position: 'absolute', bottom: 4, left: 10, width: 4, height: idolFrame % 2 === 0 ? 2 : 5, backgroundColor: '#cc4444', borderRadius: 2 }} />
                 </div>
                 {/* Arms/Mic */}
                 <motion.div animate={{ rotate: [18, 30, 18] }} transition={{ duration: 0.6, repeat: Infinity }}
                    style={{ position: 'absolute', bottom: 20, right: -4, width: 14, height: 5, backgroundColor: '#ffdbac', borderRadius: 2, transformOrigin: 'left center' }}>
                    <div style={{ position: 'absolute', right: -3, top: -2, width: 5, height: 9, backgroundColor: '#333', borderRadius: 2 }} /> {/* Mic */}
                 </motion.div>
                 <div style={{ position: 'absolute', bottom: 20, left: -4, width: 14, height: 5, backgroundColor: '#ffdbac', borderRadius: 2, transform: `rotate(${idolFrame % 2 === 0 ? -18 : -30}deg)`, transformOrigin: 'right center' }} />
               </div>

               {/* Flying musical notes */}
               <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                 {[0, 1, 2].map(i => (
                   <motion.div key={i} animate={{ y: [60, -20], x: [0, (i%2===0?1:-1)*20], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.7 }}
                     style={{ position: 'absolute', left: 20 + i * 30, fontSize: 12, color: '#ffec44' }}>♪</motion.div>
                 ))}
               </div>
               
               {/* Text overlay */}
               <div style={{ position: 'absolute', bottom: 4, right: 4, fontSize: 8, color: '#fff', fontFamily: 'monospace', fontWeight: 900, textShadow: '0 0 4px #ff0055' }}>LIVE!</div>
            </div>
          )}

          {/* ── SODA AD ── */}
          {isSoda && (
            <div style={{ width: SW, height: SH, overflow: 'hidden', position: 'relative', backgroundColor: '#001010' }}>
               {/* Liquid Background */}
               <motion.div animate={{ y: [0, -20] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                 style={{ position: 'absolute', inset: -20, background: 'linear-gradient(0deg, #004444, #001111)', opacity: 0.8 }} />
               
               {/* Bubbles */}
               {[...Array(12)].map((_, i) => (
                 <motion.div key={i}
                   animate={{ y: [SH + 10, -20], x: [0, Math.sin(i)*10], scale: [0.5, 1.2] }}
                   transition={{ duration: 2 + (i%5)*0.5, repeat: Infinity, delay: i * 0.3, ease: 'linear' }}
                   style={{ 
                     position: 'absolute', left: 10 + (i * 10) % (SW - 20), 
                     width: 4 + (i%3)*2, height: 4 + (i%3)*2, 
                     borderRadius: '50%', border: '1px solid rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.2)' 
                   }} 
                 />
               ))}

               {/* Can/Bottle Graphic (Pixel Art) */}
               <div style={{ position: 'absolute', top: 10, right: 15, width: 24, height: 48, transform: 'rotate(10deg)' }}>
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#0088ff', borderRadius: 4, border: '1px solid #fff' }}>
                    <div style={{ position: 'absolute', top: 4, left: 2, right: 2, height: 16, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'red' }} />
                    </div>
                    <div style={{ position: 'absolute', bottom: 4, left: 4, right: 4, height: 2, backgroundColor: 'rgba(255,255,255,0.5)' }} />
                  </div>
                  <div style={{ position: 'absolute', top: -3, left: 4, width: 16, height: 3, backgroundColor: '#ccc' }} />
               </div>

               {/* Text */}
               <div style={{ position: 'absolute', top: 20, left: 10, display: 'flex', flexDirection: 'column' }}>
                 <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 2 }}
                   style={{ fontSize: 16, fontWeight: 900, color: '#00ffff', fontFamily: 'monospace', lineHeight: 0.9, textShadow: '0 0 8px #00ffff' }}>
                   SODA
                 </motion.span>
                 <span style={{ fontSize: 9, color: '#fff', fontFamily: 'monospace', letterSpacing: 2 }}>POP!</span>
               </div>
            </div>
          )}

          {/* ── TEXT AD (Standard) ── */}
          {isText && (
            <div style={{ width: SW, height: SH, overflow: 'hidden', position: 'relative', backgroundColor: s.bg, opacity: fadeIn ? 1 : 0, transition: 'opacity 0.35s ease' }}>
            <motion.div animate={{ x: [-SW, SW * 1.9] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', repeatDelay: 0.8 }}
              style={{ position: 'absolute', top: 0, bottom: 0, width: SW * 0.45, background: `linear-gradient(90deg, transparent, ${s.accent}28, transparent)`, pointerEvents: 'none' }} />
            
            {/* Generic background elements for text ads */}
             {[0, 1, 2].map(bi => (
                <motion.div key={bi} animate={{ rotate: [-16 + bi * 13, 16 + bi * 9, -16 + bi * 13] }} transition={{ duration: 2.6 + bi * 0.75, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ position: 'absolute', bottom: -6, left: `${20 + bi * 30}%`, width: 20, height: SH * 1.5, background: `linear-gradient(to top, ${s.accent}60, transparent)`, transformOrigin: 'bottom center', opacity: 0.45, filter: 'blur(2px)' }} />
              ))}
              
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5px 10px', fontFamily: 'monospace', zIndex: 2 }}>
              <div style={{ fontSize: 6.5, color: s.accent, letterSpacing: 0.8, marginBottom: 1, opacity: 0.9, lineHeight: 1 }}>{s.topText}</div>
              <motion.div animate={{ textShadow: [`0 0 4px ${s.accent}`, `0 0 20px ${s.accent}`, `0 0 4px ${s.accent}`] }} transition={{ duration: 1.8, repeat: Infinity }}
                style={{ fontSize: Math.min(26, Math.floor(160 / s.mainText.length)), fontWeight: 900, color: s.accent, letterSpacing: s.mainText.length >= 7 ? 0 : 1, lineHeight: 0.95, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{s.mainText}</motion.div>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.border, letterSpacing: 3, lineHeight: 1.1, fontFamily: 'monospace' }}>{s.subText}</div>
              <div style={{ fontSize: 6, color: '#ffffff55', marginTop: 4, letterSpacing: 0.5 }}>{s.tagline}</div>
            </div>
            <motion.div animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 1.5, repeat: Infinity }}
              style={{ position: 'absolute', top: 5, right: 8, fontSize: 18, color: s.border, zIndex: 3, lineHeight: 1 }}>{s.icon}</motion.div>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 3px)' }} />
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4, background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.6) 100%)' }} />
          </div>
          )}

          {([[-2,-2],[SW+2,-2],[-2,SH+2],[SW+2,SH+2]] as [number,number][]).map(([rx,ry], ri) => (
            <div key={ri} style={{ position: 'absolute', left: rx + 7, top: ry + 7, width: 5, height: 5, borderRadius: '50%', backgroundColor: '#3a3a3a', border: '1px solid #555' }} />
          ))}
        </div>
        <motion.div animate={{ opacity: [0.35, 0.65, 0.35] }} transition={{ duration: 2.4, repeat: Infinity }}
          style={{ position: 'absolute', top: '40%', left: -30, right: -30, height: SH + 60, background: `radial-gradient(ellipse at center, ${isIdol ? '#ff0055' : isSoda ? '#00ffff' : s.border}1a, transparent 60%)`, filter: 'blur(10px)', pointerEvents: 'none', zIndex: -1, transform: 'translateY(-50%)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 40, position: 'relative' }}>
        <div style={{ width: 6, height: 20, backgroundColor: '#181818', borderLeft: '1px solid #383838', borderRight: '1px solid #0a0a0a' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#151515', borderTop: '1px solid #2e2e2e' }} />
        <div style={{ width: 6, height: 20, backgroundColor: '#181818', borderLeft: '1px solid #383838', borderRight: '1px solid #0a0a0a' }} />
      </div>
    </div>
  );
}

// ─── Building silhouette path helpers ────────────────────────────────────────
// (0,0) = top-left; (w,h) = bottom-right in SVG space
function farBldgPath(type: string, w: number, h: number): string {
  const r = (n: number) => +(n.toFixed(1));
  switch (type) {
    case 'classic': {
      // Tall slab, small setback near top — iconic skyscraper
      const s = r(w * 0.15);
      return `M0,${h} H${w} V${r(h*0.19)} H${r(w-s)} V0 H${s} V${r(h*0.19)} H0 Z`;
    }
    case 'spire': {
      // Full-width base tapers to narrow spike
      const cx = r(w * 0.5), tw = r(w * 0.09);
      return `M0,${h} H${w} L${w},${r(h*0.27)} L${r(cx+tw)},0 H${r(cx-tw)} L0,${r(h*0.27)} Z`;
    }
    case 'tiered': {
      // Three setback tiers — pagoda / Shinjuku-style
      const cx = r(w * 0.5);
      const [t1, t2] = [r(w * 0.4), r(w * 0.26)];
      const [h1, h2] = [r(h * 0.56), r(h * 0.28)];
      return `M0,${h} H${w} V${h1} H${r(cx+t1)} V${h2} H${r(cx+t2)} V0 H${r(cx-t2)} V${h2} H${r(cx-t1)} V${h1} H0 Z`;
    }
    case 'wedge': {
      // Slanted roofline — dramatic asymmetry
      return `M0,${h} H${w} V${r(h*0.1)} L0,${r(h*0.44)} Z`;
    }
    case 'stepped': {
      // L-shape — two volumes at different heights
      const sep = r(w * 0.47);
      return `M0,${h} H${w} V${r(h*0.38)} H${sep} V0 H0 Z`;
    }
    case 'crown': {
      // Rectangular base, battlemented crown — castle-cyber
      return `M0,${h} H${w} V${r(h*0.13)} H${r(w*0.8)} V${r(h*0.05)} H${r(w*0.64)} V${r(h*0.13)} H${r(w*0.36)} V${r(h*0.05)} H${r(w*0.2)} V${r(h*0.13)} H0 Z`;
    }
    case 'slab': {
      // Wide industrial slab, chamfered top corners
      return `M0,${h} H${w} V${r(h*0.08)} L${r(w*0.96)},0 H${r(w*0.04)} L0,${r(h*0.08)} Z`;
    }
    default:
      return `M0,0 H${w} V${h} H0 Z`;
  }
}

function midBldgPath(type: string, w: number, h: number): string {
  const r = (n: number) => +(n.toFixed(1));
  switch (type) {
    case 'corp': {
      // Corporate tower — upper setback with prominent lobby base
      const s = r(w * 0.11);
      return `M0,${h} H${w} V${r(h*0.22)} H${r(w-s)} V0 H${s} V${r(h*0.22)} H0 Z`;
    }
    case 'apart': {
      // Apartment block — slight parapet lip at top
      return `M0,${h} H${w} V${r(h*0.04)} H${r(w*0.97)} V0 H${r(w*0.03)} V${r(h*0.04)} H0 Z`;
    }
    case 'tower': {
      // Slender glass tower — narrow, very tall
      const cx = r(w * 0.5), tw = r(w * 0.36);
      return `M${r(cx-tw)},${h} H${r(cx+tw)} V${r(h*0.1)} L${r(cx+tw*0.65)},0 H${r(cx-tw*0.65)} L${r(cx-tw)},${r(h*0.1)} Z`;
    }
    case 'mixed': {
      // Mixed-use: wider retail podium, narrower tower above
      const sx = r(w * 0.1);
      return `M0,${h} H${w} V${r(h*0.36)} H${r(w-sx)} V0 H${sx} V${r(h*0.36)} H0 Z`;
    }
    case 'brutalist': {
      // Bold brutalist slab — slight reverse-taper at top
      return `M${r(w*0.02)},0 H${r(w*0.98)} L${w},${r(h*0.06)} H${w} V${h} H0 V${r(h*0.06)} L${r(w*0.02)},0 Z`;
    }
    case 'old': {
      // Older prewar-style building — straighter, more ornamentation
      const cx = r(w * 0.5);
      return `M0,${h} H${w} V${r(h*0.12)} H${r(cx+w*0.4)} L${r(cx+w*0.3)},${r(h*0.06)} L${cx},0 L${r(cx-w*0.3)},${r(h*0.06)} H${r(cx-w*0.4)} V${r(h*0.12)} H0 Z`;
    }
    default:
      return `M0,0 H${w} V${h} H0 Z`;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface LocationState {
  character?: { style: string; hair: string; hairColor: string; gender: string; skin: string; }
}

// ─── Constants ───────────────────────────────────────────────────────────────
const LOCATIONS = [
  { id: 'ramen',       name: 'RAMEN SHOP',   x: 400,  width: 280, height: 500, Component: RamenFacade },
  { id: 'record',      name: 'RECORD STORE', x: 1000, width: 270, height: 480, Component: RecordFacade },
  { id: 'convenience', name: 'CONVENIENCE',  x: 1570, width: 340, height: 520, Component: ConvenienceFacade },
  { id: 'arcade',      name: 'ARCADE',       x: 2300, width: 300, height: 540, Component: ArcadeFacade },
  { id: 'photobooth',  name: 'PHOTO BOOTH',  x: 3000, width: 300, height: 500, Component: PhotoBoothFacade },
];
const WORLD_WIDTH = 4000;
const SPEED       = 8;
const PED_COUNT   = 5;
const PED_STYLES      = ['STREETWEAR', 'SCHOOL', 'VINTAGE', 'TECHWEAR'];
const PED_HAIRS       = ['SHORT', 'LONG', 'SPIKY', 'BEANIE'];
const PED_HAIR_COLORS = ['#1a1a1a','#4a3020','#eebb44','#cc4422','#dddddd','#4488ff','#ff66aa','#44cc44'];
const PED_SKINS       = ['#ffdbac','#e0ac69','#8d5524','#3c2e28','#f1c27d','#ffcc99','#c68642','#593c28','#ffad60','#d2b48c','#a0522d','#ebcbb5'];
const PED_GENDERS     = ['MASC', 'FEM', 'NEUTRAL'];

interface PedestrianData {
  id: number; _x: number; _speed: number; _direction: number;
  x: MotionValue<number>; directionScale: MotionValue<number>;
  appearance: { style: string; hair: string; hairColor: string; gender: string; skin: string; };
}

// ─── Street Lamp ─────────────────────────────────────────────────────────────
// All lamps face the same direction for visual consistency.
const LAMP_CONFIGS: { x: number; delay: number }[] = [
  { x:  140, delay: 0   },
  { x:  880, delay: 1.2 },
  { x: 1370, delay: 0.5 },
  { x: 1990, delay: 2.0 },
  { x: 2940, delay: 0.8 },
  { x: 3550, delay: 1.5 },
];

function StreetLamp({ delay = 0 }: { delay?: number }) {
  const arm = 'left' as const;
  const POLE_H = 240;
  const POLE_W = 8;
  const ARM_W  = 56;
  const HEAD_W = 26;
  const HEAD_H = 40;
  const armLeft  = arm === 'left' ? -ARM_W : POLE_W;
  const headLeft = arm === 'left'
    ? -ARM_W - Math.ceil(HEAD_W / 2)
    : ARM_W + POLE_W - Math.ceil(HEAD_W / 2);
  const coneW    = HEAD_W * 4;
  const coneLeft = headLeft - (coneW - HEAD_W) / 2;

  return (
    <div style={{ position: 'relative', width: POLE_W, height: POLE_H }}>
      {/* POLE */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: POLE_W, height: POLE_H,
        background: 'linear-gradient(to right, #1e1e1e, #111, #0c0c0c)',
        boxShadow: 'inset -1px 0 0 #2a2a2a, inset 1px 0 0 #1a1a1a',
      }}>
        {[POLE_H * 0.25, POLE_H * 0.5, POLE_H * 0.72].map((y, k) => (
          <div key={k} style={{ position: 'absolute', top: y, left: -2, right: -2, height: 3, background: '#1c1c1c', borderTop: '1px solid #303030', borderBottom: '1px solid #0a0a0a' }} />
        ))}
      </div>
      {/* BASE */}
      <div style={{ position: 'absolute', bottom: -3, left: -8,  width: POLE_W + 16, height: 6, background: '#0e0e0e', border: '1px solid #252525' }} />
      <div style={{ position: 'absolute', bottom: -7, left: -12, width: POLE_W + 24, height: 5, background: '#0b0b0b', border: '1px solid #1e1e1e' }} />
      {/* ARM */}
      <div style={{
        position: 'absolute', top: 0, left: armLeft,
        width: ARM_W + POLE_W, height: 6,
        background: 'linear-gradient(to bottom, #1a1a1a, #111)',
        boxShadow: 'inset 0 1px 0 #282828, 0 2px 0 #080808',
        borderRadius: arm === 'left' ? '3px 0 0 3px' : '0 3px 3px 0',
      }} />
      <div style={{
        position: 'absolute', top: 6,
        left: arm === 'left' ? -ARM_W * 0.45 : POLE_W,
        width: ARM_W * 0.55, height: 4, background: '#141414',
        transform: arm === 'left' ? 'rotate(18deg)' : 'rotate(-18deg)',
        transformOrigin: arm === 'left' ? 'right bottom' : 'left bottom',
      }} />
      {/* LAMP HEAD — CSS animation replaces motion.div */}
      <div style={{
          position: 'absolute', top: -HEAD_H + 6, left: headLeft,
          width: HEAD_W, height: HEAD_H,
          background: '#0c0c0c', border: '1px solid #222',
          animation: 'lamp-flicker 6s ease-in-out infinite',
          animationDelay: `${delay}s`,
        }}>
        <div style={{ position: 'absolute', top: -8, left: -4, right: -4, height: 10, background: '#161616', borderTop: '1px solid #2e2e2e', borderLeft: '1px solid #222', borderRight: '1px solid #222' }} />
        <div style={{ position: 'absolute', top: 3, left: 0,  width: 2, bottom: 3, background: '#181818' }} />
        <div style={{ position: 'absolute', top: 3, right: 0, width: 2, bottom: 3, background: '#181818' }} />
        <div style={{
          position: 'absolute', top: 8, bottom: 4, left: 3, right: 3,
          background: 'linear-gradient(to bottom, #fffacc, #ffe566, #ffaa00)',
          boxShadow: '0 0 10px #ffe060, 0 0 24px #ffaa0066',
        }} />
        <div style={{ position: 'absolute', bottom: 0, left: 2, right: 2, height: 4, background: '#ffdd50', boxShadow: '0 4px 12px #ffcc00aa' }} />
      </div>
      {/* HALO — CSS animation */}
      <div style={{
          position: 'absolute', top: -HEAD_H - 20, left: headLeft - HEAD_W,
          width: HEAD_W * 3.2, height: HEAD_H + 28,
          background: 'radial-gradient(ellipse at 50% 68%, rgba(255,215,60,0.5), transparent 70%)',
          pointerEvents: 'none',
          animation: 'lamp-halo 4s ease-in-out infinite',
          animationDelay: `${delay + 0.3}s`,
        }} />
      {/* CONE — CSS animation */}
      <div style={{
          position: 'absolute', top: 8, left: coneLeft,
          width: coneW, height: 380,
          background: 'linear-gradient(to bottom, rgba(255,228,80,0.72), rgba(255,160,30,0.28), rgba(255,120,0,0.06), transparent)',
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
          filter: 'blur(5px)', pointerEvents: 'none',
          mixBlendMode: 'screen',
          animation: 'lamp-cone 5s ease-in-out infinite',
          animationDelay: `${delay + 0.8}s`,
        }} />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export function CityPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state    = location.state as LocationState;
  const { setTrack } = useMusic();

  const getSavedCharacter = () => {
    try { const s = localStorage.getItem('to_character'); return s ? JSON.parse(s) : null; }
    catch { return null; }
  };
  const characterData = state?.character || getSavedCharacter() || {
    style: 'STREETWEAR', hair: 'SPIKY', hairColor: '#4a3020', gender: 'NEUTRAL', skin: '#ffdbac',
  };

  // State
  const characterX    = useMotionValue(200);
  const [direction, setDirection]           = useState(1);
  const [isWalking, setIsWalking]           = useState(false);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth]   = useState(window.innerWidth);

  const isMobile = viewportWidth < 768;
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const [catPrompt, setCatPrompt] = useState(false);
  const catPromptRef = useRef(false);
  const [hearts, setHearts] = useState<{id:number, x:number, y:number}[]>([]);

  // ── Ramen shop transition ─────────────────────────────────────────────────
  type RamenState = 'closed' | 'fadeIn' | 'open' | 'fadeOut';
  const [ramenState, setRamenState] = useState<RamenState>('closed');
  const ramenTimers = useRef<number[]>([]);
  const afterR = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    ramenTimers.current.push(id);
  };
  useEffect(() => () => { ramenTimers.current.forEach(clearTimeout); }, []);

  // ── Record store transition ───────────────────────────────────────────────
  type RecordState = 'closed' | 'fadeIn' | 'open' | 'fadeOut';
  const [recordState, setRecordState] = useState<RecordState>('closed');
  const recordTimers = useRef<number[]>([]);
  const afterRec = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    recordTimers.current.push(id);
  };
  useEffect(() => () => { recordTimers.current.forEach(clearTimeout); }, []);

  // ── Arcade transition ─────────────────────────────────────────────────────
  type ArcadeState = 'closed' | 'flash' | 'open' | 'fadeOut';
  const [arcadeState, setArcadeState] = useState<ArcadeState>('closed');
  const arcadeTimers = useRef<number[]>([]);
  const afterArc = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    arcadeTimers.current.push(id);
  };

  // ── Convenience store transition ──────────────────────────────────────────
  type ConvenienceState = 'closed' | 'fadeIn' | 'open' | 'fadeOut';
  const [convenienceState, setConvenienceState] = useState<ConvenienceState>('closed');
  const convenienceTimers = useRef<number[]>([]);
  const afterConv = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    convenienceTimers.current.push(id);
  };
  useEffect(() => () => { convenienceTimers.current.forEach(clearTimeout); }, []);
  useEffect(() => () => { arcadeTimers.current.forEach(clearTimeout); }, []);

  // ── Photo Booth transition ─────────────────────────────────────────────────
  type PhotoBoothState = 'closed' | 'fadeIn' | 'open' | 'fadeOut';
  const [photoBoothState, setPhotoBoothState] = useState<PhotoBoothState>('closed');
  const photoBoothTimers = useRef<number[]>([]);
  const afterBooth = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    photoBoothTimers.current.push(id);
  };
  useEffect(() => () => { photoBoothTimers.current.forEach(clearTimeout); }, []);

  // Refs
  const keysPressed       = useRef<Set<string>>(new Set());
  const requestRef        = useRef<number>();
  const characterXRef     = useRef(200);
  const isWalkingRef      = useRef(false);
  const directionRef      = useRef(1);
  const activeLocationRef = useRef<string | null>(null);
  const viewportWidthRef  = useRef(window.innerWidth);
  const pedestriansRef    = useRef<PedestrianData[]>([]);
  // Prevents double-entry and pauses the game loop while inside any location
  const storeOpenRef      = useRef(false);
  const [pedestrians, setPedestrians] = useState<PedestrianData[]>([]);

  // Cat
  const catRef = useRef({ _x: 600 + Math.random() * 1200, _speed: 0.6 + Math.random() * 0.8, _direction: Math.random() > 0.5 ? 1 : -1, _sitFrames: 0, _walkFrames: 0 });
  const catX   = useMotionValue(catRef.current._x);
  const catDir = useMotionValue<number>(catRef.current._direction);
  const [catSitting, setCatSitting] = useState(false);
  const catSittingRef = useRef(false);
  const catColor = useMemo(() => CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)], []);

  // Camera + parallax
  const cameraX = useMotionValue(0);
  const skyX    = useTransform(cameraX, x => x * 0.02);
  const farBgX  = useTransform(cameraX, x => x * 0.1);
  const midBgX  = useTransform(cameraX, x => x * 0.25);
  const cloudsX = useTransform(cameraX, x => x * 0.05);

  // ── Far skyline ───────────────────────────────────────────────────
  const FAR_TYPES  = ['classic','spire','tiered','wedge','stepped','crown','slab'];
  const NEON_PAL   = ['#ff00ff','#00ffff','#ff3366','#44ff88','#ffaa00','#7744ff','#00aaff','#ff6600'];
  const FAR_GRADS  = [
    // [topColor, botColor] — subtle variety
    ['#0d0a20','#050308'], ['#0c0818','#040207'], ['#080a1c','#040508'],
    ['#100820','#060308'], ['#0a0c1e','#050508'], ['#0e0818','#060408'],
  ];

  const farBuildings = useMemo(() => {
    const rng = seededRng(2086);
    return Array.from({ length: 44 }).map((_, i) => {
      const wCols = 2 + Math.floor(rng() * 4);
      const wRows = 4 + Math.floor(rng() * 7);
      const litProb = 0.12 + rng() * 0.38;
      const neonC  = NEON_PAL[Math.floor(rng() * NEON_PAL.length)];
      const gradIdx = Math.floor(rng() * FAR_GRADS.length);
      return {
        h: 160 + rng() * 380,
        w: 60  + rng() * 150,
        left: i * 115 - 600,
        type: FAR_TYPES[Math.floor(rng() * FAR_TYPES.length)],
        gradTop: FAR_GRADS[gradIdx][0],
        gradBot: FAR_GRADS[gradIdx][1],
        neonC,
        hasNeon:    rng() > 0.45,
        wCols, wRows,
        windows: Array.from({ length: wCols * wRows }).map(() => rng() < litProb),
        roof: ['antenna','multiantenna','tank','flat','spire_tip','helipad'][Math.floor(rng() * 6)],
        hasWaterTower: rng() > 0.78,
        vertSign:  rng() > 0.72,
        vertText:  ['酒','飯','店','夜','光','電'][Math.floor(rng() * 6)],
        acUnits:   rng() > 0.6 ? Math.floor(rng() * 3) + 1 : 0,
        hasMidBand:  rng() > 0.55,
        midBandC:    NEON_PAL[Math.floor(rng() * NEON_PAL.length)],
        hasTopCap:   rng() > 0.6,
        billboard:   i % 4 === 0 ? { adIdx: i } : undefined,
      };
    });
  }, []);

  // ── Mid skyline ────────────────────────────────────────────────────
  const MID_TYPES = ['corp','apart','tower','mixed','brutalist','old'];
  const MID_GRADS = [
    ['#0e0c24','#09071a'], ['#0d1020','#080c1a'], ['#120c22','#0c0818'],
    ['#0c1018','#060c10'], ['#141020','#0a0818'], ['#100e1c','#080c14'],
  ];

  const midBuildings = useMemo(() => {
    const rng = seededRng(7749);
    return Array.from({ length: 30 }).map((_, i) => {
      const neonC  = NEON_PAL[Math.floor(rng() * NEON_PAL.length)];
      const neonC2 = NEON_PAL[Math.floor(rng() * NEON_PAL.length)];
      const wCols  = 2 + Math.floor(rng() * 5);
      const wRows  = 3 + Math.floor(rng() * 8);
      const litProb = 0.18 + rng() * 0.45;
      const gradIdx = Math.floor(rng() * MID_GRADS.length);
      const floorCount = wRows;
      const floorLit = Array.from({ length: floorCount }).map(() => rng() > 0.15);
      return {
        h: 130 + rng() * 320,
        w:  85 + rng() * 200,
        left: i * 170 - 500,
        type: MID_TYPES[Math.floor(rng() * MID_TYPES.length)],
        gradTop: MID_GRADS[gradIdx][0],
        gradBot: MID_GRADS[gradIdx][1],
        neonC, neonC2,
        hasNeon:      rng() > 0.35,
        hasNeonSide:  rng() > 0.5,
        wCols, wRows, litProb,
        floorLit,
        windows: Array.from({ length: wCols * wRows }).map((_, wi) => {
          const row = Math.floor(wi / wCols);
          return floorLit[row] && rng() < litProb;
        }),
        warmWindows: Array.from({ length: wCols * wRows }).map(() => rng() > 0.4),
        hasVertSign:  rng() > 0.58,
        vertText:    ['電','光','店','夜','酒','歌','夢','都'][Math.floor(rng() * 8)],
        hasHelipad:   rng() > 0.82,
        hasPipes:     rng() > 0.55,
        hasNeonBand:  rng() > 0.45,
        neonBandY:    0.28 + rng() * 0.35,
        hasMidBand2:  rng() > 0.6,
        neonBandY2:   0.55 + rng() * 0.2,
        acCount:      Math.floor(rng() * 4),
        billboard:    i % 3 === 0 ? { adIdx: i } : undefined,
      };
    });
  }, []);

  // Stars
  const stars = useMemo(() => {
    const rng = seededRng(9001);
    return Array.from({ length: 160 }).map(() => ({
      x: rng() * 120 - 10, y: rng() * 68,
      size: rng() > 0.94 ? 2.5 : rng() > 0.72 ? 1.5 : 1,
      opacity: 0.25 + rng() * 0.75,
      twinkle: rng() > 0.55,
      twinkleMin: 0.05 + rng() * 0.2,
      twinkleDuration: 1.2 + rng() * 4,
      twinkleDelay: rng() * 6,
      color: rng() > 0.92 ? '#aee0ff' : rng() > 0.87 ? '#ffe8cc' : '#ffffff',
    }));
  }, []);

  // Effects
  useEffect(() => { const f = () => setViewportWidth(window.innerWidth); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  useEffect(() => { viewportWidthRef.current = viewportWidth; }, [viewportWidth]);

  // Detect touch-capable devices (iPad, Android tablets, etc.)
  useEffect(() => {
    const check = () => setIsTouchDevice(
      window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
    );
    check();
    const mq = window.matchMedia('(pointer: coarse)');
    mq.addEventListener('change', check);
    return () => mq.removeEventListener('change', check);
  }, []);

  useEffect(() => {
    const peds: PedestrianData[] = [];
    for (let i = 0; i < PED_COUNT; i++) {
      const sx = Math.random() * WORLD_WIDTH, sd = Math.random() > 0.5 ? 1 : -1;
      peds.push({ id: i, _x: sx, _speed: 1 + Math.random() * 2, _direction: sd, x: new MotionValue(sx), directionScale: new MotionValue(sd),
        appearance: { style: PED_STYLES[Math.floor(Math.random() * PED_STYLES.length)], hair: PED_HAIRS[Math.floor(Math.random() * PED_HAIRS.length)],
          hairColor: PED_HAIR_COLORS[Math.floor(Math.random() * PED_HAIR_COLORS.length)], gender: PED_GENDERS[Math.floor(Math.random() * PED_GENDERS.length)],
          skin: PED_SKINS[Math.floor(Math.random() * PED_SKINS.length)] } });
    }
    pedestriansRef.current = peds; setPedestrians(peds);
  }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (['ArrowLeft','ArrowRight','a','d'].includes(e.key)) keysPressed.current.add(e.key);
      if (e.key === 'Enter' && activeLocationRef.current) handleEnterLocation(activeLocationRef.current);
      if ((e.key === 'e' || e.key === 'E') && catPromptRef.current) handlePetCat();
    };
    const ku = (e: KeyboardEvent) => { if (['ArrowLeft','ArrowRight','a','d'].includes(e.key)) keysPressed.current.delete(e.key); };
    // Clear all held keys when the tab/window loses focus — prevents stuck movement
    const onBlur = () => keysPressed.current.clear();
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  const handlePetCat = () => {
    // Make cat sit and happy — also freeze movement via _sitFrames
    if (!catSittingRef.current) { catSittingRef.current = true; setCatSitting(true); }
    catRef.current._sitFrames = Math.max(catRef.current._sitFrames, 180);
    // Synthesised meow sound
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) {
        const ctx = new AC() as AudioContext; const t0 = ctx.currentTime;
        const osc = ctx.createOscillator(); const flt = ctx.createBiquadFilter(); const gn = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, t0); osc.frequency.linearRampToValueAtTime(980, t0+0.09); osc.frequency.exponentialRampToValueAtTime(360, t0+0.38);
        flt.type = 'bandpass'; flt.frequency.value = 850; flt.Q.value = 3.5;
        gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(0.20, t0+0.05); gn.gain.setValueAtTime(0.18, t0+0.30); gn.gain.exponentialRampToValueAtTime(0.001, t0+0.48);
        const osc2 = ctx.createOscillator(); const gn2 = ctx.createGain();
        osc2.type = 'sawtooth'; osc2.frequency.setValueAtTime(700, t0+0.32); osc2.frequency.exponentialRampToValueAtTime(300, t0+0.55);
        gn2.gain.setValueAtTime(0, t0+0.32); gn2.gain.linearRampToValueAtTime(0.10, t0+0.36); gn2.gain.exponentialRampToValueAtTime(0.001, t0+0.58);
        osc.connect(flt); flt.connect(gn); gn.connect(ctx.destination);
        osc2.connect(gn2); gn2.connect(ctx.destination);
        osc.start(t0); osc.stop(t0+0.52); osc2.start(t0+0.32); osc2.stop(t0+0.62);
        setTimeout(() => ctx.close(), 800);
      }
    } catch (_) { /* silent fail */ }
    // Spawn hearts
    const cx = catX.get();
    const newHearts = Array.from({ length: 5 }).map((_, i) => ({
      id: Date.now() + i,
      x: cx + (Math.random() * 40 - 20),
      y: -20 - Math.random() * 30
    }));
    setHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => !newHearts.some(nh => nh.id === h.id)));
    }, 1500);
  };

  const animate = () => {
    // While inside a location overlay, keep the loop alive but skip all world updates
    if (storeOpenRef.current) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }
    const keys = keysPressed.current;
    let move = 0;
    if (keys.has('ArrowLeft') || keys.has('a')) move -= 1;
    if (keys.has('ArrowRight') || keys.has('d')) move += 1;
    const nowWalking = move !== 0;
    if (nowWalking !== isWalkingRef.current) { isWalkingRef.current = nowWalking; setIsWalking(nowWalking); }
    if (move !== 0) {
      const nd = move > 0 ? 1 : -1;
      if (nd !== directionRef.current) { directionRef.current = nd; setDirection(nd); }
      let nx = characterXRef.current + move * SPEED;
      nx = Math.max(50, Math.min(nx, WORLD_WIDTH - 50));
      characterXRef.current = nx; characterX.set(nx);
    }
    pedestriansRef.current.forEach(p => {
      let nx = p._x + p._speed * p._direction, nd = p._direction;
      if (nx < 50) { nx = 50; nd = 1; } else if (nx > WORLD_WIDTH - 50) { nx = WORLD_WIDTH - 50; nd = -1; }
      if (nx > 200 && nx < WORLD_WIDTH - 200 && Math.random() < 0.0005) nd = -nd;
      p._x = nx; p._direction = nd; p.x.set(nx); p.directionScale.set(nd);
    });
    const cat = catRef.current;
    if (cat._sitFrames > 0) {
      cat._sitFrames--;
      if (cat._sitFrames === 0) { cat._walkFrames = 120 + Math.floor(Math.random() * 300); if (catSittingRef.current) { catSittingRef.current = false; setCatSitting(false); } }
    } else {
      let cx = cat._x + cat._speed * cat._direction, cd = cat._direction;
      if (cx < 80) { cx = 80; cd = 1; } else if (cx > WORLD_WIDTH - 80) { cx = WORLD_WIDTH - 80; cd = -1; }
      if (cx > 150 && cx < WORLD_WIDTH - 150 && Math.random() < 0.002) cd = -cd;
      cat._x = cx; cat._direction = cd; catX.set(cx);
      if (cd !== catDir.get()) catDir.set(cd);
      if (cat._walkFrames > 0) { cat._walkFrames--; }
      else if (Math.random() < 0.003) { cat._sitFrames = 180 + Math.floor(Math.random() * 360); cat._walkFrames = 0; if (!catSittingRef.current) { catSittingRef.current = true; setCatSitting(true); } }
    }
    const charX  = characterXRef.current;
    const found  = LOCATIONS.find(loc => Math.abs(charX - (loc.x + loc.width / 2)) < loc.width / 2 - 20);
    const fid    = found ? found.id : null;
    if (fid !== activeLocationRef.current) { activeLocationRef.current = fid; setActiveLocation(fid); }

    const distToCat = Math.abs(charX - catX.get());
    if (distToCat < 80) {
      if (!catPromptRef.current) { catPromptRef.current = true; setCatPrompt(true); }
    } else {
      if (catPromptRef.current) { catPromptRef.current = false; setCatPrompt(false); }
    }

    const vpW = viewportWidthRef.current;
    let cam = -charX + vpW / 2;
    cam = Math.max(-(WORLD_WIDTH - vpW), Math.min(cam, 0));
    cameraX.set(cam);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, []);

  const handleEnterLocation = (locId: string) => {
    // Guard: prevent double-entry and re-entry while transitioning
    if (storeOpenRef.current) return;
    storeOpenRef.current = true;
    // Clear any stuck directional keys so character doesn't drift on return
    keysPressed.current.clear();

    if (locId === 'ramen' && ramenState === 'closed') {
      setRamenState('fadeIn');
      afterR(() => {
        setRamenState('open');
        setTrack(TRACK_RAMEN);
      }, 480);
    } else if (locId === 'record' && recordState === 'closed') {
      setRecordState('fadeIn');
      afterRec(() => setRecordState('open'), 480);
    } else if (locId === 'arcade' && arcadeState === 'closed') {
      setArcadeState('flash');
      afterArc(() => setArcadeState('open'), 320);
    } else if (locId === 'convenience' && convenienceState === 'closed') {
      setConvenienceState('fadeIn');
      afterConv(() => setConvenienceState('open'), 500);
    } else if (locId === 'photobooth' && photoBoothState === 'closed') {
      setPhotoBoothState('fadeIn');
      afterBooth(() => setPhotoBoothState('open'), 600);
    } else {
      // Nothing triggered (e.g. wrong state) — release the lock immediately
      storeOpenRef.current = false;
    }
  };

  const handleRamenExit = () => {
    setTrack(TRACK_TITLE);
    setRamenState('fadeOut');
    afterR(() => { setRamenState('closed'); keysPressed.current.clear(); storeOpenRef.current = false; }, 480);
  };

  const handleRecordExit = () => {
    setTrack(TRACK_TITLE);
    setRecordState('fadeOut');
    afterRec(() => { setRecordState('closed'); keysPressed.current.clear(); storeOpenRef.current = false; }, 480);
  };

  const handleArcadeExit = () => {
    setArcadeState('fadeOut');
    afterArc(() => { setArcadeState('closed'); keysPressed.current.clear(); storeOpenRef.current = false; }, 380);
  };

  const handleConvenienceExit = () => {
    setConvenienceState('fadeOut');
    afterConv(() => { setConvenienceState('closed'); keysPressed.current.clear(); storeOpenRef.current = false; }, 480);
  };

  const handlePhotoBoothExit = () => {
    setPhotoBoothState('fadeOut');
    afterBooth(() => { setPhotoBoothState('closed'); keysPressed.current.clear(); storeOpenRef.current = false; }, 500);
  };

  const renderSceneItems = (isReflection = false) => (
    <>
      {/* Lamps rendered first (lowest DOM order) so every building/decor sits on top */}
      {LAMP_CONFIGS.map((cfg, i) => (
        <div key={`lamp-${i}`} className="absolute bottom-[20%] pointer-events-none" style={{ left: cfg.x, zIndex: 1 }}>
          <StreetLamp delay={cfg.delay} />
        </div>
      ))}
      {LOCATIONS.map(loc => {
        const Facade = loc.Component;
        return (
          <div
            key={loc.id}
            className="absolute bottom-[20%]"
            style={{ left: loc.x, cursor: isReflection ? 'default' : 'pointer' }}
            onClick={isReflection ? undefined : () => handleEnterLocation(loc.id)}
          >
            <Facade x={0} active={activeLocation === loc.id} />
          </div>
        );
      })}
      {!isReflection && pedestrians.map(ped => (
        <motion.div key={ped.id} className="absolute bottom-[11%]" style={{ x: ped.x, zIndex: 25, filter: 'brightness(0.7)' }}>
          <motion.div style={{ scaleX: ped.directionScale, originX: 0.5, x: '-50%' }}>
            <div style={{ animation: 'ped-bounce 0.5s linear infinite' }}>
              <PixelCharacter {...ped.appearance} scale={3.5} />
            </div>
          </motion.div>
        </motion.div>
      ))}
      {!isReflection && <motion.div className="absolute bottom-[11%] z-30" style={{ x: characterX }}>
        <motion.div style={{ scaleX: direction, originX: 0.5, x: '-50%' }}>
          <div style={{ animation: isWalking ? 'ped-bounce 0.4s linear infinite' : 'none' }}>
            <PixelCharacter {...characterData} scale={4} />
          </div>
        </motion.div>
      </motion.div>}
      {!isReflection && <motion.div className="absolute bottom-[11%] z-30 pointer-events-none" style={{ x: catX }}>
        <motion.div style={{ scaleX: catDir, originX: 0.5 }}>
          <PixelCat color={catColor} sitting={catSitting} scale={3} />
        </motion.div>
        {catPrompt && !isMobile && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex flex-col items-center z-50">
            <motion.div initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-[#ff4081] text-white text-[9px] font-mono font-bold px-2 py-1 rounded border-2 border-white shadow-[0_0_10px_#ff4081] flex items-center gap-1">
              <span>PET</span>
              <span className="bg-white text-[#ff4081] px-1 rounded text-[8px]">E</span>
            </motion.div>
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white" />
          </div>
        )}
      </motion.div>}
      {!isReflection && hearts.map(h => (
        <motion.div key={h.id} initial={{ opacity: 1, y: 0, scale: 0.5 }} animate={{ opacity: 0, y: -60, scale: 1.2 }} transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute bottom-[13%] z-50 pointer-events-none text-[#ff4081] font-bold text-2xl"
          style={{ left: h.x }}>
          ♥
        </motion.div>
      ))}

      {/* ── Street ground-level details ─────────────────────────────────────── */}
      {!isReflection && (<>

        {/* Manhole covers – on the sidewalk */}
        {[320, 780, 1280, 1740, 2200, 2660, 3090, 3560].map((x, i) => (
          <div key={`mh-${i}`} className="absolute pointer-events-none"
            style={{ left: x, bottom: 'calc(20% + 2px)', zIndex: 6, transform: 'translateX(-50%)' }}>
            <div style={{ width: 28, height: 14, background: 'linear-gradient(to bottom,#222,#181818)', border: '2px solid #2e2e2e', borderRadius: 3, position: 'relative', boxShadow: 'inset 0 1px 0 #363636, 0 1px 0 #0a0a0a' }}>
              <div style={{ position: 'absolute', inset: 3, border: '1px solid #2a2a2a', borderRadius: 2 }} />
              <div style={{ position: 'absolute', top: '50%', left: 4, right: 4, height: 1, background: '#262626', transform: 'translateY(-50%)' }} />
              <div style={{ position: 'absolute', left: '50%', top: 3, bottom: 3, width: 1, background: '#262626', transform: 'translateX(-50%)' }} />
              <div style={{ position: 'absolute', top: 2, left: 2, width: 3, height: 1, background: '#333' }} />
            </div>
          </div>
        ))}

        {/* Neon puddles – reflecting signs above */}
        {[
          { x: 480,  color: '#00ffff', w: 52, h: 8 },
          { x: 1060, color: '#ff00ff', w: 42, h: 6 },
          { x: 1500, color: '#ffaa00', w: 64, h: 9 },
          { x: 2050, color: '#4488ff', w: 46, h: 7 },
          { x: 2760, color: '#ff4488', w: 56, h: 8 },
          { x: 3360, color: '#00ff88', w: 38, h: 6 },
        ].map((p, i) => (
          <div key={`puddle-${i}`} className="absolute pointer-events-none"
            style={{ left: p.x - p.w / 2, bottom: 'calc(20% + 2px)', zIndex: 5, width: p.w, height: p.h,
              animation: 'city-pulse 3.5s ease-in-out infinite', animationDuration: `${3.5 + i * 0.9}s` }}>
            <div style={{
              width: '100%', height: '100%',
              background: `radial-gradient(ellipse at 40% 50%, ${p.color}35, transparent 70%)`,
              borderRadius: '50%',
              border: `1px solid ${p.color}22`,
              boxShadow: `0 0 10px ${p.color}18`,
            }} />
          </div>
        ))}

        {/* Parked scooters near shops */}
        {[{ x: 460, c: '#1a1a3a' }, { x: 1080, c: '#2a1218' }, { x: 1680, c: '#0f2a18' }, { x: 2380, c: '#1e1a08' }].map((s, i) => (
          <div key={`sc-${i}`} className="absolute pointer-events-none"
            style={{ left: s.x, bottom: 'calc(20% + 2px)', zIndex: 8, transform: 'translateX(-50%)' }}>
            <div style={{ position: 'relative', width: 30, height: 18 }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: 7, height: 7, borderRadius: '50%', border: '2px solid #333', background: '#111' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, borderRadius: '50%', border: '2px solid #333', background: '#111' }} />
              <div style={{ position: 'absolute', bottom: 5, left: 5, right: 5, height: 8, background: s.c, border: '1px solid #333', borderRadius: 2 }}>
                <div style={{ position: 'absolute', top: 1, left: 1, right: 1, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1 }} />
              </div>
              <div style={{ position: 'absolute', top: 1, right: 2, width: 11, height: 3, background: '#2a2a2a', borderRadius: 1 }} />
              <div style={{ position: 'absolute', bottom: 12, left: 7, width: 12, height: 3, background: '#222', borderRadius: 1 }} />
              <div style={{ position: 'absolute', top: 3, right: 1, width: 3, height: 3, background: '#ffe888', borderRadius: '50%', boxShadow: '0 0 5px #ffe88888',
                animation: 'city-pulse3 2.4s ease-in-out infinite', animationDuration: `${2.4 + i * 0.6}s` }} />
              <div style={{ position: 'absolute', bottom: -1, left: '20%', right: '10%', height: 2, background: 'rgba(0,0,0,0.4)', borderRadius: '50%', filter: 'blur(1px)' }} />
            </div>
          </div>
        ))}

        {/* Vending machines between lamp posts */}
        {[{ x: 240, col: '#0033aa' }, { x: 860, col: '#aa1122' }, { x: 1480, col: '#008822' }, { x: 2080, col: '#6600aa' }, { x: 2680, col: '#aa5500' }].map((v, i) => (
          <div key={`vm-${i}`} className="absolute pointer-events-none"
            style={{ left: v.x, bottom: 'calc(20% + 2px)', zIndex: 10, transform: 'translateX(-50%)' }}>
            <div style={{ width: 14, height: 26, background: '#121212', border: '2px solid #282828', borderRadius: 1, position: 'relative', boxShadow: `0 0 12px ${v.col}22` }}>
              <div style={{ position: 'absolute', top: 2, left: 1, right: 1, height: 12, background: '#080810', border: '1px solid #1e1e1e' }}>
                {[0, 1, 2].map(r => (
                  <div key={r} style={{ display: 'flex', gap: 1, padding: '1px 1px 0', marginTop: r > 0 ? 1 : 0 }}>
                    {[0, 1].map(c => (
                      <div key={c} style={{ flex: 1, height: 3, background: v.col, borderRadius: 1, opacity: 0.55 }} />
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ position: 'absolute', top: 16, left: 1, right: 1, height: 4, display: 'flex', gap: 1 }}>
                {[0, 1, 2].map(b => (
                  <div key={b} style={{ flex: 1, height: '100%', background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 1 }} />
                ))}
              </div>
              <div style={{ position: 'absolute', bottom: 3, left: 2, right: 2, height: 2, background: '#0a0a0a', border: '1px solid #222' }} />
              <div style={{ position: 'absolute', inset: 0, background: v.col, borderRadius: 1, pointerEvents: 'none', mixBlendMode: 'screen',
                animation: 'city-pulse2 2.2s ease-in-out infinite', animationDuration: `${2.2 + i * 0.5}s` }} />
            </div>
          </div>
        ))}

        {/* Storm drain grates along curb */}
        {[250, 660, 1110, 1560, 1990, 2440, 2890, 3340, 3780].map((x, i) => (
          <div key={`drain-${i}`} className="absolute pointer-events-none"
            style={{ left: x, bottom: 'calc(20% + 1px)', zIndex: 5, transform: 'translateX(-50%)' }}>
            <div style={{ width: 22, height: 6, background: '#0e0e0e', border: '1px solid #232323', borderRadius: 1, display: 'flex', gap: 1, padding: 1 }}>
              {[0, 1, 2, 3].map(k => (
                <div key={k} style={{ flex: 1, height: '100%', background: '#161616', borderRadius: 0 }} />
              ))}
            </div>
          </div>
        ))}

        {/* Cardboard boxes / trash bags street clutter */}
        {[{ x: 660, w: 12, h: 10 }, { x: 1360, w: 16, h: 12 }, { x: 2180, w: 10, h: 9 }, { x: 3090, w: 14, h: 11 }].map((b, i) => (
          <div key={`box-${i}`} className="absolute pointer-events-none"
            style={{ left: b.x, bottom: 'calc(20% + 2px)', zIndex: 7, transform: 'translateX(-50%)' }}>
            <div style={{ width: b.w, height: b.h, background: i % 2 === 0 ? '#1c1408' : '#181818', border: `1px solid ${i % 2 === 0 ? '#2a1e0a' : '#222'}`, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: '55%', right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)' }} />
              <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.3)' }} />
              {i % 2 !== 0 && <div style={{ position: 'absolute', top: -3, left: '30%', right: '30%', height: 4, background: '#141414', borderRadius: '50% 50% 0 0' }} />}
            </div>
          </div>
        ))}

        {/* Subway / utility grates */}
        {[1920, 3320].map((x, i) => (
          <div key={`grate-${i}`} className="absolute pointer-events-none"
            style={{ left: x, bottom: 'calc(20% + 2px)', zIndex: 6, transform: 'translateX(-50%)' }}>
            <div style={{ width: 38, height: 20, background: '#111', border: '2px solid #252525', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2, padding: 2, boxShadow: 'inset 0 0 6px rgba(0,0,0,0.8)' }}>
              {[0, 1, 2].map(r => (
                <div key={r} style={{ display: 'flex', gap: 2, flex: 1 }}>
                  {[0, 1, 2, 3].map(c => (
                    <div key={c} style={{ flex: 1, background: '#0a0a0a', border: '1px solid #1c1c1c' }} />
                  ))}
                </div>
              ))}
            </div>
            <motion.div animate={{ opacity: [0, 0.15, 0] }} transition={{ duration: 4, repeat: Infinity, delay: i * 2 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(100,200,255,0.2)', borderRadius: 2, pointerEvents: 'none' }} />
          </div>
        ))}

        {/* Sidewalk cracks – subtle diagonal fracture lines */}
        {[430, 970, 1600, 2230, 2860, 3470].map((x, i) => (
          <svg key={`crack-${i}`} className="absolute pointer-events-none"
            style={{ left: x, bottom: 'calc(20% + 4px)', zIndex: 5, overflow: 'visible' }}
            width="18" height="12">
            <path d={i % 2 === 0 ? 'M0,12 L5,6 L9,8 L15,0' : 'M2,10 L7,5 L5,2 L12,0'} stroke="#1d1d1d" strokeWidth="1" fill="none" />
            <path d={i % 2 === 0 ? 'M5,6 L3,3' : 'M7,5 L9,7'} stroke="#1a1a1a" strokeWidth="0.7" fill="none" />
          </svg>
        ))}



        {/* Parked delivery bike with cargo basket */}
        <div className="absolute pointer-events-none"
          style={{ left: 2900, bottom: 'calc(20% + 2px)', zIndex: 8, transform: 'translateX(-50%)' }}>
          <div style={{ position: 'relative', width: 34, height: 22 }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 8, height: 8, borderRadius: '50%', border: '2px solid #333', background: '#111' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 2, width: 8, height: 8, borderRadius: '50%', border: '2px solid #333', background: '#111' }} />
            <div style={{ position: 'absolute', bottom: 5, left: 6, right: 8, height: 9, background: '#1a3a1a', border: '1px solid #2a4a2a', borderRadius: 2 }} />
            <div style={{ position: 'absolute', bottom: 6, left: 0, width: 10, height: 9, background: '#111', border: '1px solid #2a2a2a', borderRadius: 1 }}>
              {[0, 1, 2].map(k => <div key={k} style={{ height: 1, background: '#1a1a1a', marginTop: k === 0 ? 2 : 1 }} />)}
            </div>
            <div style={{ position: 'absolute', top: 0, right: 4, width: 10, height: 3, background: '#2a2a2a', borderRadius: 1 }} />
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.1, repeat: Infinity }}
              style={{ position: 'absolute', top: 2, right: 3, width: 3, height: 3, background: '#88ee88', borderRadius: '50%', boxShadow: '0 0 5px #88ee88' }} />
          </div>
        </div>



        {/* Small street sign poles on sidewalk */}
        {[{ x: 600, text: '←', color: '#4488ff' }, { x: 1550, text: 'P', color: '#44cc44' }, { x: 2200, text: '↑', color: '#ffaa00' }, { x: 3400, text: '←', color: '#4488ff' }].map((sg, i) => (
          <div key={`sign-${i}`} className="absolute pointer-events-none"
            style={{ left: sg.x, bottom: 'calc(20% + 2px)', zIndex: 9, transform: 'translateX(-50%)' }}>
            <div style={{ width: 2, height: 32, background: '#222', margin: '0 auto', borderLeft: '1px solid #2e2e2e' }} />
            <div style={{ position: 'absolute', top: 0, left: -8, width: 18, height: 12, background: '#111', border: `1px solid ${sg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: sg.color, fontSize: 7, fontFamily: 'monospace', fontWeight: 900, lineHeight: 1, textShadow: `0 0 4px ${sg.color}` }}>{sg.text}</span>
            </div>
          </div>
        ))}

      </>)}
    </>
  );

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden font-sans select-none">
      {/* ── CSS keyframes — all decorative repeat-Infinity animations live here, off the JS thread */}
      <style>{`
        @keyframes lamp-flicker { 0%,100%{opacity:.88} 30%{opacity:1} 60%{opacity:.82} 80%{opacity:1} 90%{opacity:.92} }
        @keyframes lamp-halo    { 0%,100%{opacity:.28;transform:scale(1)} 50%{opacity:.5;transform:scale(1.1)} }
        @keyframes lamp-cone    { 0%,100%{opacity:.55} 50%{opacity:.82} }
        @keyframes city-pulse   { 0%,100%{opacity:.3}  50%{opacity:.6}  }
        @keyframes city-pulse2  { 0%,100%{opacity:.12} 50%{opacity:.28} }
        @keyframes city-pulse3  { 0%,100%{opacity:.4}  50%{opacity:.9}  }
        @keyframes ped-bounce   { 0%,100%{transform:translateY(0)} 25%{transform:translateY(-2px)} 50%{transform:translateY(-4px)} 75%{transform:translateY(-2px)} }
      `}</style>

      {/* ── Background ──────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0720] via-[#120e30] to-[#0e0b22]"></div>

        {/* Stars — single canvas replaces ~90 Motion instances */}
        <motion.div style={{ x: skyX }} className="absolute inset-0 -left-[10%] w-[120%] h-full">
          <StarField stars={stars} />
          {/* Shooting stars — kept as motion (only 2) */}
          <motion.div animate={{ x:[0,-500], y:[0,500], opacity:[0,1,0] }} transition={{ duration:2, repeat:Infinity, repeatDelay:10, ease:'linear' }}
            className="absolute top-10 right-10 w-32 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent rotate-45" />
          <motion.div animate={{ x:[0,-300], y:[0,300], opacity:[0,0.8,0] }} transition={{ duration:1.5, repeat:Infinity, repeatDelay:17, ease:'linear', delay:7 }}
            className="absolute top-20 left-[30%] w-20 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent rotate-45" />
        </motion.div>

        {/* Moon */}
        <motion.div style={{ x: skyX }} className="absolute top-16 right-[15%] w-24 h-24">
          <div className="w-full h-full rounded-full bg-[#fdfbf7] shadow-[0_0_60px_rgba(255,255,255,0.4)] relative overflow-hidden">
            <div className="absolute top-6 left-6 w-4 h-4 bg-[#dcdcdc] rounded-full opacity-40"></div>
            <div className="absolute bottom-8 right-8 w-8 h-8 bg-[#dcdcdc] rounded-full opacity-40"></div>
            <div className="absolute top-10 right-4 w-3 h-3 bg-[#dcdcdc] rounded-full opacity-40"></div>
          </div>
        </motion.div>

        {/* Clouds */}
        <motion.div style={{ x: cloudsX }} className="absolute top-20 left-0 w-[200%] h-40 opacity-20 pointer-events-none">
          <motion.div animate={{ x:[-100,-200] }} transition={{ duration:60, repeat:Infinity, ease:'linear' }} className="flex gap-64">
            <div className="w-96 h-12 bg-purple-300 rounded-full blur-2xl"></div>
            <div className="w-64 h-8  bg-pink-300  rounded-full blur-2xl mt-8"></div>
            <div className="w-80 h-10 bg-blue-300  rounded-full blur-2xl -mt-4"></div>
          </motion.div>
        </motion.div>

        {/* Searchlights */}
        <div className="absolute bottom-[20%] left-0 w-full h-full pointer-events-none opacity-25 mix-blend-screen">
          <motion.div animate={{ rotate:[-25,10,-25] }} transition={{ duration:15, repeat:Infinity, ease:'easeInOut' }}
            className="absolute bottom-0 left-[20%] w-[100px] h-[120vh] bg-gradient-to-t from-cyan-500/20 via-cyan-500/5 to-transparent origin-bottom"
            style={{ clipPath:'polygon(40% 0,60% 0,100% 100%,0% 100%)' }} />
          <motion.div animate={{ rotate:[15,-20,15] }} transition={{ duration:18, repeat:Infinity, ease:'easeInOut', delay:2 }}
            className="absolute bottom-0 left-[70%] w-[120px] h-[100vh] bg-gradient-to-t from-pink-500/20 via-pink-500/5 to-transparent origin-bottom"
            style={{ clipPath:'polygon(40% 0,60% 0,100% 100%,0% 100%)' }} />
        </div>

        {/* ── Far skyline ─────────────────────────────────────────────────── */}
        <motion.div style={{ x: farBgX, position:'absolute', bottom:'20%', left:0, width:5100, height:580, pointerEvents:'none', opacity:0.58, willChange:'transform' }}>
          {farBuildings.map((b, i) => {
            const path = farBldgPath(b.type, b.w, b.h);
            const gid  = `fg${i}`;
            const cpid = `fcp${i}`;
            // Window layout within the building bounding box
            const winPad = 5, winGx = 2.5, winGy = 3;
            const winW = Math.max(2, (b.w - winPad*2 - winGx*(b.wCols-1)) / b.wCols);
            const winH = Math.max(1.5, (b.h * 0.72 - winPad*2 - winGy*(b.wRows-1)) / b.wRows);
            const winTop = b.h * 0.15;

            return (
              <div key={i} style={{ position:'absolute', bottom:0, left: b.left, width: b.w, height: b.h }}>
                <svg width={b.w} height={b.h} style={{ display:'block', overflow:'visible' }}
                  aria-hidden>
                  <defs>
                    <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor={b.gradTop} />
                      <stop offset="55%" stopColor={b.gradTop} stopOpacity={0.85} />
                      <stop offset="100%" stopColor={b.gradBot} />
                    </linearGradient>
                    <clipPath id={cpid}>
                      <path d={path} />
                    </clipPath>
                  </defs>

                  {/* Building body */}
                  <path d={path} fill={`url(#${gid})`} />

                  {/* Neon outline — two passes: wide+faint glow, sharp edge */}
                  {b.hasNeon && <>
                    <path d={path} fill="none" stroke={b.neonC} strokeWidth={5} opacity={0.18} />
                    <path d={path} fill="none" stroke={b.neonC} strokeWidth={1.2} opacity={0.9} />
                  </>}

                  {/* Subtle horizontal floor lines */}
                  <g clipPath={`url(#${cpid})`} opacity={0.12}>
                    {Array.from({ length: Math.floor(b.h / 18) }).map((_, fi) => (
                      <line key={fi} x1={0} y1={fi * 18 + 18} x2={b.w} y2={fi * 18 + 18} stroke="#ffffff" strokeWidth={0.5} />
                    ))}
                  </g>

                  {/* Mid horizontal neon band */}
                  {b.hasMidBand && (
                    <line x1={0} y1={b.h * 0.52} x2={b.w} y2={b.h * 0.52}
                      stroke={b.midBandC} strokeWidth={1} opacity={0.55}
                      style={{ filter: `drop-shadow(0 0 3px ${b.midBandC})` }} />
                  )}

                  {/* Windows */}
                  <g clipPath={`url(#${cpid})`}>
                    {b.windows.map((lit, wi) => {
                      if (!lit) return null;
                      const col = wi % b.wCols;
                      const row = Math.floor(wi / b.wCols);
                      const wx  = winPad + col * (winW + winGx);
                      const wy  = winTop + winPad + row * (winH + winGy);
                      // Alternate warm / cool per column
                      const warm = col % 2 === 0;
                      return (
                        <rect key={wi} x={wx} y={wy} width={winW} height={winH}
                          fill={warm ? '#ffe8a0' : '#a8d8ff'} opacity={0.38 + (wi % 5) * 0.05} />
                      );
                    })}
                  </g>

                  {/* Vertical neon sign strip */}
                  {b.vertSign && (
                    <g>
                      <rect x={b.w - 7} y={b.h * 0.1} width={6} height={b.h * 0.5}
                        fill="rgba(0,0,0,0.7)" opacity={0.8} />
                      {b.vertText.split('').map((ch, ci) => (
                        <text key={ci} x={b.w - 4} y={b.h * 0.12 + ci * 12}
                          fill={b.neonC} fontSize={7} fontFamily="monospace" textAnchor="middle"
                          opacity={0.9}>{ch}</text>
                      ))}
                    </g>
                  )}

                  {/* Top cap accent line */}
                  {b.hasTopCap && (
                    <line x1={b.w*0.1} y1={3} x2={b.w*0.9} y2={3}
                      stroke={b.neonC} strokeWidth={2} opacity={0.6}
                      style={{ filter: `drop-shadow(0 0 4px ${b.neonC})` }} />
                  )}
                </svg>

                {/* Roof elements (outside SVG so they can overflow) */}
                {/* Attach billboard if present */}
                {b.billboard && (
                   <BillboardProp x={b.w/2} bottom={b.h - 4} adIdx={b.billboard.adIdx} />
                )}

                {b.roof === 'antenna' && (
                  <div style={{ position:'absolute', bottom: b.h, left: '50%', transform:'translateX(-50%)' }}>
                    <div style={{ width:1, height:28, backgroundColor:'#555', margin:'0 auto' }} />
                    <div style={{ width:14, height:1, backgroundColor:'#555', marginTop:-20, marginLeft:-6 }} />
                    <div style={{ width:8, height:1, backgroundColor:'#555', marginTop:6, marginLeft:-3 }} />
                    <motion.div animate={{ opacity:[1,0,1] }} transition={{ duration:1.1, repeat:Infinity }}
                      style={{ width:5, height:5, borderRadius:'50%', backgroundColor:'#ff2222', boxShadow:'0 0 6px #ff0000', position:'absolute', top:-2, left:-2 }} />
                  </div>
                )}
                {b.roof === 'multiantenna' && (
                  <div style={{ position:'absolute', bottom: b.h, left:0, right:0, display:'flex', justifyContent:'space-around' }}>
                    {[0,1,2].map(k => (
                      <div key={k} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                        <motion.div animate={{ opacity:[1,0,1] }} transition={{ duration:0.9+k*0.3, repeat:Infinity, delay:k*0.3 }}
                          style={{ width:4, height:4, borderRadius:'50%', backgroundColor:'#ff3333', boxShadow:'0 0 5px red', marginBottom:1 }} />
                        <div style={{ width:1, height: 8+k*5, backgroundColor:'#666' }} />
                      </div>
                    ))}
                  </div>
                )}
                {b.roof === 'tank' && (
                  <div style={{ position:'absolute', bottom: b.h, right: b.w * 0.2, display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <div style={{ width:2, height:10, backgroundColor:'#555' }} />
                    <div style={{ width: Math.min(b.w*0.25, 22), height: Math.min(b.w*0.25, 22), borderRadius:'50% 50% 0 0', backgroundColor:'#1a1828', border:'1px solid #444' }} />
                  </div>
                )}
                {b.roof === 'helipad' && (
                  <div style={{ position:'absolute', bottom: b.h - 4, left:'50%', transform:'translateX(-50%)', width: Math.min(b.w*0.6,30), height: Math.min(b.w*0.6,30), borderRadius:'50%', border:'1px solid rgba(255,200,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ color:'rgba(255,200,0,0.45)', fontSize:8, fontWeight:'bold' }}>H</span>
                  </div>
                )}
                {b.roof === 'spire_tip' && (
                  <div style={{ position:'absolute', bottom: b.h, left:'50%', transform:'translateX(-50%)', width:1, height:20, backgroundColor:b.neonC, boxShadow:`0 0 6px ${b.neonC}` }} />
                )}
                {b.hasWaterTower && (
                  <div style={{ position:'absolute', bottom: b.h, left: b.w * 0.18, display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <div style={{ width:1, height:12, backgroundColor:'#666' }} />
                    <div style={{ width:14, height:14, backgroundColor:'#16122a', border:'1px solid #444', borderRadius:'2px 2px 0 0' }} />
                  </div>
                )}
                {b.acUnits > 0 && (
                  <div style={{ position:'absolute', bottom: b.h, left:4, display:'flex', gap:2 }}>
                    {Array.from({ length: b.acUnits }).map((_,k) => (
                      <div key={k} style={{ width:10, height:7, backgroundColor:'#111', border:'1px solid #333' }}>
                        <div style={{ width:'100%', height:2, backgroundColor:'#252525', marginTop:2 }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Far-layer physical billboard props - REMOVED, now attached to buildings */}
        </motion.div>

        {/* ── Mid skyline ──────────────────────────────────────────────────── */}
        <motion.div
          style={{ x: midBgX, position:'absolute', bottom:'20%', left:0, width:5200, height:500, pointerEvents:'none', opacity:0.92, willChange:'transform' }}>

          {midBuildings.map((b, i) => {
            const path = midBldgPath(b.type, b.w, b.h);
            const gid  = `mg${i}`;
            const cpid = `mcp${i}`;
            // Floor window layout
            const lPad = 6, wGx = 3, wGy = 4;
            const winW = Math.max(3, (b.w - lPad*2 - wGx*(b.wCols-1)) / b.wCols);
            const winH = Math.max(3, (b.h * 0.74 - lPad - wGy*(b.wRows-1)) / b.wRows);
            const winTop = b.h * 0.18;
            // Floor line spacing
            const floorH = (b.h * 0.78) / b.wRows;

            return (
              <div key={i} style={{ position:'absolute', bottom:0, left: b.left, width: b.w, height: b.h }}>
                <svg width={b.w} height={b.h} style={{ display:'block', overflow:'visible' }} aria-hidden>
                  <defs>
                    <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={b.gradTop} />
                      <stop offset="60%"  stopColor={b.gradTop} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={b.gradBot} />
                    </linearGradient>
                    <clipPath id={cpid}>
                      <path d={path} />
                    </clipPath>
                  </defs>

                  {/* Body */}
                  <path d={path} fill={`url(#${gid})`} />

                  {/* Neon top edge (two-pass glow) */}
                  {b.hasNeon && <>
                    <path d={path} fill="none" stroke={b.neonC} strokeWidth={6} opacity={0.16} />
                    <path d={path} fill="none" stroke={b.neonC} strokeWidth={1.5} opacity={0.88} />
                  </>}

                  {/* Neon side strip */}
                  {b.hasNeonSide && (
                    <line x1={b.w} y1={b.h*0.05} x2={b.w} y2={b.h*0.85}
                      stroke={b.neonC} strokeWidth={1.5} opacity={0.5} />
                  )}

                  {/* Neon horizontal bands */}
                  {b.hasNeonBand && (
                    <>
                      <line x1={b.w*0.04} y1={b.h*b.neonBandY} x2={b.w*0.96} y2={b.h*b.neonBandY}
                        stroke={b.neonC} strokeWidth={1.2} opacity={0.55}
                        style={{ filter:`drop-shadow(0 0 4px ${b.neonC})` }} />
                    </>
                  )}
                  {b.hasMidBand2 && (
                    <line x1={b.w*0.04} y1={b.h*b.neonBandY2} x2={b.w*0.96} y2={b.h*b.neonBandY2}
                      stroke={b.neonC2} strokeWidth={0.8} opacity={0.4}
                      style={{ filter:`drop-shadow(0 0 3px ${b.neonC2})` }} />
                  )}

                  {/* Floor divider lines */}
                  <g clipPath={`url(#${cpid})`} opacity={0.22}>
                    {Array.from({ length: b.wRows }).map((_, fi) => (
                      <line key={fi} x1={0} y1={winTop + fi * floorH} x2={b.w} y2={winTop + fi * floorH}
                        stroke="#8899cc" strokeWidth={0.6} />
                    ))}
                  </g>

                  {/* External pipe details */}
                  {b.hasPipes && (
                    <g opacity={0.35}>
                      <rect x={b.w*0.88} y={b.h*0.05} width={2} height={b.h*0.8} fill="#666" />
                      <rect x={b.w*0.06} y={b.h*0.2}  width={2} height={b.h*0.6} fill="#555" />
                      {[0.25,0.45,0.65].map((py, pi) => (
                        <rect key={pi} x={b.w*0.06} y={b.h*py} width={8} height={3} fill="#444" />
                      ))}
                    </g>
                  )}

                  {/* Windows */}
                  <g clipPath={`url(#${cpid})`}>
                    {b.windows.map((lit, wi) => {
                      if (!lit) return null;
                      const col = wi % b.wCols;
                      const row = Math.floor(wi / b.wCols);
                      const wx  = lPad + col * (winW + wGx);
                      const wy  = winTop + wGy + row * (winH + wGy);
                      const warm = b.warmWindows[wi];
                      return (
                        <rect key={wi} x={wx} y={wy} width={winW} height={winH}
                          fill={warm ? '#ffd880' : '#88c4ff'} opacity={0.48 + (wi % 7) * 0.04} />
                      );
                    })}
                  </g>

                  {/* Vertical neon kanji sign */}
                  {b.hasVertSign && (
                    <g>
                      <rect x={b.w - 10} y={b.h*0.08} width={9} height={b.h*0.45} fill="rgba(0,0,0,0.8)" />
                      <rect x={b.w - 10} y={b.h*0.08} width={9} height={b.h*0.45} fill="none"
                        stroke={b.neonC} strokeWidth={0.8} opacity={0.7} />
                      {b.vertText.split('').map((ch, ci) => (
                        <text key={ci} x={b.w - 5.5} y={b.h*0.11 + ci * 14}
                          fill={b.neonC} fontSize={9} fontFamily="monospace" textAnchor="middle"
                          opacity={0.95}
                          style={{ filter:`drop-shadow(0 0 3px ${b.neonC})` }}>{ch}</text>
                      ))}
                    </g>
                  )}
                </svg>

                {/* Rooftop beacon */}
                <motion.div animate={{ opacity:[1,0,1] }} transition={{ duration:1.4+i*0.08, repeat:Infinity }}
                  style={{ position:'absolute', bottom: b.h-1, left:'32%', width:5, height:5, borderRadius:'50%', backgroundColor:'#ff2222', boxShadow:'0 0 7px #ff0000, 0 0 14px #ff000055' }} />

                {/* Helipad ring */}
                {b.hasHelipad && (
                  <div style={{ position:'absolute', bottom: b.h-3, left:'50%', transform:'translateX(-50%)', width: Math.min(b.w*0.55,36), height: Math.min(b.w*0.55,36), borderRadius:'50%', border:'1px solid rgba(255,200,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:'60%', height:'60%', borderRadius:'50%', border:'1px solid rgba(255,200,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ color:'rgba(255,200,0,0.5)', fontSize:9, fontWeight:'bold' }}>H</span>
                    </div>
                  </div>
                )}

                {/* AC units on roof */}
                {b.acCount > 0 && (
                  <div style={{ position:'absolute', bottom: b.h, left:4, display:'flex', gap:2 }}>
                    {Array.from({length: b.acCount}).map((_,k) => (
                      <div key={k} style={{ width:12, height:8, backgroundColor:'#0e0c1c', border:'1px solid #2a2840' }}>
                        <div style={{ width:'100%', height:2, backgroundColor:'#1a1830', marginTop:2 }} />
                        <div style={{ width:'100%', height:2, backgroundColor:'#141228', marginTop:1 }} />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Mid layer billboard */}
                {b.billboard && (
                   <BillboardProp x={b.w/2} bottom={b.h - 4} adIdx={b.billboard.adIdx} />
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Ground atmospheric haze */}
        <div className="absolute bottom-[20%] left-0 right-0 h-20 bg-gradient-to-t from-[#1a0e30]/30 to-transparent pointer-events-none" />
      </div>

      <Rain />

      {/* ── Scroll container ───────────────────────────────────────────────── */}
      <motion.div className="absolute top-0 left-0 h-full" style={{ x: cameraX, width: WORLD_WIDTH }}>
        {/* ── Enhanced ground / street surface ─── */}
        <div className="absolute bottom-0 w-full h-[20%] border-t-4 border-[#1e1e1e]"
          style={{ background: 'linear-gradient(to bottom, #1c1c1c 0%, #191919 43%, #121212 44%, #0d0d0d 100%)' }}>

          {/* SIDEWALK ZONE – top 43% */}
          <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ height: '43%' }}>
            {/* Tile grid – vertical lines every 48px */}
            {Array.from({ length: 84 }).map((_, i) => (
              <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: i * 48, width: 1, background: '#222' }} />
            ))}
            {/* Mid horizontal tile seam */}
            <div style={{ position: 'absolute', top: '52%', left: 0, right: 0, height: 1, background: '#1e1e1e' }} />
            {/* Subtle tile stain patches */}
            {[120, 480, 860, 1300, 1780, 2250, 2700, 3150, 3600].map((tx, ti) => (
              <div key={ti} style={{ position: 'absolute', top: '20%', left: tx, width: 24, height: 14, background: 'rgba(0,0,0,0.15)', borderRadius: 1 }} />
            ))}
          </div>

          {/* CURB STRIP – separates sidewalk from road */}
          <div style={{ position: 'absolute', top: '43%', left: 0, right: 0, height: 5,
            background: 'linear-gradient(to bottom, #2e2e2e, #1a1a1a)',
            borderTop: '1px solid #3a3a3a', borderBottom: '1px solid #0e0e0e' }} />

          {/* ROAD ZONE – bottom 53% */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ top: '48%', background: '#0c0c0c' }}>
            {/* Subtle asphalt horizontal texture bands */}
            {[15, 35, 55, 75, 90].map((pct, i) => (
              <div key={i} style={{ position: 'absolute', top: `${pct}%`, left: 0, right: 0, height: 1, background: '#101010' }} />
            ))}
            {/* Center lane dashes – yellow-ish */}
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} style={{ position: 'absolute', top: '46%', left: i * 96 + 8, width: 56, height: 3, background: '#252400', borderRadius: 1 }} />
            ))}
            {/* Near-curb white edge line */}
            <div style={{ position: 'absolute', top: 2, left: 0, right: 0, height: 1, background: '#1a1a1a' }} />
            {/* Far bottom edge */}
            <div style={{ position: 'absolute', bottom: 3, left: 0, right: 0, height: 2, background: '#181818' }} />
            {/* Road shimmer from rain – very subtle */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(40,60,100,0.04), transparent)', pointerEvents: 'none' }} />
          </div>

          {/* STORM DRAIN SLOTS along curb line */}
          {[260, 680, 1140, 1590, 2030, 2480, 2930, 3380, 3820].map((x, i) => (
            <div key={`sd-${i}`} style={{ position: 'absolute', top: '40%', left: x, width: 22, height: 7, background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 1, display: 'flex', gap: 1, padding: 1 }}>
              {[0, 1, 2, 3].map(k => (
                <div key={k} style={{ flex: 1, background: '#141414' }} />
              ))}
            </div>
          ))}
        </div>

        {/* Reflection */}
        <div className="absolute inset-0 pointer-events-none opacity-40 blur-[1px] mix-blend-screen select-none"
          style={{ transform:'scaleY(-1)', transformOrigin:'50% 80%', clipPath:'inset(80% 0 0 0)' }}>
          {renderSceneItems(true)}
        </div>

        {/* Main scene */}
        <div className="absolute inset-0 z-10">
          {renderSceneItems()}
      <motion.div className="absolute bottom-[calc(22%+20px)] z-40 -translate-x-1/2 pointer-events-none" style={{ x: characterX }}>
        <div className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded font-mono whitespace-nowrap border border-white/20">YOU</div>
      </motion.div>
        </div>
      </motion.div>

      {/* UI */}
      <div className="absolute top-6 left-6 z-50">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white font-mono text-xs bg-black/60 hover:bg-white/20 px-4 py-2 border border-white/30 rounded backdrop-blur-sm transition-colors">
          <span>←</span> BACK TO HOME
        </button>
      </div>

      {/* ── Keyboard movement hint (desktop non-touch only) ─────────────── */}
      {!isMobile && !isTouchDevice && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex items-center gap-3 text-white/20"
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7 }}>
          <span>← → / WASD  MOVE</span>
          <span className="text-white/10">•</span>
          <span>ENTER / CLICK BUILDING  ENTER</span>
        </div>
      )}

      {/* ── Desktop enter-building hint ───────────────────────────────────── */}
      <AnimatePresence>
        {activeLocation && !isMobile && !isTouchDevice && (
          <motion.div
            key="desk-enter"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="flex items-center gap-2 bg-black/80 border border-white/25 px-3 py-2 backdrop-blur-sm"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9 }}>
              <span className="text-white/80">▶ {LOCATIONS.find(l => l.id === activeLocation)?.name}</span>
              <span className="bg-white/15 text-white/70 px-1.5 py-0.5 rounded text-[8px]">ENTER</span>
              <span className="text-white/30">or</span>
              <span className="text-cyan-400/80">CLICK</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Touch / Tablet HUD (shown for any touch device, any screen size) ── */}
      {(isMobile || isTouchDevice) && (
      <div className="absolute bottom-0 left-0 right-0 z-40 flex flex-col items-center gap-2 pb-6 pt-2 pointer-events-none">

        {/* ENTER LOCATION button — floats above d-pad when near a building */}
        <AnimatePresence>
          {activeLocation && (
            <motion.div key="mob-enter"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="pointer-events-auto">
              <button
                onPointerDown={() => handleEnterLocation(activeLocation)}
                className="bg-white text-black font-mono font-black text-xs px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[3px] active:translate-y-[3px] transition-all"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, touchAction: 'manipulation' }}>
                ▶ {LOCATIONS.find(l => l.id === activeLocation)?.name ?? 'ENTER'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PAT CAT button — shows when near the cat */}
        <AnimatePresence>
          {catPrompt && (
            <motion.div key="mob-cat"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="pointer-events-auto">
              <button
                onPointerDown={handlePetCat}
                className="bg-[#ff4081] text-white font-mono font-black text-xs px-5 py-2 border-4 border-white shadow-[0_0_14px_#ff4081] active:scale-95 transition-transform"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, touchAction: 'manipulation' }}>
                ♥ PAT THE CAT
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* D-pad row */}
        <div className="flex items-center gap-6 pointer-events-none">
          {/* LEFT */}
          <div className="w-20 h-20 bg-black/50 rounded-full border-2 border-white/30 flex items-center justify-center pointer-events-auto active:bg-white/20 transition-colors shadow-lg"
            style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            onTouchStart={(e) => { e.preventDefault(); keysPressed.current.add('ArrowLeft'); }}
            onTouchEnd={(e) => { e.preventDefault(); keysPressed.current.delete('ArrowLeft'); }}
            onTouchCancel={() => keysPressed.current.delete('ArrowLeft')}>
            <span className="text-white text-3xl select-none">◀</span>
          </div>
          {/* Spacer / center label */}
          <div className="text-white/20 font-mono text-[9px] text-center select-none" style={{ fontFamily: '"Press Start 2P", monospace' }}>
            MOVE
          </div>
          {/* RIGHT */}
          <div className="w-20 h-20 bg-black/50 rounded-full border-2 border-white/30 flex items-center justify-center pointer-events-auto active:bg-white/20 transition-colors shadow-lg"
            style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            onTouchStart={(e) => { e.preventDefault(); keysPressed.current.add('ArrowRight'); }}
            onTouchEnd={(e) => { e.preventDefault(); keysPressed.current.delete('ArrowRight'); }}
            onTouchCancel={() => keysPressed.current.delete('ArrowRight')}>
            <span className="text-white text-3xl select-none">▶</span>
          </div>
        </div>
      </div>
      )} {/* end (isMobile || isTouchDevice) */}

      {/* ── Ramen Shop ─────────────────────────────────────────────────────── */}
      {/* Fade-to-black overlay */}
      <AnimatePresence>
        {(ramenState === 'fadeIn' || ramenState === 'fadeOut') && (
          <motion.div
            key="ramen-fade"
            className="fixed inset-0 bg-black z-[60]"
            initial={{ opacity: ramenState === 'fadeIn' ? 0 : 1 }}
            animate={{ opacity: ramenState === 'fadeIn' ? 1 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42 }}
          />
        )}
      </AnimatePresence>

      {/* Ramen interior */}
      <AnimatePresence>
        {ramenState === 'open' && (
          <motion.div
            key="ramen-shop"
            className="fixed inset-0 z-[55]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <RamenShop onExit={handleRamenExit} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Record Store ─────────────────────────────────────────────────────── */}
      {/* Fade-to-black overlay */}
      <AnimatePresence>
        {(recordState === 'fadeIn' || recordState === 'fadeOut') && (
          <motion.div
            key="record-fade"
            className="fixed inset-0 bg-black z-[60]"
            initial={{ opacity: recordState === 'fadeIn' ? 0 : 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42 }}
          />
        )}
      </AnimatePresence>

      {/* Record store interior */}
      <AnimatePresence>
        {recordState === 'open' && (
          <motion.div
            key="record-store"
            className="fixed inset-0 z-[55]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <RecordStore onExit={handleRecordExit} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Arcade ──────────────────────────────────────────────────────────── */}
      {/* White flash overlay */}
      <AnimatePresence>
        {arcadeState === 'flash' && (
          <motion.div
            key="arcade-flash"
            className="fixed inset-0 z-[70]"
            style={{ background: '#ffffff' }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Fade-out overlay */}
      <AnimatePresence>
        {arcadeState === 'fadeOut' && (
          <motion.div
            key="arcade-fadeout"
            className="fixed inset-0 bg-black z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          />
        )}
      </AnimatePresence>

      {/* Arcade interior */}
      <AnimatePresence>
        {arcadeState === 'open' && (
          <motion.div
            key="arcade-interior"
            className="fixed inset-0 z-[65]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <ArcadePage onExit={handleArcadeExit} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Convenience Store ─────────────────────────────────────────────────── */}
      {/* Fade-to-black overlay */}
      <AnimatePresence>
        {(convenienceState === 'fadeIn' || convenienceState === 'fadeOut') && (
          <motion.div
            key="conv-fade"
            className="fixed inset-0 bg-black z-[60]"
            initial={{ opacity: convenienceState === 'fadeIn' ? 0 : 1 }}
            animate={{ opacity: convenienceState === 'fadeIn' ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          />
        )}
      </AnimatePresence>

      {/* Convenience store interior */}
      <AnimatePresence>
        {convenienceState === 'open' && (
          <motion.div
            key="convenience-store"
            className="fixed inset-0 z-[55]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ConvenienceStore onExit={handleConvenienceExit} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Photo Booth ─────────────────────────────────────────────────────── */}
      {/* Fade-to-black entry overlay */}
      <AnimatePresence>
        {(photoBoothState === 'fadeIn' || photoBoothState === 'fadeOut') && (
          <motion.div
            key="photobooth-fade"
            className="fixed inset-0 bg-black z-[60]"
            initial={{ opacity: photoBoothState === 'fadeIn' ? 0 : 1 }}
            animate={{ opacity: photoBoothState === 'fadeIn' ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
          />
        )}
      </AnimatePresence>

      {/* Photo booth page */}
      <AnimatePresence>
        {photoBoothState === 'open' && (
          <motion.div
            key="photobooth-page"
            className="fixed inset-0 z-[55]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <PhotoBoothPage onExit={handlePhotoBoothExit} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}