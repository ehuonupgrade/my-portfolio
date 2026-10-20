import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { GameMarket } from '../types/sportsBetting';
import { TrackedBetRecommendation } from '../types/sportsBettingTracker';
import { MOCK_GAMES_MARKETS } from '../data/sportsBettingData';
import { purifyAndRealignGame } from '../utils/gameAlignmentGuard';
import { getUniversalGameMarketOpinions } from '../data/nflMarketOpinionsData';
import { getTrackedBets, saveTrackedBets, recalibrateTrackedBetsWithLiveMarket, autoGradeTrackedBetsWithLiveGames } from '../utils/bettingTrackerStore';
import { getGameDisplayStatus, GameStatusMetadata, DisplayGameStatus } from '../components/common/GameStatusBadge';
import { fetchLiveGamesWithFallback } from '../utils/liveSportsFeed';

export interface ApiFetchLogEntry {
  id: string;
  cycle: number;
  timestamp: string; // ISO
  localTime: string;
  status: 'SUCCESS' | 'ERROR';
  durationMs: number;
  totalGames: number;
  inProgressCount: number;
  completedCount: number;
  upcomingCount: number;
  endpoint: string;
  message: string;
  source: string;
}

export interface FetchSummary {
  cycle: number;
  lastAttempt: string;
  lastSuccess: string | null;
  status: 'IDLE' | 'FETCHING' | 'SUCCESS' | 'ERROR';
  latencyMs: number;
  totalGames: number;
  inProgressCount: number;
  completedCount: number;
  upcomingCount: number;
  error?: string;
  source: string;
}

export type GameStatusFilter = 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'UPCOMING';

interface SportsDataContextType {
  games: GameMarket[];
  filteredGames: GameMarket[];
  trackedBets: TrackedBetRecommendation[];
  isLoading: boolean;
  lastSyncTimestamp: string;
  refreshLiveData: () => Promise<void>;
  getGameById: (id: string) => GameMarket | undefined;
  getGameByMatchup: (query: string) => GameMarket | undefined;
  // Live API Fetch Cycle Verification & Diagnostics
  fetchCycleCount: number;
  apiFetchLogs: ApiFetchLogEntry[];
  fetchSummary: FetchSummary | null;
  clearApiFetchLogs: () => void;
  // Status Indicator Filter & Counts
  statusFilter: GameStatusFilter;
  setStatusFilter: (filter: GameStatusFilter) => void;
  statusCounts: {
    all: number;
    inProgress: number;
    completed: number;
    upcoming: number;
  };
  getGameStatus: (game?: Partial<GameMarket> | any) => GameStatusMetadata;
  // Dynamic NFL Week Progression & Rollover State
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  availableWeeks: number[];
  weekNumber: number;
  isAutoRolledOver: boolean;
  rolloverNotice: string | null;
}

const SportsDataContext = createContext<SportsDataContextType | undefined>(undefined);

export interface SportsDataProviderProps {
  children: ReactNode;
}

/**
 * Normalizes a game's status to ensure UI consistency
 */
function normalizeGameStatus(game: GameMarket): GameMarket {
  const meta = getGameDisplayStatus(game);
  const normalizedCategory: DisplayGameStatus = meta.label;
  const normalizedMarketStatus = meta.isCompleted ? 'FINAL' : meta.isLive ? 'LIVE' : 'UPCOMING';

  return {
    ...game,
    status: normalizedMarketStatus,
    gameStatusCategory: normalizedCategory,
    statusDetail: meta.detail,
  };
}

export const SportsDataProvider: React.FC<SportsDataProviderProps> = ({ children }) => {
  const [games, setGames] = useState<GameMarket[]>(() =>
    MOCK_GAMES_MARKETS.map(purifyAndRealignGame).map(normalizeGameStatus)
  );
  const [trackedBets, setTrackedBets] = useState<TrackedBetRecommendation[]>(() =>
    getTrackedBets()
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Live API Fetch Cycle verification state
  const cycleRef = useRef<number>(0);
  const inFlightRef = useRef<boolean>(false);
  const [fetchCycleCount, setFetchCycleCount] = useState<number>(0);
  const [apiFetchLogs, setApiFetchLogs] = useState<ApiFetchLogEntry[]>([]);
  const [fetchSummary, setFetchSummary] = useState<FetchSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<GameStatusFilter>('ALL');

  // Dynamic NFL Week Progression & Rollover State
  const [selectedWeek, setSelectedWeekState] = useState<number>(7);
  const selectedWeekRef = useRef<number>(7);
  const [weekNumber, setWeekNumber] = useState<number>(7);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([6, 7]);
  const [isAutoRolledOver, setIsAutoRolledOver] = useState<boolean>(true);
  const [rolloverNotice, setRolloverNotice] = useState<string | null>(
    'NFL Week 6 concluded with Monday Night Football. Automatically advanced to active NFL Week 7 upcoming slate (14 matchups).'
  );

  const gamesRef = useRef<GameMarket[]>(games);
  useEffect(() => {
    gamesRef.current = games;
  }, [games]);

  const addFetchLog = useCallback((entry: ApiFetchLogEntry) => {
    setApiFetchLogs((prev) => [entry, ...prev.slice(0, 29)]); // keep last 30 cycles
  }, []);

  const clearApiFetchLogs = useCallback(() => {
    setApiFetchLogs([]);
  }, []);

  const fetchLiveGames = useCallback(async (targetWeekOverride?: number) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const cycle = ++cycleRef.current;
    setFetchCycleCount(cycle);
    const startTime = Date.now();
    const weekToFetch = targetWeekOverride !== undefined ? targetWeekOverride : selectedWeekRef.current;
    const endpoint = weekToFetch ? `/api/edgedetect/live/games?week=${weekToFetch}` : '/api/edgedetect/live/games';
    const isoStart = new Date().toISOString();
    const localStart = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    console.info(`[SportsDataProvider:API] 🚀 Cycle #${cycle} initiating live fetch from ${endpoint} (Week ${weekToFetch}) at ${localStart}`);

    try {
      setIsLoading(true);
      setFetchSummary((prev) => ({
        cycle,
        lastAttempt: localStart,
        lastSuccess: prev?.lastSuccess || null,
        status: 'FETCHING',
        latencyMs: 0,
        totalGames: prev?.totalGames || 0,
        inProgressCount: prev?.inProgressCount || 0,
        completedCount: prev?.completedCount || 0,
        upcomingCount: prev?.upcomingCount || 0,
        source: 'ESPN NFL Scoreboard API (Site API v2)',
      }));

      const res = await fetch(endpoint);
      const durationMs = Date.now() - startTime;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const rawLiveGames = Array.isArray(data.games) ? data.games : [];
      const activeWeek = data.weekNumber || weekToFetch || 7;

      setWeekNumber(activeWeek);
      if (Array.isArray(data.availableWeeks)) {
        setAvailableWeeks(data.availableWeeks);
      }
      if (data.isAutoRolledOver !== undefined) {
        setIsAutoRolledOver(data.isAutoRolledOver);
      }
      if (data.rolloverNotice !== undefined) {
        setRolloverNotice(data.rolloverNotice);
      }

      console.info(
        `[SportsDataProvider:API] ✅ Cycle #${cycle} response received in ${durationMs}ms for Week ${activeWeek} with ${rawLiveGames.length} games`
      );

      let inProgressCount = 0;
      let completedCount = 0;
      let upcomingCount = 0;
      let finalMergedSlate: GameMarket[] = [];

      if (rawLiveGames.length > 0) {
        // Construct live slate directly from active week live games
        finalMergedSlate = rawLiveGames.map((lg: any) => {
          const statusMeta = getGameDisplayStatus(lg);
          if (statusMeta.isLive) inProgressCount++;
          else if (statusMeta.isCompleted) completedCount++;
          else upcomingCount++;

          const normalized = normalizeGameStatus({
            ...lg,
            id: lg.id || `nfl-${lg.awayTeam?.abbr?.toLowerCase() || 'away'}-${lg.homeTeam?.abbr?.toLowerCase() || 'home'}-w${activeWeek}`,
            gameStatusCategory: statusMeta.label,
            statusDetail: lg.statusDetail || statusMeta.detail,
            isLiveFeed: true,
          });

          return {
            ...normalized,
            marketOpinions: getUniversalGameMarketOpinions(normalized),
          };
        });
      } else {
        // Fallback to base mock slate
        finalMergedSlate = MOCK_GAMES_MARKETS.map(purifyAndRealignGame).map(normalizeGameStatus).map((g) => ({
          ...g,
          marketOpinions: getUniversalGameMarketOpinions(g),
        }));
        upcomingCount = finalMergedSlate.filter((g) => getGameDisplayStatus(g).isUpcoming).length;
        completedCount = finalMergedSlate.filter((g) => getGameDisplayStatus(g).isCompleted).length;
        inProgressCount = finalMergedSlate.filter((g) => getGameDisplayStatus(g).isLive).length;
      }

      console.info(
        `[SportsDataProvider:API] 📊 Cycle #${cycle} Verification Summary: Week=${activeWeek}, Total=${finalMergedSlate.length} games (In Progress: ${inProgressCount}, Completed: ${completedCount}, Upcoming: ${upcomingCount})`
      );

      setGames(finalMergedSlate);
      // Compute recalibrated and auto-graded bets outside state updater
      const currentTracked = getTrackedBets();
      const recalibrated = recalibrateTrackedBetsWithLiveMarket(currentTracked, finalMergedSlate);
      const graded = autoGradeTrackedBetsWithLiveGames(recalibrated, finalMergedSlate);
      saveTrackedBets(graded);
      setTrackedBets(graded);

      const logEntry: ApiFetchLogEntry = {
        id: `fetch-${cycle}-${Date.now()}`,
        cycle,
        timestamp: isoStart,
        localTime: localStart,
        status: 'SUCCESS',
        durationMs,
        totalGames: finalMergedSlate.length,
        inProgressCount,
        completedCount,
        upcomingCount,
        endpoint,
        message: `Successfully synchronized ${finalMergedSlate.length} NFL games from ESPN API scoreboard with multi-book pricing.`,
        source: data.source || 'ESPN Scoreboard Live Feed',
      };

      addFetchLog(logEntry);

      setFetchSummary({
        cycle,
        lastAttempt: localStart,
        lastSuccess: localStart,
        status: 'SUCCESS',
        latencyMs: durationMs,
        totalGames: finalMergedSlate.length,
        inProgressCount,
        completedCount,
        upcomingCount,
        source: data.source || 'ESPN Scoreboard & DraftKings Feed',
      });

      // Dispatch custom event for UI components listening for API synchronization
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('linepulse_api_cycle_complete', {
              detail: logEntry,
            })
          );
        }, 0);
      }
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errMsg = err?.message || 'Unknown network error';
      console.warn(`[SportsDataProvider:API] Express endpoint unavailable (${errMsg}). Executing direct client-side ESPN Scoreboard API failover for static hosting (e.g. GitHub Pages)...`);

      try {
        const fallback = await fetchLiveGamesWithFallback();
        if (fallback && fallback.games && fallback.games.length > 0) {
          const finalMergedSlate = fallback.games.map(purifyAndRealignGame).map(normalizeGameStatus).map((g) => ({
            ...g,
            marketOpinions: getUniversalGameMarketOpinions(g),
          }));

          setGames(finalMergedSlate);
          const currentTracked = getTrackedBets();
          const recalibrated = recalibrateTrackedBetsWithLiveMarket(currentTracked, finalMergedSlate);
          const graded = autoGradeTrackedBetsWithLiveGames(recalibrated, finalMergedSlate);
          saveTrackedBets(graded);
          setTrackedBets(graded);

          const inProg = finalMergedSlate.filter((g) => getGameDisplayStatus(g).isLive).length;
          const comp = finalMergedSlate.filter((g) => getGameDisplayStatus(g).isCompleted).length;
          const upc = finalMergedSlate.filter((g) => getGameDisplayStatus(g).isUpcoming).length;

          const logEntry: ApiFetchLogEntry = {
            id: `fetch-${cycle}-${Date.now()}`,
            cycle,
            timestamp: isoStart,
            localTime: localStart,
            status: 'SUCCESS',
            durationMs,
            totalGames: finalMergedSlate.length,
            inProgressCount: inProg,
            completedCount: comp,
            upcomingCount: upc,
            endpoint: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard (Direct Client Failover)',
            message: `GitHub Pages Direct Client Failover: Successfully synchronized ${finalMergedSlate.length} NFL games directly from ESPN Scoreboard API.`,
            source: fallback.source || 'ESPN Scoreboard Direct Client Feed',
          };

          addFetchLog(logEntry);

          setFetchSummary({
            cycle,
            lastAttempt: localStart,
            lastSuccess: localStart,
            status: 'SUCCESS',
            latencyMs: durationMs,
            totalGames: finalMergedSlate.length,
            inProgressCount: inProg,
            completedCount: comp,
            upcomingCount: upc,
            source: fallback.source || 'ESPN Scoreboard Direct Client Feed',
          });

          return;
        }
      } catch (fallbackErr) {
        console.error('[SportsDataProvider:API] Direct client fallback failed as well:', fallbackErr);
      }

      const logEntry: ApiFetchLogEntry = {
        id: `fetch-${cycle}-${Date.now()}`,
        cycle,
        timestamp: isoStart,
        localTime: localStart,
        status: 'ERROR',
        durationMs,
        totalGames: games.length,
        inProgressCount: games.filter((g) => getGameDisplayStatus(g).isLive).length,
        completedCount: games.filter((g) => getGameDisplayStatus(g).isCompleted).length,
        upcomingCount: games.filter((g) => getGameDisplayStatus(g).isUpcoming).length,
        endpoint,
        message: `API fetch error: ${errMsg}. Maintained synchronized fallback slate with active guardrails.`,
        source: 'Synchronized Local Sportsbook Store',
      };

      addFetchLog(logEntry);

      setFetchSummary((prev) => ({
        cycle,
        lastAttempt: localStart,
        lastSuccess: prev?.lastSuccess || null,
        status: 'ERROR',
        latencyMs: durationMs,
        totalGames: prev?.totalGames || gamesRef.current.length || MOCK_GAMES_MARKETS.length,
        inProgressCount: prev?.inProgressCount || 0,
        completedCount: prev?.completedCount || 0,
        upcomingCount: prev?.upcomingCount || 0,
        error: errMsg,
        source: 'Synchronized Local Fallback Store',
      }));
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
      setLastSyncTimestamp(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }
  }, [addFetchLog]);

  const syncTrackedBets = useCallback(() => {
    setTrackedBets(getTrackedBets());
  }, []);

  useEffect(() => {
    fetchLiveGames();
    syncTrackedBets();

    const interval = setInterval(() => {
      fetchLiveGames();
      syncTrackedBets();
    }, 30000); // Clean 30-second live API polling cycle

    const handleBetsEvent = () => syncTrackedBets();
    const handleStorage = () => {
      syncTrackedBets();
    };

    window.addEventListener('linepulse_bets_updated', handleBetsEvent);
    window.addEventListener('linepulse_live_sync', handleStorage);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('linepulse_bets_updated', handleBetsEvent);
      window.removeEventListener('linepulse_live_sync', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchLiveGames, syncTrackedBets]);

  const setSelectedWeek = useCallback(
    (week: number) => {
      setSelectedWeekState(week);
      selectedWeekRef.current = week;
      fetchLiveGames(week);
    },
    [fetchLiveGames]
  );

  const getGameById = useCallback(
    (id: string): GameMarket | undefined => {
      return games.find((g) => g.id === id);
    },
    [games]
  );

  const getGameByMatchup = useCallback(
    (query: string): GameMarket | undefined => {
      const q = query.toLowerCase();
      return games.find(
        (g) =>
          g.id.toLowerCase().includes(q) ||
          g.homeTeam.abbr.toLowerCase().includes(q) ||
          g.awayTeam.abbr.toLowerCase().includes(q) ||
          g.homeTeam.name.toLowerCase().includes(q) ||
          g.awayTeam.name.toLowerCase().includes(q)
      );
    },
    [games]
  );

  // Status counts calculation
  const statusCounts = useMemo(() => {
    let inProgress = 0;
    let completed = 0;
    let upcoming = 0;

    games.forEach((g) => {
      const meta = getGameDisplayStatus(g);
      if (meta.isLive) inProgress++;
      else if (meta.isCompleted) completed++;
      else upcoming++;
    });

    return {
      all: games.length,
      inProgress,
      completed,
      upcoming,
    };
  }, [games]);

  // Filtered games based on active statusFilter
  const filteredGames = useMemo(() => {
    if (statusFilter === 'ALL') return games;
    return games.filter((g) => {
      const meta = getGameDisplayStatus(g);
      if (statusFilter === 'IN_PROGRESS') return meta.isLive;
      if (statusFilter === 'COMPLETED') return meta.isCompleted;
      if (statusFilter === 'UPCOMING') return meta.isUpcoming;
      return true;
    });
  }, [games, statusFilter]);

  return (
    <SportsDataContext.Provider
      value={{
        games,
        filteredGames,
        trackedBets,
        isLoading,
        lastSyncTimestamp,
        refreshLiveData: fetchLiveGames,
        getGameById,
        getGameByMatchup,
        fetchCycleCount,
        apiFetchLogs,
        fetchSummary,
        clearApiFetchLogs,
        statusFilter,
        setStatusFilter,
        statusCounts,
        getGameStatus: getGameDisplayStatus,
        selectedWeek,
        setSelectedWeek,
        availableWeeks,
        weekNumber,
        isAutoRolledOver,
        rolloverNotice,
      }}
    >
      {children}
    </SportsDataContext.Provider>
  );
};

export const useSportsData = (): SportsDataContextType => {
  const context = useContext(SportsDataContext);
  if (!context) {
    throw new Error('useSportsData must be used within a SportsDataProvider');
  }
  return context;
};
