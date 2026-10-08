/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatedRocketScene } from './components/AnimatedRocketScene';
import { CosmicGame } from './components/CosmicGame';
import { playKeyClick } from './utils/audio';

type Tab = 'projects' | 'games' | 'about';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('projects');

  const handleSelectTab = (tab: Tab) => {
    playKeyClick();
    setActiveTab(tab);
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
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Huon.si
            </h1>

            {/* Simple Integrated Navigation */}
            <nav className="flex flex-col space-y-2">
              <button
                onClick={() => handleSelectTab('projects')}
                className={`text-left text-lg font-medium transition-all py-1.5 cursor-pointer ${
                  activeTab === 'projects'
                    ? 'text-white font-bold translate-x-1.5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === 'projects' && <span className="text-emerald-400 mr-2">&bull;</span>}
                My Projects
              </button>

              <button
                onClick={() => handleSelectTab('games')}
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
                onClick={() => handleSelectTab('about')}
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
            {/* TAB: MY PROJECTS */}
            {activeTab === 'projects' && (
              <div className="space-y-6 animate-fadeIn">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  My Projects
                </h2>
                <div className="space-y-4 pt-2">
                  <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
                    <h3 className="text-base font-semibold text-white">Project One</h3>
                    <p className="text-sm text-slate-400 mt-1">Coming soon.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
                    <h3 className="text-base font-semibold text-white">Project Two</h3>
                    <p className="text-sm text-slate-400 mt-1">Coming soon.</p>
                  </div>
                </div>
              </div>
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
      <footer className="relative z-10 max-w-5xl mx-auto px-6 sm:px-12 py-8 w-full text-xs text-slate-500 font-mono">
        <span>Huon.si</span>
      </footer>
    </div>
  );
}
