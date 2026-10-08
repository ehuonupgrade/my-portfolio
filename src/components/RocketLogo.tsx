import React from 'react';

interface RocketLogoProps {
  className?: string;
}

export const RocketLogo: React.FC<RocketLogoProps> = ({ className = 'w-14 h-14' }) => {
  return (
    <svg
      viewBox="0 0 120 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} overflow-visible transition-all duration-300 group-hover:drop-shadow-[0_0_14px_rgba(0,255,65,0.6)]`}
    >
      <defs>
        {/* Hull Gradient */}
        <linearGradient id="rocketHullGrad" x1="15" y1="20" x2="105" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0d1f14" />
          <stop offset="50%" stopColor="#183623" />
          <stop offset="100%" stopColor="#244d33" />
        </linearGradient>

        {/* Thruster Plume Gradient */}
        <linearGradient id="rocketPlumeGrad" x1="30" y1="35" x2="0" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#00e5ff" />
          <stop offset="70%" stopColor="#00ff41" />
          <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
        </linearGradient>

        {/* Cockpit Canopy Gradient */}
        <linearGradient id="cockpitCanopy" x1="70" y1="28" x2="84" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#005b73" />
        </linearGradient>
      </defs>

      {/* Glowing Thruster Exhaust Flame */}
      <path
        d="M26 31 C14 35 2 35 0 35 C2 35 14 35 26 39 Z"
        fill="url(#rocketPlumeGrad)"
        className="transition-all duration-300 group-hover:scale-x-125 origin-right"
      />

      {/* Engine Nozzle */}
      <rect x="23" y="30" width="4" height="10" rx="1" fill="#070d08" stroke="#00ff41" strokeWidth="0.8" />

      {/* Top Dorsal Fin */}
      <path
        d="M48 24 L28 10 L34 26 Z"
        fill="#0f2416"
        stroke="#00ff41"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Bottom Ventral Fin */}
      <path
        d="M48 46 L28 60 L34 44 Z"
        fill="#0f2416"
        stroke="#00ff41"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Main Rocket Fuselage */}
      <path
        d="M102 35 C80 23 48 25 26 27 L25 43 C48 45 80 47 102 35 Z"
        fill="url(#rocketHullGrad)"
        stroke="#00ff41"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Emerald Nose Tip Accent */}
      <path
        d="M102 35 L88 31 L88 39 Z"
        fill="#00ff41"
      />

      {/* Cockpit Visor / Glass Window */}
      <ellipse
        cx="74"
        cy="35"
        rx="9"
        ry="4.5"
        fill="url(#cockpitCanopy)"
        stroke="#00e5ff"
        strokeWidth="1"
      />

      {/* Fuselage Panel Seams */}
      <line x1="60" y1="26" x2="60" y2="44" stroke="#00ff41" strokeOpacity="0.4" strokeWidth="0.8" />
      <line x1="42" y1="27" x2="42" y2="43" stroke="#00ff41" strokeOpacity="0.4" strokeWidth="0.8" />
    </svg>
  );
};
