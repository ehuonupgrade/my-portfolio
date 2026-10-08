import React from 'react';
import { PortfolioTab } from '../types';
import { playKeyClick } from '../utils/audio';

interface LightNavBarProps {
  activeTab: PortfolioTab;
  setActiveTab: (tab: PortfolioTab) => void;
}

export const LightNavBar: React.FC<LightNavBarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 font-sans">
        {/* Zone 1: Brand Wordmark: Huon.si */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            playKeyClick();
            setActiveTab('projects');
          }}
          className="flex items-center gap-2.5 text-slate-900 group select-none"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
          <span className="text-base sm:text-lg font-bold tracking-tight group-hover:text-emerald-600 transition-colors">
            Huon.si
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            / Portfolio
          </span>
        </a>

        {/* Zone 2: Navigation Links: Projects, Games, About Me */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('projects');
            }}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Projects
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('games');
            }}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'games'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Games</span>
            <span className="text-xs">🚀</span>
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('about');
            }}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'about'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            About Me
          </button>
        </nav>
      </div>
    </header>
  );
};
