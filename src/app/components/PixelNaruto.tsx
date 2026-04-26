import React from 'react';

const GRID_W = 16;
const GRID_H = 24;

interface PixelNarutoProps {
  scale?: number;
}

export function PixelNaruto({ scale = 3 }: PixelNarutoProps) {
  const pixels: (string | null)[][] = Array(GRID_H).fill(null).map(() => Array(GRID_W).fill(null));

  const fill = (x: number, y: number, w: number, h: number, c: string) => {
    for (let row = y; row < y + h; row++) {
      for (let col = x; col < x + w; col++) {
        if (row >= 0 && row < GRID_H && col >= 0 && col < GRID_W) {
          pixels[row][col] = c;
        }
      }
    }
  };
  const dot = (x: number, y: number, c: string) => fill(x, y, 1, 1, c);

  // ── Palette ────────────────────────────────────────────────────────────────
  const HAIR    = '#FFD000'; // blond
  const HAIR_D  = '#C8A400'; // darker hair shadow
  const SKIN    = '#F5A464'; // face / hands
  const SKIN_D  = '#D4834A'; // whisker marks / shading
  const EYE     = '#3A90DD'; // blue eyes
  const MOUTH   = '#C0603A'; // mouth
  const ORANGE  = '#FF6200'; // jumpsuit
  const DARKO   = '#C84400'; // jumpsuit shadows / zipper
  const BAND_B  = '#1A3C94'; // headband cloth (blue)
  const BAND_P  = '#B8BCC8'; // headband silver plate
  const BAND_E  = '#5570CC'; // engraved scratch on plate
  const BELT_W  = '#F0EEE8'; // white belt / bandage wrap
  const BOOT_N  = '#1E2A60'; // navy boot
  const BOOT_K  = '#060A18'; // boot sole

  // ── Hair spikes (4 irregular spikes, very Naruto) ──────────────────────────
  dot(5, 0, HAIR); dot(7, 0, HAIR); dot(9, 0, HAIR); dot(11, 0, HAIR);
  dot(4, 0, HAIR_D); dot(6, 0, HAIR_D); // gap shadows between spikes
  fill(4, 1, 8, 1, HAIR);              // spike base row
  fill(3, 2, 10, 1, HAIR);             // widest hair row

  // Side tufts alongside the headband
  dot(3, 3, HAIR); dot(12, 3, HAIR);
  dot(3, 4, HAIR); dot(12, 4, HAIR);

  // ── Headband ───────────────────────────────────────────────────────────────
  // Blue cloth on the sides (rows 3–4, outermost cols)
  fill(3, 3, 2, 2, BAND_B);   // left cloth
  fill(11, 3, 2, 2, BAND_B);  // right cloth

  // Silver metal plate (forehead center)
  fill(5, 3, 6, 2, BAND_P);

  // Engraved mark on plate (simplified Konoha leaf — just a fork shape)
  dot(7, 3, BAND_E); dot(8, 3, BAND_E);
  dot(7, 4, BAND_E); dot(8, 4, BAND_E);

  // ── Face ───────────────────────────────────────────────────────────────────
  fill(4, 5, 8, 5, SKIN); // main face area rows 5–9

  // Eyes (row 6)
  fill(5, 6, 2, 1, EYE);
  fill(9, 6, 2, 1, EYE);

  // Whisker marks — 3 marks per cheek as single dark pixels on rows 6,7,8
  dot(4, 6, SKIN_D); dot(4, 7, SKIN_D); dot(4, 8, SKIN_D); // left cheek
  dot(11, 6, SKIN_D); dot(11, 7, SKIN_D); dot(11, 8, SKIN_D); // right cheek

  // Mouth (row 8, small smile)
  fill(7, 8, 2, 1, MOUTH);

  // Chin (row 9, narrower)
  fill(5, 9, 6, 1, SKIN);

  // ── Body ───────────────────────────────────────────────────────────────────
  fill(6, 10, 4, 1, ORANGE);          // neck / collar
  fill(4, 11, 8, 1, ORANGE);          // shoulders
  fill(2, 12, 12, 4, ORANGE);         // arms + torso rows 12–15

  // Zipper / front seam down the center
  dot(7, 12, DARKO); dot(8, 12, DARKO);
  dot(7, 13, DARKO); dot(8, 13, DARKO);
  dot(7, 14, DARKO); dot(8, 14, DARKO);

  // Arm highlight edges (shadow side)
  fill(2, 12, 1, 4, DARKO);   // left arm outer
  fill(13, 12, 1, 4, DARKO);  // right arm outer

  // ── Belt ───────────────────────────────────────────────────────────────────
  fill(3, 15, 10, 2, BELT_W);   // white bandage belt

  // ── Legs ───────────────────────────────────────────────────────────────────
  fill(3, 17, 3, 3, ORANGE);    // left leg
  fill(10, 17, 3, 3, ORANGE);   // right leg

  // ── Boots ──────────────────────────────────────────────────────────────────
  fill(2, 20, 4, 2, BOOT_N);   // left boot upper
  fill(2, 22, 4, 2, BOOT_K);   // left boot sole
  fill(10, 20, 4, 2, BOOT_N);  // right boot upper
  fill(10, 22, 4, 2, BOOT_K);  // right boot sole

  // ── Render ─────────────────────────────────────────────────────────────────
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
