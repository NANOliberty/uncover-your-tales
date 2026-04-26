import React, { useState, useEffect, useRef, useCallback, useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMusic, TRACK_TITLE } from './MusicContext';
import { PixelCharacter } from './PixelCharacter';

// ─── Window size hook ─────────────────────────────────────────────────────────
function useWindowSize() {
  const [size, setSize] = useState({ vw: window.innerWidth, vh: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ vw: window.innerWidth, vh: window.innerHeight });
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', () => setTimeout(handler, 200));
    return () => { window.removeEventListener('resize', handler); };
  }, []);
  return size;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'entering' | 'booth' | 'strip';
interface CharData { style: string; hair: string; hairColor: string; gender: string; skin: string }
interface FrameData { bg: BgId }

const PX: React.CSSProperties = { fontFamily: '"Press Start 2P", monospace' };

function getCharacter(): CharData {
  try { const s = localStorage.getItem('to_character'); if (s) return JSON.parse(s); } catch {}
  return { style: 'STREETWEAR', hair: 'SPIKY', hairColor: '#4a3020', gender: 'NEUTRAL', skin: '#ffdbac' };
}

// ─── Background configs ───────────────────────────────────────────────────────
const BACKGROUNDS = [
  { id: 'sakura',   label: '🌸 SAKURA',    desc: 'Cherry Blossom Park' },
  { id: 'neon',     label: '🏙️ NEON CITY',  desc: 'Cyberpunk Night' },
  { id: 'space',    label: '🌌 DEEP SPACE', desc: 'Outer Space' },
  { id: 'beach',    label: '🌅 SUNSET',     desc: 'Beach at Sunset' },
  { id: 'festival', label: '🏮 MATSURI',    desc: 'Summer Festival' },
  { id: 'rainbow',  label: '🌈 KAWAII',     desc: 'Rainbow Dream' },
  { id: 'bamboo',   label: '🎋 BAMBOO',     desc: 'Bamboo Forest' },
  { id: 'studio',   label: '⬜ STUDIO',     desc: 'Pro White Studio' },
] as const;
type BgId = typeof BACKGROUNDS[number]['id'];

const BOOTH_MUSIC_URL = 'https://raw.githubusercontent.com/crlazy101/Tokyo-Audio/main/Tokyo_Tower_kqaky0.ogg';

// ─── Rich Background SVG scenes ───────────────────────────────────────────────
function BgScene({ id, w = 240, h = 280 }: { id: BgId; w?: number; h?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '_');

  if (id === 'sakura') {
    const petals = Array.from({ length: 38 }, (_, i) => ({
      x: (i * 61.8 + 7) % Math.max(w - 8, 1),
      y: (i * 38.2) % Math.max(h * 0.72, 1),
      dx: ((i * 13) % 7) - 3, dur: 2.8 + (i % 7) * 0.5,
      delay: (i * 0.33) % 6.5, sz: 2.5 + (i % 3),
    }));
    const R = (n: number) => Math.round(n);
    return (
      <svg width={w} height={h} style={{ display: 'block', shapeRendering: 'crispEdges' }}>
        <defs>
          <linearGradient id={`${uid}ss`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#8ab4e8" /><stop offset="30%" stopColor="#c8a8d8" />
            <stop offset="60%"  stopColor="#eeb8d8" /><stop offset="85%" stopColor="#ffd4ec" />
            <stop offset="100%" stopColor="#fff0f8" />
          </linearGradient>
          <linearGradient id={`${uid}sg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5aaa55" /><stop offset="100%" stopColor="#3d7535" />
          </linearGradient>
          <linearGradient id={`${uid}sw`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#78c0e0" /><stop offset="100%" stopColor="#4090b8" />
          </linearGradient>
        </defs>
        {/* SKY */}
        <rect width={w} height={h} fill={`url(#${uid}ss)`} />
        {/* Sun */}
        <circle cx={R(w*.78)} cy={R(h*.1)} r={R(h*.14)} fill="#fff8f0" opacity={.18} />
        <circle cx={R(w*.78)} cy={R(h*.1)} r={R(h*.09)} fill="#fff5e0" opacity={.38} />
        <circle cx={R(w*.78)} cy={R(h*.1)} r={R(h*.055)} fill="#fffde0" opacity={.92} />
        {/* Sun rays */}
        {Array.from({length:8},(_,i)=>{const a=i*45*Math.PI/180,r1=R(h*.07),r2=R(h*.11);return(
          <line key={i} x1={R(w*.78+Math.cos(a)*r1)} y1={R(h*.1+Math.sin(a)*r1)}
            x2={R(w*.78+Math.cos(a)*r2)} y2={R(h*.1+Math.sin(a)*r2)} stroke="#ffe880" strokeWidth={1.5} opacity={.35} />
        );})}
        {/* Distant mountains — 4 silhouette bands */}
        {[{x:0,tw:.38,y:.41,c:'#d0b0e0'},{x:w*.18,tw:.30,y:.37,c:'#bca0d0'},
          {x:w*.52,tw:.35,y:.39,c:'#c8a8d8'},{x:w*.74,tw:.30,y:.33,c:'#b098c8'}].map((m,i)=>(
          <rect key={i} x={R(m.x)} y={R(h*m.y)} width={R(m.tw*w)} height={R(h*(.53-m.y))} fill={m.c} opacity={.42} />
        ))}
        {/* Haze band */}
        <rect x={0} y={R(h*.51)} width={w} height={R(h*.033)} fill="#ffcce8" opacity={.28} />
        {/* Far blossom treeline */}
        {Array.from({length:15},(_,i)=>(
          <ellipse key={i} cx={R((i/14)*w)} cy={R(h*.5)} rx={R(w*.054)} ry={R(h*.068)}
            fill={i%2===0?'#e8a8cc':'#f0c0d8'} opacity={.55} />
        ))}
        {/* Background pagoda */}
        <rect x={R(w*.47)} y={R(h*.37)} width={R(w*.042)} height={R(h*.16)} fill="#992200" opacity={.57} />
        <rect x={R(w*.44)} y={R(h*.37)} width={R(w*.10)} height={5} fill="#bb3300" opacity={.57} />
        <rect x={R(w*.452)} y={R(h*.42)} width={R(w*.082)} height={4} fill="#bb3300" opacity={.52} />
        <rect x={R(w*.464)} y={R(h*.46)} width={R(w*.064)} height={3} fill="#bb3300" opacity={.46} />
        <rect x={R(w*.49)} y={R(h*.29)} width={2} height={R(h*.09)} fill="#771800" opacity={.52} />
        {/* LEFT cherry tree — trunk + 3 branches + 7 bloom ellipses */}
        <rect x={R(w*.084)} y={R(h*.46)} width={R(w*.036)} height={R(h*.36)} fill="#5c2e14" />
        <rect x={R(w*.078)} y={R(h*.43)} width={R(w*.022)} height={R(h*.10)} fill="#5c2e14" transform={`rotate(-36,${R(w*.078)},${R(h*.43)})`} />
        <rect x={R(w*.114)} y={R(h*.41)} width={R(w*.020)} height={R(h*.12)} fill="#5c2e14" transform={`rotate(30,${R(w*.114)},${R(h*.41)})`} />
        <rect x={R(w*.097)} y={R(h*.38)} width={R(w*.016)} height={R(h*.09)} fill="#5c2e14" transform={`rotate(-14,${R(w*.097)},${R(h*.38)})`} />
        <ellipse cx={R(w*.054)} cy={R(h*.37)} rx={R(w*.105)} ry={R(h*.10)} fill="#ff8abb" opacity={.93} />
        <ellipse cx={R(w*.158)} cy={R(h*.33)} rx={R(w*.092)} ry={R(h*.096)} fill="#ffaac8" opacity={.90} />
        <ellipse cx={R(w*.042)} cy={R(h*.46)} rx={R(w*.078)} ry={R(h*.086)} fill="#ff99c0" opacity={.87} />
        <ellipse cx={R(w*.180)} cy={R(h*.43)} rx={R(w*.080)} ry={R(h*.092)} fill="#ff88b5" opacity={.88} />
        <ellipse cx={R(w*.096)} cy={R(h*.27)} rx={R(w*.074)} ry={R(h*.078)} fill="#ffc0da" opacity={.82} />
        <ellipse cx={R(w*-.010)} cy={R(h*.41)} rx={R(w*.068)} ry={R(h*.084)} fill="#ff77aa" opacity={.70} />
        <ellipse cx={R(w*.214)} cy={R(h*.38)} rx={R(w*.062)} ry={R(h*.073)} fill="#ffbbdd" opacity={.73} />
        {/* Individual bloom dots on left tree */}
        {Array.from({length:12},(_,i)=>(
          <circle key={i} cx={R(w*(.04+i*.019))} cy={R(h*(.32+i*.013))} r={1.5} fill="#fff8fc" opacity={.55} />
        ))}
        {/* RIGHT cherry tree */}
        <rect x={R(w*.878)} y={R(h*.47)} width={R(w*.036)} height={R(h*.35)} fill="#5c2e14" />
        <rect x={R(w*.858)} y={R(h*.44)} width={R(w*.020)} height={R(h*.10)} fill="#5c2e14" transform={`rotate(-22,${R(w*.858)},${R(h*.44)})`} />
        <rect x={R(w*.912)} y={R(h*.42)} width={R(w*.020)} height={R(h*.12)} fill="#5c2e14" transform={`rotate(33,${R(w*.912)},${R(h*.42)})`} />
        <ellipse cx={R(w*.936)} cy={R(h*.37)} rx={R(w*.105)} ry={R(h*.102)} fill="#ff8abb" opacity={.92} />
        <ellipse cx={R(w*.852)} cy={R(h*.35)} rx={R(w*.096)} ry={R(h*.100)} fill="#ffaac8" opacity={.90} />
        <ellipse cx={R(w*.956)} cy={R(h*.45)} rx={R(w*.080)} ry={R(h*.088)} fill="#ff99c0" opacity={.87} />
        <ellipse cx={R(w*.842)} cy={R(h*.44)} rx={R(w*.084)} ry={R(h*.092)} fill="#ff88b5" opacity={.88} />
        <ellipse cx={R(w*1.01)} cy={R(h*.41)} rx={R(w*.075)} ry={R(h*.092)} fill="#ff77aa" opacity={.70} />
        <ellipse cx={R(w*.896)} cy={R(h*.27)} rx={R(w*.073)} ry={R(h*.082)} fill="#ffc0da" opacity={.80} />
        {/* MID cherry tree (partially visible) */}
        <rect x={R(w*.475)} y={R(h*.51)} width={R(w*.032)} height={R(h*.29)} fill="#5c2e14" opacity={.64} />
        <ellipse cx={R(w*.492)} cy={R(h*.46)} rx={R(w*.10)} ry={R(h*.12)} fill="#ff99cc" opacity={.60} />
        <ellipse cx={R(w*.447)} cy={R(h*.50)} rx={R(w*.074)} ry={R(h*.092)} fill="#ffaacc" opacity={.56} />
        <ellipse cx={R(w*.540)} cy={R(h*.49)} rx={R(w*.074)} ry={R(h*.092)} fill="#ffaac8" opacity={.56} />
        {/* Stone TORII gate */}
        <rect x={R(w*.33)} y={R(h*.54)} width={R(w*.34)} height={8} fill="#cc3300" />
        <rect x={R(w*.31)} y={R(h*.57)} width={R(w*.38)} height={5} fill="#dd4411" />
        <rect x={R(w*.365)} y={R(h*.59)} width={8} height={R(h*.26)} fill="#bb2200" />
        <rect x={R(w*.610)} y={R(h*.59)} width={8} height={R(h*.26)} fill="#bb2200" />
        <rect x={R(w*.345)} y={R(h*.84)} width={14} height={6} fill="#991500" />
        <rect x={R(w*.625)} y={R(h*.84)} width={14} height={6} fill="#991500" />
        {/* POND */}
        <rect x={R(w*.16)} y={R(h*.74)} width={R(w*.68)} height={R(h*.072)} fill={`url(#${uid}sw)`} opacity={.88} />
        <rect x={R(w*.16)} y={R(h*.74)} width={R(w*.68)} height={2} fill="#aaddf0" opacity={.65} />
        {/* Lily pads */}
        {[.25,.39,.52,.64,.74].map((px,i)=>(
          <ellipse key={i} cx={R(w*px)} cy={R(h*.776+(i%3)*2)} rx={8} ry={4} fill="#3a9835" opacity={.72} />
        ))}
        {/* Koi fish */}
        {[{x:.31,c:'#ff6622'},{x:.57,c:'#ffffee'},{x:.46,c:'#ff3344'}].map((k,i)=>(
          <motion.ellipse key={i} cx={R(w*k.x)} cy={R(h*.768)} rx={10} ry={3} fill={k.c} opacity={.68}
            animate={{cx:[R(w*k.x),R(w*(k.x+.1)),R(w*k.x)]}} transition={{duration:4+i*1.5,repeat:Infinity,ease:'easeInOut'}} />
        ))}
        {/* Pond sparkles */}
        {[.30,.48,.63].map((rx,i)=>(
          <motion.rect key={i} x={R(w*rx)} y={R(h*.752)} width={3} height={2} fill="#fff" opacity={.55}
            animate={{opacity:[.2,.8,.2]}} transition={{duration:1.8+i*.5,repeat:Infinity}} />
        ))}
        {/* RED BRIDGE over pond */}
        <path d={`M${R(w*.19)},${R(h*.74)} Q${R(w*.5)},${R(h*.62)} ${R(w*.81)},${R(h*.74)}`}
          fill="none" stroke="#cc2200" strokeWidth={Math.max(3,R(h*.028))} />
        <path d={`M${R(w*.19)},${R(h*.752)} Q${R(w*.5)},${R(h*.632)} ${R(w*.81)},${R(h*.752)}`}
          fill="#cc2200" stroke="#aa1500" strokeWidth={1} />
        {/* Bridge railings */}
        {[.23,.31,.40,.50,.60,.69,.77].map((bx,i)=>{
          const by=R(h*.74-h*.11*(1-Math.pow((bx-.5)*2,2)));
          return <rect key={i} x={R(w*bx)} y={by-14} width={2} height={14} fill="#dd3311" opacity={.82} />;
        })}
        {/* STONE LANTERNS */}
        {[R(w*.058),R(w*.872)].map((lx,i)=>(
          <g key={i}>
            <rect x={lx-5} y={R(h*.60)} width={10} height={R(h*.22)} fill="#9a9988" />
            <rect x={lx-7} y={R(h*.60)} width={14} height={5} fill="#888877" />
            <rect x={lx-9} y={R(h*.54)} width={18} height={R(h*.072)} fill="#aaa999" />
            <rect x={lx-6} y={R(h*.556)} width={12} height={R(h*.050)} fill="#bbbbaa" />
            <motion.rect x={lx-3} y={R(h*.566)} width={7} height={R(h*.030)} fill="#ffe890" opacity={.88}
              animate={{opacity:[.5,1,.65,1,.5]}} transition={{duration:2.8+i*.6,repeat:Infinity}} />
            <motion.ellipse cx={lx} cy={R(h*.74)} rx={18} ry={5} fill="#ffee88" opacity={.10}
              animate={{opacity:[.06,.18,.06]}} transition={{duration:2.8+i*.6,repeat:Infinity}} />
            <rect x={lx-9} y={R(h*.82)} width={18} height={5} fill="#777766" />
            <rect x={lx-5} y={R(h*.86)} width={10} height={4} fill="#666655" />
          </g>
        ))}
        {/* GROUND */}
        <rect x={0} y={R(h*.82)} width={w} height={R(h*.18)} fill={`url(#${uid}sg)`} />
        <rect x={0} y={R(h*.82)} width={w} height={3} fill="#4a9044" />
        {/* Stone path */}
        {[.27,.37,.47,.57,.65,.73].map((px,i)=>(
          <ellipse key={i} cx={R(w*px)} cy={R(h*.87+(i%3)*3)} rx={12} ry={6} fill="#ccccaa" opacity={.80} />
        ))}
        {/* Petal carpet on ground */}
        {Array.from({length:28},(_,i)=>(
          <ellipse key={i} cx={R((i*18+5)%(w-6))} cy={R(h*.84+(i%5)*3)} rx={4} ry={2}
            fill={i%2===0?'#ffaacc':'#ffbbdd'} opacity={.55}
            transform={`rotate(${i*31},${(i*18+5)%(w-6)},${R(h*.84+(i%5)*3)})`} />
        ))}
        {/* Moss patches */}
        {[.12,.35,.58,.82].map((mx,i)=>(
          <ellipse key={i} cx={R(w*mx)} cy={R(h*.86)} rx={16} ry={5} fill="#357030" opacity={.38} />
        ))}
        {/* FALLING PETALS */}
        {petals.map((p,i)=>(
          <motion.g key={i} animate={{y:[0,h*.64],x:[0,p.dx*20],opacity:[.9,0]}}
            transition={{duration:p.dur,delay:p.delay,repeat:Infinity,ease:'linear'}}>
            <ellipse cx={p.x} cy={p.y} rx={p.sz} ry={p.sz*.6}
              fill={i%3===0?'#ff99bb':i%3===1?'#ffbbdd':'#ffccee'}
              transform={`rotate(${i*37},${p.x},${p.y})`} />
          </motion.g>
        ))}
      </svg>
    );
  }

  if (id === 'neon') {
    const R = (n: number) => Math.round(n);
    const blds = [
      {x:0,       bw:R(w*.12), bh:.72, col:'#07001a', nc:'#ff00ff', tag:'電', wr:6,wc:3},
      {x:R(w*.11),bw:R(w*.09), bh:.50, col:'#040014', nc:'#00ffff', tag:'夜', wr:4,wc:2},
      {x:R(w*.19),bw:R(w*.14), bh:.82, col:'#09001f', nc:'#ff0099', tag:'光', wr:7,wc:3},
      {x:R(w*.32),bw:R(w*.08), bh:.55, col:'#050016', nc:'#44ffaa', tag:'店', wr:4,wc:2},
      {x:R(w*.60),bw:R(w*.09), bh:.65, col:'#07001d', nc:'#4400ff', tag:'飯', wr:5,wc:2},
      {x:R(w*.68),bw:R(w*.10), bh:.74, col:'#09001c', nc:'#ff8800', tag:'酒', wr:6,wc:2},
      {x:R(w*.77),bw:R(w*.12), bh:.58, col:'#060019', nc:'#00ccff', tag:'歌', wr:4,wc:3},
      {x:R(w*.88),bw:R(w*.08), bh:.68, col:'#070017', nc:'#ff44aa', tag:'夢', wr:5,wc:2},
      {x:R(w*.95),bw:R(w*.06), bh:.60, col:'#040014', nc:'#88ff00', tag:'都', wr:4,wc:2},
    ];
    const stars = Array.from({length:65},(_,i)=>({x:(i*71.3)%w,y:(i*43.7)%(h*.58),
      s:i%11===0?2.5:i%5===0?1.5:1,col:i%7===0?'#aae8ff':i%5===0?'#ffeeaa':'#fff'}));
    const rainDrops = Array.from({length:30},(_,i)=>({x:(i*37.4)%w,delay:(i*.15)%2.5}));
    return (
      <svg width={w} height={h} style={{ display: 'block', shapeRendering: 'crispEdges' }}>
        <defs>
          <linearGradient id={`${uid}ns`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#010010" /><stop offset="50%" stopColor="#04001c" />
            <stop offset="100%" stopColor="#0c0038" />
          </linearGradient>
          <linearGradient id={`${uid}nr`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0020" /><stop offset="100%" stopColor="#04000c" />
          </linearGradient>
        </defs>
        {/* Sky */}
        <rect width={w} height={h} fill={`url(#${uid}ns)`} />
        {/* Stars */}
        {stars.map((s,i)=>(
          <motion.rect key={i} x={s.x} y={s.y} width={s.s} height={s.s} fill={s.col}
            animate={{opacity:[.15,.92,.15]}} transition={{duration:1.5+(i%6)*.5,repeat:Infinity,delay:i*.06}} />
        ))}
        {/* Crescent moon */}
        <circle cx={R(w*.82)} cy={R(h*.08)} r={13} fill="#eeeebb" />
        <circle cx={R(w*.85)} cy={R(h*.075)} r={10} fill="#04001c" />
        {/* Overhead train trestle */}
        <rect x={0} y={R(h*.28)} width={w} height={5} fill="#1a1a2a" />
        <rect x={0} y={R(h*.33)} width={w} height={3} fill="#111120" />
        {Array.from({length:Math.ceil(w/40)},(_,i)=>(
          <rect key={i} x={R(i*40)} y={R(h*.28)} width={5} height={R(h*.12)} fill="#111120" />
        ))}
        {/* Telephone poles and wires */}
        {[.15,.45,.75].map((px,i)=>(
          <g key={i}>
            <rect x={R(w*px)} y={R(h*.14)} width={3} height={R(h*.25)} fill="#1a1825" />
            <rect x={R(w*px-8)} y={R(h*.16)} width={18} height={2} fill="#1a1825" />
          </g>
        ))}
        {[R(h*.17),R(h*.21)].map((wy,i)=>(
          <path key={i} d={`M0,${wy} Q${R(w*.3)},${wy+6} ${R(w*.6)},${wy-4} Q${R(w*.85)},${wy+5} ${w},${wy+2}`}
            stroke="#0e0d1c" strokeWidth={1} fill="none" opacity={.75} />
        ))}
        {/* BUILDINGS with detailed facades */}
        {blds.map((b,i)=>{
          const bTop=R(h*(1-b.bh));const bH=R(h*b.bh);
          return (
            <g key={i}>
              <rect x={b.x} y={bTop} width={b.bw} height={bH} fill={b.col} />
              {/* Rooftop edge */}
              <motion.rect x={b.x} y={bTop} width={b.bw} height={3} fill={b.nc}
                animate={{opacity:[.6,1,.6]}} transition={{duration:2+i*.3,repeat:Infinity}} />
              {/* Antenna */}
              <rect x={b.x+R(b.bw/2)-1} y={bTop-14} width={2} height={14} fill="#223" />
              <motion.rect x={b.x+R(b.bw/2)-2} y={bTop-16} width={4} height={3} fill={b.nc}
                animate={{opacity:[1,0,1]}} transition={{duration:.8+i*.18,repeat:Infinity}} />
              {/* Windows grid */}
              {Array.from({length:b.wr},(_,row)=>Array.from({length:b.wc},(_,col)=>{
                const lit=(i*7+row*3+col*5)%9>2;
                const wx=b.x+3+col*R((b.bw-6)/b.wc);
                const wy=bTop+12+row*R((bH-22)/b.wr);
                const ww=Math.max(4,R((b.bw-6)/b.wc-3));
                const wh=Math.max(4,R((bH-22)/b.wr-4));
                return lit?(
                  <motion.rect key={`${row}-${col}`} x={wx} y={wy} width={ww} height={wh}
                    fill={b.nc} opacity={.42}
                    animate={{opacity:(i*3+row+col)%7===0?[.42,.08,.42]:[.42,.42,.42] as any}}
                    transition={{duration:5+i,repeat:Infinity,delay:row*.5}} />
                ):(
                  <rect key={`${row}-${col}`} x={wx} y={wy} width={ww} height={wh} fill="#111" opacity={.6} />
                );
              }))}
              {/* Neon kanji sign */}
              <motion.text x={b.x+R(b.bw/2)} y={bTop+R(bH*.32)} fontSize={Math.min(R(b.bw*.55),12)}
                fill={b.nc} textAnchor="middle" fontFamily="serif" fontWeight="700" opacity={.88}
                animate={{opacity:[.5,1,.5]}} transition={{duration:2.5+i*.4,repeat:Infinity}}>
                {b.tag}
              </motion.text>
              {/* Building side neon strip */}
              <motion.rect x={b.x+b.bw-2} y={bTop+5} width={2} height={R(bH*.6)} fill={b.nc} opacity={.3}
                animate={{opacity:[.15,.4,.15]}} transition={{duration:3+i*.4,repeat:Infinity}} />
            </g>
          );
        })}
        {/* Storefront level */}
        <rect x={0} y={R(h*.72)} width={w} height={R(h*.12)} fill="#0d0022" />
        {/* Convenience store */}
        <rect x={R(w*.38)} y={R(h*.72)} width={R(w*.22)} height={R(h*.12)} fill="#0a001e" />
        <rect x={R(w*.38)} y={R(h*.72)} width={R(w*.22)} height={4} fill="#ff44aa" opacity={.9} />
        <motion.rect x={R(w*.38)} y={R(h*.72)} width={R(w*.22)} height={4} fill="#ff44aa"
          animate={{opacity:[.5,1,.5]}} transition={{duration:1.8,repeat:Infinity}} />
        <rect x={R(w*.40)} y={R(h*.74)} width={R(w*.18)} height={R(h*.08)} fill="#110028" opacity={.8} />
        {/* Vending machines */}
        {[R(w*.40),R(w*.44),R(w*.52),R(w*.56)].map((vx,i)=>(
          <g key={i}>
            <rect x={vx} y={R(h*.75)} width={R(w*.03)} height={R(h*.07)} fill={['#cc0044','#004488','#228822','#884400'][i]} />
            <motion.rect x={vx+1} y={R(h*.76)} width={R(w*.03)-2} height={R(h*.025)} fill="#fff" opacity={.25}
              animate={{opacity:[.15,.35,.15]}} transition={{duration:2+i*.3,repeat:Infinity}} />
          </g>
        ))}
        {/* WET STREET */}
        <rect x={0} y={R(h*.84)} width={w} height={R(h*.16)} fill={`url(#${uid}nr)`} />
        <rect x={0} y={R(h*.84)} width={w} height={2} fill="#110025" />
        {/* Crosswalk */}
        {Array.from({length:6},(_,i)=>(
          <rect key={i} x={R(w*.42+i*R(w*.03))} y={R(h*.87)} width={R(w*.022)} height={R(h*.06)} fill="#1a1830" opacity={.6} />
        ))}
        {/* Neon reflections on wet street */}
        {['#ff00ff','#00ffff','#ff0099','#4400ff','#ff44aa'].map((c,i)=>(
          <motion.rect key={i} x={R(i*(w/5))} y={R(h*.845)} width={R(w/5)} height={5} fill={c} opacity={.14}
            animate={{opacity:[.08,.22,.08]}} transition={{duration:2+i*.5,repeat:Infinity}} />
        ))}
        {/* Street reflections of buildings */}
        {blds.map((b,i)=>(
          <motion.rect key={i} x={b.x} y={R(h*.845)} width={b.bw} height={R(h*.05)}
            fill={b.nc} opacity={.06}
            animate={{opacity:[.04,.1,.04]}} transition={{duration:3+i*.3,repeat:Infinity}} />
        ))}
        {/* Moving cars */}
        {[{sx:R(w*.08),dir:1,col:'#ffe8aa'},{sx:R(w*.65),dir:-1,col:'#ff4444'}].map((car,i)=>(
          <motion.g key={i}
            animate={{x:car.dir>0?[car.sx-w*0,car.sx+w*1.1]:[car.sx+w*.0,car.sx-w*1.1]}}
            transition={{duration:7+i*2,repeat:Infinity,ease:'linear',delay:i*3.5}}>
            <rect x={0} y={R(h*.9)} width={18} height={6} fill="#151525" rx={2} />
            <circle cx={3} cy={R(h*.9)} r={3} fill={car.col} opacity={.9} />
            <circle cx={14} cy={R(h*.9)} r={3} fill={car.col} opacity={.9} />
          </motion.g>
        ))}
        {/* RAIN (animated) */}
        {rainDrops.map((rd,i)=>(
          <motion.line key={i} x1={R(rd.x)} y1={0} x2={R(rd.x-3)} y2={12}
            stroke="#aaaacc" strokeWidth={.8} opacity={.25}
            animate={{y:[0,h],opacity:[0,.3,0]}}
            transition={{duration:1.2,delay:rd.delay,repeat:Infinity,ease:'linear'}} />
        ))}
      </svg>
    );
  }

  if (id === 'space') {
    const R = (n: number) => Math.round(n);
    const stars = Array.from({length:90},(_,i)=>({
      x:(i*71.3)%w, y:(i*43.7)%(h*.85),
      s:i%13===0?3:i%7===0?2:1,
      col:i%9===0?'#aaddff':i%5===0?'#ffddaa':i%11===0?'#ffaadd':'#fff',
      tw:i%3===0,
    }));
    return (
      <svg width={w} height={h} style={{ display: 'block', shapeRendering: 'crispEdges' }}>
        <defs>
          <radialGradient id={`${uid}sp`} cx=".4" cy=".35" r=".75">
            <stop offset="0%"  stopColor="#28104a" /><stop offset="40%" stopColor="#0e0428" />
            <stop offset="100%" stopColor="#020108" />
          </radialGradient>
          <radialGradient id={`${uid}n1`} cx=".22" cy=".5" r=".65">
            <stop offset="0%"  stopColor="#cc44ff" stopOpacity=".22" />
            <stop offset="100%" stopColor="#220044" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}n2`} cx=".78" cy=".28" r=".55">
            <stop offset="0%"  stopColor="#4488ff" stopOpacity=".18" />
            <stop offset="100%" stopColor="#002288" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}n3`} cx=".5" cy=".7" r=".5">
            <stop offset="0%"  stopColor="#ff4466" stopOpacity=".12" />
            <stop offset="100%" stopColor="#440011" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Deep space background */}
        <rect width={w} height={h} fill={`url(#${uid}sp)`} />
        {/* Three nebula overlays */}
        <rect width={w} height={h} fill={`url(#${uid}n1)`} />
        <rect width={w} height={h} fill={`url(#${uid}n2)`} />
        <rect width={w} height={h} fill={`url(#${uid}n3)`} />
        {/* Milky Way band — diagonal streak of micro stars */}
        {Array.from({length:48},(_,i)=>{
          const bx=R(i*(w/48)+(i%3)*4);
          const by=R(h*.08+(i%9)*5+(bx/w)*h*.38);
          return <rect key={i} x={bx} y={by} width={1.5} height={1.5} fill="#fff" opacity={.18+(i%5)*.04} />;
        })}
        {/* Stars */}
        {stars.map((s,i)=>(
          s.tw?(
            <motion.rect key={i} x={s.x} y={s.y} width={s.s} height={s.s} fill={s.col}
              animate={{opacity:[.1,.95,.1]}} transition={{duration:1.4+(i%7)*.4,repeat:Infinity,delay:i*.055}} />
          ):(
            <rect key={i} x={s.x} y={s.y} width={s.s} height={s.s} fill={s.col} opacity={.32+(i%5)*.08} />
          )
        ))}
        {/* LARGE RINGED PLANET upper-right */}
        <circle cx={R(w*.76)} cy={R(h*.17)} r={R(h*.082)} fill="#3322aa" />
        {/* Planet bands */}
        {[.12,.17,.21].map((by,i)=>(
          <path key={i} d={`M${R(w*.76-h*.08)},${R(h*by+i*3)} Q${R(w*.76)},${R(h*by+i*3-4)} ${R(w*.76+h*.08)},${R(h*by+i*3)}`}
            stroke={['#6655cc','#5544bb','#4433aa'][i]} strokeWidth={2} fill="none" opacity={.55} />
        ))}
        {/* Planet rings */}
        <ellipse cx={R(w*.76)} cy={R(h*.17)} rx={R(h*.15)} ry={R(h*.028)} fill="none" stroke="#9977ee" strokeWidth={3} opacity={.65} />
        <ellipse cx={R(w*.76)} cy={R(h*.17)} rx={R(h*.13)} ry={R(h*.022)} fill="none" stroke="#bbaaff" strokeWidth={1.5} opacity={.45} />
        <ellipse cx={R(w*.76)} cy={R(h*.17)} rx={R(h*.12)} ry={R(h*.019)} fill={`url(#${uid}sp)`} opacity={.35} />
        {/* Planet atmosphere glow */}
        <circle cx={R(w*.76)} cy={R(h*.17)} r={R(h*.092)} fill="none" stroke="#7766dd" strokeWidth={4} opacity={.22} />
        {/* SMALL blue-green planet upper-left */}
        <circle cx={R(w*.18)} cy={R(h*.12)} r={R(h*.048)} fill="#224499" opacity={.92} />
        <circle cx={R(w*.18)} cy={R(h*.12)} r={R(h*.048)} fill="none" stroke="#4488cc" strokeWidth={2} opacity={.6} />
        {/* Ocean band on small planet */}
        <path d={`M${R(w*.13)},${R(h*.12)} Q${R(w*.18)},${R(h*.10)} ${R(w*.23)},${R(h*.12)}`}
          stroke="#88ccff" strokeWidth={1.5} fill="none" opacity={.45} />
        <path d={`M${R(w*.135)},${R(h*.14)} Q${R(w*.18)},${R(h*.135)} ${R(w*.225)},${R(h*.14)}`}
          stroke="#66aadd" strokeWidth={1} fill="none" opacity={.35} />
        {/* Tiny third moon */}
        <circle cx={R(w*.38)} cy={R(h*.08)} r={R(h*.024)} fill="#998877" opacity={.85} />
        <circle cx={R(w*.385)} cy={R(h*.076)} r={R(h*.012)} fill="#776655" opacity={.5} />
        {/* Space station silhouette */}
        <rect x={R(w*.52)} y={R(h*.22)} width={R(w*.06)} height={4} fill="#334455" opacity={.7} />
        <rect x={R(w*.524)} y={R(h*.19)} width={R(w*.052)} height={R(h*.04)} fill="#223344" opacity={.7} />
        <rect x={R(w*.50)} y={R(h*.21)} width={R(w*.1)} height={3} fill="#334455" opacity={.65} />
        {/* Solar panel arms */}
        {[-1,1].map((dir,i)=>(
          <g key={i}>
            <rect x={R(w*.5+dir*(w*.05))} y={R(h*.205)} width={R(w*.04)} height={R(h*.025)} fill="#224488" opacity={.6} />
            <rect x={R(w*.5+dir*(w*.055))} y={R(h*.206)} width={R(w*.03)} height={R(h*.023)} fill="none" stroke="#448888" strokeWidth={.5} opacity={.5} />
          </g>
        ))}
        {/* Asteroids */}
        {[{x:w*.11,y:h*.35,r:5},{x:w*.84,y:h*.40,r:4},{x:w*.44,y:h*.27,r:6},{x:w*.62,y:h*.44,r:3}].map((a,i)=>(
          <g key={i}>
            <circle cx={R(a.x)} cy={R(a.y)} r={a.r} fill="#554433" />
            <circle cx={R(a.x-1)} cy={R(a.y-1)} r={1.5} fill="#443322" opacity={.7} />
            <circle cx={R(a.x+a.r*.4)} cy={R(a.y+a.r*.4)} r={1} fill="#665544" opacity={.5} />
          </g>
        ))}
        {/* SHOOTING STAR */}
        <motion.g animate={{x:[-50,w+60],y:[-25,h*.38]}}
          transition={{duration:2.8,repeat:Infinity,repeatDelay:5.5,ease:'linear'}}>
          <line x1={0} y1={0} x2={35} y2={16} stroke="#fff" strokeWidth={1.8} opacity={.92} />
          <line x1={0} y1={0} x2={60} y2={26} stroke="#fff" strokeWidth={.8} opacity={.38} />
          <circle cx={0} cy={0} r={2} fill="#fff" opacity={.9} />
        </motion.g>
        {/* MOON SURFACE foreground */}
        <rect x={0} y={R(h*.82)} width={w} height={R(h*.18)} fill="#0d0820" />
        <rect x={0} y={R(h*.82)} width={w} height={2} fill="#1e0b38" />
        {/* Surface ridges */}
        {Array.from({length:8},(_,i)=>(
          <ellipse key={i} cx={R((i*41+14)%(w-18))} cy={R(h*.86)} rx={R(11+(i%3)*5)} ry={5} fill="#120628" opacity={.85} />
        ))}
        {/* Craters with rim highlight */}
        {[{cx:w*.14,cy:h*.89,r:7},{cx:w*.44,cy:h*.895,r:9},{cx:w*.70,cy:h*.885,r:6},{cx:w*.86,cy:h*.90,r:5}].map((cr,i)=>(
          <g key={i}>
            <circle cx={R(cr.cx)} cy={R(cr.cy)} r={cr.r} fill="#1a0838" />
            <circle cx={R(cr.cx)} cy={R(cr.cy)} r={cr.r} fill="none" stroke="#2a1050" strokeWidth={1.5} opacity={.7} />
            <circle cx={R(cr.cx-cr.r*.3)} cy={R(cr.cy-cr.r*.3)} r={cr.r*.25} fill="#221040" opacity={.5} />
          </g>
        ))}
        {/* Surface dust sparkles */}
        {Array.from({length:10},(_,i)=>(
          <motion.rect key={i} x={R((i*77+11)%(w-4))} y={R(h*.85+(i%4)*3)} width={1} height={1} fill="#8866aa" opacity={.3}
            animate={{opacity:[.1,.5,.1]}} transition={{duration:2+i*.4,repeat:Infinity,delay:i*.2}} />
        ))}
      </svg>
    );
  }

  if (id === 'beach') {
    const R = (n: number) => Math.round(n);
    return (
      <svg width={w} height={h} style={{ display: 'block', shapeRendering: 'crispEdges' }}>
        <defs>
          <linearGradient id={`${uid}bs`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0e0622" /><stop offset="18%" stopColor="#6e1540" />
            <stop offset="40%"  stopColor="#cc3044" /><stop offset="60%" stopColor="#ee7020" />
            <stop offset="78%"  stopColor="#f8b830" /><stop offset="100%" stopColor="#ffe860" />
          </linearGradient>
          <linearGradient id={`${uid}bo`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2255aa" /><stop offset="50%" stopColor="#1a3a77" />
            <stop offset="100%" stopColor="#0e2250" />
          </linearGradient>
          <linearGradient id={`${uid}bd`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#d8aa3a" /><stop offset="100%" stopColor="#b88828" />
          </linearGradient>
        </defs>
        {/* SKY */}
        <rect width={w} height={R(h*.74)} fill={`url(#${uid}bs)`} />
        {/* God rays from sun */}
        {Array.from({length:7},(_,i)=>{
          const a=(i*26-44)*Math.PI/180;
          return <line key={i} x1={R(w*.52)} y1={R(h*.58)} x2={R(w*.52+Math.cos(a)*w*.6)} y2={R(h*.58+Math.sin(a)*h*.5)}
            stroke="#ffcc44" strokeWidth={R(w*.012)} opacity={.04+i%2*.03} />;
        })}
        {/* SUN */}
        <circle cx={R(w*.52)} cy={R(h*.58)} r={R(h*.14)} fill="#ffcc44" opacity={.20} />
        <circle cx={R(w*.52)} cy={R(h*.58)} r={R(h*.09)} fill="#ffcc44" opacity={.40} />
        <circle cx={R(w*.52)} cy={R(h*.58)} r={R(h*.055)} fill="#ffdd55" opacity={.92} />
        {/* Sunrays */}
        {Array.from({length:12},(_,i)=>{const a=i*30*Math.PI/180,r1=R(h*.065),r2=R(h*.10);return(
          <line key={i} x1={R(w*.52+Math.cos(a)*r1)} y1={R(h*.58+Math.sin(a)*r1)}
            x2={R(w*.52+Math.cos(a)*r2)} y2={R(h*.58+Math.sin(a)*r2)} stroke="#ffcc44" strokeWidth={1.5} opacity={.35} />
        );})}
        {/* Clouds — 3 formations in sunset colors */}
        {[{cx:w*.12,cy:h*.14,s:1.1},{cx:w*.60,cy:h*.11,s:.85},{cx:w*.82,cy:h*.20,s:.7}].map((c,i)=>(
          <g key={i} opacity={.6}>
            <ellipse cx={R(c.cx)} cy={R(c.cy)} rx={R(w*.09*c.s)} ry={R(h*.036*c.s)} fill="#ff9966" />
            <ellipse cx={R(c.cx+w*.044*c.s)} cy={R(c.cy-h*.018*c.s)} rx={R(w*.06*c.s)} ry={R(h*.030*c.s)} fill="#ffaa77" />
            <ellipse cx={R(c.cx-w*.034*c.s)} cy={R(c.cy-h*.014*c.s)} rx={R(w*.05*c.s)} ry={R(h*.024*c.s)} fill="#ff8855" />
            <ellipse cx={R(c.cx+w*.01*c.s)} cy={R(c.cy-h*.030*c.s)} rx={R(w*.04*c.s)} ry={R(h*.022*c.s)} fill="#ffbb88" />
          </g>
        ))}
        {/* Seabirds */}
        {[{x:w*.17,y:h*.26},{x:w*.30,y:h*.20},{x:w*.34,y:h*.23},{x:w*.74,y:h*.29},{x:w*.80,y:h*.26}].map((b,i)=>(
          <motion.g key={i} animate={{y:[0,-5,0],x:[0,6,0]}} transition={{duration:2.5+i*.4,repeat:Infinity,delay:i*.3}}>
            <path d={`M${R(b.x-7)},${R(b.y)} Q${R(b.x)},${R(b.y-6)} ${R(b.x+7)},${R(b.y)}`}
              stroke="#ffaa88" strokeWidth={1.5} fill="none" />
          </motion.g>
        ))}
        {/* Horizon glow line */}
        <rect x={0} y={R(h*.70)} width={w} height={5} fill="#ff9933" opacity={.55} />
        {/* OCEAN — 3 depth layers */}
        <rect x={0} y={R(h*.70)} width={w} height={R(h*.04)} fill="#335599" opacity={.8} />
        <rect x={0} y={R(h*.73)} width={w} height={R(h*.10)} fill={`url(#${uid}bo)`} />
        {/* Sun column reflection */}
        {Array.from({length:6},(_,i)=>(
          <rect key={i} x={R(w*.46+i*5-12)} y={R(h*.71+i*3)} width={R(10-i*1.2)} height={4+i}
            fill="#ffcc44" opacity={.14-i*.018} />
        ))}
        {/* Animated waves */}
        {[h*.735,h*.760,h*.780,h*.800].map((wy,i)=>(
          <motion.path key={i}
            d={`M0,${R(wy)} Q${R(w*.15)},${R(wy-5)} ${R(w*.3)},${R(wy)} Q${R(w*.45)},${R(wy+5)} ${R(w*.6)},${R(wy)} Q${R(w*.75)},${R(wy-4)} ${w},${R(wy)}`}
            stroke={`rgba(255,220,160,${.42-i*.08})`} strokeWidth={2-i*.25} fill="none"
            animate={{d:[
              `M0,${R(wy)} Q${R(w*.15)},${R(wy-5)} ${R(w*.3)},${R(wy)} Q${R(w*.45)},${R(wy+5)} ${R(w*.6)},${R(wy)} Q${R(w*.75)},${R(wy-4)} ${w},${R(wy)}`,
              `M0,${R(wy)} Q${R(w*.15)},${R(wy+5)} ${R(w*.3)},${R(wy)} Q${R(w*.45)},${R(wy-5)} ${R(w*.6)},${R(wy)} Q${R(w*.75)},${R(wy+4)} ${w},${R(wy)}`,
              `M0,${R(wy)} Q${R(w*.15)},${R(wy-5)} ${R(w*.3)},${R(wy)} Q${R(w*.45)},${R(wy+5)} ${R(w*.6)},${R(wy)} Q${R(w*.75)},${R(wy-4)} ${w},${R(wy)}`,
            ]}} transition={{duration:2.8+i*.6,repeat:Infinity,ease:'easeInOut'}} />
        ))}
        {/* Rocks in water */}
        {[{x:w*.22,y:h*.75,rw:12,rh:7},{x:w*.68,y:h*.77,rw:9,rh:5},{x:w*.80,y:h*.74,rw:6,rh:4}].map((r,i)=>(
          <g key={i}>
            <ellipse cx={R(r.x)} cy={R(r.y)} rx={r.rw} ry={r.rh} fill="#334455" opacity={.75} />
            <ellipse cx={R(r.x-r.rw*.3)} cy={R(r.y-r.rh*.4)} rx={r.rw*.5} ry={r.rh*.4} fill="#445566" opacity={.5} />
          </g>
        ))}
        {/* SAILBOAT on horizon */}
        <rect x={R(w*.36)} y={R(h*.685)} width={20} height={3} fill="#998877" opacity={.55} />
        <path d={`M${R(w*.46)},${R(h*.685)} L${R(w*.46)},${R(h*.60)} L${R(w*.56)},${R(h*.685)}`} fill="#ddd" opacity={.40} />
        <path d={`M${R(w*.46)},${R(h*.685)} L${R(w*.46)},${R(h*.63)} L${R(w*.38)},${R(h*.685)}`} fill="#bbb" opacity={.28} />
        {/* SAND */}
        <rect x={0} y={R(h*.82)} width={w} height={R(h*.18)} fill={`url(#${uid}bd)`} />
        <rect x={0} y={R(h*.82)} width={w} height={3} fill="#c09030" opacity={.75} />
        {/* Footprints */}
        {Array.from({length:7},(_,i)=>(
          <ellipse key={i} cx={R(w*(.35+i*.05))} cy={R(h*.87+(i%2)*5)} rx={4} ry={2}
            fill="#c09030" opacity={.45} transform={`rotate(${i%2===0?15:-15},${R(w*(.35+i*.05))},${R(h*.87+(i%2)*5)})`} />
        ))}
        {/* Shells */}
        {[{x:w*.28,c:'#ffccaa'},{x:w*.46,c:'#ffaacc'},{x:w*.62,c:'#ffe8cc'},{x:w*.73,c:'#ffddaa'}].map((sh,i)=>(
          <ellipse key={i} cx={R(sh.x)} cy={R(h*.91+(i%3)*3)} rx={4} ry={3} fill={sh.c} opacity={.82} />
        ))}
        {/* ── LEFT PALM TREE — fully proportional, trunk anchored top=(w*0.105, h*0.10) ── */}
        {/* Trunk shadow */}
        <rect x={R(w*.107)} y={R(h*.10)} width={R(w*.018)} height={R(h*.74)} fill="#3a1a08" opacity={.45} />
        {/* Main trunk */}
        <rect x={R(w*.094)} y={R(h*.10)} width={R(w*.022)} height={R(h*.74)} fill="#7a4520" />
        {/* Highlight stripe */}
        <rect x={R(w*.096)} y={R(h*.10)} width={R(w*.007)} height={R(h*.74)} fill="#9a5a2c" opacity={.50} />
        {/* Trunk rings */}
        {Array.from({length:9},(_,i)=>(
          <rect key={i} x={R(w*.093)} y={R(h*(.13+i*.073))} width={R(w*.025)} height={2} fill="#4a2208" opacity={.70} />
        ))}
        {/* FRONDS — 6 leaves, centers & radii all relative to w/h */}
        {([
          [w*.018, h*.138, w*.088, h*.022, -48],
          [w*.050, h*.112, w*.088, h*.022, -28],
          [w*.088, h*.098, w*.088, h*.022,  -8],
          [w*.138, h*.102, w*.088, h*.022,  15],
          [w*.178, h*.130, w*.088, h*.022,  35],
          [w*.208, h*.168, w*.088, h*.022,  52],
        ] as [number,number,number,number,number][]).map(([cx,cy,rx,ry,da],i)=>(
          <ellipse key={i} cx={R(cx)} cy={R(cy)} rx={R(rx)} ry={R(ry)}
            fill={['#226618','#2a7020','#1e5c16','#286018','#2d7022','#1e5818'][i]}
            transform={`rotate(${da},${R(cx)},${R(cy)})`} />
        ))}
        {/* Frond underside shading */}
        {([
          [w*.018, h*.138, w*.072, h*.013, -48],
          [w*.050, h*.112, w*.072, h*.013, -28],
          [w*.088, h*.098, w*.072, h*.013,  -8],
          [w*.138, h*.102, w*.072, h*.013,  15],
          [w*.178, h*.130, w*.072, h*.013,  35],
        ] as [number,number,number,number,number][]).map(([cx,cy,rx,ry,da],i)=>(
          <ellipse key={i} cx={R(cx)} cy={R(cy)} rx={R(rx)} ry={R(ry)} fill="#163e10" opacity={.42}
            transform={`rotate(${da},${R(cx)},${R(cy)})`} />
        ))}
        {/* Coconuts */}
        <circle cx={R(w*.090)} cy={R(h*.136)} r={R(w*.020)} fill="#553311" />
        <circle cx={R(w*.114)} cy={R(h*.131)} r={R(w*.017)} fill="#5c3815" />
        <circle cx={R(w*.098)} cy={R(h*.158)} r={R(w*.015)} fill="#4a2e10" />

        {/* ── RIGHT PALM TREE — trunk anchored top=(w*0.891, h*0.12) ── */}
        <rect x={R(w*.876)} y={R(h*.12)} width={R(w*.018)} height={R(h*.70)} fill="#3a1a08" opacity={.45} />
        <rect x={R(w*.882)} y={R(h*.12)} width={R(w*.022)} height={R(h*.70)} fill="#7a4520" />
        <rect x={R(w*.884)} y={R(h*.12)} width={R(w*.007)} height={R(h*.70)} fill="#9a5a2c" opacity={.50} />
        {Array.from({length:8},(_,i)=>(
          <rect key={i} x={R(w*.881)} y={R(h*(.15+i*.073))} width={R(w*.025)} height={2} fill="#4a2208" opacity={.70} />
        ))}
        {/* FRONDS (mirrored) */}
        {([
          [w*.982, h*.158, w*.088, h*.022,  48],
          [w*.950, h*.130, w*.088, h*.022,  28],
          [w*.912, h*.116, w*.088, h*.022,   8],
          [w*.862, h*.120, w*.088, h*.022, -15],
          [w*.822, h*.148, w*.088, h*.022, -35],
          [w*.792, h*.186, w*.088, h*.022, -52],
        ] as [number,number,number,number,number][]).map(([cx,cy,rx,ry,da],i)=>(
          <ellipse key={i} cx={R(cx)} cy={R(cy)} rx={R(rx)} ry={R(ry)}
            fill={['#226618','#2a7020','#1e5c16','#286018','#2d7022','#1e5818'][i]}
            transform={`rotate(${da},${R(cx)},${R(cy)})`} />
        ))}
        {([
          [w*.982, h*.158, w*.072, h*.013,  48],
          [w*.950, h*.130, w*.072, h*.013,  28],
          [w*.912, h*.116, w*.072, h*.013,   8],
          [w*.862, h*.120, w*.072, h*.013, -15],
          [w*.822, h*.148, w*.072, h*.013, -35],
        ] as [number,number,number,number,number][]).map(([cx,cy,rx,ry,da],i)=>(
          <ellipse key={i} cx={R(cx)} cy={R(cy)} rx={R(rx)} ry={R(ry)} fill="#163e10" opacity={.42}
            transform={`rotate(${da},${R(cx)},${R(cy)})`} />
        ))}
        {/* Coconuts */}
        <circle cx={R(w*.896)} cy={R(h*.158)} r={R(w*.020)} fill="#553311" />
        <circle cx={R(w*.878)} cy={R(h*.151)} r={R(w*.017)} fill="#5c3815" />
        <circle cx={R(w*.890)} cy={R(h*.180)} r={R(w*.015)} fill="#4a2e10" />
        {/* Beach hut */}
        <rect x={R(w*.66)} y={R(h*.76)} width={R(w*.10)} height={R(h*.065)} fill="#996633" />
        <path d={`M${R(w*.64)},${R(h*.76)} L${R(w*.71)},${R(h*.70)} L${R(w*.78)},${R(h*.76)}`} fill="#cc8844" />
        {/* Beach umbrella */}
        <line x1={R(w*.52)} y1={R(h*.82)} x2={R(w*.52)} y2={R(h*.72)} stroke="#555" strokeWidth={2} />
        <path d={`M${R(w*.42)},${R(h*.72)} Q${R(w*.52)},${R(h*.66)} ${R(w*.62)},${R(h*.72)}`} fill="#ee3322" />
        <path d={`M${R(w*.42)},${R(h*.72)} Q${R(w*.52)},${R(h*.68)} ${R(w*.62)},${R(h*.72)}`} fill="#ff5544" opacity={.55} />
        {/* Striped umbrella segments */}
        {[w*.44,w*.50,w*.56].map((ux,i)=>(
          <path key={i} d={`M${R(ux)},${R(h*.72)} Q${R(ux+w*.01)},${R(h*.67)} ${R(ux+w*.02)},${R(h*.72)}`}
            fill="#fff" opacity={.2} />
        ))}
        {/* LIGHTHOUSE */}
        <rect x={R(w*.91)} y={R(h*.54)} width={10} height={R(h*.28)} fill="#ddddcc" />
        <rect x={R(w*.905)} y={R(h*.52)} width={12} height={R(h*.04)} fill="#cc2200" />
        <motion.rect x={R(w*.915)} y={R(h*.535)} width={8} height={R(h*.025)} fill="#ffffaa"
          animate={{opacity:[.3,1,.3]}} transition={{duration:2.5,repeat:Infinity}} />
        {/* Lighthouse stripes */}
        {[.57,.62,.67].map((ly,i)=>(
          <rect key={i} x={R(w*.91)} y={R(h*ly)} width={10} height={4} fill="#cc3300" opacity={.45} />
        ))}
      </svg>
    );
  }

  if (id === 'festival') {
    const R = (n: number) => Math.round(n);
    const FC = ['#ff4400','#ffcc00','#ff0088','#4400ff','#00cc88','#ff8800','#44ffcc','#ff44aa'];
    const stars = Array.from({length:55},(_,i)=>({x:(i*71.3)%w,y:(i*43.7)%(h*.55)}));
    const fwBursts = [
      {cx:w*.18,cy:h*.14,col:FC[0],rays:14,r:h*.08,delay:0},
      {cx:w*.52,cy:h*.07,col:FC[1],rays:16,r:h*.09,delay:1.3},
      {cx:w*.74,cy:h*.18,col:FC[3],rays:12,r:h*.07,delay:.7},
      {cx:w*.35,cy:h*.22,col:FC[6],rays:10,r:h*.06,delay:2.0},
      {cx:w*.88,cy:h*.13,col:FC[7],rays:12,r:h*.07,delay:1.8},
    ];
    return (
      <svg width={w} height={h} style={{ display: 'block', shapeRendering: 'crispEdges' }}>
        <defs>
          <linearGradient id={`${uid}fs`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#010010" /><stop offset="55%" stopColor="#070020" />
            <stop offset="100%" stopColor="#160828" />
          </linearGradient>
        </defs>
        {/* Night sky */}
        <rect width={w} height={h} fill={`url(#${uid}fs)`} />
        {/* Stars */}
        {stars.map((s,i)=>(
          <rect key={i} x={R(s.x)} y={R(s.y)} width={i%9===0?2:1} height={i%9===0?2:1}
            fill="#fff" opacity={.2+(i%5)*.08} />
        ))}
        {/* Full moon */}
        <circle cx={R(w*.8)} cy={R(h*.09)} r={18} fill="#e8e8cc" opacity={.92} />
        <ellipse cx={R(w*.82)} cy={R(h*.085)} rx={11} ry={6} fill="#181828" opacity={.28} />
        <ellipse cx={R(w*.78)} cy={R(h*.095)} rx={9} ry={5} fill="#181828" opacity={.18} />
        {/* Moon craters */}
        {[{cx:w*.77,cy:h*.07,r:2},{cx:w*.82,cy:h*.10,r:3},{cx:w*.79,cy:h*.12,r:1.5}].map((cr,i)=>(
          <circle key={i} cx={R(cr.cx)} cy={R(cr.cy)} r={cr.r} fill="none" stroke="#cccc99" strokeWidth={.8} opacity={.3} />
        ))}
        {/* FIREWORK BURSTS */}
        {fwBursts.map((fw,fi)=>(
          <motion.g key={fi} animate={{opacity:[0,.95,.8,0]}}
            transition={{duration:2.8,repeat:Infinity,delay:fw.delay,repeatDelay:1.8}}>
            {/* Burst rays */}
            {Array.from({length:fw.rays},(_,i)=>{
              const a=(i*(360/fw.rays))*Math.PI/180;
              return(
                <g key={i}>
                  <line x1={R(fw.cx)} y1={R(fw.cy)} x2={R(fw.cx+Math.cos(a)*fw.r)} y2={R(fw.cy+Math.sin(a)*fw.r)}
                    stroke={fw.col} strokeWidth={1.8} opacity={.9} />
                  <circle cx={R(fw.cx+Math.cos(a)*fw.r)} cy={R(fw.cy+Math.sin(a)*fw.r)} r={2.5} fill={fw.col} />
                  {/* Secondary sparkle */}
                  <circle cx={R(fw.cx+Math.cos(a)*fw.r*.6)} cy={R(fw.cy+Math.sin(a)*fw.r*.6)} r={1.2} fill="#fff" opacity={.7} />
                </g>
              );
            })}
            {/* Center flash */}
            <circle cx={R(fw.cx)} cy={R(fw.cy)} r={4} fill="#fff" opacity={.9} />
          </motion.g>
        ))}
        {/* Distant TEMPLE silhouette */}
        <rect x={R(w*.4)} y={R(h*.32)} width={R(w*.2)} height={R(h*.14)} fill="#0c0418" opacity={.8} />
        <path d={`M${R(w*.37)},${R(h*.32)} L${R(w*.5)},${R(h*.26)} L${R(w*.63)},${R(h*.32)}`} fill="#0c0418" opacity={.8} />
        <rect x={R(w*.43)} y={R(h*.24)} width={R(w*.14)} height={R(h*.09)} fill="#0c0418" opacity={.75} />
        <path d={`M${R(w*.41)},${R(h*.24)} L${R(w*.5)},${R(h*.19)} L${R(w*.59)},${R(h*.24)}`} fill="#0c0418" opacity={.75} />
        {/* TORII GATE — prominent, spans wide */}
        <rect x={R(w*.08)} y={R(h*.30)} width={R(w*.84)} height={9} fill="#cc2200" />
        <rect x={R(w*.06)} y={R(h*.335)} width={R(w*.88)} height={6} fill="#dd3300" />
        {/* Torii pillars */}
        <rect x={R(w*.12)} y={R(h*.36)} width={13} height={R(h*.42)} fill="#bb1800" />
        <rect x={R(w*.80)} y={R(h*.36)} width={13} height={R(h*.42)} fill="#bb1800" />
        <rect x={R(w*.10)} y={R(h*.78)} width={18} height={6} fill="#991200" />
        <rect x={R(w*.78)} y={R(h*.78)} width={18} height={6} fill="#991200" />
        {/* Decorative torii detail */}
        <rect x={R(w*.14)} y={R(h*.48)} width={9} height={4} fill="#dd3300" opacity={.5} />
        <rect x={R(w*.80)} y={R(h*.48)} width={9} height={4} fill="#dd3300" opacity={.5} />
        {/* STRING LIGHTS — 2 rows */}
        {[h*.08,h*.14].map((wy,li)=>(
          <g key={li}>
            <path d={`M0,${R(wy)} Q${R(w*.25)},${R(wy+h*.04)} ${R(w*.5)},${R(wy)} Q${R(w*.75)},${R(wy-h*.03)} ${w},${R(wy)}`}
              stroke="#442200" strokeWidth={1} fill="none" />
            {Array.from({length:12},(_,i)=>{
              const px=R((i+.5)*(w/12));
              const py=R(wy+Math.sin(i*Math.PI/6)*h*.035);
              return(
                <motion.g key={i}>
                  <ellipse cx={px} cy={py+6} rx={6} ry={8} fill={FC[i%8]} opacity={.92}
                    animate={{opacity:[.6,1,.6]}} transition={{duration:1.2+i*.14,repeat:Infinity,delay:li*.3+i*.08}} />
                  <ellipse cx={px} cy={py+5} rx={4} ry={3} fill="#fff" opacity={.15} />
                </motion.g>
              );
            })}
          </g>
        ))}
        {/* HANGING LANTERNS — chochin */}
        {[w*.03,w*.08,w*.88,w*.94].map((lx,i)=>(
          <motion.g key={i} animate={{y:[0,-6,0]}} transition={{duration:2.2+i*.3,repeat:Infinity,delay:i*.4}}>
            <rect x={R(lx-1)} y={R(h*.26)} width={2} height={14} fill="#553300" />
            <ellipse cx={R(lx)} cy={R(h*.37)} rx={9} ry={13} fill={FC[i%4]} opacity={.92} />
            <ellipse cx={R(lx)} cy={R(h*.35)} rx={7} ry={4} fill="#fff" opacity={.14} />
            <line x1={R(lx-9)} y1={R(h*.345)} x2={R(lx+9)} y2={R(h*.345)} stroke={FC[i%4]} strokeWidth={1} opacity={.5} />
            <line x1={R(lx-9)} y1={R(h*.395)} x2={R(lx+9)} y2={R(h*.395)} stroke={FC[i%4]} strokeWidth={1} opacity={.5} />
            <motion.ellipse cx={R(lx)} cy={R(h*.48)} rx={18} ry={6} fill={FC[i%4]} opacity={.12}
              animate={{opacity:[.06,.2,.06]}} transition={{duration:2.2+i*.3,repeat:Infinity}} />
          </motion.g>
        ))}
        {/* FOOD STALLS — 3 stalls */}
        {[{sx:w*.03,col:FC[0]},{sx:w*.81,col:FC[2]},{sx:w*.42,col:FC[5]}].map((st,i)=>(
          <g key={i}>
            <rect x={R(st.sx)} y={R(h*.56)} width={R(w*.14)} height={R(h*.22)} fill="#140808" />
            <rect x={R(st.sx-3)} y={R(h*.52)} width={R(w*.14+6)} height={7} fill={st.col} opacity={.82} />
            {/* Counter */}
            <rect x={R(st.sx+2)} y={R(h*.68)} width={R(w*.13)} height={4} fill="#222" />
            {/* Products */}
            {[3,10,17].map((dx,j)=>(
              <rect key={j} x={R(st.sx+dx)} y={R(h*.59)} width={5} height={8} fill={FC[(i+j)%8]} opacity={.75} />
            ))}
            {/* Glow from stall */}
            <motion.rect x={R(st.sx)} y={R(h*.56)} width={R(w*.14)} height={R(h*.22)} fill={st.col} opacity={.04}
              animate={{opacity:[.02,.08,.02]}} transition={{duration:2+i*.4,repeat:Infinity}} />
          </g>
        ))}
        {/* GROUND */}
        <rect x={0} y={R(h*.78)} width={w} height={R(h*.22)} fill="#0e0716" />
        <rect x={R(w*.35)} y={R(h*.78)} width={R(w*.30)} height={R(h*.22)} fill="#180c22" opacity={.8} />
        {/* Stone path tiles */}
        {Array.from({length:7},(_,i)=>(
          <rect key={i} x={R(w*.37+i*(w*.04))} y={R(h*.80+i*3)} width={R(w*.038)} height={7} fill="#221828" opacity={.8} />
        ))}
        {/* CROWD silhouette */}
        {Array.from({length:18},(_,i)=>{
          const cx=R((i*23+6)%(w-10));const ch=R(18+(i%5)*5);
          return <rect key={i} x={cx} y={R(h*.78-ch)} width={i%3===0?10:7} height={ch} fill="#060010" opacity={.8} />;
        })}
      </svg>
    );
  }

  if (id === 'rainbow') {
    const R = (n: number) => Math.round(n);
    const confetti = Array.from({length:32},(_,i)=>({
      x:(i*71)%w, y:(i*43)%(h*.85),
      col:['#ff4488','#44aaff','#ffcc00','#44ff88','#ff8800','#aa44ff','#ff88cc','#00ccff'][i%8],
      r:i*28, w2:4+(i%3)*3, h2:3+(i%2)*2,
    }));
    return (
      <svg width={w} height={h} style={{ display: 'block', shapeRendering: 'crispEdges' }}>
        <defs>
          <linearGradient id={`${uid}rs`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#d0e8ff" /><stop offset="50%" stopColor="#f4e0ff" />
            <stop offset="100%" stopColor="#fff4ff" />
          </linearGradient>
          <linearGradient id={`${uid}rg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#e8ffe0" /><stop offset="100%" stopColor="#c4eaaa" />
          </linearGradient>
          <radialGradient id={`${uid}su`} cx=".5" cy=".3" r=".5">
            <stop offset="0%"   stopColor="#fffbe0" stopOpacity=".85" />
            <stop offset="100%" stopColor="#ffee00" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Pastel sky */}
        <rect width={w} height={h} fill={`url(#${uid}rs)`} />
        {/* Sun glow */}
        <rect width={w} height={h} fill={`url(#${uid}su)`} />
        {/* Happy sun face top-center */}
        <circle cx={R(w*.5)} cy={R(h*.09)} r={R(h*.065)} fill="#ffe055" opacity={.9} />
        {Array.from({length:8},(_,i)=>{const a=i*45*Math.PI/180,r1=R(h*.075),r2=R(h*.105);return(
          <line key={i} x1={R(w*.5+Math.cos(a)*r1)} y1={R(h*.09+Math.sin(a)*r1)}
            x2={R(w*.5+Math.cos(a)*r2)} y2={R(h*.09+Math.sin(a)*r2)} stroke="#ffcc00" strokeWidth={2.5} opacity={.8} />
        );})}
        {/* RAINBOW ARCS — 7 colors, layered */}
        {[
          {c:'#ff2020',sw:10},{c:'#ff8800',sw:9},{c:'#ffee00',sw:9},
          {c:'#44cc00',sw:8},{c:'#0099ff',sw:8},{c:'#6600ff',sw:7},{c:'#cc00cc',sw:6},
        ].map((rb,i)=>(
          <path key={i} d={`M${-10+i*7},${R(h*.92)} Q${R(w*.5)},${R(h*(-.02+i*.058))} ${w+10-i*7},${R(h*.92)}`}
            fill="none" stroke={rb.c} strokeWidth={rb.sw} opacity={.58-i*.03} />
        ))}
        {/* Light sheen on rainbow */}
        {[0,1,2,3,4,5,6].map(i=>(
          <path key={i} d={`M${-10+i*7},${R(h*.92)} Q${R(w*.5)},${R(h*(-.02+i*.058))} ${w+10-i*7},${R(h*.92)}`}
            fill="none" stroke="#fff" strokeWidth={1} opacity={.12} />
        ))}
        {/* FLUFFY CLOUDS — 4 formations */}
        {[{cx:w*.08,cy:h*.17,s:1.2},{cx:w*.52,cy:h*.13,s:1},{cx:w*.80,cy:h*.21,s:.85},{cx:w*.3,cy:h*.08,s:.65}].map((c,i)=>(
          <g key={i}>
            <ellipse cx={R(c.cx)} cy={R(c.cy)} rx={R(w*.10*c.s)} ry={R(h*.042*c.s)} fill="#fff" opacity={.92} />
            <ellipse cx={R(c.cx+w*.05*c.s)} cy={R(c.cy-h*.022*c.s)} rx={R(w*.075*c.s)} ry={R(h*.036*c.s)} fill="#fff" opacity={.88} />
            <ellipse cx={R(c.cx-w*.042*c.s)} cy={R(c.cy-h*.018*c.s)} rx={R(w*.062*c.s)} ry={R(h*.030*c.s)} fill="#fff" opacity={.84} />
            <ellipse cx={R(c.cx+w*.012*c.s)} cy={R(c.cy-h*.034*c.s)} rx={R(w*.052*c.s)} ry={R(h*.026*c.s)} fill="#fff" opacity={.80} />
            <ellipse cx={R(c.cx-w*.022*c.s)} cy={R(c.cy+h*.008*c.s)} rx={R(w*.042*c.s)} ry={R(h*.022*c.s)} fill="#fff" opacity={.78} />
          </g>
        ))}
        {/* ANIMATED SPARKLE STARS */}
        {Array.from({length:22},(_,i)=>{
          const sx=R((i*53+20)%(w-20)); const sy=R(16+(i*37)%(h*.72));
          return(
            <motion.g key={i} animate={{opacity:[.2,1,.2],scale:[.7,1.4,.7]}}
              transition={{duration:1.2+(i%5)*.3,repeat:Infinity,delay:i*.16}}
              style={{transformOrigin:`${sx}px ${sy}px`,transformBox:'fill-box'}}>
              <line x1={sx-5} y1={sy} x2={sx+5} y2={sy} stroke="#ffcc00" strokeWidth={1.5} />
              <line x1={sx} y1={sy-5} x2={sx} y2={sy+5} stroke="#ffcc00" strokeWidth={1.5} />
              <circle cx={sx} cy={sy} r={2} fill="#fff8aa" />
            </motion.g>
          );
        })}
        {/* FLOATING HEARTS */}
        {[{x:w*.12,y:h*.32,c:'#ff4488'},{x:w*.42,y:h*.28,c:'#ff88cc'},{x:w*.72,y:h*.34,c:'#ffaacc'},
          {x:w*.26,y:h*.50,c:'#ff5599'},{x:w*.84,y:h*.44,c:'#ff44aa'}].map((hrt,i)=>(
          <motion.text key={i} x={R(hrt.x)} y={R(hrt.y)} fontSize={15}
            fill={hrt.c} textAnchor="middle" opacity={.82}
            animate={{y:[R(hrt.y),R(hrt.y-h*.06),R(hrt.y)]}}
            transition={{duration:2+i*.5,repeat:Infinity,delay:i*.3}}>
            ♥
          </motion.text>
        ))}
        {/* BUTTERFLIES */}
        {[{x:w*.22,y:h*.45,c:'#ff88cc'},{x:w*.62,y:h*.38,c:'#88aaff'},{x:w*.44,y:h*.60,c:'#ffcc44'}].map((bf,i)=>(
          <motion.g key={i} animate={{x:[R(bf.x),R(bf.x+w*.06),R(bf.x)],y:[R(bf.y),R(bf.y-h*.04),R(bf.y)]}}
            transition={{duration:2.8+i*.5,repeat:Infinity,ease:'easeInOut',delay:i*.6}}>
            <ellipse cx={-6} cy={0} rx={7} ry={4} fill={bf.c} opacity={.7} transform="rotate(-20,-6,0)" />
            <ellipse cx={6} cy={0} rx={7} ry={4} fill={bf.c} opacity={.7} transform="rotate(20,6,0)" />
            <rect x={-1} y={-5} width={2} height={10} fill="#554433" />
          </motion.g>
        ))}
        {/* FLOWER MEADOW ground */}
        <rect x={0} y={R(h*.82)} width={w} height={R(h*.18)} fill={`url(#${uid}rg)`} />
        <rect x={0} y={R(h*.82)} width={w} height={2} fill="#88cc66" />
        {/* Grass blades */}
        {Array.from({length:20},(_,i)=>(
          <rect key={i} x={R((i*23+4)%(w-4))} y={R(h*.80)} width={2} height={R(h*.04)} fill="#55aa44" opacity={.6} />
        ))}
        {/* Detailed flowers */}
        {Array.from({length:18},(_,i)=>{
          const fx=R((i*24+6)%(w-8)); const fy=R(h*.86+(i%4)*3);
          const col=['#ff4488','#ffcc00','#44aaff','#ff8800','#cc44ff','#44ffcc'][i%6];
          return(
            <g key={i}>
              {/* Petals */}
              {[0,60,120,180,240,300].map(ang=>(
                <circle key={ang} cx={R(fx+Math.cos(ang*Math.PI/180)*5)} cy={R(fy+Math.sin(ang*Math.PI/180)*5)}
                  r={3} fill={col} opacity={.75} />
              ))}
              <circle cx={fx} cy={fy} r={2.5} fill="#ffff88" />
              {/* Stem */}
              <rect x={fx-1} y={fy+3} width={2} height={5} fill="#44aa22" />
            </g>
          );
        })}
        {/* FALLING CONFETTI */}
        {confetti.map((c,i)=>(
          <motion.rect key={i} x={c.x} y={c.y} width={c.w2} height={c.h2} fill={c.col} opacity={.72}
            transform={`rotate(${c.r},${c.x+c.w2/2},${c.y+c.h2/2})`}
            animate={{y:[c.y,c.y+h*.55],opacity:[.72,0]}}
            transition={{duration:3+(i%5)*.5,delay:(i*.32)%4,repeat:Infinity,ease:'linear'}} />
        ))}
        {/* Rainbow mushrooms near ground */}
        {[{x:w*.08,c:'#ff4444'},{x:w*.88,c:'#ff8844'},{x:w*.50,c:'#cc44ff'}].map((m,i)=>(
          <g key={i}>
            <rect x={R(m.x-2)} y={R(h*.86)} width={4} height={R(h*.04)} fill="#aa8866" />
            <ellipse cx={R(m.x)} cy={R(h*.86)} rx={9} ry={7} fill={m.c} opacity={.85} />
            {[-.4,0,.4].map((dx,j)=>(
              <circle key={j} cx={R(m.x+dx*8)} cy={R(h*.84)} r={2} fill="#fff" opacity={.65} />
            ))}
          </g>
        ))}
      </svg>
    );
  }

  if (id === 'bamboo') {
    const R = (n: number) => Math.round(n);
    // 4 depth layers: deepest → front
    const layer1 = Array.from({length:14},(_,i)=>({x:R((i*23+4)%(w-4)), bw:4,  bh:.60+(i%4)*.08, op:.22+(i%3)*.06, col:'#1a3a0e'}));
    const layer2 = Array.from({length:11},(_,i)=>({x:R((i*27+10)%(w-6)),bw:7,  bh:.68+(i%4)*.09, op:.40+(i%3)*.08, col:'#244d15'}));
    const layer3 = Array.from({length:9}, (_,i)=>({x:R((i*31+8)%(w-10)),bw:10, bh:.76+(i%3)*.08, op:.58+(i%3)*.08, col:'#2d6618'}));
    const layer4 = Array.from({length:6}, (_,i)=>({x:R((i*44+2)%(w-14)),bw:14, bh:.84+(i%3)*.08, op:.78+(i%2)*.08, col:'#266214'}));
    return (
      <svg width={w} height={h} style={{ display: 'block', shapeRendering: 'crispEdges' }}>
        <defs>
          <linearGradient id={`${uid}ba`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0c1e08" /><stop offset="40%" stopColor="#142a0e" />
            <stop offset="100%" stopColor="#081408" />
          </linearGradient>
          <linearGradient id={`${uid}bf`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#88bb88" stopOpacity="0" />
            <stop offset="60%"  stopColor="#aaccaa" stopOpacity=".18" />
            <stop offset="100%" stopColor="#cceecc" stopOpacity=".40" />
          </linearGradient>
          <linearGradient id={`${uid}bw`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2a5540" /><stop offset="100%" stopColor="#1a3828" />
          </linearGradient>
        </defs>
        {/* Dark forest background */}
        <rect width={w} height={h} fill={`url(#${uid}ba)`} />
        {/* Canopy light glow top */}
        <ellipse cx={R(w*.5)} cy={0} rx={R(w*.45)} ry={R(h*.22)} fill="#88cc44" opacity={.07} />
        <ellipse cx={R(w*.3)} cy={0} rx={R(w*.25)} ry={R(h*.15)} fill="#aad870" opacity={.04} />
        {/* LAYER 1 — deepest stalks */}
        {layer1.map((b,i)=>(
          <g key={i}>
            <rect x={b.x} y={R(h*(1-b.bh))} width={b.bw} height={R(h*b.bh)} fill={b.col} opacity={b.op} />
            {Array.from({length:8},(_,s)=>(
              <rect key={s} x={b.x} y={R(h*(1-b.bh)+s*(h*b.bh/8))} width={b.bw} height={1.5} fill="#0e2808" opacity={b.op*.9} />
            ))}
          </g>
        ))}
        {/* DAPPLED LIGHT RAYS */}
        {[w*.14,w*.32,w*.56,w*.72,w*.88].map((lx,i)=>(
          <rect key={i} x={R(lx-2)} y={0} width={R(4+(i%2)*2)} height={R(h*.85)}
            fill="#ccffaa" opacity={.028+(i%2)*.018} />
        ))}
        {/* Background TORII gate barely visible */}
        <rect x={R(w*.42)} y={R(h*.28)} width={R(w*.16)} height={5} fill="#cc1100" opacity={.38} />
        <rect x={R(w*.44)} y={R(h*.32)} width={5} height={R(h*.28)} fill="#aa0e00" opacity={.33} />
        <rect x={R(w*.55)} y={R(h*.32)} width={5} height={R(h*.28)} fill="#aa0e00" opacity={.33} />
        {/* LAYER 2 — mid-back stalks */}
        {layer2.map((b,i)=>(
          <g key={i}>
            <rect x={b.x} y={R(h*(1-b.bh))} width={b.bw} height={R(h*b.bh)} fill={b.col} opacity={b.op} />
            {Array.from({length:7},(_,s)=>(
              <rect key={s} x={b.x} y={R(h*(1-b.bh)+s*(h*b.bh/7))} width={b.bw} height={2} fill="#183808" opacity={b.op*.85} />
            ))}
            {/* Leaves at top */}
            {[[-14,-12,28],[10,-16,-32],[-6,-20,48]].map(([dx,dy,da],li)=>(
              <motion.ellipse key={li} cx={b.x+b.bw/2+dx} cy={R(h*(1-b.bh)+10+dy)}
                rx={11} ry={4} fill="#336818" opacity={b.op*.65}
                transform={`rotate(${da},${b.x+b.bw/2+dx},${R(h*(1-b.bh)+10+dy)})`}
                animate={{rotate:[da,da+9,da]}} transition={{duration:2.8+i*.3,repeat:Infinity}} />
            ))}
          </g>
        ))}
        {/* Stone LANTERN beside path */}
        <rect x={R(w*.72)} y={R(h*.58)} width={9} height={R(h*.24)} fill="#4a4a38" opacity={.7} />
        <rect x={R(w*.71)} y={R(h*.58)} width={11} height={4} fill="#3a3a28" opacity={.7} />
        <rect x={R(w*.70)} y={R(h*.52)} width={13} height={R(h*.07)} fill="#555544" opacity={.65} />
        <rect x={R(w*.72)} y={R(h*.535)} width={9} height={R(h*.054)} fill="#666655" opacity={.6} />
        <motion.rect x={R(w*.74)} y={R(h*.545)} width={5} height={R(h*.033)} fill="#ffe870" opacity={.72}
          animate={{opacity:[.42,.9,.52,.9,.42]}} transition={{duration:3.2,repeat:Infinity}} />
        <motion.ellipse cx={R(w*.765)} cy={R(h*.78)} rx={14} ry={5} fill="#ffe870" opacity={.08}
          animate={{opacity:[.04,.14,.04]}} transition={{duration:3.2,repeat:Infinity}} />
        {/* STREAM */}
        <rect x={R(w*.05)} y={R(h*.77)} width={R(w*.30)} height={R(h*.065)} fill={`url(#${uid}bw)`} opacity={.78} />
        <rect x={R(w*.05)} y={R(h*.77)} width={R(w*.30)} height={2} fill="#4a8866" opacity={.65} />
        {/* Stream ripples */}
        {[.1,.18,.26].map((rx,i)=>(
          <motion.ellipse key={i} cx={R(w*rx)} cy={R(h*.79)} rx={8} ry={2} fill="none" stroke="#6aaa88" strokeWidth={1} opacity={.35}
            animate={{rx:[8,12,8],opacity:[.35,.1,.35]}} transition={{duration:2+i*.5,repeat:Infinity}} />
        ))}
        {/* Stepping stones */}
        {[.38,.49,.58,.67].map((sx,i)=>(
          <ellipse key={i} cx={R(w*sx)} cy={R(h*.835+(i%2)*4)} rx={13} ry={7} fill="#353522" opacity={.78} />
        ))}
        {/* LAYER 3 — mid-front stalks */}
        {layer3.map((b,i)=>(
          <g key={i}>
            <rect x={b.x} y={R(h*(1-b.bh))} width={b.bw} height={R(h*b.bh)} fill={b.col} opacity={b.op} />
            {Array.from({length:6},(_,s)=>(
              <rect key={s} x={b.x} y={R(h*(1-b.bh)+s*(h*b.bh/6))} width={b.bw} height={2.5} fill="#1c4010" opacity={b.op*.88} />
            ))}
            <rect x={b.x+1} y={R(h*(1-b.bh))} width={2} height={R(h*b.bh)} fill="#66cc44" opacity={b.op*.30} />
            {/* Leaves */}
            {[[-16,-14,32],[12,-18,-36],[-8,-22,52],[18,-10,-20]].map(([dx,dy,da],li)=>(
              <motion.ellipse key={li} cx={b.x+b.bw/2+dx} cy={R(h*(1-b.bh)+12+dy)}
                rx={12} ry={4.5} fill="#2d6618" opacity={b.op*.72}
                transform={`rotate(${da},${b.x+b.bw/2+dx},${R(h*(1-b.bh)+12+dy)})`}
                animate={{rotate:[da,da+10,da]}} transition={{duration:2.5+i*.35,repeat:Infinity}} />
            ))}
          </g>
        ))}
        {/* FIREFLIES */}
        {Array.from({length:8},(_,i)=>(
          <motion.circle key={i} cx={R((i*77+20)%(w-20))} cy={R(h*(.45+i*.05))} r={2}
            fill="#ccff88" opacity={.7}
            animate={{opacity:[0,.8,0],cx:[R((i*77+20)%(w-20)),R((i*77+30)%(w-20)),R((i*77+20)%(w-20))]}}
            transition={{duration:2.5+i*.4,repeat:Infinity,delay:i*.35}} />
        ))}
        {/* LAYER 4 — foreground stalks */}
        {layer4.map((b,i)=>(
          <g key={i}>
            <rect x={b.x} y={R(h*(1-b.bh))} width={b.bw} height={R(h*b.bh)} fill={b.col} opacity={b.op} />
            {Array.from({length:5},(_,s)=>(
              <rect key={s} x={b.x} y={R(h*(1-b.bh)+s*(h*b.bh/5))} width={b.bw} height={3} fill="#1c4010" opacity={b.op*.9} />
            ))}
            <rect x={b.x+1} y={R(h*(1-b.bh))} width={3} height={R(h*b.bh)} fill="#88dd55" opacity={b.op*.28} />
          </g>
        ))}
        {/* GROUND MIST overlay */}
        <rect width={w} height={h} fill={`url(#${uid}bf)`} />
        {/* Ground */}
        <rect x={0} y={R(h*.88)} width={w} height={R(h*.12)} fill="#0c1808" />
        <rect x={0} y={R(h*.88)} width={w} height={2} fill="#1a2e0a" />
        {/* Moss + fallen leaves */}
        {[.08,.28,.50,.70,.90].map((mx,i)=>(
          <ellipse key={i} cx={R(w*mx)} cy={R(h*.92)} rx={R(16+(i%3)*4)} ry={5} fill="#223818" opacity={.55} />
        ))}
        {Array.from({length:12},(_,i)=>(
          <ellipse key={i} cx={R((i*29+8)%(w-8))} cy={R(h*.91+(i%4)*3)} rx={5} ry={2}
            fill={i%2===0?'#335522':'#224418'} opacity={.45}
            transform={`rotate(${i*22},${(i*29+8)%(w-8)},${R(h*.91+(i%4)*3)})`} />
        ))}
      </svg>
    );
  }

  // Studio (white)
  const R = (n: number) => Math.round(n);
  return (
    <svg width={w} height={h} style={{ display: 'block', shapeRendering: 'crispEdges' }}>
      <defs>
        <linearGradient id={`${uid}stb`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#ececec" /><stop offset="60%" stopColor="#f5f5f5" />
          <stop offset="100%" stopColor="#e0e0e0" />
        </linearGradient>
        <radialGradient id={`${uid}stk`} cx=".28" cy=".18" r=".65">
          <stop offset="0%"   stopColor="#fff" stopOpacity=".88" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}stf`} cx=".76" cy=".22" r=".52">
          <stop offset="0%"   stopColor="#e8f4ff" stopOpacity=".55" />
          <stop offset="100%" stopColor="#e8f4ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}stfl`} cx=".5" cy="1" r=".6">
          <stop offset="0%"   stopColor="#fff" stopOpacity=".55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* White sweep background */}
      <rect width={w} height={h} fill={`url(#${uid}stb)`} />
      {/* Key light spill */}
      <rect width={w} height={h} fill={`url(#${uid}stk)`} />
      {/* Fill light spill */}
      <rect width={w} height={h} fill={`url(#${uid}stf)`} />
      {/* Floor bounce */}
      <rect width={w} height={h} fill={`url(#${uid}stfl)`} />
      {/* SEAMLESS PAPER BACKDROP CURVE */}
      <path d={`M0,${R(h*.58)} Q${R(w*.5)},${R(h*.48)} ${w},${R(h*.58)} L${w},${h} L0,${h} Z`}
        fill="#e0e0e0" />
      <path d={`M0,${R(h*.58)} Q${R(w*.5)},${R(h*.48)} ${w},${R(h*.58)}`}
        fill="none" stroke="#cccccc" strokeWidth={1} opacity={.5} />
      {/* Backdrop seam shadows */}
      <path d={`M0,${R(h*.585)} Q${R(w*.5)},${R(h*.484)} ${w},${R(h*.585)}`}
        fill="none" stroke="#c0c0c0" strokeWidth={.5} opacity={.4} />
      {/* LEFT KEY LIGHT — stand + softbox */}
      <rect x={R(w*.07)} y={R(h*.22)} width={4} height={R(h*.60)} fill="#aaaaaa" />
      {/* tripod legs */}
      <rect x={R(w*.07)} y={R(h*.82)} width={5} height={R(h*.10)} fill="#999" transform={`rotate(-28,${R(w*.07)},${R(h*.82)})`} />
      <rect x={R(w*.09)} y={R(h*.82)} width={5} height={R(h*.10)} fill="#999" transform={`rotate(28,${R(w*.09)},${R(h*.82)})`} />
      <rect x={R(w*.06)} y={R(h*.80)} width={16} height={3} fill="#aaa" />
      {/* Softbox */}
      <path d={`M${R(w*.01)},${R(h*.22)} Q${R(w*.18)},${R(h*.09)} ${R(w*.30)},${R(h*.22)}`}
        fill="#e8e8e8" stroke="#cccccc" strokeWidth={1} />
      {/* Softbox inner grid lines */}
      {[.33,.5,.66].map((t,i)=>(
        <path key={i} d={`M${R(w*.01+t*(w*.29))},${R(h*.22)} Q${R(w*.01+t*(w*.29)+w*.04)},${R(h*.1)} ${R(w*.01+t*(w*.29)+w*.08)},${R(h*.22)}`}
          fill="none" stroke="#ddd" strokeWidth={.5} opacity={.6} />
      ))}
      <motion.rect x={R(w*.03)} y={R(h*.12)} width={R(w*.24)} height={R(h*.10)} fill="#fff" opacity={.20}
        animate={{opacity:[.14,.28,.14]}} transition={{duration:3,repeat:Infinity}} />
      <circle cx={R(w*.07)} cy={R(h*.22)} r={3} fill="#cccccc" />
      {/* RIGHT FILL LIGHT — stand + blue-tinted softbox */}
      <rect x={R(w*.88)} y={R(h*.24)} width={4} height={R(h*.57)} fill="#aaaaaa" />
      <rect x={R(w*.87)} y={R(h*.81)} width={5} height={R(h*.10)} fill="#999" transform={`rotate(-28,${R(w*.87)},${R(h*.81)})`} />
      <rect x={R(w*.90)} y={R(h*.81)} width={5} height={R(h*.10)} fill="#999" transform={`rotate(28,${R(w*.90)},${R(h*.81)})`} />
      <rect x={R(w*.86)} y={R(h*.80)} width={16} height={3} fill="#aaa" />
      {/* Softbox (fill, blue tint) */}
      <path d={`M${R(w*.72)},${R(h*.24)} Q${R(w*.83)},${R(h*.11)} ${R(w*.94)},${R(h*.24)}`}
        fill="#ddeeff" stroke="#aaccdd" strokeWidth={1} />
      <motion.rect x={R(w*.73)} y={R(h*.13)} width={R(w*.20)} height={R(h*.10)} fill="#ddeeff" opacity={.18}
        animate={{opacity:[.12,.24,.12]}} transition={{duration:3.5,repeat:Infinity,delay:.8}} />
      <circle cx={R(w*.94)} cy={R(h*.24)} r={3} fill="#aaccdd" />
      {/* RING LIGHT center top */}
      <line x1={R(w*.5)} y1={0} x2={R(w*.5)} y2={R(h*.09)} stroke="#bbb" strokeWidth={1.5} />
      {/* Ring outer */}
      <circle cx={R(w*.5)} cy={R(h*.12)} r={R(h*.072)} fill="none" stroke="#cccccc" strokeWidth={5} opacity={.8} />
      {/* Ring inner */}
      <circle cx={R(w*.5)} cy={R(h*.12)} r={R(h*.058)} fill="none" stroke="#e8e8e8" strokeWidth={2.5} opacity={.65} />
      {/* Ring LED dots */}
      {Array.from({length:16},(_,i)=>{const a=i*22.5*Math.PI/180,r=R(h*.065);return(
        <motion.circle key={i} cx={R(w*.5+Math.cos(a)*r)} cy={R(h*.12+Math.sin(a)*r)} r={2}
          fill="#fff" animate={{opacity:[.3,.95,.3]}} transition={{duration:.9,repeat:Infinity,delay:i*.055}} />
      );})}
      {/* Animated ring glow */}
      <motion.circle cx={R(w*.5)} cy={R(h*.12)} r={R(h*.075)} fill="none" stroke="#fff" strokeWidth={2}
        animate={{opacity:[.25,.65,.25]}} transition={{duration:2.5,repeat:Infinity}} />
      {/* CENTER MARK on floor */}
      <rect x={R(w*.5-12)} y={R(h*.75)} width={24} height={1} fill="#ccc" opacity={.5} />
      <rect x={R(w*.5)} y={R(h*.75-12)} width={1} height={24} fill="#ccc" opacity={.5} />
      <circle cx={R(w*.5)} cy={R(h*.75)} r={4} fill="none" stroke="#ccc" strokeWidth={1} opacity={.45} />
      {/* FLOOR GRID — perspective lines */}
      {Array.from({length:7},(_,i)=>(
        <line key={i} x1={R(w*.12+i*(w*.12))} y1={R(h*.62)} x2={R(w*.12+i*(w*.12))} y2={h}
          stroke="#c8c8c8" strokeWidth={.6} opacity={.28} />
      ))}
      {[h*.67,h*.74,h*.82,h*.90].map((gy,i)=>(
        <line key={i} x1={R(w*.12)} y1={R(gy)} x2={R(w*.88)} y2={R(gy)} stroke="#c8c8c8" strokeWidth={.6} opacity={.22} />
      ))}
      {/* FLOOR SHINE ellipse */}
      <ellipse cx={R(w*.5)} cy={R(h*.82)} rx={R(w*.32)} ry={R(h*.042)} fill="#fff" opacity={.38} />
      {/* SIDE VIGNETTE */}
      <rect x={0} y={0} width={R(w*.05)} height={h} fill="#000" opacity={.04} />
      <rect x={R(w*.95)} y={0} width={R(w*.05)} height={h} fill="#000" opacity={.04} />
      {/* Photographer's assistant tape marks */}
      {[[w*.3,h*.74],[w*.7,h*.74]].map(([tx,ty],i)=>(
        <g key={i}>
          <rect x={R(tx-6)} y={R(ty-1)} width={12} height={2} fill="#ffcc00" opacity={.35} />
          <rect x={R(tx-1)} y={R(ty-6)} width={2} height={12} fill="#ffcc00" opacity={.35} />
        </g>
      ))}
    </svg>
  );
}

// ─── Character display ────────────────────────────────────────────────────────
function CharDisplay({ char, scale = 1 }: { char: CharData; scale?: number }) {
  return (
    <div style={{ display: 'inline-block' }}>
      <PixelCharacter
        style={char.style} hair={char.hair} hairColor={char.hairColor}
        gender={char.gender} skin={char.skin}
        scale={scale * 3}
      />
    </div>
  );
}

// ─── Photobooth interior walls ────────────────────────────────────────────────
function BoothWalls({ w, h }: { w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', inset: 0, shapeRendering: 'crispEdges', zIndex: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="bw_wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#220640" />
          <stop offset="100%" stopColor="#14022a" />
        </linearGradient>
        <linearGradient id="bw_side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2e0858" />
          <stop offset="100%" stopColor="#1a0430" />
        </linearGradient>
        <linearGradient id="bw_floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c0438" />
          <stop offset="100%" stopColor="#0e0220" />
        </linearGradient>
      </defs>
      {/* Main back wall */}
      <rect x={38} y={0} width={w - 76} height={h - 36} fill="url(#bw_wall)" />
      {/* Left wall panel */}
      <rect x={0} y={0} width={38} height={h} fill="url(#bw_side)" />
      {/* Right wall panel */}
      <rect x={w - 38} y={0} width={38} height={h} fill="url(#bw_side)" />
      {/* Wall tile pattern on back wall */}
      {Array.from({ length: Math.ceil((w - 76) / 28) }, (_, i) =>
        Array.from({ length: Math.ceil((h - 36) / 28) }, (_, j) => (
          <rect key={`${i}-${j}`} x={38 + i * 28} y={j * 28} width={27} height={27}
            fill="none" stroke="#330a55" strokeWidth={0.5} opacity={0.5} />
        ))
      )}
      {/* Vertical neon strips on side walls */}
      <motion.rect x={16} y={20} width={6} height={h - 56}
        fill="#ff44aa" opacity={0.8}
        animate={{ opacity: [0.5, 1, 0.7, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }} />
      <motion.rect x={w - 22} y={20} width={6} height={h - 56}
        fill="#ff44aa" opacity={0.8}
        animate={{ opacity: [0.5, 1, 0.7, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, delay: 0.5 }} />
      {/* Horizontal neon top/bottom accent */}
      <rect x={38} y={0} width={w - 76} height={5} fill="#ff44aa" opacity={0.5} />
      <rect x={38} y={h - 41} width={w - 76} height={4} fill="#ff44aa" opacity={0.4} />
      {/* Ceiling */}
      <rect x={0} y={0} width={w} height={22} fill="#2e0858" />
      {/* Ceiling decorative lights strip */}
      {Array.from({ length: 12 }, (_, i) => {
        const lx = 50 + i * ((w - 100) / 12);
        const col = ['#ff44aa', '#ffee44', '#44ffee', '#ff88cc', '#88aaff'][i % 5];
        return (
          <motion.circle key={i} cx={lx} cy={10} r={4}
            fill={col} opacity={0.8}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8 + i * 0.12, repeat: Infinity, delay: i * 0.08 }} />
        );
      })}
      {/* Camera mount + lens */}
      <rect x={w / 2 - 22} y={2} width={44} height={22} fill="#111122" rx={4} />
      <circle cx={w / 2} cy={13} r={9} fill="#0a0a1a" />
      <circle cx={w / 2} cy={13} r={6} fill="#001025" />
      <circle cx={w / 2} cy={13} r={3} fill="#003388" opacity={0.9} />
      <circle cx={w / 2 - 1} cy={12} r={1} fill="#aaddff" opacity={0.7} />
      {/* Ring light around lens */}
      {Array.from({ length: 12 }, (_, i) => {
        const ang = i * 30 * Math.PI / 180;
        return (
          <motion.circle key={i} cx={w / 2 + Math.cos(ang) * 12} cy={13 + Math.sin(ang) * 12} r={1.5}
            fill="#ffffff"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.08 }} />
        );
      })}
      {/* Floor */}
      <rect x={38} y={h - 36} width={w - 76} height={36} fill="url(#bw_floor)" />
      <rect x={0} y={h - 36} width={38} height={36} fill="#1a0430" />
      <rect x={w - 38} y={h - 36} width={38} height={36} fill="#1a0430" />
      {/* Floor checker pattern */}
      {Array.from({ length: Math.ceil((w - 76) / 18) }, (_, i) =>
        i % 2 === 0 ? <rect key={i} x={38 + i * 18} y={h - 36} width={18} height={36} fill="#1a0430" opacity={0.5} /> : null
      )}
      {/* Side panel decorative diamonds */}
      {[h * 0.25, h * 0.5, h * 0.75].map((dy, i) => (
        <g key={i}>
          <rect x={12} y={dy - 8} width={14} height={14} fill="#ff44aa" opacity={0.2}
            transform={`rotate(45, 19, ${dy})`} />
          <rect x={w - 26} y={dy - 8} width={14} height={14} fill="#ff44aa" opacity={0.2}
            transform={`rotate(45, ${w - 19}, ${dy})`} />
        </g>
      ))}
    </svg>
  );
}

// ─── Photo cell thumbnail ─────────────────────────────────────────────────────
const EMPTY_FRAME: FrameData = { bg: 'studio' };

function PhotoCell({ frame, idx, active, taken, onClick }: {
  frame: FrameData; idx: number; active: boolean; taken: boolean; onClick: () => void;
}) {
  const char = useMemo(getCharacter, []);
  return (
    <div onClick={onClick} style={{
      width: 112, height: 88, position: 'relative', cursor: 'none', overflow: 'hidden',
      border: active ? '3px solid #ff44aa' : taken ? '2px solid rgba(255,68,170,0.4)' : '2px solid rgba(255,255,255,0.08)',
      boxShadow: active ? '0 0 20px #ff44aa66, inset 0 0 10px #ff44aa11' : 'none',
      background: '#080014', flexShrink: 0,
    }}>
      {taken ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <BgScene id={frame.bg} w={112} h={88} />
          </div>
          <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)' }}>
            <CharDisplay char={char} scale={0.48} />
          </div>
        </div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <div style={{ fontSize: 22, opacity: 0.2 }}>📷</div>
          <div style={{ ...PX, fontSize: 5, color: 'rgba(255,255,255,0.2)' }}>FRAME {idx + 1}</div>
        </div>
      )}
      {active && (
        <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%',
          background: '#ff44aa', boxShadow: '0 0 8px #ff44aa' }} />
      )}
      {taken && (
        <div style={{ position: 'absolute', bottom: 2, right: 3, ...PX, fontSize: 4, color: '#ff99cc', opacity: 0.7 }}>
          ✓
        </div>
      )}
    </div>
  );
}

// ─── 3-2-1 Countdown flash ───────────────────────────────────────────────────
function CountdownFlash({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    const t1 = setTimeout(() => setN(2), 900);
    const t2 = setTimeout(() => setN(1), 1800);
    const t3 = setTimeout(() => setN(0), 2700);
    const t4 = setTimeout(() => onDone(), 3200);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onDone]);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'rgba(0,0,0,0.55)' }}>
      <AnimatePresence mode="wait">
        {n > 0 ? (
          <motion.div key={n}
            initial={{ scale: 2.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.2, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ ...PX, fontSize: 88, color: '#ff44aa',
              textShadow: '0 0 40px #ff44aa, 0 0 80px #ff44aa66, 0 0 120px #ff44aa33' }}>
            {n}
          </motion.div>
        ) : (
          <motion.div key="flash"
            initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.4 }}
            style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 60 }} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Photo strip final view ───────────────────────────────────────────────────
function PhotoStrip({ frames, onRetake, onClose, isMobile = false }: {
  frames: FrameData[]; onRetake: () => void; onClose: () => void; isMobile?: boolean;
}) {
  const char = useMemo(getCharacter, []);
  const [saving, setSaving] = useState(false);
  const cur = isMobile ? 'pointer' : 'none';
  const FW = isMobile ? 110 : 148;
  const FH = isMobile ? 90 : 124;
  const PAD = isMobile ? 8 : 10;
  const BOTTOM = isMobile ? 44 : 58;
  const STRIP_W = FW + PAD * 2;
  const STRIP_H = (FH + PAD) * 4 + PAD + BOTTOM + 32;

  const handleSave = async () => {
    setSaving(true);
    const canvas = document.createElement('canvas');
    const S = 2;
    canvas.width = STRIP_W * S;
    canvas.height = STRIP_H * S;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(S, S);
    // Strip background
    ctx.fillStyle = '#fff8fa';
    ctx.fillRect(0, 0, STRIP_W, STRIP_H);
    // Pink gradient border
    ctx.strokeStyle = '#ff88bb';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, STRIP_W - 4, STRIP_H - 4);
    // Header
    ctx.fillStyle = '#ff44aa';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('★  PHOTO BOOTH  ★', STRIP_W / 2, 22);
    // Frames
    for (let fi = 0; fi < Math.min(frames.length, 4); fi++) {
      const frame = frames[fi];
      if (!frame) continue;
      const fy = 32 + fi * (FH + PAD);
      ctx.fillStyle = '#ffeef6';
      ctx.fillRect(PAD - 2, fy - 2, FW + 4, FH + 4);
      // Background gradient
      const bgColors: Record<string, [string, string]> = {
        sakura: ['#eec8e8', '#ffe8f0'], neon: ['#02001a', '#0d0040'],
        space: ['#180830', '#020108'], beach: ['#7a1a45', '#ffe870'],
        festival: ['#010010', '#180828'], rainbow: ['#e8f4ff', '#fff8fc'],
        bamboo: ['#0e2208', '#0a1808'], studio: ['#f0f0f0', '#e4e4e4'],
      };
      const [c1, c2] = bgColors[frame.bg] ?? ['#080818', '#000'];
      const grd = ctx.createLinearGradient(PAD, fy, PAD, fy + FH);
      grd.addColorStop(0, c1); grd.addColorStop(1, c2);
      ctx.fillStyle = grd;
      ctx.fillRect(PAD, fy, FW, FH);
      // Try to draw the live BgScene SVG
      const bgEl = document.getElementById(`strip-bg-${fi}`);
      const bgSvg = bgEl?.querySelector('svg');
      if (bgSvg) {
        try {
          const svgStr = new XMLSerializer().serializeToString(bgSvg);
          const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
          await new Promise<void>(res => {
            const img = new Image();
            img.onload = () => { ctx.drawImage(img, PAD, fy, FW, FH); res(); };
            img.onerror = () => res();
            img.src = url;
          });
        } catch {}
      }
      // Draw character
      const charEl = document.getElementById(`strip-char-${fi}`);
      const charSvg = charEl?.querySelector('svg');
      if (charSvg) {
        try {
          const svgStr = new XMLSerializer().serializeToString(charSvg);
          const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
          await new Promise<void>(res => {
            const img = new Image();
            img.onload = () => {
              const cw = 30, ch = 45;
              ctx.drawImage(img, PAD + FW / 2 - cw / 2, fy + FH - ch - 4, cw, ch);
              res();
            };
            img.onerror = () => res();
            img.src = url;
          });
        } catch {}
      }
    }
    // Bottom caption
    ctx.fillStyle = '#cc4488';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TOKYO  2086', STRIP_W / 2, STRIP_H - BOTTOM / 2 + 2);
    ctx.fillStyle = '#ff88cc';
    ctx.font = '6px monospace';
    ctx.fillText('プリクラ  03.03.2086', STRIP_W / 2, STRIP_H - BOTTOM / 2 + 16);
    const link = document.createElement('a');
    link.download = 'photo-strip.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    setTimeout(() => setSaving(false), 1000);
  };

  // Shared strip card
  const stripCard = (
    <div style={{ width: STRIP_W, background: '#fff8fa', flexShrink: 0,
      border: '3px solid #ff88bb', boxShadow: '0 8px 60px rgba(255,68,170,0.35), 0 0 120px rgba(255,68,170,0.15)' }}>
      <div style={{ textAlign: 'center', padding: '12px 0 4px', ...PX, fontSize: 6, color: '#cc4488', letterSpacing: '0.2em' }}>
        ★  PHOTO BOOTH  ★
      </div>
      {frames.slice(0, 4).map((frame, fi) => (
        <div key={fi} style={{ margin: `${PAD}px ${PAD}px ${fi < 3 ? 0 : PAD}px`, height: FH, overflow: 'hidden', position: 'relative' }}>
          <div id={`strip-bg-${fi}`} style={{ position: 'absolute', inset: 0 }}>
            <BgScene id={frame.bg} w={FW} h={FH} />
          </div>
          <div id={`strip-char-${fi}`} style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)' }}>
            <CharDisplay char={char} scale={isMobile ? 0.44 : 0.6} />
          </div>
        </div>
      ))}
      <div style={{ textAlign: 'center', padding: '8px 0 10px', ...PX, lineHeight: 1.9 }}>
        <div style={{ fontSize: 6, color: '#cc4488' }}>TOKYO  2086</div>
        <div style={{ fontSize: 5, color: '#ffaacc' }}>プリクラ  03.03.2086</div>
      </div>
    </div>
  );

  // Shared controls
  const controls = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center',
      minWidth: isMobile ? 0 : 180, width: isMobile ? '100%' : 'auto', padding: isMobile ? '20px 24px' : 0 }}>
      <div style={{ ...PX, fontSize: isMobile ? 8 : 9, color: '#ff44aa', letterSpacing: '0.1em', textAlign: 'center',
        textShadow: '0 0 20px #ff44aa, 0 0 40px #ff44aa44' }}>
        STRIP READY!
      </div>
      <div style={{ ...PX, fontSize: 5, color: 'rgba(255,160,200,0.5)', textAlign: 'center', lineHeight: 2.2 }}>
        YOUR PHOTOS<br />LOOK GREAT ★
      </div>
      <motion.button onClick={handleSave} whileTap={{ scale: 0.92 }} disabled={saving} style={{
        ...PX, fontSize: isMobile ? 7 : 8, padding: isMobile ? '12px 24px' : '13px 28px', cursor: cur,
        background: saving ? 'rgba(0,180,80,0.1)' : 'rgba(0,210,90,0.14)',
        border: `2px solid ${saving ? '#00cc55' : '#00ee77'}`, color: saving ? '#00cc55' : '#00ee77',
        boxShadow: '0 0 24px rgba(0,220,100,0.25)', letterSpacing: '0.05em', width: isMobile ? '100%' : 'auto',
      }}>{saving ? 'SAVING…' : '💾 SAVE PNG'}</motion.button>
      <button onClick={onRetake} style={{
        ...PX, fontSize: isMobile ? 6 : 7, padding: isMobile ? '11px 20px' : '10px 22px', cursor: cur,
        background: 'rgba(255,68,170,0.1)', border: '2px solid #ff44aa', color: '#ff44aa',
        letterSpacing: '0.05em', width: isMobile ? '100%' : 'auto',
      }}>🔄 RETAKE</button>
      <button onClick={onClose} style={{
        ...PX, fontSize: isMobile ? 6 : 7, padding: isMobile ? '10px 16px' : '9px 18px', cursor: cur,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', color: '#666',
        width: isMobile ? '100%' : 'auto',
      }}>← EXIT</button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,0,18,0.97)',
        display: 'flex', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        ...(isMobile
          ? { flexDirection: 'column', alignItems: 'center', padding: '20px 16px 32px', gap: 20 }
          : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 36, padding: 24 }
        ),
      }}>
      {stripCard}
      {controls}
    </motion.div>
  );
}

// ─── Main PhotoBoothPage ──────────────────────────────────────────────────────
export function PhotoBoothPage({ onExit }: { onExit: () => void }) {
  const { setTrack } = useMusic();
  const char = useMemo(getCharacter, []);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { vw, vh } = useWindowSize();
  const isMobile = vw < 640;

  const [phase,       setPhase]       = useState<Phase>('entering');
  const [activeBg,    setActiveBg]    = useState<BgId>('sakura');
  const [frames,      setFrames]      = useState<(FrameData | null)[]>([null, null, null, null]);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [counting,    setCounting]    = useState(false);

  useEffect(() => {
    setTrack('');
    const audio = new Audio(BOOTH_MUSIC_URL);
    audio.loop = true;
    audio.volume = 0.7;
    audio.play().catch(() => {});
    audioRef.current = audio;
    const t = setTimeout(() => setPhase('booth'), 900);
    return () => {
      clearTimeout(t);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      setTrack(TRACK_TITLE);
    };
  }, [setTrack]);

  // Backspace exits; Space snaps a photo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') { e.preventDefault(); onExit(); return; }
      if (e.key === ' ' && phase === 'booth' && !counting) { e.preventDefault(); handleSnap(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, counting]);

  const handleSnap = useCallback(() => {
    if (counting) return;
    setCounting(true);
  }, [counting]);

  const handleCountdownDone = useCallback(() => {
    setCounting(false);
    const nf = [...frames];
    nf[currentSlot] = { bg: activeBg };
    setFrames(nf);
    const next = nf.findIndex(f => f === null);
    if (next === -1) setTimeout(() => setPhase('strip'), 600);
    else setCurrentSlot(next);
  }, [frames, currentSlot, activeBg]);

  const handleRetake = () => { setFrames([null, null, null, null]); setCurrentSlot(0); setPhase('booth'); };

  const takenCount = frames.filter(Boolean).length;
  const cur = isMobile ? 'pointer' : 'none';

  // ── Common: fade-in + strip overlay ──────────────────────────────────────
  const fadeIn = (
    <AnimatePresence>
      {phase === 'entering' && (
        <motion.div key="fade-in" initial={{ opacity: 1 }} animate={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 80 }} />
      )}
    </AnimatePresence>
  );

  const stripOverlay = (
    <AnimatePresence>
      {phase === 'strip' && (
        <PhotoStrip
          frames={frames.filter(Boolean) as FrameData[]}
          onRetake={handleRetake}
          onClose={onExit}
          isMobile={isMobile}
        />
      )}
    </AnimatePresence>
  );

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────
  if (isMobile) {
    const HEADER_H  = 44;
    const BG_ROW_H  = 72;
    const STRIP_H   = 76;
    const SNAP_H    = 62;
    const centerH   = Math.max(100, vh - HEADER_H - BG_ROW_H - STRIP_H - SNAP_H);
    const bgScreenW = Math.round(vw * 0.76);
    const bgScreenH = Math.round(centerH * 0.52);

    return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#060010',
        display: 'flex', flexDirection: 'column', touchAction: 'manipulation' }}>
        {fadeIn}
        {stripOverlay}

        {(phase === 'booth' || phase === 'entering') && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Header */}
            <div style={{ height: HEADER_H, flexShrink: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '0 12px',
              background: 'rgba(10,0,20,0.98)', borderBottom: '1px solid rgba(255,68,170,0.15)' }}>
              <button onClick={onExit} style={{ ...PX, fontSize: 5, padding: '7px 10px', cursor: cur,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#555' }}>
                ← EXIT
              </button>
              <div style={{ ...PX, fontSize: 6, color: '#ff44aa', textShadow: '0 0 12px #ff44aa' }}>
                PHOTO BOOTH
              </div>
              <div style={{ ...PX, fontSize: 7, color: '#ff44aa', textShadow: '0 0 10px #ff44aa' }}>
                {currentSlot + 1} / 4
              </div>
            </div>

            {/* BG selector — horizontal scroll chips */}
            <div style={{ height: BG_ROW_H, flexShrink: 0, display: 'flex', alignItems: 'center',
              gap: 6, overflowX: 'auto', overflowY: 'hidden', padding: '0 10px',
              background: 'rgba(8,0,16,0.95)', borderBottom: '1px solid rgba(255,68,170,0.1)',
              WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              {BACKGROUNDS.map(bg => (
                <button key={bg.id} onClick={() => setActiveBg(bg.id)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: 4, cursor: cur, flexShrink: 0,
                  background: activeBg === bg.id ? 'rgba(255,68,170,0.15)' : 'transparent',
                  border: `1.5px solid ${activeBg === bg.id ? '#ff44aa' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  <div style={{ width: 46, height: 34, overflow: 'hidden' }}>
                    <BgScene id={bg.id} w={46} h={34} />
                  </div>
                  <div style={{ ...PX, fontSize: 5.5, color: activeBg === bg.id ? '#ff44aa' : '#666', whiteSpace: 'nowrap',
                    textShadow: activeBg === bg.id ? '0 0 6px #ff44aa' : 'none' }}>
                    {bg.id.toUpperCase()}
                  </div>
                </button>
              ))}
            </div>

            {/* Center booth scene */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
              <BoothWalls w={vw} h={centerH} />
              {/* BG screen */}
              <div style={{ position: 'absolute', top: '8%', left: '12%', right: '12%', height: '52%',
                overflow: 'hidden', zIndex: 2, border: '4px solid #2e0858',
                boxShadow: '0 0 24px rgba(255,68,170,0.25), inset 0 0 12px rgba(0,0,0,0.5)',
                outline: '1px solid #ff44aa44' }}>
                <AnimatePresence mode="wait">
                  <motion.div key={activeBg} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                    style={{ position: 'absolute', inset: 0 }}>
                    <BgScene id={activeBg} w={bgScreenW} h={bgScreenH} />
                  </motion.div>
                </AnimatePresence>
              </div>
              {/* Character */}
              <div style={{ position: 'absolute', bottom: '14%', left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
                <CharDisplay char={char} scale={1.4} />
              </div>
              {counting && <CountdownFlash onDone={handleCountdownDone} />}
            </div>

            {/* Strip thumbnails row */}
            <div style={{ height: STRIP_H, flexShrink: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 5, padding: '0 8px',
              background: 'rgba(8,0,16,0.95)', borderTop: '1px solid rgba(255,68,170,0.1)' }}>
              {frames.map((f, i) => (
                <div key={i} onClick={() => { if (!f) setCurrentSlot(i); }} style={{
                  width: 68, height: 54, position: 'relative', cursor: cur, overflow: 'hidden', flexShrink: 0,
                  border: currentSlot === i && !f ? '2px solid #ff44aa'
                    : f ? '2px solid rgba(255,68,170,0.4)' : '2px solid rgba(255,255,255,0.08)',
                  boxShadow: currentSlot === i && !f ? '0 0 12px #ff44aa66' : 'none',
                  background: '#080014' }}>
                  {f ? (
                    <div style={{ position: 'absolute', inset: 0 }}>
                      <BgScene id={f.bg} w={68} h={54} />
                      <div style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)' }}>
                        <CharDisplay char={char} scale={0.27} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <div style={{ ...PX, fontSize: 4, color: 'rgba(255,255,255,0.15)' }}>{i + 1}</div>
                    </div>
                  )}
                  {currentSlot === i && !f && (
                    <div style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5,
                      borderRadius: '50%', background: '#ff44aa', boxShadow: '0 0 6px #ff44aa' }} />
                  )}
                </div>
              ))}
              {takenCount === 4 && (
                <button onClick={() => setPhase('strip')} style={{
                  ...PX, fontSize: 4, padding: '8px 7px', cursor: cur, flexShrink: 0,
                  background: 'rgba(255,68,170,0.15)', border: '2px solid #ff44aa', color: '#ff44aa' }}>
                  VIEW →
                </button>
              )}
            </div>

            {/* Snap button */}
            <div style={{ height: SNAP_H, flexShrink: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'rgba(6,0,16,0.99)',
              borderTop: '1px solid rgba(255,68,170,0.08)' }}>
              {!counting ? (
                <motion.button onClick={handleSnap} whileTap={{ scale: 0.88 }}
                  style={{ ...PX, fontSize: 9, padding: '10px 36px', cursor: cur,
                    background: 'linear-gradient(135deg, #cc0066 0%, #ff44aa 50%, #ff88cc 100%)',
                    border: '2px solid #ffccee', color: '#fff',
                    boxShadow: '0 0 24px rgba(255,68,170,0.6)', letterSpacing: '0.1em' }}>
                  📷  SNAP!
                </motion.button>
              ) : (
                <div style={{ ...PX, fontSize: 8, color: 'rgba(255,68,170,0.4)' }}>SMILE!</div>
              )}
            </div>

          </div>
        )}
      </div>
    );
  }

  // ── DESKTOP LAYOUT ────────────────────────────────────────────────────────
  const deskCenterW = vw - 172 - 240;
  const bgScreenWD  = Math.round(deskCenterW * 0.76 - 24);
  const bgScreenHD  = Math.round(vh * 0.55);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#060010', cursor: 'none' }}>
      {fadeIn}

      {/* Booth phase */}
      <AnimatePresence>
        {phase === 'booth' && (
          <motion.div key="booth" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'stretch' }}>

            {/* LEFT PANEL: strip tracker */}
            <div style={{ width: 172, background: 'rgba(10,0,20,0.98)',
              borderRight: '1px solid rgba(255,68,170,0.15)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '16px 10px 12px', gap: 8, flexShrink: 0, overflow: 'hidden' }}>
              <div style={{ ...PX, fontSize: 8, color: 'rgba(255,150,200,0.65)', letterSpacing: '0.18em', marginBottom: 4, textShadow: '0 0 10px rgba(255,100,180,0.3)' }}>
                YOUR STRIP
              </div>
              {frames.map((f, i) => (
                <PhotoCell key={i} frame={f ?? EMPTY_FRAME} idx={i}
                  active={currentSlot === i && !f} taken={!!f}
                  onClick={() => { if (!f) setCurrentSlot(i); }} />
              ))}
              <div style={{ ...PX, fontSize: 7, color: 'rgba(255,100,160,0.55)', marginTop: 4, textAlign: 'center' }}>
                {takenCount} / 4 SNAPPED
              </div>
              {takenCount === 4 && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setPhase('strip')} style={{
                    ...PX, fontSize: 7, padding: '10px 10px', cursor: 'none', marginTop: 6,
                    background: 'rgba(255,68,170,0.15)', border: '2px solid #ff44aa',
                    color: '#ff44aa', boxShadow: '0 0 18px #ff44aa33', display: 'block', width: '100%',
                  }}>VIEW STRIP →</motion.button>
              )}
            </div>

            {/* CENTER: booth interior */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex',
              alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
              <BoothWalls w={deskCenterW} h={vh} />
              {/* BG screen */}
              <div style={{ position: 'absolute', top: '10%', left: '12%', right: '12%', height: '55%',
                overflow: 'hidden', zIndex: 2, border: '6px solid #2e0858',
                boxShadow: '0 0 40px rgba(255,68,170,0.25), inset 0 0 20px rgba(0,0,0,0.5)',
                outline: '2px solid #ff44aa44' }}>
                <AnimatePresence mode="wait">
                  <motion.div key={activeBg} initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }} style={{ position: 'absolute', inset: 0 }}>
                    <BgScene id={activeBg} w={bgScreenWD} h={bgScreenHD} />
                  </motion.div>
                </AnimatePresence>
              </div>
              {/* Character */}
              <div style={{ position: 'absolute', bottom: '22%', zIndex: 3 }}>
                <AnimatePresence mode="wait">
                  <motion.div key={activeBg} initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
                    transition={{ duration: 0.2 }}>
                    <CharDisplay char={char} scale={2.4} />
                  </motion.div>
                </AnimatePresence>
              </div>
              {counting && <CountdownFlash onDone={handleCountdownDone} />}
              {!counting && (
                <motion.button onClick={handleSnap}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.88 }}
                  style={{ position: 'absolute', bottom: '6%', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 10, ...PX, fontSize: 11, padding: '14px 40px', cursor: 'none',
                    background: 'linear-gradient(135deg, #cc0066 0%, #ff44aa 50%, #ff88cc 100%)',
                    border: '2px solid #ffccee', color: '#fff',
                    boxShadow: '0 0 32px rgba(255,68,170,0.65), 0 4px 20px rgba(0,0,0,0.5)',
                    letterSpacing: '0.12em' }}>
                  📷  SNAP!
                </motion.button>
              )}
              <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, textAlign: 'center' }}>
                <div style={{ ...PX, fontSize: 10, color: '#ff44aa', textShadow: '0 0 14px #ff44aa' }}>
                  {currentSlot + 1} / 4
                </div>
                <div style={{ ...PX, fontSize: 6, color: 'rgba(255,68,170,0.4)', marginTop: 3, letterSpacing: '0.06em' }}>
                  FRAME
                </div>
              </div>
              {!counting && (
                <div style={{ position: 'absolute', bottom: '2%', left: '50%', transform: 'translateX(-50%)', zIndex: 10,
                  ...PX, fontSize: 6, color: 'rgba(255,68,170,0.35)', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                  CLICK SNAP OR PRESS SPACE  •  BACKSPACE EXIT
                </div>
              )}
            </div>

            {/* RIGHT PANEL: background selector */}
            <div style={{ width: 240, background: 'rgba(10,0,20,0.98)',
              borderLeft: '1px solid rgba(255,68,170,0.15)',
              display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(255,68,170,0.12)' }}>
                <div style={{ ...PX, fontSize: 8, color: 'rgba(255,150,200,0.65)', letterSpacing: '0.18em', textShadow: '0 0 10px rgba(255,100,180,0.3)' }}>BACKGROUND</div>
                <div style={{ ...PX, fontSize: 6, color: 'rgba(255,68,170,0.35)', marginTop: 5, letterSpacing: '0.08em' }}>CLICK TO CHANGE</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {BACKGROUNDS.map(bg => (
                    <button key={bg.id} onClick={() => setActiveBg(bg.id)} style={{
                      display: 'flex', gap: 10, alignItems: 'center', padding: '7px 8px', cursor: 'none',
                      background: activeBg === bg.id ? 'rgba(255,68,170,0.14)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${activeBg === bg.id ? '#ff44aa' : 'rgba(255,255,255,0.07)'}`,
                      boxShadow: activeBg === bg.id ? '0 0 10px rgba(255,68,170,0.2)' : 'none',
                      transition: 'all 0.15s' }}>
                      <div style={{ width: 54, height: 40, overflow: 'hidden', flexShrink: 0,
                        border: activeBg === bg.id ? '1.5px solid #ff44aa88' : '1px solid rgba(255,255,255,0.06)' }}>
                        <BgScene id={bg.id} w={54} h={40} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left', overflow: 'hidden', minWidth: 0 }}>
                        <div style={{ ...PX, fontSize: 7, color: activeBg === bg.id ? '#ff44aa' : '#888', whiteSpace: 'nowrap',
                          textShadow: activeBg === bg.id ? '0 0 8px #ff44aa' : 'none' }}>{bg.label}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 10, color: activeBg === bg.id ? 'rgba(255,180,220,0.6)' : 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bg.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {frames[currentSlot] && (
                <button onClick={() => { const nf = [...frames]; nf[currentSlot] = null; setFrames(nf); }}
                  style={{ ...PX, fontSize: 7, padding: '9px', cursor: 'none', margin: '6px 10px',
                    background: 'rgba(255,60,60,0.06)', border: '1px solid #ff3333', color: '#ff5555' }}>
                  ↩ RETAKE {currentSlot + 1}
                </button>
              )}
              <div style={{ padding: '6px 10px 10px', borderTop: '1px solid rgba(255,68,170,0.08)' }}>
                <div style={{ ...PX, fontSize: 5.5, color: 'rgba(255,68,170,0.28)', letterSpacing: '0.06em', textAlign: 'center', lineHeight: 1.8 }}>
                  CLICK SNAP TO TAKE PHOTO<br/>BACKSPACE — EXIT
                </div>
              </div>
            </div>

            {/* Exit */}
            <button onClick={onExit} style={{ position: 'absolute', top: 14, left: 14, zIndex: 20,
              cursor: 'none', ...PX, fontSize: 6, padding: '8px 14px',
              background: 'rgba(10,0,20,0.92)', border: '1px solid rgba(255,255,255,0.12)', color: '#555' }}>
              ← EXIT
            </button>

          </motion.div>
        )}
      </AnimatePresence>

      {stripOverlay}
    </div>
  );
}
