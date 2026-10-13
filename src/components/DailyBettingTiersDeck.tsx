import React, { useState } from 'react';
import { DailySlatePortfolio, DailyBetPackage } from '../types/sportsBetting';
import { playKeyClick, playSuccessChime } from '../utils/audio';

interface DailyBettingTiersDeckProps {
  portfolio: DailySlatePortfolio;
  onSelectGame?: (gameId: string) => void;
  onOpenTracker?: () => void;
}

export const DailyBettingTiersDeck: React.FC<DailyBettingTiersDeckProps> = ({
  portfolio,
  onSelectGame,
  onOpenTracker,
}) => {
  const [activeTierKey, setActiveTierKey] = useState<'single' | 'parlay' | 'teaser10' | 'teaser13'>('single');
  const [calculatorStake, setCalculatorStake] = useState<number>(100);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const tierMap: Record<'single' | 'parlay' | 'teaser10' | 'teaser13', DailyBetPackage> = {
    single: portfolio.singleGameBet,
    parlay: portfolio.parlayBet,
    teaser10: portfolio.teaser3Team10Pt,
    teaser13: portfolio.teaser4Team13Pt,
  };

  const currentPackage = tierMap[activeTierKey];

  const learnedPatternInfo: Record<
    'single' | 'parlay' | 'teaser10' | 'teaser13',
    { title: string; desc: string }
  > = {
    single: {
      title: 'Active Formula: Whale Steam & Line Crossing (-2.5 vs KC)',
      desc: 'Active for Week 6: Detroit -2.5 backed by 67% handle on 38% tickets at Ford Field (Sunday, Oct 18 · 1:25 PM PST).',
    },
    parlay: {
      title: 'Active Formula: World Series Pitching + Correlated Week 6 Script',
      desc: 'Active cross-sport parlay: Dodgers home ML tonight (Oct 13 · 5:08 PM PST) paired with Ford Field clock control on Sunday.',
    },
    teaser10: {
      title: 'Active Formula: 7-Day Window Key Threshold Crossings',
      desc: 'Spanning Sunday Oct 18 and Monday Oct 19 MNF in PST, crossing critical scoring thresholds 3, 7, and 10.',
    },
    teaser13: {
      title: 'Active Formula: Maximum +13 Cushion Across 7-Day Window',
      desc: 'Spanning Sunday Oct 18 and Monday Oct 19 MNF in PST, moving spreads past two converted scores (+10.5, +16.5, +15.5).',
    },
  };

  const copyPackageToClipboard = (pkg: DailyBetPackage) => {
    playSuccessChime();
    const text = `🎯 LINEPULSE DAILY PLAY: ${pkg.title}\nOdds: ${pkg.payoutOdds} | EV: +${pkg.expectedValue}% | Timeframe: ${pkg.daySpanNote}\n\nLEGS:\n${pkg.legs.map((l, i) => `${i + 1}. [${l.betType}] ${l.targetSelection} (${l.teasedLine ? `Teased to ${l.teasedLine}` : l.originalLine}) @ ${l.bestSportsbook}\n   Edge: +${l.modelEdge}% - ${l.rationale}`).join('\n\n')}\n\nExecution:\n${pkg.executionInstructions}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(pkg.id);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* 4 Tier Navigation Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Tier 1: 1 Single Game Bet */}
        <button
          onClick={() => {
            playKeyClick();
            setActiveTierKey('single');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 relative overflow-hidden ${
            activeTierKey === 'single'
              ? 'bg-slate-900 border-cyan-400 shadow-xl ring-1 ring-cyan-400/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
              1 SINGLE GAME
            </span>
            <span className="text-emerald-400 font-bold">+{portfolio.singleGameBet.expectedValue}% EV</span>
          </div>
          <div className="text-white font-bold text-xs truncate">1 Single Straight Bet</div>
          <div className="text-[11px] text-slate-400 truncate">{portfolio.singleGameBet.legs[0]?.targetSelection}</div>
          <div className="text-[10px] text-slate-500">{portfolio.singleGameBet.payoutOdds}</div>
        </button>

        {/* Tier 2: 1 Parlay (Up to 3 Bets) */}
        <button
          onClick={() => {
            playKeyClick();
            setActiveTierKey('parlay');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 relative overflow-hidden ${
            activeTierKey === 'parlay'
              ? 'bg-slate-900 border-purple-400 shadow-xl ring-1 ring-purple-400/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 font-bold">
              1 PARLAY (3-LEG)
            </span>
            <span className="text-emerald-400 font-bold">+{portfolio.parlayBet.expectedValue}% EV</span>
          </div>
          <div className="text-white font-bold text-xs truncate">1 3-Leg Value Parlay</div>
          <div className="text-[11px] text-purple-300 truncate">{portfolio.parlayBet.legs.length} Correlated Legs</div>
          <div className="text-[10px] text-slate-500">{portfolio.parlayBet.payoutOdds}</div>
        </button>

        {/* Tier 3: 1 3-Team +10 Teaser */}
        <button
          onClick={() => {
            playKeyClick();
            setActiveTierKey('teaser10');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 relative overflow-hidden ${
            activeTierKey === 'teaser10'
              ? 'bg-slate-900 border-amber-400 shadow-xl ring-1 ring-amber-400/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 font-bold">
              3-TEAM +10 TEASE
            </span>
            <span className="text-emerald-400 font-bold">+{portfolio.teaser3Team10Pt.expectedValue}% EV</span>
          </div>
          <div className="text-white font-bold text-xs truncate">1 3-Team +10 Teaser</div>
          <div className="text-[11px] text-amber-300 truncate">Any 2 Days in 7 Days</div>
          <div className="text-[10px] text-slate-500">{portfolio.teaser3Team10Pt.payoutOdds}</div>
        </button>

        {/* Tier 4: 1 4-Team +13 Teaser */}
        <button
          onClick={() => {
            playKeyClick();
            setActiveTierKey('teaser13');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 relative overflow-hidden ${
            activeTierKey === 'teaser13'
              ? 'bg-slate-900 border-emerald-400 shadow-xl ring-1 ring-emerald-400/40'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
              4-TEAM +13 TEASE
            </span>
            <span className="text-emerald-400 font-bold">+{portfolio.teaser4Team13Pt.expectedValue}% EV</span>
          </div>
          <div className="text-white font-bold text-xs truncate">1 4-Team +13 Monster</div>
          <div className="text-[11px] text-emerald-300 truncate">Any 2 Days in 7 Days</div>
          <div className="text-[10px] text-slate-500">{portfolio.teaser4Team13Pt.payoutOdds}</div>
        </button>
      </div>

      {/* Active Package Showcase Spotlight */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border-2 border-slate-800 shadow-2xl space-y-4">
        {/* Package Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-bold text-[10px] uppercase">
                {currentPackage.badge}
              </span>
              <span className="text-xs text-slate-300 font-bold">
                🗓️ {currentPackage.daySpanNote}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700 text-amber-300 font-bold text-[10px] animate-pulse">
                ⚡ Tracked in Ledger (Pending)
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white font-sans">
              {currentPackage.title}
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              {currentPackage.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 font-mono">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">PRICE / ODDS</div>
              <div className="text-cyan-300 font-bold text-base">{currentPackage.payoutOdds}</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">EXPECTED VALUE</div>
              <div className="text-emerald-400 font-bold text-base">+{currentPackage.expectedValue}% EV</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">CONFIDENCE</div>
              <div className="text-white font-bold text-base">{currentPackage.confidenceScore}%</div>
            </div>
          </div>
        </div>

        {/* Learned Pattern AI Influence Badge */}
        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base shrink-0">🧠</span>
            <div>
              <span className="text-purple-300 font-bold block text-[11px]">
                LEARNED MODEL PATTERN APPLIED: {learnedPatternInfo[activeTierKey].title}
              </span>
              <span className="text-slate-300 text-[10px] font-sans">
                {learnedPatternInfo[activeTierKey].desc}
              </span>
            </div>
          </div>

          {onOpenTracker && (
            <button
              onClick={() => {
                playKeyClick();
                onOpenTracker();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700 font-bold text-[10px] shrink-0 cursor-pointer transition-colors"
            >
              Open Tracker &rarr;
            </button>
          )}
        </div>

        {/* Sharp Inefficiency / Discrepancy Alert */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
          <div className="text-[10px] text-yellow-400 uppercase font-bold flex items-center gap-1.5">
            <span>⚡</span>
            <span>Market Syndicate Divergence Detected:</span>
          </div>
          <p className="text-slate-300 font-sans leading-relaxed text-[11px]">
            {currentPackage.keyDiscrepancy}
          </p>
        </div>

        {/* All Included Legs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Package Legs ({currentPackage.legs.length} Wagers)</span>
            <span>Edge / Sportsbook</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {currentPackage.legs.map((leg, i) => (
              <div
                key={leg.id}
                onClick={() => onSelectGame && onSelectGame(leg.gameId)}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors space-y-2 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-700 text-cyan-300">
                    LEG #{i + 1} &bull; {leg.betType}
                  </span>
                  <span className="text-emerald-400 font-bold text-[11px]">
                    +{leg.modelEdge}% Edge
                  </span>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400">{leg.gameMatchup} &bull; {leg.gameDate}</div>
                  <div className="text-white font-bold text-sm group-hover:text-cyan-300 transition-colors">
                    {leg.targetSelection}
                  </div>
                </div>

                {leg.teasedLine ? (
                  <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/60 text-[11px] space-y-0.5">
                    <div className="text-slate-400 text-[10px]">
                      Original: <span className="line-through">{leg.originalLine}</span>
                    </div>
                    <div className="text-amber-300 font-bold">
                      Teased (+{currentPackage.teaserPoints} pts) &rarr; {leg.teasedLine}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-300">
                    Best Line: <strong className="text-cyan-300">{leg.originalLine}</strong> ({leg.bestSportsbook})
                  </div>
                )}

                <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-2">
                  {leg.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Kelly Criterion Calculator & Execution Actions */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-slate-400 text-xs">Stake Size ($):</label>
              <input
                type="number"
                value={calculatorStake}
                onChange={(e) => setCalculatorStake(Math.max(10, Number(e.target.value)))}
                className="w-24 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs"
              />
              <span className="text-slate-400">
                Expected Profit: <strong className="text-emerald-400">+${((calculatorStake * currentPackage.expectedValue) / 100).toFixed(2)}</strong>
              </span>
            </div>

            <button
              onClick={() => copyPackageToClipboard(currentPackage)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-md"
            >
              <span>{copiedKey === currentPackage.id ? '✓' : '📋'}</span>
              <span>{copiedKey === currentPackage.id ? 'Copied to Clipboard!' : 'Copy Slip Execution'}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-sans">
            <strong className="text-slate-300">Execution Instructions: </strong>
            {currentPackage.executionInstructions}
          </div>
        </div>
      </div>
    </div>
  );
};
