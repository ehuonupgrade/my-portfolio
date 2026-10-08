import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
}

export const AnimatedRocketScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initial mouse position
    mouseRef.current = {
      x: width * 0.75,
      y: height * 0.35,
      targetX: width * 0.75,
      targetY: height * 0.35,
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Subtle influence on rocket position
      mouseRef.current.targetX = width * 0.7 + (e.clientX - width / 2) * 0.08;
      mouseRef.current.targetY = height * 0.32 + (e.clientY - height / 2) * 0.08;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Generate Stars (depth layers)
    const starCount = 120;
    const stars: Star[] = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.4,
      opacity: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.35 + 0.08,
    }));

    // Exhaust Particles
    const particles: Particle[] = [];

    // Shooting Star
    let shootingStar: ShootingStar | null = null;
    let lastShootingStarTime = Date.now();

    let time = 0;

    const render = () => {
      time += 0.02;

      // Deep space gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.75,
        height * 0.3,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height)
      );
      bgGrad.addColorStop(0, '#0c1a24');
      bgGrad.addColorStop(0.35, '#070f17');
      bgGrad.addColorStop(0.7, '#04070a');
      bgGrad.addColorStop(1, '#020406');

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Cosmic Nebula Glow
      const nebula = ctx.createRadialGradient(
        width * 0.72,
        height * 0.32,
        20,
        width * 0.72,
        height * 0.32,
        350
      );
      nebula.addColorStop(0, 'rgba(0, 229, 255, 0.12)');
      nebula.addColorStop(0.5, 'rgba(0, 255, 65, 0.06)');
      nebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, width, height);

      // Render & Drift Stars
      stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }

        // Star twinkle
        const twinkle = star.opacity + Math.sin(time * 3 + star.x) * 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(1, twinkle))})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Periodic Shooting Star
      const now = Date.now();
      if (!shootingStar && now - lastShootingStarTime > 4000 && Math.random() < 0.03) {
        shootingStar = {
          x: Math.random() * width * 0.7,
          y: Math.random() * height * 0.3,
          length: Math.random() * 80 + 70,
          speed: Math.random() * 12 + 10,
          opacity: 1,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
        };
        lastShootingStarTime = now;
      }

      if (shootingStar) {
        ctx.save();
        ctx.strokeStyle = `rgba(200, 245, 255, ${shootingStar.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(shootingStar.x, shootingStar.y);
        ctx.lineTo(
          shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length,
          shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length
        );
        ctx.stroke();
        ctx.restore();

        shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
        shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
        shootingStar.opacity -= 0.02;

        if (shootingStar.opacity <= 0 || shootingStar.x > width || shootingStar.y > height) {
          shootingStar = null;
        }
      }

      // Smooth Rocket Position with floating sine drift
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const floatX = mouseRef.current.x + Math.sin(time * 1.5) * 12;
      const floatY = mouseRef.current.y + Math.cos(time * 1.8) * 16;
      const floatAngle = -0.55 + Math.sin(time * 1.2) * 0.04; // Sleek upward-right trajectory angle

      // Spawn Thruster Exhaust Particles
      const plumeOriginX = floatX - Math.cos(floatAngle) * 45;
      const plumeOriginY = floatY - Math.sin(floatAngle) * 45;

      for (let i = 0; i < 3; i++) {
        const spread = (Math.random() - 0.5) * 0.3;
        const speed = Math.random() * 5 + 4;
        particles.push({
          x: plumeOriginX,
          y: plumeOriginY,
          vx: -Math.cos(floatAngle + spread) * speed + (Math.random() - 0.5),
          vy: -Math.sin(floatAngle + spread) * speed + (Math.random() - 0.5),
          size: Math.random() * 4 + 2,
          alpha: 0.9,
          color: Math.random() > 0.4 ? '#00e5ff' : '#00ff41',
        });
      }

      // Draw and Update Exhaust Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.028;
        p.size *= 0.97;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Render the Sleek Animated Rocket
      ctx.save();
      ctx.translate(floatX, floatY);
      ctx.rotate(floatAngle);

      // Glowing Thruster Plume Flame
      const flameLength = 36 + Math.sin(time * 24) * 8;
      const flameGrad = ctx.createLinearGradient(-40, 0, -40 - flameLength, 0);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.3, '#00e5ff');
      flameGrad.addColorStop(0.7, '#00ff41');
      flameGrad.addColorStop(1, 'rgba(0, 255, 65, 0)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-35, -7);
      ctx.quadraticCurveTo(-40 - flameLength * 0.7, 0, -40 - flameLength, 0);
      ctx.quadraticCurveTo(-40 - flameLength * 0.7, 0, -35, 7);
      ctx.closePath();
      ctx.fill();

      // Rocket Wings / Stabilizers
      ctx.fillStyle = '#0f2218';
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = 1.2;

      // Top dorsal fin
      ctx.beginPath();
      ctx.moveTo(-15, -12);
      ctx.lineTo(-35, -28);
      ctx.lineTo(-28, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bottom stabilizer
      ctx.beginPath();
      ctx.moveTo(-15, 12);
      ctx.lineTo(-35, 28);
      ctx.lineTo(-28, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Main Rocket Fuselage
      const hullGrad = ctx.createLinearGradient(-35, -15, 45, 15);
      hullGrad.addColorStop(0, '#12251a');
      hullGrad.addColorStop(0.5, '#1e3828');
      hullGrad.addColorStop(1, '#2c4d37');

      ctx.fillStyle = hullGrad;
      ctx.beginPath();
      ctx.moveTo(48, 0); // Nose tip
      ctx.quadraticCurveTo(15, -14, -34, -10);
      ctx.lineTo(-36, 10);
      ctx.quadraticCurveTo(15, 14, 48, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Nose Tip Accent
      ctx.fillStyle = '#00ff41';
      ctx.beginPath();
      ctx.moveTo(48, 0);
      ctx.lineTo(34, -4);
      ctx.lineTo(34, 4);
      ctx.closePath();
      ctx.fill();

      // Cockpit Canopy / Glass Visor
      const glassGrad = ctx.createLinearGradient(12, -6, 26, 4);
      glassGrad.addColorStop(0, '#ffffff');
      glassGrad.addColorStop(0.4, '#00e5ff');
      glassGrad.addColorStop(1, '#006580');

      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.ellipse(18, 0, 9, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Engine Nozzle
      ctx.fillStyle = '#0a140f';
      ctx.fillRect(-38, -6, 4, 12);

      // Panel Lines
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(5, -10);
      ctx.lineTo(5, 10);
      ctx.moveTo(-15, -10);
      ctx.lineTo(-15, 10);
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Soft gradient fade into content */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#060a0e]/40 to-[#060a0e]" />
    </div>
  );
};
