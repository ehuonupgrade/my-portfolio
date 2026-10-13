import React, { useState, useEffect } from 'react';
import { playKeyClick, playSuccessChime } from '../utils/audio';

export interface AlertLogItem {
  id: string;
  phoneNumber?: string;
  alertTitle: string;
  matchup: string;
  movementSummary: string;
  riskWarnings: string[];
  actionRecommendation: string;
  formattedText?: string;
  sentAt: string;
  status: string;
  carrierResponse?: string;
}

interface AlertHistoryLogViewerProps {
  onBackToBoard?: () => void;
}

export const AlertHistoryLogViewer: React.FC<AlertHistoryLogViewerProps> = ({
  onBackToBoard,
}) => {
  const [logs, setLogs] = useState<AlertLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<AlertLogItem | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchLogs = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/edgedetect/alerts/sms/history').catch(() => fetch('/api/linepulse/alerts/sms/history').catch(() => null));
      if (res && res.ok) {
        const data = await res.json();
        if (data.logs) {
          setLogs(data.logs);
          if (!selectedLog && data.logs.length > 0) {
            setSelectedLog(data.logs[0]);
          }
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      log.alertTitle.toLowerCase().includes(q) ||
      log.matchup.toLowerCase().includes(q) ||
      (log.movementSummary && log.movementSummary.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn font-mono text-slate-100">
      {/* Top Banner & Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {onBackToBoard && (
                <button
                  onClick={onBackToBoard}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>&larr;</span>
                  <span>Odds Board</span>
                </button>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wider">
                AUDIT LOG &amp; ARCHIVE
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Historical Line &amp; Money Movement Alerts</span>
              <span className="text-xs font-normal text-slate-400 font-sans">
                ({logs.length} logged dispatches)
              </span>
            </h2>
            <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-3xl">
              Permanent archive of all sudden line threshold trips, whale money divergence alerts, and risk advisories sent to your background mobile receiver. User contact information is protected and masked from the web display.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                playKeyClick();
                fetchLogs();
              }}
              disabled={refreshing}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
              <span>{refreshing ? 'Syncing...' : 'Refresh Logs'}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search historical alerts by matchup, team, or title..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
          <span className="text-[11px] text-slate-400">
            Showing {filteredLogs.length} of {logs.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          <div className="animate-spin inline-block text-2xl mb-2">🔄</div>
          <div>Loading historical alert dispatches...</div>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="text-3xl">📭</div>
          <div className="text-white font-bold text-base">No Historical Alerts Yet</div>
          <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
            Background line movement alerts will appear here as soon as syndicate steam or line shifts trip the automatic detection threshold.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Historical List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between px-1">
              <span>Logged Dispatches</span>
              <span className="text-[10px] text-emerald-400">● Live Background Feed</span>
            </div>

            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {filteredLogs.map((item) => {
                const isSelected = selectedLog?.id === item.id;
                const dateObj = new Date(item.sentAt);
                const timeString = isNaN(dateObj.getTime())
                  ? item.sentAt
                  : `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      playKeyClick();
                      setSelectedLog(item);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/30'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-rose-400 font-bold flex items-center gap-1.5 truncate">
                        <span>🚨</span>
                        <span>{item.matchup}</span>
                      </span>
                      <span className="text-slate-400 text-[10px] shrink-0 font-sans">
                        {timeString}
                      </span>
                    </div>

                    <div className="text-white font-bold text-xs line-clamp-2">
                      {item.alertTitle}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span className="text-emerald-400 font-bold">
                        ✓ {item.status || 'DELIVERED'}
                      </span>
                      <span className="text-slate-500 font-sans">
                        Channel: Mobile Push / SMS
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Log Detail & Phone Preview */}
          <div className="lg:col-span-7 space-y-4">
            {selectedLog ? (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase">
                        ALERT AUDIT RECORD #{selectedLog.id}
                      </span>
                      <span className="text-emerald-400 text-xs font-bold">
                        ● Delivered to Registered Mobile Recipient
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {selectedLog.alertTitle}
                    </h3>
                    <div className="text-xs text-slate-400 font-sans">
                      Matchup: <strong className="text-slate-200">{selectedLog.matchup}</strong> &bull; Dispatched at{' '}
                      {new Date(selectedLog.sentAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Movement Breakdown */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block">
                    Detected Movement Details:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {selectedLog.movementSummary}
                  </p>
                </div>

                {/* Risk Advisories */}
                {selectedLog.riskWarnings && selectedLog.riskWarnings.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2.5">
                    <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>Risk Factors Flagged in Dispatch ({selectedLog.riskWarnings.length}):</span>
                    </span>
                    <div className="space-y-1.5">
                      {selectedLog.riskWarnings.map((risk, i) => (
                        <div key={i} className="text-xs text-slate-300 font-sans flex items-start gap-2">
                          <span className="text-amber-400 font-mono text-[11px] font-bold">{i + 1})</span>
                          <span>{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Action */}
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-1.5">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
                    🎯 Prescribed Strategic Action:
                  </span>
                  <div className="text-xs text-emerald-200 font-bold font-sans leading-relaxed">
                    {selectedLog.actionRecommendation}
                  </div>
                </div>

                {/* Exact Message Received on Phone (Masked Private Carrier View) */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-rose-300 flex items-center gap-1.5">
                      <span>📱</span>
                      <span>Exact Text Message Received on Private Mobile</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Recipient Privacy Protected
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-950 border-2 border-slate-800 p-4 font-sans text-xs space-y-2">
                    <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span>FROM: EDGEDETECT-SHARP-GATEWAY</span>
                      <span>DELIVERY: CONFIRMED</span>
                    </div>
                    <pre className="text-slate-200 text-xs whitespace-pre-wrap font-sans leading-relaxed">
                      {selectedLog.formattedText || selectedLog.movementSummary}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                Select an alert from the historical list to inspect its dispatch telemetry.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
