import React, { useState, useEffect } from 'react';
import { fetchGlobalTrafficSummary, SiteTrafficSummary, resetTrafficData } from '../utils/trafficTracker';
import { playKeyClick } from '../utils/audio';

export const TrafficAnalyticsCard: React.FC = () => {
  const [summary, setSummary] = useState<SiteTrafficSummary>({
    totalPageViews: 0,
    totalSessions: 0,
    firstTrackedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    projects: {},
    pageViewsByRoute: {},
  });
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const loadData = async () => {
    const data = await fetchGlobalTrafficSummary();
    setSummary(data);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('site_traffic_updated', handleUpdate);
    const interval = setInterval(loadData, 10000); // Polling every 10s for live global counts
    return () => {
      window.removeEventListener('site_traffic_updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const projectList = Object.values(summary.projects).sort((a, b) => {
    // Sort by views first, then dwell time
    if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
    return b.totalDwellSeconds - a.totalDwellSeconds;
  });

  const totalProjectViews = projectList.reduce((acc, p) => acc + p.viewCount, 0);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <div>
            <h3 className="font-bold text-white text-sm">Project Attention &amp; Traffic Tracker</h3>
            <p className="text-[10px] text-slate-400">
              Anonymized, privacy-first telemetry for development staff &amp; site owner.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-600/70 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ACTIVE TRACKER</span>
          </span>
          <button
            onClick={() => {
              playKeyClick();
              setIsExpanded(!isExpanded);
            }}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Top Level Aggregate Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
              <div className="text-[9px] text-slate-500 uppercase">Total Page Views</div>
              <div className="text-white font-bold text-base">{summary.totalPageViews}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
              <div className="text-[9px] text-slate-500 uppercase">Project Impressions</div>
              <div className="text-emerald-400 font-bold text-base">{totalProjectViews}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
              <div className="text-[9px] text-slate-500 uppercase">Unique Sessions</div>
              <div className="text-cyan-400 font-bold text-base">{summary.totalSessions}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
              <div className="text-[9px] text-slate-500 uppercase">Top Project Rank</div>
              <div className="text-yellow-400 font-bold text-base truncate">
                {projectList[0]?.name.split(' ')[0] || 'None'}
              </div>
            </div>
          </div>

          {/* Project Breakdown Table */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Project Popularity &amp; Engagement Breakdown:
            </div>
            <div className="space-y-2">
              {projectList.map((proj, idx) => {
                const percent = totalProjectViews > 0
                  ? Math.round((proj.viewCount / totalProjectViews) * 100)
                  : 0;

                return (
                  <div
                    key={proj.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-white font-bold truncate">{proj.name}</span>
                        <span className="text-[10px] text-slate-500 hidden sm:inline">({proj.category})</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-emerald-400 font-bold">
                          {proj.viewCount} {proj.viewCount === 1 ? 'view' : 'views'} ({percent}%)
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          ⏱ {formatDuration(proj.totalDwellSeconds)}
                        </span>
                      </div>
                    </div>

                    {/* Progress attention bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(percent, proj.viewCount > 0 ? 5 : 0)}%` }}
                      />
                    </div>

                    {/* Device distribution & last visit */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span>
                        📱 Mobile: {proj.mobileViews} &bull; 💻 Desktop: {proj.desktopViews}
                      </span>
                      <span>
                        {proj.lastVisitedAt
                          ? `Last viewed: ${new Date(proj.lastVisitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Not visited yet this session'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 text-[10px] text-slate-500">
            <span>
              🔒 Zero Cookies &bull; No Personal Identifiers &bull; Client-Side Aggregation
            </span>
            <button
              onClick={() => {
                playKeyClick();
                if (confirm('Reset anonymized traffic telemetry data to 0?')) {
                  resetTrafficData();
                }
              }}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Reset Counter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
