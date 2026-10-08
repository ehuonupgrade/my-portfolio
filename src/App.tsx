/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import initialProjectsData from './data/projects.json';
import { ProjectItem, TerminalTheme } from './types';
import { Header } from './components/Header';
import { ProjectCard } from './components/ProjectCard';
import { TerminalCLI } from './components/TerminalCLI';
import { AppSandboxModal } from './components/AppSandboxModal';
import { SubdomainMatrix } from './components/SubdomainMatrix';
import { AstroSpecViewer } from './components/AstroSpecViewer';
import { setAudioEnabled } from './utils/audio';

export default function App() {
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjectsData as ProjectItem[]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'apps' | 'subdomains' | 'cli' | 'astro'>('overview');
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
      className={`min-h-screen bg-[#0a0a0a] ${currentTheme.text} font-mono selection:bg-[#00ff41] selection:text-[#0a0a0a] relative transition-colors duration-200`}
    >
      {/* Authentic CRT Scanline Overlay */}
      {scanlines && (
        <div
          className="pointer-events-none fixed inset-0 z-50 scanlines-overlay opacity-30 mix-blend-screen"
          aria-hidden="true"
        />
      )}

      {/* Top Bar Contract Navigation */}
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

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Top System Telemetry Bar */}
        <section className={`border-b ${currentTheme.border} pb-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs opacity-70 mb-3 gap-1">
            <div className="flex items-center gap-3">
              <span>HOST: hub.terminal.internal</span>
              <span aria-hidden="true">·</span>
              <span>TTY: pts/0</span>
              <span aria-hidden="true">·</span>
              <span>EDGE: Vercel CDN</span>
            </div>
            <div className="flex items-center gap-3">
              <span>LAST_LOGIN: {lastLogin || 'FETCHING...'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-emerald-400">200 OK</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <span className="opacity-60">$</span>
              <span className={currentTheme.glow}>USER_IDENT: GUEST_DEVELOPER</span>
              <span className="inline-block w-2.5 h-5 bg-current cursor-blink"></span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => {
                  const pomodoro = projects.find((p) => p.demoType === 'pomodoro') || projects[0];
                  setSelectedProject(pomodoro);
                }}
                className="px-3 py-1.5 bg-[#142916] hover:bg-current hover:text-[#0a0a0a] transition-colors border border-[#1a3d1e] font-semibold"
              >
                Launch Pomodoro &rarr;
              </button>
              <button
                onClick={() => setActiveTab('cli')}
                className="px-3 py-1.5 border border-[#1a3d1e] hover:border-current transition-colors"
              >
                Open Full CLI
              </button>
            </div>
          </div>
        </section>

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-10">
            {/* Simulated Terminal Command: >> cat about_me.txt */}
            <section className={`border ${currentTheme.border} bg-[#0e140e] p-5 shadow-md`}>
              <div className={`flex items-center justify-between text-xs opacity-75 border-b ${currentTheme.border} pb-2.5 mb-3.5`}>
                <div className="flex items-center gap-2">
                  <span>guest@hub:~</span>
                  <span className="font-semibold text-current">&gt;&gt; cat about_me.txt</span>
                </div>
                <span className="opacity-50">UTF-8 · 412 bytes</span>
              </div>

              <div className="space-y-3 text-sm leading-relaxed text-[#c0ffc9]">
                <p>
                  Full-stack systems engineer &amp; interface architect building high-speed edge applications,
                  developer tooling, and distributed systems.
                </p>
                <p className="text-xs opacity-80 pt-1 border-t border-[#142616]">
                  CORE ARCHITECTURE: Root domain acts as the developer terminal portfolio hub, mapping isolated
                  CNAME records to specialized micro-applications hosted across subdomains.
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs opacity-65 pt-1">
                  <span>Astro</span>
                  <span aria-hidden="true">·</span>
                  <span>TypeScript</span>
                  <span aria-hidden="true">·</span>
                  <span>Tailwind CSS v4</span>
                  <span aria-hidden="true">·</span>
                  <span>Vercel Edge</span>
                  <span aria-hidden="true">·</span>
                  <span>Distributed Subdomains</span>
                  <span aria-hidden="true">·</span>
                  <span>Gemini API</span>
                </div>
              </div>
            </section>

            {/* Live Interactive CLI Terminal Shell */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <span>&gt;&gt;</span> INTERACTIVE COMMAND RUNNER
                </h2>
                <span className="text-xs opacity-60">type &apos;help&apos;, &apos;ls&apos;, or &apos;run pomodoro&apos;</span>
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
            </section>

            {/* Applications Terminal Blocks Grid */}
            <section className="space-y-4">
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b ${currentTheme.border} pb-2 gap-2`}>
                <h2 className="text-sm font-bold tracking-wider uppercase flex items-center gap-2">
                  <span>&gt;&gt;</span> APPLICATIONS [{projects.length}]
                </h2>
                <div className="flex items-center gap-3 text-xs opacity-75">
                  <span>SOURCE: src/data/projects.json</span>
                  <button
                    onClick={() => setActiveTab('apps')}
                    className="hover:underline font-semibold"
                  >
                    View All &rarr;
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onLaunch={(p) => setSelectedProject(p)}
                    accentColorClass={currentTheme.text}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Tab 2: APPLICATIONS */}
        {activeTab === 'apps' && (
          <div className="space-y-6">
            <div className={`border-b ${currentTheme.border} pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
              <div>
                <h2 className="text-base font-bold uppercase tracking-wider">
                  SUBDOMAIN APPLICATION DIRECTORY
                </h2>
                <p className="text-xs opacity-70 mt-1">
                  Autonomous developer tools hosted on isolated CNAME endpoints.
                </p>
              </div>

              {/* Functional interactive category filter (Allowed by guidelines) */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0c140c] border border-[#1a331c]">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAppFilter(cat)}
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
          </div>
        )}

        {/* Tab 3: SUBDOMAINS */}
        {activeTab === 'subdomains' && (
          <SubdomainMatrix
            projects={projects}
            onAddProject={handleAddProject}
            onLaunchProject={(p) => setSelectedProject(p)}
            accentColorClass={currentTheme.text}
          />
        )}

        {/* Tab 4: INTERACTIVE CLI */}
        {activeTab === 'cli' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold uppercase tracking-wider">
                  FULL-SCREEN TERMINAL SHELL
                </h2>
                <p className="text-xs opacity-70 mt-1">
                  Native POSIX-style CLI interface for navigating projects, testing DNS endpoints, and running mini-apps.
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

        {/* Tab 5: ASTRO SPEC */}
        {activeTab === 'astro' && (
          <AstroSpecViewer
            projects={projects}
            accentColorClass={currentTheme.text}
          />
        )}

        {/* Quiet Footer */}
        <footer className={`mt-16 pt-6 border-t ${currentTheme.border} text-xs opacity-60 flex flex-col sm:flex-row items-center justify-between gap-3 select-none`}>
          <div className="flex items-center gap-3">
            <span>TERMINAL_PORTFOLIO_HUB</span>
            <span aria-hidden="true">·</span>
            <span>ASTRO + TAILWIND V4 + VERCEL</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('astro')}
              className="hover:underline hover:opacity-100"
            >
              Export Astro Specs
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
