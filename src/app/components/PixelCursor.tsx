import { useEffect, useRef } from 'react';

// ─── Color palette ────────────────────────────────────────────────────────────
const BK = '#0c0806'; // warm near-black border
const AM = '#ffd060'; // amber fill  (matches the ramen shop lamp)
const LT = '#ffe89a'; // lighter amber inner highlight
const HI = '#fffce8'; // bright tip pixel

// ─── 16×16 pixel art arrow cursor ────────────────────────────────────────────
// 0 = transparent | 1 = border (BK) | 2 = fill (AM) | 3 = inner-lite (LT) | 4 = tip (HI)
type P = 0 | 1 | 2 | 3 | 4;

const CURSOR: P[][] = [
  [4],
  [1, 1],
  [1, 3, 1],
  [1, 2, 2, 1],
  [1, 2, 3, 2, 1],
  [1, 2, 2, 2, 2, 1],
  [1, 2, 3, 2, 2, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 3, 2, 2, 2, 2, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1],
  [1, 2, 2, 2, 1, 2, 2, 1],
  [1, 2, 2, 1, 0, 1, 2, 2, 1],
  [1, 2, 1, 0, 0, 0, 1, 2, 2, 1],
  [1, 1, 0, 0, 0, 0, 0, 1, 1, 1],
];

const COLOR: Record<P, string | null> = {
  0: null,
  1: BK,
  2: AM,
  3: LT,
  4: HI,
};

// Pixel size in SVG units: each "pixel" = 2×2 → SVG is 32×32 total
const PX = 2;

export function PixelCursor() {
  const divRef = useRef<HTMLDivElement>(null);
  // Detect touch/mobile — hover:none means the primary input is touch
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

  useEffect(() => {
    if (isTouch) return; // Skip on touch devices — don't hide the native cursor

    // Override every element's cursor so nothing reverts to the native pointer
    const styleEl = document.createElement('style');
    styleEl.id = 'pixel-cursor-override';
    styleEl.textContent = `*, *::before, *::after { cursor: none !important; }`;
    document.head.appendChild(styleEl);

    // Track mouse — direct DOM update, bypasses React scheduler for zero lag
    const onMove = (e: MouseEvent) => {
      const el = divRef.current;
      if (el) {
        el.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
        if (el.style.visibility === 'hidden') el.style.visibility = 'visible';
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });

    return () => {
      styleEl.remove();
      window.removeEventListener('mousemove', onMove);
    };
  }, [isTouch]);

  if (isTouch) return null;

  // Pre-compute rects once (they never change)
  const rects = CURSOR.flatMap((row, r) =>
    row.map((v, c) => {
      const fill = COLOR[v];
      if (!fill) return null;
      return (
        <rect
          key={`${r}-${c}`}
          x={c * PX}
          y={r * PX}
          width={PX}
          height={PX}
          fill={fill}
        />
      );
    })
  );

  return (
    <div
      ref={divRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        // Start hidden until the first mouse move, so it doesn't flash at (0,0)
        visibility: 'hidden',
        pointerEvents: 'none',
        zIndex: 2147483647, // max z-index
        willChange: 'transform',
      }}
    >
      <svg
        width={32}
        height={32}
        viewBox="0 0 32 32"
        style={{ display: 'block', imageRendering: 'pixelated' }}
        shapeRendering="crispEdges"
      >
        <defs>
          {/* Subtle drop shadow for readability on any background */}
          <filter id="pcur-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="1"
              dy="1.5"
              stdDeviation="0.6"
              floodColor="rgba(0,0,0,0.6)"
            />
          </filter>
        </defs>
        <g filter="url(#pcur-shadow)">
          {rects}
        </g>
      </svg>
    </div>
  );
}