import React from 'react';
import { useSportsData } from '../../context/SportsDataContext';
import { GameStatusBadge } from './GameStatusBadge';

interface ApiFetchDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiFetchDiagnosticsModal: React.FC<ApiFetchDiagnosticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    fetchCycleCount,
    apiFetchLogs,
    fetchSummary,
    refreshLiveData,
    isLoading,
    clearApiFetchLogs,
    statusCounts,
    games,
    statusFilter,
    setStatusFilter,
  } = useSportsData();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg">
              📡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Live Sports Data API Telemetry &amp; Fetch Cycle</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500 text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Poller
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verifies ESPN NFL Scoreboard API fetch cycles, latency, and status classifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshLiveData()}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
              <span>{isLoading ? 'Fetching...' : 'Trigger Cycle Now'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Fetch Cycles</div>
              <div className="text-2xl font-black text-cyan-400">#{fetchCycleCount}</div>
              <div className="text-[10px] text-slate-500">Every ~8s live heartbeat</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Last Fetch Latency</div>
              <div className="text-2xl font-black text-emerald-400">
                {fetchSummary?.latencyMs ? `${fetchSummary.latencyMs}ms` : '--'}
              </div>
              <div className="text-[10px] text-slate-500">
                Status: {fetchSummary?.status || 'IDLE'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Games Synced</div>
              <div className="text-2xl font-black text-white">{games.length}</div>
              <div className="text-[10px] text-slate-500">Week 6 Live Board</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Status Classification</div>
              <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-bold">
                  {statusCounts.inProgress} Live
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500 text-cyan-300 font-bold">
                  {statusCounts.upcoming} Upcoming
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-bold">
                  {statusCounts.completed} Final
                </span>
              </div>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase font-mono">Filter by Status:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({statusCounts.all})
                </button>
                <button
                  onClick={() => setStatusFilter('UPCOMING')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'UPCOMING'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-850'
                  }`}
                >
                  <span>📅 Upcoming</span>
                  <span>({statusCounts.upcoming})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('IN_PROGRESS')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'IN_PROGRESS'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-850'
                  }`}
                >
                  <span>⚡ In Progress</span>
                  <span>({statusCounts.inProgress})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('COMPLETED')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'COMPLETED'
                      ? 'bg-slate-300 text-slate-950 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <span>✓ Completed</span>
                  <span>({statusCounts.completed})</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Source: <span className="text-cyan-400 font-bold">{fetchSummary?.source || 'ESPN NFL Scoreboard'}</span>
            </div>
          </div>

          {/* Current Slate Game Status Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Active Slate Status Verification Matrix ({games.length} games)</span>
              <span className="text-[11px] text-slate-400 normal-case">Strict prevention of historical game leak</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">
                      {game.awayTeam.abbr} @ {game.homeTeam.abbr}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {game.scheduledTime}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <GameStatusBadge game={game} size="xs" showIcon />
                    {game.scores && (game.scores.home > 0 || game.scores.away > 0) && (
                      <span className="font-mono text-[11px] text-slate-300">
                        {game.scores.away}-{game.scores.home}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Fetch Cycle Audit Log */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Real-Time API Fetch Cycle History ({apiFetchLogs.length} events logged)
              </h4>
              {apiFetchLogs.length > 0 && (
                <button
                  onClick={clearApiFetchLogs}
                  className="text-[11px] text-slate-400 hover:text-rose-400 font-mono transition-colors cursor-pointer"
                >
                  Clear Log
                </button>
              )}
            </div>

            <div className="border border-slate-800 rounded-2xl bg-slate-950 p-2 max-h-56 overflow-y-auto font-mono text-[11px] space-y-1.5">
              {apiFetchLogs.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  Initializing live API poller... first cycle logs will appear shortly.
                </div>
              ) : (
                apiFetchLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      log.status === 'SUCCESS'
                        ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                        : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                            : 'bg-rose-950 border border-rose-600 text-rose-300'
                        }`}
                      >
                        Cycle #{log.cycle}
                      </span>
                      <span className="text-slate-400">{log.localTime}</span>
                      <span className="text-slate-500">&bull;</span>
                      <span className="text-white font-medium">{log.message}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 shrink-0 text-[10px]">
                      <span>{log.durationMs}ms</span>
                      <span>&bull;</span>
                      <span className="text-emerald-400 font-bold">{log.inProgressCount} Live</span>
                      <span>&bull;</span>
                      <span className="text-cyan-400 font-bold">{log.upcomingCount} Upcoming</span>
                      <span>&bull;</span>
                      <span className="text-slate-400">{log.completedCount} Final</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetry endpoint: <code className="text-cyan-300">/api/edgedetect/live/games</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  );
};
