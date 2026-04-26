import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMusic, TRACK_TITLE } from './MusicContext';

const PX = { fontFamily: '"Press Start 2P", monospace' } as const;

const STORE_AMBIENT = 'https://raw.githubusercontent.com/crlazy101/Tokyo-Audio/main/record_store_xol9tt.ogg';

// ─── CSS ─────────────────────────────────────────────────────────────────────
const ROOM_STYLES = `
  @keyframes spinRecord  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes pageFlip    { 0%,88%,100%{transform:scaleX(1)} 91%{transform:scaleX(.86)} 95%{transform:scaleX(1)} }
  @keyframes shopperSway { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-.9deg)} }
  @keyframes neonPulse   { 0%,100%{opacity:.78} 50%{opacity:1}   }
  @keyframes neonPulse2  { 0%,100%{opacity:.52} 50%{opacity:.86} }
  @keyframes neonFlick   { 0%,91%,100%{opacity:.88} 92%{opacity:.28} 93%{opacity:.82} 94.5%{opacity:.18} 96%{opacity:.88} }
  /* Sleeping shopkeeper */
  @keyframes sleepBreathe { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1.2px)} }
  @keyframes zzzRise {
    0%   { opacity:0; transform:translate(0px,0px) scale(0.75); }
    18%  { opacity:0.9; }
    72%  { opacity:0.55; }
    100% { opacity:0; transform:translate(4px,-20px) scale(1.05); }
  }
  /* SVG EQ bars */
  .svgEq { transform-box: fill-box; transform-origin: center bottom; }
  @keyframes svgEq0 { 0%,100%{transform:scaleY(.16)} 22%{transform:scaleY(.90)} 48%{transform:scaleY(.35)} 74%{transform:scaleY(.95)} }
  @keyframes svgEq1 { 0%,100%{transform:scaleY(.62)} 14%{transform:scaleY(.10)} 48%{transform:scaleY(.88)} 76%{transform:scaleY(.40)} }
  @keyframes svgEq2 { 0%,100%{transform:scaleY(.36)} 18%{transform:scaleY(.92)} 42%{transform:scaleY(.22)} 68%{transform:scaleY(.76)} }
  @keyframes svgEq3 { 0%,100%{transform:scaleY(.80)} 12%{transform:scaleY(.24)} 40%{transform:scaleY(.96)} 68%{transform:scaleY(.48)} }
  @keyframes svgEq4 { 0%,100%{transform:scaleY(.24)} 20%{transform:scaleY(.72)} 46%{transform:scaleY(.88)} 72%{transform:scaleY(.28)} }
  @keyframes svgEq5 { 0%,100%{transform:scaleY(.70)} 16%{transform:scaleY(.94)} 38%{transform:scaleY(.18)} 64%{transform:scaleY(.84)} }
  @keyframes svgEq6 { 0%,100%{transform:scaleY(.32)} 26%{transform:scaleY(.76)} 52%{transform:scaleY(.94)} 78%{transform:scaleY(.14)} }
  @keyframes svgEq7 { 0%,100%{transform:scaleY(.84)} 18%{transform:scaleY(.20)} 44%{transform:scaleY(.66)} 70%{transform:scaleY(.96)} }
  @keyframes eq0 { 0%,100%{height:22%} 20%{height:82%} 45%{height:38%} 70%{height:94%} }
  @keyframes eq1 { 0%,100%{height:60%} 18%{height:14%} 50%{height:94%} 78%{height:35%} }
  @keyframes eq2 { 0%,100%{height:38%} 15%{height:90%} 40%{height:24%} 65%{height:74%} }
  @keyframes eq3 { 0%,100%{height:78%} 10%{height:26%} 38%{height:96%} 65%{height:46%} }
  @keyframes eq4 { 0%,100%{height:26%} 20%{height:68%} 48%{height:90%} 74%{height:30%} }
  @keyframes eq5 { 0%,100%{height:68%} 14%{height:94%} 40%{height:20%} 66%{height:82%} }
  @keyframes eq6 { 0%,100%{height:34%} 24%{height:74%} 50%{height:92%} 76%{height:16%} }
  @keyframes eq7 { 0%,100%{height:82%} 16%{height:22%} 42%{height:70%} 70%{height:94%} }
  .rs-btn:hover  { filter: brightness(1.5); }
  .rs-sel:hover:not(:disabled) { border-color: #00e8ff !important; filter: brightness(1.35); }
`;

// ─── EQ constants ─────────────────────────────────────────────────────────────
const EQ_COLORS = ['#00e8cc','#00ccf0','#0094ff','#4455ff','#8844ff','#cc44ff','#ff44cc','#ff0088'];
const EQ_DURS   = ['1.10s','1.28s','1.00s','1.22s','0.95s','1.15s','1.20s','1.06s'];
const EQ_DELS   = ['0s','0.18s','0.35s','0.08s','0.28s','0.12s','0.42s','0.22s'];
const SVG_EQ_COLORS = (() => {
  const stops = ['#00f0cc','#00d4f8','#0094ff','#3866ff','#6644ff','#9944ff','#cc44ff','#ff44cc','#ff2299','#ff0088'];
  return Array.from({length:24},(_,i)=>stops[Math.min(Math.floor(i/23*(stops.length-1)),stops.length-1)]);
})();

function seededRng(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}

const SLEEVE_NEUTRAL = [
  '#f8f7f3','#faf9f6','#f6f5f1','#f9f8f5','#f5f4f0',
  '#f7f6f3','#f4f3ef','#faf9f7','#f1f0ec','#f8f7f4',
  '#eeecea','#f2f0ec','#eceae5','#f3f1ed','#e9e7e2',
  '#dedad4','#e2e0da','#ece9e4','#d8d6d0','#e0ded8',
];
const SLEEVE_VIVID = [
  '#3a4860','#5a3848','#3a5240','#4a3828','#2e3c50',
  '#503040','#283e4a','#3a3028','#263c30','#4a2838',
];
const STICKER_COLORS = [
  '#cc2010','#1c3090','#c08000','#f0f0ec','#186030',
  '#c03060','#101010','#b05010','#8020a0','#0050a0',
];

// ─── Genre colours ────────────────────────────────────────────────────────────
const GENRE_COLORS: Record<string, string> = {
  'LO-FI':    '#4a72e8',
  'CITY POP': '#e83898',
  'JAZZ':     '#c88020',
  'HIP HOP':  '#44e010',
  'PUNK':     '#e01010',
  'SOUL':     '#b040e0',
};

// ─── Records ──────────────────────────────────────────────────────────────────
const RECORD_AUDIO: string[] = [
  'https://raw.githubusercontent.com/crlazy101/Tokyo-Audio/main/LO-FI_223AM_in_Shimokitazawa_22_by_Yoru_Collective_rjdhyw.ogg',
  'https://raw.githubusercontent.com/crlazy101/Tokyo-Audio/main/CITY_POP_22Neon_Expressway_22_by_Haruki_Mave_vn6wtl.ogg',
  'https://raw.githubusercontent.com/crlazy101/Tokyo-Audio/main/JAZZ_22Smoke_Tatami_22_by_The_Koenji_Quartet_nug0hw.ogg',
  'https://raw.githubusercontent.com/crlazy101/Tokyo-Audio/main/HIP_HOP_22Concrete_Cypher_22_by_Gaijin_Supreme_xubkfl.ogg',
  'https://raw.githubusercontent.com/crlazy101/Tokyo-Audio/main/PUNK_22Last_Train_Riot_22_by_Tokyo_Gutter_Kings_jwwqvv.ogg',
  'https://raw.githubusercontent.com/crlazy101/Tokyo-Audio/main/SOUL_22Midnight_Kissaten_22_by_Fumiko_The_Strays_zgth4k.ogg',
];
const RECORDS = [
  { title: '3AM in Shimokitazawa', artist: 'Yoru Collective',     src: RECORD_AUDIO[0], label: '#1a2e7a', groove: '#0e1e52', genre: 'LO-FI',    instrumental: true  },
  { title: 'Neon Expressway',      artist: 'Haruki Mave',         src: RECORD_AUDIO[1], label: '#8a1a52', groove: '#520e32', genre: 'CITY POP', instrumental: true  },
  { title: 'Smoke & Tatami',       artist: 'The Koenji Quartet',  src: RECORD_AUDIO[2], label: '#8a4210', groove: '#522208', genre: 'JAZZ',     instrumental: true  },
  { title: 'Concrete Cypher',      artist: 'Gaijin Supreme',      src: RECORD_AUDIO[3], label: '#3c3c3c', groove: '#222222', genre: 'HIP HOP',  instrumental: false },
  { title: 'Last Train Riot',      artist: 'Tokyo Gutter Kings',  src: RECORD_AUDIO[4], label: '#8c1010', groove: '#520808', genre: 'PUNK',     instrumental: false },
  { title: 'Midnight Kissaten',    artist: 'Fumiko & The Strays', src: RECORD_AUDIO[5], label: '#0a4c22', groove: '#083014', genre: 'SOUL',     instrumental: true  },
];

// ─── Album covers ─────────────────────────────────────────────────────────────
// ── Cover 0: "3AM in Shimokitazawa" — 64×64 rainy alley, cinematic depth ──────
function Cover0() {
  const rain = [2,6,11,15,20,25,28,33,37,42,47,51,55,59,63];
  return (
    <svg width="100%" height="100%" viewBox="0 0 64 64" shapeRendering="crispEdges" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
      {/* ── BASE SKY ── */}
      <rect width="64" height="64" fill="#01060f"/>
      <rect x="0" y="0" width="64" height="22" fill="#020b18"/>
      <rect x="0" y="16" width="64" height="4" fill="#030e1e" opacity="0.55"/>
      <rect x="0" y="19" width="64" height="3" fill="#04121e" opacity="0.40"/>

      {/* ── MOON ── */}
      <rect x="51" y="2" width="7" height="10" fill="#d8cc98" opacity="0.80"/>
      <rect x="52" y="2" width="6" height="10" fill="#020b18"/>
      <rect x="51" y="2" width="1" height="10" fill="#e8dca8" opacity="0.85"/>
      <rect x="48" y="0" width="16" height="14" fill="#d8cc98" opacity="0.03"/>

      {/* ── STARS ── */}
      {([[3,1,0.72],[9,3,0.48],[17,2,0.62],[24,1,0.38],[32,3,0.28],[39,2,0.55],[45,1,0.42]
      ] as [number,number,number][]).map(([sx,sy,op],i)=>(
        <rect key={i} x={sx} y={sy} width="1" height="1" fill="#8ab0d8" opacity={op}/>
      ))}

      {/* ── TELEPHONE WIRES ── */}
      <rect x="0"  y="9"  width="25" height="1" fill="#0c1a2e" opacity="0.88"/>
      <rect x="0"  y="12" width="25" height="1" fill="#0a1628" opacity="0.52"/>
      <rect x="39" y="9"  width="25" height="1" fill="#0c1a2e" opacity="0.88"/>
      <rect x="39" y="12" width="25" height="1" fill="#0a1628" opacity="0.52"/>
      <rect x="23" y="8"  width="2"  height="6" fill="#142030" opacity="0.70"/>
      <rect x="39" y="8"  width="2"  height="6" fill="#142030" opacity="0.70"/>

      {/* ══ LEFT BUILDING ══ */}
      <rect x="0"  y="6"  width="24" height="58" fill="#050e1a"/>
      <rect x="0"  y="6"  width="24" height="2"  fill="#0b1c30"/>
      <rect x="1"  y="5"  width="22" height="3"  fill="#071525"/>
      <rect x="1"  y="5"  width="22" height="1"  fill="#0d2035"/>
      {([[2,9,'#050a14',0.99],[2,16,'#c89820',0.88],[2,23,'#1a3288',0.65],[2,30,'#c89820',0.58],[2,37,'#050a14',0.99]
      ] as [number,number,string,number][]).map(([wx,wy,wc,wo],i)=>(
        <rect key={`a${i}`} x={wx} y={wy} width="5" height="5" fill={wc} opacity={wo}/>
      ))}
      <rect x="3"  y="16" width="2" height="1" fill="#f0d050" opacity="0.38"/>
      <rect x="3"  y="30" width="2" height="1" fill="#f0d050" opacity="0.22"/>
      {([[9,9,'#c89820',0.92],[9,16,'#050a14',0.99],[9,23,'#c89820',0.74],[9,30,'#1a3288',0.54],[9,37,'#c89820',0.44]
      ] as [number,number,string,number][]).map(([wx,wy,wc,wo],i)=>(
        <rect key={`b${i}`} x={wx} y={wy} width="5" height="5" fill={wc} opacity={wo}/>
      ))}
      <rect x="10" y="9"  width="2" height="1" fill="#f0d050" opacity="0.42"/>
      {([[17,9,'#1a3288',0.60],[17,16,'#c89820',0.80],[17,23,'#050a14',0.99],[17,30,'#c89820',0.70],[17,37,'#1a3288',0.48]
      ] as [number,number,string,number][]).map(([wx,wy,wc,wo],i)=>(
        <rect key={`c${i}`} x={wx} y={wy} width="5" height="5" fill={wc} opacity={wo}/>
      ))}
      <rect x="18" y="16" width="2" height="1" fill="#f0d050" opacity="0.35"/>
      <rect x="18" y="20" width="6" height="5" fill="#0a1828"/>
      <rect x="18" y="20" width="6" height="2" fill="#14253a" opacity="0.80"/>
      <rect x="19" y="20" width="4" height="1" fill="#1e3552" opacity="0.60"/>
      <rect x="0"  y="28" width="14" height="3" fill="#8a3010" opacity="0.85"/>
      <rect x="0"  y="28" width="14" height="1" fill="#c04818" opacity="0.38"/>
      <rect x="0"  y="31" width="14" height="1" fill="#3a1006" opacity="0.60"/>
      <rect x="0"  y="43" width="23" height="8" fill="#090c1e"/>
      <rect x="1"  y="44" width="21" height="1" fill="#e8206a" opacity="0.95"/>
      <rect x="1"  y="46" width="21" height="1" fill="#e8206a" opacity="0.68"/>
      <rect x="1"  y="48" width="21" height="1" fill="#e8206a" opacity="0.35"/>
      <rect x="0"  y="41" width="24" height="12" fill="#e8206a" opacity="0.05"/>
      <text x="12" y="47.5" textAnchor="middle" fontFamily="monospace" fontSize="3" fill="#ffb8d8" opacity="0.92">ジャズ  BAR</text>
      <rect x="0"  y="51" width="24" height="13" fill="#040b16"/>
      <rect x="1"  y="52" width="12" height="10" fill="#060e1e"/>
      <rect x="2"  y="53" width="10" height="8"  fill="#09101e"/>
      <rect x="2"  y="53" width="10" height="8"  fill="#c88020" opacity="0.06"/>
      <rect x="2"  y="57" width="10" height="3"  fill="#e8a030" opacity="0.08"/>
      <rect x="6"  y="55" width="3"  height="5"  fill="#07101e"/>
      <rect x="6"  y="54" width="4"  height="2"  fill="#07101e"/>
      <rect x="3"  y="54" width="2"  height="4"  fill="#1a2e7a" opacity="0.55"/>
      <rect x="3"  y="54" width="2"  height="1"  fill="#4a70c8" opacity="0.35"/>
      <rect x="14" y="53" width="9"  height="11" fill="#030810"/>
      <rect x="15" y="53" width="7"  height="3"  fill="#0a1424"/>
      <rect x="21" y="58" width="1"  height="2"  fill="#6a4018" opacity="0.80"/>

      {/* ══ RIGHT BUILDING ══ */}
      <rect x="40" y="0"  width="24" height="64" fill="#060c18"/>
      <rect x="40" y="0"  width="24" height="2"  fill="#0a1426"/>
      <rect x="42" y="2"  width="20" height="4"  fill="#08101e"/>
      <rect x="42" y="2"  width="20" height="1"  fill="#0d1a2c"/>
      {([[42,7,'#1a3288',0.62],[42,14,'#c89820',0.90],[42,21,'#050a14',0.99],
         [42,28,'#c89820',0.76],[42,35,'#1a3288',0.52],[42,42,'#050a14',0.99]
      ] as [number,number,string,number][]).map(([wx,wy,wc,wo],i)=>(
        <rect key={`d${i}`} x={wx} y={wy} width="5" height="5" fill={wc} opacity={wo}/>
      ))}
      <rect x="43" y="14" width="2" height="1" fill="#f0d050" opacity="0.44"/>
      {([[51,7,'#c89820',0.88],[51,14,'#050a14',0.99],[51,21,'#c89820',0.72],
         [51,28,'#050a14',0.99],[51,35,'#c89820',0.60],[51,42,'#1a3288',0.50]
      ] as [number,number,string,number][]).map(([wx,wy,wc,wo],i)=>(
        <rect key={`e${i}`} x={wx} y={wy} width="5" height="5" fill={wc} opacity={wo}/>
      ))}
      <rect x="52" y="7"  width="2" height="1" fill="#f0d050" opacity="0.42"/>
      <rect x="52" y="21" width="2" height="1" fill="#f0d050" opacity="0.28"/>
      <rect x="57" y="26" width="7" height="5" fill="#08101e"/>
      <rect x="58" y="27" width="5" height="2" fill="#e88020" opacity="0.72"/>
      <rect x="58" y="27" width="5" height="1" fill="#f0a040" opacity="0.28"/>
      <rect x="40" y="46" width="24" height="7" fill="#060816"/>
      <rect x="41" y="47" width="22" height="1" fill="#00e8ff" opacity="0.94"/>
      <rect x="41" y="49" width="22" height="1" fill="#00e8ff" opacity="0.55"/>
      <rect x="40" y="44" width="24" height="11" fill="#00e8ff" opacity="0.04"/>
      <text x="52" y="49.5" textAnchor="middle" fontFamily="monospace" fontSize="3" fill="#80f8ff" opacity="0.90">下北沢</text>
      <rect x="40" y="53" width="24" height="11" fill="#040912"/>
      <rect x="41" y="54" width="20" height="9"  fill="#060c18"/>
      <rect x="42" y="55" width="9"  height="7"  fill="#090f1c"/>
      <rect x="42" y="55" width="9"  height="7"  fill="#d0a820" opacity="0.05"/>
      <rect x="53" y="54" width="7"  height="9"  fill="#04080f"/>

      {/* ══ ALLEY CENTER ══ */}
      <rect x="24" y="11" width="16" height="53" fill="#010508"/>
      <rect x="24" y="11" width="16" height="10" fill="#030c16" opacity="0.55"/>
      <rect x="26" y="11" width="12" height="6"  fill="#04101e" opacity="0.45"/>
      <rect x="24" y="11" width="2"  height="53" fill="#040a14" opacity="0.55"/>
      <rect x="38" y="11" width="2"  height="53" fill="#040a14" opacity="0.55"/>
      <rect x="27" y="13" width="10" height="5" fill="#0c0d1e"/>
      <rect x="28" y="14" width="8"  height="1" fill="#ff2266" opacity="0.88"/>
      <rect x="28" y="16" width="8"  height="1" fill="#ff2266" opacity="0.42"/>
      <rect x="26" y="12" width="12" height="7" fill="#ff2266" opacity="0.05"/>
      <text x="32" y="17" textAnchor="middle" fontFamily="monospace" fontSize="3" fill="#ffc0d8" opacity="0.90">3 A M</text>
      <rect x="26" y="20" width="5" height="3" fill="#0d1220"/>
      <rect x="26" y="21" width="5" height="1" fill="#b82820" opacity="0.55"/>
      <rect x="34" y="26" width="5" height="20" fill="#16223a"/>
      <rect x="34" y="26" width="5" height="2"  fill="#cc1818" opacity="0.92"/>
      <rect x="34" y="28" width="5" height="2"  fill="#243450" opacity="0.80"/>
      {([
        [34,31,'#e84018'],[36,31,'#1870d0'],[38,31,'#18c840'],
        [34,34,'#1870d0'],[36,34,'#e84018'],[38,34,'#f0c020'],
        [34,37,'#e84018'],[36,37,'#18c840'],[38,37,'#e8c030'],
      ] as [number,number,string][]).map(([bx,by,bc],i)=>(
        <rect key={i} x={bx} y={by} width="2" height="2" fill={bc} opacity={i<3?0.90:i<6?0.82:0.72}/>
      ))}
      <rect x="31" y="28" width="10" height="20" fill="#3060c0" opacity="0.05"/>
      <rect x="25" y="22" width="2"  height="30" fill="#162038"/>
      <rect x="22" y="20" width="5"  height="2"  fill="#1c2a3e"/>
      <rect x="21" y="22" width="6"  height="1"  fill="#1e2e40"/>
      <rect x="22" y="23" width="4"  height="2"  fill="#e8c050" opacity="0.75"/>
      <rect x="19" y="22" width="10" height="14" fill="#e8c050" opacity="0.05"/>
      <rect x="21" y="23" width="6"  height="8"  fill="#e8c050" opacity="0.09"/>
      <rect x="22" y="24" width="4"  height="5"  fill="#e8c050" opacity="0.12"/>

      {/* ══ LONE FIGURE ══ */}
      <rect x="25" y="34" width="14" height="2"  fill="#1c2848"/>
      <rect x="24" y="32" width="2"  height="4"  fill="#1c2848"/>
      <rect x="38" y="32" width="2"  height="4"  fill="#1c2848"/>
      <rect x="26" y="33" width="12" height="1"  fill="#243460" opacity="0.55"/>
      <rect x="27" y="32" width="10" height="1"  fill="#1c2848" opacity="0.60"/>
      <rect x="31" y="30" width="2"  height="5"  fill="#20305c"/>
      <rect x="31" y="35" width="1"  height="5"  fill="#20305c"/>
      <rect x="30" y="40" width="4"  height="4"  fill="#c8904a"/>
      <rect x="30" y="39" width="4"  height="2"  fill="#0d1728"/>
      <rect x="29" y="39" width="6"  height="1"  fill="#0d1728"/>
      <rect x="28" y="44" width="8"  height="9"  fill="#0e1a2e"/>
      <rect x="28" y="44" width="1"  height="9"  fill="#162240" opacity="0.50"/>
      <rect x="30" y="44" width="4"  height="2"  fill="#1a2a42"/>
      <rect x="29" y="53" width="3"  height="5"  fill="#090e1e"/>
      <rect x="32" y="53" width="3"  height="5"  fill="#090e1e"/>
      <rect x="28" y="57" width="4"  height="2"  fill="#06080e"/>
      <rect x="32" y="57" width="4"  height="2"  fill="#06080e"/>

      {/* ══ CAT ══ */}
      <rect x="25" y="48" width="4"  height="4"  fill="#09101a"/>
      <rect x="25" y="46" width="4"  height="3"  fill="#09101a"/>
      <rect x="25" y="45" width="2"  height="2"  fill="#09101a"/>
      <rect x="27" y="45" width="2"  height="2"  fill="#09101a"/>
      <rect x="29" y="49" width="5"  height="1"  fill="#09101a"/>
      <rect x="33" y="48" width="1"  height="2"  fill="#09101a"/>
      <rect x="26" y="47" width="1"  height="1"  fill="#44c880" opacity="0.92"/>
      <rect x="28" y="47" width="1"  height="1"  fill="#44c880" opacity="0.92"/>

      {/* ══ WET PAVEMENT ══ */}
      <rect x="0"  y="59" width="64" height="5" fill="#01060c"/>
      <rect x="0"  y="60" width="23" height="3" fill="#060e1a" opacity="0.80"/>
      <rect x="24" y="60" width="16" height="2" fill="#020810" opacity="0.90"/>
      <rect x="41" y="60" width="23" height="3" fill="#060b18" opacity="0.75"/>
      <rect x="2"  y="61" width="18" height="1" fill="#e8206a" opacity="0.14"/>
      <rect x="24" y="60" width="16" height="1" fill="#ff2266" opacity="0.08"/>
      <rect x="41" y="61" width="20" height="1" fill="#00e8ff" opacity="0.09"/>
      <rect x="29" y="62" width="8"  height="1" fill="#e8c050" opacity="0.10"/>
      <rect x="5"  y="59" width="12" height="1" fill="#0c1a2e" opacity="0.55"/>
      <rect x="36" y="59" width="10" height="1" fill="#0a1628" opacity="0.45"/>
      <rect x="4"  y="59" width="2"  height="4" fill="#18243c" opacity="0.82"/>
      <rect x="4"  y="61" width="7"  height="2" fill="#18243c" opacity="0.82"/>
      <rect x="12" y="59" width="2"  height="4" fill="#18243c" opacity="0.80"/>
      <rect x="10" y="61" width="4"  height="2" fill="#18243c" opacity="0.78"/>
      <rect x="6"  y="59" width="6"  height="1" fill="#121c30" opacity="0.72"/>
      <rect x="7"  y="58" width="5"  height="2" fill="#121c30" opacity="0.68"/>
      <rect x="13" y="58" width="3"  height="2" fill="#18243c" opacity="0.72"/>

      {/* ══ RAIN ══ */}
      {rain.map((rx,i)=>(
        <rect key={i} x={rx} y={i%5===0?0:i%5===1?8:i%5===2?16:i%5===3?4:12}
          width="1" height={i%3===0?6:i%3===1?4:5} fill="#4a72a8" opacity="0.16"/>
      ))}
      {[4,10,18,26,31,38,44,49,57,62].map((rx,i)=>(
        <rect key={i} x={rx} y={i%4===0?2:i%4===1?10:i%4===2?18:6}
          width="1" height="4" fill="#3a5888" opacity="0.10"/>
      ))}
      <rect x="0"  y="0"  width="4"  height="64" fill="#010508" opacity="0.45"/>
      <rect x="60" y="0"  width="4"  height="64" fill="#010508" opacity="0.45"/>
      <rect x="0"  y="58" width="64" height="6"  fill="#010508" opacity="0.30"/>
    </svg>
  );
}
// ── Cover 1: "Neon Expressway" — night highway in perspective ──────��──────────
function Cover1() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 32 32" shapeRendering="crispEdges" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
      <rect width="32" height="32" fill="#03010a"/>
      <rect x="0"  y="0"  width="32" height="16" fill="#05020e"/>
      {/* Stars (more) */}
      <rect x="1"  y="1"  width="1" height="1" fill="#c0a0e0" opacity="0.6"/>
      <rect x="5"  y="2"  width="1" height="1" fill="#c0a0e0" opacity="0.4"/>
      <rect x="8"  y="1"  width="1" height="1" fill="#c0a0e0" opacity="0.55"/>
      <rect x="13" y="3"  width="1" height="1" fill="#c0a0e0" opacity="0.45"/>
      <rect x="17" y="1"  width="1" height="1" fill="#c0a0e0" opacity="0.70"/>
      <rect x="21" y="2"  width="1" height="1" fill="#c0a0e0" opacity="0.50"/>
      <rect x="25" y="1"  width="1" height="1" fill="#c0a0e0" opacity="0.60"/>
      <rect x="29" y="3"  width="1" height="1" fill="#c0a0e0" opacity="0.45"/>
      <rect x="30" y="1"  width="1" height="1" fill="#c0a0e0" opacity="0.55"/>
      <rect x="3"  y="4"  width="1" height="1" fill="#c0a0e0" opacity="0.35"/>
      <rect x="19" y="4"  width="1" height="1" fill="#c0a0e0" opacity="0.35"/>
      {/* Moon top-left */}
      <rect x="2"  y="2"  width="3" height="4" fill="#b8b08a" opacity="0.72"/>
      <rect x="3"  y="2"  width="2" height="4" fill="#03010a"/>
      {/* Dense city skyline — left */}
      <rect x="0"  y="13" width="2"  height="4" fill="#07031a"/>
      <rect x="1"  y="10" width="4"  height="7" fill="#07031a"/>
      <rect x="2"  y="8"  width="3"  height="9" fill="#07031a"/>
      <rect x="4"  y="11" width="3"  height="6" fill="#07031a"/>
      <rect x="5"  y="6"  width="4"  height="11" fill="#07031a"/>
      <rect x="6"  y="4"  width="3"  height="13" fill="#07031a"/>
      <rect x="7"  y="2"  width="1"  height="3" fill="#07031a"/>
      <rect x="8"  y="9"  width="3"  height="8" fill="#07031a"/>
      <rect x="9"  y="7"  width="2"  height="10" fill="#07031a"/>
      <rect x="10" y="11" width="2"  height="6" fill="#07031a"/>
      {/* Neon vertical strips on left buildings */}
      <rect x="5"  y="7"  width="1"  height="9" fill="#ff0088" opacity="0.50"/>
      <rect x="8"  y="8"  width="1"  height="7" fill="#00e8ff" opacity="0.42"/>
      {/* Dense city skyline — right */}
      <rect x="20" y="12" width="2"  height="5" fill="#07031a"/>
      <rect x="21" y="8"  width="3"  height="9" fill="#07031a"/>
      <rect x="22" y="6"  width="4"  height="11" fill="#07031a"/>
      <rect x="24" y="10" width="3"  height="7" fill="#07031a"/>
      <rect x="25" y="5"  width="4"  height="12" fill="#07031a"/>
      <rect x="26" y="3"  width="3"  height="14" fill="#07031a"/>
      <rect x="27" y="1"  width="1"  height="3" fill="#07031a"/>
      <rect x="28" y="9"  width="2"  height="8" fill="#07031a"/>
      <rect x="29" y="11" width="3"  height="6" fill="#07031a"/>
      {/* Neon vertical strips on right */}
      <rect x="26" y="4"  width="1"  height="9" fill="#ff0088" opacity="0.50"/>
      <rect x="23" y="7"  width="1"  height="7" fill="#00e8ff" opacity="0.42"/>
      {/* Building window dots */}
      <rect x="3"  y="9"  width="1" height="1" fill="#ff0088" opacity="0.82"/>
      <rect x="7"  y="8"  width="1" height="1" fill="#00e8ff" opacity="0.68"/>
      <rect x="9"  y="8"  width="1" height="1" fill="#ffe040" opacity="0.72"/>
      <rect x="22" y="7"  width="1" height="1" fill="#ffe040" opacity="0.75"/>
      <rect x="25" y="6"  width="1" height="1" fill="#ff0088" opacity="0.80"/>
      <rect x="29" y="10" width="1" height="1" fill="#00e8ff" opacity="0.55"/>
      <rect x="30" y="12" width="1" height="1" fill="#ffe040" opacity="0.60"/>
      {/* Overhead wires */}
      <rect x="0"  y="12" width="32" height="1" fill="#0a0618" opacity="0.72"/>
      <rect x="0"  y="14" width="32" height="1" fill="#0a0618" opacity="0.50"/>
      {/* Highway gantry sign (green, receding) */}
      <rect x="7"  y="14" width="1"  height="3" fill="#0e1820"/>
      <rect x="24" y="14" width="1"  height="3" fill="#0e1820"/>
      <rect x="7"  y="14" width="18" height="2" fill="#0a3018"/>
      <rect x="8"  y="14" width="16" height="2" fill="#0c4020" opacity="0.85"/>
      {/* Horizon neon glow */}
      <rect x="0" y="17" width="32" height="1" fill="#ff0088" opacity="0.80"/>
      <rect x="0" y="16" width="32" height="1" fill="#ff0088" opacity="0.38"/>
      <rect x="0" y="18" width="32" height="1" fill="#ff0088" opacity="0.20"/>
      {/* Road surface */}
      <rect x="0" y="17" width="32" height="15" fill="#04010a"/>
      {[19,21,23,25,27,29,31].map(ry => (
        <rect key={ry} x="0" y={ry} width="32" height="1" fill="#080215" opacity="0.65"/>
      ))}
      {/* Left road edge */}
      <rect x="0"  y="31" width="2" height="1" fill="#ff0088" opacity="0.58"/>
      <rect x="2"  y="29" width="2" height="2" fill="#ff0088" opacity="0.54"/>
      <rect x="5"  y="27" width="2" height="2" fill="#ff0088" opacity="0.50"/>
      <rect x="8"  y="25" width="1" height="2" fill="#ff0088" opacity="0.47"/>
      <rect x="10" y="23" width="1" height="2" fill="#ff0088" opacity="0.44"/>
      <rect x="12" y="21" width="1" height="1" fill="#ff0088" opacity="0.40"/>
      <rect x="13" y="20" width="1" height="1" fill="#ff0088" opacity="0.35"/>
      <rect x="14" y="18" width="1" height="1" fill="#ff0088" opacity="0.28"/>
      {/* Right road edge */}
      <rect x="30" y="31" width="2" height="1" fill="#ff0088" opacity="0.58"/>
      <rect x="28" y="29" width="2" height="2" fill="#ff0088" opacity="0.54"/>
      <rect x="25" y="27" width="2" height="2" fill="#ff0088" opacity="0.50"/>
      <rect x="23" y="25" width="1" height="2" fill="#ff0088" opacity="0.47"/>
      <rect x="21" y="23" width="1" height="2" fill="#ff0088" opacity="0.44"/>
      <rect x="19" y="21" width="1" height="1" fill="#ff0088" opacity="0.40"/>
      <rect x="18" y="20" width="1" height="1" fill="#ff0088" opacity="0.35"/>
      <rect x="17" y="18" width="1" height="1" fill="#ff0088" opacity="0.28"/>
      {/* Centre dashes (white) */}
      <rect x="15" y="18" width="2"  height="1" fill="#e8e8e0" opacity="0.50"/>
      <rect x="14" y="20" width="4"  height="1" fill="#e8e8e0" opacity="0.44"/>
      <rect x="12" y="23" width="8"  height="1" fill="#e8e8e0" opacity="0.38"/>
      <rect x="9"  y="26" width="14" height="1" fill="#e8e8e0" opacity="0.33"/>
      <rect x="5"  y="29" width="22" height="1" fill="#e8e8e0" opacity="0.28"/>
      {/* Inner lane dashes (yellow) */}
      <rect x="14" y="21" width="2"  height="1" fill="#e0c030" opacity="0.48"/>
      <rect x="11" y="24" width="4"  height="1" fill="#e0c030" opacity="0.42"/>
      <rect x="8"  y="27" width="7"  height="1" fill="#e0c030" opacity="0.36"/>
      <rect x="17" y="21" width="2"  height="1" fill="#e0c030" opacity="0.48"/>
      <rect x="19" y="24" width="4"  height="1" fill="#e0c030" opacity="0.42"/>
      <rect x="22" y="27" width="7"  height="1" fill="#e0c030" opacity="0.36"/>
      {/* Guardrail dashes */}
      <rect x="1"  y="30" width="2" height="1" fill="#c0c0b0" opacity="0.28"/>
      <rect x="4"  y="28" width="2" height="1" fill="#c0c0b0" opacity="0.25"/>
      <rect x="7"  y="26" width="2" height="1" fill="#c0c0b0" opacity="0.22"/>
      <rect x="29" y="30" width="2" height="1" fill="#c0c0b0" opacity="0.28"/>
      <rect x="26" y="28" width="2" height="1" fill="#c0c0b0" opacity="0.25"/>
      <rect x="23" y="26" width="2" height="1" fill="#c0c0b0" opacity="0.22"/>
      {/* Distant cars (tiny tail lights) */}
      <rect x="14" y="18" width="1" height="1" fill="#ff2020" opacity="0.90"/>
      <rect x="17" y="18" width="1" height="1" fill="#ff2020" opacity="0.90"/>
      {/* Mid-left lane car */}
      <rect x="8"  y="22" width="4"  height="2" fill="#09011a"/>
      <rect x="8"  y="23" width="2"  height="1" fill="#ff2020" opacity="0.85"/>
      <rect x="10" y="23" width="2"  height="1" fill="#ff2020" opacity="0.85"/>
      {/* Mid-right lane car */}
      <rect x="20" y="21" width="4"  height="2" fill="#09011a"/>
      <rect x="20" y="22" width="2"  height="1" fill="#ff2020" opacity="0.80"/>
      <rect x="22" y="22" width="2"  height="1" fill="#ff2020" opacity="0.80"/>
      {/* Near centre car */}
      <rect x="10" y="26" width="12" height="3" fill="#07010e"/>
      <rect x="10" y="28" width="3"  height="1" fill="#ff2020" opacity="0.88"/>
      <rect x="19" y="28" width="3"  height="1" fill="#ff2020" opacity="0.88"/>
      {/* Headlight glow on road surface */}
      <rect x="13" y="29" width="6"  height="2" fill="#ff2020" opacity="0.05"/>
      {/* Road neon reflection pools */}
      <rect x="13" y="26" width="6"  height="2" fill="#ff0088" opacity="0.03"/>
    </svg>
  );
}
// ── Cover 2: "Smoke & Tatami" — small jazz bar interior ──────────────────────
function Cover2() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 32 32" shapeRendering="crispEdges" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
      <rect width="32" height="32" fill="#120800"/>
      <rect x="0" y="0" width="32" height="21" fill="#1a0d04"/>
      <rect x="0" y="9"  width="32" height="1" fill="#221004" opacity="0.8"/>
      <rect x="0" y="15" width="32" height="1" fill="#221004" opacity="0.6"/>
      {/* Paper lantern */}
      <rect x="15" y="0"  width="1"  height="3"  fill="#604020" opacity="0.7"/>
      <rect x="12" y="3"  width="7"  height="1"  fill="#e8b820" opacity="0.7"/>
      <rect x="11" y="4"  width="9"  height="6"  fill="#e09810"/>
      <rect x="11" y="4"  width="9"  height="6"  fill="#f8d840" opacity="0.22"/>
      <rect x="12" y="4"  width="7"  height="1"  fill="#f8d040" opacity="0.5"/>
      <rect x="13" y="4"  width="1"  height="6"  fill="#c07810" opacity="0.5"/>
      <rect x="15" y="4"  width="1"  height="6"  fill="#c07810" opacity="0.5"/>
      <rect x="17" y="4"  width="1"  height="6"  fill="#c07810" opacity="0.5"/>
      <rect x="12" y="10" width="7"  height="1"  fill="#e8b820" opacity="0.7"/>
      <rect x="14" y="11" width="3"  height="1"  fill="#604020" opacity="0.7"/>
      <rect x="8"  y="3"  width="15" height="10" fill="#f0b820" opacity="0.05"/>
      {/* Tatami floor */}
      <rect x="0"  y="21" width="32" height="11" fill="#8c5a1a"/>
      <rect x="0"  y="21" width="32" height="1"  fill="#a06820" opacity="0.7"/>
      <rect x="0"  y="22" width="16" height="5"  fill="#8a5818"/>
      <rect x="16" y="22" width="16" height="5"  fill="#8c5c1a"/>
      <rect x="16" y="22" width="1"  height="5"  fill="#7a4c10" opacity="0.55"/>
      <rect x="0"  y="27" width="32" height="5"  fill="#895618"/>
      <rect x="16" y="27" width="1"  height="5"  fill="#7a4c10" opacity="0.4"/>
      {[2,5,8,11,14,18,21,24,27,30].map(tx => (
        <rect key={tx} x={tx} y={22} width="1" height="10" fill="#7a4a10" opacity="0.12"/>
      ))}
      {/* Low table */}
      <rect x="6"  y="18" width="20" height="4"  fill="#4a2808"/>
      <rect x="6"  y="18" width="20" height="1"  fill="#5e3410"/>
      <rect x="7"  y="22" width="2"  height="3"  fill="#3a1e06"/>
      <rect x="23" y="22" width="2"  height="3"  fill="#3a1e06"/>
      {/* Sake bottle + cups */}
      <rect x="22" y="13" width="3"  height="6"  fill="#d8d4c8"/>
      <rect x="22" y="12" width="3"  height="2"  fill="#c0bcb0"/>
      <rect x="23" y="11" width="1"  height="2"  fill="#b0acaa"/>
      <rect x="22" y="14" width="3"  height="2"  fill="#c03810" opacity="0.8"/>
      <rect x="18" y="15" width="3"  height="4"  fill="#d0ccbc" opacity="0.9"/>
      <rect x="18" y="14" width="3"  height="1"  fill="#b8b4a4" opacity="0.8"/>
      <rect x="8"  y="16" width="2"  height="3"  fill="#d0ccbc" opacity="0.75"/>
      {/* Musician silhouette (upright bass) */}
      <rect x="3"  y="9"  width="5"  height="9"  fill="#1a0e04"/>
      <rect x="4"  y="9"  width="3"  height="9"  fill="#221208"/>
      <rect x="4"  y="11" width="3"  height="2"  fill="#180c04"/>
      <rect x="5"  y="2"  width="1"  height="8"  fill="#1a0e04"/>
      <rect x="4"  y="1"  width="3"  height="2"  fill="#1a0e04"/>
      <rect x="5"  y="2"  width="1"  height="15" fill="#b8a88a" opacity="0.38"/>
      <rect x="7"  y="12" width="4"  height="6"  fill="#0c0804"/>
      <rect x="7"  y="8"  width="3"  height="4"  fill="#0e0a04"/>
      {/* Smoke */}
      <rect x="20" y="10" width="1"  height="4"  fill="#a09070" opacity="0.22"/>
      <rect x="21" y="9"  width="1"  height="3"  fill="#a09070" opacity="0.16"/>
      <rect x="19" y="8"  width="1"  height="3"  fill="#a09070" opacity="0.13"/>
    </svg>
  );
}
// ── Cover 3: "Concrete Cypher" — classic hip-hop boombox ─────────────────────
function Cover3() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 32 32" shapeRendering="crispEdges" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
      {/* Background — near-black */}
      <rect width="32" height="32" fill="#060608"/>
      {/* Faint graffiti marks behind boombox */}
      <rect x="0"  y="10" width="4"  height="1"  fill="#ff0088" opacity="0.08"/>
      <rect x="28" y="14" width="4"  height="1"  fill="#00e8ff" opacity="0.08"/>
      <rect x="0"  y="22" width="4"  height="1"  fill="#44ff10" opacity="0.07"/>

      {/* ── HANDLE ── */}
      <rect x="10" y="4"  width="12" height="4"  fill="#181816"/>
      <rect x="12" y="5"  width="8"  height="2"  fill="#060608"/>

      {/* ── BODY OUTER SHELL ── */}
      <rect x="0"  y="7"  width="32" height="22" fill="#1a1918"/>
      <rect x="0"  y="7"  width="32" height="1"  fill="#282826"/>
      <rect x="0"  y="28" width="32" height="1"  fill="#141412"/>

      {/* ── LEFT SPEAKER GRILLE ── */}
      <rect x="0"  y="8"  width="10" height="20" fill="#111110"/>
      {/* Mesh horizontal lines */}
      {[9,11,13,15,17,19,21,23,25,27].map(gy => (
        <rect key={gy} x="0" y={gy} width="10" height="1" fill="#0c0c0a" opacity="0.75"/>
      ))}
      {/* Mesh vertical lines */}
      {[1,3,5,7,9].map(gx => (
        <rect key={gx} x={gx} y={8} width="1" height="20" fill="#0c0c0a" opacity="0.55"/>
      ))}
      {/* Left speaker cone (circle approx, cx=5 cy=18) */}
      <rect x="2"  y="15" width="6"  height="6"  fill="#1c1c1a"/>
      <rect x="3"  y="14" width="4"  height="8"  fill="#1c1c1a"/>
      <rect x="3"  y="16" width="4"  height="4"  fill="#141412"/>
      <rect x="4"  y="17" width="2"  height="2"  fill="#0c0c0a"/>
      <rect x="4"  y="17" width="1"  height="1"  fill="#282826"/>
      <rect x="3"  y="14" width="1"  height="1"  fill="#242422" opacity="0.6"/>
      {/* Sound wave dots left edge */}
      <rect x="0"  y="12" width="1"  height="1"  fill="#c89018" opacity="0.38"/>
      <rect x="0"  y="15" width="1"  height="1"  fill="#c89018" opacity="0.38"/>
      <rect x="0"  y="18" width="1"  height="1"  fill="#c89018" opacity="0.38"/>
      <rect x="0"  y="21" width="1"  height="1"  fill="#c89018" opacity="0.35"/>
      <rect x="0"  y="24" width="1"  height="1"  fill="#c89018" opacity="0.30"/>

      {/* ── CENTRE CONSOLE ── */}
      {/* Brand strip (red) */}
      <rect x="10" y="7"  width="12" height="3"  fill="#b81010"/>
      <rect x="11" y="8"  width="10" height="1"  fill="#ff2020" opacity="0.50"/>
      <rect x="12" y="9"  width="8"  height="1"  fill="#ff2020" opacity="0.28"/>
      {/* Tape deck window */}
      <rect x="11" y="10" width="10" height="7"  fill="#0c1418"/>
      <rect x="11" y="10" width="10" height="7"  fill="none" stroke="#202c38" strokeWidth="0.5" opacity="0.6"/>
      {/* Left reel */}
      <rect x="12" y="11" width="3"  height="3"  fill="#1e1e28"/>
      <rect x="13" y="12" width="1"  height="1"  fill="#080812"/>
      {/* Right reel */}
      <rect x="17" y="11" width="3"  height="3"  fill="#1e1e28"/>
      <rect x="18" y="12" width="1"  height="1"  fill="#080812"/>
      {/* Tape ribbon */}
      <rect x="14" y="13" width="4"  height="1"  fill="#90786a"/>
      {/* Play indicator LED */}
      <rect x="19" y="11" width="1"  height="1"  fill="#00ff44" opacity="0.85"/>
      {/* EQ display background */}
      <rect x="11" y="17" width="10" height="5"  fill="#030e18"/>
      <rect x="10" y="17" width="12" height="5"  fill="#0060b0" opacity="0.07"/>
      {/* EQ bars (9 bars) */}
      <rect x="11" y="19" width="1"  height="3"  fill="#00f0cc"/>
      <rect x="12" y="20" width="1"  height="2"  fill="#00d4f8"/>
      <rect x="13" y="18" width="1"  height="4"  fill="#0094ff"/>
      <rect x="14" y="20" width="1"  height="2"  fill="#3866ff"/>
      <rect x="15" y="17" width="1"  height="5"  fill="#6644ff"/>
      <rect x="16" y="19" width="1"  height="3"  fill="#9944ff"/>
      <rect x="17" y="20" width="1"  height="2"  fill="#cc44ff"/>
      <rect x="18" y="18" width="1"  height="4"  fill="#ff44cc"/>
      <rect x="19" y="20" width="1"  height="2"  fill="#ff44cc"/>
      {/* Buttons row */}
      <rect x="11" y="23" width="10" height="3"  fill="#141412"/>
      <rect x="11" y="23" width="2"  height="2"  fill="#282826"/>
      <rect x="13" y="23" width="2"  height="2"  fill="#282826"/>
      <rect x="15" y="23" width="2"  height="2"  fill="#183018"/>
      <rect x="17" y="23" width="2"  height="2"  fill="#282826"/>
      <rect x="19" y="23" width="2"  height="2"  fill="#282826"/>
      {/* Volume / tuner row */}
      <rect x="11" y="25" width="10" height="4"  fill="#101010"/>
      <rect x="12" y="25" width="3"  height="2"  fill="#242422"/>
      <rect x="13" y="25" width="1"  height="1"  fill="#383836"/>
      <rect x="17" y="25" width="3"  height="2"  fill="#242422"/>
      <rect x="18" y="25" width="1"  height="1"  fill="#383836"/>
      {/* Tuner slide + indicator */}
      <rect x="11" y="27" width="10" height="1"  fill="#1a1a18"/>
      <rect x="15" y="27" width="1"  height="1"  fill="#ffe040" opacity="0.82"/>

      {/* ── RIGHT SPEAKER GRILLE (mirror) ── */}
      <rect x="22" y="8"  width="10" height="20" fill="#111110"/>
      {[9,11,13,15,17,19,21,23,25,27].map(gy => (
        <rect key={gy} x="22" y={gy} width="10" height="1" fill="#0c0c0a" opacity="0.75"/>
      ))}
      {[22,24,26,28,30].map(gx => (
        <rect key={gx} x={gx} y={8} width="1" height="20" fill="#0c0c0a" opacity="0.55"/>
      ))}
      {/* Right speaker cone (cx=27 cy=18) */}
      <rect x="24" y="15" width="6"  height="6"  fill="#1c1c1a"/>
      <rect x="25" y="14" width="4"  height="8"  fill="#1c1c1a"/>
      <rect x="25" y="16" width="4"  height="4"  fill="#141412"/>
      <rect x="26" y="17" width="2"  height="2"  fill="#0c0c0a"/>
      <rect x="26" y="17" width="1"  height="1"  fill="#282826"/>
      <rect x="25" y="14" width="1"  height="1"  fill="#242422" opacity="0.6"/>
      {/* Sound wave dots right edge */}
      <rect x="31" y="12" width="1"  height="1"  fill="#c89018" opacity="0.38"/>
      <rect x="31" y="15" width="1"  height="1"  fill="#c89018" opacity="0.38"/>
      <rect x="31" y="18" width="1"  height="1"  fill="#c89018" opacity="0.38"/>
      <rect x="31" y="21" width="1"  height="1"  fill="#c89018" opacity="0.35"/>
      <rect x="31" y="24" width="1"  height="1"  fill="#c89018" opacity="0.30"/>

      {/* ── BASS VENT SLOTS ── */}
      {[1,4,7,10,13,16,19,22,25,28].map(vx => (
        <rect key={vx} x={vx} y={28} width="2" height="1" fill="#242422" opacity="0.6"/>
      ))}

      {/* ── FLOOR SHADOW ── */}
      <rect x="0"  y="29" width="32" height="3"  fill="#040406"/>
      <rect x="4"  y="29" width="24" height="1"  fill="#0c0c0a" opacity="0.5"/>
      {/* EQ glow on floor */}
      <rect x="11" y="29" width="10" height="2"  fill="#6644ff" opacity="0.04"/>
    </svg>
  );
}
// ── Cover 4: "Last Train Riot" — Tokyo punk, rushing last train ───────────────
function Cover4() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 32 32" shapeRendering="crispEdges" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
      <rect width="32" height="32" fill="#080206"/>
      {/* Crowd silhouettes top */}
      <rect x="1"  y="3"  width="3"  height="5"  fill="#0e0408"/>
      <rect x="2"  y="1"  width="2"  height="3"  fill="#0e0408"/>
      <rect x="2"  y="0"  width="1"  height="2"  fill="#0e0408"/>
      <rect x="7"  y="4"  width="3"  height="4"  fill="#0e0408"/>
      <rect x="8"  y="2"  width="2"  height="3"  fill="#0e0408"/>
      <rect x="13" y="2"  width="3"  height="6"  fill="#120408"/>
      <rect x="14" y="0"  width="2"  height="3"  fill="#120408"/>
      <rect x="15" y="0"  width="1"  height="4"  fill="#120408"/>
      <rect x="19" y="3"  width="3"  height="5"  fill="#0e0408"/>
      <rect x="20" y="1"  width="2"  height="3"  fill="#0e0408"/>
      <rect x="25" y="2"  width="3"  height="6"  fill="#0e0408"/>
      <rect x="26" y="0"  width="2"  height="3"  fill="#0e0408"/>
      <rect x="26" y="0"  width="1"  height="4"  fill="#0e0408"/>
      {/* Speed lines above */}
      {[0,4,8,12,16,20,24,28].map((lx,i) => (
        <rect key={i} x={lx} y={0} width="2" height="10" fill="#cc0a0a" opacity={0.03+i%3*0.018}/>
      ))}
      {/* Train body */}
      <rect x="0"  y="10" width="32" height="14" fill="#1a0608"/>
      <rect x="0"  y="10" width="32" height="1"  fill="#280a0c"/>
      <rect x="0"  y="23" width="32" height="1"  fill="#1e0808"/>
      <rect x="0"  y="11" width="32" height="2"  fill="#cc0a0a" opacity="0.78"/>
      {/* Windows */}
      {[1,7,13,19,25].map((wx,i) => (
        <g key={i}>
          <rect x={wx}   y={13} width="5" height="8" fill="#3a0c10" opacity="0.9"/>
          <rect x={wx}   y={13} width="5" height="3" fill="#c84020" opacity="0.40"/>
          <rect x={wx+1} y={14} width="3" height="2" fill="#e05030" opacity="0.32"/>
        </g>
      ))}
      {/* Motion blur lines */}
      <rect x="0" y="7"  width="32" height="1"  fill="#240a0c" opacity="0.80"/>
      <rect x="0" y="8"  width="32" height="1"  fill="#1a0608" opacity="0.60"/>
      <rect x="0" y="9"  width="32" height="1"  fill="#300e10" opacity="0.80"/>
      <rect x="0" y="24" width="32" height="1"  fill="#300e10" opacity="0.80"/>
      <rect x="0" y="25" width="32" height="1"  fill="#240a0c" opacity="0.65"/>
      <rect x="0" y="26" width="32" height="1"  fill="#1c0608" opacity="0.50"/>
      {/* Warning stripes */}
      {[0,1,2,3,4,5,6,7].map(s => (
        <g key={s}>
          <rect x={s*4}   y={24} width="2" height="8" fill="#f0c000" opacity="0.78"/>
          <rect x={s*4+2} y={24} width="2" height="8" fill="#180808" opacity="0.92"/>
        </g>
      ))}
      {/* Speed lines below */}
      {[0,4,8,12,16,20,24,28].map((lx,i) => (
        <rect key={i} x={lx} y={26} width="2" height="6" fill="#cc0a0a" opacity={0.03+i%3*0.015}/>
      ))}
      {/* Sparks */}
      <rect x="6"  y="9"  width="1" height="1" fill="#ffe040" opacity="0.90"/>
      <rect x="7"  y="8"  width="1" height="1" fill="#ffe040" opacity="0.70"/>
      <rect x="5"  y="8"  width="1" height="1" fill="#ff8020" opacity="0.80"/>
      <rect x="22" y="9"  width="1" height="1" fill="#ffe040" opacity="0.85"/>
      <rect x="23" y="8"  width="1" height="1" fill="#ffe040" opacity="0.65"/>
      <rect x="21" y="9"  width="1" height="1" fill="#ff8020" opacity="0.75"/>
    </svg>
  );
}
// ── Cover 5: "Midnight Kissaten" — late-night coffee shop ────────────────────
function Cover5() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 32 32" shapeRendering="crispEdges" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
      <rect width="32" height="32" fill="#060d06"/>
      <rect x="0"  y="0"  width="32" height="22" fill="#0a1208"/>
      {/* Window to rainy street */}
      <rect x="2"  y="2"  width="15" height="14" fill="#040e10"/>
      <rect x="2"  y="2"  width="15" height="14" fill="none" stroke="#183820" strokeWidth="1"/>
      <rect x="9"  y="2"  width="1"  height="14" fill="#162a12"/>
      <rect x="2"  y="9"  width="15" height="1"  fill="#162a12"/>
      <rect x="3"  y="3"  width="13" height="12" fill="#030c0a"/>
      <rect x="13" y="4"  width="1"  height="7"  fill="#1c2820" opacity="0.7"/>
      <rect x="12" y="3"  width="3"  height="1"  fill="#c8a030" opacity="0.65"/>
      <rect x="11" y="3"  width="5"  height="5"  fill="#c8a030" opacity="0.05"/>
      <rect x="3"  y="11" width="13" height="4"  fill="#040e0a"/>
      <rect x="5"  y="12" width="9"  height="1"  fill="#1c6040" opacity="0.28"/>
      <rect x="4"  y="3"  width="1"  height="4"  fill="#4070a0" opacity="0.18"/>
      <rect x="7"  y="5"  width="1"  height="4"  fill="#4070a0" opacity="0.15"/>
      <rect x="11" y="4"  width="1"  height="3"  fill="#4070a0" opacity="0.18"/>
      <rect x="14" y="6"  width="1"  height="4"  fill="#4070a0" opacity="0.15"/>
      {/* Neon sign */}
      <rect x="19" y="3"  width="11" height="8"  fill="#08100a"/>
      <rect x="20" y="4"  width="9"  height="1"  fill="#00e888" opacity="0.80"/>
      <rect x="20" y="6"  width="7"  height="1"  fill="#00e888" opacity="0.55"/>
      <rect x="20" y="8"  width="8"  height="1"  fill="#00e888" opacity="0.65"/>
      <rect x="19" y="3"  width="11" height="8"  fill="none" stroke="#00e888" strokeWidth="0.5" opacity="0.38"/>
      <rect x="18" y="2"  width="13" height="10" fill="#00e888" opacity="0.03"/>
      {/* Hanging lamp */}
      <rect x="8"  y="0"  width="1"  height="4"  fill="#3c2810" opacity="0.7"/>
      <rect x="6"  y="4"  width="5"  height="6"  fill="#c87010"/>
      <rect x="6"  y="4"  width="5"  height="1"  fill="#e8a020" opacity="0.5"/>
      <rect x="7"  y="5"  width="3"  height="4"  fill="#f0c030" opacity="0.55"/>
      <rect x="4"  y="10" width="9"  height="9"  fill="#f0c030" opacity="0.05"/>
      {/* Counter */}
      <rect x="0"  y="20" width="32" height="4"  fill="#1c3014"/>
      <rect x="0"  y="20" width="32" height="1"  fill="#2a4420"/>
      <rect x="0"  y="21" width="32" height="2"  fill="#22381a"/>
      <rect x="0"  y="23" width="32" height="1"  fill="#142410"/>
      {[4,10,18,26].map(fx => (
        <rect key={fx} x={fx} y={21} width="1" height="2" fill="#1a2c14" opacity="0.5"/>
      ))}
      {/* Floor */}
      <rect x="0"  y="24" width="32" height="8"  fill="#080e06"/>
      <rect x="0"  y="24" width="32" height="1"  fill="#0e1a0a"/>
      {/* Coffee cup with steam */}
      <rect x="13" y="20" width="7"  height="1"  fill="#c8c0a8" opacity="0.7"/>
      <rect x="14" y="16" width="5"  height="5"  fill="#e0d8c0"/>
      <rect x="14" y="16" width="5"  height="1"  fill="#c8c0a8"/>
      <rect x="15" y="17" width="3"  height="3"  fill="#6c3c10"/>
      <rect x="15" y="17" width="3"  height="1"  fill="#8c5020" opacity="0.6"/>
      <rect x="19" y="17" width="1"  height="3"  fill="#d0c8b0"/>
      <rect x="19" y="17" width="2"  height="1"  fill="#d0c8b0"/>
      <rect x="19" y="19" width="2"  height="1"  fill="#d0c8b0"/>
      <rect x="15" y="14" width="1"  height="2"  fill="#c0c8c0" opacity="0.22"/>
      <rect x="17" y="13" width="1"  height="3"  fill="#c0c8c0" opacity="0.18"/>
      <rect x="16" y="12" width="1"  height="2"  fill="#c0c8c0" opacity="0.15"/>
      {/* Sleeping cat */}
      <rect x="23" y="17" width="6"  height="4"  fill="#1a1a18"/>
      <rect x="24" y="14" width="4"  height="4"  fill="#1a1a18"/>
      <rect x="24" y="13" width="1"  height="2"  fill="#1a1a18"/>
      <rect x="27" y="13" width="1"  height="2"  fill="#1a1a18"/>
      <rect x="25" y="16" width="1"  height="1"  fill="#c8a020" opacity="0.55"/>
      <rect x="27" y="16" width="1"  height="1"  fill="#c8a020" opacity="0.55"/>
      <rect x="29" y="19" width="1"  height="2"  fill="#1a1a18"/>
      <rect x="28" y="20" width="2"  height="1"  fill="#1a1a18"/>
    </svg>
  );
}
const COVERS = [Cover0, Cover1, Cover2, Cover3, Cover4, Cover5];

// ─── VinylShelf (side walls only) ─────────────────────────────────────────────
function VinylShelf({ rng, x, y, w, h, dividers = false }:
  { rng: () => number; x: number; y: number; w: number; h: number; dividers?: boolean }) {
  const spines: React.ReactNode[] = [];
  let cx = x;
  while (cx < x + w - 0.5) {
    const sw      = 2.0 + rng() * 0.3;
    const isVivid = rng() < 0.03;
    const col     = isVivid
      ? SLEEVE_VIVID[Math.floor(rng() * SLEEVE_VIVID.length)]
      : SLEEVE_NEUTRAL[Math.floor(rng() * SLEEVE_NEUTRAL.length)];
    spines.push(
      <g key={cx}>
        <rect x={cx} y={y} width={sw} height={h} fill={col} opacity="0.95"/>
        <rect x={cx} y={y} width={sw} height="0.35" fill="white" opacity="0.55"/>
      </g>
    );
    cx += sw;
  }
  const divXs = dividers ? [x + w/3, x + w*2/3] : [];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#03081c"/>
      {spines}
      {divXs.map((dx, i) => (
        <g key={i}>
          <rect x={dx-0.4} y={y} width="0.8" height={h} fill="#00e8ff" opacity="0.88"/>
        </g>
      ))}
      <rect x={x} y={y+h}   width={w} height="2.5" fill="#020a18"/>
      <rect x={x} y={y+h+1} width={w} height="0.6" fill="#00e8ff" opacity="0.20"/>
    </g>
  );
}

function NeonTube({ x, y, w, col='#00e8ff', pulseAnim='neonPulse' }:
  { x: number; y: number; w: number; col?: string; pulseAnim?: string }) {
  return (
    <g>
      <rect x={x-2} y={y-2} width={w+4} height="5"  fill={col} opacity="0.06"/>
      <rect x={x}   y={y}   width={w}   height="2.5" fill={col} opacity="0.18"/>
      <rect x={x}   y={y+0.5} width={w} height="1.5" fill={col} opacity="0.9"
        style={{ animation: `${pulseAnim} 4s ease-in-out infinite` }}/>
    </g>
  );
}

function SVGEQStrip({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const n=24, barW=(w-2)/n-0.8;
  const anims=['svgEq0','svgEq1','svgEq2','svgEq3','svgEq4','svgEq5','svgEq6','svgEq7'];
  const durs =['1.08s','1.25s','0.98s','1.18s','0.92s','1.12s','1.22s','1.04s'];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#030a1e"/>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#00e8ff" strokeWidth="0.8" opacity="0.55"/>
      {Array.from({length:n}, (_,i) => (
        <rect key={i} className="svgEq"
          x={x+1+i*((w-2)/n)} y={y+1} width={barW} height={h-2}
          fill={SVG_EQ_COLORS[i]} opacity="0.88"
          style={{ animation:`${anims[i%8]} ${durs[i%8]} ease-in-out infinite`, animationDelay:`${(i*0.055)%0.9}s` }}/>
      ))}
    </g>
  );
}

function VinylDisc({ record, spinning }: { record: typeof RECORDS[0]; spinning: boolean }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 80 80" shapeRendering="crispEdges"
      style={{ display:'block', animation: spinning ? 'spinRecord 2.8s linear infinite' : 'none', transformOrigin:'center' }}>
      <circle cx="40" cy="40" r="39" fill="#0a0818"/>
      {[0.38,0.49,0.60,0.70,0.80,0.91].map((r,i) => (
        <circle key={i} cx="40" cy="40" r={r*39} fill="none" stroke={i%2===0?'#141028':'#1a1638'} strokeWidth="1.5"/>
      ))}
      <circle cx="40" cy="40" r="14" fill={record.label}/>
      <circle cx="40" cy="40" r="14" fill="none" stroke={record.groove} strokeWidth="1.5"/>
      <rect x="35" y="31" width="6" height="4" fill="white" opacity="0.14"/>
      <circle cx="40" cy="40" r="2.5" fill="#020814"/>
      <ellipse cx="28" cy="26" rx="6" ry="3" fill="#00e8ff" opacity="0.07" transform="rotate(-25 28 26)"/>
    </svg>
  );
}

// ─── Music poster (back wall) — 5 pixel-art concert poster variants ───────────
function MusicPoster({ x, y, w, h, variant, accent }:
  { x: number; y: number; w: number; h: number; variant: number; accent: string }) {
  const cx = x + w / 2;
  return (
    <g>
      {/* Shadow/glow behind poster */}
      <rect x={x-1} y={y-1} width={w+2} height={h+2} fill={accent} opacity="0.08"/>
      {/* Paper backing */}
      <rect x={x} y={y} width={w} height={h} fill="#060a1c"/>

      {variant === 0 && (<g>
        {/* Concert poster — bold top bar + waveform art + date strips */}
        <rect x={x}   y={y}   width={w} height={5}   fill={accent}/>
        <rect x={x}   y={y}   width={w} height={5}   fill="#000" opacity="0.25"/>
        <rect x={x+2} y={y+6} width={w-4} height={2} fill={accent} opacity="0.65"/>
        <rect x={x+2} y={y+9} width={w-7} height={1.5} fill={accent} opacity="0.40"/>
        {/* Circular waveform */}
        <circle cx={cx} cy={y+h*0.56} r={w*0.28} fill="#0a0c1e"/>
        <circle cx={cx} cy={y+h*0.56} r={w*0.28} fill="none" stroke={accent} strokeWidth="0.9" opacity="0.85"/>
        <circle cx={cx} cy={y+h*0.56} r={w*0.16} fill="none" stroke={accent} strokeWidth="0.6" opacity="0.55"/>
        <circle cx={cx} cy={y+h*0.56} r={w*0.07} fill={accent} opacity="0.9"/>
        {[-2.5,-1.5,-0.5,0.5,1.5,2.5].map((i,idx) => {
          const bh = [5,9,12,12,9,5][idx];
          return <rect key={i} x={cx+i*3.8-1} y={y+h*0.56-bh/2} width="2.2" height={bh} fill={accent} opacity="0.3"/>;
        })}
        <rect x={x+2} y={y+h-6} width={w-4} height={1.5} fill={accent} opacity="0.45"/>
        <rect x={x+2} y={y+h-4} width={w-8} height={1}   fill={accent} opacity="0.28"/>
      </g>)}

      {variant === 1 && (<g>
        {/* Vinyl record art poster — large disc icon */}
        <rect x={x+2} y={y+2} width={w-4} height={3}   fill={accent} opacity="0.18"/>
        <rect x={x+2} y={y+6} width={w-4} height={2}   fill={accent} opacity="0.55"/>
        <rect x={x+2} y={y+9} width={w-6} height={1.5} fill={accent} opacity="0.38"/>
        {/* Vinyl disc */}
        <circle cx={cx} cy={y+h*0.58} r={w*0.33} fill="#0a0614"/>
        {[0.90,0.72,0.55,0.40].map((r,i) => (
          <circle key={i} cx={cx} cy={y+h*0.58} r={r*w*0.33} fill="none" stroke={accent} strokeWidth="0.5" opacity={0.3+i*0.12}/>
        ))}
        <circle cx={cx} cy={y+h*0.58} r={w*0.10} fill={accent} opacity="0.75"/>
        <circle cx={cx} cy={y+h*0.58} r={w*0.04} fill="#020814"/>
        {/* Shine */}
        <ellipse cx={cx-w*0.12} cy={y+h*0.48} rx={w*0.07} ry={w*0.04} fill={accent} opacity="0.12" transform={`rotate(-30 ${cx-w*0.12} ${y+h*0.48})`}/>
        <rect x={x+2} y={y+h-4} width={w-4} height={1.5} fill={accent} opacity="0.38"/>
      </g>)}

      {variant === 2 && (<g>
        {/* Festival poster — stacked coloured act lines */}
        {[0,1,2,3,4,5,6,7,8,9].map(i => {
          const cols=['#00e8ff','#ff0088','#8844ff','#ffcc00','#ff0088','#00e8ff','#8844ff','#ffcc00','#ff0088','#00e8ff'];
          const ws=[w-4, w-8, w-6, w-10, w-5, w-9, w-7, w-11, w-6, w-8];
          return <rect key={i} x={x+2} y={y+3+i*(h-8)/10} width={ws[i]} height={2.5} fill={cols[i]} opacity={0.5+i%2*0.25}/>;
        })}
        {/* Star */}
        <circle cx={cx} cy={y+h-8} r={3} fill="#ffcc00" opacity="0.8"/>
        <circle cx={cx} cy={y+h-8} r={5} fill="none" stroke="#ffcc00" strokeWidth="0.5" opacity="0.4"/>
        <rect x={x+2} y={y+h-4} width={w-4} height={1.5} fill="#ffcc00" opacity="0.35"/>
      </g>)}

      {variant === 3 && (<g>
        {/* Tour poster — city silhouette */}
        <rect x={x+2} y={y+3}  width={w-4} height={2.5} fill={accent} opacity="0.7"/>
        <rect x={x+2} y={y+6}  width={w-6} height={1.5} fill={accent} opacity="0.45"/>
        {/* Sky */}
        <rect x={x} y={y+12} width={w} height={h-24} fill="#04060e"/>
        {/* Stars */}
        {[4,9,16,22,6,18].map((sx,i) => <rect key={i} x={x+sx} y={y+14+i%4*2} width="0.8" height="0.8" fill={accent} opacity="0.7"/>)}
        {/* Cityscape */}
        {[
          [x+2,  h-22, 6, 10],[x+8,  h-22, 4, 15],[x+12, h-22, 5, 8],
          [x+17, h-22, 6, 12],[x+22, h-22, 4, 18],[x+26, h-22, 5, 9],
        ].map(([bx,by,bw,bh],i) => (
          <g key={i}>
            <rect x={bx} y={y+by} width={bw} height={bh} fill="#0a0c20"/>
            <rect x={bx+1} y={y+by+2} width={1} height={1} fill={accent} opacity="0.6"/>
          </g>
        ))}
        {/* Horizon glow */}
        <rect x={x} y={y+h-14} width={w} height="2" fill={accent} opacity="0.25"/>
        {/* Date strip */}
        <rect x={x+2} y={y+h-5} width={w-4} height={1.5} fill={accent} opacity="0.45"/>
        <rect x={x+2} y={y+h-3} width={w-8} height={1}   fill={accent} opacity="0.28"/>
      </g>)}

      {variant === 4 && (<g>
        {/* Abstract DJ/wave poster */}
        <rect x={x+2} y={y+3} width={w-4} height={2.5} fill={accent} opacity="0.65"/>
        {/* Waveform bars */}
        {Array.from({length: Math.floor(w/3)}, (_,i) => {
          const bh = 4 + Math.sin(i*0.7)*4 + Math.cos(i*1.1)*3;
          const bc = i%3===0 ? accent : i%3===1 ? '#ff0088' : '#8844ff';
          return <rect key={i} x={x+2+i*3} y={y+h/2-bh/2} width="2.2" height={bh} fill={bc} opacity="0.65"/>;
        })}
        {/* Central burst */}
        <circle cx={cx} cy={y+h*0.55} r={5} fill={accent} opacity="0.12"/>
        <circle cx={cx} cy={y+h*0.55} r={3} fill={accent} opacity="0.22"/>
        <circle cx={cx} cy={y+h*0.55} r={1.5} fill={accent} opacity="0.9"/>
        <rect x={x+2} y={y+h-5} width={w-4} height={1.5} fill={accent} opacity="0.4"/>
        <rect x={x+2} y={y+h-3} width={w-7} height={1}   fill={accent} opacity="0.25"/>
      </g>)}

      {/* Poster frame */}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={accent} strokeWidth="0.7" opacity="0.75"/>
      {/* Pin/tack at top corners */}
      <circle cx={x+3}   cy={y+2} r="1"   fill="#c0b090" opacity="0.8"/>
      <circle cx={x+w-3} cy={y+2} r="1"   fill="#c0b090" opacity="0.8"/>
    </g>
  );
}

// ─── Inline turntable (HTML UI, next to record selector) ─────────────────────
function InlineTurntable({ record, spinning }: { record: typeof RECORDS[0] | null; spinning: boolean }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" shapeRendering="crispEdges" style={{display:'block'}}>
      {/* Deck body */}
      <rect x="0" y="0" width="120" height="120" fill="#05070f"/>
      {/* Neon outer border */}
      <rect x="0" y="0" width="120" height="120" fill="none" stroke="#00e8ff" strokeWidth="1.5" opacity="0.45"
        style={{animation:'neonPulse 4s ease-in-out infinite'}}/>
      {/* Corner L-brackets */}
      <rect x="0"   y="0"   width="12" height="1.5" fill="#00e8ff" opacity="0.7"/>
      <rect x="0"   y="0"   width="1.5" height="12" fill="#00e8ff" opacity="0.7"/>
      <rect x="108" y="0"   width="12"  height="1.5" fill="#00e8ff" opacity="0.7"/>
      <rect x="118.5" y="0" width="1.5" height="12" fill="#00e8ff" opacity="0.7"/>
      <rect x="0"   y="118.5" width="12" height="1.5" fill="#00e8ff" opacity="0.7"/>
      <rect x="0"   y="108"   width="1.5" height="12" fill="#00e8ff" opacity="0.7"/>
      <rect x="108" y="118.5" width="12"  height="1.5" fill="#00e8ff" opacity="0.7"/>
      <rect x="118.5" y="108" width="1.5" height="12" fill="#00e8ff" opacity="0.7"/>

      {/* Platter base */}
      <circle cx="55" cy="62" r="50" fill="#04050c"/>
      <circle cx="55" cy="62" r="49" fill="#07080e"/>

      {/* Empty groove rings when no disc */}
      {!record && [40,32,24,16].map(r => (
        <circle key={r} cx="55" cy="62" r={r} fill="none" stroke="#0d0e1c" strokeWidth="0.8"/>
      ))}

      {/* Spinning vinyl disc */}
      {record && (
        <g style={{transformOrigin:'55px 62px', animation: spinning ? 'spinRecord 2.8s linear infinite' : 'none'}}>
          <circle cx="55" cy="62" r="48" fill="#0a0818"/>
          {[0.36,0.47,0.58,0.69,0.80,0.91].map((rr,i) => (
            <circle key={i} cx="55" cy="62" r={rr*48} fill="none"
              stroke={i%2===0?'#141028':'#1a1638'} strokeWidth="1.4"/>
          ))}
          <circle cx="55" cy="62" r="14" fill={record.label}/>
          <circle cx="55" cy="62" r="14" fill="none" stroke={record.groove} strokeWidth="1.4"/>
          <rect x="50" y="55" width="10" height="6" fill="white" opacity="0.14"/>
          <circle cx="55" cy="62" r="3" fill="#020814"/>
          <ellipse cx="40" cy="48" rx="8" ry="4" fill="#00e8ff" opacity="0.07" transform="rotate(-25 40 48)"/>
        </g>
      )}

      {/* Platter outer neon ring */}
      <circle cx="55" cy="62" r="49" fill="none" stroke="#00e8ff" strokeWidth="1.5" opacity="0.55"
        style={{animation:'neonPulse 3s ease-in-out infinite'}}/>

      {/* Tonearm pivot */}
      <circle cx="101" cy="22" r="8" fill="#0c1428"/>
      <circle cx="101" cy="22" r="6" fill="#141e32"/>
      <circle cx="101" cy="22" r="2.2" fill="#00e8ff" opacity="0.8"/>

      {/* Tonearm — resting off-platter when no record, touching when playing */}
      {record ? (
        <>
          <line x1="101" y1="22" x2="74" y2="66" stroke="#c8d8f0" strokeWidth="2.2" strokeLinecap="round" opacity="0.9"/>
          <rect x="71" y="64" width="8" height="4" fill="#182840" rx="1"/>
          <circle cx="72" cy="66" r="1.6" fill="#00e8ff" opacity="0.85"/>
        </>
      ) : (
        <line x1="101" y1="22" x2="96" y2="78" stroke="#c8d8f0" strokeWidth="2.2" strokeLinecap="round" opacity="0.55"/>
      )}

      {/* Right-side control panel */}
      {/* Power button */}
      <rect x="92" y="88" width="14" height="14" fill="#07090f" rx="2"/>
      <rect x="92" y="88" width="14" height="14" fill="none" stroke="#00e8ff" strokeWidth="0.6" opacity="0.4" rx="2"/>
      <circle cx="99" cy="95" r="4" fill="#0c1020"/>
      <circle cx="99" cy="95" r="2.2" fill="#00e8ff" opacity={record ? 0.85 : 0.25}/>

      {/* Status LED */}
      <circle cx="112" cy="58" r="3" fill={record ? '#00ff88' : '#10201a'} opacity="0.9"/>
      <circle cx="112" cy="58" r="5" fill={record ? '#00ff88' : 'transparent'} opacity="0.18"/>

      {/* Pitch slider track */}
      <rect x="110" y="68" width="3.5" height="22" fill="#060810" rx="1.2"/>
      <rect x="108.5" y={record ? "74" : "70"} width="6.5" height="7" fill="#182840" rx="1.5"/>
      <rect x="108.5" y={record ? "75.5" : "71.5"} width="6.5" height="2" fill="#1e3050" rx="0.5"/>

      {/* 33/45 selector */}
      <rect x="92" y="68" width="8" height="6" fill="#07090f" rx="1"/>
      <rect x="93" y="69.5" width="2.5" height="3" fill="#8844ff" opacity="0.7"/>
      <rect x="97" y="69.5" width="2.5" height="3" fill="#1c2840"/>
    </svg>
  );
}

// ─── Room SVG ─────────────────────────────────────────────────────────────────
function RoomScene({ ttIdx }: { ttIdx: number }) {
  const rec  = RECORDS[ttIdx];

  return (
    <svg viewBox="0 0 320 180" width="100%" height="100%"
      shapeRendering="crispEdges" preserveAspectRatio="xMidYMid slice"
      style={{ position:'absolute', inset:0, display:'block' }}>
      <defs>
        <radialGradient id="rs-discGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={rec.label} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={rec.label} stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="rs-cyanBloom" cx="50%" cy="30%" r="50%">
          <stop offset="0%"   stopColor="#00e8ff" stopOpacity="0.10"/>
          <stop offset="100%" stopColor="#00e8ff" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="rs-pinkBloom" cx="64%" cy="36%" r="24%">
          <stop offset="0%"   stopColor="#ff0088" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#ff0088" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="rs-vignT" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#020814" stopOpacity="0.55"/>
          <stop offset="22%" stopColor="#020814" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="rs-vignB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="72%" stopColor="#020814" stopOpacity="0"/>
          <stop offset="100%" stopColor="#020814" stopOpacity="0.65"/>
        </linearGradient>
      </defs>

      <rect width="320" height="180" fill="#020814"/>
      <rect x="0" y="0" width="320" height="14" fill="#030a1c"/>
      <NeonTube x={62} y={1} w={196} col="#00e8ff" pulseAnim="neonFlick"/>
      <rect x="64" y="4.5" width="192" height="1" fill="#ff0088" opacity="0.52"
        style={{ animation:'neonPulse2 5s ease-in-out infinite' }}/>

      {/* Left side wall — posters & decorations */}
      <polygon points="0,0 62,0 62,88 0,112" fill="#050a1c"/>
      <rect x="59" y="0" width="3"   height="88" fill="#ff0088" opacity="0.22"/>
      <rect x="61" y="0" width="1.2" height="88" fill="#ff0088" opacity="0.9"
        style={{ animation:'neonPulse 4.5s ease-in-out infinite' }}/>

      {/* ─ CONCERT POSTER (top-left) ─ */}
      <rect x="3"  y="3" width="34" height="43" fill="#04071e"/>
      <rect x="3"  y="3" width="34" height="43" fill="none" stroke="#ff0088" strokeWidth="0.8"/>
      <rect x="3"  y="3" width="34" height="7"  fill="#cc0066"/>
      <text x="20" y="8.5" textAnchor="middle" fontFamily="monospace" fontSize="3.5" fill="#fff">DEAD WAVES</text>
      {/* Stage light cones */}
      <polygon points="6,10 8,10 12,26 4,26"   fill="#ff4488" opacity="0.09"/>
      <polygon points="16,10 18,10 22,26 12,26" fill="#ff44aa" opacity="0.11"/>
      <polygon points="28,10 30,10 34,26 24,26" fill="#ff4488" opacity="0.08"/>
      {/* Band silhouettes */}
      <rect x="7"  y="19" width="4" height="7" fill="#ff0088" opacity="0.70"/>
      <rect x="8"  y="15" width="3" height="4" fill="#cc8898" opacity="0.65"/>
      <rect x="5"  y="22" width="3" height="1" fill="#cc8044" opacity="0.45"/>
      <rect x="17" y="16" width="4" height="8" fill="#ff4499" opacity="0.80"/>
      <rect x="18" y="12" width="3" height="4" fill="#cc8870" opacity="0.70"/>
      <rect x="15" y="19" width="8" height="1" fill="#aaaaaa" opacity="0.30"/>
      <rect x="26" y="19" width="4" height="6" fill="#cc0055" opacity="0.55"/>
      <rect x="27" y="16" width="3" height="3" fill="#aa7060" opacity="0.50"/>
      <rect x="24" y="23" width="3" height="3" fill="#441120" opacity="0.60"/>
      {/* Stage floor glow */}
      <rect x="3"  y="26" width="34" height="1" fill="#ff0088" opacity="0.40"/>
      <rect x="3"  y="27" width="34" height="5" fill="#ff0088" opacity="0.05"/>
      <rect x="3"  y="32" width="34" height="1" fill="#ff0088" opacity="0.18"/>
      <text x="20" y="37"   textAnchor="middle" fontFamily="monospace" fontSize="2.6" fill="#ff88bb">LIVE TOUR 2086</text>
      <text x="20" y="40.5" textAnchor="middle" fontFamily="monospace" fontSize="2"   fill="#774466">渋谷 CLUB CHAOS</text>
      <text x="20" y="44"   textAnchor="middle" fontFamily="monospace" fontSize="1.9" fill="#3a2040">03.14 / 04.05</text>
      {/* Corner tape */}
      <rect x="2"  y="2"  width="6" height="2.5" fill="#f0e0a0" opacity="0.20"/>
      <rect x="30" y="2"  width="6" height="2.5" fill="#f0e0a0" opacity="0.20"/>

      {/* ─ SMALL FLYER (top-right) ─ */}
      <rect x="40" y="3"  width="19" height="23" fill="#03091a"/>
      <rect x="40" y="3"  width="19" height="23" fill="none" stroke="#8844ff" strokeWidth="0.6"/>
      <rect x="40" y="3"  width="19" height="5"  fill="#7733cc"/>
      <text x="49.5" y="7"    textAnchor="middle" fontFamily="monospace" fontSize="2.8" fill="#fff">NEON</text>
      <text x="49.5" y="10.5" textAnchor="middle" fontFamily="monospace" fontSize="2"   fill="#cc88ff">STATIC</text>
      <circle cx="49.5" cy="18" r="5"   fill="none" stroke="#8844ff" strokeWidth="0.5" opacity="0.7"/>
      <circle cx="49.5" cy="18" r="2.5" fill="#8844ff" opacity="0.30"/>
      <circle cx="49.5" cy="18" r="1"   fill="#8844ff" opacity="0.80"/>
      <text x="49.5" y="23.5" textAnchor="middle" fontFamily="monospace" fontSize="1.8" fill="#7733cc">04.12 新宿</text>

      {/* ─ STICKER CLUSTER (middle) ─ */}
      <circle cx="10"  cy="54" r="7"   fill="#00e8ff" opacity="0.70"/>
      <circle cx="10"  cy="54" r="7"   fill="none" stroke="#80f8ff" strokeWidth="0.4" opacity="0.45"/>
      <circle cx="10"  cy="54" r="5"   fill="#01091a"/>
      <text x="10" y="55.5" textAnchor="middle" fontFamily="monospace" fontSize="2.4" fill="#00e8ff">VINYL</text>
      <rect x="20"  y="49" width="16" height="6" fill="#180008"/>
      <rect x="20"  y="49" width="16" height="6" fill="none" stroke="#ff0044" strokeWidth="0.4"/>
      <text x="28" y="53.5" textAnchor="middle" fontFamily="monospace" fontSize="2" fill="#ff0044">YORU COLL.</text>
      <rect x="38"  y="49" width="20" height="6" fill="#cc2200"/>
      <text x="48" y="53.5" textAnchor="middle" fontFamily="monospace" fontSize="2.2" fill="#fff">NO SLEEP!</text>
      <ellipse cx="27" cy="60" rx="10" ry="5" fill="#ccaa00"/>
      <text x="27" y="61.5" textAnchor="middle" fontFamily="monospace" fontSize="2" fill="#3a2800">ALL NIGHTER</text>

      {/* ─ BAND STICKER ROW (lower) ─ */}
      <rect x="3"  y="66" width="54" height="0.8" fill="#00e8ff" opacity="0.16"/>
      <rect x="3"  y="68" width="12" height="7" fill="#000010"/>
      <rect x="3"  y="68" width="12" height="7" fill="none" stroke="#00ff88" strokeWidth="0.4"/>
      <text x="9"  y="73"  textAnchor="middle" fontFamily="monospace" fontSize="2"   fill="#00ff88">GUTS</text>
      <rect x="17" y="67" width="13" height="8" fill="#0e0018"/>
      <rect x="17" y="67" width="13" height="8" fill="none" stroke="#aa44ff" strokeWidth="0.4"/>
      <text x="23.5" y="71.5" textAnchor="middle" fontFamily="monospace" fontSize="1.8" fill="#aa44ff">KOENJI</text>
      <text x="23.5" y="73.5" textAnchor="middle" fontFamily="monospace" fontSize="1.5" fill="#774499">QUARTET</text>
      <rect x="32" y="68" width="15" height="7" fill="#140004"/>
      <rect x="32" y="68" width="15" height="7" fill="none" stroke="#ff0088" strokeWidth="0.4"/>
      <text x="39.5" y="72.5" textAnchor="middle" fontFamily="monospace" fontSize="2" fill="#ff0088">LAST TRAIN</text>
      <rect x="49" y="69" width="10" height="6" fill="#090022"/>
      <rect x="49" y="69" width="10" height="6" fill="none" stroke="#4444ff" strokeWidth="0.4"/>
      <text x="54" y="73"    textAnchor="middle" fontFamily="monospace" fontSize="2"   fill="#4444ff">PUNK!</text>

      {/* ─ GRAFFITI + BOTTOM NEON ─ */}
      <text x="5"  y="80" fontFamily="monospace" fontSize="5"   fill="#00e8ff" opacity="0.32">東京</text>
      <text x="25" y="82" fontFamily="monospace" fontSize="3.5" fill="#ff0088" opacity="0.28">♪</text>
      <text x="37" y="80" fontFamily="monospace" fontSize="3"   fill="#8844ff" opacity="0.25">LOUD</text>
      <rect x="3" y="83" width="54" height="4" fill="#020810"/>
      <text x="30" y="86.5" textAnchor="middle" fontFamily="monospace" fontSize="2.8" fill="#00e8ff" opacity="0.92"
        style={{ animation:'neonPulse 3.2s ease-in-out infinite' }}>PLAY IT LOUD</text>

      {/* Right side wall — posters & decorations */}
      <polygon points="258,0 320,0 320,112 258,88" fill="#050a1c"/>
      <rect x="257" y="0" width="3"   height="88" fill="#00e8ff" opacity="0.22"/>
      <rect x="259" y="0" width="1.2" height="88" fill="#00e8ff" opacity="0.9"
        style={{ animation:'neonPulse 4.5s ease-in-out infinite 0.7s' }}/>

      {/* ─ IDOL / CITY POP POSTER (top-right) ─ */}
      <rect x="284" y="3"  width="33" height="42" fill="#060916"/>
      <rect x="284" y="3"  width="33" height="42" fill="none" stroke="#e83898" strokeWidth="0.8"/>
      <rect x="284" y="3"  width="33" height="7"  fill="#bb1870"/>
      <text x="300.5" y="8.5" textAnchor="middle" fontFamily="monospace" fontSize="3.2" fill="#fff">SAKURA</text>
      <text x="300.5" y="12"  textAnchor="middle" fontFamily="monospace" fontSize="2.2" fill="#ffccee">PROJECT</text>
      {/* Cherry blossom petals (8 fixed positions) */}
      <ellipse cx="294.5" cy="21" rx="2.5" ry="1.5" fill="#ff88cc" opacity="0.75"/>
      <ellipse cx="300.5" cy="18" rx="2.5" ry="1.5" fill="#ff88cc" opacity="0.75"/>
      <ellipse cx="306.5" cy="21" rx="2.5" ry="1.5" fill="#ff88cc" opacity="0.75"/>
      <ellipse cx="308.5" cy="27" rx="2.5" ry="1.5" fill="#ffaadd" opacity="0.70"/>
      <ellipse cx="306.5" cy="33" rx="2.5" ry="1.5" fill="#ff88cc" opacity="0.70"/>
      <ellipse cx="300.5" cy="36" rx="2.5" ry="1.5" fill="#ff88cc" opacity="0.75"/>
      <ellipse cx="294.5" cy="33" rx="2.5" ry="1.5" fill="#ffaadd" opacity="0.70"/>
      <ellipse cx="292.5" cy="27" rx="2.5" ry="1.5" fill="#ff88cc" opacity="0.70"/>
      <circle cx="300.5" cy="27" r="3" fill="#ffcc44" opacity="0.85"/>
      <text x="300.5" y="38.5" textAnchor="middle" fontFamily="monospace" fontSize="2.3" fill="#ffbbdd">6 GIRLS × 1 DREAM</text>
      <text x="300.5" y="42"   textAnchor="middle" fontFamily="monospace" fontSize="2"   fill="#774466">WORLD TOUR 2086</text>
      {/* Corner tape */}
      <rect x="283" y="2"  width="6" height="2.5" fill="#f0e0a0" opacity="0.20"/>
      <rect x="310" y="2"  width="6" height="2.5" fill="#f0e0a0" opacity="0.20"/>

      {/* ─ DEBUT ALBUM FLYER (top-left of wall) ─ */}
      <rect x="261" y="3"  width="20" height="25" fill="#030c16"/>
      <rect x="261" y="3"  width="20" height="25" fill="none" stroke="#00ccff" strokeWidth="0.6"/>
      <rect x="261" y="3"  width="20" height="5"  fill="#0077bb"/>
      <text x="271" y="7"    textAnchor="middle" fontFamily="monospace" fontSize="2.5" fill="#fff">AKI</text>
      <text x="271" y="10.5" textAnchor="middle" fontFamily="monospace" fontSize="2"   fill="#44ccff">NOVALINE</text>
      {/* Speaker grid */}
      {[0,1,2,3].flatMap(row => [0,1,2,3,4].map(col => (
        <rect key={`sp-${row}-${col}`} x={263+col*3} y={14+row*2} width="2" height="1.5"
          fill="#00a8d0" opacity={(row+col)%3===0?0.70:0.20}/>
      )))}
      <text x="271" y="25" textAnchor="middle" fontFamily="monospace" fontSize="2" fill="#0088cc">DEBUT ALBUM</text>

      {/* ─ GRAFFITI PANEL (middle) ─ */}
      <rect x="261" y="31" width="56" height="30" fill="#030a18"/>
      <rect x="261" y="31" width="56" height="30" fill="none" stroke="#00e8ff" strokeWidth="0.4" opacity="0.22"/>
      {/* Large ghost text */}
      <text x="289" y="47" textAnchor="middle" fontFamily="monospace" fontSize="11" fill="#00e8ff" opacity="0.11" fontWeight="bold">NOISE</text>
      <text x="289" y="47" textAnchor="middle" fontFamily="monospace" fontSize="11" fill="none"
        stroke="#00e8ff" strokeWidth="0.4" opacity="0.28" fontWeight="bold">NOISE</text>
      {/* Japanese graffiti */}
      <text x="289" y="57" textAnchor="middle" fontFamily="monospace" fontSize="5" fill="#ff0088" opacity="0.38">音楽</text>
      {/* Accent icons */}
      <text x="264" y="41" fontFamily="monospace" fontSize="7"   fill="#ffcc00" opacity="0.26">★</text>
      <text x="305" y="37" fontFamily="monospace" fontSize="4"   fill="#8844ff" opacity="0.36">✦</text>
      <text x="296" y="59" fontFamily="monospace" fontSize="3.5" fill="#00e8ff" opacity="0.20">◆</text>
      {/* Spray dots */}
      {[263,270,277,284,291,298,305,312].map((x,i) => (
        <circle key={`dot-${i}`} cx={x} cy={33+(i*7)%26} r={0.7+(i%3)*0.5}
          fill={['#00e8ff','#ff0088','#8844ff','#ffcc00'][i%4]} opacity="0.26"/>
      ))}

      {/* ─ STICKER STRIP (lower) ─ */}
      <rect x="261" y="64" width="56" height="0.8" fill="#ff0088" opacity="0.14"/>
      <rect x="261" y="67" width="15" height="7" fill="#001808"/>
      <rect x="261" y="67" width="15" height="7" fill="none" stroke="#44ff88" strokeWidth="0.4"/>
      <text x="268.5" y="72"  textAnchor="middle" fontFamily="monospace" fontSize="2.2" fill="#44ff88">SHOYU</text>
      <ellipse cx="289" cy="71" rx="10" ry="4.5" fill="#000014"/>
      <ellipse cx="289" cy="71" rx="10" ry="4.5" fill="none" stroke="#4488ff" strokeWidth="0.5"/>
      <text x="289"   y="72.5" textAnchor="middle" fontFamily="monospace" fontSize="1.8" fill="#4488ff">CONCRETE</text>
      <text x="289"   y="74.5" textAnchor="middle" fontFamily="monospace" fontSize="1.5" fill="#2255cc">CYPHER</text>
      <rect x="302" y="68" width="14" height="7" fill="#180000"/>
      <rect x="302" y="68" width="14" height="7" fill="none" stroke="#ff4444" strokeWidth="0.4"/>
      <text x="309"   y="72.5" textAnchor="middle" fontFamily="monospace" fontSize="2"   fill="#ff4444">LAST RIOT</text>

      {/* ─ GRAFFITI + BOTTOM NEON ─ */}
      <text x="263" y="80" fontFamily="monospace" fontSize="5"   fill="#ff0088" opacity="0.30">東京</text>
      <text x="284" y="82" fontFamily="monospace" fontSize="3.5" fill="#00e8ff" opacity="0.26">♪</text>
      <text x="299" y="80" fontFamily="monospace" fontSize="3"   fill="#ffcc00" opacity="0.30">2086</text>
      <rect x="261" y="83" width="56" height="4" fill="#020810"/>
      <text x="289" y="86.5" textAnchor="middle" fontFamily="monospace" fontSize="2.8" fill="#ff0088" opacity="0.90"
        style={{ animation:'neonPulse2 3.5s ease-in-out infinite 0.5s' }}>MUSIC IS LIFE</text>

      {/* ── BACK WALL — dark plaster texture + music posters ── */}
      <rect x="62" y="0" width="196" height="88" fill="#07091a"/>
      {/* Plaster texture — faint horizontal hairlines */}
      {[7,18,29,41,53,65,77].map(wy => (
        <rect key={wy} x="62" y={wy} width="196" height="0.4" fill="#02040e" opacity="0.75"/>
      ))}
      {/* Subtle vertical panel seams */}
      {[112,162,212].map(wx => (
        <rect key={wx} x={wx} y="0" width="0.5" height="88" fill="#030612" opacity="0.7"/>
      ))}
      {/* Ceiling neon strip */}
      <NeonTube x={64} y={1} w={192} col="#00e8ff" pulseAnim="neonFlick"/>
      {/* Mid-wall neon strip */}
      <NeonTube x={64} y={43} w={192} col="#ff0088" pulseAnim="neonPulse"/>

      {/* ── Music posters ── */}
      <MusicPoster x={66}  y={4}  w={28} h={37} variant={0} accent="#00e8ff"/>
      <MusicPoster x={100} y={6}  w={24} h={33} variant={1} accent="#ff0088"/>
      <MusicPoster x={130} y={3}  w={26} h={38} variant={2} accent="#8844ff"/>
      <MusicPoster x={222} y={5}  w={27} h={36} variant={3} accent="#ff8c00"/>
      <MusicPoster x={243} y={14} w={14} h={24} variant={4} accent="#00e8ff"/>

      {/* EQ strip above counter */}
      <SVGEQStrip x={64} y={56} w={192} h={11}/>

      {/* Counter body */}
      <rect x="62" y="80" width="196" height="9"  fill="#0a0d1e"/>
      <rect x="62" y="80" width="196" height="1"  fill="#00e8ff" opacity="0.84"
        style={{ animation:'neonPulse 4.5s ease-in-out infinite 0.3s' }}/>
      {/* Wood-look counter edge trim */}
      <rect x="62" y="87" width="196" height="3" fill="#2c1a0a"/>
      <rect x="62" y="87" width="196" height="1" fill="#3e2610"/>
      {/* Counter front face */}
      <rect x="62" y="90" width="196" height="17" fill="#07091a"/>
      <rect x="62" y="106" width="196" height="1"  fill="#ff0088" opacity="0.70"
        style={{ animation:'neonPulse 3.8s ease-in-out infinite 1s' }}/>
      {[110,160,210].map(x => <rect key={x} x={x} y="90" width="1" height="17" fill="#00e8ff" opacity="0.12"/>)}

      {/* ── CHECKOUT COUNTER DETAILS ── */}
      {/* Cash register monitor */}
      <rect x="68" y="63" width="24" height="15" fill="#07091c"/>
      <rect x="68" y="63" width="24" height="15" fill="none" stroke="#00e8ff" strokeWidth="0.7" opacity="0.55"/>
      <rect x="69" y="64" width="22" height="10" fill="#020510"/>
      <rect x="70" y="65" width="10" height="1"  fill="#00e8ff" opacity="0.80"/>
      <rect x="70" y="67" width="7"  height="1"  fill="#00e8ff" opacity="0.55"/>
      <rect x="70" y="69" width="13" height="1"  fill="#00ff88" opacity="0.70"/>
      <rect x="77" y="78" width="4"  height="3"  fill="#060810"/>
      <rect x="66" y="80" width="28" height="8"  fill="#080e22"/>
      <rect x="66" y="80" width="28" height="1"  fill="#101c3c"/>
      <rect x="67" y="81" width="16" height="6"  fill="#050810"/>
      {[0,1,2].flatMap((c,ci) => [0,1].map((r,ri) => (
        <rect key={`btn-${ci}-${ri}`} x={68+c*4} y={82+r*2} width="3" height="1.5" fill="#0d1632"/>
      )))}
      <rect x="67" y="86" width="24" height="2" fill="#04060c"/>
      <rect x="73" y="86" width="12" height="2" fill="#060810"/>
      {/* Receipt tape */}
      <rect x="82" y="72" width="4"  height="9" fill="#e0dcc8" opacity="0.70"/>
      <rect x="82" y="72" width="4"  height="2" fill="#eae6d4" opacity="0.85"/>
      {[0,1,2,3,4,5].map(i => (
        <rect key={`rc-${i}`} x={82.5+i*0.55} y={74} width={i%2===0?0.4:0.25} height={6} fill="#1a1a1a" opacity="0.6"/>
      ))}
      {/* Barcode scanner in counter surface */}
      <rect x="110" y="81" width="16" height="5" fill="#050710"/>
      <rect x="110" y="81" width="16" height="5" fill="none" stroke="#1a2040" strokeWidth="0.5"/>
      <rect x="115" y="82" width="6"  height="3" fill="#020408"/>
      <rect x="111" y="83" width="14" height="0.6" fill="#ff2020" opacity="0.65"/>
      {/* "CLOSED" flip sign */}
      <rect x="228" y="91" width="22" height="11" fill="#08091c"/>
      <rect x="228" y="91" width="22" height="11" fill="none" stroke="#ff0088" strokeWidth="0.8" opacity="0.85"/>
      <rect x="230" y="93" width="18" height="1"  fill="#ff0088" opacity="0.75"/>
      <rect x="230" y="95" width="14" height="1"  fill="#ff0088" opacity="0.50"/>
      <rect x="230" y="97" width="16" height="1"  fill="#ff0088" opacity="0.60"/>
      <line x1="232" y1="91" x2="231" y2="88" stroke="#666" strokeWidth="0.6" opacity="0.55"/>
      <line x1="247" y1="91" x2="248" y2="88" stroke="#666" strokeWidth="0.6" opacity="0.55"/>
      {/* Pen/marker holder */}
      <rect x="243" y="72" width="8" height="9" fill="#0b0e20"/>
      <rect x="243" y="72" width="8" height="9" fill="none" stroke="#222840" strokeWidth="0.5"/>
      <rect x="244" y="68" width="1.5" height="5" fill="#cc2010"/>
      <rect x="246" y="67" width="1.5" height="6" fill="#1068c0"/>
      <rect x="248" y="69" width="1.5" height="4" fill="#10a030"/>
      {/* Sticker strips on counter surface */}
      <rect x="100" y="81" width="8" height="2" fill="#1e3060" opacity="0.55"/>
      <rect x="195" y="81" width="6" height="2" fill="#3a1860" opacity="0.50"/>

      {/* ── 16-BIT PIXEL ART SLEEPING SHOPKEEPER ── */}
      {/* One forearm flat on counter as pillow; head tilted cheek-down on it */}
      <g style={{ animation:'sleepBreathe 3.8s ease-in-out infinite', transformOrigin:'157px 76px' }}>

        {/* ZZZ bubbles */}
        <text x="174" y="53" fontFamily="'Press Start 2P',monospace" fontSize="5" fill="#8ab0d8"
          style={{ animation:'zzzRise 4.2s ease-in-out infinite' }}>z</text>
        <text x="182" y="42" fontFamily="'Press Start 2P',monospace" fontSize="7" fill="#6898c0"
          style={{ animation:'zzzRise 4.2s ease-in-out infinite 1.4s' }}>z</text>
        <text x="191" y="29" fontFamily="'Press Start 2P',monospace" fontSize="9" fill="#4880a8"
          style={{ animation:'zzzRise 4.2s ease-in-out infinite 2.8s' }}>Z</text>

        {/* Jacket / shoulders above counter */}
        <rect x="139" y="74" width="36" height="7" fill="#1a2240"/>
        <rect x="139" y="74" width="36" height="1" fill="#242e58"/>

        {/* Forearm flat on counter — the pillow */}
        <rect x="135" y="79" width="44" height="7" fill="#1e2848"/>
        <rect x="135" y="79" width="44" height="1" fill="#283460"/>
        {/* Hand skin at left end */}
        <rect x="135" y="79" width="9"  height="7" fill="#c8904a"/>
        <rect x="135" y="85" width="9"  height="1" fill="#a07038"/>

        {/* HEAD group — rotated ~22° so cheek rests on forearm */}
        <g transform="rotate(-22, 157, 73)">
          {/* Cap crown */}
          <rect x="146" y="51" width="24" height="8"  fill="#0e101e"/>
          <rect x="146" y="51" width="24" height="1"  fill="#1a1c30"/>
          {/* Cap brim */}
          <rect x="144" y="59" width="28" height="3"  fill="#0b0d1a"/>
          <rect x="144" y="59" width="28" height="1"  fill="#141628"/>

          {/* Headphone band */}
          <rect x="148" y="52" width="20" height="2"  fill="#101220"/>
          {/* Left cup */}
          <rect x="142" y="55" width="6"  height="9"  fill="#14162a"/>
          <rect x="143" y="56" width="4"  height="7"  fill="#1c1e36"/>
          <rect x="144" y="58" width="2"  height="3"  fill="#00c8e8" opacity="0.35"/>
          {/* Right cup */}
          <rect x="168" y="55" width="6"  height="9"  fill="#14162a"/>
          <rect x="169" y="56" width="4"  height="7"  fill="#1c1e36"/>
          <rect x="170" y="58" width="2"  height="3"  fill="#00c8e8" opacity="0.35"/>

          {/* Face skin */}
          <rect x="146" y="62" width="24" height="17" fill="#c8904a"/>
          {/* Left cheek shadow */}
          <rect x="146" y="67" width="3"  height="10" fill="#a87038"/>
          {/* Right cheek highlight */}
          <rect x="167" y="67" width="3"  height="10" fill="#d49a54"/>

          {/* Left eye closed */}
          <rect x="151" y="69" width="1"  height="1"  fill="#7a4820"/>
          <rect x="152" y="70" width="4"  height="1"  fill="#7a4820"/>
          <rect x="156" y="69" width="1"  height="1"  fill="#7a4820"/>
          {/* Right eye closed */}
          <rect x="159" y="69" width="1"  height="1"  fill="#7a4820"/>
          <rect x="160" y="70" width="4"  height="1"  fill="#7a4820"/>
          <rect x="164" y="69" width="1"  height="1"  fill="#7a4820"/>
          {/* Nose */}
          <rect x="156" y="66" width="2"  height="1"  fill="#a07030"/>
          {/* Mouth */}
          <rect x="152" y="74" width="9"  height="2"  fill="#884020"/>
          <rect x="153" y="75" width="7"  height="1"  fill="#c06030"/>
          {/* Drool */}
          <rect x="157" y="76" width="2"  height="3"  fill="#6878b0" opacity="0.50"/>
        </g>
      </g>

      {/* Floor */}
      <rect x="0" y="108" width="320" height="72" fill="#020610"/>
      {[108,113,119,126,135,146,159,174].map(wy => (
        <rect key={wy} x="0" y={wy} width="320" height="1" fill="#00e8ff"
          opacity={0.03+(180-wy)/180*0.07}/>
      ))}
      <line x1="160" y1="108" x2="20"  y2="180" stroke="#00e8ff" strokeWidth="1" opacity="0.03"/>
      <line x1="160" y1="108" x2="300" y2="180" stroke="#00e8ff" strokeWidth="1" opacity="0.03"/>
      <rect x="62" y="109" width="196" height="3" fill="#00e8ff" opacity="0.09"/>

      <rect width="320" height="180" fill="url(#rs-cyanBloom)"/>
      <rect width="320" height="180" fill="url(#rs-pinkBloom)"/>
      <rect width="320" height="180" fill="url(#rs-vignT)"/>
      <rect width="320" height="180" fill="url(#rs-vignB)"/>
      <rect x="0"   y="0" width="24"  height="180" fill="#020814" opacity="0.45"/>
      <rect x="296" y="0" width="24"  height="180" fill="#020814" opacity="0.45"/>
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function RecordStore({ onExit }: { onExit: () => void }) {
  const { setTrack } = useMusic();

  const [crateIdx,   setCrateIdx]   = useState(0);
  const [flipDir,    setFlipDir]    = useState<'left' | 'right'>('right');
  const [ttIdx,      setTTIdx]      = useState(0);
  const [hasPlaced,  setHasPlaced]  = useState(false);
  const [isEjecting, setIsEjecting] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setTrack(STORE_AMBIENT);
    return () => { setTrack(TRACK_TITLE); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const flipLeft  = () => { if (isEjecting) return; setFlipDir('left');  setCrateIdx(i => (i - 1 + RECORDS.length) % RECORDS.length); };
  const flipRight = () => { if (isEjecting) return; setFlipDir('right'); setCrateIdx(i => (i + 1) % RECORDS.length); };

  const selectRecord = () => {
    if (isEjecting || crateIdx === ttIdx && hasPlaced) return;
    const next = crateIdx;
    setIsEjecting(true);
    const t1 = window.setTimeout(() => {
      setTTIdx(next);
      setHasPlaced(true);
      if (RECORDS[next].src) setTrack(RECORDS[next].src);
    }, 480);
    const t2 = window.setTimeout(() => setIsEjecting(false), 900);
    timers.current.push(t1, t2);
  };

  // Stable state ref for keyboard handler
  const stateRef = useRef({ isEjecting, crateIdx, ttIdx, hasPlaced });
  useEffect(() => { stateRef.current = { isEjecting, crateIdx, ttIdx, hasPlaced }; });

  // Keyboard: ← → browse records, Enter select, Backspace exit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') { e.preventDefault(); onExit(); return; }
      const { isEjecting: ej, crateIdx: ci, ttIdx: ti, hasPlaced: hp } = stateRef.current;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!ej) { setFlipDir('left'); setCrateIdx(i => (i - 1 + RECORDS.length) % RECORDS.length); }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (!ej) { setFlipDir('right'); setCrateIdx(i => (i + 1) % RECORDS.length); }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (ej || (ci === ti && hp)) return;
        setIsEjecting(true);
        const t1 = window.setTimeout(() => {
          setTTIdx(ci); setHasPlaced(true);
          if (RECORDS[ci].src) setTrack(RECORDS[ci].src);
        }, 480);
        const t2 = window.setTimeout(() => setIsEjecting(false), 900);
        timers.current.push(t1, t2);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMobile    = typeof window !== 'undefined' && window.innerWidth < 768;
  const isNowPlaying = hasPlaced && crateIdx === ttIdx;
  const CoverComp   = COVERS[crateIdx];
  const cyan        = '#00e8ff';
  const canSelect   = !isEjecting && !isNowPlaying;

  const btnLabel = isNowPlaying ? '◉  NOW PLAYING'
                 : isEjecting   ? '→  SENDING...'
                 : '▶  SELECT RECORD';

  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', background:'#020814' }}>
      <style>{ROOM_STYLES}</style>

      <RoomScene ttIdx={ttIdx}/>

      {/* ══════════════════════════════════════════════════════════════════════
          COMBINED ROW: [INLINE TURNTABLE] + [VINYL SELECTOR]
          Centered horizontally, sits in the lower half of the screen.
      ═════════════════════════════════════════════════════════════════════ */}
      <div style={{
        position:'absolute', left:'50%', transform:'translateX(-50%)',
        top: isMobile ? '44%' : '52%',
        display:'flex', flexWrap: isMobile ? 'wrap' : 'nowrap',
        alignItems:'flex-start', gap: isMobile ? 8 : 18,
        width:'min(96vw, 900px)', zIndex:20,
      }}>

        {/* ── Inline turntable ── */}
        <div style={{ flex: isMobile ? '0 0 44%' : '1', minWidth:0 }}>
          <InlineTurntable
            record={hasPlaced ? RECORDS[ttIdx] : null}
            spinning={hasPlaced}
          />
        </div>

        {/* ── Vinyl selector panel ── */}
        <div style={{
          flex: isMobile ? '0 0 calc(56% - 8px)' : '1', minWidth:0, background:'rgba(3,8,22,0.97)',
          border:'1px solid rgba(0,232,255,0.22)',
          boxShadow:'0 0 30px rgba(0,0,0,0.9)',
          padding:'5px 6px 6px',
        }}>

          {/* Header */}
          <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            borderBottom:'1px solid rgba(0,232,255,0.10)', paddingBottom:3, marginBottom:4,
          }}>
            <span style={{ ...PX, fontSize: 9, color:'#00c8e8', letterSpacing:'0.1em', textShadow:'0 0 8px rgba(0,200,232,0.5)' }}>VINYL SELECTOR</span>
            <span style={{ ...PX, fontSize: 8, color:'#00889a' }}>{crateIdx+1}/{RECORDS.length}</span>
          </div>

          {/* Nav row: prev + sleeve + next */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>

            <button className="rs-btn" onClick={flipLeft} disabled={isEjecting} style={{
              ...PX, background: isEjecting ? 'transparent' : 'rgba(0,200,232,0.08)',
              border: `1.5px solid ${isEjecting ? 'rgba(0,232,255,0.08)' : 'rgba(0,232,255,0.55)'}`,
              color: isEjecting ? '#1a3040' : '#00e8ff',
              fontSize: 16, padding:'6px 8px', cursor:'none', flexShrink:0, lineHeight:1,
              boxShadow: isEjecting ? 'none' : '0 0 8px rgba(0,232,255,0.2)',
              transition:'all 0.2s',
            }}>◄</button>

            <div style={{ flex:1, position:'relative' }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={crateIdx}
                  initial={{ x: flipDir==='right' ? 30 : -30, opacity:0 }}
                  animate={{ x:0, opacity:1 }}
                  exit={{ x: flipDir==='right' ? -30 : 30, opacity:0 }}
                  transition={{ duration:0.15, ease:'easeOut' }}
                  style={{ position:'relative' }}>

                  {/* Sleeve + disc peek wrapper */}
                  <div style={{ position:'relative', paddingTop:'26%' }}>
                    {/* Vinyl disc peeking from behind sleeve */}
                    {!isEjecting && (
                      <div style={{
                        position:'absolute', top:0, left:'4%',
                        width:'92%', aspectRatio:'1', zIndex:1, opacity:0.80, pointerEvents:'none',
                      }}>
                        <VinylDisc record={RECORDS[crateIdx]} spinning={false}/>
                      </div>
                    )}

                    {/* Eject animation */}
                    <AnimatePresence>
                      {isEjecting && (
                        <motion.div
                          key={`eject-${crateIdx}`}
                          initial={{ x:0, y:0, rotate:0, scale:1, opacity:1 }}
                          animate={{ x:-320, y:-240, rotate:-40, scale:0.2, opacity:0 }}
                          transition={{ duration:0.52, ease:[0.3, 0, 0.85, 0.2] }}
                          style={{
                            position:'absolute', top:0, left:'4%',
                            width:'92%', aspectRatio:'1', zIndex:50, pointerEvents:'none',
                          }}
                        >
                          <VinylDisc record={RECORDS[crateIdx]} spinning/>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Album sleeve */}
                    <div style={{
                      position:'relative', zIndex:2, aspectRatio:'1',
                      border: isNowPlaying
                        ? `2px solid ${RECORDS[crateIdx].label}`
                        : '2px solid rgba(0,232,255,0.12)',
                      boxShadow: isNowPlaying
                        ? `0 0 16px ${RECORDS[crateIdx].label}88`
                        : '0 4px 18px rgba(0,0,0,0.7)',
                      imageRendering:'pixelated', overflow:'hidden',
                      transition:'border-color .25s, box-shadow .25s',
                    }}>
                      <CoverComp/>
                      {isNowPlaying && (
                        <div style={{ position:'absolute', top:4, right:4, background:cyan, padding:'1px 3px' }}>
                          <span style={{ ...PX, fontSize:'0.18rem', color:'#020814' }}>◉ NOW</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Track info */}
                  <div style={{ marginTop:4, textAlign:'center' }}>
                    <div style={{
                      ...PX, fontSize:'0.20rem', color:'#c0d4f0',
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:2,
                    }}>{RECORDS[crateIdx].title}</div>
                    <div style={{
                      ...PX, fontSize:'0.16rem', color:'#2a4060',
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    }}>{RECORDS[crateIdx].artist}</div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <button className="rs-btn" onClick={flipRight} disabled={isEjecting} style={{
              ...PX, background: isEjecting ? 'transparent' : 'rgba(0,200,232,0.08)',
              border: `1.5px solid ${isEjecting ? 'rgba(0,232,255,0.08)' : 'rgba(0,232,255,0.55)'}`,
              color: isEjecting ? '#1a3040' : '#00e8ff',
              fontSize: 16, padding:'6px 8px', cursor:'none', flexShrink:0, lineHeight:1,
              boxShadow: isEjecting ? 'none' : '0 0 8px rgba(0,232,255,0.2)',
              transition:'all 0.2s',
            }}>►</button>
          </div>

          {/* Keyboard hint */}
          <div style={{ textAlign:'center', padding:'3px 0 1px' }}>
            <span style={{ ...PX, fontSize: 7, color:'#006070', letterSpacing:'0.08em' }}>← → BROWSE  •  ENTER SELECT</span>
          </div>

          {/* Track dots */}
          <div style={{ display:'flex', justifyContent:'center', gap:4, margin:'3px 0 5px' }}>
            {RECORDS.map((r,i) => (
              <div key={i} onClick={() => { if (!isEjecting) setCrateIdx(i); }} style={{
                width:4, height:4, borderRadius:'50%', cursor:'none',
                background: i===crateIdx ? cyan : i===ttIdx && hasPlaced ? r.label : 'rgba(255,255,255,0.07)',
                border:`1px solid ${i===ttIdx && hasPlaced ? r.label : 'rgba(255,255,255,0.12)'}`,
                boxShadow: i===crateIdx ? `0 0 5px ${cyan}` : 'none',
                transition:'background .2s',
              }}/>
            ))}
          </div>

          {/* SELECT button */}
          <button
            className="rs-sel"
            onClick={selectRecord}
            disabled={!canSelect}
            style={{
              ...PX, width:'100%', padding:'8px 0',
              background: isNowPlaying ? `rgba(0,232,255,0.10)` : canSelect ? `rgba(0,232,255,0.16)` : 'rgba(68,24,128,0.3)',
              border: `2px solid ${isNowPlaying ? cyan : canSelect ? 'rgba(0,232,255,0.75)' : '#552090'}`,
              color: isNowPlaying ? cyan : isEjecting ? '#aa66ff' : '#00d8f4',
              fontSize: 10, letterSpacing:'0.12em', cursor: canSelect ? 'none' : 'default',
              boxShadow: isNowPlaying ? `0 0 20px ${cyan}55` : canSelect ? '0 0 12px rgba(0,200,232,0.25)' : 'none',
              textShadow: canSelect && !isNowPlaying ? '0 0 10px rgba(0,220,244,0.6)' : 'none',
              transition:'all .25s', opacity: isEjecting ? 0.75 : 1,
            }}
          >{btnLabel}</button>
        </div>

        {/* ── Track info panel ── */}
        <div style={{
          flex: isMobile ? '0 0 100%' : '0 0 320px',
          background: 'rgba(3,8,22,0.97)',
          border: '1px solid rgba(0,232,255,0.18)',
          boxShadow: '0 0 30px rgba(0,0,0,0.9)',
          padding: isMobile ? '10px 12px' : '18px 20px',
          display: 'flex', flexDirection: isMobile ? 'row' : 'column',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          justifyContent: isMobile ? 'flex-start' : 'center',
          alignItems: isMobile ? 'center' : 'stretch',
          gap: isMobile ? 8 : 0,
          minHeight: isMobile ? 0 : 210, alignSelf: 'stretch',
        }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={crateIdx}
              initial={{ opacity: 0, y: flipDir === 'right' ? 14 : -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: flipDir === 'right' ? -14 : 14 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {/* Genre chip + instrumental tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  ...PX, fontSize: isMobile ? '8px' : '11px',
                  color: GENRE_COLORS[RECORDS[crateIdx].genre],
                  border: `1.5px solid ${GENRE_COLORS[RECORDS[crateIdx].genre]}`,
                  padding: isMobile ? '2px 6px' : '4px 9px', letterSpacing: '0.08em',
                  boxShadow: `0 0 10px ${GENRE_COLORS[RECORDS[crateIdx].genre]}55`,
                }}>{RECORDS[crateIdx].genre}</span>
                <span style={{
                  ...PX, fontSize: isMobile ? '7px' : '9px',
                  color: RECORDS[crateIdx].instrumental ? '#44e844' : '#e84444',
                  border: `1px solid ${RECORDS[crateIdx].instrumental ? '#44e84488' : '#e8444488'}`,
                  padding: isMobile ? '2px 5px' : '3px 7px', letterSpacing: '0.06em',
                }}>
                  {RECORDS[crateIdx].instrumental ? '♪ INSTR.' : '🎤 VOCAL'}
                </span>
              </div>

              {/* Divider — hidden on mobile to save space */}
              {!isMobile && <div style={{ height: 1, background: 'rgba(0,232,255,0.12)' }}/>}

              {/* Title */}
              <div style={{
                ...PX, fontSize: isMobile ? '9px' : '15px', color: '#ddeeff',
                lineHeight: isMobile ? 1.4 : 1.9, letterSpacing: '0.03em',
                maxWidth: isMobile ? '100%' : undefined,
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: isMobile ? 'nowrap' : 'normal',
              }}>{RECORDS[crateIdx].title}</div>

              {/* Artist */}
              <div style={{
                ...PX, fontSize: isMobile ? '7px' : '10px', color: '#3a80a0',
                letterSpacing: '0.06em',
              }}>by {RECORDS[crateIdx].artist}</div>

              {/* Now playing indicator */}
              {isNowPlaying && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: isMobile ? 6 : 8, height: isMobile ? 6 : 8, borderRadius: '50%',
                    background: cyan, boxShadow: `0 0 8px ${cyan}`,
                    animation: 'neonPulse 1.2s ease-in-out infinite', flexShrink: 0,
                  }}/>
                  <span style={{ ...PX, fontSize: isMobile ? '7px' : '9px', color: cyan, letterSpacing: '0.10em' }}>
                    NOW PLAYING
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Back button */}
      <div style={{ position:'absolute', top:14, left:14, zIndex:40, display:'flex', flexDirection:'column', gap:4, alignItems:'flex-start' }}>
        <button className="rs-btn" onClick={onExit} style={{
          ...PX, background:'rgba(2,8,20,0.92)', border:`2px solid ${cyan}88`,
          color:cyan, fontSize: 9, padding:'7px 11px',
          cursor:'none', boxShadow:`0 0 10px ${cyan}44`, letterSpacing:'0.06em',
        }}>← MAP</button>
        <span style={{ ...PX, fontSize:6, color:`${cyan}55`, letterSpacing:'0.06em' }}>BACKSPACE EXIT</span>
      </div>
    </div>
  );
}
