import { Outlet } from "react-router";
import { MusicProvider } from "./MusicContext";
import { MusicPlayer } from "./MusicPlayer";
import { InteractionSounds } from "./InteractionSounds";
import { PixelCursor } from "./PixelCursor";

export function Layout() {
  return (
    <MusicProvider>
      <PixelCursor />
      <InteractionSounds />
      <MusicPlayer volume={0.4} loop={true} />
      <Outlet />
    </MusicProvider>
  );
}
