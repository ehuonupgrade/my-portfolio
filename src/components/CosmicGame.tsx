import React, { useState, useEffect, useRef } from 'react';
import { playBeep, playSuccessChime, playErrorBuzz, playKeyClick } from '../utils/audio';

interface Asteroid {
  x: number;
  y: number;
  size: number;
  speed: number;
}

export const CosmicGame: React.FC<{ accentColorClass: string }> = ({ accentColorClass }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [fuel, setFuel] = useState(100);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef({ x: 200, y: 320, width: 28, height: 32, vx: 0 });
  const asteroidsRef = useRef<Asteroid[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const keysRef = useRef<{ left: boolean; right: boolean; thrust: boolean }>({
    left: false,
    right: false,
    thrust: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('cosmic_high_score');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    playSuccessChime();
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setFuel(100);
    playerRef.current = { x: 200, y: 320, width: 28, height: 32, vx: 0 };
    asteroidsRef.current = [];
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keysRef.current.thrust = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keysRef.current.thrust = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying]);

  // Main Game Loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    let frameCount = 0;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      frameCount++;

      // Clear canvas
      ctx.fillStyle = '#070c08';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Starfield Background in canvas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 20; i++) {
        const sx = (i * 47 + frameCount * 2) % canvas.width;
        const sy = (i * 29) % canvas.height;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Handle Player Movement
      const player = playerRef.current;
      if (keysRef.current.left) {
        player.vx = -4;
      } else if (keysRef.current.right) {
        player.vx = 4;
      } else {
        player.vx *= 0.85;
      }

      player.x += player.vx;
      if (player.x < 10) player.x = 10;
      if (player.x > canvas.width - player.width - 10) player.x = canvas.width - player.width - 10;

      // Spawn Asteroids
      if (frameCount % 45 === 0) {
        asteroidsRef.current.push({
          x: Math.random() * (canvas.width - 30) + 10,
          y: -20,
          size: Math.random() * 14 + 12,
          speed: Math.random() * 2.5 + 2,
        });
      }

      // Update & Draw Asteroids
      for (let i = asteroidsRef.current.length - 1; i >= 0; i--) {
        const ast = asteroidsRef.current[i];
        ast.y += ast.speed;

        // Draw Asteroid
        ctx.fillStyle = '#1c3021';
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ast.x, ast.y, ast.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Collision Check
        const distX = Math.abs(ast.x - (player.x + player.width / 2));
        const distY = Math.abs(ast.y - (player.y + player.height / 2));

        if (distX < ast.size / 2 + player.width / 3 && distY < ast.size / 2 + player.height / 3) {
          playErrorBuzz();
          setGameOver(true);
          setIsPlaying(false);
          setHighScore((prev) => {
            const next = Math.max(prev, score);
            localStorage.setItem('cosmic_high_score', next.toString());
            return next;
          });
          return;
        }

        // Remove if off bottom
        if (ast.y > canvas.height + 20) {
          asteroidsRef.current.splice(i, 1);
          setScore((s) => s + 10);
        }
      }

      // Draw Player Rocket
      ctx.save();
      ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

      // Rocket flame
      if (keysRef.current.left || keysRef.current.right || frameCount % 2 === 0) {
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.moveTo(-4, player.height / 2);
        ctx.lineTo(0, player.height / 2 + 8 + Math.random() * 6);
        ctx.lineTo(4, player.height / 2);
        ctx.fill();
      }

      // Rocket body
      ctx.fillStyle = '#0f2414';
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -player.height / 2);
      ctx.lineTo(player.width / 2, player.height / 2);
      ctx.lineTo(-player.width / 2, player.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit window
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(0, -2, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, gameOver, score]);

  return (
    <div className="space-y-8">
      {/* Game Section Header */}
      <div className="border border-[#1a331c] bg-[#0c120c] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-[#00ff41] font-mono tracking-wider bg-[#142916] px-2 py-0.5 border border-[#1a3d1e]">
            PLAYABLE GAME LABORATORY
          </span>
          <h2 className={`text-xl font-bold mt-2 ${accentColorClass}`}>
            Cosmic Dodger: Deep Space Pilot
          </h2>
          <p className="text-xs opacity-75 mt-1 max-w-lg leading-relaxed">
            Navigate your edge exploration rocket through deep cosmic debris fields. Handcrafted in pure TypeScript with HTML5 Canvas.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="opacity-60">SCORE:</span> <span className="font-bold text-[#00ff41]">{score}</span>
          </div>
          <div>
            <span className="opacity-60">BEST:</span> <span className="font-bold text-emerald-300">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Arcade Screen Container */}
      <div className="border-2 border-[#1a3d1e] bg-[#070c08] p-4 flex flex-col items-center relative shadow-2xl">
        <div className="w-full max-w-md relative flex flex-col items-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={360}
            className="w-full max-w-[400px] h-[320px] sm:h-[360px] bg-[#070c08] border border-[#142916]"
          />

          {/* Overlay when not playing */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="text-lg font-bold text-[#00ff41] tracking-widest uppercase">
                {gameOver ? 'HULL BREACH DETECTED' : 'COSMIC DODGER'}
              </div>
              <p className="text-xs opacity-80 max-w-xs">
                {gameOver
                  ? `Run terminated. Final score: ${score} points.`
                  : 'Pilot the deep space vessel. Avoid collisions with rogue asteroids.'}
              </p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-[#00ff41] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#52ff7d] transition-colors"
              >
                {gameOver ? 'Launch Again' : 'Engage Thrusters (Start)'}
              </button>
              <div className="text-[11px] opacity-60">
                Controls: <span className="text-[#00ff41]">A / D</span> or <span className="text-[#00ff41]">&larr; / &rarr;</span> keys
              </div>
            </div>
          )}
        </div>

        {/* Mobile / On-screen controls */}
        {isPlaying && (
          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-[#142916] w-full max-w-md">
            <button
              onMouseDown={() => {
                keysRef.current.left = true;
                playKeyClick();
              }}
              onMouseUp={() => (keysRef.current.left = false)}
              onTouchStart={() => {
                keysRef.current.left = true;
                playKeyClick();
              }}
              onTouchEnd={() => (keysRef.current.left = false)}
              className="px-6 py-3 bg-[#142916] border border-[#1a3d1e] text-xs font-bold active:bg-[#00ff41] active:text-black"
            >
              &larr; PORT
            </button>
            <button
              onMouseDown={() => {
                keysRef.current.right = true;
                playKeyClick();
              }}
              onMouseUp={() => (keysRef.current.right = false)}
              onTouchStart={() => {
                keysRef.current.right = true;
                playKeyClick();
              }}
              onTouchEnd={() => (keysRef.current.right = false)}
              className="px-6 py-3 bg-[#142916] border border-[#1a3d1e] text-xs font-bold active:bg-[#00ff41] active:text-black"
            >
              STARBOARD &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Additional Game Projects Showcase */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider opacity-85">
          ADDITIONAL GAME EXPERIMENTS &amp; INTERACTIVE DEMOS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[#1a331c] bg-[#0c120c] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#00ff41] text-sm">ShaderForge GLSL Canvas</h4>
              <span className="text-[10px] opacity-60">WEBGL / SHADERS</span>
            </div>
            <p className="text-xs opacity-75">
              Interactive WebGL fragment shader laboratory with live procedural plasma waves and raymarched geometry.
            </p>
            <div className="text-[11px] opacity-50 pt-1">
              Tech: WebGL · GLSL · TypeScript · Astro
            </div>
          </div>

          <div className="border border-[#1a331c] bg-[#0c120c] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#00ff41] text-sm">Retro Rogue Terminal Crawler</h4>
              <span className="text-[10px] opacity-60">ASCII ENGINE</span>
            </div>
            <p className="text-xs opacity-75">
              Procedural turn-based dungeon crawl adventure with permadeath and ANSI color mapping directly in terminal.
            </p>
            <div className="text-[11px] opacity-50 pt-1">
              Tech: TypeScript · POSIX Terminal · State Machines
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
