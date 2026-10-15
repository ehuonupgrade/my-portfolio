import React from 'react';
import { LiveOddsStreamState } from '../utils/useLiveOddsStream';
import { playKeyClick } from '../utils/audio';

interface LiveOddsStreamBadgeProps {
  oddsState: LiveOddsStreamState;
  onOpenModal: () => void;
}

export const LiveOddsStreamBadge: React.FC<LiveOddsStreamBadgeProps> = ({
  oddsState,
  onOpenModal,
}) => {
  return (
    <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs">
      <button
        onClick={() => {
          playKeyClick();
          onOpenModal();
        }}
        className="px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/60 hover:border-cyan-400 text-cyan-300 font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer group"
        title="Click to view full Real-Time Multi-Sportsbook Line Stream"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
        <span className="font-bold">⚡ Live Lines Stream</span>
        <span className="text-slate-400">&bull;</span>
        <span className="text-white">8 Books Synced</span>
        <span className="text-slate-400">&bull;</span>
        <span className="text-emerald-400 font-normal">
          {oddsState.pollSecondsAgo === 0 ? 'Polled just now' : `Polled ${oddsState.pollSecondsAgo}s ago`}
        </span>
        <span className="text-[10px] text-cyan-400 group-hover:translate-x-0.5 transition-transform">
          &rarr;
        </span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          oddsState.syncOddsNow();
        }}
        disabled={oddsState.isSyncingOdds}
        title="Click to force immediate live odds re-poll across all 8 sportsbooks"
        className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
      >
        <span className={oddsState.isSyncingOdds ? 'animate-spin' : ''}>🔄</span>
        <span className="hidden sm:inline">{oddsState.isSyncingOdds ? 'Syncing...' : 'Sync Lines'}</span>
      </button>
    </div>
  );
};
