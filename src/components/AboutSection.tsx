import React, { useState } from 'react';
import { playKeyClick, playSuccessChime } from '../utils/audio';

interface AboutSectionProps {
  accentColorClass: string;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ accentColorClass }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    playKeyClick();
    navigator.clipboard.writeText('eric.huon@gmail.com');
    setCopiedEmail(true);
    playSuccessChime();
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="space-y-10">
      {/* Bio Card */}
      <section className="border border-[#1a331c] bg-[#0c120c] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#142616] pb-6">
          <div>
            <span className="text-[11px] opacity-60 font-mono tracking-widest uppercase">
              BIOGRAPHY // SYSTEMS ARCHITECT
            </span>
            <h2 className={`text-2xl sm:text-3xl font-bold mt-1 tracking-tight ${accentColorClass}`}>
              Eric Huon
            </h2>
            <p className="text-sm opacity-80 mt-1">
              Full-Stack Software Engineer &amp; Edge Infrastructure Architect
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyEmail}
              className="px-3.5 py-1.5 bg-[#142916] hover:bg-[#00ff41] hover:text-black border border-[#1a3d1e] text-xs font-semibold transition-colors"
            >
              {copiedEmail ? '✓ EMAIL COPIED' : 'Copy Email'}
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 border border-[#1a3d1e] hover:border-[#00ff41] text-xs transition-colors"
            >
              GitHub &nearr;
            </a>
          </div>
        </div>

        {/* Narrative Prose */}
        <div className="space-y-4 text-xs sm:text-sm opacity-90 leading-relaxed font-mono">
          <p>
            I specialize in designing and engineering high-velocity web applications, developer tooling,
            and distributed edge architectures. With a focus on sub-50ms latency, zero layout shift, and tactile
            developer aesthetics, I build systems where performance and user interface harmonize.
          </p>
          <p>
            My engineering philosophy centers on decoupled micro-frontends: instead of brittle monoliths, I prefer
            modular applications operating on isolated DNS subdomains with automated CI/CD and edge caching.
          </p>
        </div>
      </section>

      {/* Technical Competencies Grid */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider opacity-80">
          TECHNICAL COMPETENCY MATRIX
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-[#1a331c] bg-[#0b100b] p-5 space-y-3">
            <h4 className="text-xs font-bold text-[#00ff41] uppercase tracking-wider border-b border-[#142616] pb-2">
              Core Languages
            </h4>
            <div className="space-y-1.5 text-xs opacity-85">
              <p>• TypeScript &amp; Modern JavaScript</p>
              <p>• SQL (PostgreSQL, SQLite, Drizzle)</p>
              <p>• Python &amp; Data Pipeline Scripts</p>
              <p>• GLSL / WebGL Shader Math</p>
              <p>• Bash &amp; Linux Shell Scripting</p>
            </div>
          </div>

          <div className="border border-[#1a331c] bg-[#0b100b] p-5 space-y-3">
            <h4 className="text-xs font-bold text-[#00ff41] uppercase tracking-wider border-b border-[#142616] pb-2">
              Frameworks &amp; UI
            </h4>
            <div className="space-y-1.5 text-xs opacity-85">
              <p>• Astro (Static &amp; SSR Edge)</p>
              <p>• React 19 &amp; Next.js App Router</p>
              <p>• Tailwind CSS v4 &amp; Modern Design</p>
              <p>• Web Audio API &amp; HTML5 Canvas</p>
              <p>• WebAssembly (WASM) Integration</p>
            </div>
          </div>

          <div className="border border-[#1a331c] bg-[#0b100b] p-5 space-y-3">
            <h4 className="text-xs font-bold text-[#00ff41] uppercase tracking-wider border-b border-[#142616] pb-2">
              Infrastructure &amp; DevOps
            </h4>
            <div className="space-y-1.5 text-xs opacity-85">
              <p>• Vercel Edge &amp; Cloudflare Workers</p>
              <p>• CNAME Subdomain DNS Routing</p>
              <p>• GitHub Actions Automated CI/CD</p>
              <p>• Let&apos;s Encrypt Automatic SSL</p>
              <p>• Docker &amp; Containerization</p>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal Command Proof */}
      <section className="border border-[#1a331c] bg-[#080d08] p-5 space-y-2 text-xs font-mono">
        <div className="flex items-center gap-2 opacity-70 border-b border-[#142616] pb-2">
          <span>guest@hub:~</span>
          <span className="text-[#00ff41] font-semibold">&gt;&gt; cat contact_info.json</span>
        </div>
        <pre className="text-[#c0ffc9] overflow-x-auto text-[11px] pt-1">
{`{
  "name": "Eric Huon",
  "email": "eric.huon@gmail.com",
  "status": "Available for Select Contracts & Engineering Roles",
  "location": "Global / Remote",
  "specialties": [
    "Astro & React Edge Architecture",
    "Developer Tooling & Terminal UIs",
    "Subdomain CNAME Infrastructure"
  ]
}`}
        </pre>
      </section>
    </div>
  );
};
