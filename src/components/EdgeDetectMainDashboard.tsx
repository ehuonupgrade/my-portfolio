import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GameMarket, VolumeTickPulse } from '../types/sportsBetting';
import { DAILY_SLATE_PORTFOLIOS } from '../data/sportsBettingData';
import { NFL_MARKET_OPINIONS_MAP, getUniversalGameMarketOpinions } from '../data/nflMarketOpinionsData';
import { LineMovementAlertBanner, ACTIVE_MOVEMENT_ALERTS, SUPERSTAR_BREAKING_MEDICAL_WIRE, MovementAlertItem } from './LineMovementAlertBanner';
import {
  TrackedBetRecommendation,
  BetOutcome,
  TrackedBetTier,
} from '../types/sportsBettingTracker';
import {
  getTrackedBets,
  updateBetStatus,
  simulateTonightOutcome,
  resetTrackedBetsToSeed,
  exportTrackedBetsToCSV,
  autoGradeTrackedBetsWithLiveGames,
} from '../utils/bettingTrackerStore';
import { calculatePerformanceSummary } from '../utils/bettingPatternEngine';
import { DailyBettingTiersDeck } from './DailyBettingTiersDeck';
import { BettingPerformanceCharts } from './BettingPerformanceCharts';
import { GameLineMovementView } from './GameLineMovementView';
import { LiveVerificationModal } from './LiveVerificationModal';
import { LiveOddsStreamBadge } from './LiveOddsStreamBadge';
import { LiveOddsStreamModal } from './LiveOddsStreamModal';
import { LiveRosterStreamBadge } from './LiveRosterStreamBadge';
import { GameStatusBadge } from './common/GameStatusBadge';
import { LiveRosterVerificationModal } from './LiveRosterVerificationModal';
import { MonteCarloSimulationModal } from './MonteCarloSimulationModal';
import { analyzeGameLineMovement } from '../utils/lineMovementAnalyzer';
import { useLiveVerification } from '../utils/useLiveVerification';
import { useLiveOddsStream } from '../utils/useLiveOddsStream';
import { useLiveRosterVerification } from '../utils/useLiveRosterVerification';
import { playKeyClick, playSuccessChime, playBeep, playChime } from '../utils/audio';

interface EdgeDetectMainDashboardProps {
  games: GameMarket[];
  onNavigateToLeague: (league: 'NFL') => void;
  onSelectGameAndInspect: (gameId: string, tab?: 'opinions' | 'strategy' | 'weather' | 'injuries' | 'news' | 'splits' | 'books' | 'movement') => void;
  onBackToProjects?: () => void;
}

export const EdgeDetectMainDashboard: React.FC<EdgeDetectMainDashboardProps> = ({
  games,
  onNavigateToLeague,
  onSelectGameAndInspect,
  onBackToProjects,
}) => {
  // Navigation / Filter states
  const [activeMainSection, setActiveMainSection] = useState<'all' | 'recommendations' | 'radar' | 'ledger'>('all');
  const [recommendationViewMode, setRecommendationViewMode] = useState<'both' | 'portfolios' | 'slate_3way'>('both');
  const [confidenceFilter, setConfidenceFilter] = useState<'ALL' | 'TOP_3' | 'LOCKS' | 'SPREAD' | 'MONEYLINE' | 'TOTAL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Radar States
  const [radarTimeframe, setRadarTimeframe] = useState<'5M' | '15M' | '1H'>('15M');
  const [radarSeverityFilter, setRadarSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE'>('ALL');
  const [isLiveRadarStreaming, setIsLiveRadarStreaming] = useState<boolean>(true);
  const [isRadarSectionExpanded, setIsRadarSectionExpanded] = useState<boolean>(false);
  const [radarPulses, setRadarPulses] = useState<VolumeTickPulse[]>([]);
  const [radarVolumeDeltas, setRadarVolumeDeltas] = useState<Record<string, { units: number; dollars: number }>>({});
  const [activeRadarAlertIndex, setActiveRadarAlertIndex] = useState<number>(0);

  // Historical Ledger & Ongoing Tracker States
  const [bets, setBets] = useState<TrackedBetRecommendation[]>(() => getTrackedBets());

  // Real-time synchronization with background store updates
  useEffect(() => {
    const handleSync = () => {
      setBets(getTrackedBets());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('linepulse_bets_updated', handleSync);
    window.addEventListener('linepulse_api_cycle_complete', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('linepulse_bets_updated', handleSync);
      window.removeEventListener('linepulse_api_cycle_complete', handleSync);
    };
  }, []);

  // Automatically grade bets when live games slate is received or changes
  useEffect(() => {
    if (games && games.length > 0) {
      setBets((prev) => autoGradeTrackedBetsWithLiveGames(prev, games));
    }
  }, [games]);
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<BetOutcome | 'ALL'>('ALL');
  const [ledgerTierFilter, setLedgerTierFilter] = useState<TrackedBetTier | 'ALL'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);
  const [calculatorStake, setCalculatorStake] = useState<number>(100);
  const [isPerformanceChartExpanded, setIsPerformanceChartExpanded] = useState<boolean>(true);
  const [isLedgerSectionExpanded, setIsLedgerSectionExpanded] = useState<boolean>(false);
  const [isCompactViewMode, setIsCompactViewMode] = useState<boolean>(true);
  const [expandedGameIds, setExpandedGameIds] = useState<Record<string, boolean>>({});
  const [inspectingLineMoveGame, setInspectingLineMoveGame] = useState<GameMarket | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [showOddsModal, setShowOddsModal] = useState<boolean>(false);
  const [showRosterModal, setShowRosterModal] = useState<boolean>(false);
  const oddsStreamState = useLiveOddsStream(games);
  const rosterState = useLiveRosterVerification();

  // Live verification active state & timestamping
  const {
    lastVerifiedTime,
    isVerifying,
    secondsAgo,
    formattedTime,
    formattedDate,
    reverify,
  } = useLiveVerification();

  // Performance calculations
  const summary = useMemo(() => calculatePerformanceSummary(bets), [bets]);

  const [isMonteCarloModalOpen, setIsMonteCarloModalOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered bets for ongoing & historical ledger
  const ongoingBets = useMemo(() => {
    return bets.filter((b) => b.status === 'PENDING');
  }, [bets]);

  const settledBets = useMemo(() => {
    return bets.filter((b) => {
      if (b.status === 'PENDING') return false;
      if (ledgerStatusFilter !== 'ALL' && b.status !== ledgerStatusFilter) return false;
      if (ledgerTierFilter !== 'ALL' && b.tier !== ledgerTierFilter) return false;
      return true;
    });
  }, [bets, ledgerStatusFilter, ledgerTierFilter]);

  // Initial pulses from games
  useEffect(() => {
    const initial: VolumeTickPulse[] = [];
    games.filter((g) => g.status === 'UPCOMING').forEach((g) => {
      if (g.liveVolumeShifts?.recentPulses) {
        initial.push(...g.liveVolumeShifts.recentPulses);
      }
    });
    setRadarPulses(initial.slice(0, 12));
  }, [games]);

  // Real-time radar tick simulation
  const handleLiveTick = useCallback(() => {
    const activeUpcoming = games.filter((g) => g.status === 'UPCOMING');
    if (!activeUpcoming.length) return;

    const randomGame = activeUpcoming[Math.floor(Math.random() * activeUpcoming.length)];
    const isWhale = Math.random() > 0.6;
    const isTotal = Math.random() > 0.5;

    const unitInc = Math.floor(Math.random() * 75) + (isWhale ? 160 : 30);
    const dollarInc = Math.floor(Math.random() * 40000) + (isWhale ? 85000 : 9000);
    const books = ['Circa Sports', 'DraftKings', 'FanDuel', 'Pinnacle', 'Caesars'];
    const chosenBook = books[Math.floor(Math.random() * books.length)];

    const targetSide = isTotal
      ? (randomGame.consensus.total > 42 ? `Under ${randomGame.consensus.total}` : `Over ${randomGame.consensus.total}`)
      : (randomGame.consensus.spread.includes('-') ? randomGame.consensus.spread : `${randomGame.awayTeam.abbr} Spread`);

    const newPulse: VolumeTickPulse = {
      id: `tick-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      gameId: randomGame.id,
      matchup: `${randomGame.awayTeam.abbr} @ ${randomGame.homeTeam.abbr}`,
      targetSelection: targetSide,
      marketType: isTotal ? 'TOTAL' : 'SPREAD',
      unitDelta: unitInc,
      dollarDelta: dollarInc,
      sportsbook: chosenBook,
      tag: isWhale ? 'WHALE_LIMIT' : 'STEAM_SURGE',
      summary: `${isWhale ? '🐋 High-Limit Whale' : '⚡ Public Steam'} placed on ${targetSide} at ${chosenBook}`,
    };

    setRadarPulses((prev) => [newPulse, ...prev.slice(0, 19)]);
    setRadarVolumeDeltas((prev) => {
      const existing = prev[randomGame.id] || { units: 0, dollars: 0 };
      return {
        ...prev,
        [randomGame.id]: {
          units: existing.units + unitInc,
          dollars: existing.dollars + dollarInc,
        },
      };
    });
  }, [games]);

  useEffect(() => {
    if (!isLiveRadarStreaming) return;
    const interval = setInterval(handleLiveTick, 4500);
    return () => clearInterval(interval);
  }, [isLiveRadarStreaming, handleLiveTick]);

  // Handle simulation of tonight's slate
  const handleSimulateTonight = () => {
    playSuccessChime();
    const updated = simulateTonightOutcome();
    setBets(updated);
    showToast('Simulation Complete: Broncos won 17-14 on TNF (DEN 17, SEA 14), Dodgers ML won, ledger updated!');
  };

  // Handle reset to defaults
  const handleReset = () => {
    playBeep();
    if (window.confirm('Reset bet ledger back to verified seed recommendations?')) {
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

  // Games ranked by confidence (#1 to #10) - TO-BE-PLAYED games ONLY
  const rankedGames = useMemo(() => {
    // 1. Strictly filter to upcoming/to-be-played games only (excluding completed games like TNF)
    const upcomingList = games.filter((g) => g.status !== 'FINAL');

    // 2. Map marketOpinions if missing on any game
    const list = upcomingList.map((g) => ({
      ...g,
      marketOpinions: getUniversalGameMarketOpinions(g),
    })).filter((g) => g.marketOpinions);

    let filtered = list;

    if (confidenceFilter === 'TOP_3') {
      filtered = filtered.filter((g) => (g.marketOpinions?.overallConfidenceRank || 99) <= 3);
    } else if (confidenceFilter === 'LOCKS') {
      filtered = filtered.filter((g) => g.marketOpinions?.confidenceTier === 'MAX_LOCK' || g.marketOpinions?.confidenceTier === 'HIGH_CONVICTION');
    } else if (confidenceFilter === 'SPREAD') {
      filtered = filtered.filter((g) => g.marketOpinions?.primaryRecommendedBet === 'SPREAD');
    } else if (confidenceFilter === 'MONEYLINE') {
      filtered = filtered.filter((g) => g.marketOpinions?.primaryRecommendedBet === 'MONEYLINE');
    } else if (confidenceFilter === 'TOTAL') {
      filtered = filtered.filter((g) => g.marketOpinions?.primaryRecommendedBet === 'TOTAL');
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.homeTeam.name.toLowerCase().includes(q) ||
          g.homeTeam.city.toLowerCase().includes(q) ||
          g.awayTeam.name.toLowerCase().includes(q) ||
          g.awayTeam.city.toLowerCase().includes(q) ||
          g.marketOpinions?.executiveMatchupVerdict.toLowerCase().includes(q)
      );
    }

    const sorted = filtered.sort((a, b) => {
      const rankA = a.marketOpinions?.overallConfidenceRank || 99;
      const rankB = b.marketOpinions?.overallConfidenceRank || 99;
      return rankA - rankB;
    });

    // 3. Re-index sequentially 1 to N so no ranks are EVER skipped in the active view
    return sorted.map((g, idx) => ({
      ...g,
      displayRank: idx + 1,
    }));
  }, [games, confidenceFilter, searchTerm]);

  // Movement alerts filter
  const filteredMovementAlerts = useMemo(() => {
    if (radarSeverityFilter === 'ALL') return ACTIVE_MOVEMENT_ALERTS;
    return ACTIVE_MOVEMENT_ALERTS.filter((a) => a.severity === radarSeverityFilter);
  }, [radarSeverityFilter]);

  const activeRadarAlert = filteredMovementAlerts[activeRadarAlertIndex] || filteredMovementAlerts[0];

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border border-emerald-500 shadow-2xl flex items-center justify-between gap-3 text-white font-mono text-xs max-w-md animate-bounce">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* TOP HEADER: EDGEDETECT EXECUTIVE OVERVIEW & LEAGUE NESTING BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          {/* Breadcrumb & Sub-page Navigation Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
              {onBackToProjects && (
                <button
                  onClick={onBackToProjects}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>&larr;</span>
                  <span>My Projects</span>
                </button>
              )}
              <span className="text-slate-500">/</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                <span>⚡ EdgeDetect Hub</span>
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-white font-semibold">Executive Daily Overview</span>
            </div>

            {/* Quick League Selector Ribbon */}
            <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto no-scrollbar">
              <span className="text-slate-500 text-[11px] uppercase font-bold shrink-0">Sub-Pages:</span>
              <button
                className="px-3 py-1.5 rounded-xl font-bold bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 flex items-center gap-1.5 shrink-0"
              >
                <span>🏠</span>
                <span>Main Page (Today)</span>
              </button>

              <button
                onClick={() => {
                  playKeyClick();
                  onNavigateToLeague('NFL');
                }}
                className="px-3 py-1.5 rounded-xl font-bold bg-slate-900 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shrink-0 group"
              >
                <span>🏈</span>
                <span>NFL Sub-Page</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-600 text-[9px] text-amber-200 font-black">
                  ACTIVE
                </span>
                <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </button>

              <div className="flex items-center gap-1 text-slate-500 text-[11px] px-2 py-1 rounded-xl bg-slate-950/80 border border-slate-800/80 shrink-0">
                <span>🏀 NBA</span>
                <span className="text-[9px] text-slate-600 bg-slate-900 px-1 py-0.2 rounded">Upcoming</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-[11px] px-2 py-1 rounded-xl bg-slate-950/80 border border-slate-800/80 shrink-0">
                <span>⚾ MLB</span>
                <span className="text-[9px] text-slate-600 bg-slate-900 px-1 py-0.2 rounded">Upcoming</span>
              </div>
            </div>
          </div>

          {/* Main Title & Executive Subtext */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Live Multi-Book Odds Stream Badge */}
              <LiveOddsStreamBadge
                oddsState={oddsStreamState}
                onOpenModal={() => setShowOddsModal(true)}
              />
              {/* Active Player Roster & Depth Chart Verification Badge */}
              <LiveRosterStreamBadge
                rosterState={rosterState}
                onOpenModal={() => setShowRosterModal(true)}
              />
              {/* Active Live Verification Badge with Real Timestamp */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    playKeyClick();
                    setShowVerificationModal(true);
                  }}
                  className="px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/60 hover:border-emerald-400 text-emerald-300 font-mono text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer group"
                  title="Click to view full Live Score & Standings Verification Audit"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="font-bold">✓ Live Verified</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-white">Today ({formattedDate})</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-cyan-300 font-bold">{formattedTime}</span>
                  <span className="text-[10px] text-emerald-400 font-normal">
                    ({secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`})
                  </span>
                  <span className="text-[10px] text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                    &rarr;
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reverify();
                  }}
                  disabled={isVerifying}
                  title="Click to manually re-verify live official NFL scoreboard feed"
                  className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 hover:border-emerald-400 text-slate-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <span className={isVerifying ? 'animate-spin' : ''}>🔄</span>
                  <span className="hidden sm:inline">{isVerifying ? 'Verifying...' : 'Re-verify Live'}</span>
                </button>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              EdgeDetect: Daily Bet Recommendations &amp; Live Market Radar
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-4xl">
              Consolidated command center presenting today’s high-conviction <strong>Bet Recommendations</strong> (Spread, Moneyline &amp; Over/Under with confidence hierarchy), real-time <strong>Critical Line &amp; Money Movement Radar</strong> (unit ticket and dollar handle velocity), and a transparent <strong>Historical Performance Ledger</strong> tracking active wagers and predictive ROI.
            </p>
          </div>

          {/* Section Anchor Quick Jump Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 font-mono text-xs">
            <button
              onClick={() => {
                playKeyClick();
                setActiveMainSection('all');
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeMainSection === 'all'
                  ? 'bg-slate-200 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <span>📑 Full View</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setActiveMainSection('recommendations');
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeMainSection === 'recommendations'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border border-slate-800 text-cyan-300 hover:text-white hover:border-cyan-600'
              }`}
            >
              <span>🎯 1. Bet Recommendations of the Day</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setActiveMainSection('radar');
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeMainSection === 'radar'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
                  : 'bg-slate-900 border border-slate-800 text-amber-300 hover:text-white hover:border-amber-600'
              }`}
            >
              <span>⚡ 2. Critical Line &amp; Money Movement Radar</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setActiveMainSection('ledger');
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeMainSection === 'ledger'
                  ? 'bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-400/20'
                  : 'bg-slate-900 border border-slate-800 text-emerald-300 hover:text-white hover:border-emerald-600'
              }`}
            >
              <span>📊 3. Bet Ledger &amp; Ongoing Performance</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 font-mono text-xs border-t border-slate-800/80">
            <div
              onClick={() => {
                playKeyClick();
                onSelectGameAndInspect('nfl-bal-cle-w6', 'opinions');
              }}
              title="Click to inspect #1 Lock: Baltimore Ravens -3.5"
              className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/50 transition-all cursor-pointer space-y-0.5 group"
            >
              <span className="text-[10px] text-slate-400 group-hover:text-emerald-300 uppercase font-semibold transition-colors">Today&apos;s #1 Lock</span>
              <div className="text-emerald-400 font-bold text-sm">Ravens -3.5 (96%)</div>
            </div>
            <div
              onClick={() => {
                playKeyClick();
                onSelectGameAndInspect('nfl-bal-cle-w6', 'strategy');
              }}
              title="Click to inspect Nearest Upcoming Straight Bet: Baltimore Ravens -3.5 (Sunday Oct 18 · 1:00 PM EDT)"
              className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/50 transition-all cursor-pointer space-y-0.5 group"
            >
              <span className="text-[10px] text-cyan-400 uppercase font-semibold">Nearest Straight Bet</span>
              <div className="text-cyan-300 font-bold text-sm">Ravens -3.5 (Sun 1PM)</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
              <span className="text-[10px] text-amber-400 uppercase font-semibold">Radar Alerts</span>
              <div className="text-amber-300 font-bold text-sm">{ACTIVE_MOVEMENT_ALERTS.length} Steam Moves</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
              <span className="text-[10px] text-purple-400 uppercase font-semibold">Settled Win Rate</span>
              <div className="text-purple-300 font-bold text-sm">{summary.winRate}% (ATS)</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold">Net Units Return</span>
              <div className="text-emerald-400 font-bold text-sm">+{summary.netUnitsWon} Units</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-0.5">
              <span className="text-[10px] text-rose-400 uppercase font-semibold">League Focus</span>
              <div className="text-white font-bold text-sm flex items-center gap-1">
                <span>🏈 NFL (Active)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UNIFIED CRITICAL LINE & MONEY MOVEMENT RADAR (TOP OF DASHBOARD) */}
      <LineMovementAlertBanner
        defaultCollapsed={false}
        onSelectGame={(gameId) => onSelectGameAndInspect(gameId, 'movement')}
      />

      {/* =========================================================================
          SECTION 1: BET RECOMMENDATIONS OF THE DAY
          ========================================================================= */}
      {(activeMainSection === 'all' || activeMainSection === 'recommendations') && (
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Bet Recommendations of the Day
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 text-xs font-mono font-bold">
                  TODAY &amp; UPCOMING SLATE
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                Algorithmic betting opinions covering the <strong>Spread</strong>, <strong>Moneyline (ML)</strong>, and <strong>Over/Under Total</strong> for every game, ranked strictly from most confident (Rank #1) to least confident (Rank #10) with comprehensive tactical rationale.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs shrink-0">
              <button
                onClick={() => {
                  playKeyClick();
                  setRecommendationViewMode(
                    recommendationViewMode === 'both'
                      ? 'slate_3way'
                      : recommendationViewMode === 'slate_3way'
                      ? 'portfolios'
                      : 'both'
                  );
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>👁️ View: </span>
                <span className="text-cyan-400 uppercase font-black">
                  {recommendationViewMode === 'both' ? 'Portfolios & 3-Way Grid' : recommendationViewMode === 'portfolios' ? 'Portfolios Only' : '3-Way Slate Only'}
                </span>
              </button>

              <button
                onClick={() => {
                  playKeyClick();
                  onNavigateToLeague('NFL');
                }}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
              >
                <span>🏈 Open NFL Board</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>

          {/* 1A. STRATEGIC DAILY PORTFOLIO DECK (SINGLE / PARLAY / TEASERS) */}
          {(recommendationViewMode === 'both' || recommendationViewMode === 'portfolios') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <span className="text-amber-400">⭐</span>
                  <span>Daily Strategic Portfolios (Single Bet, 3-Leg Parlay, +10 &amp; +13 Teasers)</span>
                </span>
                <span className="text-slate-500">Formulas optimized for cross-slate mathematical edges</span>
              </div>

              <DailyBettingTiersDeck
                portfolio={DAILY_SLATE_PORTFOLIOS[0]}
                onSelectGame={(gameId) => onSelectGameAndInspect(gameId, 'strategy')}
              />
            </div>
          )}

          {/* 1B. FULL SLATE 3-WAY BET RECOMMENDATIONS (SPREAD, ML, O/U) RANKED BY CONFIDENCE */}
          {(recommendationViewMode === 'both' || recommendationViewMode === 'slate_3way') && (
            <div className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 uppercase font-bold shrink-0">Confidence Filter:</span>
                  {(['ALL', 'TOP_3', 'LOCKS', 'SPREAD', 'MONEYLINE', 'TOTAL'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        playKeyClick();
                        setConfidenceFilter(mode);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        confidenceFilter === mode
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode === 'ALL'
                        ? 'All Ranked (#1 to #10)'
                        : mode === 'TOP_3'
                        ? 'Top 3 Locks'
                        : mode === 'LOCKS'
                        ? 'Max Locks (90%+)'
                        : `${mode} Primary`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      playKeyClick();
                      setIsCompactViewMode(!isCompactViewMode);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                      isCompactViewMode
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{isCompactViewMode ? '⚡ Compact Shorthand View' : '📖 Full Rationale View'}</span>
                  </button>

                  <div className="relative min-w-[180px]">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filter by team..."
                      className="w-full px-3 py-1.5 pl-8 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
                  </div>
                </div>
              </div>

              {/* Slate Ranked Cards Grid */}
              <div className="space-y-4">
                {rankedGames.map((game) => {
                  const opinions = game.marketOpinions;
                  if (!opinions) return null;

                  const isLock = opinions.confidenceTier === 'MAX_LOCK';
                  const isHigh = opinions.confidenceTier === 'HIGH_CONVICTION';
                  const isCardExpanded = expandedGameIds[game.id] || !isCompactViewMode;
                  const lineAnalysis = analyzeGameLineMovement(game);

                  return (
                    <div
                      key={game.id}
                      className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 space-y-4 ${
                        isLock
                          ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/80 shadow-xl shadow-emerald-950/20 ring-1 ring-emerald-500/30'
                          : isHigh
                          ? 'bg-gradient-to-br from-cyan-950/30 via-slate-900 to-slate-950 border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Game Header & Rank Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-mono font-black border ${
                            isLock
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                              : isHigh
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                              : 'bg-slate-800 text-white border-slate-700'
                          }`}>
                            <span className="text-[9px] uppercase font-bold leading-none">Rank</span>
                            <span className="text-base leading-tight">#{(game as any).displayRank || opinions.overallConfidenceRank}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                {game.awayTeam.city} {game.awayTeam.name} ({game.awayTeam.record}) @ {game.homeTeam.city} {game.homeTeam.name} ({game.homeTeam.record})
                              </h3>
                              <GameStatusBadge game={game} size="xs" showIcon />
                              <span className="text-xs font-mono text-slate-400">
                                &bull; {game.scheduledTime}
                              </span>
                            </div>

                            {/* MATERIAL LINE MOVEMENT ALERT CALLOUT BADGE */}
                            {lineAnalysis.hasMaterialMovement && (
                              <div className="pt-1">
                                <button
                                  onClick={() => {
                                    playKeyClick();
                                    setInspectingLineMoveGame(game);
                                  }}
                                  className="px-2.5 py-0.5 rounded-full bg-rose-950/90 border border-rose-500 text-rose-300 font-mono text-[10px] font-bold flex items-center gap-1.5 hover:border-rose-400 transition-colors cursor-pointer"
                                >
                                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                                  <span>🚨 MATERIAL LINE MOVE:</span>
                                  <span className="text-white">{lineAnalysis.openingPoint.spread ? `${lineAnalysis.openingPoint.spread > 0 ? '+' : ''}${lineAnalysis.openingPoint.spread}` : 'Open'} &rarr; {lineAnalysis.currentPoint.spread ? `${lineAnalysis.currentPoint.spread > 0 ? '+' : ''}${lineAnalysis.currentPoint.spread}` : 'Curr'}</span>
                                  {lineAnalysis.crossedKeyNumbers.length > 0 && (
                                    <span className="text-amber-300">({lineAnalysis.crossedKeyNumbers.map((k: number) => `Crossed #${k}`).join(', ')})</span>
                                  )}
                                  <span className="text-slate-400 hover:text-white">&rarr; Inspect</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 font-mono text-xs shrink-0 self-start sm:self-auto">
                          <button
                            onClick={() => {
                              playKeyClick();
                              setInspectingLineMoveGame(game);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/60 hover:border-amber-400 text-amber-300 font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <span>📈 Lines &amp; Shifts</span>
                          </button>

                          <button
                            onClick={() => {
                              playKeyClick();
                              setExpandedGameIds((prev) => ({
                                ...prev,
                                [game.id]: !prev[game.id],
                              }));
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-cyan-500 text-cyan-300 hover:text-white font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <span>{isCardExpanded ? '▲ Collapse Details' : '▼ Expand Rationale'}</span>
                          </button>
                        </div>
                      </div>

                      {/* SHORTHAND STAT BADGES RIBBON */}
                      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                        <div className="px-2.5 py-1 rounded-xl bg-slate-950 border border-cyan-500/60 text-cyan-300 font-bold flex items-center gap-1.5">
                          <span>🎯 BEST PICK:</span>
                          <span className="text-white">
                            {opinions.primaryRecommendedBet === 'SPREAD'
                              ? `${opinions.spreadOpinion.pick} (${opinions.spreadOpinion.odds})`
                              : opinions.primaryRecommendedBet === 'MONEYLINE'
                              ? `${opinions.moneylineOpinion.pick} (${opinions.moneylineOpinion.odds})`
                              : `${opinions.totalOpinion.pick} (${opinions.totalOpinion.odds})`}
                          </span>
                          <span className="text-emerald-400">
                            +{opinions.primaryRecommendedBet === 'SPREAD' ? opinions.spreadOpinion.modelEdge : opinions.primaryRecommendedBet === 'MONEYLINE' ? opinions.moneylineOpinion.modelEdge : opinions.totalOpinion.modelEdge}% EV
                          </span>
                        </div>

                        <div className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-bold flex items-center gap-1">
                          <span>🔒</span>
                          <span>{opinions.overallConfidenceScore}% Conviction</span>
                        </div>

                        {opinions.keyFactors?.sharpMoneySignal && (
                          <div className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-purple-300 font-bold flex items-center gap-1">
                            <span>🐋</span>
                            <span>{opinions.keyFactors.sharpMoneySignal}</span>
                          </div>
                        )}

                        {opinions.keyFactors?.weatherImpactFactor && (
                          <div className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1">
                            <span>🌦️</span>
                            <span>{opinions.keyFactors.weatherImpactFactor}</span>
                          </div>
                        )}

                        {opinions.keyFactors?.injuryAdvantage && (
                          <div className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1">
                            <span>🏥</span>
                            <span>{opinions.keyFactors.injuryAdvantage}</span>
                          </div>
                        )}
                      </div>

                      {/* Executive Matchup Verdict */}
                      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 font-sans text-xs space-y-1">
                        <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider flex items-center gap-1">
                          <span>💡</span>
                          <span>Executive Verdict:</span>
                        </span>
                        <p className="text-slate-200 leading-relaxed font-medium">
                          {opinions.executiveMatchupVerdict}
                        </p>
                      </div>

                      {/* EXPANDABLE 3-WAY BET OPINIONS GRID */}
                      {isCardExpanded && (
                        <div className="space-y-4 pt-2 border-t border-slate-800/80 animate-fadeIn">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* OPINION 1: SPREAD BET */}
                            <div className={`p-4 rounded-2xl border space-y-3 font-sans transition-all ${
                              opinions.primaryRecommendedBet === 'SPREAD'
                                ? 'bg-gradient-to-b from-cyan-950/60 to-slate-950 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/20'
                                : 'bg-slate-950/50 border-slate-800/90'
                            }`}>
                              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-mono font-bold text-slate-300">SPREAD OPINION</span>
                                  {opinions.primaryRecommendedBet === 'SPREAD' && (
                                    <span className="px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 text-[9px] font-mono font-black">
                                      BEST BET
                                    </span>
                                  )}
                                </div>
                                <span className="text-amber-400 text-xs">
                                  {'★'.repeat(opinions.spreadOpinion.confidenceStars)}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-baseline justify-between">
                                  <div className="text-base font-extrabold text-white">
                                    {opinions.spreadOpinion.pick}
                                  </div>
                                  <div className="font-mono text-xs font-bold text-cyan-300">
                                    {opinions.spreadOpinion.odds}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                                  <span>Book: <span className="text-emerald-400 font-bold">{opinions.spreadOpinion.bestSportsbook}</span></span>
                                  <span className="text-emerald-400 font-bold">+{opinions.spreadOpinion.modelEdge}% EV Edge</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1 font-mono text-[11px]">
                                <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                                  opinions.spreadOpinion.verdict === 'STRONG_BUY'
                                    ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                                    : opinions.spreadOpinion.verdict === 'BUY'
                                    ? 'bg-cyan-950 border border-cyan-600 text-cyan-300'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {opinions.spreadOpinion.verdict.replace('_', ' ')}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  {opinions.spreadOpinion.confidenceRating}% Conviction
                                </span>
                              </div>

                              <div className="pt-1 border-t border-slate-800/60 text-xs text-slate-300 leading-relaxed font-normal">
                                <strong className="text-slate-400 font-mono text-[10px] block uppercase">Why We Picked Spread:</strong>
                                {opinions.spreadOpinion.rationale}
                              </div>
                            </div>

                            {/* OPINION 2: MONEYLINE (ML) BET */}
                            <div className={`p-4 rounded-2xl border space-y-3 font-sans transition-all ${
                              opinions.primaryRecommendedBet === 'MONEYLINE'
                                ? 'bg-gradient-to-b from-purple-950/60 to-slate-950 border-purple-500/80 shadow-md ring-1 ring-purple-500/20'
                                : 'bg-slate-950/50 border-slate-800/90'
                            }`}>
                              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-mono font-bold text-slate-300">MONEYLINE (ML) OPINION</span>
                                  {opinions.primaryRecommendedBet === 'MONEYLINE' && (
                                    <span className="px-1.5 py-0.2 rounded bg-purple-500 text-white text-[9px] font-mono font-black">
                                      BEST BET
                                    </span>
                                  )}
                                </div>
                                <span className="text-amber-400 text-xs">
                                  {'★'.repeat(opinions.moneylineOpinion.confidenceStars)}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-baseline justify-between">
                                  <div className="text-base font-extrabold text-white">
                                    {opinions.moneylineOpinion.pick}
                                  </div>
                                  <div className="font-mono text-xs font-bold text-purple-300">
                                    {opinions.moneylineOpinion.odds}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                                  <span>Book: <span className="text-emerald-400 font-bold">{opinions.moneylineOpinion.bestSportsbook}</span></span>
                                  <span className="text-emerald-400 font-bold">+{opinions.moneylineOpinion.modelEdge}% EV Edge</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1 font-mono text-[11px]">
                                <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                                  opinions.moneylineOpinion.verdict === 'STRONG_BUY'
                                    ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                                    : opinions.moneylineOpinion.verdict === 'BUY'
                                    ? 'bg-cyan-950 border border-cyan-600 text-cyan-300'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {opinions.moneylineOpinion.verdict.replace('_', ' ')}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  {opinions.moneylineOpinion.confidenceRating}% Conviction
                                </span>
                              </div>

                              <div className="pt-1 border-t border-slate-800/60 text-xs text-slate-300 leading-relaxed font-normal">
                                <strong className="text-slate-400 font-mono text-[10px] block uppercase">Why We Picked Moneyline:</strong>
                                {opinions.moneylineOpinion.rationale}
                              </div>
                            </div>

                            {/* OPINION 3: OVER / UNDER TOTAL BET */}
                            <div className={`p-4 rounded-2xl border space-y-3 font-sans transition-all ${
                              opinions.primaryRecommendedBet === 'TOTAL'
                                ? 'bg-gradient-to-b from-amber-950/60 to-slate-950 border-amber-500/80 shadow-md ring-1 ring-amber-500/20'
                                : 'bg-slate-950/50 border-slate-800/90'
                            }`}>
                              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-mono font-bold text-slate-300">OVER / UNDER OPINION</span>
                                  {opinions.primaryRecommendedBet === 'TOTAL' && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-mono font-black">
                                      BEST BET
                                    </span>
                                  )}
                                </div>
                                <span className="text-amber-400 text-xs">
                                  {'★'.repeat(opinions.totalOpinion.confidenceStars)}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-baseline justify-between">
                                  <div className="text-base font-extrabold text-white">
                                    {opinions.totalOpinion.pick}
                                  </div>
                                  <div className="font-mono text-xs font-bold text-amber-300">
                                    {opinions.totalOpinion.odds}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                                  <span>Book: <span className="text-emerald-400 font-bold">{opinions.totalOpinion.bestSportsbook}</span></span>
                                  <span className="text-emerald-400 font-bold">+{opinions.totalOpinion.modelEdge}% EV Edge</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1 font-mono text-[11px]">
                                <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                                  opinions.totalOpinion.verdict === 'STRONG_BUY'
                                    ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                                    : opinions.totalOpinion.verdict === 'BUY'
                                    ? 'bg-cyan-950 border border-cyan-600 text-cyan-300'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {opinions.totalOpinion.verdict.replace('_', ' ')}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  {opinions.totalOpinion.confidenceRating}% Conviction
                                </span>
                              </div>

                              <div className="pt-1 border-t border-slate-800/60 text-xs text-slate-300 leading-relaxed font-normal">
                                <strong className="text-slate-400 font-mono text-[10px] block uppercase">Why We Picked Total:</strong>
                                {opinions.totalOpinion.rationale}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          SECTION 2: CRITICAL LINE AND MONEY MOVEMENT RADAR
          ========================================================================= */}
      {(activeMainSection === 'all' || activeMainSection === 'radar') && (
        <section className="space-y-6 pt-4">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Critical Line &amp; Money Movement Radar
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-600 text-amber-300 text-xs font-mono font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>LIVE VOLUME STEAM DETECTOR</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                Monitors real-time shifts in betting volume across <strong>both Units (Ticket Count)</strong> and <strong>Dollars (Handle)</strong>. Detects rapid steam swings, reverse line movements, and line moves crossing critical NFL threshold numbers (3.0, 7.0, 10.0) before gametime.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs shrink-0">
              <button
                onClick={() => {
                  playKeyClick();
                  setIsRadarSectionExpanded(!isRadarSectionExpanded);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <span>{isRadarSectionExpanded ? '▲ Collapse Telemetry Radar' : '▼ Expand Telemetry Radar'}</span>
              </button>

              <button
                onClick={() => {
                  playKeyClick();
                  setIsLiveRadarStreaming(!isLiveRadarStreaming);
                }}
                className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isLiveRadarStreaming
                    ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isLiveRadarStreaming ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                <span>Ticker {isLiveRadarStreaming ? 'Active' : 'Paused'}</span>
              </button>

              <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-0.5">
                {(['5M', '15M', '1H'] as const).map((win) => (
                  <button
                    key={win}
                    onClick={() => {
                      playKeyClick();
                      setRadarTimeframe(win);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      radarTimeframe === win
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {win}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Brief alert explanation card while telemetry grid is collapsed */}
          {!isRadarSectionExpanded ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Active Alert Summary:</span>
                  </span>
                  <span className="text-sm font-bold text-white">
                    {ACTIVE_MOVEMENT_ALERTS[0]?.matchup || 'Seattle Seahawks @ Denver Broncos'} &mdash; {ACTIVE_MOVEMENT_ALERTS[0]?.headline || 'Heavy Sharp Whale Movement Crossing Critical 3.0 Line'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {ACTIVE_MOVEMENT_ALERTS[0]?.actionAdvice || '71% ticket volume and 84% dollar handle streaming into Seahawks -3.0 key threshold against Denver.'}{' '}
                  <span className="text-amber-300 font-semibold">Model Recommendation: Take Seahawks -3.0 before line crosses to -3.5 hook.</span>
                </p>
              </div>
              <button
                onClick={() => {
                  playKeyClick();
                  setIsRadarSectionExpanded(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition-all cursor-pointer shrink-0 shadow-md flex items-center gap-2"
              >
                <span>▼ Expand Full Telemetry &amp; Steam Charts</span>
                <span className="text-[10px] bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded font-mono">3 Active Signals</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Cols: Critical Alerts Carousel / Board */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="font-bold text-slate-300 uppercase">
                  🚨 Active Critical Line Alerts ({filteredMovementAlerts.length})
                </span>
                <div className="flex items-center gap-1">
                  {(['ALL', 'CRITICAL', 'HIGH'] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setRadarSeverityFilter(sev)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        radarSeverityFilter === sev
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMovementAlerts.map((alert, idx) => {
                const isSelected = idx === activeRadarAlertIndex;
                return (
                  <div
                    key={alert.id}
                    onClick={() => {
                      playKeyClick();
                      setActiveRadarAlertIndex(idx);
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3.5 ${
                      isSelected
                        ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/80 shadow-xl ring-1 ring-amber-500/30'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-extrabold uppercase ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-rose-950 border border-rose-600 text-rose-300'
                              : 'bg-amber-950 border border-amber-600 text-amber-300'
                          }`}>
                            {alert.severity} &bull; {alert.alertType.replace('_', ' ')}
                          </span>
                          <span className="font-mono text-xs text-slate-400">
                            {alert.scheduledTime}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white tracking-tight pt-1">
                          {alert.headline}
                        </h4>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playKeyClick();
                          const targetGame = games.find((g) => g.id === alert.gameId);
                          if (targetGame) {
                            setInspectingLineMoveGame(targetGame);
                          } else {
                            onSelectGameAndInspect(alert.gameId, 'movement');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 text-amber-300 hover:text-white font-mono text-xs font-bold transition-all shrink-0 cursor-pointer"
                      >
                        Inspect Line Movement &rarr;
                      </button>
                    </div>

                    {/* Spread & Total Delta Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Spread Movement</span>
                        <div className="text-white font-bold">{alert.spreadShift.open} &rarr; <span className="text-emerald-400">{alert.spreadShift.current}</span></div>
                        <span className="text-[10px] text-emerald-400">{alert.spreadShift.delta}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Total Movement</span>
                        <div className="text-white font-bold">{alert.totalShift.open} &rarr; <span className="text-cyan-400">{alert.totalShift.current}</span></div>
                        <span className="text-[10px] text-cyan-400">{alert.totalShift.delta} ({alert.totalShift.direction})</span>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 uppercase block">Whale Money Split</span>
                        <div className="text-amber-300 font-bold">{alert.moneyDivergence.dollarsPct}% $ vs {alert.moneyDivergence.ticketsPct}% Bets</div>
                        <span className="text-[10px] text-amber-400 font-bold">+{alert.moneyDivergence.divergenceMargin}% Syndicate Gap</span>
                      </div>
                    </div>

                    {/* Action Advice */}
                    <div className="text-xs text-slate-300 font-mono flex items-start gap-1.5 pt-1">
                      <span className="text-amber-400 shrink-0">🎯 Advice:</span>
                      <span className="text-slate-200">{alert.actionAdvice}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right 5 Cols: Live Real-Time Volume Shift Feed (Units & Dollars) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800/90 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
                      Live Volume Shift Telemetry
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                    Window: {radarTimeframe}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Real-time ticket unit count and dollar handle inflows hitting sportsbooks right now. Highlights high-roller syndicates swinging market odds.
                </p>

                {/* Live Pulses Stream */}
                <div className="space-y-2 max-h-[360px] overflow-y-auto no-scrollbar pr-1">
                  {radarPulses.map((pulse) => {
                    const isWhale = pulse.tag === 'WHALE_LIMIT';
                    return (
                      <div
                        key={pulse.id}
                        className={`p-3 rounded-xl border text-xs font-mono transition-all space-y-1 ${
                          isWhale
                            ? 'bg-emerald-950/30 border-emerald-500/60 shadow-sm'
                            : 'bg-slate-900/50 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span>{isWhale ? '🐋' : '⚡'}</span>
                            <span>{pulse.matchup}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">{pulse.timestamp}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-300 font-semibold">{pulse.targetSelection}</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-cyan-400">+{pulse.unitDelta} Units</span>
                            <span className="text-slate-500">&bull;</span>
                            <span className="text-emerald-400">+${pulse.dollarDelta.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>Book: <span className="text-slate-200">{pulse.sportsbook}</span></span>
                          <span className={`font-semibold ${isWhale ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {pulse.tag.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cumulative Volume Delta Banner */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 font-mono text-xs flex items-center justify-between gap-2">
                  <span className="text-slate-400">Active Shift Volume (Today):</span>
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span className="text-cyan-300">
                      +{Object.values(radarVolumeDeltas).reduce((a, b) => a + b.units, 0).toLocaleString()} Units
                    </span>
                    <span className="text-slate-500">&bull;</span>
                    <span className="text-emerald-400">
                      +${Object.values(radarVolumeDeltas).reduce((a, b) => a + b.dollars, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </section>
      )}

      {/* =========================================================================
          SECTION 3: HISTORICAL LOG OF BETS & CURRENT / ONGOING PERFORMANCE
          ========================================================================= */}
      {(activeMainSection === 'all' || activeMainSection === 'ledger') && (
        <section className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Historical Log of Bets &amp; Ongoing Performance
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-300 text-xs font-mono font-bold">
                  VERIFIED TRANSPARENCY
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                Full transparency ledger tracking the real-world performance of every generated bet. Displays current open/ongoing bets and settled outcomes with exact unit returns, Closing Line Value (CLV), and learned pattern adjustments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs shrink-0">
              <button
                onClick={() => {
                  playKeyClick();
                  setIsLedgerSectionExpanded(!isLedgerSectionExpanded);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
              >
                <span>{isLedgerSectionExpanded ? '▲ Collapse Ledger & Trends' : '▼ Expand Bet Ledger & Performance Trends'}</span>
              </button>

              {isLedgerSectionExpanded && (
                <>
                  <button
                    onClick={() => {
                      playKeyClick();
                      setIsPerformanceChartExpanded(!isPerformanceChartExpanded);
                    }}
                    className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 border shadow ${
                      isPerformanceChartExpanded
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>📈</span>
                    <span>{isPerformanceChartExpanded ? 'Hide Trends' : 'Show Trends'}</span>
                  </button>

                  <button
                    onClick={handleSimulateTonight}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 font-bold transition-all cursor-pointer flex items-center gap-1 shadow"
                    title="Grade finished games (TNF DEN 17, SEA 14) and re-calculate AI strategy weights"
                  >
                    <span>⚡ Sync Completed Results</span>
                  </button>

                  <button
                    onClick={() => {
                      playKeyClick();
                      setIsMonteCarloModalOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-600/80 text-purple-300 font-bold transition-all cursor-pointer flex items-center gap-1 shadow"
                    title="Run 10,000 Monte Carlo AI projections on upcoming games using weather, injuries & whale volume"
                  >
                    <span>🔮 Monte Carlo Score Simulations</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>{copiedCsv ? '✓' : '📥'}</span>
                    <span>{copiedCsv ? 'Copied' : 'Export CSV'}</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/50 text-slate-400 hover:text-red-400 font-bold transition-colors cursor-pointer"
                    title="Reset ledger to default"
                  >
                    <span>↺</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* KPI PERFORMANCE RIBBON */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Settled Record</span>
              <div className="text-white font-bold text-lg flex items-center gap-1">
                <span className="text-emerald-400">{summary.wins}W</span>
                <span className="text-slate-600">-</span>
                <span className="text-red-400">{summary.losses}L</span>
                {summary.pushes > 0 && <span className="text-slate-400">-{summary.pushes}P</span>}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-cyan-400 uppercase font-semibold">Win Rate (ATS)</span>
              <div className="text-cyan-300 font-bold text-lg">{summary.winRate}%</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold">Net Units Won</span>
              <div className={`font-bold text-lg ${summary.netUnitsWon >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {summary.netUnitsWon >= 0 ? `+${summary.netUnitsWon}` : summary.netUnitsWon} U
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-yellow-400 uppercase font-semibold">Total ROI</span>
              <div className="text-yellow-300 font-bold text-lg">+{summary.roi}%</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-purple-400 uppercase font-semibold">Profit (@ $100/U)</span>
              <div className="text-purple-300 font-bold text-lg">
                +${Math.round(summary.netUnitsWon * calculatorStake).toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-amber-400 uppercase font-semibold">Active Wagers</span>
              <div className="text-amber-300 font-bold text-lg">{ongoingBets.length} Pending</div>
            </div>
          </div>

          {/* COLLAPSED SUMMARY CARD FOR SECTION 3 */}
          {!isLedgerSectionExpanded ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-950 border border-emerald-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg font-mono text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Historical Ledger Summary:</span>
                  </span>
                  <span className="text-sm font-bold text-white">
                    {summary.wins} Wins &bull; {summary.losses} Losses &bull; +{summary.netUnitsWon} Units ({summary.winRate}% ATS)
                  </span>
                </div>
                <p className="text-slate-300 text-xs">
                  Detailed wager audit tracking all 15 settled historical slates, Closing Line Value (CLV), adaptive model pattern adjustments, and real performance trends chart.
                </p>
              </div>
              <button
                onClick={() => {
                  playKeyClick();
                  setIsLedgerSectionExpanded(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer shrink-0 shadow-md flex items-center gap-2"
              >
                <span>▼ Expand Full Bet Ledger &amp; Trends Chart</span>
                <span className="bg-slate-950 text-emerald-300 px-1.5 py-0.5 rounded text-[10px]">15 Wagers</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">

          {/* RECHARTS PERFORMANCE TRENDS CHART */}
          {isPerformanceChartExpanded && (
            <div className="p-2 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <BettingPerformanceCharts />
            </div>
          )}

          {/* 3A. CURRENT & ONGOING BETS (ACTIVE / PENDING SLATE) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span className="uppercase font-bold tracking-wider text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Current &amp; Ongoing Bets ({ongoingBets.length} Active / Pending)</span>
              </span>
              <span className="text-slate-500">Live games &amp; upcoming slates</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ongoingBets.map((bet) => (
                <div
                  key={bet.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/40 shadow-lg space-y-3 font-sans"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-950 border border-amber-600 text-amber-300">
                          {bet.legs.filter((l) => l.status === 'WON').length > 0
                            ? `IN PROGRESS • ${bet.legs.filter((l) => l.status === 'WON').length}/${bet.legs.length} CASHED`
                            : 'PENDING • ONGOING'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{bet.dateLabel}</span>
                      </div>
                      <h4 className="text-base font-bold text-white tracking-tight pt-1">
                        {bet.title}
                      </h4>
                    </div>

                    <div className="text-right font-mono text-xs">
                      <span className="text-emerald-400 font-bold block">{bet.payoutOdds}</span>
                      <span className="text-slate-400 text-[10px]">{bet.unitsStaked} U Staked</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {bet.subtitle}
                  </p>

                  {/* Legs breakdown */}
                  <div className="space-y-1.5 pt-1">
                    {bet.legs.map((leg) => (
                      <div
                        key={leg.id}
                        className={`p-2 rounded-xl bg-slate-950/80 border text-xs font-mono flex items-center justify-between ${
                          leg.status === 'WON'
                            ? 'border-emerald-600/40'
                            : leg.status === 'LOST'
                            ? 'border-rose-600/40'
                            : 'border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{leg.targetSelection}</span>
                            {leg.status === 'WON' ? (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold text-[9px]">
                                ✅ CASHED
                              </span>
                            ) : leg.status === 'LOST' ? (
                              <span className="px-1.5 py-0.2 rounded bg-rose-950 border border-rose-600 text-rose-300 font-bold text-[9px]">
                                ❌ LOST
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-600 text-amber-300 font-bold text-[9px]">
                                ⏳ PENDING
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {leg.gameMatchup} &bull; {leg.finalScore || leg.gameDate}
                          </span>
                        </div>
                        <div className="text-right text-[11px]">
                          <span className="text-emerald-400 font-bold">{leg.bestOdds}</span>
                          <span className="text-[10px] text-slate-400 block">{leg.bestSportsbook}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-1 text-[11px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80">
                    <span>Key Signal: <span className="text-cyan-300">{bet.signalsTagged.join(', ')}</span></span>
                    <span className="text-amber-400 font-bold">In Play / Upcoming</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3B. HISTORICAL LOG OF SETTLED BETS */}
          <div className="space-y-3 pt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-500 uppercase font-bold shrink-0">Filter Settled Bets:</span>
                {(['ALL', 'WON', 'LOST'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      playKeyClick();
                      setLedgerStatusFilter(st);
                    }}
                    className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                      ledgerStatusFilter === st
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'ALL' ? 'All Settled' : st}
                  </button>
                ))}
              </div>

              <div className="text-slate-400 text-xs">
                Showing {settledBets.length} settled recommendations
              </div>
            </div>

            {/* Settled Bets Table / List */}
            <div className="space-y-3">
              {settledBets.map((bet) => {
                const isWin = bet.status === 'WON';
                const isLoss = bet.status === 'LOST';

                return (
                  <div
                    key={bet.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3 font-sans ${
                      isWin
                        ? 'bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 border-emerald-500/60 shadow-md'
                        : isLoss
                        ? 'bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-950 border-rose-500/60 shadow-md'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-black uppercase ${
                          isWin
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : isLoss
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-slate-700 text-white'
                        }`}>
                          {bet.status}
                        </span>

                        <h4 className="text-base font-bold text-white tracking-tight">
                          {bet.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-xs">
                        <span className="text-slate-400">{bet.dateLabel}</span>
                        <span className={`font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {bet.unitsWonLost >= 0 ? `+${bet.unitsWonLost}` : bet.unitsWonLost} Units
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {bet.subtitle}
                    </p>

                    {/* Post-Game Analysis & Learned Takeaway */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                      {bet.postGameAnalysis && (
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <strong className="font-mono text-[10px] text-cyan-300 uppercase block">
                            🏁 Outcome Analysis:
                          </strong>
                          <p className="text-slate-300 leading-relaxed">
                            {bet.postGameAnalysis}
                          </p>
                        </div>
                      )}

                      {bet.learnedTakeaway && (
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <strong className="font-mono text-[10px] text-purple-300 uppercase block">
                            🧠 Adaptive Model Takeaway:
                          </strong>
                          <p className="text-slate-300 leading-relaxed">
                            {bet.learnedTakeaway}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
        </section>
      )}

      {/* LINE MOVEMENT DETAIL MODAL */}
      {inspectingLineMoveGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 relative">
            <GameLineMovementView
              game={inspectingLineMoveGame}
              onClose={() => setInspectingLineMoveGame(null)}
            />
          </div>
        </div>
      )}

      {/* LIVE NFL DATA VERIFICATION AUDIT MODAL */}
      <LiveVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        lastVerifiedTime={lastVerifiedTime}
        onReverify={reverify}
        isVerifying={isVerifying}
      />

      {/* LIVE ODDS STREAM & MULTI-BOOK TELEMETRY MODAL */}
      <LiveOddsStreamModal
        isOpen={showOddsModal}
        onClose={() => setShowOddsModal(false)}
        oddsState={oddsStreamState}
        games={games}
      />

      {/* LIVE ACTIVE PLAYER ROSTER & DEPTH CHART VERIFICATION AUDIT MODAL */}
      <LiveRosterVerificationModal
        isOpen={showRosterModal}
        onClose={() => setShowRosterModal(false)}
        rosterState={rosterState}
      />

      {/* MONTE CARLO AI SCENARIO SIMULATOR MODAL */}
      <MonteCarloSimulationModal
        isOpen={isMonteCarloModalOpen}
        onClose={() => setIsMonteCarloModalOpen(false)}
        games={games}
      />
    </div>
  );
};
