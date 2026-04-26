import React from 'react';
import { motion } from 'motion/react';

// ─── Character reference: scale=4 → 64×96px. Doors target ≥110px tall. ────────
// Buildings target 460–520px tall for 3-4 visible floors.

// ─── Shared sub-components ────────────────────────────────────────────────────

/** Framed window with cross-mullion and optional interior color/glow */
function BuildingWindow({
    w = 64, h = 72, frameColor, frameW = 5,
    glassColor, glowColor, children,
}: {
    w?: number; h?: number; frameColor: string; frameW?: number;
    glassColor: string; glowColor?: string; children?: React.ReactNode;
}) {
    return (
        <div style={{
            width: w, height: h, border: `${frameW}px solid ${frameColor}`,
            backgroundColor: glassColor, position: 'relative', overflow: 'hidden', flexShrink: 0,
            boxShadow: glowColor ? `0 0 16px ${glowColor}55, inset 0 0 10px ${glowColor}22` : undefined,
        }}>
            {/* Mullion cross */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: frameW, backgroundColor: frameColor, transform: 'translateX(-50%)' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: frameW, backgroundColor: frameColor, transform: 'translateY(-50%)' }} />
            {/* Highlight */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '30%', height: '100%', background: 'linear-gradient(90deg, rgba(255,255,255,0.12), transparent)' }} />
            {children}
        </div>
    );
}

/** Solid entrance door with frame and handle */
function EntranceDoor({
    w = 78, h = 116, frameColor, doorColor, handleColor = '#888',
    children, step = true,
}: {
    w?: number; h?: number; frameColor: string; doorColor: string;
    handleColor?: string; children?: React.ReactNode; step?: boolean;
}) {
    return (
        <div style={{ width: w, position: 'relative', flexShrink: 0 }}>
            {/* Frame */}
            <div style={{
                width: w, height: h, border: `6px solid ${frameColor}`,
                backgroundColor: doorColor, position: 'relative', overflow: 'hidden',
            }}>
                {/* Panel line */}
                <div style={{ position: 'absolute', top: '55%', left: 6, right: 6, height: 2, backgroundColor: frameColor, opacity: 0.4 }} />
                {/* Handle */}
                <div style={{ position: 'absolute', right: 10, top: '35%', width: 4, height: 22, backgroundColor: handleColor, borderRadius: 2, opacity: 0.9 }} />
                {/* Glass top panel highlight */}
                <div style={{ position: 'absolute', top: 6, left: 6, right: 6, height: '40%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.07), transparent)' }} />
                {children}
            </div>
            {/* Step */}
            {step && <div style={{ position: 'absolute', bottom: -6, left: -8, right: -8, height: 6, backgroundColor: frameColor, opacity: 0.7 }} />}
        </div>
    );
}

/** Neon sign bar */
function NeonSign({
    text, color, bg = '#000', fontSize = 18, px = 16, py = 8, subText,
}: {
    text: string; color: string; bg?: string; fontSize?: number; px?: number; py?: number; subText?: string;
}) {
    return (
        <motion.div
            animate={{ boxShadow: [`0 0 10px ${color}88, 0 0 24px ${color}44`, `0 0 18px ${color}cc, 0 0 40px ${color}66`, `0 0 10px ${color}88, 0 0 24px ${color}44`] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ backgroundColor: bg, border: `2px solid ${color}`, padding: `${py}px ${px}px`, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
        >
            <span style={{ color, fontFamily: 'monospace', fontWeight: 900, fontSize, letterSpacing: '0.2em', lineHeight: 1, textShadow: `0 0 8px ${color}` }}>{text}</span>
            {subText && <span style={{ color, fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.3em', opacity: 0.75 }}>{subText}</span>}
        </motion.div>
    );
}

/** Enhanced vending machine */
function VendingMachine({
    headerBg, headerLabel, glowColor, products, width = 54, height = 160,
}: {
    headerBg: string; headerLabel: string; glowColor: string;
    products: { bg: string; label: string; price: string }[][];
    width?: number; height?: number;
}) {
    return (
        <div style={{ width, height, backgroundColor: '#0d1020', border: `2px solid ${glowColor}55`, position: 'relative', overflow: 'hidden', flexShrink: 0, boxShadow: `0 0 16px ${glowColor}22` }}>
            <div style={{ width: '100%', height: 18, backgroundColor: headerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${glowColor}44` }}>
                <span style={{ fontSize: 7, fontWeight: 900, color: '#fff', fontFamily: 'monospace', letterSpacing: 1 }}>{headerLabel}</span>
            </div>
            <motion.div animate={{ boxShadow: [`inset 0 0 20px ${glowColor}22`, `inset 0 0 32px ${glowColor}44`, `inset 0 0 20px ${glowColor}22`] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{ margin: '3px 3px 0', backgroundColor: '#060810', border: `1px solid ${glowColor}44`, padding: 2 }}>
                {products.map((row, ri) => (
                    <div key={ri} style={{ display: 'flex', gap: 2, marginBottom: 2, height: Math.floor((height * 0.5) / products.length) - 4, alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#0a0d18', border: '1px solid rgba(255,255,255,0.06)', padding: '0 2px' }}>
                        {row.map((p, pi) => (
                            <div key={pi} style={{ flex: 1, height: '80%', backgroundColor: p.bg, borderRadius: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 1 }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.28), transparent)' }} />
                                <span style={{ fontSize: 4, color: 'rgba(255,255,255,0.9)', fontFamily: 'monospace', fontWeight: 700, lineHeight: 1, zIndex: 1 }}>{p.label}</span>
                                <span style={{ fontSize: 4, color: '#ffff00', fontFamily: 'monospace', lineHeight: 1, zIndex: 1 }}>{p.price}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </motion.div>
            <div style={{ margin: '3px 3px 0', display: 'grid', gridTemplateColumns: `repeat(${products[0]?.length || 3}, 1fr)`, gap: 2 }}>
                {products.flat().map((_, i) => (
                    <div key={i} style={{ height: 8, backgroundColor: '#0a1428', border: `1px solid ${glowColor}33`, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: glowColor, opacity: 0.8, boxShadow: `0 0 4px ${glowColor}` }} />
                    </div>
                ))}
            </div>
            <div style={{ margin: '3px 3px 0', height: 14, backgroundColor: '#060810', border: `1px solid ${glowColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ width: 14, height: 3, backgroundColor: '#111', border: '1px solid #333', borderRadius: 1 }} />
                    <div style={{ width: 18, height: 5, backgroundColor: '#0a0a1a', border: '1px solid #222' }} />
                </div>
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <span style={{ fontSize: 6, color: '#00ff88', fontFamily: 'monospace', fontWeight: 700 }}>¥___</span>
                </motion.div>
            </div>
            <div style={{ margin: '2px 4px 0', height: 8, backgroundColor: '#040608', border: `1px solid ${glowColor}22`, borderRadius: 1 }} />
            <motion.div animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ position: 'absolute', top: '12%', bottom: '6%', left: 1, width: 1, backgroundColor: glowColor, boxShadow: `0 0 3px ${glowColor}` }} />
            <motion.div animate={{ opacity: [0.9, 0.3, 0.9] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ position: 'absolute', top: '12%', bottom: '6%', right: 1, width: 1, backgroundColor: glowColor, boxShadow: `0 0 3px ${glowColor}` }} />
        </div>
    );
}

/** Enhanced ATM */
function ATMUnit() {
    return (
        <div style={{ width: 48, height: 120, backgroundColor: '#0e1420', border: '2px solid #1e2840', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)' }}>
            <div style={{ position: 'absolute', top: -4, left: -4, right: -4, height: 8, backgroundColor: '#0a0e1a' }} />
            <div style={{ width: '100%', height: 16, backgroundColor: '#061a40', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1a3a80', flexDirection: 'column' }}>
                <span style={{ fontSize: 6, color: '#4488ff', fontFamily: 'monospace', fontWeight: 900, letterSpacing: 1 }}>BANK ATM</span>
                <span style={{ fontSize: 4, color: '#2255aa', fontFamily: 'monospace' }}>24時間</span>
            </div>
            <motion.div animate={{ boxShadow: ['0 0 6px rgba(0,200,100,0.3)', '0 0 14px rgba(0,200,100,0.5)', '0 0 6px rgba(0,200,100,0.3)'] }} transition={{ duration: 3, repeat: Infinity }}
                style={{ margin: '3px 3px 2px', height: 28, backgroundColor: '#001408', border: '1px solid #00aa44', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <motion.div animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 2.4, repeat: Infinity }}>
                    <div style={{ fontSize: 4, color: '#00dd77', fontFamily: 'monospace', textAlign: 'center', lineHeight: 1.5 }}>
                        <div>いらっしゃいませ</div>
                        <div style={{ color: '#00ff88', fontWeight: 700 }}>▶ カードをどうぞ</div>
                    </div>
                </motion.div>
            </motion.div>
            <div style={{ margin: '0 5px 2px', height: 5, backgroundColor: '#050c14', border: '1px solid #2244aa', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <div style={{ fontSize: 4, color: '#3366cc', fontFamily: 'monospace' }}>▷</div>
                <div style={{ flex: 1, height: 2, backgroundColor: '#0a1830' }} />
            </div>
            <div style={{ margin: '1px 4px 2px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                {['7','8','9','4','5','6','1','2','3','*','0','#'].map((k, ki) => (
                    <div key={ki} style={{ height: 7, backgroundColor: ki >= 9 ? '#0a1428' : '#0e1e3a', border: `1px solid ${ki >= 9 ? '#1a2a3e' : '#1e3460'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                        <span style={{ fontSize: 4.5, color: ki >= 9 ? '#445577' : '#6688cc', fontFamily: 'monospace' }}>{k}</span>
                    </div>
                ))}
            </div>
            <div style={{ margin: '0 4px 1px', display: 'flex', gap: 2 }}>
                {[['取消','#aa1122'],['確認','#118833']].map(([l,c],i) => (
                    <div key={i} style={{ flex: 1, height: 7, backgroundColor: `${c}33`, border: `1px solid ${c}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                        <span style={{ fontSize: 4, color: c, fontFamily: 'monospace', fontWeight: 700 }}>{l}</span>
                    </div>
                ))}
            </div>
            <div style={{ margin: '1px 4px 0', height: 4, backgroundColor: '#04080e', border: '1px solid #1a2234' }} />
            <div style={{ margin: '1px 8px 0', height: 3, backgroundColor: '#04060c', border: '1px solid #111' }} />
        </div>
    );
}

// ─── Common props ─────────────────────────────────────────────────────────────
interface FacadeProps { x: number; active?: boolean; }

// ─────────────────────────────────────────────────────────────────────────────
// RAMEN SHOP
// Traditional dark-wood izakaya. 3 floors. Proper 115px door with noren.
// ─────────────────────────────────────────────────────────────────────────────

/** Decorative giant ramen-bowl statue on a stone pedestal */
function RamenBowlStatue() {
    return (
        <div style={{ position: 'absolute', bottom: 0, left: 272, width: 118, height: 210, zIndex: 25 }}>

            {/* ── Drop shadow ── */}
            <div style={{ position: 'absolute', bottom: -4, left: 14, right: 6, height: 8, backgroundColor: 'rgba(0,0,0,0.28)', filter: 'blur(4px)' }} />

            {/* ── Pedestal base (widest) ── */}
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 112, height: 24 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #8a8a8a 0%, #676767 100%)', border: '3px solid #444' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 5, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, backgroundColor: 'rgba(0,0,0,0.2)' }} />
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.5) 6px, rgba(255,255,255,0.5) 7px)' }} />
                </div>
            </div>

            {/* ── Pedestal mid (with bronze plaque) ── */}
            <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', width: 92, height: 30 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #9e9e9e 0%, #787878 100%)', border: '2px solid #555' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: 'rgba(255,255,255,0.18)' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: 'rgba(255,255,255,0.12)' }} />
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.5) 5px, rgba(255,255,255,0.5) 6px)' }} />
                    {/* Bronze plaque */}
                    <div style={{ position: 'absolute', inset: '2px 9px', background: 'linear-gradient(135deg, #c8a96a, #9a7840)', border: '1.5px solid #7a5828', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <span style={{ fontSize: 11, lineHeight: 1, color: '#1a0e04', fontFamily: 'monospace', fontWeight: 900, letterSpacing: 2, textAlign: 'center', textShadow: '0 1px 0 rgba(255,220,120,0.4)' }}>一蘭</span>
                        <span style={{ fontSize: 7, lineHeight: 1, color: '#3a2006', fontFamily: 'monospace', letterSpacing: 1, textAlign: 'center' }}>RAMEN</span>
                    </div>
                </div>
            </div>

            {/* ── Pedestal top cap ── */}
            <div style={{ position: 'absolute', bottom: 54, left: '50%', transform: 'translateX(-50%)', width: 78, height: 10 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #b8b8b8, #8a8a8a)', border: '2px solid #555' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.22)' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: 'rgba(255,255,255,0.12)' }} />
                </div>
            </div>

            {/* ── Chopsticks (resting over bowl rim) ── */}
            <div style={{ position: 'absolute', bottom: 140, left: 2, right: 2, height: 14, zIndex: 30, transform: 'rotate(-9deg)', transformOrigin: 'left center' }}>
                <div style={{ position: 'absolute', top: 1, left: 0, right: 0, height: 4, background: 'linear-gradient(to bottom, #a0530a, #7a3c08)', borderRadius: 2, boxShadow: '0 2px 0 #3a1a04' }}>
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 14, background: 'linear-gradient(to right, #b83228, #8a1e18)', borderRadius: '0 2px 2px 0' }} />
                    <div style={{ position: 'absolute', left: 0, top: 0, width: '40%', bottom: 0, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px 0 0 2px' }} />
                </div>
                <div style={{ position: 'absolute', bottom: 1, left: 0, right: 0, height: 4, background: 'linear-gradient(to bottom, #8c4808, #6a3006)', borderRadius: 2, boxShadow: '0 2px 0 #3a1a04' }}>
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 14, background: 'linear-gradient(to right, #b83228, #8a1e18)', borderRadius: '0 2px 2px 0' }} />
                </div>
            </div>

            {/* ── Bowl SVG ── */}
            <svg
                style={{ position: 'absolute', bottom: 58, left: '50%', transform: 'translateX(-50%)', overflow: 'visible' }}
                width="106" height="96"
                viewBox="0 0 106 96"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="rsBowlBody" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"   stopColor="#7f0000" />
                        <stop offset="18%"  stopColor="#c62828" />
                        <stop offset="82%"  stopColor="#c62828" />
                        <stop offset="100%" stopColor="#7f0000" />
                    </linearGradient>
                    <radialGradient id="rsRim" cx="50%" cy="38%">
                        <stop offset="0%"   stopColor="#ffe566" />
                        <stop offset="100%" stopColor="#d4920e" />
                    </radialGradient>
                    <radialGradient id="rsBroth" cx="42%" cy="36%">
                        <stop offset="0%"   stopColor="#e8cc88" />
                        <stop offset="55%"  stopColor="#c0a040" />
                        <stop offset="100%" stopColor="#7a5810" />
                    </radialGradient>
                    <clipPath id="rsRimClip">
                        <ellipse cx="53" cy="17" rx="38" ry="7.8" />
                    </clipPath>
                </defs>

                {/* Bowl body drop-shadow */}
                <path d="M 12,20 L 98,20 L 84,86 Q 53,102 22,86 Z" fill="rgba(0,0,0,0.35)" transform="translate(3,3)" />
                {/* Bowl body */}
                <path d="M 12,20 L 94,20 L 80,84 Q 52,100 22,84 Z" fill="url(#rsBowlBody)" />
                {/* Left depth */}
                <path d="M 12,20 L 22,84 Q 15,62 13,42 Z" fill="#6d0000" opacity="0.8" />
                {/* Right depth */}
                <path d="M 94,20 L 80,84 Q 88,62 92,42 Z" fill="#6d0000" opacity="0.8" />
                {/* Bowl bottom curve edge */}
                <path d="M 22,84 Q 52,100 80,84 L 78,90 Q 52,106 24,90 Z" fill="#5a0000" />
                {/* Soft highlight on left face */}
                <path d="M 15,26 Q 16,52 20,68" stroke="rgba(255,255,255,0.16)" strokeWidth="9" strokeLinecap="round" />

                {/* Traditional wave pattern 1 */}
                <path d="M 17,38 Q 27,29 37,38 Q 47,47 57,38 Q 67,29 77,38 Q 84,44 90,38"
                    stroke="rgba(255,228,100,0.52)" strokeWidth="2.6" fill="none" />
                {/* Traditional wave pattern 2 */}
                <path d="M 17,54 Q 27,45 37,54 Q 47,63 57,54 Q 67,45 77,54 Q 83,60 88,54"
                    stroke="rgba(255,228,100,0.36)" strokeWidth="2.1" fill="none" />
                {/* Traditional wave pattern 3 */}
                <path d="M 19,68 Q 28,60 37,68 Q 46,76 55,68 Q 64,60 73,68 Q 79,74 82,70"
                    stroke="rgba(255,228,100,0.2)" strokeWidth="1.6" fill="none" />

                {/* Black shadow under rim */}
                <ellipse cx="53" cy="20" rx="43" ry="10.5" fill="#180000" />
                {/* Gold rim */}
                <ellipse cx="53" cy="18.5" rx="42" ry="10" fill="url(#rsRim)" />
                {/* Rim inner bevel */}
                <ellipse cx="53" cy="20" rx="39" ry="8.2" fill="#8B0000" opacity="0.55" />
                {/* Rim sheen */}
                <ellipse cx="46" cy="15" rx="26" ry="3.5" fill="rgba(255,255,255,0.3)" />

                {/* Broth surface */}
                <ellipse cx="53" cy="18" rx="38" ry="7.5" fill="url(#rsBroth)" />
                {/* Oily sheen on broth */}
                <ellipse cx="44" cy="15" rx="18" ry="3.5" fill="rgba(255,220,80,0.18)" />

                {/* Noodle waves + toppings, clipped to bowl interior */}
                <g clipPath="url(#rsRimClip)">
                    <path d="M 20,18 Q 27,12 34,18 Q 41,24 48,18 Q 55,12 62,18 Q 69,24 76,18 Q 82,13 88,17"
                        stroke="#f5deb3" strokeWidth="2.2" fill="none" opacity="0.8" />
                    <path d="M 22,21 Q 29,16 36,21 Q 43,26 50,21 Q 57,16 64,21 Q 70,25 76,21"
                        stroke="#e8d090" strokeWidth="1.7" fill="none" opacity="0.6" />
                    <path d="M 18,24 Q 25,20 32,24 Q 39,28 46,24 Q 53,20 60,24 Q 65,27 70,24"
                        stroke="#f0d8a0" strokeWidth="1.4" fill="none" opacity="0.4" />

                    {/* Chashu pork slice */}
                    <rect x="18" y="11" width="20" height="12" rx="3" fill="#5d1a0a" />
                    <rect x="18" y="14.5" width="20" height="3" fill="#ffccbc" opacity="0.55" />
                    <rect x="18" y="19" width="20" height="2" fill="#ffccbc" opacity="0.25" />
                    <line x1="23" y1="11" x2="23" y2="23" stroke="#3e0a05" strokeWidth="1" opacity="0.4" />
                    <line x1="28" y1="11" x2="28" y2="23" stroke="#3e0a05" strokeWidth="1" opacity="0.4" />
                    <line x1="33" y1="11" x2="33" y2="23" stroke="#3e0a05" strokeWidth="1" opacity="0.4" />

                    {/* Ajitsuke tamago (halved egg) */}
                    <ellipse cx="53" cy="15" rx="7.5" ry="6.5" fill="#fff9e6" stroke="#f0d890" strokeWidth="1.2" />
                    <ellipse cx="53" cy="15" rx="4.8" ry="4.2" fill="#ff9800" />
                    <ellipse cx="53" cy="14.5" rx="2.8" ry="2.5" fill="#bf360c" />
                    <ellipse cx="51" cy="13"  rx="1.2" ry="0.8" fill="rgba(255,255,255,0.4)" />

                    {/* Nori sheet */}
                    <rect x="64" y="9" width="8" height="17" rx="1" fill="#192e19" />
                    <rect x="64" y="9" width="8" height="6"  fill="#2a5230" opacity="0.5" />
                    <line x1="68" y1="9" x2="68" y2="26" stroke="#0a1a0a" strokeWidth="1" opacity="0.5" />
                    <rect x="65" y="12" width="6" height="1.5" fill="rgba(100,200,100,0.2)" />
                    <rect x="65" y="16" width="6" height="1.5" fill="rgba(100,200,100,0.15)" />

                    {/* Negi (green onions) */}
                    <rect x="74" y="12" width="4" height="9" rx="2" fill="#66bb6a" transform="rotate(-8 76 16)" />
                    <rect x="79" y="12" width="4" height="9" rx="2" fill="#43a047" transform="rotate(5 81 16)" />
                    <rect x="84" y="13" width="3" height="8" rx="1.5" fill="#66bb6a" transform="rotate(-4 85 17)" />

                    {/* Narutomaki (fish cake) */}
                    <circle cx="32" cy="23" r="5.5" fill="white" stroke="#e0e0e0" strokeWidth="0.8" />
                    <path d="M 28,21 Q 32,25.5 36,21" stroke="#f48fb1" strokeWidth="2.8" fill="none" />
                    <circle cx="32" cy="23" r="1.6" fill="#f48fb1" />
                    <circle cx="32" cy="23" r="0.7" fill="white" />

                    {/* Menma bamboo shoot */}
                    <rect x="44" y="21" width="14" height="6" rx="2" fill="#c8a840" stroke="#9a7828" strokeWidth="0.8" />
                    <line x1="47" y1="21" x2="47" y2="27" stroke="#9a7828" strokeWidth="1" opacity="0.5" />
                    <line x1="51" y1="21" x2="51" y2="27" stroke="#9a7828" strokeWidth="1" opacity="0.5" />
                    <line x1="55" y1="21" x2="55" y2="27" stroke="#9a7828" strokeWidth="1" opacity="0.5" />
                </g>
            </svg>

            {/* ── Steam puffs ── */}
            {[
                { left: 26, bottom: 156, delay: 0.0, dur: 2.4, size: 11 },
                { left: 44, bottom: 153, delay: 0.7, dur: 2.0, size: 14 },
                { left: 62, bottom: 157, delay: 0.3, dur: 2.7, size: 10 },
                { left: 80, bottom: 154, delay: 1.2, dur: 2.2, size: 12 },
                { left: 35, bottom: 150, delay: 1.7, dur: 2.5, size:  9 },
                { left: 71, bottom: 151, delay: 0.9, dur: 2.1, size: 10 },
            ].map(({ left, bottom, delay, dur, size }, i) => (
                <motion.div key={i}
                    style={{
                        position: 'absolute',
                        bottom,
                        left,
                        width: size,
                        height: size,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.38)',
                        filter: 'blur(3.5px)',
                    }}
                    animate={{ y: [0, -58], opacity: [0, 0.88, 0], scale: [0.7, 2.2] }}
                    transition={{ duration: dur, repeat: Infinity, delay, ease: 'easeOut' }}
                />
            ))}
        </div>
    );
}

export function RamenFacade({ x, active }: FacadeProps) {
    const W = 280, H = 500;
    const WOOD    = '#3a2215';
    const WOOD2   = '#4e2e1a';
    const FRAME   = '#2a1508';
    const TILE    = '#1a0e06';
    const WARM    = '#ffd080';
    const RED     = '#b71c1c';

    return (
        <div className="absolute bottom-0 z-10" style={{ left: x, width: W, height: H }}>

            {/* ── BODY ── */}
            <div className="absolute bottom-0 w-full h-full overflow-hidden" style={{ backgroundColor: WOOD, border: `4px solid ${FRAME}` }}>
                {/* Vertical wood grain */}
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 18px, #000 18px, #000 20px)` }} />

                {/* ── ROOF EAVES ── */}
                <div className="absolute top-0 left-0 right-0 h-[46px] z-30" style={{ backgroundColor: TILE }}>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 22px,#1a1a1a 22px,#1a1a1a 24px)' }} />
                    {/* Eave underside line */}
                    <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: WOOD2 }} />
                    {/* Corner brackets */}
                    <div className="absolute bottom-0 left-2 w-6 h-4 border-r-2 border-b-2" style={{ borderColor: WOOD2 }} />
                    <div className="absolute bottom-0 right-2 w-6 h-4 border-l-2 border-b-2" style={{ borderColor: WOOD2 }} />
                </div>

                {/* ── 3RD FLOOR WINDOWS ── */}
                <div className="absolute top-[52px] left-0 right-0 h-[100px] flex items-center justify-around px-6">
                    {[{ lit: true, glow: WARM }, { lit: false, glow: '' }, { lit: true, glow: WARM }].map((w, i) => (
                        <BuildingWindow key={i} w={64} h={72} frameColor={FRAME} glassColor={w.lit ? WARM : '#1a0e06'} glowColor={w.lit ? w.glow : undefined}>
                            {w.lit && <div style={{ position: 'absolute', bottom: 4, left: 8, width: 20, height: 28, backgroundColor: `${FRAME}55`, borderRadius: '50% 50% 0 0' }} />}
                        </BuildingWindow>
                    ))}
                </div>

                {/* ── FLOOR SEPARATOR BAND ── */}
                <div className="absolute left-0 right-0 h-[14px]" style={{ top: 152, backgroundColor: FRAME, zIndex: 10 }}>
                    {/* String lights */}
                    {[18,46,74,102,130,158,186,214,242].map((lx, i) => (
                        <motion.div key={i} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.14 }}
                            style={{ position: 'absolute', bottom: 2, left: lx, width: 7, height: 7, borderRadius: '50%', backgroundColor: ['#ff6f00','#ffca28','#f44336','#7c4dff','#00bcd4'][i % 5], boxShadow: '0 0 5px currentColor' }} />
                    ))}
                </div>

                {/* ── 2ND FLOOR / AWNING ── */}
                <div className="absolute left-0 right-0 h-[100px]" style={{ top: 166 }}>
                    {/* Awning */}
                    <div className="absolute top-0 left-0 right-0 h-[36px] z-20" style={{ background: `linear-gradient(180deg, #8d6e63, #6d4c41)`, clipPath: 'polygon(0 0,100% 0,97% 100%,3% 100%)' }}>
                        <div className="absolute bottom-0 left-0 right-0 flex">
                            {Array.from({ length: 18 }).map((_, i) => (
                                <div key={i} className="flex-1 h-4 border-r border-[#4a2e1a]" style={{ clipPath: 'polygon(0 0,100% 0,50% 100%)', backgroundColor: '#7c5c53' }} />
                            ))}
                        </div>
                    </div>
                    {/* Neon sign below awning */}
                    <div className="absolute top-[40px] left-0 right-0 flex justify-center z-20">
                        <NeonSign text="一蘭 RAMEN" color="#ff6f00" bg="#1a0a08" fontSize={16} subText="本格博多とんこつ" />
                    </div>
                </div>

                {/* ── FLOOR SEPARATOR 2 ── */}
                <div className="absolute left-0 right-0 h-[12px]" style={{ top: 266, backgroundColor: FRAME }} />

                {/* ── GROUND FLOOR ── */}
                <div className="absolute bottom-0 left-0 right-0 h-[220px]">
                    {/* Left wall */}
                    <div className="absolute top-0 bottom-0 left-0 w-[72px]" style={{ backgroundColor: WOOD2 }}>
                        {/* Left window */}
                        <div className="absolute top-[14px] left-[8px]">
                            <BuildingWindow w={56} h={68} frameColor={FRAME} glassColor={WARM} glowColor={WARM}>
                                {/* Silhouette */}
                                <div style={{ position: 'absolute', bottom: 6, right: 6, width: 18, height: 32, backgroundColor: `${FRAME}60`, borderRadius: '50% 50% 0 0' }} />
                            </BuildingWindow>
                        </div>
                    </div>

                    {/* Center entrance */}
                    <div className="absolute top-0 bottom-0" style={{ left: 72, right: 72, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Top beam */}
                        <div className="w-full h-[16px]" style={{ backgroundColor: FRAME }} />
                        {/* Door */}
                        <div className="flex items-start justify-center pt-[10px]">
                            <EntranceDoor w={100} h={130} frameColor={FRAME} doorColor="#1e0e08" handleColor="#8d6e63" step={true}>
                                {/* Noren curtains */}
                                <div className="absolute top-0 left-0 right-0 h-[52px] flex">
                                    <div className="flex-1 h-full flex items-center justify-center border-r border-[#7f0000]" style={{ backgroundColor: RED }}>
                                        <span className="text-white font-black" style={{ fontSize: 14 }}>ラー</span>
                                    </div>
                                    <div className="flex-1 h-full flex items-center justify-center" style={{ backgroundColor: RED }}>
                                        <span className="text-white font-black" style={{ fontSize: 14 }}>メン</span>
                                    </div>
                                </div>
                                {/* Interior glimpse below noren */}
                                <div className="absolute left-0 right-0 bottom-0" style={{ top: 52, background: 'linear-gradient(180deg, #200c06, #2d1b15)' }}>
                                    <div className="absolute bottom-0 w-full h-[22px]" style={{ backgroundColor: '#8d6e63', borderTop: '3px solid #a1887f' }} />
                                    <div className="absolute bottom-[22px] left-2 w-[18px] h-[10px] bg-[#a1887f] rounded-t-sm" />
                                    <div className="absolute bottom-[22px] right-2 w-[18px] h-[10px] bg-[#a1887f] rounded-t-sm" />
                                </div>
                            </EntranceDoor>
                        </div>
                    </div>

                    {/* Right wall */}
                    <div className="absolute top-0 bottom-0 right-0 w-[72px]" style={{ backgroundColor: WOOD2 }}>
                        {/* Right window */}
                        <div className="absolute top-[14px] right-[8px]">
                            <BuildingWindow w={56} h={68} frameColor={FRAME} glassColor={WARM} glowColor={WARM}>
                                <div style={{ position: 'absolute', bottom: 6, left: 6, width: 18, height: 32, backgroundColor: `${FRAME}60`, borderRadius: '50% 50% 0 0' }} />
                            </BuildingWindow>
                        </div>
                        {/* Lantern */}
                        <motion.div className="absolute bottom-[30px] right-[20px] origin-top" animate={{ rotate: [3, -3, 3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                            <div className="w-2 h-2 bg-black mx-auto" />
                            <div className="w-10 h-16 flex items-center justify-center rounded-lg" style={{ background: 'linear-gradient(180deg, #ffca28, #ff6f00)', border: '2px solid #e65100', boxShadow: '0 0 18px #ff6f00' }}>
                                <span className="text-red-900 font-black" style={{ fontSize: 16 }}>麺</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Floor tiles at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[12px]" style={{ background: `repeating-linear-gradient(90deg, ${FRAME}, ${FRAME} 1px, ${WOOD} 1px, ${WOOD} 36px)` }} />
                </div>

                {/* Steam */}
                <div className="absolute pointer-events-none" style={{ bottom: H * 0.6, left: '38%' }}>
                    {[0,1,2].map(i => (
                        <motion.div key={i} className="absolute rounded-full blur-md" style={{ width: 10+i*4, height: 10+i*4, backgroundColor: 'rgba(255,255,255,0.25)', left: i * 8 }}
                            animate={{ y: [0, -50], opacity: [0, 0.5, 0], scale: [1, 2.2] }}
                            transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.6 }} />
                    ))}
                </div>
            </div>

            {/* Hanging lantern top-left */}
            <motion.div className="absolute z-30" style={{ top: 40, left: -14 }} animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
                <div className="w-2 h-2 bg-black mx-auto" />
                <div className="w-10 h-14 flex items-center justify-center rounded-lg" style={{ background: 'linear-gradient(180deg, #ffca28, #ff6f00)', border: '2px solid #e65100', boxShadow: '0 0 18px #ff6f00' }}>
                    <span className="text-red-900 font-black" style={{ fontSize: 16 }}>酒</span>
                </div>
            </motion.div>

            {/* ── Sidewalk menu stand (outside overflow-hidden so it never clips) ── */}
            <div style={{ position: 'absolute', bottom: 0, left: -92, width: 82, height: 140, zIndex: 22 }}>
                {/* A-frame legs */}
                <div style={{ position: 'absolute', bottom: 0, left: 10, width: 4, height: 22, backgroundColor: '#5d4037', transform: 'rotate(-8deg)', transformOrigin: 'bottom' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 10, width: 4, height: 22, backgroundColor: '#5d4037', transform: 'rotate(8deg)', transformOrigin: 'bottom' }} />
                {/* Menu board body */}
                <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, top: 0, backgroundColor: '#180800', border: '3px solid #2a1508', borderRadius: 2, overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ width: '100%', height: 28, backgroundColor: '#b71c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid #7f0000' }}>
                        <span style={{ color: 'white', fontFamily: 'monospace', fontWeight: 900, fontSize: 11, letterSpacing: 3 }}>MENU</span>
                    </div>
                    {/* Sub-header in Japanese */}
                    <div style={{ width: '100%', height: 16, backgroundColor: '#2a0e00', borderBottom: '1px solid #3a1508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#ffcc80', fontFamily: 'monospace', fontSize: 7, letterSpacing: 1 }}>本日のおすすめ</span>
                    </div>
                    {/* Divider */}
                    <div style={{ height: 1, backgroundColor: '#ff6f00', opacity: 0.5, margin: '3px 6px' }} />
                    {/* Menu items — generous sizing so nothing clips */}
                    {[
                        { name: '拉　麺', price: '¥850' },
                        { name: '醤　油', price: '¥900' },
                        { name: '味　噌', price: '¥900' },
                        { name: '塩　味', price: '¥880' },
                        { name: 'チャーシュー', price: '¥1,100' },
                    ].map(({ name, price }, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 4px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            <span style={{ fontSize: 7.5, color: '#ffe0b2', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{name}</span>
                            <span style={{ fontSize: 7.5, color: '#ffcc02', fontFamily: 'monospace', whiteSpace: 'nowrap', marginLeft: 2 }}>{price}</span>
                        </div>
                    ))}
                    {/* Stamp */}
                    <div style={{ position: 'absolute', bottom: 5, right: 5, width: 22, height: 22, borderRadius: '50%', border: '2px solid #cc3300', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-12deg)', opacity: 0.8 }}>
                        <span style={{ fontSize: 7, color: '#cc3300', fontFamily: 'monospace', fontWeight: 900 }}>人気!</span>
                    </div>
                </div>
            </div>

            {/* ── Giant ramen bowl statue to the right ── */}
            <RamenBowlStatue />

            <Prompt active={active} color="bg-red-500" label="ENTER RAMEN SHOP" />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECORD STORE
// Dark brick building. Bold cyan neon. Big shop window + proper glass door.
// ────────────────────────────────────���────────────────────────────────────────
export function RecordFacade({ x, active }: FacadeProps) {
    const W = 270, H = 480;
    const BRICK   = '#0d1020';
    const FRAME   = '#07080e';
    const CYAN    = '#00bcd4';
    const PINK    = '#ff4081';

    return (
        <div className="absolute bottom-0 z-10" style={{ left: x, width: W, height: H }}>
            <div className="absolute bottom-0 w-full h-full overflow-hidden" style={{ backgroundColor: BRICK, border: `4px solid ${FRAME}` }}>
                {/* Brick pattern */}
                <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 10px,#000 10px,#000 11px), repeating-linear-gradient(90deg,transparent,transparent 20px,#000 20px,#000 21px)', backgroundSize: '40px 22px' }} />

                {/* ── ROOF: Studio windows ── */}
                <div className="absolute top-0 left-0 right-0 h-[110px]" style={{ backgroundColor: '#0a0c1a', borderBottom: `4px solid ${FRAME}` }}>
                    {/* Recording indicator */}
                    <div className="absolute top-3 left-0 right-0 flex justify-center">
                        <div className="flex items-center gap-2 px-3 py-1" style={{ backgroundColor: '#06080e', border: `1px solid ${PINK}44` }}>
                            <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
                                className="w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: '0 0 6px red' }} />
                            <span style={{ fontSize: 8, color: PINK, fontFamily: 'monospace' }}>◎ RECORDING STUDIO</span>
                        </div>
                    </div>
                    {/* Studio windows */}
                    <div className="absolute bottom-[10px] left-0 right-0 flex justify-around px-5">
                        {[{ glow: '#8844ff' }, { glow: CYAN }].map((w, i) => (
                            <BuildingWindow key={i} w={88} h={62} frameColor="#1a1a3a" glassColor={`${w.glow}11`} glowColor={w.glow}>
                                {/* VU meter bars */}
                                <div className="absolute bottom-0 left-0 right-0 h-[18px] flex items-end gap-[2px] px-2" style={{ backgroundColor: '#06040e', borderTop: `1px solid #1a1a3a` }}>
                                    {Array.from({ length: 10 }).map((_, j) => (
                                        <motion.div key={j} animate={{ scaleY: [0.3, 1, 0.5, 0.8, 0.3] }} transition={{ duration: 0.35 + j * 0.07, repeat: Infinity, delay: j * 0.04 }}
                                            style={{ flex: 1, height: 12, backgroundColor: w.glow, originY: 'bottom', transformOrigin: 'bottom' }} />
                                    ))}
                                </div>
                            </BuildingWindow>
                        ))}
                    </div>
                </div>

                {/* ── NEON SIGN BELT ── */}
                <div className="absolute left-0 right-0 h-[60px] flex items-center justify-center z-20" style={{ top: 114, backgroundColor: '#050810', borderBottom: `3px solid ${CYAN}`, boxShadow: `0 0 22px ${CYAN}66, 0 4px 40px ${CYAN}33` }}>
                    <div className="flex items-center gap-4">
                        {/* Spinning record */}
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                            className="w-10 h-10 rounded-full bg-black flex items-center justify-center"
                            style={{ border: `3px solid ${CYAN}`, boxShadow: `0 0 12px ${CYAN}` }}>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CYAN }} />
                        </motion.div>
                        <NeonSign text="VINYL" color={CYAN} bg="#000d12" fontSize={22} subText="レコードショップ" />
                        <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ fontSize: 20, color: PINK }}>♪</motion.span>
                    </div>
                </div>

                {/* ── SPEAKER COLUMNS ── */}
                {['left', 'right'].map((side) => (
                    <div key={side} className={`absolute ${side === 'left' ? 'left-0' : 'right-0'} w-[22px]`}
                        style={{ top: 178, bottom: 130, backgroundColor: '#060810', borderRight: side === 'left' ? `2px solid ${FRAME}` : undefined, borderLeft: side === 'right' ? `2px solid ${FRAME}` : undefined }}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="mx-0.5 my-1 rounded-full border flex items-center justify-center" style={{ width: 16, height: 16, borderColor: CYAN, backgroundColor: `${CYAN}11` }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: `${CYAN}44`, border: `1px solid ${CYAN}77` }} />
                            </div>
                        ))}
                    </div>
                ))}

                {/* ── SHOP WINDOW ── */}
                <div className="absolute left-[22px] right-[22px]" style={{ top: 178, bottom: 130, backgroundColor: '#04050c', border: `2px solid ${FRAME}`, overflow: 'hidden', boxShadow: `0 0 36px ${CYAN}55, 0 0 70px ${CYAN}22, inset 0 0 18px ${CYAN}11` }}>
                    {/* Glass sheen */}
                    <div className="absolute inset-0 pointer-events-none z-20" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)' }} />
                    {/* Now playing ticker */}
                    <div className="absolute top-0 left-0 right-0 h-[22px] flex items-center overflow-hidden" style={{ backgroundColor: '#06080e', borderBottom: `1px solid ${CYAN}33` }}>
                        <motion.div animate={{ x: [300, -800] }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                            className="whitespace-nowrap px-2" style={{ fontSize: 8, color: CYAN, fontFamily: 'monospace' }}>
                            ♫ NOW PLAYING: CITY POP MIX VOL.7 ♫ ELECTRIC NIGHT — KANA YAMAMOTO ♫ MIDNIGHT DRIVE ♫ TOKYO SUMMER ♫
                        </motion.div>
                    </div>

                    {/* ── VINYL RECORD PLAYER ── */}
                    <div className="absolute flex items-center justify-center" style={{ top: 28, bottom: 0, left: 0, right: 0 }}>
                        {/* Primary pulsing ambient glow */}
                        <motion.div
                            animate={{ opacity: [0.55, 1.0, 0.55], scale: [0.9, 1.18, 0.9] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%',
                                     background: `radial-gradient(circle, ${CYAN}88 0%, ${PINK}55 40%, transparent 70%)`,
                                     filter: 'blur(24px)' }}
                        />
                        {/* Secondary pink bloom */}
                        <motion.div
                            animate={{ opacity: [0.2, 0.65, 0.2], scale: [1.1, 0.88, 1.1] }}
                            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
                            style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%',
                                     background: `radial-gradient(circle, ${PINK}77 0%, transparent 70%)`,
                                     filter: 'blur(18px)' }}
                        />
                        {/* Turntable body */}
                        <div style={{ position: 'relative', width: 160, height: 100 }}>

                            {/* Plinth base */}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 26,
                                          backgroundColor: '#150828', border: `2px solid #2d1255`, borderRadius: 2 }}>
                                {[6, 13, 19].map(y => (
                                    <div key={y} style={{ position: 'absolute', top: y, left: 2, right: 2, height: 1, backgroundColor: 'rgba(255,255,255,0.03)' }} />
                                ))}
                                <div style={{ position: 'absolute', left: 8, bottom: 5, fontSize: 5, color: 'rgba(255,255,255,0.22)', fontFamily: 'monospace', letterSpacing: 0.5 }}>33⅓ RPM</div>
                                <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4, alignItems: 'center' }}>
                                    <motion.div
                                        animate={{ opacity: [0.5, 1, 0.5], boxShadow: [`0 0 3px ${CYAN}`, `0 0 10px ${CYAN}`, `0 0 3px ${CYAN}`] }}
                                        transition={{ duration: 1.2, repeat: Infinity }}
                                        style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: CYAN }}
                                    />
                                    {[PINK, '#ccdd00'].map((c, i) => (
                                        <div key={i} style={{ width: 9, height: 16, borderRadius: 1, backgroundColor: '#0d0520', border: `1.5px solid ${c}44` }} />
                                    ))}
                                </div>
                            </div>

                            {/* Platter recess */}
                            <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                                          width: 80, height: 80, borderRadius: '50%',
                                          backgroundColor: '#0c0718', border: '2px solid #1e0e38',
                                          boxShadow: 'inset 0 4px 14px rgba(0,0,0,0.95)' }}>
                                {/* Spinning vinyl */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }}
                                    style={{ width: '100%', height: '100%', borderRadius: '50%',
                                             backgroundColor: '#0d0d0d',
                                             boxShadow: `0 0 0 1.5px rgba(255,255,255,0.09), 0 0 28px ${CYAN}, 0 0 55px ${CYAN}aa, 0 0 80px ${CYAN}44, 0 0 12px ${PINK}66`,
                                             position: 'relative', overflow: 'hidden' }}>
                                    {[74, 66, 58, 50, 42, 34, 26].map((d, i) => (
                                        <div key={i} style={{ position: 'absolute', top: '50%', left: '50%',
                                                              transform: 'translate(-50%,-50%)',
                                                              width: d, height: d, borderRadius: '50%',
                                                              border: `0.5px solid rgba(255,255,255,${0.025 + i * 0.013})` }} />
                                    ))}
                                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%',
                                                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 52%)' }} />
                                    {/* Centre label */}
                                    <div style={{ position: 'absolute', top: '50%', left: '50%',
                                                  transform: 'translate(-50%,-50%)',
                                                  width: 28, height: 28, borderRadius: '50%',
                                                  background: `radial-gradient(circle at 38% 38%, #dd44ff, #5500aa)`,
                                                  boxShadow: `0 0 22px ${PINK}, 0 0 40px ${PINK}99, 0 0 8px #dd44ff`,
                                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                  flexDirection: 'column', overflow: 'hidden' }}>
                                        <div style={{ fontSize: 4, color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace', fontWeight: 900, letterSpacing: 0.5, lineHeight: 1.3 }}>CITY</div>
                                        <div style={{ fontSize: 3.5, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', letterSpacing: 0.3, lineHeight: 1 }}>POP</div>
                                        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#0d0d0d', marginTop: 1 }} />
                                    </div>
                                </motion.div>
                            </div>

                            {/* SVG tonearm overlay — record centre at (80, 44) in viewBox */}
                            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                                          overflow: 'visible', zIndex: 10, pointerEvents: 'none' }}
                                 viewBox="0 0 160 100">
                                {/* Counterweight stub */}
                                <line x1="148" y1="20" x2="156" y2="13" stroke={CYAN + 'cc'} strokeWidth="5" strokeLinecap="round"
                                      style={{ filter: `drop-shadow(0 0 8px ${CYAN})` }} />
                                {/* Arm shaft: pivot (148,20) → headshell joint (105,60) */}
                                <line x1="148" y1="20" x2="105" y2="60" stroke={CYAN} strokeWidth="2.5" strokeLinecap="round"
                                      style={{ filter: `drop-shadow(0 0 10px ${CYAN}) drop-shadow(0 0 18px ${CYAN}99)` }} />
                                {/* Headshell rotated to arm angle ~137° */}
                                <g transform="translate(105,60) rotate(137)">
                                    <rect x="-1" y="-2.5" width="11" height="5" rx="1"
                                          fill={CYAN + '55'} stroke={CYAN} strokeWidth="1"
                                          style={{ filter: `drop-shadow(0 0 6px ${CYAN})` }} />
                                </g>
                                {/* Stylus tip */}
                                <circle cx="99" cy="66" r="2.5" fill={PINK}
                                        style={{ filter: `drop-shadow(0 0 8px ${PINK}) drop-shadow(0 0 16px ${PINK}99)` }} />
                                {/* Pivot bearing outer */}
                                <circle cx="148" cy="20" r="7" fill="#1a0a2e" stroke={CYAN} strokeWidth="2"
                                        style={{ filter: `drop-shadow(0 0 10px ${CYAN})` }} />
                                {/* Pivot bearing inner */}
                                <circle cx="148" cy="20" r="3.5" fill={CYAN}
                                        style={{ filter: `drop-shadow(0 0 14px ${CYAN}) drop-shadow(0 0 22px ${CYAN}99)` }} />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* ── GROUND FLOOR DOOR ── */}
                <div className="absolute bottom-0 left-0 right-0 h-[130px]" style={{ backgroundColor: '#060810', borderTop: `3px solid ${FRAME}` }}>
                    {/* Left wall – artist posters */}
                    <div className="absolute top-0 bottom-0 left-0" style={{ right: 'calc(50% + 40px)', backgroundColor: '#080a18', borderRight: `1px solid ${FRAME}` }}>
                        {[
                            { left: 5,  bg: '#0d001f', accent: '#cc44ff', title: 'NEON\nTOKYO', sub: 'Vol.III', rotate: -2   },
                            { left: 50, bg: '#001a10', accent: '#00ff88', title: 'CITY\nPOP',   sub: '夏夜',    rotate:  1.5  },
                        ].map((p, i) => (
                            <div key={i} style={{ position: 'absolute', top: 14, left: p.left, width: 34, height: 48, backgroundColor: p.bg, border: `1.5px solid ${p.accent}55`, transform: `rotate(${p.rotate}deg)`, overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${p.accent}22, transparent 70%)` }} />
                                {Array.from({ length: 5 }).map((_, r) => (
                                    <div key={r} style={{ position: 'absolute', top: 4 + r * 5, left: 2, right: 2, height: 2, backgroundColor: p.accent, opacity: 0.18 }} />
                                ))}
                                <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center' }}>
                                    {p.title.split('\n').map((line, li) => (
                                        <div key={li} style={{ fontSize: 7, color: p.accent, fontFamily: 'monospace', fontWeight: 900, lineHeight: 1.2, letterSpacing: 1 }}>{line}</div>
                                    ))}
                                </div>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 9, backgroundColor: `${p.accent}33`, borderTop: `1px solid ${p.accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 6, color: p.accent, fontFamily: 'monospace' }}>{p.sub}</span>
                                </div>
                                <div style={{ position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)', width: 12, height: 5, backgroundColor: 'rgba(255,255,200,0.22)', borderRadius: 1 }} />
                            </div>
                        ))}
                    </div>
                    {/* Right wall – artist posters + OPEN sign */}
                    <div className="absolute top-0 bottom-0 right-0" style={{ left: 'calc(50% + 40px)', backgroundColor: '#080a18', borderLeft: `1px solid ${FRAME}` }}>
                        {[
                            { left: 5,  bg: '#1a0008', accent: '#ff4081', title: 'MID\nNIGHT', sub: 'DRIVE', rotate:  1   },
                            { left: 50, bg: '#0a0d00', accent: '#ffea00', title: 'ELEC\nTRIC',  sub: '電気',  rotate: -1.5 },
                        ].map((p, i) => (
                            <div key={i} style={{ position: 'absolute', top: 14, left: p.left, width: 34, height: 48, backgroundColor: p.bg, border: `1.5px solid ${p.accent}55`, transform: `rotate(${p.rotate}deg)`, overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${p.accent}22, transparent 70%)` }} />
                                {Array.from({ length: 5 }).map((_, r) => (
                                    <div key={r} style={{ position: 'absolute', top: 4 + r * 5, left: 2, right: 2, height: 2, backgroundColor: p.accent, opacity: 0.18 }} />
                                ))}
                                <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center' }}>
                                    {p.title.split('\n').map((line, li) => (
                                        <div key={li} style={{ fontSize: 7, color: p.accent, fontFamily: 'monospace', fontWeight: 900, lineHeight: 1.2, letterSpacing: 1 }}>{line}</div>
                                    ))}
                                </div>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 9, backgroundColor: `${p.accent}33`, borderTop: `1px solid ${p.accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 6, color: p.accent, fontFamily: 'monospace' }}>{p.sub}</span>
                                </div>
                                <div style={{ position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)', width: 12, height: 5, backgroundColor: 'rgba(255,255,200,0.22)', borderRadius: 1 }} />
                            </div>
                        ))}
                        <motion.div animate={{ boxShadow: [`0 0 5px #00ff88`, `0 0 14px #00ff88`, `0 0 5px #00ff88`] }} transition={{ duration: 2, repeat: Infinity }}
                            style={{ position: 'absolute', bottom: 10, right: 5, backgroundColor: '#000', border: '1px solid #00ff88', padding: '2px 5px' }}>
                            <div style={{ fontSize: 7, color: '#00ff88', fontFamily: 'monospace', fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>OPEN<br/>営業中</div>
                        </motion.div>
                    </div>
                    {/* Top door frame beam */}
                    <div className="absolute top-0 left-0 right-0 h-[10px]" style={{ backgroundColor: '#0e1428', borderBottom: `2px solid #1e2a50` }} />
                    {/* Center glass door */}
                    <div className="absolute top-[10px] bottom-[6px] left-1/2 -translate-x-1/2 w-[80px]" style={{ borderLeft: `3px solid #1e2a50`, borderRight: `3px solid #1e2a50`, backgroundColor: '#05060c' }}>
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)' }} />
                        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 110%, ${CYAN}18, transparent 65%)` }} />
                        {/* Door handle bar */}
                        <div className="absolute right-3 top-[30%] w-[3px] h-16 bg-[#4488bb] rounded-full opacity-90" />
                        {/* Mid-panel divider */}
                        <div className="absolute top-[55%] left-0 right-0 h-[2px] bg-[#1a2a44]" />
                        {/* Glass reflection */}
                        <div className="absolute top-2 left-2 w-[18px] bottom-4" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.04), transparent)', borderRadius: 1 }} />
                    </div>
                    {/* Door step */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[92px] h-[6px]" style={{ backgroundColor: '#1e2a50' }} />
                    {/* end-ground-floor */}
                    <motion.div animate={{ boxShadow: [`0 0 6px #00ff88`, `0 0 16px #00ff88`, `0 0 6px #00ff88`] }} transition={{ duration: 2, repeat: Infinity }}

                    style={{ display: 'none' }}>
                    </motion.div>
                </div>
            </div>

            <Prompt active={active} color="bg-cyan-400" label="ENTER RECORD STORE" />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE STORE — NIGHT-TIME JAPANESE KONBINI
// Dark navy exterior, glowing blue interior, auto sliding doors.
// ─────────────────────────────────────────────────────────────────────────────
export function ConvenienceFacade({ x, active }: FacadeProps) {
    const W = 340, H = 520;
    const BLUE  = '#2196f3';
    const LBLUE = '#64b5f6';
    const TEAL  = '#00bcd4';
    const WHITE = '#ddeeff';

    return (
        <div className="absolute bottom-0 z-10" style={{ left: x, width: W, height: H }}>

            {/* ── UPPER: Residential ── */}
            <div className="absolute top-0 left-0 right-0 h-[165px]" style={{ backgroundColor: '#131c2e', borderTop: '4px solid #1e2d48', borderLeft: '4px solid #1e2d48', borderRight: '4px solid #1e2d48' }}>
                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 8px,#4488ff 8px,#4488ff 9px)' }} />
                {/* Balcony railing */}
                <div className="absolute bottom-0 left-0 right-0 h-[18px] flex items-center px-2 gap-[6px]" style={{ backgroundColor: '#1a2840', borderTop: '3px solid #253a60' }}>
                    {Array.from({ length: 40 }).map((_, i) => <div key={i} style={{ width: 2, height: 12, backgroundColor: '#2e4470' }} />)}
                </div>
                {/* Three apartment windows */}
                <div className="absolute top-[12px] left-0 right-0 flex justify-around px-5">
                    {[
                        { lit: true,  glass: '#fff9c4', glow: '#ffee88' },
                        { lit: true,  glass: '#cce8ff', glow: '#88bbff' },
                        { lit: false, glass: '#0d1428', glow: undefined },
                    ].map((w, i) => (
                        <BuildingWindow key={i} w={76} h={88} frameColor="#253a60" glassColor={w.lit ? w.glass : '#0d1428'} glowColor={w.lit ? w.glow : undefined}>
                            {i === 0 && (
                                <>
                                    <div style={{ position:'absolute', top:0, left:0, bottom:0, width:'28%', backgroundColor:'#ffdd6622', borderRight:'1px solid #ffdd6633' }} />
                                    <div style={{ position:'absolute', top:0, right:0, bottom:0, width:'22%', backgroundColor:'#ffdd6622', borderLeft:'1px solid #ffdd6633' }} />
                                </>
                            )}
                            {i === 1 && (
                                <motion.div animate={{ opacity:[0.5,1,0.3,0.9,0.5] }} transition={{ duration:0.45, repeat:Infinity }}
                                    style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 70%, #4488ff22, transparent 70%)' }} />
                            )}
                        </BuildingWindow>
                    ))}
                </div>
                {/* AC units */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {[0,1].map(i => (
                        <div key={i} style={{ width: 28, height: 18, backgroundColor: '#1e2840', border: '2px solid #2a3860', borderRadius: 2 }}>
                            {[0,1,2].map(j => <div key={j} style={{ width:'100%', height:3, backgroundColor:'#2a3860', marginBottom:1 }} />)}
                        </div>
                    ))}
                </div>
                {/* Laundry line */}
                <div className="absolute" style={{ bottom: 22, left: 8, right: 8, height: 18 }}>
                    <svg className="w-full h-full" viewBox="0 0 320 18" preserveAspectRatio="none">
                        <path d="M0,2 Q80,14 160,2 Q240,14 320,2" stroke="#2e4470" strokeWidth="1" fill="none"/>
                    </svg>
                    {[16,55,95,135,175,215,255,295].map((lx, i) => (
                        <div key={i} style={{ position:'absolute', left:lx, top:i%2===0?4:8, width:22, height:26, border:'1px solid rgba(46,68,112,0.6)', borderRadius:2, backgroundColor:['#ffccbc','#bbdefb','#f3e5f5','#c8e6c9','#fff9c4','#fce4ec','#b3e5fc','#f9fbe7'][i%8] }} />
                    ))}
                </div>
            </div>

            {/* ── STORE BODY ── */}
            <div className="absolute bottom-0 left-0 right-0 h-[357px]" style={{ backgroundColor: '#0b1222', borderBottom: '4px solid #182040', borderLeft: '4px solid #182040', borderRight: '4px solid #182040' }}>
                {/* Glowing blue canopy */}
                <div className="absolute -top-[20px] -left-[4px] right-[-4px] h-[20px] z-30"
                     style={{ background:`linear-gradient(180deg, #1565c0, #0d47a1)`, borderBottom:`3px solid #0a3380`, boxShadow:`0 6px 24px ${BLUE}88` }}>
                    <div className="absolute bottom-[-5px] left-0 right-0 flex justify-around px-3">
                        {Array.from({ length: 14 }).map((_, i) => (
                            <motion.div key={i} animate={{ opacity:[0.6,1,0.6] }} transition={{ duration:1.2, repeat:Infinity, delay:i*0.09 }}
                                style={{ width:8, height:6, borderRadius:'50%', backgroundColor:WHITE, boxShadow:`0 0 8px ${WHITE}, 0 4px 10px ${BLUE}88` }} />
                        ))}
                    </div>
                </div>
                {/* Facade bands */}
                <div className="absolute top-0 left-0 right-0 h-[10px]" style={{ background:`linear-gradient(90deg, #0d47a1, ${BLUE}, #0d47a1)` }} />
                <div className="absolute top-[10px] left-0 right-0 h-[6px]" style={{ backgroundColor: WHITE, opacity: 0.85 }} />
                <div className="absolute top-[16px] left-0 right-0 h-[3px]" style={{ backgroundColor: TEAL, boxShadow:`0 0 6px ${TEAL}` }} />
                {/* Store sign bar */}
                <div className="absolute top-[19px] left-0 right-0 h-[62px] flex items-center justify-between px-4 z-20"
                     style={{ background:'linear-gradient(180deg, #0d1a30, #0a1220)', borderBottom:`2px solid #1a3060` }}>
                    <div className="flex items-center gap-3">
                        <div style={{ width:48, height:48, background:`linear-gradient(135deg, ${BLUE}, #0d47a1)`, border:`2px solid ${LBLUE}`, borderRadius:3, boxShadow:`0 0 14px ${BLUE}77`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                            <span style={{ fontSize:8, color:'white', fontFamily:'monospace', fontWeight:900, lineHeight:1 }}>コンビニ</span>
                            <span style={{ fontSize:18, color:WHITE, fontFamily:'monospace', fontWeight:900, lineHeight:1, letterSpacing:-1 }}>24H</span>
                        </div>
                        <div>
                            <div style={{ fontSize:18, color:WHITE, fontFamily:'monospace', fontWeight:900, letterSpacing:2, lineHeight:1, textShadow:`0 0 10px ${LBLUE}` }}>KONBINI</div>
                            <div style={{ fontSize:8, color:TEAL, fontFamily:'monospace', letterSpacing:2 }}>コンビニエンスストア</div>
                        </div>
                    </div>
                    <motion.div animate={{ boxShadow:[`0 0 8px ${TEAL}88, 0 0 16px ${TEAL}44`,`0 0 18px ${TEAL}cc, 0 0 36px ${TEAL}77`,`0 0 8px ${TEAL}88, 0 0 16px ${TEAL}44`] }} transition={{ duration:2, repeat:Infinity }}
                        style={{ backgroundColor:'#000', border:`2px solid ${TEAL}`, padding:'4px 8px', display:'flex', flexDirection:'column', alignItems:'center' }}>
                        <span style={{ fontSize:10, color:TEAL, fontFamily:'monospace', fontWeight:900, lineHeight:1 }}>OPEN</span>
                        <span style={{ fontSize:9, color:LBLUE, fontFamily:'monospace', lineHeight:1 }}>24H</span>
                    </motion.div>
                    <div style={{ backgroundColor:'#b71c1c', border:'2px solid #ff1744', padding:'3px 6px', transform:'rotate(1.5deg)', boxShadow:'0 0 10px #ff174455' }}>
                        <div style={{ fontSize:9, color:'white', fontFamily:'monospace', fontWeight:900, textAlign:'center', lineHeight:1.3 }}>新商品<br/>NEW!</div>
                    </div>
                </div>
                {/* LED ticker */}
                <div className="absolute left-0 right-0 h-[20px] flex items-center overflow-hidden z-20" style={{ top:81, backgroundColor:'#030810', borderBottom:`1px solid ${BLUE}44` }}>
                    <motion.div animate={{ x:[360,-900] }} transition={{ duration:18, repeat:Infinity, ease:'linear' }}
                        className="whitespace-nowrap px-2" style={{ fontSize:9, color:'#00ffcc', fontFamily:'monospace' }}>
                        ★ おにぎり 120円 ★ カップ麺 SALE ★ NEW アイス入荷！★ ポイント2倍 ★ ホットスナック ★ ATM手数料無料 ★ 新商品！★
                    </motion.div>
                </div>
                {/* Interior glass area */}
                <div className="absolute left-0 right-0 bottom-0" style={{ top:101, background:'linear-gradient(180deg,#0e1830 0%,#101c38 100%)', overflow:'hidden' }}>
                    <div className="absolute inset-0" style={{ background:`linear-gradient(to bottom, ${BLUE}09 0%, ${LBLUE}14 40%, ${BLUE}08 100%)` }} />
                    {/* Ceiling strips */}
                    {[36,110,188,262].map(lx => (
                        <div key={lx} style={{ position:'absolute', top:0, left:lx, width:52, height:2, backgroundColor:WHITE, opacity:0.55, boxShadow:`0 0 10px ${WHITE}, 0 2px 18px ${WHITE}88` }} />
                    ))}
                    {/* Left: refrigerator */}
                    <div className="absolute top-3 left-1 w-[70px] bottom-[130px]" style={{ border:`1px solid ${LBLUE}55`, backgroundColor:'rgba(0,20,60,0.45)' }}>
                        <div style={{ fontSize:6, color:LBLUE, fontFamily:'monospace', fontWeight:700, textAlign:'center', padding:'2px 0 3px', borderBottom:`1px solid ${LBLUE}33` }}>飲み物</div>
                        {[
                            [{ bg:'#cc1122', label:'コーラ' }, { bg:'#1a1a1a', label:'コーヒー' }, { bg:'#225533', label:'お茶' }],
                            [{ bg:'#1565c0', label:'スポーツ' }, { bg:'#e65100', label:'エナジー' }, { bg:'#4a0080', label:'ぶどう' }],
                            [{ bg:'#006633', label:'緑茶' }, { bg:'#003366', label:'水' }, { bg:'#880000', label:'ソーダ' }],
                        ].map((row, ri) => (
                            <div key={ri} style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-around', padding:'3px 2px', height:54, borderBottom:`1px solid ${LBLUE}22` }}>
                                {row.map((c, ci) => (
                                    /* Drink can */
                                    <div key={ci} style={{ width:14, height:44, backgroundColor:c.bg, position:'relative', borderRadius:'2px 2px 1px 1px', overflow:'hidden', flexShrink:0 }}>
                                        {/* Can top rim */}
                                        <div style={{ height:4, background:'rgba(200,220,255,0.35)', borderRadius:'2px 2px 0 0' }} />
                                        {/* Label band */}
                                        <div style={{ margin:'3px 1px', height:15, backgroundColor:'rgba(255,255,255,0.13)', border:'0.5px solid rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                            <span style={{ fontSize:3.5, color:'rgba(255,255,255,0.9)', fontFamily:'monospace', fontWeight:700, lineHeight:1, letterSpacing:0.2 }}>{c.label}</span>
                                        </div>
                                        {/* Bottom base */}
                                        <div style={{ position:'absolute', bottom:2, left:2, right:2, height:3, backgroundColor:'rgba(0,0,0,0.28)', borderRadius:1 }} />
                                        {/* Reflection */}
                                        <div style={{ position:'absolute', top:0, left:0, width:'38%', height:'100%', background:'linear-gradient(to right,rgba(255,255,255,0.18),transparent)' }} />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    {/* Center shelves */}
                    <div className="absolute top-3 left-[75px] right-[65px] bottom-[130px] flex flex-col justify-around">
                        {/* ── Snack shelf ── */}
                        <div className="relative">
                            <div style={{ height:3, background:`linear-gradient(90deg,${LBLUE}55,#9ab,${LBLUE}55)`, boxShadow:'0 1px 4px rgba(0,0,0,0.5)', width:'100%' }} />
                            <div style={{ position:'absolute', top:-11, left:2, fontSize:5.5, color:`${LBLUE}aa`, fontFamily:'monospace' }}>お菓子</div>
                            <div style={{ display:'flex', alignItems:'flex-end', gap:2, padding:'1px 2px', bottom:3, position:'absolute', left:0, right:0 }}>
                                {/* Chips bag – trapezoid */}
                                <div style={{ flex:1, height:24, position:'relative', overflow:'hidden' }}>
                                    <div style={{ position:'absolute', bottom:0, left:'10%', right:'10%', top:4, backgroundColor:'#e65100', clipPath:'polygon(15% 0%,85% 0%,100% 100%,0% 100%)', borderRadius:1 }}>
                                        <div style={{ position:'absolute', top:'20%', left:'15%', right:'15%', height:2, backgroundColor:'rgba(255,255,255,0.35)', borderRadius:1 }} />
                                        <div style={{ position:'absolute', top:2, left:0, right:0, height:'50%', background:'linear-gradient(to bottom,rgba(255,255,255,0.22),transparent)' }} />
                                    </div>
                                    {/* bag pinch at top */}
                                    <div style={{ position:'absolute', top:0, left:'30%', right:'30%', height:5, backgroundColor:'#e65100', borderRadius:'50% 50% 0 0', opacity:0.7 }} />
                                </div>
                                {/* Pocky box – slim rect with sticks */}
                                <div style={{ flex:1, height:24, backgroundColor:'#f9a825', position:'relative', borderRadius:1, overflow:'hidden' }}>
                                    <div style={{ position:'absolute', top:0, left:0, right:0, height:7, backgroundColor:'#e65100' }} />
                                    {[0,1,2,3,4].map(s => <div key={s} style={{ position:'absolute', top:7, left:`${10+s*16}%`, width:2, bottom:0, backgroundColor:'#fff9e6', opacity:0.9 }} />)}
                                    <div style={{ position:'absolute', top:2, left:'15%', right:'15%', height:3, backgroundColor:'rgba(255,255,255,0.3)', borderRadius:1 }} />
                                </div>
                                {/* Nori snack – dark flat pack */}
                                <div style={{ flex:1, height:24, backgroundColor:'#1b2e1b', position:'relative', borderRadius:1, border:'1px solid #2d4a2d' }}>
                                    <div style={{ position:'absolute', top:3, left:3, right:3, height:5, backgroundColor:'rgba(100,200,100,0.25)', borderRadius:1 }} />
                                    <div style={{ position:'absolute', bottom:3, left:3, right:3, height:3, backgroundColor:'rgba(255,255,255,0.12)' }} />
                                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'40%', background:'linear-gradient(to bottom,rgba(255,255,255,0.1),transparent)' }} />
                                </div>
                                {/* Spicy chips – round bag */}
                                <div style={{ flex:1, height:24, position:'relative' }}>
                                    <div style={{ position:'absolute', bottom:0, left:'5%', right:'5%', top:3, backgroundColor:'#c62828', borderRadius:'40% 40% 45% 45%', overflow:'hidden' }}>
                                        <div style={{ position:'absolute', top:'10%', left:'10%', right:'10%', height:3, backgroundColor:'rgba(255,255,255,0.3)', borderRadius:1 }} />
                                        <div style={{ position:'absolute', top:0, left:0, right:0, height:'50%', background:'linear-gradient(to bottom,rgba(255,200,0,0.25),transparent)' }} />
                                    </div>
                                    <div style={{ position:'absolute', top:0, left:'25%', right:'25%', height:5, backgroundColor:'#c62828', borderRadius:'50%', opacity:0.6 }} />
                                </div>
                                {/* Candy roll – purple cylinder */}
                                <div style={{ flex:1, height:24, backgroundColor:'#6a1b9a', position:'relative', borderRadius:2, overflow:'hidden' }}>
                                    <div style={{ position:'absolute', top:0, left:0, right:0, height:4, backgroundColor:'rgba(255,255,255,0.25)', borderRadius:'2px 2px 0 0' }} />
                                    <div style={{ position:'absolute', top:5, left:2, right:2, height:2, backgroundColor:'rgba(255,255,255,0.2)', borderRadius:1 }} />
                                    <div style={{ position:'absolute', top:0, left:0, width:'35%', height:'100%', background:'linear-gradient(to right,rgba(255,255,255,0.18),transparent)' }} />
                                </div>
                                {/* Cookie box – blue rect */}
                                <div style={{ flex:1, height:24, backgroundColor:'#0277bd', position:'relative', borderRadius:1, overflow:'hidden' }}>
                                    <div style={{ position:'absolute', top:0, left:0, right:0, height:6, backgroundColor:'#01579b' }} />
                                    <div style={{ position:'absolute', top:8, left:2, right:2, height:3, backgroundColor:'rgba(255,255,255,0.25)', borderRadius:1 }} />
                                    <div style={{ position:'absolute', bottom:2, left:2, right:2, height:2, backgroundColor:'rgba(255,255,255,0.15)', borderRadius:1 }} />
                                    <div style={{ position:'absolute', top:0, left:0, width:'40%', height:'100%', background:'linear-gradient(to right,rgba(255,255,255,0.15),transparent)' }} />
                                </div>
                            </div>
                        </div>

                        {/* ── Food shelf ── */}
                        <div className="relative">
                            <div style={{ height:3, background:`linear-gradient(90deg,${LBLUE}55,#9ab,${LBLUE}55)`, boxShadow:'0 1px 4px rgba(0,0,0,0.5)', width:'100%' }} />
                            <div style={{ position:'absolute', top:-11, left:2, fontSize:5.5, color:`${LBLUE}aa`, fontFamily:'monospace' }}>食品</div>
                            <div style={{ display:'flex', alignItems:'flex-end', gap:2, padding:'1px 2px', bottom:3, position:'absolute', left:0, right:0 }}>
                                {/* Onigiri 1 */}
                                <div style={{ flex:1, height:24, position:'relative' }}>
                                    <svg width="100%" height="24" viewBox="0 0 28 24" style={{ position:'absolute', bottom:0 }}>
                                        <polygon points="14,1 1,23 27,23" fill="#fff8e8" />
                                        <polygon points="14,3 3,22 25,22" fill="#fff3d4" opacity="0.5" />
                                        <rect x="4" y="17" width="20" height="5" rx="1" fill="#1b2e1b" />
                                        <polygon points="14,2 11,8 17,8" fill="rgba(255,255,255,0.5)" />
                                    </svg>
                                </div>
                                {/* Onigiri 2 – salmon */}
                                <div style={{ flex:1, height:24, position:'relative' }}>
                                    <svg width="100%" height="24" viewBox="0 0 28 24" style={{ position:'absolute', bottom:0 }}>
                                        <polygon points="14,1 1,23 27,23" fill="#fff8e8" />
                                        <polygon points="14,7 10,14 18,14" fill="#ff8a65" opacity="0.8" />
                                        <rect x="4" y="17" width="20" height="5" rx="1" fill="#1b2e1b" />
                                    </svg>
                                </div>
                                {/* Melon bread – round bun */}
                                <div style={{ flex:1, height:24, position:'relative' }}>
                                    <div style={{ position:'absolute', bottom:0, left:'5%', right:'5%', height:18, backgroundColor:'#f5e6c8', borderRadius:'50% 50% 30% 30%', overflow:'hidden' }}>
                                        <div style={{ position:'absolute', top:2, left:2, right:2, height:4, background:'rgba(255,255,255,0.4)', borderRadius:'50%' }} />
                                        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox="0 0 24 18">
                                            <path d="M2,12 Q6,4 12,3 Q18,4 22,12" stroke="#c8a96e" strokeWidth="0.8" fill="none" opacity="0.6"/>
                                            <path d="M4,15 Q8,9 12,8 Q16,9 20,15" stroke="#c8a96e" strokeWidth="0.8" fill="none" opacity="0.5"/>
                                        </svg>
                                    </div>
                                </div>
                                {/* Sandwich pack */}
                                <div style={{ flex:1, height:24, backgroundColor:'#e3f2fd', position:'relative', borderRadius:1, border:'0.5px solid #90caf9', overflow:'hidden' }}>
                                    <div style={{ position:'absolute', top:2, left:2, right:2, height:5, backgroundColor:'#fff9e6', borderRadius:1 }} />
                                    <div style={{ position:'absolute', top:8, left:2, right:2, height:3, backgroundColor:'#a5d6a7' }} />
                                    <div style={{ position:'absolute', top:12, left:2, right:2, height:3, backgroundColor:'#ffcc80' }} />
                                    <div style={{ position:'absolute', top:16, left:2, right:2, height:4, backgroundColor:'#fff9e6', borderRadius:'0 0 1px 1px' }} />
                                </div>
                                {/* Bento box */}
                                <div style={{ flex:1, height:24, backgroundColor:'#1a1a2e', position:'relative', borderRadius:1, border:'1px solid #3a3a5e', overflow:'hidden' }}>
                                    {/* Compartment dividers */}
                                    <div style={{ position:'absolute', left:'50%', top:1, bottom:1, width:1, backgroundColor:'#3a3a5e' }} />
                                    <div style={{ position:'absolute', left:1, right:1, top:'50%', height:1, backgroundColor:'#3a3a5e' }} />
                                    {/* Food colors in compartments */}
                                    <div style={{ position:'absolute', top:2, left:2, width:'40%', height:9, backgroundColor:'#c62828', borderRadius:1, opacity:0.8 }} />
                                    <div style={{ position:'absolute', top:2, right:2, width:'40%', height:9, backgroundColor:'#fff9e6', borderRadius:1, opacity:0.9 }} />
                                    <div style={{ position:'absolute', bottom:2, left:2, width:'40%', height:9, backgroundColor:'#2e7d32', borderRadius:1, opacity:0.8 }} />
                                    <div style={{ position:'absolute', bottom:2, right:2, width:'40%', height:9, backgroundColor:'#f9a825', borderRadius:1, opacity:0.8 }} />
                                </div>
                                {/* Pudding cup */}
                                <div style={{ flex:1, height:24, position:'relative' }}>
                                    <div style={{ position:'absolute', bottom:0, left:'10%', right:'10%', height:20, backgroundColor:'#fff9e6', borderRadius:'3px 3px 50% 50%', border:'1px solid #f9a825', overflow:'hidden' }}>
                                        <div style={{ position:'absolute', top:0, left:0, right:0, height:5, backgroundColor:'#f59e0b', borderRadius:'2px 2px 0 0' }} />
                                        <div style={{ position:'absolute', top:6, left:2, right:2, height:2, backgroundColor:'rgba(249,168,37,0.4)', borderRadius:1 }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Cup noodle shelf ── */}
                        <div className="relative">
                            <div style={{ height:3, background:`linear-gradient(90deg,${LBLUE}55,#9ab,${LBLUE}55)`, boxShadow:'0 1px 4px rgba(0,0,0,0.5)', width:'100%' }} />
                            <div style={{ position:'absolute', top:-11, left:2, fontSize:5.5, color:`${LBLUE}aa`, fontFamily:'monospace' }}>カップ麺</div>
                            <div style={{ display:'flex', alignItems:'flex-end', gap:2, padding:'1px 2px', bottom:3, position:'absolute', left:0, right:0 }}>
                                {[
                                    { col:'#c62828', lid:'#ef9a9a', label:'日清' },
                                    { col:'#e65100', lid:'#ffcc80', label:'マルちゃん' },
                                    { col:'#1565c0', lid:'#90caf9', label:'シーフード' },
                                    { col:'#2e7d32', lid:'#a5d6a7', label:'チキン' },
                                    { col:'#4a148c', lid:'#ce93d8', label:'カレー' },
                                    { col:'#bf360c', lid:'#ffab91', label:'豚骨' },
                                ].map((cup, ci) => (
                                    <div key={ci} style={{ flex:1, height:26, position:'relative' }}>
                                        {/* cup body (tapered) */}
                                        <div style={{ position:'absolute', bottom:0, left:'8%', right:'8%', height:20, backgroundColor:cup.col, clipPath:'polygon(8% 0%,92% 0%,100% 100%,0% 100%)', overflow:'hidden' }}>
                                            <div style={{ position:'absolute', top:2, left:'15%', right:'15%', height:4, backgroundColor:'rgba(255,255,255,0.22)', borderRadius:1 }} />
                                            <div style={{ position:'absolute', top:0, left:0, width:'35%', height:'100%', background:'linear-gradient(to right,rgba(255,255,255,0.18),transparent)' }} />
                                        </div>
                                        {/* lid ellipse */}
                                        <div style={{ position:'absolute', top:0, left:'5%', right:'5%', height:7, backgroundColor:cup.lid, borderRadius:'50%', border:`1px solid ${cup.col}`, overflow:'hidden' }}>
                                            <div style={{ position:'absolute', top:1, left:'20%', right:'20%', height:2, backgroundColor:'rgba(255,255,255,0.4)', borderRadius:1 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Right: hot food + ATM */}
                    <div className="absolute top-3 right-1 w-[58px] bottom-[130px] flex flex-col gap-2">
                        <div style={{ border:`1px solid #ff8f0055`, backgroundColor:'rgba(20,8,0,0.5)' }}>
                            <div style={{ fontSize:5.5, color:'#ff8f00', fontFamily:'monospace', fontWeight:700, textAlign:'center', padding:'2px 0', borderBottom:'1px solid #331100' }}>ホット</div>
                            {/* Hot dog */}
                            <div style={{ margin:'2px 3px', height:11, position:'relative' }}>
                                <div style={{ position:'absolute', bottom:0, left:0, right:0, height:8, backgroundColor:'#f5c842', borderRadius:'2px 2px 1px 1px', overflow:'hidden' }}>
                                    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(to bottom,rgba(255,255,255,0.25),transparent)' }} />
                                    <div style={{ position:'absolute', top:1, left:3, right:3, height:5, backgroundColor:'#c62828', borderRadius:1 }}>
                                        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(to bottom,rgba(255,255,255,0.2),transparent)' }} />
                                    </div>
                                </div>
                            </div>
                            {/* Fried chicken */}
                            <div style={{ margin:'2px 3px', height:11, position:'relative' }}>
                                <div style={{ position:'absolute', bottom:0, left:'6%', right:'6%', height:9, backgroundColor:'#e65100', borderRadius:'35% 40% 38% 42%', overflow:'hidden' }}>
                                    <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'linear-gradient(to bottom,rgba(255,190,0,0.35),transparent)', borderRadius:'35% 40% 0 0' }} />
                                    <div style={{ position:'absolute', top:1, left:3, width:3, height:3, borderRadius:'50%', backgroundColor:'rgba(255,255,255,0.2)' }} />
                                    <div style={{ position:'absolute', top:3, right:3, width:2, height:2, borderRadius:'50%', backgroundColor:'rgba(255,255,255,0.15)' }} />
                                </div>
                            </div>
                            {/* Steamed bun (nikuman) */}
                            <div style={{ margin:'2px 3px', height:11, position:'relative' }}>
                                <div style={{ position:'absolute', bottom:0, left:'5%', right:'5%', height:9, backgroundColor:'#fff8f0', borderRadius:'50% 50% 28% 28%', overflow:'hidden' }}>
                                    <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:'linear-gradient(to bottom,rgba(255,255,255,0.6),transparent)', borderRadius:'50% 50% 0 0' }} />
                                    <div style={{ position:'absolute', top:2, left:'28%', right:'28%', height:3, backgroundColor:'rgba(180,100,50,0.4)', borderRadius:'50%' }} />
                                </div>
                            </div>
                        </div>
                        <ATMUnit />
                    </div>
                    {/* Checkout counter */}
                    <div style={{ position:'absolute', left:0, right:0, bottom:130, height:20, borderTop:`1px solid ${LBLUE}22` }}>
                        <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', bottom:0, width:100, height:20, backgroundColor:'#0d1830', border:`1px solid ${LBLUE}44`, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                            <div style={{ width:30, height:12, backgroundColor:'#0a2040', border:`1px solid ${LBLUE}44`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <span style={{ fontSize:4, color:LBLUE, fontFamily:'monospace' }}>REGISTER</span>
                            </div>
                            <motion.div animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:1.2, repeat:Infinity }}
                                style={{ width:8, height:8, borderRadius:'50%', backgroundColor:'#00ff88', boxShadow:'0 0 6px #00ff88' }} />
                        </div>
                    </div>

                    {/* ── ENTRANCE DOOR — automatic glass sliding doors ── */}
                    <div className="absolute bottom-0 left-0 right-0 h-[130px]" style={{ backgroundColor:'#090e1c' }}>
                        {/* Left solid wall */}
                        <div style={{ position:'absolute', top:0, bottom:0, left:0, width:86, backgroundColor:'#0b1228' }}>
                            <div style={{ position:'absolute', inset:0, opacity:0.05, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 8px,#4488ff 8px,#4488ff 9px)' }} />
                            <div style={{ position:'absolute', top:8, left:6, right:10, backgroundColor:'#0a1a38', border:`1px solid ${LBLUE}33`, padding:'3px 2px', textAlign:'center' }}>
                                <span style={{ fontSize:5, color:`${LBLUE}77`, fontFamily:'monospace' }}>NO. 1247</span>
                            </div>
                            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:14, background:`linear-gradient(0deg,${BLUE}22,transparent)` }} />
                            {/* Door frame pillar */}
                            <div style={{ position:'absolute', top:0, bottom:0, right:0, width:5, backgroundColor:'#2a4880', borderLeft:`1px solid ${LBLUE}66`, boxShadow:`2px 0 10px ${BLUE}55` }} />
                        </div>
                        {/* Right solid wall */}
                        <div style={{ position:'absolute', top:0, bottom:0, right:0, width:86, backgroundColor:'#0b1228' }}>
                            <div style={{ position:'absolute', inset:0, opacity:0.05, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 8px,#4488ff 8px,#4488ff 9px)' }} />
                            <motion.div animate={{ boxShadow:[`0 0 5px ${TEAL}77`,`0 0 12px ${TEAL}cc`,`0 0 5px ${TEAL}77`] }} transition={{ duration:2, repeat:Infinity }}
                                style={{ position:'absolute', top:8, left:10, right:6, backgroundColor:'#000', border:`1px solid ${TEAL}`, padding:'3px 2px', textAlign:'center' }}>
                                <div style={{ fontSize:7, color:TEAL, fontFamily:'monospace', fontWeight:700, lineHeight:1 }}>OPEN</div>
                                <div style={{ fontSize:5, color:LBLUE, fontFamily:'monospace', lineHeight:1 }}>24H</div>
                            </motion.div>
                            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:14, background:`linear-gradient(0deg,${BLUE}22,transparent)` }} />
                            {/* Door frame pillar */}
                            <div style={{ position:'absolute', top:0, bottom:0, left:0, width:5, backgroundColor:'#2a4880', borderRight:`1px solid ${LBLUE}66`, boxShadow:`-2px 0 10px ${BLUE}55` }} />
                        </div>

                        {/* Door header — aluminium channel */}
                        <div style={{ position:'absolute', top:0, left:86, right:86, height:18,
                                      background:`linear-gradient(180deg,#1e3060,#0e1840)`,
                                      borderLeft:`2px solid ${BLUE}cc`, borderRight:`2px solid ${BLUE}cc`,
                                      borderBottom:`3px solid ${BLUE}`, boxShadow:`0 4px 16px ${BLUE}88` }}>
                            {/* Auto sensor indicator */}
                            <div style={{ position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)', display:'flex', gap:5, alignItems:'center' }}>
                                <motion.div animate={{ opacity:[0.3,1,0.3] }} transition={{ duration:1.6, repeat:Infinity }}>
                                    <div style={{ width:5, height:5, borderRadius:'50%', backgroundColor:'#00ff88', boxShadow:'0 0 5px #00ff88' }} />
                                </motion.div>
                                <span style={{ fontSize:4, color:`${TEAL}cc`, fontFamily:'monospace', letterSpacing:1 }}>AUTO</span>
                                <motion.div animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.6, repeat:Infinity, delay:0.8 }}>
                                    <div style={{ width:5, height:5, borderRadius:'50%', backgroundColor:'#00ff88', boxShadow:'0 0 5px #00ff88' }} />
                                </motion.div>
                            </div>
                        </div>

                        {/* Left glass door panel */}
                        <div style={{ position:'absolute', top:18, bottom:9, left:86, width:'calc(50% - 86px)',
                                      border:`2px solid ${LBLUE}bb`, borderRight:`1px solid ${LBLUE}77`,
                                      background:`linear-gradient(90deg,rgba(15,50,140,0.1),rgba(100,181,246,0.16))`,
                                      boxShadow:`inset 0 0 16px rgba(100,181,246,0.06), 0 0 8px ${BLUE}44` }}>
                            {/* Aluminium top rail */}
                            <div style={{ position:'absolute', top:0, left:0, right:0, height:5, backgroundColor:'#2a4880', borderBottom:`1px solid ${LBLUE}66` }} />
                            {/* Handle bar */}
                            <div style={{ position:'absolute', right:10, top:'28%', width:5, height:42,
                                          backgroundColor:`${LBLUE}dd`, borderRadius:2,
                                          boxShadow:`0 0 8px ${BLUE}, 0 0 16px ${BLUE}66` }}>
                                <div style={{ position:'absolute', top:'18%', bottom:'18%', left:'20%', right:'20%', backgroundColor:'#aaccee', borderRadius:1 }} />
                            </div>
                            {/* Horizontal bar (connects handle to frame) */}
                            <div style={{ position:'absolute', right:15, top:'calc(28% + 19px)', width:20, height:2, backgroundColor:`${LBLUE}77`, borderRadius:1 }} />
                            {/* Glass reflection */}
                            <div style={{ position:'absolute', top:7, left:5, width:10, bottom:6, background:'linear-gradient(to right,rgba(200,230,255,0.09),transparent)', transform:'skewX(-3deg)' }} />
                            <div style={{ position:'absolute', top:'44%', left:5, right:16, height:1, backgroundColor:`${LBLUE}33` }} />
                            <div style={{ position:'absolute', top:'70%', left:5, right:16, height:1, backgroundColor:`${LBLUE}22` }} />
                        </div>

                        {/* Right glass door panel */}
                        <div style={{ position:'absolute', top:18, bottom:9, right:86, width:'calc(50% - 86px)',
                                      border:`2px solid ${LBLUE}bb`, borderLeft:`1px solid ${LBLUE}77`,
                                      background:`linear-gradient(270deg,rgba(15,50,140,0.1),rgba(100,181,246,0.16))`,
                                      boxShadow:`inset 0 0 16px rgba(100,181,246,0.06), 0 0 8px ${BLUE}44` }}>
                            {/* Aluminium top rail */}
                            <div style={{ position:'absolute', top:0, left:0, right:0, height:5, backgroundColor:'#2a4880', borderBottom:`1px solid ${LBLUE}66` }} />
                            {/* Handle bar */}
                            <div style={{ position:'absolute', left:10, top:'28%', width:5, height:42,
                                          backgroundColor:`${LBLUE}dd`, borderRadius:2,
                                          boxShadow:`0 0 8px ${BLUE}, 0 0 16px ${BLUE}66` }}>
                                <div style={{ position:'absolute', top:'18%', bottom:'18%', left:'20%', right:'20%', backgroundColor:'#aaccee', borderRadius:1 }} />
                            </div>
                            {/* Horizontal bar */}
                            <div style={{ position:'absolute', left:15, top:'calc(28% + 19px)', width:20, height:2, backgroundColor:`${LBLUE}77`, borderRadius:1 }} />
                            {/* Glass reflection */}
                            <div style={{ position:'absolute', top:7, right:5, width:10, bottom:6, background:'linear-gradient(to left,rgba(200,230,255,0.09),transparent)', transform:'skewX(3deg)' }} />
                            <div style={{ position:'absolute', top:'44%', left:16, right:5, height:1, backgroundColor:`${LBLUE}33` }} />
                            <div style={{ position:'absolute', top:'70%', left:16, right:5, height:1, backgroundColor:`${LBLUE}22` }} />
                        </div>

                        {/* Center door seam */}
                        <div style={{ position:'absolute', top:18, bottom:9, left:'50%', width:2, transform:'translateX(-50%)',
                                      backgroundColor:`${LBLUE}88`, boxShadow:`0 0 5px ${BLUE}77` }} />

                        {/* Step threshold */}
                        <div style={{ position:'absolute', bottom:0, left:80, right:80, height:9,
                                      background:`linear-gradient(90deg,#0a3380,${BLUE},#0a3380)`,
                                      boxShadow:`0 0 10px ${BLUE}88` }} />
                        {/* Welcome mat */}
                        <div style={{ position:'absolute', bottom:9, left:'50%', transform:'translateX(-50%)', width:124, height:8, backgroundColor:'#0a1a40', border:`1px solid ${BLUE}44`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <span style={{ fontSize:4, color:`${LBLUE}77`, fontFamily:'monospace', letterSpacing:0.8 }}>いらっしゃいませ ★ WELCOME</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Hanging banners ── */}
            <div className="absolute pointer-events-none z-30" style={{ top: '32%', left: 0, right: 0, display: 'flex', justifyContent: 'space-around' }}>
                {['ポイント2倍','SALE','新発売','お得！'].map((text, i) => (
                    <motion.div key={i} animate={{ rotate: [i%2===0?-2:2, i%2===0?2:-2] }}
                        transition={{ duration: 3+i*0.5, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transformOrigin: 'top' }}>
                        <div style={{ width: 2, height: 16, backgroundColor: '#90a4ae' }} />
                        <div style={{ padding: '3px 5px', fontSize: 9, fontWeight: 900, border: '2px solid black', backgroundColor: ['#ff6f00','#d50000','#00c853','#1565c0'][i], color: 'white', lineHeight: 1.2, textAlign: 'center' }}>{text}</div>
                    </motion.div>
                ))}
            </div>

            {/* ── RIGHT: Two vending machines ── */}
            <div className="absolute bottom-0 flex items-end gap-2 z-20" style={{ right: -128 }}>
                <VendingMachine headerBg="#0a1a3e" headerLabel="飲み物 ★ DRINK" glowColor="#4488ff" width={58} height={165}
                    products={[
                        [{ bg:'#cc1122', label:'コーラ', price:'¥130' }, { bg:'#1a1a1a', label:'コーヒー', price:'¥150' }, { bg:'#225533', label:'お茶', price:'¥120' }],
                        [{ bg:'#1565c0', label:'スポーツ', price:'¥160' }, { bg:'#e65100', label:'エナジー', price:'¥200' }, { bg:'#4a0080', label:'ぶどう', price:'¥140' }],
                        [{ bg:'#006633', label:'緑茶', price:'��120' }, { bg:'#880000', label:'コーラZ', price:'¥130' }, { bg:'#003366', label:'水', price:'¥100' }],
                    ]}
                />
                <VendingMachine headerBg="#1a0a00" headerLabel="スナック ★ SNACK" glowColor="#ff8822" width={52} height={150}
                    products={[
                        [{ bg:'#e65100', label:'辛い', price:'¥130' }, { bg:'#558b2f', label:'のり', price:'¥120' }, { bg:'#795548', label:'チョコ', price:'¥150' }],
                        [{ bg:'#f9a825', label:'チップス', price:'¥140' }, { bg:'#880e4f', label:'グミ', price:'¥160' }, { bg:'#1b5e20', label:'抹茶', price:'¥130' }],
                    ]}
                />
            </div>

            <Prompt active={active} color="bg-green-400" label="ENTER CONVENIENCE" />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ARCADE
// Wide cyberpunk building. Games visible through one large window. Proper door.
// ─────────────────────────────────────────────────────────────────────────────
export function ArcadeFacade({ x, active }: FacadeProps) {
    const W = 500, H = 540;
    const PURPLE = '#d500f9';
    const CYAN   = '#00e5ff';

    return (
        <div className="absolute bottom-0 z-10" style={{ left: x, width: W, height: H }}>
            <div className="absolute bottom-0 w-full h-full" style={{ background: 'linear-gradient(180deg, #05000e 0%, #09001a 100%)', border: `4px solid #3d0070` }}>

                {/* Neon pillar strips */}
                <motion.div animate={{ opacity: [0.5,1,0.5] }} transition={{ duration: 0.3, repeat: Infinity }}
                    className="absolute top-0 left-0 w-[4px] h-full" style={{ backgroundColor: PURPLE, boxShadow: `0 0 12px ${PURPLE}, 0 0 24px ${PURPLE}` }} />
                <motion.div animate={{ opacity: [1,0.5,1] }} transition={{ duration: 0.3, repeat: Infinity, delay: 0.15 }}
                    className="absolute top-0 right-0 w-[4px] h-full" style={{ backgroundColor: CYAN, boxShadow: `0 0 12px ${CYAN}, 0 0 24px ${CYAN}` }} />

                {/* ── MARQUEE ── */}
                <div className="absolute top-0 left-0 right-0 h-[160px] overflow-hidden" style={{ background: 'linear-gradient(180deg, #020006 0%, #06001a 100%)', borderBottom: `4px solid ${PURPLE}` }}>
                    {/* Grid */}
                    <motion.div animate={{ opacity: [0.06, 0.2, 0.06] }} transition={{ duration: 0.2, repeat: Infinity }}
                        className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${PURPLE}28 1px, transparent 1px), linear-gradient(90deg, ${PURPLE}28 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />

                    {/* Pixel ghost mascot */}
                    <div className="absolute top-3 left-4">
                        <motion.div animate={{ y: [0,-4,0] }} transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}>
                            <svg width={32} height={32} viewBox="0 0 8 8" shapeRendering="crispEdges">
                                {([
                                    [1,0,PURPLE],[2,0,PURPLE],[3,0,PURPLE],[4,0,PURPLE],[5,0,PURPLE],[6,0,PURPLE],
                                    [0,1,PURPLE],[7,1,PURPLE],[1,1,'#fff'],[2,1,'#fff'],[4,1,'#00f'],[5,1,'#fff'],[6,1,'#fff'],
                                    [0,2,PURPLE],[7,2,PURPLE],[1,2,'#fff'],[2,2,'#00f'],[4,2,'#00f'],[5,2,'#fff'],[6,2,'#fff'],
                                    [0,3,PURPLE],[1,3,PURPLE],[2,3,PURPLE],[3,3,PURPLE],[4,3,PURPLE],[5,3,PURPLE],[6,3,PURPLE],[7,3,PURPLE],
                                    [0,4,PURPLE],[2,4,PURPLE],[4,4,PURPLE],[6,4,PURPLE],
                                ] as [number,number,string][]).map(([px,py,fill], i) => (
                                    <rect key={i} x={px} y={py} width={1} height={1} fill={fill} />
                                ))}
                            </svg>
                        </motion.div>
                    </div>

                    {/* ARCADE sign */}
                    <div className="absolute top-[14px] left-0 right-0 flex items-center justify-center gap-5">
                        {/* Left Ghost */}
                        <motion.div animate={{ y: [0, -5, 0], scaleX: [1, 1.05, 1] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}>
                            <svg width="36" height="36" viewBox="0 0 14 16">
                                <rect x="3" y="1" width="8" height="1" fill="#ff66cc"/>
                                <rect x="2" y="2" width="10" height="1" fill="#ff66cc"/>
                                <rect x="1" y="3" width="12" height="9" fill="#ff66cc"/>
                                <rect x="1" y="12" width="2" height="3" fill="#ff66cc"/>
                                <rect x="5" y="12" width="2" height="3" fill="#ff66cc"/>
                                <rect x="9" y="12" width="2" height="3" fill="#ff66cc"/>
                                <rect x="3" y="13" width="2" height="2" fill="#09001a"/>
                                <rect x="7" y="13" width="2" height="2" fill="#09001a"/>
                                <rect x="11" y="13" width="2" height="2" fill="#09001a"/>
                                <rect x="3" y="5" width="3" height="3" fill="white"/>
                                <rect x="8" y="5" width="3" height="3" fill="white"/>
                                <rect x="4" y="6" width="2" height="2" fill="#0044ff"/>
                                <rect x="9" y="6" width="2" height="2" fill="#0044ff"/>
                            </svg>
                        </motion.div>

                        <div className="flex flex-col items-center gap-0">
                            <motion.div
                                animate={{ 
                                    textShadow: [`0 0 10px ${PURPLE}, 0 0 20px ${PURPLE}`, `0 0 30px ${PURPLE}, 0 0 60px ${PURPLE}`, `0 0 10px ${PURPLE}, 0 0 20px ${PURPLE}`],
                                    filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)']
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{ color: '#f0a0ff', fontFamily: 'monospace', fontWeight: 900, fontSize: 44, letterSpacing: '0.2em', lineHeight: 1, padding: '4px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: `2px solid ${PURPLE}44` }}
                            >ARCADE</motion.div>
                            <div style={{ fontSize: 11, color: `${CYAN}`, fontFamily: 'monospace', letterSpacing: '0.5em', marginTop: 4, textShadow: `0 0 8px ${CYAN}` }}>アーケード</div>
                        </div>

                        {/* Right Ghost (facing left) */}
                        <motion.div animate={{ y: [0, -5, 0], scaleX: [1, 1.05, 1] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}>
                            <svg width="36" height="36" viewBox="0 0 14 16" style={{ transform: 'scaleX(-1)' }}>
                                <rect x="3" y="1" width="8" height="1" fill={CYAN}/>
                                <rect x="2" y="2" width="10" height="1" fill={CYAN}/>
                                <rect x="1" y="3" width="12" height="9" fill={CYAN}/>
                                <rect x="1" y="12" width="2" height="3" fill={CYAN}/>
                                <rect x="5" y="12" width="2" height="3" fill={CYAN}/>
                                <rect x="9" y="12" width="2" height="3" fill={CYAN}/>
                                <rect x="3" y="13" width="2" height="2" fill="#09001a"/>
                                <rect x="7" y="13" width="2" height="2" fill="#09001a"/>
                                <rect x="11" y="13" width="2" height="2" fill="#09001a"/>
                                <rect x="3" y="5" width="3" height="3" fill="white"/>
                                <rect x="8" y="5" width="3" height="3" fill="white"/>
                                <rect x="4" y="6" width="2" height="2" fill="#ff0044"/>
                                <rect x="9" y="6" width="2" height="2" fill="#ff0044"/>
                            </svg>
                        </motion.div>
                    </div>

                    {/* Score ticker */}
                    <div className="absolute bottom-[24px] left-0 right-0 h-[20px] flex items-center overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderTop: `1px solid ${PURPLE}33`, borderBottom: `1px solid ${PURPLE}33` }}>
                        <motion.div animate={{ x: [400, -900] }} transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                            className="whitespace-nowrap px-2" style={{ fontSize: 9, color: '#ffff00', fontFamily: 'monospace' }}>
                            ★ HI-SCORE: 9,999,999 ★ PLAYER1: 1,258,400 ★ PLAYER2: 984,200 ★ INSERT COIN ★ PRESS START ★ 1コイン100円 ★
                        </motion.div>
                    </div>
                    {/* LED dot row */}
                    <div className="absolute bottom-[6px] left-2 right-2 flex justify-between">
                        {Array.from({ length: 22 }).map((_, i) => (
                            <motion.div key={i} animate={{ opacity: [0,1,0] }} transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.045 }}
                                style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: ['#ff0','#f0f','#0ff','#f00','#0f0'][i%5] }} />
                        ))}
                    </div>
                </div>

                {/* ── WALL + LARGE GAME WINDOW ── */}
                <div className="absolute left-0 right-0" style={{ top: 159, bottom: 130 }}>
                    {/* Left wall pillar */}
                    <div className="absolute top-0 bottom-0 left-0 w-[32px]" style={{ backgroundColor: '#070011', borderRight:`2px solid #3d0070` }}>
                        <motion.div animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:0.3, repeat:Infinity }}
                            style={{ position:'absolute', top:0, right:0, width:3, height:'100%', backgroundColor:PURPLE, boxShadow:`0 0 10px ${PURPLE}` }} />
                    </div>
                    {/* Right wall pillar */}
                    <div className="absolute top-0 bottom-0 right-0 w-[32px]" style={{ backgroundColor: '#070011', borderLeft:`2px solid #3d0070` }}>
                        <motion.div animate={{ opacity:[1,0.5,1] }} transition={{ duration:0.3, repeat:Infinity, delay:0.15 }}
                            style={{ position:'absolute', top:0, left:0, width:3, height:'100%', backgroundColor:CYAN, boxShadow:`0 0 10px ${CYAN}` }} />
                    </div>

                    {/* ── LARGE ARCADE WINDOW ── */}
                    <div className="absolute top-0 bottom-0 left-[32px] right-[32px]" style={{ border:`3px solid ${PURPLE}66`, backgroundColor:'rgba(2,0,10,0.92)', overflow:'hidden' }}>
                        {/* Window frame glow */}
                        <div style={{ position:'absolute', top:0, left:0, right:0, height:8, background:`linear-gradient(180deg,${PURPLE}55,transparent)` }} />
                        {/* CRT flicker */}
                        <motion.div animate={{ opacity:[0,0.05,0,0.08,0] }} transition={{ duration:0.1, repeat:Infinity }}
                            className="absolute inset-0 bg-[#4fc3f7] mix-blend-overlay pointer-events-none" />
                        {/* Scanlines */}
                        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.07) 3px,rgba(0,0,0,0.07) 4px)' }} />
                        {/* Ceiling glow inside */}
                        <div style={{ position:'absolute', top:0, left:0, right:0, height:28, background:`linear-gradient(180deg,${PURPLE}22,transparent)` }} />

                        {/* ── UFO Catcher: left=22 ── */}
                        <div className="absolute bottom-0" style={{ left:22, width:84 }}>
                            <div style={{ backgroundColor:'#120028', border:`2px solid #9c00ff`, boxShadow:'0 0 10px #9c00ff44', height:140 }}>
                                <div style={{ width:'100%', height:20, backgroundColor:'#1a0040', borderBottom:`1px solid #9c00ff`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <span style={{ fontSize:6, color:'#cc88ff', fontFamily:'monospace', fontWeight:700 }}>UFOキャッチャー</span>
                                </div>
                                <div style={{ margin:'4px', height:68, backgroundColor:'#080018', border:'1px solid rgba(150,0,255,0.3)', position:'relative', overflow:'hidden' }}>
                                    <div style={{ width:'100%', height:3, backgroundColor:'#4400aa' }} />
                                    <motion.div animate={{ x:[-8,14,-8] }} transition={{ duration:3.2, repeat:Infinity, ease:'easeInOut' }}
                                        style={{ position:'absolute', top:3, left:'50%', width:2, height:24, backgroundColor:'#aaaaff' }}>
                                        <div style={{ position:'absolute', bottom:0, left:-3, right:-3, height:6, display:'flex', justifyContent:'space-between' }}>
                                            <div style={{ width:2, height:8, backgroundColor:'#aaaaff', transform:'rotate(20deg)', transformOrigin:'top' }} />
                                            <div style={{ width:2, height:8, backgroundColor:'#aaaaff', transform:'rotate(-20deg)', transformOrigin:'top' }} />
                                        </div>
                                    </motion.div>
                                    <div style={{ position:'absolute', bottom:3, left:2, right:2, display:'flex', justifyContent:'space-around' }}>
                                        {['#ff4488','#44aaff','#ffcc00','#ff8800'].map((c,pi) => (
                                            <div key={pi} style={{ width:13, height:17, borderRadius:'50% 50% 0 0', backgroundColor:c, boxShadow:`0 0 5px ${c}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:7 }}>★</div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ margin:'0 4px', height:26, backgroundColor:'#0a001e', borderTop:`1px solid #5500bb`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 4px' }}>
                                    <div style={{ width:22, height:16, backgroundColor:'#1a0040', border:'1px solid #7700dd', borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <span style={{ fontSize:5, color:'#cc88ff' }}>100¥</span>
                                    </div>
                                    <motion.div animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:1, repeat:Infinity }}
                                        style={{ width:8, height:8, borderRadius:'50%', backgroundColor:'#ff00ff', boxShadow:'0 0 6px #ff00ff' }} />
                                </div>
                            </div>
                        </div>

                        {/* ── Fighting Cabinet: left=130 ── */}
                        <div className="absolute bottom-0" style={{ left:130, width:84 }}>
                            <div style={{ backgroundColor:'#180000', border:`2px solid #ff2200`, boxShadow:'0 0 12px #ff220044', height:155 }}>
                                <div style={{ width:'100%', height:18, backgroundColor:'#0e0000', borderBottom:'1px solid #cc1100', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <span style={{ fontSize:6, color:'#ff6644', fontFamily:'monospace', fontWeight:700 }}>BATTLE ARENA</span>
                                </div>
                                <div style={{ margin:'4px', height:68, backgroundColor:'black', border:'1px solid #880000', position:'relative', overflow:'hidden' }}>
                                    <motion.div animate={{ opacity:[0,0.15,0,0.25,0] }} transition={{ duration:0.09, repeat:Infinity }} className="absolute inset-0 bg-white mix-blend-overlay" />
                                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'flex-end', justifyContent:'space-around', padding:'0 6px 4px' }}>
                                        <div style={{ width:18, height:40, backgroundColor:'#ff4400', clipPath:'polygon(20% 0,80% 0,100% 30%,100% 100%,0 100%,0 30%)', borderRadius:'2px 2px 0 0' }} />
                                        <div style={{ width:1, height:'100%', backgroundColor:'#880000', opacity:0.5 }} />
                                        <div style={{ width:18, height:40, backgroundColor:'#0044ff', clipPath:'polygon(20% 0,80% 0,100% 30%,100% 100%,0 100%,0 30%)', borderRadius:'2px 2px 0 0' }} />
                                    </div>
                                    <div style={{ position:'absolute', top:3, left:4, height:3, width:'38%', backgroundColor:'#440000' }}>
                                        <motion.div animate={{ width:['80%','60%','80%'] }} transition={{ duration:2, repeat:Infinity }} style={{ height:'100%', backgroundColor:'#00ff44' }} />
                                    </div>
                                    <div style={{ position:'absolute', top:3, right:4, height:3, width:'38%', backgroundColor:'#440000' }}>
                                        <motion.div animate={{ width:['55%','40%','55%'] }} transition={{ duration:2.4, repeat:Infinity }} style={{ height:'100%', backgroundColor:'#00ff44' }} />
                                    </div>
                                    <div style={{ position:'absolute', top:4, left:'50%', transform:'translateX(-50%)', fontSize:6, color:'#ffcc00', fontFamily:'monospace' }}>VS</div>
                                </div>
                                <div style={{ margin:'4px', height:48, backgroundColor:'#100000', border:'1px solid #331111', borderRadius:2, position:'relative' }}>
                                    <div style={{ position:'absolute', bottom:4, left:5, width:26, height:26, borderRadius:'50%', border:'2px solid #555', backgroundColor:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <div style={{ width:14, height:14, borderRadius:'50%', backgroundColor:'#222', border:'1px solid #666' }} />
                                    </div>
                                    <div style={{ position:'absolute', bottom:4, right:5, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:3 }}>
                                        {['#ff1744','#2979ff','#00e676','#ffea00','#aa00ff','#ff6d00'].map((c,bi) => (
                                            <div key={bi} style={{ width:11, height:11, borderRadius:'50%', backgroundColor:c, boxShadow:`0 2px 0 ${c}88` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── DDR/Rhythm: left=238 ── */}
                        <div className="absolute bottom-0" style={{ left:238, width:84 }}>
                            <div style={{ backgroundColor:'#001030', border:`2px solid #0088ff`, boxShadow:'0 0 12px #0088ff44', height:140 }}>
                                <div style={{ width:'100%', height:18, backgroundColor:'#000d20', borderBottom:'1px solid #0066cc', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <span style={{ fontSize:6, color:'#44aaff', fontFamily:'monospace', fontWeight:700 }}>DANCE★BEAT</span>
                                </div>
                                <div style={{ margin:'4px', height:48, backgroundColor:'#000510', border:'1px solid #0044aa', position:'relative', overflow:'hidden' }}>
                                    {[0,1,2,3].map(col => (
                                        <motion.div key={col} animate={{ y:[0,54] }} transition={{ duration:0.5+col*0.1, repeat:Infinity, ease:'linear', delay:col*0.15 }}
                                            style={{ position:'absolute', width:13, left:3+col*16, top:0, fontSize:11, color:['#ff4488','#44ff88','#ff8800','#4488ff'][col], fontWeight:900 }}>
                                            {['↑','↓','←','→'][col]}
                                        </motion.div>
                                    ))}
                                </div>
                                <div style={{ margin:'4px', display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:4 }}>
                                    {[['#ff4488','↑'],['#44ff88','↑'],['#ff8800','↓'],['#4488ff','↓']].map(([c,a],i) => (
                                        <motion.div key={i} animate={{ boxShadow:[`0 0 4px ${c}`,`0 0 12px ${c}`,`0 0 4px ${c}`] }} transition={{ duration:0.3+i*0.1, repeat:Infinity, delay:i*0.2 }}
                                            style={{ height:30, border:`2px solid ${c}`, backgroundColor:`${c}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:900, color:c }}>
                                            {a}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Taiko: left=346 ── */}
                        <div className="absolute bottom-0" style={{ left:346, width:80 }}>
                            <div style={{ backgroundColor:'#1a0500', border:`2px solid #ff6600`, boxShadow:'0 0 10px #ff660044', height:130 }}>
                                <div style={{ width:'100%', height:18, backgroundColor:'#100300', borderBottom:'1px solid #cc4400', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <span style={{ fontSize:6, color:'#ff8833', fontFamily:'monospace', fontWeight:700 }}>太鼓の達人</span>
                                </div>
                                <div style={{ margin:'4px', height:28, backgroundColor:'#050100', border:'1px solid #772200', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <motion.div animate={{ scale:[1,1.1,1], opacity:[0.7,1,0.7] }} transition={{ duration:0.4, repeat:Infinity }}>
                                        <span style={{ fontSize:9, color:'#ff6600', fontFamily:'monospace', fontWeight:900 }}>★DON!★</span>
                                    </motion.div>
                                </div>
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', position:'relative', width:44, height:44, borderRadius:'50%', border:'4px solid #cc3300', backgroundColor:'#1a0500', boxShadow:'0 0 8px #ff440044', margin:'4px auto' }}>
                                    <motion.div animate={{ scale:[1,1.2,1], opacity:[0.6,1,0.6] }} transition={{ duration:0.5, repeat:Infinity }}
                                        style={{ width:24, height:24, borderRadius:'50%', backgroundColor:'#660000', boxShadow:'0 0 6px #ff2200' }} />
                                    <motion.div animate={{ rotate:[-15,10,-15] }} transition={{ duration:0.4, repeat:Infinity }}
                                        style={{ position:'absolute', top:-10, left:10, width:4, height:26, backgroundColor:'#aa8855', borderRadius:2, transformOrigin:'bottom center' }} />
                                    <motion.div animate={{ rotate:[15,-10,15] }} transition={{ duration:0.4, repeat:Infinity, delay:0.2 }}
                                        style={{ position:'absolute', top:-10, right:10, width:4, height:26, backgroundColor:'#aa8855', borderRadius:2, transformOrigin:'bottom center' }} />
                                </div>
                            </div>
                        </div>

                        {/* Floor neon strip */}
                        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${PURPLE},${CYAN},${PURPLE})`, opacity:0.5 }} />
                        {/* Window glass sheen */}
                        <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(135deg,rgba(255,255,255,0.03) 0%,transparent 40%,rgba(180,0,255,0.03) 100%)' }} />
                    </div>
                </div>

                {/* ── ENTRANCE WALL ── */}
                <div className="absolute bottom-0 left-0 right-0 h-[130px]">
                    {/* Left solid wall */}
                    <div className="absolute top-0 bottom-0 left-0 w-[calc(50%-68px)]" style={{ backgroundColor:'#0a001a' }}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 7px,${PURPLE}22 7px,${PURPLE}22 8px)` }} />
                        <motion.div animate={{ opacity:[0.7,1,0.7] }} transition={{ duration:1.8, repeat:Infinity }}
                            style={{ position:'absolute', top:10, left:8, backgroundColor:'#0d0022', border:`1px solid ${PURPLE}77`, padding:'2px 4px' }}>
                            <span style={{ fontSize:6, color:PURPLE, fontFamily:'monospace', fontWeight:700, letterSpacing:1 }}>P L A Y E R 1</span>
                        </motion.div>
                        <svg width="34" height="24" viewBox="0 0 19 14" shapeRendering="crispEdges"
                             style={{ position:'absolute', bottom:34, left:10, filter:`drop-shadow(0 0 3px ${PURPLE})` }}>
                            {([
                                [4,0],[5,0],[13,0],[14,0],[3,1],[4,1],[5,1],[6,1],[12,1],[13,1],[14,1],[15,1],
                                [2,2],[3,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[14,2],[15,2],[16,2],
                                [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3],
                                [3,6],[4,6],[7,6],[8,6],[9,6],[10,6],[11,6],[14,6],[15,6],
                            ] as [number,number][]).map(([px,py],i) => (
                                <rect key={i} x={px} y={py} width={1} height={1} fill={PURPLE} />
                            ))}
                        </svg>
                        <div style={{ position:'absolute', bottom:24, left:4, right:4, height:2, background:`linear-gradient(90deg,transparent,${PURPLE}88,transparent)` }} />
                        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:12, background:`linear-gradient(0deg,${PURPLE}33,transparent)` }} />
                        {/* Neon door frame pillar — right edge of left wall */}
                        <motion.div animate={{ opacity:[0.65,1,0.65] }} transition={{ duration:0.3, repeat:Infinity }}
                            style={{ position:'absolute', top:0, right:0, width:6, height:'100%', backgroundColor:PURPLE, boxShadow:`0 0 14px ${PURPLE}, 0 0 28px ${PURPLE}77` }} />
                    </div>

                    {/* Right solid wall */}
                    <div className="absolute top-0 bottom-0 right-0 w-[calc(50%-68px)]" style={{ backgroundColor:'#0a001a' }}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 7px,${CYAN}22 7px,${CYAN}22 8px)` }} />
                        <motion.div animate={{ opacity:[1,0.7,1] }} transition={{ duration:1.8, repeat:Infinity, delay:0.9 }}
                            style={{ position:'absolute', top:10, right:8, backgroundColor:'#00161a', border:`1px solid ${CYAN}77`, padding:'2px 4px' }}>
                            <span style={{ fontSize:6, color:CYAN, fontFamily:'monospace', fontWeight:700, letterSpacing:1 }}>P L A Y E R 2</span>
                        </motion.div>
                        <svg width="28" height="22" viewBox="0 0 17 15" shapeRendering="crispEdges"
                             style={{ position:'absolute', bottom:34, right:10, filter:`drop-shadow(0 0 3px ${CYAN})` }}>
                            {([
                                [5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],
                                [3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],
                                [2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],
                                [1,3],[2,3],[3,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[13,3],[14,3],[15,3],
                                [1,8],[2,8],[4,8],[5,8],[7,8],[8,8],[10,8],[11,8],[13,8],[14,8],
                            ] as [number,number][]).map(([px,py],i) => (
                                <rect key={i} x={px} y={py} width={1} height={1} fill={CYAN} />
                            ))}
                        </svg>
                        <div style={{ position:'absolute', bottom:24, left:4, right:4, height:2, background:`linear-gradient(90deg,transparent,${CYAN}88,transparent)` }} />
                        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:12, background:`linear-gradient(0deg,${CYAN}33,transparent)` }} />
                        {/* Neon door frame pillar — left edge of right wall */}
                        <motion.div animate={{ opacity:[1,0.65,1] }} transition={{ duration:0.3, repeat:Infinity, delay:0.15 }}
                            style={{ position:'absolute', top:0, left:0, width:6, height:'100%', backgroundColor:CYAN, boxShadow:`0 0 14px ${CYAN}, 0 0 28px ${CYAN}77` }} />
                    </div>

                    {/* Door header — aluminium channel with LED strip */}
                    <div style={{ position:'absolute', top:0, left:'calc(50% - 68px)', right:'calc(50% - 68px)', height:18,
                                  background:`linear-gradient(180deg,#1a0040 0%,#0d0022 100%)`,
                                  border:`2px solid ${PURPLE}cc`, borderTop:'none',
                                  boxShadow:`0 4px 18px ${PURPLE}99, 0 0 8px ${CYAN}44` }}>
                        <div style={{ position:'absolute', bottom:3, left:0, right:0, display:'flex', justifyContent:'space-around', padding:'0 6px' }}>
                            {Array.from({ length: 10 }).map((_,i) => (
                                <motion.div key={i} animate={{ opacity:[0,1,0] }} transition={{ duration:0.35, repeat:Infinity, delay:i*0.035 }}
                                    style={{ width:5, height:5, borderRadius:'50%', backgroundColor:i%2===0?PURPLE:CYAN, boxShadow:`0 0 4px ${i%2===0?PURPLE:CYAN}` }} />
                            ))}
                        </div>
                    </div>

                    {/* Left glass door panel */}
                    <div style={{ position:'absolute', top:18, bottom:9, left:'calc(50% - 62px)', width:58,
                                  border:`2px solid ${PURPLE}cc`, borderRight:`1px solid ${PURPLE}66`,
                                  background:`linear-gradient(90deg,rgba(30,0,70,0.28),rgba(90,0,180,0.14))`,
                                  boxShadow:`inset 0 0 20px ${PURPLE}14, 0 0 10px ${PURPLE}55` }}>
                        {/* Top aluminum strip */}
                        <div style={{ position:'absolute', top:0, left:0, right:0, height:5, backgroundColor:`${PURPLE}66`, borderBottom:`1px solid ${PURPLE}99` }} />
                        {/* Handle bar */}
                        <div style={{ position:'absolute', right:9, top:'28%', width:5, height:38,
                                      backgroundColor:`${PURPLE}ee`, borderRadius:2,
                                      boxShadow:`0 0 10px ${PURPLE}, 0 0 20px ${PURPLE}77` }}>
                            <div style={{ position:'absolute', top:'18%', bottom:'18%', left:'25%', right:'25%', backgroundColor:'#d080ff', borderRadius:1 }} />
                        </div>
                        {/* Glass reflection stripe */}
                        <div style={{ position:'absolute', top:7, left:5, width:10, bottom:7, background:'linear-gradient(to right,rgba(210,120,255,0.1),transparent)', transform:'skewX(-3deg)' }} />
                        {/* Horizontal panel lines */}
                        <div style={{ position:'absolute', top:'42%', left:5, right:14, height:1, backgroundColor:`${PURPLE}44` }} />
                        <div style={{ position:'absolute', top:'70%', left:5, right:14, height:1, backgroundColor:`${PURPLE}33` }} />
                    </div>

                    {/* Right glass door panel */}
                    <div style={{ position:'absolute', top:18, bottom:9, right:'calc(50% - 62px)', width:58,
                                  border:`2px solid ${CYAN}cc`, borderLeft:`1px solid ${CYAN}66`,
                                  background:`linear-gradient(270deg,rgba(0,30,70,0.28),rgba(0,90,180,0.14))`,
                                  boxShadow:`inset 0 0 20px ${CYAN}14, 0 0 10px ${CYAN}55` }}>
                        {/* Top aluminum strip */}
                        <div style={{ position:'absolute', top:0, left:0, right:0, height:5, backgroundColor:`${CYAN}66`, borderBottom:`1px solid ${CYAN}99` }} />
                        {/* Handle bar */}
                        <div style={{ position:'absolute', left:9, top:'28%', width:5, height:38,
                                      backgroundColor:`${CYAN}ee`, borderRadius:2,
                                      boxShadow:`0 0 10px ${CYAN}, 0 0 20px ${CYAN}77` }}>
                            <div style={{ position:'absolute', top:'18%', bottom:'18%', left:'25%', right:'25%', backgroundColor:'#80eeff', borderRadius:1 }} />
                        </div>
                        {/* Glass reflection stripe */}
                        <div style={{ position:'absolute', top:7, right:5, width:10, bottom:7, background:'linear-gradient(to left,rgba(0,220,255,0.1),transparent)', transform:'skewX(3deg)' }} />
                        {/* Horizontal panel lines */}
                        <div style={{ position:'absolute', top:'42%', left:14, right:5, height:1, backgroundColor:`${CYAN}44` }} />
                        <div style={{ position:'absolute', top:'70%', left:14, right:5, height:1, backgroundColor:`${CYAN}33` }} />
                    </div>

                    {/* Center door seam */}
                    <div style={{ position:'absolute', top:18, bottom:9, left:'50%', width:2, transform:'translateX(-50%)',
                                  background:`linear-gradient(180deg,${PURPLE}cc,${CYAN}cc)`,
                                  boxShadow:`0 0 6px ${PURPLE}66, 0 0 10px ${CYAN}44` }} />


                    {/* Floor threshold */}
                    <div style={{ position:'absolute', bottom:0, left:'calc(50% - 68px)', right:'calc(50% - 68px)', height:9,
                                  background:`linear-gradient(90deg,${PURPLE}99,${CYAN}99)`,
                                  boxShadow:`0 0 16px ${PURPLE}77, 0 0 8px ${CYAN}44` }} />
                </div>
            </div>

            <Prompt active={active} color="bg-purple-400" label="ENTER ARCADE" />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOKYO TOWER + VISITOR CENTER
// SVG lattice tower (630px) above a red-orange base building (210px).
// ─────────────────────────────────────────────────────────────────────────────
function TokyoTowerStructure({ w, h }: { w: number; h: number }) {
    const cx    = w / 2;
    const RED   = '#ff5500';
    const RED2  = '#cc3300';
    const WHITE = '#f0ece0';
    const DARK  = '#3a1800';

    // Level geometry (y=0=top, y=h=bottom)
    const lv = [
        { y: h,        lx: cx-110, rx: cx+110 },  // base feet
        { y: h*0.50,   lx: cx-62,  rx: cx+62  },  // first taper
        { y: h*0.38,   lx: cx-50,  rx: cx+50  },  // pre-obs1
        { y: h*0.34,   lx: cx-60,  rx: cx+60  },  // obs1 outer (deck wider)
        { y: h*0.29,   lx: cx-52,  rx: cx+52  },  // obs1 deck bottom
        { y: h*0.26,   lx: cx-44,  rx: cx+44  },  // obs1 top / normal taper
        { y: h*0.18,   lx: cx-26,  rx: cx+26  },  // upper mid
        { y: h*0.13,   lx: cx-34,  rx: cx+34  },  // obs2 outer
        { y: h*0.10,   lx: cx-28,  rx: cx+28  },  // obs2 deck bottom
        { y: h*0.08,   lx: cx-22,  rx: cx+22  },  // obs2 top
        { y: h*0.04,   lx: cx-8,   rx: cx+8   },  // spire base
        { y: 0,        lx: cx,     rx: cx      },  // tip
    ];

    // Outer silhouette
    const L = lv.map(v => `${v.lx},${v.y}`).join(' L ');
    const R = [...lv].reverse().map(v => `${v.rx},${v.y}`).join(' L ');
    const silhouette = `M ${L} L ${R} Z`;

    // Cross bracing between adjacent levels
    const braces: string[] = [];
    const braceSegs = [[0,1,5],[1,2,4],[2,3,3],[5,6,3],[6,7,2],[8,9,2]];
    braceSegs.forEach(([from, to, steps]) => {
        const a = lv[from], b = lv[to];
        for (let i = 0; i < steps; i++) {
            const t0 = i/steps, t1 = (i+1)/steps;
            const y0 = a.y + (b.y - a.y) * t0, y1 = a.y + (b.y - a.y) * t1;
            const lx0 = a.lx + (b.lx - a.lx) * t0, lx1 = a.lx + (b.lx - a.lx) * t1;
            const rx0 = a.rx + (b.rx - a.rx) * t0, rx1 = a.rx + (b.rx - a.rx) * t1;
            braces.push(`M${lx0},${y0} L${rx1},${y1}`);
            braces.push(`M${rx0},${y0} L${lx1},${y1}`);
        }
    });

    // Inner leg lines
    const innerLeg = `M${cx-32},${h} L${cx-18},${lv[1].y} M${cx+32},${h} L${cx+18},${lv[1].y}`;

    // Observation deck rects
    const obs1y = lv[3].y, obs1h = lv[4].y - lv[3].y;
    const obs2y = lv[7].y, obs2h = lv[8].y - lv[7].y;

    // Horizontal level lines
    const hLines = [1,2,5,6,9,10].map(i => `M${lv[i].lx},${lv[i].y} L${lv[i].rx},${lv[i].y}`);

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }} aria-hidden>
            <defs>
                <linearGradient id="twRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={RED} />
                    <stop offset="100%" stopColor={RED2} />
                </linearGradient>
                <linearGradient id="twWhite" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={WHITE} />
                    <stop offset="100%" stopColor="#d8d4c8" />
                </linearGradient>
            </defs>
            {/* Main filled silhouette */}
            <path d={silhouette} fill="url(#twRed)" />
            {/* White obs deck bands */}
            <rect x={lv[3].lx} y={obs1y} width={lv[3].rx - lv[3].lx} height={obs1h} fill="url(#twWhite)" />
            <rect x={lv[7].lx} y={obs2y} width={lv[7].rx - lv[7].lx} height={obs2h} fill="url(#twWhite)" />
            {/* Inner legs */}
            <path d={innerLeg} stroke="#ff7722" strokeWidth={5} fill="none" strokeLinecap="square" />
            {/* Cross bracing */}
            {braces.map((d, i) => <path key={i} d={d} stroke={i%4<2 ? RED : WHITE} strokeWidth={1.5} opacity={i%4<2?0.55:0.3} fill="none" />)}
            {/* Horizontal level bands */}
            {hLines.map((d, i) => <path key={i} d={d} stroke={WHITE} strokeWidth={2} opacity={0.45} fill="none" />)}
            {/* Obs deck windows */}
            {Array.from({ length: 10 }).map((_, wi) => {
                const ow = lv[3].rx - lv[3].lx - 8;
                const wx = lv[3].lx + 4 + wi * (ow / 10);
                const my = (obs1y + obs1y + obs1h) / 2;
                return <rect key={wi} x={wx} y={my - 3} width={ow/10 - 2} height={6} fill="#88ccff" opacity={0.7} rx={1} />;
            })}
            {Array.from({ length: 6 }).map((_, wi) => {
                const ow = lv[7].rx - lv[7].lx - 6;
                const wx = lv[7].lx + 3 + wi * (ow / 6);
                const my = (obs2y + obs2y + obs2h) / 2;
                return <rect key={wi} x={wx} y={my - 2.5} width={ow/6 - 2} height={5} fill="#88ccff" opacity={0.7} rx={1} />;
            })}
            {/* Outline */}
            <path d={silhouette} fill="none" stroke={DARK} strokeWidth={1} opacity={0.35} />
        </svg>
    );
}

export function PhotoBoothFacade({ x, active }: FacadeProps) {
    const W = 300, H = 500;
    const PINK   = '#ff44aa';
    const HOTPNK = '#ff0088';
    const DPURP  = '#120320';
    const PURP   = '#220640';
    const MPURP  = '#1a0530';
    const LPINK  = '#ff99cc';
    const YLW    = '#ffe066';
    const CYAN   = '#44ffee';
    const stripCells = [
        { bg: '#0a1a3a', sky: '#001030', char: '#ffaacc' },
        { bg: '#0a2a1a', sky: '#003010', char: '#aaffcc' },
        { bg: '#2a1000', sky: '#1a0800', char: '#ffddaa' },
        { bg: '#0a002a', sky: '#050018', char: '#cc99ff' },
    ];

    return (
        <div className="absolute bottom-0 z-10" style={{ left: x, width: W, height: H }}>
            {/* ── Main body ── */}
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${PURP} 0%, ${MPURP} 50%, ${DPURP} 100%)`, border: `3px solid ${HOTPNK}`, boxShadow: `0 0 40px ${PINK}55, 0 0 90px ${PINK}22` }} />
            {/* Tile grid texture */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(0deg,${PINK}08 0px,${PINK}08 1px,transparent 1px,transparent 28px),repeating-linear-gradient(90deg,${PINK}08 0px,${PINK}08 1px,transparent 1px,transparent 32px)` }} />

            {/* ── FLOOR 4: ROOFTOP SIGN (y 0-94) ── */}
            <div className="absolute top-0 left-0 right-0" style={{ height: 14, background: `linear-gradient(180deg, #330a55, ${PURP})`, borderBottom: `2px solid ${HOTPNK}` }}>
                <div className="flex justify-between px-3 h-full items-end pb-1">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} style={{ width: 14, height: 10, background: PURP, border: `1px solid ${HOTPNK}66` }} />
                    ))}
                </div>
            </div>
            {/* Main sign box */}
            <div className="absolute left-[10px] right-[10px]" style={{ top: 16, height: 56 }}>
                <motion.div animate={{ boxShadow: [`0 0 18px ${HOTPNK}, 0 0 40px ${PINK}55`, `0 0 32px ${HOTPNK}, 0 0 70px ${PINK}88`, `0 0 18px ${HOTPNK}, 0 0 40px ${PINK}55`] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                    style={{ width: '100%', height: '100%', background: `linear-gradient(180deg, #330044, #1a0028)`, border: `3px solid ${HOTPNK}`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 30%, ${PINK}22, transparent 70%)` }} />
                    <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', fontFamily: 'monospace', fontWeight: 900, fontSize: 16, letterSpacing: '0.15em', color: YLW, textShadow: `0 0 12px ${YLW}, 0 0 24px ${YLW}88`, lineHeight: 1 }}>PHOTO BOOTH</div>
                    <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', fontFamily: 'serif', fontSize: 10, color: LPINK, letterSpacing: '0.5em', textShadow: `0 0 8px ${PINK}` }}>プリクラ  写真館</div>
                    <motion.div animate={{ top: [8, 46, 8] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        style={{ position: 'absolute', left: 0, right: 0, height: 2, background: `${YLW}33`, pointerEvents: 'none' }} />
                </motion.div>
            </div>
            {/* Light string */}
            <div className="absolute left-0 right-0 flex items-center justify-around px-2" style={{ top: 74, height: 20 }}>
                <div style={{ position: 'absolute', top: 6, left: 0, right: 0, height: 1, background: '#2a1040' }} />
                {[PINK, YLW, CYAN, LPINK, '#ff8800', CYAN, YLW, PINK, LPINK, '#ff8800'].map((c, i) => (
                    <motion.div key={i} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.7 + i * 0.11, repeat: Infinity, delay: i * 0.09 }}
                        style={{ width: 8, height: 12, borderRadius: '0 0 4px 4px', background: c, boxShadow: `0 0 6px ${c}, 0 0 12px ${c}66`, flexShrink: 0 }} />
                ))}
            </div>

            {/* ── FLOOR 3: DISPLAY + STRIP (y 94-210) ── */}
            <div className="absolute left-0 right-0" style={{ top: 94, height: 116, borderTop: `2px solid ${HOTPNK}44`, borderBottom: `2px solid ${HOTPNK}44`, background: `linear-gradient(180deg, #1e0538, #170430)` }}>
                <div style={{ height: 8, background: `linear-gradient(90deg, ${HOTPNK}33, ${PINK}55, ${HOTPNK}33)` }} />
                {/* Sample photo strip window */}
                <div style={{ position: 'absolute', top: 10, left: 10, width: 82, height: 96, background: '#08000e', border: `2px solid ${PINK}`, boxShadow: `0 0 14px ${PINK}33` }}>
                    <div style={{ background: HOTPNK, padding: '2px 0', textAlign: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 4.5, fontWeight: 900, color: '#fff', letterSpacing: '0.1em' }}>SAMPLE ★</span>
                    </div>
                    {stripCells.map((f, i) => (
                        <div key={i} style={{ margin: '2px 3px', height: 18, background: f.bg, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', background: f.sky }} />
                            {[4, 14, 24, 36, 48, 60].map(sx => (
                                <div key={sx} style={{ position: 'absolute', top: (sx % 5) + 1, left: sx % 75, width: 1, height: 1, background: '#fff', opacity: 0.5 }} />
                            ))}
                            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 6, height: 11, background: f.char, opacity: 0.8 }} />
                            <div style={{ position: 'absolute', bottom: 11, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: f.char, opacity: 0.75 }} />
                        </div>
                    ))}
                    <div style={{ textAlign: 'center', padding: '2px 0' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 4, color: LPINK }}>2086.03.03</span>
                    </div>
                </div>
                {/* Ad display screen */}
                <div style={{ position: 'absolute', top: 10, left: 102, right: 10, height: 96, background: '#050010', border: `2px solid ${CYAN}55`, boxShadow: `0 0 16px ${CYAN}22` }}>
                    <div style={{ padding: '5px 5px 3px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 4.5, color: CYAN, letterSpacing: '0.1em', marginBottom: 3 }}>NEW EXPERIENCE</div>
                        <div style={{ margin: '0 2px', height: 46, background: '#0a0022', position: 'relative', border: `1px solid ${PINK}44` }}>
                            <div style={{ position: 'absolute', top: 4, left: 4, right: 4, height: 26, background: `linear-gradient(135deg, #1a1a4a, #0a002a)` }} />
                            <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 8, height: 13, background: '#ffaacc' }} />
                            <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#ffccaa' }} />
                            {[8, 22, 36, 50, 64].map(sx => (
                                <motion.div key={sx} animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: sx * 0.01 }}
                                    style={{ position: 'absolute', top: 6 + sx % 8, left: sx % 75, width: 1, height: 1, background: '#fff' }} />
                            ))}
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 4, color: PINK, marginTop: 3 }}>¥400 / SESSION</div>
                    </div>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)', pointerEvents: 'none' }} />
                </div>
            </div>

            {/* ── FLOOR 2: BOOTH WINDOWS (y 210-340) ── */}
            <div className="absolute left-0 right-0" style={{ top: 210, height: 130, background: MPURP, borderTop: `2px solid ${HOTPNK}33` }}>
                <div style={{ height: 7, background: `linear-gradient(90deg, transparent, ${PINK}44, ${PINK}66, ${PINK}44, transparent)` }} />
                <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 10px 0', gap: 6 }}>
                    {[
                        { inner: '#0e0122', glow: PINK,  curtain: '#cc0066' },
                        { inner: '#001018', glow: CYAN,  curtain: '#006688' },
                        { inner: '#0e0122', glow: PINK,  curtain: '#990055' },
                    ].map((booth, i) => (
                        <div key={i} style={{ flex: 1, height: 88, background: booth.inner, border: `2px solid ${booth.glow}55`, position: 'relative', overflow: 'hidden', boxShadow: `inset 0 0 18px ${booth.glow}22` }}>
                            <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, width: 1, background: `${booth.glow}22` }} />
                            <div style={{ position: 'absolute', left: '66%', top: 0, bottom: 0, width: 1, background: `${booth.glow}22` }} />
                            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 10, height: 24, background: `${booth.glow}33` }} />
                            <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', width: 9, height: 9, borderRadius: '50%', background: `${booth.glow}44` }} />
                            <motion.div animate={{ opacity: [0, 0, 0, 0, 0.9, 0] }} transition={{ duration: 3 + i * 1.5, repeat: Infinity, delay: i * 1.8 }}
                                style={{ position: 'absolute', inset: 0, background: '#fff', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '35%', height: '100%', background: `linear-gradient(90deg, ${booth.curtain}, ${booth.curtain}88)` }} />
                            <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.8 + i * 0.3, repeat: Infinity }}
                                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: booth.glow }} />
                        </div>
                    ))}
                </div>
                {/* Vertical neon sign */}
                <div style={{ position: 'absolute', right: 4, top: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    {['写','真','館'].map((c, i) => (
                        <motion.div key={i} animate={{ textShadow: [`0 0 6px ${PINK}`, `0 0 14px ${PINK}, 0 0 28px ${PINK}`, `0 0 6px ${PINK}`] }}
                            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.22 }}
                            style={{ fontFamily: 'serif', fontSize: 13, color: LPINK, fontWeight: 700, lineHeight: 1.1 }}>{c}</motion.div>
                    ))}
                </div>
                {/* Coin machine */}
                <div style={{ position: 'absolute', left: 6, top: 14, width: 22, height: 70, background: '#0a0018', border: `1px solid ${PINK}55`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around', padding: '3px 2px' }}>
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${YLW}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: YLW }}>¥</motion.div>
                    <div style={{ fontFamily: 'monospace', fontSize: 4, color: LPINK, textAlign: 'center', lineHeight: 1.6 }}><div>¥</div><div style={{ color: YLW }}>400</div></div>
                    <div style={{ width: 10, height: 4, background: '#111', border: `1px solid ${PINK}88`, borderRadius: 1 }} />
                </div>
            </div>

            {/* ── FLOOR 1: GROUND ENTRANCE (y 340-500) ── */}
            <div className="absolute left-0 right-0 bottom-0" style={{ top: 340, background: DPURP, borderTop: `3px solid ${HOTPNK}` }}>
                {/* Awning */}
                <div style={{ height: 20, background: `repeating-linear-gradient(90deg, ${HOTPNK} 0px, ${HOTPNK} 14px, ${PINK}88 14px, ${PINK}88 28px)`, borderBottom: `2px solid #220030`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', height: 8, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                        {Array.from({ length: 22 }).map((_, i) => (
                            <div key={i} style={{ flex: 1, height: '100%', background: i % 2 === 0 ? HOTPNK : LPINK, clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
                        ))}
                    </div>
                </div>
                {/* Entrance layout */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginTop: 2 }}>
                    {/* Left kiosk */}
                    <div style={{ width: 54, height: 132, background: '#0e0220', border: `1px solid ${PINK}44`, borderRight: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 3px', gap: 4 }}>
                        <div style={{ width: 44, height: 56, background: '#080014', border: `1px solid ${PINK}66`, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ height: 9, background: HOTPNK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: 3.5, color: '#fff', fontWeight: 900 }}>STICKERS</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: 3 }}>
                                {['#ff4488','#ffcc00','#44aaff','#ff8800','#aa44ff','#44ffaa'].map((c, i) => (
                                    <motion.div key={i} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2 + i * 0.2, repeat: Infinity, delay: i * 0.15 }}
                                        style={{ width: 8, height: 8, borderRadius: 1, background: c }} />
                                ))}
                            </div>
                            <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 3.5, color: YLW }}>¥100/sheet</div>
                        </div>
                        <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}
                            style={{ fontFamily: 'monospace', fontSize: 5, color: '#44ff88', textShadow: '0 0 8px #44ff88' }}>OPEN</motion.div>
                        <div style={{ fontFamily: 'monospace', fontSize: 3.5, color: LPINK, textAlign: 'center', lineHeight: 1.6 }}>
                            <div>11:00</div><div>～</div><div>23:00</div>
                        </div>
                    </div>
                    {/* Curtain entrance */}
                    <div style={{ flex: 1, height: 132, borderTop: `2px solid ${HOTPNK}`, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ height: 8, background: `linear-gradient(90deg, #1a0030, ${HOTPNK}aa, #1a0030)` }}>
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} style={{ display: 'inline-block', width: 8, height: 4, borderRadius: '0 0 4px 4px', background: HOTPNK, margin: '4px 2px 0', verticalAlign: 'bottom' }} />
                            ))}
                        </div>
                        <div style={{ display: 'flex', height: 124, gap: 3, padding: '0 3px' }}>
                            {[PINK,'#ee2288',LPINK,'#dd0077',PINK,'#ff66bb',LPINK].map((c, i) => (
                                <motion.div key={i} animate={{ skewX: [0, i % 2 === 0 ? 3 : -3, 0] }} transition={{ duration: 2.5 + i * 0.35, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{ flex: 1, background: `linear-gradient(180deg, ${c} 0%, ${c}cc 60%, ${c}55 100%)`, borderRadius: '0 0 6px 6px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: 0, left: '15%', width: '25%', bottom: 0, background: 'rgba(255,255,255,0.1)', borderRadius: '0 0 3px 3px' }} />
                                </motion.div>
                            ))}
                        </div>
                        {[10, 30, 50, 70, 85].map((lp, i) => (
                            <motion.div key={i} animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }} transition={{ duration: 1 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
                                style={{ position: 'absolute', top: 14 + i * 12, left: `${lp}%`, fontSize: 8, color: YLW, pointerEvents: 'none', lineHeight: 1 }}>✦</motion.div>
                        ))}
                    </div>
                    {/* Right kiosk */}
                    <div style={{ width: 54, height: 132, background: '#0e0220', border: `1px solid ${PINK}44`, borderLeft: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 3px', gap: 4 }}>
                        <div style={{ width: 44, height: 38, background: '#080014', border: `1px solid ${CYAN}44`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                            <div style={{ fontSize: 16, lineHeight: 1, filter: `drop-shadow(0 0 4px ${CYAN})` }}>📷</div>
                            <div style={{ fontFamily: 'monospace', fontSize: 3.5, color: CYAN, textAlign: 'center' }}>INSTANT PRINT</div>
                        </div>
                        <div style={{ width: 44, height: 36, background: '#080014', border: `1px solid ${PINK}44`, display: 'flex', flexWrap: 'wrap', gap: 2, padding: 3 }}>
                            {['#ff4488','#4488ff','#ffcc00','#44ffaa'].map((c, i) => (
                                <div key={i} style={{ flex: '0 0 calc(50% - 1px)', height: 12, border: `2px solid ${c}`, borderRadius: 1 }} />
                            ))}
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 3.5, color: LPINK, textAlign: 'center', lineHeight: 1.6 }}>
                            <div>PRINT</div><div style={{ color: YLW }}>FRAMES</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ground glow */}
            <div className="absolute bottom-0 left-0 right-0" style={{ height: 28, background: `linear-gradient(to top, ${PINK}28, transparent)`, pointerEvents: 'none' }} />
            {/* Prompt ABOVE the building (default Prompt style: top -112) */}
            <Prompt active={active} color="bg-pink-400" label="ENTER PHOTO BOOTH" />
        </div>
    );
}

export function RooftopFacade({ x, active }: FacadeProps) {
    const W = 240, BASE_H = 210, TOWER_H = 630, TOTAL_H = BASE_H + TOWER_H - 10;

    return (
        <div className="absolute bottom-0 z-10" style={{ left: x, width: W, height: TOTAL_H }}>

            {/* ── TOWER SVG ── */}
            <div className="absolute pointer-events-none" style={{ bottom: BASE_H - 10, left: 0, width: W, height: TOWER_H }}>
                <TokyoTowerStructure w={W} h={TOWER_H} />
                {/* Aviation lights */}
                {[{ top: 0, size: 10 }, { top: TOWER_H * 0.13, size: 7 }, { top: TOWER_H * 0.34, size: 7 }].map(({ top, size }, i) => (
                    <motion.div key={i} animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.36 }}
                        style={{ position: 'absolute', top, left: W/2 - size/2, width: size, height: size, borderRadius: '50%', backgroundColor: '#ff2200', boxShadow: '0 0 12px #ff2200, 0 0 24px #ff220055' }} />
                ))}
            </div>

            {/* ── BASE BUILDING (visitor center) ── */}
            <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ height: BASE_H, background: 'linear-gradient(180deg, #1c0d00, #110700)', border: '4px solid #2a1200' }}>
                {/* Orange accent top stripe */}
                <div className="absolute top-0 left-0 right-0 h-[5px]" style={{ background: 'linear-gradient(90deg, #cc3300, #ff5500, #cc3300)' }} />
                {/* Concrete texture */}
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 9px,rgba(0,0,0,0.5) 9px,rgba(0,0,0,0.5) 10px)' }} />

                {/* Main sign */}
                <div className="absolute top-[10px] left-0 right-0 flex justify-center z-10">
                    <motion.div
                        animate={{ boxShadow: ['0 0 12px #ff4400, 0 0 28px #ff440033','0 0 22px #ff4400, 0 0 50px #ff440055','0 0 12px #ff4400, 0 0 28px #ff440033'] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        style={{ backgroundColor: '#0e0400', border: '2px solid #ff4400', padding: '6px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#ff6622', fontFamily: 'monospace', letterSpacing: '0.15em', lineHeight: 1, textShadow: '0 0 8px #ff4400' }}>TOKYO TOWER</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#ff8844', fontFamily: 'monospace', letterSpacing: '0.4em', marginTop: 2 }}>東京タワー</div>
                    </motion.div>
                </div>

                {/* Floor windows */}
                <div className="absolute left-0 right-0 flex justify-around px-4" style={{ top: 58 }}>
                    {[{ lit: true }, { lit: false }, { lit: true }, { lit: false }].map((w, i) => (
                        <BuildingWindow key={i} w={42} h={44} frameColor="#3a1800" glassColor={w.lit ? '#1e0e00' : '#110700'} glowColor={w.lit ? '#ff4400' : undefined} />
                    ))}
                </div>

                {/* Entrance */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    <div style={{ position: 'relative' }}>
                        {/* Side panels */}
                        <div className="flex gap-0">
                            <div style={{ width: 36, height: 70, backgroundColor: '#160800', borderTop: '3px solid #3a1800', borderRight: '1px solid #3a1800' }}>
                                {/* Ticket booth */}
                                <div style={{ margin: '4px', height: 40, backgroundColor: '#0e0400', border: '1px solid #3a1800' }}>
                                    <div style={{ width: '100%', height: 12, backgroundColor: '#2a0e00', borderBottom: '1px solid #3a1800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: 4, color: '#ff8844', fontFamily: 'monospace', fontWeight: 700 }}>チケット</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 28 }}>
                                        <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
                                            style={{ fontSize: 6, color: '#ff6622', fontFamily: 'monospace' }}>¥1,200</motion.span>
                                    </div>
                                </div>
                            </div>
                            {/* Center door */}
                            <EntranceDoor w={88} h={100} frameColor="#3a1800" doorColor="#0c0500" handleColor="#ff6622" step={false}>
                                <div style={{ position: 'absolute', top: 6, left: 6, right: 6, height: '40%', background: 'linear-gradient(to bottom, rgba(255,80,0,0.06), transparent)' }} />
                                <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 6, color: '#ff6622', fontFamily: 'monospace', opacity: 0.6, whiteSpace: 'nowrap' }}>いらっしゃいませ</div>
                            </EntranceDoor>
                            <div style={{ width: 36, height: 70, backgroundColor: '#160800', borderTop: '3px solid #3a1800', borderLeft: '1px solid #3a1800' }}>
                                {/* Souvenir */}
                                <div style={{ margin: '4px', height: 40, backgroundColor: '#0e0400', border: '1px solid #3a1800' }}>
                                    <div style={{ width: '100%', height: 12, backgroundColor: '#200c00', borderBottom: '1px solid #3a1800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: 4, color: '#ff8844', fontFamily: 'monospace', fontWeight: 700 }}>お土産</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: 4, justifyContent: 'center' }}>
                                        {['#ff4400','#ff8800','#cc0044','#4488ff'].map((c,i) => (
                                            <div key={i} style={{ width: 8, height: 8, borderRadius: 1, backgroundColor: c, opacity: 0.8 }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ground glow */}
                <div className="absolute bottom-0 left-0 right-0 h-[40px] pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(255,60,0,0.1), transparent)' }} />
            </div>

            <Prompt active={active} color="bg-orange-400" label="ENTER TOKYO TOWER" style={{ bottom: 230 }} />
        </div>
    );
}

// ─── Prompt component ─────────────────────────────────────────────────────────
function Prompt({ active, color, label, style }: { active?: boolean; color: string; label: string; style?: React.CSSProperties }) {
    const isMobilePrompt = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
    return (
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-50 whitespace-nowrap" style={style || { top: -112 }}>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex flex-col items-center gap-1"
            >
                <div className={`${color} text-black px-5 py-2 font-black font-mono text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3`}>
                    <span className="tracking-widest">{label}</span>
                    {isMobilePrompt
                      ? <div className="bg-yellow-300 text-black border-2 border-black px-2 h-6 flex items-center justify-center text-xs rounded font-black shrink-0">TAP ▼</div>
                      : <div className="bg-gray-900 text-white border-2 border-gray-500 w-6 h-6 flex items-center justify-center text-sm rounded shadow-[1px_1px_0_rgba(255,255,255,0.3)] shrink-0">↵</div>
                    }
                </div>
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-black" />
            </motion.div>
        </div>
    );
}
