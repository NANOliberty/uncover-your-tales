import { useEffect, useRef } from 'react';

export function InteractionSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const playClickSound = () => {
      // Initialize AudioContext on user interaction if not present
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'closed') return;

      // Resume context if suspended (browser policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create oscillator for a 16-bit retro "blip" sound
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // "Square" wave gives that authentic 8-bit/16-bit chiptune texture
      osc.type = 'square';
      
      // Pitch envelope: High to Low (typical UI 'select' sound)
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      
      // Volume envelope: Short and snappy
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    };

    window.addEventListener('mousedown', playClickSound);

    return () => {
      window.removeEventListener('mousedown', playClickSound);
      // We don't close the context here to avoid recreation overhead if component remounts quickly,
      // but in a strict cleanup we might. For a global singleton-like component, it's fine.
    };
  }, []);

  return null;
}
