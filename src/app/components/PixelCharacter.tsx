import React from 'react';

// Define the pixel art grid size
const GRID_W = 16;
const GRID_H = 24;

interface PixelCharacterProps {
  style: string;
  hair: string;
  hairColor: string;
  gender: string;
  skin: string;
  scale?: number;
}

export function PixelCharacter({ 
    style = 'STREETWEAR', 
    hair = 'SPIKY', 
    hairColor = '#4a3020', 
    gender = 'NEUTRAL', 
    skin = '#ffdbac', 
    scale = 1 
}: PixelCharacterProps) {
    // 16x24 Grid
    const pixels: string[][] = Array(GRID_H).fill(null).map(() => Array(GRID_W).fill(null));

    // Helper to paint a rect
    const fillRect = (x: number, y: number, w: number, h: number, c: string) => {
        for(let i=y; i<y+h; i++) {
            for(let j=x; j<x+w; j++) {
                if(i>=0 && i<GRID_H && j>=0 && j<GRID_W) pixels[i][j] = c;
            }
        }
    };

    // Color Palette based on selection
    const colors = {
        skin: skin,
        hair: hairColor, 
        top: '#cccccc',
        bottom: '#334455',
        shoes: '#111111',
        detail: '#ffffff'
    };

    // Style & Gender Logic
    if (style === 'STREETWEAR') {
        if (gender === 'MASC') {
            colors.top = '#111111'; // Black hoodie
            colors.bottom = '#556644'; // Cargo pants
            colors.shoes = '#eeeeee'; // White high-tops
            colors.detail = '#ffaa00'; // Orange strings
        } else if (gender === 'FEM') {
            colors.top = '#cc2244'; // Red cropped hoodie
            colors.bottom = '#111111'; // Black leggings/pants
            colors.shoes = '#ffffff'; // White sneakers
            colors.detail = '#eeeeee'; // White strings
        } else { // NEUTRAL
            colors.top = '#445566'; // Oversized Blue-grey hoodie
            colors.bottom = '#222222'; // Baggy black shorts over leggings
            colors.shoes = '#aa22cc'; // Purple sneakers
            colors.detail = '#00ffff'; // Cyan graphics
        }
    } else if (style === 'SCHOOL') {
        if (gender === 'MASC') {
            colors.top = '#ffffff'; // White shirt
            colors.bottom = '#222222'; // Black trousers
            colors.shoes = '#332211'; // Loafers
            colors.detail = '#2233aa'; // Blue Tie
        } else if (gender === 'FEM') {
            colors.top = '#ffffff'; // White shirt (sailor style?)
            colors.bottom = '#334466'; // Navy skirt
            colors.shoes = '#332211'; // Loafers
            colors.detail = '#cc2222'; // Red Ribbon/Bow
        } else { // NEUTRAL
            colors.top = '#f0e6d2'; // Beige Vest/Cardigan
            colors.bottom = '#554433'; // Brown plaid pants (slacks)
            colors.shoes = '#442211'; // Brown shoes
            colors.detail = '#226622'; // Green Tie
        }
    } else if (style === 'VINTAGE') {
        if (gender === 'MASC') {
            colors.top = '#554433'; // Tweed Jacket
            colors.bottom = '#332211'; // Brown trousers
            colors.shoes = '#221100'; // Dark boots
            colors.detail = '#ddccaa'; // Cream shirt underneath
        } else if (gender === 'FEM') {
            colors.top = '#883333'; // Maroon blouse
            colors.bottom = '#ccaa88'; // Long beige skirt
            colors.shoes = '#442211'; // Brown heels/boots
            colors.detail = '#ffdddd'; // Pearl necklace
        } else { // NEUTRAL
            colors.top = '#445566'; // Denim Overalls / Workwear
            colors.bottom = '#445566'; // Denim
            colors.shoes = '#664422'; // Work boots
            colors.detail = '#cc4444'; // Red flannel shirt underneath
        }
    } else if (style === 'TECHWEAR') {
        if (gender === 'MASC') {
            colors.top = '#222222'; // Tactical vest black
            colors.bottom = '#111111'; // Cargo pants with straps
            colors.shoes = '#444444'; // Combat boots
            colors.detail = '#00ff00'; // Green LEDs
        } else if (gender === 'FEM') {
            colors.top = '#111122'; // Bodysuit dark blue
            colors.bottom = '#222233'; // Skirt with leggings
            colors.shoes = '#cccccc'; // Silver boots
            colors.detail = '#ff00ff'; // Pink Neon
        } else { // NEUTRAL
            colors.top = '#333333'; // Poncho / Cloak
            colors.bottom = '#1a1a1a'; // Hakama pants
            colors.shoes = '#222222'; // Tabi boots
            colors.detail = '#00ffff'; // Cyan mask/display
        }
    }

    // --- DRAWING ---

    // 1. BASE BODY
    // Head
    fillRect(5, 2, 6, 5, colors.skin);
    // Neck
    fillRect(7, 7, 2, 1, colors.skin);
    // Arms (Base skin)
    fillRect(4, 8, 2, 8, colors.skin);
    fillRect(10, 8, 2, 8, colors.skin);
    // Legs (Base skin)
    fillRect(5, 16, 2, 8, colors.skin);
    fillRect(9, 16, 2, 8, colors.skin);

    // 2. CLOTHING (Layers over body)
    
    // Top
    if (style === 'TECHWEAR' && gender === 'NEUTRAL') {
        // Poncho style (Refined)
        // Center Body (under cloak)
        fillRect(6, 8, 4, 8, '#222');
        
        // Cloak/Poncho Drapes
        fillRect(5, 8, 6, 6, colors.top); // Main drape
        
        // Arms (Cybernetic/Sleeved) - visible on sides
        // Left Arm
        fillRect(4, 8, 2, 5, '#1a1a1a'); // Dark sleeve
        fillRect(4, 13, 2, 2, colors.detail); // Cyber gauntlet
        fillRect(4, 15, 2, 1, colors.skin); // Hand
        
        // Right Arm
        fillRect(10, 8, 2, 5, '#1a1a1a'); // Dark sleeve
        fillRect(10, 13, 2, 2, colors.detail); // Cyber gauntlet
        fillRect(10, 15, 2, 1, colors.skin); // Hand

    } else {
        // Standard Torso
        fillRect(6, 8, 4, 8, colors.top);
        // Sleeves
        fillRect(4, 8, 2, 4, colors.top); // Short sleeves
        fillRect(10, 8, 2, 4, colors.top);
    }

    // Long Sleeves Check
    if (
        style === 'STREETWEAR' || 
        (style === 'VINTAGE' && gender !== 'FEM') || 
        (style === 'TECHWEAR' && gender !== 'NEUTRAL') || 
        (style === 'SCHOOL' && gender === 'NEUTRAL')
    ) {
        fillRect(4, 12, 2, 4, colors.top);
        fillRect(10, 12, 2, 4, colors.top);
    }
    
    // Bottoms
    if (gender === 'FEM' && (style === 'SCHOOL' || style === 'VINTAGE' || style === 'TECHWEAR')) {
        // Skirt
        const skirtLen = style === 'VINTAGE' ? 7 : 4;
        fillRect(5, 15, 6, skirtLen, colors.bottom);
        
        if (style === 'SCHOOL') {
            // High socks
            fillRect(5, 20, 2, 2, '#ffffff');
            fillRect(9, 20, 2, 2, '#ffffff');
        } else if (style === 'TECHWEAR') {
             // Leggings under skirt
             fillRect(5, 19, 2, 3, '#111');
             fillRect(9, 19, 2, 3, '#111');
        }
    } else if (gender === 'NEUTRAL' && style === 'STREETWEAR') {
        // Shorts over leggings
        fillRect(5, 15, 6, 4, colors.bottom); // Shorts
        fillRect(5, 19, 2, 3, '#111'); // Leggings
        fillRect(9, 19, 2, 3, '#111');
    } else if (gender === 'NEUTRAL' && style === 'TECHWEAR') {
        // Hakama (wide pants)
        fillRect(4, 15, 3, 7, colors.bottom);
        fillRect(9, 15, 3, 7, colors.bottom);
        fillRect(7, 15, 2, 4, colors.bottom); // Crotch drop
    } else if (gender === 'NEUTRAL' && style === 'VINTAGE') {
        // Overalls
        fillRect(5, 15, 2, 7, colors.bottom);
        fillRect(9, 15, 2, 7, colors.bottom);
        fillRect(6, 15, 4, 3, colors.bottom);
        // Bib
        fillRect(6, 9, 4, 4, colors.bottom);
        // Straps
        fillRect(6, 8, 1, 1, colors.bottom);
        fillRect(9, 8, 1, 1, colors.bottom);
        // Shirt underneath (drawn by base top color logic earlier, but let's reinforce the red flannel)
        colors.top = colors.detail; 
        fillRect(4, 8, 2, 4, colors.top); // Sleeves
        fillRect(10, 8, 2, 4, colors.top); 
    } else {
        // Standard Pants
        fillRect(5, 15, 2, 7, colors.bottom); // Left leg
        fillRect(9, 15, 2, 7, colors.bottom); // Right leg
        fillRect(6, 15, 4, 2, colors.bottom); // Waist connection
    }

    // Shoes
    fillRect(4, 22, 4, 2, colors.shoes);
    fillRect(9, 22, 4, 2, colors.shoes);

    // Details / Accessories Render
    if (style === 'SCHOOL') {
        // Tie or Ribbon
        if (gender === 'FEM') {
            fillRect(7, 9, 2, 2, colors.detail); // Bow
        } else {
            fillRect(7, 9, 2, 4, colors.detail); // Tie
        }
    }
    if (style === 'STREETWEAR') {
        // Logo or pattern
        if (gender === 'FEM') {
             // Crop top exposure?
             fillRect(6, 14, 4, 1, colors.skin);
        }
        fillRect(7, 10, 2, 1, colors.detail);
    }
    if (style === 'TECHWEAR') {
        // Cyber visuals
        if (gender === 'NEUTRAL') {
             // Visor (eyes level)
             fillRect(5, 4, 6, 1, colors.detail);
             // Chest details on Poncho
             fillRect(7, 11, 2, 2, colors.detail);
        } else {
             // LEDs
             fillRect(5, 17, 1, 1, colors.detail);
             fillRect(10, 19, 1, 1, colors.detail);
        }
    }

    // 3. FACE
    // Eyes
    // For Techwear Neutral, we draw a Visor in Details step which covers eye level (y=4).
    if (!(style === 'TECHWEAR' && gender === 'NEUTRAL')) {
        fillRect(6, 4, 1, 1, '#222222');
        fillRect(9, 4, 1, 1, '#222222');
    }
    
    // 4. HAIR
    // Beanie overrides normal hair logic partially
    if (hair === 'BEANIE') {
        fillRect(4, 1, 8, 3, '#333333'); 
        fillRect(5, 0, 6, 1, '#333333');
        
        // Hair poking out bottom uses the real user hair color
        fillRect(4, 4, 1, 2, hairColor);
        fillRect(11, 4, 1, 2, hairColor);
    } else {
        if (hair === 'SHORT') {
            fillRect(5, 1, 6, 2, colors.hair);
            fillRect(4, 2, 1, 2, colors.hair);
            fillRect(11, 2, 1, 2, colors.hair);
        } else if (hair === 'LONG') {
            fillRect(5, 1, 6, 2, colors.hair); // Top
            fillRect(4, 2, 1, 8, colors.hair); // Left side
            fillRect(11, 2, 1, 8, colors.hair); // Right side
            fillRect(12, 3, 1, 6, colors.hair); // Extra volume right
            fillRect(3, 3, 1, 6, colors.hair); // Extra volume left
        } else if (hair === 'SPIKY') {
            fillRect(5, 1, 6, 1, colors.hair);
            fillRect(6, 0, 1, 1, colors.hair);
            fillRect(8, 0, 1, 1, colors.hair);
            fillRect(10, 0, 1, 1, colors.hair);
            fillRect(4, 2, 1, 3, colors.hair); // Sideburns
            fillRect(11, 2, 1, 3, colors.hair);
        }
    }

    // Render SVG Rects
    return (
        <svg 
            width={GRID_W * scale} 
            height={GRID_H * scale} 
            viewBox={`0 0 ${GRID_W} ${GRID_H}`} 
            style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
        >
            {pixels.map((row, y) => 
                row.map((color, x) => {
                    if (!color) return null;
                    return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />;
                })
            )}
        </svg>
    );
}
