import React, { useEffect } from 'react';
import { ProjectItem } from '../types';
import { playKeyClick } from '../utils/audio';

interface DesignProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
}

export const DesignProjectModal: React.FC<DesignProjectModalProps> = ({
  project,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span className="font-semibold text-emerald-400">{project.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{project.year}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {project.name}
            </h2>
          </div>

          <button
            onClick={() => {
              playKeyClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        {/* Narrative Concept */}
        <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
          <p>{project.description}</p>
          <p className="text-xs sm:text-sm text-slate-400">
            Conceived as part of the Huon.si design collection, emphasizing visual contrast, space-inspired palettes, and high-impact digital experiences.
          </p>
        </div>

        {/* Design Focus Tags */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Focus &amp; Disciplines:
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            {project.tech.map((t, i) => (
              <span key={i} className="px-2.5 py-1 bg-slate-800/80 rounded-md border border-slate-700/60">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs font-mono text-slate-400">
            Domain: <strong className="text-white">{project.subdomain}</strong>
          </span>

          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
          >
            Visit Experience &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};
