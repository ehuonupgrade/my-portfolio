import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  ComposedChart,
} from 'recharts';
import { playKeyClick, playSuccessChime } from '../utils/audio';

export type StrategyKey =
  | 'ALL'
  | 'SINGLE_GAME'
  | 'PARLAY_3LEG'
  | 'TEASER_3TEAM_10'
  | 'TEASER_4TEAM_13'
  | 'PRIME_1GAME'
  | 'CONTRARIAN_FADE';

export interface SlateHistoricalDataPoint {
  slateId: string;
  dateLabel: string;
  shortDate: string;
  // Cumulative units for each strategy
  cumUnitsAll: number;
  cumUnitsSingle: number;
  cumUnitsParlay: number;
  cumUnitsTeaser10: number;
  cumUnitsTeaser13: number;
  cumUnitsPrime: number;
  cumUnitsContrarian: number;
  // Slate-level wins / losses
  slateWins: number;
  slateLosses: number;
  slatePushes: number;
  slateNetUnits: number;
  cumulativeWinRate: number;
}

export const HISTORICAL_PERFORMANCE_SLATES: SlateHistoricalDataPoint[] = [
  {
    slateId: 'slate-01',
    dateLabel: 'Slate 1 (Sep 20)',
    shortDate: 'Sep 20',
    cumUnitsAll: 2.1,
    cumUnitsSingle: 0.91,
    cumUnitsParlay: -0.75,
    cumUnitsTeaser10: 1.25,
    cumUnitsTeaser13: 1.0,
    cumUnitsPrime: 1.25,
    cumUnitsContrarian: 0.91,
    slateWins: 4,
    slateLosses: 1,
    slatePushes: 0,
    slateNetUnits: 2.1,
    cumulativeWinRate: 80.0,
  },
  {
    slateId: 'slate-02',
    dateLabel: 'Slate 2 (Sep 24)',
    shortDate: 'Sep 24',
    cumUnitsAll: 3.8,
    cumUnitsSingle: 1.82,
    cumUnitsParlay: -1.5,
    cumUnitsTeaser10: 2.5,
    cumUnitsTeaser13: 2.0,
    cumUnitsPrime: 2.15,
    cumUnitsContrarian: 1.82,
    slateWins: 4,
    slateLosses: 1,
    slatePushes: 0,
    slateNetUnits: 1.7,
    cumulativeWinRate: 80.0,
  },
  {
    slateId: 'slate-03',
    dateLabel: 'Slate 3 (Sep 27)',
    shortDate: 'Sep 27',
    cumUnitsAll: 2.9,
    cumUnitsSingle: 0.82,
    cumUnitsParlay: -2.25,
    cumUnitsTeaser10: 3.75,
    cumUnitsTeaser13: 3.0,
    cumUnitsPrime: 1.15,
    cumUnitsContrarian: 0.82,
    slateWins: 2,
    slateLosses: 2,
    slatePushes: 1,
    slateNetUnits: -0.9,
    cumulativeWinRate: 71.4,
  },
  {
    slateId: 'slate-04',
    dateLabel: 'Slate 4 (Oct 01)',
    shortDate: 'Oct 01',
    cumUnitsAll: 7.2,
    cumUnitsSingle: 1.73,
    cumUnitsParlay: 2.35, // +540 Parlay hit!
    cumUnitsTeaser10: 5.0,
    cumUnitsTeaser13: 4.0,
    cumUnitsPrime: 2.4,
    cumUnitsContrarian: 1.73,
    slateWins: 5,
    slateLosses: 0,
    slatePushes: 0,
    slateNetUnits: 4.3,
    cumulativeWinRate: 78.9,
  },
  {
    slateId: 'slate-05',
    dateLabel: 'Slate 5 (Oct 04)',
    shortDate: 'Oct 04',
    cumUnitsAll: 8.9,
    cumUnitsSingle: 2.64,
    cumUnitsParlay: 1.6,
    cumUnitsTeaser10: 6.25,
    cumUnitsTeaser13: 5.0,
    cumUnitsPrime: 3.65,
    cumUnitsContrarian: 2.64,
    slateWins: 4,
    slateLosses: 1,
    slatePushes: 0,
    slateNetUnits: 1.7,
    cumulativeWinRate: 79.2,
  },
  {
    slateId: 'slate-06',
    dateLabel: 'Slate 6 (Oct 07)',
    shortDate: 'Oct 07',
    cumUnitsAll: 7.8,
    cumUnitsSingle: 1.64,
    cumUnitsParlay: 0.85,
    cumUnitsTeaser10: 5.05,
    cumUnitsTeaser13: 6.0,
    cumUnitsPrime: 2.4,
    cumUnitsContrarian: 2.64,
    slateWins: 3,
    slateLosses: 2,
    slatePushes: 0,
    slateNetUnits: -1.1,
    cumulativeWinRate: 75.9,
  },
  {
    slateId: 'slate-07',
    dateLabel: 'Slate 7 (Oct 09)',
    shortDate: 'Oct 09',
    cumUnitsAll: 11.2,
    cumUnitsSingle: 2.55,
    cumUnitsParlay: 4.9, // Another parlay hit!
    cumUnitsTeaser10: 6.3,
    cumUnitsTeaser13: 7.0,
    cumUnitsPrime: 3.65,
    cumUnitsContrarian: 3.55,
    slateWins: 5,
    slateLosses: 0,
    slatePushes: 0,
    slateNetUnits: 3.4,
    cumulativeWinRate: 79.4,
  },
  {
    slateId: 'slate-08',
    dateLabel: 'Slate 8 (Oct 11)',
    shortDate: 'Oct 11',
    cumUnitsAll: 13.5,
    cumUnitsSingle: 3.46,
    cumUnitsParlay: 4.15,
    cumUnitsTeaser10: 7.55,
    cumUnitsTeaser13: 8.0,
    cumUnitsPrime: 4.9,
    cumUnitsContrarian: 4.46,
    slateWins: 4,
    slateLosses: 1,
    slatePushes: 0,
    slateNetUnits: 2.3,
    cumulativeWinRate: 80.0,
  },
  {
    slateId: 'slate-09',
    dateLabel: 'Slate 9 (Today Oct 12)',
    shortDate: 'Oct 12',
    cumUnitsAll: 15.6,
    cumUnitsSingle: 4.37,
    cumUnitsParlay: 8.2, // Tonight Buffalo + Under + Dodgers (+4.05u)
    cumUnitsTeaser10: 8.8,
    cumUnitsTeaser13: 9.0,
    cumUnitsPrime: 7.15,
    cumUnitsContrarian: 5.37,
    slateWins: 5,
    slateLosses: 0,
    slatePushes: 0,
    slateNetUnits: 2.1,
    cumulativeWinRate: 82.2,
  },
];

export interface StrategyBenchmarkMeta {
  key: StrategyKey;
  label: string;
  color: string;
  record: string;
  winRatePct: number;
  breakEvenPct: number;
  edgePct: number;
  totalUnits: number;
  roiPct: number;
  description: string;
}

export const STRATEGY_BENCHMARKS: StrategyBenchmarkMeta[] = [
  {
    key: 'SINGLE_GAME',
    label: '1 Single Game Straight',
    color: '#06b6d4', // Cyan
    record: '7-2 (77.8%)',
    winRatePct: 77.8,
    breakEvenPct: 52.4,
    edgePct: 25.4,
    totalUnits: 4.37,
    roiPct: 48.6,
    description: 'Whale money divergence & road/home underdog hook exploitation (+3.5)',
  },
  {
    key: 'PARLAY_3LEG',
    label: '1 3-Leg Value Parlay',
    color: '#a855f7', // Purple
    record: '3-6 (33.3%)',
    winRatePct: 33.3,
    breakEvenPct: 15.6, // +540 payout break-even is ~15.6%
    edgePct: 17.7,
    totalUnits: 8.2,
    roiPct: 121.5,
    description: 'Intra-game correlated ground pace paired with high-probability moneyline leverage (+540)',
  },
  {
    key: 'TEASER_3TEAM_10',
    label: '1 3-Team +10 Teaser',
    color: '#10b981', // Emerald
    record: '8-1 (88.9%)',
    winRatePct: 88.9,
    breakEvenPct: 54.5, // -120 payout break-even
    edgePct: 34.4,
    totalUnits: 8.8,
    roiPct: 65.2,
    description: 'Pushing lines across key scoring margins (3, 7, 10) spanning 2 days in 7-day schedule',
  },
  {
    key: 'TEASER_4TEAM_13',
    label: '1 4-Team +13 Monster Teaser',
    color: '#f59e0b', // Amber
    record: '9-0 (100.0%)',
    winRatePct: 100.0,
    breakEvenPct: 57.4, // -135 payout break-even
    edgePct: 42.6,
    totalUnits: 9.0,
    roiPct: 74.1,
    description: 'Double-digit safety cushions exceeding two converted touchdowns (+16.5 and +10.5)',
  },
  {
    key: 'PRIME_1GAME',
    label: 'Prime 1-Game Blueprint',
    color: '#3b82f6', // Blue
    record: '7-2 (77.8%)',
    winRatePct: 77.8,
    breakEvenPct: 52.4,
    edgePct: 25.4,
    totalUnits: 7.15,
    roiPct: 63.6,
    description: 'Single highest conviction matchup with coordinated 3-tier correlated game flow',
  },
  {
    key: 'CONTRARIAN_FADE',
    label: 'Contrarian Consensus Fade',
    color: '#f43f5e', // Rose
    record: '6-2 (75.0%)',
    winRatePct: 75.0,
    breakEvenPct: 52.4,
    edgePct: 22.6,
    totalUnits: 5.37,
    roiPct: 59.7,
    description: 'Fading 75%+ mainstream TV media analyst & public groupthink echo chambers',
  },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl font-mono text-xs space-y-1.5 z-50">
        <div className="text-slate-300 font-bold border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
          <span>{label}</span>
          <span className="text-[10px] text-cyan-400 font-mono">Performance Metric</span>
        </div>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-white">
                {typeof entry.value === 'number'
                  ? entry.value > 0 && !entry.name.includes('%')
                    ? `+${entry.value.toFixed(2)}u`
                    : entry.name.includes('%')
                    ? `${entry.value.toFixed(1)}%`
                    : `${entry.value.toFixed(2)}u`
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface BettingPerformanceChartsProps {
  onBackToBoard?: () => void;
}

export const BettingPerformanceCharts: React.FC<BettingPerformanceChartsProps> = ({ onBackToBoard }) => {
  const [activeChartType, setActiveChartType] = useState<'cumulative' | 'edge' | 'distribution'>('cumulative');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyKey>('ALL');
  const [showSimulatedOct12, setShowSimulatedOct12] = useState<boolean>(true);

  // Filtered dataset depending on whether simulated Oct 12 is toggled
  const chartData = useMemo(() => {
    if (showSimulatedOct12) {
      return HISTORICAL_PERFORMANCE_SLATES;
    }
    return HISTORICAL_PERFORMANCE_SLATES.slice(0, -1);
  }, [showSimulatedOct12]);

  const activeBenchmark = useMemo(() => {
    if (selectedStrategy === 'ALL') return null;
    return STRATEGY_BENCHMARKS.find((b) => b.key === selectedStrategy) || null;
  }, [selectedStrategy]);

  // Aggregate stats
  const totalCumUnits = useMemo(() => {
    const last = chartData[chartData.length - 1];
    if (selectedStrategy === 'SINGLE_GAME') return last.cumUnitsSingle;
    if (selectedStrategy === 'PARLAY_3LEG') return last.cumUnitsParlay;
    if (selectedStrategy === 'TEASER_3TEAM_10') return last.cumUnitsTeaser10;
    if (selectedStrategy === 'TEASER_4TEAM_13') return last.cumUnitsTeaser13;
    if (selectedStrategy === 'PRIME_1GAME') return last.cumUnitsPrime;
    if (selectedStrategy === 'CONTRARIAN_FADE') return last.cumUnitsContrarian;
    return last.cumUnitsAll;
  }, [chartData, selectedStrategy]);

  const totalWins = useMemo(() => chartData.reduce((acc, s) => acc + s.slateWins, 0), [chartData]);
  const totalLosses = useMemo(() => chartData.reduce((acc, s) => acc + s.slateLosses, 0), [chartData]);
  const overallWinRate = useMemo(() => {
    const total = totalWins + totalLosses;
    return total > 0 ? ((totalWins / total) * 100).toFixed(1) : '0.0';
  }, [totalWins, totalLosses]);

  return (
    <div className="space-y-6 font-mono text-slate-100">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {onBackToBoard && (
                <button
                  onClick={onBackToBoard}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>&larr;</span>
                  <span>Back to Live Board</span>
                </button>
              )}
              <span className="text-xs text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>RECHARTS PERFORMANCE VISUALIZATION &bull; HISTORICAL TRENDS</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5 flex-wrap">
              <span>Betting Strategy Performance Trends</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-bold">
                +{totalCumUnits.toFixed(2)} Units Net ROI
              </span>
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-4xl">
              Interactive historical trend analysis tracking cumulative unit bankroll growth, win rate % margins above break-even, and decision volumes across all 6 core LinePulse algorithmic strategies.
            </p>
          </div>

          {/* Quick Metrics KPI Pod */}
          <div className="flex items-center gap-2 font-mono text-xs shrink-0">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[90px]">
              <div className="text-[10px] text-slate-400 uppercase">Total Profit</div>
              <div className="text-emerald-400 font-bold text-base">+{totalCumUnits.toFixed(2)}u</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[90px]">
              <div className="text-[10px] text-slate-400 uppercase">Win Rate</div>
              <div className="text-cyan-400 font-bold text-base">{overallWinRate}%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[90px]">
              <div className="text-[10px] text-slate-400 uppercase">W - L Rec</div>
              <div className="text-white font-bold text-base">{totalWins}W - {totalLosses}L</div>
            </div>
          </div>
        </div>

        {/* Chart View Switcher and Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                playKeyClick();
                setActiveChartType('cumulative');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeChartType === 'cumulative'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>📈</span>
              <span>Cumulative Unit Profit Curve</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setActiveChartType('edge');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeChartType === 'edge'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>⚖️</span>
              <span>Win Rate vs Break-Even (+EV Edge)</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setActiveChartType('distribution');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeChartType === 'distribution'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>📊</span>
              <span>Slate Decision Distribution (W/L/P)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showSimulatedOct12}
                onChange={(e) => {
                  playKeyClick();
                  setShowSimulatedOct12(e.target.checked);
                }}
                className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Include Oct 12 Projected Slate</span>
            </label>
          </div>
        </div>
      </div>

      {/* Strategy Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-500 uppercase text-[11px] font-bold shrink-0">Filter Strategy:</span>
        <button
          onClick={() => {
            playKeyClick();
            setSelectedStrategy('ALL');
          }}
          className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 ${
            selectedStrategy === 'ALL'
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          🌟 All Strategies Combined (+15.60u)
        </button>

        {STRATEGY_BENCHMARKS.map((strat) => (
          <button
            key={strat.key}
            onClick={() => {
              playKeyClick();
              setSelectedStrategy(strat.key);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              selectedStrategy === strat.key
                ? 'text-slate-950 font-extrabold shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
            style={{
              backgroundColor: selectedStrategy === strat.key ? strat.color : undefined,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedStrategy === strat.key ? '#020617' : strat.color }}
            />
            <span>{strat.label}</span>
            <span className="text-[10px] opacity-80">({strat.record})</span>
          </button>
        ))}
      </div>

      {/* MAIN RECHARTS VISUALIZATION CONTAINER */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        {/* CHART 1: CUMULATIVE PROFIT CURVE */}
        {activeChartType === 'cumulative' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📈 Cumulative Unit Profit Growth Trajectory</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({selectedStrategy === 'ALL' ? 'Combined Portfolio' : activeBenchmark?.label})
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Tracks net bankroll trajectory in Units (+U) across chronological slates since launch.
                </p>
              </div>

              <div className="text-xs text-emerald-400 font-mono font-bold">
                Max Peak: +{totalCumUnits.toFixed(2)} Units
              </div>
            </div>

            <div className="h-[340px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="singleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="parlayGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="teaser10Gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="teaser13Gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="shortDate"
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
                    tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}u`}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />

                  {selectedStrategy === 'ALL' && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="cumUnitsAll"
                        name="Total Portfolio"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#profitGradient)"
                      />
                      <Line
                        type="monotone"
                        dataKey="cumUnitsTeaser13"
                        name="+13 Monster Teaser"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumUnitsTeaser10"
                        name="+10 Teaser"
                        stroke="#14b8a6"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumUnitsSingle"
                        name="Single Game Straight"
                        stroke="#06b6d4"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumUnitsParlay"
                        name="3-Leg Value Parlay"
                        stroke="#a855f7"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </>
                  )}

                  {selectedStrategy === 'SINGLE_GAME' && (
                    <Area
                      type="monotone"
                      dataKey="cumUnitsSingle"
                      name="Single Game Straight"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#singleGradient)"
                    />
                  )}

                  {selectedStrategy === 'PARLAY_3LEG' && (
                    <Area
                      type="monotone"
                      dataKey="cumUnitsParlay"
                      name="3-Leg Value Parlay"
                      stroke="#a855f7"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#parlayGradient)"
                    />
                  )}

                  {selectedStrategy === 'TEASER_3TEAM_10' && (
                    <Area
                      type="monotone"
                      dataKey="cumUnitsTeaser10"
                      name="+10 Super Teaser"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#teaser10Gradient)"
                    />
                  )}

                  {selectedStrategy === 'TEASER_4TEAM_13' && (
                    <Area
                      type="monotone"
                      dataKey="cumUnitsTeaser13"
                      name="+13 Monster Teaser"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#teaser13Gradient)"
                    />
                  )}

                  {selectedStrategy === 'PRIME_1GAME' && (
                    <Area
                      type="monotone"
                      dataKey="cumUnitsPrime"
                      name="Prime 1-Game Blueprint"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#singleGradient)"
                    />
                  )}

                  {selectedStrategy === 'CONTRARIAN_FADE' && (
                    <Area
                      type="monotone"
                      dataKey="cumUnitsContrarian"
                      name="Contrarian Consensus Fade"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#parlayGradient)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 2: WIN RATE VS BREAK-EVEN (+EV EDGE) */}
        {activeChartType === 'edge' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>⚖️ Strategy Win Rate % vs. Mathematical Break-Even Threshold</span>
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Compares realized hit rate against the required win percentage needed to break even after bookmaker vigorish.
                </p>
              </div>
              <div className="text-xs text-cyan-400 font-mono">
                Standard -110 Break-Even: <strong>52.4%</strong>
              </div>
            </div>

            <div className="h-[340px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={STRATEGY_BENCHMARKS}
                  margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
                  barCategoryGap={16}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    interval={0}
                    tickFormatter={(val) => val.split(' ')[1] || val}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <ReferenceLine
                    y={52.4}
                    stroke="#f43f5e"
                    strokeDasharray="3 3"
                    label={{ value: '52.4% Break-Even (-110)', fill: '#f43f5e', fontSize: 10, position: 'top' }}
                  />

                  <Bar dataKey="winRatePct" name="Actual Win Rate %" radius={[6, 6, 0, 0]}>
                    {STRATEGY_BENCHMARKS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="breakEvenPct"
                    name="Break-Even Threshold %"
                    fill="#334155"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 3: SLATE DECISION DISTRIBUTION */}
        {activeChartType === 'distribution' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📊 Slate Decision Distribution (Wins, Losses, Pushes)</span>
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Visual breakdown of bet outcomes across individual slates to inspect streak volatility.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Wins
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Losses
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Pushes
                </span>
              </div>
            </div>

            <div className="h-[340px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="shortDate"
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
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="slateWins" name="Wins" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="slateLosses" name="Losses" stackId="a" fill="#f43f5e" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="slatePushes" name="Pushes" stackId="a" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* STRATEGY KPI SCORECARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {STRATEGY_BENCHMARKS.map((strat) => {
          const isSelected = selectedStrategy === strat.key;
          return (
            <div
              key={strat.key}
              onClick={() => {
                playKeyClick();
                setSelectedStrategy(strat.key);
                setActiveChartType('cumulative');
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                isSelected
                  ? 'bg-slate-900 border-2 shadow-lg shadow-cyan-950/20'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
              style={{
                borderColor: isSelected ? strat.color : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: strat.color }} />
                  <span className="font-bold text-white text-sm">{strat.label}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 bg-slate-900 border border-slate-800">
                  +{strat.totalUnits.toFixed(2)}u
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Record</span>
                  <span className="font-bold text-white">{strat.record}</span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Hit Rate</span>
                  <span className="font-bold text-emerald-400">{strat.winRatePct}%</span>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">+EV Edge</span>
                  <span className="font-bold text-cyan-400">+{strat.edgePct.toFixed(1)}%</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                {strat.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
