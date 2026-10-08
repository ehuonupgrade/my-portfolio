/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import initialProjectsData from './data/projects.json';
import { ProjectItem, PortfolioTab } from './types';
import { LightNavBar } from './components/LightNavBar';
import { DesignProjectCard } from './components/DesignProjectCard';
import { AnimatedRocketScene } from './components/AnimatedRocketScene';
import { CosmicGame } from './components/CosmicGame';
import { AboutSection } from './components/AboutSection';
import { DesignProjectModal } from './components/DesignProjectModal';
import { playKeyClick } from './utils/audio';

export default function App() {
  const [projects] = useState<ProjectItem[]>(initialProjectsData as ProjectItem[]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [activeTab, setActiveTab] = useState<PortfolioTab>('projects');
  const [appFilter, setAppFilter] = useState<string>('ALL');

  const categories = ['ALL', ...Array.from(new Set(projects.map((p) => p.category)))];
  const filteredProjects =
    appFilter === 'ALL' ? projects : projects.filter((p) => p.category === appFilter);

  return (
    <div className="min-h-screen bg-[#04080c] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      {/* Real Animated Rocketship in Deep Space Background */}
      <AnimatedRocketScene />

      {/* Light Navigation Bar: Projects, Games, About Me */}
      <LightNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Portfolio Container */}
      <div className="relative z-10">
        {/* Design Portfolio Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-14 sm:pb-20">
          <div className="max-w-3xl space-y-6">
            {/* Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Digital Design, Visual Identity &amp; Creative Direction</span>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                Huon.si
              </h1>
              <p className="text-xl sm:text-2xl text-emerald-400 font-medium">
                Design Portfolio &amp; Creative Showcase
              </p>
            </div>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
              Exploring the intersection of modern product design, space aesthetics, visual brand systems,
              and playful interactive experiences.
            </p>

            {/* Navigation Tabs CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  playKeyClick();
                  setActiveTab('projects');
                }}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm cursor-pointer ${
                  activeTab === 'projects'
                    ? 'bg-white text-slate-950 font-semibold shadow-lg'
                    : 'bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700'
                }`}
              >
                Selected Work
              </button>
              <button
                onClick={() => {
                  playKeyClick();
                  setActiveTab('games');
                }}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm cursor-pointer flex items-center gap-2 ${
                  activeTab === 'games'
                    ? 'bg-white text-slate-950 font-semibold shadow-lg'
                    : 'bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700'
                }`}
              >
                <span>Play Games</span>
                <span>🚀</span>
              </button>
              <button
                onClick={() => {
                  playKeyClick();
                  setActiveTab('about');
                }}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm cursor-pointer ${
                  activeTab === 'about'
                    ? 'bg-white text-slate-950 font-semibold shadow-lg'
                    : 'bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700'
                }`}
              >
                About Me
              </button>
            </div>
          </div>
        </section>

        {/* Dynamic Content Sections */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
          {/* TAB 1: PROJECTS */}
          {activeTab === 'projects' && (
            <section className="space-y-8 animate-fadeIn">
              {/* Category Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Selected Design Work
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Curated digital design systems, brand identities, and visual experiments across huon.si.
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        playKeyClick();
                        setAppFilter(cat);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        appFilter === cat
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Clean Design Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {filteredProjects.map((project) => (
                  <DesignProjectCard
                    key={project.id}
                    project={project}
                    onLaunch={(p) => setSelectedProject(p)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* TAB 2: GAMES */}
          {activeTab === 'games' && (
            <section className="space-y-8 animate-fadeIn">
              <div className="pb-4 border-b border-slate-800/80">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Interactive Games Laboratory
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Playable arcade exploration game and canvas simulations designed for huon.si.
                </p>
              </div>

              <CosmicGame accentColorClass="text-emerald-400" />
            </section>
          )}

          {/* TAB 3: ABOUT ME */}
          {activeTab === 'about' && (
            <section className="space-y-8 animate-fadeIn">
              <AboutSection accentColorClass="text-emerald-400" />
            </section>
          )}
        </main>

        {/* Minimal Design Portfolio Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-300">Huon.si</span>
              <span aria-hidden="true">·</span>
              <span>Design Portfolio</span>
              <span aria-hidden="true">·</span>
              <span>huon.si</span>
            </div>
            <span className="text-slate-500 font-mono">2026</span>
          </div>
        </footer>
      </div>

      {/* Interactive Project Details Modal */}
      {selectedProject && (
        <DesignProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
