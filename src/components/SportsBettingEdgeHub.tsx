import React, { useState, useMemo } from 'react';
import { GameMarket, SportsLeague } from '../types/sportsBetting';
import { MOCK_GAMES_MARKETS, PUBLIC_SPORTSBOOKS, DAILY_SLATE_PORTFOLIOS } from '../data/sportsBettingData';
import { DailyBettingTiersDeck } from './DailyBettingTiersDeck';
import { BetTrackerAndPatternView } from './BetTrackerAndPatternView';
import { playKeyClick, playSuccessChime } from '../utils/audio';

interface SportsBettingEdgeHubProps {
  onBack?: () => void;
}

export const SportsBettingEdgeHub: React.FC<SportsBettingEdgeHubProps> = ({ onBack }) => {
  const [hubViewMode, setHubViewMode] = useState<'board' | 'tracker'>('board');
  const [selectedLeague, setSelectedLeague] = useState<SportsLeague | 'ALL'>('NFL');
  const [activeGameId, setActiveGameId] = useState<string>('nfl-lar-buf-today');
  const [viewTab, setViewTab] = useState<'strategy' | 'splits' | 'books' | 'movement'>('strategy');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDailyPortfolio, setShowDailyPortfolio] = useState<boolean>(true);
  const [calculatorStake, setCalculatorStake] = useState<number>(100);
  const [copiedStrategy, setCopiedStrategy] = useState<boolean>(false);

  // Filter games
  const filteredGames = useMemo(() => {
    return MOCK_GAMES_MARKETS.filter((g) => {
      if (selectedLeague !== 'ALL' && g.league !== selectedLeague) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchHome = g.homeTeam.name.toLowerCase().includes(q) || g.homeTeam.city.toLowerCase().includes(q);
        const matchAway = g.awayTeam.name.toLowerCase().includes(q) || g.awayTeam.city.toLowerCase().includes(q);
        if (!matchHome && !matchAway) return false;
      }
      return true;
    });
  }, [selectedLeague, searchQuery]);

  // Active Selected Game
  const activeGame = useMemo(() => {
    return MOCK_GAMES_MARKETS.find((g) => g.id === activeGameId) || MOCK_GAMES_MARKETS[0];
  }, [activeGameId]);

  // Identify the single game with the 1 prime strategy
  const primeGame = useMemo(() => {
    return MOCK_GAMES_MARKETS.find((g) => g.isPrimeOpportunity && g.primeStrategy) || MOCK_GAMES_MARKETS[0];
  }, []);

  const totalSlateHandle = useMemo(() => {
    return MOCK_GAMES_MARKETS.reduce((acc, g) => acc + g.totalDollarsWagered, 0);
  }, []);

  const totalSlateTickets = useMemo(() => {
    return MOCK_GAMES_MARKETS.reduce((acc, g) => acc + g.totalBetsPlaced, 0);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const copyStrategyToClipboard = () => {
    playSuccessChime();
    const strat = primeGame.primeStrategy;
    if (!strat) return;
    const text = `🎯 LINE PULSE EDGE STRATEGY: ${strat.strategyName}\nGame: ${primeGame.awayTeam.name} @ ${primeGame.homeTeam.name}\nEV: +${strat.expectedValue}% | Confidence: ${strat.confidenceScore}%\n\nLEGS:\n${strat.legs.map((l, i) => `${i + 1}. [${l.betType}] ${l.targetSelection} (${l.bestOdds} at ${l.bestSportsbook})\n   Edge: +${l.modelEdge}% - ${l.rationale}`).join('\n\n')}\n\nExecution:\n${strat.executionInstructions}`;
    navigator.clipboard.writeText(text);
    setCopiedStrategy(true);
    setTimeout(() => setCopiedStrategy(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-mono"
                >
                  <span>&larr;</span>
                  <span>My Projects</span>
                </button>
              )}
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>PROJECT #4 &bull; MULTI-BOOK ARBITRAGE &amp; LINE MOVEMENT AGGREGATOR</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5 flex-wrap">
              <span>LinePulse: Sharp Market Aggregator</span>
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                NFL Primary Focus &bull; All US Sports
              </span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              Real-time aggregation of betting lines across 8 top public sportsbooks (DraftKings, FanDuel, Circa, Pinnacle, BetMGM, Caesars). Tracks total ticket volume, total dollar handles, reverse line steam, and selects <strong>1 Game with 1 Multi-Leg Strategy</strong> where sharp divergence provides maximum positive expected value (+EV).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 font-mono text-xs">
            <button
              onClick={() => {
                playKeyClick();
                setHubViewMode('tracker');
              }}
              className={`px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg active:scale-95 ${
                hubViewMode === 'tracker'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 font-extrabold shadow-cyan-500/20'
                  : 'bg-purple-950/80 border border-purple-700 text-purple-200 hover:text-white'
              }`}
            >
              <span>🧠</span>
              <span>Bet Tracker &amp; AI (Day 1)</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setHubViewMode('board');
                setShowDailyPortfolio(!showDailyPortfolio);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                hubViewMode === 'board' && showDailyPortfolio
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 shadow-cyan-500/20'
                  : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <span>⭐</span>
              <span>Daily Portfolio Deck (4 Tiers)</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setHubViewMode('board');
                setActiveGameId(primeGame.id);
                setViewTab('strategy');
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🎯</span>
              <span>Game Strategy</span>
            </button>
          </div>
        </div>

        {/* Global Slate Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <div className="text-[10px] text-slate-400 uppercase">Total Slate Handle</div>
            <div className="text-emerald-400 font-bold text-lg">{formatCurrency(totalSlateHandle)}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <div className="text-[10px] text-cyan-400 uppercase">Total Bets Tracked</div>
            <div className="text-cyan-300 font-bold text-lg">{totalSlateTickets.toLocaleString()} Bets</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <div className="text-[10px] text-amber-400 uppercase">Daily Strategy Tiers</div>
            <div className="text-amber-300 font-bold text-lg">4 Formulas Ready</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
            <div className="text-[10px] text-purple-400 uppercase">Teaser Span</div>
            <div className="text-purple-300 font-bold text-lg">Any 2 of 7 Days</div>
          </div>
        </div>
      </div>

      {/* Primary View Mode Switcher: Odds Board vs Bet Recommendations Tracker */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 font-mono text-xs">
        <button
          onClick={() => {
            playKeyClick();
            setHubViewMode('board');
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            hubViewMode === 'board'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🏢</span>
          <span>Live Market Odds Board &amp; Daily Strategy</span>
        </button>
        <button
          onClick={() => {
            playKeyClick();
            setHubViewMode('tracker');
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            hubViewMode === 'tracker'
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🧠</span>
          <span>Bet Recommendations Tracker &amp; Pattern AI (Tracking Live · 0 Settled)</span>
        </button>
      </div>

      {/* VIEW MODE: TRACKER & PATTERN AI */}
      {hubViewMode === 'tracker' ? (
        <BetTrackerAndPatternView onBackToBoard={() => setHubViewMode('board')} />
      ) : (
        <>
          {/* DAILY BETTING PORTFOLIO: 1 Single, 1 Parlay (Up to 3), 1 3-Team +10 Tease, 1 4-Team +13 Tease */}
          {showDailyPortfolio && DAILY_SLATE_PORTFOLIOS[0] && (
            <div className="space-y-3">
              <div className="flex items-center justify-between font-mono text-xs px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white font-bold uppercase tracking-wider text-sm font-sans">
                    Daily Algorithmic Portfolio &bull; {DAILY_SLATE_PORTFOLIOS[0].dateLabel}
                  </span>
                </div>
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  4 Disciplined Tiers &bull; Teasers span any 2 days in upcoming 7-day period
                </span>
              </div>

              <DailyBettingTiersDeck
                portfolio={DAILY_SLATE_PORTFOLIOS[0]}
                onSelectGame={(gameId) => {
                  playKeyClick();
                  setActiveGameId(gameId);
                  setViewTab('splits');
                }}
                onOpenTracker={() => setHubViewMode('tracker')}
              />
            </div>
          )}

      {/* 1 PRIME STRATEGY SPOTLIGHT (Highlighted Card) */}
      {primeGame.primeStrategy && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/50 via-slate-900 to-slate-900 border-2 border-cyan-500/60 shadow-2xl relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/30 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-mono text-[10px] font-bold uppercase tracking-wider">
                  ★ ALGORITHM 1-GAME STRATEGY SELECTION
                </span>
                <span className="text-xs font-mono text-cyan-300">
                  {primeGame.awayTeam.city} {primeGame.awayTeam.name} @ {primeGame.homeTeam.city} {primeGame.homeTeam.name}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {primeGame.primeStrategy.strategyName}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right font-mono">
                <div className="text-[10px] text-slate-400 uppercase">EXPECTED VALUE</div>
                <div className="text-emerald-400 font-bold text-lg">+{primeGame.primeStrategy.expectedValue}% EV</div>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden sm:block" />
              <div className="text-right font-mono">
                <div className="text-[10px] text-slate-400 uppercase">CONFIDENCE</div>
                <div className="text-cyan-400 font-bold text-lg">{primeGame.primeStrategy.confidenceScore}%</div>
              </div>
            </div>
          </div>

          {/* Key Discrepancy & Logic */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="text-[10px] text-yellow-400 uppercase font-bold flex items-center gap-1">
              <span>⚡</span>
              <span>Whale vs Public Discrepancy Found:</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans">
              {primeGame.primeStrategy.keyDiscrepancy}
            </p>
          </div>

          {/* Multi-Leg Breakdown */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Multi-Leg Game Blueprint ({primeGame.primeStrategy.legs.length} Coordinated Bets):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              {primeGame.primeStrategy.legs.map((leg, idx) => (
                <div
                  key={leg.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2 relative group hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-700 text-cyan-300">
                      LEG #{idx + 1} &bull; {leg.betType}
                    </span>
                    <span className="text-emerald-400 font-bold text-[11px]">
                      +{leg.modelEdge}% Edge
                    </span>
                  </div>

                  <div>
                    <div className="text-white font-bold text-sm">{leg.targetSelection}</div>
                    <div className="text-slate-400 text-[11px]">
                      Best Price: <strong className="text-cyan-300">{leg.bestOdds}</strong> at{' '}
                      <span className="text-slate-200 underline">{leg.bestSportsbook}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed line-clamp-3">
                    {leg.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Execution & Copy Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800 font-mono text-xs">
            <div className="text-slate-300">
              <span className="text-slate-500">Execution Plan: </span>
              {primeGame.primeStrategy.executionInstructions}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={copyStrategyToClipboard}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{copiedStrategy ? '✓' : '📋'}</span>
                <span>{copiedStrategy ? 'Copied Strategy!' : 'Copy Slip Details'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* League Selection Filter & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-slate-500 uppercase text-[11px] font-bold shrink-0">League:</span>
            {(['NFL', 'NBA', 'MLB', 'NHL', 'ALL'] as const).map((l) => (
              <button
                key={l}
                onClick={() => {
                  playKeyClick();
                  setSelectedLeague(l);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 ${
                  selectedLeague === l
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {l === 'NFL' ? '🏈 NFL (Current Focus)' : l === 'NBA' ? '🏀 NBA' : l === 'MLB' ? '⚾ MLB' : l === 'NHL' ? '🏒 NHL' : '🇺🇸 All Sports'}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team or city..."
              className="w-full px-3 py-1.5 pl-8 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
            <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column View: Games List & In-Depth Market Analyzer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Game Slate List */}
        <div className="lg:col-span-5 space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Market Slate ({filteredGames.length} Games)</span>
            <span>Handle / Bets Volume</span>
          </div>

          <div className="space-y-2.5">
            {filteredGames.map((game) => {
              const isSelected = game.id === activeGameId;
              return (
                <div
                  key={game.id}
                  onClick={() => {
                    playKeyClick();
                    setActiveGameId(game.id);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-xl ring-1 ring-cyan-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400">
                        {game.league}
                      </span>
                      <span>{game.scheduledTime}</span>
                    </span>
                    {game.isPrimeOpportunity && (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold text-[10px] animate-pulse">
                        ★ 1 PRIME GAME
                      </span>
                    )}
                  </div>

                  {/* Matchup */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-0.5">
                      <div className="text-slate-400 text-xs">{game.awayTeam.city}</div>
                      <div className="text-white font-bold">{game.awayTeam.name} ({game.awayTeam.record})</div>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <div className="text-slate-400 text-xs">{game.homeTeam.city}</div>
                      <div className="text-white font-bold">{game.homeTeam.name} ({game.homeTeam.record})</div>
                    </div>
                  </div>

                  {/* Line summary & Handle split preview */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase">Spread / ML:</span>{' '}
                      <span className="text-emerald-400 font-bold">{game.consensus.spread}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-white font-bold">{formatCurrency(game.totalDollarsWagered)}</span>{' '}
                      <span className="text-slate-500 text-[10px]">({game.totalBetsPlaced.toLocaleString()} bets)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Market Breakdown (Tabs for Splits, Books Comparison, Movement) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Game Banner */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs text-cyan-400 font-bold uppercase">
                  {activeGame.league} &bull; {activeGame.scheduledTime}
                </span>
                <h3 className="text-xl font-bold text-white font-sans">
                  {activeGame.awayTeam.city} {activeGame.awayTeam.name} vs. {activeGame.homeTeam.city} {activeGame.homeTeam.name}
                </h3>
                <div className="text-xs text-slate-400">{activeGame.stadium}</div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase">Consensus Total</div>
                <div className="text-lg font-bold text-emerald-400">{activeGame.consensus.total} O/U</div>
              </div>
            </div>

            {/* Navigation Tabs for Active Game Details */}
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
              <button
                onClick={() => setViewTab('strategy')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  viewTab === 'strategy'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                🎯 1-Game Strategy
              </button>
              <button
                onClick={() => setViewTab('splits')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  viewTab === 'splits'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                📊 Bets &amp; Dollars Wagered
              </button>
              <button
                onClick={() => setViewTab('books')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  viewTab === 'books'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                🏢 Multi-Book Line Compare ({activeGame.sportsbooks.length})
              </button>
              <button
                onClick={() => setViewTab('movement')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  viewTab === 'movement'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                📈 Line Movement History
              </button>
            </div>

            {/* TAB CONTENT: 1-GAME STRATEGY */}
            {viewTab === 'strategy' && (
              <div className="space-y-4 pt-1 animate-fadeIn">
                {activeGame.primeStrategy ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-cyan-300 uppercase">
                          Strategy: {activeGame.primeStrategy.strategyName}
                        </span>
                        <span className="text-emerald-400 font-bold">
                          +{activeGame.primeStrategy.expectedValue}% EV Model Edge
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {activeGame.primeStrategy.compositeSummary}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-400 uppercase">Strategy Legs &amp; Books:</div>
                      {activeGame.primeStrategy.legs.map((leg, i) => (
                        <div key={leg.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white font-bold">
                              #{i + 1} {leg.targetSelection}
                            </span>
                            <span className="text-cyan-400 font-bold">{leg.bestOdds} ({leg.bestSportsbook})</span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-sans">{leg.rationale}</p>
                        </div>
                      ))}
                    </div>

                    {/* Interactive EV Calculator */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-slate-400 uppercase">Stake Sizing Calculator (Kelly Criterion):</div>
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-slate-500">Unit Stake ($):</label>
                        <input
                          type="number"
                          value={calculatorStake}
                          onChange={(e) => setCalculatorStake(Math.max(10, Number(e.target.value)))}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white w-28 text-xs"
                        />
                        <div className="text-xs text-emerald-400 font-bold">
                          Expected Return: +${((calculatorStake * activeGame.primeStrategy.expectedValue) / 100).toFixed(2)} on +{activeGame.primeStrategy.expectedValue}% edge
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 space-y-2 font-mono">
                    <div>⚖️ Market currently efficient for this matchup.</div>
                    <p className="text-xs max-w-md mx-auto">
                      Our machine model only triggers a 1-Game Prime Strategy when sharp-to-ticket divergence exceeds +20% and price differences cross positive expected value (+EV) thresholds.
                    </p>
                    <button
                      onClick={() => setActiveGameId(primeGame.id)}
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      Jump to Selected Prime Game ({primeGame.awayTeam.abbr} @ {primeGame.homeTeam.abbr})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: BETS & DOLLARS WAGERED (SPLITS) */}
            {viewTab === 'splits' && (
              <div className="space-y-4 pt-1 animate-fadeIn">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Total Wagers: </span>
                    <strong className="text-white">{activeGame.totalBetsPlaced.toLocaleString()} bets</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Dollar Handle: </span>
                    <strong className="text-emerald-400">{formatCurrency(activeGame.totalDollarsWagered)}</strong>
                  </div>
                </div>

                {/* SPREAD SPLIT */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white uppercase">Spread Betting Splits</span>
                    <span className="text-slate-400 text-[11px]">Ticket % vs. Money %</span>
                  </div>

                  {/* Home Team Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cyan-300 font-bold">{activeGame.splits.spread.home.side}</span>
                      <span className="text-slate-300">
                        {activeGame.splits.spread.home.ticketPercentage}% Tickets &bull;{' '}
                        <strong className="text-emerald-400">{activeGame.splits.spread.home.moneyPercentage}% Handle</strong>
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                      <div
                        className="bg-cyan-500 h-full"
                        style={{ width: `${activeGame.splits.spread.home.moneyPercentage}%` }}
                        title="Money Handle %"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{activeGame.splits.spread.home.totalTicketsCount.toLocaleString()} wagers</span>
                      <span>{formatCurrency(activeGame.splits.spread.home.totalHandleAmount)}</span>
                    </div>
                  </div>

                  {/* Away Team Bar */}
                  <div className="space-y-1 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-300 font-bold">{activeGame.splits.spread.away.side}</span>
                      <span className="text-slate-300">
                        {activeGame.splits.spread.away.ticketPercentage}% Tickets &bull;{' '}
                        <strong className="text-emerald-400">{activeGame.splits.spread.away.moneyPercentage}% Handle</strong>
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                      <div
                        className="bg-red-500 h-full"
                        style={{ width: `${activeGame.splits.spread.away.moneyPercentage}%` }}
                        title="Money Handle %"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{activeGame.splits.spread.away.totalTicketsCount.toLocaleString()} wagers</span>
                      <span>{formatCurrency(activeGame.splits.spread.away.totalHandleAmount)}</span>
                    </div>
                  </div>

                  {activeGame.splits.spread.home.divergenceNotice && (
                    <div className="p-2.5 rounded-lg bg-yellow-950/40 border border-yellow-800 text-[11px] text-yellow-300 font-sans">
                      ⚠️ {activeGame.splits.spread.home.divergenceNotice}
                    </div>
                  )}
                </div>

                {/* OVER / UNDER TOTAL SPLIT */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white uppercase">Game Total Over / Under Splits</span>
                    <span className="text-slate-400 text-[11px]">Ticket % vs. Money %</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-300 font-bold">{activeGame.splits.total.over.side}</span>
                      <span className="text-slate-300">
                        {activeGame.splits.total.over.ticketPercentage}% Bets &bull;{' '}
                        <strong className="text-emerald-400">{activeGame.splits.total.over.moneyPercentage}% Handle</strong>
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${activeGame.splits.total.over.moneyPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-300 font-bold">{activeGame.splits.total.under.side}</span>
                      <span className="text-slate-300">
                        {activeGame.splits.total.under.ticketPercentage}% Bets &bull;{' '}
                        <strong className="text-emerald-400">{activeGame.splits.total.under.moneyPercentage}% Handle</strong>
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full"
                        style={{ width: `${activeGame.splits.total.under.moneyPercentage}%` }}
                      />
                    </div>
                  </div>

                  {activeGame.splits.total.under.divergenceNotice && (
                    <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-800 text-[11px] text-purple-300 font-sans">
                      🔍 {activeGame.splits.total.under.divergenceNotice}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: MULTI-BOOK COMPARISON */}
            {viewTab === 'books' && (
              <div className="space-y-3 pt-1 animate-fadeIn">
                <div className="text-xs text-slate-400">
                  Real-time line comparison across public books. Highlighted numbers show top market prices:
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                        <th className="py-2 px-3">Sportsbook</th>
                        <th className="py-2 px-3">{activeGame.awayTeam.abbr} Spread</th>
                        <th className="py-2 px-3">{activeGame.homeTeam.abbr} Spread</th>
                        <th className="py-2 px-3">Over / Under</th>
                        <th className="py-2 px-3">{activeGame.awayTeam.abbr} ML</th>
                        <th className="py-2 px-3">{activeGame.homeTeam.abbr} ML</th>
                        <th className="py-2 px-3">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activeGame.sportsbooks.map((b) => (
                        <tr key={b.bookName} className="hover:bg-slate-950/50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            <span>{b.bookName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            +{b.spreadAway} ({b.spreadAwayOdds})
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={b.isBestSpreadHome ? 'px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold' : 'text-slate-300'}>
                              {b.spreadHome} ({b.spreadHomeOdds})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {b.totalOver} ({b.totalOverOdds})
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {b.moneylineAway > 0 ? `+${b.moneylineAway}` : b.moneylineAway}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={b.isBestMoneylineHome ? 'px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold' : 'text-slate-300'}>
                              {b.moneylineHome > 0 ? `+${b.moneylineHome}` : b.moneylineHome}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[10px] text-slate-500">
                            {b.lastUpdated}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: LINE MOVEMENT HISTORY */}
            {viewTab === 'movement' && (
              <div className="space-y-4 pt-1 animate-fadeIn">
                <div className="text-xs text-slate-400">
                  Chronological line history tracking how books moved odds from opening release to game day:
                </div>

                <div className="space-y-3">
                  {activeGame.lineMovements.map((pt, i) => (
                    <div
                      key={pt.timestamp}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {i + 1}
                        </span>
                        <div>
                          <div className="text-white font-bold">{pt.timeLabel}</div>
                          <div className="text-[11px] text-slate-400">{pt.note || 'Market adjustment'}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px]">Spread:</span>{' '}
                          <strong className="text-cyan-300">{pt.spread > 0 ? `+${pt.spread}` : pt.spread}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">Total:</span>{' '}
                          <strong className="text-purple-300">{pt.total}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">Home ML:</span>{' '}
                          <strong className="text-emerald-400">{pt.moneylineHome > 0 ? `+${pt.moneylineHome}` : pt.moneylineHome}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
