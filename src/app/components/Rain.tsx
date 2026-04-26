import { useEffect, useRef } from 'react';

export function Rain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let raindrops: { x: number; y: number; speed: number; length: number; opacity: number }[] = [];
    let splashes: { x: number; y: number; age: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Reset raindrops on resize
      raindrops = [];
      splashes = [];
      const count = Math.floor(canvas.width / 4);
      for (let i = 0; i < count; i++) {
        raindrops.push({
          x: Math.random() * canvas.width * 1.5 - canvas.width * 0.2, // Wider spawn area for diagonal rain
          y: Math.random() * canvas.height,
          speed: 15 + Math.random() * 10, // Faster
          length: 5 + Math.random() * 7,
          opacity: 0.3 + Math.random() * 0.5
        });
      }
    };

    window.addEventListener('resize', resize);
    resize();

    // Draw
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Raindrops
      ctx.lineWidth = 1;
      
      raindrops.forEach((drop) => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.length * 0.5, drop.y + drop.length); // Diagonal streak
        ctx.strokeStyle = `rgba(180, 220, 255, ${drop.opacity})`; 
        ctx.stroke();

        // Create Splash
        if (drop.y > canvas.height - 20 * Math.random()) {
            if (Math.random() > 0.9) {
                splashes.push({ x: drop.x - drop.length * 0.5, y: canvas.height - Math.random() * 5, age: 0 });
            }
            // Reset drop
            drop.y = -drop.length;
            drop.x = Math.random() * canvas.width * 1.5 - canvas.width * 0.2; 
        }

        // Update Position
        drop.y += drop.speed;
        drop.x -= drop.speed * 0.5; 
      });

      // Draw Splashes
      for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          ctx.fillStyle = `rgba(200, 230, 255, ${1 - s.age/10})`;
          
          // Pixel splash (3 tiny squares)
          ctx.fillRect(s.x, s.y, 2, 2);
          ctx.fillRect(s.x - 2, s.y - 2, 2, 2);
          ctx.fillRect(s.x + 2, s.y - 2, 2, 2);
          
          s.age++;
          if (s.age > 10) {
              splashes.splice(i, 1);
          }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-30" // Higher z-index to be on top of buildings
      style={{ imageRendering: 'pixelated' }}
    />
  );
}