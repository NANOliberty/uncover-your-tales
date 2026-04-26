import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMusic, TRACK_TITLE } from './MusicContext';
import { PixelCharacter } from './PixelCharacter';

const PX = { fontFamily: '"Press Start 2P", monospace' } as const;
const KONBINI_AMBIENT = 'https://raw.githubusercontent.com/crlazy101/Tokyo-Audio/main/convenience_store_hhamcc.ogg';

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes kNeonPulse  { 0%,100%{opacity:.74} 50%{opacity:1}  }
  @keyframes kNeonPulse2 { 0%,100%{opacity:.44} 50%{opacity:.80} }
  @keyframes kNeonFlick  { 0%,87%,100%{opacity:.9} 89%{opacity:.2} 91%{opacity:.85} 93.5%{opacity:.12} 95%{opacity:.9} }
  @keyframes kNeonFlick2 { 0%,92%,100%{opacity:.85} 93%{opacity:.3} 95%{opacity:.8} 97%{opacity:.15} 99%{opacity:.85} }
  @keyframes kBreathe    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1px)} }
  @keyframes kZzz        { 0%{opacity:0;transform:translate(0,0) scale(.75)} 18%{opacity:.88} 72%{opacity:.5} 100%{opacity:0;transform:translate(5px,-20px) scale(1.05)} }
  @keyframes kSteamUp    { 0%{opacity:0;transform:translateY(0) scaleX(.6)} 30%{opacity:.4} 100%{opacity:0;transform:translateY(-16px) scaleX(1.5)} }
  @keyframes kColdPuff   { 0%{opacity:.65;transform:translateY(0) scale(.4)} 100%{opacity:0;transform:translateY(-44px) scale(2.2)} }
  @keyframes kEatBounce  { 0%{transform:rotate(0deg) scale(1)} 25%{transform:rotate(-12deg) scale(1.3)} 50%{transform:rotate(8deg) scale(1.1)} 75%{transform:rotate(-5deg) scale(.9)} 100%{transform:rotate(0deg) scale(0)} }
  @keyframes kHotGlow    { 0%,100%{opacity:.06} 50%{opacity:.16} }
  @keyframes kFridgeGlow { 0%,100%{opacity:.09} 50%{opacity:.18} }
  @keyframes kPricePulse { 0%,100%{opacity:.5} 50%{opacity:.85} }
  @keyframes kCartBounce { 0%{transform:scale(1)} 25%{transform:scale(1.5)} 65%{transform:scale(0.88)} 100%{transform:scale(1)} }
  @keyframes kReceiptIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes kPayFlash   { 0%,100%{background:#040c10} 50%{background:#003822} }
  @keyframes kConsumeGlow{ 0%,100%{box-shadow:0 0 0 #00ff88} 50%{box-shadow:0 0 18px #00ff8888} }
  .kb-btn:hover  { filter:brightness(1.4); }
  .kb-add:hover  { filter:brightness(1.5); transform:translateY(-1px); }
  .kb-add:active { transform:translateY(1px); }
`;

function seededRng(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const DRINKS = [
  { id:'matcha', jp:'抹茶',     name:'MATCHA LATTE',    bg:'#2a8840', cap:'#1a5828', mid:'#5ac870', price:'¥148' },
  { id:'peach',  jp:'白桃',     name:'WHITE PEACH TEA', bg:'#d87828', cap:'#b05018', mid:'#f0a050', price:'¥158' },
  { id:'cola',   jp:'コーラ',   name:'STARDUST COLA',   bg:'#c02030', cap:'#881018', mid:'#e04060', price:'¥148' },
  { id:'energy', jp:'EM-7',     name:'ENERGY DRINK',    bg:'#78bc00', cap:'#508000', mid:'#aaee20', price:'¥178' },
  { id:'water',  jp:'天然水',   name:'MINERAL WATER',   bg:'#3878c8', cap:'#1a5090', mid:'#80b8ee', price:'¥128' },
  { id:'milk',   jp:'苺ミルク', name:'STRAWBERRY MILK', bg:'#c84878', cap:'#903058', mid:'#f088b0', price:'¥158' },
];

const SNACKS = [
  { id:'onigiri', jp:'おにぎり', name:'TUNA MAYO',   sub:'ONIGIRI',       price:'¥148' },
  { id:'chips',   jp:'ポテチ',   name:'NORI SALT',   sub:'POTATO CHIPS',  price:'¥178' },
  { id:'mochi',   jp:'大福',     name:'STRAWBERRY',  sub:'DAIFUKU MOCHI', price:'¥198' },
  { id:'taiyaki', jp:'たい焼き', name:'CUSTARD',     sub:'TAIYAKI',       price:'¥220' },
];

const MAGS = [
  { id:'gaming',  title:'FAMICOM★', line1:'週刊',   line2:'GAME',    bg:'#c81818', accent:'#ffdd00', trim:'#ff4444' },
  { id:'fashion', title:'HARAJUKU', line1:'STREET', line2:'FASHION', bg:'#c83470', accent:'#ffccee', trim:'#ff88bb' },
  { id:'music',   title:'GROOVE',   line1:'音楽',   line2:'WEEKLY',  bg:'#142888', accent:'#00ccff', trim:'#4488ff' },
  { id:'manga',   title:'ジャンプ', line1:'少年',   line2:'WEEKLY',  bg:'#d85500', accent:'#ffee00', trim:'#ff8800' },
  { id:'tech',    title:'BYTEWIRE', line1:'TECH',   line2:'MONTHLY', bg:'#081408', accent:'#00ff88', trim:'#00aa55' },
];

// ─── In-room SVG pixel-art sprites ─────────────────────────────────────────────

// Onigiri (11×13) — clear triangle rice ball with nori wrap
function PxOnigiri({ x, y, type=0 }: { x:number; y:number; type?:number }) {
  const fill = type===0?'#e84828':type===1?'#d82858':'#e07020';
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Rice body */}
      <polygon points="5.5,0 0,12 11,12" fill="#e8e2c8"/>
      <polygon points="5.5,1 1,11 10,11" fill="#f2ecda"/>
      {/* Plastic wrap sheen */}
      <polygon points="5.5,1 2,9 5.5,9" fill="rgba(255,255,255,0.12)"/>
      {/* Nori strip */}
      <rect x="0" y="9" width="11" height="3" fill="#141c10"/>
      <rect x="1" y="9" width="9"  height="1" fill="#1a2014" opacity="0.6"/>
      {/* Nori texture */}
      <rect x="2" y="10" width="1" height="1" fill="#0e1608" opacity="0.5"/>
      <rect x="5" y="10" width="1" height="1" fill="#0e1608" opacity="0.5"/>
      <rect x="8" y="10" width="1" height="1" fill="#0e1608" opacity="0.5"/>
      {/* Filling dot */}
      <rect x="4" y="4" width="2.5" height="2.5" fill={fill} opacity="0.85"/>
      {/* Shine */}
      <rect x="2" y="2" width="2"   height="1"   fill="#fffae8" opacity="0.5"/>
      {/* Price sticker */}
      <rect x="3" y="12" width="5"  height="1"   fill="#ffeedd" opacity="0.35"/>
    </g>
  );
}

// Cup noodle (8×11) — cylindrical cup with wavy band
function PxCup({ x, y, color, cap }: { x:number; y:number; color:string; cap:string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Cup body */}
      <rect x="0.5" y="3.5" width="7"   height="7.5" fill={color}/>
      {/* Lid */}
      <rect x="0"   y="0"   width="8"   height="4"   fill={cap}/>
      <rect x="0"   y="0"   width="8"   height="1"   fill="rgba(255,255,255,0.25)"/>
      {/* Lid ring */}
      <rect x="0"   y="3.5" width="8"   height="1"   fill={cap}/>
      {/* Wavy band */}
      <rect x="0.5" y="6"   width="7"   height="2"   fill="rgba(255,255,255,0.18)"/>
      {/* Left shine */}
      <rect x="0.5" y="4.5" width="1.2" height="6.5" fill="rgba(255,255,255,0.2)"/>
      {/* Bottom taper suggestion */}
      <rect x="1"   y="10"  width="6"   height="1"   fill="rgba(0,0,0,0.2)"/>
    </g>
  );
}

// Drink can (6×12) — taller proportions, clear label band
function PxCan({ x, y, bg, cap, mid }: { x:number; y:number; bg:string; cap:string; mid:string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Can body */}
      <rect x="0"   y="2"   width="6"   height="10" fill={bg}/>
      {/* Top cap */}
      <rect x="0.5" y="0"   width="5"   height="2.5" fill={cap}/>
      {/* Bottom cap */}
      <rect x="0.5" y="10.5" width="5"  height="1.5" fill={cap}/>
      {/* Label band */}
      <rect x="0"   y="4.5" width="6"   height="4"  fill="rgba(255,255,255,0.1)"/>
      <rect x="0"   y="4"   width="6"   height="0.8" fill={mid} opacity="0.55"/>
      <rect x="0"   y="8"   width="6"   height="0.8" fill={mid} opacity="0.45"/>
      {/* Pull ring */}
      <rect x="1.5" y="0.5" width="3"   height="1"  fill={mid} opacity="0.65"/>
      {/* Left shine */}
      <rect x="0"   y="2"   width="1.2" height="10" fill="rgba(255,255,255,0.22)"/>
    </g>
  );
}

// Snack bag (8×10) — sealed bag shape with brand area
function PxBag({ x, y, color, accent }: { x:number; y:number; color:string; accent:string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Sealed top */}
      <rect x="2"   y="0"   width="4"   height="1.5" fill={color}/>
      <rect x="1.5" y="1"   width="5"   height="1"   fill={color} opacity="0.7"/>
      {/* Bag body */}
      <rect x="0"   y="2"   width="8"   height="8"   fill={color}/>
      {/* Brand band */}
      <rect x="0"   y="3.5" width="8"   height="3"   fill={accent} opacity="0.4"/>
      {/* Sealed bottom */}
      <rect x="0.5" y="9"   width="7"   height="1"   fill={color} opacity="0.7"/>
      {/* Sealed bottom crease */}
      <rect x="1.5" y="9.5" width="5"   height="0.8" fill="rgba(0,0,0,0.15)"/>
      {/* Left shine */}
      <rect x="0.5" y="2"   width="1.2" height="8"   fill="rgba(255,255,255,0.14)"/>
    </g>
  );
}

// Bottle (5×14) for fridge
function PxBottle({ x, y, bg, cap }: { x:number; y:number; bg:string; cap:string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Neck */}
      <rect x="1.5" y="0"   width="2"   height="2.5" fill={cap}/>
      {/* Shoulder */}
      <rect x="0.5" y="2"   width="4"   height="2"   fill={bg}/>
      {/* Body */}
      <rect x="0"   y="4"   width="5"   height="10"  fill={bg}/>
      {/* Label */}
      <rect x="0.5" y="6"   width="4"   height="5"   fill="rgba(255,255,255,0.15)"/>
      {/* Shine */}
      <rect x="0.5" y="4"   width="1"   height="10"  fill="rgba(255,255,255,0.22)"/>
      {/* Label line */}
      <rect x="0.5" y="6"   width="4"   height="0.7" fill="rgba(255,255,255,0.3)"/>
      <rect x="0.5" y="10"  width="4"   height="0.7" fill="rgba(255,255,255,0.2)"/>
    </g>
  );
}

// ─── Magazine cover SVG (for interactive panel) ───────────────────────────────
function MagCoverSVG({ mag, w=60, h=80 }: { mag: typeof MAGS[0]; w?:number; h?:number }) {
  const cx = 30;
  return (
    <svg width={w} height={h} viewBox="0 0 60 80" shapeRendering="crispEdges" style={{ display:'block' }}>
      <rect width="60" height="80" fill={mag.bg}/>
      <rect x="0" y="0" width="60" height="80" fill="none" stroke={mag.accent} strokeWidth="1.5"/>
      {/* Title bar */}
      <rect x="0" y="0" width="60" height="12" fill={mag.trim} opacity="0.85"/>
      <text x={cx} y="9" textAnchor="middle" fontFamily="'Press Start 2P',monospace" fontSize="5.5" fill={mag.bg} fontWeight="bold">{mag.title}</text>

      {mag.id === 'gaming' && (<>
        {/* Large game controller */}
        <rect x={cx-14} y="16" width="28" height="18" fill="#1a1a1a" rx="4"/>
        <rect x={cx-14} y="14" width="28" height="5"  fill="#222"/>
        {/* D-pad */}
        <rect x={cx-12} y="20" width="4"  height="9"  fill="#555"/>
        <rect x={cx-15} y="23" width="10" height="3"  fill="#555"/>
        <rect x={cx-11} y="21" width="2"  height="7"  fill="#333"/>
        {/* Buttons ABXY */}
        <rect x={cx+5}  y="19" width="3"  height="3"  fill="#e82020"/>
        <rect x={cx+9}  y="21" width="3"  height="3"  fill="#20a020"/>
        <rect x={cx+5}  y="23" width="3"  height="3"  fill="#2060e0"/>
        <rect x={cx+1}  y="21" width="3"  height="3"  fill="#f0c020"/>
        {/* Center buttons */}
        <rect x={cx-3}  y="21" width="3"  height="2"  fill="#444"/>
        <rect x={cx+1}  y="21" width="2"  height="2"  fill="#444"/>
        {/* Grips */}
        <rect x={cx-16} y="28" width="6"  height="6"  fill="#1a1a1a" rx="2"/>
        <rect x={cx+10} y="28" width="6"  height="6"  fill="#1a1a1a" rx="2"/>
        {/* Screen */}
        <rect x={cx-7}  y="38" width="14" height="10" fill="#0a0a20"/>
        <rect x={cx-6}  y="39" width="12" height="8"  fill="#0a1040"/>
        {[0,1,2,3,4].map(i=><rect key={i} x={cx-4+i*3} y="43" width="2" height="3" fill={['#e82020','#20c020','#e8c020','#20a0e8','#e820c0'][i]}/>)}
        <rect x={cx-4}  y="40" width="5"  height="3"  fill="#e8c020"/>
        {/* Score text */}
        <rect x="4" y="52" width="52" height="1" fill={mag.accent} opacity="0.4"/>
        <text x={cx} y="60" textAnchor="middle" fontFamily="monospace" fontSize="4" fill={mag.accent}>BEST GAMES</text>
        <text x={cx} y="65" textAnchor="middle" fontFamily="monospace" fontSize="4" fill={mag.accent}>OF 2086</text>
        <text x={cx} y="76" textAnchor="middle" fontFamily="monospace" fontSize="3.5" fill="#ffffff" opacity="0.6">VOL.188 — ¥680</text>
      </>)}

      {mag.id === 'fashion' && (<>
        {/* Full-body harajuku character */}
        {/* Head */}
        <rect x={cx-6}  y="13" width="12" height="12" fill="#f8d0a0"/>
        {/* Hair - twin tails wide */}
        <rect x={cx-9}  y="11" width="18" height="6"  fill="#aa2266"/>
        <rect x={cx-12} y="15" width="5"  height="10" fill="#aa2266"/>
        <rect x={cx+7}  y="15" width="5"  height="10" fill="#aa2266"/>
        {/* Bangs */}
        <rect x={cx-7}  y="14" width="4"  height="4"  fill="#aa2266"/>
        <rect x={cx+3}  y="14" width="4"  height="4"  fill="#aa2266"/>
        {/* Face features */}
        <rect x={cx-4}  y="18" width="3"  height="3"  fill="#1a1a1a"/>
        <rect x={cx+1}  y="18" width="3"  height="3"  fill="#1a1a1a"/>
        <rect x={cx-3}  y="17" width="1"  height="1"  fill="#ffffff" opacity="0.6"/>
        <rect x={cx+2}  y="17" width="1"  height="1"  fill="#ffffff" opacity="0.6"/>
        <rect x={cx-1}  y="22" width="3"  height="1"  fill="#e86088"/>
        {/* Outfit top */}
        <rect x={cx-8}  y="25" width="16" height="14" fill="#ee88cc"/>
        <rect x={cx-4}  y="25" width="8"  height="5"  fill="#ffccee"/>
        {/* Ribbon */}
        <rect x={cx-3}  y="26" width="2"  height="3"  fill="#ff4499"/>
        <rect x={cx+1}  y="26" width="2"  height="3"  fill="#ff4499"/>
        <rect x={cx-1}  y="27" width="2"  height="2"  fill="#ff66aa"/>
        {/* Skirt */}
        <rect x={cx-9}  y="39" width="18" height="10" fill="#dd66bb"/>
        <rect x={cx-10} y="40" width="20" height="8"  fill="#cc55aa"/>
        {/* Legs */}
        <rect x={cx-6}  y="49" width="4"  height="9"  fill="#f8d0a0"/>
        <rect x={cx+2}  y="49" width="4"  height="9"  fill="#f8d0a0"/>
        {/* Boots */}
        <rect x={cx-7}  y="56" width="5"  height="4"  fill="#aa2266"/>
        <rect x={cx+2}  y="56" width="5"  height="4"  fill="#aa2266"/>
        {/* Stars */}
        {[[-10,14],[7,15],[-12,23],[9,24],[-8,36],[8,38]].map(([sx,sy],i)=><rect key={i} x={cx+sx} y={sy} width="2" height="2" fill="#ffee44" opacity="0.85"/>)}
        <rect x="2" y="64" width="56" height="1" fill={mag.accent} opacity="0.35"/>
        <text x={cx} y="72" textAnchor="middle" fontFamily="monospace" fontSize="4" fill={mag.accent}>SPRING</text>
        <text x={cx} y="77" textAnchor="middle" fontFamily="monospace" fontSize="3.5" fill="#fff" opacity="0.6">APR 2086 — ¥780</text>
      </>)}

      {mag.id === 'music' && (<>
        {/* Night cityscape panorama */}
        {[[5,55,8,23],[15,50,6,28],[23,46,10,32],[35,44,9,34],[46,52,7,26],[54,47,7,31]].map(([bx,by,bw,bh],i)=>(
          <rect key={i} x={bx} y={by} width={bw} height={bh} fill="#06061e"/>
        ))}
        {/* Building windows */}
        {[[7,57],[9,61],[17,53],[25,49],[30,55],[38,47],[42,53],[48,55],[56,50],[58,55]].map(([wx,wy],i)=>(
          <rect key={i} x={wx} y={wy} width="2" height="2" fill={i%3===0?'#ffcc44':i%3===1?'#4488ff':'#ff8800'} opacity="0.85"/>
        ))}
        {/* Neon horizon */}
        <rect x="0" y="64" width="60" height="1.5" fill={mag.accent} opacity="0.75"/>
        <rect x="0" y="65" width="60" height="6"   fill={mag.accent} opacity="0.06"/>
        {/* Vinyl record */}
        <circle cx={cx} cy="35" r="16" fill="#060610"/>
        {[0.55,0.72,0.88].map((r,i)=>(
          <circle key={i} cx={cx} cy="35" r={r*16} fill="none" stroke="#141228" strokeWidth="1.2"/>
        ))}
        <circle cx={cx} cy="35" r="6" fill="#e83898"/>
        <circle cx={cx} cy="35" r="2.5" fill="#080412"/>
        {/* Music notes */}
        <text x="8"  y="30" fontFamily="monospace" fontSize="9" fill={mag.accent} opacity="0.9">♪</text>
        <text x="47" y="38" fontFamily="monospace" fontSize="7" fill="#ff88ff" opacity="0.8">♫</text>
        <text x={cx} y="74" textAnchor="middle" fontFamily="monospace" fontSize="4" fill={mag.accent}>CITY POP REVIVAL</text>
        <text x={cx} y="78" textAnchor="middle" fontFamily="monospace" fontSize="3.5" fill="#ffffff" opacity="0.55">WK.12 — ¥580</text>
      </>)}

      {mag.id === 'manga' && (<>
        {/* Impact speed lines */}
        {Array.from({length:16},(_,i)=>{
          const a=(i/16)*Math.PI*2;
          return <line key={i} x1={cx} y1={34} x2={cx+Math.cos(a)*40} y2={34+Math.sin(a)*32} stroke={mag.accent} strokeWidth="0.6" opacity="0.45"/>;
        })}
        {/* Character face */}
        <rect x={cx-9}  y="20" width="18" height="20" fill="#f0ddb0"/>
        {/* Spiky hair */}
        <rect x={cx-12} y="16" width="24" height="8"  fill="#1a1a1a"/>
        <rect x={cx-12} y="14" width="5"  height="8"  fill="#1a1a1a"/>
        <rect x={cx+7}  y="14" width="5"  height="8"  fill="#1a1a1a"/>
        <rect x={cx-7}  y="12" width="4"  height="6"  fill="#1a1a1a"/>
        <rect x={cx+3}  y="12" width="4"  height="6"  fill="#1a1a1a"/>
        <rect x={cx-2}  y="10" width="4"  height="8"  fill="#1a1a1a"/>
        {/* Determined eyes */}
        <rect x={cx-8}  y="24" width="5"  height="4"  fill="#1a1a1a"/>
        <rect x={cx+3}  y="24" width="5"  height="4"  fill="#1a1a1a"/>
        <rect x={cx-7}  y="25" width="3"  height="2"  fill="#3080e0"/>
        <rect x={cx+4}  y="25" width="3"  height="2"  fill="#3080e0"/>
        <rect x={cx-6}  y="25" width="1"  height="1"  fill="#ffffff" opacity="0.8"/>
        <rect x={cx+5}  y="25" width="1"  height="1"  fill="#ffffff" opacity="0.8"/>
        {/* Action scar */}
        <rect x={cx-3}  y="22" width="5"  height="1"  fill="#c03030" opacity="0.7"/>
        {/* Mouth - gritting */}
        <rect x={cx-5}  y="32" width="10" height="3"  fill="#c03030"/>
        <rect x={cx-3}  y="33" width="2"  height="2"  fill="#e8e0c0"/>
        <rect x={cx+1}  y="33" width="2"  height="2"  fill="#e8e0c0"/>
        {/* Exclamation badge */}
        <rect x={cx-16} y="16" width="6"  height="5"  fill="#ffee00" transform={`rotate(-20 ${cx-13} 18)`}/>
        <text x={cx-14} y="21" fontFamily="'Press Start 2P',monospace" fontSize="4" fill="#c03030" transform={`rotate(-20 ${cx-13} 18)`}>!</text>
        {/* Action text */}
        <text x={cx} y="52" textAnchor="middle" fontFamily="'Press Start 2P',monospace" fontSize="6" fill={mag.accent} fontWeight="bold">JUMP!</text>
        <rect x="2" y="55" width="56" height="1" fill={mag.accent} opacity="0.4"/>
        <text x={cx} y="64" textAnchor="middle" fontFamily="monospace" fontSize="4" fill="#fff" opacity="0.8">SHŌNEN WEEKLY</text>
        <text x={cx} y="70" textAnchor="middle" fontFamily="monospace" fontSize="3.5" fill={mag.accent} opacity="0.8">NO.14 — ¥280</text>
      </>)}

      {mag.id === 'tech' && (<>
        {/* Isometric CPU/chip */}
        <rect x="8"  y="14" width="44" height="44" fill="#040c04"/>
        {/* Circuit traces */}
        {[16,24,32,40,48].map(ty=>(
          <rect key={ty} x="8" y={ty} width="44" height="0.8" fill={mag.accent} opacity="0.15"/>
        ))}
        {[16,24,32,40,48,56].map(tx=>(
          <rect key={tx} x={tx} y="14" width="0.8" height="44" fill={mag.accent} opacity="0.12"/>
        ))}
        {/* CPU die */}
        <rect x="18" y="22" width="24" height="28" fill="#060e06" stroke={mag.accent} strokeWidth="0.5" opacity="0.9"/>
        <rect x="18" y="22" width="24" height="6"  fill={mag.accent} opacity="0.2"/>
        {/* Circuit nodes */}
        {[[15,24],[56,32],[16,48],[56,46],[32,15],[32,56]].map(([nx,ny],i)=>(
          <g key={i}>
            <rect x={nx-2} y={ny-2} width="4" height="4" fill={mag.accent} opacity="0.5"/>
            <line x1={nx} y1={ny} x2={nx > 40 ? 42 : nx < 20 ? 18 : nx} y2={ny > 40 ? 50 : ny < 20 ? 22 : ny} stroke={mag.accent} strokeWidth="0.6" opacity="0.3"/>
          </g>
        ))}
        {/* Terminal inside */}
        <text x="20" y="31" fontFamily="monospace" fontSize="3.5" fill={mag.accent} opacity="0.9">$ sudo think</text>
        <text x="20" y="36" fontFamily="monospace" fontSize="3" fill="#00cc66" opacity="0.85">▓▓▓▓▓░ 88%</text>
        <text x="20" y="41" fontFamily="monospace" fontSize="3.5" fill={mag.accent} opacity="0.75">AI MUSIC</text>
        <text x="20" y="46" fontFamily="monospace" fontSize="3" fill={mag.accent} opacity="0.6">REVIEWED_</text>
        <text x={cx} y="64" textAnchor="middle" fontFamily="monospace" fontSize="4" fill={mag.accent}>AI ISSUE</text>
        <text x={cx} y="70" textAnchor="middle" fontFamily="monospace" fontSize="3.5" fill={mag.accent} opacity="0.6">VOL.44</text>
        <text x={cx} y="76" textAnchor="middle" fontFamily="monospace" fontSize="3.5" fill="#fff" opacity="0.55">MAR 2086 — ¥880</text>
      </>)}
    </svg>
  );
}

// ─── Large drink can (for fridge panel) ──────────────────────────────────────
function BigCan({ drink, size=1 }: { drink: typeof DRINKS[0]; size?: number }) {
  const W=32*size, H=58*size;
  return (
    <svg width={W} height={H} viewBox="0 0 32 58" shapeRendering="crispEdges" style={{ display:'block' }}>
      <rect x="2"  y="5"  width="28" height="48" fill={drink.bg}/>
      <rect x="4"  y="0"  width="24" height="7"  fill={drink.cap}/>
      <rect x="6"  y="1"  width="20" height="2"  fill={drink.mid} opacity="0.4"/>
      <rect x="4"  y="51" width="24" height="7"  fill={drink.cap}/>
      <rect x="3"  y="5"  width="4"  height="48" fill="rgba(255,255,255,0.18)"/>
      <rect x="2"  y="16" width="28" height="1.5" fill={drink.mid} opacity="0.6"/>
      <rect x="2"  y="38" width="28" height="1.5" fill={drink.mid} opacity="0.6"/>
      <rect x="6"  y="18" width="20" height="19" fill="rgba(255,255,255,0.08)"/>
      <rect x="7"  y="22" width="18" height="3"  fill="rgba(255,255,255,0.3)"/>
      <rect x="8"  y="27" width="14" height="2"  fill="rgba(255,255,255,0.2)"/>
      <rect x="7"  y="31" width="18" height="2"  fill="rgba(255,255,255,0.15)"/>
      <rect x="12" y="2"  width="8"  height="2"  fill={drink.mid} opacity="0.7"/>
      <rect x="14" y="1"  width="4"  height="2"  fill="rgba(255,255,255,0.35)"/>
    </svg>
  );
}

// ─── Snack sprites (for snack panel) ─────────────────────────────────────────
function SnackSprite({ id, size=3 }: { id:string; size?:number }) {
  const S = size;
  if (id === 'onigiri') return (
    <svg width={36*S} height={34*S} viewBox="0 0 36 34" shapeRendering="crispEdges" style={{ display:'block' }}>
      <polygon points="18,2 2,30 34,30" fill="#e8e0c4"/>
      <polygon points="18,4 4,28 32,28" fill="#f4ecdc"/>
      {/* Plastic wrap reflections */}
      <polygon points="18,4 6,24 12,24" fill="rgba(255,255,255,0.12)"/>
      <rect x="2"  y="25" width="32" height="5" fill="#14180e"/>
      <rect x="3"  y="25" width="30" height="1" fill="#1e2818" opacity="0.5"/>
      {/* Nori texture */}
      <rect x="5"  y="26" width="2"  height="2" fill="#0e1608" opacity="0.5"/>
      <rect x="12" y="26" width="2"  height="2" fill="#0e1608" opacity="0.5"/>
      <rect x="20" y="26" width="2"  height="2" fill="#0e1608" opacity="0.5"/>
      <rect x="27" y="26" width="2"  height="2" fill="#0e1608" opacity="0.5"/>
      {/* Tuna mayo filling */}
      <rect x="14" y="11" width="5"  height="5" fill="#e84828" opacity="0.8"/>
      <rect x="15" y="8"  width="3"  height="3" fill="#e84828" opacity="0.5"/>
      <rect x="8"  y="6"  width="3"  height="1" fill="#fffae8" opacity="0.6"/>
    </svg>
  );
  if (id === 'chips') return (
    <svg width={28*S} height={34*S} viewBox="0 0 28 34" shapeRendering="crispEdges" style={{ display:'block' }}>
      <rect x="5"  y="0"  width="18" height="3"  fill="#e8c820"/>
      <rect x="2"  y="3"  width="24" height="28" fill="#e8c820"/>
      <rect x="0"  y="3"  width="28" height="4"  fill="#dd1818"/>
      <rect x="0"  y="27" width="28" height="4"  fill="#dd1818"/>
      <rect x="3"  y="10" width="22" height="2"  fill="rgba(255,255,255,0.25)"/>
      <rect x="3"  y="14" width="14" height="1.5" fill="rgba(255,255,255,0.18)"/>
      <rect x="3"  y="19" width="18" height="1.5" fill="rgba(255,255,255,0.15)"/>
      <rect x="2.5" y="3" width="4"  height="28" fill="rgba(255,255,255,0.12)"/>
      <rect x="5"  y="31" width="18" height="3"  fill="#e8c820"/>
      {/* Chip illustrations on bag */}
      <rect x="8"  y="12" width="12" height="8"  fill="#dd9900" opacity="0.35"/>
      <rect x="9"  y="13" width="4"  height="3"  fill="#f8b800" opacity="0.5"/>
    </svg>
  );
  if (id === 'mochi') return (
    <svg width={32*S} height={28*S} viewBox="0 0 32 28" shapeRendering="crispEdges" style={{ display:'block' }}>
      <rect x="4"  y="6"  width="24" height="18" fill="#f4f0ec"/>
      <rect x="2"  y="8"  width="28" height="14" fill="#f8f4f0"/>
      <rect x="6"  y="4"  width="20" height="20" fill="#f8f4f0"/>
      <rect x="8"  y="2"  width="16" height="24" fill="#f8f4f0"/>
      <rect x="10" y="10" width="12" height="8"  fill="#f4d0d8"/>
      <rect x="12" y="8"  width="8"  height="12" fill="#f4d0d8"/>
      <rect x="6"  y="4"  width="3"  height="5"  fill="rgba(255,255,255,0.5)"/>
      <rect x="14" y="12" width="4"  height="4"  fill="#e85888" opacity="0.6"/>
    </svg>
  );
  if (id === 'taiyaki') return (
    <svg width={38*S} height={28*S} viewBox="0 0 38 28" shapeRendering="crispEdges" style={{ display:'block' }}>
      <rect x="2"  y="8"  width="26" height="12" fill="#c87828"/>
      <rect x="6"  y="6"  width="18" height="16" fill="#d48830"/>
      <rect x="10" y="4"  width="12" height="20" fill="#d88830"/>
      <rect x="24" y="6"  width="8"  height="5"  fill="#c87828"/>
      <rect x="28" y="10" width="8"  height="5"  fill="#c87828"/>
      <rect x="26" y="8"  width="6"  height="6"  fill="#c07020"/>
      <rect x="4"  y="4"  width="6"  height="4"  fill="#c87828"/>
      <rect x="8"  y="8"  width="1"  height="12" fill="#a05818" opacity="0.6"/>
      <rect x="14" y="7"  width="1"  height="14" fill="#a05818" opacity="0.5"/>
      <rect x="20" y="8"  width="1"  height="12" fill="#a05818" opacity="0.45"/>
      <rect x="5"  y="10" width="3"  height="3"  fill="#1a1a14"/>
      <rect x="6"  y="10" width="1"  height="1"  fill="#888" opacity="0.6"/>
      <rect x="4"  y="6"  width="3"  height="8"  fill="rgba(255,255,255,0.14)"/>
      <rect x="12" y="11" width="6"  height="6"  fill="#f8d060" opacity="0.6"/>
    </svg>
  );
  return null;
}

// ─── PanelBg shell ────────────────────────────────────────────────────────────
function PanelBg({ title, sub, onClose, children }: {
  title:string; sub:string; onClose:()=>void; children: React.ReactNode;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center"
      style={{ background:'rgba(2,4,8,0.88)', backdropFilter:'blur(3px)' }}
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y:18, scale:.95 }} animate={{ y:0, scale:1 }} exit={{ y:18, scale:.95 }}
        transition={{ duration:.22 }}
        onClick={e=>e.stopPropagation()}
        style={{ background:'#040c10', border:'2px solid #1a3a3a', maxWidth:720, width:'94%', maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column' }}
      >
        <div style={{ background:'#061418', borderBottom:'1.5px solid #1a3a3a', padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ ...PX, fontSize:10, color:'#00ff88', letterSpacing:'0.18em' }}>{title}</div>
            <div style={{ fontFamily:'monospace', fontSize:8, color:'#2a8a5a', marginTop:3, letterSpacing:'0.25em' }}>{sub}</div>
          </div>
          <button className="kb-btn" onClick={onClose} style={{ ...PX, fontSize:8, color:'#00ff88', background:'transparent', border:'1.5px solid #1a4a2a', padding:'5px 10px', cursor:'pointer', letterSpacing:'0.1em' }}>
            ✕ BACK
          </button>
        </div>
        <div style={{ overflowY:'auto', flex:1, padding:'18px' }}>
          {children}
        </div>
        <div style={{ padding:'5px 14px 7px', borderTop:'1px solid rgba(0,255,136,0.06)', textAlign:'center' }}>
          <span style={{ ...PX, fontSize:5, color:'rgba(0,200,100,0.25)', letterSpacing:'0.08em' }}>
            CLICK OUTSIDE OR ✕ TO CLOSE  •  BACKSPACE EXIT
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Fridge panel ─────────────────────────────────────────────────────────────
function FridgePanel({ onClose, onAdd, cartCounts }: {
  onClose:()=>void;
  onAdd:(id:string)=>void;
  cartCounts: Record<string,number>;
}) {
  const [justAdded, setJustAdded] = useState<string|null>(null);
  const puffs = useMemo(()=>Array.from({length:16},(_,i)=>({id:i,x:4+(i%8)*12.5,delay:i*0.14,dur:1.8+(i%4)*0.4,sz:10+(i%5)*4})),[]);

  const handleAdd = (id:string) => {
    onAdd(id);
    setJustAdded(id);
    setTimeout(()=>setJustAdded(null), 950);
  };

  return (
    <PanelBg title="冷蔵コーナー" sub="DRINKS FRIDGE — ADD TO BASKET" onClose={onClose}>
      <div style={{ position:'relative', height:44, overflow:'hidden', marginBottom:14, background:'#020810', border:'1px solid #0a2a3a' }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(80,160,255,0.08),transparent)' }}/>
        {puffs.map(p=>(
          <div key={p.id} style={{ position:'absolute', bottom:0, left:`${p.x}%`, width:p.sz, height:p.sz, borderRadius:'50%', background:'rgba(140,200,255,0.55)', filter:'blur(4px)', animation:`kColdPuff ${p.dur}s ease-out infinite`, animationDelay:`${p.delay}s` }}/>
        ))}
        <div style={{ position:'absolute', bottom:8, left:12, ...PX, fontSize:6, color:'#4488cc', letterSpacing:'0.12em' }}>❄  3°C — OPEN DOOR</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {DRINKS.map(d=>(
          <motion.div key={d.id} whileHover={{ y:-3, boxShadow:`0 8px 24px ${d.bg}44` }}
            style={{ background:'#040e14', border:`2px solid ${justAdded===d.id?d.bg:'#1a2a3a'}`, padding:'14px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, transition:'border-color .25s' }}>
            <BigCan drink={d} />
            <div style={{ ...PX, fontSize:7, color:d.mid, letterSpacing:'0.08em', marginTop:2 }}>{d.jp}</div>
            <div style={{ fontFamily:'monospace', fontSize:7, color:'#4a8a6a', letterSpacing:'0.12em' }}>{d.name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, width:'100%', justifyContent:'center' }}>
              <div style={{ fontFamily:'monospace', fontSize:8, color:'#00cc66' }}>{d.price}</div>
              {(cartCounts[d.id]||0) > 0 && (
                <div style={{ ...PX, fontSize:6, color:d.mid, background:`${d.bg}22`, border:`1px solid ${d.bg}66`, padding:'1px 5px' }}>×{cartCounts[d.id]}</div>
              )}
            </div>
            <button className="kb-add" onClick={()=>handleAdd(d.id)}
              style={{ ...PX, fontSize:6.5, color: justAdded===d.id ? '#00ff88' : '#00ccaa', background:'#041618', border:`1.5px solid ${justAdded===d.id?'#00ff88':'#1a4a3a'}`, padding:'5px 10px', cursor:'pointer', letterSpacing:'0.08em', width:'100%', transition:'all .2s' }}>
              {justAdded===d.id ? '✓ ADDED!' : '+ BASKET'}
            </button>
          </motion.div>
        ))}
      </div>
    </PanelBg>
  );
}

// ─── Magazine panel ───────────────────────────────────────────────────────────
function MagazinePanel({ onClose }: { onClose:()=>void }) {
  const [active, setActive] = useState(0);
  const mag = MAGS[active];
  const ISSUE_LINES: Record<string, string[]> = {
    gaming:  ['▶ TOP 50 RETRO GAMES OF 2086','▶ EXCLUSIVE HARDWARE LEAKS','▶ FAMICOM COLLECTOR\'S GUIDE'],
    fashion: ['▶ HARAJUKU STREET SNAPS','▶ CYBER-LOLITA SPRING LOOKS','▶ THRIFT SPOTS: SHIMOKITAZAWA'],
    music:   ['▶ CITY POP REVIVAL SPECIAL','▶ INTERVIEW: YORU COLLECTIVE','▶ LIVE GUIDE: SHIBUYA VENUES'],
    manga:   ['▶ STEEL PHANTOM CH.88 REVIEW','▶ NEW SERIES: NEON SAMURAI','▶ ARTIST SPOTLIGHT: TRIBUTE'],
    tech:    ['▶ AI COMPOSERS REVIEWED','▶ QUANTUM PC BUILD GUIDE','▶ TOKYO\'S HIDDEN ARCADES'],
  };
  return (
    <PanelBg title="雑誌コーナー" sub="MAGAZINE RACK — BROWSE SELECTION" onClose={onClose}>
      <div style={{ display:'flex', gap:16, minHeight:300 }}>
        {/* Thumbnail sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, width:68, flexShrink:0 }}>
          {MAGS.map((m,i)=>(
            <motion.div key={m.id} whileHover={{ x:4 }} onClick={()=>setActive(i)}
              style={{ cursor:'pointer', opacity:i===active?1:0.42, border:i===active?`2px solid ${m.accent}`:'2px solid transparent', transition:'opacity .18s', flexShrink:0 }}>
              <MagCoverSVG mag={m} w={64} h={85}/>
            </motion.div>
          ))}
        </div>

        {/* Main: big cover + info */}
        <div style={{ flex:1, display:'flex', gap:20, alignItems:'flex-start', minWidth:0 }}>
          {/* Big cover with frame */}
          <motion.div key={mag.id}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:.22 }}
            style={{ flexShrink:0, border:`2px solid ${mag.trim}`, boxShadow:`0 0 28px ${mag.accent}33, 0 4px 20px rgba(0,0,0,0.7)` }}>
            <MagCoverSVG mag={mag} w={210} h={280}/>
          </motion.div>

          {/* Info panel */}
          <div style={{ flex:1, minWidth:0, paddingTop:6 }}>
            <div style={{ ...PX, fontSize:11, color:mag.accent, textShadow:`0 0 18px ${mag.accent}99`, marginBottom:6, wordBreak:'break-word', lineHeight:1.5 }}>
              {mag.title}
            </div>
            <div style={{ fontFamily:'monospace', fontSize:9, color:'#4a8a6a', letterSpacing:'0.2em', marginBottom:16, textTransform:'uppercase' }}>
              {mag.line1} {mag.line2}
            </div>
            <div style={{ background:'#020a0a', border:'1px solid #0a2a1a', padding:'12px 14px', marginBottom:14 }}>
              <div style={{ ...PX, fontSize:6, color:'#2a7a4a', marginBottom:10, letterSpacing:'0.12em' }}>THIS ISSUE</div>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {(ISSUE_LINES[mag.id]||[]).map((line,i)=>(
                  <div key={i} style={{ fontFamily:'monospace', fontSize:8, color:'#88ccaa', letterSpacing:'0.06em' }}>{line}</div>
                ))}
              </div>
            </div>
            <motion.div animate={{ opacity:[0.45,1,0.45] }} transition={{ duration:3.5, repeat:Infinity }}>
              <div style={{ fontFamily:'monospace', fontSize:8, color:'#2a6a4a', letterSpacing:'0.12em' }}>
                you flip through the pages quietly...
              </div>
              <div style={{ fontFamily:'monospace', fontSize:7, color:'#1a4a30', marginTop:4, letterSpacing:'0.08em' }}>
                東京の夜  —  tokyo no yoru
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PanelBg>
  );
}

// ─── Snack panel ──────────────────────────────────────────────────────────────
function SnackPanel({ onClose, onAdd, cartCounts }: {
  onClose:()=>void;
  onAdd:(id:string)=>void;
  cartCounts: Record<string,number>;
}) {
  const [justAdded, setJustAdded] = useState<string|null>(null);

  const handleAdd = (id:string) => {
    onAdd(id);
    setJustAdded(id);
    setTimeout(()=>setJustAdded(null), 950);
  };

  return (
    <PanelBg title="スナックコーナー" sub="SNACK SHELF — ADD TO BASKET" onClose={onClose}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {SNACKS.map(s=>(
          <motion.div key={s.id} whileHover={{ y:-3, boxShadow:'0 8px 24px rgba(0,200,80,0.15)' }}
            style={{ background:'#040c08', border:`1.5px solid ${justAdded===s.id?'#00ff88':'#1a3a1a'}`, padding:'14px', position:'relative', overflow:'hidden', transition:'border-color .25s' }}>
            <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
              <div style={{ flexShrink:0 }}><SnackSprite id={s.id} size={2}/></div>
              <div>
                <div style={{ ...PX, fontSize:8, color:'#00dd66', marginBottom:4 }}>{s.jp}</div>
                <div style={{ fontFamily:'monospace', fontSize:8, color:'#5aaa7a', letterSpacing:'0.1em' }}>{s.name}</div>
                <div style={{ fontFamily:'monospace', fontSize:7, color:'#3a7a5a', letterSpacing:'0.12em' }}>{s.sub}</div>
                <div style={{ fontFamily:'monospace', fontSize:9, color:'#00cc55', marginTop:6 }}>{s.price}</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              {(cartCounts[s.id]||0) > 0
                ? <div style={{ ...PX, fontSize:6, color:'#00aa44', background:'#001a0a', border:'1px solid #00663a', padding:'2px 7px' }}>×{cartCounts[s.id]} IN BASKET</div>
                : <div/>
              }
              <button className="kb-add" onClick={()=>handleAdd(s.id)}
                style={{ ...PX, fontSize:6.5, color:justAdded===s.id?'#00ff88':'#00ccaa', background:'#040e08', border:`1.5px solid ${justAdded===s.id?'#00ff88':'#1a4a2a'}`, padding:'5px 10px', cursor:'pointer', letterSpacing:'0.08em', transition:'all .2s' }}>
                {justAdded===s.id ? '✓ ADDED!' : '+ BASKET'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </PanelBg>
  );
}

// ─── Basket panel ─────────────────────────────────────────────────────────────
type CartItem = { kind:'drink'|'snack'; id:string };

function getItemPrice(item: CartItem): number {
  if (item.kind==='drink') {
    const d = DRINKS.find(d=>d.id===item.id);
    return d ? parseInt(d.price.replace('¥','')) : 0;
  }
  const s = SNACKS.find(s=>s.id===item.id);
  return s ? parseInt(s.price.replace('¥','')) : 0;
}

function getItemLabel(item: CartItem): { jp:string; name:string; sub?:string; color:string } {
  if (item.kind==='drink') {
    const d = DRINKS.find(d=>d.id===item.id) || DRINKS[0];
    return { jp:d.jp, name:d.name, color:d.mid };
  }
  const s = SNACKS.find(s=>s.id===item.id) || SNACKS[0];
  return { jp:s.jp, name:s.name, sub:s.sub, color:'#00dd66' };
}

function BasketPanel({ cart, onRemove, onCheckout, onClose }: {
  cart: CartItem[];
  onRemove:(idx:number)=>void;
  onCheckout:()=>void;
  onClose:()=>void;
}) {
  const total = cart.reduce((s,i)=>s+getItemPrice(i), 0);
  const isEmpty = cart.length === 0;

  return (
    <PanelBg title="バスケット" sub={`SHOPPING BASKET — ${cart.length} ITEM${cart.length!==1?'S':''}`} onClose={onClose}>
      {isEmpty ? (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          {/* Pixel basket icon */}
          <svg width="48" height="44" viewBox="0 0 48 44" shapeRendering="crispEdges" style={{ display:'block', margin:'0 auto 16px' }}>
            <rect x="4"  y="20" width="40" height="24" fill="#0a1a0e"/>
            <rect x="6"  y="20" width="36" height="24" fill="#0c2014" stroke="#1a4a2a" strokeWidth="1.5"/>
            <rect x="8"  y="22" width="4"  height="18" fill="#143018" opacity="0.6"/>
            <rect x="16" y="22" width="4"  height="18" fill="#143018" opacity="0.6"/>
            <rect x="24" y="22" width="4"  height="18" fill="#143018" opacity="0.6"/>
            <rect x="32" y="22" width="4"  height="18" fill="#143018" opacity="0.6"/>
            <path d="M14,20 Q10,6 24,4 Q38,6 34,20" fill="none" stroke="#1a4a2a" strokeWidth="2.5"/>
          </svg>
          <div style={{ ...PX, fontSize:8, color:'#2a5a3a', letterSpacing:'0.15em' }}>BASKET IS EMPTY</div>
          <div style={{ fontFamily:'monospace', fontSize:7, color:'#1a3a2a', marginTop:8, letterSpacing:'0.1em' }}>browse the shelves to add items</div>
        </div>
      ) : (
        <>
          {/* Item list */}
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:18 }}>
            {cart.map((item,idx)=>{
              const label = getItemLabel(item);
              const price = getItemPrice(item);
              return (
                <motion.div key={idx} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:idx*0.04 }}
                  style={{ display:'flex', alignItems:'center', gap:12, background:'#040c08', border:'1px solid #1a3a1a', padding:'10px 14px' }}>
                  {/* Mini sprite */}
                  <div style={{ width:24, height:24, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {item.kind==='drink' ? (
                      <svg width="16" height="28" viewBox="0 0 6 12" shapeRendering="crispEdges">
                        <rect x="0" y="2" width="6" height="10" fill={DRINKS.find(d=>d.id===item.id)?.bg||'#888'}/>
                        <rect x="0.5" y="0" width="5" height="2.5" fill={DRINKS.find(d=>d.id===item.id)?.cap||'#555'}/>
                        <rect x="0" y="2" width="1.2" height="10" fill="rgba(255,255,255,0.2)"/>
                      </svg>
                    ) : (
                      <div style={{ transform:'scale(0.7)', transformOrigin:'top left', width:24, height:24, overflow:'hidden' }}>
                        <SnackSprite id={item.id} size={1}/>
                      </div>
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ ...PX, fontSize:7, color:label.color, letterSpacing:'0.06em' }}>{label.jp}</div>
                    <div style={{ fontFamily:'monospace', fontSize:7, color:'#4a7a5a', marginTop:2 }}>
                      {label.name}{label.sub ? ` · ${label.sub}` : ''}
                    </div>
                  </div>
                  <div style={{ fontFamily:'monospace', fontSize:9, color:'#00cc66', flexShrink:0 }}>¥{price}</div>
                  <button onClick={()=>onRemove(idx)}
                    style={{ ...PX, fontSize:6, color:'#cc4444', background:'transparent', border:'1px solid #3a1a1a', padding:'3px 7px', cursor:'pointer', flexShrink:0 }}>✕</button>
                </motion.div>
              );
            })}
          </div>

          {/* Total + checkout */}
          <div style={{ borderTop:'1.5px solid #1a3a1a', paddingTop:16, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
            <div>
              <div style={{ fontFamily:'monospace', fontSize:7, color:'#2a5a3a', letterSpacing:'0.15em', marginBottom:4 }}>TOTAL</div>
              <div style={{ ...PX, fontSize:18, color:'#00ff88', textShadow:'0 0 16px #00ff8866' }}>¥{total}</div>
              <div style={{ fontFamily:'monospace', fontSize:7, color:'#2a4a3a', marginTop:4 }}>{cart.length} item{cart.length!==1?'s':''} · tax incl.</div>
            </div>
            <motion.button whileHover={{ scale:1.04, boxShadow:'0 0 24px rgba(0,255,136,0.5)' }} whileTap={{ scale:.97 }}
              onClick={onCheckout}
              style={{ ...PX, fontSize:9, color:'#000', background:'#00ff88', border:'none', padding:'14px 28px', cursor:'pointer', letterSpacing:'0.1em', textShadow:'none', flexShrink:0 }}>
              CHECKOUT →
            </motion.button>
          </div>
        </>
      )}
    </PanelBg>
  );
}

// ─── Checkout panel ────────────────────────────────────────────────────────────
function CheckoutPanel({ items, onDone }: { items:CartItem[]; onDone:()=>void }) {
  const [phase, setPhase] = useState<'receipt'|'paying'|'consume'>('receipt');
  const [consumed, setConsumed] = useState<Set<number>>(new Set());
  const [animating, setAnimating] = useState<number|null>(null);

  const total = items.reduce((s,i)=>s+getItemPrice(i), 0);

  const handlePay = () => {
    setPhase('paying');
    setTimeout(()=>setPhase('consume'), 1400);
  };

  const handleConsume = (idx:number) => {
    if (consumed.has(idx) || animating !== null) return;
    setAnimating(idx);
    setTimeout(()=>{
      setConsumed(prev=>new Set([...prev,idx]));
      setAnimating(null);
    }, 1500);
  };

  const allDone = consumed.size === items.length;

  return (
    <PanelBg
      title={phase==='consume' ? 'おいしい！' : 'レジ'}
      sub={phase==='consume' ? 'CONSUME YOUR ITEMS' : 'CHECKOUT — PLEASE PAY'}
      onClose={phase === 'paying' ? ()=>{} : onDone}
    >
      {phase === 'receipt' && (
        <div style={{ animation:'kReceiptIn .35s ease-out' }}>
          {/* Receipt paper */}
          <div style={{ background:'#0a1a0a', border:'1px solid #1a4a1a', padding:'18px 20px', maxWidth:460, margin:'0 auto', fontFamily:'monospace' }}>
            <div style={{ textAlign:'center', borderBottom:'1px dashed #1a3a1a', paddingBottom:12, marginBottom:12 }}>
              <div style={{ ...PX, fontSize:8, color:'#00ff88', letterSpacing:'0.18em' }}>TOKYO KONBINI</div>
              <div style={{ fontSize:7, color:'#2a5a3a', marginTop:6, letterSpacing:'0.12em' }}>24H / ALWAYS OPEN</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
              {items.map((item,i)=>{
                const label = getItemLabel(item);
                const price = getItemPrice(item);
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                    <div style={{ fontSize:8, color:'#5aaa7a', letterSpacing:'0.06em' }}>{label.jp} {label.name}</div>
                    <div style={{ fontSize:9, color:'#00cc66', letterSpacing:'0.08em' }}>¥{price}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop:'1px dashed #1a3a1a', paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <div style={{ fontSize:8, color:'#3a7a4a', letterSpacing:'0.12em' }}>TOTAL</div>
              <div style={{ ...PX, fontSize:12, color:'#00ff88' }}>¥{total}</div>
            </div>
            <div style={{ textAlign:'center', marginTop:14, borderTop:'1px dashed #1a3a1a', paddingTop:12 }}>
              <div style={{ fontSize:6, color:'#1a4a2a', letterSpacing:'0.1em' }}>ありがとうございました</div>
              <div style={{ fontSize:6, color:'#1a3a1a', marginTop:3 }}>THANK YOU FOR YOUR PURCHASE</div>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'center', marginTop:18 }}>
            <motion.button whileHover={{ scale:1.05, boxShadow:'0 0 28px rgba(0,255,136,0.55)' }} whileTap={{ scale:.97 }}
              onClick={handlePay}
              style={{ ...PX, fontSize:10, color:'#000', background:'#00ff88', border:'none', padding:'14px 36px', cursor:'pointer', letterSpacing:'0.1em' }}>
              PAY ¥{total}
            </motion.button>
          </div>
        </div>
      )}

      {phase === 'paying' && (
        <div style={{ textAlign:'center', padding:'48px 0', animation:'kPayFlash 0.7s ease-in-out infinite' }}>
          <motion.div animate={{ scale:[1,1.2,1], opacity:[0.7,1,0.7] }} transition={{ duration:.6, repeat:Infinity }}>
            <div style={{ ...PX, fontSize:14, color:'#00ff88', letterSpacing:'0.15em', textShadow:'0 0 24px #00ff88' }}>PROCESSING</div>
          </motion.div>
          <div style={{ fontFamily:'monospace', fontSize:8, color:'#2a7a4a', marginTop:12, letterSpacing:'0.12em' }}>お支払い中...</div>
        </div>
      )}

      {phase === 'consume' && (
        <div>
          <div style={{ ...PX, fontSize:7, color:'#2a7a4a', letterSpacing:'0.15em', marginBottom:14, textAlign:'center' }}>
            — EAT & DRINK YOUR ITEMS —
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:12 }}>
            {items.map((item,idx)=>{
              const label = getItemLabel(item);
              const isConsumed = consumed.has(idx);
              const isAnimating = animating === idx;
              return (
                <motion.div key={idx}
                  style={{ background: isConsumed ? '#020e06' : '#040c08', border:`1.5px solid ${isConsumed?'#006622':isAnimating?'#00ff88':'#1a3a1a'}`, padding:'14px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, position:'relative', overflow:'hidden', minHeight:140, transition:'border-color .3s, background .3s' }}>
                  <AnimatePresence mode="wait">
                    {isAnimating ? (
                      <motion.div key="anim" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        style={{ position:'absolute', inset:0, background:'rgba(2,14,6,0.95)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                        {item.kind==='snack' ? (
                          <motion.div animate={{ scale:[1,1.5,0.8,1.3,0], rotate:[0,14,-10,6,0] }} transition={{ duration:1.3, ease:'easeInOut' }}>
                            <SnackSprite id={item.id} size={3}/>
                          </motion.div>
                        ) : (
                          <motion.svg width="32" height="56" viewBox="0 0 6 12" shapeRendering="crispEdges"
                            animate={{ y:[0,-8,-4,-12,0], opacity:[1,1,0.8,0.4,0] }} transition={{ duration:1.2 }}>
                            <rect x="0" y="2" width="6" height="10" fill={DRINKS.find(d=>d.id===item.id)?.bg||'#888'}/>
                            <rect x="0.5" y="0" width="5" height="2.5" fill={DRINKS.find(d=>d.id===item.id)?.cap||'#555'}/>
                          </motion.svg>
                        )}
                        <div style={{ ...PX, fontSize:7, color:'#00ff88' }}>
                          {item.kind==='snack' ? 'おいしい！' : 'ごくごく！'}
                        </div>
                      </motion.div>
                    ) : isConsumed ? (
                      <motion.div key="done" initial={{ opacity:0, scale:.8 }} animate={{ opacity:1, scale:1 }}
                        style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                        <div style={{ ...PX, fontSize:9, color:'#00cc44' }}>✓</div>
                        <div style={{ ...PX, fontSize:7, color:'#00aa44' }}>{label.jp}</div>
                        <div style={{ fontFamily:'monospace', fontSize:7, color:'#2a6a3a' }}>
                          {item.kind==='snack' ? 'DELICIOUS!' : 'REFRESHING!'}
                        </div>
                        <div style={{ fontFamily:'monospace', fontSize:7, color:'#1a4a2a' }}>+1 HP ✓</div>
                      </motion.div>
                    ) : (
                      <motion.div key="idle" style={{ display:'contents' }}>
                        <div style={{ ...PX, fontSize:7, color:label.color, marginBottom:2 }}>{label.jp}</div>
                        <div style={{ fontFamily:'monospace', fontSize:7, color:'#4a7a5a' }}>{label.name}</div>
                        {label.sub && <div style={{ fontFamily:'monospace', fontSize:6, color:'#3a6a4a' }}>{label.sub}</div>}
                        <motion.button whileHover={{ scale:1.06 }} whileTap={{ scale:.95 }}
                          onClick={()=>handleConsume(idx)}
                          style={{ ...PX, fontSize:7, color:'#000', background:'#00ff88', border:'none', padding:'7px 14px', cursor:'pointer', marginTop:4, letterSpacing:'0.06em' }}>
                          {item.kind==='snack' ? 'EAT' : 'DRINK'}
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
          {allDone && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', marginTop:18 }}>
              <div style={{ fontFamily:'monospace', fontSize:8, color:'#00cc66', marginBottom:14, letterSpacing:'0.12em' }}>ごちそうさまでした — itadakimasu!</div>
              <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:.97 }}
                onClick={onDone}
                style={{ ...PX, fontSize:8, color:'#00ff88', background:'transparent', border:'2px solid #00ff88', padding:'10px 24px', cursor:'pointer', letterSpacing:'0.1em' }}>
                ← BACK TO STORE
              </motion.button>
            </motion.div>
          )}
        </div>
      )}
    </PanelBg>
  );
}

// ─── Window panel ─────────────────────────────────────────────────────────────
function WindowPanel({ character, onClose }: { character:{ style:string; hair:string; hairColor:string; gender:string; skin:string }; onClose:()=>void }) {
  return (
    <motion.div className="absolute inset-0 z-30 flex items-center justify-center"
      style={{ background:'rgba(0,3,8,0.9)', backdropFilter:'blur(5px)' }}
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}>
      <motion.div initial={{ scale:.94 }} animate={{ scale:1 }} exit={{ scale:.94 }}
        onClick={e=>e.stopPropagation()}
        style={{ background:'#020810', border:'2px solid #0e2030', maxWidth:560, width:'92%' }}>
        <div style={{ background:'#030c18', borderBottom:'1.5px solid #0e2030', padding:'11px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ ...PX, fontSize:9, color:'#4488aa' }}>店の窓</div>
            <div style={{ fontFamily:'monospace', fontSize:7, color:'#224455', marginTop:2, letterSpacing:'0.2em' }}>STORE WINDOW — RAINY NIGHT</div>
          </div>
          <button className="kb-btn" onClick={onClose} style={{ ...PX, fontSize:7, color:'#4488aa', background:'transparent', border:'1px solid #0e2030', padding:'5px 9px', cursor:'pointer' }}>✕ BACK</button>
        </div>
        <div style={{ margin:18, position:'relative', border:'6px solid #1a2830', overflow:'hidden', height:280, background:'#020508' }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,#020406 0%,#040818 50%,#03060e 100%)' }}/>
          {Array.from({length:36}).map((_,i)=>(
            <motion.div key={i} animate={{ y:['-5%','105%'], opacity:[0,.55,.35,0] }}
              transition={{ duration:.55+(i%5)*.12, repeat:Infinity, delay:(i*.07)%.65, ease:'linear' }}
              style={{ position:'absolute', top:0, left:`${(i*7.4)%100}%`, width:1, height:`${7+(i%4)*4}%`, background:'rgba(120,170,210,0.45)', borderRadius:1 }}/>
          ))}
          <motion.div animate={{ opacity:[.25,.42,.25] }} transition={{ duration:3, repeat:Infinity }}
            style={{ position:'absolute', bottom:0, left:0, right:0, height:'40%', background:'linear-gradient(to top,rgba(255,180,50,0.22),rgba(255,80,140,0.08),transparent)' }}/>
          {['#ff4488','#4488ff','#00cc88'].map((c,i)=>(
            <motion.div key={i} animate={{ opacity:[.15,.3,.15] }} transition={{ duration:2.5+i*.7, repeat:Infinity, delay:i*.8 }}
              style={{ position:'absolute', bottom:`${25+i*15}%`, left:`${15+i*22}%`, width:40+i*12, height:2.5, background:c, filter:'blur(3px)' }}/>
          ))}
          <div style={{ position:'absolute', top:0, bottom:0, left:'50%', width:6, background:'#1a2830', transform:'translateX(-50%)', zIndex:2 }}/>
          <div style={{ position:'absolute', left:0, right:0, top:'43%', height:6, background:'#1a2830', zIndex:2 }}/>
          <div style={{ position:'absolute', bottom:0, left:'30%', opacity:.2, filter:'brightness(.3) saturate(.4)', zIndex:1 }}>
            <PixelCharacter {...character} scale={5}/>
          </div>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(125deg,rgba(255,255,255,0.04) 0%,transparent 55%)', pointerEvents:'none', zIndex:3 }}/>
        </div>
        <motion.div animate={{ opacity:[.4,1,.4] }} transition={{ duration:3, repeat:Infinity }}
          style={{ padding:'10px 18px 16px', textAlign:'center' }}>
          <div style={{ fontFamily:'monospace', fontSize:8, color:'#2a4455', letterSpacing:'0.25em' }}>. . . just you, the rain, and the hum of the lights . . .</div>
          <div style={{ fontFamily:'monospace', fontSize:7, color:'#1a3040', marginTop:5, letterSpacing:'0.15em' }}>東京の夜  —  tokyo no yoru</div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── NeonTube helper ──────────────────────────────────────────────────────────
function NeonTube({ x, y, w, col='#00ff88', anim='kNeonPulse' }:
  { x:number; y:number; w:number; col?:string; anim?:string }) {
  return (
    <g>
      <rect x={x-2} y={y-2} width={w+4} height="5"   fill={col} opacity="0.05"/>
      <rect x={x}   y={y}   width={w}   height="2.5"  fill={col} opacity="0.16"/>
      <rect x={x}   y={y+0.5} width={w} height="1.5"  fill={col} opacity="0.88"
        style={{ animation:`${anim} 4s ease-in-out infinite` }}/>
    </g>
  );
}

// ─── Room SVG ─────────────────────────────────────────────────────────────────
function KonbiniRoom() {
  const rng1 = useMemo(()=>seededRng(4021),[]);
  const rng2 = useMemo(()=>seededRng(7744),[]);

  // Back-wall shelf item data
  const row1 = useMemo(()=>Array.from({length:10},(_,i)=>({ type: i%3, x: 61+i*21 })),[]);
  const row2 = useMemo(()=>{
    const cols = [
      ['#c82020','#901010'],['#ff7800','#c05800'],['#22aa44','#147028'],
      ['#e8cc00','#b09800'],['#2244cc','#0e2890'],['#aa2288','#701460'],
      ['#cc5500','#8a3400'],['#0080cc','#005090'],['#cc0088','#880058'],
    ];
    return Array.from({length:9},(_,i)=>({ color:cols[i%cols.length][0], cap:cols[i%cols.length][1], x:60+i*23 }));
  },[]);
  const row3 = useMemo(()=>{
    const cans = [
      {bg:'#2a8840',cap:'#1a5828',mid:'#5ac870'},{bg:'#d87828',cap:'#b05018',mid:'#f0a050'},
      {bg:'#c02030',cap:'#881018',mid:'#e04060'},{bg:'#78bc00',cap:'#508000',mid:'#aaee20'},
      {bg:'#3878c8',cap:'#1a5090',mid:'#80b8ee'},{bg:'#c84878',cap:'#903058',mid:'#f088b0'},
      {bg:'#888800',cap:'#606000',mid:'#bbbb00'},{bg:'#008888',cap:'#005858',mid:'#00cccc'},
    ];
    return Array.from({length:8},(_,i)=>({ ...cans[i%cans.length], x:60+i*26 }));
  },[]);
  const row4 = useMemo(()=>{
    const bags = [
      {color:'#e8c820',accent:'#c83000'},{color:'#e85820',accent:'#1a6000'},
      {color:'#c82020',accent:'#ffcc00'},{color:'#2060d0',accent:'#ff8800'},
      {color:'#88aa00',accent:'#ff4400'},{color:'#8820a0',accent:'#ffee00'},
      {color:'#d84400',accent:'#002a60'},{color:'#1a7828',accent:'#ff6600'},
      {color:'#c0a000',accent:'#880000'},
    ];
    return Array.from({length:9},(_,i)=>({ ...bags[i%bags.length], x:60+i*23 }));
  },[]);

  // Fridge bottles (4 rows × 6 per row)
  const fridgeRows = useMemo(()=>[0,1,2,3].map(row=>(
    DRINKS.map((d,ci)=>({ bg:d.bg, cap:d.cap, x:271+ci*7.5, y:20+row*20 }))
  )),[]);

  return (
    <svg viewBox="0 0 320 180" width="100%" height="100%"
      shapeRendering="crispEdges" preserveAspectRatio="xMidYMid slice"
      style={{ position:'absolute', inset:0, display:'block' }}>

      <defs>
        <linearGradient id="kVignT" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#020a04" stopOpacity="0.5"/>
          <stop offset="18%" stopColor="#020a04" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="kVignB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="70%" stopColor="#020a04" stopOpacity="0"/>
          <stop offset="100%" stopColor="#020a04" stopOpacity="0.65"/>
        </linearGradient>
        <radialGradient id="kGreenBloom" cx="50%" cy="20%" r="50%">
          <stop offset="0%"  stopColor="#00ff88" stopOpacity="0.07"/>
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* ═══════════════════════════════════════════════════
          CEILING
      ═══════════════════════════════════════════════════ */}
      <rect width="320" height="14" fill="#040c06"/>

      {/* Three fluorescent tube fixtures */}
      {[28,118,208].map((lx,i)=>(
        <g key={i}>
          <rect x={lx}   y="1.5" width="74" height="9"   fill="#0a160c"/>
          {/* End caps */}
          <rect x={lx-2} y="1.5" width="4"  height="9"   fill="#7a9a7a"/>
          <rect x={lx+72} y="1.5" width="4" height="9"   fill="#7a9a7a"/>
          {/* Tube glow */}
          <rect x={lx+3} y="2.5" width="68" height="7"   fill="#f4fff4"
            style={{ animation: i===1 ? 'kNeonFlick 9s ease-in-out infinite' : `kNeonPulse ${4+i*0.6}s ease-in-out infinite ${i*1.8}s` }}/>
          {/* Ambient glow below */}
          <rect x={lx-6} y="0"   width="86" height="14"  fill="#ccffcc" opacity="0.04"/>
        </g>
      ))}

      {/* Ceiling neon trim strip */}
      <NeonTube x={54} y={12} w={212} col="#00ff88" anim="kNeonPulse"/>

      {/* ═══════════════════════════════════════════════════
          LEFT SIDE WALL
      ═══════════════════════════════════════════════════ */}
      <polygon points="0,14 54,14 54,108 0,128" fill="#070e08"/>
      <line x1="54" y1="14" x2="54" y2="108" stroke="#00ff88" strokeWidth="1.2" opacity="0.55"
        style={{ animation:'kNeonPulse 4.5s ease-in-out infinite' }}/>

      {/* ─── Window (upper left wall) ─── */}
      <rect x="4" y="17" width="44" height="42" fill="#0a1010"/>
      <rect x="4" y="17" width="44" height="42" fill="none" stroke="#3a5a4a" strokeWidth="1.5"/>
      {/* Night exterior through glass */}
      <rect x="5.5" y="18.5" width="41" height="39" fill="#020508"/>
      {/* Distant city lights */}
      {[8,14,20,26,34,38,42].map((wx,i)=>(
        <rect key={i} x={wx} y={20+i%4*4} width="1.5" height="1.5"
          fill={i%3===0?'#ffcc44':i%3===1?'#4488ff':'#ff8844'} opacity="0.55"/>
      ))}
      {/* Street glow reflection */}
      <rect x="5.5" y="45" width="41" height="12" fill="#ff8820" opacity="0.05"/>
      <rect x="5.5" y="50" width="41" height="7"  fill="#ff4488" opacity="0.04"/>
      {/* Rain streaks */}
      {[0,1,2,3,4,5].map(i=>(
        <rect key={i} x={8+i*7} y="19" width="1" height={8+i%4*4} fill="rgba(100,160,220,0.32)"
          style={{ animation:`kSteamUp ${0.55+i*.1}s ease-out infinite`, animationDelay:`${i*.13}s` }}/>
      ))}
      {/* Window crossbar */}
      <rect x="4" y="38" width="44" height="2" fill="#3a5a4a"/>
      <rect x="25" y="17" width="2" height="42" fill="#3a5a4a"/>
      {/* Glass condensation */}
      <rect x="5.5" y="18.5" width="6" height="38" fill="rgba(200,230,255,0.04)"/>
      {/* "OUTSIDE" label */}
      <rect x="5" y="56" width="44" height="3" fill="rgba(0,0,0,0.3)"/>

      {/* ─── Magazine rack (lower left wall, face-out display) ─── */}
      <rect x="3"  y="63" width="47" height="44" fill="#0c1208"/>
      <rect x="3"  y="63" width="47" height="44" fill="none" stroke="#3a5a30" strokeWidth="1"/>
      {/* Header */}
      <rect x="3"  y="63" width="47" height="6"  fill="#162814"/>
      <rect x="5"  y="64" width="43" height="4"  fill="#1a3018"/>
      {/* Wire shelf divider */}
      <rect x="4"  y="84" width="44" height="1.2" fill="#2a4820" opacity="0.7"/>
      {/* Bottom ledge */}
      <rect x="3"  y="104" width="47" height="3" fill="#1e3818"/>
      <rect x="4"  y="102" width="44" height="1" fill="#3a5a30" opacity="0.6"/>

      {/* ROW 1: three face-out magazine covers (y=70–83) */}
      {/* Gaming magazine */}
      <rect x="5"  y="70" width="13" height="13" fill="#c81818"/>
      <rect x="5"  y="70" width="13" height="3.5" fill="#ff4444" opacity="0.9"/>
      {/* Mini d-pad */}
      <rect x="7"  y="75" width="3"  height="5"   fill="#1a1a1a"/>
      <rect x="6"  y="77" width="5"  height="1.5" fill="#1a1a1a"/>
      {/* Buttons */}
      <rect x="12" y="75" width="1.5" height="1.5" fill="#e82020" opacity="0.9"/>
      <rect x="14" y="76" width="1.5" height="1.5" fill="#20a020" opacity="0.9"/>
      <rect x="12" y="78" width="1.5" height="1.5" fill="#2060e0" opacity="0.9"/>

      {/* Fashion magazine */}
      <rect x="20" y="70" width="14" height="13" fill="#c83470"/>
      <rect x="20" y="70" width="14" height="3.5" fill="#ff88bb" opacity="0.9"/>
      {/* Mini harajuku figure */}
      <rect x="25" y="74" width="4"  height="4"   fill="#f8d0a0"/>
      <rect x="24" y="72" width="6"  height="3"   fill="#aa2266"/>
      <rect x="23" y="74" width="2"  height="4"   fill="#aa2266"/>
      <rect x="29" y="74" width="2"  height="4"   fill="#aa2266"/>
      <rect x="24" y="77" width="6"  height="5"   fill="#ee88cc"/>
      <rect x="29" y="78" width="2"  height="2"   fill="#ffee44" opacity="0.85"/>

      {/* Music magazine */}
      <rect x="36" y="70" width="13" height="13" fill="#142888"/>
      <rect x="36" y="70" width="13" height="3.5" fill="#4488ff" opacity="0.9"/>
      {/* Music note */}
      <rect x="40" y="74" width="2"  height="5"   fill="#00ccff" opacity="0.9"/>
      <rect x="40" y="74" width="5"  height="2"   fill="#00ccff" opacity="0.9"/>
      <rect x="37" y="77" width="3"  height="2"   fill="#00ccff" opacity="0.7"/>
      <rect x="43" y="76" width="2"  height="4"   fill="#88ccff" opacity="0.8"/>
      <rect x="43" y="76" width="4"  height="2"   fill="#88ccff" opacity="0.8"/>

      {/* ROW 2: two face-out covers (y=85–99) */}
      {/* Manga magazine */}
      <rect x="5"  y="85" width="14" height="14" fill="#d85500"/>
      <rect x="5"  y="85" width="14" height="3.5" fill="#ff8800" opacity="0.9"/>
      {/* Speed lines */}
      <line x1="12" y1="89" x2="17" y2="98" stroke="#ffee00" strokeWidth="0.5" opacity="0.55"/>
      <line x1="12" y1="89" x2="18" y2="95" stroke="#ffee00" strokeWidth="0.5" opacity="0.45"/>
      <line x1="12" y1="89" x2="7"  y2="98" stroke="#ffee00" strokeWidth="0.5" opacity="0.55"/>
      <line x1="12" y1="89" x2="5"  y2="95" stroke="#ffee00" strokeWidth="0.5" opacity="0.45"/>
      {/* Manga face */}
      <rect x="9"  y="90" width="6"  height="7"   fill="#f0ddb0"/>
      <rect x="8"  y="89" width="8"  height="3"   fill="#1a1a1a"/>
      <rect x="8"  y="90" width="3"  height="4"   fill="#1a1a1a"/>
      <rect x="10" y="93" width="2"  height="3"   fill="#1a1a1a"/>
      <rect x="13" y="93" width="2"  height="3"   fill="#1a1a1a"/>
      {/* Action highlight */}
      <rect x="6"  y="89" width="4"  height="3"   fill="#ffee00" opacity="0.7" transform="rotate(-12,8,90)"/>

      {/* Tech magazine */}
      <rect x="21" y="85" width="14" height="14" fill="#081408"/>
      <rect x="21" y="85" width="14" height="3.5" fill="#00aa55" opacity="0.9"/>
      {/* Terminal window */}
      <rect x="23" y="90" width="10" height="7"   fill="#000e04"/>
      <rect x="23" y="90" width="10" height="2"   fill="#00aa55" opacity="0.2"/>
      <rect x="24" y="93" width="7"  height="0.8" fill="#00ff88" opacity="0.65"/>
      <rect x="24" y="94.5" width="5" height="0.8" fill="#00ff88" opacity="0.45"/>
      <rect x="24" y="96" width="6"  height="0.8" fill="#00ff88" opacity="0.55"/>

      {/* ═══════════════════════════════════════════════════
          BACK WALL + SHELVES
      ═══════════════════════════════════════════════════ */}
      <rect x="54" y="14" width="212" height="87" fill="#07100a"/>
      {/* Subtle plaster texture */}
      {[22,38,56,74].map(wy=>(
        <rect key={wy} x="54" y={wy} width="212" height="0.4" fill="#020608" opacity="0.8"/>
      ))}

      {/* "OPEN 24H" neon sign — prominent, center */}
      <rect x="142" y="15" width="52" height="12"  fill="#08100a"/>
      <rect x="142" y="15" width="52" height="12"  fill="none" stroke="#00ff88" strokeWidth="0.8" opacity="0.7"
        style={{ animation:'kNeonPulse 3s ease-in-out infinite' }}/>
      <rect x="144" y="16.5" width="48" height="9" fill="#00ff88" opacity="0.05"/>
      <text x="168" y="24" textAnchor="middle" fontFamily="'Press Start 2P',monospace" fontSize="5" fill="#00ff88" opacity="0.9"
        style={{ animation:'kNeonPulse 3s ease-in-out infinite' }}>OPEN 24H</text>

      {/* Mid-wall neon strip */}
      <rect x="56" y="54" width="208" height="0.8" fill="#00ff88" opacity="0.22"
        style={{ animation:'kNeonPulse2 5s ease-in-out infinite' }}/>

      {/* ── Shelf 1: Onigiri (y=17–30) ── */}
      {row1.map((item,i)=>(
        <PxOnigiri key={i} x={item.x} y={17} type={item.type}/>
      ))}
      <rect x="54" y="30" width="212" height="2.5" fill="#1a3018"/>
      <rect x="54" y="31.5" width="212" height="0.6" fill="#00ff88" opacity="0.2"/>
      {/* Shelf label */}
      <rect x="54" y="31.5" width="212" height="5" fill="#060e08"/>
      <text x="60" y="35.5" fontFamily="monospace" fontSize="3.5" fill="#3a7a4a" opacity="0.8">おにぎり  ONIGIRI  ¥148～</text>

      {/* ── Shelf 2: Cup noodles (y=37–52) ── */}
      {row2.map((item,i)=>(
        <PxCup key={i} x={item.x} y={38} color={item.color} cap={item.cap}/>
      ))}
      <rect x="54" y="50" width="212" height="2.5" fill="#1a3018"/>
      <rect x="54" y="51.5" width="212" height="0.6" fill="#00ff88" opacity="0.18"/>
      <rect x="54" y="51.5" width="212" height="5" fill="#060e08"/>
      <text x="60" y="55.5" fontFamily="monospace" fontSize="3.5" fill="#3a7a4a" opacity="0.8">カップ麺  CUP NOODLES  ¥218～</text>

      {/* ── Shelf 3: Drink cans (y=57–72) ── */}
      {row3.map((item,i)=>(
        <PxCan key={i} x={item.x} y={58} bg={item.bg} cap={item.cap} mid={item.mid}/>
      ))}
      <rect x="54" y="71" width="212" height="2.5" fill="#1a3018"/>
      <rect x="54" y="72.5" width="212" height="0.6" fill="#00ff88" opacity="0.15"/>
      <rect x="54" y="72.5" width="212" height="5" fill="#060e08"/>
      <text x="60" y="76.5" fontFamily="monospace" fontSize="3.5" fill="#3a7a4a" opacity="0.8">缶飲料  CANNED DRINKS  ¥148～</text>

      {/* ── Shelf 4: Snack bags (y=78–92) ── */}
      {row4.map((item,i)=>(
        <PxBag key={i} x={item.x} y={79} color={item.color} accent={item.accent}/>
      ))}
      <rect x="54" y="91" width="212" height="2.5" fill="#1a3018"/>
      <rect x="54" y="93" width="212" height="0.6" fill="#00ff88" opacity="0.12"/>

      {/* ═══════════════════════════════════════════════════
          RIGHT WALL — DRINKS FRIDGE
      ═══════════════════════════════════════════════════ */}
      <polygon points="266,14 320,14 320,128 266,108" fill="#060c12"/>
      <line x1="266" y1="14" x2="266" y2="108" stroke="#4488cc" strokeWidth="1.2" opacity="0.5"
        style={{ animation:'kNeonPulse 4.5s ease-in-out infinite 0.6s' }}/>

      {/* Fridge outer cabinet */}
      <rect x="268" y="16" width="50" height="90" fill="#0c1220"/>
      {/* Vertical divider */}
      <rect x="293" y="17" width="1.2" height="88" fill="#1a2840" opacity="0.8"/>
      {/* Two glass doors */}
      <rect x="269" y="17" width="23" height="88" fill="rgba(40,100,180,0.08)" stroke="#1a3050" strokeWidth="0.5"/>
      <rect x="294" y="17" width="23" height="88" fill="rgba(40,100,180,0.08)" stroke="#1a3050" strokeWidth="0.5"/>
      {/* Interior blue glow */}
      <rect x="269" y="17" width="48" height="88"
        style={{ animation:'kFridgeGlow 4s ease-in-out infinite' }} fill="#4488ff" opacity="0.09"/>
      {/* LED strip top */}
      <rect x="269" y="17" width="48" height="1.5" fill="#88ccff" opacity="0.4"
        style={{ animation:'kNeonPulse2 3s ease-in-out infinite' }}/>
      {/* Bottle rows */}
      {fridgeRows.map((row,ri)=>
        row.map((b,ci)=>(
          <PxBottle key={`${ri}-${ci}`} x={b.x} y={b.y} bg={b.bg} cap={b.cap}/>
        ))
      )}
      {/* Glass shelf strips */}
      {[35,55,75].map(sy=>(
        <rect key={sy} x="269" y={sy} width="48" height="1.5" fill="rgba(255,255,255,0.12)"/>
      ))}
      {/* Door handles */}
      <rect x="290" y="55" width="2" height="14" fill="#2a4a6a" rx="1"/>
      <rect x="315" y="55" width="2" height="14" fill="#2a4a6a" rx="1"/>
      {/* Fridge label */}
      <rect x="269" y="103" width="48" height="5"  fill="#050c18"/>
      <text x="293" y="107" textAnchor="middle" fontFamily="'Press Start 2P',monospace" fontSize="3" fill="#4488cc" opacity="0.8">DRINKS</text>
      {/* Temperature readout */}
      <rect x="270" y="109" width="16" height="5"  fill="#020810"/>
      <rect x="270" y="109" width="16" height="5"  fill="none" stroke="#1a3a5a" strokeWidth="0.5"/>
      <text x="278" y="113" textAnchor="middle" fontFamily="monospace" fontSize="3" fill="#4488ff" opacity="0.75">3°C ❄</text>

      {/* ═══════════════════════════════════════════════════
          COUNTER TOP
      ═══════════════════════════════════════════════════ */}
      <rect x="54"  y="101" width="212" height="7"  fill="#0c1a0e"/>
      <rect x="54"  y="101" width="212" height="1.5" fill="#00ff88" opacity="0.7"
        style={{ animation:'kNeonPulse 4s ease-in-out infinite 0.3s' }}/>
      {/* Wood-look edge trim */}
      <rect x="54"  y="106" width="212" height="3"  fill="#1e3018"/>
      <rect x="54"  y="106" width="212" height="1"  fill="#2a4020"/>
      {/* Counter front face */}
      <rect x="0"   y="109" width="320" height="14" fill="#080e0a"/>
      <rect x="0"   y="109" width="320" height="1.5" fill="#00ff88" opacity="0.55"
        style={{ animation:'kNeonPulse 4s ease-in-out infinite 1s' }}/>
      {/* Panel seams */}
      {[80,160,240].map(cx=>(
        <rect key={cx} x={cx} y="109" width="0.8" height="14" fill="#00ff88" opacity="0.08"/>
      ))}

      {/* ─── Cash register (left side of counter) ─── */}
      <rect x="60" y="83" width="28" height="18" fill="#080c10"/>
      <rect x="60" y="83" width="28" height="18" fill="none" stroke="#1a2840" strokeWidth="0.7"/>
      {/* Monitor screen */}
      <rect x="62" y="84" width="24" height="10" fill="#020508"/>
      <rect x="62" y="84" width="24" height="10" fill="none" stroke="#1a3060" strokeWidth="0.4"/>
      <rect x="63" y="85" width="10" height="1"  fill="#00e8ff" opacity="0.75"/>
      <rect x="63" y="87" width="7"  height="1"  fill="#00e8ff" opacity="0.5"/>
      <rect x="63" y="89" width="13" height="1"  fill="#00ff88" opacity="0.65"/>
      {/* Register body / keyboard */}
      <rect x="62" y="95" width="26" height="5"  fill="#05080e"/>
      {[0,1,2,3,4,5].map(k=>(
        <rect key={k} x={63+k*4} y="96.5" width="3" height="2.5" fill="#0d1430"/>
      ))}
      {/* Barcode scanner strip */}
      <rect x="97" y="101" width="14" height="4"  fill="#050710"/>
      <rect x="97" y="101" width="14" height="4"  fill="none" stroke="#1a2040" strokeWidth="0.4"/>
      <rect x="101" y="102" width="6" height="2"  fill="#020408"/>
      <rect x="98" y="102.5" width="12" height="0.7" fill="#ff2020" opacity="0.65"/>
      {/* Receipt roll */}
      <rect x="130" y="93" width="4"  height="8"  fill="#e0dccc" opacity="0.75"/>
      <rect x="130" y="93" width="4"  height="2"  fill="#eae6d8" opacity="0.9"/>
      {[0,1,2,3].map(i=>(
        <rect key={i} x={130.5+i*0.7} y={95} width="0.4" height="6" fill="#1a1a1a" opacity="0.5"/>
      ))}

      {/* ─── HOT FOOD DISPLAY CASE ─── */}
      {/* Cabinet outer */}
      <rect x="148" y="84" width="44" height="24" fill="#0e1610"/>
      <rect x="148" y="84" width="44" height="24" fill="none" stroke="#2a5228" strokeWidth="0.8"/>
      {/* Top heat lamp housing */}
      <rect x="148" y="84" width="44" height="5"  fill="#182a16"/>
      <rect x="150" y="85" width="40" height="3"  fill="#1e3218"/>
      {/* Heat element glow bar */}
      <rect x="151" y="86.5" width="38" height="1.2" fill="#ff6618" opacity="0.55"
        style={{ animation:'kHotGlow 2.5s ease-in-out infinite' }}/>
      {/* Glass front */}
      <rect x="150" y="89" width="40" height="17" fill="rgba(180,230,180,0.05)"/>
      <rect x="150" y="89" width="40" height="17" fill="none" stroke="#1a3818" strokeWidth="0.5"/>
      {/* Warm amber interior glow */}
      <rect x="150" y="89" width="40" height="17" fill="#ff8820"
        style={{ animation:'kHotGlow 3s ease-in-out infinite' }} opacity="0.07"/>
      {/* Interior dark back */}
      <rect x="151" y="90" width="38" height="15" fill="#180c04"/>
      {/* Internal shelf line */}
      <rect x="151" y="97" width="38" height="0.8" fill="rgba(255,180,50,0.2)"/>

      {/* === FRIED CHICKEN === */}
      {/* Top shelf: chicken pieces */}
      <rect x="153" y="91" width="8"  height="5"  fill="#c87020"/>
      <rect x="154" y="90" width="6"  height="3"  fill="#b86018"/>
      <rect x="154" y="91" width="5"  height="4"  fill="#d88030"/>
      <rect x="155" y="90" width="3"  height="2"  fill="#c07018"/>
      {/* Grill marks */}
      <rect x="153" y="92"   width="8"  height="0.7" fill="#7a3c08" opacity="0.75"/>
      <rect x="153" y="94"   width="8"  height="0.7" fill="#7a3c08" opacity="0.6"/>
      {/* Crispy highlight */}
      <rect x="153" y="91"   width="2"  height="5"  fill="#e09040" opacity="0.3"/>
      {/* Second piece */}
      <rect x="163" y="91" width="7"   height="5"  fill="#c07018"/>
      <rect x="163" y="90" width="5"   height="3"  fill="#b05810"/>
      <rect x="164" y="91" width="4"   height="4"  fill="#d08028"/>
      <rect x="163" y="92.5" width="7" height="0.7" fill="#7a3c08" opacity="0.7"/>
      <rect x="163" y="94.5" width="7" height="0.7" fill="#7a3c08" opacity="0.55"/>
      <rect x="163" y="91"  width="1.5" height="5" fill="#e09040" opacity="0.25"/>

      {/* === NIKUMAN (STEAMED PORK BUNS) === */}
      {/* Bottom shelf: buns */}
      <rect x="153" y="99" width="11" height="7"  fill="#f0ece0"/>
      <rect x="151" y="101" width="13" height="5" fill="#f4f0e4"/>
      <rect x="154" y="97" width="9"  height="6"  fill="#eeeadc"/>
      <rect x="156" y="96" width="5"  height="4"  fill="#ece8d4"/>
      {/* Top gather */}
      <rect x="158" y="97" width="1"  height="3"  fill="#c8906a" opacity="0.55"/>
      <rect x="160" y="97" width="1"  height="2"  fill="#c8906a" opacity="0.45"/>
      {/* Fold lines */}
      <rect x="154" y="100" width="9" height="0.6" fill="#d8c8a8" opacity="0.5"/>
      <rect x="154" y="102" width="9" height="0.6" fill="#d8c8a8" opacity="0.4"/>
      {/* Second bun (peeking behind) */}
      <rect x="164" y="100" width="10" height="6" fill="#e8e4d4" opacity="0.88"/>
      <rect x="163" y="102" width="12" height="4" fill="#ece8dc" opacity="0.85"/>
      <rect x="165" y="98" width="8"  height="6"  fill="#e4e0cc" opacity="0.85"/>
      <rect x="167" y="97" width="4"  height="4"  fill="#e2deca" opacity="0.85"/>
      <rect x="169" y="98" width="1"  height="2"  fill="#c8906a" opacity="0.4"/>

      {/* === CORN DOG === */}
      <rect x="178" y="90" width="1.5" height="14" fill="#c8b060"/>
      <rect x="177" y="89" width="4"   height="11" fill="#d07e20"/>
      <rect x="178" y="89" width="2"   height="10" fill="#e08e30"/>
      <rect x="177" y="95" width="4"   height="1"  fill="#a05a10" opacity="0.55"/>
      <rect x="177" y="97" width="4"   height="1"  fill="#a05a10" opacity="0.45"/>

      {/* === SECOND CORN DOG === */}
      <rect x="184" y="91" width="1.5" height="13" fill="#c8b060"/>
      <rect x="183" y="90" width="4"   height="10" fill="#cc7820"/>
      <rect x="184" y="90" width="2"   height="9"  fill="#dd8a2a"/>
      <rect x="183" y="96" width="4"   height="1"  fill="#9a5208" opacity="0.5"/>

      {/* Steam wisps from hot food */}
      {[0,1,2,3].map(i=>(
        <rect key={i} x={154+i*9} y="89" width="1.5" height="3" fill="rgba(255,255,255,0.22)"
          style={{ animation:`kSteamUp ${1.2+i*.38}s ease-out infinite`, animationDelay:`${i*.55}s` }}/>
      ))}

      {/* Hot case bottom rail */}
      <rect x="148" y="107" width="44" height="2" fill="#0c1210"/>
      <rect x="148" y="108" width="44" height="1" fill="#2a5028" opacity="0.4"/>
      {/* "HOT FOODS" label */}
      <text x="170" y="88" textAnchor="middle" fontFamily="monospace" fontSize="2.8" fill="#cc6010" opacity="0.75">🔥 HOT FOODS</text>

      {/* ═══════════════════════════════════════════════════
          SLEEPING CASHIER
          (modeled on record-store shopkeeper style)
      ═══════════════════════════════════════════════════ */}
      <g style={{ animation:'kBreathe 3.8s ease-in-out infinite', transformOrigin:'213px 96px' }}>

        {/* ZZZ bubbles floating up */}
        <text x="230" y="77" fontFamily="'Press Start 2P',monospace" fontSize="4.5" fill="#6898c8"
          style={{ animation:'kZzz 4.2s ease-in-out infinite' }}>z</text>
        <text x="239" y="65" fontFamily="'Press Start 2P',monospace" fontSize="6.5" fill="#5082b8"
          style={{ animation:'kZzz 4.2s ease-in-out infinite 1.4s' }}>z</text>
        <text x="249" y="51" fontFamily="'Press Start 2P',monospace" fontSize="9" fill="#386aa0"
          style={{ animation:'kZzz 4.2s ease-in-out infinite 2.8s' }}>Z</text>

        {/* Store cap / uniform top — shoulders visible above counter */}
        <rect x="192" y="93" width="42" height="9"  fill="#1a3028"/>
        <rect x="192" y="93" width="42" height="1.5" fill="#2a4838"/>
        {/* Name patch on left chest */}
        <rect x="195" y="96" width="10" height="4"  fill="#d0e8d4"/>
        <rect x="196" y="96.5" width="8" height="3" fill="#c2dccb"/>
        {/* Pocket detail */}
        <rect x="216" y="95" width="7"  height="5"  fill="#152618" opacity="0.6"/>
        <rect x="217" y="95.5" width="5" height="4" fill="#0e1e12" opacity="0.5"/>

        {/* Forearm "pillow" resting on counter */}
        <rect x="188" y="100" width="48" height="6" fill="#1e3830"/>
        <rect x="188" y="100" width="48" height="1" fill="#2a4840"/>
        {/* Hand skin at wrist (left end) */}
        <rect x="188" y="100" width="10" height="6" fill="#c8904a"/>
        <rect x="188" y="105" width="10" height="1" fill="#a07038"/>

        {/* HEAD — rotated so cheek rests on forearm (modeled on RecordStore) */}
        <g transform="rotate(-22, 213, 95)">
          {/* Konbini worker cap / visor */}
          <rect x="200" y="72" width="24" height="7"  fill="#1a3028"/>
          <rect x="200" y="72" width="24" height="1.5" fill="#2a4838"/>
          {/* Cap brim */}
          <rect x="197" y="79" width="30" height="3"  fill="#142418"/>
          <rect x="197" y="79" width="30" height="1"  fill="#1e3020"/>
          {/* Cap badge */}
          <rect x="210" y="73" width="6"  height="4"  fill="#00aa44" opacity="0.6"/>
          <rect x="211" y="74" width="4"  height="2"  fill="#00cc55" opacity="0.55"/>

          {/* Hair underneath cap */}
          <rect x="200" y="78" width="6"  height="8"  fill="#1a1630"/>
          <rect x="222" y="78" width="4"  height="7"  fill="#1a1630"/>

          {/* Face skin */}
          <rect x="200" y="80" width="26" height="17" fill="#c8904a"/>
          {/* Left cheek shadow */}
          <rect x="200" y="85" width="3"  height="10" fill="#a87038"/>
          {/* Right cheek highlight */}
          <rect x="223" y="85" width="3"  height="10" fill="#d49a54"/>

          {/* Left closed eye */}
          <rect x="204" y="87" width="1"  height="1"  fill="#7a4820"/>
          <rect x="205" y="88" width="5"  height="1"  fill="#7a4820"/>
          <rect x="210" y="87" width="1"  height="1"  fill="#7a4820"/>
          {/* Right closed eye */}
          <rect x="213" y="87" width="1"  height="1"  fill="#7a4820"/>
          <rect x="214" y="88" width="5"  height="1"  fill="#7a4820"/>
          <rect x="219" y="87" width="1"  height="1"  fill="#7a4820"/>

          {/* Nose */}
          <rect x="210" y="84" width="2"  height="1"  fill="#a07030"/>
          {/* Mouth (slightly open in sleep) */}
          <rect x="205" y="92" width="8"  height="2"  fill="#884020"/>
          <rect x="206" y="93" width="6"  height="1"  fill="#c06030"/>
          {/* Drool (cute sleeping detail) */}
          <rect x="209" y="94" width="2"  height="3"  fill="#6878b0" opacity="0.5"/>

          {/* Ear */}
          <rect x="198" y="85" width="3"  height="6"  fill="#c8904a"/>
          <rect x="198" y="86" width="2"  height="4"  fill="#b07838"/>

          {/* Blush marks */}
          <rect x="202" y="90" width="4"  height="2"  fill="#e8a070" opacity="0.3"/>
          <rect x="220" y="90" width="4"  height="2"  fill="#e8a070" opacity="0.3"/>

          {/* Collar (white uniform) */}
          <rect x="204" y="96" width="5"  height="3"  fill="#d8e8dc"/>
          <rect x="215" y="96" width="5"  height="3"  fill="#d8e8dc"/>
        </g>

        {/* Uniform patch on left arm (visible on forearm) */}
        <rect x="225" y="101" width="6"  height="3"  fill="#d0e8d4" opacity="0.7"/>
      </g>

      {/* ═══════════════════════════════════════════════════
          FLOOR
      ═══════════════════════════════════════════════════ */}
      <rect x="0" y="123" width="320" height="57" fill="#06100a"/>
      {/* Checkerboard tiles */}
      {Array.from({length:6}).map((_,row)=>
        Array.from({length:16}).map((_,col)=>{
          const odd=(row+col)%2===0;
          return <rect key={`${row}-${col}`} x={col*20} y={123+row*9.5} width="20" height="9.5"
            fill={odd?'#0c1810':'#0a1610'} stroke="#0e1c12" strokeWidth="0.3"/>;
        })
      )}
      {/* Floor neon reflection from counter */}
      <rect x="0" y="123" width="320" height="8" fill="#00ff88" opacity="0.03"/>
      {/* Perspective guide lines */}
      <line x1="160" y1="123" x2="20"  y2="180" stroke="#00ff88" strokeWidth="0.5" opacity="0.03"/>
      <line x1="160" y1="123" x2="300" y2="180" stroke="#00ff88" strokeWidth="0.5" opacity="0.03"/>

      {/* ═══════════════════════════════════════════════════
          ATMOSPHERE OVERLAYS
      ═══════════════════════════════════════════════════ */}
      <rect width="320" height="180" fill="url(#kGreenBloom)"/>
      <rect width="320" height="180" fill="url(#kVignT)"/>
      <rect width="320" height="180" fill="url(#kVignB)"/>
      {/* Side darkening */}
      <rect x="0"   y="0" width="20"  height="180" fill="#020a06" opacity="0.4"/>
      <rect x="300" y="0" width="20"  height="180" fill="#020a06" opacity="0.4"/>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props { onExit: () => void; }

export function ConvenienceStore({ onExit }: Props) {
  const { setTrack } = useMusic();
  const [panel,         setPanel]         = useState<'none'|'fridge'|'magazine'|'snack'|'window'|'basket'|'checkout'>('none');
  const [cart,          setCart]          = useState<CartItem[]>([]);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [cartBounce,    setCartBounce]    = useState(false);
  const [entryDone,     setEntryDone]     = useState(false);
  const audioRef = useRef<HTMLAudioElement|null>(null);

  const addToCart = (kind:'drink'|'snack', id:string) => {
    setCart(c=>[...c, {kind, id}]);
    setCartBounce(true);
    setTimeout(()=>setCartBounce(false), 600);
  };
  const removeFromCart = (idx:number) => setCart(c=>c.filter((_,i)=>i!==idx));
  const cartCounts = cart.reduce((acc,item)=>({...acc,[item.id]:(acc[item.id]||0)+1}), {} as Record<string,number>);

  const handleCheckout = () => {
    setCheckoutItems([...cart]);
    setCart([]);
    setPanel('checkout');
  };

  const character = (() => {
    try { const s=localStorage.getItem('to_character'); return s?JSON.parse(s):null; } catch { return null; }
  })() || { style:'STREETWEAR', hair:'SPIKY', hairColor:'#4a3020', gender:'NEUTRAL', skin:'#ffdbac' };

  useEffect(() => {
    const id = setTimeout(()=>setEntryDone(true), 420);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    setTrack('');
    if (KONBINI_AMBIENT) {
      const a = new Audio(KONBINI_AMBIENT);
      a.loop=true; a.volume=0.45;
      a.play().catch(()=>{});
      audioRef.current=a;
    }
    return () => { audioRef.current?.pause(); audioRef.current=null; setTrack(TRACK_TITLE); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backspace exits to the map
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Backspace') { e.preventDefault(); onExit(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  // On portrait mobile the landscape SVG zooms in 4×; use a scrollable wider container instead
  const mobileStoreW = 'max(100%, calc(100vh * 320 / 180))';

  return (
    <div style={{ position:'relative', width:'100%', height:'100vh', overflow:'hidden', background:'#04080a' }}>
      <style>{STYLES}</style>

      {/* Entry fade from black */}
      <AnimatePresence>
        {!entryDone && (
          <motion.div key="ef" className="absolute inset-0 z-[500] bg-black pointer-events-none"
            initial={{ opacity:1 }} animate={{ opacity:0 }} transition={{ duration:.45 }}/>
        )}
      </AnimatePresence>

      {/* ── Scrollable store content (room + zones) ── */}
      <div style={{
        position: 'absolute', inset: 0,
        overflowX: isMobile ? 'auto' : 'hidden',
        overflowY: 'hidden',
        zIndex: 1,
      }}>
        <div style={{
          position: 'relative',
          width: isMobile ? mobileStoreW : '100%',
          height: '100%',
          flexShrink: 0,
        }}>
          {/* Room SVG */}
          <KonbiniRoom/>

          {/* ── Clickable interactive zones ── */}
          {/* Window zone */}
          <button onClick={()=>setPanel('window')}
            style={{ position:'absolute', left:'0%', top:'9%', width:'17%', height:'23%', background:'transparent', border:'none', cursor:'pointer', zIndex:5 }}
            title="Look outside"/>
          {/* Magazine rack zone */}
          <button onClick={()=>setPanel('magazine')}
            style={{ position:'absolute', left:'0%', top:'35%', width:'17%', height:'24%', background:'transparent', border:'none', cursor:'pointer', zIndex:5 }}
            title="Browse magazines"/>
          {/* Snack shelf zone */}
          <button onClick={()=>setPanel('snack')}
            style={{ position:'absolute', left:'17%', top:'8%', width:'65%', height:'52%', background:'transparent', border:'none', cursor:'pointer', zIndex:5 }}
            title="Browse snacks"/>
          {/* Fridge zone */}
          <button onClick={()=>setPanel('fridge')}
            style={{ position:'absolute', right:'0%', top:'8%', width:'18%', height:'62%', background:'transparent', border:'none', cursor:'pointer', zIndex:5 }}
            title="Open drinks fridge"/>

          {/* Zone hover labels */}
          {[
            { zone:'window',   left:'1.5%',  top:'9%',   label:'[ WINDOW ]'    },
            { zone:'magazine', left:'1.5%',  top:'36%',  label:'[ MAGAZINES ]' },
            { zone:'snack',    left:'20%',   top:'58%',  label:'[ SNACK SHELF ]'},
            { zone:'fridge',   right:'1%',   top:'58%',  label:'[ DRINKS ]'    },
          ].map(z=>(
            <div key={z.zone} style={{ position:'absolute', left:z.left, right:(z as any).right, top:z.top, pointerEvents:'none', zIndex:6 }}>
              <motion.div
                animate={{ opacity:[0.45,0.85,0.45] }}
                transition={{ duration:2.8, repeat:Infinity, delay:Math.random()*2 }}
                style={{ ...PX, fontSize:5.5, color:'#00ff88', letterSpacing:'0.12em', textShadow:'0 0 8px #00ff8888', whiteSpace:'nowrap' }}
              >
                {z.label}
              </motion.div>
            </div>
          ))}

          {/* Instruction hint bar */}
          {!isMobile && (
            <div style={{ position:'absolute', bottom:'2%', left:'50%', transform:'translateX(-50%)', pointerEvents:'none', zIndex:10, whiteSpace:'nowrap' }}>
              <motion.div
                animate={{ opacity:[0.55,0.85,0.55] }} transition={{ duration:3, repeat:Infinity }}
                style={{ ...PX, fontSize:6, color:'#00e8a0', letterSpacing:'0.1em', textShadow:'0 0 10px #00e8a088',
                  background:'rgba(2,8,14,0.7)', padding:'5px 14px', border:'1px solid rgba(0,232,160,0.18)' }}>
                [ CLICK ] WINDOW  •  MAGAZINES  •  SNACKS  •  DRINKS   |   BACKSPACE EXIT
              </motion.div>
            </div>
          )}

          {/* Mobile scroll hint */}
          {isMobile && (
            <div style={{ position:'absolute', bottom:'28%', left:'50%', transform:'translateX(-50%)', pointerEvents:'none', zIndex:7 }}>
              <motion.div animate={{ opacity:[0,0.7,0], x:[0,12,0] }} transition={{ duration:2, repeat:Infinity, repeatDelay:3 }}
                style={{ ...PX, fontSize:5, color:'#00ff88', whiteSpace:'nowrap', letterSpacing:'0.1em' }}>
                ◀ SCROLL ▶
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* ── Fixed UI (stays above the scrollable store) ── */}

      {/* ── [ ← MAP ] ── */}
      <motion.button
        whileHover={{ scale:1.06, boxShadow:'0 0 18px rgba(0,255,136,0.55)' }}
        whileTap={{ scale:.96 }}
        onClick={onExit}
        style={{ position:'absolute', top:14, left:14, zIndex:50, ...PX, fontSize:8, color:'#ffffff', background:'#0c2018', border:'2px solid #00ff88', padding:'7px 13px', cursor:'pointer', letterSpacing:'0.12em', boxShadow:'0 0 8px rgba(0,255,136,0.3)' }}
      >
        ← MAP
      </motion.button>

      {/* ── Basket HUD button ── */}
      <motion.button
        whileHover={{ scale:1.06, boxShadow:'0 0 20px rgba(0,255,136,0.5)' }}
        whileTap={{ scale:.95 }}
        onClick={()=>setPanel('basket')}
        style={{ position:'absolute', top:14, right:14, zIndex:50, background:'#0c2018', border:'2px solid #00ff88', padding:'7px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:10, boxShadow:'0 0 8px rgba(0,255,136,0.25)' }}
      >
        {/* Pixel basket icon */}
        <svg width="22" height="20" viewBox="0 0 22 20" shapeRendering="crispEdges">
          <rect x="2" y="9"  width="18" height="11" fill="#0c2014" stroke="#00ff88" strokeWidth="1"/>
          <rect x="4" y="11" width="2"  height="7"  fill="#1a3a1a" opacity="0.7"/>
          <rect x="8" y="11" width="2"  height="7"  fill="#1a3a1a" opacity="0.7"/>
          <rect x="12" y="11" width="2" height="7"  fill="#1a3a1a" opacity="0.7"/>
          <rect x="16" y="11" width="2" height="7"  fill="#1a3a1a" opacity="0.7"/>
          <path d="M6,9 Q4,2 11,1 Q18,2 16,9" fill="none" stroke="#00ff88" strokeWidth="1.5"/>
        </svg>
        <motion.div animate={cartBounce ? { scale:[1,1.5,0.88,1] } : {}} transition={{ duration:.5 }}>
          <span style={{ ...PX, fontSize:9, color:'#00ff88', letterSpacing:'0.08em' }}>
            {cart.length > 0 ? `[${cart.length}]` : '[ ]'}
          </span>
        </motion.div>
      </motion.button>

      {/* CRT scanlines */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:20,
        background:'linear-gradient(rgba(8,12,8,0) 50%, rgba(0,0,0,0.05) 50%)', backgroundSize:'100% 4px' }}/>

      {/* ── Panels ── */}
      <AnimatePresence>
        {panel==='fridge'   && <FridgePanel   key="fridge"   onClose={()=>setPanel('none')} onAdd={id=>addToCart('drink',id)} cartCounts={cartCounts}/>}
        {panel==='magazine' && <MagazinePanel key="magazine" onClose={()=>setPanel('none')} />}
        {panel==='snack'    && <SnackPanel    key="snack"    onClose={()=>setPanel('none')} onAdd={id=>addToCart('snack',id)} cartCounts={cartCounts}/>}
        {panel==='window'   && <WindowPanel   key="window"   character={character} onClose={()=>setPanel('none')} />}
        {panel==='basket'   && <BasketPanel   key="basket"   cart={cart} onRemove={removeFromCart} onCheckout={handleCheckout} onClose={()=>setPanel('none')} />}
        {panel==='checkout' && <CheckoutPanel key="checkout" items={checkoutItems} onDone={()=>setPanel('none')} />}
      </AnimatePresence>
    </div>
  );
}
