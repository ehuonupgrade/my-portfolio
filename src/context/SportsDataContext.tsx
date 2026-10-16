import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { GameMarket } from '../types/sportsBetting';
import { TrackedBetRecommendation } from '../types/sportsBettingTracker';
import { MOCK_GAMES_MARKETS } from '../data/sportsBettingData';
import { purifyAndRealignGame } from '../utils/gameAlignmentGuard';
import { getTrackedBets } from '../utils/bettingTrackerStore';

interface SportsDataContextType {
  games: GameMarket[];
  trackedBets: TrackedBetRecommendation[];
  isLoading: boolean;
  lastSyncTimestamp: string;
  refreshLiveData: () => Promise<void>;
  getGameById: (id: string) => GameMarket | undefined;
  getGameByMatchup: (query: string) => GameMarket | undefined;
}

const SportsDataContext = createContext<SportsDataContextType | undefined>(undefined);

export interface SportsDataProviderProps {
  children: ReactNode;
}

export const SportsDataProvider: React.FC<SportsDataProviderProps> = ({ children }) => {
  const [games, setGames] = useState<GameMarket[]>(() =>
    MOCK_GAMES_MARKETS.map(purifyAndRealignGame)
  );
  const [trackedBets, setTrackedBets] = useState<TrackedBetRecommendation[]>(() =>
    getTrackedBets()
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const fetchLiveGames = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/edgedetect/live/games');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.games) && data.games.length > 0) {
          // Merge live feed scores & odds INTO MOCK_GAMES_MARKETS so marketOpinions and Rank #1..#10 hierarchy are NEVER lost
          const merged = MOCK_GAMES_MARKETS.map((base) => {
            const purified = purifyAndRealignGame(base);
            const matchingLive = data.games.find(
              (lg: any) =>
                (lg.homeTeam?.abbr?.toUpperCase() === purified.homeTeam.abbr.toUpperCase() &&
                  lg.awayTeam?.abbr?.toUpperCase() === purified.awayTeam.abbr.toUpperCase()) ||
                (lg.homeTeam?.abbr?.toUpperCase() === purified.awayTeam.abbr.toUpperCase() &&
                  lg.awayTeam?.abbr?.toUpperCase() === purified.homeTeam.abbr.toUpperCase())
            );

            if (matchingLive) {
              return {
                ...purified,
                status: matchingLive.status || purified.status,
                scheduledTime: matchingLive.scheduledTime || purified.scheduledTime,
                sportsbooks: matchingLive.sportsbooks?.length ? matchingLive.sportsbooks : purified.sportsbooks,
                consensus: matchingLive.consensus?.spread ? matchingLive.consensus : purified.consensus,
                scores: matchingLive.scores || purified.scores,
                isLiveFeed: true,
              };
            }
            return purified;
          });
          setGames(merged);
        }
      }
    } catch (err) {
      console.warn('SportsDataProvider: fallback to synchronized local store', err);
    } finally {
      setIsLoading(false);
      setLastSyncTimestamp(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }
  }, []);

  const syncTrackedBets = useCallback(() => {
    setTrackedBets(getTrackedBets());
  }, []);

  useEffect(() => {
    fetchLiveGames();
    syncTrackedBets();

    const interval = setInterval(() => {
      fetchLiveGames();
      syncTrackedBets();
    }, 4500);

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

  return (
    <SportsDataContext.Provider
      value={{
        games,
        trackedBets,
        isLoading,
        lastSyncTimestamp,
        refreshLiveData: fetchLiveGames,
        getGameById,
        getGameByMatchup,
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
