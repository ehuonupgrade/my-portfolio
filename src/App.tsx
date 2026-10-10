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
import { ToddlerActivityHub } from './components/ToddlerActivityHub';
import { FeedbackInventoryView } from './components/FeedbackInventoryView';
import { FeedbackModal } from './components/FeedbackModal';
import { RocketLogo } from './components/RocketLogo';
import { playKeyClick } from './utils/audio';

type Tab = 'home' | 'projects' | 'games' | 'changelog' | 'feedback' | 'about';

interface RouteState {
  tab: Tab;
  project: string | null;
}

const getPathForState = (tab: Tab, project: string | null): string => {
  if (tab === 'projects') {
    if (project === 'roboinvestor') return '/myprojects/roboinvestor';
    if (project === 'bart') return '/myprojects/bart';
    if (project === 'toddler-activities' || project === 'activities') return '/myprojects/toddler-activities';
    return '/myprojects';
  }
  if (tab === 'games') return '/mygames';
  if (tab === 'changelog') return '/version-history';
  if (tab === 'feedback') return '/feedback';
  if (tab === 'about') return '/aboutme';
  return '/';
};

const getStateForPath = (pathname: string): RouteState => {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  if (
    clean === '/myprojects/toddler-activities' ||
    clean === '/projects/toddler-activities' ||
    clean === '/myprojects/activities' ||
    clean === '/projects/activities'
  ) {
    return { tab: 'projects', project: 'toddler-activities' };
  }
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
  if (clean === '/feedback' || clean === '/recommendations' || clean === '/roadmap') {
    return { tab: 'feedback', project: null };
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [globalFeedbackModalOpen, setGlobalFeedbackModalOpen] = useState<boolean>(false);

  // Sync state with browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const state = getStateForPath(window.location.pathname);
      setActiveTab(state.tab);
      setActiveProject(state.project);
      setMobileMenuOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (tab: Tab, project: string | null = null) => {
    playKeyClick();
    setActiveTab(tab);
    setActiveProject(project);
    setMobileMenuOpen(false);

    const newPath = getPathForState(tab, project);
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  };

  const getActiveTitle = () => {
    if (activeTab === 'projects') {
      if (activeProject === 'bart') return 'BART Planner';
      if (activeProject === 'roboinvestor') return 'RoboInvestor';
      if (activeProject === 'toddler-activities' || activeProject === 'activities') return 'Activity Hub';
      return 'My Projects';
    }
    if (activeTab === 'games') return 'My Games';
    if (activeTab === 'changelog') return 'Version History';
    if (activeTab === 'feedback') return 'Feedback & Roadmap';
    if (activeTab === 'about') return 'About Me';
    return 'Home';
  };

  return (
    <div className="min-h-screen bg-[#04070b] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden flex flex-col justify-between">
      {/* Real Animated Rocketship in Deep Space Background */}
      <AnimatedRocketScene />

      {/* MOBILE-ONLY TOP NAVIGATION HEADER (Phone / Android Chrome touch optimized) */}
      <div className="md:hidden sticky top-0 z-50 bg-[#04070b]/90 backdrop-blur-xl border-b border-slate-800/80 px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Active Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => navigateTo('home', null)}
              className="cursor-pointer shrink-0 p-1 -ml-1 active:opacity-75 transition-opacity"
              title="Home (huon.si)"
              aria-label="Home"
            >
              <RocketLogo className="w-10 h-7" />
            </button>
            <div className="flex items-center gap-1.5 min-w-0 text-xs font-mono">
              <span className="text-slate-400 font-bold shrink-0">huon.si</span>
              {activeTab !== 'home' && (
                <>
                  <span className="text-slate-600">/</span>
                  <span className="text-emerald-400 font-semibold truncate">
                    {getActiveTitle()}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => {
              playKeyClick();
              setMobileMenuOpen((prev) => !prev);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-200 active:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation Menu"
          >
            <span>{mobileMenuOpen ? '✕' : '☰'}</span>
            <span className="text-[11px] font-bold">{mobileMenuOpen ? 'CLOSE' : 'MENU'}</span>
          </button>
        </div>

        {/* Collapsible Full Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="mt-3 p-4 rounded-2xl bg-slate-950/95 border border-slate-800/90 shadow-2xl space-y-3 animate-fadeIn">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold pb-2 border-b border-slate-800/80">
              Navigation Menu
            </div>
            <nav className="flex flex-col space-y-1 text-sm font-medium">
              <button
                onClick={() => navigateTo('home', null)}
                className={`text-left px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                  activeTab === 'home' ? 'bg-slate-900 text-white font-bold' : 'text-slate-300 hover:bg-slate-900/50'
                }`}
              >
                <span>🚀 Home</span>
                {activeTab === 'home' && <span className="text-emerald-400 text-xs font-mono">&bull; Active</span>}
              </button>

              <div className="space-y-1">
                <button
                  onClick={() => navigateTo('projects', null)}
                  className={`text-left px-3 py-2.5 rounded-xl transition-colors cursor-pointer w-full flex items-center justify-between ${
                    activeTab === 'projects' && !activeProject
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-900/50'
                  }`}
                >
                  <span>💼 My Projects</span>
                  {activeTab === 'projects' && <span className="text-emerald-400 text-xs font-mono">&bull; Active</span>}
                </button>

                <div className="pl-6 space-y-1">
                  <button
                    onClick={() => navigateTo('projects', 'bart')}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer w-full flex items-center justify-between ${
                      activeProject === 'bart'
                        ? 'bg-yellow-950/70 border border-yellow-800 text-yellow-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>&rarr; BART Planner (Live Router)</span>
                    {activeProject === 'bart' && <span className="text-yellow-400 text-[10px]">CURRENT</span>}
                  </button>

                  <button
                    onClick={() => navigateTo('projects', 'roboinvestor')}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer w-full flex items-center justify-between ${
                      activeProject === 'roboinvestor'
                        ? 'bg-cyan-950/70 border border-cyan-800 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>&rarr; RoboInvestor (Robinhood Agent)</span>
                    {activeProject === 'roboinvestor' && <span className="text-cyan-400 text-[10px]">CURRENT</span>}
                  </button>

                  <button
                    onClick={() => navigateTo('projects', 'toddler-activities')}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer w-full flex items-center justify-between ${
                      activeProject === 'toddler-activities'
                        ? 'bg-pink-950/70 border border-pink-800 text-pink-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>&rarr; Kids Activity Hub (Ages 0–17)</span>
                    {activeProject === 'toddler-activities' && <span className="text-pink-400 text-[10px]">CURRENT</span>}
                  </button>
                </div>
              </div>

              <button
                onClick={() => navigateTo('games', null)}
                className={`text-left px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                  activeTab === 'games' ? 'bg-slate-900 text-white font-bold' : 'text-slate-300 hover:bg-slate-900/50'
                }`}
              >
                <span>🎮 My Games (Cosmic Defender)</span>
                {activeTab === 'games' && <span className="text-emerald-400 text-xs font-mono">&bull; Active</span>}
              </button>

              <button
                onClick={() => navigateTo('changelog', null)}
                className={`text-left px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                  activeTab === 'changelog' ? 'bg-slate-900 text-white font-bold' : 'text-slate-300 hover:bg-slate-900/50'
                }`}
              >
                <span>📜 Version History &amp; Changelog</span>
                {activeTab === 'changelog' && <span className="text-emerald-400 text-xs font-mono">&bull; Active</span>}
              </button>

              <button
                onClick={() => navigateTo('feedback', null)}
                className={`text-left px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                  activeTab === 'feedback' ? 'bg-slate-900 text-white font-bold' : 'text-slate-300 hover:bg-slate-900/50'
                }`}
              >
                <span>💡 Feedback &amp; Evolution Hub</span>
                {activeTab === 'feedback' && <span className="text-emerald-400 text-xs font-mono">&bull; Active</span>}
              </button>

              <button
                onClick={() => navigateTo('about', null)}
                className={`text-left px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                  activeTab === 'about' ? 'bg-slate-900 text-white font-bold' : 'text-slate-300 hover:bg-slate-900/50'
                }`}
              >
                <span>👤 About Me</span>
                {activeTab === 'about' && <span className="text-emerald-400 text-xs font-mono">&bull; Active</span>}
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Unified Responsive Container: Slightly wider on desktop, snug and edge-friendly on phones */}
      <div className="relative z-10 max-w-5xl lg:max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-8 md:py-14 lg:py-16 w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-12 items-start">
          {/* DESKTOP-ONLY Left Column: Brand & Sticky Integrated Navigation */}
          <div className="hidden md:block md:col-span-4 lg:col-span-3 xl:col-span-3 md:sticky md:top-8 lg:top-12 self-start space-y-8">
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
                    <button
                      onClick={() => navigateTo('projects', 'toddler-activities')}
                      className={`text-sm py-1 cursor-pointer block text-left transition-colors ${
                        activeProject === 'toddler-activities'
                          ? 'text-pink-400 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      &rarr; Kids Activity Hub (Ages 0–17)
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
                onClick={() => navigateTo('feedback', null)}
                className={`text-left text-lg font-medium transition-all py-1.5 cursor-pointer ${
                  activeTab === 'feedback'
                    ? 'text-white font-bold translate-x-1.5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === 'feedback' && <span className="text-emerald-400 mr-2">&bull;</span>}
                Feedback &amp; Evolution
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

          {/* Right Column: Main Content Area (Expands comfortably on Desktop, fills Phone cleanly) */}
          <div className="col-span-1 md:col-span-8 lg:col-span-9 xl:col-span-9 min-h-[360px] w-full">
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

                {/* Sub-Project 3: Little Explorer (Toddler Activity Aggregator) */}
                {activeProject === 'toddler-activities' && (
                  <ToddlerActivityHub onBack={() => navigateTo('projects', null)} />
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

                      {/* Project 3: Kids & Youth Activity Hub */}
                      <div
                        onClick={() => navigateTo('projects', 'toddler-activities')}
                        className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-pink-500/60 transition-all duration-200 cursor-pointer backdrop-blur-md space-y-4 group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                          <div>
                            <span className="text-xs font-mono text-pink-400 uppercase tracking-wider font-semibold">
                              Bay Area Youth &amp; Kids Activity Aggregator
                            </span>
                            <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-pink-300 transition-colors">
                              Kids &amp; Youth Activity Hub
                            </h3>
                          </div>
                          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-pink-950/60 border border-pink-800/60 text-pink-300 self-start sm:self-auto font-medium">
                            AGES 0 – 17 · ALL KIDS
                          </span>
                        </div>

                        <p className="text-sm text-slate-300 leading-relaxed font-normal">
                          Comprehensive local youth activity aggregator for parents with kids of any age (infants to teens). Pools verified swimming programs, gymnastics &amp; ninja parkour, creative dance, classical ballet, martial arts, and STEM with cross-platform ratings (Google, Yelp, Winnie, Sawyer), transparent pricing, live seat availability, and direct registration links.
                        </p>

                        <div className="flex items-center justify-between pt-2 text-xs font-mono">
                          <span className="text-slate-400">
                            Swim &bull; Gymnastics &bull; Dance &bull; Ballet &bull; STEM &bull; Martial Arts
                          </span>
                          <span className="text-pink-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                            <span>Explore Kids Classes</span>
                            <span>&rarr;</span>
                          </span>
                        </div>
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

            {/* TAB: FEEDBACK & EVOLUTION ROADMAP */}
            {activeTab === 'feedback' && <FeedbackInventoryView onBack={() => navigateTo('projects', null)} />}

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

      {/* Floating Action Button for Quick Feedback Submission across all pages */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => {
            playKeyClick();
            setGlobalFeedbackModalOpen(true);
          }}
          className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-emerald-500/60 hover:border-emerald-400 text-xs font-mono text-emerald-300 hover:text-white shadow-2xl backdrop-blur-md transition-all cursor-pointer active:scale-95"
          title="Provide feedback, suggest a feature, or report an issue on any aspect of this website"
        >
          <span className="text-base group-hover:rotate-12 transition-transform">💡</span>
          <span className="font-bold hidden sm:inline">Feedback / Suggestion</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {/* Global Feedback Submission Modal */}
      <FeedbackModal
        isOpen={globalFeedbackModalOpen}
        onClose={() => setGlobalFeedbackModalOpen(false)}
        defaultTarget={
          activeTab === 'projects' && activeProject
            ? `Project: ${activeProject}`
            : `Page: ${activeTab}`
        }
      />

      {/* Simple Minimal Responsive Footer */}
      <footer className="relative z-10 max-w-5xl lg:max-w-7xl 2xl:max-w-[1536px] mx-auto px-3.5 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 w-full text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-900/60">
        <span>Huon.si</span>
        <span className="text-slate-400">
          Built with Google AI Studio &amp; Google Antigravity
        </span>
      </footer>
    </div>
  );
}
