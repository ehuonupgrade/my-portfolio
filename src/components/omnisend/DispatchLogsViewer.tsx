import React, { useState } from 'react';
import { DispatchLogEntry } from '../../types/messaging';

interface DispatchLogsViewerProps {
  logs: DispatchLogEntry[];
  onClearLogs: () => void;
  onRetryDispatch: (log: DispatchLogEntry) => void;
}

export const DispatchLogsViewer: React.FC<DispatchLogsViewerProps> = ({
  logs,
  onClearLogs,
  onRetryDispatch,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterChannel, setFilterChannel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLogForJson, setSelectedLogForJson] = useState<DispatchLogEntry | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;
    const matchesChannel = filterChannel === 'ALL' || log.channel === filterChannel;
    const matchesQuery =
      !searchQuery ||
      log.recipientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.payload?.content?.text || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesChannel && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold mb-0.5">
            <span>REAL-TIME AUDIT LOGS</span>
            <span>·</span>
            <span>DISPATCH HISTORY</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Gateway Dispatch Log Inspector &amp; Payload Audit
          </h2>
          <p className="text-xs text-slate-400">
            Monitor real-time delivery statuses, inspect raw JSON payloads, latencies, and retry dispatches.
          </p>
        </div>

        <button
          onClick={onClearLogs}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs font-mono text-slate-300 transition-colors cursor-pointer shrink-0"
        >
          Clear Audit Logs
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="SUCCESS">Status: Success Only</option>
            <option value="FAILED">Status: Failed Only</option>
          </select>

          {/* Channel Filter */}
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">Channel: All</option>
            <option value="facebook_messenger">Facebook Messenger</option>
            <option value="slack">Slack</option>
            <option value="telegram">Telegram</option>
            <option value="twilio_sms">Twilio SMS</option>
          </select>
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by PSID, App, text, or Log ID..."
          className="w-full md:w-72 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Client App</th>
                <th className="p-3.5">Channel</th>
                <th className="p-3.5">Recipient ID</th>
                <th className="p-3.5">Latency</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No dispatch log entries match your filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isSuccess
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        {log.appName}
                      </td>

                      <td className="p-3.5 text-cyan-300 whitespace-nowrap">
                        {log.channel.replace('_', ' ')}
                      </td>

                      <td className="p-3.5 text-slate-300 font-mono text-[11px] whitespace-nowrap max-w-[160px] truncate">
                        {log.recipientId}
                      </td>

                      <td className="p-3.5 text-slate-400 whitespace-nowrap">
                        {log.latencyMs}ms
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => setSelectedLogForJson(log)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-cyan-300 cursor-pointer transition-colors"
                        >
                          Inspect JSON
                        </button>

                        <button
                          onClick={() => onRetryDispatch(log)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-[10px] text-slate-200 cursor-pointer transition-colors"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Inspection Modal */}
      {selectedLogForJson && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Dispatch Log Inspection &bull; {selectedLogForJson.id}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {selectedLogForJson.appName} &bull; {selectedLogForJson.channel}
                </span>
              </div>
              <button
                onClick={() => setSelectedLogForJson(null)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1 font-mono text-xs">
              <div>
                <span className="text-slate-400 block mb-1 font-bold">Request Payload JSON:</span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedLogForJson.payload, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-bold">Provider Response JSON:</span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedLogForJson.result, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 shrink-0 flex justify-end">
              <button
                onClick={() => setSelectedLogForJson(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
