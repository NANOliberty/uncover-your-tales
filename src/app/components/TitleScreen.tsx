import { TitleOverlay } from "./TitleOverlay";
import { PixelCity } from "./PixelCity";
import { Rain } from "./Rain";
import { motion } from "motion/react";
import { useNavigate } from "react-router";

export function TitleScreen() {
  const navigate = useNavigate();

  return (
    <div
      className="relative w-full h-screen bg-black overflow-hidden select-none font-sans cursor-pointer"
      onClick={() => navigate('/customization')}
    >
      <PixelCity />
      <Rain />
      
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-40 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.8)_100%)]" />

      {/* CRT Scanlines - Animated */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]"
        style={{ backgroundSize: "100% 4px, 6px 100%" }}
        animate={{ backgroundPosition: ["0% 0%", "0% 100%"] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Subtle Color Glitch / Chromatic Aberration Pulse */}
      <motion.div 
         className="absolute inset-0 pointer-events-none z-50 mix-blend-color-dodge opacity-0"
         animate={{ opacity: [0, 0.05, 0] }}
         transition={{ duration: 5, repeat: Infinity, times: [0, 0.1, 1], repeatDelay: 3 }}
         style={{ backgroundColor: 'rgba(255, 0, 255, 0.2)' }}
      />

      <TitleOverlay />
    </div>
  );
}