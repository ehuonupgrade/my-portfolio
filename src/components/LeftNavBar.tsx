import React from 'react';
import { playKeyClick } from '../utils/audio';

export type NavTab = 'home' | 'projects' | 'games' | 'about';

interface LeftNavBarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const LeftNavBar: React.FC<LeftNavBarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const navItems: { id: NavTab; label: string; icon?: string }[] = [
    { id: 'projects', label: 'My Projects' },
    { id: 'games', label: 'My Games', icon: '🚀' },
    { id: 'about', label: 'About Me' },
  ];

  const handleSelect = (tab: NavTab) => {
    playKeyClick();
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Left Navigation Bar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950/90 md:bg-slate-950/75 backdrop-blur-xl border-r border-slate-800/80 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out font-sans ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-8">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleSelect('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse" />
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Huon.si
              </span>
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsOpenMobile(false)}
              className="text-slate-400 hover:text-white p-1 md:hidden"
            >
              &times;
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.icon && <span className="text-xs">{item.icon}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Minimal Footer */}
        <div className="pt-6 border-t border-slate-900 text-[11px] text-slate-500 font-mono">
          <span>huon.si</span>
        </div>
      </aside>
    </>
  );
};
