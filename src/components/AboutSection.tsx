import React from 'react';

interface AboutSectionProps {
  accentColorClass: string;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ accentColorClass }) => {
  return (
    <div className="space-y-10 font-sans">
      {/* Studio Bio Card */}
      <section className="border border-slate-800 bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 sm:p-10 space-y-6">
        <div className="border-b border-slate-800 pb-6">
          <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">
            ABOUT // CREATIVE DIRECTION &amp; DESIGN
          </span>
          <h2 className={`text-3xl sm:text-4xl font-bold mt-1 tracking-tight ${accentColorClass}`}>
            Huon.si
          </h2>
          <p className="text-base text-slate-300 mt-1 font-normal">
            Digital Design Showcase &amp; Interactive Studio
          </p>
        </div>

        {/* Narrative Prose */}
        <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-3xl">
          <p>
            Huon.si is an independent creative portfolio exploring digital design,
            cosmic aesthetics, visual brand systems, and playful interactive web experiences.
          </p>
          <p>
            Every concept focuses on visual craft, clean typography, and tactile digital details —
            from cosmic-themed brand identities and editorial publication layouts to retro arcade game design.
          </p>
        </div>
      </section>

      {/* Creative Disciplines Grid */}
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 font-mono">
          DESIGN DISCIPLINES &amp; CRAFT
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-slate-800 bg-slate-900/60 rounded-2xl p-6 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h4 className="text-base font-bold text-white">
              Digital Product Design
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Design systems, user interface craft, responsive layouts, and intuitive interaction architecture built with modern visual hierarchy.
            </p>
          </div>

          <div className="border border-slate-800 bg-slate-900/60 rounded-2xl p-6 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h4 className="text-base font-bold text-white">
              Visual Identity &amp; Art Direction
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Brand systems, celestial &amp; space aesthetics, typographic palettes, color systems, and distinctive digital identities.
            </p>
          </div>

          <div className="border border-slate-800 bg-slate-900/60 rounded-2xl p-6 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h4 className="text-base font-bold text-white">
              Games &amp; Interactive Media
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Playful in-browser arcade games, canvas motion graphics, generative visuals, and interactive narrative experiments.
            </p>
          </div>
        </div>
      </section>

      {/* Studio Philosophy Card */}
      <section className="border border-slate-800 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-slate-950/80 rounded-2xl p-8">
        <h3 className="text-lg font-bold text-white">Design Philosophy</h3>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
          Simplicity, intentional typography, and fluid movement. Every experience published under huon.si is crafted to balance visual impact with effortless navigation.
        </p>
      </section>
    </div>
  );
};
