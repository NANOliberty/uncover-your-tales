import { motion } from 'motion/react';

export function MapSteam({ x, y }: { x: string | number, y: string | number }) {
    return (
        <div className="absolute z-30 pointer-events-none" style={{ left: x, top: y }}>
            {Array.from({ length: 3 }).map((_, i) => (
                <motion.div 
                    key={i}
                    className="absolute bottom-0 w-2 h-2 bg-white/40"
                    animate={{ 
                        y: [-2, -15], 
                        opacity: [0.6, 0], 
                        scale: [1, 2],
                        x: [0, (i % 2 === 0 ? 4 : -4)]
                    }}
                    transition={{ 
                        duration: 2 + Math.random(), 
                        repeat: Infinity, 
                        delay: i * 0.6,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
}

export function MapVendingMachine({ x, y, color = 'blue' }: { x: string | number, y: string | number, color?: 'blue' | 'red' | 'green' }) {
    const bg = color === 'blue' ? 'bg-blue-600' : color === 'red' ? 'bg-red-600' : 'bg-green-600';
    
    return (
        <div className={`absolute z-20 w-4 h-6 ${bg} border-r-2 border-b-2 border-black/50 shadow-sm`} style={{ left: x, top: y }}>
             {/* Top highlight */}
             <div className="absolute top-0 left-0 w-full h-[1px] bg-white/40"></div>
             <div className="absolute top-0 left-0 h-full w-[1px] bg-white/40"></div>
             
             {/* Window */}
             <div className="absolute top-1 left-[10%] right-[10%] h-[40%] bg-blue-900/50 border border-black/20">
                <div className="w-full h-full opacity-30 bg-[linear-gradient(90deg,transparent_50%,rgba(255,255,255,0.2)_50%)] bg-[length:2px_100%]"></div>
             </div>
             
             {/* Buttons row */}
             <div className="absolute top-[50%] left-[10%] right-[10%] h-1 flex justify-between">
                 <div className="w-1 h-1 bg-white/80 rounded-[1px]"></div>
                 <div className="w-1 h-1 bg-white/80 rounded-[1px]"></div>
                 <div className="w-1 h-1 bg-white/80 rounded-[1px]"></div>
             </div>
             
             {/* Slot */}
             <div className="absolute bottom-1 right-1 w-2 h-1 bg-black/60"></div>
             
             {/* Glow */}
             <div className={`absolute inset-0 ${color === 'blue' ? 'bg-blue-400' : color === 'red' ? 'bg-red-400' : 'bg-green-400'} opacity-10 animate-pulse pointer-events-none`}></div>
        </div>
    );
}

export function MapStreetLight({ x, y, align = 'left' }: { x: string | number, y: string | number, align?: 'left' | 'right' }) {
    return (
        <div className="absolute z-30 pointer-events-none" style={{ left: x, top: y }}>
            {/* Pole */}
            <div className="w-[2px] h-8 bg-[#222] absolute bottom-0 left-0 border-r border-white/10"></div>
            {/* Head */}
            <div className={`absolute top-0 ${align === 'left' ? '-left-2' : 'left-0'} w-3 h-1 bg-[#333]`}></div>
            {/* Light Cone - Pixelated gradient effect using multiple bands */}
            <div className={`absolute top-1 ${align === 'left' ? '-left-5' : 'left-0.5'} flex flex-col items-center opacity-30`}>
                 <div className="w-4 h-2 bg-yellow-200/20"></div>
                 <div className="w-6 h-4 bg-yellow-200/10"></div>
                 <div className="w-8 h-6 bg-yellow-200/5"></div>
            </div>
        </div>
    );
}

export function MapCat({ x, y, color = '#fff' }: { x: string | number, y: string | number, color?: string }) {
    return (
        <motion.div 
            className="absolute z-20 w-3 h-2"
            style={{ left: x, top: y }}
        >
            {/* Body */}
            <div className="w-3 h-2 rounded-[1px]" style={{ backgroundColor: color }}></div>
            {/* Head */}
            <motion.div 
                className="absolute -top-1 -left-1 w-2 h-2 rounded-[1px]" 
                style={{ backgroundColor: color }}
                animate={{ y: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
                {/* Ears */}
                <div className="absolute -top-[1px] left-0 w-[1px] h-[1px] bg-white opacity-50"></div>
                <div className="absolute -top-[1px] right-0 w-[1px] h-[1px] bg-white opacity-50"></div>
            </motion.div>
            {/* Tail */}
            <motion.div 
                className="absolute -right-1 -top-2 w-[1px] h-3 bg-current origin-bottom"
                style={{ backgroundColor: color }}
                animate={{ rotate: [-10, 10, -10] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
        </motion.div>
    );
}

export function MapPowerLines() {
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible opacity-50">
            {/* Main crossing lines - simpler and sharper */}
            <path d="M 0% 20% L 100% 25%" stroke="black" strokeWidth="1" fill="none" />
            <path d="M 0% 22% L 100% 27%" stroke="black" strokeWidth="1" fill="none" />
            
            {/* Vertical droppers */}
            <path d="M 20% 21% L 20% 30%" stroke="black" strokeWidth="0.5" fill="none" />
            <path d="M 80% 24% L 80% 35%" stroke="black" strokeWidth="0.5" fill="none" />
        </svg>
    )
}

export function MapTrashCan({ x, y }: { x: string | number, y: string | number }) {
    return (
        <div className="absolute z-20 w-3 h-4 bg-gray-700 border-r border-b border-black/60" style={{ left: x, top: y }}>
             {/* Lid */}
             <div className="absolute -top-1 -left-[1px] w-[110%] h-1 bg-gray-600 rounded-t-[1px] border-t border-white/20"></div>
             {/* Ribs */}
             <div className="absolute top-1 left-0 w-full h-[1px] bg-black/30"></div>
             <div className="absolute top-2 left-0 w-full h-[1px] bg-black/30"></div>
        </div>
    )
}

export function MapTrafficLight({ x, y, align = 'vertical', delay = 0 }: { x: string | number, y: string | number, align?: 'vertical' | 'horizontal', delay?: number }) {
    return (
        <div className="absolute z-30 pointer-events-none flex flex-col items-center" style={{ left: x, top: y }}>
            {/* Box */}
            <div className="bg-[#111] border border-gray-600 p-[1px] flex flex-col gap-[1px] shadow-sm">
                <Light color="#ff0000" activeColor="#ff3333" delay={delay} sequence={[1, 0, 0, 1]} />
                <Light color="#aaee00" activeColor="#ccff33" delay={delay} sequence={[0, 1, 0, 0]} />
                <Light color="#00aa00" activeColor="#00ff00" delay={delay} sequence={[0, 0, 1, 0]} />
            </div>
            {/* Pole */}
            <div className="w-[2px] h-8 bg-gray-800 -mt-[1px]"></div>
        </div>
    );
}

function Light({ color, activeColor, delay, sequence }: { color: string, activeColor: string, delay: number, sequence: number[] }) {
    return (
        <motion.div 
            className="w-2 h-2 rounded-[1px]"
            initial={{ backgroundColor: color }}
            animate={{ 
                backgroundColor: sequence.map(s => s ? activeColor : "#220000") // rough dimmed state
            }}
            transition={{ 
                duration: 8, 
                repeat: Infinity, 
                times: [0, 0.4, 0.5, 1], 
                delay: delay,
                ease: "linear" // Pixel feel
            }}
        />
    )
}

export function MapBike({ x, y, color = '#ccc' }: { x: string | number, y: string | number, color?: string }) {
    return (
        <div className="absolute z-20 w-6 h-4 opacity-90" style={{ left: x, top: y }}>
            {/* Wheels - Square approximation */}
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-black/80 rounded-[1px]"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-black/80 rounded-[1px]"></div>
            
            {/* Frame */}
            <div className="absolute bottom-1 left-1 w-3 h-1 bg-current" style={{ color }}></div>
            <div className="absolute bottom-1 left-1 w-1 h-2 bg-current origin-bottom -rotate-12" style={{ color }}></div>
             
             {/* Handlebars */}
             <div className="absolute top-0 right-1 w-1 h-[2px] bg-black"></div>
        </div>
    );
}

export function MapBusStop({ x, y }: { x: string | number, y: string | number }) {
    return (
        <div className="absolute z-20 group" style={{ left: x, top: y }}>
            {/* Bench - Iso view */}
            <div className="absolute bottom-0 left-0 w-8 h-2 bg-[#654321] border border-black/50 skew-x-12">
                <div className="absolute -top-1 left-0 w-full h-1 bg-[#8B4513] border border-black/30"></div>
            </div>
            {/* Sign Pole */}
            <div className="absolute bottom-0 -right-2 w-1 h-10 bg-gray-400">
                <div className="absolute top-0 -left-2 w-5 h-5 bg-blue-800 border-2 border-white flex items-center justify-center shadow-sm">
                    <div className="text-[6px] text-white font-bold">BUS</div>
                </div>
            </div>
            {/* Marking on ground */}
            <div className="absolute bottom-[-2px] -left-2 w-12 h-4 border-2 border-yellow-500/50 skew-x-12 pointer-events-none"></div>
        </div>
    );
}

export function MapTinyPerson({ x, y, color = '#eee', umbrellaColor = '#333' }: { x: string | number, y: string | number, color?: string, umbrellaColor?: string }) {
    return (
        <motion.div 
            className="absolute z-20 w-3 h-5"
            style={{ left: x, top: y }}
            animate={{ 
                x: [0, 15, 0],
            }}
            transition={{ 
                duration: 20 + Math.random() * 10, 
                repeat: Infinity,
                ease: "linear"
            }}
        >
            {/* Umbrella - Blocky */}
            <div className="absolute -top-1 -left-1 w-5 h-2 bg-current z-20 shadow-sm" style={{ color: umbrellaColor }}>
                 {/* Top pixel */}
                 <div className="absolute -top-1 left-2 w-1 h-1 bg-current" style={{ color: umbrellaColor }}></div>
            </div>
            
            {/* Body */}
            <div className="absolute top-2 left-1 w-2 h-2 z-10" style={{ backgroundColor: color }}></div>
            
            {/* Legs - Walking animation */}
            <motion.div 
                className="absolute top-4 left-1 w-1 h-2 bg-black"
                animate={{ height: [2, 1, 2], y: [0, 1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
                className="absolute top-4 right-1 w-1 h-2 bg-black"
                animate={{ height: [1, 2, 1], y: [1, 0, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 0.25, ease: "linear" }}
            />
        </motion.div>
    )
}

export function MapPigeons({ x, y }: { x: string | number, y: string | number }) {
    return (
        <div className="absolute z-20 w-4 h-4 pointer-events-none" style={{ left: x, top: y }}>
            {Array.from({ length: 3 }).map((_, i) => (
                <motion.div 
                    key={i}
                    className="absolute w-1 h-1 bg-gray-400"
                    style={{ left: i * 3, top: (i % 2) * 2 }}
                    animate={{ 
                        x: [0, Math.random() > 0.5 ? 2 : -2, 0],
                    }}
                    transition={{ 
                        duration: 0.2 + Math.random() * 0.4, 
                        repeat: Infinity,
                        repeatDelay: Math.random() * 3,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    )
}
