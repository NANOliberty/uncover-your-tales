import React from 'react';
import { motion } from 'motion/react';

export function PixelMapBuilding({ type, hovered }: { type: string, hovered: boolean }) {
    
    // Common props for pixel art SVGs
    const svgProps = {
        width: "100%",
        height: "100%",
        style: { imageRendering: 'pixelated' as const },
        preserveAspectRatio: "none"
    };

    if (type === 'ramen') {
        return (
            <div className="w-full h-full relative">
                {/* Glow Effect */}
                {hovered && <div className="absolute inset-0 bg-amber-500/30 blur-md z-0" />}
                <svg viewBox="0 0 20 20" {...svgProps} className="relative z-10 drop-shadow-lg">
                    {/* Base Building */}
                    <rect x="2" y="4" width="16" height="14" fill="#5d4037" /> {/* Wood brown */}
                    <rect x="2" y="2" width="16" height="4" fill="#8d6e63" /> {/* Roof */}
                    
                    {/* Entrance / Noren */}
                    <rect x="6" y="10" width="8" height="8" fill="#3e2723" /> {/* Door opening */}
                    <rect x="6" y="10" width="8" height="3" fill="#c62828" /> {/* Red Curtain */}
                    <rect x="7" y="11" width="1" height="1" fill="#fff" opacity="0.5" />
                    <rect x="9" y="11" width="1" height="1" fill="#fff" opacity="0.5" />
                    <rect x="11" y="11" width="1" height="1" fill="#fff" opacity="0.5" />

                    {/* Windows */}
                    <rect x="3" y="8" width="2" height="4" fill="#ffecb3" /> {/* Lit window */}
                    <rect x="15" y="8" width="2" height="4" fill="#ffecb3" />
                    
                    {/* Lanterns */}
                    <rect x="3" y="7" width="2" height="3" fill="#ff5252" />
                    <rect x="15" y="7" width="2" height="3" fill="#ff5252" />
                    
                    {/* Sign */}
                    <rect x="7" y="5" width="6" height="2" fill="#ffecb3" />
                    <rect x="8" y="5" width="4" height="1" fill="#c62828" />
                </svg>
            </div>
        );
    }

    if (type === 'record') {
        return (
            <div className="w-full h-full relative">
                {hovered && <div className="absolute inset-0 bg-blue-500/30 blur-md z-0" />}
                <svg viewBox="0 0 24 24" {...svgProps} className="relative z-10 drop-shadow-lg">
                    {/* Base */}
                    <rect x="2" y="2" width="20" height="20" fill="#263238" /> {/* Dark Blue-Grey */}
                    <rect x="2" y="2" width="20" height="4" fill="#37474f" /> {/* Top Trim */}
                    
                    {/* Window Display */}
                    <rect x="4" y="8" width="16" height="10" fill="#81d4fa" opacity="0.3" /> {/* Glass */}
                    <rect x="5" y="9" width="4" height="4" fill="#000" /> {/* Disc 1 */}
                    <rect x="6" y="10" width="2" height="2" fill="#29b6f6" />
                    
                    <rect x="10" y="9" width="4" height="4" fill="#000" /> {/* Disc 2 */}
                    <rect x="11" y="10" width="2" height="2" fill="#ff4081" />

                    <rect x="15" y="9" width="4" height="4" fill="#000" /> {/* Disc 3 */}
                    <rect x="16" y="10" width="2" height="2" fill="#76ff03" />

                    {/* Door */}
                    <rect x="10" y="14" width="4" height="8" fill="#455a64" />
                    
                    {/* Sign */}
                    <rect x="6" y="3" width="12" height="2" fill="#0288d1" />
                    <rect x="7" y="3" width="10" height="1" fill="#e1f5fe" />
                </svg>
            </div>
        );
    }

    if (type === 'convenience') {
        return (
            <div className="w-full h-full relative">
                {hovered && <div className="absolute inset-0 bg-white/30 blur-md z-0" />}
                <svg viewBox="0 0 30 15" {...svgProps} className="relative z-10 drop-shadow-lg">
                    {/* Base */}
                    <rect x="1" y="2" width="28" height="13" fill="#eeeeee" />
                    
                    {/* Stripe Top */}
                    <rect x="1" y="2" width="28" height="3" fill="#4caf50" /> {/* Green */}
                    <rect x="1" y="5" width="28" height="1" fill="#0288d1" /> {/* Blue line */}
                    
                    {/* Glass Front */}
                    <rect x="3" y="7" width="24" height="8" fill="#e1f5fe" />
                    <line x1="10" y1="7" x2="10" y2="15" stroke="#b3e5fc" strokeWidth="1" />
                    <line x1="20" y1="7" x2="20" y2="15" stroke="#b3e5fc" strokeWidth="1" />
                    
                    {/* Door */}
                    <rect x="13" y="7" width="4" height="8" fill="#81d4fa" stroke="#4fc3f7" strokeWidth="0.5" />
                    
                    {/* Light inside */}
                    <rect x="4" y="8" width="22" height="1" fill="#fff" opacity="0.8" />
                </svg>
            </div>
        );
    }

    if (type === 'arcade') {
        return (
            <div className="w-full h-full relative">
                {hovered && (
                    <motion.div 
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="absolute inset-0 bg-fuchsia-500/40 blur-md z-0" 
                    />
                )}
                <svg viewBox="0 0 24 24" {...svgProps} className="relative z-10 drop-shadow-lg">
                    {/* Base */}
                    <rect x="2" y="2" width="20" height="20" fill="#2a0a2e" /> {/* Dark Purple */}
                    
                    {/* Neon Trim */}
                    <rect x="2" y="2" width="20" height="20" rx="1" stroke="#e040fb" strokeWidth="1" fill="none" />
                    
                    {/* Screen / Marquee */}
                    <rect x="4" y="4" width="16" height="6" fill="#000" />
                    <rect x="5" y="5" width="14" height="4" fill="#d500f9" />
                    {/* Marquee dots */}
                    <rect x="6" y="6" width="1" height="1" fill="#fff" />
                    <rect x="17" y="6" width="1" height="1" fill="#fff" />

                    {/* Entrance */}
                    <path d="M 6 22 L 6 14 L 18 14 L 18 22" fill="#1a1a1a" />
                    
                    {/* Arcade Cabinet Hint */}
                    <rect x="7" y="16" width="3" height="4" fill="#00e5ff" opacity="0.7" />
                    <rect x="14" y="16" width="3" height="4" fill="#ff4081" opacity="0.7" />
                    
                    {/* Top Joystick Icon */}
                    <circle cx="12" cy="12" r="1.5" fill="#ffeb3b" />
                    <rect x="11.5" y="12" width="1" height="2" fill="#fff" />
                </svg>
            </div>
        );
    }

    if (type === 'rooftop') {
        return (
            <div className="w-full h-full relative">
                 {hovered && <div className="absolute inset-0 bg-white/10 blur-sm z-0" />}
                <svg viewBox="0 0 10 40" {...svgProps} className="relative z-10 drop-shadow-lg">
                    {/* Tall Building Side */}
                    <rect x="0" y="0" width="10" height="40" fill="#212121" />
                    
                    {/* Windows Vertical */}
                    {Array.from({ length: 8 }).map((_, i) => (
                        <rect key={i} x="2" y={4 + i * 4} width="6" height="2" fill={i === 0 || i === 7 ? "#424242" : "#303030"} />
                    ))}
                    
                    {/* Rooftop Surface (Top part) */}
                    <rect x="0" y="0" width="10" height="4" fill="#424242" />
                    
                    {/* Fence */}
                    <rect x="0" y="0" width="10" height="1" fill="#757575" />
                    
                    {/* Antenna */}
                    <rect x="4" y="-3" width="1" height="4" fill="#9e9e9e" />
                    <rect x="3" y="-3" width="3" height="0.5" fill="#f44336" className="animate-pulse" /> {/* Blinking light */}
                    
                    {/* Door to roof */}
                    <rect x="2" y="1" width="2" height="2" fill="#616161" />
                </svg>
            </div>
        );
    }

    return <div className="w-full h-full bg-gray-800" />;
}
