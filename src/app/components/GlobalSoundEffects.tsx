import { useEffect, useRef } from 'react';

interface GlobalSoundEffectsProps {
  volume?: number; // 0.0 to 1.0
  frequency?: number; // Base frequency in Hz
}

export function GlobalSoundEffects({ volume = 0.03, frequency = 600 }: GlobalSoundEffectsProps) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current = new AudioContext();
    }

    const playClickSound = () => {
      if (!audioContextRef.current) return;

      const ctx = audioContextRef.current;
      
      // Resume context if suspended (browser policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // 16-bit style "blip"
      oscillator.type = 'square';
      
      // Pitch envelope: slight drop to give it weight
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, ctx.currentTime + 0.08);

      // Volume envelope: quick attack, short decay
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1);
    };

    // Use mousedown for immediate feedback
    window.addEventListener('mousedown', playClickSound);

    return () => {
      window.removeEventListener('mousedown', playClickSound);
      // We don't necessarily want to close the context on unmount if we navigate, 
      // but since this is in Layout, it persists. 
      // If it unmounts, we should close it to clean up.
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [volume, frequency]);

  return null;
}
