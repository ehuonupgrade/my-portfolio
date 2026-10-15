import React from 'react';
import { LiveRosterVerificationState } from '../utils/useLiveRosterVerification';
import { playKeyClick } from '../utils/audio';

interface LiveRosterStreamBadgeProps {
  rosterState: LiveRosterVerificationState;
  onOpenModal: () => void;
}

export const LiveRosterStreamBadge: React.FC<LiveRosterStreamBadgeProps> = ({
  rosterState,
  onOpenModal,
}) => {
  return (
    <button
      onClick={() => {
        playKeyClick();
        onOpenModal();
      }}
      className="px-3 py-1 rounded-full bg-purple-950/90 border border-purple-500/60 hover:border-purple-400 text-purple-300 font-mono text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer group"
      title="Click to view full Active NFL Player Roster & Depth Chart Audit"
    >
      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shrink-0" />
      <span className="font-bold">✓ Active Rosters Verified</span>
      <span className="text-slate-400">&bull;</span>
      <span className="text-white">32 NFL Teams</span>
      <span className="text-slate-400">&bull;</span>
      <span className="text-purple-200 font-bold font-mono">
        {rosterState.syncSecondsAgo === 0 ? 'just now' : `${rosterState.syncSecondsAgo}s ago`}
      </span>
      <span className="text-[10px] text-purple-400 group-hover:translate-x-0.5 transition-transform">
        &rarr;
      </span>
    </button>
  );
};
