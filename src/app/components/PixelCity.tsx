import { motion } from 'motion/react';
import { useMemo } from 'react';

// Seeded PRNG — deterministic city generation across renders
function mkRng(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}

// Clip-path shapes for far-bg silhouette buildings
const FAR_CLIPS: Record<string, string> = {
  flat:    'polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)',
  classic: 'polygon(0% 100%, 100% 100%, 100% 20%, 84% 20%, 84% 0%, 16% 0%, 16% 20%, 0% 20%)',
  spire:   'polygon(0% 100%, 100% 100%, 100% 28%, 56% 0%, 44% 0%, 0% 28%)',
  tiered:  'polygon(0% 100%, 100% 100%, 100% 55%, 76% 55%, 76% 30%, 54% 30%, 54% 0%, 46% 0%, 46% 30%, 24% 30%, 24% 55%, 0% 55%)',
  crown:   'polygon(0% 100%, 100% 100%, 100% 16%, 80% 16%, 80% 5%, 62% 5%, 62% 16%, 38% 16%, 38% 5%, 20% 5%, 20% 16%, 0% 16%)',
  stepped: 'polygon(0% 100%, 100% 100%, 100% 40%, 66% 40%, 66% 0%, 0% 0%)',
  wedge:   'polygon(0% 100%, 100% 100%, 100% 6%, 0% 42%)',
  dome:    'polygon(0% 100%, 100% 100%, 100% 22%, 80% 10%, 60% 2%, 50% 0%, 40% 2%, 20% 10%, 0% 22%)',
  antenna: 'polygon(0% 100%, 100% 100%, 100% 12%, 53% 12%, 53% 0%, 47% 0%, 47% 12%, 0% 12%)',
};
const FAR_NEONS = ['#ff00ff','#00ffff','#ff3366','#44ff88','#ffaa00','#7744ff','#ff6600','#00aaff'];
const FAR_WIN_COLS = ['#ffcc44','#88ccff','#ffaa66','#ccffcc'];

export function PixelCity() {
  // Cloud animation logic
  const clouds = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    y: 5 + Math.random() * 30,
    x: Math.random() * 100,
    width: 60 + Math.random() * 120,
    duration: 30 + Math.random() * 20,
    delay: Math.random() * -20,
    opacity: 0.1 + Math.random() * 0.2,
    scaleDuration: 10 + Math.random() * 10
  })), []);

  // Far background skyline — deterministic shaped silhouettes
  const farBldgs = useMemo(() => {
    const rng = mkRng(1337);
    const SHAPES = Object.keys(FAR_CLIPS);
    return Array.from({ length: 34 }).map((_, i) => {
      const shape = SHAPES[Math.floor(rng() * SHAPES.length)];
      const h = 100 + rng() * 220;   // px
      const w = 42  + rng() * 88;    // px
      const neonC = FAR_NEONS[Math.floor(rng() * FAR_NEONS.length)];
      const hasNeon = rng() > 0.52;
      const hasAircraftLight = h > 160 && rng() > 0.38;
      const aircraftDelay = rng() * 4;
      // Scattered lit windows (tiny dots inside building shape)
      const winCount = Math.floor(rng() * 6);
      const wins = Array.from({ length: winCount }).map(() => ({
        x: 8 + rng() * 80,   // % left
        y: 12 + rng() * 65,  // % top
        col: FAR_WIN_COLS[Math.floor(rng() * FAR_WIN_COLS.length)],
        size: rng() > 0.6 ? 3 : 2,
      }));
      return { shape, h, w, neonC, hasNeon, hasAircraftLight, aircraftDelay, wins };
    });
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0a0a2a]">
      {/* Sky gradient — richer deep-indigo to purple-magenta */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #06061e 0%, #14134a 45%, #2d1a5e 72%, #4a1e6e 100%)' }} />
      {/* Subtle aurora shimmer band */}
      <motion.div className="absolute pointer-events-none"
        style={{ top: '18%', left: 0, right: 0, height: 120,
          background: 'linear-gradient(to bottom, transparent, rgba(120,40,200,0.09) 40%, rgba(60,180,200,0.06) 70%, transparent)',
          filter: 'blur(18px)' }}
        animate={{ opacity: [0.4, 0.9, 0.4], scaleX: [1, 1.04, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Moon — large, soft, with two glow rings */}
      <div className="absolute top-8 left-[28%] w-36 h-36 z-0">
        <div className="w-full h-full bg-[#fffff8] rounded-full shadow-[0_0_80px_rgba(255,255,240,0.55)] blur-[1px]" />
        <div className="absolute inset-[-30%] rounded-full bg-white/8 blur-2xl -z-10" />
        <div className="absolute inset-[-55%] rounded-full bg-white/4 blur-3xl -z-10" />
        {/* Crater details */}
        <div className="absolute top-[28%] left-[22%] w-[12%] h-[10%] rounded-full bg-black/8" />
        <div className="absolute top-[50%] left-[55%] w-[9%] h-[8%] rounded-full bg-black/6" />
      </div>

      {/* Clouds */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {clouds.map((cloud) => (
          <motion.div
            key={cloud.id}
            className="absolute bg-purple-200 blur-md rounded-full"
            style={{ 
              top: `${cloud.y}%`, 
              left: `${cloud.x}%`,
              height: '40px', 
              width: `${cloud.width}px`,
              opacity: cloud.opacity
            }}
            animate={{ 
                x: ['-10%', '10%'],
                scale: [1, 1.1, 1],
                y: [0, -10, 0] // Gentle bobbing
            }}
            transition={{ 
              x: {
                repeat: Infinity, 
                repeatType: "reverse",
                duration: cloud.duration, 
                ease: "easeInOut",
                delay: cloud.delay
              },
              scale: {
                repeat: Infinity,
                duration: cloud.scaleDuration,
                ease: "easeInOut"
              },
              y: {
                repeat: Infinity,
                duration: cloud.scaleDuration * 1.5,
                ease: "easeInOut"
              }
            }}
          />
        ))}
      </div>

      {/* Shooting Star */}
      <ShootingStar />

      {/* Far Background Buildings (Silhouette) — shaped skyline */}
      <div className="absolute bottom-32 left-0 right-0 h-[420px] flex items-end z-0 overflow-visible" style={{ gap: 3, paddingLeft: 4 }}>
        {farBldgs.map((bldg, i) => {
          const { shape, h, w, neonC, hasNeon, hasAircraftLight, aircraftDelay, wins } = bldg;
          return (
            <div key={`far-${i}`} className="relative flex-shrink-0" style={{ height: h, width: w }}>
              {/* Shaped building body */}
              <div className="absolute inset-0" style={{ clipPath: FAR_CLIPS[shape] }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0e0e24 0%, #050512 100%)' }} />
                {/* Subtle horizontal facade lines */}
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 8px)' }} />
                {/* Neon roofline band */}
                {hasNeon && (
                  <div className="absolute top-0 left-0 right-0 h-[3px]"
                    style={{ background: neonC, opacity: 0.9, boxShadow: `0 0 6px ${neonC}` }} />
                )}
                {/* Lit windows — tiny glowing dots */}
                {wins.map((win, j) => (
                  <div key={j} className="absolute"
                    style={{
                      left: `${win.x}%`, top: `${win.y}%`,
                      width: win.size, height: win.size,
                      backgroundColor: win.col,
                      borderRadius: 1,
                      boxShadow: `0 0 ${win.size + 2}px ${win.col}99`,
                    }} />
                ))}
              </div>

              {/* Aircraft warning light — above clip boundary */}
              {hasAircraftLight && (
                <motion.div
                  className="absolute w-[4px] h-[4px] rounded-full bg-red-500 left-1/2 -translate-x-1/2"
                  style={{ top: -4 }}
                  animate={{ opacity: [0, 1, 0], boxShadow: ['0 0 0px red', '0 0 8px red, 0 0 14px red', '0 0 0px red'] }}
                  transition={{ duration: 1.6, repeat: Infinity, times: [0, 0.08, 1], repeatDelay: aircraftDelay }}
                />
              )}

              {/* Neon bloom above roof */}
              {hasNeon && (
                <div className="absolute left-0 right-0 pointer-events-none"
                  style={{ top: -8, height: 20, background: `radial-gradient(ellipse at center, ${neonC}55 0%, transparent 70%)`, filter: 'blur(5px)' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* City-glow horizon band */}
      <div className="absolute pointer-events-none z-0"
        style={{ bottom: '30%', left: 0, right: 0, height: 140,
          background: 'linear-gradient(to top, rgba(90,10,140,0.22) 0%, rgba(50,5,90,0.08) 60%, transparent 100%)',
          filter: 'blur(10px)' }} />

      {/* Train Bridge / Monorail (Mid-ground) */}
      <div className="absolute bottom-[35vh] left-0 w-full h-6 bg-[#0a0a20] z-0 opacity-90 border-t-2 border-b-2 border-black flex items-center overflow-visible">
         {/* Bridge Supports/Pillars */}
         {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute top-full w-6 h-[40vh] bg-[#080818] border-r-2 border-black -z-10" style={{ left: `${10 + i * 15}%` }}>
                <div className="w-full h-2 bg-black/50 mt-2"></div>
            </div>
         ))}

         {/* Moving Train */}
         <motion.div 
            className="absolute -top-4 flex items-end space-x-[2px] filter drop-shadow-lg"
            initial={{ x: '-50vw' }}
            animate={{ x: '150vw' }}
            transition={{ 
                repeat: Infinity, 
                duration: 15, 
                ease: "linear", 
                repeatDelay: 4 
            }}
         >
           <TrainCar type="tail" />
           <TrainCar type="middle" />
           <TrainCar type="middle" />
           <TrainCar type="middle" />
           <TrainCar type="head" />
         </motion.div>
      </div>

      {/* Main Buildings (Left/Right) */}
      <div className="absolute bottom-0 left-0 right-0 h-[80vh] flex items-end justify-center pointer-events-none translate-y-[20vh] z-10">
         {/* Left Side */}
         <div className="absolute left-0 bottom-0 flex items-end">
            <Building 
                height={65} 
                width={14} 
                windows="grid-amber" 
                sign="vertical" 
                signText="ホテル" 
                signColor="#ff00ff" 
                hasVents 
                hasAC
                hasAntenna
            />
            <Building 
                height={45} 
                width={10} 
                windows="grid-blue" 
                neon="KARAOKE" 
                neonColor="#00ffff" 
                billboard
                hasBalcony
            />
            <Building 
                height={75} 
                width={16} 
                windows="grid-orange" 
                sign="vertical" 
                signText="ラーメン" 
                signColor="#ffaa00" 
                hasVents
                hasLanterns
                hasSatelliteDish
            />
            <Building 
                height={50} 
                width={8} 
                windows="grid-amber" 
                hasWaterTower
            />
         </div>

         {/* Right Side */}
         <div className="absolute right-0 bottom-0 flex items-end">
             <Building 
                 height={60} 
                 width={12} 
                 windows="grid-orange" 
                 sign="vertical" 
                 signText="ゲーム" 
                 signColor="#00ff00" 
                 hasAC
                 hasFireEscape
                 hasAntenna
             />
             <Building 
                 height={80} 
                 width={16} 
                 windows="grid-amber" 
                 billboard
                 hasVents
                 hasWaterTower
             />
             <Building 
                 height={45} 
                 width={10} 
                 windows="grid-blue" 
                 neon="BAR" 
                 neonColor="#ff0088" 
                 hasVents
                 hasAC
                 hasBalcony
             />
             <Building 
                 height={55} 
                 width={14} 
                 windows="grid-orange" 
                 sign="vertical" 
                 signText="TOKYO" 
                 signColor="#ffffff"
                 hasSatelliteDish 
             />
         </div>
      </div>

      {/* Ground Fog Layer */}
      <div className="absolute bottom-0 w-full h-56 bg-gradient-to-t from-purple-900/30 to-transparent blur-2xl pointer-events-none z-10" />

      {/* Street Level Atmosphere */}
      <div className="absolute bottom-0 w-full h-40 bg-[#050510] border-t-4 border-[#1a1a40] z-20">
        
        {/* Road surface gradient */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #07071a 0%, #030310 100%)' }} />

        {/* Wet road reflection layer */}
        <div className="absolute inset-0 opacity-30"
          style={{ background: 'linear-gradient(180deg, rgba(80,0,160,0.25) 0%, rgba(0,100,180,0.15) 50%, transparent 100%)' }} />

        {/* Puddles — vivid neon reflections */}
        <div className="absolute bottom-4 left-[18%] w-40 h-10 rounded-full transform scale-y-[0.3]"
          style={{ background: 'radial-gradient(ellipse, rgba(180,50,255,0.35) 0%, rgba(0,150,255,0.15) 60%, transparent 100%)', filter: 'blur(3px)' }} />
        <div className="absolute bottom-10 right-[25%] w-56 h-14 rounded-full transform scale-y-[0.3]"
          style={{ background: 'radial-gradient(ellipse, rgba(255,50,100,0.25) 0%, rgba(0,200,255,0.15) 60%, transparent 100%)', filter: 'blur(3px)' }} />
        <div className="absolute bottom-6 left-[55%] w-28 h-8 rounded-full transform scale-y-[0.3]"
          style={{ background: 'radial-gradient(ellipse, rgba(255,200,50,0.2) 0%, transparent 80%)', filter: 'blur(2px)' }} />

        {/* ── Road Markings ─────────────────────────────── */}
        {/* Edge line — far kerb (top) */}
        <div className="absolute left-0 right-0 h-[3px] bg-white/28" style={{ top: '6%' }} />

        {/* Lane dashes — far lane (right-going, upper half) */}
        <div className="absolute left-0 right-0" style={{ top: '32%', height: 5,
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 42px, transparent 42px, transparent 96px)',
        }} />

        {/* Double solid yellow centre divider */}
        <div className="absolute left-0 right-0 h-[5px] bg-[#f5c400]" style={{ top: '46%', boxShadow: '0 0 6px rgba(245,196,0,0.55)' }} />
        <div className="absolute left-0 right-0 h-[5px] bg-[#f5c400]" style={{ top: '55%', boxShadow: '0 0 6px rgba(245,196,0,0.55)' }} />

        {/* Lane dashes — near lane (left-going, lower half) */}
        <div className="absolute left-0 right-0" style={{ top: '71%', height: 5,
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 42px, transparent 42px, transparent 96px)',
        }} />

        {/* Edge line — near kerb (bottom) */}
        <div className="absolute left-0 right-0 h-[3px] bg-white/28" style={{ top: '91%' }} />

        {/* Traffic — RIGHT-going in far (upper) lane, LEFT-going in near (lower) lane */}
        <TrafficLane direction="right" speed={13} y={16} />
        <TrafficLane direction="left"  speed={15} y={62} />

        {/* Street lamp glow pools — richer & wider */}
        <div className="absolute bottom-0 left-[8%] w-56 h-28 rounded-full mix-blend-screen"
          style={{ background: 'radial-gradient(ellipse, rgba(255,200,80,0.18) 0%, rgba(200,100,255,0.08) 60%, transparent 100%)', filter: 'blur(12px)' }} />
        <div className="absolute bottom-0 left-[38%] w-48 h-24 rounded-full mix-blend-screen"
          style={{ background: 'radial-gradient(ellipse, rgba(100,200,255,0.15) 0%, transparent 70%)', filter: 'blur(10px)' }} />
        <div className="absolute bottom-0 right-[10%] w-56 h-28 rounded-full mix-blend-screen"
          style={{ background: 'radial-gradient(ellipse, rgba(255,100,220,0.16) 0%, rgba(80,0,180,0.08) 60%, transparent 100%)', filter: 'blur(12px)' }} />

        {/* Foreground Silhouette (Fence/Poles) */}
        <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none z-50">
           {/* Pole Left */}
           <div className="absolute bottom-0 left-[10%] w-4 h-[120%] bg-black transform -skew-x-2 z-50">
              <div className="absolute top-[20%] right-0 w-12 h-4 bg-black rounded-r-md"></div>
              <div className="absolute top-[20%] right-[-10px] w-4 h-8 bg-yellow-900/50 blur-md rounded-full"></div>
              {/* Transformer box */}
              <div className="absolute top-[35%] -left-2 w-8 h-10 bg-black rounded-sm"></div>
           </div>
           
           {/* Pole Right */}
           <div className="absolute bottom-0 right-[15%] w-6 h-[130%] bg-black transform skew-x-1 z-50">
              <div className="absolute top-[25%] left-[-30px] w-20 h-4 bg-black rounded-l-md"></div>
              <div className="absolute top-[25%] left-[-40px] w-4 h-8 bg-cyan-900/50 blur-md rounded-full"></div>
           </div>

           {/* Power Lines (Cables) */}
           <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible opacity-60">
             {/* Connecting the two poles approximately */}
             <motion.path 
               d="M 100 200 Q 500 400 900 250" 
               stroke="black" 
               strokeWidth="2" 
               fill="none" 
               initial={{ d: "M 100 200 Q 500 400 900 250" }}
               animate={{ d: ["M 100 200 Q 500 405 900 250", "M 100 200 Q 500 395 900 250", "M 100 200 Q 500 405 900 250"] }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
             />
             <path d="M 100 220 Q 500 450 900 270" stroke="black" strokeWidth="2" fill="none" />
           </svg>

           {/* Fence */}
           <div className="absolute bottom-0 w-full h-12 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg1djQwaC01ek0xMCAwaDV2NDBoLTV6TTIwIDBoNXY0MGgtNXpNMzAgMGg1djQwaC01eiIgZmlsbD0iIzAwMDAwMCIgZmlsbC1vcGFjaXR5PSIwLjgiLz48L3N2Zz4=')] opacity-80"></div>
        </div>
      </div>
    </div>
  );
}

function TrafficLane({ direction, speed, y }: { direction: 'left' | 'right', speed: number, y: number }) {
  // Generate random cars with better spacing logic
  const cars = useMemo(() => {
    const CAR_TYPES = ['sedan', 'sports', 'suv', 'taxi', 'truck', 'van'] as const;
    const CAR_COLORS = [
      '#c8c8d8', '#a0a0b8', '#e8e4d0', '#d0c8c0',
      '#b8c8e8', '#d0e8e0', '#e8d0d0', '#b0b8c0',
      '#f0e8c0', '#c0d0c0'
    ];
    return Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      delay: i * (speed / 3) + (i * 0.37),
      type: CAR_TYPES[Math.floor((i * 7 + speed) % CAR_TYPES.length)],
      color: CAR_COLORS[Math.floor((i * 3 + speed * 2) % CAR_COLORS.length)],
      roofColor: i % 3 === 0 ? '#111' : undefined,
    }));
  }, [speed]);

  return (
    <div className="absolute left-0 right-0 h-12 pointer-events-none overflow-hidden" style={{ top: `${y}%` }}>
      {cars.map((car) => (
        <motion.div
          key={car.id}
          className="absolute bottom-1"
          initial={{ x: direction === 'left' ? '120vw' : '-20vw' }}
          animate={{ x: direction === 'left' ? '-20vw' : '120vw' }}
          transition={{
            repeat: Infinity,
            duration: speed,
            ease: "linear",
            delay: car.delay
          }}
        >
          <PixelCar type={car.type} color={car.color} direction={direction} />
        </motion.div>
      ))}
    </div>
  )
}

function PixelCar({ type, color, direction }: {
  type: 'sedan' | 'sports' | 'suv' | 'taxi' | 'truck' | 'van';
  color: string;
  direction: 'left' | 'right';
}) {
  // direction='left'  → car moves RIGHT-to-LEFT  → FRONT is on the LEFT  → headlight LEFT, taillight RIGHT
  // direction='right' → car moves LEFT-to-RIGHT  → FRONT is on the RIGHT → headlight RIGHT, taillight LEFT
  // We place all lights for a LEFT-facing car, then scaleX(-1) flips the whole car for RIGHT-facing
  const flip = direction === 'right';
  const isTaxi = type === 'taxi';
  const isTruck = type === 'truck';
  const isVan = type === 'van';
  const isSuv = type === 'suv';
  const isSports = type === 'sports';

  const bodyColor = isTaxi ? '#e8c800' : color;

  const bodyW = isTruck ? 72 : isVan ? 56 : isSuv ? 52 : isSports ? 44 : 46;
  const bodyH = isTruck ? 14 : isVan ? 16 : isSuv ? 15 : isSports ? 9 : 12;
  const cabW  = isTruck ? 28 : isVan ? 56 : isSuv ? 52 : isSports ? 32 : 30;
  const cabH  = isTruck ? 14 : isVan ? 0  : isSuv ? 10 : isSports ? 7  : 10;
  // Truck cab always at left (front) — scaleX(-1) handles right-facing orientation
  const cabOffsetX = 0;

  return (
    <div
      className="relative"
      style={{
        width: bodyW,
        transform: flip ? 'scaleX(-1)' : undefined,
        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))',
      }}
    >
      {/* Cab / Upper Body */}
      {cabH > 0 && (
        <div
          className="absolute bottom-[14px] border border-black/60"
          style={{
            left: cabOffsetX,
            width: cabW,
            height: cabH,
            backgroundColor: bodyColor,
            borderRadius: isSports ? '3px 6px 0 0' : '3px 3px 0 0',
          }}
        >
          {/* Windshield */}
          {!isTruck && (
            <div
              className="absolute top-[2px] border border-black/20"
              style={{
                left: isSports ? '10%' : '8%',
                right: isSports ? '8%' : '12%',
                height: cabH - 4,
                background: 'linear-gradient(135deg, #1a3a5a 60%, #2a5a8a 100%)',
                borderRadius: 2,
              }}
            >
              {/* Glare */}
              <div className="absolute top-[1px] left-[2px] w-1/4 h-1/2 bg-white/20" style={{ borderRadius: 1 }} />
            </div>
          )}
          {isTruck && (
            <div className="absolute top-[2px] left-[2px] right-[2px] bottom-[2px]"
              style={{ background: '#1a3a5a', borderRadius: 2 }}>
              <div className="absolute top-[1px] left-[1px] w-1/3 h-1/2 bg-white/20" style={{ borderRadius: 1 }} />
            </div>
          )}
          {/* Taxi sign on cab roof */}
          {isTaxi && (
            <div className="absolute -top-[6px] left-1/2 -translate-x-1/2 px-[3px] py-[1px] bg-white border border-black"
              style={{ fontSize: 5, fontFamily: 'monospace', color: '#000', whiteSpace: 'nowrap' }}>
              TAXI
            </div>
          )}
        </div>
      )}

      {/* Main Chassis */}
      <div
        className="absolute bottom-[6px] border border-black/70"
        style={{
          left: 0, right: 0,
          height: bodyH,
          backgroundColor: bodyColor,
          borderRadius: isSports ? '2px 4px 0 0' : 2,
        }}
      >
        {/* Side stripe / trim line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] opacity-30 bg-black" />

        {/* Side windows (for van/suv) */}
        {(isVan || isSuv) && (
          <>
            <div className="absolute top-[2px] left-[8px] w-[14px]"
              style={{ height: bodyH - 6, background: '#1a3a5a', borderRadius: 1 }}>
              <div className="absolute top-[1px] left-[1px] w-[4px] h-[4px] bg-white/15" />
            </div>
            <div className="absolute top-[2px] right-[8px] w-[14px]"
              style={{ height: bodyH - 6, background: '#1a3a5a', borderRadius: 1 }}>
              <div className="absolute top-[1px] left-[1px] w-[4px] h-[4px] bg-white/15" />
            </div>
          </>
        )}

        {/* Truck cargo markings */}
        {isTruck && (
          <>
            <div className="absolute top-[3px] left-[30px] w-[1px] h-[8px] bg-black/30" />
            <div className="absolute top-[3px] left-[46px] w-[1px] h-[8px] bg-black/30" />
          </>
        )}

        {/* Door handle */}
        <div className="absolute top-1/2 -translate-y-1/2 left-[40%] w-[5px] h-[2px] bg-black/40 rounded-sm" />
      </div>

      {/* FRONT headlight — left side (front of left-facing car; flips to right for right-facing) */}
      <div className="absolute left-0 bottom-[7px]">
        {/* Upper lamp */}
        <div className="w-[4px] h-[4px] bg-[#fffde0] rounded-[1px]"
          style={{ boxShadow: '0 0 6px 2px rgba(255,250,180,1), 0 0 18px 4px rgba(255,230,100,0.7)' }} />
        {/* Lower fog/DRL */}
        <div className="w-[3px] h-[2px] bg-[#ffe87a] rounded-[1px] mt-[1px]"
          style={{ boxShadow: '0 0 4px rgba(255,220,80,0.8)' }} />
        {/* Beam cone extending left */}
        <div className="absolute left-[4px] top-[-2px] pointer-events-none"
          style={{
            width: 38, height: 14,
            background: 'linear-gradient(to left, rgba(255,245,160,0.22) 0%, rgba(255,245,160,0.06) 60%, transparent 100%)',
            clipPath: 'polygon(0% 20%, 100% 0%, 100% 100%, 0% 80%)',
            filter: 'blur(2px)',
          }} />
        {/* Ground scatter */}
        <div className="absolute left-[4px] top-[6px] pointer-events-none"
          style={{ width: 24, height: 8, background: 'radial-gradient(ellipse at left, rgba(255,240,120,0.18) 0%, transparent 100%)', filter: 'blur(3px)' }} />
      </div>

      {/* REAR taillight — right side (rear of left-facing car) */}
      <div className="absolute right-0 bottom-[8px]">
        <div className="w-[4px] h-[5px] bg-red-600 rounded-[1px]"
          style={{ boxShadow: '0 0 5px 2px rgba(255,30,30,0.9), 0 0 12px rgba(255,0,0,0.5)' }} />
        <div className="w-[3px] h-[2px] bg-red-800/70 rounded-[1px] mt-[1px]" />
        {/* Red glow halo */}
        <div className="absolute right-[4px] top-[-1px] pointer-events-none"
          style={{ width: 10, height: 10, background: 'rgba(255,0,0,0.18)', filter: 'blur(3px)', borderRadius: '50%' }} />
      </div>

      {/* Wheels */}
      {[
        { left: isTruck ? 8 : 5 },
        { left: isTruck ? bodyW - 18 : bodyW - 15 },
      ].map((w, i) => (
        <div key={i} className="absolute bottom-0" style={{ left: w.left }}>
          <div className="w-[10px] h-[7px] bg-[#111] rounded-full border border-[#333]"
            style={{ boxShadow: 'inset 0 0 2px #000' }}>
            <div className="absolute inset-[2px] rounded-full bg-[#444] border border-[#555]">
              <div className="absolute inset-[1px] rounded-full bg-[#555]" />
            </div>
          </div>
          <div className="absolute -top-[2px] left-0 right-0 h-[3px] bg-black/30 rounded-t-full" />
        </div>
      ))}

      {/* Exhaust puff — from rear (right side) */}
      <motion.div
        className="absolute bottom-[4px] right-[-5px] w-[5px] h-[5px] rounded-full"
        style={{ background: 'rgba(180,180,200,0.25)' }}
        animate={{ scale: [0.5, 2.2], opacity: [0.35, 0], x: [0, 12] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut', repeatDelay: 1.0 }}
      />
    </div>
  );
}

interface BuildingProps { 
  height: number; 
  width: number; 
  windows: string; 
  neon?: string; 
  neonColor?: string;
  sign?: 'vertical';
  signText?: string;
  signColor?: string;
  hasVents?: boolean;
  hasAC?: boolean;
  billboard?: boolean;
  hasFireEscape?: boolean;
  hasLanterns?: boolean;
  hasWaterTower?: boolean;
  hasAntenna?: boolean;
  hasSatelliteDish?: boolean;
  hasBalcony?: boolean;
}

function Building({ height, width, windows, neon, neonColor, sign, signText, signColor, hasVents, hasAC, billboard, hasFireEscape, hasLanterns, hasWaterTower, hasAntenna, hasSatelliteDish, hasBalcony }: BuildingProps) {
  const windowColor = windows === 'grid-amber' ? 'rgba(255, 180, 50, 0.15)' : 
                      windows === 'grid-blue' ? 'rgba(100, 200, 255, 0.15)' :
                      'rgba(255, 100, 50, 0.15)'; // orange
  
  // Stable random lit windows
  const litWindows = useMemo(() => {
    const cols = Math.floor(width / 1.5);
    const rows = Math.floor(height / 2.5);
    const slots: {r: number, c: number}[] = [];
    for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
            slots.push({ r, c });
        }
    }
    for (let i = slots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    const count = Math.floor(slots.length * 0.25);
    return slots.slice(0, count).map((slot, i) => ({
        id: i,
        left: (slot.c / cols * 100) + 2 + '%',
        top: (slot.r / rows * 100) + 2 + '%',
        width: Math.random() > 0.5 ? '6px' : '8px',
        height: Math.random() > 0.5 ? '8px' : '10px',
        color: Math.random() > 0.3 ? '#ffeb3b' : '#e0f7fa',
        opacity: 0.6 + Math.random() * 0.4
    }));
  }, [height, width]);

  // Floor bands — horizontal concrete ledges between stories
  const floorBands = useMemo(() =>
    Array.from({ length: Math.floor(height / 12) }).map((_, i) => 8 + i * 12), [height]);

  // Pipe run X position
  const pipeX = useMemo(() => (height * 13 + width * 7) % 2 === 0 ? '15%' : '78%', [height, width]);
  
  return (
    <div className="relative mx-1 lg:mx-3 flex flex-col justify-end group" 
         style={{ 
           height: `${height}vh`, 
           width: `${width}vw`, 
           backgroundColor: '#111122', 
           border: '4px solid #050510',
           boxShadow: '0 0 30px rgba(0,0,0,0.8)'
         }}>
         
       {/* Windows Pattern - Base layer */}
       <div className="w-full h-full absolute inset-0 opacity-80" 
            style={{
                backgroundImage: `linear-gradient(${windowColor} 2px, transparent 2px), linear-gradient(90deg, ${windowColor} 2px, transparent 2px)`,
                backgroundSize: '16px 24px', // Tighter grid for more detail
                backgroundPosition: '4px 4px',
            }}>
       </div>
       
       {/* Dark patches (Unlit windows) - Using a noise pattern (Reduced opacity to let more base light through) */}
       <div className="absolute inset-0 bg-[#0d0d1a] mix-blend-multiply opacity-50" 
            style={{ 
                backgroundImage: `
                  linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), 
                  linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)
                `,
                backgroundSize: '48px 48px', // Varied size
                backgroundPosition: '0 0, 24px 24px'
            }}>
       </div>

       {/* Horizontal floor bands — concrete ledges */}
       {floorBands.map((pct, i) => (
         <div key={i} className="absolute left-0 right-0 h-[2px] pointer-events-none"
              style={{ top: `${pct}%`, background: 'rgba(0,0,0,0.55)', boxShadow: '0 1px 0 rgba(255,255,255,0.04)' }} />
       ))}

       {/* Exterior vertical pipe/duct */}
       <div className="absolute top-[5%] bottom-[8%] w-[3px] bg-[#0c0c1c] border-l border-r border-black/30"
            style={{ left: pipeX }} />
       {Array.from({ length: 4 }).map((_, i) => (
         <div key={i} className="absolute w-[7px] h-[2px] bg-[#0a0a18] border border-black/40"
              style={{ top: `${15 + i * 22}%`, left: `calc(${pipeX} - 2px)` }} />
       ))}

       {/* Brightly Lit Individual Windows (Static) */}
       {litWindows.map((win) => (
           <div 
             key={win.id}
             className="absolute shadow-[0_0_4px_rgba(255,255,255,0.4)]"
             style={{
                 left: win.left,
                 top: win.top,
                 width: win.width,
                 height: win.height,
                 backgroundColor: win.color,
                 opacity: win.opacity,
                 boxShadow: `0 0 5px ${win.color}`
             }}
           />
       ))}

       {/* Weathering / Grunge Overlay */}
       <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay"
            style={{
                backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmlsdGVyIGlkPSJkb3NlIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2Rvc2UpIiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=')`
            }}>
       </div>

       {/* AC Units — detailed with fins, drip tray, status light */}
       {hasAC && Array.from({length: 3}).map((_, i) => (
           <div key={i} className="absolute -right-2 w-5 h-4 bg-[#1a1a28] border border-black/80 shadow-sm"
                style={{ top: `${22 + i * 16}%` }}>
             <div className="absolute inset-[1px] flex flex-col justify-around">
               {[0,1,2].map(j => <div key={j} className="w-full h-[1px] bg-black/50" />)}
             </div>
             <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[#0a0a18] border-b border-black/40" />
             <div className="absolute top-[2px] right-[2px] w-[2px] h-[2px] rounded-full bg-green-500/70" />
           </div>
       ))}

       {/* Fire Escape — detailed with platforms, rails, diagonal brace */}
       {hasFireEscape && (
           <div className="absolute top-[15%] left-0 w-9 h-[70%] opacity-80 z-10">
             <div className="w-[2px] h-full bg-[#080818] absolute left-[2px]" />
             <div className="w-[2px] h-full bg-[#080818] absolute right-[2px]" />
             {Array.from({length: 5}).map((_, i) => (
               <div key={i} className="absolute w-full h-[3px] bg-[#0a0a1e] border-b border-black"
                    style={{ top: `${i * 22}%` }}>
                 {[0,1,2].map(j => (
                   <div key={j} className="absolute top-0 bottom-0 w-[1px] bg-black/30"
                        style={{ left: `${20 + j * 25}%` }} />
                 ))}
               </div>
             ))}
             <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible opacity-60">
               <line x1="0" y1="0" x2="36" y2="100%" stroke="#080818" strokeWidth="1.5" />
             </svg>
           </div>
       )}

       {/* Balconies — with railing posts, top bar, and plants */}
       {hasBalcony && Array.from({length: 4}).map((_, i) => (
           <div key={i} className="absolute left-0 right-0 h-[14px]" style={{ top: `${22 + i * 16}%` }}>
             <div className="absolute left-[5%] right-[5%] bottom-0 h-[3px] bg-[#0e0e20] border-b-2 border-black" />
             {Array.from({ length: 5 }).map((_, j) => (
               <div key={j} className="absolute bottom-0 w-[2px] h-[10px] bg-[#0c0c1c]"
                    style={{ left: `${10 + j * 18}%` }} />
             ))}
             <div className="absolute bottom-[10px] left-[8%] right-[8%] h-[1px] bg-[#0c0c1c]" />
             <div className="absolute bottom-[3px] right-[12%] w-[5px] h-[8px] bg-green-900/70 rounded-t-full" />
             <div className="absolute bottom-[3px] right-[20%] w-[3px] h-[5px] bg-green-900/50 rounded-t-full" />
           </div>
       ))}

       {/* Steam Vents */}
       {hasVents && (
           <div className="absolute -top-4 right-4">
              <SteamParticles />
           </div>
       )}

       {/* Water Tower — with conical roof, barrel slats, legs, cross-braces */}
       {hasWaterTower && (
           <div className="absolute -top-16 left-2 w-12 h-16">
             <div className="absolute top-0 left-[10%] right-[10%] h-0"
                  style={{ borderLeft: '18px solid transparent', borderRight: '18px solid transparent', borderBottom: '8px solid #1a1818' }} />
             <div className="absolute top-[8px] left-0 right-0 h-[24px] bg-[#1e1818] rounded-sm border border-black overflow-hidden">
               {[0,1,2,3].map(i => (
                 <div key={i} className="absolute top-0 bottom-0 w-[1px] bg-black/30"
                      style={{ left: `${20 + i * 16}%` }} />
               ))}
               <div className="absolute top-[8px] left-0 right-0 h-[1px] bg-black/40" />
               <div className="absolute top-[16px] left-0 right-0 h-[1px] bg-black/30" />
             </div>
             <div className="absolute top-[32px] left-[5%] right-[5%] h-[2px] bg-[#111] border border-black/60" />
             {[0, 1, 2, 3].map(i => (
               <div key={i} className="absolute bottom-0 w-[2px] bg-[#111] border-x border-black/40"
                    style={{ height: '26px', left: `${8 + i * 26}%` }} />
             ))}
             <svg className="absolute bottom-0 left-0 w-full pointer-events-none" style={{ height: 26 }}>
               <line x1="0" y1="0" x2="48" y2="26" stroke="#0a0a0a" strokeWidth="1" />
               <line x1="48" y1="0" x2="0" y2="26" stroke="#0a0a0a" strokeWidth="1" />
             </svg>
           </div>
       )}

       {/* Antenna — mast with cross-arms, guy-wires, blinking beacon */}
       {hasAntenna && (
           <div className="absolute -top-20 right-2 w-2 h-20">
             <div className="absolute left-[3px] top-0 bottom-0 w-[2px] bg-[#0a0a18]" />
             <div className="absolute top-[20%] -left-[6px] right-[-6px] h-[1px] bg-[#0a0a18]" />
             <div className="absolute top-[40%] -left-[4px] right-[-4px] h-[1px] bg-[#0a0a18]" />
             <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none opacity-40">
               <line x1="4" y1="0" x2="-10" y2="80" stroke="#0a0a18" strokeWidth="0.5" />
               <line x1="4" y1="0" x2="18" y2="80" stroke="#0a0a18" strokeWidth="0.5" />
             </svg>
             <motion.div 
               className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-red-600"
               animate={{ opacity: [0, 1, 0], boxShadow: ['0 0 0px red', '0 0 8px red, 0 0 16px red', '0 0 0px red'] }}
               transition={{ duration: 1.8, repeat: Infinity, times: [0, 0.1, 1] }}
             />
           </div>
       )}

       {/* Satellite Dish — with bowl, feed horn, mount */}
       {hasSatelliteDish && (
           <div className="absolute -top-10 left-3 w-10 h-10">
             <div className="absolute top-[2px] left-0 w-[22px] h-[16px] border-4 border-[#2a2a3a] rounded-full border-t-transparent border-r-transparent"
                  style={{ transform: 'rotate(-30deg)' }} />
             <div className="absolute top-[2px] left-[8px] w-[2px] h-[8px] bg-[#222] rotate-12" />
             <div className="absolute top-0 left-[6px] w-[5px] h-[3px] bg-[#333] rounded-full" />
             <div className="absolute bottom-0 left-[6px] w-[2px] h-[6px] bg-[#111]" />
             <div className="absolute bottom-0 left-[2px] w-[10px] h-[2px] bg-[#111]" />
           </div>
       )}

       {/* Lanterns — with cord, barrel body, glare, tassel */}
       {hasLanterns && (
           <div className="absolute bottom-10 left-0 w-full flex justify-around px-1 z-30">
               {[0, 0.5, 1.0].map((delay, i) => (
                 <motion.div key={i} animate={{ y: [0, 2, 0], scale: [1, 0.96, 1] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay }}
                   className="relative flex flex-col items-center">
                   <div className="w-[1px] h-[4px] bg-black/60" />
                   <div className="w-3 h-4 bg-red-600 rounded-sm shadow-[0_0_6px_red,0_0_12px_#f008] border-t-2 border-black relative overflow-hidden">
                     <div className="absolute top-[3px] left-0 right-0 h-[1px] bg-black/30" />
                     <div className="absolute top-[7px] left-0 right-0 h-[1px] bg-black/20" />
                     <div className="absolute top-[1px] left-[2px] w-[3px] h-[4px] bg-white/20 rounded-sm" />
                   </div>
                   <div className="w-[1px] h-[3px] bg-yellow-600/70" />
                 </motion.div>
               ))}
           </div>
       )}

       {/* Pixel-art Advertisement Billboard */}
       {billboard && (
         <div className="absolute top-[14%] left-[6%] right-[6%] h-[18%] overflow-hidden"
              style={{ border: '3px solid #1a1a2e', boxShadow: '0 0 0 1px #000, 0 4px 12px rgba(0,0,0,0.9), inset 0 0 6px rgba(0,0,0,0.6)', background: '#0a0010' }}>

           {/* Ad background — deep red with vertical light bands */}
           <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a0008 0%, #2d0010 40%, #1a0018 100%)' }} />
           <div className="absolute inset-0 opacity-15"
             style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,80,80,0.3) 0px, rgba(255,80,80,0.3) 1px, transparent 1px, transparent 22px)' }} />

           {/* Left side — bowl icon (pixel art via divs) */}
           <div className="absolute left-[3%] top-[8%] bottom-[8%] w-[22%] flex items-center justify-center">
             {/* Bowl rim */}
             <div className="relative" style={{ width: 28, height: 20 }}>
               <div className="absolute bottom-0 left-0 right-0 h-[14px] rounded-b-[40%]"
                 style={{ background: 'linear-gradient(to bottom, #cc6622 0%, #883300 100%)', border: '1px solid #331100' }} />
               {/* Bowl top rim */}
               <div className="absolute top-0 left-0 right-0 h-[5px] rounded-full"
                 style={{ background: '#dd7733', border: '1px solid #441100' }} />
               {/* Soup surface */}
               <div className="absolute top-[5px] left-[2px] right-[2px] h-[4px] rounded-sm"
                 style={{ background: 'linear-gradient(to right, #8b1a00, #cc3300, #8b1a00)' }} />
               {/* Noodle wiggles */}
               <svg className="absolute top-[5px] left-[2px]" width="24" height="6" viewBox="0 0 24 6" fill="none">
                 <path d="M0 3 Q3 1 6 3 Q9 5 12 3 Q15 1 18 3 Q21 5 24 3" stroke="#f5d070" strokeWidth="1.2" fill="none"/>
                 <path d="M0 5 Q3 3 6 5 Q9 7 12 5 Q15 3 18 5 Q21 7 24 5" stroke="#e8c060" strokeWidth="1" fill="none"/>
               </svg>
               {/* Steam */}
               <motion.div className="absolute -top-[8px] left-[5px]"
                 animate={{ opacity: [0.7,0.2,0.7], y: [0,-3,0] }}
                 transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
                 <div className="w-[1px] h-[5px] bg-white/50 mx-auto mb-[1px]" />
               </motion.div>
               <motion.div className="absolute -top-[8px] left-[14px]"
                 animate={{ opacity: [0.3,0.8,0.3], y: [0,-4,0] }}
                 transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}>
                 <div className="w-[1px] h-[6px] bg-white/40 mx-auto" />
               </motion.div>
             </div>
           </div>

           {/* Main text block */}
           <div className="absolute left-[27%] right-[4%] top-[6%] bottom-[6%] flex flex-col justify-center gap-[2px]">
             {/* Japanese headline */}
             <div className="flex items-baseline gap-[3px]">
               <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#ff6644', letterSpacing: 1,
                 textShadow: '0 0 4px #ff4422, 0 0 10px #ff220088', fontWeight: 700, lineHeight: 1 }}>
                 本場
               </span>
               <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#ffdd44', letterSpacing: 2,
                 textShadow: '0 0 5px #ffaa00, 0 0 12px #ff880066', fontWeight: 700, lineHeight: 1 }}>
                 ラーメン
               </span>
             </div>
             {/* English subtitle */}
             <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#ffbb88',
               letterSpacing: 1, textShadow: '0 0 4px rgba(255,120,60,0.7)', lineHeight: 1.4 }}>
               AUTHENTIC RAMEN
             </div>
             {/* Price tag */}
             <motion.div className="flex items-center gap-[3px] mt-[2px]"
               animate={{ opacity: [1, 0.5, 1] }}
               transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}>
               <div className="px-[3px] py-[1px]" style={{ background: '#ff2244', border: '1px solid #ff6666' }}>
                 <span style={{ fontFamily: 'monospace', fontSize: 6, color: '#fff', fontWeight: 700, lineHeight: 1 }}>¥850</span>
               </div>
               <span style={{ fontFamily: 'monospace', fontSize: 5, color: '#ffaa88', lineHeight: 1 }}>より</span>
             </motion.div>
           </div>

           {/* CRT scanline overlay */}
           <div className="absolute inset-0 pointer-events-none opacity-30"
             style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 1px, transparent 1px, transparent 3px)' }} />

           {/* Corner bolts */}
           {[{t:2,l:2},{t:2,r:2},{b:2,l:2},{b:2,r:2}].map((pos, k) => (
             <div key={k} className="absolute w-[4px] h-[4px] rounded-full bg-[#444] border border-[#666]"
               style={{ top: (pos as any).t, bottom: (pos as any).b, left: (pos as any).l, right: (pos as any).r }} />
           ))}
         </div>
       )}

       {/* Rooftop Neon Sign */}
       {neon && (
         <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-center z-10 w-full">
            <div className="inline-block border-4 p-1 bg-black/80 backdrop-blur-sm" style={{ borderColor: neonColor }}>
                <span className="block text-sm md:text-lg font-bold tracking-widest whitespace-nowrap px-1" 
                      style={{ 
                          fontFamily: '"Press Start 2P", monospace', 
                          color: neonColor,
                          textShadow: `0 0 5px ${neonColor}, 0 0 15px ${neonColor}`
                      }}>
                    {neon}
                </span>
            </div>
            {/* Scaffolding/Support for sign */}
            <div className="w-2 h-6 bg-black mx-auto -mt-1"></div>
         </div>
       )}

       {/* Vertical Side Sign — with top/bottom caps and glow */}
       {sign === 'vertical' && signText && (
         <div className="absolute top-10 -right-3 z-20 flex flex-col items-center bg-black/85 border-2 p-1 space-y-1"
              style={{ borderColor: signColor, boxShadow: `0 0 10px ${signColor}44, 0 0 20px ${signColor}22` }}>
           <div className="w-full h-[3px] rounded-sm mb-[2px]" style={{ backgroundColor: signColor, opacity: 0.7 }} />
           {signText.split('').map((char, i) => (
             <span key={i} className="text-xs md:text-sm font-bold block" 
                   style={{ 
                     fontFamily: '"VT323", monospace',
                     color: signColor,
                     textShadow: `0 0 5px ${signColor}, 0 0 10px ${signColor}`,
                     lineHeight: '1'
                   }}>
               {char}
             </span>
           ))}
           <div className="w-full h-[3px] rounded-sm mt-[2px]" style={{ backgroundColor: signColor, opacity: 0.7 }} />
         </div>
       )}

       {/* Shop Front / Entrance at bottom — with awning, door frame, silhouettes */}
       <div className="absolute bottom-0 w-full h-12 bg-[#1a1a28] border-t-2 border-[#2a2a40] flex items-end justify-center overflow-hidden">
            {/* Awning */}
            <div className="absolute top-0 left-[5%] right-[5%] h-[4px] bg-[#141430] border-b border-black/60"
                 style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="absolute top-0 w-[3px] h-[4px] bg-black/20"
                     style={{ left: `${10 + i * 18}%` }} />
              ))}
            </div>
            <div className="absolute top-[4px] left-[5%] right-[5%] h-[3px]"
                 style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)' }} />

            {/* Lit interior window */}
            <div className="w-[65%] h-[70%] bg-amber-100/8 relative border-x border-[#252535]">
               <div className="absolute inset-0 bg-gradient-to-t from-amber-400/5 to-transparent" />
               <motion.div 
                  className="absolute bottom-0 w-3 h-7 bg-black/80 rounded-t-full"
                  animate={{ left: ['-20%', '120%'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 2 }}
               />
               <motion.div 
                  className="absolute bottom-0 w-2 h-5 bg-black/60 rounded-t-full"
                  animate={{ left: ['120%', '-20%'] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 0 }}
               />
            </div>
            {/* Door frame center */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[16%] h-[80%] border-l-2 border-r-2 border-t-2 border-[#0a0a18]" />
       </div>

       {/* Vending Machine — detailed with product slots, glow */}
       {(height + width) % 3 > 0 && (
         <div className="absolute bottom-0 left-2 w-5 h-10 bg-[#dde8ff] border border-[#aab] z-20"
              style={{ boxShadow: '0 0 8px rgba(180,200,255,0.3)' }}>
            <div className="w-full h-[30%] bg-blue-600/80" />
            <div className="w-full h-[45%] grid grid-cols-2 gap-[1px] p-[2px]">
              {[0,1,2,3].map(i => (
                <div key={i} className="rounded-[1px]"
                     style={{ background: i % 2 === 0 ? '#2244aa88' : '#aa224488' }} />
              ))}
            </div>
            <div className="absolute bottom-[7px] left-1/2 -translate-x-1/2 w-[8px] h-[2px] bg-[#888]" />
            <div className="absolute bottom-[2px] left-[15%] right-[15%] h-[3px] bg-[#ccc]" />
            <div className="absolute -inset-3 bg-blue-400/10 blur-xl -z-10" />
         </div>
       )}
    </div>
  );
}

function SteamParticles() {
    return (
        <div className="relative">
            {Array.from({length: 3}).map((_, i) => (
                <motion.div 
                    key={i}
                    className="absolute bottom-0 w-2 h-2 bg-white/30 rounded-full blur-[2px]"
                    animate={{ 
                        y: [-5, -30], 
                        opacity: [0.6, 0], 
                        scale: [1, 3],
                        x: [0, (i % 2 === 0 ? 10 : -10)]
                    }}
                    transition={{ 
                        duration: 2 + Math.random(), 
                        repeat: Infinity, 
                        delay: i * 0.5,
                        ease: "easeOut"
                    }}
                />
            ))}
        </div>
    )
}

function ShootingStar() {
    return (
        <motion.div
            className="absolute top-0 right-0 w-[100px] h-[2px] bg-gradient-to-l from-transparent via-white to-transparent opacity-0 z-0"
            style={{ rotate: '30deg', transformOrigin: 'right' }}
            animate={{ 
                x: ['10vw', '-50vw'],
                y: ['-10vh', '40vh'],
                opacity: [0, 1, 0]
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 15 + Math.random() * 20, // Rare event
                ease: "easeIn"
            }}
        />
    )
}

function TrainCar({ type }: { type: 'head' | 'middle' | 'tail' }) {
  const isHead = type === 'head';
  const isTail = type === 'tail';
  const isMiddle = type === 'middle';

  return (
    <div className="relative flex flex-col items-stretch" style={{ width: isHead || isTail ? 96 : 80 }}>

      {/* Pantograph (only on some cars) */}
      {(isHead || isMiddle) && (
        <div className="relative h-3 flex justify-center items-end mb-[1px]" style={{ width: '100%' }}>
          {/* Diamond pantograph shape */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: 24 }}>
            {/* Base insulator */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-2 bg-[#444]" />
            {/* Left arm */}
            <div className="absolute bottom-1 left-1/2" style={{ width: 12, height: 1, background: '#888', transformOrigin: 'left bottom', transform: 'rotate(-45deg)' }} />
            {/* Right arm */}
            <div className="absolute bottom-1 left-1/2" style={{ width: 12, height: 1, background: '#888', transformOrigin: 'left bottom', transform: 'rotate(-135deg)', marginLeft: -12 }} />
            {/* Contact wire */}
            <div className="absolute -top-[1px] left-0 right-0 h-[1px] bg-[#aac]" />
          </div>
        </div>
      )}

      {/* Roof */}
      <div
        className={`h-1 bg-[#1e1e30] border-x border-t border-black ${isHead ? 'rounded-tr-xl' : isTail ? 'rounded-tl-xl' : ''}`}
      >
        {/* Roof vents */}
        {Array.from({ length: isMiddle ? 3 : 2 }).map((_, i) => (
          <div key={i} className="absolute top-0 w-2 h-1 bg-[#2a2a3a] border border-black/40"
            style={{ left: `${15 + i * 30}%` }} />
        ))}
      </div>

      {/* Main Car Body */}
      <div
        className={`relative h-8 bg-[#2a2a4a] border-x border-black flex flex-col overflow-hidden shadow-sm
          ${isHead ? 'border-r-0' : isTail ? 'border-l-0' : ''}`}
        style={{ minWidth: isHead || isTail ? 96 : 80 }}
      >
        {/* Blue accent stripe top */}
        <div className="absolute top-[6px] w-full h-[3px] bg-sky-500/60" />
        {/* Thin highlight stripe */}
        <div className="absolute top-[10px] w-full h-[1px] bg-sky-300/30" />

        {/* Door panels */}
        {Array.from({ length: isMiddle ? 2 : 1 }).map((_, di) => (
          <div key={di}
            className="absolute top-[12px] bottom-[6px] w-[18px] border-l border-r border-black/40 bg-[#252440]"
            style={{ left: `${isMiddle ? (di === 0 ? 22 : 55) : 35}%` }}
          >
            {/* Door window */}
            <div className="absolute top-[2px] left-[2px] right-[2px] h-[7px] bg-[#1a3a5a]/80 rounded-[1px] shadow-[inset_0_1px_2px_rgba(0,180,255,0.2)]" />
            {/* Door handle */}
            <div className="absolute bottom-[4px] left-1/2 -translate-x-1/2 w-[4px] h-[2px] bg-[#555]" />
          </div>
        ))}

        {/* Passenger windows */}
        <div className="absolute top-[12px] flex items-start w-full px-[6px] gap-[3px]">
          {Array.from({ length: isHead || isTail ? 4 : 5 }).map((_, i) => (
            <div key={i} className="flex-1 h-[8px] rounded-[1px] relative overflow-hidden"
              style={{ background: '#1a3a5a', boxShadow: 'inset 0 0 3px rgba(0,180,255,0.3), 0 0 3px rgba(100,200,255,0.4)' }}>
              {/* Window reflection */}
              <div className="absolute top-0 left-0 w-1/3 h-full bg-white/10" />
              {/* Silhouette of passenger */}
              {Math.random() > 0.5 && <div className="absolute bottom-0 left-[30%] w-[4px] h-[5px] bg-black/50 rounded-t-sm" />}
            </div>
          ))}
        </div>

        {/* Destination sign on head */}
        {isHead && (
          <div className="absolute top-[2px] right-[8px] px-[3px] py-[1px] bg-[#001a00] border border-[#003300]">
            <span style={{ fontFamily: 'monospace', fontSize: 5, color: '#00ff44', letterSpacing: 0.5, textShadow: '0 0 3px #00ff44' }}>
              急行 EXPRESS
            </span>
          </div>
        )}

        {/* Headlight */}
        {isHead && (
          <>
            <div className="absolute right-0 top-[14px] w-[3px] h-[3px] bg-white rounded-sm shadow-[0_0_8px_#fff,0_0_16px_#fff8] z-20" />
            <div className="absolute right-0 top-[20px] w-[3px] h-[3px] bg-amber-200 rounded-sm shadow-[0_0_6px_#ffdd88] z-20" />
            <div className="absolute right-[-50px] top-[10px] w-24 h-[18px] bg-gradient-to-r from-white/15 to-transparent skew-x-12 blur-sm z-20 pointer-events-none" />
          </>
        )}

        {/* Taillight */}
        {isTail && (
          <>
            <div className="absolute left-[1px] top-[14px] w-[3px] h-[5px] bg-red-600 rounded-sm shadow-[0_0_6px_#f00,0_0_12px_#f008] z-20" />
            <div className="absolute left-[-8px] top-[12px] w-6 h-6 bg-red-600/20 blur-md z-20 pointer-events-none rounded-full" />
          </>
        )}

        {/* Number plate on tail */}
        {isTail && (
          <div className="absolute bottom-[2px] left-[8px] px-[2px] bg-[#111] border border-[#333]">
            <span style={{ fontFamily: 'monospace', fontSize: 4, color: '#aaa' }}>T-07</span>
          </div>
        )}
      </div>

      {/* Lower skirt */}
      <div className={`h-[3px] bg-[#1a1a2e] border-x border-black ${isHead ? 'rounded-br-lg' : isTail ? 'rounded-bl-lg' : ''}`} />

      {/* Undercarriage / Wheel Bogies */}
      <div className="relative h-[5px] flex items-center justify-around px-2">
        {/* Bogie 1 */}
        <div className="relative flex items-center gap-[2px]">
          <div className="w-[6px] h-[5px] bg-[#111] border border-[#333] rounded-[1px]">
            <div className="absolute inset-[1px] rounded-full border border-[#444]" />
          </div>
          <div className="w-[2px] h-[3px] bg-[#222]" />
          <div className="w-[6px] h-[5px] bg-[#111] border border-[#333] rounded-[1px]">
            <div className="absolute inset-[1px] rounded-full border border-[#444]" />
          </div>
        </div>
        {/* Bogie 2 */}
        <div className="relative flex items-center gap-[2px]">
          <div className="w-[6px] h-[5px] bg-[#111] border border-[#333] rounded-[1px]">
            <div className="absolute inset-[1px] rounded-full border border-[#444]" />
          </div>
          <div className="w-[2px] h-[3px] bg-[#222]" />
          <div className="w-[6px] h-[5px] bg-[#111] border border-[#333] rounded-[1px]">
            <div className="absolute inset-[1px] rounded-full border border-[#444]" />
          </div>
        </div>
      </div>
    </div>
  );
}