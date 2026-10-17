import React from 'react';
import { GameMarket } from '../../types/sportsBetting';

export type DisplayGameStatus = 'In Progress' | 'Completed' | 'Upcoming';

export interface GameStatusMetadata {
  status: 'IN_PROGRESS' | 'COMPLETED' | 'UPCOMING';
  label: DisplayGameStatus;
  shortLabel: string;
  isLive: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
  badgeClass: string;
  dotClass: string;
  icon: string;
  scoreSummary?: string;
  detail: string;
}

/**
 * Robust status resolver that prevents UI errors by strictly categorizing games
 * into 'In Progress', 'Completed', or 'Upcoming'
 */
export function getGameDisplayStatus(game?: Partial<GameMarket> | any): GameStatusMetadata {
  if (!game) {
    return {
      status: 'UPCOMING',
      label: 'Upcoming',
      shortLabel: 'UPCOMING',
      isLive: false,
      isCompleted: false,
      isUpcoming: true,
      badgeClass: 'bg-cyan-950/70 border-cyan-700/60 text-cyan-300',
      dotClass: 'bg-cyan-400',
      icon: '⏳',
      detail: 'Scheduled',
    };
  }

  const rawStatus = (game.status || '').toUpperCase();
  const rawCategory = (game.gameStatusCategory || '').toLowerCase();
  const rawState = (game.statusState || '').toLowerCase();
  const schedTime = (game.scheduledTime || '').toLowerCase();
  const statusDetail = (game.statusDetail || '').toLowerCase();

  // 1. Check for Completed / Settled
  const isCompleted =
    rawStatus === 'FINAL' ||
    rawStatus === 'COMPLETED' ||
    rawCategory === 'completed' ||
    rawState === 'post' ||
    schedTime.includes('final') ||
    statusDetail.includes('final') ||
    schedTime.includes('settled') ||
    statusDetail.includes('settled');

  if (isCompleted) {
    const hasScores =
      game.scores &&
      (typeof game.scores.home === 'number' || typeof game.scores.away === 'number');
    const scoreStr = hasScores
      ? `${game.homeTeam?.abbr || 'HOM'} ${game.scores.home} - ${game.scores.away} ${game.awayTeam?.abbr || 'AWY'}`
      : undefined;

    return {
      status: 'COMPLETED',
      label: 'Completed',
      shortLabel: 'COMPLETED',
      isLive: false,
      isCompleted: true,
      isUpcoming: false,
      badgeClass: 'bg-slate-950/90 border-slate-700 text-slate-300 ring-1 ring-slate-800/80',
      dotClass: 'bg-slate-500',
      icon: '✓',
      scoreSummary: scoreStr,
      detail: game.statusDetail || game.scheduledTime || 'Final',
    };
  }

  // 2. Check for In Progress / Live
  const isInProgress =
    rawStatus === 'LIVE' ||
    rawStatus === 'IN_PROGRESS' ||
    rawCategory === 'in progress' ||
    rawState === 'in' ||
    schedTime.includes('live') ||
    statusDetail.includes('q1') ||
    statusDetail.includes('q2') ||
    statusDetail.includes('q3') ||
    statusDetail.includes('q4') ||
    statusDetail.includes('halftime') ||
    statusDetail.includes('ot') ||
    (game.scores &&
      (game.scores.home > 0 || game.scores.away > 0) &&
      !isCompleted);

  if (isInProgress) {
    const hasScores =
      game.scores &&
      (typeof game.scores.home === 'number' || typeof game.scores.away === 'number');
    const scoreStr = hasScores
      ? `${game.awayTeam?.abbr || 'AWY'} ${game.scores.away} @ ${game.homeTeam?.abbr || 'HOM'} ${game.scores.home}`
      : undefined;

    return {
      status: 'IN_PROGRESS',
      label: 'In Progress',
      shortLabel: 'IN PROGRESS',
      isLive: true,
      isCompleted: false,
      isUpcoming: false,
      badgeClass: 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-950/50 ring-1 ring-emerald-500/40',
      dotClass: 'bg-emerald-400 animate-pulse ring-2 ring-emerald-500/50',
      icon: '⚡',
      scoreSummary: scoreStr,
      detail: game.statusDetail || game.scheduledTime || 'Live In-Play',
    };
  }

  // 3. Upcoming (Default)
  return {
    status: 'UPCOMING',
    label: 'Upcoming',
    shortLabel: 'UPCOMING',
    isLive: false,
    isCompleted: false,
    isUpcoming: true,
    badgeClass: 'bg-cyan-950/60 border-cyan-600/70 text-cyan-300 ring-1 ring-cyan-500/20',
    dotClass: 'bg-cyan-400',
    icon: '📅',
    detail: game.statusDetail || game.scheduledTime || 'Upcoming Kickoff',
  };
}

export interface GameStatusBadgeProps {
  game?: Partial<GameMarket> | any;
  statusOverride?: DisplayGameStatus | 'IN_PROGRESS' | 'COMPLETED' | 'UPCOMING';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showDetail?: boolean;
  showDot?: boolean;
  showIcon?: boolean;
  className?: string;
}

export const GameStatusBadge: React.FC<GameStatusBadgeProps> = ({
  game,
  statusOverride,
  size = 'sm',
  showDetail = false,
  showDot = true,
  showIcon = false,
  className = '',
}) => {
  const meta = React.useMemo(() => {
    const resolved = getGameDisplayStatus(game);
    if (statusOverride) {
      const upper = statusOverride.toUpperCase();
      if (upper.includes('PROGRESS') || upper === 'LIVE') {
        return {
          ...resolved,
          status: 'IN_PROGRESS' as const,
          label: 'In Progress' as const,
          shortLabel: 'IN PROGRESS',
          isLive: true,
          isCompleted: false,
          isUpcoming: false,
          badgeClass: 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40',
          dotClass: 'bg-emerald-400 animate-pulse ring-2 ring-emerald-500/50',
        };
      }
      if (upper.includes('COMPLET') || upper === 'FINAL') {
        return {
          ...resolved,
          status: 'COMPLETED' as const,
          label: 'Completed' as const,
          shortLabel: 'COMPLETED',
          isLive: false,
          isCompleted: true,
          isUpcoming: false,
          badgeClass: 'bg-slate-950/90 border-slate-700 text-slate-300',
          dotClass: 'bg-slate-500',
        };
      }
      if (upper.includes('UPCOMING') || upper === 'SCHEDULED') {
        return {
          ...resolved,
          status: 'UPCOMING' as const,
          label: 'Upcoming' as const,
          shortLabel: 'UPCOMING',
          isLive: false,
          isCompleted: false,
          isUpcoming: true,
          badgeClass: 'bg-cyan-950/60 border-cyan-600/70 text-cyan-300',
          dotClass: 'bg-cyan-400',
        };
      }
    }
    return resolved;
  }, [game, statusOverride]);

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1 rounded',
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 rounded-md font-bold',
    md: 'text-xs px-2.5 py-1 gap-2 rounded-lg font-bold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 rounded-xl font-black',
  }[size];

  const dotSizeClasses = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono uppercase tracking-wider border select-none transition-all ${meta.badgeClass} ${sizeClasses} ${className}`}
      title={`Status: ${meta.label} · ${meta.detail}`}
    >
      {showDot && <span className={`rounded-full shrink-0 ${dotSizeClasses} ${meta.dotClass}`} />}
      {showIcon && <span className="text-[11px] leading-none shrink-0">{meta.icon}</span>}
      <span className="font-extrabold">{meta.label}</span>
      {showDetail && meta.detail && (
        <>
          <span className="opacity-40">&bull;</span>
          <span className="font-medium normal-case truncate max-w-[150px]">{meta.detail}</span>
        </>
      )}
    </span>
  );
};
