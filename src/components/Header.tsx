import React, { useState } from 'react';
import { TerminalTheme } from '../types';
import { playKeyClick, playBeep, playSuccessChime } from '../utils/audio';
import { downloadProjectZip } from '../utils/exportZip';

interface HeaderProps {
  activeTab: 'overview' | 'apps' | 'subdomains' | 'cli' | 'astro';
  setActiveTab: (tab: 'overview' | 'apps' | 'subdomains' | 'cli' | 'astro') => void;
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
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    playKeyClick();
    setDownloading(true);
    try {
      await downloadProjectZip();
      playSuccessChime();
    } catch {
      // ignore
    } finally {
      setDownloading(false);
    }
  };

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
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark (Top Bar Contract) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            playKeyClick();
            setActiveTab('overview');
          }}
          className="text-base font-bold tracking-tight text-inherit select-none hover:opacity-80 transition-opacity"
        >
          TERMINAL_HUB
        </a>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono">
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('overview');
            }}
            className={`hover:underline transition-opacity ${
              activeTab === 'overview' ? 'font-bold opacity-100' : 'opacity-65 hover:opacity-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('apps');
            }}
            className={`hover:underline transition-opacity ${
              activeTab === 'apps' ? 'font-bold opacity-100' : 'opacity-65 hover:opacity-100'
            }`}
          >
            Applications
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('subdomains');
            }}
            className={`hover:underline transition-opacity ${
              activeTab === 'subdomains' ? 'font-bold opacity-100' : 'opacity-65 hover:opacity-100'
            }`}
          >
            Subdomains
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('cli');
            }}
            className={`hover:underline transition-opacity ${
              activeTab === 'cli' ? 'font-bold opacity-100' : 'opacity-65 hover:opacity-100'
            }`}
          >
            Interactive CLI
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setActiveTab('astro');
            }}
            className={`hover:underline transition-opacity ${
              activeTab === 'astro' ? 'font-bold opacity-100' : 'opacity-65 hover:opacity-100'
            }`}
          >
            Astro Spec
          </button>
        </nav>

        {/* Zone 3: Actions + Download Code */}
        <div className="flex items-center gap-2">
          {/* Download ZIP Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            title="Download full project repository as ZIP"
            className="px-2.5 py-1 text-xs bg-[#00ff41] text-[#0a0a0a] font-bold hover:bg-[#52ff7d] transition-colors font-mono whitespace-nowrap"
          >
            {downloading ? 'PACKING...' : 'DOWNLOAD .ZIP'}
          </button>

          {/* Theme Phosphor cycle */}
          <button
            onClick={handleThemeCycle}
            title="Cycle phosphor color scheme"
            className="px-2.5 py-1 text-xs border border-[#1a331c] bg-[#0d140d] hover:border-[#00ff41] transition-colors font-mono whitespace-nowrap hidden sm:inline-block"
          >
            {theme.toUpperCase()}
          </button>

          {/* CRT Scanline Toggle */}
          <button
            onClick={handleScanlineToggle}
            title="Toggle CRT Scanline overlay"
            className={`px-2.5 py-1 text-xs border border-[#1a331c] transition-colors font-mono whitespace-nowrap ${
              scanlines ? 'bg-[#142916] font-semibold' : 'bg-transparent opacity-60'
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
      <div className="flex md:hidden items-center justify-around border-t border-[#1a331c] px-2 py-1.5 text-[11px] overflow-x-auto">
        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('overview');
          }}
          className={`px-2 py-1 ${activeTab === 'overview' ? 'font-bold text-[#00ff41]' : 'opacity-65'}`}
        >
          Overview
        </button>
        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('apps');
          }}
          className={`px-2 py-1 ${activeTab === 'apps' ? 'font-bold text-[#00ff41]' : 'opacity-65'}`}
        >
          Apps
        </button>
        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('subdomains');
          }}
          className={`px-2 py-1 ${activeTab === 'subdomains' ? 'font-bold text-[#00ff41]' : 'opacity-65'}`}
        >
          Subdomains
        </button>
        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('cli');
          }}
          className={`px-2 py-1 ${activeTab === 'cli' ? 'font-bold text-[#00ff41]' : 'opacity-65'}`}
        >
          CLI
        </button>
        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('astro');
          }}
          className={`px-2 py-1 ${activeTab === 'astro' ? 'font-bold text-[#00ff41]' : 'opacity-65'}`}
        >
          Astro
        </button>
      </div>
    </header>
  );
};
