import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelCity } from './PixelCity';
import { useNavigate } from 'react-router';
import { PixelCharacter } from './PixelCharacter';

// ─── Category order for keyboard navigation ───────────────────────────────────
const CATEGORIES = ['style', 'gender', 'hair', 'hairColor', 'skin'] as const;
type Category = typeof CATEGORIES[number];

export function CharacterCustomization() {
  const [style, setStyle] = useState('STREETWEAR');
  const [hair, setHair] = useState('SPIKY');
  const [hairColor, setHairColor] = useState('#4a3020'); // Default Brown
  const [gender, setGender] = useState('NEUTRAL');
  const [skin, setSkin] = useState('#ffdbac'); // Default light skin
  const [isExiting, setIsExiting] = useState(false);
  // Which category keyboard is currently editing
  const [focusCatIdx, setFocusCatIdx] = useState(0);
  const navigate = useNavigate();

  const styles = ['STREETWEAR', 'SCHOOL', 'VINTAGE', 'TECHWEAR'];
  const hairs = ['SHORT', 'LONG', 'SPIKY', 'BEANIE'];
  const skins = ['#ffdbac', '#e0ac69', '#8d5524', '#3c2e28']; // Light, Tan, Brown, Dark
  const genders = ['MASC', 'FEM', 'NEUTRAL'];
  
  const hairColors = [
    { name: 'Black', value: '#1a1a1a' },
    { name: 'Brown', value: '#4a3020' },
    { name: 'Blonde', value: '#eebb44' },
    { name: 'Red', value: '#cc4422' },
    { name: 'White', value: '#dddddd' },
    { name: 'Blue', value: '#4488ff' },
    { name: 'Pink', value: '#ff66aa' },
    { name: 'Green', value: '#44cc44' },
  ];

  // Use a ref so the keyboard handler always reads fresh state without re-registering
  const stateRef = useRef({ style, hair, hairColor, gender, skin, focusCatIdx, styles, hairs, skins, genders, hairColors });
  useEffect(() => { stateRef.current = { style, hair, hairColor, gender, skin, focusCatIdx, styles, hairs, skins, genders, hairColors }; });

  // ── Keyboard navigation ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = stateRef.current;
      // Left / Right (or A / D) — switch active category
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setFocusCatIdx(i => (i - 1 + CATEGORIES.length) % CATEGORIES.length);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setFocusCatIdx(i => (i + 1) % CATEGORIES.length);
        return;
      }
      // Up / Down (or W / S) — cycle options within active category
      const cat: Category = CATEGORIES[s.focusCatIdx];
      let options: string[] = [];
      let currentVal = '';
      let setter: (v: string) => void = () => {};
      switch (cat) {
        case 'style':     options = s.styles;                     currentVal = s.style;     setter = setStyle;     break;
        case 'gender':    options = s.genders;                    currentVal = s.gender;    setter = setGender;    break;
        case 'hair':      options = s.hairs;                      currentVal = s.hair;      setter = setHair;      break;
        case 'hairColor': options = s.hairColors.map(c => c.value); currentVal = s.hairColor; setter = setHairColor; break;
        case 'skin':      options = s.skins;                      currentVal = s.skin;      setter = setSkin;      break;
      }
      const idx = options.indexOf(currentVal);
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (idx > 0) setter(options[idx - 1]);
        else setter(options[options.length - 1]); // wrap around
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (idx < options.length - 1) setter(options[idx + 1]);
        else setter(options[0]); // wrap around
      } else if (e.key === 'Enter') {
        // Read fresh values from ref — the stale closure would capture only initial defaults
        const { style: st, hair: hr, hairColor: hc, gender: gn, skin: sk } = stateRef.current;
        setIsExiting(true);
        localStorage.setItem('to_character', JSON.stringify({ style: st, hair: hr, hairColor: hc, gender: gn, skin: sk }));
        setTimeout(() => {
          navigate('/city', { state: { character: { style: st, hair: hr, hairColor: hc, gender: gn, skin: sk } } });
        }, 600);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnterCity = () => {
    setIsExiting(true);
    // Save to localStorage for persistence
    localStorage.setItem('to_character', JSON.stringify({ style, hair, hairColor, gender, skin }));
    
    // Wait for fade out animation
    setTimeout(() => {
        navigate('/city', { 
            state: { 
                character: { style, hair, hairColor, gender, skin } 
            } 
        });
    }, 600);
  };

  const focusCat: Category = CATEGORIES[focusCatIdx];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans text-white select-none">
      {/* Background - Dimmed City */}
      <div className="absolute inset-0 z-0 opacity-30 blur-sm scale-105 pointer-events-none">
         <PixelCity />
      </div>
      
      {/* Dark Overlay to further dim and unify */}
      <div className="absolute inset-0 z-10 bg-[#050510]/70" />

      {/* Main Content — scrollable on mobile so all panels are reachable */}
      <div className="relative z-20 w-full h-full flex flex-col items-center py-6 md:py-12 overflow-y-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 md:mb-10 text-center"
        >
          <h1 
            className="text-xl md:text-5xl text-cyan-300 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] tracking-widest"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            WHO ARE YOU?
          </h1>
          <div className="h-1 w-24 md:w-48 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto mt-4"></div>

          {/* ── Category nav indicator ── */}
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap px-4">
            {CATEGORIES.map((cat, i) => {
              const labels: Record<Category, string> = { style: 'STYLE', gender: 'GENDER', hair: 'HAIR', hairColor: 'COLOR', skin: 'SKIN' };
              const colors: Record<Category, string> = { style: '#ff00ff', gender: '#ff66aa', hair: '#00ffff', hairColor: '#44ffdd', skin: '#ffaa44' };
              const active = i === focusCatIdx;
              return (
                <button
                  key={cat}
                  onClick={() => setFocusCatIdx(i)}
                  className="text-[8px] px-2 py-1 border transition-all duration-150"
                  style={{
                    fontFamily: '"Press Start 2P"',
                    borderColor: active ? colors[cat] : 'rgba(255,255,255,0.15)',
                    color: active ? colors[cat] : 'rgba(255,255,255,0.35)',
                    background: active ? `${colors[cat]}18` : 'transparent',
                    boxShadow: active ? `0 0 8px ${colors[cat]}55` : 'none',
                  }}
                >
                  {labels[cat]}
                </button>
              );
            })}
          </div>
          {/* Keyboard hint */}
          <div className="mt-2 text-[7px] text-white/30 hidden md:flex items-center justify-center gap-3" style={{ fontFamily: '"Press Start 2P"' }}>
            <span>← → / A D  SWITCH</span>
            <span className="text-white/15">•</span>
            <span>↑ ↓ / W S  CHANGE</span>
            <span className="text-white/15">•</span>
            <span>ENTER  CONFIRM</span>
          </div>
        </motion.div>

        {/* Center Section: Panels + Character */}
        <div className="flex flex-col md:flex-row w-full max-w-6xl items-center justify-center gap-5 md:gap-16 px-4 flex-1">
            
            {/* Left Panel: STYLE */}
            <Panel title="STYLE" side="left" highlight={focusCat === 'style' || focusCat === 'gender'}>
               <div className={`flex flex-col gap-3 rounded transition-all duration-150 ${focusCat === 'style' ? 'ring-1 ring-[#ff00ff]/40 p-1' : 'p-1'}`}>
                 {styles.map((s) => (
                    <OptionButton 
                       key={s} 
                       label={s} 
                       selected={style === s} 
                       onClick={() => setStyle(s)} 
                       color="#ff00ff"
                    />
                 ))}
               </div>
               
               <div className={`mt-6 border-t-2 border-white/10 pt-4 rounded transition-all duration-150 ${focusCat === 'gender' ? 'ring-1 ring-[#ff66aa]/40 p-1' : 'p-1'}`}>
                 <p className="text-[10px] mb-3 text-pink-200 opacity-80" style={{ fontFamily: '"Press Start 2P"' }}>GENDER EXPRESSION</p>
                 <div className="flex gap-2">
                    {genders.map((g) => (
                        <button
                          key={g}
                          onClick={() => setGender(g)}
                          className={`flex-1 py-2 text-[10px] border transition-all duration-200 ${gender === g ? 'bg-pink-500 border-white text-white shadow-[0_0_8px_#ff00ff]' : 'bg-black/40 border-pink-900/50 text-pink-300/50 hover:bg-pink-900/30'}`}
                          style={{ fontFamily: '"Press Start 2P"' }}
                        >
                            {g}
                        </button>
                    ))}
                 </div>
               </div>
            </Panel>

            {/* Character Preview */}
            <div className="relative flex flex-col items-center justify-center order-first md:order-none mb-8 md:mb-0">
               <div className="relative w-36 h-48 md:w-64 md:h-80 flex items-center justify-center">
                  {/* Spotlight/Glow behind character */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-black/60 blur-md rounded-full"></div>
                  
                  {/* The Character SVG */}
                  <div className="relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform duration-300 hover:scale-105">
                     <PixelCharacter 
                        style={style} 
                        hair={hair} 
                        hairColor={hairColor}
                        gender={gender} 
                        skin={skin} 
                        scale={8}
                     />
                  </div>
               </div>
               
               {/* Character Name/Role (Flavor text) */}
               <motion.div 
                 key={style + gender}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mt-4 text-center"
               >
                 <div className="text-xs text-gray-400 mb-1" style={{ fontFamily: '"Press Start 2P"' }}>ROLE</div>
                 <div className="text-sm md:text-base text-white" style={{ fontFamily: '"Press Start 2P"' }}>
                   {style === 'STREETWEAR' ? (gender === 'FEM' ? 'URBAN GRAFFITI ARTIST' : gender === 'MASC' ? 'STREET RACER' : 'PARKOUR RUNNER') : 
                    style === 'SCHOOL' ? (gender === 'FEM' ? 'CLASS REP' : gender === 'MASC' ? 'DELINQUENT' : 'PRODIGY') : 
                    style === 'VINTAGE' ? (gender === 'FEM' ? 'JAZZ SINGER' : gender === 'MASC' ? 'DETECTIVE' : 'TIME TRAVELER') : 
                    (gender === 'FEM' ? 'ANDROID' : gender === 'MASC' ? 'MERCENARY' : 'NETRUNNER')}
                 </div>
               </motion.div>
            </div>

            {/* Right Panel: HAIR */}
            <Panel title="HAIR" side="right" highlight={focusCat === 'hair' || focusCat === 'hairColor' || focusCat === 'skin'}>
                <div className={`flex flex-col gap-3 rounded transition-all duration-150 ${focusCat === 'hair' ? 'ring-1 ring-[#00ffff]/40 p-1' : 'p-1'}`}>
                 {hairs.map((h) => (
                    <OptionButton 
                       key={h} 
                       label={h} 
                       selected={hair === h} 
                       onClick={() => setHair(h)} 
                       color="#00ffff"
                    />
                 ))}
               </div>

               {/* Hair Color */}
               <div className={`mt-4 pt-2 rounded transition-all duration-150 ${focusCat === 'hairColor' ? 'ring-1 ring-[#44ffdd]/40 p-1' : 'p-1'}`}>
                 <p className="text-[10px] mb-2 text-cyan-200 opacity-80" style={{ fontFamily: '"Press Start 2P"' }}>COLOR</p>
                 <div className="grid grid-cols-4 gap-2">
                    {hairColors.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => setHairColor(c.value)}
                          className={`w-full aspect-square border-2 transition-all duration-200 ${hairColor === c.value ? 'border-white scale-110 shadow-[0_0_8px_white]' : 'border-gray-600 hover:scale-105'}`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                    ))}
                 </div>
               </div>

               <div className={`mt-6 border-t-2 border-white/10 pt-4 rounded transition-all duration-150 ${focusCat === 'skin' ? 'ring-1 ring-[#ffaa44]/40 p-1' : 'p-1'}`}>
                 <p className="text-[10px] mb-3 text-cyan-200 opacity-80" style={{ fontFamily: '"Press Start 2P"' }}>SKIN TONE</p>
                 <div className="flex gap-3 justify-between px-1">
                    {skins.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSkin(s)}
                          className={`w-8 h-8 border-2 transition-all duration-200 shadow-lg ${skin === s ? 'border-white scale-110 shadow-[0_0_10px_white] ring-2 ring-white/20' : 'border-gray-600 hover:border-gray-400 hover:scale-105'}`}
                          style={{ backgroundColor: s }}
                          aria-label="Select skin tone"
                        />
                    ))}
                 </div>
               </div>
            </Panel>
        </div>

        {/* Bottom Button */}
        <div className="mt-6 md:mt-0 mb-4">
          <button onClick={handleEnterCity} className="group relative inline-block">
             <div 
               className="relative z-10 text-sm md:text-xl text-yellow-400 bg-black px-10 py-5 border-4 border-white transition-all duration-100 group-hover:scale-105 group-active:scale-95 cursor-pointer flex items-center gap-4"
               style={{ 
                   fontFamily: '"Press Start 2P", monospace',
                   boxShadow: '6px 6px 0px rgba(0,255,255,0.4)'
               }}
             >
                <span>[ ENTER THE CITY ]</span>
                <motion.span 
                  animate={{ x: [0, 5, 0] }} 
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >►</motion.span>
             </div>
             {/* Glow behind button */}
             <div className="absolute inset-0 bg-yellow-400/20 blur-xl group-hover:bg-yellow-400/40 transition-all duration-300 -z-10"></div>
          </button>
        </div>
      </div>
      
      {/* Scanlines Overlay */}
      <div className="absolute inset-0 pointer-events-none z-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))]" style={{ backgroundSize: "100% 3px, 3px 100%" }} />

      {/* Black Flash Transition Overlay */}
      <AnimatePresence>
        {isExiting && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 z-50 bg-black"
            />
        )}
      </AnimatePresence>
    </div>
  );
}

function Panel({ title, children, side, highlight }: { title: string, children: React.ReactNode, side: 'left' | 'right', highlight?: boolean }) {
    const borderColor = side === 'left' ? '#ff00ff' : '#00ffff';
    
    return (
        <motion.div 
           initial={{ x: side === 'left' ? -50 : 50, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
           className="flex flex-col bg-[#050510]/90 p-6 w-full md:w-[280px] border-2 backdrop-blur-md relative overflow-hidden transition-all duration-200"
           style={{ 
               borderColor: highlight ? borderColor : `${borderColor}66`,
               boxShadow: highlight
                 ? `0 0 28px ${borderColor}44, inset 0 0 30px ${borderColor}18`
                 : `0 0 20px ${borderColor}20, inset 0 0 30px ${borderColor}10`,
           }}
        >
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-2 h-2 bg-white"></div>
            <div className="absolute top-0 right-0 w-2 h-2 bg-white"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-white"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-white"></div>

            <h2 className="text-lg md:text-xl mb-6 text-center border-b-2 pb-3 tracking-wider" 
                style={{ 
                    fontFamily: '"Press Start 2P"', 
                    color: borderColor,
                    borderColor: borderColor,
                    textShadow: `0 0 8px ${borderColor}`
                }}>
                {title}
            </h2>
            {children}
        </motion.div>
    );
}

function OptionButton({ label, selected, onClick, color }: { label: string, selected: boolean, onClick: () => void, color: string }) {
    return (
        <button 
           onClick={onClick}
           className={`w-full py-4 px-4 text-[10px] md:text-xs text-left transition-all duration-200 border-l-4 flex justify-between items-center group relative overflow-hidden ${selected ? 'bg-white/10 pl-6' : 'hover:bg-white/5 hover:pl-5'}`}
           style={{ 
               fontFamily: '"Press Start 2P"',
               borderColor: selected ? color : 'transparent',
               color: selected ? '#fff' : '#888'
           }}
        >
            <span className="relative z-10">{label}</span>
            {selected && (
                <motion.span 
                    layoutId={`cursor-${color}`}
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -z-0" 
                />
            )}
            {selected && <span className="text-[8px] animate-pulse" style={{ color }}>◀</span>}
        </button>
    )
}