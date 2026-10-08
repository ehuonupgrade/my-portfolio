import React, { useState } from 'react';
import { ProjectItem } from '../types';
import { playBeep, playKeyClick } from '../utils/audio';

interface ProjectCardProps {
  project: ProjectItem;
  onLaunch: (project: ProjectItem) => void;
  accentColorClass: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onLaunch,
  accentColorClass,
}) => {
  const [pinging, setPinging] = useState(false);
  const [liveLatency, setLiveLatency] = useState(project.latency);
  const [copied, setCopied] = useState(false);

  const handlePing = (e: React.MouseEvent) => {
    e.stopPropagation();
    playBeep(700, 0.05);
    setPinging(true);
    setTimeout(() => {
      const randomLatency = Math.floor(8 + Math.random() * 16) + 'ms';
      setLiveLatency(randomLatency);
      setPinging(false);
    }, 400);
  };

  const handleCopySubdomain = (e: React.MouseEvent) => {
    e.stopPropagation();
    playKeyClick();
    navigator.clipboard.writeText(project.subdomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article className="border border-[#1a331c] bg-[#0c120c] hover:border-[#00ff41] transition-all p-5 flex flex-col justify-between group relative shadow-md">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex flex-col">
            <span className="text-[11px] opacity-60 font-mono tracking-wider">
              {project.category} · {project.version}
            </span>
            <h3 className={`text-base font-bold tracking-tight group-hover:underline ${accentColorClass}`}>
              {project.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
            <span className="opacity-70">{project.status}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <button
              onClick={handlePing}
              title="Click to test ICMP ping"
              className="hover:underline opacity-80 cursor-pointer"
            >
              {pinging ? 'pinging...' : liveLatency}
            </button>
          </div>
        </div>

        {/* Subdomain routing line */}
        <div className="flex items-center justify-between text-xs font-mono py-1.5 px-2 bg-black/40 border border-[#142616] mb-3">
          <span className="truncate opacity-80 select-all">{project.subdomain}</span>
          <button
            onClick={handleCopySubdomain}
            className="text-[10px] opacity-60 hover:opacity-100 hover:underline shrink-0 ml-2"
          >
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </div>

        {/* Description */}
        <p className="text-xs leading-relaxed opacity-85 mb-4">
          {project.description}
        </p>
      </div>

      {/* Footer Details */}
      <div className="space-y-3 pt-3 border-t border-[#142616]">
        {/* Clean unboxed metadata with typographic separators (Zero-Pill Rule) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs opacity-75 font-mono">
          {project.tech.map((t, idx) => (
            <React.Fragment key={t}>
              <span>{t}</span>
              {idx < project.tech.length - 1 && <span aria-hidden="true" className="opacity-40">·</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Interactive Actions */}
        <div className="flex items-center justify-between text-xs pt-1">
          <button
            onClick={() => onLaunch(project)}
            className="px-3 py-1.5 bg-[#142916] hover:bg-[#00ff41] hover:text-[#0a0a0a] transition-colors font-medium flex items-center gap-1.5 border border-[#1a3d1e]"
          >
            <span>Launch App</span>
            <span aria-hidden="true">&rarr;</span>
          </button>

          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playKeyClick()}
            className="opacity-70 hover:opacity-100 hover:underline font-mono text-xs flex items-center gap-1"
          >
            <span>Source</span>
            <span aria-hidden="true">&nearr;</span>
          </a>
        </div>
      </div>
    </article>
  );
};
