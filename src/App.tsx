/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import initialProjectsData from './data/projects.json';
import { ProjectItem, TerminalTheme, PortfolioTab } from './types';
import { Header } from './components/Header';
import { ProjectCard } from './components/ProjectCard';
import { TerminalCLI } from './components/TerminalCLI';
import { AppSandboxModal } from './components/AppSandboxModal';
import { SubdomainMatrix } from './components/SubdomainMatrix';
import { SpaceRocketBackground } from './components/SpaceRocketBackground';
import { CosmicGame } from './components/CosmicGame';
import { AboutSection } from './components/AboutSection';
import { setAudioEnabled, playKeyClick } from './utils/audio';

export default function App() {
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjectsData as ProjectItem[]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [activeTab, setActiveTab] = useState<PortfolioTab>('projects');
  const [theme, setTheme] = useState<TerminalTheme>('green');
  const [scanlines, setScanlines] = useState<boolean>(true);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [lastLogin, setLastLogin] = useState<string>('');
  const [appFilter, setAppFilter] = useState<string>('ALL');

  useEffect(() => {
    setLastLogin(new Date().toUTCString());
  }, []);

  const handleAudioChange = (enabled: boolean) => {
    setSoundOn(enabled);
    setAudioEnabled(enabled);
  };

  const handleAddProject = (newProject: ProjectItem) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  // Theme styling helpers
  const themeClasses: Record<TerminalTheme, { text: string; glow: string; border: string }> = {
    green: {
      text: 'text-[#00ff41]',
      glow: 'glow-green',
      border: 'border-[#1a331c]',
    },
    amber: {
      text: 'text-[#ffb000]',
      glow: 'glow-amber',
      border: 'border-[#3a2c0f]',
    },
    cyan: {
      text: 'text-[#00e5ff]',
      glow: 'glow-cyan',
      border: 'border-[#0f2d3a]',
    },
    white: {
      text: 'text-[#f1f5f9]',
      glow: '',
      border: 'border-[#2d3748]',
    },
  };

  const currentTheme = themeClasses[theme];

  const categories = ['ALL', ...Array.from(new Set(projects.map((p) => p.category)))];
  const filteredProjects =
    appFilter === 'ALL' ? projects : projects.filter((p) => p.category === appFilter);

  return (
    <div
      className={`min-h-screen bg-[#070b0e] ${currentTheme.text} font-mono selection:bg-[#00ff41] selection:text-[#0a0a0a] relative transition-colors duration-200 overflow-x-hidden`}
    >
      {/* Authentic CRT Scanline Overlay */}
      {scanlines && (
        <div
          className="pointer-events-none fixed inset-0 z-50 scanlines-overlay opacity-30 mix-blend-screen"
          aria-hidden="true"
        />
      )}

      {/* Top Bar Navigation Bar: Projects, Games, About Me */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
        scanlines={scanlines}
        setScanlines={setScanlines}
        audioEnabled={soundOn}
        setAudioEnabled={handleAudioChange}
      />

      {/* Hero Section with Cool Space Rocket Background */}
      <section className="relative min-h-[380px] sm:min-h-[440px] flex items-center border-b border-[#142618] overflow-hidden">
        {/* Background Visual Asset: Space Rocket in Cosmos */}
        <SpaceRocketBackground />

        {/* Hero Foreground Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 sm:py-16 w-full space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-xs opacity-75 font-mono">
            <span className="text-[#00ff41] font-bold tracking-widest bg-[#0a180f]/90 px-2.5 py-1 border border-[#1a3d1e]">
              ORBITAL SYSTEMS ENGINEER
            </span>
            <span>HOST: hub.terminal.internal</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>LAST_LOGIN: {lastLogin || '2026-10-08'}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="text-emerald-400 font-bold">ALL SYSTEMS NOMINAL</span>
          </div>

          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Eric Huon
            </h1>
            <p className="text-sm sm:text-base text-[#a3d8ab] leading-relaxed max-w-xl">
              Architecting high-velocity edge applications, distributed subdomain micro-services,
              and interactive developer tools.
            </p>
          </div>

          {/* Quick Action Navigation CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <button
              onClick={() => {
                playKeyClick();
                setActiveTab('projects');
              }}
              className={`px-4 py-2 font-bold transition-colors border ${
                activeTab === 'projects'
                  ? 'bg-[#00ff41] text-black border-[#00ff41]'
                  : 'bg-[#0f1d12] hover:bg-[#19321f] text-[#00ff41] border-[#1a3d1e]'
              }`}
            >
              Explore Projects &rarr;
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setActiveTab('games');
              }}
              className={`px-4 py-2 font-bold transition-colors border ${
                activeTab === 'games'
                  ? 'bg-[#00ff41] text-black border-[#00ff41]'
                  : 'bg-[#0f1d12] hover:bg-[#19321f] text-[#00ff41] border-[#1a3d1e]'
              }`}
            >
              Play Games 🚀
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setActiveTab('about');
              }}
              className={`px-4 py-2 font-bold transition-colors border ${
                activeTab === 'about'
                  ? 'bg-[#00ff41] text-black border-[#00ff41]'
                  : 'bg-[#0f1d12] hover:bg-[#19321f] text-[#00ff41] border-[#1a3d1e]'
              }`}
            >
              About Me
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setActiveTab('cli');
              }}
              className="px-3.5 py-2 border border-[#1a3d1e] bg-black/50 hover:border-[#00ff41] transition-colors text-xs"
            >
              $ Open Terminal CLI
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Sections based on Active Tab */}
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10 relative z-10">
        {/* TAB 1: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Section Header & Filters */}
            <div className={`border-b ${currentTheme.border} pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight uppercase flex items-center gap-2">
                  <span>&gt;&gt;</span> FEATURED APPLICATIONS &amp; SUBDOMAIN TOOLS
                </h2>
                <p className="text-xs opacity-75 mt-1">
                  Each application is deployed autonomously to an edge subdomain using CNAME DNS delegation.
                </p>
              </div>

              {/* Functional interactive category filter */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0c140c] border border-[#1a331c]">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      playKeyClick();
                      setAppFilter(cat);
                    }}
                    className={`px-2.5 py-1 text-xs font-mono transition-colors ${
                      appFilter === cat
                        ? 'bg-[#142916] text-[#00ff41] font-bold border border-[#1a3d1e]'
                        : 'opacity-65 hover:opacity-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onLaunch={(p) => setSelectedProject(p)}
                  accentColorClass={currentTheme.text}
                />
              ))}
            </div>

            {/* Embedded Terminal Snippet on Projects View */}
            <section className={`border ${currentTheme.border} bg-[#0a120c] p-4 mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono`}>
              <div className="flex items-center gap-3">
                <span className="text-[#00ff41] font-bold">$</span>
                <span className="opacity-80">Want to run these from a command line shell?</span>
              </div>
              <button
                onClick={() => {
                  playKeyClick();
                  setActiveTab('cli');
                }}
                className="px-3 py-1.5 bg-[#142916] hover:bg-[#00ff41] hover:text-black border border-[#1a3d1e] font-semibold text-xs transition-colors shrink-0"
              >
                Launch CLI Runner &rarr;
              </button>
            </section>
          </div>
        )}

        {/* TAB 2: GAMES */}
        {activeTab === 'games' && (
          <div className="animate-fadeIn">
            <CosmicGame accentColorClass={currentTheme.text} />
          </div>
        )}

        {/* TAB 3: ABOUT ME */}
        {activeTab === 'about' && (
          <div className="animate-fadeIn">
            <AboutSection accentColorClass={currentTheme.text} />
          </div>
        )}

        {/* TAB 4: INTERACTIVE CLI */}
        {activeTab === 'cli' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold uppercase tracking-wider">
                  FULL-SCREEN INTERACTIVE POSIX CLI
                </h2>
                <p className="text-xs opacity-70 mt-1">
                  Simulated developer environment with filesystem inspection, ICMP pings, and in-terminal app execution.
                </p>
              </div>
            </div>

            <TerminalCLI
              projects={projects}
              theme={theme}
              setTheme={setTheme}
              scanlines={scanlines}
              setScanlines={setScanlines}
              audioEnabled={soundOn}
              setAudioEnabled={handleAudioChange}
              onLaunchProject={(p) => setSelectedProject(p)}
              onSelectTab={setActiveTab}
            />
          </div>
        )}

        {/* TAB 5: SUBDOMAINS / DNS */}
        {activeTab === 'subdomains' && (
          <div className="animate-fadeIn">
            <SubdomainMatrix
              projects={projects}
              onAddProject={handleAddProject}
              onLaunchProject={(p) => setSelectedProject(p)}
              accentColorClass={currentTheme.text}
            />
          </div>
        )}

        {/* Quiet Footer */}
        <footer className={`mt-20 pt-6 border-t ${currentTheme.border} text-xs opacity-60 flex flex-col sm:flex-row items-center justify-between gap-3 select-none`}>
          <div className="flex items-center gap-3">
            <span>ERIC HUON // PORTFOLIO</span>
            <span aria-hidden="true">·</span>
            <span>ASTRO · TAILWIND V4 · VERCEL</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                playKeyClick();
                setActiveTab('subdomains');
              }}
              className="hover:underline hover:opacity-100"
            >
              Namecheap DNS Wizard
            </button>
            <span aria-hidden="true">·</span>
            <span>STATUS: 200 OK</span>
          </div>
        </footer>
      </main>

      {/* Interactive App Sandbox Modal */}
      {selectedProject && (
        <AppSandboxModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          accentColorClass={currentTheme.text}
        />
      )}
    </div>
  );
}
