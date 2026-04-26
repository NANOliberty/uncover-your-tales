import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMusic, TRACK_TITLE } from './MusicContext';

const PX = { fontFamily: '"Press Start 2P", monospace' } as const;

// ─── View / phase types ───────────────────────────────────────────────────────
type ArcadeView  = 'select' | 'claw' | 'rhythm';
type ClawPhase   = 'ready'|'dropping'|'grabbing'|'rising'|'delivering'|'celebrating'|'missed'|'gameover';
type RhythmPhase = 'waiting'|'countdown'|'playing'|'done';

interface PrizeData { id:string; name:string; cabinetX:number; cabinetY:number; }
interface NoteData  { id:number; beat:number; lane:number; targetTime:number; state:'active'|'hit'|'missed'; hitType?:'perfect'|'good'; }
interface FeedbackItem { id:number; lane:number; type:'perfect'|'good'|'miss'; }

// ─── Prize placements ─────────────────────────────────────────────────────────
const PRIZES: PrizeData[] = [
  { id:'shiba',   name:'SHIBA PLUSH',  cabinetX:38,  cabinetY:210 },
  { id:'totoro',  name:'BEAR PLUSH',   cabinetX:96,  cabinetY:225 },
  { id:'ramen',   name:'RAMEN PLUSH',  cabinetX:158, cabinetY:215 },
  { id:'capsule', name:'CAPSULE TOY',  cabinetX:214, cabinetY:222 },
];
const CLAW_W=28, CABINET_W=260, CABLE_DROP=175, HIT_RANGE=20;

// ─── Rhythm chart ─────────────────────────────────────────────────────────────
const BEAT_CHART: Array<[number,number]> = [
  [0,0],[1,2],[2,3],[3,1],
  [4,2],[5,0],[6,3],[7,1],
  [8,0],[8.5,3],[9,2],[9.5,1],
  [10,0],[10.5,2],[11,3],[11.5,1],
  [12,2],[13,0],[13.5,1],[14,3],[15,2],[15.5,0],
  [16,0],[16.5,1],[17,2],[17.5,3],
  [18,3],[18.5,2],[19,1],[19.5,0],
  [20,0],[21,3],[22,1],[22.5,2],[23,0],[23.5,3],
  [24,2],[24.5,0],[25,3],[25.5,1],
  [26,0],[26.5,2],[27,3],[28,1],
  [28.5,0],[29,2],[29.5,3],[30,1],
  [30.5,0],[31,2],[31.5,3],[32,0],
];
const TOTAL_BEATS=33, TEMPO=148, BEAT_MS=(60/TEMPO)*1000;
const TRAVEL_MS=2400, HIT_Y=390, FIELD_H=480;
// Pre-roll: offset all note target times so the first note spawns off-screen
// at the top and has a full TRAVEL_MS to drift down before it must be hit.
const PRE_ROLL_MS = 2600;
const LANE_COLORS=['#00ccff','#ffcc00','#ff44cc','#44ff88'];
const LANE_X=[5,72,139,206];

// CSS-triangle arrows — immune to font-coverage gaps in Press Start 2P
// lane: 0=left  1=down  2=up  3=right
function ArrowShape({ lane, size=18, color='#fff' }: { lane:number; size?:number; color?:string }) {
  const h = size, w = Math.round(size * 1.25);
  const s: React.CSSProperties =
    lane === 0 ? { borderTop:`${h/2}px solid transparent`, borderBottom:`${h/2}px solid transparent`, borderRight:`${w}px solid ${color}` } :
    lane === 1 ? { borderLeft:`${h/2}px solid transparent`, borderRight:`${h/2}px solid transparent`, borderTop:`${w}px solid ${color}` } :
    lane === 2 ? { borderLeft:`${h/2}px solid transparent`, borderRight:`${h/2}px solid transparent`, borderBottom:`${w}px solid ${color}` } :
                 { borderTop:`${h/2}px solid transparent`, borderBottom:`${h/2}px solid transparent`, borderLeft:`${w}px solid ${color}` };
  return <div style={{ width:0, height:0, flexShrink:0, ...s }}/>;
}

// ─── Pixel sprites ─────────────────────────────────────────────────────────── 
function Sprite({ grid, palette, px=5 }: { grid:number[][], palette:string[], px?:number }) {
  const cols=grid[0].length;
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},${px}px)`, imageRendering:'pixelated', lineHeight:0 }}>
      {grid.flat().map((c,i)=><div key={i} style={{ width:px, height:px, background:palette[c]??'transparent' }}/>)}
    </div>
  );
}
const SHIBA_GRID  = [[0,0,1,1,1,1,0,0],[0,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1],[1,1,2,1,1,2,1,1],[1,1,1,3,1,1,1,1],[0,1,1,4,4,1,1,0],[0,0,1,0,0,1,0,0],[0,0,1,1,1,1,0,0]];
const SHIBA_PAL   = ['transparent','#e8901a','#1a0a00','#cc5522','#ffffff'];
const TOTORO_GRID = [[0,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1],[1,1,2,1,1,2,1,1],[1,1,1,1,1,1,1,1],[0,3,3,3,3,3,3,0],[0,3,2,3,3,2,3,0],[0,1,3,3,3,3,1,0],[0,0,1,1,1,1,0,0]];
const TOTORO_PAL  = ['transparent','#7799aa','#1a1a1a','#ddeeff'];
const RAMEN_GRID  = [[0,4,0,4,0,4,0,0],[0,0,4,0,4,0,0,0],[1,1,1,1,1,1,1,1],[0,2,2,2,2,2,2,0],[0,2,3,3,3,3,2,0],[0,2,3,2,3,2,2,0],[0,2,2,2,2,2,2,0],[0,1,1,1,1,1,1,0]];
const RAMEN_PAL   = ['transparent','#c07030','#d48030','#f0d890','#cccccc'];
const CAPSULE_GRID= [[0,0,1,1,1,1,0,0],[0,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[5,5,5,5,5,5,5,5],[3,3,3,3,3,3,3,3],[3,3,3,3,3,3,3,3],[0,3,3,3,3,3,3,0]];
const CAPSULE_PAL = ['transparent','#ee3344','#1a1a1a','#4488ee','','#ffffff'];
const SPRITE_MAP: Record<string,{grid:number[][],palette:string[]}> = {
  shiba:{grid:SHIBA_GRID,palette:SHIBA_PAL}, totoro:{grid:TOTORO_GRID,palette:TOTORO_PAL},
  ramen:{grid:RAMEN_GRID,palette:RAMEN_PAL}, capsule:{grid:CAPSULE_GRID,palette:CAPSULE_PAL},
};

// ─── 16-bit character sprites ─────────────────────────────────────────────────
const GIRL_GRID = [
  [0,0,1,1,1,1,0,0],[0,1,1,1,1,1,1,0],[1,1,2,2,2,2,1,1],
  [0,0,2,3,2,3,0,0],[0,0,2,2,2,2,0,0],[0,0,2,4,4,2,0,0],
  [0,0,5,6,6,5,0,0],[0,5,5,5,5,5,5,0],[5,5,5,5,5,5,5,5],
  [0,5,5,5,5,5,5,0],[0,0,7,7,7,7,0,0],[0,0,7,7,7,7,0,0],
  [0,0,5,0,0,5,0,0],[0,0,5,0,0,5,0,0],[0,0,1,1,0,1,1,0],
];
const GIRL_PAL = ['transparent','#1a1208','#f4c294','#1a1a2a','#e06060','#f0f0f0','#1a2ea0','#0e1e60'];
const SALARY_GRID = [
  [0,0,1,1,1,1,0,0],[0,0,1,1,1,1,0,0],[0,0,2,2,2,2,0,0],
  [0,0,2,3,2,3,0,0],[0,0,2,2,2,2,0,0],[0,0,2,2,2,2,0,0],
  [0,0,5,5,5,5,0,0],[0,4,4,6,6,4,4,0],[4,4,4,6,6,4,4,4],
  [0,4,4,6,4,4,4,0],[0,7,7,7,7,7,7,0],[0,7,7,7,7,7,7,0],
  [0,0,7,0,0,7,0,0],[0,0,7,0,0,7,0,0],[0,0,1,1,0,1,1,0],
];
const SALARY_PAL = ['transparent','#1a1a1a','#e8c098','#1a1a2a','#1a1a4a','#f0f0f0','#cc1a1a','#181830'];
const GAMER_GRID = [
  [0,0,8,8,8,8,0,0],[8,1,1,1,1,1,8,0],[8,1,2,2,2,1,8,0],
  [0,0,2,3,2,3,0,0],[0,0,2,2,2,2,0,0],[0,0,2,2,2,2,0,0],
  [0,0,4,4,4,4,0,0],[0,4,4,4,4,4,4,0],[4,4,4,4,4,4,4,4],
  [0,4,4,4,4,4,4,0],[0,0,6,6,6,6,0,0],[0,0,6,6,6,6,0,0],
  [0,0,6,0,0,6,0,0],[0,0,6,0,0,6,0,0],[0,0,9,9,0,9,9,0],
];
const GAMER_PAL = ['transparent','#1a1a1a','#f4c294','#1a1a2a','#aa44ff','#f0f0f0','#336699','#1a1a1a','#4488ff','#aaaaaa'];
const KID_GRID = [
  [0,1,1,1,1,1,0,0],[1,1,1,1,1,1,1,0],[0,1,2,2,2,1,0,0],
  [0,0,2,3,2,3,0,0],[0,0,2,4,4,2,0,0],[0,5,5,5,5,5,0,0],
  [5,5,5,5,5,5,5,0],[0,5,5,5,5,5,0,0],[0,0,6,6,6,6,0,0],
  [0,0,6,6,6,6,0,0],[0,0,2,0,0,2,0,0],[0,0,2,0,0,2,0,0],
  [0,0,7,7,0,7,7,0],[0,0,0,0,0,0,0,0],
];
const KID_PAL = ['transparent','#8b5e3c','#f4d0a0','#1a1a2a','#ff6060','#ee2222','#2244aa','#333333'];
const YANKEE_GRID = [
  [0,7,0,7,7,0,7,0],[0,7,7,7,7,7,7,0],[0,7,2,2,2,2,7,0],
  [0,0,2,3,2,3,0,0],[0,0,2,2,2,2,0,0],[0,0,2,4,4,2,0,0],
  [0,1,1,1,1,1,1,0],[0,1,5,5,5,5,1,0],[1,1,5,5,5,5,1,1],
  [0,1,5,5,5,5,1,0],[0,0,6,6,6,6,0,0],[0,0,6,6,6,6,0,0],
  [0,0,6,0,0,6,0,0],[0,0,6,0,0,6,0,0],[0,0,8,8,0,8,8,0],
];
const YANKEE_PAL = ['transparent','#1a1a1a','#f4c294','#1a1a2a','#e08080','#f0f0f0','#2a2a44','#c8a020','#333333'];
const CHAR_MAP: Record<string,{grid:number[][];palette:string[]}> = {
  girl:{grid:GIRL_GRID,palette:GIRL_PAL}, salary:{grid:SALARY_GRID,palette:SALARY_PAL},
  gamer:{grid:GAMER_GRID,palette:GAMER_PAL}, kid:{grid:KID_GRID,palette:KID_PAL},
  yankee:{grid:YANKEE_GRID,palette:YANKEE_PAL},
};

// ─── Audio ────────────────────────────────────────────────────────────────────
const ARCADE_MUSIC = 'https://raw.githubusercontent.com/crlazy101/Tokyo-Audio/main/Arcade_kezztg.ogg';

function useArcadeAudio() {
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const ctxRef   = useRef<AudioContext|null>(null);

  const start = useCallback(() => {
    const audio = new Audio(ARCADE_MUSIC);
    audio.loop = true; audio.volume = 0.55;
    audioRef.current = audio;
    audio.play().catch(()=>{});
    try {
      ctxRef.current = new (window.AudioContext || (window as unknown as{webkitAudioContext:typeof AudioContext}).webkitAudioContext)();
    } catch {}
  }, []);

  const sfx = useCallback((freqs:number[], durs:number[], wave:OscillatorType='square')=>{
    const ctx = ctxRef.current; if(!ctx) return;
    // Resume if suspended (autoplay policy)
    if(ctx.state==='suspended') ctx.resume();
    freqs.forEach((f,i)=>{
      if(!f) return;
      const delay = durs.slice(0,i).reduce((a,b)=>a+b,0);
      const t = ctx.currentTime+delay;
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.type=wave; o.frequency.value=f;
      g.gain.setValueAtTime(0.08,t);
      g.gain.exponentialRampToValueAtTime(0.001,t+durs[i]);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t+durs[i]);
    });
  }, []);

  useEffect(()=>()=>{
    audioRef.current?.pause(); audioRef.current=null;
    ctxRef.current?.close(); ctxRef.current=null;
  },[]);

  return { start, sfx };
}

// ─── Arcade background ────────────────────────────────────────────────────────
const LIGHT_COLS = ['#ff00ff','#00ffff','#ffaa00','#ff4488','#44aaff','#aaff44','#ff8800','#88ff00'];


// PixelChar: renders a 16-bit character sprite with optional animations
function PixelChar({ id, px=3, bounce=false, sway=false, x=0, b=0, flip=false, style }:{
  id:string; px?:number; bounce?:boolean; sway?:boolean;
  x?:number; b?:number; flip?:boolean; style?:React.CSSProperties;
}) {
  const char = CHAR_MAP[id];
  if (!char) return null;
  const el = (
    <div style={{ transform: flip ? 'scaleX(-1)' : undefined, imageRendering:'pixelated' }}>
      <Sprite grid={char.grid} palette={char.palette} px={px}/>
    </div>
  );
  const pos: React.CSSProperties = { position:'absolute', bottom:b, left:x, ...style };
  if (bounce) return (
    <motion.div animate={{ y:[0,-6,0,-3,0] }} transition={{ duration:0.52, repeat:Infinity, ease:'easeInOut' }} style={pos}>{el}</motion.div>
  );
  if (sway) return (
    <motion.div animate={{ rotate:[-2,2,-2] }} transition={{ duration:1.3, repeat:Infinity, ease:'easeInOut' }} style={pos}>{el}</motion.div>
  );
  return <div style={pos}>{el}</div>;
}

const ArcadeBackground = React.memo(function ArcadeBackground() {
  return (
    <div style={{ position:'absolute', inset:0, background:'#050810', overflow:'hidden' }}>

      {/* ── Scanlines ── */}
      <div style={{ position:'absolute', inset:0, zIndex:22, pointerEvents:'none',
        backgroundImage:'repeating-linear-gradient(0deg,rgba(0,0,0,0.18) 0px,rgba(0,0,0,0.18) 1px,transparent 1px,transparent 4px)' }}/>

      {/* ── Ceiling ── */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:18, background:'linear-gradient(to bottom,#0e1830,#0a1224)', borderBottom:'2px solid #1a2840', zIndex:10 }}/>
      {/* Ceiling ducts / pipes */}
      {[60,260,460,660,860].map((x,i)=>(
        <div key={i} style={{ position:'absolute', top:8, left:x, width:80, height:6, background:'#0e1a2e', border:'1px solid #1a2840', borderRadius:2, zIndex:9 }}/>
      ))}
      {/* AC vents flush with ceiling */}
      {[150,550,850].map((x,i)=>(
        <div key={i} style={{ position:'absolute', top:4, left:x, width:40, height:10, background:'#0c1828', border:'1px solid #1e3040', borderRadius:1, zIndex:9, display:'flex', flexDirection:'column', gap:1, padding:'2px 3px' }}>
          {[0,1,2].map(r=><div key={r} style={{ height:1, background:'rgba(0,200,255,0.22)', borderRadius:1 }}/>)}
        </div>
      ))}
      {/* Ceiling festival banner strings */}
      {[80,260,440,620,800].map((x,i)=>(
        <div key={i} style={{ position:'absolute', top:16, left:x, width:160, height:36, zIndex:8, pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:10, left:0, right:0, height:1, background:'rgba(255,200,100,0.20)' }}/>
          {[0,18,36,54,72,90,108,126,144].map((fx,fi)=>(
            <div key={fi} style={{ position:'absolute', top:10, left:fx, width:0, height:0,
              borderLeft:'7px solid transparent', borderRight:'7px solid transparent',
              borderTop:`14px solid ${['#ff4488','#44aaff','#ffcc00','#44cc44','#ff8800','#aa44ff','#00ccff','#ff4444','#88ffcc'][fi%9]}`,
              opacity:0.62 }}/>
          ))}
        </div>
      ))}
      {/* Fluorescent strip lights on ceiling */}
      {[180,380,580,780].map((x,i)=>(
        <div key={i} style={{ position:'absolute', top:0, left:x, width:100, height:3, background:'rgba(180,220,255,0.32)', zIndex:11, borderRadius:1,
          animation:'arc-fluor 3s ease-in-out infinite', animationDuration:`${3+i*0.7}s` }}/>
      ))}

      {/* ── Hanging lights with cones ── */}
      {[90,210,340,480,600,730,870].map((x,i)=>{
        const c = LIGHT_COLS[i%LIGHT_COLS.length];
        return (
          <div key={i} style={{ position:'absolute', top:18, left:x, zIndex:8 }}>
            <div style={{ width:2, height:28+i%3*10, background:'#1a2840', marginLeft:5 }}/>
            <div style={{ width:12, height:12, borderRadius:'50%', background:c, marginLeft:-1,
              boxShadow:`0 0 12px ${c}`, animation:'arc-bulb 1.4s ease-in-out infinite', animationDuration:`${1.4+i*0.25}s` }}/>
            {/* cone */}
            <div style={{ position:'absolute', top:12, left:-22, width:48, height:200,
              background:`linear-gradient(to bottom, ${c}20, transparent 80%)`,
              clipPath:'polygon(35% 0%,65% 0%,100% 100%,0% 100%)', pointerEvents:'none', zIndex:-1 }}/>
            {/* floor spot */}
            <div style={{ position:'absolute', bottom:'-72vh', left:-28, width:64, height:20, background:`radial-gradient(ellipse, ${c}40, transparent 70%)`, borderRadius:'50%', filter:'blur(2px)',
              animation:'arc-spot 1.4s ease-in-out infinite', animationDuration:`${1.4+i*0.25}s` }}/>
          </div>
        );
      })}

      {/* ── Back wall ── */}
      <div style={{ position:'absolute', top:18, left:0, right:0, bottom:'28%',
        background:'linear-gradient(to bottom, #090d1c 0%, #070a16 100%)' }}/>

      {/* ── Wall texture: horizontal panel lines ── */}
      {[30,60,90,120,150].map((y,i)=>(
        <div key={i} style={{ position:'absolute', top:`${(y/300)*72}%`, left:0, right:0, height:1,
          background:'rgba(255,255,255,0.025)', zIndex:2, pointerEvents:'none' }}/>
      ))}
      {/* Wall tile pattern on lower wall */}
      <div style={{ position:'absolute', top:'40%', left:0, right:0, bottom:'28%', zIndex:2, pointerEvents:'none',
        backgroundImage:'repeating-linear-gradient(90deg,rgba(255,255,255,0.018) 0px,rgba(255,255,255,0.018) 1px,transparent 1px,transparent 60px), repeating-linear-gradient(0deg,rgba(255,255,255,0.012) 0px,rgba(255,255,255,0.012) 1px,transparent 1px,transparent 40px)'}}/>
      {/* Wall crown moulding */}
      <div style={{ position:'absolute', top:'35%', left:0, right:0, height:3, background:'rgba(30,50,80,0.55)', zIndex:3, pointerEvents:'none' }}/>

      {/* ── Wall posters & signage ── */}
      {/* BEAT RUSH!! tournament poster */}
      <div style={{ position:'absolute', top:'18%', left:'46%', width:56, height:74, background:'#0a0818', border:'1px solid #2a1850', zIndex:4, overflow:'hidden', display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:4 }}>
        <div style={{ animation:'arc-title-color 1.5s ease-in-out infinite' }}>
          <span style={{ ...PX, fontSize:5 }}>BEAT</span>
        </div>
        <span style={{ ...PX, fontSize:5, color:'#ff44cc' }}>RUSH!!</span>
        <div style={{ display:'flex', gap:2, marginTop:2 }}>
          {LANE_COLORS.map((c,i)=>(
            <div key={i} style={{ width:8, height:20, background:c, borderRadius:1, transformOrigin:'bottom',
              animation:'arc-scaley 1.8s ease-in-out infinite', animationDuration:`${1.8+i*0.32}s` }}/>
          ))}
        </div>
        <span style={{ ...PX, fontSize:4, color:'#664488', marginTop:2 }}>TOURNAMENT</span>
        <span style={{ ...PX, fontSize:4, color:'#442266' }}>SAT 7PM</span>
        {/* Tape corners */}
        {[[0,0],[44,0],[0,60],[44,60]].map(([tx,ty],ti)=>(
          <div key={ti} style={{ position:'absolute', top:ty, left:tx, width:10, height:6, background:'rgba(255,230,150,0.35)', transform:'rotate(-5deg)' }}/>
        ))}
      </div>
      {/* HIGH SCORE leaderboard — larger, more detailed */}
      <div style={{ position:'absolute', top:'7%', left:'50%', transform:'translateX(-50%)', width:130, height:62, background:'#060a16', border:'2px solid #1a2840', zIndex:5, padding:'5px 7px' }}>
        <div style={{ height:2, background:'linear-gradient(to right,#ffcc00,#ff8800,#ffcc00)', marginBottom:4 }}/>
        <div style={{ ...PX, fontSize:6, color:'#ffaa00', textAlign:'center', marginBottom:4, textShadow:'0 0 6px #ffaa00' }}>HIGH SCORE</div>
        {[['★ AAA','99,999','#ffcc00'],['  BBB','87,650','#00ccff'],['  CCC','76,420','#ff44cc'],['  DDD','65,100','#44ff88']].map(([name,score,col],ri)=>(
          <div key={ri} style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
            <span style={{ ...PX, fontSize:4, color:col as string }}>{name}</span>
            <span style={{ ...PX, fontSize:4, color:col as string }}>{score}</span>
          </div>
        ))}
      </div>
      {/* Anime character poster — left wall */}
      <div style={{ position:'absolute', top:'19%', left:'40%', width:38, height:62, background:'#080614', border:'1px solid #1a1040', zIndex:4, overflow:'hidden' }}>
        {/* Poster gradient background */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,#1a0830,#0a1040)' }}/>
        {/* Character silhouette (pixel-art style) */}
        <div style={{ position:'absolute', top:8, left:'50%', transform:'translateX(-50%)' }}>
          <Sprite grid={GIRL_GRID.slice(0,10)} palette={GIRL_PAL} px={2}/>
        </div>
        <div style={{ position:'absolute', bottom:4, left:0, right:0, textAlign:'center' }}>
          <span style={{ ...PX, fontSize:3, color:'#ff88cc' }}>LIMITED</span>
        </div>
        {/* Stars decoration */}
        {[[6,6],[28,10],[4,22],[32,18]].map(([sx,sy],si)=>(
          <div key={si} style={{ position:'absolute', top:sy, left:sx, width:3, height:3, background:'#ffee44', opacity:0.75, clipPath:'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }}/>
        ))}
      </div>
      {/* UFO catcher promo sticker */}
      <div style={{ position:'absolute', top:'21%', right:'18%', width:46, height:50, background:'#0a1020', border:'1px solid #1a3040', borderRadius:2, zIndex:4, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
        <span style={{ ...PX, fontSize:4, color:'#00ccff', textShadow:'0 0 4px #00ccff' }}>UFO</span>
        <Sprite {...SPRITE_MAP['shiba']} px={3}/>
        <span style={{ ...PX, fontSize:4, color:'#1e4060' }}>100¥</span>
      </div>
      {/* Rules / "No Food" sticker cluster */}
      <div style={{ position:'absolute', top:'22%', left:'1%', width:34, height:42, zIndex:4, display:'flex', flexDirection:'column', gap:2 }}>
        {[['NO FOOD','#ff4444'],['COINS ONLY','#ffaa00'],['BE NICE!','#44ccff']].map(([txt,col],si)=>(
          <div key={si} style={{ background:'#080c18', border:`1px solid ${col}55`, padding:'2px 3px', textAlign:'center' }}>
            <span style={{ ...PX, fontSize:3, color:col as string }}>{txt}</span>
          </div>
        ))}
      </div>
      {/* Sticker-bomb column on the right pillar */}
      <div style={{ position:'absolute', top:'25%', right:'5.5%', width:18, height:80, zIndex:4 }}>
        {[['#ff4488','★'],['#44ccff','♪'],['#ffcc00','!'],['#44ff88','♥'],['#cc44ff','★'],['#ff8800','♦']].map(([c,t],i)=>(
          <motion.div key={i} animate={{ opacity:[0.6,1,0.6] }} transition={{ duration:1.5+i*0.4, repeat:Infinity }}
            style={{ position:'absolute', top:i*13, left:i%2*6, width:12, height:10, background:`${c}22`, border:`1px solid ${c}66`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:6, color:c as string }}>{t}</span>
          </motion.div>
        ))}
      </div>
      {/* Exit sign top right */}
      <motion.div animate={{ opacity:[0.7,1,0.7] }} transition={{ duration:2.5, repeat:Infinity }}
        style={{ position:'absolute', top:'4%', right:'5%', background:'#001a00', border:'1px solid #004400', padding:'2px 6px', zIndex:6 }}>
        <span style={{ ...PX, fontSize:6, color:'#00ff44', textShadow:'0 0 6px #00ff44' }}>EXIT ▶</span>
      </motion.div>
      {/* Restroom sign */}
      <div style={{ position:'absolute', top:'4%', left:'3%', background:'#001020', border:'1px solid #002840', padding:'2px 5px', zIndex:6 }}>
        <span style={{ ...PX, fontSize:5, color:'#4488ff' }}>♂♀ →</span>
      </div>

      {/* ── Cabinets ── */}
      {/* Racing (far left) */}
      <div style={{ position:'absolute', bottom:'28%', left:'7%', width:76, zIndex:5 }}>
        <div style={{ ...PX, fontSize:5, color:'#ff6600', textAlign:'center', marginBottom:2, textShadow:'0 0 4px #ff6600' }}>TURBO GP</div>
        <div style={{ width:76, height:168, background:'#0c1020', border:'2px solid #1e3040', borderRadius:'4px 4px 0 0', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:6, left:6, right:6, height:72, background:'#080c14', border:'2px solid #1a3040', overflow:'hidden' }}>
            <motion.div animate={{ x:[-50,50,-50] }} transition={{ duration:2.8, repeat:Infinity, ease:'linear' }}
              style={{ height:'100%', background:'linear-gradient(to right,#040810 0%,#0a1830 45%,#0e2040 50%,#0a1830 55%,#040810 100%)', position:'relative' }}>
              <div style={{ position:'absolute', bottom:10, left:0, right:0, height:2, background:'#ffffff18' }}/>
              <div style={{ position:'absolute', bottom:14, left:28, width:12, height:7, background:'#ff4422', borderRadius:1 }}/>
              <div style={{ position:'absolute', bottom:14, left:45, width:8, height:5, background:'#4488ff', borderRadius:1 }}/>
            </motion.div>
          </div>
          {/* Steering wheel */}
          <div style={{ position:'absolute', bottom:18, left:'50%', transform:'translateX(-50%)', width:36, height:12, background:'#141e2c', borderRadius:20, border:'2px solid #1e3048' }}>
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:14, height:2, background:'#2a4060' }}/>
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%) rotate(90deg)', width:14, height:2, background:'#2a4060' }}/>
          </div>
          <div style={{ position:'absolute', top:3, left:3, right:3, height:2, background:'#ff6600',
            animation:'arc-bshadow-bet 2.8s ease-in-out infinite' }}/>
          <div style={{ position:'absolute', top:3, left:3, right:3, height:1, background:'#ff660044' }}/>
        </div>
        <div style={{ width:80, height:6, background:'#142030', marginLeft:-2 }}/>
        {/* Yankee playing racing — leaning in */}
        <PixelChar id="yankee" px={3} sway b={-46} x={-6}/>
      </div>

      {/* BEAT RUSH cabinet (center-left) */}
      <div style={{ position:'absolute', bottom:'28%', left:'22%', width:86, zIndex:5 }}>
        <div style={{ ...PX, fontSize:5, color:'#cc44ff', textAlign:'center', marginBottom:2, textShadow:'0 0 6px #cc44ff' }}>BEAT RUSH!!</div>
        <div style={{ width:86, height:195, background:'#0e0a1e', border:'2px solid #2a1848', borderRadius:'4px 4px 0 0', position:'relative' }}>
          <div style={{ position:'absolute', top:6, left:6, right:6, height:90, background:'#080610', border:'2px solid #1c1030', overflow:'hidden', display:'flex', flexDirection:'column', gap:2, padding:4 }}>
            {LANE_COLORS.map((c,i)=>(
              <div key={i} style={{ height:16, background:c, opacity:0.85, transformOrigin:'left', borderRadius:1, display:'flex', alignItems:'center', justifyContent:'center',
                animation:'arc-scalex 1.8s ease-in-out infinite', animationDuration:`${1.8+i*0.35}s` }}>
                <ArrowShape lane={i} size={8} color='rgba(0,0,0,0.4)'/>
              </div>
            ))}
          </div>
          {/* Dance pad */}
          <div style={{ position:'absolute', bottom:10, left:8, right:8, height:36, display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:3 }}>
            {LANE_COLORS.map((c,i)=>(
              <motion.div key={i} animate={{ opacity:[0.4,0.85,0.4], boxShadow:[`0 0 4px ${c}`,`0 0 12px ${c}`,`0 0 4px ${c}`] }} transition={{ duration:1.8+i*0.32, repeat:Infinity }}
                style={{ background:`${c}22`, border:`2px solid ${c}77`, borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <ArrowShape lane={i} size={9} color={c}/>
              </motion.div>
            ))}
          </div>
          <div style={{ position:'absolute', top:104, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap' }}>
            <motion.span animate={{ color:['#ff44cc','#cc44ff','#4488ff','#ff44cc'] }} transition={{ duration:1.8, repeat:Infinity }}
              style={{ ...PX, fontSize:5 }}>BEAT RUSH</motion.span>
          </div>
          <motion.div animate={{ boxShadow:['0 0 10px #cc44ff','0 0 24px #cc44ff','0 0 10px #cc44ff'] }} transition={{ duration:2.6, repeat:Infinity }}
            style={{ position:'absolute', top:3, left:3, right:3, height:2, background:'#cc44ff' }}/>
        </div>
        <div style={{ width:90, height:6, background:'#1a1030', marginLeft:-2 }}/>
        {/* Schoolgirl + kid bouncing near Beat Rush */}
        <PixelChar id="girl"   px={3} bounce b={-46} x={-14}/>
        <PixelChar id="kid"    px={3} bounce b={-43} x={70}/>
      </div>

      {/* Fighting game (center-right) */}
      <div style={{ position:'absolute', bottom:'28%', right:'22%', width:84, zIndex:5 }}>
        <div style={{ ...PX, fontSize:5, color:'#ff2244', textAlign:'center', marginBottom:2, textShadow:'0 0 4px #ff2244' }}>STREET BRAWL</div>
        <div style={{ width:84, height:188, background:'#0e1020', border:'2px solid #1e2448', borderRadius:'4px 4px 0 0', position:'relative' }}>
          <div style={{ position:'absolute', top:6, left:6, right:6, height:88, background:'#0a0c18', border:'2px solid #223', overflow:'hidden' }}>
            <motion.div animate={{ opacity:[0.75,1,0.75] }} transition={{ duration:1.6, repeat:Infinity }}
              style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#280a00,#001832)', display:'flex', alignItems:'center', justifyContent:'space-around', padding:'0 4px' }}>
              {/* Fighter L */}
              <div style={{ width:22, height:40, position:'relative' }}>
                <div style={{ position:'absolute', top:0, left:4, width:14, height:14, borderRadius:'50%', background:'#ff9966' }}/>
                <div style={{ position:'absolute', top:14, left:2, right:2, height:18, background:'#ff2244', borderRadius:'2px 2px 0 0' }}/>
                <div style={{ position:'absolute', top:14, left:0, width:6, height:14, background:'#ff4444', borderRadius:2, transform:'rotate(-20deg)', transformOrigin:'top center' }}/>
                <div style={{ position:'absolute', bottom:0, left:3, width:6, height:10, background:'#222' }}/>
                <div style={{ position:'absolute', bottom:0, right:3, width:6, height:10, background:'#222' }}/>
              </div>
              <span style={{ ...PX, fontSize:8, color:'#ffaa00', textShadow:'0 0 6px #ffaa00' }}>VS</span>
              {/* Fighter R */}
              <div style={{ width:22, height:40, position:'relative' }}>
                <div style={{ position:'absolute', top:0, left:4, width:14, height:14, borderRadius:'50%', background:'#66aaff' }}/>
                <div style={{ position:'absolute', top:14, left:2, right:2, height:18, background:'#2244ff', borderRadius:'2px 2px 0 0' }}/>
                <div style={{ position:'absolute', top:14, right:0, width:6, height:14, background:'#4466ff', borderRadius:2, transform:'rotate(20deg)', transformOrigin:'top center' }}/>
                <div style={{ position:'absolute', bottom:0, left:3, width:6, height:10, background:'#222' }}/>
                <div style={{ position:'absolute', bottom:0, right:3, width:6, height:10, background:'#222' }}/>
              </div>
            </motion.div>
          </div>
          {/* HP bars */}
          <div style={{ position:'absolute', top:100, left:6, right:6, display:'flex', flexDirection:'column', gap:3 }}>
            {[{c:'#ff2244',w:'75%'},{c:'#2244ff',w:'40%'}].map((hp,i)=>(
              <div key={i} style={{ height:6, background:'#0a0c18', border:'1px solid #1e2040', borderRadius:2 }}>
                <motion.div animate={{ width:[hp.w,hp.w] }} style={{ height:'100%', width:hp.w, background:hp.c, borderRadius:2, boxShadow:`0 0 4px ${hp.c}` }}/>
              </div>
            ))}
          </div>
          {/* Buttons */}
          <div style={{ position:'absolute', bottom:8, left:8, right:8, height:44, background:'#0c0e1a', border:'1px solid #182030', borderRadius:2, display:'flex', flexDirection:'column', gap:4, padding:4 }}>
            {[['#ff2244','#ff4400','#ffcc00'],['#0044ff','#00ccff','#22cc00']].map((row,r)=>(
              <div key={r} style={{ display:'flex', gap:5 }}>{row.map((c,ci)=>(
                <motion.div key={ci} animate={{ boxShadow:[`0 0 3px ${c}`,`0 0 8px ${c}`,`0 0 3px ${c}`] }} transition={{ duration:2.2+ci*0.4, repeat:Infinity }}
                  style={{ width:15, height:11, borderRadius:3, background:c, opacity:0.75 }}/>
              ))}</div>
            ))}
          </div>
          <motion.div animate={{ boxShadow:['0 0 8px #ff2244','0 0 20px #ff2244','0 0 8px #ff2244'] }} transition={{ duration:2.9, repeat:Infinity }}
            style={{ position:'absolute', top:3, left:3, right:3, height:2, background:'#ff2244' }}/>
        </div>
        <div style={{ width:88, height:6, background:'#182030', marginLeft:-2 }}/>
        {/* Salaryman + girl watching fighting game */}
        <PixelChar id="salary" px={3} sway  b={-46} x={-10}/>
        <PixelChar id="girl"   px={3} sway  b={-46} x={74} flip/>
      </div>

      {/* Shooter (far right) */}
      <div style={{ position:'absolute', bottom:'28%', right:'7%', width:76, zIndex:5 }}>
        <div style={{ ...PX, fontSize:5, color:'#00ccff', textAlign:'center', marginBottom:2, textShadow:'0 0 4px #00ccff' }}>STAR BLITZ</div>
        <div style={{ width:76, height:170, background:'#0a1018', border:'2px solid #102838', borderRadius:'4px 4px 0 0', position:'relative' }}>
          <div style={{ position:'absolute', top:6, left:6, right:6, height:78, background:'#060c12', border:'2px solid #1a2838', overflow:'hidden' }}>
            <div style={{ width:'100%', height:'100%', background:'#000', position:'relative' }}>
              {/* Star field */}
              {[...Array(8)].map((_,i)=>(
                <motion.div key={i} animate={{ opacity:[0.2,1,0.2] }} transition={{ duration:0.8+i*0.15, repeat:Infinity, delay:i*0.1 }}
                  style={{ position:'absolute', left:`${10+i*11}%`, top:`${15+i%3*25}%`, width:2, height:2, background:'#fff', borderRadius:'50%' }}/>
              ))}
              {/* Bullets */}
              {[...Array(5)].map((_,i)=>(
                <motion.div key={i} animate={{ y:[0,-84] }} transition={{ duration:0.9+i*0.18, repeat:Infinity, delay:i*0.18, ease:'linear' }}
                  style={{ position:'absolute', left:`${12+i*16}%`, top:'88%', width:3, height:7, background:`hsl(${i*50+160},100%,70%)`, borderRadius:1, boxShadow:`0 0 4px hsl(${i*50+160},100%,70%)` }}/>
              ))}
              {/* Player ship */}
              <div style={{ position:'absolute', bottom:6, left:'50%', transform:'translateX(-50%)', width:16, height:10, background:'#00aaff', clipPath:'polygon(50% 0%,100% 100%,0% 100%)' }}/>
            </div>
          </div>
          {/* Gun peripheral */}
          <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', width:24, height:32, background:'#0e1824', border:'1px solid #1a2838', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:8, height:24, background:'#182838', borderRadius:'2px 2px 4px 4px' }}>
              <div style={{ width:'100%', height:4, background:'#1e3848', borderRadius:'2px 2px 0 0' }}/>
            </div>
          </div>
          <div style={{ position:'absolute', top:3, left:3, right:3, height:2, background:'#00ccff',
            animation:'arc-bshadow-claw 3.2s ease-in-out infinite' }}/>
        </div>
        <div style={{ width:80, height:6, background:'#102028', marginLeft:-2 }}/>
        {/* Gamer hunched over shooter */}
        <PixelChar id="gamer" px={3} b={-46} x={18}/>
      </div>

      {/* ── Gachapon / capsule machine corner (far left) ── */}
      <div style={{ position:'absolute', bottom:'28%', left:0, width:90, zIndex:6, display:'flex', gap:2, alignItems:'flex-end' }}>
        {[
          { col:'#ff4488', label:'¥200', prize:'shiba'  },
          { col:'#00ccff', label:'¥100', prize:'totoro' },
          { col:'#ffcc00', label:'¥200', prize:'ramen'  },
        ].map(({ col, label, prize }, gi)=>(
          <div key={gi} style={{ flex:1, position:'relative' }}>
            <div style={{ ...PX, fontSize:3, color:col, textAlign:'center', marginBottom:2, textShadow:`0 0 4px ${col}` }}>{label}</div>
            {/* Globe */}
            <motion.div animate={{ boxShadow:[`0 0 6px ${col}55`,`0 0 14px ${col}88`,`0 0 6px ${col}55`] }}
              transition={{ duration:1.8+gi*0.4, repeat:Infinity }}
              style={{ width:26, height:26, borderRadius:'50%', background:`${col}18`, border:`2px solid ${col}66`, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Sprite {...SPRITE_MAP[prize as keyof typeof SPRITE_MAP]} px={2}/>
            </motion.div>
            {/* Body */}
            <div style={{ width:'100%', height:52, background:'#0a1420', border:`1px solid ${col}44`, position:'relative' }}>
              {/* Display window */}
              <div style={{ position:'absolute', top:4, left:3, right:3, height:18, background:'#060e1a', border:`1px solid ${col}33`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Sprite {...SPRITE_MAP[prize as keyof typeof SPRITE_MAP]} px={2}/>
              </div>
              {/* Coin slot */}
              <div style={{ position:'absolute', top:26, left:'50%', transform:'translateX(-50%)', width:14, height:3, background:'#040810', border:'1px solid #1a2838', borderRadius:1 }}/>
              {/* Turn knob */}
              <div style={{ position:'absolute', top:32, left:'50%', transform:'translateX(-50%)', width:12, height:12, borderRadius:'50%', background:'#0e1828', border:`2px solid ${col}55`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:6, height:2, background:`${col}55`, borderRadius:1 }}/>
              </div>
              {/* Prize slot at base */}
              <div style={{ position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)', width:16, height:6, background:'#040810', border:`1px solid ${col}44`, borderRadius:2 }}/>
            </div>
            <div style={{ width:'100%', height:4, background:'#0e1828' }}/>
          </div>
        ))}
        {/* Kid excited at gachapon */}
        <PixelChar id="kid" px={3} bounce b={4} x={-4}/>
      </div>

      {/* ── Prize redemption shelf (next to gachapon) ── */}
      <div style={{ position:'absolute', bottom:'28%', left:92, width:56, zIndex:5 }}>
        <div style={{ ...PX, fontSize:4, color:'#ffaa00', textAlign:'center', marginBottom:2, textShadow:'0 0 4px #ffaa00' }}>PRIZES</div>
        <div style={{ width:56, height:80, background:'#080e1c', border:'2px solid #1a2840', position:'relative' }}>
          {/* Glass shelf lines */}
          {[22,44].map(sy=><div key={sy} style={{ position:'absolute', top:sy, left:2, right:2, height:1, background:'rgba(100,200,255,0.2)' }}/>)}
          {/* Prize sprites on shelves */}
          <div style={{ position:'absolute', top:4, left:4, right:4, display:'flex', gap:3 }}>
            {['shiba','ramen'].map(id=><Sprite key={id} {...SPRITE_MAP[id as keyof typeof SPRITE_MAP]} px={3}/>)}
          </div>
          <div style={{ position:'absolute', top:27, left:4, right:4, display:'flex', gap:3 }}>
            {['totoro','capsule'].map(id=><Sprite key={id} {...SPRITE_MAP[id as keyof typeof SPRITE_MAP]} px={3}/>)}
          </div>
          {/* Ticket counter */}
          <div style={{ position:'absolute', bottom:4, left:4, right:4, height:14, background:'#0a1428', border:'1px solid #1a3448', display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
            <span style={{ ...PX, fontSize:3.5, color:'#ffee88' }}>🎫</span>
            <span style={{ ...PX, fontSize:3.5, color:'#664400' }}>チケット</span>
          </div>
        </div>
        <div style={{ width:56, height:4, background:'#101c2c' }}/>
      </div>

      {/* ── Purikura photo booth (right side) ── */}
      <div style={{ position:'absolute', bottom:'28%', right:'2%', width:52, zIndex:6 }}>
        <div style={{ ...PX, fontSize:3.5, color:'#ff88cc', textAlign:'center', marginBottom:2, textShadow:'0 0 4px #ff88cc' }}>PURIKURA</div>
        <div style={{ width:52, height:100, background:'#0c0820', border:'2px solid #3a1060', borderRadius:'4px 4px 0 0', position:'relative' }}>
          {/* Screen */}
          <motion.div animate={{ opacity:[0.8,1,0.8] }} transition={{ duration:2, repeat:Infinity }}
            style={{ position:'absolute', top:6, left:4, right:4, height:50, background:'#080412', border:'1px solid #2a0848', overflow:'hidden' }}>
            <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#ff88cc22,#88aaff22)', display:'flex', flexWrap:'wrap', gap:2, padding:3 }}>
              {[['#201030','#4a1060'],['#102030','#1a3060'],['#301020','#601030'],['#203010','#406020']].map(([bg,bd],pi)=>(
                <div key={pi} style={{ width:16, height:22, background:bg, border:`1px solid ${bd}`, borderRadius:1 }}/>
              ))}
            </div>
          </motion.div>
          {/* Neon trim */}
          <motion.div animate={{ boxShadow:['0 0 6px #ff88cc','0 0 16px #ff88cc','0 0 6px #ff88cc'] }} transition={{ duration:2.4, repeat:Infinity }}
            style={{ position:'absolute', top:3, left:3, right:3, height:1, background:'#ff88cc' }}/>
          {/* Input panel */}
          <div style={{ position:'absolute', top:60, left:4, right:4, height:28, background:'#0a0618', border:'1px solid #3a1060', borderRadius:2, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:3 }}>
            <span style={{ ...PX, fontSize:3.5, color:'#ff88cc' }}>ポーズ！</span>
            <div style={{ display:'flex', gap:3 }}>
              {['#ff88cc','#88aaff','#aaff88','#ffcc44'].map((c,i)=>(
                <div key={i} style={{ width:9, height:7, background:`${c}33`, border:`1px solid ${c}88`, borderRadius:1 }}/>
              ))}
            </div>
          </div>
          {/* Curtain slot */}
          <div style={{ position:'absolute', bottom:3, left:4, right:4, height:4, background:'#1a0030', border:'1px solid #440080', borderRadius:1 }}/>
        </div>
        <div style={{ width:52, height:4, background:'#1a0a2e' }}/>
        {/* Girl posing for purikura */}
        <PixelChar id="girl" px={3} b={4} x={-18} bounce/>
      </div>

      {/* ── Drinks vending machine (tucked behind purikura) ── */}
      <div style={{ position:'absolute', bottom:'28%', right:0, width:36, zIndex:5 }}>
        <div style={{ width:36, height:110, background:'#0c1420', border:'2px solid #1a2840', borderRadius:'2px 2px 0 0', position:'relative' }}>
          {/* Screen/display */}
          <div style={{ position:'absolute', top:6, left:4, right:4, height:40, background:'#080e18', border:'1px solid #1e3040' }}>
            {[0,1,2].map(r=>(
              <div key={r} style={{ display:'flex', gap:2, padding:'2px 2px 0', marginTop:r>0?2:0 }}>
                {[0,1].map(c=>(
                  <motion.div key={c} animate={{ opacity:[0.5,0.85,0.5] }} transition={{ duration:2+r*0.5, repeat:Infinity, delay:c*0.4 }}
                    style={{ flex:1, height:10, background:['#0033aa','#aa1122','#008822','#6600aa','#aa5500','#003388'][r*2+c], borderRadius:1 }}/>
                ))}
              </div>
            ))}
          </div>
          {/* Coin slot */}
          <div style={{ position:'absolute', top:52, left:'50%', transform:'translateX(-50%)', width:18, height:6, background:'#040810', border:'1px solid #1a2838', borderRadius:1 }}/>
          {/* Buttons */}
          <div style={{ position:'absolute', top:62, left:4, right:4, height:20, display:'flex', gap:2, flexWrap:'wrap' }}>
            {[...Array(6)].map((_,i)=>(
              <div key={i} style={{ width:12, height:8, background:'#0e1824', border:`1px solid #${['ff2244','0088ff','22cc22','cc22cc','ff8800','00cccc'][i]}44`, borderRadius:1 }}/>
            ))}
          </div>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(0,180,255,0.05),transparent)', borderRadius:'2px 2px 0 0', pointerEvents:'none',
            animation:'arc-cabinet 2.5s ease-in-out infinite' }}/>
        </div>
        <div style={{ width:36, height:4, background:'#0e1828' }}/>
      </div>

      {/* ── Freestanding characters on floor ── */}
      {/* Yankee watching, centre-left */}
      <div style={{ position:'absolute', bottom:'calc(28% + 18px)', left:'36%', zIndex:6 }}>
        <PixelChar id="yankee" px={3} b={0} x={0}/>
      </div>
      {/* Salaryman strolling, centre-right */}
      <div style={{ position:'absolute', bottom:'calc(28% + 18px)', left:'56%', zIndex:6 }}>
        <PixelChar id="salary" px={3} sway b={0} x={0}/>
      </div>
      {/* Distant background characters (smaller, dim for depth) */}
      <div style={{ position:'absolute', bottom:'calc(28% + 18px)', left:'34%', zIndex:3, opacity:0.42 }}>
        <PixelChar id="girl" px={2} b={0} x={0}/>
      </div>
      <div style={{ position:'absolute', bottom:'calc(28% + 18px)', left:'62%', zIndex:3, opacity:0.38 }}>
        <PixelChar id="kid" px={2} b={0} x={0}/>
      </div>

      {/* ── Floor ── */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'28%',
        background:'#07090f', borderTop:'3px solid #151d2c',
        backgroundImage:'repeating-linear-gradient(90deg,rgba(255,255,255,0.022) 0,rgba(255,255,255,0.022) 1px,transparent 1px,transparent 80px), repeating-linear-gradient(0deg,rgba(255,255,255,0.018) 0,rgba(255,255,255,0.018) 1px,transparent 1px,transparent 60px)' }}/>
      {/* Floor wax reflection strip */}
      <div style={{ position:'absolute', bottom:'1%', left:'20%', right:'20%', height:'4%', background:'linear-gradient(to right,transparent,rgba(100,160,255,0.05) 30%,rgba(100,160,255,0.08) 50%,rgba(100,160,255,0.05) 70%,transparent)', pointerEvents:'none', zIndex:5 }}/>

      {/* Floor cabinet glow reflections */}
      {[{x:'7%',c:'#ff6600'},{x:'22%',c:'#cc44ff'},{x:'42%',c:'#44aaff'},{x:'60%',c:'#ff2244'},{x:'78%',c:'#00ccff'},{x:'92%',c:'#4488ff'}].map((f,i)=>(
        <div key={i} style={{ position:'absolute', bottom:0, left:f.x, width:90, height:'28%',
          background:`radial-gradient(ellipse at 50% 100%, ${f.c}28, transparent 65%)`, pointerEvents:'none',
          animation:'arc-cabinet 1.8s ease-in-out infinite', animationDuration:`${1.8+i*0.6}s` }}/>
      ))}

      {/* Floor clutter: tickets, cables, coins */}
      {[{x:'30%',w:40,rot:-6},{x:'55%',w:28,rot:10},{x:'72%',w:36,rot:-3},{x:'44%',w:20,rot:4},{x:'66%',w:32,rot:-8}].map((t,i)=>(
        <div key={`t${i}`} style={{ position:'absolute', bottom:'28%', left:t.x, width:t.w, height:4, background:'#ffee88', borderRadius:1, zIndex:5, transform:`rotate(${t.rot}deg)`,
          animation:'arc-mid 3s ease-in-out infinite', animationDuration:`${3+i*0.7}s` }}/>
      ))}
      {/* Power cables snaking across floor */}
      <div style={{ position:'absolute', bottom:'28.5%', left:'35%', width:220, height:2, background:'#1a1a1a', zIndex:4, borderRadius:1 }}/>
      <div style={{ position:'absolute', bottom:'28.5%', left:'58%', width:60,  height:2, background:'#1a1a1a', zIndex:4, borderRadius:1, transform:'rotate(-8deg)', transformOrigin:'left' }}/>
      <div style={{ position:'absolute', bottom:'28.5%', left:'18%', width:80,  height:2, background:'#242424', zIndex:4, borderRadius:1, transform:'rotate(5deg)',  transformOrigin:'left' }}/>
      {/* Coins */}
      {[{x:'40%'},{x:'63%'},{x:'48%'},{x:'52%'},{x:'38%'}].map((c,i)=>(
        <div key={`coin${i}`} style={{ position:'absolute', bottom:'28.5%', left:c.x, width:5, height:5, borderRadius:'50%', background:'#ccaa00', border:'1px solid #ffcc00', zIndex:5,
          animation:'arc-coin 2s ease-in-out infinite', animationDuration:`${2+i*0.5}s` }}/>
      ))}
      {/* Empty drink cans on floor */}
      {[{x:'31%',c:'#cc1122'},{x:'65%',c:'#0044cc'},{x:'74%',c:'#22aa22'}].map(({x,c},i)=>(
        <div key={i} style={{ position:'absolute', bottom:'28.2%', left:x, width:8, height:12, background:c, border:`1px solid ${c}88`, borderRadius:'1px 1px 3px 3px', zIndex:5, opacity:0.65 }}/>
      ))}

      {/* ── Neon signs ── */}
      <div style={{ position:'absolute', top:'14%', left:'42%', transform:'translateX(-50%)', ...PX, fontSize:9, color:'#ff00ff', textShadow:'0 0 6px #ff00ff, 0 0 16px #ff00ff', letterSpacing:'0.05em',
        animation:'arc-neon 2.0s ease-in-out infinite' }}>
        INSERT COIN
      </div>
      <div style={{ position:'absolute', top:'9%', left:'16%', ...PX, fontSize:8, color:'#00ffff', textShadow:'0 0 8px #00ffff, 0 0 18px #00ffff', letterSpacing:'0.08em',
        animation:'arc-neon 2.6s ease-in-out infinite' }}>
        PLAY!
      </div>
      <div style={{ position:'absolute', top:'19%', right:'12%', ...PX, fontSize:7, color:'#ffaa00', textShadow:'0 0 6px #ffaa00',
        animation:'arc-neon 1.5s ease-in-out infinite', animationDelay:'0.8s' }}>
        ゲームセンター
      </div>
      <div style={{ position:'absolute', top:'11%', right:'36%', ...PX, fontSize:7, color:'#ff4488', textShadow:'0 0 5px #ff4488',
        animation:'arc-neon 3.5s ease-in-out infinite', animationDelay:'0.4s' }}>
        ★ 東京 ★
      </div>
      {/* Bonus neon: "GAME CENTER" kanji banner */}
      <div style={{ position:'absolute', top:'6%', left:'52%', ...PX, fontSize:6, color:'#4488ff', textShadow:'0 0 5px #4488ff', letterSpacing:'0.12em',
        animation:'arc-neon 3.2s ease-in-out infinite', animationDelay:'1.2s' }}>
        ゲームセンター東京
      </div>

      {/* ── Scrolling ticker ── */}
      <div style={{ position:'absolute', bottom:'28%', left:0, right:0, height:18, background:'rgba(2,4,14,0.88)', borderTop:'1px solid #1a2838', overflow:'hidden', zIndex:7 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'#00e8ff18' }}/>
        <motion.div animate={{ x:[1000,-2000] }} transition={{ duration:22, repeat:Infinity, ease:'linear' }}
          style={{ ...PX, fontSize:6, color:'#00e8ff', whiteSpace:'nowrap', lineHeight:'18px', paddingTop:3 }}>
          ★ WELCOME TO TOKYO GAME CENTER ★ &nbsp;&nbsp;&nbsp; UFO CATCHER ＝ 100¥ &nbsp;&nbsp;&nbsp; BEAT RUSH!! ＝ 100¥ &nbsp;&nbsp;&nbsp; ALL-TIME HIGH: AAA 99999 &nbsp;&nbsp;&nbsp; BEAT RUSH TOURNAMENT: SATURDAY 7PM &nbsp;&nbsp;&nbsp; NEW MACHINE ARRIVING FRIDAY &nbsp;&nbsp;&nbsp; ゲームセンター東京 &nbsp;&nbsp;&nbsp; ENJOY YOUR GAME ♪ &nbsp;&nbsp;&nbsp;
        </motion.div>
      </div>
    </div>
  );
});

// ─── Select screen ────────────────────────────────────────────────────────────
function SelectScreen({ onSelect, onExit }:{ onSelect:(v:ArcadeView)=>void; onExit:()=>void }) {
  const [hov, setHov] = useState<ArcadeView|null>(null);
  const GAMES = [
    { id:'claw'   as ArcadeView, label:'UFO CATCHER', sub:'クレーンゲーム', color:'#00ccff' },
    { id:'rhythm' as ArcadeView, label:'BEAT RUSH!!', sub:'リズムゲーム',   color:'#ff44cc' },
  ];
  return (
    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:10, gap:26 }}>
      <motion.div initial={{ y:-20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.1 }}>
        <span style={{ ...PX, fontSize:12, letterSpacing:'0.10em', textShadow:'0 0 16px currentColor',
          animation:'arc-select-color 3s ease-in-out infinite' }}>
          ★ GAME SELECT ★
        </span>
      </motion.div>
      <div style={{ display:'flex', gap:24 }}>
        {GAMES.map((g,i)=>(
          <motion.div key={g.id} initial={{ y:30, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.18+i*0.1 }}
            onPointerEnter={()=>setHov(g.id)} onPointerLeave={()=>setHov(null)} onClick={()=>onSelect(g.id)}
            style={{ cursor:'none', width:176, padding:'16px 12px', background:hov===g.id?`${g.color}10`:'rgba(5,8,18,0.96)',
              border:`2px solid ${hov===g.id?g.color:g.color+'40'}`,
              boxShadow:hov===g.id?`0 0 28px ${g.color}44, inset 0 0 20px ${g.color}08`:'none',
              transition:'all .16s', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <div style={{ width:104, height:112, background:'#080c18', border:`1px solid ${g.color}40`, borderRadius:2, position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
              {g.id==='claw'?(
                <>
                  <div style={{ display:'flex', gap:3 }}>{['shiba','totoro'].map(id=><Sprite key={id} {...SPRITE_MAP[id]} px={4}/>)}</div>
                  <div style={{ display:'flex', gap:3 }}>{['ramen','capsule'].map(id=><Sprite key={id} {...SPRITE_MAP[id]} px={4}/>)}</div>
                </>
              ):(
                <div style={{ display:'flex', gap:5 }}>{LANE_COLORS.map((c,i)=>(
                  <div key={i} style={{ width:16, height:38, background:c, borderRadius:3, transformOrigin:'bottom', display:'flex', alignItems:'center', justifyContent:'center',
                    animation:'arc-scaley 0.48s ease-in-out infinite', animationDuration:`${0.48+i*0.1}s` }}>
                    <ArrowShape lane={i} size={10} color='rgba(0,0,0,0.5)'/>
                  </div>
                ))}</div>
              )}
              <div style={{ position:'absolute', inset:0, background:`${g.color}0a`, pointerEvents:'none',
                animation:'arc-select-glow 0.9s ease-in-out infinite' }}/>
            </div>
            <span style={{ ...PX, fontSize:8, color:hov===g.id?g.color:'#3a6080', letterSpacing:'0.06em', textAlign:'center', lineHeight:1.9 }}>{g.label}</span>
            <span style={{ ...PX, fontSize:5, color:hov===g.id?`${g.color}aa`:'#1a3040' }}>{g.sub}</span>
            <div style={{ ...PX, fontSize:7, color:hov===g.id?g.color:'#1a3040', border:`1px solid ${hov===g.id?g.color:g.color+'30'}`, padding:'4px 10px', letterSpacing:'0.06em',
              boxShadow:hov===g.id?`0 0 8px ${g.color}44`:'none' }}>
              ▶ PLAY
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{...PX,fontSize:6,color:'#1a3848',letterSpacing:'0.08em',marginTop:2}}>BACKSPACE — EXIT TO MAP</div>
      <button onClick={onExit} style={{ ...PX, fontSize:7, color:'#1a3040', background:'transparent', border:'none', cursor:'none', marginTop:4, letterSpacing:'0.06em' }}>← BACK TO MAP</button>
    </div>
  );
}

// ─── Claw machine visuals ─────────────────────────────────────────────────────
function ClawMachineVisual({ clawX,phase,grabbedPrize,removedIds }:{clawX:number;phase:ClawPhase;grabbedPrize:PrizeData|null;removedIds:Set<string>}) {
  const cableDropped=['dropping','grabbing','rising'].includes(phase);
  const fingersOpen=!['grabbing','delivering','celebrating'].includes(phase);
  const deliverRight=phase==='delivering'||phase==='celebrating';
  const displayX=deliverRight?CABINET_W-CLAW_W-4:clawX;
  return (
    <div style={{ position:'relative', width:CABINET_W, height:310, overflow:'hidden' }}>
      <div style={{ position:'absolute', top:2, left:0, right:0, height:10, background:'#2a3a4a', border:'1px solid #3a5060', zIndex:20 }}>
        <div style={{ height:3, background:'linear-gradient(to bottom,#5a7a8a,#3a5060)', marginTop:1 }}/>
      </div>
      <div style={{ position:'absolute', right:0, top:100, width:10, height:80, background:'#0a1020', border:'1px solid #1a3040', borderRight:'none', zIndex:5 }}/>
      <motion.div animate={{ x:displayX }} transition={{ duration:deliverRight?0.44:0, ease:'easeInOut' }}
        style={{ position:'absolute', top:12, zIndex:25, width:CLAW_W }}>
        <motion.div animate={{ height:cableDropped?CABLE_DROP:18 }} transition={{ duration:0.60, ease:phase==='dropping'?'easeIn':'easeOut' }}
          style={{ width:3, background:'#5a7a8a', margin:'0 auto', transformOrigin:'top' }}/>
        <div style={{ width:CLAW_W, height:10, background:'#3a5060', border:'1px solid #5a7a8a', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#7ac4d8' }}/>
        </div>
        <div style={{ position:'relative', width:CLAW_W, height:24 }}>
          <motion.div animate={{ rotate:fingersOpen?-32:4 }} transition={{ duration:0.28 }} style={{ position:'absolute', left:4, top:0, width:5, height:22, background:'linear-gradient(to bottom,#88aabb,#5a7a8a)', transformOrigin:'top center', borderRadius:2 }}/>
          <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', top:0, width:4, height:18, background:'#8aabb8', borderRadius:2 }}/>
          <motion.div animate={{ rotate:fingersOpen?32:-4 }} transition={{ duration:0.28 }} style={{ position:'absolute', right:4, top:0, width:5, height:22, background:'linear-gradient(to bottom,#88aabb,#5a7a8a)', transformOrigin:'top center', borderRadius:2 }}/>
        </div>
        {grabbedPrize&&(phase==='rising'||phase==='delivering'||phase==='celebrating')&&(
          <div style={{ position:'absolute', top:52, left:'50%', transform:'translateX(-50%)' }}>
            <Sprite {...SPRITE_MAP[grabbedPrize.id]} px={4}/>
          </div>
        )}
      </motion.div>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.03),transparent 40%)', pointerEvents:'none', zIndex:2 }}/>
      {PRIZES.map(p=>(
        <AnimatePresence key={p.id}>
          {!removedIds.has(p.id)&&!(grabbedPrize?.id===p.id&&(phase==='rising'||phase==='delivering'||phase==='celebrating'))&&(
            <motion.div initial={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0, y:-30 }} transition={{ duration:0.3 }}
              style={{ position:'absolute', left:p.cabinetX, top:p.cabinetY, transform:'translate(-50%,-50%)', zIndex:3 }}>
              <Sprite {...SPRITE_MAP[p.id]} px={5}/>
            </motion.div>
          )}
        </AnimatePresence>
      ))}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:24, background:'linear-gradient(to top,#0c1424,#0a1018)', borderTop:'1px solid #1a2838' }}/>
    </div>
  );
}
function Cabinet({ clawX,phase,grabbedPrize,removedIds }:{clawX:number;phase:ClawPhase;grabbedPrize:PrizeData|null;removedIds:Set<string>}) {
  return (
    <div style={{ position:'relative', width:CABINET_W+36, display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ width:'100%', background:'#0e1828', border:'3px solid #1a3048', borderBottom:'none', padding:'6px 10px', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
        <motion.div animate={{ color:['#00e8ff','#ff00ff','#ffaa00','#00e8ff'] }} transition={{ duration:3, repeat:Infinity }}>
          <span style={{ ...PX, fontSize:8, letterSpacing:'0.10em' }}>★ UFO CATCHER ★</span>
        </motion.div>
        <span style={{ ...PX, fontSize:6, color:'#1e4060' }}>クレーンゲーム</span>
      </div>
      <div style={{ width:'100%', background:'#08111e', border:'3px solid #1a3048', borderTop:'2px solid #2a5070', padding:2, position:'relative' }}>
        <ClawMachineVisual clawX={clawX} phase={phase} grabbedPrize={grabbedPrize} removedIds={removedIds}/>
        <div style={{ position:'absolute', top:4, left:4, width:14, height:14, borderTop:'2px solid rgba(255,255,255,0.12)', borderLeft:'2px solid rgba(255,255,255,0.12)', pointerEvents:'none' }}/>
      </div>
      <div style={{ width:'100%', background:'#0c1624', border:'3px solid #1a3048', borderTop:'2px solid #2a4060', padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:5 }}>
          {[0,1].map(i=><div key={i} style={{ width:10, height:14, background:'#0a0e18', border:'1px solid #1a2838', borderRadius:2 }}><div style={{ width:6, height:1, background:'#2a4060', margin:'4px auto' }}/><div style={{ width:6, height:1, background:'#2a4060', margin:'2px auto' }}/></div>)}
        </div>
        <div style={{ width:20, height:8, background:'#050810', border:'1px solid #1a2838', borderRadius:1 }}/>
        <span style={{ ...PX, fontSize:5, color:'#0e2040' }}>100¥</span>
      </div>
    </div>
  );
}
function Celebration({ prize }:{prize:PrizeData}) {
  const SPARKS=Array.from({length:14},(_,i)=>({angle:(i/14)*360,dist:42+Math.random()*58,color:['#ffcc00','#ff4488','#00ffcc','#ff8800','#4488ff'][i%5]}));
  return (
    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:50, pointerEvents:'none' }}>
      {SPARKS.map((s,i)=>(
        <motion.div key={i} initial={{ x:0,y:0,opacity:1,scale:0 }} animate={{ x:Math.cos(s.angle*Math.PI/180)*s.dist, y:Math.sin(s.angle*Math.PI/180)*s.dist, opacity:0, scale:1 }} transition={{ duration:0.7,delay:0.1,ease:'easeOut' }}
          style={{ position:'absolute', width:6, height:6, borderRadius:1, background:s.color, boxShadow:`0 0 6px ${s.color}` }}/>
      ))}
      <motion.div initial={{ scale:0.4,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ type:'spring',stiffness:400,damping:18,delay:0.15 }}
        style={{ ...PX, fontSize:14, color:'#ffcc00', textShadow:'0 0 12px #ffcc00, 0 0 24px #ff8800', letterSpacing:'0.06em', textAlign:'center', lineHeight:1.8 }}>
        YOU GOT IT!<br/><span style={{ fontSize:9, color:'#aaddff' }}>{prize.name}</span>
      </motion.div>
    </div>
  );
}
function WonShelf({ prizes }:{prizes:PrizeData[]}) {
  if(!prizes.length) return null;
  return (
    <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
      <span style={{ ...PX, fontSize:7, color:'#1e4060' }}>WON:</span>
      {prizes.map(p=>(
        <motion.div key={p.id} initial={{ scale:0,y:-20 }} animate={{ scale:1,y:0 }} transition={{ type:'spring',stiffness:300 }}>
          <Sprite {...SPRITE_MAP[p.id]} px={4}/>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Claw game view ───────────────────────────────────────────────────────────
function ClawGameView({ onBack,sfx }:{onBack:()=>void;sfx:(f:number[],d:number[],w?:OscillatorType)=>void}) {
  const [clawX,setClawX]=useState(10),[phase,setPhase]=useState<ClawPhase>('ready');
  const [attemptsLeft,setAttempts]=useState(3),[grabbedPrize,setGrabbed]=useState<PrizeData|null>(null);
  const [removedIds,setRemoved]=useState<Set<string>>(new Set()),[wonPrizes,setWonPrizes]=useState<PrizeData[]>([]);
  const [showCelebration,setShowCelebration]=useState(false),[missText,setMissText]=useState(false);
  const clawXRef=useRef(10),phaseRef=useRef<ClawPhase>('ready'),attemptsRef=useRef(3);
  const leftHeld=useRef(false),rightHeld=useRef(false),rafRef=useRef<number|null>(null),timers=useRef<number[]>([]);
  const after=(fn:()=>void,ms:number)=>{const id=window.setTimeout(fn,ms);timers.current.push(id);};
  useEffect(()=>()=>{timers.current.forEach(clearTimeout);},[]);
  useEffect(()=>{
    const loop=()=>{if(phaseRef.current==='ready'){let x=clawXRef.current;if(leftHeld.current)x=Math.max(0,x-1.8);if(rightHeld.current)x=Math.min(CABINET_W-CLAW_W-4,x+1.8);if(x!==clawXRef.current){clawXRef.current=x;setClawX(x);}}rafRef.current=requestAnimationFrame(loop);};
    rafRef.current=requestAnimationFrame(loop);return()=>{if(rafRef.current)cancelAnimationFrame(rafRef.current);};
  },[]);
  const handleDrop=useCallback(()=>{
    if(phaseRef.current!=='ready')return;
    const cx=clawXRef.current+CLAW_W/2,avail=PRIZES.filter(p=>!removedIds.has(p.id)),hit=avail.find(p=>Math.abs(p.cabinetX-cx)<HIT_RANGE);
    phaseRef.current='dropping';setPhase('dropping');sfx([880,660,440],[0.08,0.08,0.12]);
    after(()=>{phaseRef.current='grabbing';setPhase('grabbing');sfx([330,220],[0.1,0.15],'sawtooth');
      after(()=>{
        if(hit){setGrabbed(hit);phaseRef.current='rising';setPhase('rising');
          after(()=>{phaseRef.current='delivering';setPhase('delivering');
            after(()=>{setRemoved(prev=>new Set([...prev,hit.id]));setWonPrizes(prev=>[...prev,hit]);const na=attemptsRef.current-1;attemptsRef.current=na;setAttempts(na);phaseRef.current='celebrating';setPhase('celebrating');setShowCelebration(true);sfx([523,659,784,1047,784,1047],[0.1,0.1,0.1,0.2,0.1,0.3]);
              after(()=>{setShowCelebration(false);setGrabbed(null);if(na<=0){phaseRef.current='gameover';setPhase('gameover');}else{clawXRef.current=10;setClawX(10);phaseRef.current='ready';setPhase('ready');}},2200);
            },480);
          },650);
        }else{phaseRef.current='rising';setPhase('rising');sfx([220,165,110],[0.1,0.1,0.25],'sawtooth');const na=attemptsRef.current-1;attemptsRef.current=na;setAttempts(na);
          after(()=>{setMissText(true);after(()=>{setMissText(false);if(na<=0){phaseRef.current='gameover';setPhase('gameover');}else{clawXRef.current=10;setClawX(10);phaseRef.current='ready';setPhase('ready');}},900);},650);
        }
      },380);
    },650);
  },[removedIds,sfx]);
  // Arrow key / Space keyboard support — must come AFTER handleDrop is defined
  useEffect(()=>{
    const kd=(e:KeyboardEvent)=>{
      if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){e.preventDefault();leftHeld.current=true;}
      if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){e.preventDefault();rightHeld.current=true;}
      if((e.key===' '||e.key==='ArrowDown')&&phaseRef.current==='ready'){e.preventDefault();handleDrop();}
    };
    const ku=(e:KeyboardEvent)=>{
      if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') leftHeld.current=false;
      if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') rightHeld.current=false;
    };
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);
    return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);leftHeld.current=false;rightHeld.current=false;};
  },[handleDrop]);
  const handlePlayAgain=()=>{attemptsRef.current=3;clawXRef.current=10;setAttempts(3);setClawX(10);setRemoved(new Set());setWonPrizes([]);setGrabbed(null);phaseRef.current='ready';setPhase('ready');};
  const cyan='#00e8ff',canDrop=phase==='ready'&&attemptsLeft>0;
  const btnS=(active=true):React.CSSProperties=>({...PX,fontSize:14,padding:'10px 18px',cursor:'none',background:'rgba(0,16,32,0.95)',border:`2px solid ${active?cyan+'88':'#1a3040'}`,color:active?cyan:'#1a3040',boxShadow:active?`0 0 10px ${cyan}22`:'none',userSelect:'none'});
  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:10 }}>
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
        <span style={{ ...PX,fontSize:8,color:'#1e4060' }}>TRIES:</span>
        {[1,2,3].map(i=>(
          <motion.div key={i} animate={{ scale:i<=attemptsLeft?1:0.6 }} style={{ width:14,height:14,borderRadius:'50%',border:`2px solid ${i<=attemptsLeft?cyan:'#1a3040'}`,background:i<=attemptsLeft?`${cyan}22`:'transparent',boxShadow:i<=attemptsLeft?`0 0 6px ${cyan}`:'none',transition:'all .25s' }}/>
        ))}
      </div>
      <div style={{ position:'relative' }}>
        <Cabinet clawX={clawX} phase={phase} grabbedPrize={grabbedPrize} removedIds={removedIds}/>
        <AnimatePresence>{showCelebration&&grabbedPrize&&<motion.div key="cel" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><Celebration prize={grabbedPrize}/></motion.div>}</AnimatePresence>
        <AnimatePresence>{missText&&<motion.div key="miss" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:60}}><span style={{...PX,fontSize:13,color:'#ff4444',textShadow:'0 0 10px #ff4444'}}>MISS...</span></motion.div>}</AnimatePresence>
      </div>
      {phase!=='gameover'&&(
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:6,marginTop:12 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <button style={btnS()} onPointerDown={()=>{leftHeld.current=true;}} onPointerUp={()=>{leftHeld.current=false;}} onPointerLeave={()=>{leftHeld.current=false;}}>◄</button>
            <button style={{...btnS(canDrop),fontSize:12,padding:'10px 16px',background:canDrop?'rgba(0,232,255,0.08)':'rgba(0,16,32,0.95)'}} onPointerDown={handleDrop} disabled={!canDrop}>▼ DROP</button>
            <button style={btnS()} onPointerDown={()=>{rightHeld.current=true;}} onPointerUp={()=>{rightHeld.current=false;}} onPointerLeave={()=>{rightHeld.current=false;}}>►</button>
          </div>
          <div style={{...PX,fontSize:6,color:'#1a4060',letterSpacing:'0.08em'}}>← → MOVE  •  SPACE DROP  •  BACKSPACE MENU</div>
        </div>
      )}
      <WonShelf prizes={wonPrizes}/>
      <AnimatePresence>
        {phase==='gameover'&&(
          <motion.div key="go" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{marginTop:16,display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
            <span style={{...PX,fontSize:10,color:wonPrizes.length>0?'#ffcc00':'#888',letterSpacing:'0.08em'}}>{wonPrizes.length>0?`GOT ${wonPrizes.length} PRIZE${wonPrizes.length>1?'S':''}!`:'NO PRIZES...'}</span>
            <div style={{display:'flex',gap:10}}>
              <button onClick={handlePlayAgain} style={{...PX,fontSize:8,padding:'8px 12px',cursor:'none',background:'rgba(0,232,255,0.08)',border:`2px solid ${cyan}88`,color:cyan,letterSpacing:'0.06em'}}>▶ PLAY AGAIN</button>
              <button onClick={onBack} style={{...PX,fontSize:8,padding:'8px 12px',cursor:'none',background:'rgba(0,16,32,0.9)',border:'2px solid #1a3040',color:'#2a6080',letterSpacing:'0.06em'}}>← MENU</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={onBack} style={{...PX,position:'absolute',top:14,right:14,zIndex:40,background:'rgba(2,8,20,0.92)',border:'2px solid #1a304088',color:'#2a6080',fontSize:9,padding:'6px 10px',cursor:'none',letterSpacing:'0.06em'}}>← MENU</button>
    </div>
  );
}

// ─── Rhythm game ──────────────────────────────────────────────────────────────
const calcNoteY=(elapsed:number,targetTime:number)=>HIT_Y-(((targetTime-elapsed)/TRAVEL_MS)*(HIT_Y+50));

// NoteField: moves every note via direct element.style updates — zero React re-renders during play
interface NoteFieldProps {
  notesRef: React.MutableRefObject<NoteData[]>;
  startTimeRef: React.MutableRefObject<number>;
  onAutoMissRef: React.MutableRefObject<(note: NoteData) => void>;
  onSongEndRef: React.MutableRefObject<() => void>;
}
const NoteField = React.memo(function NoteField({ notesRef, startTimeRef, onAutoMissRef, onSongEndRef }: NoteFieldProps) {
  const elemRefs = useRef(new Map<number, HTMLDivElement>());
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      const elapsed = performance.now() - startTimeRef.current;
      let anyActive = false;
      notesRef.current.forEach(n => {
        const el = elemRefs.current.get(n.id);
        if (!el) return;
        if (n.state !== 'active') { if (el.style.display !== 'none') el.style.display = 'none'; return; }
        const y = calcNoteY(elapsed, n.targetTime);
        if (y > FIELD_H + 40) {
          el.style.display = 'none';
          onAutoMissRef.current(n);
        } else if (y > -55 && y < FIELD_H + 20) {
          el.style.display = 'flex';
          el.style.top = `${y}px`;
          anyActive = true;
        } else {
          if (el.style.display !== 'none') el.style.display = 'none';
          anyActive = true;
        }
      });
      if (!anyActive && elapsed > TOTAL_BEATS * BEAT_MS + PRE_ROLL_MS + 1500) { onSongEndRef.current(); return; }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);  // intentionally empty — uses refs only
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {BEAT_CHART.map(([, lane], id) => (
        <div key={id}
          ref={el => { if (el) elemRefs.current.set(id, el); else elemRefs.current.delete(id); }}
          style={{ position: 'absolute', display: 'none', top: 0, left: LANE_X[lane], width: 60, height: 44,
            alignItems: 'center', justifyContent: 'center', background: LANE_COLORS[lane],
            boxShadow: `0 0 10px ${LANE_COLORS[lane]}, 0 0 22px ${LANE_COLORS[lane]}44`,
            border: '2px solid rgba(255,255,255,0.38)' }}>
          <ArrowShape lane={lane} size={22} color='rgba(255,255,255,0.95)'/>
        </div>
      ))}
    </div>
  );
});

// ReceptorRow: flashes lanes via direct element.style — zero React re-renders on input
interface ReceptorRowHandle { flash: (lane: number) => void; }
const ReceptorRow = forwardRef<ReceptorRowHandle>(function ReceptorRow(_, ref) {
  const divRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
  const flashTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { flashTimers.current.forEach(clearTimeout); }, []);
  useImperativeHandle(ref, () => ({
    flash(lane: number) {
      const el = divRefs.current[lane];
      if (!el) return;
      const c = LANE_COLORS[lane];
      el.style.opacity = '1';
      el.style.boxShadow = `0 0 16px ${c}, 0 0 32px ${c}44`;
      el.style.background = `${c}20`;
      const t = setTimeout(() => {
        if (!el) return;
        el.style.opacity = '0.22';
        el.style.boxShadow = 'none';
        el.style.background = 'transparent';
      }, 100);
      flashTimers.current.push(t);
    },
  }), []);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {LANE_COLORS.map((c, i) => (
        <div key={i} ref={el => { divRefs.current[i] = el; }}
          style={{ position: 'absolute', top: HIT_Y, left: LANE_X[i], width: 60, height: 44,
            border: `2px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', opacity: 0.22 }}>
          <ArrowShape lane={i} size={20} color={c}/>
        </div>
      ))}
    </div>
  );
});
const RATINGS=[['S','#ffcc00',50000],['A','#44ff88',38000],['B','#00ccff',24000],['C','#ff8844',12000],['D','#ff4466',0]] as const;
function getRating(score:number){return RATINGS.find(r=>score>=r[2])||RATINGS[RATINGS.length-1];}

function RhythmGame({ onBack,sfx }:{onBack:()=>void;sfx:(f:number[],d:number[],w?:OscillatorType)=>void}) {
  const [rhythmPhase,setRhythmPhase]=useState<RhythmPhase>('waiting');
  const [countdown,setCountdown]=useState(3);
  const [displayScore,setDisplayScore]=useState(0);
  const [displayCombo,setDisplayCombo]=useState(0);
  const [feedbacks,setFeedbacks]=useState<FeedbackItem[]>([]);
  const [endStats,setEndStats]=useState({score:0,perfects:0,goods:0,misses:0,maxCombo:0});

  const startTimeRef=useRef(0),notesRef=useRef<NoteData[]>([]);
  const scoreRef=useRef(0),comboRef=useRef(0),maxComboRef=useRef(0);
  const fbId=useRef(0),cdTimers=useRef<number[]>([]);
  const receptorRowRef=useRef<ReceptorRowHandle>(null);
  const timerElemRef=useRef<HTMLSpanElement>(null);

  // Stable callback refs — NoteField reads these without ever needing to re-render
  const onAutoMissRef=useRef<(note:NoteData)=>void>(()=>{});
  onAutoMissRef.current=(note:NoteData)=>{
    note.state='missed'; comboRef.current=0; setDisplayCombo(0);
    setFeedbacks(prev=>[...prev.slice(-6),{id:fbId.current++,lane:note.lane,type:'miss'}]);
  };
  const onSongEndRef=useRef<()=>void>(()=>{});
  onSongEndRef.current=()=>{
    const p=notesRef.current.filter(n=>n.hitType==='perfect').length;
    const g=notesRef.current.filter(n=>n.hitType==='good').length;
    const m=notesRef.current.filter(n=>n.state==='missed').length;
    setEndStats({score:scoreRef.current,perfects:p,goods:g,misses:m,maxCombo:maxComboRef.current});
    setRhythmPhase('done');
  };

  // Kick off countdown → playing
  const startGame=()=>{
    scoreRef.current=0;comboRef.current=0;maxComboRef.current=0;
    setDisplayScore(0);setDisplayCombo(0);setFeedbacks([]);
    setCountdown(3);
    setRhythmPhase('countdown');
  };

  useEffect(()=>{
    if(rhythmPhase!=='countdown') return;
    // Play a beep on each count
    sfx([880],[0.08]);
    const t1=window.setTimeout(()=>{setCountdown(2);sfx([880],[0.08]);},900);
    const t2=window.setTimeout(()=>{setCountdown(1);sfx([880],[0.08]);},1800);
    const t3=window.setTimeout(()=>{setCountdown(0);sfx([1047],[0.18]);},2700);
    const t4=window.setTimeout(()=>{
      const start=performance.now()+120;
      startTimeRef.current=start;
      notesRef.current=BEAT_CHART.map(([beat,lane],id)=>({id,beat,lane,targetTime:beat*BEAT_MS+PRE_ROLL_MS,state:'active' as const}));
      setRhythmPhase('playing');
    },3400);
    cdTimers.current=[t1,t2,t3,t4];
    return()=>{cdTimers.current.forEach(clearTimeout);};
  },[rhythmPhase,sfx]);

  // Timer display — direct DOM, runs at 2Hz — no React re-renders
  useEffect(()=>{
    if(rhythmPhase!=='playing') return;
    const id=setInterval(()=>{
      if(timerElemRef.current){
        const s=Math.max(0,Math.round((TOTAL_BEATS*BEAT_MS-(performance.now()-startTimeRef.current))/1000));
        timerElemRef.current.textContent=`${s}s`;
      }
    },500);
    return()=>clearInterval(id);
  },[rhythmPhase]);

  const pressLane=useCallback((lane:number)=>{
    if(rhythmPhase!=='playing') return;
    // Flash receptor directly — no setState
    receptorRowRef.current?.flash(lane);
    const elapsed=performance.now()-startTimeRef.current;
    const cands=notesRef.current.filter(n=>n.state==='active'&&n.lane===lane).map(n=>({n,diff:elapsed-n.targetTime})).filter(c=>c.diff>-200).sort((a,b)=>Math.abs(a.diff)-Math.abs(b.diff));
    const best=cands[0];
    if(!best) return;
    const absDiff=Math.abs(best.diff);
    if(absDiff<70){best.n.state='hit';best.n.hitType='perfect';scoreRef.current+=1000+comboRef.current*12;comboRef.current++;if(comboRef.current>maxComboRef.current)maxComboRef.current=comboRef.current;setDisplayScore(scoreRef.current);setDisplayCombo(comboRef.current);setFeedbacks(prev=>[...prev.slice(-6),{id:fbId.current++,lane,type:'perfect'}]);sfx([880,1047],[0.06,0.1]);}
    else if(absDiff<150){best.n.state='hit';best.n.hitType='good';scoreRef.current+=500;comboRef.current++;if(comboRef.current>maxComboRef.current)maxComboRef.current=comboRef.current;setDisplayScore(scoreRef.current);setDisplayCombo(comboRef.current);setFeedbacks(prev=>[...prev.slice(-6),{id:fbId.current++,lane,type:'good'}]);sfx([660],[0.08]);}
  },[rhythmPhase,sfx]);

  useEffect(()=>{
    const KEY_MAP:Record<string,number>={ArrowLeft:0,a:0,A:0,ArrowDown:1,s:1,S:1,ArrowUp:2,w:2,W:2,ArrowRight:3,d:3,D:3};
    const handler=(e:KeyboardEvent)=>{const l=KEY_MAP[e.key];if(l!==undefined){e.preventDefault();pressLane(l);}};
    window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);
  },[pressLane]);

  const rating=getRating(endStats.score);
  const FIELD_W=275;

  return (
    <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:10 }}>
      <AnimatePresence mode="wait">

        {/* ── Waiting ── */}
        {rhythmPhase==='waiting'&&(
          <motion.div key="rw" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,zIndex:10}}>
            <div style={{ animation:'arc-title-color 2s ease-in-out infinite' }}>
              <span style={{...PX,fontSize:14,letterSpacing:'0.10em',textShadow:'0 0 16px currentColor'}}>BEAT RUSH!!</span>
            </div>
            <span style={{...PX,fontSize:8,color:'#2a4060',lineHeight:2,textAlign:'center'}}>ARROWS / WASD  —  HIT ON THE BEAT</span>
            <span style={{...PX,fontSize:6,color:'#1a3050',letterSpacing:'0.08em'}}>BACKSPACE — MENU</span>
            <div style={{display:'flex',gap:8,marginTop:4}}>
              {LANE_COLORS.map((c,i)=>(
                <div key={i} style={{width:32,height:48,background:c,borderRadius:4,transformOrigin:'bottom',display:'flex',alignItems:'center',justifyContent:'center',
                  animation:'arc-scaley 0.48s ease-in-out infinite', animationDuration:`${0.48+i*0.1}s`}}>
                  <ArrowShape lane={i} size={16} color='rgba(0,0,0,0.55)'/>
                </div>
              ))}
            </div>
            <button onClick={startGame} style={{...PX,fontSize:10,padding:'10px 20px',cursor:'none',background:'rgba(255,68,204,0.12)',border:'2px solid #ff44cc88',color:'#ff44cc',letterSpacing:'0.08em',boxShadow:'0 0 16px #ff44cc33',marginTop:8}}>
              ▶ START
            </button>
          </motion.div>
        )}

        {/* ── Countdown ── */}
        {rhythmPhase==='countdown'&&(
          <motion.div key="rcd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,zIndex:10}}>
            <span style={{...PX,fontSize:10,color:'#2a4060',letterSpacing:'0.08em'}}>GET READY!</span>
            <AnimatePresence mode="wait">
              <motion.div key={countdown}
                initial={{scale:2.2,opacity:0}}
                animate={{scale:1,opacity:1}}
                exit={{scale:0.5,opacity:0}}
                transition={{duration:0.32,ease:'easeOut'}}>
                <span style={{
                  ...PX,
                  fontSize: countdown===0?48:64,
                  color:    countdown===0?'#ffcc00':LANE_COLORS[countdown%4],
                  textShadow:`0 0 24px currentColor, 0 0 48px currentColor`,
                  display:'block', textAlign:'center',
                }}>
                  {countdown===0?'GO!':countdown}
                </span>
              </motion.div>
            </AnimatePresence>
            {/* Preview lane bars during countdown */}
            <div style={{display:'flex',gap:6}}>
              {LANE_COLORS.map((c,i)=>(
                <div key={i} style={{width:22,height:36,background:c,borderRadius:3,transformOrigin:'bottom',display:'flex',alignItems:'center',justifyContent:'center',
                  animation:'arc-scaley 0.48s ease-in-out infinite', animationDuration:`${0.48+i*0.1}s`}}>
                  <ArrowShape lane={i} size={13} color='rgba(0,0,0,0.5)'/>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Playing ── */}
        {rhythmPhase==='playing'&&(
          <motion.div key="rp" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
            {/* HUD */}
            <div style={{width:FIELD_W,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
              <span style={{...PX,fontSize:8,color:'#00ccff'}}>{displayScore.toString().padStart(7,'0')}</span>
              {displayCombo>1&&<motion.div key={displayCombo} initial={{scale:1.4}} animate={{scale:1}} style={{...PX,fontSize:9,color:'#ffcc00',textShadow:'0 0 8px #ffcc00'}}>{displayCombo}x</motion.div>}
              <span ref={timerElemRef} style={{...PX,fontSize:7,color:'#1a3040'}}>{Math.round(TOTAL_BEATS*BEAT_MS/1000)}s</span>
            </div>
            {/* Field */}
            <div style={{width:FIELD_W,height:FIELD_H,background:'#040810',border:'2px solid #1a2838',position:'relative',overflow:'hidden'}}>
              {LANE_COLORS.map((c,i)=>(
                <div key={i} style={{position:'absolute',top:0,left:LANE_X[i],width:60,height:'100%',background:`${c}06`,borderRight:i<3?`1px solid ${c}18`:undefined}}/>
              ))}
              {[0.25,0.5,0.75].map((frac,i)=>(
                <div key={i} style={{position:'absolute',top:`${frac*100}%`,left:0,right:0,height:1,background:'rgba(255,255,255,0.04)'}}/>
              ))}
              <div style={{position:'absolute',top:HIT_Y-4,left:0,right:0,height:52,background:'rgba(255,255,255,0.025)',borderTop:'1px solid rgba(255,255,255,0.07)',borderBottom:'1px solid rgba(255,255,255,0.05)'}}/>
              {/* Receptors — direct DOM flash, zero React re-renders */}
              <ReceptorRow ref={receptorRowRef}/>
              {/* Notes — direct DOM position updates, zero React re-renders */}
              <NoteField notesRef={notesRef} startTimeRef={startTimeRef} onAutoMissRef={onAutoMissRef} onSongEndRef={onSongEndRef}/>
              {/* Feedback */}
              <div style={{position:'absolute',top:'36%',left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:2,pointerEvents:'none',zIndex:20}}>
                <AnimatePresence>
                  {feedbacks.slice(-2).map(fb=>(
                    <motion.div key={fb.id} initial={{opacity:1,y:0,scale:1.3}} animate={{opacity:0,y:-32,scale:1}} transition={{duration:0.6}}
                      style={{...PX,fontSize:9,color:fb.type==='perfect'?'#ffcc00':fb.type==='good'?'#44ff88':'#ff4466',textShadow:'0 0 8px currentColor',whiteSpace:'nowrap'}}>
                      {fb.type==='perfect'?'PERFECT!':fb.type==='good'?'GOOD':'MISS'}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
            {/* On-screen buttons */}
            <div style={{display:'flex',gap:6,marginTop:6}}>
              {LANE_COLORS.map((c,i)=>(
                <button key={i} onPointerDown={()=>pressLane(i)} style={{width:58,height:42,background:`${c}18`,border:`2px solid ${c}88`,borderRadius:3,cursor:'none',display:'flex',alignItems:'center',justifyContent:'center',touchAction:'manipulation',WebkitUserSelect:'none',userSelect:'none'}}>
                  <ArrowShape lane={i} size={18} color={c}/>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Results ── */}
        {rhythmPhase==='done'&&(
          <motion.div key="rd" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,zIndex:10}}>
            <motion.div animate={{color:['#ffcc00','#ff4488','#ffcc00']}} transition={{duration:1.5,repeat:Infinity}}>
              <span style={{...PX,fontSize:12,letterSpacing:'0.08em'}}>RESULTS</span>
            </motion.div>
            <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:300,delay:0.2}}>
              <div style={{width:80,height:80,border:`3px solid ${rating[1]}`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 20px ${rating[1]}`}}>
                <span style={{...PX,fontSize:36,color:rating[1],textShadow:`0 0 14px ${rating[1]}`}}>{rating[0]}</span>
              </div>
            </motion.div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 20px',textAlign:'center'}}>
              {[['SCORE',endStats.score.toString().padStart(7,'0'),'#00ccff'],['MAX COMBO',`${endStats.maxCombo}x`,'#ffcc00'],['PERFECT',endStats.perfects,'#44ff88'],['GOOD',endStats.goods,'#ffaa00'],['MISS',endStats.misses,'#ff4466']].map(([l,v,c])=>(
                <div key={String(l)}>
                  <div style={{...PX,fontSize:6,color:'#1a3040',marginBottom:2}}>{l}</div>
                  <div style={{...PX,fontSize:9,color:String(c)}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:10,marginTop:4}}>
              <button onClick={()=>setRhythmPhase('waiting')} style={{...PX,fontSize:8,padding:'8px 12px',cursor:'none',background:'rgba(255,68,204,0.1)',border:'2px solid #ff44cc88',color:'#ff44cc',letterSpacing:'0.06em'}}>▶ RETRY</button>
              <button onClick={onBack} style={{...PX,fontSize:8,padding:'8px 12px',cursor:'none',background:'rgba(0,16,32,0.9)',border:'2px solid #1a3040',color:'#2a6080',letterSpacing:'0.06em'}}>← MENU</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={onBack} style={{...PX,position:'absolute',top:14,right:14,zIndex:40,background:'rgba(2,8,20,0.92)',border:'2px solid #1a304088',color:'#2a6080',fontSize:9,padding:'6px 10px',cursor:'none',letterSpacing:'0.06em'}}>← MENU</button>
    </div>
  );
}

// ─── Main ArcadePage ──────────────────────────────────────────────────────────
export function ArcadePage({ onExit }:{ onExit:()=>void }) {
  const { setTrack } = useMusic();
  const { start:startAudio, sfx } = useArcadeAudio();
  const [view, setView] = useState<ArcadeView>('select');

  useEffect(()=>{
    setTrack('');
    startAudio();
    return ()=>{ setTrack(TRACK_TITLE); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Backspace exits to the map from any arcade screen
  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{ if(e.key==='Backspace'){e.preventDefault();onExit();} };
    window.addEventListener('keydown',handler);
    return ()=>window.removeEventListener('keydown',handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden' }}>
      {/* CSS keyframes — all background + UI decorative animations, zero JS runtime */}
      <style>{`
        @keyframes arc-fluor        { 0%,100%{opacity:.55} 50%{opacity:.85} }
        @keyframes arc-bulb         { 0%,100%{opacity:.65} 50%{opacity:1}   }
        @keyframes arc-spot         { 0%,100%{opacity:.12} 50%{opacity:.22} }
        @keyframes arc-cabinet      { 0%,100%{opacity:.1}  50%{opacity:.28} }
        @keyframes arc-mid          { 0%,100%{opacity:.25} 50%{opacity:.45} }
        @keyframes arc-coin         { 0%,100%{opacity:.4}  50%{opacity:.8}  }
        @keyframes arc-neon         { 0%,100%{opacity:.6}  50%{opacity:1}   }
        @keyframes arc-scalex       { 0%,100%{transform:scaleX(.2)} 25%{transform:scaleX(1)} 50%{transform:scaleX(.5)} 75%{transform:scaleX(.8)} }
        @keyframes arc-scaley       { 0%,100%{transform:scaleY(.4)} 25%{transform:scaleY(1)} 50%{transform:scaleY(.6)} 75%{transform:scaleY(.8)} }
        @keyframes arc-title-color  { 0%,100%{color:#ff44cc} 33%{color:#cc44ff} 66%{color:#4488ff} }
        @keyframes arc-select-color { 0%,100%{color:#ffcc00} 25%{color:#ff4488} 50%{color:#00ccff} 75%{color:#44ff88} }
        @keyframes arc-bshadow-bet  { 0%,100%{box-shadow:0 0 6px #cc44ff} 50%{box-shadow:0 0 18px #cc44ff} }
        @keyframes arc-bshadow-claw { 0%,100%{box-shadow:0 0 8px #00ccff} 50%{box-shadow:0 0 20px #00ccff} }
        @keyframes arc-select-glow  { 0%,100%{opacity:0} 50%{opacity:.8} }
      `}</style>
      <ArcadeBackground/>
      <AnimatePresence mode="wait">
        {view==='select' &&<motion.div key="select" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.18}} style={{position:'absolute',inset:0}}><SelectScreen onSelect={setView} onExit={onExit}/></motion.div>}
        {view==='claw'   &&<motion.div key="claw"   initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-18}} transition={{duration:0.20}} style={{position:'absolute',inset:0}}><ClawGameView onBack={()=>setView('select')} sfx={sfx}/></motion.div>}
        {view==='rhythm' &&<motion.div key="rhythm" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-18}} transition={{duration:0.20}} style={{position:'absolute',inset:0}}><RhythmGame onBack={()=>setView('select')} sfx={sfx}/></motion.div>}
      </AnimatePresence>
      <button onClick={onExit} style={{...PX,position:'absolute',top:14,left:14,zIndex:50,background:'rgba(2,8,20,0.92)',border:'2px solid #00e8ff44',color:'#00e8ff',fontSize:9,padding:'7px 11px',cursor:'none',boxShadow:'0 0 10px #00e8ff22',letterSpacing:'0.06em'}}>
        ← MAP
      </button>
    </div>
  );
}
