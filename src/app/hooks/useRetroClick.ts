import { useEffect, useRef } from "react";

export function useRetroClick(enabled: boolean = true) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on mount
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playClick = () => {
    if (!enabled || !audioContextRef.current) return;

    // Resume context if suspended (browser policy)
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    const osc = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    // 16-bit retro UI sound configuration
    osc.type = "square";
    // Quick pitch envelope for a "blip" effect
    osc.frequency.setValueAtTime(400, audioContextRef.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioContextRef.current.currentTime + 0.05);

    // Volume envelope
    gainNode.gain.setValueAtTime(0.05, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    osc.start();
    osc.stop(audioContextRef.current.currentTime + 0.05);
  };

  useEffect(() => {
    const handleInteraction = () => {
      playClick();
    };

    // Use mousedown for instant feedback
    window.addEventListener("mousedown", handleInteraction);
    return () => {
      window.removeEventListener("mousedown", handleInteraction);
    };
  }, [enabled]);
}
