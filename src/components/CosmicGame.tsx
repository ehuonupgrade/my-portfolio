import React, { useState, useEffect, useRef } from 'react';
import { playBeep, playSuccessChime, playErrorBuzz, playKeyClick } from '../utils/audio';

interface Asteroid {
  x: number;
  y: number;
  size: number;
  speed: number;
}

interface Laser {
  x: number;
  y: number;
  vy: number;
}

interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export const CosmicGame: React.FC<{ accentColorClass: string }> = ({ accentColorClass }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [asteroidsDestroyed, setAsteroidsDestroyed] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef({ x: 200, y: 310, width: 28, height: 32, vx: 0 });
  const asteroidsRef = useRef<Asteroid[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const explosionsRef = useRef<ExplosionParticle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastShotTimeRef = useRef(0);
  const keysRef = useRef<{ left: boolean; right: boolean; shoot: boolean }>({
    left: false,
    right: false,
    shoot: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('cosmic_high_score');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const shootLaser = () => {
    const now = Date.now();
    if (now - lastShotTimeRef.current < 160) return; // Fire rate limiter
    lastShotTimeRef.current = now;

    playBeep(920, 0.04);
    const player = playerRef.current;
    lasersRef.current.push({
      x: player.x + player.width / 2,
      y: player.y - 4,
      vy: -10,
    });
  };

  const startGame = () => {
    playSuccessChime();
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setAsteroidsDestroyed(0);
    playerRef.current = { x: 200, y: 310, width: 28, height: 32, vx: 0 };
    asteroidsRef.current = [];
    lasersRef.current = [];
    explosionsRef.current = [];
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'Enter') {
        e.preventDefault();
        shootLaser();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
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

      // Clear canvas with deep space tone
      ctx.fillStyle = '#060a08';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield Background in canvas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 22; i++) {
        const sx = (i * 47 + frameCount * 2) % canvas.width;
        const sy = (i * 29) % canvas.height;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Handle Player Horizontal Movement
      const player = playerRef.current;
      if (keysRef.current.left) {
        player.vx = -4.5;
      } else if (keysRef.current.right) {
        player.vx = 4.5;
      } else {
        player.vx *= 0.85;
      }

      player.x += player.vx;
      if (player.x < 10) player.x = 10;
      if (player.x > canvas.width - player.width - 10) player.x = canvas.width - player.width - 10;

      // Spawn Asteroids
      if (frameCount % 40 === 0) {
        asteroidsRef.current.push({
          x: Math.random() * (canvas.width - 36) + 18,
          y: -24,
          size: Math.random() * 16 + 14,
          speed: Math.random() * 2.2 + 2,
        });
      }

      // Update & Render Lasers
      const lasers = lasersRef.current;
      for (let l = lasers.length - 1; l >= 0; l--) {
        const laser = lasers[l];
        laser.y += laser.vy;

        // Draw Laser Bolt
        ctx.strokeStyle = '#00ff41';
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(laser.x, laser.y);
        ctx.lineTo(laser.x, laser.y + 12);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Core white streak
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(laser.x, laser.y);
        ctx.lineTo(laser.x, laser.y + 10);
        ctx.stroke();

        // Remove if off screen
        if (laser.y < -15) {
          lasers.splice(l, 1);
          continue;
        }

        // Laser vs Asteroid Collision
        const asteroids = asteroidsRef.current;
        for (let a = asteroids.length - 1; a >= 0; a--) {
          const ast = asteroids[a];
          const dist = Math.hypot(laser.x - ast.x, laser.y - ast.y);

          if (dist < ast.size / 2 + 5) {
            // Hit! Destroy Asteroid
            playBeep(320, 0.08);

            // Spawn Explosion Particles
            for (let p = 0; p < 12; p++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = Math.random() * 4 + 1.5;
              explosionsRef.current.push({
                x: ast.x,
                y: ast.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: Math.random() > 0.4 ? '#00ff41' : '#00e5ff',
                alpha: 1,
                size: Math.random() * 3 + 1.5,
              });
            }

            // Remove asteroid and laser
            asteroids.splice(a, 1);
            lasers.splice(l, 1);

            setScore((s) => s + 25);
            setAsteroidsDestroyed((d) => d + 1);
            break;
          }
        }
      }

      // Update & Render Explosion Particles
      const explosions = explosionsRef.current;
      for (let i = explosions.length - 1; i >= 0; i--) {
        const ep = explosions[i];
        ep.x += ep.vx;
        ep.y += ep.vy;
        ep.alpha -= 0.04;

        if (ep.alpha <= 0) {
          explosions.splice(i, 1);
          continue;
        }

        ctx.fillStyle = ep.color;
        ctx.globalAlpha = ep.alpha;
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, ep.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Update & Render Asteroids
      const asteroids = asteroidsRef.current;
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const ast = asteroids[i];
        ast.y += ast.speed;

        // Draw Asteroid
        ctx.fillStyle = '#142718';
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(ast.x, ast.y, ast.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Asteroid surface craters
        ctx.fillStyle = '#0b160e';
        ctx.beginPath();
        ctx.arc(ast.x - ast.size * 0.18, ast.y - ast.size * 0.15, ast.size * 0.16, 0, Math.PI * 2);
        ctx.arc(ast.x + ast.size * 0.2, ast.y + ast.size * 0.15, ast.size * 0.14, 0, Math.PI * 2);
        ctx.fill();

        // Player Collision Check
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
        if (ast.y > canvas.height + 25) {
          asteroids.splice(i, 1);
          setScore((s) => s + 5);
        }
      }

      // Draw Player Rocket
      ctx.save();
      ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

      // Rocket thruster plume
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(-4, player.height / 2);
      ctx.lineTo(0, player.height / 2 + 8 + Math.random() * 6);
      ctx.lineTo(4, player.height / 2);
      ctx.fill();

      // Rocket hull
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

      // Blaster Cannons on wings
      ctx.fillStyle = '#00ff41';
      ctx.fillRect(-player.width / 2 - 2, player.height / 4, 3, 7);
      ctx.fillRect(player.width / 2 - 1, player.height / 4, 3, 7);

      // Cockpit window
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(0, -3, 3.5, 0, Math.PI * 2);
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
    <div className="space-y-6 font-sans">
      {/* Game Dashboard Stats */}
      <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs text-emerald-400 font-mono tracking-wider font-semibold">
            ARCADE CANNON // COSMIC DEFENDER
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Destroy incoming asteroids with your plasma cannons.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono">
          <div>
            <span className="text-slate-400">DESTROYED:</span>{' '}
            <span className="font-bold text-cyan-400">{asteroidsDestroyed}</span>
          </div>
          <div>
            <span className="text-slate-400">SCORE:</span>{' '}
            <span className="font-bold text-emerald-400">{score}</span>
          </div>
          <div>
            <span className="text-slate-400">BEST:</span>{' '}
            <span className="font-bold text-white">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Arcade Screen Canvas Container */}
      <div className="border border-slate-800 bg-slate-950/80 rounded-2xl p-4 sm:p-6 flex flex-col items-center relative shadow-2xl backdrop-blur-md">
        <div className="w-full max-w-md relative flex flex-col items-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={360}
            className="w-full max-w-[400px] h-[320px] sm:h-[360px] bg-[#060a08] rounded-xl border border-slate-800 shadow-inner"
          />

          {/* Overlay when game is idle or over */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-slate-950/90 rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="text-xl font-bold text-white tracking-wider uppercase font-mono">
                {gameOver ? 'HULL BREACH DETECTED' : 'COSMIC DODGER'}
              </div>

              <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                {gameOver
                  ? `Run terminated. Score: ${score} · Asteroids Blasted: ${asteroidsDestroyed}`
                  : 'Pilot the deep space vessel. Shoot incoming asteroids to clear a flight path.'}
              </p>

              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-md"
              >
                {gameOver ? 'Launch Again' : 'Engage Cannons (Start)'}
              </button>

              <div className="text-xs text-slate-400 font-mono space-y-1">
                <div>Move: <span className="text-white">A / D</span> or <span className="text-white">&larr; / &rarr;</span></div>
                <div>Fire Cannon: <span className="text-emerald-400 font-bold">SPACEBAR</span> or <span className="text-emerald-400 font-bold">W / &uarr;</span></div>
              </div>
            </div>
          )}
        </div>

        {/* On-Screen Touch / Mouse Controls */}
        {isPlaying && (
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 pt-3 border-t border-slate-800/80 w-full max-w-md">
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
              className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold rounded-xl active:bg-emerald-500 active:text-black transition-colors"
            >
              &larr; Left
            </button>

            <button
              onClick={() => shootLaser()}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
            >
              🔥 FIRE
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
              className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold rounded-xl active:bg-emerald-500 active:text-black transition-colors"
            >
              Right &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
