import React, { useState } from 'react';
import changelogData from '../data/changelog.json';
import { playKeyClick } from '../utils/audio';

interface ChangeItem {
  type: string;
  description: string;
}

interface VersionEntry {
  version: string;
  date: string;
  title: string;
  summary: string;
  tag: string;
  changes: ChangeItem[];
  commits: string[];
}

export const ChangelogView: React.FC = () => {
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  const versions: VersionEntry[] = changelogData as VersionEntry[];
  const tags = ['ALL', ...Array.from(new Set(versions.map((v) => v.tag)))];

  const filteredVersions =
    selectedTag === 'ALL' ? versions : versions.filter((v) => v.tag === selectedTag);

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'feature':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
      case 'audio':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';
      case 'design':
      case 'visual':
      case 'animation':
        return 'text-teal-400 bg-teal-950/60 border-teal-800/60';
      case 'infra':
      case 'ci/cd':
        return 'text-blue-400 bg-blue-950/60 border-blue-800/60';
      case 'privacy':
      case 'cleanup':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  return (
    <div className="space-y-8 font-sans animate-fadeIn">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Version Control &amp; Project Log
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Tracking experiments, architectural milestones, and iterations as this project evolves.
          </p>
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/60 border border-slate-800 rounded-xl backdrop-blur-md">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                playKeyClick();
                setSelectedTag(tag);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-white text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Version Timeline */}
      <div className="space-y-6">
        {filteredVersions.map((ver, idx) => (
          <article
            key={ver.version}
            className="p-6 sm:p-7 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md space-y-4 hover:border-slate-700/80 transition-colors"
          >
            {/* Version Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60">
                  {ver.version}
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {ver.title}
                </h3>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <span>{ver.date}</span>
                {idx === 0 && (
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/80">
                    LATEST
                  </span>
                )}
              </div>
            </div>

            {/* Narrative Summary */}
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {ver.summary}
            </p>

            {/* List of Material Changes */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                Material Modifications:
              </span>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {ver.changes.map((change, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-2.5">
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border shrink-0 mt-0.5 ${getTypeBadge(
                        change.type
                      )}`}
                    >
                      {change.type}
                    </span>
                    <span className="leading-relaxed">{change.description}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Commits Badge Row */}
            <div className="pt-3 border-t border-slate-800/40 flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>Commits:</span>
              <div className="flex flex-wrap gap-1.5">
                {ver.commits.map((hash) => (
                  <span
                    key={hash}
                    className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono text-[11px]"
                  >
                    #{hash}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
