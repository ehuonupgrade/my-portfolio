import React from 'react';
import { ProjectItem } from '../types';

interface DesignProjectCardProps {
  project: ProjectItem;
  onLaunch: (project: ProjectItem) => void;
}

export const DesignProjectCard: React.FC<DesignProjectCardProps> = ({
  project,
  onLaunch,
}) => {
  return (
    <article
      onClick={() => onLaunch(project)}
      className="group relative bg-slate-900/75 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-600 hover:shadow-2xl cursor-pointer"
    >
      <div>
        {/* Card Header & Unboxed Metadata */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 font-sans">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">{project.category}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono">{project.year || '2026'}</span>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-medium">
            {project.status}
          </span>
        </div>

        {/* Project Title */}
        <h3 className="text-xl font-bold tracking-tight text-white mb-2.5 group-hover:text-emerald-400 transition-colors">
          {project.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed mb-6 font-normal">
          {project.description}
        </p>
      </div>

      {/* Subdomain & Design Tags Footer */}
      <div className="space-y-4 pt-4 border-t border-slate-800/70 font-sans">
        {/* Subdomain link line */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="truncate group-hover:text-slate-200 transition-colors">
            {project.subdomain}
          </span>
          <span className="text-[11px] text-slate-500 font-sans">huon.si</span>
        </div>

        {/* Clean unboxed tags with typographic separators */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          {project.tech.map((t, idx) => (
            <React.Fragment key={t}>
              <span className="text-slate-300">{t}</span>
              {idx < project.tech.length - 1 && (
                <span aria-hidden="true" className="text-slate-600">·</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Action Link */}
        <div className="flex items-center justify-between pt-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-emerald-400 group-hover:translate-x-1 transition-all">
            <span>View Project Details</span>
            <span aria-hidden="true">&rarr;</span>
          </span>
        </div>
      </div>
    </article>
  );
};
