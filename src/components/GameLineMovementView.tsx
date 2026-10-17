import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { GameMarket } from '../types/sportsBetting';
import { analyzeGameLineMovement } from '../utils/lineMovementAnalyzer';
import { playKeyClick } from '../utils/audio';
import { GameStatusBadge } from './common/GameStatusBadge';

interface GameLineMovementViewProps {
  game: GameMarket;
  onClose?: () => void;
}

export const GameLineMovementView: React.FC<GameLineMovementViewProps> = ({ game, onClose }) => {
  const [metricTab, setMetricTab] = useState<'spread' | 'total' | 'moneyline'>('spread');

  // Analyze material line shift metrics
  const analysis = useMemo(() => analyzeGameLineMovement(game), [game]);

  const movements = game.lineMovements || [];

  // Format data points for Recharts
  const chartData = useMemo(() => {
    return movements.map((pt, index) => {
      return {
        stepIndex: index + 1,
        timeLabel: pt.timeLabel,
        timestamp: pt.timestamp,
        spread: pt.spread,
        total: pt.total,
        moneylineHome: pt.moneylineHome,
        note: pt.note || 'Market adjustment',
        isMaterial:
          index > 0 &&
          (Math.abs(pt.spread - movements[index - 1].spread) >= 0.5 ||
            Math.abs(pt.total - movements[index - 1].total) >= 1.0),
      };
    });
  }, [movements]);

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* 1. MATCHUP & MATERIAL MOVEMENT HEADER */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-2 shrink-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm border-2 border-slate-900 shadow-md"
                style={{ backgroundColor: game.awayTeam.logoColor || '#334155' }}
              >
                {game.awayTeam.abbr}
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm border-2 border-slate-900 shadow-md"
                style={{ backgroundColor: game.homeTeam.logoColor || '#0f172a' }}
              >
                {game.homeTeam.abbr}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-slate-400 flex-wrap">
                <span>{game.league}</span>
                <span>&bull;</span>
                <GameStatusBadge game={game} size="xs" showIcon />
                <span>{game.scheduledTime}</span>
                <span>&bull;</span>
                <span>{game.stadium}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-0.5">
                {game.awayTeam.city} {game.awayTeam.name} @ {game.homeTeam.city} {game.homeTeam.name}
              </h2>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-xs font-bold transition-colors cursor-pointer self-start md:self-auto"
            >
              ✕ Close Detail
            </button>
          )}
        </div>

        {/* MATERIAL LINE MOVEMENT ALERT CARD */}
        {analysis.hasMaterialMovement ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/60 via-amber-950/40 to-slate-900 border border-amber-500/60 shadow-lg space-y-3 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <span className="px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wide">
                  🚨 MATERIAL LINE MOVEMENT DETECTED
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {analysis.severity} SEVERITY SHIFT
                </span>
              </div>

              <div className="text-xs text-slate-300">
                Opening offering vs. current market consensus
              </div>
            </div>

            {/* Shift Metric Pods */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Spread Movement</span>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-400">
                    {analysis.openingPoint.spread > 0 ? `+${analysis.openingPoint.spread}` : analysis.openingPoint.spread}
                  </span>
                  <span className="text-slate-500">&rarr;</span>
                  <span className="text-cyan-300 text-sm">
                    {analysis.currentPoint.spread > 0 ? `+${analysis.currentPoint.spread}` : analysis.currentPoint.spread}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${analysis.spreadDelta !== 0 ? 'bg-amber-950 text-amber-300 border border-amber-700/60' : 'text-slate-500'}`}>
                    {analysis.spreadDelta > 0 ? `+${analysis.spreadDelta}` : analysis.spreadDelta} pts
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Over/Under Total Shift</span>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-400">{analysis.openingPoint.total}</span>
                  <span className="text-slate-500">&rarr;</span>
                  <span className="text-purple-300 text-sm">{analysis.currentPoint.total}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${analysis.totalDelta !== 0 ? 'bg-purple-950 text-purple-300 border border-purple-700/60' : 'text-slate-500'}`}>
                    {analysis.totalDelta > 0 ? `+${analysis.totalDelta}` : analysis.totalDelta} pts
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Home Moneyline Shift</span>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-400">
                    {analysis.openingPoint.moneylineHome > 0 ? `+${analysis.openingPoint.moneylineHome}` : analysis.openingPoint.moneylineHome}
                  </span>
                  <span className="text-slate-500">&rarr;</span>
                  <span className="text-emerald-300 text-sm">
                    {analysis.currentPoint.moneylineHome > 0 ? `+${analysis.currentPoint.moneylineHome}` : analysis.currentPoint.moneylineHome}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${analysis.moneylineDelta !== 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' : 'text-slate-500'}`}>
                    {analysis.moneylineDelta > 0 ? `+${analysis.moneylineDelta}` : analysis.moneylineDelta} cents
                  </span>
                </div>
              </div>
            </div>

            {/* Reasons List */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                Key Material Line Drivers:
              </span>
              <ul className="space-y-1 text-xs text-slate-200">
                {analysis.materialityReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0">&bull;</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Driver Note */}
            <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
              <span className="text-cyan-400 font-bold shrink-0">💡 Market Context:</span>
              <p className="leading-relaxed">{analysis.primaryDriverNote}</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/40 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="font-bold text-emerald-300 uppercase">STABLE MARKET LINE</span>
              <span className="text-slate-400">&bull; Minor line drift within standard limits (&lt;0.5 pts)</span>
            </div>
            <p className="text-slate-300 font-sans leading-relaxed">
              Line movement since offering release has remained balanced. Public and sharp money handles are in equilibrium with no major key number threshold crossings.
            </p>
          </div>
        )}
      </div>

      {/* 2. RECHARTS VISUAL TIMELINE CHART */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>📈 Line Movement Trajectory (Offering to Current)</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Visual history tracking line movement steps since the market was released.
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                playKeyClick();
                setMetricTab('spread');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                metricTab === 'spread'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏈 Spread
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setMetricTab('total');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                metricTab === 'total'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎯 Total (O/U)
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setMetricTab('moneyline');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                metricTab === 'moneyline'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💰 Moneyline
            </button>
          </div>
        </div>

        {/* Recharts Render */}
        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                domain={['auto', 'auto']}
                tickFormatter={(val) => {
                  if (metricTab === 'spread') return val > 0 ? `+${val}` : `${val}`;
                  if (metricTab === 'moneyline') return val > 0 ? `+${val}` : `${val}`;
                  return `${val}`;
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl font-mono text-xs space-y-1 z-50">
                        <div className="text-cyan-300 font-bold border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                          <span>{data.timeLabel}</span>
                          <span className="text-[10px] text-slate-400">{data.timestamp}</span>
                        </div>
                        <div className="space-y-0.5 text-slate-200 text-[11px] pt-1">
                          <div>
                            Spread: <strong className="text-cyan-300">{data.spread > 0 ? `+${data.spread}` : data.spread}</strong>
                          </div>
                          <div>
                            Total: <strong className="text-purple-300">{data.total}</strong>
                          </div>
                          <div>
                            Home ML: <strong className="text-emerald-400">{data.moneylineHome > 0 ? `+${data.moneylineHome}` : data.moneylineHome}</strong>
                          </div>
                          {data.note && (
                            <div className="text-[10px] text-amber-300 pt-1 border-t border-slate-800 mt-1 max-w-[220px]">
                              {data.note}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {metricTab === 'spread' && (
                <>
                  <ReferenceLine y={-3.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Key #3.0 Margin', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
                  <ReferenceLine y={3.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Key +3.0 Margin', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
                  <Line
                    type="monotone"
                    dataKey="spread"
                    name="Spread"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#06b6d4', stroke: '#020617', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#38bdf8' }}
                  />
                </>
              )}

              {metricTab === 'total' && (
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total (O/U)"
                  stroke="#a855f7"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#a855f7', stroke: '#020617', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#c084fc' }}
                />
              )}

              {metricTab === 'moneyline' && (
                <Line
                  type="monotone"
                  dataKey="moneylineHome"
                  name="Home Moneyline"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10b981', stroke: '#020617', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#34d399' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. MULTI-BOOKMARKET PRICE DISCREPANCY MATRIX */}
      {game.sportsbooks && game.sportsbooks.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🏢 Multi-Bookmaker Current Price Matrix</span>
              <span className="text-xs text-slate-400 font-normal">({game.sportsbooks.length} Books Tracked)</span>
            </h3>
            <span className="text-[11px] text-cyan-400">Live Odds Feed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {game.sportsbooks.map((book) => (
              <div key={book.bookName} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-white">{book.bookName}</span>
                  <span className="text-[10px] text-slate-500">{book.lastUpdated}</span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Spread:</span>
                    <strong className="text-cyan-300">
                      {game.awayTeam.abbr} {book.spreadAway > 0 ? `+${book.spreadAway}` : book.spreadAway} ({book.spreadAwayOdds})
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total:</span>
                    <strong className="text-purple-300">
                      O/U {book.totalOver} ({book.totalOverOdds})
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Moneyline:</span>
                    <strong className="text-emerald-400">
                      {game.homeTeam.abbr} {book.moneylineHome > 0 ? `+${book.moneylineHome}` : book.moneylineHome}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CHRONOLOGICAL LINE HISTORY AUDIT TABLE */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>📜 Complete Chronological Line Movement Audit Ledger</span>
          </h3>
          <span className="text-slate-400">{movements.length} Line Movement Points Recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="py-2 px-3">Step &amp; Time</th>
                <th className="py-2 px-3">Spread (Home)</th>
                <th className="py-2 px-3">Total (O/U)</th>
                <th className="py-2 px-3">Home ML</th>
                <th className="py-2 px-3">Driver / Trigger Rationale</th>
                <th className="py-2 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {movements.map((pt, idx) => {
                const prevPt = idx > 0 ? movements[idx - 1] : null;
                const spreadDiff = prevPt ? parseFloat((pt.spread - prevPt.spread).toFixed(1)) : 0;
                const isFirst = idx === 0;
                const isLast = idx === movements.length - 1;

                return (
                  <tr key={pt.timestamp || idx} className="hover:bg-slate-950/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div>{pt.timeLabel}</div>
                          <div className="text-[10px] text-slate-500">{isFirst ? 'Offering Release' : isLast ? 'Current Consensus' : 'Mid-Week Shift'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-cyan-300">
                        {pt.spread > 0 ? `+${pt.spread}` : pt.spread}
                      </div>
                      {spreadDiff !== 0 && (
                        <div className={`text-[10px] ${spreadDiff < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {spreadDiff > 0 ? `+${spreadDiff}` : spreadDiff} pts
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 font-bold text-purple-300 whitespace-nowrap">
                      {pt.total}
                    </td>

                    <td className="py-3 px-3 font-bold text-emerald-400 whitespace-nowrap">
                      {pt.moneylineHome > 0 ? `+${pt.moneylineHome}` : pt.moneylineHome}
                    </td>

                    <td className="py-3 px-3 text-slate-300 text-[11px] max-w-xs font-sans">
                      {pt.note || 'Market adjustment'}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {isFirst ? (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                          OFFERING
                        </span>
                      ) : isLast ? (
                        <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-600 text-cyan-300 text-[10px] font-bold">
                          CURRENT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-bold">
                          MATERIAL SHIFT
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
