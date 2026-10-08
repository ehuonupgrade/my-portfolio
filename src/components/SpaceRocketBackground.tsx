import React from 'react';

export const SpaceRocketBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Deep Space Gradient Base */}
      <div className="absolute inset-0 bg-radial-[circle_at_50%_20%] from-[#0d1c24] via-[#070e13] to-[#05080b]" />

      {/* Cosmic Nebula Cloud Layers */}
      <div
        className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent blur-3xl opacity-60 transform translate-x-1/4 -translate-y-1/4"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-[700px] h-[500px] bg-gradient-to-tr from-cyan-600/10 via-blue-700/5 to-transparent blur-3xl opacity-50 transform -translate-x-1/4 translate-y-1/4"
        aria-hidden="true"
      />

      {/* Starfield SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-70"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="nebulaGlow" cx="60%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#00ff41" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#00e5ff" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#nebulaGlow)" />

        {/* Distant Background Stars */}
        {[
          { cx: '12%', cy: '15%', r: 1.2, o: 0.8 },
          { cx: '24%', cy: '8%', r: 0.8, o: 0.5 },
          { cx: '35%', cy: '22%', r: 1.5, o: 0.9 },
          { cx: '48%', cy: '12%', r: 0.9, o: 0.6 },
          { cx: '62%', cy: '18%', r: 1.8, o: 0.95 },
          { cx: '75%', cy: '7%', r: 1.0, o: 0.7 },
          { cx: '88%', cy: '25%', r: 1.4, o: 0.85 },
          { cx: '15%', cy: '45%', r: 1.1, o: 0.6 },
          { cx: '28%', cy: '60%', r: 1.6, o: 0.9 },
          { cx: '42%', cy: '50%', r: 0.8, o: 0.5 },
          { cx: '55%', cy: '68%', r: 1.3, o: 0.75 },
          { cx: '70%', cy: '55%', r: 1.7, o: 0.9 },
          { cx: '82%', cy: '62%', r: 0.9, o: 0.6 },
          { cx: '92%', cy: '48%', r: 1.5, o: 0.85 },
          { cx: '8%', cy: '78%', r: 1.0, o: 0.5 },
          { cx: '22%', cy: '88%', r: 1.4, o: 0.8 },
          { cx: '38%', cy: '82%', r: 0.7, o: 0.4 },
          { cx: '65%', cy: '85%', r: 1.2, o: 0.7 },
          { cx: '78%', cy: '92%', r: 1.6, o: 0.9 },
          { cx: '90%', cy: '80%', r: 1.1, o: 0.6 },
        ].map((star, i) => (
          <circle
            key={i}
            cx={star.cx}
            cy={star.cy}
            r={star.r}
            fill="#ffffff"
            opacity={star.o}
          />
        ))}

        {/* Orbit Grid Lines */}
        <ellipse
          cx="68%"
          cy="42%"
          rx="380"
          ry="140"
          fill="none"
          stroke="#00ff41"
          strokeWidth="0.5"
          strokeDasharray="4 8"
          opacity="0.25"
          transform="rotate(-18 680 420)"
        />
        <ellipse
          cx="68%"
          cy="42%"
          rx="520"
          ry="190"
          fill="none"
          stroke="#00e5ff"
          strokeWidth="0.5"
          strokeDasharray="6 12"
          opacity="0.15"
          transform="rotate(-18 680 420)"
        />
      </svg>

      {/* Hero Futuristic Rocket Vessel Vector Art */}
      <div className="absolute right-4 sm:right-16 md:right-28 top-8 sm:top-14 w-[340px] sm:w-[480px] md:w-[620px] h-[340px] sm:h-[480px] md:h-[620px] opacity-75 md:opacity-90">
        <svg
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_35px_rgba(0,255,65,0.2)]"
        >
          <defs>
            {/* Plasma Thruster Flame Gradient */}
            <linearGradient id="thrusterPlume" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#00e5ff" stopOpacity="0.85" />
              <stop offset="65%" stopColor="#00ff41" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
            </linearGradient>

            {/* Hull Metallic Gradient */}
            <linearGradient id="hullGradient" x1="20%" y1="20%" x2="80%" y2="80%">
              <stop offset="0%" stopColor="#2a3f33" />
              <stop offset="40%" stopColor="#14241a" />
              <stop offset="100%" stopColor="#09120c" />
            </linearGradient>

            <linearGradient id="cockpitGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#006680" stopOpacity="0.6" />
            </linearGradient>

            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Exhaust Plume / Ion Trail */}
          <path
            d="M 210 390 Q 140 460 70 530 Q 120 480 230 410 Z"
            fill="url(#thrusterPlume)"
            opacity="0.8"
            filter="url(#glowFilter)"
          />
          <path
            d="M 220 380 Q 110 490 20 580 Q 90 500 240 400 Z"
            fill="url(#thrusterPlume)"
            opacity="0.4"
          />

          {/* Rocket Main Body / Fuselage */}
          {/* Main Cone & Hull */}
          <path
            d="M 430 170 Q 420 220 320 320 L 260 380 L 220 340 L 280 280 Q 380 180 430 170 Z"
            fill="url(#hullGradient)"
            stroke="#00ff41"
            strokeWidth="1.5"
          />

          {/* Nose Tip */}
          <path
            d="M 450 150 L 430 170 L 415 155 Z"
            fill="#00ff41"
            opacity="0.8"
          />

          {/* Cockpit Canopy / Flight Deck */}
          <polygon
            points="390,210 375,195 350,220 365,235"
            fill="url(#cockpitGlass)"
            stroke="#00e5ff"
            strokeWidth="1"
          />

          {/* Left Wing / Stabilizer */}
          <polygon
            points="290,350 210,430 240,435 285,385"
            fill="#122017"
            stroke="#00ff41"
            strokeWidth="1"
          />

          {/* Right Dorsal Fin */}
          <polygon
            points="350,290 430,210 435,240 385,285"
            fill="#122017"
            stroke="#00ff41"
            strokeWidth="1"
          />

          {/* Engine Bells / Nozzle Array */}
          <polygon
            points="245,395 225,415 210,400 230,380"
            fill="#0a150e"
            stroke="#00e5ff"
            strokeWidth="1.5"
          />

          {/* Hull Panel Lines & Solar Reflectors */}
          <line x1="360" y1="240" x2="310" y2="290" stroke="#00ff41" strokeWidth="0.8" opacity="0.6" />
          <line x1="335" y1="265" x2="285" y2="315" stroke="#00ff41" strokeWidth="0.8" opacity="0.6" />
          <line x1="310" y1="290" x2="260" y2="340" stroke="#00ff41" strokeWidth="0.8" opacity="0.6" />

          {/* Sensor Array & Antenna Accent */}
          <line x1="440" y1="160" x2="480" y2="120" stroke="#00e5ff" strokeWidth="1" />
          <circle cx="480" cy="120" r="2.5" fill="#00e5ff" />

          {/* Ion Rings / Speed Particles */}
          <ellipse cx="205" cy="415" rx="15" ry="8" fill="none" stroke="#00e5ff" strokeWidth="1" transform="rotate(-45 205 415)" opacity="0.7" />
          <ellipse cx="175" cy="445" rx="25" ry="12" fill="none" stroke="#00ff41" strokeWidth="0.8" transform="rotate(-45 175 445)" opacity="0.5" />
          <ellipse cx="140" cy="480" rx="35" ry="16" fill="none" stroke="#00ff41" strokeWidth="0.6" transform="rotate(-45 140 480)" opacity="0.3" />
        </svg>
      </div>

      {/* Measured Scrim for Complete Text Contrast & Readability (WCAG AA) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 to-transparent sm:w-3/4" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/60" />
    </div>
  );
};
