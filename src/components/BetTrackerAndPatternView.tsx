import React, { useState, useMemo } from 'react';
import {
  TrackedBetRecommendation,
  BetOutcome,
  TrackedBetTier,
  PatternSignalType,
} from '../types/sportsBettingTracker';
import {
  getTrackedBets,
  updateBetStatus,
  simulateTonightOutcome,
  resetTrackedBetsToSeed,
  exportTrackedBetsToCSV,
} from '../utils/bettingTrackerStore';
import {
  calculatePerformanceSummary,
  calculateLearnedPatternSignals,
} from '../utils/bettingPatternEngine';
import { playKeyClick, playSuccessChime, playBeep } from '../utils/audio';

interface BetTrackerAndPatternViewProps {
  onBackToBoard?: () => void;
}

export const BetTrackerAndPatternView: React.FC<BetTrackerAndPatternViewProps> = ({
  onBackToBoard,
}) => {
  const [bets, setBets] = useState<TrackedBetRecommendation[]>(() => getTrackedBets());
  const [activeTab, setActiveTab] = useState<'ledger' | 'patterns' | 'teasers'>('ledger');
  const [filterStatus, setFilterStatus] = useState<BetOutcome | 'ALL'>('ALL');
  const [filterTier, setFilterTier] = useState<TrackedBetTier | 'ALL'>('ALL');
  const [editingBetId, setEditingBetId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<BetOutcome>('WON');
  const [editScore, setEditScore] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);

  // Performance summary & pattern engine calculations
  const summary = useMemo(() => calculatePerformanceSummary(bets), [bets]);
  const patternMetrics = useMemo(() => calculateLearnedPatternSignals(bets), [bets]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered bets
  const filteredBets = useMemo(() => {
    return bets.filter((b) => {
      if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;
      if (filterTier !== 'ALL' && b.tier !== filterTier) return false;
      return true;
    });
  }, [bets, filterStatus, filterTier]);

  // Handle manual status update
  const handleSaveStatus = (id: string) => {
    playSuccessChime();
    const updated = updateBetStatus(id, editStatus, editScore, editNote);
    setBets(updated);
    setEditingBetId(null);
    showToast(`Bet updated to ${editStatus}. Learned weights re-calculated!`);
  };

  // Handle simulation of tonight's Rams @ Bills slate
  const handleSimulateTonight = () => {
    playSuccessChime();
    const updated = simulateTonightOutcome();
    setBets(updated);
    showToast('Tonight Rams @ Bills simulated! Buffalo covered +3.5. Model auto-graded 5 bets and adapted future weights.');
  };

  // Handle reset to defaults
  const handleReset = () => {
    playBeep();
    if (window.confirm('Reset bet ledger back to verified historical recommendations?')) {
      const reset = resetTrackedBetsToSeed();
      setBets(reset);
      showToast('Ledger reset to baseline historical state.');
    }
  };

  // Handle CSV export
  const handleExportCSV = () => {
    playKeyClick();
    const csv = exportTrackedBetsToCSV(bets);
    navigator.clipboard.writeText(csv);
    setCopiedCsv(true);
    showToast('Bet ledger CSV copied to clipboard!');
    setTimeout(() => setCopiedCsv(false), 3000);
  };

  return (
    <div className="space-y-6 font-mono text-xs animate-fadeIn">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border border-emerald-500/80 shadow-2xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-xs">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Navigation */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 font-sans">
            <div className="flex items-center gap-2 flex-wrap">
              {onBackToBoard && (
                <button
                  onClick={onBackToBoard}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-mono"
                >
                  <span>&larr;</span>
                  <span>Back to Live Odds Board</span>
                </button>
              )}
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>ALGORITHMIC BET RECOMMENDATION TRACKER &bull; ADAPTIVE PATTERN AI</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Bet Performance &amp; Pattern Learning Engine
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-3xl">
              Tracks every recommendation across the 4 daily tiers (1 Single Game, 1 Parlay up to 3 bets, 1 3-team +10 tease, 1 4-team +13 tease) and Prime 1-Game blueprints. Analyzes wins and losses to isolate predictive edge patterns (whale handle divergence, high-wind unders, key number crosses) and dynamically updates selection weights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs shrink-0">
            <button
              onClick={handleSimulateTonight}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95"
            >
              <span>🎲</span>
              <span>Simulate Tonight &amp; Learn</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{copiedCsv ? '✓' : '📥'}</span>
              <span>{copiedCsv ? 'Copied CSV' : 'Export CSV'}</span>
            </button>
            <button
              onClick={handleReset}
              className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/50 text-slate-400 hover:text-red-400 font-bold transition-colors cursor-pointer"
              title="Reset ledger to default"
            >
              <span>↺</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <div className="text-[10px] text-slate-400 uppercase">Settled Record</div>
            <div className="text-white font-bold text-base flex items-center gap-1.5">
              <span className="text-emerald-400">{summary.wins}W</span>
              <span className="text-slate-500">-</span>
              <span className="text-red-400">{summary.losses}L</span>
              {summary.pushes > 0 && (
                <>
                  <span className="text-slate-500">-</span>
                  <span className="text-slate-400">{summary.pushes}P</span>
                </>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <div className="text-[10px] text-cyan-400 uppercase">Win Rate (ATS / EV)</div>
            <div className="text-cyan-300 font-bold text-base">{summary.winRate}%</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <div className="text-[10px] text-emerald-400 uppercase">Net Units Return</div>
            <div className={`font-bold text-base ${summary.netUnitsWon >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {summary.netUnitsWon >= 0 ? `+${summary.netUnitsWon}` : summary.netUnitsWon} Units
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <div className="text-[10px] text-yellow-400 uppercase">Return On Investment</div>
            <div className="text-yellow-300 font-bold text-base">+{summary.roi}% ROI</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <div className="text-[10px] text-purple-400 uppercase">Current Streak</div>
            <div className="text-purple-300 font-bold text-base">{summary.currentStreak}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-0.5">
            <div className="text-[10px] text-amber-400 uppercase">Pending Picks</div>
            <div className="text-amber-300 font-bold text-base">{summary.pendingCount} Active</div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('ledger');
          }}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'bg-cyan-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>📋</span>
          <span>Recommendations Ledger ({bets.length})</span>
        </button>

        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('patterns');
          }}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'patterns'
              ? 'bg-cyan-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>🧠</span>
          <span>Learned Patterns &amp; Dynamic Weights ({patternMetrics.length})</span>
        </button>

        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('teasers');
          }}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'teasers'
              ? 'bg-cyan-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>🗓️</span>
          <span>7-Day Teaser Window Matrix</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: RECOMMENDATIONS LEDGER                        */}
      {/* ==================================================== */}
      {activeTab === 'ledger' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-slate-500 uppercase text-[10px] font-bold">Outcome:</span>
              {(['ALL', 'PENDING', 'WON', 'LOST', 'PUSH'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    playKeyClick();
                    setFilterStatus(st);
                  }}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                    filterStatus === st
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st === 'ALL' ? 'All Bets' : st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-slate-500 uppercase text-[10px] font-bold">Tier:</span>
              {(
                [
                  'ALL',
                  'SINGLE_GAME',
                  'PARLAY_3LEG',
                  'TEASER_3TEAM_10',
                  'TEASER_4TEAM_13',
                  'PRIME_1GAME',
                ] as const
              ).map((tr) => (
                <button
                  key={tr}
                  onClick={() => {
                    playKeyClick();
                    setFilterTier(tr);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 text-[11px] ${
                    filterTier === tr
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {tr === 'ALL'
                    ? 'All Tiers'
                    : tr === 'SINGLE_GAME'
                    ? 'Single'
                    : tr === 'PARLAY_3LEG'
                    ? 'Parlay'
                    : tr === 'TEASER_3TEAM_10'
                    ? '+10 Tease'
                    : tr === 'TEASER_4TEAM_13'
                    ? '+13 Tease'
                    : 'Prime 1-Game'}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Cards Grid */}
          <div className="space-y-4">
            {filteredBets.map((bet) => (
              <div
                key={bet.id}
                className={`p-5 rounded-2xl border transition-all space-y-3.5 relative overflow-hidden ${
                  bet.status === 'WON'
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-emerald-500/5'
                    : bet.status === 'LOST'
                    ? 'bg-slate-900/90 border-red-500/40 shadow-red-500/5'
                    : bet.status === 'PENDING'
                    ? 'bg-slate-900/90 border-amber-500/50 shadow-amber-500/5 ring-1 ring-amber-500/20'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 border border-slate-700 text-cyan-300">
                        {bet.badge}
                      </span>
                      <span className="text-slate-400 text-[11px] font-sans">
                        {bet.slateTitle} &bull; {bet.dateLabel}
                      </span>
                      {bet.tier.includes('TEASER') && (
                        <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300 text-[10px] font-bold">
                          🗓️ 2 Days in 7-Day Window
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-white font-sans">{bet.title}</h4>
                    <div className="text-[11px] text-slate-400">{bet.subtitle}</div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase">Odds &bull; Stake</div>
                      <div className="text-cyan-300 font-bold">
                        {bet.payoutOdds} &bull; {bet.unitsStaked}u
                      </div>
                    </div>

                    <div className="h-8 w-px bg-slate-800" />

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase">Outcome</div>
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1 ${
                          bet.status === 'WON'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                            : bet.status === 'LOST'
                            ? 'bg-red-950 text-red-400 border border-red-700'
                            : bet.status === 'PENDING'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span>
                          {bet.status === 'WON'
                            ? '✓ WON'
                            : bet.status === 'LOST'
                            ? '✗ LOST'
                            : bet.status === 'PENDING'
                            ? '⏳ PENDING'
                            : 'PUSH'}
                        </span>
                        {bet.status !== 'PENDING' && (
                          <span>
                            ({bet.unitsWonLost >= 0 ? `+${bet.unitsWonLost}` : bet.unitsWonLost}u)
                          </span>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        playKeyClick();
                        setEditingBetId(editingBetId === bet.id ? null : bet.id);
                        setEditStatus(bet.status === 'PENDING' ? 'WON' : bet.status);
                        setEditScore(bet.legs[0]?.finalScore || '');
                        setEditNote(bet.postGameAnalysis || '');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer text-[11px]"
                    >
                      {editingBetId === bet.id ? 'Cancel' : 'Grade / Edit'}
                    </button>
                  </div>
                </div>

                {/* Inline Editing Deck */}
                {editingBetId === bet.id && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/80 space-y-3 animate-fadeIn">
                    <div className="font-bold text-cyan-300 text-xs">
                      Update Bet Outcome &bull; Settle in Ledger
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Status Result</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as BetOutcome)}
                          className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                        >
                          <option value="WON">WON (Payout Return)</option>
                          <option value="LOST">LOST (-{bet.unitsStaked} Units)</option>
                          <option value="PUSH">PUSH (0 Units Returned)</option>
                          <option value="PENDING">PENDING (Awaiting Slate)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Final Score or Detail</label>
                        <input
                          type="text"
                          value={editScore}
                          onChange={(e) => setEditScore(e.target.value)}
                          placeholder="e.g. BUF 24, LAR 20"
                          className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                        />
                      </div>

                      <div className="sm:self-end">
                        <button
                          onClick={() => handleSaveStatus(bet.id)}
                          className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer transition-colors"
                        >
                          Save Outcome &amp; Recompute
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bet Legs Breakdown */}
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">
                    Strategy Slip Legs ({bet.legs.length} Selections):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {bet.legs.map((leg, idx) => (
                      <div
                        key={leg.id || idx}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-cyan-400 font-bold">
                            LEG #{idx + 1} &bull; {leg.betType}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              leg.status === 'WON'
                                ? 'bg-emerald-950 text-emerald-400'
                                : leg.status === 'LOST'
                                ? 'bg-red-950 text-red-400'
                                : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            {leg.status}
                          </span>
                        </div>

                        <div>
                          <div className="text-white font-bold">{leg.targetSelection}</div>
                          <div className="text-slate-400 text-[10px]">
                            {leg.gameMatchup} &bull; {leg.gameDate}
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            Original: {leg.originalLine} | {leg.bestSportsbook}
                          </div>
                        </div>

                        {leg.finalScore && (
                          <div className="p-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-emerald-300 font-semibold">
                            Outcome: {leg.finalScore}
                          </div>
                        )}

                        <p className="text-[10px] text-slate-400 font-sans leading-tight">
                          {leg.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pattern Signals Tagged & Learned Takeaway */}
                <div className="pt-2 border-t border-slate-800/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500 uppercase text-[10px] font-bold">
                      Signals Tracked:
                    </span>
                    {bet.signalsTagged.map((sig) => (
                      <span
                        key={sig}
                        className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-cyan-300 text-[10px]"
                      >
                        {sig.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>

                  {bet.postGameAnalysis && (
                    <div className="text-slate-300 font-sans text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800 max-w-xl">
                      <strong className="text-cyan-400 font-mono text-[10px] uppercase block">
                        Analysis &amp; Model Feedback:
                      </strong>
                      {bet.postGameAnalysis}
                    </div>
                  )}
                </div>

                {/* Dynamic Weight Influence Notice */}
                {bet.learnedTakeaway && (
                  <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-200 text-xs font-sans flex items-start gap-2">
                    <span className="text-base shrink-0">🧠</span>
                    <div>
                      <strong className="font-mono text-[10px] uppercase text-purple-300 block">
                        Model Strategy Rule Synthesized:
                      </strong>
                      {bet.learnedTakeaway}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: LEARNED PATTERNS & DYNAMIC WEIGHTS            */}
      {/* ==================================================== */}
      {activeTab === 'patterns' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Theory & Mechanism Explanation */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 font-sans">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🧠</span>
              <span>How Win/Loss Patterns Directly Influence Future Strategy</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              When bets settle in the ledger, the algorithm categorizes outcomes across 8 structural market features. Patterns with demonstrated profitability (win rate &gt; 60% and positive unit return) receive an <strong>automatic strategy weight boost (up to 1.35x)</strong>, elevating them in future game evaluations. Underperforming patterns (such as uncorrelated cross-sport parlays) receive a penalty, enforcing strict model discipline.
            </p>
          </div>

          {/* Pattern Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patternMetrics.map((metric) => (
              <div
                key={metric.signal}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {metric.icon}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{metric.label}</h4>
                      <p className="text-[11px] text-slate-400 font-sans max-w-sm">
                        {metric.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                      metric.weightStatus === 'BOOSTED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                        : metric.weightStatus === 'MODERATE_BOOST'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-700'
                        : metric.weightStatus === 'PENALIZED'
                        ? 'bg-red-950 text-red-400 border border-red-700'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {metric.weightStatus === 'BOOSTED'
                      ? '🔥 High Boost'
                      : metric.weightStatus === 'MODERATE_BOOST'
                      ? '✅ Boosted'
                      : metric.weightStatus === 'PENALIZED'
                      ? '⚠️ Penalized'
                      : '⚖️ Neutral'}
                  </span>
                </div>

                {/* Metrics Stats Grid */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-[9px] text-slate-400 uppercase">Tracked</div>
                    <div className="text-white font-bold">{metric.totalBets} Bets</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-[9px] text-slate-400 uppercase">Record</div>
                    <div className="text-emerald-400 font-bold">
                      {metric.wins}W-{metric.losses}L
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-[9px] text-slate-400 uppercase">Win Rate</div>
                    <div className="text-cyan-300 font-bold">{metric.winRate}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-[9px] text-slate-400 uppercase">Net Units</div>
                    <div className={`font-bold ${metric.netUnits >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {metric.netUnits >= 0 ? `+${metric.netUnits}u` : `${metric.netUnits}u`}
                    </div>
                  </div>
                </div>

                {/* Strategy Weight Visual Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Baseline: 1.00x</span>
                    <span className="text-white font-bold">
                      Learned Weight:{' '}
                      <strong className="text-cyan-400 text-sm">{metric.learnedWeight}x</strong>
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden relative border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        metric.learnedWeight > 1.0
                          ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                          : metric.learnedWeight < 1.0
                          ? 'bg-red-500'
                          : 'bg-slate-600'
                      }`}
                      style={{
                        width: `${Math.min(100, (metric.learnedWeight / 1.5) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Natural Language Strategy Impact Note */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-sans text-slate-300 leading-relaxed">
                  {metric.strategyImpactNote}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: 7-DAY TEASER SCHEDULE MATRIX                  */}
      {/* ==================================================== */}
      {activeTab === 'teasers' && (
        <div className="space-y-5 animate-fadeIn">
          {/* User Specification Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/60 shadow-xl space-y-2 font-sans">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-700 text-purple-300 font-mono text-[10px] font-bold uppercase">
                SPECIFICATION CONFIRMED
              </span>
              <span className="text-xs text-purple-400 font-mono">
                Flexibility Rule: Any 2 Days in 7-Day Window
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Teaser Multi-Day Span: Any 2 Selected Days Within Upcoming 7-Day Slate
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Teasers do <strong>not</strong> need to be restricted strictly to today and tomorrow. The algorithm evaluates the entire upcoming 7-day schedule (e.g. Oct 12 to Oct 19) and pairs the optimal 2 days that provide the maximum expected value (+EV) and line threshold crossings.
            </p>
          </div>

          {/* 7-Day Schedule Timeline */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Upcoming 7-Day Game Schedule (Oct 12 – Oct 19, 2026):</span>
              <span className="text-emerald-400 text-[11px]">Active Teaser Pair: Oct 12 &amp; Oct 18</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Day 1: Oct 12 (Tonight) - SELECTED */}
              <div className="p-4 rounded-xl bg-purple-950/30 border-2 border-purple-500 shadow-lg space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-400">MON &bull; OCT 12</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-900 text-purple-200 font-bold text-[9px]">
                    ★ TEASER DAY 1 OF 2
                  </span>
                </div>
                <div className="text-white font-bold text-sm">Rams @ Bills</div>
                <div className="text-[11px] text-slate-300 font-sans">
                  Highmark Stadium &bull; Prime Time MNF
                </div>
                <div className="p-2 rounded bg-slate-950 border border-purple-800/80 text-[10px] text-emerald-300">
                  +10 Teased: <strong>Bills +13.5</strong> &amp; <strong>Under 58.5</strong>
                </div>
              </div>

              {/* Day 2: Oct 13 (Tomorrow) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 opacity-70">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400">TUE &bull; OCT 13</span>
                  <span className="text-[10px] text-slate-500">Available</span>
                </div>
                <div className="text-white font-bold text-sm">Celtics @ Knicks</div>
                <div className="text-[11px] text-slate-400 font-sans">Madison Square Garden</div>
                <div className="text-[10px] text-slate-500">
                  Teased Line Option: Knicks +15.5
                </div>
              </div>

              {/* Day 4: Oct 15 (Thursday Night) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-cyan-400">THU &bull; OCT 15</span>
                  <span className="text-[10px] text-cyan-500 font-bold">ALT PAIR OPTION</span>
                </div>
                <div className="text-white font-bold text-sm">Broncos @ Saints</div>
                <div className="text-[11px] text-slate-300 font-sans">Thursday Night Football (TNF)</div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-300">
                  TNF Option: Saints +9.5 (+10 Teased)
                </div>
              </div>

              {/* Day 7: Oct 18 (Sunday) - SELECTED */}
              <div className="p-4 rounded-xl bg-purple-950/30 border-2 border-purple-500 shadow-lg space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-400">SUN &bull; OCT 18</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-900 text-purple-200 font-bold text-[9px]">
                    ★ TEASER DAY 2 OF 2
                  </span>
                </div>
                <div className="text-white font-bold text-sm">Chiefs @ Lions</div>
                <div className="text-[11px] text-slate-300 font-sans">
                  Ford Field Showcase &bull; 4:25 PM EDT
                </div>
                <div className="p-2 rounded bg-slate-950 border border-purple-800/80 text-[10px] text-emerald-300">
                  +10 Teased: <strong>Lions +7.5</strong> &amp; <strong>Under 64.5</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Active 7-Day Teasers in Live Deck */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 font-bold">
                  1 3-TEAM +10 TEASER (ACTIVE)
                </span>
                <span className="text-emerald-400 font-bold">+14.8% EV</span>
              </div>
              <h4 className="text-base font-bold text-white">
                Tonight Oct 12 (Day 1) + Sunday Oct 18 (Day 2)
              </h4>
              <p className="text-slate-300 text-xs font-sans leading-relaxed">
                Legs: (1) Bills +13.5 (Tonight), (2) Under 58.5 (Tonight), (3) Lions +7.5 (Sunday Oct 18).
              </p>
              <div className="text-[11px] text-slate-400">
                Payout: -120 at DraftKings / Circa Sports. Risk 1.5u to win 1.25u.
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 font-bold">
                  1 4-TEAM +13 MONSTER TEASER (ACTIVE)
                </span>
                <span className="text-emerald-400 font-bold">+16.2% EV</span>
              </div>
              <h4 className="text-base font-bold text-white">
                Tonight Oct 12 (Day 1) + Sunday Oct 18 (Day 2)
              </h4>
              <p className="text-slate-300 text-xs font-sans leading-relaxed">
                Legs: (1) Bills +16.5 (Tonight), (2) Under 61.5 (Tonight), (3) Lions +10.5 (Sunday Oct 18), (4) Under 64.5 (Sunday Oct 18).
              </p>
              <div className="text-[11px] text-slate-400">
                Payout: -135 at Circa Sports / Caesars. Risk 1.35u to win 1.00u.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
