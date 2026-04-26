import { useEffect, useRef, useState } from 'react';
import { useMusic } from './MusicContext';

interface MusicPlayerProps {
  volume?: number;
  loop?: boolean;
}

export function MusicPlayer({ volume = 0.5, loop = true }: MusicPlayerProps) {
  const { currentSrc } = useMusic();
  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted,     setMuted]     = useState(false); // user intent — false = wants sound

  // ── Helper: attempt playback (browser only allows this after a gesture) ───────
  const tryPlay = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  // ── Build / swap audio element whenever the track changes ────────────────────
  useEffect(() => {
    if (!currentSrc) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const audio = new Audio(currentSrc);
    audio.loop   = loop;
    audio.volume = volume;
    audioRef.current = audio;

    // Optimistically attempt autoplay — succeeds only when the browser has
    // already been unlocked (e.g. user navigated between pages mid-session).
    if (!muted) {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => {}); // blocked silently — unlock fires on first gesture
    }

    return () => { audio.pause(); audio.src = ''; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSrc, loop]);

  // ── Keep volume in sync ───────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // ── First-gesture unlock ──────────────────────────────────────────────────────
  // Only active while audio is wanted but not yet playing.
  // Any click or keydown anywhere on the page starts playback.
  useEffect(() => {
    if (muted || isPlaying) return; // already sorted — no listener needed

    const unlock = () => {
      if (!muted && audioRef.current && !isPlaying) tryPlay();
    };

    window.addEventListener('click',   unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('click',   unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [muted, isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentSrc) return null;

  // ── Toggle button — three distinct states ────────────────────────────────────
  // 1. Muted  → click → unmute + start playing
  // 2. Unmuted, not yet playing (autoplay pending) → click → start playing
  // 3. Unmuted + playing → click → pause + mute
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (muted) {
      setMuted(false);
      tryPlay();
    } else if (!isPlaying) {
      // Autoplay was blocked — button acts as the "start music" gesture
      tryPlay();
    } else {
      setMuted(true);
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
      <button
        onClick={handleToggle}
        className="text-xs text-white bg-black/50 p-2 rounded border border-white/20 hover:bg-white/10"
        style={{ fontFamily: '"Press Start 2P"', cursor: 'none' }}
      >
        {!muted ? '🔊 ON' : '🔇 OFF'}
      </button>
    </div>
  );
}
