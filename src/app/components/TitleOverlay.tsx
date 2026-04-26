import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

export function TitleOverlay() {
  const [showPress, setShowPress] = useState(true);
  const navigate = useNavigate();

  // Blinking effect logic
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPress((prev) => !prev);
    }, 600); // 600ms on/off
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
      
      {/* Main Title */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ 
            y: 0, 
            opacity: 1,
            textShadow: [
                "4px 4px 0px #ff00ff, -4px -4px 0px #00ffff, 0 0 30px rgba(255, 0, 255, 0.6)",
                "4px 4px 0px #ff00cc, -4px -4px 0px #00ccff, 0 0 50px rgba(255, 0, 255, 0.8)",
                "4px 4px 0px #ff00ff, -4px -4px 0px #00ffff, 0 0 30px rgba(255, 0, 255, 0.6)"
            ]
        }}
        transition={{ 
            y: { duration: 1, type: "spring" },
            opacity: { duration: 1 },
            textShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
        className="mb-4"
      >
        <h1 
            className="text-6xl sm:text-7xl md:text-9xl text-white tracking-widest text-center px-4"
            style={{ 
                fontFamily: '"Press Start 2P", monospace',
                lineHeight: '1.2'
            }}
        >
          TOKYO
        </h1>
      </motion.div>

      {/* Subtitle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, color: ["#67e8f9", "#e0f2fe", "#67e8f9"] }} // Cyan to very light cyan back to cyan
        transition={{ delay: 0.8, duration: 1, color: { duration: 3, repeat: Infinity } }}
        className="mb-24 text-center"
      >
        <p className="text-xl md:text-2xl tracking-wider"
           style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0px #000' }}>
            EXPLORE THE CITY
        </p>
      </motion.div>

      {/* Blinking Button */}
      <div 
        className="pointer-events-auto cursor-pointer group hover:scale-105 transition-transform duration-100 active:scale-95"
        onClick={() => navigate('/customization')}
      >
         <div 
            className={`text-lg md:text-xl text-yellow-400 bg-black/90 px-8 py-4 border-4 border-white transition-opacity duration-0 ${showPress ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            style={{ 
                fontFamily: '"Press Start 2P", monospace',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.5)'
            }}
         >
            [ TAP TO ENTER ]
         </div>
      </div>

    </div>
  );
}
