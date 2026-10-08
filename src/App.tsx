/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatedRocketScene } from './components/AnimatedRocketScene';
import { CosmicGame } from './components/CosmicGame';
import { ChangelogView } from './components/ChangelogView';
import { InvestmentAgentView } from './components/InvestmentAgentView';
import { BartPlannerView } from './components/BartPlannerView';
import { RocketLogo } from './components/RocketLogo';
import { playKeyClick } from './utils/audio';

type Tab = 'home' | 'projects' | 'games' | 'changelog' | 'about';

interface RouteState {
  tab: Tab;
  project: string | null;
}

const getPathForState = (tab: Tab, project: string | null): string => {
  if (tab === 'projects') {
    if (project === 'roboinvestor') return '/myprojects/roboinvestor';
    if (project === 'bart') return '/myprojects/bart';
    return '/myprojects';
  }
  if (tab === 'games') return '/mygames';
  if (tab === 'changelog') return '/version-history';
  if (tab === 'about') return '/aboutme';
  return '/';
};

const getStateForPath = (pathname: string): RouteState => {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  if (clean === '/myprojects/bart' || clean === '/projects/bart') {
    return { tab: 'projects', project: 'bart' };
  }
  if (clean === '/myprojects/roboinvestor' || clean === '/projects/roboinvestor') {
    return { tab: 'projects', project: 'roboinvestor' };
  }
  if (clean === '/myprojects' || clean === '/projects') {
    return { tab: 'projects', project: null };
  }
  if (clean === '/mygames' || clean === '/games') {
    return { tab: 'games', project: null };
  }
  if (clean === '/version-history' || clean === '/changelog') {
    return { tab: 'changelog', project: null };
  }
  if (clean === '/aboutme' || clean === '/about') {
    return { tab: 'about', project: null };
  }

  return { tab: 'home', project: null };
};

export default function App() {
  const initial = getStateForPath(typeof window !== 'undefined' ? window.location.pathname : '/');
  const [activeTab, setActiveTab] = useState<Tab>(initial.tab);
  const [activeProject, setActiveProject] = useState<string | null>(initial.project);

  // Sync state with browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const state = getStateForPath(window.location.pathname);
      setActiveTab(state.tab);
      setActiveProject(state.project);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (tab: Tab, project: string | null = null) => {
    playKeyClick();
    setActiveTab(tab);
    setActiveProject(project);

    const newPath = getPathForState(tab, project);
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  };

  return (
    <div className="min-h-screen bg-[#04070b] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden flex flex-col justify-between">
      {/* Real Animated Rocketship in Deep Space Background */}
      <AnimatedRocketScene />

      {/* Unified Single-Page Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-12 py-16 sm:py-28 w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-start">
          {/* Left Column: Brand & Integrated Navigation */}
          <div className="md:col-span-4 space-y-8">
            {/* Static picture of the animated rocket acting as the home page link */}
            <button
              onClick={() => navigateTo('home', null)}
              className="group cursor-pointer block p-1 -ml-1 hover:opacity-90 transition-opacity"
              title="Home (huon.si)"
              aria-label="Home"
            >
              <RocketLogo className="w-16 h-10 sm:w-20 sm:h-12" />
            </button>

            {/* Simple Integrated Navigation */}
            <nav className="flex flex-col space-y-2">
              <div>
                <button
                  onClick={() => navigateTo('projects', null)}
                  className={`text-left text-lg font-medium transition-all py-1.5 cursor-pointer w-full ${
                    activeTab === 'projects' && !activeProject
                      ? 'text-white font-bold translate-x-1.5'
                      : activeTab === 'projects'
                      ? 'text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {activeTab === 'projects' && <span className="text-emerald-400 mr-2">&bull;</span>}
                  My Projects
                </button>

                {/* Sub-projects list under My Projects */}
                {activeTab === 'projects' && (
                  <div className="pl-5 space-y-1 pt-1 animate-fadeIn">
                    <button
                      onClick={() => navigateTo('projects', 'roboinvestor')}
                      className={`text-sm py-1 cursor-pointer block text-left transition-colors ${
                        activeProject === 'roboinvestor'
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      &rarr; RoboInvestor
                    </button>
                    <button
                      onClick={() => navigateTo('projects', 'bart')}
                      className={`text-sm py-1 cursor-pointer block text-left transition-colors ${
                        activeProject === 'bart'
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      &rarr; BART Planner
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigateTo('games', null)}
                className={`text-left text-lg font-medium transition-all py-1.5 cursor-pointer ${
                  activeTab === 'games'
                    ? 'text-white font-bold translate-x-1.5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === 'games' && <span className="text-emerald-400 mr-2">&bull;</span>}
                My Games
              </button>

              <button
                onClick={() => navigateTo('changelog', null)}
                className={`text-left text-lg font-medium transition-all py-1.5 cursor-pointer ${
                  activeTab === 'changelog'
                    ? 'text-white font-bold translate-x-1.5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === 'changelog' && <span className="text-emerald-400 mr-2">&bull;</span>}
                Version History
              </button>

              <button
                onClick={() => navigateTo('about', null)}
                className={`text-left text-lg font-medium transition-all py-1.5 cursor-pointer ${
                  activeTab === 'about'
                    ? 'text-white font-bold translate-x-1.5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === 'about' && <span className="text-emerald-400 mr-2">&bull;</span>}
                About Me
              </button>
            </nav>
          </div>

          {/* Right Column: Content for Selected Tab */}
          <div className="md:col-span-8 min-h-[360px]">
            {/* DEFAULT 'HOME' VIEW: Completely blank as requested */}
            {activeTab === 'home' && null}

            {/* TAB: MY PROJECTS */}
            {activeTab === 'projects' && (
              <>
                {/* Sub-Project 1: RoboInvestor */}
                {activeProject === 'roboinvestor' && (
                  <InvestmentAgentView onBack={() => navigateTo('projects', null)} />
                )}

                {/* Sub-Project 2: BART Schedule Planner */}
                {activeProject === 'bart' && (
                  <BartPlannerView onBack={() => navigateTo('projects', null)} />
                )}

                {/* Parent Projects Directory */}
                {!activeProject && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-slate-800/80 pb-5">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        My Projects
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Directory of active experiments, transit tools, and autonomous agents.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Project 1: RoboInvestor */}
                      <div
                        onClick={() => navigateTo('projects', 'roboinvestor')}
                        className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-emerald-500/60 transition-all duration-200 cursor-pointer backdrop-blur-md space-y-4 group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                          <div>
                            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                              Robinhood Agentic Integration
                            </span>
                            <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                              RoboInvestor
                            </h3>
                          </div>
                          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 self-start sm:self-auto font-medium">
                            READ-ONLY AUDIT MODE
                          </span>
                        </div>

                        <p className="text-sm text-slate-300 leading-relaxed font-normal">
                          Constraint-bound autonomous investment agent built for Robinhood&apos;s agentic solution. Engineered with radical transparency: real-time decision rationale, hard risk boundaries, and an ongoing constraint evolution log.
                        </p>

                        <div className="flex items-center justify-between pt-2 text-xs font-mono">
                          <span className="text-slate-400">
                            6 Active Constraints &bull; Decision Ledger &bull; Evolution Log
                          </span>
                          <span className="text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                            <span>Open Project Dashboard</span>
                            <span>&rarr;</span>
                          </span>
                        </div>
                      </div>

                      {/* Project 2: BART Schedule Planner */}
                      <div
                        onClick={() => navigateTo('projects', 'bart')}
                        className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-yellow-500/60 transition-all duration-200 cursor-pointer backdrop-blur-md space-y-4 group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                          <div>
                            <span className="text-xs font-mono text-yellow-400 uppercase tracking-wider font-semibold">
                              Bay Area Rapid Transit System
                            </span>
                            <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-yellow-400 transition-colors">
                              BART Schedule Planner
                            </h3>
                          </div>
                          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-yellow-950/60 border border-yellow-800/60 text-yellow-400 self-start sm:self-auto font-medium">
                            ACTIVE · LIVE ROUTER
                          </span>
                        </div>

                        <p className="text-sm text-slate-300 leading-relaxed font-normal">
                          Interactive transit itinerary and schedule planner for the SF Bay Area BART network. Instant departure calculation, fare estimates, Transbay Tube crossing routes, and color-coded line directories.
                        </p>

                        <div className="flex items-center justify-between pt-2 text-xs font-mono">
                          <span className="text-slate-400">
                            5 Color-Coded Lines &bull; Clipper Fares &bull; Station Directory
                          </span>
                          <span className="text-yellow-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                            <span>Open BART Planner</span>
                            <span>&rarr;</span>
                          </span>
                        </div>
                      </div>

                      {/* Project 3 Placeholder */}
                      <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/40 backdrop-blur-sm space-y-2 opacity-60">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">PROJECT THREE</span>
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-500 text-[11px]">PLANNED</span>
                        </div>
                        <h3 className="text-base font-semibold text-white">Upcoming Exploration</h3>
                        <p className="text-xs text-slate-400">
                          Next experimental project in development.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB: MY GAMES */}
            {activeTab === 'games' && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  My Games
                </h2>
                <CosmicGame accentColorClass="text-emerald-400" />
              </div>
            )}

            {/* TAB: VERSION HISTORY / CHANGELOG */}
            {activeTab === 'changelog' && <ChangelogView />}

            {/* TAB: ABOUT ME (No content for now) */}
            {activeTab === 'about' && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  About Me
                </h2>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simple Minimal Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto px-6 sm:px-12 py-8 w-full text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-900/60">
        <span>Huon.si</span>
        <span className="text-slate-400">
          Built with Google AI Studio &amp; Google Antigravity
        </span>
      </footer>
    </div>
  );
}
