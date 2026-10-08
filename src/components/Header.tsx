import React from 'react';
import { TerminalTheme, PortfolioTab } from '../types';
import { playKeyClick, playBeep } from '../utils/audio';

interface HeaderProps {
  activeTab: PortfolioTab;
  setActiveTab: (tab: PortfolioTab) => void;
  theme: TerminalTheme;
  setTheme: (t: TerminalTheme) => void;
  scanlines: boolean;
  setScanlines: (s: boolean) => void;
  audioEnabled: boolean;
  setAudioEnabled: (a: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  scanlines,
  setScanlines,
  audioEnabled,
  setAudioEnabled,
}) => {
  const handleThemeCycle = () => {
    playBeep(520, 0.05);
    const order: TerminalTheme[] = ['green', 'amber', 'cyan', 'white'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  const handleScanlineToggle = () => {
    playKeyClick();
    setScanlines(!scanlines);
  };

  const handleAudioToggle = () => {
    playKeyClick();
    setAudioEnabled(!audioEnabled);
  };

  return (
    <header className="border-b border-[#1a331c] bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark (Top Bar Contract) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            playKeyClick();
            setActiveTab('projects');
          }}
          className="text-base font-bold tracking-tight text-inherit select-none hover:opacity-80 transition-opacity flex items-center gap-2"
        >
          <span className="text-[#00ff41]">&gt;</span>
          <span>ERIC HUON</span>
          <span className="text-[11px] opacity-60 font-mono hidden sm:inline">// PORTFOLIO</span>
        </a>

        {/* Zone 2: Navigation links: Projects, Games, About Me */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-mono">
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('projects');
            }}
            className={`hover:underline transition-all ${
              activeTab === 'projects'
                ? 'font-bold text-[#00ff41] underline underline-offset-4'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('games');
            }}
            className={`hover:underline transition-all ${
              activeTab === 'games'
                ? 'font-bold text-[#00ff41] underline underline-offset-4'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            Games
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('about');
            }}
            className={`hover:underline transition-all ${
              activeTab === 'about'
                ? 'font-bold text-[#00ff41] underline underline-offset-4'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            About Me
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('cli');
            }}
            className={`hover:underline transition-all ${
              activeTab === 'cli'
                ? 'font-bold text-[#00ff41] underline underline-offset-4'
                : 'opacity-50 hover:opacity-90'
            }`}
          >
            Terminal CLI
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('subdomains');
            }}
            className={`hover:underline transition-all ${
              activeTab === 'subdomains'
                ? 'font-bold text-[#00ff41] underline underline-offset-4'
                : 'opacity-50 hover:opacity-90'
            }`}
          >
            DNS Matrix
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Phosphor cycle */}
          <button
            onClick={handleThemeCycle}
            title="Cycle phosphor color scheme"
            className="px-2.5 py-1 text-xs border border-[#1a331c] bg-[#0d140d] hover:border-[#00ff41] transition-colors font-mono whitespace-nowrap"
          >
            {theme.toUpperCase()}
          </button>

          {/* CRT Scanline Toggle */}
          <button
            onClick={handleScanlineToggle}
            title="Toggle CRT Scanline overlay"
            className={`px-2.5 py-1 text-xs border border-[#1a331c] transition-colors font-mono whitespace-nowrap ${
              scanlines ? 'bg-[#142916] font-semibold text-[#00ff41]' : 'bg-transparent opacity-60'
            }`}
          >
            CRT: {scanlines ? 'ON' : 'OFF'}
          </button>

          {/* Audio toggle */}
          <button
            onClick={handleAudioToggle}
            title="Toggle terminal sound effects"
            className="p-1 px-2 text-xs border border-[#1a331c] bg-[#0d140d] hover:border-[#00ff41] transition-colors font-mono"
          >
            {audioEnabled ? 'VOL' : 'MUTE'}
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="flex md:hidden items-center justify-around border-t border-[#1a331c] px-2 py-2 text-xs">
        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('projects');
          }}
          className={`px-2 py-1 ${activeTab === 'projects' ? 'font-bold text-[#00ff41] underline' : 'opacity-65'}`}
        >
          Projects
        </button>
        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('games');
          }}
          className={`px-2 py-1 ${activeTab === 'games' ? 'font-bold text-[#00ff41] underline' : 'opacity-65'}`}
        >
          Games
        </button>
        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('about');
          }}
          className={`px-2 py-1 ${activeTab === 'about' ? 'font-bold text-[#00ff41] underline' : 'opacity-65'}`}
        >
          About Me
        </button>
        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('cli');
          }}
          className={`px-2 py-1 ${activeTab === 'cli' ? 'font-bold text-[#00ff41]' : 'opacity-50'}`}
        >
          CLI
        </button>
      </div>
    </header>
  );
};
