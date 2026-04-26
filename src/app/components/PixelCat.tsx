import React, { useState, useEffect } from 'react';

// ─── helpers ──────────────────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
function darken(hex: string, amt = 0.38): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.round(r * (1 - amt))},${Math.round(g * (1 - amt))},${Math.round(b * (1 - amt))})`;
}
function lighten(hex: string, amt = 0.35): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.min(255, Math.round(r + (255 - r) * amt))},${Math.min(255, Math.round(g + (255 - g) * amt))},${Math.min(255, Math.round(b + (255 - b) * amt))})`;
}

// ─── Pixel maps ───────────────────────────────────────────────────────────────
// Key:
//   B = body colour      D = dark shade     S = stripe
//   E = eye              N = nose           W = whisker-area (lighter)
//   T = tail             . = transparent

// Shared head + body rows (0-7) used by both walk frames
const HEAD_ROWS = [
//  0 1 2 3 4 5 6 7 8 9 0 1 2
  '. . B D . . . D B . . . .',  // 0  ears (tips are dark)
  '. B B B B . B B B B . . .',  // 1  ear base
  '. B B B B B B B B B B . .',  // 2  head top
  '. B B E B B B B E B B . .',  // 3  eyes
  '. B B B B B B B B B B . .',  // 4  head lower
  '. . B W B N B W B . . . .',  // 5  nose / muzzle
  '. . B B B B B B B B T . .',  // 6  body + tail base
  '. . B S B B B S B . T T .',  // 7  body stripes + tail
];

// Walk frame A — legs in stride (front forward, rear back)
const LEGS_A = [
  '. . B . . B B . B . . T T',  // 8
  '. . B . . B B . B . . . T',  // 9
  '. B B B . B B B B . . . .',  // 10 paws
];

// Walk frame B — legs in opposite phase (front back, rear forward)
const LEGS_B = [
  '. . . B . B B . . B . T T',  // 8  front leg col 3, rear col 9
  '. . . B . B B . . B . . T',  // 9
  '. . B B B . B B . B B . .',  // 10 paws shifted right
];

const WALK_MAP_A = [...HEAD_ROWS, ...LEGS_A];
const WALK_MAP_B = [...HEAD_ROWS, ...LEGS_B];

const SIT_MAP = [
//  0 1 2 3 4 5 6 7 8 9 0
  '. . B D . . D B . . .',      // 0  ears
  '. B B B B B B B B . .',      // 1  ear base + top of head
  '. B B B B B B B B B .',      // 2  head
  '. B B E B B B E B B .',      // 3  eyes (open, alert)
  '. B B B B B B B B B .',      // 4  head lower
  '. . B W N W B B . . .',      // 5  nose
  '. . B B B B B B B . .',      // 6  chest
  '. B B B B B B B B B .',      // 7  wide body (curled)
  '. B B B B B B B B S .',      // 8  rump + tail start
  '. . B B B B B B T T .',      // 9  paws + tail across
  '. . B B B B B B . . .',      // 10 bottom paws
];

function parseMap(
  map: string[],
  body: string, dark: string, eyeC: string, noseC: string, lighter: string
): [number, number, string][] {
  const pixels: [number, number, string][] = [];
  map.forEach((row, r) => {
    row.split(' ').forEach((ch, c) => {
      let fill = '';
      if      (ch === 'B') fill = body;
      else if (ch === 'D') fill = dark;
      else if (ch === 'S') fill = dark;
      else if (ch === 'T') fill = dark;
      else if (ch === 'E') fill = eyeC;
      else if (ch === 'N') fill = noseC;
      else if (ch === 'W') fill = lighter;
      if (fill) pixels.push([r, c, fill]);
    });
  });
  return pixels;
}

// ─── Component ────────────────────────────────────────────────────────────────
interface PixelCatProps {
  color?: string;
  scale?: number;
  sitting?: boolean;
}

export function PixelCat({ color = '#e8884a', scale = 3, sitting = false }: PixelCatProps) {
  // Internal walk-frame cycle — flips at ~8 fps, pauses while sitting
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (sitting) return;
    const id = setInterval(() => setFrame(f => f === 0 ? 1 : 0), 115);
    return () => clearInterval(id);
  }, [sitting]);

  const dark    = darken(color);
  const eyeC    = '#7bd4f8';
  const noseC   = '#ff9eb5';
  const lighter = lighten(color, 0.5);

  const map    = sitting ? SIT_MAP : (frame === 0 ? WALK_MAP_A : WALK_MAP_B);
  const cols   = sitting ? 11 : 13;
  const rows   = map.length;
  const pixels = parseMap(map, color, dark, eyeC, noseC, lighter);

  const W = cols * scale;
  const H = rows * scale;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ imageRendering: 'pixelated', display: 'block' }}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {pixels.map(([r, c, fill], i) => (
        <rect key={i} x={c * scale} y={r * scale} width={scale} height={scale} fill={fill} />
      ))}
    </svg>
  );
}

// ─── Available coat colours ───────────────────────────────────────────────────
export const CAT_COLORS = [
  '#e8884a', // orange tabby
  '#b0b0b8', // grey
  '#f4f0e8', // cream / white
  '#2e2b38', // black
  '#c4855a', // brown tabby
];