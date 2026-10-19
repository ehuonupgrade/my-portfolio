import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { GameMarket } from '../types/sportsBetting';
import { TrackedBetRecommendation } from '../types/sportsBettingTracker';
import { MOCK_GAMES_MARKETS } from '../data/sportsBettingData';
import { purifyAndRealignGame } from '../utils/gameAlignmentGuard';
import { getUniversalGameMarketOpinions } from '../data/nflMarketOpinionsData';
import { getTrackedBets, saveTrackedBets, recalibrateTrackedBetsWithLiveMarket, autoGradeTrackedBetsWithLiveGames } from '../utils/bettingTrackerStore';
import { getGameDisplayStatus, GameStatusMetadata, DisplayGameStatus } from '../components/common/GameStatusBadge';

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
  const [fetchCycleCount, setFetchCycleCount] = useState<number>(0);
  const [apiFetchLogs, setApiFetchLogs] = useState<ApiFetchLogEntry[]>([]);
  const [fetchSummary, setFetchSummary] = useState<FetchSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<GameStatusFilter>('ALL');

  const addFetchLog = useCallback((entry: ApiFetchLogEntry) => {
    setApiFetchLogs((prev) => [entry, ...prev.slice(0, 29)]); // keep last 30 cycles
  }, []);

  const clearApiFetchLogs = useCallback(() => {
    setApiFetchLogs([]);
  }, []);

  const fetchLiveGames = useCallback(async () => {
    const cycle = ++cycleRef.current;
    setFetchCycleCount(cycle);
    const startTime = Date.now();
    const endpoint = '/api/edgedetect/live/games';
    const isoStart = new Date().toISOString();
    const localStart = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    console.info(`[SportsDataProvider:API] 🚀 Cycle #${cycle} initiating live fetch from ${endpoint} at ${localStart}`);

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

      console.info(
        `[SportsDataProvider:API] ✅ Cycle #${cycle} response received in ${durationMs}ms with ${rawLiveGames.length} live games`
      );

      // Reconcile live feed with base games to avoid stale data
      let inProgressCount = 0;
      let completedCount = 0;
      let upcomingCount = 0;

      // 1. Process base slate with live feed synchronization
      const updatedBaseGames = MOCK_GAMES_MARKETS.map((base) => {
        const purified = purifyAndRealignGame(base);
        
        // Find corresponding live game
        const matchingLive = rawLiveGames.find(
          (lg: any) =>
            (lg.homeTeam?.abbr?.toUpperCase() === purified.homeTeam.abbr.toUpperCase() &&
              lg.awayTeam?.abbr?.toUpperCase() === purified.awayTeam.abbr.toUpperCase()) ||
            (lg.homeTeam?.abbr?.toUpperCase() === purified.awayTeam.abbr.toUpperCase() &&
              lg.awayTeam?.abbr?.toUpperCase() === purified.homeTeam.abbr.toUpperCase())
        );

        if (matchingLive) {
          // Reconcile status strictly
          const statusMeta = getGameDisplayStatus(matchingLive);
          if (statusMeta.isLive) inProgressCount++;
          else if (statusMeta.isCompleted) completedCount++;
          else upcomingCount++;

          return normalizeGameStatus({
            ...purified,
            status: matchingLive.status || (statusMeta.isCompleted ? 'FINAL' : statusMeta.isLive ? 'LIVE' : 'UPCOMING'),
            gameStatusCategory: statusMeta.label,
            statusDetail: matchingLive.statusDetail || statusMeta.detail,
            scheduledTime: matchingLive.scheduledTime || purified.scheduledTime,
            gameDate: matchingLive.gameDate || purified.gameDate,
            sportsbooks: matchingLive.sportsbooks?.length ? matchingLive.sportsbooks : purified.sportsbooks,
            consensus: matchingLive.consensus?.spread ? matchingLive.consensus : purified.consensus,
            scores: matchingLive.scores || purified.scores,
            isLiveFeed: true,
          });
        }

        // If game was not on the live board (e.g. historical settled game like Rams vs Bills or past TNF)
        const baseMeta = getGameDisplayStatus(purified);
        if (baseMeta.isCompleted) {
          completedCount++;
        } else if (baseMeta.isLive) {
          inProgressCount++;
        } else {
          upcomingCount++;
        }
        return normalizeGameStatus(purified);
      });

      // 2. Identify any live games from ESPN that weren't in base slate (e.g. ARI @ LAR, TEN @ IND, NYJ @ NE)
      const extraLiveGames: GameMarket[] = [];
      rawLiveGames.forEach((lg: any) => {
        const exists = updatedBaseGames.some(
          (bg) =>
            (bg.homeTeam.abbr.toUpperCase() === lg.homeTeam?.abbr?.toUpperCase() &&
              bg.awayTeam.abbr.toUpperCase() === lg.awayTeam?.abbr?.toUpperCase()) ||
            (bg.homeTeam.abbr.toUpperCase() === lg.awayTeam?.abbr?.toUpperCase() &&
              bg.awayTeam.abbr.toUpperCase() === lg.homeTeam?.abbr?.toUpperCase())
        );

        if (!exists && lg.homeTeam?.abbr && lg.awayTeam?.abbr) {
          const statusMeta = getGameDisplayStatus(lg);
          if (statusMeta.isLive) inProgressCount++;
          else if (statusMeta.isCompleted) completedCount++;
          else upcomingCount++;

          extraLiveGames.push(
            normalizeGameStatus({
              ...lg,
              id: lg.id || `nfl-${lg.awayTeam.abbr.toLowerCase()}-${lg.homeTeam.abbr.toLowerCase()}-w6`,
              status: lg.status || (statusMeta.isCompleted ? 'FINAL' : statusMeta.isLive ? 'LIVE' : 'UPCOMING'),
              gameStatusCategory: statusMeta.label,
              statusDetail: lg.statusDetail || statusMeta.detail,
            })
          );
        }
      });

      const finalMergedSlate = [...updatedBaseGames, ...extraLiveGames].map((g) => ({
        ...g,
        marketOpinions: getUniversalGameMarketOpinions(g),
      }));

      console.info(
        `[SportsDataProvider:API] 📊 Cycle #${cycle} Verification Summary: Total=${finalMergedSlate.length} games (In Progress: ${inProgressCount}, Completed: ${completedCount}, Upcoming: ${upcomingCount})`
      );

      setGames(finalMergedSlate);
      setTrackedBets((prev) => {
        const recalibrated = recalibrateTrackedBetsWithLiveMarket(prev, finalMergedSlate);
        const graded = autoGradeTrackedBetsWithLiveGames(recalibrated, finalMergedSlate);
        saveTrackedBets(graded);
        return graded;
      });

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
        window.dispatchEvent(
          new CustomEvent('linepulse_api_cycle_complete', {
            detail: logEntry,
          })
        );
      }
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errMsg = err?.message || 'Unknown network error';
      console.warn(`[SportsDataProvider:API:ERROR] ❌ Cycle #${cycle} failed after ${durationMs}ms:`, errMsg);

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
        totalGames: prev?.totalGames || games.length,
        inProgressCount: prev?.inProgressCount || 0,
        completedCount: prev?.completedCount || 0,
        upcomingCount: prev?.upcomingCount || 0,
        error: errMsg,
        source: 'Synchronized Local Fallback Store',
      }));
    } finally {
      setIsLoading(false);
      setLastSyncTimestamp(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }
  }, [games, addFetchLog]);

  const syncTrackedBets = useCallback(() => {
    setTrackedBets(getTrackedBets());
  }, []);

  useEffect(() => {
    fetchLiveGames();
    syncTrackedBets();

    const interval = setInterval(() => {
      fetchLiveGames();
      syncTrackedBets();
    }, 8000); // 8-second live API polling cycle

    const handleBetsEvent = () => syncTrackedBets();
    const handleStorage = () => {
      fetchLiveGames();
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
