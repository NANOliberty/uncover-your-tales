import { createContext, useContext, useState, ReactNode } from 'react';

// ─── Track catalogue ──────────────────────────────────────────────────────────
export const TRACK_TITLE = 'https://raw.githubusercontent.com/crlazy101/Tokyo-Audio/main/title-theme_lwupzw.mp3';
export const TRACK_RAMEN = 'https://raw.githubusercontent.com/crlazy101/Tokyo-Audio/main/Steam_Over_Noodles_ndfojo.ogg';

// ─── Context ──────────────────────────────────────────────────────────────────
interface MusicContextValue {
  currentSrc: string;
  setTrack: (src: string) => void;
}

const MusicContext = createContext<MusicContextValue>({
  currentSrc: TRACK_TITLE,
  setTrack: () => {},
});

export function MusicProvider({ children }: { children: ReactNode }) {
  const [currentSrc, setCurrentSrc] = useState(TRACK_TITLE);
  return (
    <MusicContext.Provider value={{ currentSrc, setTrack: setCurrentSrc }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  return useContext(MusicContext);
}