import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GameMarket, SportsLeague } from '../types/sportsBetting';
import { MOCK_GAMES_MARKETS, PUBLIC_SPORTSBOOKS, DAILY_SLATE_PORTFOLIOS, getActiveDailyPortfolio } from '../data/sportsBettingData';
import { getUniversalGameMarketOpinions, getCleanTeamName, reassignSlateRanks } from '../data/nflMarketOpinionsData';
import { DailyBettingTiersDeck } from './DailyBettingTiersDeck';
import { BetTrackerAndPatternView } from './BetTrackerAndPatternView';
import { AnalystConsensusTracker } from './AnalystConsensusTracker';
import { BettingPerformanceCharts } from './BettingPerformanceCharts';
import { LineMovementAlertBanner } from './LineMovementAlertBanner';
import { AlertHistoryLogViewer } from './AlertHistoryLogViewer';
import { LiveNewsWireView } from './LiveNewsWireView';
import { SlateConfidenceRankingsView } from './SlateConfidenceRankingsView';
import { LiveVolumeShiftDashboard } from './LiveVolumeShiftDashboard';
import { EdgeDetectMainDashboard } from './EdgeDetectMainDashboard';
import { GameLineMovementView } from './GameLineMovementView';
import { LiveVerificationModal } from './LiveVerificationModal';
import { analyzeGameLineMovement } from '../utils/lineMovementAnalyzer';
import { useLiveVerification } from '../utils/useLiveVerification';
import { playKeyClick, playSuccessChime } from '../utils/audio';
import { fetchLiveGamesWithFallback } from '../utils/liveSportsFeed';
import { purifyAndRealignGame, auditAllGamesInSlate } from '../utils/gameAlignmentGuard';
import { useSportsData } from '../context/SportsDataContext';
import { GameStatusBadge, getGameDisplayStatus } from './common/GameStatusBadge';
import { ApiFetchDiagnosticsModal } from './common/ApiFetchDiagnosticsModal';
import { formatToLocalUserTime } from '../utils/timeZoneUtils';

interface SportsBettingEdgeHubProps {
  onBack?: () => void;
  initialSubPage?: 'main' | 'nfl';
  onSubPageChange?: (sub: 'main' | 'nfl') => void;
}

export const SportsBettingEdgeHub: React.FC<SportsBettingEdgeHubProps> = ({
  onBack,
  initialSubPage,
  onSubPageChange,
}) => {
  const [activeSubPage, setActiveSubPage] = useState<'main' | 'nfl'>(() => {
    if (initialSubPage) return initialSubPage;
    if (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('/nfl')) {
      return 'nfl';
    }
    return 'main';
  });

  useEffect(() => {
    if (initialSubPage && initialSubPage !== activeSubPage) {
      setActiveSubPage(initialSubPage);
    }
  }, [initialSubPage]);

  const switchSubPage = (page: 'main' | 'nfl') => {
    playKeyClick();
    setActiveSubPage(page);
    onSubPageChange?.(page);
    if (typeof window !== 'undefined' && window.history) {
      const newPath = page === 'nfl' ? '/myprojects/edgedetect/nfl' : '/myprojects/edgedetect';
      window.history.pushState(null, '', newPath);
    }
  };
  const [hubViewMode, setHubViewMode] = useState<'board' | 'rankings' | 'volume-shifts' | 'news' | 'analysts' | 'tracker' | 'trends' | 'logs'>('board');
  const [selectedLeague, setSelectedLeague] = useState<SportsLeague | 'ALL'>('NFL');
  const [activeGameId, setActiveGameId] = useState<string>('nfl-wsh-sf-w6');
  const [viewTab, setViewTab] = useState<'opinions' | 'strategy' | 'weather' | 'injuries' | 'news' | 'splits' | 'books' | 'movement'>('opinions');
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const {
    lastVerifiedTime,
    isVerifying,
    secondsAgo,
    formattedTime,
    formattedDate,
    reverify,
  } = useLiveVerification();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDailyPortfolio, setShowDailyPortfolio] = useState<boolean>(true);
  const [calculatorStake, setCalculatorStake] = useState<number>(100);
  const [copiedStrategy, setCopiedStrategy] = useState<boolean>(false);

  // Context-bound live data from SportsDataProvider
  const {
    games: contextGames,
    fetchCycleCount,
    fetchSummary,
    statusFilter,
    setStatusFilter,
    statusCounts,
    refreshLiveData,
    isLoading: isContextLoading,
    weekNumber,
    selectedWeek,
    setSelectedWeek,
    isAutoRolledOver,
    rolloverNotice,
  } = useSportsData();

  const [isApiDiagnosticsOpen, setIsApiDiagnosticsOpen] = useState<boolean>(false);
  const [liveAutoSync, setLiveAutoSync] = useState<boolean>(true);

  // Market games synchronized with SportsDataContext single source of truth
  const allAvailableGames = useMemo(() => {
    return reassignSlateRanks(
      contextGames.map(purifyAndRealignGame).map((g) => ({
        ...g,
        marketOpinions: g.marketOpinions || getUniversalGameMarketOpinions(g),
      }))
    );
  }, [contextGames]);

  // Filter games with Status Classification & Upcoming Slate Priority
  const filteredGames = useMemo(() => {
    const list = allAvailableGames.filter((g) => {
      if (selectedLeague !== 'ALL' && g.league !== selectedLeague) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchHome = g.homeTeam.name.toLowerCase().includes(q) || g.homeTeam.city.toLowerCase().includes(q);
        const matchAway = g.awayTeam.name.toLowerCase().includes(q) || g.awayTeam.city.toLowerCase().includes(q);
        if (!matchHome && !matchAway) return false;
      }
      if (statusFilter !== 'ALL') {
        const meta = getGameDisplayStatus(g);
        if (statusFilter === 'IN_PROGRESS' && !meta.isLive) return false;
        if (statusFilter === 'COMPLETED' && !meta.isCompleted) return false;
        if (statusFilter === 'UPCOMING' && !meta.isUpcoming) return false;
      }
      return true;
    });

    // Priority sorting: In Progress first, Upcoming games next, Completed games at bottom
    return list.sort((a, b) => {
      const metaA = getGameDisplayStatus(a);
      const metaB = getGameDisplayStatus(b);
      const getPriority = (meta: any) => {
        if (meta.isLive) return 1;
        if (meta.isUpcoming) return 2;
        return 99; // Completed
      };
      if (getPriority(metaA) !== getPriority(metaB)) {
        return getPriority(metaA) - getPriority(metaB);
      }
      return 0;
    });
  }, [allAvailableGames, selectedLeague, searchQuery, statusFilter]);

  // Active Selected Game (guarantees upcoming game focus)
  const activeGame = useMemo(() => {
    return (
      filteredGames.find((g) => g.id === activeGameId) ||
      filteredGames.find((g) => g.status !== 'FINAL') ||
      filteredGames[0] ||
      allAvailableGames[0]
    );
  }, [filteredGames, activeGameId, allAvailableGames]);

  // Identify the single game with the 1 prime strategy (must ALWAYS be an active/upcoming, unplayed game)
  const primeGame = useMemo(() => {
    // 1. Look for unplayed game explicitly marked as prime opportunity in allAvailableGames
    const activePrime = allAvailableGames.find((g) => {
      const meta = getGameDisplayStatus(g);
      return !meta.isCompleted && g.status !== 'FINAL' && g.isPrimeOpportunity && g.primeStrategy;
    });
    if (activePrime) return activePrime;

    // 2. Look for any unplayed game that has a prime strategy
    const unplayedWithStrat = allAvailableGames.find((g) => {
      const meta = getGameDisplayStatus(g);
      return !meta.isCompleted && g.status !== 'FINAL' && g.primeStrategy;
    });
    if (unplayedWithStrat) return unplayedWithStrat;

    // 3. Fallback to first unplayed upcoming game on schedule
    const nextUpcoming = allAvailableGames.find((g) => {
      const meta = getGameDisplayStatus(g);
      return !meta.isCompleted && g.status !== 'FINAL';
    });
    if (nextUpcoming) return nextUpcoming;

    // 4. Fallback if entire slate concluded
    return (
      allAvailableGames.find((g) => g.isPrimeOpportunity && g.primeStrategy) ||
      allAvailableGames[0] ||
      MOCK_GAMES_MARKETS[0]
    );
  }, [allAvailableGames]);

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

  if (activeSubPage === 'main') {
    return (
      <EdgeDetectMainDashboard
        games={allAvailableGames}
        onNavigateToLeague={(league) => {
          setActiveSubPage('nfl');
          setSelectedLeague('NFL');
          if (typeof window !== 'undefined' && window.history) {
            window.history.pushState(null, '', '/myprojects/edgedetect/nfl');
          }
        }}
        onSelectGameAndInspect={(gameId, tab) => {
          setActiveSubPage('nfl');
          setSelectedLeague('NFL');
          setActiveGameId(gameId);
          if (tab) setViewTab(tab);
          setHubViewMode('board');
          if (typeof window !== 'undefined' && window.history) {
            window.history.pushState(null, '', '/myprojects/edgedetect/nfl');
          }
        }}
        onBackToProjects={onBack}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Top Header & Breadcrumb for NFL Sub-Page (Critical Line & Movement Radar moved to Main Page) */}

      {/* Top Header & Breadcrumb for NFL Sub-Page */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl space-y-5 relative overflow-hidden backdrop-blur-md">
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>&larr;</span>
                  <span>My Projects</span>
                </button>
              )}
              <span className="text-slate-500">/</span>
              <button
                onClick={() => {
                  playKeyClick();
                  setActiveSubPage('main');
                  if (typeof window !== 'undefined' && window.history) {
                    window.history.pushState(null, '', '/myprojects/edgedetect');
                  }
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>⚡ EdgeDetect Hub</span>
              </button>
              <span className="text-slate-500">/</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span>🏈 NFL Sub-Page</span>
              </span>
            </div>

            {/* Sub-Page Navigation Switcher */}
            <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto no-scrollbar">
              <button
                onClick={() => {
                  playKeyClick();
                  setActiveSubPage('main');
                  if (typeof window !== 'undefined' && window.history) {
                    window.history.pushState(null, '', '/myprojects/edgedetect');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <span>🏠</span>
                <span>Main Page (Today&apos;s Recommendations &amp; Radar)</span>
              </button>

              <button
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md flex items-center gap-1.5 shrink-0"
              >
                <span>🏈</span>
                <span>NFL Hub (Active Focus)</span>
              </button>

              <div className="hidden md:flex items-center gap-1 text-slate-500 text-[11px] px-2 py-1 rounded-xl bg-slate-950/80 border border-slate-800/80 shrink-0">
                <span>🏀 NBA</span>
                <span className="text-[9px] text-slate-600 bg-slate-900 px-1 py-0.2 rounded">Upcoming</span>
              </div>
              <div className="hidden md:flex items-center gap-1 text-slate-500 text-[11px] px-2 py-1 rounded-xl bg-slate-950/80 border border-slate-800/80 shrink-0">
                <span>⚾ MLB</span>
                <span className="text-[9px] text-slate-600 bg-slate-900 px-1 py-0.2 rounded">Upcoming</span>
              </div>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5 flex-wrap pt-1">
            <span>EdgeDetect: NFL Intelligence Hub &amp; Markets</span>
            <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/70 text-amber-300">
              🏈 NFL Sub-Page &bull; Week {selectedWeek || weekNumber || 7} (2026 Regular Season)
            </span>
            <button
              onClick={() => {
                playKeyClick();
                setShowVerificationModal(true);
              }}
              className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/80 hover:border-emerald-400 text-emerald-300 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Verified: Today ({formattedDate}) &bull; {formattedTime} ({secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`})</span>
            </button>
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
            Dedicated league sub-page for the <strong>NFL</strong>. Aggregates live odds across 8 top sportsbooks, in-depth <strong>3-way game opinions (Spread, ML, Over/Under ranked #1 to #10)</strong>, real-time <strong>volume shift telemetry in units and dollars</strong>, tactical <strong>weather impact models</strong>, <strong>injury reports</strong>, and <strong>100% verified team records through today</strong> ({formattedDate}).
          </p>

          {/* Action & View Buttons Below Summary Text */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 font-mono text-xs">
            <button
              onClick={() => {
                playKeyClick();
                setShowVerificationModal(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 hover:text-white hover:bg-emerald-900 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
            >
              <span>✓</span>
              <span>Verify Live NFL Scores &amp; Standings</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-900 border border-emerald-600 text-[10px] text-white">
                LIVE SYNC
              </span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setHubViewMode('board');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                hubViewMode === 'board'
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-cyan-500/20'
                  : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
              }`}
            >
              <span>📊</span>
              <span>Odds Board &amp; Games</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setHubViewMode('rankings');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                hubViewMode === 'rankings'
                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-extrabold shadow-cyan-500/20'
                  : 'bg-cyan-950/70 border border-cyan-700/80 text-cyan-200 hover:text-white hover:border-cyan-500'
              }`}
            >
              <span>🎯</span>
              <span>Confidence Rankings (#1 &rarr; #10)</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-900 border border-cyan-600 text-[10px] text-cyan-100 font-black">
                OPINIONS
              </span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setHubViewMode('volume-shifts');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                hubViewMode === 'volume-shifts'
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-extrabold shadow-emerald-500/20'
                  : 'bg-emerald-950/70 border border-emerald-700/80 text-emerald-200 hover:text-white hover:border-emerald-500'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>⚡ Live Volume Shifts (Units &amp; $)</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-900 border border-emerald-600 text-[10px] text-emerald-100 font-black">
                SWINGS
              </span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setHubViewMode('news');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                hubViewMode === 'news'
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-extrabold shadow-rose-600/30'
                  : 'bg-rose-950/60 border border-rose-700/80 text-rose-200 hover:text-white hover:border-rose-500'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              <span>📰 Live News &amp; Inactives Wire</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-900 border border-rose-600 text-[10px] text-white font-black">
                LIVE
              </span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setHubViewMode('analysts');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                hubViewMode === 'analysts'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold shadow-indigo-500/30'
                  : 'bg-indigo-950/70 border border-indigo-700/80 text-indigo-200 hover:text-white hover:border-indigo-500'
              }`}
            >
              <span>🎙️</span>
              <span>Sports Analysts &amp; Contrarian Radar</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500 text-[10px] text-white font-black animate-pulse">
                FADE
              </span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setHubViewMode('trends');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                hubViewMode === 'trends'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold shadow-emerald-500/30'
                  : 'bg-emerald-950/60 border border-emerald-700/80 text-emerald-200 hover:text-white hover:border-emerald-500'
              }`}
            >
              <span>📈</span>
              <span>Performance Trends (Recharts)</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setHubViewMode('tracker');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                hubViewMode === 'tracker'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold shadow-purple-500/20'
                  : 'bg-purple-950/70 border border-purple-700/80 text-purple-200 hover:text-white hover:border-purple-500'
              }`}
            >
              <span>🧠</span>
              <span>Bet Tracker &amp; AI (Day 1)</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setHubViewMode('logs');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                hubViewMode === 'logs'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white font-extrabold shadow-rose-600/30'
                  : 'bg-rose-950/70 border border-rose-700/80 text-rose-200 hover:text-white hover:border-rose-500'
              }`}
            >
              <span>📋</span>
              <span>Historical Alert Logs</span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setHubViewMode('board');
                setShowDailyPortfolio(!showDailyPortfolio);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                hubViewMode === 'board' && showDailyPortfolio
                  ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                  : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <span>⭐</span>
              <span>Daily Portfolio Deck (4 Tiers)</span>
              <span className="text-[10px] text-slate-400">
                {showDailyPortfolio && hubViewMode === 'board' ? 'Visible' : 'Hidden'}
              </span>
            </button>

            <button
              onClick={() => {
                playKeyClick();
                setHubViewMode('board');
                setActiveGameId(primeGame.id);
                setViewTab('strategy');
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <span>🎯</span>
              <span>Prime Game Strategy</span>
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

      {/* VIEW MODES */}
      {hubViewMode === 'rankings' ? (
        <SlateConfidenceRankingsView
          games={allAvailableGames}
          onSelectGame={(gameId) => {
            setActiveGameId(gameId);
            setHubViewMode('board');
            setViewTab('opinions');
          }}
          onOpenLiveShifts={() => setHubViewMode('volume-shifts')}
        />
      ) : hubViewMode === 'volume-shifts' ? (
        <LiveVolumeShiftDashboard
          games={allAvailableGames}
          onSelectGame={(gameId) => {
            setActiveGameId(gameId);
            setHubViewMode('board');
            setViewTab('opinions');
          }}
          onOpenRankings={() => setHubViewMode('rankings')}
        />
      ) : hubViewMode === 'news' ? (
        <LiveNewsWireView
          onSelectGame={(gameId) => {
            setActiveGameId(gameId);
            setHubViewMode('board');
            setViewTab('books');
          }}
        />
      ) : hubViewMode === 'trends' ? (
        <BettingPerformanceCharts onBackToBoard={() => setHubViewMode('board')} />
      ) : hubViewMode === 'logs' ? (
        <AlertHistoryLogViewer onBackToBoard={() => setHubViewMode('board')} />
      ) : hubViewMode === 'analysts' ? (
        <AnalystConsensusTracker
          onSelectGame={(gameId) => {
            setActiveGameId(gameId);
            setHubViewMode('board');
            setViewTab('splits');
          }}
          onOpenBetTracker={() => setHubViewMode('tracker')}
        />
      ) : hubViewMode === 'tracker' ? (
        <BetTrackerAndPatternView onBackToBoard={() => setHubViewMode('board')} />
      ) : (
        <>
          {/* DAILY BETTING PORTFOLIO: 1 Single, 1 Parlay (Up to 3), 1 3-Team +10 Tease, 1 4-Team +13 Tease */}
          {showDailyPortfolio && (
            <div className="space-y-3">
              <div className="flex items-center justify-between font-mono text-xs px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white font-bold uppercase tracking-wider text-sm font-sans">
                    Daily Algorithmic Portfolio &bull; {getActiveDailyPortfolio(selectedWeek || weekNumber || 7, allAvailableGames).dateLabel}
                  </span>
                </div>
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  4 Disciplined Tiers &bull; Teasers span any 2 days in upcoming 7-day period
                </span>
              </div>

              <DailyBettingTiersDeck
                portfolio={getActiveDailyPortfolio(selectedWeek || weekNumber || 7, allAvailableGames)}
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
                  {getCleanTeamName(primeGame.awayTeam.city, primeGame.awayTeam.name)} @ {getCleanTeamName(primeGame.homeTeam.city, primeGame.homeTeam.name)}
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

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {primeGame.analystConsensus?.contrarianFadeSignal.triggered && (
                <button
                  onClick={() => {
                    playKeyClick();
                    setHubViewMode('analysts');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/60 text-indigo-200 font-bold transition-all text-xs flex items-center gap-1.5"
                >
                  <span>🎙️</span>
                  <span>Fade 80% Media Chalk</span>
                </button>
              )}
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

      {/* LIVE DATA SYNC STATUS & MULTI-BOOK ENGINE BAR */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-800/60 shadow-xl font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/80 text-emerald-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE MULTI-BOOK SYNC ACTIVE</span>
            </div>
            <span className="text-slate-300 text-xs font-bold">
              ESPN Scoreboard &amp; DraftKings Live Feed
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px]">
              6 Sportsbooks Synced
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Real-time multi-book pricing across: <span className="text-emerald-400 font-semibold">DraftKings</span> &bull; <span className="text-blue-400 font-semibold">FanDuel</span> &bull; <span className="text-orange-400 font-semibold">Pinnacle</span> (Sharp Benchmark) &bull; <span className="text-red-400 font-semibold">Circa</span> (Vegas Limits) &bull; <span className="text-amber-400 font-semibold">BetMGM</span> &bull; <span className="text-green-400 font-semibold">Caesars</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setIsApiDiagnosticsOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-mono font-bold text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow group"
            title="Inspect Live ESPN Scoreboard API Fetch Cycles, Latency, and Game Status Distribution"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-white group-hover:text-cyan-300">API Cycle #{fetchCycleCount}</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">{statusCounts.inProgress} Live</span>
            <span className="text-cyan-400">{statusCounts.upcoming} Up</span>
            <span className="text-slate-400">{statusCounts.completed} Fin</span>
            <span className="text-cyan-400 text-[10px] hidden sm:inline">&rarr; Verify</span>
          </button>

          <button
            onClick={() => {
              playSuccessChime();
              refreshLiveData();
            }}
            disabled={isContextLoading}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow disabled:opacity-50"
          >
            <span className={isContextLoading ? 'animate-spin' : ''}>🔄</span>
            <span>{isContextLoading ? 'Syncing...' : 'Sync Live'}</span>
          </button>

          <button
            onClick={() => {
              playKeyClick();
              setLiveAutoSync(!liveAutoSync);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              liveAutoSync
                ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${liveAutoSync ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>Auto-Sync {liveAutoSync ? '(30s)' : 'Off'}</span>
          </button>

          {fetchSummary?.lastSuccess && (
            <span className="text-[11px] text-slate-400 hidden lg:inline">
              Synced {fetchSummary.lastSuccess}
            </span>
          )}
        </div>
      </div>

      {/* League Selection Filter & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-slate-500 uppercase text-[11px] font-bold shrink-0">Scope:</span>
            <button
              onClick={() => {
                playKeyClick();
                setSelectedLeague('NFL');
              }}
              className="px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 bg-cyan-500 text-slate-950 shadow-md flex items-center gap-1.5"
            >
              <span>🏈</span>
              <span>NFL Week {selectedWeek || weekNumber || 7} (Active Focus)</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-900/40 text-[10px] text-slate-950 font-black">LIVE</span>
            </button>
            <span className="text-[11px] text-slate-500 hidden md:inline px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800/80">
              Non-NFL feeds paused to eliminate data source inconsistencies &bull; All 32 team records verified
            </span>
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

          {/* Quick Game Status Indicator Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono">
            <button
              onClick={() => {
                playKeyClick();
                setStatusFilter('ALL');
              }}
              className={`py-1 rounded-lg text-center font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setStatusFilter('UPCOMING');
              }}
              className={`py-1 rounded-lg text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                statusFilter === 'UPCOMING'
                  ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 shadow-sm'
                  : 'text-cyan-400 hover:text-cyan-300'
              }`}
            >
              <span>Upcoming</span>
              <span>({statusCounts.upcoming})</span>
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setStatusFilter('IN_PROGRESS');
              }}
              className={`py-1 rounded-lg text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                statusFilter === 'IN_PROGRESS'
                  ? 'bg-emerald-950 border border-emerald-500 text-emerald-300 shadow-sm'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <span>Live</span>
              <span>({statusCounts.inProgress})</span>
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setStatusFilter('COMPLETED');
              }}
              className={`py-1 rounded-lg text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                statusFilter === 'COMPLETED'
                  ? 'bg-slate-900 border border-slate-700 text-slate-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>Final</span>
              <span>({statusCounts.completed})</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredGames.map((game) => {
              const isSelected = game.id === activeGameId;
              const hasScores = (game as any).scores && ((game as any).scores.home > 0 || (game as any).scores.away > 0);
              const meta = getGameDisplayStatus(game);

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
                    <span className="flex items-center gap-1.5 font-bold flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400">
                        {game.league}
                      </span>
                      <GameStatusBadge game={game} size="xs" showIcon />
                      <span className="text-[10px] text-slate-400">{formatToLocalUserTime(game.scheduledTime)}</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {meta.isCompleted ? (
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-950 border border-slate-700 text-slate-400">
                          SETTLED &bull; FINAL
                        </span>
                      ) : game.marketOpinions ? (
                        <span
                          className={`px-2 py-0.5 rounded font-black text-[10px] flex items-center gap-1 ${
                            (game as any).displayRank === 1 || game.marketOpinions.overallConfidenceRank === 1
                              ? 'bg-cyan-500 text-slate-950 shadow-sm'
                              : (game as any).displayRank === 2 || game.marketOpinions.overallConfidenceRank === 2
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : ((game as any).displayRank || game.marketOpinions.overallConfidenceRank) <= 4
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-950 border border-slate-700 text-slate-300'
                          }`}
                        >
                          <span>{((game as any).displayRank || game.marketOpinions.overallConfidenceRank) === 1 ? '🏆' : '#'}</span>
                          <span>Rank #{(game as any).displayRank || game.marketOpinions.overallConfidenceRank} ({game.marketOpinions.overallConfidenceScore}%)</span>
                        </span>
                      ) : null}
                      {game.isPrimeOpportunity && !meta.isCompleted && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold text-[10px] animate-pulse">
                          ★ PRIME
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Matchup & Real-time scores */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-0.5">
                      <div className="text-slate-400 text-xs">{game.awayTeam.city}</div>
                      <div className="text-white font-bold flex items-center justify-between">
                        <span>{game.awayTeam.name} ({game.awayTeam.record})</span>
                        {hasScores && (
                          <span className="text-cyan-300 font-black text-base ml-2">{(game as any).scores.away}</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <div className="text-slate-400 text-xs">{game.homeTeam.city}</div>
                      <div className="text-white font-bold flex items-center justify-between">
                        {hasScores && (
                          <span className="text-cyan-300 font-black text-base mr-2">{(game as any).scores.home}</span>
                        )}
                        <span className="ml-auto">{game.homeTeam.name} ({game.homeTeam.record})</span>
                      </div>
                    </div>
                  </div>

                  {/* Weather, Injury & News Indicators on Game Slate Card */}
                  <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5 text-[10px]">
                    {game.weatherForecast && (
                      <span className={`px-2 py-0.5 rounded flex items-center gap-1 font-mono font-medium ${
                        game.weatherForecast.impactLevel === 'HIGH'
                          ? 'bg-amber-950/80 border border-amber-600/80 text-amber-300'
                          : game.weatherForecast.isDome
                          ? 'bg-blue-950/60 border border-blue-800/60 text-blue-300'
                          : 'bg-slate-950 border border-slate-800 text-slate-300'
                      }`}>
                        <span>{game.weatherForecast.isDome ? '🏟️ Dome' : '🌦️ ' + game.weatherForecast.temperature}</span>
                        <span>&bull;</span>
                        <span>{game.weatherForecast.wind}</span>
                        {game.weatherForecast.impactLevel === 'HIGH' && (
                          <span className="text-amber-400 font-bold uppercase">(HIGH WIND)</span>
                        )}
                      </span>
                    )}

                    {game.injuries && (
                      <span className={`px-2 py-0.5 rounded flex items-center gap-1 font-mono font-medium ${
                        game.injuries.totalImpactRating === 'GAME_CHANGING' || game.injuries.totalImpactRating === 'SIGNIFICANT'
                          ? 'bg-rose-950/80 border border-rose-700/80 text-rose-300'
                          : 'bg-slate-950 border border-slate-800 text-slate-300'
                      }`}>
                        <span>🏥</span>
                        <span>{game.injuries.homeInjuries.length + game.injuries.awayInjuries.length} Injuries</span>
                      </span>
                    )}

                    {game.latestNews && game.latestNews.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono font-medium flex items-center gap-1">
                        <span>📰</span>
                        <span>{game.latestNews.length} News</span>
                      </span>
                    )}

                    {game.liveVolumeShifts && (
                      <span className={`px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 ${
                        Math.abs(game.liveVolumeShifts.netSpreadSwingPct) > 50
                          ? 'bg-emerald-950/80 border border-emerald-600/80 text-emerald-300'
                          : 'bg-slate-950 border border-slate-800 text-slate-400'
                      }`}>
                        <span>⚡</span>
                        <span>{game.liveVolumeShifts.netSpreadSwingPct > 0 ? `+${game.liveVolumeShifts.netSpreadSwingPct}% ${game.awayTeam.abbr} Swing` : `+${Math.abs(game.liveVolumeShifts.netSpreadSwingPct)}% ${game.homeTeam.abbr} Swing`}</span>
                      </span>
                    )}
                  </div>

                  {/* Line summary & Handle split preview */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase">{meta.isCompleted ? 'Consensus Line:' : 'Spread / ML:'}</span>{' '}
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
                <div className="flex items-center gap-2 flex-wrap pb-1">
                  <span className="text-xs text-cyan-400 font-bold uppercase">
                    {activeGame.league} &bull; {formatToLocalUserTime(activeGame.scheduledTime)}
                  </span>
                  <GameStatusBadge game={activeGame} size="sm" showIcon />
                </div>
                <h3 className="text-xl font-bold text-white font-sans">
                  {getCleanTeamName(activeGame.awayTeam.city, activeGame.awayTeam.name)} vs. {getCleanTeamName(activeGame.homeTeam.city, activeGame.homeTeam.name)}
                </h3>
                <div className="text-xs text-slate-400">{activeGame.stadium}</div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase">Consensus Total</div>
                <div className="text-lg font-bold text-emerald-400">{activeGame.consensus.total} O/U</div>
              </div>
            </div>

            {/* Quick Telemetry: Weather & Venue, Injury Impact, Latest News Wire */}
            {/* Quick Telemetry: Weather, Injuries, News & Confidence Rank */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 font-mono text-xs">
              {/* Box 1: Weather Forecast */}
              <div
                onClick={() => setViewTab('weather')}
                className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-cyan-600/60 transition-all cursor-pointer space-y-1 group"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-bold flex items-center gap-1 group-hover:text-cyan-300 transition-colors">
                    <span>{activeGame.weatherForecast?.isDome ? '🏟️' : '🌦️'}</span>
                    <span>Weather &amp; Field</span>
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    activeGame.weatherForecast?.impactLevel === 'HIGH'
                      ? 'bg-amber-950 border border-amber-600 text-amber-300'
                      : activeGame.weatherForecast?.isDome
                      ? 'bg-blue-950 border border-blue-800 text-blue-300'
                      : 'bg-slate-900 text-slate-400'
                  }`}>
                    {activeGame.weatherForecast?.impactLevel || 'LOW'} IMPACT
                  </span>
                </div>
                <div className="text-white font-bold text-xs">
                  {activeGame.weatherForecast?.temperature || '54°F'} &bull; {activeGame.weatherForecast?.wind || 'Calm'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {activeGame.weatherForecast?.conditions || activeGame.weatherCondition || 'Normal field conditions'}
                </div>
              </div>

              {/* Box 2: Key Injuries */}
              <div
                onClick={() => setViewTab('injuries')}
                className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-rose-600/60 transition-all cursor-pointer space-y-1 group"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-bold flex items-center gap-1 group-hover:text-rose-300 transition-colors">
                    <span>🏥</span>
                    <span>Injury Report</span>
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    activeGame.injuries?.totalImpactRating === 'GAME_CHANGING'
                      ? 'bg-rose-950 border border-rose-600 text-rose-300'
                      : activeGame.injuries?.totalImpactRating === 'SIGNIFICANT'
                      ? 'bg-amber-950 border border-amber-600 text-amber-300'
                      : 'bg-slate-900 text-slate-400'
                  }`}>
                    {activeGame.injuries?.totalImpactRating || 'MINIMAL'}
                  </span>
                </div>
                <div className="text-white font-bold text-xs truncate">
                  {activeGame.injuries?.homeInjuries.find(p => p.status === 'OUT')?.player
                    ? `${activeGame.homeTeam.abbr}: ${activeGame.injuries.homeInjuries.find(p => p.status === 'OUT')?.player} (OUT)`
                    : `${activeGame.injuries?.homeInjuries.length || 0} Reported`}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {activeGame.injuries?.awayInjuries.find(p => p.status === 'OUT')?.player
                    ? `${activeGame.awayTeam.abbr}: ${activeGame.injuries.awayInjuries.find(p => p.status === 'OUT')?.player} (OUT)`
                    : `${activeGame.injuries?.awayInjuries.length || 0} Reported`}
                </div>
              </div>

              {/* Box 3: Breaking News */}
              <div
                onClick={() => setViewTab('news')}
                className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-cyan-600/60 transition-all cursor-pointer space-y-1 group"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-bold flex items-center gap-1 group-hover:text-cyan-300 transition-colors">
                    <span>📰</span>
                    <span>Latest News Wire</span>
                  </span>
                  <span className="text-[10px] text-cyan-400">
                    {activeGame.latestNews?.[0]?.timeAgo || 'Recent'}
                  </span>
                </div>
                <div className="text-white font-bold text-xs truncate">
                  {activeGame.latestNews?.[0]?.headline || 'Verified Market Lines'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Source: {activeGame.latestNews?.[0]?.source || 'NFL Wire'}
                </div>
              </div>

              {/* Box 4: Confidence Hierarchy & Opinions */}
              <div
                onClick={() => setViewTab('opinions')}
                className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500 transition-all cursor-pointer space-y-1 group"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-bold flex items-center gap-1 group-hover:text-cyan-300 transition-colors">
                    <span>🎯</span>
                    <span>Confidence Rank</span>
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    activeGame.marketOpinions?.overallConfidenceRank === 1
                      ? 'bg-cyan-500 text-slate-950'
                      : activeGame.marketOpinions?.overallConfidenceRank === 2
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-indigo-950 border border-indigo-700 text-indigo-300'
                  }`}>
                    #{activeGame.marketOpinions?.overallConfidenceRank || 1} OF 10
                  </span>
                </div>
                <div className="text-white font-bold text-xs truncate">
                  {activeGame.marketOpinions?.overallConfidenceScore || 90}% Conviction Score
                </div>
                <div className="text-[10px] text-emerald-400 truncate">
                  Top Bet: {activeGame.marketOpinions?.primaryRecommendedBet || 'SPREAD'} &bull; View 3-Way &rarr;
                </div>
              </div>
            </div>

            {/* Navigation Tabs for Active Game Details */}
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
              <button
                onClick={() => setViewTab('opinions')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  viewTab === 'opinions'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 hover:text-white'
                }`}
              >
                <span>🎯</span>
                <span>3-Way Opinions (Spread, ML, O/U)</span>
                {activeGame.marketOpinions && (
                  <span className="px-1.5 py-0.2 rounded bg-cyan-900 text-[10px] text-slate-950 font-black">
                    RANK #{activeGame.marketOpinions.overallConfidenceRank}
                  </span>
                )}
              </button>

              <button
                onClick={() => setHubViewMode('volume-shifts')}
                className="px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 hover:text-white"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>⚡ Live Volume Swings (Units &amp; $)</span>
              </button>

              <button
                onClick={() => setViewTab('strategy')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 ${
                  viewTab === 'strategy'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                🎯 1-Game Strategy
              </button>
              <button
                onClick={() => setViewTab('weather')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  viewTab === 'weather'
                    ? 'bg-cyan-500 text-slate-950'
                    : activeGame.weatherForecast?.impactLevel === 'HIGH'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-700/80'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <span>🌦️</span>
                <span>Weather &amp; Impact</span>
                {activeGame.weatherForecast?.impactLevel === 'HIGH' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
              <button
                onClick={() => setViewTab('injuries')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  viewTab === 'injuries'
                    ? 'bg-cyan-500 text-slate-950'
                    : activeGame.injuries?.totalImpactRating === 'GAME_CHANGING'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-700/80'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <span>🏥</span>
                <span>Injuries &amp; Inactives</span>
              </button>
              <button
                onClick={() => setViewTab('news')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  viewTab === 'news'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <span>📰</span>
                <span>Latest News ({activeGame.latestNews?.length || 0})</span>
              </button>
              <button
                onClick={() => setViewTab('splits')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 ${
                  viewTab === 'splits'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                📊 Bets &amp; Dollars Wagered
              </button>
              <button
                onClick={() => setViewTab('books')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 ${
                  viewTab === 'books'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                🏢 Multi-Book Line Compare ({activeGame.sportsbooks.length})
              </button>
              <button
                onClick={() => setViewTab('movement')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 ${
                  viewTab === 'movement'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                📈 Line Movement History
              </button>
            </div>

            {/* TAB CONTENT: 3-WAY OPINIONS & CONFIDENCE RANKING */}
            {viewTab === 'opinions' && (
              <div className="space-y-4 pt-1 animate-fadeIn font-mono">
                {activeGame.marketOpinions ? (
                  <div className="space-y-4">
                    {/* Header Banner */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/80 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded font-black text-xs ${
                              activeGame.marketOpinions.overallConfidenceRank === 1
                                ? 'bg-cyan-500 text-slate-950 shadow-md'
                                : activeGame.marketOpinions.overallConfidenceRank === 2
                                ? 'bg-emerald-500 text-slate-950 shadow-md'
                                : 'bg-indigo-600 text-white'
                            }`}
                          >
                            RANK #{activeGame.marketOpinions.overallConfidenceRank} OF 10
                          </span>
                          <span className="text-white font-bold text-sm">
                            {activeGame.marketOpinions.overallConfidenceScore}% Model Conviction
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            ({activeGame.marketOpinions.confidenceTier.replace(/_/g, ' ')})
                          </span>
                        </div>

                        <div className="text-xs text-emerald-400 font-bold">
                          Primary Recommended Bet: {activeGame.marketOpinions.primaryRecommendedBet}
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 font-sans leading-relaxed">
                        <span className="font-bold text-cyan-400 font-mono text-[11px] uppercase block mb-0.5">
                          Executive Angle &amp; Confidence Rationale:
                        </span>
                        {activeGame.marketOpinions.executiveMatchupVerdict}
                      </div>
                    </div>

                    {/* 3 Side-by-Side Opinion Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* SPREAD OPINION */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 uppercase font-bold">1. Spread Pick</span>
                            <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-600 text-cyan-300 font-black">
                              {activeGame.marketOpinions.spreadOpinion.verdict.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-base font-black text-white font-sans">
                            {activeGame.marketOpinions.spreadOpinion.pick}
                          </div>
                          <div className="text-xs text-emerald-400 font-bold flex items-center justify-between">
                            <span>{activeGame.marketOpinions.spreadOpinion.odds} ({activeGame.marketOpinions.spreadOpinion.bestSportsbook})</span>
                            <span>+{activeGame.marketOpinions.spreadOpinion.modelEdge}% EV</span>
                          </div>
                          <div className="text-[11px] text-slate-300 font-sans italic border-t border-slate-800/80 pt-1">
                            &ldquo;{activeGame.marketOpinions.spreadOpinion.selectionSummary}&rdquo;
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80">
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                            Why We Picked This Spread:
                          </div>
                          <p className="text-xs text-slate-300 font-sans leading-relaxed">
                            {activeGame.marketOpinions.spreadOpinion.rationale}
                          </p>
                        </div>
                      </div>

                      {/* MONEYLINE OPINION */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 uppercase font-bold">2. Moneyline Pick</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 font-black">
                              {activeGame.marketOpinions.moneylineOpinion.verdict.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-base font-black text-white font-sans">
                            {activeGame.marketOpinions.moneylineOpinion.pick}
                          </div>
                          <div className="text-xs text-emerald-400 font-bold flex items-center justify-between">
                            <span>{activeGame.marketOpinions.moneylineOpinion.odds} ({activeGame.marketOpinions.moneylineOpinion.bestSportsbook})</span>
                            <span>+{activeGame.marketOpinions.moneylineOpinion.modelEdge}% EV</span>
                          </div>
                          <div className="text-[11px] text-slate-300 font-sans italic border-t border-slate-800/80 pt-1">
                            &ldquo;{activeGame.marketOpinions.moneylineOpinion.selectionSummary}&rdquo;
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80">
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                            Why We Picked This Moneyline:
                          </div>
                          <p className="text-xs text-slate-300 font-sans leading-relaxed">
                            {activeGame.marketOpinions.moneylineOpinion.rationale}
                          </p>
                        </div>
                      </div>

                      {/* TOTAL OPINION */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 uppercase font-bold">3. Over / Under Total</span>
                            <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-600 text-purple-300 font-black">
                              {activeGame.marketOpinions.totalOpinion.verdict.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-base font-black text-white font-sans">
                            {activeGame.marketOpinions.totalOpinion.pick}
                          </div>
                          <div className="text-xs text-emerald-400 font-bold flex items-center justify-between">
                            <span>{activeGame.marketOpinions.totalOpinion.odds} ({activeGame.marketOpinions.totalOpinion.bestSportsbook})</span>
                            <span>+{activeGame.marketOpinions.totalOpinion.modelEdge}% EV</span>
                          </div>
                          <div className="text-[11px] text-slate-300 font-sans italic border-t border-slate-800/80 pt-1">
                            &ldquo;{activeGame.marketOpinions.totalOpinion.selectionSummary}&rdquo;
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80">
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                            Why We Picked This Total:
                          </div>
                          <p className="text-xs text-slate-300 font-sans leading-relaxed">
                            {activeGame.marketOpinions.totalOpinion.rationale}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Key Drivers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
                        <span className="text-slate-500 uppercase font-bold text-[10px]">🌦️ Weather Impact:</span>
                        <div className="text-slate-300 font-sans">{activeGame.marketOpinions.keyFactors.weatherImpactFactor}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
                        <span className="text-slate-500 uppercase font-bold text-[10px]">🏥 Roster / Injury Advantage:</span>
                        <div className="text-slate-300 font-sans">{activeGame.marketOpinions.keyFactors.injuryAdvantage}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
                        <span className="text-slate-500 uppercase font-bold text-[10px]">🐋 Sharp Handle Inflow:</span>
                        <div className="text-slate-300 font-sans">{activeGame.marketOpinions.keyFactors.sharpMoneySignal}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
                        <span className="text-slate-500 uppercase font-bold text-[10px]">⚔️ Scheme Matchup Edge:</span>
                        <div className="text-slate-300 font-sans">{activeGame.marketOpinions.keyFactors.schemeEdge}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    Opinions loading for this live game...
                  </div>
                )}
              </div>
            )}

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

            {/* TAB CONTENT: WEATHER FORECAST & FIELD CONDITIONS */}
            {viewTab === 'weather' && (
              <div className="space-y-4 pt-1 animate-fadeIn font-mono">
                {/* 4-Card Weather Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Temperature</div>
                    <div className="text-lg font-black text-cyan-300">
                      {activeGame.weatherForecast?.temperature || '54°F'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {activeGame.weatherForecast?.isDome ? '🏟️ Climate Dome' : '🍂 Outdoor Stadium'}
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border space-y-1 ${
                    activeGame.weatherForecast?.impactLevel === 'HIGH'
                      ? 'bg-amber-950/60 border-amber-600/80 text-amber-200'
                      : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Wind &amp; Gusts</div>
                    <div className={`text-lg font-black ${
                      activeGame.weatherForecast?.impactLevel === 'HIGH' ? 'text-amber-300' : 'text-emerald-300'
                    }`}>
                      {activeGame.weatherForecast?.wind || 'Calm'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {activeGame.weatherForecast?.impactLevel === 'HIGH' ? '⚠️ High Impact Wind' : 'Low Velocity Breeze'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Precip &amp; Humidity</div>
                    <div className="text-lg font-black text-purple-300">
                      {activeGame.weatherForecast?.precipitationChance || '0%'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Humidity: {activeGame.weatherForecast?.humidity || '35%'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Venue &amp; Altitude</div>
                    <div className="text-lg font-black text-white">
                      {activeGame.weatherForecast?.altitudeFt ? `${activeGame.weatherForecast.altitudeFt.toLocaleString()} ft` : 'Sea Level'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {activeGame.stadium.split(',')[0]}
                    </div>
                  </div>
                </div>

                {/* Tactical Game & Line Impact Analysis */}
                <div className={`p-4 rounded-xl border space-y-2.5 ${
                  activeGame.weatherForecast?.impactLevel === 'HIGH'
                    ? 'bg-amber-950/40 border-amber-600/70'
                    : 'bg-slate-950 border-cyan-800/80'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase text-white flex items-center gap-1.5">
                      <span>🌦️</span>
                      <span>Tactical Weather &amp; Market Line Impact Analysis</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      activeGame.weatherForecast?.impactLevel === 'HIGH'
                        ? 'bg-amber-900 border border-amber-500 text-amber-200 animate-pulse'
                        : activeGame.weatherForecast?.impactLevel === 'MODERATE'
                        ? 'bg-blue-950 border border-blue-700 text-blue-300'
                        : 'bg-slate-900 border border-slate-700 text-slate-300'
                    }`}>
                      {activeGame.weatherForecast?.impactLevel || 'LOW'} Impact Factor
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {activeGame.weatherForecast?.impactSummary ||
                      'Standard autumn playing conditions. Weather conditions are within normal performance thresholds with minimal distortion to passing or kicking games.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-0.5">
                      <span className="text-slate-500 text-[10px] uppercase">O/U Line Effect:</span>
                      <div className="text-white font-bold">
                        {activeGame.weatherForecast?.impactLevel === 'HIGH' ? 'Heavy Downward Total Pressure' : activeGame.weatherForecast?.isDome ? 'High Ceiling (+EV Overs)' : 'Balanced Market Pricing'}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-0.5">
                      <span className="text-slate-500 text-[10px] uppercase">Kicking Distance:</span>
                      <div className="text-white font-bold">
                        {activeGame.weatherForecast?.altitudeFt && activeGame.weatherForecast.altitudeFt > 4000 ? '+4 to +6 Yards Range' : activeGame.weatherForecast?.impactLevel === 'HIGH' ? '-5 Yards / Crosswind Risk' : 'Standard Field Goal Range'}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-0.5">
                      <span className="text-slate-500 text-[10px] uppercase">Air Yards vs. Ground:</span>
                      <div className="text-white font-bold">
                        {activeGame.weatherForecast?.impactLevel === 'HIGH' ? 'Favors Rushing Volume' : 'Clean Ball Trajectory'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Forecast Conditions: <strong className="text-white">{activeGame.weatherForecast?.conditions || activeGame.weatherCondition}</strong></span>
                  <span className="text-slate-500">Live NOAA / Stadium Sensor Sync</span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: INJURY REPORT & INACTIVES */}
            {viewTab === 'injuries' && (
              <div className="space-y-4 pt-1 animate-fadeIn font-mono">
                {/* Line Impact Analysis Callout */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  activeGame.injuries?.totalImpactRating === 'GAME_CHANGING'
                    ? 'bg-rose-950/50 border-rose-600/80'
                    : activeGame.injuries?.totalImpactRating === 'SIGNIFICANT'
                    ? 'bg-amber-950/40 border-amber-600/70'
                    : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase text-white flex items-center gap-1.5">
                      <span>🏥</span>
                      <span>Sportsbook Line Reaction &amp; Injury Impact Analysis</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      activeGame.injuries?.totalImpactRating === 'GAME_CHANGING'
                        ? 'bg-rose-900 border border-rose-500 text-rose-200'
                        : activeGame.injuries?.totalImpactRating === 'SIGNIFICANT'
                        ? 'bg-amber-900 border border-amber-500 text-amber-200'
                        : 'bg-slate-900 border border-slate-700 text-slate-300'
                    }`}>
                      {activeGame.injuries?.totalImpactRating || 'MINIMAL'} Roster Impact
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {activeGame.injuries?.lineImpactAnalysis ||
                      'Both teams entering matchup with standard practice reports. Key starters cleared with minimal spread adjustments.'}
                  </p>
                </div>

                {/* Side-by-Side Injury Tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Home Team Injuries */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeGame.homeTeam.logoColor }} />
                        <span>{getCleanTeamName(activeGame.homeTeam.city, activeGame.homeTeam.name)}</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {activeGame.injuries?.homeInjuries.length || 0} Reported
                      </span>
                    </div>

                    <div className="space-y-2">
                      {activeGame.injuries?.homeInjuries && activeGame.injuries.homeInjuries.length > 0 ? (
                        activeGame.injuries.homeInjuries.map((p, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white font-bold flex items-center gap-1.5">
                                <span>{p.player}</span>
                                <span className="text-[10px] text-slate-400 font-normal">({p.position})</span>
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                p.status === 'OUT'
                                  ? 'bg-rose-950 border border-rose-600 text-rose-300'
                                  : p.status === 'DOUBTFUL'
                                  ? 'bg-orange-950 border border-orange-600 text-orange-300'
                                  : p.status === 'QUESTIONABLE'
                                  ? 'bg-amber-950 border border-amber-600 text-amber-300'
                                  : p.status === 'IR'
                                  ? 'bg-purple-950 border border-purple-600 text-purple-300'
                                  : 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                              }`}>
                                {p.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-cyan-400">{p.injury}</div>
                            <div className="text-[10px] text-slate-400 font-sans">{p.gameImpact}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500 py-4 text-center">No major injuries listed</div>
                      )}
                    </div>
                  </div>

                  {/* Away Team Injuries */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeGame.awayTeam.logoColor }} />
                        <span>{getCleanTeamName(activeGame.awayTeam.city, activeGame.awayTeam.name)}</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {activeGame.injuries?.awayInjuries.length || 0} Reported
                      </span>
                    </div>

                    <div className="space-y-2">
                      {activeGame.injuries?.awayInjuries && activeGame.injuries.awayInjuries.length > 0 ? (
                        activeGame.injuries.awayInjuries.map((p, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white font-bold flex items-center gap-1.5">
                                <span>{p.player}</span>
                                <span className="text-[10px] text-slate-400 font-normal">({p.position})</span>
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                p.status === 'OUT'
                                  ? 'bg-rose-950 border border-rose-600 text-rose-300'
                                  : p.status === 'DOUBTFUL'
                                  ? 'bg-orange-950 border border-orange-600 text-orange-300'
                                  : p.status === 'QUESTIONABLE'
                                  ? 'bg-amber-950 border border-amber-600 text-amber-300'
                                  : p.status === 'IR'
                                  ? 'bg-purple-950 border border-purple-600 text-purple-300'
                                  : 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                              }`}>
                                {p.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-cyan-400">{p.injury}</div>
                            <div className="text-[10px] text-slate-400 font-sans">{p.gameImpact}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500 py-4 text-center">No major injuries listed</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: LATEST NEWS WIRE */}
            {viewTab === 'news' && (
              <div className="space-y-3.5 pt-1 animate-fadeIn font-mono">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Verified breaking news &amp; beat writer reports for this matchup:</span>
                  <button
                    onClick={() => setHubViewMode('news')}
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                  >
                    Open Full News Wire &rarr;
                  </button>
                </div>

                <div className="space-y-2.5">
                  {activeGame.latestNews && activeGame.latestNews.length > 0 ? (
                    activeGame.latestNews.map((n) => (
                      <div key={n.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            n.relevance === 'CRITICAL_LINE_MOVE'
                              ? 'bg-rose-950 border border-rose-600 text-rose-300'
                              : n.relevance === 'INJURY_UPDATE'
                              ? 'bg-amber-950 border border-amber-600 text-amber-300'
                              : 'bg-slate-900 border border-slate-700 text-cyan-300'
                          }`}>
                            {n.relevance.replace(/_/g, ' ')}
                          </span>
                          <span className="text-slate-500 text-[10px]">{n.timeAgo} &bull; {n.source}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white font-sans">{n.headline}</h4>
                        <p className="text-xs text-slate-400 font-sans leading-relaxed">{n.summary}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      No urgent news articles recorded for this matchup in the past 24 hours.
                    </div>
                  )}
                </div>
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
              <div className="space-y-4 pt-1 animate-fadeIn">
                {/* Live Multi-Book Summary Banner */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-white font-bold uppercase tracking-wider text-[11px]">
                        Multi-Book Best Execution Pricing
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-[10px]">
                        Live Arbitrage / Steam Engine
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      Top prices dynamically highlighted. Sharp benchmark books (Pinnacle &amp; Circa) show true market juice (-104 / -105) vs recreational books.
                    </div>
                  </div>

                  <button
                    onClick={() => refreshLiveData()}
                    disabled={isContextLoading}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span className={isContextLoading ? 'animate-spin' : ''}>🔄</span>
                    <span>Refresh Books</span>
                  </button>
                </div>

                {/* Best Market Prices Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-800/60 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase block">Best {activeGame.awayTeam.abbr} Spread</span>
                    <span className="text-emerald-400 font-bold text-sm block">
                      +{activeGame.sportsbooks[0]?.spreadAway || 3.5} (-108)
                    </span>
                    <span className="text-[10px] text-slate-400">FanDuel / Pinnacle</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-cyan-800/60 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase block">Best {activeGame.homeTeam.abbr} Spread</span>
                    <span className="text-cyan-400 font-bold text-sm block">
                      {activeGame.sportsbooks[0]?.spreadHome || -3.5} (-105)
                    </span>
                    <span className="text-[10px] text-slate-400">Pinnacle (Reduced Vig)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-purple-800/60 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase block">Best Total Under</span>
                    <span className="text-purple-300 font-bold text-sm block">
                      Under {activeGame.consensus.total} (-105)
                    </span>
                    <span className="text-[10px] text-slate-400">Pinnacle / Circa</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-800/60 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase block">Best Dog ML</span>
                    <span className="text-amber-300 font-bold text-sm block">
                      {activeGame.awayTeam.abbr} +154
                    </span>
                    <span className="text-[10px] text-slate-400">DraftKings / Circa</span>
                  </div>
                </div>

                {/* Multi-Book Comparison Table */}
                <div className="overflow-x-auto no-scrollbar rounded-xl border border-slate-800 bg-slate-950/40">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 text-[11px]">
                        <th className="py-2.5 px-3">Sportsbook</th>
                        <th className="py-2.5 px-3">{activeGame.awayTeam.abbr} Spread</th>
                        <th className="py-2.5 px-3">{activeGame.homeTeam.abbr} Spread</th>
                        <th className="py-2.5 px-3">Over / Under</th>
                        <th className="py-2.5 px-3">{activeGame.awayTeam.abbr} ML</th>
                        <th className="py-2.5 px-3">{activeGame.homeTeam.abbr} ML</th>
                        <th className="py-2.5 px-3">Book Type</th>
                        <th className="py-2.5 px-3">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activeGame.sportsbooks.map((b) => {
                        const isSharp = b.bookName === 'Pinnacle' || b.bookName === 'Circa Sports';
                        const isLivePrimary = b.bookName === 'DraftKings';

                        return (
                          <tr key={b.bookName} className="hover:bg-slate-900/60 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isLivePrimary
                                    ? 'bg-emerald-400 animate-pulse'
                                    : isSharp
                                    ? 'bg-amber-400'
                                    : 'bg-cyan-400'
                                }`}
                              />
                              <span>{b.bookName}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              +{b.spreadAway} ({b.spreadAwayOdds})
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={
                                  b.isBestSpreadHome
                                    ? 'px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold'
                                    : 'text-slate-300'
                                }
                              >
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
                              <span
                                className={
                                  b.isBestMoneylineHome
                                    ? 'px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold'
                                    : 'text-slate-300'
                                }
                              >
                                {b.moneylineHome > 0 ? `+${b.moneylineHome}` : b.moneylineHome}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  isLivePrimary
                                    ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                                    : isSharp
                                    ? 'bg-amber-950 border border-amber-700 text-amber-300'
                                    : 'bg-slate-900 border border-slate-700 text-slate-400'
                                }`}
                              >
                                {isLivePrimary ? '⚡ Live Feed' : isSharp ? '🎯 Sharp Market' : 'Retail Book'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[10px] text-slate-500">
                              {b.lastUpdated}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: LINE MOVEMENT HISTORY & MATERIAL SHIFTS */}
            {viewTab === 'movement' && (
              <div className="pt-1 animate-fadeIn">
                <GameLineMovementView game={activeGame} />
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}
      {/* LIVE VERIFICATION MODAL */}
      <LiveVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        lastVerifiedTime={lastVerifiedTime}
        onReverify={reverify}
        isVerifying={isVerifying}
      />
      {/* API FETCH CYCLE TELEMETRY & STATUS DIAGNOSTICS MODAL */}
      <ApiFetchDiagnosticsModal
        isOpen={isApiDiagnosticsOpen}
        onClose={() => setIsApiDiagnosticsOpen(false)}
      />
    </div>
  );
};
